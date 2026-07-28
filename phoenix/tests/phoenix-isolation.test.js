const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const phoenix = path.join(__dirname, '..');
const repo = path.join(phoenix, '..');
const read = name => fs.readFileSync(path.join(phoenix, name), 'utf8');
const html = read('index.html');
const css = read('phoenix.css');
const app = read('phoenix-app.js');
const router = read('phoenix-router.js');
const adapter = read('phoenix-data-adapter.js');
const components = read('phoenix-components.js');
const worker = read('phoenix-sw.js');
const legacyWorker = fs.readFileSync(path.join(repo, 'sw.js'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('Phoenix is a standalone document with isolated assets', () => {
  for (const asset of ['phoenix-tokens.css', 'phoenix.css', 'phoenix-data-adapter.js', 'phoenix-router.js', 'phoenix-components.js', 'phoenix-app.js']) {
    assert.ok(html.includes(`./${asset}`), asset);
  }
  assert.ok(html.includes('../index.html'));
  assert.doesNotMatch(html, /premium-standard|desktop-alignment|mobile-ia-premium|simurg-coach-ui/);
});

run('legacy entry remains unchanged by Phoenix checkpoint', () => {
  const legacy = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
  assert.doesNotMatch(legacy, /phoenix-app|phoenix-router|data-phoenix-route/);
});

run('mobile information architecture is exactly four plus three', () => {
  assert.match(app, /mobileNav=\[\['home','Ana'\],\['gym','Gym'\],\['daily','Günlük'\],\['menu','Menü'\]\]/);
  assert.match(components, /menuCard\('coaching','Koçluk'/);
  assert.match(components, /menuCard\('program','Program'/);
  assert.match(components, /menuCard\('data','Veri Merkezi'/);
  assert.doesNotMatch(app, /\['polar'|\['weekly'|\['monthly'/);
});

run('router does not mount Polar, weekly or monthly routes', () => {
  assert.match(router, /allowed=\['home','gym','daily','menu','coaching','program','data'\]/);
  assert.doesNotMatch(router, /['"]polar['"]|['"]weekly['"]|['"]monthly['"]/);
});

run('adapter is read-only and uses the existing DATA storage contract', () => {
  assert.match(adapter, /STORAGE_KEY='atlas_summary_reports'/);
  assert.match(adapter, /mode:'read-only'/);
  assert.doesNotMatch(adapter, /setItem|removeItem|clear\(|simurgPersistData|fetch\(/);
  assert.doesNotMatch(adapter, /\braw\s*:/);
});

run('adapter converts existing Simurg records into a detached day snapshot', () => {
  const stored = {
    workouts: [
      { date: '2026-07-28', exercise: 'Bench Press', sets: 1, reps: 8, weight: 80 },
      { date: '2026-07-28', exercise: 'Row', sets: 1, reps: 10, weight: 60 }
    ],
    dailyNotes: [{ date: '2026-07-28', note: 'İyi seans' }],
    appleWatch: [{ date: '2026-07-28', activity: 'Strength' }]
  };
  let writes = 0;
  const context = {
    window: {
      localStorage: {
        getItem: key => key === 'atlas_summary_reports' ? JSON.stringify(stored) : null,
        setItem: () => { writes += 1; }
      }
    },
    console
  };
  vm.runInNewContext(adapter, context);
  const result = context.window.PhoenixDataAdapter.snapshot('2026-07-28');
  assert.equal(result.workout.sets, 2);
  assert.equal(result.workout.reps, 18);
  assert.equal(result.workout.volume, 1240);
  assert.equal(result.daily.note, 'İyi seans');
  assert.equal(writes, 0);
  assert.equal(Object.hasOwn(result, 'raw'), false);
  result.workoutRows[0].weight = 1;
  assert.equal(stored.workouts[0].weight, 80);
});

run('every visible Phoenix button is routed and no inert date button remains', () => {
  assert.doesNotMatch(html, /<button[^>]+id="phoenixDateButton"/);
  const componentButtons = [...components.matchAll(/<button\b([\s\S]*?)>/g)].map(match => match[1]);
  assert.ok(componentButtons.length > 0);
  componentButtons.forEach(attributes => {
    assert.match(attributes, /\bdata-(?:go|route-link)=/);
  });
  assert.match(app, /closest\('\[data-go\],\[data-route-link\]'\)/);
});

run('mobile menu remains active for its three child routes', () => {
  assert.match(app, /item\.dataset\.routeLink==='menu'&&\['coaching','program','data'\]\.indexOf\(route\)>-1/);
});

run('untrusted DATA text is escaped before HTML rendering', () => {
  assert.match(components, /function esc\(value\)/);
  assert.match(components, /map\(esc\)/);
  assert.doesNotMatch(components, /\+snapshot\.daily\.(?:note|notes|summary)\+/);
  assert.doesNotMatch(components, /\+row\.(?:exercise|bodyPart)\+/);
});

run('splash is short, motion-safe and cannot flash white', () => {
  assert.match(app, /setTimeout\(function\(\).*850/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.ps-splash\{[^}]*background:/);
  assert.doesNotMatch(css, /background:\s*(white|#fff(?:fff)?)/i);
});

run('desktop and mobile shells are responsive without legacy selectors', () => {
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(orientation:landscape\)/);
  assert.match(css, /\.ps-bottom-nav\{/);
  assert.match(css, /\.ps-sidebar\{/);
  assert.doesNotMatch(css, /#gym|#workout|#data|\.mobileV8|\.premiumShell/);
});

run('Phoenix owns a narrow service worker scope without changing legacy cache', () => {
  assert.match(app, /register\('\.\/phoenix-sw\.js',\{scope:'\.\/'\}\)/);
  assert.match(worker, /simurg-phoenix-signal-v3/);
  assert.match(worker, /url\.pathname\.indexOf\('\/phoenix\/'\)<0/);
  assert.match(worker, /caches\.open\(CACHE\)\.then\(function\(cache\)/);
  assert.doesNotMatch(worker, /caches\.match\(request\)/);
  assert.doesNotMatch(worker, /premium-standard|desktop-alignment|mobile-ia-premium/);
});

run('legacy worker excludes Phoenix requests and preserves Phoenix caches', () => {
  assert.match(legacyWorker, /function isPhoenixRequest\(url\)/);
  assert.match(legacyWorker, /if \(isPhoenixRequest\(url\)\) return;/);
  assert.match(legacyWorker, /const PHOENIX_CACHE_PREFIX = 'simurg-phoenix-signal-'/);
  assert.match(legacyWorker, /isLegacyCache\(k\) && k !== SIMURG_CACHE/);
  assert.doesNotMatch(legacyWorker, /keys\.filter\(k => k !== SIMURG_CACHE\)/);
});

if (process.exitCode) process.exit(process.exitCode);
