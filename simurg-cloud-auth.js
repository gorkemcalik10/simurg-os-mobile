(function(){
  'use strict';

  var TABLE='simurg_user_data';
  var LOCAL_DATA_KEY='atlas_summary_reports';
  var META_PREFIX='simurg_cloud_meta:';
  var client=null;
  var authSubscription=null;
  var state={initializing:true,busy:false,session:null,operation:''};

  function byId(id){return document.getElementById(id)}
  function hasSession(){return !!(state.session&&state.session.user&&state.session.user.id)}
  function currentUserId(){return hasSession()?String(state.session.user.id):''}
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
    element.classList.remove('ok','err','conflict');
    if(type)element.classList.add(type);
    element.dataset.state=type||'ready';
    element.textContent=String(message||'');
  }
  function setRevisionStatus(revision,updatedAt){
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
    localStorage.setItem(metaKey(userId),JSON.stringify(safe));
  }
  function clearMeta(userId){if(userId)try{localStorage.removeItem(metaKey(userId))}catch(error){}}
  function currentData(){return typeof DATA!=='undefined'?DATA:null}
  function requireCurrentData(){
    var value=currentData();
    if(!isPlainObject(value))throw new Error('Yerel DATA geçerli bir nesne değil.');
    return value;
  }
  function normalizePulledData(value){
    if(!window.SimurgDataValidation)throw new Error('DATA doğrulayıcı yüklenemedi.');
    return window.SimurgDataValidation.prepareFull(value,{source:'authenticated-cloud-pull'}).data;
  }
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
  function persistPulledData(value){
    var previousData=DATA;
    var previousRaw=localStorage.getItem(LOCAL_DATA_KEY);
    try{
      DATA=value;
      localStorage.setItem(LOCAL_DATA_KEY,JSON.stringify(DATA));
      if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate('cloud-pull');
      if(typeof render==='function')render();
      if(typeof window.renderDataLocalStatus==='function')window.renderDataLocalStatus();
    }catch(error){
      DATA=previousData;
      if(previousRaw===null)localStorage.removeItem(LOCAL_DATA_KEY);
      else localStorage.setItem(LOCAL_DATA_KEY,previousRaw);
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
      setRevisionStatus(null,'');
      setStatus('Oturum açık. Bulut işlemleri yalnızca açık komutla çalışır.','ok');
    }catch(error){
      state.session=null;
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
    if(!setBusy('push','Buluta gönderim hazırlanıyor…'))return;
    try{
      var context=await requireSession();
      var localData=requireCurrentData();
      var lookup=await context.client.from(TABLE)
        .select('revision,updated_at')
        .eq('user_id',context.userId)
        .maybeSingle();
      if(lookup.error)throw lookup.error;
      if(!lookup.data){
        if(!window.confirm('Bu hesap için ilk bulut kaydı oluşturulacak. Yerel veriyi açıkça Buluta Göndermek istiyor musunuz?')){
          setStatus('Gönderim iptal edildi.','');
          return;
        }
        setStatus('Gönderiliyor…','');
        var inserted=await context.client.from(TABLE)
          .insert({user_id:context.userId,payload:localData})
          .select('revision,updated_at');
        if(inserted.error){
          if(inserted.error.code==='23505'){
            setStatus('Bulut kaydı başka bir cihazda oluşturulmuş. Önce Buluttan Al.','conflict');
            return;
          }
          throw inserted.error;
        }
        if(!Array.isArray(inserted.data)||inserted.data.length!==1)throw new Error('İlk bulut kaydı doğrulanamadı.');
        var first=inserted.data[0];
        writeMeta(context.userId,{revision:first.revision,updatedAt:first.updated_at,lastPullAt:'',lastPushAt:new Date().toISOString()});
        setRevisionStatus(first.revision,first.updated_at);
        setStatus('Güncel: ilk bulut kaydı oluşturuldu.','ok');
        return;
      }
      var meta=readMeta(context.userId);
      if(!meta){
        setRevisionStatus(lookup.data.revision,lookup.data.updated_at);
        setStatus('Bu bulut kaydı için geçerli yerel taban yok. Önce Buluttan Al.','conflict');
        return;
      }
      if(!window.confirm('Yerel DATA, beklenen revizyon '+meta.revision+' üzerinden buluta gönderilecek. Devam edilsin mi?')){
        setStatus('Gönderim iptal edildi.','');
        return;
      }
      setStatus('Gönderiliyor…','');
      var updated=await context.client.from(TABLE)
        .update({payload:localData,revision:meta.revision+1})
        .eq('user_id',context.userId)
        .eq('revision',meta.revision)
        .select('revision,updated_at');
      if(updated.error)throw updated.error;
      if(!Array.isArray(updated.data)||updated.data.length===0){
        setStatus('Buluttaki veri başka bir cihazda güncellenmiş. Önce Buluttan Al veya yerel yedek oluştur.','conflict');
        return;
      }
      if(updated.data.length!==1)throw new Error('Bulut güncelleme sonucu doğrulanamadı.');
      var row=updated.data[0];
      writeMeta(context.userId,{revision:row.revision,updatedAt:row.updated_at,lastPullAt:meta.lastPullAt,lastPushAt:new Date().toISOString()});
      setRevisionStatus(row.revision,row.updated_at);
      setStatus('Güncel: yerel veri güvenli biçimde buluta gönderildi.','ok');
    }catch(error){setStatus('Gönderim başarısız: '+safeMessage(error,'Tekrar deneyin.'),'err')}
    finally{clearBusy()}
  }
  async function pullUserData(){
    if(!setBusy('pull','Buluttan veri kontrol ediliyor…'))return;
    try{
      var context=await requireSession();
      var result=await context.client.from(TABLE)
        .select('payload,revision,updated_at')
        .eq('user_id',context.userId)
        .maybeSingle();
      if(result.error)throw result.error;
      if(!result.data){
        setRevisionStatus(null,'');
        setStatus('Bulutta henüz veri yok.','ok');
        return;
      }
      var pulled=normalizePulledData(result.data.payload);
      setRevisionStatus(result.data.revision,result.data.updated_at);
      if(!window.confirm('Buluttan Al, mevcut yerel DATA verisini değiştirecek. Önce otomatik JSON yedeği indirilecek. Devam edilsin mi?')){
        setStatus('Alım iptal edildi. Yerel veri değiştirilmedi.','');
        return;
      }
      setStatus('Alınıyor… Yerel yedek hazırlanıyor.','');
      var oldData=requireCurrentData();
      downloadLocalBackup(oldData);
      persistPulledData(pulled);
      writeMeta(context.userId,{revision:result.data.revision,updatedAt:result.data.updated_at,lastPullAt:new Date().toISOString(),lastPushAt:''});
      setStatus('Güncel: bulut verisi alındı ve yerel yedek indirildi.','ok');
    }catch(error){setStatus('Alım başarısız: '+safeMessage(error,'Yerel veri değiştirilmedi.'),'err')}
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
      });
      authSubscription=listener&&listener.data?listener.data.subscription:null;
      state.initializing=false;
      renderAuthState();
      if(hasSession())setStatus('Hazır: Oturum açık. Push ve Pull yalnızca açık komutla çalışır.','ok');
      else setStatus('Oturum kapalı. Bulut işlemleri devre dışı.','');
    }catch(error){
      state.initializing=false;
      state.session=null;
      renderAuthState();
      setStatus('Hata: '+safeMessage(error,'Bulut kimlik doğrulaması başlatılamadı.'),'err');
    }
  }

  window.signInToCloud=signInToCloud;
  window.signOutFromCloud=signOutFromCloud;
  window.checkUserCloudStatus=checkUserCloudStatus;
  window.pushUserData=pushUserData;
  window.pullUserData=pullUserData;
  window.SimurgCloudAuth={initialize:initialize,getClient:getClient};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
