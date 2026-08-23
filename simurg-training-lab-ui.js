(function(root){
  'use strict';
  var state={date:null,muscle:'Chest',memo:null};
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
  function data(){try{return typeof root.simurgGetData==='function'?root.simurgGetData():(typeof DATA!=='undefined'?DATA:root.DATA||{workouts:[]})}catch(error){return root.DATA||{workouts:[]}}}
  function appDate(){
    try{if(typeof selectedDate==='string')return selectedDate}catch(error){}
    try{if(typeof root.selectedDate==='string')return root.selectedDate}catch(error){}
    var now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  }
  function number(value,digits){return Number(value||0).toLocaleString('tr-TR',{maximumFractionDigits:digits==null?1:digits})}
  function kg(value){return value>0?(value>=1000?number(value/1000,1)+' ton':number(value,0)+' kg'):'—'}
  function periodLabel(period){return period.start.split('-').slice(1).reverse().join('.')+' – '+period.end.split('-').slice(1).reverse().join('.')}
  function fingerprint(rows,start,end){return (rows||[]).filter(function(row){return row&&row.date>=start&&row.date<=end}).map(function(row){return [row.date,row.exerciseId,row.exercise,row.sets,row.reps,row.weight].join('|')}).join('~')}
  function model(){
    var source=data(),rows=Array.isArray(source.workouts)?source.workouts:[],start=root.SimurgTrainingLabAnalysis.weekStart(state.date||appDate()),previous=root.SimurgTrainingLabAnalysis.addDays(start,-7),signature=fingerprint(rows,previous,root.SimurgTrainingLabAnalysis.addDays(start,6));
    if(state.memo&&state.memo.source===source&&state.memo.start===start&&state.memo.signature===signature)return state.memo.value;
    var value=root.SimurgTrainingLabAnalysis.analyze(source,start);state.memo={source:source,start:start,signature:signature,value:value};return value;
  }
  function trend(item){
    if(!item.trend)return '<span class="tlTrend">önceki hafta —</span>';
    var percent=item.trend.percent,cls=percent>0?'up':percent<0?'down':'';return '<span class="tlTrend '+cls+'">'+(percent>0?'+':'')+percent+'%</span>';
  }
  function muscleCard(item){return '<button type="button" class="tlMuscle '+(state.muscle===item.id?'active':'')+'" data-tl-muscle="'+esc(item.id)+'"><div class="tlMuscleTop"><b>'+esc(item.label)+'</b>'+trend(item)+'</div><div class="tlMuscleMetric">'+number(item.sets,1)+' <small>set katkısı</small></div><div class="tlMuscleMeta">'+number(item.reps,0)+' tekrar · '+item.frequency+' gün · '+kg(item.volume)+'</div></button>'}
  function distribution(groups){
    var max=Math.max.apply(null,groups.map(function(item){return item.sets}).concat([1]));
    return groups.map(function(item){return '<div class="tlDistRow"><span>'+esc(item.label)+'</span><div class="tlDistTrack"><i style="width:'+Math.round(item.sets/max*100)+'%"></i></div><b>'+number(item.sets,1)+' set</b></div>'}).join('');
  }
  function contributions(group){
    if(!group||!group.exerciseContributions.length)return '<div class="tlEmpty">Bu hafta bu kas grubu için eşleşen tamamlanmış workout kaydı yok.</div>';
    return '<div class="tlContribution">'+group.exerciseContributions.map(function(item){return '<div class="tlExercise"><div class="tlExerciseTop"><b>'+esc(item.name)+'</b><strong>'+number(item.sets,1)+' set</strong></div><small>'+esc(item.equipment)+' · '+esc(item.movementType)+' · '+item.roles.map(function(role){return role==='primary'?'ana':'yardımcı'}).join(' + ')+'</small><div class="tlExerciseStats"><span>'+number(item.reps,0)+' tekrar</span><span>'+item.frequency+' gün</span><span>'+kg(item.volume)+'</span></div></div>'}).join('')+'</div>';
  }
  function unmapped(items){
    if(!items.length)return '';
    return '<details class="tlUnmapped"><summary>'+items.length+' eşlenmemiş hareket · workload dışında tutuldu</summary><ul>'+items.map(function(item){return '<li>'+esc(item.name)+' ('+item.rows+' kayıt)</li>'}).join('')+'</ul></details>';
  }
  function render(){
    var section=document.getElementById('training-lab');if(!section||!root.SimurgTrainingLabAnalysis)return;
    if(!state.date)state.date=appDate();
    var result=model(),selected=result.groupMap[state.muscle]||result.groups[0];
    section.innerHTML='<div class="tlShell"><div class="tlHero"><div><div class="tlKicker">Training Lab · v1</div><h1>Antrenman yükünü gör.</h1><p>Yalnızca tamamlanmış Gym kayıtları, Exercise Library eşlemesi ve açık katkı kurallarıyla oluşturulur.</p></div><div class="tlWeekNav"><button type="button" data-tl-week="-7" aria-label="Önceki hafta">‹</button><div class="tlWeekLabel"><b>'+periodLabel(result.period)+'</b><small>Seçili hafta</small></div><button type="button" data-tl-week="7" aria-label="Sonraki hafta">›</button></div></div>'
      +'<div class="tlSummary"><div class="tlStat"><small>Set katkısı</small><b>'+number(result.totals.sets,1)+'</b><span>Ana + yardımcı ağırlıklı</span></div><div class="tlStat"><small>Tekrar katkısı</small><b>'+number(result.totals.reps,0)+'</b><span>Yalnızca kayıtlı tekrarlar</span></div><div class="tlStat"><small>Antrenman günü</small><b>'+result.totals.trainingDays+'</b><span>DATA.workouts tarihleri</span></div><div class="tlStat"><small>Anlamlı hacim</small><b>'+kg(result.totals.volume)+'</b><span>kg × tekrar</span></div></div>'
      +'<div class="tlGrid"><div><div class="tlPanel"><div class="tlPanelHead"><div><h2>Kas Görünümü</h2><p>Kas grubunu seçerek hareket katkılarını aç.</p></div><span class="tlBadge">1.0 ANA · 0.5 YARDIMCI</span></div><div class="tlMuscleGrid">'+result.groups.map(muscleCard).join('')+'</div></div><div class="tlPanel"><div class="tlPanelHead"><div><h2>'+esc(selected.label)+' · Hareket Katkısı</h2><p>En yüksek set katkısından sıralanır.</p></div><span class="tlBadge">'+selected.frequency+' GÜN</span></div>'+contributions(selected)+'</div></div>'
      +'<div><div class="tlPanel"><div class="tlPanelHead"><div><h2>Haftalık Dağılım</h2><p>Kas grupları arası ağırlıklı set katkısı.</p></div></div><div class="tlDistribution">'+distribution(result.groups)+'</div></div><div class="tlPanel"><div class="tlPanelHead"><div><h2>Hesaplama Notu</h2></div></div><div class="tlNotice">Ana kas 1.0, yardımcı kas 0.5 katkı alır. Aynı harekette birden fazla alt bölge aynı ana gruba düşerse yalnızca en yüksek katkı sayılır. Bodyweight, izometrik, stabilite, conditioning ve carry hareketlerinde kg hacmi gösterilmez. Bu ekran tıbbi veya fizyolojik bir ölçüm değildir.</div>'+unmapped(result.unmapped)+'</div></div></div></div>';
    section.querySelectorAll('[data-tl-muscle]').forEach(function(button){button.addEventListener('click',function(){state.muscle=button.getAttribute('data-tl-muscle');render()})});
    section.querySelectorAll('[data-tl-week]').forEach(function(button){button.addEventListener('click',function(){state.date=root.SimurgTrainingLabAnalysis.addDays(result.period.start,Number(button.getAttribute('data-tl-week')));state.memo=null;render()})});
  }
  function ensurePrimaryNavEntry(){
    var nav=document.getElementById('simurgV8Nav');if(!nav||nav.querySelector('[data-key="training-lab"]'))return;
    var menu=nav.querySelector('[data-key="menu"]'),button=document.createElement('button');
    button.type='button';button.setAttribute('data-key','training-lab');button.innerHTML='<i>◫</i>Lab';button.addEventListener('click',function(){open()});
    nav.insertBefore(button,menu||null);
  }
  function open(button){
    state.memo=null;
    if(root.innerWidth<=900&&typeof root.simurgV8Go==='function')root.simurgV8Go('training-lab','training-lab');
    else if(typeof root.show==='function')root.show('training-lab',button||null);
    render();
  }
  root.SimurgTrainingLabUI={render:render,open:open,refresh:function(){state.memo=null;render()}};
  ready(function(){ensurePrimaryNavEntry()});
})(typeof globalThis!=='undefined'?globalThis:this);
