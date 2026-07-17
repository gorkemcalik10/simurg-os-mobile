const SIMURG_CACHE = 'simurg-critical-stability-ui-fixes-v1-5';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './polar-workout.css?v=11',
  './polar-workout.js?v=11',
  './workout-source-policy.js?v=2',
  './premium-standard.css?v=30',
  './premium-standard.js?v=27',
  './polar-accesslink.css?v=4',
  './polar-accesslink.js?v=4',
  './desktop-alignment.css?v=23',
  './desktop-alignment.js?v=21',
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
    const localDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || /^192\.168\./.test(url.hostname);
    const liveAsset = req.destination === 'script' || req.destination === 'style' || /\.(?:js|css|html)$/.test(url.pathname);
    if (localDev && liveAsset) {
      event.respondWith(fetch(req).then(res => {
        const copy = res.clone();
        caches.open(SIMURG_CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req)));
      return;
    }
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SIMURG_CACHE).then(cache => cache.put(req, copy));
      return res;
    })));
  }
});
