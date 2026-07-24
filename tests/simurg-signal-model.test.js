const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODEL_SOURCE = fs.readFileSync(path.join(ROOT, 'simurg-signal-model.js'), 'utf8');

function sourceDurationMinutes(value) {
  if (value == null || value === '' || /not_available/i.test(String(value))) return null;
  if (typeof value === 'number') return value;
  const parts = String(value).trim().split(':').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1];
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function makeRuntime(data = {}, selectedDate = '2026-07-17') {
  const listeners = {};
  const window = {
    DATA: data,
    selectedDate,
    SimurgWorkoutSource: {
      durationMinutes: sourceDurationMinutes,
      validApple: () => true,
      day(date) {
        const polarRows = (((data.polarWorkouts || {}).daily || {})[date]) || [];
        const polarList = Array.isArray(polarRows) ? polarRows : [polarRows];
        return {
          gym: (data.workouts || []).filter((row) => row.date === date),
          polar: polarRows,
          primaryPolar: polarList.filter(Boolean)[0] || null,
          apple: (data.appleWatch || []).filter((row) => row.date === date),
        };
      },
    },
    SimurgReadiness: {
      resolve(date) {
        return { date, score: 63, label: 'Kontrollü', confidence: 'Orta', load: 20.3 };
      },
    },
  };
  const context = {
    window,
    DATA: data,
    selectedDate,
    console,
    Map,
    Set,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    RegExp,
    JSON,
    document: {
      readyState: 'loading',
      addEventListener(name, fn) { listeners[name] = fn; },
    },
  };
  window.window = window;
  vm.runInNewContext(MODEL_SOURCE, context, { filename: 'simurg-signal-model.js' });
  return { model: window.SimurgSignalModel, labels: window.SimurgLabels, window, context, listeners };
}

function polar(date, overrides = {}) {
  return {
    date,
    startTime: '10:00:00Z',
    duration: '00:45',
    activityType: 'Functional Training',
    avgHR: 105,
    activeCalories: 292,
    ...overrides,
  };
}

function apple(date, overrides = {}) {
  return {
    date,
    startTime: '10:02',
    duration: '00:45:30',
    activityType: 'Fitness',
    avgHR: 106,
    activeCalories: 300,
    ...overrides,
  };
}

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

run('duration normalization covers text, seconds, minutes and invalid values', () => {
  const date = '2026-07-17';
  const data = {
    polarWorkouts: { daily: { [date]: [
      polar(date, { startTime: '08:00', duration: '00:45' }),
      polar(date, { startTime: '09:00', duration: '00:44:13' }),
      polar(date, { startTime: '10:00', duration: null, durationSeconds: 2700 }),
      polar(date, { startTime: '11:00', duration: null, durationMinutes: 45 }),
      polar(date, { startTime: '12:00', duration: 'NOT_AVAILABLE', durationMinutes: null }),
    ] } },
  };
  const day = makeRuntime(data).model.day(date);
  assert.equal(day.polarSessions[0].durationMinutes, 45);
  assert.ok(Math.abs(day.polarSessions[1].durationMinutes - 44.2167) < 0.001);
  assert.equal(day.polarSessions[2].durationMinutes, 45);
  assert.equal(day.polarSessions[3].durationMinutes, 45);
  assert.equal(day.partialSessions[0].durationMinutes, null);
});

run('cross-source duplicate keeps Polar', () => {
  const date = '2026-07-17';
  const data = {
    polarWorkouts: { daily: { [date]: [polar(date)] } },
    appleWatch: [apple(date)],
  };
  const day = makeRuntime(data).model.day(date);
  assert.equal(day.sessions.length, 1);
  assert.equal(day.sessions[0].source, 'Polar');
});

run('different special activities remain separate', () => {
  const date = '2026-07-17';
  const data = {
    polarWorkouts: { daily: { [date]: [polar(date, { activityType: 'Running' })] } },
    appleWatch: [apple(date, { startTime: '10:01', duration: '00:45', activityType: 'Strength Training' })],
  };
  const day = makeRuntime(data).model.day(date);
  assert.equal(day.sessions.length, 2);
});

run('same-source similar sessions are not collapsed by cross-source dedupe', () => {
  const date = '2026-07-17';
  const data = {
    polarWorkouts: { daily: { [date]: [
      polar(date),
      polar(date, { startTime: '10:02', duration: '00:45:30' }),
    ] } },
  };
  assert.equal(makeRuntime(data).model.day(date).polarSessions.length, 2);
});

run('partial sessions stay in detail but never count in aggregates', () => {
  const month = '2026-07';
  const date = `${month}-17`;
  const data = {
    appleWatch: [apple(date, { duration: 'NOT_AVAILABLE', durationMinutes: null, durationSeconds: null })],
  };
  const runtime = makeRuntime(data);
  const day = runtime.model.day(date);
  const aggregate = runtime.model.month(month);
  assert.equal(day.partialSessions.length, 1);
  assert.equal(day.sessions.length, 0);
  assert.equal(aggregate.activityDays, 0);
  assert.equal(aggregate.activityMinutes, 0);
  assert.equal(aggregate.polarWorkoutCount, 0);
});

run('aggregate day semantics use valid session union', () => {
  const gymDates = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'];
  const data = {
    workouts: gymDates.map((date) => ({ date, exercise: 'Bench Press', sets: 1, reps: 5, weight: 50 })),
    polarWorkouts: { daily: {
      '2026-07-04': [polar('2026-07-04')],
      '2026-07-06': [polar('2026-07-06')],
    } },
    appleWatch: [apple('2026-07-07', { duration: 'NOT_AVAILABLE' })],
  };
  const month = makeRuntime(data).model.month('2026-07');
  assert.equal(month.gymDays, 5);
  assert.equal(month.activityDays, 2);
  assert.equal(month.workoutDays, 6);
  assert.equal(month.polarWorkoutCount, 2);
  assert.equal(month.activityMinutes, 90);
});

run('volume PR compares full exercise session volume', () => {
  const data = { workouts: [
    { date: '2026-07-01', exercise: 'Bench Press', sets: 2, reps: 10, weight: 50 },
    { date: '2026-07-01', exercise: 'Bench Press', sets: 1, reps: 10, weight: 50 },
    { date: '2026-07-08', exercise: 'Bench Press', sets: 1, reps: 5, weight: 110 },
  ] };
  const prs = makeRuntime(data).model.month('2026-07').prs;
  const newer = prs.newEvents.find((event) => event.date === '2026-07-08');
  assert.ok(newer);
  assert.deepEqual(Array.from(newer.types), ['Ağırlık']);
  assert.equal(newer.volume, 550);
});

run('stored targets cannot bypass posture and pain safety', () => {
  const model = makeRuntime({}).model;
  for (const exercise of ['Face Pull', 'Rear Delt Cable Fly', 'Lateral Raise', 'Prone Y Raise']) {
    const target = model.safeTarget(exercise, [{ rpe: 6, form: 'Good', pain: 'None' }], '20 kg × 8 yap; ağırlığı artır');
    assert.match(target, /Ağırlığı koru|kontrol|teknik/i);
    assert.doesNotMatch(target, /20 kg|artır/i);
  }
  const painTarget = model.safeTarget('Bench Press', [{ rpe: 6, form: 'Good', pain: '2' }], '105 kg × 5');
  assert.match(painTarget, /Yük artırma/i);
});

run('readiness is resolved once for the selected day model', () => {
  const runtime = makeRuntime({}, '2026-07-17');
  const result = runtime.model.day('2026-07-17').readiness;
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    date: '2026-07-17', score: 63, label: 'Kontrollü', confidence: 'Orta', load: 20.3,
  });
});

run('central labels translate active system phrases without mutating exercise names', () => {
  const labels = makeRuntime({}).labels;
  assert.equal(labels.ui('Workout Logger'), 'Antrenman Günlüğü');
  assert.equal(labels.ui('Cloud Sync'), 'Bulut Senkronizasyonu');
  assert.equal(labels.sentence('NEXT SESSION TARGET · Readiness · Form / Pain'), 'SONRAKİ ANTRENMAN HEDEFİ · Hazırlık · Form / Ağrı');
  assert.equal(labels.sentence('Incline DB Press'), 'Incline DB Press');
});

run('week and month cache survive reads and invalidate only explicitly', () => {
  const runtime = makeRuntime({ workouts: [{ date: '2026-07-01', exercise: 'Row', sets: 1, reps: 10, weight: 20 }] });
  const first = runtime.model.month('2026-07');
  const second = runtime.model.month('2026-07');
  assert.equal(first, second);
  assert.equal(runtime.model.debugStats().monthHits, 1);
  runtime.model.invalidate('gym-save');
  const third = runtime.model.month('2026-07');
  assert.notEqual(third, first);
  assert.equal(runtime.model.debugStats().invalidations, 1);
});

run('shared load resolves same-date Polar Cardio Load fields', () => {
  const date = '2026-07-24';
  const model = makeRuntime({ polarCardioLoad: { daily: { [date]: {
    date, cardioLoad: 42.6, strain: 38.2, tolerance: 30.1,
    cardioLoadRatio: 1.27, cardioLoadStatus: 'PRODUCTIVE',
  } } } }).model;
  assert.deepEqual(JSON.parse(JSON.stringify(model.load(date))), {
    date, value: 42.6, cardioLoad: 42.6, strain: 38.2, tolerance: 30.1,
    ratio: 1.27, statusRaw: 'PRODUCTIVE', statusLabel: 'Üretken',
    available: true, source: 'Polar Cardio Load', sourceDate: date,
  });
});

run('unavailable next-day load never leaks across dates or becomes zero', () => {
  const first = '2026-07-24';
  const next = '2026-07-25';
  const model = makeRuntime({ polarCardioLoad: { daily: {
    [first]: { date: first, cardioLoad: 42.6, cardioLoadStatus: 'PRODUCTIVE' },
    [next]: { date: next, cardioLoad: 0, strain: 0, tolerance: 0, cardioLoadRatio: 0, cardioLoadStatus: 'LOAD_STATUS_NOT_AVAILABLE' },
  } } }).model;
  assert.equal(model.load(first).value, 42.6);
  assert.equal(model.load(first).sourceDate, first);
  assert.equal(model.load(next).value, null);
  assert.equal(model.load(next).available, false);
  assert.equal(model.load(next).statusLabel, 'Henüz hesaplanmadı');
});

run('real available zero is preserved', () => {
  const date = '2026-07-26';
  const load = makeRuntime({ polarCardioLoad: { daily: { [date]: {
    date, cardioLoad: 0, strain: 0, tolerance: 25, cardioLoadRatio: 0, cardioLoadStatus: 'DETRAINING',
  } } } }).model.load(date);
  assert.equal(load.available, true);
  assert.equal(load.value, 0);
  assert.equal(load.source, 'Polar Cardio Load');
});

run('same-date Polar workout is the first fallback', () => {
  const date = '2026-07-27';
  const load = makeRuntime({ polarWorkouts: { daily: { [date]: [polar(date, { trainingLoad: 18 })] } } }).model.load(date);
  assert.equal(load.value, 18);
  assert.equal(load.source, 'Polar Workout');
  assert.equal(load.strain, null);
  assert.equal(load.tolerance, null);
  assert.equal(load.ratio, null);
});

run('same-date Polar Bridge is used after workout', () => {
  const date = '2026-07-28';
  const load = makeRuntime({ polarBridge: { daily: { [date]: { date, cardioLoad: 12 } } } }).model.load(date);
  assert.equal(load.value, 12);
  assert.equal(load.source, 'Polar Bridge');
});

run('same-date Recovery is used after Bridge', () => {
  const date = '2026-07-29';
  const load = makeRuntime({ recoveryEntries: { [date]: { date, activityLoad: 9 } } }).model.load(date);
  assert.equal(load.value, 9);
  assert.equal(load.source, 'Recovery');
});

run('mismatched embedded source dates are never used', () => {
  const date = '2026-07-24';
  const model = makeRuntime({
    polarCardioLoad: { daily: { [date]: { date: '2026-07-25', cardioLoad: 99, cardioLoadStatus: 'PRODUCTIVE' } } },
    polarBridge: { daily: { [date]: { date: '2026-07-25', cardioLoad: 88 } } },
  }).model;
  assert.equal(model.load(date).available, false);
  assert.equal(model.load(date).source, 'None');
});

run('weekly load average excludes unavailable days and includes real zero', () => {
  const start = '2026-07-20';
  const daily = {
    '2026-07-20': { cardioLoad: 10, cardioLoadStatus: 'PRODUCTIVE' },
    '2026-07-21': { cardioLoad: 20, cardioLoadStatus: 'MAINTAINING' },
    '2026-07-22': { cardioLoad: 30, cardioLoadStatus: 'PRODUCTIVE' },
    '2026-07-23': { cardioLoad: 0, tolerance: 25, cardioLoadStatus: 'DETRAINING' },
    '2026-07-24': { cardioLoad: 0, cardioLoadStatus: 'LOAD_STATUS_NOT_AVAILABLE' },
    '2026-07-25': { cardioLoad: 0, cardioLoadStatus: 'NOT_AVAILABLE' },
    '2026-07-26': { cardioLoad: 0, strain: 0, tolerance: 0, cardioLoadRatio: 0 },
  };
  const week = makeRuntime({ polarCardioLoad: { daily } }).model.week(start);
  assert.deepEqual(Array.from(week.loadSeries), [10, 20, 30, 0, null, null, null]);
  assert.equal(week.loads.filter((item) => item.available).length, 4);
  assert.equal(week.avgLoad, 15);
});

if (process.exitCode) process.exit(process.exitCode);
