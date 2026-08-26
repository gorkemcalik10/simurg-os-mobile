(function(root,factory){
  'use strict';
  var sleepApi=root&&root.SimurgSleepIntelligence;
  if(typeof module==='object'&&module.exports)sleepApi=require('./simurg-sleep-intelligence.js');
  var api=factory(sleepApi,root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgDailyGuidance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(sleepApi,root){
  'use strict';

  var VERSION=1;
  var HISTORY_WINDOW_DAYS=21;
  var MINIMUM_HISTORY=7;

  function number(value){
    if(value===null||value===undefined||value==='')return null;
    var parsed=Number(value);
    return Number.isFinite(parsed)?parsed:null;
  }
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
  function addDays(date,amount){var value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+amount);return value.toISOString().slice(0,10);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function roundTo(value,step){return Math.round(value/step)*step;}
  function average(values){return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function median(values){
    if(!values.length)return null;
    var sorted=values.slice().sort(function(a,b){return a-b;}),middle=Math.floor(sorted.length/2);
    return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
  }
  function deviation(values){
    var mean=average(values);
    return mean==null?null:Math.sqrt(values.reduce(function(sum,value){return sum+Math.pow(value-mean,2);},0)/values.length);
  }
  function unique(values){return values.filter(function(value,index){return value&&values.indexOf(value)===index;});}
  function list(value){return Array.isArray(value)?value:[];}
  function sleepDaily(data,date){
    if(!sleepApi)return null;
    try{
      if(typeof sleepApi.daily==='function')return sleepApi.daily(data,date);
      if(typeof sleepApi.analyze==='function'){var result=sleepApi.analyze(data,date);return result&&result.daily||null;}
    }catch(error){}
    return null;
  }
  function historicalSleep(data,date){
    var start=addDays(date,-HISTORY_WINDOW_DAYS);
    return Object.keys(data&&data.polarSleep&&data.polarSleep.daily||{}).filter(function(itemDate){
      return validDate(itemDate)&&itemDate>=start&&itemDate<date;
    }).sort().map(function(itemDate){return sleepDaily(data,itemDate);}).filter(function(day){
      return day&&day.status==='available'&&number(day.actualSleepMinutes)!=null;
    });
  }
  function sleepNeed(data,date,coachDecision){
    var current=sleepDaily(data,date),actual=number(current&&current.actualSleepMinutes),history=historicalSleep(data,date),actualHistory=history.map(function(day){return number(day.actualSleepMinutes);}).filter(function(value){return value!=null;});
    var base={
      status:'insufficient',date:date,actualSleepMinutes:actual,personalizedNeedMinutes:null,
      shortfallMinutes:null,shortfallRangeMinutes:null,historySampleSize:actualHistory.length,
      minimumHistory:MINIMUM_HISTORY,historyWindowDays:HISTORY_WINDOW_DAYS,uncertaintyMinutes:null,
      contextAdjustmentMinutes:0,reasons:[],message:'Kişisel uyku ihtiyacı için yeterli geçmiş henüz yok.'
    };
    if(actualHistory.length<MINIMUM_HISTORY){
      base.reasons.push('Kişisel tahmin için en az yedi önceki geçerli uyku gecesi gerekli.');
      if(actual==null)base.message='Gerçek uyku ve kişisel geçmiş verisi bekleniyor.';
      return base;
    }
    if(actual==null){
      base.reasons.push('Seçili tarih için gerçek uyku süresi mevcut değil.');
      base.message='Kişisel geçmiş hazır; seçili günün gerçek uyku verisi bekleniyor.';
      return base;
    }
    var personalBaseline=median(actualHistory),goal=number(current&&current.sleepGoalMinutes),target=personalBaseline;
    if(goal!=null&&goal>=240&&goal<=720)target=Math.max(target,clamp(goal,personalBaseline-30,personalBaseline+45));
    var recentDebt=history.slice(-3).map(function(day){return number(day.sleepDebtMinutes);}).filter(function(value){return value!=null;});
    var repeatedDebt=recentDebt.length>=2&&average(recentDebt)>=45;
    var calibration=coachDecision&&coachDecision.personalCalibration||{},repeated=list(calibration.repeatedNegativeDomains),negative=list(calibration.negativeDomains),evidence=coachDecision&&coachDecision.decisionEvidence||{},evidenceNegative=list(evidence.negativeDomains);
    var repeatedLoadRecovery=repeated.some(function(domain){return domain==='load'||domain==='recovery';});
    var currentLoadRecovery=negative.some(function(domain){return domain==='load'||domain==='recovery';})||evidenceNegative.some(function(domain){return domain==='load'||domain==='recovery'||domain==='training_history'||domain==='polar_activity';});
    var adjustment=0;
    if(repeatedDebt){adjustment+=15;base.reasons.push('Son gecelerdeki mevcut uyku açığı küçük bir destek payı ekledi.');}
    if(repeatedLoadRecovery){adjustment+=15;base.reasons.push('Tekrarlanan yük veya toparlanma örüntüsü küçük bir destek payı ekledi.');}
    else if(currentLoadRecovery){adjustment+=15;base.reasons.push('Mevcut yük veya toparlanma bağlamı küçük bir destek payı ekledi.');}
    adjustment=Math.min(30,adjustment);
    target=roundTo(clamp(target+adjustment,360,Math.min(600,personalBaseline+45)),15);
    var uncertainty=deviation(actualHistory)>60?30:15,shortfall=Math.max(0,target-actual),lower=Math.max(0,roundTo(shortfall-uncertainty,15)),upper=Math.max(lower,roundTo(shortfall+uncertainty,15));
    base.status='personalized';
    base.personalizedNeedMinutes=target;
    base.shortfallMinutes=roundTo(shortfall,15);
    base.shortfallRangeMinutes={min:lower,max:upper};
    base.uncertaintyMinutes=uncertainty;
    base.contextAdjustmentMinutes=adjustment;
    if(!base.reasons.length)base.reasons.push('Tahmin son 21 gündeki kişisel gerçek uyku geçmişine dayanıyor.');
    if(upper<=15)base.message='Bugünkü kişisel uyku ihtiyacını yaklaşık karşıladın.';
    else if(lower===upper)base.message='Bugünkü uyku ihtiyacının yaklaşık '+upper+' dk altındasın.';
    else base.message='Bugünkü uyku ihtiyacının yaklaşık '+lower+'–'+upper+' dk altındasın.';
    return base;
  }
  function trainingTarget(coachDecision){
    if(!coachDecision||coachDecision.type!=='pre_workout')return {status:'insufficient',decision:null,title:'Koç kararı bekleniyor',reason:'Canonical pre-workout kararı henüz mevcut değil.'};
    var decision=coachDecision.trainingDecision,calibration=coachDecision.personalCalibration||{},titles={
      normal:'Mevcut hedefi koru',controlled:'İlk setlere kontrollü başla',reduce:'Bugün hacmi biraz azalt',recovery:'Toparlanma odaklı gün',rest:'Bugün dinlen'
    },title=titles[decision]||'Mevcut hedefi koru';
    if(decision==='progress')title=calibration.progressionSupport===true?'Yalnızca onaylı mütevazı ilerlemeyi uygula':'Mevcut hedefi koru';
    var reasons=list(calibration.reasons).concat(list(coachDecision.warnings),list(coachDecision.keyDrivers)).filter(Boolean);
    return {status:'available',decision:decision,title:title,reason:reasons[0]||coachDecision.workoutGuidance&&coachDecision.workoutGuidance.mainLifts||coachDecision.summary||'Canonical Coach kararı uygulandı.'};
  }
  function analyze(data,date,options){
    options=options||{};data=data||{};
    if(!validDate(date))throw new Error('SimurgDailyGuidance date must use YYYY-MM-DD.');
    var coachDecision=options.coachDecision||null,target=trainingTarget(coachDecision),sleep=sleepNeed(data,date,coachDecision),reasons=unique([target.reason].concat(sleep.reasons)).slice(0,2);
    return {schemaVersion:VERSION,date:date,status:target.status==='available'?'available':'insufficient',decisionSource:'SimurgCoachClient.resolveDecision/pre_workout',trainingTarget:target,sleepNeed:sleep,reasons:reasons};
  }
  function resolve(date,options){
    options=options||{};var data=options.data;
    try{if(!data&&root)data=typeof root.simurgGetData==='function'?root.simurgGetData():root.DATA;}catch(error){}
    var coachDecision=options.coachDecision||null;
    try{if(!coachDecision&&root&&root.SimurgCoachClient&&typeof root.SimurgCoachClient.resolveDecision==='function')coachDecision=root.SimurgCoachClient.resolveDecision(date,{data:data||{},store:false,engineOptions:{deferTechnical:true}});}catch(error){}
    return analyze(data||{},date,Object.assign({},options,{coachDecision:coachDecision}));
  }

  return Object.freeze({VERSION:VERSION,HISTORY_WINDOW_DAYS:HISTORY_WINDOW_DAYS,MINIMUM_HISTORY:MINIMUM_HISTORY,analyze:analyze,resolve:resolve,sleepNeed:sleepNeed,trainingTarget:trainingTarget});
});
