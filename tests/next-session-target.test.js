const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = require('../simurg-next-session-target.js');

function run(name, fn) {
  try { fn(); console.log('✓', name); }
  catch (error) { console.error('✗', name); throw error; }
}

const session = (rows, date='2026-08-14') => [{ date, rows }];

run('safe feedback adds one rep only to the first set', () => {
  const result = target.recommend(session([
    { weight:17.5, reps:8, rpe:7, form:'Good', pain:'None' },
    { weight:17.5, reps:8, rpe:7, form:'Good', pain:'None' },
    { weight:17.5, reps:8, rpe:7, form:'Good', pain:'None' }
  ]));
  assert.equal(result.target, '17,5 kg × 9 / 8 / 8');
  assert.equal(result.label, 'Kontrollü progresyon');
});

run('pain, bad form and high RPE prevent progression', () => {
  for (const unsafe of [
    { rpe:7, form:'Good', pain:'Mild' },
    { rpe:7, form:'Bad', pain:'None' },
    { rpe:9, form:'Good', pain:'None' }
  ]) {
    const result = target.recommend(session([{ weight:20, reps:8, ...unsafe }]));
    assert.equal(result.target, '20 kg × 8');
    assert.equal(result.level, 'danger');
    assert.doesNotMatch(result.text, /20 kg × 9/);
  }
});

run('missing safety feedback holds the exact prior target', () => {
  const result = target.recommend(session([{ weight:12.5, reps:10 }, { weight:12.5, reps:9 }]));
  assert.equal(result.target, '12,5 kg × 10 / 9');
  assert.equal(result.label, 'Hedefi koru');
});

run('non-progressive movement context suppresses an otherwise safe increase', () => {
  const result = target.recommend(session([{ weight:8, reps:12, rpe:6, form:'Good', pain:'None' }]), { allowProgression:false });
  assert.equal(result.target, '8 kg × 12');
  assert.equal(result.level, 'warning');
});

run('aggregate workout rows expand their recorded set count', () => {
  const result = target.recommend(session([{ weight:30, reps:8, sets:3, rpe:7, form:'Good', pain:'None' }]));
  assert.equal(result.target, '30 kg × 9 / 8 / 8');
});

run('empty history requests a controlled baseline instead of inventing a target', () => {
  const result = target.recommend([]);
  assert.equal(result.target, '');
  assert.match(result.text, /Önceki kayıt yok/);
});

run('Gym Mode uses exercise identity and the single target runtime', () => {
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(index.indexOf('simurg-exercise-history.js?v=1') < index.indexOf('simurg-next-session-target.js?v=1'));
  assert.match(index, /let target=buildNextTarget\(item\)/);
  assert.match(index, /exerciseSessions\(identity,\{beforeDate:selDate\(\),limit:3\}\)/);
  assert.match(index, /<b>Next Session Target<\/b>/);
});
