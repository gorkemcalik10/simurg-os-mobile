
/* Simurg OS Data Health + Copy Weekly Coach Report v1 */
(function(){
  const BUILD='Simurg OS Data Health + Coach Report v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function validDate(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''));}
  function dmins(d){try{return typeof durationMinutes==='function'?durationMinutes(d):0;}catch(e){return 0;}}
  function workouts(){return (window.DATA&&Array.isArray(DATA.workouts))?DATA.workouts:[];}
  function activities(){return (window.DATA&&Array.isArray(DATA.appleWatch))?DATA.appleWatch:[];}
  function injectDataHealthCard(){
    const data=document.getElementById('data');
    if(!data || document.getElementById('dataHealthCard')) return;
    const local=data.querySelector('.localStatusCard');
    const card=document.createElement('div');
    card.className='card dataHealthCard';
    card.id='dataHealthCard';
    card.innerHTML=`<h2>Data Health Check</h2><div class="sub">Netlify final öncesi kayıtların tarih, boş alan, mantıksız kalori ve olası duplicate durumlarını hızlı kontrol eder.</div><div class="actions"><button class="btn" onclick="runDataHealthCheck()">Check Data Health</button></div><div id="dataHealthResult" class="dataHealthResult"><div class="dataHealthIssue ok">Henüz kontrol yapılmadı. Check Data Health ile tarama başlat.</div></div>`;
    if(local&&local.parentNode)local.insertAdjacentElement('afterend',card); else data.appendChild(card);
  }
  function analyzeDataHealth(){
    const ws=workouts(), acts=activities();
    const critical=[], warnings=[];
    ws.forEach((w,i)=>{
      const label=`Workout #${i+1}${w.date?' · '+w.date:''}`;
      if(!validDate(w.date)) critical.push(`${label}: tarih formatı hatalı veya boş.`);
      if(!String(w.exercise||'').trim()) critical.push(`${label}: exercise adı boş.`);
      if(n(w.sets)<0 || n(w.reps)<0 || n(w.weight)<0) warnings.push(`${label}: sets/reps/weight negatif görünüyor.`);
      if(!n(w.reps) && !n(w.sets)) warnings.push(`${label}: set/rep bilgisi eksik olabilir.`);
      if(w.rpe!==undefined && w.rpe!=='' && (n(w.rpe)<1 || n(w.rpe)>10)) warnings.push(`${label}: RPE 1-10 aralığı dışında.`);
    });
    acts.forEach((a,i)=>{
      const type=String(a.activityType||a.type||'Activity');
      const label=`Activity #${i+1}${a.date?' · '+a.date:''} · ${type}`;
      if(!validDate(a.date)) critical.push(`${label}: tarih formatı hatalı veya boş.`);
      if(!String(a.activityType||'').trim()) warnings.push(`${label}: activityType boş; Universal Import eski formatı genel aktivite gibi okuyabilir.`);
      if(!String(a.duration||'').trim()) warnings.push(`${label}: duration boş.`);
      if(n(a.totalCal)>0 && n(a.activeCal)>n(a.totalCal)) warnings.push(`${label}: activeCal totalCal değerinden yüksek.`);
      if(a.rpe!==undefined && a.rpe!=='' && (n(a.rpe)<1 || n(a.rpe)>10)) warnings.push(`${label}: RPE 1-10 aralığı dışında.`);
    });
    const seenW=new Map();
    ws.forEach((w,i)=>{const key=[w.date,String(w.exercise||'').trim().toLowerCase(),w.reps,w.weight,w.notes||''].join('|'); if(seenW.has(key)) warnings.push(`Olası duplicate workout: ${w.date} · ${w.exercise||'isimsiz'} (#${seenW.get(key)+1} ve #${i+1}).`); else seenW.set(key,i);});
    const seenA=new Map();
    acts.forEach((a,i)=>{const key=[a.date,a.activityType||'',a.duration||'',a.activeCal||'',a.totalCal||''].join('|'); if(seenA.has(key)) warnings.push(`Olası duplicate activity: ${a.date} · ${a.activityType||'Activity'} (#${seenA.get(key)+1} ve #${i+1}).`); else seenA.set(key,i);});
    let status='Good', cls='good';
    if(critical.length){status='Needs Fix'; cls='risk';}
    else if(warnings.length){status='Good with Warnings'; cls='warn';}
    return {status,cls,critical,warnings,ws,acts};
  }
  window.runDataHealthCheck=function(){
    const res=document.getElementById('dataHealthResult'); if(!res)return;
    const h=analyzeDataHealth();
    const maxShow=8;
    const items=[];
    if(!h.critical.length && !h.warnings.length) items.push(`<div class="dataHealthIssue ok">Temiz görünüyor hocam. Kritik hata veya uyarı bulunmadı.</div>`);
    h.critical.slice(0,maxShow).forEach(x=>items.push(`<div class="dataHealthIssue critical"><b>Critical:</b> ${esc(x)}</div>`));
    h.warnings.slice(0,maxShow).forEach(x=>items.push(`<div class="dataHealthIssue warning"><b>Warning:</b> ${esc(x)}</div>`));
    const hidden=Math.max(0,h.critical.length+h.warnings.length-items.length);
    if(hidden) items.push(`<div class="dataHealthIssue warning">+${hidden} ek uyarı daha var. Önce en üsttekileri kontrol etmek yeterli.</div>`);
    res.innerHTML=`<div class="dataHealthTop"><div class="dataHealthScore"><span class="dataHealthBadge ${h.cls}">${esc(h.status)}</span><span>${h.critical.length} critical · ${h.warnings.length} warning</span></div></div><div class="dataHealthMiniGrid"><div class="dataHealthMini"><small>Workout Records</small><b>${h.ws.length}</b></div><div class="dataHealthMini"><small>Activity Records</small><b>${h.acts.length}</b></div><div class="dataHealthMini"><small>Total Issues</small><b>${h.critical.length+h.warnings.length}</b></div></div><div class="dataHealthIssues">${items.join('')}</div>`;
  };
  function weekStats(){
    const ds=typeof weekDates==='function'?weekDates():[];
    const ws=ds.flatMap(d=>typeof dayData==='function'?dayData(d):workouts().filter(w=>w.date===d));
    const c=typeof calc==='function'?calc(ws):{sets:ws.reduce((s,w)=>s+n(w.sets),0),reps:ws.reduce((s,w)=>s+n(w.reps),0),vol:ws.reduce((s,w)=>s+n(w.weight)*n(w.reps)*Math.max(1,n(w.sets)||1),0),parts:{}};
    const acts=activities().filter(a=>ds.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+dmins(a.duration),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=ws.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'-';
    const pain=ws.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=ds.filter(d=>(typeof dayData==='function'?dayData(d):workouts().filter(w=>w.date===d)).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['Data Building',0];
    let recovery='Low'; if(pain||Number(avgRpe)>=8.5||actMinutes>150||c.sets>28)recovery='High'; else if(Number(avgRpe)>=7.5||actMinutes>90||c.sets>22)recovery='Moderate';
    let quality=100; if(gymDays<2)quality-=18; if(c.sets>32)quality-=15; if(Number(avgRpe)>8.5)quality-=18; if(pain)quality-=22; if(recovery==='High')quality-=16; else if(recovery==='Moderate')quality-=8; quality=Math.max(0,Math.min(100,Math.round(quality)));
    let next='Gelecek hafta RPE/Form/Pain alanlarını dolu tutarak 3-4 temiz kayıt oluştur.';
    if(quality>=78&&recovery==='Low')next='1-2 ana harekette kontrollü mikro progresyon hedefle; genel programı koru.';
    else if(recovery==='High'||pain)next='Hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';
    else if(c.sets<14)next='Gym yükünü yavaşça artır; aynı kiloda +1 tekrar iyi hedef olur.';
    return {ds,ws,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays,topPart,recovery,quality,next};
  }
  window.generateWeeklyCoachReport=function(){
    const x=weekStats();
    const range=x.ds.length?`${x.ds[0]} → ${x.ds[x.ds.length-1]}`:'Seçili hafta';
    return `SIMURG OS — Weekly Coach Report\n${range}\n\nGym Days: ${x.gymDays}\nActivity Days: ${x.actDays}\nTotal Sets: ${x.c.sets||0}\nWeekly Volume: ${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg\nActivity Minutes: ${Math.round(x.actMinutes)} dk\nActive Calories: ${Math.round(x.activeCal)} kcal\nAvg RPE: ${x.avgRpe}\nPain Flags: ${x.pain}\nRecovery Debt: ${x.recovery}\nProgram Quality: ${x.quality}/100\nWeekly Focus: ${x.topPart[0]}${x.topPart[1]?` (${x.topPart[1]} set)`:''}\n\nNext Week Target:\n${x.next}`;
  };
  window.copyWeeklyCoachReport=async function(){
    const text=window.generateWeeklyCoachReport();
    try{await navigator.clipboard.writeText(text); alert('Weekly Coach Report kopyalandı.');}
    catch(e){
      const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('Weekly Coach Report kopyalandı.');
    }
    const prev=document.getElementById('coachReportPreview'); if(prev)prev.textContent=text;
  };
  function injectCoachReportTools(){
    const program=document.getElementById('programReport');
    if(program && !document.getElementById('programReportUtilityBar')){
      program.insertAdjacentHTML('afterbegin',`<div id="programReportUtilityBar" class="programReportUtilityBar"><div><small>Weekly Export</small><b>Haftalık coach raporunu tek tıkla kopyala</b></div><button class="btn sec" onclick="copyWeeklyCoachReport()">Copy Weekly Coach Report</button></div>`);
    }
    const data=document.getElementById('data');
    if(data && !document.getElementById('coachReportCard')){
      const health=document.getElementById('dataHealthCard');
      const card=document.createElement('div');
      card.className='card coachReportCard'; card.id='coachReportCard';
      card.innerHTML=`<h2>Copy Coach Report</h2><div class="sub">Haftalık Program Intelligence özetini mesaj/not olarak kopyalar.</div><div class="coachReportActions"><button class="btn sec" onclick="copyWeeklyCoachReport()">Copy Weekly Coach Report</button></div><div id="coachReportPreview" class="coachReportPreview">Kopyalanınca rapor ön izlemesi burada görünür.</div>`;
      if(health&&health.parentNode)health.insertAdjacentElement('afterend',card); else data.appendChild(card);
    }
  }
  function updateBuild(){
    const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
    const sp=document.querySelector('.versionBadgeCard span'); if(sp)sp.textContent='Universal Import · Data Health Check · Copy Coach Report · Program Intelligence';
  }
  function apply(){try{injectDataHealthCard();injectCoachReportTools();updateBuild();}catch(e){console.warn('data health report v1',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,120);};
  const prevProgram=window.renderProgramIntelligence;
  if(typeof prevProgram==='function')window.renderProgramIntelligence=function(){prevProgram();setTimeout(apply,120);};
  setTimeout(apply,350);
})();
