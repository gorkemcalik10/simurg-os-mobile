const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {boundsOf, contoursFromAlpha, createContourDocument, validateMaskQuality} = require('../scripts/lib/training-lab-v2-quality.js');
const {validateVisualApproval} = require('../scripts/lib/training-lab-v2-visual-approval.js');

const alpha = Uint8Array.from([0,255,255,0, 0,255,0,0]);
assert.deepEqual(boundsOf(alpha, 4, 0), {x:1,y:0,width:2,height:2,activePixels:3});
const contourAlpha = Uint8Array.from([255,255,0, 255,255,0, 0,0,0]);
const contours = contoursFromAlpha(contourAlpha, 3, 3, 0);
assert.equal(contours.length, 1);
const contourDocument = createContourDocument({regionId:'test',alpha:contourAlpha,width:3,height:3,threshold:0});
assert.deepEqual(contourDocument.bounds, {x:0,y:0,width:2,height:2});
assert.match(contourDocument.svgPath, /^M/);
assert.equal(contourDocument.coordinateSpace, 'combined-atlas-pixels');
assert.equal(contourDocument.pointCount, 4);

const manifest = {
  canvas:{width:4,height:2},
  views:{front:{x:0,y:0,width:2,height:2},back:{x:2,y:0,width:2,height:2}},
  quality:{alphaThreshold:0,minAlphaCoverage:0.01,maxAlphaCoverage:0.75,minBaseOverlap:0.9,boundsTolerance:0}
};
const base = {width:4,height:2,alpha:Uint8Array.from([255,255,255,255,255,255,255,255])};
const validMask = {width:4,height:2,hasAlpha:true,alpha:Uint8Array.from([255,255,0,0,255,255,0,0])};
const valid = validateMaskQuality({manifest,region:{regionId:'front_region',view:'front',bounds:{x:0,y:0,width:2,height:2}},mask:validMask,base});
assert.deepEqual(valid.errors, []);

const outside = {width:4,height:2,hasAlpha:true,alpha:Uint8Array.from([0,0,255,0,0,0,255,0])};
const invalid = validateMaskQuality({manifest,region:{regionId:'front_region',view:'front',bounds:{x:0,y:0,width:1,height:1}},mask:outside,base});
assert.ok(invalid.errors.some(error => error.code === 'region_boundary_violation'));
assert.ok(invalid.errors.some(error => error.code === 'region_bounds_mismatch'));

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'training-lab-v2-visual-regression.json'), 'utf8'));
assert.equal(fixture.status, 'pending_real_assets');
assert.deepEqual(fixture.renderers, ['legacy-v1','v2']);
assert.ok(fixture.viewports.some(item => item.id === 'desktop'));
assert.ok(fixture.viewports.some(item => item.id === 'mobile'));
assert.ok(fixture.scenarios.length >= 7);

const approvalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'simurg-visual-approval-'));
const approvalFixtureDirectory = path.join(approvalRoot, 'tests', 'fixtures');
fs.mkdirSync(approvalFixtureDirectory, {recursive:true});
const activation = {
  status:'approved',
  approvedBy:'visual-reviewer',
  approvedAt:'2026-08-24T18:00:00.000Z',
  visualRegressionFixture:'tests/fixtures/training-lab-v2-visual-regression.json'
};
const fixturePath = path.join(approvalFixtureDirectory, 'training-lab-v2-visual-regression.json');
const approvedFixture = {
  ...fixture,
  status:'approved',
  approvedBy:activation.approvedBy,
  approvedAt:activation.approvedAt,
  evidence:['release-evidence/training-lab-v2-visual-review']
};

const missingFixture = validateVisualApproval(approvalRoot, activation);
assert.equal(missingFixture.approved, false);
assert.ok(missingFixture.errors.some(error => error.code === 'missing_fixture'));

fs.writeFileSync(fixturePath, '');
const emptyFixture = validateVisualApproval(approvalRoot, activation);
assert.equal(emptyFixture.approved, false);
assert.ok(emptyFixture.errors.some(error => error.code === 'empty_fixture'));

fs.writeFileSync(fixturePath, JSON.stringify({...approvedFixture, status:'pending_real_assets'}));
const pendingFixture = validateVisualApproval(approvalRoot, activation);
assert.equal(pendingFixture.approved, false);
assert.ok(pendingFixture.errors.some(error => error.code === 'invalid_fixture_status'));

fs.writeFileSync(fixturePath, JSON.stringify({...approvedFixture, viewports:[]}));
const invalidMetadata = validateVisualApproval(approvalRoot, activation);
assert.equal(invalidMetadata.approved, false);
assert.ok(invalidMetadata.errors.some(error => error.code === 'invalid_fixture_metadata'));

fs.writeFileSync(fixturePath, JSON.stringify({...approvedFixture, evidence:[]}));
const missingApproval = validateVisualApproval(approvalRoot, activation);
assert.equal(missingApproval.approved, false);
assert.ok(missingApproval.errors.some(error => error.code === 'missing_visual_approval'));

fs.writeFileSync(fixturePath, JSON.stringify(approvedFixture));
assert.equal(validateVisualApproval(approvalRoot, activation).approved, true);

fs.rmSync(approvalRoot, {recursive:true, force:true});

process.stdout.write('✓ Training Lab v2 quality checks enforce coverage, boundaries, alignment and visual fixtures\n');
