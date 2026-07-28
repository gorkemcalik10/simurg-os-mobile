(function(root){
  'use strict';
  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function icon(name){
    var paths={
      home:'<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z"/>',
      gym:'<path d="M3 9v6m3-8v10m12-8v6m-3-8v10M6 12h12"/>',
      daily:'<path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"/>',
      menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
      coaching:'<path d="M12 3a5 5 0 0 0-3 9v3h6v-3a5 5 0 0 0-3-9Zm-3 16h6"/>',
      program:'<path d="M5 5h14v14H5zM8 9h8m-8 4h5"/>',
      data:'<path d="M12 4c4 0 7 1.3 7 3s-3 3-7 3-7-1.3-7-3 3-3 7-3Zm-7 3v5c0 1.7 3 3 7 3s7-1.3 7-3V7m-14 5v5c0 1.7 3 3 7 3s7-1.3 7-3v-5"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.menu)+'</svg>';
  }
  function metric(label,value,meta,tone){
    return '<article class="ps-metric '+esc(tone||'')+'"><small>'+esc(label)+'</small><b>'+esc(value)+'</b><span>'+esc(meta)+'</span></article>';
  }
  function card(title,eyebrow,body,className){
    return '<article class="ps-card '+esc(className||'')+'"><small class="ps-eyebrow">'+esc(eyebrow)+'</small><h2>'+esc(title)+'</h2>'+body+'</article>';
  }
  function empty(text){return '<div class="ps-empty"><i></i><p>'+esc(text)+'</p></div>';}
  function readiness(snapshot){
    var score=snapshot.coach.readinessScore;
    if(score==null)score=snapshot.coach.score;
    return score==null?'—':Math.round(Number(score)||0);
  }
  function home(snapshot){
    var decision=snapshot.coach.headline||snapshot.coach.summary||'Verilerin sakin biçimde izleniyor.';
    var sleep=snapshot.polar.sleepScore!=null?snapshot.polar.sleepScore:(snapshot.polar.sleepMinutes?Math.round(snapshot.polar.sleepMinutes/60*10)/10+' sa':'—');
    var workout=snapshot.workout;
    return '<section class="ps-hero">'
      +'<div class="ps-hero-copy"><span class="ps-live"><i></i> BUGÜNÜN SİNYALİ</span><h2>'+esc(decision)+'</h2><p>Koçluk, antrenman ve toparlanma sinyallerin tek bakışta.</p><button type="button" data-go="coaching">Koçluk detayını aç '+icon('coaching')+'</button></div>'
      +'<div class="ps-readiness"><span>HAZIRLIK</span><b>'+esc(readiness(snapshot))+'</b><small>Veri geldikçe kişiselleşir</small></div>'
      +'</section>'
      +'<section class="ps-metrics">'
      +metric('UYKU',sleep,snapshot.polar.nightlyStatus||'Polar özeti','blue')
      +metric('GÜNLÜK YÜK',snapshot.polar.cardioLoad==null?'—':Math.round(snapshot.polar.cardioLoad),'Cardio Load','gold')
      +metric('GYM',workout.sets||'—',workout.sets?workout.volume.toLocaleString('tr-TR')+' kg hacim':'Kayıt bekleniyor','green')
      +'</section>'
      +'<section class="ps-two-col">'
      +card(workout.exercises[0]||'Bugün için kayıt yok','ANTRENMAN AKIŞI',workout.sets?'<p>'+workout.exercises.slice(0,3).map(esc).join(' · ')+'</p><div class="ps-statline"><b>'+workout.sets+' set</b><b>'+workout.reps+' tekrar</b><b>'+workout.volume.toLocaleString('tr-TR')+' kg</b></div>':empty('Gym kaydı geldiğinde seans özeti burada oluşur.'),'ps-session-card')
      +card('Günün kısa özeti','GÜNLÜK',snapshot.daily?'<p>'+esc(snapshot.daily.note||snapshot.daily.notes||snapshot.daily.summary||'Günlük kayıt mevcut.')+'</p>':empty('Henüz günlük notu bulunmuyor.'),'')
      +'</section>';
  }
  function gym(snapshot){
    var rows=snapshot.workoutRows;
    var body=rows.length?'<div class="ps-exercise-list">'+rows.map(function(row,index){
      return '<div class="ps-exercise-row"><span>'+String(index+1).padStart(2,'0')+'</span><div><b>'+esc(row.exercise||'Egzersiz')+'</b><small>'+esc(row.bodyPart||'Bölge belirtilmedi')+'</small></div><strong>'+esc(row.weight||0)+' kg × '+esc(row.reps||0)+'</strong></div>';
    }).join('')+'</div>':empty('Bu gün için kayıtlı set bulunmuyor.');
    return '<header class="ps-page-intro"><div><small>READ-ONLY CHECKPOINT</small><h2>Gym sinyali</h2><p>Mevcut kayıtların hızlı ve güvenli görünümü.</p></div><span class="ps-readonly">Yalnızca görüntüleme</span></header>'
      +'<section class="ps-metrics">'+metric('SET',snapshot.workout.sets,'Toplam','gold')+metric('TEKRAR',snapshot.workout.reps,'Toplam','blue')+metric('HACİM',snapshot.workout.volume.toLocaleString('tr-TR'),'Kilogram','green')+'</section>'
      +card('Seçili günün hareketleri','ANTRENMAN KAYDI',body,'ps-wide');
  }
  function daily(snapshot){
    var hasActivity=!!snapshot.activity,hasWorkout=snapshot.workout.sets>0,hasNote=!!snapshot.daily;
    return '<header class="ps-page-intro"><div><small>TEK GÜN · TEK AKIŞ</small><h2>Günlük sinyal</h2><p>Günün verileri kronolojik ve sade bir görünümde.</p></div></header>'
      +'<section class="ps-signal-strip"><div class="'+(hasWorkout?'done':'')+'"><i>01</i><span>Gym<b>'+(hasWorkout?'Kayıt var':'Bekleniyor')+'</b></span></div><div class="'+(hasActivity?'done blue':'')+'"><i>02</i><span>Aktivite<b>'+(hasActivity?'Kayıt var':'Bekleniyor')+'</b></span></div><div class="'+(hasNote?'done':'')+'"><i>03</i><span>Not<b>'+(hasNote?'Tamamlandı':'Bekleniyor')+'</b></span></div></section>'
      +'<section class="ps-timeline">'
      +card(hasWorkout?snapshot.workout.exercises.slice(0,2).join(' · '):'Gym kaydı yok','ANTRENMAN',hasWorkout?'<p>'+snapshot.workout.sets+' set · '+snapshot.workout.reps+' tekrar · '+snapshot.workout.volume.toLocaleString('tr-TR')+' kg hacim</p>':empty('Bu gün için antrenman girilmedi.'),'')
      +card(hasActivity?String(snapshot.activity.activityType||snapshot.activity.activity||'Aktivite kaydı'):'Aktivite kaydı yok','HAREKET',hasActivity?'<p>'+esc(snapshot.activity.duration||snapshot.activity.calories||'Aktivite kaydı mevcut')+'</p>':empty('Bu gün için aktivite kaydı bulunmuyor.'),'')
      +card(hasNote?'Günlük kayıt tamamlandı':'Günlük notu yok','GÜN SONU',hasNote?'<p>'+esc(snapshot.daily.note||snapshot.daily.notes||snapshot.daily.summary||'Kayıt mevcut.')+'</p>':empty('Günün kısa notu henüz eklenmedi.'),'')
      +'</section>';
  }
  function menu(){
    return '<header class="ps-page-intro"><div><small>SADE KONTROL MERKEZİ</small><h2>Menü</h2><p>Yalnızca üç temel alan.</p></div></header><section class="ps-menu-grid">'
      +menuCard('coaching','Koçluk','Günlük karar, gerekçe ve toparlanma sinyalleri.')
      +menuCard('program','Program','Antrenman yapını ve gün planını incele.')
      +menuCard('data','Veri Merkezi','Cloud, Polar ve yedekleme bağlantı noktası.')
      +'</section>';
  }
  function menuCard(route,title,text){
    return '<button type="button" class="ps-menu-card" data-go="'+route+'"><span>'+icon(route)+'</span><div><small>PHOENIX MODULE</small><b>'+esc(title)+'</b><p>'+esc(text)+'</p></div><i>→</i></button>';
  }
  function shell(title,eyebrow,text,items){
    return '<header class="ps-page-intro"><div><small>'+esc(eyebrow)+'</small><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p></div><span class="ps-readonly">İlk checkpoint</span></header><section class="ps-placeholder-grid">'+items.map(function(item){return card(item[0],item[1],'<p>'+esc(item[2])+'</p>','');}).join('')+'</section>';
  }
  function coaching(snapshot){
    var title=snapshot.coach.headline||'Yerel güvenli analiz';
    var summary=snapshot.coach.summary||snapshot.coach.explanation||'Koçluk motorunun kayıtlı sonucu bulunduğunda burada gösterilir.';
    return shell(title,'COACH INTELLIGENCE',summary,[['Hazırlık '+readiness(snapshot),'GÜNLÜK KARAR','Deterministik güvenlik kararları korunarak okunur.'],['Bugün ne yapmalı?','EYLEM','Ayrıntılı hareket önerileri sonraki checkpoint’te bağlanacak.'],['Neden?','SİNYALLER','Uyku, yük, ağrı ve form nedenleri burada gruplanacak.']]);
  }
  function program(snapshot){
    var names=Object.keys(snapshot.programNames||{});
    return shell('Program omurgası','ANTRENMAN PLANI','Mevcut program yapısı salt okunur olarak bağlandı.',[
      [names.length?names.length+' program günü':'Program verisi bekleniyor','PROGRAM','Gün adları ve planlanan hareketler sonraki checkpoint’te detaylandırılacak.'],
      ['Yük stratejisi','İLERLEME','Set, tekrar ve ağırlık kararları mevcut veri modelinden gelecek.']
    ]);
  }
  function data(snapshot){
    return '<header class="ps-page-intro"><div><small>TEKNİK OLMAYAN VERİ AKIŞI</small><h2>Veri Merkezi</h2><p>Bağlantılar ve kayıt kapsamı tek yerde.</p></div></header><section class="ps-data-summary">'
      +card('Yerel Simurg verisi','BAĞLI','<div class="ps-statline"><b>'+snapshot.counts.workouts+' Gym kaydı</b><b>'+snapshot.counts.activities+' aktivite</b><b>'+snapshot.counts.dailyNotes+' günlük</b></div>','')
      +card('Polar senkronizasyonu','SONRAKİ CHECKPOINT','<p>Mevcut OAuth ve sync motoru yeniden yazılmadan burada güvenli bir kontrol kartına bağlanacak.</p>','')
      +card('Cloud ve yedekleme','SONRAKİ CHECKPOINT','<p>Mevcut Supabase ve dışa aktarma akışları adapter üzerinden erişilebilir olacak.</p>','')
      +'</section>';
  }

  root.PhoenixComponents={esc:esc,icon:icon,home:home,gym:gym,daily:daily,menu:menu,coaching:coaching,program:program,data:data};
})(window);
