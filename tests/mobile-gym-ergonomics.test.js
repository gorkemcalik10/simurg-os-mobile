const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let passed = 0;

function run(name, fn) {
  fn();
  passed += 1;
  process.stdout.write(`✓ ${name}\n`);
}

run('Gym weight and repetition inputs expose iPhone keyboard hints', () => {
  assert.match(index, /class="gymWeight" inputmode="decimal" enterkeyhint="next"/);
  assert.match(index, /class="gymReps" inputmode="numeric" enterkeyhint="done"/);
  assert.match(index, /class="gymExerciseSets" inputmode="numeric" enterkeyhint="next"/);
});

run('Gym visible labels are Turkish while stored values remain compatible', () => {
  for (const label of ['Egzersiz', 'Bölge', 'Planlanan Set', 'Ağrı', 'Geçmiş', 'Kaydet', 'Temizle']) {
    assert.match(index, new RegExp(`>${label}<`));
  }
  for (const label of ['Veri Birikiyor', 'İlk temiz kayıt', 'En iyi', 'Otomatik Hedef:', 'Son Antrenman']) {
    assert.match(index, new RegExp(label));
  }
  assert.match(index, /option value="Good"[^>]*>İyi<\/option>/);
  assert.match(index, /option value="Okay"[^>]*>Orta<\/option>/);
  assert.match(index, /option value="Bad"[^>]*>Kötü<\/option>/);
  assert.match(index, /option value="None"[^>]*>Yok<\/option>/);
  assert.match(index, /option value="Mild"[^>]*>Hafif<\/option>/);
  assert.match(index, /option value="Warning"[^>]*>Uyarı<\/option>/);
});

run('Gym date helper prioritizes the selected day on mobile', () => {
  assert.match(index, /const selected=String\(selectedDate\|\|window\.selectedDate\|\|t\)/);
  assert.match(index, /programFor\(selected\)/);
  assert.match(index, /active\?'BUGÜN':'SEÇİLİ GÜN'/);
  assert.match(index, /helper\.hidden=active/);
  assert.match(index, /GEÇMİŞ TARİH/);
  assert.match(index, /Antrenman · \$\{safeTr\(selected\)\}/);
});

run('Gym save parsing and set actions retain their existing contracts', () => {
  assert.match(index, /reps:Number\(String\(reps\)\.replace\(','\s*,\s*'\.'\)\)\|\|0/);
  assert.match(index, /weight:Number\(String\(weight\)\.replace\(','\s*,\s*'\.'\)\)\|\|0/);
  assert.match(index, /if\(action==='add-set'\) addGymSet\(key\)/);
  assert.match(index, /else if\(action==='save'\) saveGymExercise\(key\)/);
  assert.match(index, /else if\(action==='clear'\) clearGymExercise\(key\)/);
  assert.match(index, /else if\(action==='delete'\) deleteGymExercise\(key\)/);
});

run('Mobile program editing remains available in a compact presentation', () => {
  assert.match(index, /#gym \.gymAddCard\{padding:9px 10px!important/);
  assert.match(index, /#gym \.gymAddCard span\{display:-webkit-box!important/);
  assert.match(index, /onclick="addGymExercise\(\)">\+ Hareket Ekle<\/button>/);
});

process.stdout.write(`${passed} mobile Gym ergonomics tests passed.\n`);
