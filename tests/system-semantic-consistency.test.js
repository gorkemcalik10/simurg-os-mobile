const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (error) {
    console.error('✗ ' + name);
    throw error;
  }
}

test('Home subtitle distinguishes today from a historical selection', () => {
  assert.match(premium, /function homeSubtitle\(\)\{return homeDateValue\(\)===today\(\)\?'Bugün için koçun seni analiz etti\.':'Seçili günün verileri analiz edildi\.';\}/);
  assert.match(premium, /id="gpHomeSubtitle"/);
  assert.match(premium, /subtitle\.textContent=homeSubtitle\(\)/);
});

test('Cardio Load evidence, near-term load and plan aggressiveness are named separately', () => {
  assert.match(premium, /evidenceItem\('load','Cardio Load'/);
  assert.match(premium, /metric\('Günlük Aktivite Yükü',loadValueLabel\(loadResult\),''\)/);
  assert.match(premium, /metric\('Yakın Dönem Yük Durumu',nearTerm,''\)/);
  assert.match(premium, /metric\('Plan Agresifliği',statusLabel,''\)/);
  assert.match(premium, /Plan: '\+statusLabel/);
});

test('zero load keeps the Yük yok presentation', () => {
  assert.match(premium, /number\(loadResult\.value\)===0\?'Yük yok':formatLoad\(loadResult\.value\)/);
});

test('Recovery renders one baseline-aware intelligence recommendation', () => {
  const recoveryPane = premium.match(/function recoveryPane\(model\)\{([\s\S]*?)\n  \}/);
  assert.ok(recoveryPane);
  assert.equal((recoveryPane[1].match(/action\.recommendation/g) || []).length, 1);
  assert.match(recoveryPane[1], /RECOVERY STATUS/);
  assert.match(recoveryPane[1], /recoveryEvidence\(model\)/);
  assert.doesNotMatch(recoveryPane[1], /recoveryInterpretation/);
});

test('Sleep durations use Turkish units', () => {
  assert.match(premium, /h\+' sa '\+m\+' dk'/);
  assert.doesNotMatch(premium, /h\+'h '\+String\(m\)/);
});

test('Logger labels are presentation-only Turkish mappings', () => {
  assert.match(index, /<h3>PERFORMANS ÖZETİ<\/h3>/);
  assert.match(index, /'Functional Training':'Fonksiyonel Antrenman'/);
  assert.match(premium, /loggerPanel\('PERFORMANS ÖZETİ'\)\|\|loggerPanel\('RAW PERFORMANCE'\)/);
});
