(function(root){
  'use strict';
  var STORAGE_KEY='atlas_summary_reports';

  function object(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function array(value){return Array.isArray(value)?value:[];}
  function number(value){
    var parsed=Number(String(value==null?'':value).replace(',','.'));
    return Number.isFinite(parsed)?parsed:0;
  }
  function clone(value){
    try{return JSON.parse(JSON.stringify(value));}catch(error){return {};}
  }
  function localDate(value){
    var date=value instanceof Date?value:new Date(value||Date.now());
    var offset=date.getTimezoneOffset()*60000;
    return new Date(date.getTime()-offset).toISOString().slice(0,10);
  }
  function parse(){
    try{return object(JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'{}'));}catch(error){return {};}
  }
  function latestByDate(rows,date){
    return array(rows).filter(function(row){return row&&row.date===date;}).slice(-1)[0]||null;
  }
  function workoutSummary(rows){
    var exercises=[],sets=0,reps=0,volume=0;
    array(rows).forEach(function(row){
      var name=String(row&&row.exercise||'Egzersiz');
      if(exercises.indexOf(name)<0)exercises.push(name);
      var rowSets=Math.max(1,number(row&&row.sets)||1);
      var rowReps=number(row&&row.reps);
      sets+=rowSets;
      reps+=rowReps*rowSets;
      volume+=number(row&&row.weight)*rowReps*rowSets;
    });
    return {exercises:exercises,sets:sets,reps:reps,volume:Math.round(volume)};
  }
  function coachFor(data,date){
    var store=object(data.coachIntelligence);
    var candidates=[
      object(store.daily)[date],
      object(store.results)[date],
      object(store.byDate)[date],
      object(data.coachInsights)[date]
    ];
    return object(candidates.find(function(item){return item&&typeof item==='object';}));
  }
  function polarFor(data,date){
    var sleep=object(object(data.polarSleep).daily)[date]||{};
    var nightly=object(object(data.polarNightlyRecharge).daily)[date]||{};
    var cardio=object(object(data.polarCardioLoad).daily)[date]||{};
    return {
      sleepScore:number(sleep.score||sleep.sleepScore)||null,
      sleepMinutes:number(sleep.sleepMinutes||sleep.totalSleep||sleep.duration)||null,
      nightlyStatus:String(nightly.status||nightly.charge||''),
      cardioLoad:number(cardio.cardioLoad||cardio.load||cardio.strain)||null
    };
  }
  function snapshot(date){
    var data=parse();
    var selected=date||localDate();
    var workoutRows=array(data.workouts).filter(function(row){return row&&row.date===selected;});
    var activity=latestByDate(data.appleWatch,selected);
    var daily=latestByDate(data.dailyNotes,selected);
    var coach=coachFor(data,selected);
    var polar=polarFor(data,selected);
    return {
      date:selected,
      workoutRows:clone(workoutRows),
      workout:workoutSummary(workoutRows),
      activity:clone(activity),
      daily:clone(daily),
      coach:clone(coach),
      polar:polar,
      programNames:clone(data.programNames),
      customGymPrograms:clone(data.customGymPrograms),
      counts:{
        workouts:array(data.workouts).length,
        activities:array(data.appleWatch).length,
        dailyNotes:array(data.dailyNotes).length
      }
    };
  }
  function dates(){
    var data=parse(),values=[];
    ['workouts','appleWatch','dailyNotes'].forEach(function(key){
      array(data[key]).forEach(function(row){if(row&&row.date)values.push(row.date);});
    });
    return Array.from(new Set(values)).sort().reverse();
  }

  root.PhoenixDataAdapter={
    mode:'read-only',
    storageKey:STORAGE_KEY,
    today:localDate,
    snapshot:snapshot,
    dates:dates,
    read:function(){return clone(parse());}
  };
})(window);
