const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const index = read('index.html');
const premium = read('premium-standard.js');
const desktop = read('desktop-alignment.js');
const cloudAuth = read('simurg-cloud-auth.js');
const sw = read('sw.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('signal model loads before dependent runtimes', () => {
  const modelPos = index.indexOf('simurg-signal-model.js');
  assert.ok(modelPos >= 0);
  assert.ok(modelPos < index.indexOf('premium-standard.js'));
  assert.ok(modelPos < index.indexOf('desktop-alignment.js'));
});

run('service worker registration and cache share one build label', () => {
  const registration = index.match(/serviceWorker\.register\(['"]\.\/sw\.js\?v=([^'"]+)/);
  const cache = sw.match(/SIMURG_CACHE\s*=\s*['"]simurg-([^'"]+)/);
  assert.ok(registration);
  assert.ok(cache);
  assert.equal(registration[1], cache[1]);
});

run('index asset versions match CORE_ASSETS', () => {
  for (const file of ['simurg-signal-model.js', 'premium-standard.js', 'desktop-alignment.js', 'polar-workout.js', 'polar-accesslink.js', 'simurg-cloud-auth.js']) {
    const escaped = file.replace('.', '\\.');
    const indexVersion = index.match(new RegExp(`${escaped}\\?v=([^"']+)`));
    const swVersion = sw.match(new RegExp(`${escaped}\\?v=([^"']+)`));
    assert.ok(indexVersion, `${file} missing from index`);
    assert.ok(swVersion, `${file} missing from CORE_ASSETS`);
    assert.equal(indexVersion[1], swVersion[1], `${file} version mismatch`);
  }
});

run('general render does not invalidate shared aggregates', () => {
  const renderBody = index.match(/function render\(\)\{([^]*?)\n\}/);
  assert.ok(renderBody);
  assert.doesNotMatch(renderBody[1], /SimurgPremium\.dataChanged|SimurgSignalModel\.invalidate/);
});

run('real mutations invalidate while secure cloud push does not', () => {
  assert.match(index, /window\.save=function\(\)\{[^]*?SimurgSignalModel\.invalidate\('local-save'\)/);
  assert.match(cloudAuth, /function persistPulledData\(value\)\{[^]*?localStorage\.setItem\(LOCAL_DATA_KEY/);
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
  const changedRuntime = `${premium}\n${desktop}`;
  assert.doesNotMatch(changedRuntime, /new\s+MutationObserver/);
  assert.doesNotMatch(changedRuntime, /setInterval\s*\(/);
});

if (process.exitCode) process.exit(process.exitCode);
