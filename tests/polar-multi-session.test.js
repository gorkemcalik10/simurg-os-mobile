const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'polar-workout.js'), 'utf8');
const signalSource = fs.readFileSync(path.join(root, 'simurg-signal-model.js'), 'utf8');
const policySource = fs.readFileSync(path.join(root, 'workout-source-policy.js'), 'utf8');
const volumeSource = fs.readFileSync(path.join(root, 'simurg-volume-model.js'), 'utf8');
const premiumSource = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const desktopSource = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');

function runtime(data = {}) {
  const document = { readyState: 'loading', addEventListener() {} };
  const window = { DATA: data, window: null };
  window.window = window;
  const context = { window, DATA: data, document, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set };
  vm.runInNewContext(source, context, { filename: 'polar-workout.js' });
  return window;
}

function physicalRuntime(data) {
  const document = { readyState: 'loading', addEventListener() {} };
  const window = { DATA: data, window: null, calculateReadiness() { return null; } };
  window.window = window;
  const context = { window, DATA: data, document, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set };
  vm.runInNewContext(volumeSource, context, { filename: 'simurg-volume-model.js' });
  window.SimurgVolumeModel = context.SimurgVolumeModel;
  vm.runInNewContext(signalSource, context, { filename: 'simurg-signal-model.js' });
  vm.runInNewContext(policySource, context, { filename: 'workout-source-policy.js' });
  return window;
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('cardioLoad renders when legacy trainingLoad is null', () => {
  const window = runtime();
  const workout = { cardioLoad: 30.4994, trainingLoad: null, trainingImpact: {} };
  const resolved = window.SimurgPolarWorkoutLoads.resolve(workout);
  const html = window.SimurgPolarWorkoutLoads.render(workout);
  assert.equal(resolved.cardio.value, 30.4994);
  assert.match(html, /Cardio Load/);
  assert.match(html, />30\.5</);
  assert.doesNotMatch(html, /Antrenman yükü mevcut değil/);
});

run('hyphenated and underscored raw Cardio Load fallbacks both work', () => {
  const window = runtime();
  assert.equal(window.SimurgPolarWorkoutLoads.resolve({ raw: { training_load_pro: { 'cardio-load': 25.687 } } }).cardio.value, 25.687);
  assert.equal(window.SimurgPolarWorkoutLoads.resolve({ raw: { training_load_pro: { cardio_load: 28.383 } } }).cardio.value, 28.383);
});

run('missing muscle and perceived load never blank available Cardio Load', () => {
  const window = runtime();
  const html = window.SimurgPolarWorkoutLoads.render({ cardioLoad: 0, muscleLoad: null, perceivedLoad: null, trainingImpact: {} });
  assert.match(html, /Cardio Load/);
  assert.match(html, />0</);
  assert.doesNotMatch(html, /Kas Yükü|Algılanan Yük|Antrenman yükü mevcut değil/);
});

run('load cards render independently and empty only when all loads are missing', () => {
  const window = runtime();
  const partial = window.SimurgPolarWorkoutLoads.render({ muscleLoad: 12, trainingImpact: {} });
  assert.match(partial, /Kas Yükü/);
  assert.doesNotMatch(partial, /Antrenman yükü mevcut değil/);
  const empty = window.SimurgPolarWorkoutLoads.render({ trainingLoad: null, trainingImpact: {} });
  assert.match(empty, /Antrenman yükü mevcut değil/);
});

run('manual normalization preserves ID, loads, interpretations and raw payload', () => {
  const window = runtime();
  const normalized = window.SimurgPolarWorkoutNormalize({
    type: 'polar_flow_workout', date: '2026-08-18', id: 'exercise-1', activityType: 'Fitness',
    trainingLoad: null,
    training_load_pro: { 'cardio-load': 30.4994, muscle_load: 10, perceived_load: 4, cardio_load_interpretation: 'moderate' },
  });
  assert.equal(normalized.polarExerciseId, 'exercise-1');
  assert.equal(normalized.cardioLoad, 30.4994);
  assert.equal(normalized.muscleLoad, 10);
  assert.equal(normalized.perceivedLoad, 4);
  assert.equal(normalized.cardioLoadInterpretation, 'moderate');
  assert.equal(normalized.raw.id, 'exercise-1');
});

run('readiness-facing physical metrics use the duration-weighted Polar daily aggregate', () => {
  const date = '2026-08-16';
  const rows = [
    { date, polarExerciseId: 'a', startTime: '08:00', duration: '00:08:08', activityType: 'Fitness', activeCal: 80, avgHR: 124, maxHR: 144, cardioLoad: 7.038 },
    { date, polarExerciseId: 'b', startTime: '12:00', duration: '00:35:24', activityType: 'Fitness', activeCal: 320, avgHR: 123, maxHR: 146, cardioLoad: 28.383 },
    { date, polarExerciseId: 'c', startTime: '18:00', duration: '00:28:23', activityType: 'Fitness', activeCal: 276, avgHR: 126, maxHR: 163, cardioLoad: 25.687 },
  ];
  const window = physicalRuntime({
    workouts: [], polarWorkouts: { daily: { [date]: rows } },
    polarCardioLoad: { daily: { [date]: { date, cardioLoad: 61.108, cardioLoadStatus: 'PRODUCTIVE' } } },
  });
  const selection = window.SimurgWorkoutSource.day(date);
  const metrics = window.SimurgWorkoutSource.metrics(date);
  assert.equal(selection.primaryPolar, rows[0]);
  assert.equal(selection.extraPolar.length, 2);
  assert.ok(Math.abs(metrics.minutes - (71 + 55 / 60)) < 0.0001);
  assert.equal(metrics.active, 676);
  assert.ok(Math.abs(metrics.avgHR - 124.2971) < 0.001);
  assert.equal(metrics.maxHR, 163);
  assert.equal(metrics.polarAggregate.cardioLoad, 61.108);
  window.SimurgReadiness = { resolve(selectedDate) { return window.calculateReadiness(selectedDate); } };
  const signalDay = window.SimurgSignalModel.day(date);
  assert.equal(signalDay.polarAggregate.sessionCount, 3);
  assert.ok(Number.isFinite(signalDay.readiness.score));
});

run('Home stays compact while desktop detail remains selected-session specific', () => {
  assert.match(premiumSource, /activity\.dailyAggregate\?\[activity\.sessionCount\+' seans'/);
  assert.match(premiumSource, /polarAggregate\.sessionCount>1/);
  assert.match(desktopSource, /function dailyMetrics\(date,session\).*polarAggregate/s);
  assert.match(desktopSource, /function polarWorkouts\(\).*m=p\?primaryMetrics/s);
  assert.match(desktopSource, /cardio:workoutCardioLoad\(p\)/);
  assert.match(source, /data-pw-session-index/);
  assert.match(source, /polarWorkoutSelectSession/);
});

if (process.exitCode) process.exit(process.exitCode);
