
(function(){
  const APP_BUILD='SIMURG_OS_APP_MODE_V1';
  window.SIMURG_APP_BUILD=APP_BUILD;
  function standalone(){return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;}
  function hideBoot(){
    try{
      document.body.classList.remove('simurg-lock-scroll');
      const boot=document.getElementById('simurgBoot');
      if(boot){boot.classList.add('hidden');setTimeout(()=>boot.remove(),520);}
    }catch(e){}
  }
  function showInstallHint(){
    try{
      if(standalone())return;
      if(localStorage.getItem('simurg_install_hint_closed')==='1')return;
      const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
      const hint=document.getElementById('simurgStandaloneHint');
      if(hint && isiOS){setTimeout(()=>{hint.style.display='block'},1600);}
    }catch(e){}
  }
  window.addEventListener('load',()=>{setTimeout(hideBoot,380);showInstallHint();});
  setTimeout(hideBoot,2400);
  window.addEventListener('appinstalled',()=>{try{localStorage.setItem('simurg_install_hint_closed','1')}catch(e){}});
})();


/* SIMURG OS POLAR HOME DASHBOARD V1 */
(function(){
  const BUILD='SIMURG_OS_WHOOP_MOBILE_HOME_V7_USABLE';
  function ensureRecoveryStore(){
    if(!DATA.recoveryEntries || Array.isArray(DATA.recoveryEntries)) DATA.recoveryEntries={};
    return DATA.recoveryEntries;
  }
  function val(v,def){ v=Number(v); return Number.isFinite(v)?v:def; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function fmtSleep(min){ min=val(min,432); const h=Math.floor(min/60), m=Math.round(min%60); return `${h}s ${String(m).padStart(2,'0')}dk`; }
  function recoveryFor(date){
    ensureRecoveryStore();
    const r=DATA.recoveryEntries[date] || {};
    const daily=(DATA.dailyNotes||[]).slice().reverse().find(x=>x.date===date)||{};
    const watch=(DATA.appleWatch||[]).filter(x=>x.date===date);
    const rows=dayData(date);
    const c=calc(rows);
    const sleepMin=val(r.sleepDurationMinutes||r.sleepMinutes||r.sleepDuration, daily.sleepDurationMinutes||432);
    const sleepScore=val(r.sleepScore||daily.sleepScore, clamp((sleepMin/480)*90,45,92));
    const hrv=val(r.hrvMs||r.hrv||daily.hrvMs,62);
    const rhr=val(r.restingHr||r.restingHR||r.rhr||daily.restingHr,48);
    const nightly=val(r.nightlyRecharge||r.nightlyRechargeScore||daily.nightlyRecharge,76);
    const actLoad=val(r.activityLoad||r.physicalLoad||daily.activityLoad, clamp((c.sets*3)+(watch.reduce((a,x)=>a+val(x.activeCal,0),0)/12),0,100));
    const energy=val(r.energy||daily.energy, Math.round((sleepScore+nightly)/2));
    const readiness=val(r.readiness||r.readinessScore||daily.readiness, Math.round((sleepScore*.28)+(nightly*.30)+(clamp(hrv,35,85)/85*100*.22)+(clamp(70-rhr,0,35)/35*100*.10)+(energy*.10)));
    return {date,sleepMin,sleepScore,hrv,rhr,nightly,actLoad:clamp(Math.round(actLoad),0,100),energy,readiness:clamp(Math.round(readiness),0,100),raw:r,sets:c.sets,volume:c.vol};
  }
  function readinessLabel(score){ if(score>=82)return ['YÜKLENMEYE HAZIR','Yüklen']; if(score>=68)return ['ORTA-YÜKSEK','Planı Koru']; if(score>=52)return ['KONTROLLÜ','Kontrollü']; if(score>=36)return ['DÜŞÜK','Hacmi Azalt']; return ['RECOVERY','Deload']; }
  function coachNote(r){
    if(r.readiness>=82 && r.actLoad<80) return 'Toparlanma güçlü. Bugün ana hareketlerde planı uygula; form temizse son sette +1 tekrar denenebilir.';
    if(r.readiness>=68) return 'Toparlanma orta-yüksek. Bugün planı koru, ancak failure’a gitme ve toplam hacmi kontrollü tut.';
    if(r.readiness>=52) return 'Hazırlık kontrollü. Ana hareketleri yap ama set sayısını veya RPE’yi biraz aşağıda tut.';
    if(r.readiness>=36) return 'Toparlanma düşük. Bugün toplam hacmi %20–30 azalt, pump/posture odaklı çalış ve failure’dan kaçın.';
    return 'Recovery öncelikli gün. Ağır yüklenme yerine mobilite, yürüyüş veya tam dinlenme daha mantıklı.';
  }
  function setText(id,text){ const el=document.getElementById(id); if(el) el.textContent=text; }
  function setRing(id,score){ const el=document.getElementById(id); if(el) el.style.background=`conic-gradient(var(--polarCyan) 0 ${score}%, rgba(255,255,255,.08) ${score}% 100%)`; }
  window.renderPolarDashboard=function(){
    ensureRecoveryStore();
    const r=recoveryFor(selectedDate);
    const [label,status]=readinessLabel(r.readiness);
    setText('homeReadinessScore',r.readiness); setText('homeReadinessLabel',label); setRing('homeReadinessRing',r.readiness);
    setText('homeNightly',Math.round(r.nightly)); setText('homeNightlyLabel',r.nightly>=70?'İyi':r.nightly>=55?'Orta':'Düşük');
    setText('homeHrv',Math.round(r.hrv)); setText('homeHrvLabel',r.hrv>=65?'İyi':r.hrv>=50?'Orta':'Düşük');
    setText('homeRhr',Math.round(r.rhr)); setText('homeSleep',fmtSleep(r.sleepMin)); setText('homeSleepLabel',r.sleepScore>=75?'İyi':r.sleepScore>=60?'Orta':'Düşük');
    setText('homeCoachNote',coachNote(r)); setText('homeLoadPct',r.actLoad+'%'); setText('homeLoadStatus',r.actLoad>84?'Yüksek':r.actLoad>=40?'Kontrollü':'Düşük');
    const lb=document.getElementById('homeLoadBar'); if(lb) lb.style.width=r.actLoad+'%';
    setText('recoveryScore',r.readiness); setText('recoveryStatus',status); setRing('recoveryRing',r.readiness); setText('recoveryTitle',r.readiness>=68?'Toparlanma iyi.':r.readiness>=52?'Kontrollü gün.':'Recovery öncelikli.');
    setText('recoveryText', r.readiness>=68?'Vücudun yükle başa çıkmaya hazır. Bugün ana hedeflerine odaklan ve akıllı zorlan.':'Vücut sinyalleri yükü sınırlamayı öneriyor. Temiz form, düşük RPE ve kontrollü hacim öncelikli.');
    setText('recNightly',Math.round(r.nightly)); setText('recHrv',Math.round(r.hrv)); setText('recRhr',Math.round(r.rhr)); setText('recoveryCoach',coachNote(r));
    const sleep=document.getElementById('recSleepStages'); if(sleep){ const total=r.sleepMin; const deep=Math.round(total*.22), rem=Math.round(total*.20), light=Math.round(total*.55), awake=Math.max(8,Math.round(total*.03)); const rows=[['Derin',deep],['REM',rem],['Hafif',light],['Uyanık',awake]]; sleep.innerHTML=rows.map(x=>`<div class="stage"><span>${x[0]}</span><em style="width:${clamp(x[1]/Math.max(1,total)*150,8,150)}px"></em><b>${fmtSleep(x[1])}</b></div>`).join('')+`<div class="stage"><span>Toplam</span><em style="width:150px"></em><b>${fmtSleep(total)}</b></div>`; }
    const days=weekDates(); const wr=document.getElementById('polarWeekRow'); if(wr){ wr.innerHTML=days.map((d,i)=>{const rr=recoveryFor(d); const tr=['PZT','SAL','ÇAR','PER','CUM','CMT','PZR'][i]; return `<button class="polarDayChip ${d===selectedDate?'active':''}" onclick="selectedDate='${d}';render()"><b>${tr}</b><strong>${parseDate(d).getDate()}</strong><i>${rr.readiness>=70?'✓':rr.readiness>=52?'•':'!'}</i></button>`}).join(''); }
    const trend=document.getElementById('polarTrendBars'); if(trend){ trend.innerHTML=days.map((d,i)=>{const rr=recoveryFor(d); return `<div class="polarTrendBar" style="height:${clamp(rr.readiness,12,100)}%"><b>${rr.readiness}</b><span>${['PZT','SAL','ÇAR','PER','CUM','CMT','PZR'][i]}</span></div>`}).join(''); }
    renderWorkoutContextPanel(r);
  };
  function renderWorkoutContextPanel(r){
    const right=document.querySelector('#workout .right'); if(!right) return;
    let panel=document.getElementById('workoutContextPanel');
    if(!panel){ panel=document.createElement('div'); panel.id='workoutContextPanel'; panel.className='panel workoutContextPanel'; right.insertBefore(panel,right.firstChild); }
    panel.innerHTML=`<h3>SEANS KONTEKST</h3><div class="workoutContextGrid">
      <div class="workoutContextItem"><span>Hazırlık</span><b>${r.readiness}/100</b></div>
      <div class="workoutContextItem"><span>Uyku</span><b>${fmtSleep(r.sleepMin)}</b></div>
      <div class="workoutContextItem"><span>HRV</span><b>${Math.round(r.hrv)} ms</b></div>
      <div class="workoutContextItem"><span>Dinlenik Nabız</span><b>${Math.round(r.rhr)} bpm</b></div>
      <div class="workoutContextItem"><span>Fiziksel Yük</span><b>${r.actLoad}%</b></div>
    </div><div class="contextCoach"><b>KOÇ NOTU</b><br>${coachNote(r)}</div>`;
  }
  window.importPolarRecovery=function(parsed){
    ensureRecoveryStore();
    if(!parsed.date) throw new Error('polar_recovery date eksik');
    DATA.recoveryEntries[parsed.date]={
      source:parsed.source||'polar_loop_gen2',
      sleepDurationMinutes:val(parsed.sleepDurationMinutes||parsed.sleepMinutes||parsed.sleep?.durationMinutes,0)||undefined,
      sleepScore:val(parsed.sleepScore||parsed.sleep?.score,undefined),
      nightlyRecharge:val(parsed.nightlyRecharge||parsed.recovery?.nightlyRecharge,undefined),
      hrvMs:val(parsed.hrvMs||parsed.hrv||parsed.recovery?.hrvMs,undefined),
      restingHr:val(parsed.restingHr||parsed.restingHR||parsed.rhr||parsed.recovery?.restingHr,undefined),
      activityLoad:val(parsed.activityLoad||parsed.physicalLoad||parsed.activity?.activityLoad,undefined),
      energy:val(parsed.energy||parsed.subjective?.energy,undefined),
      notes:parsed.notes||parsed.subjective?.notes||''
    };
    selectedDate=parsed.date; weekStart=mondayOf(selectedDate);
  };
  window.fillPolarSample=function(){
    const box=document.getElementById('universalJsonBox'); if(!box) return;
    box.value=JSON.stringify({importType:'polar_recovery',source:'polar_loop_gen2',date:selectedDate,sleepDurationMinutes:432,sleepScore:78,nightlyRecharge:76,hrvMs:62,restingHr:48,activityLoad:61,energy:72,notes:'Polar Loop sabah recovery girişi'},null,2);
    box.scrollIntoView({behavior:'smooth',block:'center'});
  };
  const prevUniversal=window.universalImport;
  window.universalImport=function(){
    try{
      const box=document.getElementById('universalJsonBox'); const raw=box?.value?.trim()||'';
      if(raw){ const parsed=JSON.parse(raw); const kind=String(parsed.importType||parsed.type||parsed.kind||'').toLowerCase();
        if(kind==='polar_recovery' || kind==='recovery' || kind==='polar' || parsed.nightlyRecharge || parsed.hrvMs || parsed.restingHr){ importPolarRecovery(parsed); if(box) box.value=''; save(); alert('Polar Recovery içe aktarıldı.'); return; }
      }
    }catch(e){ alert('Polar Import başarısız: '+e.message); return; }
    if(typeof prevUniversal==='function') return prevUniversal.apply(this,arguments);
  };
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); setTimeout(()=>{try{renderPolarDashboard();}catch(e){console.warn('polar dashboard render',e)}},0); };
  const prevSave=window.save;
  window.save=function(){
    ensureRecoveryStore();
    if(typeof prevSave==='function') return prevSave.apply(this,arguments);
    localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
    render();
  };
  document.addEventListener('DOMContentLoaded',()=>{try{ensureRecoveryStore();renderPolarDashboard();}catch(e){}});
  setTimeout(()=>{try{ensureRecoveryStore();renderPolarDashboard(); const vb=document.querySelector('.versionBadgeCard b'); if(vb) vb.textContent=BUILD; const vs=document.querySelector('.versionBadgeCard span'); if(vs) vs.textContent='Polar Home Dashboard · Recovery Entries · Session Context · Polar Universal Import';}catch(e){}},400);
})();
