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

run('Daily is a selected-day journal and no longer duplicates Home', () => {
  assert.match(mobile, /\(data\.workouts\|\|\[\]\)\.filter\(function\(row\)\{return row&&row\.date===date;\}\)/);
  assert.match(mobile, /GÜN KAYDI/);
  assert.match(mobile, /KAYIT DURUMU/);
  assert.match(mobile, /miaTimeline/);
  assert.match(mobile, /GYM KAYDI/);
  assert.match(mobile, /POLAR AKTİVİTESİ/);
  assert.match(mobile, /GECE & TOPARLANMA/);
  assert.match(mobile, /Günün teknik ayrıntıları/);
  assert.doesNotMatch(mobile, /SIMURG İÇGÖRÜSÜ/);
  assert.match(mobile, /JSON yedeği oluştur/);
});

run('Gym exposes add, remove and primary save actions without changing DATA contracts', () => {
  assert.match(html, /function removeGymSet\(key\)/);
  assert.match(html, /data-gym-action="remove-set"/);
  assert.match(html, /Egzersizi Kaydet/);
  assert.match(html, /if\(action==='remove-set'\) removeGymSet\(key\)/);
  assert.match(css, /\[data-gym-action="save"\]\{display:flex!important/);
  assert.match(mobile, /function compactTarget\(body\)/);
  assert.match(css, /#workout\.miaMobileDaily:not\(\.active\)\{display:none!important/);
  assert.match(css, /html:not\(\[data-simurg-active-key="home"\]\) #simurgStandaloneHint\{display:none!important/);
  assert.match(css, /#gym \.miaGymBody>\.gymSetList\{order:1!important/);
  assert.doesNotMatch(mobile, /DATA\.workouts\s*=|localStorage\.setItem/);
});

run('Polar AccessLink mounts in Data Center on mobile and defers status loading', () => {
  assert.match(polar, /if\(window\.innerWidth<=900\)return document\.getElementById\('mobilePolarSyncHub'\)/);
  assert.match(polar, /if\(window\.innerWidth>900\)\{installObserver\(\);setTimeout\(installObserver,400\);setTimeout\(installObserver,1200\);refreshStatus\(\);\}/);
  assert.match(polar, /window\.SimurgPolarAccessLink=/);
  assert.match(mobile, /window\.SimurgPolarAccessLink\.mount/);
  assert.match(mobile, /simurgMobileOpenPolarDetails/);
});

process.stdout.write('7 mobile IA premium tests passed.\n');
