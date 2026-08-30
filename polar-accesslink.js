(function(){
  'use strict';
  var CAPABILITY_KEY='simurg_polar_accesslink_client_v1';
  var state={busy:false,status:'loading',lastSyncAt:null,errorMessage:'',message:'Polar bağlantı durumu kontrol ediliyor.',counts:{workouts:0,activity:0,profile:0,sleep:0,nightlyRecharge:0,continuousHr:0,cardioLoad:0},statuses:{}};
  var sectionObserver=null,observedSection=null,statusLoaded=false;

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function root(){try{if(typeof window.simurgGetData==='function')return window.simurgGetData();}catch(e){}try{return DATA;}catch(e){return window.simurgData||{};}}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function endpoint(name){var base='';try{base=SIMURG_SUPABASE_URL;}catch(e){}return String(base||'').replace(/\/$/,'')+'/functions/v1/'+name;}
  function apiKey(){try{return SIMURG_SUPABASE_KEY||'';}catch(e){return '';}}
  function cloneData(value){return JSON.parse(JSON.stringify(value));}
  function persistCandidate(candidate){
    if(typeof window.simurgPersistCandidateData==='function')return window.simurgPersistCandidateData(candidate);
    return window.SimurgPersistence.persistData(localStorage,candidate);
  }
  function commitInPlace(target,candidate){
    Object.keys(target).forEach(function(key){delete target[key];});
    Object.keys(candidate).forEach(function(key){target[key]=candidate[key];});
    return target;
  }
  function syncStateFrom(data){
    var connection=data&&data.polarConnection||{};
    state.status=connection.status||state.status;state.lastSyncAt=connection.lastSyncAt||null;state.errorMessage=connection.lastError||'';state.counts=connection.lastCounts||state.counts;state.statuses=connection.lastStatuses||{};
  }
  function base64Url(bytes){var binary='';bytes.forEach(function(value){binary+=String.fromCharCode(value);});return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();var bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;var hex=Array.from(bytes).map(function(v){return v.toString(16).padStart(2,'0');}).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);}
  function capability(create){
    try{var parsed=JSON.parse(localStorage.getItem(CAPABILITY_KEY)||'null');if(parsed&&parsed.clientId&&parsed.clientKey)return parsed;}catch(e){}
    if(!create)return null;
    var bytes=new Uint8Array(32);crypto.getRandomValues(bytes);var value={clientId:uuid(),clientKey:base64Url(bytes)};
    window.SimurgPersistence.requireSuccess(window.SimurgPersistence.writeJson(localStorage,CAPABILITY_KEY,value));return value;
  }
  function ensureStores(value){
    var data=value||root();if(!data||typeof data!=='object')return data;
    if(!data.polarWorkouts||Array.isArray(data.polarWorkouts))data.polarWorkouts={daily:{},latest:null};
    if(!data.polarWorkouts.daily||Array.isArray(data.polarWorkouts.daily))data.polarWorkouts.daily={};
    if(!data.polarActivity||Array.isArray(data.polarActivity))data.polarActivity={daily:{},latest:null};
    if(!data.polarActivity.daily||Array.isArray(data.polarActivity.daily))data.polarActivity.daily={};
    if(!data.polarProfile||Array.isArray(data.polarProfile))data.polarProfile={latest:null};
    ['polarSleep','polarNightlyRecharge','polarContinuousHr','polarCardioLoad'].forEach(function(key){
      if(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key]))data[key]={daily:{},latest:null,lastSyncAt:null,lastError:null};
      if(!data[key].daily||typeof data[key].daily!=='object'||Array.isArray(data[key].daily))data[key].daily={};
      if(!Object.prototype.hasOwnProperty.call(data[key],'latest'))data[key].latest=null;
      if(!Object.prototype.hasOwnProperty.call(data[key],'lastSyncAt'))data[key].lastSyncAt=null;
      if(!Object.prototype.hasOwnProperty.call(data[key],'lastError'))data[key].lastError=null;
    });
    if(!data.polarConnection||typeof data.polarConnection!=='object'||Array.isArray(data.polarConnection))data.polarConnection={connected:false,status:'disconnected',lastSyncAt:null,lastError:null,source:'Polar AccessLink'};
    return data;
  }
  async function cloudSession(){
    if(!window.SimurgCloudAuth||typeof window.SimurgCloudAuth.getSession!=='function')return null;
    return window.SimurgCloudAuth.getSession();
  }
  async function headers(includeJson){
    var key=apiKey(),session=await cloudSession(),token=session&&session.access_token;
    if(!token){var authError=new Error('Polar bağlantısı için önce Simurg Cloud oturumu açın.');authError.code='signed_out';throw authError;}
    var cap=capability(false),value={'apikey':key,'Authorization':'Bearer '+token};
    if(includeJson)value['Content-Type']='application/json';
    if(cap){value['X-Simurg-Polar-Client']=cap.clientId;value['X-Simurg-Polar-Key']=cap.clientKey;}
    return value;
  }
  async function request(name,method,body){
    var response=await fetch(endpoint(name),{method:method||'GET',headers:await headers(body!==undefined),body:body===undefined?undefined:JSON.stringify(body)});
    var payload=await response.json().catch(function(){return {ok:false,message:'Sunucu yanıtı okunamadı.'};});
    if(!response.ok){var error=new Error(payload.message||('Polar isteği başarısız ('+response.status+').'));error.code=payload.error||('http_'+response.status);throw error;}
    return payload;
  }
  function formatDateTime(value){
    if(!value)return 'Henüz senkronize edilmedi';var date=new Date(value);if(isNaN(date))return value;
    return date.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function normalizedCounts(counts){
    counts=counts||{};return {workouts:Number(counts.workouts||0),activity:Number(counts.activity!=null?counts.activity:counts.activities||0),profile:Number(counts.profile||0),sleep:Number(counts.sleep||0),nightlyRecharge:Number(counts.nightlyRecharge||0),continuousHr:Number(counts.continuousHr||0),cardioLoad:Number(counts.cardioLoad||0)};
  }
  function applyLocalConnection(data,connection,counts,statuses,errors){
    data=ensureStores(data);if(!data||!connection)return data;
    var status=connection.status||(connection.connected===false?'disconnected':'connected'),connected=connection.connected!=null?!!connection.connected:status==='connected';
    var previous=data.polarConnection&&typeof data.polarConnection==='object'?data.polarConnection:{};
    var nextCounts=normalizedCounts(counts||connection.lastCounts||previous.lastCounts||state.counts);
    var nextStatuses=statuses||connection.lastStatuses||previous.lastStatuses||state.statuses||{};
    data.polarConnection=Object.assign({},previous,{
      connected:connected,
      status:status,
      lastSyncAt:connection.lastSyncAt||previous.lastSyncAt||null,
      lastError:connection.errorMessage||connection.lastError||null,
      source:'Polar AccessLink',
      polarUserId:connection.polarUserId||previous.polarUserId||null,
      connectedAt:connection.connectedAt||previous.connectedAt||null,
      tokenExpiresAt:connection.tokenExpiresAt||previous.tokenExpiresAt||null,
      lastCounts:nextCounts,
      lastStatuses:Object.assign({},nextStatuses),
      lastCategoryErrors:Object.assign({},errors||connection.lastCategoryErrors||previous.lastCategoryErrors||{})
    });
    return data;
  }
  async function updateLocalConnection(connection,counts,statuses,errors){
    var live=root();if(!live||typeof live!=='object'||!connection)return {ok:true,skipped:true};
    var candidate;
    try{candidate=cloneData(live);applyLocalConnection(candidate,connection,counts,statuses,errors);}catch(error){return {ok:false,code:'candidate_merge_failed',error:error,message:error.message||'Polar bağlantı durumu hazırlanamadı.'};}
    var result=await persistCandidate(candidate);
    if(!result.ok)return result;
    commitInPlace(live,candidate);syncStateFrom(live);return result;
  }
  function newestWorkout(daily){
    var all=[];Object.keys(daily||{}).forEach(function(date){var value=daily[date];(Array.isArray(value)?value:[value]).filter(Boolean).forEach(function(item){all.push(item);});});
    all.sort(function(a,b){return (String(a.date||'')+'T'+String(a.startTime||'')).localeCompare(String(b.date||'')+'T'+String(b.startTime||''));});return all.length?all[all.length-1]:null;
  }
  function samePolarWorkout(a,b){
    if(window.SimurgPolarWorkoutIdentity&&typeof window.SimurgPolarWorkoutIdentity.same==='function')return window.SimurgPolarWorkoutIdentity.same(a,b);
    function stable(row){row=row||{};var raw=row.raw||{};return String(row.polarExerciseId||row.exerciseId||row.exercise_id||row.polarId||raw.id||'').trim();}
    function fallback(row){row=row||{};return [row.date||'',row.startTime||row.start_time||'',row.durationSeconds||row.durationMinutes||row.duration||'',String(row.workoutType||row.activityType||row.sport||row.type||'').toLowerCase()].join('|');}
    var aId=stable(a),bId=stable(b);return aId&&bId?aId===bId:fallback(a)===fallback(b);
  }
  function newestDaily(daily){var dates=Object.keys(daily||{}).filter(Boolean).sort();return dates.length?daily[dates[dates.length-1]]:null;}
  function mergeDailyStore(store,records,lastSyncAt,status,error){
    (Array.isArray(records)?records:[]).forEach(function(record){if(record&&record.date)store.daily[record.date]=Object.assign({},store.daily[record.date]||{},record);});
    store.latest=newestDaily(store.daily)||store.latest||null;
    store.lastSyncAt=lastSyncAt||store.lastSyncAt||null;
    store.lastError=error||(status==='forbidden'?'Bu Polar hesabında kullanılamıyor.':status==='error'?'Polar uç noktası hata döndürdü.':null);
  }
  async function mergeSync(payload){
    var live=root();if(!live||typeof live!=='object')return {ok:false,code:'missing_data',message:'Yerel DATA kullanılamıyor.'};
    var data;
    try{data=ensureStores(cloneData(live));}catch(error){return {ok:false,code:'candidate_clone_failed',error:error,message:'Polar verileri güvenli bir aday kopyaya hazırlanamadı.'};}
    var workouts=Array.isArray(payload.workouts)?payload.workouts:[];
    var activities=Array.isArray(payload.activity)?payload.activity:(Array.isArray(payload.activities)?payload.activities:[]);
    var counts=payload.counts||{workouts:workouts.length,activity:activities.length,profile:payload.profile?1:0};
    var statuses=payload.statuses||{},errors=payload.errors||{},lastSyncAt=payload.lastSyncAt||new Date().toISOString();
    workouts.forEach(function(workout){
      if(!workout||!workout.date)return;var current=data.polarWorkouts.daily[workout.date];var list=Array.isArray(current)?current.slice():(current?[current]:[]);
      var normalizedWorkout=Object.assign({},workout,{type:'polar_flow_workout',source:'Polar Flow'});
      var index=list.findIndex(function(item){return samePolarWorkout(item,normalizedWorkout);});
      if(index>=0)list[index]=Object.assign({},list[index],normalizedWorkout);else list.push(normalizedWorkout);
      list.sort(function(a,b){return String(a.startTime||'').localeCompare(String(b.startTime||''));});data.polarWorkouts.daily[workout.date]=list;
    });
    data.polarWorkouts.latest=newestWorkout(data.polarWorkouts.daily)||data.polarWorkouts.latest||null;
    activities.forEach(function(activity){if(activity&&activity.date)data.polarActivity.daily[activity.date]=Object.assign({},data.polarActivity.daily[activity.date]||{},activity);});
    var activityDates=Object.keys(data.polarActivity.daily).sort();if(activityDates.length)data.polarActivity.latest=data.polarActivity.daily[activityDates[activityDates.length-1]];
    if(payload.profile)data.polarProfile.latest=Object.assign({},data.polarProfile.latest||{},payload.profile);
    mergeDailyStore(data.polarSleep,payload.sleep,lastSyncAt,statuses.sleep,errors.sleep);
    mergeDailyStore(data.polarNightlyRecharge,payload.nightlyRecharge,lastSyncAt,statuses.nightlyRecharge,errors.nightlyRecharge);
    mergeDailyStore(data.polarContinuousHr,payload.continuousHr,lastSyncAt,statuses.continuousHr,errors.continuousHr);
    mergeDailyStore(data.polarCardioLoad,payload.cardioLoad,lastSyncAt,statuses.cardioLoad,errors.cardioLoad);
    var connection=payload.connection||{connected:payload.connected!==false,status:payload.connected===false?'disconnected':'connected',lastSyncAt:payload.lastSyncAt||new Date().toISOString(),errorMessage:(payload.warnings||[]).join(' ')||null};
    applyLocalConnection(data,connection,counts,statuses,errors);
    var result=await persistCandidate(data);
    if(!result.ok)return result;
    commitInPlace(live,data);syncStateFrom(live);
    try{if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate('polar-sync');}catch(error){console.warn('Simurg OS: Polar sync signal cache invalidation failed.',error);}
    return result;
  }
  function polarPersistenceError(result){
    var detail=result&&result.code==='quota_exceeded'?'Tarayıcı depolama alanı dolu; canlı yerel DATA değiştirilmedi.':result&&result.code==='storage_unavailable'?'Tarayıcı depolaması kullanılamıyor; canlı yerel DATA değiştirilmedi.':result&&result.message?String(result.message):'Yerel tarayıcı depolamasına yazılamadı.';
    var error=new Error('Polar verileri yerel olarak güvenle kaydedilemedi; senkronizasyon sonlandırılmadı. '+detail);
    error.code=result&&result.code||'polar_persistence_failed';error.persistenceResult=result;return error;
  }
  function categoryValue(key,counts,statuses){
    var status=statuses&&statuses[key];
    if(key==='profile')return status==='forbidden'?'kullanılamıyor':status==='error'?'hata':Number(counts.profile||0)>0?'mevcut':'eksik';
    if(status==='forbidden')return 'kullanılamıyor';
    if(status==='no_data')return 'veri yok';
    if(status==='error')return 'hata';
    return String(Number(counts[key]||0));
  }
  function publishSyncState(){
    var snapshot={
      busy:!!state.busy,
      status:state.status||'disconnected',
      lastSyncAt:state.lastSyncAt||null,
      message:state.message||'',
      errorMessage:state.errorMessage||''
    };
    window.simurgPolarSyncState=snapshot;
    try{document.dispatchEvent(new CustomEvent('simurg:polar-sync-state',{detail:snapshot}));}catch(e){}
  }
  function refreshExistingViews(){
    try{
      if(typeof render==='function'){render();return;}
      if(window.SimurgPremium&&typeof window.SimurgPremium.refreshAll==='function')window.SimurgPremium.refreshAll();
      if(window.SimurgDesktop&&typeof window.SimurgDesktop.dataChanged==='function')window.SimurgDesktop.dataChanged();
    }catch(e){}
  }
  function cardHtml(){
    var data=ensureStores(),connection=data&&data.polarConnection||{},status=state.status||'loading',connected=status==='connected',checking=status==='loading';
    var counts=state.counts||connection.lastCounts||normalizedCounts({}),statuses=state.statuses||connection.lastStatuses||{};
    var statusText=state.busy?'İşleniyor':checking?'Kontrol ediliyor':connected?'Bağlandı':status==='signed_out'?'Oturum gerekli':status==='error'?'Hata':'Bağlı değil';
    var message=state.message||(checking?'Polar bağlantı durumu kontrol ediliyor.':connected?'Polar AccessLink manuel senkronizasyonu hazır.':'Polar hesabını bağlayarak egzersiz ve aktivite verilerini API üzerinden çek.');
    var error=state.errorMessage||connection.lastError||connection.errorMessage||'';
    return '<div class="polarAccessLinkHead"><div><small>POLAR ACCESSLINK · V2</small><h2>Polar Flow Bağlantısı</h2></div><span class="polarAccessLinkStatus '+esc(status)+'">'+esc(statusText)+'</span></div>'+
      '<p>'+esc(message)+'</p>'+
      (connected?'<div class="polarAccessLinkDebug"><div class="wide"><small>Son senkronizasyon</small><b>'+esc(formatDateTime(state.lastSyncAt||connection.lastSyncAt))+'</b></div><div><small>Antrenman</small><b>'+esc(categoryValue('workouts',counts,statuses))+'</b></div><div><small>Aktivite</small><b>'+esc(categoryValue('activity',counts,statuses))+'</b></div><div><small>Profil</small><b>'+esc(categoryValue('profile',counts,statuses))+'</b></div><div><small>Uyku</small><b>'+esc(categoryValue('sleep',counts,statuses))+'</b></div><div><small>Gece Toparlanması</small><b>'+esc(categoryValue('nightlyRecharge',counts,statuses))+'</b></div><div><small>Sürekli HR</small><b>'+esc(categoryValue('continuousHr',counts,statuses))+'</b></div><div><small>Kardiyo Yükü</small><b>'+esc(categoryValue('cardioLoad',counts,statuses))+'</b></div></div>':'')+
      '<div class="polarAccessLinkActions">'+(connected?'<button type="button" onclick="simurgPolarSyncNow()" '+(state.busy?'disabled':'')+'>Şimdi Senkronize Et</button><button class="secondary" type="button" onclick="simurgPolarDisconnect()" '+(state.busy?'disabled':'')+'>Bağlantıyı Kes</button>':checking?'<button type="button" disabled>Kontrol Ediliyor</button>':status==='signed_out'?'<button type="button" disabled>Önce Cloud Oturumu Aç</button>':'<button type="button" onclick="simurgPolarConnect()" '+(state.busy?'disabled':'')+'>Polar Hesabını Bağla</button>')+'</div>'+
      '<div class="polarAccessLinkNote '+(error?'error':'')+'" aria-live="polite">'+esc(error||'Polar AccessLink aktif veri kaynağı · Antrenman, aktivite, uyku, toparlanma ve yük')+'</div>';
  }
  function cardHost(){
    if(window.innerWidth<=900)return document.getElementById('mobilePolarSyncHub');
    var section=document.getElementById('polar');return section&&(section.querySelector('.polarDashboardV1')||section);
  }
  function renderCard(){
    var dashboard=cardHost();if(!dashboard)return;
    var card=document.getElementById('polarAccessLinkCard');if(!card){card=document.createElement('div');card.id='polarAccessLinkCard';card.className='polarAccessLinkCard';dashboard.insertBefore(card,dashboard.firstChild);}
    if(card.parentNode!==dashboard)dashboard.insertBefore(card,dashboard.firstChild);card.innerHTML=cardHtml();publishSyncState();
  }
  function installObserver(){
    var host=cardHost();if(!host)return false;if(observedSection===host){renderCard();return true;}
    if(sectionObserver)sectionObserver.disconnect();observedSection=host;sectionObserver=new MutationObserver(function(){if(!document.getElementById('polarAccessLinkCard'))renderCard();});sectionObserver.observe(host,{childList:true});renderCard();return true;
  }
  async function refreshStatus(){
    statusLoaded=true;
    state.status='loading';state.errorMessage='';state.message='Polar bağlantı durumu kontrol ediliyor.';renderCard();
    try{var payload=await request('polar-sync','GET');var localResult=await updateLocalConnection(payload.connection,payload.counts,payload.statuses,payload.errors);if(!localResult.ok)throw polarPersistenceError(localResult);state.status=payload.connection&&payload.connection.connected?'connected':'disconnected';state.message=state.status==='connected'?(payload.connection.claimedLegacy?'Eski Polar bağlantısı bu Simurg hesabına güvenle taşındı.':'Polar AccessLink manuel senkronizasyonu hazır.'):'Bu Simurg hesabına bağlı Polar hesabı yok.';}
    catch(error){state.status=error.code==='signed_out'||error.code==='missing_session'||error.code==='invalid_session'?'signed_out':'error';state.message=state.status==='signed_out'?'Polar bağlantısını kullanmak için Simurg Cloud oturumu açın.':'Polar bağlantı durumu doğrulanamadı.';state.errorMessage=state.status==='signed_out'?'':error.message;}
    renderCard();
  }
  window.simurgPolarConnect=async function(){
    if(state.busy)return;state.busy=true;state.errorMessage='';state.message='Polar yetkilendirme ekranı hazırlanıyor.';renderCard();
    try{var cap=capability(true),payload=await request('polar-connect','POST',{clientId:cap.clientId,clientKey:cap.clientKey});if(!payload.authorizationUrl)throw new Error('Polar authorization URL alınamadı.');window.location.assign(payload.authorizationUrl);}
    catch(error){state.busy=false;state.status=error.code==='signed_out'?'signed_out':'disconnected';state.errorMessage=error.message;state.message='Polar bağlantısı başlatılamadı.';renderCard();}
  };
  window.simurgPolarSyncNow=async function(){
    if(state.busy)return;state.busy=true;state.errorMessage='';state.message='Polar Flow verileri senkronize ediliyor.';renderCard();
    var outcome;
    try{var payload=await request('polar-sync','POST',{});var persistence=await mergeSync(payload);if(!persistence.ok)throw polarPersistenceError(persistence);var counts=payload.counts||{};state.message='Senkron tamamlandı: '+Number(counts.workouts||0)+' antrenman, '+Number(counts.activity!=null?counts.activity:counts.activities||0)+' aktivite, '+Number(counts.sleep||0)+' uyku kaydı.';state.errorMessage=(payload.warnings||[]).join(' ');outcome={ok:true,persistence:persistence,payload:payload};}
    catch(error){if(error.code==='signed_out'||error.code==='missing_session'||error.code==='invalid_session')state.status='signed_out';state.errorMessage=error.message;state.message='Polar senkronizasyonu tamamlanamadı.';outcome={ok:false,code:error.code||'polar_sync_failed',error:error,persistence:error.persistenceResult||null};}
    state.busy=false;renderCard();if(outcome.ok)refreshExistingViews();return outcome;
  };
  window.simurgPolarDisconnect=async function(){
    if(state.busy||!confirm('Polar Flow bağlantısı kesilecek. Daha önce senkronize edilen Simurg verileri korunacak. Devam edelim mi?'))return;
    state.busy=true;state.errorMessage='';state.message='Polar bağlantısı kesiliyor.';renderCard();
    try{var payload=await request('polar-disconnect','POST',{});var localResult=await updateLocalConnection(Object.assign({},payload.connection,{connected:false,status:'disconnected'}));if(!localResult.ok)throw polarPersistenceError(localResult);state.status='disconnected';state.message='Polar bağlantısı kesildi. Senkronize edilmiş veriler korundu.';}
    catch(error){state.errorMessage=error.message;state.message='Polar bağlantısı kesilemedi.';}
    state.busy=false;renderCard();
  };
  function handleOauthReturn(){
    var url=new URL(window.location.href),result=url.searchParams.get('polar');if(!result)return false;
    if(result==='connected'){state.status='loading';state.message='Polar hesabı doğrulanıyor.';}
    else{state.status='error';state.errorMessage=url.searchParams.get('polar_message')||'Polar bağlantısı tamamlanamadı.';state.message='Polar bağlantısı tamamlanamadı.';}
    url.searchParams.delete('polar');url.searchParams.delete('polar_message');history.replaceState(null,'',url.pathname+url.search+url.hash);return result==='connected';
  }
  ready(function(){
    ensureStores();var oauthReturn=handleOauthReturn();
    if(window.innerWidth>900){installObserver();setTimeout(installObserver,400);setTimeout(installObserver,1200);refreshStatus();}
    else if(oauthReturn&&typeof window.simurgV8Go==='function')window.simurgV8Go('data','menu');
  });
  document.addEventListener('simurg:cloud-auth-state',function(event){
    if(event&&event.detail&&event.detail.signedIn)refreshStatus();
    else{state.status='signed_out';state.message='Polar bağlantısını kullanmak için Simurg Cloud oturumu açın.';state.errorMessage='';renderCard();}
  });
  window.SimurgPolarAccessLink={
    mount:function(){
      if(!installObserver())return false;
      if(!statusLoaded)refreshStatus();else renderCard();
      return true;
    },
    refresh:function(){return refreshStatus();},
    state:function(){return Object.assign({},state);}
  };
})();
