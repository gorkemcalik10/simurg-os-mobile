const assert = require('node:assert/strict');
const persistence = require('../simurg-persistence.js');

function storageFrom(entries) {
  const values = new Map(Object.entries(entries));
  return {
    get length(){ return values.size; },
    key(index){ return Array.from(values.keys())[index] ?? null; },
    getItem(key){ return values.has(key) ? values.get(key) : null; },
    setItem(key,value){ values.set(key,String(value)); },
    removeItem(key){ values.delete(key); }
  };
}

async function run(name, fn) {
  try { await fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

(async () => {
  await run('diagnostics reports canonical and exact full-DATA backup sizes without values', async () => {
    const storage = storageFrom({
      atlas_summary_reports:'şDATA',
      simurg_last_import_snapshot_v1:'snapshot',
      simurg_exercise_canonicalization_v1_backup:'exercise-backup',
      'simurg-pre-workout-merge-backup':'workout-backup',
      simurg_install_hint_closed:'1',
      'sb-auth-token':'secret-content'
    });
    const report = await persistence.diagnostics(storage, { storage:{ estimate:async () => ({ usage:1234, quota:9999 }) } });
    assert.equal(report.canonicalBytes, persistence.utf8Bytes('şDATA'));
    assert.equal(report.backupCount, 3);
    assert.equal(report.keyCount, 5);
    assert.equal(report.backupBytes, persistence.utf8Bytes('snapshot') + persistence.utf8Bytes('exercise-backup') + persistence.utf8Bytes('workout-backup'));
    assert.equal(report.topKeys.some(entry => entry.key === 'sb-auth-token'), false);
    assert.equal(JSON.stringify(report).includes('secret-content'), false);
    assert.deepEqual(report.originEstimate, { available:true, usage:1234, quota:9999, label:'Origin düzeyi tahmin; localStorage kotasını kesin olarak göstermez.' });
    assert.equal(report.backend, 'Legacy localStorage fallback');
    assert.equal(report.migrationStatus, 'not_started');
  });

  await run('canonical persistence still succeeds and attaches non-blocking preflight metadata', async () => {
    const storage = storageFrom({ atlas_summary_reports:'{}' });
    const data = { workouts:[{ date:'2026-08-30', exercise:'Row' }] };
    const result = await persistence.persistData(storage, data);
    assert.equal(result.ok, true);
    assert.deepEqual(JSON.parse(storage.getItem(persistence.DATA_KEY)), data);
    assert.equal(result.diagnostics.candidateBytes, persistence.utf8Bytes(JSON.stringify(data)));
    assert.equal(typeof result.diagnostics.warning, 'boolean');
    assert.equal(result.diagnostics.warningIsHeuristic, true);
  });

  if (process.exitCode) process.exit(process.exitCode);
})();
