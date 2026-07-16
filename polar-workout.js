(function(){
  'use strict';
  var currentTab='overview';
  var selectedDate=null;
  var selectedWorkoutKey=null;
  var tabs=['overview','heart','zones','load'];
  var zoneMeta={
    zone5:{label:'Zone 5',color:'#e4333c'},
    zone4:{label:'Zone 4',color:'#ed7a0b'},
    zone3:{label:'Zone 3',color:'#61b72b'},
    zone2:{label:'Zone 2',color:'#168ed5'},
    zone1:{label:'Zone 1',color:'#71879a'}
  };

  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function root(){
    if(typeof DATA!=='undefined') return DATA;
    if(window.DATA) return window.DATA;
    return null;
  }
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(value,fallback){var n=Number(value);return Number.isFinite(n)?n:(fallback==null?0:fallback);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function text(value,fallback){var result=String(value==null?'':value).trim();return result||fallback||'';}
  function workoutLabel(value){
    var raw=text(value,'Polar Workout');
    if(raw.toLowerCase()==='polar_flow_workout') return 'Polar Workout';
    return raw.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase().replace(/(^|\s)\S/g,function(letter){return letter.toUpperCase();});
  }
  function seconds(value){
    if(typeof value==='number' && Number.isFinite(value)) return Math.max(0,value);
    var parts=String(value||'').split(':').map(Number);
    if(parts.some(function(v){return !Number.isFinite(v);})) return 0;
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    if(parts.length===2) return parts[0]*60+parts[1];
    return parts.length===1?parts[0]:0;
  }
  function compactDuration(value){
    var source=text(value,'00:00');
    return source.indexOf('00:')===0?source.slice(3):source;
  }
  function durationSeconds(workout){
    var parsed=seconds(workout.duration);
    return parsed||Math.round(num(workout.durationMinutes,0)*60)||1;
  }
  function ensureStore(){
    var data=root();
    if(!data) return null;
    if(!data.polarWorkouts || Array.isArray(data.polarWorkouts)) data.polarWorkouts={daily:{},latest:null};
    if(!data.polarWorkouts.daily || Array.isArray(data.polarWorkouts.daily)) data.polarWorkouts.daily={};
    return data.polarWorkouts;
  }
  function todayDate(){var date=new Date();return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function shiftDate(value,amount){var date=new Date(value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
  function dayWorkouts(date){var store=ensureStore(),value=store&&store.daily&&store.daily[date];return (Array.isArray(value)?value:(value?[value]:[])).filter(Boolean).slice().sort(function(a,b){return String(a.startTime||'').localeCompare(String(b.startTime||''));});}
  function workoutDates(){var store=ensureStore();return Object.keys(store&&store.daily||{}).filter(function(date){return dayWorkouts(date).length;}).sort();}
  function workoutKey(workout){return String(workout&&workout.startTime||'');}
  function initializeSelection(){
    if(selectedDate)return;
    var dates=workoutDates(),today=todayDate();
    selectedDate=dayWorkouts(today).length?today:(dates.length?dates[dates.length-1]:today);
    selectedWorkoutKey=null;
  }
  function selectedWorkout(){
    initializeSelection();var list=dayWorkouts(selectedDate);if(!list.length)return null;
    var selected=list.find(function(item){return workoutKey(item)===selectedWorkoutKey;})||list[list.length-1];
    selectedWorkoutKey=workoutKey(selected);return selected;
  }
  function navigatorBounds(){var dates=workoutDates(),today=todayDate(),latest=dates.length?dates[dates.length-1]:today;return {min:dates.length?dates[0]:today,max:latest>today?latest:today,latest:latest};}
  function dateChipLabel(value){try{return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(e){return value;}}
  function dateNavigatorHtml(){
    initializeSelection();var bounds=navigatorBounds(),dates=[shiftDate(selectedDate,-1),selectedDate,shiftDate(selectedDate,1)].filter(function(date,index,list){return date>=bounds.min&&date<=bounds.max&&list.indexOf(date)===index;});
    return '<div class="pw-date-nav"><button type="button" onclick="polarWorkoutMoveDate(-1)" '+(selectedDate<=bounds.min?'disabled':'')+' aria-label="Previous day">‹</button><div class="pw-date-chips">'+dates.map(function(date){return '<button type="button" class="pw-date-chip '+(date===selectedDate?'active':'')+' '+(dayWorkouts(date).length?'has-workout':'')+'" onclick="polarWorkoutSelectDate(\''+date+'\')"><b>'+esc(dateChipLabel(date))+'</b><small>'+esc(date.slice(0,4))+'</small></button>';}).join('')+'</div><button type="button" onclick="polarWorkoutMoveDate(1)" '+(selectedDate>=bounds.max?'disabled':'')+' aria-label="Next day">›</button><button class="pw-date-latest" type="button" onclick="polarWorkoutGoLatest()">Latest</button></div>';
  }
  function workoutSelectorHtml(workouts,selected){if(workouts.length<2)return '';return '<div class="pw-workout-picker">'+workouts.map(function(workout){var active=workoutKey(workout)===workoutKey(selected);return '<button type="button" class="'+(active?'active':'')+'" onclick="polarWorkoutSelectSession(\''+esc(workoutKey(workout))+'\')"><b>'+esc(workoutLabel(workout.workoutType||workout.activityType))+'</b><span>'+esc(compactDuration(workout.startTime)||'Session')+'</span></button>';}).join('')+'</div>';}
  function normalizeImpact(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    return {
      loadLevel:text(raw.loadLevel,''),
      recoveryEffect:text(raw.recoveryEffect,''),
      nextSessionAggressiveness:text(raw.nextSessionAggressiveness,''),
      coachNote:text(raw.coachNote,'')
    };
  }
  function normalizeWorkout(input){
    var date=text(input.date,'');
    if(!date) throw new Error('polar_flow_workout date eksik');
    return {
      type:'polar_flow_workout',
      source:text(input.source,'Polar Flow'),
      device:text(input.device,'Polar device'),
      activityType:text(input.activityType,'Fitness'),
      date:date,
      day:text(input.day,''),
      workoutType:text(input.workoutType||input.activityName||input.name||input.activityType,'Polar Workout'),
      startTime:text(input.startTime||input.time,''),
      duration:text(input.duration,'—'),
      durationMinutes:num(input.durationMinutes,seconds(input.duration)/60),
      activeCal:input.activeCal==null&&input.activeCalories==null?null:num(input.activeCal!=null?input.activeCal:input.activeCalories,0),
      totalCal:input.totalCal==null&&input.totalCalories==null?null:num(input.totalCal!=null?input.totalCal:input.totalCalories,0),
      avgHR:input.avgHR==null?null:num(input.avgHR,0),
      minHR:input.minHR==null?null:num(input.minHR,0),
      maxHR:input.maxHR==null?null:num(input.maxHR,0),
      rpe:input.rpe==null?null:num(input.rpe,0),
      rpeLabel:text(input.rpeLabel,''),
      trainingLoad:input.trainingLoad==null?null:num(input.trainingLoad,0),
      trainingLoadType:text(input.trainingLoadType,'Kardiyo yükü TRIMP'),
      zones:Object.assign({zone1:'00:00:00',zone2:'00:00:00',zone3:'00:00:00',zone4:'00:00:00',zone5:'00:00:00'},input.zones||{}),
      zoneSummary:Object.assign({easyControlled:'00:00:00',moderate:'00:00:00',high:'00:00:00',unclassifiedTime:'00:00:00'},input.zoneSummary||{}),
      fuel:input.fuel&&typeof input.fuel==='object'?Object.assign({},input.fuel):null,
      trainingImpact:normalizeImpact(input.trainingImpact),
      heartRateSeries:Array.isArray(input.heartRateSeries)?input.heartRateSeries.slice():null,
      notes:text(input.notes,''),
      importedAt:new Date().toISOString()
    };
  }
  function importPolarWorkout(input){
    var store=ensureStore();
    if(!store) throw new Error('Polar Workout veri alanı hazırlanamadı');
    var workout=normalizeWorkout(input);
    var daily=store.daily[workout.date];
    if(!Array.isArray(daily)) daily=daily?[daily]:[];
    var index=daily.findIndex(function(item){return text(item.startTime,'')===text(workout.startTime,'');});
    if(index>=0) daily[index]=Object.assign({},daily[index],workout);
    else daily.push(workout);
    store.daily[workout.date]=daily;
    store.latest=workout;
    return workout;
  }
  function latest(){return selectedWorkout();}
  function loadStatus(workout){
    if(workout.trainingLoad==null) return 'Unavailable';
    var load=num(workout.trainingLoad,0);
    if(load<=39) return 'Controlled';
    if(load<=69) return 'Moderate';
    return 'High';
  }
  function impactLabel(value){return text(value,'Unavailable').split('_').filter(function(part){return part.toLowerCase()!=='to';}).map(function(part){return part?part.charAt(0).toUpperCase()+part.slice(1):'';}).join(' - ');}
  function dateLabel(workout){
    var day=text(workout.day,'');
    var date='';
    try{date=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(workout.date+'T12:00:00Z'));}catch(e){date=workout.date;}
    if(!day){try{day=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(new Date(workout.date+'T12:00:00Z'));}catch(e){day='';}}
    return [day,date].filter(Boolean).join(', ');
  }
  function pctFor(workout,key){return clamp(Math.round(seconds(workout.zones&&workout.zones[key])/durationSeconds(workout)*100),0,100);}
  function classifiedZoneSeconds(workout){return ['zone1','zone2','zone3','zone4','zone5'].reduce(function(total,key){return total+seconds(workout.zones&&workout.zones[key]);},0);}
  function hasZoneData(workout){return classifiedZoneSeconds(workout)>0;}
  function zoneRows(workout,detailed){
    return ['zone5','zone4','zone3','zone2','zone1'].map(function(key){
      var available=hasZoneData(workout),meta=zoneMeta[key],pct=available?pctFor(workout,key):0,duration=workout.zones&&workout.zones[key]||'';
      return '<div class="pw-zone-row"><span class="pw-zone-badge" style="background:'+meta.color+'">'+key.slice(-1)+'</span><span>'+meta.label+'</span><span class="pw-zone-track"><i style="width:'+pct+'%;background:'+meta.color+'"></i></span><span class="pw-zone-time">'+esc(available?compactDuration(duration):'—')+'</span><span class="pw-zone-pct">'+esc(available?pct+'%':'—')+'</span></div>';
    }).join('');
  }
  function zoneCard(workout,title,footnote,detailed){
    return '<div class="pw-card"><div class="pw-card-title"><h2>'+esc(title)+'</h2><span class="pw-info">i</span></div><div class="pw-zone-list">'+zoneRows(workout,detailed)+'</div>'+(footnote?'<div class="pw-footnote"><i>◉</i>'+esc(footnote)+'</div>':'')+'</div>';
  }
  function metric(label,value,unit){return '<div class="pw-metric"><small>'+esc(label)+'</small><b>'+esc(value)+'<em>'+esc(unit||'')+'</em></b></div>';}
  function formattedNumber(value){var number=Number(value);if(!Number.isFinite(number))return '—';var rounded=Math.round(number*10)/10;return String(Number.isInteger(rounded)?Math.round(rounded):rounded);}
  function heroCard(workout){
    var metrics=[];
    if(workout.duration)metrics.push(metric('Duration',workout.duration,''));
    if(workout.activeCal!=null)metrics.push(metric('Calories',formattedNumber(workout.activeCal),'kcal'));
    if(workout.avgHR!=null)metrics.push(metric('Avg HR',formattedNumber(workout.avgHR),'bpm'));
    if(workout.maxHR!=null)metrics.push(metric('Max HR',formattedNumber(workout.maxHR),'bpm'));
    if(workout.minHR!=null)metrics.push(metric('Min HR',formattedNumber(workout.minHR),'bpm'));
    if(workout.rpe!=null)metrics.push(metric('RPE',formattedNumber(workout.rpe)+'/10',''));
    metrics.push(metric('Source','Polar Flow',''));
    var hasLoad=workout.trainingLoad!=null,ringHtml='';
    if(hasLoad){var ring=clamp(num(workout.trainingLoad,0)*2,8,86);ringHtml='<div class="pw-load-ring" style="--pw-ring:'+ring+'%"><div class="pw-load-inner"><small>LOAD</small><b>'+esc(formattedNumber(workout.trainingLoad))+'</b><span>'+esc(loadStatus(workout))+'</span></div></div>';}
    return '<div class="pw-card pw-hero '+(hasLoad?'':'no-load')+'"><div class="pw-hero-grid">'+ringHtml+'<div class="pw-metrics">'+metrics.join('')+'</div></div>'+(hasLoad?'<div class="pw-interpret"><i>⌁</i><span>'+esc(overviewInterpretation(workout))+'</span></div>':'')+'</div>';
  }
  function overviewInterpretation(workout){
    var low=pctFor(workout,'zone1')+pctFor(workout,'zone2');
    if(workout.trainingLoad==null) return hasZoneData(workout)?'Nabız zone detayları Polar’dan geldi; antrenman yükü değeri mevcut değil.':'Antrenman yükü ve sınıflandırılmış nabız zone detayı mevcut değil.';
    if(loadStatus(workout)==='Controlled' && low>=50) return 'Seans kontrollü ilerlemiş. Düşük-orta yoğunluk dağılımı toparlanma maliyetini yönetilebilir tutuyor.';
    if(loadStatus(workout)==='High') return 'Antrenman yükü yüksek. Sonraki seansa kontrollü başla ve toparlanma sinyallerini izle.';
    return 'Mevcut yük yönetilebilir görünüyor. Sonraki çalışma setlerine kontrollü başla.';
  }
  function fuelCard(workout){
    var fuel=workout.fuel,available=fuel&&[fuel.carbohydrate,fuel.protein,fuel.fat].some(function(value){return value!=null&&value!=='';});
    if(!available) return '';
    var carbRaw=fuel.carbohydrate,proteinRaw=fuel.protein,fatRaw=fuel.fat;
    var carb=clamp(num(carbRaw,0),0,100),protein=clamp(num(proteinRaw,0),0,100),fat=clamp(num(fatRaw,0),0,100);
    var total=carb+protein+fat||1;
    return '<div class="pw-card"><div class="pw-card-title"><h2>Fuel Mix</h2><span class="pw-info">i</span></div><div class="pw-fuel-bar"><span style="width:'+(carb/total*100)+'%"></span><span style="width:'+(protein/total*100)+'%"></span><span style="width:'+(fat/total*100)+'%"></span></div><div class="pw-fuel-stats"><div class="pw-fuel-stat carb"><b>'+(carbRaw==null?'—':carb+'%')+'</b><small>Carbohydrate</small></div><div class="pw-fuel-stat protein"><b>'+(proteinRaw==null?'—':protein+'%')+'</b><small>Protein</small></div><div class="pw-fuel-stat fat"><b>'+(fatRaw==null?'—':fat+'%')+'</b><small>Fat</small></div></div></div>';
  }
  function trainingImpactCard(workout){
    var impact=workout.trainingImpact||{},available=[impact.loadLevel,impact.recoveryEffect,impact.nextSessionAggressiveness].some(function(value){return text(value,'')!=='';});
    if(!available)return '';
    var next=impactLabel(workout.trainingImpact&&workout.trainingImpact.nextSessionAggressiveness);
    return '<div class="pw-card"><div class="pw-card-title"><h2>Training Impact</h2></div><div class="pw-impact-grid"><div class="pw-impact-item"><small>Training Load</small><b>'+esc(workout.trainingLoad==null?'—':formattedNumber(workout.trainingLoad))+'</b><span>'+esc(loadStatus(workout))+'</span></div><div class="pw-impact-item"><small>RPE</small><b>'+esc(workout.rpe==null?'—':formattedNumber(workout.rpe)+'/10')+'</b><span>'+esc(workout.rpeLabel||'—')+'</span></div><div class="pw-impact-item"><small>Next Session</small><b class="pw-impact-value">'+esc(next)+'</b><span>Suggested Focus</span></div></div><div class="pw-coach-inline"><b>▣</b> Sonraki seansa kontrollü başla ve mevcut planı toparlanma sinyallerine göre uygula.</div></div>';
  }
  function seriesValues(workout){
    if(!Array.isArray(workout.heartRateSeries)) return [];
    return workout.heartRateSeries.map(function(item){
      if(typeof item==='number') return item;
      if(!item||typeof item!=='object') return NaN;
      return Number(item.value!=null?item.value:(item.bpm!=null?item.bpm:(item.heartRate!=null?item.heartRate:item.hr)));
    }).filter(function(value){return Number.isFinite(value);});
  }
  function chartContent(workout){
    var values=seriesValues(workout);
    if(!values.length) return '<div class="pw-chart-empty">Heart rate trend data is not available from this import.</div>';
    var min=Math.min.apply(null,values),max=Math.max.apply(null,values);
    if(max===min){max=min+1;}
    var left=30,right=312,top=16,bottom=119;
    var points=values.map(function(value,index){
      var x=values.length===1?(left+right)/2:left+(index/(values.length-1))*(right-left);
      var y=bottom-((value-min)/(max-min))*(bottom-top);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    var mid=Math.round((max+min)/2);
    return '<div class="pw-chart-box"><svg viewBox="0 0 320 138" role="img" aria-label="Imported heart rate trend"><line class="pw-chart-grid" x1="30" y1="16" x2="312" y2="16"></line><line class="pw-chart-grid" x1="30" y1="67" x2="312" y2="67"></line><line class="pw-chart-grid" x1="30" y1="119" x2="312" y2="119"></line><text class="pw-chart-label" x="4" y="20">'+Math.round(max)+'</text><text class="pw-chart-label" x="4" y="71">'+mid+'</text><text class="pw-chart-label" x="4" y="123">'+Math.round(min)+'</text><polyline class="pw-chart-line" points="'+points+'"></polyline></svg></div>';
  }
  function chartCard(workout,title){var values=seriesValues(workout);if(!values.length)return '<div class="pw-card pw-compact-note"><div class="pw-card-title"><h2>'+esc(title)+'</h2></div><p>Bu importta detaylı nabız grafiği yok. Polar yalnızca ortalama/maksimum nabız ve zone özetini gönderdi.</p></div>';return '<div class="pw-card"><div class="pw-card-title"><h2>'+esc(title)+'</h2></div>'+chartContent(workout)+'</div>';}
  function heartSummary(workout){
    var stats=[];if(workout.avgHR!=null)stats.push('<div class="pw-hr-stat"><b class="red">♡ &nbsp;'+esc(formattedNumber(workout.avgHR))+'</b><small>Avg HR</small></div>');if(workout.minHR!=null)stats.push('<div class="pw-hr-stat"><b class="mint">♡ &nbsp;'+esc(formattedNumber(workout.minHR))+'</b><small>Min HR</small></div>');if(workout.maxHR!=null)stats.push('<div class="pw-hr-stat"><b class="gray">⊖ &nbsp;'+esc(formattedNumber(workout.maxHR))+'</b><small>Max HR</small></div>');
    return '<div class="pw-card"><div class="pw-card-title"><h2>Heart Rate Summary</h2></div><div class="pw-hr-summary" style="--pw-hr-cols:'+Math.max(stats.length,1)+'">'+(stats.length?stats.join(''):'<div class="pw-unavailable">Nabız özeti mevcut değil.</div>')+'</div></div>';
  }
  function heartInterpretation(workout){
    if(!hasZoneData(workout)) return '<div class="pw-card"><div class="pw-card-title"><h2>♡ &nbsp;Heart Interpretation</h2></div><p class="pw-copy">Zone detayı olmadığı için yoğunluk yorumu yapılamıyor.</p></div>';
    var zone1=pctFor(workout,'zone1'),moderateHigh=seconds(workout.zones.zone3)+seconds(workout.zones.zone4)+seconds(workout.zones.zone5),sentence;
    if(zone1>=50)sentence='Bu antrenman düşük yoğunlukta ve toparlanma dostu ilerlemiş.';
    else if(moderateHigh>0)sentence='Bu antrenmanda orta-yüksek yoğunluk bloğu var.';
    else sentence='Bu antrenman düşük-orta yoğunlukta kontrollü ilerlemiş.';
    return '<div class="pw-card"><div class="pw-card-title"><h2>♡ &nbsp;Heart Interpretation</h2></div><p class="pw-copy">'+esc(sentence)+'</p><p class="pw-copy">Aerobik temel ve kontrollü kondisyon için uygun bir dağılım.</p><p class="pw-copy">Ritmi bozmadan devam et.</p></div>';
  }
  function summaryRows(workout){
    var items=[
      ['Easy / Controlled (Zone 1–2)',workout.zoneSummary.easyControlled,'#168ed5',pctFor(workout,'zone1')+pctFor(workout,'zone2')],
      ['Moderate (Zone 3)',workout.zoneSummary.moderate,'#7fbd32',pctFor(workout,'zone3')],
      ['High (Zone 4–5)',workout.zoneSummary.high,'#e43b42',pctFor(workout,'zone4')+pctFor(workout,'zone5')],
      ['Unclassified Time',workout.zoneSummary.unclassifiedTime,'#63798d',clamp(Math.round(seconds(workout.zoneSummary.unclassifiedTime)/durationSeconds(workout)*100),0,100)]
    ];
    return items.map(function(item){return '<div class="pw-summary-row"><span class="pw-summary-name"><i style="background:'+item[2]+'"></i>'+esc(item[0])+'</span><span class="pw-summary-time">'+esc(item[1]||'00:00:00')+'</span><span class="pw-summary-pct">'+item[3]+'%</span></div>';}).join('');
  }
  function zoneSummaryCard(workout){return '<div class="pw-card"><div class="pw-card-title"><h2>Zone Summary</h2></div><div class="pw-summary-list">'+summaryRows(workout)+'</div></div>';}
  function zoneInterpretation(workout){
    if(!hasZoneData(workout))return '<div class="pw-card"><div class="pw-card-title"><h2>◉ &nbsp;Zone Interpretation</h2></div><p class="pw-copy">Sınıflandırılmış nabız zone detayı mevcut değil. Varsa sınıflandırılmamış süre yukarıda ayrı gösterilir.</p></div>';
    var zone1=pctFor(workout,'zone1'),moderateHigh=seconds(workout.zones.zone3)+seconds(workout.zones.zone4)+seconds(workout.zones.zone5),copy=zone1>=50?'Seansın büyük bölümü Zone 1’de ve düşük yoğunlukta ilerlemiş.':moderateHigh>0?'Zone 3–5 içinde anlamlı bir orta-yüksek yoğunluk bölümü var.':'Zone dağılımı düşük-orta yoğunlukta kontrollü görünüyor.';
    return '<div class="pw-card"><div class="pw-card-title"><h2>◉ &nbsp;Zone Interpretation</h2></div><p class="pw-copy">'+esc(copy)+'</p><p class="pw-copy">Yüzdeler Polar’dan geldiği haliyle korunur; sınıflandırılmamış süre yeniden dağıtılmaz.</p></div>';
  }
  function loadProCard(workout){
    if(workout.trainingLoad==null)return '<div class="pw-card pw-compact-note"><div class="pw-card-title"><h2>Antrenman yükü mevcut değil</h2></div><p>Polar bu antrenman için training load değeri göndermedi.</p></div>';
    return '<div class="pw-card"><div class="pw-card-title"><h2>Training Load Pro</h2></div><div class="pw-load-pro"><div class="pw-load-number"><b>'+esc(formattedNumber(workout.trainingLoad))+'</b><span>'+esc(loadStatus(workout))+'</span></div><div class="pw-load-copy"><small>'+esc(workout.trainingLoadType||'Kardiyo yükü TRIMP')+'</small><p>Mevcut yükü toparlanma sinyalleriyle birlikte değerlendir ve sonraki seansa kontrollü başla.</p></div></div></div>';
  }
  function hasImpactData(workout){var impact=workout.trainingImpact||{};return [impact.loadLevel,impact.recoveryEffect,impact.nextSessionAggressiveness].some(function(value){return text(value,'')!=='';});}
  function loadImpactCard(workout){
    if(!hasImpactData(workout))return '';
    var impact=workout.trainingImpact||{};
    return '<div class="pw-card"><div class="pw-card-title"><h2>Load Impact</h2></div><div class="pw-impact-list"><div class="pw-impact-line"><i></i><span>Load Level</span><b>'+esc(impactLabel(impact.loadLevel))+'</b></div><div class="pw-impact-line"><i></i><span>Recovery Effect</span><b>'+esc(impactLabel(impact.recoveryEffect))+'</b></div><div class="pw-impact-line"><i></i><span>Next Session Aggressiveness</span><b>'+esc(impactLabel(impact.nextSessionAggressiveness))+'</b></div></div></div>';
  }
  function rpeCard(workout){
    var rpe=workout.rpe==null?null:clamp(num(workout.rpe,0),0,10);
    return '<div class="pw-card"><div class="pw-card-title"><h2>RPE</h2></div><div class="pw-rpe-head"><b>'+esc(rpe==null?'—':rpe)+'<span> / 10</span></b><em>'+esc(workout.rpeLabel||'—')+'</em></div><div class="pw-rpe-scale">'+(rpe==null?'':'<i class="pw-rpe-marker" style="left:'+rpe*10+'%"></i>')+'</div></div>';
  }
  function coachNoteCard(workout){var note=text(workout.trainingImpact&&workout.trainingImpact.coachNote,'');if(!note)return '';return '<div class="pw-card"><div class="pw-card-title"><h2>Coach Note</h2></div><p class="pw-copy">'+esc(note)+'</p></div>';}
  function overview(workout){return heroCard(workout)+zoneCard(workout,'Heart Rate Zones',hasZoneData(workout)?'Zone detayları Polar’dan geldiği haliyle gösteriliyor.':'Sınıflandırılmış zone detayı mevcut değil.',false)+fuelCard(workout)+trainingImpactCard(workout)+chartCard(workout,'Heart Rate Trend');}
  function heart(workout){return heartSummary(workout)+chartCard(workout,'Heart Rate (bpm)')+zoneCard(workout,'Heart Rate Zones','',true)+heartInterpretation(workout);}
  function zones(workout){return zoneCard(workout,'Heart Rate Zones','',true)+zoneSummaryCard(workout)+zoneInterpretation(workout);}
  function load(workout){return loadProCard(workout)+loadImpactCard(workout)+(workout.rpe==null?'':rpeCard(workout))+coachNoteCard(workout);}
  function emptyState(global){return '<div class="pw-empty compact"><div class="pw-empty-mark">⌁</div><h2>'+(global?'Henüz Polar workout yok.':'Bu tarihte Polar workout yok.')+'</h2><p>'+(global?'Polar Flow senkronizasyonunu çalıştır.':'Polar Flow’u senkronize et veya başka bir tarih seç.')+'</p></div>';}
  function sectionHtml(){
    return '<div class="pw-shell"><header class="pw-header"><div class="pw-head-row"><button class="pw-head-icon" type="button" onclick="simurgV8Go(\'polar\',\'polar\')" aria-label="Back to Polar">‹</button><div class="pw-head-copy"><span class="pw-brand">SIMURG OS</span><h1>Polar Workout</h1><div id="pwSubtitle" class="pw-subtitle">Polar Flow workout detail</div><div id="pwSource" class="pw-source"><i></i>Polar Flow</div></div><button class="pw-head-icon" type="button" onclick="polarWorkoutExport()" aria-label="Export Polar workout">⇧</button></div></header><div id="pwDateNavigator"></div><div class="pw-tabs" role="tablist">'+tabs.map(function(tab){return '<button id="pwTab-'+tab+'" class="pw-tab '+(tab===currentTab?'active':'')+'" type="button" role="tab" onclick="polarWorkoutSetTab(\''+tab+'\')">'+tab.toUpperCase()+'</button>';}).join('')+'</div><div id="pwWorkoutSelector"></div><div id="pwContent" class="pw-content"></div></div>';
  }
  function ensureSection(){
    var section=document.getElementById('polar-workout');
    if(!section){
      var main=document.querySelector('main');
      if(!main) return null;
      section=document.createElement('section');section.id='polar-workout';section.className='section simurgPolarWorkout';section.innerHTML=sectionHtml();main.appendChild(section);
    }
    return section;
  }
  function render(){
    var section=ensureSection();if(!section) return;
    initializeSelection();var workout=latest(),content=document.getElementById('pwContent'),dateNavigator=document.getElementById('pwDateNavigator'),selector=document.getElementById('pwWorkoutSelector'),dayList=dayWorkouts(selectedDate);
    tabs.forEach(function(tab){var button=document.getElementById('pwTab-'+tab);if(button) button.classList.toggle('active',tab===currentTab);});
    if(!content) return;
    var subtitle=document.getElementById('pwSubtitle'),source=document.getElementById('pwSource');
    if(dateNavigator){var navHtml=dateNavigatorHtml();if(dateNavigator.innerHTML!==navHtml)dateNavigator.innerHTML=navHtml;}
    if(selector){var selectorHtml=workoutSelectorHtml(dayList,workout);if(selector.innerHTML!==selectorHtml)selector.innerHTML=selectorHtml;}
    if(!workout){
      if(subtitle)subtitle.textContent=dateChipLabel(selectedDate)+' · Workout yok';
      if(source)source.style.display='none';
      var empty=emptyState(!workoutDates().length);if(content.innerHTML!==empty)content.innerHTML=empty;return;
    }
    if(source)source.style.display='flex';
    if(subtitle){var subtitleText=[workoutLabel(workout.workoutType||workout.activityType),dateLabel(workout),workout.startTime].filter(Boolean).join(' · ');if(subtitle.textContent!==subtitleText)subtitle.textContent=subtitleText;}
    if(source){var sourceHtml='<i></i><span>'+esc(workout.source||'Polar Flow')+' · '+esc(workout.device||'Polar device')+'</span>';if(source.innerHTML!==sourceHtml)source.innerHTML=sourceHtml;}
    var renderers={overview:overview,heart:heart,zones:zones,load:load};
    var next=renderers[currentTab](workout);if(content.innerHTML!==next)content.innerHTML=next;
  }
  function ensureNavigation(){
    var desktop=document.querySelector('aside .nav');
    if(desktop&&!desktop.querySelector('[data-polar-workout-nav]')){
      var desktopButton=document.createElement('button');desktopButton.dataset.polarWorkoutNav='1';desktopButton.innerHTML='⌁ Polar Workout';desktopButton.onclick=function(){window.simurgOpenPolarWorkout(desktopButton);};desktop.appendChild(desktopButton);
    }
  }
  function markPolarWorkoutActive(){
    var section=document.getElementById('polar-workout');
    var screen=document.body.getAttribute('data-simurg-active-screen');
    if(!section||(!section.classList.contains('active')&&screen!=='polarWorkout'&&screen!=='polar-workout')) return;
    document.querySelectorAll('#simurgV8Nav button[data-key]').forEach(function(item){
      var active=item.dataset.key==='polarWorkout';item.classList.toggle('active',active);item.setAttribute('aria-pressed',active?'true':'false');
    });
    document.body.setAttribute('data-simurg-active-screen','polar-workout');
    document.documentElement.setAttribute('data-simurg-active-key','polarWorkout');
  }
  function activatePolarWorkout(){
    var section=ensureSection();if(!section) return;
    document.querySelectorAll('main > .section').forEach(function(item){item.classList.remove('active');});
    section.classList.add('active');
    document.getElementById('simurgV8Shade')?.classList.remove('open');
    document.getElementById('simurgV8Sheet')?.classList.remove('open');
    document.querySelectorAll('#simurgV8Nav button[data-key]').forEach(function(item){item.classList.toggle('active',item.dataset.key==='polarWorkout');});
    document.body.setAttribute('data-simurg-active-screen','polar-workout');
    document.documentElement.setAttribute('data-simurg-active-key','polarWorkout');
    window.__simurgCurrentMobileKey='polarWorkout';
    window.__simurgStableNavKey='polarWorkout';
    render();
    markPolarWorkoutActive();
    requestAnimationFrame(markPolarWorkoutActive);
    section.scrollTop=0;
  }
  function wrapGo(){
    var old=window.simurgV8Go;
    if(typeof old!=='function'||old.__polarWorkout) return;
    window.simurgV8Go=function(id,key){
      if(id==='polar-workout'){
        activatePolarWorkout();
        return;
      }
      ensureSection();
      var result=old.apply(this,arguments);
      setTimeout(ensureNavigation,0);
      return result;
    };
    window.simurgV8Go.__polarWorkout=true;
  }
  function wrapUniversalImport(){
    var old=window.universalImport;
    if(typeof old!=='function'||old.__polarWorkout) return;
    window.universalImport=function(){
      var box=document.getElementById('universalJsonBox');
      var raw=box&&box.value?box.value.trim():'';
      if(raw){
        try{
          var parsed=JSON.parse(raw);
          var kind=String(parsed&&parsed.type||'').trim().toLowerCase();
          var source=String(parsed&&parsed.source||'').trim().toLowerCase();
          if(!Array.isArray(parsed)&&(kind==='polar_flow_workout'||source==='polar flow')){
            var workout=importPolarWorkout(parsed);
            if(box) box.value='';
            if(typeof window.save==='function') window.save();
            else localStorage.setItem('atlas_summary_reports',JSON.stringify(root()));
            render();
            alert('Polar Workout içe aktarıldı: '+workout.date+' '+(workout.startTime||''));
            return workout;
          }
        }catch(error){
          if(String(raw).indexOf('polar_flow_workout')>-1||String(raw).indexOf('Polar Flow')>-1){alert('Polar Workout Import başarısız: '+error.message);return;}
        }
      }
      return old.apply(this,arguments);
    };
    window.universalImport.__polarWorkout=true;
  }

  window.importPolarWorkout=importPolarWorkout;
  window.renderPolarWorkout=render;
  window.polarWorkoutSelectDate=function(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return;selectedDate=date;selectedWorkoutKey=null;currentTab='overview';render();var section=document.getElementById('polar-workout');if(section)section.scrollTop=0;};
  window.polarWorkoutMoveDate=function(direction){initializeSelection();var bounds=navigatorBounds(),next=shiftDate(selectedDate,direction<0?-1:1);if(next<bounds.min||next>bounds.max)return;window.polarWorkoutSelectDate(next);};
  window.polarWorkoutGoLatest=function(){var bounds=navigatorBounds(),target=dayWorkouts(todayDate()).length?todayDate():bounds.latest;window.polarWorkoutSelectDate(target);};
  window.polarWorkoutSelectSession=function(key){selectedWorkoutKey=String(key||'');currentTab='overview';render();};
  window.polarWorkoutSetTab=function(tab){if(tabs.indexOf(tab)<0||tab===currentTab)return;currentTab=tab;render();markPolarWorkoutActive();var section=document.getElementById('polar-workout');if(section)section.scrollTop=0;};
  window.simurgOpenPolarWorkout=function(button){
    activatePolarWorkout();
    if(button){document.querySelectorAll('aside .nav button').forEach(function(item){item.classList.toggle('active',item===button);});}
  };
  window.simurgOpenPolarWorkoutFor=function(date,startTime){selectedDate=String(date||todayDate());selectedWorkoutKey=String(startTime||'');currentTab='overview';activatePolarWorkout();};
  window.polarWorkoutExport=function(){
    var workout=latest();if(!workout){return;}
    var blob=new Blob([JSON.stringify(workout,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='polar-workout-'+workout.date+'-'+(workout.startTime||'workout').replace(':','')+'.json';a.click();URL.revokeObjectURL(url);
  };

  ready(function(){
    ensureStore();ensureSection();ensureNavigation();wrapGo();wrapUniversalImport();render();
    var importCopy=document.querySelector('.universalImportCard .sub');if(importCopy) importCopy.textContent='Tek veri giriş noktası: Polar Flow workout, Apple Watch, workout, daily ve weekly JSON verilerini otomatik tanır.';
    var observer=new MutationObserver(ensureNavigation);
    observer.observe(document.body,{childList:true});
    setTimeout(function(){ensureNavigation();wrapGo();wrapUniversalImport();},500);
  });
})();
