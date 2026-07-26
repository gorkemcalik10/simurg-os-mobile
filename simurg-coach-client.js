(function(root,factory){
  'use strict';
  var engine=root&&root.SimurgCoachEngine;
  if(typeof module==='object'&&module.exports)engine=require('./simurg-coach-engine.js');
  var api=factory(engine);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgCoachClient=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
  'use strict';

  if(!engine)throw new Error('SimurgCoachClient requires SimurgCoachEngine.');

  var AI_STATUS='ai_disabled';
  var memoryCache=new Map();
  var stats={analysisRuns:0,memoryHits:0,storeHits:0};
  var MAX_MEMORY_ENTRIES=80;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function isObject(value){return !!value&&Object.prototype.toString.call(value)==='[object Object]';}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
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
  function resolve(type,date,options){
    options=options||{};
    var data=dataRoot(options.data),selected=dateValue(date);
    stats.analysisRuns+=1;
    var calculated=engine.analyze(type,data,selected,options.engineOptions||{});
    var key=type+':'+selected+':'+calculated.inputHash;
    if(memoryCache.has(key)){
      stats.memoryHits+=1;
      return decorate(memoryCache.get(key),'memory_hit');
    }
    var store=engine.ensureStore(data),stored=storedResult(store,type,selected);
    if(stored&&stored.inputHash===calculated.inputHash){
      stats.storeHits+=1;
      remember(key,stored);
      return decorate(stored,'store_hit');
    }
    var deterministic=decorate(calculated,'miss');
    if(options.store!==false)engine.storeResult(data,deterministic);
    remember(key,deterministic);
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
  function invalidate(){
    memoryCache.clear();
  }
  function diagnostics(){
    return Object.assign({aiStatus:AI_STATUS,cacheEntries:memoryCache.size},stats);
  }

  return {
    VERSION:1,
    AI_STATUS:AI_STATUS,
    resolve:resolve,
    resolveBundle:resolveBundle,
    invalidate:invalidate,
    diagnostics:diagnostics
  };
});
