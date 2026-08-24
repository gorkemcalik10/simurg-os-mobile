const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
for (const file of ['simurg-volume-model.js', 'simurg-exercise-library.js', 'simurg-muscle-anatomy.js', 'simurg-training-lab-anatomy-assets.js', 'simurg-training-lab-anatomy-renderer.js', 'simurg-exercise-history.js', 'simurg-training-lab-analysis.js', 'simurg-training-lab-ui.js', 'simurg-next-session-target.js', 'simurg-data-validation.js', 'simurg-workout-recovery.js', 'simurg-signal-model.js', 'simurg-sleep-intelligence.js', 'simurg-recovery-intelligence.js', 'simurg-energy-engine.js', 'simurg-coach-engine.js', 'simurg-coach-client.js', 'simurg-coach-ui.js', 'premium-standard.js', 'desktop-alignment.js', 'polar-workout.js', 'polar-accesslink.js', 'simurg-cloud-auth.js', 'sw.js']) {
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length > 0);
scripts.forEach((match, index) => {
  new vm.Script(match[1], { filename: `index.html:inline-script-${index + 1}` });
});
process.stdout.write(`✓ JavaScript syntax valid (${scripts.length} inline scripts + external runtime files)\n`);
