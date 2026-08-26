'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const guidance = require('../simurg-daily-guidance.js');
const coach = require('../simurg-coach-engine.js');
const client = require('../simurg-coach-client.js');
const fixtures = require('./simurg-coach-fixtures.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function sleepRow(date, actualMinutes, inBedMinutes = 480, goalMinutes = 480) {
  const previous = fixtures.addDays(date, -1);
  return {
    date,
    startTime: `${previous}T22:30:00Z`,
    endTime: `${date}T${String(Math.floor((22 * 60 + 30 + inBedMinutes) / 60) % 24).padStart(2, '0')}:${String((30 + inBedMinutes) % 60).padStart(2, '0')}:00Z`,
    deepSleep: actualMinutes * .2 * 60,
    remSleep: actualMinutes * .2 * 60,
    lightSleep: actualMinutes * .6 * 60,
    sleepGoal: goalMinutes * 60,
  };
}

function sleepHistory(date, nights = 7, minutes = 450) {
  const data = fixtures.baseData();
  for (let offset = nights; offset >= 1; offset -= 1) {
    const itemDate = fixtures.addDays(date, -offset);
    data.polarSleep.daily[itemDate] = sleepRow(itemDate, minutes + (offset % 2 ? 5 : -5));
  }
  return data;
}

function canonical(decision, overrides = {}) {
  return {
    type: 'pre_workout', trainingDecision: decision,
    workoutGuidance: { mainLifts: 'Canonical guidance.' }, warnings: [], keyDrivers: [],
    personalCalibration: { progressionSupport: false, reasons: [], negativeDomains: [], repeatedNegativeDomains: [] },
    decisionEvidence: { negativeDomains: [] },
    ...overrides,
  };
}

run('sufficient history produces a bounded personalized Sleep Need range', () => {
  const date = '2026-08-25';
  const data = sleepHistory(date);
  data.polarSleep.daily[date] = sleepRow(date, 390, 480, 480);
  const result = guidance.analyze(data, date, { coachDecision: canonical('normal') });
  assert.equal(result.sleepNeed.status, 'personalized');
  assert.equal(result.sleepNeed.historySampleSize, 7);
  assert.equal(result.sleepNeed.actualSleepMinutes, 390);
  assert.ok(result.sleepNeed.personalizedNeedMinutes >= 450 && result.sleepNeed.personalizedNeedMinutes <= 495);
  assert.ok(result.sleepNeed.shortfallRangeMinutes.min > 0);
  assert.match(result.sleepNeed.message, /altındasın/);
});

run('insufficient history keeps actual sleep visible and does not invent a need', () => {
  const date = '2026-08-25';
  const data = sleepHistory(date, 3);
  data.polarSleep.daily[date] = sleepRow(date, 405, 480);
  const result = guidance.analyze(data, date, { coachDecision: canonical('normal') });
  assert.equal(result.sleepNeed.status, 'insufficient');
  assert.equal(result.sleepNeed.actualSleepMinutes, 405);
  assert.equal(result.sleepNeed.personalizedNeedMinutes, null);
  assert.equal(result.sleepNeed.shortfallMinutes, null);
  assert.match(result.sleepNeed.message, /yeterli geçmiş/);
});

run('fulfilled sleep always uses actual stages and never time in bed', () => {
  const date = '2026-08-25';
  const data = sleepHistory(date);
  data.polarSleep.daily[date] = sleepRow(date, 396, 478, 450);
  const result = guidance.sleepNeed(data, date, canonical('normal'));
  assert.equal(result.actualSleepMinutes, 396);
  assert.ok(result.shortfallMinutes > 0);
});

run('one high-load outlier can add only a small bounded support margin', () => {
  const date = '2026-08-25';
  const data = sleepHistory(date);
  data.polarSleep.daily[date] = sleepRow(date, 420, 480, 450);
  const decision = canonical('controlled', {
    personalCalibration: { progressionSupport: false, reasons: [], negativeDomains: ['load'], repeatedNegativeDomains: [] },
    decisionEvidence: { negativeDomains: ['load'] },
  });
  const result = guidance.sleepNeed(data, date, decision);
  assert.equal(result.contextAdjustmentMinutes, 15);
  assert.ok(result.personalizedNeedMinutes <= 495);
});

run('historical Sleep Need ignores every future-dated sleep row', () => {
  const date = '2026-08-20';
  const data = sleepHistory(date);
  data.polarSleep.daily[date] = sleepRow(date, 405, 480, 450);
  const before = guidance.sleepNeed(clone(data), date, canonical('normal'));
  data.polarSleep.daily['2026-08-21'] = sleepRow('2026-08-21', 600, 630, 600);
  data.polarSleep.daily['2026-08-22'] = sleepRow('2026-08-22', 180, 480, 480);
  const after = guidance.sleepNeed(data, date, canonical('normal'));
  assert.deepEqual(after, before);
});

run('training target is a direct conservative translation of the canonical decision', () => {
  assert.equal(guidance.trainingTarget(canonical('normal')).title, 'Mevcut hedefi koru');
  assert.equal(guidance.trainingTarget(canonical('controlled')).title, 'İlk setlere kontrollü başla');
  assert.equal(guidance.trainingTarget(canonical('reduce')).title, 'Bugün hacmi biraz azalt');
  assert.equal(guidance.trainingTarget(canonical('recovery')).title, 'Toparlanma odaklı gün');
  assert.equal(guidance.trainingTarget(canonical('rest')).title, 'Bugün dinlen');
  assert.equal(guidance.trainingTarget(canonical('progress')).title, 'Mevcut hedefi koru');
  assert.match(guidance.trainingTarget(canonical('progress', { personalCalibration: { progressionSupport: true, reasons: [] } })).title, /mütevazı ilerlemeyi/);
});

run('planned rest remains terminal through canonical Coach and Daily Guidance', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const decision = coach.analyzePreWorkout(clone(scenario.data), scenario.date, { gymPlan: { mode: 'rest', label: 'Rest Day', planned: false, skipped: false, performed: false } });
  assert.equal(decision.trainingDecision, 'rest');
  assert.equal(guidance.trainingTarget(decision).title, 'Bugün dinlen');
});

run('Pain and poor Form override positive physiology before Daily Guidance translates it', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'pain_bad_form');
  const decision = coach.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: { score: 100, status: 'positive', signals: { positive: ['Strong recovery evidence'] } },
    energyContext: { score: 100, status: 'high', confidence: 'high', reasons: ['Strong energy evidence'] },
  });
  assert.equal(decision.trainingDecision, 'reduce');
  assert.equal(guidance.trainingTarget(decision).title, 'Bugün hacmi biraz azalt');
  assert.ok(decision.warnings.findIndex(item => /Ağrı/.test(item)) < decision.warnings.findIndex(item => /Form Bad/.test(item)));
});

run('high-risk RPE remains conservative despite positive physiology', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const data = clone(scenario.data);
  data.workouts.forEach(row => { if (row.date === scenario.date) row.rpe = 9.5; });
  const decision = coach.analyzePreWorkout(data, scenario.date, {
    recoveryIntelligence: { score: 100, status: 'positive', signals: { positive: ['Strong recovery evidence'] } },
    energyContext: { score: 100, status: 'high', confidence: 'high', reasons: ['Strong energy evidence'] },
  });
  assert.ok(['reduce', 'recovery', 'rest'].includes(decision.trainingDecision));
  assert.doesNotMatch(guidance.trainingTarget(decision).title, /ilerleme|ilerlemeyi/);
});

run('missing values stay insufficient and the provider never persists or creates a score', () => {
  const data = fixtures.baseData();
  const before = JSON.stringify(data);
  const result = guidance.analyze(data, '2026-08-25', { coachDecision: null });
  assert.equal(result.status, 'insufficient');
  assert.equal(result.sleepNeed.actualSleepMinutes, null);
  assert.equal(result.sleepNeed.personalizedNeedMinutes, null);
  assert.equal(JSON.stringify(data), before);
  assert.equal(Object.keys(result).some(key => /score/i.test(key)), false);
});

run('Home consumes one resolved Coach object and keeps the guidance card compact', () => {
  const premium = read('premium-standard.js');
  const css = read('premium-standard.css');
  const card = premium.slice(premium.indexOf('function dailyStatusCard'), premium.indexOf('function evidenceItem'));
  assert.match(card, /coach=canonicalCoach\(model\.selectedDate\)/);
  assert.match(card, /SimurgDailyGuidance\.resolve\(model\.selectedDate,\{data:model\.data,coachDecision:coach\}\)/);
  assert.equal((card.match(/canonicalCoach\(/g) || []).length, 1);
  assert.match(card, /gp-daily-guidance/);
  assert.match(css, /\.gp-daily-guidance\{[^}]*grid-template-columns:minmax\(0,1\.15fr\) minmax\(138px,\.85fr\)/);
  assert.match(css, /@media\(max-width:360px\)[\s\S]*\.gp-guidance-sleep\{[^}]*border-left:0/);
  for (const file of ['simurg-coach-ui.js', 'mobile-ia-premium.js', 'index.html']) assert.match(read(file), /resolveDecision|canonicalDecision/);
});

run('resolveDecision remains the only decision source and repeated negative history stays conservative', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'repeated_pattern');
  const decision = client.resolveDecision(scenario.date, { data: clone(scenario.data), store: false });
  const result = guidance.analyze(scenario.data, scenario.date, { coachDecision: decision });
  assert.equal(result.decisionSource, 'SimurgCoachClient.resolveDecision/pre_workout');
  assert.equal(result.trainingTarget.decision, decision.trainingDecision);
  assert.notEqual(result.trainingTarget.decision, 'progress');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'trainingDecision'), false);
});

if (process.exitCode) process.exit(process.exitCode);
