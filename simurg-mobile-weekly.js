(function(root,factory){
  'use strict';
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgMobileWeekly=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  var state={start:null};

  function number(value){var parsed=Number(value);return value!==null&&value!==''&&Number.isFinite(parsed)&&parsed>=0?parsed:null;}
  function average(values){values=(values||[]).filter(function(value){return value!=null;});return values.length?values.reduce(function(sum,value){return sum+value;},0)/values.length:null;}
  function round(value,digits){if(value==null)return null;var factor=Math.pow(10,digits==null?1:digits);return Math.round(value*factor)/factor;}
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;}
  function parse(value){var parts=String(value).split('-').map(Number);return new Date(parts[0],parts[1]-1,parts[2]||1);}
  function dateString(value){return value.getFullYear()+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0');}
  function addDays(value,amount){var date=parse(value);date.setDate(date.getDate()+amount);return dateString(date);}
  function mondayOf(value){var date=parse(value),day=date.getDay();date.setDate(date.getDate()+(day===0?-6:1-day));return dateString(date);}
  function localToday(){return dateString(new Date());}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});}
  function dependencies(options){
    options=options||{};
    return {
      data:options.data||(root&&root.DATA)||{},
      signal:options.signalModel||(root&&root.SimurgSignalModel),
      sleep:options.sleepIntelligence||(root&&root.SimurgSleepIntelligence),
      polar:options.polarIntelligence||(root&&root.SimurgPolarIntelligence)
    };
  }
  function safeDates(start,today){var end=addDays(start,6),safeEnd=end<today?end:today,out=[];for(var date=start;date<=safeEnd;date=addDays(date,1))out.push(date);return {dates:out,end:end,safeEnd:out.length?out[out.length-1]:start};}
  function clean(value){return String(value==null?'':value).trim();}
  function gymSessionKey(row,date){var id=clean(row&&row.sessionId);return id?'gym:'+id:'gym:legacy:'+date;}
  function durationMinutes(row){
    row=row||{};var direct=number(row.durationMinutes);if(direct>0)return direct;var seconds=number(row.durationSeconds);if(seconds>0)return seconds/60;
    var raw=clean(row.duration||row.durationText||row.elapsedTime||row.trainingTime);if(!raw)return null;var parts=raw.split(':').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite))return parts[0]*60+parts[1]+parts[2]/60;
    if(parts.length===2&&parts.every(Number.isFinite))return parts[0]*60+parts[1];
    var hours=raw.match(/([\d.,]+)\s*(?:h|sa)/i),minutes=raw.match(/([\d.,]+)\s*(?:m|dk|min)/i),parsed=(hours?Number(hours[1].replace(',','.'))*60:0)+(minutes?Number(minutes[1].replace(',','.')):0),numeric=Number(raw.replace(',','.'));
    return parsed>0?parsed:(numeric>0?numeric:null);
  }
  function startMinute(value){var match=clean(value).match(/(?:^|T)(\d{1,2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):null;}
  function sessionLinkId(value){var raw=value&&value.raw||value||{};return clean(value&&value.sessionId||value&&value.gymSessionId||value&&value.linkedSessionId||raw.sessionId||raw.gymSessionId||raw.linkedSessionId);}
  function physicalId(session){var raw=session&&session.raw||session||{};return clean(session&&session.polarExerciseId||session&&session.exerciseId||session&&session.id||raw.polarExerciseId||raw.exerciseId||raw.exercise_id||raw.polarId||raw.id);}
  function physicalSessionKey(session,date){var id=physicalId(session);if(id)return 'physical:'+id;return ['physical',date,clean(session&&session.startTime),number(session&&session.startMinute),number(session&&session.durationMinutes),clean(session&&session.activityKey),clean(session&&session.activityName),clean(session&&session.source)].join('|');}
  function isStrengthSession(session){var key=clean(session&&session.activityKey).toLocaleLowerCase('tr-TR'),name=clean(session&&session.activityName).toLocaleLowerCase('tr-TR');return key==='strength'||/strength|functional|fitness|gym|weight|resistance|kuvvet|ağırlık/.test(key+' '+name);}
  function uniquePhysicalSessions(sessions,date){var seen={},out=[];list(sessions).forEach(function(session){if(!session)return;var key=physicalSessionKey(session,date);if(seen[key])return;seen[key]=true;out.push(session);});return out;}
  function gymSessionGroups(rows,date){var groups={};list(rows).forEach(function(row){var key=gymSessionKey(row,date);(groups[key]=groups[key]||[]).push(row);});return Object.keys(groups).map(function(key){
    var sessionRows=groups[key],values=sessionRows.map(durationMinutes).filter(function(value){return value>0;}),representative=null;
    if(values.length&&values.every(function(value){return Math.abs(value-values[0])<=1;}))representative=values[0];
    return {key:key,id:clean(sessionRows[0]&&sessionRows[0].sessionId),date:date,rows:sessionRows,durationMinutes:representative,startMinute:startMinute(sessionRows[0]&&(sessionRows[0].startTime||sessionRows[0].time||sessionRows[0].startedAt))};
  });}
  function gymPhysicalScore(gym,physical,gymCount,strengthCount){
    if(!isStrengthSession(physical))return -1;var score=0,linked=sessionLinkId(physical),physicalStart=number(physical&&physical.startMinute);if(physicalStart==null)physicalStart=startMinute(physical&&physical.startTime);
    if(gym.id&&linked&&gym.id===linked)score+=1000;
    if(gym.startMinute!=null&&physicalStart!=null&&Math.abs(gym.startMinute-physicalStart)<=90)score+=200-Math.abs(gym.startMinute-physicalStart);
    var physicalDuration=durationMinutes(physical);if(gym.durationMinutes>0&&physicalDuration>0&&Math.abs(gym.durationMinutes-physicalDuration)<=30)score+=100-Math.abs(gym.durationMinutes-physicalDuration);
    if(gymCount===1&&strengthCount===1)score+=50;else if(gymCount&&strengthCount)score+=10;
    return score;
  }
  function sessionSummary(days){
    var gymTotal=0,physical=[],unified=[],trainingDates={};
    days.forEach(function(day){
      var gym=gymSessionGroups(day.gym&&day.gym.rows,day.date),sessions=uniquePhysicalSessions(day.sessions,day.date),strength=sessions.filter(isStrengthSession),matched={};gymTotal+=gym.length;physical=physical.concat(sessions);
      gym.forEach(function(group){var best=-1,bestScore=-1;sessions.forEach(function(session,index){if(matched[index])return;var score=gymPhysicalScore(group,session,gym.length,strength.length);if(score>bestScore){best=index;bestScore=score;}});if(best>=0&&bestScore>0){matched[best]=group;}});
      sessions.forEach(function(session,index){var gymGroup=matched[index],minutes=durationMinutes(session)||gymGroup&&gymGroup.durationMinutes||null;unified.push({date:day.date,type:'physical',durationMinutes:minutes,gymSession:gymGroup||null});trainingDates[day.date]=true;});
      gym.forEach(function(group){if(Object.keys(matched).some(function(index){return matched[index]===group;}))return;unified.push({date:day.date,type:'gym',durationMinutes:group.durationMinutes,gymSession:group});trainingDates[day.date]=true;});
    });
    var durationValues=unified.map(function(session){return session.durationMinutes;}).filter(function(value){return value>0;});
    return {total:unified.length,gym:gymTotal,physical:physical,unified:unified,days:Object.keys(trainingDates).length,durationMinutes:durationValues.length?round(durationValues.reduce(function(sum,value){return sum+value;},0),1):null,durationSampleSize:durationValues.length};
  }
  function rpeAverage(days){var sessions=[];days.forEach(function(day){gymSessionGroups(day.gym&&day.gym.rows,day.date).forEach(function(session){var values=session.rows.map(function(row){return number(row&&row.rpe);}).filter(function(value){return value!=null;});if(values.length)sessions.push(average(values));});});return {value:round(average(sessions),1),sampleSize:sessions.length};}
  function resolvedPolar(polar,date,data){try{return polar&&typeof polar.resolve==='function'?polar.resolve(date,{data:data}):null;}catch(error){return null;}}
  function resolvedSleep(sleep,date,data){try{return sleep&&typeof sleep.resolve==='function'?sleep.resolve(date,{data:data}):null;}catch(error){return null;}}
  function hasEarlierTrustedData(data,start){
    var dates=[];(data.workouts||[]).forEach(function(row){if(dateValue(row&&row.date))dates.push(row.date);});(data.appleWatch||[]).forEach(function(row){if(dateValue(row&&row.date))dates.push(row.date);});
    ['polarWorkouts','polarActivity','polarSleep','polarNightlyRecharge','polarCardioLoad'].forEach(function(key){Object.keys(data[key]&&data[key].daily||{}).forEach(function(date){if(dateValue(date))dates.push(date);});});
    return dates.some(function(date){return date<start;});
  }
  function buildWeek(start,options){
    options=options||{};start=mondayOf(dateValue(start)||dateValue(options.today)||localToday());
    var today=dateValue(options.today)||localToday(),currentMonday=mondayOf(today);if(start>currentMonday)start=currentMonday;
    var deps=dependencies(options),canonical=deps.signal&&typeof deps.signal.week==='function'?deps.signal.week(start):null;
    if(!canonical)return {status:'insufficient',startDate:start,endDate:addDays(start,6),safeEndDate:start,dates:[],reason:'weekly_provider_unavailable'};
    var bounds=safeDates(start,today),allowed=new Set(bounds.dates),days=list(canonical.days).filter(function(day){return day&&allowed.has(day.date);});
    var rows=days.reduce(function(output,day){return output.concat(list(day.gym&&day.gym.rows));},[]),rpe=rpeAverage(days);
    var gymDays=days.filter(function(day){return list(day.gym&&day.gym.rows).length>0;}),sessions=sessionSummary(days),physicalSessions=sessions.physical;
    var polarDays=days.map(function(day){return {date:day.date,result:resolvedPolar(deps.polar,day.date,deps.data)};}),sleepDays=days.map(function(day){return {date:day.date,result:resolvedSleep(deps.sleep,day.date,deps.data)};});
    function polarMetric(reader){var values=polarDays.map(function(item){try{return number(reader(item.result));}catch(error){return null;}}).filter(function(value){return value!=null;});return {value:round(average(values),1),sampleSize:values.length};}
    function polarTotal(reader){var values=polarDays.map(function(item){try{return number(reader(item.result));}catch(error){return null;}}).filter(function(value){return value!=null;});return {value:values.length?round(values.reduce(function(sum,value){return sum+value;},0),1):null,sampleSize:values.length};}
    var hrvMetric=polarMetric(function(result){return result&&result.nightly&&result.nightly.metrics&&result.nightly.metrics.hrv;}),nightHrMetric=polarMetric(function(result){return result&&result.nightly&&result.nightly.metrics&&result.nightly.metrics.nightHr;}),stepsMetric=polarTotal(function(result){return result&&result.activity&&result.activity.metrics&&result.activity.metrics.steps;}),activeMetric=polarTotal(function(result){return result&&result.activity&&result.activity.metrics&&result.activity.metrics.activeMinutes;});
    var sleepValues=sleepDays.map(function(item){var result=item.result,daily=result&&result.daily;return result&&result.status==='available'?number(daily&&daily.actualSleepMinutes):null;}).filter(function(value){return value!=null;});
    var officialLoadDays=days.filter(function(day){return day.load&&day.load.available&&day.load.sourceType==='official'&&number(day.load.value)!=null;}),loadValues=officialLoadDays.map(function(day){return number(day.load.value);}),latestLoadDay=officialLoadDays.slice(-1)[0]||null,latestLoad=latestLoadDay&&latestLoadDay.load||null,cardioLoadValue=loadValues.length>=3?round(average(loadValues),1):null;
    var prEvents=list(canonical.prs&&canonical.prs.newEvents).filter(function(event){return event&&event.date>=start&&event.date<=bounds.safeEnd;});
    var sets=rows.length?gymDays.reduce(function(sum,day){return sum+(number(day.gym&&day.gym.sets)||0);},0):null;
    var reps=rows.length?gymDays.reduce(function(sum,day){return sum+(number(day.gym&&day.gym.reps)||0);},0):null;
    var volume=rows.length?gymDays.reduce(function(sum,day){return sum+(number(day.gym&&day.gym.volume)||0);},0):null;
    return {
      status:'available',startDate:start,endDate:bounds.end,safeEndDate:bounds.safeEnd,dates:bounds.dates,coverageDays:bounds.dates.length,isActive:start===currentMonday,isPartial:bounds.safeEnd<bounds.end,canonical:canonical,hasEarlierData:hasEarlierTrustedData(deps.data,start),
      training:{sessions:sessions.total,days:sessions.days,durationMinutes:sessions.durationMinutes,durationSampleSize:sessions.durationSampleSize,durationComplete:sessions.total>0&&sessions.durationSampleSize===sessions.total},
      strength:{sessions:sessions.gym,sets:sets,reps:reps,volume:round(volume,1),avgRpe:rpe.value,rpeSampleSize:rpe.sampleSize,prCount:prEvents.length},
      polar:{
        actualSleepMinutes:round(average(sleepValues),1),actualSleepSampleSize:sleepValues.length,
        hrv:hrvMetric,
        nightHr:nightHrMetric,
        steps:stepsMetric,
        activeMinutes:activeMetric,
        cardioLoad:{value:cardioLoadValue,sampleSize:loadValues.length,sourceType:loadValues.length?'official':null,latestStatusLabel:latestLoad&&latestLoad.statusLabel||null,latestStatusDate:latestLoadDay&&latestLoadDay.date||null}
      },
      hasPeriodData:!!(rows.length||physicalSessions.length||sleepValues.length||hrvMetric.sampleSize||nightHrMetric.sampleSize||stepsMetric.sampleSize||activeMetric.sampleSize||loadValues.length)
    };
  }
  function difference(current,previous,kind){
    current=number(current);previous=number(previous);if(current==null||previous==null)return null;
    var raw=current-previous;if(kind==='percent')return previous>0?round(raw/previous*100,1):null;
    return round(raw,kind==='integer'?0:1);
  }
  function compare(current,previous){
    var periodReason=current&&current.isActive?'active_week':!current||current.coverageDays!==7?'incomplete_week':!previous||previous.status!=='available'||previous.coverageDays!==7||!previous.hasPeriodData?'no_history':null,reasons={};
    function period(key,currentValue,previousValue,kind){reasons[key]=periodReason||(currentValue==null||previousValue==null?'unavailable':null);return reasons[key]?null:difference(currentValue,previousValue,kind);}
    function daily(key,currentMetric,previousMetric,kind,minSamples){var reason=periodReason,min=minSamples==null?3:minSamples;if(!reason&&(!currentMetric||!previousMetric))reason='unavailable';if(!reason&&(currentMetric.sampleSize<min||previousMetric.sampleSize<min))reason='insufficient_samples';if(!reason&&(currentMetric.value==null||previousMetric.value==null))reason='unavailable';reasons[key]=reason;return reason?null:difference(currentMetric.value,previousMetric.value,kind);}
    function totalMetric(key,currentMetric,previousMetric,kind){return daily(key,currentMetric,previousMetric,kind,7);}
    var sleepCurrent={value:current&&current.polar.actualSleepMinutes,sampleSize:current&&current.polar.actualSleepSampleSize||0},sleepPrevious={value:previous&&previous.polar.actualSleepMinutes,sampleSize:previous&&previous.polar.actualSleepSampleSize||0};
    return {
      sessions:period('sessions',current&&current.training.sessions,previous&&previous.training.sessions,'integer'),
      durationMinutes:(function(){var reason=periodReason;if(!reason&&(!current||!previous||!current.training.durationComplete||!previous.training.durationComplete))reason='incomplete_duration';reasons.durationMinutes=reason||(current.training.durationMinutes==null||previous.training.durationMinutes==null?'unavailable':null);return reasons.durationMinutes?null:difference(current.training.durationMinutes,previous.training.durationMinutes,'integer');})(),
      volumePercent:period('volumePercent',current&&current.strength.volume,previous&&previous.strength.volume,'percent'),
      gymSessions:period('gymSessions',current&&current.strength.sessions,previous&&previous.strength.sessions,'integer'),
      sets:period('sets',current&&current.strength.sets,previous&&previous.strength.sets,'integer'),
      reps:period('reps',current&&current.strength.reps,previous&&previous.strength.reps,'integer'),
      avgRpe:daily('avgRpe',{value:current&&current.strength.avgRpe,sampleSize:current&&current.strength.rpeSampleSize||0},{value:previous&&previous.strength.avgRpe,sampleSize:previous&&previous.strength.rpeSampleSize||0}),
      actualSleepMinutes:daily('actualSleepMinutes',sleepCurrent,sleepPrevious,'integer'),
      hrv:daily('hrv',current&&current.polar.hrv,previous&&previous.polar.hrv),
      nightHr:daily('nightHr',current&&current.polar.nightHr,previous&&previous.polar.nightHr),
      stepsPercent:totalMetric('stepsPercent',current&&current.polar.steps,previous&&previous.polar.steps,'percent'),
      activeMinutes:totalMetric('activeMinutes',current&&current.polar.activeMinutes,previous&&previous.polar.activeMinutes,'integer'),
      cardioLoadPercent:daily('cardioLoadPercent',current&&current.polar.cardioLoad,previous&&previous.polar.cardioLoad,'percent'),
      reasons:reasons,scope:current&&current.isActive?'active_week':'full_week'
    };
  }
  function localized(value){var parsed=Number(value);return Number.isFinite(parsed)?round(parsed,1).toLocaleString('tr-TR'):null;}
  function signed(value,suffix){if(value==null)return 'Karşılaştırma yok';var sign=value>0?'+':value<0?'-':'',formatted=localized(Math.abs(value));return suffix==='%'?sign+'%'+formatted:sign+formatted+(suffix||'');}
  function deltaLabel(comparison,key,suffix){var reason=comparison&&comparison.reasons&&comparison.reasons[key];if(reason==='active_week')return null;if(reason==='insufficient_samples'||reason==='incomplete_week'||reason==='incomplete_duration')return 'Yetersiz veri';return signed(comparison&&comparison[key],suffix);}
  function durationLabel(value){value=number(value);if(value==null)return '—';var minutes=Math.round(value),hours=Math.floor(minutes/60),rest=minutes%60;return hours?(hours+'sa'+(rest?' '+rest+'dk':'')):(rest+'dk');}
  function numberLabel(value){return number(value)==null?'—':Math.round(value).toLocaleString('tr-TR');}
  function decimalLabel(value){return number(value)==null?'—':round(value,1).toLocaleString('tr-TR');}
  function volumeDisplay(value){value=number(value);return value==null?{value:'—',unit:''}:value>=1000?{value:decimalLabel(value/1000),unit:'ton'}:{value:numberLabel(value),unit:'kg'};}
  function volumeLabel(value){var display=volumeDisplay(value);return display.value+(display.unit?' '+display.unit:'');}
  function rangeLabel(start,end){var format=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',year:'numeric'});return format.format(new Date(start+'T12:00:00'))+' – '+format.format(new Date(end+'T12:00:00'));}
  function primaryCard(label,value,delta,unit,className){return '<article class="mwPrimary '+className+(delta?'':' current')+'"><div class="mwPrimaryAccent" aria-hidden="true"></div><small>'+escapeHtml(label)+'</small><strong>'+escapeHtml(value)+'</strong><span>'+escapeHtml(unit||'')+'</span>'+(delta?'<em>'+escapeHtml(delta)+'</em>':'')+'</article>';}
  function metricCard(label,value,unit,delta,sample,context){if(value==null)return '';return '<article class="mwMetric"><small>'+escapeHtml(label)+'</small><b>'+escapeHtml(value)+(unit?' <i>'+escapeHtml(unit)+'</i>':'')+'</b>'+(delta?'<span>'+escapeHtml(delta)+'</span>':'')+(sample?'<em>'+escapeHtml(sample)+'</em>':'')+(context?'<em class="mwMetricContext">'+escapeHtml(context)+'</em>':'')+'</article>';}
  function visual(label,current,previous,formatter){
    if(current==null||previous==null)return '';var maximum=Math.max(current,previous,1),currentWidth=Math.max(4,current/maximum*100),previousWidth=Math.max(4,previous/maximum*100);
    return '<article class="mwVisual"><header><b>'+escapeHtml(label)+'</b><span>Bu hafta / Geçen hafta</span></header><div><small>Bu hafta</small><i><em style="width:'+currentWidth+'%"></em></i><b>'+escapeHtml(formatter(current))+'</b></div><div class="previous"><small>Geçen</small><i><em style="width:'+previousWidth+'%"></em></i><b>'+escapeHtml(formatter(previous))+'</b></div></article>';
  }
  function summaryText(current,comparison){
    var sentences=[];
    if(current&&current.isActive){
      if(current.training.sessions)sentences.push('Şu ana kadar '+current.training.days+' antrenman günü ve '+current.training.sessions+' seans kaydedildi.');
      else sentences.push('Bu haftanın mevcut kayıtları gösteriliyor.');
      return sentences.join(' ');
    }
    if(comparison.volumePercent!=null)sentences.push('Gym hacmin geçen haftaya göre %'+localized(Math.abs(comparison.volumePercent))+' '+(comparison.volumePercent>0?'arttı':comparison.volumePercent<0?'azaldı':'aynı kaldı')+'.');
    else if(current.strength.sessions)sentences.push('Bu hafta '+current.training.days+' antrenman günü ve '+current.training.sessions+' seans kaydedildi.');
    else if(current.training.sessions)sentences.push('Bu hafta '+current.training.sessions+' antrenman seansı kaydedildi.');
    if(comparison.actualSleepMinutes!=null)sentences.push('Gerçek uyku ortalaman '+localized(Math.abs(comparison.actualSleepMinutes))+' dk '+(comparison.actualSleepMinutes>0?'yükseldi':comparison.actualSleepMinutes<0?'geriledi':'değişmedi')+'.');
    var signals=[];if(comparison.hrv!=null)signals.push('HRV '+signed(comparison.hrv,' ms'));if(comparison.nightHr!=null)signals.push('Night HR '+signed(comparison.nightHr,' bpm'));if(signals.length)sentences.push(signals.join(', ')+'.');
    if(!sentences.length)sentences.push('Haftalık karşılaştırma için güvenilir kayıtlar henüz yeterli değil.');
    return sentences.slice(0,3).join(' ');
  }
  function render(current,previous,today){
    if(!current||current.status!=='available')return '<div class="mwShell"><section class="mwEmpty"><h2>Haftalık veri hazırlanamadı</h2><p>Kanonik Weekly sağlayıcısı kullanılamıyor.</p></section></div>';
    var comparison=compare(current,previous),isCurrent=current.startDate===mondayOf(today),nextDisabled=current.startDate>=mondayOf(today),scopeLabel=isCurrent?'Hafta devam ediyor — haftalık karşılaştırma Pazar sonunda tamamlanacak.':'Tamamlanmış hafta · önceki tamamlanmış hafta';
    var primary=[primaryCard('Antrenman',numberLabel(current.training.sessions),deltaLabel(comparison,'sessions',' seans'),'seans','sessions')];
    if(current.training.durationMinutes!=null)primary.push(primaryCard('Toplam süre',durationLabel(current.training.durationMinutes),deltaLabel(comparison,'durationMinutes',' dk'),current.training.durationSampleSize+'/'+current.training.sessions+' seans süreli','duration'));
    if(current.strength.volume!=null){var volume=volumeDisplay(current.strength.volume);primary.push(primaryCard('Gym hacmi',volume.value,deltaLabel(comparison,'volumePercent','%'),volume.unit,'volume'));}
    var strength=metricCard('Antrenman günü',current.training.days,null,null,current.training.sessions+' seans')+metricCard('Gym seansı',current.strength.sessions,null,deltaLabel(comparison,'gymSessions',' seans'))+metricCard('Toplam set',current.strength.sets,null,deltaLabel(comparison,'sets',' set'))+metricCard('Toplam tekrar',current.strength.reps,null,deltaLabel(comparison,'reps',' tekrar'))+metricCard('Ort. seans RPE',current.strength.avgRpe==null?null:decimalLabel(current.strength.avgRpe),null,deltaLabel(comparison,'avgRpe',''),current.strength.rpeSampleSize+' seans')+metricCard('PR',current.strength.prCount,null,null);
    var cardioValue=current.polar.cardioLoad.value==null?'Yetersiz veri':decimalLabel(current.polar.cardioLoad.value),cardioContext=current.polar.cardioLoad.latestStatusLabel?'Son resmi gün durumu: '+current.polar.cardioLoad.latestStatusLabel:'Yalnız resmi Polar günlük Cardio Load',cardioDelta=current.polar.cardioLoad.value==null?(isCurrent?null:'Yetersiz veri'):deltaLabel(comparison,'cardioLoadPercent','%');
    var polar=metricCard('Gerçek uyku',current.polar.actualSleepMinutes==null?null:durationLabel(current.polar.actualSleepMinutes),null,deltaLabel(comparison,'actualSleepMinutes',' dk'),current.polar.actualSleepSampleSize+' gece')+metricCard('HRV',current.polar.hrv.value==null?null:decimalLabel(current.polar.hrv.value),'ms',deltaLabel(comparison,'hrv',' ms'),current.polar.hrv.sampleSize+' gece')+metricCard('Night HR',current.polar.nightHr.value==null?null:decimalLabel(current.polar.nightHr.value),'bpm',deltaLabel(comparison,'nightHr',' bpm'),current.polar.nightHr.sampleSize+' gece')+metricCard('Adım',current.polar.steps.value==null?null:numberLabel(current.polar.steps.value),null,deltaLabel(comparison,'stepsPercent','%'),current.polar.steps.sampleSize+'/7 gün')+metricCard('Aktif süre',current.polar.activeMinutes.value==null?null:durationLabel(current.polar.activeMinutes.value),null,deltaLabel(comparison,'activeMinutes',' dk'),current.polar.activeMinutes.sampleSize+'/7 gün')+metricCard('Cardio Load · haftalık ort.',cardioValue,null,cardioDelta,current.polar.cardioLoad.sampleSize+' resmi gün',cardioContext);
    var visuals=(comparison.volumePercent!=null?visual('Gym hacmi',current.strength.volume,previous&&previous.strength.volume,volumeLabel):'')+(comparison.durationMinutes!=null?visual('Antrenman süresi',current.training.durationMinutes,previous&&previous.training.durationMinutes,durationLabel):'')+(comparison.actualSleepMinutes!=null?visual('Gerçek uyku',current.polar.actualSleepMinutes,previous&&previous.polar.actualSleepMinutes,durationLabel):'')+(comparison.cardioLoadPercent!=null?visual('Cardio Load',current.polar.cardioLoad.value,previous&&previous.polar.cardioLoad.value,decimalLabel):'');
    return '<div class="mwShell"><header class="mwHeader"><div><small>'+escapeHtml(isCurrent?'BU HAFTA':'GEÇMİŞ HAFTA')+'</small><h1>Haftalık Özet</h1><p>'+escapeHtml(isCurrent?'Bu haftanın şu ana kadarki değerleri.':'Tamamlanan haftanın önceki tam haftaya göre özeti.')+'</p></div><div class="mwWeekNav"><button type="button" onclick="SimurgMobileWeekly.shift(-1)" aria-label="Önceki hafta" '+(current.hasEarlierData?'':'disabled')+'>‹</button><strong>'+escapeHtml(rangeLabel(current.startDate,current.endDate))+'</strong><button type="button" onclick="SimurgMobileWeekly.shift(1)" aria-label="Sonraki hafta" '+(nextDisabled?'disabled':'')+'>›</button></div><p class="mwComparisonScope '+(isCurrent?'active':'')+'">'+escapeHtml(scopeLabel)+'</p></header><section class="mwPrimaryGrid">'+primary.slice(0,3).join('')+'</section><section class="mwSection"><header><small>KUVVET</small><h2>Strength özeti</h2></header><div class="mwMetricGrid">'+(strength||'<p class="mwUnavailable">Bu hafta Gym kaydı yok.</p>')+'</div></section><section class="mwSection"><header><small>POLAR</small><h2>Haftalık vücut sinyalleri</h2></header><div class="mwMetricGrid">'+(polar||'<p class="mwUnavailable">Bu hafta güvenilir Polar özeti için yeterli veri yok.</p>')+'</div></section>'+(visuals?'<section class="mwSection"><header><small>KARŞILAŞTIRMA</small><h2>Bu hafta / Geçen hafta</h2><p>'+escapeHtml(scopeLabel)+'</p></header><div class="mwVisualGrid">'+visuals+'</div></section>':'')+'<section class="mwSummary"><small>SIMURG WEEKLY</small><p>'+escapeHtml(summaryText(current,comparison))+'</p></section></div>';
  }
  function mount(options){
    options=options||{};if(root&&root.innerWidth>900)return false;
    var report=root&&root.document&&root.document.getElementById('weeklyReport');if(!report)return false;
    var today=dateValue(options.today)||localToday();state.start=mondayOf(state.start||today);if(state.start>mondayOf(today))state.start=mondayOf(today);
    var current=buildWeek(state.start,Object.assign({},options,{today:today})),previous=current.isActive?null:buildWeek(addDays(state.start,-7),Object.assign({},options,{today:today}));
    var section=root.document.getElementById('weekly');if(section)section.classList.add('mwMobileWeekly');report.innerHTML=render(current,previous,today);return true;
  }
  function shift(amount){state.start=addDays(state.start||mondayOf(localToday()),Number(amount||0)*7);mount();}
  function install(){
    if(!root||root.__simurgMobileWeeklyInstalled)return;root.__simurgMobileWeeklyInstalled=true;
    var base=root.renderWeeklyReport;root.renderWeeklyReport=function(){if(root.innerWidth<=900)return mount();return typeof base==='function'?base.apply(this,arguments):undefined;};
    try{renderWeeklyReport=root.renderWeeklyReport;}catch(error){}
    if(root.document&&root.document.body&&root.document.body.getAttribute('data-simurg-active-screen')==='weekly')mount();
  }
  if(root&&root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install);else install();}
  return {buildWeek:buildWeek,compare:compare,render:render,mount:mount,shift:shift,install:install,state:state,date:{addDays:addDays,mondayOf:mondayOf}};
});
