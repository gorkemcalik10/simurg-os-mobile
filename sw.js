const SIMURG_CACHE = 'simurg-polar-accesslink-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './polar-workout.css?v=7',
  './polar-workout.js?v=7',
  './premium-standard.css?v=9',
  './premium-standard.js?v=7',
  './polar-accesslink.css?v=2',
  './polar-accesslink.js?v=2',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SIMURG_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SIMURG_CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SIMURG_CACHE).then(cache => cache.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SIMURG_CACHE).then(cache => cache.put(req, copy));
      return res;
    })));
  }
});
