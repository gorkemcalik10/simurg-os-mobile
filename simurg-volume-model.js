(function(root,factory){
  'use strict';
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgVolumeModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  var PRESETS={
    DUAL_DUMBBELL:{key:'DUAL_DUMBBELL',label:'İki Dambıl / Çift Taraf',factor:2,weightLabel:'kg/dambıl'},
    PER_SIDE_BOTH:{key:'PER_SIDE_BOTH',label:'Yan Başına Plaka / İki Taraf',factor:2,weightLabel:'kg/yan'},
    UNILATERAL_BOTH:{key:'UNILATERAL_BOTH',label:'Tek Kol Hareket / Sağ + Sol',factor:2,weightLabel:'kg/taraf'},
    TOTAL_SYSTEM:{key:'TOTAL_SYSTEM',label:'Toplam Ağırlık',factor:1,weightLabel:'toplam kg'},
    STACK_TOTAL:{key:'STACK_TOTAL',label:'Tek Stack / Makine Değeri',factor:1,weightLabel:'stack kg'},
    SINGLE_SIDE:{key:'SINGLE_SIDE',label:'Yalnızca Tek Taraf',factor:1,weightLabel:'kg/tek taraf'},
    UNASSIGNED:{key:'UNASSIGNED',label:'Yük tipi seçilmedi',factor:1,weightLabel:'kg'}
  };
  var DEFAULT_ALIASES={};

  function profileKey(exerciseName){
    return String(exerciseName==null?'':exerciseName).trim().toLowerCase().replace(/\s+/g,' ');
  }
  function aliases(preset,names){
    names.forEach(function(name){DEFAULT_ALIASES[profileKey(name)]=preset;});
  }
  aliases('DUAL_DUMBBELL',['Incline DB Press','Incline Dumbbell Press','Flat DB Press','Flat Dumbbell Press','Bench Supported DB Row','Lateral Raise','Incline DB Curl','Prone Y Raise']);
  aliases('PER_SIDE_BOTH',['High Row','Hammer Strength High Row','Plate Loaded High Row','Plate Loaded Chest Press']);
  aliases('UNILATERAL_BOTH',['Single Arm Cable Row','Single Arm Lat Pulldown']);
  aliases('STACK_TOTAL',['Face Pull','Rope Pushdown','Reverse Cable Curl','Reverse Grip Pushdown']);

  function dataRoot(){
    try{if(root&&typeof root.simurgGetData==='function')return root.simurgGetData();}catch(error){}
    try{if(typeof DATA!=='undefined')return DATA;}catch(error){}
    return root&&root.DATA||{};
  }
  function finite(value){
    if(value==null||value===''||value===false)return null;
    var number=Number(value);
    return Number.isFinite(number)&&number>=0?number:null;
  }
  function exerciseName(value){
    return typeof value==='string'?value:value&&value.exercise;
  }
  function profileFor(value){
    var key=profileKey(exerciseName(value)),data=dataRoot(),stored=data&&data.exerciseLoadProfiles&&data.exerciseLoadProfiles[key],storedPreset=stored&&String(stored.preset||'');
    if(PRESETS[storedPreset])return Object.assign({},PRESETS[storedPreset],{preset:storedPreset,profileSource:'user',profileKey:key,updatedAt:stored.updatedAt||null});
    var defaultPreset=DEFAULT_ALIASES[key];
    if(defaultPreset)return Object.assign({},PRESETS[defaultPreset],{preset:defaultPreset,profileSource:'default',profileKey:key,updatedAt:null});
    return Object.assign({},PRESETS.UNASSIGNED,{preset:'UNASSIGNED',profileSource:'unassigned',profileKey:key,updatedAt:null});
  }
  function row(value){
    value=value&&typeof value==='object'?value:{};
    var enteredWeight=finite(value.weight),reps=finite(value.reps),sets=finite(value.sets),profile=profileFor(value);
    if(enteredWeight==null)enteredWeight=0;
    if(reps==null)reps=0;
    if(sets==null||sets===0)sets=1;
    return {
      enteredWeight:enteredWeight,
      reps:reps,
      sets:sets,
      factor:profile.factor,
      volume:enteredWeight*reps*sets*profile.factor,
      preset:profile.preset,
      weightLabel:profile.weightLabel,
      profileSource:profile.profileSource
    };
  }
  function summary(rows){
    var normalized=(Array.isArray(rows)?rows:[]).map(row);
    return {
      sets:normalized.reduce(function(sum,item){return sum+item.sets;},0),
      reps:normalized.reduce(function(sum,item){return sum+item.reps*item.sets;},0),
      volume:normalized.reduce(function(sum,item){return sum+item.volume;},0),
      rows:normalized
    };
  }
  function exercise(rows){
    rows=Array.isArray(rows)?rows:[];
    var result=summary(rows),profile=profileFor(rows[0]||'');
    return Object.assign({},result,{preset:profile.preset,factor:profile.factor,weightLabel:profile.weightLabel,profileSource:profile.profileSource});
  }
  function ensureProfiles(){
    var data=dataRoot();
    if(!data||typeof data!=='object')return null;
    if(!data.exerciseLoadProfiles||typeof data.exerciseLoadProfiles!=='object'||Array.isArray(data.exerciseLoadProfiles))data.exerciseLoadProfiles={};
    return data.exerciseLoadProfiles;
  }
  function setProfile(exercise,preset){
    var key=profileKey(exercise),profiles=ensureProfiles();
    if(!key||!profiles||!PRESETS[preset])return false;
    profiles[key]={preset:preset,updatedAt:new Date().toISOString()};
    return true;
  }
  function clearProfile(exercise){
    var key=profileKey(exercise),profiles=ensureProfiles();
    if(!key||!profiles)return false;
    delete profiles[key];
    return true;
  }
  function moveProfile(fromExercise,toExercise){
    var fromKey=profileKey(fromExercise),toKey=profileKey(toExercise),profiles=ensureProfiles(),resolved=profileFor(fromExercise);
    if(!fromKey||!toKey||fromKey===toKey||!profiles||(resolved.preset==='UNASSIGNED'&&resolved.profileSource!=='user'))return false;
    profiles[toKey]={preset:resolved.preset,updatedAt:new Date().toISOString()};
    return true;
  }
  function presetOptions(){
    return ['DUAL_DUMBBELL','PER_SIDE_BOTH','UNILATERAL_BOTH','TOTAL_SYSTEM','STACK_TOTAL','SINGLE_SIDE'].map(function(key){return Object.assign({},PRESETS[key],{preset:key});});
  }

  return {profileFor:profileFor,row:row,summary:summary,exercise:exercise,profileKey:profileKey,setProfile:setProfile,clearProfile:clearProfile,moveProfile:moveProfile,presetOptions:presetOptions,presets:PRESETS};
});
