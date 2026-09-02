(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPersistence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DATA_KEY='atlas_summary_reports',FALLBACK_PENDING_KEY='simurg_fallback_pending_v1';
  var DB_NAME='simurg_os',DB_VERSION=1,STORE_NAME='canonical',MAIN_KEY='main',PENDING_KEY='pending',STORAGE_VERSION=1;
  var BACKUP_KEYS=['simurg_last_import_snapshot_v1','simurg_exercise_canonicalization_v1_backup','simurg-pre-workout-merge-backup'];
  var LARGE_FOOTPRINT_WARNING_BYTES=4*1024*1024;
  var runtime={initialized:false,initializing:null,backend:'legacy_localstorage_fallback',migrationStatus:'not_started',db:null,indexedDB:null,storage:null,prepare:null,indexedDbBytes:0,fallbackPending:false,lastError:null};

  function utf8Bytes(value){var text=String(value==null?'':value);if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(text).length;if(typeof Buffer!=='undefined')return Buffer.byteLength(text,'utf8');try{return unescape(encodeURIComponent(text)).length}catch(error){return text.length}}
  function isPlainObject(value){return !!value&&Object.prototype.toString.call(value)==='[object Object]'}
  function stableSerialize(value){if(Array.isArray(value))return '['+value.map(stableSerialize).join(',')+']';if(isPlainObject(value))return '{'+Object.keys(value).sort().map(function(key){return JSON.stringify(key)+':'+stableSerialize(value[key])}).join(',')+'}';return JSON.stringify(value)}
  function checksum(value){var text=stableSerialize(value),hash=2166136261;for(var index=0;index<text.length;index+=1){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619)}return 'fnv1a32-'+(hash>>>0).toString(16).padStart(8,'0')}
  function storageKeys(storage){var keys=[];try{for(var index=0;storage&&index<Number(storage.length||0);index++){var key=storage.key(index);if(key!=null)keys.push(String(key))}}catch(error){}return keys}
  function isSimurgKey(key){return key===DATA_KEY||key.indexOf('simurg_')===0||key.indexOf('simurg-')===0}
  function errorSummary(error){if(!error)return null;return {code:String(error.code||error.name||'persistence_error').slice(0,80),message:String(error.message||'Depolama işlemi başarısız.').replace(/[\r\n\t]+/g,' ').slice(0,180),at:new Date().toISOString()}}
  function rememberError(error){runtime.lastError=errorSummary(error);return error}
  function inspectStorage(storage,candidateRaw){
    var entries=[];storageKeys(storage).filter(isSimurgKey).forEach(function(key){var raw=null;try{raw=storage.getItem(key)}catch(error){}if(raw==null)return;var valueBytes=utf8Bytes(raw),keyBytes=utf8Bytes(key);entries.push({key:key,bytes:valueBytes,entryBytes:keyBytes+valueBytes,isBackup:BACKUP_KEYS.indexOf(key)>=0})});entries.sort(function(a,b){return b.bytes-a.bytes});
    var canonical=entries.find(function(entry){return entry.key===DATA_KEY}),backups=entries.filter(function(entry){return entry.isBackup}),totalBytes=entries.reduce(function(sum,entry){return sum+entry.entryBytes},0),candidateBytes=candidateRaw==null?null:utf8Bytes(candidateRaw),currentCanonicalEntryBytes=canonical?canonical.entryBytes:0,projectedBytes=candidateBytes==null?totalBytes:totalBytes-currentCanonicalEntryBytes+utf8Bytes(DATA_KEY)+candidateBytes,backupBytes=backups.reduce(function(sum,entry){return sum+entry.bytes},0),warningReasons=[];
    if(projectedBytes>=LARGE_FOOTPRINT_WARNING_BYTES)warningReasons.push('Simurg yerel depolama ayak izi ihtiyatlı büyük-kullanım eşiğini aşıyor. Bu eşik bir tarayıcı kotası değildir.');if(candidateBytes&&backupBytes>=candidateBytes)warningReasons.push('Tam-DATA yedekleri aday canonical DATA kadar veya daha fazla alan kullanıyor.');
    return {canonicalBytes:canonical?canonical.bytes:0,candidateBytes:candidateBytes,simurgTotalBytes:totalBytes,projectedSimurgTotalBytes:projectedBytes,keyCount:entries.length,backupCount:backups.length,backupBytes:backupBytes,backups:backups.map(function(entry){return {key:entry.key,bytes:entry.bytes}}),topKeys:entries.slice(0,5).map(function(entry){return {key:entry.key,bytes:entry.bytes}}),warning:warningReasons.length>0,warningReasons:warningReasons,warningIsHeuristic:true}
  }
  function stateSnapshot(){var backendLabel=runtime.backend==='indexeddb'?'IndexedDB':runtime.backend==='fallback_reconciliation_error'?'Fallback reconciliation blocked':'Legacy localStorage fallback';return {backend:backendLabel,backendCode:runtime.backend,migrationStatus:runtime.migrationStatus,indexedDbBytes:runtime.indexedDbBytes,fallbackPending:runtime.fallbackPending,lastError:runtime.lastError}}
  function diagnostics(storage,navigatorLike){var report=Object.assign(inspectStorage(storage||runtime.storage),stateSnapshot()),nav=navigatorLike||(typeof navigator!=='undefined'?navigator:null);if(!nav||!nav.storage||typeof nav.storage.estimate!=='function')return Promise.resolve(Object.assign(report,{originEstimate:{available:false,label:'Origin düzeyi depolama tahmini kullanılamıyor; localStorage kotası için kesin bir değer değildir.'}}));return Promise.resolve().then(function(){return nav.storage.estimate()}).then(function(estimate){return Object.assign(report,{originEstimate:{available:true,usage:Number(estimate&&estimate.usage)||0,quota:Number(estimate&&estimate.quota)||0,label:'Origin düzeyi tahmin; localStorage kotasını kesin olarak göstermez.'}})}).catch(function(){return Object.assign(report,{originEstimate:{available:false,label:'Origin düzeyi depolama tahmini okunamadı; localStorage kotası için kesin bir değer değildir.'}})})}
  function failure(key,error,code){var name=String(error&&error.name||''),nativeCode=error&&error.code,quota=name==='QuotaExceededError'||name==='NS_ERROR_DOM_QUOTA_REACHED'||nativeCode===22||nativeCode===1014,result={ok:false,key:String(key||''),code:code||(quota?'quota_exceeded':'storage_unavailable'),error:error,message:quota?'Kayıt yapılamadı: tarayıcı depolama alanı dolu. Girdileriniz ekranda korunuyor; sayfayı kapatmayın.':'Kayıt yapılamadı: tarayıcı depolaması kullanılamıyor. Girdileriniz ekranda korunuyor; sayfayı kapatmayın.'};rememberError(Object.assign(error||new Error(result.message),{code:result.code}));return result}
  function writeRaw(storage,key,value){try{if(!storage||typeof storage.setItem!=='function')throw new Error('Storage kullanılamıyor.');storage.setItem(key,String(value));return {ok:true,key:String(key),value:String(value)}}catch(error){return failure(key,error)}}
  function writeJson(storage,key,value){var raw;try{raw=JSON.stringify(value)}catch(error){return failure(key,error)}return writeRaw(storage,key,raw)}
  function remove(storage,key){try{if(!storage||typeof storage.removeItem!=='function')throw new Error('Storage kullanılamıyor.');storage.removeItem(key);return {ok:true,key:String(key)}}catch(error){return failure(key,error)}}
  function checked(result){if(result&&result.ok)return result;var error=new Error(result&&result.message||'Yerel kayıt başarısız.');error.cause=result&&result.error;error.persistenceResult=result||failure('',error);throw error}
  function requireSuccess(result){return result&&typeof result.then==='function'?Promise.resolve(result).then(checked):checked(result)}
  function notifyFailure(result,context){if(!result||result.ok)return result;var message=(context?String(context)+'\n\n':'')+result.message;if(typeof alert==='function')alert(message);return result}
  function recoveryFailure(){return {ok:false,key:DATA_KEY,code:'startup_recovery_active',message:'Yerel DATA doğrulanamadığı için eski depolama verisi korunuyor. Geçerli bir JSON yedeği veya Cloud Pull uygulanmadan kayıt yapılmadı.'}}
  function requestResult(request){return new Promise(function(resolve,reject){request.onsuccess=function(){resolve(request.result)};request.onerror=function(){reject(request.error||new Error('IndexedDB isteği başarısız.'))}})}
  function transactionDone(transaction){return new Promise(function(resolve,reject){transaction.oncomplete=function(){resolve()};transaction.onabort=function(){reject(transaction.error||new Error('IndexedDB transaction iptal edildi.'))};transaction.onerror=function(){reject(transaction.error||new Error('IndexedDB transaction başarısız.'))}})}
  function openDatabase(indexedDBLike){return new Promise(function(resolve,reject){if(!indexedDBLike||typeof indexedDBLike.open!=='function'){var unavailable=new Error('IndexedDB kullanılamıyor.');unavailable.code='indexeddb_unavailable';reject(unavailable);return}var request;try{request=indexedDBLike.open(DB_NAME,DB_VERSION)}catch(error){reject(error);return}request.onupgradeneeded=function(){var db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'key'})};request.onsuccess=function(){resolve(request.result)};request.onerror=function(){reject(request.error||new Error('IndexedDB açılamadı.'))};request.onblocked=function(){var blocked=new Error('IndexedDB yükseltmesi başka bir sekme tarafından engellendi.');blocked.code='indexeddb_blocked';reject(blocked)}})}
  async function getRecord(db,key){var transaction=db.transaction(STORE_NAME,'readonly'),request=transaction.objectStore(STORE_NAME).get(key),value=await requestResult(request);await transactionDone(transaction);return value||null}
  async function putRecord(db,record,deleteKey){var transaction=db.transaction(STORE_NAME,'readwrite'),store=transaction.objectStore(STORE_NAME);store.put(record);if(deleteKey)store.delete(deleteKey);await transactionDone(transaction);return record}
  function preparePayload(value,source){var prepared=runtime.prepare?runtime.prepare(value,{source:source}):value;if(!isPlainObject(prepared))throw new Error('Canonical DATA doğrulaması nesne döndürmedi.');return prepared}
  function recordFor(key,payload,status,source,previous){var serialized=stableSerialize(payload),now=new Date().toISOString();return {key:key,payload:payload,storageVersion:STORAGE_VERSION,schemaVersion:Number(payload&&payload.schemaVersion)||1,checksum:checksum(payload),serializedBytes:utf8Bytes(serialized),status:status,source:String(source||'save'),writtenAt:now,migratedAt:source==='migration'?(previous&&previous.migratedAt||now):(previous&&previous.migratedAt||null)}}
  function verifyRecord(record,requiredStatus){if(!record||record.key!==(requiredStatus==='pending'?PENDING_KEY:MAIN_KEY)||record.storageVersion!==STORAGE_VERSION||record.status!==requiredStatus)return {ok:false,code:'record_incomplete'};try{var prepared=preparePayload(record.payload,'indexeddb-readback'),actual=checksum(prepared);if(actual!==record.checksum||stableSerialize(prepared)!==stableSerialize(record.payload))return {ok:false,code:'record_checksum_mismatch'};return {ok:true,data:prepared,record:record}}catch(error){return {ok:false,code:'record_validation_failed',error:error}}}
  async function writeCanonical(payload,source){var prepared=preparePayload(payload,source||'save'),previous=await getRecord(runtime.db,MAIN_KEY),pending=recordFor(PENDING_KEY,prepared,'pending',source,previous);await putRecord(runtime.db,pending);var readback=verifyRecord(await getRecord(runtime.db,PENDING_KEY),'pending');if(!readback.ok){var mismatch=new Error('IndexedDB aday DATA geri okuma doğrulaması başarısız.');mismatch.code=readback.code;throw mismatch}var main=recordFor(MAIN_KEY,readback.data,'verified',source,previous);await putRecord(runtime.db,main,PENDING_KEY);var finalReadback=verifyRecord(await getRecord(runtime.db,MAIN_KEY),'verified');if(!finalReadback.ok){var finalMismatch=new Error('IndexedDB canonical DATA doğrulaması başarısız.');finalMismatch.code=finalReadback.code;throw finalMismatch}runtime.indexedDbBytes=finalReadback.record.serializedBytes;runtime.lastError=null;return {ok:true,key:MAIN_KEY,backend:'indexeddb',record:finalReadback.record,data:finalReadback.data}}
  function readLegacy(storage){var raw=null;try{raw=storage&&storage.getItem(DATA_KEY)}catch(error){return {ok:false,error:error,missing:false}}if(raw==null)return {ok:false,missing:true,raw:null};try{return {ok:true,raw:raw,data:preparePayload(JSON.parse(raw),'legacy-localstorage')}}catch(error){return {ok:false,missing:false,raw:raw,error:error}}}
  function fallbackMarkerFor(payload,source){return {storageVersion:STORAGE_VERSION,schemaVersion:Number(payload&&payload.schemaVersion)||1,checksum:checksum(payload),writtenAt:new Date().toISOString(),source:String(source||'save').slice(0,80),mode:'legacy_localstorage_fallback',status:'pending_reconciliation'}}
  function readFallbackMarker(storage){var raw=null;try{raw=storage&&storage.getItem(FALLBACK_PENDING_KEY)}catch(error){return {exists:true,ok:false,raw:null,error:error,code:'fallback_marker_unreadable'}}if(raw==null)return {exists:false,ok:true,raw:null,marker:null};try{var marker=JSON.parse(raw);if(!isPlainObject(marker)||marker.storageVersion!==STORAGE_VERSION||marker.status!=='pending_reconciliation'||marker.mode!=='legacy_localstorage_fallback'||typeof marker.checksum!=='string'||typeof marker.writtenAt!=='string'){var invalid=new Error('Fallback reconciliation marker geçersiz.');invalid.code='fallback_marker_invalid';return {exists:true,ok:false,raw:raw,error:invalid,code:invalid.code}}return {exists:true,ok:true,raw:raw,marker:marker}}catch(error){error.code='fallback_marker_invalid';return {exists:true,ok:false,raw:raw,error:error,code:error.code}}}
  function reconciliationError(code,message,cause){var error=new Error(message);error.code=code;if(cause)error.cause=cause;return error}
  function verifyFallbackCandidate(markerResult,legacy){if(!markerResult.ok)throw reconciliationError(markerResult.code||'fallback_marker_invalid','Fallback reconciliation marker doğrulanamadı.',markerResult.error);if(!legacy.ok)throw reconciliationError(legacy.missing?'fallback_payload_missing':'fallback_payload_invalid',legacy.missing?'Fallback reconciliation DATA bulunamadı.':'Fallback reconciliation DATA doğrulanamadı.',legacy.error);var marker=markerResult.marker,actual=checksum(legacy.data);if(actual!==marker.checksum||Number(marker.schemaVersion)!==(Number(legacy.data&&legacy.data.schemaVersion)||1))throw reconciliationError('fallback_checksum_mismatch','Fallback reconciliation checksum doğrulaması başarısız.');return legacy.data}
  function reconciliationBlockedFailure(){return {ok:false,key:DATA_KEY,code:'fallback_reconciliation_blocked',message:'Bekleyen fallback DATA güvenle uzlaştırılamadı. Mevcut veri kaynakları korunuyor; manuel kurtarma yapılmadan kayıt kapalı.'}}
  async function initialize(options){
    options=options||{};
    if(runtime.initializing)return runtime.initializing;
    runtime.storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null);
    runtime.indexedDB=options.indexedDB||(typeof indexedDB!=='undefined'?indexedDB:null);
    runtime.prepare=typeof options.prepare==='function'?options.prepare:null;
    runtime.initializing=(async function(){
      var legacy=readLegacy(runtime.storage),markerResult=readFallbackMarker(runtime.storage),dbError=null,invalidRecord=null;
      runtime.fallbackPending=markerResult.exists;
      try{
        runtime.db=await openDatabase(runtime.indexedDB);
        var existing=await getRecord(runtime.db,MAIN_KEY),verified=verifyRecord(existing,'verified');
        if(markerResult.exists){
          try{
            var fallbackCandidate=verifyFallbackCandidate(markerResult,legacy),reconciled=await writeCanonical(fallbackCandidate,'fallback-reconciliation'),cleared=remove(runtime.storage,FALLBACK_PENDING_KEY);
            if(!cleared.ok)throw reconciliationError('fallback_marker_clear_failed','Doğrulanmış fallback reconciliation marker temizlenemedi.',cleared.error);
            runtime.backend='indexeddb';runtime.migrationStatus='fallback_reconciled';runtime.fallbackPending=false;runtime.initialized=true;runtime.lastError=null;
            return {ok:true,data:reconciled.data,source:'fallback_reconciled',legacyRaw:legacy.raw,state:stateSnapshot()};
          }catch(error){
            runtime.backend='fallback_reconciliation_error';runtime.migrationStatus='fallback_reconciliation_error';runtime.fallbackPending=true;runtime.initialized=true;rememberError(error);
            return {ok:false,data:legacy.ok?legacy.data:null,source:'fallback_reconciliation_error',legacyError:legacy.error||null,error:error,preservedIndexedDbMain:!!existing,state:stateSnapshot()};
          }
        }
        if(verified.ok){
          runtime.backend='indexeddb';runtime.migrationStatus='migrated_verified';runtime.indexedDbBytes=verified.record.serializedBytes;runtime.initialized=true;runtime.lastError=null;
          return {ok:true,data:verified.data,source:'indexeddb',state:stateSnapshot()};
        }
        invalidRecord=existing?verified:null;
        if(legacy.ok){
          try{
            var migrated=await writeCanonical(legacy.data,'migration');
            runtime.backend='indexeddb';runtime.migrationStatus='migrated_verified';runtime.initialized=true;
            return {ok:true,data:migrated.data,source:'indexeddb_migration',legacyRaw:legacy.raw,state:stateSnapshot()};
          }catch(error){dbError=error}
        }
        if(dbError){
          runtime.backend='legacy_localstorage_fallback';runtime.migrationStatus='fallback_due_to_error';runtime.initialized=true;rememberError(dbError);
          return {ok:true,data:legacy.ok?legacy.data:null,source:legacy.ok?'legacy_localstorage':'default',legacyError:legacy.error||null,error:dbError,state:stateSnapshot()};
        }
        runtime.backend='indexeddb';runtime.migrationStatus='not_started';runtime.initialized=true;
        if(invalidRecord){var invalid=new Error('IndexedDB canonical kaydı geçersiz; güvenli fallback kullanıldı.');invalid.code=invalidRecord.code;rememberError(invalid)}
        return {ok:true,data:legacy.ok?legacy.data:null,source:legacy.ok?'legacy_localstorage':'default',legacyError:legacy.error||null,state:stateSnapshot()};
      }catch(error){dbError=error}
      runtime.db=null;runtime.backend='legacy_localstorage_fallback';runtime.migrationStatus=markerResult.exists?'legacy_fallback_pending':'fallback_due_to_error';runtime.initialized=true;rememberError(dbError);
      return {ok:true,data:legacy.ok?legacy.data:null,source:legacy.ok?'legacy_localstorage':'default',legacyError:legacy.error||null,error:dbError,state:stateSnapshot()};
    })();
    return runtime.initializing;
  }
  async function persistData(storage,value,options){if(typeof globalThis!=='undefined'&&globalThis.__simurgStartupDataRecoveryActive)return recoveryFailure();options=options||{};if(runtime.initializing)await runtime.initializing;if(runtime.migrationStatus==='fallback_reconciliation_error')return reconciliationBlockedFailure();if(runtime.backend==='indexeddb'&&runtime.db){try{return await writeCanonical(value,options.source||'save')}catch(error){return failure(MAIN_KEY,error,'indexeddb_write_failed')}}var prepared=value,raw;try{if(runtime.initialized)prepared=preparePayload(value,options.source||'fallback-save');raw=JSON.stringify(prepared)}catch(error){return failure(DATA_KEY,error)}var target=storage||runtime.storage,preflight=inspectStorage(target,raw);if(runtime.initialized){var marker=fallbackMarkerFor(prepared,options.source||'save'),markerWrite=writeJson(target,FALLBACK_PENDING_KEY,marker);if(!markerWrite.ok){markerWrite.code='fallback_marker_write_failed';markerWrite.message='Fallback kayıt işareti yazılamadı; canonical DATA değiştirilmedi.';return markerWrite}runtime.fallbackPending=true;runtime.migrationStatus='legacy_fallback_pending'}var result=writeRaw(target,DATA_KEY,raw);result.diagnostics=preflight;result.backend='legacy_localstorage_fallback';result.fallbackPending=runtime.fallbackPending;return result}
  function resetForTests(){if(runtime.db&&typeof runtime.db.close==='function')runtime.db.close();runtime={initialized:false,initializing:null,backend:'legacy_localstorage_fallback',migrationStatus:'not_started',db:null,indexedDB:null,storage:null,prepare:null,indexedDbBytes:0,fallbackPending:false,lastError:null}}
  return {DATA_KEY:DATA_KEY,FALLBACK_PENDING_KEY:FALLBACK_PENDING_KEY,DB_NAME:DB_NAME,DB_VERSION:DB_VERSION,STORE_NAME:STORE_NAME,MAIN_KEY:MAIN_KEY,PENDING_KEY:PENDING_KEY,STORAGE_VERSION:STORAGE_VERSION,BACKUP_KEYS:BACKUP_KEYS.slice(),utf8Bytes:utf8Bytes,stableSerialize:stableSerialize,checksum:checksum,inspectStorage:inspectStorage,diagnostics:diagnostics,state:stateSnapshot,initialize:initialize,persistData:persistData,writeRaw:writeRaw,writeJson:writeJson,remove:remove,requireSuccess:requireSuccess,notifyFailure:notifyFailure,_resetForTests:resetForTests,_verifyRecord:verifyRecord};
});
