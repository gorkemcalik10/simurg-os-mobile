
/* Simurg OS Professional Polish v1: premium copy, consistent coach language, stable build label */
(function(){
  const BUILD='Simurg OS Professional Polish v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function setBuild(){
    try{
      const b=document.querySelector('.versionBadgeCard b'); if(b)b.textContent=BUILD;
      const s=document.querySelector('.versionBadgeCard span'); if(s)s.textContent='Stable Coach System · Smart Progression · Data Health · Program Intelligence';
    }catch(e){}
  }
  function improveCoachCopy(){
    try{
      document.querySelectorAll('.programIntelPremiumText,.programIntelDeltaText,.monthlyBestProgressText,.coachPremiumMessage,.gymSmartAutoTarget').forEach(el=>{
        let t=el.textContent||'';
        if(!t.trim())return;
        t=t.replace(/mikro progresyon mantıklı/gi,'kontrollü mikro progresyon mantıklı');
        t=t.replace(/daha fazla kayıt gerekiyor/gi,'daha güvenilir yorum için birkaç kayıt daha gerekiyor');
        t=t.replace(/Data Building/gi,'Veri Birikiyor');
        t=t.replace(/Kayıt yok/gi,'Henüz yeterli kayıt yok');
        el.textContent=t;
      });
    }catch(e){}
  }
  function normalizeDataHealth(){
    try{
      document.querySelectorAll('.dataHealthIssue').forEach(el=>{
        const raw=el.textContent||'';
        if(raw.includes('critical')||raw.includes('Critical')) el.classList.add('critical');
        else if(raw.includes('warning')||raw.includes('Warning')||raw.includes('uyarı')) el.classList.add('warn');
        else if(raw.includes('Good')||raw.includes('temiz')||raw.includes('kontrol')) el.classList.add('ok');
      });
    }catch(e){}
  }
  function proPolish(){setBuild();improveCoachCopy();normalizeDataHealth();}
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(){oldRender.apply(this,arguments); setTimeout(proPolish,220);};
  const oldShow=window.show; if(typeof oldShow==='function') window.show=function(){const r=oldShow.apply(this,arguments); setTimeout(proPolish,220); return r;};
  setTimeout(proPolish,400);
})();
