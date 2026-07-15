(function(){
  'use strict';

  var DRAFT_PREFIX='simurgGymDraft:';
  var SAVE_DELAY=350;
  var saveTimer=null;
  var dirtyKeys=new Set();
  var restoredDates=new Set();
  var applyingDraft=false;
  var MOBILE_WIDTH=860;

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function isMobile(){return window.innerWidth<=MOBILE_WIDTH;}
  function dateValue(){try{return selectedDate;}catch(e){return new Date().toISOString().slice(0,10);}}
  function draftKey(date){return DRAFT_PREFIX+date;}
  function readDraft(date){
    try{
      var value=JSON.parse(localStorage.getItem(draftKey(date))||'null');
      return value&&value.version===1&&value.date===date?value:null;
    }catch(e){return null;}
  }
  function writeDraft(draft){localStorage.setItem(draftKey(draft.date),JSON.stringify(draft));}
  function removeDraft(date){localStorage.removeItem(draftKey(date));}
  function cardKey(card){return card&&card.dataset?card.dataset.gymKey||'':'';}
  function value(root,selector){var el=root.querySelector(selector);return el?el.value||'':'';}
  function optionalValue(card,selectors){
    for(var i=0;i<selectors.length;i++){var el=card.querySelector(selectors[i]);if(el)return el.value||el.textContent||'';}
    return '';
  }
  function currentCards(){return [].slice.call(document.querySelectorAll('#gymModeList .gymCard[data-gym-key]'));}
  function exerciseFromCard(card,index){
    return {
      key:cardKey(card),originalName:card.dataset.originalName||'',currentName:card.dataset.currentName||'',custom:card.dataset.custom==='1',
      name:value(card,'.gymExerciseName').trim()||'Yeni Hareket',bodyPart:value(card,'.gymExerciseBody').trim()||'Other',
      setCount:Math.max(1,Number(value(card,'.gymExerciseSets'))||1),rpe:value(card,'.gymRpe'),form:value(card,'.gymForm'),pain:value(card,'.gymPain')||'None',
      notes:optionalValue(card,['.gymNotes','[name="notes"]']),nextTarget:optionalValue(card,['.gymNextTarget','[name="nextTarget"]']),duration:optionalValue(card,['.gymDuration','[name="duration"]']),order:index,
      sets:[].slice.call(card.querySelectorAll('.gymSetInputRow')).map(function(row){return {weight:value(row,'.gymWeight'),reps:value(row,'.gymReps')};})
    };
  }
  function captureDraft(date){
    var previous=readDraft(date);var exercises=currentCards().map(exerciseFromCard);
    if(previous&&Array.isArray(previous.exercises))previous.exercises.forEach(function(exercise){if(exercise.deleted&&!exercises.some(function(item){return item.key===exercise.key;}))exercises.push(exercise);});
    var programDay='';try{programDay=getProgramType(dayName(date));}catch(e){}
    return {version:1,date:date,programDay:programDay,exercises:exercises,dirtyKeys:Array.from(dirtyKeys),updatedAt:new Date().toISOString()};
  }
  function status(state,text){
    var gym=document.getElementById('gym');var hero=gym&&gym.querySelector('.gymHero');if(!hero)return;
    var box=document.getElementById('gymDraftStatus');
    if(!box){box=document.createElement('div');box.id='gymDraftStatus';box.className='gymDraftStatus';box.setAttribute('aria-live','polite');hero.appendChild(box);}
    box.dataset.state=state||'saved';box.textContent=text||'Taslak kaydedildi';
  }
  function flushDraft(){
    if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}
    if(!dirtyKeys.size)return readDraft(dateValue());
    var draft=captureDraft(dateValue());writeDraft(draft);status('saved','Taslak kaydedildi');return draft;
  }
  function queueDraft(key){
    if(applyingDraft)return;if(key)dirtyKeys.add(key);status('saving','Kaydediliyor…');if(saveTimer)clearTimeout(saveTimer);
    saveTimer=setTimeout(function(){try{flushDraft();}catch(e){status('dirty','Kaydedilmemiş değişiklikler');console.warn('Gym draft save',e);}},SAVE_DELAY);
  }
  function programEntryFromDraft(draft){
    var entry={overrides:{},extras:[]};
    (draft.exercises||[]).filter(function(exercise){return !exercise.deleted;}).sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(exercise){
      if(exercise.custom)entry.extras.push({id:String(exercise.key||'').replace('custom::',''),name:exercise.name,bodyPart:exercise.bodyPart,setCount:exercise.setCount,custom:true});
      else if(exercise.originalName)entry.overrides[exercise.originalName]={name:exercise.name,bodyPart:exercise.bodyPart,setCount:exercise.setCount};
    });
    return entry;
  }
  function setControl(root,selector,next){var el=root.querySelector(selector);if(el&&next!=null)el.value=next;}
  function setOptionalControl(root,selectors,next){for(var i=0;i<selectors.length;i++){var el=root.querySelector(selectors[i]);if(el){if(next!=null)el.value=next;return;}}}
  function renumberSets(card){[].slice.call(card.querySelectorAll('.gymSetInputRow')).forEach(function(row,index){var label=row.querySelector('strong');if(label)label.textContent='#'+(index+1);});}
  function addSetRemoveButtons(card){
    [].slice.call(card.querySelectorAll('.gymSetInputRow')).forEach(function(row){if(row.querySelector('.gymDraftRemoveSet'))return;var button=document.createElement('button');button.type='button';button.className='gymDraftRemoveSet';button.setAttribute('aria-label','Seti sil');button.textContent='×';row.appendChild(button);});
  }
  function applyExercise(card,exercise,baseAddSet){
    setControl(card,'.gymExerciseName',exercise.name);setControl(card,'.gymExerciseBody',exercise.bodyPart);setControl(card,'.gymExerciseSets',exercise.setCount);setControl(card,'.gymRpe',exercise.rpe);setControl(card,'.gymForm',exercise.form);setControl(card,'.gymPain',exercise.pain||'None');setOptionalControl(card,['.gymNotes','[name="notes"]'],exercise.notes);setOptionalControl(card,['.gymNextTarget','[name="nextTarget"]'],exercise.nextTarget);setOptionalControl(card,['.gymDuration','[name="duration"]'],exercise.duration);
    var rows=[].slice.call(card.querySelectorAll('.gymSetInputRow'));
    while(rows.length<(exercise.sets||[]).length){baseAddSet(exercise.key);rows=[].slice.call(card.querySelectorAll('.gymSetInputRow'));}
    while(rows.length>(exercise.sets||[]).length&&rows.length>1){rows.pop().remove();}
    rows=[].slice.call(card.querySelectorAll('.gymSetInputRow'));
    (exercise.sets||[]).forEach(function(set,index){if(rows[index]){setControl(rows[index],'.gymWeight',set.weight);setControl(rows[index],'.gymReps',set.reps);}});
    renumberSets(card);addSetRemoveButtons(card);
  }
  function ensureDraftActions(){
    var gym=document.getElementById('gym');var hero=gym&&gym.querySelector('.gymHero');if(!hero||hero.querySelector('.gymDraftClear'))return;
    var button=document.createElement('button');button.type='button';button.className='gymMiniBtn gymDraftClear';button.textContent='Taslağı Temizle';button.addEventListener('click',clearCurrentDraft);hero.appendChild(button);
  }
  function enhanceGym(draft,baseAddSet){
    var list=document.getElementById('gymModeList');if(!list)return;var activeDraft=draft||readDraft(dateValue());
    if(activeDraft){
      dirtyKeys=new Set(activeDraft.dirtyKeys||[]);
      (activeDraft.exercises||[]).sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(exercise){var card=[].slice.call(list.querySelectorAll('.gymCard[data-gym-key]')).find(function(item){return cardKey(item)===exercise.key;});if(exercise.deleted){if(card)card.remove();return;}if(card){applyExercise(card,exercise,baseAddSet);list.appendChild(card);}});
      if(!restoredDates.has(activeDraft.date)){restoredDates.add(activeDraft.date);status('restored','Kaydedilmemiş antrenman geri yüklendi.');}else status('saved','Taslak kaydedildi');
    }else{dirtyKeys.clear();status('saved','Değişiklik yok');currentCards().forEach(addSetRemoveButtons);}
    ensureDraftActions();
  }
  function clearCurrentDraft(){
    var date=dateValue();if(!readDraft(date)||!confirm('Kaydedilmemiş tüm girişler silinecek.'))return;
    if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}removeDraft(date);dirtyKeys.clear();restoredDates.delete(date);if(typeof window.renderGymMode==='function')window.renderGymMode();status('saved','Taslak temizlendi');
  }

  function installGymDrafts(){
    if(window.__simurgGymDraftV2Installed||typeof window.renderGymMode!=='function')return;window.__simurgGymDraftV2Installed=true;
    var baseRender=window.renderGymMode;var baseAddSet=window.addGymSet;var baseSave=window.saveGymExercise;var baseDeleteExercise=window.deleteGymExercise;var baseClearExercise=window.clearGymExercise;
    window.renderGymMode=function(){
      var date=dateValue();var draft=readDraft(date);var had=false;var previous;
      try{
        if(draft){had=Object.prototype.hasOwnProperty.call(DATA.customGymPrograms||{},date);previous=had?DATA.customGymPrograms[date]:undefined;if(!DATA.customGymPrograms)DATA.customGymPrograms={};DATA.customGymPrograms[date]=programEntryFromDraft(draft);applyingDraft=true;}
        return baseRender.apply(this,arguments);
      }finally{
        if(draft){if(had)DATA.customGymPrograms[date]=previous;else delete DATA.customGymPrograms[date];}applyingDraft=false;enhanceGym(draft,baseAddSet);
      }
    };
    window.addGymSet=function(key){var result=baseAddSet.apply(this,arguments);var card=document.querySelector('#gymModeList .gymCard[data-gym-key="'+CSS.escape(key)+'"]');if(card){addSetRemoveButtons(card);queueDraft(key);}return result;};
    window.addGymExercise=function(){
      flushDraft();var date=dateValue();var draft=readDraft(date)||captureDraft(date);var id='draft_'+Date.now();var key='custom::'+id;
      draft.exercises.push({key:key,originalName:'Yeni Hareket',currentName:'Yeni Hareket',custom:true,name:'Yeni Hareket',bodyPart:'Other',setCount:3,rpe:'',form:'',pain:'None',notes:'',nextTarget:'',duration:'',order:draft.exercises.length,sets:[{weight:'',reps:''},{weight:'',reps:''},{weight:'',reps:''}]});
      dirtyKeys.add(key);draft.dirtyKeys=Array.from(dirtyKeys);draft.updatedAt=new Date().toISOString();writeDraft(draft);window.renderGymMode();status('saved','Taslak kaydedildi');
    };
    window.deleteGymExercise=function(key){
      var card=document.querySelector('#gymModeList .gymCard[data-gym-key="'+CSS.escape(key)+'"]');
      if(!card||card.dataset.custom!=='1'||String(key).indexOf('custom::draft_')!==0)return baseDeleteExercise.apply(this,arguments);
      if(!confirm((value(card,'.gymExerciseName')||'Bu hareket')+' taslaktan silinsin mi?'))return;
      flushDraft();var date=dateValue();var draft=readDraft(date)||captureDraft(date);draft.exercises=(draft.exercises||[]).filter(function(item){return item.key!==key;});dirtyKeys.delete(key);draft.dirtyKeys=Array.from(dirtyKeys);if(dirtyKeys.size)writeDraft(draft);else removeDraft(date);window.renderGymMode();
    };
    window.clearGymExercise=function(key){
      var card=document.querySelector('#gymModeList .gymCard[data-gym-key="'+CSS.escape(key)+'"]');if(!card)return baseClearExercise.apply(this,arguments);
      if(!confirm((value(card,'.gymExerciseName')||'Bu hareket')+' için kaydedilmemiş girişler temizlensin mi?'))return;
      card.querySelectorAll('.gymWeight,.gymReps').forEach(function(input){input.value='';});setControl(card,'.gymRpe','');setControl(card,'.gymForm','');setControl(card,'.gymPain','None');queueDraft(key);
    };
    window.saveGymExercise=function(key){
      try{
        flushDraft();var result=baseSave.apply(this,arguments);var date=dateValue();dirtyKeys.delete(key);var draft=readDraft(date);
        if(!dirtyKeys.size)removeDraft(date);else if(draft){draft.dirtyKeys=Array.from(dirtyKeys);draft.updatedAt=new Date().toISOString();writeDraft(draft);}
        restoredDates.delete(date);window.renderGymMode();status('saved','Antrenman kaydedildi');return result;
      }catch(e){status('dirty','Kaydedilmemiş değişiklikler');console.error('Gym final save failed; draft preserved.',e);return false;}
    };
    var baseChangeWeek=window.changeWeek;if(typeof baseChangeWeek==='function')window.changeWeek=function(){try{flushDraft();}catch(e){}return baseChangeWeek.apply(this,arguments);};
    var baseGoToday=window.goToday;if(typeof baseGoToday==='function')window.goToday=function(){try{flushDraft();}catch(e){}return baseGoToday.apply(this,arguments);};
    document.addEventListener('input',function(event){var card=event.target.closest&&event.target.closest('#gymModeList .gymCard[data-gym-key]');if(card)queueDraft(cardKey(card));},true);
    document.addEventListener('change',function(event){var card=event.target.closest&&event.target.closest('#gymModeList .gymCard[data-gym-key]');if(card)queueDraft(cardKey(card));},true);
    document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('.gymDraftRemoveSet');if(!button)return;var card=button.closest('.gymCard');var rows=card.querySelectorAll('.gymSetInputRow');if(rows.length<=1)return;button.closest('.gymSetInputRow').remove();renumberSets(card);queueDraft(cardKey(card));});
    window.addEventListener('pagehide',function(){try{flushDraft();}catch(e){}});window.renderGymMode();
  }

  var PRIMARY_IDS=['home','recovery','gym','workout','polar-workout','polar','coaching','program','weekly','monthly','daily','reports','data'];
  function normalizeScreen(id){return id==='polarWorkout'?'polar-workout':id;}
  function keyFromScreen(id){id=normalizeScreen(id);if(id==='workout')return 'logger';if(id==='polar-workout')return 'polarWorkout';if(['home','recovery','gym','polar'].indexOf(id)>=0)return id;return 'menu';}
  function enforceScreen(id,key){
    id=normalizeScreen(id);if(!isMobile()||!id)return;var target=document.getElementById(id);if(!target)return;
    PRIMARY_IDS.forEach(function(screenId){var section=document.getElementById(screenId);if(!section)return;var active=screenId===id;section.classList.toggle('active',active);section.hidden=!active;});
    key=key||keyFromScreen(id);window.activeMobileScreen=id;window.__simurgCurrentMobileKey=key;window.__simurgStableNavKey=key;document.body.setAttribute('data-simurg-active-screen',id);document.documentElement.setAttribute('data-simurg-active-key',key);
    var nav=document.getElementById('simurgV8Nav');if(nav)nav.querySelectorAll('button[data-key]').forEach(function(button){button.classList.toggle('active',button.dataset.key===key);});
  }
  function activeScreen(){var section=document.querySelector('main > .section.active');return section?section.id:(window.activeMobileScreen||'home');}
  function flushGymBeforeNavigation(id){id=normalizeScreen(id);if(activeScreen()==='gym'&&id!=='gym')try{flushDraft();}catch(e){status('dirty','Kaydedilmemiş değişiklikler');}}
  var MENU_ITEMS=[
    {id:'coaching',icon:'🧠',title:'Coaching',description:'Günlük karar ve hedefler'},
    {id:'program',icon:'🧭',title:'Program',description:'Antrenman planını düzenle'},
    {id:'weekly',icon:'📈',title:'Weekly',description:'Haftalık özet'},
    {id:'monthly',icon:'🗓️',title:'Monthly',description:'Aylık gelişim'},
    {id:'polar',icon:'⌁',title:'Polar Data',description:'Recovery, sleep ve load'},
    {id:'data',icon:'💾',title:'Data Center',description:'Sync, backup ve import'}
  ];
  function menuCard(item){return '<button type="button" class="simurgMenuCardV2" data-menu-screen="'+item.id+'"><span class="simurgMenuCardTop"><i>'+item.icon+'</i><em>↗</em></span><b>'+item.title+'</b><small>'+item.description+'</small></button>';}
  function ensureMenuGrid(){
    var grid=document.querySelector('#simurgV8Sheet .simurgV8Grid');if(!grid)return;
    if(grid.dataset.menuGridVersion!=='2'||grid.querySelectorAll('.simurgMenuCardV2').length!==MENU_ITEMS.length){
      grid.classList.add('simurgMenuGridV2');grid.innerHTML=MENU_ITEMS.map(menuCard).join('');grid.dataset.menuGridVersion='2';
      grid.querySelectorAll('[data-menu-screen]').forEach(function(button){button.addEventListener('click',function(){window.simurgV8Go(button.dataset.menuScreen,'menu');});});
    }
  }
  function ensureBottomNav(){
    var nav=document.getElementById('simurgV8Nav');if(!nav)return;
    if(!nav.querySelector('button[data-key="polarWorkout"]')){
      var workoutButton=document.createElement('button');workoutButton.type='button';workoutButton.dataset.key='polarWorkout';workoutButton.innerHTML='<i>⌁</i>Polar Workout';workoutButton.addEventListener('click',function(){window.simurgV8Go('polar-workout','polarWorkout');});
      nav.insertBefore(workoutButton,nav.querySelector('button[data-key="menu"]')||null);
    }
    ['polar','recovery'].forEach(function(key){var obsolete=nav.querySelector('button[data-key="'+key+'"]');if(obsolete)obsolete.remove();});
    var order=['home','gym','logger','polarWorkout','menu'];
    var expected=order.filter(function(key){return nav.querySelector('button[data-key="'+key+'"]');});
    var current=[].slice.call(nav.querySelectorAll(':scope > button[data-key]')).map(function(button){return button.dataset.key;});
    if(current.join('|')!==expected.join('|'))expected.forEach(function(key){var button=nav.querySelector('button[data-key="'+key+'"]');if(button)nav.appendChild(button);});
    nav.classList.add('simurgFiveItemNav');
    if(document.body.getAttribute('data-simurg-active-screen')==='polar'){
      window.__simurgCurrentMobileKey='menu';window.__simurgStableNavKey='menu';
      nav.querySelectorAll('button[data-key]').forEach(function(button){button.classList.toggle('active',button.dataset.key==='menu');});
    }
  }

  function html(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});}
  function usable(value){if(value==null||value===''||value===false||value===-1)return false;var text=String(value).trim();return !!text&&!/^(?:-1|null|undefined|nan|not_available|load_status_not_available)$/i.test(text);}
  function firstValue(){for(var i=0;i<arguments.length;i++)if(usable(arguments[i]))return arguments[i];return null;}
  function polarLabel(value){var text=String(value||'Polar Workout').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();return text.replace(/(^|\s)\S/g,function(char){return char.toUpperCase();});}
  function polarDuration(value){
    if(!usable(value))return '—';
    if(typeof value==='string'&&value.indexOf(':')>=0)return value;
    var minutes=Number(value);if(!Number.isFinite(minutes))return String(value);
    if(minutes>10000)minutes=minutes/60;
    var hours=Math.floor(minutes/60),rest=Math.round(minutes%60);return hours?hours+'s '+rest+'dk':rest+' dk';
  }
  function polarMetric(label,value,unit){return '<div class="mobileLoggerPolarMetric"><small>'+html(label)+'</small><b>'+html(usable(value)?value:'—')+(usable(value)&&unit?' <em>'+html(unit)+'</em>':'')+'</b></div>';}
  function polarStart(value){var match=String(value||'').match(/(?:T|\s|^)(\d{1,2}:\d{2})/);return match?match[1]:(usable(value)?String(value):'—');}
  function zoneValue(value){
    if(!usable(value))return null;
    if(typeof value==='object')return firstValue(value.percentage,value.percent,value.duration,value.time,value.value);
    return value;
  }
  function polarZoneSummary(zones){
    if(!zones||typeof zones!=='object')return '';
    var rows=[];Object.keys(zones).forEach(function(key){var value=zoneValue(zones[key]);if(!usable(value))return;var number=String(key).match(/[1-5]/);var label=number?'Z'+number[0]:String(key).replace(/_/g,' ');var suffix=(typeof value==='number'&&value<=100)||/%$/.test(String(value))?(String(value).replace(/%$/,'')+'%'):String(value);rows.push(label+' '+suffix);});
    return rows.length?'<div class="mobileLoggerPolarZones"><small>HEART ZONES</small><span>'+html(rows.join(' · '))+'</span></div>':'';
  }
  function renderMobileLoggerPolar(){
    var existing=document.getElementById('mobileLoggerPolarCard');
    if(!isMobile()){if(existing)existing.remove();return;}
    var workout=document.getElementById('workout'),hero=document.getElementById('psLoggerHero');
    if(!workout||!hero||!window.SimurgWorkoutSource||typeof window.SimurgWorkoutSource.day!=='function'){if(existing)existing.remove();return;}
    var date=dateValue(),session=window.SimurgWorkoutSource.day(date),polar=session&&session.primaryPolar;
    if(!polar){if(existing)existing.remove();return;}
    var dailyLoad;try{dailyLoad=DATA.polarCardioLoad&&DATA.polarCardioLoad.daily&&DATA.polarCardioLoad.daily[date];}catch(e){dailyLoad=null;}
    var duration=polarDuration(firstValue(polar.duration,polar.durationMinutes));
    var calories=firstValue(polar.activeCal,polar.activeCalories,polar.calories,polar.kilocalories);
    var avgHr=firstValue(polar.avgHR,polar.avgHr,polar.averageHeartRate);
    var maxHr=firstValue(polar.maxHR,polar.maxHr,polar.maximumHeartRate);
    var cardio=firstValue(polar.cardioLoad,polar.trainingLoad,dailyLoad&&dailyLoad.cardioLoad,dailyLoad&&dailyLoad.strain);
    var source=session.gym&&session.gym.length?'Polar + Gym':'Polar';
    var card=existing||document.createElement('section');card.id='mobileLoggerPolarCard';card.className='mobileLoggerPolarCard';
    card.innerHTML='<header><div><small>POLAR WORKOUT</small><h2>'+html(polarLabel(firstValue(polar.workoutType,polar.activityType,polar.type,polar.name)))+'</h2></div><span>'+html(source)+'</span></header>'
      +'<div class="mobileLoggerPolarMetrics">'+polarMetric('Süre',duration)+polarMetric('Kalori',calories,'kcal')+polarMetric('Ort. HR',avgHr,'bpm')+polarMetric('Maks. HR',maxHr,'bpm')+polarMetric('Cardio Load',cardio)+polarMetric('Başlangıç',polarStart(firstValue(polar.startTime,polar.start_time)))+'</div>'
      +polarZoneSummary(typeof window.simurgNormalizePolarZoneData==='function'?window.simurgNormalizePolarZoneData(polar).zones:(polar.zones||polar.heartRateZones))
      +(session.extraPolar&&session.extraPolar.length?'<div class="mobileLoggerPolarExtra">+'+session.extraPolar.length+' ek Polar aktivitesi</div>':'');
    hero.insertAdjacentElement('afterend',card);
  }
  function installLoggerPolar(){
    if(window.__simurgMobileLoggerPolarInstalled)return;window.__simurgMobileLoggerPolarInstalled=true;
    var baseWorkout=window.renderWorkout;if(typeof baseWorkout==='function')window.renderWorkout=function(){var result=baseWorkout.apply(this,arguments);setTimeout(renderMobileLoggerPolar,0);return result;};
    var baseRender=window.render;if(typeof baseRender==='function')window.render=function(){var result=baseRender.apply(this,arguments);setTimeout(renderMobileLoggerPolar,0);return result;};
    renderMobileLoggerPolar();
  }
  function installNavigation(){
    if(window.__simurgSingleMobileScreenV2)return;window.__simurgSingleMobileScreenV2=true;
    var baseShow=window.show;if(typeof baseShow==='function')window.show=function(id,button){var screenId=normalizeScreen(id);flushGymBeforeNavigation(screenId);var result=baseShow.call(this,screenId,button);enforceScreen(screenId,keyFromScreen(screenId));return result;};
    var baseGo=window.simurgV8Go;window.simurgV8Go=function(id,key){var screenId=normalizeScreen(id);flushGymBeforeNavigation(screenId);var stableKey=key||keyFromScreen(screenId);var result=typeof baseGo==='function'?baseGo.call(this,screenId,stableKey):(typeof window.show==='function'?window.show(screenId,null):undefined);enforceScreen(screenId,stableKey);requestAnimationFrame(function(){enforceScreen(screenId,stableKey);});return result;};
    var baseOpen=window.simurgV8OpenMenu;window.simurgV8OpenMenu=function(){var result=typeof baseOpen==='function'?baseOpen.apply(this,arguments):undefined;ensureMenuGrid();ensureBottomNav();var current=activeScreen();window.activeMobileScreen=current;window.__simurgCurrentMobileKey='menu';window.__simurgStableNavKey='menu';var nav=document.getElementById('simurgV8Nav');if(nav)nav.querySelectorAll('button[data-key]').forEach(function(button){button.classList.toggle('active',button.dataset.key==='menu');});return result;};
    var initial=activeScreen();enforceScreen(initial,keyFromScreen(initial));ensureMenuGrid();ensureBottomNav();
  }

  var coachOrder=['coachPanel','readinessCard','targetPanel','injuryRiskCard','phoenixReportCard','progressMotivationCard'];
  function setCoachExpanded(card,expanded){card.classList.toggle('mobileCoachCollapsed',!expanded);var button=card.querySelector('.mobileCoachToggle');if(button){button.setAttribute('aria-expanded',expanded?'true':'false');button.textContent=expanded?'−':'+';}}
  function prepareMobileCoach(){
    var section=document.getElementById('coaching');if(!section)return;var grid=section.querySelector('.coachingGrid');if(!grid)return;
    if(!isMobile()){
      section.classList.remove('gymCoachMobileV2','gp-coaching-empty');var shell=section.querySelector('.gp-coaching-shell');if(shell)shell.remove();
      ['coachPanel','targetPanel','readinessCard','injuryRiskCard','phoenixReportCard','progressMotivationCard'].forEach(function(name){var card=grid.querySelector('.'+name);if(card)grid.appendChild(card);});
      grid.querySelectorAll('.mobileCoachToggle').forEach(function(button){button.remove();});grid.querySelectorAll('.mobileCoachCollapsed').forEach(function(card){card.classList.remove('mobileCoachCollapsed');});return;
    }
    section.classList.remove('gp-coaching-empty');var empty=section.querySelector('.gp-coaching-shell');if(empty)empty.remove();section.classList.add('gymCoachMobileV2');
    coachOrder.forEach(function(name,index){var card=grid.querySelector('.'+name);if(!card)return;grid.appendChild(card);card.dataset.coachV2Field=name;var title=card.querySelector('h2');if(title&&!title.querySelector('.mobileCoachToggle')){var button=document.createElement('button');button.type='button';button.className='mobileCoachToggle';button.addEventListener('click',function(){setCoachExpanded(card,card.classList.contains('mobileCoachCollapsed'));});title.appendChild(button);}setCoachExpanded(card,index<3);});
  }
  function daily(source,date){return source&&source.daily&&source.daily[date]?source.daily[date]:null;}
  function hasValue(next){return next!==null&&next!==undefined&&next!==''&&next!==-1;}
  function collectCoachSignals(date){
    var data;try{data=DATA;}catch(e){data={};}var sleep=daily(data.polarSleep,date)||daily(data.sleep,date);var recharge=daily(data.polarNightlyRecharge,date)||daily(data.nightlyRecharge,date);var cardio=daily(data.polarCardioLoad,date)||daily(data.cardioLoad,date);var workout=(data.workouts||[]).filter(function(row){return row.date===date;});var polar=daily(data.polarWorkouts,date);if(Array.isArray(polar)&&polar.length)polar=polar[0];
    var coverage={sleep:!!sleep,nightlyRecharge:!!recharge,hrv:hasValue(recharge&&(recharge.hrv||recharge.hrvMs)),nightlyHeartRate:hasValue(recharge&&(recharge.heartRateAvg||recharge.nightlyHeartRateAvg)),respiratoryRate:hasValue(recharge&&(recharge.respiratoryRate||recharge.breathingRate)),cardioLoad:!!cardio,workoutCardioLoad:hasValue(polar&&(polar.cardioLoad||polar.trainingLoad)),gym:workout.length>0,rpe:workout.some(function(row){return hasValue(row.rpe);}),form:workout.some(function(row){return hasValue(row.form);}),pain:workout.some(function(row){return hasValue(row.pain)&&row.pain!=='None';})};
    return {date:date,coverage:coverage,available:Object.keys(coverage).filter(function(key){return coverage[key];}),gymRows:workout};
  }
  window.SimurgCoachIntelligenceV2={states:{recovery:['READY','CONTROLLED','RECOVERY_PRIORITY','DATA_COLLECTION'],load:['LOW','MANAGEABLE','HIGH','OVERREACHING','UNKNOWN'],sessionQuality:['GOOD','MIXED','POOR','NO_SESSION'],exerciseAction:['PROGRESS','HOLD','REDUCE','TECHNIQUE_ONLY','SKIP_OR_REPLACE'],confidence:['LOW','MEDIUM','HIGH']},collect:collectCoachSignals};
  function installCoachHooks(){
    var baseRender=window.renderCoachPanels;if(typeof baseRender==='function'&&!baseRender.__coachMobilePrep){window.renderCoachPanels=function(){var result=baseRender.apply(this,arguments);setTimeout(prepareMobileCoach,0);return result;};window.renderCoachPanels.__coachMobilePrep=true;}
    var baseGo=window.simurgV8Go;window.simurgV8Go=function(id,key){var result=baseGo.apply(this,arguments);if(id==='coaching')setTimeout(prepareMobileCoach,0);return result;};prepareMobileCoach();
  }

  ready(function(){
    installGymDrafts();installNavigation();installCoachHooks();installLoggerPolar();ensureMenuGrid();ensureBottomNav();
    document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('#simurgV8Nav button[data-key="menu"]');if(button)setTimeout(function(){ensureMenuGrid();ensureBottomNav();},0);});
    setTimeout(function(){prepareMobileCoach();renderMobileLoggerPolar();ensureMenuGrid();ensureBottomNav();},450);
    setTimeout(function(){ensureMenuGrid();ensureBottomNav();},750);
    setTimeout(function(){ensureMenuGrid();ensureBottomNav();},1300);
  });
  window.addEventListener('resize',function(){
    setTimeout(function(){prepareMobileCoach();renderMobileLoggerPolar();ensureMenuGrid();ensureBottomNav();if(isMobile())enforceScreen(activeScreen(),keyFromScreen(activeScreen()));else PRIMARY_IDS.forEach(function(id){var section=document.getElementById(id);if(section)section.hidden=false;});},100);
    setTimeout(function(){ensureMenuGrid();ensureBottomNav();},500);
  });
})();
