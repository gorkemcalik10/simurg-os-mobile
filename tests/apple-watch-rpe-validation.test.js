const assert = require('node:assert/strict');
const validation = require('../simurg-data-validation.js');

function payload(rpe) {
  return {
    appleWatch: [{
      date: '2026-07-23',
      activityType: 'Run',
      rpe
    }]
  };
}

function legacy(rpe) {
  return validation.prepareFull(payload(rpe), {
    source: 'validator-runtime-test',
    legacyAppleWatchRpe: true
  }).data.appleWatch[0].rpe;
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('numeric Apple Watch RPE remains numeric', () => {
  assert.equal(legacy(6), 6);
});

for (const [input, expected] of [
  ['6', 6],
  ['6,5', 6.5],
  ['RPE 6', 6],
  ['RPE: 6', 6],
  ['6/10', 6],
  ['RPE 6/10', 6]
]) {
  run(`legacy Apple Watch RPE ${JSON.stringify(input)} normalizes`, () => {
    assert.equal(legacy(input), expected);
  });
}

for (const input of ['', '-', '—', 'N/A', 'NA', 'null', 'unknown']) {
  run(`legacy Apple Watch placeholder ${JSON.stringify(input)} becomes null`, () => {
    assert.equal(legacy(input), null);
  });
}

for (const input of ['hard', 'very tired', 'RPE 6 or 7', '6 7', 11, '11', 'RPE 11', Infinity]) {
  run(`invalid Apple Watch RPE ${JSON.stringify(input)} is rejected`, () => {
    assert.throws(() => legacy(input), error => (
      error
      && error.name === 'SimurgDataValidationError'
      && error.path === '$.appleWatch[0].rpe'
    ));
  });
}

for (const input of ['6', 'RPE 6', '6/10', '-']) {
  run(`active Apple Watch RPE ${JSON.stringify(input)} stays rejected`, () => {
    assert.throws(
      () => validation.prepareFull(payload(input), { source: 'active-entry' }),
      error => error && error.name === 'SimurgDataValidationError'
    );
  });
}

if (process.exitCode) process.exit(process.exitCode);
