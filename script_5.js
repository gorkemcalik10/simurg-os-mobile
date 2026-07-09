
/* SIMURG OS V4: coaching card content renderer refinement */
(function(){
  function safeText(v){return (v===undefined||v===null||v==='')?'-':String(v);}
  function shortTypeList(types){return (types&&types.length)?types.slice(0,2).join(' + '):'No activity';}

  window.renderReadinessHtml=function(date){
    let r=calculateReadiness(date);
    let t=r.today;
    let typeText=shortTypeList(t.types);
    let reasonText=r.reasons.length?r.reasons.slice(0,3).join(', '):'olumsuz sinyal yok';
    let bg=`conic-gradient(#23ce7a 0 ${r.score}%, #172033 ${r.score}% 100%)`;
    return `<div class="readinessScoreBox"><div class="readinessCircle" style="background:${bg}">${r.score}</div><div class="readinessMeta"><b>${r.status}</b><span>${r.advice}</span><div class="readinessPills"><span class="readinessPill activityTag">${typeText}</span><span class="readinessPill">${t.level} load</span><span class="readinessPill">${Math.round(t.minutes)} dk</span><span class="readinessPill">${t.active} kcal</span><span class="readinessPill">${t.avgHR||'-'} bpm</span></div><div class="activityLoadCard"><b>Etkenler:</b> ${reasonText}</div></div></div>`;
  };

  window.renderInjuryRiskHtml=function(date){
    let r=calculateInjuryRisk(date);
    let cls=r.level==='High'?'high':(r.level==='Moderate'?'moderate':(r.readiness.status==='Recovery'?'recovery':''));
    let signalText=r.signals.length?r.signals.slice(0,3).join(', '):'belirgin risk sinyali yok';
    let pills=[
      `<span class="injuryRiskPill ${r.level==='High'?'danger':(r.level==='Moderate'?'warn':'')}">Risk ${r.level}</span>`,
      `<span class="injuryRiskPill">Readiness ${r.readiness.score}</span>`,
      `<span class="injuryRiskPill">RPE ${r.today.coach.avgRpe||'-'}</span>`,
      `<span class="injuryRiskPill">${r.today.gym.sets} set</span>`,
      `<span class="injuryRiskPill">${r.today.level}</span>`
    ].join('');
    return `<div class="injuryRiskBox"><div class="injuryRiskBadge ${cls}">${r.level}<br>${r.score}/100</div><div class="injuryRiskMeta"><b>Koruma kararı</b><span>${r.deload}</span><div class="injuryRiskPills">${pills}</div><div class="deloadBox"><b>Risk sinyalleri:</b> ${signalText}</div></div></div>`;
  };

  window.renderCoachPanels=function(){
    let el=document.getElementById('coachVerdict');
    let tg=document.getElementById('nextTargets');
    if(!el || !tg) return;
    let rows=dayData(selectedDate);
    let c=calc(rows);
    let daily=(DATA.dailyNotes||[]).filter(r=>r.date===selectedDate).slice(-1)[0];
    let readiness=calculateReadiness(selectedDate);
    let injury=calculateInjuryRisk(selectedDate);
    if(!rows.length){
      if(readiness.today.watch.length){
        el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Aktivite günü</b></div><div class="coachPremiumPill">${readiness.status}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Aktivite</small><b>${shortTypeList(readiness.today.types)}</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${Math.round(readiness.today.minutes)} dk aktivite, ${readiness.today.active} aktif kcal. ${readiness.advice}</div></div>`;
        tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Gym hedefi yok</b><span>Bugün recovery/kondisyon yükü olarak işlendi. Sonraki gym gününde readiness skoruna göre başla.</span></div><div class="nextTargetBadge">Activity</div></div></div>';
      }else{
        el.innerHTML='<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Veri bekleniyor</b></div><div class="coachPremiumPill">Ready</div></div><div class="coachPremiumMessage">Bu gün için antrenman veya aktivite verisi yok. Veri girildiğinde koç kararı burada oluşur.</div></div>';
        tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Antrenman işlenince sıradaki hedefler oluşacak.</span></div><div class="nextTargetBadge">Pending</div></div></div>';
      }
      return;
    }
    let level=coachVolumeLevel(c.sets);
    let note=daily&&daily.coachNote?` ${daily.coachNote}`:'';
    let advice='Hacim kontrollü. Form standardını koru; progression aceleye gelmesin.';
    if(c.sets<14) advice='Hacim düşük. Enerjin iyiyse ana harekette 1-2 kaliteli set eklenebilir.';
    if(c.sets>24) advice='Hacim yüksek. Sonraki seansta recovery ve teknik kalite öncelik olmalı.';
    el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>${trDate(selectedDate)} karar özeti</b></div><div class="coachPremiumPill">${level}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Hacim</small><b>${c.sets} set</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${advice} ${readiness.advice} ${injury.deload}${note}</div></div>`;
    let byEx={};
    rows.forEach(r=>{ if(!byEx[r.exercise]) byEx[r.exercise]=[]; byEx[r.exercise].push(r); });
    let items=Object.entries(byEx).slice(0,4).map(([ex,sets])=>{
      let maxW=Math.max(...sets.map(s=>Number(s.weight)||0));
      let reps=sets.map(s=>Number(s.reps)||0);
      let avgReps=Math.round(reps.reduce((a,b)=>a+b,0)/Math.max(1,reps.length));
      let target=avgReps>=10?`Kilo sabit; iyi hissedersen küçük artış dene.`:`Aynı kiloda hedef tekrar: ${avgReps+1}.`;
      return `<div class="nextTargetPremiumItem"><div><b>${ex}</b><span>${maxW?maxW+' kg · ':''}${target}</span></div><div class="nextTargetBadge">Next</div></div>`;
    }).join('');
    tg.innerHTML=`<div class="nextTargetsPremium">${items||'<div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Set verisi arttıkça hedefler netleşecek.</span></div><div class="nextTargetBadge">Pending</div></div>'}</div>`;
  };

  window.renderPhoenixReport=function(){
    let el=document.getElementById('phoenixReport');
    if(!el) return;
    let dates=weekDates();
    let rows=DATA.workouts.filter(w=>dates.includes(w.date));
    if(!rows.length){
      el.innerHTML='<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Hafta bekleniyor</b></div><div class="coachPremiumPill">No Data</div></div><div class="coachPremiumMessage">Bu hafta için veri yok. İlk kayıt geldiğinde haftalık yük ve gelişim yorumu oluşacak.</div></div>';
      return;
    }
    let c=calc(rows);
    let groups={};
    rows.forEach(r=>groups[r.bodyPart]=(groups[r.bodyPart]||0)+(Number(r.sets)||1));
    let top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
    let completed=dates.filter(d=>dayData(d).length || watchRowsForDate(d).length).length;
    let verdict=c.sets>=45&&c.sets<=90?'Haftalık hacim güçlü ama yönetilebilir görünüyor.':'Haftalık yük veri arttıkça daha net dengelenecek.';
    el.innerHTML=`<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Haftalık koç özeti</b></div><div class="coachPremiumPill">${completed}/7 gün</div></div><div class="phoenixPremiumRows"><div class="phoenixPremiumRow"><span>Toplam yük</span><b>${c.sets} set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div><div class="phoenixPremiumRow"><span>Ana odak</span><b>${top?top[0]+' • '+top[1]+' set':'-'}</b></div><div class="phoenixPremiumRow"><span>Hafta</span><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div></div><div class="coachPremiumMessage"><b>Simurg yorumu:</b> ${verdict}</div></div>`;
  };

  window.renderProgressMotivation=function(){
    let el=document.getElementById('progressMotivation');
    if(!el) return;
    let data=calculatePRBoard();
    let events=data.events||[];
    let dates=weekDates();
    let weekEvents=events.filter(e=>dates.includes(e.date));
    if(weekEvents.length){
      let top=weekEvents.slice(0,2).map(e=>`<div><span class="highlight">${e.type}</span> • <b>${e.exercise}</b><br><small>${e.text} • ${trDate(e.date)}</small></div>`).join('');
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Gelişim sinyali var.</b><span>Bu hafta ${weekEvents.length} PR/gelişim yakalandı. Risk düşük/orta kaldığı sürece kontrollü progression devam.</span></div><div class="progressPremiumScore">${weekEvents.length} PR</div></div><div class="progressPremiumList">${top}</div></div>`;
    }else if(events.length){
      let last=events[0];
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Bu hafta sakin ilerleme.</b><span>Yeni PR yok; form, ağrı kontrolü ve düzenli veri öncelikli.</span></div><div class="progressPremiumScore">STABLE</div></div><div class="progressPremiumList"><div>Son PR: <b>${last.exercise}</b><br><small>${last.type} • ${last.text} • ${trDate(last.date)}</small></div></div></div>`;
    }else{
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Veri birikiyor.</b><span>Aynı hareketlerde birkaç seans oluştuktan sonra PR takibi anlamlı hale gelecek.</span></div><div class="progressPremiumScore">BUILD</div></div></div>`;
    }
  };

  try{
    renderCoachPanels();
    renderReadinessPanel();
    renderInjuryRiskPanel();
    renderPhoenixReport();
    renderProgressMotivation();
  }catch(e){console.warn('Coaching V4 refresh skipped',e);}
})();
