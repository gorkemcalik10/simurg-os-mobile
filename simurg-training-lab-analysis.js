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
      volumeModel:options.volumeModel||root&&root.SimurgVolumeModel||null
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
  function resolveExercise(row,options){
    var dependencies=deps(options),library=dependencies.library,canonical=dependencies.canonical;
    if(!row||!library)return null;
    var id=clean(row.exerciseId),direct=id&&library.getById(id);
    if(direct)return direct;
    var definition=canonical&&(canonical.resolveId(id)||canonical.resolve(row.exercise));
    if(definition){
      var libraryId=canonicalLibraryId(definition,canonical);
      return libraryId?library.getById(libraryId):bridgedExercise(definition,library);
    }
    var key=library.normalize(row.exercise),index=exactLibraryIndex(library);
    return key&&index[key]||null;
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
  function fallbackVolumeRow(row){
    var sets=number(row.sets);if(sets==null||sets===0)sets=1;
    var reps=number(row.reps)||0,weight=number(row.weight)||0;
    return {sets:sets,reps:reps,volume:sets*reps*weight,preset:'UNASSIGNED'};
  }
  function rowMetrics(row,exercise,volumeModel){
    var calculated=volumeModel&&typeof volumeModel.row==='function'?volumeModel.row(row):fallbackVolumeRow(row);
    var sets=number(calculated.sets)||0,repsPerSet=number(calculated.reps)||0;
    var nonLoadMovement=['Isometric','Stability','Conditioning','Carry'].indexOf(exercise.movementType)>=0;
    var bodyweight=String(exercise.equipment||'').indexOf('Bodyweight')>=0;
    var meaningfulVolume=!nonLoadMovement&&!bodyweight&&number(row.weight)>0&&repsPerSet>0;
    return {sets:sets,reps:sets*repsPerSet,volume:meaningfulVolume?(number(calculated.volume)||0):0,meaningfulVolume:meaningfulVolume};
  }
  function emptyGroup(group){return {id:group,label:GROUP_LABELS[group],sets:0,reps:0,volume:0,frequency:0,dates:[],exerciseContributions:[],nonVolumeSets:0,trend:null}}
  function aggregate(rows,start,end,options){
    var dependencies=deps(options),groups=Object.create(null),unmapped=Object.create(null);
    GROUPS.forEach(function(group){groups[group]=emptyGroup(group)});
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      if(!row||!validDate(row.date)||row.date<start||row.date>end)return;
      var exercise=resolveExercise(row,dependencies),identity=clean(row.exerciseId)||clean(row.exercise)||'Bilinmeyen hareket';
      if(!exercise){
        if(!unmapped[identity])unmapped[identity]={exerciseId:clean(row.exerciseId)||null,name:clean(row.exercise)||'Bilinmeyen hareket',rows:0,dates:Object.create(null)};
        unmapped[identity].rows+=1;unmapped[identity].dates[row.date]=true;return;
      }
      var metrics=rowMetrics(row,exercise,dependencies.volumeModel);
      contributionsFor(exercise).forEach(function(contribution){
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
    return {groups:groups,unmapped:Object.keys(unmapped).map(function(key){var item=unmapped[key];item.dates=Object.keys(item.dates).sort();return item}).sort(function(a,b){return b.rows-a.rows||a.name.localeCompare(b.name)})};
  }
  function analyze(data,selectedDate,options){
    var start=weekStart(selectedDate),rows=data&&Array.isArray(data.workouts)?data.workouts:[];
    if(!start)throw new Error('Training Lab için geçerli bir YYYY-MM-DD tarihi gerekli.');
    var end=addDays(start,6),previousStart=addDays(start,-7),previousEnd=addDays(start,-1);
    var current=aggregate(rows,start,end,options),previous=aggregate(rows,previousStart,previousEnd,options);
    var ordered=GROUPS.map(function(id){
      var group=current.groups[id],before=previous.groups[id];
      group.trend=group.sets>0&&before.sets>0?{current:group.sets,previous:before.sets,percent:Math.round((group.sets-before.sets)/before.sets*100)}:null;
      return group;
    });
    return {
      period:{start:start,end:end,previousStart:previousStart,previousEnd:previousEnd},
      weights:CONTRIBUTION_WEIGHTS,groups:ordered,groupMap:current.groups,
      totals:{sets:ordered.reduce(function(sum,item){return sum+item.sets},0),reps:ordered.reduce(function(sum,item){return sum+item.reps},0),volume:ordered.reduce(function(sum,item){return sum+item.volume},0),trainingDays:new Set(rows.filter(function(row){return row&&validDate(row.date)&&row.date>=start&&row.date<=end}).map(function(row){return row.date})).size},
      unmapped:current.unmapped
    };
  }

  return Object.freeze({version:1,weights:CONTRIBUTION_WEIGHTS,groups:GROUPS,groupLabels:GROUP_LABELS,metadataBridges:METADATA_BRIDGES,weekStart:weekStart,addDays:addDays,resolveExercise:resolveExercise,contributionsFor:contributionsFor,analyze:analyze});
});
