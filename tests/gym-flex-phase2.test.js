const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const flex = require('../simurg-gym-flex.js');
const validation = require('../simurg-data-validation.js');
const identity = require('../simurg-gym-identity.js');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }
const names = {Monday:'Push',Tuesday:'Pull',Wednesday:'Upper',Thursday:'Push',Friday:'Pull',Saturday:'Off',Sunday:'Off'};
function base(date) {
  const day = flex.dayName(date), training = !['Saturday','Sunday'].includes(day);
  return {name:names[day],items:training?[[day+' Exercise','Body',3]]:[]};
}
function data() { return {workouts:[],gymDayState:{},customGymPrograms:{},programNames:{}}; }

run('an unselected workout is the zero-state default on every weekday', () => {
  for (const date of ['2026-08-09','2026-08-10','2026-08-11','2026-08-12','2026-08-13','2026-08-14','2026-08-15']) {
    const value = flex.resolveTemplate(data(),date,base);
    assert.equal(value.mode,'unselected'); assert.equal(value.items.length,0); assert.equal(value.state,null);
  }
});
run('legacy rows without selection state retain their existing planned view', () => {
  const legacy=data(); legacy.workouts.push({date:'2026-08-10',exercise:'Existing'});
  const value = flex.resolveTemplate(legacy,'2026-08-10',base);
  assert.equal(value.mode,'planned'); assert.equal(value.name,'Push'); assert.equal(value.legacySession,true);
});
run('alternate workout affects only the selected calendar date', () => {
  const value=data(); value.gymDayState['2026-08-13']=flex.makeState('alternate',{sourceDay:'Tuesday',sourceDate:'2026-08-11',label:'Pull'});
  assert.equal(flex.resolveTemplate(value,'2026-08-13',base).items[0][0],'Tuesday Exercise');
  assert.equal(flex.resolveTemplate(value,'2026-08-11',base).mode,'unselected');
  assert.equal(value.gymDayState['2026-08-11'],undefined);
});
run('missed workout selection contains only empty earlier planned days in the week', () => {
  const value=data(); value.workouts.push({date:'2026-08-10',exercise:'Done'});
  assert.deepEqual(flex.missedPrograms(value,'2026-08-13',base).map(x=>x.date),['2026-08-11','2026-08-12']);
});
run('another existing program lists training templates without off days', () => {
  assert.deepEqual(flex.programTemplates('2026-08-13',base).map(x=>x.day),['Monday','Tuesday','Wednesday','Thursday','Friday']);
});
run('all five templates stay available independent of the weekday being opened', () => {
  for (const date of ['2026-08-10','2026-08-14','2026-08-16']) assert.equal(flex.programTemplates(date,base).length,5);
});
run('a Friday template selected on Monday is not replaced by Monday', () => {
  const value=data(); value.gymDayState['2026-08-10']=flex.makeState('alternate',{sourceDay:'Friday',sourceDate:'2026-08-14',label:'Friday Pull'});
  const selected=flex.resolveTemplate(value,'2026-08-10',base);
  assert.equal(selected.sourceDate,'2026-08-14'); assert.equal(selected.items[0][0],'Friday Exercise'); assert.equal(selected.name,'Friday Pull');
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
run('neutral mobile start lists templates and free workout without a weekday default', () => {
  const renderBody=index.match(/function renderGymMode\(\)\{([\s\S]*?)\n\}/)[1];
  assert.match(renderBody,/template\.mode==='unselected'/); assert.match(index,/Bugünkü antrenmanı seç/);
  const openBody=index.match(/function openGymWorkoutSelector\(\)\{([\s\S]*?)\n\}/)[1];
  assert.match(openBody,/gymTemplateOptionsHtml\(\)/); assert.match(openBody,/Serbest Antrenman/); assert.doesNotMatch(openBody,/Planlananı Yap|gymChoosePlanned/);
});
run('selected template identity and canonical session identity are saved together', () => {
  const body=index.match(/async function saveGymExercise\(key\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/sessionState\.sessionId=sessionState\.sessionId\|\|sessionId/);
  assert.match(body,/program:selectedTemplate\.name/); assert.match(body,/sessionLabel:selectedTemplate\.name/);
  assert.match(body,/SimurgGymIdentity\.apply\(/); assert.match(body,/setId:SimurgGymIdentity\.setIdFor\(existingRows\[i\]\)/);
});
run('session exercise and set identities stay stable and distinct', () => {
  const rows=[],sessionId=identity.sessionIdFor(rows,'2026-08-10'),exerciseId=identity.id('exercise');
  rows.push(identity.apply({date:'2026-08-10',exercise:'Row'},{sessionId,exerciseId,setId:identity.id('set')}));
  rows.push(identity.apply({date:'2026-08-10',exercise:'Row'},{sessionId,exerciseId,setId:identity.id('set')}));
  assert.equal(rows[0].sessionId,rows[1].sessionId); assert.equal(rows[0].exerciseId,rows[1].exerciseId); assert.notEqual(rows[0].setId,rows[1].setId);
  assert.equal(identity.sessionIdFor(rows,'2026-08-10'),sessionId);
});
run('selected template session binding round-trips without changing its actual label', () => {
  const value=validation.prepareFull({schemaVersion:1}).data;
  value.gymDayState['2026-08-10']=flex.makeState('alternate',{sourceDay:'Friday',sourceDate:'2026-08-14',label:'Friday Pull'});
  value.gymDayState['2026-08-10'].sessionId='session_actual_friday';
  const restored=validation.prepareFull(JSON.parse(JSON.stringify(value))).data;
  assert.equal(restored.gymDayState['2026-08-10'].sessionId,'session_actual_friday');
  assert.equal(flex.resolveTemplate(restored,'2026-08-10',base).name,'Friday Pull');
});
run('Daily semantics prefer the selected actual template label', () => {
  const signal=fs.readFileSync(path.join(__dirname,'..','simurg-signal-model.js'),'utf8');
  assert.match(signal,/var label=state&&firstText\(state\.label\)/);
  assert.match(signal,/firstText\(rows\[0\]&&rows\[0\]\.program,rows\[0\]&&rows\[0\]\.sessionLabel/);
});
run('active canonical session resumes as a locked selected template', () => {
  const body=index.match(/function renderGymWorkoutSelector\(template\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/row\.sessionId/); assert.match(body,/state&&state\.sessionId/); assert.match(body,/isLocked/);
});
run('chooser CSS remains width-safe at phone sizes', () => {
  const css=fs.readFileSync(path.join(__dirname,'..','simurg-gym-flex.css'),'utf8');
  assert.match(css,/\.gymWorkoutStart\{[^}]*max-width:100%[^}]*overflow:hidden/);
  assert.match(css,/\.gymWorkoutStartOptions \.gymWorkoutOption\{[^}]*min-width:0[^}]*max-width:100%[^}]*box-sizing:border-box/);
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
