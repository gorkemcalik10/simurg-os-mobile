const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const registry = require('../simurg-training-lab-anatomy-assets.js');
const {
  atlasViewStats,
  boundsOf,
  createContourDocument,
  decodePngAlpha,
  validateMaskQuality
} = require('./lib/training-lab-v2-quality.js');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function serializeJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('missing_source_metadata:' + field);
  const text = value.trim();
  if (text.length > 500 || /[\u0000-\u001f\u007f]/.test(text)) throw new Error('invalid_source_metadata:' + field);
  return text;
}

function validateSourceMetadata(metadata, masterHash) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('invalid_source_metadata');
  const sourceUrl = requireText(metadata.sourceUrl, 'sourceUrl');
  let parsedSource;
  try { parsedSource = new URL(sourceUrl); } catch (_) { throw new Error('invalid_source_url'); }
  if (parsedSource.protocol !== 'https:' || parsedSource.username || parsedSource.password) throw new Error('invalid_source_url');
  const license = requireText(metadata.license, 'license');
  const author = requireText(metadata.author, 'author');
  if (metadata.sha256 == null) throw new Error('missing_source_metadata:sha256');
  const expectedHash = String(metadata.sha256).trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error('invalid_expected_sha256');
  if (expectedHash !== masterHash) throw new Error('sha256_mismatch');
  return {
    validationStatus:'verified',
    sha256Verification:'matched',
    sourceUrl:parsedSource.href,
    license,
    author,
    sha256:masterHash,
    notes:metadata.notes == null ? null : requireText(metadata.notes, 'notes')
  };
}

function readPng(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size === 0) throw new Error('missing_asset:' + file);
  return decodePngAlpha(fs.readFileSync(file));
}

function validateAssetVersion(value, masterHash) {
  const version = value || 'training-lab-v2-' + masterHash.slice(0, 12);
  if (!/^training-lab-v2-[a-z0-9][a-z0-9._-]{2,63}$/i.test(version) || /pending|legacy/i.test(version)) throw new Error('invalid_asset_version');
  return version;
}

function validateMaskDirectory(masksPath) {
  if (!fs.existsSync(masksPath) || !fs.statSync(masksPath).isDirectory()) throw new Error('missing_masks_directory');
  const expected = new Set(registry.expectedRegionIds.map(id => id + '.png'));
  const actual = fs.readdirSync(masksPath, {withFileTypes:true})
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map(entry => entry.name);
  const missing = [...expected].filter(name => !actual.includes(name));
  const unexpected = actual.filter(name => !expected.has(name));
  if (missing.length) throw new Error('incomplete_mask_set:' + missing.join(','));
  if (unexpected.length) throw new Error('unexpected_mask_files:' + unexpected.join(','));
}

function calculatePackageFingerprint(manifest, masterHash) {
  return sha256Bytes(Buffer.from(serializeJson({
    fingerprintVersion:1,
    assetVersion:manifest.assetVersion,
    masterSha256:masterHash,
    metadata:{
      sourceUrl:manifest.source.sourceUrl,
      license:manifest.source.license,
      author:manifest.source.author,
      sha256:manifest.source.sha256
    },
    regions:manifest.regions.map(region => ({
      regionId:region.regionId,
      maskSha256:region.sha256,
      contourSha256:region.contourSha256
    }))
  })));
}

function prepareAcceptance({masterPath, masksPath, metadata, assetVersion}) {
  const templatePath = path.resolve(__dirname, '..', 'assets', 'training-lab-v2', 'anatomy-manifest.json');
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  const master = readPng(masterPath);
  if (master.width !== registry.canvasWidth || master.height !== registry.canvasHeight || master.bitDepth !== 8 || master.colorType !== 6) {
    throw new Error('invalid_master_contract');
  }
  validateMaskDirectory(masksPath);
  const viewStats = Object.fromEntries(Object.entries(registry.viewBounds).map(([view, bounds]) => [view, atlasViewStats(master, bounds, template.quality.alphaThreshold)]));
  for (const [view, stats] of Object.entries(viewStats)) {
    if (stats.visibleCoverage < template.quality.minAtlasViewCoverage || stats.rgbDynamicRange < template.quality.minAtlasRgbDynamicRange || stats.sampledColorCount < template.quality.minAtlasSampledColors) {
      throw new Error('invalid_atlas_view_content:' + view);
    }
  }
  const viewCoverage = Object.fromEntries(Object.entries(viewStats).map(([view, stats]) => [view, stats.visibleCoverage]));
  const masterHash = sha256(masterPath);
  const source = validateSourceMetadata(metadata, masterHash);
  const decodedMasks = new Map(), contours = new Map(), quality = [], maskHashOwners = new Map();
  const manifest = JSON.parse(JSON.stringify(template));
  manifest.assetVersion = validateAssetVersion(assetVersion, masterHash);
  manifest.status = 'ready';
  manifest.activation = {status:'pending_visual_approval', approvedBy:null, approvedAt:null, visualRegressionFixture:null};
  manifest.source = source;
  for (const region of manifest.regions) {
    const maskPath = path.join(masksPath, region.regionId + '.png');
    const mask = readPng(maskPath);
    const maskHash = sha256(maskPath);
    if (maskHashOwners.has(maskHash)) throw new Error('duplicate_mask_content:' + maskHashOwners.get(maskHash) + ',' + region.regionId);
    maskHashOwners.set(maskHash, region.regionId);
    decodedMasks.set(region.regionId, {file:maskPath, metadata:mask, sha256:maskHash});
    const bounds = boundsOf(mask.alpha, mask.width, manifest.quality.alphaThreshold);
    region.status = 'ready';
    region.sha256 = maskHash;
    region.bounds = bounds && {x:bounds.x, y:bounds.y, width:bounds.width, height:bounds.height};
    region.contour = './assets/training-lab-v2/contours/' + region.regionId + '.json';
    const report = validateMaskQuality({manifest, region, mask, base:master});
    quality.push(report);
    if (report.errors.length) throw new Error('mask_quality_failed:' + region.regionId + ':' + report.errors.map(error => error.code).join(','));
    const contour = createContourDocument({
      regionId:region.regionId,
      alpha:mask.alpha,
      width:mask.width,
      height:mask.height,
      threshold:manifest.quality.alphaThreshold
    });
    if (contour.contourCount > manifest.quality.maxContourCount || contour.pointCount > manifest.quality.maxContourPoints) throw new Error('contour_complexity_exceeded:' + region.regionId);
    region.contourSha256 = sha256Bytes(Buffer.from(serializeJson(contour)));
    contours.set(region.regionId, contour);
  }
  const contract = registry.validateManifest(manifest, {
    requireActivation:false,
    assetExists:() => true,
    assetMetadata(url) {
      if (url === manifest.baseImage) return master;
      const name = path.basename(url, '.png');
      return decodedMasks.has(name) ? decodedMasks.get(name).metadata : {};
    }
  });
  if (!contract.valid) throw new Error('manifest_contract_failed:' + contract.errors.map(error => error.code).join(','));
  const packageFingerprint = calculatePackageFingerprint(manifest, masterHash);
  return {manifest, master, masterHash, packageFingerprint, decodedMasks, contours, quality, viewCoverage, viewStats};
}

function validatePreparedForPublish(prepared, masterPath, expectedFingerprint) {
  if (!/^[a-f0-9]{64}$/i.test(expectedFingerprint || '')) throw new Error('dry_run_fingerprint_required');
  if (!prepared || expectedFingerprint.toLowerCase() !== prepared.packageFingerprint) throw new Error('dry_run_fingerprint_mismatch');
  if (!prepared.manifest || prepared.manifest.activation.status !== 'pending_visual_approval') throw new Error('invalid_publish_activation_state');
  if (sha256(masterPath) !== prepared.masterHash) throw new Error('asset_changed_since_validation:baseImage');
  const contract = registry.validateManifest(prepared.manifest, {requireActivation:false, assetExists:() => true});
  if (!contract.valid) throw new Error('publish_validation_failed:' + contract.errors.map(error => error.code).join(','));
  for (const region of prepared.manifest.regions) {
    const mask = prepared.decodedMasks.get(region.regionId);
    const contour = prepared.contours.get(region.regionId);
    if (!mask || sha256(mask.file) !== region.sha256) throw new Error('asset_changed_since_validation:mask:' + region.regionId);
    if (!contour || sha256Bytes(Buffer.from(serializeJson(contour))) !== region.contourSha256) throw new Error('asset_changed_since_validation:contour:' + region.regionId);
  }
  if (calculatePackageFingerprint(prepared.manifest, prepared.masterHash) !== prepared.packageFingerprint) throw new Error('acceptance_state_changed_since_dry_run');
}

function publishAcceptance(prepared, outputPath, masterPath, expectedFingerprint) {
  validatePreparedForPublish(prepared, masterPath, expectedFingerprint);
  const outputParent = path.dirname(outputPath);
  fs.mkdirSync(outputParent, {recursive:true});
  const stage = fs.mkdtempSync(path.join(outputParent, '.training-lab-v2-stage-'));
  const backup = path.join(outputParent, '.training-lab-v2-backup-' + process.pid + '-' + Date.now());
  if (fs.existsSync(outputPath)) fs.cpSync(outputPath, stage, {recursive:true});
  const stageMasks = path.join(stage, 'masks'), stageContours = path.join(stage, 'contours');
  fs.rmSync(stageMasks, {recursive:true, force:true});
  fs.rmSync(stageContours, {recursive:true, force:true});
  fs.mkdirSync(stageMasks, {recursive:true});
  fs.mkdirSync(stageContours, {recursive:true});
  fs.copyFileSync(masterPath, path.join(stage, 'anatomy-base.png'));
  for (const [regionId, entry] of prepared.decodedMasks) fs.copyFileSync(entry.file, path.join(stageMasks, regionId + '.png'));
  for (const [regionId, contour] of prepared.contours) fs.writeFileSync(path.join(stageContours, regionId + '.json'), serializeJson(contour));
  fs.writeFileSync(path.join(stage, 'anatomy-manifest.json'), serializeJson(prepared.manifest));
  let movedExisting = false;
  try {
    if (fs.existsSync(outputPath)) { fs.renameSync(outputPath, backup); movedExisting = true; }
    fs.renameSync(stage, outputPath);
    if (movedExisting) fs.rmSync(backup, {recursive:true, force:true});
  } catch (error) {
    if (!fs.existsSync(outputPath) && movedExisting && fs.existsSync(backup)) fs.renameSync(backup, outputPath);
    fs.rmSync(stage, {recursive:true, force:true});
    throw error;
  }
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--dry-run') options.dryRun = true;
    else if (item.startsWith('--')) options[item.slice(2)] = argv[++index];
  }
  return options;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.master || !args.masks || !args.metadata) {
    process.stderr.write('Usage: node scripts/accept-training-lab-v2-assets.js --master <png> --masks <dir> --metadata <json> [--asset-version <id>] [--output <dir>] [--dry-run | --expected-fingerprint <dry-run fingerprint>]\n');
    process.exit(2);
  }
  const root = path.resolve(__dirname, '..');
  const masterPath = path.resolve(args.master), masksPath = path.resolve(args.masks);
  const metadata = JSON.parse(fs.readFileSync(path.resolve(args.metadata), 'utf8'));
  const prepared = prepareAcceptance({masterPath, masksPath, metadata, assetVersion:args['asset-version']});
  const outputPath = path.resolve(args.output || path.join(root, 'assets', 'training-lab-v2'));
  if (!args.dryRun) publishAcceptance(prepared, outputPath, masterPath, args['expected-fingerprint']);
  process.stdout.write(JSON.stringify({
    valid:true,
    dryRun:Boolean(args.dryRun),
    assetVersion:prepared.manifest.assetVersion,
    sha256:prepared.masterHash,
    packageFingerprint:prepared.packageFingerprint,
    canvas:prepared.manifest.canvas,
    viewCoverage:prepared.viewCoverage,
    viewStats:prepared.viewStats,
    regions:prepared.quality.map(item => ({regionId:item.regionId, bounds:item.bounds, coverage:item.coverage, baseOverlap:item.baseOverlap})),
    output:args.dryRun ? null : outputPath
  }, null, 2) + '\n');
}

if (require.main === module) {
  try { main(); }
  catch (error) { process.stderr.write(JSON.stringify({valid:false,error:error.message}) + '\n'); process.exit(1); }
}

module.exports = {sha256, validateSourceMetadata, validateAssetVersion, validateMaskDirectory, calculatePackageFingerprint, prepareAcceptance, validatePreparedForPublish, publishAcceptance};
