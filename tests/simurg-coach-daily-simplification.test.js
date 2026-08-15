const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const client = require('../simurg-coach-client.js');
const fixtures = require('./simurg-coach-fixtures.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'simurg-coach-ui.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function runtime(scenario) {
  const calls = [];
  const section = { innerHTML: '', classList: { add() {}, remove() {} } };
  const data = clone(scenario.data);
  const context = {
    innerWidth: 390,
    DATA: data,
    selectedDate: scenario.date,
    Intl,
    Date,
    console,
    document: { getElementById: id => id === 'coaching' ? section : null },
    SimurgCoachClient: {
      resolve(type, date, options) {
        calls.push({ type, deferred: !!(options.engineOptions && options.engineOptions.deferTechnical === true) });
        return client.resolve(type, date, { ...options, data, store: false, remote: false });
      }
    }
  };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return { context, calls, section };
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('all six internal decisions have the exact plain-language Daily label', () => {
  const { context } = runtime(fixtures.scenarios[0]);
  assert.deepEqual(
    { ...context.SimurgCoachUI.dailyDecisionLabels },
    { progress:'Bugün biraz ilerleyebilirsin', normal:'Planını aynen uygula', controlled:'Temkinli başla', reduce:'Bugün biraz azalt', recovery:'Hafif gün yap', rest:'Bugün dinlen' }
  );
});

run('mobile Daily first render resolves only daily and pre-workout', () => {
  const { context, calls, section } = runtime(fixtures.scenarios[0]);
  context.SimurgCoachUI.renderMobile();
  assert.deepEqual(calls, [{ type:'daily', deferred:true }, { type:'pre_workout', deferred:true }]);
  assert.match(section.innerHTML, /BUGÜN NE YAPAYIM\?/);
  assert.match(section.innerHTML, /Bugün biraz ilerleyebilirsin/);
  assert.doesNotMatch(section.innerHTML, /SAFETY|TREND &amp; PATTERN|VERİ GÜVENİ/);
});

run('Technical Details resolves deferred analyses once when opened', () => {
  const { context, calls } = runtime(fixtures.scenarios[6]);
  context.SimurgCoachUI.renderMobile();
  const target = { innerHTML: '' };
  const details = { open: true, dataset: {}, querySelector: () => target };
  context.simurgCoachToggleDetails(details, 'technical');
  assert.deepEqual(calls, [
    { type:'daily', deferred:true }, { type:'pre_workout', deferred:true },
    { type:'daily', deferred:false }, { type:'pre_workout', deferred:false },
    { type:'post_workout', deferred:false }, { type:'pattern', deferred:false }
  ]);
  assert.match(target.innerHTML, /Kişisel karşılaştırmalar/);
  context.simurgCoachToggleDetails(details, 'technical');
  assert.equal(calls.length, 6);
});

run('immediate results skip heavy fields without polluting the full-result cache', () => {
  const scenario = clone(fixtures.scenarios[6]);
  client.invalidate();
  const immediate = client.resolve('daily', scenario.date, { data:scenario.data, store:false, engineOptions:{deferTechnical:true} });
  const full = client.resolve('daily', scenario.date, { data:scenario.data, store:false });
  assert.deepEqual(immediate.trendInsights, []);
  assert.deepEqual(immediate.comparisonNotes, []);
  assert.ok(full.trendInsights.length > 0);
  assert.notEqual(full.narrative.cacheStatus, 'memory_hit');
});

run('warnings are absent for a safe day and translated for safety cases', () => {
  const safe = runtime(fixtures.scenarios[0]);
  safe.context.SimurgCoachUI.renderMobile();
  assert.doesNotMatch(safe.section.innerHTML, /DİKKAT ET/);
  const pain = runtime(fixtures.scenarios[3]);
  pain.context.SimurgCoachUI.renderMobile();
  assert.match(pain.section.innerHTML, /DİKKAT ET/);
  assert.match(pain.section.innerHTML, /yük artırma|Yükü ve setleri azalt/);
});

run('missing recovery data stays cautious and does not invent readiness', () => {
  const missing = runtime(fixtures.scenarios[4]);
  missing.context.SimurgCoachUI.renderMobile();
  assert.match(missing.section.innerHTML, /Temkinli başla/);
  assert.match(missing.section.innerHTML, /Toparlanma verilerin eksik/);
  assert.match(missing.section.innerHTML, /Hazırlık —/);
  assert.match(missing.section.innerHTML, /Veri bekleniyor/);
});

if (process.exitCode) process.exit(process.exitCode);
