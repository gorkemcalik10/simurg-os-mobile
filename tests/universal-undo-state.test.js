const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const wrapper = html.match(/const originalUniversal=window\.universalImport;[\s\S]*?window\.universalImport=async function\(\)\{([\s\S]*?)\n    \};\n    window\.__simurgUndoUniversalWrapped=true;/);
assert.ok(wrapper, 'Universal Import undo wrapper must remain discoverable');

(async () => {
  const DATA = { workouts: [] };
  const calls = { snapshot: 0, enhance: 0, snapshotRows: null };
  const marker = { ok: true };
  const context = {
    window: { DATA }, DATA,
    clone: value => JSON.parse(JSON.stringify(value)),
    countData: value => ({ workouts: (value.workouts || []).length }),
    originalUniversal: async () => {
      await Promise.resolve();
      DATA.workouts.push({ sets: 4, reps: 8 });
      return marker;
    },
    snapshotBeforeImport: before => { calls.snapshot += 1; calls.snapshotRows = before.workouts.length; },
    enhanceUniversalImportUI: () => { calls.enhance += 1; },
  };
  vm.runInNewContext(`window.universalImport=async function(){${wrapper[1]}\n};`, context, { filename: 'universal-undo-wrapper.js' });

  const result = await context.window.universalImport();
  assert.equal(result, marker);
  assert.equal(DATA.workouts.length, 1);
  assert.deepEqual(calls, { snapshot: 1, enhance: 1, snapshotRows: 0 });
  process.stdout.write('✓ Universal Import waits for persistence flow before enabling its undo snapshot\n');
})().catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
