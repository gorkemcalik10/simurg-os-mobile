const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'simurg-training-lab-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'simurg-training-lab.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const anatomyAsset = path.join(root, 'assets', 'simurg-anatomy-base-v1.png');

assert.match(index, /<section id="training-lab" class="section"/);
assert.match(index, /SimurgTrainingLabUI\.open\(this\)/);
assert.match(ui, /SimurgTrainingLabAnalysis\.analyze\(source,start\)/);
assert.match(index, /data-key="training-lab" onclick="SimurgTrainingLabUI\.open\(\)"/);
assert.match(ui, /simurgV8Go\('training-lab','training-lab'\)/);
assert.match(ui, /function anatomy\(selected\)/);
assert.match(ui, /assets\/simurg-anatomy-base-v1\.png/);
assert.ok(fs.existsSync(anatomyAsset), 'original local anatomy artwork must exist');
assert.ok(fs.statSync(anatomyAsset).size < 1024 * 1024, 'anatomy artwork must stay below 1 MB');
assert.match(sw, /assets\/simurg-anatomy-base-v1\.png/);
assert.doesNotMatch(ui, /tlBodyShade|class="tlBody"|class="tlContours"/);
for (const group of ['Chest', 'Back', 'Shoulders', 'Rear Delts', 'Biceps', 'Triceps', 'Legs', 'Core']) {
  assert.match(ui, new RegExp(`region\\('${group}'`));
}
assert.match(ui, /data-tl-region/);
assert.match(ui, /data-selected-muscle=/);
assert.match(ui, /state\.muscle=button\.getAttribute/);
assert.match(ui, /selected=result\.groupMap\[state\.muscle\]/);
assert.match(ui, /<details class="tlCalculation"><summary>Hesaplama Notu/);
assert.doesNotMatch(ui, /<details class="tlCalculation" open/);
assert.match(ui, /eşlenmemiş hareket · workload dışında tutuldu/);
for (const metric of ['Set katkısı', 'Tekrar', 'Antrenman günü', 'Anlamlı hacim']) assert.match(ui, new RegExp(metric));
assert.doesNotMatch(ui, /DATA\.workouts\s*=|localStorage\.setItem|setInterval|MutationObserver/);
assert.match(css, /@media\(max-width:900px\)/);
assert.match(css, /\.tlSummary\{display:grid;grid-template-columns:repeat\(4/);
assert.match(css, /\.tlMuscleGrid\{display:grid;grid-template-columns:repeat\(4/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tlMuscleGrid\{grid-template-columns:repeat\(2/);
assert.match(css, /\.tlMuscle b\{font-size:10px;white-space:normal;overflow:visible;text-overflow:clip/);
assert.match(css, /\.tlRegion\.active/);
assert.match(css, /\.tlAnatomyStage\{position:relative/);
assert.match(css, /mix-blend-mode:screen/);
assert.doesNotMatch(index.match(/<section id="gym"[\s\S]*?<section id="daily"/)?.[0] || '', /Training Lab|tlMuscle|tlDistribution/);
process.stdout.write('✓ Training Lab is a separate read-only responsive app section\n');
