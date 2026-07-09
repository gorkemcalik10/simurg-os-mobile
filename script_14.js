
/* Simurg OS Premium Coach Insights v2 Compact Gym */
(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function n(v){return Number(v)||0;}
  function scoreSet(w){return n(w.weight)*1000+n(w.reps);}
  function volumeSet(w){return n(w.weight)*n(w.reps);}
  function rowsForExercise(ex){return ((typeof DATA!=='undefined'&&DATA.workouts)||[]).filter(w=>String(w.exercise||'')===String(ex));}
  function bestSetForExercise(ex){
    const rows=rowsForExercise(ex);
    if(!rows.length) return null;
    return rows.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
  }
  function sessionsForExercise(ex){
    const by={};
    rowsForExercise(ex).forEach(w=>{if(!w.date)return;(by[w.date]=by[w.date]||[]).push(w);});
    return Object.entries(by).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([date,sets])=>{
      const best=sets.slice().sort((a,b)=>scoreSet(b)-scoreSet(a)||volumeSet(b)-volumeSet(a))[0];
      return {date,sets,best,score:scoreSet(best)};
    });
  }
  function trendForExercise(ex){
    const sessions=sessionsForExercise(ex).slice(-3);
    if(!sessions.length) return {label:'Veri yok',cls:'empty',target:'İlk temiz kaydı oluştur.'};
    if(sessions.length<2){
      const b=sessions[0].best;
      return {label:'İlk kayıt',cls:'flat',target:`Sonraki hedef: ${n(b.weight)}kg x ${n(b.reps)+1}`};
    }
    const first=sessions[0].score,last=sessions[sessions.length-1].score,b=sessions[sessions.length-1].best;
    if(last>first) return {label:'Improving',cls:'up',target:`Next: ${n(b.weight)}kg x ${n(b.reps)+1}`};
    if(last<first) return {label:'Fatigue',cls:'down',target:`Next: yükü zorlamadan temiz form.`};
    return {label:'Stable',cls:'flat',target:'Next: aynı kiloda +1 tekrar.'};
  }
  function applyCompactGymInsights(){
    document.querySelectorAll('.gymCard').forEach(card=>{
      const ex=card.getAttribute('data-current-name')||card.getAttribute('data-original-name')||'';
      if(!ex)return;
      card.querySelectorAll('.gymInsightBox').forEach(x=>x.remove());
      card.querySelectorAll('.gymCompactInsight').forEach(x=>x.remove());
      const best=bestSetForExercise(ex), tr=trendForExercise(ex);
      const bestText=best?`${n(best.weight)}kg x ${n(best.reps)}`:'Henüz yok';
      const html=`<div class="gymCompactInsight">
        <div class="gymCompactInsightTop">
          <div class="gymCompactInsightTitle">Coach Insight</div>
          <div class="gymCompactInsightMeta">
            <span class="gymCompactPill"><small>Best</small>${esc(bestText)}</span>
            <span class="gymCompactPill ${esc(tr.cls)}"><small>Trend</small>${esc(tr.label)}</span>
          </div>
        </div>
        <div class="gymCompactTarget"><b>Next Target:</b> ${esc(tr.target)}</div>
      </div>`;
      const target=card.querySelector('.gymTargetBox');
      if(target) target.insertAdjacentHTML('afterend',html); else card.insertAdjacentHTML('afterbegin',html);
    });
  }
  function apply(){try{applyCompactGymInsights();}catch(e){console.warn('compact gym insight',e)}}
  const prevRender=window.render;
  window.render=function(){if(typeof prevRender==='function')prevRender();setTimeout(apply,20);};
  setTimeout(apply,180);
  window.__simurgPremiumCoachInsightsV2CompactGym=true;
})();
