const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const client = require('../simurg-coach-client.js');
const fixtures = require('./simurg-coach-fixtures.js');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('keyless client treats ai_disabled as normal deterministic mode', () => {
  const scenario = clone(fixtures.scenarios[0]);
  client.invalidate();
  const result = client.resolve('daily', scenario.date, { data: scenario.data });
  assert.equal(result.narrative.aiStatus, 'ai_disabled');
  assert.equal(result.narrative.mode, 'deterministic');
  assert.equal(result.narrative.source, 'SimurgCoachEngine');
  assert.ok(result.headline);
  assert.ok(result.trainingDecision);
});

run('same input hash is served from memory cache', () => {
  const scenario = clone(fixtures.scenarios[1]);
  client.invalidate();
  const first = client.resolve('daily', scenario.date, { data: scenario.data });
  const second = client.resolve('daily', scenario.date, { data: scenario.data });
  assert.equal(first.inputHash, second.inputHash);
  assert.equal(second.narrative.cacheStatus, 'memory_hit');
});

run('changed input creates a different cache identity', () => {
  const scenario = clone(fixtures.scenarios[0]);
  client.invalidate();
  const first = client.resolve('daily', scenario.date, { data: scenario.data });
  scenario.data.polarSleep.daily[scenario.date].sleepScore = 42;
  const second = client.resolve('daily', scenario.date, { data: scenario.data });
  assert.notEqual(first.inputHash, second.inputHash);
  assert.equal(second.narrative.cacheStatus, 'miss');
});

run('stored result is reused across memory invalidation', () => {
  const scenario = clone(fixtures.scenarios[2]);
  client.invalidate();
  const first = client.resolve('weekly', scenario.date, { data: scenario.data });
  client.invalidate();
  const second = client.resolve('weekly', scenario.date, { data: scenario.data });
  assert.equal(first.inputHash, second.inputHash);
  assert.equal(second.narrative.cacheStatus, 'store_hit');
});

run('client store extension preserves legacy DATA records', () => {
  const scenario = clone(fixtures.scenarios[4]);
  scenario.data.legacyMarker = { accepted: true };
  const before = JSON.stringify(scenario.data.workouts);
  client.resolve('pre_workout', scenario.date, { data: scenario.data });
  assert.equal(JSON.stringify(scenario.data.workouts), before);
  assert.deepEqual(scenario.data.legacyMarker, { accepted: true });
  assert.ok(scenario.data.coachIntelligence.daily[scenario.date].pre_workout);
});

run('client contains no network or credential path', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'simurg-coach-client.js'), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|supabase\.functions|OPENAI_API_KEY|Authorization/);
});

if (process.exitCode) process.exit(process.exitCode);
