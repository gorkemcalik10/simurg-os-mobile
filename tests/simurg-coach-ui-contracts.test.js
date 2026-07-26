const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const ui = read('simurg-coach-ui.js');
const css = read('simurg-coach.css');
const premium = read('premium-standard.js');
const desktop = read('desktop-alignment.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

run('coach client and UI assets load in dependency order', () => {
  const engine = html.indexOf('simurg-coach-engine.js');
  const client = html.indexOf('simurg-coach-client.js');
  const uiRuntime = html.indexOf('simurg-coach-ui.js');
  assert.ok(engine >= 0 && client > engine);
  assert.ok(uiRuntime > client);
  assert.ok(uiRuntime < html.indexOf('premium-standard.js'));
  assert.match(html, /simurg-coach-client\.js\?v=2/);
  assert.match(html, /simurg-coach\.css\?v=3/);
  assert.match(html, /simurg-coach-ui\.js\?v=2/);
});

run('mobile Coaching exposes daily weekly and history views', () => {
  assert.match(ui, /tabs=\['daily','weekly','history'\]/);
  assert.match(ui, /function renderMobile\(\)/);
  assert.match(ui, /BUGÜNKÜ DURUM/);
  assert.match(ui, /HAREKET REHBERİ/);
  assert.match(ui, /VERİ GÜVENİ/);
  assert.match(ui, /Detaylı gerekçe/);
  assert.match(ui, /<details class="sci-details"><summary>Detaylı gerekçe<\/summary>/);
  assert.match(ui, /<h3>Günlük değerlendirme<\/h3><p>'\+esc\(daily\.summary\)/);
});

run('compact Coach hero keeps decisions and safety fields unchanged', () => {
  assert.match(ui, /function hero\(result,kicker\)/);
  assert.match(ui, /Hazırlık '\+esc\(score\(result\)\)/);
  assert.match(ui, /Veri güveni '\+esc\(confidence\(result\)\)/);
  assert.match(ui, /esc\(decision\(result\)\)/);
  assert.match(ui, /esc\(adjustment\(result\)\)/);
  assert.match(ui, /list\(daily\.warnings,'Belirgin risk uyarısı yok\.',3\)/);
  assert.match(ui, /function actionItems\(result\)/);
  assert.match(ui, /\.slice\(0,3\)/);
  assert.doesNotMatch(ui, /class="sci-score"/);
});

run('Coach movement labels are localized without changing guidance keys', () => {
  for (const label of ['ANA HAREKET', 'TAMAMLAYICI', 'STABİLİTE / POSTÜR', 'KONDİSYON']) {
    assert.match(ui, new RegExp(label));
  }
  for (const key of ['mainLifts', 'accessories', 'stabilityPosture', 'conditioning']) {
    assert.match(ui, new RegExp(`value\\.${key}`));
  }
  assert.doesNotMatch(ui, />Readiness</);
});

run('Home has one short coach deep-link and Recovery has distinct insight', () => {
  assert.match(premium, /SimurgCoachUI\.decorateHome\(content,homeTab,homeDateValue\(\)\)/);
  assert.match(ui, /sci-home-insight/);
  assert.match(ui, /COACH INSIGHT/);
  assert.match(ui, /sci-recovery-insight/);
  assert.match(ui, /RECOVERY INSIGHT/);
  assert.match(ui, /simurgCoachOpen/);
  assert.match(ui, /removeLegacyCoachCards/);
});

run('desktop delegates Coaching to the common Coach UI output', () => {
  assert.match(desktop, /SimurgCoachUI\.renderDesktop/);
  assert.match(desktop, /SimurgCoachUI\.renderDesktop\(sec,selectedGlobalDate\(\)\)/);
  assert.doesNotMatch(desktop, /SimurgCoachUI\.renderDesktop\(sec,state\.loggerDate/);
  assert.match(ui, /function renderDesktop\(section,date\)/);
  assert.match(ui, /id="desktopLegacyCoaching"[^>]*data-coach-intelligence="1"/);
  assert.match(ui, /7 GÜNLÜK KARŞILAŞTIRMA/);
  assert.match(ui, /PATTERN COACH/);
});

run('coach UI preserves section scrolling and avoids lifecycle polling', () => {
  assert.match(css, /\.sci-coaching\{[^}]*overflow-y:auto/);
  assert.match(css, /main>#coaching\.section\.active\.sci-coaching\{[^}]*padding-bottom:calc\(var\(--simurgNativeNavH,76px\) \+ 34px \+ env\(safe-area-inset-bottom,0px\)\)!important;scroll-padding-bottom:/);
  assert.match(css, /\.sci-priority-grid\{[^}]*align-items:start/);
  assert.match(css, /\.sci-card\{[^}]*height:max-content/);
  assert.match(css, /\.sci-hero-main,\.sci-hero-summary\{[^}]*height:auto/);
  assert.doesNotMatch(ui, /new\s+MutationObserver|setInterval\s*\(/);
  assert.doesNotMatch(ui, /\bfetch\s*\(|supabase\.functions|OPENAI_API_KEY/);
});

run('mobile and desktop Coach views share the canonical selected date', () => {
  assert.match(ui, /function selected\(\)\{try\{if\(selectedDate\)return selectedDate;\}catch\(error\)\{\}return state\.date\|\|today\(\);\}/);
  assert.match(ui, /var date=selected\(\);state\.date=date;/);
  assert.match(ui, /date=date\|\|selected\(\);state\.date=date;/);
});

run('Coach confidence labels are explicit for users', () => {
  assert.match(ui, /Veri güveni/);
  assert.doesNotMatch(ui, /<small>Güven /);
  assert.doesNotMatch(ui, / · Güven /);
});

run('coach surfaces inherit the Simurg dark palette without light canvases', () => {
  assert.match(css, /--sci-surface:linear-gradient\(180deg,var\(--hz-surface-2\),var\(--hz-field\)\)/);
  assert.match(css, /\.sci-coaching\{[^]*?background:transparent!important/);
  assert.match(css, /\.sci-home-insight,[^]*?linear-gradient\(180deg,var\(--hz-surface-2\),var\(--hz-field\)\)/);
  assert.match(css, /\.sci-baseline-table>div\{[^]*?background:#07111b/);
  assert.doesNotMatch(css, /color-scheme\s*:\s*light/i);
  assert.doesNotMatch(css, /background(?:-color)?\s*:\s*(?:white|#fff(?:fff)?\b)/i);
  assert.doesNotMatch(css, /background(?:-color)?\s*:\s*#[fFeE][0-9a-fA-F]{5}\b/);
});

run('existing canonical mobile navigation remains unchanged', () => {
  for (const route of [
    "simurgV8Go('home','home')",
    "simurgV8Go('gym','gym')",
    "simurgV8Go('workout','logger')",
    "simurgV8Go('polar','polar')"
  ]) assert.ok(html.includes(route));
  assert.match(html, /<nav id="simurgV8Nav"/);
});

if (process.exitCode) process.exit(process.exitCode);
