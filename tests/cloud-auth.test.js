const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const index = read('index.html');
const cloud = read('simurg-cloud-auth.js');
const sw = read('sw.js');
const activeRuntime = `${index}\n${cloud}\n${sw}`;

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

function functionBody(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `${name} missing`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(brace + 1, i);
  }
  assert.fail(`${name} body not closed`);
}

run('signed-out cloud controls start disabled', () => {
  for (const id of ['cloudSignInBtn', 'cloudCheckBtn', 'cloudPushBtn', 'cloudPullBtn', 'cloudSignOutBtn']) {
    assert.match(index, new RegExp(`<button[^>]*id=["']${id}["'][^>]*\\bdisabled\\b`));
  }
  assert.match(index, /id="cloudAuthState">Başlatılıyor</);
});

run('official Supabase v2 and one local controller are loaded', () => {
  assert.match(index, /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.95\.0/);
  assert.match(index, /simurg-cloud-auth\.js\?v=2/);
  assert.match(sw, /simurg-cloud-auth\.js\?v=2/);
});

run('active runtime contains no legacy shared cloud model', () => {
  assert.doesNotMatch(activeRuntime, /\/rest\/v1\/simurg_data\b/);
  assert.doesNotMatch(activeRuntime, /id=eq\.main/);
  assert.doesNotMatch(activeRuntime, /SIMURG_SYNC_ID/);
  assert.doesNotMatch(activeRuntime, /Authorization["']?\s*:\s*["']Bearer|Bearer\s*["']?\s*\+\s*SIMURG_SUPABASE_KEY/);
  assert.doesNotMatch(index, /function\s+(?:pushToCloud|pullFromCloud|checkCloudStatus)\s*\(|window\.(?:pushToCloud|pullFromCloud)\s*=/);
});

run('auth changes do not mutate DATA or app localStorage', () => {
  for (const name of ['signInToCloud', 'signOutFromCloud']) {
    const body = functionBody(cloud, name);
    assert.doesNotMatch(body, /\bDATA\s*=|\bsave\s*\(|atlas_summary_reports|LOCAL_DATA_KEY/);
    assert.doesNotMatch(body, /pushUserData\s*\(|pullUserData\s*\(/);
  }
});

run('auth restoration never pushes or pulls automatically', () => {
  const body = functionBody(cloud, 'initialize');
  assert.match(body, /auth\.getSession\(\)/);
  assert.match(body, /auth\.onAuthStateChange/);
  assert.doesNotMatch(body, /pushUserData\s*\(|pullUserData\s*\(|checkUserCloudStatus\s*\(/);
});

run('check selects metadata only and does not establish a base', () => {
  const body = functionBody(cloud, 'checkUserCloudStatus');
  assert.match(body, /\.select\('revision,updated_at'\)/);
  assert.doesNotMatch(body, /\.select\([^)]*payload/);
  assert.match(body, /\.eq\('user_id',context\.userId\)/);
  assert.doesNotMatch(body, /writeMeta\s*\(/);
  assert.doesNotMatch(body, /\bDATA\s*=/);
});

run('first push inserts only authenticated user and current payload', () => {
  const body = functionBody(cloud, 'pushUserData');
  assert.match(body, /\.insert\(\{user_id:context\.userId,payload:localData\}\)/);
  assert.doesNotMatch(body, /\.insert\(\{[^}]*revision:/);
  assert.match(body, /inserted\.data\.length!==1/);
});

run('existing push requires base and performs conditional revision update', () => {
  const body = functionBody(cloud, 'pushUserData');
  assert.match(body, /var meta=readMeta\(context\.userId\)/);
  assert.match(body, /if\(!meta\)/);
  assert.match(body, /\.update\(\{payload:localData,revision:meta\.revision\+1\}\)/);
  assert.match(body, /\.eq\('user_id',context\.userId\)/);
  assert.match(body, /\.eq\('revision',meta\.revision\)/);
  assert.match(body, /updated\.data\.length===0/);
  assert.match(body, /Buluttaki veri başka bir cihazda güncellenmiş\. Önce Buluttan Al veya yerel yedek oluştur\./);
});

run('pull confirms, backs up, validates, then persists and stores revision', () => {
  const body = functionBody(cloud, 'pullUserData');
  const validateAt = body.indexOf('normalizePulledData(result.data.payload)');
  const revisionAt = body.indexOf('setRevisionStatus(result.data.revision');
  const confirmAt = body.indexOf('window.confirm(');
  const backupAt = body.indexOf('downloadLocalBackup(oldData)');
  const persistAt = body.indexOf('persistPulledData(pulled)');
  const metaAt = body.indexOf('writeMeta(context.userId');
  assert.ok(validateAt >= 0 && revisionAt > validateAt && confirmAt > revisionAt && backupAt > confirmAt && persistAt > backupAt && metaAt > persistAt);
  assert.match(body, /normalizePulledData\(result\.data\.payload\)/);
  assert.match(body, /\.select\('payload,revision,updated_at'\)/);
  assert.match(body, /\.eq\('user_id',context\.userId\)/);
});

run('cloud metadata is scoped and excludes payload, token, email and password', () => {
  assert.match(cloud, /META_PREFIX='simurg_cloud_meta:'/);
  const body = functionBody(cloud, 'writeMeta');
  assert.match(body, /revision:/);
  assert.match(body, /updatedAt:/);
  assert.match(body, /lastPullAt:/);
  assert.match(body, /lastPushAt:/);
  assert.doesNotMatch(body, /payload|token|email|password|userId:/i);
  assert.doesNotMatch(cloud, /DATA\.(?:token|accessToken|refreshToken|password|userId|email)\s*=/i);
});

run('localStorage-first DATA startup validates before assignment and preserves invalid raw data', () => {
  assert.match(index, /simurgStoredDataRaw=localStorage\.getItem\('atlas_summary_reports'\)/);
  assert.match(index, /SimurgDataValidation\.prepareFullText\(simurgStoredDataRaw/);
  assert.doesNotMatch(index, /let DATA=JSON\.parse\(localStorage\.getItem\('atlas_summary_reports'\)/);
  assert.match(index, /__simurgStartupDataValidationError/);
});

run('canonical controller exposes one function per cloud action', () => {
  for (const name of ['signInToCloud', 'signOutFromCloud', 'checkUserCloudStatus', 'pushUserData', 'pullUserData']) {
    assert.equal((cloud.match(new RegExp(`async function ${name}\\(`, 'g')) || []).length, 1, name);
    assert.equal((cloud.match(new RegExp(`window\\.${name}=${name}`, 'g')) || []).length, 1, name);
  }
});

if (process.exitCode) process.exit(process.exitCode);
