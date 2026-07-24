(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgDataValidation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var CURRENT_SCHEMA_VERSION=1;
  var LIMITS={
    maxBytes:25*1024*1024,
    maxDepth:32,
    maxNodes:250000,
    maxKeys:25000,
    maxArray:100000,
    maxString:256*1024
  };
  var BLOCKED_KEYS=Object.create(null);
  BLOCKED_KEYS.__proto__=true;
  BLOCKED_KEYS.prototype=true;
  BLOCKED_KEYS.constructor=true;
  var ARRAY_NAMES=['workouts','metrics','nutrition','recovery','appleWatch','dailyNotes','weeklyNotes'];
  var MAP_NAMES=['customGymPrograms','programNames','activityNotes','autoNextTargets','recoveryEntries'];
  var POLAR_HISTORY_NAMES=['polarSleep','polarNightlyRecharge','polarContinuousHr','polarCardioLoad'];
  var RESERVED_ROOTS={auth:true,session:true,supabase:true,cloudAuth:true,cloudSession:true,simurg_cloud_meta:true,simurg_polar_accesslink_client_v1:true};
  var DEFAULTS={
    schemaVersion:CURRENT_SCHEMA_VERSION,
    workouts:[],metrics:[],nutrition:[],recovery:[],appleWatch:[],dailyNotes:[],weeklyNotes:[],
    customGymPrograms:{},programNames:{},
    polarWorkouts:{daily:{},latest:null},
    polarActivity:{daily:{},latest:null},
    polarProfile:{latest:null},
    polarSleep:{daily:{},latest:null,lastSyncAt:null,lastError:null},
    polarNightlyRecharge:{daily:{},latest:null,lastSyncAt:null,lastError:null},
    polarContinuousHr:{daily:{},latest:null,lastSyncAt:null,lastError:null},
    polarCardioLoad:{daily:{},latest:null,lastSyncAt:null,lastError:null},
    polarConnection:{connected:false,status:'disconnected',lastSyncAt:null,lastError:null,source:'Polar AccessLink'}
  };

  function ValidationError(code,message,path){
    this.name='SimurgDataValidationError';
    this.code=code;
    this.path=path||'$';
    this.message=message+(path?' ('+path+')':'');
    if(Error.captureStackTrace)Error.captureStackTrace(this,ValidationError);
  }
  ValidationError.prototype=Object.create(Error.prototype);
  ValidationError.prototype.constructor=ValidationError;

  function fail(code,message,path){throw new ValidationError(code,message,path)}
  function isPlainObject(value){
    if(!value||Object.prototype.toString.call(value)!=='[object Object]')return false;
    var proto=Object.getPrototypeOf(value);
    return proto===Object.prototype||proto===null;
  }
  function utf8Bytes(value){
    var text=String(value==null?'':value);
    if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(text).length;
    if(typeof Buffer!=='undefined')return Buffer.byteLength(text,'utf8');
    return unescape(encodeURIComponent(text)).length;
  }
  function pathFor(base,key){return base+(Array.isArray(key)?'['+key+']':(/^[A-Za-z_$][\w$]*$/.test(String(key))?'.'+key:'['+JSON.stringify(String(key))+']'))}
  function scan(value,options){
    options=options||{};
    var limits=Object.assign({},LIMITS,options.limits||{});
    var nodes=0;
    function visit(item,path,depth){
      nodes+=1;
      if(nodes>limits.maxNodes)fail('too_many_nodes','Veri çok fazla düğüm içeriyor',path);
      if(depth>limits.maxDepth)fail('too_deep','Veri izin verilen iç içe geçme derinliğini aşıyor',path);
      if(item===null)return;
      var type=typeof item;
      if(type==='string'){
        if(utf8Bytes(item)>limits.maxString)fail('string_too_large','Bir metin alanı izin verilen boyutu aşıyor',path);
        return;
      }
      if(type==='number'){
        if(!Number.isFinite(item))fail('non_finite_number','Sonlu olmayan sayı kabul edilmez',path);
        return;
      }
      if(type==='boolean')return;
      if(type!=='object')fail('invalid_json_value','JSON dışı değer kabul edilmez',path);
      if(Array.isArray(item)){
        if(item.length>limits.maxArray)fail('array_too_large','Dizi izin verilen uzunluğu aşıyor',path);
        for(var i=0;i<item.length;i+=1)visit(item[i],path+'['+i+']',depth+1);
        return;
      }
      if(!isPlainObject(item))fail('invalid_object','Yalnızca düz JSON nesneleri kabul edilir',path);
      var keys=Object.keys(item);
      if(keys.length>limits.maxKeys)fail('object_too_large','Nesne izin verilen anahtar sayısını aşıyor',path);
      for(var k=0;k<keys.length;k+=1){
        var key=keys[k];
        if(BLOCKED_KEYS[key])fail('blocked_key','Güvenli olmayan nesne anahtarı reddedildi',pathFor(path,key));
        visit(item[key],pathFor(path,key),depth+1);
      }
    }
    visit(value,'$',0);
    return {nodes:nodes};
  }
  function parseJson(text,options){
    options=options||{};
    if(typeof text!=='string')fail('invalid_json_text','JSON girdisi metin olmalı','$');
    var limit=(options.limits&&options.limits.maxBytes)||LIMITS.maxBytes;
    if(utf8Bytes(text)>limit)fail('payload_too_large','JSON payload izin verilen boyutu aşıyor','$');
    var value;
    try{value=JSON.parse(text)}catch(error){fail('malformed_json','JSON ayrıştırılamadı: '+String(error.message||'geçersiz JSON'),'$')}
    scan(value,options);
    return value;
  }
  function clone(value){
    scan(value);
    if(typeof structuredClone==='function')return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
  function text(value,path,max,allowEmpty){
    if(value==null)return '';
    if(typeof value!=='string')fail('invalid_string','Metin alanı bekleniyor',path);
    if(!allowEmpty&&!value.trim())fail('empty_string','Boş metin kabul edilmez',path);
    if(utf8Bytes(value)>(max||LIMITS.maxString))fail('string_too_large','Metin alanı çok uzun',path);
    return value;
  }
  function number(value,path,options){
    options=options||{};
    if(value==null||value===''){
      if(options.optional)return null;
      fail('missing_number','Sayısal alan eksik',path);
    }
    var next=value;
    if(options.coerce&&typeof next==='string'&&next.trim()!=='')next=Number(next.replace(',','.'));
    if(typeof next!=='number'||!Number.isFinite(next))fail('invalid_number','Geçerli sonlu sayı bekleniyor',path);
    if(options.integer&&!Number.isInteger(next))fail('invalid_integer','Tam sayı bekleniyor',path);
    if(options.min!=null&&next<options.min)fail('number_too_small','Sayı izin verilen aralığın altında',path);
    if(options.max!=null&&next>options.max)fail('number_too_large','Sayı izin verilen aralığın üstünde',path);
    return next;
  }
  function legacyAppleWatchRpe(value,path){
    if(value==null)return null;
    if(typeof value==='number')return number(value,path,{min:0,max:10});
    if(typeof value!=='string')return null;
    var trimmed=value.trim();
    if(trimmed===''||/^(?:-|—|n\/a|na|null|unknown|nan|infinity|undefined)$/i.test(trimmed))return null;
    var numeric='([+-]?(?:\\d+(?:[.,]\\d+)?|[.,]\\d+))';
    var match=trimmed.match(new RegExp('^'+numeric+'$'))
      ||trimmed.match(new RegExp('^'+numeric+'\\s*\\/\\s*10$','i'))
      ||trimmed.match(new RegExp('^rpe\\s*:?\\s*'+numeric+'(?:\\s*\\/\\s*10)?$','i'));
    if(!match){
      var labeled=trimmed.match(new RegExp('^'+numeric+' *[-–—] *(.+)$','u'));
      if(labeled&&/^\p{L}[\p{L} ]{0,38}\p{L}$/u.test(labeled[2]))match=labeled;
    }
    if(!match)return null;
    return number(Number(match[1].replace(',','.')),path,{min:0,max:10});
  }
  function validDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    var date=new Date(value+'T00:00:00Z');
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function date(value,path){if(!validDate(value))fail('invalid_date','Tarih YYYY-MM-DD biçiminde ve gerçek bir takvim günü olmalı',path);return value}
  function optionalDateTime(value,path){
    if(value==null||value==='')return value===''?'':null;
    text(value,path,512,false);
    if(Number.isNaN(new Date(value).getTime()))fail('invalid_datetime','Geçerli tarih/saat bekleniyor',path);
    return value;
  }
  function optionalStartTime(value,path){
    if(value==null||value==='')return value==null?null:'';
    text(value,path,128,false);
    var clock=/^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value);
    if(!clock&&Number.isNaN(new Date(value).getTime()))fail('invalid_time','Geçerli saat veya ISO tarih/saat bekleniyor',path);
    return value;
  }
  function plain(value,path){if(!isPlainObject(value))fail('invalid_namespace','Nesne alanı bekleniyor',path);return value}
  function array(value,path){if(!Array.isArray(value))fail('invalid_namespace','Dizi alanı bekleniyor',path);return value}
  function copyDefaults(target){
    Object.keys(DEFAULTS).forEach(function(key){
      if(target[key]===undefined)target[key]=clone(DEFAULTS[key]);
    });
    return target;
  }
  function validateWorkoutRecord(input,path,options){
    options=options||{};
    plain(input,path);
    var row=clone(input);
    date(row.date,path+'.date');
    row.exercise=text(row.exercise==null?'Exercise':row.exercise,path+'.exercise',2048,false);
    if(row.day!=null)text(row.day,path+'.day',128,true);
    if(row.bodyPart!=null)text(row.bodyPart,path+'.bodyPart',256,true);
    if(row.notes!=null)text(row.notes,path+'.notes',LIMITS.maxString,true);
    if(row.startTime!=null)text(row.startTime,path+'.startTime',128,true);
    row.sets=number(row.sets==null?1:row.sets,path+'.sets',{coerce:options.coerce,integer:true,min:1,max:10000});
    row.reps=number(row.reps==null?0:row.reps,path+'.reps',{coerce:options.coerce,integer:true,min:0,max:100000});
    row.weight=number(row.weight==null?0:row.weight,path+'.weight',{coerce:options.coerce,min:0,max:1000000});
    if(row.rpe!=null&&row.rpe!=='')row.rpe=number(row.rpe,path+'.rpe',{coerce:options.coerce,min:0,max:10});
    scan(row);
    return row;
  }
  function validateActivityRecord(input,path,options){
    options=options||{};
    plain(input,path);
    var row=clone(input);
    date(row.date,path+'.date');
    ['type','kind','activityType','activity','source','startTime','duration','notes','note'].forEach(function(key){
      if(row[key]!=null)text(row[key],path+'.'+key,key==='notes'||key==='note'?LIMITS.maxString:2048,true);
    });
    ['activeCal','activeCalories','totalCal','totalCalories','avgHR','maxHR','minHR','distance'].forEach(function(key){
      if(row[key]!=null&&row[key]!=='')row[key]=number(row[key],path+'.'+key,{coerce:options.coerce,min:0,max:10000000});
    });
    if(row.rpe!=null&&row.rpe!==''){
      row.rpe=number(row.rpe,path+'.rpe',{
        coerce:options.coerceRpe===undefined?options.coerce:options.coerceRpe,
        min:0,
        max:options.rpeMax==null?10000000:options.rpeMax
      });
    }
    if(row.segments!=null){
      array(row.segments,path+'.segments');
      row.segments=row.segments.map(function(segment,index){
        var combined=Object.assign({},row,segment);
        delete combined.segments;
        if(!combined.date)combined.date=row.date;
        return validateActivityRecord(combined,path+'.segments['+index+']',options);
      });
    }
    scan(row);
    return row;
  }
  function validateDailyRecord(input,path){
    plain(input,path);
    var row=clone(input);
    date(row.date,path+'.date');
    scan(row);
    return row;
  }
  function validateWeeklyRecord(input,path){
    plain(input,path);
    var row=clone(input);
    if(row.date!=null)date(row.date,path+'.date');
    if(row.weekStart!=null)date(row.weekStart,path+'.weekStart');
    scan(row);
    return row;
  }
  function validatePolarRecoveryRecord(input,path,options){
    options=options||{};
    plain(input,path);
    var row=clone(input);
    date(row.date,path+'.date');
    ['type','importType','source','device','notes'].forEach(function(key){if(row[key]!=null)text(row[key],path+'.'+key,key==='notes'?LIMITS.maxString:2048,true)});
    ['sleepDurationMinutes','sleepMinutes','sleepScore','nightlyRecharge','hrvMs','hrv','restingHr','restingHR','rhr','activityLoad','physicalLoad','energy'].forEach(function(key){
      if(row[key]!=null&&row[key]!=='')row[key]=number(row[key],path+'.'+key,{coerce:options.coerce,min:0,max:1000000});
    });
    scan(row);
    return row;
  }
  function validatePolarWorkoutRecord(input,path,options){
    options=options||{};
    plain(input,path);
    var row=clone(input);
    date(row.date,path+'.date');
    ['type','source','name','activity','activityType','workoutType','sport','device','duration','notes','rpeLabel','trainingLoadType'].forEach(function(key){
      if(row[key]!=null)text(row[key],path+'.'+key,key==='notes'?LIMITS.maxString:2048,true);
    });
    if(row.startTime!=null)optionalStartTime(row.startTime,path+'.startTime');
    if(!['type','source','name','activity','activityType','workoutType','sport'].some(function(key){return typeof row[key]==='string'&&row[key].trim()})){
      fail('invalid_polar_record','Polar workout kimliği/türü eksik',path);
    }
    ['durationSeconds','activeCal','activeCalories','totalCal','totalCalories','avgHR','minHR','maxHR','rpe','trainingLoad'].forEach(function(key){
      if(row[key]!=null&&row[key]!=='')row[key]=number(row[key],path+'.'+key,{coerce:options.coerce,min:0,max:10000000});
    });
    ['zones','zoneSummary','fuel','trainingImpact'].forEach(function(key){if(row[key]!=null)plain(row[key],path+'.'+key)});
    if(row.heartRateSeries!=null){
      array(row.heartRateSeries,path+'.heartRateSeries');
      row.heartRateSeries.forEach(function(point,index){
        if(typeof point==='number')number(point,path+'.heartRateSeries['+index+']',{min:0,max:1000});
        else if(isPlainObject(point)){
          scan(point);
          Object.keys(point).forEach(function(key){if(typeof point[key]==='number')number(point[key],path+'.heartRateSeries['+index+'].'+key,{min:-10000000,max:10000000})});
        }else fail('invalid_polar_record','Heart rate series kaydı geçersiz',path+'.heartRateSeries['+index+']');
      });
    }
    scan(row);
    return row;
  }
  function validateDatedMap(map,path,recordValidator,options){
    plain(map,path);
    Object.keys(map).forEach(function(key){
      date(key,pathFor(path,key));
      var value=map[key];
      var rows=Array.isArray(value)?value:[value];
      rows.forEach(function(record,index){
        if(record==null)fail('invalid_record','Boş günlük kayıt kabul edilmez',pathFor(path,key)+(Array.isArray(value)?'['+index+']':''));
        recordValidator(record,pathFor(path,key)+(Array.isArray(value)?'['+index+']':''),options);
      });
    });
  }
  function validatePolarStore(store,path,validator,options){
    plain(store,path);
    plain(store.daily,path+'.daily');
    validateDatedMap(store.daily,path+'.daily',validator,options);
    if(store.latest!=null)validator(store.latest,path+'.latest',options);
    if(store.lastSyncAt!=null)optionalDateTime(store.lastSyncAt,path+'.lastSyncAt');
    if(store.lastError!=null)text(store.lastError,path+'.lastError',4096,true);
  }
  function permissivePolarRecord(value,path){
    if(!isPlainObject(value))fail('invalid_polar_record','Polar günlük kaydı nesne olmalı',path);
    if(value.date!=null)date(value.date,path+'.date');
    scan(value);
    return value;
  }
  function migrate(candidate,warnings,options){
    options=options||{};
    var version=candidate.schemaVersion;
    if(version==null){
      version=0;
      warnings.push('schemaVersion eksikti; legacy backup olarak v1 biçimine taşındı.');
    }
    version=number(version,'$.schemaVersion',{coerce:true,integer:true,min:0,max:CURRENT_SCHEMA_VERSION});
    copyDefaults(candidate);
    candidate.schemaVersion=CURRENT_SCHEMA_VERSION;
    function fillDailyDates(store,path){
      if(!isPlainObject(store)||!isPlainObject(store.daily))return;
      Object.keys(store.daily).forEach(function(key){
        date(key,pathFor(path+'.daily',key));
        var value=store.daily[key];
        if(Array.isArray(value)){
          value.forEach(function(record){if(isPlainObject(record)&&record.date==null)record.date=key});
        }else if(isPlainObject(value)&&value.date==null)value.date=key;
      });
      if(isPlainObject(store.latest)&&Object.keys(store.latest).length===0)store.latest=null;
      if(isPlainObject(store.latest)&&store.latest.date==null){
        var keys=Object.keys(store.daily).sort();
        if(keys.length)store.latest.date=keys[keys.length-1];
      }
    }
    ['polarWorkouts','polarActivity','polarSleep','polarNightlyRecharge','polarContinuousHr','polarCardioLoad'].forEach(function(key){
      fillDailyDates(candidate[key],'$.'+key);
    });
    if(isPlainObject(candidate.recoveryEntries)){
      Object.keys(candidate.recoveryEntries).forEach(function(key){
        date(key,pathFor('$.recoveryEntries',key));
        var record=candidate.recoveryEntries[key];
        if(isPlainObject(record)&&record.date==null)record.date=key;
      });
    }
    if(isPlainObject(candidate.polarBridge))fillDailyDates(candidate.polarBridge,'$.polarBridge');
    candidate.workouts=candidate.workouts.map(function(row,index){return validateWorkoutRecord(row,'$.workouts['+index+']',{coerce:true})});
    candidate.appleWatch=candidate.appleWatch.map(function(row,index){
      var rowPath='$.appleWatch['+index+']';
      if(options.legacyAppleWatchRpe&&isPlainObject(row)&&row.rpe!==undefined){
        row.rpe=legacyAppleWatchRpe(row.rpe,rowPath+'.rpe');
      }
      return validateActivityRecord(row,rowPath,{coerce:true,coerceRpe:false,rpeMax:10});
    });
    return candidate;
  }
  function validateKnown(candidate,options){
    options=options||{};
    ARRAY_NAMES.forEach(function(key){array(candidate[key],'$.'+key)});
    MAP_NAMES.forEach(function(key){if(candidate[key]!=null)plain(candidate[key],'$.'+key)});
    Object.keys(candidate.customGymPrograms||{}).forEach(function(key){
      var entry=candidate.customGymPrograms[key],entryPath=pathFor('$.customGymPrograms',key);
      if(!isPlainObject(entry)&&!Array.isArray(entry))fail('invalid_namespace','Gym program kaydı nesne veya legacy dizi olmalı',entryPath);
      scan(entry);
    });
    Object.keys(candidate.programNames||{}).forEach(function(key){text(candidate.programNames[key],pathFor('$.programNames',key),512,true)});
    Object.keys(candidate.activityNotes||{}).forEach(function(key){text(candidate.activityNotes[key],pathFor('$.activityNotes',key),LIMITS.maxString,true)});
    Object.keys(candidate.autoNextTargets||{}).forEach(function(key){plain(candidate.autoNextTargets[key],pathFor('$.autoNextTargets',key));scan(candidate.autoNextTargets[key])});
    candidate.workouts.forEach(function(row,index){validateWorkoutRecord(row,'$.workouts['+index+']',{coerce:!!options.coerce})});
    candidate.appleWatch.forEach(function(row,index){validateActivityRecord(row,'$.appleWatch['+index+']',{coerce:!!options.coerce,coerceRpe:false,rpeMax:10})});
    candidate.dailyNotes.forEach(function(row,index){validateDailyRecord(row,'$.dailyNotes['+index+']')});
    candidate.weeklyNotes.forEach(function(row,index){validateWeeklyRecord(row,'$.weeklyNotes['+index+']')});
    ['metrics','nutrition','recovery'].forEach(function(key){candidate[key].forEach(function(row,index){plain(row,'$.'+key+'['+index+']');if(row.date!=null)date(row.date,'$.'+key+'['+index+'].date');scan(row)})});
    validatePolarStore(candidate.polarWorkouts,'$.polarWorkouts',validatePolarWorkoutRecord,{coerce:!!options.coerce});
    validatePolarStore(candidate.polarActivity,'$.polarActivity',validateActivityRecord,{coerce:!!options.coerce});
    plain(candidate.polarProfile,'$.polarProfile');
    if(candidate.polarProfile.latest!=null)plain(candidate.polarProfile.latest,'$.polarProfile.latest');
    POLAR_HISTORY_NAMES.forEach(function(key){validatePolarStore(candidate[key],'$.'+key,permissivePolarRecord,{coerce:!!options.coerce})});
    plain(candidate.polarConnection,'$.polarConnection');
    if(candidate.polarConnection.connected!=null&&typeof candidate.polarConnection.connected!=='boolean')fail('invalid_namespace','polarConnection.connected boolean olmalı','$.polarConnection.connected');
    if(candidate.polarConnection.status!=null)text(candidate.polarConnection.status,'$.polarConnection.status',128,true);
    if(candidate.polarConnection.source!=null)text(candidate.polarConnection.source,'$.polarConnection.source',512,true);
    if(candidate.polarConnection.lastSyncAt!=null)optionalDateTime(candidate.polarConnection.lastSyncAt,'$.polarConnection.lastSyncAt');
    if(candidate.polarConnection.lastError!=null)text(candidate.polarConnection.lastError,'$.polarConnection.lastError',4096,true);
    if(candidate.recoveryEntries!=null)validateDatedMap(candidate.recoveryEntries,'$.recoveryEntries',validatePolarRecoveryRecord,{coerce:!!options.coerce});
    if(candidate.polarBridge!=null){
      plain(candidate.polarBridge,'$.polarBridge');
      if(candidate.polarBridge.source!=null)text(candidate.polarBridge.source,'$.polarBridge.source',512,true);
      if(candidate.polarBridge.daily!=null)validateDatedMap(candidate.polarBridge.daily,'$.polarBridge.daily',permissivePolarRecord,{});
      if(candidate.polarBridge.lastSync!=null)optionalDateTime(candidate.polarBridge.lastSync,'$.polarBridge.lastSync');
    }
    if(candidate._meta!=null){
      plain(candidate._meta,'$._meta');
      Object.keys(candidate._meta).forEach(function(key){
        if(key!=='build'&&key!=='lastLocalUpdate')fail('reserved_namespace','_meta yalnızca uygulamaya ait izinli alanları içerebilir',pathFor('$._meta',key));
      });
      if(candidate._meta.build!=null)text(candidate._meta.build,'$._meta.build',512,true);
      if(candidate._meta.lastLocalUpdate!=null)optionalDateTime(candidate._meta.lastLocalUpdate,'$._meta.lastLocalUpdate');
    }
    scan(candidate);
  }
  function prepareFull(value,options){
    options=options||{};
    scan(value,options);
    if(!isPlainObject(value))fail('invalid_root','Tam DATA restore kökü düz bir JSON nesnesi olmalı','$');
    Object.keys(value).forEach(function(key){
      if(RESERVED_ROOTS[key])fail('reserved_namespace','Uygulama kontrol/gizli bilgi namespace alanı DATA içine alınamaz',pathFor('$',key));
    });
    var serialized;
    try{serialized=JSON.stringify(value)}catch(error){fail('invalid_json_value','DATA JSON olarak serileştirilemiyor','$')}
    var maxBytes=(options.limits&&options.limits.maxBytes)||LIMITS.maxBytes;
    if(utf8Bytes(serialized)>maxBytes)fail('payload_too_large','DATA payload izin verilen boyutu aşıyor','$');
    var candidate=clone(value);
    var warnings=[];
    candidate=migrate(candidate,warnings,options);
    scan(candidate,options);
    validateKnown(candidate,{coerce:false});
    var known={schemaVersion:true};
    Object.keys(DEFAULTS).concat(MAP_NAMES).concat(['activityNotes','autoNextTargets','recoveryEntries','polarBridge','_meta']).forEach(function(key){known[key]=true});
    Object.keys(candidate).forEach(function(key){if(!known[key])warnings.push('Güvenli bilinmeyen alan korundu: '+key)});
    return {data:candidate,warnings:warnings,fromVersion:value.schemaVersion==null?0:Number(value.schemaVersion),toVersion:CURRENT_SCHEMA_VERSION};
  }
  function prepareFullText(raw,options){return prepareFull(parseJson(raw,options),options)}
  function stageAppend(current,mutator,options){
    var candidate=prepareFull(current,options).data;
    var result=mutator(candidate);
    return {data:prepareFull(candidate,options).data,result:result};
  }
  function duplicateWorkout(list,row){
    return list.some(function(item){return item&&item.date===row.date&&item.exercise===row.exercise&&String(item.startTime||'')===String(row.startTime||'')&&Number(item.sets||1)===Number(row.sets||1)&&Number(item.reps||0)===Number(row.reps||0)&&Number(item.weight||0)===Number(row.weight||0)});
  }
  function appendWorkoutRows(candidate,rows,normalizer){
    array(rows,'$.import.workouts');
    if(!rows.length)fail('empty_import','Workout dizisi boş','$.import.workouts');
    var normalized=rows.map(function(row,index){
      var safe=validateWorkoutRecord(row,'$.import.workouts['+index+']',{coerce:true});
      if(typeof normalizer==='function')safe=normalizer(clone(safe));
      return validateWorkoutRecord(safe,'$.import.workouts['+index+']',{coerce:true});
    });
    normalized.forEach(function(row){if(!duplicateWorkout(candidate.workouts,row))candidate.workouts.push(row)});
    return {date:normalized[0].date,count:normalized.length,kind:'workout'};
  }
  function appendActivityRows(candidate,rows,normalizer){
    array(rows,'$.import.activities');
    if(!rows.length)fail('empty_import','Aktivite dizisi boş','$.import.activities');
    var inserted=0,firstDate='';
    rows.forEach(function(input,index){
      var safeInput=clone(input);
      if(typeof normalizer==='function')safeInput=normalizer(safeInput);
      var row=validateActivityRecord(safeInput,'$.import.activities['+index+']',{coerce:true,coerceRpe:false,rpeMax:10});
      var expanded=Array.isArray(row.segments)&&row.segments.length?row.segments:[row];
      expanded.forEach(function(item){
        delete item.segments;
        var duplicate=candidate.appleWatch.some(function(existing){return existing&&existing.date===item.date&&String(existing.startTime||'')===String(item.startTime||'')&&String(existing.duration||'')===String(item.duration||'')});
        if(!duplicate){candidate.appleWatch.push(item);inserted+=1}
        if(!firstDate)firstDate=item.date;
      });
    });
    return {date:firstDate,count:inserted,kind:'activity'};
  }
  function appendPolarWorkout(candidate,input){
    var row=validatePolarWorkoutRecord(input,'$.import.polarWorkout',{coerce:true});
    row.type='polar_flow_workout';
    row.source='Polar Flow';
    var daily=candidate.polarWorkouts.daily[row.date];
    if(!Array.isArray(daily))daily=daily?[daily]:[];
    var index=daily.findIndex(function(item){return String(item&&item.startTime||'')===String(row.startTime||'')});
    if(index>=0)daily[index]=Object.assign({},daily[index],row);
    else daily.push(row);
    candidate.polarWorkouts.daily[row.date]=daily;
    candidate.polarWorkouts.latest=row;
    return {date:row.date,count:1,kind:'polar_workout',record:row};
  }
  function appendPolarRecovery(candidate,input){
    var row=validatePolarRecoveryRecord(input,'$.import.polarRecovery',{coerce:true});
    function first(){
      for(var i=0;i<arguments.length;i+=1)if(arguments[i]!=null&&arguments[i]!=='')return arguments[i];
      return undefined;
    }
    row=Object.assign({},row,{
      source:row.source||'polar_loop_gen2',
      sleepDurationMinutes:first(row.sleepDurationMinutes,row.sleepMinutes,row.sleep&&row.sleep.durationMinutes),
      sleepScore:first(row.sleepScore,row.sleep&&row.sleep.score),
      nightlyRecharge:first(row.nightlyRecharge,row.recovery&&row.recovery.nightlyRecharge),
      hrvMs:first(row.hrvMs,row.hrv,row.recovery&&row.recovery.hrvMs),
      restingHr:first(row.restingHr,row.restingHR,row.rhr,row.recovery&&row.recovery.restingHr),
      activityLoad:first(row.activityLoad,row.physicalLoad,row.activity&&row.activity.activityLoad),
      energy:first(row.energy,row.subjective&&row.subjective.energy),
      notes:first(row.notes,row.subjective&&row.subjective.notes,'')
    });
    Object.keys(row).forEach(function(key){if(row[key]===undefined)delete row[key]});
    if(!candidate.recoveryEntries)candidate.recoveryEntries={};
    candidate.recoveryEntries[row.date]=row;
    return {date:row.date,count:1,kind:'polar_recovery',record:row};
  }
  function looksLikeActivity(value){
    return isPlainObject(value)&&(value.activeCal!=null||value.activeCalories!=null||value.avgHR!=null||value.activityType!=null||value.segments!=null);
  }
  function routeImport(candidate,parsed,options){
    options=options||{};
    scan(parsed);
    if(Array.isArray(parsed)){
      if(!parsed.length)fail('empty_import','İçe aktarım dizisi boş','$.import');
      return parsed.every(looksLikeActivity)?appendActivityRows(candidate,parsed,options.activityNormalizer):appendWorkoutRows(candidate,parsed,options.workoutNormalizer);
    }
    plain(parsed,'$.import');
    var kind=String(parsed.importType||parsed.type||parsed.kind||parsed.category||'').trim().toLowerCase();
    var source=String(parsed.source||'').trim().toLowerCase();
    if(kind==='polar_flow_workout'||source==='polar flow')return appendPolarWorkout(candidate,parsed);
    if(kind==='polar_recovery'||kind==='recovery'||kind==='polar'||parsed.nightlyRecharge!=null||parsed.hrvMs!=null||parsed.restingHr!=null)return appendPolarRecovery(candidate,parsed);
    if(parsed.workouts||kind==='workout'||kind==='strength')return appendWorkoutRows(candidate,parsed.workouts||parsed.items||[],options.workoutNormalizer);
    if(parsed.appleWatch||parsed.watch||parsed.activities){
      var rows=parsed.appleWatch||parsed.watch||parsed.activities;
      if(!Array.isArray(rows))rows=[rows];
      rows=rows.map(function(row){return Object.assign({},parsed,row,{date:row.date||parsed.date,activityType:row.activityType||parsed.activityType||parsed.activity})});
      return appendActivityRows(candidate,rows,options.activityNormalizer);
    }
    if(kind==='apple_watch'||kind==='watch'||kind==='activity'||looksLikeActivity(parsed))return appendActivityRows(candidate,[parsed],options.activityNormalizer);
    if(kind==='daily'||parsed.coachNote!=null||parsed.readiness!=null||parsed.energy!=null){
      var daily=validateDailyRecord(parsed,'$.import.daily');
      candidate.dailyNotes.push(daily);
      return {date:daily.date,count:1,kind:'daily'};
    }
    if(kind==='weekly'||parsed.weeklyReport!=null||parsed.phoenixReport!=null){
      candidate.weeklyNotes.push(validateWeeklyRecord(parsed,'$.import.weekly'));
      return {date:parsed.date||parsed.weekStart||'',count:1,kind:'weekly'};
    }
    fail('unknown_import','JSON türü tanınmadı','$.import');
  }
  function installRuntime(adapter){
    if(typeof window==='undefined'||!adapter||typeof adapter.getData!=='function'||typeof adapter.setData!=='function')return null;
    if(window.__simurgPatchBInstalled)return window.SimurgDataAtomic;
    var DATA_KEY='atlas_summary_reports',SNAP_KEY='simurg_last_import_snapshot_v1';
    function selected(){return typeof adapter.getSelectedDate==='function'?adapter.getSelectedDate():''}
    function setSelected(value){if(value&&validDate(value)&&typeof adapter.setSelectedDate==='function')adapter.setSelectedDate(value)}
    function redraw(){
      if(window.SimurgSignalModel)window.SimurgSignalModel.invalidate('validated-data-change');
      if(typeof adapter.render==='function')adapter.render();
    }
    function backupDownload(previous,label){
      if(typeof adapter.download!=='function')return;
      var stamp=new Date().toISOString().replace(/[:.]/g,'-');
      adapter.download((label||'simurg-pre-import')+'-'+stamp+'.json',JSON.stringify(previous,null,2));
    }
    function commit(candidate,options){
      options=options||{};
      var prepared=prepareFull(candidate,{source:options.source||'runtime-commit'}).data;
      var previous=adapter.getData();
      var previousRaw=localStorage.getItem(DATA_KEY);
      var previousDate=selected();
      var previousSnapshot=localStorage.getItem(SNAP_KEY);
      try{
        if(options.downloadBackup)backupDownload(previous,options.backupLabel);
        if(options.snapshot){
          localStorage.setItem(SNAP_KEY,JSON.stringify({meta:{at:new Date().toISOString(),source:options.source||'import',selectedDate:previousDate},data:clone(previous)}));
        }
        adapter.setData(prepared);
        setSelected(options.selectedDate||'');
        localStorage.setItem(DATA_KEY,JSON.stringify(prepared));
        redraw();
        return prepared;
      }catch(error){
        adapter.setData(previous);
        if(previousRaw===null)localStorage.removeItem(DATA_KEY);else localStorage.setItem(DATA_KEY,previousRaw);
        if(previousSnapshot===null)localStorage.removeItem(SNAP_KEY);else localStorage.setItem(SNAP_KEY,previousSnapshot);
        setSelected(previousDate);
        try{redraw()}catch(rollbackError){}
        throw error;
      }
    }
    function staged(mutator,options){
      var stagedResult=stageAppend(adapter.getData(),mutator,{source:options&&options.source||'append'});
      commit(stagedResult.data,Object.assign({},options,{selectedDate:stagedResult.result&&stagedResult.result.date}));
      return stagedResult.result;
    }
    function message(error){return error&&error.message?String(error.message):'Doğrulama başarısız.'}
    function parseBox(id){
      var box=document.getElementById(id);
      var raw=box&&box.value?box.value.trim():'';
      if(!raw)fail('empty_import','JSON kutusu boş','$.import');
      return {box:box,value:parseJson(raw,{source:id})};
    }
    function secureUniversalImport(){
      try{
        var input=parseBox('universalJsonBox');
        var routedValue=input.value;
        if(isPlainObject(routedValue)){
          var routedKind=String(routedValue.type||'').trim().toLowerCase();
          var routedSource=String(routedValue.source||'').trim().toLowerCase();
          if((routedKind==='polar_flow_workout'||routedSource==='polar flow')&&typeof window.SimurgPolarWorkoutNormalize==='function'){
            scan(routedValue);
            routedValue=window.SimurgPolarWorkoutNormalize(routedValue);
          }
        }
        var result=staged(function(candidate){return routeImport(candidate,routedValue,{
          workoutNormalizer:window.normalizeWorkoutRow,
          activityNormalizer:window.normalizeWatchRecord
        })},{source:'universal-import',snapshot:true});
        if(input.box)input.box.value='';
        alert(result.kind==='polar_workout'?'Polar antrenmanı içe aktarıldı.':result.kind==='polar_recovery'?'Polar Recovery içe aktarıldı.':'İçe aktarım tamamlandı.');
        return result;
      }catch(error){alert('Universal Import başarısız: '+message(error));return null}
    }
    function secureWorkoutJson(){
      try{
        var input=parseBox('workoutJsonBox');
        var rows=Array.isArray(input.value)?input.value:(input.value.workouts||[]);
        var result=staged(function(candidate){return appendWorkoutRows(candidate,rows,window.normalizeWorkoutRow)},{source:'workout-json-import',snapshot:true});
        if(input.box)input.box.value='';
        return result;
      }catch(error){alert('Workout JSON okunamadı: '+message(error));return null}
    }
    function secureWatchJson(){
      try{
        var input=parseBox('watchJsonBox');
        var result=staged(function(candidate){return appendActivityRows(candidate,[input.value],window.normalizeWatchRecord)},{source:'activity-json-import',snapshot:true});
        if(input.box)input.box.value='';
        return result;
      }catch(error){alert('Aktivite JSON okunamadı: '+message(error));return null}
    }
    function secureWorkoutArray(rows){
      return staged(function(candidate){return appendWorkoutRows(candidate,rows,window.normalizeWorkoutRow)},{source:'callable-workout-import',snapshot:true});
    }
    function secureActivity(input){
      return staged(function(candidate){return appendActivityRows(candidate,[input],window.normalizeWatchRecord)},{source:'callable-activity-import',snapshot:true});
    }
    function securePolarWorkout(input){
      scan(input);
      var normalized=typeof window.SimurgPolarWorkoutNormalize==='function'?window.SimurgPolarWorkoutNormalize(input):input;
      var result=staged(function(candidate){return appendPolarWorkout(candidate,normalized)},{source:'manual-polar-workout',snapshot:true});
      return result&&result.record?result.record:result;
    }
    function securePolarRecovery(input){
      return staged(function(candidate){return appendPolarRecovery(candidate,input)},{source:'manual-polar-recovery',snapshot:true});
    }
    function secureBridge(input){
      scan(input);
      var normalized=window.SimurgPolarBridge&&typeof window.SimurgPolarBridge.normalize==='function'
        ?window.SimurgPolarBridge.normalize(input)
        :input;
      var result=staged(function(candidate){
        var row=validatePolarRecoveryRecord(normalized,'$.import.polarBridge',{coerce:true});
        if(!candidate.polarBridge)candidate.polarBridge={daily:{},lastSync:null};
        if(!candidate.polarBridge.daily)candidate.polarBridge.daily={};
        candidate.polarBridge.daily[row.date]=row;
        candidate.polarBridge.lastSync=new Date().toISOString();
        return {date:row.date,count:1,kind:'polar_bridge',record:row};
      },{source:'polar-bridge-import',snapshot:true});
      return {
        ok:true,
        storedAt:'simurgData.polarBridge.daily.'+result.date,
        polarBridge:adapter.getData().polarBridge,
        normalizedPayload:result.record
      };
    }
    function secureRestore(event){
      var input=event&&event.target,files=input&&input.files,file=files&&files[0];
      if(!file)return;
      if(file.size>LIMITS.maxBytes){alert('JSON içe aktarılamadı: dosya boyutu sınırı aşıyor.');input.value='';return}
      var reader=new FileReader();
      reader.onload=function(){
        try{
          var prepared=prepareFullText(String(reader.result||''),{source:'backup-file-restore',legacyAppleWatchRpe:true});
          commit(prepared.data,{source:'backup-file-restore',downloadBackup:true,backupLabel:'simurg-pre-restore'});
          alert('JSON yedeği doğrulandı ve geri yüklendi.');
        }catch(error){alert('JSON içe aktarılamadı: '+message(error))}
        finally{input.value=''}
      };
      reader.onerror=function(){alert('JSON dosyası okunamadı.');input.value=''};
      reader.readAsText(file);
    }
    function secureUndo(){
      var raw=localStorage.getItem(SNAP_KEY);
      if(!raw){alert('Geri alınabilir import bulunamadı.');return null}
      try{
        var snapshot=parseJson(raw,{source:'undo-snapshot'});
        plain(snapshot,'$.snapshot');
        var prepared=prepareFull(snapshot.data,{source:'undo-import'});
        commit(prepared.data,{source:'undo-import',selectedDate:snapshot.meta&&snapshot.meta.selectedDate});
        localStorage.removeItem(SNAP_KEY);
        alert('Son import geri alındı.');
        return prepared.data;
      }catch(error){alert('Undo başarısız: '+message(error));return null}
    }
    window.universalImport=secureUniversalImport;
    window.importWorkoutJson=secureWorkoutJson;
    window.importWatchJson=secureWatchJson;
    window.importWorkoutArray=secureWorkoutArray;
    window.importAppleWatch=secureActivity;
    window.importJSON=secureRestore;
    window.importPolarWorkout=securePolarWorkout;
    window.importPolarRecovery=securePolarRecovery;
    if(window.SimurgLegacyPolarRecovery)window.SimurgLegacyPolarRecovery.import=securePolarRecovery;
    window.simurgReceivePolarBridge=secureBridge;
    window.undoLastImport=secureUndo;
    window.SimurgDataAtomic={commit:commit,stage:staged,appendPolarWorkout:securePolarWorkout,appendPolarRecovery:securePolarRecovery,receivePolarBridge:secureBridge};
    window.__simurgPatchBInstalled=true;
    return window.SimurgDataAtomic;
  }

  return {
    CURRENT_SCHEMA_VERSION:CURRENT_SCHEMA_VERSION,
    LIMITS:LIMITS,
    ValidationError:ValidationError,
    isPlainObject:isPlainObject,
    scan:scan,
    parseJson:parseJson,
    clone:clone,
    prepareFull:prepareFull,
    prepareFullText:prepareFullText,
    stageAppend:stageAppend,
    routeImport:routeImport,
    validateWorkoutRecord:validateWorkoutRecord,
    validateActivityRecord:validateActivityRecord,
    validatePolarWorkoutRecord:validatePolarWorkoutRecord,
    validatePolarRecoveryRecord:validatePolarRecoveryRecord,
    appendPolarWorkout:appendPolarWorkout,
    appendPolarRecovery:appendPolarRecovery,
    installRuntime:installRuntime
  };
});
