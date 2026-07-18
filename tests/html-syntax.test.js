const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
for (const file of ['simurg-signal-model.js', 'premium-standard.js', 'desktop-alignment.js', 'polar-workout.js', 'polar-accesslink.js', 'sw.js']) {
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length > 0);
scripts.forEach((match, index) => {
  new vm.Script(match[1], { filename: `index.html:inline-script-${index + 1}` });
});
process.stdout.write(`✓ JavaScript syntax valid (${scripts.length} inline scripts + external runtime files)\n`);
