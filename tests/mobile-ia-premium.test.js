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
  assert.match(mobile, /if\(gymActiveKey===key&&next\.body\.parentNode\)\{[\s\S]*?closeGymEntry\(next\);[\s\S]*?gymActiveKey='';[\s\S]*?return;/);
  assert.match(mobile, /if\(gymActiveKey&&gymActiveKey!==key\)closeGymEntry/);
  assert.match(mobile, /document\.createDocumentFragment\(\)/);
  assert.match(mobile, /data-gym-toggle/);
  assert.match(mobile, /window\.renderGymMode=function\(\)\{var result=base\.apply/);
  assert.doesNotMatch(mobile, /DATA\.workouts\s*=|localStorage\.setItem/);
});

run('Daily opens the canonical workout journal with real Gym details', () => {
  const shell = html.match(/<nav id="simurgV8Nav"[\s\S]*?<\/nav>/);
  assert.ok(shell);
  assert.match(shell[0], /data-key="logger" onclick="simurgV8Go\('workout','logger'\)"/);
  assert.match(html, /if\(window\.innerWidth<=900&&id==='daily'\)id='workout'/);
  assert.match(html, /loggerButton\.setAttribute\('onclick',"simurgV8Go\('workout','logger'\)"\)/);
  assert.match(html, /id==='workout'/);
  assert.match(html, /renderProgramDays\(\)/);
  assert.match(html, /renderWeekStrip\(\)/);
  assert.match(html, /renderWorkout\(\)/);
  assert.match(html, /function renderWorkout\(\)/);
  assert.match(html, /let day=dayData\(selectedDate\)/);
  assert.match(html, /let c=calc\(day\)/);
  assert.match(html, /if\(window\.innerWidth<=900\)simurgV8Go\('workout','logger'\)/);
  assert.doesNotMatch(mobile, /else if\(id==='workout'\)renderMobileDaily\(\)/);
  assert.match(css, /#workout\.miaMobileDaily:not\(\.active\)\{display:none!important;\}/);
  assert.match(css, /#workout\.miaMobileDaily\.active\{display:block!important;\}/);
  assert.doesNotMatch(css, /#workout\.miaMobileDaily\{display:block!important;\}/);
  assert.match(css, /html\[data-simurg-active-key="gym"\] #simurgStandaloneHint\{display:none!important;/);
  assert.match(css, /#workout \.dayProgram\{display:none!important;\}/);
  assert.match(css, /#workout \.layout>div:first-child\{order:1!important;/);
  assert.match(css, /#workout \.right\{order:2!important;/);
  assert.match(css, /#workoutGroups \.exName\{[\s\S]*?overflow-wrap:anywhere!important;/);
  assert.match(css, /#workoutGroups \.setTable\{[\s\S]*?table-layout:fixed!important;/);
});

run('mobile Gym and Workout Journal use compact, conflict-proof dashboard rules', () => {
  assert.match(css, /Mobile dashboard density v2/);
  assert.match(css, /#gym\.gp-gym-refined \.topbar h1\{[\s\S]*?font-size:23px!important/);
  assert.match(css, /#gym\.gp-gym-refined \.gymHero\{[\s\S]*?min-height:0!important/);
  assert.match(css, /#workout\.gp-logger-refined \.topbar h1\{[\s\S]*?font-size:23px!important/);
  assert.match(css, /#workout\.gp-logger-refined #workoutGroups :is\(\.menuBtn,\.addSet\)\{display:none!important/);
  assert.match(css, /#workout\.gp-logger-refined #workoutGroups>\.simurg-activity-card\{[\s\S]*?min-height:0!important/);
  assert.match(css, /#workout\.gp-logger-refined \.right\{[\s\S]*?grid-template-columns:1fr!important/);
});

run('mobile Journal navigation and Program cards stay readable without square-card overflow', () => {
  assert.match(css, /Mobile journal navigation \+ Program cards v3/);
  assert.match(css, /#workout\.section\.active\.gp-logger-refined \.topbar \.controls\{[\s\S]*?grid-template-rows:34px 34px!important/);
  assert.match(css, /#workout\.section\.active\.gp-logger-refined \.weekStrip\{[\s\S]*?margin:0 8px 9px!important/);
  assert.match(css, /#program\.section\.active #programReport \.programIntelPremiumGrid\{[\s\S]*?grid-template-columns:1fr!important/);
  assert.match(css, /#program\.section\.active #programReport :is\(\.programIntelPremiumCard,\.programIntelDeltaCard\)\{[\s\S]*?aspect-ratio:auto!important/);
  assert.match(css, /#program\.section\.active #programReport :is\(\.programIntelPremiumText,\.programIntelDeltaText\)\{[\s\S]*?overflow-wrap:anywhere!important/);
});

run('Polar AccessLink mounts in Data Center on mobile and defers status loading', () => {
  assert.match(polar, /if\(window\.innerWidth<=900\)return document\.getElementById\('mobilePolarSyncHub'\)/);
  assert.match(polar, /if\(window\.innerWidth>900\)\{installObserver\(\);setTimeout\(installObserver,400\);setTimeout\(installObserver,1200\);refreshStatus\(\);\}/);
  assert.match(polar, /window\.SimurgPolarAccessLink=/);
  assert.match(mobile, /window\.SimurgPolarAccessLink\.mount/);
  assert.match(mobile, /simurgMobileOpenPolarDetails/);
});

process.stdout.write('8 mobile IA premium tests passed.\n');
