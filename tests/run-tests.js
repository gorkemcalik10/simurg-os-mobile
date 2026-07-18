const { spawnSync } = require('node:child_process');
const path = require('node:path');

let failed = false;
for (const file of ['simurg-signal-model.test.js', 'runtime-contracts.test.js', 'home-navigation.test.js', 'mobile-navigation-scroll.test.js', 'activity-card-layout.test.js', 'html-syntax.test.js']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
