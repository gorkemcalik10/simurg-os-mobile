
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
