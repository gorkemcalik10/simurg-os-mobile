const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const client = require('../simurg-coach-client.js');
const fixtures = require('./simurg-coach-fixtures.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'simurg-coach-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'simurg-coach.css'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function runtime(scenario, weeklyOverride) {
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
        calls.push(type);
        if (type === 'weekly' && weeklyOverride) return clone(weeklyOverride);
        return client.resolve(type, date, { ...options, data, store: false, remote: false });
      }
    }
  };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return { context, calls, section };
}

function weeklyResult(trainingDecision, overrides = {}) {
  return {
    trainingDecision,
    readinessScore: 75,
    confidenceScore: 80,
    confidenceLabel: 'Yüksek',
    keyDrivers: ['Antrenman/aktivite günü: 4'],
    warnings: [],
    missingData: [],
    recoveryActions: [],
    trendInsights: [],
    baseline: {},
    ...overrides
  };
}

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('all six weekly decisions have exact plain-language labels', () => {
  const { context } = runtime(fixtures.scenarios[0]);
  assert.deepEqual(
    { ...context.SimurgCoachUI.weeklyDecisionLabels },
    { progress:'Biraz ilerleyebilirsin', normal:'Planını aynen uygula', controlled:'Temkinli başla', reduce:'Yükü biraz azalt', recovery:'Toparlanmayı öne al', rest:'Dinlenmeyi önceliklendir' }
  );
});

run('mobile Weekly first render uses one weekly result and the simplified hierarchy', () => {
  const { context, calls, section } = runtime(fixtures.scenarios[0]);
  context.simurgCoachSetTab('weekly');
  assert.deepEqual(calls, ['weekly']);
  for (const label of ['BU HAFTA NASILDI?', 'GELECEK HAFTA NE YAPAYIM?', 'Neden?', 'Verilerimi Göster', 'Teknik Detaylar']) {
    assert.ok(section.innerHTML.includes(label), `${label} missing`);
  }
  assert.doesNotMatch(section.innerHTML, /HAFTALIK KOÇ|HAFTANIN SİNYALLERİ|GELECEK KARAR|HAFTALIK RİSKLER|Yeni haftaya hazırlık/);
  assert.doesNotMatch(section.innerHTML, /loadAdjustmentPercent|baseline|strain\/tolerance|progress|controlled/);
});

run('first Weekly card describes the week while the second preserves the next-week action', () => {
  const cases = [
    [weeklyResult('reduce', { readinessScore: 82, warnings: ['Cardio Load yakın döneme göre yüksek.'] }), 'Yük bu hafta biraz yükseldi', 'Yükü biraz azalt'],
    [weeklyResult('reduce', { warnings: ['Birden fazla olumsuz toparlanma sinyali birlikte görülüyor.'] }), 'Yük bu hafta biraz yükseldi', 'Yükü biraz azalt'],
    [weeklyResult('recovery', { readinessScore: 48 }), 'Toparlanma bu hafta zorlandı', 'Toparlanmayı öne al'],
    [weeklyResult('normal', { baseline: { cardioLoad: { current: 70 }, sleepMinutes: { current: 430, deviation7: 2 } } }), 'Hafta dengeli geçti', 'Planını aynen uygula'],
    [weeklyResult('controlled', { readinessScore: null }), 'Bu hafta kontrollü ilerledin', 'Temkinli başla']
  ];

  for (const [result, expectedSummary, expectedAction] of cases) {
    const { context, section } = runtime(fixtures.scenarios[0], result);
    context.simurgCoachSetTab('weekly');
    const first = section.innerHTML.slice(section.innerHTML.indexOf('sci-weekly-summary'), section.innerHTML.indexOf('</section>', section.innerHTML.indexOf('sci-weekly-summary')));
    const second = section.innerHTML.slice(section.innerHTML.indexOf('sci-weekly-action'), section.innerHTML.indexOf('</section>', section.innerHTML.indexOf('sci-weekly-action')));
    assert.match(first, new RegExp(expectedSummary));
    assert.doesNotMatch(first, new RegExp(expectedAction));
    assert.match(second, new RegExp(expectedAction));
  }
});

run('good recovery plus high load uses the visible load semantic and consistent support copy', () => {
  const result = weeklyResult('reduce', { readinessScore: 84, warnings: ['Cardio Load yakın döneme göre yüksek.'] });
  const { context, section } = runtime(fixtures.scenarios[0], result);
  context.simurgCoachSetTab('weekly');
  const first = section.innerHTML.slice(section.innerHTML.indexOf('sci-weekly-summary'), section.innerHTML.indexOf('</section>', section.innerHTML.indexOf('sci-weekly-summary')));
  const reasons = section.innerHTML.slice(section.innerHTML.indexOf('sci-weekly-reasons'), section.innerHTML.indexOf('</section>', section.innerHTML.indexOf('sci-weekly-reasons')));
  assert.match(first, /Yük bu hafta biraz yükseldi/);
  assert.match(first, /Toparlanman iyi kaldı ancak toplam yük yakın döneme göre yükseldi/);
  assert.doesNotMatch(first, /Toparlanma bu hafta zorlandı/);
  assert.match(reasons, /Toparlanma <b>· İyi<\/b>/);
  assert.match(reasons, /Antrenman yükü <b>· Yüksek<\/b>/);
});

run('mobile Coaching hides technical header labels without changing desktop styling', () => {
  assert.match(source, /function aiBadge\(\)\{return '<span class="sci-local-badge">Yerel güvenli analiz<\/span>';\}/);
  assert.match(source, /<small class="sci-kicker">SIMURG COACH INTELLIGENCE<\/small>/);
  assert.match(css, /@media\(max-width:900px\)\{[^]*?\.sci-mobile-shell \.sci-kicker,\.sci-mobile-shell \.sci-local-badge\{display:none\}/);
  assert.match(css, /@media\(min-width:901px\)\{/);
  assert.doesNotMatch(css, /(?:^|\n)\.sci-kicker\{display:none\}/);
  assert.doesNotMatch(css, /(?:^|\n)\.sci-local-badge\{display:none\}/);
});

run('Weekly shows exactly three semantic reasons', () => {
  const { context, section } = runtime(fixtures.scenarios[0]);
  context.simurgCoachSetTab('weekly');
  const reasonBlock = section.innerHTML.slice(section.innerHTML.indexOf('sci-weekly-reasons'), section.innerHTML.indexOf('</section>', section.innerHTML.indexOf('sci-weekly-reasons')));
  assert.equal((reasonBlock.match(/<article>/g) || []).length, 3);
  assert.match(reasonBlock, /Toparlanma/);
  assert.match(reasonBlock, /Antrenman yükü/);
  assert.match(reasonBlock, /Uyku/);
});

run('no-warning weeks omit Dikkat Et while safety weeks preserve a plain warning', () => {
  const safe = runtime(fixtures.scenarios[0]);
  safe.context.simurgCoachSetTab('weekly');
  assert.doesNotMatch(safe.section.innerHTML, /DİKKAT ET/);

  const pain = runtime(fixtures.scenarios[3]);
  pain.context.simurgCoachSetTab('weekly');
  assert.match(pain.section.innerHTML, /DİKKAT ET/);
  assert.match(pain.section.innerHTML, /Ağrı\/form uyarıları tekrar etmiş|Hareket kalitesini öne al/);
  assert.match(pain.section.innerHTML, /yük artırma|temiz form/);
});

run('Weekly disclosures reuse the initial weekly result without another Coach analysis', () => {
  const { context, calls } = runtime(fixtures.scenarios[2]);
  context.simurgCoachSetTab('weekly');
  const metricsTarget = { innerHTML: '' };
  const metrics = { open: true, dataset: {}, querySelector: () => metricsTarget };
  context.simurgCoachToggleDetails(metrics, 'weeklyMetrics');
  assert.match(metricsTarget.innerHTML, /Uyku/);
  assert.match(metricsTarget.innerHTML, /Cardio Load/);

  const technicalTarget = { innerHTML: '' };
  const technical = { open: true, dataset: {}, querySelector: () => technicalTarget };
  context.simurgCoachToggleDetails(technical, 'weeklyTechnical');
  assert.match(technicalTarget.innerHTML, /Veri güveni/);
  assert.match(technicalTarget.innerHTML, /Ham haftalık sinyaller/);
  assert.match(technicalTarget.innerHTML, /Yük ayarı/);
  assert.deepEqual(calls, ['weekly']);
});

if (process.exitCode) process.exit(process.exitCode);
