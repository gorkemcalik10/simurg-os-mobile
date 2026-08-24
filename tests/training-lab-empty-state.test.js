const assert = require('node:assert/strict');

const section = {
  innerHTML: '',
  querySelectorAll() { return []; }
};

global.document = {
  readyState: 'loading',
  addEventListener() {},
  getElementById(id) { return id === 'training-lab' ? section : null; }
};
global.innerWidth = 1200;
global.selectedDate = '2026-08-17';
global.SimurgMuscleAnatomy = require('../simurg-muscle-anatomy.js');
global.SimurgExerciseLibrary = require('../simurg-exercise-library.js');
global.SimurgExerciseCanonicalization = require('../simurg-exercise-canonicalization.js');
global.SimurgVolumeModel = require('../simurg-volume-model.js');
global.SimurgTrainingLabAnalysis = require('../simurg-training-lab-analysis.js');
global.DATA = { workouts: [] };

require('../simurg-training-lab-ui.js');
global.SimurgTrainingLabUI.render();

assert.match(section.innerHTML, /Nötr görünüm/);
assert.match(section.innerHTML, /Bu hafta için anatomik aktivasyon verisi yok/);
assert.doesNotMatch(section.innerHTML, /class="tlRegion (?:primary|secondary|active)"/);
assert.doesNotMatch(section.innerHTML, /class="tlMuscle active"/);
assert.doesNotMatch(section.innerHTML, /data-selected-exercise=/);

process.stdout.write('✓ empty Training Lab weeks render a neutral anatomy without automatic muscle activation\n');
