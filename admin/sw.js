const CACHE_NAME = 'ascendra-admin-v1';

const PRECACHE_URLS = [
  '/dashboard.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const SUPABASE_ORIGINS = [
  'supabase.co',
  'supabase.io',
];

function isSupabaseRequest(url) {
  return SUPABASE_ORIGINS.some(origin => url.hostname.endsWith(origin));
}

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf)$/.test(url.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept Supabase API / realtime calls
  if (isSupabaseRequest(url)) return;

  // Never intercept non-GET requests
  if (event.request.method !== 'GET') return;

  // Never intercept cross-origin requests (except fonts/icons below)
  const isSameOrigin = url.origin === self.location.origin;

  // Fonts from Google: stale-while-revalidate
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetched = fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetched;
        })
      )
    );
    return;
  }

  // CDN JS/CSS (jsdelivr, cdn): stale-while-revalidate
  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('cdnjs.')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetched = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetched;
        })
      )
    );
    return;
  }

  if (!isSameOrigin) return;

  // Static assets (images, fonts): cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // HTML pages: network-first, fall back to cache
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
