
(function(){
  if(window.__simurgMonthlyReviewPanelV1) return;
  window.__simurgMonthlyReviewPanelV1=true;
  function esc2(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function durMin(v){
    if(typeof durationMinutes==='function') return durationMinutes(v);
    const s=String(v||''); const p=s.split(':').map(Number);
    if(p.length>=2 && p.every(n=>!isNaN(n))) return p[0]+p[1]/60;
    const n=parseFloat(s); return isNaN(n)?0:n;
  }
  function monthlyStatsStandalone(){
    const base=(window.selectedDate||new Date().toISOString().slice(0,10));
    const ym=String(base).slice(0,7);
    const workouts=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.date||'').startsWith(ym));
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>String(a.date||'').startsWith(ym));
    const gymDays=new Set(workouts.map(w=>w.date));
    const actDays=new Set(acts.map(a=>a.date));
    const sets=workouts.length;
    const reps=workouts.reduce((s,w)=>s+(+w.reps||0),0);
    const vol=Math.round(workouts.reduce((s,w)=>s+((+w.weight||0)*(+w.reps||0)),0));
    const exCount={}, partCount={};
    workouts.forEach(w=>{const ex=w.exercise||'Unknown'; exCount[ex]=(exCount[ex]||0)+1; const bp=w.bodyPart||(typeof part==='function'?part(w.exercise):'Other'); partCount[bp]=(partCount[bp]||0)+1;});
    const topEx=Object.entries(exCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const topPart=Object.entries(partCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const minutes=Math.round(acts.reduce((s,a)=>s+durMin(a.duration),0));
    const activeCal=Math.round(acts.reduce((s,a)=>s+(+a.activeCal||+a.active||0),0));
    const avgRpeVals=workouts.concat(acts).map(x=>+x.rpe||0).filter(Boolean);
    const avgRpe=avgRpeVals.length?(avgRpeVals.reduce((a,b)=>a+b,0)/avgRpeVals.length):0;
    let verdict='Veri biriktikçe aylık değerlendirme daha anlamlı olacak.';
    let coach='Bu ay için temel hedef: kayıt düzenini koru, ağrı sinyalini düşük tut ve progresyonu küçük adımlarla yönet.';
    if(gymDays.size>=8 && !pain && avgRpe<=8){verdict='Ay düzenli ve sürdürülebilir ilerliyor.'; coach='Bir sonraki blokta ana hareketlerde küçük tekrar artışı veya kontrollü kilo artışı denenebilir.';}
    else if(pain){verdict='Ay içinde pain sinyali var.'; coach='Gelecek blokta öncelik yük artışı değil; form kalitesi, ağrı takibi ve gerekirse deload olmalı.';}
    else if(gymDays.size<4 && acts.length){verdict='Gym hacmi düşük, activity tarafı daha baskın.'; coach='Bir sonraki ayda gym günlerini daha düzenli sabitlemek program kalitesini artırır.';}
    else if(minutes>240 && gymDays.size>=6){verdict='Gym ve activity yükü birlikte anlamlı seviyede.'; coach='Recovery debt birikmemesi için zor günlerden sonra daha kontrollü seans planla.';}
    return {ym,gymDays:gymDays.size,actDays:actDays.size,sets,reps,vol,topEx:topEx[0],topPart:topPart[0],pain,minutes,activeCal,avgRpe,verdict,coach};
  }
  window.renderMonthlyReviewPanel=function(){
    const wrap=document.getElementById('monthlyReport');
    if(!wrap) return;
    const m=monthlyStatsStandalone();
    const score=Math.max(0,Math.min(100, Math.round(62 + Math.min(m.gymDays,12)*2 + Math.min(m.actDays,8) - m.pain*7 - (m.avgRpe>8?8:0))));
    wrap.innerHTML=`<div class="monthlyStandaloneHero">
      <div class="monthlyStandaloneHead"><div><small>Monthly Review</small><b>${esc2(m.ym)} blok özeti</b></div><div class="monthlyStandaloneScore"><strong>${score}</strong><span>Quality</span></div></div>
      <div class="monthlyStandaloneText">${esc2(m.verdict)}</div>
      <div class="monthlyStandaloneGrid">
        <div class="monthlyStandaloneItem"><small>Gym Days</small><b>${m.gymDays}</b></div>
        <div class="monthlyStandaloneItem"><small>Activity Days</small><b>${m.actDays}</b></div>
        <div class="monthlyStandaloneItem"><small>Total Sets</small><b>${m.sets}</b></div>
        <div class="monthlyStandaloneItem"><small>Volume</small><b>${m.vol.toLocaleString('tr-TR')} kg</b></div>
        <div class="monthlyStandaloneItem"><small>Top Exercise</small><b>${esc2(m.topEx)}</b></div>
        <div class="monthlyStandaloneItem"><small>Top Focus</small><b>${esc2(m.topPart)}</b></div>
        <div class="monthlyStandaloneItem"><small>Activity Time</small><b>${m.minutes} dk</b></div>
        <div class="monthlyStandaloneItem"><small>Pain Flags</small><b>${m.pain}</b></div>
      </div>
      <div class="monthlyStandaloneCoach"><b>Coach note:</b> ${esc2(m.coach)}</div>
    </div>`;
  };
  function cleanupWeeklyMonthly(){document.querySelectorAll('#weeklyReport .monthlyReviewCard').forEach(x=>x.remove());}
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); setTimeout(()=>{try{cleanupWeeklyMonthly();renderMonthlyReviewPanel();}catch(e){}},80); };
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function') window.renderWeeklyReport=function(){prevWeekly();setTimeout(cleanupWeeklyMonthly,90);};
  setTimeout(()=>{try{cleanupWeeklyMonthly();renderMonthlyReviewPanel();}catch(e){}},260);
})();
