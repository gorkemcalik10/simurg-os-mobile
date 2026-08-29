(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgGymIdentity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var sequence=0;
  function id(prefix){
    if(typeof crypto!=='undefined'&&crypto&&typeof crypto.randomUUID==='function')return String(prefix||'id')+'_'+crypto.randomUUID();
    sequence+=1;return String(prefix||'id')+'_'+Date.now().toString(36)+'_'+sequence.toString(36)+'_'+Math.random().toString(36).slice(2,10);
  }
  function rowIdentity(row){return row&&row.exerciseId?'id:'+row.exerciseId:'legacy:'+String(row&&row.exercise||'')}
  function sameExercise(row,anchor){
    if(!row||!anchor||row.date!==anchor.date)return false;
    if(anchor.exerciseId)return row.exerciseId===anchor.exerciseId;
    return !row.exerciseId&&String(row.exercise||'')===String(anchor.exercise||'');
  }
  function indexesFor(rows,index){
    var anchor=rows&&rows[index];if(!anchor)return [];
    return rows.map(function(row,rowIndex){return sameExercise(row,anchor)?rowIndex:null}).filter(function(value){return value!==null});
  }
  function sessionIdFor(rows,date){
    var existing=(rows||[]).find(function(row){return row&&row.date===date&&row.sessionId;});
    return existing?existing.sessionId:id('session');
  }
  function clean(value){return String(value==null?'':value).trim()}
  function localDate(value){
    var date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime()))return null;
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  function sessionTimingFor(rows,date,sessionId,nowValue){
    var all=(rows||[]).filter(function(row){return row&&row.date===date;}),matching=all.filter(function(row){return clean(row.sessionId)===clean(sessionId);});
    var startedRow=matching.find(function(row){return clean(row.startedAt);});
    if(!startedRow){
      if(all.length)return {sessionId:sessionId};
      var initial=nowValue==null?new Date():new Date(nowValue);
      return localDate(initial)===date?{sessionId:sessionId,startedAt:initial.toISOString()}:{sessionId:sessionId};
    }
    var startedAt=clean(startedRow.startedAt),startedMs=Date.parse(startedAt),now=nowValue==null?new Date():new Date(nowValue),nowMs=now.getTime();
    if(localDate(now)!==date||!Number.isFinite(startedMs)||!Number.isFinite(nowMs)||nowMs<=startedMs)return {sessionId:sessionId,startedAt:startedAt};
    var duration=Math.round((nowMs-startedMs)/6000)/10;
    return duration>=5?{sessionId:sessionId,startedAt:startedAt,endedAt:now.toISOString(),durationMinutes:duration}:{sessionId:sessionId,startedAt:startedAt};
  }
  function applySessionTiming(rows,date,sessionId,timing){
    (rows||[]).forEach(function(row){
      if(!row||row.date!==date||clean(row.sessionId)!==clean(sessionId))return;
      if(timing&&timing.startedAt)row.startedAt=timing.startedAt;
      if(timing&&timing.endedAt)row.endedAt=timing.endedAt;
      if(timing&&Number.isFinite(timing.durationMinutes))row.durationMinutes=timing.durationMinutes;
    });
    return rows;
  }
  function exerciseIdFor(rows,date,entryKey){
    var existing=(rows||[]).find(function(row){return row&&row.date===date&&row.exerciseId&&(row.gymEntryKey===entryKey||row.exerciseKey===entryKey);});
    return existing?existing.exerciseId:id('exercise');
  }
  function setIdFor(row){return row&&row.setId?row.setId:id('set')}
  function apply(row,identity){
    row.sessionId=row.sessionId||identity.sessionId;
    row.exerciseId=row.exerciseId||identity.exerciseId;
    row.setId=row.setId||identity.setId||id('set');
    return row;
  }
  return {id:id,rowIdentity:rowIdentity,sameExercise:sameExercise,indexesFor:indexesFor,sessionIdFor:sessionIdFor,sessionTimingFor:sessionTimingFor,applySessionTiming:applySessionTiming,exerciseIdFor:exerciseIdFor,setIdFor:setIdFor,apply:apply};
});
