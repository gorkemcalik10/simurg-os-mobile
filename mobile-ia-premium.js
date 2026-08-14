(function(){
  'use strict';

  var gymActiveKey='';
  var gymEntries=new Map();
  var journalActiveKey='';
  var dailyArchive=null;
  var dailyShell=null;

  function isMobile(){return window.innerWidth<=900;}
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(value){var n=Number(value);return Number.isFinite(n)?n:null;}
  function dataRoot(){try{return DATA;}catch(error){return window.simurgData||{};}}
  function currentDate(){try{return String(selectedDate||todayStr());}catch(error){return new Date().toISOString().slice(0,10);}}
  function dateLabel(date){try{return trDate(date);}catch(error){return date.split('-').reverse().join('.');}}
  function dayLabel(date){var parsed=new Date(date+'T12:00:00');return isNaN(parsed)?'':parsed.toLocaleDateString('tr-TR',{weekday:'long'});}
  function rowSummary(rows){
    var sets=rows.length,reps=0,volume=0,exercises=new Set();
    rows.forEach(function(row){var rowSets=Math.max(1,Number(row.sets)||1),rowReps=Number(row.reps)||0;reps+=rowSets*rowReps;volume+=rowSets*rowReps*(Number(row.weight)||0);exercises.add(row.exercise||'Egzersiz');});
    return {sets:sets,reps:reps,volume:volume,exercises:exercises};
  }
  function dailySignals(date){
    var data=dataRoot(),sleep=data.polarSleep&&data.polarSleep.daily&&data.polarSleep.daily[date]||{},night=data.polarNightlyRecharge&&data.polarNightlyRecharge.daily&&data.polarNightlyRecharge.daily[date]||{},load=data.polarCardioLoad&&data.polarCardioLoad.daily&&data.polarCardioLoad.daily[date]||{};
    var readiness=null;
    try{readiness=window.SimurgReadiness&&typeof window.SimurgReadiness.resolve==='function'?window.SimurgReadiness.resolve(date):calculateReadiness(date);}catch(error){}
    var sleepScore=num(sleep.sleepScore!=null?sleep.sleepScore:sleep.score);
    var sleepMinutes=num(sleep.sleepDurationMinutes!=null?sleep.sleepDurationMinutes:sleep.durationMinutes);
    var hrv=num(night.heartRateVariabilityAvg!=null?night.heartRateVariabilityAvg:night.hrvMs);
    var cardio=num(load.cardioLoad!=null?load.cardioLoad:load.value);
    return {readiness:readiness,sleepScore:sleepScore,sleepMinutes:sleepMinutes,hrv:hrv,cardio:cardio,night:night,sleep:sleep,load:load};
  }
  function activityFor(date){
    try{
      var source=window.SimurgWorkoutSource&&window.SimurgWorkoutSource.day?window.SimurgWorkoutSource.day(date):null;
      if(source&&source.primaryPolar)return source.primaryPolar;
      if(typeof activitySummaryForDate==='function')return activitySummaryForDate(date);
    }catch(error){}
    return null;
  }
  function coachCopy(signals,hasGym,hasActivity){
    var r=signals.readiness||{},score=num(r.score),status=String(r.status||'').toLowerCase();
    if(score==null)return 'Bugün için hazırlık verisi kısmi. Ağrı, form ve enerji sinyalini kontrol ederek kontrollü başla.';
    if(status.indexOf('recovery')>=0||score<45)return 'Toparlanmayı öne al. Yükü azalt, temiz formu koru ve zorlayıcı progresyon deneme.';
    if(score<70)return 'Plan uygulanabilir; ilk ana harekette performansı kontrol et ve gereksiz ekstra set ekleme.';
    if(hasGym)return 'Hazırlık sinyalleri antrenmanı destekliyor. İlk sette form temizse planlanan ilerlemeyi deneyebilirsin.';
    if(hasActivity)return 'Bugünkü aktivite yükünü toparlanma sinyalleriyle birlikte izle; ek yük eklemek zorunda değilsin.';
    return 'Hazırlık iyi görünüyor. Antrenman planın varsa normal başlayabilir, ilk sette tekrar kalitesini doğrulayabilirsin.';
  }
  function metric(label,value,meta,tone){
    return '<div class="miaMetric '+(tone||'')+'"><small>'+esc(label)+'</small><b>'+esc(value)+'</b><span>'+esc(meta)+'</span></div>';
  }
  function ensureDailyShell(){
    var section=document.getElementById('workout');if(!section)return null;
    if(!dailyArchive){
      dailyArchive=document.createDocumentFragment();
      while(section.firstChild)dailyArchive.appendChild(section.firstChild);
      dailyShell=document.createElement('div');
      dailyShell.id='miaDailyShell';
      dailyShell.className='miaDailyShell';
      section.appendChild(dailyShell);
      section.classList.add('miaMobileDaily');
    }
    return dailyShell;
  }
  function restoreDesktopDaily(){
    var section=document.getElementById('workout');
    if(!section||!dailyArchive)return;
    if(dailyShell&&dailyShell.parentNode)dailyShell.remove();
    section.appendChild(dailyArchive);
    section.classList.remove('miaMobileDaily');
    dailyArchive=null;dailyShell=null;
  }
  function renderMobileDaily(){
    if(!isMobile())return;
    var shell=ensureDailyShell();if(!shell)return;
    var date=currentDate(),data=dataRoot(),rows=(data.workouts||[]).filter(function(row){return row&&row.date===date;}),summary=rowSummary(rows),activity=activityFor(date),signals=dailySignals(date),readiness=signals.readiness||{},readinessValue=num(readiness.score),sleepValue=signals.sleepScore!=null?Math.round(signals.sleepScore):(signals.sleepMinutes!=null?Math.round(signals.sleepMinutes/60*10)/10+' sa':'—'),loadValue=signals.cardio!=null?Math.round(signals.cardio):'—';
    if(readinessValue===0&&!rows.length&&!activity&&!Object.keys(signals.night||{}).length&&!Object.keys(signals.sleep||{}).length){readinessValue=null;signals.readiness={};}
    var activityName=activity&&(activity.workoutType||activity.activityType||activity.name||activity.primary)||'Aktivite kaydı yok';
    var activityMeta=activity?[activity.duration||'',activity.activeCal||activity.calories?Number(activity.activeCal||activity.calories)+' kcal':'',activity.avgHR?activity.avgHR+' bpm':''].filter(Boolean).join(' · '):'Polar senkronizasyonu sonrası burada görünür.';
    var gymMeta=rows.length?summary.sets+' set · '+summary.reps+' tekrar · '+Math.round(summary.volume).toLocaleString('tr-TR')+' kg':'Bu gün için Gym kaydı yok.';
    var sleepDetail=[signals.sleepMinutes!=null?'Uyku '+Math.round(signals.sleepMinutes/60*10)/10+' saat':'',signals.hrv!=null?'HRV '+Math.round(signals.hrv)+' ms':''].filter(Boolean).join(' · ')||'Uyku ve HRV verisi bekleniyor.';
    shell.innerHTML='<header class="miaDailyHead"><div><small>SEÇİLİ GÜN</small><h1>Günlük</h1><p>'+esc(dateLabel(date))+' · '+esc(dayLabel(date))+'</p></div><div class="miaDateNav"><button type="button" onclick="simurgMobileDailyMove(-1)" aria-label="Önceki gün">←</button><button type="button" onclick="simurgMobileDailyToday()">Bugün</button><button type="button" onclick="simurgMobileDailyMove(1)" aria-label="Sonraki gün">→</button></div></header>'
      +'<section class="miaCoachCard"><small>SIMURG İÇGÖRÜSÜ</small><h2>'+esc(readinessValue==null?'Veri birikiyor':(readiness.status||'Günün kararı'))+'</h2><p>'+esc(coachCopy(signals,rows.length>0,!!activity))+'</p><button type="button" onclick="simurgV8Go(\'coaching\',\'menu\')">Koçluk detayını aç →</button></section>'
      +'<div class="miaMetricGrid">'+metric('Hazırlık',readinessValue==null?'—':Math.round(readinessValue),readinessValue==null?'Veri güveni düşük':'100 üzerinden','ready')+metric('Uyku',sleepValue,signals.sleepScore!=null?'Uyku skoru':'Süre / skor','sleep')+metric('Yük',loadValue,signals.cardio!=null?'Kardiyo yükü':'Veri bekleniyor','load')+'</div>'
      +'<section class="miaDayCard"><div class="miaCardIcon">G</div><div><small>GÜNÜN GYM ANTRENMANI</small><h2>'+esc(rows.length?Array.from(summary.exercises).slice(0,2).join(' · '):'Kayıt bulunmuyor')+'</h2><p>'+esc(gymMeta)+'</p></div><button type="button" onclick="simurgMobileOpenGym()">Gym →</button></section>'
      +'<section class="miaDayCard"><div class="miaCardIcon polar">P</div><div><small>GÜNÜN POLAR AKTİVİTESİ</small><h2>'+esc(activityName)+'</h2><p>'+esc(activityMeta)+'</p></div><button type="button" onclick="simurgMobileOpenData()">Senkronize et →</button></section>'
      +'<details class="miaDetails"><summary>Sağlık ve veri ayrıntıları <span>+</span></summary><div class="miaDetailBody">'+metric('Uyku / HRV',sleepDetail,'Polar gece sinyalleri')+metric('Toparlanma',readinessValue==null?'Kısmi':readiness.status||'—',readiness.advice||'Seçili gün değerlendirmesi')+metric('Aktivite yükü',activityMeta,'Seçili gün kaynağı')+'</div></details>'
      +'<details class="miaDetails miaMore"><summary>Daha Fazla <span>+</span></summary><div class="miaMoreActions"><button type="button" onclick="exportJSON()">JSON yedeği oluştur</button><button type="button" onclick="simurgMobileOpenData()">Veri Merkezi</button></div></details>';
  }
  function dailySelect(date){
    try{selectedDate=date;weekStart=mondayOf(date);}catch(error){}
    renderMobileDaily();
  }
  window.simurgMobileDailyMove=function(amount){try{dailySelect(addDays(currentDate(),amount));}catch(error){}};
  window.simurgMobileDailyToday=function(){try{dailySelect(todayStr());}catch(error){}};
  window.simurgMobileOpenGym=function(){if(typeof window.simurgV8Go==='function')window.simurgV8Go('gym','gym');};
  window.simurgMobileOpenData=function(){if(typeof window.simurgV8Go==='function')window.simurgV8Go('data','menu');};
  window.simurgMobileOpenPolarDetails=function(){
    if(window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refresh==='function')window.SimurgPolarBridge.refresh('polar');
    if(typeof window.simurgV8Go==='function')window.simurgV8Go('polar','menu');
  };

  function closeGymEntry(entry){
    if(!entry||!entry.body||!entry.body.parentNode)return;
    if(typeof window.simurgCaptureGymCardDraft==='function')window.simurgCaptureGymCardDraft(entry.card);
    while(entry.body.firstChild)entry.fragment.appendChild(entry.body.firstChild);
    entry.body.remove();
    entry.card.classList.remove('isOpen');
    entry.summary.setAttribute('aria-expanded','false');
  }
  function openGymKey(key){
    var next=gymEntries.get(key);if(!next)return;
    if(gymActiveKey===key&&next.body.parentNode){
      closeGymEntry(next);
      gymActiveKey='';
      return;
    }
    if(gymActiveKey&&gymActiveKey!==key)closeGymEntry(gymEntries.get(gymActiveKey));
    if(!next.body.parentNode){
      next.card.appendChild(next.body);
      next.body.appendChild(next.fragment);
    }
    next.card.classList.add('isOpen');
    next.summary.setAttribute('aria-expanded','true');
    gymActiveKey=key;
  }
  function openGymAndFocus(key,options){
    var entry=gymEntries.get(key);if(!entry)return false;
    if(gymActiveKey!==key||!entry.body.parentNode)openGymKey(key);
    if(options&&options.focus){
      var input=entry.card.querySelector('.gymWeight:not([disabled]),.gymExerciseName:not([disabled])');
      if(input)try{input.focus({preventScroll:true});}catch(error){input.focus();}
    }
    requestAnimationFrame(function(){
      entry.card.scrollIntoView({behavior:'smooth',block:'start'});
      if(options&&options.focus){
        var currentInput=entry.card.querySelector('.gymWeight:not([disabled]),.gymExerciseName:not([disabled])');
        if(currentInput)try{currentInput.focus({preventScroll:true});}catch(error){currentInput.focus();}
      }
    });
    return true;
  }
  function compactProgramEditor(list){
    var add=list.querySelector('.gymAddCard');if(!add||add.closest('.miaProgramEditor'))return;
    var details=document.createElement('details');details.className='miaProgramEditor';
    var summary=document.createElement('summary');summary.innerHTML='<span><b>Programı düzenle</b><small>Egzersiz ekle veya planı değiştir</small></span><i>+</i>';
    details.appendChild(summary);add.parentNode.insertBefore(details,add);details.appendChild(add);
  }
  function compactExerciseEditor(body){
    var head=body.querySelector(':scope > .gymCardHead');if(!head||head.closest('.miaExerciseEditor'))return;
    var details=document.createElement('details');details.className='miaExerciseEditor';
    var summary=document.createElement('summary');summary.innerHTML='<span>Egzersiz ayarları</span><i>+</i>';
    body.insertBefore(details,head);details.appendChild(summary);details.appendChild(head);
  }
  function recompactGymExtras(){
    gymEntries.forEach(function(entry){
      Array.from(entry.card.children).forEach(function(child){
        if(child===entry.summary||child===entry.body)return;
        if(entry.body.parentNode)entry.body.appendChild(child);else entry.fragment.appendChild(child);
      });
    });
  }
  function mountGymAccordion(){
    if(!isMobile())return;
    var list=document.getElementById('gymModeList');if(!list)return;
    compactProgramEditor(list);
    var cards=Array.from(list.querySelectorAll('.gymCard'));
    if(!cards.length)return;
    if(cards.every(function(card){return !!card.querySelector(':scope > .miaGymSummary');})){recompactGymExtras();return;}
    gymEntries=new Map();
    var available=cards.map(function(card){return card.dataset.gymKey;});
    if(!available.includes(gymActiveKey))gymActiveKey=available[0];
    cards.forEach(function(card){
      if(card.querySelector(':scope > .miaGymSummary'))return;
      var key=card.dataset.gymKey||'',name=card.querySelector('.gymExerciseName')&&card.querySelector('.gymExerciseName').value||'Egzersiz',body=card.querySelector('.gymExerciseBody')&&card.querySelector('.gymExerciseBody').value||'Bölge',badge=card.querySelector('.gymBadge')&&card.querySelector('.gymBadge').textContent||'';
      var summary=document.createElement('button');summary.type='button';summary.className='miaGymSummary';summary.dataset.gymToggle=key;summary.setAttribute('aria-expanded',key===gymActiveKey?'true':'false');summary.innerHTML='<span class="miaGymOrder">'+String(available.indexOf(key)+1).padStart(2,'0')+'</span><span class="miaGymTitle"><b>'+esc(name)+'</b><small>'+esc(body)+' · '+esc(badge)+'</small></span><span class="miaGymChevron">⌄</span>';
      var bodyWrap=document.createElement('div');bodyWrap.className='miaGymBody';
      while(card.firstChild)bodyWrap.appendChild(card.firstChild);
      compactExerciseEditor(bodyWrap);
      card.appendChild(summary);card.appendChild(bodyWrap);
      var fragment=document.createDocumentFragment();
      var entry={card:card,summary:summary,body:bodyWrap,fragment:fragment};
      gymEntries.set(key,entry);
      if(key!==gymActiveKey)closeGymEntry(entry);else card.classList.add('isOpen');
    });
    if(!list.__miaGymBound){
      list.__miaGymBound=true;
      list.addEventListener('click',function(event){var button=event.target.closest('[data-gym-toggle]');if(button&&list.contains(button))openGymKey(button.dataset.gymToggle);});
    }
    setTimeout(recompactGymExtras,200);
  }
  function restoreDesktopGym(){
    var list=document.getElementById('gymModeList');if(!list)return;
    gymEntries.forEach(function(entry){
      if(!entry.body.parentNode){entry.card.appendChild(entry.body);entry.body.appendChild(entry.fragment);}
      Array.from(entry.body.children).forEach(function(child){
        if(child.classList&&child.classList.contains('miaExerciseEditor')){
          var head=child.querySelector(':scope > .gymCardHead');if(head)entry.card.appendChild(head);child.remove();
        }else entry.card.appendChild(child);
      });
      entry.body.remove();entry.summary.remove();entry.card.classList.remove('isOpen');
    });
    var editor=list.querySelector(':scope > .miaProgramEditor');
    if(editor){var add=editor.querySelector('.gymAddCard');if(add)list.insertBefore(add,editor);editor.remove();}
    gymEntries=new Map();gymActiveKey='';
  }
  function patchGymRenderer(){
    if(window.__miaGymRendererPatched||typeof window.renderGymMode!=='function')return;
    window.__miaGymRendererPatched=true;
    var base=window.renderGymMode;
    window.renderGymMode=function(){var result=base.apply(this,arguments);mountGymAccordion();return result;};
    try{renderGymMode=window.renderGymMode;}catch(error){}
  }

  function journalNumber(value){
    var normalized=String(value==null?'':value).replace(/\./g,'').replace(',','.');
    var parsed=Number(normalized);
    return Number.isFinite(parsed)?parsed:0;
  }
  function journalExerciseKey(card,index){
    var group=card.closest('.group');
    var body=group&&group.querySelector('.groupTitle');
    var name=card.querySelector('.exName');
    return [body&&body.textContent||'',name&&name.textContent||'',index].join('::');
  }
  function journalExerciseStats(card){
    var rows=Array.from(card.querySelectorAll('.setTable tbody tr'));
    var reps=0,volume=0;
    rows.forEach(function(row){
      var cells=row.querySelectorAll('td');
      var rowReps=journalNumber(cells[1]&&cells[1].textContent);
      var weight=journalNumber(cells[2]&&cells[2].textContent);
      reps+=rowReps;volume+=rowReps*weight;
    });
    return {sets:rows.length,reps:reps,volume:Math.round(volume)};
  }
  function closeJournalExercise(card){
    if(!card)return;
    card.classList.remove('isJournalOpen');
    var toggle=card.querySelector(':scope > .mjExerciseToggle');
    if(toggle)toggle.setAttribute('aria-expanded','false');
  }
  function openJournalExercise(card,key){
    Array.from(document.querySelectorAll('#workoutGroups .exerciseCard.isJournalOpen')).forEach(function(open){
      if(open!==card)closeJournalExercise(open);
    });
    var opening=!card.classList.contains('isJournalOpen');
    closeJournalExercise(card);
    journalActiveKey='';
    if(opening){
      card.classList.add('isJournalOpen');
      var toggle=card.querySelector(':scope > .mjExerciseToggle');
      if(toggle)toggle.setAttribute('aria-expanded','true');
      journalActiveKey=key;
    }
  }
  function mountJournalDashboard(){
    if(!isMobile())return;
    var section=document.getElementById('workout');
    var groups=document.getElementById('workoutGroups');
    if(!section||!groups)return;
    section.classList.add('miaJournalDashboard');
    var cards=Array.from(groups.querySelectorAll('.exerciseCard'));
    cards.forEach(function(card,index){
      if(card.querySelector(':scope > .mjExerciseToggle'))return;
      var name=card.querySelector('.exName');
      var profile=card.querySelector('.loadProfileTag');
      var stats=journalExerciseStats(card);
      var key=journalExerciseKey(card,index);
      card.dataset.journalKey=key;
      var toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='mjExerciseToggle';
      toggle.setAttribute('aria-expanded',key===journalActiveKey?'true':'false');
      toggle.innerHTML='<span class="mjExerciseIdentity"><b>'+esc(name&&name.textContent||'Egzersiz')+'</b><small>'+esc(profile&&profile.textContent||'Kayıtlı egzersiz')+'</small></span>'
        +'<span class="mjExerciseNumbers"><strong>'+stats.sets+' set</strong><em>'+stats.reps+' tekrar</em></span><i>⌄</i>';
      toggle.addEventListener('click',function(){openJournalExercise(card,key);});
      var body=document.createElement('div');
      body.className='mjExerciseBody';
      Array.from(card.children).forEach(function(child){
        if(child.classList&&child.classList.contains('mjExerciseToggle'))return;
        body.appendChild(child);
      });
      card.appendChild(toggle);
      card.appendChild(body);
      if(key===journalActiveKey)card.classList.add('isJournalOpen');
    });
    if(journalActiveKey&&!groups.querySelector('.exerciseCard[data-journal-key="'+CSS.escape(journalActiveKey)+'"]'))journalActiveKey='';
  }
  function patchJournalRenderer(){
    if(window.__miaJournalRendererPatched||typeof window.renderWorkout!=='function')return;
    window.__miaJournalRendererPatched=true;
    var base=window.renderWorkout;
    window.renderWorkout=function(){
      var result=base.apply(this,arguments);
      mountJournalDashboard();
      return result;
    };
    try{renderWorkout=window.renderWorkout;}catch(error){}
  }

  function ensureDataHub(){
    if(!isMobile())return null;
    var data=document.getElementById('data');if(!data)return null;
    var hub=document.getElementById('mobilePolarSyncHub');
    if(!hub){
      hub=document.createElement('section');hub.id='mobilePolarSyncHub';hub.className='miaPolarHub';
      var top=data.querySelector('.topbar');if(top)top.insertAdjacentElement('afterend',hub);else data.insertBefore(hub,data.firstChild);
    }
    return hub;
  }
  function mountDataCenter(){
    var hub=ensureDataHub();if(!hub)return;
    if(window.SimurgPolarAccessLink&&typeof window.SimurgPolarAccessLink.mount==='function')window.SimurgPolarAccessLink.mount();
    if(!hub.querySelector('.miaPolarDetailsAction')){
      var action=document.createElement('button');action.type='button';action.className='miaPolarDetailsAction';action.textContent='Polar verilerini görüntüle →';action.setAttribute('onclick','simurgMobileOpenPolarDetails()');hub.appendChild(action);
    }
  }
  function normalizeMobileShell(){
    if(!isMobile())return;
    document.querySelectorAll('.simurgMobileBottomNav,.simurgMobileSheet,.simurgMobileShade').forEach(function(node){node.remove();});
    ['weeklyReport','monthlyReport'].forEach(function(id){var report=document.getElementById(id);if(report)report.replaceChildren();});
    var nav=document.getElementById('simurgV8Nav');
    if(nav&&nav.querySelector('[data-key="polar"]'))nav.querySelector('[data-key="polar"]').remove();
    var grid=document.querySelector('#simurgV8Sheet .simurgV8Grid');
    if(grid)grid.innerHTML='<button onclick="simurgV8Go(\'coaching\',\'menu\')"><i>🧠</i><span><b>Koçluk</b><small>Günlük karar ve öneriler</small></span></button><button onclick="simurgV8Go(\'program\',\'menu\')"><i>🧭</i><span><b>Program</b><small>Antrenman planı</small></span></button><button onclick="simurgV8Go(\'data\',\'menu\')"><i>◉</i><span><b>Veri Merkezi</b><small>Polar, bulut ve yedek</small></span></button>';
  }
  function patchRouter(){
    if(window.__miaRouterPatched||typeof window.simurgV8Go!=='function')return;
    window.__miaRouterPatched=true;
    var base=window.simurgV8Go;
    window.simurgV8Go=function(id,key){
      var result=base.apply(this,arguments);
      if(!isMobile())return result;
      ['weeklyReport','monthlyReport'].forEach(function(reportId){var report=document.getElementById(reportId);if(report)report.replaceChildren();});
      if(id==='gym')mountGymAccordion();
      else if(id==='workout')mountJournalDashboard();
      else if(id==='data')mountDataCenter();
      else if(id==='polar'&&window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refresh==='function')window.SimurgPolarBridge.refresh('polar');
      return result;
    };
  }
  function handleResize(){
    if(isMobile()){normalizeMobileShell();patchGymRenderer();patchJournalRenderer();mountGymAccordion();}
    else{restoreDesktopGym();restoreDesktopDaily();}
  }
  ready(function(){
    normalizeMobileShell();
    patchGymRenderer();
    patchJournalRenderer();
    patchRouter();
    if(document.body.getAttribute('data-simurg-active-screen')==='gym')mountGymAccordion();
    if(document.body.getAttribute('data-simurg-active-screen')==='workout')mountJournalDashboard();
    window.addEventListener('resize',handleResize,{passive:true});
  });
  window.SimurgMobileIA={renderDaily:renderMobileDaily,mountGym:mountGymAccordion,mountJournal:mountJournalDashboard,mountData:mountDataCenter,openGym:openGymAndFocus};
})();
