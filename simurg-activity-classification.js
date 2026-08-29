(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SimurgActivityClassification=api;
  if(root&&root.window)root.window.SimurgActivityClassification=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function text(value){
    return String(value==null?'':value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/ı/g,'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,' ')
      .trim();
  }
  function key(value){
    var normalized=text(value)||'aktivite';
    if(/functional|fonksiyonel|strength|fitness|gym|weight|resistance|circuit|crossfit|other indoor|kuvvet|ağırlık|agirlik/.test(normalized))return 'strength';
    if(/run|running|jog|koş|kos/.test(normalized))return 'running';
    if(/walk|walking|hike|yürü|yuru/.test(normalized))return 'walking';
    if(/cycl|bike|bicycle|bisik/.test(normalized))return 'cycling';
    if(/swim|yüz|yuz/.test(normalized))return 'swimming';
    if(/tennis|padel|squash|badminton|racquet/.test(normalized))return 'racquet';
    return normalized;
  }
  function isStrength(value){return key(value)==='strength';}

  return Object.freeze({key:key,isStrength:isStrength});
});
