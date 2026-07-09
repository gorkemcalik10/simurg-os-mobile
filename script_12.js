
/* Simurg OS Coach Upgrade Pack v1 */
(function(){
  const BUILD='Simurg OS Coach Upgrade Pack v2';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function scoreSet(w){return (Number(w.weight)||0)*1000+(Number(w.reps)||0);}
  function volumeSet(w){return (Number(w.weight)||0)*(Number(w.reps)||0);}
  function bestSetForExercise(ex){
    const rows=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const rows=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));
    const by={}; rows.forEach(w=>{ if(!w.date) return; (by[w.date]=by[w.date]||[]).push(w); });
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      const vol=sets.reduce((s,w)=>s+volumeSet(w),0);
      return {date,sets,best,vol,score:scoreSet(best)};
    });
  }
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri bekleniyor',cls:'flat',line:'Bu hareket için kayıt yok.'};
    const line=sessions.map(s=>`${(typeof trDate==='function'?trDate(s.date):s.date)}: ${Number(s.best.weight)||0}kg x ${Number(s.best.reps)||0}`).join(' → ');
    if(sessions.length<2) return {label:'İlk kayıt',cls:'flat',line};
    const first=sessions[0].score, last=sessions[sessions.length-1].score;
    if(last>first) return {label:'Improving',cls:'up',line};
    if(last<first) return {label:'Fatigue / düşüş',cls:'down',line};
    return {label:'Stable',cls:'flat',line};
  }
  function addGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex) return;
      const old=card.querySelector('.gymInsightBox'); if(old) old.remove();
      const best=bestSetForExercise(ex);
      const tr=trendForExercise(ex);
      const bestText=best?`${Number(best.weight)||0}kg x ${Number(best.reps)||0}`:'Henüz yok';
      const bestDate=best&&best.date?(typeof trDate==='function'?trDate(best.date):best.date):'Kayıt biriktikçe oluşur';
      const html=`<div class="gymInsightBox"><div class="gymInsightCell"><small>Best Set</small><b>${esc(bestText)}</b><span>${esc(bestDate)}</span></div><div class="gymInsightCell"><small>Exercise Trend</small><b>${esc(tr.label)}</b><span>${esc(tr.line)}</span><span class="gymTrendPill ${esc(tr.cls)}">Son 3 kayıt</span></div></div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function weeklyRecommendation(){
    const days=(typeof weekDates==='function'?weekDates():[]);
    const workoutRows=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=(typeof calc==='function'?calc(workoutRows):{sets:0,reps:0,vol:0,parts:{}});
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const activities=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actDays=new Set(activities.map(a=>a.date)).size;
    const minutes=activities.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const painWarn=workoutRows.filter(w=>String(w.pain||'None')!=='None').length;
    const rpes=workoutRows.map(w=>Number(w.rpe)||0).filter(Boolean);
    const avgRpe=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length):0;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let verdict='Veri biriktikçe gelecek hafta önerisi daha netleşir.';
    if(c.sets===0 && activities.length) verdict='Bu hafta gym kaydı yok ama activity yükü var. Gelecek hafta düşük-orta hacimli kontrollü dönüş iyi olur.';
    else if(c.sets<14) verdict='Hafta hafif geçmiş. Ağrı yoksa gelecek hafta ana hareketlerde küçük tekrar artışı denenebilir.';
    else if(c.sets<=28 && avgRpe<=8 && !painWarn) verdict='Yük dengeli görünüyor. Gelecek hafta aynı yapıyı koruyup 1-2 ana harekette küçük progresyon hedefle.';
    else if(c.sets>28 || avgRpe>8 || painWarn) verdict='Yük/stres yüksek tarafa yakın. Gelecek hafta formu koru, ağrı sinyali varsa hacmi %10-15 azalt.';
    const focus=topPart[0]&&topPart[0]!=='-'?`${topPart[0]} baskın; zayıf kalan bölgeleri dengede tut.`:'Önce düzenli veri biriktir.';
    return {verdict,focus,gymDays,actDays,minutes:Math.round(minutes),avgRpe:avgRpe?avgRpe.toFixed(1):'-',painWarn};
  }
  function addWeeklyRecommendation(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap) return;
    const grid=wrap.querySelector('.weeklyPremiumGrid'); if(!grid) return;
    const old=grid.querySelector('.weeklyRecommendationCard'); if(old) old.remove();
    const r=weeklyRecommendation();
    grid.insertAdjacentHTML('beforeend',`<div class="weeklyPremiumCard weeklyRecommendationCard"><div class="weeklyPremiumHead"><div><small>Coach Weekly Recommendation</small><b>Gelecek hafta yönlendirmesi</b></div><div class="weeklyPremiumPill">Coach v1</div></div><div class="weeklyRecommendationBody"><div class="weeklyRecommendationText"><b>Öneri:</b> ${esc(r.verdict)}<br><b>Odak:</b> ${esc(r.focus)}</div><div class="weeklyRecommendationChecklist"><div class="weeklyRecommendationItem"><small>Gym</small><b>${r.gymDays} gün</b></div><div class="weeklyRecommendationItem"><small>Activity</small><b>${r.actDays} gün / ${r.minutes} dk</b></div><div class="weeklyRecommendationItem"><small>Avg RPE</small><b>${r.avgRpe}</b></div><div class="weeklyRecommendationItem"><small>Pain Flags</small><b>${r.painWarn}</b></div></div></div></div>`);
  }
  function applyCoachUpgrade(){
    try{addGymInsights();}catch(e){console.warn('gym insights',e)}
    try{addWeeklyRecommendation();}catch(e){console.warn('weekly rec',e)}
  }
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); applyCoachUpgrade(); };
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){ prevWeekly(); setTimeout(()=>{try{addWeeklyRecommendation();}catch(e){}},0); };
  }
  setTimeout(applyCoachUpgrade,80);
  window.__simurgCoachUpgradePackV2=true;
})();
