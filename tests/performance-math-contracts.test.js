'use strict';

const assert = require('node:assert/strict');
const activity = require('../simurg-activity-classification.js');
const engine = require('../simurg-performance-engine.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function addDays(date, amount) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
function workout(date, id, raw, options = {}) {
  const durationMinutes = options.duration === false ? undefined : options.duration ?? 60;
  const startTime = options.startTime === false ? undefined : options.startTime || '18:00';
  return { date, sessionId: id, sessionLabel: options.sessionLabel, exerciseId: `${id}-exercise`, exercise: options.exercise || 'Squat', programKey: options.family || 'strength-a', sets: options.sets || 4, reps: 8, rpe: options.rpe || raw / (durationMinutes || (options.sets || 4)), durationMinutes, startTime };
}
function addGymBaseline(data, date, values, options = {}) {
  values.forEach((raw, index) => {
    const day = addDays(date, index - values.length);
    if (options.twoSessions) {
      data.workouts.push(workout(day, `am-${index}`, raw / 2, { ...options, duration: 30, startTime: '08:00' }));
      data.workouts.push(workout(day, `pm-${index}`, raw / 2, { ...options, duration: 30, startTime: '18:00' }));
    } else data.workouts.push(workout(day, `gym-${index}`, raw, options));
  });
}
function polarSession(date, id, cardioLoad, activityType = 'Running', options = {}) { return { date, polarExerciseId: id, sessionId: options.sessionId, cardioLoad, activityType, workoutType: options.workoutType, durationMinutes: options.duration === false ? undefined : options.duration ?? 45, startTime: options.startTime === false ? undefined : options.startTime || '07:00' }; }
function addCardioDay(data, date, load, index = '') { data.polarWorkouts.daily[date] = [polarSession(date, `polar-${index || date}`, load)]; data.polarCardioLoad.daily[date] = { date, cardioLoad: load }; }
function sleepRow(date, overrides = {}) { return { date, startTime: `${addDays(date, -1)}T23:00:00Z`, endTime: `${date}T07:00:00Z`, deepSleep: 90 * 60, remSleep: 90 * 60, lightSleep: 270 * 60, sleepGoal: 8 * 60 * 60, ...overrides }; }
function readinessData(date) {
  const data = { polarSleep: { daily: {} }, polarNightlyRecharge: { daily: {} } };
  for (let offset = -5; offset <= 0; offset += 1) { const day = addDays(date, offset); data.polarSleep.daily[day] = sleepRow(day); }
  data.polarNightlyRecharge.daily[date] = { date, ansCharge: 4, ansChargeStatus: 'GOOD', nightlyRechargeStatus: 'GOOD', heartRateVariabilityAvg: 65, heartRateAvg: 50 };
  return data;
}

run('Functional Training uses the shared canonical strength classification', () => {
  for (const label of ['FUNCTIONAL_TRAINING', 'Functional Training', 'Fonksiyonel Antrenman', 'functional_training']) assert.equal(activity.key(label), 'strength');
  for (const existing of ['Strength Training', 'Fitness', 'Gym', 'Weight Training', 'Resistance', 'Circuit', 'CrossFit', 'Ağırlık']) assert.equal(activity.key(existing), 'strength');
});

run('readiness keeps Sleep Capacity and Polar ANS Charge as the only score contributors', () => {
  const date = '2026-08-21', data = readinessData(date);
  const before = engine.readiness(data, date, { currentDate: '2026-08-28' });
  assert.equal(before.status, 'available'); assert.equal(before.components.recovery, 70);
  assert.equal(before.value, Math.round(0.5625 * before.components.sleepCapacity + 0.4375 * 70)); assert.equal(before.coachEligible, false);
  data.polarNightlyRecharge.daily[date].heartRateVariabilityAvg = 5; data.polarNightlyRecharge.daily[date].heartRateAvg = 100;
  assert.equal(engine.readiness(data, date, { currentDate: '2026-08-28' }).value, before.value);
});

run('later profile sleep-goal changes cannot rewrite exact-goal historical readiness', () => {
  const date = '2026-08-21', data = readinessData(date); data.polarProfile = { latest: { sleepGoal: 7 * 60 * 60, modified: '2026-08-28T09:00:00Z' } };
  const before = engine.readiness(data, date, { currentDate: '2026-08-28' }); data.polarProfile.latest.sleepGoal = 10 * 60 * 60;
  const after = engine.readiness(data, date, { currentDate: '2026-08-28' }); assert.equal(after.value, before.value); assert.deepEqual(after.metadata.sleep, before.metadata.sleep);
});

run('duration-based Gym load uses session-RPE × reliable duration with a prior-only baseline', () => {
  const date = '2026-08-21', data = { workouts: [] }; addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]); data.workouts.push(workout(date, 'current', 240));
  data.workouts.push(workout(addDays(date, 1), 'future', 600, { duration: 60, rpe: 10 }));
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'available'); assert.equal(result.method, 'session_rpe_x_duration'); assert.equal(result.value, 70); assert.equal(result.sampleCount, 10); assert.equal(result.confidence, 'medium'); assert.equal(result.sessions[0].durationRaw, 240); assert.ok(result.baselineDates.every(item => item < date));
});

run('missing-duration Gym fallback is normalized only against fallback days', () => {
  const date = '2026-08-21', durationOnly = { workouts: [] }; addGymBaseline(durationOnly, date, [100, 120, 140, 160, 180, 200, 220, 240, 260, 280]); durationOnly.workouts.push(workout(date, 'current', 28, { duration: false, sets: 4, rpe: 7 }));
  const sparse = engine.actualLoad(durationOnly, date); assert.equal(sparse.status, 'insufficient'); assert.equal(sparse.components.gym.method, 'working_sets_x_session_rpe'); assert.equal(sparse.components.gym.sampleCount, 0);
  const fallback = { workouts: [] }; addGymBaseline(fallback, date, [12, 14, 16, 18, 20, 22, 24, 26, 30, 32], { duration: false, sets: 4 }); fallback.workouts.push(workout(date, 'current', 28, { duration: false, sets: 4, rpe: 7 }));
  const available = engine.actualLoad(fallback, date); assert.equal(available.status, 'available'); assert.equal(available.method, 'working_sets_x_session_rpe'); assert.equal(available.value, 80);
});

run('two distinct same-day Gym sessions combine raw internal load before normalization', () => {
  const date = '2026-08-21', data = { workouts: [] }; addGymBaseline(data, date, [200, 220, 240, 260, 280, 300, 320, 360, 380, 400], { twoSessions: true });
  data.workouts.push(workout(date, 'am-current', 170, { duration: 30, startTime: '08:00' })); data.workouts.push(workout(date, 'pm-current', 170, { duration: 30, startTime: '18:00' }));
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'available'); assert.equal(result.sessionCount, 2); assert.equal(result.rawValue, 340); assert.equal(result.value, 70);
});

run('cardio prefers exact-date official daily load and ranks against prior comparable cardio days', () => {
  const date = '2026-08-21', data = { polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } }; [10, 20, 30, 40, 50, 60, 70, 90, 100, 110].forEach((load, index) => addCardioDay(data, addDays(date, index - 10), load, index)); addCardioDay(data, date, 80, 'current');
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'available'); assert.equal(result.method, 'official_exact_date_daily_cardio_load'); assert.equal(result.source, 'Polar Cardio Load'); assert.equal(result.value, 70);
});

run('per-session Polar Cardio Load is summed when official daily load is unavailable', () => {
  const date = '2026-08-21', data = { polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  for (let index = 0; index < 10; index += 1) { const day = addDays(date, index - 10); data.polarWorkouts.daily[day] = [polarSession(day, `a-${index}`, 10 + index, 'Running', { startTime: '07:00' }), polarSession(day, `b-${index}`, 20 + index, 'Cycling', { startTime: '18:00' })]; }
  data.polarWorkouts.daily[date] = [polarSession(date, 'a-now', 25, 'Running'), polarSession(date, 'b-now', 25, 'Cycling', { startTime: '18:00' })];
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'available'); assert.equal(result.method, 'sum_distinct_polar_session_cardio_load'); assert.equal(result.rawValue, 50); assert.equal(result.sessionCount, 2);
});

run('a Gym session mirrored in Polar strength is counted once and is not a mixed day', () => {
  const date = '2026-08-21', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } }; addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]); data.workouts.push(workout(date, 'shared-session', 240, { startTime: '18:00' }));
  data.polarWorkouts.daily[date] = [polarSession(date, 'shared-session', 35, 'Strength training', { duration: 60, startTime: '18:00' })]; data.polarCardioLoad.daily[date] = { date, cardioLoad: 35 };
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'available'); assert.equal(result.modality, 'gym'); assert.equal(result.value, 70); assert.equal(result.components.cardio.status, 'insufficient'); assert.equal(result.deduplication.strengthPolarExcludedFromCardio, true);
});

run('shared sessionId takes priority and Functional Training is one Gym load', () => {
  const date = '2026-08-24', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]);
  data.workouts.push(workout(date, 'shared-24-aug', 240, { sessionLabel: 'Serbest Antrenman', startTime: '18:00' }));
  data.polarWorkouts.daily[date] = [polarSession(date, 'polar-24-aug', 35, 'Fonksiyonel Antrenman', { workoutType: 'Functional Training', sessionId: 'shared-24-aug', duration: 50, startTime: false })];
  data.polarCardioLoad.daily[date] = { date, cardioLoad: 35 };
  const result = engine.actualLoad(data, date);
  assert.equal(result.status, 'available'); assert.equal(result.modality, 'gym'); assert.notEqual(result.value, 100); assert.equal(result.deduplication.identityResolution, 'mirrored'); assert.equal(result.deduplication.mirroredStrengthSessions[0].method, 'shared_session_identity');
});

run('24 Aug overlapping Gym and Polar Functional Training fixture is mirrored, not Mixed/100', () => {
  const date = '2026-08-24', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300], { duration: 50 });
  data.workouts.push(workout(date, 'gym-24-aug', 240, { sessionLabel: 'Serbest Antrenman', duration: 50, startTime: '18:00' }));
  data.polarWorkouts.daily[date] = [polarSession(date, 'polar-functional-24-aug', 35, 'Fonksiyonel Antrenman', { workoutType: 'Functional Training', duration: 50, startTime: '18:05' })];
  data.polarCardioLoad.daily[date] = { date, cardioLoad: 35 };
  const result = engine.actualLoad(data, date);
  assert.equal(result.status, 'available'); assert.equal(result.modality, 'gym'); assert.equal(result.value, 70); assert.notEqual(result.value, 100); assert.equal(result.deduplication.identityResolution, 'mirrored'); assert.equal(result.deduplication.mirroredStrengthSessions[0].method, 'overlapping_time_and_duration');
});

run('clearly separate same-day Polar strength session remains distinct and never becomes Mixed', () => {
  const date = '2026-08-24', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300], { duration: 50 });
  data.workouts.push(workout(date, 'gym-am', 240, { duration: 50, startTime: '08:00' }));
  data.polarWorkouts.daily[date] = [polarSession(date, 'polar-pm', 35, 'Strength Training', { duration: 50, startTime: '18:00' })];
  const result = engine.actualLoad(data, date);
  assert.equal(result.status, 'insufficient'); assert.equal(result.reason, 'distinct_strength_session_load_unsupported'); assert.equal(result.value, null); assert.equal(result.deduplication.identityResolution, 'distinct'); assert.equal(result.deduplication.distinctStrengthSessions.length, 1);
});

run('24 Aug missing identity/timing fixture is explicitly ambiguous with Readiness retained and no Daily Balance', () => {
  const date = '2026-08-24', data = readinessData(date); data.workouts = []; data.polarWorkouts = { daily: {} }; data.polarCardioLoad = { daily: {} };
  addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]);
  data.workouts.push(workout(date, 'gym-24-aug', 240, { sessionLabel: 'Serbest Antrenman', startTime: false }));
  data.polarWorkouts.daily[date] = [polarSession(date, 'polar-functional-24-aug', 35, 'Fonksiyonel Antrenman', { workoutType: 'Functional Training', duration: 50, startTime: false })];
  const result = engine.analyze(data, date, { currentDate: date });
  assert.equal(result.readiness.status, 'available'); assert.equal(result.actualLoad.status, 'insufficient'); assert.equal(result.actualLoad.reason, 'ambiguous_session_identity'); assert.equal(result.actualLoad.method, 'shared_identity_then_compatible_strength_time_overlap'); assert.equal(result.actualLoad.value, null); assert.equal(result.loadFit.status, 'insufficient'); assert.equal(result.dailyBalance.status, 'insufficient'); assert.equal(result.dailyBalance.reason, 'ambiguous_session_identity'); assert.equal(result.dailyBalance.value, null);
});

run('exact 24 Aug production shape keeps readiness 37 and blocks false Mixed when identity evidence is absent', () => {
  const date = '2026-08-24';
  const data = { workouts: [], polarSleep: { daily: {} }, polarNightlyRecharge: { daily: {} }, polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  for (let offset = -5; offset <= 0; offset += 1) {
    const day = addDays(date, offset);
    data.polarSleep.daily[day] = sleepRow(day, { deepSleep: 27 * 60, remSleep: 27 * 60, lightSleep: 81 * 60 });
  }
  data.polarNightlyRecharge.daily[date] = { date, ansCharge: -2, ansChargeStatus: 1, nightlyRechargeStatus: 1, heartRateVariabilityAvg: 40, heartRateAvg: 61 };
  addGymBaseline(data, date, [4, 8, 12, 16, 20, 24, 28, 32, 36, 40], { duration: false, sets: 4 });
  data.workouts.push(
    workout(date, 'gym-2026-08-24', 40, { duration: false, startTime: false, sets: 4, rpe: 10, exercise: 'Squat' }),
    workout(date, 'gym-2026-08-24', 40, { duration: false, startTime: false, sets: 4, rpe: 10, exercise: 'Row' })
  );
  data.polarWorkouts.daily[date] = [{ date, polarExerciseId: 'polar-2026-08-24', workoutType: 'FUNCTIONAL_TRAINING', activityType: 'OTHER', durationMinutes: 50.4, cardioLoad: 47 }];
  data.polarCardioLoad.daily[date] = { date, cardioLoad: 47 };

  const result = engine.analyze(data, date, { currentDate: date });
  assert.equal(activity.key(data.polarWorkouts.daily[date][0].workoutType), 'strength');
  assert.equal(result.readiness.status, 'available'); assert.equal(result.readiness.value, 37);
  assert.equal(result.identityResult, 'ambiguous_session_identity'); assert.equal(result.actualLoad.status, 'insufficient'); assert.equal(result.actualLoad.reason, 'ambiguous_session_identity'); assert.equal(result.actualLoad.identityResult, 'ambiguous_session_identity');
  assert.equal(result.actualLoad.components.gym.value, 100); assert.equal(result.actualLoad.components.cardio.status, 'insufficient'); assert.notEqual(result.actualLoad.modality, 'mixed');
  assert.equal(result.actualLoad.deduplication.identityResolution, 'ambiguous'); assert.equal(result.actualLoad.deduplication.strengthPolarExcludedFromCardio, true);
  assert.equal(result.loadFit.status, 'insufficient'); assert.equal(result.loadFit.value, null);
  assert.equal(result.dailyBalance.status, 'insufficient'); assert.equal(result.dailyBalance.value, null);
});

run('Gym grouped-session timing is extracted from any row, not only the first working row', () => {
  const date = '2026-08-24', data = { workouts: [
    { date, sessionId: 'stable-session', exerciseId: 'a', exercise: 'Squat', sets: 4, reps: 8, rpe: 7 },
    { date, sessionId: 'stable-session', exerciseId: 'b', exercise: 'Row', sets: 4, reps: 8, rpe: 7, startedAt: '2026-08-24T18:10:00+03:00', durationMinutes: 50.4 }
  ] };
  const session = engine._internals.gymSessionsForDate(data, date)[0];
  assert.equal(session.explicitSessionId, 'stable-session'); assert.equal(session.startMinute, 18 * 60 + 10); assert.equal(session.durationMinutes, 50.4);
});

run('a true mixed day combines independently normalized Gym and cardio loads', () => {
  const date = '2026-08-21', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  const gymLoads = [100, 120, 140, 160, 180, 200, 220, 260, 280, 300], cardioLoads = [10, 20, 30, 40, 50, 60, 70, 90, 100, 110];
  addGymBaseline(data, date, gymLoads);
  cardioLoads.forEach((load, index) => addCardioDay(data, addDays(date, index - 10), load, index));
  data.workouts.push(workout(date, 'gym-current', 240)); addCardioDay(data, date, 80, 'current');
  const result = engine.actualLoad(data, date);
  assert.equal(result.status, 'available'); assert.equal(result.modality, 'mixed');
  assert.equal(result.components.gym.value, 70); assert.equal(result.components.cardio.value, 70); assert.equal(result.value, 91);
});

run('a mixed day is insufficient when either modality baseline is sparse', () => {
  const date = '2026-08-21', data = { workouts: [], polarWorkouts: { daily: {} }, polarCardioLoad: { daily: {} } };
  addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]); data.workouts.push(workout(date, 'gym-current', 240)); addCardioDay(data, date, 80, 'current');
  const result = engine.actualLoad(data, date); assert.equal(result.status, 'insufficient'); assert.equal(result.reason, 'mixed_day_component_baseline_insufficient'); assert.equal(result.components.gym.status, 'available'); assert.equal(result.components.cardio.status, 'insufficient');
});

run('mixed-day candidate simulation selects the explainable monotonic alpha combiner', () => {
  const union = (gym, cardio) => Math.round(100 * (1 - (1 - gym / 100) * (1 - cardio / 100)));
  const alpha = (gym, cardio, weight) => Math.round(Math.min(100, Math.max(gym, cardio) + weight * Math.min(gym, cardio)));
  assert.deepEqual([0.25, 0.30, 0.35].map(weight => alpha(70, 70, weight)), [88, 91, 95]);
  assert.deepEqual([0.25, 0.30, 0.35].map(weight => alpha(80, 20, weight)), [85, 86, 87]);
  assert.deepEqual([0.25, 0.30, 0.35].map(weight => alpha(40, 40, weight)), [50, 52, 54]);
  assert.equal(engine.mixedLoad(70, 70), 91); assert.equal(engine.mixedLoad(80, 20), 86); assert.equal(engine.mixedLoad(40, 40), 52); assert.equal(union(70, 70), 91); assert.equal(union(80, 20), 84); assert.equal(union(40, 40), 64);
  for (let gym = 0; gym <= 100; gym += 5) for (let cardio = 0; cardio <= 100; cardio += 5) { const value = engine.mixedLoad(gym, cardio); assert.ok(value >= gym && value >= cardio); if (gym < 100) assert.ok(engine.mixedLoad(gym + 1, cardio) >= value); if (cardio < 100) assert.ok(engine.mixedLoad(gym, cardio + 1) >= value); }
});

run('load-fit and Daily Balance sensitivity matrix preserves asymmetric safety semantics', () => {
  const cases = [{ readiness: 40, load: 95, fit: 0, balance: 14 }, { readiness: 40, load: 25, fit: 96, balance: 76 }, { readiness: 80, load: 80, fit: 100, balance: 93 }, { readiness: 80, load: 10, fit: 55, balance: 64 }];
  cases.forEach(item => { const fit = engine.loadFitScore(item.readiness, item.load).value, balance = Math.round(0.35 * item.readiness + 0.65 * fit); assert.equal(fit, item.fit); assert.equal(balance, item.balance); });
  for (let load = 51; load < 100; load += 1) assert.ok(engine.loadFitScore(40, load + 1).value <= engine.loadFitScore(40, load).value, `load ${load} must not improve after target high`);
});

run('rest day and sparse baselines return explicit insufficient post-training results', () => {
  const date = '2026-08-21', rest = engine.analyze(readinessData(date), date, { currentDate: date }); assert.equal(rest.actualLoad.reason, 'rest_day_no_completed_training'); assert.equal(rest.loadFit.status, 'insufficient'); assert.equal(rest.dailyBalance.status, 'insufficient'); assert.equal(rest.dailyBalance.reason, 'rest_day_no_post_training_score');
  const zeroDaily = readinessData(date); zeroDaily.polarCardioLoad = { daily: { [date]: { date, cardioLoad: 0 } } }; assert.equal(engine.actualLoad(zeroDaily, date).reason, 'rest_day_no_completed_training');
  const sparseData = readinessData(date); sparseData.workouts = [workout(date, 'current', 240)]; const sparse = engine.analyze(sparseData, date, { currentDate: date }); assert.equal(sparse.actualLoad.status, 'insufficient'); assert.equal(sparse.actualLoad.components.gym.sampleCount, 0); assert.equal(sparse.dailyBalance.status, 'insufficient');
});

run('the unified provider is deterministic and never mutates DATA', () => {
  const date = '2026-08-21', data = readinessData(date); data.workouts = []; addGymBaseline(data, date, [100, 120, 140, 160, 180, 200, 220, 260, 280, 300]); data.workouts.push(workout(date, 'current', 240));
  const before = JSON.stringify(data), first = engine.analyze(data, date, { currentDate: date }), second = engine.analyze(data, date, { currentDate: date }); assert.deepEqual(second, first); assert.equal(JSON.stringify(data), before); assert.equal(first.coachEligible, false); assert.equal(first.loadFit.status, 'available'); assert.equal(first.dailyBalance.status, 'available'); assert.equal(first.dailyBalance.coachEligible, false); assert.equal(first.dailyBalance.components.readiness, first.readiness.value); assert.equal(first.dailyBalance.components.loadFit, first.loadFit.value);
});

if (process.exitCode) process.exit(process.exitCode);
