
(function(){
  function trSafeDate(s){
    if(!s || typeof trDate!=='function') return s || '-';
    try{return trDate(s);}catch(e){return s;}
  }
  function ensureImportSummaryBox(){
    let box=document.getElementById('importSummaryBox');
    if(box) return box;
    const universal=document.querySelector('.universalImportCard');
    box=document.createElement('div');
    box.id='importSummaryBox';
    box.className='importSummaryBox';
    box.innerHTML='Import özeti burada görünecek.';
    if(universal) universal.appendChild(box);
    else {
      const data=document.getElementById('data');
      if(data) data.appendChild(box);
    }
    return box;
  }
  function setImportSummary(html){
    const box=ensureImportSummaryBox();
    if(!box) return;
    box.innerHTML=html;
    box.classList.add('active');
  }
  function durationLabel(v){return v || '-';}
  function activityLabel(r){
    try{
      if(typeof normalizeActivityType==='function') return normalizeActivityType(r);
    }catch(e){}
    return r.activityType||r.activity||r.workoutType||r.sport||'Activity';
  }
  function summarizeImport(beforeW,beforeA,beforeD,beforeN,source){
    const newW=(DATA.workouts||[]).slice(beforeW);
    const newA=(DATA.appleWatch||[]).slice(beforeA);
    const newDaily=(DATA.dailyNotes||[]).slice(beforeD);
    const newWeekly=(DATA.weeklyNotes||[]).slice(beforeN);
    if(!newW.length && !newA.length && !newDaily.length && !newWeekly.length){return;}
    let parts=[];
    if(newW.length){
      const dates=[...new Set(newW.map(w=>w.date).filter(Boolean))];
      const ex=[...new Set(newW.map(w=>w.exercise).filter(Boolean))];
      parts.push(`<span class="sumPill">🏋️ <strong>${newW.length}</strong> workout kaydı</span>`);
      if(dates[0]) parts.push(`<span class="sumPill">📅 ${dates.map(trSafeDate).join(', ')}</span>`);
      if(ex.length) parts.push(`<span class="sumPill">${ex.slice(0,3).join(' · ')}${ex.length>3?' +'+(ex.length-3):''}</span>`);
    }
    if(newA.length){
      const dates=[...new Set(newA.map(r=>r.date).filter(Boolean))];
      const types=[...new Set(newA.map(activityLabel))];
      const active=newA.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
      const latest=newA[newA.length-1]||{};
      parts.push(`<span class="sumPill">⌚ <strong>${newA.length}</strong> aktivite</span>`);
      parts.push(`<span class="sumPill">${types.join(' + ')}</span>`);
      if(dates[0]) parts.push(`<span class="sumPill">📅 ${dates.map(trSafeDate).join(', ')}</span>`);
      if(latest.duration) parts.push(`<span class="sumPill">⏱️ ${durationLabel(latest.duration)}</span>`);
      if(active) parts.push(`<span class="sumPill">🔥 ${active} kcal</span>`);
    }
    if(newDaily.length) parts.push(`<span class="sumPill">📝 <strong>${newDaily.length}</strong> daily note</span>`);
    if(newWeekly.length) parts.push(`<span class="sumPill">📅 <strong>${newWeekly.length}</strong> weekly note</span>`);
    setImportSummary(`<b>${source||'Import'} tamamlandı.</b><br>${parts.join('')}`);
  }
  function wrapImportFunction(name,label){
    const old=window[name];
    if(typeof old!=='function' || old.__simurgSummaryWrapped) return;
    const wrapped=function(){
      const beforeW=(DATA.workouts||[]).length;
      const beforeA=(DATA.appleWatch||[]).length;
      const beforeD=(DATA.dailyNotes||[]).length;
      const beforeN=(DATA.weeklyNotes||[]).length;
      const result=old.apply(this,arguments);
      setTimeout(()=>summarizeImport(beforeW,beforeA,beforeD,beforeN,label),0);
      return result;
    };
    wrapped.__simurgSummaryWrapped=true;
    window[name]=wrapped;
  }
  function initImportSummary(){
    ensureImportSummaryBox();
    wrapImportFunction('universalImport','Universal Import');
    wrapImportFunction('importWorkoutJson','Workout JSON import');
    wrapImportFunction('importWatchJson','Apple Watch import');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initImportSummary);
  else initImportSummary();
})();
