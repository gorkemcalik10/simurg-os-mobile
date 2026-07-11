(function(){
  'use strict';
  var homeTab='overview';
  var homeTabs=['overview','recovery','sleep','load'];

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function dataRoot(){try{return DATA||{};}catch(e){return window.simurgData||window.DATA||{};}}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(value){if(value==null||value==='')return null;var n=Number(value);return Number.isFinite(n)?n:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i++){var n=number(arguments[i]);if(n!=null)return n;}return null;}
  function text(value,fallback){var result=String(value==null?'':value).trim();return result||fallback||'';}
  function activityLabel(value){
    var raw=text(value,'Polar Workout');
    if(raw.toLowerCase()==='polar_flow_workout') return 'Polar Workout';
    return raw.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase().replace(/(^|\s)\S/g,function(letter){return letter.toUpperCase();});
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function formatSleep(minutes){if(minutes==null)return '—';var h=Math.floor(minutes/60),m=Math.round(minutes%60);return h+'h '+String(m).padStart(2,'0')+'m';}
  function formatDate(value){if(!value)return '—';try{return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return value;}}
  function latestFromDaily(daily){
    if(!daily||typeof daily!=='object')return null;
    var dates=Object.keys(daily).filter(Boolean).sort();
    return dates.length?daily[dates[dates.length-1]]:null;
  }
  function bridgeEntry(data){return latestFromDaily(data.polarBridge&&data.polarBridge.daily);}
  function recoveryEntry(data){
    var entry=latestFromDaily(data.recoveryEntries);
    if(entry)return entry;
    var rows=Array.isArray(data.recovery)?data.recovery.slice().filter(function(x){return x&&x.date;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));}):[];
    return rows.length?rows[rows.length-1]:null;
  }
  function polarWorkout(data){return data.polarWorkouts&&data.polarWorkouts.latest?data.polarWorkouts.latest:null;}
  function latestApple(data){
    var rows=Array.isArray(data.appleWatch)?data.appleWatch.slice().filter(function(x){return x&&x.date;}):[];
    rows.sort(function(a,b){return (String(a.date)+String(a.startTime||'')).localeCompare(String(b.date)+String(b.startTime||''));});
    return rows.length?rows[rows.length-1]:null;
  }
  function homeModel(){
    var data=dataRoot(),bridge=bridgeEntry(data)||{},recovery=recoveryEntry(data)||{},polar=polarWorkout(data),apple=latestApple(data);
    var sleepMinutes=firstNumber(bridge.sleepDurationMinutes,recovery.sleepDurationMinutes,recovery.sleepMinutes);
    var sleepScore=firstNumber(bridge.sleepScore,recovery.sleepScore);
    var nightly=firstNumber(bridge.nightlyRecharge,recovery.nightlyRecharge,recovery.nightlyRechargeScore);
    var readiness=firstNumber(recovery.readiness,recovery.readinessScore,nightly);
    var hrv=firstNumber(bridge.hrvMs,recovery.hrvMs,recovery.hrv);
    var rhr=firstNumber(bridge.restingHr,recovery.restingHr,recovery.restingHR,recovery.rhr);
    var sleepHr=firstNumber(bridge.sleepHr,recovery.sleepHr,recovery.sleepHR);
    var respiratory=firstNumber(bridge.respiratoryRate,recovery.respiratoryRate);
    var load=polar?firstNumber(polar.trainingLoad):firstNumber(bridge.cardioLoad,recovery.activityLoad,recovery.physicalLoad);
    var activeEnergy=firstNumber(bridge.activeEnergyKcal,bridge.activeEnergy,polar&&polar.activeCal,apple&&apple.activeCal);
    var rpe=firstNumber(polar&&polar.rpe,bridge.workouts&&bridge.workouts[0]&&bridge.workouts[0].rpe,apple&&apple.rpe);
    var stages=bridge.sleepStages||recovery.sleepStages||null;
    var activity=polar?{name:activityLabel(polar.workoutType||polar.activityType||'Polar Workout'),duration:polar.duration,date:polar.date,cal:polar.activeCal,avgHR:polar.avgHR,source:'Polar Flow'}:
      apple?{name:activityLabel(apple.activityType||apple.workoutType||'Activity'),duration:apple.duration,date:apple.date,cal:apple.activeCal,avgHR:apple.avgHR,source:'Apple Watch'}:
      bridge.workouts&&bridge.workouts[0]?{name:activityLabel(bridge.workouts[0].type||'Workout'),duration:bridge.workouts[0].duration,date:bridge.date,cal:bridge.workouts[0].activeEnergy,avgHR:bridge.workouts[0].avgHr,source:'Polar Bridge'}:null;
    return {data:data,bridge:bridge,recovery:recovery,polar:polar,apple:apple,sleepMinutes:sleepMinutes,sleepScore:sleepScore,nightly:nightly,readiness:readiness,hrv:hrv,rhr:rhr,sleepHr:sleepHr,respiratory:respiratory,load:load,activeEnergy:activeEnergy,rpe:rpe,stages:stages,activity:activity};
  }
  function metric(label,value,unit){var textValue=label==='Latest Activity'||label==='Aggressiveness';return '<div class="gp-metric '+(textValue?'gp-metric-text':'')+'"><small>'+esc(label)+'</small><b>'+esc(value==null?'—':value)+(value==null?'':'<em>'+esc(unit||'')+'</em>')+'</b></div>';}
  function ring(label,value,color){var pct=value==null?0:clamp(value,0,100);return '<div class="gp-ring-card"><div class="gp-ring" style="--gp-value:'+pct+'%;--gp-ring-color:'+color+'"><div><b>'+esc(value==null?'—':Math.round(value))+'</b><small>/100</small></div></div><small>'+esc(label)+'</small></div>';}
  function recoveryRingColor(value){if(value==null||value>=60)return '#80c72e';if(value>=40)return '#f1b721';return '#e33a46';}
  function loadRingColor(value){if(value==null||value<55)return '#168ed5';if(value<70)return '#f1b721';if(value<85)return '#e77d18';return '#e33a46';}
  function planName(model){
    try{var date=today();if(typeof dayName==='function'&&typeof getProgramType==='function')return getProgramType(dayName(date));}catch(e){}
    var names=model.data.programNames||{};var day=new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(new Date());return names[day]||'Plan data waiting';
  }
  function recoveryInterpretation(model){
    if(model.readiness==null&&model.hrv==null&&model.rhr==null)return 'Recovery data is waiting for the next Polar sync.';
    if((model.readiness!=null&&model.readiness<60)||(model.hrv!=null&&model.hrv<45)||(model.rhr!=null&&model.rhr>60))return 'Recovery signals suggest a controlled start. Keep the plan, but avoid aggressive progression.';
    return 'Available recovery signals support the current plan. Begin with clean, controlled working sets.';
  }
  function sleepInterpretation(model){
    if(model.sleepMinutes==null&&model.sleepScore==null)return 'Sleep detail is not available from the latest sync.';
    if((model.sleepMinutes!=null&&model.sleepMinutes<360)||(model.sleepScore!=null&&model.sleepScore<60))return 'Sleep recovery is limited. Keep today compact and protect movement quality.';
    return 'Available sleep signals are compatible with a normal, controlled training day.';
  }
  function loadAggressiveness(model){
    if(model.load==null&&model.rpe==null)return 'WAITING';
    if((model.load!=null&&model.load>=70)||(model.rpe!=null&&model.rpe>=8))return 'REDUCED';
    return 'NORMAL';
  }
  function loadInterpretation(model){var status=loadAggressiveness(model);if(status==='WAITING')return 'Load data is waiting for an imported activity or Polar Workout.';if(status==='REDUCED')return 'Recent load calls for reduced aggressiveness. Keep the program, but do not chase progression.';return 'Current load is manageable. Keep the program and start the first working sets controlled.';}
  function coachSentence(model){
    if(model.readiness==null&&model.load==null&&!model.activity)return 'Daily data is waiting for the next Polar or workout import.';
    if(loadAggressiveness(model)==='REDUCED')return 'Protect quality today: keep the program, reduce aggressiveness, and leave repetitions in reserve.';
    if(model.readiness!=null&&model.readiness<60)return 'Recovery is controlled. Keep the plan, but make the first working sets conservative.';
    return 'Today supports the current plan. Build intensity gradually and keep form quality high.';
  }
  function overviewPane(model){
    var activity=model.activity;
    return '<div class="gp-home-pane active" data-home-pane="overview"><div class="gp-card"><div class="gp-card-head"><h2>Daily Summary</h2><span>'+esc(formatDate(today()))+'</span></div><div class="gp-ring-grid">'+ring('Sleep',model.sleepScore,'#57c7f2')+ring('Recovery',model.readiness,recoveryRingColor(model.readiness))+ring('Load',model.load,loadRingColor(model.load))+'</div></div><div class="gp-duo"><div class="gp-card gp-plan"><small class="gp-kicker">Today\'s Plan</small><h3>'+esc(planName(model))+'</h3><p>Program logic remains unchanged. Start with a controlled ramp-up.</p></div><div class="gp-card gp-activity"><small class="gp-kicker">Latest Activity</small><h3>'+esc(activity?activity.name:'No activity yet')+'</h3><p>'+(activity?esc([activity.duration,activity.cal!=null?activity.cal+' kcal':'',activity.source].filter(Boolean).join(' · ')):'Import activity data from Data Center.')+'</p></div></div><div class="gp-card gp-coach"><i>⌁</i><p>'+esc(coachSentence(model))+'</p></div></div>';
  }
  function recoveryPane(model){
    return '<div class="gp-home-pane active" data-home-pane="recovery"><div class="gp-card"><div class="gp-hero-row"><div class="gp-ring gp-hero-ring" style="--gp-value:'+(model.readiness==null?0:clamp(model.readiness,0,100))+'%;--gp-ring-color:#80c72e"><div><b>'+esc(model.readiness==null?'—':Math.round(model.readiness))+'</b><small>Recovery</small></div></div><div class="gp-hero-copy"><small class="gp-kicker">Recovery</small><h2>'+esc(model.readiness==null?'Waiting for data':model.readiness>=70?'Ready signal':'Controlled signal')+'</h2><p>'+esc(recoveryInterpretation(model))+'</p></div></div></div><div class="gp-card"><div class="gp-card-head"><h2>Recovery Metrics</h2><span>Polar</span></div><div class="gp-metric-grid">'+metric('Nightly Recharge',model.nightly,'')+metric('HRV',model.hrv,'ms')+metric('Resting HR',model.rhr,'bpm')+metric('Sleep HR',model.sleepHr,'bpm')+metric('Respiratory Rate',model.respiratory,'/min')+metric('Recovery',model.readiness,'/100')+'</div><div class="gp-interpret">'+esc(recoveryInterpretation(model))+'</div></div></div>';
  }
  function stageBar(stages){
    if(!stages)return '<div class="gp-empty">Sleep stages are not available from the latest sync.</div>';
    var deep=firstNumber(stages.deepMinutes,stages.deep)||0,rem=firstNumber(stages.remMinutes,stages.rem)||0,light=firstNumber(stages.lightMinutes,stages.light)||0,awake=firstNumber(stages.awakeMinutes,stages.awake)||0,total=deep+rem+light+awake;
    if(!total)return '<div class="gp-empty">Sleep stages are not available from the latest sync.</div>';
    function width(v){return (v/total*100).toFixed(2);}
    return '<div class="gp-stage-bar"><span style="width:'+width(deep)+'%"></span><span style="width:'+width(rem)+'%"></span><span style="width:'+width(light)+'%"></span><span style="width:'+width(awake)+'%"></span></div><div class="gp-stage-grid"><div class="gp-stage"><small>Deep</small><b>'+Math.round(deep)+'m</b></div><div class="gp-stage"><small>REM</small><b>'+Math.round(rem)+'m</b></div><div class="gp-stage"><small>Light</small><b>'+Math.round(light)+'m</b></div><div class="gp-stage"><small>Awake</small><b>'+Math.round(awake)+'m</b></div></div>';
  }
  function sleepPane(model){
    return '<div class="gp-home-pane active" data-home-pane="sleep"><div class="gp-card"><div class="gp-hero-row"><div class="gp-ring gp-hero-ring" style="--gp-value:'+(model.sleepScore==null?0:clamp(model.sleepScore,0,100))+'%;--gp-ring-color:#168ed5"><div><b>'+esc(model.sleepScore==null?'—':Math.round(model.sleepScore))+'</b><small>Sleep</small></div></div><div class="gp-hero-copy"><small class="gp-kicker">Sleep Summary</small><h2>'+esc(formatSleep(model.sleepMinutes))+'</h2><p>'+esc(sleepInterpretation(model))+'</p></div></div></div><div class="gp-card"><div class="gp-card-head"><h2>Sleep Stages</h2><span>'+esc(model.sleepMinutes==null?'Waiting':formatSleep(model.sleepMinutes))+'</span></div>'+stageBar(model.stages)+'<div class="gp-interpret">'+esc(sleepInterpretation(model))+'</div></div></div>';
  }
  function loadPane(model){
    var status=loadAggressiveness(model),tone=status==='NORMAL'?'good':status==='REDUCED'?'warn':'';
    return '<div class="gp-home-pane active" data-home-pane="load"><div class="gp-card"><div class="gp-card-head"><h2>Load Summary</h2><span class="gp-status '+tone+'">'+status+'</span></div><div class="gp-metric-grid">'+metric('Activity / Cardio Load',model.load,'')+metric('Active Energy',model.activeEnergy,'kcal')+metric('RPE',model.rpe,'/10')+metric('Polar Workout Load',model.polar&&number(model.polar.trainingLoad),'')+metric('Latest Activity',model.activity?model.activity.name:'—','')+metric('Aggressiveness',status,'')+'</div><div class="gp-interpret">'+esc(loadInterpretation(model))+'</div></div>'+(model.activity?'<div class="gp-card gp-activity"><small class="gp-kicker">Latest Workout / Activity</small><h3>'+esc(model.activity.name)+'</h3><p>'+esc([model.activity.date,model.activity.duration,model.activity.cal!=null?model.activity.cal+' kcal':'',model.activity.avgHR!=null?'Avg HR '+model.activity.avgHR:''].filter(Boolean).join(' · '))+'</p></div>':'')+'</div>';
  }
  function homeShell(){return '<div class="gp-home-shell"><header class="gp-home-head"><img class="gp-home-icon" src="./icons/icon-192.png" alt="Simurg"><div class="gp-home-title"><small>SIMURG OS · DAILY</small><h1>Good Morning, Gorkem</h1><p>Your training, recovery and load at a glance.</p></div></header><div class="gp-home-tabs" role="tablist">'+homeTabs.map(function(tab){return '<button class="gp-home-tab '+(tab===homeTab?'active':'')+'" data-home-tab="'+tab+'" role="tab" aria-selected="'+(tab===homeTab?'true':'false')+'" type="button" onclick="homePremiumSetTab(\''+tab+'\')">'+tab.toUpperCase()+'</button>';}).join('')+'</div><div id="gpHomeContent" class="gp-home-content"></div></div>';}
  function renderHome(){
    var home=document.getElementById('home');if(!home)return;
    home.classList.add('gp-home');home.dataset.globalPremium='1';
    if(!home.querySelector('.gp-home-shell'))home.innerHTML=homeShell();
    home.querySelectorAll('[data-home-tab]').forEach(function(button){var active=button.dataset.homeTab===homeTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',active?'true':'false');});
    var content=document.getElementById('gpHomeContent');if(!content)return;
    var model=homeModel(),panes={overview:overviewPane,recovery:recoveryPane,sleep:sleepPane,load:loadPane},next=panes[homeTab](model);if(content.innerHTML!==next)content.innerHTML=next;
  }
  var homeGuard=null,homeGuardBusy=false;
  function installHomeGuard(){
    var home=document.getElementById('home');if(!home||homeGuard)return;
    homeGuard=new MutationObserver(function(){
      if(homeGuardBusy)return;
      if(home.classList.contains('gp-home')&&home.querySelector('.gp-home-shell'))return;
      homeGuardBusy=true;renderHome();homeGuardBusy=false;
    });
    homeGuard.observe(home,{childList:true,attributes:true,attributeFilter:['class']});
  }
  window.homePremiumSetTab=function(tab){if(homeTabs.indexOf(tab)<0||tab===homeTab)return;homeTab=tab;renderHome();var home=document.getElementById('home');if(home)home.scrollTop=0;};

  function selectedDateValue(){try{return selectedDate||today();}catch(e){return today();}}
  function premiumLongDate(value){try{var d=new Date(value+'T12:00:00Z'),day=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(d),month=new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'}).format(d);return day+' • '+d.getUTCDate()+' '+month+' '+d.getUTCFullYear();}catch(e){return value;}}
  function refineGym(){
    var gym=document.getElementById('gym');if(!gym)return;
    gym.classList.add('gp-gym-refined');
    var title=gym.querySelector('.topbar h1');if(title)title.textContent='🏋️ Gym Mode';
    var controls=gym.querySelector('.topbar .controls'),label=document.getElementById('gymDateLabel');
    if(controls)controls.classList.add('gp-gym-nav');
    if(label){label.classList.add('gp-gym-date-line');label.textContent=premiumLongDate(selectedDateValue());if(controls&&label.parentNode===controls)controls.insertAdjacentElement('afterend',label);}
  }
  function loggerPanel(title){var wanted=String(title).toUpperCase();return Array.from(document.querySelectorAll('#workout .right .panel')).find(function(panel){var head=panel.querySelector('h3');return head&&head.textContent.trim().toUpperCase().indexOf(wanted)>=0;})||null;}
  function premiumWeekRange(){try{var start=weekStart,end=typeof addDays==='function'?addDays(start,6):start;var sd=new Date(start+'T12:00:00Z'),ed=new Date(end+'T12:00:00Z'),sm=new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(sd),em=new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(ed);return sd.getUTCDate()+' '+sm+' — '+ed.getUTCDate()+' '+em+' '+ed.getUTCFullYear();}catch(e){return '';}}
  function refineLogger(){
    var workout=document.getElementById('workout');if(!workout)return;
    workout.classList.add('gp-logger-refined');
    var controls=workout.querySelector('.topbar .controls'),weekLabel=document.getElementById('weekLabel');
    if(controls){controls.classList.add('gp-logger-week-controls');var weekButtons=controls.querySelectorAll('.weekBtn');if(weekButtons[0])weekButtons[0].textContent='← Previous Week';if(weekButtons[1])weekButtons[1].textContent='Next Week →';if(weekButtons[2])weekButtons[2].textContent='Go Today';}
    var range=premiumWeekRange();if(weekLabel&&range)weekLabel.textContent=range;
    var groups=document.getElementById('workoutGroups');if(groups&&!groups.querySelector('.gp-logger-exercises-title'))groups.insertAdjacentHTML('afterbegin','<div class="gp-logger-exercises-title"><small>SESSION LOG</small><h2>Egzersiz</h2></div>');
    var exerciseTitle=groups&&groups.querySelector('.gp-logger-exercises-title h2');if(exerciseTitle&&exerciseTitle.textContent!=='Egzersiz')exerciseTitle.textContent='Egzersiz';
    var muscle=loggerPanel('KAS GRUBU'),trend=loggerPanel('HACİM TREND'),raw=loggerPanel('RAW PERFORMANCE'),watch=loggerPanel('APPLE WATCH');
    if(muscle)muscle.classList.add('gp-logger-muscle');if(trend)trend.classList.add('gp-logger-trend');if(raw)raw.classList.add('gp-logger-raw');if(watch)watch.classList.add('gp-logger-hidden');
  }

  function normalizeNav(){
    var nav=document.getElementById('simurgV8Nav');if(!nav)return;
    var recovery=nav.querySelector('[data-key="recovery"]');if(recovery)recovery.remove();
    var order=['home','gym','logger','polarWorkout','polar','menu'];
    var current=Array.from(nav.children).filter(function(item){return item.matches('button[data-key]');}).map(function(item){return item.dataset.key;});
    var expected=order.filter(function(key){return nav.querySelector('[data-key="'+key+'"]');});
    if(current.join('|')!==expected.join('|'))expected.forEach(function(key){var item=nav.querySelector('[data-key="'+key+'"]');if(item)nav.appendChild(item);});
  }
  function cleanCoaching(){
    var section=document.getElementById('coaching');if(!section)return;
    section.classList.add('gp-coaching-empty');
    var shell=section.querySelector('.gp-coaching-shell');
    if(!shell){shell=document.createElement('div');shell.className='gp-coaching-shell';shell.innerHTML='<img src="./icons/icon-192.png" alt="Simurg"><h1>Coaching</h1><p>Coaching module will be rebuilt.</p>';section.appendChild(shell);}
  }
  function generalDataCard(dataSection){
    var cards=Array.from(dataSection.children).filter(function(item){return item.classList&&item.classList.contains('card');});
    return cards.find(function(card){return /Genel veri/i.test(card.textContent||'')||card.querySelector('[onclick*="exportJSON"]');})||null;
  }
  function cleanDataCenter(){
    var section=document.getElementById('data');if(!section)return;
    var cloud=section.querySelector('.cloudSyncCard'),universal=section.querySelector('.universalImportCard'),general=generalDataCard(section);
    if(general)general.classList.add('gp-general-data-card');
    var anchor=Array.from(section.children).find(function(item){return item.classList&&item.classList.contains('topbar');})||section.firstElementChild;
    [cloud,universal,general].forEach(function(item){if(!item)return;if(anchor&&anchor.nextElementSibling!==item)anchor.insertAdjacentElement('afterend',item);anchor=item;});
  }
  function reportCopyBar(id,label,buttonLabel,handler){return '<div id="'+id+'" class="gp-report-copy"><div><small>ChatGPT Export</small><b>'+esc(label)+'</b></div><button class="btn sec" type="button" onclick="'+handler+'()">'+esc(buttonLabel)+'</button></div>';}
  function polishReports(){
    var program=document.getElementById('programReport');if(program){var utility=document.getElementById('programReportUtilityBar');if(utility&&program.lastElementChild!==utility)program.appendChild(utility);}
    var weekly=document.getElementById('weeklyReport');if(weekly&&!document.getElementById('gpWeeklyCopy'))weekly.insertAdjacentHTML('beforeend',reportCopyBar('gpWeeklyCopy','Copy the selected week as clean analysis text.','Copy Weekly Report','copyWeeklyPremiumReport'));
    var monthly=document.getElementById('monthlyReport');if(monthly&&!document.getElementById('gpMonthlyCopy'))monthly.insertAdjacentHTML('beforeend',reportCopyBar('gpMonthlyCopy','Copy the selected month as clean analysis text.','Copy Monthly Report','copyMonthlyPremiumReport'));
  }
  function refineProgramIntelligence(){
    var program=document.getElementById('programReport');if(!program)return;
    Array.from(program.querySelectorAll('.programIntelPremiumCard:not(.wide)')).forEach(function(card){
      var label=card.querySelector('.programIntelPremiumHead small');
      if(!label||!/^(Recovery Debt|Program Quality|Weekly Focus)$/i.test(label.textContent.trim()))return;
      card.classList.add('gp-program-ring-card');
      var score=card.querySelector('.programIntelPremiumScore');if(!score)return;
      score.classList.add('gp-program-value-ring');
      var raw=score.textContent.trim(),value=Number(raw.replace(',','.')),known=Number.isFinite(value);
      score.style.setProperty('--gp-score',(known?clamp(value,0,100):0)+'%');
      var tone=!known?'unknown':score.classList.contains('risk')||score.classList.contains('danger')?'risk':score.classList.contains('warn')?'caution':score.classList.contains('good')?'good':'neutral';
      score.dataset.gpTone=tone;
    });
    var strategy=program.querySelector('.programIntelPremiumCard.wide');if(strategy)strategy.classList.add('gp-program-strategy');
  }
  function allPolar(data){var daily=data.polarWorkouts&&data.polarWorkouts.daily||{};return Object.keys(daily).flatMap(function(date){var value=daily[date];return (Array.isArray(value)?value:[value]).filter(Boolean);});}
  function recoveryRows(data){
    var result=[],bridge=data.polarBridge&&data.polarBridge.daily||{},recovery=data.recoveryEntries||{};
    Object.keys(bridge).forEach(function(date){result.push(Object.assign({date:date},bridge[date]));});
    Object.keys(recovery).forEach(function(date){if(!result.some(function(x){return x.date===date;}))result.push(Object.assign({date:date},recovery[date]));});
    return result;
  }
  function average(rows,key){var nums=rows.map(function(row){return number(row&&row[key]);}).filter(function(v){return v!=null;});return nums.length?(nums.reduce(function(a,b){return a+b;},0)/nums.length).toFixed(1):'—';}
  function calcRows(rows){
    try{if(typeof calc==='function')return calc(rows);}catch(e){}
    return {sets:rows.reduce(function(s,row){return s+(number(row.sets)||1);},0),reps:rows.reduce(function(s,row){return s+(number(row.reps)||0)*(number(row.sets)||1);},0),vol:rows.reduce(function(s,row){return s+(number(row.weight)||0)*(number(row.reps)||0)*(number(row.sets)||1);},0)};
  }
  function selectedWeek(){
    try{if(typeof weekDates==='function')return weekDates();}catch(e){}
    var d=new Date(),day=d.getDay()||7,start=new Date(d);start.setDate(d.getDate()-day+1);return Array.from({length:7},function(_,i){var x=new Date(start);x.setDate(start.getDate()+i);return x.toISOString().slice(0,10);});
  }
  function selectedMonth(){try{if(typeof selectedDate!=='undefined'&&selectedDate)return String(selectedDate).slice(0,7);}catch(e){}return today().slice(0,7);}
  function weeklyReportText(){
    var data=dataRoot(),dates=selectedWeek(),workouts=(data.workouts||[]).filter(function(x){return dates.indexOf(x.date)>=0;}),stats=calcRows(workouts),activities=(data.appleWatch||[]).filter(function(x){return dates.indexOf(x.date)>=0;}),polar=allPolar(data).filter(function(x){return dates.indexOf(x.date)>=0;}),recovery=recoveryRows(data).filter(function(x){return dates.indexOf(x.date)>=0;}),days=new Set(workouts.map(function(x){return x.date;}));
    var loads=polar.map(function(x){return x.trainingLoad;}).filter(function(v){return number(v)!=null;});
    return ['SIMURG OS — Weekly Report',dates[0]+' → '+dates[dates.length-1],'','Completed sessions: '+days.size,'Total sets: '+Math.round(stats.sets||0),'Total reps: '+Math.round(stats.reps||0),'Total volume: '+Math.round(stats.vol||0)+' kg','Activities / imported workouts: '+activities.length,'Polar Workouts: '+polar.length,'Polar Workout loads: '+(loads.length?loads.join(', '):'—'),'Average HRV: '+average(recovery,'hrvMs')+' ms','Average RHR: '+average(recovery,'restingHr')+' bpm','Recovery records: '+recovery.length,'','Raw summary: gym_records='+workouts.length+', activity_records='+activities.length+', polar_workouts='+polar.length+', recovery_records='+recovery.length].join('\n');
  }
  function monthlyReportText(){
    var data=dataRoot(),month=selectedMonth(),workouts=(data.workouts||[]).filter(function(x){return String(x.date||'').slice(0,7)===month;}),stats=calcRows(workouts),activities=(data.appleWatch||[]).filter(function(x){return String(x.date||'').slice(0,7)===month;}),polar=allPolar(data).filter(function(x){return String(x.date||'').slice(0,7)===month;}),recovery=recoveryRows(data).filter(function(x){return String(x.date||'').slice(0,7)===month;}),days=new Set(workouts.map(function(x){return x.date;})),daily={};
    workouts.forEach(function(row){daily[row.date]=(daily[row.date]||0)+(number(row.weight)||0)*(number(row.reps)||0)*(number(row.sets)||1);});
    var volumeTrend=Object.keys(daily).sort().map(function(date){return date+': '+Math.round(daily[date])+' kg';});var loads=polar.map(function(x){return x.trainingLoad;}).filter(function(v){return number(v)!=null;});
    return ['SIMURG OS — Monthly Report','Month: '+month,'','Training days: '+days.size,'Completed sessions: '+days.size,'Total sets: '+Math.round(stats.sets||0),'Total reps: '+Math.round(stats.reps||0),'Total volume: '+Math.round(stats.vol||0)+' kg','Volume trend: '+(volumeTrend.length?volumeTrend.join(' | '):'—'),'Activity / workout imports: '+activities.length,'Polar Workouts: '+polar.length,'Polar Workout loads: '+(loads.length?loads.join(', '):'—'),'Average HRV: '+average(recovery,'hrvMs')+' ms','Average RHR: '+average(recovery,'restingHr')+' bpm','Recovery records: '+recovery.length,'','Raw summary: gym_records='+workouts.length+', activity_records='+activities.length+', polar_workouts='+polar.length+', recovery_records='+recovery.length].join('\n');
  }
  async function copyText(value,message){
    try{await navigator.clipboard.writeText(value);}catch(e){var area=document.createElement('textarea');area.value=value;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}
    alert(message);
  }
  window.generateWeeklyPremiumReport=weeklyReportText;
  window.generateMonthlyPremiumReport=monthlyReportText;
  window.copyWeeklyPremiumReport=function(){return copyText(weeklyReportText(),'Weekly Report copied.');};
  window.copyMonthlyPremiumReport=function(){return copyText(monthlyReportText(),'Monthly Report copied.');};

  function wrapNavigation(){
    var go=window.simurgV8Go;if(typeof go==='function'&&!go.__globalPremium){window.simurgV8Go=function(id,key){if(id==='recovery'){homeTab='recovery';var redirected=go.call(this,'home','home');renderHome();applyAll(true);return redirected;}var result=go.apply(this,arguments);if(id==='home')renderHome();applyAll(id==='home');return result;};window.simurgV8Go.__globalPremium=true;window.simurgV8Go.__polarWorkout=!!go.__polarWorkout;}
    var showFn=window.show;if(typeof showFn==='function'&&!showFn.__globalPremium){window.show=function(id,button){if(id==='recovery'){homeTab='recovery';var redirected=showFn.call(this,'home',button);renderHome();applyAll(true);return redirected;}var result=showFn.apply(this,arguments);if(id==='home')renderHome();applyAll(id==='home');return result;};window.show.__globalPremium=true;}
  }
  function wrapRender(){var renderFn=window.render;if(typeof renderFn==='function'&&!renderFn.__globalPremium){window.render=function(){var result=renderFn.apply(this,arguments);applyAll();setTimeout(function(){applyAll(true);},220);return result;};window.render.__globalPremium=true;}}
  function applyAll(skipHome){if(!skipHome)renderHome();normalizeNav();cleanCoaching();cleanDataCenter();polishReports();refineProgramIntelligence();refineGym();refineLogger();}
  ready(function(){
    wrapNavigation();wrapRender();applyAll();installHomeGuard();
    setTimeout(function(){wrapNavigation();wrapRender();applyAll(true);},450);
    setTimeout(function(){wrapNavigation();wrapRender();applyAll(true);},1400);
  });
})();
