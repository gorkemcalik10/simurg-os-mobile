const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<template\b[\s\S]*?<\/template>/gi, '');
const mobile = fs.readFileSync(path.join(root, 'mobile-ia-premium.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'mobile-ia-premium.css'), 'utf8');
const polar = fs.readFileSync(path.join(root, 'polar-accesslink.js'), 'utf8');

function run(name, fn) {
  fn();
  process.stdout.write(`✓ ${name}\n`);
}

run('mobile bottom navigation exposes exactly four primary routes', () => {
  const shell = html.match(/<nav id="simurgV8Nav"[\s\S]*?<\/nav>/);
  assert.ok(shell);
  assert.deepEqual([...shell[0].matchAll(/data-key="([^"]+)"/g)].map(match => match[1]), ['home', 'gym', 'logger', 'menu']);
  assert.doesNotMatch(shell[0], /polar|weekly|monthly/i);
  assert.match(css, /#simurgV8Nav\{grid-template-columns:repeat\(4,1fr\)!important/);
});

run('mobile menu exposes only Coaching, Program and Data Center', () => {
  const grid = html.match(/<div class="simurgV8Grid simurgPremiumMenuGrid">([\s\S]*?)<\/div><\/div><nav id="simurgV8Nav"/);
  assert.ok(grid);
  for (const label of ['Koçluk', 'Program', 'Veri Merkezi']) assert.match(grid[1], new RegExp(label));
  assert.doesNotMatch(grid[1], /Haftalık|Aylık|<b>Polar<\/b>/);
});

run('mobile render lifecycle is route-aware while desktop keeps the full renderer', () => {
  const render = html.match(/function render\(\)\{([\s\S]*?)\n\}\nwindow\.__simurgBaseRender/);
  assert.ok(render);
  assert.match(render[1], /if\(window\.innerWidth<=900\)/);
  assert.match(render[1], /screen==='gym'/);
  assert.match(render[1], /screen==='workout'/);
  assert.match(render[1], /renderProgramDays\(\);renderWeekStrip\(\);renderWorkout\(\);renderGymMode\(\);renderReports\(\);renderDailyReport\(\);renderWeeklyReport\(\)/);
});

run('Gym uses a single-open-card mobile accordion without changing save contracts', () => {
  assert.match(mobile, /if\(gymActiveKey&&gymActiveKey!==key\)closeGymEntry/);
  assert.match(mobile, /document\.createDocumentFragment\(\)/);
  assert.match(mobile, /data-gym-toggle/);
  assert.match(mobile, /window\.renderGymMode=function\(\)\{var result=base\.apply/);
  assert.doesNotMatch(mobile, /DATA\.workouts\s*=|localStorage\.setItem/);
});

run('Daily is selected-day only and keeps detail/export actions compact', () => {
  assert.match(mobile, /\(data\.workouts\|\|\[\]\)\.filter\(function\(row\)\{return row&&row\.date===date;\}\)/);
  assert.match(mobile, /SIMURG İÇGÖRÜSÜ/);
  assert.match(mobile, /GÜNÜN GYM ANTRENMANI/);
  assert.match(mobile, /GÜNÜN POLAR AKTİVİTESİ/);
  assert.match(mobile, /Sağlık ve veri ayrıntıları/);
  assert.match(mobile, /JSON yedeği oluştur/);
});

run('Polar AccessLink mounts in Data Center on mobile and defers status loading', () => {
  assert.match(polar, /if\(window\.innerWidth<=900\)return document\.getElementById\('mobilePolarSyncHub'\)/);
  assert.match(polar, /if\(window\.innerWidth>900\)\{installObserver\(\);setTimeout\(installObserver,400\);setTimeout\(installObserver,1200\);refreshStatus\(\);\}/);
  assert.match(polar, /window\.SimurgPolarAccessLink=/);
  assert.match(mobile, /window\.SimurgPolarAccessLink\.mount/);
  assert.match(mobile, /simurgMobileOpenPolarDetails/);
});

process.stdout.write('6 mobile IA premium tests passed.\n');
