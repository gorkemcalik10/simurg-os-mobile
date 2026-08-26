const assert = require('node:assert/strict');
const library = require('../simurg-exercise-library.js');
const canonical = require('../simurg-exercise-canonicalization.js');
const volumeModel = require('../simurg-volume-model.js');
const lab = require('../simurg-training-lab-analysis.js');

let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }
const options = { library, canonical, volumeModel };
function row(date, exercise, exerciseId, overrides = {}) {
  return { date, exercise, exerciseId, sets: 1, reps: 8, weight: 20, ...overrides };
}

run('canonical Library identities map to their declared muscle metadata', () => {
  const resolved = lab.resolveExercise(row('2026-08-17', 'Incline Dumbbell Press', 'incline_dumbbell_press'), options);
  assert.equal(resolved.id, 'incline_dumbbell_press');
  assert.equal(resolved.primaryMuscle, 'Upper Chest');
  assert.deepEqual(resolved.secondaryMuscles, ['Triceps', 'Front Delts']);
});

run('legacy canonical IDs remain recognized without fuzzy matching', () => {
  const legacy = lab.resolveExercise(row('2026-08-17', 'Old display value', 'simurg-exercise-v1-incline-db-press'), options);
  assert.equal(legacy.id, 'incline_dumbbell_press');
  assert.equal(lab.resolveExercise(row('2026-08-17', 'Saeted Cable Row', 'unknown-id'), options), null);
});

run('five requested canonical identities use only their explicit Library metadata bridges', () => {
  const expected = [
    ['Cable Kick Back', 'simurg-exercise-v1-cable-kick-back', 'single_arm_cable_triceps_extension', 'Triceps', []],
    ['DB Reverse Fly', 'simurg-exercise-v1-db-reverse-fly', 'bent_over_dumbbell_reverse_fly', 'Rear Delts', ['Upper Back']],
    ['High Row', 'simurg-exercise-v1-high-row', 'hammer_strength_high_row', 'Upper Back', ['Lats', 'Biceps', 'Rear Delts']],
    ['Lat Pulldown Supinated', 'simurg-exercise-v1-lat-pulldown-supinated', 'lat_pulldown', 'Lats', ['Biceps', 'Rear Delts']],
    ['Seated Single Arm Cable Row', 'simurg-exercise-v1-seated-single-arm-cable-row', 'single_arm_cable_row', 'Lats', ['Biceps', 'Mid Back']]
  ];
  assert.equal(Object.keys(lab.metadataBridges).length, 5);
  expected.forEach(([name, exerciseId, metadataSourceId, primaryMuscle, secondaryMuscles]) => {
    const resolved = lab.resolveExercise(row('2026-08-17', name, exerciseId), options);
    assert.equal(resolved.id, exerciseId);
    assert.equal(resolved.name, name);
    assert.equal(resolved.metadataSourceId, metadataSourceId);
    assert.equal(resolved.primaryMuscle, primaryMuscle);
    assert.deepEqual(resolved.secondaryMuscles, secondaryMuscles);
  });
});

run('legacy combined supersets stay unmatched and excluded from workload', () => {
  const names = [
    'Incline DB Curl / Rope Pushdown Superset',
    'Rope Pushdown / Incline DB Curl Superset'
  ];
  const data = { workouts: names.map((name, index) => row('2026-08-17', name, index === 0
    ? 'simurg-exercise-v1-incline-db-curl-rope-pushdown-superset'
    : 'simurg-exercise-v1-rope-pushdown-incline-db-curl-superset')) };
  names.forEach((name, index) => assert.equal(lab.resolveExercise(data.workouts[index], options), null, name));
  const result = lab.analyze(data, '2026-08-17', options);
  assert.deepEqual(result.unmapped.map(item => item.name).sort(), names.slice().sort());
  assert.equal(result.totals.sets, 0);
  assert.ok(result.groups.every(group => group.sets === 0));
});

run('primary and secondary weights are explicit and same-group regions do not double count', () => {
  assert.deepEqual(lab.weights, { primary: 1, secondary: 0.5 });
  const press = lab.contributionsFor(library.getById('incline_dumbbell_press'));
  assert.deepEqual(Object.fromEntries(press.map(item => [item.group, item.weight])), { Chest: 1, Triceps: 0.5, Shoulders: 0.5 });
  const rowContributions = lab.contributionsFor(library.getById('seated_cable_row'));
  assert.equal(rowContributions.find(item => item.group === 'Back').weight, 1);
  assert.equal(rowContributions.filter(item => item.group === 'Back').length, 1);
});

run('weekly sets, reps, volume, frequency and exercise contribution aggregate from workouts', () => {
  global.DATA = { workouts: [] };
  const data = { workouts: [
    row('2026-08-17', 'Incline DB Press', 'simurg-exercise-v1-incline-db-press', { sets: 3, reps: 10, weight: 20 }),
    row('2026-08-20', 'Incline DB Press', 'simurg-exercise-v1-incline-db-press', { sets: 2, reps: 8, weight: 22 }),
    row('2026-08-18', 'Lat Pulldown', 'simurg-exercise-v1-lat-pulldown', { sets: 4, reps: 8, weight: 50 })
  ] };
  const result = lab.analyze(data, '2026-08-20', options);
  const chest = result.groupMap.Chest;
  assert.equal(chest.sets, 5);
  assert.equal(chest.reps, 46);
  assert.equal(chest.volume, 1904); // Dumbbell profile counts both implements.
  assert.equal(chest.frequency, 2);
  assert.equal(chest.exerciseContributions[0].sets, 5);
  assert.equal(result.groupMap.Triceps.sets, 2.5);
  assert.equal(result.groupMap.Back.sets, 4);
  assert.equal(result.groupMap['Rear Delts'].sets, 2);
});

run('historical workout dates land in their real week and produce comparable trends', () => {
  global.DATA = { workouts: [] };
  const data = { workouts: [
    row('2026-08-10', 'Cable Fly', 'cable_fly', { sets: 2, reps: 12, weight: 10 }),
    row('2026-08-17', 'Cable Fly', 'cable_fly', { sets: 3, reps: 12, weight: 10 }),
    row('2026-08-24', 'Cable Fly', 'cable_fly', { sets: 9, reps: 12, weight: 10 })
  ] };
  const current = lab.analyze(data, '2026-08-21', options);
  assert.deepEqual(current.period, { start: '2026-08-17', end: '2026-08-23', cutoff: '2026-08-21', previousStart: '2026-08-10', previousEnd: '2026-08-16' });
  assert.equal(current.groupMap.Chest.sets, 3);
  assert.equal(current.groupMap.Chest.trend.percent, 50);
  assert.equal(lab.analyze(data, '2026-08-12', options).groupMap.Chest.sets, 2);
});

run('program-template-only days never count as completed workload', () => {
  const data = { workouts: [], customGymPrograms: { '2026-08-17': { items: [['Incline DB Press', 'Chest', 4]] } }, gymDayState: { '2026-08-17': { planned: true } } };
  const result = lab.analyze(data, '2026-08-17', options);
  assert.equal(result.totals.sets, 0);
  assert.equal(result.totals.trainingDays, 0);
  assert.ok(result.groups.every(group => group.exerciseContributions.length === 0));
});

run('bodyweight and non-load movements keep set and rep contribution without invented kg volume', () => {
  const data = { workouts: [row('2026-08-17', 'Push-Up', 'push_up', { sets: 3, reps: 15, weight: 80 })] };
  const result = lab.analyze(data, '2026-08-17', options);
  assert.equal(result.groupMap.Chest.sets, 3);
  assert.equal(result.groupMap.Chest.reps, 45);
  assert.equal(result.groupMap.Chest.volume, 0);
  assert.equal(result.groupMap.Chest.nonVolumeSets, 3);
});

run('missing and unmapped exercises fail closed without inventing muscle data', () => {
  const data = { workouts: [row('2026-08-17', 'My Custom Mystery Lift', 'custom-mystery')] };
  const result = lab.analyze(data, '2026-08-17', options);
  assert.equal(result.unmapped.length, 1);
  assert.equal(result.unmapped[0].name, 'My Custom Mystery Lift');
  assert.equal(result.totals.sets, 0);
  assert.ok(result.groups.every(group => group.sets === 0));
});

process.stdout.write(`${passed} Training Lab analysis tests passed.\n`);
