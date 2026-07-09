
(function(){
  const map={home:'Ana Sayfa',recovery:'Toparlanma',workout:'Workout Logger',gym:'Gym Mode',daily:'Daily Summary',weekly:'Weekly Summary',program:'Program Intelligence',monthly:'Monthly Review',coaching:'Coaching',reports:'Progress & Analytics',data:'Data Center'};
  function sideButtonFor(id){
    const label=map[id];
    return [...document.querySelectorAll('.nav button')].find(b=>label && b.textContent.includes(label)) || null;
  }
  window.simurgCloseMobileMenu=function(){
    document.getElementById('simurgMobileSheet')?.classList.remove('open');
    document.getElementById('simurgMobileShade')?.classList.remove('open');
    document.querySelector('[data-mobile-nav="menu"]')?.classList.remove('menuActive');
  };
  window.simurgOpenMobileMenu=function(){
    document.getElementById('simurgMobileSheet')?.classList.add('open');
    document.getElementById('simurgMobileShade')?.classList.add('open');
    document.querySelector('[data-mobile-nav="menu"]')?.classList.add('menuActive');
  };
  window.simurgSetMobileActive=function(key){
    document.querySelectorAll('[data-mobile-nav]').forEach(b=>b.classList.remove('active','menuActive'));
    const base=['home','recovery','logger','gym'].includes(key)?key:null;
    if(base) document.querySelector(`[data-mobile-nav="${base}"]`)?.classList.add('active');
    else document.querySelector('[data-mobile-nav="menu"]')?.classList.add('active');
  };
  window.simurgGo=function(id,key){
    simurgCloseMobileMenu();
    if(typeof show==='function') show(id, sideButtonFor(id));
    else {
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
      window.scrollTo(0,0);
    }
    simurgSetMobileActive(key||id);
  };
  const oldShow=window.show;
  if(typeof oldShow==='function'){
    window.show=function(id,btn){
      oldShow(id,btn);
      const key=id==='workout'?'logger':id==='coaching'?'coach':id;
      simurgSetMobileActive(['home','recovery','logger','gym'].includes(key)?key:'menu');
    };
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape') simurgCloseMobileMenu();});
})();
