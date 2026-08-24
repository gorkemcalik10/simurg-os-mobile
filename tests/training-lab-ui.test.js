const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'simurg-training-lab-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'simurg-training-lab.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const muscleAnatomy = require('../simurg-muscle-anatomy.js');
const anatomyAsset = path.join(root, 'assets', 'simurg-anatomy-base-v1.png');

assert.match(index, /<section id="training-lab" class="section"/);
assert.match(index, /SimurgTrainingLabUI\.open\(this\)/);
assert.match(ui, /SimurgTrainingLabAnalysis\.analyze\(source,start\)/);
assert.match(index, /data-key="training-lab" onclick="SimurgTrainingLabUI\.open\(\)"/);
assert.match(ui, /simurgV8Go\('training-lab','training-lab'\)/);
assert.match(ui, /function anatomy\(selected,exercise\)/);
assert.match(ui, /Training Lab · v3\.6/);
assert.match(ui, /VISUAL_ROLE_OVERRIDES/);
for (const mapping of [
  "prone_y_raise:{primary:['lower_traps'],secondary:['rotator_cuff','posterior_deltoid']}",
  "face_pull:{primary:['posterior_deltoid'],secondary:['rotator_cuff','lower_traps']}",
  "straight_arm_pulldown:{primary:['lats'],secondary:['triceps_long']}",
  "reverse_cable_curl:{primary:['forearms'],secondary:['biceps']}",
  "romanian_deadlift:{primary:['hams'],secondary:['glutes','spinal_erectors']}",
  "dumbbell_romanian_deadlift:{primary:['hams'],secondary:['glutes','spinal_erectors']}",
  "conventional_deadlift:{primary:['glutes','hams'],secondary:['spinal_erectors','lats','upper_traps']}",
  "sumo_deadlift:{primary:['glutes'],secondary:['hams','quads','adductors','spinal_erectors']}"
]) assert.ok(ui.includes(mapping), `${mapping.split(':')[0]} must keep its visual-only anatomy mapping`);
assert.match(ui, /manualSelection=!exercise&&selected&&state\.muscle===selected\.id&&VISUAL_REGION_MAP\[selected\.id\]/);
assert.match(ui, /preserveAspectRatio="xMidYMid meet"/);
assert.match(ui, /assets\/simurg-anatomy-base-v1\.png/);
assert.ok(fs.existsSync(anatomyAsset), 'original local anatomy artwork must exist');
assert.ok(fs.statSync(anatomyAsset).size < 1024 * 1024, 'anatomy artwork must stay below 1 MB');
assert.match(sw, /assets\/simurg-anatomy-base-v1\.png/);
assert.doesNotMatch(ui, /tlBodyShade|class="tlBody"|class="tlContours"/);
const visualRegions = ['pectoralis_sternal','pectoralis_clavicular','abs','obliques','anterior_deltoid','middle_deltoid','biceps','forearms','quads','hip_flexors','adductors','upper_traps','lower_traps','spinal_erectors','lats','rotator_cuff','posterior_deltoid','triceps_long','triceps_lateral','glutes','hams','calves'];
assert.equal(visualRegions.length, 22);
for (const id of visualRegions) assert.match(ui, new RegExp(`\\b${id}:`), `${id} must have a visual region`);
assert.match(ui, /data-tl-region/);
assert.match(ui, /data-tl-group/);
assert.match(ui, /data-selected-muscle=/);
assert.match(ui, /data-selected-exercise=/);
assert.match(ui, /data-tl-exercise/);
assert.match(ui, /function visualId\(id\)/);
assert.match(ui, /function visualAnatomy\(result\)/);
assert.match(ui, /Array\.isArray\(exercise\.muscles\)/);
assert.match(ui, /mapping\.primaryMuscles/);
assert.match(ui, /mapping\.secondaryMuscles/);
assert.match(ui, /state\.muscle=id/);
assert.match(ui, /VISUAL_REGION_MAP\[id\]/);
assert.match(ui, /Haftalık Anatomik Dağılım/);
for (const label of ['Pectoralis Major Clavicular', 'Pectoralis Major Sternal', 'Latissimus Dorsi', 'Anterior Deltoid', 'Posterior Deltoid', 'Vastus Lateralis', 'Rectus Femoris']) assert.ok(muscleAnatomy.muscles.some(item => item.label === label), label);
assert.match(ui, /<details class="tlCalculation"><summary>Hesaplama Notu/);
assert.doesNotMatch(ui, /<details class="tlCalculation" open/);
assert.match(ui, /eşlenmemiş hareket · workload dışında tutuldu/);
for (const metric of ['Set katkısı', 'Tekrar', 'Antrenman günü', 'Anlamlı hacim']) assert.match(ui, new RegExp(metric));
assert.doesNotMatch(ui, /DATA\.workouts\s*=|localStorage\.setItem|setInterval|MutationObserver/);
assert.match(css, /@media\(max-width:900px\)/);
assert.match(css, /\.tlSummary\{display:grid;grid-template-columns:repeat\(4/);
assert.match(css, /\.tlMuscleGrid\{display:grid;grid-template-columns:repeat\(3/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tlMuscleGrid\{grid-template-columns:repeat\(2/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tlMuscle b\{font-size:9px;white-space:normal;overflow:visible;text-overflow:clip/);
assert.match(css, /\.tlRegion\.primary/);
assert.match(css, /\.tlRegion\.secondary/);
assert.match(css, /\.tlAnatomyStage\{position:relative/);
assert.match(css, /\.tlAnatomyStage\{[^}]*aspect-ratio:2\/3;overflow:hidden;contain:layout paint/);
assert.match(css, /\.tlAnatomyStage img\{object-fit:contain/);
assert.doesNotMatch(css, /mix-blend-mode/);
assert.match(css, /--tl-active:#e12d3f/);
assert.match(css, /\.tlRegion\.primary\{[^}]*stroke:transparent;filter:none/);
assert.match(css, /\.tlRegion\.secondary\{[^}]*stroke:transparent;filter:none/);
assert.match(css, /\.tlRegion\.primary\{[^}]*fill:var\(--tl-active\)/);
assert.match(css, /\.tlRegion\.secondary\{[^}]*fill:#eb7041/);
assert.doesNotMatch(css, /\.tlRegion\.active/);
assert.doesNotMatch(ui, /tlGlow|feGaussianBlur/);

function regionSubpaths(id) {
  const match = ui.match(new RegExp(`\\n\\s+${id}:'(M[^']+)'`));
  assert.ok(match, `${id} SVG path must exist`);
  return match[1].split(/\s+Z\s*/).filter(Boolean).map(pathData => {
    const values = [...pathData.matchAll(/-?\d+(?:\.\d+)?/g)].map(item => Number(item[0]));
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  });
}

const [leftLat, rightLat] = regionSubpaths('latissimus_dorsi');
assert.ok(leftLat.minX >= 620 && leftLat.maxX <= 755, 'left lat must stay within the visible latissimus tissue');
assert.ok(rightLat.minX >= 770 && rightLat.maxX <= 900, 'right lat must stay within the visible latissimus tissue');
assert.ok(leftLat.maxX < rightLat.minX, 'lat regions must not cover the central spinal/erector channel');
assert.ok(leftLat.maxY <= 675 && rightLat.maxY <= 675, 'lat highlight must stop above the lumbar/hip region');

const [leftAnteriorDelt, rightAnteriorDelt] = regionSubpaths('anterior_deltoid');
assert.ok(leftAnteriorDelt.minX >= 125 && leftAnteriorDelt.maxX <= 190, 'left anterior deltoid must stay on the front shoulder cap');
assert.ok(rightAnteriorDelt.minX >= 350 && rightAnteriorDelt.maxX <= 415, 'right anterior deltoid must stay on the front shoulder cap');
assert.ok(leftAnteriorDelt.maxY <= 380 && rightAnteriorDelt.maxY <= 380, 'anterior deltoid must not spill into the upper arm');

const quadBounds = Object.fromEntries(['vastus_lateralis', 'rectus_femoris', 'vastus_medialis'].map(id => [id, regionSubpaths(id)]));
for (const bounds of Object.values(quadBounds)) assert.equal(bounds.length, 2, 'each quadriceps region must be bilateral');
assert.ok(quadBounds.vastus_lateralis[0].maxX < quadBounds.rectus_femoris[0].minX);
assert.ok(quadBounds.rectus_femoris[0].maxX < quadBounds.vastus_medialis[0].minX);
assert.ok(quadBounds.vastus_medialis[1].maxX < quadBounds.rectus_femoris[1].minX);
assert.ok(quadBounds.rectus_femoris[1].maxX < quadBounds.vastus_lateralis[1].minX);
assert.ok(quadBounds.vastus_medialis[0].minY > 840 && quadBounds.vastus_medialis[1].minY > 840, 'vastus medialis must remain a distal teardrop region');
assert.doesNotMatch(index.match(/<section id="gym"[\s\S]*?<section id="daily"/)?.[0] || '', /Training Lab|tlMuscle|tlDistribution/);
process.stdout.write('✓ Training Lab is a separate read-only responsive app section\n');
