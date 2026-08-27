const SIMURG_CACHE = 'simurg-weekly-live-ui-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './simurg-persistence.js?v=2',
  './simurg-gym-identity.js?v=1',
  './simurg-exercise-canonicalization.js?v=2',
  './simurg-training-lab-analysis.js?v=6',
  './simurg-volume-model.js?v=1',
  './simurg-exercise-library.js?v=1',
  './simurg-muscle-anatomy.js?v=4',
  './simurg-training-lab-anatomy-assets.js?v=6',
  './simurg-training-lab-anatomy-renderer.js?v=5',
  './simurg-exercise-history.js?v=2',
  './simurg-next-session-target.js?v=2',
  './simurg-data-validation.js?v=9',
  './simurg-workout-recovery.js?v=1',
  './simurg-gym-flex.js?v=1',
  './simurg-exercise-catalog.js?v=1',
  './simurg-gym-flex.css?v=2',
  './polar-workout.css?v=12',
  './polar-workout.js?v=16',
  './workout-source-policy.js?v=3',
  './premium-standard.css?v=41',
  './premium-standard.js?v=53',
  './simurg-signal-model.js?v=7',
  './simurg-journal.js?v=1',
  './simurg-sleep-intelligence.js?v=1',
  './simurg-polar-intelligence.js?v=1',
  './simurg-recovery-intelligence.js?v=1',
  './simurg-energy-engine.js?v=1',
  './simurg-coach-engine.js?v=9',
  './simurg-coach-client.js?v=5',
  './simurg-daily-guidance.js?v=1',
  './simurg-coach.css?v=14',
  './simurg-coach-ui.js?v=15',
  './polar-accesslink.css?v=4',
  './polar-accesslink.js?v=9',
  './simurg-cloud-auth.js?v=7',
  './desktop-alignment.css?v=27',
  './desktop-alignment.js?v=37',
  './mobile-ia-premium.css?v=12',
  './simurg-mobile-weekly.css?v=2',
  './simurg-mobile-weekly.js?v=2',
  './mobile-ia-premium.js?v=11',
  './simurg-training-lab.css?v=13',
  './simurg-training-lab-ui.js?v=19',
  './simurg-journal.css?v=1',
  './simurg-journal-ui.js?v=1',
  './assets/simurg-anatomy-base-v1.png',
  './assets/anatomy-masks/pectoralis_sternal.png',
  './assets/anatomy-masks/pectoralis_clavicular.png',
  './assets/anatomy-masks/abs.png',
  './assets/anatomy-masks/obliques.png',
  './assets/anatomy-masks/anterior_deltoid.png',
  './assets/anatomy-masks/middle_deltoid.png',
  './assets/anatomy-masks/posterior_deltoid.png',
  './assets/anatomy-masks/biceps.png',
  './assets/anatomy-masks/forearms.png',
  './assets/anatomy-masks/triceps_long.png',
  './assets/anatomy-masks/triceps_lateral.png',
  './assets/anatomy-masks/quads.png',
  './assets/anatomy-masks/hip_flexors.png',
  './assets/anatomy-masks/adductors.png',
  './assets/anatomy-masks/glutes.png',
  './assets/anatomy-masks/hams.png',
  './assets/anatomy-masks/calves.png',
  './assets/anatomy-masks/upper_traps.png',
  './assets/anatomy-masks/lower_traps.png',
  './assets/anatomy-masks/spinal_erectors.png',
  './assets/anatomy-masks/lats.png',
  './assets/anatomy-masks/rotator_cuff.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function coreAssetUrl(asset) {
  return new URL(asset, self.registration.scope).href;
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
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== SIMURG_CACHE).map(k => caches.delete(k)))),
      caches.open(SIMURG_CACHE).then(pruneStaleCoreAssetVersions)
    ]).then(() => self.clients.claim())
  );
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
    const trainingLabV2Asset = url.pathname.includes('/assets/training-lab-v2/');
    if (trainingLabV2Asset) {
      const isManifest = url.pathname.endsWith('/anatomy-manifest.json');
      const hasAssetVersion = Boolean(url.searchParams.get('assetVersion'));
      event.respondWith(fetch(req).then(res => {
        if (!res.ok) throw new Error('training_lab_v2_asset_http_' + res.status);
        const copy = res.clone();
        if (isManifest || hasAssetVersion) caches.open(SIMURG_CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => (isManifest || hasAssetVersion) ? caches.match(req) : undefined));
      return;
    }
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
