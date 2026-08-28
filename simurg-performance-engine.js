(function(root,factory){
  'use strict';
  var sleep=root&&root.SimurgSleepIntelligence;
  var activity=root&&root.SimurgActivityClassification;
  if(typeof module==='object'&&module.exports){
    try{sleep=require('./simurg-sleep-intelligence.js');}catch(error){}
    try{activity=require('./simurg-activity-classification.js');}catch(error){}
  }
  var api=factory(root,sleep,activity);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPerformanceEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,SleepIntelligence,ActivityClassification){
  'use strict';

  var VERSION=2;
  var HISTORY_DAYS=365;
  var MINIMUM_BASELINE=10;
  var HIGH_BASELINE=20;
  var MIXED_ALPHA=0.30;

  function number(value){
    if(value===null||value===undefined||value===''||value===false)return null;
    var parsed=Number(value);return Number.isFinite(parsed)?parsed:null;
  }
  function firstNumber(){for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}return null;}
  function clean(value){return String(value==null?'':value).trim();}
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(clean(value))?clean(value):null;}
  function addDays(value,amount){var date=new Date(value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
  function clamp(value,minimum,maximum){return Math.max(minimum,Math.min(maximum,value));}
  function round(value,digits){if(value==null)return null;var factor=Math.pow(10,digits||0);return Math.round(value*factor)/factor;}
  function average(values){return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function confidence(sampleSize,broad){
    if(sampleSize<MINIMUM_BASELINE)return 'insufficient';
    if(broad)return sampleSize>=HIGH_BASELINE?'medium':'low';
    return sampleSize>=HIGH_BASELINE?'high':'medium';
  }
  function band(score){return score<20?'Çok kötü':score<40?'Kötü':score<60?'Orta':score<80?'İyi':'Çok iyi';}
  function resultInsufficient(date,reason,extra){
    return Object.assign({status:'insufficient',date:date||null,value:null,coachEligible:false,confidence:'insufficient',reason:reason,method:null,source:null,sampleCount:0},extra||{});
  }
  function percentile(value,history){
    if(value==null||!Array.isArray(history)||history.length<MINIMUM_BASELINE)return null;
    var lower=0,equal=0;
    history.forEach(function(item){if(item<value)lower+=1;else if(item===value)equal+=1;});
    return Math.round(clamp(100*(lower+0.5*equal)/history.length,0,100));
  }

  function rawObject(row){return row&&row.raw&&typeof row.raw==='object'&&!Array.isArray(row.raw)?row.raw:{};}
  function durationMinutes(row){
    var raw=rawObject(row),minutes=firstNumber(row&&row.durationMinutes,raw.durationMinutes,raw.duration_minutes);
    if(minutes==null){var seconds=firstNumber(row&&row.durationSeconds,raw.durationSeconds,raw.duration_seconds);if(seconds!=null)minutes=seconds/60;}
    if(minutes==null){
      var text=clean(row&&(row.duration||row.elapsedTime||row.trainingTime)||raw.duration);
      var parts=text.split(':').map(Number);
      if(parts.length===3&&parts.every(Number.isFinite))minutes=parts[0]*60+parts[1]+parts[2]/60;
      else if(parts.length===2&&parts.every(Number.isFinite))minutes=parts[0]*60+parts[1];
    }
    return minutes!=null&&minutes>=5&&minutes<=360?round(minutes,2):null;
  }
  function startMinute(row){
    var value=clean(row&&(row.startTime||row.start_time||row.startedAt||row.time)||rawObject(row).start_time),match=value.match(/(?:T|^)(\d{2}):(\d{2})/);
    return match?Number(match[1])*60+Number(match[2]):null;
  }
  function sharedSessionId(row){var raw=rawObject(row);return clean(row&&(row.sessionId||row.session_id)||raw.sessionId||raw.session_id);}
  function sessionKey(row,date){var id=sharedSessionId(row);return id?'session:'+id:'legacy:'+date;}
  function gymFamily(rows){
    var values=[];
    rows.forEach(function(row){
      var value=clean(row&&(row.sessionFamily||row.programKey||row.programId||row.program||row.bodyPart||row.category||row.classification));
      if(value&&values.indexOf(value.toLocaleLowerCase('tr-TR'))<0)values.push(value.toLocaleLowerCase('tr-TR'));
    });
    return values.length?values.sort().join('+'):null;
  }
  function gymSessionsForDate(data,date){
    var rows=list(data&&data.workouts).filter(function(row){return row&&row.date===date;}),groups=Object.create(null);
    rows.forEach(function(row){var key=sessionKey(row,date);(groups[key]=groups[key]||[]).push(row);});
    return Object.keys(groups).sort().map(function(key){
      var sessionRows=groups[key],working=sessionRows.filter(function(row){var sets=number(row&&row.sets);return sets!=null&&sets>0&&(clean(row&&row.exerciseId)||clean(row&&row.exercise));});
      if(!working.length)return {status:'insufficient',sessionId:key,reason:'no_qualified_working_sets',rows:sessionRows};
      var invalidRpe=working.some(function(row){var value=number(row&&row.rpe);return value==null||value<1||value>10;});
      if(invalidRpe)return {status:'insufficient',sessionId:key,reason:'missing_or_invalid_rpe',rows:sessionRows};
      var totalSets=working.reduce(function(sum,row){return sum+number(row.sets);},0);
      var sessionRpe=working.reduce(function(sum,row){return sum+number(row.rpe)*number(row.sets);},0)/totalSets;
      var durations=working.map(durationMinutes).filter(function(value){return value!=null;}),duration=null;
      if(durations.length){
        var minimum=Math.min.apply(null,durations),maximum=Math.max.apply(null,durations);
        if(maximum-minimum<=2)duration=average(durations);
      }
      return {
        status:'available',sessionId:key,rows:sessionRows,workingSetCount:round(totalSets,2),sessionRpe:round(sessionRpe,2),
        explicitSessionId:sharedSessionId(working[0])||null,
        durationMinutes:duration==null?null:round(duration,2),family:gymFamily(working),startMinute:startMinute(working[0]),
        durationRaw:duration==null?null:round(duration*sessionRpe,2),fallbackRaw:round(totalSets*sessionRpe,2)
      };
    });
  }
  function gymDay(data,date){
    var sessions=gymSessionsForDate(data,date);
    if(!sessions.length)return null;
    if(sessions.some(function(item){return item.status!=='available';}))return {status:'insufficient',date:date,sessions:sessions,reason:'incomplete_gym_session'};
    var durationBased=sessions.every(function(item){return item.durationMinutes!=null;}),method=durationBased?'session_rpe_x_duration':'working_sets_x_session_rpe';
    var raw=sessions.reduce(function(sum,item){return sum+(durationBased?item.durationRaw:item.fallbackRaw);},0);
    return {status:'available',date:date,method:method,raw:round(raw,2),sessions:sessions,sessionCount:sessions.length,sessionBucket:sessions.length>1?'2+':'1',family:sessions.map(function(item){return item.family;}).filter(Boolean).sort().join('|')||null};
  }
  function allGymDates(data){return Array.from(new Set(list(data&&data.workouts).map(function(row){return dateValue(row&&row.date);}).filter(Boolean))).sort();}
  function comparableGymHistory(data,date,current){
    var start=addDays(date,-HISTORY_DAYS),candidates=allGymDates(data).filter(function(item){return item>=start&&item<date;}).map(function(item){return gymDay(data,item);}).filter(function(day){return day&&day.status==='available'&&day.method===current.method&&day.sessionBucket===current.sessionBucket;});
    var exact=current.family?candidates.filter(function(day){return day.family===current.family;}):[];
    if(exact.length>=MINIMUM_BASELINE)return {days:exact,scope:'same_family',broad:false};
    return {days:candidates,scope:'broad_gym',broad:true};
  }

  function polarRows(data,date){return list(data&&data.polarWorkouts&&data.polarWorkouts.daily&&data.polarWorkouts.daily[date]).filter(function(row){return row&&(!dateValue(row.date)||row.date===date);});}
  function polarId(row){var raw=rawObject(row);return clean(row&&(row.polarExerciseId||row.exerciseId||row.polarId||row.id)||raw.exercise_id||raw.id);}
  function activityText(row){var raw=rawObject(row);return clean(row&&(row.workoutType||row.activityType||row.activityKey||row.sport||row.activityName||row.name||row.type)||raw.workoutType||raw.workout_type||raw.activityType||raw.activity_type||raw.activityKey||raw.sport||raw.activity||raw.name||raw.type);}
  function activityFamily(row){return ActivityClassification.key(activityText(row));}
  function strengthSession(row){return activityFamily(row)==='strength';}
  function workoutCardioLoad(row){var raw=rawObject(row),pro=raw.training_load_pro||raw['training-load-pro']||{};return firstNumber(row&&row.cardioLoad,pro.cardio_load,pro['cardio-load']);}
  function distinctPolarSessions(rows){
    var seen=Object.create(null),result=[];
    rows.forEach(function(row){
      var id=polarId(row),key=id?'id:'+id:['fallback',startMinute(row),durationMinutes(row),activityFamily(row)].join('|');
      if(seen[key])return;seen[key]=true;result.push(row);
    });
    return result;
  }
  function officialCardioRow(data,date){
    var row=data&&data.polarCardioLoad&&data.polarCardioLoad.daily&&data.polarCardioLoad.daily[date];
    if(Array.isArray(row))row=row[row.length-1];
    if(!row||dateValue(row.date)&&row.date!==date)return null;
    var value=firstNumber(row.cardioLoad,row.load);return value!=null&&value>=0?{row:row,value:value}:null;
  }
  function cardioDay(data,date){
    var gym=gymDay(data,date),all=distinctPolarSessions(polarRows(data,date)),cardio=all.filter(function(row){return !strengthSession(row);}),official=officialCardioRow(data,date);
    var loads=cardio.map(function(row){return {row:row,value:workoutCardioLoad(row)};}).filter(function(item){return item.value!=null&&item.value>=0;});
    var clearlyOfficial=!!(official&&((!gym&&cardio.length>0)||(gym&&cardio.length>0&&all.every(function(row){return !strengthSession(row);}))) );
    if(!gym&&official&&all.length===0)clearlyOfficial=official.value>0;
    var raw=null,method=null,source=null;
    if(clearlyOfficial){raw=official.value;method='official_exact_date_daily_cardio_load';source='Polar Cardio Load';}
    else if(cardio.length&&loads.length===cardio.length){raw=loads.reduce(function(sum,item){return sum+item.value;},0);method='sum_distinct_polar_session_cardio_load';source='Polar Workouts';}
    if(raw==null)return null;
    var families=Array.from(new Set(cardio.map(activityFamily))).sort(),count=cardio.length||(official&&number(official.row.sessionCount))||1;
    return {status:'available',date:date,raw:round(raw,3),method:method,source:source,sessionCount:count,sessionBucket:count>1?'2+':'1',family:families.length?families.join('+'):null,sessionIds:cardio.map(function(row){return polarId(row)||['fallback',startMinute(row),durationMinutes(row),activityFamily(row)].join('|');})};
  }
  function allCardioDates(data){
    var dates=Object.keys(data&&data.polarCardioLoad&&data.polarCardioLoad.daily||{}).concat(Object.keys(data&&data.polarWorkouts&&data.polarWorkouts.daily||{}));
    return Array.from(new Set(dates.map(dateValue).filter(Boolean))).sort();
  }
  function comparableCardioHistory(data,date,current){
    var start=addDays(date,-HISTORY_DAYS),candidates=allCardioDates(data).filter(function(item){return item>=start&&item<date;}).map(function(item){return cardioDay(data,item);}).filter(function(day){return day&&day.status==='available'&&day.sessionBucket===current.sessionBucket;});
    var exact=current.family?candidates.filter(function(day){return day.family===current.family;}):[];
    if(exact.length>=MINIMUM_BASELINE)return {days:exact,scope:'same_activity_family',broad:false};
    return {days:candidates,scope:'broad_cardio',broad:true};
  }
  function normalizedGym(data,date){
    var current=gymDay(data,date);if(!current)return resultInsufficient(date,'no_gym_session',{modality:'gym'});
    if(current.status!=='available')return resultInsufficient(date,current.reason,{modality:'gym',sessions:current.sessions});
    var baseline=comparableGymHistory(data,date,current),history=baseline.days.map(function(day){return day.raw;}),value=percentile(current.raw,history);
    if(value==null)return resultInsufficient(date,'sparse_comparable_gym_baseline',{modality:'gym',method:current.method,source:'Simurg Gym',rawValue:current.raw,sampleCount:history.length,baselineScope:baseline.scope,baselineDates:baseline.days.map(function(day){return day.date;}),sessions:current.sessions});
    return {status:'available',date:date,value:value,rawValue:current.raw,coachEligible:false,modality:'gym',method:current.method,source:'Simurg Gym',confidence:confidence(history.length,baseline.broad),sampleCount:history.length,baselineScope:baseline.scope,baselineDates:baseline.days.map(function(day){return day.date;}),historyWindowDays:HISTORY_DAYS,sessionCount:current.sessionCount,sessions:current.sessions};
  }
  function normalizedCardio(data,date){
    var current=cardioDay(data,date);if(!current)return resultInsufficient(date,'no_usable_exact_date_cardio_load',{modality:'cardio'});
    var baseline=comparableCardioHistory(data,date,current),history=baseline.days.map(function(day){return day.raw;}),value=percentile(current.raw,history);
    if(value==null)return resultInsufficient(date,'sparse_comparable_cardio_baseline',{modality:'cardio',method:current.method,source:current.source,rawValue:current.raw,sampleCount:history.length,baselineScope:baseline.scope,baselineDates:baseline.days.map(function(day){return day.date;}),sessionCount:current.sessionCount});
    return {status:'available',date:date,value:value,rawValue:current.raw,coachEligible:false,modality:'cardio',method:current.method,source:current.source,confidence:confidence(history.length,baseline.broad),sampleCount:history.length,baselineScope:baseline.scope,baselineDates:baseline.days.map(function(day){return day.date;}),historyWindowDays:HISTORY_DAYS,sessionCount:current.sessionCount,sessionIds:current.sessionIds};
  }
  function mixedLoad(gymValue,cardioValue){return Math.round(clamp(Math.max(gymValue,cardioValue)+MIXED_ALPHA*Math.min(gymValue,cardioValue),0,100));}
  function confidenceRank(value){return {insufficient:0,low:1,medium:2,high:3}[value]||0;}
  function lowerConfidence(a,b){return confidenceRank(a)<=confidenceRank(b)?a:b;}
  function timingRelation(gym,polar){
    var gymStart=gym.startMinute,polarStart=startMinute(polar),gymDuration=gym.durationMinutes,polarDuration=durationMinutes(polar);
    if(gymStart==null||polarStart==null)return {resolution:'ambiguous',method:'insufficient_timing_evidence'};
    var startDelta=Math.abs(gymStart-polarStart);
    if(gymDuration==null||polarDuration==null)return startDelta>=90?{resolution:'distinct',method:'clearly_separate_start_times',startDeltaMinutes:startDelta}:{resolution:'ambiguous',method:'insufficient_duration_evidence',startDeltaMinutes:startDelta};
    var gymEnd=gymStart+gymDuration,polarEnd=polarStart+polarDuration,overlap=Math.max(0,Math.min(gymEnd,polarEnd)-Math.max(gymStart,polarStart)),overlapRatio=overlap/Math.min(gymDuration,polarDuration),durationDelta=Math.abs(gymDuration-polarDuration),compatibleDuration=durationDelta<=Math.max(10,.25*Math.max(gymDuration,polarDuration));
    if(startDelta<=20&&overlapRatio>=.70&&compatibleDuration)return {resolution:'mirrored',method:'overlapping_time_and_duration',startDeltaMinutes:startDelta,durationDeltaMinutes:round(durationDelta,2),overlapRatio:round(overlapRatio,3)};
    if(overlap===0&&Math.max(gymStart,polarStart)-Math.min(gymEnd,polarEnd)>=15)return {resolution:'distinct',method:'non_overlapping_intervals',startDeltaMinutes:startDelta,durationDeltaMinutes:round(durationDelta,2),overlapRatio:0};
    if(overlapRatio<.25&&startDelta>=60)return {resolution:'distinct',method:'clearly_separate_intervals',startDeltaMinutes:startDelta,durationDeltaMinutes:round(durationDelta,2),overlapRatio:round(overlapRatio,3)};
    return {resolution:'ambiguous',method:'inconclusive_time_and_duration',startDeltaMinutes:startDelta,durationDeltaMinutes:round(durationDelta,2),overlapRatio:round(overlapRatio,3)};
  }
  function strengthSessionResolution(gymDayValue,polarStrengthRows){
    if(!gymDayValue||!polarStrengthRows.length)return {resolution:'not_applicable',matches:[],distinct:[],ambiguous:[]};
    var gyms=gymDayValue.sessions||[],matches=[],distinct=[],ambiguous=[];
    polarStrengthRows.forEach(function(polar){
      var polarSharedId=sharedSessionId(polar),polarLabel=polarId(polar)||['fallback',startMinute(polar),durationMinutes(polar),'strength'].join('|'),identityMatches=polarSharedId?gyms.filter(function(gym){return gym.explicitSessionId===polarSharedId;}):[];
      if(identityMatches.length===1){matches.push({polarSessionId:polarLabel,gymSessionId:identityMatches[0].sessionId,method:'shared_session_identity'});return;}
      if(identityMatches.length>1){ambiguous.push({polarSessionId:polarLabel,method:'non_unique_shared_session_identity'});return;}
      if(polarSharedId&&gyms.length&&gyms.every(function(gym){return !!gym.explicitSessionId;})){distinct.push({polarSessionId:polarLabel,method:'different_explicit_session_identity'});return;}
      var relations=gyms.map(function(gym){return {gym:gym,evidence:timingRelation(gym,polar)};}),mirrors=relations.filter(function(item){return item.evidence.resolution==='mirrored';});
      if(mirrors.length===1){matches.push(Object.assign({polarSessionId:polarLabel,gymSessionId:mirrors[0].gym.sessionId},mirrors[0].evidence));return;}
      if(mirrors.length>1){ambiguous.push({polarSessionId:polarLabel,method:'multiple_overlapping_gym_sessions'});return;}
      if(relations.length&&relations.every(function(item){return item.evidence.resolution==='distinct';})){distinct.push({polarSessionId:polarLabel,method:'timing_proves_distinct',evidence:relations.map(function(item){return item.evidence;})});return;}
      ambiguous.push({polarSessionId:polarLabel,method:'insufficient_identity_evidence',evidence:relations.map(function(item){return item.evidence;})});
    });
    return {resolution:ambiguous.length?'ambiguous':(distinct.length?'distinct':'mirrored'),matches:matches,distinct:distinct,ambiguous:ambiguous};
  }
  function deduplicationMetadata(data,date,gymDayValue){
    var official=officialCardioRow(data,date),strengthRows=distinctPolarSessions(polarRows(data,date)).filter(strengthSession),identity=strengthSessionResolution(gymDayValue,strengthRows);
    return {strengthPolarExcludedFromCardio:true,identityResolution:identity.resolution,identityMethod:'shared_identity_then_compatible_strength_time_overlap',mirroredStrengthSessions:identity.matches,distinctStrengthSessions:identity.distinct,ambiguousStrengthSessions:identity.ambiguous,polarStrengthSessionIds:strengthRows.map(function(row){return polarId(row)||['fallback',startMinute(row),durationMinutes(row),'strength'].join('|');}),officialDailyCardioLoadContext:official?official.value:null};
  }
  function actualLoad(data,date){
    date=dateValue(date);if(!date)return resultInsufficient(null,'invalid_date');
    var exactGym=gymDay(data,date),exactCardio=cardioDay(data,date),gym=normalizedGym(data,date),cardio=normalizedCardio(data,date),hasGym=gym.status==='available',hasCardio=cardio.status==='available',dedup=deduplicationMetadata(data,date,exactGym);
    if(exactGym&&dedup.identityResolution==='ambiguous')return resultInsufficient(date,'ambiguous_session_identity',{method:'shared_identity_then_compatible_strength_time_overlap',source:'Simurg Gym + Polar',components:{gym:gym,cardio:cardio},deduplication:dedup});
    if(exactGym&&dedup.identityResolution==='distinct')return resultInsufficient(date,'distinct_strength_session_load_unsupported',{method:'distinct_strength_sessions_preserved',source:'Simurg Gym + Polar',components:{gym:gym,cardio:cardio},deduplication:dedup});
    if(hasGym&&hasCardio)return {status:'available',date:date,value:mixedLoad(gym.value,cardio.value),coachEligible:false,modality:'mixed',method:'primary_plus_0.30_secondary_clamped',source:'Simurg Gym + Polar',confidence:lowerConfidence(gym.confidence,cardio.confidence),sampleCount:Math.min(gym.sampleCount,cardio.sampleCount),components:{gym:gym,cardio:cardio},deduplication:dedup};
    if(exactGym&&exactCardio)return resultInsufficient(date,'mixed_day_component_baseline_insufficient',{components:{gym:gym,cardio:cardio},deduplication:dedup});
    if(hasGym)return Object.assign({},gym,{components:{gym:gym,cardio:cardio},deduplication:dedup});
    if(hasCardio)return Object.assign({},cardio,{components:{gym:gym,cardio:cardio},deduplication:dedup});
    if(!exactGym&&!exactCardio)return resultInsufficient(date,'rest_day_no_completed_training',{components:{gym:gym,cardio:cardio}});
    return resultInsufficient(date,'actual_load_baseline_insufficient',{components:{gym:gym,cardio:cardio}});
  }

  function recoveryRow(data,date){var value=data&&data.polarNightlyRecharge&&data.polarNightlyRecharge.daily&&data.polarNightlyRecharge.daily[date];return Array.isArray(value)?value[value.length-1]:value;}
  function sleepCapacity(daily){
    if(!daily||daily.status!=='available'||daily.sleepGoalMinutes==null||daily.sleepGoalMinutes<=0||!daily.sleepConsistency||!daily.sleepStages||!daily.sleepStages.baselineComparison)return null;
    var actual=daily.actualSleepMinutes,goal=daily.sleepGoalMinutes,efficiency=daily.sleepEfficiency,consistency=daily.sleepConsistency.score,comparison=daily.sleepStages.baselineComparison;
    if(actual==null||efficiency==null||consistency==null)return null;
    var currentTotal=['deep','rem','light'].reduce(function(sum,key){return sum+(daily.sleepStages[key]&&daily.sleepStages[key].minutes||0);},0);
    var baselineTotal=['deep','rem','light'].reduce(function(sum,key){return sum+(comparison[key]&&comparison[key].baselineMinutes||0);},0);
    if(currentTotal<=0||baselineTotal<=0)return null;
    var meanDifference=average(['deep','rem','light'].map(function(key){return Math.abs(daily.sleepStages[key].minutes/currentTotal*100-comparison[key].baselineMinutes/baselineTotal*100);}));
    var stageScore=clamp(100-2*meanDifference,0,100),ratio=clamp(actual/goal,0,1);
    return {value:Math.round(clamp(0.35*100*ratio*ratio+0.20*100*ratio+0.25*efficiency+0.15*consistency+0.05*stageScore,0,100)),inputs:{actualSleepMinutes:actual,sleepGoalMinutes:goal,sleepEfficiency:efficiency,sleepConsistency:consistency,sleepStageBalance:round(stageScore,2)},source:{sleepGoalSource:daily.sleepGoalSource,sleepGoalEffectiveDate:daily.sleepGoalEffectiveDate,stageBaselineSampleCount:comparison.sampleSize,timingSampleCount:daily.sleepConsistency.sampleSize}};
  }
  function readiness(data,date,options){
    date=dateValue(date);if(!date)return resultInsufficient(null,'invalid_date');
    if(!SleepIntelligence||typeof SleepIntelligence.analyze!=='function')return resultInsufficient(date,'sleep_intelligence_unavailable');
    var sleep=SleepIntelligence.analyze(data||{},date,options||{}),capacity=sleepCapacity(sleep&&sleep.daily),night=recoveryRow(data,date),ans=firstNumber(night&&night.ansCharge,night&&night.ansChargeScore);
    if(!capacity||ans==null||ans<-10||ans>10)return resultInsufficient(date,!capacity?'sleep_capacity_insufficient':'exact_date_ans_charge_insufficient',{components:{sleepCapacity:capacity&&capacity.value||null,recovery:null},evidence:{nightlyRecharge:night||null}});
    var recovery=Math.round(clamp(50+5*ans,0,100)),value=Math.round(clamp(0.5625*capacity.value+0.4375*recovery,0,100));
    var status=clean(night&&night.ansChargeStatus||night&&night.nightlyRechargeStatus),hrv=firstNumber(night&&night.heartRateVariabilityAvg,night&&night.hrvMs,night&&night.hrv),nightHr=firstNumber(night&&night.heartRateAvg,night&&night.nightlyHR,night&&night.restingHr),level=status&&hrv!=null&&nightHr!=null?'high':'medium';
    return {status:'available',date:date,value:value,band:band(value),coachEligible:false,confidence:level,method:'0.5625_sleep_capacity_plus_0.4375_polar_ans_charge',source:'Simurg Sleep Intelligence + Polar ANS Charge',components:{sleepCapacity:capacity.value,recovery:recovery},metadata:{sleep:capacity.source,recovery:{ansCharge:ans,normalization:'50 + 5 × ansCharge'}},evidence:{ansChargeStatus:status||null,hrv:hrv,nightHr:nightHr,nightlyRecharge:night},sampleCount:Math.min(capacity.source.stageBaselineSampleCount,capacity.source.timingSampleCount)};
  }
  function loadFitScore(readinessValue,loadValue){
    var low=Math.max(0,readinessValue-10),high=Math.min(100,readinessValue+10),value;
    if(loadValue<low)value=100-0.75*(low-loadValue);else if(loadValue>high)value=100-3*(loadValue-high);else value=100;
    return {value:Math.round(clamp(value,0,100)),targetLow:low,targetHigh:high};
  }
  function loadFit(data,date,options){
    var ready=options&&options.readiness||readiness(data,date,options),load=options&&options.actualLoad||actualLoad(data,date);
    if(ready.status!=='available'||load.status!=='available')return resultInsufficient(date,load.reason==='ambiguous_session_identity'?'ambiguous_session_identity':'readiness_or_actual_load_insufficient',{readiness:ready,actualLoad:load});
    var score=loadFitScore(ready.value,load.value);
    return {status:'available',date:date,value:score.value,coachEligible:false,confidence:lowerConfidence(ready.confidence,load.confidence),sampleCount:load.sampleCount,method:'asymmetric_readiness_target_range',source:'Simurg Performance Engine',targetLow:score.targetLow,targetHigh:score.targetHigh,undershootPenaltyPerPoint:0.75,overshootPenaltyPerPoint:3,readinessValue:ready.value,actualLoadValue:load.value};
  }
  function dailyBalance(data,date,options){
    var ready=options&&options.readiness||readiness(data,date,options),load=options&&options.actualLoad||actualLoad(data,date),fit=options&&options.loadFit||loadFit(data,date,{readiness:ready,actualLoad:load});
    if(fit.status!=='available')return resultInsufficient(date,load.reason==='rest_day_no_completed_training'?'rest_day_no_post_training_score':(load.reason==='ambiguous_session_identity'?'ambiguous_session_identity':'load_fit_insufficient'),{readiness:ready,actualLoad:load,loadFit:fit});
    var value=Math.round(clamp(0.35*ready.value+0.65*fit.value,0,100));
    return {status:'available',date:date,value:value,band:band(value),coachEligible:false,confidence:lowerConfidence(ready.confidence,fit.confidence),sampleCount:fit.sampleCount,method:'0.35_readiness_plus_0.65_load_fit',source:'Simurg Performance Engine',components:{readiness:ready.value,loadFit:fit.value},actualLoadContext:load.value};
  }
  function analyze(data,date,options){
    var ready=readiness(data,date,options),load=actualLoad(data,date),fit=loadFit(data,date,{readiness:ready,actualLoad:load}),balance=dailyBalance(data,date,{readiness:ready,actualLoad:load,loadFit:fit});
    return {schemaVersion:VERSION,date:dateValue(date),status:ready.status==='available'?'available':'insufficient',coachEligible:false,readiness:ready,actualLoad:load,loadFit:fit,dailyBalance:balance};
  }
  function resolve(date,options){options=options||{};var data=options.data;try{if(!data&&root)data=typeof root.simurgGetData==='function'?root.simurgGetData():root.DATA;}catch(error){}return analyze(data||{},date,options);}

  return Object.freeze({VERSION:VERSION,HISTORY_DAYS:HISTORY_DAYS,MINIMUM_BASELINE:MINIMUM_BASELINE,HIGH_BASELINE:HIGH_BASELINE,MIXED_ALPHA:MIXED_ALPHA,percentile:percentile,mixedLoad:mixedLoad,loadFitScore:loadFitScore,readiness:readiness,actualLoad:actualLoad,loadFit:loadFit,dailyBalance:dailyBalance,analyze:analyze,resolve:resolve,_internals:{gymSessionsForDate:gymSessionsForDate,gymDay:gymDay,cardioDay:cardioDay,strengthSessionResolution:strengthSessionResolution,sleepCapacity:sleepCapacity}});
});
