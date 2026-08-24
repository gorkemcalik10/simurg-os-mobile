const assert = require('node:assert/strict');
const {generateReadinessReport} = require('../scripts/report-training-lab-v2-readiness.js');

const report = generateReadinessReport();
assert.equal(report.pipelineReadiness, 'Ready');
assert.equal(report.realAssetReadiness, 'Waiting for licensed source package');
assert.equal(report.productionV2Activation, 'Blocked by design');
assert.equal(report.currentRendererMode, 'V1 fallback');
assert.ok(report.v2ActivationBlockers.includes('unverified_asset_source'));
assert.ok(report.failedValidationGates.includes('visual_approval_required'));
assert.equal(report.missingAssets.filter(item => item.asset === 'mask').length, 22);
assert.equal(report.missingAssets.filter(item => item.asset === 'baseImage').length, 1);
assert.match(report.nextRequiredHumanAction, /approved licensed 1024x1536 RGBA anatomy master/);

const fs = require('node:fs');
const path = require('node:path');
const documents = [
  '../docs/TRAINING_LAB_V2_REAL_ASSET_ONBOARDING.md',
  '../docs/TRAINING_LAB_V2_FINAL_INTEGRATION_READINESS.md',
  '../docs/TRAINING_LAB_V2_FINAL_RELEASE_READINESS_CHECKLIST.md',
  '../docs/TRAINING_LAB_V2_MAPPING_RECONCILIATION.md',
  '../docs/TRAINING_LAB_V2_VISUAL_ONLY_PRODUCT_DECISIONS.md',
  '../assets/training-lab-v2/README.md'
].map(file => fs.readFileSync(path.join(__dirname, file), 'utf8'));
for (const document of documents) {
  assert.match(document, /32 canonical/);
  assert.match(document, /22 visual/);
  assert.match(document, /V1 fallback/);
  assert.match(document, /visual approval/);
  for (const exercise of ['Bird Dog','Sled Push','Kettlebell Swing','Battle Rope','Dumbbell Thruster']) assert.match(document, new RegExp(exercise));
}
assert.match(documents[0], /--expected-fingerprint/);
assert.match(documents[1], /--expected-fingerprint/);
assert.match(documents[2], /--expected-fingerprint/);
assert.match(documents[5], /--expected-fingerprint/);
assert.doesNotMatch(documents[5], /only that region uses the legacy SVG hit path/);

const immutableChecklist = documents[2];
const acceptanceOrder = [
  'Licensed master received',
  'Provenance metadata recorded',
  'SHA-256 verified',
  '22 masks validated',
  'Dry-run acceptance',
  'Fingerprint match',
  'Publish',
  'Repository validation',
  'Mobile/desktop visual approval',
  'V2 activation decision'
];
let previousIndex = -1;
for (const gate of acceptanceOrder) {
  const index = immutableChecklist.indexOf(gate);
  assert.ok(index > previousIndex, `immutable release gate is missing or out of order: ${gate}`);
  previousIndex = index;
}
assert.match(immutableChecklist, /cannot activate without a technically valid complete package and recorded visual approval/);
assert.match(immutableChecklist, /missing base image, mask, contour[\s\S]*wholly on V1 fallback/);
assert.match(immutableChecklist, /V1 and V2 assets cannot be combined/);
assert.match(immutableChecklist, /Publish cannot proceed without the exact expected fingerprint/);

process.stdout.write('✓ Training Lab readiness report names renderer mode, blockers, missing assets, failed gates and next human action\n');
