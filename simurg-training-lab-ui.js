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
  function muscleCard(item){return '<button type="button" class="tlMuscle '+(state.muscle===item.id?'active':'')+'" data-tl-muscle="'+esc(item.id)+'" aria-pressed="'+(state.muscle===item.id)+'"><span><b>'+esc(item.label)+'</b><small>'+number(item.sets,1)+' set</small></span>'+trend(item)+'</button>'}
  function region(group,label,path){return '<path class="tlRegion '+(state.muscle===group?'active':'')+'" data-tl-region="'+esc(group)+'" role="button" tabindex="0" aria-label="'+esc(label)+' kas grubunu seç" aria-pressed="'+(state.muscle===group)+'" d="'+path+'"/>'}
  function anatomy(selected){
    return '<figure class="tlAnatomy" data-selected-muscle="'+esc(selected.id)+'"><div class="tlAnatomyStage"><img src="./assets/simurg-anatomy-base-v1.png" alt="" aria-hidden="true" decoding="async">'
      +'<svg viewBox="0 0 1024 1536" aria-labelledby="tlAnatomyTitle tlAnatomyDesc"><title id="tlAnatomyTitle">Ön ve arka gerçekçi kas anatomisi</title><desc id="tlAnatomyDesc">'+esc(selected.label)+' seçili. Grafit anatomi üzerinde ilgili kas bölgesi Simurg yeşiliyle vurgulanır.</desc><defs><filter id="tlGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
      +region('Shoulders','Omuz','M95 336 C112 305 151 297 186 317 C197 333 197 374 184 408 C154 425 119 414 101 386 Z M354 317 C389 297 428 305 445 336 L439 386 C421 414 386 425 356 408 C343 374 343 333 354 317 Z')
      +region('Chest','Göğüs','M153 357 C187 335 232 339 265 367 L265 477 C223 481 173 464 145 424 C141 397 143 374 153 357 Z M275 367 C308 339 353 335 387 357 C397 374 399 397 395 424 C367 464 317 481 275 477 Z')
      +region('Biceps','Biceps','M103 431 C128 408 163 418 177 453 C173 509 159 559 137 604 C112 603 93 583 91 555 C94 508 97 466 103 431 Z M363 453 C377 418 412 408 437 431 C443 466 446 508 449 555 C447 583 428 603 403 604 C381 559 367 509 363 453 Z')
      +region('Core','Core','M178 472 C207 457 238 466 265 489 L265 700 C233 720 199 704 176 672 C162 594 162 526 178 472 Z M275 489 C302 466 333 457 362 472 C378 526 378 594 364 672 C341 704 307 720 275 700 Z')
      +region('Legs','Bacak','M153 707 C197 682 238 699 264 736 L248 996 C226 1032 187 1038 159 1008 C137 894 132 792 153 707 Z M276 736 C302 699 343 682 387 707 C408 792 403 894 381 1008 C353 1038 314 1032 292 996 Z M167 1010 C194 985 225 993 246 1024 L230 1277 C208 1300 178 1291 166 1264 C149 1177 148 1088 167 1010 Z M294 1024 C315 993 346 985 373 1010 C392 1088 391 1177 374 1264 C362 1291 332 1300 310 1277 Z M640 704 C681 684 726 698 752 735 L739 999 C715 1029 678 1030 650 1001 C627 892 623 790 640 704 Z M772 735 C798 698 843 684 884 704 C901 790 897 892 874 1001 C846 1030 809 1029 785 999 Z M653 1004 C681 985 716 995 737 1028 L724 1272 C703 1298 671 1294 656 1265 C638 1178 637 1084 653 1004 Z M787 1028 C808 995 843 985 871 1004 C887 1084 886 1178 868 1265 C853 1294 821 1298 800 1272 Z')
      +region('Rear Delts','Arka Omuz','M589 348 C613 310 654 300 690 321 C706 345 700 383 684 414 C649 427 615 414 594 389 Z M832 321 C868 300 909 310 933 348 L928 389 C907 414 873 427 838 414 C822 383 816 345 832 321 Z')
      +region('Back','Sırt','M704 312 C724 290 747 301 761 345 C775 301 798 290 818 312 C806 349 786 376 761 393 C736 376 716 349 704 312 Z M674 397 C704 376 733 392 756 426 L756 643 C723 626 689 587 672 526 C660 479 660 430 674 397 Z M848 397 C818 376 789 392 766 426 L766 643 C799 626 833 587 850 526 C862 479 862 430 848 397 Z')
      +region('Triceps','Triceps','M584 426 C611 407 646 420 661 454 C656 509 643 562 620 610 C595 610 574 589 573 559 C576 508 579 462 584 426 Z M861 454 C876 420 911 407 938 426 C943 462 946 508 949 559 C948 589 927 610 902 610 C879 562 866 509 861 454 Z')
      +'</svg></div><figcaption><span>ÖN</span><b>'+esc(selected.label)+'</b><span>ARKA</span></figcaption></figure>';
  }
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
    section.innerHTML='<div class="tlShell"><header class="tlHero"><div><div class="tlKicker">Training Lab · v2</div><h1>Bu hafta vücudunu nasıl yükledin?</h1></div><div class="tlWeekNav"><button type="button" data-tl-week="-7" aria-label="Önceki hafta">‹</button><div class="tlWeekLabel"><small>SEÇİLİ HAFTA</small><b>'+periodLabel(result.period)+'</b></div><button type="button" data-tl-week="7" aria-label="Sonraki hafta">›</button></div></header>'
      +'<div class="tlSummary" aria-label="Haftalık Training Lab özeti"><div class="tlStat"><small>Set katkısı</small><b>'+number(result.totals.sets,1)+'</b></div><div class="tlStat"><small>Tekrar</small><b>'+number(result.totals.reps,0)+'</b></div><div class="tlStat"><small>Antrenman günü</small><b>'+result.totals.trainingDays+'</b></div><div class="tlStat"><small>Anlamlı hacim</small><b>'+kg(result.totals.volume)+'</b></div></div>'
      +'<div class="tlMainGrid"><section class="tlPanel tlAnatomyPanel"><div class="tlPanelHead"><div><h2>Kas Görünümü</h2><p>Kas grubunu seç; vücut ve hareket katkısı birlikte güncellensin.</p></div><span class="tlBadge">1.0 ANA · 0.5 YARDIMCI</span></div>'+anatomy(selected)+'<div class="tlMuscleGrid">'+result.groups.map(muscleCard).join('')+'</div></section>'
      +'<section class="tlPanel tlDetailPanel" aria-live="polite"><div class="tlPanelHead"><div><h2>'+esc(selected.label)+' · Hareket Katkısı</h2><p>En yüksek set katkısından sıralanır.</p></div><span class="tlBadge">'+selected.frequency+' GÜN</span></div>'+contributions(selected)+'</section></div>'
      +'<section class="tlPanel tlDistributionPanel"><div class="tlPanelHead"><div><h2>Haftalık Dağılım</h2><p>Ağırlıklı set katkısı</p></div></div><div class="tlDistribution">'+distribution(result.groups)+'</div></section>'
      +'<section class="tlFoot"><details class="tlCalculation"><summary>Hesaplama Notu <span>Nasıl hesaplanır?</span></summary><div class="tlNotice">Ana kas 1.0, yardımcı kas 0.5 katkı alır. Aynı harekette birden fazla alt bölge aynı ana gruba düşerse yalnızca en yüksek katkı sayılır. Bodyweight, izometrik, stabilite, conditioning ve carry hareketlerinde kg hacmi gösterilmez. Bu ekran tıbbi veya fizyolojik bir ölçüm değildir.</div></details>'+unmapped(result.unmapped)+'</section></div>';
    section.querySelectorAll('[data-tl-muscle],[data-tl-region]').forEach(function(button){
      function select(){state.muscle=button.getAttribute(button.hasAttribute('data-tl-muscle')?'data-tl-muscle':'data-tl-region');render()}
      button.addEventListener('click',select);button.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();select()}});
    });
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
