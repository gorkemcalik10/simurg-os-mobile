const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const index=read('index.html'),polar=read('polar-accesslink.js'),cloud=read('simurg-cloud-auth.js'),validation=read('simurg-data-validation.js'),workout=read('simurg-workout-recovery.js'),journal=read('simurg-journal-ui.js'),sw=read('sw.js');
function test(name,fn){try{fn();process.stdout.write(`✓ ${name}\n`)}catch(error){process.stderr.write(`✗ ${name}\n${error.stack}\n`);process.exitCode=1}}

test('canonical save result is Promise-based with no Promise-as-truthy checks',()=>{
  assert.match(index,/window\.save=async function\(\)/);
  assert.doesNotMatch(index,/save\(\)\.ok|(?:const|let|var)\s+\w+=save\(\)/);
  assert.match(index,/const result=await save\(\)/);
  assert.match(index,/window\.simurgPersistCandidateData=async function/);
});

test('Polar candidate persistence is awaited before the stable live reference changes',()=>{
  assert.match(polar,/async function mergeSync\(payload\)/);
  assert.match(polar,/var result=await persistCandidate\(data\)/);
  assert.ok(polar.indexOf('var result=await persistCandidate(data)')<polar.indexOf('commitInPlace(live,data)'));
  assert.match(polar,/var persistence=await mergeSync\(payload\)/);
});

test('Cloud Pull awaits local persistence before applying DATA and Push awaits canonical preparation',()=>{
  assert.match(cloud,/async function persistPulledData/);
  assert.match(cloud,/await window\.SimurgPersistence\.requireSuccess/);
  assert.match(cloud,/await persistPulledData\(pulled/);
  assert.match(cloud,/var localData=await requireCurrentData\(\)/);
  assert.ok(cloud.indexOf("persistData(localStorage,value,{source:'authenticated-cloud-pull'})")<cloud.indexOf('replaceInPlace(previousData,value)'));
});

test('validated import/restore and workout recovery await canonical commit',()=>{
  assert.match(validation,/async function commit\(candidate,options\)/);
  assert.match(validation,/await window\.SimurgPersistence\.requireSuccess/);
  assert.match(validation,/reader\.onload=async function/);
  assert.match(validation,/await commit\(prepared\.data/);
  assert.match(workout,/async function merge\(\)/);
  assert.match(workout,/await adapter\.commit\(merged\.data/);
  assert.match(workout,/async function rollback\(\)/);
});

test('Journal, Polar Workout and legacy bridge consumers await success',()=>{
  assert.match(journal,/async function saveEntry\(\)/);
  assert.match(journal,/await save\(\)/);
  assert.match(index,/simurgReceivePolarBridge=async function/);
  assert.match(index,/var persistence=await persist\(\)/);
  assert.match(index,/simurgSavePolarBridgeTestPayload=async function/);
});

test('Data Center exposes read-only migration diagnostics and cache versions are coherent',()=>{
  for(const label of ['Persistence Backend','Migration Durumu','IndexedDB Canonical','Legacy localStorage DATA','Tam-DATA Yedekleri','Origin Depolama Tahmini','Son Depolama Hatası'])assert.match(index,new RegExp(label));
  assert.match(index,/simurg-persistence\.js\?v=5/);
  assert.match(sw,/simurg-persistence\.js\?v=5/);
  assert.match(sw,/simurg-ui-package1-v1/);
  assert.doesNotMatch(sw,/caches\.keys\(\)[\s\S]*caches\.delete/);
});

if(process.exitCode)process.exit(process.exitCode);
