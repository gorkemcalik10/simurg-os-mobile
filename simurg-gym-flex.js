(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgGymFlex=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var MODES=['planned','alternate','custom','skipped'];
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function validDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    var date=new Date(value+'T00:00:00Z');
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function addDays(date,amount){var value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+amount);return value.toISOString().slice(0,10);}
  function mondayOf(date){var value=new Date(date+'T12:00:00Z'),day=value.getUTCDay();value.setUTCDate(value.getUTCDate()+(day===0?-6:1-day));return value.toISOString().slice(0,10);}
  function dayName(date){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(date+'T12:00:00Z').getUTCDay()];}
  function stateFor(data,date){var state=data&&data.gymDayState&&data.gymDayState[date];return state&&MODES.indexOf(state.mode)>=0?state:null;}
  function resolveTemplate(data,date,baseResolver){
    var planned=clone(baseResolver(date)),state=stateFor(data,date);
    if(!state||state.mode==='planned')return Object.assign({},planned,{mode:'planned',sourceDate:date,state:state});
    if(state.mode==='alternate'&&validDate(state.sourceDate)){
      var alternate=clone(baseResolver(state.sourceDate));alternate.name=state.label||alternate.name;
      return Object.assign({},alternate,{mode:'alternate',sourceDate:state.sourceDate,state:state});
    }
    return {name:state.label||(state.mode==='skipped'?'Bugün atlandı':'Serbest Antrenman'),items:[],mode:state.mode,sourceDate:state.sourceDate||null,state:state};
  }
  function missedPrograms(data,date,baseResolver){
    var start=mondayOf(date),result=[];
    for(var i=0;i<7;i+=1){
      var candidate=addDays(start,i);if(candidate>=date)break;
      var template=baseResolver(candidate)||{items:[]};if(!(template.items||[]).length)continue;
      if((data&&data.workouts||[]).some(function(row){return row&&row.date===candidate;}))continue;
      result.push({date:candidate,day:dayName(candidate),name:template.name,items:clone(template.items)});
    }
    return result;
  }
  function programTemplates(date,baseResolver){
    var start=mondayOf(date),result=[];
    for(var i=0;i<7;i+=1){var sourceDate=addDays(start,i),template=baseResolver(sourceDate)||{items:[]};if((template.items||[]).length)result.push({date:sourceDate,day:dayName(sourceDate),name:template.name,items:clone(template.items)});}
    return result;
  }
  function lastSession(data,date){
    var rows=(data&&data.workouts||[]).filter(function(row){return row&&validDate(row.date)&&row.date<date;});if(!rows.length)return null;
    var sourceDate=rows.map(function(row){return row.date;}).sort().slice(-1)[0],sourceRows=rows.filter(function(row){return row.date===sourceDate;}),seen=Object.create(null),items=[];
    sourceRows.forEach(function(row,index){
      var identity=String(row.gymEntryKey||row.exercise||'Egzersiz');if(seen[identity])return;seen[identity]=true;
      var matching=sourceRows.filter(function(candidate){return row.gymEntryKey?candidate.gymEntryKey===row.gymEntryKey:!candidate.gymEntryKey&&candidate.exercise===row.exercise;});
      items.push({id:'repeat_'+index+'_'+identity.replace(/[^a-z0-9]+/gi,'_').slice(0,48),name:row.exercise||'Egzersiz',bodyPart:row.bodyPart||'Other',setCount:Math.max(1,matching.length),custom:true,prefill:matching.map(function(set){return {weight:set.weight,reps:set.reps};})});
    });
    return {date:sourceDate,items:items};
  }
  function makeState(mode,options){options=options||{};return {mode:mode,sourceDay:options.sourceDay==null?null:String(options.sourceDay),sourceDate:options.sourceDate==null?null:String(options.sourceDate),label:String(options.label||''),updatedAt:String(options.updatedAt||new Date().toISOString())};}
  return {MODES:MODES,validDate:validDate,addDays:addDays,mondayOf:mondayOf,dayName:dayName,stateFor:stateFor,resolveTemplate:resolveTemplate,missedPrograms:missedPrograms,programTemplates:programTemplates,lastSession:lastSession,makeState:makeState};
});
