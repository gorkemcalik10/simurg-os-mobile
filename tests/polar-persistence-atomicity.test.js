const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const persistence = require('../simurg-persistence.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'polar-accesslink.js'), 'utf8');

function payload() {
  return {
    workouts: [{ date:'2026-08-30', polarExerciseId:'polar-1', startTime:'09:00', duration:'00:30:00', activityType:'Running' }],
    activity: [{ date:'2026-08-30', activeCalories:420 }],
    counts: { workouts:1, activity:1, sleep:0 },
    connection: { connected:true, status:'connected', lastSyncAt:'2026-08-30T09:30:00.000Z' }
  };
}

function makeRuntime(failure) {
  const data = { marker:'original', polarWorkouts:{daily:{},latest:null} };
  const originalReference = data;
  let storedRaw = JSON.stringify(data);
  let writeLiveSnapshots = [];
  let refreshCount = 0;
  const localStorage = {
    get length() { return 1; },
    key(index) { return index === 0 ? persistence.DATA_KEY : null; },
    getItem(key) { return key === persistence.DATA_KEY ? storedRaw : null; },
    setItem(key, value) {
      writeLiveSnapshots.push(JSON.stringify(data));
      if (failure) throw failure;
      storedRaw = String(value);
    },
    removeItem() {}
  };
  const document = { readyState:'loading', addEventListener(){}, dispatchEvent(){}, getElementById(){ return null; } };
  const window = {
    window:null,
    DATA:data,
    innerWidth:390,
    SimurgPersistence:persistence,
    SimurgCloudAuth:{ async getSession(){ return { access_token:'test-token' }; } },
    SimurgPremium:{ refreshAll(){ refreshCount += 1; } },
    simurgGetData(){ return data; }
  };
  window.window = window;
  const fetch = async () => ({ ok:true, async json(){ return payload(); } });
  const context = {
    window, DATA:data, document, localStorage, fetch, console, Date, Math, Number, String, Object, Array, RegExp, JSON, Map, Set, URL, Uint8Array,
    SIMURG_SUPABASE_URL:'https://example.supabase.co', SIMURG_SUPABASE_KEY:'test-key'
  };
  const instrumented = source.replace('  ready(function(){', '  window.__testMergeSync=mergeSync;\n  ready(function(){');
  vm.runInNewContext(instrumented, context, { filename:'polar-accesslink.js' });
  return {
    data, originalReference,
    mergeSync:window.__testMergeSync,
    syncNow:window.simurgPolarSyncNow,
    state:() => window.SimurgPolarAccessLink.state(),
    stored:() => storedRaw,
    writeLiveSnapshots:() => writeLiveSnapshots.slice(),
    refreshCount:() => refreshCount
  };
}

async function run(name, fn) {
  try { await fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

(async () => {
  await run('successful sync persists the candidate before committing the stable live DATA reference', async () => {
    const runtime = makeRuntime();
    const before = JSON.stringify(runtime.data);
    const result = await runtime.syncNow();
    assert.equal(result.ok, true);
    assert.equal(runtime.data, runtime.originalReference);
    assert.deepEqual(runtime.writeLiveSnapshots(), [before]);
    assert.equal(runtime.data.polarWorkouts.daily['2026-08-30'].length, 1);
    assert.equal(JSON.parse(runtime.stored()).polarWorkouts.daily['2026-08-30'].length, 1);
    assert.equal(runtime.refreshCount(), 1);
    assert.match(runtime.state().message, /Senkron tamamlandı/);
  });

  await run('quota failure leaves live DATA and rendered consumers unchanged and returns failure', async () => {
    const error = Object.assign(new Error('full'), { name:'QuotaExceededError' });
    const runtime = makeRuntime(error);
    const before = JSON.stringify(runtime.data);
    const storedBefore = runtime.stored();
    const result = await runtime.syncNow();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'quota_exceeded');
    assert.equal(JSON.stringify(runtime.data), before);
    assert.equal(runtime.stored(), storedBefore);
    assert.equal(runtime.refreshCount(), 0);
    assert.doesNotMatch(runtime.state().message, /Senkron tamamlandı/);
    assert.match(runtime.state().errorMessage, /güvenle kaydedilemedi/);
    assert.match(runtime.state().errorMessage, /senkronizasyon sonlandırılmadı/);
  });

  await run('other persistence failure has the same atomic behavior', async () => {
    const runtime = makeRuntime(new Error('storage disabled'));
    const before = JSON.stringify(runtime.data);
    const result = await runtime.syncNow();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'storage_unavailable');
    assert.equal(JSON.stringify(runtime.data), before);
    assert.equal(runtime.refreshCount(), 0);
    assert.doesNotMatch(runtime.state().message, /Senkron tamamlandı/);
  });

  if (process.exitCode) process.exit(process.exitCode);
})();
