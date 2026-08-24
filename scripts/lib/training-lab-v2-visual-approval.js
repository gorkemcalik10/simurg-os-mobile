const fs = require('node:fs');
const path = require('node:path');

function isNonEmptyString(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function hasValidFixtureMetadata(fixture) {
  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) return false;
  if (fixture.schemaVersion !== 1) return false;
  if (!Array.isArray(fixture.renderers) || !fixture.renderers.includes('legacy-v1') || !fixture.renderers.includes('v2')) return false;
  if (!Array.isArray(fixture.viewports) || fixture.viewports.length < 1 || fixture.viewports.some(viewport => !isNonEmptyString(viewport.id) || !Number.isInteger(viewport.width) || viewport.width < 1 || !Number.isInteger(viewport.height) || viewport.height < 1 || typeof viewport.deviceScaleFactor !== 'number' || viewport.deviceScaleFactor <= 0)) return false;
  if (!fixture.thresholds || typeof fixture.thresholds !== 'object' || typeof fixture.thresholds.maxPixelDiffRatio !== 'number' || fixture.thresholds.maxPixelDiffRatio < 0 || fixture.thresholds.maxPixelDiffRatio > 1 || !Number.isInteger(fixture.thresholds.maxDimensionDelta) || fixture.thresholds.maxDimensionDelta < 0) return false;
  if (!Array.isArray(fixture.scenarios) || fixture.scenarios.length < 1 || fixture.scenarios.some(scenario => !isNonEmptyString(scenario.id) || !Array.isArray(scenario.primary) || !Array.isArray(scenario.secondary))) return false;
  return new Set(fixture.viewports.map(viewport => viewport.id)).size === fixture.viewports.length && new Set(fixture.scenarios.map(scenario => scenario.id)).size === fixture.scenarios.length;
}

function validateVisualApproval(root, activation = {}) {
  const errors = [];
  const approvalFieldsPresent = activation.status === 'approved' && isNonEmptyString(activation.approvedBy) && isNonEmptyString(activation.approvedAt) && !Number.isNaN(Date.parse(activation.approvedAt));
  if (!approvalFieldsPresent) errors.push({code:'missing_visual_approval'});

  if (!isNonEmptyString(activation.visualRegressionFixture)) {
    errors.push({code:'missing_fixture'});
    return {approved:false, errors, fixture:null, fixturePath:null};
  }

  const fixtureRoot = path.resolve(root, 'tests', 'fixtures');
  const fixturePath = path.resolve(root, activation.visualRegressionFixture);
  if (fixturePath !== fixtureRoot && !fixturePath.startsWith(fixtureRoot + path.sep)) {
    errors.push({code:'missing_fixture'});
    return {approved:false, errors, fixture:null, fixturePath};
  }

  let bytes;
  try {
    const stat = fs.statSync(fixturePath);
    if (!stat.isFile()) throw new Error('not_a_file');
    bytes = fs.readFileSync(fixturePath);
  } catch (_) {
    errors.push({code:'missing_fixture'});
    return {approved:false, errors, fixture:null, fixturePath};
  }
  if (bytes.length === 0 || !bytes.toString('utf8').trim()) {
    errors.push({code:'empty_fixture'});
    return {approved:false, errors, fixture:null, fixturePath};
  }

  let fixture;
  try { fixture = JSON.parse(bytes.toString('utf8')); }
  catch (_) {
    errors.push({code:'invalid_fixture_metadata'});
    return {approved:false, errors, fixture:null, fixturePath};
  }
  if (fixture.status !== 'approved') errors.push({code:'invalid_fixture_status'});
  if (!hasValidFixtureMetadata(fixture)) errors.push({code:'invalid_fixture_metadata'});
  const fixtureApprovalPresent = isNonEmptyString(fixture.approvedBy) && isNonEmptyString(fixture.approvedAt) && !Number.isNaN(Date.parse(fixture.approvedAt)) && Array.isArray(fixture.evidence) && fixture.evidence.length > 0 && fixture.evidence.every(isNonEmptyString);
  if (!fixtureApprovalPresent || (approvalFieldsPresent && (fixture.approvedBy !== activation.approvedBy || fixture.approvedAt !== activation.approvedAt))) errors.push({code:'missing_visual_approval'});

  return {approved:errors.length === 0, errors, fixture, fixturePath};
}

module.exports = {hasValidFixtureMetadata, validateVisualApproval};
