const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../simurg-exercise-catalog.js');
const validation = require('../simurg-data-validation.js');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
let passed = 0;
function run(name, fn) { fn(); passed += 1; process.stdout.write(`✓ ${name}\n`); }

run('same display names with different IDs remain separate choices', () => {
  const data={workouts:[
    {date:'2026-08-10',sessionId:'s1',exerciseId:'exercise_a',exercise:'Cable Fly',bodyPart:'Chest'},
    {date:'2026-08-11',sessionId:'s2',exerciseId:'exercise_b',exercise:'Cable Fly',bodyPart:'Upper Chest'}
  ]};
  const items=catalog.entries(data);
  assert.equal(items.length,2);
  assert.deepEqual(items.map(item=>item.exerciseId).sort(),['exercise_a','exercise_b']);
});

run('latest metadata follows the selected identity and is not inferred from a similar name', () => {
  const data={workouts:[
    {date:'2026-08-09',exerciseId:'exercise_a',exercise:'Row',bodyPart:'Back'},
    {date:'2026-08-12',exerciseId:'exercise_a',exercise:'Chest Supported Row',bodyPart:'Upper Back',exerciseType:'strength'},
    {date:'2026-08-13',exerciseId:'exercise_b',exercise:'Chest-Supported Row',bodyPart:'Back'}
  ]};
  const selected=catalog.entries(data).find(item=>item.exerciseId==='exercise_a');
  assert.equal(selected.name,'Chest Supported Row');
  assert.equal(selected.bodyPart,'Upper Back');
  assert.equal(selected.exerciseType,'strength');
  assert.equal(catalog.entries(data).length,2);
});

run('recent list ranks by last use and search only filters without merging', () => {
  const data={workouts:[
    {date:'2026-08-10',sessionId:'s1',exerciseId:'a',exercise:'Incline DB Press',bodyPart:'Chest'},
    {date:'2026-08-14',sessionId:'s2',exerciseId:'b',exercise:'Flat DB Press',bodyPart:'Chest'}
  ]};
  assert.equal(catalog.list(data,'',8)[0].exerciseId,'b');
  assert.deepEqual(catalog.list(data,'incline',8).map(item=>item.exerciseId),['a']);
  assert.equal(catalog.list(data,'inclne',8).length,0);
});

run('new catalog-only movement survives validation and appears before any set exists', () => {
  const data=validation.prepareFull({schemaVersion:1}).data;
  catalog.register(data,{exerciseId:'exercise_new',name:'T-Bar Row',bodyPart:'Back',exerciseType:'strength'});
  const restored=validation.prepareFull(JSON.parse(JSON.stringify(data))).data;
  const item=catalog.entries(restored)[0];
  assert.equal(item.exerciseId,'exercise_new');
  assert.equal(item.bodyPart,'Back');
  assert.equal(item.exerciseType,'strength');
  assert.equal(item.catalogOnly,true);
});

run('registering equal names never reuses or overwrites another identity', () => {
  const data={exerciseCatalog:{}};
  catalog.register(data,{exerciseId:'one',name:'Lateral Raise',bodyPart:'Shoulders'});
  catalog.register(data,{exerciseId:'two',name:'Lateral Raise',bodyPart:'Side Delt'});
  assert.equal(Object.keys(data.exerciseCatalog).length,2);
  assert.equal(data.exerciseCatalog.one.bodyPart,'Shoulders');
  assert.equal(data.exerciseCatalog.two.bodyPart,'Side Delt');
});

run('Gym picker reuses choice identity and keeps future exercise type metadata optional', () => {
  assert.match(index,/SimurgExerciseCatalog\.entries\(DATA\)/);
  assert.match(index,/const before=JSON\.parse\(JSON\.stringify\(DATA\)\),exerciseId=choice\.exerciseId\|\|SimurgGymIdentity\.id\('exercise'\)/);
  assert.match(index,/entry\.extras\.push\(\{id,exerciseId,name:choice\.name,bodyPart:choice\.bodyPart/);
  assert.match(index,/exerciseType:meta\.exerciseType\|\|''/);
  assert.match(index,/Benzer isimler otomatik birleştirilmez/);
  assert.match(index,/"exerciseCatalog":\{\}/);
  assert.match(worker,/simurg-exercise-catalog\.js\?v=1/);
});

process.stdout.write(`${passed} exercise catalog tests passed.\n`);
