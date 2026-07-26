(function(root){
  'use strict';

  var state={tab:'daily',date:null};
  var tabs=['daily','weekly','history'];
  var decisionLabels={progress:'Kontrollü ilerleme',normal:'Planı koru',controlled:'Kontrollü uygula',reduce:'Yükü azalt',recovery:'Toparlanma günü',rest:'Dinlen'};
  var metricLabels={hrv:'HRV',restingHr:'Dinlenik nabız',sleepMinutes:'Uyku süresi',sleepScore:'Uyku skoru',cardioLoad:'Cardio Load'};

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});}
  function data(){try{return DATA||{};}catch(error){return root.DATA||{};}}
  function today(){var now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');}
  function selected(){try{if(selectedDate)return selectedDate;}catch(error){}return state.date||today();}
  function addDays(value,amount){var parts=String(value).split('-').map(Number),date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
  function longDate(value){try{return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(error){return value;}}
  function resolve(type,date){return root.SimurgCoachClient.resolve(type,date,{data:data()});}
  function list(items,emptyText,limit){
    var rows=(items||[]).slice(0,limit||4);
    return rows.length?'<ul>'+rows.map(function(item){var text=typeof item==='string'?item:(item.summary||item.title||'');return '<li>'+esc(text)+'</li>';}).join('')+'</ul>':'<p class="sci-empty">'+esc(emptyText)+'</p>';
  }
  function statusTone(result){return result.trainingDecision==='progress'||result.trainingDecision==='normal'?'good':result.trainingDecision==='controlled'?'controlled':'risk';}
  function score(result){return result.readinessScore==null?'—':Math.round(result.readinessScore);}
  function confidence(result){return Math.round(result.confidenceScore||0)+'%';}
  function decision(result){return decisionLabels[result.trainingDecision]||result.trainingDecision;}
  function adjustment(result){var value=Number(result.loadAdjustmentPercent)||0;return value===0?'Yük değişikliği yok':(value>0?'+':'')+value+'% yük önerisi';}
  function preview(value){
    var sentences=String(value||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
    return sentences.slice(0,2).map(function(sentence){return '<p>'+esc(sentence.trim())+'</p>';}).join('');
  }
  function heroDrivers(result){
    var rows=(result.keyDrivers||[]).slice(0,2);
    return rows.length?'<div class="sci-hero-drivers">'+rows.map(function(item){return '<span>'+esc(typeof item==='string'?item:(item.summary||item.title||''))+'</span>';}).join('')+'</div>':'';
  }
  function hero(result,kicker){
    return '<section class="sci-hero '+statusTone(result)+'"><div class="sci-hero-main"><small>'+esc(kicker)+'</small><h2>'+esc(result.headline)+'</h2>'
      +'<div class="sci-hero-copy">'+preview(result.summary)+'</div><div class="sci-hero-badges"><span>'+esc(decision(result))+'</span><span>'+esc(adjustment(result))+'</span><span class="sci-inline-readiness">Hazırlık '+esc(score(result))+'</span><span class="sci-inline-readiness">Veri güveni '+esc(confidence(result))+'</span></div>'
      +heroDrivers(result)+'</div><aside class="sci-hero-summary"><div><small>HAZIRLIK</small><b>'+esc(score(result))+'</b></div><div><small>VERİ GÜVENİ</small><b>'+esc(confidence(result))+'</b></div></aside></section>';
  }
  function actionItems(result){
    var value=result.workoutGuidance||{},rows=[value.mainLifts,value.accessories,value.stabilityPosture,value.conditioning].filter(Boolean);
    return rows.filter(function(item,index){return rows.indexOf(item)===index;}).slice(0,3);
  }
  function aiBadge(){return '<span class="sci-local-badge">Yerel güvenli analiz</span>';}
  function nav(date){
    return '<header class="sci-head"><div><small>SIMURG COACH INTELLIGENCE</small><h1>Koçluk</h1><p>'+esc(longDate(date))+'</p></div>'+aiBadge()+'</header>'
      +'<div class="sci-date-nav"><button type="button" onclick="simurgCoachMoveDate(-1)" aria-label="Önceki gün">←</button><b>'+esc(longDate(date))+'</b><button type="button" onclick="simurgCoachMoveDate(1)" aria-label="Sonraki gün">→</button><button type="button" onclick="simurgCoachToday()">Bugün</button></div>'
      +'<div class="sci-tabs" role="tablist">'+tabs.map(function(tab){var label={daily:'Günlük',weekly:'Haftalık',history:'Geçmiş'}[tab];return '<button type="button" role="tab" aria-selected="'+(state.tab===tab?'true':'false')+'" class="'+(state.tab===tab?'active':'')+'" onclick="simurgCoachSetTab(\''+tab+'\')">'+label+'</button>';}).join('')+'</div>';
  }
  function guidance(result){
    var value=result.workoutGuidance||{};
    return '<div class="sci-guidance">'
      +'<article><small>ANA HAREKET</small><p>'+esc(value.mainLifts||'—')+'</p></article>'
      +'<article><small>TAMAMLAYICI</small><p>'+esc(value.accessories||'—')+'</p></article>'
      +'<article><small>STABİLİTE / POSTÜR</small><p>'+esc(value.stabilityPosture||'—')+'</p></article>'
      +'<article><small>KONDİSYON</small><p>'+esc(value.conditioning||'—')+'</p></article>'
      +'</div>';
  }
  function dailyView(date){
    var daily=resolve('daily',date),pre=resolve('pre_workout',date),post=resolve('post_workout',date),pattern=resolve('pattern',date);
    return hero(daily,'BUGÜNKÜ DURUM')
      +'<div class="sci-priority-grid"><section class="sci-card"><header><small>NEDEN?</small><h3>Diğer sinyaller</h3></header>'+list((daily.keyDrivers||[]).slice(2),'Ana nedenler üst özette gösteriliyor.',3)+'</section>'
      +'<section class="sci-card sci-action"><header><small>BUGÜN YAP</small><h3>'+esc(decision(pre))+'</h3></header>'+list(actionItems(pre),'Programı koru ve ilk sette formu kontrol et.',3)+'<strong>'+esc(adjustment(pre))+'</strong></section>'
      +'<section class="sci-card sci-warning"><header><small>SAFETY</small><h3>Güvenlik katmanı</h3></header>'+list(daily.warnings,'Belirgin risk uyarısı yok.',3)+'</section></div>'
      +'<section class="sci-card"><header><small>HAREKET REHBERİ</small><h3>Ana Hareket / Tamamlayıcı / Stabilite / Kondisyon</h3></header>'+guidance(pre)+'</section>'
      +'<div class="sci-mobile-grid"><section class="sci-card sci-recovery"><header><small>TOPARLANMA AKSİYONLARI</small><h3>Bugün uygulanabilir</h3></header>'+list(daily.recoveryActions,'Ek aksiyon yok.',4)+'</section>'
      +'<section class="sci-card"><header><small>TREND & PATTERN</small><h3>'+esc(pattern.headline)+'</h3></header>'+list(pattern.trendInsights,pattern.summary,3)+'</section></div>'
      +'<section class="sci-card sci-confidence"><header><small>VERİ GÜVENİ</small><h3>'+esc(daily.confidenceLabel||'Düşük')+' · '+esc(confidence(daily))+'</h3></header>'+list(daily.missingData,'Temel veri alanlarında belirgin eksik yok.',5)+'</section>'
      +'<details class="sci-details"><summary>Detaylı gerekçe</summary><div><h3>Günlük değerlendirme</h3><p>'+esc(daily.summary)+'</p><h3>Antrenman öncesi</h3><p>'+esc(pre.summary)+'</p><h3>Benzer günler</h3>'+list(daily.comparisonNotes,'Yeterince benzer geçmiş gün bulunamadı.',4)+'<h3>Antrenman sonrası</h3><p>'+esc(post.summary)+'</p><h3>Güvenlik notu</h3><p>'+esc(daily.medicalDisclaimer)+'</p></div></details>';
  }
  function weeklyView(date){
    var weekly=resolve('weekly',date);
    return hero(weekly,'HAFTALIK KOÇ')
      +'<div class="sci-mobile-grid"><section class="sci-card"><header><small>HAFTANIN SİNYALLERİ</small><h3>Öne çıkanlar</h3></header>'+list(weekly.keyDrivers,'Haftalık sinyal yok.',5)+'</section><section class="sci-card sci-action"><header><small>GELECEK KARAR</small><h3>'+esc(decision(weekly))+'</h3></header><p>'+esc(weekly.summary)+'</p><strong>'+esc(adjustment(weekly))+'</strong></section></div>'
      +(weekly.warnings.length?'<section class="sci-card sci-warning"><header><small>HAFTALIK RİSKLER</small><h3>Koruyucu kararlar</h3></header>'+list(weekly.warnings,'Belirgin risk yok.',6)+'</section>':'')
      +'<section class="sci-card sci-recovery"><header><small>TOPARLANMA</small><h3>Yeni haftaya hazırlık</h3></header>'+list(weekly.recoveryActions,'Ek aksiyon yok.',4)+'</section>';
  }
  function historyView(date){
    var rows=[];
    for(var offset=0;offset<7;offset+=1){var day=addDays(date,-offset),result=resolve('daily',day);rows.push('<article><time>'+esc(day)+'</time><b>'+esc(score(result))+'</b><span>'+esc(decision(result))+'</span><small>Veri güveni '+esc(confidence(result))+'</small></article>');}
    var pattern=resolve('pattern',date);
    return '<section class="sci-card"><header><small>SON 7 GÜN</small><h3>Karar geçmişi</h3></header><div class="sci-history">'+rows.join('')+'</div></section>'
      +'<section class="sci-card"><header><small>PATTERN COACH</small><h3>'+esc(pattern.headline)+'</h3></header><p>'+esc(pattern.summary)+'</p>'+list(pattern.trendInsights,'Henüz minimum örnek eşiğini geçen patern yok.',5)+'</section>';
  }
  function renderMobile(){
    if(root.innerWidth>900)return false;
    var section=document.getElementById('coaching');if(!section)return false;
    var date=selected();state.date=date;
    section.classList.add('sci-coaching');
    section.innerHTML='<div class="sci-mobile-shell">'+nav(date)+(state.tab==='daily'?dailyView(date):state.tab==='weekly'?weeklyView(date):historyView(date))+'</div>';
    return true;
  }
  function historyComparison(date){
    var current=resolve('daily',date),previous=resolve('daily',addDays(date,-7)),metrics=['hrv','restingHr','sleepMinutes','sleepScore','cardioLoad'];
    return '<div class="sci-baseline-table"><div><b>Metrik</b><b>Bugün</b><b>7g baz</b><b>Sapma</b></div>'+metrics.map(function(metric){var base=current.baseline&&current.baseline[metric]||{},value=base.current,mean=base[7]&&base[7].mean,deviation=base.deviation7;return '<div><span>'+esc(metricLabels[metric])+'</span><span>'+esc(value==null?'—':Math.round(value*10)/10)+'</span><span>'+esc(mean==null?'—':mean)+'</span><span>'+esc(deviation==null?'—':(deviation>0?'+':'')+deviation+'%')+'</span></div>';}).join('')+'</div><p class="sci-compare-note">7 gün önceki karar: <b>'+esc(decision(previous))+'</b> · readiness '+esc(score(previous))+' · veri güveni '+esc(confidence(previous))+'.</p>';
  }
  function renderDesktop(section,date){
    if(root.innerWidth<=900)return false;
    section=section||document.getElementById('coaching');if(!section)return false;
    date=date||selected();state.date=date;
    var daily=resolve('daily',date),pre=resolve('pre_workout',date),weekly=resolve('weekly',date),pattern=resolve('pattern',date);
    section.classList.remove('gp-coaching-empty');section.classList.add('sci-coaching');
    section.innerHTML='<div id="desktopLegacyCoaching" class="sci-desktop-shell" data-coach-intelligence="1">'+nav(date)
      +hero(daily,'BUGÜNKÜ KARAR')
      +'<div class="sci-priority-grid"><section class="sci-card"><header><small>NEDEN?</small><h3>Diğer sinyaller</h3></header>'+list((daily.keyDrivers||[]).slice(2),'Ana nedenler üst özette gösteriliyor.',4)+'</section><section class="sci-card sci-action"><header><small>BUGÜN YAP</small><h3>'+esc(decision(pre))+'</h3></header>'+list(actionItems(pre),'Programı koru ve ilk sette formu kontrol et.',3)+'<strong>'+esc(adjustment(pre))+'</strong></section><section class="sci-card sci-warning"><header><small>SAFETY</small><h3>AI’dan bağımsız koruma</h3></header>'+list(daily.warnings,'Belirgin risk uyarısı yok.',4)+'</section></div>'
      +'<section class="sci-card"><header><small>HAREKET REHBERİ</small><h3>Ana Hareket / Tamamlayıcı / Stabilite / Kondisyon</h3></header>'+guidance(pre)+'</section>'
      +'<div class="sci-desktop-grid wide"><section class="sci-card"><header><small>7 GÜNLÜK KARŞILAŞTIRMA</small><h3>Baseline ve sapmalar</h3></header>'+historyComparison(date)+'</section><section class="sci-card"><header><small>HAFTALIK COACH</small><h3>'+esc(weekly.headline)+'</h3></header><p>'+esc(weekly.summary)+'</p>'+list(weekly.keyDrivers,'Haftalık veri birikiyor.',4)+'</section></div>'
      +'<div class="sci-desktop-grid wide"><section class="sci-card"><header><small>PATTERN COACH</small><h3>'+esc(pattern.headline)+'</h3></header><p>'+esc(pattern.summary)+'</p>'+list(pattern.trendInsights,'Minimum örnek eşiği henüz aşılmadı.',5)+'</section><section class="sci-card sci-recovery"><header><small>RECOVERY ACTIONS</small><h3>Bugün uygulanabilir</h3></header>'+list(daily.recoveryActions,'Ek aksiyon yok.',5)+'</section></div>'
      +'<footer class="sci-disclaimer">'+esc(daily.medicalDisclaimer)+'</footer></div>';
    return true;
  }
  function removeLegacyCoachCards(content){
    content.querySelectorAll('.gp-prime,.gp-desktop-prime,.gp-coach-flow,.sci-home-insight,.sci-recovery-insight').forEach(function(node){node.remove();});
  }
  function decorateHome(content,tab,date){
    if(!content||!root.SimurgCoachClient)return;
    var result=resolve('daily',date||selected());
    removeLegacyCoachCards(content);
    if(tab==='overview'){
      content.insertAdjacentHTML('afterbegin','<button type="button" class="sci-home-insight '+statusTone(result)+'" onclick="simurgCoachOpen()"><span><small>COACH INSIGHT</small><b>'+esc(result.headline)+'</b><em>'+esc(decision(result))+' · Veri güveni '+esc(confidence(result))+'</em></span><i>Detay →</i></button>');
    }else if(tab==='recovery'){
      var recovery=(result.recoveryActions||[])[0]||(result.keyDrivers||[])[0]||'Toparlanma için veri birikiyor.';
      content.insertAdjacentHTML('afterbegin','<button type="button" class="sci-recovery-insight" onclick="simurgCoachOpen()"><span><small>RECOVERY INSIGHT</small><b>'+esc(recovery)+'</b><em>Koçluk detayında nedenleri gör</em></span><i>→</i></button>');
    }
  }

  root.simurgCoachOpen=function(){return root.innerWidth<=900&&typeof root.simurgV8Go==='function'?root.simurgV8Go('coaching','menu'):typeof root.desktopOpen==='function'?root.desktopOpen('coaching'):null;};
  root.simurgCoachSetTab=function(tab){if(tabs.indexOf(tab)<0)return;state.tab=tab;root.innerWidth<=900?renderMobile():renderDesktop();};
  root.simurgCoachMoveDate=function(amount){state.date=addDays(selected(),Number(amount)||0);try{selectedDate=state.date;if(typeof mondayOf==='function')weekStart=mondayOf(state.date);}catch(error){}root.innerWidth<=900?renderMobile():renderDesktop();};
  root.simurgCoachToday=function(){state.date=today();try{selectedDate=state.date;if(typeof mondayOf==='function')weekStart=mondayOf(state.date);}catch(error){}root.innerWidth<=900?renderMobile():renderDesktop();};
  root.SimurgCoachUI={renderMobile:renderMobile,renderDesktop:renderDesktop,decorateHome:decorateHome,state:state};
})(typeof window!=='undefined'?window:globalThis);
