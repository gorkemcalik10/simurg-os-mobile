(function(){
  'use strict';
  var currentTab='overview';
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
  function normalizeImpact(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    return {
      loadLevel:text(raw.loadLevel,'controlled_moderate'),
      recoveryEffect:text(raw.recoveryEffect,'low_to_moderate'),
      nextSessionAggressiveness:text(raw.nextSessionAggressiveness,'normal_controlled'),
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
      activeCal:num(input.activeCal!=null?input.activeCal:input.activeCalories,0),
      totalCal:num(input.totalCal!=null?input.totalCal:input.totalCalories,input.activeCal||0),
      avgHR:input.avgHR==null?null:num(input.avgHR,0),
      minHR:input.minHR==null?null:num(input.minHR,0),
      maxHR:input.maxHR==null?null:num(input.maxHR,0),
      rpe:input.rpe==null?null:num(input.rpe,0),
      rpeLabel:text(input.rpeLabel,''),
      trainingLoad:input.trainingLoad==null?null:num(input.trainingLoad,0),
      trainingLoadType:text(input.trainingLoadType,'Kardiyo yükü TRIMP'),
      zones:Object.assign({zone1:'00:00:00',zone2:'00:00:00',zone3:'00:00:00',zone4:'00:00:00',zone5:'00:00:00'},input.zones||{}),
      zoneSummary:Object.assign({easyControlled:'00:00:00',moderate:'00:00:00',high:'00:00:00',unclassifiedTime:'00:00:00'},input.zoneSummary||{}),
      fuel:Object.assign({carbohydrate:0,protein:0,fat:0},input.fuel||{}),
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
  function latest(){var store=ensureStore();return store&&store.latest?store.latest:null;}
  function loadStatus(workout){
    var load=num(workout.trainingLoad,0);
    if(load<=39) return 'Controlled';
    if(load<=69) return 'Moderate';
    return 'High';
  }
  function impactLabel(value){return text(value,'—').split('_').filter(function(part){return part.toLowerCase()!=='to';}).map(function(part){return part?part.charAt(0).toUpperCase()+part.slice(1):'';}).join(' - ');}
  function dateLabel(workout){
    var day=text(workout.day,'');
    var date='';
    try{date=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(workout.date+'T12:00:00Z'));}catch(e){date=workout.date;}
    if(!day){try{day=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(new Date(workout.date+'T12:00:00Z'));}catch(e){day='';}}
    return [day,date].filter(Boolean).join(', ');
  }
  function pctFor(workout,key){return clamp(Math.round(seconds(workout.zones&&workout.zones[key])/durationSeconds(workout)*100),0,100);}
  function zoneRows(workout,detailed){
    return ['zone5','zone4','zone3','zone2','zone1'].map(function(key){
      var meta=zoneMeta[key],pct=pctFor(workout,key),duration=workout.zones&&workout.zones[key]||'00:00:00';
      return '<div class="pw-zone-row"><span class="pw-zone-badge" style="background:'+meta.color+'">'+key.slice(-1)+'</span><span>'+meta.label+'</span><span class="pw-zone-track"><i style="width:'+pct+'%;background:'+meta.color+'"></i></span><span class="pw-zone-time">'+esc(detailed?compactDuration(duration):compactDuration(duration))+'</span><span class="pw-zone-pct">'+pct+'%</span></div>';
    }).join('');
  }
  function zoneCard(workout,title,footnote,detailed){
    return '<div class="pw-card"><div class="pw-card-title"><h2>'+esc(title)+'</h2><span class="pw-info">i</span></div><div class="pw-zone-list">'+zoneRows(workout,detailed)+'</div>'+(footnote?'<div class="pw-footnote"><i>◉</i>'+esc(footnote)+'</div>':'')+'</div>';
  }
  function metric(label,value,unit){return '<div class="pw-metric"><small>'+esc(label)+'</small><b>'+esc(value)+'<em>'+esc(unit||'')+'</em></b></div>';}
  function heroCard(workout){
    var load=workout.trainingLoad==null?'—':workout.trainingLoad;
    var ring=workout.trainingLoad==null?0:clamp(num(workout.trainingLoad,0)*2,8,86);
    var status=loadStatus(workout);
    return '<div class="pw-card pw-hero"><div class="pw-hero-grid"><div class="pw-load-ring" style="--pw-ring:'+ring+'%"><div class="pw-load-inner"><small>LOAD</small><b>'+esc(load)+'</b><span>'+esc(status)+'</span></div></div><div class="pw-metrics">'
      +metric('Duration',workout.duration||'—','')
      +metric('Avg HR',workout.avgHR==null?'—':workout.avgHR,workout.avgHR==null?'':'bpm')
      +metric('Calories',workout.activeCal==null?'—':workout.activeCal,workout.activeCal==null?'':'kcal')
      +metric('RPE',workout.rpe==null?'—':workout.rpe+'/10','')
      +metric('Min HR',workout.minHR==null?'—':workout.minHR,workout.minHR==null?'':'bpm')
      +metric('Source','Polar','Flow')
      +'</div></div><div class="pw-interpret"><i>⌁</i><span>'+esc(overviewInterpretation(workout))+'</span></div></div>';
  }
  function overviewInterpretation(workout){
    var low=pctFor(workout,'zone1')+pctFor(workout,'zone2');
    if(loadStatus(workout)==='Controlled' && low>=50) return 'Controlled session. Mostly low-to-moderate intensity, good conditioning with manageable recovery cost.';
    if(loadStatus(workout)==='High') return 'High training load. Keep the next session conservative and monitor recovery signals.';
    return 'Moderate session with a manageable conditioning stimulus. Start the next working sets controlled.';
  }
  function fuelCard(workout){
    var fuel=workout.fuel||{},carb=clamp(num(fuel.carbohydrate,0),0,100),protein=clamp(num(fuel.protein,0),0,100),fat=clamp(num(fuel.fat,0),0,100);
    var total=carb+protein+fat||1;
    return '<div class="pw-card"><div class="pw-card-title"><h2>Fuel Mix</h2><span class="pw-info">i</span></div><div class="pw-fuel-bar"><span style="width:'+(carb/total*100)+'%"></span><span style="width:'+(protein/total*100)+'%"></span><span style="width:'+(fat/total*100)+'%"></span></div><div class="pw-fuel-stats"><div class="pw-fuel-stat carb"><b>'+carb+'%</b><small>Carbohydrate</small></div><div class="pw-fuel-stat protein"><b>'+protein+'%</b><small>Protein</small></div><div class="pw-fuel-stat fat"><b>'+fat+'%</b><small>Fat</small></div></div></div>';
  }
  function trainingImpactCard(workout){
    var next=impactLabel(workout.trainingImpact&&workout.trainingImpact.nextSessionAggressiveness);
    return '<div class="pw-card"><div class="pw-card-title"><h2>Training Impact</h2></div><div class="pw-impact-grid"><div class="pw-impact-item"><small>Training Load</small><b>'+esc(workout.trainingLoad==null?'—':workout.trainingLoad)+'</b><span>'+esc(loadStatus(workout))+'</span></div><div class="pw-impact-item"><small>RPE</small><b>'+esc(workout.rpe==null?'—':workout.rpe+'/10')+'</b><span>'+esc(workout.rpeLabel||'Moderate')+'</span></div><div class="pw-impact-item"><small>Next Session</small><b style="font-size:12px">'+esc(next)+'</b><span>Suggested Focus</span></div></div><div class="pw-coach-inline"><b>▣</b> No need to reduce the plan, but start the next session controlled.</div></div>';
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
  function chartCard(workout,title){return '<div class="pw-card"><div class="pw-card-title"><h2>'+esc(title)+'</h2></div>'+chartContent(workout)+'</div>';}
  function heartSummary(workout){
    return '<div class="pw-card"><div class="pw-card-title"><h2>Heart Rate Summary</h2></div><div class="pw-hr-summary"><div class="pw-hr-stat"><b class="red">♡ &nbsp;'+esc(workout.avgHR==null?'—':workout.avgHR)+'</b><small>Avg HR</small></div><div class="pw-hr-stat"><b class="mint">♡ &nbsp;'+esc(workout.minHR==null?'—':workout.minHR)+'</b><small>Min HR</small></div><div class="pw-hr-stat"><b class="gray">⊖ &nbsp;'+esc(workout.maxHR==null?'—':workout.maxHR)+'</b><small>Max HR</small></div></div></div>';
  }
  function heartInterpretation(workout){
    var low=pctFor(workout,'zone1')+pctFor(workout,'zone2');
    var sentence=low>=50?'Most of your workout was low-to-moderate intensity.':'Your workout included a meaningful moderate-to-high intensity block.';
    var rpe=workout.rpe==null?'':(' RPE was '+workout.rpe+'/10.');
    return '<div class="pw-card"><div class="pw-card-title"><h2>♡ &nbsp;Heart Interpretation</h2></div><p class="pw-copy">'+esc(sentence)+'</p><p class="pw-copy">Great for aerobic base and recovery-friendly conditioning.'+esc(rpe)+'</p><p class="pw-copy">Keep building consistency.</p></div>';
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
  function zoneInterpretation(){return '<div class="pw-card"><div class="pw-card-title"><h2>◉ &nbsp;Zone Interpretation</h2></div><p class="pw-copy">Most of the session stayed in Zone 1–2.</p><p class="pw-copy">Recovery cost is manageable.</p><p class="pw-copy">Good aerobic stimulus.</p></div>';}
  function loadProCard(workout){
    return '<div class="pw-card"><div class="pw-card-title"><h2>Training Load Pro</h2></div><div class="pw-load-pro"><div class="pw-load-number"><b>'+esc(workout.trainingLoad==null?'—':workout.trainingLoad)+'</b><span>'+esc(loadStatus(workout))+'</span></div><div class="pw-load-copy"><small>'+esc(workout.trainingLoadType||'Kardiyo yükü TRIMP')+'</small><p>Bu antrenman vücudun için kontrollü-orta seviyede bir yük oluşturdu.</p></div></div></div>';
  }
  function loadImpactCard(workout){
    var impact=workout.trainingImpact||{};
    return '<div class="pw-card"><div class="pw-card-title"><h2>Load Impact</h2></div><div class="pw-impact-list"><div class="pw-impact-line"><i></i><span>Load Level</span><b>'+esc(impactLabel(impact.loadLevel))+'</b></div><div class="pw-impact-line"><i></i><span>Recovery Effect</span><b>'+esc(impactLabel(impact.recoveryEffect))+'</b></div><div class="pw-impact-line"><i></i><span>Next Session Aggressiveness</span><b>'+esc(impactLabel(impact.nextSessionAggressiveness))+'</b></div></div></div>';
  }
  function rpeCard(workout){
    var rpe=workout.rpe==null?null:clamp(num(workout.rpe,0),0,10);
    return '<div class="pw-card"><div class="pw-card-title"><h2>RPE</h2></div><div class="pw-rpe-head"><b>'+esc(rpe==null?'—':rpe)+'<span> / 10</span></b><em>'+esc(workout.rpeLabel||'—')+'</em></div><div class="pw-rpe-scale">'+(rpe==null?'':'<i class="pw-rpe-marker" style="left:'+rpe*10+'%"></i>')+'</div></div>';
  }
  function coachNoteCard(workout){var note=text(workout.trainingImpact&&workout.trainingImpact.coachNote,'No coach note is available for this import.');return '<div class="pw-card"><div class="pw-card-title"><h2>Coach Note</h2></div><p class="pw-copy">'+esc(note)+'</p></div>';}
  function overview(workout){return heroCard(workout)+zoneCard(workout,'Heart Rate Zones','Zone 1–2 dominated the session.',false)+fuelCard(workout)+trainingImpactCard(workout)+chartCard(workout,'Heart Rate Trend');}
  function heart(workout){return heartSummary(workout)+chartCard(workout,'Heart Rate (bpm)')+zoneCard(workout,'Heart Rate Zones','',true)+heartInterpretation(workout);}
  function zones(workout){return zoneCard(workout,'Heart Rate Zones','',true)+zoneSummaryCard(workout)+zoneInterpretation(workout);}
  function load(workout){return loadProCard(workout)+loadImpactCard(workout)+rpeCard(workout)+coachNoteCard(workout);}
  function emptyState(){return '<div class="pw-empty"><div class="pw-empty-mark">⌁</div><h2>No Polar workout imported yet.</h2><p>Import Polar Flow workout JSON from Data Center.</p><button type="button" onclick="simurgV8Go(\'data\',\'menu\')">Open Data Center</button></div>';}
  function sectionHtml(){
    return '<div class="pw-shell"><header class="pw-header"><div class="pw-head-row"><button class="pw-head-icon" type="button" onclick="simurgV8Go(\'polar\',\'polar\')" aria-label="Back to Polar">‹</button><div class="pw-head-copy"><span class="pw-brand">SIMURG OS</span><h1>Polar Workout</h1><div id="pwSubtitle" class="pw-subtitle">Dedicated Polar Flow workout detail</div><div id="pwSource" class="pw-source"><i></i>Polar Flow</div></div><button class="pw-head-icon" type="button" onclick="polarWorkoutExport()" aria-label="Export Polar workout">⇧</button></div></header><div class="pw-tabs" role="tablist">'+tabs.map(function(tab){return '<button id="pwTab-'+tab+'" class="pw-tab '+(tab===currentTab?'active':'')+'" type="button" role="tab" onclick="polarWorkoutSetTab(\''+tab+'\')">'+tab.toUpperCase()+'</button>';}).join('')+'</div><div id="pwContent" class="pw-content"></div></div>';
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
    var workout=latest(),content=document.getElementById('pwContent');
    tabs.forEach(function(tab){var button=document.getElementById('pwTab-'+tab);if(button) button.classList.toggle('active',tab===currentTab);});
    if(!content) return;
    if(!workout){content.innerHTML=emptyState();return;}
    var subtitle=document.getElementById('pwSubtitle'),source=document.getElementById('pwSource');
    if(subtitle) subtitle.textContent=[workout.workoutType,dateLabel(workout),workout.startTime].filter(Boolean).join(' · ');
    if(source) source.innerHTML='<i></i>'+esc(workout.source||'Polar Flow')+' · '+esc(workout.device||'Polar device');
    var renderers={overview:overview,heart:heart,zones:zones,load:load};
    content.innerHTML=renderers[currentTab](workout);
  }
  function ensureNavigation(){
    var nav=document.getElementById('simurgV8Nav');
    if(nav&&!nav.querySelector('[data-key="polarWorkout"]')){
      var button=document.createElement('button');
      button.dataset.key='polarWorkout';button.type='button';button.innerHTML='<i>⌁</i>Polar Workout';button.onclick=function(){window.simurgV8Go('polar-workout','polarWorkout');};
      var menu=nav.querySelector('[data-key="menu"]');nav.insertBefore(button,menu||null);
    }
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
    setTimeout(markPolarWorkoutActive,0);
    setTimeout(markPolarWorkoutActive,120);
    window.scrollTo(0,0);
  }
  function wrapGo(){
    var old=window.simurgV8Go;
    if(typeof old!=='function'||old.__polarWorkout) return;
    window.simurgV8Go=function(id,key){
      if(id==='polar-workout'){
        activatePolarWorkout();
        setTimeout(activatePolarWorkout,0);
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
  window.polarWorkoutSetTab=function(tab){if(tabs.indexOf(tab)<0)return;currentTab=tab;render();markPolarWorkoutActive();setTimeout(markPolarWorkoutActive,0);window.scrollTo(0,0);};
  window.simurgOpenPolarWorkout=function(button){
    activatePolarWorkout();
    if(button){document.querySelectorAll('aside .nav button').forEach(function(item){item.classList.toggle('active',item===button);});}
  };
  window.polarWorkoutExport=function(){
    var workout=latest();if(!workout){return;}
    var blob=new Blob([JSON.stringify(workout,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='polar-workout-'+workout.date+'-'+(workout.startTime||'workout').replace(':','')+'.json';a.click();URL.revokeObjectURL(url);
  };

  ready(function(){
    ensureStore();ensureSection();ensureNavigation();wrapGo();wrapUniversalImport();render();
    var importCopy=document.querySelector('.universalImportCard .sub');if(importCopy) importCopy.textContent='Tek veri giriş noktası: Polar Flow workout, Apple Watch, workout, daily ve weekly JSON verilerini otomatik tanır.';
    var observer=new MutationObserver(function(){ensureNavigation();wrapGo();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(function(){ensureNavigation();wrapGo();wrapUniversalImport();render();},500);
  });
})();
