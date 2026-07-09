
/* Program Intelligence Panel v1 */
(function(){
  const BUILD='Simurg OS Program Intelligence Panel v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function days(){return typeof weekDates==='function'?weekDates():[];}
  function st(){
    const ds=days();
    const workouts=ds.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>ds.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=ds.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['Data Building',0];
    return {ds,workouts,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays,topPart};
  }
  function recovery(x){
    let score=0;
    if(x.avgRpe>=8.5)score+=28; else if(x.avgRpe>=7.5)score+=16;
    if(x.c.sets>28)score+=24; else if(x.c.sets>22)score+=14;
    if(x.actMinutes>150)score+=18; else if(x.actMinutes>90)score+=10;
    if(x.activeCal>900)score+=12; else if(x.activeCal>500)score+=6;
    if(x.pain)score+=28;
    if(x.gymDays+x.actDays>=6)score+=12;
    score=Math.min(100,Math.round(score));
    if(score>=65)return {score,label:'High',cls:'risk',text:'Toparlanma borcu yüksek. Gelecek hafta hacmi azaltıp form/uyku kalitesini öne almak daha doğru.'};
    if(score>=35)return {score,label:'Moderate',cls:'warn',text:'Orta seviye yük birikimi var. Ana hareketlerde agresif artış yerine kontrollü mikro progresyon daha güvenli.'};
    return {score,label:'Low',cls:'good',text:'Toparlanma borcu düşük. Küçük progresyon için zemin uygun görünüyor.'};
  }
  function quality(x,d){
    let q=100;
    if(x.gymDays<2)q-=18; else if(x.gymDays>5)q-=10;
    if(x.c.sets<10)q-=12; else if(x.c.sets>32)q-=15;
    if(x.avgRpe>8.5)q-=18; else if(x.avgRpe && x.avgRpe<5.5)q-=8;
    if(x.pain)q-=22;
    if(d.score>65)q-=16; else if(d.score>35)q-=8;
    if(x.actDays>=1 && x.gymDays>=2)q+=4;
    q=Math.max(0,Math.min(100,Math.round(q)));
    const cls=q>=78?'good':q>=60?'warn':'risk';
    const label=q>=78?'High Quality':q>=60?'Manageable':'Needs Control';
    const text=q>=78?'Hafta dengeli ve sürdürülebilir. Kaliteyi koruyup küçük hedeflerle ilerle.':q>=60?'Genel yapı kullanılabilir ama yük, RPE veya ağrı sinyalini dikkatli yönet.':'Program kalitesi düşmüş görünüyor. Öncelik toparlanma, form ve düzenli kayıt olmalı.';
    return {q,cls,label,text};
  }
  function verdict(x,d,q){
    let status='Data Building', text='Veri biriktikçe haftalık karar desteği daha keskinleşir.', next='Gelecek hafta 3-4 temiz kayıt oluştur; RPE/Form/Pain alanlarını dolu tut.';
    if(x.c.sets===0 && x.acts.length){status='Activity Week';text='Bu hafta gym yükü düşük, activity yükü mevcut. Sistem bunu aktif toparlanma/conditioning haftası gibi okuyor.';next='Gym’e kontrollü dönüş: ilk ana hareketlerde RPE 6-7 bandını hedefle.';}
    else if(q.q>=78 && d.score<35){status='Productive';text='Hafta dengeli ve üretken. Yük, RPE ve toparlanma tarafı premium kullanım için iyi seviyede.';next='Programı koru; sadece en iyi hissettiren 1-2 harekette mikro progresyon uygula.';}
    else if(d.score>=65 || x.pain){status='Recovery Watch';text='Yük, RPE veya pain sinyalleri yüksek tarafa yaklaşıyor. Kaliteyi korumak hacim artırmaktan daha değerli.';next='Hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';}
    else if(x.c.sets<14){status='Light Load';text='Gym yükü hafif tarafta. Ağrı sinyali yoksa gelişim için küçük progresyon alanı var.';next='1-2 ana harekette aynı kiloda +1 tekrar hedefle.';}
    return {status,text,next};
  }
  function renderProgramIntelligence(){
    const wrap=document.getElementById('programReport'); if(!wrap)return;
    const x=st(), d=recovery(x), q=quality(x,d), v=verdict(x,d,q);
    const focus=x.c.sets?`${x.topPart[0]} baskın (${x.topPart[1]} set). Zayıf kalan bölgeleri kontrollü dengele.`:'Bu hafta için henüz net kas grubu odağı yok.';
    wrap.innerHTML=`<div class="programIntelPanelHero"><div class="programIntelHeroTop"><div><div class="programIntelHeroKicker">Premium Coach Dashboard</div><div class="programIntelHeroTitle">${esc(v.status)}</div><div class="programIntelHeroText">${esc(v.text)}</div></div><div class="programIntelHeroScore ${esc(q.cls)}"><div><strong>${q.q}</strong><span>Program Quality</span></div></div></div></div>
    <div class="programIntelPremiumGrid">
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Recovery Debt</small><b>${esc(d.label)}</b></div><div class="programIntelPremiumScore ${esc(d.cls)}">${d.score}</div></div><div class="programIntelPremiumText">${esc(d.text)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Avg RPE</small><b>${x.avgRpe?x.avgRpe.toFixed(1):'-'}</b></div><div class="programIntelMetric"><small>Activity</small><b>${Math.round(x.actMinutes)} dk</b></div></div></div>
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Program Quality</small><b>${esc(q.label)}</b></div><div class="programIntelPremiumScore ${esc(q.cls)}">${q.q}</div></div><div class="programIntelPremiumText">${esc(q.text)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Gym</small><b>${x.gymDays} gün</b></div><div class="programIntelMetric"><small>Pain</small><b>${x.pain}</b></div></div></div>
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Weekly Focus</small><b>${esc(x.c.sets?x.topPart[0]:'Data Building')}</b></div><div class="programIntelPremiumScore ${x.c.sets?'good':'warn'}">${x.c.sets}</div></div><div class="programIntelPremiumText">${esc(focus)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Volume</small><b>${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg</b></div><div class="programIntelMetric"><small>Active kcal</small><b>${Math.round(x.activeCal)}</b></div></div></div>
      <div class="programIntelPremiumCard wide"><div class="programIntelPremiumHead"><div><small>Coach Verdict</small><b>Gelecek hafta stratejisi</b></div><div class="programIntelPremiumScore ${esc(d.cls)}">🧭</div></div><div class="programIntelCoachBody"><div class="programIntelVerdictBox"><h3>${esc(v.status)}</h3>${esc(v.text)}<div class="programIntelNextBox"><b>Next Week Target:</b> ${esc(v.next)}</div></div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Gym Days</small><b>${x.gymDays}</b></div><div class="programIntelMetric"><small>Activity Days</small><b>${x.actDays}</b></div><div class="programIntelMetric"><small>Total Sets</small><b>${x.c.sets}</b></div><div class="programIntelMetric"><small>Weekly Volume</small><b>${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg</b></div></div></div></div>
    </div>`;
  }
  function cleanupWeekly(){
    document.querySelectorAll('#weeklyReport .programIntelGrid,#weeklyReport .weeklyRecommendationCard').forEach(x=>x.remove());
  }
  function updateBuild(){
    const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
    const sp=document.querySelector('.versionBadgeCard span'); if(sp)sp.textContent='Universal Import · Program Intelligence Panel · Monthly Review · Premium Coach Insights';
  }
  function apply(){try{cleanupWeekly();renderProgramIntelligence();updateBuild();}catch(e){console.warn('program intelligence panel',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,90);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function')window.renderWeeklyReport=function(){prevWeekly();setTimeout(apply,90);};
  setTimeout(apply,260);
  window.__simurgProgramIntelligencePanelV1=true;
})();
