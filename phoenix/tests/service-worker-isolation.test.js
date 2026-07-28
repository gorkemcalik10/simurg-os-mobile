const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repo = path.join(__dirname, '..', '..');

function workerRuntime(file, scope, initialCaches) {
  const listeners = {};
  const cacheNames = new Set(initialCaches);
  const stores = new Map();
  const deleted = [];
  let globalMatches = 0;

  function cache(name) {
    if (!stores.has(name)) {
      stores.set(name, {
        addAll: async () => {},
        keys: async () => [],
        delete: async () => true,
        put: async () => {},
        match: async () => undefined
      });
    }
    return stores.get(name);
  }

  const self = {
    registration: { scope },
    location: new URL(scope),
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(type, listener) { listeners[type] = listener; }
  };
  const context = {
    self,
    location: self.location,
    URL,
    Promise,
    caches: {
      keys: async () => [...cacheNames],
      open: async name => {
        cacheNames.add(name);
        return cache(name);
      },
      delete: async name => {
        deleted.push(name);
        cacheNames.delete(name);
        return true;
      },
      match: async () => {
        globalMatches += 1;
        return undefined;
      }
    },
    fetch: async () => ({ ok: true, clone() { return this; } })
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
  return { listeners, cacheNames, stores, deleted, globalMatches: () => globalMatches };
}

async function activate(runtime) {
  let pending;
  runtime.listeners.activate({ waitUntil(value) { pending = value; } });
  await pending;
}

async function install(runtime) {
  let pending;
  runtime.listeners.install({ waitUntil(value) { pending = value; } });
  await pending;
}

function fetchEvent(url, mode = 'cors') {
  let response;
  return {
    request: { method: 'GET', url, mode, destination: mode === 'navigate' ? 'document' : 'script' },
    respondWith(value) { response = value; },
    responded() { return response !== undefined; },
    response() { return response; }
  };
}

async function main() {
  const rootFile = path.join(repo, 'sw.js');
  const phoenixFile = path.join(repo, 'phoenix', 'phoenix-sw.js');
  const origin = 'https://example.test/simurg-os-mobile/';

  const root = workerRuntime(rootFile, origin, [
    'simurg-stability-v1',
    'simurg-phoenix-signal-v2',
    'third-party-cache'
  ]);
  await activate(root);
  assert.deepEqual(root.deleted, ['simurg-stability-v1']);
  assert.ok(root.cacheNames.has('simurg-stability-v2'));
  assert.ok(root.cacheNames.has('simurg-phoenix-signal-v2'));
  assert.ok(root.cacheNames.has('third-party-cache'));

  const phoenixNavigation = fetchEvent(`${origin}phoenix/`, 'navigate');
  root.listeners.fetch(phoenixNavigation);
  assert.equal(phoenixNavigation.responded(), false);

  const legacyNavigation = fetchEvent(`${origin}index.html`, 'navigate');
  root.listeners.fetch(legacyNavigation);
  assert.equal(legacyNavigation.responded(), true);
  await legacyNavigation.response();

  const phoenix = workerRuntime(phoenixFile, `${origin}phoenix/`, [
    'simurg-stability-v2',
    'simurg-phoenix-signal-v2',
    'third-party-cache'
  ]);
  await install(phoenix);
  await activate(phoenix);
  assert.deepEqual(phoenix.deleted, ['simurg-phoenix-signal-v2']);
  assert.ok(phoenix.cacheNames.has('simurg-stability-v2'));
  assert.ok(phoenix.cacheNames.has('third-party-cache'));
  assert.ok(phoenix.cacheNames.has('simurg-phoenix-signal-v3'));

  const phoenixAsset = fetchEvent(`${origin}phoenix/phoenix-app.js`);
  phoenix.listeners.fetch(phoenixAsset);
  assert.equal(phoenixAsset.responded(), true);
  await phoenixAsset.response();
  assert.equal(phoenix.globalMatches(), 0);

  const legacyAsset = fetchEvent(`${origin}premium-standard.js`);
  phoenix.listeners.fetch(legacyAsset);
  assert.equal(legacyAsset.responded(), false);

  process.stdout.write('✓ Root and Phoenix service workers isolate scopes and cache families\n');
}

main().catch(error => {
  process.stderr.write(`✗ Service worker isolation\n${error.stack}\n`);
  process.exit(1);
});
