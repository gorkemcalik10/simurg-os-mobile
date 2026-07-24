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
  assert.match(desktop, /onclick="if\(window\.simurgPolarSyncNow\) window\.simurgPolarSyncNow\(\)"/);
  assert.doesNotMatch(desktop, /request\('polar-sync'/);
});

run('desktop Polar sync action follows shared busy and status state', () => {
  assert.match(desktop, /syncBusy\|\|!syncAvailable\?'disabled':''/);
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
    'simurg-data-validation.js?v=2',
    'polar-accesslink.js?v=6',
    'desktop-alignment.css?v=24',
    'desktop-alignment.js?v=27'
  ]) {
    assert.match(index, new RegExp(asset.replace(/[.?]/g, '\\$&')));
    assert.match(worker, new RegExp(asset.replace(/[.?]/g, '\\$&')));
  }
  assert.match(index, /sw\.js\?v=shared-polar-load-1/);
  assert.match(worker, /SIMURG_CACHE = 'simurg-shared-polar-load-1'/);
});

if (process.exitCode) process.exit(process.exitCode);
