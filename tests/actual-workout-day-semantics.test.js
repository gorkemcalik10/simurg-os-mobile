const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const coach = require('../simurg-coach-engine.js');
const validation = require('../simurg-data-validation.js');
const history = require('../simurg-exercise-history.js');

const ROOT = path.resolve(__dirname, '..');
const volumeSource = fs.readFileSync(path.join(ROOT, 'simurg-volume-model.js'), 'utf8');
const modelSource = fs.readFileSync(path.join(ROOT, 'simurg-signal-model.js'), 'utf8');
const desktopSource = fs.readFileSync(path.join(ROOT, 'desktop-alignment.js'), 'utf8');
const homeSource = fs.readFileSync(path.join(ROOT, 'premium-standard.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const clientSource = fs.readFileSync(path.join(ROOT, 'simurg-coach-client.js'), 'utf8');

function runtime(data = {}) {
  const window = {
    DATA: data,
    SimurgWorkoutSource: {
      durationMinutes: value => Number(value) || null,
      validApple: () => true,
      day(date) {
        return {
          gym: (data.workouts || []).filter(row => row.date === date),
          polar: [], apple: (data.appleWatch || []).filter(row => row.date === date), primaryPolar: null, appleLegacy: null,
        };
      },
    },
  };
  window.window = window;
  const context = { window, DATA: data, selectedDate: '2026-08-10', console, Map, Set, Date, Math, Number, String, Object, Array, RegExp, JSON };
  vm.runInNewContext(volumeSource, context, { filename: 'simurg-volume-model.js' });
  window.SimurgVolumeModel = context.SimurgVolumeModel;
  vm.runInNewContext(modelSource, context, { filename: 'simurg-signal-model.js' });
  return window.SimurgSignalModel;
}

function row(date, overrides = {}) {
  return { date, exercise: 'Bench Press', sets: 1, reps: 5, weight: 50, ...overrides };
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('planned empty day is distinct from a true rest day', () => {
  const model = runtime({ workouts: [] });
  assert.deepEqual(JSON.parse(JSON.stringify(model.day('2026-08-10').gymPlan)), {
    mode: 'planned', label: 'Push Strength', sourceDay: null, sourceDate: null,
    planned: true, skipped: false, performed: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(model.day('2026-08-15').gymPlan)), {
    mode: 'rest', label: 'Dinlenme Günü', sourceDay: null, sourceDate: null,
    planned: false, skipped: false, performed: false,
  });
});

run('alternate and custom selections preserve actual labels and sources', () => {
  const data = { workouts: [], gymDayState: {
    '2026-08-10': { mode: 'alternate', label: 'Tuesday Pull Strength', sourceDay: 'Tuesday', sourceDate: '2026-08-11' },
    '2026-08-12': { mode: 'custom', label: 'Serbest Antrenman', sourceDay: null, sourceDate: null },
  } };
  const model = runtime(data);
  assert.deepEqual(JSON.parse(JSON.stringify(model.day('2026-08-10').gymPlan)), {
    mode: 'alternate', label: 'Tuesday Pull Strength', sourceDay: 'Tuesday', sourceDate: '2026-08-11',
    planned: true, skipped: false, performed: false,
  });
  assert.equal(model.day('2026-08-12').gymPlan.mode, 'custom');
  assert.equal(model.day('2026-08-12').gymPlan.label, 'Serbest Antrenman');
});

run('saved workout rows alone determine performed state', () => {
  const planned = runtime({ workouts: [row('2026-08-10')] }).day('2026-08-10').gymPlan;
  assert.equal(planned.mode, 'planned'); assert.equal(planned.performed, true);
  const custom = runtime({ workouts: [row('2026-08-15')] }).day('2026-08-15').gymPlan;
  assert.equal(custom.mode, 'custom'); assert.equal(custom.performed, true);
});

run('validated startup history remains identical for Gym and Daily date views', () => {
  const date = '2026-08-10';
  const input = {
    schemaVersion: 1,
    workouts: [row(date), row(date, { exercise: 'Cable Row', reps: 8 })],
    polarWorkouts: { daily: { [date]: [{ date, type: 'polar_flow_workout', activityType: 'Fitness', muscleLoad: -1 }] }, latest: null },
  };
  const startup = validation.prepareFullText(JSON.stringify(input), { source: 'startup-local-storage' }).data;
  const gymRows = startup.workouts.filter(item => item.date === date);
  const dailyRows = runtime(startup).day(date).gym.rows;
  assert.equal(gymRows.length, 2);
  assert.equal(dailyRows.length, gymRows.length);
  assert.deepEqual(dailyRows.map(item => item.exercise), gymRows.map(item => item.exercise));
});

run('degraded startup recovery feeds existing rows to Gym History and Daily Summary', () => {
  const date = '2026-08-10';
  const input = { schemaVersion: 1,
    workouts: Array.from({ length: 708 }, (_, index) => row(date, {
      exercise: 'Bench Press', exerciseId: 'legacy-bench', reps: 5 + index % 5,
    })),
    polarWorkouts: { daily: { [date]: [{ date, type: 'polar_flow_workout', activityType: 'Fitness', muscleLoad: -2 }] }, latest: null },
  };
  const recovered = validation.recoverWorkoutHistoryText(JSON.stringify(input), { source: 'startup-workout-recovery' }).data;
  const gymHistory = history.sessions(recovered.workouts, { exerciseId: 'legacy-bench', name: 'Bench Press' }, { beforeDate: '2026-08-11' });
  const dailyRows = runtime(recovered).day(date).gym.rows;
  assert.equal(recovered.workouts.length, 708);
  assert.equal(gymHistory.length, 1);
  assert.equal(gymHistory[0].rows.length, 708);
  assert.equal(dailyRows.length, 708);
});

run('explicit skip stays distinct and suppresses Coach progression context', () => {
  const plan = { mode: 'skipped', label: 'Bugün Atlandı', sourceDay: null, sourceDate: null, planned: true, skipped: true, performed: false };
  const data = { workouts: [row('2026-08-03', { rpe: 6, form: 'Good', pain: 'None' })], gymDayState: { '2026-08-10': plan } };
  assert.equal(runtime(data).day('2026-08-10').gymPlan.skipped, true);
  const result = coach.analyzePreWorkout(data, '2026-08-10', { gymPlan: plan });
  assert.equal(result.trainingDecision, 'rest');
  assert.equal(result.loadAdjustmentPercent, -100);
  assert.doesNotMatch(JSON.stringify(result.workoutGuidance), /\+1 tekrar|küçük yük artışı|progresyon değerlendirilebilir/i);
  const savedRows = runtime({ workouts: [row('2026-08-10')], gymDayState: { '2026-08-10': plan } }).day('2026-08-10').gymPlan;
  assert.equal(savedRows.skipped, true); assert.equal(savedRows.performed, true);
});

run('Coach exercise history matches ID first and name only when both IDs are missing', () => {
  const idResult = coach.analyzePostWorkout({ workouts: [
    row('2026-08-08', { exerciseId: 'exercise-b' }),
    row('2026-08-09', { exerciseId: 'exercise-a' }),
    row('2026-08-10', { exerciseId: 'exercise-b', weight: 55 }),
  ] }, '2026-08-10', {});
  assert.match(idResult.comparisonNotes[0], /2026-08-08/);
  assert.doesNotMatch(idResult.comparisonNotes[0], /2026-08-09/);
  const legacyResult = coach.analyzePostWorkout({ workouts: [
    row('2026-08-08'),
    row('2026-08-09', { exerciseId: 'exercise-a' }),
    row('2026-08-10', { weight: 55 }),
  ] }, '2026-08-10', {});
  assert.match(legacyResult.comparisonNotes[0], /2026-08-08/);
});

run('weekly active day is a real union and volume totals remain unchanged', () => {
  const separate = runtime({ workouts: [row('2026-08-10')], appleWatch: [{ date: '2026-08-11', durationMinutes: 30, activityType: 'Running' }] }).week('2026-08-10');
  assert.equal(separate.workoutDays, 2);
  assert.equal(separate.sets, 1); assert.equal(separate.volume, 250);
  const same = runtime({ workouts: [row('2026-08-10')], appleWatch: [{ date: '2026-08-10', durationMinutes: 30, activityType: 'Running' }] }).week('2026-08-10');
  assert.equal(same.workoutDays, 1);
  assert.equal(same.sets, 1); assert.equal(same.volume, 250);
  const month = runtime({ workouts: [row('2026-08-10')] }).month('2026-08');
  assert.equal(month.sets, 1); assert.equal(month.volume, 250);
});

run('day resolution and touched render helpers do not mutate DATA', () => {
  const data = { workouts: [], gymDayState: {}, customGymPrograms: {}, programNames: {} };
  const before = JSON.stringify(data); const model = runtime(data);
  model.day('2026-08-10'); model.week('2026-08-10'); model.month('2026-08');
  assert.equal(JSON.stringify(data), before);
  const targetBody = indexSource.match(/function nextTarget\(ex,date\)\{([\s\S]*?)\n  \}/)[1];
  assert.doesNotMatch(targetBody, /DATA\.autoNextTargets\s*=/);
  const localStatusBody = indexSource.match(/window\.renderDataLocalStatus=function\(\)\{([\s\S]*?)\n  \};/)[1];
  assert.doesNotMatch(localStatusBody, /ensureMeta\(|DATA\._meta\s*=/);
});

run('legacy payload and JSON/cloud-style round trip preserve all day state namespaces', () => {
  const legacy = validation.prepareFull({ schemaVersion: 1, workouts: [row('2026-08-10')] }).data;
  assert.deepEqual(legacy.gymDayState, {});
  legacy.gymDayState['2026-08-10'] = { mode: 'alternate', sourceDay: 'Tuesday', sourceDate: '2026-08-11', label: 'Pull', updatedAt: '2026-08-10T08:00:00.000Z' };
  legacy.customGymPrograms['2026-08-10'] = { overrides: {}, extras: [] };
  legacy.programNames.Monday = 'Push';
  const restored = validation.prepareFull(JSON.parse(JSON.stringify(legacy))).data;
  assert.deepEqual(restored.gymDayState, legacy.gymDayState);
  assert.deepEqual(restored.customGymPrograms, legacy.customGymPrograms);
  assert.deepEqual(restored.programNames, legacy.programNames);
});

run('Home Logger and Coach consumers bind to centralized semantics and stable identity', () => {
  assert.match(homeSource, /gymPlan:sharedDay&&sharedDay\.gymPlan/);
  assert.match(homeSource, /if\(model\.gymPlan&&model\.gymPlan\.label\)/);
  assert.match(indexSource, /const plan=dayPlan\(d\)/);
  assert.match(desktopSource, /function exerciseKey\(row\).*exerciseId/);
  assert.match(desktopSource, /metric\('Aktif Gün',a\.workoutDays\)/);
  assert.match(clientSource, /engineOptions\.gymPlan=sharedDay\.gymPlan/);
});
