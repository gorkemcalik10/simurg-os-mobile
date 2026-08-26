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
global.selectedDate = '2026-08-23';
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
assert.equal(global.SimurgTrainingLabUI.rendererPlan.activeVersion, 'legacy-v1');
assert.match(section.innerHTML, /data-renderer-version="legacy-v1"/);
assert.equal([...section.innerHTML.matchAll(/data-hit-area-mode="legacy-svg-path"/g)].length, 22);

function assertMask(role, muscleId) {
  assert.match(section.innerHTML, new RegExp(`class="tlMask ${role}"[^>]+anatomy-masks/${muscleId}\\.png`));
}
function assertNoMask(role, muscleId) {
  assert.doesNotMatch(section.innerHTML, new RegExp(`class="tlMask ${role}"[^>]+anatomy-masks/${muscleId}\\.png`));
}
function assertInactive(muscleId) {
  assertNoMask('primary', muscleId);
  assertNoMask('secondary', muscleId);
}

section.controls['data-tl-muscle:pectoralis_clavicular'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="pectoralis_clavicular"/);
assertMask('primary', 'pectoralis_clavicular');
assert.match(section.innerHTML, /Pectoralis Clavicular · Hareket Katkısı/);
assert.match(section.innerHTML, /Incline Dumbbell Press/);
assert.match(section.innerHTML, /<strong>4 efektif set<\/strong>/);
section.controls['data-tl-exercise:incline_dumbbell_press'].handlers.click();
assert.match(section.innerHTML, /data-selected-exercise="incline_dumbbell_press"/);
assertMask('primary', 'pectoralis_clavicular');
assertMask('secondary', 'anterior_deltoid');
for (const muscleId of ['triceps_long', 'triceps_lateral']) assertMask('secondary', muscleId);
assertNoMask('primary', 'pectoralis_sternal');

section.controls['data-tl-region:posterior_deltoid'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="posterior_deltoid"/);
assert.match(section.innerHTML, /Posterior Deltoid · Hareket Katkısı/);
assert.match(section.innerHTML, /Reverse Pec Deck/);

section.controls['data-tl-group:Back'].handlers.click();
section.controls['data-tl-muscle:lats'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="lats"/);
section.controls['data-tl-exercise:lat_pulldown'].handlers.click();
assertMask('primary', 'lats');
assertMask('secondary', 'biceps');
assertNoMask('primary', 'lower_traps');
assertInactive('rotator_cuff');

section.controls['data-tl-group:Legs'].handlers.click();
section.controls['data-tl-muscle:quads'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="quads"/);
assert.match(section.innerHTML, /Quads · Hareket Katkısı/);
section.controls['data-tl-exercise:leg_extension'].handlers.click();
assertMask('primary', 'quads');
for (const muscleId of ['hams', 'calves', 'adductors']) assertNoMask('primary', muscleId);

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:posterior_deltoid'].handlers.click();
section.controls['data-tl-exercise:prone_y_raise'].handlers.click();
assertMask('primary', 'lower_traps');
for (const muscleId of ['rotator_cuff', 'posterior_deltoid']) assertMask('secondary', muscleId);
assertInactive('upper_traps');

section.controls['data-tl-muscle:posterior_deltoid'].handlers.click();
section.controls['data-tl-exercise:face_pull'].handlers.click();
assertMask('primary', 'posterior_deltoid');
for (const muscleId of ['rotator_cuff', 'lower_traps']) assertMask('secondary', muscleId);

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:middle_deltoid'].handlers.click();
section.controls['data-tl-exercise:dumbbell_lateral_raise'].handlers.click();
assertMask('primary', 'middle_deltoid');
assertMask('secondary', 'upper_traps');

section.controls['data-tl-group:Arms'].handlers.click();
section.controls['data-tl-muscle:biceps'].handlers.click();
section.controls['data-tl-exercise:dumbbell_curl'].handlers.click();
assertMask('primary', 'biceps');
assertMask('secondary', 'forearms');

section.controls['data-tl-muscle:forearms'].handlers.click();
section.controls['data-tl-exercise:reverse_cable_curl'].handlers.click();
assertMask('primary', 'forearms');
assertMask('secondary', 'biceps');

section.controls['data-tl-group:Legs'].handlers.click();
section.controls['data-tl-muscle:hams'].handlers.click();
section.controls['data-tl-exercise:romanian_deadlift'].handlers.click();
assertMask('primary', 'hams');
for (const muscleId of ['glutes', 'spinal_erectors']) assertMask('secondary', muscleId);

section.controls['data-tl-muscle:glutes'].handlers.click();
section.controls['data-tl-exercise:sumo_deadlift'].handlers.click();
assertMask('primary', 'glutes');
for (const muscleId of ['hams', 'quads', 'adductors', 'spinal_erectors']) assertMask('secondary', muscleId);

section.controls['data-tl-group:Core'].handlers.click();
section.controls['data-tl-muscle:abs'].handlers.click();
section.controls['data-tl-exercise:dead_bug'].handlers.click();
assertMask('primary', 'abs');
assertMask('secondary', 'hip_flexors');

assert.equal([...section.innerHTML.matchAll(/data-tl-region="([^"]+)"/g)].length, 22);

section.controls['data-tl-week:-7'].handlers.click();
assert.match(section.innerHTML, /Nötr görünüm/);
assert.match(section.innerHTML, /Bu hafta için anatomik aktivasyon verisi yok/);
assert.doesNotMatch(section.innerHTML, /class="tlMask (?:primary|secondary)"/);
assert.doesNotMatch(section.innerHTML, /class="tlMuscle active"/);

process.stdout.write('✓ muscle cards, anatomy regions and high-level categories stay synchronized by anatomical ID\n');
