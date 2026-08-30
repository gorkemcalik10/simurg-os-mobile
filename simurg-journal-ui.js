(function(){
  'use strict';
  var activeDate=null,draft=null,dirty=false;
  function today(){var now=new Date(),offset=now.getTimezoneOffset();return new Date(now.getTime()-offset*60000).toISOString().slice(0,10);}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});}
  function dateLabel(value){return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}
  function stateLabel(value){return value===true?'Evet':value===false?'Hayır':'Belirsiz';}
  function nextState(value){return value===null?true:value===true?false:null;}
  function load(date){activeDate=date;draft=window.SimurgJournal.entryFor(DATA,date);dirty=false;}
  function renderInsights(){
    var result=window.SimurgJournal.insights(DATA,activeDate),items=result.insights||[];
    if(!items.length)return '<div class="sjEmptyInsight">Henüz yeterli veri yok. Günlük kayıtlar biriktikçe kişisel eğilimler burada görünecek.</div>';
    return items.map(function(item){return '<div class="sjInsight"><i>↗</i><span>'+esc(item.message)+'</span></div>';}).join('');
  }
  function render(){
    var root=document.getElementById('journalApp');if(!root||!window.SimurgJournal)return;
    if(!activeDate)load(typeof selectedDate==='string'?selectedDate:today());
    var saved=DATA.journal&&DATA.journal.daily&&DATA.journal.daily[activeDate];
    root.innerHTML='<div class="sjDateBar"><button type="button" data-journal-shift="-1" aria-label="Önceki gün">←</button><label><small>SEÇİLİ TARİH</small><b>'+esc(dateLabel(activeDate))+'</b><input id="journalDatePicker" type="date" value="'+esc(activeDate)+'" max="'+today()+'"></label><button type="button" data-journal-shift="1" aria-label="Sonraki gün" '+(activeDate>=today()?'disabled':'')+'>→</button></div>'+
      '<div class="sjCard"><div class="sjSectionHead"><div><small>BUGÜN</small><h2>Nasıl geçti?</h2></div><span>Dokun: Belirsiz → Evet → Hayır</span></div><div class="sjBehaviorGrid">'+window.SimurgJournal.BEHAVIORS.map(function(item){var value=draft.behaviors[item.key];return '<button type="button" class="sjBehavior is-'+(value===true?'yes':value===false?'no':'unknown')+'" data-journal-behavior="'+item.key+'" aria-pressed="'+(value===null?'mixed':String(value))+'"><i>'+item.icon+'</i><span><b>'+esc(item.label)+'</b><small>'+stateLabel(value)+'</small></span></button>';}).join('')+'</div>'+
      '<label class="sjNote"><span>Kısa not <small>İsteğe bağlı</small></span><textarea id="journalNote" maxlength="500" rows="2" placeholder="Bugüne dair kısa bir not…">'+esc(draft.note)+'</textarea></label>'+
      '<div class="sjSaveRow"><span id="journalSaveState">'+(dirty?'Kaydedilmemiş değişiklikler':saved?'Kayıt güncel':'Bu tarih henüz kaydedilmedi')+'</span><button id="journalSaveButton" type="button">'+(saved?'Güncelle':'Kaydet')+'</button></div></div>'+
      '<div class="sjCard sjInsights"><div class="sjSectionHead"><div><small>KİŞİSEL EĞİLİMLER</small><h2>Sende gördüğümüz ilişkiler</h2></div></div>'+renderInsights()+'<p>Davranışlar yalnızca ertesi takvim günündeki uygun uyku verisiyle karşılaştırılır; sonuçlar neden-sonuç göstermez.</p></div>';
  }
  function setDirty(){dirty=true;var state=document.getElementById('journalSaveState');if(state)state.textContent='Kaydedilmemiş değişiklikler';}
  function changeDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())return;load(date);render();}
  async function saveEntry(){
    var before=JSON.parse(JSON.stringify(DATA.journal||{schemaVersion:1,daily:{}}));
    window.SimurgJournal.upsert(DATA,activeDate,draft,new Date().toISOString());
    var result=typeof save==='function'?await save():{ok:false};
    if(!result||!result.ok){DATA.journal=before;setDirty();return;}
    draft=window.SimurgJournal.entryFor(DATA,activeDate);dirty=false;render();
  }
  document.addEventListener('click',function(event){
    var behavior=event.target.closest&&event.target.closest('[data-journal-behavior]');
    if(behavior&&document.getElementById('journal')&&document.getElementById('journal').contains(behavior)){var key=behavior.dataset.journalBehavior;draft.behaviors[key]=nextState(draft.behaviors[key]);setDirty();render();return;}
    var shift=event.target.closest&&event.target.closest('[data-journal-shift]');if(shift){changeDate(window.SimurgJournal.addDays(activeDate,Number(shift.dataset.journalShift)));return;}
    if(event.target&&event.target.id==='journalSaveButton')saveEntry();
  });
  document.addEventListener('input',function(event){if(event.target.id==='journalNote'){draft.note=event.target.value;setDirty();}});
  document.addEventListener('change',function(event){if(event.target.id==='journalDatePicker')changeDate(event.target.value);});
  window.SimurgJournalUI={open:function(){if(!activeDate)load(today());render();},render:render,selectDate:changeDate,getState:function(){return {date:activeDate,dirty:dirty};}};
})();
