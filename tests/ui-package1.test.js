const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mobileSource = fs.readFileSync(path.join(root, 'mobile-ia-premium.js'), 'utf8');
const mobileCss = fs.readFileSync(path.join(root, 'simurg-mobile-system.css'), 'utf8');
const premiumCss = fs.readFileSync(path.join(root, 'premium-standard.css'), 'utf8');
const recoverySource = fs.readFileSync(path.join(root, 'simurg-workout-recovery.js'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function mobileRuntime() {
  const document = { readyState: 'loading', addEventListener() {} };
  const window = { innerWidth: 390, addEventListener() {}, window: null };
  window.window = window;
  vm.runInNewContext(mobileSource, {
    window, document, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set,
  }, { filename: 'mobile-ia-premium.js' });
  return window;
}

function row(setCount, reps, weight) {
  const cells = [{ textContent: String(setCount) }, { textContent: String(reps) }, { textContent: String(weight) }];
  return {
    dataset: { setCount: String(setCount), repsPerSet: String(reps) },
    querySelectorAll(selector) { assert.equal(selector, 'td'); return cells; },
  };
}

function card(rows) {
  return { querySelectorAll(selector) { assert.equal(selector, '.setTable tbody tr'); return rows; } };
}

run('exercise library suspends nav and owns a safe internal scrolling viewport', () => {
  assert.match(html, /modal\.classList\.add\('active'\);\s*document\.body\.classList\.add\('gymExerciseLibraryOpen'\)/);
  assert.match(html, /classList\.remove\('gymExerciseLibraryOpen'\)/);
  assert.match(mobileCss, /body\.gymExerciseLibraryOpen #simurgV8Nav\{display:none!important;\}/);
  assert.match(mobileCss, /#exerciseLibraryModal\{[\s\S]*?z-index:2147483001!important/);
  assert.match(mobileCss, /safe-area-inset-bottom/);
  assert.match(mobileCss, /\.exerciseLibraryResults\{[\s\S]*?flex:1 1 auto!important;[\s\S]*?min-height:0!important;[\s\S]*?overflow-y:auto!important/);
  assert.match(mobileCss, /\.exerciseLibraryItem,[\s\S]*?min-height:44px!important/);
});

run('Polar empty state has explicit current ownership without reviving legacy recovery cards', () => {
  assert.match(premiumCss, /\.polarBridgeEmpty[^}]*display:none!important/);
  assert.match(html, /polarDashboardV1 polarDashboardEmptyV1/);
  const emptyBlock = html.match(/if\(!entry\)\{([\s\S]*?)return;/);
  assert.ok(emptyBlock);
  assert.match(emptyBlock[1], /Polar verisi bekleniyor/);
  assert.doesNotMatch(emptyBlock[1], /recoveryCardHtml\(null,b\)/);
  assert.match(mobileCss, /\.polarDashboardV1\.polarDashboardEmptyV1 \.polarBridgeEmpty\{[\s\S]*?display:block!important;[\s\S]*?height:auto!important/);
});

run('Daily preserves canonical rows and expands aggregate set semantics honestly', () => {
  const api = mobileRuntime().SimurgMobileIA;
  assert.deepEqual(JSON.parse(JSON.stringify(api.journalExerciseStats(card([row(1, 8, 20), row(1, 7, 20)])))), { sets: 2, reps: 15, volume: 300 });
  assert.deepEqual(JSON.parse(JSON.stringify(api.journalExerciseStats(card([row(4, 8, 20)])))), { sets: 4, reps: 32, volume: 640 });
  assert.match(html, /data-set-count="\$\{setCount\}" data-reps-per-set="\$\{escapeAttr\(s\.reps\)\}"/);
  assert.match(html, /Toplu kayıt/);
  assert.match(html, /\$\{aggregate\?'<small> \/ set<\/small>':''\}/);
});

run('Data Center destructive/recovery controls declare and enforce prerequisites', () => {
  for (const id of ['workoutRecoveryMergeBtn', 'workoutRecoveryExportBtn', 'workoutRecoveryRollbackBtn']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*disabled`));
  }
  assert.match(html, /undoLastImportBtn[^>]*aria-describedby="undoImportMiniStatus" disabled/);
  assert.match(html, /Henüz geri alınabilir bir import yok\./);
  assert.match(recoverySource, /function updateControls\(\)/);
  assert.match(recoverySource, /pending&&pending\.report&&pending\.report\.missingCount>0/);
  assert.match(recoverySource, /snapshotAvailable\(\)/);
  assert.match(mobileCss, /#data\.section button:disabled/);
  const undoWrapper = html.match(/const originalUniversal=window\.universalImport;([\s\S]*?)window\.__simurgUndoUniversalWrapped=true;/);
  assert.ok(undoWrapper);
  assert.match(undoWrapper[1], /window\.universalImport=async function\(\)/);
  assert.match(undoWrapper[1], /const result=await originalUniversal\.apply\(this,arguments\)/);
  assert.match(undoWrapper[1], /snapshotBeforeImport\(before\);\s*enhanceUniversalImportUI\(\)/);
  assert.doesNotMatch(undoWrapper[1], /setTimeout/);
});

if (process.exitCode) process.exit(process.exitCode);
