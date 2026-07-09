
if(!window.CSS){window.CSS={};}
if(!CSS.escape){CSS.escape=function(s){return String(s).replace(/["\\]/g,'\\$&');};}

;

const INITIAL={"workouts": [{"date": "2026-06-22", "day": "Monday", "exercise": "Incline DB Press", "sets": 1, "reps": 10, "weight": 17.5, "bodyPart": "Chest", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Incline DB Press", "sets": 1, "reps": 8, "weight": 20, "bodyPart": "Chest", "notes": "Set 2"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Incline DB Press", "sets": 1, "reps": 8, "weight": 20, "bodyPart": "Chest", "notes": "Set 3"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Incline DB Press", "sets": 1, "reps": 8, "weight": 22.5, "bodyPart": "Chest", "notes": "Set 4"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Flat DB Press", "sets": 1, "reps": 10, "weight": 22.5, "bodyPart": "Chest", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Flat DB Press", "sets": 1, "reps": 8, "weight": 25, "bodyPart": "Chest", "notes": "Set 2"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Flat DB Press", "sets": 1, "reps": 8, "weight": 25, "bodyPart": "Chest", "notes": "Set 3"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Prone Y Raise", "sets": 1, "reps": 12, "weight": 2.5, "bodyPart": "Scapula", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Prone Y Raise", "sets": 1, "reps": 12, "weight": 2.5, "bodyPart": "Scapula", "notes": "Set 2"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Lateral Raise", "sets": 1, "reps": 12, "weight": 7.5, "bodyPart": "Side Delt", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Lateral Raise", "sets": 1, "reps": 12, "weight": 7.5, "bodyPart": "Side Delt", "notes": "Set 2"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Lateral Raise", "sets": 1, "reps": 12, "weight": 5, "bodyPart": "Side Delt", "notes": "Set 3"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Cable Fly", "sets": 1, "reps": 12, "weight": 7.5, "bodyPart": "Chest", "notes": "İlk 2 set single zorunlu"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Cable Fly", "sets": 1, "reps": 12, "weight": 10, "bodyPart": "Chest", "notes": "İlk 2 set single zorunlu"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Cable Fly", "sets": 1, "reps": 12, "weight": 10, "bodyPart": "Chest", "notes": "İlk 2 set single zorunlu"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Cable Fly", "sets": 1, "reps": 10, "weight": 10, "bodyPart": "Chest", "notes": "İlk 2 set single zorunlu"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Rope Pushdown", "sets": 1, "reps": 12, "weight": 15, "bodyPart": "Triceps", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Rope Pushdown", "sets": 1, "reps": 10, "weight": 15, "bodyPart": "Triceps", "notes": "Set 2"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Rope Pushdown", "sets": 1, "reps": 12, "weight": 12.5, "bodyPart": "Triceps", "notes": "Set 3"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Reverse Grip Pushdown", "sets": 1, "reps": 12, "weight": 15, "bodyPart": "Triceps", "notes": "Set 1"}, {"date": "2026-06-22", "day": "Monday", "exercise": "Reverse Grip Pushdown", "sets": 1, "reps": 12, "weight": 15, "bodyPart": "Triceps", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Bench Supported DB Row", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Bench Supported DB Row", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Bench Supported DB Row", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 3"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Bench Supported DB Row", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 4"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Lat Pulldown", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Lat Pulldown", "sets": 1, "reps": 8, "weight": 17.5, "bodyPart": "Back", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Lat Pulldown", "sets": 1, "reps": 8, "weight": 21, "bodyPart": "Back", "notes": "Set 3"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Lat Pulldown", "sets": 1, "reps": 8, "weight": 21, "bodyPart": "Back", "notes": "Set 4"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Cable Row", "sets": 1, "reps": 8, "weight": 21, "bodyPart": "Back", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Cable Row", "sets": 1, "reps": 8, "weight": 21, "bodyPart": "Back", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Single Arm Cable Row", "sets": 1, "reps": 8, "weight": 21, "bodyPart": "Back", "notes": "Set 3"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Rear Delt Cable Fly", "sets": 1, "reps": 15, "weight": 2.5, "bodyPart": "Rear Delt", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Rear Delt Cable Fly", "sets": 1, "reps": 15, "weight": 2.5, "bodyPart": "Rear Delt", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Rear Delt Cable Fly", "sets": 1, "reps": 15, "weight": 2.5, "bodyPart": "Rear Delt", "notes": "Set 3"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Face Pull", "sets": 1, "reps": 15, "weight": 15, "bodyPart": "Rear Delt", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Face Pull", "sets": 1, "reps": 15, "weight": 15, "bodyPart": "Rear Delt", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Incline DB Curl", "sets": 1, "reps": 10, "weight": 10, "bodyPart": "Biceps", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Incline DB Curl", "sets": 1, "reps": 8, "weight": 10, "bodyPart": "Biceps", "notes": "Set 2"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Incline DB Curl", "sets": 1, "reps": 10, "weight": 7.5, "bodyPart": "Biceps", "notes": "Set 3"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Reverse Cable Curl", "sets": 1, "reps": 10, "weight": 15, "bodyPart": "Biceps", "notes": "Set 1"}, {"date": "2026-06-23", "day": "Tuesday", "exercise": "Reverse Cable Curl", "sets": 1, "reps": 10, "weight": 12.5, "bodyPart": "Biceps", "notes": "Set 2"}], "metrics": [], "nutrition": [], "recovery": []};
let DATA=JSON.parse(localStorage.getItem('atlas_summary_reports')||JSON.stringify(INITIAL));
if(!DATA.appleWatch) DATA.appleWatch=[];
if(!DATA.dailyNotes) DATA.dailyNotes=[];
if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
if(!DATA.customGymPrograms) DATA.customGymPrograms={};
if(!DATA.programNames) DATA.programNames={};
let selectedDate=todayStr(), weekStart=mondayOf(selectedDate), editIndexes=[];
const program=[
  ['Monday','Push Strength'],
  ['Tuesday','Pull Strength'],
  ['Wednesday','Upper Pump + Posture'],
  ['Thursday','Push Strength'],
  ['Friday','Pull Strength'],
  ['Saturday','Off Day'],
  ['Sunday','Off Day']
];
const defaultProgramNames=Object.fromEntries(program);
let editingProgramDay=null;
function getProgramType(day){return (DATA.programNames&&DATA.programNames[day])||defaultProgramNames[day]||'Off Day'}
function getProgramLabelForDate(date){let day=dayName(date);return `${day} ${getProgramType(day)}`}
function escapeAttr(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#39;')}
const bodyMap={"incline db press":"Chest","flat db press":"Chest","cable fly":"Chest","bench supported db row":"Back","hammer strength high row":"Back","chest supported row":"Back","single arm lat pulldown":"Back","single arm cable row":"Back","rear delt cable fly":"Rear Delt","face pull":"Rear Delt","prone y raise":"Scapula","lateral raise":"Side Delt","rope pushdown":"Triceps","reverse grip pushdown":"Triceps","incline db curl":"Biceps","cable curl":"Biceps","reverse cable curl":"Biceps","rope pushdown / incline db curl superset":"Arms"};
const colors={"Back":"#2f84ff","Chest":"#2f84ff","Rear Delt":"#8b5cf6","Biceps":"#23ce7a","Triceps":"#ffbd3d","Side Delt":"#23ce7a","Scapula":"#8b5cf6","Shoulder Stability":"#8b5cf6","Shoulders":"#23ce7a","Arms":"#ffbd3d"};
function parseDate(s){let [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function mondayOf(dateStr){
  let d=parseDate(dateStr);
  let day=d.getDay();
  let diff=(day===0?-6:1-day);
  d.setDate(d.getDate()+diff);
  return fmt(d);
}
function fmt(d){let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function todayStr(){return fmt(new Date())}
function goToday(){selectedDate=todayStr();weekStart=mondayOf(selectedDate);render()}
function trDate(s){return s.split('-').reverse().join('.')}
function addDays(s,n){let d=parseDate(s);d.setDate(d.getDate()+n);return fmt(d)}
function dayName(dateStr){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][parseDate(dateStr).getDay()]}
function part(ex){return bodyMap[(ex||'').toLowerCase().trim()]||'Other'}
function show(id,btn){
document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
let target=document.getElementById(id);
if(target) target.classList.add('active');
document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
if(btn) btn.classList.add('active');
window.scrollTo({top:0,behavior:'smooth'});
render();
}
function changeWeek(n){weekStart=addDays(weekStart,n);selectedDate=addDays(selectedDate,n);weekStart=mondayOf(selectedDate);render()}
function selectDay(day){let idx=program.findIndex(p=>p[0]===day);if(idx<0)return;selectedDate=addDays(weekStart,idx);render()}
function render(){renderProgramDays();renderWeekStrip();renderWorkout();renderGymMode();renderReports();renderDailyReport();renderWeeklyReport();renderWatchPanel();renderCoachPanels();renderReadinessPanel();renderInjuryRiskPanel();renderPhoenixReport();renderSide()}
function dayData(date){return DATA.workouts.filter(w=>w.date===date)}
function weekDates(){weekStart=mondayOf(weekStart);return [0,1,2,3,4,5,6].map(i=>addDays(weekStart,i))}
function calc(items){let vol=items.reduce((a,w)=>a+w.weight*w.reps,0), reps=items.reduce((a,w)=>a+w.reps,0);let parts={}, exs={};items.forEach(w=>{parts[w.bodyPart]=(parts[w.bodyPart]||0)+1;if(!exs[w.exercise])exs[w.exercise]=[];exs[w.exercise].push(w)});return {sets:items.length,reps,vol,parts,exs}}
function renderProgramDays(){
  dayProgram.innerHTML=program.map(([d,defaultType],i)=>{
    let date=addDays(weekStart,i);
    let type=getProgramType(d);
    let off=(type||'').toLowerCase().includes('off')?'offDay':'';
    let watch=watchRowsForDate(date);
    let activity=watch.length?activitySummaryForDate(date):null;
    let badge=activity?`<div class="activityDayBadge" title="${escapeAttr(activity.fullLabel)}">${activity.emoji} ${activity.shortLabel}</div>`:'';
    return `<button class="dayBtn ${date===selectedDate?'active':''} ${off}" onclick="selectDay('${d}')"><span class="renameDayBtn" title="Program adını düzenle" onclick="event.stopPropagation();openProgramNameEdit('${d}')">✎</span><div class="main">${d}</div><div class="type">${type}</div>${badge}</button>`
  }).join('')
}
function renderWeekStrip(){
  let end=addDays(weekStart,6);
  weekLabel.textContent=`${trDate(weekStart)} - ${trDate(end)}`;
  weekStrip.innerHTML=weekDates().map(d=>{
    let activity=watchRowsForDate(d).length?activitySummaryForDate(d):null;
    let dot=activity?`<div class="activityDot" title="${escapeAttr(activity.fullLabel)}">${activity.emoji}</div>`:'';
    return `<button class="dateBtn ${d===selectedDate?'active':''}" onclick="selectedDate='${d}';render()"><div class="d">${trDate(d)}</div><div class="day">${dayName(d)}</div>${dot}</button>`
  }).join('')
}
function renderWorkout(){
  let day=dayData(selectedDate);
  let c=calc(day);
  let groups={};
  day.forEach(w=>{if(!groups[w.bodyPart])groups[w.bodyPart]=[];groups[w.bodyPart].push(w)});
  let activityHtml=renderActivitySessionCard(selectedDate);
  if(!day.length){
    workoutGroups.innerHTML=activityHtml || `<div class="emptyState"><b>${trDate(selectedDate)} için kayıt yok.</b><br>Günün raporunu yazdığında JSON'a çevirip içeri aldırırız.</div>`;
  }else{
    const workoutHtml=Object.entries(groups).map(([body,items])=>{
      let exs={};items.forEach(w=>{if(!exs[w.exercise])exs[w.exercise]=[];exs[w.exercise].push(w)});
      let cc=calc(items);
      return `<div class="group"><div class="groupHead"><div><span class="groupTitle">${body.toUpperCase()}</span><span class="groupMeta">• ${cc.sets} SET • ${Math.round(cc.vol).toLocaleString('tr-TR')} KG</span></div><div class="groupPill">${cc.sets} SET</div></div><div class="exerciseGrid">${Object.entries(exs).map(([ex,sets])=>exCard(ex,sets)).join('')}</div></div>`
    }).join('');
    workoutGroups.innerHTML=workoutHtml + activityHtml;
  }
  totalSetsBottom.textContent=c.sets;
  totalRepsBottom.textContent=c.reps;
  totalVolumeBottom.textContent=Math.round(c.vol).toLocaleString('tr-TR');
  renderRight(groups)
}
function exCard(ex,sets){return `<div class="exerciseCard"><div class="exTop"><div class="exName" onclick="openEditExercise('${ex.replaceAll("'","\'")}')">${ex}</div><button class="menuBtn" onclick="openEditExercise('${ex.replaceAll("'","\'")}')">⋮</button></div><table class="setTable"><thead><tr><th>SET</th><th>TEKRAR</th><th>KİLO</th></tr></thead><tbody>${sets.map((s,i)=>`<tr onclick="openEditSet(${DATA.workouts.indexOf(s)})"><td>${i+1}</td><td>${s.reps}</td><td>${s.weight}</td></tr>`).join('')}</tbody></table><div class="addSet" onclick="addSetToExercise('${ex.replaceAll("'","\'")}')">+ Set Ekle</div><div class="blueLine"></div></div>`}

function volumeLevel(sets){
  if(!sets) return 'empty';
  if(sets < 14) return 'low';
  if(sets < 18) return 'mid';
  if(sets <= 24) return 'good';
  return 'high';
}

function renderRight(groups){
let totals=Object.fromEntries(Object.entries(groups).map(([b,items])=>[b,calc(items).vol]));
let all=Object.values(totals).reduce((a,b)=>a+b,0)||1;
let palette=["#2f84ff","#23ce7a","#ffbd3d","#8b5cf6","#ff4d5f","#14b8a6","#f97316"];
let entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]);

let start=0;
let gradientParts=[];
entries.forEach(([b,v],i)=>{
  let pct=(v/all)*100;
  let end=start+pct;
  gradientParts.push(`${palette[i%palette.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
  start=end;
});
let donut=document.querySelector('.donut');
if(donut){
  donut.style.background=gradientParts.length ? `conic-gradient(${gradientParts.join(',')})` : '#0b1320';
  donut.classList.remove('tooltipItem');
  donut.removeAttribute('data-tip');
  donut.removeAttribute('data-center');
}

legend.innerHTML=entries.map(([b,v],i)=>{
  let pct=Math.round(v/all*100);
  let kg=Math.round(v).toLocaleString('tr-TR');
  let setCount=(groups[b]||[]).length;
  return `<div class="leg" data-tip="${b}: ${pct}% • ${kg} kg • ${setCount} set"><span><span class="dot" style="background:${palette[i%palette.length]}"></span>${b}</span><span>${pct}%</span></div>`
}).join('')||'<span class="sub">Veri yok</span>';

trendBars.innerHTML=weekDates().map(d=>{
let v=calc(dayData(d)).vol;
let sets=calc(dayData(d)).sets;
let level=volumeLevel(sets);
return `<div class="bar tooltipItem ${level}" data-tip="${trDate(d)} • ${Math.round(v).toLocaleString('tr-TR')} kg hacim • ${sets} set" title="${trDate(d)} - ${Math.round(v).toLocaleString('tr-TR')} kg" style="height:${Math.max(6,Math.min(115,v/50))}px"></div>`
}).join('');

let topBody=entries[0]||['-',0];
perfSummary.innerHTML=`<div class="summaryRow"><span>🏆 En Yüksek Hacim</span><b>${Math.round(topBody[1]).toLocaleString('tr-TR')} KG (${topBody[0]})</b></div><div class="summaryRow"><span>🏋️ En Çok Set</span><b>${Object.values(groups).reduce((m,a)=>Math.max(m,a.length),0)} SET</b></div><div class="summaryRow"><span>📊 Toplam Hacim</span><b>${Math.round(Object.values(totals).reduce((a,b)=>a+b,0)).toLocaleString('tr-TR')} KG</b></div>`
}

function gymTemplateForDate(date){
  const dow=parseDate(date).getDay(); // 0 Sunday, 1 Monday ... 6 Saturday
  const templates={
    1:{name:getProgramLabelForDate(date),items:[
      ['Incline DB Press','Chest',4],
      ['Flat DB Press','Chest',3],
      ['Prone Y Raise','Shoulder Stability',2],
      ['Lateral Raise','Shoulders',3],
      ['Cable Fly','Chest',3],
      ['Rope Pushdown','Triceps',3],
      ['Reverse Grip Pushdown','Triceps',2]
    ]},
    2:{name:getProgramLabelForDate(date),items:[
      ['Bench Supported DB Row','Back',4],
      ['Single Arm Lat Pulldown','Back',4],
      ['Single Arm Cable Row','Back',3],
      ['Rear Delt Cable Fly','Rear Delt',3],
      ['Face Pull','Rear Delt',2],
      ['Incline DB Curl','Biceps',3],
      ['Reverse Cable Curl','Biceps',2]
    ]},
    3:{name:getProgramLabelForDate(date),items:[
      ['Incline DB Press','Chest',3],
      ['Hammer Strength High Row','Back',3],
      ['Single Arm Cable Row','Back',3],
      ['Rear Delt Cable Fly','Rear Delt',3],
      ['Lateral Raise','Side Delt',2],
      ['Rope Pushdown / Incline DB Curl Superset','Arms',3],
      ['Face Pull','Rear Delt',2]
    ]},
    4:{name:getProgramLabelForDate(date),items:[
      ['Incline DB Press','Chest',4],
      ['Flat DB Press','Chest',3],
      ['Prone Y Raise','Shoulder Stability',2],
      ['Lateral Raise','Shoulders',3],
      ['Cable Fly','Chest',3],
      ['Rope Pushdown','Triceps',3],
      ['Reverse Grip Pushdown','Triceps',2]
    ]},
    5:{name:getProgramLabelForDate(date),items:[
      ['Bench Supported DB Row','Back',4],
      ['Single Arm Lat Pulldown','Back',4],
      ['Single Arm Cable Row','Back',3],
      ['Rear Delt Cable Fly','Rear Delt',3],
      ['Face Pull','Rear Delt',2],
      ['Incline DB Curl','Biceps',3],
      ['Reverse Cable Curl','Biceps',2]
    ]},
    6:{name:getProgramLabelForDate(date),items:[]},
    0:{name:getProgramLabelForDate(date),items:[]}
  };
  return templates[dow]||{name:getProgramLabelForDate(date),items:[]};
}
function normalGymProgramEntry(date){
  if(!DATA.customGymPrograms || typeof DATA.customGymPrograms!=='object' || Array.isArray(DATA.customGymPrograms)){
    DATA.customGymPrograms={};
  }
  let entry=DATA.customGymPrograms[date];
  if(!entry || Array.isArray(entry)){
    entry={overrides:{},extras:Array.isArray(entry)?entry:[]};
    DATA.customGymPrograms[date]=entry;
  }
  if(!entry.overrides || typeof entry.overrides!=='object') entry.overrides={};
  if(!Array.isArray(entry.extras)) entry.extras=[];
  entry.extras=entry.extras.map((x,i)=>({
    id:x.id||('custom_'+Date.now()+'_'+i),
    name:x.name||x.exercise||'Yeni Hareket',
    bodyPart:x.bodyPart||'Other',
    setCount:Number(x.setCount||x.sets||3)||3,
    custom:true
  }));
  return entry;
}
function gymSafe(v){
  return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function gymItemsForDate(date){
  const base=gymTemplateForDate(date).items||[];
  const entry=normalGymProgramEntry(date);
  const baseItems=base.map(([ex,bodyPart,setCount])=>{
    const ov=entry.overrides[ex]||{};
    return {
      key:'template::'+ex,
      originalName:ex,
      name:ov.name||ex,
      bodyPart:ov.bodyPart||bodyPart,
      setCount:Number(ov.setCount||setCount)||setCount,
      custom:false
    };
  });
  const extras=entry.extras.map(x=>({
    key:'custom::'+x.id,
    id:x.id,
    originalName:x.name,
    name:x.name||'Yeni Hareket',
    bodyPart:x.bodyPart||'Other',
    setCount:Number(x.setCount||3)||3,
    custom:true
  }));
  return baseItems.concat(extras);
}
function gymCardEl(key){
  return document.querySelector(`[data-gym-key="${CSS.escape(key)}"]`);
}
function readGymMetaFromCard(card){
  return {
    key:card.dataset.gymKey,
    originalName:card.dataset.originalName||'',
    currentName:card.dataset.currentName||'',
    custom:card.dataset.custom==='1',
    name:(card.querySelector('.gymExerciseName')?.value||'').trim()||'Yeni Hareket',
    bodyPart:(card.querySelector('.gymExerciseBody')?.value||'').trim()||'Other',
    setCount:Math.max(1,Number(card.querySelector('.gymExerciseSets')?.value)||1)
  };
}
function upsertGymProgramMeta(meta){
  const entry=normalGymProgramEntry(selectedDate);
  if(meta.custom){
    const id=meta.key.replace('custom::','');
    let item=entry.extras.find(x=>x.id===id);
    if(!item){
      item={id,custom:true};
      entry.extras.push(item);
    }
    item.name=meta.name;
    item.bodyPart=meta.bodyPart;
    item.setCount=meta.setCount;
  }else{
    entry.overrides[meta.originalName]={name:meta.name,bodyPart:meta.bodyPart,setCount:meta.setCount};
  }
}
function migrateGymExerciseName(oldNames,newName,bodyPart){
  const names=[...new Set(oldNames.filter(Boolean))];
  DATA.workouts.forEach(w=>{
    if(w.date===selectedDate && names.includes(w.exercise)){
      w.exercise=newName;
      w.bodyPart=bodyPart||w.bodyPart||part(newName);
    }
  });
}
function gymRowsForExercise(ex, bodyPart, defaultSets){
  let existing=DATA.workouts.filter(w=>w.date===selectedDate && w.exercise===ex);
  if(existing.length) return existing.map((r,i)=>({index:i+1,weight:r.weight||'',reps:r.reps||'',saved:true}));
  return Array.from({length:Math.max(1,Number(defaultSets)||1)},(_,i)=>({index:i+1,weight:'',reps:'',saved:false}));
}
function saveGymExercise(key){
  const card=gymCardEl(key);
  if(!card) return;
  const meta=readGymMetaFromCard(card);
  const coach=readGymCoachFromCard(card);
  upsertGymProgramMeta(meta);
  const possibleOld=[meta.currentName,meta.originalName];
  migrateGymExerciseName(possibleOld,meta.name,meta.bodyPart);
  let rows=[...card.querySelectorAll('.gymSetInputRow')];
  DATA.workouts=DATA.workouts.filter(w=>!(w.date===selectedDate && [meta.name,...possibleOld].includes(w.exercise)));
  rows.forEach((row,i)=>{
    let weight=row.querySelector('.gymWeight').value;
    let reps=row.querySelector('.gymReps').value;
    if(String(weight).trim()!=='' || String(reps).trim()!==''){
      DATA.workouts.push({
        date:selectedDate,
        day:dayName(selectedDate),
        exercise:meta.name,
        bodyPart:meta.bodyPart||part(meta.name),
        sets:1,
        reps:Number(String(reps).replace(',','.'))||0,
        weight:Number(String(weight).replace(',','.'))||0,
        rpe:coach.rpe,
        form:coach.form,
        pain:coach.pain,
        notes:'Gym Mode'
      });
    }
  });
  save();
}
function addGymSet(key){
  let card=gymCardEl(key);
  let wrap=card?.querySelector('.gymSetList');
  if(!wrap) return;
  let n=wrap.querySelectorAll('.gymSetInputRow').length+1;
  wrap.insertAdjacentHTML('beforeend',`<div class="gymSetInputRow">
    <strong>#${n}</strong>
    <label class="gymInputBox"><small>Weight</small><input class="gymWeight" inputmode="decimal" placeholder="kg"></label>
    <label class="gymInputBox"><small>Reps</small><input class="gymReps" inputmode="numeric" placeholder="reps"></label>
  </div>`);
}
function clearGymExercise(key){
  const card=gymCardEl(key);
  if(!card) return;
  const meta=readGymMetaFromCard(card);
  if(!confirm(meta.name+' verilerini bu gün için temizleyeyim mi?')) return;
  DATA.workouts=DATA.workouts.filter(w=>!(w.date===selectedDate && [meta.name,meta.currentName,meta.originalName].includes(w.exercise)));
  save();
}
function addGymExercise(){
  const entry=normalGymProgramEntry(selectedDate);
  const id='custom_'+Date.now();
  entry.extras.push({id,name:'Yeni Hareket',bodyPart:'Other',setCount:3,custom:true});
  save();
}
function deleteGymExercise(key){
  const card=gymCardEl(key);
  if(!card) return;
  const meta=readGymMetaFromCard(card);
  if(!meta.custom){
    clearGymExercise(key);
    return;
  }
  if(!confirm(meta.name+' kartını ve bu günkü kayıtlarını silelim mi?')) return;
  const entry=normalGymProgramEntry(selectedDate);
  const id=key.replace('custom::','');
  entry.extras=entry.extras.filter(x=>x.id!==id);
  DATA.workouts=DATA.workouts.filter(w=>!(w.date===selectedDate && [meta.name,meta.currentName,meta.originalName].includes(w.exercise)));
  save();
}

function readGymCoachFromCard(card){
  return {
    rpe:(card.querySelector('.gymRpe')?.value||'').trim(),
    form:(card.querySelector('.gymForm')?.value||'').trim(),
    pain:(card.querySelector('.gymPain')?.value||'').trim()
  };
}
function gymCoachForExercise(date,ex){
  const row=DATA.workouts.find(w=>w.date===date && w.exercise===ex && (w.rpe || w.form || w.pain));
  return {rpe:row?.rpe||'',form:row?.form||'',pain:row?.pain||'None'};
}
function exerciseSessions(ex){
  const byDate={};
  DATA.workouts.filter(w=>w.exercise===ex).forEach(w=>{
    if(!byDate[w.date]) byDate[w.date]=[];
    byDate[w.date].push(w);
  });
  return Object.keys(byDate).sort((a,b)=>parseDate(b)-parseDate(a)).map(date=>({date,rows:byDate[date]}));
}
function exerciseSessionStats(rows){
  const sets=rows.length;
  const reps=rows.reduce((a,w)=>a+(Number(w.reps)||0),0);
  const vol=rows.reduce((a,w)=>a+(Number(w.weight)||0)*(Number(w.reps)||0),0);
  const best=rows.reduce((m,w)=>{
    const wt=Number(w.weight)||0, rp=Number(w.reps)||0;
    if(wt>m.weight || (wt===m.weight && rp>m.reps)) return {weight:wt,reps:rp};
    return m;
  },{weight:0,reps:0});
  const rpe=rows.find(w=>w.rpe)?.rpe||'';
  const form=rows.find(w=>w.form)?.form||'';
  const pain=rows.find(w=>w.pain)?.pain||'None';
  return {sets,reps,vol,best,rpe,form,pain};
}
function buildNextTarget(ex){
  const previous=exerciseSessions(ex).filter(s=>parseDate(s.date)<parseDate(selectedDate));
  if(!previous.length) return {level:'',text:'Bu hareket için önceki kayıt yok. Bugün kontrollü başlangıç yap ve temiz formu referans al.'};
  const last=previous[0];
  const st=exerciseSessionStats(last.rows);
  const rpe=Number(st.rpe)||0;
  const badPain=st.pain==='Warning' || st.pain==='Mild';
  const badForm=st.form==='Bad';
  if(st.pain==='Warning' || badForm || rpe>=9){
    return {level:'danger',text:`Son kayıt ${trDate(last.date)}: ${st.sets} set, ${st.reps} tekrar, ${Math.round(st.vol)} kg. Ağrı/form/yük sinyali var. Bugün kilo artırma; temiz form, kontrollü tempo ve gerekirse %10-20 daha az hacim.`};
  }
  if(badPain || st.form==='Okay' || rpe>=8){
    return {level:'warning',text:`Son kayıt ${trDate(last.date)}: ${st.sets} set, ${st.reps} tekrar, en iyi ${st.best.weight}kg x ${st.best.reps}. Bugün aynı kiloda kal; hedef formu korumak ve tekrarları eşitlemek.`};
  }
  if(st.best.reps>=10 && st.best.weight>0){
    return {level:'',text:`Son kayıt ${trDate(last.date)}: en iyi ${st.best.weight}kg x ${st.best.reps}. Form temizse ilk sette küçük kilo artışı deneyebilirsin; zorlanırsa aynı kiloya dön.`};
  }
  return {level:'',text:`Son kayıt ${trDate(last.date)}: ${st.sets} set, ${st.reps} tekrar, en iyi ${st.best.weight}kg x ${st.best.reps}. Güvenli hedef: aynı kiloda ilk sete +1 tekrar veya tüm setleri daha temiz tamamla.`};
}
function renderHistoryHtml(ex){
  const sessions=exerciseSessions(ex).slice(0,5);
  if(!sessions.length) return '<div class="gymEmpty">Bu hareket için geçmiş kayıt yok.</div>';
  return '<div class="historyList">'+sessions.map(s=>{
    const st=exerciseSessionStats(s.rows);
    const setText=s.rows.map(w=>`${gymSafe(w.weight)}kg x ${gymSafe(w.reps)}`).join(' / ');
    return `<div class="historyItem"><b>${trDate(s.date)} • ${st.sets} set • ${Math.round(st.vol).toLocaleString('tr-TR')} kg</b><span>${setText}</span><div class="historyBadges"><em>Best ${st.best.weight}kg x ${st.best.reps}</em>${st.rpe?`<em>RPE ${gymSafe(st.rpe)}</em>`:''}${st.form?`<em>Form ${gymSafe(st.form)}</em>`:''}${st.pain?`<em>Pain ${gymSafe(st.pain)}</em>`:''}</div></div>`;
  }).join('')+'</div>';
}
function toggleGymHistory(key){
  const card=gymCardEl(key);
  if(!card) return;
  const panel=card.querySelector('.gymHistoryPanel');
  if(!panel) return;
  const meta=readGymMetaFromCard(card);
  panel.innerHTML=renderHistoryHtml(meta.name);
  panel.classList.toggle('active');
}
function renderGymMode(){
  let label=document.getElementById('gymDateLabel');
  let title=document.getElementById('gymDayTitle');
  let meta=document.getElementById('gymDayMeta');
  let list=document.getElementById('gymModeList');
  if(!list) return;
  let template=gymTemplateForDate(selectedDate);
  let gymItems=gymItemsForDate(selectedDate);
  let items=dayData(selectedDate);
  let c=calc(items);
  if(label) label.textContent=trDate(selectedDate);
  if(title) title.textContent=template.name;
  if(meta) meta.textContent=`${trDate(selectedDate)} • ${c.sets} saved set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg volume`;
  const addCard=`<div class="gymAddCard">
    <div><b>Programı düzenle</b><span>Hareket adını değiştir, body part/set planını düzenle veya bu güne ekstra hareket ekle.</span></div>
    <button class="btn" onclick="addGymExercise()">+ Hareket Ekle</button>
  </div>`;
  if(!gymItems.length){
    list.innerHTML=addCard+'<div class="gymEmpty">Bugün Off Day. İstersen + Hareket Ekle ile recovery, mobilite, core veya ekstra pump girebilirsin.</div>';
    return;
  }
  list.innerHTML=addCard+gymItems.map(item=>{
    let ex=item.name, bodyPart=item.bodyPart, setCount=item.setCount;
    let rows=gymRowsForExercise(ex,bodyPart,setCount);
    let savedCount=DATA.workouts.filter(w=>w.date===selectedDate && w.exercise===ex).length;
    let coach=gymCoachForExercise(selectedDate,ex);
    let target=buildNextTarget(ex);
    let arg=JSON.stringify(item.key);
    let rowHtml=rows.map(r=>`<div class="gymSetInputRow">
      <strong>#${r.index}</strong>
      <label class="gymInputBox"><small>Weight</small><input class="gymWeight" inputmode="decimal" placeholder="kg" value="${gymSafe(r.weight)}"></label>
      <label class="gymInputBox"><small>Reps</small><input class="gymReps" inputmode="numeric" placeholder="reps" value="${gymSafe(r.reps)}"></label>
    </div>`).join('');
    return `<div class="gymCard ${savedCount?'':'isTemplate'}" data-gym-key="${gymSafe(item.key)}" data-original-name="${gymSafe(item.originalName)}" data-current-name="${gymSafe(ex)}" data-custom="${item.custom?'1':'0'}">
      <div class="gymCardHead">
        <div style="flex:1">
          <div class="gymMetaGrid">
            <label class="gymMetaInput"><small>Exercise</small><input class="gymExerciseName" value="${gymSafe(ex)}" placeholder="Hareket adı"></label>
            <label class="gymMetaInput"><small>Body Part</small><input class="gymExerciseBody" value="${gymSafe(bodyPart)}" placeholder="Chest / Back"></label>
            <label class="gymMetaInput"><small>Planned Set</small><input class="gymExerciseSets" inputmode="numeric" value="${gymSafe(setCount)}"></label>
          </div>
          <div class="gymProgramNote">${item.custom?'Custom exercise':'Template exercise'} • Save sonrası Cloud Sync datasına dahil olur.</div>
        </div>
        <div class="gymBadge ${item.custom?'custom':''}">${savedCount?savedCount+' saved':setCount+' set'}</div>
      </div>
      <div class="gymTargetBox ${target.level}"><b>Next Target</b>${gymSafe(target.text)}</div>
      <div class="gymCoachBox">
        <label><small>RPE</small><select class="gymRpe"><option value="">Seç</option>${[5,6,7,8,9,10].map(v=>`<option value="${v}" ${String(coach.rpe)===String(v)?'selected':''}>${v}</option>`).join('')}</select></label>
        <label><small>Form</small><select class="gymForm"><option value="" ${!coach.form?'selected':''}>Seç</option><option value="Good" ${coach.form==='Good'?'selected':''}>Good</option><option value="Okay" ${coach.form==='Okay'?'selected':''}>Okay</option><option value="Bad" ${coach.form==='Bad'?'selected':''}>Bad</option></select></label>
        <label><small>Pain</small><select class="gymPain"><option value="None" ${coach.pain==='None'?'selected':''}>None</option><option value="Mild" ${coach.pain==='Mild'?'selected':''}>Mild</option><option value="Warning" ${coach.pain==='Warning'?'selected':''}>Warning</option></select></label>
      </div>
      <div class="gymSetList">${rowHtml}</div>
      <div class="gymCardActions">
        <button class="gymMiniBtn" onclick='addGymSet(${arg})'>+ Set</button>
        <button class="gymMiniBtn primary" onclick='saveGymExercise(${arg})'>Save</button>
        <button class="gymMiniBtn" onclick='toggleGymHistory(${arg})'>History</button>
        <button class="gymMiniBtn" onclick='clearGymExercise(${arg})'>Clear</button>
        ${item.custom?`<button class="gymMiniBtn" onclick='deleteGymExercise(${arg})'>Delete</button>`:''}
      </div>
      <div class="gymHistoryPanel"></div>
    </div>`;
  }).join('');
}


function clampNum(v,min,max){return Math.max(min,Math.min(max,v));}
function durationMinutes(v){
  if(!v) return 0;
  let parts=String(v).trim().split(':').map(Number);
  if(parts.some(isNaN)) return Number(v)||0;
  if(parts.length===3) return parts[0]*60+parts[1]+parts[2]/60;
  if(parts.length===2) return parts[0]+parts[1]/60;
  return parts[0]||0;
}
function normalizeActivityType(rec){
  let raw=String(rec.activityType||rec.activity||rec.workoutType||rec.type||'').toLowerCase();
  if((raw.includes('sea')||raw.includes('deniz')||raw.includes('open water')||raw.includes('açık su')||raw.includes('acik su')) && (raw.includes('swim')||raw.includes('yüz')||raw.includes('yuz')||raw.includes('suda'))) return 'Sea Swimming';
  if(raw.includes('swim')||raw.includes('yüz')||raw.includes('yuz')) return 'Swimming';
  if(raw.includes('table tennis')||raw.includes('masa tenisi')) return 'Table Tennis';
  if(raw.includes('football')||raw.includes('soccer')||raw.includes('futbol')) return 'Football';
  if(raw.includes('beach volleyball')||raw.includes('plaj voleybol')) return 'Beach Volleyball';
  if(raw.includes('volleyball')||raw.includes('voleybol')) return 'Volleyball';
  if(raw.includes('walk')||raw.includes('yürü')||raw.includes('yuru')) return 'Walk';
  if(raw.includes('run')||raw.includes('koş')||raw.includes('kos')) return 'Run';
  if(raw.includes('cycle')||raw.includes('bike')||raw.includes('bisiklet')) return 'Cycling';
  if(raw.includes('fitness')||raw.includes('strength')||raw.includes('gym')||raw.includes('fonksiyonel')||raw.includes('ağırlık')||raw.includes('agirlik')) return 'Fitness';
  return rec.activityType||'Other';
}
function normalizeWatchRecord(rec){
  rec.type=rec.type||'Apple Watch Workout';
  rec.activityType=normalizeActivityType(rec);
  rec.duration=rec.duration||'';
  rec.activeCal=Number(rec.activeCal)||0;
  rec.totalCal=Number(rec.totalCal)||0;
  rec.avgHR=Number(rec.avgHR)||0;
  rec.maxHR=Number(rec.maxHR)||0;
  rec.rpe=rec.rpe||'';
  rec.notes=rec.notes||'';
  return rec;
}
function watchRowsForDate(date){
  return (DATA.appleWatch||[]).filter(r=>r.date===date).map(normalizeWatchRecord);
}
function activityEmoji(type){
  let t=String(type||'').toLowerCase();
  if(t.includes('sea')||t.includes('swim')||t.includes('yüz')||t.includes('yuz')) return '🌊';
  if(t.includes('table tennis')||t.includes('masa')) return '🏓';
  if(t.includes('football')||t.includes('soccer')||t.includes('futbol')) return '⚽';
  if(t.includes('volleyball')||t.includes('voleybol')) return '🏐';
  if(t.includes('walk')||t.includes('yürü')||t.includes('yuru')) return '🚶';
  if(t.includes('run')||t.includes('koş')||t.includes('kos')) return '🏃';
  if(t.includes('cycl')||t.includes('bike')||t.includes('bisiklet')) return '🚴';
  if(t.includes('fitness')||t.includes('gym')||t.includes('strength')) return '🏋️';
  return '⌚';
}
function activityDisplayName(type){
  let t=String(type||'Other');
  const map={
    'Sea Swimming':'Sea Swimming',
    'Swimming':'Swimming',
    'Table Tennis':'Table Tennis',
    'Football':'Football',
    'Beach Volleyball':'Beach Volleyball',
    'Volleyball':'Volleyball',
    'Walk':'Walk',
    'Run':'Run',
    'Cycling':'Cycling',
    'Fitness':'Fitness',
    'Other':'Other Activity'
  };
  return map[t]||t;
}
function formatDistance(v){
  let n=Number(v)||0;
  if(!n) return '';
  if(n>=1000) return (Math.round((n/1000)*10)/10).toLocaleString('tr-TR')+' km';
  return Math.round(n).toLocaleString('tr-TR')+' m';
}
function sumDurations(rows){
  let mins=rows.reduce((a,r)=>a+durationMinutes(r.duration),0);
  let totalSeconds=Math.round(mins*60);
  let h=Math.floor(totalSeconds/3600);
  let m=Math.floor((totalSeconds%3600)/60);
  let s=totalSeconds%60;
  if(h>0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function weightedAvgHR(rows){
  let weighted=0,total=0;
  rows.forEach(r=>{let hr=Number(r.avgHR)||0;let mins=durationMinutes(r.duration);if(hr&&mins){weighted+=hr*mins;total+=mins;}});
  return total?Math.round(weighted/total):0;
}
function activitySummaryForDate(date){
  let rows=watchRowsForDate(date);
  if(!rows.length) return null;
  let types=[...new Set(rows.map(r=>normalizeActivityType(r)))];
  let primary=types.length===1?types[0]:'Mixed Activity';
  let emoji=types.length===1?activityEmoji(primary):'⚡';
  let duration=sumDurations(rows);
  let active=rows.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
  let total=rows.reduce((a,r)=>a+(Number(r.totalCal)||0),0);
  let distance=rows.reduce((a,r)=>a+(Number(r.distance)||0),0);
  let avgHR=weightedAvgHR(rows);
  let maxHR=Math.max(0,...rows.map(r=>Number(r.maxHR)||0));
  let rpes=rows.map(r=>Number(r.rpe)||0).filter(Boolean);
  let rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
  let name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
  let dist=formatDistance(distance);
  let shortBits=[duration, dist, active?active+' kcal':''].filter(Boolean);
  return {rows, types, primary, name, emoji, duration, active, total, distance, dist, avgHR, maxHR, rpe, shortLabel:shortBits.join(' · '), fullLabel:`${name} · ${shortBits.join(' · ')}`};
}
function activitySummaryFromRows(date, rows){
  rows=(rows||[]).map(normalizeWatchRecord);
  if(!rows.length) return null;
  let types=[...new Set(rows.map(r=>normalizeActivityType(r)))];
  let primary=types.length===1?types[0]:'Mixed Activity';
  let emoji=types.length===1?activityEmoji(primary):'⚡';
  let duration=sumDurations(rows);
  let active=rows.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
  let total=rows.reduce((a,r)=>a+(Number(r.totalCal)||0),0);
  let distance=rows.reduce((a,r)=>a+(Number(r.distance)||0),0);
  let avgHR=weightedAvgHR(rows);
  let maxHR=Math.max(0,...rows.map(r=>Number(r.maxHR)||0));
  let rpes=rows.map(r=>Number(r.rpe)||0).filter(Boolean);
  let rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
  let name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
  let dist=formatDistance(distance);
  return {rows, types, primary, name, emoji, duration, active, total, distance, dist, avgHR, maxHR, rpe};
}
function renderSingleActivityCard(date, a){
  let stats=[
    ['Süre',a.duration||'-'],
    ['Aktif kcal',a.active?a.active+' kcal':'-'],
    ['Toplam kcal',a.total?a.total+' kcal':'-'],
    ['Mesafe',a.dist||'-'],
    ['Ort. nabız',a.avgHR?a.avgHR+' v/dk':'-'],
    ['Maks nabız',a.maxHR?a.maxHR+' v/dk':'-'],
    ['RPE',a.rpe||'-']
  ];
  if(a.rows.length>1) stats.push(['Kayıt',a.rows.length+' segment']);
  return `<div class="activitySessionCard">
    <div class="activitySessionTop">
      <div class="activitySessionTitle">
        <div class="activityIcon">${a.emoji}</div>
        <div><small>ACTIVITY SESSION</small><b>${escapeAttr(a.name)}</b><span>${trDate(date)} · Workout Logger aktivitesi</span></div>
      </div>
      <div class="activityTopActions">
        <div class="activityPill">${a.rows.length>1?'Combined':'Apple Watch'} Load</div>
        <button class="activityDeleteBtn" onclick='deleteActivityCard(${JSON.stringify(date)},${JSON.stringify(a.primary||"Other")})'>Sil</button>
      </div>
    </div>
    <div class="activityStatsGrid">${stats.map(([k,v])=>`<div class="activityStatBox"><small>${k}</small><b>${escapeAttr(v)}</b></div>`).join('')}</div>
  </div>`;
}
function renderActivitySessionCard(date){
  let rows=watchRowsForDate(date);
  if(!rows.length) return '';
  let grouped={};
  rows.forEach(r=>{
    let key=normalizeActivityType(r)||'Other';
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(r);
  });
  return Object.entries(grouped).map(([type,typeRows])=>renderSingleActivityCard(date, activitySummaryFromRows(date,typeRows))).join('');
}
function deleteActivityCard(date,type){
  let label=activityDisplayName(type||'Other');
  let niceDate=(typeof trDate==='function')?trDate(date):date;
  if(!confirm(`${label} aktivitesini ${niceDate} tarihinden silmek istediğine emin misin?\n\nBu işlem sadece bu aktivite türünün o güne ait Apple Watch kayıtlarını kaldırır.`)) return;
  if(!DATA.appleWatch) DATA.appleWatch=[];
  let before=DATA.appleWatch.length;
  DATA.appleWatch=DATA.appleWatch.filter(r=>!(r.date===date && normalizeActivityType(r)===type));
  let removed=before-DATA.appleWatch.length;
  if(typeof setImportSummary==='function'){
    try{ setImportSummary(`<b>Activity silindi.</b><br><span class="sumPill">${activityDisplayName(type)}</span><span class="sumPill">${trDate(date)}</span><span class="sumPill">${removed} kayıt</span>`); }catch(e){}
  }
  save();
}
function dayCoachStats(date){
  let rows=dayData(date);
  let rpes=rows.map(r=>Number(r.rpe)).filter(Boolean);
  let avgRpe=rpes.length?Math.round((rpes.reduce((a,b)=>a+b,0)/rpes.length)*10)/10:0;
  let painWarning=rows.some(r=>String(r.pain||'').toLowerCase()==='warning');
  let painMild=rows.some(r=>String(r.pain||'').toLowerCase()==='mild');
  let badForm=rows.some(r=>String(r.form||'').toLowerCase()==='bad');
  return {rows, avgRpe, painWarning, painMild, badForm};
}
function activityLoadForDate(date){
  let watch=watchRowsForDate(date);
  let active=watch.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
  let total=watch.reduce((a,r)=>a+(Number(r.totalCal)||0),0);
  let minutes=watch.reduce((a,r)=>a+durationMinutes(r.duration),0);
  let hrs=watch.map(r=>Number(r.avgHR)||0).filter(Boolean);
  let maxHrs=watch.map(r=>Number(r.maxHR)||0).filter(Boolean);
  let avgHR=hrs.length?Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length):0;
  let maxHR=maxHrs.length?Math.max(...maxHrs):0;
  let types=[...new Set(watch.map(r=>normalizeActivityType(r)))];
  let gym=calc(dayData(date));
  let coach=dayCoachStats(date);
  let loadScore=active + (minutes*2) + Math.max(0,avgHR-95)*2 + gym.sets*7 + (coach.avgRpe?coach.avgRpe*8:0);
  let level=loadScore>=620?'High':loadScore>=320?'Moderate':(loadScore>0?'Low':'None');
  return {watch,active,total,minutes,avgHR,maxHR,types,gym,coach,loadScore,level};
}
function calculateReadiness(date){
  let today=activityLoadForDate(date);
  let prev=activityLoadForDate(addDays(date,-1));
  let score=82;
  let reasons=[];
  if(today.active>400){score-=12;reasons.push('bugünkü aktif kalori yüksek');}
  else if(today.active>250){score-=7;reasons.push('bugünkü aktivite yükü orta-üst');}
  if(today.avgHR>145){score-=10;reasons.push('ortalama nabız yüksek');}
  else if(today.avgHR>130){score-=5;reasons.push('ortalama nabız orta-üst');}
  if(today.maxHR>170){score-=8;reasons.push('maks nabız yüksek');}
  if(today.gym.sets>24){score-=8;reasons.push('gym set hacmi yüksek');}
  else if(today.gym.sets>18){score-=4;reasons.push('gym set hacmi orta-üst');}
  if(today.coach.avgRpe>=9){score-=12;reasons.push('RPE çok yüksek');}
  else if(today.coach.avgRpe>=8){score-=6;reasons.push('RPE yüksek');}
  if(today.coach.painWarning){score-=18;reasons.push('pain warning işaretlendi');}
  else if(today.coach.painMild){score-=8;reasons.push('hafif ağrı işaretlendi');}
  if(today.coach.badForm){score-=10;reasons.push('form kötü işaretlendi');}
  if(prev.loadScore>620){score-=8;reasons.push('dünkü toplam yük yüksek');}
  score=Math.round(clampNum(score,20,100));
  let status=score>=80?'Ready':score>=65?'Controlled':score>=50?'Caution':'Recovery';
  let advice='Bugün plan uygulanabilir. Ana hedef temiz form ve kontrollü progression.';
  if(status==='Controlled') advice='Bugün kontrollü yüklen. Failure yerine 1-2 tekrar rezerv bırak.';
  if(status==='Caution') advice='Bugün yük artırma. Teknik, tempo ve eklem güvenliğini önceliklendir.';
  if(status==='Recovery') advice='Bugün ağır yüklenme önerilmez. Recovery, yüzme/yürüyüş veya düşük yoğunluk daha mantıklı.';
  if(today.types.includes('Swimming') && !today.gym.sets) advice='Yüzme yükü kaydedildi. Bugünü kondisyon/recovery olarak say; üst gövde yorgunluğunu takip et.';
  return {score,status,advice,reasons,today,prev};
}
function renderReadinessHtml(date){
  let r=calculateReadiness(date);
  let t=r.today;
  let typeText=t.types.length?t.types.join(' + '):'No watch activity';
  let reasonText=r.reasons.length?r.reasons.slice(0,3).join(', '):'olumsuz sinyal yok';
  let bg=`conic-gradient(#23ce7a 0 ${r.score}%, #172033 ${r.score}% 100%)`;
  return `<div class="readinessScoreBox"><div class="readinessCircle" style="background:${bg}">${r.score}</div><div class="readinessMeta"><b>${r.status}</b><br>${r.advice}<div class="readinessPills"><span class="readinessPill activityTag">${typeText}</span><span class="readinessPill">Load: ${t.level}</span><span class="readinessPill">${Math.round(t.minutes)} dk</span><span class="readinessPill">${t.active} aktif kcal</span><span class="readinessPill">${t.avgHR||'-'} bpm</span></div><div class="activityLoadCard"><b>Etkenler:</b> ${reasonText}</div></div></div>`;
}
function renderReadinessPanel(){
  let el=document.getElementById('readinessPanel');
  if(!el) return;
  let has=dayData(selectedDate).length || watchRowsForDate(selectedDate).length;
  if(!has){el.innerHTML='Bu gün için gym veya Apple Watch aktivite verisi yok.';return;}
  el.innerHTML=renderReadinessHtml(selectedDate);
}


function calculateInjuryRisk(date){
  let readiness=calculateReadiness(date);
  let today=activityLoadForDate(date);
  let prev=activityLoadForDate(addDays(date,-1));
  let prev2=activityLoadForDate(addDays(date,-2));
  let coach=today.coach;
  let score=0;
  let signals=[];

  if(coach.painWarning){score+=36;signals.push('Pain Warning işaretlendi');}
  else if(coach.painMild){score+=18;signals.push('Hafif ağrı işaretlendi');}
  if(coach.badForm){score+=18;signals.push('Form Bad işaretlendi');}
  if(coach.avgRpe>=9){score+=24;signals.push('Ortalama RPE 9+');}
  else if(coach.avgRpe>=8){score+=14;signals.push('Ortalama RPE 8+');}
  if(today.gym.sets>24){score+=14;signals.push('Bugünkü gym set hacmi yüksek');}
  else if(today.gym.sets>18){score+=7;signals.push('Bugünkü gym set hacmi orta-üst');}
  if(today.active>420){score+=10;signals.push('Aktif kalori yüksek');}
  else if(today.active>280){score+=5;signals.push('Aktif kalori orta-üst');}
  if(today.avgHR>145 || today.maxHR>172){score+=8;signals.push('Nabız yükü yüksek');}
  if(prev.loadScore>620){score+=10;signals.push('Dünkü toplam yük yüksek');}
  if(prev.loadScore>420 && prev2.loadScore>420){score+=10;signals.push('Son iki günde yük birikimi var');}
  if(readiness.score<50){score+=18;signals.push('Readiness Recovery seviyesinde');}
  else if(readiness.score<65){score+=10;signals.push('Readiness Caution seviyesinde');}

  score=Math.round(clampNum(score,0,100));
  let level='Low';
  if(score>=70) level='High';
  else if(score>=40) level='Moderate';
  let deload='Deload gerekmez. Temiz form ve kontrollü progression yeterli.';
  if(level==='Moderate') deload='Bugün yük artırma. Failure yerine 1-2 tekrar rezerv bırak; ağrı olan hareketlerde set azalt.';
  if(level==='High') deload='Deload / koruma önerilir: ana hareketlerde yük artırma, setleri yaklaşık %20-30 azalt, ağrı varsa pressing veya çekiş varyasyonunu değiştir.';
  if(coach.painWarning) deload='Pain Warning var: ağrılı hareketi zorlamadan değiştir veya çıkar. Bugün hedef performans değil, eklem güvenliği.';
  if(!today.gym.sets && today.watch.length){
    if(level==='Low') deload='Gym yok; aktivite recovery/kondisyon olarak kaydedildi. Yorgunluk belirtisi yoksa sonraki gym günü normal başlayabilir.';
    else deload+=' Gym yapılmasa bile aktivite yükünü toparlanma hesabına dahil et.';
  }
  if(!today.gym.sets && !today.watch.length){
    deload='Bu gün için veri yok. Risk hesabı için RPE/Form/Pain veya Apple Watch aktivitesi girilmeli.';
  }
  return {score,level,signals,deload,readiness,today,prev,prev2};
}
function renderInjuryRiskHtml(date){
  let r=calculateInjuryRisk(date);
  let cls=r.level==='High'?'high':(r.level==='Moderate'?'moderate':(r.readiness.status==='Recovery'?'recovery':''));
  let signalText=r.signals.length?r.signals.slice(0,4).join(', '):'belirgin risk sinyali yok';
  let pills=[
    `<span class="injuryRiskPill ${r.level==='High'?'danger':(r.level==='Moderate'?'warn':'')}">Risk: ${r.level}</span>`,
    `<span class="injuryRiskPill">Readiness ${r.readiness.score}/100</span>`,
    `<span class="injuryRiskPill">RPE ${r.today.coach.avgRpe||'-'}</span>`,
    `<span class="injuryRiskPill">${r.today.gym.sets} gym set</span>`,
    `<span class="injuryRiskPill">${r.today.level} load</span>`
  ].join('');
  return `<div class="injuryRiskBox"><div class="injuryRiskBadge ${cls}">${r.level}<br>${r.score}/100</div><div class="injuryRiskMeta"><b>Koruma kararı:</b> ${r.deload}<div class="injuryRiskPills">${pills}</div><div class="deloadBox"><b>Risk sinyalleri:</b> ${signalText}</div></div></div>`;
}
function renderInjuryRiskPanel(){
  let el=document.getElementById('injuryRiskPanel');
  if(!el) return;
  let card=el.closest('.injuryRiskCard');
  if(card) card.classList.remove('riskLow','riskModerate','riskHigh');
  let has=dayData(selectedDate).length || watchRowsForDate(selectedDate).length;
  if(!has){el.innerHTML='Bu gün için risk hesabı yapılacak veri yok.';return;}
  let risk=calculateInjuryRisk(selectedDate);
  if(card){
    card.classList.add(risk.level==='High'?'riskHigh':(risk.level==='Moderate'?'riskModerate':'riskLow'));
  }
  el.innerHTML=renderInjuryRiskHtml(selectedDate);
}


function renderDailyReport(){
let dates=[...new Set([...(DATA.workouts||[]).map(w=>w.date),...(DATA.appleWatch||[]).map(w=>w.date)])].filter(Boolean).sort((a,b)=>parseDate(b)-parseDate(a));
if(!dates.length){
  dailyReport.innerHTML='<div class="card"><h2>Daily Summary</h2><div class="reportText">Henüz antrenman veya aktivite verisi yok.</div></div>';
  return;
}
let cards=[];
dates.forEach(date=>{
  let items=dayData(date), c=calc(items);
  let activity=activitySummaryForDate(date);
  let readiness=calculateReadiness(date);
  let hasGym=items.length>0;
  let hasActivity=!!activity;
  if(hasGym){
    let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let best=items.slice().sort((a,b)=>b.weight-a.weight)[0];
    let exCount=Object.keys(c.exs).length;
    let exMini=Object.keys(c.exs).map(ex=>`<em>${ex}</em>`).join('');
    let activityLine=hasActivity?`<span>Extra Activity: ${activity.emoji} ${escapeAttr(activity.name)} • ${activity.duration||'-'} • ${activity.active||0} kcal</span>`:'';
    cards.push(`<div class="dailyMiniCard dailyGymCard" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()">
      <div class="dailyMiniTop">
        <div>
          <b>${trDate(date)}</b>
          <span>${items[0]?.day||dayName(date)} · Gym Training</span>
        </div>
        <strong>${c.sets} set</strong>
      </div>
      <div class="dailyMiniReadiness"><span>Readiness ${readiness.score}/100</span><span>${readiness.status}</span></div>
      <div class="dailyMiniStats">
        <span>${c.reps} reps</span>
        <span>${Math.round(c.vol).toLocaleString('tr-TR')} kg</span>
        <span>${exCount} exercises</span>
        <span>${topPart[0]}</span>
      </div>
      <div class="dailyMiniExercises">${exMini}</div>
      <div class="dailyMiniFooter">
        <span>Best: ${best?best.exercise+' '+best.weight+'kg':'-'}</span>
        ${activityLine}
      </div>
    </div>`);
  }
  if(hasActivity && !hasGym){
    let loadLabel=activity.active>=450?'High Load':(activity.active>=220?'Moderate Load':'Light Load');
    let activityRole=(String(activity.primary||'').toLowerCase().includes('walk')||String(activity.primary||'').toLowerCase().includes('mobility')||String(activity.primary||'').toLowerCase().includes('yoga'))?'Recovery / Movement':'Conditioning / Activity Load';
    let segmentText=activity.rows.length>1?` • ${activity.rows.length} kayıt`:'';
    cards.push(`<div class="dailyMiniCard dailyActivityCard" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()">
      <div class="dailyMiniTop">
        <div>
          <b>${trDate(date)}</b>
          <span>${dayName(date)} · Activity Day</span>
        </div>
        <strong>${loadLabel}</strong>
      </div>
      <div class="dailyActivityTypeLine">
        <div class="emoji">${activity.emoji}</div>
        <div><b>${escapeAttr(activity.name)}</b><span>${activityRole}${segmentText}</span></div>
      </div>
      <div class="dailyMiniStats">
        <span>${activity.duration||'-'}</span>
        <span>${activity.active?activity.active+' kcal':'-'}</span>
        <span>${activity.dist||'-'}</span>
        <span>${activity.avgHR?activity.avgHR+' bpm':'-'}</span>
      </div>
      <div class="dailyActivityNote">Gym hacmine eklenmez; readiness, recovery ve günlük fiziksel yük hesabına dahil edilir.</div>
    </div>`);
  }
});
dailyReport.innerHTML=`<div class="dailyMiniGrid">`+cards.join('')+`</div>`;
}
function renderWeeklyReport(){
  let items=weekDates().flatMap(d=>dayData(d)), c=calc(items);
  let completed=weekDates().filter(d=>dayData(d).length).length;
  let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0];
  let maxDay=Math.max(1,...weekDates().map(d=>calc(dayData(d)).sets));
  let days=weekDates().map(d=>{
    let cc=calc(dayData(d));
    let pct=Math.min(100,Math.round((cc.sets/maxDay)*100));
    let label=program.find(p=>p[0]===dayName(d))?.[1]||dayName(d);
    label=getProgramType(dayName(d))||label;
    return `<div class="weeklyDayItem"><b>${trDate(d)}</b><div class="weeklyDayBar"><div class="weeklyDayFill" style="width:${pct}%"></div></div><span>${cc.sets} set • ${Math.round(cc.vol).toLocaleString('tr-TR')} kg • ${label}</span></div>`;
  }).join('');
  let avgSets=completed?Math.round(c.sets/completed):0;
  let verdict=c.sets===0?'Veri bekleniyor.':(c.sets<14?'Hafif hafta. Toparlanma veya giriş haftası gibi duruyor.':(c.sets<=28?'Dengeli ve yönetilebilir bir hafta.':'Yüksek hacimli hafta. Recovery ve ağrı sinyallerini takip et.'));
  weeklyReport.innerHTML=`<div class="weeklyPremiumGrid">
    <div class="weeklyPremiumCard">
      <div class="weeklyPremiumHead"><div><small>Weekly Load</small><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div><div class="weeklyPremiumPill">${completed}/7 gün</div></div>
      <div class="weeklyMetricGrid">
        <div class="weeklyMetricBox"><small>Set</small><b>${c.sets}</b></div>
        <div class="weeklyMetricBox"><small>Tekrar</small><b>${c.reps}</b></div>
        <div class="weeklyMetricBox"><small>Hacim</small><b>${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div>
      </div>
      <div class="weeklyInsight"><b>Odak:</b> ${topPart[0]} (${topPart[1]} set). <b>Ortalama:</b> ${avgSets} set/gün. ${verdict}</div>
    </div>
    <div class="weeklyPremiumCard">
      <div class="weeklyPremiumHead"><div><small>Day Distribution</small><b>Gün Gün Dağılım</b></div><div class="weeklyPremiumPill">${topPart[0]}</div></div>
      <div class="weeklyDayList">${days}</div>
    </div>
  </div>`;
}

function importWorkoutJson(){
try{
  let parsed=JSON.parse(workoutJsonBox.value);
  let arr=Array.isArray(parsed)?parsed:(parsed.workouts||[]);
  if(!arr.length){alert('Workout verisi bulunamadı. Format {"workouts":[...]} olmalı.');return;}
  arr.forEach(w=>{
    if(!w.date){throw new Error('date eksik');}
    if(!w.day) w.day=dayName(w.date);
    if(!w.bodyPart) w.bodyPart=part(w.exercise);
    w.sets=Number(w.sets)||1;
    w.reps=Number(w.reps)||0;
    w.weight=Number(String(w.weight).replace(',','.'))||0;
    w.notes=w.notes||'';
    DATA.workouts.push(w);
  });
  selectedDate=arr[0].date;
  weekStart=mondayOf(selectedDate);
  workoutJsonBox.value='';
  save();
}catch(e){
  alert('Workout JSON okunamadı. date / exercise / reps / weight alanlarını kontrol et.');
}
}

function importWatchJson(){
try{
  let rec=JSON.parse(watchJsonBox.value);
  if(!rec.date){alert('Bu JSON içinde date alanı yok. Hangi güne ait olduğunu bilmem için date gerekli.');return;}
  rec=normalizeWatchRecord(rec);
  DATA.appleWatch.push(rec);
  watchJsonBox.value='';
  selectedDate=rec.date;
  let d=parseDate(rec.date); let dow=d.getDay(); if(dow>=1 && dow<=7){ weekStart=addDays(rec.date, -(dow===0?6:dow-1)); }
  save();
}catch(e){
  alert('JSON okunamadı. Formatı kontrol et.');
}
}
function renderWatchPanel(){
if(!DATA.appleWatch) DATA.appleWatch=[];
if(!DATA.dailyNotes) DATA.dailyNotes=[];
if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
let rows=DATA.appleWatch.filter(r=>r.date===selectedDate);
let empty=document.getElementById('watchPanelEmpty');
let box=document.getElementById('watchPanelData');
if(!empty||!box) return;
if(!rows.length){
  empty.style.display='block';
  box.classList.remove('active');
  return;
}
empty.style.display='none';
box.classList.add('active');
let latest=rows[rows.length-1];
let active=rows.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
let total=rows.reduce((a,r)=>a+(Number(r.totalCal)||0),0);
let hrs=rows.map(r=>Number(r.avgHR)||0).filter(Boolean);
let avg=hrs.length?Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length):'-';
wlWatchDuration.textContent=latest.duration||'-';
wlWatchActive.textContent=active+' kcal';
wlWatchTotal.textContent=total+' kcal';
wlWatchHR.textContent=avg==='-'?'-':avg+' bpm';
if(document.getElementById('wlWatchMaxHR')){
  wlWatchMaxHR.textContent=(latest.maxHR||'-')==='-'?'-':latest.maxHR+' bpm';
}
}

function workoutVolume(rows){return rows.reduce((a,w)=>a+(Number(w.weight)||0)*(Number(w.reps)||0)*(Number(w.sets)||1),0)}
function exerciseDateGroups(ex){
  let groups={};
  DATA.workouts.filter(w=>w.exercise===ex).forEach(w=>{
    if(!groups[w.date]) groups[w.date]=[];
    groups[w.date].push(w);
  });
  return Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,rows])=>({date,rows}));
}
function calculatePRBoard(){
  let exercises=[...new Set(DATA.workouts.map(w=>w.exercise).filter(Boolean))].sort();
  let board=[]; let events=[];
  exercises.forEach(ex=>{
    let rows=DATA.workouts.filter(w=>w.exercise===ex).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    let bestWeight={value:0,reps:0,date:'-'};
    let bestReps={value:0,weight:0,date:'-'};
    rows.forEach(w=>{
      let weight=Number(w.weight)||0, reps=Number(w.reps)||0;
      if(weight>bestWeight.value){
        if(bestWeight.value>0) events.push({date:w.date,type:'Weight PR',exercise:ex,text:`${weight} kg x ${reps}`,score:weight});
        bestWeight={value:weight,reps,date:w.date};
      }
      if(reps>bestReps.value){
        if(bestReps.value>0) events.push({date:w.date,type:'Rep PR',exercise:ex,text:`${weight} kg x ${reps}`,score:reps});
        bestReps={value:reps,weight,date:w.date};
      }
    });
    let bestVol={value:0,date:'-',sets:0};
    exerciseDateGroups(ex).forEach(g=>{
      let vol=workoutVolume(g.rows);
      if(vol>bestVol.value){
        if(bestVol.value>0) events.push({date:g.date,type:'Volume PR',exercise:ex,text:`${Math.round(vol).toLocaleString('tr-TR')} kg`,score:vol});
        bestVol={value:vol,date:g.date,sets:g.rows.length};
      }
    });
    let lastEvent=events.filter(e=>e.exercise===ex).sort((a,b)=>b.date.localeCompare(a.date))[0];
    board.push({exercise:ex,bestWeight,bestReps,bestVol,lastEvent});
  });
  events.sort((a,b)=>b.date.localeCompare(a.date));
  return {board,events};
}
function renderProgressMotivation(){
  let el=document.getElementById('progressMotivation');
  if(!el) return;
  let {events}=calculatePRBoard();
  let dates=weekDates();
  let weekEvents=events.filter(e=>dates.includes(e.date));
  if(weekEvents.length){
    let top=weekEvents.slice(0,3).map(e=>`<div><span class="highlight">${e.type}</span> • <b>${e.exercise}</b><br><small>${e.text} • ${trDate(e.date)}</small></div>`).join('');
    el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Gelişim sinyali var.</b><span>Bu hafta ${weekEvents.length} PR/gelişim yakalandı. Risk düşük/orta kaldığı sürece kontrollü progression devam edebilir.</span></div><div class="progressPremiumScore">${weekEvents.length} PR</div></div><div class="progressPremiumList">${top}</div></div>`;
  }else if(events.length){
    let last=events[0];
    el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Bu hafta sakin ilerleme.</b><span>Yeni PR yok; bu kötü değil. Form, ağrı kontrolü ve düzenli veri daha önemli.</span></div><div class="progressPremiumScore">STABLE</div></div><div class="progressPremiumList"><div>Son PR: <b>${last.exercise}</b><br><small>${last.type} • ${last.text} • ${trDate(last.date)}</small></div></div></div>`;
  }else{
    el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Veri birikiyor.</b><span>Aynı hareketlerde birkaç seans oluştuktan sonra PR takibi anlamlı hale gelecek.</span></div><div class="progressPremiumScore">BUILD</div></div></div>`;
  }
}
function renderReports(){
  let vols={},best={},totals={sets:0,reps:0,volume:0};
  (DATA.workouts||[]).forEach(w=>{
    let bp=w.bodyPart||part(w.exercise);
    let sets=Number(w.sets)||1;
    let reps=Number(w.reps)||0;
    let weight=Number(w.weight)||0;
    vols[bp]=(vols[bp]||0)+sets;
    totals.sets+=sets;
    totals.reps+=reps*sets;
    totals.volume+=weight*reps*sets;
    let score=weight;
    if(!best[w.exercise] || score>Number(best[w.exercise].weight||0) || (score===Number(best[w.exercise].weight||0) && reps>Number(best[w.exercise].reps||0))){
      best[w.exercise]={weight:weight,reps:reps,date:w.date,bodyPart:bp,volume:weight*reps*sets};
    }
  });
  let volumeEntries=Object.entries(vols).sort((a,b)=>b[1]-a[1]);
  let topPart=volumeEntries[0]||['Veri yok',0];
  let bestEntries=Object.entries(best).sort((a,b)=>Number(b[1].weight)-Number(a[1].weight));
  let latestDate=(DATA.workouts||[]).map(w=>w.date).sort().pop()||'-';

  let hero=document.getElementById('analyticsHero');
  if(hero){
    hero.innerHTML=`
      <div class="analyticsHeroCard"><small>Training Load</small><b>${Math.round(totals.volume).toLocaleString('tr-TR')} kg</b><span>Toplam hacim • ${totals.sets} set / ${totals.reps} tekrar</span></div>
      <div class="analyticsHeroCard"><small>Top Focus</small><b>${topPart[0]}</b><span>${topPart[1]} set ile en yoğun bölge</span></div>
      <div class="analyticsHeroCard"><small>Latest Log</small><b>${latestDate==='-'?'-':trDate(latestDate)}</b><span>${bestEntries.length} hareket için best set kaydı</span></div>`;
  }

  let maxVol=volumeEntries.length?Math.max(...volumeEntries.map(x=>x[1])):1;
  volumeCards.innerHTML=volumeEntries.slice(0,8).map(([k,v])=>{
    let pct=Math.max(8,Math.round((v/maxVol)*100));
    return `<div class="volumeMiniCard"><div class="volumeMiniTop"><b>${k}</b><span>${v} set</span></div><div><div class="volumeBarTrack"><div class="volumeBarFill" style="width:${pct}%"></div></div><div class="volumeMiniMeta"><span>Haftalık/kümülatif yük</span><span>${pct}%</span></div></div></div>`;
  }).join('') || `<div class="volumeMiniCard"><div class="volumeMiniTop"><b>Veri bekleniyor</b><span>0 set</span></div><div class="volumeMiniMeta"><span>Antrenman girildiğinde hacim özeti oluşacak.</span></div></div>`;

  let pill=document.getElementById('bestWeightsPill');
  if(pill) pill.textContent=`${bestEntries.length} hareket`;
  let topBest=bestEntries.slice(0,12);
  bestRows.innerHTML=topBest.map(([ex,b])=>`
    <div class="bestWeightItem">
      <div class="bestWeightItemTop"><b>${ex}</b><span>${b.weight} kg</span></div>
      <div class="bestWeightMeta">
        <div><small>Reps</small><strong>${b.reps}</strong></div>
        <div><small>Part</small><strong>${b.bodyPart||'-'}</strong></div>
        <div><small>Date</small><strong>${b.date?trDate(b.date):'-'}</strong></div>
      </div>
    </div>`).join('') || `<div class="bestWeightItem"><div class="bestWeightItemTop"><b>Veri bekleniyor</b><span>-</span></div><div class="bestWeightMeta"><div><small>Reps</small><strong>-</strong></div><div><small>Part</small><strong>-</strong></div><div><small>Date</small><strong>-</strong></div></div></div>`;
  renderProgressMotivation();
}

function dayName(date){
  let d=parseDate(date).getDay();
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];
}
function normalizeWorkoutRow(w){
  if(!w.date) throw new Error('date eksik');
  if(!w.day) w.day=dayName(w.date);
  if(!w.exercise) w.exercise='Exercise';
  if(!w.bodyPart) w.bodyPart=part(w.exercise);
  w.sets=Number(w.sets)||1;
  w.reps=Number(w.reps)||0;
  w.weight=Number(String(w.weight||0).replace(',','.'))||0;
  w.notes=w.notes||'';
  return w;
}
function importWorkoutArray(arr){
  if(!Array.isArray(arr)||!arr.length) throw new Error('workout array boş');
  arr.forEach(w=>DATA.workouts.push(normalizeWorkoutRow(w)));
  selectedDate=arr[0].date;
  weekStart=mondayOf(selectedDate);
}
function importAppleWatch(rec){
  if(!rec.date) throw new Error('apple_watch date eksik');
  rec=normalizeWatchRecord(rec);
  DATA.appleWatch.push(rec);
  selectedDate=rec.date;
  weekStart=mondayOf(selectedDate);
}
function universalImport(){
try{
  let raw=universalJsonBox.value.trim();
  if(!raw){alert('JSON kutusu boş.');return;}
  let parsed=JSON.parse(raw);
  let kind=parsed.type||parsed.kind||'';
  if(Array.isArray(parsed)){
    importWorkoutArray(parsed);
  }else if(kind==='workout' || parsed.workouts){
    importWorkoutArray(parsed.workouts||[]);
  }else if(kind==='apple_watch' || kind==='watch' || parsed.avgHR || parsed.activeCal){
    importAppleWatch(parsed);
  }else if(kind==='daily' || parsed.coachNote || parsed.readiness || parsed.energy){
    if(!parsed.date) throw new Error('daily date eksik');
    DATA.dailyNotes.push(parsed);
    selectedDate=parsed.date;
    weekStart=mondayOf(selectedDate);
  }else if(kind==='weekly' || parsed.weeklyReport || parsed.phoenixReport){
    DATA.weeklyNotes.push(parsed);
  }else{
    alert('JSON type anlaşılamadı. type alanı workout / apple_watch / daily / weekly olmalı.');
    return;
  }
  universalJsonBox.value='';
  save();
}catch(e){
  alert('Universal Import başarısız: '+e.message);
}
}
function coachVolumeLevel(sets){
  if(!sets) return 'Veri yok';
  if(sets < 14) return 'Düşük';
  if(sets < 18) return 'Orta';
  if(sets <= 24) return 'İdeal';
  return 'Fazla';
}
function renderCoachPanels(){
  let el=document.getElementById('coachVerdict');
  let tg=document.getElementById('nextTargets');
  if(!el || !tg) return;
  let rows=dayData(selectedDate);
  let c=calc(rows);
  let watch=(DATA.appleWatch||[]).filter(r=>r.date===selectedDate).slice(-1)[0];
  let daily=(DATA.dailyNotes||[]).filter(r=>r.date===selectedDate).slice(-1)[0];
  let readiness=calculateReadiness(selectedDate);
  let injury=calculateInjuryRisk(selectedDate);
  if(!rows.length){
    if(readiness.today.watch.length){
      el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Aktivite günü</b></div><div class="coachPremiumPill">${readiness.status}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Aktivite</small><b>${readiness.today.types.join(' + ')}</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage">${Math.round(readiness.today.minutes)} dk, ${readiness.today.active} aktif kcal. ${readiness.advice} ${injury.deload}</div></div>`;
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Gym hedefi yok</b><span>Bugün aktivite recovery/kondisyon yükü olarak kaydedildi.</span></div><div class="nextTargetBadge">Activity</div></div></div>';
    }else{
      el.innerHTML='<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Veri bekleniyor</b></div><div class="coachPremiumPill">Ready</div></div><div class="coachPremiumMessage">Bu gün için antrenman veya aktivite verisi yok. Veri girildiğinde koç kararı burada oluşur.</div></div>';
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Antrenman işlenince sıradaki hedefler oluşacak.</span></div><div class="nextTargetBadge">Pending</div></div></div>';
    }
    return;
  }
  let level=coachVolumeLevel(c.sets);
  let note=daily&&daily.coachNote?` ${daily.coachNote}`:'';
  let advice='Hacim kontrollü. Sonraki seansta tekrar kalitesi ve form standardını koru.';
  if(c.sets<14) advice='Hacim düşük. Enerjin iyiyse ana harekette 1-2 kaliteli set eklenebilir.';
  if(c.sets>24) advice='Hacim yüksek. Sonraki seansta recovery ve form kalitesi öncelik olmalı.';
  el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>${trDate(selectedDate)} karar özeti</b></div><div class="coachPremiumPill">${level}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Hacim</small><b>${c.sets} set</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${advice} ${readiness.advice} ${injury.deload}${note}</div></div>`;
  let byEx={};
  rows.forEach(r=>{
    if(!byEx[r.exercise]) byEx[r.exercise]=[];
    byEx[r.exercise].push(r);
  });
  let items=Object.entries(byEx).slice(0,5).map(([ex,sets])=>{
    let maxW=Math.max(...sets.map(s=>Number(s.weight)||0));
    let reps=sets.map(s=>Number(s.reps)||0);
    let avgReps=Math.round(reps.reduce((a,b)=>a+b,0)/Math.max(1,reps.length));
    let target=avgReps>=10?`Ağırlığı koru veya küçük artış dene: ${maxW} kg+`:`Ağırlığı koru, hedef tekrar: ${avgReps+1}`;
    return `<div class="nextTargetPremiumItem"><div><b>${ex}</b><span>${target}</span></div><div class="nextTargetBadge">Next</div></div>`;
  }).join('');
  tg.innerHTML=`<div class="nextTargetsPremium">${items||'<div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Set verisi arttıkça hedefler netleşecek.</span></div><div class="nextTargetBadge">Pending</div></div>'}</div>`;
}
function renderPhoenixReport(){
  let el=document.getElementById('phoenixReport');
  if(!el) return;
  let dates=weekDates();
  let rows=DATA.workouts.filter(w=>dates.includes(w.date));
  if(!rows.length){
    el.innerHTML='<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Hafta bekleniyor</b></div><div class="coachPremiumPill">No Data</div></div><div class="coachPremiumMessage">Bu hafta için veri yok. İlk kayıt geldiğinde haftalık yük ve gelişim yorumu oluşacak.</div></div>';
    return;
  }
  let c=calc(rows);
  let groups={};
  rows.forEach(r=>groups[r.bodyPart]=(groups[r.bodyPart]||0)+(Number(r.sets)||1));
  let top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
  let completed=dates.filter(d=>dayData(d).length).length;
  let verdict=c.sets>=45&&c.sets<=90?'Haftalık hacim güçlü ama yönetilebilir görünüyor.':'Haftalık yükü veri arttıkça daha net dengeleyeceğiz.';
  el.innerHTML=`<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Haftalık koç özeti</b></div><div class="coachPremiumPill">${completed}/7 gün</div></div><div class="phoenixPremiumRows"><div class="phoenixPremiumRow"><span>Toplam yük</span><b>${c.sets} set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div><div class="phoenixPremiumRow"><span>Ana odak</span><b>${top?top[0]+' • '+top[1]+' set':'-'}</b></div><div class="phoenixPremiumRow"><span>Hafta aralığı</span><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div></div><div class="coachPremiumMessage"><b>Simurg yorumu:</b> ${verdict}</div></div>`;
}

function renderSide(){let c=calc(DATA.workouts);sideSets.textContent=c.sets+' set';sideReps.textContent=c.reps+' tekrar';sideVolume.textContent=Math.round(c.vol).toLocaleString('tr-TR')+' kg'}
function openEditExercise(ex){editIndexes=DATA.workouts.map((w,i)=>w.exercise===ex&&w.date===selectedDate?i:null).filter(i=>i!==null);let first=DATA.workouts[editIndexes[0]];modalTitle.textContent=ex+' düzenle';modalBody.innerHTML=`<input id="editExerciseName" value="${first.exercise}"><select id="editBodyPart"><option>${first.bodyPart}</option><option>Chest</option><option>Back</option><option>Rear Delt</option><option>Biceps</option><option>Triceps</option><option>Side Delt</option><option>Scapula</option></select>`+editIndexes.map((idx,i)=>{let s=DATA.workouts[idx];return `<div class="form5"><input value="Set ${i+1}" disabled><input value="${s.notes}" id="note_${idx}"><input value="1" disabled><input id="reps_${idx}" value="${s.reps}"><input id="weight_${idx}" value="${s.weight}"></div>`}).join('');editModal.classList.add('active')}
function openEditSet(idx){editIndexes=[idx];let s=DATA.workouts[idx];modalTitle.textContent=s.exercise+' set düzenle';modalBody.innerHTML=`<input id="editExerciseName" value="${s.exercise}"><select id="editBodyPart"><option>${s.bodyPart}</option><option>Chest</option><option>Back</option><option>Rear Delt</option><option>Biceps</option><option>Triceps</option><option>Side Delt</option><option>Scapula</option></select><input id="reps_${idx}" value="${s.reps}" placeholder="Tekrar"><input id="weight_${idx}" value="${s.weight}" placeholder="Kilo"><input id="note_${idx}" value="${s.notes}" placeholder="Not">`;editModal.classList.add('active')}
function saveEdit(){let name=document.getElementById('editExerciseName').value, body=document.getElementById('editBodyPart').value;editIndexes.forEach(idx=>{DATA.workouts[idx].exercise=name;DATA.workouts[idx].bodyPart=body;DATA.workouts[idx].reps=Number(document.getElementById('reps_'+idx).value)||0;DATA.workouts[idx].weight=Number(String(document.getElementById('weight_'+idx).value).replace(',','.'))||0;DATA.workouts[idx].notes=document.getElementById('note_'+idx)?.value||''});closeModal();save()}
function deleteEditing(){editIndexes.sort((a,b)=>b-a).forEach(i=>DATA.workouts.splice(i,1));closeModal();save()}
function closeModal(){editModal.classList.remove('active')}
function addSetToExercise(ex){let last=DATA.workouts.filter(w=>w.exercise===ex&&w.date===selectedDate).at(-1);if(!last)return;DATA.workouts.push({...last,notes:'Yeni set'});save()}
function addWorkout(){DATA.workouts.push({date:selectedDate,day:dayName(selectedDate),exercise:exercise.value,sets:1,reps:Number(reps.value)||0,weight:Number(String(weight.value).replace(',','.'))||0,bodyPart:part(exercise.value),notes:''});save()}

function openProgramNameEdit(day){
  editingProgramDay=day;
  let current=getProgramType(day);
  let def=defaultProgramNames[day]||'Off Day';
  programNameBody.innerHTML=`<div class="programNamePreview"><b>${day}</b><br><span>Mevcut program adı: ${escapeAttr(current)}</span></div><div class="programNameHint">Bu alan sadece günün program başlığını değiştirir. Gym Mode içindeki hareket listesi ve set kayıtları bozulmaz.</div><input id="programNameInput" value="${escapeAttr(current)}" placeholder="Örn: Push Strength / Swimming / Mobility">`;
  programNameModal.classList.add('active');
  setTimeout(()=>document.getElementById('programNameInput')?.focus(),50);
}
function closeProgramNameModal(){programNameModal.classList.remove('active');editingProgramDay=null}
function saveProgramNameEdit(){
  if(!editingProgramDay) return;
  DATA.programNames=DATA.programNames||{};
  let val=(document.getElementById('programNameInput')?.value||'').trim();
  if(!val) val=defaultProgramNames[editingProgramDay]||'Off Day';
  DATA.programNames[editingProgramDay]=val;
  closeProgramNameModal();
  save();
}
function resetProgramNameEdit(){
  if(!editingProgramDay) return;
  DATA.programNames=DATA.programNames||{};
  delete DATA.programNames[editingProgramDay];
  closeProgramNameModal();
  save();
}
function save(){localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));render()}
function clearManual(){['exercise','sets','reps','weight'].forEach(id=>document.getElementById(id).value='')}
function addMetric(){DATA.metrics.push({date:selectedDate,weight:metricWeight.value,waist:metricWaist.value,notes:metricNotes.value});save()}
function addNutrition(){DATA.nutrition.push({date:selectedDate,protein:protein.value,water:water.value,note:nutritionNote.value});save()}
function addRecovery(){DATA.recovery.push({date:selectedDate,sleep:sleep.value,energy:energy.value,note:recoveryNote.value});save()}
function exportJSON(){download('atlas_summary_reports_backup.json',JSON.stringify(DATA,null,2))}
function exportCSV(){let rows=[["date","day","exercise","reps","weight","bodyPart"],...DATA.workouts.map(w=>[w.date,w.day,w.exercise,w.reps,w.weight,w.bodyPart])];download('atlas_workouts.csv',rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'))}
function importJSON(e){
  let f=e.target.files[0];
  if(!f)return;
  let r=new FileReader();
  r.onload=()=>{DATA=JSON.parse(r.result);save()};
  r.readAsText(f);
}
function download(name,text){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download=name;a.click()}
render()

;

(function(){
  function getTargetFromButton(btn){
    const attr = btn.getAttribute('onclick') || '';
    const m = attr.match(/show\('([^']+)'/);
    return m ? m[1] : null;
  }

  function activateTarget(id, btn){
    if(!id) return;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');

    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    if(typeof render === 'function') render();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.nav button').forEach(btn => {
      const id = getTargetFromButton(btn);
      if(id) btn.dataset.target = id;
      btn.removeAttribute('onclick');

      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        activateTarget(this.dataset.target, this);
      }, {passive:false});

      btn.addEventListener('touchend', function(e){
        e.preventDefault();
        e.stopPropagation();
        activateTarget(this.dataset.target, this);
      }, {passive:false});
    });
  });
})();

;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js?v=app-mode-v1').catch(function(){});
  });
}

;

const SIMURG_SUPABASE_URL = "https://kgbajrrfwcsbdbbuvhww.supabase.co";
const SIMURG_SUPABASE_KEY = "sb_publishable_4pCcxpRqlaYeTY3D2CwgGA_Il3LfwLj";
const SIMURG_SYNC_ID = "main";

function setCloudStatus(message, type) {
  const el = document.getElementById('cloudSyncStatus');
  if (!el) return;
  el.classList.remove('ok','err');
  if (type) el.classList.add(type);
  el.textContent = message;
}

function simurgCloudHeaders(extra) {
  return Object.assign({
    "apikey": SIMURG_SUPABASE_KEY,
    "Authorization": "Bearer " + SIMURG_SUPABASE_KEY,
    "Content-Type": "application/json"
  }, extra || {});
}

async function pushToCloud() {
  try {
    if (!confirm("Bu cihazdaki mevcut Simurg OS verisi buluta gönderilecek ve cloud ana kayıt güncellenecek. Devam edelim mi?")) {
      setCloudStatus("Push cancelled.", "");
      return;
    }
    setCloudStatus("Pushing local data to cloud...", "");
    const payload = {
      data: DATA,
      pushedAt: new Date().toISOString(),
      version: "simurg-os-sync-v1"
    };
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?on_conflict=id", {
      method: "POST",
      headers: simurgCloudHeaders({
        "Prefer": "resolution=merge-duplicates,return=representation"
      }),
      body: JSON.stringify({
        id: SIMURG_SYNC_ID,
        payload: payload,
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    setCloudStatus("Cloud sync complete: local data pushed successfully.", "ok");
  } catch (err) {
    setCloudStatus("Push failed: " + err.message, "err");
  }
}

async function pullFromCloud() {
  try {
    setCloudStatus("Pulling data from cloud...", "");
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?id=eq." + encodeURIComponent(SIMURG_SYNC_ID) + "&select=payload,updated_at", {
      method: "GET",
      headers: simurgCloudHeaders()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    const rows = await res.json();
    if (!rows.length || !rows[0].payload || !rows[0].payload.data) {
      setCloudStatus("Cloud has no Simurg OS data yet. Push from one device first.", "err");
      return;
    }
    if (!confirm("Pull From Cloud bu cihazdaki mevcut local veriyi buluttaki kayıtla güncelleyecek. Devam edelim mi?")) {
      setCloudStatus("Pull cancelled.", "");
      return;
    }
    DATA = rows[0].payload.data;
    localStorage.setItem('atlas_summary_reports', JSON.stringify(DATA));
    if (!DATA.appleWatch) DATA.appleWatch = [];
    if (!DATA.dailyNotes) DATA.dailyNotes = [];
    if (!DATA.weeklyNotes) DATA.weeklyNotes = [];
    if (!DATA.customGymPrograms) DATA.customGymPrograms = {};
    render();
    setCloudStatus("Cloud data pulled successfully. Last update: " + (rows[0].updated_at || "-"), "ok");
  } catch (err) {
    setCloudStatus("Pull failed: " + err.message, "err");
  }
}

async function checkCloudStatus() {
  try {
    setCloudStatus("Checking cloud...", "");
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?id=eq." + encodeURIComponent(SIMURG_SYNC_ID) + "&select=updated_at", {
      method: "GET",
      headers: simurgCloudHeaders()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    const rows = await res.json();
    if (!rows.length) {
      setCloudStatus("Cloud is reachable, but no data exists yet. Push first.", "ok");
    } else {
      setCloudStatus("Cloud is reachable. Last cloud update: " + rows[0].updated_at, "ok");
    }
  } catch (err) {
    setCloudStatus("Cloud check failed: " + err.message, "err");
  }
}

;

/* SIMURG OS V4: coaching card content renderer refinement */
(function(){
  function safeText(v){return (v===undefined||v===null||v==='')?'-':String(v);}
  function shortTypeList(types){return (types&&types.length)?types.slice(0,2).join(' + '):'No activity';}

  window.renderReadinessHtml=function(date){
    let r=calculateReadiness(date);
    let t=r.today;
    let typeText=shortTypeList(t.types);
    let reasonText=r.reasons.length?r.reasons.slice(0,3).join(', '):'olumsuz sinyal yok';
    let bg=`conic-gradient(#23ce7a 0 ${r.score}%, #172033 ${r.score}% 100%)`;
    return `<div class="readinessScoreBox"><div class="readinessCircle" style="background:${bg}">${r.score}</div><div class="readinessMeta"><b>${r.status}</b><span>${r.advice}</span><div class="readinessPills"><span class="readinessPill activityTag">${typeText}</span><span class="readinessPill">${t.level} load</span><span class="readinessPill">${Math.round(t.minutes)} dk</span><span class="readinessPill">${t.active} kcal</span><span class="readinessPill">${t.avgHR||'-'} bpm</span></div><div class="activityLoadCard"><b>Etkenler:</b> ${reasonText}</div></div></div>`;
  };

  window.renderInjuryRiskHtml=function(date){
    let r=calculateInjuryRisk(date);
    let cls=r.level==='High'?'high':(r.level==='Moderate'?'moderate':(r.readiness.status==='Recovery'?'recovery':''));
    let signalText=r.signals.length?r.signals.slice(0,3).join(', '):'belirgin risk sinyali yok';
    let pills=[
      `<span class="injuryRiskPill ${r.level==='High'?'danger':(r.level==='Moderate'?'warn':'')}">Risk ${r.level}</span>`,
      `<span class="injuryRiskPill">Readiness ${r.readiness.score}</span>`,
      `<span class="injuryRiskPill">RPE ${r.today.coach.avgRpe||'-'}</span>`,
      `<span class="injuryRiskPill">${r.today.gym.sets} set</span>`,
      `<span class="injuryRiskPill">${r.today.level}</span>`
    ].join('');
    return `<div class="injuryRiskBox"><div class="injuryRiskBadge ${cls}">${r.level}<br>${r.score}/100</div><div class="injuryRiskMeta"><b>Koruma kararı</b><span>${r.deload}</span><div class="injuryRiskPills">${pills}</div><div class="deloadBox"><b>Risk sinyalleri:</b> ${signalText}</div></div></div>`;
  };

  window.renderCoachPanels=function(){
    let el=document.getElementById('coachVerdict');
    let tg=document.getElementById('nextTargets');
    if(!el || !tg) return;
    let rows=dayData(selectedDate);
    let c=calc(rows);
    let daily=(DATA.dailyNotes||[]).filter(r=>r.date===selectedDate).slice(-1)[0];
    let readiness=calculateReadiness(selectedDate);
    let injury=calculateInjuryRisk(selectedDate);
    if(!rows.length){
      if(readiness.today.watch.length){
        el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Aktivite günü</b></div><div class="coachPremiumPill">${readiness.status}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Aktivite</small><b>${shortTypeList(readiness.today.types)}</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${Math.round(readiness.today.minutes)} dk aktivite, ${readiness.today.active} aktif kcal. ${readiness.advice}</div></div>`;
        tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Gym hedefi yok</b><span>Bugün recovery/kondisyon yükü olarak işlendi. Sonraki gym gününde readiness skoruna göre başla.</span></div><div class="nextTargetBadge">Activity</div></div></div>';
      }else{
        el.innerHTML='<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Veri bekleniyor</b></div><div class="coachPremiumPill">Ready</div></div><div class="coachPremiumMessage">Bu gün için antrenman veya aktivite verisi yok. Veri girildiğinde koç kararı burada oluşur.</div></div>';
        tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Antrenman işlenince sıradaki hedefler oluşacak.</span></div><div class="nextTargetBadge">Pending</div></div></div>';
      }
      return;
    }
    let level=coachVolumeLevel(c.sets);
    let note=daily&&daily.coachNote?` ${daily.coachNote}`:'';
    let advice='Hacim kontrollü. Form standardını koru; progression aceleye gelmesin.';
    if(c.sets<14) advice='Hacim düşük. Enerjin iyiyse ana harekette 1-2 kaliteli set eklenebilir.';
    if(c.sets>24) advice='Hacim yüksek. Sonraki seansta recovery ve teknik kalite öncelik olmalı.';
    el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>${trDate(selectedDate)} karar özeti</b></div><div class="coachPremiumPill">${level}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Hacim</small><b>${c.sets} set</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${advice} ${readiness.advice} ${injury.deload}${note}</div></div>`;
    let byEx={};
    rows.forEach(r=>{ if(!byEx[r.exercise]) byEx[r.exercise]=[]; byEx[r.exercise].push(r); });
    let items=Object.entries(byEx).slice(0,4).map(([ex,sets])=>{
      let maxW=Math.max(...sets.map(s=>Number(s.weight)||0));
      let reps=sets.map(s=>Number(s.reps)||0);
      let avgReps=Math.round(reps.reduce((a,b)=>a+b,0)/Math.max(1,reps.length));
      let target=avgReps>=10?`Kilo sabit; iyi hissedersen küçük artış dene.`:`Aynı kiloda hedef tekrar: ${avgReps+1}.`;
      return `<div class="nextTargetPremiumItem"><div><b>${ex}</b><span>${maxW?maxW+' kg · ':''}${target}</span></div><div class="nextTargetBadge">Next</div></div>`;
    }).join('');
    tg.innerHTML=`<div class="nextTargetsPremium">${items||'<div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>Set verisi arttıkça hedefler netleşecek.</span></div><div class="nextTargetBadge">Pending</div></div>'}</div>`;
  };

  window.renderPhoenixReport=function(){
    let el=document.getElementById('phoenixReport');
    if(!el) return;
    let dates=weekDates();
    let rows=DATA.workouts.filter(w=>dates.includes(w.date));
    if(!rows.length){
      el.innerHTML='<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Hafta bekleniyor</b></div><div class="coachPremiumPill">No Data</div></div><div class="coachPremiumMessage">Bu hafta için veri yok. İlk kayıt geldiğinde haftalık yük ve gelişim yorumu oluşacak.</div></div>';
      return;
    }
    let c=calc(rows);
    let groups={};
    rows.forEach(r=>groups[r.bodyPart]=(groups[r.bodyPart]||0)+(Number(r.sets)||1));
    let top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
    let completed=dates.filter(d=>dayData(d).length || watchRowsForDate(d).length).length;
    let verdict=c.sets>=45&&c.sets<=90?'Haftalık hacim güçlü ama yönetilebilir görünüyor.':'Haftalık yük veri arttıkça daha net dengelenecek.';
    el.innerHTML=`<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Haftalık koç özeti</b></div><div class="coachPremiumPill">${completed}/7 gün</div></div><div class="phoenixPremiumRows"><div class="phoenixPremiumRow"><span>Toplam yük</span><b>${c.sets} set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div><div class="phoenixPremiumRow"><span>Ana odak</span><b>${top?top[0]+' • '+top[1]+' set':'-'}</b></div><div class="phoenixPremiumRow"><span>Hafta</span><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div></div><div class="coachPremiumMessage"><b>Simurg yorumu:</b> ${verdict}</div></div>`;
  };

  window.renderProgressMotivation=function(){
    let el=document.getElementById('progressMotivation');
    if(!el) return;
    let data=calculatePRBoard();
    let events=data.events||[];
    let dates=weekDates();
    let weekEvents=events.filter(e=>dates.includes(e.date));
    if(weekEvents.length){
      let top=weekEvents.slice(0,2).map(e=>`<div><span class="highlight">${e.type}</span> • <b>${e.exercise}</b><br><small>${e.text} • ${trDate(e.date)}</small></div>`).join('');
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Gelişim sinyali var.</b><span>Bu hafta ${weekEvents.length} PR/gelişim yakalandı. Risk düşük/orta kaldığı sürece kontrollü progression devam.</span></div><div class="progressPremiumScore">${weekEvents.length} PR</div></div><div class="progressPremiumList">${top}</div></div>`;
    }else if(events.length){
      let last=events[0];
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Bu hafta sakin ilerleme.</b><span>Yeni PR yok; form, ağrı kontrolü ve düzenli veri öncelikli.</span></div><div class="progressPremiumScore">STABLE</div></div><div class="progressPremiumList"><div>Son PR: <b>${last.exercise}</b><br><small>${last.type} • ${last.text} • ${trDate(last.date)}</small></div></div></div>`;
    }else{
      el.innerHTML=`<div class="progressPremium"><div class="progressPremiumHead"><div><b>Veri birikiyor.</b><span>Aynı hareketlerde birkaç seans oluştuktan sonra PR takibi anlamlı hale gelecek.</span></div><div class="progressPremiumScore">BUILD</div></div></div>`;
    }
  };

  try{
    renderCoachPanels();
    renderReadinessPanel();
    renderInjuryRiskPanel();
    renderPhoenixReport();
    renderProgressMotivation();
  }catch(e){console.warn('Coaching V4 refresh skipped',e);}
})();

;

/* === SIMURG OS FINAL POLISH / ACTIVITY + COACH V1 === */
(function(){
  function n(v){ return Number(String(v??0).replace(',','.'))||0; }
  function clean(v){ return String(v??'').trim(); }
  function looksLikeWatch(r){
    if(!r || typeof r!=='object') return false;
    return !!(r.activityType||r.activity||r.workoutType||r.avgHR||r.avgHeartRate||r.activeCal||r.activeCalories||r.activeEnergy||r.totalCal||r.totalCalories||r.duration||r.distance);
  }
  const activityAliases=[
    ['Sea Swimming',['sea','deniz','open water','açık su','acik su']],
    ['Pool Swimming',['pool swim','havuz','pool swimming']],
    ['Swimming',['swim','yüz','yuz','yüzme','yuzme']],
    ['Table Tennis',['table tennis','masa tenisi','ping pong','ping-pong']],
    ['Football',['football','soccer','futbol','match','maç','mac']],
    ['Beach Volleyball',['beach volleyball','plaj voleybol','beach volley']],
    ['Volleyball',['volleyball','voleybol']],
    ['Tennis',['tennis','tenis']],
    ['Padel',['padel']],
    ['Basketball',['basketball','basketbol']],
    ['Walking',['walk','walking','yürü','yuru','yürüyüş','yuruyus']],
    ['Running',['run','running','koş','kos','koşu','kosu']],
    ['Cycling',['cycle','cycling','bike','bisiklet']],
    ['Mobility',['mobility','mobilite','stretch','esneme']],
    ['Yoga',['yoga']],
    ['Pilates',['pilates']],
    ['Boxing',['boxing','boks']],
    ['Fitness',['fitness','strength','gym','fonksiyonel','ağırlık','agirlik','workout']],
    ['Recovery',['recovery','toparlanma','sauna','restorative']]
  ];
  window.normalizeActivityType=function(rec){
    let raw=clean(rec.activityType||rec.activity||rec.workoutType||rec.sport||rec.name||rec.type).toLowerCase();
    for(const [label,keys] of activityAliases){
      if(keys.some(k=>raw.includes(k))) return label;
    }
    let fallback=clean(rec.activityType||rec.activity||rec.workoutType||rec.sport||rec.type);
    if(!fallback || fallback==='apple_watch' || fallback==='watch' || fallback==='Apple Watch Workout') return 'Other';
    return fallback.replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  };
  window.activityEmoji=function(type){
    let t=clean(type).toLowerCase();
    if(t.includes('sea')) return '🌊';
    if(t.includes('pool')||t.includes('swim')||t.includes('yüz')||t.includes('yuz')) return '🏊';
    if(t.includes('table tennis')||t.includes('ping')||t.includes('masa')) return '🏓';
    if(t.includes('football')||t.includes('soccer')||t.includes('futbol')) return '⚽';
    if(t.includes('beach volleyball')) return '🏖️';
    if(t.includes('volleyball')||t.includes('voleybol')) return '🏐';
    if(t.includes('tennis')||t.includes('tenis')) return '🎾';
    if(t.includes('padel')) return '🎾';
    if(t.includes('basket')) return '🏀';
    if(t.includes('walk')||t.includes('yürü')||t.includes('yuru')) return '🚶';
    if(t.includes('run')||t.includes('koş')||t.includes('kos')) return '🏃';
    if(t.includes('cycl')||t.includes('bike')||t.includes('bisiklet')) return '🚴';
    if(t.includes('mobility')||t.includes('mobilite')||t.includes('yoga')||t.includes('pilates')||t.includes('recovery')) return '🧘';
    if(t.includes('boxing')||t.includes('boks')) return '🥊';
    if(t.includes('fitness')||t.includes('gym')||t.includes('strength')) return '🏋️';
    return '⌚';
  };
  window.activityDisplayName=function(type){
    const map={
      'Sea Swimming':'Sea Swimming','Pool Swimming':'Pool Swimming','Swimming':'Swimming',
      'Table Tennis':'Table Tennis','Football':'Football','Beach Volleyball':'Beach Volleyball','Volleyball':'Volleyball',
      'Tennis':'Tennis','Padel':'Padel','Basketball':'Basketball','Walking':'Walking','Walk':'Walking','Running':'Running','Run':'Running','Cycling':'Cycling',
      'Mobility':'Mobility','Yoga':'Yoga','Pilates':'Pilates','Boxing':'Boxing','Fitness':'Fitness','Recovery':'Recovery','Other':'Other Activity'
    };
    return map[type]||type||'Other Activity';
  };
  window.normalizeWatchRecord=function(rec){
    rec={...rec};
    rec.type='Apple Watch Workout';
    rec.activityType=normalizeActivityType(rec);
    rec.duration=rec.duration||rec.time||rec.elapsed||'';
    rec.distance=n(rec.distance??rec.distanceMeters??rec.meters??rec.distanceM);
    rec.activeCal=n(rec.activeCal??rec.activeCalories??rec.activeEnergy??rec.activeKcal??rec.caloriesActive);
    rec.totalCal=n(rec.totalCal??rec.totalCalories??rec.totalEnergy??rec.totalKcal??rec.caloriesTotal??rec.calories);
    rec.avgHR=n(rec.avgHR??rec.avgHeartRate??rec.averageHR??rec.averageHeartRate??rec.hrAvg);
    rec.maxHR=n(rec.maxHR??rec.maxHeartRate??rec.maximumHR??rec.maximumHeartRate??rec.hrMax);
    rec.rpe=rec.rpe||rec.effort||rec.effortScore||'';
    rec.notes=rec.notes||rec.note||'';
    return rec;
  };
  window.importAppleWatch=function(rec){
    if(!rec.date) throw new Error('apple_watch date eksik');
    let base={...rec};
    let segments=Array.isArray(rec.segments)?rec.segments:null;
    if(segments && segments.length){
      segments.forEach(seg=>DATA.appleWatch.push(normalizeWatchRecord({...base,...seg,date:seg.date||base.date,activityType:seg.activityType||base.activityType||base.activity})));
      selectedDate=base.date;
    }else{
      rec=normalizeWatchRecord(rec);
      DATA.appleWatch.push(rec);
      selectedDate=rec.date;
    }
    weekStart=mondayOf(selectedDate);
  };
  window.universalImport=function(){
    try{
      let raw=universalJsonBox.value.trim();
      if(!raw){alert('JSON kutusu boş.');return;}
      let parsed=JSON.parse(raw);
      let importedDate=null;
      if(Array.isArray(parsed)){
        if(parsed.every(looksLikeWatch)){
          parsed.forEach(r=>{ if(!r.date && importedDate) r.date=importedDate; importAppleWatch(r); importedDate=r.date||selectedDate; });
        }else{
          importWorkoutArray(parsed);
        }
      }else{
        let kind=clean(parsed.type||parsed.kind||parsed.category).toLowerCase();
        if(parsed.workouts || kind==='workout' || kind==='strength'){
          importWorkoutArray(parsed.workouts||parsed.items||[]);
        }else if(parsed.appleWatch || parsed.watch || parsed.activities){
          let arr=parsed.appleWatch||parsed.watch||parsed.activities;
          if(!Array.isArray(arr)) arr=[arr];
          arr.forEach(r=>importAppleWatch({...parsed,...r,date:r.date||parsed.date,activityType:r.activityType||parsed.activityType||parsed.activity}));
        }else if(parsed.segments && looksLikeWatch(parsed)){
          importAppleWatch(parsed);
        }else if(kind==='apple_watch'||kind==='watch'||kind==='activity'||looksLikeWatch(parsed)){
          importAppleWatch(parsed);
        }else if(kind==='daily'||parsed.coachNote||parsed.readiness||parsed.energy){
          if(!parsed.date) throw new Error('daily date eksik');
          DATA.dailyNotes=DATA.dailyNotes||[]; DATA.dailyNotes.push(parsed); selectedDate=parsed.date; weekStart=mondayOf(selectedDate);
        }else if(kind==='weekly'||parsed.weeklyReport||parsed.phoenixReport){
          DATA.weeklyNotes=DATA.weeklyNotes||[]; DATA.weeklyNotes.push(parsed);
        }else{
          alert('JSON type anlaşılamadı. workout / apple_watch / activity / daily / weekly formatlarından biri olmalı.');return;
        }
      }
      universalJsonBox.value='';
      save();
    }catch(e){ alert('Universal Import başarısız: '+e.message); }
  };
  window.importWatchJson=function(){
    try{
      let rec=JSON.parse(watchJsonBox.value);
      importAppleWatch(rec);
      watchJsonBox.value='';
      save();
    }catch(e){ alert('JSON okunamadı: '+e.message); }
  };
  window.activitySummaryForDate=function(date){
    let rows=watchRowsForDate(date);
    if(!rows.length) return null;
    let types=[...new Set(rows.map(r=>normalizeActivityType(r)))];
    let primary=types.length===1?types[0]:'Mixed Activity';
    let emoji=types.length===1?activityEmoji(primary):'⚡';
    let duration=sumDurations(rows);
    let active=rows.reduce((a,r)=>a+n(r.activeCal),0);
    let total=rows.reduce((a,r)=>a+n(r.totalCal),0);
    let distance=rows.reduce((a,r)=>a+n(r.distance),0);
    let avgHR=weightedAvgHR(rows);
    let maxHR=Math.max(0,...rows.map(r=>n(r.maxHR)));
    let rpes=rows.map(r=>n(r.rpe)).filter(Boolean);
    let rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
    let name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
    let dist=formatDistance(distance);
    let shortBits=[duration,dist,active?active+' kcal':''].filter(Boolean);
    return {rows,types,primary,name,emoji,duration,active,total,distance,dist,avgHR,maxHR,rpe,shortLabel:shortBits.join(' · '),fullLabel:`${name} · ${shortBits.join(' · ')}`};
  };
  function topReasons(readiness, injury){
    let reasons=[];
    if(readiness.reasons && readiness.reasons.length) reasons.push(...readiness.reasons.slice(0,2));
    if(injury.signals && injury.signals.length) reasons.push(...injury.signals.slice(0,2));
    return [...new Set(reasons)].slice(0,2);
  }
  window.renderCoachPanels=function(){
    let el=document.getElementById('coachVerdict');
    let tg=document.getElementById('nextTargets');
    if(!el || !tg) return;
    let rows=dayData(selectedDate), c=calc(rows), readiness=calculateReadiness(selectedDate), injury=calculateInjuryRisk(selectedDate);
    let hasWatch=readiness.today.watch.length>0;
    if(!rows.length && !hasWatch){
      el.innerHTML='<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>Veri bekleniyor</b></div><div class="coachPremiumPill">Pending</div></div><div class="coachPremiumMessage"><b>Karar:</b> Bugün için antrenman veya aktivite verisi yok. Veri girilince koç kararı oluşacak.</div></div>';
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Hedef bekleniyor</b><span>İlk kayıt sonrası sonraki seans hedefleri oluşacak.</span></div><div class="nextTargetBadge">Pending</div></div></div>';return;
    }
    let reasons=topReasons(readiness,injury);
    let decision=injury.level==='High'?'Koruma öncelikli.':(injury.level==='Moderate'?'Kontrollü yüklen.':(readiness.status==='Recovery'?'Recovery odaklı ilerle.':'Plan uygulanabilir.'));
    let recommendation=injury.level==='High'?injury.deload:(injury.level==='Moderate'?'Bugün yük artırma; 1-2 tekrar rezerv bırak.':readiness.advice);
    let activityText=readiness.today.types.length?readiness.today.types.join(' + '):(rows.length?'Gym':'No activity');
    el.innerHTML=`<div class="coachPremiumBox"><div class="coachPremiumHead"><div><small>Coach Verdict</small><b>${trDate(selectedDate)} karar özeti</b></div><div class="coachPremiumPill">${readiness.status}</div></div><div class="coachPremiumStats"><div class="coachPremiumStat"><small>Aktivite</small><b>${activityText}</b></div><div class="coachPremiumStat"><small>Readiness</small><b>${readiness.score}/100</b></div><div class="coachPremiumStat"><small>Risk</small><b>${injury.level}</b></div></div><div class="coachPremiumMessage"><b>Karar:</b> ${decision}<br><b>Neden:</b> ${reasons.length?reasons.join(' · '):'belirgin olumsuz sinyal yok'}.<br><b>Öneri:</b> ${recommendation}</div></div>`;
    if(!rows.length){
      tg.innerHTML='<div class="nextTargetsPremium"><div class="nextTargetPremiumItem"><div><b>Gym hedefi yok</b><span>Bugün aktivite yükü recovery/kondisyon olarak işlendi. Sonraki gym gününde readiness ve risk skorunu baz al.</span></div><div class="nextTargetBadge">Activity</div></div></div>';return;
    }
    let byEx={}; rows.forEach(r=>{(byEx[r.exercise]=byEx[r.exercise]||[]).push(r);});
    let items=Object.entries(byEx).slice(0,4).map(([ex,sets])=>{
      let maxW=Math.max(...sets.map(s=>n(s.weight))); let reps=sets.map(s=>n(s.reps)); let avgReps=Math.round(reps.reduce((a,b)=>a+b,0)/Math.max(1,reps.length));
      let target=injury.level==='High'?'Yük artırma; form ve ağrı kontrolü.':(avgReps>=10?`Aynı kiloda kaliteyi koru; iyi hissedersen küçük artış dene.`:`${maxW} kg civarı, hedef tekrar: ${avgReps+1}.`);
      return `<div class="nextTargetPremiumItem"><div><b>${ex}</b><span>${target}</span></div><div class="nextTargetBadge">Next</div></div>`;
    }).join('');
    tg.innerHTML=`<div class="nextTargetsPremium">${items}</div>`;
  };
  window.renderPhoenixReport=function(){
    let el=document.getElementById('phoenixReport'); if(!el) return;
    let dates=weekDates(); let rows=DATA.workouts.filter(w=>dates.includes(w.date)); let watch=(DATA.appleWatch||[]).filter(r=>dates.includes(r.date)).map(normalizeWatchRecord);
    if(!rows.length && !watch.length){el.innerHTML='<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Hafta bekleniyor</b></div><div class="coachPremiumPill">No Data</div></div><div class="coachPremiumMessage">Bu hafta için veri yok. İlk kayıt geldiğinde haftalık yük, aktivite ve toparlanma yorumu oluşacak.</div></div>';return;}
    let c=calc(rows); let completed=[...new Set([...rows.map(r=>r.date),...watch.map(r=>r.date)])].length; let active=watch.reduce((a,r)=>a+n(r.activeCal),0); let minutes=Math.round(watch.reduce((a,r)=>a+durationMinutes(r.duration),0));
    let groups={}; rows.forEach(r=>groups[r.bodyPart]=(groups[r.bodyPart]||0)+(n(r.sets)||1)); let top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
    let verdict=c.sets>24?'Hacim yüksek; recovery sinyallerini takip et.':(active>350?'Aktivite yükü belirgin; sonraki gym gününde kontrollü başla.':'Hafta yönetilebilir görünüyor.');
    el.innerHTML=`<div class="phoenixPremiumBox"><div class="coachPremiumHead"><div><small>Phoenix Report</small><b>Haftalık koç özeti</b></div><div class="coachPremiumPill">${completed}/7 gün</div></div><div class="phoenixPremiumRows"><div class="phoenixPremiumRow"><span>Gym yükü</span><b>${c.sets} set • ${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div><div class="phoenixPremiumRow"><span>Aktivite</span><b>${minutes} dk • ${active} kcal</b></div><div class="phoenixPremiumRow"><span>Ana odak</span><b>${top?top[0]+' • '+top[1]+' set':'Aktivite / Recovery'}</b></div></div><div class="coachPremiumMessage"><b>Simurg yorumu:</b> ${verdict}</div></div>`;
  };
  // Polish Data Center labels after render without changing data flow
  function polishDataCenter(){
    const dc=document.getElementById('data'); if(!dc) return;
    const cloud=dc.querySelector('.cloudSyncCard .sub'); if(cloud) cloud.innerHTML='Telefon ve Mac arasında veriyi eşitle. <b>Eski cihazda Push</b>, diğer cihazda <b>Pull</b> yap.';
    const universal=dc.querySelector('.universalImportCard .sub'); if(universal) universal.innerHTML='Tek veri giriş noktası: workout, Apple Watch, yüzme, futbol, masa tenisi, plaj voleybolu gibi aktiviteleri otomatik tanır. Dizi veya segmentli kayıtları da destekler.';
  }
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){ oldRender(); polishDataCenter(); };
    setTimeout(()=>{try{render();}catch(e){}},0);
  }
})();


(function(){
  function n(v){return Number(v)||0;}
  function esc(v){return (typeof escapeAttr==='function')?escapeAttr(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function dateDiffDays(a,b){return Math.round((parseDate(a)-parseDate(b))/86400000);}
  function lastCompletedSession(ex,date){
    if(typeof exerciseSessions!=='function') return null;
    const sessions=exerciseSessions(ex).filter(s=>parseDate(s.date)<parseDate(date||selectedDate));
    return sessions[0]||null;
  }
  function lastSessionSnapshotHtml(ex,date){
    const s=lastCompletedSession(ex,date);
    if(!s || typeof exerciseSessionStats!=='function') return `<div class="gymSnapshotBlock"><b>Last Session</b><span>Bu hareket için önceki kayıt yok. Bugün temiz formu referans al.</span></div>`;
    const st=exerciseSessionStats(s.rows);
    const sets=s.rows.map(w=>`${gymSafe(w.weight)}kg x ${gymSafe(w.reps)}`).join(' / ');
    const meta=[st.rpe?`RPE ${st.rpe}`:'',st.form?`Form ${st.form}`:'',st.pain&&st.pain!=='None'?`Pain ${st.pain}`:''].filter(Boolean).join(' · ');
    return `<div class="gymSnapshotBlock"><b>Last Session · ${trDate(s.date)}</b><span>${sets}${meta?` · ${meta}`:''}</span></div>`;
  }
  function painMemoryHtml(ex,date){
    const rows=(DATA.workouts||[]).filter(w=>w.exercise===ex && parseDate(w.date)<parseDate(date||selectedDate) && dateDiffDays(date||selectedDate,w.date)<=14)
      .filter(w=>['mild','warning'].includes(String(w.pain||'').toLowerCase()) || String(w.form||'').toLowerCase()==='bad');
    if(!rows.length) return '';
    const hasWarning=rows.some(w=>String(w.pain||'').toLowerCase()==='warning' || String(w.form||'').toLowerCase()==='bad');
    const latest=rows.sort((a,b)=>parseDate(b.date)-parseDate(a.date))[0];
    const signal=[latest.pain&&latest.pain!=='None'?`Pain ${latest.pain}`:'',latest.form==='Bad'?'Form Bad':''].filter(Boolean).join(' · ');
    return `<div class="gymPainMemoryBlock ${hasWarning?'warning':''}"><b>Health Memory</b><span>Son kayıtta risk sinyali: ${esc(signal||'dikkat')} (${trDate(latest.date)}). Bugün formu önceliklendir, gerekirse yük artırma.</span></div>`;
  }
  function applyGymSmartCoach(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      card.querySelectorAll('.gymSmartStack').forEach(x=>x.remove());
      const input=card.querySelector('.gymExerciseName');
      const ex=(input?.value||card.getAttribute('data-current-name')||'').trim();
      if(!ex) return;
      const target=card.querySelector('.gymTargetBox');
      const coach=card.querySelector('.gymCoachBox');
      const stack=document.createElement('div');
      stack.className='gymSmartStack';
      stack.innerHTML=lastSessionSnapshotHtml(ex,selectedDate)+painMemoryHtml(ex,selectedDate);
      if(target) target.insertAdjacentElement('afterend',stack);
      else if(coach) coach.insertAdjacentElement('beforebegin',stack);
      const rpeLabel=coach?.querySelector('label:first-child small');
      if(rpeLabel && !rpeLabel.textContent.includes('?')) rpeLabel.textContent='RPE ?';
    });
  }
  function classifyActivityIntensity(activity){
    if(!activity) return {label:'Rest Day',cls:'light',role:'Recovery / Rest'};
    const minutes=durationMinutes(activity.duration);
    const active=n(activity.active);
    const avg=n(activity.avgHR);
    const rpe=n(activity.rpe);
    const score=active + minutes*2 + Math.max(0,avg-100)*2 + (rpe?rpe*18:0);
    let label='Light Activity', cls='light', role='Recovery / Light Movement';
    if(score>=520 || rpe>=8 || active>=450){label='Hard Activity';cls='hard';role='High Activity Day';}
    else if(score>=250 || rpe>=6 || active>=220){label='Moderate Activity';cls='moderate';role='Conditioning Day';}
    const t=String(activity.primary||activity.name||'').toLowerCase();
    if(cls==='light' && (t.includes('swim')||t.includes('walk')||t.includes('mobility')||t.includes('yoga'))) role='Recovery / Conditioning';
    return {label,cls,role,score};
  }
  window.classifyActivityIntensity=classifyActivityIntensity;
  window.renderActivitySessionCard=function(date){
    let a=activitySummaryForDate(date);
    if(!a) return '';
    const intensity=classifyActivityIntensity(a);
    let stats=[
      ['Süre',a.duration||'-'],['Aktif kcal',a.active?a.active+' kcal':'-'],['Toplam kcal',a.total?a.total+' kcal':'-'],['Mesafe',a.dist||'-'],['Yoğunluk',intensity.label],['Ort. nabız',a.avgHR?a.avgHR+' v/dk':'-'],['Maks nabız',a.maxHR?a.maxHR+' v/dk':'-'],['RPE',a.rpe||'-']
    ];
    if(a.rows.length>1) stats.push(['Kayıt',a.rows.length+' segment']);
    return `<div class="activitySessionCard ${intensity.cls}"><div class="activitySessionTop"><div class="activitySessionTitle"><div class="activityIcon">${a.emoji}</div><div><small>ACTIVITY SESSION</small><b>${esc(a.name)}</b><span>${trDate(date)} · ${intensity.role}</span></div></div><div class="activityPill activityIntensityPill ${intensity.cls}">${intensity.label}</div></div><div class="activityStatsGrid">${stats.map(([k,v])=>`<div class="activityStatBox"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>`;
  };
  window.renderDailyReport=function(){
    let dates=[...new Set([...(DATA.workouts||[]).map(w=>w.date),...(DATA.appleWatch||[]).map(w=>w.date)])].filter(Boolean).sort((a,b)=>parseDate(b)-parseDate(a));
    if(!dates.length){dailyReport.innerHTML='<div class="card"><h2>Daily Summary</h2><div class="reportText">Henüz antrenman veya aktivite verisi yok.</div></div>';return;}
    let cards=[];
    dates.forEach(date=>{
      let items=dayData(date), c=calc(items), activity=activitySummaryForDate(date), readiness=calculateReadiness(date);
      let hasGym=items.length>0, hasActivity=!!activity, intensity=hasActivity?classifyActivityIntensity(activity):null;
      if(hasGym){
        let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0], best=items.slice().sort((a,b)=>b.weight-a.weight)[0], exCount=Object.keys(c.exs).length, exMini=Object.keys(c.exs).map(ex=>`<em>${ex}</em>`).join('');
        let activityLine=hasActivity?`<span>Extra Activity: ${activity.emoji} ${esc(activity.name)} • ${activity.duration||'-'} • ${activity.active||0} kcal • ${intensity.label}</span>`:'';
        cards.push(`<div class="dailyMiniCard dailyGymCard" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()"><div class="dailyMiniTop"><div><b>${trDate(date)}</b><span>${items[0]?.day||dayName(date)} · Gym Training</span></div><strong>${c.sets} set</strong></div><div class="dailyMiniReadiness"><span>Readiness ${readiness.score}/100</span><span>${readiness.status}</span></div><div class="dailyMiniStats"><span>${c.reps} reps</span><span>${Math.round(c.vol).toLocaleString('tr-TR')} kg</span><span>${exCount} exercises</span><span>${topPart[0]}</span></div><div class="dailyMiniExercises">${exMini}</div><div class="dailyMiniFooter"><span>Best: ${best?best.exercise+' '+best.weight+'kg':'-'}</span>${activityLine}</div></div>`);
      }
      if(hasActivity && !hasGym){
        let segmentText=activity.rows.length>1?` • ${activity.rows.length} kayıt`:'';
        cards.push(`<div class="dailyMiniCard dailyActivityCard ${intensity.cls}" onclick="selectedDate='${date}';show('workout',document.querySelector('.nav button'));render()"><div class="dailyMiniTop"><div><b>${trDate(date)}</b><span>${dayName(date)} · Activity Day</span></div><strong>${intensity.label}</strong></div><div class="dailyActivityTypeLine"><div class="emoji">${activity.emoji}</div><div><b>${esc(activity.name)}</b><span>${intensity.role}${segmentText}</span></div></div><div class="dailyMiniStats"><span>${activity.duration||'-'}</span><span>${activity.active?activity.active+' kcal':'-'}</span><span>${activity.dist||'-'}</span><span>${activity.avgHR?activity.avgHR+' bpm':'-'}</span></div><div class="dailyActivityNote">Gym hacmine eklenmez; readiness, recovery ve günlük fiziksel yük hesabına dahil edilir.</div></div>`);
      }
    });
    dailyReport.innerHTML=`<div class="dailyMiniGrid">`+cards.join('')+`</div>`;
  };
  window.renderWeeklyReport=function(){
    let dates=weekDates(), items=dates.flatMap(d=>dayData(d)), c=calc(items), watch=(DATA.appleWatch||[]).filter(r=>dates.includes(r.date)).map(normalizeWatchRecord);
    let completed=[...new Set([...items.map(w=>w.date),...watch.map(w=>w.date)])].length, gymDays=[...new Set(items.map(w=>w.date))].length, activityDays=[...new Set(watch.map(w=>w.date))].length;
    let active=watch.reduce((a,r)=>a+n(r.activeCal),0), minutes=Math.round(watch.reduce((a,r)=>a+durationMinutes(r.duration),0));
    let topPart=Object.entries(c.parts).sort((a,b)=>b[1]-a[1])[0]||['-',0], maxDay=Math.max(1,...dates.map(d=>calc(dayData(d)).sets));
    let loadScore=c.sets*12+active+minutes*2, loadLevel=loadScore>=760?'High':loadScore>=360?'Moderate':(loadScore>0?'Low':'No Load'), loadCls=loadLevel==='High'?'high':(loadLevel==='Moderate'?'moderate':'');
    let recoveryNeed=loadLevel==='High'?'Yüksek':(loadLevel==='Moderate'?'Normal':'Düşük');
    let loadAdvice=loadLevel==='High'?'Bu hafta toplam yük belirgin. Sonraki seansta failure yerine kontrollü tempo ve ağrı takibi öncelikli olsun.':(loadLevel==='Moderate'?'Haftalık yük yönetilebilir. Aynı ritmi koru; RPE 8+ birikirse yük artırma.':'Hafta hafif/temiz gidiyor. Veri gelmeye devam ettikçe koç yorumu güçlenecek.');
    let days=dates.map(d=>{let cc=calc(dayData(d)), act=activitySummaryForDate(d), pct=Math.min(100,Math.round((cc.sets/maxDay)*100)), label=getProgramType(dayName(d))||dayName(d), actText=act?` • ${act.emoji} ${act.duration||''}`:''; return `<div class="weeklyDayItem"><b>${trDate(d)}</b><div class="weeklyDayBar"><div class="weeklyDayFill" style="width:${pct}%"></div></div><span>${cc.sets} set • ${Math.round(cc.vol).toLocaleString('tr-TR')} kg • ${label}${actText}</span></div>`;}).join('');
    let avgSets=gymDays?Math.round(c.sets/gymDays):0;
    let verdict=c.sets===0?'Gym verisi yok; varsa aktivite yükü recovery hesabına dahil edilir.':(c.sets<14?'Hafif gym haftası. Toparlanma veya giriş haftası gibi duruyor.':(c.sets<=28?'Dengeli ve yönetilebilir gym haftası.':'Yüksek hacimli gym haftası. Recovery ve ağrı sinyallerini takip et.'));
    weeklyReport.innerHTML=`<div class="weeklyPremiumGrid"><div class="weeklyPremiumCard weeklyLoadStatusCard ${loadCls}"><div class="weeklyPremiumHead"><div><small>Weekly Load Status</small><b>Genel yük ve recovery</b></div><div class="weeklyPremiumPill">${loadLevel}</div></div><div class="weeklyLoadMiniGrid"><div class="weeklyLoadMiniBox"><small>Gym</small><b>${gymDays} gün</b></div><div class="weeklyLoadMiniBox"><small>Activity</small><b>${activityDays} gün</b></div><div class="weeklyLoadMiniBox"><small>Watch</small><b>${minutes} dk</b></div><div class="weeklyLoadMiniBox"><small>Recovery</small><b>${recoveryNeed}</b></div></div><div class="weeklyLoadVerdict"><b>Koç notu:</b> ${loadAdvice}</div></div><div class="weeklyPremiumCard"><div class="weeklyPremiumHead"><div><small>Weekly Load</small><b>${trDate(weekStart)} - ${trDate(addDays(weekStart,6))}</b></div><div class="weeklyPremiumPill">${completed}/7 gün</div></div><div class="weeklyMetricGrid"><div class="weeklyMetricBox"><small>Set</small><b>${c.sets}</b></div><div class="weeklyMetricBox"><small>Tekrar</small><b>${c.reps}</b></div><div class="weeklyMetricBox"><small>Hacim</small><b>${Math.round(c.vol).toLocaleString('tr-TR')} kg</b></div></div><div class="weeklyInsight"><b>Odak:</b> ${topPart[0]} (${topPart[1]} set). <b>Ortalama:</b> ${avgSets} set/gym günü. ${verdict}</div></div><div class="weeklyPremiumCard"><div class="weeklyPremiumHead"><div><small>Day Distribution</small><b>Gün Gün Dağılım</b></div><div class="weeklyPremiumPill">${topPart[0]}</div></div><div class="weeklyDayList">${days}</div></div></div>`;
  };
  const previousRender=window.render;
  if(typeof previousRender==='function'){
    window.render=function(){ previousRender(); try{applyGymSmartCoach();}catch(e){} };
    setTimeout(()=>{try{render();}catch(e){}},0);
  }
})();


;

(function(){
  function trSafeDate(s){
    if(!s || typeof trDate!=='function') return s || '-';
    try{return trDate(s);}catch(e){return s;}
  }
  function ensureImportSummaryBox(){
    let box=document.getElementById('importSummaryBox');
    if(box) return box;
    const universal=document.querySelector('.universalImportCard');
    box=document.createElement('div');
    box.id='importSummaryBox';
    box.className='importSummaryBox';
    box.innerHTML='Import özeti burada görünecek.';
    if(universal) universal.appendChild(box);
    else {
      const data=document.getElementById('data');
      if(data) data.appendChild(box);
    }
    return box;
  }
  function setImportSummary(html){
    const box=ensureImportSummaryBox();
    if(!box) return;
    box.innerHTML=html;
    box.classList.add('active');
  }
  function durationLabel(v){return v || '-';}
  function activityLabel(r){
    try{
      if(typeof normalizeActivityType==='function') return normalizeActivityType(r);
    }catch(e){}
    return r.activityType||r.activity||r.workoutType||r.sport||'Activity';
  }
  function summarizeImport(beforeW,beforeA,beforeD,beforeN,source){
    const newW=(DATA.workouts||[]).slice(beforeW);
    const newA=(DATA.appleWatch||[]).slice(beforeA);
    const newDaily=(DATA.dailyNotes||[]).slice(beforeD);
    const newWeekly=(DATA.weeklyNotes||[]).slice(beforeN);
    if(!newW.length && !newA.length && !newDaily.length && !newWeekly.length){return;}
    let parts=[];
    if(newW.length){
      const dates=[...new Set(newW.map(w=>w.date).filter(Boolean))];
      const ex=[...new Set(newW.map(w=>w.exercise).filter(Boolean))];
      parts.push(`<span class="sumPill">🏋️ <strong>${newW.length}</strong> workout kaydı</span>`);
      if(dates[0]) parts.push(`<span class="sumPill">📅 ${dates.map(trSafeDate).join(', ')}</span>`);
      if(ex.length) parts.push(`<span class="sumPill">${ex.slice(0,3).join(' · ')}${ex.length>3?' +'+(ex.length-3):''}</span>`);
    }
    if(newA.length){
      const dates=[...new Set(newA.map(r=>r.date).filter(Boolean))];
      const types=[...new Set(newA.map(activityLabel))];
      const active=newA.reduce((a,r)=>a+(Number(r.activeCal)||0),0);
      const latest=newA[newA.length-1]||{};
      parts.push(`<span class="sumPill">⌚ <strong>${newA.length}</strong> aktivite</span>`);
      parts.push(`<span class="sumPill">${types.join(' + ')}</span>`);
      if(dates[0]) parts.push(`<span class="sumPill">📅 ${dates.map(trSafeDate).join(', ')}</span>`);
      if(latest.duration) parts.push(`<span class="sumPill">⏱️ ${durationLabel(latest.duration)}</span>`);
      if(active) parts.push(`<span class="sumPill">🔥 ${active} kcal</span>`);
    }
    if(newDaily.length) parts.push(`<span class="sumPill">📝 <strong>${newDaily.length}</strong> daily note</span>`);
    if(newWeekly.length) parts.push(`<span class="sumPill">📅 <strong>${newWeekly.length}</strong> weekly note</span>`);
    setImportSummary(`<b>${source||'Import'} tamamlandı.</b><br>${parts.join('')}`);
  }
  function wrapImportFunction(name,label){
    const old=window[name];
    if(typeof old!=='function' || old.__simurgSummaryWrapped) return;
    const wrapped=function(){
      const beforeW=(DATA.workouts||[]).length;
      const beforeA=(DATA.appleWatch||[]).length;
      const beforeD=(DATA.dailyNotes||[]).length;
      const beforeN=(DATA.weeklyNotes||[]).length;
      const result=old.apply(this,arguments);
      setTimeout(()=>summarizeImport(beforeW,beforeA,beforeD,beforeN,label),0);
      return result;
    };
    wrapped.__simurgSummaryWrapped=true;
    window[name]=wrapped;
  }
  function initImportSummary(){
    ensureImportSummaryBox();
    wrapImportFunction('universalImport','Universal Import');
    wrapImportFunction('importWorkoutJson','Workout JSON import');
    wrapImportFunction('importWatchJson','Apple Watch import');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initImportSummary);
  else initImportSummary();
})();

;

/* Simurg OS Activity Separate Cards v2 hard fix
   Workout Logger: different Apple Watch activity types on the same date render as separate cards.
   Also supports older merged records that stored segments inside one Apple Watch item. */
(function(){
  function safeNum(v){ return Number(v)||0; }
  function cloneWithoutSegments(obj){
    const o={...(obj||{})};
    delete o.segments; delete o.rows; delete o.items;
    return o;
  }
  function normalizeOneWatchSafe(rec){
    try{
      if(typeof normalizeWatchRecord==='function') return normalizeWatchRecord({...rec});
    }catch(e){}
    return {...rec};
  }
  function canonicalActivityType(rec){
    try{
      if(typeof normalizeActivityType==='function') return normalizeActivityType(rec)||'Other';
    }catch(e){}
    return rec.activityType||rec.activity||rec.workoutType||'Other';
  }
  function expandWatchRecord(rec){
    const base=cloneWithoutSegments(rec);
    const segs=Array.isArray(rec&&rec.segments) ? rec.segments : (Array.isArray(rec&&rec.rows) ? rec.rows : null);
    if(segs && segs.length){
      return segs.map(seg=>normalizeOneWatchSafe({
        ...base,
        ...seg,
        date: seg.date || base.date,
        activityType: seg.activityType || seg.activity || seg.workoutType || base.activityType || base.activity || base.workoutType
      }));
    }
    return [normalizeOneWatchSafe(base)];
  }
  window.watchRowsForDate=function(date){
    const out=[];
    (DATA.appleWatch||[]).forEach(rec=>{
      expandWatchRecord(rec).forEach(row=>{ if(row.date===date) out.push(row); });
    });
    return out;
  };
  window.activitySummaryFromRows=function(date, rows){
    rows=(rows||[]).map(normalizeOneWatchSafe);
    if(!rows.length) return null;
    const types=[...new Set(rows.map(canonicalActivityType))];
    const primary=types.length===1?types[0]:'Mixed Activity';
    const emoji=types.length===1?activityEmoji(primary):'⚡';
    const duration=sumDurations(rows);
    const active=rows.reduce((a,r)=>a+safeNum(r.activeCal),0);
    const total=rows.reduce((a,r)=>a+safeNum(r.totalCal),0);
    const distance=rows.reduce((a,r)=>a+safeNum(r.distance),0);
    const avgHR=weightedAvgHR(rows);
    const maxHR=Math.max(0,...rows.map(r=>safeNum(r.maxHR)));
    const rpes=rows.map(r=>safeNum(r.rpe)).filter(Boolean);
    const rpe=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length):'';
    const name=types.length===1?activityDisplayName(primary):types.map(activityDisplayName).join(' + ');
    const dist=formatDistance(distance);
    return {rows,types,primary,name,emoji,duration,active,total,distance,dist,avgHR,maxHR,rpe};
  };
  window.renderActivitySessionCard=function(date){
    const rows=watchRowsForDate(date);
    if(!rows.length) return '';
    const grouped={};
    rows.forEach(r=>{
      const key=canonicalActivityType(r)||'Other';
      if(!grouped[key]) grouped[key]=[];
      grouped[key].push(r);
    });
    return Object.keys(grouped).sort().map(type=>{
      const summary=activitySummaryFromRows(date, grouped[type]);
      if(!summary) return '';
      return renderSingleActivityCard(date, summary).replace('activitySessionCard"', 'activitySessionCard" data-activity-type="'+String(type).replace(/"/g,'&quot;')+'"');
    }).join('');
  };
  window.__simurgActivitySeparateCardsV2=true;
})();

;

/* Simurg OS Activity Delete Confirm v2 FORCE
   Forces confirmation on Workout Logger activity card deletion by overriding the global delete handler late. */
(function(){
  function niceActivityLabel(type){
    try{ return activityDisplayName(type||'Other'); }catch(e){ return type||'Activity'; }
  }
  function niceDateLabel(date){
    try{ return (typeof trDate==='function') ? trDate(date) : date; }catch(e){ return date; }
  }
  function canonicalType(rec){
    try{ return normalizeActivityType(rec)||'Other'; }catch(e){ return rec.activityType||rec.activity||rec.workoutType||'Other'; }
  }
  function removeActivityNow(date,type){
    if(!DATA.appleWatch) DATA.appleWatch=[];
    const before=DATA.appleWatch.length;
    DATA.appleWatch=DATA.appleWatch.filter(r=>{
      if(r.date!==date) return true;
      const rt=canonicalType(r);
      return rt!==type;
    });
    const removed=before-DATA.appleWatch.length;
    if(typeof setImportSummary==='function'){
      try{ setImportSummary(`<b>Activity silindi.</b><br><span class="sumPill">${niceActivityLabel(type)}</span><span class="sumPill">${niceDateLabel(date)}</span><span class="sumPill">${removed} kayıt</span>`); }catch(e){}
    }
    try{ save(); }catch(e){
      try{ localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA)); render(); }catch(err){}
    }
    return false;
  }
  window.deleteActivityCard=function(date,type){
    const label=niceActivityLabel(type||'Other');
    const d=niceDateLabel(date);
    const ok=window.confirm(`${label} aktivitesini ${d} tarihinden silmek istediğine emin misin?\n\nBu işlem sadece Workout Logger'daki bu aktivite kartına ait Apple Watch kayıtlarını kaldırır.`);
    if(!ok) return false;
    return removeActivityNow(date,type||'Other');
  };
  window.deleteActivityCardConfirm=window.deleteActivityCard;
  window.__simurgActivityDeleteConfirmV2Force=true;
})();

;

/* Simurg OS Final Pre-Netlify Polish v1
   Adds: Local Data Status, Activity Quick Note, Cloud success summaries, Stable Mode label. */
(function(){
  const BUILD_NAME='Simurg OS Final Pre-Netlify Polish v1';

  function ensureMeta(){
    if(!window.DATA) return;
    DATA._meta=DATA._meta||{};
    if(!DATA._meta.build) DATA._meta.build=BUILD_NAME;
  }
  function markLocalUpdate(){
    ensureMeta();
    if(DATA&&DATA._meta){
      DATA._meta.lastLocalUpdate=new Date().toISOString();
      DATA._meta.build=BUILD_NAME;
    }
  }
  function fmtDateTime(iso){
    if(!iso) return 'Henüz kayıt yok';
    try{
      const d=new Date(iso);
      if(isNaN(d.getTime())) return String(iso);
      return d.toLocaleString('tr-TR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    }catch(e){return String(iso)}
  }
  function activityTypeOf(r){
    try{return normalizeActivityType(r)||'Other'}catch(e){return r.activityType||r.activity||r.workoutType||'Other'}
  }
  function dataCounts(){
    const workouts=(DATA&&DATA.workouts)||[];
    const watch=(DATA&&DATA.appleWatch)||[];
    const workoutDays=new Set(workouts.map(w=>w.date).filter(Boolean)).size;
    const activityKeys=new Set(watch.map(w=>(w.date||'-')+'::'+activityTypeOf(w))).size;
    const notes=DATA&&DATA.activityNotes?Object.keys(DATA.activityNotes).length:0;
    return {workoutDays, activities:activityKeys, appleWatch:watch.length, notes};
  }
  window.renderDataLocalStatus=function(){
    const el=document.getElementById('localDataStatus');
    if(!el||!window.DATA) return;
    ensureMeta();
    const c=dataCounts();
    const last=(DATA._meta&&DATA._meta.lastLocalUpdate)||'';
    el.innerHTML=`
      <div class="localStatusBox"><small>Last Local Update</small><b>${fmtDateTime(last)}</b></div>
      <div class="localStatusBox"><small>Total Workout Days</small><b>${c.workoutDays}</b></div>
      <div class="localStatusBox"><small>Total Activities</small><b>${c.activities}</b></div>
      <div class="localStatusBox"><small>Apple Watch Entries</small><b>${c.appleWatch}</b></div>
      <div class="localStatusBox"><small>Quick Notes</small><b>${c.notes}</b></div>
      <div class="localStatusBox"><small>Current Build</small><b>${BUILD_NAME}</b></div>`;
  };

  const oldSave=window.save;
  window.save=function(){
    markLocalUpdate();
    try{localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));}catch(e){}
    if(typeof render==='function') render();
    renderDataLocalStatus();
  };
  const oldRender=window.render;
  window.render=function(){
    if(typeof oldRender==='function') oldRender();
    renderDataLocalStatus();
  };

  function noteKey(date,type){return String(date)+'::'+String(type||'Other');}
  function getActivityNote(date,type){
    return (DATA&&DATA.activityNotes&&DATA.activityNotes[noteKey(date,type)])||'';
  }
  window.setActivityQuickNote=function(date,type){
    const key=noteKey(date,type);
    DATA.activityNotes=DATA.activityNotes||{};
    const label=(typeof activityDisplayName==='function')?activityDisplayName(type||'Other'):(type||'Activity');
    const old=DATA.activityNotes[key]||'';
    const val=prompt(`${label} için kısa not yaz. Boş bırakırsan mevcut not silinir.`, old);
    if(val===null) return false;
    const clean=String(val).trim();
    if(clean) DATA.activityNotes[key]=clean; else delete DATA.activityNotes[key];
    save();
    return false;
  };

  // Replace activity card renderer so Quick Note appears on Workout Logger activity cards.
  window.renderSingleActivityCard=function(date,a){
    if(!a) return '';
    const stats=[
      ['Süre', a.duration||'-'],
      ['Aktif', (a.active||0)+' kcal'],
      ['Toplam', (a.total||0)+' kcal'],
      ['Avg HR', a.avgHR? a.avgHR+' bpm':'-'],
      ['Max HR', a.maxHR? a.maxHR+' bpm':'-'],
      ['RPE', a.rpe||'-']
    ];
    if(a.distance) stats.push(['Mesafe', a.dist||a.distance+' m']);
    if(a.rows&&a.rows.length>1) stats.push(['Kayıt',a.rows.length+' segment']);
    const type=a.primary||'Other';
    const note=getActivityNote(date,type);
    const safeType=JSON.stringify(type);
    const safeDate=JSON.stringify(date);
    const noteHtml=note?`<div class="activityQuickNoteBox"><b>Quick Note:</b> ${escapeAttr(note)}</div>`:'';
    return `<div class="activitySessionCard" data-activity-type="${escapeAttr(type)}">
      <div class="activitySessionTop">
        <div class="activitySessionTitle">
          <div class="activityIcon">${a.emoji}</div>
          <div><small>ACTIVITY SESSION</small><b>${escapeAttr(a.name)}</b><span>${trDate(date)} · Workout Logger aktivitesi</span></div>
        </div>
        <div class="activityTopActions">
          <div class="activityPill">${(a.rows&&a.rows.length>1)?'Combined':'Apple Watch'} Load</div>
          <button class="activityNoteBtn" onclick='setActivityQuickNote(${safeDate},${safeType});return false;'>Not</button>
          <button class="activityDeleteBtn" onclick='deleteActivityCard(${safeDate},${safeType});return false;'>Sil</button>
        </div>
      </div>
      <div class="activityStatsGrid">${stats.map(([k,v])=>`<div class="activityStatBox"><small>${k}</small><b>${escapeAttr(v)}</b></div>`).join('')}</div>
      ${noteHtml}
    </div>`;
  };

  function cloudSummaryHtml(prefix, cloudUpdated){
    const c=dataCounts();
    const update=cloudUpdated?` | Cloud: ${fmtDateTime(cloudUpdated)}`:'';
    return `${prefix} | Workout Days: ${c.workoutDays} | Activities: ${c.activities} | Watch Entries: ${c.appleWatch}${update}`;
  }

  if(typeof SIMURG_SUPABASE_URL!=='undefined' && typeof simurgCloudHeaders==='function'){
    window.pushToCloud=async function(){
      try{
        if(!confirm('Bu cihazdaki mevcut Simurg OS verisi buluta gönderilecek ve cloud ana kayıt güncellenecek. Devam edelim mi?')){
          setCloudStatus('Push cancelled.','');
          return;
        }
        markLocalUpdate();
        localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
        setCloudStatus('Pushing local data to cloud...','');
        const now=new Date().toISOString();
        const payload={data:DATA,pushedAt:now,version:'simurg-os-final-pre-netlify-polish-v1'};
        const res=await fetch(SIMURG_SUPABASE_URL + '/rest/v1/simurg_data?on_conflict=id',{
          method:'POST',
          headers:simurgCloudHeaders({'Prefer':'resolution=merge-duplicates,return=representation'}),
          body:JSON.stringify({id:SIMURG_SYNC_ID,payload:payload,updated_at:now})
        });
        if(!res.ok){const txt=await res.text();throw new Error(res.status+' '+txt)}
        setCloudStatus(cloudSummaryHtml('Cloud sync complete: local data pushed successfully.',now),'ok');
        renderDataLocalStatus();
      }catch(err){setCloudStatus('Push failed: '+err.message,'err')}
    };

    window.pullFromCloud=async function(){
      try{
        setCloudStatus('Pulling data from cloud...','');
        const res=await fetch(SIMURG_SUPABASE_URL + '/rest/v1/simurg_data?id=eq.' + encodeURIComponent(SIMURG_SYNC_ID) + '&select=payload,updated_at',{
          method:'GET',headers:simurgCloudHeaders()
        });
        if(!res.ok){const txt=await res.text();throw new Error(res.status+' '+txt)}
        const rows=await res.json();
        if(!rows.length || !rows[0].payload || !rows[0].payload.data){
          setCloudStatus('Cloud has no Simurg OS data yet. Push from one device first.','err');
          return;
        }
        if(!confirm('Pull From Cloud bu cihazdaki mevcut local veriyi buluttaki kayıtla güncelleyecek. Devam edelim mi?')){
          setCloudStatus('Pull cancelled.','');
          return;
        }
        DATA=rows[0].payload.data;
        if(!DATA.appleWatch) DATA.appleWatch=[];
        if(!DATA.dailyNotes) DATA.dailyNotes=[];
        if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
        if(!DATA.customGymPrograms) DATA.customGymPrograms={};
        if(!DATA.programNames) DATA.programNames={};
        if(!DATA.activityNotes) DATA.activityNotes={};
        markLocalUpdate();
        localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
        render();
        setCloudStatus(cloudSummaryHtml('Cloud data pulled successfully.',rows[0].updated_at||''),'ok');
      }catch(err){setCloudStatus('Pull failed: '+err.message,'err')}
    };
  }

  ensureMeta();
  setTimeout(()=>{try{renderDataLocalStatus();}catch(e){}},60);
  window.__simurgFinalPreNetlifyPolishV1=true;
})();

;

(function(){ window.__simurgRemoveRpeGuideV1=true; })();

;

/* Simurg OS Coach Upgrade Pack v1 */
(function(){
  const BUILD='Simurg OS Coach Upgrade Pack v2';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function scoreSet(w){return (Number(w.weight)||0)*1000+(Number(w.reps)||0);}
  function volumeSet(w){return (Number(w.weight)||0)*(Number(w.reps)||0);}
  function bestSetForExercise(ex){
    const rows=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const rows=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));
    const by={}; rows.forEach(w=>{ if(!w.date) return; (by[w.date]=by[w.date]||[]).push(w); });
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      const vol=sets.reduce((s,w)=>s+volumeSet(w),0);
      return {date,sets,best,vol,score:scoreSet(best)};
    });
  }
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri bekleniyor',cls:'flat',line:'Bu hareket için kayıt yok.'};
    const line=sessions.map(s=>`${(typeof trDate==='function'?trDate(s.date):s.date)}: ${Number(s.best.weight)||0}kg x ${Number(s.best.reps)||0}`).join(' → ');
    if(sessions.length<2) return {label:'İlk kayıt',cls:'flat',line};
    const first=sessions[0].score, last=sessions[sessions.length-1].score;
    if(last>first) return {label:'Improving',cls:'up',line};
    if(last<first) return {label:'Fatigue / düşüş',cls:'down',line};
    return {label:'Stable',cls:'flat',line};
  }
  function addGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex) return;
      const old=card.querySelector('.gymInsightBox'); if(old) old.remove();
      const best=bestSetForExercise(ex);
      const tr=trendForExercise(ex);
      const bestText=best?`${Number(best.weight)||0}kg x ${Number(best.reps)||0}`:'Henüz yok';
      const bestDate=best&&best.date?(typeof trDate==='function'?trDate(best.date):best.date):'Kayıt biriktikçe oluşur';
      const html=`<div class="gymInsightBox"><div class="gymInsightCell"><small>Best Set</small><b>${esc(bestText)}</b><span>${esc(bestDate)}</span></div><div class="gymInsightCell"><small>Exercise Trend</small><b>${esc(tr.label)}</b><span>${esc(tr.line)}</span><span class="gymTrendPill ${esc(tr.cls)}">Son 3 kayıt</span></div></div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function weeklyRecommendation(){
    const days=(typeof weekDates==='function'?weekDates():[]);
    const workoutRows=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=(typeof calc==='function'?calc(workoutRows):{sets:0,reps:0,vol:0,parts:{}});
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const activities=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actDays=new Set(activities.map(a=>a.date)).size;
    const minutes=activities.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const painWarn=workoutRows.filter(w=>String(w.pain||'None')!=='None').length;
    const rpes=workoutRows.map(w=>Number(w.rpe)||0).filter(Boolean);
    const avgRpe=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length):0;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let verdict='Veri biriktikçe gelecek hafta önerisi daha netleşir.';
    if(c.sets===0 && activities.length) verdict='Bu hafta gym kaydı yok ama activity yükü var. Gelecek hafta düşük-orta hacimli kontrollü dönüş iyi olur.';
    else if(c.sets<14) verdict='Hafta hafif geçmiş. Ağrı yoksa gelecek hafta ana hareketlerde küçük tekrar artışı denenebilir.';
    else if(c.sets<=28 && avgRpe<=8 && !painWarn) verdict='Yük dengeli görünüyor. Gelecek hafta aynı yapıyı koruyup 1-2 ana harekette küçük progresyon hedefle.';
    else if(c.sets>28 || avgRpe>8 || painWarn) verdict='Yük/stres yüksek tarafa yakın. Gelecek hafta formu koru, ağrı sinyali varsa hacmi %10-15 azalt.';
    const focus=topPart[0]&&topPart[0]!=='-'?`${topPart[0]} baskın; zayıf kalan bölgeleri dengede tut.`:'Önce düzenli veri biriktir.';
    return {verdict,focus,gymDays,actDays,minutes:Math.round(minutes),avgRpe:avgRpe?avgRpe.toFixed(1):'-',painWarn};
  }
  function addWeeklyRecommendation(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap) return;
    const grid=wrap.querySelector('.weeklyPremiumGrid'); if(!grid) return;
    const old=grid.querySelector('.weeklyRecommendationCard'); if(old) old.remove();
    const r=weeklyRecommendation();
    grid.insertAdjacentHTML('beforeend',`<div class="weeklyPremiumCard weeklyRecommendationCard"><div class="weeklyPremiumHead"><div><small>Coach Weekly Recommendation</small><b>Gelecek hafta yönlendirmesi</b></div><div class="weeklyPremiumPill">Coach v1</div></div><div class="weeklyRecommendationBody"><div class="weeklyRecommendationText"><b>Öneri:</b> ${esc(r.verdict)}<br><b>Odak:</b> ${esc(r.focus)}</div><div class="weeklyRecommendationChecklist"><div class="weeklyRecommendationItem"><small>Gym</small><b>${r.gymDays} gün</b></div><div class="weeklyRecommendationItem"><small>Activity</small><b>${r.actDays} gün / ${r.minutes} dk</b></div><div class="weeklyRecommendationItem"><small>Avg RPE</small><b>${r.avgRpe}</b></div><div class="weeklyRecommendationItem"><small>Pain Flags</small><b>${r.painWarn}</b></div></div></div></div>`);
  }
  function applyCoachUpgrade(){
    try{addGymInsights();}catch(e){console.warn('gym insights',e)}
    try{addWeeklyRecommendation();}catch(e){console.warn('weekly rec',e)}
  }
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); applyCoachUpgrade(); };
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){ prevWeekly(); setTimeout(()=>{try{addWeeklyRecommendation();}catch(e){}},0); };
  }
  setTimeout(applyCoachUpgrade,80);
  window.__simurgCoachUpgradePackV2=true;
})();

;

/* Simurg OS Premium Coach Insights v1 */
(function(){
  const BUILD='Simurg OS Premium Coach Insights v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volumeSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSetForExercise(ex){
    const rows=rowsForExercise(ex);
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const by={};
    rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      return {date,sets,best,score:scoreSet(best),volume:sets.reduce((s,w)=>s+volumeSet(w),0)};
    });
  }
  function fmtDate(d){return typeof trDate==='function'?trDate(d):d;}
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri bekleniyor',cls:'empty',line:'Bu hareket için henüz kayıt yok.',target:'İlk temiz kaydı oluştur; sonra sistem hedef önermeye başlar.'};
    const line=sessions.map(s=>`${fmtDate(s.date)}: ${n(s.best.weight)}kg x ${n(s.best.reps)}`).join(' → ');
    if(sessions.length<2){
      const b=sessions[0].best;
      return {label:'İlk kayıt',cls:'flat',line,target:`Sonraki seans aynı formda ${n(b.weight)}kg x ${n(b.reps)+1} dene veya RPE yüksekse aynı hedefi koru.`};
    }
    const first=sessions[0].score,last=sessions[sessions.length-1].score,b=sessions[sessions.length-1].best;
    const reps=n(b.reps), weight=n(b.weight);
    if(last>first) return {label:'Improving',cls:'up',line,target:`Form temizse sıradaki hedef: ${weight}kg x ${reps+1}. RPE 8+ olursa aynı kiloda kaliteyi koru.`};
    if(last<first) return {label:'Fatigue / düşüş',cls:'down',line,target:`Sıradaki seans yükü zorlamadan ${weight}kg civarında temiz tekrar hedefle; ağrı varsa hacmi azalt.`};
    return {label:'Stable',cls:'flat',line,target:`Stabil gidiyor. Önce aynı kiloda +1 tekrar; rahat gelirse sonraki seans küçük kilo artışı.`};
  }
  function addPremiumGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex)return;
      card.querySelectorAll('.gymInsightBox').forEach(x=>x.remove());
      const best=bestSetForExercise(ex), tr=trendForExercise(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const bestDate=best&&best.date?fmtDate(best.date):'Kayıt biriktikçe oluşur';
      const html=`<div class="gymInsightBox premiumCoachInsight">
        <div class="premiumInsightCard"><small>Best Set</small><b>${esc(bestText)}</b><span>${esc(bestDate)}</span></div>
        <div class="premiumInsightCard"><small>Exercise Trend</small><b>${esc(tr.label)}</b><span>${esc(tr.line)}</span><span class="gymTrendPill premium ${esc(tr.cls)}">Son 3 kayıt</span></div>
        <div class="premiumInsightCard premiumCoachTarget"><small>Next Target</small><b>${esc(tr.target)}</b></div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function selectedWeekDays(){return typeof weekDates==='function'?weekDates():[];}
  function weeklyPremiumRecommendation(){
    const days=selectedWeekDays();
    const workouts=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actDays=new Set(acts.map(a=>a.date)).size;
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const painFlags=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean);
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let status='Data Building', verdict='Veri biriktikçe haftalık koç raporu daha keskinleşir.', next='Gelecek hafta 3-4 temiz kayıt oluştur; RPE/Form/Pain alanlarını dolu tut.';
    if(c.sets===0 && acts.length){status='Activity Week';verdict='Bu hafta gym yükü düşük, aktivite yükü mevcut. Sistem bunu aktif toparlanma/conditioning haftası gibi okuyor.';next='Gelecek hafta gym’e kontrollü dönüş: ilk ana hareketlerde RPE 6-7 bandını hedefle.';}
    else if(c.sets<14){status='Light Load';verdict='Gym yükü hafif tarafta. Ağrı sinyali yoksa gelişim için küçük progresyon alanı var.';next='1-2 ana harekette aynı kiloda +1 tekrar hedefle; form bozulursa hedefi sabitle.';}
    else if(c.sets<=28 && avgRpe<=8 && !painFlags){status='Productive';verdict='Hafta dengeli ve üretken görünüyor. Yük, RPE ve toparlanma tarafı final kullanım için iyi seviyede.';next='Programı koru; sadece en iyi hissettiren 1-2 harekette mikro progresyon uygula.';}
    else {status='Recovery Watch';verdict='Yük, RPE veya pain sinyalleri yüksek tarafa yaklaşıyor. Bu hafta kaliteyi korumak hacim artırmaktan daha değerli.';next='Gelecek hafta hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';}
    const focus=topPart[0]&&topPart[0]!=='-'?`${topPart[0]} baskın (${topPart[1]} set). Zayıf kalan bölgeleri kontrollü dengele.`:'Henüz net kas grubu odağı yok.';
    return {status,verdict,next,focus,gymDays,actDays,minutes:Math.round(minutes),avgRpe:avgRpe?avgRpe.toFixed(1):'-',painFlags,sets:c.sets,vol:Math.round(c.vol||0)};
  }
  function addPremiumWeeklyRecommendation(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap)return;
    const grid=wrap.querySelector('.weeklyPremiumGrid'); if(!grid)return;
    grid.querySelectorAll('.weeklyRecommendationCard').forEach(x=>x.remove());
    const r=weeklyPremiumRecommendation();
    grid.insertAdjacentHTML('beforeend',`<div class="weeklyPremiumCard weeklyRecommendationCard premiumWeeklyCoach">
      <div class="weeklyPremiumHead"><div><small>Premium Coach Recommendation</small><b>Gelecek hafta stratejisi</b></div><div class="weeklyPremiumPill">${esc(r.status)}</div></div>
      <div class="weeklyRecommendationBody">
        <div class="premiumCoachVerdict"><h4>Coach Verdict</h4><p>${esc(r.verdict)}<br><b>Odak:</b> ${esc(r.focus)}</p><div class="coachNextLine"><b>Next Week Target:</b> ${esc(r.next)}</div></div>
        <div class="premiumRecommendationGrid">
          <div class="weeklyRecommendationItem"><small>Gym</small><b>${r.gymDays} gün</b></div>
          <div class="weeklyRecommendationItem"><small>Activity</small><b>${r.actDays} gün / ${r.minutes} dk</b></div>
          <div class="weeklyRecommendationItem"><small>Avg RPE</small><b>${r.avgRpe}</b></div>
          <div class="weeklyRecommendationItem"><small>Pain Flags</small><b>${r.painFlags}</b></div>
          <div class="weeklyRecommendationItem premiumRecommendationItemWide"><small>Weekly Volume</small><b>${r.sets} set • ${r.vol.toLocaleString('tr-TR')} kg</b></div>
        </div>
      </div>
    </div>`);
  }
  function applyPremiumCoach(){
    try{addPremiumGymInsights();}catch(e){console.warn('premium gym insights',e)}
    try{addPremiumWeeklyRecommendation();}catch(e){console.warn('premium weekly recommendation',e)}
  }
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(applyPremiumCoach,0);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){prevWeekly();setTimeout(addPremiumWeeklyRecommendation,0);};
  }
  setTimeout(applyPremiumCoach,120);
  window.__simurgPremiumCoachInsightsV1=true;
})();

;

/* Simurg OS Premium Coach Insights v2 Compact Gym */
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volumeSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSetForExercise(ex){
    const rows=rowsForExercise(ex);
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const by={};
    rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      return {date,sets,best,score:scoreSet(best)};
    });
  }
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri yok',cls:'empty',target:'İlk temiz kaydı oluştur.'};
    if(sessions.length<2){
      const b=sessions[0].best;
      return {label:'İlk kayıt',cls:'flat',target:`Sonraki hedef: ${n(b.weight)}kg x ${n(b.reps)+1}`};
    }
    const first=sessions[0].score,last=sessions[sessions.length-1].score,b=sessions[sessions.length-1].best;
    if(last>first) return {label:'Improving',cls:'up',target:`Next: ${n(b.weight)}kg x ${n(b.reps)+1}`};
    if(last<first) return {label:'Fatigue',cls:'down',target:`Next: yükü zorlamadan temiz form.`};
    return {label:'Stable',cls:'flat',target:'Next: aynı kiloda +1 tekrar.'};
  }
  function applyCompactGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex)return;
      card.querySelectorAll('.gymInsightBox').forEach(x=>x.remove());
      card.querySelectorAll('.gymCompactInsight').forEach(x=>x.remove());
      const best=bestSetForExercise(ex), tr=trendForExercise(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const html=`<div class="gymCompactInsight">
        <div class="gymCompactInsightTop">
          <div class="gymCompactInsightTitle">Coach Insight</div>
          <div class="gymCompactInsightMeta">
            <span class="gymCompactPill"><small>Best</small>${esc(bestText)}</span>
            <span class="gymCompactPill ${esc(tr.cls)}"><small>Trend</small>${esc(tr.label)}</span>
          </div>
        </div>
        <div class="gymCompactTarget"><b>Next Target:</b> ${esc(tr.target)}</div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function apply(){try{applyCompactGymInsights();}catch(e){console.warn('compact gym insight',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,20);};
  setTimeout(apply,180);
  window.__simurgPremiumCoachInsightsV2CompactGym=true;
})();

;

/* Simurg OS Program Intelligence v1: Undo Import, Exercise Readiness, Recovery Debt, Program Quality, Monthly Review */
(function(){
  const BUILD='Simurg OS Program Intelligence v1';
  const SNAP_KEY='simurg_last_import_snapshot_v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function clone(obj){return JSON.parse(JSON.stringify(obj||{}));}
  function countData(d){
    d=d||{};
    return {
      workouts:(d.workouts||[]).length,
      watch:(d.appleWatch||[]).length,
      daily:(d.dailyNotes||[]).length,
      weekly:(d.weeklyNotes||[]).length,
      activityNotes:d.activityNotes?Object.keys(d.activityNotes).length:0
    };
  }
  function changed(a,b){return JSON.stringify(countData(a))!==JSON.stringify(countData(b));}
  function setUndoStatus(msg){
    const el=document.getElementById('undoImportMiniStatus');
    if(el) el.textContent=msg||'';
  }
  function snapshotBeforeImport(before){
    try{
      const meta={at:new Date().toISOString(),counts:countData(before),selectedDate:window.selectedDate||''};
      localStorage.setItem(SNAP_KEY,JSON.stringify({meta,data:before}));
    }catch(e){console.warn('undo snapshot failed',e)}
  }
  window.undoLastImport=function(){
    try{
      const raw=localStorage.getItem(SNAP_KEY);
      if(!raw){alert('Geri alınacak son import kaydı yok.');return;}
      const snap=JSON.parse(raw);
      const time=snap.meta&&snap.meta.at?new Date(snap.meta.at).toLocaleString('tr-TR'):'son import';
      if(!confirm('Son Universal Import geri alınacak.\nSnapshot zamanı: '+time+'\nDevam edelim mi?')) return;
      window.DATA=snap.data;
      DATA=window.DATA;
      if(!DATA.appleWatch) DATA.appleWatch=[];
      if(!DATA.dailyNotes) DATA.dailyNotes=[];
      if(!DATA.weeklyNotes) DATA.weeklyNotes=[];
      if(!DATA.customGymPrograms) DATA.customGymPrograms={};
      if(!DATA.programNames) DATA.programNames={};
      if(!DATA.activityNotes) DATA.activityNotes={};
      if(snap.meta&&snap.meta.selectedDate) selectedDate=snap.meta.selectedDate;
      localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
      localStorage.removeItem(SNAP_KEY);
      if(typeof render==='function') render();
      setUndoStatus('Son import geri alındı.');
      alert('Son import geri alındı.');
    }catch(e){alert('Undo başarısız: '+e.message);}
  };
  function enhanceUniversalImportUI(){
    const card=document.querySelector('.universalImportCard'); if(!card) return;
    const actions=card.querySelector('.actions'); if(!actions) return;
    if(!document.getElementById('undoLastImportBtn')){
      actions.insertAdjacentHTML('beforeend',`<button id="undoLastImportBtn" class="btn sec undoImportBtn" onclick="undoLastImport()">Undo Last Import</button><div id="undoImportMiniStatus" class="undoImportMiniStatus"></div>`);
    }
    const raw=localStorage.getItem(SNAP_KEY);
    if(raw){
      try{const s=JSON.parse(raw); const t=s.meta&&s.meta.at?new Date(s.meta.at).toLocaleString('tr-TR'):''; setUndoStatus(t?`Geri alınabilir son import: ${t}`:'Son import geri alınabilir.');}catch(e){}
    }else setUndoStatus('');
  }
  const originalUniversal=window.universalImport;
  if(typeof originalUniversal==='function' && !window.__simurgUndoUniversalWrapped){
    window.universalImport=function(){
      const before=clone(window.DATA||DATA);
      const beforeCounts=JSON.stringify(countData(before));
      originalUniversal.apply(this,arguments);
      setTimeout(()=>{
        try{
          const after=window.DATA||DATA;
          if(beforeCounts!==JSON.stringify(countData(after))){
            snapshotBeforeImport(before);
            enhanceUniversalImportUI();
          }
        }catch(e){}
      },30);
    };
    window.__simurgUndoUniversalWrapped=true;
  }

  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSet(ex){const rows=rowsForExercise(ex);return rows.length?rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volSet(b)-volSet(a))[0]:null;}
  function sessions(ex){
    const by={}; rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volSet(b)-volSet(a))[0];
      const rpes=sets.map(x=>n(x.rpe)).filter(Boolean);
      const pain=sets.some(x=>String(x.pain||'None')!=='None');
      const badForm=sets.some(x=>/poor|bad|zayıf|kötü|orta/i.test(String(x.form||'')));
      return {date,sets,best,score:scoreSet(best),avgRpe:rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0,pain,badForm};
    });
  }
  function readiness(ex){
    const s=sessions(ex).slice(-3);
    if(!s.length) return {label:'Data Building',cls:'empty',target:'İlk temiz kaydı oluştur.',reason:'Henüz hareket geçmişi yok.'};
    const last=s[s.length-1], first=s[0], b=last.best;
    const pain=s.some(x=>x.pain), badForm=s.some(x=>x.badForm), highRpe=s.some(x=>x.avgRpe>=9);
    if(pain) return {label:'Deload Watch',cls:'deload',target:'Yükü zorlamadan ağrı sinyalini takip et.',reason:'Son kayıtlarda pain işareti var.'};
    if(badForm) return {label:'Form First',cls:'form',target:'Aynı yükte daha temiz form hedefle.',reason:'Form kalitesi önce gelmeli.'};
    if(highRpe) return {label:'Hold Load',cls:'hold',target:'Aynı kiloda temiz tekrar; RPE 7-8 bandını ara.',reason:'RPE yüksek tarafa çıkmış.'};
    if(s.length>1 && last.score>first.score) return {label:'Ready to Progress',cls:'ready',target:`Next: ${n(b.weight)}kg x ${n(b.reps)+1}`,reason:'Trend yukarı ve risk sinyali düşük.'};
    if(s.length>1 && last.score<first.score) return {label:'Recovery Check',cls:'hold',target:'Bugün progresyon değil kalite hedefle.',reason:'Son 3 kayıtta düşüş var.'};
    return {label:'Hold Load',cls:'hold',target:'Aynı kiloda +1 temiz tekrar hedefle.',reason:'Trend stabil; küçük tekrar artışı uygun.'};
  }
  function applyExerciseReadiness(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||''; if(!ex) return;
      card.querySelectorAll('.gymCompactInsight').forEach(x=>x.remove());
      const best=bestSet(ex), rd=readiness(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const html=`<div class="gymCompactInsight">
        <div class="gymCompactInsightTop">
          <div class="gymCompactInsightTitle">Coach Insight</div>
          <div class="gymCompactInsightMeta">
            <span class="gymCompactPill"><small>Best</small>${esc(bestText)}</span>
            <span class="gymCompactPill ${esc(rd.cls)}"><small>Ready</small>${esc(rd.label)}</span>
          </div>
        </div>
        <div class="gymCompactTarget"><b>Next Target:</b> ${esc(rd.target)} <span style="color:#7f90a8">${esc(rd.reason)}</span></div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }

  function currentWeekDays(){return typeof weekDates==='function'?weekDates():[];}
  function weekStats(){
    const days=currentWeekDays();
    const workouts=days.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>days.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=days.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    return {days,workouts,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays};
  }
  function recoveryDebt(st){
    let score=0;
    if(st.avgRpe>=8.5)score+=28; else if(st.avgRpe>=7.5)score+=16;
    if(st.c.sets>28)score+=24; else if(st.c.sets>22)score+=14;
    if(st.actMinutes>150)score+=18; else if(st.actMinutes>90)score+=10;
    if(st.activeCal>900)score+=12; else if(st.activeCal>500)score+=6;
    if(st.pain)score+=28;
    if(st.gymDays+st.actDays>=6)score+=12;
    score=Math.min(100,Math.round(score));
    let label='Low', cls='good', text='Toparlanma borcu düşük. Küçük progresyon için zemin uygun.';
    if(score>=65){label='High';cls='risk';text='Toparlanma borcu yüksek. Gelecek hafta hacmi azaltıp form/uyku kalitesini öne al.';}
    else if(score>=35){label='Moderate';cls='warn';text='Orta seviye yük birikimi var. Ana hareketlerde agresif artış yerine kontrollü mikro progresyon daha doğru.';}
    return {score,label,cls,text};
  }
  function qualityScore(st,debt){
    let q=100;
    if(st.gymDays<2)q-=18; else if(st.gymDays>5)q-=10;
    if(st.c.sets<10)q-=12; else if(st.c.sets>32)q-=15;
    if(st.avgRpe>8.5)q-=18; else if(st.avgRpe && st.avgRpe<5.5)q-=8;
    if(st.pain)q-=22;
    if(debt.score>65)q-=16; else if(debt.score>35)q-=8;
    if(st.actDays>=1 && st.gymDays>=2)q+=4;
    q=Math.max(0,Math.min(100,Math.round(q)));
    let cls=q>=78?'good':q>=60?'warn':'risk';
    let label=q>=78?'High Quality':q>=60?'Manageable':'Needs Control';
    let text=q>=78?'Hafta dengeli ve sürdürülebilir. Kaliteyi koruyup küçük hedeflerle ilerle.':q>=60?'Genel yapı kullanılabilir ama yük, RPE veya ağrı sinyalini dikkatli yönet.':'Program kalitesi düşmüş görünüyor. Öncelik toparlanma, form ve düzenli kayıt olmalı.';
    return {q,cls,label,text};
  }
  function monthlyStats(){
    const base=(window.selectedDate||new Date().toISOString().slice(0,10));
    const ym=String(base).slice(0,7);
    const workouts=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.date||'').startsWith(ym));
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>String(a.date||'').startsWith(ym));
    const days=new Set(workouts.map(w=>w.date));
    const actDays=new Set(acts.map(a=>a.date));
    const c=typeof calc==='function'?calc(workouts):{sets:0,vol:0,parts:{}};
    const exCount={}; workouts.forEach(w=>{const ex=w.exercise||'Unknown';exCount[ex]=(exCount[ex]||0)+1;});
    const topEx=Object.entries(exCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    let verdict='Veri biriktikçe aylık değerlendirme daha anlamlı olacak.';
    if(days.size>=8 && !pain) verdict='Ay düzenli ve temiz ilerliyor. Ana hedef: sürdürülebilir progresyon.';
    else if(pain) verdict='Ay içinde pain sinyali var. Gelecek blokta yükten önce hareket kalitesi takip edilmeli.';
    else if(days.size<4 && acts.length) verdict='Gym az, activity mevcut. Bu ay daha çok conditioning/recovery karakteri taşıyor.';
    return {ym,days:days.size,actDays:actDays.size,sets:c.sets,vol:Math.round(c.vol||0),topEx:topEx[0],topPart:topPart[0],pain,minutes:Math.round(minutes),verdict};
  }
  function addProgramIntelligence(){
    const wrap=document.getElementById('weeklyReport'); if(!wrap) return;
    wrap.querySelectorAll('.programIntelGrid').forEach(x=>x.remove());
    const st=weekStats(), debt=recoveryDebt(st), qs=qualityScore(st,debt), m=monthlyStats();
    const html=`<div class="programIntelGrid">
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Recovery Debt</small><b>${esc(debt.label)}</b></div><div class="programIntelScore ${esc(debt.cls)}">${debt.score}</div></div>
        <div class="programIntelText">${esc(debt.text)}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Avg RPE</small><b>${st.avgRpe?st.avgRpe.toFixed(1):'-'}</b></div><div class="programIntelMini"><small>Activity</small><b>${Math.round(st.actMinutes)} dk</b></div></div>
      </div>
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Program Quality</small><b>${esc(qs.label)}</b></div><div class="programIntelScore ${esc(qs.cls)}">${qs.q}</div></div>
        <div class="programIntelText">${esc(qs.text)}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Gym</small><b>${st.gymDays} gün</b></div><div class="programIntelMini"><small>Pain</small><b>${st.pain}</b></div></div>
      </div>
      <div class="programIntelCard">
        <div class="programIntelHead"><div><small>Weekly Focus</small><b>${st.c.sets?esc((Object.entries(st.c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['-'])[0]):'Data Building'}</b></div><div class="programIntelScore ${st.c.sets?'good':'warn'}">${st.c.sets}</div></div>
        <div class="programIntelText">${st.c.sets?`Bu hafta ${st.c.sets} set ve ${Math.round(st.c.vol||0).toLocaleString('tr-TR')} kg hacim kaydedildi.`:'Bu hafta için henüz yeterli gym verisi yok.'}</div>
        <div class="programIntelMiniGrid"><div class="programIntelMini"><small>Volume</small><b>${Math.round(st.c.vol||0).toLocaleString('tr-TR')} kg</b></div><div class="programIntelMini"><small>Active kcal</small><b>${Math.round(st.activeCal)}</b></div></div>
      </div>
      <div class="programIntelCard monthlyReviewCard">
        <div class="programIntelHead"><div><small>Monthly Review</small><b>${esc(m.ym)} blok özeti</b></div><div class="programIntelScore ${m.pain?'warn':'good'}">${m.days}</div></div>
        <div class="programIntelText">${esc(m.verdict)}</div>
        <div class="monthlyReviewList">
          <div class="monthlyReviewItem"><small>Gym Days</small><b>${m.days}</b></div>
          <div class="monthlyReviewItem"><small>Activity Days</small><b>${m.actDays}</b></div>
          <div class="monthlyReviewItem"><small>Total Sets</small><b>${m.sets}</b></div>
          <div class="monthlyReviewItem"><small>Volume</small><b>${m.vol.toLocaleString('tr-TR')} kg</b></div>
          <div class="monthlyReviewItem"><small>Top Exercise</small><b>${esc(m.topEx)}</b></div>
          <div class="monthlyReviewItem"><small>Top Focus</small><b>${esc(m.topPart)}</b></div>
          <div class="monthlyReviewItem"><small>Activity Time</small><b>${m.minutes} dk</b></div>
          <div class="monthlyReviewItem"><small>Pain Flags</small><b>${m.pain}</b></div>
        </div>
      </div>
    </div>`;
    wrap.insertAdjacentHTML('beforeend',html);
  }
  function updateBuildBadge(){
    const b=document.querySelector('.versionBadgeCard b'); if(b) b.textContent=BUILD;
    const s=document.querySelector('.versionBadgeCard span'); if(s) s.textContent='Universal Import · Undo · Exercise Readiness · Recovery Debt · Program Quality · Monthly Review';
  }
  function applyAll(){
    try{enhanceUniversalImportUI();}catch(e){}
    try{applyExerciseReadiness();}catch(e){console.warn('exercise readiness',e)}
    try{addProgramIntelligence();}catch(e){console.warn('program intelligence',e)}
    try{updateBuildBadge();}catch(e){}
  }
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(applyAll,60);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function'){
    window.renderWeeklyReport=function(){prevWeekly();setTimeout(addProgramIntelligence,60);};
  }
  setTimeout(applyAll,240);
  window.__simurgProgramIntelligenceV1=true;
})();

;

(function(){
  if(window.__simurgMonthlyReviewPanelV1) return;
  window.__simurgMonthlyReviewPanelV1=true;
  function esc2(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function durMin(v){
    if(typeof durationMinutes==='function') return durationMinutes(v);
    const s=String(v||''); const p=s.split(':').map(Number);
    if(p.length>=2 && p.every(n=>!isNaN(n))) return p[0]+p[1]/60;
    const n=parseFloat(s); return isNaN(n)?0:n;
  }
  function monthlyStatsStandalone(){
    const base=(window.selectedDate||new Date().toISOString().slice(0,10));
    const ym=String(base).slice(0,7);
    const workouts=((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.date||'').startsWith(ym));
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>String(a.date||'').startsWith(ym));
    const gymDays=new Set(workouts.map(w=>w.date));
    const actDays=new Set(acts.map(a=>a.date));
    const sets=workouts.length;
    const reps=workouts.reduce((s,w)=>s+(+w.reps||0),0);
    const vol=Math.round(workouts.reduce((s,w)=>s+((+w.weight||0)*(+w.reps||0)),0));
    const exCount={}, partCount={};
    workouts.forEach(w=>{const ex=w.exercise||'Unknown'; exCount[ex]=(exCount[ex]||0)+1; const bp=w.bodyPart||(typeof part==='function'?part(w.exercise):'Other'); partCount[bp]=(partCount[bp]||0)+1;});
    const topEx=Object.entries(exCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const topPart=Object.entries(partCount).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const minutes=Math.round(acts.reduce((s,a)=>s+durMin(a.duration),0));
    const activeCal=Math.round(acts.reduce((s,a)=>s+(+a.activeCal||+a.active||0),0));
    const avgRpeVals=workouts.concat(acts).map(x=>+x.rpe||0).filter(Boolean);
    const avgRpe=avgRpeVals.length?(avgRpeVals.reduce((a,b)=>a+b,0)/avgRpeVals.length):0;
    let verdict='Veri biriktikçe aylık değerlendirme daha anlamlı olacak.';
    let coach='Bu ay için temel hedef: kayıt düzenini koru, ağrı sinyalini düşük tut ve progresyonu küçük adımlarla yönet.';
    if(gymDays.size>=8 && !pain && avgRpe<=8){verdict='Ay düzenli ve sürdürülebilir ilerliyor.'; coach='Bir sonraki blokta ana hareketlerde küçük tekrar artışı veya kontrollü kilo artışı denenebilir.';}
    else if(pain){verdict='Ay içinde pain sinyali var.'; coach='Gelecek blokta öncelik yük artışı değil; form kalitesi, ağrı takibi ve gerekirse deload olmalı.';}
    else if(gymDays.size<4 && acts.length){verdict='Gym hacmi düşük, activity tarafı daha baskın.'; coach='Bir sonraki ayda gym günlerini daha düzenli sabitlemek program kalitesini artırır.';}
    else if(minutes>240 && gymDays.size>=6){verdict='Gym ve activity yükü birlikte anlamlı seviyede.'; coach='Recovery debt birikmemesi için zor günlerden sonra daha kontrollü seans planla.';}
    return {ym,gymDays:gymDays.size,actDays:actDays.size,sets,reps,vol,topEx:topEx[0],topPart:topPart[0],pain,minutes,activeCal,avgRpe,verdict,coach};
  }
  window.renderMonthlyReviewPanel=function(){
    const wrap=document.getElementById('monthlyReport');
    if(!wrap) return;
    const m=monthlyStatsStandalone();
    const score=Math.max(0,Math.min(100, Math.round(62 + Math.min(m.gymDays,12)*2 + Math.min(m.actDays,8) - m.pain*7 - (m.avgRpe>8?8:0))));
    wrap.innerHTML=`<div class="monthlyStandaloneHero">
      <div class="monthlyStandaloneHead"><div><small>Monthly Review</small><b>${esc2(m.ym)} blok özeti</b></div><div class="monthlyStandaloneScore"><strong>${score}</strong><span>Quality</span></div></div>
      <div class="monthlyStandaloneText">${esc2(m.verdict)}</div>
      <div class="monthlyStandaloneGrid">
        <div class="monthlyStandaloneItem"><small>Gym Days</small><b>${m.gymDays}</b></div>
        <div class="monthlyStandaloneItem"><small>Activity Days</small><b>${m.actDays}</b></div>
        <div class="monthlyStandaloneItem"><small>Total Sets</small><b>${m.sets}</b></div>
        <div class="monthlyStandaloneItem"><small>Volume</small><b>${m.vol.toLocaleString('tr-TR')} kg</b></div>
        <div class="monthlyStandaloneItem"><small>Top Exercise</small><b>${esc2(m.topEx)}</b></div>
        <div class="monthlyStandaloneItem"><small>Top Focus</small><b>${esc2(m.topPart)}</b></div>
        <div class="monthlyStandaloneItem"><small>Activity Time</small><b>${m.minutes} dk</b></div>
        <div class="monthlyStandaloneItem"><small>Pain Flags</small><b>${m.pain}</b></div>
      </div>
      <div class="monthlyStandaloneCoach"><b>Coach note:</b> ${esc2(m.coach)}</div>
    </div>`;
  };
  function cleanupWeeklyMonthly(){document.querySelectorAll('#weeklyReport .monthlyReviewCard').forEach(x=>x.remove());}
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); setTimeout(()=>{try{cleanupWeeklyMonthly();renderMonthlyReviewPanel();}catch(e){}},80); };
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function') window.renderWeeklyReport=function(){prevWeekly();setTimeout(cleanupWeeklyMonthly,90);};
  setTimeout(()=>{try{cleanupWeeklyMonthly();renderMonthlyReviewPanel();}catch(e){}},260);
})();

;

/* Program Intelligence Panel v1 */
(function(){
  const BUILD='Simurg OS Program Intelligence Panel v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function days(){return typeof weekDates==='function'?weekDates():[];}
  function st(){
    const ds=days();
    const workouts=ds.flatMap(d=>typeof dayData==='function'?dayData(d):[]);
    const c=typeof calc==='function'?calc(workouts):{sets:0,reps:0,vol:0,parts:{}};
    const acts=((typeof DATA!=='undefined'&&DATA.appleWatch)||[]).filter(a=>ds.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=workouts.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0;
    const pain=workouts.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=ds.filter(d=>(typeof dayData==='function'?dayData(d):[]).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['Data Building',0];
    return {ds,workouts,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays,topPart};
  }
  function recovery(x){
    let score=0;
    if(x.avgRpe>=8.5)score+=28; else if(x.avgRpe>=7.5)score+=16;
    if(x.c.sets>28)score+=24; else if(x.c.sets>22)score+=14;
    if(x.actMinutes>150)score+=18; else if(x.actMinutes>90)score+=10;
    if(x.activeCal>900)score+=12; else if(x.activeCal>500)score+=6;
    if(x.pain)score+=28;
    if(x.gymDays+x.actDays>=6)score+=12;
    score=Math.min(100,Math.round(score));
    if(score>=65)return {score,label:'High',cls:'risk',text:'Toparlanma borcu yüksek. Gelecek hafta hacmi azaltıp form/uyku kalitesini öne almak daha doğru.'};
    if(score>=35)return {score,label:'Moderate',cls:'warn',text:'Orta seviye yük birikimi var. Ana hareketlerde agresif artış yerine kontrollü mikro progresyon daha güvenli.'};
    return {score,label:'Low',cls:'good',text:'Toparlanma borcu düşük. Küçük progresyon için zemin uygun görünüyor.'};
  }
  function quality(x,d){
    let q=100;
    if(x.gymDays<2)q-=18; else if(x.gymDays>5)q-=10;
    if(x.c.sets<10)q-=12; else if(x.c.sets>32)q-=15;
    if(x.avgRpe>8.5)q-=18; else if(x.avgRpe && x.avgRpe<5.5)q-=8;
    if(x.pain)q-=22;
    if(d.score>65)q-=16; else if(d.score>35)q-=8;
    if(x.actDays>=1 && x.gymDays>=2)q+=4;
    q=Math.max(0,Math.min(100,Math.round(q)));
    const cls=q>=78?'good':q>=60?'warn':'risk';
    const label=q>=78?'High Quality':q>=60?'Manageable':'Needs Control';
    const text=q>=78?'Hafta dengeli ve sürdürülebilir. Kaliteyi koruyup küçük hedeflerle ilerle.':q>=60?'Genel yapı kullanılabilir ama yük, RPE veya ağrı sinyalini dikkatli yönet.':'Program kalitesi düşmüş görünüyor. Öncelik toparlanma, form ve düzenli kayıt olmalı.';
    return {q,cls,label,text};
  }
  function verdict(x,d,q){
    let status='Data Building', text='Veri biriktikçe haftalık karar desteği daha keskinleşir.', next='Gelecek hafta 3-4 temiz kayıt oluştur; RPE/Form/Pain alanlarını dolu tut.';
    if(x.c.sets===0 && x.acts.length){status='Activity Week';text='Bu hafta gym yükü düşük, activity yükü mevcut. Sistem bunu aktif toparlanma/conditioning haftası gibi okuyor.';next='Gym’e kontrollü dönüş: ilk ana hareketlerde RPE 6-7 bandını hedefle.';}
    else if(q.q>=78 && d.score<35){status='Productive';text='Hafta dengeli ve üretken. Yük, RPE ve toparlanma tarafı premium kullanım için iyi seviyede.';next='Programı koru; sadece en iyi hissettiren 1-2 harekette mikro progresyon uygula.';}
    else if(d.score>=65 || x.pain){status='Recovery Watch';text='Yük, RPE veya pain sinyalleri yüksek tarafa yaklaşıyor. Kaliteyi korumak hacim artırmaktan daha değerli.';next='Hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';}
    else if(x.c.sets<14){status='Light Load';text='Gym yükü hafif tarafta. Ağrı sinyali yoksa gelişim için küçük progresyon alanı var.';next='1-2 ana harekette aynı kiloda +1 tekrar hedefle.';}
    return {status,text,next};
  }
  function renderProgramIntelligence(){
    const wrap=document.getElementById('programReport'); if(!wrap)return;
    const x=st(), d=recovery(x), q=quality(x,d), v=verdict(x,d,q);
    const focus=x.c.sets?`${x.topPart[0]} baskın (${x.topPart[1]} set). Zayıf kalan bölgeleri kontrollü dengele.`:'Bu hafta için henüz net kas grubu odağı yok.';
    wrap.innerHTML=`<div class="programIntelPanelHero"><div class="programIntelHeroTop"><div><div class="programIntelHeroKicker">Premium Coach Dashboard</div><div class="programIntelHeroTitle">${esc(v.status)}</div><div class="programIntelHeroText">${esc(v.text)}</div></div><div class="programIntelHeroScore ${esc(q.cls)}"><div><strong>${q.q}</strong><span>Program Quality</span></div></div></div></div>
    <div class="programIntelPremiumGrid">
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Recovery Debt</small><b>${esc(d.label)}</b></div><div class="programIntelPremiumScore ${esc(d.cls)}">${d.score}</div></div><div class="programIntelPremiumText">${esc(d.text)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Avg RPE</small><b>${x.avgRpe?x.avgRpe.toFixed(1):'-'}</b></div><div class="programIntelMetric"><small>Activity</small><b>${Math.round(x.actMinutes)} dk</b></div></div></div>
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Program Quality</small><b>${esc(q.label)}</b></div><div class="programIntelPremiumScore ${esc(q.cls)}">${q.q}</div></div><div class="programIntelPremiumText">${esc(q.text)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Gym</small><b>${x.gymDays} gün</b></div><div class="programIntelMetric"><small>Pain</small><b>${x.pain}</b></div></div></div>
      <div class="programIntelPremiumCard"><div class="programIntelPremiumHead"><div><small>Weekly Focus</small><b>${esc(x.c.sets?x.topPart[0]:'Data Building')}</b></div><div class="programIntelPremiumScore ${x.c.sets?'good':'warn'}">${x.c.sets}</div></div><div class="programIntelPremiumText">${esc(focus)}</div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Volume</small><b>${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg</b></div><div class="programIntelMetric"><small>Active kcal</small><b>${Math.round(x.activeCal)}</b></div></div></div>
      <div class="programIntelPremiumCard wide"><div class="programIntelPremiumHead"><div><small>Coach Verdict</small><b>Gelecek hafta stratejisi</b></div><div class="programIntelPremiumScore ${esc(d.cls)}">🧭</div></div><div class="programIntelCoachBody"><div class="programIntelVerdictBox"><h3>${esc(v.status)}</h3>${esc(v.text)}<div class="programIntelNextBox"><b>Next Week Target:</b> ${esc(v.next)}</div></div><div class="programIntelMetricGrid"><div class="programIntelMetric"><small>Gym Days</small><b>${x.gymDays}</b></div><div class="programIntelMetric"><small>Activity Days</small><b>${x.actDays}</b></div><div class="programIntelMetric"><small>Total Sets</small><b>${x.c.sets}</b></div><div class="programIntelMetric"><small>Weekly Volume</small><b>${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg</b></div></div></div></div>
    </div>`;
  }
  function cleanupWeekly(){
    document.querySelectorAll('#weeklyReport .programIntelGrid,#weeklyReport .weeklyRecommendationCard').forEach(x=>x.remove());
  }
  function updateBuild(){
    const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
    const sp=document.querySelector('.versionBadgeCard span'); if(sp)sp.textContent='Universal Import · Program Intelligence Panel · Monthly Review · Premium Coach Insights';
  }
  function apply(){try{cleanupWeekly();renderProgramIntelligence();updateBuild();}catch(e){console.warn('program intelligence panel',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,90);};
  const prevWeekly=window.renderWeeklyReport;
  if(typeof prevWeekly==='function')window.renderWeeklyReport=function(){prevWeekly();setTimeout(apply,90);};
  setTimeout(apply,260);
  window.__simurgProgramIntelligencePanelV1=true;
})();

;

/* Simurg OS Data Health + Copy Weekly Coach Report v1 */
(function(){
  const BUILD='Simurg OS Data Health + Coach Report v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function validDate(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d||''));}
  function dmins(d){try{return typeof durationMinutes==='function'?durationMinutes(d):0;}catch(e){return 0;}}
  function workouts(){return (window.DATA&&Array.isArray(DATA.workouts))?DATA.workouts:[];}
  function activities(){return (window.DATA&&Array.isArray(DATA.appleWatch))?DATA.appleWatch:[];}
  function injectDataHealthCard(){
    const data=document.getElementById('data');
    if(!data || document.getElementById('dataHealthCard')) return;
    const local=data.querySelector('.localStatusCard');
    const card=document.createElement('div');
    card.className='card dataHealthCard';
    card.id='dataHealthCard';
    card.innerHTML=`<h2>Data Health Check</h2><div class="sub">Netlify final öncesi kayıtların tarih, boş alan, mantıksız kalori ve olası duplicate durumlarını hızlı kontrol eder.</div><div class="actions"><button class="btn" onclick="runDataHealthCheck()">Check Data Health</button></div><div id="dataHealthResult" class="dataHealthResult"><div class="dataHealthIssue ok">Henüz kontrol yapılmadı. Check Data Health ile tarama başlat.</div></div>`;
    if(local&&local.parentNode)local.insertAdjacentElement('afterend',card); else data.appendChild(card);
  }
  function analyzeDataHealth(){
    const ws=workouts(), acts=activities();
    const critical=[], warnings=[];
    ws.forEach((w,i)=>{
      const label=`Workout #${i+1}${w.date?' · '+w.date:''}`;
      if(!validDate(w.date)) critical.push(`${label}: tarih formatı hatalı veya boş.`);
      if(!String(w.exercise||'').trim()) critical.push(`${label}: exercise adı boş.`);
      if(n(w.sets)<0 || n(w.reps)<0 || n(w.weight)<0) warnings.push(`${label}: sets/reps/weight negatif görünüyor.`);
      if(!n(w.reps) && !n(w.sets)) warnings.push(`${label}: set/rep bilgisi eksik olabilir.`);
      if(w.rpe!==undefined && w.rpe!=='' && (n(w.rpe)<1 || n(w.rpe)>10)) warnings.push(`${label}: RPE 1-10 aralığı dışında.`);
    });
    acts.forEach((a,i)=>{
      const type=String(a.activityType||a.type||'Activity');
      const label=`Activity #${i+1}${a.date?' · '+a.date:''} · ${type}`;
      if(!validDate(a.date)) critical.push(`${label}: tarih formatı hatalı veya boş.`);
      if(!String(a.activityType||'').trim()) warnings.push(`${label}: activityType boş; Universal Import eski formatı genel aktivite gibi okuyabilir.`);
      if(!String(a.duration||'').trim()) warnings.push(`${label}: duration boş.`);
      if(n(a.totalCal)>0 && n(a.activeCal)>n(a.totalCal)) warnings.push(`${label}: activeCal totalCal değerinden yüksek.`);
      if(a.rpe!==undefined && a.rpe!=='' && (n(a.rpe)<1 || n(a.rpe)>10)) warnings.push(`${label}: RPE 1-10 aralığı dışında.`);
    });
    const seenW=new Map();
    ws.forEach((w,i)=>{const key=[w.date,String(w.exercise||'').trim().toLowerCase(),w.reps,w.weight,w.notes||''].join('|'); if(seenW.has(key)) warnings.push(`Olası duplicate workout: ${w.date} · ${w.exercise||'isimsiz'} (#${seenW.get(key)+1} ve #${i+1}).`); else seenW.set(key,i);});
    const seenA=new Map();
    acts.forEach((a,i)=>{const key=[a.date,a.activityType||'',a.duration||'',a.activeCal||'',a.totalCal||''].join('|'); if(seenA.has(key)) warnings.push(`Olası duplicate activity: ${a.date} · ${a.activityType||'Activity'} (#${seenA.get(key)+1} ve #${i+1}).`); else seenA.set(key,i);});
    let status='Good', cls='good';
    if(critical.length){status='Needs Fix'; cls='risk';}
    else if(warnings.length){status='Good with Warnings'; cls='warn';}
    return {status,cls,critical,warnings,ws,acts};
  }
  window.runDataHealthCheck=function(){
    const res=document.getElementById('dataHealthResult'); if(!res)return;
    const h=analyzeDataHealth();
    const maxShow=8;
    const items=[];
    if(!h.critical.length && !h.warnings.length) items.push(`<div class="dataHealthIssue ok">Temiz görünüyor hocam. Kritik hata veya uyarı bulunmadı.</div>`);
    h.critical.slice(0,maxShow).forEach(x=>items.push(`<div class="dataHealthIssue critical"><b>Critical:</b> ${esc(x)}</div>`));
    h.warnings.slice(0,maxShow).forEach(x=>items.push(`<div class="dataHealthIssue warning"><b>Warning:</b> ${esc(x)}</div>`));
    const hidden=Math.max(0,h.critical.length+h.warnings.length-items.length);
    if(hidden) items.push(`<div class="dataHealthIssue warning">+${hidden} ek uyarı daha var. Önce en üsttekileri kontrol etmek yeterli.</div>`);
    res.innerHTML=`<div class="dataHealthTop"><div class="dataHealthScore"><span class="dataHealthBadge ${h.cls}">${esc(h.status)}</span><span>${h.critical.length} critical · ${h.warnings.length} warning</span></div></div><div class="dataHealthMiniGrid"><div class="dataHealthMini"><small>Workout Records</small><b>${h.ws.length}</b></div><div class="dataHealthMini"><small>Activity Records</small><b>${h.acts.length}</b></div><div class="dataHealthMini"><small>Total Issues</small><b>${h.critical.length+h.warnings.length}</b></div></div><div class="dataHealthIssues">${items.join('')}</div>`;
  };
  function weekStats(){
    const ds=typeof weekDates==='function'?weekDates():[];
    const ws=ds.flatMap(d=>typeof dayData==='function'?dayData(d):workouts().filter(w=>w.date===d));
    const c=typeof calc==='function'?calc(ws):{sets:ws.reduce((s,w)=>s+n(w.sets),0),reps:ws.reduce((s,w)=>s+n(w.reps),0),vol:ws.reduce((s,w)=>s+n(w.weight)*n(w.reps)*Math.max(1,n(w.sets)||1),0),parts:{}};
    const acts=activities().filter(a=>ds.includes(a.date));
    const actMinutes=acts.reduce((s,a)=>s+dmins(a.duration),0);
    const activeCal=acts.reduce((s,a)=>s+n(a.activeCal),0);
    const rpes=ws.map(w=>n(w.rpe)).filter(Boolean).concat(acts.map(a=>n(a.rpe)).filter(Boolean));
    const avgRpe=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'-';
    const pain=ws.filter(w=>String(w.pain||'None')!=='None').length;
    const gymDays=ds.filter(d=>(typeof dayData==='function'?dayData(d):workouts().filter(w=>w.date===d)).length).length;
    const actDays=new Set(acts.map(a=>a.date)).size;
    const topPart=Object.entries(c.parts||{}).sort((a,b)=>b[1]-a[1])[0]||['Data Building',0];
    let recovery='Low'; if(pain||Number(avgRpe)>=8.5||actMinutes>150||c.sets>28)recovery='High'; else if(Number(avgRpe)>=7.5||actMinutes>90||c.sets>22)recovery='Moderate';
    let quality=100; if(gymDays<2)quality-=18; if(c.sets>32)quality-=15; if(Number(avgRpe)>8.5)quality-=18; if(pain)quality-=22; if(recovery==='High')quality-=16; else if(recovery==='Moderate')quality-=8; quality=Math.max(0,Math.min(100,Math.round(quality)));
    let next='Gelecek hafta RPE/Form/Pain alanlarını dolu tutarak 3-4 temiz kayıt oluştur.';
    if(quality>=78&&recovery==='Low')next='1-2 ana harekette kontrollü mikro progresyon hedefle; genel programı koru.';
    else if(recovery==='High'||pain)next='Hacmi %10-15 azalt veya aynı yükte daha temiz form hedefle.';
    else if(c.sets<14)next='Gym yükünü yavaşça artır; aynı kiloda +1 tekrar iyi hedef olur.';
    return {ds,ws,c,acts,actMinutes,activeCal,avgRpe,pain,gymDays,actDays,topPart,recovery,quality,next};
  }
  window.generateWeeklyCoachReport=function(){
    const x=weekStats();
    const range=x.ds.length?`${x.ds[0]} → ${x.ds[x.ds.length-1]}`:'Seçili hafta';
    return `SIMURG OS — Weekly Coach Report\n${range}\n\nGym Days: ${x.gymDays}\nActivity Days: ${x.actDays}\nTotal Sets: ${x.c.sets||0}\nWeekly Volume: ${Math.round(x.c.vol||0).toLocaleString('tr-TR')} kg\nActivity Minutes: ${Math.round(x.actMinutes)} dk\nActive Calories: ${Math.round(x.activeCal)} kcal\nAvg RPE: ${x.avgRpe}\nPain Flags: ${x.pain}\nRecovery Debt: ${x.recovery}\nProgram Quality: ${x.quality}/100\nWeekly Focus: ${x.topPart[0]}${x.topPart[1]?` (${x.topPart[1]} set)`:''}\n\nNext Week Target:\n${x.next}`;
  };
  window.copyWeeklyCoachReport=async function(){
    const text=window.generateWeeklyCoachReport();
    try{await navigator.clipboard.writeText(text); alert('Weekly Coach Report kopyalandı.');}
    catch(e){
      const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('Weekly Coach Report kopyalandı.');
    }
    const prev=document.getElementById('coachReportPreview'); if(prev)prev.textContent=text;
  };
  function injectCoachReportTools(){
    const program=document.getElementById('programReport');
    if(program && !document.getElementById('programReportUtilityBar')){
      program.insertAdjacentHTML('afterbegin',`<div id="programReportUtilityBar" class="programReportUtilityBar"><div><small>Weekly Export</small><b>Haftalık coach raporunu tek tıkla kopyala</b></div><button class="btn sec" onclick="copyWeeklyCoachReport()">Copy Weekly Coach Report</button></div>`);
    }
    const data=document.getElementById('data');
    if(data && !document.getElementById('coachReportCard')){
      const health=document.getElementById('dataHealthCard');
      const card=document.createElement('div');
      card.className='card coachReportCard'; card.id='coachReportCard';
      card.innerHTML=`<h2>Copy Coach Report</h2><div class="sub">Haftalık Program Intelligence özetini mesaj/not olarak kopyalar.</div><div class="coachReportActions"><button class="btn sec" onclick="copyWeeklyCoachReport()">Copy Weekly Coach Report</button></div><div id="coachReportPreview" class="coachReportPreview">Kopyalanınca rapor ön izlemesi burada görünür.</div>`;
      if(health&&health.parentNode)health.insertAdjacentElement('afterend',card); else data.appendChild(card);
    }
  }
  function updateBuild(){
    const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
    const sp=document.querySelector('.versionBadgeCard span'); if(sp)sp.textContent='Universal Import · Data Health Check · Copy Coach Report · Program Intelligence';
  }
  function apply(){try{injectDataHealthCard();injectCoachReportTools();updateBuild();}catch(e){console.warn('data health report v1',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,120);};
  const prevProgram=window.renderProgramIntelligence;
  if(typeof prevProgram==='function')window.renderProgramIntelligence=function(){prevProgram();setTimeout(apply,120);};
  setTimeout(apply,350);
})();

;

/* Simurg OS Current Week UX Polish v1
   - Today highlight in Workout Logger
   - Gym Mode today helper
   - Rest Day card for empty days
   - Go to imported date helper
   Data logic is untouched; this is UI-only. */
(function(){
  const BUILD='Simurg OS Current Week UX Polish v1';
  const css=`
  .dateBtn.today:not(.active), .dayBtn.today:not(.active){
    border-color:rgba(47,132,255,.55)!important;
    box-shadow:0 0 0 1px rgba(47,132,255,.20), 0 12px 28px rgba(47,132,255,.10)!important;
    background:linear-gradient(135deg,rgba(47,132,255,.14),rgba(7,17,30,.70))!important;
  }
  .dateBtn.today .d:after, .dayBtn.today .main:after{
    content:'Bugün';
    display:inline-flex;
    margin-left:7px;
    padding:2px 7px;
    border-radius:999px;
    border:1px solid rgba(47,132,255,.42);
    background:rgba(47,132,255,.13);
    color:#9dccff;
    font-size:10px;
    font-weight:900;
    letter-spacing:.4px;
    vertical-align:middle;
  }
  .todayProgramHelper{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    margin:10px 0 14px;
    padding:12px 14px;
    border-radius:18px;
    border:1px solid rgba(47,132,255,.22);
    background:linear-gradient(135deg,rgba(47,132,255,.10),rgba(7,17,30,.55));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
  }
  .todayProgramHelper small{display:block;color:#87a1c1;font-size:11px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;}
  .todayProgramHelper b{display:block;color:#f8fbff;font-size:14px;margin-top:2px;overflow-wrap:anywhere;}
  .todayProgramHelper span{display:block;color:#9fb7d5;font-size:12px;margin-top:3px;overflow-wrap:anywhere;}
  .restDayCard{
    position:relative;
    padding:18px;
    border-radius:24px;
    border:1px solid rgba(47,132,255,.20);
    background:linear-gradient(135deg,rgba(10,25,43,.88),rgba(7,17,30,.76));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045), 0 12px 30px rgba(0,0,0,.20);
    overflow:hidden;
  }
  .restDayCard:before{content:'';position:absolute;inset:auto 0 0 0;height:3px;background:linear-gradient(90deg,#2f84ff,#23ce7a,#8b5cf6);opacity:.70;}
  .restDayCard small{display:block;color:#87a1c1;font-size:11px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;}
  .restDayCard b{display:block;color:#f8fbff;font-size:22px;margin:4px 0;}
  .restDayCard span{display:block;color:#9fb7d5;line-height:1.45;overflow-wrap:anywhere;}
  .goImportedDateBtn{white-space:normal;line-height:1.2;}
  .importDateMiniStatus{font-size:12px;color:#9fb7d5;margin-top:8px;overflow-wrap:anywhere;}
  @media(max-width:780px){
    .todayProgramHelper{flex-direction:column;align-items:flex-start;}
    .todayProgramHelper .btn{width:100%;}
    .dateBtn.today .d:after, .dayBtn.today .main:after{display:flex;width:max-content;margin:5px auto 0;}
  }`;
  const st=document.createElement('style'); st.id='currentWeekUxPolishCss'; st.textContent=css; document.head.appendChild(st);

  function safeToday(){try{return todayStr();}catch(e){return new Date().toISOString().slice(0,10)}}
  function safeTr(d){try{return trDate(d)}catch(e){return d}}
  function safeDay(d){try{return dayName(d)}catch(e){return ''}}
  function safeMonday(d){try{return mondayOf(d)}catch(e){return d}}
  function hasWatch(d){try{return (watchRowsForDate(d)||[]).length>0}catch(e){return false}}
  function hasGym(d){try{return (dayData(d)||[]).length>0}catch(e){return false}}
  function programFor(d){try{return getProgramLabelForDate(d)}catch(e){return safeDay(d)}}

  function applyTodayHighlights(){
    const t=safeToday();
    document.querySelectorAll('.dateBtn').forEach(btn=>{
      const isToday=(btn.getAttribute('onclick')||'').includes(`selectedDate='${t}'`);
      btn.classList.toggle('today',!!isToday);
    });
    const todayDay=safeDay(t);
    document.querySelectorAll('.dayBtn').forEach(btn=>{
      const main=btn.querySelector('.main');
      const isToday=main && main.textContent.trim()===todayDay && String(window.weekStart||weekStart)===safeMonday(t);
      btn.classList.toggle('today',!!isToday);
    });
  }

  function injectGymTodayHelper(){
    const section=document.getElementById('gym'); if(!section) return;
    const list=document.getElementById('gymModeList'); if(!list) return;
    let helper=document.getElementById('todayProgramHelper');
    if(!helper){
      helper=document.createElement('div'); helper.id='todayProgramHelper'; helper.className='todayProgramHelper';
      list.parentNode.insertBefore(helper,list);
    }
    const t=safeToday();
    const active=String(window.selectedDate||selectedDate)===t;
    helper.innerHTML=`<div><small>${active?'Bugünün Programı':'Bugün'}</small><b>${programFor(t)}</b><span>${safeTr(t)} • Gym Mode bugünün tarihine göre hazır.</span></div><button class="btn sec" onclick="goToday();show('gym',document.querySelector('.nav button:nth-child(2)'))">Bugünün Programına Git</button>`;
  }

  function applyRestDayCard(){
    const wg=document.getElementById('workoutGroups'); if(!wg) return;
    const d=String(window.selectedDate||selectedDate);
    if(hasGym(d) || hasWatch(d)) return;
    const type=programFor(d);
    wg.innerHTML=`<div class="restDayCard"><small>Rest Day</small><b>${safeTr(d)}</b><span>${type}. Bu gün için gym veya activity kaydı yok. Eğer aktif recovery, yürüyüş, yüzme ya da ek antrenman yaptıysan Universal Import ile ekleyebilirsin.</span></div>`;
  }

  function updateBuildLabel(){
    const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
    const sp=document.querySelector('.versionBadgeCard span'); if(sp)sp.textContent='Current Week Auto · Today Highlight · Rest Day Card · Import Date Helper';
  }

  function ensureImportDateTools(){
    const card=document.querySelector('.universalImportCard'); if(!card) return;
    const actions=card.querySelector('.actions'); if(!actions) return;
    if(!document.getElementById('goImportedDateBtn')){
      actions.insertAdjacentHTML('beforeend',`<button id="goImportedDateBtn" class="btn sec goImportedDateBtn" style="display:none" onclick="goToLastImportedDate()">Imported Date'e Git</button><div id="importDateMiniStatus" class="importDateMiniStatus"></div>`);
    }
  }
  window.goToLastImportedDate=function(){
    const d=localStorage.getItem('simurg_last_imported_date')||'';
    if(!d) return;
    selectedDate=d; weekStart=safeMonday(d); render(); show('workout',document.querySelector('.nav button'));
  };
  function showImportDate(d){
    if(!d) return;
    localStorage.setItem('simurg_last_imported_date',d);
    ensureImportDateTools();
    const btn=document.getElementById('goImportedDateBtn');
    const st=document.getElementById('importDateMiniStatus');
    if(btn){btn.style.display='inline-flex'; btn.textContent=`${safeTr(d)} tarihine git`;}
    if(st)st.textContent=`Son import tarihi: ${safeTr(d)}. Kontrol etmek için butonu kullanabilirsin.`;
  }

  function applyUx(){
    try{applyTodayHighlights();injectGymTodayHelper();applyRestDayCard();ensureImportDateTools();updateBuildLabel();}catch(e){console.warn('current week ux polish',e)}
  }

  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(applyUx,80);};

  const prevShow=window.show;
  window.show=function(id,btn){
    if(id==='gym'){
      const t=safeToday();
      if(!hasGym(selectedDate) && !hasWatch(selectedDate)) { selectedDate=t; weekStart=safeMonday(t); }
    }
    if(typeof prevShow==='function')prevShow(id,btn); else applyUx();
  };

  const prevUniversal=window.universalImport;
  if(typeof prevUniversal==='function' && !window.__simurgImportDateHelperWrapped){
    window.universalImport=function(){
      const before=String(window.selectedDate||selectedDate||'');
      const res=prevUniversal.apply(this,arguments);
      setTimeout(()=>{
        const after=String(window.selectedDate||selectedDate||before);
        showImportDate(after);
        applyUx();
      },160);
      return res;
    };
    window.__simurgImportDateHelperWrapped=true;
  }

  setTimeout(applyUx,250);
})();

;

/* Simurg OS Current Week UX Polish v2 - no blinking today marker
   Keeps current-week opening, Rest Day card, Gym today helper and import-date helper.
   Removes the visual Today badge/glow in Workout Logger because it caused reflow/blinking when changing days. */
(function(){
  const css=`
  .dateBtn.today:not(.active),
  .dayBtn.today:not(.active){
    border-color:rgba(255,255,255,.08)!important;
    box-shadow:none!important;
    background:inherit!important;
  }
  .dateBtn.today .d:after,
  .dayBtn.today .main:after{
    content:none!important;
    display:none!important;
  }
  .dateBtn.today, .dayBtn.today{
    animation:none!important;
    transition:border-color .16s ease, background .16s ease, box-shadow .16s ease, transform .16s ease!important;
  }
  .dateBtn.active, .dayBtn.active{
    animation:none!important;
  }
  `;
  const st=document.createElement('style');
  st.id='currentWeekUxNoBlinkFixCss';
  st.textContent=css;
  document.head.appendChild(st);
  function updateBuild(){
    const b=document.querySelector('.versionBadgeCard b');
    if(b && /Current Week UX Polish/i.test(b.textContent||'')) b.textContent='Simurg OS Current Week UX Polish v2 - No Blink';
  }
  const prevRender=window.render;
  if(typeof prevRender==='function' && !window.__simurgNoBlinkRenderWrapped){
    window.render=function(){const r=prevRender.apply(this,arguments); setTimeout(updateBuild,120); return r;};
    window.__simurgNoBlinkRenderWrapped=true;
  }
  setTimeout(updateBuild,300);
})();

;

/* Simurg OS Smart Progression v1: readiness badges, auto next targets, week compare, monthly best progress */
(function(){
  if(window.__simurgSmartProgressionV1) return;
  window.__simurgSmartProgressionV1=true;
  const BUILD='Simurg OS Smart Progression v1';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>Number(String(v??'').replace(',','.'))||0;
  const iso=d=>{const x=new Date(d); x.setHours(12,0,0,0); return x.toISOString().slice(0,10)};
  const add=(d,n)=>{const x=typeof parseDate==='function'?parseDate(d):new Date(d); x.setDate(x.getDate()+n); return iso(x)};
  const dateVal=d=>{const x=typeof parseDate==='function'?parseDate(d):new Date(d); return +x||0};
  const weekList=start=>Array.from({length:7},(_,i)=>add(start,i));
  function getCurrentWeekStart(){try{return typeof weekStart!=='undefined'?weekStart:(typeof mondayOf==='function'?mondayOf(new Date().toISOString().slice(0,10)):iso(new Date()))}catch(e){return iso(new Date())}}
  function getSelectedDate(){try{return typeof selectedDate!=='undefined'?selectedDate:iso(new Date())}catch(e){return iso(new Date())}}
  function rowsForExercise(ex){return ((DATA&&DATA.workouts)||[]).filter(w=>String(w.exercise||'').trim().toLowerCase()===String(ex||'').trim().toLowerCase()).sort((a,b)=>dateVal(a.date)-dateVal(b.date));}
  function bestSet(rows){
    let best=null;
    (rows||[]).forEach(w=>{const wt=num(w.weight), rp=num(w.reps); const score=wt*(1+rp/30); if(!best||score>best.score) best={weight:wt,reps:rp,score,row:w,text:`${wt%1?wt.toFixed(1):wt}kg x ${rp}`};});
    return best;
  }
  function fmtSet(s){return !s?'-':`${s.weight%1?s.weight.toFixed(1):s.weight}kg x ${s.reps}`;}
  function sessionBest(ex,date){return bestSet(((DATA&&DATA.workouts)||[]).filter(w=>w.date===date && String(w.exercise||'').trim().toLowerCase()===String(ex||'').trim().toLowerCase()));}
  function sessionGroups(ex,untilDate){
    const groups={};
    rowsForExercise(ex).forEach(w=>{if(untilDate && dateVal(w.date)>dateVal(untilDate)) return; (groups[w.date]=groups[w.date]||[]).push(w);});
    return Object.keys(groups).sort((a,b)=>dateVal(b)-dateVal(a)).map(d=>({date:d, best:bestSet(groups[d]), rows:groups[d]})).filter(x=>x.best);
  }
  function latestCoachFlags(ex){
    const rows=rowsForExercise(ex).filter(w=>w.rpe||w.form||w.pain).sort((a,b)=>dateVal(b.date)-dateVal(a.date));
    const r=rows[0]||{}; return {rpe:num(r.rpe), form:String(r.form||''), pain:String(r.pain||'None')};
  }
  function readiness(ex,date){
    const groups=sessionGroups(ex,date).slice(0,3); const flags=latestCoachFlags(ex);
    if(flags.pain==='Warning') return {cls:'deload',label:'Deload Watch',icon:'🔴',reason:'Pain warning'};
    if(flags.pain==='Mild'||flags.form==='Bad') return {cls:'form',label:'Form First',icon:'🟠',reason:'Form/pain signal'};
    if(!groups.length) return {cls:'recovery',label:'Data Building',icon:'🔵',reason:'First clean record'};
    if(groups.length===1) return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'Need 2+ sessions'};
    const latest=groups[0].best.score, prev=groups.slice(1).reduce((s,g)=>s+g.best.score,0)/(groups.length-1);
    const diff=prev?((latest-prev)/prev)*100:0;
    if(flags.rpe>=9) return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'High RPE'};
    if(diff>4 && flags.rpe<=8) return {cls:'ready',label:'Ready to Progress',icon:'🟢',reason:`Trend +${diff.toFixed(1)}%`};
    if(diff<-5) return {cls:'deload',label:'Recovery Check',icon:'🔴',reason:`Trend ${diff.toFixed(1)}%`};
    return {cls:'hold',label:'Hold Load',icon:'🟡',reason:'Stable trend'};
  }
  function nextTarget(ex,date){
    DATA.autoNextTargets=DATA.autoNextTargets||{};
    const saved=DATA.autoNextTargets[ex];
    const cur=sessionBest(ex,date), groups=sessionGroups(ex,date), last=cur||groups[0]?.best||null, flags=latestCoachFlags(ex), rd=readiness(ex,date);
    let text='İlk temiz seti kaydet; sonra sistem hedefi netleştirsin.';
    if(last){
      const wt=last.weight, rp=last.reps;
      if(rd.cls==='deload'||flags.pain==='Warning') text=`${fmtSet(last)} seviyesinde kal; form ve ağrıyı kontrol et.`;
      else if(flags.rpe>=9) text=`${fmtSet(last)} tekrarını koru; RPE düşmeden artış yapma.`;
      else if(rp>=10) text=`${(wt+2.5).toFixed(1).replace('.0','')}kg x 8 hedefle.`;
      else text=`${wt%1?wt.toFixed(1):wt}kg x ${rp+1} hedefle.`;
    }
    if(saved&&saved.text&&!cur) text=saved.text;
    return {text, saved};
  }
  function updateStoredTarget(ex,date){
    if(!ex) return; DATA.autoNextTargets=DATA.autoNextTargets||{};
    const nt=nextTarget(ex,date); DATA.autoNextTargets[ex]={text:nt.text,date:new Date().toISOString(),sourceDate:date};
    try{localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));}catch(e){}
  }
  function addGymBadges(){
    const date=getSelectedDate();
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=(card.getAttribute('data-current-name')||card.querySelector('.gymExerciseName')?.value||'').trim(); if(!ex) return;
      card.querySelectorAll('.gymSmartBadgeRow,.gymSmartAutoTarget').forEach(x=>x.remove());
      const rd=readiness(ex,date), nt=nextTarget(ex,date), best=bestSet(rowsForExercise(ex));
      const row=document.createElement('div'); row.className='gymSmartBadgeRow';
      row.innerHTML=`<span class="gymSmartBadge ${rd.cls}">${rd.icon} ${esc(rd.label)}</span><span class="gymSmartBadge">🏆 Best ${esc(fmtSet(best))}</span><span class="gymSmartBadge">📈 ${esc(rd.reason)}</span>`;
      const target=document.createElement('div'); target.className='gymSmartAutoTarget'; target.innerHTML=`<b>Auto Next:</b> ${esc(nt.text)}`;
      const note=card.querySelector('.gymProgramNote')||card.querySelector('.gymCardHead');
      if(note&&note.parentNode){note.insertAdjacentElement('afterend',row); row.insertAdjacentElement('afterend',target);} else {card.insertBefore(row,card.firstChild); row.insertAdjacentElement('afterend',target);}
    });
  }
  const oldGym=window.renderGymMode;
  if(typeof oldGym==='function') window.renderGymMode=function(){oldGym.apply(this,arguments); setTimeout(addGymBadges,0);};
  const oldSaveGym=window.saveGymExercise;
  if(typeof oldSaveGym==='function') window.saveGymExercise=function(key){
    const date=getSelectedDate(); let ex='';
    try{const card=document.querySelector(`.gymCard[data-gym-key="${String(key).replace(/"/g,'\\"')}"]`); ex=(card?.querySelector('.gymExerciseName')?.value||card?.getAttribute('data-current-name')||'').trim();}catch(e){}
    const ret=oldSaveGym.apply(this,arguments);
    setTimeout(()=>{try{if(ex)updateStoredTarget(ex,date); addGymBadges();}catch(e){}},80);
    return ret;
  };
  function weekStats(start){
    const ds=weekList(start); const workouts=((DATA&&DATA.workouts)||[]).filter(w=>ds.includes(w.date));
    const acts=((DATA&&DATA.appleWatch)||[]).filter(a=>ds.includes(a.date));
    const c=typeof calc==='function'?calc(workouts):{sets:workouts.length,reps:workouts.reduce((s,w)=>s+num(w.reps),0),vol:workouts.reduce((s,w)=>s+num(w.reps)*num(w.weight),0)};
    const minutes=acts.reduce((s,a)=>s+(typeof durationMinutes==='function'?durationMinutes(a.duration):0),0);
    const rpes=workouts.map(w=>num(w.rpe)).filter(Boolean).concat(acts.map(a=>num(a.rpe)).filter(Boolean));
    return {sets:c.sets||0,vol:c.vol||0,minutes,activityDays:new Set(acts.map(a=>a.date)).size,gymDays:new Set(workouts.map(w=>w.date)).size,avgRpe:rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:0};
  }
  function delta(cur,prev,key){const a=cur[key]||0,b=prev[key]||0; if(!b&&a)return '+new'; if(!b&&!a)return '0'; const d=((a-b)/b)*100; return `${d>=0?'+':''}${d.toFixed(0)}%`;}
  function renderWeekCompare(){
    const wrap=document.getElementById('programReport'); if(!wrap) return;
    wrap.querySelectorAll('.programIntelDeltaCard').forEach(x=>x.remove());
    const start=getCurrentWeekStart(), prev=add(start,-7), cur=weekStats(start), old=weekStats(prev);
    const volD=delta(cur,old,'vol'), setD=delta(cur,old,'sets'), minD=delta(cur,old,'minutes'), rpeD=cur.avgRpe&&old.avgRpe?`${(cur.avgRpe-old.avgRpe)>=0?'+':''}${(cur.avgRpe-old.avgRpe).toFixed(1)}`:'-';
    const trend=(cur.vol>old.vol*1.12&&cur.sets>=old.sets)?{cls:'good',label:'Progressing'}:(cur.vol<old.vol*.85?{cls:'warn',label:'Lower Load'}:{cls:'good',label:'Stable'});
    const text=trend.label==='Progressing'?'Bu hafta hacim artışı kontrollü ilerliyor. RPE ve pain düşük kalırsa mikro progresyon mantıklı.':trend.label==='Lower Load'?'Bu hafta yük düşmüş. Bilinçli recovery haftasıysa iyi; değilse bir sonraki hafta düzenli kayıt hedefle.':'Haftalık yük dengeli görünüyor. Kaliteyi koruyarak küçük hedeflerle devam et.';
    const html=`<div class="programIntelDeltaCard"><div class="programIntelDeltaHead"><div><small>This Week vs Last Week</small><b>Haftalık değişim analizi</b></div><div class="programIntelDeltaPill ${trend.cls}">${trend.label}</div></div><div class="programIntelDeltaGrid"><div class="programIntelDeltaMetric"><small>Volume</small><b>${volD}</b></div><div class="programIntelDeltaMetric"><small>Sets</small><b>${setD}</b></div><div class="programIntelDeltaMetric"><small>Activity Min</small><b>${minD}</b></div><div class="programIntelDeltaMetric"><small>Avg RPE</small><b>${rpeD}</b></div></div><div class="programIntelDeltaText">${esc(text)}</div></div>`;
    const grid=wrap.querySelector('.programIntelPremiumGrid'); if(grid) grid.insertAdjacentHTML('afterbegin',html); else wrap.insertAdjacentHTML('beforeend',html);
  }
  function monthKeyFromSelected(){const d=getSelectedDate(); return String(d||'').slice(0,7);}
  function monthlyBestProgress(){
    const ym=monthKeyFromSelected(); const rows=((DATA&&DATA.workouts)||[]).filter(w=>String(w.date||'').slice(0,7)===ym&&w.exercise);
    const by={}; rows.forEach(w=>(by[w.exercise]=by[w.exercise]||[]).push(w));
    let best=null, stable=null, attention=null;
    Object.entries(by).forEach(([ex,arr])=>{
      const dates=[...new Set(arr.map(w=>w.date))].sort((a,b)=>dateVal(a)-dateVal(b)); if(!dates.length)return;
      const first=bestSet(arr.filter(w=>w.date===dates[0])), last=bestSet(arr.filter(w=>w.date===dates[dates.length-1])), allBest=bestSet(arr);
      const diff=(first&&last&&first.score)?((last.score-first.score)/first.score)*100:0;
      const pain=arr.filter(w=>String(w.pain||'None')!=='None').length;
      const obj={ex,diff,dates:dates.length,best:allBest,pain};
      if(!best||obj.diff>best.diff) best=obj;
      if(dates.length>=2 && (!stable||Math.abs(obj.diff)<Math.abs(stable.diff))) stable=obj;
      if(pain && (!attention||pain>attention.pain)) attention=obj;
    });
    return {ym,best,stable,attention};
  }
  function renderMonthlyBest(){
    const wrap=document.getElementById('monthlyReport'); if(!wrap)return;
    wrap.querySelectorAll('.monthlyBestProgressCard').forEach(x=>x.remove());
    const m=monthlyBestProgress();
    const label=m.best?`${m.best.diff>=0?'+':''}${m.best.diff.toFixed(1)}%`:'Data'; const cls=m.best&&m.best.diff>0?'good':'warn';
    const text=m.best?`Ayın en iyi gelişen hareketi ${m.best.ex}. En iyi set: ${fmtSet(m.best.best)}. Bu hareket için progresyon kalitesi yüksekse gelecek ay mikro artış mantıklı.`:'Bu ay için en iyi gelişen hareketi hesaplamak adına daha fazla kayıt gerekiyor.';
    const html=`<div class="monthlyBestProgressCard"><div class="monthlyBestProgressHead"><div><small>Best Progress Movement</small><b>${esc(m.best?m.best.ex:'Data Building')}</b></div><div class="monthlyBestProgressPill ${cls}">${esc(label)}</div></div><div class="monthlyBestProgressText">${esc(text)}</div><div class="monthlyBestProgressStats"><div class="monthlyBestProgressStat"><small>Best Set</small><b>${esc(m.best?fmtSet(m.best.best):'-')}</b></div><div class="monthlyBestProgressStat"><small>Stable Movement</small><b>${esc(m.stable?m.stable.ex:'-')}</b></div><div class="monthlyBestProgressStat"><small>Attention</small><b>${esc(m.attention?m.attention.ex:'No pain flag')}</b></div></div></div>`;
    wrap.insertAdjacentHTML('beforeend',html);
  }
  function updateBuild(){try{const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD; const s=document.querySelector('.versionBadgeCard span'); if(s)s.textContent='Smart Progression · Readiness Badges · Auto Next Targets · Week Compare · Best Progress';}catch(e){}}
  function apply(){try{addGymBadges();renderWeekCompare();renderMonthlyBest();updateBuild();}catch(e){console.warn('smart progression apply',e)}}
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(){oldRender.apply(this,arguments); setTimeout(apply,180);};
  const oldShow=window.show; if(typeof oldShow==='function') window.show=function(){const r=oldShow.apply(this,arguments); setTimeout(apply,180); return r;};
  setTimeout(apply,500);
})();

;

/* Simurg OS Professional Polish v1: premium copy, consistent coach language, stable build label */
(function(){
  const BUILD='Simurg OS Professional Polish v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function setBuild(){
    try{
      const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
      const s=document.querySelector('.versionBadgeCard span'); if(s)s.textContent='Stable Coach System · Smart Progression · Data Health · Program Intelligence';
    }catch(e){}
  }
  function improveCoachCopy(){
    try{
      document.querySelectorAll('.programIntelPremiumText,.programIntelDeltaText,.monthlyBestProgressText,.coachPremiumMessage,.gymSmartAutoTarget').forEach(el=>{
        let t=el.textContent||'';
        if(!t.trim())return;
        t=t.replace(/mikro progresyon mantıklı/gi,'kontrollü mikro progresyon mantıklı');
        t=t.replace(/daha fazla kayıt gerekiyor/gi,'daha güvenilir yorum için birkaç kayıt daha gerekiyor');
        t=t.replace(/Data Building/gi,'Veri Birikiyor');
        t=t.replace(/Kayıt yok/gi,'Henüz yeterli kayıt yok');
        el.textContent=t;
      });
    }catch(e){}
  }
  function normalizeDataHealth(){
    try{
      document.querySelectorAll('.dataHealthIssue').forEach(el=>{
        const raw=el.textContent||'';
        if(raw.includes('critical')||raw.includes('Critical')) el.classList.add('critical');
        else if(raw.includes('warning')||raw.includes('Warning')||raw.includes('uyarı')) el.classList.add('warn');
        else if(raw.includes('Good')||raw.includes('temiz')||raw.includes('kontrol')) el.classList.add('ok');
      });
    }catch(e){}
  }
  function proPolish(){setBuild();improveCoachCopy();normalizeDataHealth();}
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(){oldRender.apply(this,arguments); setTimeout(proPolish,220);};
  const oldShow=window.show; if(typeof oldShow==='function') window.show=function(){const r=oldShow.apply(this,arguments); setTimeout(proPolish,220); return r;};
  setTimeout(proPolish,400);
})();

;

(function(){
  const APP_BUILD='SIMURG_OS_APP_MODE_V1';
  window.SIMURG_APP_BUILD=APP_BUILD;
  function standalone(){return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;}
  function hideBoot(){
    try{
      document.body.classList.remove('simurg-lock-scroll');
      const boot=document.getElementById('simurgBoot');
      if(boot){boot.classList.add('hidden');setTimeout(()=>boot.remove(),520);}
    }catch(e){}
  }
  function showInstallHint(){
    try{
      if(standalone())return;
      if(localStorage.getItem('simurg_install_hint_closed')==='1')return;
      const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
      const hint=document.getElementById('simurgStandaloneHint');
      if(hint && isiOS){setTimeout(()=>{hint.style.display='block'},1600);}
    }catch(e){}
  }
  window.addEventListener('load',()=>{setTimeout(hideBoot,380);showInstallHint();});
  setTimeout(hideBoot,2400);
  window.addEventListener('appinstalled',()=>{try{localStorage.setItem('simurg_install_hint_closed','1')}catch(e){}});
})();


/* SIMURG OS POLAR HOME DASHBOARD V1 */
(function(){
  const BUILD='SIMURG_OS_WHOOP_MOBILE_HOME_V7_USABLE';
  function ensureRecoveryStore(){
    if(!DATA.recoveryEntries || Array.isArray(DATA.recoveryEntries)) DATA.recoveryEntries={};
    return DATA.recoveryEntries;
  }
  function val(v,def){ v=Number(v); return Number.isFinite(v)?v:def; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function fmtSleep(min){ min=val(min,432); const h=Math.floor(min/60), m=Math.round(min%60); return `${h}s ${String(m).padStart(2,'0')}dk`; }
  function recoveryFor(date){
    ensureRecoveryStore();
    const r=DATA.recoveryEntries[date] || {};
    const daily=(DATA.dailyNotes||[]).slice().reverse().find(x=>x.date===date)||{};
    const watch=(DATA.appleWatch||[]).filter(x=>x.date===date);
    const rows=dayData(date);
    const c=calc(rows);
    const sleepMin=val(r.sleepDurationMinutes||r.sleepMinutes||r.sleepDuration, daily.sleepDurationMinutes||432);
    const sleepScore=val(r.sleepScore||daily.sleepScore, clamp((sleepMin/480)*90,45,92));
    const hrv=val(r.hrvMs||r.hrv||daily.hrvMs,62);
    const rhr=val(r.restingHr||r.restingHR||r.rhr||daily.restingHr,48);
    const nightly=val(r.nightlyRecharge||r.nightlyRechargeScore||daily.nightlyRecharge,76);
    const actLoad=val(r.activityLoad||r.physicalLoad||daily.activityLoad, clamp((c.sets*3)+(watch.reduce((a,x)=>a+val(x.activeCal,0),0)/12),0,100));
    const energy=val(r.energy||daily.energy, Math.round((sleepScore+nightly)/2));
    const readiness=val(r.readiness||r.readinessScore||daily.readiness, Math.round((sleepScore*.28)+(nightly*.30)+(clamp(hrv,35,85)/85*100*.22)+(clamp(70-rhr,0,35)/35*100*.10)+(energy*.10)));
    return {date,sleepMin,sleepScore,hrv,rhr,nightly,actLoad:clamp(Math.round(actLoad),0,100),energy,readiness:clamp(Math.round(readiness),0,100),raw:r,sets:c.sets,volume:c.vol};
  }
  function readinessLabel(score){ if(score>=82)return ['YÜKLENMEYE HAZIR','Yüklen']; if(score>=68)return ['ORTA-YÜKSEK','Planı Koru']; if(score>=52)return ['KONTROLLÜ','Kontrollü']; if(score>=36)return ['DÜŞÜK','Hacmi Azalt']; return ['RECOVERY','Deload']; }
  function coachNote(r){
    if(r.readiness>=82 && r.actLoad<80) return 'Toparlanma güçlü. Bugün ana hareketlerde planı uygula; form temizse son sette +1 tekrar denenebilir.';
    if(r.readiness>=68) return 'Toparlanma orta-yüksek. Bugün planı koru, ancak failure’a gitme ve toplam hacmi kontrollü tut.';
    if(r.readiness>=52) return 'Hazırlık kontrollü. Ana hareketleri yap ama set sayısını veya RPE’yi biraz aşağıda tut.';
    if(r.readiness>=36) return 'Toparlanma düşük. Bugün toplam hacmi %20–30 azalt, pump/posture odaklı çalış ve failure’dan kaçın.';
    return 'Recovery öncelikli gün. Ağır yüklenme yerine mobilite, yürüyüş veya tam dinlenme daha mantıklı.';
  }
  function setText(id,text){ const el=document.getElementById(id); if(el) el.textContent=text; }
  function setRing(id,score){ const el=document.getElementById(id); if(el) el.style.background=`conic-gradient(var(--polarCyan) 0 ${score}%, rgba(255,255,255,.08) ${score}% 100%)`; }
  window.renderPolarDashboard=function(){
    ensureRecoveryStore();
    const r=recoveryFor(selectedDate);
    const [label,status]=readinessLabel(r.readiness);
    setText('homeReadinessScore',r.readiness); setText('homeReadinessLabel',label); setRing('homeReadinessRing',r.readiness);
    setText('homeNightly',Math.round(r.nightly)); setText('homeNightlyLabel',r.nightly>=70?'İyi':r.nightly>=55?'Orta':'Düşük');
    setText('homeHrv',Math.round(r.hrv)); setText('homeHrvLabel',r.hrv>=65?'İyi':r.hrv>=50?'Orta':'Düşük');
    setText('homeRhr',Math.round(r.rhr)); setText('homeSleep',fmtSleep(r.sleepMin)); setText('homeSleepLabel',r.sleepScore>=75?'İyi':r.sleepScore>=60?'Orta':'Düşük');
    setText('homeCoachNote',coachNote(r)); setText('homeLoadPct',r.actLoad+'%'); setText('homeLoadStatus',r.actLoad>84?'Yüksek':r.actLoad>=40?'Kontrollü':'Düşük');
    const lb=document.getElementById('homeLoadBar'); if(lb) lb.style.width=r.actLoad+'%';
    setText('recoveryScore',r.readiness); setText('recoveryStatus',status); setRing('recoveryRing',r.readiness); setText('recoveryTitle',r.readiness>=68?'Toparlanma iyi.':r.readiness>=52?'Kontrollü gün.':'Recovery öncelikli.');
    setText('recoveryText', r.readiness>=68?'Vücudun yükle başa çıkmaya hazır. Bugün ana hedeflerine odaklan ve akıllı zorlan.':'Vücut sinyalleri yükü sınırlamayı öneriyor. Temiz form, düşük RPE ve kontrollü hacim öncelikli.');
    setText('recNightly',Math.round(r.nightly)); setText('recHrv',Math.round(r.hrv)); setText('recRhr',Math.round(r.rhr)); setText('recoveryCoach',coachNote(r));
    const sleep=document.getElementById('recSleepStages'); if(sleep){ const total=r.sleepMin; const deep=Math.round(total*.22), rem=Math.round(total*.20), light=Math.round(total*.55), awake=Math.max(8,Math.round(total*.03)); const rows=[['Derin',deep],['REM',rem],['Hafif',light],['Uyanık',awake]]; sleep.innerHTML=rows.map(x=>`<div class="stage"><span>${x[0]}</span><em style="width:${clamp(x[1]/Math.max(1,total)*150,8,150)}px"></em><b>${fmtSleep(x[1])}</b></div>`).join('')+`<div class="stage"><span>Toplam</span><em style="width:150px"></em><b>${fmtSleep(total)}</b></div>`; }
    const days=weekDates(); const wr=document.getElementById('polarWeekRow'); if(wr){ wr.innerHTML=days.map((d,i)=>{const rr=recoveryFor(d); const tr=['PZT','SAL','ÇAR','PER','CUM','CMT','PZR'][i]; return `<button class="polarDayChip ${d===selectedDate?'active':''}" onclick="selectedDate='${d}';render()"><b>${tr}</b><strong>${parseDate(d).getDate()}</strong><i>${rr.readiness>=70?'✓':rr.readiness>=52?'•':'!'}</i></button>`}).join(''); }
    const trend=document.getElementById('polarTrendBars'); if(trend){ trend.innerHTML=days.map((d,i)=>{const rr=recoveryFor(d); return `<div class="polarTrendBar" style="height:${clamp(rr.readiness,12,100)}%"><b>${rr.readiness}</b><span>${['PZT','SAL','ÇAR','PER','CUM','CMT','PZR'][i]}</span></div>`}).join(''); }
    renderWorkoutContextPanel(r);
  };
  function renderWorkoutContextPanel(r){
    const right=document.querySelector('#workout .right'); if(!right) return;
    let panel=document.getElementById('workoutContextPanel');
    if(!panel){ panel=document.createElement('div'); panel.id='workoutContextPanel'; panel.className='panel workoutContextPanel'; right.insertBefore(panel,right.firstChild); }
    panel.innerHTML=`<h3>SEANS KONTEKST</h3><div class="workoutContextGrid">
      <div class="workoutContextItem"><span>Hazırlık</span><b>${r.readiness}/100</b></div>
      <div class="workoutContextItem"><span>Uyku</span><b>${fmtSleep(r.sleepMin)}</b></div>
      <div class="workoutContextItem"><span>HRV</span><b>${Math.round(r.hrv)} ms</b></div>
      <div class="workoutContextItem"><span>Dinlenik Nabız</span><b>${Math.round(r.rhr)} bpm</b></div>
      <div class="workoutContextItem"><span>Fiziksel Yük</span><b>${r.actLoad}%</b></div>
    </div><div class="contextCoach"><b>KOÇ NOTU</b><br>${coachNote(r)}</div>`;
  }
  window.importPolarRecovery=function(parsed){
    ensureRecoveryStore();
    if(!parsed.date) throw new Error('polar_recovery date eksik');
    DATA.recoveryEntries[parsed.date]={
      source:parsed.source||'polar_loop_gen2',
      sleepDurationMinutes:val(parsed.sleepDurationMinutes||parsed.sleepMinutes||parsed.sleep?.durationMinutes,0)||undefined,
      sleepScore:val(parsed.sleepScore||parsed.sleep?.score,undefined),
      nightlyRecharge:val(parsed.nightlyRecharge||parsed.recovery?.nightlyRecharge,undefined),
      hrvMs:val(parsed.hrvMs||parsed.hrv||parsed.recovery?.hrvMs,undefined),
      restingHr:val(parsed.restingHr||parsed.restingHR||parsed.rhr||parsed.recovery?.restingHr,undefined),
      activityLoad:val(parsed.activityLoad||parsed.physicalLoad||parsed.activity?.activityLoad,undefined),
      energy:val(parsed.energy||parsed.subjective?.energy,undefined),
      notes:parsed.notes||parsed.subjective?.notes||''
    };
    selectedDate=parsed.date; weekStart=mondayOf(selectedDate);
  };
  window.fillPolarSample=function(){
    const box=document.getElementById('universalJsonBox'); if(!box) return;
    box.value=JSON.stringify({importType:'polar_recovery',source:'polar_loop_gen2',date:selectedDate,sleepDurationMinutes:432,sleepScore:78,nightlyRecharge:76,hrvMs:62,restingHr:48,activityLoad:61,energy:72,notes:'Polar Loop sabah recovery girişi'},null,2);
    box.scrollIntoView({behavior:'smooth',block:'center'});
  };
  const prevUniversal=window.universalImport;
  window.universalImport=function(){
    try{
      const box=document.getElementById('universalJsonBox'); const raw=box?.value?.trim()||'';
      if(raw){ const parsed=JSON.parse(raw); const kind=String(parsed.importType||parsed.type||parsed.kind||'').toLowerCase();
        if(kind==='polar_recovery' || kind==='recovery' || kind==='polar' || parsed.nightlyRecharge || parsed.hrvMs || parsed.restingHr){ importPolarRecovery(parsed); if(box) box.value=''; save(); alert('Polar Recovery içe aktarıldı.'); return; }
      }
    }catch(e){ alert('Polar Import başarısız: '+e.message); return; }
    if(typeof prevUniversal==='function') return prevUniversal.apply(this,arguments);
  };
  const prevRender=window.render;
  window.render=function(){ if(typeof prevRender==='function') prevRender(); setTimeout(()=>{try{renderPolarDashboard();}catch(e){console.warn('polar dashboard render',e)}},0); };
  const prevSave=window.save;
  window.save=function(){
    ensureRecoveryStore();
    if(typeof prevSave==='function') return prevSave.apply(this,arguments);
    localStorage.setItem('atlas_summary_reports',JSON.stringify(DATA));
    render();
  };
  document.addEventListener('DOMContentLoaded',()=>{try{ensureRecoveryStore();renderPolarDashboard();}catch(e){}});
  setTimeout(()=>{try{ensureRecoveryStore();renderPolarDashboard(); const vb=document.querySelector('.versionBadgeCard b'); if(vb) vb.textContent=BUILD; const vs=document.querySelector('.versionBadgeCard span'); if(vs) vs.textContent='Polar Home Dashboard · Recovery Entries · Session Context · Polar Universal Import';}catch(e){}},400);
})();

;

(function(){
  const map={home:'Ana Sayfa',recovery:'Toparlanma',workout:'Workout Logger',gym:'Gym Mode',daily:'Daily Summary',weekly:'Weekly Summary',program:'Program Intelligence',monthly:'Monthly Review',coaching:'Coaching',reports:'Progress & Analytics',data:'Data Center'};
  function sideButtonFor(id){
    const label=map[id];
    return [...document.querySelectorAll('.nav button')].find(b=>label && b.textContent.includes(label)) || null;
  }
  window.simurgCloseMobileMenu=function(){
    document.getElementById('simurgMobileSheet')?.classList.remove('open');
    document.getElementById('simurgMobileShade')?.classList.remove('open');
    document.querySelector('[data-mobile-nav="menu"]')?.classList.remove('menuActive');
  };
  window.simurgOpenMobileMenu=function(){
    document.getElementById('simurgMobileSheet')?.classList.add('open');
    document.getElementById('simurgMobileShade')?.classList.add('open');
    document.querySelector('[data-mobile-nav="menu"]')?.classList.add('menuActive');
  };
  window.simurgSetMobileActive=function(key){
    document.querySelectorAll('[data-mobile-nav]').forEach(b=>b.classList.remove('active','menuActive'));
    const base=['home','recovery','logger','gym'].includes(key)?key:null;
    if(base) document.querySelector(`[data-mobile-nav="${base}"]`)?.classList.add('active');
    else document.querySelector('[data-mobile-nav="menu"]')?.classList.add('active');
  };
  window.simurgGo=function(id,key){
    simurgCloseMobileMenu();
    if(typeof show==='function') show(id, sideButtonFor(id));
    else {
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
      window.scrollTo(0,0);
    }
    simurgSetMobileActive(key||id);
  };
  const oldShow=window.show;
  if(typeof oldShow==='function'){
    window.show=function(id,btn){
      oldShow(id,btn);
      const key=id==='workout'?'logger':id==='coaching'?'coach':id;
      simurgSetMobileActive(['home','recovery','logger','gym'].includes(key)?key:'menu');
    };
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape') simurgCloseMobileMenu();});
})();
