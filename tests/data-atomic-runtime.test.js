const assert = require('node:assert/strict');
const validation = require('../simurg-data-validation.js');
const persistence = require('../simurg-persistence.js');

function base() {
  return validation.prepareFull({ workouts: [] }).data;
}
function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

const storage = new Map();
let storageFailure = null;
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { if(storageFailure)throw storageFailure;storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const boxes = {
  universalJsonBox: { value: '' },
  workoutJsonBox: { value: '' },
  watchJsonBox: { value: '' }
};
global.document = { getElementById(id) { return boxes[id] || null; } };
global.alert = () => {};
global.window = {
  SimurgDataValidation: validation,
  SimurgPersistence: persistence,
  SimurgPolarWorkoutNormalize(value) { return { ...value }; }
};

let data = base();
let selectedDate = '2026-07-23';
let renderFailures = 0;
let renderCount = 0;
storage.set('atlas_summary_reports', JSON.stringify(data));
validation.installRuntime({
  getData: () => data,
  setData: value => { data = value; },
  getSelectedDate: () => selectedDate,
  setSelectedDate: value => { selectedDate = value; },
  render() {
    renderCount += 1;
    if (renderFailures > 0) { renderFailures -= 1; throw new Error('render failed'); }
  },
  download() {}
});

run('failed append leaves DATA and localStorage byte-for-byte unchanged', () => {
  const beforeData = JSON.stringify(data);
  const beforeRaw = storage.get('atlas_summary_reports');
  boxes.universalJsonBox.value = JSON.stringify({
    type: 'workout',
    workouts: [{ date: 'invalid', exercise: 'Row', sets: 3, reps: 8, weight: 20 }]
  });
  assert.equal(window.universalImport(), null);
  assert.equal(JSON.stringify(data), beforeData);
  assert.equal(storage.get('atlas_summary_reports'), beforeRaw);
});

run('invalid active Apple Watch RPE leaves DATA and localStorage byte-for-byte unchanged', () => {
  const beforeData = JSON.stringify(data);
  const beforeRaw = storage.get('atlas_summary_reports');
  boxes.universalJsonBox.value = JSON.stringify({
    type: 'activity',
    date: '2026-07-23',
    activityType: 'Run',
    rpe: 'hard'
  });
  assert.equal(window.universalImport(), null);
  assert.equal(JSON.stringify(data), beforeData);
  assert.equal(storage.get('atlas_summary_reports'), beforeRaw);
});

run('quota failure rolls back import and never reports completion', () => {
  const beforeData=JSON.stringify(data),beforeRaw=storage.get('atlas_summary_reports'),messages=[];
  global.alert=message=>messages.push(String(message));
  boxes.universalJsonBox.value=JSON.stringify({type:'workout',workouts:[{date:'2026-07-24',exercise:'Row',sets:1,reps:8,weight:20}]});
  storageFailure=Object.assign(new Error('full'),{name:'QuotaExceededError'});
  assert.equal(window.universalImport(),null);storageFailure=null;
  assert.equal(JSON.stringify(data),beforeData);assert.equal(storage.get('atlas_summary_reports'),beforeRaw);
  assert.ok(messages.some(message=>/başarısız|yapılamadı/i.test(message)));assert.ok(messages.every(message=>!/tamamlandı|içe aktarıldı/i.test(message)));
  global.alert=()=>{};
});

run('render failure rolls back exact DATA, localStorage, date and import snapshot', () => {
  const before = data;
  const beforeRaw = storage.get('atlas_summary_reports');
  const beforeDate = selectedDate;
  storage.set('simurg_last_import_snapshot_v1', 'existing-snapshot');
  const candidate = base();
  candidate.workouts.push({ date: '2026-07-24', exercise: 'Row', sets: 3, reps: 8, weight: 20 });
  renderFailures = 1;
  assert.throws(() => window.SimurgDataAtomic.commit(candidate, {
    source: 'rollback-test', snapshot: true, selectedDate: '2026-07-24'
  }), /render failed/);
  assert.equal(data, before);
  assert.equal(storage.get('atlas_summary_reports'), beforeRaw);
  assert.equal(selectedDate, beforeDate);
  assert.equal(storage.get('simurg_last_import_snapshot_v1'), 'existing-snapshot');
});

run('successful append validates, snapshots, persists and renders once', () => {
  const beforeRender = renderCount;
  boxes.universalJsonBox.value = JSON.stringify({
    type: 'workout',
    workouts: [{ date: '2026-07-24', exercise: 'Row', sets: 3, reps: 8, weight: 20 }]
  });
  const result = window.universalImport();
  assert.equal(result.kind, 'workout');
  assert.equal(data.workouts.length, 1);
  assert.equal(JSON.parse(storage.get('atlas_summary_reports')).workouts.length, 1);
  assert.ok(storage.get('simurg_last_import_snapshot_v1'));
  assert.equal(renderCount, beforeRender + 1);
  assert.equal(selectedDate, '2026-07-24');
});

if (process.exitCode) process.exit(process.exitCode);
