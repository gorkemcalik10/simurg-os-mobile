const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const homeCss = fs.readFileSync(path.join(root, 'premium-standard.css'), 'utf8');
const polar = fs.readFileSync(path.join(root, 'polar-workout.js'), 'utf8');
const polarCss = fs.readFileSync(path.join(root, 'polar-workout.css'), 'utf8');

assert.match(home, /var homeTabs=\['overview','recovery','sleep','load'\]/);
for (const pane of ['overview', 'recovery', 'sleep', 'load']) {
  assert.match(home, new RegExp(`gp-reference-${pane}`));
}
assert.match(home, /if\(window\.innerWidth>900\).*gp-desktop-overview/s);
assert.equal((home.match(/SimurgSignalModel\.load\(date\)/g) || []).length, 1);
assert.match(home, /SimurgSignalModel\.day\(dayDate\)/);
assert.match(home, /hasTimeline\?'<section class="gp-ref-timeline"/);
assert.match(home, /data-gp-polar-date=/);
assert.match(home, /if\(!loadResult\.available\)return '<div class="gp-home-pane active gp-reference-load"/);
assert.match(home, /overviewLoad=model\.loadResult&&model\.loadResult\.available\?model\.load:null/);
assert.doesNotMatch(home, /synthetic_test_fixture|SYNTHETIC TEST DATA/);

assert.match(polar, /var tabs=\['overview','heart','zones','load'\]/);
assert.match(polar, /data-pw-session-index=/);
assert.match(polar, /window\.simurgOpenPolarWorkoutFor=/);
assert.match(polar, /window\.innerWidth<=900\?\{overview:mobileOverview,heart:mobileHeart,zones:mobileZones,load:mobileLoad\}:\{overview:overview,heart:heart,zones:zones,load:load\}/);
assert.match(polar, /data-pw-pane="overview"/);
assert.match(polar, /data-pw-pane="heart"/);
assert.match(polar, /data-pw-pane="zones"/);
assert.match(polar, /data-pw-pane="load"/);

const mobileOverview = polar.slice(polar.indexOf('function mobileOverview'), polar.indexOf('function mobileHeart'));
const mobileHeart = polar.slice(polar.indexOf('function mobileHeart'), polar.indexOf('function zoneDonutCard'));
assert.doesNotMatch(mobileOverview, /chartCard|Nabız Trendi/);
assert.match(mobileHeart, /seriesValues\(workout\)\.length>0/);
assert.match(mobileHeart, /hasSeries\?'<section class="pw-card pw-ref-heart-chart"/);
assert.doesNotMatch(mobileHeart, /pw-chart-empty/);
assert.match(polar, /if\(workout\.trainingLoad==null\)return '<div class="pw-pane active pw-reference-load"[^;]+pw-ref-load-empty/);
assert.doesNotMatch(polar, /synthetic_test_fixture|SYNTHETIC TEST DATA/);

for (const selector of [
  '.gp-ref-readiness', '.gp-ref-horizon', '.gp-ref-recovery-hero',
  '.gp-ref-sleep-hero', '.gp-ref-load-hero'
]) assert.ok(homeCss.includes(`#home.gp-home ${selector}`), `Home reference selector missing: ${selector}`);
assert.match(polarCss, /@media\(max-width:900px\)/);
assert.match(polarCss, /@media\(min-width:901px\)/);
assert.match(polarCss, /\.pw-tab:focus-visible\{outline:1px solid rgba\(32,187,237,.28\)/);
for (const selector of [
  '.pw-ref-metric-grid', '.pw-ref-heart-hero', '.pw-ref-zone-donut',
  '.pw-ref-load-gauge'
]) assert.ok(polarCss.includes(`#polar-workout ${selector}`), `Polar reference selector missing: ${selector}`);

process.stdout.write('✓ Premium UI reference uses mobile-only renderers and existing data contracts\n');
