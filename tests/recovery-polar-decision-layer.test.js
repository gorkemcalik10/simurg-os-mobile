'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const coach = require('../simurg-coach-engine.js');
const client = require('../simurg-coach-client.js');
const target = require('../simurg-next-session-target.js');
const fixtures = require('./simurg-coach-fixtures.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const byId = Object.fromEntries(fixtures.scenarios.map(scenario => [scenario.id, scenario]));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function positiveRecovery() {
  return {
    score: 94,
    status: 'positive',
    confidence: 94,
    signals: { positive: ['Recovery is above the personal baseline.'], negative: [] },
    missingData: [],
    action: { recommendation: 'Recovery supports the plan.', caution: null },
  };
}

function strainedRecovery() {
  return {
    score: 28,
    status: 'strained',
    confidence: 91,
    signals: { positive: [], negative: ['Recovery is below the personal baseline.'] },
    missingData: [],
    action: { recommendation: 'Use a recovery-oriented session.', caution: 'Avoid aggressive load progression.' },
  };
}

function energy(score, status) {
  return {
    score,
    status,
    confidence: 'high',
    contributors: {},
    reasons: [`Energy evidence is ${status}.`],
    missingData: [],
    action: { trainingRecommendation: 'Use the canonical Coach decision.', caution: status === 'low' ? 'Capacity evidence is low.' : null },
  };
}

run('contradictory recovery evidence resolves conservatively inside the canonical decision', () => {
  const scenario = byId.good_recovery;
  const result = coach.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: positiveRecovery(),
    energyContext: energy(34, 'low'),
  });
  assert.equal(result.decisionEvidence.role, 'evidence_context');
  assert.equal(result.decisionEvidence.contradictory, true);
  assert.ok(result.decisionEvidence.positiveDomains.includes('recovery'));
  assert.ok(result.decisionEvidence.negativeDomains.includes('energy'));
  assert.equal(result.trainingDecision, 'recovery');
});

run('partial Polar data stays null and cannot create progression evidence', () => {
  const date = fixtures.TODAY;
  const data = fixtures.baseData();
  data.polarProfile.latest = { restingHeartRate: 44 };
  data.polarNightlyRecharge.daily[date] = { date, heartRateVariabilityAvg: 61 };
  const result = coach.analyzePreWorkout(data, date);
  assert.equal(result.readinessScore, null);
  assert.equal(result.trainingDecision, 'controlled');
  assert.equal(result.decisionEvidence.polar.hrv, 61);
  assert.equal(result.decisionEvidence.polar.nightHr, null);
  assert.equal(result.decisionEvidence.polar.restingHr, null);
  assert.equal(result.decisionEvidence.polar.breathingRate, null);
  assert.equal(result.decisionEvidence.polar.cardioLoad, null);
});

run('future Polar and Gym rows do not affect a historical recovery decision', () => {
  const scenario = byId.good_recovery;
  const data = clone(scenario.data);
  data.workouts = data.workouts.filter(row => row.date <= scenario.date);
  const before = coach.analyzePreWorkout(clone(data), scenario.date);
  const futureDate = fixtures.addDays(scenario.date, 2);
  fixtures.recoveryDay(data, futureDate, { hrv: 20, restingHr: 90, sleepMinutes: 180, sleepScore: 20, cardioLoad: 150, cardioLoadRatio: 2.5 });
  data.workouts.push(fixtures.gymRow(futureDate, { rpe: 10, form: 'Bad', pain: 'Severe' }));
  const after = coach.analyzePreWorkout(data, scenario.date);
  assert.equal(after.inputHash, before.inputHash);
  assert.equal(after.trainingDecision, before.trainingDecision);
  assert.deepEqual(after.decisionEvidence, before.decisionEvidence);
});

run('planned rest remains the canonical terminal decision', () => {
  const scenario = byId.good_recovery;
  const result = coach.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: positiveRecovery(),
    energyContext: energy(95, 'high'),
    gymPlan: { mode: 'rest', label: 'Rest Day', planned: false, skipped: false, performed: false },
  });
  assert.equal(result.trainingDecision, 'rest');
  assert.equal(result.loadAdjustmentPercent, -100);
});

run('high recovery cannot bypass pain and form precedence', () => {
  const scenario = byId.pain_bad_form;
  const result = coach.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: positiveRecovery(),
    energyContext: energy(98, 'high'),
  });
  assert.equal(result.trainingDecision, 'reduce');
  assert.equal(result.decisionEvidence.recovery.status, 'positive');
  assert.notEqual(result.trainingDecision, 'progress');
});

run('low recovery reduces an otherwise safe training decision', () => {
  const scenario = byId.good_recovery;
  const result = coach.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: strainedRecovery(),
    energyContext: energy(82, 'high'),
  });
  assert.equal(result.decisionEvidence.decisionTarget, 'reduce');
  assert.equal(result.trainingDecision, 'reduce');
  assert.equal(result.loadAdjustmentPercent, -15);
});

run('Polar Night HR remains distinct from true resting HR', () => {
  const scenario = clone(byId.good_recovery);
  scenario.data.polarProfile.latest = { restingHeartRate: 41 };
  let day = coach.extractDay(scenario.data, scenario.date);
  assert.equal(day.recovery.nightHr, 51);
  assert.equal(day.recovery.restingHr, null);
  scenario.data.polarActivity.daily[scenario.date] = { date: scenario.date, restingHeartRate: 47 };
  day = coach.extractDay(scenario.data, scenario.date);
  assert.equal(day.recovery.nightHr, 51);
  assert.equal(day.recovery.restingHr, 47);
});

run('Home Coach Program and next-session surfaces consume one canonical object', () => {
  const scenario = byId.good_recovery;
  client.invalidate();
  const canonical = client.resolveDecision(scenario.date, {
    data: clone(scenario.data),
    store: false,
    engineOptions: { recoveryIntelligence: strainedRecovery(), energyContext: energy(82, 'high') },
  });
  const recommendation = target.recommend([{ date: scenario.date, rows: [{ weight: 20, reps: 8, rpe: 7, form: 'Good', pain: 'None' }] }], { coachDecision: canonical });
  assert.equal(canonical.type, 'pre_workout');
  assert.equal(canonical.trainingDecision, 'reduce');
  assert.equal(recommendation.target, '20 kg × 8');
  for (const file of ['simurg-coach-ui.js', 'premium-standard.js', 'mobile-ia-premium.js', 'index.html']) {
    assert.match(read(file), /resolveDecision|canonicalDecision/);
  }
});

if (process.exitCode) process.exit(process.exitCode);
