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
    'simurg-exercise-library.js?v=1',
    'simurg-muscle-anatomy.js?v=4',
    'simurg-training-lab-anatomy-assets.js?v=6',
    'simurg-training-lab-anatomy-renderer.js?v=5',
    'simurg-exercise-history.js?v=2',
    'simurg-next-session-target.js?v=2',
    'simurg-coach-engine.js?v=9',
    'simurg-coach-client.js?v=5',
    'simurg-daily-guidance.js?v=1',
    'simurg-coach.css?v=14',
    'simurg-coach-ui.js?v=14',
    'simurg-persistence.js?v=2',
    'simurg-gym-identity.js?v=1',
    'simurg-exercise-canonicalization.js?v=2',
    'simurg-training-lab-analysis.js?v=6',
    'simurg-data-validation.js?v=9',
    'simurg-journal.js?v=1',
    'simurg-journal.css?v=1',
    'simurg-journal-ui.js?v=1',
    'polar-accesslink.js?v=9',
    'premium-standard.css?v=41',
    'premium-standard.js?v=52',
    'desktop-alignment.css?v=27',
    'desktop-alignment.js?v=37',
    'simurg-cloud-auth.js?v=7',
    'mobile-ia-premium.css?v=12',
    'simurg-mobile-weekly.css?v=1',
    'simurg-mobile-weekly.js?v=1',
    'mobile-ia-premium.js?v=11',
    'simurg-gym-flex.js?v=1',
    'simurg-gym-flex.css?v=2',
    'simurg-training-lab.css?v=13',
    'simurg-training-lab-ui.js?v=19'
  ]) {
    assert.match(index, new RegExp(asset.replace(/[.?]/g, '\\$&')));
    assert.match(worker, new RegExp(asset.replace(/[.?]/g, '\\$&')));
  }
  assert.match(index, /sw\.js\?v=daily-guidance-v1/);
  assert.match(worker, /SIMURG_CACHE = 'simurg-daily-guidance-v1'/);
});

if (process.exitCode) process.exit(process.exitCode);
