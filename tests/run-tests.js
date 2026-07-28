const { spawnSync } = require('node:child_process');
const path = require('node:path');

let failed = false;
for (const file of ['simurg-volume-model.test.js', 'simurg-signal-model.test.js', 'simurg-coach-engine.test.js', 'simurg-coach-client.test.js', 'simurg-coach-security.test.js', 'simurg-coach-ui-contracts.test.js', 'shared-polar-load-consumers.test.js', 'polar-account-scope.test.js', 'data-validation.test.js', 'apple-watch-rpe-validation.test.js', 'data-atomic-runtime.test.js', 'data-import-contracts.test.js', 'runtime-contracts.test.js', 'cloud-auth.test.js', 'desktop-polar-sync.test.js', 'desktop-premium-refinement.test.js', 'home-navigation.test.js', 'mobile-navigation-scroll.test.js', 'mobile-gym-ergonomics.test.js', 'mobile-ia-premium.test.js', 'mobile-report-stability.test.js', 'activity-card-layout.test.js', 'xss-rendering.test.js', 'html-syntax.test.js', 'ui-overflow-audit.mjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
