
/* Simurg OS Smart Progression v1: readiness badges, auto next targets, week compare, monthly best progress */
(function(){
  if(window.__simurgSmartProgressionV1) return;
  window.__simurgSmartProgressionV1=true;
  const BUILD='Simurg OS Smart Progression v1';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>Number(String(v??'').replace(',','.'))||0;
  const iso=d=>{const x=new Date(d); x.setHours(12,0,0,0); return x.toISOString().slice(0,10)};
  const add=(d,n)=>{const x=typeof parseDate==='function'?parseDate(d):new Date(d); x.setDate(x.getDate()+n); return iso(x)};
  const dateVal=d=>{const x=typeof parseDate==='function'?parseDate(d):new Date(d); return +x||0};
  const weekList=start=>Array.from({length:7},(_,i)=>add(start,i));
  function getCurrentWeekStart(){try{return typeof weekStart!=='undefined'?weekStart:(typeof mondayOf==='function'?mondayOf(new Date().toISOString().slice(0,10)):iso(new Date()))}catch(e){return iso(new Date())}}
  function getSelectedDate(){try{return typeof selectedDate!=='undefined'?selectedDate:iso(new Date())}catch(e){return iso(new Date())}}
  function rowsForExercise(ex){return ((DATA&&DATA.workouts)||[]).filter(w=>String(w.exercise||'').trim().toLowerCase()===String(ex||'').trim().toLowerCase()).sort((a,b)=>dateVal(a.date)-dateVal(b.date));}
  function bestSet(rows){
    let best=null;
    (rows||[]).forEach(w=>{const wt=num(w.weight), rp=num(w.reps); const score=wt*(1+rp/30); if(!best||score>best.score) best={weight:wt,reps:rp,score,row:w,text:`${wt%1?wt.toFixed(1):wt}kg x ${rp}`};});
    return best;
  }
  function fmtSet(s){return !s?'-':`${s.weight%1?s.weight.toFixed(1):s.weight}kg x ${s.reps}`;}
  function sessionBest(ex,date){return bestSet(((DATA&&DATA.workouts)||[]).filter(w=>w.date===date && String(w.exercise||'').trim().toLowerCase()===String(ex||'').trim().toLowerCase()));}
  function sessionGroups(ex,untilDate){
    const groups={};
    rowsForExercise(ex).forEach(w=>{if(untilDate && dateVal(w.date)>dateVal(untilDate)) return; (groups[w.date]=groups[w.date]||[]).push(w);});
    return Object.keys(groups).sort((a,b)=>dateVal(b)-dateVal(a)).map(d=>({date:d, best:bestSet(groups[d]), rows:groups[d]})).filter(x=>x.best);
  }
  function latestCoachFlags(ex){
    const rows=rowsForExercise(ex).filter(w=>w.rpe||w.form||w.pain).sort((a,b)=>dateVal(b.date)-dateVal(a.date));
    const r=rows[0]||{}; return {rpe:num(r.rpe), form:String(r.form||''), pain:String(r.pain||'None')};
  }
  function readiness(ex,date){
    const groups=sessionGroups(ex,date).slice(0,3); const flags=latestCoachFlags(ex);
    if(flags.pain==='Warning') return {cls:'deload',label:'Deload Watch',icon:'🔴',reason:'Pain warning'};
    if(flags.pain==='Mild'||flags.form==='Bad') return {cls:'form',label:'Form First',icon:'🟠',reason:'Form/pain signal'};
    if(!groups.length) return {cls:'recovery',label:'Data Building',icon:'🔵',reason:'First clean record'};
    if(groups.length===1) return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'Need 2+ sessions'};
    const latest=groups[0].best.score, prev=groups.slice(1).reduce((s,g)=>s+g.best.score,0)/(groups.length-1);
    const diff=prev?((latest-prev)/prev)*100:0;
    if(flags.rpe>=9) return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'High RPE'};
    if(diff>4 && flags.rpe<=8) return {cls:'ready',label:'Ready to Progress',icon:'🟢',reason:`Trend +${diff.toFixed(1)}%`};
    if(diff<-5) return {cls:'deload',label:'Recovery Check',icon:'🔴',reason:`Trend ${diff.toFixed(1)}%`};
    return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'Stable trend'};
  }
  function nextTarget(ex,date){
    DATA.autoNextTargets=DATA.autoNextTargets||{};
    const saved=DATA.autoNextTargets[ex];
    const cur=sessionBest(ex,date), groups=sessionGroups(ex,date), last=cur||groups[0]?.best||null, flags=latestCoachFlags(ex), rd=readiness(ex,date);
    let text='İlk temiz seti kaydet; sonra sistem hedefi netleştirsin.';
    if(last){
      const wt=last.weight, rp=last.reps;
      if(rd.cls==='deload'||flags.pain==='Warning') text=`${fmtSet(last)} seviyesinde kal; form ve ağrıyı kontrol et.`;
      else if(flags.rpe>=9) text=`${fmtSet(last)} tekrarını koru; RPE düşmeden artış yapma.`;
      else if(rp>=10) text=`${(wt+2.5).toFixed(1).replace('.0','')}kg x 8 hedefle.`;
      else text=`${wt%1?wt.toFixed(1):wt}kg x ${rp+1} hedefle.`;
    }
    if(saved&&saved.text&&!cur) text=saved.text;
    return {text, saved};
  }
  function updateStoredTarget(ex,date){
    if(!ex) return; DATA.autoNextTargets=DATA.autoNextTargets||{};
    const nt=nextTarget(ex,date); DATA.autoNextTargets[ex]={text:nt.text,date:new Date().toISOString(),sourceDate:date};
    try{localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));}catch(e){}
  }
  function addGymBadges(){
    const date=getSelectedDate();
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=(card.getAttribute('data-current-name')||card.querySelector('.gymExerciseName')?.value||'').trim(); if(!ex) return;
      card.querySelectorAll('.gymSmartBadgeRow,.gymSmartAutoTarget').forEach(x=>x.remove());
      const rd=readiness(ex,date), nt=nextTarget(ex,date), best=bestSet(rowsForExercise(ex));
      const row=document.createElement('div'); row.className='gymSmartBadgeRow';
      row.innerHTML=`<span class="gymSmartBadge ${rd.cls}">${rd.icon} ${esc(rd.label)}</span><span class="gymSmartBadge">🏆 Best ${esc(fmtSet(best))}</span><span class="gymSmartBadge">📈 ${esc(rd.reason)}</span>`;
      const target=document.createElement('div'); target.className='gymSmartAutoTarget'; target.innerHTML=`<b>Auto Next:</b> ${esc(nt.text)}`;
      const note=card.querySelector('.gymProgramNote')||card.querySelector('.gymCardHead');
      if(note&&note.parentNode){note.insertAdjacentElement('afterend',row); row.insertAdjacentElement('afterend',target);} else {card.insertBefore(row,card.firstChild); row.insertAdjacentElement('afterend',target);}
    });
  }
  const oldGym=window.renderGymMode;
  if(typeof oldGym==='function') window.renderGymMode=function(){oldGym.apply(this,arguments); setTimeout(addGymBadges,0);};
  const oldSaveGym=window.saveGymExercise;
  if(typeof oldSaveGym==='function') window.saveGymExercise=function(key){
    const date=getSelectedDate(); let ex='';
    try{const card=document.querySelector(`.gymCard[data-gym-key="${String(key).replace(/"/g,'\\"')}"]`); ex=(card?.querySelector('.gymExerciseName')?.value||card?.getAttribute('data-current-name')||'').trim();}catch(e){}
    const ret=oldSaveGym.apply(this,arguments);
    setTimeout(()=>{try{if(ex)updateStoredTarget(ex,date); addGymBadges();}catch(e){}},80);
    return ret;
  };
  function weekStats(start){
    const ds=weekList(start); const workouts=((DATA&&DATA.workouts)||[]).filter(w=>ds.includes(w.date));
    const acts=((DATA&&DATA.appleWatch)||[]).filter(a=>ds.includes(a.date));
    const c=typeof calc==='function'?calc(workouts):{sets:workouts.length,reps:workouts.reduce((s,w)=>s+num(w.reps),0),vol:workouts.reduce((s,w)=>s+num(w.reps)*num(w.weight),0)};
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const rpes=workouts.map(w=>num(w.rpe)).filter(Boolean).concat(acts.map(a=>num(a.rpe)).filter(Boolean));
    return {sets:c.sets||0,vol:c.vol||0,minutes,activityDays:new Set(acts.map(a=>a.date)).size,gymDays:new Set(workouts.map(w=>w.date)).size,avgRpe:rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0};
  }
  function delta(cur,prev,key){const a=cur[key]||0,b=prev[key]||0; if(!b&&a)return '+new'; if(!b&&!a)return '0'; const d=((a-b)/b)*100; return `${d>=0?'+':''}${d.toFixed(0)}%`;}
  function renderWeekCompare(){
    const wrap=document.getElementById('programReport'); if(!wrap) return;
    wrap.querySelectorAll('.programIntelDeltaCard').forEach(x=>x.remove());
    const start=getCurrentWeekStart(), prev=add(start,-7), cur=weekStats(start), old=weekStats(prev);
    const volD=delta(cur,old,'vol'), setD=delta(cur,old,'sets'), minD=delta(cur,old,'minutes'), rpeD=cur.avgRpe&&old.avgRpe?`${(cur.avgRpe-old.avgRpe)>=0?'+':''}${(cur.avgRpe-old.avgRpe).toFixed(1)}`:'-';
    const trend=(cur.vol>old.vol*1.12&&cur.sets>=old.sets)?{cls:'good',label:'Progressing'}:(cur.vol<old.vol*.85?{cls:'warn',label:'Lower Load'}:{cls:'good',label:'Stable'});
    const text=trend.label==='Progressing'?'Bu hafta hacim artışı kontrollü ilerliyor. RPE ve pain düşük kalırsa mikro progresyon mantıklı.':trend.label==='Lower Load'?'Bu hafta yük düşmüş. Bilinçli recovery haftasıysa iyi; değilse bir sonraki hafta düzenli kayıt hedefle.':'Haftalık yük dengeli görünüyor. Kaliteyi koruyarak küçük hedeflerle devam et.';
    const html=`<div class="programIntelDeltaCard"><div class="programIntelDeltaHead"><div><small>This Week vs Last Week</small><b>Haftalık değişim analizi</b></div><div class="programIntelDeltaPill ${trend.cls}">${trend.label}</div></div><div class="programIntelDeltaGrid"><div class="programIntelDeltaMetric"><small>Volume</small><b>${volD}</b></div><div class="programIntelDeltaMetric"><small>Sets</small><b>${setD}</b></div><div class="programIntelDeltaMetric"><small>Activity Min</small><b>${minD}</b></div><div class="programIntelDeltaMetric"><small>Avg RPE</small><b>${rpeD}</b></div></div><div class="programIntelDeltaText">${esc(text)}</div></div>`;
    const grid=wrap.querySelector('.programIntelPremiumGrid'); if(grid) grid.insertAdjacentHTML('afterbegin',html); else wrap.insertAdjacentHTML('beforeend',html);
  }
  function monthKeyFromSelected(){const d=getSelectedDate(); return String(d||'').slice(0,7);}
  function monthlyBestProgress(){
    const ym=monthKeyFromSelected(); const rows=((DATA&&DATA.workouts)||[]).filter(w=>String(w.date||'').slice(0,7)===ym&&w.exercise);
    const by={}; rows.forEach(w=>(by[w.exercise]=by[w.exercise]||[]).push(w));
    let best=null, stable=null, attention=null;
    Object.entries(by).forEach(([ex,arr])=>{
      const dates=[...new Set(arr.map(w=>w.date))].sort((a,b)=>dateVal(a)-dateVal(b)); if(!dates.length)return;
      const first=bestSet(arr.filter(w=>w.date===dates[0])), last=bestSet(arr.filter(w=>w.date===dates[dates.length-1])), allBest=bestSet(arr);
      const diff=(first&&last&&first.score)?((last.score-first.score)/first.score)*100:0;
      const pain=arr.filter(w=>String(w.pain||'None')!=='None').length;
      const obj={ex,diff,dates:dates.length,best:allBest,pain};
      if(!best||obj.diff>best.diff) best=obj;
      if(dates.length>=2 && (!stable||Math.abs(obj.diff)<Math.abs(stable.diff))) stable=obj;
      if(pain && (!attention||pain>attention.pain)) attention=obj;
    });
    return {ym,best,stable,attention};
  }
  function renderMonthlyBest(){
    const wrap=document.getElementById('monthlyReport'); if(!wrap)return;
    wrap.querySelectorAll('.monthlyBestProgressCard').forEach(x=>x.remove());
    const m=monthlyBestProgress();
    const label=m.best?`${m.best.diff>=0?'+':''}${m.best.diff.toFixed(1)}%`:'Data'; const cls=m.best&&m.best.diff>0?'good':'warn';
    const text=m.best?`Ayın en iyi gelişen hareketi ${m.best.ex}. En iyi set: ${fmtSet(m.best.best)}. Bu hareket için progresyon kalitesi yüksekse gelecek ay mikro artış mantıklı.`:'Bu ay için en iyi gelişen hareketi hesaplamak adına daha fazla kayıt gerekiyor.';
    const html=`<div class="monthlyBestProgressCard"><div class="monthlyBestProgressHead"><div><small>Best Progress Movement</small><b>${esc(m.best?m.best.ex:'Data Building')}</b></div><div class="monthlyBestProgressPill ${cls}">${esc(label)}</div></div><div class="monthlyBestProgressText">${esc(text)}</div><div class="monthlyBestProgressStats"><div class="monthlyBestProgressStat"><small>Best Set</small><b>${esc(m.best?fmtSet(m.best.best):'-')}</b></div><div class="monthlyBestProgressStat"><small>Stable Movement</small><b>${esc(m.stable?m.stable.ex:'-')}</b></div><div class="monthlyBestProgressStat"><small>Attention</small><b>${esc(m.attention?m.attention.ex:'No pain flag')}</b></div></div></div>`;
    wrap.insertAdjacentHTML('beforeend',html);
  }
  function updateBuild(){try{const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD; const s=document.querySelector('.versionBadgeCard span'); if(s)s.textContent='Smart Progression · Readiness Badges · Auto Next Targets · Week Compare · Best Progress';}catch(e){}}
  function apply(){try{addGymBadges();renderWeekCompare();renderMonthlyBest();updateBuild();}catch(e){console.warn('smart progression apply',e)}}
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(){oldRender.apply(this,arguments); setTimeout(apply,180);};
  const oldShow=window.show; if(typeof oldShow==='function') window.show=function(){const r=oldShow.apply(this,arguments); setTimeout(apply,180); return r;};
  setTimeout(apply,500);
})();
