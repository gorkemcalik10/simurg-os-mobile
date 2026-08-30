const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const validator = read('simurg-data-validation.js');
const cloud = read('simurg-cloud-auth.js');
const polar = read('polar-workout.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function body(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `${name} missing`);
  const brace = source.indexOf('{', start);
  let depth = 0, quote = '', escaped = false;
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

run('startup initializes IndexedDB-first persistence before applying resolved DATA', () => {
  const readAt = index.indexOf("simurgStoredDataRaw=localStorage.getItem('atlas_summary_reports')");
  const validateAt = index.indexOf('SimurgPersistence.initialize({');
  const assignAt = index.indexOf('DATA=resolved||');
  const fallbackAt = index.indexOf('__simurgStartupDataValidationError');
  assert.ok(readAt >= 0 && validateAt > readAt && assignAt > validateAt && fallbackAt > validateAt);
  assert.doesNotMatch(index, /DATA=JSON\.parse\(simurgStoredDataRaw/);
  assert.match(index, /recoverWorkoutHistoryText\(simurgStoredDataRaw/);
  assert.match(index, /__simurgStartupDataRecoveryActive/);
  assert.match(index, /startupRecoveryWriteBlocked\(\)/);
});

run('full file restore enforces size, detached validation, backup and atomic commit', () => {
  const source = body(validator, 'secureRestore');
  assert.match(source, /file\.size>LIMITS\.maxBytes/);
  assert.match(source, /prepareFullText\(String\(reader\.result[\s\S]*legacyAppleWatchRpe:true/);
  assert.match(source, /downloadBackup:true/);
  assert.match(source, /commit\(prepared\.data/);
  assert.doesNotMatch(source, /adapter\.setData|localStorage\.setItem\(DATA_KEY/);
});

run('active append and callable legacy entry points are replaced by the staged controller', () => {
  for (const name of [
    'universalImport', 'importWorkoutJson', 'importWatchJson', 'importWorkoutArray',
    'importAppleWatch', 'importJSON', 'importPolarWorkout', 'importPolarRecovery',
    'simurgReceivePolarBridge', 'undoLastImport'
  ]) {
    assert.match(validator, new RegExp(`window\\.${name}=`), name);
  }
  assert.match(validator, /SimurgLegacyPolarRecovery\.import=securePolarRecovery/);
  assert.match(validator, /stageAppend\(adapter\.getData\(\),mutator/);
  assert.match(validator, /prepareFull\(candidate/);
});

run('atomic commit awaits persistence before changing live DATA and preserves snapshot/date rollback', () => {
  const source = body(validator, 'commit');
  assert.match(source, /var previous=adapter\.getData\(\)/);
  assert.match(source, /var previousDate=selected\(\)/);
  assert.match(source, /var previousSnapshot=localStorage\.getItem\(SNAP_KEY\)/);
  assert.match(source, /await window\.SimurgPersistence\.requireSuccess/);
  assert.ok(source.indexOf('await window.SimurgPersistence.requireSuccess')<source.indexOf('adapter.setData(prepared)'));
  assert.match(source, /adapter\.setData\(previous\)/);
  assert.doesNotMatch(source, /writeRaw\(localStorage,DATA_KEY/);
});

run('Cloud Pull validates before revision display, confirmation, backup, persist and metadata attempt', () => {
  const source = body(cloud, 'pullUserData');
  const validateAt = source.indexOf('preparePulledData(result.data.payload)');
  const revisionAt = source.indexOf('setRevisionStatus(result.data.revision');
  const confirmAt = source.indexOf('window.confirm(');
  const backupAt = source.indexOf('downloadLocalBackup(oldData)');
  const persistAt = source.indexOf('persistPulledData(pulled,');
  const metaAt = source.indexOf('tryWriteMeta(context.userId');
  assert.ok(validateAt >= 0 && revisionAt > validateAt && confirmAt > revisionAt && backupAt > confirmAt && persistAt > backupAt && metaAt > persistAt);
  assert.match(body(cloud, 'preparePulledData'), /SimurgDataValidation\.prepareFull[\s\S]*canonicalizeExercises:false[\s\S]*SimurgDataValidation\.prepareFull/);
});

run('Cloud requests, auth restore, conflict logic and Polar normalization remain intact', () => {
  assert.match(cloud, /auth\.getSession\(\)/);
  assert.match(cloud, /auth\.onAuthStateChange/);
  assert.match(cloud, /\.eq\('revision',meta\.revision\)/);
  assert.match(cloud, /\.select\('payload,revision,updated_at'\)/);
  assert.match(polar, /window\.SimurgPolarWorkoutNormalize=normalizeWorkout/);
  assert.match(polar, /SimurgDataAtomic\.appendPolarWorkout/);
});

if (process.exitCode) process.exit(process.exitCode);
