const assert = require('node:assert/strict');
const validation = require('../simurg-data-validation.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function base() {
  return {
    schemaVersion: 1,
    workouts: [], metrics: [], nutrition: [], recovery: [], appleWatch: [], dailyNotes: [], weeklyNotes: [],
    customGymPrograms: {}, programNames: {}, exerciseLoadProfiles: {},
    polarWorkouts: { daily: {}, latest: null },
    polarActivity: { daily: {}, latest: null },
    polarProfile: { latest: null },
    polarSleep: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarNightlyRecharge: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarContinuousHr: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarCardioLoad: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarConnection: { connected: false, status: 'disconnected', lastSyncAt: null, lastError: null, source: 'Polar AccessLink' }
  };
}
function rejects(fn, code) {
  assert.throws(fn, error => error && error.name === 'SimurgDataValidationError' && (!code || error.code === code));
}

run('valid current backup is accepted without losing safe unknown fields', () => {
  const input = base();
  input.futureSafeNamespace = { label: 'Göğüs & Omuz — İyi Form, Ağrı Yok' };
  input.exerciseLoadProfiles['incline db press'] = { preset: 'DUAL_DUMBBELL', updatedAt: '2026-07-24T10:00:00.000Z' };
  input.workouts.push({ date: '2026-07-23', exercise: 'Incline DB Press', sets: 3, reps: 8, weight: 20 });
  const result = validation.prepareFull(input);
  assert.equal(result.data.workouts[0].exercise, 'Incline DB Press');
  assert.deepEqual(result.data.exerciseLoadProfiles, input.exerciseLoadProfiles);
  assert.deepEqual(result.data.futureSafeNamespace, input.futureSafeNamespace);
  assert.ok(result.warnings.some(warning => warning.includes('futureSafeNamespace')));
});

run('valid old backup is migrated and missing critical defaults are repaired', () => {
  const old = {
    workouts: [{ date: '2026-07-23', exercise: 'Row', sets: '3', reps: '8', weight: '20,5' }],
    recoveryEntries: { '2026-07-22': { hrvMs: 50, restingHr: 60 } },
    polarSleep: { daily: { '2026-07-22': { sleepScore: 70 } }, latest: { sleepScore: 70 }, lastSyncAt: null, lastError: null }
  };
  const result = validation.prepareFull(old);
  assert.equal(result.fromVersion, 0);
  assert.equal(result.data.schemaVersion, 1);
  assert.equal(result.data.workouts[0].weight, 20.5);
  assert.deepEqual(result.data.polarWorkouts.daily, {});
  assert.deepEqual(result.data.appleWatch, []);
  assert.equal(result.data.recoveryEntries['2026-07-22'].date, '2026-07-22');
  assert.equal(result.data.polarSleep.daily['2026-07-22'].date, '2026-07-22');
  assert.equal(result.data.polarSleep.latest.date, '2026-07-22');
});

run('malformed JSON and invalid full-restore roots are rejected', () => {
  rejects(() => validation.prepareFullText('{bad'), 'malformed_json');
  for (const value of [null, 7, 'DATA', [], true]) rejects(() => validation.prepareFull(value), 'invalid_root');
});

run('wrong critical namespace types and corrupt workout records are rejected', () => {
  const wrong = base(); wrong.workouts = {};
  assert.throws(() => validation.prepareFull(wrong));
  const corrupt = base(); corrupt.workouts = [{ date: 'not-a-date', exercise: 'Row', sets: 1, reps: 8, weight: 20 }];
  rejects(() => validation.prepareFull(corrupt), 'invalid_date');
  const infinite = base(); infinite.workouts = [{ date: '2026-07-23', exercise: 'Row', sets: 1, reps: 8, weight: Infinity }];
  rejects(() => validation.prepareFull(infinite), 'non_finite_number');
});

run('corrupt Polar records are rejected while real history shape is preserved', () => {
  const valid = base();
  valid.polarSleep.daily['2026-07-23'] = { date: '2026-07-23', sleepScore: 72, nested: { providerField: 'kept' } };
  valid.polarWorkouts.daily['2026-07-23'] = [{
    date: '2026-07-23', type: 'polar_flow_workout', source: 'Polar Flow',
    startTime: '09:30', activityType: 'FUNCTIONAL_TRAINING', avgHR: 112
  }];
  assert.deepEqual(validation.prepareFull(valid).data.polarSleep.daily['2026-07-23'].nested, { providerField: 'kept' });
  const corrupt = base();
  corrupt.polarWorkouts.daily['bad-date'] = [{ date: 'bad-date', type: 'polar_flow_workout' }];
  rejects(() => validation.prepareFull(corrupt), 'invalid_date');
  const missingIdentity = base();
  missingIdentity.polarWorkouts.daily['2026-07-23'] = [{ date: '2026-07-23', startTime: '09:30' }];
  rejects(() => validation.prepareFull(missingIdentity), 'invalid_polar_record');
});

run('prototype-pollution keys are rejected at every nesting level', () => {
  const payloads = [
    '{"__proto__":{"polluted":true}}',
    '{"safe":{"prototype":{"polluted":true}}}',
    '{"safe":[{"deeper":{"constructor":{"polluted":true}}}]}'
  ];
  payloads.forEach(raw => rejects(() => validation.prepareFullText(raw), 'blocked_key'));
  assert.equal({}.polluted, undefined);
});

run('excessive depth and payload size are rejected', () => {
  let deep = {}; let cursor = deep;
  for (let i = 0; i < 35; i += 1) { cursor.next = {}; cursor = cursor.next; }
  rejects(() => validation.prepareFull(deep), 'too_deep');
  const oversized = base(); oversized.safe = 'x'.repeat(2048);
  rejects(() => validation.prepareFull(oversized, { limits: { maxBytes: 1024 } }), 'payload_too_large');
});

run('append staging does not mutate original DATA on validation failure', () => {
  const original = base();
  const originalRaw = JSON.stringify(original);
  assert.throws(() => validation.stageAppend(original, candidate => {
    candidate.workouts.push({ date: 'invalid', exercise: 'Row', sets: 1, reps: 8, weight: 20 });
  }));
  assert.equal(JSON.stringify(original), originalRaw);
});

run('valid append routes preserve Polar and workout history', () => {
  const original = base();
  original.polarSleep.daily['2026-07-22'] = { date: '2026-07-22', sleepScore: 70 };
  const workout = { type: 'polar_flow_workout', source: 'Polar Flow', date: '2026-07-23', startTime: '09:30', avgHR: 112 };
  const staged = validation.stageAppend(original, candidate => validation.routeImport(candidate, workout));
  assert.equal(staged.data.polarWorkouts.daily['2026-07-23'].length, 1);
  assert.equal(staged.data.polarWorkouts.latest.startTime, '09:30');
  assert.equal(staged.data.polarSleep.daily['2026-07-22'].sleepScore, 70);
  assert.equal(original.polarWorkouts.daily['2026-07-23'], undefined);
});

run('Polar append upserts stable IDs and preserves collision-safe legacy fallback', () => {
  const candidate = base();
  const first = { type: 'polar_flow_workout', date: '2026-08-16', polarExerciseId: 'polar-a', startTime: '08:00', duration: '00:08:08', activityType: 'Fitness', cardioLoad: 7 };
  validation.appendPolarWorkout(candidate, first);
  validation.appendPolarWorkout(candidate, { ...first, startTime: '08:00:00', cardioLoad: 8 });
  let rows = candidate.polarWorkouts.daily['2026-08-16'];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cardioLoad, 8);
  validation.appendPolarWorkout(candidate, { ...first, polarExerciseId: 'polar-b', cardioLoad: 9 });
  rows = candidate.polarWorkouts.daily['2026-08-16'];
  assert.equal(rows.length, 2);

  const legacy = { type: 'polar_flow_workout', date: '2026-08-17', startTime: '09:30', duration: '00:45:00', activityType: 'Running', avgHR: 120 };
  validation.appendPolarWorkout(candidate, legacy);
  validation.appendPolarWorkout(candidate, { ...legacy, avgHR: 125 });
  assert.equal(candidate.polarWorkouts.daily['2026-08-17'].length, 1);
  assert.equal(candidate.polarWorkouts.daily['2026-08-17'][0].avgHR, 125);
});

run('Polar workout validation preserves normalized loads, interpretations and raw payload', () => {
  const row = validation.validatePolarWorkoutRecord({
    type: 'polar_flow_workout', date: '2026-08-18', polarExerciseId: 'polar-load', activityType: 'Fitness',
    cardioLoad: 0, muscleLoad: 12.5, perceivedLoad: 7,
    cardioLoadInterpretation: 'low', muscleLoadInterpretation: 'moderate', perceivedLoadInterpretation: 'high',
    raw: { id: 'polar-load', training_load_pro: { 'cardio-load': 0, muscle_load: 12.5 } },
  }, '$.polar', { coerce: true });
  assert.equal(row.cardioLoad, 0);
  assert.equal(row.muscleLoad, 12.5);
  assert.equal(row.raw.training_load_pro['cardio-load'], 0);
});

run('Polar unavailable load sentinels normalize without discarding startup workout history', () => {
  const input = base();
  const date = '2026-08-20';
  input.workouts.push(
    { date, exercise: 'Incline DB Press', sets: 1, reps: 8, weight: 20 },
    { date, exercise: 'Single Arm Cable Row', sets: 1, reps: 10, weight: 25 },
  );
  input.polarWorkouts.daily[date] = [{
    date, type: 'polar_flow_workout', source: 'Polar Flow', activityType: 'Fitness', muscleLoad: -1,
  }];
  input.polarWorkouts.latest = input.polarWorkouts.daily[date][0];

  const startup = validation.prepareFullText(JSON.stringify(input), { source: 'startup-local-storage' }).data;
  assert.equal(startup.polarWorkouts.daily[date][0].muscleLoad, null);
  assert.equal(startup.polarWorkouts.latest.muscleLoad, null);
  assert.equal(startup.workouts.length, 2);
  assert.deepEqual(startup.workouts.map(row => row.exercise), input.workouts.map(row => row.exercise));
});

run('Cloud Pull and JSON restore share the Polar sentinel normalization', () => {
  const input = base();
  input.workouts.push({ date: '2026-08-20', exercise: 'Face Pull', sets: 1, reps: 12, weight: 15 });
  input.polarWorkouts.daily['2026-08-20'] = [{
    date: '2026-08-20', type: 'polar_flow_workout', source: 'Polar Flow', activityType: 'Fitness',
    cardioLoad: -1, muscleLoad: -1, perceivedLoad: -1,
  }];

  for (const source of ['authenticated-cloud-pull', 'full-file-restore']) {
    const restored = validation.prepareFull(JSON.parse(JSON.stringify(input)), { source }).data;
    const row = restored.polarWorkouts.daily['2026-08-20'][0];
    assert.equal(row.cardioLoad, null, source);
    assert.equal(row.muscleLoad, null, source);
    assert.equal(row.perceivedLoad, null, source);
    assert.equal(restored.workouts.length, 1, source);
  }
});

run('negative Polar loads other than the unavailable sentinel remain invalid', () => {
  const input = base();
  input.polarWorkouts.daily['2026-08-20'] = [{
    date: '2026-08-20', type: 'polar_flow_workout', source: 'Polar Flow', activityType: 'Fitness', muscleLoad: -2,
  }];
  rejects(() => validation.prepareFull(input), 'number_too_small');
});

run('invalid Cloud-style payload is rejected without changing local object', () => {
  const local = base();
  local.workouts.push({ date: '2026-07-23', exercise: 'Row', sets: 3, reps: 8, weight: 20 });
  const before = JSON.stringify(local);
  const invalidCloud = JSON.parse('{"workouts":[],"nested":{"constructor":{"x":1}}}');
  rejects(() => validation.prepareFull(invalidCloud), 'blocked_key');
  assert.equal(JSON.stringify(local), before);
});

if (process.exitCode) process.exit(process.exitCode);
