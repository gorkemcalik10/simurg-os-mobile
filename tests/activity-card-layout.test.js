const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'premium-standard.css'), 'utf8');
const active = html.replace(/<template\b[\s\S]*?<\/template>/gi, '');

assert.doesNotMatch(active, /installActivityCardPatch|setTimeout\s*\(\s*install\s*,\s*300\s*\)/);
assert.equal((active.match(/function renderSingleActivityCard\s*\(/g) || []).length, 1);
assert.equal((active.match(/window\.renderSingleActivityCard\s*=\s*function/g) || []).length, 0);
assert.match(active, /class="simurg-activity-card"/);

const start = active.indexOf('function renderSingleActivityCard');
assert.ok(start >= 0);
const open = active.indexOf('{', start);
let depth = 0, end = -1;
for (let i = open; i < active.length; i += 1) {
  if (active[i] === '{') depth += 1;
  else if (active[i] === '}' && --depth === 0) { end = i + 1; break; }
}
assert.ok(end > open);
const fnSource = active.slice(start, end);
const context = {
  DATA: { activityNotes: {} },
  escapeAttr: value => String(value),
  trDate: value => value
};
vm.createContext(context);
vm.runInContext(`${fnSource}; this.renderCard = renderSingleActivityCard;`, context);
const sparse = context.renderCard('2026-07-17', { rows: [{}], primary: 'FUNCTIONAL_TRAINING', name: 'Functional Training', emoji: '⌁', sourceLabel: 'Polar', isPolar: true, duration: '-', active: 0, total: 0, distance: 0, dist: '', avgHR: 0, maxHR: 0, rpe: '' });
assert.equal((sparse.match(/activityStatBox/g) || []).length, 0);
assert.doesNotMatch(sparse, />\s*-\s*</);

const rule = css.match(/\.simurg-activity-card\{([^}]*)\}/);
assert.ok(rule, 'authoritative activity card CSS is missing');
assert.match(rule[1], /height:auto/);
assert.match(rule[1], /min-height:0/);
assert.match(rule[1], /align-content:start/);
assert.match(css, /\.simurg-activity-card \.activityStatsGrid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
process.stdout.write('✓ Activity Session uses one compact source-aware renderer\n');
