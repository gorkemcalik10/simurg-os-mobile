(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgJournal=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var BEHAVIORS=[
    {key:'goodHydration',label:'İyi hidrasyon',icon:'💧'},
    {key:'lateCaffeine',label:'Geç kafein',icon:'☕'},
    {key:'lateMeal',label:'Geç yemek',icon:'◷'},
    {key:'highStress',label:'Yüksek stres',icon:'⌁'},
    {key:'lateBedtime',label:'Geç yatış',icon:'☾'},
    {key:'extraActivity',label:'Ekstra spor / yüksek aktivite',icon:'⚡'},
    {key:'mobilityRecovery',label:'Mobilite / recovery',icon:'◎'},
    {key:'alcohol',label:'Alkol',icon:'◇'}
  ];
  var BEHAVIOR_KEYS=BEHAVIORS.map(function(item){return item.key;});
  var INSIGHT_RULES={minimumQualifiedDays:24,minimumPresent:6,minimumAbsent:6,minimumHalfGroup:3,minimumDifferenceMinutes:30,minimumRelativeDifference:.05};

  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;
    var parsed=new Date(value+'T00:00:00Z');
    return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
  }
  function addDays(value,amount){var date=new Date(value+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
  function emptyBehaviors(){var result={};BEHAVIOR_KEYS.forEach(function(key){result[key]=null;});return result;}
  function normalizeBehaviors(value){
    var result=emptyBehaviors();value=value&&typeof value==='object'?value:{};
    BEHAVIOR_KEYS.forEach(function(key){if(value[key]===true||value[key]===false||value[key]===null)result[key]=value[key];});
    return result;
  }
  function normalizeNote(value){return String(value==null?'':value).slice(0,500);}
  function normalizeEntry(date,value,updatedAt){
    if(!validDate(date))throw new Error('Journal date must use YYYY-MM-DD.');
    value=value&&typeof value==='object'?value:{};
    var timestamp=updatedAt==null?value.updatedAt:updatedAt;
    if(timestamp==null)timestamp=new Date().toISOString();
    if(typeof timestamp!=='string'||Number.isNaN(new Date(timestamp).getTime()))throw new Error('Journal updatedAt must be a valid date-time string.');
    return {date:date,behaviors:normalizeBehaviors(value.behaviors),note:normalizeNote(value.note),updatedAt:timestamp};
  }
  function ensureStore(data){
    if(!data||typeof data!=='object')throw new Error('Journal requires a DATA object.');
    if(!data.journal||typeof data.journal!=='object'||Array.isArray(data.journal))data.journal={schemaVersion:1,daily:{}};
    if(!data.journal.daily||typeof data.journal.daily!=='object'||Array.isArray(data.journal.daily))data.journal.daily={};
    if(!Number.isInteger(data.journal.schemaVersion))data.journal.schemaVersion=1;
    return data.journal;
  }
  function entryFor(data,date){
    var value=data&&data.journal&&data.journal.daily&&data.journal.daily[date];
    return value?normalizeEntry(date,value,value.updatedAt):{date:date,behaviors:emptyBehaviors(),note:'',updatedAt:null};
  }
  function upsert(data,date,value,updatedAt){
    var store=ensureStore(data),entry=normalizeEntry(date,value,updatedAt);
    store.daily[date]=entry;
    return entry;
  }
  function number(value){var next=Number(value);return value==null||value===''||!Number.isFinite(next)||next<0?null:next;}
  function durationMinutes(value){
    var direct=number(value);if(direct!=null)return direct>10000?direct/60:direct;
    var parts=String(value||'').split(':').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite))return parts[0]*60+parts[1]+parts[2]/60;
    if(parts.length===2&&parts.every(Number.isFinite))return parts[0]*60+parts[1];
    return null;
  }
  function lastDaily(store,date){var value=store&&store.daily&&store.daily[date];return Array.isArray(value)?value[value.length-1]:value;}
  function sleepOutcome(data,date){
    var row=lastDaily(data&&data.polarSleep,date)||{},minutes=number(row.durationMinutes);
    if(minutes==null&&number(row.durationSeconds)!=null)minutes=number(row.durationSeconds)/60;
    if(minutes==null)minutes=durationMinutes(row.duration);
    return minutes==null?null:{date:date,sleepMinutes:minutes};
  }
  function average(values){return values.reduce(function(sum,value){return sum+value;},0)/values.length;}
  function comparison(rows,key){
    var present=rows.filter(function(row){return row.value===true;}),absent=rows.filter(function(row){return row.value===false;});
    if(present.length<INSIGHT_RULES.minimumPresent||absent.length<INSIGHT_RULES.minimumAbsent)return null;
    function difference(source){
      var yes=source.filter(function(row){return row.value===true;}).map(function(row){return row.sleepMinutes;});
      var no=source.filter(function(row){return row.value===false;}).map(function(row){return row.sleepMinutes;});
      if(!yes.length||!no.length)return null;
      return average(yes)-average(no);
    }
    var fullDifference=difference(rows),midpoint=Math.floor(rows.length/2),first=rows.slice(0,midpoint),second=rows.slice(midpoint);
    if(first.filter(function(row){return row.value===true;}).length<INSIGHT_RULES.minimumHalfGroup||first.filter(function(row){return row.value===false;}).length<INSIGHT_RULES.minimumHalfGroup||second.filter(function(row){return row.value===true;}).length<INSIGHT_RULES.minimumHalfGroup||second.filter(function(row){return row.value===false;}).length<INSIGHT_RULES.minimumHalfGroup)return null;
    var firstDifference=difference(first),secondDifference=difference(second),baseline=average(absent.map(function(row){return row.sleepMinutes;}));
    if(firstDifference===0||secondDifference===0||Math.sign(firstDifference)!==Math.sign(secondDifference))return null;
    if(Math.abs(fullDifference)<INSIGHT_RULES.minimumDifferenceMinutes||Math.abs(fullDifference)/Math.max(1,baseline)<INSIGHT_RULES.minimumRelativeDifference)return null;
    var behavior=BEHAVIORS.filter(function(item){return item.key===key;})[0];
    return {behavior:key,direction:fullDifference>0?'higher':'lower',differenceMinutes:Math.round(fullDifference),presentCount:present.length,absentCount:absent.length,outcome:'next_day_sleep_minutes',dateRule:'journal_date_plus_one_calendar_day',message:behavior.label+' kaydettiğin günlerin ardından uyku süren '+(fullDifference>0?'daha uzun':'daha kısa')+' görünme eğiliminde.'};
  }
  function insights(data,asOfDate,options){
    options=options||{};
    if(!validDate(asOfDate))throw new Error('Insight cutoff date must use YYYY-MM-DD.');
    var resolver=typeof options.outcomeResolver==='function'?options.outcomeResolver:sleepOutcome,daily=data&&data.journal&&data.journal.daily||{};
    var paired=Object.keys(daily).filter(validDate).sort().map(function(date){
      var outcomeDate=addDays(date,1);
      if(outcomeDate>asOfDate)return null;
      var outcome=resolver(data,outcomeDate),entry=daily[date];
      if(!outcome||number(outcome.sleepMinutes)==null||!entry||!entry.behaviors)return null;
      var hasAnswer=BEHAVIOR_KEYS.some(function(key){return entry.behaviors[key]===true||entry.behaviors[key]===false;});
      return hasAnswer?{date:date,outcomeDate:outcomeDate,entry:entry,sleepMinutes:number(outcome.sleepMinutes)}:null;
    }).filter(Boolean);
    if(paired.length<INSIGHT_RULES.minimumQualifiedDays)return {status:'insufficient',qualifiedDays:paired.length,minimumQualifiedDays:INSIGHT_RULES.minimumQualifiedDays,insights:[],dateRule:'journal_date_plus_one_calendar_day'};
    var results=[];
    BEHAVIOR_KEYS.forEach(function(key){
      var rows=paired.filter(function(row){return row.entry.behaviors[key]===true||row.entry.behaviors[key]===false;}).map(function(row){return {date:row.date,value:row.entry.behaviors[key],sleepMinutes:row.sleepMinutes};});
      var result=comparison(rows,key);if(result)results.push(result);
    });
    results.sort(function(a,b){return Math.abs(b.differenceMinutes)-Math.abs(a.differenceMinutes)||a.behavior.localeCompare(b.behavior);});
    return {status:results.length?'qualified':'insufficient',qualifiedDays:paired.length,minimumQualifiedDays:INSIGHT_RULES.minimumQualifiedDays,insights:results.slice(0,2),dateRule:'journal_date_plus_one_calendar_day'};
  }

  return {BEHAVIORS:BEHAVIORS,BEHAVIOR_KEYS:BEHAVIOR_KEYS,INSIGHT_RULES:INSIGHT_RULES,emptyBehaviors:emptyBehaviors,normalizeEntry:normalizeEntry,ensureStore:ensureStore,entryFor:entryFor,upsert:upsert,sleepOutcome:sleepOutcome,insights:insights,addDays:addDays};
});
