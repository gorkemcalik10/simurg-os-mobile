'use strict';

const assert = require('node:assert/strict');
const polar = require('../simurg-polar-intelligence.js');
const coach = require('../simurg-coach-engine.js');
const fixtures = require('./simurg-coach-fixtures.js');

const clone = value => JSON.parse(JSON.stringify(value));
function run(name, fn) { try { fn(); process.stdout.write(`✓ ${name}\n`); } catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; } }
function stores() { const data = fixtures.baseData(); data.polarProfile.latest = { restingHeartRate: 41, modified: '2099-01-01' }; return data; }
function activityHistory(data, date, value = 8000) { for (let i = 1; i <= 14; i += 1) data.polarActivity.daily[fixtures.addDays(date, -i)] = { date: fixtures.addDays(date, -i), steps: value + (i % 3) * 50, activeDuration: 'PT2H10M', inactiveDuration: 'PT9H' }; }
function loadHistory(data, date, rising) { for (let i = 1; i <= 14; i += 1) { const recent = i <= 7; const value = rising ? (recent ? 70 - i : 35 - i / 2) : 40 + (i % 2); data.polarCardioLoad.daily[fixtures.addDays(date, -i)] = { date: fixtures.addDays(date, -i), cardioLoad: value, strain: value, tolerance: 45, cardioLoadRatio: value / 45 }; } }
function sleepRow(date) { return { date, startTime: fixtures.addDays(date, -1)+'T22:00:00Z', endTime: date+'T06:00:00Z', timeInBedSeconds: 8*3600, deepSleep: 80*60, remSleep: 90*60, lightSleep: 250*60, awakeTime: 40*60, sleepGoal: 8*3600 }; }

run('sparse continuous HR remains insufficient and never substitutes zero', () => {
  const date = fixtures.TODAY, data = stores();
  data.polarContinuousHr.daily[date] = { date, samples: [{ sampleTime: '10:00', heartRate: 62 }, { sampleTime: '11:00', heartRate: 66 }] };
  const result = polar.analyze(data, date).continuousHr;
  assert.equal(result.status, 'insufficient'); assert.equal(result.all.average, null); assert.equal(result.daytime.average, null); assert.equal(result.overnight.average, null);
});

run('historical analysis ignores future daily rows and undated latest profile data', () => {
  const date = fixtures.TODAY, data = stores(); activityHistory(data, date); data.polarActivity.daily[date] = { date, steps: 9000 };
  const before = polar.analyze(data, date), future = fixtures.addDays(date, 3);
  data.polarActivity.daily[future] = { date: future, steps: 100000 }; data.polarContinuousHr.latest = { averageHr: 190 }; data.polarProfile.latest = { restingHeartRate: 99 };
  assert.deepEqual(polar.analyze(data, date), before);
});

run('Polar Night HR, true resting HR, and continuous HR context remain separate', () => {
  const date = fixtures.TODAY, data = stores();
  data.polarNightlyRecharge.daily[date] = { date, heartRateAvg: 52, heartRateVariabilityAvg: 61 };
  data.polarContinuousHr.daily[date] = { date, samples: [{ sampleTime:'09:00',heartRate:70},{sampleTime:'12:00',heartRate:80},{sampleTime:'18:00',heartRate:75}] };
  const intelligence = polar.analyze(data, date), decision = coach.analyzePreWorkout(data, date);
  assert.equal(intelligence.nightly.metrics.nightHr, 52); assert.equal(intelligence.continuousHr.daytime.average, 75); assert.equal(Object.hasOwn(intelligence.continuousHr, 'restingHr'), false);
  assert.equal(decision.decisionEvidence.polar.nightHr, 52); assert.equal(decision.decisionEvidence.polar.restingHr, null);
});

run('unusually high personal activity creates conservative context', () => {
  const date = fixtures.TODAY, data = stores(); activityHistory(data, date); data.polarActivity.daily[date] = { date, steps: 15000, activeCalories: 900 };
  const result = polar.analyze(data, date); assert.equal(result.activity.classification, 'unusually_high'); assert.equal(result.activity.conservative, true); assert.ok(result.negativeDomains.includes('activity'));
  const decision = coach.analyzePreWorkout(data, date); assert.ok(decision.decisionEvidence.negativeDomains.includes('polar_activity')); assert.notEqual(decision.trainingDecision, 'progress');
});

run('unusually low activity never promotes harder training', () => {
  const date = fixtures.TODAY, data = stores(); activityHistory(data, date); data.polarActivity.daily[date] = { date, steps: 2000 };
  const result = polar.analyze(data, date); assert.equal(result.activity.classification, 'unusually_low'); assert.equal(result.activity.promotionAllowed, false); assert.equal(result.negativeDomains.includes('activity'), false);
  assert.notEqual(coach.analyzePreWorkout(data, date).trainingDecision, 'progress');
});

run('overlapping ANS and Nightly Recharge signals count as one negative domain', () => {
  const date = fixtures.TODAY, data = stores();
  for (let i=1;i<=10;i+=1) data.polarNightlyRecharge.daily[fixtures.addDays(date,-i)] = { date:fixtures.addDays(date,-i), heartRateVariabilityAvg:70, heartRateAvg:50, breathingRateAvg:13 };
  data.polarNightlyRecharge.daily[date] = { date, heartRateVariabilityAvg:42, heartRateAvg:61, breathingRateAvg:16, ansChargeStatus:-2, nightlyRechargeStatus:1 };
  const result = polar.analyze(data, date); assert.ok(result.nightly.negativeSignals.length >= 4); assert.deepEqual(result.negativeDomains, ['nightly']); assert.equal(result.nightly.domainWeight, 1);
});

run('sleep enrichment preserves actual sleep versus time in bed', () => {
  const date = fixtures.TODAY, data = stores(); data.polarSleep.daily[date] = sleepRow(date);
  const result = polar.analyze(data, date).sleep; assert.equal(result.daily.actualSleepMinutes, 420); assert.equal(result.daily.timeInBedMinutes, 480); assert.equal(result.semanticRule, 'actual_sleep_is_not_time_in_bed');
});

run('Cardio Load trajectory requires qualified recent and prior windows', () => {
  const date = fixtures.TODAY, sparse = stores();
  for (let i=1;i<=3;i+=1) sparse.polarCardioLoad.daily[fixtures.addDays(date,-i)] = { date:fixtures.addDays(date,-i), strain:80, tolerance:45 };
  assert.equal(polar.analyze(sparse,date).cardioLoad.trajectories.strain.qualified,false);
  const complete=stores(); loadHistory(complete,date,true); const trend=polar.analyze(complete,date).cardioLoad.trajectories.strain; assert.equal(trend.qualified,true); assert.equal(trend.direction,'rising');
});

run('contradictory Polar evidence remains conservative and overlap protected', () => {
  const scenario=clone(fixtures.scenarios.find(item=>item.id==='good_recovery')); activityHistory(scenario.data,scenario.date); scenario.data.polarActivity.daily[scenario.date]={date:scenario.date,steps:16000};
  const result=coach.analyzePreWorkout(scenario.data,scenario.date); assert.equal(result.decisionEvidence.contradictory,true); assert.ok(result.decisionEvidence.negativeDomains.includes('polar_activity')); assert.ok(result.decisionEvidence.positiveDomains.includes('polar_support')); assert.notEqual(result.trainingDecision,'progress');
});

run('pain and form precedence survives strong positive Polar evidence', () => {
  const scenario=clone(fixtures.scenarios.find(item=>item.id==='pain_bad_form')); activityHistory(scenario.data,scenario.date,7000); scenario.data.polarActivity.daily[scenario.date]={date:scenario.date,steps:7100};
  scenario.data.polarNightlyRecharge.daily[scenario.date].ansChargeStatus=2; scenario.data.polarNightlyRecharge.daily[scenario.date].nightlyRechargeStatus=6;
  const result=coach.analyzePreWorkout(scenario.data,scenario.date); assert.equal(result.trainingDecision,'reduce'); assert.notEqual(result.trainingDecision,'progress'); assert.match(result.warnings.join(' '),/ağrı|Ağrı/); assert.match(result.warnings.join(' '),/Form Bad/);
});
