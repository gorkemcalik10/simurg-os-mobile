'use strict';

const assert = require('node:assert/strict');
const coach = require('../simurg-coach-engine.js');
const fixtures = require('./simurg-coach-fixtures.js');
const byId = Object.fromEntries(fixtures.scenarios.map(scenario => [scenario.id, scenario]));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function recoveryContext(overrides = {}) {
  return { score: 81, status: 'positive', confidence: 93,
    signals: { positive: ['HRV kişisel gece aralığının üzerinde.'], negative: [] },
    action: { recommendation: 'Gece toparlanması mevcut planı destekliyor.', caution: null }, ...overrides };
}

run('Coach exposes Recovery Intelligence as context only', () => {
  const scenario = byId.good_recovery;
  const baseline = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true });
  const output = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true, recoveryIntelligenceResolver: () => recoveryContext() });
  assert.equal(output.recoveryScore, 81);
  assert.equal(output.recoveryStatus, 'positive');
  assert.deepEqual(output.recoveryReasons, ['HRV kişisel gece aralığının üzerinde.']);
  assert.deepEqual(output.recoveryAction, recoveryContext().action);
  assert.equal(output.trainingDecision, baseline.trainingDecision);
  assert.equal(output.readinessScore, baseline.readinessScore);
  assert.deepEqual(output.workoutGuidance, baseline.workoutGuidance);
  assert.deepEqual(output.warnings, baseline.warnings);
});

run('strained Recovery context cannot override Pain and Form safety', () => {
  const scenario = byId.pain_bad_form;
  const output = coach.analyzePreWorkout(scenario.data, scenario.date, {
    recoveryIntelligenceResolver: () => recoveryContext({ score: 20, status: 'strained', signals: { positive: [], negative: ['HRV düşük.', 'Gece nabzı yüksek.'] } }),
    energyResolver: () => ({ score: 99, status: 'high', confidence: 'high', reasons: [], action: {} }),
  });
  assert.equal(output.trainingDecision, 'reduce');
  assert.ok(output.warnings.some(item => /Ağrı/i.test(item)));
  assert.ok(output.warnings.some(item => /Form Bad/i.test(item)));
  assert.doesNotMatch(output.workoutGuidance.mainLifts, /\+1 tekrar|yük artışı/i);
});

run('missing provider returns explicit empty Recovery context', () => {
  const scenario = byId.good_recovery;
  const output = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true });
  assert.equal(output.recoveryScore, null);
  assert.equal(output.recoveryStatus, 'insufficient');
  assert.deepEqual(output.recoveryReasons, []);
  assert.deepEqual(output.recoveryAction, { recommendation: null, caution: null });
});

if (process.exitCode) process.exit(process.exitCode);
