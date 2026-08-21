const assert = require('node:assert/strict');
const canonical = require('../simurg-exercise-canonicalization.js');
const catalog = require('../simurg-exercise-catalog.js');
const persistence = require('../simurg-persistence.js');
const validation = require('../simurg-data-validation.js');

let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }
function row(date, exercise, exerciseId, bodyPart, marker) {
  return {
    date, exercise, exerciseId, bodyPart, sets: 1, reps: 8, weight: 20,
    rpe: 7, form: 'Good', pain: 'None', notes: `note-${marker}`,
    sessionId: `session-${marker}`, setId: `set-${marker}`, customMetadata: { marker }
  };
}
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    failKey: '',
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { if (this.failKey === key) { const error = new Error('full'); error.name = 'QuotaExceededError'; throw error; } values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    raw(key) { return values.get(key); }
  };
}

run('approved map has 29 unique canonical names and stable IDs', () => {
  assert.equal(canonical.definitions.length, 29);
  assert.equal(new Set(canonical.definitions.map(item => item.name)).size, 29);
  assert.equal(new Set(canonical.definitions.map(item => item.exerciseId)).size, 29);
  canonical.definitions.forEach(item => assert.match(item.exerciseId, /^simurg-exercise-v1-[a-z0-9-]+$/));
});

run('approved Library IDs resolve to the same canonical identity without fuzzy inference', () => {
  assert.equal(Object.keys(canonical.libraryIdAliases).length, 22);
  Object.entries(canonical.libraryIdAliases).forEach(([libraryId, legacyId]) => {
    assert.equal(canonical.canonicalId(libraryId), legacyId);
    assert.equal(canonical.idsMatch(libraryId, legacyId), true);
    assert.deepEqual(new Set(canonical.identityIds(libraryId)), new Set([legacyId, libraryId]));
  });
  assert.equal(canonical.idsMatch('machine_chest_press', 'incline_machine_press'), false);
  assert.equal(canonical.idsMatch('single_arm_cable_row', 'seated_cable_row'), false);
  assert.equal(canonical.canonicalId('unmapped_custom_id'), 'unmapped_custom_id');
});

run('Library ID workout rows canonicalize without changing row count or unrelated fields', () => {
  const data = { workouts: [row('2026-08-01', 'Incline Dumbbell Press', 'incline_dumbbell_press', 'Chest', 'library')] };
  const report = canonical.canonicalize(data);
  assert.equal(report.rowCountBefore, 1);
  assert.equal(report.rowCountAfter, 1);
  assert.equal(data.workouts[0].exerciseId, 'simurg-exercise-v1-incline-db-press');
  assert.equal(data.workouts[0].exercise, 'Incline DB Press');
  assert.equal(data.workouts[0].customMetadata.marker, 'library');
});

run('every approved alias maps exactly and no spelling similarity is inferred', () => {
  canonical.definitions.forEach(definition => definition.aliases.forEach(alias => assert.equal(canonical.resolve(alias), definition)));
  for (const value of ['face pull', 'Face  Pull', 'Saeted Cable Row', 'Chest Press', 'Hammer Strength Row']) assert.equal(canonical.resolve(value), null);
});

run('all workout aliases receive canonical metadata with no row or non-exercise data loss', () => {
  const workouts = [];
  let marker = 0;
  canonical.definitions.forEach(definition => definition.aliases.forEach(alias => {
    marker += 1;
    workouts.push(row(`2026-07-${String((marker % 27) + 1).padStart(2, '0')}`, alias, `legacy-${marker}`, marker % 2 ? 'Wrong' : '', marker));
  }));
  const unrelated = row('2026-08-01', 'Chest Press Machine Iso-Lateral', 'keep-id', 'Custom', 'unrelated');
  workouts.push(unrelated);
  const data = { workouts, exerciseCatalog: {}, customGymPrograms: {}, autoNextTargets: {}, exerciseLoadProfiles: {} };
  const before = JSON.parse(JSON.stringify(data.workouts));
  const report = canonical.canonicalize(data);
  assert.equal(data.workouts.length, before.length);
  assert.equal(report.rowCountBefore, report.rowCountAfter);
  data.workouts.slice(0, -1).forEach((item, index) => {
    const definition = canonical.resolve(before[index].exercise);
    assert.equal(item.exercise, definition.name);
    assert.equal(item.bodyPart, definition.bodyPart);
    assert.equal(item.exerciseId, definition.exerciseId);
    for (const key of ['date', 'sets', 'reps', 'weight', 'rpe', 'form', 'pain', 'notes', 'sessionId', 'setId', 'customMetadata']) assert.deepEqual(item[key], before[index][key]);
  });
  assert.deepEqual(data.workouts.at(-1), unrelated);
});

run('migration is byte-stable on its second run', () => {
  const data = { workouts: [row('2026-08-01', 'Face Pull', 'old', 'Rear Delt', 1)], exerciseCatalog: {}, customGymPrograms: {}, autoNextTargets: {}, exerciseLoadProfiles: {} };
  assert.equal(canonical.canonicalize(data).changed, true);
  const once = JSON.stringify(data);
  const second = canonical.canonicalize(data);
  assert.equal(second.changed, false);
  assert.equal(JSON.stringify(data), once);
});

run('catalog aliases merge and usage counts aggregate by canonical identity', () => {
  const definition = canonical.resolve('Lat Pull Down');
  const data = {
    workouts: [row('2026-08-01', 'Lat Pull Down', 'old-a', 'Back', 1), row('2026-08-02', 'Lat Pulldown', 'old-b', 'Back', 2)],
    exerciseCatalog: {
      'old-a': { exerciseId: 'old-a', name: 'Lat Pull Down', bodyPart: 'Back', exerciseType: 'strength', firstMetadata: true },
      'old-b': { exerciseId: 'old-b', name: 'Lat Pulldown', bodyPart: 'Wrong', secondMetadata: true }
    }, customGymPrograms: {}, autoNextTargets: {}, exerciseLoadProfiles: {}
  };
  const report = canonical.canonicalize(data);
  assert.equal(report.catalogEntriesMerged, 1);
  assert.deepEqual(Object.keys(data.exerciseCatalog), [definition.exerciseId]);
  assert.equal(data.exerciseCatalog[definition.exerciseId].firstMetadata, true);
  assert.equal(data.exerciseCatalog[definition.exerciseId].secondMetadata, true);
  const item = catalog.entries(data)[0];
  assert.equal(item.name, 'Lat Pulldown');
  assert.equal(item.bodyPart, 'Sırt');
  assert.equal(item.useCount, 2);
});

run('programs, targets, load profiles and coach categories migrate consistently', () => {
  const data = {
    workouts: [], exerciseCatalog: {},
    customGymPrograms: {
      '2026-08-01': {
        overrides: { 'Face Pull': { name: 'Face Pull', bodyPart: 'Rear Delt' } },
        extras: [{ id: 'custom-1', exerciseId: 'old', name: 'Incline Press Machine', bodyPart: 'Chest', setCount: 3 }],
        items: [['Reverse DB Curl', 'Arms', 2]]
      }
    },
    autoNextTargets: {
      'Lat Pull Down': { text: 'old', date: '2026-08-01T00:00:00Z' },
      'Lat Pulldown': { text: 'new', date: '2026-08-02T00:00:00Z' }
    },
    exerciseLoadProfiles: {
      'face pull': { preset: 'STACK_TOTAL', updatedAt: '2026-08-01T00:00:00Z' },
      'facepull': { preset: 'TOTAL_SYSTEM', updatedAt: '2026-08-02T00:00:00Z' }
    },
    coachIntelligence: { settings: { movementCategories: { 'Bench Supported Row': 'main_lift' } } }
  };
  canonical.canonicalize(data);
  const program = data.customGymPrograms['2026-08-01'];
  assert.equal(program.overrides.Facepull.name, 'Facepull');
  assert.equal(program.overrides.Facepull.bodyPart, 'Arka Omuz');
  assert.equal(program.extras[0].exerciseId, canonical.resolve('Incline Machine Press').exerciseId);
  assert.deepEqual(program.items[0].slice(0, 2), ['Reverse Cable Curl', 'Biceps']);
  assert.deepEqual(Object.keys(data.autoNextTargets), ['Lat Pulldown']);
  assert.equal(data.autoNextTargets['Lat Pulldown'].text, 'new');
  assert.deepEqual(Object.keys(data.exerciseLoadProfiles), ['facepull']);
  assert.equal(data.exerciseLoadProfiles.facepull.preset, 'TOTAL_SYSTEM');
  assert.equal(data.coachIntelligence.settings.movementCategories['Bench Supported DB Row'], 'main_lift');
});

run('intentionally distinct exercises and ordered supersets retain distinct IDs', () => {
  const names = [
    'Chest Press Machine', 'Incline Machine Press',
    'High Row', 'Hammer Strength High Row',
    'Seated Single Arm Cable Row', 'Single Arm Cable Row',
    'Incline DB Curl / Rope Pushdown (Superset)', 'Rope Pushdown / Incline DB Curl (Superset)'
  ];
  const data = { workouts: names.map((name, index) => row('2026-08-01', name, `legacy-${index}`, 'Wrong', index)), exerciseCatalog: {}, customGymPrograms: {}, autoNextTargets: {}, exerciseLoadProfiles: {} };
  canonical.canonicalize(data);
  assert.equal(new Set(data.workouts.map(item => item.exerciseId)).size, names.length);
});

run('manual new exercises are untouched and canonical ID collisions fail closed', () => {
  const custom = row('2026-08-01', 'My Custom Row', 'custom-id', 'My Group', 1);
  const data = { workouts: [custom], exerciseCatalog: {}, customGymPrograms: {}, autoNextTargets: {}, exerciseLoadProfiles: {} };
  canonical.canonicalize(data);
  assert.deepEqual(data.workouts[0], custom);
  const collision = { workouts: [row('2026-08-01', 'Unrelated Exercise', canonical.resolve('Cable Fly').exerciseId, 'Other', 2)] };
  assert.throws(() => canonical.canonicalize(collision), error => error.code === 'canonical_exercise_id_collision');
});

run('validation canonicalizes imports while retaining an explicit legacy inspection mode', () => {
  const input = { schemaVersion: 1, workouts: [row('2026-08-01', 'Incline DB Press', 'old', 'Biceps', 1)] };
  const legacy = validation.prepareFull(input, { canonicalizeExercises: false }).data;
  const migrated = validation.prepareFull(input).data;
  assert.equal(legacy.workouts[0].bodyPart, 'Biceps');
  assert.equal(legacy.workouts[0].exerciseId, 'old');
  assert.equal(migrated.workouts[0].bodyPart, 'Göğüs');
  assert.equal(migrated.workouts[0].exerciseId, canonical.resolve('Incline DB Press').exerciseId);
});

run('one-time backup precedes persistence and failed persistence rolls back both keys', () => {
  const original = { workouts: [row('2026-08-01', 'Face Pull', 'old', 'Rear Delt', 1)] };
  const migrated = canonical.prepared(original).data;
  const originalRaw = JSON.stringify(original);
  const storage = memoryStorage({ [persistence.DATA_KEY]: originalRaw });
  const success = canonical.persistWithBackup(storage, original, migrated, persistence, 'test');
  assert.equal(success.ok, true);
  assert.deepEqual(JSON.parse(storage.raw(canonical.BACKUP_KEY)).data, original);
  assert.equal(JSON.parse(storage.raw(persistence.DATA_KEY)).workouts[0].exercise, 'Facepull');

  const failing = memoryStorage({ [persistence.DATA_KEY]: originalRaw });
  failing.failKey = persistence.DATA_KEY;
  const failure = canonical.persistWithBackup(failing, original, migrated, persistence, 'test');
  assert.equal(failure.ok, false);
  assert.equal(failing.raw(persistence.DATA_KEY), originalRaw);
  assert.equal(failing.raw(canonical.BACKUP_KEY), undefined);
});

process.stdout.write(`${passed} exercise canonicalization tests passed.\n`);
