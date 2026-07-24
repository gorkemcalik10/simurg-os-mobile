const SIMURG_CACHE = 'simurg-responsive-overflow-1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './simurg-volume-model.js?v=1',
  './simurg-data-validation.js?v=3',
  './polar-workout.css?v=11',
  './polar-workout.js?v=14',
  './workout-source-policy.js?v=3',
  './premium-standard.css?v=32',
  './premium-standard.js?v=35',
  './simurg-signal-model.js?v=6',
  './polar-accesslink.css?v=4',
  './polar-accesslink.js?v=7',
  './simurg-cloud-auth.js?v=3',
  './desktop-alignment.css?v=24',
  './desktop-alignment.js?v=29',
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
