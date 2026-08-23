const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'simurg-training-lab-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'simurg-training-lab.css'), 'utf8');

assert.match(index, /<section id="training-lab" class="section"/);
assert.match(index, /SimurgTrainingLabUI\.open\(this\)/);
assert.match(ui, /SimurgTrainingLabAnalysis\.analyze\(source,start\)/);
assert.match(index, /data-key="training-lab" onclick="SimurgTrainingLabUI\.open\(\)"/);
assert.match(ui, /simurgV8Go\('training-lab','training-lab'\)/);
assert.doesNotMatch(ui, /DATA\.workouts\s*=|localStorage\.setItem|setInterval|MutationObserver/);
assert.match(css, /@media\(max-width:900px\)/);
assert.doesNotMatch(index.match(/<section id="gym"[\s\S]*?<section id="daily"/)?.[0] || '', /Training Lab|tlMuscle|tlDistribution/);
process.stdout.write('✓ Training Lab is a separate read-only responsive app section\n');
