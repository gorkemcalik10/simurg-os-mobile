(function(root){
  'use strict';
  var selectedDate='';
  var routeMeta={
    home:['Ana','PHOENIX SIGNAL'],
    gym:['Gym','ANTRENMAN'],
    daily:['Günlük','GÜNLÜK AKIŞ'],
    menu:['Menü','KONTROL MERKEZİ'],
    coaching:['Koçluk','COACH INTELLIGENCE'],
    program:['Program','PROGRAM'],
    data:['Veri Merkezi','SİSTEM']
  };
  var mobileNav=[['home','Ana'],['gym','Gym'],['daily','Günlük'],['menu','Menü']];
  var desktopNav=[
    ['home','Ana','Genel'],
    ['gym','Gym','Antrenman'],
    ['daily','Günlük','Antrenman'],
    ['coaching','Koçluk','Rehberlik'],
    ['program','Program','Rehberlik'],
    ['data','Veri Merkezi','Sistem']
  ];
  function trDate(date){
    try{return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',weekday:'short'}).format(new Date(date+'T12:00:00'));}catch(error){return date;}
  }
  function navMarkup(items,mobile){
    var lastGroup='';
    return items.map(function(item){
      var group=item[2]||'',heading='';
      if(!mobile&&group!==lastGroup){lastGroup=group;heading='<small class="ps-nav-group">'+group+'</small>';}
      return heading+'<button type="button" data-route-link="'+item[0]+'"><span>'+root.PhoenixComponents.icon(item[0])+'</span><b>'+item[1]+'</b></button>';
    }).join('');
  }
  function bindNavigation(){
    document.getElementById('phoenixBottomNav').innerHTML=navMarkup(mobileNav,true);
    document.getElementById('phoenixDesktopNav').innerHTML=navMarkup(desktopNav,false);
    document.addEventListener('click',function(event){
      var target=event.target.closest('[data-go],[data-route-link]');
      if(!target)return;
      event.preventDefault();
      root.PhoenixRouter.go(target.dataset.go||target.dataset.routeLink);
    });
  }
  function render(route){
    var meta=routeMeta[route]||routeMeta.home;
    var snapshot=root.PhoenixDataAdapter.snapshot(selectedDate);
    selectedDate=snapshot.date;
    document.getElementById('phoenixTitle').textContent=meta[0];
    document.getElementById('phoenixEyebrow').textContent=meta[1];
    document.getElementById('phoenixDateDay').textContent=trDate(selectedDate);
    document.getElementById('phoenixDateLabel').textContent=selectedDate===root.PhoenixDataAdapter.today()?'Bugün':'Seçili gün';
    document.querySelectorAll('[data-route-link]').forEach(function(item){
      var active=item.dataset.routeLink===route||
        (item.dataset.routeLink==='menu'&&['coaching','program','data'].indexOf(route)>-1);
      item.classList.toggle('active',active);
      if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
    });
    var renderer=root.PhoenixComponents[route]||root.PhoenixComponents.home;
    document.getElementById('phoenixView').innerHTML=renderer(snapshot);
    document.querySelector('.ps-main').scrollTop=0;
  }
  function dismissSplash(){
    root.setTimeout(function(){document.getElementById('phoenixSplash').classList.add('is-hidden');},850);
  }
  function registerWorker(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.register('./phoenix-sw.js',{scope:'./'}).catch(function(){});
  }
  function start(){
    selectedDate=root.PhoenixDataAdapter.today();
    bindNavigation();
    root.PhoenixRouter.subscribe(render);
    root.PhoenixRouter.start();
    dismissSplash();
    registerWorker();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(window);
