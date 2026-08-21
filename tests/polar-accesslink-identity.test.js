const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const validation = require('../simurg-data-validation.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'polar-accesslink.js'), 'utf8');

function makeRuntime() {
  const data = { polarWorkouts: { daily: {}, latest: null } };
  const storage = new Map();
  const localStorage = {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); },
  };
  const document = { readyState: 'loading', addEventListener() {}, dispatchEvent() {}, getElementById() { return null; } };
  const window = {
    window: null, DATA: data, SimurgPolarWorkoutIdentity: global.SimurgPolarWorkoutIdentity,
    simurgGetData() { return data; }, simurgPersistData() { return { ok: true }; },
  };
  window.window = window;
  const context = { window, DATA: data, document, localStorage, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set, URL, Uint8Array };
  const instrumented = source.replace('  ready(function(){', '  window.__testMergeSync=mergeSync;\n  ready(function(){');
  vm.runInNewContext(instrumented, context, { filename: 'polar-accesslink.js' });
  return { data, runtime: { mergeSync: window.__testMergeSync } };
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('repeated AccessLink merge upserts by stable Polar ID', () => {
  const { data, runtime } = makeRuntime();
  const date = '2026-08-16';
  runtime.mergeSync({ workouts: [{ date, polarExerciseId: 'a', startTime: '08:00', duration: '00:08:08', activityType: 'Fitness', cardioLoad: 7 }] });
  runtime.mergeSync({ workouts: [{ date, polarExerciseId: 'a', startTime: '08:00:00', duration: '00:08:08', activityType: 'Fitness', cardioLoad: 8 }] });
  assert.equal(data.polarWorkouts.daily[date].length, 1);
  assert.equal(data.polarWorkouts.daily[date][0].cardioLoad, 8);
  assert.equal(data.polarWorkouts.daily[date][0].startTime, '08:00:00');
});

run('same start with distinct Polar IDs stays distinct and legacy rows use fallback', () => {
  const { data, runtime } = makeRuntime();
  const date = '2026-08-17';
  runtime.mergeSync({ workouts: [
    { date, polarExerciseId: 'a', startTime: '09:00', duration: '00:30:00', activityType: 'Running' },
    { date, polarExerciseId: 'b', startTime: '09:00', duration: '00:30:00', activityType: 'Running' },
  ] });
  assert.equal(data.polarWorkouts.daily[date].length, 2);
  const legacyDate = '2026-08-18';
  const legacy = { date: legacyDate, startTime: '10:00', duration: '00:45:00', activityType: 'Fitness', avgHR: 110 };
  runtime.mergeSync({ workouts: [legacy] });
  runtime.mergeSync({ workouts: [{ ...legacy, startTime: '10:00:00', avgHR: 115 }] });
  assert.equal(data.polarWorkouts.daily[legacyDate].length, 1);
  assert.equal(data.polarWorkouts.daily[legacyDate][0].avgHR, 115);
});

if (process.exitCode) process.exit(process.exitCode);
