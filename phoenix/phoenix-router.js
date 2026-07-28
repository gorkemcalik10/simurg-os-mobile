(function(root){
  'use strict';
  var route='home';
  var allowed=['home','gym','daily','menu','coaching','program','data'];
  var listeners=[];

  function normalize(value){return allowed.indexOf(value)>-1?value:'home';}
  function fromHash(){return normalize(String(root.location.hash||'#home').slice(1).split('/')[0]);}
  function notify(next){
    route=normalize(next);
    document.documentElement.dataset.phoenixRoute=route;
    listeners.forEach(function(listener){listener(route);});
  }
  function go(next){
    var safe=normalize(next);
    if(root.location.hash!=='#'+safe)root.location.hash=safe;
    else notify(safe);
  }
  function start(){
    root.addEventListener('hashchange',function(){notify(fromHash());});
    notify(fromHash());
  }

  root.PhoenixRouter={
    routes:allowed.slice(),
    start:start,
    go:go,
    current:function(){return route;},
    subscribe:function(listener){if(typeof listener==='function')listeners.push(listener);}
  };
})(window);
