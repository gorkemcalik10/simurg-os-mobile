(function(){
  'use strict';

  var gymActiveKey='';
  var gymEntries=new Map();
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
    var sourceCount=(rows.length?1:0)+(activity?1:0)+(sleepDetail.indexOf('bekleniyor')<0?1:0);
    shell.innerHTML='<header class="miaDailyHead"><div><small>GÜN KAYDI</small><h1>Günlük</h1><p>'+esc(dateLabel(date))+' · '+esc(dayLabel(date))+'</p></div><div class="miaDateNav"><button type="button" onclick="simurgMobileDailyMove(-1)" aria-label="Önceki gün">←</button><button type="button" onclick="simurgMobileDailyToday()">Bugün</button><button type="button" onclick="simurgMobileDailyMove(1)" aria-label="Sonraki gün">→</button></div></header>'
      +'<section class="miaLedgerSummary"><div><small>KAYIT DURUMU</small><h2>'+sourceCount+'/3 kaynak hazır</h2><p>Gym, Polar ve gece verileri bu güne ait tek zaman çizelgesinde.</p></div><div class="miaSourceDots"><i class="'+(rows.length?'done':'')+'">G</i><i class="'+(activity?'done':'')+'">P</i><i class="'+(sleepDetail.indexOf('bekleniyor')<0?'done':'')+'">U</i></div></section>'
      +'<div class="miaTimeline">'
      +'<section class="miaTimelineItem '+(rows.length?'hasData':'')+'"><i>1</i><div><small>GYM KAYDI</small><h2>'+esc(rows.length?Array.from(summary.exercises).slice(0,3).join(' · '):'Antrenman girilmedi')+'</h2><p>'+esc(gymMeta)+'</p><button type="button" onclick="simurgMobileOpenGym()">'+(rows.length?'Kaydı aç':'Gym kaydı ekle')+' →</button></div></section>'
      +'<section class="miaTimelineItem '+(activity?'hasData':'')+'"><i>2</i><div><small>POLAR AKTİVİTESİ</small><h2>'+esc(activityName)+'</h2><p>'+esc(activityMeta)+'</p><button type="button" onclick="simurgMobileOpenData()">'+(activity?'Veri Merkezi':'Polar senkronize et')+' →</button></div></section>'
      +'<section class="miaTimelineItem '+(sleepDetail.indexOf('bekleniyor')<0?'hasData':'')+'"><i>3</i><div><small>GECE & TOPARLANMA</small><h2>'+esc(sleepDetail)+'</h2><p>'+esc(readinessValue==null?'Hazırlık puanı için veri birikiyor.':(readiness.status||'Seçili gün değerlendirmesi'))+'</p></div></section>'
      +'</div>'
      +'<details class="miaDetails"><summary>Günün teknik ayrıntıları <span>+</span></summary><div class="miaDetailBody">'+metric('Hazırlık',readinessValue==null?'—':Math.round(readinessValue),readinessValue==null?'Veri güveni düşük':'100 üzerinden')+metric('Uyku',sleepValue,signals.sleepScore!=null?'Uyku skoru':'Süre / skor')+metric('Kardiyo yükü',loadValue,signals.cardio!=null?'Polar yükü':'Veri bekleniyor')+'</div></details>'
      +'<section class="miaJournalCoach"><div><small>KOÇ NOTU</small><p>'+esc(coachCopy(signals,rows.length>0,!!activity))+'</p></div><button type="button" onclick="simurgV8Go(\'coaching\',\'menu\')">Detay →</button></section>'
      +'<details class="miaDetails miaMore"><summary>Araçlar <span>+</span></summary><div class="miaMoreActions"><button type="button" onclick="exportJSON()">JSON yedeği oluştur</button><button type="button" onclick="simurgMobileOpenData()">Veri Merkezi</button></div></details>';
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
    while(entry.body.firstChild)entry.fragment.appendChild(entry.body.firstChild);
    entry.body.remove();
    entry.card.classList.remove('isOpen');
    entry.summary.setAttribute('aria-expanded','false');
  }
  function openGymKey(key){
    var next=gymEntries.get(key);if(!next)return;
    if(gymActiveKey&&gymActiveKey!==key)closeGymEntry(gymEntries.get(gymActiveKey));
    if(!next.body.parentNode){
      next.card.appendChild(next.body);
      next.body.appendChild(next.fragment);
    }
    next.card.classList.add('isOpen');
    next.summary.setAttribute('aria-expanded','true');
    gymActiveKey=key;
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
  function compactTarget(body){
    var target=body.querySelector(':scope > .gymTargetBox');if(!target||target.closest('.miaTargetDetails'))return;
    var details=document.createElement('details');details.className='miaTargetDetails';
    var summary=document.createElement('summary');summary.innerHTML='<span><b>Sonraki hedef</b><small>Önceki kayda göre güvenli öneri</small></span><i>+</i>';
    target.parentNode.insertBefore(details,target);details.appendChild(summary);details.appendChild(target);
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
      var key=card.dataset.gymKey||'',name=card.querySelector('.gymExerciseName')&&card.querySelector('.gymExerciseName').value||'Egzersiz',body=card.querySelector('.gymExerciseBody')&&card.querySelector('.gymExerciseBody').value||'Bölge',badge=card.querySelector('.gymBadge')&&card.querySelector('.gymBadge').textContent||'',setRows=Array.from(card.querySelectorAll('.gymSetInputRow')),completed=setRows.filter(function(row){return String(row.querySelector('.gymWeight')&&row.querySelector('.gymWeight').value||'').trim()||String(row.querySelector('.gymReps')&&row.querySelector('.gymReps').value||'').trim();}).length;
      var summary=document.createElement('button');summary.type='button';summary.className='miaGymSummary';summary.dataset.gymToggle=key;summary.setAttribute('aria-expanded',key===gymActiveKey?'true':'false');summary.innerHTML='<span class="miaGymOrder">'+String(available.indexOf(key)+1).padStart(2,'0')+'</span><span class="miaGymTitle"><b>'+esc(name)+'</b><small>'+esc(body)+' · '+esc(badge)+'</small></span><span class="miaGymChevron">⌄</span>';
      summary.querySelector('.miaGymTitle small').textContent=body+' · '+completed+'/'+setRows.length+' set dolu';
      var bodyWrap=document.createElement('div');bodyWrap.className='miaGymBody';
      while(card.firstChild)bodyWrap.appendChild(card.firstChild);
      compactExerciseEditor(bodyWrap);
      compactTarget(bodyWrap);
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
    requestAnimationFrame(recompactGymExtras);
  }
  function patchGymRenderer(){
    if(window.__miaGymRendererPatched||typeof window.renderGymMode!=='function')return;
    window.__miaGymRendererPatched=true;
    var base=window.renderGymMode;
    window.renderGymMode=function(){var result=base.apply(this,arguments);mountGymAccordion();return result;};
    try{renderGymMode=window.renderGymMode;}catch(error){}
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
      else if(id==='workout')renderMobileDaily();
      else if(id==='data')mountDataCenter();
      else if(id==='polar'&&window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refresh==='function')window.SimurgPolarBridge.refresh('polar');
      return result;
    };
  }
  function handleResize(){
    if(isMobile()){normalizeMobileShell();patchGymRenderer();}
    else restoreDesktopDaily();
  }
  ready(function(){
    normalizeMobileShell();
    patchGymRenderer();
    patchRouter();
    if(document.body.getAttribute('data-simurg-active-screen')==='gym')mountGymAccordion();
    window.addEventListener('resize',handleResize,{passive:true});
  });
  window.SimurgMobileIA={renderDaily:renderMobileDaily,mountGym:mountGymAccordion,mountData:mountDataCenter};
})();
