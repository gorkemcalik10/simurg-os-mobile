'use strict';

const assert = require('node:assert/strict');
const recovery = require('../simurg-recovery-intelligence.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10);
}
function nightly(date, values = {}) {
  return { date, heartRateVariabilityAvg: 55, heartRateAvg: 55, breathingRateAvg: 13,
    ansCharge: 3, nightlyRechargeStatus: 3, ...values };
}
function sleep(date, charge = 3) {
  return { date, startTime: `${addDays(date, -1)}T22:30:00Z`, endTime: `${date}T06:30:00Z`,
    deepSleep: 90 * 60, remSleep: 90 * 60, lightSleep: 270 * 60, interruptions: 20 * 60,
    sleepGoal: 8 * 60 * 60, sleepCharge: charge };
}
function completeData(date, nights = 7) {
  const data = { polarSleep: { daily: {} }, polarNightlyRecharge: { daily: {} }, polarCardioLoad: { daily: {} } };
  data.polarNightlyRecharge.daily[date] = nightly(date, { heartRateVariabilityAvg: 64, heartRateAvg: 50, ansCharge: 4, nightlyRechargeStatus: 4 });
  data.polarSleep.daily[date] = sleep(date, 4);
  for (let i = 1; i <= nights; i += 1) {
    const day = addDays(date, -i), shift = (i % 3) - 1;
    data.polarNightlyRecharge.daily[day] = nightly(day, { heartRateVariabilityAvg: 55 + shift, heartRateAvg: 55 + shift / 2, breathingRateAvg: 13 + shift / 20, ansCharge: 3 + shift / 10, nightlyRechargeStatus: 3 + shift / 10 });
    data.polarSleep.daily[day] = sleep(day, 3 + shift / 10);
    data.polarCardioLoad.daily[day] = { date: day, cardioLoad: i === 1 ? 40 : 39 + (i % 3) };
  }
  return data;
}

run('mirrors the canonical Recovery score instead of calculating a second score', () => {
  const date = '2026-08-21', data = completeData(date);
  const result = recovery.analyze(data, date, { canonicalRecovery: { score: 78 } });
  assert.equal(result.score, 78);
  assert.equal(result.status, 'positive');
  assert.ok(result.confidence > 0);
  assert.deepEqual(Object.keys(result.contributors), ['ansCharge', 'hrv', 'nightHr', 'breathing', 'sleepCharge', 'recentLoad']);
  assert.ok(result.signals.positive.some(signal => /HRV/.test(signal)));
  assert.equal(result.contributors.sleepCharge.sleepIntelligence.status, 'available');
});

run('five valid personal nights are mandatory for core overnight signals', () => {
  const date = '2026-08-21', data = completeData(date, 4);
  const result = recovery.analyze(data, date, { canonicalRecovery: { score: 90 } });
  assert.equal(result.score, null);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.confidence, 0);
  assert.ok(result.missingData.includes('hrvPersonalBaseline'));
});

run('the same HRV value is interpreted against each user personal baseline', () => {
  const date = '2026-08-21', above = completeData(date), below = completeData(date);
  above.polarNightlyRecharge.daily[date].heartRateVariabilityAvg = 60;
  below.polarNightlyRecharge.daily[date].heartRateVariabilityAvg = 60;
  for (let i = 1; i <= 7; i += 1) below.polarNightlyRecharge.daily[addDays(date, -i)].heartRateVariabilityAvg = 70 + (i % 2);
  const aboveResult = recovery.analyze(above, date, { canonicalRecovery: 75 });
  const belowResult = recovery.analyze(below, date, { canonicalRecovery: 75 });
  assert.equal(aboveResult.contributors.hrv.status, 'positive');
  assert.equal(belowResult.contributors.hrv.status, 'negative');
});

run('missing canonical score stays null while evidence remains available', () => {
  const date = '2026-08-21', result = recovery.analyze(completeData(date), date);
  assert.equal(result.score, null);
  assert.notEqual(result.status, 'insufficient');
  assert.ok(result.missingData.includes('canonicalRecoveryScore'));
});

run('provider never mutates DATA', () => {
  const date = '2026-08-21', data = completeData(date), before = JSON.stringify(data);
  const result = recovery.resolve(date, { data, canonicalRecovery: { score: 82 } });
  assert.equal(result.score, 82);
  assert.equal(JSON.stringify(data), before);
  assert.equal(Object.prototype.hasOwnProperty.call(data, 'recoveryIntelligence'), false);
});

if (process.exitCode) process.exit(process.exitCode);
