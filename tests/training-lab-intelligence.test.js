const assert = require('node:assert/strict');
const library = require('../simurg-exercise-library.js');
const canonical = require('../simurg-exercise-canonicalization.js');
const volumeModel = require('../simurg-volume-model.js');
const anatomy = require('../simurg-muscle-anatomy.js');
const lab = require('../simurg-training-lab-analysis.js');

const options = { library, canonical, volumeModel, anatomy };
let passed = 0;
function run(name, fn) {
  fn();
  passed += 1;
  process.stdout.write(`✓ ${name}\n`);
}
function row(date, overrides = {}) {
  return {
    date,
    exercise: 'Incline Dumbbell Press',
    exerciseId: 'incline_dumbbell_press',
    sessionId: `session-${date}`,
    sets: 3,
    reps: 8,
    weight: 20,
    rpe: 7,
    form: 'Good',
    pain: 'None',
    ...overrides
  };
}
function intelligence(workouts, cutoff = '2026-08-23') {
  global.DATA = { workouts, exerciseLoadProfiles: {} };
  return lab.analyze(global.DATA, cutoff, options);
}

run('canonical and explicit legacy IDs keep one exercise history', () => {
  const result = intelligence([
    row('2026-08-01', { exercise: 'Incline DB Press', exerciseId: 'simurg-exercise-v1-incline-db-press' }),
    row('2026-08-08')
  ]);
  assert.equal(result.intelligence.exercises.length, 1);
  assert.equal(result.intelligence.exercises[0].exerciseId, 'incline_dumbbell_press');
  assert.equal(result.intelligence.exercises[0].sessionCount, 2);
});

run('selected-date analysis excludes future workouts and future integration records', () => {
  const data = {
    workouts: [row('2026-08-20'), row('2026-08-22', { weight: 99 })],
    polarWorkouts: { daily: { '2026-08-22': [{ date: '2026-08-22', cardioLoad: 999 }] } },
    polarSleep: { daily: { '2026-08-22': { date: '2026-08-22', sleepScore: 100 } } },
    exerciseLoadProfiles: {}
  };
  global.DATA = data;
  const result = lab.analyze(data, '2026-08-20', options);
  const item = result.intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(result.period.cutoff, '2026-08-20');
  assert.equal(result.totals.trainingDays, 1);
  assert.equal(item.lastPerformedDate, '2026-08-20');
  assert.equal(item.personalRecords.highestLoad.value, 20);
  assert.equal(Object.hasOwn(result, 'polarWorkouts'), false);
});

run('PRs use recorded load, same-load reps, session volume and total reps only', () => {
  const result = intelligence([
    row('2026-07-01', { weight: 20, reps: 8 }),
    row('2026-07-08', { weight: 20, reps: 10 }),
    row('2026-07-15', { weight: 22, reps: 7, sets: 4 })
  ]);
  const item = result.intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(item.personalRecords.highestLoad.value, 22);
  assert.deepEqual(item.personalRecords.bestRepsByLoad.find(record => record.load === 20).reps, 10);
  assert.equal(item.personalRecords.highestSessionVolume.value, 1232);
  assert.equal(item.personalRecords.highestTotalReps.value, 30);
  assert.ok(item.prEvents.some(event => event.type === 'highest_reps_same_load' && event.value === 10));
  assert.equal(Object.hasOwn(item.personalRecords, 'estimatedOneRepMax'), false);
});

run('plateau requires four comparable clean sessions with unchanged structure', () => {
  const steady = ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22'].map(date => row(date));
  assert.equal(intelligence(steady).intelligence.exerciseMap.incline_dumbbell_press.plateau.active, true);
  const changedStructure = steady.map((item, index) => index === 3 ? { ...item, sets: 4 } : item);
  assert.equal(intelligence(changedStructure).intelligence.exerciseMap.incline_dumbbell_press.plateau.reason, 'session_structure_changed');
  const pain = steady.map((item, index) => index === 3 ? { ...item, pain: 'Mild' } : item);
  assert.equal(intelligence(pain).intelligence.exerciseMap.incline_dumbbell_press.plateau.reason, 'unreliable_comparison');
});

run('pain, poor form and high RPE take presentation precedence over progression and PR facts', () => {
  const workouts = ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29', '2026-08-05']
    .map((date, index) => row(date, { weight: 20 + index }));
  workouts[5].pain = 'Mild';
  workouts[5].form = 'Poor';
  workouts[5].rpe = 9;
  const item = intelligence(workouts).intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(item.personalRecords.highestLoad.value, 25);
  assert.equal(item.caution.active, true);
  assert.equal(item.caution.pain, true);
  assert.equal(item.caution.poorForm, true);
  assert.equal(item.presentationPriority, 'caution');
});

run('progression requires two non-overlapping windows of three qualified sessions', () => {
  const fiveSessions = ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29']
    .map((date, index) => row(date, { weight: index < 3 ? 20 : 24 }));
  const insufficient = intelligence(fiveSessions).intelligence.exerciseMap.incline_dumbbell_press.progression;
  assert.equal(insufficient.classification, 'insufficient_data');
  assert.equal(insufficient.qualifiedSessions, 5);
  assert.match(insufficient.evidence, /altı güvenilir seans/);

  const sixSessions = fiveSessions.concat(row('2026-08-05', { weight: 24 }));
  const comparable = intelligence(sixSessions).intelligence.exerciseMap.incline_dumbbell_press.progression;
  assert.equal(comparable.classification, 'improving');
  assert.equal(comparable.qualifiedSessions, 6);
  assert.equal(comparable.metrics.loadPercent, 20);
});

run('same-day sessions merge caution priority and expose load, rep and volume trends', () => {
  const workouts = ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29', '2026-08-05']
    .map((date, index) => row(date, { weight: 20, reps: index < 3 ? 8 : 10 }));
  workouts.push(row('2026-08-05', { sessionId: 'z-clean', weight: 20, reps: 10 }));
  workouts.push(row('2026-08-05', { sessionId: 'a-pain', weight: 20, reps: 10, pain: 'Mild' }));
  const item = intelligence(workouts).intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(item.progression.classification, 'improving');
  assert.equal(item.progression.metrics.loadPercent, 0);
  assert.equal(item.progression.metrics.repsPercent, 25);
  assert.equal(item.progression.metrics.volumePercent, 25);
  assert.equal(item.latestContext.sessionKey, 'a-pain');
  assert.equal(item.presentationPriority, 'caution');
});

run('unilateral load semantics preserve the existing factor-of-two volume', () => {
  const workout = row('2026-08-20', {
    exercise: 'Single Arm Cable Row', exerciseId: 'single_arm_cable_row', sets: 2, reps: 10, weight: 20
  });
  const item = intelligence([workout]).intelligence.exerciseMap.single_arm_cable_row;
  assert.equal(item.recentSessions[0].preset, 'UNILATERAL_BOTH');
  assert.equal(item.recentSessions[0].volume, 800);
});

run('anatomical effective sets remain 1.0 primary and 0.5 secondary', () => {
  const result = intelligence([row('2026-08-20', { sets: 4 })], '2026-08-20');
  assert.equal(result.anatomy.muscleMap.pectoralis_major_clavicular.sets, 4);
  assert.equal(result.anatomy.muscleMap.anterior_deltoid.sets, 2);
  assert.deepEqual(result.weights, { primary: 1, secondary: 0.5 });
});

run('sparse values stay null and cannot create PR or plateau output', () => {
  const sparse = row('2026-08-20', { sets: null, reps: '', weight: undefined, rpe: '', form: '', pain: '' });
  const item = intelligence([sparse]).intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(item.recentSessions[0].sets, null);
  assert.equal(item.recentSessions[0].totalReps, null);
  assert.equal(item.recentSessions[0].maxLoad, null);
  assert.equal(item.personalRecords.highestLoad, null);
  assert.equal(item.personalRecords.highestSessionVolume, null);
  assert.equal(item.progression.classification, 'insufficient_data');
  assert.equal(item.plateau.reason, 'insufficient_data');
});

run('multiple same-day session IDs remain distinct while legacy rows share one session', () => {
  const result = intelligence([
    row('2026-08-20', { sessionId: 'morning', weight: 20 }),
    row('2026-08-20', { sessionId: 'evening', weight: 22 }),
    row('2026-08-21', { sessionId: null, setId: 'a' }),
    row('2026-08-21', { sessionId: null, setId: 'b' })
  ]);
  const sessions = result.intelligence.exerciseMap.incline_dumbbell_press.recentSessions;
  assert.equal(sessions.length, 3);
  assert.equal(sessions.filter(session => session.date === '2026-08-20').length, 2);
  assert.equal(sessions.find(session => session.date === '2026-08-21').rows.length, 2);
});

run('undated user load profiles do not enter historical comparable volume', () => {
  const workouts = [row('2026-08-20', { exercise: 'Custom Historical Press' })];
  global.DATA = { workouts, exerciseLoadProfiles: { 'custom historical press': { preset: 'DUAL_DUMBBELL' } } };
  const item = lab.analyze(global.DATA, '2026-08-20', options).intelligence.exerciseMap.incline_dumbbell_press;
  assert.equal(item.recentSessions[0].volume, null);
  assert.equal(item.recentSessions[0].comparable, false);
});

process.stdout.write(`${passed} Training Lab Intelligence tests passed.\n`);
