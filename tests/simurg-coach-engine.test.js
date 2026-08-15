'use strict';

const assert = require('node:assert/strict');
const engine = require('../simurg-coach-engine.js');
const validation = require('../simurg-data-validation.js');
const fixtures = require('./simurg-coach-fixtures.js');

const byId = Object.fromEntries(fixtures.scenarios.map(scenario => [scenario.id, scenario]));

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
function assertCommonOutput(output, type) {
  for (const key of engine.OUTPUT_SCHEMA.required) assert.ok(Object.prototype.hasOwnProperty.call(output, key), `${key} missing`);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.type, type);
  assert.match(output.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(output.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(output.inputHash, /^fnv1a-[0-9a-f]{8}$/);
  assert.ok(output.readinessScore == null || (output.readinessScore >= 0 && output.readinessScore <= 100));
  assert.ok(output.confidenceScore >= 0 && output.confidenceScore <= 100);
  assert.ok(['progress','normal','controlled','reduce','recovery','rest'].includes(output.trainingDecision));
  assert.equal(typeof output.workoutGuidance.mainLifts, 'string');
  for (const key of ['keyDrivers','warnings','recoveryActions','trendInsights','comparisonNotes','missingData']) {
    assert.ok(Array.isArray(output[key]), `${key} must be an array`);
  }
  assert.match(output.medicalDisclaimer, /tıbbi teşhis/i);
}

run('seven required fixtures produce schema-valid deterministic outputs', () => {
  assert.equal(fixtures.scenarios.length, 7);
  for (const scenario of fixtures.scenarios) {
    const output = engine.analyzeDaily(scenario.data, scenario.date);
    assertCommonOutput(output, 'daily');
  }
});

run('good recovery uses personal baseline and permits only controlled progress', () => {
  const scenario = byId.good_recovery;
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assertCommonOutput(output, 'pre_workout');
  assert.ok(output.readinessScore >= 80, `score was ${output.readinessScore}`);
  assert.equal(output.trainingDecision, 'progress');
  assert.match(output.workoutGuidance.mainLifts, /\+1 tekrar|küçük yük artışı/i);
  assert.equal(output.baseline.hrv[7].sampleSize, 7);
  assert.equal(output.baseline.hrv[14].sampleSize, 14);
  assert.equal(output.baseline.hrv[28].sampleSize, 28);
  assert.equal(output.baseline.hrv[7].qualified, true);
  assert.ok(output.baseline.hrv.deviation7 > 0);
});

run('poor sleep and low HRV combine into recovery-first decision', () => {
  const scenario = byId.poor_sleep_low_hrv;
  const output = engine.analyzeDaily(scenario.data, scenario.date);
  assert.ok(output.readinessScore < 50, `score was ${output.readinessScore}`);
  assert.ok(['recovery','rest'].includes(output.trainingDecision));
  assert.match(output.keyDrivers.join(' '), /HRV|Uyku/i);
  assert.ok(output.warnings.some(item => /birden fazla/i.test(item)));
});

run('high cardio load lowers aggressiveness without inventing pain', () => {
  const scenario = byId.high_cardio_load;
  const output = engine.analyzeDaily(scenario.data, scenario.date);
  assert.ok(['reduce','recovery'].includes(output.trainingDecision));
  assert.ok(output.loadAdjustmentPercent <= -15);
  assert.ok(output.keyDrivers.some(item => /Cardio Load|Strain/i.test(item)));
  assert.ok(output.warnings.every(item => !/ağrı kaydı/i.test(item)));
});

run('pain and bad form override high readiness independently', () => {
  const scenario = byId.pain_bad_form;
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.ok(output.readinessScore >= 80, `physiological score was ${output.readinessScore}`);
  assert.equal(output.trainingDecision, 'reduce');
  assert.notEqual(output.trainingDecision, 'progress');
  assert.ok(output.warnings.some(item => /Ağrı/i.test(item)));
  assert.ok(output.warnings.some(item => /Form Bad/i.test(item)));
  assert.doesNotMatch(output.workoutGuidance.mainLifts, /\+1 tekrar|yük artışı/i);
});

run('missing Polar data lowers confidence and never recommends progression', () => {
  const scenario = byId.missing_polar;
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.equal(output.readinessScore, null);
  assert.equal(output.confidenceLabel, 'Düşük');
  assert.ok(output.confidenceScore < 55);
  assert.equal(output.trainingDecision, 'controlled');
  assert.ok(output.missingData.includes('HRV'));
  assert.ok(output.missingData.includes('Uyku süresi'));
  assert.ok(output.missingData.includes('Yeterli 7 günlük kişisel baseline'));
});

run('tennis or badminton context adds upper-limb caution', () => {
  const scenario = byId.racket_sport_day;
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.equal(output.trainingDecision, 'controlled');
  assert.ok(output.warnings.some(item => /önkol, dirsek ve omuz/i.test(item)));
  assert.match(output.workoutGuidance.mainLifts, /press\/row|önkol/i);
});

run('repeated pattern requires minimum exposed and control samples', () => {
  const scenario = byId.repeated_pattern;
  const output = engine.analyzePatterns(scenario.data, scenario.date);
  assertCommonOutput(output, 'pattern');
  const pattern = output.trendInsights.find(item => item.id === 'low_sleep_rpe');
  assert.ok(pattern, 'low_sleep_rpe pattern missing');
  assert.ok(pattern.exposedSamples >= 3);
  assert.ok(pattern.controlSamples >= 3);
  assert.equal(pattern.relationship, 'association_not_causation');
  assert.match(pattern.summary, /kesin neden değildir/i);
});

run('insufficient pattern samples return an explicit no-pattern result', () => {
  const scenario = byId.good_recovery;
  const output = engine.analyzePatterns(scenario.data, scenario.date);
  assert.equal(output.trendInsights.length, 0);
  assert.match(output.headline, /yeterli/i);
  assert.equal(output.patternAnalysis.minimumSamplesPerGroup, 3);
});

run('movement defaults and user overrides are extensible', () => {
  const data = fixtures.baseData();
  assert.equal(engine.movementCategory('Prone Y Raise', {}, data), 'stability_posture');
  assert.equal(engine.movementCategory('Single Arm Lat Pulldown', {}, data), 'main_lift');
  assert.equal(engine.movementCategory('Cable Fly', {}, data), 'accessory');
  data.exerciseLoadProfiles['incline db press'] = { coachCategory: 'Stability/Posture' };
  assert.equal(engine.movementCategory('Incline DB Press', {}, data), 'stability_posture');
  engine.ensureStore(data).settings.movementCategories['Custom Rehab Row'] = 'stability_posture';
  assert.equal(engine.movementCategory('Custom Rehab Row', {}, data), 'stability_posture');
});

run('stability-only sessions suppress a global progress decision', () => {
  const scenario = plain(byId.good_recovery);
  scenario.data.workouts = [fixtures.gymRow(scenario.date, {
    exercise: 'Prone Y Raise', bodyPart: 'Scapula', rpe: 6, form: 'Good', pain: 'None'
  })];
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.ok(output.readinessScore >= 80);
  assert.equal(output.trainingDecision, 'normal');
  assert.match(output.workoutGuidance.stabilityPosture, /agresif kilo hedefi verme/i);
});

run('pre-workout uses the latest completed Gym safety context when today is empty', () => {
  const scenario = plain(byId.good_recovery);
  scenario.data.workouts = [fixtures.gymRow(fixtures.addDays(scenario.date, -2), {
    exercise: 'Flat DB Press', rpe: 7, form: 'Bad', pain: 'Mild'
  })];
  const output = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.ok(output.readinessScore >= 80);
  assert.equal(output.trainingDecision, 'reduce');
  assert.ok(output.warnings.some(item => /Ağrı/i.test(item)));
  assert.ok(output.comparisonNotes[0].includes(fixtures.addDays(scenario.date, -2)));
});

run('daily, pre, post, weekly and pattern share one output contract', () => {
  const scenario = byId.repeated_pattern;
  const data = plain(scenario.data);
  data.workouts.push(fixtures.gymRow(fixtures.addDays(scenario.date, -20), { reps: 7, weight: 20 }));
  const outputs = [
    engine.analyzeDaily(data, scenario.date),
    engine.analyzePreWorkout(data, scenario.date),
    engine.analyzePostWorkout(data, scenario.date),
    engine.analyzeWeekly(data, scenario.date),
    engine.analyzePatterns(data, scenario.date)
  ];
  ['daily','pre_workout','post_workout','weekly','pattern'].forEach((type, index) => assertCommonOutput(outputs[index], type));
  assert.equal(outputs[3].trainingDecision, 'recovery');
  assert.equal(outputs[3].loadAdjustmentPercent, -25);
});

run('local narrative composer explains all five coach types with real signals', () => {
  const scenario = byId.good_recovery;
  const outputs = [
    engine.analyzeDaily(scenario.data, scenario.date),
    engine.analyzePreWorkout(scenario.data, scenario.date),
    engine.analyzePostWorkout(scenario.data, scenario.date),
    engine.analyzeWeekly(scenario.data, scenario.date),
    engine.analyzePatterns(scenario.data, scenario.date)
  ];
  outputs.forEach(output => {
    assert.ok(output.summary.length >= 220, `${output.type} narrative was too short`);
    assert.match(output.summary, /Analiz güveni/i);
  });
  assert.match(outputs[0].summary, /HRV 69 ms/i);
  assert.match(outputs[0].summary, /uyku süresi 8\.2 saat/i);
  assert.match(outputs[0].summary, /Cardio Load 34/i);
  assert.match(outputs[1].summary, /RPE 6\.5/i);
  assert.match(outputs[2].summary, /seans|Gym kaydı.*Polar yük/i);
  assert.match(outputs[3].summary, /yedi gün|hafta/i);
  assert.match(outputs[4].summary, /yeterli|minimum örnek/i);
});

run('local narrative variation is deterministic and does not alter safety fields', () => {
  const scenario = plain(byId.pain_bad_form);
  const first = engine.analyzePreWorkout(scenario.data, scenario.date);
  const second = engine.analyzePreWorkout(scenario.data, scenario.date);
  assert.equal(first.summary, second.summary);
  const safety = {
    trainingDecision: first.trainingDecision,
    loadAdjustmentPercent: first.loadAdjustmentPercent,
    warnings: plain(first.warnings)
  };
  const recomposed = engine.composeLocalNarrative(plain(first), {
    day: engine.extractDay(scenario.data, scenario.date)
  });
  assert.equal(recomposed.trainingDecision, safety.trainingDecision);
  assert.equal(recomposed.loadAdjustmentPercent, safety.loadAdjustmentPercent);
  assert.deepEqual(recomposed.warnings, safety.warnings);
  const other = engine.analyzePreWorkout(byId.good_recovery.data, byId.good_recovery.date);
  assert.notEqual(first.summary, other.summary);
});

run('missing data and patterns use cautious non-causal Turkish language', () => {
  const missing = engine.analyzeDaily(byId.missing_polar.data, byId.missing_polar.date);
  assert.match(missing.summary, /yeterli recovery sinyali yok|eksik olduğu için/i);
  assert.match(missing.summary, /uydurulmadı|temkinli/i);
  const pattern = engine.analyzePatterns(byId.repeated_pattern.data, byId.repeated_pattern.date);
  assert.match(pattern.summary, /olası ilişki|kesin neden|ilişkiyi kesin neden olarak sunmuyor/i);
});

run('post-workout comparison prioritizes the real previous exercise session', () => {
  const scenario = plain(byId.good_recovery);
  const previousDate = fixtures.addDays(scenario.date, -7);
  scenario.data.workouts.push(fixtures.gymRow(previousDate, { reps: 7, weight: 22.5 }));
  const output = engine.analyzePostWorkout(scenario.data, scenario.date);
  assert.match(output.comparisonNotes[0], new RegExp(`Incline DB Press: önceki ${previousDate}`));
  assert.match(output.comparisonNotes[0], /hacim \+/);
});

run('input hash is stable for the same normalized input and changes with features', () => {
  const scenario = byId.good_recovery;
  const first = engine.analyzeDaily(scenario.data, scenario.date);
  const second = engine.analyzeDaily(scenario.data, scenario.date);
  assert.equal(first.inputHash, second.inputHash);
  const changed = plain(scenario.data);
  changed.polarSleep.daily[scenario.date].sleepScore -= 10;
  assert.notEqual(engine.analyzeDaily(changed, scenario.date).inputHash, first.inputHash);
});

run('old DATA gains the store while approved exercise fields canonicalize without row loss', () => {
  const old = fixtures.baseData();
  delete old.coachIntelligence;
  old.workouts.push(fixtures.gymRow(fixtures.TODAY));
  const beforeWorkouts = JSON.stringify(old.workouts);
  const prepared = validation.prepareFull(old);
  assert.equal(prepared.data.workouts.length, old.workouts.length);
  assert.equal(prepared.data.workouts[0].exercise, old.workouts[0].exercise);
  assert.equal(prepared.data.workouts.at(-1).exercise, 'Incline DB Press');
  assert.equal(prepared.data.workouts.at(-1).bodyPart, 'Göğüs');
  assert.equal(prepared.data.workouts.at(-1).exerciseId, 'simurg-exercise-v1-incline-db-press');
  assert.deepEqual(plain(prepared.data.coachIntelligence), engine.defaultStore());
  const originalKeys = Object.keys(old).sort();
  const runtimeCopy = plain(old);
  engine.ensureStore(runtimeCopy);
  assert.equal(JSON.stringify(runtimeCopy.workouts), beforeWorkouts);
  assert.deepEqual(Object.keys(runtimeCopy).filter(key => key !== 'coachIntelligence').sort(), originalKeys);
});

run('stored coach outputs survive full DATA validation and cloud-style round trip', () => {
  const scenario = byId.good_recovery;
  const data = plain(scenario.data);
  const daily = engine.analyzeDaily(data, scenario.date);
  const weekly = engine.analyzeWeekly(data, scenario.date);
  const pattern = engine.analyzePatterns(data, scenario.date);
  engine.storeResult(data, daily);
  engine.storeResult(data, weekly);
  engine.storeResult(data, pattern);
  const prepared = validation.prepareFull(JSON.parse(JSON.stringify(data)));
  assert.equal(prepared.data.coachIntelligence.daily[scenario.date].daily.inputHash, daily.inputHash);
  assert.equal(prepared.data.coachIntelligence.weekly[scenario.date].inputHash, weekly.inputHash);
  assert.equal(prepared.data.coachIntelligence.patterns[scenario.date].inputHash, pattern.inputHash);
});

if (process.exitCode) process.exit(process.exitCode);
