(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgExerciseCatalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function clean(value){return String(value==null?'':value).trim()}
  function normalized(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i')}
  function sessionKey(row,index){return clean(row&&row.sessionId)||clean(row&&row.date)||'row_'+index}
  function later(current,row,index){
    var stamp=clean(row&&row.date)+'|'+String(index).padStart(8,'0');
    return !current||stamp>=current.stamp?{stamp:stamp,row:row}:current;
  }
  function entries(data){
    data=data||{};
    var result=Object.create(null),catalog=data.exerciseCatalog&&typeof data.exerciseCatalog==='object'&&!Array.isArray(data.exerciseCatalog)?data.exerciseCatalog:{};
    Object.keys(catalog).forEach(function(key){
      var item=catalog[key]||{},exerciseId=clean(item.exerciseId)||clean(key),name=clean(item.name);
      if(!exerciseId||!name)return;
      result['id:'+exerciseId]={exerciseId:exerciseId,name:name,bodyPart:clean(item.bodyPart)||'Other',exerciseType:clean(item.exerciseType),sessions:Object.create(null),last:null,catalogOnly:true};
    });
    (data.workouts||[]).forEach(function(row,index){
      if(!row)return;
      var name=clean(row.exercise);if(!name)return;
      var exerciseId=clean(row.exerciseId),key=exerciseId?'id:'+exerciseId:'legacy:'+name;
      var item=result[key]||(result[key]={exerciseId:exerciseId||null,name:name,bodyPart:clean(row.bodyPart)||'Other',exerciseType:clean(row.exerciseType),sessions:Object.create(null),last:null,catalogOnly:false});
      item.sessions[sessionKey(row,index)]=true;
      item.catalogOnly=false;
      item.last=later(item.last,row,index);
      if(item.last&&item.last.row===row){
        item.name=name;
        item.bodyPart=clean(row.bodyPart)||item.bodyPart||'Other';
        item.exerciseType=clean(row.exerciseType)||item.exerciseType||'';
      }
    });
    return Object.keys(result).map(function(key){
      var item=result[key];
      return {key:key,exerciseId:item.exerciseId,name:item.name,bodyPart:item.bodyPart||'Other',exerciseType:item.exerciseType||'',useCount:Object.keys(item.sessions).length,lastUsedDate:item.last&&clean(item.last.row.date)||'',catalogOnly:item.catalogOnly};
    });
  }
  function compareRecent(a,b){
    return String(b.lastUsedDate||'').localeCompare(String(a.lastUsedDate||''))||(b.useCount-a.useCount)||a.name.localeCompare(b.name,'tr');
  }
  function compareSearch(query){
    return function(a,b){
      var an=normalized(a.name),bn=normalized(b.name),ai=an.indexOf(query),bi=bn.indexOf(query);
      return ai-bi||(b.useCount-a.useCount)||String(b.lastUsedDate||'').localeCompare(String(a.lastUsedDate||''))||a.name.localeCompare(b.name,'tr');
    };
  }
  function list(data,query,limit){
    var q=normalized(query),items=entries(data).filter(function(item){return !q||normalized(item.name).indexOf(q)>=0});
    items.sort(q?compareSearch(q):compareRecent);
    return items.slice(0,Math.max(1,Number(limit)||8));
  }
  function register(data,item){
    if(!data||!item)return null;
    var exerciseId=clean(item.exerciseId),name=clean(item.name);if(!exerciseId||!name)return null;
    if(!data.exerciseCatalog||typeof data.exerciseCatalog!=='object'||Array.isArray(data.exerciseCatalog))data.exerciseCatalog={};
    data.exerciseCatalog[exerciseId]={exerciseId:exerciseId,name:name,bodyPart:clean(item.bodyPart)||'Other'};
    var exerciseType=clean(item.exerciseType);if(exerciseType)data.exerciseCatalog[exerciseId].exerciseType=exerciseType;
    return data.exerciseCatalog[exerciseId];
  }
  return {entries:entries,list:list,register:register,normalized:normalized};
});
