
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
