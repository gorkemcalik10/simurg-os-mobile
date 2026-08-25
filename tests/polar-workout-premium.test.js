const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'polar-workout.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'polar-workout.css'), 'utf8');
const desktopSource = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');

function runtime(data = {}) {
  const document = { readyState: 'loading', addEventListener() {} };
  const window = { DATA: data, window: null };
  window.window = window;
  const context = { window, DATA: data, document, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set };
  vm.runInNewContext(source, context, { filename: 'polar-workout.js' });
  return window;
}

function workout(overrides = {}) {
  return {
    date: '2026-08-25', startTime: '09:48:31', duration: '00:48:11',
    workoutType: 'Functional Training', source: 'Polar Flow', device: 'Polar Flow app',
    activeCal: 357, avgHR: 113, maxHR: 143, cardioLoad: 28.9, cardioLoadInterpretation: 'medium',
    zones: { zone1: '00:16:22', zone2: '00:00:35', zone3: '00:00:00', zone4: '00:00:00', zone5: '00:00:00' },
    zoneSummary: { easyControlled: '00:16:57', moderate: '00:00:00', high: '00:00:00', unclassifiedTime: '00:31:14' },
    trainingImpact: {}, ...overrides,
  };
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('premium detail uses one interpretation-first flow without repeated tabs or sections', () => {
  const html = runtime().SimurgPolarWorkoutUI.render(workout());
  assert.equal((html.match(/Nabız Bölgeleri/g) || []).length, 1);
  assert.equal((html.match(/Cardio Load/g) || []).length, 1);
  assert.equal((html.match(/KALP &amp; YOĞUNLUK/g) || []).length, 1);
  assert.equal((html.match(/YÜK &amp; ETKİ/g) || []).length, 1);
  assert.doesNotMatch(html, /pw-tabs|GENEL BAKIŞ|Polar Training Load Pro|Polar Cardio Load yorumu/);
});

run('unavailable provider loads stay omitted while valid Cardio Load remains visible', () => {
  const html = runtime().SimurgPolarWorkoutUI.render(workout({
    muscleLoad: -1, muscleLoadInterpretation: 'NOT_AVAILABLE',
    perceivedLoad: 0, perceivedLoadInterpretation: 'NOT AVAILABLE',
  }));
  assert.match(html, /Cardio Load/);
  assert.match(html, />28\.9</);
  assert.doesNotMatch(html, /Kas yükü|Algılanan yük|NOT[ _-]*AVAILABLE|>-1</);
});

run('low zone coverage is explicit and never upgraded into a confident intensity claim', () => {
  const html = runtime().SimurgPolarWorkoutUI.render(workout());
  assert.match(html, /yalnızca %35.*kalan %65.*kesin bir yoğunluk yorumu yapılamıyor/);
  assert.equal((html.match(/kesin bir yoğunluk yorumu yapılamıyor/g) || []).length, 1);
  assert.match(html, /Sınıflandırılmamış süre/);
  assert.match(html, />31:14</);
  assert.doesNotMatch(html, /toparlanma dostu|düşük-orta yoğunlukta kontrollü/);
});

run('heart chart only renders from detailed samples', () => {
  const withoutSamples = runtime().SimurgPolarWorkoutUI.render(workout());
  const withSamples = runtime().SimurgPolarWorkoutUI.render(workout({ heartRateSeries: [92, 104, 118, 111] }));
  assert.doesNotMatch(withoutSamples, /pw-chart-box/);
  assert.match(withoutSamples, /sahte trend oluşturulmadı/);
  assert.match(withSamples, /pw-chart-box/);
  assert.match(withSamples, /polyline/);
});

run('date history, Latest and multi-session interaction contracts remain wired', () => {
  assert.match(source, /data-pw-date/);
  assert.match(source, /polarWorkoutMoveDate/);
  assert.match(source, /polarWorkoutGoLatest/);
  assert.match(source, /data-pw-session-index/);
  assert.match(source, /polarWorkoutSelectSession/);
  assert.match(source, /simurgOpenPolarWorkoutFor/);
  assert.match(source, /selectedWorkoutKey/);
});

run('responsive layout and bottom navigation spacing cover requested breakpoints', () => {
  assert.match(css, /@media\(max-width:370px\)/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(min-width:901px\)/);
  assert.match(css, /padding-bottom:calc\(104px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(css, /overflow-x:hidden/);
  assert.match(css, /minmax\(0,1fr\)/);
  assert.match(desktopSource, /SimurgPolarWorkoutUI\.render\(workout\)/);
  assert.match(desktopSource, /simurgPolarWorkoutPremium/);
});

if (process.exitCode) process.exit(process.exitCode);
