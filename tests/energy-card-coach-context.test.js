'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const coach = require('../simurg-coach-engine.js');
const fixtures = require('./simurg-coach-fixtures.js');

const root = path.resolve(__dirname, '..');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'premium-standard.css'), 'utf8');
const byId = Object.fromEntries(fixtures.scenarios.map(scenario => [scenario.id, scenario]));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function energy(overrides = {}) {
  return {
    score: 82, status: 'high', confidence: 'high',
    contributors: { sleep: { score: 88 }, recovery: { score: 84 }, activityLoad: { score: 74 }, trainingLoad: { score: 80 } },
    reasons: ['Gerçek uyku 7.8 saat.', 'HRV kişisel ortalamanın üzerinde.'],
    action: { trainingRecommendation: 'Energy yüksek. Normal progresyon uygulanabilir.', caution: null },
    ...overrides,
  };
}

run('Home resolves Energy once in its model and renders one compact card per layout', () => {
  assert.match(premium, /energy:resolveEnergy\(date\)/);
  assert.equal((premium.match(/\+energyCard\(model\)/g) || []).length, 2);
  assert.match(premium, /SimurgEnergyEngine\.resolve\(date\)/);
  assert.match(premium, /energy\.contributors/);
  assert.match(premium, /energy\.reasons/);
  assert.match(css, /#home\.gp-home \.gp-energy-card\{[^}]*grid-template-columns:92px minmax\(0,1fr\)/);
  assert.match(css, /\.gp-energy-contributors\{[^}]*repeat\(3,minmax\(0,1fr\)\)/);
});

run('Coach output exposes Energy context without changing the safety decision', () => {
  const scenario = byId.good_recovery;
  const withoutEnergy = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true });
  const withEnergy = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true, energyResolver: () => energy() });
  assert.equal(withEnergy.energyScore, 82);
  assert.equal(withEnergy.energyStatus, 'high');
  assert.equal(withEnergy.energyConfidence, 'high');
  assert.deepEqual(withEnergy.energyReasons, energy().reasons);
  assert.deepEqual(withEnergy.energyAction, energy().action);
  assert.equal(withEnergy.trainingDecision, withoutEnergy.trainingDecision);
  assert.deepEqual(withEnergy.workoutGuidance, withoutEnergy.workoutGuidance);
  assert.deepEqual(withEnergy.warnings, withoutEnergy.warnings);
  assert.equal(withEnergy.readinessScore, withoutEnergy.readinessScore);
});

run('pain and form retain priority over high Energy context', () => {
  const scenario = byId.pain_bad_form;
  const output = coach.analyzePreWorkout(scenario.data, scenario.date, { energyResolver: () => energy({ score: 99 }) });
  assert.equal(output.energyScore, 99);
  assert.equal(output.trainingDecision, 'reduce');
  assert.ok(output.warnings.some(item => /Ağrı/i.test(item)));
  assert.ok(output.warnings.some(item => /Form Bad/i.test(item)));
  assert.doesNotMatch(output.workoutGuidance.mainLifts, /\+1 tekrar|yük artışı/i);
});

run('missing Energy provider remains explicit and does not invent context', () => {
  const scenario = byId.good_recovery;
  const output = coach.analyzeDaily(scenario.data, scenario.date, { deferTechnical: true });
  assert.equal(output.energyScore, null);
  assert.equal(output.energyStatus, 'insufficient');
  assert.equal(output.energyConfidence, 'insufficient');
  assert.deepEqual(output.energyReasons, []);
  assert.deepEqual(output.energyAction, { trainingRecommendation: null, caution: null });
});

if (process.exitCode) process.exit(process.exitCode);
