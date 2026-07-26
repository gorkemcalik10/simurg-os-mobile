(function(root,factory){
  'use strict';
  var engine=root&&root.SimurgCoachEngine;
  if(typeof module==='object'&&module.exports)engine=require('./simurg-coach-engine.js');
  var api=factory(engine,root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgCoachClient=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(engine,root){
  'use strict';

  if(!engine)throw new Error('SimurgCoachClient requires SimurgCoachEngine.');

  var AI_STATUS='ai_disabled';
  var memoryCache=new Map();
  var remoteCache=new Map();
  var remotePending=new Map();
  var stats={analysisRuns:0,memoryHits:0,storeHits:0,remoteCalls:0,remoteHits:0,remoteFallbacks:0,refreshAttempts:0};
  var MAX_MEMORY_ENTRIES=80;
  var MAX_REMOTE_ENTRIES=80;
  var AI_DISABLED_TTL_MS=2*60*1000;
  var REMOTE_FALLBACK_TTL_MS=30*1000;
  var REMOTE_SUCCESS_TTL_MS=10*60*1000;
  var DEFAULT_TIMEOUT_MS=8000;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value&&Object.prototype.toString.call(value)==='[object Object]';}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
  function safeText(value,max){
    if(value==null)return null;
    var next=String(value).replace(/\s+/g,' ').trim();
    return next?next.slice(0,max||4096):null;
  }
  function safeList(value,limit){
    if(!Array.isArray(value))return [];
    return value.slice(0,limit||8).map(function(item){return safeText(item,1024);}).filter(Boolean);
  }
  function safeGuidance(value){
    var source=isObject(value)?value:{};
    return {
      mainLifts:safeText(source.mainLifts,2048),
      accessories:safeText(source.accessories,2048),
      stabilityPosture:safeText(source.stabilityPosture,2048),
      conditioning:safeText(source.conditioning,2048)
    };
  }
  function safeTrend(value){
    if(!isObject(value))return null;
    var keys=['id','metric','title','summary','direction','relationship','changePercent','recentMean','previousMean','sampleSize','confidenceScore'];
    var next={};
    keys.forEach(function(key){
      var item=value[key];
      if(item==null)return;
      next[key]=typeof item==='number'&&Number.isFinite(item)?item:safeText(item,key==='summary'?2048:512);
    });
    return next;
  }
  function dataRoot(explicit){
    if(isObject(explicit))return explicit;
    try{if(typeof DATA!=='undefined'&&isObject(DATA))return DATA;}catch(error){}
    if(typeof window!=='undefined'&&isObject(window.DATA))return window.DATA;
    throw new Error('SimurgCoachClient requires a DATA object.');
  }
  function dateValue(value){
    if(validDate(value))return value;
    try{if(typeof selectedDate!=='undefined'&&validDate(selectedDate))return selectedDate;}catch(error){}
    var now=new Date();
    return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  }
  function storedResult(store,type,date){
    if(type==='weekly')return store.weekly&&store.weekly[date]||null;
    if(type==='pattern')return store.patterns&&store.patterns[date]||null;
    return store.daily&&store.daily[date]&&store.daily[date][type]||null;
  }
  function decorate(result,cacheStatus){
    var next=clone(result);
    next.narrative={
      mode:'deterministic',
      aiStatus:AI_STATUS,
      source:'SimurgCoachEngine',
      cacheStatus:cacheStatus
    };
    return next;
  }
  function remember(key,value){
    if(memoryCache.size>=MAX_MEMORY_ENTRIES)memoryCache.delete(memoryCache.keys().next().value);
    memoryCache.set(key,clone(value));
  }
  function remoteRemember(key,value,ttl){
    if(remoteCache.size>=MAX_REMOTE_ENTRIES)remoteCache.delete(remoteCache.keys().next().value);
    remoteCache.set(key,{expiresAt:Date.now()+ttl,value:clone(value)});
  }
  function remoteStored(key){
    var entry=remoteCache.get(key);
    if(!entry)return null;
    if(entry.expiresAt<=Date.now()){remoteCache.delete(key);return null;}
    stats.remoteHits+=1;
    return clone(entry.value);
  }
  function browserConfig(options){
    options=options||{};
    var url=options.supabaseUrl||'';
    var key=options.publishableKey||'';
    if(!url)try{if(typeof SIMURG_SUPABASE_URL!=='undefined')url=SIMURG_SUPABASE_URL;}catch(error){}
    if(!key)try{if(typeof SIMURG_SUPABASE_KEY!=='undefined')key=SIMURG_SUPABASE_KEY;}catch(error){}
    if(!url&&root)url=root.SIMURG_SUPABASE_URL||'';
    if(!key&&root)key=root.SIMURG_SUPABASE_PUBLISHABLE_KEY||root.SIMURG_SUPABASE_KEY||'';
    return {
      url:String(url||'').replace(/\/$/,''),
      key:String(key||''),
      fetchImpl:options.fetchImpl||(root&&typeof root.fetch==='function'?root.fetch.bind(root):null),
      auth:options.auth||(root&&root.SimurgCloudAuth),
      timeoutMs:Number(options.timeoutMs)||DEFAULT_TIMEOUT_MS
    };
  }
  function normalizedSession(value){
    if(value&&value.data&&value.data.session)return value.data.session;
    return value&&value.access_token?value:null;
  }
  async function currentSession(auth){
    if(!auth)return null;
    if(typeof auth.getSession==='function')return normalizedSession(await auth.getSession());
    var client=typeof auth.getClient==='function'?auth.getClient():null;
    if(client&&client.auth&&typeof client.auth.getSession==='function')return normalizedSession(await client.auth.getSession());
    return null;
  }
  async function refreshSession(auth){
    var client=auth&&typeof auth.getClient==='function'?auth.getClient():auth;
    if(!client||!client.auth||typeof client.auth.refreshSession!=='function')return null;
    stats.refreshAttempts+=1;
    var refreshed=await client.auth.refreshSession();
    if(refreshed&&refreshed.error)return null;
    return normalizedSession(refreshed);
  }
  function coachPayload(result){
    var source=isObject(result)?result:{};
    return {
      schemaVersion:Number(source.schemaVersion)||1,
      type:safeText(source.type,64),
      date:safeText(source.date,32),
      inputHash:safeText(source.inputHash,256),
      readinessScore:source.readinessScore==null?null:Number(source.readinessScore),
      readinessStatus:safeText(source.readinessStatus,64),
      confidenceScore:source.confidenceScore==null?0:Number(source.confidenceScore),
      confidenceLabel:safeText(source.confidenceLabel,64),
      headline:safeText(source.headline,1024),
      summary:safeText(source.summary,4096),
      keyDrivers:safeList(source.keyDrivers,8),
      trainingDecision:safeText(source.trainingDecision,64),
      loadAdjustmentPercent:Number(source.loadAdjustmentPercent)||0,
      workoutGuidance:safeGuidance(source.workoutGuidance),
      warnings:safeList(source.warnings,8),
      trendInsights:Array.isArray(source.trendInsights)?source.trendInsights.slice(0,8).map(safeTrend).filter(Boolean):[],
      missingData:safeList(source.missingData,8)
    };
  }
  function sameSafety(local,remote){
    return isObject(remote)
      &&remote.inputHash===local.inputHash
      &&remote.trainingDecision===local.trainingDecision
      &&Number(remote.loadAdjustmentPercent)===Number(local.loadAdjustmentPercent)
      &&JSON.stringify(remote.warnings||[])===JSON.stringify(local.warnings||[]);
  }
  async function readResponse(response){
    try{return await response.json();}catch(error){return null;}
  }
  async function remoteRequest(config,payload,token){
    var controller=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},config.timeoutMs):null;
    try{
      stats.remoteCalls+=1;
      var response=await config.fetchImpl(config.url+'/functions/v1/simurg-coach',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+token,
          'apikey':config.key,
          'Content-Type':'application/json'
        },
        body:JSON.stringify(payload),
        signal:controller?controller.signal:undefined
      });
      return {response:response,body:await readResponse(response)};
    }finally{
      if(timer)clearTimeout(timer);
    }
  }
  async function performRemote(result,options){
    var config=browserConfig(options);
    if(!config.auth||!config.url||!config.key||typeof config.fetchImpl!=='function')return {status:'local_only',reason:'unavailable'};
    var session;
    try{session=await currentSession(config.auth);}catch(error){return {status:'local_only',reason:'no_session'};}
    if(!session||!session.access_token)return {status:'local_only',reason:'no_session'};
    var payload=coachPayload(result),attempt;
    try{attempt=await remoteRequest(config,payload,session.access_token);}
    catch(error){
      stats.remoteFallbacks+=1;
      return {status:'local_fallback',reason:error&&error.name==='AbortError'?'timeout':'network'};
    }
    if(attempt.response.status===401){
      var refreshed;
      try{refreshed=await refreshSession(config.auth);}catch(error){refreshed=null;}
      if(!refreshed||!refreshed.access_token){
        stats.remoteFallbacks+=1;
        return {status:'local_fallback',reason:'unauthorized'};
      }
      try{attempt=await remoteRequest(config,payload,refreshed.access_token);}
      catch(error){
        stats.remoteFallbacks+=1;
        return {status:'local_fallback',reason:error&&error.name==='AbortError'?'timeout':'network'};
      }
    }
    if(attempt.response.status===503&&attempt.body&&attempt.body.error===AI_STATUS){
      if(!sameSafety(payload,attempt.body.deterministic)){
        stats.remoteFallbacks+=1;
        return {status:'local_fallback',reason:'invalid_response'};
      }
      return {status:AI_STATUS,reason:'expected'};
    }
    if(attempt.response.ok&&attempt.body&&sameSafety(payload,attempt.body.result)){
      return {status:'remote_available',reason:'safe_narrative'};
    }
    stats.remoteFallbacks+=1;
    return {status:'local_fallback',reason:attempt.response.status>=500?'server':'invalid_response'};
  }
  function syncRemote(result,options){
    if(!result||!result.inputHash)return Promise.resolve({status:'local_only',reason:'missing_hash'});
    var key=String(result.inputHash),cached=remoteStored(key);
    if(cached)return Promise.resolve(Object.assign({cacheStatus:'hit'},cached));
    if(remotePending.has(key))return remotePending.get(key);
    var pending=performRemote(result,options).then(function(remote){
      var ttl=remote.status===AI_STATUS?AI_DISABLED_TTL_MS:remote.status==='remote_available'?REMOTE_SUCCESS_TTL_MS:remote.status==='local_only'?0:REMOTE_FALLBACK_TTL_MS;
      if(ttl>0)remoteRemember(key,remote,ttl);
      return Object.assign({cacheStatus:'miss'},remote);
    }).catch(function(){
      stats.remoteFallbacks+=1;
      var remote={status:'local_fallback',reason:'network'};
      remoteRemember(key,remote,REMOTE_FALLBACK_TTL_MS);
      return Object.assign({cacheStatus:'miss'},remote);
    }).finally(function(){remotePending.delete(key);});
    remotePending.set(key,pending);
    return pending;
  }
  function bridge(result,options){
    if(!options||options.remote!==true)return;
    syncRemote(result,options);
  }
  function resolve(type,date,options){
    options=options||{};
    var data=dataRoot(options.data),selected=dateValue(date);
    stats.analysisRuns+=1;
    var calculated=engine.analyze(type,data,selected,options.engineOptions||{});
    var key=type+':'+selected+':'+calculated.inputHash;
    if(memoryCache.has(key)){
      stats.memoryHits+=1;
      var memoryResult=decorate(memoryCache.get(key),'memory_hit');
      bridge(memoryResult,options);
      return memoryResult;
    }
    var store=engine.ensureStore(data),stored=storedResult(store,type,selected);
    if(stored&&stored.inputHash===calculated.inputHash){
      stats.storeHits+=1;
      remember(key,stored);
      var storeResult=decorate(stored,'store_hit');
      bridge(storeResult,options);
      return storeResult;
    }
    var deterministic=decorate(calculated,'miss');
    if(options.store!==false)engine.storeResult(data,deterministic);
    remember(key,deterministic);
    bridge(deterministic,options);
    return clone(deterministic);
  }
  function resolveBundle(date,options){
    var selected=dateValue(date),base=Object.assign({},options||{});
    return {
      date:selected,
      daily:resolve('daily',selected,base),
      preWorkout:resolve('pre_workout',selected,base),
      postWorkout:resolve('post_workout',selected,base),
      weekly:resolve('weekly',selected,base),
      pattern:resolve('pattern',selected,base),
      aiStatus:AI_STATUS
    };
  }
  function invalidate(options){
    memoryCache.clear();
    if(options&&options.remote){
      remoteCache.clear();
      remotePending.clear();
    }
  }
  function diagnostics(){
    return Object.assign({aiStatus:AI_STATUS,cacheEntries:memoryCache.size,remoteCacheEntries:remoteCache.size,remotePending:remotePending.size},stats);
  }

  return {
    VERSION:2,
    AI_STATUS:AI_STATUS,
    resolve:resolve,
    resolveBundle:resolveBundle,
    buildPayload:coachPayload,
    syncRemote:syncRemote,
    invalidate:invalidate,
    diagnostics:diagnostics
  };
});
