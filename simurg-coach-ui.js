(function(root){
  'use strict';

  var state={tab:'daily',date:null,dailyResults:null};
  var tabs=['daily','weekly','history'];
  var decisionLabels={progress:'Kontrollü ilerleme',normal:'Planı koru',controlled:'Kontrollü uygula',reduce:'Yükü azalt',recovery:'Toparlanma günü',rest:'Dinlen'};
  var dailyDecisionLabels={progress:'Bugün biraz ilerleyebilirsin',normal:'Planını aynen uygula',controlled:'Temkinli başla',reduce:'Bugün biraz azalt',recovery:'Hafif gün yap',rest:'Bugün dinlen'};
  var metricLabels={hrv:'HRV',restingHr:'Dinlenik nabız',sleepMinutes:'Uyku süresi',sleepScore:'Uyku skoru',cardioLoad:'Cardio Load'};

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});}
  function data(){try{return DATA||{};}catch(error){return root.DATA||{};}}
  function today(){var now=new Date();return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');}
  function selected(){try{if(selectedDate)return selectedDate;}catch(error){}return state.date||today();}
  function addDays(value,amount){var parts=String(value).split('-').map(Number),date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
  function longDate(value){try{return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}catch(error){return value;}}
  function resolve(type,date){return root.SimurgCoachClient.resolve(type,date,{data:data()});}
  function resolveImmediate(type,date){return root.SimurgCoachClient.resolve(type,date,{data:data(),store:false,engineOptions:{deferTechnical:true}});}
  function list(items,emptyText,limit){
    var rows=(items||[]).slice(0,limit||4);
    return rows.length?'<ul>'+rows.map(function(item){var text=typeof item==='string'?item:(item.summary||item.title||'');return '<li>'+esc(text)+'</li>';}).join('')+'</ul>':'<p class="sci-empty">'+esc(emptyText)+'</p>';
  }
  function statusTone(result){return result.trainingDecision==='progress'||result.trainingDecision==='normal'?'good':result.trainingDecision==='controlled'?'controlled':'risk';}
  function score(result){return result.readinessScore==null?'—':Math.round(result.readinessScore);}
  function confidence(result){return Math.round(result.confidenceScore||0)+'%';}
  function decision(result){return decisionLabels[result.trainingDecision]||result.trainingDecision;}
  function dailyDecision(result){return dailyDecisionLabels[result.trainingDecision]||result.trainingDecision;}
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
    var dailyHead=state.tab==='daily';
    return '<header class="sci-head"><div>'+(dailyHead?'':'<small>SIMURG COACH INTELLIGENCE</small>')+'<h1>Koçluk</h1><p>'+esc(longDate(date))+'</p></div>'+(dailyHead?'':aiBadge())+'</header>'
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
  function metric(result,key){return result&&result.baseline&&result.baseline[key]||{};}
  function plainDecisionExplanation(result){
    if(result.readinessScore==null)return 'Toparlanma verilerin eksik olduğu için bugün kontrollü ilerle ve ilk setten sonra nasıl hissettiğini değerlendir.';
    return {
      progress:'Toparlanman iyi görünüyor; temiz ve ağrısız setlerde küçük bir ilerleme deneyebilirsin.',
      normal:'Toparlanman planındaki antrenmanı değiştirmeden uygulamak için yeterli görünüyor.',
      controlled:'Antrenmana kontrollü başla; ilk çalışma seti beklenenden ağır gelirse yük artırma.',
      reduce:'Bugünkü sinyaller daha korumacı olmayı söylüyor; toplam yükü veya set sayısını biraz azalt.',
      recovery:'Toparlanma sinyallerin zayıf; düşük stresli ve hafif bir gün seç.',
      rest:'Güvenlik sinyalleri bugün antrenman yükü yerine dinlenmeyi önceliklendiriyor.'
    }[result.trainingDecision]||'Bugünkü planını ilk çalışma setindeki hislerine göre kontrollü uygula.';
  }
  function semanticDeviation(value,positive){
    if(value==null)return 'Kayıt yok';
    var adjusted=positive?value:-value;
    return adjusted>=8?'Normalinden yüksek':adjusted<=-8?'Normalinden düşük':'Normal';
  }
  function sleepReason(result){
    var duration=metric(result,'sleepMinutes'),sleepScore=metric(result,'sleepScore'),minutes=duration.current,scoreValue=sleepScore.current,deviation=duration.deviation7;
    if(minutes==null&&scoreValue==null)return {icon:'😴',title:'Uyku',status:'Veri bekleniyor',copy:'Uyku kaydı gelmediği için değerlendirme temkinli tutuldu.'};
    if((minutes!=null&&minutes<360)||(scoreValue!=null&&scoreValue<60))return {icon:'😴',title:'Uyku',status:'Düşük',copy:'Uyku süren veya kaliten bugün normal desteğin altında görünüyor.'};
    if(minutes!=null&&minutes>=420&&(deviation==null||deviation>=-8))return {icon:'😴',title:'Uyku',status:'İyi',copy:'Normal uyku düzenine yakınsın.'};
    return {icon:'😴',title:'Uyku',status:'Biraz düşük',copy:'Uyku desteğin bugün normalinden biraz daha sınırlı.'};
  }
  function recoveryReason(result){
    var hrv=metric(result,'hrv'),heart=metric(result,'restingHr'),hdev=hrv.deviation7,rdev=heart.deviation7;
    if(hrv.current==null&&heart.current==null)return {icon:'♥',title:'Toparlanma',status:'Veri bekleniyor',copy:'Toparlanma ölçümleri gelmediği için kesin bir sonuç çıkarılmadı.'};
    if((hdev!=null&&hdev<=-8)||(rdev!=null&&rdev>=8))return {icon:'♥',title:'Toparlanma',status:'Biraz düşük',copy:'Toparlanma sinyallerinden biri kendi normalinin altında.'};
    if((hdev!=null&&hdev>=8)&&(rdev==null||rdev<8))return {icon:'♥',title:'Toparlanma',status:'İyi',copy:'HRV ve dinlenik nabzın toparlanmayı destekliyor.'};
    return {icon:'♥',title:'Toparlanma',status:'Normal',copy:'HRV ve dinlenik nabzın kendi seviyelerine yakın.'};
  }
  function loadReason(result){
    var load=metric(result,'cardioLoad'),ratio=metric(result,'cardioLoadRatio'),ratioValue=ratio.current;
    if(load.current==null&&ratioValue==null)return {icon:'⚡',title:'Son yük',status:'Veri bekleniyor',copy:'Yakın dönem yük kaydı henüz yeterli değil.'};
    if((ratioValue!=null&&ratioValue>=1.3)||(load.deviation7!=null&&load.deviation7>=35))return {icon:'⚡',title:'Son yük',status:'Yüksek',copy:'Son günlerdeki yükün kendi alıştığın seviyenin üstünde.'};
    return {icon:'⚡',title:'Son yük',status:'Dengeli',copy:'Son günlerde aşırı yüklenme işareti görünmüyor.'};
  }
  function reasonCards(result){
    return [sleepReason(result),recoveryReason(result),loadReason(result)].map(function(item){return '<article><span class="sci-reason-icon" aria-hidden="true">'+item.icon+'</span><div><h3>'+esc(item.title)+' <b>· '+esc(item.status)+'</b></h3><p>'+esc(item.copy)+'</p></div></article>';}).join('');
  }
  function warningPresentation(value){
    var text=String(value||'');
    if(/Ağrı kaydı/.test(text))return {title:'Ağrılı harekette yük artırma',copy:'Ağrısız hareket aralığını koru ve progresyon deneme.'};
    if(/Belirgin ağrı/.test(text))return {title:'Ağrı uyarısını ciddiye al',copy:'Bugün performans hedefini geri çek ve ağrılı hareketi zorlama.'};
    if(/Form Okay/.test(text))return {title:'Bugün ağırlık artırma',copy:'Önce hareketi sadeleştir ve temiz formu geri kazan.'};
    if(/Form Bad/.test(text))return {title:'Yükü ve setleri azalt',copy:'Form kaydı zayıf olduğu için tempo ve kontrolü önceliklendir.'};
    if(/RPE 9/.test(text))return {title:'Ek yük ekleme',copy:'Son efor çok yüksekti; agresif ağırlık artışı yapma.'};
    if(/Birden fazla olumsuz/.test(text))return {title:'Yorgunluk birikiyor',copy:'Birden fazla toparlanma sinyali zayıf; ek kondisyon ekleme.'};
    if(/Tenis|badminton/.test(text))return {title:'Omuz ve önkol yükünü kontrol et',copy:'Raket sporu sonrası press ve row hareketlerine kontrollü başla.'};
    if(/Eksik recovery/.test(text))return {title:'Veriler tamamlanana kadar temkinli ol',copy:'Toparlanma verileri eksik olduğu için bugün ağırlık artırma.'};
    return {title:'Bugün dikkatli ilerle',copy:text};
  }
  function warningsCard(result){
    var rows=result.warnings||[];if(!rows.length)return '';
    return '<section class="sci-card sci-warning sci-daily-warning"><header><small>DİKKAT ET</small></header><div class="sci-warning-list">'+rows.map(function(item){var warning=warningPresentation(item);return '<article><h3>'+esc(warning.title)+'</h3><p>'+esc(warning.copy)+'</p></article>';}).join('')+'</div></section>';
  }
  function workoutNote(result){
    var note={
      progress:'Ana hareketlerde yalnızca temiz ve ağrısız setlerde küçük bir ilerleme dene. Koruma hareketlerinde tempo ve kontrolü önemse.',
      normal:'Ana hareketlerde mevcut yükü koru. Koruma hareketlerinde ağırlıktan çok tempo ve kontrolü önemse.',
      controlled:'Ana hareketlerde yük artırma; ilk çalışma setini kontrollü değerlendir. Tempo ve temiz formu koru.',
      reduce:'Toplam yükü veya set sayısını azalt. Ağrısız, temiz tekrar kalitesini koru.',
      recovery:'Yoğun setler yerine düşük stresli hareket, mobilite ve toparlanmayı seç.',
      rest:'Bugün planlı antrenman yükü ekleme; dinlenmeye alan aç.'
    }[result.trainingDecision];
    if((result.warnings||[]).some(function(item){return /Tenis|badminton/.test(item);}))note+=' Press ve row başlangıcında omuz, dirsek ve önkolunu kontrol et.';
    return note?'<section class="sci-card sci-workout-note"><header><small>BUGÜNKÜ ANTRENMAN NOTU</small></header><p>'+esc(note)+'</p></section>':'';
  }
  function durationLabel(value){if(value==null)return '—';var minutes=Math.round(value);return Math.floor(minutes/60)+' sa '+String(minutes%60).padStart(2,'0')+' dk';}
  function roundOne(value){return value==null?'—':Math.round(value*10)/10;}
  function gymSnapshot(date){
    var rows=(data().workouts||[]).filter(function(row){return row&&row.date<=date;}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
    if(!rows.length)return {};
    var latestDate=rows[0].date,latest=rows.filter(function(row){return row.date===latestDate;}),rpes=latest.map(function(row){return Number(row.rpe);}).filter(Number.isFinite);
    var forms=latest.map(function(row){return String(row.form||'').toLowerCase();}),pains=latest.map(function(row){return String(row.pain||'').toLowerCase();});
    return {rpe:rpes.length?rpes.reduce(function(sum,value){return sum+value;},0)/rpes.length:null,form:forms.some(function(value){return /bad|poor|kötü|kotu/.test(value);})?'Zayıf':forms.some(function(value){return /okay|orta|fair/.test(value);})?'Orta':forms.some(Boolean)?'İyi':'Kayıt yok',pain:pains.some(function(value){return value&&!/none|yok|^0$/.test(value);})?'Var':pains.some(Boolean)?'Yok':'Kayıt yok'};
  }
  function metricRow(label,status,value){return '<div class="sci-metric-row"><span>'+esc(label)+'</span><b>'+esc(status)+'</b><small>'+esc(value||'')+'</small></div>';}
  function metricsContent(date,result){
    var sleep=metric(result,'sleepMinutes'),hrv=metric(result,'hrv'),heart=metric(result,'restingHr'),load=loadReason(result),gym=gymSnapshot(date);
    return '<div class="sci-metric-list">'
      +metricRow('Uyku',sleepReason(result).status,durationLabel(sleep.current))
      +metricRow('HRV',semanticDeviation(hrv.deviation7,true),hrv.current==null?'—':roundOne(hrv.current)+' ms')
      +metricRow('Dinlenik nabız',semanticDeviation(heart.deviation7,false),heart.current==null?'—':Math.round(heart.current)+' bpm')
      +metricRow('Cardio Load',load.status,'')
      +metricRow('Son Gym RPE',gym.rpe==null?'Kayıt yok':gym.rpe<6?'Hafif':gym.rpe<8?'Orta':'Yüksek',gym.rpe==null?'—':roundOne(gym.rpe))
      +metricRow('Form',gym.form||'Kayıt yok','')+metricRow('Ağrı',gym.pain||'Kayıt yok','')+'</div>';
  }
  function baselineTable(result){
    var keys=['hrv','restingHr','sleepMinutes','sleepScore','cardioLoad','strain','tolerance','cardioLoadRatio'];
    return '<div class="sci-tech-table"><div><b>Metrik</b><b>Bugün</b><b>7g</b><b>14g</b><b>28g</b><b>Sapma</b></div>'+keys.map(function(key){var item=metric(result,key),label={hrv:'HRV',restingHr:'Dinlenik nabız',sleepMinutes:'Uyku',sleepScore:'Uyku skoru',cardioLoad:'Cardio Load',strain:'Strain',tolerance:'Tolerance',cardioLoadRatio:'Strain/Tolerance'}[key];return '<div><span>'+esc(label)+'</span><span>'+esc(roundOne(item.current))+'</span><span>'+esc(roundOne(item[7]&&item[7].mean))+'</span><span>'+esc(roundOne(item[14]&&item[14].mean))+'</span><span>'+esc(roundOne(item[28]&&item[28].mean))+'</span><span>'+esc(item.deviation7==null?'—':(item.deviation7>0?'+':'')+item.deviation7+'%')+'</span></div>';}).join('')+'</div>';
  }
  function technicalContent(date,results){
    var daily=resolve('daily',date),pre=resolve('pre_workout',date),post=resolve('post_workout',date),pattern=resolve('pattern',date);
    return '<div class="sci-tech-section"><h3>Kişisel karşılaştırmalar</h3>'+baselineTable(daily)
      +'<h3>Veri güveni</h3><p>'+esc(confidence(daily))+' · '+esc(daily.confidenceLabel||'Düşük')+'</p>'+list(daily.missingData,'Eksik temel veri yok.',8)
      +'<h3>Trendler ve benzer günler</h3>'+list(daily.trendInsights,'Yeterli trend verisi yok.',6)+list(daily.comparisonNotes,'Yeterince benzer gün bulunamadı.',4)
      +'<h3>Tekrarlanan paternler</h3><p>'+esc(pattern.summary)+'</p>'+list(pattern.trendInsights,'Minimum örnek eşiğini geçen patern yok.',5)
      +'<h3>Ham koç gerekçesi</h3><p>'+esc(daily.summary)+'</p><p>'+esc(pre.summary)+'</p><p>'+esc(post.summary)+'</p>'
      +'<h3>Güvenlik notu</h3><p>'+esc(daily.medicalDisclaimer)+'</p></div>';
  }
  function dailyView(date){
    var daily=resolveImmediate('daily',date),pre=resolveImmediate('pre_workout',date);state.dailyResults={date:date,daily:daily,pre:pre};
    return '<section class="sci-decision '+statusTone(pre)+'"><div><small>BUGÜN NE YAPAYIM?</small><h2>'+esc(dailyDecision(pre))+'</h2><p>'+esc(plainDecisionExplanation(pre))+'</p></div><span>Hazırlık '+esc(score(daily))+'</span></section>'
      +'<section class="sci-reasons" aria-labelledby="sciReasonsTitle"><h2 id="sciReasonsTitle">Neden?</h2>'+reasonCards(daily)+'</section>'
      +warningsCard(pre)+workoutNote(pre)
      +'<details class="sci-details sci-disclosure" ontoggle="simurgCoachToggleDetails(this,\'metrics\')"><summary>Verilerimi Göster</summary><div data-lazy-content="metrics"><p class="sci-empty">Açıldığında günlük ölçümlerin gösterilir.</p></div></details>'
      +'<details class="sci-details sci-disclosure" ontoggle="simurgCoachToggleDetails(this,\'technical\')"><summary>Teknik Detaylar</summary><div data-lazy-content="technical"><p class="sci-empty">Açıldığında ayrıntılı analiz hazırlanır.</p></div></details>';
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
  root.simurgCoachToggleDetails=function(node,kind){
    if(!node||!node.open||node.dataset.loaded==='1')return;
    var date=selected(),results=state.dailyResults;
    if(!results||results.date!==date)return;
    var target=node.querySelector('[data-lazy-content="'+kind+'"]');if(!target)return;
    target.innerHTML=kind==='technical'?technicalContent(date,results):metricsContent(date,results.daily);
    node.dataset.loaded='1';
  };
  root.SimurgCoachUI={renderMobile:renderMobile,renderDesktop:renderDesktop,decorateHome:decorateHome,state:state,dailyDecisionLabels:dailyDecisionLabels,plainDecisionExplanation:plainDecisionExplanation,warningPresentation:warningPresentation};
})(typeof window!=='undefined'?window:globalThis);
