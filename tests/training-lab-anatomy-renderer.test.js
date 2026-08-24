const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assets = require('../simurg-training-lab-anatomy-assets.js');
const renderer = require('../simurg-training-lab-anatomy-renderer.js');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'training-lab-v2', 'anatomy-manifest.json'), 'utf8'));

const fallback = renderer.createPlan({preferredVersion:'v2', manifest});
assert.equal(fallback.activeVersion, 'legacy-v1');
assert.equal(fallback.mode, 'legacy-mask-svg-hit');
assert.match(fallback.fallbackReason, /asset_pipeline_not_ready/);
assert.equal(fallback.diagnostics.rendererMode, 'V1 fallback');
assert.equal(fallback.diagnostics.blocked, true);
assert.equal(fallback.diagnostics.missingAssets.length, 22);
assert.equal(fallback.baseImageUrl, assets.baseImageUrl);
assert.equal(fallback.regions.length, 22);

const readyManifest = JSON.parse(JSON.stringify(manifest));
readyManifest.assetVersion = 'training-lab-v2-source-001';
readyManifest.status = 'ready';
readyManifest.activation = {
  status: 'approved',
  approvedBy: 'visual-reviewer',
  approvedAt: '2026-08-24T18:00:00.000Z',
  visualRegressionFixture: 'tests/fixtures/training-lab-v2-visual-regression.json'
};
readyManifest.source = {
  validationStatus: 'verified',
  sha256Verification: 'matched',
  sourceUrl: 'https://assets.example.test/anatomy-source',
  license: 'commercial-license-reference-001',
  author: 'approved-provider',
  sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
};
readyManifest.regions.forEach((region, index) => {
  region.status = 'ready';
  region.bounds = region.view === 'front' ? {x:10,y:10,width:10,height:10} : {x:600,y:10,width:10,height:10};
  region.contour = './assets/training-lab-v2/contours/' + region.regionId + '.json';
  region.sha256 = String(index + 1).padStart(64, '0');
  region.contourSha256 = String(index + 101).padStart(64, '0');
  if (index === 0) region.hitPath = 'M0 0 H10 V10 H0 Z';
});

const awaitingApproval = JSON.parse(JSON.stringify(readyManifest));
awaitingApproval.activation.status = 'pending_visual_approval';
awaitingApproval.activation.approvedBy = null;
awaitingApproval.activation.approvedAt = null;
awaitingApproval.activation.visualRegressionFixture = null;
const approvalFallback = renderer.createPlan({preferredVersion:'v2', manifest:awaitingApproval, assetExists:() => true});
assert.equal(approvalFallback.activeVersion, 'legacy-v1');
assert.match(approvalFallback.fallbackReason, /visual_approval_required/);
const approvalComparison = renderer.createComparisonPlan({manifest:awaitingApproval, assetExists:() => true});
assert.equal(approvalComparison.v2Ready, true);
assert.equal(approvalComparison.activationApproved, false);
assert.equal(approvalComparison.candidate.activeVersion, 'v2');

const v2 = renderer.createPlan({preferredVersion:'v2', manifest:readyManifest, assetExists:() => true});
assert.equal(v2.activeVersion, 'v2');
assert.equal(v2.mode, 'v2-mask-contour');
assert.equal(v2.baseImageUrl, readyManifest.baseImage + '?assetVersion=' + readyManifest.assetVersion);
assert.equal(v2.regions.length, 22);
assert.equal(v2.regions[0].hitAreaMode, 'manifest-contour');
assert.equal(v2.regions[1].hitAreaMode, 'legacy-path-fallback');
assert.match(v2.regions[1].maskUrl, /training-lab-v2\/masks\/pectoralis_clavicular\.png\?assetVersion=training-lab-v2-source-001$/);
assert.equal(v2.diagnostics.rendererMode, 'V2 candidate');
assert.equal(v2.diagnostics.blocked, false);

const comparison = renderer.createComparisonPlan({manifest:readyManifest, assetExists:() => true, fixtureKey:'face_pull'});
assert.equal(comparison.mode, 'v1-v2-comparison');
assert.equal(comparison.v2Ready, true);
assert.equal(comparison.legacy.activeVersion, 'legacy-v1');
assert.equal(comparison.candidate.activeVersion, 'v2');
assert.equal(comparison.fixtureKey, 'face_pull');
const loadValidContour = url => Promise.resolve({...contourDocument, regionId:url.split('/').pop().split('?')[0].replace('.json','')});
const loadedPlan = renderer.loadPlan({loadManifest:() => readyManifest, assetExists:() => true, loadContour:loadValidContour});
assert.equal(typeof loadedPlan.then, 'function');
loadedPlan.then(plan => assert.equal(plan.activeVersion, 'v2'));
const failedPreflight = renderer.loadPlan({loadManifest:() => readyManifest, assetExists:() => true, loadAsset:() => Promise.reject(new Error('missing'))});
failedPreflight.then(plan => {
  assert.equal(plan.activeVersion, 'legacy-v1');
  assert.equal(plan.fallbackReason, 'asset_preflight_failed');
});
const contourDocument = {
  schemaVersion:1,
  regionId:'pectoralis_sternal',
  coordinateSpace:'combined-atlas-pixels',
  canvas:{width:1024,height:1536},
  svgPath:'M10 10 L20 10 L20 20 L10 20 Z'
};
renderer.loadPlan({
  manifest:readyManifest,
  assetExists:() => true,
  loadContour:loadValidContour
}).then(plan => {
  assert.equal(plan.regions[0].hitAreaMode, 'mask-contour-file');
  assert.equal(plan.regions[0].hitPath, contourDocument.svgPath);
});
renderer.loadPlan({
  manifest:readyManifest,
  assetExists:() => true,
  loadContour:url => url.includes('rotator_cuff') ? Promise.reject(new Error('missing')) : Promise.resolve({...contourDocument, regionId:url.split('/').pop().split('?')[0].replace('.json','')})
}).then(plan => {
  assert.equal(plan.activeVersion, 'legacy-v1');
  assert.equal(plan.fallbackReason, 'contour_preflight_failed');
  assert.ok(plan.diagnostics.validationErrors.some(error => error.regionId === 'rotator_cuff'));
});

const duplicateManifest = JSON.parse(JSON.stringify(readyManifest));
duplicateManifest.regions[1].regionId = duplicateManifest.regions[0].regionId;
const duplicateResult = assets.validateManifest(duplicateManifest, {assetExists:() => true});
assert.ok(duplicateResult.errors.some(error => error.code === 'duplicate_region'));
assert.ok(duplicateResult.errors.some(error => error.code === 'missing_region_id'));

const misalignedManifest = JSON.parse(JSON.stringify(readyManifest));
misalignedManifest.regions[0].canvas.width = 999;
const alignmentResult = assets.validateManifest(misalignedManifest, {assetExists:() => true});
assert.ok(alignmentResult.errors.some(error => error.code === 'mask_canvas_alignment'));

process.stdout.write('✓ Training Lab renderer keeps V1/V2 parallel and activates v2 only after validation\n');
