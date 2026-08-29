(function(root,factory){
  'use strict';
  var engine=root&&root.SimurgPerformanceEngine;
  if(typeof module==='object'&&module.exports){try{engine=require('./simurg-performance-engine.js')}catch(error){}}
  var api=factory(root,engine);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgPerformanceUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,engine){
  'use strict';

  var state={date:null};
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
  function pad(value){return String(value).padStart(2,'0')}
  function today(){var value=new Date();return value.getFullYear()+'-'+pad(value.getMonth()+1)+'-'+pad(value.getDate())}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
  function clampDate(value){var current=today(),candidate=validDate(value)?value:current;return candidate>current?current:candidate}
  function addDays(value,amount){var date=new Date(value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10)}
  function appDate(){var value;try{value=typeof root.selectedDate==='string'?root.selectedDate:null}catch(error){}return clampDate(state.date||value||today())}
  function data(){try{return typeof root.simurgGetData==='function'?root.simurgGetData():(root.DATA||{})}catch(error){return root.DATA||{}}}
  function score(value){return Math.max(0,Math.min(100,Math.round(Number(value)||0)))}
  function dateLabel(value){return new Intl.DateTimeFormat('tr-TR',{weekday:'short',day:'numeric',month:'long'}).format(new Date(value+'T12:00:00'))}
  function confidence(value){return {low:'düşük',medium:'orta',high:'yüksek'}[value]||null}
  function modality(value){return {gym:'Gym',cardio:'Cardio',mixed:'Mixed'}[value]||null}
  function ansStatusLabel(value){
    if(value==null||value==='')return null;
    if(typeof value==='number'||/^[+-]?\d+(?:\.\d+)?$/.test(String(value).trim()))return null;
    var key=String(value).trim().toUpperCase().replace(/[\s-]+/g,'_');
    return {GOOD:'İyi',VERY_GOOD:'Çok iyi',OK:'Normal',NORMAL:'Normal',POOR:'Zayıf',VERY_POOR:'Çok zayıf'}[key]||null;
  }
  function analyze(source,date){return engine.analyze(source,date,{currentDate:today()})}

  function trend(source,endDate){
    var start=addDays(endDate,-13),points=[];
    for(var index=0;index<14;index+=1){
      var date=addDays(start,index),result=analyze(source,date);
      points.push({date:date,readiness:result.readiness.status==='available'?result.readiness.value:null,dailyBalance:result.dailyBalance.status==='available'?result.dailyBalance.value:null});
    }
    return points;
  }
  function segments(points,key,width,height,padding){
    var usableWidth=width-padding*2,usableHeight=height-padding*2,paths=[],active=[];
    function flush(){if(active.length)paths.push(active.join(' '));active=[]}
    points.forEach(function(item,index){var value=item[key];if(value==null){flush();return}var x=padding+(index/(points.length-1))*usableWidth,y=padding+(1-value/100)*usableHeight;active.push((active.length?'L':'M')+x.toFixed(1)+' '+y.toFixed(1))});flush();return paths;
  }
  function chart(points){
    var width=360,height=142,padding=12,readinessPaths=segments(points,'readiness',width,height,padding),balancePaths=segments(points,'dailyBalance',width,height,padding);
    function dots(key,cls){return points.map(function(item,index){if(item[key]==null)return '';var x=padding+(index/13)*(width-padding*2),y=padding+(1-item[key]/100)*(height-padding*2);return '<circle class="'+cls+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.8"><title>'+esc(item.date)+' · '+esc(item[key])+'</title></circle>'}).join('')}
    var labels=[0,6,13].map(function(index){var item=points[index];return '<span style="left:'+(index/13*100)+'%">'+esc(item.date.slice(8,10)+'.'+item.date.slice(5,7))+'</span>'}).join('');
    return '<div class="spTrendPlot"><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Son 14 gün antrenmana hazırlık ve günlük denge grafiği"><g class="spTrendGuides" aria-hidden="true"><line x1="12" y1="12" x2="348" y2="12"></line><line x1="12" y1="71" x2="348" y2="71"></line><line x1="12" y1="130" x2="348" y2="130"></line><text x="12" y="9">100</text><text x="12" y="68">50</text><text x="12" y="127">0</text></g>'+readinessPaths.map(function(path){return '<path class="spReadinessLine" d="'+path+'"></path>'}).join('')+balancePaths.map(function(path){return '<path class="spBalanceLine" d="'+path+'"></path>'}).join('')+dots('readiness','spReadinessDot')+dots('dailyBalance','spBalanceDot')+'</svg><div class="spTrendDates">'+labels+'</div></div>';
  }
  function summary(points){
    var readiness=points.map(function(item){return item.readiness}).filter(function(value){return value!=null}),balance=points.map(function(item){return item.dailyBalance}).filter(function(value){return value!=null});
    function average(values){return values.length?Math.round(values.reduce(function(sum,value){return sum+value},0)/values.length):null}
    return {averageReadiness:average(readiness),averageBalance:average(balance),trainingDays:balance.length};
  }
  function rangeBar(value,label){var current=score(value);return '<div class="spRange" aria-label="'+esc(label)+' '+current+' / 100"><div class="spZones" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b style="left:'+current+'%"></b></div><div class="spZoneLabels"><span>Çok kötü</span><span>Kötü</span><span>Orta</span><span>İyi</span><span>Çok iyi</span></div></div>'}
  function balanceTrack(value,label){var current=score(value);return '<div class="spBalanceRange" aria-label="'+esc(label)+' '+current+' / 100"><div class="spBalanceTrack" aria-hidden="true"><i style="width:'+current+'%"></i><b style="left:'+current+'%"></b></div><div class="spBalanceScale"><span>0</span><span>50</span><span>100</span></div></div>'}
  function scoreHead(title,result,range){return '<div class="spCardHead"><div><small>'+esc(title)+'</small><div class="spScore"><strong>'+score(result.value)+'</strong><span>/ 100</span></div></div><b class="spBand">'+esc(result.band)+'</b></div>'+(range==='balance'?balanceTrack(result.value,title):rangeBar(result.value,title))}
  function missingReadiness(result){
    var missing=result.reason==='exact_date_ans_charge_insufficient'?'Polar ANS Recovery':result.reason==='sleep_capacity_insufficient'?'uyku kapasitesi':'uyku ve toparlanma bileşenleri';
    return '<section class="spCard spEmptyCard" data-performance-state="readiness-insufficient"><small>ANTRENMANA HAZIRLIK</small><h2>Yetersiz veri</h2><p>'+esc(missing)+' bu tarih için eksik. Skor yeniden ağırlıklandırılmadı.</p></section>';
  }
  function readinessCard(result){
    if(!result||result.status!=='available')return missingReadiness(result||{});
    var evidence=result.evidence||{},details=[];
    if(evidence.hrv!=null)details.push('<span><small>HRV · kanıt</small><b>'+esc(evidence.hrv)+' ms</b></span>');
    if(evidence.nightHr!=null)details.push('<span><small>Gece nabzı · kanıt</small><b>'+esc(evidence.nightHr)+' bpm</b></span>');
    var ansLabel=ansStatusLabel(evidence.ansChargeStatus);
    if(ansLabel)details.push('<span><small>ANS durumu · bağlam</small><b>'+esc(ansLabel)+'</b></span>');
    return '<section class="spCard spScoreCard" data-performance-state="readiness-available">'+scoreHead('ANTRENMANA HAZIRLIK',result)+'<div class="spContributors"><div><small>Uyku</small><b>'+score(result.components.sleepCapacity)+'</b></div><div><small>Toparlanma</small><b>'+score(result.components.recovery)+'</b></div></div>'+(details.length?'<details class="spEvidence"><summary>Kanıt ayrıntıları</summary><div>'+details.join('')+'</div></details>':'')+'</section>';
  }
  function balanceCopy(result){
    var readiness=result.readiness,fit=result.loadFit,load=result.actualLoad;
    if(load.value>fit.targetHigh)return 'Bugünkü yük mevcut kapasitenin üzerinde kaldı.';
    if(load.value<fit.targetLow&&fit.targetLow-load.value>=15)return 'Bugünkü yük kapasitenin altında kaldı; kontrollü bir gün oldu.';
    if(readiness.value<60&&fit.value>=80)return 'Hazırlığın düşüktü, ancak uyguladığın yük kapasitenle iyi eşleşti.';
    if(fit.value>=80)return 'Bugünkü yük mevcut kapasitenle iyi eşleşti.';
    if(load.value<fit.targetLow)return 'Bugünkü yük kapasitenin altında kaldı.';
    return 'Bugünkü yük ile mevcut kapasiten arasında belirgin bir fark oluştu.';
  }
  function balanceCard(result){
    var balance=result.dailyBalance,load=result.actualLoad,fit=result.loadFit;
    if(balance.status==='available'){
      var context=[modality(load.modality),confidence(balance.confidence)&&confidence(balance.confidence)+' güven'].filter(Boolean).join(' · ');
      return '<section class="spCard spScoreCard spBalanceCard" data-performance-state="balance-available">'+scoreHead('GÜNLÜK PERFORMANS DENGESİ',balance,'balance')+'<div class="spContributors"><div><small>Hazırlık</small><b>'+score(balance.components.readiness)+'</b></div><div><small>Yük Uyumu</small><b>'+score(balance.components.loadFit)+'</b></div></div><p class="spVerdict">'+esc(balanceCopy(result))+'</p><div class="spLoadContext"><span>Gerçekleşen yük <b>'+score(balance.actualLoadContext)+'</b></span>'+(context?'<span>'+esc(context)+'</span>':'')+'</div></section>';
    }
    if(load.reason==='rest_day_no_completed_training')return '<section class="spCard spPostState" data-performance-state="balance-rest"><small>GÜNLÜK PERFORMANS DENGESİ</small><h2>Antrenman sonrası değerlendirme henüz oluşmadı.</h2><p>Tamamlanmış bir antrenman veya aktivite olduğunda burada görünür.</p></section>';
    if(load.reason==='ambiguous_session_identity')return '<section class="spCard spPostState" data-performance-state="balance-ambiguous"><small>GÜNLÜK PERFORMANS DENGESİ</small><h2>Aktivite eşleşmesi belirsiz</h2><p>Gym ve Polar kayıtlarının aynı seans olup olmadığı doğrulanamadı. Yetersiz veri nedeniyle skor oluşturulmadı.</p></section>';
    return '<section class="spCard spPostState" data-performance-state="balance-insufficient"><small>GÜNLÜK PERFORMANS DENGESİ</small><h2>Yetersiz geçmiş veri</h2><p>Bu antrenmanı karşılaştırmak için aynı türden yeterli geçmiş yük henüz yok.</p></section>';
  }
  function renderDateNav(date){var isToday=date===today();return '<header class="spHeader"><div><small>GÜNLÜK KAPASİTE</small><h1>Performans</h1></div><div class="spDateNav"><button type="button" data-performance-day="-1" aria-label="Önceki gün">‹</button><div><small>SEÇİLİ TARİH</small><b>'+esc(dateLabel(date))+'</b></div><button type="button" data-performance-day="1" aria-label="Sonraki gün" '+(isToday?'disabled':'')+'>›</button></div></header>'}
  function render(){
    var section=root.document&&root.document.getElementById('training-lab');if(!section||!engine)return null;
    if(root.innerWidth>900&&root.SimurgTrainingLabUI){root.SimurgTrainingLabUI.render();return null}
    var selected=appDate(),source=data(),result=analyze(source,selected),points=trend(source,selected),facts=summary(points);state.date=selected;
    section.innerHTML='<div class="spShell">'+renderDateNav(selected)+readinessCard(result.readiness)+balanceCard(result)+'<section class="spCard spTrend"><div class="spTrendHead"><div><small>SON 14 GÜN</small><h2>Günlük trend</h2></div><div class="spLegend"><span class="readiness">Hazırlık</span><span class="balance">Günlük Denge</span></div></div>'+chart(points)+'<div class="spFacts"><div><small>Ort. Hazırlık</small><b>'+(facts.averageReadiness==null?'—':facts.averageReadiness)+'</b></div><div><small>Ort. Denge</small><b>'+(facts.averageBalance==null?'—':facts.averageBalance)+'</b></div><div><small>Skorlu antrenman</small><b>'+facts.trainingDays+'</b></div></div></section></div>';
    Array.prototype.forEach.call(section.querySelectorAll('[data-performance-day]'),function(button){button.addEventListener('click',function(){if(button.disabled)return;state.date=clampDate(addDays(selected,Number(button.getAttribute('data-performance-day'))||0));render()})});
    return result;
  }
  function open(){state.date=appDate();if(typeof root.simurgV8Go==='function')root.simurgV8Go('training-lab','training-lab');render()}
  function setDate(value){state.date=clampDate(value);return state.date}
  return Object.freeze({render:render,open:open,setDate:setDate,trend:trend,summary:summary,balanceCopy:balanceCopy,ansStatusLabel:ansStatusLabel,_state:state});
});
