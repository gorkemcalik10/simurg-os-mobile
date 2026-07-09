
/* === SIMURG OS FINAL POLISH / ACTIVITY + COACH V1 === */
(function(){
  function n(v){ return Number(String(v??0).replace(',','.'))||0; }
  function clean(v){ return String(v??'').trim(); }
  function looksLikeWatch(r){
    if(!r || typeof r!=='object') return false;
    return !!(r.activityType||r.activity||r.workoutType||r.avgHR||r.avgHeartRate||r.activeCal||r.activeCalories||r.activeEnergy||r.totalCal||r.totalCalories||r.duration||r.distance);
  }
  const activityAliases=[
    ['Sea Swimming',['sea','deniz','open water','açık su','acik su']],
    ['Pool Swimming',['pool swim','havuz','pool swimming']],
    ['Swimming',['swim','yüz','yuz','yüzme','yuzme']],
    ['Table Tennis',['table tennis','masa tenisi','ping pong','ping-pong']],
    ['Football',['football','soccer','futbol','match','maç','mac']],
    ['Beach Volleyball',['beach volleyball','plaj voleybol','beach volley']],
    ['Volleyball',['volleyball','voleybol']],
    ['Tennis',['tennis','tenis']],
    ['Padel',['padel']],
    ['Basketball',['basketball','basketbol']],
    ['Walking',['walk','walking','yürü','yuru','yürüyüş','yuruyus']],
    ['Running',['run','running','koş','kos','koşu','kosu']],
    ['Cycling',['cycle','cycling','bike','bisiklet']],
    ['Mobility',['mobility','mobilite','stretch','esneme']],
    ['Yoga',['yoga']],
    ['Pilates',['pilates']],
    ['Boxing',['boxing','boks']],
    ['Fitness',['fitness','strength','gym','fonksiyonel','ağırlık','agirlik','workout']],
    ['Recovery',['recovery','toparlanma','sauna','restorative']]
  ];
  window.normalizeActivityType=function(rec){
    let raw=clean(rec.activityType||rec.activity||rec.workoutType||rec.sport||rec.name||rec.type).toLowerCase();
    for(const [label,keys] of activityAliases){
      if(keys.some(k=>raw.includes(k))) return label;
    }
    let fallback=clean(rec.activityType||rec.activity||rec.workoutType||rec.sport||rec.type);
    if(!fallback || fallback==='apple_watch' || fallback==='watch' || fallback==='Apple Watch Workout') return 'Other';
    return fallback.replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  };
  window.activityEmoji=function(type){
    let t=clean(type).toLowerCase();
    if(t.includes('sea')) return '🌊';
    if(t.includes('pool')||t.includes('swim')||t.includes('yüz')||t.includes('yuz')) return '🏊';
    if(t.includes('table tennis')||t.includes('ping')||t.includes('masa')) return '🏓';
    if(t.includes('football')||t.includes('soccer')||t.includes('futbol')) return '⚽';
    if(t.includes('beach volleyball')) return '🏖️';
    if(t.includes('volleyball')||t.includes('voleybol')) return '🏐';
    if(t.includes('tennis')||t.includes('tenis')) return '🎾';
    if(t.includes('padel')) return '🎾';
    if(t.includes('basket')) return '🏀';
    if(t.includes('walk')||t.includes('yürü')||t.includes('yuru')) return '🚶';
    if(t.includes('run')||t.includes('koş')||t.includes('kos')) return '🏃';
    if(t.includes('cycl')||t.includes('bike')||t.includes('bisiklet')) return '🚴';
    if(t.includes('mobility')||t.includes('mobilite')||t.includes('yoga')||t.includes('pilates')||t.includes('recovery')) return '🧘';
    if(t.includes('boxing')||t.includes('boks')) return '🥊';
    if(t.includes('fitness')||t.includes('gym')||t.includes('strength')) return '🏋️';
    return '⌚';
  };
  window.activityDisplayName=function(type){
    const map={
      'Sea Swimming':'Sea Swimming','Pool Swimming':'Pool Swimming','Swimming':'Swimming',
      'Table Tennis':'Table Tennis','Football':'Football','Beach Volleyball':'Beach Volleyball','Volleyball':'Volleyball',
      'Tennis':'Tennis','Padel':'Padel','Basketball':'Basketball','Walking':'Walking','Walk':'Walking','Running':'Running','Run':'Running','Cycling':'Cycling',
      'Mobility':'Mobility','Yoga':'Yoga','Pilates':'Pilates','Boxing':'Boxing','Fitness':'Fitness','Recovery':'Recovery','Other':'Other Activity'
    };
    return map[type]||type||'Other Activity';
  };
  window.normalizeWatchRecord=function(rec){
    rec={...rec};
    rec.type='Apple Watch Workout';
    rec.activityType=normalizeActivityType(rec);
    rec.duration=rec.duration||rec.time||rec.elapsed||'';
    rec.distance=n(rec.distance??rec.distanceMeters??rec.meters??rec.distanceM);
    rec.activeCal=n(rec.activeCal??rec.activeCalories??rec.activeEnergy??rec.activeKcal??rec.caloriesActive);
    rec.totalCal=n(rec.totalCal??rec.totalCalories??rec.totalEnergy??rec.totalKcal??rec.caloriesTotal??rec.calories);
    rec.avgHR=n(rec.avgHR??rec.avgHeartRate??rec.averageHR??rec.averageHeartRate??rec.hrAvg);
    rec.maxHR=n(rec.maxHR??rec.maxHeartRate??rec.maximumHR??rec.maximumHeartRate??rec.hrMax);
    rec.rpe=rec.rpe||rec.effort||rec.effortScore||'';
    rec.notes=rec.notes||rec.note||'';
    return rec;
  };
  window.importAppleWatch=function(rec){
    if(!rec.date) throw new Error('apple_watch date eksik');
    let base={...rec};
    let segments=Array.isArray(rec.segments)?rec.segments:null;
    if(segments && segments.length){
      segments.forEach(seg=>DATA.appleWatch.push(normalizeWatchRecord({...base,...seg,date:seg.date||base.date,activityType:seg.activityType||base.activityType||base.activity})));
      selectedDate=base.date;
    }else{
      rec=normalizeWatchRecord(rec);
      DATA.appleWatch.push(rec);
      selectedDate=rec.date;
    }
    weekStart=mondayOf(selectedDate);
  };
  window.universalImport=function(){
    try{
      let raw=universalJsonBox.value.trim();
      if(!raw){alert('JSON kutusu boş.');return;}
      let parsed=JSON.parse(raw);
      let importedDate=null;
      if(Array.isArray(parsed)){
        if(parsed.every(looksLikeWatch)){
          parsed.forEach(r=>{ if(!r.date && importedDate) r.date=importedDate; importAppleWatch(r); importedDate=r.date||selectedDate; });
        }else{
          importWorkoutArray(parsed);
        }
      }else{
        let kind=clean(parsed.type||parsed.kind||parsed.category).toLowerCase();
        if(parsed.workouts || kind==='workout' || kind==='strength'){
          importWorkoutArray(parsed.workouts||parsed.items||[]);
        }else if(parsed.appleWatch || parsed.watch || parsed.activities){
          let arr=parsed.appleWatch||parsed.watch||parsed.activities;
          if(!Array.isArray(arr)) arr=[arr];
          arr.forEach(r=>importAppleWatch({...parsed,...r,date:r.date||parsed.date,activityType:r.activityType||parsed.activityType||parsed.activity}));
        }else if(parsed.segments && looksLikeWatch(parsed)){
          importAppleWatch(parsed);
        }else if(kind==='apple_watch'||kind==='watch'||kind==='activity'||looksLikeWatch(parsed)){
          importAppleWatch(parsed);
        }else if(kind==='daily'||parsed.coachNote||parsed.readiness||parsed.energy){
          if(!parsed.date) throw new Error('daily date eksik');
          DATA.dailyNotes=DATA.dailyNotes||[]; DATA.dailyNotes.push(parsed); selectedDate=parsed.date; weekStart=mondayOf(selectedDate);
        }else if(kind==='weekly'||parsed.weeklyReport||parsed.phoenixReport){
          DATA.weeklyNotes=DATA.weeklyNotes||[]; DATA.weeklyNotes.push(parsed);
        }else{
          alert('JSON type anlaşılamadı. workout / apple_watch / activity / daily / weekly formatlarından biri olmalı.');return;
        }
      }
      universalJsonBox.value='';
      save();
    }catch(e){ alert('Universal Import başarısız: '+e.message); }
  };
  window.importWatchJson=function(){
    try{
      let rec=JSON.parse(watchJsonBox.value);
      importAppleWatch(rec);
      watchJsonBox.value='';
      save();
    }catch(e){ alert('JSON okunamadı: '+e.message); }
  };
  window.activitySummaryForDate=function(date){
    let rows=watchRowsForDate(date);
    if(!rows.length) return null;
    let types=[...new Set(rows.map(r=>normalizeActivityType(r)))];
    let primary=types.length===1?types[0]:'Mixed Activity';
    let emoji=types.length===1?activityEmoji(primary):'⚡';
    let duration=sumDurations(rows);
    let active=rows.reduce((a,r)=>a+n(r.activeCal),0);
    let total=rows.reduce((a,r)=>a+n(r.totalCal),0);
    let distance=rows.reduce((a,r)=>a+n(r.distance),0);
    let avgHR=weightedAvgHR(rows);
    let maxHR=Math.max(0,...rows.map(r=>n(r.maxHR)));
    let rpes=rows.map(r=>n(r.rpe)).filter(Boolean);
    let rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
    let name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
    let dist=formatDistance(distance);
    let shortBits=[duration,dist,active?active+' kcal':''].filter(Boolean);
    return {rows,types,primary,name,emoji,duration,active,total,distance,dist,avgHR,maxHR,rpe,shortLabel:shortBits.join(' · '),fullLabel:`${name} · ${shortBits.join(' · ')}`};
  };
  function topReasons(readiness, injury){
    let reasons=[];
    if(readiness.reasons && readiness.reasons.length) reasons.push(...readiness.reasons.slice(0,2));
    if(injury.signals && injury.signals.length) reasons.push(...injury.signals.slice(0,2));
    return [...new Set(reasons)].slice(0,2);
  }
  window.renderCoachPanels=function(){
    let el=document.getElementById('coachVerdict');
    let tg=document.getElementById('nextTargets');
    if(!el || !tg) return;
    let rows=dayData(selectedDate), c=calc(rows), readiness=calculateReadiness(selectedDate), injury=calculateInjuryRisk(selectedDate);
    let hasWatch=readiness.today.watch.length>0;
    if(!rows.length && !hasWatch){
      el.innerHTML='<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Veri bekleniyor</b></div><div class="coachPremiumPill">Pending</div></div><div class="coachPremiumMessage"><b>Karar:</b> Bugün için antrenman veya aktivite verisi yok. Veri girilince koç kararı oluşacak.</div></div>';
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>İlk kayıt sonrası sonraki seans hedefleri oluşacak.</span></div><div class="nextTargetBadge">Pending</div></div></div>';return;
    }
    let reasons=topReasons(readiness,injury);
    let decision=injury.level==='High'?'Koruma öncelikli.':(injury.level==='Moderate'?'Kontrollü yüklen.':(readiness.status==='Recovery'?'Recovery odaklı ilerle.':'Plan uygulanabilir.'));
    let recommendation=injury.level==='High'?injury.deload:(injury.level==='Moderate'?'Bugün yük artırma; 1-2 tekrar rezerv bırak.':readiness.advice);
    let activityText=readiness.today.types.length?readiness.today.types.join(' + '):(rows.length?'Gym':'No activity');
    el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>${trDate(selectedDate)} karar özeti</b></div><div class="coachPremiumPill">${readiness.status}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Aktivite</small><b>${activityText}</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${decision}<br><b>Neden:</b> ${reasons.length?reasons.join(' · '):'belirgin olumsuz sinyal yok'}.<br><b>Öneri:</b> ${recommendation}</div></div>`;
    if(!rows.length){
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Gym hedefi yok</b><span>Bugün aktivite yükü recovery/kondisyon olarak işlendi. Sonraki gym gününde readiness ve risk skorunu baz al.</span></div><div class="nextTargetBadge">Activity</div></div></div>';return;
    }
    let byEx={}; rows.forEach(r=>{(byEx[r.exercise]=byEx[r.exercise]||[]).push(r);});
    let items=Object.entries(byEx).slice(0,4).map(([ex,sets])=>{
      let maxW=Math.max(...sets.map(s=>n(s.weight))); let reps=sets.map(s=>n(s.reps)); let avgReps=Math.round(reps.reduce((a,b)=>a+b,0)/Math.max(1,reps.length));
      let target=injury.level==='High'?'Yük artırma; form ve ağrı kontrolü.':(avgReps>=10?`Aynı kiloda kaliteyi koru; iyi hissedersen küçük artış dene.`:`${maxW} kg civarı, hedef tekrar: ${avgReps+1}.`);
      return `<div class="nextTargetPremiumItem"><div><b>${ex}</b><span>${target}</span></div><div class="nextTargetBadge">Next</div></div>`;
    }).join('');
    tg.innerHTML=`<div class="nextTargetsPremium">${items}</div>`;
  };
  window.renderPhoenixReport=function(){
    let el=document.getElementById('phoenixReport'); if(!el) return;
    let dates=weekDates(); let rows=DATA.workouts.filter(w=>dates.includes(w.date)); let watch=(DATA.appleWatch||[]).filter(r=>dates.includes(r.date)).map(normalizeWatchRecord);
    if(!rows.length && !watch.length){el.innerHTML='<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Hafta bekleniyor</b></div><div class="coachPremiumPill">No Data</div></div><div class="coachPremiumMessage">Bu hafta için veri yok. İlk kayıt geldiğinde haftalık yük, aktivite ve toparlanma yorumu oluşacak.</div></div>';return;}
    let c=calc(rows); let completed=[...new Set([...rows.map(r=>r.date),...watch.map(r=>r.date)])].length; let active=watch.reduce((a,r)=>a+n(r.activeCal),0); let minutes=Math.round(watch.reduce((a,r)=>a+durationMinutes(r.duration),0));
    let groups={}; rows.forEach(r=>groups[r.bodyPart]=(groups[r.bodyPart]||0)+(n(r.sets)||1)); let top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
    let verdict=c.sets>24?'Hacim yüksek; recovery sinyallerini takip et.':(active>350?'Aktivite yükü belirgin; sonraki gym gününde kontrollü başla.':'Hafta yönetilebilir görünüyor.');
    el.innerHTML=`<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Haftalık koç özeti</b></div><div class="coachPremiumPill">${completed}/7 gün</div></div><div class="phoenixPremiumRows"><div class="phoenixPremiumRow"><span>Gym yükü</span><b>${c.sets} set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div><div class="phoenixPremiumRow"><span>Aktivite</span><b>${minutes} dk • ${active} kcal</b></div><div class="phoenixPremiumRow"><span>Ana odak</span><b>${top?top[0]+' • '+top[1]+' set':'Aktivite / Recovery'}</b></div></div><div class="coachPremiumMessage"><b>Simurg yorumu:</b> ${verdict}</div></div>`;
  };
  // Polish Data Center labels after render without changing data flow
  function polishDataCenter(){
    const dc=document.getElementById('data'); if(!dc) return;
    const cloud=dc.querySelector('.cloudSyncCard .sub'); if(cloud) cloud.innerHTML='Telefon ve Mac arasında veriyi eşitle. <b>Eski cihazda Push</b>, diğer cihazda <b>Pull</b> yap.';
    const universal=dc.querySelector('.universalImportCard .sub'); if(universal) universal.innerHTML='Tek veri giriş noktası: workout, Apple Watch, yüzme, futbol, masa tenisi, plaj voleybolu gibi aktiviteleri otomatik tanır. Dizi veya segmentli kayıtları da destekler.';
  }
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){ oldRender(); polishDataCenter(); };
    setTimeout(()=>{try{render();}catch(e){}},0);
  }
})();


(function(){
  function n(v){return Number(v)||0;}
  function esc(v){return (typeof escapeAttr==='function')?escapeAttr(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function dateDiffDays(a,b){return Math.round((parseDate(a)-parseDate(b))/86400000);}
  function lastCompletedSession(ex,date){
    if(typeof exerciseSessions!=='function') return null;
    const sessions=exerciseSessions(ex).filter(s=>parseDate(s.date)<parseDate(date||selectedDate));
    return sessions[0]||null;
  }
  function lastSessionSnapshotHtml(ex,date){
    const s=lastCompletedSession(ex,date);
    if(!s || typeof exerciseSessionStats!=='function') return `<div class="gymSnapshotBlock"><b>Last Session</b><span>Bu hareket için önceki kayıt yok. Bugün temiz formu referans al.</span></div>`;
    const st=exerciseSessionStats(s.rows);
    const sets=s.rows.map(w=>`${gymSafe(w.weight)}kg x ${gymSafe(w.reps)}`).join(' / ');
    const meta=[st.rpe?`RPE ${st.rpe}`:'',st.form?`Form ${st.form}`:'',st.pain&&st.pain!=='None'?`Pain ${st.pain}`:''].filter(Boolean).join(' · ');
    return `<div class="gymSnapshotBlock"><b>Last Session · ${trDate(s.date)}</b><span>${sets}${meta?` · ${meta}`:''}</span></div>`;
  }
  function painMemoryHtml(ex,date){
    const rows=(DATA.workouts||[]).filter(w=>w.exercise===ex && parseDate(w.date)<parseDate(date||selectedDate) && dateDiffDays(date||selectedDate,w.date)<=14)
      .filter(w=>['mild','warning'].includes(String(w.pain||'').toLowerCase()) || String(w.form||'').toLowerCase()==='bad');
    if(!rows.length) return '';
    const hasWarning=rows.some(w=>String(w.pain||'').toLowerCase()==='warning' || String(w.form||'').toLowerCase()==='bad');
    const latest=rows.sort((a,b)=>parseDate(b.date)-parseDate(a.date))[0];
    const signal=[latest.pain&&latest.pain!=='None'?`Pain ${latest.pain}`:'',latest.form==='Bad'?'Form Bad':''].filter(Boolean).join(' · ');
    return `<div class="gymPainMemoryBlock ${hasWarning?'warning':''}"><b>Health Memory</b><span>Son kayıtta risk sinyali: ${esc(signal||'dikkat')} (${trDate(latest.date)}). Bugün formu önceliklendir, gerekirse yük artırma.</span></div>`;
  }
  function applyGymSmartCoach(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      card.querySelectorAll('.gymSmartStack').forEach(x=>x.remove());
      const input=card.querySelector('.gymExerciseName');
      const ex=(input?.value||card.getAttribute('data-current-name')||'').trim();
      if(!ex) return;
      const target=card.querySelector('.gymTargetBox');
      const coach=card.querySelector('.gymCoachBox');
      const stack=document.createElement('div');
      stack.className='gymSmartStack';
      stack.innerHTML=lastSessionSnapshotHtml(ex,selectedDate)+painMemoryHtml(ex,selectedDate);
      if(target) target.insertAdjacentElement('afterend',stack);
      else if(coach) coach.insertAdjacentElement('beforebegin',stack);
      const rpeLabel=coach?.querySelector('label:first-child small');
      if(rpeLabel && !rpeLabel.textContent.includes('?')) rpeLabel.textContent='RPE ?';
    });
  }
  function classifyActivityIntensity(activity){
    if(!activity) return {label:'Rest Day',cls:'light',role:'Recovery / Rest'};
    const minutes=durationMinutes(activity.duration);
    const active=n(activity.active);
    const avg=n(activity.avgHR);
    const rpe=n(activity.rpe);
    const score=active + minutes*2 + Math.max(0,avg-100)*2 + (rpe?rpe*18:0);
    let label='Light Activity', cls='light', role='Recovery / Light Movement';
    if(score>=520 || rpe>=8 || active>=450){label='Hard Activity';cls='hard';role='High Activity Day';}
    else if(score>=250 || rpe>=6 || active>=220){label='Moderate Activity';cls='moderate';role='Conditioning Day';}
    const t=String(activity.primary||activity.name||'').toLowerCase();
    if(cls==='light' && (t.includes('swim')||t.includes('walk')||t.includes('mobility')||t.includes('yoga'))) role='Recovery / Conditioning';
    return {label,cls,role,score};
  }
  window.classifyActivityIntensity=classifyActivityIntensity;
  window.renderActivitySessionCard=function(date){
    let a=activitySummaryForDate(date);
    if(!a) return '';
    const intensity=classifyActivityIntensity(a);
    let stats=[
      ['Süre',a.duration||'-'],['Aktif kcal',a.active?a.active+' kcal':'-'],['Toplam kcal',a.total?a.total+' kcal':'-'],['Mesafe',a.dist||'-'],['Yoğunluk',intensity.label],['Ort. nabız',a.avgHR?a.avgHR+' v/dk':'-'],['Maks nabız',a.maxHR?a.maxHR+' v/dk':'-'],['RPE',a.rpe||'-']
    ];
    if(a.rows.length>1) stats.push(['Kayıt',a.rows.length+' segment']);
    return `<div class="activitySessionCard ${intensity.cls}"><div class="activitySessionTop"><div class="activitySessionTitle"><div class="activityIcon">${a.emoji}</div><div><small>ACTIVITY SESSION</small><b>${esc(a.name)}</b><span>${trDate(date)} · ${intensity.role}</span></div></div><div class="activityPill activityIntensityPill ${intensity.cls}">${intensity.label}</div></div><div class="activityStatsGrid">${stats.map(([k,v])=>`<div class="activityStatBox"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>`;
  };
  window.renderDailyReport=function(){
    let dates=[...new Set([...(DATA.workouts||[]).map(w=>w.date),...(DATA.appleWatch||[]).map(w=>w.date)])].filter(Boolean).sort((a,b)=>parseDate(b)-parseDate(a));
    if(!dates.length){dailyReport.innerHTML='<div class="card"><h2>Daily Summary</h2><div class="reportText">Henüz antrenman veya aktivite verisi yok.</div></div>';return;}
    let cards=[];
    dates.forEach(date=>{
      let items=dayData(date), c=calc(items), activity=activitySummaryForDate(date), readiness=calculateReadiness(date);
      let hasGym=items.length>0, hasActivity=!!activity, intensity=hasActivity?classifyActivityIntensity(activity):null;
      if(hasGym){
        let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0], best=items.slice().sort((a,b)=>b.weight-a.weight)[0], exCount=Object.keys(c.exs).length, exMini=Object.keys(c.exs).map(ex=>`<em>${ex}</em>`).join('');
        let activityLine=hasActivity?`<span>Extra Activity: ${activity.emoji} ${esc(activity.name)} • ${activity.duration||'-'} • ${activity.active||0} kcal • ${intensity.label}</span>`:'';
        cards.push(`<div class="dailyMiniCard dailyGymCard" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()"><div class="dailyMiniTop"><div><b>${trDate(date)}</b><span>${items[0]?.day||dayName(date)} · Gym Training</span></div><strong>${c.sets} set</strong></div><div class="dailyMiniReadiness"><span>Readiness ${readiness.score}/100</span><span>${readiness.status}</span></div><div class="dailyMiniStats"><span>${c.reps} reps</span><span>${Math.round(c.vol).toLocaleString('tr-TR')} kg</span><span>${exCount} exercises</span><span>${topPart[0]}</span></div><div class="dailyMiniExercises">${exMini}</div><div class="dailyMiniFooter"><span>Best: ${best?best.exercise+' '+best.weight+'kg':'-'}</span>${activityLine}</div></div>`);
      }
      if(hasActivity && !hasGym){
        let segmentText=activity.rows.length>1?` • ${activity.rows.length} kayıt`:'';
        cards.push(`<div class="dailyMiniCard dailyActivityCard ${intensity.cls}" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()"><div class="dailyMiniTop"><div><b>${trDate(date)}</b><span>${dayName(date)} · Activity Day</span></div><strong>${intensity.label}</strong></div><div class="dailyActivityTypeLine"><div class="emoji">${activity.emoji}</div><div><b>${esc(activity.name)}</b><span>${intensity.role}${segmentText}</span></div></div><div class="dailyMiniStats"><span>${activity.duration||'-'}</span><span>${activity.active?activity.active+' kcal':'-'}</span><span>${activity.dist||'-'}</span><span>${activity.avgHR?activity.avgHR+' bpm':'-'}</span></div><div class="dailyActivityNote">Gym hacmine eklenmez; readiness, recovery ve günlük fiziksel yük hesabına dahil edilir.</div></div>`);
      }
    });
    dailyReport.innerHTML=`<div class="dailyMiniGrid">`+cards.join('')+`</div>`;
  };
  window.renderWeeklyReport=function(){
    let dates=weekDates(), items=dates.flatMap(d=>dayData(d)), c=calc(items), watch=(DATA.appleWatch||[]).filter(r=>dates.includes(r.date)).map(normalizeWatchRecord);
    let completed=[...new Set([...items.map(w=>w.date),...watch.map(w=>w.date)])].length, gymDays=[...new Set(items.map(w=>w.date))].length, activityDays=[...new Set(watch.map(w=>w.date))].length;
    let active=watch.reduce((a,r)=>a+n(r.activeCal),0), minutes=Math.round(watch.reduce((a,r)=>a+durationMinutes(r.duration),0));
    let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0], maxDay=Math.max(1,...dates.map(d=>calc(dayData(d)).sets));
    let loadScore=c.sets*12+active+minutes*2, loadLevel=loadScore>=760?'High':loadScore>=360?'Moderate':(loadScore>0?'Low':'No Load'), loadCls=loadLevel==='High'?'high':(loadLevel==='Moderate'?'moderate':'');
    let recoveryNeed=loadLevel==='High'?'Yüksek':(loadLevel==='Moderate'?'Normal':'Düşük');
    let loadAdvice=loadLevel==='High'?'Bu hafta toplam yük belirgin. Sonraki seansta failure yerine kontrollü tempo ve ağrı takibi öncelikli olsun.':(loadLevel==='Moderate'?'Haftalık yük yönetilebilir. Aynı ritmi koru; RPE 8+ birikirse yük artırma.':'Hafta hafif/temiz gidiyor. Veri gelmeye devam ettikçe koç yorumu güçlenecek.');
    let days=dates.map(d=>{let cc=calc(dayData(d)), act=activitySummaryForDate(d), pct=Math.min(100,Math.round((cc.sets/maxDay)*100)), label=getProgramType(dayName(d))||dayName(d), actText=act?` • ${act.emoji} ${act.duration||''}`:''; return `<div class="weeklyDayItem"><b>${trDate(d)}</b><div class="weeklyDayBar"><div class="weeklyDayFill" style="width:${pct}%"></div></div><span>${cc.sets} set • ${Math.round(cc.vol).toLocaleString('tr-TR')} kg • ${label}${actText}</span></div>`;}).join('');
    let avgSets=gymDays?Math.round(c.sets/gymDays):0;
    let verdict=c.sets===0?'Gym verisi yok; varsa aktivite yükü recovery hesabına dahil edilir.':(c.sets<14?'Hafif gym haftası. Toparlanma veya giriş haftası gibi duruyor.':(c.sets<=28?'Dengeli ve yönetilebilir gym haftası.':'Yüksek hacimli gym haftası. Recovery ve ağrı sinyallerini takip et.'));
    weeklyReport.innerHTML=`<div class="weeklyPremiumGrid"><div class="weeklyPremiumCard weeklyLoadStatusCard ${loadCls}"><div class="weeklyPremiumHead"><div><small>Weekly Load Status</small><b>Genel yük ve recovery</b></div><div class="weeklyPremiumPill">${loadLevel}</div></div><div class="weeklyLoadMiniGrid"><div class="weeklyLoadMiniBox"><small>Gym</small><b>${gymDays} gün</b></div><div class="weeklyLoadMiniBox"><small>Activity</small><b>${activityDays} gün</b></div><div class="weeklyLoadMiniBox"><small>Watch</small><b>${minutes} dk</b></div><div class="weeklyLoadMiniBox"><small>Recovery</small><b>${recoveryNeed}</b></div></div><div class="weeklyLoadVerdict"><b>Koç notu:</b> ${loadAdvice}</div></div><div class="weeklyPremiumCard"><div class="weeklyPremiumHead"><div><small>Weekly Load</small><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div><div class="weeklyPremiumPill">${completed}/7 gün</div></div><div class="weeklyMetricGrid"><div class="weeklyMetricBox"><small>Set</small><b>${c.sets}</b></div><div class="weeklyMetricBox"><small>Tekrar</small><b>${c.reps}</b></div><div class="weeklyMetricBox"><small>Hacim</small><b>${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div></div><div class="weeklyInsight"><b>Odak:</b> ${topPart[0]} (${topPart[1]} set). <b>Ortalama:</b> ${avgSets} set/gym günü. ${verdict}</div></div><div class="weeklyPremiumCard"><div class="weeklyPremiumHead"><div><small>Day Distribution</small><b>Gün Gün Dağılım</b></div><div class="weeklyPremiumPill">${topPart[0]}</div></div><div class="weeklyDayList">${days}</div></div></div>`;
  };
  const previousRender=window.render;
  if(typeof previousRender==='function'){
    window.render=function(){ previousRender(); try{applyGymSmartCoach();}catch(e){} };
    setTimeout(()=>{try{render();}catch(e){}},0);
  }
})();

