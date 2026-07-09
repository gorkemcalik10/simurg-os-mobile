
/* Simurg OS Program Intelligence v1: Undo Import, Exercise Readiness, Recovery Debt, Program Quality, Monthly Review */
(function(){
  const BUILD='Simurg OS Program Intelligence v1';
  const SNAP_KEY='simurg_last_import_snapshot_v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function clone(obj){return JSON.parse(JSON.stringify(obj||{}));}
  function countData(d){
    d=d||{};
    return {
      workouts:(d.workouts||[]).length,
      watch:(d.appleWatch||[]).length,
      daily:(d.dailyNotes||[]).length,
      weekly:(d.weeklyNotes||[]).length,
      activityNotes:d.activityNotes?Object.keys(d.activityNotes).length:0
    };
  }
  function changed(a,b){return JSON.stringify(countData(a))!==JSON.stringify(countData(b));}
  function setUndoStatus(msg){
    const el=document.getElementById('undoImportMiniStatus');
    if(el) el.textContent=msg||'';
  }
  function snapshotBeforeImport(before){
    try{
      const meta={at:new Date().toISOString(),counts:countData(before),selectedDate:window.selectedDate||''};
      localStorage.setItem(SNAP_KEY,JSON.stringify({meta,data:before}));
    }catch(e){console.warn('undo snapshot failed',e)}
  }
  window.undoLastImport=function(){
    try{
      const raw=localStorage.getItem(SNAP_KEY);
      if(!raw){alert('Geri alınacak son import kaydı yok.');return;}
      const snap=JSON.parse(raw);
      const time=snap.meta&&snap.meta.at?new Date(snap.meta.at).toLocaleString('tr-TR'):'son import';
      if(!confirm('Son Universal Import geri alınacak.\nSnapshot zamanı: '+time+'\nDevam edelim mi?')) return;
      window.DATA=snap.data;
      DATA=window.DATA;
      if(!DATA.appleWatch) DATA.appleWatch=[];
      if(!DATA.dailyNotes) DATA.dailyNotes=[];
      if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
      if(!DATA.customGymPrograms) DATA.customGymPrograms={};
      if(!DATA.programNames) DATA.programNames={};
      if(!DATA.activityNotes) DATA.activityNotes={};
      if(snap.meta&&snap.meta.selectedDate) selectedDate=snap.meta.selectedDate;
      localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
      localStorage.removeItem(SNAP_KEY);
      if(typeof render==='function') render();
      setUndoStatus('Son import geri alındı.');
      alert('Son import geri alındı.');
    }catch(e){alert('Undo başarısız: '+e.message);}
  };
  function enhanceUniversalImportUI(){
    const card=document.querySelector('.universalImportCard'); if(!card) return;
    const actions=card.querySelector('.actions'); if(!actions) return;
    if(!document.getElementById('undoLastImportBtn')){
      actions.insertAdjacentHTML('beforeend',`<button id="undoLastImportBtn" class="btn sec undoImportBtn" onclick="undoLastImport()">Undo Last Import</button><div id="undoImportMiniStatus" class="undoImportMiniStatus"></div>`);
    }
    const raw=localStorage.getItem(SNAP_KEY);
    if(raw){
      try{const s=JSON.parse(raw); const t=s.meta&&s.meta.at?new Date(s.meta.at).toLocaleString('tr-TR'):''; setUndoStatus(t?`Geri alınabilir son import: ${t}`:'Son import geri alınabilir.');}catch(e){}
    }else setUndoStatus('');
  }
  const originalUniversal=window.universalImport;
  if(typeof originalUniversal==='function' && !window.__simurgUndoUniversalWrapped){
    window.universalImport=function(){
      const before=clone(window.DATA||DATA);
      const beforeCounts=JSON.stringify(countData(before));
      originalUniversal.apply(this,arguments);
      setTimeout(()=>{
        try{
          const after=window.DATA||DATA;
          if(beforeCounts!==JSON.stringify(countData(after))){
            snapshotBeforeImport(before);
            enhanceUniversalImportUI();
          }
        }catch(e){}
      },30);
    };
    window.__simurgUndoUniversalWrapped=true;
  }

  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSet(ex){const rows=rowsForExercise(ex);return rows.length?rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volSet(b)-volSet(a))[0]:null;}
  function sessions(ex){
    const by={}; rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volSet(b)-volSet(a))[0];
      const rpes=sets.map(x=>n(x.rpe)).filter(Boolean);
      const pain=sets.some(x=>String(x.pain||'None')!=='None');
      const badForm=sets.some(x=>/poor|bad|zayıf|kötü|orta/i.test(String(x.form||'')));
      return {date,sets,best,score:scoreSet(best),avgRpe:rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0,pain,badForm};
    });
  }
  function readiness(ex){
    const s=sessions(ex).slice(-3);
    if(!s.length) return {label:'Data Building',cls:'empty',target:'İlk temiz kaydı oluştur.',reason:'Henüz hareket geçmişi yok.'};
    const last=s[s.length-1], first=s[0], b=last.best;
    const pain=s.some(x=>x.pain), badForm=s.some(x=>x.badForm), highRpe=s.some(x=>x.avgRpe>=9);
    if(pain) return {label:'Deload Watch',cls:'deload',target:'Yükü zorlamadan ağrı sinyalini takip et.',reason:'Son kayıtlarda pain işareti var.'};
    if(badForm) return {label:'Form First',cls:'form',target:'Aynı yükte daha temiz form hedefle.',reason:'Form kalitesi önce gelmeli.'};
    if(highRpe) return {label:'Hold Load',cls:'hold',target:'Aynı kiloda temiz tekrar; RPE 7-8 bandını ara.',reason:'RPE yüksek tarafa çıkmış.'};
    if(s.length>1 && last.score>first.score) return {label:'Ready to Progress',cls:'ready',target:`Next: ${n(b.weight)}kg x ${n(b.reps)+1}`,reason:'Trend yukarı ve risk sinyali düşük.'};
    if(s.length>1 && last.score<first.score) return {label:'Recovery Check',cls:'hold',target:'Bugün progresyon değil kalite hedefle.',reason:'Son 3 kayıtta düşüş var.'};
    return {label:'Hold Load',cls:'hold',target:'Aynı kiloda +1 temiz tekrar hedefle.',reason:'Trend stabil; küçük tekrar artışı uygun.'};
  }
  function applyExerciseReadiness(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||''; if(!ex) return;
      card.querySelectorAll('.gymCompactInsight').forEach(x=>x.remove());
      const best=bestSet(ex), rd=readiness(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const html=`<div class="gymCompactInsight">
        <div class="gymCompactInsightTop">
          <div class="gymCompactInsightTitle">Coach Insight</div>
          <div class="gymCompactInsightMeta">
            <span class="gymCompactPill"><small>Best</small>${esc(bestText)}</span>
            <span class="gymCompactPill ${esc(rd.cls)}"><small>Ready</small>${esc(rd.label)}</span>
          </div>
        </div>
        <div class="gymCompactTarget"><b>Next Target:</b> ${esc(rd.target)} <span style="color:#7f90a8">${esc(rd.reason)}</span></div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }

  function currentWeekDays(){return typeof weekDates==='function'?weekDates():[];}
  function weekStats(){
    const days=currentWeekDays();
    const workouts=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    return {days,workouts,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays};
  }
  function recoveryDebt(st){
    let score=0;
    if(st.avgRpe>=8.5)score+=28; else if(st.avgRpe>=7.5)score+=16;
    if(st.c.sets>28)score+=24; else if(st.c.sets>22)score+=14;
    if(st.actMinutes>150)score+=18; else if(st.actMinutes>90)score+=10;
    if(st.activeCal>900)score+=12; else if(st.activeCal>500)score+=6;
    if(st.pain)score+=28;
    if(st.gymDays+st.actDays>=6)score+=12;
    score=Math.min(100,Math.round(score));
    let label='Low', cls='good', text='Toparlanma borcu düşük. Küçük progresyon için zemin uygun.';
    if(score>=65){label='High';cls='risk';text='Toparlanma borcu yüksek. Gelecek hafta hacmi azaltıp form/uyku kalitesini öne al.';}
    else if(score>=35){label='Moderate';cls='warn';text='Orta seviye yük birikimi var. Ana hareketlerde agresif artış yerine kontrollü mikro progresyon daha doğru.';}
    return {score,label,cls,text};
  }
  function qualityScore(st,debt){
    let q=100;
    if(st.gymDays<2)q-=18; else if(st.gymDays>5)q-=10;
    if(st.c.sets<10)q-=12; else if(st.c.sets>32)q-=15;
    if(st.avgRpe>8.5)q-=18; else if(st.avgRpe && st.avgRpe<5.5)q-=8;
    if(st.pain)q-=22;
    if(debt.score>65)q-=16; else if(debt.score>35)q-=8;
    if(st.actDays>=1 && st.gymDays>=2)q+=4;
    q=Math.max(0,Math.min(100,Math.round(q)));
    let cls=q>=78?'good':q>=60?'warn':'risk';
    let label=q>=78?'High Quality':q>=60?'Manageable':'Needs Control';
    let text=q>=78?'Hafta dengeli ve sürdürülebilir. Kaliteyi koruyup küçük hedeflerle ilerle.':q>=60?'Genel yapı kullanılabilir ama yük, RPE veya ağrı sinyalini dikkatli yönet.':'Program kalitesi düşmüş görünüyor. Öncelik toparlanma, form ve düzenli kayıt olmalı.';
    return {q,cls,label,text};
  }
  function monthlyStats(){
    const base=(window.selectedDate||new Date().toISOString().slice(0,10));
    const ym=String(base).slice(0,7);
    const workouts=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.date||'').startsWith(ym));
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>String(a.date||'').startsWith(ym));
    const days=new Set(workouts.map(w=>w.date));
    const actDays=new Set(acts.map(a=>a.date));
    const c=typeof calc==='function'?calc(workouts):{sets:0,vol:0,parts:{}};
    const exCount={}; workouts.forEach(w=>{const ex=w.exercise||'Unknown';exCount[ex]=(exCount[ex]||0)+1;});
    const topEx=Object.entries(exCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let verdict='Veri biriktikçe aylık değerlendirme daha anlamlı olacak.';
    if(days.size>=8 && !pain) verdict='Ay düzenli ve temiz ilerliyor. Ana hedef: sürdürülebilir progresyon.';
    else if(pain) verdict='Ay içinde pain sinyali var. Gelecek blokta yükten önce hareket kalitesi takip edilmeli.';
    else if(days.size<4 && acts.length) verdict='Gym az, activity mevcut. Bu ay daha çok conditioning/recovery karakteri taşıyor.';
    return {ym,days:days.size,actDays:actDays.size,sets:c.sets,vol:Math.round(c.vol||0),topEx:topEx[0],topPart:topPart[0],pain,minutes:Math.round(minutes),verdict};
  }
  function addProgramIntelligence(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap) return;
    wrap.querySelectorAll('.programIntelGrid').forEach(x=>x.remove());
    const st=weekStats(), debt=recoveryDebt(st), qs=qualityScore(st,debt), m=monthlyStats();
    const html=`<div class="programIntelGrid">
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Recovery Debt</small><b>${esc(debt.label)}</b></div><div class="programIntelScore ${esc(debt.cls)}">${debt.score}</div></div>
        <div class="programIntelText">${esc(debt.text)}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Avg RPE</small><b>${st.avgRpe?st.avgRpe.toFixed(1):'-'}</b></div><div class="programIntelMini"><small>Activity</small><b>${Math.round(st.actMinutes)} dk</b></div></div>
      </div>
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Program Quality</small><b>${esc(qs.label)}</b></div><div class="programIntelScore ${esc(qs.cls)}">${qs.q}</div></div>
        <div class="programIntelText">${esc(qs.text)}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Gym</small><b>${st.gymDays} gün</b></div><div class="programIntelMini"><small>Pain</small><b>${st.pain}</b></div></div>
      </div>
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Weekly Focus</small><b>${st.c.sets?esc((Object.entries(st.c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-'])[0]):'Data Building'}</b></div><div class="programIntelScore ${st.c.sets?'good':'warn'}">${st.c.sets}</div></div>
        <div class="programIntelText">${st.c.sets?`Bu hafta ${st.c.sets} set ve ${Math.round(st.c.vol||0).toLocaleString('tr-TR')} kg hacim kaydedildi.`:'Bu hafta için henüz yeterli gym verisi yok.'}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Volume</small><b>${Math.round(st.c.vol||0).toLocaleString('tr-TR')} kg</b></div><div class="programIntelMini"><small>Active kcal</small><b>${Math.round(st.activeCal)}</b></div></div>
      </div>
      <div class="programIntelCard monthlyReviewCard">
        <div class="programIntelHead"><div><small>Monthly Review</small><b>${esc(m.ym)} blok özeti</b></div><div class="programIntelScore ${m.pain?'warn':'good'}">${m.days}</div></div>
        <div class="programIntelText">${esc(m.verdict)}</div>
        <div class="monthlyReviewList">
          <div class="monthlyReviewItem"><small>Gym Days</small><b>${m.days}</b></div>
          <div class="monthlyReviewItem"><small>Activity Days</small><b>${m.actDays}</b></div>
          <div class="monthlyReviewItem"><small>Total Sets</small><b>${m.sets}</b></div>
          <div class="monthlyReviewItem"><small>Volume</small><b>${m.vol.toLocaleString('tr-TR')} kg</b></div>
          <div class="monthlyReviewItem"><small>Top Exercise</small><b>${esc(m.topEx)}</b></div>
          <div class="monthlyReviewItem"><small>Top Focus</small><b>${esc(m.topPart)}</b></div>
          <div class="monthlyReviewItem"><small>Activity Time</small><b>${m.minutes} dk</b></div>
          <div class="monthlyReviewItem"><small>Pain Flags</small><b>${m.pain}</b></div>
        </div>
      </div>
    </div>`;
    wrap.insertAdjacentHTML('beforeend',html);
  }
  function updateBuildBadge(){
    const b=document.querySelector('.versionBadgeCard b'); if(b) b.textContent=BUILD;
    const s=document.querySelector('.versionBadgeCard span'); if(s) s.textContent='Universal Import · Undo · Exercise Readiness · Recovery Debt · Program Quality · Monthly Review';
  }
  function applyAll(){
    try{enhanceUniversalImportUI();}catch(e){}
    try{applyExerciseReadiness();}catch(e){console.warn('exercise readiness',e)}
    try{addProgramIntelligence();}catch(e){console.warn('program intelligence',e)}
    try{updateBuildBadge();}catch(e){}
  }
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(applyAll,60);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){prevWeekly();setTimeout(addProgramIntelligence,60);};
  }
  setTimeout(applyAll,240);
  window.__simurgProgramIntelligenceV1=true;
})();
