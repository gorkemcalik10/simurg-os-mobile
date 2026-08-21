'use strict';

const assert = require('node:assert/strict');
const engine = require('../simurg-energy-engine.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
function sleepIntelligence(overrides = {}) {
  return { status: 'available', daily: {
    status: 'available', actualSleepMinutes: 465, timeInBedMinutes: 495,
    sleepEfficiency: 93.9, sleepDebtMinutes: 15, sleepGoalMinutes: 480,
    sleepConsistency: { score: 92 },
    sleepStages: { baselineComparison: {
      deep: { currentMinutes: 90, baselineMinutes: 88 },
      rem: { currentMinutes: 95, baselineMinutes: 92 },
      light: { currentMinutes: 280, baselineMinutes: 275 },
    } },
    confidence: { level: 'high', score: 100, reasons: [] }, missingData: [], ...overrides,
  } };
}
function nightly(date, offset = 0) {
  return { date, heartRateVariabilityAvg: 55 + offset, heartRateAvg: 54 - offset / 2,
    breathingRateAvg: 13 - offset / 20, ansCharge: 3 + offset / 10, nightlyRechargeStatus: 3 + offset / 10 };
}
function polarSleep(date) {
  return { date, startTime: `${addDays(date, -1)}T22:30:00Z`, endTime: `${date}T06:30:00Z`,
    deepSleep: 90 * 60, remSleep: 90 * 60, lightSleep: 270 * 60,
    interruptions: 20 * 60, sleepGoal: 8 * 60 * 60 };
}
function completeData(date, currentOffset = 6) {
  const data = { workouts: [], polarWorkouts: { daily: {} }, polarActivity: { daily: {} },
    polarSleep: { daily: { [date]: polarSleep(date) } },
    polarNightlyRecharge: { daily: { [date]: nightly(date, currentOffset) } }, polarCardioLoad: { daily: {} } };
  for (let i = 1; i <= 14; i += 1) {
    const day = addDays(date, -i);
    data.polarNightlyRecharge.daily[day] = nightly(day, (i % 3) - 1);
    data.polarSleep.daily[day] = polarSleep(day);
    data.polarCardioLoad.daily[day] = { date: day, cardioLoad: i === 1 ? 40 : 38 + (i % 4) };
    data.polarActivity.daily[day] = { date: day, steps: 8000 + i * 10 };
  }
  return data;
}
function addTrainingBaseline(data, date, recentRpe = 7) {
  for (let i = 1; i <= 10; i += 1) {
    data.workouts.push({ date: addDays(date, -i), exercise: 'Incline DB Press', sets: 3, reps: 8,
      weight: 22, rpe: i <= 3 ? recentRpe : 6.8 + (i % 2) * 0.2, form: 'Good', pain: 'None' });
  }
}

run('returns the requested provider contract with fixed 45/35/20 weighting', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date);
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(result.schemaVersion, 1);
  assert.equal(typeof result.score, 'number');
  assert.ok(['high', 'medium', 'low'].includes(result.status));
  assert.ok(['high', 'medium', 'low'].includes(result.confidence));
  assert.deepEqual(Object.keys(result.contributors), ['sleep', 'recovery', 'activityLoad', 'trainingLoad']);
  assert.equal(result.contributors.sleep.weight, 0.45);
  assert.equal(result.contributors.recovery.weight, 0.35);
  assert.equal(result.contributors.activityLoad.weight + result.contributors.trainingLoad.weight, 0.20);
  assert.equal(typeof result.action.trainingRecommendation, 'string');
  assert.ok(Object.prototype.hasOwnProperty.call(result.action, 'caution'));
});

run('sleep contribution uses actual sleep and never time in bed', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date);
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence({ actualSleepMinutes: 360, timeInBedMinutes: 600, sleepDebtMinutes: 120 }) });
  assert.equal(result.contributors.sleep.evidence.actualSleepMinutes, 360);
  assert.ok(result.contributors.sleep.score < 80);
  assert.match(result.contributors.sleep.reasons[0], /Gerçek uyku 6 saat/);
});

run('recovery signals are compared only with qualified personal history', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date);
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(result.contributors.recovery.status, 'available');
  assert.equal(result.contributors.recovery.signals.hrv.sampleSize, 14);
  assert.ok(result.contributors.recovery.signals.hrv.deviationPercent > 0);
  assert.ok(result.contributors.recovery.signals.nightHr.deviationPercent < 0);
  assert.match(result.contributors.recovery.reasons.join(' '), /kişisel/);
});

run('missing personal recovery baseline returns insufficient without reweighting', () => {
  const date = '2026-08-21', data = completeData(date); data.polarNightlyRecharge.daily = { [date]: nightly(date, 5) }; addTrainingBaseline(data, date);
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(result.score, null); assert.equal(result.status, 'insufficient'); assert.equal(result.confidence, 'insufficient');
  assert.ok(result.missingData.includes('hrvPersonalBaseline'));
});

run('normal recent training is not punished', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date, 6.9);
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(result.contributors.activityLoad.score, 85);
  assert.equal(result.contributors.trainingLoad.score, 85);
  assert.match(result.contributors.trainingLoad.reasons.join(' '), /cezalandırılmadı/);
});

run('high personal load warns only when recovery is also poor', () => {
  const date = '2026-08-21', good = completeData(date, 6); addTrainingBaseline(good, date);
  good.polarCardioLoad.daily[addDays(date, -1)].cardioLoad = 90;
  const supported = engine.analyze(good, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(supported.contributors.activityLoad.evidence.highLoad, true);
  assert.equal(supported.contributors.activityLoad.evidence.highLoadPoorRecovery, false);
  assert.equal(supported.action.caution, null);
  const poor = completeData(date, -14); addTrainingBaseline(poor, date); poor.polarCardioLoad.daily[addDays(date, -1)].cardioLoad = 90;
  const cautioned = engine.analyze(poor, date, { sleepIntelligence: sleepIntelligence() });
  assert.equal(cautioned.contributors.activityLoad.evidence.highLoadPoorRecovery, true);
  assert.match(cautioned.action.caution, /recovery sinyalleri zayıf/);
});

run('pain and form remain context and do not replace Coach rules', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date);
  data.workouts.find(row => row.date === addDays(date, -1)).pain = 'Mild';
  const result = engine.analyze(data, date, { sleepIntelligence: sleepIntelligence() });
  assert.match(result.action.caution, /Coach güvenlik kurallarının yerine geçmez/);
});

run('missing Sleep Intelligence returns explicit insufficient state', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date);
  const result = engine.analyze(data, date, { sleepIntelligence: { status: 'insufficient', daily: null } });
  assert.equal(result.score, null); assert.equal(result.status, 'insufficient');
  assert.ok(result.missingData.includes('sleepIntelligence.daily'));
  assert.match(result.action.trainingRecommendation, /yeterli veri yok/);
});

run('resolve reads through providers without mutating DATA', () => {
  const date = '2026-08-21', data = completeData(date); addTrainingBaseline(data, date); const before = JSON.stringify(data);
  const result = engine.resolve(date, { data });
  assert.equal(typeof result.score, 'number'); assert.equal(JSON.stringify(data), before);
  assert.equal(result.contributors.sleep.evidence.actualSleepMinutes, 450);
  assert.equal(Object.prototype.hasOwnProperty.call(data, 'energy'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(data, 'energyEngine'), false);
});
