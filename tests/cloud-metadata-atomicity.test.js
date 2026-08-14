const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'simurg-cloud-auth.js'), 'utf8');
const persistence = require('../simurg-persistence.js');
const DATA_KEY = persistence.DATA_KEY;
const USER_ID = 'user-test-1';
const META_KEY = `simurg_cloud_meta:${USER_ID}`;

function element() {
  const classes = new Set();
  return {
    textContent: '', value: '', disabled: false, hidden: false, dataset: {},
    classList: { add: value => classes.add(value), remove: (...values) => values.forEach(value => classes.delete(value)), contains: value => classes.has(value) },
    addEventListener() {}, appendChild() {}, remove() {}, click() {},
  };
}

function makeStorage(initial = {}, fail) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      const error = fail && fail(String(key), String(value));
      if (error) throw error;
      values.set(String(key), String(value));
    },
    removeItem(key) { values.delete(String(key)); },
    raw(key) { return values.has(key) ? values.get(key) : null; },
  };
}

function quotaError(message = 'quota') {
  const error = new Error(message);
  error.name = 'QuotaExceededError';
  error.code = 22;
  return error;
}

function makeClient(config, calls) {
  const client = {
    auth: {
      async getSession() { return { data: { session: { user: { id: USER_ID, email: 'u@example.test' } } }, error: null }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async signOut() { return { error: null }; },
    },
    from(table) {
      assert.equal(table, 'simurg_user_data');
      calls.from += 1;
      return {
        select() {
          return {
            eq() { return this; },
            async maybeSingle() { return config.lookup; },
          };
        },
        insert(payload) {
          calls.insert.push(payload);
          return { async select() { return config.insert; } };
        },
        update(payload) {
          calls.update.push(payload);
          return {
            eq() { return this; },
            async select() { return config.update; },
          };
        },
      };
    },
  };
  return client;
}

async function runtime(options = {}) {
  const initialData = options.data || { schemaVersion: 1, workouts: [{ date: '2026-08-10', exercise: 'Old' }] };
  const initialRaw = options.initialRaw === undefined ? JSON.stringify(initialData) : options.initialRaw;
  const initial = initialRaw === null ? {} : { [DATA_KEY]: initialRaw };
  if (options.meta) initial[META_KEY] = JSON.stringify(options.meta);
  const storage = makeStorage(initial, options.failStorage);
  const elements = new Map();
  const callbacks = {};
  const calls = { from: 0, insert: [], update: [], render: 0 };
  const config = {
    lookup: options.lookup || { data: null, error: null },
    insert: options.insert || { data: [{ revision: 1, updated_at: '2026-08-14T10:00:00.000Z' }], error: null },
    update: options.update || { data: [{ revision: 3, updated_at: '2026-08-14T10:00:00.000Z' }], error: null },
  };
  const client = makeClient(config, calls);
  const document = {
    readyState: 'loading', body: element(),
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    addEventListener(name, callback) { callbacks[name] = callback; },
    dispatchEvent() {}, createElement() { return element(); },
  };
  const window = {
    document, localStorage: storage, SimurgPersistence: persistence,
    SimurgDataValidation: {
      prepareFull(value) {
        if (options.validationError) throw options.validationError;
        return { data: JSON.parse(JSON.stringify(value)) };
      },
    },
    supabase: { createClient() { return client; } },
    confirm: () => options.confirm !== false,
    renderDataLocalStatus() {},
  };
  window.window = window;
  const context = vm.createContext({
    window, document, localStorage: storage,
    SIMURG_SUPABASE_URL: 'https://mock.invalid', SIMURG_SUPABASE_KEY: 'mock-key',
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init.detail; },
    Blob: function Blob() {}, URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
    setTimeout: callback => { callback(); return 1; }, clearTimeout() {},
    console,
    render() { calls.render += 1; if (options.renderError) throw options.renderError; },
  });
  context.DATA = vm.runInContext(`JSON.parse(${JSON.stringify(JSON.stringify(initialData))})`, context);
  vm.runInContext(source, context, { filename: 'simurg-cloud-auth.js' });
  assert.equal(calls.from, 0, 'initialization must not call cloud data APIs');
  callbacks.DOMContentLoaded();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.from, 0, 'auth restoration must remain explicit-only');
  return { context, window, storage, elements, calls };
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const baseMeta = { revision: 2, updatedAt: '2026-08-13T10:00:00.000Z', lastPullAt: '2026-08-13T10:00:00.000Z', lastPushAt: '' };

test('Push remote success and local metadata success returns normal success', async () => {
  const app = await runtime({ meta: baseMeta, lookup: { data: { revision: 2, updated_at: baseMeta.updatedAt }, error: null } });
  const result = await app.window.pushUserData();
  assert.equal(result.status, 'success');
  assert.equal(result.metadataPersisted, true);
  assert.equal(JSON.parse(app.storage.raw(META_KEY)).revision, 3);
  assert.equal(app.elements.get('cloudSyncStatus').dataset.state, 'ok');
});

test('Push remote success and metadata quota failure returns success-with-warning', async () => {
  const app = await runtime({ meta: baseMeta, lookup: { data: { revision: 2, updated_at: baseMeta.updatedAt }, error: null }, failStorage: key => key === META_KEY ? quotaError() : null });
  const previousMeta = app.storage.raw(META_KEY);
  const result = await app.window.pushUserData();
  assert.equal(result.status, 'success_with_local_metadata_warning');
  assert.equal(result.revision, 3);
  assert.equal(result.metadataPersisted, false);
  assert.equal(app.storage.raw(META_KEY), previousMeta);
  assert.match(app.elements.get('cloudSyncStatus').textContent, /tamamlandı; ancak yerel revizyon bilgisi kaydedilemedi/i);
  assert.equal(app.elements.get('cloudSyncStatus').dataset.state, 'warn');
});

test('Push conflict leaves local revision metadata unchanged', async () => {
  const app = await runtime({ meta: baseMeta, lookup: { data: { revision: 2, updated_at: baseMeta.updatedAt }, error: null }, update: { data: [], error: null } });
  const previousMeta = app.storage.raw(META_KEY);
  const result = await app.window.pushUserData();
  assert.equal(result.status, 'conflict');
  assert.equal(app.storage.raw(META_KEY), previousMeta);
  assert.equal(app.elements.get('cloudSyncStatus').dataset.state, 'conflict');
});

test('Push remote failure does not advance local revision metadata', async () => {
  const app = await runtime({ meta: baseMeta, lookup: { data: { revision: 2, updated_at: baseMeta.updatedAt }, error: null }, update: { data: null, error: new Error('network unavailable') } });
  const previousMeta = app.storage.raw(META_KEY);
  const result = await app.window.pushUserData();
  assert.equal(result.status, 'remote_failure');
  assert.equal(app.storage.raw(META_KEY), previousMeta);
  assert.equal(app.elements.get('cloudSyncStatus').dataset.state, 'err');
});

test('Push Safari Private Mode-style metadata failure is a warning after confirmed insert', async () => {
  const app = await runtime({ lookup: { data: null, error: null }, failStorage: () => quotaError('private mode') });
  const result = await app.window.pushUserData();
  assert.equal(result.status, 'success_with_local_metadata_warning');
  assert.equal(app.calls.insert.length, 1);
  assert.match(app.elements.get('cloudSyncStatus').textContent, /depolama alanı dolu|depolaması kullanılamıyor/i);
});

test('Pull valid payload and local metadata success returns normal success', async () => {
  const incoming = { schemaVersion: 1, workouts: [{ date: '2026-08-14', exercise: 'New' }] };
  const app = await runtime({ lookup: { data: { payload: incoming, revision: 7, updated_at: '2026-08-14T11:00:00.000Z' }, error: null } });
  const result = await app.window.pullUserData();
  assert.equal(result.status, 'success');
  assert.equal(result.dataApplied, true);
  assert.equal(app.context.DATA.workouts[0].exercise, 'New');
  assert.equal(JSON.parse(app.storage.raw(META_KEY)).revision, 7);
});

test('Pull metadata failure keeps applied DATA and reports a clear warning', async () => {
  const incoming = { schemaVersion: 1, workouts: [{ date: '2026-08-14', exercise: 'Applied' }] };
  const app = await runtime({ lookup: { data: { payload: incoming, revision: 8, updated_at: '2026-08-14T11:00:00.000Z' }, error: null }, failStorage: key => key === META_KEY ? quotaError() : null });
  const result = await app.window.pullUserData();
  assert.equal(result.status, 'success_with_local_metadata_warning');
  assert.equal(result.dataApplied, true);
  assert.equal(app.context.DATA.workouts[0].exercise, 'Applied');
  assert.equal(JSON.parse(app.storage.raw(DATA_KEY)).workouts[0].exercise, 'Applied');
  assert.equal(app.storage.raw(META_KEY), null);
  assert.match(app.elements.get('cloudSyncStatus').textContent, /Uygulanan DATA korunuyor/i);
});

test('Pull validation failure leaves DATA and storage unchanged', async () => {
  const app = await runtime({ lookup: { data: { payload: { corrupt: true }, revision: 9, updated_at: '2026-08-14T11:00:00.000Z' }, error: null }, validationError: new Error('invalid payload') });
  const previousData = app.context.DATA;
  const previousRaw = app.storage.raw(DATA_KEY);
  const result = await app.window.pullUserData();
  assert.equal(result.status, 'validation_failure');
  assert.equal(app.context.DATA, previousData);
  assert.equal(app.storage.raw(DATA_KEY), previousRaw);
});

test('Pull DATA persistence quota failure rolls back the application', async () => {
  const incoming = { schemaVersion: 1, workouts: [{ date: '2026-08-14', exercise: 'Must Roll Back' }] };
  const app = await runtime({ lookup: { data: { payload: incoming, revision: 10, updated_at: '2026-08-14T11:00:00.000Z' }, error: null }, failStorage: key => key === DATA_KEY ? quotaError() : null });
  const previousData = app.context.DATA;
  const previousRaw = app.storage.raw(DATA_KEY);
  const result = await app.window.pullUserData();
  assert.equal(result.status, 'data_application_failure');
  assert.equal(app.context.DATA, previousData);
  assert.equal(app.storage.raw(DATA_KEY), previousRaw);
  assert.equal(app.storage.raw(META_KEY), null);
});

test('Pull render failure retains the existing rollback contract', async () => {
  const incoming = { schemaVersion: 1, workouts: [{ date: '2026-08-14', exercise: 'Must Roll Back' }] };
  const app = await runtime({ lookup: { data: { payload: incoming, revision: 11, updated_at: '2026-08-14T11:00:00.000Z' }, error: null }, renderError: new Error('render failed') });
  const previousData = app.context.DATA;
  const previousRaw = app.storage.raw(DATA_KEY);
  const result = await app.window.pullUserData();
  assert.equal(result.status, 'data_application_failure');
  assert.equal(app.context.DATA, previousData);
  assert.equal(app.storage.raw(DATA_KEY), previousRaw);
  assert.equal(app.storage.raw(META_KEY), null);
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); process.stdout.write(`✓ ${name}\n`); }
    catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
  }
})();
