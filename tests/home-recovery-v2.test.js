'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const coach = fs.readFileSync(path.join(root, 'simurg-coach-ui.js'), 'utf8');
const mobileCss = fs.readFileSync(path.join(root, 'premium-standard.css'), 'utf8');
const desktopCss = fs.readFileSync(path.join(root, 'desktop-alignment.css'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('Home v2 renders the existing Coach decision before daily status and evidence', () => {
  const decorate = coach.slice(coach.indexOf('function decorateHome'), coach.indexOf('root.simurgCoachOpen'));
  const overview = premium.slice(premium.indexOf('function overviewPane'), premium.indexOf('function recoveryStatusLabel'));
  assert.match(decorate, /insertAdjacentHTML\('afterbegin','<button type="button" class="sci-home-insight/);
  assert.ok(overview.indexOf('dailyStatusCard(model)') < overview.indexOf('dailyEvidenceCard(model)'));
  assert.ok(overview.indexOf('dailyEvidenceCard(model)') < overview.indexOf('energyCard(model)'));
  assert.match(desktopCss, /\.gp-desktop-overview>\.sci-home-insight\{grid-column:1\/-1!important/);
});

run('Home v2 evidence uses existing Sleep HRV Night HR and Cardio Load fields', () => {
  const evidence = premium.slice(premium.indexOf('function dailyEvidenceCard'), premium.indexOf('function overviewPane'));
  assert.match(evidence, /model\.sleepScore/);
  assert.match(evidence, /model\.sleepMinutes/);
  assert.match(evidence, /model\.hrv/);
  assert.match(evidence, /model\.rhr/);
  assert.match(evidence, /model\.polarNightly\?'Night HR':'Resting HR'/);
  assert.match(evidence, /loadValueLabel\(model\.loadResult\)/);
  assert.match(mobileCss, /\.gp-evidence-strip\{[^}]*repeat\(4,minmax\(0,1fr\)\)/);
});

run('Recovery v2 consumes Recovery Intelligence and mirrors canonical readiness', () => {
  const model = premium.slice(premium.indexOf('function resolveRecoveryIntelligence'), premium.indexOf('function metric'));
  const recovery = premium.slice(premium.indexOf('function recoveryStatusLabel'), premium.indexOf('function stageBar'));
  assert.match(model, /SimurgRecoveryIntelligence\.resolve/);
  assert.match(model, /canonicalRecovery:canonicalRecovery/);
  assert.match(model, /recoveryIntelligence:resolveRecoveryIntelligence\(date,data,readinessResult\)/);
  assert.match(recovery, /model\.readiness==null\?'—':Math\.round\(model\.readiness\)/);
  assert.doesNotMatch(recovery, /calculateReadiness|readiness\s*[+*/-]|hrv\s*<|nightHr\s*>/);
});

run('Recovery v2 presents personal baselines and preserves missing states', () => {
  const recovery = premium.slice(premium.indexOf('function recoveryStatusLabel'), premium.indexOf('function stageBar'));
  for (const key of ['contributors.hrv', 'contributors.nightHr', 'contributors.ansCharge', 'contributors.sleepCharge', 'contributors.recentLoad']) assert.ok(recovery.includes(key));
  assert.match(recovery, /Kişisel baseline için veri birikiyor/);
  assert.match(recovery, /Nightly Recharge verisi bekleniyor/);
  assert.match(recovery, /Sleep Intelligence verisi bekleniyor/);
  assert.match(recovery, /Önceki gün Cardio Load verisi yok/);
  assert.match(recovery, /value==null\?'—'/);
  assert.doesNotMatch(recovery, /value\|\|0/);
});

run('Home and Recovery v2 remain bounded across mobile and desktop layouts', () => {
  assert.match(mobileCss, /\.gp-daily-status\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(mobileCss, /\.gp-recovery-evidence-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(desktopCss, /\[data-home-pane="recovery"\]>\.gp-recovery-context\{grid-column:2\/3!important/);
  assert.match(desktopCss, /\.gp-recovery-evidence-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
});

if (process.exitCode) process.exit(process.exitCode);
