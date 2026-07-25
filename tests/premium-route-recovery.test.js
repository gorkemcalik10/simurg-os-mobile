const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const serviceWorker = read('sw.js');
const gymJs = read('gym-logger-premium.js');
const gymCss = read('gym-logger-premium.css');
const menuJs = read('menu-premium.js');
const menuCss = read('menu-premium.css');

const assets = [
  'gym-logger-premium.css?v=1',
  'gym-logger-premium.js?v=1',
  'menu-premium.css?v=1',
  'menu-premium.js?v=1'
];

for (const asset of assets) {
  assert.match(index, new RegExp(`(?:href|src)="./${asset.replace(/[.?]/g, '\\$&')}"`));
  assert.ok(serviceWorker.includes(`'./${asset}'`), `CORE_ASSETS missing ${asset}`);
}

assert.match(index, /sw\.js\?v=premium-route-recovery-v1/);
assert.match(serviceWorker, /simurg-premium-route-recovery-v1/);

assert.match(gymCss, /@media \(max-width: 900px\)/);
assert.match(gymCss, /#gym\.simurgGymPremiumV1/);
assert.match(gymCss, /#workout\.simurgLoggerPremiumV1/);
assert.match(gymCss, /#trendBars\s*\{[\s\S]*pointer-events:\s*none/);
assert.match(gymJs, /window\.SimurgGymLoggerPremium/);
assert.doesNotMatch(gymJs, /window\.(?:renderGymMode|renderWorkout|saveGymExercise|clearGymExercise|deleteGymExercise)\s*=/);

for (const route of ['coaching', 'program', 'weekly', 'monthly', 'data']) {
  assert.ok(menuJs.includes(`${route}: [`), `Missing premium route metadata: ${route}`);
}
assert.match(menuJs, /window\.SimurgMenuPremium/);
assert.match(menuCss, /@media \(max-width: 900px\)/);
assert.match(menuCss, /#simurgV8Sheet\.simurgMenuPremiumV1/);
assert.match(menuCss, /\.simurgMenuRoutePremiumV1/);
assert.doesNotMatch(menuJs, /window\.(?:simurgV8Go|renderWeeklyReport|renderMonthly|renderCoachPanels)\s*=/);

process.stdout.write('✓ Premium Gym, Günlük and menu-route production assets are wired without replacing core renderers\n');
