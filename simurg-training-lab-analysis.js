(function(root,factory){
  'use strict';
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgTrainingLabAnalysis=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  // Workload contribution is deliberately simple and descriptive, not physiological.
  var CONTRIBUTION_WEIGHTS=Object.freeze({primary:1,secondary:0.5});
  var GROUPS=Object.freeze(['Chest','Back','Shoulders','Rear Delts','Biceps','Triceps','Legs','Core']);
  var GROUP_LABELS=Object.freeze({Chest:'Göğüs',Back:'Sırt',Shoulders:'Omuz', 'Rear Delts':'Arka Omuz',Biceps:'Biceps',Triceps:'Triceps',Legs:'Bacak',Core:'Core'});
  // Explicit metadata-only bridges for canonical workout identities that do not
  // have their own Exercise Library row. The canonical id/name stay unchanged.
  var METADATA_BRIDGES=Object.freeze({
    'simurg-exercise-v1-cable-kick-back':'single_arm_cable_triceps_extension',
    'simurg-exercise-v1-db-reverse-fly':'bent_over_dumbbell_reverse_fly',
    'simurg-exercise-v1-high-row':'hammer_strength_high_row',
    'simurg-exercise-v1-lat-pulldown-supinated':'lat_pulldown',
    'simurg-exercise-v1-seated-single-arm-cable-row':'single_arm_cable_row'
  });
  var LIBRARY_INDEX_CACHE=typeof WeakMap==='function'?new WeakMap():null;

  function clean(value){return String(value==null?'':value).trim()}
  function number(value){
    if(value==null||value===''||value===false)return null;
    var parsed=Number(value);return Number.isFinite(parsed)&&parsed>=0?parsed:null;
  }
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(clean(value))}
  function dateFrom(value){
    if(!validDate(value))return null;
    var parts=value.split('-').map(Number),date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
    return date.getUTCFullYear()===parts[0]&&date.getUTCMonth()===parts[1]-1&&date.getUTCDate()===parts[2]?date:null;
  }
  function formatDate(date){return date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0')}
  function addDays(value,days){var date=dateFrom(value);if(!date)return null;date.setUTCDate(date.getUTCDate()+days);return formatDate(date)}
  function weekStart(value){
    var date=dateFrom(value);if(!date)return null;
    var day=date.getUTCDay(),offset=day===0?-6:1-day;date.setUTCDate(date.getUTCDate()+offset);return formatDate(date);
  }

  function deps(options){
    options=options||{};
    return {
      library:options.library||root&&root.SimurgExerciseLibrary||null,
      canonical:options.canonical||root&&root.SimurgExerciseCanonicalization||null,
      volumeModel:options.volumeModel||root&&root.SimurgVolumeModel||null,
      anatomy:options.anatomy||root&&root.SimurgMuscleAnatomy||null
    };
  }
  function exactLibraryIndex(library){
    if(LIBRARY_INDEX_CACHE&&LIBRARY_INDEX_CACHE.has(library))return LIBRARY_INDEX_CACHE.get(library);
    var index=Object.create(null),ambiguous=Object.create(null);
    (library&&library.exercises||[]).forEach(function(exercise){
      [exercise.name].concat(exercise.aliases||[]).forEach(function(value){
        var key=library.normalize(value);if(!key)return;
        if(index[key]&&index[key].id!==exercise.id){ambiguous[key]=true;delete index[key];}
        else if(!ambiguous[key])index[key]=exercise;
      });
    });
    if(LIBRARY_INDEX_CACHE)LIBRARY_INDEX_CACHE.set(library,index);
    return index;
  }
  function canonicalLibraryId(definition,canonical){
    var aliases=canonical&&canonical.libraryIdAliases||{},ids=Object.keys(aliases);
    for(var i=0;i<ids.length;i+=1)if(aliases[ids[i]]===definition.exerciseId)return ids[i];
    return null;
  }
  function bridgedExercise(definition,library){
    var libraryId=definition&&METADATA_BRIDGES[definition.exerciseId],metadata=libraryId&&library.getById(libraryId);
    if(!metadata)return null;
    return Object.freeze({
      id:definition.exerciseId,
      name:definition.name,
      category:metadata.category,
      primaryMuscle:metadata.primaryMuscle,
      secondaryMuscles:(metadata.secondaryMuscles||[]).slice(),
      equipment:metadata.equipment,
      movementType:metadata.movementType,
      metadataSourceId:metadata.id
    });
  }
  function withAnatomicalMapping(exercise,anatomy){
    if(!exercise||!anatomy||typeof anatomy.getExerciseMapping!=='function')return exercise;
    var mapping=anatomy.getExerciseMapping(exercise);if(!mapping)return exercise;
    var record={};Object.keys(exercise).forEach(function(key){record[key]=exercise[key]});
    record.primaryMuscles=mapping.primaryMuscles.slice();record.secondaryMuscles=mapping.secondaryMuscles.slice();
    return Object.freeze(record);
  }
  function resolveExercise(row,options){
    var dependencies=deps(options),library=dependencies.library,canonical=dependencies.canonical,anatomy=dependencies.anatomy;
    if(!row||!library)return null;
    var id=clean(row.exerciseId),direct=id&&library.getById(id);
    if(direct)return withAnatomicalMapping(direct,anatomy);
    var definition=canonical&&(canonical.resolveId(id)||canonical.resolve(row.exercise));
    if(definition){
      var libraryId=canonicalLibraryId(definition,canonical);
      return withAnatomicalMapping(libraryId?library.getById(libraryId):bridgedExercise(definition,library),anatomy);
    }
    var key=library.normalize(row.exercise),index=exactLibraryIndex(library);
    return withAnatomicalMapping(key&&index[key]||null,anatomy);
  }

  function muscleGroup(muscle,category,isPrimary){
    muscle=clean(muscle);category=clean(category);
    if(isPrimary){
      if(category==='Chest')return 'Chest';
      if(category==='Back')return 'Back';
      if(category==='Shoulders')return muscle==='Rear Delts'?'Rear Delts':'Shoulders';
      if(category==='Biceps')return 'Biceps';
      if(category==='Triceps')return 'Triceps';
      if(category==='Legs'||category==='Glutes & Hamstrings'||category==='Calves')return 'Legs';
      if(category==='Core')return 'Core';
    }
    if(muscle==='Chest'||muscle==='Upper Chest'||muscle==='Lower Chest')return 'Chest';
    if(muscle==='Lats'||muscle==='Mid Back'||muscle==='Upper Back'||muscle==='Lower Back')return 'Back';
    if(muscle==='Rear Delts')return 'Rear Delts';
    if(muscle==='Front Delts'||muscle==='Side Delts'||muscle==='Shoulders'||muscle==='Traps'||muscle==='Lower Traps'||muscle==='Rotator Cuff')return 'Shoulders';
    if(muscle==='Biceps'||muscle==='Brachialis')return 'Biceps';
    if(muscle==='Triceps')return 'Triceps';
    if(muscle==='Quadriceps'||muscle==='Glutes'||muscle==='Hamstrings'||muscle==='Calves'||muscle==='Adductors')return 'Legs';
    if(muscle==='Abs'||muscle==='Obliques'||muscle==='Core'||muscle==='Hip Flexors')return 'Core';
    return null;
  }
  function contributionsFor(exercise){
    var byGroup=Object.create(null),primary=muscleGroup(exercise.primaryMuscle,exercise.category,true);
    if(primary)byGroup[primary]={group:primary,weight:CONTRIBUTION_WEIGHTS.primary,role:'primary',muscles:[exercise.primaryMuscle]};
    (exercise.secondaryMuscles||[]).forEach(function(muscle){
      var group=muscleGroup(muscle,exercise.category,false);if(!group)return;
      var existing=byGroup[group];
      if(!existing)byGroup[group]={group:group,weight:CONTRIBUTION_WEIGHTS.secondary,role:'secondary',muscles:[muscle]};
      else if(existing.muscles.indexOf(muscle)<0)existing.muscles.push(muscle);
    });
    return Object.keys(byGroup).map(function(group){return byGroup[group]});
  }
  function highLevelGroup(group){
    if(group==='Rear Delts')return 'Shoulders';
    if(group==='Biceps'||group==='Triceps')return 'Arms';
    return ['Chest','Back','Shoulders','Legs','Core'].indexOf(group)>=0?group:null;
  }
  function emptyAnatomy(anatomy){
    if(!anatomy)return null;
    var muscleMap=Object.create(null),highLevelGroupMap=Object.create(null);
    (anatomy.muscles||[]).forEach(function(muscle){
      muscleMap[muscle.id]={id:muscle.id,label:muscle.label||muscle.id,highLevelGroup:muscle.highLevelGroup,sets:0,reps:0,volume:0,frequency:0,dates:[],exerciseContributions:[],trend:null};
    });
    (anatomy.highLevelGroups||[]).forEach(function(group){highLevelGroupMap[group]={id:group,sets:0,reps:0,volume:0,fallbackSets:0}});
    return {muscleMap:muscleMap,highLevelGroupMap:highLevelGroupMap,fallbackExercises:Object.create(null)};
  }
  function addExerciseContribution(target,exercise,role,weight,metrics,rowDate){
    var item=target.exerciseContributions.find(function(candidate){return candidate.exerciseId===exercise.id});
    if(!item){item={exerciseId:exercise.id,name:exercise.name,equipment:exercise.equipment,movementType:exercise.movementType,role:role,weight:weight,sets:0,effectiveSets:0,reps:0,volume:0,frequency:0,dates:[],roles:[]};target.exerciseContributions.push(item)}
    item.sets+=metrics.sets*weight;item.reps+=metrics.reps*weight;item.volume+=metrics.volume*weight;
    item.effectiveSets=item.sets;
    if(item.dates.indexOf(rowDate)<0)item.dates.push(rowDate);
    if(item.roles.indexOf(role)<0)item.roles.push(role);
  }
  function addAnatomyRow(state,anatomy,exercise,legacyContributions,metrics,row){
    if(!state||!anatomy)return;
    var workload=anatomy.calculateEffectiveWorkload(exercise,metrics.sets);
    if(workload.mapped){
      workload.muscles.forEach(function(contribution){
        var muscle=state.muscleMap[contribution.muscleId];if(!muscle)return;
        muscle.sets+=contribution.effectiveSets;muscle.reps+=metrics.reps*contribution.weight;muscle.volume+=metrics.volume*contribution.weight;
        if(muscle.dates.indexOf(row.date)<0)muscle.dates.push(row.date);
        addExerciseContribution(muscle,exercise,contribution.role,contribution.weight,metrics,row.date);
      });
      Object.keys(workload.highLevelGroups).forEach(function(group){
        var target=state.highLevelGroupMap[group],effectiveSets=workload.highLevelGroups[group];if(!target)return;
        var weight=metrics.sets>0?effectiveSets/metrics.sets:0;
        target.sets+=effectiveSets;target.reps+=metrics.reps*weight;target.volume+=metrics.volume*weight;
      });
      return;
    }
    var fallbackByGroup=Object.create(null);
    legacyContributions.forEach(function(contribution){
      var group=highLevelGroup(contribution.group);if(!group)return;
      fallbackByGroup[group]=Math.max(fallbackByGroup[group]||0,contribution.weight);
    });
    Object.keys(fallbackByGroup).forEach(function(group){
      var target=state.highLevelGroupMap[group],weight=fallbackByGroup[group];if(!target)return;
      target.sets+=metrics.sets*weight;target.reps+=metrics.reps*weight;target.volume+=metrics.volume*weight;target.fallbackSets+=metrics.sets*weight;
    });
    var identity=exercise.id||clean(row.exerciseId)||clean(row.exercise);
    if(!state.fallbackExercises[identity])state.fallbackExercises[identity]={exerciseId:exercise.id||null,name:exercise.name||clean(row.exercise),rows:0,dates:Object.create(null)};
    state.fallbackExercises[identity].rows+=1;state.fallbackExercises[identity].dates[row.date]=true;
  }
  function finishAnatomy(state,anatomy){
    if(!state||!anatomy)return null;
    var muscles=(anatomy.muscles||[]).map(function(metadata){
      var muscle=state.muscleMap[metadata.id];muscle.dates.sort();muscle.frequency=muscle.dates.length;
      muscle.exerciseContributions.forEach(function(item){item.dates.sort();item.frequency=item.dates.length});
      muscle.exerciseContributions.sort(function(a,b){return b.sets-a.sets||a.name.localeCompare(b.name)});return muscle;
    });
    var exerciseMap=Object.create(null);
    muscles.forEach(function(muscle){muscle.exerciseContributions.forEach(function(contribution){
      var item=exerciseMap[contribution.exerciseId];
      if(!item){item={exerciseId:contribution.exerciseId,name:contribution.name,equipment:contribution.equipment,movementType:contribution.movementType,dates:[],muscles:[]};exerciseMap[contribution.exerciseId]=item}
      contribution.dates.forEach(function(date){if(item.dates.indexOf(date)<0)item.dates.push(date)});
      item.muscles.push({muscleId:muscle.id,label:muscle.label,role:contribution.role,weight:contribution.weight,effectiveSets:contribution.effectiveSets,reps:contribution.reps,volume:contribution.volume});
    })});
    var exerciseContributions=Object.keys(exerciseMap).map(function(key){var item=exerciseMap[key];item.dates.sort();item.frequency=item.dates.length;item.muscles.sort(function(a,b){return b.effectiveSets-a.effectiveSets||a.label.localeCompare(b.label)});return item});
    exerciseContributions.sort(function(a,b){return a.name.localeCompare(b.name)});
    return {
      highLevelGroups:(anatomy.highLevelGroups||[]).map(function(group){return state.highLevelGroupMap[group]}),
      highLevelGroupMap:state.highLevelGroupMap,muscles:muscles,muscleMap:state.muscleMap,
      exerciseContributions:exerciseContributions,
      fallbackExercises:Object.keys(state.fallbackExercises).map(function(key){var item=state.fallbackExercises[key];item.dates=Object.keys(item.dates).sort();return item})
    };
  }
  function fallbackVolumeRow(row){
    var sets=number(row.sets);if(sets==null||sets===0)sets=1;
    var reps=number(row.reps)||0,weight=number(row.weight)||0;
    return {sets:sets,reps:reps,volume:sets*reps*weight,preset:'UNASSIGNED'};
  }
  function profileAt(row,volumeModel,cutoff){
    var profile=volumeModel&&typeof volumeModel.profileFor==='function'?volumeModel.profileFor(row):null;
    if(!profile)return {preset:'UNASSIGNED',factor:1,profileSource:'unassigned',comparable:false};
    var updatedDate=clean(profile.updatedAt).slice(0,10),historicallyKnown=profile.profileSource!=='user'||validDate(updatedDate)&&updatedDate<=cutoff;
    return {preset:profile.preset||'UNASSIGNED',factor:number(profile.factor),profileSource:profile.profileSource||null,comparable:historicallyKnown&&profile.preset!=='UNASSIGNED'};
  }
  function rowMetrics(row,exercise,volumeModel,cutoff){
    var calculated=volumeModel&&typeof volumeModel.row==='function'?volumeModel.row(row):fallbackVolumeRow(row);
    var sets=number(calculated.sets)||0,repsPerSet=number(calculated.reps)||0;
    var nonLoadMovement=['Isometric','Stability','Conditioning','Carry'].indexOf(exercise.movementType)>=0;
    var bodyweight=String(exercise.equipment||'').indexOf('Bodyweight')>=0;
    var profile=profileAt(row,volumeModel,cutoff),historicalProfileSafe=profile.comparable||!profile||profile.preset==='UNASSIGNED'||profile.profileSource!=='user';
    var meaningfulVolume=!nonLoadMovement&&!bodyweight&&number(row.weight)>0&&repsPerSet>0&&historicalProfileSafe;
    return {sets:sets,reps:sets*repsPerSet,volume:meaningfulVolume?(number(calculated.volume)||0):0,meaningfulVolume:meaningfulVolume};
  }
  function emptyGroup(group){return {id:group,label:GROUP_LABELS[group],sets:0,reps:0,volume:0,frequency:0,dates:[],exerciseContributions:[],nonVolumeSets:0,trend:null}}
  function aggregate(rows,start,end,options,cutoff){
    var dependencies=deps(options),groups=Object.create(null),unmapped=Object.create(null),anatomyState=emptyAnatomy(dependencies.anatomy);
    GROUPS.forEach(function(group){groups[group]=emptyGroup(group)});
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      if(!row||!validDate(row.date)||row.date<start||row.date>end)return;
      var exercise=resolveExercise(row,dependencies),identity=clean(row.exerciseId)||clean(row.exercise)||'Bilinmeyen hareket';
      if(!exercise){
        if(!unmapped[identity])unmapped[identity]={exerciseId:clean(row.exerciseId)||null,name:clean(row.exercise)||'Bilinmeyen hareket',rows:0,dates:Object.create(null)};
        unmapped[identity].rows+=1;unmapped[identity].dates[row.date]=true;return;
      }
      var metrics=rowMetrics(row,exercise,dependencies.volumeModel,cutoff||end);
      var legacyContributions=contributionsFor(exercise);
      addAnatomyRow(anatomyState,dependencies.anatomy,exercise,legacyContributions,metrics,row);
      legacyContributions.forEach(function(contribution){
        var group=groups[contribution.group];if(!group)return;
        var weightedSets=metrics.sets*contribution.weight,weightedReps=metrics.reps*contribution.weight,weightedVolume=metrics.volume*contribution.weight;
        group.sets+=weightedSets;group.reps+=weightedReps;group.volume+=weightedVolume;
        if(!metrics.meaningfulVolume)group.nonVolumeSets+=weightedSets;
        if(group.dates.indexOf(row.date)<0)group.dates.push(row.date);
        var item=group.exerciseContributions.find(function(candidate){return candidate.exerciseId===exercise.id});
        if(!item){item={exerciseId:exercise.id,name:exercise.name,equipment:exercise.equipment,movementType:exercise.movementType,sets:0,reps:0,volume:0,frequency:0,dates:[],roles:[]};group.exerciseContributions.push(item)}
        item.sets+=weightedSets;item.reps+=weightedReps;item.volume+=weightedVolume;
        if(item.dates.indexOf(row.date)<0)item.dates.push(row.date);
        if(item.roles.indexOf(contribution.role)<0)item.roles.push(contribution.role);
      });
    });
    GROUPS.forEach(function(id){
      var group=groups[id];group.dates.sort();group.frequency=group.dates.length;
      group.exerciseContributions.forEach(function(item){item.dates.sort();item.frequency=item.dates.length});
      group.exerciseContributions.sort(function(a,b){return b.sets-a.sets||b.reps-a.reps||a.name.localeCompare(b.name)});
    });
    return {groups:groups,anatomy:finishAnatomy(anatomyState,dependencies.anatomy),unmapped:Object.keys(unmapped).map(function(key){var item=unmapped[key];item.dates=Object.keys(item.dates).sort();return item}).sort(function(a,b){return b.rows-a.rows||a.name.localeCompare(b.name)})};
  }
  function average(values){return values.length?values.reduce(function(sum,value){return sum+value},0)/values.length:null}
  function median(values){
    if(!values.length)return null;var ordered=values.slice().sort(function(a,b){return a-b}),middle=Math.floor(ordered.length/2);
    return ordered.length%2?ordered[middle]:(ordered[middle-1]+ordered[middle])/2;
  }
  function clearPain(value){return !clean(value)||/^(?:none|no|yok|0|ağrı yok|agri yok)$/i.test(clean(value))}
  function goodForm(value){return !clean(value)||/^(?:good|iyi|clean|temiz)$/i.test(clean(value))}
  function strictRowMetrics(row,exercise,volumeModel,cutoff){
    var sets=number(row&&row.sets),reps=number(row&&row.reps),load=number(row&&row.weight),profile=profileAt(row,volumeModel,cutoff);
    var nonLoadMovement=['Isometric','Stability','Conditioning','Carry'].indexOf(exercise.movementType)>=0;
    var bodyweight=String(exercise.equipment||'').indexOf('Bodyweight')>=0;
    var loadMovement=!nonLoadMovement&&!bodyweight;
    var volume=sets!=null&&sets>0&&reps!=null&&load!=null&&load>0&&loadMovement&&profile.comparable?sets*reps*load*profile.factor:null;
    return {sets:sets,repsPerSet:reps,totalReps:sets!=null&&sets>0&&reps!=null?sets*reps:null,load:load!=null&&load>0?load:null,volume:volume,preset:profile.preset,loadComparable:profile.comparable&&loadMovement};
  }
  function sessionSummary(rows,exercise,volumeModel,cutoff,date,sessionKey){
    var metrics=rows.map(function(row){return strictRowMetrics(row,exercise,volumeModel,cutoff)}),sets=metrics.every(function(item){return item.sets!=null&&item.sets>0})?metrics.reduce(function(sum,item){return sum+item.sets},0):null;
    var totalReps=metrics.every(function(item){return item.totalReps!=null})?metrics.reduce(function(sum,item){return sum+item.totalReps},0):null;
    var volumes=metrics.map(function(item){return item.volume}),volume=volumes.length&&volumes.every(function(value){return value!=null})?volumes.reduce(function(sum,value){return sum+value},0):null;
    var comparable=metrics.length>0&&metrics.every(function(item){return item.loadComparable}),loads=comparable?metrics.map(function(item){return item.load}).filter(function(value){return value!=null}):[];
    var repsByLoad=Object.create(null);
    if(comparable)metrics.forEach(function(item){if(item.load==null||item.repsPerSet==null)return;var key=String(item.load);repsByLoad[key]=Math.max(repsByLoad[key]||0,item.repsPerSet)});
    var rpes=rows.map(function(row){return number(row&&row.rpe)}).filter(function(value){return value!=null&&value>=1&&value<=10}),forms=rows.map(function(row){return clean(row&&row.form)}).filter(Boolean),pains=rows.map(function(row){return clean(row&&row.pain)}).filter(Boolean);
    var pain=rows.some(function(row){return !clearPain(row&&row.pain)}),poorForm=rows.some(function(row){return !goodForm(row&&row.form)}),highRpe=rpes.some(function(value){return value>=9});
    return {date:date,sessionKey:sessionKey,rows:rows.slice(),sets:sets,totalReps:totalReps,volume:volume,maxLoad:loads.length?Math.max.apply(null,loads):null,repsByLoad:repsByLoad,preset:comparable&&metrics[0]?metrics[0].preset:null,comparable:comparable&&loads.length>0,rpe:average(rpes),form:forms.length?forms[forms.length-1]:null,pain:pains.length?pains[pains.length-1]:null,caution:{active:pain||poorForm||highRpe,pain:pain,poorForm:poorForm,highRpe:highRpe},qualified:!pain&&!poorForm&&sets!=null&&totalReps!=null};
  }
  function exerciseSessions(rows,cutoff,options){
    var dependencies=deps(options),groups=Object.create(null);
    (Array.isArray(rows)?rows:[]).forEach(function(row,index){
      if(!row||!validDate(row.date)||row.date>cutoff)return;var exercise=resolveExercise(row,dependencies);if(!exercise)return;
      var identity=exercise.id,sessionKey=row.sessionId?clean(row.sessionId):'legacy',key=identity+'|'+row.date+'|'+sessionKey;
      if(!groups[key])groups[key]={exercise:exercise,date:row.date,sessionKey:sessionKey,firstIndex:index,rows:[]};groups[key].rows.push(row);
    });
    var byExercise=Object.create(null);
    Object.keys(groups).forEach(function(key){var group=groups[key],session=sessionSummary(group.rows,group.exercise,dependencies.volumeModel,cutoff,group.date,group.sessionKey);if(!byExercise[group.exercise.id])byExercise[group.exercise.id]={exerciseId:group.exercise.id,name:group.exercise.name,equipment:group.exercise.equipment,movementType:group.exercise.movementType,sessions:[]};byExercise[group.exercise.id].sessions.push(session)});
    Object.keys(byExercise).forEach(function(key){byExercise[key].sessions.sort(function(a,b){return a.date.localeCompare(b.date)||a.sessionKey.localeCompare(b.sessionKey)})});
    return byExercise;
  }
  function personalRecords(sessions){
    var records={highestLoad:null,highestSessionVolume:null,highestTotalReps:null,bestRepsByLoad:[]},events=[],bestReps=Object.create(null);
    sessions.forEach(function(session){
      if(session.maxLoad!=null&&(!records.highestLoad||session.maxLoad>records.highestLoad.value)){records.highestLoad={value:session.maxLoad,date:session.date,sessionKey:session.sessionKey,preset:session.preset};events.push({type:'highest_load',date:session.date,sessionKey:session.sessionKey,value:session.maxLoad})}
      if(session.volume!=null&&(!records.highestSessionVolume||session.volume>records.highestSessionVolume.value)){records.highestSessionVolume={value:session.volume,date:session.date,sessionKey:session.sessionKey};events.push({type:'highest_session_volume',date:session.date,sessionKey:session.sessionKey,value:session.volume})}
      if(session.totalReps!=null&&(!records.highestTotalReps||session.totalReps>records.highestTotalReps.value)){records.highestTotalReps={value:session.totalReps,date:session.date,sessionKey:session.sessionKey};events.push({type:'highest_total_reps',date:session.date,sessionKey:session.sessionKey,value:session.totalReps})}
      Object.keys(session.repsByLoad).forEach(function(load){var reps=session.repsByLoad[load],previous=bestReps[load];if(previous&&reps>previous.reps)events.push({type:'highest_reps_same_load',date:session.date,sessionKey:session.sessionKey,load:Number(load),value:reps});if(!previous||reps>previous.reps)bestReps[load]={load:Number(load),reps:reps,date:session.date,sessionKey:session.sessionKey}});
    });
    records.bestRepsByLoad=Object.keys(bestReps).map(function(key){return bestReps[key]}).sort(function(a,b){return b.load-a.load});
    return {records:records,events:events};
  }
  function progression(sessions){
    var emptyMetrics={loadPercent:null,volumePercent:null,repsPercent:null,repsLoad:null};
    var qualified=sessions.filter(function(session){return session.qualified&&!session.caution.pain&&!session.caution.poorForm}),excluded=sessions.length-qualified.length;
    if(qualified.length<6)return {classification:'insufficient_data',evidence:'Karşılaştırma için en az altı güvenilir seans gerekli.',qualifiedSessions:qualified.length,excludedSessions:excluded,metrics:emptyMetrics};
    var recent=qualified.slice(-3),prior=qualified.slice(-6,-3);
    var recentLoads=recent.map(function(item){return item.maxLoad}).filter(function(value){return value!=null}),priorLoads=prior.map(function(item){return item.maxLoad}).filter(function(value){return value!=null});
    var recentVolumes=recent.map(function(item){return item.volume}).filter(function(value){return value!=null}),priorVolumes=prior.map(function(item){return item.volume}).filter(function(value){return value!=null}),signals=[],metrics={loadPercent:null,volumePercent:null,repsPercent:null,repsLoad:null};
    if(recentLoads.length===recent.length&&priorLoads.length===prior.length){var priorLoad=median(priorLoads),loadDelta=(median(recentLoads)-priorLoad)/priorLoad;metrics.loadPercent=Math.round(loadDelta*100);if(loadDelta>.02)signals.push(1);else if(loadDelta<-.02)signals.push(-1);else signals.push(0)}
    var sameStructure=new Set(recent.concat(prior).map(function(item){return item.sets})).size===1;
    if(sameStructure&&recentVolumes.length===recent.length&&priorVolumes.length===prior.length){var priorVolume=median(priorVolumes),volumeDelta=(median(recentVolumes)-priorVolume)/priorVolume;metrics.volumePercent=Math.round(volumeDelta*100);if(volumeDelta>.05)signals.push(1);else if(volumeDelta<-.05)signals.push(-1);else signals.push(0)}
    var commonLoads=Object.keys(recent.reduce(function(map,item){Object.keys(item.repsByLoad).forEach(function(load){map[load]=(map[load]||0)+1});return map},Object.create(null))).filter(function(load){return recent.filter(function(item){return item.repsByLoad[load]!=null}).length>=2&&prior.filter(function(item){return item.repsByLoad[load]!=null}).length>=2}).map(Number).sort(function(a,b){return b-a});
    if(commonLoads.length){var repsLoad=commonLoads[0],recentReps=recent.map(function(item){return item.repsByLoad[String(repsLoad)]}).filter(function(value){return value!=null}),priorReps=prior.map(function(item){return item.repsByLoad[String(repsLoad)]}).filter(function(value){return value!=null}),priorRep=median(priorReps),repsDelta=(median(recentReps)-priorRep)/priorRep;metrics.repsLoad=repsLoad;metrics.repsPercent=Math.round(repsDelta*100);if(repsDelta>.05)signals.push(1);else if(repsDelta<-.05)signals.push(-1);else signals.push(0)}
    if(!signals.length)return {classification:'insufficient_data',evidence:'Yük, tekrar veya hacim semantiği güvenilir biçimde karşılaştırılamıyor.',qualifiedSessions:qualified.length,excludedSessions:excluded,metrics:metrics};
    var positive=signals.indexOf(1)>=0,negative=signals.indexOf(-1)>=0,classification=positive&&!negative?'improving':negative&&!positive?'declining':'stable';
    var facts=[];if(metrics.loadPercent!=null)facts.push('yük '+(metrics.loadPercent>0?'+':'')+metrics.loadPercent+'%');if(metrics.repsPercent!=null)facts.push(repsLoad+' kg tekrar '+(metrics.repsPercent>0?'+':'')+metrics.repsPercent+'%');if(metrics.volumePercent!=null)facts.push('hacim '+(metrics.volumePercent>0?'+':'')+metrics.volumePercent+'%');
    var evidence=classification==='improving'?'Yakın dönem kişisel önceki dönemin üzerinde: '+facts.join(', ')+'.':classification==='declining'?'Yakın dönem karşılaştırılabilir performansı önceki dönemin altında: '+facts.join(', ')+'.':'Karşılaştırılabilir değişimler karışık veya anlamlı eşiklerin içinde: '+facts.join(', ')+'.';
    return {classification:classification,evidence:evidence,qualifiedSessions:qualified.length,excludedSessions:excluded,metrics:metrics};
  }
  function plateau(sessions){
    var recent=sessions.slice(-4);if(recent.length<4)return {active:false,reason:'insufficient_data',evidence:'Plateau için en az dört yakın seans gerekli.'};
    if(recent.some(function(item){return !item.qualified||item.caution.active||!item.comparable||item.volume==null}))return {active:false,reason:'unreliable_comparison',evidence:'Ağrı, form, RPE veya yük semantiği karşılaştırmayı güvenilmez kılıyor.'};
    var structures=recent.map(function(item){return item.sets}),presets=recent.map(function(item){return item.preset});if(new Set(structures).size!==1||new Set(presets).size!==1)return {active:false,reason:'session_structure_changed',evidence:'Seans yapısı veya yük semantiği değiştiği için plateau değerlendirilmedi.'};
    var baseline=recent[0],improved=recent.slice(1).some(function(item){if(item.maxLoad>baseline.maxLoad*1.02||item.volume>baseline.volume*1.03)return true;return Object.keys(baseline.repsByLoad).some(function(load){var candidate=item.repsByLoad[load];return candidate!=null&&candidate>baseline.repsByLoad[load]})});
    return improved?{active:false,reason:'meaningful_improvement',evidence:'Yakın pencerede anlamlı yük, tekrar veya hacim gelişimi var.'}:{active:true,reason:'no_meaningful_improvement',evidence:'Son dört karşılaştırılabilir seansta anlamlı yük, tekrar veya hacim artışı görülmedi.'};
  }
  function exerciseIntelligence(rows,cutoff,options){
    var byExercise=exerciseSessions(rows,cutoff,options),items=Object.keys(byExercise).map(function(key){var item=byExercise[key],prs=personalRecords(item.sessions),trend=progression(item.sessions),plateauResult=plateau(item.sessions),recent=item.sessions.slice(-5).reverse(),latest=recent[0]||null,latestDate=latest&&latest.date,latestSessions=recent.filter(function(session){return session.date===latestDate}),latestContext=latestSessions.find(function(session){return session.caution.active})||latest,caution=latestContext?latestContext.caution:{active:false,pain:false,poorForm:false,highRpe:false};return {exerciseId:item.exerciseId,name:item.name,equipment:item.equipment,movementType:item.movementType,lastPerformedDate:latestDate||null,recentSessions:recent,latestContext:latestContext,sessionCount:item.sessions.length,personalRecords:prs.records,prEvents:prs.events,progression:trend,plateau:plateauResult,caution:caution,presentationPriority:caution.active?'caution':plateauResult.active?'plateau':trend.classification};});
    items.sort(function(a,b){return String(b.lastPerformedDate).localeCompare(String(a.lastPerformedDate))||a.name.localeCompare(b.name)});return {exercises:items,exerciseMap:items.reduce(function(map,item){map[item.exerciseId]=item;return map},Object.create(null))};
  }
  function contributionTrends(current,previous){
    if(!current||!previous)return [];return current.muscles.map(function(item){var before=previous.muscleMap[item.id],previousSets=before?before.sets:0;return {muscleId:item.id,label:item.label,current:item.sets,previous:previousSets,delta:item.sets-previousSets,percent:item.sets>0&&previousSets>0?Math.round((item.sets-previousSets)/previousSets*100):null}}).filter(function(item){return item.current>0||item.previous>0}).sort(function(a,b){return Math.abs(b.delta)-Math.abs(a.delta)||b.current-a.current}).slice(0,6);
  }
  function analyze(data,selectedDate,options){
    var start=weekStart(selectedDate),rows=data&&Array.isArray(data.workouts)?data.workouts:[];
    if(!start)throw new Error('Training Lab için geçerli bir YYYY-MM-DD tarihi gerekli.');
    var end=addDays(start,6),cutoff=selectedDate<end?selectedDate:end,previousStart=addDays(start,-7),previousEnd=addDays(start,-1);
    var current=aggregate(rows,start,cutoff,options,cutoff),previous=aggregate(rows,previousStart,previousEnd,options,cutoff),intelligence=exerciseIntelligence(rows,cutoff,options);
    var ordered=GROUPS.map(function(id){
      var group=current.groups[id],before=previous.groups[id];
      group.trend=group.sets>0&&before.sets>0?{current:group.sets,previous:before.sets,percent:Math.round((group.sets-before.sets)/before.sets*100)}:null;
      return group;
    });
    if(current.anatomy&&previous.anatomy)current.anatomy.muscles.forEach(function(muscle){
      var before=previous.anatomy.muscleMap[muscle.id];
      muscle.trend=muscle.sets>0&&before&&before.sets>0?{current:muscle.sets,previous:before.sets,percent:Math.round((muscle.sets-before.sets)/before.sets*100)}:null;
    });
    return {
      period:{start:start,end:end,cutoff:cutoff,previousStart:previousStart,previousEnd:previousEnd},
      weights:CONTRIBUTION_WEIGHTS,groups:ordered,groupMap:current.groups,
      totals:{sets:ordered.reduce(function(sum,item){return sum+item.sets},0),reps:ordered.reduce(function(sum,item){return sum+item.reps},0),volume:ordered.reduce(function(sum,item){return sum+item.volume},0),trainingDays:new Set(rows.filter(function(row){return row&&validDate(row.date)&&row.date>=start&&row.date<=cutoff}).map(function(row){return row.date})).size},
      anatomy:current.anatomy,contributionTrends:contributionTrends(current.anatomy,previous.anatomy),unmapped:current.unmapped,
      intelligence:intelligence
    };
  }

  return Object.freeze({version:4,weights:CONTRIBUTION_WEIGHTS,groups:GROUPS,groupLabels:GROUP_LABELS,metadataBridges:METADATA_BRIDGES,weekStart:weekStart,addDays:addDays,resolveExercise:resolveExercise,contributionsFor:contributionsFor,exerciseIntelligence:exerciseIntelligence,analyze:analyze});
});
