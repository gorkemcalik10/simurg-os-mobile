const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const persistence = require('../simurg-persistence.js');
const identity = require('../simurg-gym-identity.js');
const validation = require('../simurg-data-validation.js');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let passed = 0;
function run(name, fn) {
  const result=fn();
  if(result&&typeof result.then==='function')return result.then(()=>{passed+=1;process.stdout.write(`✓ ${name}\n`);});
  passed+=1;process.stdout.write(`✓ ${name}\n`);
}
function memoryStorage() {
  const values = new Map();
  return {values,setItem(key,value){values.set(key,String(value));},getItem(key){return values.has(key)?values.get(key):null;},removeItem(key){values.delete(key);}};
}

(async () => {
await run('local persistence success returns an explicit success result', async () => {
  const storage=memoryStorage(),data={workouts:[{date:'2026-08-14',exercise:'Row'}]};
  const result=await persistence.persistData(storage,data);
  assert.equal(result.ok,true);assert.deepEqual(JSON.parse(storage.getItem(persistence.DATA_KEY)),data);
});

await run('startup recovery mode preserves the original stored DATA against every centralized write', async () => {
  const storage=memoryStorage(),original={workouts:[{date:'2026-08-14',exercise:'Original Row'}]};
  storage.setItem(persistence.DATA_KEY,JSON.stringify(original));
  global.__simurgStartupDataRecoveryActive=true;
  try{
    const result=await persistence.persistData(storage,{workouts:[]});
    assert.equal(result.ok,false);assert.equal(result.code,'startup_recovery_active');
    assert.deepEqual(JSON.parse(storage.getItem(persistence.DATA_KEY)),original);
  }finally{delete global.__simurgStartupDataRecoveryActive;}
});

await run('quota exceptions return a Turkish failure without claiming success', async () => {
  const error=Object.assign(new Error('full'),{name:'QuotaExceededError'});
  const result=await persistence.persistData({setItem(){throw error;}},{workouts:[]});
  assert.equal(result.ok,false);assert.equal(result.code,'quota_exceeded');assert.match(result.message,/Kayıt yapılamadı/);assert.doesNotMatch(result.message,/kaydedildi|başarılı/i);
});

run('Safari Private Mode-style storage failures are handled', () => {
  const result=persistence.writeRaw({setItem(){throw new Error('operation is insecure');}},'key','value');
  assert.equal(result.ok,false);assert.equal(result.code,'storage_unavailable');assert.match(result.message,/Girdileriniz ekranda korunuyor/);
});

await run('failed Gym persistence keeps the draft and never advances the card', () => {
  const body=index.match(/async function saveGymExercise\(key\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/const result=await save\(\)/);assert.match(body,/if\(result\.ok\)\{/);
  assert.match(body,/gymSessionDrafts\.delete/);assert.match(body,/openGym\(nextKey/);
  assert.ok(body.indexOf('if(result.ok)')<body.indexOf('gymSessionDrafts.delete'));
  assert.match(body,/return result/);
});

await run('UI save returns failure before render or saved timestamp survives', () => {
  const baseSave=index.match(/async function save\(\)\{([^\n]+)\}/)[1];
  assert.match(baseSave,/if\(!result\.ok\)/);assert.ok(baseSave.indexOf('if(!result.ok)')<baseSave.indexOf('render()'));
  const wrapped=index.match(/window\.save=async function\(\)\{([\s\S]*?)\n  \};/)[1];
  assert.match(wrapped,/const live=DATA/);assert.match(wrapped,/const candidate=JSON\.parse\(JSON\.stringify\(live\)\)/);
  assert.match(wrapped,/await SimurgPersistence\.persistData\(localStorage,prepared\.data/);assert.match(wrapped,/if\(!result\.ok\)/);
  assert.ok(wrapped.indexOf('if(!result.ok)')<wrapped.indexOf('Object.keys(live).forEach'));
  assert.ok(wrapped.indexOf('Object.keys(prepared.data).forEach')<wrapped.indexOf("render()"));
});

await run('failed Gym save does not run target persistence or badge success UI', () => {
  const wrapper=index.match(/if\(typeof oldSaveGym==='function'\) window\.saveGymExercise=async function\(key\)\{([\s\S]*?)\n  \};/)[1];
  assert.match(wrapper,/if\(ret&&ret\.ok\)/);
  assert.ok(wrapper.indexOf('if(ret&&ret.ok)')<wrapper.indexOf('updateStoredTarget'));
});

await run('failed target persistence restores the previous in-memory target', () => {
  const body=index.match(/async function updateStoredTarget\(ex,date\)\{([\s\S]*?)\n  \}/)[1];
  assert.match(body,/hadTarget/);assert.match(body,/previousTarget/);assert.match(body,/if\(!result\.ok\)/);
  assert.match(body,/delete DATA\.autoNextTargets\[ex\]/);
});

run('duplicate display names remain independent by exercise identity', () => {
  const rows=[
    {date:'2026-08-14',exercise:'Cable Fly',exerciseId:'exercise_a',setId:'set_a'},
    {date:'2026-08-14',exercise:'Cable Fly',exerciseId:'exercise_b',setId:'set_b'}
  ];
  assert.deepEqual(identity.indexesFor(rows,0),[0]);assert.deepEqual(identity.indexesFor(rows,1),[1]);
});

run('template overrides use card identity with a legacy name fallback', () => {
  assert.match(index,/const ov=entry\.overrides\[key\]\|\|entry\.overrides\[ex\]\|\|\{\}/);
  assert.match(index,/entry\.overrides\[meta\.key\]=\{name:meta\.name/);
});

run('rename edit and delete selection use identity rather than display name', () => {
  const rows=[
    {date:'2026-08-14',exercise:'Row',exerciseId:'exercise_a'},
    {date:'2026-08-14',exercise:'Row',exerciseId:'exercise_a'},
    {date:'2026-08-14',exercise:'Row',exerciseId:'exercise_b'}
  ];
  const selected=identity.indexesFor(rows,0);selected.forEach(i=>{rows[i].exercise='Chest Supported Row';});
  assert.deepEqual(rows.map(row=>row.exercise),['Chest Supported Row','Chest Supported Row','Row']);
  selected.sort((a,b)=>b-a).forEach(i=>rows.splice(i,1));assert.equal(rows[0].exerciseId,'exercise_b');
});

await run('custom Gym deletion resolves identity before removing the card metadata', () => {
  const body=index.match(/async function deleteGymExercise\(key\)\{([\s\S]*?)\n\}/)[1];
  assert.ok(body.indexOf('const item=gymItemsForDate')<body.indexOf('entry.extras=entry.extras.filter'));
  assert.match(body,/gymRowMatches\(item,w,meta\.name\)/);
});

run('legacy rows load together and gain IDs only when touched', () => {
  const rows=[{date:'2026-08-14',exercise:'Legacy Row'},{date:'2026-08-14',exercise:'Legacy Row'},{date:'2026-08-13',exercise:'Legacy Row'}];
  assert.deepEqual(identity.indexesFor(rows,0),[0,1]);assert.equal(rows[0].exerciseId,undefined);
  const exerciseId=identity.id('exercise'),sessionId=identity.sessionIdFor(rows,'2026-08-14');
  identity.indexesFor(rows,0).forEach(i=>identity.apply(rows[i],{exerciseId,sessionId,setId:identity.setIdFor(rows[i])}));
  assert.equal(rows[0].exerciseId,rows[1].exerciseId);assert.ok(rows[0].setId);assert.equal(rows[2].exerciseId,undefined);
});

run('stable IDs survive JSON restore and cloud-style round trip additively', () => {
  const legacy=validation.prepareFull({schemaVersion:1,workouts:[{date:'2026-08-14',day:'Friday',exercise:'Row',sets:1,reps:8,weight:30,bodyPart:'Back',notes:''}]}).data;
  assert.equal(legacy.workouts[0].exerciseId,undefined);
  identity.apply(legacy.workouts[0],{sessionId:'session_1',exerciseId:'exercise_1',setId:'set_1'});
  const restored=validation.prepareFull(JSON.parse(JSON.stringify(legacy))).data;
  assert.equal(restored.workouts[0].sessionId,'session_1');assert.equal(restored.workouts[0].exerciseId,'exercise_1');assert.equal(restored.workouts[0].setId,'set_1');
  assert.deepEqual(validation.prepareFull({schemaVersion:1}).data.gymDayState,{});
});

run('new Gym sessions capture one stable timing envelope across every row without extra workflow', () => {
  const started = new Date(2026, 7, 29, 10, 0, 0), ended = new Date(2026, 7, 29, 10, 42, 0), date = '2026-08-29', sessionId = 'session_timed';
  const rows = [];
  const firstTiming = identity.sessionTimingFor(rows, date, sessionId, started);
  rows.push({ date, sessionId, exercise:'Squat' }, { date, sessionId, exercise:'Row' });
  identity.applySessionTiming(rows, date, sessionId, firstTiming);
  assert.equal(rows[0].startedAt, started.toISOString()); assert.equal(rows[1].startedAt, rows[0].startedAt); assert.equal(rows[0].durationMinutes, undefined);
  const finishedTiming = identity.sessionTimingFor(rows, date, sessionId, ended);
  identity.applySessionTiming(rows, date, sessionId, finishedTiming);
  assert.equal(rows[0].endedAt, ended.toISOString()); assert.equal(rows[1].endedAt, rows[0].endedAt); assert.equal(rows[0].durationMinutes, 42); assert.equal(rows[1].durationMinutes, 42);
});

run('historical Gym rows without timing are never backfilled when touched', () => {
  const rows = [{ date:'2026-08-24', exercise:'Legacy', sessionId:'legacy-session' }];
  const timing = identity.sessionTimingFor(rows, '2026-08-24', 'legacy-session', new Date(2026, 7, 24, 18, 0, 0));
  identity.applySessionTiming(rows, '2026-08-24', 'legacy-session', timing);
  assert.equal(timing.startedAt, undefined); assert.equal(rows[0].startedAt, undefined); assert.equal(rows[0].durationMinutes, undefined);
});

await run('Gym UI applies timing only through the current successful save transaction', () => {
  const body=index.match(/async function saveGymExercise\(key\)\{([\s\S]*?)\n\}/)[1];
  assert.match(body,/sessionTimingFor\(DATA\.workouts,selectedDate,sessionId\)/); assert.match(body,/applySessionTiming\(DATA\.workouts,selectedDate,sessionId,sessionTiming\)/);
  assert.ok(body.indexOf('applySessionTiming') < body.indexOf('const result=await save()')); assert.match(body,/else DATA=beforeData/);
});

run('all active production local writes use the centralized contract', () => {
  for(const file of ['index.html','simurg-data-validation.js','simurg-cloud-auth.js','polar-accesslink.js','polar-workout.js']){
    const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.doesNotMatch(source,/localStorage\.setItem\(/,file);
  }
});

process.stdout.write(`${passed} storage and stable identity safety tests passed.\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});
