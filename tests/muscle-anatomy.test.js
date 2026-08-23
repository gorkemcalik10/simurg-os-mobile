const assert = require('node:assert/strict');
const anatomy = require('../simurg-muscle-anatomy.js');
const library = require('../simurg-exercise-library.js');
const canonical = require('../simurg-exercise-canonicalization.js');
const volumeModel = require('../simurg-volume-model.js');
const lab = require('../simurg-training-lab-analysis.js');

let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }

run('anatomy metadata exposes the six high-level groups and detailed unique muscles', () => {
  assert.deepEqual(anatomy.highLevelGroups, ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']);
  assert.equal(anatomy.muscles.length, 32);
  assert.equal(new Set(anatomy.muscles.map(item => item.id)).size, 32);
  assert.equal(anatomy.muscleMap.obliques.highLevelGroup, 'Core');
  anatomy.muscles.forEach(item => {
    assert.ok(anatomy.highLevelGroups.includes(item.highLevelGroup), item.id);
    assert.ok(item.label && !item.label.includes('_'), item.id);
    assert.equal(anatomy.muscleMap[item.id], item);
  });
});

run('every anatomical muscle resolves to a precise front or back visual region', () => {
  for (const muscle of anatomy.muscles) {
    const visual = anatomy.getVisualRegion(muscle.id);
    assert.equal(visual.muscleId, muscle.id);
    assert.equal(visual.regionId, muscle.id);
    assert.ok(['front', 'back'].includes(visual.view));
  }
  assert.equal(anatomy.getVisualRegion('pectoralis_major_clavicular').view, 'front');
  assert.equal(anatomy.getVisualRegion('latissimus_dorsi').view, 'back');
  assert.equal(anatomy.getVisualRegion('unknown_muscle'), null);
});

run('exercise records can provide validated custom contribution weights', () => {
  const mapping = anatomy.getExerciseMapping({
    primaryMuscles: [{ muscleId: 'latissimus_dorsi', weight: 0.9 }],
    secondaryMuscles: ['posterior_deltoid', { muscleId: 'biceps_brachii', weight: 0.4 }, { muscleId: 'unknown', weight: 1 }]
  });
  assert.deepEqual(mapping.primaryMuscles, [{ muscleId: 'latissimus_dorsi', weight: 0.9 }]);
  assert.deepEqual(mapping.secondaryMuscles, [
    { muscleId: 'posterior_deltoid', weight: 0.5 },
    { muscleId: 'biceps_brachii', weight: 0.4 }
  ]);
  assert.equal(anatomy.getExerciseMapping({ primaryMuscles: [{ muscleId: 'latissimus_dorsi', weight: 1.2 }] }), null);
});

run('resolved library records expose their anatomical mapping without changing workout identity', () => {
  const resolved = lab.resolveExercise({ exercise: 'Incline DB Press', exerciseId: 'incline_dumbbell_press' }, { anatomy, library, canonical, volumeModel });
  assert.equal(resolved.id, 'incline_dumbbell_press');
  assert.deepEqual(resolved.primaryMuscles, [{ muscleId: 'pectoralis_major_clavicular', weight: 1 }]);
  assert.equal(resolved.secondaryMuscles.find(item => item.muscleId === 'anterior_deltoid').weight, 0.5);
});

run('exercise mappings use explicit weighted primary and secondary arrays', () => {
  const mapping = anatomy.getExerciseMapping('incline_machine_press');
  assert.deepEqual(mapping.primaryMuscles, [{ muscleId: 'pectoralis_major_clavicular', weight: 1 }]);
  assert.deepEqual(mapping.secondaryMuscles, [
    { muscleId: 'anterior_deltoid', weight: 0.5 },
    { muscleId: 'triceps_long_head', weight: 0.5 },
    { muscleId: 'triceps_lateral_head', weight: 0.5 },
    { muscleId: 'triceps_medial_head', weight: 0.5 }
  ]);
  for (const candidate of Object.values(anatomy.exerciseMappings)) {
    for (const item of [...candidate.primaryMuscles, ...candidate.secondaryMuscles]) assert.ok(anatomy.muscleMap[item.muscleId]);
  }
});

run('four incline machine press sets calculate effective anatomical workload', () => {
  const result = anatomy.calculateEffectiveWorkload('incline_machine_press', 4);
  assert.equal(result.muscleMap.pectoralis_major_clavicular.effectiveSets, 4);
  assert.equal(result.muscleMap.anterior_deltoid.effectiveSets, 2);
  assert.equal(result.muscleMap.triceps_long_head.effectiveSets, 2);
  assert.equal(result.highLevelGroups.Chest, 4);
  assert.equal(result.highLevelGroups.Shoulders, 2);
  assert.equal(result.highLevelGroups.Arms, 2, 'multiple triceps heads must not multiply the Arms total');
});

run('lat pulldown includes weighted rear-deltoid contribution', () => {
  const result = anatomy.calculateEffectiveWorkload('lat_pulldown', 4);
  assert.equal(result.muscleMap.latissimus_dorsi.effectiveSets, 4);
  assert.equal(result.muscleMap.biceps_brachii.effectiveSets, 2);
  assert.equal(result.muscleMap.posterior_deltoid.effectiveSets, 2);
});

run('unknown exercises fail closed at the anatomical layer', () => {
  const result = anatomy.calculateEffectiveWorkload('custom-mystery-lift', 4);
  assert.equal(result.mapped, false);
  assert.deepEqual(result.muscles, []);
  assert.equal(Object.keys(result.highLevelGroups).length, 0);
});

run('Training Lab exposes detailed workload while preserving legacy category fallback', () => {
  global.DATA = { workouts: [] };
  const options = { anatomy, library, canonical, volumeModel };
  const data = { workouts: [
    { date: '2026-08-17', exercise: 'Incline Machine Press', exerciseId: 'incline_machine_press', sets: 4, reps: 10, weight: 30 },
    { date: '2026-08-18', exercise: 'Conventional Deadlift', exerciseId: 'conventional_deadlift', sets: 3, reps: 5, weight: 80 }
  ] };
  const result = lab.analyze(data, '2026-08-17', options);
  assert.equal(result.anatomy.muscleMap.pectoralis_major_clavicular.sets, 4);
  assert.equal(result.anatomy.muscleMap.pectoralis_major_clavicular.label, 'Pectoralis Major Clavicular');
  assert.equal(result.anatomy.muscleMap.anterior_deltoid.sets, 2);
  assert.equal(result.anatomy.highLevelGroupMap.Arms.sets, 2);
  assert.equal(result.anatomy.muscleMap.anterior_deltoid.exerciseContributions[0].role, 'secondary');
  assert.equal(result.anatomy.muscleMap.anterior_deltoid.exerciseContributions[0].weight, 0.5);
  assert.equal(result.anatomy.muscleMap.anterior_deltoid.exerciseContributions[0].effectiveSets, 2);
  const pressContribution = result.anatomy.exerciseContributions.find(item => item.exerciseId === 'incline_machine_press');
  assert.equal(pressContribution.muscles.find(item => item.muscleId === 'pectoralis_major_clavicular').role, 'primary');
  assert.equal(pressContribution.muscles.find(item => item.muscleId === 'anterior_deltoid').effectiveSets, 2);
  assert.equal(result.anatomy.highLevelGroupMap.Legs.fallbackSets, 3);
  assert.deepEqual(result.anatomy.fallbackExercises.map(item => item.exerciseId), ['conventional_deadlift']);
  assert.equal(result.groupMap.Chest.sets, 4);
  assert.equal(result.groupMap.Legs.sets, 3);
});

run('legacy combined superset identities remain unmapped and receive no anatomy fallback', () => {
  const options = { anatomy, library, canonical, volumeModel };
  const result = lab.analyze({ workouts: [{
    date: '2026-08-17', exercise: 'Incline DB Curl / Rope Pushdown Superset',
    exerciseId: 'simurg-exercise-v1-incline-db-curl-rope-pushdown-superset', sets: 4, reps: 10, weight: 10
  }] }, '2026-08-17', options);
  assert.equal(result.unmapped.length, 1);
  assert.equal(result.anatomy.fallbackExercises.length, 0);
  assert.ok(result.anatomy.muscles.every(item => item.sets === 0));
});

process.stdout.write(`${passed} anatomical muscle engine tests passed.\n`);
