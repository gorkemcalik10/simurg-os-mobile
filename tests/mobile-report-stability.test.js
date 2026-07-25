const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'premium-standard.css'), 'utf8');
const premium = fs.readFileSync(path.join(ROOT, 'premium-standard.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

assert.match(css, /:is\(#coaching,#program,#weekly,#monthly,#data\)\.section/);
assert.match(css, /min-width:0!important/);
assert.match(css, /#data\.section :is\(\.actions,\.coachReportActions,\.polarBridgeActions\)/);
assert.match(css, /flex-wrap:wrap!important/);
assert.match(css, /#monthly\.section \.gp-month-nav/);
assert.match(css, /body\[data-simurg-active-screen="polar-workout"\] #polar-workout/);
assert.match(premium, /function ensureMonthlyNavigation\(\)/);
assert.match(premium, /window\.simurgPremiumShiftMonth=function\(delta\)/);
assert.match(premium, /Math\.min\(day,lastDay\)/);
assert.match(
  premium,
  /selectedDate=next[\s\S]*window\.selectedDate=next[\s\S]*window\.render\(\)/,
  'month navigation must update both the canonical app date and legacy monthly report date before rendering',
);
assert.match(
  html,
  /function monthlyStatsStandalone\(\)\{[\s\S]*window\.selectedDate/,
  'monthly report must read the date synchronized by month navigation',
);
assert.match(html, /function hasPhysicalActivity\(d\)/);
assert.match(html, /shared\.primaryPolar\|\|shared\.appleLegacy/);
assert.doesNotMatch(html, /if\(hasGym\(d\) \|\| hasWatch\(d\)\) return/);
assert.doesNotMatch(premium, /setInterval\s*\(/);

process.stdout.write('✓ Mobile menu reports keep responsive cards and month navigation\n');
