(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPersistence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DATA_KEY='atlas_summary_reports';
  var BACKUP_KEYS=['simurg_last_import_snapshot_v1','simurg_exercise_canonicalization_v1_backup','simurg-pre-workout-merge-backup'];
  var LARGE_FOOTPRINT_WARNING_BYTES=4*1024*1024;
  function utf8Bytes(value){
    var text=String(value==null?'':value);
    if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(text).length;
    try{return unescape(encodeURIComponent(text)).length}catch(error){return text.length}
  }
  function storageKeys(storage){
    var keys=[];
    try{
      for(var index=0;storage&&index<Number(storage.length||0);index++){
        var key=storage.key(index);if(key!=null)keys.push(String(key));
      }
    }catch(error){}
    return keys;
  }
  function isSimurgKey(key){return key===DATA_KEY||key.indexOf('simurg_')===0||key.indexOf('simurg-')===0;}
  function inspectStorage(storage,candidateRaw){
    var entries=[];
    storageKeys(storage).filter(isSimurgKey).forEach(function(key){
      var raw=null;try{raw=storage.getItem(key)}catch(error){}
      if(raw==null)return;
      var valueBytes=utf8Bytes(raw),keyBytes=utf8Bytes(key);
      entries.push({key:key,bytes:valueBytes,entryBytes:keyBytes+valueBytes,isBackup:BACKUP_KEYS.indexOf(key)>=0});
    });
    entries.sort(function(a,b){return b.bytes-a.bytes;});
    var canonical=entries.find(function(entry){return entry.key===DATA_KEY;});
    var backups=entries.filter(function(entry){return entry.isBackup;});
    var totalBytes=entries.reduce(function(sum,entry){return sum+entry.entryBytes;},0);
    var candidateBytes=candidateRaw==null?null:utf8Bytes(candidateRaw);
    var currentCanonicalEntryBytes=canonical?canonical.entryBytes:0;
    var projectedBytes=candidateBytes==null?totalBytes:totalBytes-currentCanonicalEntryBytes+utf8Bytes(DATA_KEY)+candidateBytes;
    var backupBytes=backups.reduce(function(sum,entry){return sum+entry.bytes;},0);
    var warningReasons=[];
    if(projectedBytes>=LARGE_FOOTPRINT_WARNING_BYTES)warningReasons.push('Simurg yerel depolama ayak izi ihtiyatlı büyük-kullanım eşiğini aşıyor. Bu eşik bir tarayıcı kotası değildir.');
    if(candidateBytes&&backupBytes>=candidateBytes)warningReasons.push('Tam-DATA yedekleri aday canonical DATA kadar veya daha fazla alan kullanıyor.');
    return {
      canonicalBytes:canonical?canonical.bytes:0,
      candidateBytes:candidateBytes,
      simurgTotalBytes:totalBytes,
      projectedSimurgTotalBytes:projectedBytes,
      keyCount:entries.length,
      backupCount:backups.length,
      backupBytes:backupBytes,
      backups:backups.map(function(entry){return {key:entry.key,bytes:entry.bytes};}),
      topKeys:entries.slice(0,5).map(function(entry){return {key:entry.key,bytes:entry.bytes};}),
      warning:warningReasons.length>0,
      warningReasons:warningReasons,
      warningIsHeuristic:true,
      indexedDb:{usedByApp:false,label:'Simurg OS canonical DATA için IndexedDB kullanmıyor.'}
    };
  }
  function diagnostics(storage,navigatorLike){
    var report=inspectStorage(storage);
    var nav=navigatorLike||(typeof navigator!=='undefined'?navigator:null);
    if(!nav||!nav.storage||typeof nav.storage.estimate!=='function')return Promise.resolve(Object.assign(report,{originEstimate:{available:false,label:'Origin düzeyi depolama tahmini kullanılamıyor; localStorage kotası için kesin bir değer değildir.'}}));
    return Promise.resolve().then(function(){return nav.storage.estimate();}).then(function(estimate){
      return Object.assign(report,{originEstimate:{available:true,usage:Number(estimate&&estimate.usage)||0,quota:Number(estimate&&estimate.quota)||0,label:'Origin düzeyi tahmin; localStorage kotasını kesin olarak göstermez.'}});
    }).catch(function(){return Object.assign(report,{originEstimate:{available:false,label:'Origin düzeyi depolama tahmini okunamadı; localStorage kotası için kesin bir değer değildir.'}});});
  }
  function failure(key,error){
    var name=String(error&&error.name||''),code=error&&error.code;
    var quota=name==='QuotaExceededError'||name==='NS_ERROR_DOM_QUOTA_REACHED'||code===22||code===1014;
    return {
      ok:false,
      key:String(key||''),
      code:quota?'quota_exceeded':'storage_unavailable',
      error:error,
      message:quota
        ?'Kayıt yapılamadı: tarayıcı depolama alanı dolu. Girdileriniz ekranda korunuyor; sayfayı kapatmayın.'
        :'Kayıt yapılamadı: tarayıcı depolaması kullanılamıyor. Girdileriniz ekranda korunuyor; sayfayı kapatmayın.'
    };
  }
  function writeRaw(storage,key,value){
    try{
      if(!storage||typeof storage.setItem!=='function')throw new Error('Storage kullanılamıyor.');
      storage.setItem(key,String(value));
      return {ok:true,key:String(key),value:String(value)};
    }catch(error){return failure(key,error)}
  }
  function writeJson(storage,key,value){
    var raw;
    try{raw=JSON.stringify(value)}catch(error){return failure(key,error)}
    return writeRaw(storage,key,raw);
  }
  function remove(storage,key){
    try{
      if(!storage||typeof storage.removeItem!=='function')throw new Error('Storage kullanılamıyor.');
      storage.removeItem(key);return {ok:true,key:String(key)};
    }catch(error){return failure(key,error)}
  }
  function requireSuccess(result){
    if(result&&result.ok)return result;
    var error=new Error(result&&result.message||'Yerel kayıt başarısız.');
    error.cause=result&&result.error;error.persistenceResult=result||failure('',error);throw error;
  }
  function notifyFailure(result,context){
    if(!result||result.ok)return result;
    var message=(context?String(context)+'\n\n':'')+result.message;
    if(typeof alert==='function')alert(message);
    return result;
  }
  function recoveryFailure(){
    return {
      ok:false,
      key:DATA_KEY,
      code:'startup_recovery_active',
      message:'Yerel DATA doğrulanamadığı için eski depolama verisi korunuyor. Geçerli bir JSON yedeği veya Cloud Pull uygulanmadan kayıt yapılmadı.'
    };
  }
  function persistData(storage,value){
    if(typeof globalThis!=='undefined'&&globalThis.__simurgStartupDataRecoveryActive)return recoveryFailure();
    var raw;
    try{raw=JSON.stringify(value)}catch(error){return failure(DATA_KEY,error)}
    var preflight=inspectStorage(storage,raw);
    var result=writeRaw(storage,DATA_KEY,raw);
    result.diagnostics=preflight;
    return result;
  }
  return {DATA_KEY:DATA_KEY,BACKUP_KEYS:BACKUP_KEYS.slice(),utf8Bytes:utf8Bytes,inspectStorage:inspectStorage,diagnostics:diagnostics,writeRaw:writeRaw,writeJson:writeJson,remove:remove,requireSuccess:requireSuccess,notifyFailure:notifyFailure,persistData:persistData};
});
