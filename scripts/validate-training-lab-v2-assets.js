const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {decodePngAlpha, validateMaskQuality} = require('./lib/training-lab-v2-quality.js');
const {validateVisualApproval} = require('./lib/training-lab-v2-visual-approval.js');

const root = path.resolve(__dirname, '..');
const registry = require('../simurg-training-lab-anatomy-assets.js');
const manifestPath = path.join(root, 'assets', 'training-lab-v2', 'anatomy-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function resolveAsset(url) {
  const value = String(url || '');
  if (!value.startsWith('./assets/training-lab-v2/')) throw new Error('unsafe_asset_path');
  const file = path.resolve(root, value.slice(2));
  const assetRoot = path.join(root, 'assets', 'training-lab-v2') + path.sep;
  if (!file.startsWith(assetRoot)) throw new Error('unsafe_asset_path');
  return file;
}

function assetExists(url) {
  try {
    const file = resolveAsset(url);
    return fs.existsSync(file) && fs.statSync(file).isFile() && fs.statSync(file).size > 0;
  } catch (_) { return false; }
}

function fileSha256(url) {
  return crypto.createHash('sha256').update(fs.readFileSync(resolveAsset(url))).digest('hex');
}

function pngMetadata(url) {
  const file = resolveAsset(url);
  if (!assetExists(url)) return {};
  try { return decodePngAlpha(fs.readFileSync(file)); }
  catch (error) { return {decodeError:error.message}; }
}

const contractResult = registry.validateManifest(manifest, {assetExists, assetMetadata:pngMetadata, requireActivation:false});
const quality = [];
const qualityErrors = [];
const base = assetExists(manifest.baseImage) ? pngMetadata(manifest.baseImage) : null;
if (base && !base.decodeError && base.width === manifest.canvas.width && base.height === manifest.canvas.height) {
  for (const region of manifest.regions || []) {
    if (!assetExists(region.mask)) continue;
    const mask = pngMetadata(region.mask);
    if (mask.decodeError) {
      qualityErrors.push({code:'invalid_png', regionId:region.regionId, detail:mask.decodeError});
      continue;
    }
    const report = validateMaskQuality({manifest, region, mask, base});
    quality.push({...report, errors:undefined});
    qualityErrors.push(...report.errors);
  }
}
const errors = contractResult.errors.concat(qualityErrors);
if (base && !base.decodeError && /^[a-f0-9]{64}$/i.test(manifest.source && manifest.source.sha256 || '')) {
  const actualHash = fileSha256(manifest.baseImage);
  if (actualHash !== manifest.source.sha256.toLowerCase()) errors.push({code:'sha256_mismatch', expected:manifest.source.sha256, actual:actualHash});
}
for (const region of manifest.regions || []) {
  if (region.mask && assetExists(region.mask) && /^[a-f0-9]{64}$/i.test(region.sha256 || '')) {
    const actualMaskHash = fileSha256(region.mask);
    if (actualMaskHash !== region.sha256.toLowerCase()) errors.push({code:'sha256_mismatch', asset:'mask', regionId:region.regionId, expected:region.sha256, actual:actualMaskHash});
  }
  if (!region.contour || !assetExists(region.contour)) continue;
  if (/^[a-f0-9]{64}$/i.test(region.contourSha256 || '')) {
    const actualContourHash = fileSha256(region.contour);
    if (actualContourHash !== region.contourSha256.toLowerCase()) errors.push({code:'sha256_mismatch', asset:'contour', regionId:region.regionId, expected:region.contourSha256, actual:actualContourHash});
  }
  try {
    const contour = JSON.parse(fs.readFileSync(resolveAsset(region.contour), 'utf8'));
    if (contour.schemaVersion !== 1 || contour.regionId !== region.regionId || contour.coordinateSpace !== manifest.coordinateSpace || contour.fillRule !== 'evenodd' || contour.alphaThreshold !== manifest.quality.alphaThreshold || !contour.canvas || contour.canvas.width !== manifest.canvas.width || contour.canvas.height !== manifest.canvas.height || typeof contour.svgPath !== 'string' || !contour.svgPath.trim() || !Number.isInteger(contour.contourCount) || contour.contourCount < 1 || contour.contourCount > manifest.quality.maxContourCount || !Number.isInteger(contour.pointCount) || contour.pointCount < 3 || contour.pointCount > manifest.quality.maxContourPoints) {
      errors.push({code:'invalid_contour_contract', regionId:region.regionId});
    }
    if (region.bounds && JSON.stringify(contour.bounds) !== JSON.stringify(region.bounds)) errors.push({code:'contour_bounds_mismatch', regionId:region.regionId});
  } catch (error) { errors.push({code:'invalid_contour_json', regionId:region.regionId, detail:error.message}); }
}
const activation = manifest.activation || {};
const visualApproval = validateVisualApproval(root, activation);
const activationApproved = visualApproval.approved;
const missingAssets = errors.filter(error => ['missing_asset','missing_mask_reference','missing_contour_reference'].includes(error.code)).map(error => ({asset:error.asset || null, regionId:error.regionId || null, url:error.assetUrl || null}));
const failedGates = [...new Set(errors.map(error => error.code).concat(activationApproved ? [] : visualApproval.errors.map(error => error.code).concat('visual_approval_required')))];
const technicallyValid = errors.length === 0;
const freezeValidationPassed = activation.status !== 'approved' || activationApproved;
function nextRequiredHumanAction() {
  if (failedGates.includes('unverified_asset_source') || missingAssets.some(item => item.asset === 'baseImage')) {
    return 'Obtain the approved licensed 1024x1536 RGBA anatomy master, independently recorded SHA-256, source/license metadata, and the exact 22 masks; then run the documented dry-run acceptance command.';
  }
  if (!technicallyValid) {
    return 'Resolve the listed technical validation gates and rerun the validator; keep the production renderer on V1 fallback.';
  }
  if (!activationApproved) {
    return 'Complete and record the mobile/desktop V1-V2 visual approval, then rerun the validator and full regression suite before activation.';
  }
  return 'No Training Lab v2 validation blocker remains; obtain the final release decision before any deployment.';
}
const report = {
  manifest:manifestPath,
  valid:technicallyValid,
  freezeValidationPassed,
  activationApproved,
  activationStatus:activation.status || null,
  rendererMode:technicallyValid && activationApproved ? 'V2 candidate' : 'V1 fallback',
  v2Blocked:!technicallyValid || !activationApproved,
  blockedReasons:failedGates,
  failedValidationGates:failedGates,
  missingAssets,
  nextRequiredHumanAction:nextRequiredHumanAction(),
  contract:registry.assetContract,
  quality,
  errors:errors.concat(visualApproval.errors)
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (!report.valid || !report.freezeValidationPassed) process.exit(1);
