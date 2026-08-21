(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SimurgExerciseHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const normalizeName=value=>String(value||'')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();

  function normalizeIdentity(identity){
    const input=typeof identity==='string'?{name:identity}:(identity||{});
    const names=[input.name,input.originalName].concat(input.aliases||[]).map(normalizeName).filter(Boolean);
    return {exerciseId:String(input.exerciseId||input.id||'').trim(),names:new Set(names)};
  }

  function matches(row,identity){
    if(!row||typeof row!=='object') return false;
    const target=normalizeIdentity(identity);
    const rowId=String(row.exerciseId||'').trim();
    if(target.exerciseId&&rowId) return target.exerciseId===rowId;
    return target.names.has(normalizeName(row.exercise));
  }

  function sessions(workouts,identity,options){
    const opts=options||{};
    const beforeDate=String(opts.beforeDate||'');
    const byDate=new Map();
    (Array.isArray(workouts)?workouts:[]).forEach(row=>{
      const date=String(row&&row.date||'');
      if(!date||(beforeDate&&date>=beforeDate)||!matches(row,identity)) return;
      if(!byDate.has(date)) byDate.set(date,[]);
      byDate.get(date).push(row);
    });
    const result=[...byDate.entries()]
      .sort((a,b)=>b[0].localeCompare(a[0]))
      .map(([date,rows])=>({date,rows,summary:summarize(rows)}));
    const limit=Number(opts.limit);
    return Number.isFinite(limit)&&limit>=0?result.slice(0,limit):result;
  }

  function summarize(rows){
    const list=Array.isArray(rows)?rows:[];
    let sets=0,reps=0,volume=0,best={weight:0,reps:0};
    list.forEach(row=>{
      const count=Math.max(1,Number(row&&row.sets)||1);
      const rowReps=Math.max(0,Number(row&&row.reps)||0);
      const weight=Math.max(0,Number(row&&row.weight)||0);
      sets+=count;
      reps+=rowReps*count;
      volume+=weight*rowReps*count;
      if(weight>best.weight||(weight===best.weight&&rowReps>best.reps)) best={weight,reps:rowReps};
    });
    return {sets,reps,volume,best};
  }

  return Object.freeze({version:1,normalizeName,matches,sessions,summarize});
});
