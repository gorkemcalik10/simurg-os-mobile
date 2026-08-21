const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const history = require('../simurg-exercise-history.js');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function run(name, fn) {
  try { fn(); console.log('\u2713', name); }
  catch (error) { console.error('\u2717', name); throw error; }
}

const workouts = [
  { date: '2026-08-01', exercise: 'Incline DB Press', sets: 1, reps: 10, weight: 15 },
  { date: '2026-08-08', exercise: 'Incline Dumbbell Press', exerciseId: 'incline_dumbbell_press', sets: 1, reps: 8, weight: 17.5 },
  { date: '2026-08-08', exercise: 'Incline Dumbbell Press', exerciseId: 'incline_dumbbell_press', sets: 1, reps: 7, weight: 17.5 },
  { date: '2026-08-10', exercise: 'Incline DB Press', exerciseId: 'simurg-exercise-v1-incline-db-press', sets: 1, reps: 9, weight: 18 },
  { date: '2026-08-15', exercise: 'Renamed Incline Press', exerciseId: 'incline_dumbbell_press', sets: 3, reps: 6, weight: 20 },
  { date: '2026-08-15', exercise: 'Incline Dumbbell Press', exerciseId: 'different_exercise', sets: 1, reps: 20, weight: 5 },
  { date: '2026-08-20', exercise: 'G\u00f6rkem Special Row', sets: 1, reps: 12, weight: 30 }
];

run('library identity retrieves id records plus compatible legacy names', () => {
  const sessions = history.sessions(workouts, {
    exerciseId: 'incline_dumbbell_press',
    exerciseIds: ['incline_dumbbell_press', 'simurg-exercise-v1-incline-db-press'],
    name: 'Incline Dumbbell Press',
    aliases: ['Incline DB Press']
  });
  assert.deepEqual(sessions.map(item => item.date), ['2026-08-15', '2026-08-10', '2026-08-08', '2026-08-01']);
  assert.equal(sessions[0].rows.length, 1, 'conflicting exerciseId must not match by name');
});

run('history can return only sessions before the selected workout date', () => {
  const sessions = history.sessions(workouts, {
    exerciseId: 'incline_dumbbell_press', exerciseIds: ['incline_dumbbell_press', 'simurg-exercise-v1-incline-db-press'], name: 'Incline Dumbbell Press', aliases: ['Incline DB Press']
  }, { beforeDate: '2026-08-15', limit: 1 });
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].date, '2026-08-10');
  assert.deepEqual(sessions[0].summary, { sets: 1, reps: 9, volume: 162, best: { weight: 18, reps: 9 } });
});

run('an unrelated ID never matches only because the display name is similar', () => {
  assert.equal(history.matches(
    { exercise: 'Incline Dumbbell Press', exerciseId: 'different_exercise' },
    { exerciseIds: ['incline_dumbbell_press', 'simurg-exercise-v1-incline-db-press'], name: 'Incline Dumbbell Press' }
  ), false);
});

run('custom exercise history remains name based and Turkish-safe', () => {
  const sessions = history.sessions(workouts, 'gorkem special row');
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].rows[0].weight, 30);
});

run('aggregate workout rows preserve their recorded set count', () => {
  const summary = history.summarize([{ sets: 3, reps: 6, weight: 20 }]);
  assert.deepEqual(summary, { sets: 3, reps: 18, volume: 360, best: { weight: 20, reps: 6 } });
});

run('Gym History loads before the app and uses exercise identity without a schema migration', () => {
  assert.ok(index.indexOf('simurg-exercise-history.js?v=2') < index.indexOf('<script src="./simurg-signal-model.js'));
  assert.match(index, /renderHistoryHtml\(meta\)/);
  assert.match(index, /beforeDate:selectedDate,limit:5/);
  assert.match(sw, /simurg-exercise-history\.js\?v=2/);
  assert.doesNotMatch(index.match(/const INITIAL=([^;]+);/)?.[1] || '', /exerciseHistory/);
});

run('Daily keeps selecting all workout rows by exact date regardless of exercise identity', () => {
  assert.match(index, /function dayData\(date\)\{return DATA\.workouts\.filter\(w=>w\.date===date\)\}/);
});
