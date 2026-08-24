const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const registry = require('../simurg-training-lab-anatomy-assets.js');
const anatomy = require('../simurg-muscle-anatomy.js');
const manifestPath = path.join(root, 'assets', 'training-lab-v2', 'anatomy-manifest.json');
const placeholderBase = path.join(root, 'assets', 'training-lab-v2', 'anatomy-base.png');
const placeholderMasks = path.join(root, 'assets', 'training-lab-v2', 'masks');

assert.equal(registry.regions.length, 22);
assert.deepEqual(registry.expectedRegionIds, registry.regions.map(item => item.regionId));
assert.equal(new Set(registry.regions.map(item => item.regionId)).size, 22);
assert.equal(anatomy.muscles.length, 32);
assert.notEqual(registry.regions, anatomy.muscles, 'presentation registry must stay separate from analysis anatomy');

for (const region of registry.regions) {
  for (const key of ['regionId','label','view','maskUrl','hitPath','canonicalMuscleIds','assetVersion','canvasWidth','canvasHeight']) {
    assert.ok(Object.hasOwn(region, key), region.regionId + ' missing ' + key);
  }
  assert.ok(['front','back'].includes(region.view));
  assert.equal(registry.getRegion(region.regionId), region);
}
for (const muscle of anatomy.muscles) {
  const regionId = registry.getRegionIdForCanonical(muscle.id);
  assert.ok(regionId, muscle.id + ' must resolve to a visual region');
  assert.ok(registry.regionMap[regionId]);
}

const result = registry.validate({
  canonicalMuscleIds: anatomy.muscles.map(item => item.id),
  assetExists(url) { return fs.existsSync(path.resolve(root, url)); }
});
assert.deepEqual(result, {valid:true, errors:[]});

const duplicate = {...registry.regions[1], regionId: registry.regions[0].regionId};
const missingId = {...registry.regions[2], regionId: ''};
const missingMask = {...registry.regions[3], maskUrl: ''};
const invalidCanonical = {...registry.regions[4], canonicalMuscleIds: ['not_a_canonical_muscle']};
const badCanvas = {...registry.regions[5], canvasWidth: 999};
const invalid = registry.validate([registry.regions[0], duplicate, missingId, missingMask, invalidCanonical, badCanvas], {
  canonicalMuscleIds: anatomy.muscles.map(item => item.id)
});
for (const code of ['duplicate_region_id','missing_region_id','missing_mask_reference','invalid_canonical_reference','canvas_dimension_mismatch']) {
  assert.ok(invalid.errors.some(error => error.code === code), code + ' validation must be enforced');
}
const incomplete = registry.validate(registry.regions.slice(0, -1), {canonicalMuscleIds: anatomy.muscles.map(item => item.id)});
assert.ok(incomplete.errors.some(error => error.code === 'missing_region_id' && error.regionId === 'rotator_cuff'));

assert.ok(fs.existsSync(manifestPath));
assert.equal(fs.existsSync(placeholderBase), false, 'no placeholder may impersonate a real anatomy base');
assert.ok(fs.statSync(placeholderMasks).isDirectory());
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.status, 'blocked_missing_validated_source');
assert.deepEqual(manifest.canvas, {width:1024,height:1536,aspectRatio:'2:3'});
assert.deepEqual(manifest.views, registry.viewBounds);
assert.equal(manifest.coordinateSpace, 'combined-atlas-pixels');
assert.equal(manifest.regions.length, 22);
assert.equal(new Set(manifest.regions.map(item => item.regionId)).size, 22);
assert.ok(manifest.regions.every(item => item.status === 'missing'));
assert.equal(manifest.source.validationStatus, 'unverified');
assert.ok(manifest.regions.every(item => Array.isArray(item.canonicalMuscleIds)));
const v2Validation = registry.validateManifest(manifest, {
  assetExists(url) {
    const file = path.resolve(root, url);
    return fs.existsSync(file) && fs.statSync(file).size > 0;
  }
});
assert.equal(v2Validation.valid, false);
for (const code of ['asset_pipeline_not_ready','unverified_asset_source','missing_asset']) {
  assert.ok(v2Validation.errors.some(error => error.code === code), code + ' must block v2 activation');
}
const canonicalMismatch = JSON.parse(JSON.stringify(manifest));
canonicalMismatch.regions[0].canonicalMuscleIds = ['not_canonical'];
assert.ok(registry.validateManifest(canonicalMismatch).errors.some(error => error.code === 'canonical_mismatch'));
const badBounds = JSON.parse(JSON.stringify(manifest));
badBounds.status = 'ready';
badBounds.source = {validationStatus:'verified',sourceUrl:'https://assets.example.test/source',license:'licensed',sha256:'a'.repeat(64)};
badBounds.regions.forEach(region => { region.status = 'ready'; region.bounds = region.view === 'front' ? {x:0,y:0,width:1,height:1} : {x:512,y:0,width:1,height:1}; });
badBounds.regions[0].bounds = {x:700,y:0,width:10,height:10};
assert.ok(registry.validateManifest(badBounds).errors.some(error => error.code === 'region_boundary_violation'));
assert.notEqual(registry.baseImageUrl, './assets/training-lab-v2/anatomy-base.png', 'placeholder assets must not change the active renderer');

process.stdout.write('✓ Training Lab registry preserves 22 regions and blocks unverified or incomplete v2 assets\n');
