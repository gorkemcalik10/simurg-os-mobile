const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'desktop-alignment.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'desktop-alignment.css'), 'utf8');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('desktop sidebar uses grouped Turkish navigation with dependency-free SVG icons', () => {
  for (const label of ['Genel', 'Antrenman', 'Polar & Özetler', 'Rehberlik', 'Sistem']) {
    assert.ok(js.includes(`'${label}'`));
  }
  for (const route of ['home', 'workout', 'program', 'polar', 'daily', 'weekly', 'monthly', 'coaching', 'data']) {
    assert.match(js, new RegExp(`\\['${route}'`));
  }
  assert.match(js, /function navIcon\(id\)/);
  assert.match(js, /<svg viewBox="0 0 24 24"/);
});

run('desktop logger is read-only and follows the requested information hierarchy', () => {
  for (const label of ['SEÇİLİ SEANS', 'SEANS ÖZETİ', 'Egzersiz Dağılımı', 'Set Detayı', 'RPE / Form / Ağrı', 'Önceki Seans Karşılaştırması', 'Polar Eşleşmesi']) {
    assert.ok(js.includes(label));
  }
  assert.match(js, /READ-ONLY KAYIT/);
  assert.match(js, /function previousGymSession\(date\)/);
  assert.match(js, /Bu seans için Polar eşleşmesi yok\./);
  assert.doesNotMatch(js, /contenteditable/);
});

run('desktop logger layout is bounded and mobile rules remain desktop-scoped', () => {
  assert.match(css, /@media \(min-width:901px\)/);
  assert.match(css, /\.dlSessionHero\{display:grid/);
  assert.match(css, /\.dlLoggerSections\{display:grid/);
  assert.match(css, /\.dlLoggerPanel\{min-width:0/);
  assert.match(css, /\.dlDistribution>div\{display:grid/);
});

run('desktop routes render on demand and reset the page scroll position', () => {
  assert.match(js, /function activeDesktopScreen\(\)/);
  assert.match(js, /renderScreen\(activeDesktopScreen\(\)\)/);
  assert.doesNotMatch(js, /renderHome\(\);logger\(\);polarData\(\);dailySummary\(\);weeklySummary\(\);monthlyReview\(\);program\(\);coaching\(\)/);
  assert.match(js, /window\.scrollTo\(\{top:0,left:0,behavior:'auto'\}\)/);
});

run('desktop Home and Data Center stay compact without hiding actions', () => {
  assert.match(css, /\.gp-desktop-overview:not\(:has\(>\.gp-desktop-prime\)\)>\.gp-desktop-signals\{grid-column:1\/-1\}/);
  assert.match(css, /#data\.section\.active\{display:grid!important/);
  assert.match(css, /grid-template-areas:"head head" "cloud cloud" "import status" "general status"/);
  assert.match(css, /#data\.section>\.cloudSyncCard \.syncInfoGrid\{display:none!important\}/);
});

if (process.exitCode) process.exit(process.exitCode);
