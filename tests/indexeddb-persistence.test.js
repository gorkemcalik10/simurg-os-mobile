const assert = require('node:assert/strict');
const persistence = require('../simurg-persistence.js');
const validation = require('../simurg-data-validation.js');

function storageFrom(entries={}) {
  const values = new Map(Object.entries(entries));
  const writes = [];
  return {
    values, writes,
    get length(){ return values.size; },
    key(index){ return Array.from(values.keys())[index] ?? null; },
    getItem(key){ return values.has(key) ? values.get(key) : null; },
    setItem(key,value){ writes.push([key,String(value)]); values.set(key,String(value)); },
    removeItem(key){ values.delete(key); }
  };
}

function fakeIndexedDB() {
  const stores = new Map();
  const control = { failWrites:false, failOpen:false };
  function request(operation, transaction) {
    const req = {};
    transaction.pending += 1;
    setTimeout(() => {
      try {
        if (control.failWrites && transaction.mode === 'readwrite') throw Object.assign(new Error('synthetic IndexedDB write failure'), { name:'AbortError' });
        req.result = operation();
        if (req.onsuccess) req.onsuccess();
        transaction.pending -= 1;
        transaction.maybeComplete();
      } catch (error) {
        req.error = error;
        transaction.error = error;
        if (req.onerror) req.onerror();
        if (transaction.onabort) transaction.onabort();
      }
    }, 0);
    return req;
  }
  function database() {
    return {
      objectStoreNames:{ contains(name){ return stores.has(name); } },
      createObjectStore(name){ if (!stores.has(name)) stores.set(name,new Map()); },
      close(){},
      transaction(name,mode) {
        const transaction = {
          mode, pending:0, completeScheduled:false, error:null,
          maybeComplete(){
            if (this.pending || this.completeScheduled) return;
            this.completeScheduled = true;
            setTimeout(() => { if (this.oncomplete) this.oncomplete(); }, 0);
          },
          objectStore(){
            const store = stores.get(name);
            return {
              get(key){ return request(() => store.get(key),transaction); },
              put(value){ return request(() => { store.set(value.key,structuredClone(value)); return value.key; },transaction); },
              delete(key){ return request(() => store.delete(key),transaction); }
            };
          }
        };
        return transaction;
      }
    };
  }
  return {
    control, stores,
    open() {
      const req = {};
      setTimeout(() => {
        if (control.failOpen) { req.error=Object.assign(new Error('synthetic open failure'),{name:'InvalidStateError'}); if(req.onerror)req.onerror(); return; }
        req.result = database();
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      },0);
      return req;
    }
  };
}

function canonical(workouts=[]) { return validation.prepareFull({ workouts }).data; }
function prepare(value) { return validation.prepareFull(value,{ legacyAppleWatchRpe:true }).data; }
async function run(name, fn) {
  try { await fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
  finally { persistence._resetForTests(); }
}

(async () => {
  await run('first startup migrates verified DATA and leaves legacy canonical bytes untouched', async () => {
    const legacy = canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]);
    const raw = JSON.stringify(legacy), storage=storageFrom({[persistence.DATA_KEY]:raw}), idb=fakeIndexedDB();
    const result = await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'indexeddb_migration');
    assert.equal(result.state.migrationStatus,'migrated_verified');
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
    assert.equal(storage.writes.length,0);
    const main=idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY);
    assert.equal(main.status,'verified');
    assert.equal(main.checksum,persistence.checksum(main.payload));
    assert.equal(idb.stores.get(persistence.STORE_NAME).has(persistence.PENDING_KEY),false);
  });

  await run('second startup loads verified IndexedDB directly without rewriting migration', async () => {
    const legacy=canonical(),raw=JSON.stringify(legacy),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const writtenAt=idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY).writtenAt;
    persistence._resetForTests();
    const second=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(second.source,'indexeddb');
    assert.equal(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY).writtenAt,writtenAt);
    assert.equal(storage.writes.length,0);
  });

  await run('migration transaction failure safely falls back to untouched legacy DATA', async () => {
    const legacy=canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]),raw=JSON.stringify(legacy),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    idb.control.failWrites=true;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'legacy_localstorage');
    assert.equal(result.state.backend,'Legacy localStorage fallback');
    assert.equal(result.state.migrationStatus,'fallback_due_to_error');
    assert.deepEqual(result.data,legacy);
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
  });

  await run('IndexedDB open failure keeps valid legacy DATA as the startup source', async () => {
    const legacy=canonical(),raw=JSON.stringify(legacy),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    idb.control.failOpen=true;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'legacy_localstorage');
    assert.equal(result.state.migrationStatus,'fallback_due_to_error');
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
  });

  await run('verified migration with temporary IndexedDB outage starts from legacy fallback', async () => {
    const legacy=canonical([{date:'2026-08-30',exercise:'Legacy Row',sets:1,reps:8,weight:20}]),raw=JSON.stringify(legacy),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    persistence._resetForTests();idb.control.failOpen=true;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.ok,true);
    assert.equal(result.source,'legacy_localstorage');
    assert.deepEqual(result.data,legacy);
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
  });

  await run('successful fallback save updates legacy DATA and creates a matching small pending marker', async () => {
    const storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(canonical())}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const next=canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]);
    const result=await persistence.persistData(storage,next,{source:'test-fallback-save'}),marker=JSON.parse(storage.getItem(persistence.FALLBACK_PENDING_KEY));
    assert.equal(result.ok,true);
    assert.deepEqual(JSON.parse(storage.getItem(persistence.DATA_KEY)),next);
    assert.equal(marker.status,'pending_reconciliation');
    assert.equal(marker.mode,'legacy_localstorage_fallback');
    assert.equal(marker.storageVersion,persistence.STORAGE_VERSION);
    assert.equal(marker.checksum,persistence.checksum(next));
    assert.ok(storage.getItem(persistence.FALLBACK_PENDING_KEY).length<512);
    assert.equal(persistence.state().migrationStatus,'legacy_fallback_pending');
  });

  await run('fallback save cannot claim success unless the marker is durable before canonical DATA changes', async () => {
    const original=canonical(),raw=JSON.stringify(original),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const setItem=storage.setItem.bind(storage);
    storage.setItem=(key,value)=>{if(key===persistence.FALLBACK_PENDING_KEY)throw new Error('synthetic marker failure');setItem(key,value);};
    const result=await persistence.persistData(storage,canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]));
    assert.equal(result.ok,false);
    assert.equal(result.code,'fallback_marker_write_failed');
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
    assert.equal(storage.getItem(persistence.FALLBACK_PENDING_KEY),null);
  });

  await run('valid fallback marker reconciles through verified IndexedDB promotion before it clears', async () => {
    const initial=canonical(),storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(initial)}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const fallback=canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]);
    await persistence.persistData(storage,fallback,{source:'test-fallback-save'});
    assert.ok(storage.getItem(persistence.FALLBACK_PENDING_KEY));
    persistence._resetForTests();idb.control.failOpen=false;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    const main=idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY);
    assert.equal(result.ok,true);
    assert.equal(result.source,'fallback_reconciled');
    assert.equal(result.state.migrationStatus,'fallback_reconciled');
    assert.deepEqual(result.data,fallback);
    assert.deepEqual(main.payload,fallback);
    assert.equal(main.status,'verified');
    assert.equal(main.checksum,persistence.checksum(fallback));
    assert.equal(idb.stores.get(persistence.STORE_NAME).has(persistence.PENDING_KEY),false);
    assert.equal(storage.getItem(persistence.FALLBACK_PENDING_KEY),null);
  });

  await run('fallback checksum mismatch fails closed and preserves marker, legacy DATA and old IndexedDB main', async () => {
    const initial=canonical([{date:'2026-08-29',exercise:'Old Main',sets:1,reps:8,weight:20}]),storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(initial)}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const oldMain=structuredClone(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY));
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const fallback=canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]);
    await persistence.persistData(storage,fallback);
    const markerRaw=storage.getItem(persistence.FALLBACK_PENDING_KEY),tampered=canonical([{date:'2026-09-01',exercise:'Tampered',sets:3,reps:5,weight:30}]);
    storage.setItem(persistence.DATA_KEY,JSON.stringify(tampered));
    persistence._resetForTests();idb.control.failOpen=false;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.ok,false);
    assert.equal(result.source,'fallback_reconciliation_error');
    assert.equal(result.error.code,'fallback_checksum_mismatch');
    assert.equal(result.state.migrationStatus,'fallback_reconciliation_error');
    assert.deepEqual(result.data,tampered);
    assert.equal(storage.getItem(persistence.FALLBACK_PENDING_KEY),markerRaw);
    assert.deepEqual(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY),oldMain);
    assert.equal((await persistence.persistData(storage,tampered)).code,'fallback_reconciliation_blocked');
  });

  await run('invalid pending fallback payload fails closed without discarding recovery evidence', async () => {
    const initial=canonical(),storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(initial)}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    await persistence.persistData(storage,canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]));
    const markerRaw=storage.getItem(persistence.FALLBACK_PENDING_KEY);
    storage.setItem(persistence.DATA_KEY,'{broken-json');
    persistence._resetForTests();idb.control.failOpen=false;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.ok,false);
    assert.equal(result.error.code,'fallback_payload_invalid');
    assert.equal(result.data,null);
    assert.equal(storage.getItem(persistence.DATA_KEY),'{broken-json');
    assert.equal(storage.getItem(persistence.FALLBACK_PENDING_KEY),markerRaw);
  });

  await run('fallback reconciliation IndexedDB write failure preserves pending evidence and never reports old main as success', async () => {
    const initial=canonical([{date:'2026-08-29',exercise:'Old Main',sets:1,reps:8,weight:20}]),storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(initial)}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const oldMain=structuredClone(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY));
    persistence._resetForTests();idb.control.failOpen=true;
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const fallback=canonical([{date:'2026-08-31',exercise:'Fallback Press',sets:2,reps:8,weight:25}]);
    await persistence.persistData(storage,fallback);
    const markerRaw=storage.getItem(persistence.FALLBACK_PENDING_KEY),legacyRaw=storage.getItem(persistence.DATA_KEY);
    persistence._resetForTests();idb.control.failOpen=false;idb.control.failWrites=true;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.ok,false);
    assert.equal(result.source,'fallback_reconciliation_error');
    assert.deepEqual(result.data,fallback);
    assert.equal(storage.getItem(persistence.FALLBACK_PENDING_KEY),markerRaw);
    assert.equal(storage.getItem(persistence.DATA_KEY),legacyRaw);
    assert.deepEqual(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY),oldMain);
  });

  await run('invalid legacy JSON with no verified IndexedDB record uses the default path without modifying storage', async () => {
    const storage=storageFrom({[persistence.DATA_KEY]:'{broken-json'}),idb=fakeIndexedDB();
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'default');
    assert.equal(result.data,null);
    assert.ok(result.legacyError);
    assert.equal(storage.getItem(persistence.DATA_KEY),'{broken-json');
    assert.equal(storage.writes.length,0);
  });

  await run('an interrupted pending record never overrides a valid legacy source', async () => {
    const legacy=canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]),storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(legacy)}),idb=fakeIndexedDB();
    idb.stores.set(persistence.STORE_NAME,new Map([[persistence.PENDING_KEY,{key:'pending',status:'pending',storageVersion:1,payload:{broken:true},checksum:'wrong'}]]));
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'indexeddb_migration');
    assert.deepEqual(result.data,legacy);
    assert.equal(idb.stores.get(persistence.STORE_NAME).has(persistence.PENDING_KEY),false);
  });

  await run('runtime IndexedDB save resolves only after verified commit', async () => {
    const storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(canonical())}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const next=canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]);
    const result=await persistence.persistData(storage,next,{source:'test-save'});
    assert.equal(result.ok,true);
    assert.equal(result.record.status,'verified');
    assert.deepEqual(result.data,next);
    assert.equal(idb.stores.get(persistence.STORE_NAME).has(persistence.PENDING_KEY),false);
  });

  await run('runtime IndexedDB failure returns failure and never mirrors canonical DATA to localStorage', async () => {
    const initial=canonical(),raw=JSON.stringify(initial),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const before=idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY);
    idb.control.failWrites=true;
    const result=await persistence.persistData(storage,canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]));
    assert.equal(result.ok,false);
    assert.equal(result.code,'indexeddb_write_failed');
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
    assert.equal(storage.writes.length,0);
    assert.deepEqual(idb.stores.get(persistence.STORE_NAME).get(persistence.MAIN_KEY),before);
  });

  await run('invalid IndexedDB main cannot override a valid legacy fallback', async () => {
    const legacy=canonical([{date:'2026-08-30',exercise:'Legacy Row',sets:1,reps:8,weight:20}]),raw=JSON.stringify(legacy),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    idb.stores.get(persistence.STORE_NAME).set(persistence.MAIN_KEY,{key:'main',status:'verified',storageVersion:1,payload:{broken:true},checksum:'wrong'});
    persistence._resetForTests();idb.control.failWrites=true;
    const result=await persistence.initialize({storage,indexedDB:idb,prepare});
    assert.equal(result.source,'legacy_localstorage');
    assert.deepEqual(result.data,legacy);
    assert.equal(result.state.migrationStatus,'fallback_due_to_error');
  });

  await run('diagnostics expose backend, migration, both canonical byte counts, backups and last error', async () => {
    const storage=storageFrom({[persistence.DATA_KEY]:JSON.stringify(canonical()),simurg_last_import_snapshot_v1:'backup'}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    const report=await persistence.diagnostics(storage,{storage:{estimate:async()=>({usage:100,quota:1000})}});
    assert.equal(report.backend,'IndexedDB');
    assert.equal(report.migrationStatus,'migrated_verified');
    assert.ok(report.indexedDbBytes>0);
    assert.ok(report.canonicalBytes>0);
    assert.equal(report.backupCount,1);
    assert.deepEqual(report.originEstimate.usage,100);
  });

  await run('no canonical localStorage writes occur after verified migration', async () => {
    const raw=JSON.stringify(canonical()),storage=storageFrom({[persistence.DATA_KEY]:raw}),idb=fakeIndexedDB();
    await persistence.initialize({storage,indexedDB:idb,prepare});
    await persistence.persistData(storage,canonical([{date:'2026-08-30',exercise:'Row',sets:1,reps:8,weight:20}]));
    await persistence.persistData(storage,canonical([{date:'2026-08-31',exercise:'Press',sets:1,reps:8,weight:20}]));
    assert.equal(storage.writes.filter(([key])=>key===persistence.DATA_KEY).length,0);
    assert.equal(storage.writes.filter(([key])=>key===persistence.FALLBACK_PENDING_KEY).length,0);
    assert.equal(storage.getItem(persistence.DATA_KEY),raw);
  });

  if (process.exitCode) process.exit(process.exitCode);
})();
