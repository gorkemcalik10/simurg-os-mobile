const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const model = require('../simurg-volume-model.js');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const desktop = fs.readFileSync(path.join(ROOT, 'desktop-alignment.js'), 'utf8');
const signal = fs.readFileSync(path.join(ROOT, 'simurg-signal-model.js'), 'utf8');
const premium = fs.readFileSync(path.join(ROOT, 'premium-standard.js'), 'utf8');

function reset(profiles = {}) {
  global.DATA = { workouts: [], exerciseLoadProfiles: profiles };
}

function run(name, fn) {
  try { reset(); fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('TEST 1: dual dumbbell volume keeps entered weight', () => {
  const result = model.row({ exercise: 'Incline DB Press', weight: 25, reps: 8, sets: 3 });
  assert.equal(result.enteredWeight, 25);
  assert.equal(result.factor, 2);
  assert.equal(result.volume, 1200);
  assert.equal(result.preset, 'DUAL_DUMBBELL');
});

run('TEST 2: per-side plate volume counts both sides', () => {
  assert.equal(model.row({ exercise: 'High Row', weight: 25, reps: 10, sets: 3 }).volume, 1500);
});

run('TEST 3: bilateral unilateral movement counts both sides', () => {
  assert.equal(model.row({ exercise: 'Single Arm Cable Row', weight: 20, reps: 8, sets: 3 }).volume, 960);
});

run('TEST 4: explicit single-side profile uses factor one', () => {
  model.setProfile('Single Arm Cable Row', 'SINGLE_SIDE');
  const result = model.row({ exercise: 'Single Arm Cable Row', weight: 20, reps: 8, sets: 3 });
  assert.equal(result.factor, 1);
  assert.equal(result.volume, 480);
});

run('TEST 5: stack total uses machine value once', () => {
  assert.equal(model.row({ exercise: 'Face Pull', weight: 15, reps: 15, sets: 2 }).volume, 450);
});

run('TEST 6: total system override supports barbell volume', () => {
  model.setProfile('Barbell Bench', 'TOTAL_SYSTEM');
  assert.equal(model.row({ exercise: 'Barbell Bench', weight: 60, reps: 8, sets: 3 }).volume, 1440);
});

run('TEST 7: unknown exercise remains unassigned and valid', () => {
  const result = model.row({ exercise: 'Unknown New Movement', weight: 10, reps: 10, sets: 3 });
  assert.equal(result.preset, 'UNASSIGNED');
  assert.equal(result.factor, 1);
  assert.equal(result.volume, 300);
});

run('TEST 8: historical row is not mutated during derived calculation', () => {
  const raw = { exercise: 'Incline DB Press', weight: 25, reps: 8, sets: 1, date: '2026-07-01' };
  const before = JSON.stringify(raw);
  assert.equal(model.row(raw).volume, 400);
  assert.equal(raw.weight, 25);
  assert.equal(JSON.stringify(raw), before);
});

run('TEST 9: mobile, desktop and report consumers share the model', () => {
  assert.match(index, /function calc\(items\)\{let summary=SimurgVolumeModel\.summary\(items\)/);
  assert.match(desktop, /function workoutStats\(rows\)\{var ex=\{\},summary=window\.SimurgVolumeModel\.summary\(rows\)/);
  assert.match(signal, /function gymSummary\(rows\)[^]*?SimurgVolumeModel\.row\(row\)/);
  assert.match(premium, /function calcRows\(rows\)[^]*?SimurgVolumeModel\.summary\(rows\)/);
});

run('TEST 10: profile change recalculates history without changing raw weight', () => {
  const raw = { exercise: 'Custom Machine', weight: 20, reps: 10, sets: 3 };
  model.setProfile(raw.exercise, 'STACK_TOTAL');
  assert.equal(model.row(raw).volume, 600);
  model.setProfile(raw.exercise, 'PER_SIDE_BOTH');
  assert.equal(model.row(raw).volume, 1200);
  assert.equal(raw.weight, 20);
});

run('profile keys preserve Turkish characters and normalize spacing', () => {
  assert.equal(model.profileKey('  Göğüs   Presi  '), 'göğüs presi');
});

run('renaming copies the profile while historical rows retain the old profile', () => {
  const historical = {
    exercise: 'Custom DB Press',
    weight: 20,
    reps: 10,
  };
  const before = JSON.stringify(historical);
  global.DATA.workouts = [historical];
  global.DATA.exerciseLoadProfiles['custom db press'] = { preset: 'DUAL_DUMBBELL' };

  assert.equal(model.moveProfile('Custom DB Press', 'Incline Custom Press'), true);
  assert.equal(model.profileFor('Incline Custom Press').preset, 'DUAL_DUMBBELL');
  assert.equal(model.profileFor('Custom DB Press').preset, 'DUAL_DUMBBELL');
  assert.equal(model.row(historical).volume, 400);
  assert.equal(JSON.stringify(historical), before);
  assert.equal(global.DATA.exerciseLoadProfiles['custom db press'].preset, 'DUAL_DUMBBELL');
  assert.equal(global.DATA.exerciseLoadProfiles['incline custom press'].preset, 'DUAL_DUMBBELL');
});

delete global.DATA;
if (process.exitCode) process.exit(process.exitCode);
