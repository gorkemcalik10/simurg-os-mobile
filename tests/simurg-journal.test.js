'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const validation = require('../simurg-data-validation.js');
const journal = require('../simurg-journal.js');
const coach = require('../simurg-coach-engine.js');
const fixtures = require('./simurg-coach-fixtures.js');

const root = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function base() { return validation.prepareFull({ schemaVersion: 1 }, { canonicalizeExercises: false }).data; }
function entry(value, note = '') {
  const behaviors = journal.emptyBehaviors();
  behaviors.lateCaffeine = value;
  return { behaviors, note };
}
function qualifiedSleep(date, actualSleepMinutes, timeInBedMinutes = 600) {
  return {
    date,
    durationMinutes: timeInBedMinutes,
    timeInBedSeconds: timeInBedMinutes * 60,
    deepSleep: 60 * 60,
    remSleep: 90 * 60,
    lightSleep: (actualSleepMinutes - 150) * 60,
  };
}
function history(firstDifference, secondDifference) {
  const data = base();
  const start = '2026-01-01';
  for (let index = 0; index < 24; index += 1) {
    const date = journal.addDays(start, index);
    const outcomeDate = journal.addDays(date, 1);
    const present = index % 2 === 0;
    const difference = index < 12 ? firstDifference : secondDifference;
    const absentMinutes = 450;
    journal.upsert(data, date, entry(present), `2026-02-01T00:${String(index).padStart(2, '0')}:00.000Z`);
    const actualSleepMinutes = present ? absentMinutes + difference : absentMinutes;
    data.polarSleep.daily[outcomeDate] = qualifiedSleep(outcomeDate, actualSleepMinutes);
  }
  return data;
}

run('old DATA without Journal loads with a safe empty namespace', () => {
  const old = { schemaVersion: 1, workouts: [], customGymPrograms: { keep: [] }, programNames: { Monday: 'Push Strength' } };
  const prepared = validation.prepareFull(old, { canonicalizeExercises: false }).data;
  assert.deepEqual(prepared.journal, { schemaVersion: 1, daily: {} });
  assert.deepEqual(prepared.customGymPrograms, old.customGymPrograms);
  assert.deepEqual(prepared.programNames, old.programNames);
});

run('tri-state behaviors and notes remain JSON-safe through validation and cloud-style round trip', () => {
  const data = base();
  const behaviors = journal.emptyBehaviors();
  behaviors.goodHydration = true;
  behaviors.lateCaffeine = false;
  journal.upsert(data, '2026-08-25', { behaviors, note: 'Akşam mobilite — iyi hissettim 🌙' }, '2026-08-25T20:30:00.000Z');
  const raw = JSON.stringify(data);
  assert.doesNotMatch(raw, /undefined/);
  const restored = validation.prepareFullText(raw, { source: 'authenticated-cloud-pull', canonicalizeExercises: false }).data;
  assert.equal(restored.journal.daily['2026-08-25'].behaviors.goodHydration, true);
  assert.equal(restored.journal.daily['2026-08-25'].behaviors.lateCaffeine, false);
  assert.equal(restored.journal.daily['2026-08-25'].behaviors.lateMeal, null);
  assert.equal(restored.journal.daily['2026-08-25'].note, 'Akşam mobilite — iyi hissettim 🌙');
});

run('unanswered behavior stays unknown and same-date editing updates instead of duplicating', () => {
  const data = base();
  journal.upsert(data, '2026-08-25', entry(true, 'First'), '2026-08-25T18:00:00.000Z');
  journal.upsert(data, '2026-08-25', entry(false, 'Updated'), '2026-08-25T19:00:00.000Z');
  assert.deepEqual(Object.keys(data.journal.daily), ['2026-08-25']);
  assert.equal(data.journal.daily['2026-08-25'].behaviors.lateCaffeine, false);
  assert.equal(data.journal.daily['2026-08-25'].behaviors.alcohol, null);
  assert.equal(data.journal.daily['2026-08-25'].note, 'Updated');
});

run('invalid Journal values are rejected without dropping existing DATA', () => {
  const data = base();
  data.workouts.push({ date: '2026-08-25', exercise: 'Row', sets: 3, reps: 8, weight: 30 });
  journal.upsert(data, '2026-08-25', entry(true), '2026-08-25T18:00:00.000Z');
  data.journal.daily['2026-08-25'].behaviors.alcohol = undefined;
  assert.throws(() => validation.prepareFull(data, { canonicalizeExercises: false }), error => error.code === 'invalid_json_value');
  assert.equal(data.workouts.length, 1);
});

run('Journal resolves 396 actual-sleep minutes instead of 418 minutes in bed', () => {
  const data = base();
  data.polarSleep.daily['2026-08-25'] = qualifiedSleep('2026-08-25', 396, 418);
  assert.deepEqual(journal.sleepOutcome(data, '2026-08-25'), { date: '2026-08-25', sleepMinutes: 396 });
});

run('Journal stays insufficient when time in bed exists without qualified actual sleep', () => {
  const data = base();
  data.polarSleep.daily['2026-08-25'] = {
    date: '2026-08-25',
    durationMinutes: 418,
    durationSeconds: 418 * 60,
    duration: '06:58:00',
    timeInBedSeconds: 418 * 60,
  };
  assert.equal(journal.sleepOutcome(data, '2026-08-25'), null);
});

run('insufficient history returns no fabricated insight', () => {
  const data = history(-90, -90);
  Object.keys(data.journal.daily).slice(8).forEach(date => { delete data.journal.daily[date]; });
  const result = journal.insights(data, '2026-01-25');
  assert.equal(result.status, 'insufficient');
  assert.equal(result.qualifiedDays, 8);
  assert.deepEqual(result.insights, []);
});

run('qualified consistent history produces conservative next-day language', () => {
  const result = journal.insights(history(-90, -90), '2026-01-25');
  assert.equal(result.status, 'qualified');
  assert.equal(result.insights[0].behavior, 'lateCaffeine');
  assert.equal(result.insights[0].direction, 'lower');
  assert.equal(result.insights[0].dateRule, 'journal_date_plus_one_calendar_day');
  assert.match(result.insights[0].message, /ardından.*daha kısa.*eğiliminde/);
  assert.doesNotMatch(result.insights[0].message, /neden|sebep|etki etti/i);
});

run('contradictory history returns neutral insufficiency instead of a strong conclusion', () => {
  const result = journal.insights(history(-180, 80), '2026-01-25');
  assert.equal(result.status, 'insufficient');
  assert.deepEqual(result.insights, []);
});

run('historical insight cutoff excludes later Journal entries and outcomes', () => {
  const data = history(-90, -90);
  const before = journal.insights(data, '2026-01-25');
  journal.upsert(data, '2026-01-26', entry(true), '2026-01-26T20:00:00.000Z');
  data.polarSleep.daily['2026-01-27'] = qualifiedSleep('2026-01-27', 540, 600);
  const after = journal.insights(data, '2026-01-25');
  assert.deepEqual(after, before);
});

run('Journal observations do not change the canonical Coach decision', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const withoutJournal = coach.analyzePreWorkout(clone(scenario.data), scenario.date);
  const withJournalData = clone(scenario.data);
  withJournalData.journal = history(-90, -90).journal;
  const withJournal = coach.analyzePreWorkout(withJournalData, scenario.date);
  assert.equal(withJournal.trainingDecision, withoutJournal.trainingDecision);
  assert.equal(withJournal.loadAdjustmentPercent, withoutJournal.loadAdjustmentPercent);
  assert.deepEqual(withJournal.decisionEvidence, withoutJournal.decisionEvidence);
});

run('mobile Menu replaces Journal with Weekly while Journal data, desktop Program and Gym editing remain present', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const active = html.replace(/<template\b[\s\S]*?<\/template>/gi, '');
  const menu = active.match(/<div class="simurgV8Grid simurgPremiumMenuGrid">([\s\S]*?)<\/div><\/div><nav id="simurgV8Nav"/);
  assert.ok(menu);
  assert.match(menu[1], /simurgV8Go\('weekly','menu'\)/);
  assert.match(menu[1], /<b>Haftalık<\/b>/);
  assert.doesNotMatch(menu[1], /simurgV8Go\('journal','menu'\)|<b>Journal<\/b>/);
  assert.doesNotMatch(menu[1], /simurgV8Go\('program','menu'\)|<b>Program<\/b>/);
  assert.match(active, /<section id="program"/);
  assert.match(active, /id="programNameModal"/);
  assert.match(active, /function ensureGymProgramEntry\(date\)/);
  assert.match(active, /<section id="journal"/);
  assert.match(active, /"journal":\{"schemaVersion":1,"daily":\{\}\}/);
  const nav = active.match(/<nav id="simurgV8Nav"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/data-key="([^"]+)"/g)].map(match => match[1]), ['home', 'gym', 'logger', 'training-lab', 'menu']);
});

if (process.exitCode) process.exit(process.exitCode);
