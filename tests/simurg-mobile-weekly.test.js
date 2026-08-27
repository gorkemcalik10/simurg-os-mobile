const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const weekly = require('../simurg-mobile-weekly.js');
const sleep = require('../simurg-sleep-intelligence.js');

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
  assert.match(html, /Hafta devam ediyor/);
  assert.match(html, /Haftalık karşılaştırma hafta tamamlandığında oluşacak\./);
  assert.doesNotMatch(html, /Bu hafta \/ Geçen hafta|geçen haftaya göre|Karşılaştırma yok|Yetersiz veri/);
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

run('Cardio Load clearly separates weekly average from latest-day status', () => {
  const data = stores();
  for (const [date, value, statusLabel] of [
    ['2026-08-24', 40, 'Dengeli'], ['2026-08-25', 50, 'Üretken'], ['2026-08-26', 60, 'Dengeli'],
  ]) data.loads[date] = { available: true, value, statusLabel };
  const current = weekly.buildWeek('2026-08-24', options(data));
  const html = weekly.render(current, weekly.buildWeek('2026-08-17', options(data)), TODAY);
  assert.equal(current.polar.cardioLoad.value, 50);
  assert.equal(current.polar.cardioLoad.latestStatusLabel, 'Dengeli');
  assert.match(html, /Cardio Load · haftalık ort\./);
  assert.match(html, /Son gün durumu: Dengeli/);
});

run('Weekly mobile labels stay readable without changing unrelated typography', () => {
  const css = fs.readFileSync(path.join(ROOT, 'simurg-mobile-weekly.css'), 'utf8');
  assert.match(css, /#weekly\.mwMobileWeekly \.mwPrimary em[\s\S]*?font-size:11px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwMetric span[\s\S]*?font-size:11px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwMetric em[\s\S]*?font-size:10\.5px!important/);
  assert.match(css, /#weekly\.mwMobileWeekly \.mwVisual>div small[\s\S]*?font-size:10\.5px!important/);
  assert.match(css, /\.mwWeekNav button\{width:44px;height:44px/);
  assert.doesNotMatch(css, /font-size:(?:8\.5|9|9\.5)px/);
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

process.stdout.write('17 Simurg mobile Weekly tests passed.\n');
