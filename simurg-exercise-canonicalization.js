(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgExerciseCanonicalization=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var VERSION=1;
  var BACKUP_KEY='simurg_exercise_canonicalization_v1_backup';
  var DEFINITIONS=[
    ['bench-supported-db-row','Bench Supported DB Row','Sırt',['Bench Supported DB Row','Bench Supported Row']],
    ['cable-fly','Cable Fly','Göğüs',['Cable Fly']],
    ['cable-kick-back','Cable Kick Back','Triceps',['Cable Kick Back']],
    ['chest-press-machine','Chest Press Machine','Göğüs',['Chest Press Machine']],
    ['incline-machine-press','Incline Machine Press','Göğüs',['Incline Machine Press','Incline Press Machine']],
    ['db-curl','DB Curl','Biceps',['DB Curl']],
    ['db-reverse-fly','DB Reverse Fly','Arka Omuz',['DB Reverse Fly']],
    ['facepull','Facepull','Arka Omuz',['Face Pull','Facepull']],
    ['flat-db-press','Flat DB Press','Göğüs',['Flat DB Press']],
    ['hammer-curl','Hammer Curl','Biceps',['Hammer Curl']],
    ['hammer-strength-high-row','Hammer Strength High Row','Sırt',['Hammer Strength High Row']],
    ['high-row','High Row','Sırt',['High Row']],
    ['incline-db-curl','Incline DB Curl','Biceps',['Incline DB Curl']],
    ['incline-db-curl-rope-pushdown-superset','Incline DB Curl / Rope Pushdown (Superset)','Kol',['Incline DB Curl / Rope Pushdown Superset','Incline DB Curl / Rope Pushdown (Superset)']],
    ['incline-db-press','Incline DB Press','Göğüs',['Incline DB Press']],
    ['lat-pulldown','Lat Pulldown','Sırt',['Lat Pull Down','Lat Pulldown']],
    ['lat-pulldown-supinated','Lat Pulldown Supinated','Sırt',['Lat Pulldown Supinated']],
    ['lateral-raise','Lateral Raise','Omuz',['Lateral Raise']],
    ['machine-row','Machine Row','Sırt',['Machine Row']],
    ['prone-y-raise','Prone Y Raise','Arka Omuz',['Prone Y Raise']],
    ['rear-delt-cable-fly','Rear Delt Cable Fly','Arka Omuz',['Rear Delt Cable Fly']],
    ['reverse-cable-curl','Reverse Cable Curl','Biceps',['Reverse Cable Curl','Reverse DB Curl']],
    ['reverse-grip-pushdown','Reverse Grip Pushdown','Triceps',['Reverse Grip Pushdown','Reverse Triceps Pushdown']],
    ['rope-pushdown','Rope Pushdown','Triceps',['Rope Pushdown']],
    ['rope-pushdown-incline-db-curl-superset','Rope Pushdown / Incline DB Curl (Superset)','Kol',['Rope Pushdown / Incline DB Curl Superset','Rope Pushdown / Incline DB Curl (Superset)']],
    ['seated-cable-row','Seated Cable Row','Sırt',['Saetad Cable Row','Seated Cable Row']],
    ['seated-single-arm-cable-row','Seated Single Arm Cable Row','Sırt',['Seated Arm Cable Row','Seated Single Arm Cable Row']],
    ['single-arm-cable-row','Single Arm Cable Row','Sırt',['Single Arm Cable Row']],
    ['single-arm-lat-pulldown','Single Arm Lat Pulldown','Sırt',['Single Arm Lat Pulldown']]
  ].map(function(row){
    return {exerciseId:'simurg-exercise-v1-'+row[0],name:row[1],bodyPart:row[2],aliases:row[3].slice()};
  });
  var BY_NAME=Object.create(null),BY_ID=Object.create(null),BY_PROFILE_KEY=Object.create(null);

  function clean(value){return String(value==null?'':value).trim()}
  function profileKey(value){return clean(value).toLowerCase().replace(/\s+/g,' ')}
  DEFINITIONS.forEach(function(definition){
    BY_ID[definition.exerciseId]=definition;
    definition.aliases.forEach(function(alias){BY_NAME[alias]=definition;BY_PROFILE_KEY[profileKey(alias)]=definition});
  });
  function resolve(value){return BY_NAME[clean(value)]||null}
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function own(object,key){return Object.prototype.hasOwnProperty.call(object,key)}
  function laterValue(a,b){
    if(a==null)return b;if(b==null)return a;
    var aStamp=clean(a.updatedAt||a.date||a.sourceDate),bStamp=clean(b.updatedAt||b.date||b.sourceDate);
    return bStamp>aStamp?b:a;
  }
  function mergeObjects(preferred,other){
    var result=Object.assign({},other||{},preferred||{});
    Object.keys(other||{}).forEach(function(key){if(result[key]===undefined||result[key]===null||result[key]==='')result[key]=other[key]});
    return result;
  }
  function reportBase(data){
    var names=Object.create(null),ids=Object.create(null),catalog=data&&data.exerciseCatalog&&typeof data.exerciseCatalog==='object'?data.exerciseCatalog:{};
    (data&&data.workouts||[]).forEach(function(row){if(resolve(row&&row.exercise)){names[clean(row.exercise)]=true;if(clean(row.exerciseId))ids[clean(row.exerciseId)]=true}});
    Object.keys(catalog).forEach(function(key){var item=catalog[key]||{};if(resolve(item.name)){names[clean(item.name)]=true;ids[clean(item.exerciseId)||clean(key)]=true}});
    return {approvedNames:Object.keys(names).length,approvedIdentities:Object.keys(ids).length,catalogEntries:Object.keys(catalog).length};
  }
  function collisionError(id,name){
    var error=new Error('Canonical exerciseId collision: '+id+' is already used by unrelated exercise "'+clean(name)+'".');
    error.code='canonical_exercise_id_collision';throw error;
  }
  function assertNoIdCollisions(data){
    (data.workouts||[]).forEach(function(row){
      var id=clean(row&&row.exerciseId),definition=BY_ID[id];
      if(definition&&!resolve(row&&row.exercise))collisionError(id,row&&row.exercise);
    });
    var catalog=data.exerciseCatalog&&typeof data.exerciseCatalog==='object'&&!Array.isArray(data.exerciseCatalog)?data.exerciseCatalog:{};
    Object.keys(catalog).forEach(function(key){
      var item=catalog[key]||{},id=clean(item.exerciseId)||clean(key),definition=BY_ID[id];
      if(definition&&!resolve(item.name))collisionError(id,item.name);
      if(BY_ID[clean(key)]&&!resolve(item.name))collisionError(clean(key),item.name);
    });
  }
  function canonicalizeWorkoutRows(data,report){
    (data.workouts||[]).forEach(function(row){
      var definition=resolve(row&&row.exercise);if(!definition)return;
      if(row.exercise!==definition.name||row.bodyPart!==definition.bodyPart||row.exerciseId!==definition.exerciseId)report.workoutRowsChanged+=1;
      row.exercise=definition.name;row.bodyPart=definition.bodyPart;row.exerciseId=definition.exerciseId;
    });
  }
  function canonicalizeCatalog(data,report){
    if(!data.exerciseCatalog||typeof data.exerciseCatalog!=='object'||Array.isArray(data.exerciseCatalog))return;
    var source=data.exerciseCatalog,result={},groups=Object.create(null);
    Object.keys(source).sort().forEach(function(key){
      var item=source[key]||{},definition=resolve(item.name);
      if(!definition){result[key]=item;return}
      if(key!==definition.exerciseId||item.exerciseId!==definition.exerciseId||item.name!==definition.name||item.bodyPart!==definition.bodyPart)report.catalogEntriesChanged+=1;
      (groups[definition.exerciseId]=groups[definition.exerciseId]||[]).push({key:key,item:item,canonical:item.name===definition.name});
    });
    Object.keys(groups).forEach(function(id){
      var definition=BY_ID[id],members=groups[id].sort(function(a,b){return Number(b.canonical)-Number(a.canonical)||a.key.localeCompare(b.key)}),merged={};
      members.slice().reverse().forEach(function(member){merged=mergeObjects(member.item,merged)});
      merged.exerciseId=id;merged.name=definition.name;merged.bodyPart=definition.bodyPart;result[id]=merged;
      report.catalogEntriesMerged+=Math.max(0,members.length-1);
    });
    data.exerciseCatalog=result;
  }
  function canonicalizeProgramItem(item,report){
    if(Array.isArray(item)){
      var tupleDefinition=resolve(item[0]);if(!tupleDefinition)return;
      if(item[0]!==tupleDefinition.name||item[1]!==tupleDefinition.bodyPart)report.programReferencesChanged+=1;
      item[0]=tupleDefinition.name;item[1]=tupleDefinition.bodyPart;return;
    }
    if(!item||typeof item!=='object')return;
    var field=own(item,'name')?'name':(own(item,'exercise')?'exercise':null),definition=field&&resolve(item[field]);
    if(definition){
      if(item[field]!==definition.name||item.bodyPart!==definition.bodyPart||item.exerciseId!==definition.exerciseId)report.programReferencesChanged+=1;
      item[field]=definition.name;if(own(item,'name')&&field!=='name')item.name=definition.name;if(own(item,'exercise'))item.exercise=definition.name;
      item.bodyPart=definition.bodyPart;item.exerciseId=definition.exerciseId;
    }
  }
  function canonicalizePrograms(data,report){
    var programs=data.customGymPrograms;if(!programs||typeof programs!=='object'||Array.isArray(programs))return;
    Object.keys(programs).forEach(function(programKey){
      var entry=programs[programKey];
      if(Array.isArray(entry)){entry.forEach(function(item){canonicalizeProgramItem(item,report)});return}
      if(!entry||typeof entry!=='object')return;
      ['extras','items','exercises'].forEach(function(key){if(Array.isArray(entry[key]))entry[key].forEach(function(item){canonicalizeProgramItem(item,report)})});
      if(entry.overrides&&typeof entry.overrides==='object'&&!Array.isArray(entry.overrides)){
        var overrides={};
        Object.keys(entry.overrides).forEach(function(key){
          var item=entry.overrides[key];canonicalizeProgramItem(item,report);
          var definition=resolve(key),nextKey=definition?definition.name:key;
          overrides[nextKey]=overrides[nextKey]?mergeObjects(overrides[nextKey],item):item;
          if(nextKey!==key)report.programReferencesChanged+=1;
        });
        entry.overrides=overrides;
      }
    });
  }
  function canonicalizeNamedMap(map,report,field){
    if(!map||typeof map!=='object'||Array.isArray(map))return;
    var result={};
    Object.keys(map).forEach(function(key){
      var definition=resolve(key),nextKey=definition?definition.name:key,value=map[key];
      if(own(result,nextKey))value=laterValue(result[nextKey],value);
      result[nextKey]=value;if(nextKey!==key)report[field]+=1;
    });
    Object.keys(map).forEach(function(key){delete map[key]});Object.keys(result).forEach(function(key){map[key]=result[key]});
  }
  function canonicalizeProfiles(data,report){
    var profiles=data.exerciseLoadProfiles;if(!profiles||typeof profiles!=='object'||Array.isArray(profiles))return;
    var result={};
    Object.keys(profiles).forEach(function(key){
      var definition=BY_PROFILE_KEY[profileKey(key)],nextKey=definition?profileKey(definition.name):key,value=profiles[key];
      if(own(result,nextKey))value=laterValue(result[nextKey],value);
      result[nextKey]=value;if(nextKey!==key)report.profileReferencesChanged+=1;
    });
    data.exerciseLoadProfiles=result;
  }
  function canonicalize(data){
    if(!data||typeof data!=='object'||Array.isArray(data))throw new TypeError('Canonicalization requires a DATA object.');
    var before=reportBase(data),rowCountBefore=Array.isArray(data.workouts)?data.workouts.length:0;
    var report={version:VERSION,changed:false,workoutRowsChanged:0,catalogEntriesChanged:0,catalogEntriesMerged:0,programReferencesChanged:0,targetReferencesChanged:0,profileReferencesChanged:0,coachCategoryReferencesChanged:0,rowCountBefore:rowCountBefore,rowCountAfter:rowCountBefore,before:before,after:null};
    assertNoIdCollisions(data);
    canonicalizeWorkoutRows(data,report);canonicalizeCatalog(data,report);canonicalizePrograms(data,report);
    canonicalizeNamedMap(data.autoNextTargets,report,'targetReferencesChanged');canonicalizeProfiles(data,report);
    var categories=data.coachIntelligence&&data.coachIntelligence.settings&&data.coachIntelligence.settings.movementCategories;
    canonicalizeNamedMap(categories,report,'coachCategoryReferencesChanged');
    report.rowCountAfter=Array.isArray(data.workouts)?data.workouts.length:0;report.after=reportBase(data);
    report.changed=['workoutRowsChanged','catalogEntriesChanged','catalogEntriesMerged','programReferencesChanged','targetReferencesChanged','profileReferencesChanged','coachCategoryReferencesChanged'].some(function(key){return report[key]>0})
      ||before.catalogEntries!==report.after.catalogEntries||before.approvedNames!==report.after.approvedNames||before.approvedIdentities!==report.after.approvedIdentities;
    if(report.rowCountBefore!==report.rowCountAfter)throw new Error('Exercise canonicalization changed workout row count.');
    return report;
  }
  function prepared(data){var next=clone(data),report=canonicalize(next);return {data:next,report:report}}
  function persistWithBackup(storage,original,canonical,persistence,source){
    if(!storage||!persistence)throw new Error('Migration persistence dependencies are unavailable.');
    var previousDataRaw=storage.getItem(persistence.DATA_KEY),previousBackupRaw=storage.getItem(BACKUP_KEY),createdBackup=false;
    try{
      if(previousBackupRaw===null){
        persistence.requireSuccess(persistence.writeJson(storage,BACKUP_KEY,{meta:{version:VERSION,source:source||'exercise-canonicalization',createdAt:new Date().toISOString()},data:clone(original)}));
        createdBackup=true;
      }
      persistence.requireSuccess(persistence.persistData(storage,canonical));
      return {ok:true,backupKey:BACKUP_KEY,backupCreated:createdBackup};
    }catch(error){
      if(previousDataRaw===null)persistence.remove(storage,persistence.DATA_KEY);else persistence.writeRaw(storage,persistence.DATA_KEY,previousDataRaw);
      if(previousBackupRaw===null)persistence.remove(storage,BACKUP_KEY);else persistence.writeRaw(storage,BACKUP_KEY,previousBackupRaw);
      return {ok:false,error:error,backupKey:BACKUP_KEY,backupCreated:false};
    }
  }

  return {VERSION:VERSION,BACKUP_KEY:BACKUP_KEY,definitions:DEFINITIONS,resolve:resolve,canonicalize:canonicalize,prepared:prepared,persistWithBackup:persistWithBackup,profileKey:profileKey};
});
