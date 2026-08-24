const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const registry = require('../simurg-training-lab-anatomy-assets.js');
const {prepareAcceptance, publishAcceptance, sha256, validateMaskDirectory, validateSourceMetadata} = require('../scripts/accept-training-lab-v2-assets.js');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function rgbaPng(width, height, active, color = (x, y) => [x % 251, y % 241, (x + y) % 239, 255]) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    for (let x = 0; x < width; x += 1) if (active(x, y)) {
      const pixel = row + 1 + x * 4;
      const rgba = color(x, y);
      raw[pixel] = rgba[0]; raw[pixel + 1] = rgba[1]; raw[pixel + 2] = rgba[2]; raw[pixel + 3] = rgba[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'simurg-asset-acceptance-test-'));
const master = path.join(temp, 'master.png');
fs.writeFileSync(master, Buffer.from('approved-master-fixture'));
const hash = sha256(master);
assert.match(hash, /^[a-f0-9]{64}$/);
assert.deepEqual(validateSourceMetadata({
  sourceUrl:'https://assets.example.test/anatomy',
  license:'commercial-license-001',
  author:'approved-provider',
  sha256:hash
}, hash), {
  validationStatus:'verified',
  sha256Verification:'matched',
  sourceUrl:'https://assets.example.test/anatomy',
  license:'commercial-license-001',
  author:'approved-provider',
  sha256:hash,
  notes:null
});
assert.throws(() => validateSourceMetadata({sourceUrl:'https://assets.example.test/anatomy',license:'licensed',author:'provider',sha256:'0'.repeat(64)}, hash), /sha256_mismatch/);
assert.throws(() => validateSourceMetadata({sourceUrl:'not-a-url',license:'licensed',author:'provider'}, hash), /invalid_source_url/);
assert.throws(() => validateSourceMetadata({sourceUrl:'https://assets.example.test/anatomy',license:'',author:'provider'}, hash), /missing_source_metadata:license/);
assert.throws(() => validateSourceMetadata({sourceUrl:'https://assets.example.test/anatomy',license:'licensed',author:'provider'}, hash), /missing_source_metadata:sha256/);
assert.throws(() => validateSourceMetadata({sourceUrl:'http:\/\/assets.example.test/anatomy',license:'licensed',author:'provider',sha256:hash}, hash), /invalid_source_url/);

const canvas = {width:1024,height:1536};
const realMaster = path.join(temp, 'anatomy-master.png');
const masks = path.join(temp, 'masks');
fs.mkdirSync(masks);
fs.writeFileSync(realMaster, rgbaPng(canvas.width, canvas.height, () => true));
let frontIndex = 0, backIndex = 0;
for (const region of registry.regions) {
  const index = region.view === 'front' ? frontIndex++ : backIndex++;
  const x0 = (region.view === 'front' ? 100 : 600) + index * 25;
  fs.writeFileSync(path.join(masks, region.regionId + '.png'), rgbaPng(canvas.width, canvas.height, (x, y) => x >= x0 && x < x0 + 20 && y >= 100 && y < 120, () => [255,255,255,255]));
}
const masterSha = sha256(realMaster);
const prepared = prepareAcceptance({
  masterPath:realMaster,
  masksPath:masks,
  metadata:{sourceUrl:'https://assets.example.test/anatomy',license:'commercial-license-001',author:'approved-provider',sha256:masterSha},
  assetVersion:'training-lab-v2-test'
});
assert.equal(prepared.manifest.status, 'ready');
assert.equal(prepared.manifest.activation.status, 'pending_visual_approval');
assert.match(prepared.packageFingerprint, /^[a-f0-9]{64}$/);
const repeated = prepareAcceptance({
  masterPath:realMaster,
  masksPath:masks,
  metadata:{sourceUrl:'https://assets.example.test/anatomy',license:'commercial-license-001',author:'approved-provider',sha256:masterSha},
  assetVersion:'training-lab-v2-test'
});
assert.equal(repeated.packageFingerprint, prepared.packageFingerprint);
const differentVersion = prepareAcceptance({
  masterPath:realMaster,
  masksPath:masks,
  metadata:{sourceUrl:'https://assets.example.test/anatomy',license:'commercial-license-001',author:'approved-provider',sha256:masterSha},
  assetVersion:'training-lab-v2-test-next'
});
assert.notEqual(differentVersion.packageFingerprint, prepared.packageFingerprint, 'assetVersion must be part of the package fingerprint');
assert.equal(registry.validateManifest(prepared.manifest, {assetExists:() => true}).valid, false);
assert.equal(registry.validateManifest(prepared.manifest, {assetExists:() => true, requireActivation:false}).valid, true);
assert.equal(prepared.manifest.regions.length, 22);
assert.ok(prepared.manifest.regions.every(region => region.bounds && region.contour && region.status === 'ready'));
assert.ok(prepared.manifest.regions.every(region => /^[a-f0-9]{64}$/.test(region.sha256) && /^[a-f0-9]{64}$/.test(region.contourSha256)));
assert.equal(prepared.contours.size, 22);
assert.deepEqual(prepared.manifest.regions.find(region => region.view === 'front').bounds, {x:100,y:100,width:20,height:20});
assert.deepEqual(prepared.manifest.regions.find(region => region.view === 'back').bounds, {x:600,y:100,width:20,height:20});
const output = path.join(temp, 'published');
fs.mkdirSync(output);
fs.writeFileSync(path.join(output, 'README.md'), 'preserve me\n');
assert.throws(() => publishAcceptance(prepared, output, realMaster), /dry_run_fingerprint_required/);
assert.throws(() => publishAcceptance(prepared, output, realMaster, '0'.repeat(64)), /dry_run_fingerprint_mismatch/);
prepared.manifest.status = 'invalid-after-dry-run';
assert.throws(() => publishAcceptance(prepared, output, realMaster, prepared.packageFingerprint), /publish_validation_failed:asset_pipeline_not_ready/);
prepared.manifest.status = 'ready';
publishAcceptance(prepared, output, realMaster, prepared.packageFingerprint);
const publishedManifest = JSON.parse(fs.readFileSync(path.join(output, 'anatomy-manifest.json'), 'utf8'));
assert.equal(fs.readFileSync(path.join(output, 'README.md'), 'utf8'), 'preserve me\n');
assert.equal(fs.readdirSync(path.join(output, 'masks')).length, 22);
assert.equal(fs.readdirSync(path.join(output, 'contours')).length, 22);
assert.equal(sha256(path.join(output, 'anatomy-base.png')), publishedManifest.source.sha256);
assert.equal(sha256(path.join(output, 'masks', publishedManifest.regions[0].regionId + '.png')), publishedManifest.regions[0].sha256);
assert.equal(sha256(path.join(output, 'contours', publishedManifest.regions[0].regionId + '.json')), publishedManifest.regions[0].contourSha256);
const changedMaskPath = path.join(masks, registry.regions[0].regionId + '.png');
const unchangedMaskBytes = fs.readFileSync(changedMaskPath);
fs.writeFileSync(changedMaskPath, rgbaPng(canvas.width, canvas.height, (x, y) => x >= 100 && x < 120 && y >= 100 && y < 120, () => [254,255,255,255]));
assert.throws(() => publishAcceptance(prepared, path.join(temp, 'changed-published'), realMaster, prepared.packageFingerprint), /asset_changed_since_validation:mask/);
fs.writeFileSync(changedMaskPath, unchangedMaskBytes);
const incomplete = path.join(temp, 'incomplete-masks');
fs.cpSync(masks, incomplete, {recursive:true});
fs.rmSync(path.join(incomplete, registry.regions[0].regionId + '.png'));
assert.throws(() => validateMaskDirectory(incomplete), /incomplete_mask_set/);
const extra = path.join(temp, 'extra-masks');
fs.cpSync(masks, extra, {recursive:true});
fs.writeFileSync(path.join(extra, 'unexpected.png'), fs.readFileSync(path.join(masks, registry.regions[0].regionId + '.png')));
assert.throws(() => validateMaskDirectory(extra), /unexpected_mask_files/);
const flatMaster = path.join(temp, 'flat-master.png');
fs.writeFileSync(flatMaster, rgbaPng(canvas.width, canvas.height, () => true, () => [255,255,255,255]));
assert.throws(() => prepareAcceptance({masterPath:flatMaster,masksPath:masks,metadata:{sourceUrl:'https://assets.example.test/anatomy',license:'licensed',author:'provider',sha256:sha256(flatMaster)}}), /invalid_atlas_view_content/);
assert.throws(() => {
  const duplicate = path.join(temp, 'duplicate-masks');
  fs.cpSync(masks, duplicate, {recursive:true});
  fs.copyFileSync(path.join(duplicate, registry.regions[0].regionId + '.png'), path.join(duplicate, registry.regions[1].regionId + '.png'));
  prepareAcceptance({masterPath:realMaster,masksPath:duplicate,metadata:{sourceUrl:'https://assets.example.test/anatomy',license:'licensed',author:'provider',sha256:masterSha}});
}, /duplicate_mask_content/);
fs.rmSync(temp, {recursive:true, force:true});

process.stdout.write('✓ Training Lab asset acceptance enforces source metadata and SHA-256 reconciliation\n');
