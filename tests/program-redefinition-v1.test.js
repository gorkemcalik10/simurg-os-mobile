const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const mobile = fs.readFileSync(path.join(root, 'mobile-ia-premium.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'mobile-ia-premium.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const validation = require('../simurg-data-validation.js');
const persistence = require('../simurg-persistence.js');

function test(name, fn) {
  fn();
  process.stdout.write('✓ ' + name + '\n');
}

test('mobile Program is a seven-day training plan with Turkish product copy', () => {
  assert.match(mobile, /<h1>Program<\/h1><p>Haftalık antrenman planın<\/p>/);
  assert.match(mobile, /\[0,1,2,3,4,5,6\]\.map/);
  assert.match(mobile, /aria-label="Yedi günlük antrenman planı"/);
});

test('Program reuses canonical plan and exercise data already in memory', () => {
  assert.match(mobile, /window\.SimurgSignalModel\.day\(date\)/);
  assert.match(mobile, /gymItemsForDate\(date\)/);
  assert.match(mobile, /data-exercise-id/);
  assert.doesNotMatch(mobile.match(/function renderMobileProgram\(\)\{([\s\S]*?)\n  \}/)[1], /Coach|resolve\(|setInterval|setTimeout|MutationObserver/);
});

test('day editing delegates to existing persistence and canonical Gym flows', () => {
  assert.match(mobile, /openProgramNameEdit\(day\)/);
  assert.match(mobile, /simurgV8Go\('gym','gym'\)/);
  assert.match(html, /function saveProgramNameEdit\(\)\{[\s\S]*?DATA\.programNames\[editingProgramDay\]=val;[\s\S]*?save\(\);/);
  assert.match(html, /function gymItemsForDate\(date\)/);
  assert.match(html, /exerciseId:x\.exerciseId\|\|x\.id/);
});

test('mobile routing mounts the new Program while legacy analysis remains available', () => {
  assert.match(mobile, /else if\(id==='program'\)renderMobileProgram\(\)/);
  assert.match(mobile, /restoreDesktopProgram\(\)/);
  assert.match(html, /function renderProgramIntelligence\(\)/);
  assert.match(html, /<section id="program"[\s\S]*?<div id="programReport"><\/div>/);
});

test('Program mobile layout is single-column and overflow bounded', () => {
  assert.match(css, /#program\.miaMobileProgram\{[\s\S]*?overflow-x:hidden!important/);
  assert.match(css, /\.miaProgramWeek\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /\.miaProgramDayToggle\{[\s\S]*?grid-template-columns:82px minmax\(0,1fr\) 20px!important/);
});

test('existing persistence round-trip keeps program names and canonical exercise IDs', () => {
  const data = validation.prepareFull({
    schemaVersion: 1,
    programNames: { Monday: 'Push Test' },
    customGymPrograms: {
      '2026-08-10': { overrides: {}, extras: [{ id: 'extra-1', exerciseId: 'canonical-row-1', name: 'Row', bodyPart: 'Back', setCount: 3 }] }
    }
  }).data;
  const storage = { value: '', setItem(key, value) { assert.equal(key, persistence.DATA_KEY); this.value = value; } };
  assert.equal(persistence.persistData(storage, data).ok, true);
  const restored = validation.prepareFull(JSON.parse(storage.value)).data;
  assert.equal(restored.programNames.Monday, 'Push Test');
  assert.equal(restored.customGymPrograms['2026-08-10'].extras[0].exerciseId, 'canonical-row-1');
});
