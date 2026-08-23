(function(){
  'use strict';
  var homeTab='overview';
  var homeTabs=['overview','recovery','sleep','load'];

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function dataRoot(){try{return DATA||{};}catch(e){return window.simurgData||window.DATA||{};}}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(value){if(value==null||value===''||value===false)return null;var n=Number(value);return Number.isFinite(n)&&n!==-1?n:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i++){var n=number(arguments[i]);if(n!=null)return n;}return null;}
  function text(value,fallback){var result=String(value==null?'':value).trim();return result||fallback||'';}
  function activityLabel(value){
    if(window.SimurgLabels&&typeof window.SimurgLabels.activity==='function')return window.SimurgLabels.activity(value);
    var raw=text(value,'Polar Workout');
    if(raw.toLowerCase()==='polar_flow_workout') return 'Polar Workout';
    return raw.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase().replace(/(^|\s)\S/g,function(letter){return letter.toUpperCase();});
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function formatSleep(minutes){if(minutes==null)return '—';var total=Math.max(0,Math.round(minutes)),h=Math.floor(total/60),m=total%60;return h?(h+' sa '+m+' dk'):(m+' dk');}
  function humanDuration(minutes){return formatSleep(minutes);}
  function formatLoad(value){var n=number(value);if(n==null)return null;var rounded=Math.round(n*10)/10;return Number.isInteger(rounded)?String(Math.round(rounded)):rounded.toFixed(1);}
  function formatDate(value){if(!value)return '—';try{return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return value;}}
  function latestFromDaily(daily){
    if(!daily||typeof daily!=='object')return null;
    var dates=Object.keys(daily).filter(Boolean).sort();
    return dates.length?daily[dates[dates.length-1]]:null;
  }
  function dailyAt(store,date){if(!store||typeof store!=='object'||!date)return null;var value=store[date];return Array.isArray(value)?(value[value.length-1]||null):(value||null);}
  function bridgeEntry(data,date){return dailyAt(data.polarBridge&&data.polarBridge.daily,date);}
  function recoveryEntry(data,date){
    var entry=dailyAt(data.recoveryEntries,date);
    if(entry)return entry;
    var rows=Array.isArray(data.recovery)?data.recovery.filter(function(x){return x&&x.date===date;}):[];
    return rows.length?rows[rows.length-1]:null;
  }
  function polarLatest(data,key,date){return dailyAt(data[key]&&data[key].daily,date);}
  function nightlyStatusLabel(value){var labels={1:'Çok Zayıf',2:'Zayıf',3:'Kısıtlı',4:'Normal',5:'İyi',6:'Çok İyi'};return labels[Math.round(number(value)||0)]||null;}
  function secondsToMinutes(value){var n=number(value);return n==null?null:n/60;}
  function appleAt(data,date){
    var rows=Array.isArray(data.appleWatch)?data.appleWatch.filter(function(x){return x&&x.date===date;}):[];
    rows.sort(function(a,b){return (String(a.date)+String(a.startTime||'')).localeCompare(String(b.date)+String(b.startTime||''));});
    return rows.length?rows[rows.length-1]:null;
  }
  function resolveReadiness(date,context){
    context=context||{};var nativeResult=null;
    try{if(typeof window.calculateReadiness==='function')nativeResult=window.calculateReadiness(date);}catch(e){nativeResult=null;}
    var recovery=context.recovery||{},explicitScore=firstNumber(recovery.readiness,recovery.readinessScore),signals=context.signals||{},available=Object.keys(signals).filter(function(key){return signals[key]!=null&&signals[key]!=='';}),hasEvidence=explicitScore!=null||available.length>0||context.hasActivity===true,score=firstNumber(explicitScore,hasEvidence&&nativeResult&&nativeResult.score);
    var waiting=score==null&&!available.length,partial=score==null&&available.length>0,status=nativeResult&&nativeResult.status||(score==null?'WAITING':score>=70?'READY':score>=55?'CONTROLLED':'RECOVERY');
    var advice=nativeResult&&nativeResult.advice||'Bu tarih için yeterli readiness verisi yok.';if(window.SimurgLabels)advice=window.SimurgLabels.sentence(advice);return {score:score,label:score==null?(partial?'Sinyaller Birikiyor':'Veri Bekleniyor'):(score>=70?'Antrenmana Hazır':score>=55?'Kontrollü İlerle':'Toparlanma Öncelikli'),status:status,confidence:nativeResult&&nativeResult.confidence||{available:available.length,label:partial?'Kısmi':waiting?'Bekleniyor':'Mevcut'},source:nativeResult?'Koç Mantığı':'Toparlanma kayıtları',signals:signals,selectedDate:date,isPartial:partial,isWaiting:waiting,advice:advice,today:nativeResult&&nativeResult.today||{watch:[],types:[],minutes:0,active:0}};
  }
  function sharedLoad(date){
    if(window.SimurgSignalModel&&typeof window.SimurgSignalModel.load==='function'){var resolved=window.SimurgSignalModel.load(date);if(resolved)return resolved;}
    return {date:date,value:null,cardioLoad:null,strain:null,tolerance:null,ratio:null,statusRaw:null,statusLabel:'Henüz hesaplanmadı',available:false,source:'None',sourceDate:null};
  }
  function loadValueLabel(loadResult){
    if(!loadResult||!loadResult.available)return '—';
    return number(loadResult.value)===0?'Yük yok':formatLoad(loadResult.value);
  }
  function nearTermLoadLabel(loadResult){
    if(!loadResult||!loadResult.available||loadResult.source!=='Polar Cardio Load')return null;
    var label=text(loadResult.statusLabel,'');
    return label&&label!=='Mevcut'&&label!=='Henüz hesaplanmadı'?label:null;
  }
  function resolveEnergy(date){
    try{return window.SimurgEnergyEngine&&typeof window.SimurgEnergyEngine.resolve==='function'?window.SimurgEnergyEngine.resolve(date):null;}catch(error){return null;}
  }
  function homeModel(date){
    var data=dataRoot(),bridge=bridgeEntry(data,date)||{},recovery=recoveryEntry(data,date)||{},chosen=window.SimurgWorkoutSource&&window.SimurgWorkoutSource.day?window.SimurgWorkoutSource.day(date):null,polar=chosen&&chosen.primaryPolar||null,apple=chosen&&chosen.appleLegacy||appleAt(data,date),gym=chosen&&chosen.gym||((data.workouts||[]).filter(function(row){return row&&row.date===date;}));
    var signalDay=window.SimurgSignalModel&&typeof window.SimurgSignalModel.day==='function'?window.SimurgSignalModel.day(date):null,polarAggregate=signalDay&&signalDay.polarAggregate,polarSleep=polarLatest(data,'polarSleep',date),polarNightly=polarLatest(data,'polarNightlyRecharge',date),loadResult=sharedLoad(date);
    var sleepMinutes=firstNumber(polarSleep&&polarSleep.durationMinutes,polarSleep&&secondsToMinutes(polarSleep.durationSeconds),bridge.sleepDurationMinutes,recovery.sleepDurationMinutes,recovery.sleepMinutes);
    var sleepScore=firstNumber(polarSleep&&polarSleep.sleepScore,bridge.sleepScore,recovery.sleepScore);
    var nightly=firstNumber(bridge.nightlyRecharge,recovery.nightlyRecharge,recovery.nightlyRechargeScore);
    var nightlyDisplay=nightlyStatusLabel(polarNightly&&polarNightly.nightlyRechargeStatus)||(nightly==null?null:nightly);
    var hrv=firstNumber(polarNightly&&polarNightly.heartRateVariabilityAvg,bridge.hrvMs,recovery.hrvMs,recovery.hrv);
    var rhr=firstNumber(polarNightly&&polarNightly.heartRateAvg,bridge.restingHr,recovery.restingHr,recovery.restingHR,recovery.rhr);
    var sleepHr=firstNumber(bridge.sleepHr,recovery.sleepHr,recovery.sleepHR);
    var respiratory=firstNumber(polarNightly&&polarNightly.breathingRateAvg,bridge.respiratoryRate,recovery.respiratoryRate);
    var load=loadResult.available?loadResult.value:null;
    var activeEnergy=firstNumber(polarAggregate&&polarAggregate.sessionCount&&polarAggregate.activeCalories,bridge.activeEnergyKcal,bridge.activeEnergy,polar&&polar.activeCal,polar&&polar.calories,apple&&apple.activeCal);
    var gymRpes=gym.map(function(x){return number(x.rpe);}).filter(function(x){return x!=null;});
    var rpe=firstNumber(polar&&polar.rpe,gymRpes.length?gymRpes.reduce(function(a,b){return a+b;},0)/gymRpes.length:null,bridge.workouts&&bridge.workouts[0]&&bridge.workouts[0].rpe,apple&&apple.rpe);
    var stages=polarSleep?{deepMinutes:secondsToMinutes(polarSleep.deepSleep),remMinutes:secondsToMinutes(polarSleep.remSleep),lightMinutes:secondsToMinutes(polarSleep.lightSleep),awakeMinutes:secondsToMinutes(polarSleep.awakeTime)}:(bridge.sleepStages||recovery.sleepStages||null);
    var activity=polarAggregate&&polarAggregate.sessionCount>1?{name:polarAggregate.sessionCount+' Polar Seansı',duration:humanDuration(polarAggregate.durationMinutes),date:date,startTime:null,cal:polarAggregate.activeCalories,avgHR:polarAggregate.avgHR,maxHR:polarAggregate.maxHR,zones:null,source:chosen&&chosen.source||'Polar',polar:true,sessionCount:polarAggregate.sessionCount,dailyAggregate:true}:polar?{name:activityLabel(polar.workoutType||polar.activityType||'Polar Workout'),duration:polar.duration,date:polar.date,startTime:polar.startTime,cal:firstNumber(polar.activeCal,polar.calories),avgHR:polar.avgHR,maxHR:polar.maxHR,zones:polar.zones,source:chosen&&chosen.source||'Polar',polar:true,sessionCount:1}:
      apple?{name:activityLabel(apple.activityType||apple.workoutType||'Activity'),duration:apple.duration,date:apple.date,startTime:apple.startTime,cal:apple.activeCal,avgHR:apple.avgHR,maxHR:apple.maxHR,source:'Apple Health'}:
      bridge.workouts&&bridge.workouts[0]?{name:activityLabel(bridge.workouts[0].type||'Workout'),duration:bridge.workouts[0].duration,date:bridge.date,cal:bridge.workouts[0].activeEnergy,avgHR:bridge.workouts[0].avgHr,maxHR:bridge.workouts[0].maxHr,source:'Polar Bridge'}:null;
    var hasRecoverySignals=[hrv,rhr,respiratory,nightlyDisplay].some(function(value){return value!=null&&value!=='';});
    var readinessResult=window.SimurgReadiness&&typeof window.SimurgReadiness.resolve==='function'?window.SimurgReadiness.resolve(date):resolveReadiness(date,{recovery:recovery,hasActivity:!!(polar||apple||gym.length),signals:{hrv:hrv,rhr:rhr,respiratory:respiratory,sleepScore:sleepScore,cardioLoad:load}}),readiness=readinessResult.score;
    var sharedDay=window.SimurgSignalModel&&typeof window.SimurgSignalModel.day==='function'?window.SimurgSignalModel.day(date):null;
    return {selectedDate:date,data:data,bridge:bridge,recovery:recovery,polar:polar,polarAggregate:polarAggregate,apple:apple,gym:gym,gymPlan:sharedDay&&sharedDay.gymPlan||null,workoutSource:chosen&&chosen.source,polarSleep:polarSleep,polarNightly:polarNightly,loadResult:loadResult,sleepMinutes:sleepMinutes,sleepScore:sleepScore,nightly:nightly,nightlyDisplay:nightlyDisplay,readiness:readiness,readinessResult:readinessResult,energy:resolveEnergy(date),hasRecoverySignals:hasRecoverySignals,hrv:hrv,rhr:rhr,sleepHr:sleepHr,respiratory:respiratory,load:load,activeEnergy:activeEnergy,rpe:rpe,stages:stages,activity:activity};
  }
  function metric(label,value,unit){var textValue=label==='Latest Activity'||label==='Aggressiveness';return '<div class="gp-metric '+(textValue?'gp-metric-text':'')+'"><small>'+esc(label)+'</small><b>'+esc(value==null?'—':value)+(value==null?'':'<em>'+esc(unit||'')+'</em>')+'</b></div>';}
  function ring(label,value,color,stateLabel){var safeValue=number(value),pct=safeValue==null?0:clamp(safeValue,0,100);return '<div class="gp-ring-card '+(stateLabel?'partial':'')+'"><div class="gp-ring" style="--gp-value:'+pct+'%;--gp-ring-color:'+color+'"><div><b>'+esc(safeValue==null?'—':Math.round(safeValue))+'</b><small>'+esc(stateLabel||'/100')+'</small></div></div><small>'+esc(label)+'</small>'+(stateLabel?'<span>Kısmi veri</span>':'')+'</div>';}
  function recoveryRingColor(value){if(value==null||value>=60)return '#80c72e';if(value>=40)return '#f1b721';return '#e33a46';}
  function loadRingColor(value){if(value==null||value<55)return '#168ed5';if(value<70)return '#f1b721';if(value<85)return '#e77d18';return '#e33a46';}
  function planName(model){
    if(model.gymPlan&&model.gymPlan.label)return window.SimurgLabels?window.SimurgLabels.sentence(model.gymPlan.label):model.gymPlan.label;
    var date=model.selectedDate||today(),name=null;try{if(typeof dayName==='function'&&typeof getProgramType==='function')name=getProgramType(dayName(date));}catch(e){}
    if(!name){var names=model.data.programNames||{},day=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));name=names[day]||'Plan verisi bekleniyor';}
    return window.SimurgLabels?window.SimurgLabels.ui(name):name;
  }
  function planDescription(model){var plan=model.gymPlan||{};if(plan.skipped)return 'Bu gün açıkça atlandı; plan aktif antrenman olarak gösterilmiyor.';if(plan.mode==='rest')return 'Bugün planlı antrenmanın yok.';if(plan.performed)return 'Gerçek kaydedilmiş seans tamamlandı.';if(plan.mode==='alternate')return 'Bu tarih için seçilen alternatif program henüz kaydedilmedi.';if(plan.mode==='custom')return 'Bu tarih için seçilen serbest antrenman henüz kaydedilmedi.';return 'Planlandı; henüz kaydedilmiş bir Gym seansı yok.';}
  function planFocus(model){var plan=model.gymPlan||{};if(plan.skipped)return 'Bugün Gym progresyon hedefi yok; toparlanma ve diğer gerçek aktiviteler izlenir.';if(plan.mode==='rest')return 'Dinlenme gününde yeni Gym hedefi üretilmez.';return planName(model)+' bağlamında kaliteli tekrar ve tam hareket açıklığı.';}
  function activityDate(value,withYear){if(!value)return '';try{return new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'short',year:withYear?'numeric':undefined,timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return value;}}
  function zoneSummary(activity){if(!activity||!activity.zones)return '';var keys=['zone1','zone2','zone3','zone4','zone5'],seconds=keys.map(function(key){var raw=String(activity.zones[key]||''),parts=raw.split(':').map(Number);return parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts.length===2?parts[0]*60+parts[1]:0;}),max=Math.max.apply(null,seconds);return max>0?'Bölge '+(seconds.indexOf(max)+1)+' baskın':'';}
  function activityCard(activity,kicker,withYear){
    if(!activity)return '';
    var primary=activity.dailyAggregate?[activity.sessionCount+' seans',activity.duration,activity.cal!=null?formatLoad(activity.cal)+' kcal':''].filter(Boolean).join(' · '):[activityDate(activity.date,withYear)+(activity.startTime?' · '+activity.startTime:'') ,activity.duration,activity.cal!=null?formatLoad(activity.cal)+' kcal':''].filter(Boolean).join(' · ');
    var heart=[activity.avgHR!=null?'Ort. HR '+formatLoad(activity.avgHR):'',activity.maxHR!=null?'Maks. HR '+formatLoad(activity.maxHR):''].filter(Boolean).join(' · ');
    var footer=[activity.source==='Polar Bridge'?'Polar data':activity.source,zoneSummary(activity)].filter(Boolean).join(' · ');
    var tag=activity.polar?'button':'div',action=activity.polar?' type="button" data-gp-polar-date="'+esc(activity.date)+'" data-gp-polar-start="'+esc(activity.startTime||'')+'"':'';
    return '<'+tag+' class="gp-card gp-activity gp-activity-detail '+(activity.polar?'tappable polar-source':'')+'"'+action+'><small class="gp-kicker">'+esc(kicker)+'</small><h3>'+esc(activity.name)+'</h3><p>'+esc(primary)+'</p>'+(heart?'<p>'+esc(heart)+'</p>':'')+'<span>'+esc(footer)+'</span></'+tag+'>';
  }
  function mobileActivityCard(activity,date){
    if(!activity)return '';
    var durationMinutes=null;try{if(window.SimurgWorkoutSource&&typeof window.SimurgWorkoutSource.durationMinutes==='function')durationMinutes=window.SimurgWorkoutSource.durationMinutes(activity.duration);}catch(e){durationMinutes=null;}
    var duration=durationMinutes>0?Math.round(durationMinutes)+' dk':activity.duration;
    var primary=[duration,activity.cal!=null?formatLoad(activity.cal)+' kcal':''].filter(Boolean).join(' · ');
    var heart=[activity.avgHR!=null?'Ort. HR '+formatLoad(activity.avgHR):'',activity.maxHR!=null?'Maks. HR '+formatLoad(activity.maxHR):''].filter(Boolean).join(' · ');
    var kicker=date===today()?'BUGÜNKÜ AKTİVİTE':'SEÇİLİ GÜN AKTİVİTESİ';
    var tag=activity.polar?'button':'div',action=activity.polar?' type="button" data-gp-polar-date="'+esc(activity.date)+'" data-gp-polar-start="'+esc(activity.startTime||'')+'"':'';
    return '<'+tag+' class="gp-card gp-activity gp-activity-detail gp-home-activity '+(activity.polar?'tappable polar-source':'')+'"'+action+'><small class="gp-kicker">'+esc(kicker)+'</small><h3>'+esc(activity.name)+'</h3>'+(primary?'<p>'+esc(primary)+'</p>':'')+(heart?'<p>'+esc(heart)+'</p>':'')+(activity.source?'<span>'+esc(activity.source)+'</span>':'')+'</'+tag+'>';
  }
  function recoveryInterpretation(model){
    if(!model.hasRecoverySignals&&model.readiness==null)return 'Henüz toparlanma verisi yok.';
    if(model.readiness==null&&model.hasRecoverySignals)return 'Bugünkü toparlanma verisi kısmi. Mevcut HRV, dinlenik nabız ve solunum sinyallerini kontrollü yorumla; net recovery skoru için daha fazla Polar verisi gerekiyor.';
    if((model.readiness!=null&&model.readiness<60)||(model.hrv!=null&&model.hrv<45)||(model.rhr!=null&&model.rhr>60))return 'Toparlanma sinyalleri kontrollü bir başlangıç öneriyor. Planı koru, agresif progresyondan kaçın.';
    return 'Mevcut toparlanma sinyalleri bugünkü planı destekliyor. Çalışma setlerine kontrollü başla.';
  }
  function sleepInterpretation(model){
    if(model.sleepMinutes==null&&model.sleepScore==null)return 'Henüz uyku detayı yok.';
    if((model.sleepMinutes!=null&&model.sleepMinutes<360)||(model.sleepScore!=null&&model.sleepScore<60))return 'Uyku toparlanması sınırlı görünüyor. Bugünü kompakt tut ve hareket kalitesini koru.';
    return 'Uyku sinyalleri normal ve kontrollü bir antrenman günüyle uyumlu görünüyor.';
  }
  function loadAggressiveness(model){
    if(model.load==null&&model.rpe==null)return 'WAITING';
    if((model.load!=null&&model.load>=70)||(model.rpe!=null&&model.rpe>=8))return 'REDUCED';
    return 'NORMAL';
  }
  function loadInterpretation(model){var status=loadAggressiveness(model);if(status==='WAITING')return 'Henüz yorumlanabilir antrenman yükü yok.';if(status==='REDUCED')return 'Son yük verisi daha düşük agresiflik öneriyor. Programı koru ancak progresyonu zorlama.';return 'Mevcut yük yönetilebilir görünüyor. Programa devam et ve ilk çalışma setlerine kontrollü başla.';}
  function coachSentence(model){
    if(model.readiness==null&&model.load==null&&!model.activity&&!model.hasRecoverySignals)return 'Henüz günlük antrenman ve toparlanma özeti yok.';
    if(loadAggressiveness(model)==='REDUCED')return 'Bugün kaliteyi koru: programı sürdür, agresifliği azalt ve yedek tekrar bırak.';
    if(model.readiness==null&&model.hasRecoverySignals)return 'Toparlanma sinyalleri kısmi. Mevcut HRV, nabız ve solunum verisini kontrollü bir başlangıç için kullan.';
    if(model.readiness!=null&&model.readiness<60)return 'Toparlanma kontrollü. Planı koru ancak ilk çalışma setlerini daha sakin uygula.';
    return 'Bugünkü veriler mevcut planı destekliyor. Yoğunluğu kademeli artır ve form kalitesini koru.';
  }
  function homeDateValue(){try{return selectedDate||today();}catch(e){return today();}}
  function homeDateLabel(){var value=homeDateValue();try{return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return formatDate(value);}}
  function readinessDecision(model){
    var result=model.readinessResult||resolveReadiness(model.selectedDate||homeDateValue(),{});return {label:result.label,tone:result.isWaiting||result.isPartial?'waiting':result.score>=70?'good':result.score>=55?'caution':'recovery'};
  }
  function selectedGymSession(model){
    var rows=Array.isArray(model.data.workouts)?model.data.workouts.filter(function(row){return row&&row.date===model.selectedDate;}):[];
    if(!rows.length)return null;
    var date=model.selectedDate,summary;try{summary=typeof calc==='function'?calc(rows):null;}catch(e){summary=null;}
    var name='Gym Session';
    if(model.gymPlan&&model.gymPlan.label)name=model.gymPlan.label;else try{if(typeof getProgramType==='function'&&typeof dayName==='function')name=getProgramType(dayName(date))||name;}catch(e){}
    return {date:date,name:name,sets:summary?summary.sets:rows.length,reps:summary?summary.reps:null,volume:summary?summary.vol:null};
  }
  function gymSessionCard(model){
    var session=selectedGymSession(model);
    var action=window.innerWidth>900?'desktopOpen(\'workout\')':'simurgV8Go(\'workout\',\'logger\')';
    if(!session)return '<button type="button" class="gp-card gp-recent-card gp-recent-workout" onclick="'+action+'"><small class="gp-kicker">Seçili Gün Antrenmanı</small><h3>Kayıt bulunmuyor</h3><p>Bu tarih için Gym kaydı yok.</p></button>';
    return '<button type="button" class="gp-card gp-recent-card gp-recent-workout" onclick="'+action+'"><small class="gp-kicker">Seçili Gün Antrenmanı</small><h3>'+esc(session.name)+'</h3><span class="gp-recent-date">'+esc(activityDate(session.date,true))+'</span><div class="gp-recent-metrics"><span><b>'+esc(session.sets)+'</b><small>Set</small></span><span><b>'+esc(session.reps==null?'—':session.reps)+'</b><small>Tekrar</small></span><span><b>'+esc(session.volume==null?'—':Math.round(session.volume).toLocaleString('tr-TR'))+'</b><small>kg</small></span></div></button>';
  }
  function workoutState(model){
    var plan=model.gymPlan||{};
    if(plan.skipped)return {label:'Atlandı',tone:'skipped'};
    if(plan.mode==='rest')return {label:'Dinlenme Günü',tone:'rest'};
    if(plan.performed)return {label:'Tamamlandı',tone:'completed'};
    return {label:'Planlandı',tone:'planned'};
  }
  function mobileWorkoutCard(model){
    var plan=model.gymPlan||{},session=selectedGymSession(model),state=workoutState(model),performed=!!plan.performed,action=performed?"simurgV8Go('workout','logger')":"simurgV8Go('gym','gym')",kicker=model.selectedDate===today()?'BUGÜNKÜ ANTRENMAN':'SEÇİLİ GÜN ANTRENMANI';
    var stats=session?[session.sets+' set',session.reps==null?'':session.reps+' tekrar',session.volume==null?'':Math.round(session.volume).toLocaleString('tr-TR')+' kg hacim'].filter(Boolean).join(' · '):'';
    return '<button type="button" class="gp-card gp-plan gp-workout-summary" onclick="'+action+'"><i>⌘</i><div><small class="gp-kicker">'+kicker+'</small><div class="gp-workout-title"><h3>'+esc(planName(model))+'</h3><em class="'+state.tone+'">'+esc(state.label)+'</em></div>'+(stats?'<p>'+esc(stats)+'</p>':'<p>'+esc(planDescription(model))+'</p>')+'</div><span>›</span></button>';
  }
  function weeklySnapshot(model){
    var start;
    try{start=typeof mondayOf==='function'?mondayOf(homeDateValue()):homeDateValue();}catch(e){start=homeDateValue();}
    var dates=[];for(var i=0;i<7;i++){try{dates.push(typeof addDays==='function'?addDays(start,i):start);}catch(e){dates.push(start);}}
    var rows=Array.isArray(model.data.workouts)?model.data.workouts.filter(function(row){return dates.indexOf(row.date)>-1;}):[],summary;
    try{summary=typeof calc==='function'?calc(rows):{sets:rows.length,reps:0,vol:0};}catch(e){summary={sets:rows.length,reps:0,vol:0};}
    var daily=dates.map(function(date){var dayRows=rows.filter(function(row){return row.date===date;}),daySummary;try{daySummary=typeof calc==='function'?calc(dayRows):{vol:0};}catch(e){daySummary={vol:0};}return {date:date,volume:Number(daySummary.vol)||0,active:dayRows.length>0};});
    var max=Math.max.apply(null,daily.map(function(day){return day.volume;}));
    return {days:daily,max:max||1,active:daily.filter(function(day){return day.active;}).length,sets:summary.sets||0,volume:summary.vol||0};
  }
  function weeklyCard(model,mobile){
    var week=weeklySnapshot(model),labels=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    return '<div class="gp-card gp-weekly"><div class="gp-section-title"><div><small>HAFTALIK ÖZET</small><h3>Yük akışı</h3></div><b>'+(mobile?week.active+' antrenman günü':week.active+'/7 gün')+'</b></div><div class="gp-weekly-body"><div class="gp-week-bars">'+week.days.map(function(day,index){var level=day.active?Math.max(18,Math.round(day.volume/week.max*100)):8;return '<span><i style="--gp-day:'+level+'%"></i><small>'+labels[index]+'</small></span>';}).join('')+'</div><div class="gp-week-totals"><span><b>'+Math.round(week.volume).toLocaleString('tr-TR')+'</b><small>kg hacim</small></span><span><b>'+week.sets+'</b><small>set</small></span></div></div></div>';
  }
  function energyLabel(value){return {high:'Yüksek kapasite',medium:'Orta kapasite',low:'Düşük kapasite',insufficient:'Veri yetersiz'}[value]||'Veri yetersiz';}
  function energyConfidence(value){return {high:'Yüksek',medium:'Orta',low:'Düşük',insufficient:'Yetersiz'}[value]||'Yetersiz';}
  function energyContributor(value){var score=number(value&&value.score);return score==null?'—':Math.round(score);}
  function energyExplanation(energy){
    var contributors=energy&&energy.contributors||{},sleep=contributors.sleep&&contributors.sleep.reasons||[],recovery=contributors.recovery&&contributors.recovery.reasons||[],activity=contributors.activityLoad&&contributors.activityLoad.reasons||[],selected=[];
    if(energy&&energy.status==='high')selected=[sleep[0],recovery[0]];
    else if(energy&&energy.status==='medium')selected=[recovery[0],activity[0]];
    else if(energy&&energy.status==='low')selected=[energy.action&&energy.action.trainingRecommendation,sleep[0]||activity[0]];
    selected=selected.filter(Boolean);
    if(selected.length)return selected.join(' ');
    var reasons=Array.isArray(energy&&energy.reasons)?energy.reasons.filter(Boolean):[];
    if(reasons.length)return reasons.slice(0,2).join(' ');
    return text(energy&&energy.action&&energy.action.trainingRecommendation,'Energy için yeterli güvenilir sinyal yok.');
  }
  function energyCard(model){
    var energy=model.energy||{},contributors=energy.contributors||{},activityScore=number(contributors.activityLoad&&contributors.activityLoad.score),trainingScore=number(contributors.trainingLoad&&contributors.trainingLoad.score),loadScore=activityScore==null||trainingScore==null?null:(activityScore*.12+trainingScore*.08)/.20;
    return '<section class="gp-card gp-energy-card '+esc(energy.status||'insufficient')+'"><div class="gp-energy-score"><small class="gp-kicker">ENERGY</small><b>'+esc(number(energy.score)==null?'—':Math.round(energy.score))+'</b><strong>'+esc(energyLabel(energy.status))+'</strong><span>Güven · '+esc(energyConfidence(energy.confidence))+'</span></div><div class="gp-energy-copy"><p>'+esc(energyExplanation(energy))+'</p><div class="gp-energy-contributors"><span>Uyku <b>'+esc(energyContributor(contributors.sleep))+'</b></span><span>Recovery <b>'+esc(energyContributor(contributors.recovery))+'</b></span><span>Yük <b>'+esc(loadScore==null?'—':Math.round(loadScore))+'</b></span></div></div></section>';
  }
  function overviewPane(model){
    if(window.innerWidth>900){var desktopActivity=model.activity,decisionDesktop=readinessDecision(model),result=model.readinessResult||{},scoreDesktop=model.readiness==null?'—':Math.round(model.readiness),confidence=result.confidence&&result.confidence.label||'—',desktopActivityLabel=desktopActivity&&desktopActivity.polar?'Seçili Gün Polar Aktivitesi':'Seçili Gün Aktivitesi',activityHtmlDesktop=desktopActivity?activityCard(desktopActivity,desktopActivityLabel,false):'<div class="gp-card gp-activity"><small class="gp-kicker">SEÇİLİ GÜN AKTİVİTESİ</small><h3>Aktivite bulunmuyor</h3><p>Bu tarih için gerçek Polar veya eski kaynak aktivitesi kaydı yok.</p></div>';
      return '<div class="gp-home-pane active gp-desktop-overview" data-home-pane="overview">'
        +'<section class="gp-desktop-prime gp-card '+decisionDesktop.tone+'"><div><small class="gp-kicker">READINESS PRIME</small><b>'+esc(scoreDesktop)+'</b><strong>'+esc(decisionDesktop.label)+'</strong></div><div><span>Güven · '+esc(confidence)+'</span><p>'+esc(coachSentence(model))+'</p></div><button type="button" onclick="simurgOpenAlert()">Simurg Uyarısı →</button></section>'
        +energyCard(model)
        +'<section class="gp-desktop-signals">'+ring('Toparlanma',model.readiness,recoveryRingColor(model.readiness),model.readiness==null&&model.hasRecoverySignals?'SİNYALLER':'')+ring('Uyku',model.sleepScore,'#9b6be8')+ring('Yük',model.load,loadRingColor(model.load))+'</section>'
        +'<section class="gp-desktop-session-grid"><button type="button" class="gp-card gp-plan" onclick="desktopOpen(\'program\')"><i>⌘</i><div><small class="gp-kicker">SEÇİLİ GÜN PLANI</small><h3>'+esc(planName(model))+'</h3><p>'+esc(planDescription(model))+'</p></div><span>›</span></button>'+gymSessionCard(model)+activityHtmlDesktop+'</section>'
        +'<section class="gp-card gp-coach-flow"><small class="gp-kicker">KOÇUN BUGÜN SENİN İÇİN</small><div><i>◎</i><b>Ana Hedef</b><span>'+esc(planFocus(model))+'</span></div><div><i>◇</i><b>Dikkat</b><span>'+esc(recoveryInterpretation(model))+'</span></div><div class="opportunity"><i>↗</i><b>Fırsat</b><span>'+esc(loadInterpretation(model))+'</span></div></section>'
        +weeklyCard(model)+'</div>';}
    var activityHtml=mobileActivityCard(model.activity,model.selectedDate);
    var horizonContext=model.selectedDate===today()?'Bugünkü durum':'Seçili günün durumu';
    return '<div class="gp-home-pane active" data-home-pane="overview">'
      +'<div class="gp-card gp-horizon"><div class="gp-horizon-head"><small class="gp-kicker">HORIZON</small><span>'+horizonContext+'</span></div><div class="gp-horizon-flow"><button type="button" class="gp-horizon-tile recovery" aria-label="Toparlanma detayını aç" onclick="homePremiumSetTab(\'recovery\')"><i aria-hidden="true">♥</i><b>'+esc(model.readiness==null?'—':Math.round(model.readiness))+'</b><small>Toparlanma</small><span data-coach-status="recovery">Veri bekleniyor</span></button><button type="button" class="gp-horizon-tile sleep" aria-label="Uyku detayını aç" onclick="homePremiumSetTab(\'sleep\')"><i aria-hidden="true">◒</i><b>'+esc(model.sleepScore==null?'—':Math.round(model.sleepScore))+'</b><small>Uyku</small><span data-coach-status="sleep">Veri bekleniyor</span></button><button type="button" class="gp-horizon-tile load" aria-label="Yük detayını aç" onclick="homePremiumSetTab(\'load\')"><i aria-hidden="true">⌁</i><b>'+esc(loadValueLabel(model.loadResult))+'</b><small>Günlük yük</small><span data-coach-status="load">Veri bekleniyor</span></button></div></div>'
      +energyCard(model)
      +mobileWorkoutCard(model)
      +activityHtml
      +weeklyCard(model,true)+'</div>';
  }
  function recoveryPane(model){
    var title=model.readiness!=null?(model.readiness>=70?'Hazır sinyali':'Kontrollü sinyal'):(model.hasRecoverySignals?'Kısmi Toparlanma Verisi':'Henüz toparlanma verisi yok');
    return '<div class="gp-home-pane active" data-home-pane="recovery"><div class="gp-card"><div class="gp-hero-row"><div class="gp-ring gp-hero-ring" style="--gp-value:'+(model.readiness==null?0:clamp(model.readiness,0,100))+'%;--gp-ring-color:'+(model.readiness==null?'#64748b':'#80c72e')+'"><div><b>'+esc(model.readiness==null?'—':Math.round(model.readiness))+'</b><small>'+(model.readiness==null&&model.hasRecoverySignals?'SİNYALLER':'Toparlanma')+'</small></div></div><div class="gp-hero-copy"><small class="gp-kicker">TOPARLANMA NOTU</small><h2>'+esc(title)+'</h2><p>'+esc(recoveryInterpretation(model))+'</p></div></div></div>'+(model.hasRecoverySignals||model.readiness!=null?'<div class="gp-card"><div class="gp-card-head"><h2>Toparlanma Metrikleri</h2><span>'+(model.polarNightly?'POLAR VERİSİ':'Polar')+'</span></div><div class="gp-metric-grid">'+metric('Gece Toparlanması',model.nightlyDisplay,'')+metric('HRV',model.hrv,'ms')+metric('Dinlenik HR',model.rhr,'bpm')+metric('Solunum Hızı',model.respiratory,'/dk')+metric('Uyku HR',model.sleepHr,'bpm')+metric('Toparlanma Skoru',model.readiness,'/100')+'</div></div>':'')+'</div>';
  }
  function stageBar(stages){
    if(!stages)return '<div class="gp-empty compact">Uyku evreleri henüz mevcut değil.</div>';
    var rows=[{label:'Derin Uyku',value:firstNumber(stages.deepMinutes,stages.deep),color:'#5257d9'},{label:'REM Uykusu',value:firstNumber(stages.remMinutes,stages.rem),color:'#1fc7d4'},{label:'Hafif Uyku',value:firstNumber(stages.lightMinutes,stages.light),color:'#55a8e8'},{label:'Uyanık',value:firstNumber(stages.awakeMinutes,stages.awake),color:'#c77d67'}],available=rows.filter(function(row){return row.value!=null;}),total=available.reduce(function(sum,row){return sum+row.value;},0);
    if(!available.length||!total)return '<div class="gp-empty compact">Uyku evreleri henüz mevcut değil.</div>';
    return '<div class="gp-stage-bar">'+rows.map(function(row){return row.value==null?'':'<span style="width:'+(row.value/total*100).toFixed(2)+'%;background:'+row.color+'"></span>';}).join('')+'</div><div class="gp-stage-details">'+rows.map(function(row){var pct=row.value==null?null:Math.round(row.value/total*100);return '<div class="gp-stage-row"><i style="background:'+row.color+'"></i><span>'+row.label+'</span><em><u style="width:'+(pct||0)+'%;background:'+row.color+'"></u></em><b>'+esc(humanDuration(row.value))+'</b><small>'+esc(pct==null?'—':pct+'%')+'</small></div>';}).join('')+'</div>';
  }
  function sleepPane(model){
    return '<div class="gp-home-pane active" data-home-pane="sleep"><div class="gp-card"><div class="gp-hero-row"><div class="gp-ring gp-hero-ring" style="--gp-value:'+(model.sleepScore==null?0:clamp(model.sleepScore,0,100))+'%;--gp-ring-color:#168ed5"><div><b>'+esc(model.sleepScore==null?'—':Math.round(model.sleepScore))+'</b><small>Uyku</small></div></div><div class="gp-hero-copy"><small class="gp-kicker">Uyku Özeti</small><h2>'+esc(formatSleep(model.sleepMinutes))+'</h2><p>'+esc(sleepInterpretation(model))+'</p></div></div></div><div class="gp-card"><div class="gp-card-head"><h2>Uyku Evreleri</h2><span>'+esc(model.sleepMinutes==null?'Bekleniyor':formatSleep(model.sleepMinutes))+'</span></div>'+stageBar(model.stages)+'<div class="gp-interpret">'+esc(sleepInterpretation(model))+'</div></div></div>';
  }
  function loadPane(model){
    var status=loadAggressiveness(model),tone=status==='NORMAL'?'good':status==='REDUCED'?'warn':'';
    var statusLabel=status==='NORMAL'?'Normal':status==='REDUCED'?'Azaltılmış':'Bekleniyor',loadResult=model.loadResult||sharedLoad(model.selectedDate),nearTerm=nearTermLoadLabel(loadResult),metrics=[];if(loadResult.available)metrics.push(metric('Günlük Aktivite Yükü',loadValueLabel(loadResult),''));if(nearTerm)metrics.push(metric('Yakın Dönem Yük Durumu',nearTerm,''));if(model.activeEnergy!=null)metrics.push(metric('Aktif Enerji',formatLoad(model.activeEnergy),'kcal'));if(model.rpe!=null)metrics.push(metric('RPE',formatLoad(model.rpe),'/10'));if(loadResult.available)metrics.push(metric('Yük Kaynağı',loadResult.source,''));metrics.push(metric('Plan Agresifliği',statusLabel,''));
    return '<div class="gp-home-pane active" data-home-pane="load"><div class="gp-card"><div class="gp-card-head"><h2>Yük Özeti</h2><span class="gp-status '+tone+'">Plan: '+statusLabel+'</span></div><div class="gp-metric-grid">'+metrics.join('')+'</div><div class="gp-interpret">'+esc(loadInterpretation(model))+'</div></div>'+(model.activity?activityCard(model.activity,'Son Antrenman / Aktivite',true):'')+'</div>';
  }
  function homeSubtitle(){return homeDateValue()===today()?'Bugün için koçun seni analiz etti.':'Seçili günün verileri analiz edildi.';}
  function homeShell(){
    if(window.innerWidth>900){var connection=dataRoot().polarConnection||{},source=connection.connected?'Polar Connected':'Local Data';return '<div class="gp-home-shell" data-home-layout="desktop"><header class="gp-home-head"><img class="gp-home-icon" src="./icons/icon-192.png" alt="Simurg"><div class="gp-home-title"><small>SIMURG OS · HORIZON MERKEZİ</small><h1>Günaydın, Görkem</h1><p>Toparlanma, performans ve günlük karar merkezi.</p></div><div class="gp-desktop-home-actions"><span class="gp-source-status">'+esc(source)+'</span><button type="button" onclick="simurgOpenAlert()">🔔 Simurg Uyarısı</button></div></header><div class="gp-home-date"><button type="button" aria-label="Önceki gün" onclick="homePremiumMove(-1)">← Önceki</button><b id="gpHomeDateLabel">'+esc(homeDateLabel())+'</b><button type="button" aria-label="Sonraki gün" onclick="homePremiumMove(1)">Sonraki →</button><button type="button" onclick="homePremiumToday()">Bugün</button></div><div class="gp-home-tabs" role="tablist">'+homeTabs.map(function(tab){return '<button class="gp-home-tab '+(tab===homeTab?'active':'')+'" data-home-tab="'+tab+'" role="tab" aria-selected="'+(tab===homeTab?'true':'false')+'" type="button" onclick="homePremiumSetTab(\''+tab+'\')">'+tab.toUpperCase()+'</button>';}).join('')+'</div><div id="gpHomeContent" class="gp-home-content"></div></div>';}
    return '<div class="gp-home-shell" data-home-layout="mobile"><header class="gp-home-head"><img class="gp-home-icon" src="./icons/icon-192.png" alt="Simurg"><div class="gp-home-title"><small>SIMURG OS</small><h1>Günaydın, Görkem</h1><p id="gpHomeSubtitle">'+esc(homeSubtitle())+'</p></div><button type="button" class="gp-home-alert" aria-label="Bildirimler" onclick="simurgOpenAlert()">🔔<i></i></button></header><div class="gp-home-date"><span>▣</span><b id="gpHomeDateLabel">'+esc(homeDateLabel())+'</b><button type="button" aria-label="Önceki gün" onclick="homePremiumMove(-1)">‹</button><button type="button" aria-label="Sonraki gün" onclick="homePremiumMove(1)">›</button></div><div class="gp-home-tabs" role="tablist">'+homeTabs.map(function(tab){return '<button class="gp-home-tab '+(tab===homeTab?'active':'')+'" data-home-tab="'+tab+'" role="tab" aria-selected="'+(tab===homeTab?'true':'false')+'" type="button" onclick="homePremiumSetTab(\''+tab+'\')">'+tab.toUpperCase()+'</button>';}).join('')+'</div><div id="gpHomeContent" class="gp-home-content"></div></div>';
  }
  function renderHome(){
    var home=document.getElementById('home');if(!home)return;
    home.classList.add('gp-home');home.dataset.globalPremium='1';
    var desiredLayout=window.innerWidth>900?'desktop':'mobile',shell=home.querySelector('.gp-home-shell');if(!shell||shell.dataset.homeLayout!==desiredLayout)home.innerHTML=homeShell();
    var dateLabel=document.getElementById('gpHomeDateLabel');if(dateLabel)dateLabel.textContent=homeDateLabel();
    var subtitle=document.getElementById('gpHomeSubtitle');if(subtitle)subtitle.textContent=homeSubtitle();
    home.querySelectorAll('[data-home-tab]').forEach(function(button){var active=button.dataset.homeTab===homeTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',active?'true':'false');});
    var content=document.getElementById('gpHomeContent');if(!content)return;
    var model=homeModel(homeDateValue()),panes={overview:overviewPane,recovery:recoveryPane,sleep:sleepPane,load:loadPane},next=panes[homeTab](model);if(content.innerHTML!==next)content.innerHTML=next;localizeVisible();if(window.SimurgCoachUI&&typeof window.SimurgCoachUI.decorateHome==='function')window.SimurgCoachUI.decorateHome(content,homeTab,homeDateValue(),model);
  }
  window.homePremiumMove=function(delta){
    var next=addDays(selectedDate,Number(delta)||0);
    selectedDate=next;
    if(typeof mondayOf==='function')weekStart=mondayOf(next);
    renderHome();
  };
  window.homePremiumToday=function(){
    var next=today();
    try{
      selectedDate=next;
      if(typeof mondayOf==='function')weekStart=mondayOf(next);
    }catch(error){
      window.selectedDate=next;
    }
    renderHome();
  };
  window.homePremiumSetTab=function(tab){if(homeTabs.indexOf(tab)<0||tab===homeTab)return;homeTab=tab;renderHome();var home=document.getElementById('home');if(home)home.scrollTop=0;};
  window.SimurgReadiness={resolve:function(date){return resolveReadiness(date||homeDateValue(),homeModelSignals(date||homeDateValue()));}};
  function homeModelSignals(date){var data=dataRoot(),night=polarLatest(data,'polarNightlyRecharge',date)||{},sleep=polarLatest(data,'polarSleep',date)||{},loadResult=sharedLoad(date),recovery=recoveryEntry(data,date)||{},session=window.SimurgWorkoutSource&&window.SimurgWorkoutSource.day?window.SimurgWorkoutSource.day(date):null,hasGym=(data.workouts||[]).some(function(row){return row&&row.date===date;});return {recovery:recovery,hasActivity:!!(hasGym||session&&session.primaryPolar||session&&session.appleLegacy),signals:{hrv:firstNumber(night.heartRateVariabilityAvg,recovery.hrvMs,recovery.hrv),rhr:firstNumber(night.heartRateAvg,recovery.restingHr,recovery.rhr),respiratory:firstNumber(night.breathingRateAvg,recovery.respiratoryRate),sleepScore:firstNumber(sleep.sleepScore,recovery.sleepScore),cardioLoad:loadResult.available?loadResult.value:null}};}

  function selectedDateValue(){try{return selectedDate||today();}catch(e){return today();}}
  function premiumLongDate(value){try{return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return value;}}
  function refineGym(){
    var gym=document.getElementById('gym');if(!gym)return;
    gym.classList.add('gp-gym-refined');
    var title=gym.querySelector('.topbar h1');if(title)title.textContent='🏋️ Gym Modu';
    var controls=gym.querySelector('.topbar .controls'),label=document.getElementById('gymDateLabel');
    if(controls)controls.classList.add('gp-gym-nav');
    if(label){label.classList.add('gp-gym-date-line');label.textContent=premiumLongDate(selectedDateValue());if(controls&&label.parentNode===controls)controls.insertAdjacentElement('afterend',label);}
  }
  function loggerPanel(title){var wanted=String(title).toUpperCase();return Array.from(document.querySelectorAll('#workout .right .panel')).find(function(panel){var head=panel.querySelector('h3');return head&&head.textContent.trim().toUpperCase().indexOf(wanted)>=0;})||null;}
  function premiumWeekRange(){try{var start=weekStart,end=typeof addDays==='function'?addDays(start,6):start;var sd=new Date(start+'T12:00:00Z'),ed=new Date(end+'T12:00:00Z'),sm=new Intl.DateTimeFormat('tr-TR',{month:'short',timeZone:'UTC'}).format(sd),em=new Intl.DateTimeFormat('tr-TR',{month:'short',timeZone:'UTC'}).format(ed);return sd.getUTCDate()+' '+sm+' — '+ed.getUTCDate()+' '+em+' '+ed.getUTCFullYear();}catch(e){return '';}}
  function refineLogger(){
    var workout=document.getElementById('workout');if(!workout)return;
    workout.classList.add('gp-logger-refined');
    var controls=workout.querySelector('.topbar .controls'),weekLabel=document.getElementById('weekLabel');
    if(controls){controls.classList.add('gp-logger-week-controls');var weekButtons=controls.querySelectorAll('.weekBtn');if(weekButtons[0])weekButtons[0].textContent='← Önceki Hafta';if(weekButtons[1])weekButtons[1].textContent='Sonraki Hafta →';if(weekButtons[2])weekButtons[2].textContent='Bugüne Git';}
    var range=premiumWeekRange();if(weekLabel&&range)weekLabel.textContent=range;
    var groups=document.getElementById('workoutGroups');if(groups&&!groups.querySelector('.gp-logger-exercises-title'))groups.insertAdjacentHTML('afterbegin','<div class="gp-logger-exercises-title"><small>OTURUM KAYDI</small><h2>Egzersiz</h2></div>');
    var exerciseTitle=groups&&groups.querySelector('.gp-logger-exercises-title h2');if(exerciseTitle&&exerciseTitle.textContent!=='Egzersiz')exerciseTitle.textContent='Egzersiz';
    var muscle=loggerPanel('KAS GRUBU'),trend=loggerPanel('HACİM TREND'),raw=loggerPanel('PERFORMANS ÖZETİ')||loggerPanel('RAW PERFORMANCE'),watch=loggerPanel('APPLE WATCH');
    if(muscle)muscle.classList.add('gp-logger-muscle');if(trend)trend.classList.add('gp-logger-trend');if(raw)raw.classList.add('gp-logger-raw');if(watch)watch.classList.add('gp-logger-hidden');
    if(window.innerWidth<=900)workout.querySelectorAll('.dayProgram .active,.weekStrip .active').forEach(function(card){card.scrollIntoView({behavior:'auto',block:'nearest',inline:'center'});});
  }

  function syncNavPressed(){
    document.querySelectorAll('#simurgV8Nav button[data-key]').forEach(function(button){
      button.setAttribute('aria-pressed',button.classList.contains('active')?'true':'false');
    });
  }
  function normalizeNav(){
    var nav=document.getElementById('simurgV8Nav');if(!nav)return;
    var order=['home','gym','logger','training-lab','menu'];
    var current=Array.from(nav.children).filter(function(item){return item.matches('button[data-key]');}).map(function(item){return item.dataset.key;});
    var expected=order.filter(function(key){return nav.querySelector('[data-key="'+key+'"]');});
    if(current.join('|')!==expected.join('|'))expected.forEach(function(key){var item=nav.querySelector('[data-key="'+key+'"]');if(item)nav.appendChild(item);});
    nav.setAttribute('aria-label','Simurg mobil gezinme');
    syncNavPressed();
    var logger=nav.querySelector('[data-key="logger"]');if(logger)Array.from(logger.childNodes).forEach(function(node){if(node.nodeType===Node.TEXT_NODE&&node.nodeValue.trim())node.nodeValue='Günlük';});
  }
  function localizeVisible(){
    if(!window.SimurgLabels)return;
    var selectors=['aside .nav b','.topbar h1','.programIntelPremiumHead small','.programIntelHead small','.programIntelMini small','.activitySessionTitle small','.activityPill','.gp-report-copy button','.gp-report-copy b','#simurgV8Menu button b','#simurgV8Sheet button b','#simurgV8Sheet button small','.gp-ring-card>small','.gp-horizon-flow small','.gp-source-status','.section.active h1','.section.active h2','.section.active h3','.section.active small','.section.active button','.section.active button b','.section.active button span','.section.active label','.section.active .tab'];
    document.querySelectorAll(selectors.join(',')).forEach(function(node){var value=node.textContent.trim(),next=window.SimurgLabels.ui(value);if(next!==value)node.textContent=next;});
    var tabLabels={OVERVIEW:'GENEL',RECOVERY:'TOPARLANMA',SLEEP:'UYKU',LOAD:'YÜK'};
    document.querySelectorAll('[role="tab"],.gp-home-tab').forEach(function(node){var value=node.textContent.trim();if(tabLabels[value])node.textContent=tabLabels[value];});
    var roots=Array.from(document.querySelectorAll('.section.active,aside .nav,#simurgV8Sheet.open,#simurgV8Sheet[aria-hidden="false"]'));
    roots.forEach(function(root){
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),node;
      while((node=walker.nextNode())){
        var parent=node.parentElement;if(!parent||/^(?:SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(parent.tagName)||parent.isContentEditable)continue;
        var current=node.nodeValue,next=window.SimurgLabels.sentence(current);if(next!==current)node.nodeValue=next;
      }
    });
  }
  function cleanCoaching(){
    var section=document.getElementById('coaching');if(!section)return;
    var shell=section.querySelector('.gp-coaching-shell');
    section.classList.remove('gp-coaching-empty');
    if(shell)shell.remove();
    section.querySelectorAll('.coachPremiumMessage').forEach(function(node){node.innerHTML=node.innerHTML.replace(/\.\s*Neden:/g,'. Neden:').replace(/\.\s*Öneri:/g,'. Öneri:');});
    section.querySelectorAll('.coachPremiumPill,.coachPremiumStat b').forEach(function(node){var labels={Caution:'Kontrollü',Low:'Düşük',Good:'İyi',None:'Yok'},value=node.textContent.trim();if(labels[value])node.textContent=labels[value];});
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
    var input=document.getElementById('universalJsonBox');if(input){if(!input.dataset.gpInitialized){input.value='';input.dataset.gpInitialized='1';}input.placeholder='JSON verisini buraya yapıştır';}
    if(typeof window.renderDataLocalStatus==='function')window.renderDataLocalStatus();
  }
  function reportCopyBar(id,label,buttonLabel,handler){return '<div id="'+id+'" class="gp-report-copy"><div><small>Rapor Dışa Aktarımı</small><b>'+esc(label)+'</b></div><button class="btn sec" type="button" onclick="'+handler+'()">'+esc(buttonLabel)+'</button></div>';}
  function monthLabel(value){
    try{return new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(error){return String(value||'').slice(0,7);}
  }
  function ensureMonthlyNavigation(){
    var section=document.getElementById('monthly'),topbar=section&&section.querySelector('.topbar');if(!topbar)return;
    var nav=topbar.querySelector('.gp-month-nav');
    if(!nav){
      nav=document.createElement('div');
      nav.className='gp-month-nav';
      nav.setAttribute('role','group');
      nav.setAttribute('aria-label','Aylık rapor dönemi');
      nav.innerHTML='<button type="button" aria-label="Önceki ay" onclick="simurgPremiumShiftMonth(-1)">‹</button><output id="gpMonthNavLabel"></output><button type="button" aria-label="Sonraki ay" onclick="simurgPremiumShiftMonth(1)">›</button>';
      topbar.appendChild(nav);
    }
    var label=nav.querySelector('#gpMonthNavLabel');if(label)label.textContent=monthLabel(selectedDateValue());
  }
  function polishReports(){
    var program=document.getElementById('programReport');if(program){var utility=document.getElementById('programReportUtilityBar');if(utility&&program.lastElementChild!==utility)program.appendChild(utility);}
    var weekly=document.getElementById('weeklyReport');if(weekly&&!document.getElementById('gpWeeklyCopy'))weekly.insertAdjacentHTML('beforeend',reportCopyBar('gpWeeklyCopy','Seçili haftayı temiz analiz metni olarak kopyala.','Haftalık Raporu Kopyala','copyWeeklyPremiumReport'));
    var monthly=document.getElementById('monthlyReport');if(monthly&&!document.getElementById('gpMonthlyCopy'))monthly.insertAdjacentHTML('beforeend',reportCopyBar('gpMonthlyCopy','Seçili ayı temiz analiz metni olarak kopyala.','Aylık Raporu Kopyala','copyMonthlyPremiumReport'));
    ensureMonthlyNavigation();
  }
  window.simurgPremiumShiftMonth=function(delta){
    var current=selectedDateValue(),parts=String(current).split('-').map(Number);
    var year=parts[0]||new Date().getUTCFullYear(),month=(parts[1]||1)-1,day=parts[2]||1;
    var targetMonth=new Date(Date.UTC(year,month+(Number(delta)||0),1));
    var lastDay=new Date(Date.UTC(targetMonth.getUTCFullYear(),targetMonth.getUTCMonth()+1,0)).getUTCDate();
    var next=new Date(Date.UTC(targetMonth.getUTCFullYear(),targetMonth.getUTCMonth(),Math.min(day,lastDay))).toISOString().slice(0,10);
    try{selectedDate=next;if(typeof mondayOf==='function')weekStart=mondayOf(next);}catch(error){}
    window.selectedDate=next;
    if(typeof window.render==='function')window.render();
    if(typeof window.renderMonthlyReviewPanel==='function')window.renderMonthlyReviewPanel();
    polishReports();
    localizeVisible();
    var section=document.getElementById('monthly');if(section)section.scrollTop=0;
  };
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
    var summary=window.SimurgVolumeModel.summary(rows);return {sets:summary.sets,reps:summary.reps,vol:summary.volume};
  }
  function selectedWeek(){
    try{if(typeof weekDates==='function')return weekDates();}catch(e){}
    var d=new Date(),day=d.getDay()||7,start=new Date(d);start.setDate(d.getDate()-day+1);return Array.from({length:7},function(_,i){var x=new Date(start);x.setDate(start.getDate()+i);return x.toISOString().slice(0,10);});
  }
  function selectedMonth(){try{if(typeof selectedDate!=='undefined'&&selectedDate)return String(selectedDate).slice(0,7);}catch(e){}return today().slice(0,7);}
  function weeklyReportText(){
    var dates=selectedWeek(),shared=window.SimurgSignalModel&&window.SimurgSignalModel.week(dates[0]);if(!shared)return 'SIMURG OS — Haftalık Rapor\nVeri bulunmuyor.';
    return ['SIMURG OS — Haftalık Rapor',shared.startDate+' → '+shared.endDate,'','Gym günleri: '+shared.gymDays,'Antrenman günleri: '+shared.workoutDays,'Aktivite günleri: '+shared.activityDays,'Toplam set: '+Math.round(shared.sets),'Toplam tekrar: '+Math.round(shared.reps),'Toplam hacim: '+Math.round(shared.volume)+' kg','Aktivite süresi: '+Math.round(shared.activityMinutes)+' dk','Aktif kalori: '+Math.round(shared.activeCalories)+' kcal','Polar antrenmanı: '+shared.polarWorkoutCount,'Ortalama RPE: '+(shared.avgRpe==null?'—':shared.avgRpe.toFixed(1))].join('\n');
  }
  function monthlyReportText(){
    var month=selectedMonth(),shared=window.SimurgSignalModel&&window.SimurgSignalModel.month(month);if(!shared)return 'SIMURG OS — Aylık Rapor\nVeri bulunmuyor.';
    return ['SIMURG OS — Aylık Rapor','Ay: '+month,'','Gym günleri: '+shared.gymDays,'Antrenman günleri: '+shared.workoutDays,'Aktivite günleri: '+shared.activityDays,'Toplam set: '+Math.round(shared.sets),'Toplam tekrar: '+Math.round(shared.reps),'Toplam hacim: '+Math.round(shared.volume)+' kg','Aktivite süresi: '+Math.round(shared.activityMinutes)+' dk','Aktif kalori: '+Math.round(shared.activeCalories)+' kcal','Polar antrenmanı: '+shared.polarWorkoutCount,'Ortalama RPE: '+(shared.avgRpe==null?'—':shared.avgRpe.toFixed(1))].join('\n');
  }
  async function copyText(value,message){
    try{await navigator.clipboard.writeText(value);}catch(e){var area=document.createElement('textarea');area.value=value;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}
    alert(message);
  }
  window.generateWeeklyPremiumReport=weeklyReportText;
  window.generateMonthlyPremiumReport=monthlyReportText;
  window.copyWeeklyPremiumReport=function(){return copyText(weeklyReportText(),'Haftalık rapor kopyalandı.');};
  window.copyMonthlyPremiumReport=function(){return copyText(monthlyReportText(),'Aylık rapor kopyalandı.');};

  function ensureAlertPanel(){
    var panel=document.getElementById('simurgAlertPanel');if(panel)return panel;
    document.body.insertAdjacentHTML('beforeend','<div id="simurgAlertPanel" role="dialog" aria-modal="true" aria-hidden="true"><div class="psAlertSheet"><div class="psAlertHead"><div><b>Simurg Alert</b><span>Günün koç bildirimleri</span></div><button type="button" onclick="simurgCloseAlert()" aria-label="Kapat">×</button></div><div id="simurgAlertItems"></div></div></div>');
    panel=document.getElementById('simurgAlertPanel');panel.addEventListener('click',function(event){if(event.target===panel)window.simurgCloseAlert();});return panel;
  }
  window.simurgOpenAlert=function(){var panel=ensureAlertPanel(),model=homeModel(homeDateValue()),result=model.readinessResult,items=document.getElementById('simurgAlertItems');items.innerHTML='<div class="psAlertItem"><b>'+esc(result.label)+'</b><span>'+esc(coachSentence(model))+'</span></div>';panel.classList.add('open');panel.setAttribute('aria-hidden','false');if(window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refreshAlert==='function')window.SimurgPolarBridge.refreshAlert();};
  window.simurgCloseAlert=function(){var panel=document.getElementById('simurgAlertPanel');if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}};

  function refreshScreen(id){
    if(id==='recovery'||id==='sleep'||id==='load'){homeTab=id;id='home';}
    normalizeNav();
    if(id==='home')renderHome();
    else if(id==='gym')refineGym();
    else if(id==='workout')refineLogger();
    else if(id==='coaching')cleanCoaching();
    else if(id==='program')refineProgramIntelligence();
    else if(id==='data')cleanDataCenter();
    if(id==='weekly'||id==='monthly'||id==='program')polishReports();
    if(window.SimurgCurrentWeekUX&&typeof window.SimurgCurrentWeekUX.refresh==='function'&&(id==='gym'||id==='workout'||id==='data'))window.SimurgCurrentWeekUX.refresh();
    if(window.SimurgSmartProgression&&typeof window.SimurgSmartProgression.refresh==='function'&&(id==='gym'||id==='program'||id==='monthly')&&(window.innerWidth>900||id==='program'||id==='monthly'))window.SimurgSmartProgression.refresh();
    if(window.SimurgProfessionalPolish&&typeof window.SimurgProfessionalPolish.refresh==='function')window.SimurgProfessionalPolish.refresh();
    if(id==='workout'&&typeof window.simurgDisableLoggerTrendTooltip==='function')window.simurgDisableLoggerTrendTooltip();
    if(window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refresh==='function'&&(id==='home'||id==='polar'||id==='coaching'||id==='data'))window.SimurgPolarBridge.refresh(id);
    if(id==='coaching'&&window.SimurgCoachUI&&typeof window.SimurgCoachUI.renderMobile==='function')window.SimurgCoachUI.renderMobile();
  }
  function refreshAll(){normalizeNav();renderHome();refineGym();refineLogger();cleanCoaching();cleanDataCenter();polishReports();refineProgramIntelligence();localizeVisible();if(window.SimurgCoachUI&&typeof window.SimurgCoachUI.renderMobile==='function')window.SimurgCoachUI.renderMobile();if(window.SimurgCurrentWeekUX&&typeof window.SimurgCurrentWeekUX.refresh==='function')window.SimurgCurrentWeekUX.refresh();if(window.SimurgSmartProgression&&typeof window.SimurgSmartProgression.refresh==='function')window.SimurgSmartProgression.refresh();if(window.SimurgProfessionalPolish&&typeof window.SimurgProfessionalPolish.refresh==='function')window.SimurgProfessionalPolish.refresh();if(typeof window.simurgDisableLoggerTrendTooltip==='function')window.simurgDisableLoggerTrendTooltip();if(window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.refresh==='function')window.SimurgPolarBridge.refresh();}
  function dataChanged(reason){if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate(reason||'dataChanged');if(window.SimurgCoachClient)window.SimurgCoachClient.invalidate();if(window.innerWidth<=900)refreshScreen(document.body.getAttribute('data-simurg-active-screen')||'home');else refreshAll();}
  window.SimurgPremium={refreshScreen:refreshScreen,refreshAll:refreshAll,dataChanged:dataChanged,renderHome:renderHome,localizeVisible:localizeVisible};
  ready(function(){
    document.addEventListener('click',function(event){
      var card=event.target.closest('[data-gp-polar-date]');
      if(!card)return;
      var date=String(card.dataset.gpPolarDate||'');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||typeof window.simurgOpenPolarWorkoutFor!=='function')return;
      window.simurgOpenPolarWorkoutFor(date,String(card.dataset.gpPolarStart||''));
    });
    document.addEventListener('click',function(event){
      if(event.target.closest('#simurgV8Nav button[data-key]'))syncNavPressed();
    });
    if(window.innerWidth<=900)refreshScreen(document.body.getAttribute('data-simurg-active-screen')||'home');else refreshAll();
  });
})();
