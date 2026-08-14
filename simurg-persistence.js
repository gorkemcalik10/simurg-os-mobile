(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPersistence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DATA_KEY='atlas_summary_reports';
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
  function persistData(storage,value){return writeJson(storage,DATA_KEY,value)}
  return {DATA_KEY:DATA_KEY,writeRaw:writeRaw,writeJson:writeJson,remove:remove,requireSuccess:requireSuccess,notifyFailure:notifyFailure,persistData:persistData};
});
