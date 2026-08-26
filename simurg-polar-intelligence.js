(function(root,factory){
  'use strict';
  var sleepApi=null;
  if(typeof module==='object'&&module.exports)try{sleepApi=require('./simurg-sleep-intelligence.js');}catch(error){}
  else if(root)sleepApi=root.SimurgSleepIntelligence;
  var api=factory(root,sleepApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPolarIntelligence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,defaultSleepApi){
  'use strict';

  var VERSION=1;
  var BASELINE_MINIMUM=5;
  var TREND_MINIMUM=4;

  function number(value){var parsed=Number(value);return value!==null&&value!==''&&Number.isFinite(parsed)&&parsed>=0?parsed:null;}
  function signedNumber(value){var parsed=Number(value);return value!==null&&value!==''&&Number.isFinite(parsed)?parsed:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}return null;}
  function text(value){var next=String(value==null?'':value).replace(/\s+/g,' ').trim();return next||null;}
  function round(value,digits){if(value==null||!Number.isFinite(value))return null;var factor=Math.pow(10,digits==null?1:digits);return Math.round(value*factor)/factor;}
  function average(values){values=(values||[]).filter(function(value){return value!=null&&Number.isFinite(value);});return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function standardDeviation(values){var mean=average(values);return mean==null?null:Math.sqrt(values.reduce(function(sum,value){return sum+Math.pow(value-mean,2);},0)/values.length);}
  function deviation(value,baseline){return value==null||baseline==null||baseline===0?null:round((value-baseline)/baseline*100,1);}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
  function addDays(date,amount){var value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+amount);return value.toISOString().slice(0,10);}
  function row(data,key,date){var value=data&&data[key]&&data[key].daily&&data[key].daily[date];return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
  function valuesBefore(data,key,date,days,reader){var output=[];for(var i=1;i<=days;i+=1){var item=reader(row(data,key,addDays(date,-i)));if(item!=null)output.push(item);}return output;}
  function baseline(values){return {qualified:values.length>=BASELINE_MINIMUM,sampleSize:values.length,mean:round(average(values),1),standardDeviation:round(standardDeviation(values),1)};}
  function direction(change,threshold){return change==null?'insufficient':Math.abs(change)<threshold?'stable':change>0?'rising':'falling';}
  function sampleHour(value,date){
    var raw=text(value);if(!raw)return null;
    var match=raw.match(/(?:T|^)(\d{2}):(\d{2})/);if(!match)return null;
    if(/^\d{4}-\d{2}-\d{2}/.test(raw)&&raw.slice(0,10)!==date)return null;
    var hour=Number(match[1]),minute=Number(match[2]);return hour<=23&&minute<=59?hour+minute/60:null;
  }
  function sampleSummary(samples){
    var values=samples.map(function(sample){return number(sample.heartRate);}).filter(function(value){return value!=null;});
    return values.length?{sampleCount:values.length,average:round(average(values),1),minimum:Math.min.apply(Math,values),maximum:Math.max.apply(Math,values)}:{sampleCount:0,average:null,minimum:null,maximum:null};
  }
  function continuousDay(data,date){
    var source=row(data,'polarContinuousHr',date),samples=source&&Array.isArray(source.samples)?source.samples:[];
    var timed=samples.map(function(sample){return {heartRate:number(sample&&sample.heartRate),hour:sampleHour(sample&&sample.sampleTime,date)};}).filter(function(sample){return sample.heartRate!=null&&sample.hour!=null;});
    var all=sampleSummary(samples),daytime=sampleSummary(timed.filter(function(sample){return sample.hour>=7&&sample.hour<23;})),overnight=sampleSummary(timed.filter(function(sample){return sample.hour>=0&&sample.hour<7;}));
    var qualified=all.sampleCount>=3;
    return {status:qualified?'available':'insufficient',sampleCount:all.sampleCount,timestampedSampleCount:timed.length,
      all:qualified?all:{sampleCount:all.sampleCount,average:null,minimum:null,maximum:null},
      daytime:daytime.sampleCount>=3?daytime:{sampleCount:daytime.sampleCount,average:null,minimum:null,maximum:null},
      overnight:overnight.sampleCount>=3?overnight:{sampleCount:overnight.sampleCount,average:null,minimum:null,maximum:null},
      semanticLabel:'continuous_hr_context',missingData:qualified?[]:['qualifiedContinuousHrSamples']};
  }
  function continuous(data,date){
    var current=continuousDay(data,date),recent=[],previous=[];
    for(var i=1;i<=14;i+=1){var item=continuousDay(data,addDays(date,-i)),value=item.daytime.average;if(value!=null)(i<=7?recent:previous).push(value);}
    var change=recent.length>=TREND_MINIMUM&&previous.length>=TREND_MINIMUM?deviation(average(recent),average(previous)):null;
    return Object.assign(current,{trend:{qualified:change!=null,recentSampleSize:recent.length,previousSampleSize:previous.length,recentMean:round(average(recent),1),previousMean:round(average(previous),1),changePercent:change,direction:direction(change,5)}});
  }
  function durationMinutes(value){
    if(value==null||value==='')return null;if(typeof value==='number')return value>10000?value/60:value;
    var raw=String(value),iso=raw.match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);if(iso)return Number(iso[1]||0)*60+Number(iso[2]||0)+Number(iso[3]||0)/60;
    var match=raw.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);return match?Number(match[1]||0)*60+Number(match[2])+Number(match[3])/60:null;
  }
  function activityMetrics(source){source=source||{};return {steps:firstNumber(source.steps),activeMinutes:firstNumber(source.activeMinutes,durationMinutes(source.activeDuration)),inactiveMinutes:firstNumber(source.inactiveMinutes,durationMinutes(source.inactiveDuration)),activeCalories:firstNumber(source.activeCalories,source.activeCal),totalCalories:firstNumber(source.totalCalories),distanceFromSteps:firstNumber(source.distanceFromSteps),inactivityAlertCount:firstNumber(source.inactivityAlertCount),dailyActivity:firstNumber(source.dailyActivity)};}
  function activity(data,date){
    var current=activityMetrics(row(data,'polarActivity',date)),metric=current.steps!=null?'steps':current.activeCalories!=null?'activeCalories':current.activeMinutes!=null?'activeMinutes':null;
    var history=metric?valuesBefore(data,'polarActivity',date,14,function(source){return activityMetrics(source)[metric];}):[],base=baseline(history),change=metric&&base.qualified?deviation(current[metric],base.mean):null;
    var classification=change==null?'insufficient':change>=35?'unusually_high':change<=-35?'unusually_low':'usual';
    return {status:metric?'available':'insufficient',metrics:current,baselineMetric:metric,baseline:base,changePercent:change,classification:classification,
      conservative:classification==='unusually_high',promotionAllowed:false,missingData:metric?base.qualified?[]:['activityPersonalBaseline']:['polarActivity']};
  }
  function nightlyMetrics(source){source=source||{};return {hrv:firstNumber(source.heartRateVariabilityAvg),nightHr:firstNumber(source.heartRateAvg),breathingRate:firstNumber(source.breathingRateAvg),ansCharge:signedNumber(source.ansCharge),ansChargeStatus:signedNumber(source.ansChargeStatus),nightlyRechargeStatus:signedNumber(source.nightlyRechargeStatus),hrvSampleCount:source.hrvSamples&&typeof source.hrvSamples==='object'?Object.keys(source.hrvSamples).length:0,breathingSampleCount:source.breathingSamples&&typeof source.breathingSamples==='object'?Object.keys(source.breathingSamples).length:0};}
  function metricBaseline(data,date,key){var values=valuesBefore(data,'polarNightlyRecharge',date,14,function(source){return nightlyMetrics(source)[key];}),base=baseline(values),current=nightlyMetrics(row(data,'polarNightlyRecharge',date))[key];return Object.assign(base,{current:current,deviationPercent:base.qualified?deviation(current,base.mean):null});}
  function nightly(data,date){
    var metrics=nightlyMetrics(row(data,'polarNightlyRecharge',date)),comparisons={hrv:metricBaseline(data,date,'hrv'),nightHr:metricBaseline(data,date,'nightHr'),breathingRate:metricBaseline(data,date,'breathingRate')};
    var negative=[],positive=[];
    if(comparisons.hrv.deviationPercent<=-12)negative.push('hrv_low');else if(comparisons.hrv.deviationPercent>=12)positive.push('hrv_high');
    if(comparisons.nightHr.deviationPercent>=8)negative.push('night_hr_high');else if(comparisons.nightHr.deviationPercent<=-8)positive.push('night_hr_low');
    if(comparisons.breathingRate.deviationPercent!=null&&Math.abs(comparisons.breathingRate.deviationPercent)>=8)negative.push('breathing_changed');
    if(metrics.ansChargeStatus!=null&&metrics.ansChargeStatus<0)negative.push('ans_status_low');else if(metrics.ansChargeStatus!=null&&metrics.ansChargeStatus>0)positive.push('ans_status_high');
    if(metrics.nightlyRechargeStatus!=null&&metrics.nightlyRechargeStatus<=2)negative.push('nightly_recharge_low');else if(metrics.nightlyRechargeStatus!=null&&metrics.nightlyRechargeStatus>=5)positive.push('nightly_recharge_high');
    var history=valuesBefore(data,'polarNightlyRecharge',date,14,function(source){return nightlyMetrics(source).hrv;}),spread=history.length>=BASELINE_MINIMUM?standardDeviation(history):null,mean=average(history);
    return {status:Object.keys(metrics).some(function(key){return metrics[key]!=null&&metrics[key]!==0;})?'available':'insufficient',metrics:metrics,comparisons:comparisons,
      stability:spread==null||mean==null?{qualified:false,direction:'insufficient'}:{qualified:true,coefficientOfVariationPercent:round(spread/mean*100,1),direction:spread/mean>=0.2?'volatile':'stable'},
      evidenceDirection:negative.length?'negative':positive.length?'positive':'neutral',negativeSignals:negative,positiveSignals:positive,overlapGroup:'nightly_recovery',domainWeight:1};
  }
  function loadMetrics(source){source=source||{};var strain=firstNumber(source.strain),tolerance=firstNumber(source.tolerance);return {cardioLoad:firstNumber(source.cardioLoad,source.load),strain:strain,tolerance:tolerance,ratio:firstNumber(source.cardioLoadRatio,source.ratio,strain!=null&&tolerance>0?strain/tolerance:null),status:text(source.cardioLoadStatus||source.loadStatus||source.status)};}
  function loadSeries(data,date,key,start,end){var values=[];for(var i=start;i<=end;i+=1){var value=loadMetrics(row(data,'polarCardioLoad',addDays(date,-i)))[key];if(value!=null)values.push(value);}return values;}
  function trajectory(data,date,key){var recent=loadSeries(data,date,key,1,7),previous=loadSeries(data,date,key,8,14),change=recent.length>=TREND_MINIMUM&&previous.length>=TREND_MINIMUM?deviation(average(recent),average(previous)):null;return {qualified:change!=null,recentSampleSize:recent.length,previousSampleSize:previous.length,recentMean:round(average(recent),1),previousMean:round(average(previous),1),changePercent:change,direction:direction(change,8)};}
  function cardioLoad(data,date){
    var metrics=loadMetrics(row(data,'polarCardioLoad',date)),trajectories={cardioLoad:trajectory(data,date,'cardioLoad'),strain:trajectory(data,date,'strain'),tolerance:trajectory(data,date,'tolerance'),ratio:trajectory(data,date,'ratio')};
    var conservative=metrics.ratio!=null&&metrics.ratio>=1.3||trajectories.strain.direction==='rising'&&trajectories.tolerance.direction!=='rising';
    return {status:metrics.cardioLoad!=null||metrics.ratio!=null?'available':'insufficient',metrics:metrics,trajectories:trajectories,conservative:conservative,promotionAllowed:false};
  }
  function resolveSleep(data,date,options){var api=options&&options.sleepIntelligence||defaultSleepApi;try{return api&&typeof api.analyze==='function'?api.analyze(data,date):null;}catch(error){return null;}}
  function sleep(data,date,options){var result=resolveSleep(data,date,options)||{},daily=result.daily||{},trends=result.trends||{};return {status:result.status||'insufficient',daily:{actualSleepMinutes:firstNumber(daily.actualSleepMinutes),timeInBedMinutes:firstNumber(daily.timeInBedMinutes),sleepEfficiency:firstNumber(daily.sleepEfficiency),sleepDebtMinutes:firstNumber(daily.sleepDebtMinutes),sleepConsistency:daily.sleepConsistency||null,sleepStages:daily.sleepStages||null},trends:{sevenDay:trends.sevenDay||null,fourteenDay:trends.fourteenDay||null,thirtyDay:trends.thirtyDay||null},semanticRule:'actual_sleep_is_not_time_in_bed'};}
  function compact(result){
    var items=[],activityResult=result.activity,load=result.cardioLoad,night=result.nightly,continuousResult=result.continuousHr,sleepResult=result.sleep;
    if(activityResult.classification==='unusually_high')items.push('Günlük aktivite kişisel yakın döneminin belirgin üzerinde.');else if(activityResult.classification==='unusually_low')items.push('Günlük aktivite kişisel yakın döneminin belirgin altında; bu durum daha ağır antrenmanı desteklemez.');
    if(load.trajectories.strain.qualified)items.push('Cardio Load strain eğilimi: '+({rising:'yükseliyor',falling:'düşüyor',stable:'dengeli'}[load.trajectories.strain.direction]||'yetersiz')+'.');
    if(night.evidenceDirection==='negative')items.push('ANS/gece sinyalleri kişisel baseline karşısında temkinli bağlam veriyor.');
    if(continuousResult.daytime.average!=null)items.push('Gün içi continuous HR '+continuousResult.daytime.average+' bpm; dinlenik nabız değildir.');
    var trend=sleepResult.trends&&sleepResult.trends.fourteenDay;if(trend&&trend.status==='available')items.push('14 günlük gerçek uyku ortalaması '+Math.round(trend.averages.actualSleepMinutes/6)/10+' saat.');
    return items.slice(0,4);
  }
  function analyze(data,date,options){
    data=data||{};if(!validDate(date))return {schemaVersion:VERSION,status:'insufficient',date:null,negativeDomains:[],positiveDomains:[],compact:[]};
    var result={schemaVersion:VERSION,status:'available',date:date,continuousHr:continuous(data,date),activity:activity(data,date),nightly:nightly(data,date),sleep:sleep(data,date,options),cardioLoad:cardioLoad(data,date),negativeDomains:[],positiveDomains:[]};
    if(result.activity.conservative)result.negativeDomains.push('activity');
    if(result.nightly.evidenceDirection==='negative')result.negativeDomains.push('nightly');else if(result.nightly.evidenceDirection==='positive')result.positiveDomains.push('nightly');
    if(result.sleep.daily.sleepDebtMinutes>=90)result.negativeDomains.push('sleep');
    if(result.cardioLoad.conservative)result.negativeDomains.push('cardio_load');
    if(result.activity.classification==='usual')result.positiveDomains.push('activity_normal');
    result.compact=compact(result);return result;
  }
  function resolve(date,options){options=options||{};var data=options.data;try{if(!data&&root)data=typeof root.simurgGetData==='function'?root.simurgGetData():root.DATA;}catch(error){}return analyze(data||{},date,options);}

  return {VERSION:VERSION,analyze:analyze,resolve:resolve};
});
