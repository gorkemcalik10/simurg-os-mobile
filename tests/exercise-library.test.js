const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const library = require('../simurg-exercise-library.js');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function run(name, fn) {
  try { fn(); console.log('✓', name); }
  catch (error) { console.error('✗', name); throw error; }
}

run('library exposes 100-120 unique static exercises', () => {
  assert.ok(library.exercises.length >= 100 && library.exercises.length <= 120);
  assert.equal(new Set(library.exercises.map(item => item.id)).size, library.exercises.length);
  assert.equal(new Set(library.exercises.map(item => item.name)).size, library.exercises.length);
});

run('every exercise includes the v1 metadata contract', () => {
  for (const item of library.exercises) {
    for (const field of ['id', 'name', 'category', 'primaryMuscle', 'equipment', 'movementType', 'difficulty']) {
      assert.equal(typeof item[field], 'string', `${item.id}.${field}`);
      assert.ok(item[field].trim(), `${item.id}.${field} is empty`);
    }
    assert.ok(Array.isArray(item.secondaryMuscles), `${item.id}.secondaryMuscles`);
    assert.ok(Array.isArray(item.aliases) && item.aliases.length >= 2, `${item.id}.aliases`);
  }
});

run('Turkish and English search plus category filtering work', () => {
  assert.ok(library.query({ search: 'göğüs makinesi' }).some(item => item.id === 'incline_machine_press'));
  assert.ok(library.query({ search: 'tek kol', category: 'Back' }).some(item => item.id === 'single_arm_cable_row'));
  assert.ok(library.query({ search: 'incline press', category: 'Chest' }).length >= 2);
  assert.ok(library.query({ category: 'Core' }).every(item => item.category === 'Core'));
});

run('Gym Mode loads and persists only selected library ids', () => {
  assert.ok(index.indexOf('simurg-exercise-library.js?v=1') < index.indexOf('<script src="./simurg-signal-model.js'));
  assert.match(index, /function openExerciseLibrary\(\)/);
  assert.match(index, /function selectLibraryExercise\(exerciseId\)/);
  assert.match(index, /exerciseId:meta\.exerciseId\|\|undefined/);
  assert.doesNotMatch(index.match(/const INITIAL=([^;]+);/)?.[1] || '', /exerciseLibrary|exercises/);
  assert.match(sw, /simurg-exercise-library\.js\?v=1/);
});
