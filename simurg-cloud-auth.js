(function(){
  'use strict';

  var TABLE='simurg_user_data';
  var LOCAL_DATA_KEY='atlas_summary_reports';
  var META_PREFIX='simurg_cloud_meta:';
  var client=null;
  var authSubscription=null;
  var state={initializing:true,busy:false,session:null,operation:'',lastResult:null,cloudRevision:null};

  function byId(id){return document.getElementById(id)}
  function hasSession(){return !!(state.session&&state.session.user&&state.session.user.id)}
  function currentUserId(){return hasSession()?String(state.session.user.id):''}
  function publishAuthState(){
    var detail={signedIn:hasSession(),userId:currentUserId()};
    try{document.dispatchEvent(new CustomEvent('simurg:cloud-auth-state',{detail:detail}));}catch(error){}
  }
  function isPlainObject(value){
    if(!value||Object.prototype.toString.call(value)!=='[object Object]')return false;
    var proto=Object.getPrototypeOf(value);
    return proto===Object.prototype||proto===null;
  }
  function safeMessage(error,fallback){
    var message=error&&typeof error.message==='string'?error.message.trim():'';
    if(!message)return fallback;
    return message.replace(/[\r\n\t]+/g,' ').slice(0,180);
  }
  function maskEmail(email){
    var value=String(email||'');
    var parts=value.split('@');
    if(parts.length!==2)return 'Oturum açık';
    var local=parts[0];
    var domain=parts[1];
    var masked=local?local.charAt(0)+'***':'***';
    return masked+'@'+domain;
  }
  function formatDate(value){
    if(!value)return '-';
    var date=new Date(value);
    if(Number.isNaN(date.getTime()))return '-';
    return date.toLocaleString('tr-TR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  }
  function setText(id,value){var element=byId(id);if(element)element.textContent=String(value||'')}
  function setStatus(message,type){
    var element=byId('cloudSyncStatus');
    if(!element)return;
    element.classList.remove('ok','warn','err','conflict');
    if(type)element.classList.add(type);
    element.dataset.state=type||'ready';
    element.textContent=String(message||'');
  }
  function operationResult(operation,status,details){
    var result={operation:operation,status:status};
    if(details&&isPlainObject(details))Object.keys(details).forEach(function(key){result[key]=details[key]});
    state.lastResult=result;
    try{document.dispatchEvent(new CustomEvent('simurg:cloud-operation-result',{detail:result}));}catch(error){}
    return result;
  }
  function finishOperation(operation,status,message,type,details){
    setStatus(message,type);
    return operationResult(operation,status,details);
  }
  function setRevisionStatus(revision,updatedAt){
    state.cloudRevision=revision==null?null:{revision:Number(revision),updatedAt:updatedAt||''};
    if(revision==null){setText('cloudRevisionStatus','Bulut revizyonu: -');return}
    setText('cloudRevisionStatus','Bulut revizyonu: '+revision+' · Son güncelleme: '+formatDate(updatedAt));
  }
  function renderAuthState(){
    var signedIn=hasSession();
    var locked=state.initializing||state.busy||!signedIn;
    var signedOutPanel=byId('cloudAuthSignedOut');
    var signedInPanel=byId('cloudAuthSignedIn');
    if(signedOutPanel)signedOutPanel.hidden=signedIn;
    if(signedInPanel)signedInPanel.hidden=!signedIn;
    setText('cloudAuthState',state.initializing?'Başlatılıyor':(signedIn?'Oturum açık':'Oturum kapalı'));
    setText('cloudSignedInLabel',signedIn?maskEmail(state.session.user.email):'');
    ['cloudCheckBtn','cloudPushBtn','cloudPullBtn'].forEach(function(id){var button=byId(id);if(button)button.disabled=locked});
    var signInButton=byId('cloudSignInBtn');
    if(signInButton)signInButton.disabled=state.initializing||state.busy||signedIn;
    var signOutButton=byId('cloudSignOutBtn');
    if(signOutButton)signOutButton.disabled=state.initializing||state.busy||!signedIn;
  }
  function setBusy(operation,message){
    if(state.busy)return false;
    state.busy=true;
    state.operation=operation;
    renderAuthState();
    setStatus(message,'');
    return true;
  }
  function clearBusy(){state.busy=false;state.operation='';renderAuthState()}
  function metaKey(userId){return META_PREFIX+String(userId||'')}
  function readMeta(userId){
    if(!userId)return null;
    try{
      var raw=localStorage.getItem(metaKey(userId));
      if(!raw)return null;
      var value=JSON.parse(raw);
      if(!isPlainObject(value))return null;
      var revision=Number(value.revision);
      if(!Number.isInteger(revision)||revision<1)return null;
      return {
        revision:revision,
        updatedAt:typeof value.updatedAt==='string'?value.updatedAt:'',
        lastPullAt:typeof value.lastPullAt==='string'?value.lastPullAt:'',
        lastPushAt:typeof value.lastPushAt==='string'?value.lastPushAt:''
      };
    }catch(error){return null}
  }
  function writeMeta(userId,next){
    if(!userId||!isPlainObject(next))return;
    var revision=Number(next.revision);
    if(!Number.isInteger(revision)||revision<1)return;
    var safe={
      revision:revision,
      updatedAt:typeof next.updatedAt==='string'?next.updatedAt:'',
      lastPullAt:typeof next.lastPullAt==='string'?next.lastPullAt:'',
      lastPushAt:typeof next.lastPushAt==='string'?next.lastPushAt:''
    };
    return window.SimurgPersistence.requireSuccess(window.SimurgPersistence.writeJson(localStorage,metaKey(userId),safe));
  }
  function tryWriteMeta(userId,next){
    try{return {ok:true,result:writeMeta(userId,next)}}
    catch(error){return {ok:false,error:error,persistenceResult:error&&error.persistenceResult?error.persistenceResult:null}}
  }
  function metadataWarning(action,error){
    var detail=safeMessage(error,'Tarayıcı depolaması kullanılamıyor.');
    return action+' tamamlandı; ancak yerel revizyon bilgisi kaydedilemedi. '+detail+' Otomatik yeniden deneme yapılmadı.';
  }
  function clearMeta(userId){if(userId)window.SimurgPersistence.remove(localStorage,metaKey(userId))}
  function currentData(){return typeof DATA!=='undefined'?DATA:null}
  function requireCurrentData(){
    var value=currentData();
    if(!isPlainObject(value))throw new Error('Yerel DATA geçerli bir nesne değil.');
    if(!window.SimurgDataValidation)throw new Error('DATA doğrulayıcı yüklenemedi.');
    var legacy=window.SimurgDataValidation.prepareFull(value,{source:'authenticated-cloud-push',canonicalizeExercises:false}).data;
    var prepared=window.SimurgDataValidation.prepareFull(legacy,{source:'authenticated-cloud-push'});
    if(prepared.canonicalizationReport&&prepared.canonicalizationReport.changed){
      if(!window.SimurgExerciseCanonicalization)throw new Error('Egzersiz migration katmanı yüklenemedi.');
      var persisted=window.SimurgExerciseCanonicalization.persistWithBackup(localStorage,legacy,prepared.data,window.SimurgPersistence,'authenticated-cloud-push');
      if(!persisted.ok)throw persisted.error||new Error('Egzersiz migration yedeği oluşturulamadı.');
      DATA=prepared.data;
      if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate('exercise-canonicalization-cloud-push');
    }
    return prepared.data;
  }
  function preparePulledData(value){
    if(!window.SimurgDataValidation)throw new Error('DATA doğrulayıcı yüklenemedi.');
    var legacy=window.SimurgDataValidation.prepareFull(value,{source:'authenticated-cloud-pull',legacyAppleWatchRpe:true,canonicalizeExercises:false}).data;
    var prepared=window.SimurgDataValidation.prepareFull(legacy,{source:'authenticated-cloud-pull',legacyAppleWatchRpe:true});
    return {data:prepared.data,legacyData:legacy,canonicalizationReport:prepared.canonicalizationReport};
  }
  function normalizePulledData(value){return preparePulledData(value).data}
  function downloadLocalBackup(value){
    var stamp=new Date().toISOString().replace(/[:.]/g,'-');
    var blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;
    link.download='simurg-local-before-cloud-pull-'+stamp+'.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},0);
  }
  function persistPulledData(value,migrationOriginal,migrationReport){
    var previousData=DATA;
    var previousRaw=localStorage.getItem(LOCAL_DATA_KEY);
    try{
      if(migrationReport&&migrationReport.changed){
        if(!window.SimurgExerciseCanonicalization)throw new Error('Egzersiz migration katmanı yüklenemedi.');
        var migrated=window.SimurgExerciseCanonicalization.persistWithBackup(localStorage,migrationOriginal,value,window.SimurgPersistence,'authenticated-cloud-pull');
        if(!migrated.ok)throw migrated.error||new Error('Egzersiz migration yedeği oluşturulamadı.');
      }else window.SimurgPersistence.requireSuccess(window.SimurgPersistence.persistData(localStorage,value));
      DATA=value;
      if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate('cloud-pull');
      if(typeof render==='function')render();
      if(typeof window.renderDataLocalStatus==='function')window.renderDataLocalStatus();
    }catch(error){
      DATA=previousData;
      if(previousRaw===null)window.SimurgPersistence.remove(localStorage,LOCAL_DATA_KEY);
      else window.SimurgPersistence.writeRaw(localStorage,LOCAL_DATA_KEY,previousRaw);
      try{if(typeof render==='function')render();}catch(rollbackError){}
      throw error;
    }
  }
  function getClient(){
    if(client)return client;
    if(!window.supabase||typeof window.supabase.createClient!=='function')throw new Error('Supabase istemcisi yüklenemedi.');
    if(typeof SIMURG_SUPABASE_URL==='undefined'||typeof SIMURG_SUPABASE_KEY==='undefined')throw new Error('Supabase yapılandırması bulunamadı.');
    client=window.supabase.createClient(SIMURG_SUPABASE_URL,SIMURG_SUPABASE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    return client;
  }
  async function requireSession(){
    if(!hasSession())throw new Error('Önce oturum açın.');
    return {client:getClient(),session:state.session,userId:currentUserId()};
  }
  async function getSession(){
    if(state.session)return state.session;
    var result=await getClient().auth.getSession();
    if(result.error)throw result.error;
    return result.data&&result.data.session?result.data.session:null;
  }
  async function signInToCloud(){
    if(!setBusy('sign-in','Giriş yapılıyor…'))return;
    var emailInput=byId('cloudAuthEmail');
    var passwordInput=byId('cloudAuthPassword');
    var email=emailInput?emailInput.value.trim():'';
    var password=passwordInput?passwordInput.value:'';
    try{
      if(!email||!password)throw new Error('E-posta ve parola gerekli.');
      var result=await getClient().auth.signInWithPassword({email:email,password:password});
      if(result.error)throw result.error;
      if(!result.data||!result.data.session)throw new Error('Oturum oluşturulamadı.');
      state.session=result.data.session;
      publishAuthState();
      setRevisionStatus(null,'');
      setStatus('Oturum açık. Bulut işlemleri yalnızca açık komutla çalışır.','ok');
    }catch(error){
      state.session=null;
      publishAuthState();
      setStatus('Giriş başarısız: '+safeMessage(error,'Kimlik bilgilerini kontrol edin.'),'err');
    }finally{
      if(passwordInput)passwordInput.value='';
      clearBusy();
    }
  }
  async function signOutFromCloud(){
    if(!setBusy('sign-out','Çıkış yapılıyor…'))return;
    var userId=currentUserId();
    try{
      var result=await getClient().auth.signOut();
      if(result.error)throw result.error;
      clearMeta(userId);
      state.session=null;
      setRevisionStatus(null,'');
      setStatus('Oturum kapalı. Yerel veriler korunuyor.','');
    }catch(error){
      setStatus('Çıkış başarısız: '+safeMessage(error,'Tekrar deneyin.'),'err');
    }finally{clearBusy()}
  }
  async function checkUserCloudStatus(){
    if(!setBusy('check','Bulut kontrol ediliyor…'))return;
    try{
      var context=await requireSession();
      var result=await context.client.from(TABLE)
        .select('revision,updated_at')
        .eq('user_id',context.userId)
        .maybeSingle();
      if(result.error)throw result.error;
      if(!result.data){
        setRevisionStatus(null,'');
        setStatus('Bulutta henüz veri yok.','ok');
        return;
      }
      setRevisionStatus(result.data.revision,result.data.updated_at);
      setStatus('Bulut kaydı bulundu. Göndermek için geçerli bir Pull/Push tabanı gerekir.','ok');
    }catch(error){setStatus('Bulut kontrolü başarısız: '+safeMessage(error,'Tekrar deneyin.'),'err')}
    finally{clearBusy()}
  }
  async function pushUserData(){
    if(!setBusy('push','Buluta gönderim hazırlanıyor…'))return operationResult('push','busy');
    var stage='local_preparation';
    try{
      var context=await requireSession();
      var localData=requireCurrentData();
      stage='remote';
      var lookup=await context.client.from(TABLE)
        .select('revision,updated_at')
        .eq('user_id',context.userId)
        .maybeSingle();
      if(lookup.error)throw lookup.error;
      if(!lookup.data){
        if(!window.confirm('Bu hesap için ilk bulut kaydı oluşturulacak. Yerel veriyi açıkça Buluta Göndermek istiyor musunuz?')){
          return finishOperation('push','cancelled','Gönderim iptal edildi.','');
        }
        setStatus('Gönderiliyor…','');
        var inserted=await context.client.from(TABLE)
          .insert({user_id:context.userId,payload:localData})
          .select('revision,updated_at');
        if(inserted.error){
          if(inserted.error.code==='23505'){
            return finishOperation('push','conflict','Bulut kaydı başka bir cihazda oluşturulmuş. Önce Buluttan Al.','conflict');
          }
          throw inserted.error;
        }
        if(!Array.isArray(inserted.data)||inserted.data.length!==1)throw new Error('İlk bulut kaydı doğrulanamadı.');
        var first=inserted.data[0];
        setRevisionStatus(first.revision,first.updated_at);
        var firstMeta=tryWriteMeta(context.userId,{revision:first.revision,updatedAt:first.updated_at,lastPullAt:'',lastPushAt:new Date().toISOString()});
        if(!firstMeta.ok)return finishOperation('push','success_with_local_metadata_warning',metadataWarning('İlk bulut kaydı oluşturma',firstMeta.error)+' Yeniden Push yapmadan önce Buluttan Al ile yerel tabanı yenileyin.','warn',{revision:first.revision,updatedAt:first.updated_at,metadataPersisted:false});
        return finishOperation('push','success','Güncel: ilk bulut kaydı oluşturuldu.','ok',{revision:first.revision,updatedAt:first.updated_at,metadataPersisted:true});
      }
      var meta=readMeta(context.userId);
      if(!meta){
        setRevisionStatus(lookup.data.revision,lookup.data.updated_at);
        return finishOperation('push','conflict','Bu bulut kaydı için geçerli yerel taban yok. Önce Buluttan Al.','conflict');
      }
      if(!window.confirm('Yerel DATA, beklenen revizyon '+meta.revision+' üzerinden buluta gönderilecek. Devam edilsin mi?')){
        return finishOperation('push','cancelled','Gönderim iptal edildi.','');
      }
      setStatus('Gönderiliyor…','');
      var updated=await context.client.from(TABLE)
        .update({payload:localData,revision:meta.revision+1})
        .eq('user_id',context.userId)
        .eq('revision',meta.revision)
        .select('revision,updated_at');
      if(updated.error)throw updated.error;
      if(!Array.isArray(updated.data)||updated.data.length===0){
        return finishOperation('push','conflict','Buluttaki veri başka bir cihazda güncellenmiş. Önce Buluttan Al veya yerel yedek oluştur.','conflict');
      }
      if(updated.data.length!==1)throw new Error('Bulut güncelleme sonucu doğrulanamadı.');
      var row=updated.data[0];
      setRevisionStatus(row.revision,row.updated_at);
      var updatedMeta=tryWriteMeta(context.userId,{revision:row.revision,updatedAt:row.updated_at,lastPullAt:meta.lastPullAt,lastPushAt:new Date().toISOString()});
      if(!updatedMeta.ok)return finishOperation('push','success_with_local_metadata_warning',metadataWarning('Buluta gönderim',updatedMeta.error)+' Yeniden Push yapmadan önce Buluttan Al ile yerel tabanı yenileyin.','warn',{revision:row.revision,updatedAt:row.updated_at,metadataPersisted:false});
      return finishOperation('push','success','Güncel: yerel veri güvenli biçimde buluta gönderildi.','ok',{revision:row.revision,updatedAt:row.updated_at,metadataPersisted:true});
    }catch(error){return finishOperation('push',stage==='remote'?'remote_failure':'local_preparation_failure',(stage==='remote'?'Gönderim başarısız: ':'Yerel veri gönderime hazırlanamadı: ')+safeMessage(error,'Tekrar deneyin.'),'err',{metadataPersisted:false})}
    finally{clearBusy()}
  }
  async function pullUserData(){
    if(!setBusy('pull','Buluttan veri kontrol ediliyor…'))return operationResult('pull','busy');
    var stage='remote';
    try{
      var context=await requireSession();
      var result=await context.client.from(TABLE)
        .select('payload,revision,updated_at')
        .eq('user_id',context.userId)
        .maybeSingle();
      if(result.error)throw result.error;
      if(!result.data){
        setRevisionStatus(null,'');
        return finishOperation('pull','no_remote_data','Bulutta henüz veri yok.','ok');
      }
      stage='validation';
      var pulledPrepared=preparePulledData(result.data.payload),pulled=pulledPrepared.data;
      setRevisionStatus(result.data.revision,result.data.updated_at);
      if(!window.confirm('Buluttan Al, mevcut yerel DATA verisini değiştirecek. Önce otomatik JSON yedeği indirilecek. Devam edilsin mi?')){
        return finishOperation('pull','cancelled','Alım iptal edildi. Yerel veri değiştirilmedi.','');
      }
      setStatus('Alınıyor… Yerel yedek hazırlanıyor.','');
      stage='local_preparation';
      var oldData=requireCurrentData();
      stage='backup';
      downloadLocalBackup(oldData);
      stage='data_application';
      persistPulledData(pulled,pulledPrepared.legacyData,pulledPrepared.canonicalizationReport);
      stage='metadata';
      var pulledMeta=tryWriteMeta(context.userId,{revision:result.data.revision,updatedAt:result.data.updated_at,lastPullAt:new Date().toISOString(),lastPushAt:''});
      if(!pulledMeta.ok)return finishOperation('pull','success_with_local_metadata_warning',metadataWarning('Buluttan alım',pulledMeta.error)+' Uygulanan DATA korunuyor; depolama sorununu giderdikten sonra gerekirse Pull işlemini açıkça yeniden başlatın.','warn',{revision:result.data.revision,updatedAt:result.data.updated_at,metadataPersisted:false,dataApplied:true});
      return finishOperation('pull','success','Güncel: bulut verisi alındı ve yerel yedek indirildi.','ok',{revision:result.data.revision,updatedAt:result.data.updated_at,metadataPersisted:true,dataApplied:true});
    }catch(error){
      var validationFailed=stage==='validation';
      var applicationFailed=stage==='data_application';
      var localPreparationFailed=stage==='local_preparation'||stage==='backup';
      var message=validationFailed?'Bulut verisi doğrulanamadı: '+safeMessage(error,'Yerel DATA değiştirilmedi.'):(applicationFailed?'Alım uygulanamadı: '+safeMessage(error,'Yerel DATA güvenli biçimde geri alındı.'):(localPreparationFailed?'Yerel alım hazırlığı başarısız: '+safeMessage(error,'Yerel DATA değiştirilmedi.'):'Alım başarısız: '+safeMessage(error,'Yerel veri değiştirilmedi.')));
      return finishOperation('pull',validationFailed?'validation_failure':(applicationFailed?'data_application_failure':(localPreparationFailed?'local_preparation_failure':'remote_failure')),message,'err',{metadataPersisted:false,dataApplied:false});
    }
    finally{clearBusy()}
  }
  function bindControls(){
    var bindings=[
      ['cloudSignInBtn',signInToCloud],
      ['cloudSignOutBtn',signOutFromCloud],
      ['cloudCheckBtn',checkUserCloudStatus],
      ['cloudPushBtn',pushUserData],
      ['cloudPullBtn',pullUserData]
    ];
    bindings.forEach(function(pair){var element=byId(pair[0]);if(element)element.addEventListener('click',pair[1])});
    var password=byId('cloudAuthPassword');
    if(password)password.addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();signInToCloud()}});
  }
  async function initialize(){
    bindControls();
    renderAuthState();
    setStatus('Başlatılıyor…','');
    try{
      var authClient=getClient();
      var sessionResult=await authClient.auth.getSession();
      if(sessionResult.error)throw sessionResult.error;
      state.session=sessionResult.data&&sessionResult.data.session?sessionResult.data.session:null;
      var listener=authClient.auth.onAuthStateChange(function(event,session){
        var previousUser=currentUserId();
        state.session=session||null;
        if(event==='SIGNED_OUT'){
          clearMeta(previousUser);
          setRevisionStatus(null,'');
          setStatus('Oturum kapalı. Yerel veriler korunuyor.','');
        }
        renderAuthState();
        publishAuthState();
      });
      authSubscription=listener&&listener.data?listener.data.subscription:null;
      state.initializing=false;
      renderAuthState();
      publishAuthState();
      if(hasSession())setStatus('Hazır: Oturum açık. Push ve Pull yalnızca açık komutla çalışır.','ok');
      else setStatus('Oturum kapalı. Bulut işlemleri devre dışı.','');
    }catch(error){
      state.initializing=false;
      state.session=null;
      renderAuthState();
      publishAuthState();
      setStatus('Hata: '+safeMessage(error,'Bulut kimlik doğrulaması başlatılamadı.'),'err');
    }
  }

  window.signInToCloud=signInToCloud;
  window.signOutFromCloud=signOutFromCloud;
  window.checkUserCloudStatus=checkUserCloudStatus;
  window.pushUserData=pushUserData;
  window.pullUserData=pullUserData;
  window.SimurgCloudAuth={initialize:initialize,getClient:getClient,getSession:getSession,getLastOperationResult:function(){return state.lastResult}};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
