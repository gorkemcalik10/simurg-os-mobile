const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const coach = fs.readFileSync(path.join(root, 'simurg-coach-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'premium-standard.css'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function coachUi() {
  const window = { innerWidth: 390, DATA: {}, SimurgCoachClient: { resolve: () => ({}) } };
  window.window = window;
  vm.runInNewContext(coach, { window, globalThis: window, Date, Intl, Math, Number, String, Object, Array, RegExp });
  return window.SimurgCoachUI;
}

const normalResult = { trainingDecision: 'progress', readinessScore: 98, baseline: {} };

run('Home presentation overrides rest and skipped days without changing normal Coach mapping', () => {
  const ui = coachUi();
  const historical = '2000-01-01';
  const rest = ui.homeCoachPresentation(normalResult, { gymPlan: { mode: 'rest', skipped: false, performed: false } }, historical);
  assert.equal(rest.title, 'Bugün dinlen');
  assert.equal(rest.explanation, 'Bugün planlı antrenmanın yok; toparlanmanı koru.');
  assert.equal(rest.kicker, 'SEÇİLİ GÜNÜN KOÇ KARARI');
  const skipped = ui.homeCoachPresentation(normalResult, { gymPlan: { mode: 'skipped', skipped: true, performed: false } }, historical);
  assert.equal(skipped.title, 'Bugün antrenman yok');
  assert.equal(skipped.explanation, 'Bu gün antrenman için atlandı; progresyon hedefi uygulama.');
  const completed = ui.homeCoachPresentation(normalResult, { gymPlan: { mode: 'planned', performed: true } }, historical);
  const planned = ui.homeCoachPresentation(normalResult, { gymPlan: { mode: 'planned', performed: false } }, historical);
  assert.equal(completed.title, 'Biraz ilerleyebilirsin');
  assert.equal(planned.title, 'Biraz ilerleyebilirsin');
});

run('Home-only Coach card omits readiness and keeps a single Coach resolution', () => {
  const homeBlock = coach.slice(coach.indexOf('function decorateHome'), coach.indexOf('root.simurgCoachOpen'));
  assert.doesNotMatch(homeBlock, /Hazırlık|score\(result\)/);
  assert.match(homeBlock, /presentation\.title/);
  assert.equal((homeBlock.match(/resolve\('daily'/g) || []).length, 1);
  assert.match(premium, /decorateHome\(content,homeTab,homeDateValue\(\),model\)/);
});

run('zero load has a distinct semantic label while meaningful non-zero load keeps existing logic', () => {
  const ui = coachUi();
  assert.equal(ui.loadReason({ baseline: { cardioLoad: { current: 0 }, cardioLoadRatio: {} } }, 0).status, 'Yük yok');
  assert.equal(ui.loadReason({ baseline: { cardioLoad: { current: 0 }, cardioLoadRatio: {} } }).status, 'Dengeli');
  assert.equal(ui.loadReason({ baseline: { cardioLoad: { current: 24, deviation7: 2 }, cardioLoadRatio: { current: 1 } } }, 24).status, 'Dengeli');
  assert.equal(ui.loadReason({ baseline: { cardioLoad: { current: 90, deviation7: 40 }, cardioLoadRatio: { current: 1.4 } } }, 90).status, 'Yüksek');
  assert.equal(ui.loadReason({ baseline: { cardioLoad: {}, cardioLoadRatio: {} } }, null).status, 'Veri bekleniyor');
});

run('Horizon is three accessible quick-navigation tiles without a connector line', () => {
  const overview = premium.slice(premium.indexOf("var horizonContext="), premium.indexOf('function recoveryPane'));
  for (const [tab, label] of [['recovery', 'Toparlanma'], ['sleep', 'Uyku'], ['load', 'Yük']]) {
    assert.ok(overview.includes(`class="gp-horizon-tile ${tab}" aria-label="${label} detayını aç" onclick="homePremiumSetTab(\\'${tab}\\')"`));
  }
  assert.equal((overview.match(/class="gp-horizon-tile/g) || []).length, 3);
  assert.match(overview, /Bugünkü durum.*Seçili günün durumu/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.gp-horizon-tile\{[^}]*min-width:0!important;[^}]*min-height:104px!important/);
  assert.doesNotMatch(css, /\.gp-horizon-flow:before/);
});

run('rest-day workout copy is plain and the status title remains canonical', () => {
  assert.match(premium, /if\(plan\.mode==='rest'\)return 'Bugün planlı antrenmanın yok\.'/);
  assert.match(premium, /if\(plan\.mode==='rest'\)return \{label:'Dinlenme Günü',tone:'rest'\}/);
  assert.doesNotMatch(premium, /Takvimde planlı Gym seansı olmayan gerçek dinlenme günü/);
});

if (process.exitCode) process.exit(process.exitCode);
