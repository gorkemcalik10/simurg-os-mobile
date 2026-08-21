const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const desktop = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');
const model = fs.readFileSync(path.join(root, 'simurg-signal-model.js'), 'utf8');
const coachClient = fs.readFileSync(path.join(root, 'simurg-coach-client.js'), 'utf8');
const coachEngine = fs.readFileSync(path.join(root, 'simurg-coach-engine.js'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (error) {
    console.error('✗ ' + name);
    throw error;
  }
}

test('shared model exposes the only public load resolver', () => {
  assert.match(model, /window\.SimurgSignalModel=\{day:day,load:loadAt,/);
});

test('mobile home and readiness consume the shared resolver', () => {
  assert.match(premium, /function sharedLoad\(date\).*SimurgSignalModel\.load/s);
  assert.match(premium, /function homeModel\(date\).*loadResult=sharedLoad\(date\)/s);
  assert.match(premium, /function homeModelSignals\(date\).*loadResult=sharedLoad\(date\)/s);
  assert.doesNotMatch(premium, /polarLatest\(data,'polarCardioLoad',date\)/);
});

test('coach consumes the shared daily signal model', () => {
  assert.match(coachClient, /engineOptions\.signalDay=function\(signalDate\)\{return root\.SimurgSignalModel\.day\(signalDate\);\}/);
  assert.match(coachEngine, /sharedDay=options\.signalDay\(date\)/);
  assert.match(coachEngine, /aggregate=sharedDay&&sharedDay\.polarAggregate/);
  assert.doesNotMatch(coachEngine, /row\.cardioLoad,row\.trainingLoad/);
});

test('desktop load views consume exact-date shared results', () => {
  assert.match(desktop, /function dailyMetrics\(date,session\).*polarAggregate/s);
  assert.match(desktop, /function primaryMetrics\(session\).*cardio:workoutCardioLoad\(p\)/s);
  assert.match(desktop, /function polarOverview\(\).*loadDate=polarSelectedDate\(\),load=sharedLoad\(loadDate\)/s);
  assert.match(desktop, /function polarLoad\(\).*date=polarSelectedDate\(\),load=sharedLoad\(date\)/s);
  assert.match(desktop, /function dailySummary\(\).*load=sharedLoad\(date\)/s);
  assert.doesNotMatch(desktop, /latestDaily\('polarCardioLoad'\)/);
});

test('desktop weekly and monthly summaries use shared aggregates', () => {
  assert.match(desktop, /avgLoad=a\.avgLoad==null\?null:round\(a\.avgLoad\)/);
  assert.match(desktop, /loadTrend\(shared\.loads,'#19c7d8',true\)/);
  assert.doesNotMatch(desktop, /monthTrend\(data\(\)\.polarCardioLoad/);
});
