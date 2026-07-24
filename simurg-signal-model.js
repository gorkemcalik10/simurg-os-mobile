(function(){
  'use strict';

  var weekCache=new Map(),monthCache=new Map(),revision=0;
  var debug={weekHits:0,weekMisses:0,monthHits:0,monthMisses:0,invalidations:0,lastInvalidation:null};
  var invalidText=/^(?:-1|null|undefined|nan|not_available|load_status_not_available)$/i;

  function root(){try{return DATA||{};}catch(e){return window.DATA||window.simurgData||{};}}
  function valid(value){
    if(value==null||value===''||value===false)return false;
    if(typeof value==='number')return Number.isFinite(value)&&value>=0;
    if(typeof value==='object')return Array.isArray(value)?value.length>0:Object.keys(value).length>0;
    return !invalidText.test(String(value).trim());
  }
  function number(value){if(!valid(value))return null;var n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
  function firstNumber(){for(var i=0;i<arguments.length;i++){var n=number(arguments[i]);if(n!=null)return n;}return null;}
  function firstPositive(){for(var i=0;i<arguments.length;i++){var n=number(arguments[i]);if(n>0)return n;}return null;}
  function text(value){if(!valid(value))return null;return String(value).replace(/^LOAD_STATUS_/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim();}
  function firstText(){for(var i=0;i<arguments.length;i++){var value=text(arguments[i]);if(value)return value;}return null;}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function daily(store,date){var value=store&&store.daily&&store.daily[date];return Array.isArray(value)?(value[value.length-1]||null):(value||null);}
  function fallbackDuration(value){
    if(!valid(value))return null;
    if(typeof value==='number')return value>10000?value/60:value;
    var raw=String(value).trim(),parts=raw.split(':').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite))return parts[0]*60+parts[1]+parts[2]/60;
    if(parts.length===2&&parts.every(Number.isFinite))return parts[0]*60+parts[1];
    var hours=raw.match(/([\d.,]+)\s*(?:h|sa)/i),minutes=raw.match(/([\d.,]+)\s*(?:m|dk|min)/i),seconds=raw.match(/([\d.,]+)\s*(?:s|sn|sec)/i);
    var parsed=(hours?Number(hours[1].replace(',','.'))*60:0)+(minutes?Number(minutes[1].replace(',','.')):0)+(seconds?Number(seconds[1].replace(',','.'))/60:0);
    return parsed>0?parsed:number(value);
  }
  function duration(value){
    if(!valid(value))return null;
    if(window.SimurgWorkoutSource&&typeof window.SimurgWorkoutSource.durationMinutes==='function'){
      var resolved=window.SimurgWorkoutSource.durationMinutes(value);return number(resolved);
    }
    return fallbackDuration(value);
  }
  function resolveDuration(row){
    row=row||{};
    var minutes=number(row.durationMinutes);if(minutes!=null)return minutes;
    var seconds=number(row.durationSeconds);if(seconds!=null)return seconds/60;
    var raw=firstText(row.duration,row.durationText,row.elapsedTime,row.trainingTime);
    return raw==null?null:duration(raw);
  }
  function dateValue(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;}
  function parse(value){var p=String(value).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]||1);}
  function dateString(value){return value.getFullYear()+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0');}
  function add(value,amount){var d=parse(value);d.setDate(d.getDate()+amount);return dateString(d);}
  function monthDays(month){var d=parse(month+'-01'),out=[];while(dateString(d).slice(0,7)===month){out.push(dateString(d));d.setDate(d.getDate()+1);}return out;}
  function title(value){var clean=firstText(value)||'Aktivite';return clean.toLocaleLowerCase('tr-TR').replace(/(^|\s)\S/g,function(c){return c.toLocaleUpperCase('tr-TR');});}
  function activity(value){
    var raw=firstText(value)||'Aktivite',key=raw.toLowerCase();
    var map={functional_training:'Fonksiyonel Antrenman',fitness:'Fitness',running:'Koşu',run:'Koşu',walking:'Yürüyüş',walk:'Yürüyüş',cycling:'Bisiklet',swimming:'Yüzme','polar flow workout':'Polar Antrenmanı','polar workout':'Polar Antrenmanı'};
    return map[key.replace(/\s+/g,'_')]||map[key]||title(raw);
  }
  function ui(value){
    var raw=String(value==null?'':value),map={
      'Workout Logger':'Antrenman Günlüğü','Daily Summary':'Günlük Özet','Weekly Summary':'Haftalık Özet','Monthly Review':'Aylık Değerlendirme','Program Intelligence':'Program Analizi','Coaching':'Koçluk','Weekly':'Haftalık','Monthly':'Aylık','Data Center':'Veri Merkezi','Polar Data':'Polar Verileri','Next Target':'Sonraki Hedef','Activity Session':'Aktivite Oturumu','ACTIVITY SESSION':'AKTİVİTE OTURUMU','Recovery Debt':'Toparlanma Borcu','Program Quality':'Program Kalitesi','Weekly Focus':'Haftalık Odak','Gym Days':'Gym Günleri','Activity Days':'Aktivite Günleri','Total Workout Days':'Toplam Antrenman Günü','Activity':'Aktivite','Pain':'Ağrı','Form':'Form','Volume':'Hacim','Sets':'Set','Recovery':'Toparlanma','Sleep':'Uyku','Load':'Yük','Overview':'Genel Bakış','OVERVIEW':'GENEL BAKIŞ','HEART':'KALP','ZONES':'BÖLGELER','Local Data':'Yerel Veri','Polar Connected':'Polar Bağlı','Connected':'Bağlı','Disconnected':'Bağlı Değil','Manual Sync':'Elle Senkronize Et','Cloud Sync':'Bulut Senkronizasyonu','Cloud Sync, backup ve veri yönetimi':'Bulut senkronizasyonu, yedekleme ve veri yönetimi','Universal Import':'Evrensel İçe Aktarım','Latest':'En Güncel','Good':'İyi','Bad':'Kötü','None':'Yok','Low':'Düşük','Moderate':'Orta','High':'Yüksek','Caution':'Kontrollü','Manageable':'Yönetilebilir','Progressing':'İlerliyor','Stable':'Dengeli','Data Collection':'Veri Toplanıyor','DATA COLLECTION':'VERİ TOPLANIYOR','DATA_COLLECTION':'Veri Toplanıyor','Learning Baseline':'Temel Oluşturuluyor','Full Coach':'Tam Koç Modu','Recovery Watch':'Toparlanma Takibi','Readiness':'Hazırlık','READINESS PRIME':'HAZIRLIK DURUMU','Ready':'Hazır','Controlled':'Kontrollü','Next':'Sonraki','Raw Performance':'Performans Özeti','RAW PERFORMANCE':'PERFORMANS ÖZETİ','Off Day':'Dinlenme Günü','REST DAY':'DİNLENME GÜNÜ','ACTIVE SESSION':'AKTİF OTURUM','Push Strength':'İtiş Kuvvet','Pull Strength':'Çekiş Kuvvet','Upper Pump + Posture':'Üst Vücut Pump + Postür','Monday':'Pazartesi','Tuesday':'Salı','Wednesday':'Çarşamba','Thursday':'Perşembe','Friday':'Cuma','Saturday':'Cumartesi','Sunday':'Pazar','Other':'Diğer','Other Activity':'Diğer Aktivite'
    },extra={'WEEKLY LOAD STATUS':'HAFTALIK YÜK DURUMU','WEEKLY LOAD':'HAFTALIK YÜK','DAY DISTRIBUTION':'GÜN DAĞILIMI','CHATGPT EXPORT':'RAPOR DIŞA AKTARIMI','BEST PROGRESS MOVEMENT':'EN İYİ GELİŞEN HAREKET','BEST SET':'EN İYİ SET','STABLE MOVEMENT':'DENGELİ HAREKET','ATTENTION':'DİKKAT','Data Building':'Veri Birikiyor','No pain flag':'Ağrı sinyali yok','Quality':'Kalite','Total Sets':'Toplam Set','Top Exercise':'Öne Çıkan Egzersiz','Top Focus':'Ana Odak','Activity Time':'Aktivite Süresi','Pain Flags':'Ağrı Sinyalleri','Readiness Modu':'Hazırlık Modu','PREMIUM COACH DASHBOARD':'PREMİUM KOÇ PANELİ','THIS WEEK VS LAST WEEK':'BU HAFTA / GEÇEN HAFTA','RECOVERY DEBT':'TOPARLANMA DURUMU','PROGRAM QUALITY':'PROGRAM KALİTESİ','WEEKLY FOCUS':'HAFTALIK ODAK','COACH VERDICT':'KOÇ KARARI','NEXT SESSION TARGET':'SONRAKİ ANTRENMAN HEDEFİ','WEEKLY EXPORT':'HAFTALIK RAPOR','Copy Weekly Coach Report':'Haftalık Koç Raporunu Kopyala','Connection':'Bağlantı','Last Sync':'Son Senkronizasyon','Latest Sleep':'Son Uyku','Latest HRV':'Son HRV','Nightly HR':'Gece Nabzı','Latest Workout':'Son Antrenman','Latest Activity':'Son Aktivite','Recovery Nights':'Toparlanma Geceleri','Readiness Mode':'Hazırlık Modu','Activity Min':'Aktivite Süresi','Avg RPE':'Ortalama RPE','Weekly Volume':'Haftalık Hacim','Start Time':'Başlangıç','Sleep Score':'Uyku Puanı','Sleep Goal':'Uyku Hedefi','Sleep Stages':'Uyku Evreleri','Load Context':'Yük Yorumu'};
    var finalLabels={'Recovery Debt':'Toparlanma Durumu','Back':'Sırt','Chest':'Göğüs','Rear Delt':'Arka Omuz','Biceps':'Biseps','Triceps':'Triseps','Side Delt':'Yan Omuz','Scapula':'Kürek Kemiği','Arms':'Kollar','MOTIVATION':'MOTİVASYON'};
    return finalLabels[raw]||map[raw]||extra[raw]||raw;
  }
  var visiblePhrases=[
    ['PREMIUM COACH DASHBOARD','PREMİUM KOÇ PANELİ'],['THIS WEEK VS LAST WEEK','BU HAFTA / GEÇEN HAFTA'],['NEXT SESSION TARGET','SONRAKİ ANTRENMAN HEDEFİ'],['Copy Weekly Coach Report','Haftalık Koç Raporunu Kopyala'],['PROGRAM QUALITY','PROGRAM KALİTESİ'],['RECOVERY DEBT','TOPARLANMA DURUMU'],['WEEKLY FOCUS','HAFTALIK ODAK'],['COACH VERDICT','KOÇ KARARI'],['WEEKLY EXPORT','HAFTALIK RAPOR'],['Activity Session','Aktivite Oturumu'],['ACTIVITY SESSION','AKTİVİTE OTURUMU'],['Workout Logger','Antrenman Günlüğü'],['Program Intelligence','Program Analizi'],['Monthly Review','Aylık Değerlendirme'],['Daily Summary','Günlük Özet'],['Weekly Summary','Haftalık Özet'],['Data Center','Veri Merkezi'],['Cloud Sync','Bulut Senkronizasyonu'],['Universal Import','Evrensel İçe Aktarım'],['Total Workout Days','Toplam Antrenman Günü'],['Raw Performance','Performans Özeti'],['RAW PERFORMANCE','PERFORMANS ÖZETİ'],['Next Target','Sonraki Hedef'],['Latest Activity','Son Aktivite'],['Latest Workout','Son Antrenman'],['Latest Sleep','Son Uyku'],['Latest HRV','Son HRV'],['Nightly HR','Gece Nabzı'],['Recovery Nights','Toparlanma Geceleri'],['Readiness Mode','Hazırlık Modu'],['Activity Min','Aktivite Süresi'],['Activity Days','Aktivite Günleri'],['Gym Days','Gym Günleri'],['Total Sets','Toplam Set'],['Weekly Volume','Haftalık Hacim'],['Start Time','Başlangıç'],['Sleep Score','Uyku Puanı'],['Sleep Goal','Uyku Hedefi'],['Sleep Stages','Uyku Evreleri'],['Load Context','Yük Yorumu'],['Manual Sync','Elle Senkronize Et'],['Last Sync','Son Senkronizasyon'],['Connection','Bağlantı'],['Connected','Bağlı'],['Disconnected','Bağlı Değil'],['Readiness','Hazırlık'],['Overview','Genel Bakış'],['Recovery','Toparlanma'],['Sleep','Uyku'],['Load','Yük'],['Coaching','Koçluk'],['Weekly','Haftalık'],['Monthly','Aylık'],['Latest','En Güncel'],['Next','Sonraki'],['Form / Pain','Form / Ağrı'],['Avg RPE','Ortalama RPE']
  ];
  function sentence(value){var result=String(value==null?'':value).replace(/\bMonday\b/gi,'Pazartesi').replace(/\bTuesday\b/gi,'Salı').replace(/\bWednesday\b/gi,'Çarşamba').replace(/\bThursday\b/gi,'Perşembe').replace(/\bFriday\b/gi,'Cuma').replace(/\bSaturday\b/gi,'Cumartesi').replace(/\bSunday\b/gi,'Pazar').replace(/\bOff Day\b/gi,'Dinlenme Günü').replace(/\bPush Strength\b/gi,'İtiş Kuvvet').replace(/\bPull Strength\b/gi,'Çekiş Kuvvet').replace(/\bUpper Pump \+ Posture\b/gi,'Üst Vücut Pump + Postür').replace(/\bFailure\b/gi,'tükeniş').replace(/\bprogression\b/gi,'ilerleme').replace(/\blegacy\b/gi,'eski kaynak');visiblePhrases.forEach(function(pair){result=result.split(pair[0]).join(pair[1]);});return result;}
  window.SimurgLabels={ui:ui,activity:activity,sentence:sentence,value:function(value){return valid(value)?value:null;}};
  window.activityDisplayName=function(value){return activity(value);};

  function normalizePhysical(row,source,date){
    row=row||{};
    var rawActivity=firstText(row.workoutType,row.activityType,row.sport,row.name,row.type);
    return {date:dateValue(row.date)||date,startTime:firstText(row.startTime,row.start_time,row.startedAt,row.time),startMinute:startMinute(firstText(row.startTime,row.start_time,row.startedAt,row.time)),durationMinutes:resolveDuration(row),activeCalories:firstPositive(row.activeCalories,row.activeCal,row.activeEnergy,row.calories,row.kilocalories),totalCalories:firstPositive(row.totalCalories,row.totalCal,row.totalEnergy),avgHR:firstPositive(row.avgHR,row.avgHr,row.averageHeartRate),maxHR:firstPositive(row.maxHR,row.maxHr,row.maximumHeartRate),cardioLoad:firstPositive(row.cardioLoad,row.trainingLoad),activityName:activity(rawActivity),activityKey:activityKey(rawActivity),genericActivity:isGenericActivity(rawActivity),source:source,isPartial:false,raw:row};
  }
  function startMinute(value){var match=String(value||'').match(/(?:^|T)(\d{1,2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):null;}
  function activityKey(value){var key=String(firstText(value)||'aktivite').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/g,' ').trim();if(/functional|strength training|gym|weight|resistance|kuvvet|ağırlık/.test(key))return 'strength';if(/run|running|koş/.test(key))return 'running';if(/walk|walking|yürüy/.test(key))return 'walking';if(/cycl|bike|bisiklet/.test(key))return 'cycling';if(/swim|yüz/.test(key))return 'swimming';return key||'aktivite';}
  function isGenericActivity(value){var key=String(firstText(value)||'').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/g,' ').trim();return /^(?:workout|fitness|training|exercise|activity|antrenman|aktivite)$/.test(key);}
  function closeCalories(a,b){var av=firstPositive(a&&a.activeCalories,a&&a.totalCalories),bv=firstPositive(b&&b.activeCalories,b&&b.totalCalories);if(av==null||bv==null)return false;return Math.abs(av-bv)/Math.max(av,bv)<=.15;}
  function compatibleActivity(a,b){if(!a||!b)return false;if(a.activityKey===b.activityKey&&!a.genericActivity&&!b.genericActivity)return true;if(!a.genericActivity&&!b.genericActivity)return false;if(a.genericActivity&&b.genericActivity)return true;var hrCompatible=a.avgHR!=null&&b.avgHR!=null&&Math.abs(a.avgHR-b.avgHR)<=5;return hrCompatible||closeCalories(a,b);}
  function tolerantDuplicate(a,b){return !!(a&&b&&a.source!==b.source&&((a.source==='Polar'&&b.source==='Apple Health')||(a.source==='Apple Health'&&b.source==='Polar'))&&a.date===b.date&&a.startMinute!=null&&b.startMinute!=null&&a.durationMinutes>0&&b.durationMinutes>0&&Math.abs(a.startMinute-b.startMinute)<=5&&Math.abs(a.durationMinutes-b.durationMinutes)<=2&&compatibleActivity(a,b));}
  function uniqueExact(items){var out=[];items.forEach(function(item){var duplicate=out.some(function(current){return current.date===item.date&&current.startMinute===item.startMinute&&current.durationMinutes!=null&&item.durationMinutes!=null&&Math.abs(current.durationMinutes-item.durationMinutes)<.01&&current.activityKey===item.activityKey;});if(!duplicate)out.push(item);});return out;}
  function gymRows(date){return (root().workouts||[]).filter(function(row){return row&&row.date===date;});}
  function gymSummary(rows){
    var sets=0,reps=0,volume=0,rpes=[],forms=[],pains=[];
    rows.forEach(function(row){var count=firstNumber(row.sets,1)||1,rep=number(row.reps)||0,weight=number(row.weight)||0,rpe=number(row.rpe);sets+=count;reps+=rep*count;volume+=weight*rep*count;if(rpe!=null)rpes.push(rpe);var form=firstText(row.form);if(form)forms.push(ui(title(form)));var pain=firstText(row.pain);if(pain)pains.push(ui(title(pain)));});
    return {rows:rows,sets:sets,reps:reps,volume:volume,rpe:rpes.length?rpes.reduce(function(a,b){return a+b;},0)/rpes.length:null,form:forms.length?forms[forms.length-1]:null,pain:pains.length?pains[pains.length-1]:null};
  }
  function recoveryAt(date){
    var data=root(),entry=daily(data.polarNightlyRecharge,date)||daily({daily:data.recoveryEntries||{}},date)||((data.recovery||[]).filter(function(x){return x&&x.date===date;}).slice(-1)[0])||{};
    return {hrv:firstNumber(entry.heartRateVariabilityAvg,entry.hrvMs,entry.hrv),nightlyHR:firstNumber(entry.heartRateAvg,entry.nightlyHR,entry.restingHr,entry.rhr),breathingRate:firstNumber(entry.breathingRateAvg,entry.breathingRate,entry.respiratoryRate),nightlyRechargeStatus:firstText(entry.nightlyRechargeStatus,entry.status),ansCharge:firstNumber(entry.ansCharge,entry.ansChargeScore)};
  }
  function sleepAt(date){var entry=daily(root().polarSleep,date)||{};return {sleepScore:firstNumber(entry.sleepScore),durationMinutes:firstNumber(entry.durationMinutes,duration(entry.duration),number(entry.durationSeconds)!=null?number(entry.durationSeconds)/60:null),deepSleep:firstNumber(entry.deepSleepMinutes,number(entry.deepSleep)!=null?number(entry.deepSleep)/60:null),remSleep:firstNumber(entry.remSleepMinutes,number(entry.remSleep)!=null?number(entry.remSleep)/60:null),lightSleep:firstNumber(entry.lightSleepMinutes,number(entry.lightSleep)!=null?number(entry.lightSleep)/60:null),awakeTime:firstNumber(entry.awakeTimeMinutes,number(entry.awakeTime)!=null?number(entry.awakeTime)/60:null),continuity:firstNumber(entry.continuity,entry.sleepContinuity)};}
  function sameDateRecord(value,date){return value&&typeof value==='object'&&(!dateValue(value.date)||value.date===date)?value:null;}
  function rawLoadStatus(entry){
    for(var i=0;i<3;i++){var value=[entry.cardioLoadStatus,entry.loadStatus,entry.status][i];if(value!=null&&String(value).trim())return value;}
    return null;
  }
  function unavailableLoadStatus(value){return /^(?:LOAD_STATUS_)?NOT_AVAILABLE$/i.test(String(value==null?'':value).trim());}
  function loadStatusLabel(value,available,source){
    if(!available)return 'Henüz hesaplanmadı';
    if(source!=='Polar Cardio Load')return 'Mevcut';
    var key=String(value==null?'':value).trim().replace(/^LOAD_STATUS_/i,'').toUpperCase(),labels={PRODUCTIVE:'Üretken',MAINTAINING:'Dengeli',DETRAINING:'Yük Azalıyor',OVERREACHING:'Yüksek',STRAINED:'Yüksek',BALANCED:'Dengeli'};
    return labels[key]||text(value)||'Mevcut';
  }
  function primaryPolarWorkout(data,date){
    var selected=null;
    try{var session=window.SimurgWorkoutSource&&typeof window.SimurgWorkoutSource.day==='function'?window.SimurgWorkoutSource.day(date):null;selected=sameDateRecord(session&&session.primaryPolar,date);}catch(e){}
    if(selected)return selected;
    var rows=list(data.polarWorkouts&&data.polarWorkouts.daily&&data.polarWorkouts.daily[date]).filter(function(row){return sameDateRecord(row,date);});
    return rows[0]||null;
  }
  function loadAt(date){
    date=dateValue(date);if(!date)return null;
    var data=root(),entry=sameDateRecord(daily(data.polarCardioLoad,date),date)||{},statusRaw=rawLoadStatus(entry);
    var cardioLoad=firstNumber(entry.cardioLoad,entry.load),strain=firstNumber(entry.strain),tolerance=firstNumber(entry.tolerance),ratio=firstNumber(entry.cardioLoadRatio,entry.ratio,entry.strainToleranceRatio);
    if(ratio==null&&strain!=null&&tolerance>0)ratio=strain/tolerance;
    var cardioNumbers=[cardioLoad,strain,tolerance,ratio].filter(function(value){return value!=null;}),onlyZeroSentinels=cardioNumbers.length>0&&cardioNumbers.every(function(value){return value===0;}),meaningfulStatus=statusRaw!=null&&!/^(?:0|null|undefined|nan)$/i.test(String(statusRaw).trim());
    var cardioRecordAvailable=cardioLoad!=null&&!unavailableLoadStatus(statusRaw)&&!(!meaningfulStatus&&onlyZeroSentinels);
    var workout=primaryPolarWorkout(data,date),bridge=sameDateRecord(daily(data.polarBridge,date),date),recovery=sameDateRecord(daily({daily:data.recoveryEntries||{}},date),date),legacy=sameDateRecord((data.recovery||[]).filter(function(row){return row&&row.date===date;}).slice(-1)[0],date);
    var candidates=[
      {value:cardioRecordAvailable?cardioLoad:null,source:'Polar Cardio Load',record:entry},
      {value:firstNumber(workout&&workout.cardioLoad,workout&&workout.trainingLoad),source:'Polar Workout',record:workout},
      {value:firstNumber(bridge&&bridge.cardioLoad),source:'Polar Bridge',record:bridge},
      {value:firstNumber(recovery&&recovery.activityLoad,recovery&&recovery.physicalLoad),source:'Recovery',record:recovery},
      {value:firstNumber(legacy&&legacy.activityLoad,legacy&&legacy.physicalLoad,legacy&&legacy.cardioLoad,legacy&&legacy.load),source:'Recovery',record:legacy}
    ],selected=null;
    for(var i=0;i<candidates.length;i++){if(candidates[i].value!=null){selected=candidates[i];break;}}
    var available=!!selected,cardioFieldsAvailable=!unavailableLoadStatus(statusRaw)&&!(!meaningfulStatus&&onlyZeroSentinels);
    return {date:date,value:available?selected.value:null,cardioLoad:cardioFieldsAvailable?cardioLoad:null,strain:cardioFieldsAvailable?strain:null,tolerance:cardioFieldsAvailable?tolerance:null,ratio:cardioFieldsAvailable?ratio:null,statusRaw:statusRaw,statusLabel:loadStatusLabel(statusRaw,available,selected&&selected.source),available:available,source:available?selected.source:'None',sourceDate:available?(dateValue(selected.record&&selected.record.date)||date):null};
  }
  function hasValues(object){return Object.keys(object||{}).some(function(key){return key!=='rows'&&valid(object[key]);});}
  function day(date){
    date=dateValue(date);if(!date)return null;
    var data=root(),source=window.SimurgWorkoutSource&&typeof window.SimurgWorkoutSource.day==='function'?window.SimurgWorkoutSource.day(date):null,gym=gymSummary(source&&source.gym||gymRows(date));
    var allPolar=uniqueExact(list(source&&source.polar||(data.polarWorkouts&&data.polarWorkouts.daily&&data.polarWorkouts.daily[date])).filter(Boolean).map(function(row){return normalizePhysical(row,'Polar',date);}));
    var allApple=uniqueExact(list(source&&source.apple||(data.appleWatch||[]).filter(function(row){return row&&row.date===date;})).filter(function(row){return !window.SimurgWorkoutSource||!window.SimurgWorkoutSource.validApple||window.SimurgWorkoutSource.validApple(row);}).map(function(row){return normalizePhysical(row,'Apple Health',date);}));
    var partialSessions=allPolar.concat(allApple).filter(function(item){return !(item.durationMinutes>0);}).map(function(item){return Object.assign({},item,{isPartial:true});});
    var polar=allPolar.filter(function(item){return item.durationMinutes>0;}),apple=allApple.filter(function(item){return item.durationMinutes>0;});
    apple=apple.filter(function(item){return !polar.some(function(polarItem){return tolerantDuplicate(polarItem,item);});});
    var sessions=polar.concat(apple),primary=null;if(polar.length)primary=Object.assign({},polar[0],{source:gym.rows.length?'Polar + Gym':'Polar'});else if(gym.rows.length)primary={date:date,startTime:firstText(gym.rows[0]&&gym.rows[0].startTime),durationMinutes:resolveDuration(gym.rows[0]),activeCalories:null,totalCalories:null,avgHR:null,maxHR:null,cardioLoad:null,activityName:activity(firstText(gym.rows[0]&&gym.rows[0].activityName,gym.rows[0]&&gym.rows[0].program,'Gym')),source:'Gym',raw:null};else if(apple.length)primary=apple[0];if(primary){primary.polar=polar.map(function(x){return x.raw;});primary.gym=gym.rows;primary.primaryPolar=polar[0]&&polar[0].raw||null;primary.appleLegacy=!polar.length&&apple[0]&&apple[0].raw||null;}
    var recovery=recoveryAt(date),sleep=sleepAt(date),load=loadAt(date),readiness=null;
    if(window.SimurgReadiness&&typeof window.SimurgReadiness.resolve==='function')try{readiness=window.SimurgReadiness.resolve(date);}catch(e){}
    return {date:date,session:primary,sessions:sessions,partialSessions:partialSessions,polarSessions:polar,appleSessions:apple,recovery:recovery,sleep:sleep,load:load,gym:gym,readiness:readiness,hasReadinessSignal:hasValues(recovery)||hasValues(sleep)||load.available,hasWorkout:!!(gym.rows.length||sessions.length),hasActivity:!!sessions.length,hasData:!!(gym.rows.length||sessions.length||partialSessions.length||hasValues(recovery)||hasValues(sleep)||load.available)};
  }
  function bodyGroups(rows){var groups={};rows.forEach(function(row){var key=firstText(row.bodyPart,row.category,row.classification)||'Diğer';(groups[key]=groups[key]||[]).push(row);});return groups;}
  function prSummary(rows,start,end){
    var grouped={};(root().workouts||[]).filter(function(row){return row&&row.exercise&&dateValue(row.date);}).forEach(function(row){var ex=String(row.exercise).trim(),key=ex.toLocaleLowerCase('tr-TR')+'|'+row.date,session=grouped[key]||(grouped[key]={date:row.date,exercise:ex,weight:0,volume:0,reps:0});var weight=number(row.weight)||0,reps=number(row.reps)||0,sets=firstNumber(row.sets,1)||1;session.volume+=weight*reps*sets;if(weight>session.weight){session.weight=weight;session.reps=reps;}});
    var sessions=Object.keys(grouped).map(function(key){return grouped[key];}).sort(function(a,b){return a.date.localeCompare(b.date)||a.exercise.localeCompare(b.exercise,'tr');}),best={},history=[];
    sessions.forEach(function(session){var key=session.exercise.toLocaleLowerCase('tr-TR'),known=!!best[key],current=best[key]||(best[key]={exercise:session.exercise,weight:0,volume:0,weightDate:null,volumeDate:null}),types=[];if(known&&session.weight>current.weight)types.push('Ağırlık');if(known&&session.volume>current.volume)types.push('Hacim');if(session.weight>current.weight){current.weight=session.weight;current.weightDate=session.date;}if(session.volume>current.volume){current.volume=session.volume;current.volumeDate=session.date;}if(types.length)history.push({date:session.date,exercise:session.exercise,types:types,weight:session.weight,volume:session.volume,reps:session.reps});});
    var selected=history.filter(function(event){return event.date>=start&&event.date<=end;});
    return {current:best,newEvents:selected,newCount:selected.length,history:history};
  }
  function aggregate(dates,key,cache){
    var cacheKey=revision+'|'+key,kind=cache===weekCache?'week':'month';if(cache.has(cacheKey)){debug[kind+'Hits']+=1;return cache.get(cacheKey);}debug[kind+'Misses']+=1;
    var days=dates.map(day).filter(Boolean),rows=days.reduce(function(out,item){return out.concat(item.gym.rows);},[]),gymDates=days.filter(function(x){return x.gym.rows.length;}),workoutDates=days.filter(function(x){return x.hasWorkout;}),activityDates=days.filter(function(x){return x.hasActivity;}),physical=days.reduce(function(out,item){return out.concat(item.sessions);},[]),rpes=rows.map(function(x){return number(x.rpe);}).filter(function(x){return x!=null;}),pain=rows.filter(function(x){var s=String(x.pain||'').toLowerCase();return valid(x.pain)&&!/^(?:none|no|yok|0)$/.test(s);}),bad=rows.filter(function(x){return /bad|poor|kötü/i.test(String(x.form||''));}),sets=gymDates.reduce(function(sum,x){return sum+x.gym.sets;},0),reps=gymDates.reduce(function(sum,x){return sum+x.gym.reps;},0),volume=gymDates.reduce(function(sum,x){return sum+x.gym.volume;},0);
    var loads=days.map(function(item){return item.load;}),availableLoads=loads.filter(function(item){return item.available;});
    var result={key:key,startDate:dates[0],endDate:dates[dates.length-1],dates:dates,days:days,loads:loads,loadSeries:loads.map(function(item){return item.available?item.value:null;}),avgLoad:availableLoads.length?availableLoads.reduce(function(sum,item){return sum+item.value;},0)/availableLoads.length:null,rows:rows,groups:bodyGroups(rows),sessions:days.map(function(x){return x.session;}).filter(Boolean),physicalSessions:physical,gymDays:gymDates.length,workoutDays:workoutDates.length,activityDays:activityDates.length,polarWorkoutCount:physical.filter(function(x){return x.source==='Polar';}).length,activityMinutes:physical.reduce(function(sum,x){return sum+(x.durationMinutes||0);},0),activeCalories:physical.reduce(function(sum,x){return sum+(x.activeCalories||0);},0),sets:sets,reps:reps,volume:volume,avgRpe:rpes.length?rpes.reduce(function(a,b){return a+b;},0)/rpes.length:null,painCount:pain.length,badFormCount:bad.length};
    result.stats={sets:sets,reps:reps,volume:volume,vol:volume,exercises:new Set(rows.map(function(x){return x.exercise;}).filter(Boolean)).size};result.minutes=result.activityMinutes;result.cal=result.activeCalories;result.avgRpe=result.avgRpe;result.prs=prSummary(rows,result.startDate,result.endDate);
    var selected=null;try{selected=dateValue(selectedDate);}catch(e){selected=dateValue(window.selectedDate);}if(selected&&dates.indexOf(selected)>=0)result.analysisDate=selected;else{var signalDays=days.filter(function(x){return x.hasReadinessSignal;}),workoutSignalDays=days.filter(function(x){return x.hasWorkout;});result.analysisDate=signalDays.length?signalDays[signalDays.length-1].date:(workoutSignalDays.length?workoutSignalDays[workoutSignalDays.length-1].date:null);}
    cache.set(cacheKey,result);return result;
  }
  function week(startDate){startDate=dateValue(startDate);if(!startDate)return null;var selected='';try{selected=dateValue(selectedDate)||'';}catch(e){selected=dateValue(window.selectedDate)||'';}return aggregate(Array.from({length:7},function(_,i){return add(startDate,i);}),startDate+'|'+selected,weekCache);}
  function month(monthKey){if(!/^\d{4}-\d{2}$/.test(String(monthKey||'')))return null;return aggregate(monthDays(monthKey),monthKey,monthCache);}
  function targetClass(exercise,rows){var source=(exercise+' '+rows.map(function(x){return [x.bodyPart,x.category,x.classification].join(' ');}).join(' ')).toLowerCase();if(/prone y raise|face pull|rear delt cable fly|lateral raise|stability|posture|scapula/.test(source))return 'Stability/Posture';if(/cardio|conditioning|run|cycle/.test(source))return 'Conditioning';if(/bench|squat|deadlift|press|row/.test(source))return 'Main Lift';return 'Accessory';}
  function safeTarget(exercise,rows,requested){
    rows=rows||[];var cls=targetClass(exercise,rows),rpes=rows.map(function(x){return number(x.rpe);}).filter(function(x){return x!=null;}),rpe=rpes.length?rpes.reduce(function(a,b){return a+b;},0)/rpes.length:null,form=firstText(rows.slice(-1)[0]&&rows.slice(-1)[0].form),pain=firstText(rows.slice(-1)[0]&&rows.slice(-1)[0].pain),unsafePain=valid(pain)&&!/^(?:none|no|yok|0)$/i.test(pain),unsafeForm=valid(form)&&!/^(?:good|iyi)$/i.test(form),aggressive=/\+|artır|increase|yükselt|daha ağır|kg/i.test(String(requested||''));
    if(unsafePain||unsafeForm)return 'Yük artırma; teknik, kontrollü tempo ve ağrısız uygulamayı koru.';
    if(cls==='Stability/Posture')return 'Ağırlığı koru; tempo, kontrol, teknik ve ağrısız uygulamaya öncelik ver.';
    if(rpe!=null&&rpe>=9)return 'Yükü ve tekrar hedefini koru; bu seansta artış yapma.';
    if(rpe!=null&&rpe>=8)return 'Mevcut hedefi koru; yalnızca temiz tekrarları tamamla.';
    if(requested&&!aggressive)return text(requested);
    if(cls==='Main Lift'&&rpe!=null&&rpe>=6&&rpe<=7)return 'Form korunursa 1 tekrar veya küçük bir kilo artışı dene.';
    if(cls==='Accessory')return 'Temiz form korunursa küçük ve temkinli bir ilerleme dene.';
    if(cls==='Conditioning')return 'Yoğunluğu kontrollü tut; süreyi yalnızca iyi toleransta artır.';
    return text(requested)||'Son temiz performansı koru.';
  }
  function invalidate(reason){revision+=1;weekCache.clear();monthCache.clear();debug.invalidations+=1;debug.lastInvalidation=reason||'unspecified';}
  function debugStats(){return Object.assign({revision:revision,weekSize:weekCache.size,monthSize:monthCache.size},debug);}
  window.SimurgSignalModel={day:day,load:loadAt,week:week,month:month,invalidate:invalidate,debugStats:debugStats,safeTarget:safeTarget,targetClass:targetClass,labels:window.SimurgLabels};
})();
