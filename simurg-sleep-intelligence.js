(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgSleepIntelligence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var VERSION=1;
  var BASELINE_MINIMUM=5;

  function number(value){
    var parsed=Number(value);
    return value!==null&&value!==''&&Number.isFinite(parsed)?parsed:null;
  }
  function firstNumber(){
    for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}
    return null;
  }
  function firstValue(){
    for(var i=0;i<arguments.length;i+=1){if(arguments[i]!==null&&arguments[i]!==undefined&&arguments[i]!=='')return arguments[i];}
    return null;
  }
  function round(value,digits){
    if(value==null)return null;
    var factor=Math.pow(10,digits||0);
    return Math.round(value*factor)/factor;
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function average(values){
    values=(values||[]).filter(function(value){return value!=null;});
    return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;
  }
  function standardDeviation(values){
    var mean=average(values);
    if(mean==null)return null;
    return Math.sqrt(values.reduce(function(sum,value){return sum+Math.pow(value-mean,2);},0)/values.length);
  }
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;}
  function addDays(date,amount){
    var value=new Date(date+'T12:00:00Z');
    value.setUTCDate(value.getUTCDate()+amount);
    return value.toISOString().slice(0,10);
  }
  function raw(row){return row&&row.raw&&typeof row.raw==='object'&&!Array.isArray(row.raw)?row.raw:{};}
  function sleepStore(data){return data&&data.polarSleep&&data.polarSleep.daily||{};}
  function sleepRow(data,date){
    var value=sleepStore(data)[date];
    return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
  }
  function nightlyRow(data,date){
    var value=data&&data.polarNightlyRecharge&&data.polarNightlyRecharge.daily&&data.polarNightlyRecharge.daily[date];
    return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
  }
  function continuousHrRow(data,date){
    var value=data&&data.polarContinuousHr&&data.polarContinuousHr.daily&&data.polarContinuousHr.daily[date];
    return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
  }
  function seconds(value){value=number(value);return value!=null&&value>=0?value:null;}
  function stageSeconds(row,key){
    var source=raw(row),camel=key+'Sleep',snake=key+'_sleep',minutes=key+'SleepMinutes';
    return firstNumber(row&&row[camel],source[snake],source[snake.replace('_','-')],number(row&&row[minutes])==null?null:number(row[minutes])*60);
  }
  function timeValue(row,kind){
    var source=raw(row),start=kind==='start';
    return firstValue(
      row&&row[start?'startTime':'endTime'],
      row&&row[start?'sleepStartTime':'sleepEndTime'],
      source[start?'sleep_start_time':'sleep_end_time'],
      source[start?'sleep-start-time':'sleep-end-time']
    );
  }
  function timeInBedSeconds(row){
    var explicit=firstNumber(row&&row.timeInBedSeconds);
    if(explicit!=null)return explicit;
    var start=timeValue(row,'start'),end=timeValue(row,'end'),startMs=start?Date.parse(String(start)):NaN,endMs=end?Date.parse(String(end)):NaN;
    if(Number.isFinite(startMs)&&Number.isFinite(endMs)&&endMs>=startMs)return Math.round((endMs-startMs)/1000);
    return null;
  }
  function actualSleepSeconds(row){
    var deep=stageSeconds(row,'deep'),rem=stageSeconds(row,'rem'),light=stageSeconds(row,'light');
    return deep==null||rem==null||light==null?null:deep+rem+light;
  }
  function goalMinutes(data,row){
    var source=raw(row),profile=data&&data.polarProfile&&data.polarProfile.latest||{};
    var value=firstNumber(row&&row.sleepGoal,source.sleep_goal,source['sleep-goal'],profile.sleepGoal);
    if(value==null||value<=0)return null;
    if(value<=24)return round(value*60,1);
    if(value>1440)return round(value/60,1);
    return round(value,1);
  }
  function clockMinutes(value,wrapAfterNoon){
    var match=String(value||'').match(/T?(\d{2}):(\d{2})/);
    if(!match)return null;
    var minutes=Number(match[1])*60+Number(match[2]);
    if(wrapAfterNoon&&minutes<720)minutes+=1440;
    return minutes;
  }
  function stageObject(minutes,actualMinutes,inBedMinutes){
    return {
      minutes:round(minutes,1),
      percentageOfActualSleep:minutes==null||actualMinutes<=0?null:round(minutes/actualMinutes*100,1),
      percentageOfTimeInBed:minutes==null||inBedMinutes<=0?null:round(minutes/inBedMinutes*100,1)
    };
  }
  function interruptionFacts(row,inBedMinutes){
    var source=raw(row);
    var awakeSeconds=firstNumber(
      row&&row.awakeTime,
      source.awake_time,
      source['awake-time'],
      row&&row.interruptions,
      source.total_interruption_duration,
      source['total-interruption-duration']
    );
    var count=firstNumber(
      row&&row.interruptionCount,
      row&&row.totalInterruptionCount,
      source.interruption_count,
      source.total_interruption_count
    );
    var shortSeconds=firstNumber(row&&row.shortInterruptionDuration,source.short_interruption_duration,source['short-interruption-duration']);
    var longSeconds=firstNumber(row&&row.longInterruptionDuration,source.long_interruption_duration,source['long-interruption-duration']);
    var classification=firstValue(row&&row.interruptionSeverity,source.interruption_severity,source.interruption_classification);
    var awakeMinutes=awakeSeconds==null?null:awakeSeconds/60;
    return {
      awakeDurationMinutes:round(awakeMinutes,1),
      interruptionCount:count==null?null:Math.round(count),
      severity:{
        classification:classification==null?null:String(classification),
        shortDurationMinutes:round(shortSeconds==null?null:shortSeconds/60,1),
        longDurationMinutes:round(longSeconds==null?null:longSeconds/60,1)
      },
      percentageOfTimeInBed:awakeMinutes==null||inBedMinutes<=0?null:round(awakeMinutes/inBedMinutes*100,1)
    };
  }
  function allDates(data,endDate,windowDays,excludeEnd){
    var start=addDays(endDate,-windowDays+(excludeEnd?0:1));
    return Object.keys(sleepStore(data)).filter(function(date){
      return dateValue(date)&&date>=start&&(excludeEnd?date<endDate:date<=endDate);
    }).sort();
  }
  function baselineComparison(data,date,currentStages){
    var dates=allDates(data,date,14,true),rows=[];
    dates.forEach(function(itemDate){
      var row=sleepRow(data,itemDate),deep=stageSeconds(row,'deep'),rem=stageSeconds(row,'rem'),light=stageSeconds(row,'light');
      if(deep!=null&&rem!=null&&light!=null)rows.push({deep:deep/60,rem:rem/60,light:light/60});
    });
    if(rows.length<BASELINE_MINIMUM)return null;
    function compare(key){
      var baseline=average(rows.map(function(row){return row[key];})),current=currentStages[key].minutes;
      return {currentMinutes:current,baselineMinutes:round(baseline,1),differenceMinutes:current==null?null:round(current-baseline,1)};
    }
    return {windowDays:14,sampleSize:rows.length,deep:compare('deep'),rem:compare('rem'),light:compare('light')};
  }
  function consistency(data,date,windowDays){
    var starts=[],ends=[];
    allDates(data,date,windowDays,false).forEach(function(itemDate){
      var row=sleepRow(data,itemDate),start=clockMinutes(timeValue(row,'start'),true),end=clockMinutes(timeValue(row,'end'),false);
      if(start!=null&&end!=null){starts.push(start);ends.push(end);}
    });
    if(starts.length<BASELINE_MINIMUM)return null;
    var startVariance=standardDeviation(starts),endVariance=standardDeviation(ends),combined=(startVariance+endVariance)/2;
    return {
      score:Math.round(clamp(100-combined/120*100,0,100)),
      sampleSize:starts.length,
      windowDays:windowDays,
      sleepStartStandardDeviationMinutes:round(startVariance,1),
      sleepEndStandardDeviationMinutes:round(endVariance,1)
    };
  }
  function confidenceForDaily(facts){
    if(facts.status==='insufficient'){
      return {level:'insufficient',score:0,reasons:['Actual sleep ve time in bed birlikte mevcut ve tutarlı değil.']};
    }
    var score=50,reasons=['Actual sleep ve time in bed doğrudan Polar uyku alanlarından hesaplandı.'];
    if(facts.interruptions.awakeDurationMinutes!=null){score+=10;reasons.push('Polar awake/interruption süresi mevcut.');}
    if(facts.sleepGoalMinutes!=null){score+=10;reasons.push('Polar sleep goal mevcut.');}
    if(facts.sleepConsistency!=null){score+=15;reasons.push('En az beş gecelik uyku zamanlaması mevcut.');}
    if(facts.sleepStages.baselineComparison!=null){score+=15;reasons.push('Evreler için kişisel baseline mevcut.');}
    return {level:score>=85?'high':score>=65?'medium':'low',score:score,reasons:reasons};
  }
  function dailyFacts(data,date){
    var row=sleepRow(data,date),missing=[];
    if(!row){
      return {
        date:date,status:'insufficient',actualSleepMinutes:null,timeInBedMinutes:null,sleepEfficiency:null,sleepDebtMinutes:null,sleepGoalMinutes:null,
        sleepConsistency:null,sleepStages:null,interruptions:null,
        confidence:{level:'insufficient',score:0,reasons:['Seçili tarih için Polar sleep kaydı yok.']},
        missingData:['polarSleep']
      };
    }
    var inBedSeconds=timeInBedSeconds(row),actualSeconds=actualSleepSeconds(row),inBedMinutes=inBedSeconds==null?null:inBedSeconds/60,actualMinutes=actualSeconds==null?null:actualSeconds/60;
    var deepMinutes=stageSeconds(row,'deep'),remMinutes=stageSeconds(row,'rem'),lightMinutes=stageSeconds(row,'light');
    deepMinutes=deepMinutes==null?null:deepMinutes/60;remMinutes=remMinutes==null?null:remMinutes/60;lightMinutes=lightMinutes==null?null:lightMinutes/60;
    var durationsConsistent=actualMinutes!=null&&inBedMinutes!=null&&inBedMinutes>0&&actualMinutes<=inBedMinutes;
    var interruptions=interruptionFacts(row,inBedMinutes),goal=goalMinutes(data,row),sleepConsistency=consistency(data,date,14);
    var stages={
      deep:stageObject(deepMinutes,actualMinutes,inBedMinutes),
      rem:stageObject(remMinutes,actualMinutes,inBedMinutes),
      light:stageObject(lightMinutes,actualMinutes,inBedMinutes),
      awake:stageObject(interruptions.awakeDurationMinutes,null,inBedMinutes),
      baselineComparison:null
    };
    stages.baselineComparison=baselineComparison(data,date,stages);
    if(actualMinutes==null)missing.push('sleepStages.deep/rem/light');
    if(inBedMinutes==null)missing.push('sleepStart/sleepEnd');
    if(actualMinutes!=null&&inBedMinutes!=null&&!durationsConsistent)missing.push('sleepDurationConsistency');
    if(interruptions.awakeDurationMinutes==null)missing.push('awakeDuration');
    if(interruptions.interruptionCount==null)missing.push('interruptionCount');
    if(goal==null)missing.push('sleepGoal');
    if(sleepConsistency==null)missing.push('sleepConsistencyBaseline');
    if(stages.baselineComparison==null)missing.push('sleepStageBaseline');
    var facts={
      date:date,
      status:durationsConsistent?'available':'insufficient',
      actualSleepMinutes:round(actualMinutes,1),
      timeInBedMinutes:round(inBedMinutes,1),
      sleepEfficiency:durationsConsistent?round(actualMinutes/inBedMinutes*100,1):null,
      sleepDebtMinutes:goal==null||!durationsConsistent?null:round(Math.max(0,goal-actualMinutes),1),
      sleepGoalMinutes:goal,
      sleepConsistency:sleepConsistency,
      sleepStages:stages,
      interruptions:interruptions,
      sources:{nightlyRecharge:!!nightlyRow(data,date),continuousHr:!!continuousHrRow(data,date)},
      confidence:null,
      missingData:missing
    };
    facts.confidence=confidenceForDaily(facts);
    return facts;
  }
  function trend(data,date,windowDays,minimumSamples){
    var days=allDates(data,date,windowDays,false).map(function(itemDate){return dailyFacts(data,itemDate);});
    var valid=days.filter(function(day){return day.status==='available';});
    if(valid.length<minimumSamples){
      return {
        windowDays:windowDays,status:'insufficient',sampleSize:valid.length,
        averages:null,sleepConsistency:null,
        confidence:{level:'insufficient',score:0,reasons:['Bu pencere için en az '+minimumSamples+' geçerli gece gerekli.']},
        missingData:['historicalSleepSamples']
      };
    }
    function mean(key){return round(average(valid.map(function(day){return day[key];})),1);}
    var timing=consistency(data,date,windowDays),coverage=valid.length/windowDays,score=Math.round(clamp(55+coverage*30+(timing?15:0),0,100));
    return {
      windowDays:windowDays,status:'available',sampleSize:valid.length,
      averages:{actualSleepMinutes:mean('actualSleepMinutes'),timeInBedMinutes:mean('timeInBedMinutes'),sleepEfficiency:mean('sleepEfficiency'),sleepDebtMinutes:mean('sleepDebtMinutes')},
      sleepConsistency:timing,
      confidence:{level:score>=85?'high':score>=65?'medium':'low',score:score,reasons:['Pencerede '+valid.length+' geçerli Polar uyku gecesi mevcut.'+(timing?' Uyku zamanlaması hesaplanabildi.':'') ]},
      missingData:timing?[]:['sleepTimingSamples']
    };
  }
  function latestDate(data){var dates=Object.keys(sleepStore(data)).filter(dateValue).sort();return dates.length?dates[dates.length-1]:null;}
  function analyze(data,date){
    data=data||{};date=dateValue(date)||latestDate(data);
    if(!date){
      return {schemaVersion:VERSION,status:'insufficient',date:null,confidence:{level:'insufficient',score:0,reasons:['Polar sleep geçmişi yok.']},daily:null,trends:null,missingData:['polarSleep']};
    }
    var daily=dailyFacts(data,date),trends={sevenDay:trend(data,date,7,4),fourteenDay:trend(data,date,14,7),thirtyDay:trend(data,date,30,14)};
    return {schemaVersion:VERSION,status:daily.status,date:date,confidence:daily.confidence,daily:daily,trends:trends,missingData:daily.missingData.slice()};
  }
  function resolve(date,options){
    options=options||{};var data=options.data;
    try{if(!data&&typeof window!=='undefined')data=typeof window.simurgGetData==='function'?window.simurgGetData():window.DATA;}catch(error){}
    return analyze(data||{},date);
  }

  return {VERSION:VERSION,analyze:analyze,resolve:resolve,daily:dailyFacts};
});
