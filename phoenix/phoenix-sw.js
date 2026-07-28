'use strict';
const CACHE='simurg-phoenix-signal-v3';
const ASSETS=[
  './',
  './index.html',
  './phoenix-tokens.css',
  './phoenix.css',
  './phoenix-data-adapter.js',
  './phoenix-router.js',
  './phoenix-components.js',
  './phoenix-app.js'
];

self.addEventListener('install',function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){return cache.addAll(ASSETS);}));
  self.skipWaiting();
});

self.addEventListener('activate',function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key.indexOf('simurg-phoenix-signal-')===0&&key!==CACHE;
      }).map(function(key){return caches.delete(key);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(event){
  var request=event.request;
  if(request.method!=='GET')return;
  var url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.indexOf('/phoenix/')<0)return;
  event.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(request).then(function(cached){
        return cached||fetch(request).then(function(response){
          if(response&&response.ok)cache.put(request,response.clone());
          return response;
        });
      });
    })
  );
});
