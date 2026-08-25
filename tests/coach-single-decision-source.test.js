const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../simurg-coach-engine.js');
const client = require('../simurg-coach-client.js');
const target = require('../simurg-next-session-target.js');
const fixtures = require('./simurg-coach-fixtures.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('client canonical decision is the existing pre-workout decision', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'pain_bad_form');
  const actual = client.resolveDecision(scenario.date, { data: clone(scenario.data), store: false });
  const expected = engine.analyzePreWorkout(clone(scenario.data), scenario.date);
  assert.equal(actual.type, 'pre_workout');
  assert.equal(actual.inputHash, expected.inputHash);
  assert.equal(actual.trainingDecision, expected.trainingDecision);
  assert.deepEqual(actual.warnings, expected.warnings);
});

run('pain and form remain stricter than positive recovery and energy evidence', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'pain_bad_form');
  const result = engine.analyzePreWorkout(clone(scenario.data), scenario.date, {
    recoveryIntelligence: { score: 100, status: 'positive', signals: { positive: ['Strong recovery evidence'] } },
    energyContext: { score: 100, status: 'high', confidence: 'high', reasons: ['Strong energy evidence'] }
  });
  assert.equal(result.trainingDecision, 'reduce');
  assert.equal(result.recoveryScore, 100);
  assert.equal(result.energyScore, 100);
  assert.ok(result.warnings.some(item => /Ağrı/i.test(item)));
  assert.ok(result.warnings.some(item => /Form Bad/i.test(item)));
});

run('next-session target cannot progress beyond the canonical decision', () => {
  const sessions = [{ date: '2026-08-20', rows: [{ weight: 20, reps: 8, rpe: 7, form: 'Good', pain: 'None' }] }];
  const held = target.recommend(sessions, { coachDecision: { trainingDecision: 'controlled', workoutGuidance: { mainLifts: 'Ana hareketlerde yük artırma.' } } });
  assert.equal(held.target, '20 kg × 8');
  assert.equal(held.label, 'Kontrollü başla');
  const progressed = target.recommend(sessions, { coachDecision: { trainingDecision: 'progress', workoutGuidance: { mainLifts: 'Küçük progresyon değerlendirilebilir.' } } });
  assert.equal(progressed.target, '20 kg × 9');
});

run('missing feedback stays missing and cannot become a progression signal', () => {
  const feedback = target.feedback([{ weight: 20, reps: 8, form: '', pain: '' }]);
  assert.equal(feedback.rpe, null);
  assert.equal(feedback.formGood, false);
  assert.equal(feedback.painClear, false);
  const result = target.recommend([{ date: '2026-08-20', rows: [{ weight: 20, reps: 8 }] }], {
    coachDecision: { trainingDecision: 'progress', workoutGuidance: { mainLifts: 'Küçük progresyon değerlendirilebilir.' } }
  });
  assert.equal(result.target, '20 kg × 8');
});

run('historical canonical decisions ignore future workout safety rows', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const data = clone(scenario.data);
  data.workouts = data.workouts.filter(row => row.date <= scenario.date);
  const baseline = client.resolveDecision(scenario.date, { data: clone(data), store: false });
  data.workouts.push(fixtures.gymRow(fixtures.addDays(scenario.date, 2), { form: 'Bad', pain: 'Severe', rpe: 10 }));
  const withFuture = client.resolveDecision(scenario.date, { data, store: false });
  assert.equal(withFuture.inputHash, baseline.inputHash);
  assert.equal(withFuture.trainingDecision, baseline.trainingDecision);
});

run('planned rest is represented by the canonical decision object', () => {
  const scenario = fixtures.scenarios.find(item => item.id === 'good_recovery');
  const result = engine.analyzePreWorkout(clone(scenario.data), scenario.date, {
    gymPlan: { mode: 'rest', label: 'Rest Day', planned: false, skipped: false, performed: false }
  });
  assert.equal(result.trainingDecision, 'rest');
  assert.equal(result.loadAdjustmentPercent, -100);
  assert.match(result.workoutGuidance.mainLifts, /progresyon hedefi yok/i);
});

run('Home Coach Program alerts and targets route through resolveDecision', () => {
  const ui = read('simurg-coach-ui.js');
  const premium = read('premium-standard.js');
  const mobile = read('mobile-ia-premium.js');
  const html = read('index.html');
  assert.match(ui, /function resolveDecision[\s\S]*SimurgCoachClient\.resolveDecision/);
  assert.match(ui, /function decorateHome[\s\S]*resolveDecision\(date\|\|selected\(\)\)/);
  assert.match(mobile, /SimurgCoachClient\.resolveDecision\(date/);
  assert.match(mobile, /function coachCopy\(date\)[\s\S]*SimurgCoachClient\.resolveDecision/);
  assert.match(premium, /function canonicalCoach[\s\S]*SimurgCoachClient\.resolveDecision/);
  assert.match(premium, /function loadAggressiveness\(model\)[\s\S]*canonicalCoach/);
  assert.doesNotMatch(premium.match(/function energyExplanation\(energy\)\{([\s\S]*?)\n  \}/)[1], /trainingRecommendation/);
  assert.match(premium, /CANONICAL COACH/);
  assert.match(html, /coachDecision:canonicalDecision\(selDate\(\)\),requireCoachDecision:true/);
});

if (process.exitCode) process.exit(process.exitCode);
