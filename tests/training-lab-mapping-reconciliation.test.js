const assert = require('node:assert/strict');
const {buildReport} = require('../scripts/report-training-lab-mapping.js');

const report = buildReport();
assert.deepEqual(report.model, {canonicalMuscles:32, visualRegions:22});
assert.equal(report.canonicalCoverage.mapped, 32);
assert.deepEqual(report.canonicalCoverage.missing, []);
assert.deepEqual(report.visualOnlyRegions.map(item => item.regionId), ['forearms','hip_flexors','adductors','spinal_erectors','rotator_cuff']);
for (const exerciseId of ['prone_y_raise','face_pull','romanian_deadlift','conventional_deadlift','sumo_deadlift','farmers_walk']) {
  assert.ok(report.exercises.visualOverrides.some(item => item.exerciseId === exerciseId), exerciseId + ' override must be reconciled');
}
for (const exerciseId of ['conventional_deadlift','sumo_deadlift','back_extension','reverse_hyperextension','farmers_walk']) {
  assert.ok(report.exercises.analysisUnmapped.some(item => item.exerciseId === exerciseId), exerciseId + ' must remain visible in the analysis gap report');
}
assert.ok(report.uiCopyRecommendations.length >= 4);
assert.deepEqual(report.productDecisions.map(item => item.exerciseId), ['bird_dog','sled_push','kettlebell_swing','battle_rope','dumbbell_thruster']);
assert.ok(report.productDecisions.every(item => item.analysisMapped === false && item.visualOverride === null && item.decisionStatus === 'open-no-mapping-change'));
assert.ok(report.exercises.presentationWithoutAnalysis.some(item => item.exerciseId === 'bird_dog'));

process.stdout.write('✓ Training Lab mapping reconciliation covers canonical, visual-only, library and override layers\n');
