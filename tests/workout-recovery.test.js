const assert = require('node:assert/strict');
const recovery = require('../simurg-workout-recovery.js');
const persistence = require('../simurg-persistence.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function row(overrides = {}) {
  return Object.assign({
    date: '2026-08-20', day: 'Thursday', exercise: 'Incline DB Press',
    exerciseId: 'simurg-exercise-v1-incline-db-press', sets: 1, reps: 10,
    weight: 17.5, bodyPart: 'Göğüs', notes: 'Gym Mode'
  }, overrides);
}

function data(workouts = []) {
  return {
    schemaVersion: 1, workouts, metrics: [{ date: '2026-08-20', weight: '80' }],
    nutrition: [], recovery: [{ date: '2026-08-20', sleep: '8' }], appleWatch: [],
    dailyNotes: [], weeklyNotes: [], customGymPrograms: { Thursday: [{ exercise: 'Press' }] },
    programNames: { Thursday: 'Push' }, gymDayState: {},
    exerciseLoadProfiles: {}, exerciseCatalog: {},
    journal: { schemaVersion: 1, daily: {} },
    coachIntelligence: { schemaVersion: 1, daily: {}, weekly: {}, patterns: {}, aiCache: {}, settings: { movementCategories: {} } },
    polarWorkouts: { daily: {}, latest: null },
    polarActivity: { daily: {}, latest: null }, polarProfile: { latest: null },
    polarSleep: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarNightlyRecharge: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarContinuousHr: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarCardioLoad: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarConnection: { connected: false, status: 'disconnected', lastSyncAt: null, lastError: null, source: 'Polar AccessLink' }
  };
}

run('empty current DATA plus backup recovers every workout', () => {
  const backup = { workouts: [row(), row({ exercise: 'Flat DB Press', exerciseId: 'flat-db', weight: 20 })] };
  const report = recovery.simulateWorkoutMerge(data(), backup);
  assert.equal(report.currentWorkoutCount, 0);
  assert.equal(report.missingCount, 2);
  assert.equal(report.expectedWorkoutCount, 2);
  assert.equal(report.containsAugust20, true);
  assert.equal(recovery.mergeMissingWorkouts(data(), backup).data.workouts.length, 2);
});

run('duplicate matching consumes only the corresponding current row count', () => {
  const existing = row();
  const backup = { workouts: [row(), row(), row({ exercise: 'Cable Row', exerciseId: 'cable-row' })] };
  const result = recovery.mergeMissingWorkouts(data([existing]), backup);
  assert.equal(result.report.duplicateCount, 1);
  assert.equal(result.report.missingCount, 2);
  assert.equal(result.data.workouts.length, 3);
});

run('merge preserves every non-workout DATA domain', () => {
  const current = data();
  const before = JSON.parse(JSON.stringify(current));
  const merged = recovery.mergeMissingWorkouts(current, { workouts: [row()] }).data;
  delete before.workouts;
  delete merged.workouts;
  assert.deepEqual(merged, before);
});

run('validation reports date range and rejects invalid backup rows before merge', () => {
  const valid = recovery.validateWorkoutBackup({ workouts: [row({ date: '2026-06-22' }), row()] });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.dateRange, { from: '2026-06-22', to: '2026-08-20' });
  const invalid = recovery.validateWorkoutBackup({ workouts: [row(), { date: 'not-a-date' }] });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.invalidRecords.length, 1);
  assert.throws(() => recovery.mergeMissingWorkouts(data(), { workouts: [{ date: 'not-a-date' }] }), /merge durduruldu/);
});

run('public workout identity is stable across harmless object key order changes', () => {
  const first = row();
  const second = Object.fromEntries(Object.entries(first).reverse());
  assert.equal(recovery.workoutIdentity(first), recovery.workoutIdentity(second));
});

run('runtime merge creates a rollback snapshot and restores it safely', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const status = { textContent: '', dataset: {} };
  let current = data();
  global.localStorage = storage;
  global.document = { getElementById: id => id === 'workoutRecoveryStatus' ? status : null };
  global.FileReader = class {
    readAsText(file) { this.result = file.content; this.onload(); }
  };
  global.window = { SimurgPersistence: persistence, confirm: () => true };
  try {
    const runtime = recovery.installRuntime({
      getData: () => current,
      commit: candidate => { current = candidate; },
      download: () => {}
    });
    const input = { files: [{ size: 100, content: JSON.stringify({ workouts: [row()] }) }], value: 'backup.json' };
    runtime.analyze({ target: input });
    runtime.merge();
    assert.equal(current.workouts.length, 1);
    assert.ok(storage.getItem(recovery.SNAPSHOT_KEY));
    runtime.rollback();
    assert.equal(current.workouts.length, 0);
    assert.equal(storage.getItem(recovery.SNAPSHOT_KEY), null);
  } finally {
    delete global.window;
    delete global.document;
    delete global.FileReader;
    delete global.localStorage;
  }
});

if (process.exitCode) process.exit(process.exitCode);
