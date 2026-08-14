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
  return {id:id,rowIdentity:rowIdentity,sameExercise:sameExercise,indexesFor:indexesFor,sessionIdFor:sessionIdFor,exerciseIdFor:exerciseIdFor,setIdFor:setIdFor,apply:apply};
});
