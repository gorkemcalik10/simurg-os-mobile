const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const index = read('index.html');
const premium = read('premium-standard.js');
const desktop = read('desktop-alignment.js');
const coachClient = read('simurg-coach-client.js');
const coachUi = read('simurg-coach-ui.js');
const cloudAuth = read('simurg-cloud-auth.js');
const sw = read('sw.js');
const renderer = read('simurg-training-lab-anatomy-renderer.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('signal model loads before dependent runtimes', () => {
  const volumePos = index.indexOf('simurg-volume-model.js');
  const modelPos = index.indexOf('simurg-signal-model.js');
  const sleepPos = index.indexOf('simurg-sleep-intelligence.js');
  const recoveryPos = index.indexOf('simurg-recovery-intelligence.js');
  const energyPos = index.indexOf('simurg-energy-engine.js');
  assert.ok(volumePos >= 0);
  assert.ok(modelPos >= 0);
  assert.ok(volumePos < modelPos);
  assert.ok(sleepPos > modelPos && sleepPos < recoveryPos && recoveryPos < energyPos);
  assert.ok(modelPos < index.indexOf('premium-standard.js'));
  assert.ok(modelPos < index.indexOf('desktop-alignment.js'));
});

run('coach engine loads as an independent runtime before presentation layers', () => {
  const modelPos = index.indexOf('simurg-signal-model.js');
  const sleepPos = index.indexOf('simurg-sleep-intelligence.js');
  const recoveryPos = index.indexOf('simurg-recovery-intelligence.js');
  const energyPos = index.indexOf('simurg-energy-engine.js');
  const enginePos = index.indexOf('simurg-coach-engine.js');
  const clientPos = index.indexOf('simurg-coach-client.js');
  const guidancePos = index.indexOf('simurg-daily-guidance.js');
  const uiPos = index.indexOf('simurg-coach-ui.js');
  assert.ok(enginePos >= 0);
  assert.ok(enginePos > index.indexOf('simurg-signal-model.js'));
  assert.ok(sleepPos > modelPos && sleepPos < recoveryPos && recoveryPos < energyPos && energyPos < enginePos);
  assert.ok(clientPos > enginePos);
  assert.ok(guidancePos > clientPos);
  assert.ok(uiPos > clientPos);
  assert.ok(enginePos < index.indexOf('premium-standard.js'));
  assert.ok(uiPos < index.indexOf('premium-standard.js'));
  assert.ok(enginePos < index.indexOf('desktop-alignment.js'));
});

run('service worker registration and cache share one build label', () => {
  const registration = index.match(/serviceWorker\.register\(['"]\.\/sw\.js\?v=([^'"]+)/);
  const cache = sw.match(/SIMURG_CACHE\s*=\s*['"]simurg-([^'"]+)/);
  assert.ok(registration);
  assert.ok(cache);
  assert.equal(registration[1], cache[1]);
  assert.match(sw, /function pruneStaleCoreAssetVersions\(cache\)/);
  assert.match(sw, /currentPaths\.has\(url\.pathname\)/);
  assert.match(sw, /!currentUrls\.has\(url\.href\)/);
  assert.match(sw, /cache\.addAll\(CORE_ASSETS\)\.then\(\(\) => pruneStaleCoreAssetVersions\(cache\)\)/);
  assert.match(sw, /caches\.open\(SIMURG_CACHE\)\.then\(pruneStaleCoreAssetVersions\)/);
});

run('index asset versions match CORE_ASSETS', () => {
  for (const file of ['simurg-persistence.js', 'simurg-gym-identity.js', 'simurg-exercise-canonicalization.js', 'simurg-training-lab-analysis.js', 'simurg-volume-model.js', 'simurg-muscle-anatomy.js', 'simurg-training-lab-anatomy-assets.js', 'simurg-training-lab-anatomy-renderer.js', 'simurg-data-validation.js', 'simurg-workout-recovery.js', 'simurg-gym-flex.js', 'simurg-gym-flex.css', 'simurg-signal-model.js', 'simurg-journal.js', 'simurg-journal.css', 'simurg-journal-ui.js', 'simurg-sleep-intelligence.js', 'simurg-recovery-intelligence.js', 'simurg-energy-engine.js', 'simurg-coach-engine.js', 'simurg-coach-client.js', 'simurg-daily-guidance.js', 'simurg-coach-ui.js', 'simurg-coach.css', 'workout-source-policy.js', 'premium-standard.js', 'desktop-alignment.js', 'polar-workout.js', 'polar-accesslink.js', 'simurg-cloud-auth.js', 'simurg-training-lab.css', 'simurg-training-lab-ui.js']) {
    const escaped = file.replace('.', '\\.');
    const indexVersion = index.match(new RegExp(`${escaped}\\?v=([^"']+)`));
    const swVersion = sw.match(new RegExp(`${escaped}\\?v=([^"']+)`));
    assert.ok(indexVersion, `${file} missing from index`);
    assert.ok(swVersion, `${file} missing from CORE_ASSETS`);
    assert.equal(indexVersion[1], swVersion[1], `${file} version mismatch`);
  }
});

run('Training Lab v2 candidate assets are network-first with offline cache fallback', () => {
  assert.match(sw, /url\.pathname\.includes\('\/assets\/training-lab-v2\/'\)/);
  assert.match(sw, /const hasAssetVersion = Boolean\(url\.searchParams\.get\('assetVersion'\)\)/);
  assert.match(sw, /trainingLabV2Asset[\s\S]*fetch\(req\)[\s\S]*isManifest \|\| hasAssetVersion[\s\S]*cache\.put\(req, copy\)[\s\S]*caches\.match\(req\)/);
  assert.match(renderer, /assetVersion='\+encodeURIComponent\(assetVersion\)/);
});

run('general render does not invalidate shared aggregates', () => {
  const renderBody = index.match(/function render\(\)\{([^]*?)\n\}/);
  assert.ok(renderBody);
  assert.doesNotMatch(renderBody[1], /SimurgPremium\.dataChanged|SimurgSignalModel\.invalidate/);
});

run('real mutations invalidate while secure cloud push does not', () => {
  assert.match(index, /window\.save=function\(\)\{[^]*?SimurgSignalModel\.invalidate\('local-save'\)/);
  assert.match(cloudAuth, /function persistPulledData\(value,migrationOriginal,migrationReport\)\{[^]*?SimurgPersistence\.persistData\(localStorage,value\)/);
  const pushBody = cloudAuth.match(/async function pushUserData\(\)\{([^]*?)\n\s*\}/);
  assert.ok(pushBody);
  assert.doesNotMatch(pushBody[1], /SimurgSignalModel\.invalidate/);
});

run('desktop reports consume the shared signal model', () => {
  assert.match(desktop, /SimurgSignalModel\.week/);
  assert.match(desktop, /SimurgSignalModel\.month/);
  assert.match(desktop, /SimurgReadiness\.resolve/);
});

run('forbidden lifecycle mechanisms were not added', () => {
  const changedRuntime = `${premium}\n${desktop}\n${coachClient}\n${coachUi}`;
  assert.doesNotMatch(changedRuntime, /new\s+MutationObserver/);
  assert.doesNotMatch(changedRuntime, /setInterval\s*\(/);
});

if (process.exitCode) process.exit(process.exitCode);
