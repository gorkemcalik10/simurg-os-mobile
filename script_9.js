
/* Simurg OS Activity Delete Confirm v2 FORCE
   Forces confirmation on Workout Logger activity card deletion by overriding the global delete handler late. */
(function(){
  function niceActivityLabel(type){
    try{ return activityDisplayName(type||'Other'); }catch(e){ return type||'Activity'; }
  }
  function niceDateLabel(date){
    try{ return (typeof trDate==='function') ? trDate(date) : date; }catch(e){ return date; }
  }
  function canonicalType(rec){
    try{ return normalizeActivityType(rec)||'Other'; }catch(e){ return rec.activityType||rec.activity||rec.workoutType||'Other'; }
  }
  function removeActivityNow(date,type){
    if(!DATA.appleWatch) DATA.appleWatch=[];
    const before=DATA.appleWatch.length;
    DATA.appleWatch=DATA.appleWatch.filter(r=>{
      if(r.date!==date) return true;
      const rt=canonicalType(r);
      return rt!==type;
    });
    const removed=before-DATA.appleWatch.length;
    if(typeof setImportSummary==='function'){
      try{ setImportSummary(`<b>Activity silindi.</b><br><span class="sumPill">${niceActivityLabel(type)}</span><span class="sumPill">${niceDateLabel(date)}</span><span class="sumPill">${removed} kayıt</span>`); }catch(e){}
    }
    try{ save(); }catch(e){
      try{ localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA)); render(); }catch(err){}
    }
    return false;
  }
  window.deleteActivityCard=function(date,type){
    const label=niceActivityLabel(type||'Other');
    const d=niceDateLabel(date);
    const ok=window.confirm(`${label} aktivitesini ${d} tarihinden silmek istediğine emin misin?\n\nBu işlem sadece Workout Logger'daki bu aktivite kartına ait Apple Watch kayıtlarını kaldırır.`);
    if(!ok) return false;
    return removeActivityNow(date,type||'Other');
  };
  window.deleteActivityCardConfirm=window.deleteActivityCard;
  window.__simurgActivityDeleteConfirmV2Force=true;
})();
