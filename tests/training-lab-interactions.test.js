const assert = require('node:assert/strict');

const section = {
  innerHTML: '', controls: Object.create(null),
  querySelectorAll(selector) {
    const attributes = selector.includes('data-tl-group')
      ? [...this.innerHTML.matchAll(/data-tl-group="([^"]+)"/g)].map(match => ['data-tl-group', match[1]])
      : selector.includes('data-tl-week')
        ? [...this.innerHTML.matchAll(/data-tl-week="([^"]+)"/g)].map(match => ['data-tl-week', match[1]])
        : selector.includes('data-tl-exercise')
          ? [...this.innerHTML.matchAll(/data-tl-exercise="([^"]+)"/g)].map(match => ['data-tl-exercise', match[1]])
        : [...this.innerHTML.matchAll(/data-tl-(muscle|region)="([^"]+)"/g)].map(match => [`data-tl-${match[1]}`, match[2]]);
    return attributes.map(([name, value]) => {
      const control = { handlers: Object.create(null), hasAttribute(candidate) { return candidate === name; }, getAttribute(candidate) { return candidate === name ? value : null; }, addEventListener(event, handler) { this.handlers[event] = handler; } };
      this.controls[`${name}:${value}`] = control;
      return control;
    });
  }
};

global.document = { readyState: 'loading', addEventListener() {}, getElementById(id) { return id === 'training-lab' ? section : null; } };
global.innerWidth = 1200;
global.selectedDate = '2026-08-17';
global.SimurgMuscleAnatomy = require('../simurg-muscle-anatomy.js');
global.SimurgExerciseLibrary = require('../simurg-exercise-library.js');
global.SimurgExerciseCanonicalization = require('../simurg-exercise-canonicalization.js');
global.SimurgVolumeModel = require('../simurg-volume-model.js');
global.SimurgTrainingLabAnalysis = require('../simurg-training-lab-analysis.js');
global.DATA = { workouts: [
  { date: '2026-08-17', exercise: 'Incline DB Press', exerciseId: 'incline_dumbbell_press', sets: 4, reps: 10, weight: 30 },
  { date: '2026-08-18', exercise: 'Reverse Pec Deck', exerciseId: 'reverse_pec_deck', sets: 3, reps: 12, weight: 20 },
  { date: '2026-08-18', exercise: 'Lat Pulldown', exerciseId: 'lat_pulldown', sets: 4, reps: 10, weight: 45 },
  { date: '2026-08-19', exercise: 'Leg Extension', exerciseId: 'leg_extension', sets: 2, reps: 15, weight: 35 },
  { date: '2026-08-20', exercise: 'Lateral Raise', exerciseId: 'dumbbell_lateral_raise', sets: 3, reps: 12, weight: 8 },
  { date: '2026-08-21', exercise: 'Biceps Curl', exerciseId: 'dumbbell_curl', sets: 3, reps: 12, weight: 10 },
  { date: '2026-08-21', exercise: 'Prone Y Raise', exerciseId: 'prone_y_raise', sets: 3, reps: 12, weight: 5 },
  { date: '2026-08-21', exercise: 'Face Pull', exerciseId: 'face_pull', sets: 2, reps: 15, weight: 15 },
  { date: '2026-08-21', exercise: 'Reverse Cable Curl', exerciseId: 'reverse_cable_curl', sets: 2, reps: 12, weight: 12 },
  { date: '2026-08-22', exercise: 'Romanian Deadlift', exerciseId: 'romanian_deadlift', sets: 3, reps: 10, weight: 70 },
  { date: '2026-08-22', exercise: 'Sumo Deadlift', exerciseId: 'sumo_deadlift', sets: 2, reps: 8, weight: 80 },
  { date: '2026-08-22', exercise: 'Dead Bug', exerciseId: 'dead_bug', sets: 2, reps: 12, weight: 0 }
] };

require('../simurg-training-lab-ui.js');
global.SimurgTrainingLabUI.render();

section.controls['data-tl-muscle:pectoralis_clavicular'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="pectoralis_clavicular"/);
assert.match(section.innerHTML, /Pectoralis Clavicular · Hareket Katkısı/);
assert.match(section.innerHTML, /Incline Dumbbell Press/);
assert.match(section.innerHTML, /<strong>4 efektif set<\/strong>/);
section.controls['data-tl-exercise:incline_dumbbell_press'].handlers.click();
assert.match(section.innerHTML, /data-selected-exercise="incline_dumbbell_press"/);
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="pectoralis_clavicular"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="anterior_deltoid"/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion primary" data-tl-region="pectoralis_sternal"/);

section.controls['data-tl-region:posterior_deltoid'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="posterior_deltoid"/);
assert.match(section.innerHTML, /Posterior Deltoid · Hareket Katkısı/);
assert.match(section.innerHTML, /Reverse Pec Deck/);

section.controls['data-tl-group:Back'].handlers.click();
section.controls['data-tl-muscle:lats'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="lats"/);
section.controls['data-tl-exercise:lat_pulldown'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="lats"/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion primary" data-tl-region="lower_traps"/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary)" data-tl-region="rotator_cuff"/);

section.controls['data-tl-group:Legs'].handlers.click();
section.controls['data-tl-muscle:quads'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="quads"/);
assert.match(section.innerHTML, /Quads · Hareket Katkısı/);
section.controls['data-tl-exercise:leg_extension'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="quads"/);
for (const muscleId of ['hams', 'calves', 'adductors']) assert.doesNotMatch(section.innerHTML, new RegExp(`class="tlRegion primary" data-tl-region="${muscleId}"`));

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:posterior_deltoid'].handlers.click();
section.controls['data-tl-exercise:prone_y_raise'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="lower_traps"/);
for (const muscleId of ['rotator_cuff', 'posterior_deltoid']) assert.match(section.innerHTML, new RegExp(`class="tlRegion secondary" data-tl-region="${muscleId}"`));
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary)" data-tl-region="upper_traps"/);

section.controls['data-tl-muscle:posterior_deltoid'].handlers.click();
section.controls['data-tl-exercise:face_pull'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="posterior_deltoid"/);
for (const muscleId of ['rotator_cuff', 'lower_traps']) assert.match(section.innerHTML, new RegExp(`class="tlRegion secondary" data-tl-region="${muscleId}"`));

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:middle_deltoid'].handlers.click();
section.controls['data-tl-exercise:dumbbell_lateral_raise'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="middle_deltoid"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="upper_traps"/);

section.controls['data-tl-group:Arms'].handlers.click();
section.controls['data-tl-muscle:biceps'].handlers.click();
section.controls['data-tl-exercise:dumbbell_curl'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="biceps"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="forearms"/);

section.controls['data-tl-muscle:forearms'].handlers.click();
section.controls['data-tl-exercise:reverse_cable_curl'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="forearms"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="biceps"/);

section.controls['data-tl-group:Legs'].handlers.click();
section.controls['data-tl-muscle:hams'].handlers.click();
section.controls['data-tl-exercise:romanian_deadlift'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="hams"/);
for (const muscleId of ['glutes', 'spinal_erectors']) assert.match(section.innerHTML, new RegExp(`class="tlRegion secondary" data-tl-region="${muscleId}"`));

section.controls['data-tl-muscle:glutes'].handlers.click();
section.controls['data-tl-exercise:sumo_deadlift'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="glutes"/);
for (const muscleId of ['hams', 'quads', 'adductors', 'spinal_erectors']) assert.match(section.innerHTML, new RegExp(`class="tlRegion secondary" data-tl-region="${muscleId}"`));

section.controls['data-tl-group:Core'].handlers.click();
section.controls['data-tl-muscle:abs'].handlers.click();
section.controls['data-tl-exercise:dead_bug'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="abs"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="hip_flexors"/);

assert.equal([...section.innerHTML.matchAll(/data-tl-region="([^"]+)"/g)].length, 22);

section.controls['data-tl-week:-7'].handlers.click();
assert.match(section.innerHTML, /Nötr görünüm/);
assert.match(section.innerHTML, /Bu hafta için anatomik aktivasyon verisi yok/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary|active)"/);
assert.doesNotMatch(section.innerHTML, /class="tlMuscle active"/);

process.stdout.write('✓ muscle cards, anatomy regions and high-level categories stay synchronized by anatomical ID\n');
