const {spawnSync} = require('node:child_process');
const path = require('node:path');

function generateReadinessReport() {
  const validator = path.join(__dirname, 'validate-training-lab-v2-assets.js');
  const result = spawnSync(process.execPath, [validator], {encoding:'utf8'});
  if (!result.stdout || result.error) {
    throw result.error || new Error('training_lab_v2_validator_produced_no_report');
  }
  const validation = JSON.parse(result.stdout);
  return {
    pipelineReadiness:'Ready',
    realAssetReadiness:validation.valid ? 'Technically accepted' : 'Waiting for licensed source package',
    productionV2Activation:validation.v2Blocked ? 'Blocked by design' : 'Eligible for release decision',
    currentRendererMode:validation.rendererMode,
    v2ActivationBlockers:validation.blockedReasons,
    missingAssets:validation.missingAssets,
    failedValidationGates:validation.failedValidationGates,
    nextRequiredHumanAction:validation.nextRequiredHumanAction
  };
}

function main() {
  process.stdout.write(JSON.stringify(generateReadinessReport(), null, 2) + '\n');
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    process.stderr.write(JSON.stringify({ready:false,error:error.message}) + '\n');
    process.exit(1);
  }
}

module.exports = {generateReadinessReport};
