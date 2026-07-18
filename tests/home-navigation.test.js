const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'premium-standard.js'), 'utf8');
const match = source.match(/window\.homePremiumMove=function\(delta\)\{([\s\S]*?)\n  \};/);
assert.ok(match, 'homePremiumMove handler is missing');
assert.doesNotMatch(match[1], /\brender\s*\(|dataChanged|invalidate/);
assert.match(source, /onclick="homePremiumMove\(-1\)"/);
assert.match(source, /onclick="homePremiumMove\(1\)"/);

const context = {
  window: {},
  selectedDate: '2026-07-18',
  weekStart: '',
  renderHomeCount: 0,
  renderCount: 0,
  dataChangedCount: 0
};
vm.createContext(context);
vm.runInContext(`
  function addDays(value, delta) { const d = new Date(value + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); }
  function mondayOf(value) { const d = new Date(value + 'T12:00:00Z'); const day = d.getUTCDay(); d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day)); return d.toISOString().slice(0, 10); }
  function renderHome() { renderHomeCount += 1; }
  function render() { renderCount += 1; }
  function dataChanged() { dataChangedCount += 1; }
  window.homePremiumMove = function(delta) {${match[1]}
  };
`, context);

context.window.homePremiumMove(-1);
assert.equal(context.selectedDate, '2026-07-17');
assert.equal(context.weekStart, '2026-07-13');
context.window.homePremiumMove(1);
assert.equal(context.selectedDate, '2026-07-18');
assert.equal(context.renderHomeCount, 2);
assert.equal(context.renderCount, 0);
assert.equal(context.dataChangedCount, 0);
process.stdout.write('✓ Home date navigation uses only renderHome\n');
