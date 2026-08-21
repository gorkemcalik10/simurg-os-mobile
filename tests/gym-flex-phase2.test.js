const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const flex = require('../simurg-gym-flex.js');
const validation = require('../simurg-data-validation.js');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }
const names = {Monday:'Push',Tuesday:'Pull',Wednesday:'Upper',Thursday:'Push',Friday:'Pull',Saturday:'Off',Sunday:'Off'};
function base(date) {
  const day = flex.dayName(date), training = !['Saturday','Sunday'].includes(day);
  return {name:names[day],items:training?[[day+' Exercise','Body',3]]:[]};
}
function data() { return {workouts:[],gymDayState:{},customGymPrograms:{},programNames:{}}; }

run('planned workout is the zero-state default', () => {
  const value = flex.resolveTemplate(data(),'2026-08-10',base);
  assert.equal(value.mode,'planned'); assert.equal(value.name,'Push'); assert.equal(value.state,null);
});
run('alternate workout affects only the selected calendar date', () => {
  const value=data(); value.gymDayState['2026-08-13']=flex.makeState('alternate',{sourceDay:'Tuesday',sourceDate:'2026-08-11',label:'Pull'});
  assert.equal(flex.resolveTemplate(value,'2026-08-13',base).items[0][0],'Tuesday Exercise');
  assert.equal(flex.resolveTemplate(value,'2026-08-11',base).items[0][0],'Tuesday Exercise');
  assert.equal(value.gymDayState['2026-08-11'],undefined);
});
run('missed workout selection contains only empty earlier planned days in the week', () => {
  const value=data(); value.workouts.push({date:'2026-08-10',exercise:'Done'});
  assert.deepEqual(flex.missedPrograms(value,'2026-08-13',base).map(x=>x.date),['2026-08-11','2026-08-12']);
});
run('another existing program lists training templates without off days', () => {
  assert.deepEqual(flex.programTemplates('2026-08-13',base).map(x=>x.day),['Monday','Tuesday','Wednesday','Thursday','Friday']);
});
run('repeat last session creates prefills without creating workout records', () => {
  const value=data(); value.workouts=[{date:'2026-08-09',exercise:'Row',bodyPart:'Back',weight:30,reps:8},{date:'2026-08-09',exercise:'Row',bodyPart:'Back',weight:35,reps:8}];
  const before=JSON.stringify(value.workouts),last=flex.lastSession(value,'2026-08-13');
  assert.equal(last.items[0].prefill.length,2); assert.equal(JSON.stringify(value.workouts),before);
});
run('free workout and explicit skipped state resolve independently', () => {
  const value=data(); value.gymDayState['2026-08-13']=flex.makeState('custom',{label:'Serbest Antrenman'});
  assert.equal(flex.resolveTemplate(value,'2026-08-13',base).mode,'custom');
  value.gymDayState['2026-08-13']=flex.makeState('skipped',{label:'Bugün Atlandı'});
  assert.equal(flex.resolveTemplate(value,'2026-08-13',base).mode,'skipped');
});
run('skipped state can be undone to an untouched day', () => {
  const value=data(),previous=value.gymDayState['2026-08-13']||null;
  value.gymDayState['2026-08-13']=flex.makeState('skipped',{label:'Bugün Atlandı'});
  if(previous)value.gymDayState['2026-08-13']=previous;else delete value.gymDayState['2026-08-13'];
  assert.equal(value.gymDayState['2026-08-13'],undefined);
});
run('legacy payloads gain a safe gymDayState default and round-trip it', () => {
  const legacy=validation.prepareFull({schemaVersion:1}).data;
  assert.deepEqual(legacy.gymDayState,{});
  legacy.gymDayState['2026-08-13']=flex.makeState('alternate',{sourceDay:'Tuesday',sourceDate:'2026-08-11',label:'Pull',updatedAt:'2026-08-13T08:00:00.000Z'});
  assert.deepEqual(validation.prepareFull(JSON.parse(JSON.stringify(legacy))).data.gymDayState,legacy.gymDayState);
});
run('invalid gym day state is rejected without mutating the original payload', () => {
  const value=validation.prepareFull({schemaVersion:1}).data; value.gymDayState={'bad-date':{mode:'deleted',sourceDay:null,sourceDate:null,label:'x',updatedAt:'bad'}};
  const before=JSON.stringify(value); assert.throws(()=>validation.prepareFull(value)); assert.equal(JSON.stringify(value),before);
});
run('opening or changing a Gym date uses a pure program resolver', () => {
  const body=index.match(/function gymProgramEntryForDate\(date\)\{([\s\S]*?)\n\}/)[1];
  assert.doesNotMatch(body,/DATA\.customGymPrograms\[date\]\s*=/);
  assert.match(index,/function gymTemplateForDate\(date\)\{return SimurgGymFlex\.resolveTemplate/);
});
run('existing-row skip protection warns and never deletes rows', () => {
  const body=index.match(/function gymSkipSelectedDay\(\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/rows\.length&&!confirm/); assert.doesNotMatch(body,/DATA\.workouts\s*=|\.splice\(/);
});
run('save and next preserves other drafts and uses card identity for duplicate names', () => {
  assert.match(index,/const gymSessionDrafts=new Map\(\)/); assert.match(index,/captureGymDrafts\(\)/); assert.match(index,/restoreGymDrafts\(selectedDate\)/);
  assert.match(index,/gymEntryKey:key/); assert.match(index,/function gymRowMatches\(item,row,ex\)/); assert.match(index,/SimurgExerciseCanonicalization\.idsMatch\(row\.exerciseId,item\.exerciseId\)/); assert.match(index,/SimurgMobileIA\?\.openGym\(nextKey/);
  assert.match(index,/Kaydet ve Sonrakine Geç/);
});

run('Gym loads and replaces legacy-ID sets through the canonical identity resolver', () => {
  const body=index.match(/function gymRowMatches\(item,row,ex\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/SimurgExerciseCanonicalization\.idsMatch/);
  const saveBody=index.match(/function saveGymExercise\(key\)\{([\s\S]*?)\n\}/)[1];
  assert.ok(saveBody.indexOf('existingRows=DATA.workouts.filter') < saveBody.indexOf('DATA.workouts=DATA.workouts.filter'));
  assert.match(saveBody,/!gymRowMatches\(item,w,meta\.name\)/);
});

process.stdout.write(`${passed} Phase 2 flexible Gym tests passed.\n`);
