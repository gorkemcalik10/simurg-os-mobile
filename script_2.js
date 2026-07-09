
(function(){
  function getTargetFromButton(btn){
    const attr = btn.getAttribute('onclick') || '';
    const m = attr.match(/show\('([^']+)'/);
    return m ? m[1] : null;
  }

  function activateTarget(id, btn){
    if(!id) return;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');

    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    if(typeof render === 'function') render();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.nav button').forEach(btn => {
      const id = getTargetFromButton(btn);
      if(id) btn.dataset.target = id;
      btn.removeAttribute('onclick');

      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        activateTarget(this.dataset.target, this);
      }, {passive:false});

      btn.addEventListener('touchend', function(e){
        e.preventDefault();
        e.stopPropagation();
        activateTarget(this.dataset.target, this);
      }, {passive:false});
    });
  });
})();
