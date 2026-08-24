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
  { date: '2026-08-21', exercise: 'Prone Y Raise', exerciseId: 'prone_y_raise', sets: 3, reps: 12, weight: 5 }
] };

require('../simurg-training-lab-ui.js');
global.SimurgTrainingLabUI.render();

section.controls['data-tl-muscle:pectoralis_major_clavicular'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="pectoralis_major_clavicular"/);
assert.match(section.innerHTML, /Pectoralis Major Clavicular · Hareket Katkısı/);
assert.match(section.innerHTML, /Incline Dumbbell Press/);
assert.match(section.innerHTML, /<strong>4 efektif set<\/strong>/);
section.controls['data-tl-exercise:incline_dumbbell_press'].handlers.click();
assert.match(section.innerHTML, /data-selected-exercise="incline_dumbbell_press"/);
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="pectoralis_major_clavicular"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="anterior_deltoid"/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion primary" data-tl-region="pectoralis_major_sternal"/);

section.controls['data-tl-region:posterior_deltoid'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="posterior_deltoid"/);
assert.match(section.innerHTML, /Posterior Deltoid · Hareket Katkısı/);
assert.match(section.innerHTML, /Reverse Pec Deck/);

section.controls['data-tl-group:Back'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="latissimus_dorsi"/);
section.controls['data-tl-exercise:lat_pulldown'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="latissimus_dorsi"/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion primary" data-tl-region="(?:trapezius_middle|rhomboid_major)"/);

section.controls['data-tl-group:Legs'].handlers.click();
assert.match(section.innerHTML, /data-selected-muscle="rectus_femoris"/);
assert.match(section.innerHTML, /Rectus Femoris · Hareket Katkısı/);
section.controls['data-tl-exercise:leg_extension'].handlers.click();
for (const muscleId of ['rectus_femoris', 'vastus_lateralis', 'vastus_medialis']) assert.match(section.innerHTML, new RegExp(`class="tlRegion primary" data-tl-region="${muscleId}"`));
for (const muscleId of ['hamstring_biceps_femoris', 'hamstring_semitendinosus', 'hamstring_semimembranosus', 'gastrocnemius', 'soleus']) assert.doesNotMatch(section.innerHTML, new RegExp(`class="tlRegion primary" data-tl-region="${muscleId}"`));

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:posterior_deltoid'].handlers.click();
section.controls['data-tl-exercise:prone_y_raise'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="trapezius_lower"/);
for (const muscleId of ['trapezius_middle', 'rhomboid_major', 'posterior_deltoid']) assert.match(section.innerHTML, new RegExp(`class="tlRegion secondary" data-tl-region="${muscleId}"`));
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary)" data-tl-region="trapezius_upper"/);

section.controls['data-tl-group:Shoulders'].handlers.click();
section.controls['data-tl-muscle:lateral_deltoid'].handlers.click();
section.controls['data-tl-exercise:dumbbell_lateral_raise'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="lateral_deltoid"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="trapezius_upper"/);

section.controls['data-tl-group:Arms'].handlers.click();
section.controls['data-tl-muscle:biceps_brachii'].handlers.click();
section.controls['data-tl-exercise:dumbbell_curl'].handlers.click();
assert.match(section.innerHTML, /class="tlRegion primary" data-tl-region="biceps_brachii"/);
assert.match(section.innerHTML, /class="tlRegion secondary" data-tl-region="brachialis"/);

section.controls['data-tl-week:-7'].handlers.click();
assert.match(section.innerHTML, /Nötr görünüm/);
assert.match(section.innerHTML, /Bu hafta için anatomik aktivasyon verisi yok/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary|active)"/);
assert.doesNotMatch(section.innerHTML, /class="tlMuscle active"/);

process.stdout.write('✓ muscle cards, anatomy regions and high-level categories stay synchronized by anatomical ID\n');
