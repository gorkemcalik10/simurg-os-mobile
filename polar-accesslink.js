(function(){
  'use strict';
  var CAPABILITY_KEY='simurg_polar_accesslink_client_v1';
  var state={busy:false,status:'loading',lastSyncAt:null,errorMessage:'',message:'Polar bağlantı durumu kontrol ediliyor.',counts:{workouts:0,activity:0,profile:0,sleep:0,nightlyRecharge:0,continuousHr:0,cardioLoad:0},statuses:{}};
  var sectionObserver=null,observedSection=null;

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function root(){try{if(typeof window.simurgGetData==='function')return window.simurgGetData();}catch(e){}try{return DATA;}catch(e){return window.simurgData||{};}}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function endpoint(name){var base='';try{base=SIMURG_SUPABASE_URL;}catch(e){}return String(base||'').replace(/\/$/,'')+'/functions/v1/'+name;}
  function apiKey(){try{return SIMURG_SUPABASE_KEY||'';}catch(e){return '';}}
  function persist(){
    try{if(typeof window.simurgPersistData==='function'){window.simurgPersistData();return true;}}catch(e){}
    try{if(typeof save==='function'){save();return true;}}catch(e){}
    try{localStorage.setItem('atlas_summary_reports',JSON.stringify(root()));return true;}catch(e){return false;}
  }
  function base64Url(bytes){var binary='';bytes.forEach(function(value){binary+=String.fromCharCode(value);});return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();var bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;var hex=Array.from(bytes).map(function(v){return v.toString(16).padStart(2,'0');}).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);}
  function capability(create){
    try{var parsed=JSON.parse(localStorage.getItem(CAPABILITY_KEY)||'null');if(parsed&&parsed.clientId&&parsed.clientKey)return parsed;}catch(e){}
    if(!create)return null;
    var bytes=new Uint8Array(32);crypto.getRandomValues(bytes);var value={clientId:uuid(),clientKey:base64Url(bytes)};
    localStorage.setItem(CAPABILITY_KEY,JSON.stringify(value));return value;
  }
  function ensureStores(){
    var data=root();if(!data||typeof data!=='object')return data;
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
  function headers(includeJson){
    var key=apiKey(),cap=capability(false),value={'apikey':key,'Authorization':'Bearer '+key};
    if(includeJson)value['Content-Type']='application/json';
    if(cap){value['X-Simurg-Polar-Client']=cap.clientId;value['X-Simurg-Polar-Key']=cap.clientKey;}
    return value;
  }
  async function request(name,method,body){
    var response=await fetch(endpoint(name),{method:method||'GET',headers:headers(body!==undefined),body:body===undefined?undefined:JSON.stringify(body)});
    var payload=await response.json().catch(function(){return {ok:false,message:'Sunucu yanıtı okunamadı.'};});
    if(!response.ok)throw new Error(payload.message||('Polar isteği başarısız ('+response.status+').'));
    return payload;
  }
  function formatDateTime(value){
    if(!value)return 'Henüz senkronize edilmedi';var date=new Date(value);if(isNaN(date))return value;
    return date.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function normalizedCounts(counts){
    counts=counts||{};return {workouts:Number(counts.workouts||0),activity:Number(counts.activity!=null?counts.activity:counts.activities||0),profile:Number(counts.profile||0),sleep:Number(counts.sleep||0),nightlyRecharge:Number(counts.nightlyRecharge||0),continuousHr:Number(counts.continuousHr||0),cardioLoad:Number(counts.cardioLoad||0)};
  }
  function updateLocalConnection(connection,counts,statuses,errors){
    var data=ensureStores();if(!data||!connection)return;
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
    state.status=data.polarConnection.status;state.lastSyncAt=data.polarConnection.lastSyncAt;state.errorMessage=data.polarConnection.lastError||'';state.counts=data.polarConnection.lastCounts;state.statuses=data.polarConnection.lastStatuses||{};
    persist();
  }
  function newestWorkout(daily){
    var all=[];Object.keys(daily||{}).forEach(function(date){var value=daily[date];(Array.isArray(value)?value:[value]).filter(Boolean).forEach(function(item){all.push(item);});});
    all.sort(function(a,b){return (String(a.date||'')+'T'+String(a.startTime||'')).localeCompare(String(b.date||'')+'T'+String(b.startTime||''));});return all.length?all[all.length-1]:null;
  }
  function newestDaily(daily){var dates=Object.keys(daily||{}).filter(Boolean).sort();return dates.length?daily[dates[dates.length-1]]:null;}
  function mergeDailyStore(store,records,lastSyncAt,status,error){
    (Array.isArray(records)?records:[]).forEach(function(record){if(record&&record.date)store.daily[record.date]=Object.assign({},store.daily[record.date]||{},record);});
    store.latest=newestDaily(store.daily)||store.latest||null;
    store.lastSyncAt=lastSyncAt||store.lastSyncAt||null;
    store.lastError=error||(status==='forbidden'?'Unavailable for this Polar account.':status==='error'?'Polar endpoint returned an error.':null);
  }
  function mergeSync(payload){
    var data=ensureStores();if(!data)return;
    var workouts=Array.isArray(payload.workouts)?payload.workouts:[];
    var activities=Array.isArray(payload.activity)?payload.activity:(Array.isArray(payload.activities)?payload.activities:[]);
    var counts=payload.counts||{workouts:workouts.length,activity:activities.length,profile:payload.profile?1:0};
    var statuses=payload.statuses||{},errors=payload.errors||{},lastSyncAt=payload.lastSyncAt||new Date().toISOString();
    workouts.forEach(function(workout){
      if(!workout||!workout.date)return;var current=data.polarWorkouts.daily[workout.date];var list=Array.isArray(current)?current.slice():(current?[current]:[]);
      workout.type='polar_flow_workout';workout.source='Polar Flow';
      var index=list.findIndex(function(item){return String(item&&item.startTime||'')===String(workout.startTime||'');});
      if(index>=0)list[index]=Object.assign({},list[index],workout);else list.push(workout);
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
    updateLocalConnection(connection,counts,statuses,errors);
    try{if(typeof window.renderPolarWorkout==='function')window.renderPolarWorkout();}catch(e){}
  }
  function categoryValue(key,counts,statuses){
    var status=statuses&&statuses[key];
    if(key==='profile')return status==='forbidden'?'unavailable':status==='error'?'error':Number(counts.profile||0)>0?'available':'missing';
    if(status==='forbidden')return 'unavailable';
    if(status==='no_data')return 'no data';
    if(status==='error')return 'error';
    return String(Number(counts[key]||0));
  }
  function cardHtml(){
    var data=ensureStores(),connection=data&&data.polarConnection||{},status=state.status||connection.status||'disconnected',connected=status==='connected';
    var counts=state.counts||connection.lastCounts||normalizedCounts({}),statuses=state.statuses||connection.lastStatuses||{};
    var statusText=state.busy?'İşleniyor':connected?'Bağlandı':status==='error'?'Hata':'Bağlı değil';
    var message=state.message||(connected?'Polar AccessLink manuel senkronizasyonu hazır.':'Polar hesabını bağlayarak egzersiz ve aktivite verilerini API üzerinden çek.');
    var error=state.errorMessage||connection.lastError||connection.errorMessage||'';
    return '<div class="polarAccessLinkHead"><div><small>POLAR ACCESSLINK · V2</small><h2>Polar Flow Connection</h2></div><span class="polarAccessLinkStatus '+esc(status)+'">'+esc(statusText)+'</span></div>'+
      '<p>'+esc(message)+'</p>'+
      (connected?'<div class="polarAccessLinkDebug"><div class="wide"><small>Last sync</small><b>'+esc(formatDateTime(state.lastSyncAt||connection.lastSyncAt))+'</b></div><div><small>Workout</small><b>'+esc(categoryValue('workouts',counts,statuses))+'</b></div><div><small>Activity</small><b>'+esc(categoryValue('activity',counts,statuses))+'</b></div><div><small>Profile</small><b>'+esc(categoryValue('profile',counts,statuses))+'</b></div><div><small>Sleep</small><b>'+esc(categoryValue('sleep',counts,statuses))+'</b></div><div><small>Nightly Recharge</small><b>'+esc(categoryValue('nightlyRecharge',counts,statuses))+'</b></div><div><small>Continuous HR</small><b>'+esc(categoryValue('continuousHr',counts,statuses))+'</b></div><div><small>Cardio Load</small><b>'+esc(categoryValue('cardioLoad',counts,statuses))+'</b></div></div>':'')+
      '<div class="polarAccessLinkActions">'+(connected?'<button type="button" onclick="simurgPolarSyncNow()" '+(state.busy?'disabled':'')+'>Şimdi Senkronize Et</button><button class="secondary" type="button" onclick="simurgPolarDisconnect()" '+(state.busy?'disabled':'')+'>Bağlantıyı Kes</button>':'<button type="button" onclick="simurgPolarConnect()" '+(state.busy?'disabled':'')+'>Polar Hesabını Bağla</button>')+'</div>'+
      '<div class="polarAccessLinkNote '+(error?'error':'')+'" aria-live="polite">'+esc(error||'Workout, activity, profile, sleep, recovery, continuous HR ve cardio load')+'</div>';
  }
  function renderCard(){
    var section=document.getElementById('polar');if(!section)return;var dashboard=section.querySelector('.polarDashboardV1')||section;
    var card=document.getElementById('polarAccessLinkCard');if(!card){card=document.createElement('div');card.id='polarAccessLinkCard';card.className='polarAccessLinkCard';dashboard.insertBefore(card,dashboard.firstChild);}
    if(card.parentNode!==dashboard)dashboard.insertBefore(card,dashboard.firstChild);card.innerHTML=cardHtml();
  }
  function installObserver(){
    var section=document.getElementById('polar');if(!section)return false;if(observedSection===section){renderCard();return true;}
    if(sectionObserver)sectionObserver.disconnect();observedSection=section;sectionObserver=new MutationObserver(function(){if(!document.getElementById('polarAccessLinkCard'))renderCard();});sectionObserver.observe(section,{childList:true});renderCard();return true;
  }
  async function refreshStatus(){
    if(!capability(false)){state.status='disconnected';state.message='Polar hesabını bağlayarak egzersiz ve aktivite verilerini API üzerinden çek.';renderCard();return;}
    try{var payload=await request('polar-sync','GET');updateLocalConnection(payload.connection,payload.counts,payload.statuses,payload.errors);state.message=payload.connection.status==='connected'?'Polar AccessLink manuel senkronizasyonu hazır.':'Polar hesabı bağlı değil.';}
    catch(error){state.status='disconnected';state.message='Polar hesabını bağlayarak egzersiz ve aktivite verilerini API üzerinden çek.';state.errorMessage=error.message;}
    renderCard();
  }
  window.simurgPolarConnect=async function(){
    if(state.busy)return;state.busy=true;state.errorMessage='';state.message='Polar yetkilendirme ekranı hazırlanıyor.';renderCard();
    try{var cap=capability(true),payload=await request('polar-connect','POST',{clientId:cap.clientId,clientKey:cap.clientKey});if(!payload.authorizationUrl)throw new Error('Polar authorization URL alınamadı.');window.location.assign(payload.authorizationUrl);}
    catch(error){state.busy=false;state.status='disconnected';state.errorMessage=error.message;state.message='Polar bağlantısı başlatılamadı.';renderCard();}
  };
  window.simurgPolarSyncNow=async function(){
    if(state.busy)return;state.busy=true;state.errorMessage='';state.message='Polar Flow verileri senkronize ediliyor.';renderCard();
    try{var payload=await request('polar-sync','POST',{});mergeSync(payload);var counts=payload.counts||{};state.message='Senkron tamamlandı: '+Number(counts.workouts||0)+' workout, '+Number(counts.activity!=null?counts.activity:counts.activities||0)+' activity, '+Number(counts.sleep||0)+' sleep.';state.errorMessage=(payload.warnings||[]).join(' ');}
    catch(error){state.errorMessage=error.message;state.message='Polar senkronizasyonu tamamlanamadı.';}
    state.busy=false;renderCard();
  };
  window.simurgPolarDisconnect=async function(){
    if(state.busy||!confirm('Polar Flow bağlantısı kesilecek. Daha önce senkronize edilen Simurg verileri korunacak. Devam edelim mi?'))return;
    state.busy=true;state.errorMessage='';state.message='Polar bağlantısı kesiliyor.';renderCard();
    try{var payload=await request('polar-disconnect','POST',{});updateLocalConnection(Object.assign({},payload.connection,{connected:false,status:'disconnected'}));state.status='disconnected';state.message='Polar bağlantısı kesildi. Senkronize edilmiş veriler korundu.';localStorage.removeItem(CAPABILITY_KEY);}
    catch(error){state.errorMessage=error.message;state.message='Polar bağlantısı kesilemedi.';}
    state.busy=false;renderCard();
  };
  function handleOauthReturn(){
    var url=new URL(window.location.href),result=url.searchParams.get('polar');if(!result)return false;
    if(result==='connected'){state.status='connected';state.message='Polar hesabı bağlandı. İlk manuel senkronizasyonu başlatabilirsin.';}
    else{state.status='error';state.errorMessage=url.searchParams.get('polar_message')||'Polar bağlantısı tamamlanamadı.';state.message='Polar bağlantısı tamamlanamadı.';}
    url.searchParams.delete('polar');url.searchParams.delete('polar_message');history.replaceState(null,'',url.pathname+url.search+url.hash);return result==='connected';
  }
  ready(function(){
    ensureStores();var connectedReturn=handleOauthReturn();installObserver();
    setTimeout(installObserver,400);setTimeout(installObserver,1200);
    if(connectedReturn||capability(false))refreshStatus();else{state.status='disconnected';state.message='Polar hesabını bağlayarak egzersiz ve aktivite verilerini API üzerinden çek.';renderCard();}
  });
})();
