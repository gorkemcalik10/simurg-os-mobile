'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const coach = require('../simurg-coach-engine.js');
const client = require('../simurg-coach-client.js');
const target = require('../simurg-next-session-target.js');
const fixtures = require('./simurg-coach-fixtures.js');

const clone = value => JSON.parse(JSON.stringify(value));
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const rank = { progress: 0, normal: 1, controlled: 2, reduce: 3, recovery: 4, rest: 5 };

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function addActivity(data, date, steps, dailyActivity = steps / 100) {
  data.polarActivity.daily[date] = { date, steps, activeCalories: Math.round(steps / 20), dailyActivity };
}

function qualifiedHistory(date = fixtures.TODAY) {
  const data = fixtures.baseData();
  for (let offset = 28; offset >= 5; offset -= 1) {
    const day = fixtures.addDays(date, -offset);
    fixtures.recoveryDay(data, day, { hrv: 60, restingHr: 55, sleepMinutes: 450, sleepScore: 80, cardioLoad: 40, cardioLoadRatio: 1 });
    addActivity(data, day, 5000, 50);
  }
  return data;
}

function addSupportiveRun(data, date, currentOverrides = {}) {
  for (let offset = 4; offset >= 0; offset -= 1) {
    const day = fixtures.addDays(date, -offset);
    fixtures.recoveryDay(data, day, { hrv: 70, restingHr: 49, sleepMinutes: 500, sleepScore: 91, cardioLoad: 34, cardioLoadRatio: 0.85, ...currentOverrides });
    addActivity(data, day, 5200, 52);
  }
}

function addGymHistory(data, date, recentOverrides = {}) {
  for (let offset = 50; offset >= 15; offset -= 7) data.workouts.push(fixtures.gymRow(fixtures.addDays(date, -offset), { rpe: 6.5, weight: 20, form: 'Good', pain: 'None' }));
  [9, 6, 3].forEach(offset => data.workouts.push(fixtures.gymRow(fixtures.addDays(date, -offset), { rpe: 6.5, weight: 20, form: 'Good', pain: 'None', ...recentOverrides })));
}

run('insufficient history falls back safely and leaves unavailable ranges null', () => {
  const data = fixtures.baseData();
  fixtures.recoveryDay(data, fixtures.TODAY, { hrv: 72, restingHr: 48, sleepMinutes: 500, sleepScore: 92 });
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.equal(result.personalCalibration.status, 'insufficient');
  assert.equal(result.personalCalibration.ranges.hrv.qualified, false);
  assert.equal(result.personalCalibration.ranges.hrv.median, null);
  assert.notEqual(result.trainingDecision, 'progress');
});

run('historical calibration ignores all future dated rows', () => {
  const data = qualifiedHistory();
  fixtures.recoveryDay(data, fixtures.TODAY, { hrv: 60, restingHr: 55, sleepMinutes: 450, sleepScore: 80, cardioLoad: 40 });
  const before = coach.analyzePreWorkout(clone(data), fixtures.TODAY);
  const future = fixtures.addDays(fixtures.TODAY, 2);
  fixtures.recoveryDay(data, future, { hrv: 10, restingHr: 100, sleepMinutes: 120, sleepScore: 10, cardioLoad: 200, cardioLoadRatio: 3 });
  addActivity(data, future, 30000, 300);
  data.workouts.push(fixtures.gymRow(future, { rpe: 10, form: 'Bad', pain: 'Severe', weight: 100 }));
  const after = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.equal(after.inputHash, before.inputHash);
  assert.deepEqual(after.personalCalibration, before.personalCalibration);
});

run('one positive outlier does not promote the canonical decision', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const result = coach.analyzePreWorkout(clone(scenario.data), scenario.date);
  assert.equal(result.personalCalibration.pattern, 'temporary_positive');
  assert.equal(result.personalCalibration.progressionSupport, false);
  assert.equal(result.trainingDecision, 'normal');
});

run('sustained positive support only preserves an already allowed modest progression', () => {
  const data = qualifiedHistory();
  addSupportiveRun(data, fixtures.TODAY);
  addGymHistory(data, fixtures.TODAY);
  data.workouts.push(fixtures.gymRow(fixtures.TODAY, { rpe: 6.5, form: 'Good', pain: 'None' }));
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.equal(result.personalCalibration.pattern, 'sustained_positive');
  assert.equal(result.personalCalibration.progressionSupport, true);
  assert.equal(result.trainingDecision, 'progress');
  assert.equal(result.loadAdjustmentPercent, 0);
});

run('repeated negative recovery and load make an otherwise safe decision conservative', () => {
  const data = qualifiedHistory();
  for (let offset = 4; offset >= 0; offset -= 1) {
    const day = fixtures.addDays(fixtures.TODAY, -offset);
    fixtures.recoveryDay(data, day, { hrv: 42, restingHr: 66, sleepMinutes: 330, sleepScore: 52, cardioLoad: 82, cardioLoadRatio: 1.6 });
    addActivity(data, day, 12000, 120);
  }
  data.workouts.push(fixtures.gymRow(fixtures.TODAY, { rpe: 6.5, form: 'Good', pain: 'None' }));
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.equal(result.personalCalibration.pattern, 'repeated_negative');
  assert.ok(rank[result.trainingDecision] >= rank.reduce);
  assert.ok(result.personalCalibration.repeatedNegativeDomains.includes('recovery'));
  assert.ok(result.personalCalibration.repeatedNegativeDomains.includes('load'));
});

run('high activity plus strained recovery creates conservative context', () => {
  const data = qualifiedHistory();
  fixtures.recoveryDay(data, fixtures.TODAY, { hrv: 40, restingHr: 67, sleepMinutes: 450, sleepScore: 80, cardioLoad: 40 });
  addActivity(data, fixtures.TODAY, 15000, 150);
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.ok(result.personalCalibration.negativeDomains.includes('recovery'));
  assert.ok(result.personalCalibration.negativeDomains.includes('load'));
  assert.ok(rank[result.trainingDecision] >= rank.reduce);
});

run('low activity alone never promotes harder training', () => {
  const data = qualifiedHistory();
  fixtures.recoveryDay(data, fixtures.TODAY, { hrv: 60, restingHr: 55, sleepMinutes: 450, sleepScore: 80, cardioLoad: 40 });
  addActivity(data, fixtures.TODAY, 1000, 10);
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.equal(result.personalCalibration.positiveDomains.includes('load'), false);
  assert.notEqual(result.trainingDecision, 'progress');
});

run('Pain then Form then RPE remain ahead of excellent calibration', () => {
  const data = qualifiedHistory();
  addSupportiveRun(data, fixtures.TODAY);
  data.workouts.push(fixtures.gymRow(fixtures.TODAY, { pain: 'Mild', form: 'Bad', rpe: 9 }));
  const result = coach.analyzePreWorkout(data, fixtures.TODAY);
  assert.ok(rank[result.trainingDecision] >= rank.reduce);
  const pain = result.warnings.findIndex(item => /Ağrı kaydı/.test(item));
  const form = result.warnings.findIndex(item => /Form Bad/.test(item));
  const rpe = result.warnings.findIndex(item => /RPE 9/.test(item));
  assert.ok(pain >= 0 && form > pain && rpe > form);
});

run('planned rest stays terminal under sustained positive calibration', () => {
  const data = qualifiedHistory();
  addSupportiveRun(data, fixtures.TODAY);
  const result = coach.analyzePreWorkout(data, fixtures.TODAY, { gymPlan: { mode: 'rest', label: 'Rest Day', planned: false, skipped: false, performed: false } });
  assert.equal(result.trainingDecision, 'rest');
  assert.equal(result.loadAdjustmentPercent, -100);
});

run('overlapping Recovery and Polar nightly evidence counts as one domain', () => {
  const data = qualifiedHistory();
  fixtures.recoveryDay(data, fixtures.TODAY, { hrv: 60, restingHr: 55, sleepMinutes: 450, sleepScore: 80, cardioLoad: 40 });
  const result = coach.analyzePreWorkout(data, fixtures.TODAY, {
    recoveryIntelligence: { date: fixtures.TODAY, score: 30, status: 'strained', confidence: 90, signals: { positive: [], negative: ['Strained recovery.'] }, missingData: [], action: { caution: 'Avoid progression.' } },
    polarIntelligence: { date: fixtures.TODAY, status: 'available', negativeDomains: ['nightly'], positiveDomains: [], compact: [] }
  });
  assert.deepEqual(result.decisionEvidence.negativeDomains.filter(domain => domain === 'recovery'), ['recovery']);
  assert.equal(result.decisionEvidence.negativeDomains.includes('physiology'), false);
  assert.equal(result.decisionEvidence.negativeDomains.includes('polar_nightly'), false);
  assert.deepEqual(result.personalCalibration.negativeDomains.filter(domain => domain === 'recovery'), ['recovery']);
});

run('all user-facing decision surfaces remain tied to one resolved decision', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  client.invalidate();
  const canonical = client.resolveDecision(scenario.date, { data: clone(scenario.data), store: false });
  const recommendation = target.recommend([{ date: scenario.date, rows: [{ weight: 20, reps: 8, rpe: 7, form: 'Good', pain: 'None' }] }], { coachDecision: canonical });
  assert.equal(canonical.type, 'pre_workout');
  assert.equal(recommendation.label, 'Hedefi koru');
  for (const file of ['simurg-coach-ui.js', 'premium-standard.js', 'mobile-ia-premium.js', 'index.html']) assert.match(read(file), /resolveDecision|canonicalDecision/);
});

if (process.exitCode) process.exit(process.exitCode);
