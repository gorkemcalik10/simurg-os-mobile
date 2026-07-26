'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const engine = require('../simurg-coach-engine.js');
const fixtures = require('./simurg-coach-fixtures.js');

const ROOT = path.resolve(__dirname, '..');
const SECURITY_PATH = path.join(ROOT, 'supabase/functions/simurg-coach/security.mjs');
const SECURITY_SOURCE = fs.readFileSync(SECURITY_PATH, 'utf8');
const INDEX_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase/functions/simurg-coach/index.ts'), 'utf8');
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase/config.toml'), 'utf8');
const RLS_TEST_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase/tests/simurg_coach_rls.test.sql'), 'utf8');
const FRONTEND_SOURCE = [
  'index.html', 'premium-standard.js', 'desktop-alignment.js', 'simurg-coach-engine.js',
  'simurg-coach-client.js', 'simurg-coach-ui.js'
].map(file => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');

async function run(name, fn) {
  try {
    await fn();
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function request(body, token = 'valid-token') {
  const headers = { 'Content-Type': 'application/json' };
  if (token != null) headers.Authorization = `Bearer ${token}`;
  return new Request('https://example.supabase.co/functions/v1/simurg-coach', {
    method: 'POST', headers, body: JSON.stringify(body)
  });
}

(async () => {
  const security = await import(pathToFileURL(SECURITY_PATH).href);
  const fixture = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const deterministic = engine.analyzeDaily(fixture.data, fixture.date);

  await run('simurg-coach requires platform JWT verification', () => {
    assert.match(CONFIG_SOURCE, /\[functions\.simurg-coach\]\s+verify_jwt = true/);
    assert.doesNotMatch(CONFIG_SOURCE, /\[functions\.simurg-coach\]\s+verify_jwt = false/);
  });

  await run('handler derives the authenticated user only from verified bearer JWT', async () => {
    const seen = [];
    const handler = security.createCoachHandler({
      verifyToken: async token => { seen.push(token); return token === 'valid-token' ? { id: 'verified-user-a' } : null; },
      generateNarrative: async envelope => ({ headline: `Safe ${envelope.type}`, summary: 'Safe narrative' })
    });
    const response = await handler(request({ coach: deterministic }));
    assert.equal(response.status, 200);
    assert.deepEqual(seen, ['valid-token']);
    const payload = await response.json();
    assert.equal(payload.result.trainingDecision, deterministic.trainingDecision);
    assert.doesNotMatch(JSON.stringify(payload), /verified-user-a/);
  });

  await run('missing and expired sessions return 401', async () => {
    const handler = security.createCoachHandler({
      verifyToken: async token => token === 'expired-token' ? null : { id: 'verified-user' }
    });
    assert.equal((await handler(request({ coach: deterministic }, null))).status, 401);
    assert.equal((await handler(request({ coach: deterministic }, 'expired-token'))).status, 401);
  });

  await run('request user_id is rejected and never reaches narrative generation', async () => {
    let called = false;
    const handler = security.createCoachHandler({
      verifyToken: async () => ({ id: 'verified-user-a' }),
      generateNarrative: async () => { called = true; return {}; }
    });
    const response = await handler(request({ coach: deterministic, user_id: 'user-b' }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'sensitive_field_rejected');
    assert.equal(called, false);
  });

  await run('Polar raw, tokens and direct identifiers are rejected recursively', () => {
    const cases = [
      { raw: { polar: true } },
      { nested: { accessToken: 'secret' } },
      { nested: { email: 'person@example.test' } },
      { nested: { name: 'Person' } },
      { nested: { fullName: 'Person' } },
      { nested: { birthday: '1990-01-01' } },
      { nested: { supabaseUserId: 'user-a' } },
      { nested: { hrvSamples: [1, 2, 3] } },
      { nested: { heartRateSeries: [80, 81] } }
    ];
    for (const extra of cases) {
      assert.throws(
        () => security.sanitizeCoachInput({ coach: { ...deterministic, ...extra } }),
        error => error && error.code === 'sensitive_field_rejected'
      );
    }
  });

  await run('AI envelope is minimized, frozen and contains no identity or raw samples', () => {
    const safe = security.sanitizeCoachInput({ coach: deterministic });
    const envelope = security.buildNarrativeEnvelope(safe);
    const serialized = JSON.stringify(envelope);
    assert.equal(Object.isFrozen(envelope), true);
    assert.equal(Object.isFrozen(envelope.safety), true);
    assert.doesNotMatch(serialized, /user_id|userId|email|birthday|accessToken|refreshToken|polarUserId|raw|samples/i);
    assert.equal(envelope.safety.trainingDecision, deterministic.trainingDecision);
    assert.equal(envelope.safety.loadAdjustmentPercent, deterministic.loadAdjustmentPercent);
  });

  await run('malicious AI response cannot change deterministic safety fields', () => {
    const safe = security.sanitizeCoachInput({ coach: deterministic });
    const merged = security.mergeNarrative(safe, {
      headline: 'Narrative headline',
      summary: 'Narrative summary',
      trainingDecision: 'rest',
      loadAdjustmentPercent: -100,
      warnings: []
    });
    assert.equal(merged.headline, 'Narrative headline');
    assert.equal(merged.trainingDecision, safe.trainingDecision);
    assert.equal(merged.loadAdjustmentPercent, safe.loadAdjustmentPercent);
    assert.deepEqual(merged.warnings, safe.warnings);
  });

  await run('AI-disabled checkpoint returns deterministic fallback without external call', async () => {
    const handler = security.createCoachHandler({
      verifyToken: async () => ({ id: 'verified-user' })
    });
    const response = await handler(request({ coach: deterministic }));
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.error, 'ai_disabled');
    assert.equal(payload.deterministic.trainingDecision, deterministic.trainingDecision);
  });

  await run('Edge source verifies getUser and has no cross-user database query path', () => {
    assert.match(INDEX_SOURCE, /auth\.getUser\(token\)/);
    assert.doesNotMatch(INDEX_SOURCE, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
    assert.doesNotMatch(INDEX_SOURCE, /\.from\s*\(/);
    assert.doesNotMatch(INDEX_SOURCE, /user_id|userId/);
    assert.doesNotMatch(INDEX_SOURCE, /OPENAI_API_KEY|openai\.com|api\.openai/);
    assert.doesNotMatch(INDEX_SOURCE, /console\.(?:log|info|debug)\s*\(/);
    assert.doesNotMatch(SECURITY_SOURCE, /console\.(?:log|info|debug|error|warn)\s*\(/);
  });

  await run('frontend contains no OpenAI key or direct OpenAI request', () => {
    assert.doesNotMatch(FRONTEND_SOURCE, /OPENAI_API_KEY|sk-proj-|api\.openai\.com|openai\.com\/v1/i);
  });

  await run('RLS pgTAP contract covers bidirectional A/B read and update isolation', () => {
    assert.match(RLS_TEST_SOURCE, /set local role authenticated/i);
    assert.match(RLS_TEST_SOURCE, /User A cannot read User B row/i);
    assert.match(RLS_TEST_SOURCE, /User A cannot update User B row/i);
    assert.match(RLS_TEST_SOURCE, /User B data remains unchanged/i);
    assert.match(RLS_TEST_SOURCE, /User B cannot read User A row/i);
    assert.match(RLS_TEST_SOURCE, /rollback;/i);
  });

  if (process.exitCode) process.exit(process.exitCode);
})();
