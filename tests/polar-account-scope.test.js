const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migration = read('supabase/migrations/202607240001_account_scoped_polar.sql');
const config = read('supabase/config.toml');
const shared = read('supabase/functions/_shared/polar.ts');
const connect = read('supabase/functions/polar-connect/index.ts');
const callback = read('supabase/functions/polar-callback/index.ts');
const sync = read('supabase/functions/polar-sync/index.ts');
const disconnect = read('supabase/functions/polar-disconnect/index.ts');
const client = read('polar-accesslink.js');
const desktop = read('desktop-alignment.js');

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (error) {
    console.error('✗ ' + name);
    throw error;
  }
}

test('migration adds account ownership without deleting legacy rows', () => {
  assert.match(migration, /polar_connections[\s\S]*add column if not exists user_id uuid references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /polar_oauth_states[\s\S]*add column if not exists user_id uuid references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /unique index if not exists polar_connections_user_id_unique[\s\S]*where user_id is not null/);
  assert.match(migration, /revoke all on public\.polar_connections from public, anon, authenticated/);
  assert.doesNotMatch(migration, /\bdelete\s+from\s+public\.polar_connections|\btruncate\b/i);
});

test('interactive Polar Edge functions require JWT while callback remains state-based', () => {
  assert.match(config, /\[functions\.polar-connect\]\s+verify_jwt = true/);
  assert.match(config, /\[functions\.polar-sync\]\s+verify_jwt = true/);
  assert.match(config, /\[functions\.polar-disconnect\]\s+verify_jwt = true/);
  assert.match(config, /\[functions\.polar-callback\]\s+verify_jwt = false/);
  assert.match(shared, /admin\.auth\.getUser\(match\[1\]\)/);
  assert.match(shared, /permanent_account_required/);
});

test('connection lookup is scoped to the verified user', () => {
  assert.match(shared, /\.eq\("user_id", user\.id\)/);
  assert.match(shared, /is\("user_id", null\)[\s\S]*eq\("client_id", capability\.clientId\)[\s\S]*eq\("client_key_hash", await capability\.clientKeyHash\)/);
  assert.match(shared, /update\(\{ user_id: user\.id \}\)[\s\S]*is\("user_id", null\)/);
  assert.match(shared, /No Polar connection exists for this Simurg account/);
});

test('OAuth state and callback preserve authenticated ownership', () => {
  assert.match(connect, /const user = await authenticateUser\(req, admin\)/);
  assert.match(connect, /user_id: user\.id/);
  assert.match(callback, /select\("user_id,client_id,client_key_hash,return_url"\)/);
  assert.match(callback, /user_id: data\.user_id/);
  assert.match(callback, /polar_account_already_owned/);
  assert.match(callback, /device_connection_already_owned/);
});

test('sync and disconnect use authenticated account context', () => {
  assert.match(sync, /authenticatedPolarContext\(req, admin\)/);
  assert.match(sync, /connected: false[\s\S]*status: "disconnected"/);
  assert.match(disconnect, /authenticatedPolarContext\(req, admin\)/);
  assert.doesNotMatch(sync, /x-simurg-polar-client/);
  assert.doesNotMatch(disconnect, /x-simurg-polar-client/);
});

test('browser sends session JWT and never treats DATA as authentication', () => {
  assert.match(client, /window\.SimurgCloudAuth\.getSession/);
  assert.match(client, /'Authorization':'Bearer '\+token/);
  assert.doesNotMatch(client, /'Authorization':'Bearer '\+key/);
  assert.match(client, /state\.status='loading'/);
  assert.match(client, /state\.status=payload\.connection&&payload\.connection\.connected\?'connected':'disconnected'/);
  assert.doesNotMatch(desktop, /data\(\)\.polarConnection/);
  assert.match(desktop, /function polarAuthState\(\)/);
});

test('signed-out clients cannot sync and disconnected clients get connect action', () => {
  assert.match(client, /authError\.code='signed_out'/);
  assert.match(client, /Önce Cloud Oturumu Aç/);
  assert.match(desktop, /signedOut\?'Cloud Oturumu Gerekli':'Polar Hesabını Bağla'/);
  assert.match(desktop, /connected\?'if\(window\.simurgPolarSyncNow\)/);
});

test('existing normalized merge remains idempotent', () => {
  assert.match(client, /findIndex\(function\(item\)\{return String\(item&&item\.startTime/);
  assert.match(client, /data\.polarActivity\.daily\[activity\.date\]=Object\.assign/);
  assert.match(client, /mergeDailyStore\(data\.polarSleep/);
  assert.match(sync, /upsert\(rawRows, \{ onConflict: "connection_id,data_type,polar_id" \}\)/);
});
