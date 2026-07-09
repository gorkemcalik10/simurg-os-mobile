
/* Simurg OS Premium Coach Insights v1 */
(function(){
  const BUILD='Simurg OS Premium Coach Insights v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volumeSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSetForExercise(ex){
    const rows=rowsForExercise(ex);
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const by={};
    rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      return {date,sets,best,score:scoreSet(best),volume:sets.reduce((s,w)=>s+volumeSet(w),0)};
    });
  }
  function fmtDate(d){return typeof trDate==='function'?trDate(d):d;}
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri bekleniyor',cls:'empty',line:'Bu hareket için henüz kayıt yok.',target:'İlk temiz kaydı oluştur; sonra sistem hedef önermeye başlar.'};
    const line=sessions.map(s=>`${fmtDate(s.date)}: ${n(s.best.weight)}kg x ${n(s.best.reps)}`).join(' → ');
    if(sessions.length<2){
      const b=sessions[0].best;
      return {label:'İlk kayıt',cls:'flat',line,target:`Sonraki seans aynı formda ${n(b.weight)}kg x ${n(b.reps)+1} dene veya RPE yüksekse aynı hedefi koru.`};
    }
    const first=sessions[0].score,last=sessions[sessions.length-1].score,b=sessions[sessions.length-1].best;
    const reps=n(b.reps), weight=n(b.weight);
    if(last>first) return {label:'Improving',cls:'up',line,target:`Form temizse sıradaki hedef: ${weight}kg x ${reps+1}. RPE 8+ olursa aynı kiloda kaliteyi koru.`};
    if(last<first) return {label:'Fatigue / düşüş',cls:'down',line,target:`Sıradaki seans yükü zorlamadan ${weight}kg civarında temiz tekrar hedefle; ağrı varsa hacmi azalt.`};
    return {label:'Stable',cls:'flat',line,target:`Stabil gidiyor. Önce aynı kiloda +1 tekrar; rahat gelirse sonraki seans küçük kilo artışı.`};
  }
  function addPremiumGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex)return;
      card.querySelectorAll('.gymInsightBox').forEach(x=>x.remove());
      const best=bestSetForExercise(ex), tr=trendForExercise(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const bestDate=best&&best.date?fmtDate(best.date):'Kayıt biriktikçe oluşur';
      const html=`<div class="gymInsightBox premiumCoachInsight">
        <div class="premiumInsightCard"><small>Best Set</small><b>${esc(bestText)}</b><span>${esc(bestDate)}</span></div>
        <div class="premiumInsightCard"><small>Exercise Trend</small><b>${esc(tr.label)}</b><span>${esc(tr.line)}</span><span class="gymTrendPill premium ${esc(tr.cls)}">Son 3 kayıt</span></div>
        <div class="premiumInsightCard premiumCoachTarget"><small>Next Target</small><b>${esc(tr.target)}</b></div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function selectedWeekDays(){return typeof weekDates==='function'?weekDates():[];}
  function weeklyPremiumRecommendation(){
    const days=selectedWeekDays();
    const workouts=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actDays=new Set(acts.map(a=>a.date)).size;
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const painFlags=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean);
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let status='Data Building', verdict='Veri biriktikçe haftalık koç raporu daha keskinleşir.', next='Gelecek hafta 3-4 temiz kayıt oluştur; RPE/Form/Pain alanlarını dolu tut.';
    if(c.sets===0 && acts.length){status='Activity Week';verdict='Bu hafta gym yükü düşük, aktivite yükü mevcut. Sistem bunu aktif toparlanma/conditioning haftası gibi okuyor.';next='Gelecek hafta gym’e kontrollü dönüş: ilk ana hareketlerde RPE 6-7 bandını hedefle.';}
    else if(c.sets<14){status='Light Load';verdict='Gym yükü hafif tarafta. Ağrı sinyali yoksa gelişim için küçük progresyon alanı var.';next='1-2 ana harekette aynı kiloda +1 tekrar hedefle; form bozulursa hedefi sabitle.';}
    else if(c.sets<=28 && avgRpe<=8 && !painFlags){status='Productive';verdict='Hafta dengeli ve üretken görünüyor. Yük, RPE ve toparlanma tarafı final kullanım için iyi seviyede.';next='Programı koru; sadece en iyi hissettiren 1-2 harekette mikro progresyon uygula.';}
    else {status='Recovery Watch';verdict='Yük, RPE veya pain sinyalleri yüksek tarafa yaklaşıyor. Bu hafta kaliteyi korumak hacim artırmaktan daha değerli.';next='Gelecek hafta hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';}
    const focus=topPart[0]&&topPart[0]!=='-'?`${topPart[0]} baskın (${topPart[1]} set). Zayıf kalan bölgeleri kontrollü dengele.`:'Henüz net kas grubu odağı yok.';
    return {status,verdict,next,focus,gymDays,actDays,minutes:Math.round(minutes),avgRpe:avgRpe?avgRpe.toFixed(1):'-',painFlags,sets:c.sets,vol:Math.round(c.vol||0)};
  }
  function addPremiumWeeklyRecommendation(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap)return;
    const grid=wrap.querySelector('.weeklyPremiumGrid'); if(!grid)return;
    grid.querySelectorAll('.weeklyRecommendationCard').forEach(x=>x.remove());
    const r=weeklyPremiumRecommendation();
    grid.insertAdjacentHTML('beforeend',`<div class="weeklyPremiumCard weeklyRecommendationCard premiumWeeklyCoach">
      <div class="weeklyPremiumHead"><div><small>Premium Coach Recommendation</small><b>Gelecek hafta stratejisi</b></div><div class="weeklyPremiumPill">${esc(r.status)}</div></div>
      <div class="weeklyRecommendationBody">
        <div class="premiumCoachVerdict"><h4>Coach Verdict</h4><p>${esc(r.verdict)}<br><b>Odak:</b> ${esc(r.focus)}</p><div class="coachNextLine"><b>Next Week Target:</b> ${esc(r.next)}</div></div>
        <div class="premiumRecommendationGrid">
          <div class="weeklyRecommendationItem"><small>Gym</small><b>${r.gymDays} gün</b></div>
          <div class="weeklyRecommendationItem"><small>Activity</small><b>${r.actDays} gün / ${r.minutes} dk</b></div>
          <div class="weeklyRecommendationItem"><small>Avg RPE</small><b>${r.avgRpe}</b></div>
          <div class="weeklyRecommendationItem"><small>Pain Flags</small><b>${r.painFlags}</b></div>
          <div class="weeklyRecommendationItem premiumRecommendationItemWide"><small>Weekly Volume</small><b>${r.sets} set • ${r.vol.toLocaleString('tr-TR')} kg</b></div>
        </div>
      </div>
    </div>`);
  }
  function applyPremiumCoach(){
    try{addPremiumGymInsights();}catch(e){console.warn('premium gym insights',e)}
    try{addPremiumWeeklyRecommendation();}catch(e){console.warn('premium weekly recommendation',e)}
  }
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(applyPremiumCoach,0);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){prevWeekly();setTimeout(addPremiumWeeklyRecommendation,0);};
  }
  setTimeout(applyPremiumCoach,120);
  window.__simurgPremiumCoachInsightsV1=true;
})();
