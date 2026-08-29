'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../simurg-performance-engine.js');

function run(name, fn) {
  try { fn(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n${error.stack}\n`); process.exitCode = 1; }
}
function addDays(date, amount) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
function workout(date, id, raw) { return { date, sessionId:id, exerciseId:`${id}-exercise`, exercise:'Squat', programKey:'strength-a', sets:4, reps:8, rpe:raw/60, durationMinutes:60, startTime:'18:00' }; }
function sleepRow(date, overrides = {}) { return { date, startTime:`${addDays(date,-1)}T23:00:00Z`, endTime:`${date}T07:00:00Z`, deepSleep:90*60, remSleep:90*60, lightSleep:270*60, sleepGoal:8*60*60, ...overrides }; }
function readinessData(date, ansCharge = 4) {
  const data={polarSleep:{daily:{}},polarNightlyRecharge:{daily:{}}};
  for(let offset=-20;offset<=0;offset+=1){const day=addDays(date,offset);data.polarSleep.daily[day]=sleepRow(day);data.polarNightlyRecharge.daily[day]={date:day,ansCharge,ansChargeStatus:'GOOD',nightlyRechargeStatus:'GOOD',heartRateVariabilityAvg:65,heartRateAvg:50};}
  return data;
}
function addBaseline(data,date){data.workouts=data.workouts||[];[100,120,140,160,180,200,220,260,280,300].forEach((raw,index)=>data.workouts.push(workout(addDays(date,index-10),`gym-${index}`,raw)));}

const section={innerHTML:'',querySelectorAll(){return[]}};
global.document={getElementById(id){return id==='training-lab'?section:null}};
global.innerWidth=390;
global.selectedDate='2026-08-21';
global.DATA={};
global.SimurgPerformanceEngine=engine;
const ui=require('../simurg-performance-ui.js');

run('mobile Lab destination renders Performance with readiness score and five-band label',()=>{
  const data=readinessData('2026-08-21');global.DATA=data;ui.setDate('2026-08-21');ui.render();
  assert.match(section.innerHTML,/class="spShell"/);assert.match(section.innerHTML,/>Performans</);assert.match(section.innerHTML,/ANTRENMANA HAZIRLIK/);
  assert.match(section.innerHTML,/data-performance-state="readiness-available"/);assert.match(section.innerHTML,new RegExp(`<strong>${engine.readiness(data,'2026-08-21').value}<\/strong>`));
  assert.match(section.innerHTML,new RegExp(engine.readiness(data,'2026-08-21').band));assert.equal((section.innerHTML.match(/class="spZones"/g)||[]).length,1);
});

run('ANS evidence translates known text and hides unknown numeric status codes',()=>{
  assert.equal(ui.ansStatusLabel('GOOD'),'İyi'); assert.equal(ui.ansStatusLabel('VERY_POOR'),'Çok zayıf'); assert.equal(ui.ansStatusLabel(1),null); assert.equal(ui.ansStatusLabel('1'),null); assert.equal(ui.ansStatusLabel('UNMAPPED_PROVIDER_CODE'),null);
  const data=readinessData('2026-08-21');data.polarNightlyRecharge.daily['2026-08-21'].ansChargeStatus=1;global.DATA=data;ui.setDate('2026-08-21');ui.render();assert.doesNotMatch(section.innerHTML,/ANS durumu[^<]*<\/small><b>1<\/b>/);
});

run('missing readiness component is explicit and never reweighted',()=>{
  global.DATA={polarSleep:{daily:{}},polarNightlyRecharge:{daily:{}}};ui.setDate('2026-08-21');ui.render();
  assert.match(section.innerHTML,/data-performance-state="readiness-insufficient"/);assert.match(section.innerHTML,/Yetersiz veri/);assert.match(section.innerHTML,/Skor yeniden ağırlıklandırılmadı/);
});

run('valid completed workout and comparable baseline render Daily Balance',()=>{
  const data=readinessData('2026-08-21');addBaseline(data,'2026-08-21');data.workouts.push(workout('2026-08-21','current',240));global.DATA=data;ui.setDate('2026-08-21');ui.render();
  const result=engine.analyze(data,'2026-08-21');assert.equal(result.dailyBalance.status,'available');assert.match(section.innerHTML,/data-performance-state="balance-available"/);assert.match(section.innerHTML,new RegExp(result.dailyBalance.band));assert.match(section.innerHTML,/Yük Uyumu/);assert.match(section.innerHTML,/Gerçekleşen yük/);assert.equal((section.innerHTML.match(/class="spZones"/g)||[]).length,1);assert.equal((section.innerHTML.match(/class="spBalanceTrack"/g)||[]).length,1);
});

run('rest day is neutral and sparse load history cannot fabricate Daily Balance',()=>{
  const rest=readinessData('2026-08-21');global.DATA=rest;ui.setDate('2026-08-21');ui.render();assert.match(section.innerHTML,/data-performance-state="balance-rest"/);assert.doesNotMatch(section.innerHTML,/data-performance-state="balance-available"/);
  const sparse=readinessData('2026-08-21');sparse.workouts=[workout('2026-08-21','current',240)];global.DATA=sparse;ui.render();assert.match(section.innerHTML,/data-performance-state="balance-insufficient"/);assert.match(section.innerHTML,/Yetersiz geçmiş veri/);
});

run('ambiguous Gym and Polar identity renders a neutral unavailable state',()=>{
  const date='2026-08-21',data=readinessData(date);addBaseline(data,date);const current=workout(date,'gym-current',240);delete current.startTime;data.workouts.push(current);data.polarWorkouts={daily:{[date]:[{date,polarExerciseId:'polar-functional',workoutType:'Functional Training',durationMinutes:50,cardioLoad:35}]}};global.DATA=data;ui.setDate(date);ui.render();
  const result=engine.analyze(data,date,{currentDate:date});assert.equal(result.actualLoad.reason,'ambiguous_session_identity');assert.equal(result.dailyBalance.status,'insufficient');assert.match(section.innerHTML,/data-performance-state="balance-ambiguous"/);assert.match(section.innerHTML,/Aktivite eşleşmesi belirsiz/);assert.match(section.innerHTML,/Yetersiz veri/);assert.doesNotMatch(section.innerHTML,/data-performance-state="balance-available"/);
});

run('retrospective copy covers low readiness fit and overshoot without recommendations',()=>{
  const lowGood=ui.balanceCopy({readiness:{value:40},loadFit:{value:96,targetLow:30,targetHigh:50},actualLoad:{value:25}});
  assert.equal(lowGood,'Hazırlığın düşüktü, ancak uyguladığın yük kapasitenle iyi eşleşti.');assert.doesNotMatch(lowGood,/öner|yap|azalt|artır/i);
  assert.equal(ui.balanceCopy({readiness:{value:40},loadFit:{value:0,targetLow:30,targetHigh:50},actualLoad:{value:95}}),'Bugünkü yük mevcut kapasitenin üzerinde kaldı.');
});

run('14-day trend resolves each date independently and uses null gaps, never zero',()=>{
  const end='2026-08-21',data=readinessData(end);addBaseline(data,end);data.workouts.push(workout(end,'current',240));
  const points=ui.trend(data,end);assert.equal(points.length,14);assert.equal(points.at(-1).dailyBalance,engine.dailyBalance(data,end).value);assert.ok(points.slice(0,-1).every(point=>point.dailyBalance===null));assert.ok(points.every(point=>point.dailyBalance!==0));
  const before=JSON.stringify(points);data.workouts.push(workout(addDays(end,1),'future',600));data.polarProfile={latest:{sleepGoal:12*60*60,modified:`${addDays(end,1)}T09:00:00Z`}};assert.equal(JSON.stringify(ui.trend(data,end)),before);
});

run('trend summary and chart expose truthful count and light scale references',()=>{
  const data=readinessData('2026-08-21');addBaseline(data,'2026-08-21');data.workouts.push(workout('2026-08-21','current',240));global.DATA=data;ui.setDate('2026-08-21');ui.render();
  assert.match(section.innerHTML,/Skorlu antrenman/);assert.doesNotMatch(section.innerHTML,/Dengeli gün/);assert.match(section.innerHTML,/class="spTrendGuides"/);for(const label of ['100','50','0'])assert.match(section.innerHTML,new RegExp(`>${label}<`));
  const source=fs.readFileSync(path.join(__dirname,'..','simurg-performance-ui.js'),'utf8');assert.doesNotMatch(source,/function band\(/);assert.doesNotMatch(source,/result\.band\s*\|\|/);
});

run('desktop delegates to the intact Training Lab renderer',()=>{
  let legacyRenders=0;global.innerWidth=1200;global.SimurgTrainingLabUI={render(){legacyRenders+=1}};global.DATA=readinessData('2026-08-21');ui.setDate('2026-08-21');ui.render();assert.equal(legacyRenders,1);global.innerWidth=390;
});

run('navigation shape changes only the mobile Lab label and destination',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').replace(/<template\b[\s\S]*?<\/template>/gi,'');const nav=html.match(/<nav id="simurgV8Nav"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/data-key="([^"]+)"/g)].map(match=>match[1]),['home','gym','logger','training-lab','menu']);
  assert.deepEqual([...nav.matchAll(/<\/i>([^<]+)<\/button>/g)].map(match=>match[1]),['Ana','Gym','Günlük','Performans','Menü']);assert.match(nav,/onclick="SimurgPerformanceUI\.open\(\)"/);
});

run('Training Lab intelligence stays loaded and Performance remains Coach-ineligible',()=>{
  for(const file of ['simurg-training-lab-analysis.js','simurg-exercise-history.js','simurg-next-session-target.js','simurg-muscle-anatomy.js','simurg-training-lab-ui.js'])assert.ok(fs.existsSync(path.join(__dirname,'..',file)),file);
  const data=readinessData('2026-08-21');addBaseline(data,'2026-08-21');data.workouts.push(workout('2026-08-21','current',240));const result=engine.analyze(data,'2026-08-21');assert.equal(result.coachEligible,false);assert.equal(result.readiness.coachEligible,false);assert.equal(result.dailyBalance.coachEligible,false);
  const source=fs.readFileSync(path.join(__dirname,'..','simurg-performance-ui.js'),'utf8');assert.doesNotMatch(source,/SimurgCoach|coachEligible\s*:\s*true/);
});

if(process.exitCode)process.exit(process.exitCode);
