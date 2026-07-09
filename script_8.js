
/* Simurg OS Activity Separate Cards v2 hard fix
   Workout Logger: different Apple Watch activity types on the same date render as separate cards.
   Also supports older merged records that stored segments inside one Apple Watch item. */
(function(){
  function safeNum(v){ return Number(v)||0; }
  function cloneWithoutSegments(obj){
    const o={...(obj||{})};
    delete o.segments; delete o.rows; delete o.items;
    return o;
  }
  function normalizeOneWatchSafe(rec){
    try{
      if(typeof normalizeWatchRecord==='function') return normalizeWatchRecord({...rec});
    }catch(e){}
    return {...rec};
  }
  function canonicalActivityType(rec){
    try{
      if(typeof normalizeActivityType==='function') return normalizeActivityType(rec)||'Other';
    }catch(e){}
    return rec.activityType||rec.activity||rec.workoutType||'Other';
  }
  function expandWatchRecord(rec){
    const base=cloneWithoutSegments(rec);
    const segs=Array.isArray(rec&&rec.segments) ? rec.segments : (Array.isArray(rec&&rec.rows) ? rec.rows : null);
    if(segs && segs.length){
      return segs.map(seg=>normalizeOneWatchSafe({
        ...base,
        ...seg,
        date: seg.date || base.date,
        activityType: seg.activityType || seg.activity || seg.workoutType || base.activityType || base.activity || base.workoutType
      }));
    }
    return [normalizeOneWatchSafe(base)];
  }
  window.watchRowsForDate=function(date){
    const out=[];
    (DATA.appleWatch||[]).forEach(rec=>{
      expandWatchRecord(rec).forEach(row=>{ if(row.date===date) out.push(row); });
    });
    return out;
  };
  window.activitySummaryFromRows=function(date, rows){
    rows=(rows||[]).map(normalizeOneWatchSafe);
    if(!rows.length) return null;
    const types=[...new Set(rows.map(canonicalActivityType))];
    const primary=types.length===1?types[0]:'Mixed Activity';
    const emoji=types.length===1?activityEmoji(primary):'⚡';
    const duration=sumDurations(rows);
    const active=rows.reduce((a,r)=>a+safeNum(r.activeCal),0);
    const total=rows.reduce((a,r)=>a+safeNum(r.totalCal),0);
    const distance=rows.reduce((a,r)=>a+safeNum(r.distance),0);
    const avgHR=weightedAvgHR(rows);
    const maxHR=Math.max(0,...rows.map(r=>safeNum(r.maxHR)));
    const rpes=rows.map(r=>safeNum(r.rpe)).filter(Boolean);
    const rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
    const name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
    const dist=formatDistance(distance);
    return {rows,types,primary,name,emoji,duration,active,total,distance,dist,avgHR,maxHR,rpe};
  };
  window.renderActivitySessionCard=function(date){
    const rows=watchRowsForDate(date);
    if(!rows.length) return '';
    const grouped={};
    rows.forEach(r=>{
      const key=canonicalActivityType(r)||'Other';
      if(!grouped[key]) grouped[key]=[];
      grouped[key].push(r);
    });
    return Object.keys(grouped).sort().map(type=>{
      const summary=activitySummaryFromRows(date, grouped[type]);
      if(!summary) return '';
      return renderSingleActivityCard(date, summary).replace('activitySessionCard"', 'activitySessionCard" data-activity-type="'+String(type).replace(/"/g,'&quot;')+'"');
    }).join('');
  };
  window.__simurgActivitySeparateCardsV2=true;
})();
