(function(){
  'use strict';

  function root(){try{return DATA||{};}catch(e){return window.DATA||window.simurgData||{};}}
  function number(value){if(value==null||value===''||value===false)return null;var n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
  function first(){for(var i=0;i<arguments.length;i++){var n=number(arguments[i]);if(n!=null)return n;}return null;}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function durationMinutes(value){
    if(value==null||value==='')return 0;
    if(typeof value==='number')return value>10000?value/60:value;
    var raw=String(value).trim(),parts=raw.split(':').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite))return parts[0]*60+parts[1]+parts[2]/60;
    if(parts.length===2&&parts.every(Number.isFinite))return parts[0]*60+parts[1];
    var hours=raw.match(/([\d.,]+)\s*(?:h|sa)/i),minutes=raw.match(/([\d.,]+)\s*(?:m|dk|min)/i);
    return (hours?Number(hours[1].replace(',','.'))*60:0)+(minutes?Number(minutes[1].replace(',','.')):0);
  }
  function timeMinutes(value){var match=String(value||'').match(/(\d{1,2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):null;}
  function polarOn(date,data){var daily=data.polarWorkouts&&data.polarWorkouts.daily||{};return list(daily[date]).filter(function(x){return x&&typeof x==='object';});}
  function gymOn(date,data){return (data.workouts||[]).filter(function(x){return x&&x.date===date;});}
  function validApple(row){
    if(!row||!row.date)return false;
    var type=String(row.activityType||row.workoutType||row.type||'').trim().toLowerCase();
    if(!type||/^(none|null|undefined|missing|waiting|-1)$/.test(type))return false;
    return [row.activeCal,row.totalCal,row.avgHR,row.maxHR,row.distance,row.steps].some(function(v){return number(v)>0;})||durationMinutes(row.duration||row.durationText)>0;
  }
  function appleOn(date,data){return (data.appleWatch||[]).filter(function(x){return x&&x.date===date&&validApple(x);});}
  function fitnessType(workout){return String(workout&& (workout.workoutType||workout.activityType||workout.sport||workout.name)||'').toLowerCase();}
  function gymTime(rows){for(var i=0;i<rows.length;i++){var t=timeMinutes(rows[i].startTime||rows[i].time||rows[i].startedAt);if(t!=null)return t;}return null;}
  function gymDuration(rows){for(var i=0;i<rows.length;i++){var n=durationMinutes(rows[i].duration||rows[i].durationMinutes);if(n>0)return n;}return 0;}
  function matchScore(workout,gym){
    var score=0,gTime=gymTime(gym),pTime=timeMinutes(workout.startTime||workout.start_time),gDuration=gymDuration(gym),pDuration=durationMinutes(workout.duration||workout.durationMinutes),type=fitnessType(workout);
    if(gTime!=null&&pTime!=null)score+=Math.max(0,80-Math.abs(gTime-pTime));
    if(gDuration&&pDuration)score+=Math.max(0,35-Math.abs(gDuration-pDuration));
    if(/strength|functional|fitness|gym|weight|resistance|circuit|crossfit|other indoor/.test(type))score+=45;
    if(gym.length)score+=10;
    return score;
  }
  function bestPolar(workouts,gym){return workouts.slice().sort(function(a,b){return matchScore(b,gym)-matchScore(a,gym);})[0]||null;}
  function sourceLabel(hasPolar,hasGym,hasApple){if(hasPolar&&hasGym)return 'Polar + Gym';if(hasPolar)return 'Polar';if(hasGym)return 'Gym';if(hasApple)return 'Apple Health';return null;}
  function zonesSeconds(zones){
    if(!zones||typeof zones!=='object')return 0;
    return Object.keys(zones).reduce(function(sum,key){return sum+durationMinutes(zones[key])*60;},0);
  }
  function day(date){
    var data=root(),polar=polarOn(date,data),gym=gymOn(date,data),apple=appleOn(date,data),primary=bestPolar(polar,gym),legacy=primary?null:(apple[0]||null),cardio=data.polarCardioLoad&&data.polarCardioLoad.daily&&data.polarCardioLoad.daily[date]||null;
    return {date:date,polar:polar,gym:gym,apple:apple,primary:primary||legacy,primaryPolar:primary,appleLegacy:legacy,extraPolar:primary?polar.filter(function(x){return x!==primary;}):polar.slice(),cardioLoad:cardio,source:sourceLabel(!!primary,!!gym.length,!!legacy)};
  }
  function metrics(date){
    var session=day(date),p=session.primaryPolar,a=session.appleLegacy,g=session.gym,cardio=session.cardioLoad||{},physical=p||a||{},minutes=durationMinutes(physical.duration||physical.durationMinutes),active=first(physical.activeCal,physical.activeCalories,physical.calories,physical.kilocalories)||0,avgHR=first(physical.avgHR,physical.avgHr,physical.averageHeartRate)||0,maxHR=first(physical.maxHR,physical.maxHr,physical.maximumHeartRate)||0;
    var rpes=g.map(function(x){return number(x.rpe);}).filter(function(x){return x!=null;}),avgRpe=rpes.length?rpes.reduce(function(s,x){return s+x;},0)/rpes.length:0,volumeSummary=window.SimurgVolumeModel.summary(g),sets=volumeSummary.sets,volume=volumeSummary.volume,painWarning=g.some(function(x){return /warning|severe|high|şiddet/i.test(String(x.pain||''));}),painMild=g.some(function(x){return /mild|hafif|yes|var/i.test(String(x.pain||''));}),badForm=g.some(function(x){return /bad|poor|kötü/i.test(String(x.form||''));});
    var direct=first(cardio.cardioLoad,cardio.load,cardio.strain,p&&p.cardioLoad,p&&p.trainingLoad),zoneMinutes=p?zonesSeconds(p.zones||p.heartRateZones)/60:0;
    var physiological=direct!=null?direct*6:active+(minutes*2)+Math.max(0,avgHR-95)*2+(zoneMinutes?Math.min(160,zoneMinutes*2):0);
    var gymLoad=sets*7+(avgRpe?avgRpe*8:0)+Math.min(140,volume/100);
    var loadScore=Math.round(physiological+gymLoad),level=loadScore>=620?'High':loadScore>=320?'Moderate':(loadScore>0?'Low':'None');
    return {session:session,watch:session.appleLegacy?[session.appleLegacy]:[],polar:session.polar,gym:{sets:sets,volume:volume},coach:{avgRpe:avgRpe,painWarning:painWarning,painMild:painMild,badForm:badForm},active:active,total:first(physical.totalCal,physical.totalCalories)||0,minutes:minutes,avgHR:avgHR,maxHR:maxHR,types:physical?[String(physical.workoutType||physical.activityType||physical.type||'Workout').replace(/[_-]+/g,' ')]:[],loadScore:loadScore,level:level,source:session.source,primary:session.primary,extraPolar:session.extraPolar};
  }
  function allDates(){var data=root(),dates=[];Object.keys(data.polarWorkouts&&data.polarWorkouts.daily||{}).forEach(function(x){dates.push(x);});(data.workouts||[]).forEach(function(x){if(x&&x.date)dates.push(x.date);});(data.appleWatch||[]).forEach(function(x){if(validApple(x))dates.push(x.date);});return Array.from(new Set(dates)).filter(Boolean).sort();}
  function latest(){var dates=allDates();return dates.length?day(dates[dates.length-1]):null;}
  function countSessions(dates){return (dates||allDates()).reduce(function(sum,date){var s=day(date),count=s.polar.length||(s.gym.length?1:0)||(s.appleLegacy?1:0);return sum+count;},0);}

  window.SimurgWorkoutSource={day:day,metrics:metrics,latest:latest,allDates:allDates,countSessions:countSessions,validApple:validApple,durationMinutes:durationMinutes};

  if(typeof window.activityLoadForDate==='function')window.activityLoadForDate=metrics;
  if(typeof window.calculateReadiness==='function')window.calculateReadiness=function(date){
    var today=metrics(date),prev=metrics(typeof addDays==='function'?addDays(date,-1):date),score=82,reasons=[];
    if(today.loadScore>=620){score-=12;reasons.push('Polar ve Gym toplam yükü yüksek');}else if(today.loadScore>=320){score-=7;reasons.push('Polar ve Gym toplam yükü orta');}
    if(today.avgHR>145){score-=10;reasons.push('Polar ortalama nabzı yüksek');}else if(today.avgHR>130){score-=5;reasons.push('Polar ortalama nabzı orta-üst');}
    if(today.maxHR>170){score-=8;reasons.push('Polar maksimum nabzı yüksek');}
    if(today.gym.sets>24){score-=8;reasons.push('gym set hacmi yüksek');}else if(today.gym.sets>18){score-=4;reasons.push('gym set hacmi orta-üst');}
    if(today.coach.avgRpe>=9){score-=12;reasons.push('RPE çok yüksek');}else if(today.coach.avgRpe>=8){score-=6;reasons.push('RPE yüksek');}
    if(today.coach.painWarning){score-=18;reasons.push('pain warning işaretlendi');}else if(today.coach.painMild){score-=8;reasons.push('hafif ağrı işaretlendi');}
    if(today.coach.badForm){score-=10;reasons.push('form kötü işaretlendi');}if(prev.loadScore>620){score-=8;reasons.push('dünkü toplam yük yüksek');}
    score=Math.round(Math.max(20,Math.min(100,score)));var status=score>=80?'Ready':score>=65?'Controlled':score>=50?'Caution':'Recovery',advice=status==='Ready'?'Bugün plan uygulanabilir. Ana hedef temiz form ve kontrollü progression.':status==='Controlled'?'Bugün kontrollü yüklen. Failure yerine 1-2 tekrar rezerv bırak.':status==='Caution'?'Bugün yük artırma. Teknik, tempo ve eklem güvenliğini önceliklendir.':'Bugün ağır yüklenme önerilmez. Recovery veya düşük yoğunluk daha mantıklı.';
    return {score:score,status:status,advice:advice,reasons:reasons,today:today,prev:prev,source:today.source};
  };
})();
