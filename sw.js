const SIMURG_CACHE = 'simurg-stability-v2';
const LEGACY_CACHE_PREFIX = 'simurg-';
const PHOENIX_CACHE_PREFIX = 'simurg-phoenix-signal-';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './simurg-volume-model.js?v=1',
  './simurg-data-validation.js?v=3',
  './polar-workout.css?v=11',
  './polar-workout.js?v=14',
  './workout-source-policy.js?v=3',
  './premium-standard.css?v=34',
  './premium-standard.js?v=40',
  './simurg-signal-model.js?v=6',
  './simurg-coach-engine.js?v=2',
  './simurg-coach-client.js?v=2',
  './simurg-coach.css?v=4',
  './simurg-coach-ui.js?v=3',
  './polar-accesslink.css?v=4',
  './polar-accesslink.js?v=9',
  './simurg-cloud-auth.js?v=3',
  './desktop-alignment.css?v=26',
  './desktop-alignment.js?v=33',
  './mobile-ia-premium.css?v=4',
  './mobile-ia-premium.js?v=3',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function coreAssetUrl(asset) {
  return new URL(asset, self.registration.scope).href;
}

function isPhoenixRequest(url) {
  const phoenixPath = new URL('./phoenix/', self.registration.scope).pathname;
  return url.origin === self.location.origin && url.pathname.startsWith(phoenixPath);
}

function isLegacyCache(cacheName) {
  return cacheName.startsWith(LEGACY_CACHE_PREFIX) &&
    !cacheName.startsWith(PHOENIX_CACHE_PREFIX);
}

function pruneStaleCoreAssetVersions(cache) {
  const currentUrls = new Set(CORE_ASSETS.map(coreAssetUrl));
  const currentPaths = new Set(CORE_ASSETS.map(asset => new URL(asset, self.registration.scope).pathname));
  return cache.keys().then(requests => Promise.all(requests.map(request => {
    const url = new URL(request.url);
    const staleCoreVersion =
      url.origin === self.location.origin &&
      currentPaths.has(url.pathname) &&
      !currentUrls.has(url.href);
    return staleCoreVersion ? cache.delete(request) : false;
  })));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SIMURG_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS).then(() => pruneStaleCoreAssetVersions(cache)))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys
        .filter(k => isLegacyCache(k) && k !== SIMURG_CACHE)
        .map(k => caches.delete(k)))),
      caches.open(SIMURG_CACHE).then(pruneStaleCoreAssetVersions)
    ]).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (isPhoenixRequest(url)) return;
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
