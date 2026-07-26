const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const client = require('../simurg-coach-client.js');
const fixtures = require('./simurg-coach-fixtures.js');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
async function run(name, fn) {
  try { await fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => clone(body) };
}
function auth(session, refresh) {
  return {
    getSession: async () => session,
    getClient: () => ({
      auth: {
        refreshSession: async () => refresh ? refresh() : { data: { session: null }, error: new Error('refresh unavailable') }
      }
    })
  };
}
function localResult(scenario, type = 'daily') {
  return client.resolve(type, scenario.date, { data: scenario.data, remote: false });
}
function remoteOptions(overrides = {}) {
  return {
    auth: auth({ access_token: 'browser-session-token' }),
    supabaseUrl: 'https://example.supabase.co',
    publishableKey: 'sb_publishable_browser_safe',
    timeoutMs: 50,
    ...overrides
  };
}
function aiDisabledFetch(calls) {
  return async (_url, options) => {
    calls.push(options);
    const payload = JSON.parse(options.body);
    return response(503, { ok: false, error: 'ai_disabled', deterministic: payload });
  };
}

(async () => {
  await run('keyless client treats ai_disabled as normal deterministic mode', () => {
    const scenario = clone(fixtures.scenarios[0]);
    client.invalidate({ remote: true });
    const result = localResult(scenario);
    assert.equal(result.narrative.aiStatus, 'ai_disabled');
    assert.equal(result.narrative.mode, 'deterministic');
    assert.equal(result.narrative.source, 'SimurgCoachEngine');
    assert.ok(result.headline);
    assert.ok(result.trainingDecision);
  });

  await run('same input hash is served from memory cache', () => {
    const scenario = clone(fixtures.scenarios[1]);
    client.invalidate({ remote: true });
    const first = localResult(scenario);
    const second = localResult(scenario);
    assert.equal(first.inputHash, second.inputHash);
    assert.equal(second.narrative.cacheStatus, 'memory_hit');
  });

  await run('changed input creates a different cache identity', () => {
    const scenario = clone(fixtures.scenarios[0]);
    client.invalidate({ remote: true });
    const first = localResult(scenario);
    scenario.data.polarSleep.daily[scenario.date].sleepScore = 42;
    const second = localResult(scenario);
    assert.notEqual(first.inputHash, second.inputHash);
    assert.equal(second.narrative.cacheStatus, 'miss');
  });

  await run('stored result is reused across memory invalidation', () => {
    const scenario = clone(fixtures.scenarios[2]);
    client.invalidate({ remote: true });
    const first = localResult(scenario, 'weekly');
    client.invalidate();
    const second = localResult(scenario, 'weekly');
    assert.equal(first.inputHash, second.inputHash);
    assert.equal(second.narrative.cacheStatus, 'store_hit');
  });

  await run('client store extension preserves legacy DATA records', () => {
    const scenario = clone(fixtures.scenarios[4]);
    scenario.data.legacyMarker = { accepted: true };
    const before = JSON.stringify(scenario.data.workouts);
    client.resolve('pre_workout', scenario.date, { data: scenario.data, remote: false });
    assert.equal(JSON.stringify(scenario.data.workouts), before);
    assert.deepEqual(scenario.data.legacyMarker, { accepted: true });
    assert.ok(scenario.data.coachIntelligence.daily[scenario.date].pre_workout);
  });

  await run('signed-out client skips the function and keeps local analysis', async () => {
    const scenario = clone(fixtures.scenarios[0]);
    const result = localResult(scenario);
    let calls = 0;
    client.invalidate({ remote: true });
    const remote = await client.syncRemote(result, remoteOptions({
      auth: auth(null),
      fetchImpl: async () => { calls += 1; throw new Error('must not run'); }
    }));
    assert.equal(remote.status, 'local_only');
    assert.equal(remote.reason, 'no_session');
    assert.equal(calls, 0);
    assert.ok(result.headline);
  });

  await run('permanent local mode makes no background function request by default', async () => {
    const scenario = clone(fixtures.scenarios[0]);
    let calls = 0;
    client.invalidate({ remote: true });
    const result = client.resolve('daily', scenario.date, {
      data: scenario.data,
      auth: auth({ access_token: 'browser-session-token' }),
      supabaseUrl: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_browser_safe',
      fetchImpl: async () => { calls += 1; return response(503, { error: 'ai_disabled' }); }
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(calls, 0);
    assert.equal(result.narrative.mode, 'deterministic');
    assert.equal(result.narrative.aiStatus, 'ai_disabled');
  });

  await run('authenticated ai_disabled response is a silent deterministic fallback', async () => {
    const scenario = clone(fixtures.scenarios[0]);
    const result = localResult(scenario);
    const before = clone(result);
    const calls = [];
    client.invalidate({ remote: true });
    const remote = await client.syncRemote(result, remoteOptions({ fetchImpl: aiDisabledFetch(calls) }));
    assert.equal(remote.status, 'ai_disabled');
    assert.equal(remote.reason, 'expected');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].headers.Authorization, 'Bearer browser-session-token');
    assert.equal(calls[0].headers.apikey, 'sb_publishable_browser_safe');
    assert.deepEqual(result, before);
  });

  await run('expired session refreshes exactly once and then falls back locally', async () => {
    const scenario = clone(fixtures.scenarios[1]);
    const result = localResult(scenario);
    let calls = 0;
    let refreshes = 0;
    const refreshAuth = auth(
      { access_token: 'expired-session-token' },
      () => {
        refreshes += 1;
        return { data: { session: { access_token: 'refreshed-session-token' } }, error: null };
      }
    );
    client.invalidate({ remote: true });
    const remote = await client.syncRemote(result, remoteOptions({
      auth: refreshAuth,
      fetchImpl: async (_url, options) => {
        calls += 1;
        if (calls === 1) return response(401, { error: 'unauthorized' });
        return response(503, { error: 'ai_disabled', deterministic: JSON.parse(options.body) });
      }
    }));
    assert.equal(remote.status, 'ai_disabled');
    assert.equal(calls, 2);
    assert.equal(refreshes, 1);
  });

  await run('offline network and invalid response keep the local result intact', async () => {
    const scenario = clone(fixtures.scenarios[2]);
    const result = localResult(scenario);
    const before = clone(result);
    client.invalidate({ remote: true });
    const offline = await client.syncRemote(result, remoteOptions({
      fetchImpl: async () => { throw new Error('offline'); }
    }));
    assert.equal(offline.status, 'local_fallback');
    assert.equal(offline.reason, 'network');
    client.invalidate({ remote: true });
    const broken = await client.syncRemote(result, remoteOptions({
      fetchImpl: async () => response(200, { result: { headline: 'broken' } })
    }));
    assert.equal(broken.status, 'local_fallback');
    assert.equal(broken.reason, 'invalid_response');
    assert.deepEqual(result, before);
  });

  await run('same inputHash avoids duplicate calls while changed data calls again', async () => {
    const scenario = clone(fixtures.scenarios[0]);
    const first = localResult(scenario);
    const calls = [];
    client.invalidate({ remote: true });
    const options = remoteOptions({ fetchImpl: aiDisabledFetch(calls) });
    const firstRemote = await client.syncRemote(first, options);
    const cachedRemote = await client.syncRemote(first, options);
    assert.equal(firstRemote.cacheStatus, 'miss');
    assert.equal(cachedRemote.cacheStatus, 'hit');
    assert.equal(calls.length, 1);
    scenario.data.polarSleep.daily[scenario.date].sleepScore = 41;
    const changed = localResult(scenario);
    assert.notEqual(changed.inputHash, first.inputHash);
    await client.syncRemote(changed, options);
    assert.equal(calls.length, 2);
  });

  await run('normalized request payload excludes all prohibited identity and raw fields', async () => {
    const scenario = clone(fixtures.scenarios[0]);
    scenario.data.user_id = 'must-not-leak';
    scenario.data.profile = { email: 'must-not-leak@example.test' };
    const result = localResult(scenario);
    const payload = client.buildPayload(result);
    const serialized = JSON.stringify(payload);
    assert.doesNotMatch(serialized, /polarRaw|accessToken|refreshToken|user_id|userId|email|birthDate|birthday|profile|hrvSamples|heartRateSeries|breathingSamples|\"DATA\"/i);
    assert.equal(payload.trainingDecision, result.trainingDecision);
    assert.equal(payload.loadAdjustmentPercent, result.loadAdjustmentPercent);
    assert.deepEqual(payload.warnings, result.warnings);
    assert.deepEqual(Object.keys(payload).sort(), [
      'confidenceLabel', 'confidenceScore', 'date', 'headline', 'inputHash', 'keyDrivers',
      'loadAdjustmentPercent', 'missingData', 'readinessScore', 'readinessStatus',
      'schemaVersion', 'summary', 'trainingDecision', 'trendInsights', 'type',
      'warnings', 'workoutGuidance'
    ]);
  });

  await run('spoofed or failing remote responses cannot change deterministic safety', async () => {
    const scenario = clone(fixtures.scenarios[3]);
    const result = localResult(scenario);
    const safety = {
      trainingDecision: result.trainingDecision,
      loadAdjustmentPercent: result.loadAdjustmentPercent,
      warnings: clone(result.warnings)
    };
    client.invalidate({ remote: true });
    const spoofed = await client.syncRemote(result, remoteOptions({
      fetchImpl: async (_url, options) => {
        const payload = JSON.parse(options.body);
        return response(503, {
          error: 'ai_disabled',
          deterministic: { ...payload, trainingDecision: 'progress', loadAdjustmentPercent: 50, warnings: [] }
        });
      }
    }));
    assert.equal(spoofed.status, 'local_fallback');
    assert.equal(spoofed.reason, 'invalid_response');
    assert.equal(result.trainingDecision, safety.trainingDecision);
    assert.equal(result.loadAdjustmentPercent, safety.loadAdjustmentPercent);
    assert.deepEqual(result.warnings, safety.warnings);
  });

  await run('Coach surfaces remain bound only to local resolve output and local badge', () => {
    const root = path.resolve(__dirname, '..');
    const ui = fs.readFileSync(path.join(root, 'simurg-coach-ui.js'), 'utf8');
    const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
    const desktop = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');
    assert.match(ui, /Yerel güvenli analiz/);
    assert.match(ui, /SimurgCoachClient\.resolve/);
    assert.doesNotMatch(ui + premium + desktop, /local_fallback|invalid_response|remote_available|connection_error/i);
  });

  await run('frontend bridge has no OpenAI or privileged credential path', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'simurg-coach-client.js'), 'utf8');
    assert.match(source, /functions\/v1\/simurg-coach/);
    assert.match(source, /refreshSession/);
    assert.doesNotMatch(source, /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE|SUPABASE_SECRET|sk-proj-|api\.openai\.com|openai\.com\/v1/i);
    assert.doesNotMatch(source, /console\.(?:log|info|debug|warn|error)/);
  });

  if (process.exitCode) process.exit(process.exitCode);
})();
