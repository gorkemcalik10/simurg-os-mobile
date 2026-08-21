'use strict';

const assert = require('node:assert/strict');
const sleepIntelligence = require('../simurg-sleep-intelligence.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function sleep(date, overrides = {}) {
  const previous = addDays(date, -1);
  return {
    date,
    startTime: `${previous}T22:30:00+03:00`,
    endTime: `${date}T06:30:00+03:00`,
    deepSleep: 90 * 60,
    remSleep: 90 * 60,
    lightSleep: 270 * 60,
    unrecognizedSleepStage: 30 * 60,
    interruptions: 20 * 60,
    sleepGoal: 8 * 60 * 60,
    raw: {
      short_interruption_duration: 8 * 60,
      long_interruption_duration: 12 * 60,
    },
    ...overrides,
  };
}

function dataWithHistory(date, nights = 15) {
  const data = {
    polarSleep: { daily: {} },
    polarNightlyRecharge: { daily: {} },
    polarContinuousHr: { daily: {} },
  };
  for (let i = 0; i < nights; i += 1) {
    const itemDate = addDays(date, -i);
    const previous = addDays(itemDate, -1);
    const shift = i % 3;
    data.polarSleep.daily[itemDate] = sleep(itemDate, {
      startTime: `${previous}T22:${String(28 + shift).padStart(2, '0')}:00+03:00`,
      endTime: `${itemDate}T06:${String(28 + shift).padStart(2, '0')}:00+03:00`,
      deepSleep: (85 + shift) * 60,
      remSleep: (88 + shift) * 60,
      lightSleep: (267 + shift) * 60,
    });
  }
  data.polarNightlyRecharge.daily[date] = { date, heartRateVariabilityAvg: 54 };
  data.polarContinuousHr.daily[date] = { date, samples: [{ sampleTime: '02:00', heartRate: 51 }] };
  return data;
}

run('actual sleep excludes awake, interruptions, and unknown stages', () => {
  const date = '2026-08-21';
  const data = { polarSleep: { daily: { [date]: sleep(date) } } };
  const result = sleepIntelligence.analyze(data, date);
  assert.equal(result.status, 'available');
  assert.equal(result.daily.actualSleepMinutes, 450);
  assert.equal(result.daily.timeInBedMinutes, 480);
  assert.equal(result.daily.sleepEfficiency, 93.8);
  assert.equal(result.daily.sleepDebtMinutes, 30);
  assert.equal(result.daily.sleepStages.deep.minutes, 90);
  assert.equal(result.daily.sleepStages.rem.minutes, 90);
  assert.equal(result.daily.sleepStages.light.minutes, 270);
  assert.equal(result.daily.sleepStages.awake.minutes, 20);
  assert.equal(result.daily.sleepStages.deep.percentageOfActualSleep, 20);
  assert.equal(result.daily.sleepStages.awake.percentageOfActualSleep, null);
});

run('interruption normalization preserves direct Polar evidence without inventing count or severity', () => {
  const date = '2026-08-21';
  const result = sleepIntelligence.analyze({ polarSleep: { daily: { [date]: sleep(date) } } }, date);
  assert.equal(result.daily.interruptions.awakeDurationMinutes, 20);
  assert.equal(result.daily.interruptions.interruptionCount, null);
  assert.equal(result.daily.interruptions.severity.classification, null);
  assert.equal(result.daily.interruptions.severity.shortDurationMinutes, 8);
  assert.equal(result.daily.interruptions.severity.longDurationMinutes, 12);
  assert.ok(result.daily.missingData.includes('interruptionCount'));
});

run('missing one required sleep stage returns insufficient without estimating', () => {
  const date = '2026-08-21';
  const row = sleep(date, { remSleep: null });
  const result = sleepIntelligence.analyze({ polarSleep: { daily: { [date]: row } } }, date);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.daily.actualSleepMinutes, null);
  assert.equal(result.daily.sleepEfficiency, null);
  assert.equal(result.daily.sleepDebtMinutes, null);
  assert.equal(result.confidence.level, 'insufficient');
  assert.equal(result.confidence.score, 0);
});

run('inconsistent stage totals never produce efficiency above one hundred', () => {
  const date = '2026-08-21';
  const row = sleep(date, { lightSleep: 330 * 60 });
  const result = sleepIntelligence.analyze({ polarSleep: { daily: { [date]: row } } }, date);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.daily.sleepEfficiency, null);
  assert.equal(result.daily.sleepDebtMinutes, null);
  assert.equal(result.daily.confidence.score, 0);
  assert.ok(result.daily.missingData.includes('sleepDurationConsistency'));
});

run('personal stage baseline and sleep timing consistency require enough history', () => {
  const date = '2026-08-21';
  const result = sleepIntelligence.analyze(dataWithHistory(date, 6), date);
  assert.ok(result.daily.sleepConsistency);
  assert.equal(result.daily.sleepConsistency.sampleSize, 6);
  assert.ok(result.daily.sleepConsistency.score >= 95);
  assert.ok(result.daily.sleepStages.baselineComparison);
  assert.equal(result.daily.sleepStages.baselineComparison.sampleSize, 5);
  assert.equal(result.daily.confidence.level, 'high');
});

run('seven, fourteen, and thirty day trends expose sample-based confidence', () => {
  const date = '2026-08-21';
  const result = sleepIntelligence.analyze(dataWithHistory(date, 15), date);
  assert.equal(result.trends.sevenDay.status, 'available');
  assert.equal(result.trends.sevenDay.sampleSize, 7);
  assert.equal(result.trends.fourteenDay.sampleSize, 14);
  assert.equal(result.trends.thirtyDay.sampleSize, 15);
  assert.equal(result.trends.thirtyDay.status, 'available');
  assert.ok(result.trends.fourteenDay.averages.actualSleepMinutes > 0);
  assert.ok(result.trends.sevenDay.confidence.reasons.length > 0);
});

run('provider reports optional source availability but never mutates DATA', () => {
  const date = '2026-08-21';
  const data = dataWithHistory(date, 6);
  const before = JSON.stringify(data);
  const result = sleepIntelligence.resolve(date, { data });
  assert.equal(result.daily.sources.nightlyRecharge, true);
  assert.equal(result.daily.sources.continuousHr, true);
  assert.equal(JSON.stringify(data), before);
  assert.equal(Object.prototype.hasOwnProperty.call(data, 'sleepIntelligence'), false);
});

run('empty Polar history returns an explicit insufficient provider result', () => {
  const result = sleepIntelligence.analyze({}, '2026-08-21');
  assert.equal(result.status, 'insufficient');
  assert.equal(result.daily.status, 'insufficient');
  assert.equal(result.confidence.score, 0);
  assert.ok(result.daily.missingData.includes('polarSleep'));
});
