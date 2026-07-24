const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const desktop = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');
const accessLink = fs.readFileSync(path.join(root, 'polar-accesslink.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('desktop Polar header renders one existing sync action', () => {
  assert.equal((desktop.match(/Manuel Senkronizasyon/g) || []).length, 1);
  assert.match(desktop, /connected\?'if\(window\.simurgPolarSyncNow\) window\.simurgPolarSyncNow\(\)'/);
  assert.match(desktop, /Polar Hesabını Bağla/);
  assert.doesNotMatch(desktop, /request\('polar-sync'/);
});

run('desktop Polar sync action follows shared busy and status state', () => {
  assert.match(desktop, /syncBusy\|\|checking\|\|signedOut/);
  assert.match(desktop, /aria-busy=/);
  assert.match(desktop, /dlPolarSyncMessage/);
  assert.match(desktop, /simurg:polar-sync-state/);
});

run('AccessLink publishes status and refreshes existing render system', () => {
  assert.equal((accessLink.match(/window\.simurgPolarSyncNow=async function/g) || []).length, 1);
  assert.match(accessLink, /window\.simurgPolarSyncState=snapshot/);
  assert.match(accessLink, /new CustomEvent\('simurg:polar-sync-state'/);
  assert.match(accessLink, /state\.busy=false;renderCard\(\);refreshExistingViews\(\)/);
  assert.match(accessLink, /if\(typeof render==='function'\)\{render\(\);return;\}/);
});

run('changed production assets use matching cache versions', () => {
  for (const asset of [
    'simurg-volume-model.js?v=1',
    'simurg-data-validation.js?v=3',
    'polar-accesslink.js?v=7',
    'polar-workout.css?v=13',
    'polar-workout.js?v=16',
    'premium-standard.css?v=34',
    'premium-standard.js?v=37',
    'desktop-alignment.css?v=24',
    'desktop-alignment.js?v=29',
    'simurg-cloud-auth.js?v=3'
  ]) {
    assert.match(index, new RegExp(asset.replace(/[.?]/g, '\\$&')));
    assert.match(worker, new RegExp(asset.replace(/[.?]/g, '\\$&')));
  }
  assert.match(index, /sw\.js\?v=premium-ui-fidelity-v1/);
  assert.match(worker, /SIMURG_CACHE = 'simurg-premium-ui-fidelity-v1'/);
});

if (process.exitCode) process.exit(process.exitCode);
