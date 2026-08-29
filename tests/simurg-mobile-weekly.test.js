const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const weekly = require('../simurg-mobile-weekly.js');
const sleep = require('../simurg-sleep-intelligence.js');
const polar = require('../simurg-polar-intelligence.js');

const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-08-27';

function add(date, amount) { return weekly.date.addDays(date, amount); }
function makeSignal(data, calls) {
  return {
    week(start) {
      calls.push(start);
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = add(start, index);
        const rows = (data.workouts || []).filter(row => row.date === date);
        const sessions = (data.sessions && data.sessions[date]) || [];
        return {
          date,
          gym: {
            rows,
            sets: rows.reduce((sum, row) => sum + row.sets, 0),
            reps: rows.reduce((sum, row) => sum + row.sets * row.reps, 0),
            volume: rows.reduce((sum, row) => sum + row.sets * row.reps * row.weight, 0),
          },
          sessions,
          load: data.loads && data.loads[date] || { available: false, value: null, statusLabel: null },
        };
      });
      return {
        startDate: start,
        endDate: add(start, 6),
        days,
        prs: { newEvents: (data.prs || []).filter(event => event.date >= start && event.date <= add(start, 6)) },
      };
    },
  };
}
function polarProvider(data) {
  return {
    resolve(date) {
      const activity = data.polarActivity.daily[date] || {};
      const night = data.polarNightlyRecharge.daily[date] || {};
      return {
        activity: { metrics: { steps: activity.steps ?? null, activeMinutes: activity.activeMinutes ?? null } },
        nightly: { metrics: { hrv: night.hrv ?? null, nightHr: night.nightHr ?? null } },
      };
    },
  };
}
function stores() {
  return {
    workouts: [], sessions: {}, loads: {}, prs: [],
    polarSleep: { daily: {} }, polarActivity: { daily: {} }, polarNightlyRecharge: { daily: {} },
    journal: { schemaVersion: 1, daily: { '2026-08-20': { date: '2026-08-20' } } },
  };
}
function options(data, calls = []) {
  return { today: TODAY, data, signalModel: makeSignal(data, calls), sleepIntelligence: sleep, polarIntelligence: polarProvider(data) };
}
function fillActivity(data, start, count, steps, activeMinutes) {
  for (let index = 0; index < count; index += 1) data.polarActivity.daily[add(start, index)] = { steps, activeMinutes };
}
function run(name, fn) { fn(); process.stdout.write(`✓ ${name}\n`); }

run('completed 10-16 August compares only with completed 3-9 August through the canonical provider', () => {
  const data = stores(), calls = [];
  data.workouts.push(
    { date: '2026-08-03', sets: 2, reps: 10, weight: 50, rpe: 7 },
    { date: '2026-08-10', sets: 3, reps: 10, weight: 50, rpe: 7.5 },
    { date: '2026-08-11', sets: 2, reps: 8, weight: 50, rpe: 8 },
  );
  data.sessions['2026-08-03'] = [{ id: 'polar-prev-gym', activityKey: 'strength', durationMinutes: 40 }];
  data.sessions['2026-08-10'] = [{ id: 'polar-current-gym-1', activityKey: 'strength', durationMinutes: 50 }];
  data.sessions['2026-08-11'] = [{ id: 'polar-current-gym-2', activityKey: 'strength', durationMinutes: 30 }];
  const current = weekly.buildWeek('2026-08-10', options(data, calls));
  const previous = weekly.buildWeek('2026-08-03', options(data, calls));
  const comparison = weekly.compare(current, previous);
  assert.deepEqual(calls, ['2026-08-10', '2026-08-03']);
  assert.deepEqual([current.startDate, current.endDate], ['2026-08-10', '2026-08-16']);
  assert.deepEqual([previous.startDate, previous.endDate], ['2026-08-03', '2026-08-09']);
  assert.equal(current.training.sessions, 2);
  assert.equal(comparison.sessions, 1);
  assert.equal(comparison.durationMinutes, 40);
  assert.equal(comparison.volumePercent, 130);
  assert.equal(comparison.scope, 'full_week');
});

run('two distinct same-day Gym sessionIds both count', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'gym-am', sets: 2, reps: 8, weight: 40, rpe: 7 },
    { date: '2026-08-24', sessionId: 'gym-pm', sets: 2, reps: 8, weight: 45, rpe: 8 },
    { date: '2026-08-24', sessionId: 'gym-am', sets: 1, reps: 12, weight: 10, rpe: 7 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.training.sessions, 2);
  assert.equal(result.strength.sessions, 2);
});

run('same-day two Gym sessions plus unrelated Tennis count as three without duplicating Polar strength', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'gym-am', sets: 2, reps: 8, weight: 40, rpe: 7 },
    { date: '2026-08-24', sessionId: 'gym-pm', sets: 2, reps: 8, weight: 45, rpe: 8 },
  );
  data.sessions['2026-08-24'] = [
    { id: 'polar-strength', activityKey: 'strength', durationMinutes: 45 },
    { id: 'polar-tennis', activityKey: 'tennis', activityName: 'Tenis', durationMinutes: 60 },
  ];
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.training.sessions, 3);
  assert.equal(result.strength.sessions, 2);
});

run('duplicate representations of one physical session do not double-count', () => {
  const data = stores();
  data.sessions['2026-08-24'] = [
    { id: 'polar-tennis-1', activityKey: 'tennis', startTime: '18:00', durationMinutes: 60 },
    { id: 'polar-tennis-1', activityKey: 'tennis', startTime: '18:00', durationMinutes: 60 },
  ];
  assert.equal(weekly.buildWeek('2026-08-24', options(data)).training.sessions, 1);
});

run('active current week shows week-to-date values and suppresses every formal comparison', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-17', sessionId: 'prev-mon', sets: 1, reps: 10, weight: 10 },
    { date: '2026-08-21', sessionId: 'prev-fri-outside-scope', sets: 1, reps: 10, weight: 10 },
    { date: '2026-08-24', sessionId: 'current-mon', sets: 1, reps: 10, weight: 10 },
  );
  const current = weekly.buildWeek('2026-08-24', options(data));
  const previous = weekly.buildWeek('2026-08-17', options(data));
  const comparison = weekly.compare(current, previous);
  const html = weekly.render(current, previous, TODAY);
  assert.equal(current.coverageDays, 4);
  assert.equal(current.training.sessions, 1);
  assert.equal(previous.safeEndDate, '2026-08-23');
  assert.equal(previous.training.sessions, 2);
  assert.equal(comparison.sessions, null);
  assert.equal(comparison.volumePercent, null);
  assert.equal(comparison.reasons.sessions, 'active_week');
  assert.equal(comparison.scope, 'active_week');
  assert.match(html, /Hafta devam ediyor — haftalık karşılaştırma Pazar sonunda tamamlanacak\./);
  assert.equal((html.match(/Hafta devam ediyor/g) || []).length, 1);
  assert.doesNotMatch(html, /SIMURG WEEKLY/);
  assert.doesNotMatch(html, /Bu hafta \/ Geçen hafta|geçen haftaya göre|Karşılaştırma yok/);
});

run('completed 3/7 Steps versus previous 7/7 keeps the raw total but blocks the total delta', () => {
  const data = stores();
  fillActivity(data, '2026-08-03', 7, 8000, 60);
  fillActivity(data, '2026-08-10', 3, 10000, 70);
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  const html = weekly.render(current, previous, TODAY);
  assert.deepEqual(current.polar.steps, { value: 30000, sampleSize: 3 });
  assert.equal(comparison.stepsPercent, null);
  assert.equal(comparison.reasons.stepsPercent, 'insufficient_samples');
  assert.match(html, /Adım[\s\S]*?30\.000[\s\S]*?Yetersiz veri[\s\S]*?3\/7 gün/);
});

run('completed 3/7 Active Duration versus previous 7/7 blocks the duration delta', () => {
  const data = stores();
  fillActivity(data, '2026-08-03', 7, 8000, 60);
  fillActivity(data, '2026-08-10', 3, 10000, 70);
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  assert.deepEqual(current.polar.activeMinutes, { value: 210, sampleSize: 3 });
  assert.equal(comparison.activeMinutes, null);
  assert.equal(comparison.reasons.activeMinutes, 'insufficient_samples');
  assert.match(weekly.render(current, previous, TODAY), /Aktif süre[\s\S]*?3sa 30dk[\s\S]*?Yetersiz veri[\s\S]*?3\/7 gün/);
});

run('two completed 7/7 activity weeks compare whole-week totals correctly', () => {
  const data = stores();
  fillActivity(data, '2026-08-03', 7, 8000, 60);
  fillActivity(data, '2026-08-10', 7, 10000, 70);
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  assert.deepEqual(current.polar.steps, { value: 70000, sampleSize: 7 });
  assert.deepEqual(current.polar.activeMinutes, { value: 490, sampleSize: 7 });
  assert.equal(comparison.stepsPercent, 25);
  assert.equal(comparison.activeMinutes, 70);
});

run('Gym-only duration contributes once at canonical session level', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'gym-only', sets: 1, reps: 8, weight: 40, durationMinutes: 55 },
    { date: '2026-08-24', sessionId: 'gym-only', sets: 1, reps: 8, weight: 42, durationMinutes: 55 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.training.sessions, 1);
  assert.equal(result.training.durationMinutes, 55);
  assert.equal(result.training.durationSampleSize, 1);
});

run('matching Polar representation of a Gym duration does not double-count', () => {
  const data = stores();
  data.workouts.push({ date: '2026-08-24', sessionId: 'gym-linked', sets: 1, reps: 8, weight: 40, durationMinutes: 55 });
  data.sessions['2026-08-24'] = [{ id: 'polar-linked', sessionId: 'gym-linked', activityKey: 'strength', durationMinutes: 55 }];
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.training.sessions, 1);
  assert.equal(result.training.durationMinutes, 55);
});

run('two same-day Gym sessionIds retain distinct durations', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'gym-am', sets: 1, reps: 8, weight: 40, durationMinutes: 35 },
    { date: '2026-08-24', sessionId: 'gym-pm', sets: 1, reps: 8, weight: 45, durationMinutes: 50 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.training.sessions, 2);
  assert.equal(result.training.durationMinutes, 85);
  assert.equal(result.training.durationSampleSize, 2);
});

run('incomplete session duration coverage is surfaced without invented minutes', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'timed', sets: 1, reps: 8, weight: 40, durationMinutes: 45 },
    { date: '2026-08-25', sessionId: 'untimed', sets: 1, reps: 8, weight: 45 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  const html = weekly.render(result, null, TODAY);
  assert.equal(result.training.durationMinutes, 45);
  assert.equal(result.training.durationSampleSize, 1);
  assert.equal(result.training.durationComplete, false);
  assert.match(html, /45dk[\s\S]*?1\/2 seans süreli/);
});

run('training-day count uses unique canonical session dates and stays separate from session count', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'am', sets: 1, reps: 8, weight: 40 },
    { date: '2026-08-24', sessionId: 'pm', sets: 1, reps: 8, weight: 45 },
    { date: '2026-08-26', sessionId: 'wed', sets: 1, reps: 8, weight: 50 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.deepEqual([result.training.days, result.training.sessions], [2, 3]);
  assert.match(weekly.render(result, null, TODAY), /Antrenman günü[\s\S]*?>2<[\s\S]*?3 seans/);
});

run('average RPE weights canonical Gym sessions equally despite unequal row counts', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sessionId: 'many-rows', sets: 1, reps: 8, weight: 40, rpe: 6 },
    { date: '2026-08-24', sessionId: 'many-rows', sets: 1, reps: 8, weight: 42, rpe: 6 },
    { date: '2026-08-24', sessionId: 'many-rows', sets: 1, reps: 8, weight: 44, rpe: 6 },
    { date: '2026-08-25', sessionId: 'one-row', sets: 1, reps: 8, weight: 45, rpe: 10 },
    { date: '2026-08-26', sessionId: 'missing-rpe', sets: 1, reps: 8, weight: 50 },
  );
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.strength.avgRpe, 8);
  assert.equal(result.strength.rpeSampleSize, 2);
  assert.match(weekly.render(result, null, TODAY), /Ort\. seans RPE[\s\S]*?2 seans/);
});

run('different workout types and weekday placement do not affect whole-week comparison', () => {
  const data = stores();
  data.sessions['2026-08-03'] = [{ id: 'previous-strength', activityKey: 'strength', activityName: 'Gym', durationMinutes: 45 }];
  data.sessions['2026-08-15'] = [{ id: 'current-tennis', activityKey: 'tennis', activityName: 'Tenis', durationMinutes: 60 }];
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  assert.equal(current.training.sessions, 1);
  assert.equal(previous.training.sessions, 1);
  assert.equal(comparison.sessions, 0);
  assert.equal(comparison.durationMinutes, 15);
  assert.equal(comparison.scope, 'full_week');
});

run('completed historical week compares full Monday-Sunday periods', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-03', sessionId: 'prev', sets: 1, reps: 10, weight: 10 },
    { date: '2026-08-10', sessionId: 'current-a', sets: 1, reps: 10, weight: 10 },
    { date: '2026-08-16', sessionId: 'current-b', sets: 1, reps: 10, weight: 10 },
  );
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  assert.equal(current.coverageDays, 7);
  assert.equal(previous.coverageDays, 7);
  assert.equal(comparison.sessions, 1);
  assert.equal(comparison.scope, 'full_week');
  assert.equal(comparison.reasons.sessions, null);
});

run('historical and current selected weeks never include records after the safe end date', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-24', sets: 1, reps: 10, weight: 10, rpe: 7 },
    { date: '2026-08-29', sets: 99, reps: 10, weight: 100, rpe: 10 },
  );
  data.sessions['2026-08-24'] = [{ durationMinutes: 20 }];
  data.sessions['2026-08-29'] = [{ durationMinutes: 999 }];
  data.prs.push({ date: '2026-08-29' });
  data.polarActivity.daily['2026-08-24'] = { steps: 5000, activeMinutes: 60 };
  data.polarActivity.daily['2026-08-29'] = { steps: 100000, activeMinutes: 1000 };
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.safeEndDate, TODAY);
  assert.equal(result.strength.volume, 100);
  assert.equal(result.training.durationMinutes, 20);
  assert.equal(result.strength.prCount, 0);
  assert.equal(result.polar.steps.value, 5000);
});

run('week navigation stops when no older trusted history exists', () => {
  const data = stores();
  data.workouts.push({ date: '2026-08-24', sets: 1, reps: 8, weight: 20, rpe: 7 });
  const current = weekly.buildWeek('2026-08-24', options(data));
  const html = weekly.render(current, weekly.buildWeek('2026-08-17', options(data)), TODAY);
  assert.equal(current.hasEarlierData, false);
  assert.match(html, /aria-label="Önceki hafta" disabled/);
});

run('actual sleep is stage-derived and never substituted with time in bed or duration', () => {
  const data = stores();
  data.polarSleep.daily['2026-08-24'] = {
    date: '2026-08-24', startTime: '2026-08-23T22:00:00Z', endTime: '2026-08-24T06:00:00Z',
    durationMinutes: 600, deepSleep: 7200, remSleep: 5400, lightSleep: 12600,
  };
  const result = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(result.polar.actualSleepMinutes, 420);
  assert.notEqual(result.polar.actualSleepMinutes, 600);
  assert.equal(result.polar.actualSleepSampleSize, 1);
});

run('one valid sleep night shows its value but cannot create a weekly sleep trend claim', () => {
  const data = stores();
  for (const date of ['2026-08-03', '2026-08-10']) data.polarSleep.daily[date] = {
    date, startTime: `${date}T00:00:00Z`, endTime: `${date}T08:00:00Z`, deepSleep: 7200, remSleep: 5400, lightSleep: 12600,
  };
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  const html = weekly.render(current, previous, TODAY);
  assert.equal(current.polar.actualSleepMinutes, 420);
  assert.equal(comparison.actualSleepMinutes, null);
  assert.equal(comparison.reasons.actualSleepMinutes, 'insufficient_samples');
  assert.match(html, /Gerçek uyku[\s\S]*?Yetersiz veri/);
  assert.equal((html.match(/Gerçek uyku/g) || []).length, 1);
  assert.doesNotMatch(html, /Gerçek uyku ortalaman .* (?:yükseldi|geriledi|değişmedi)/);
});

run('one valid HRV and Night HR day cannot create declarative trends', () => {
  const data = stores();
  data.polarNightlyRecharge.daily['2026-08-03'] = { hrv: 40, nightHr: 58 };
  data.polarNightlyRecharge.daily['2026-08-10'] = { hrv: 50, nightHr: 55 };
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  const html = weekly.render(current, previous, TODAY);
  assert.equal(comparison.hrv, null);
  assert.equal(comparison.nightHr, null);
  assert.equal(comparison.reasons.hrv, 'insufficient_samples');
  assert.doesNotMatch(html, /HRV [+-]\d|Night HR [+-]\d/);
});

run('active week renders real Polar field names as week-to-date values without deltas', () => {
  const data = stores();
  data.polarSleep.daily['2026-08-25'] = {
    date: '2026-08-25', startTime: '2026-08-24T22:30:00Z', endTime: '2026-08-25T06:30:00Z',
    deepSleep: 7200, remSleep: 5400, lightSleep: 12600,
  };
  data.polarNightlyRecharge.daily['2026-08-25'] = { date: '2026-08-25', heartRateVariabilityAvg: 69, heartRateAvg: 51 };
  data.polarActivity.daily['2026-08-25'] = { date: '2026-08-25', steps: 8400, activeMinutes: 64 };
  const current = weekly.buildWeek('2026-08-24', { ...options(data), polarIntelligence: polar });
  const html = weekly.render(current, null, TODAY);
  assert.equal(current.polar.actualSleepMinutes, 420);
  assert.deepEqual(current.polar.hrv, { value: 69, sampleSize: 1 });
  assert.deepEqual(current.polar.nightHr, { value: 51, sampleSize: 1 });
  assert.match(html, /Gerçek uyku[\s\S]*?7sa[\s\S]*?1 gece/);
  assert.match(html, /HRV[\s\S]*?69[\s\S]*?ms[\s\S]*?1 gece/);
  assert.match(html, /Night HR[\s\S]*?51[\s\S]*?bpm[\s\S]*?1 gece/);
  assert.doesNotMatch(html, /HRV[\s\S]{0,120}[+-]\d|Night HR[\s\S]{0,120}[+-]\d/);
});

run('no prior history produces an unavailable delta instead of fake zero', () => {
  const data = stores();
  data.workouts.push({ date: '2026-08-10', sessionId: 'only-history', sets: 1, reps: 10, weight: 10 });
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const comparison = weekly.compare(current, previous);
  const html = weekly.render(current, previous, TODAY);
  assert.equal(previous.hasPeriodData, false);
  assert.equal(comparison.sessions, null);
  assert.match(html, /Karşılaştırma yok/);
  assert.doesNotMatch(html, />0 seans</);
});

run('Cardio Load weekly average uses only official Polar daily values and keeps latest status separate', () => {
  const data = stores();
  for (const [date, value, statusLabel] of [
    ['2026-08-24', 40, 'Dengeli'], ['2026-08-25', 50, 'Üretken'], ['2026-08-26', 60, 'Dengeli'],
  ]) data.loads[date] = { available: true, value, statusLabel, sourceType: 'official' };
  data.loads['2026-08-27'] = { available: true, value: 1000, statusLabel: 'Fallback', sourceType: 'fallback' };
  const current = weekly.buildWeek('2026-08-24', options(data));
  const html = weekly.render(current, weekly.buildWeek('2026-08-17', options(data)), TODAY);
  assert.equal(current.polar.cardioLoad.value, 50);
  assert.equal(current.polar.cardioLoad.sampleSize, 3);
  assert.equal(current.polar.cardioLoad.latestStatusLabel, 'Dengeli');
  assert.match(html, /Cardio Load · haftalık ort\./);
  assert.match(html, /Son resmi gün durumu: Dengeli/);
  assert.doesNotMatch(html, /Fallback|272,5|1\.000/);
});

run('one official Cardio Load day renders a current-week value with coverage', () => {
  const data = stores();
  data.loads['2026-08-24'] = { available: true, value: 40, statusLabel: 'Dengeli', sourceType: 'official' };
  data.loads['2026-08-25'] = { available: true, value: 500, statusLabel: 'Fallback', sourceType: 'workout-derived' };
  const current = weekly.buildWeek('2026-08-24', options(data));
  assert.equal(current.polar.cardioLoad.value, 40);
  assert.equal(current.polar.cardioLoad.sampleSize, 1);
  assert.match(weekly.render(current, null, TODAY), /Cardio Load · haftalık ort\.[\s\S]*?40[\s\S]*?1 resmi gün/);
});

run('fewer than three official Cardio Load days remain insufficient for a completed week', () => {
  const data = stores();
  data.loads['2026-08-10'] = { available: true, value: 40, statusLabel: 'Dengeli', sourceType: 'official' };
  const current = weekly.buildWeek('2026-08-10', options(data));
  assert.equal(current.polar.cardioLoad.value, null);
  assert.equal(current.polar.cardioLoad.sampleSize, 1);
  assert.match(weekly.render(current, weekly.buildWeek('2026-08-03', options(data)), TODAY), /Cardio Load · haftalık ort\.[\s\S]*?Yetersiz veri[\s\S]*?1 resmi gün/);
});

run('0 PR renders explicitly and large volume uses compact Turkish ton formatting once', () => {
  const data = stores();
  data.workouts.push({ date: '2026-08-24', sessionId: 'volume', sets: 1, reps: 1, weight: 7620 });
  const current = weekly.buildWeek('2026-08-24', options(data));
  const html = weekly.render(current, null, TODAY);
  assert.equal(current.strength.volume, 7620);
  assert.equal(current.strength.prCount, 0);
  assert.match(html, /Gym hacmi[\s\S]*?7,6[\s\S]*?ton/);
  assert.match(html, /<small>PR<\/small><b>0<\/b>/);
  assert.equal((html.match(/7,6/g) || []).length, 1);
  assert.doesNotMatch(html, /Toplam hacim|7\.620 kg/);
});

run('user-facing decimal deltas use Turkish punctuation', () => {
  const data = stores();
  data.workouts.push(
    { date: '2026-08-03', sessionId: 'previous', sets: 1, reps: 1, weight: 1000 },
    { date: '2026-08-10', sessionId: 'current', sets: 1, reps: 1, weight: 1141 },
  );
  for (let index = 0; index < 3; index += 1) {
    data.polarNightlyRecharge.daily[add('2026-08-03', index)] = { hrv: 40, nightHr: 58 };
    data.polarNightlyRecharge.daily[add('2026-08-10', index)] = { hrv: 45.6, nightHr: 58 };
  }
  const current = weekly.buildWeek('2026-08-10', options(data));
  const previous = weekly.buildWeek('2026-08-03', options(data));
  const html = weekly.render(current, previous, TODAY);
  assert.equal(weekly.compare(current, previous).volumePercent, 14.1);
  assert.match(html, /\+%14,1/);
  assert.match(html, /\+5,6 ms/);
  assert.doesNotMatch(html, /14\.1|5\.6 ms/);
});

run('Weekly mobile labels stay readable without changing unrelated typography', () => {
  const css = fs.readFileSync(path.join(ROOT, 'simurg-mobile-weekly.css'), 'utf8');
  assert.match(css, /#weekly\.mwMobileWeekly \.mwPrimary em[\s\S]*?font-size:11px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwMetric span[\s\S]*?font-size:11px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwMetric em[\s\S]*?font-size:10\.5px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwVisual>div small[\s\S]*?font-size:10\.5px!important/);
  assert.match(css, /\.mwWeekNav button\{width:44px;height:44px/);
  assert.doesNotMatch(css, /\.mwPrimaryArc|\.mwPrimaryAccent|border-left-color|transform:rotate/);
  assert.doesNotMatch(css, /font-size:(?:8\.5|9|9\.5)px/);
});

run('primary cards lead with training days, duration, and compact Gym volume without decorative rings', () => {
  const data = stores();
  data.workouts.push({ date: '2026-08-24', sessionId: 'gym', sets: 1, reps: 1, weight: 17997, durationMinutes: 45 });
  const html = weekly.render(weekly.buildWeek('2026-08-24', options(data)), null, TODAY);
  const primary = html.match(/<section class="mwPrimaryGrid">([\s\S]*?)<\/section>/)[1];
  assert.ok(primary.indexOf('Antrenman günü') < primary.indexOf('Toplam süre'));
  assert.ok(primary.indexOf('Toplam süre') < primary.indexOf('Gym hacmi'));
  assert.match(primary, /Antrenman günü[\s\S]*?1 seans/);
  assert.match(primary, /Gym hacmi[\s\S]*?18[\s\S]*?ton/);
  assert.doesNotMatch(primary, /mwPrimaryArc|mwPrimaryAccent/);
});

run('asset versions and service-worker cache generation invalidate stale Weekly bundles', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  for (const asset of ['simurg-mobile-weekly.css?v=2', 'simurg-mobile-weekly.js?v=2']) {
    assert.match(html, new RegExp(asset.replace(/[.?]/g, '\\$&')));
    assert.match(sw, new RegExp(asset.replace(/[.?]/g, '\\$&')));
  }
  assert.match(html, /sw\.js\?v=mobile-system-v1/);
  assert.match(sw, /simurg-mobile-system-v1/);
  assert.doesNotMatch(sw, /simurg-mobile-weekly\.(?:css|js)\?v=1/);
});

run('missing Polar metrics stay null instead of becoming zero', () => {
  const result = weekly.buildWeek('2026-08-24', options(stores()));
  assert.equal(result.polar.actualSleepMinutes, null);
  assert.equal(result.polar.hrv.value, null);
  assert.equal(result.polar.nightHr.value, null);
  assert.equal(result.polar.steps.value, null);
  assert.equal(result.polar.activeMinutes.value, null);
  assert.equal(result.polar.cardioLoad.value, null);
});

run('mobile menu hides Journal while its data contract and stable adjacent surfaces remain intact', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const mobile = fs.readFileSync(path.join(ROOT, 'mobile-ia-premium.js'), 'utf8');
  const source = fs.readFileSync(path.join(ROOT, 'simurg-mobile-weekly.js'), 'utf8');
  const validation = fs.readFileSync(path.join(ROOT, 'simurg-data-validation.js'), 'utf8');
  const desktop = fs.readFileSync(path.join(ROOT, 'desktop-alignment.js'), 'utf8');
  const menu = html.match(/<div class="simurgV8Grid simurgPremiumMenuGrid">([\s\S]*?)<\/div><\/div><nav id="simurgV8Nav"/);
  assert.ok(menu);
  assert.match(menu[1], /Haftalık/);
  assert.match(menu[1], /Antrenman ve vücut özeti/);
  assert.doesNotMatch(menu[1], /Bu hafta ve geçen hafta/);
  assert.doesNotMatch(menu[1], /Journal|simurgV8Go\('journal','menu'\)/);
  assert.match(html, /"journal":\{"schemaVersion":1,"daily":\{\}\}/);
  assert.match(validation, /function validateJournalStore/);
  assert.match(mobile, /patchProgramNameEditor\(\)/);
  assert.match(mobile, /mountGymAccordion\(\)/);
  assert.match(desktop, /else if\(id==='weekly'\)weeklySummary\(\)/);
  assert.match(desktop, /else if\(id==='program'\)program\(\)/);
  assert.doesNotMatch(source, /\b(?:Push|Pull|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/);
  assert.doesNotMatch(source, /Pzt.{0,20}bugün|aynı günleri|maxDays|partial_equivalent/);
});

process.stdout.write('34 Simurg mobile Weekly tests passed.\n');
