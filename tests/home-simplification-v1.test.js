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

run('Home Coach card uses all six plain-language decisions without technical confidence', () => {
  for (const [key, label] of Object.entries({
    progress: 'Biraz ilerleyebilirsin', normal: 'Planını aynen uygula', controlled: 'Temkinli başla',
    reduce: 'Bugün biraz azalt', recovery: 'Hafif gün yap', rest: 'Bugün dinlen',
  })) assert.match(coach, new RegExp(`${key}:'${label}'`));
  const homeBlock = coach.slice(coach.indexOf("var statuses={sleep:"), coach.indexOf("}else if(tab==='recovery')"));
  assert.match(homeBlock, /BUGÜNÜN KOÇ KARARI/);
  assert.match(homeBlock, /plainDecisionExplanation\(result\)/);
  assert.match(homeBlock, /Hazırlık/);
  assert.match(homeBlock, /Detay →/);
  assert.doesNotMatch(homeBlock, /Veri güveni|loadAdjustmentPercent|result\.headline|decision\(result\)/);
});

run('Horizon statuses reuse the existing Coach semantic helpers', () => {
  const homeBlock = coach.slice(coach.indexOf("var statuses={sleep:"), coach.indexOf("}else if(tab==='recovery')"));
  assert.match(homeBlock, /sleep:sleepReason\(result\)\.status/);
  assert.match(homeBlock, /recovery:recoveryReason\(result\)\.status/);
  assert.match(homeBlock, /load:loadReason\(result\)\.status/);
  for (const key of ['recovery', 'sleep', 'load']) assert.match(premium, new RegExp(`data-coach-status="${key}"`));
});

run('mobile overview has one workout card and omits empty activity', () => {
  const mobileOverview = premium.slice(premium.indexOf('var activityHtml=mobileActivityCard'), premium.indexOf('function recoveryPane'));
  assert.match(mobileOverview, /mobileWorkoutCard\(model\)/);
  assert.match(mobileOverview, /weeklyCard\(model,true\)/);
  assert.doesNotMatch(mobileOverview, /gymSessionCard\(model\)|gp-recent-grid|BUGÜNKÜ PLAN|Aktivite bulunmuyor|gp-coach-flow/);
  const activityBlock = premium.slice(premium.indexOf('function mobileActivityCard'), premium.indexOf('function recoveryInterpretation'));
  assert.match(activityBlock, /if\(!activity\)return ''/);
  assert.match(activityBlock, /BUGÜNKÜ AKTİVİTE/);
  assert.match(activityBlock, /SimurgWorkoutSource\.durationMinutes/);
  assert.match(activityBlock, /Math\.round\(durationMinutes\)\+' dk'/);
  assert.doesNotMatch(activityBlock, /zoneSummary|Bölge/);
});

run('merged workout card preserves actual day states and completed stats', () => {
  const stateBlock = premium.slice(premium.indexOf('function workoutState'), premium.indexOf('function weeklySnapshot'));
  assert.match(stateBlock, /if\(plan\.skipped\).*Atlandı/);
  assert.match(stateBlock, /if\(plan\.mode==='rest'\).*Dinlenme günü/);
  assert.match(stateBlock, /if\(plan\.performed\).*Tamamlandı/);
  assert.match(stateBlock, /Planlandı/);
  assert.match(stateBlock, /selectedGymSession\(model\)/);
  assert.match(stateBlock, /set'.*tekrar'.*kg hacim/);
  assert.match(stateBlock, /performed\?"simurgV8Go\('workout','logger'\)":"simurgV8Go\('gym','gym'\)"/);

  const context = {
    selectedGymSession: model => model.session || null,
    planName: model => model.gymPlan.label,
    planDescription: () => 'Plan açıklaması',
    today: () => '2026-08-15',
    esc: value => String(value),
  };
  vm.runInNewContext(`${stateBlock};this.renderWorkout=mobileWorkoutCard;`, context);
  const completed = context.renderWorkout({ selectedDate: '2026-08-15', gymPlan: { label: 'Serbest Antrenman', performed: true }, session: { sets: 22, reps: 234, volume: 5560 } });
  assert.match(completed, /BUGÜNKÜ ANTRENMAN/); assert.match(completed, /Tamamlandı/); assert.match(completed, /22 set · 234 tekrar · 5\.560 kg hacim/); assert.match(completed, /workout','logger/);
  assert.match(context.renderWorkout({ selectedDate: '2026-08-15', gymPlan: { label: 'Push', planned: true } }), /Planlandı/);
  assert.match(context.renderWorkout({ selectedDate: '2026-08-15', gymPlan: { label: 'Bugün Atlandı', skipped: true } }), /Atlandı/);
  assert.match(context.renderWorkout({ selectedDate: '2026-08-15', gymPlan: { label: 'Dinlenme Günü', mode: 'rest' } }), /Dinlenme günü/);
  assert.match(context.renderWorkout({ selectedDate: '2026-08-14', gymPlan: { label: 'Pull', planned: true } }), /SEÇİLİ GÜN ANTRENMANI/);
});

run('weekly wording is neutral and mobile layout remains overflow-safe', () => {
  assert.match(premium, /week\.active\+' antrenman günü'/);
  assert.match(css, /#home\.gp-home\{[^}]*overflow-x:hidden!important/);
  assert.doesNotMatch(coach, /new\s+MutationObserver|setInterval\s*\(/);
});

if (process.exitCode) process.exit(process.exitCode);
