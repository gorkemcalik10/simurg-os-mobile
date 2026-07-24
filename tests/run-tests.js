const { spawnSync } = require('node:child_process');
const path = require('node:path');

let failed = false;
for (const file of ['simurg-signal-model.test.js', 'data-validation.test.js', 'apple-watch-rpe-validation.test.js', 'data-atomic-runtime.test.js', 'data-import-contracts.test.js', 'runtime-contracts.test.js', 'cloud-auth.test.js', 'desktop-polar-sync.test.js', 'home-navigation.test.js', 'mobile-navigation-scroll.test.js', 'activity-card-layout.test.js', 'xss-rendering.test.js', 'html-syntax.test.js']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
