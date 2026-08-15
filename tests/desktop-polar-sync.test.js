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
    'simurg-coach-engine.js?v=4',
    'simurg-coach-client.js?v=4',
    'simurg-coach.css?v=6',
    'simurg-coach-ui.js?v=5',
    'simurg-persistence.js?v=1',
    'simurg-gym-identity.js?v=1',
    'simurg-exercise-canonicalization.js?v=1',
    'simurg-data-validation.js?v=5',
    'polar-accesslink.js?v=9',
    'premium-standard.css?v=35',
    'premium-standard.js?v=42',
    'desktop-alignment.css?v=26',
    'desktop-alignment.js?v=34',
    'simurg-cloud-auth.js?v=4',
    'mobile-ia-premium.css?v=10',
    'mobile-ia-premium.js?v=6',
    'simurg-gym-flex.js?v=1',
    'simurg-gym-flex.css?v=2'
  ]) {
    assert.match(index, new RegExp(asset.replace(/[.?]/g, '\\$&')));
    assert.match(worker, new RegExp(asset.replace(/[.?]/g, '\\$&')));
  }
  assert.match(index, /sw\.js\?v=home-simplification-v1/);
  assert.match(worker, /SIMURG_CACHE = 'simurg-home-simplification-v1'/);
});

if (process.exitCode) process.exit(process.exitCode);
