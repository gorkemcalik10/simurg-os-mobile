(function(root,factory){
  'use strict';
  var sleepApi=null;
  if(typeof module==='object'&&module.exports){try{sleepApi=require('./simurg-sleep-intelligence.js');}catch(error){}}
  else if(root)sleepApi=root.SimurgSleepIntelligence;
  var api=factory(root,sleepApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgEnergyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,defaultSleepApi){
  'use strict';

  var VERSION=1,RECOVERY_BASELINE_DAYS=14,RECOVERY_MINIMUM=5,LOAD_BASELINE_DAYS=7,LOAD_MINIMUM=4;
  function number(value){var parsed=Number(value);return value!==null&&value!==''&&Number.isFinite(parsed)?parsed:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}return null;}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function round(value,digits){if(value==null)return null;var factor=Math.pow(10,digits||0);return Math.round(value*factor)/factor;}
  function average(values){values=(values||[]).filter(function(value){return value!=null;});return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function standardDeviation(values){var mean=average(values);return mean==null?null:Math.sqrt(values.reduce(function(sum,value){return sum+Math.pow(value-mean,2);},0)/values.length);}
  function unique(values){var seen={};return (values||[]).filter(function(value){var key=String(value||'');if(!key||seen[key])return false;seen[key]=true;return true;});}
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;}
  function addDays(date,amount){var value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+amount);return value.toISOString().slice(0,10);}
  function daily(data,key,date){var store=data&&data[key],value=store&&store.daily&&store.daily[date];return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function text(value){return value==null?'':String(value).trim();}

  function resolveSleep(data,date,options){
    if(options.sleepIntelligence&&typeof options.sleepIntelligence==='object')return options.sleepIntelligence;
    if(typeof options.sleepResolver==='function')return options.sleepResolver(date,{data:data});
    var api=options.sleepApi||defaultSleepApi||(root&&root.SimurgSleepIntelligence);
    return api&&typeof api.resolve==='function'?api.resolve(date,{data:data}):null;
  }
  function stageStability(stages){
    var baseline=stages&&stages.baselineComparison;
    if(!baseline)return null;
    var keys=['deep','rem','light'],currentTotal=0,baselineTotal=0;
    keys.forEach(function(key){currentTotal+=number(baseline[key]&&baseline[key].currentMinutes)||0;baselineTotal+=number(baseline[key]&&baseline[key].baselineMinutes)||0;});
    if(currentTotal<=0||baselineTotal<=0)return null;
    var differences=keys.map(function(key){var current=number(baseline[key]&&baseline[key].currentMinutes),base=number(baseline[key]&&baseline[key].baselineMinutes);return current==null||base==null?null:Math.abs(current/currentTotal*100-base/baselineTotal*100);});
    if(differences.some(function(value){return value==null;}))return null;
    return round(clamp(100-average(differences)*2,0,100),0);
  }
  function sleepContributor(result){
    var value=result&&result.daily,missing=[],reasons=[];
    if(!value||value.status!=='available')return {score:null,status:'insufficient',confidence:'insufficient',weight:0.45,reasons:[],missingData:['sleepIntelligence.daily']};
    var actual=number(value.actualSleepMinutes),efficiency=number(value.sleepEfficiency),debt=number(value.sleepDebtMinutes),goal=number(value.sleepGoalMinutes),consistency=number(value.sleepConsistency&&value.sleepConsistency.score),stages=stageStability(value.sleepStages);
    if(actual==null)missing.push('actualSleepMinutes');if(efficiency==null)missing.push('sleepEfficiency');if(debt==null)missing.push('sleepDebtMinutes');if(goal==null)missing.push('sleepGoalMinutes');if(consistency==null)missing.push('sleepConsistency');if(stages==null)missing.push('sleepStagesBaseline');
    if(missing.length)return {score:null,status:'insufficient',confidence:'insufficient',weight:0.45,reasons:[],missingData:missing};
    var durationRatio=clamp(actual/goal,0,1),durationScore=durationRatio*durationRatio*100,debtScore=clamp(100-debt/goal*100,0,100);
    var score=round(durationScore*.35+clamp(efficiency,0,100)*.25+debtScore*.20+clamp(consistency,0,100)*.15+stages*.05,0);
    reasons.push('Gerçek uyku '+round(actual/60,1)+' saat; yatakta geçirilen süre uyku süresi olarak kullanılmadı.');
    reasons.push('Uyku verimliliği %'+round(efficiency,0)+', uyku borcu '+round(debt,0)+' dakika.');
    reasons.push('Uyku tutarlılığı '+round(consistency,0)+'/100; evre dağılımı kişisel geçmişle karşılaştırıldı.');
    return {score:score,status:'available',confidence:value.confidence&&value.confidence.level==='high'?'high':'medium',weight:0.45,reasons:reasons,missingData:[],evidence:{actualSleepMinutes:actual,sleepEfficiency:efficiency,sleepDebtMinutes:debt,sleepConsistency:consistency,sleepStageStability:stages}};
  }

  function recoveryRow(data,date){
    var row=daily(data,'polarNightlyRecharge',date)||{};
    return {hrv:firstNumber(row.heartRateVariabilityAvg,row.hrvMs,row.hrv),nightHr:firstNumber(row.heartRateAvg,row.nightlyHr,row.nightHr,row.restingHr,row.restingHR),breathingRate:firstNumber(row.breathingRateAvg,row.breathingRate),ansCharge:firstNumber(row.ansCharge,row.ansChargeScore),nightlyRecharge:firstNumber(row.nightlyRechargeStatus,row.nightlyRechargeScore)};
  }
  function personalMetric(data,date,key,direction){
    var current=number(recoveryRow(data,date)[key]),values=[];
    for(var i=1;i<=RECOVERY_BASELINE_DAYS;i+=1){var value=number(recoveryRow(data,addDays(date,-i))[key]);if(value!=null)values.push(value);}
    var baseline=average(values),qualified=current!=null&&values.length>=RECOVERY_MINIMUM&&baseline!=null,deviation=qualified&&baseline!==0?(current-baseline)/Math.abs(baseline)*100:null,score=null;
    if(deviation!=null){if(direction==='higher')score=clamp(70+deviation*1.5,20,100);if(direction==='lower')score=clamp(70-deviation*1.5,20,100);if(direction==='stable')score=clamp(70-Math.abs(deviation)*2,20,70);}
    return {value:current,baseline:round(baseline,1),deviationPercent:round(deviation,1),score:round(score,0),sampleSize:values.length,qualified:qualified};
  }
  function recoveryContributor(data,date){
    var signals={hrv:personalMetric(data,date,'hrv','higher'),nightHr:personalMetric(data,date,'nightHr','lower'),ansCharge:personalMetric(data,date,'ansCharge','higher'),nightlyRecharge:personalMetric(data,date,'nightlyRecharge','higher'),breathingRate:personalMetric(data,date,'breathingRate','stable')};
    var required=['hrv','nightHr','ansCharge','nightlyRecharge'],missing=required.filter(function(key){return !signals[key].qualified;}),reasons=[];
    if(missing.length)return {score:null,status:'insufficient',confidence:'insufficient',weight:0.35,reasons:[],missingData:missing.map(function(key){return key+'PersonalBaseline';}),signals:signals};
    var score=round(signals.hrv.score*.30+signals.nightHr.score*.30+signals.ansCharge.score*.20+signals.nightlyRecharge.score*.20,0);
    reasons.push('HRV kişisel 14 günlük ortalamaya göre '+(signals.hrv.deviationPercent>=0?'+':'')+signals.hrv.deviationPercent+'%.');
    reasons.push('Gece nabzı kişisel 14 günlük ortalamaya göre '+(signals.nightHr.deviationPercent>=0?'+':'')+signals.nightHr.deviationPercent+'%.');
    reasons.push('ANS Charge ve Nightly Recharge yalnızca kişisel geçmişe göre değerlendirildi.');
    if(signals.breathingRate.qualified)reasons.push('Solunum hızı kişisel gece baseline sapmasıyla bağlam olarak izlendi.');
    return {score:score,status:'available',confidence:signals.breathingRate.qualified?'high':'medium',weight:0.35,reasons:reasons,missingData:signals.breathingRate.qualified?[]:['breathingRatePersonalBaseline'],signals:signals};
  }

  function loadFromData(data,date,signalDay){
    var shared=null;if(typeof signalDay==='function')try{shared=signalDay(date)||null;}catch(error){shared=null;}
    var sharedLoad=shared&&shared.load||{},row=daily(data,'polarCardioLoad',date)||{};
    return {value:firstNumber(sharedLoad.value,sharedLoad.cardioLoad,row.cardioLoad,row.load),ratio:firstNumber(sharedLoad.ratio,row.cardioLoadRatio,row.ratio),status:text(sharedLoad.statusRaw||row.cardioLoadStatus||row.loadStatus||row.status)||null};
  }
  function activityDays(data,date){var count=0;for(var i=1;i<=7;i+=1){if(daily(data,'polarActivity',addDays(date,-i)))count+=1;}return count;}
  function activityLoadContributor(data,date,signalDay,recoveryScore){
    var previous=loadFromData(data,addDays(date,-1),signalDay),history=[];
    for(var i=2;i<=LOAD_BASELINE_DAYS+1;i+=1){var value=number(loadFromData(data,addDays(date,-i),signalDay).value);if(value!=null)history.push(value);}
    if(previous.value==null||history.length<LOAD_MINIMUM)return {score:null,status:'insufficient',confidence:'insufficient',weight:0.12,reasons:[],missingData:['previousDayCardioLoad','cardioLoadPersonalBaseline'],evidence:{previousDay:previous,baselineSampleSize:history.length,recentActivityDays:activityDays(data,date)}};
    var baseline=average(history),spread=standardDeviation(history),high=baseline===0?previous.value>0:previous.value>baseline+(spread||0),poorRecovery=number(recoveryScore)!=null&&recoveryScore<60,score=high?(poorRecovery?40:70):85;
    var reasons=['Önceki gün Cardio Load '+round(previous.value,1)+'; kişisel yakın dönem ortalaması '+round(baseline,1)+'.'];
    if(high)reasons.push(poorRecovery?'Yük kişisel aralığın üzerinde ve recovery sinyalleri zayıf.':'Yük kişisel aralığın üzerinde; recovery sinyalleri bunu destekliyor.');else reasons.push('Yük kişisel yakın dönem aralığında; normal antrenman cezalandırılmadı.');
    return {score:score,status:'available',confidence:history.length>=6?'high':'medium',weight:0.12,reasons:reasons,missingData:[],evidence:{previousDay:previous,baseline:round(baseline,1),standardDeviation:round(spread,1),baselineSampleSize:history.length,recentActivityDays:activityDays(data,date),highLoad:high,highLoadPoorRecovery:high&&poorRecovery}};
  }

  function workoutRows(data,date){return (Array.isArray(data&&data.workouts)?data.workouts:[]).filter(function(row){return row&&row.date===date;});}
  function polarRows(data,date){return list(data&&data.polarWorkouts&&data.polarWorkouts.daily&&data.polarWorkouts.daily[date]).filter(function(row){return row&&typeof row==='object';});}
  function unsafePain(value){var key=text(value).toLocaleLowerCase('tr-TR');return !!key&&!/^(?:none|no|yok|0)$/.test(key);}
  function unsafeForm(value){var key=text(value).toLocaleLowerCase('tr-TR');return !!key&&!/^(?:good|iyi)$/.test(key);}
  function dailyTraining(data,date){
    var gym=workoutRows(data,date),polar=polarRows(data,date),rpes=gym.map(function(row){return number(row.rpe);}).filter(function(value){return value!=null;});
    var volume=gym.reduce(function(sum,row){var sets=firstNumber(row.sets,1)||1,reps=firstNumber(row.reps,0)||0,weight=firstNumber(row.weight,0)||0;return sum+sets*reps*weight;},0);
    return {gymRows:gym.length,polarSessions:polar.length,rpe:average(rpes),volume:gym.length?volume:null,pain:gym.some(function(row){return unsafePain(row.pain);}),badForm:gym.some(function(row){return unsafeForm(row.form);})};
  }
  function trainingLoadContributor(data,date,recoveryScore){
    var hasNamespace=Array.isArray(data&&data.workouts)||!!(data&&data.polarWorkouts&&data.polarWorkouts.daily);
    if(!hasNamespace)return {score:null,status:'insufficient',confidence:'insufficient',weight:0.08,reasons:[],missingData:['trainingHistory']};
    var recent=[],baseline=[];for(var i=1;i<=14;i+=1){var item=dailyTraining(data,addDays(date,-i));(i<=3?recent:baseline).push(item);}
    var recentSessions=recent.reduce(function(sum,item){return sum+item.gymRows+item.polarSessions;},0),baselineSessions=baseline.reduce(function(sum,item){return sum+item.gymRows+item.polarSessions;},0),recentRpe=average(recent.map(function(item){return item.rpe;})),baselineRpes=baseline.map(function(item){return item.rpe;}).filter(function(value){return value!=null;}),recentVolume=average(recent.map(function(item){return item.volume;})),baselineVolumes=baseline.map(function(item){return item.volume;}).filter(function(value){return value!=null;}),pain=recent.some(function(item){return item.pain;}),badForm=recent.some(function(item){return item.badForm;});
    if(recentSessions===0&&baselineSessions===0)return {score:90,status:'available',confidence:'medium',weight:0.08,reasons:['Son 14 günde kayıtlı antrenman yükü yok.'],missingData:[],evidence:{recentSessions:0,baselineSessions:0,recentRpe:null,pain:false,badForm:false,elevated:false}};
    var rpeQualified=recentRpe!=null&&baselineRpes.length>=RECOVERY_MINIMUM,volumeQualified=recentVolume!=null&&baselineVolumes.length>=LOAD_MINIMUM;
    if(!rpeQualified&&!volumeQualified)return {score:null,status:'insufficient',confidence:'insufficient',weight:0.08,reasons:[],missingData:['personalTrainingLoadBaseline'],evidence:{recentSessions:recentSessions,baselineSessions:baselineSessions,recentRpe:round(recentRpe,1),pain:pain,badForm:badForm}};
    var elevatedRpe=rpeQualified&&recentRpe>average(baselineRpes)+(standardDeviation(baselineRpes)||0),elevatedVolume=volumeQualified&&recentVolume>average(baselineVolumes)+(standardDeviation(baselineVolumes)||0),elevated=elevatedRpe||elevatedVolume,poorRecovery=number(recoveryScore)!=null&&recoveryScore<60,score=elevated?(poorRecovery?45:70):85,reasons=[];
    if(rpeQualified)reasons.push('Son 3 günlük RPE kişisel antrenman geçmişiyle karşılaştırıldı.');if(volumeQualified)reasons.push('Son 3 günlük kayıtlı hacim kişisel antrenman geçmişiyle karşılaştırıldı.');if(!elevated)reasons.push('Normal antrenman yükü enerji skorunda cezalandırılmadı.');
    return {score:score,status:'available',confidence:rpeQualified&&volumeQualified?'high':'medium',weight:0.08,reasons:reasons,missingData:[],evidence:{recentSessions:recentSessions,baselineSessions:baselineSessions,recentRpe:round(recentRpe,1),baselineRpe:round(average(baselineRpes),1),recentVolume:round(recentVolume,1),baselineVolume:round(average(baselineVolumes),1),pain:pain,badForm:badForm,elevated:elevated,elevatedWithPoorRecovery:elevated&&poorRecovery}};
  }

  function energyStatus(score){return score>=80?'high':score>=60?'medium':'low';}
  function actionFor(status,contributors){
    var recommendation=status==='high'?'Energy yüksek. Normal progresyon uygulanabilir.':status==='medium'?'Energy orta. İlk hareketlerde kontrol önerilir.':status==='low'?'Energy düşük. Bugün yük artırma yerine teknik kalite öncelikli.':'Energy için yeterli veri yok. Mevcut Coach değerlendirmesi ve antrenman geri bildirimi kullanılmalı.',caution=null,activity=contributors.activityLoad&&contributors.activityLoad.evidence||{},training=contributors.trainingLoad&&contributors.trainingLoad.evidence||{};
    if(activity.highLoadPoorRecovery||training.elevatedWithPoorRecovery)caution='Yük kişisel aralığın üzerinde ve recovery sinyalleri zayıf; ek yük konusunda temkinli ol.';
    if(training.pain||training.badForm)caution='Yakın antrenmanlarda ağrı veya form uyarısı var; Energy skoru mevcut Coach güvenlik kurallarının yerine geçmez.';
    if(status==='insufficient')caution='Eksik sinyaller nedeniyle kapasite tahmini yapılmadı.';
    return {trainingRecommendation:recommendation,caution:caution};
  }
  function analyze(data,date,options){
    data=data||{};options=options||{};date=dateValue(date);
    if(!date)return {schemaVersion:VERSION,date:null,score:null,status:'insufficient',confidence:'insufficient',contributors:{sleep:null,recovery:null,activityLoad:null,trainingLoad:null},reasons:[],missingData:['date'],action:actionFor('insufficient',{})};
    var sleep=sleepContributor(resolveSleep(data,date,options)),recovery=recoveryContributor(data,date),activityLoad=activityLoadContributor(data,date,options.signalDay,recovery.score),trainingLoad=trainingLoadContributor(data,date,recovery.score),contributors={sleep:sleep,recovery:recovery,activityLoad:activityLoad,trainingLoad:trainingLoad};
    var complete=Object.keys(contributors).every(function(key){return contributors[key]&&contributors[key].score!=null;}),score=null,status='insufficient';
    if(complete){score=Math.round(sleep.score*.45+recovery.score*.35+activityLoad.score*.12+trainingLoad.score*.08);status=energyStatus(score);}
    var confidences=Object.keys(contributors).map(function(key){return contributors[key]&&contributors[key].confidence;}),confidence='insufficient';if(complete)confidence=confidences.every(function(value){return value==='high';})?'high':confidences.indexOf('low')>=0?'low':'medium';
    var reasons=unique(Object.keys(contributors).reduce(function(out,key){return out.concat(contributors[key].reasons||[]);},[])).slice(0,8),missing=unique(Object.keys(contributors).reduce(function(out,key){return out.concat(contributors[key].missingData||[]);},[]));
    return {schemaVersion:VERSION,date:date,score:score,status:status,confidence:confidence,contributors:contributors,reasons:reasons,missingData:missing,action:actionFor(status,contributors)};
  }
  function resolve(date,options){
    options=options||{};var data=options.data,signalDay=options.signalDay;
    try{if(!data&&root)data=typeof root.simurgGetData==='function'?root.simurgGetData():root.DATA;}catch(error){}
    try{if(!signalDay&&root&&root.SimurgSignalModel)signalDay=root.SimurgSignalModel.day;}catch(error){}
    var resolved={};Object.keys(options).forEach(function(key){resolved[key]=options[key];});resolved.signalDay=signalDay;return analyze(data||{},date,resolved);
  }
  return {VERSION:VERSION,analyze:analyze,resolve:resolve};
});
