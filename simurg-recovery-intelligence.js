(function(root,factory){
  'use strict';
  var sleepApi=null;
  if(typeof module==='object'&&module.exports){try{sleepApi=require('./simurg-sleep-intelligence.js');}catch(error){}}
  else if(root)sleepApi=root.SimurgSleepIntelligence;
  var api=factory(root,sleepApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgRecoveryIntelligence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,defaultSleepApi){
  'use strict';

  var VERSION=1,BASELINE_DAYS=14,BASELINE_MINIMUM=5,LOAD_DAYS=7,LOAD_MINIMUM=4;
  function number(value){var parsed=Number(value);return value!==null&&value!==''&&Number.isFinite(parsed)?parsed:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}return null;}
  function round(value,digits){if(value==null)return null;var factor=Math.pow(10,digits||0);return Math.round(value*factor)/factor;}
  function average(values){values=(values||[]).filter(function(value){return value!=null;});return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function standardDeviation(values){var mean=average(values);return mean==null?null:Math.sqrt(values.reduce(function(sum,value){return sum+Math.pow(value-mean,2);},0)/values.length);}
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;}
  function addDays(date,amount){var value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+amount);return value.toISOString().slice(0,10);}
  function daily(data,key,date){var store=data&&data[key],value=store&&store.daily&&store.daily[date];return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
  function unique(values){var seen={};return (values||[]).filter(function(value){var key=String(value||'');if(!key||seen[key])return false;seen[key]=true;return true;});}

  function nightly(data,date){
    var row=daily(data,'polarNightlyRecharge',date)||{};
    return {hrv:firstNumber(row.heartRateVariabilityAvg,row.hrvMs,row.hrv),nightHr:firstNumber(row.heartRateAvg,row.nightlyHr,row.nightHr,row.restingHr),breathing:firstNumber(row.breathingRateAvg,row.breathingRate),ansCharge:firstNumber(row.ansCharge,row.ansChargeScore),nightlyRecharge:firstNumber(row.nightlyRechargeStatus,row.nightlyRechargeScore)};
  }
  function sleep(data,date){var row=daily(data,'polarSleep',date)||{};return {sleepCharge:firstNumber(row.sleepCharge,row.sleepChargeScore)};}
  function cardioLoad(data,date,signalDay){
    var shared=null;if(typeof signalDay==='function')try{shared=signalDay(date)||null;}catch(error){shared=null;}
    var load=shared&&shared.load||{},row=daily(data,'polarCardioLoad',date)||{};
    return firstNumber(load.value,load.cardioLoad,row.cardioLoad,row.load);
  }
  function history(data,date,reader,key,days){
    var values=[];for(var i=1;i<=days;i+=1){var value=number(reader(data,addDays(date,-i))[key]);if(value!=null)values.push(value);}return values;
  }
  function metric(current,values,direction,minimum){
    var baseline=average(values),spread=standardDeviation(values),qualified=current!=null&&values.length>=minimum&&baseline!=null,deviation=qualified&&baseline!==0?(current-baseline)/Math.abs(baseline)*100:null,status='insufficient';
    if(qualified){
      var upper=baseline+(spread||0),lower=baseline-(spread||0);
      if(current>upper)status=direction==='higher'?'positive':direction==='lower'?'negative':'unusual';
      else if(current<lower)status=direction==='higher'?'negative':direction==='lower'?'positive':'unusual';
      else status='balanced';
    }
    return {value:round(current,1),baseline:round(baseline,1),deviationPercent:round(deviation,1),standardDeviation:round(spread,1),sampleSize:values.length,status:status,qualified:qualified};
  }
  function resolveSleep(data,date,options){
    if(options.sleepIntelligence&&typeof options.sleepIntelligence==='object')return options.sleepIntelligence;
    if(typeof options.sleepResolver==='function')return options.sleepResolver(date,{data:data});
    var api=options.sleepApi||defaultSleepApi||(root&&root.SimurgSleepIntelligence);
    return api&&typeof api.resolve==='function'?api.resolve(date,{data:data}):null;
  }
  function canonicalScore(data,date,options){
    var result=options.canonicalRecovery;
    try{if(typeof options.recoveryResolver==='function')result=options.recoveryResolver(date,{data:data});else if(result==null&&root&&root.SimurgReadiness&&typeof root.SimurgReadiness.resolve==='function')result=root.SimurgReadiness.resolve(date);}catch(error){result=null;}
    var value=number(result&&typeof result==='object'?result.score:result);
    return value!=null&&value>=0&&value<=100?value:null;
  }
  function addSignal(metricValue,label,positive,negative){
    if(metricValue.status==='positive')positive.push(label);
    if(metricValue.status==='negative'||metricValue.status==='unusual')negative.push(label);
  }
  function action(status){
    if(status==='positive')return {recommendation:'Gece toparlanma sinyalleri kişisel baseline üzerinde; mevcut plan recovery açısından destekleniyor.',caution:null};
    if(status==='strained')return {recommendation:'Gece toparlanması baskı altında; bugün kapasite ve Coach güvenlik bağlamını birlikte değerlendir.',caution:'Birden fazla gece sinyali kişisel aralığın dışında. Agresif yük artışını yalnızca mevcut Coach kuralları izin veriyorsa değerlendir.'};
    if(status==='balanced')return {recommendation:'Gece toparlanma sinyalleri kişisel baseline çevresinde; normal dalgalanma içinde görünüyor.',caution:null};
    return {recommendation:'Recovery Intelligence için en az beş geçerli Polar gecesi gerekli.',caution:'Eksik veri nedeniyle gece toparlanması yorumlanmadı.'};
  }
  function analyze(data,date,options){
    data=data||{};options=options||{};date=dateValue(date);
    if(!date)return {schemaVersion:VERSION,date:null,score:null,status:'insufficient',confidence:0,contributors:{ansCharge:null,hrv:null,nightHr:null,breathing:null,sleepCharge:null,recentLoad:null},signals:{positive:[],negative:[]},missingData:['date'],action:action('insufficient')};
    var current=nightly(data,date),currentSleep=sleep(data,date),sleepResult=resolveSleep(data,date,options);
    var hrv=metric(current.hrv,history(data,date,nightly,'hrv',BASELINE_DAYS),'higher',BASELINE_MINIMUM),nightHr=metric(current.nightHr,history(data,date,nightly,'nightHr',BASELINE_DAYS),'lower',BASELINE_MINIMUM),breathing=metric(current.breathing,history(data,date,nightly,'breathing',BASELINE_DAYS),'stable',BASELINE_MINIMUM),ans=metric(current.ansCharge,history(data,date,nightly,'ansCharge',BASELINE_DAYS),'higher',BASELINE_MINIMUM),nightlyRecharge=metric(current.nightlyRecharge,history(data,date,nightly,'nightlyRecharge',BASELINE_DAYS),'higher',BASELINE_MINIMUM),sleepCharge=metric(currentSleep.sleepCharge,history(data,date,sleep,'sleepCharge',BASELINE_DAYS),'higher',BASELINE_MINIMUM);
    var previousLoad=cardioLoad(data,addDays(date,-1),options.signalDay),loadHistory=[];for(var i=2;i<=LOAD_DAYS+1;i+=1){var loadValue=cardioLoad(data,addDays(date,-i),options.signalDay);if(loadValue!=null)loadHistory.push(loadValue);}
    var recentLoad=metric(previousLoad,loadHistory,'lower',LOAD_MINIMUM),sleepDaily=sleepResult&&sleepResult.daily||null;
    var contributors={ansCharge:ans,hrv:hrv,nightHr:nightHr,breathing:breathing,sleepCharge:sleepCharge,recentLoad:recentLoad};
    contributors.ansCharge.nightlyRecharge=nightlyRecharge;
    contributors.sleepCharge.sleepIntelligence={status:sleepResult&&sleepResult.status||'insufficient',actualSleepMinutes:number(sleepDaily&&sleepDaily.actualSleepMinutes),confidence:sleepDaily&&sleepDaily.confidence||null};
    var missing=[];[['hrv',hrv],['nightHr',nightHr],['breathing',breathing]].forEach(function(pair){if(!pair[1].qualified)missing.push(pair[0]+'PersonalBaseline');});
    if(!ans.qualified)missing.push('ansChargePersonalBaseline');if(!nightlyRecharge.qualified)missing.push('nightlyRechargePersonalBaseline');if(!sleepCharge.qualified)missing.push('sleepChargePersonalBaseline');if(!recentLoad.qualified)missing.push('recentLoadPersonalBaseline');if(!sleepResult||sleepResult.status==='insufficient')missing.push('sleepIntelligence');
    var required=hrv.qualified&&nightHr.qualified&&breathing.qualified;
    if(!required)return {schemaVersion:VERSION,date:date,score:null,status:'insufficient',confidence:0,contributors:contributors,signals:{positive:[],negative:[]},missingData:unique(missing),action:action('insufficient')};
    var positive=[],negative=[];
    addSignal(hrv,'HRV kişisel gece aralığının üzerinde.',positive,negative);addSignal(nightHr,'Gece nabzı kişisel toparlanma yönünde.',positive,negative);addSignal(breathing,'Solunum hızı kişisel gece aralığının dışında.',positive,negative);addSignal(ans,'ANS Charge kişisel aralığın üzerinde.',positive,negative);addSignal(nightlyRecharge,'Nightly Recharge kişisel aralığın üzerinde.',positive,negative);addSignal(sleepCharge,'Sleep Charge kişisel aralığın üzerinde.',positive,negative);
    if(recentLoad.status==='negative')negative.push('Önceki gün Cardio Load kişisel yakın dönem aralığının üzerinde.');
    var status=negative.length>=2?'strained':positive.length>=2?'positive':'balanced',score=canonicalScore(data,date,options);
    if(score==null)missing.push('canonicalRecoveryScore');
    var confidence=60+(ans.qualified?8:0)+(nightlyRecharge.qualified?7:0)+(sleepCharge.qualified?10:0)+(recentLoad.qualified?7:0)+(sleepResult&&sleepResult.status==='available'?8:0);
    return {schemaVersion:VERSION,date:date,score:score,status:status,confidence:Math.min(100,confidence),contributors:contributors,signals:{positive:unique(positive),negative:unique(negative)},missingData:unique(missing),action:action(status)};
  }
  function resolve(date,options){
    options=options||{};var data=options.data,signalDay=options.signalDay;
    try{if(!data&&root)data=typeof root.simurgGetData==='function'?root.simurgGetData():root.DATA;}catch(error){}
    try{if(!signalDay&&root&&root.SimurgSignalModel)signalDay=root.SimurgSignalModel.day;}catch(error){}
    var resolved={};Object.keys(options).forEach(function(key){resolved[key]=options[key];});resolved.signalDay=signalDay;return analyze(data||{},date,resolved);
  }
  return {VERSION:VERSION,analyze:analyze,resolve:resolve};
});
