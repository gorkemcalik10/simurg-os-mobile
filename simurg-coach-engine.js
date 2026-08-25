(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgCoachEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var OUTPUT_SCHEMA_VERSION=1;
  var STORE_SCHEMA_VERSION=1;
  var LOCAL_NARRATIVE_VERSION=1;
  var OUTPUT_SCHEMA={
    type:'object',
    required:[
      'schemaVersion','type','date','generatedAt','inputHash','readinessScore','readinessStatus',
      'confidenceScore','headline','summary','keyDrivers','trainingDecision','loadAdjustmentPercent',
      'workoutGuidance','warnings','recoveryActions','trendInsights','comparisonNotes','missingData','medicalDisclaimer'
    ],
    properties:{
      type:{enum:['daily','pre_workout','post_workout','weekly','pattern']},
      trainingDecision:{enum:['progress','normal','controlled','reduce','recovery','rest']},
      readinessScore:{type:['number','null'],minimum:0,maximum:100},
      confidenceScore:{type:'number',minimum:0,maximum:100},
      loadAdjustmentPercent:{type:'number',minimum:-100,maximum:100}
    }
  };
  var DISCLAIMER='Bu değerlendirme tıbbi teşhis veya tedavi önerisi değildir; performans ve toparlanma desteği amaçlıdır.';
  var DECISION_RANK={progress:0,normal:1,controlled:2,reduce:3,recovery:4,rest:5};
  var WINDOW_MINIMUMS={7:4,14:7,28:14};
  var METRICS=['hrv','restingHr','sleepMinutes','sleepScore','cardioLoad','strain','tolerance','cardioLoadRatio'];
  var CATEGORY_LABELS={
    main_lift:'Main Lift',
    accessory:'Accessory',
    stability_posture:'Stability/Posture',
    conditioning:'Conditioning'
  };
  var DEFAULT_CATEGORIES={
    main_lift:[
      'Incline DB Press','Flat DB Press','Bench Supported DB Row','Single Arm Lat Pulldown',
      'Single Arm Cable Row','Hammer Strength High Row','Rope Pushdown','Reverse Grip Pushdown'
    ],
    stability_posture:['Prone Y Raise','Facepull','Rear Delt Cable Fly','Lateral Raise'],
    accessory:['Cable Fly']
  };

  function isObject(value){return !!value&&Object.prototype.toString.call(value)==='[object Object]';}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function number(value){
    if(value==null||value===''||value===false)return null;
    var next=Number(value);
    return Number.isFinite(next)&&next>=0?next:null;
  }
  function firstNumber(){
    for(var i=0;i<arguments.length;i+=1){var value=number(arguments[i]);if(value!=null)return value;}
    return null;
  }
  function text(value){var result=String(value==null?'':value).replace(/\s+/g,' ').trim();return result||null;}
  function list(value){return value==null?[]:(Array.isArray(value)?value:[value]);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function round(value,digits){
    if(value==null||!Number.isFinite(value))return null;
    var factor=Math.pow(10,digits==null?1:digits);
    return Math.round(value*factor)/factor;
  }
  function average(values){
    var valid=values.filter(function(value){return value!=null&&Number.isFinite(value);});
    return valid.length?valid.reduce(function(sum,value){return sum+value;},0)/valid.length:null;
  }
  function deviation(value,baseline){
    return value==null||baseline==null||baseline===0?null:round((value-baseline)/baseline*100,1);
  }
  function parseDate(value){var parts=String(value||'').split('-').map(Number);return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]||1));}
  function dateString(value){return value.getUTCFullYear()+'-'+String(value.getUTCMonth()+1).padStart(2,'0')+'-'+String(value.getUTCDate()).padStart(2,'0');}
  function addDays(value,amount){var date=parseDate(value);date.setUTCDate(date.getUTCDate()+amount);return dateString(date);}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(parseDate(value).getTime());}
  function daily(store,date){
    var value=store&&store.daily&&store.daily[date];
    return Array.isArray(value)?(value[value.length-1]||null):(value||null);
  }
  function durationMinutes(value){
    if(value==null||value==='')return null;
    if(typeof value==='number')return value>10000?value/60:value;
    var raw=String(value).trim(),parts=raw.split(':').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite))return parts[0]*60+parts[1]+parts[2]/60;
    if(parts.length===2&&parts.every(Number.isFinite))return parts[0]*60+parts[1];
    var hours=raw.match(/([\d.,]+)\s*(?:h|sa)/i),minutes=raw.match(/([\d.,]+)\s*(?:m|dk|min)/i);
    var parsed=(hours?Number(hours[1].replace(',','.'))*60:0)+(minutes?Number(minutes[1].replace(',','.')):0);
    return parsed>0?parsed:number(value);
  }
  function stable(value){
    if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
    if(isObject(value))return '{'+Object.keys(value).sort().map(function(key){return JSON.stringify(key)+':'+stable(value[key]);}).join(',')+'}';
    return JSON.stringify(value);
  }
  function inputHash(value){
    var raw=stable(value),hash=2166136261;
    for(var i=0;i<raw.length;i+=1){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return 'fnv1a-'+('00000000'+(hash>>>0).toString(16)).slice(-8);
  }
  function unique(values){
    return values.filter(function(value,index){return value&&values.indexOf(value)===index;});
  }
  function sentence(value){
    var next=text(value);
    if(!next)return null;
    return /[.!?]$/.test(next)?next:next+'.';
  }
  function pick(pool,seed,salt){
    var raw=String(seed||'')+':'+String(salt||''),hash=0;
    for(var i=0;i<raw.length;i+=1)hash=(Math.imul(hash,31)+raw.charCodeAt(i))>>>0;
    return pool[hash%pool.length];
  }
  function metricLabel(metric){
    return {
      hrv:'HRV',restingHr:'gece nabzı',sleepMinutes:'uyku süresi',
      sleepScore:'uyku skoru',cardioLoad:'Cardio Load'
    }[metric]||metric;
  }
  function trendSentence(item){
    if(!item)return null;
    if(item.summary)return sentence(item.summary);
    if(item.changePercent==null)return null;
    if(item.direction==='stable')return metricLabel(item.metric)+' son 7 gün ile önceki 7 gün karşılaştırıldığında belirgin değişim göstermedi; bu görünüm tek başına neden göstermez.';
    return metricLabel(item.metric)+' son 7 gün ile önceki 7 gün karşılaştırıldığında %'+Math.abs(item.changePercent)+' '+(item.direction==='up'?'yükseldi':'düştü')+'; bu değişim tek başına neden göstermez.';
  }
  function decisionSentence(result){
    var action={
      progress:'Ana hareketlerde yalnızca teknik temiz, ağrısız ve hedef RPE aralığında kalan setlerde küçük bir progresyon denenebilir.',
      normal:'Bugünkü program korunabilir; performans hedefini artırmadan planlanan kaliteli setleri tamamlamak uygun görünüyor.',
      controlled:'Bugün kontrollü başlangıç daha güvenli; ilk çalışma setinin form, ağrı ve beklenmedik yorgunluk yanıtına göre devam et.',
      reduce:'Toplam çalışma yükünü azalt ve hacim yerine ağrısız, temiz tekrar kalitesini koru.',
      recovery:'Yoğun performans hedefini geri plana alıp toparlanma odaklı, düşük stresli bir gün seç.',
      rest:'Bugün planlı antrenman yükü yerine dinlenmeyi önceliklendir.'
    }[result.trainingDecision];
    if(result.loadAdjustmentPercent<0&&result.loadAdjustmentPercent>-100)action+=' Motor yaklaşık %'+Math.abs(result.loadAdjustmentPercent)+' yük azaltımı öneriyor.';
    return action;
  }
  function confidenceSentence(result){
    if(result.missingData&&result.missingData.length){
      return 'Analiz güveni %'+result.confidenceScore+' ('+String(result.confidenceLabel||'').toLowerCase()+'); '+result.missingData.slice(0,4).join(', ')+' eksik olduğu için yorum temkinli tutuldu.';
    }
    return 'Analiz güveni %'+result.confidenceScore+' ('+String(result.confidenceLabel||'').toLowerCase()+'); mevcut Polar ve Gym sinyalleri karar için birlikte kullanılabildi.';
  }
  function readinessSentence(result,day){
    if(result.readinessScore==null)return 'Hazırlık puanı için yeterli recovery sinyali yok; bu nedenle sayısal bir sonuç uydurulmadı ve güvenlik kararı mevcut verilerle sınırlandı.';
    var variants=[
      'Bugünkü hazırlık skoru '+result.readinessScore+'/100 olarak hesaplandı.',
      'Kişisel baseline karşılaştırması bugünkü readiness değerini '+result.readinessScore+'/100 seviyesine yerleştiriyor.',
      'Toparlanma sinyallerinin ortak değerlendirmesi '+result.readinessScore+'/100 hazırlık gösteriyor.'
    ];
    var line=pick(variants,result.inputHash,'readiness');
    if(day.recovery.hrv!=null&&result.baseline&&result.baseline.hrv.deviation7!=null)line+=' HRV 7 günlük kişisel ortalamaya göre '+(result.baseline.hrv.deviation7>0?'+':'')+result.baseline.hrv.deviation7+'% sapmış durumda.';
    return line;
  }
  function signalSentences(result,day){
    var lines=[];
    if(day.recovery.sleepMinutes!=null){
      var hours=round(day.recovery.sleepMinutes/60,1);
      var sleep='Uyku süresi '+hours+' saat';
      if(day.recovery.sleepScore!=null)sleep+=' ve uyku skoru '+round(day.recovery.sleepScore,0)+'/100';
      if(result.baseline&&result.baseline.sleepMinutes.deviation7!=null)sleep+=', süre kişisel 7 günlük ortalamaya göre '+(result.baseline.sleepMinutes.deviation7>0?'+':'')+result.baseline.sleepMinutes.deviation7+'%';
      lines.push(sleep+' ölçüldü.');
    }
    if(day.recovery.hrv!=null||day.recovery.restingHr!=null){
      var recovery=[];
      if(day.recovery.hrv!=null)recovery.push('HRV '+round(day.recovery.hrv,1)+' ms');
      if(day.recovery.restingHr!=null)recovery.push('gece nabzı '+round(day.recovery.restingHr,0)+' bpm');
      lines.push(recovery.join(', ')+' olarak kaydedildi; bu değerler kişisel baseline ve diğer sinyallerle birlikte yorumlandı.');
    }
    if(day.load.cardioLoad!=null||day.load.cardioLoadRatio!=null){
      var load=[];
      if(day.load.cardioLoad!=null)load.push('Cardio Load '+round(day.load.cardioLoad,1));
      if(day.load.cardioLoadRatio!=null)load.push('Strain/Tolerance oranı '+round(day.load.cardioLoadRatio,2));
      lines.push(load.join(', ')+'.');
    }
    if(day.gym.rows.length){
      var gym=day.gym.setCount+' set';
      if(day.gym.avgRpe!=null)gym+=', ortalama RPE '+round(day.gym.avgRpe,1);
      if(day.gym.formLevel===1)gym+=', form Okay';
      if(day.gym.formLevel===2)gym+=', form Bad';
      if(day.gym.painLevel===1)gym+=', ağrı kaydı';
      if(day.gym.painLevel===2)gym+=', belirgin ağrı uyarısı';
      lines.push('Gym bağlamında '+gym+' görüldü.');
    }
    return lines;
  }
  function narrativeHeadline(result){
    if(result.type==='pattern')return result.trendInsights.length?'Geçmiş veride izlenmeye değer ilişkiler var':'Patern yorumu için henüz yeterli veri yok';
    if(result.type==='weekly')return {
      progress:'Hafta genelinde kontrollü ilerleme alanı var',normal:'Haftalık plan dengeli görünüyor',
      controlled:'Yeni haftaya kontrollü başlamak uygun',reduce:'Haftalık yükte geri adım gerekli',
      recovery:'Yeni haftada toparlanma öncelikli',rest:'Haftalık yükten tam dinlenmeye geç'
    }[result.trainingDecision];
    var prefix=result.type==='pre_workout'?'Antrenman öncesi karar: ':result.type==='post_workout'?'Seans değerlendirmesi: ':'Bugünün kararı: ';
    return prefix+{
      progress:'kontrollü progresyon değerlendirilebilir',normal:'plan korunabilir',
      controlled:'kontrollü ilerle',reduce:'yükü azalt',recovery:'toparlanmayı önceliklendir',rest:'dinlen'
    }[result.trainingDecision];
  }
  function dynamicRecoveryActions(result,day){
    var actions=(result.recoveryActions||[]).slice();
    if(day.recovery.sleepMinutes==null)actions.push('Uyku süresi kaydı geldikten sonra recovery yorumunu yeniden değerlendir.');
    else if(day.recovery.sleepMinutes<420)actions.push('Bu gece uyku fırsatını uzat ve mümkünse düzenli yatış saatini koru.');
    if(day.gym.painLevel>0)actions.push('Ağrı oluşturan hareket veya açıda yük artırma; ağrısız hareket aralığını koru.');
    if(day.gym.formLevel>0)actions.push('Bir sonraki sette ağırlık yerine tempo, kontrol ve hareket standardını düzelt.');
    if(day.gym.avgRpe!=null&&day.gym.avgRpe>=8)actions.push('Yüksek RPE sonrası ek seti yalnızca form ve ağrı kontrolü olumluysa değerlendir.');
    if(day.load.cardioLoadRatio!=null&&day.load.cardioLoadRatio>=1.3)actions.push('Ek kondisyon hacmi ekleme; mevcut toplam yükün toparlanmasına alan bırak.');
    if(result.confidenceScore<55)actions.push('Eksik veriler tamamlanana kadar agresif hedef değişikliği yapma.');
    return unique(actions).slice(0,6);
  }
  function composeLocalNarrative(result,context){
    context=context||{};
    var day=context.day||{recovery:{},load:{},gym:{rows:[]},physical:{}};
    var seed=result.inputHash+':'+result.date+':'+result.type;
    var leads={
      daily:[
        'Bugünkü karar tek bir ölçüme değil, toparlanma, yük ve antrenman güvenliği sinyallerinin birlikte değerlendirilmesine dayanıyor.',
        'Bugünün koç yorumu Polar toparlanma verileri ile Gym güvenlik kayıtlarını aynı çerçevede ele alıyor.',
        'Mevcut veriler bugünkü kapasiteyi ve antrenman riskini ayrı ayrı değerlendirmeyi gerektiriyor.'
      ],
      pre_workout:[
        'Antrenmana başlamadan önce recovery durumu, son Gym bağlamı ve hareket güvenliği birlikte kontrol edildi.',
        'Bugünkü program için hazırlık sinyalleri ile form, ağrı ve RPE bağlamı birlikte değerlendirildi.',
        'Seans hedefi belirlenirken fizyolojik hazırlık kadar hareket kalitesi ve önceki Gym geri bildirimi de dikkate alındı.'
      ],
      post_workout:[
        'Tamamlanan seans, algılanan efor, form, ağrı ve mevcut kardiyovasküler yük bağlamında değerlendirildi.',
        'Seans sonrası yorum yalnızca yapılan işi değil, bunun toparlanma sinyalleriyle nasıl örtüştüğünü de inceliyor.',
        'Bir sonraki hedef için Gym kaydı ve Polar yük göstergeleri temkinli biçimde birlikte okundu.'
      ],
      weekly:[
        'Haftalık yorum tek bir güne değil, son yedi gündeki hazırlık, aktivite ve en korumacı güvenlik kararına dayanıyor.',
        'Bu haftanın özeti toparlanma sürekliliği ile toplam antrenman yükünü birlikte ele alıyor.',
        'Yeni hafta kararı, yedi günlük sinyallerin ortak yönü ve hafta içindeki risk kayıtları üzerinden oluşturuldu.'
      ],
      pattern:[
        'Pattern Coach yalnızca minimum örnek eşiğini geçen tekrarları raporluyor ve ilişkiyi kesin neden olarak sunmuyor.',
        'Geçmiş kayıtlar benzer koşulların tekrar edip etmediğini görmek için karşılaştırıldı; sonuçlar olası ilişki diliyle ele alındı.',
        'Patern analizi, tekrar eden sinyalleri ararken tesadüfi tek günlük sapmaları trendlerden ayırmaya çalışıyor.'
      ]
    };
    var parts=[pick(leads[result.type]||leads.daily,seed,'lead')];
    if(result.type==='weekly'){
      parts.push(result.keyDrivers.slice(0,3).join('; ')+'.');
    }else if(result.type==='pattern'){
      if(result.trendInsights.length)parts.push(result.trendInsights.slice(0,2).map(trendSentence).filter(Boolean).join(' '));
      else parts.push('Her karşılaştırma grubunda yeterli örnek bulunmadığı için bugün güvenilir bir tekrarlanan ilişki kurulamadı.');
    }else{
      parts.push(readinessSentence(result,day));
      parts=parts.concat(signalSentences(result,day).slice(0,4));
    }
    parts.push(decisionSentence(result));
    if(result.warnings.length)parts.push('Güvenlik katmanında '+result.warnings.slice(0,2).join(' '));
    var trend=(result.trendInsights||[]).map(trendSentence).filter(Boolean)[0];
    if(result.type!=='pattern'&&trend)parts.push('Trend tarafında '+trend);
    parts.push(confidenceSentence(result));
    result.headline=narrativeHeadline(result);
    result.summary=parts.map(sentence).filter(Boolean).join(' ');
    result.recoveryActions=dynamicRecoveryActions(result,day);
    return result;
  }
  function normalizeName(value){
    return String(value||'').toLowerCase().replace(/[^a-z0-9çğıöşü]+/gi,' ').replace(/\s+/g,' ').trim();
  }
  function normalizeCategory(value){
    var key=normalizeName(value).replace(/\s+/g,'_');
    var aliases={
      main:'main_lift',mainlift:'main_lift',main_lift:'main_lift',
      accessory:'accessory',aksesuar:'accessory',
      stability:'stability_posture',posture:'stability_posture',
      stability_posture:'stability_posture',stabilite_postur:'stability_posture',
      conditioning:'conditioning',kondisyon:'conditioning'
    };
    return aliases[key]||null;
  }
  function categoryMap(data,options){
    var map={};
    Object.keys(DEFAULT_CATEGORIES).forEach(function(category){
      DEFAULT_CATEGORIES[category].forEach(function(name){map[normalizeName(name)]=category;});
    });
    var profiles=data&&data.exerciseLoadProfiles||{};
    Object.keys(profiles).forEach(function(key){
      var category=normalizeCategory(profiles[key]&&profiles[key].coachCategory);
      if(category)map[normalizeName(key)]=category;
    });
    var storeOverrides=data&&data.coachIntelligence&&data.coachIntelligence.settings&&data.coachIntelligence.settings.movementCategories||{};
    Object.keys(storeOverrides).forEach(function(key){
      var category=normalizeCategory(storeOverrides[key]);
      if(category)map[normalizeName(key)]=category;
    });
    var optionOverrides=options&&options.movementCategories||{};
    Object.keys(optionOverrides).forEach(function(key){
      var category=normalizeCategory(optionOverrides[key]);
      if(category)map[normalizeName(key)]=category;
    });
    return map;
  }
  function movementCategory(exercise,row,data,options){
    var explicit=normalizeCategory(row&&firstText(row.coachCategory,row.movementCategory,row.classification));
    if(explicit)return explicit;
    var name=normalizeName(exercise),configured=categoryMap(data,options)[name];
    if(configured)return configured;
    var source=name+' '+normalizeName(row&&row.bodyPart)+' '+normalizeName(row&&row.category);
    if(/prone y raise|face pull|rear delt|lateral raise|stability|posture|scapula|rotator/.test(source))return 'stability_posture';
    if(/run|running|cycle|cycling|swim|cardio|conditioning/.test(source))return 'conditioning';
    if(/bench|squat|deadlift|press|row|pulldown|pushdown/.test(source))return 'main_lift';
    return 'accessory';
  }
  function firstText(){
    for(var i=0;i<arguments.length;i+=1){var value=text(arguments[i]);if(value)return value;}
    return null;
  }
  function painLevel(value){
    var key=normalizeName(value);
    if(!key||/^(none|no|yok|0)$/.test(key))return 0;
    if(/warning|severe|high|siddet|şiddet|sharp|keskin/.test(key))return 2;
    return 1;
  }
  function formLevel(value){
    var key=normalizeName(value);
    if(!key)return 0;
    if(/bad|poor|kotu|kötü/.test(key))return 2;
    if(/okay|ok|orta|fair/.test(key))return 1;
    return 0;
  }
  function workoutRows(data,date){return (data.workouts||[]).filter(function(row){return row&&row.date===date;});}
  function polarRows(data,date){return list(data.polarWorkouts&&data.polarWorkouts.daily&&data.polarWorkouts.daily[date]).filter(isObject);}
  function volume(row){
    var sets=firstNumber(row.sets,1)||1,reps=firstNumber(row.reps,0)||0,weight=firstNumber(row.weight,0)||0;
    return sets*reps*weight;
  }
  function activityNames(data,date,polar){
    var names=polar.map(function(row){return firstText(row.workoutType,row.activityType,row.sport,row.name);});
    var activity=daily(data.polarActivity,date);if(activity)names.push(firstText(activity.activityType,activity.type,activity.name));
    (data.appleWatch||[]).filter(function(row){return row&&row.date===date;}).forEach(function(row){names.push(firstText(row.activityType,row.workoutType,row.type,row.activity));});
    return unique(names.filter(Boolean));
  }
  function resolveEnergyContext(data,date,options){
    options=options||{};var result=options.energyContext;
    try{if(typeof options.energyResolver==='function')result=options.energyResolver(date,{data:data,signalDay:options.signalDay});else if(!result&&typeof window!=='undefined'&&window.SimurgEnergyEngine&&typeof window.SimurgEnergyEngine.resolve==='function')result=window.SimurgEnergyEngine.resolve(date,{data:data,signalDay:options.signalDay});}catch(error){result=null;}
    result=result&&typeof result==='object'?result:{};
    return {score:number(result.score),status:text(result.status)||'insufficient',confidence:text(result.confidence)||'insufficient',reasons:list(result.reasons).map(text).filter(Boolean).slice(0,8),action:{trainingRecommendation:text(result.action&&result.action.trainingRecommendation),caution:text(result.action&&result.action.caution)}};
  }
  function resolveRecoveryContext(data,date,options){
    options=options||{};var result=options.recoveryIntelligence;
    try{if(typeof options.recoveryIntelligenceResolver==='function')result=options.recoveryIntelligenceResolver(date,{data:data,signalDay:options.signalDay});else if(!result&&typeof window!=='undefined'&&window.SimurgRecoveryIntelligence&&typeof window.SimurgRecoveryIntelligence.resolve==='function')result=window.SimurgRecoveryIntelligence.resolve(date,{data:data,signalDay:options.signalDay});}catch(error){result=null;}
    result=result&&typeof result==='object'?result:{};
    return {score:number(result.score),status:text(result.status)||'insufficient',reasons:unique(list(result.signals&&result.signals.positive).concat(list(result.signals&&result.signals.negative),list(result.reasons))).map(text).filter(Boolean).slice(0,8),action:{recommendation:text(result.action&&result.action.recommendation),caution:text(result.action&&result.action.caution)}};
  }
  function actualSleepMinutes(sleep){
    sleep=sleep||{};
    var explicit=number(sleep.actualSleepMinutes);
    if(explicit!=null&&explicit>=0)return explicit;
    function stage(minutesKey,secondsKey){var minutes=number(sleep[minutesKey]),seconds=number(sleep[secondsKey]);return minutes!=null?minutes:(seconds!=null?seconds/60:null);}
    var deep=stage('deepSleepMinutes','deepSleep'),rem=stage('remSleepMinutes','remSleep'),light=stage('lightSleepMinutes','lightSleep');
    if(deep==null||rem==null||light==null||deep<0||rem<0||light<0)return null;
    return deep+rem+light;
  }
  function extractDay(data,date,options){
    data=data||{};options=options||{};
    var sharedDay=null;
    if(typeof options.signalDay==='function')try{sharedDay=options.signalDay(date)||null;}catch(error){sharedDay=null;}
    var sleep=daily(data.polarSleep,date)||{},night=daily(data.polarNightlyRecharge,date)||{},load=daily(data.polarCardioLoad,date)||{},sharedLoad=sharedDay&&sharedDay.load||{},aggregate=sharedDay&&sharedDay.polarAggregate||{},activity=daily(data.polarActivity,date)||{},rows=workoutRows(data,date),polar=polarRows(data,date),profile=data.polarProfile&&data.polarProfile.latest||{};
    var rpes=rows.map(function(row){return number(row.rpe);}).filter(function(value){return value!=null;});
    var sleepMinutes=actualSleepMinutes(sleep);
    var categories={main_lift:[],accessory:[],stability_posture:[],conditioning:[]};
    rows.forEach(function(row){
      var category=movementCategory(row.exercise,row,data,options);
      categories[category].push({
        exercise:firstText(row.exercise,'Egzersiz'),
        exerciseId:firstText(row.exerciseId),
        sets:firstNumber(row.sets,1)||1,reps:firstNumber(row.reps,0)||0,
        weight:firstNumber(row.weight,0)||0,rpe:number(row.rpe),
        form:firstText(row.form),pain:firstText(row.pain),category:category
      });
    });
    var names=activityNames(data,date,polar),racket=names.some(function(name){return /tennis|badminton|padel|squash/i.test(name);});
    var workoutMinutes=polar.reduce(function(sum,row){return sum+(firstNumber(row.durationMinutes,durationMinutes(row.duration))||0);},0);
    var activeCalories=polar.reduce(function(sum,row){return sum+(firstNumber(row.activeCal,row.activeCalories,row.calories)||0);},0);
    return {
      date:date,
      recovery:{
        hrv:firstNumber(night.heartRateVariabilityAvg,night.hrvMs,night.hrv),
        restingHr:firstNumber(night.restingHr,night.restingHR,night.heartRateAvg,profile.restingHeartRate),
        breathingRate:firstNumber(night.breathingRateAvg,night.breathingRate),
        nightlyRechargeStatus:firstText(night.nightlyRechargeStatus,night.status),
        ansCharge:firstNumber(night.ansCharge,night.ansChargeScore),
        sleepMinutes:sleepMinutes,
        sleepScore:firstNumber(sleep.sleepScore),
        deepSleepMinutes:firstNumber(sleep.deepSleepMinutes,number(sleep.deepSleep)==null?null:number(sleep.deepSleep)/60),
        remSleepMinutes:firstNumber(sleep.remSleepMinutes,number(sleep.remSleep)==null?null:number(sleep.remSleep)/60),
        lightSleepMinutes:firstNumber(sleep.lightSleepMinutes,number(sleep.lightSleep)==null?null:number(sleep.lightSleep)/60)
      },
      load:{
        cardioLoad:firstNumber(sharedLoad.value,sharedLoad.cardioLoad,load.cardioLoad,load.load),
        strain:firstNumber(sharedLoad.strain,load.strain),
        tolerance:firstNumber(sharedLoad.tolerance,load.tolerance),
        cardioLoadRatio:firstNumber(sharedLoad.ratio,load.cardioLoadRatio,load.ratio,number(load.strain)!=null&&number(load.tolerance)>0?number(load.strain)/number(load.tolerance):null),
        status:firstText(sharedLoad.statusRaw,load.cardioLoadStatus,load.loadStatus,load.status),
        steps:firstNumber(activity.steps),
        activeCalories:firstNumber(activity.activeCalories,activity.activeCal),
        dailyActivity:firstNumber(activity.dailyActivity)
      },
      gym:{
        rows:rows,
        plan:options.gymPlan||null,
        setCount:rows.reduce(function(sum,row){return sum+(firstNumber(row.sets,1)||1);},0),
        volume:rows.reduce(function(sum,row){return sum+volume(row);},0),
        avgRpe:average(rpes),
        painLevel:rows.reduce(function(level,row){return Math.max(level,painLevel(row.pain));},0),
        formLevel:rows.reduce(function(level,row){return Math.max(level,formLevel(row.form));},0),
        categories:categories
      },
      physical:{
        workouts:polar,
        names:names,
        durationMinutes:round(aggregate.sessionCount?aggregate.durationMinutes:workoutMinutes,1),
        activeCalories:round(aggregate.sessionCount?aggregate.activeCalories:activeCalories,0),
        avgHr:aggregate.sessionCount?firstNumber(aggregate.avgHR):average(polar.map(function(row){return firstNumber(row.avgHR,row.averageHeartRate);})),
        maxHr:aggregate.sessionCount?firstNumber(aggregate.maxHR):(polar.reduce(function(max,row){return Math.max(max,firstNumber(row.maxHR,row.maximumHeartRate)||0);},0)||null),
        cardioLoad:aggregate.sessionCount?firstNumber(aggregate.cardioLoad):average(polar.map(function(row){return firstNumber(row.cardioLoad);})),
        racketSport:racket
      }
    };
  }
  function metricValue(day,key){
    if(key==='hrv'||key==='restingHr'||key==='sleepMinutes'||key==='sleepScore')return day.recovery[key];
    return day.load[key];
  }
  function allDataDates(data){
    var dates=[];
    ['polarSleep','polarNightlyRecharge','polarCardioLoad','polarActivity','polarWorkouts'].forEach(function(key){
      Object.keys(data&&data[key]&&data[key].daily||{}).forEach(function(date){if(validDate(date))dates.push(date);});
    });
    (data&&data.workouts||[]).forEach(function(row){if(row&&validDate(row.date))dates.push(row.date);});
    (data&&data.appleWatch||[]).forEach(function(row){if(row&&validDate(row.date))dates.push(row.date);});
    return unique(dates).sort();
  }
  function windowBaseline(days,date,key,windowSize){
    var values=days.filter(function(day){return day.date<date&&day.date>=addDays(date,-windowSize);}).map(function(day){return metricValue(day,key);}).filter(function(value){return value!=null;});
    var mean=average(values),minimum=WINDOW_MINIMUMS[windowSize];
    return {windowDays:windowSize,sampleSize:values.length,minimumSamples:minimum,qualified:values.length>=minimum,mean:round(mean,1),min:values.length?Math.min.apply(Math,values):null,max:values.length?Math.max.apply(Math,values):null};
  }
  function baselines(data,date,options){
    var start=addDays(date,-28),days=[];
    for(var cursor=start;cursor<date;cursor=addDays(cursor,1))days.push(extractDay(data,cursor,options));
    var output={};
    METRICS.forEach(function(key){
      output[key]={};
      [7,14,28].forEach(function(size){output[key][size]=windowBaseline(days,date,key,size);});
      var current=metricValue(extractDay(data,date,options),key);
      output[key].current=current;
      output[key].deviation7=deviation(current,output[key][7].qualified?output[key][7].mean:null);
      output[key].deviation14=deviation(current,output[key][14].qualified?output[key][14].mean:null);
      output[key].deviation28=deviation(current,output[key][28].qualified?output[key][28].mean:null);
    });
    return output;
  }
  function trendForMetric(data,date,key,options){
    var recent=[],previous=[];
    for(var i=1;i<=14;i+=1){
      var value=metricValue(extractDay(data,addDays(date,-i),options),key);
      if(value!=null)(i<=7?recent:previous).push(value);
    }
    var recentMean=average(recent),previousMean=average(previous),change=deviation(recentMean,previousMean);
    return {
      metric:key,recentSampleSize:recent.length,previousSampleSize:previous.length,
      recentMean:round(recentMean,1),previousMean:round(previousMean,1),changePercent:change,
      direction:change==null||Math.abs(change)<3?'stable':(change>0?'up':'down'),
      qualified:recent.length>=4&&previous.length>=4
    };
  }
  function missingData(day,baseline){
    var missing=[];
    if(day.recovery.hrv==null)missing.push('HRV');
    if(day.recovery.restingHr==null)missing.push('Dinlenik/gece nabzı');
    if(day.recovery.sleepMinutes==null)missing.push('Uyku süresi');
    if(day.recovery.sleepScore==null)missing.push('Uyku skoru');
    if(day.load.cardioLoad==null&&day.load.cardioLoadRatio==null)missing.push('Cardio Load');
    if(day.gym.rows.length&&day.gym.avgRpe==null)missing.push('Gym RPE');
    if(day.gym.rows.length&&!day.gym.rows.some(function(row){return text(row.form);}))missing.push('Gym Form');
    var qualified=['hrv','restingHr','sleepMinutes','sleepScore','cardioLoad'].filter(function(key){return baseline[key][7].qualified;}).length;
    if(qualified<3)missing.push('Yeterli 7 günlük kişisel baseline');
    return missing;
  }
  function confidence(day,baseline,missing){
    var present=[
      day.recovery.hrv,day.recovery.restingHr,day.recovery.sleepMinutes,
      day.recovery.sleepScore,day.load.cardioLoad!=null?day.load.cardioLoad:day.load.cardioLoadRatio
    ].filter(function(value){return value!=null;}).length;
    var qualified7=METRICS.filter(function(key){return baseline[key][7].qualified;}).length;
    var qualified28=METRICS.filter(function(key){return baseline[key][28].qualified;}).length;
    var score=10+present*9+Math.min(28,qualified7*4)+Math.min(17,qualified28*3);
    if(day.gym.rows.length&&day.gym.avgRpe!=null)score+=4;
    score=clamp(Math.round(score),10,100);
    return {score:score,label:score>=80?'Yüksek':score>=55?'Orta':'Düşük',missing:missing};
  }
  function readiness(day,baseline,confidenceResult){
    var present=[day.recovery.hrv,day.recovery.restingHr,day.recovery.sleepMinutes,day.recovery.sleepScore].filter(function(value){return value!=null;}).length;
    if(present<2)return {score:null,status:'insufficient',drivers:['Toparlanma skoru için en az iki temel sinyal gerekli.'],negativeSignals:[]};
    var score=75,drivers=[],negative=[];
    function apply(metric,positiveDirection,weight,label){
      var dev=baseline[metric].deviation7;
      if(dev==null)return;
      var adjusted=positiveDirection?dev:-dev;
      var delta=clamp(adjusted/10*weight,-weight*2,weight*1.5);
      score+=delta;
      if(Math.abs(dev)>=5)drivers.push(label+' kişisel 7 günlük ortalamaya göre '+(dev>0?'+':'')+dev+'%.');
      if(adjusted<=-8)negative.push(metric);
    }
    apply('hrv',true,6,'HRV');
    apply('restingHr',false,6,'Dinlenik/gece nabzı');
    apply('sleepMinutes',true,5,'Uyku süresi');
    apply('sleepScore',true,5,'Uyku skoru');
    apply('cardioLoad',false,4,'Cardio Load');
    if(day.recovery.sleepMinutes!=null&&day.recovery.sleepMinutes<360){score-=10;negative.push('sleepMinutes');drivers.push('Uyku süresi 6 saatin altında.');}
    if(day.recovery.sleepScore!=null&&day.recovery.sleepScore<60){score-=8;negative.push('sleepScore');drivers.push('Uyku skoru düşük aralıkta.');}
    if(day.load.cardioLoadRatio!=null&&day.load.cardioLoadRatio>=1.3){score-=10;negative.push('cardioLoadRatio');drivers.push('Strain/Tolerance oranı yüksek.');}
    score=clamp(Math.round(score),20,98);
    if(confidenceResult.score<40)score=Math.min(score,75);
    return {
      score:score,
      status:score>=80?'good':score>=65?'normal':score>=50?'controlled':'low',
      drivers:unique(drivers).slice(0,6),
      negativeSignals:unique(negative)
    };
  }
  function enforceDecision(current,next){return DECISION_RANK[next]>DECISION_RANK[current]?next:current;}
  function movementGuidance(day,decision,data,options){
    var guidance={mainLifts:'Ana hareketlerde mevcut hedefi koru.',accessories:'Aksesuarları temiz tekrarlarla uygula.',stabilityPosture:'Tempo, kontrol ve ağrısız uygulamayı önceliklendir.',conditioning:'Kondisyon yükünü toparlanma durumuna göre kontrollü tut.'};
    var categories=day.gym.categories;
    if(decision==='progress')guidance.mainLifts='Pain None + Form Good + RPE 6–7 olan ana harekette +1 tekrar veya küçük yük artışı değerlendirilebilir.';
    if(DECISION_RANK[decision]>=DECISION_RANK.controlled)guidance.mainLifts='Ana hareketlerde yük artırma; ilk çalışma setini kontrollü değerlendir.';
    if(DECISION_RANK[decision]>=DECISION_RANK.reduce)guidance.accessories='Aksesuar hacmini azalt veya minimum etkili dozda tut.';
    if(day.physical.racketSport)guidance.mainLifts+=' Raket sporu sonrası press/row başlangıcında önkol, dirsek ve omuz toleransını kontrol et.';
    if(categories.stability_posture.length)guidance.stabilityPosture='Stability/posture hareketlerinde agresif kilo hedefi verme; tempo, kontrol, teknik ve ağrısız uygulamayı koru.';
    return guidance;
  }
  function safety(day,readinessResult,data,options){
    var decision=readinessResult.score==null?'controlled':readinessResult.score>=82?'progress':readinessResult.score>=65?'normal':readinessResult.score>=50?'controlled':readinessResult.score>=35?'reduce':'recovery';
    var warnings=[],drivers=[],recoveryActions=[],pain=day.gym.painLevel,form=day.gym.formLevel;
    if(pain===1){decision=enforceDecision(decision,'controlled');warnings.push('Ağrı kaydı varken yük veya progresyon önerilmez.');}
    if(pain===2){decision=enforceDecision(decision,'recovery');warnings.push('Belirgin ağrı uyarısı nedeniyle performans hedefi baskılandı.');}
    if(form===1){decision=enforceDecision(decision,'controlled');warnings.push('Form Okay iken ağırlık artırma; hareketi temizle ve sadeleştir.');}
    if(form===2){decision=enforceDecision(decision,'reduce');warnings.push('Form Bad kaydı nedeniyle yük ve hacim azaltılmalı.');}
    if(day.gym.avgRpe!=null&&day.gym.avgRpe>=9){decision=enforceDecision(decision,'reduce');warnings.push('RPE 9+ agresif artışı engelliyor.');}
    else if(day.gym.avgRpe!=null&&day.gym.avgRpe>=8){decision=enforceDecision(decision,'normal');drivers.push('RPE 8: performans korunabilir ancak hedef artırılmamalı.');}
    var stabilityRows=day.gym.categories.stability_posture;
    if(stabilityRows.length){
      drivers.push('Stability/posture hareketlerinde yük yerine tempo ve kontrol öncelikli.');
      if(!day.gym.categories.main_lift.length)decision=enforceDecision(decision,'normal');
    }
    if(readinessResult.negativeSignals.length>=2){decision=enforceDecision(decision,'reduce');warnings.push('Birden fazla olumsuz toparlanma sinyali birlikte görülüyor.');}
    if(readinessResult.negativeSignals.length>=3){decision=enforceDecision(decision,'recovery');}
    if(day.physical.racketSport){decision=enforceDecision(decision,'controlled');warnings.push('Tenis/badminton sonrası önkol, dirsek ve omuz yükü için kontrollü başlangıç gerekli.');}
    if(readinessResult.score==null)warnings.push('Eksik recovery verisi nedeniyle progresyon önerisi üretilmedi.');
    if(DECISION_RANK[decision]>=DECISION_RANK.reduce)recoveryActions.push('Toplam set veya çalışma yükünü azalt; ağrısız kaliteli tekrarları koru.');
    if(day.recovery.sleepMinutes!=null&&day.recovery.sleepMinutes<420)recoveryActions.push('Bu gece uyku süresini kişisel hedefe yaklaştır.');
    recoveryActions.push('İlk çalışma setinden sonra form, ağrı ve beklenmedik yorgunluğu yeniden değerlendir.');
    var adjustment={progress:0,normal:0,controlled:-5,reduce:-15,recovery:-25,rest:-100}[decision];
    return {decision:decision,loadAdjustmentPercent:adjustment,warnings:unique(warnings),drivers:drivers,recoveryActions:unique(recoveryActions)};
  }
  function comparableDays(data,date,day,options){
    var candidates=allDataDates(data).filter(function(value){return value<date;}).map(function(value){return extractDay(data,value,options);});
    var scored=candidates.map(function(candidate){
      var pairs=[
        [day.recovery.hrv,candidate.recovery.hrv],
        [day.recovery.sleepMinutes,candidate.recovery.sleepMinutes],
        [day.recovery.restingHr,candidate.recovery.restingHr],
        [day.load.cardioLoad,candidate.load.cardioLoad]
      ].filter(function(pair){return pair[0]!=null&&pair[1]!=null;});
      if(pairs.length<2)return null;
      var distance=average(pairs.map(function(pair){return Math.abs(pair[0]-pair[1])/Math.max(1,Math.abs(pair[0]));}));
      return {date:candidate.date,distance:distance,signals:pairs.length,avgRpe:candidate.gym.avgRpe};
    }).filter(Boolean).sort(function(a,b){return a.distance-b.distance;});
    return scored.filter(function(item){return item.distance<=0.18;}).slice(0,3);
  }
  function baseOutput(type,date,features,baseline,readinessResult,confidenceResult,safetyResult,recoveryContext,energy){
    var status=readinessResult.status,decision=safetyResult.decision;
    var headline=readinessResult.score==null?'Veri eksik — kontrollü karar':decision==='progress'?'Kontrollü progresyon değerlendirilebilir':decision==='normal'?'Plan korunabilir':decision==='controlled'?'Kontrollü ilerle':decision==='reduce'?'Yükü azalt':'Toparlanmayı önceliklendir';
    var summary=readinessResult.score==null?'Toparlanma verisi kesin bir hazırlık skoru için yetersiz; güvenlik kuralları yine de uygulanıyor.':'Hazırlık skoru kişisel baseline sapmalarıyla, antrenman kararı ise bağımsız güvenlik kurallarıyla oluşturuldu.';
    var safeFeatures={
      type:type,date:date,localNarrativeVersion:LOCAL_NARRATIVE_VERSION,recovery:features.recovery,load:features.load,
      gym:{setCount:features.gym.setCount,volume:features.gym.volume,avgRpe:features.gym.avgRpe,painLevel:features.gym.painLevel,formLevel:features.gym.formLevel},
      physical:{names:features.physical.names,durationMinutes:features.physical.durationMinutes,avgHr:features.physical.avgHr,maxHr:features.physical.maxHr,racketSport:features.physical.racketSport},
      baselines:baseline,decision:decision,recoveryIntelligence:recoveryContext,energy:energy
    };
    return {
      schemaVersion:OUTPUT_SCHEMA_VERSION,type:type,date:date,generatedAt:new Date().toISOString(),inputHash:inputHash(safeFeatures),
      readinessScore:readinessResult.score,readinessStatus:status,confidenceScore:confidenceResult.score,confidenceLabel:confidenceResult.label,
      recoveryScore:recoveryContext.score,recoveryStatus:recoveryContext.status,recoveryReasons:recoveryContext.reasons,recoveryAction:recoveryContext.action,
      energyScore:energy.score,energyStatus:energy.status,energyConfidence:energy.confidence,energyReasons:energy.reasons,energyAction:energy.action,
      headline:headline,summary:summary,keyDrivers:unique(readinessResult.drivers.concat(safetyResult.drivers)).slice(0,6),
      trainingDecision:decision,loadAdjustmentPercent:safetyResult.loadAdjustmentPercent,
      workoutGuidance:movementGuidance(features,decision),
      warnings:safetyResult.warnings,recoveryActions:safetyResult.recoveryActions,
      trendInsights:[],comparisonNotes:[],missingData:confidenceResult.missing,
      baseline:baseline,medicalDisclaimer:DISCLAIMER
    };
  }
  function analyzeDaily(data,date,options){
    if(!validDate(date))throw new Error('SimurgCoachEngine date must use YYYY-MM-DD.');
    data=data||{};options=options||{};
    var day=extractDay(data,date,options),baseline=baselines(data,date,options),missing=missingData(day,baseline),confidenceResult=confidence(day,baseline,missing),readinessResult=readiness(day,baseline,confidenceResult),safetyResult=safety(day,readinessResult,data,options),recoveryContext=resolveRecoveryContext(data,date,options),energy=resolveEnergyContext(data,date,options),output=baseOutput(options.type||'daily',date,day,baseline,readinessResult,confidenceResult,safetyResult,recoveryContext,energy);
    output.workoutGuidance=movementGuidance(day,safetyResult.decision,data,options);
    if(!options.deferTechnical){
      output.trendInsights=['hrv','restingHr','sleepMinutes','cardioLoad'].map(function(key){return trendForMetric(data,date,key,options);}).filter(function(item){return item.qualified;}).map(function(item){
        var insight={metric:item.metric,direction:item.direction,changePercent:item.changePercent,recentMean:item.recentMean,previousMean:item.previousMean};
        insight.title=metricLabel(item.metric)+' trendi';
        insight.summary=trendSentence(insight);
        return insight;
      });
      output.comparisonNotes=comparableDays(data,date,day,options).map(function(item){return item.date+' tarihinde benzer sinyal profili görüldü'+(item.avgRpe!=null?' (RPE '+round(item.avgRpe,1)+').':'.');});
    }
    if(options.gymPlan){
      output.gymPlan=clone(options.gymPlan);
      output.keyDrivers.unshift('Seçili Gym bağlamı: '+(options.gymPlan.label||options.gymPlan.mode)+'.');
      output.keyDrivers=unique(output.keyDrivers).slice(0,6);
      output.inputHash=inputHash({base:output.inputHash,gymPlan:options.gymPlan});
      if(options.gymPlan.skipped){
        output.trainingDecision='rest';output.loadAdjustmentPercent=-100;output.headline='Gym günü açıkça atlandı';
        output.summary='Bu tarih açıkça atlandı; planlanan seans için progresyon veya hedef mesajı üretilmedi.';
        output.workoutGuidance={mainLifts:'Bu gün için Gym progresyon hedefi yok.',accessories:'Bu gün için Gym progresyon hedefi yok.',stabilityPosture:'Toparlanma ve ağrısız günlük hareket öncelikli.',conditioning:'Yalnızca gerçekten kaydedilmiş aktiviteler değerlendirilir.'};
      }
    }
    return composeLocalNarrative(output,{day:day});
  }
  function analyzePreWorkout(data,date,options){
    var result=analyzeDaily(data,date,Object.assign({},options||{},{type:'pre_workout'}));
    var current=extractDay(data,date,options),previousDate=null;
    if(!current.gym.rows.length&&!(options&&options.gymPlan&&options.gymPlan.skipped)){
      previousDate=unique((data.workouts||[]).map(function(row){return row&&row.date;}).filter(function(value){return validDate(value)&&value<date;})).sort().slice(-1)[0]||null;
      if(previousDate){
        var previous=extractDay(data,previousDate,options),baseline=result.baseline,confidenceResult=confidence(current,baseline,result.missingData),readinessResult=readiness(current,baseline,confidenceResult);
        current.gym=previous.gym;
        var safetyResult=safety(current,readinessResult,data,options);
        result.trainingDecision=safetyResult.decision;
        result.loadAdjustmentPercent=safetyResult.loadAdjustmentPercent;
        result.warnings=unique(result.warnings.concat(safetyResult.warnings));
        result.recoveryActions=unique(result.recoveryActions.concat(safetyResult.recoveryActions));
        result.keyDrivers=unique(result.keyDrivers.concat(safetyResult.drivers)).slice(0,6);
        result.workoutGuidance=movementGuidance(current,safetyResult.decision,data,options);
        result.comparisonNotes.unshift('Pre-workout güvenlik bağlamı olarak son tamamlanmış Gym kaydı kullanıldı: '+previousDate+'.');
        result.inputHash=inputHash({base:result.inputHash,previousGymDate:previousDate,gym:{avgRpe:previous.gym.avgRpe,painLevel:previous.gym.painLevel,formLevel:previous.gym.formLevel}});
      }
    }
    return composeLocalNarrative(result,{day:current});
  }
  function previousExercisePerformance(data,row,date){
    var rows=(data.workouts||[]).filter(function(item){
      if(!item||item.date>=date)return false;
      if(row.exerciseId)return item.exerciseId===row.exerciseId;
      return !item.exerciseId&&normalizeName(item.exercise)===normalizeName(row.exercise);
    }).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
    if(!rows.length)return null;
    var previous=rows[0],currentVolume=volume(row),previousVolume=volume(previous);
    return {exercise:row.exercise,previousDate:previous.date,volumeChangePercent:deviation(currentVolume,previousVolume),weightChange:round((number(row.weight)||0)-(number(previous.weight)||0),1)};
  }
  function analyzePostWorkout(data,date,options){
    var result=analyzeDaily(data,date,Object.assign({},options||{},{type:'post_workout'})),rows=workoutRows(data,date);
    var comparisons=rows.map(function(row){return previousExercisePerformance(data,row,date);}).filter(Boolean);
    result.comparisonNotes=comparisons.slice(0,4).map(function(item){
      return item.exercise+': önceki '+item.previousDate+' seansına göre hacim '+(item.volumeChangePercent==null?'karşılaştırılamadı':(item.volumeChangePercent>0?'+':'')+item.volumeChangePercent+'%')+'.';
    }).concat(result.comparisonNotes);
    if(!rows.length&&result.missingData.indexOf('Tamamlanmış Gym seansı')<0)result.missingData.push('Tamamlanmış Gym seansı');
    return composeLocalNarrative(result,{day:extractDay(data,date,options)});
  }
  function analyzeWeekly(data,endDate,options){
    var dailyResults=[],start=addDays(endDate,-6);
    for(var cursor=start;cursor<=endDate;cursor=addDays(cursor,1))dailyResults.push(analyzeDaily(data,cursor,Object.assign({},options||{},{type:'daily'})));
    var scores=dailyResults.map(function(item){return item.readinessScore;}).filter(function(value){return value!=null;}),confidences=dailyResults.map(function(item){return item.confidenceScore;}),decisions=dailyResults.map(function(item){return item.trainingDecision;}),worst=decisions.sort(function(a,b){return DECISION_RANK[b]-DECISION_RANK[a];})[0]||'controlled';
    var workoutDays=dailyResults.filter(function(item){return extractDay(data,item.date,options).gym.rows.length||extractDay(data,item.date,options).physical.workouts.length;}).length;
    var base=clone(dailyResults[dailyResults.length-1]);
    base.type='weekly';base.date=endDate;base.period={startDate:start,endDate:endDate};
    base.readinessScore=scores.length?Math.round(average(scores)):null;
    base.readinessStatus=base.readinessScore==null?'insufficient':base.readinessScore>=80?'good':base.readinessScore>=65?'normal':base.readinessScore>=50?'controlled':'low';
    base.confidenceScore=Math.round(average(confidences)||10);
    base.confidenceLabel=base.confidenceScore>=80?'Yüksek':base.confidenceScore>=55?'Orta':'Düşük';
    base.trainingDecision=worst;
    base.loadAdjustmentPercent={progress:0,normal:0,controlled:-5,reduce:-15,recovery:-25,rest:-100}[worst];
    base.headline='Haftalık yük ve toparlanma özeti';
    base.summary=workoutDays+' antrenman/aktivite günü ve '+scores.length+' readiness günü değerlendirildi.';
    base.keyDrivers=[
      'Ortalama readiness: '+(base.readinessScore==null?'hesaplanamadı':base.readinessScore+'/100'),
      'Haftanın en korumacı kararı: '+worst,
      'Antrenman/aktivite günü: '+workoutDays
    ];
    base.warnings=unique(dailyResults.reduce(function(out,item){return out.concat(item.warnings);},[])).slice(0,6);
    base.missingData=unique(dailyResults.reduce(function(out,item){return out.concat(item.missingData);},[]));
    base.inputHash=inputHash({type:'weekly',start:start,end:endDate,daily:dailyResults.map(function(item){return item.inputHash;})});
    return composeLocalNarrative(base,{day:extractDay(data,endDate,options),dailyResults:dailyResults});
  }
  function association(days,id,title,predicate,outcome,minimum,summary){
    var exposed=[],control=[];
    days.forEach(function(day,index){
      var value=outcome(day,index,days);
      if(value==null)return;
      (predicate(day,index,days)?exposed:control).push(value);
    });
    minimum=minimum||3;
    if(exposed.length<minimum||control.length<minimum)return null;
    var exposedMean=average(exposed),controlMean=average(control),difference=round(exposedMean-controlMean,1);
    if(Math.abs(difference)<0.5)return null;
    var confidenceScore=clamp(Math.round(35+(Math.min(exposed.length,8)+Math.min(control.length,8))*4+Math.min(15,Math.abs(difference)*3)),40,90);
    return {
      id:id,title:title,summary:summary(difference,exposedMean,controlMean),
      relationship:'association_not_causation',sampleSize:exposed.length+control.length,
      exposedSamples:exposed.length,controlSamples:control.length,confidenceScore:confidenceScore
    };
  }
  function patternInsights(data,endDate,options){
    options=options||{};
    var dates=allDataDates(data).filter(function(date){return date<=endDate&&date>=addDays(endDate,-90);}),days=dates.map(function(date){return extractDay(data,date,options);});
    var patterns=[];
    var sleep=association(days,'low_sleep_rpe','Düşük uyku ve RPE ilişkisi',
      function(day){return day.recovery.sleepMinutes!=null&&day.recovery.sleepMinutes<390;},
      function(day){return day.gym.avgRpe;},3,
      function(diff){return '6,5 saatin altındaki uyku günlerinde ortalama RPE diğer günlerden '+Math.abs(diff)+' puan '+(diff>0?'yüksek':'düşük')+' görünüyor; bu bir ilişkidir, kesin neden değildir.';});
    if(sleep)patterns.push(sleep);
    var load=association(days,'previous_load_rpe','Önceki gün yükü ve RPE ilişkisi',
      function(day,index,items){var previous=items[index-1];return !!previous&&previous.date===addDays(day.date,-1)&&((previous.load.cardioLoadRatio||0)>=1.3||(previous.load.cardioLoad||0)>=60);},
      function(day){return day.gym.avgRpe;},3,
      function(diff){return 'Yüksek önceki gün kardiyo yükünden sonra RPE diğer örneklerden '+Math.abs(diff)+' puan '+(diff>0?'yüksek':'düşük')+'; olası ilişki olarak izlenmeli.';});
    if(load)patterns.push(load);
    var racket=association(days,'racket_upper_limb','Raket sporu sonrası üst gövde toleransı',
      function(day,index,items){var previous=items[index-1];return !!previous&&previous.date===addDays(day.date,-1)&&previous.physical.racketSport;},
      function(day){return day.gym.rows.length?day.gym.painLevel:null;},3,
      function(diff){return 'Raket sporu sonrası günlerde ağrı işareti karşılaştırma günlerinden '+Math.abs(diff)+' kademe '+(diff>0?'yüksek':'düşük')+'; örnek sayısı sınırlı olduğunda temkinli yorumlanmalıdır.';});
    if(racket)patterns.push(racket);
    return {patterns:patterns,daysReviewed:days.length,minimumSamplesPerGroup:3,hasEnoughData:days.length>=7};
  }
  function analyzePatterns(data,endDate,options){
    var daily=analyzeDaily(data,endDate,Object.assign({},options||{},{type:'pattern'})),analysis=patternInsights(data,endDate,options);
    daily.headline=analysis.patterns.length?'Tekrarlanan paternler bulundu':'Henüz yeterli tekrarlanan patern yok';
    daily.summary=analysis.patterns.length?analysis.patterns.length+' ilişki minimum örnek eşiğini geçti.':'Patern üretmek için her karşılaştırma grubunda en az 3 geçerli örnek gerekiyor.';
    daily.trendInsights=analysis.patterns;
    daily.patternAnalysis=analysis;
    daily.inputHash=inputHash({type:'pattern',endDate:endDate,analysis:analysis});
    return composeLocalNarrative(daily,{day:extractDay(data,endDate,options)});
  }
  function defaultStore(){
    return {schemaVersion:STORE_SCHEMA_VERSION,daily:{},weekly:{},patterns:{},aiCache:{},settings:{movementCategories:{}}};
  }
  function ensureStore(data){
    if(!isObject(data))throw new Error('SimurgCoachEngine DATA root must be an object.');
    var defaults=defaultStore(),current=isObject(data.coachIntelligence)?data.coachIntelligence:{};
    data.coachIntelligence=current;
    Object.keys(defaults).forEach(function(key){
      if(current[key]===undefined)current[key]=clone(defaults[key]);
    });
    ['daily','weekly','patterns','aiCache','settings'].forEach(function(key){if(!isObject(current[key]))current[key]=clone(defaults[key]);});
    if(!isObject(current.settings.movementCategories))current.settings.movementCategories={};
    current.schemaVersion=STORE_SCHEMA_VERSION;
    return current;
  }
  function storeResult(data,result){
    var store=ensureStore(data);
    if(result.type==='weekly')store.weekly[result.date]=clone(result);
    else if(result.type==='pattern')store.patterns[result.date]=clone(result);
    else{
      if(!isObject(store.daily[result.date]))store.daily[result.date]={};
      store.daily[result.date][result.type]=clone(result);
    }
    return result;
  }
  function analyze(type,data,date,options){
    if(type==='daily')return analyzeDaily(data,date,options);
    if(type==='pre_workout')return analyzePreWorkout(data,date,options);
    if(type==='post_workout')return analyzePostWorkout(data,date,options);
    if(type==='weekly')return analyzeWeekly(data,date,options);
    if(type==='pattern')return analyzePatterns(data,date,options);
    throw new Error('Unknown Simurg coach type: '+type);
  }

  return {
    OUTPUT_SCHEMA_VERSION:OUTPUT_SCHEMA_VERSION,
    OUTPUT_SCHEMA:clone(OUTPUT_SCHEMA),
    STORE_SCHEMA_VERSION:STORE_SCHEMA_VERSION,
    DISCLAIMER:DISCLAIMER,
    WINDOW_MINIMUMS:clone(WINDOW_MINIMUMS),
    CATEGORY_LABELS:clone(CATEGORY_LABELS),
    DEFAULT_CATEGORIES:clone(DEFAULT_CATEGORIES),
    LOCAL_NARRATIVE_VERSION:LOCAL_NARRATIVE_VERSION,
    inputHash:inputHash,
    defaultStore:defaultStore,
    ensureStore:ensureStore,
    storeResult:storeResult,
    movementCategory:movementCategory,
    extractDay:extractDay,
    baselines:baselines,
    patternInsights:patternInsights,
    composeLocalNarrative:composeLocalNarrative,
    analyze:analyze,
    analyzeDaily:analyzeDaily,
    analyzePreWorkout:analyzePreWorkout,
    analyzePostWorkout:analyzePostWorkout,
    analyzeWeekly:analyzeWeekly,
    analyzePatterns:analyzePatterns
  };
});
