const CACHE_NAME = 'openhtml-studio-v1.0.2';
const APP_SHELL = [
  './',
  './index.html',
  './css/app.css?v=1.0.2',
  './js/app.js?v=1.0.2',
  './js/editor.js',
  './js/preview.js',
  './js/storage.js',
  './js/validator.js',
  './js/utils.js',
  './manifest.webmanifest',
  './assets/openhtml-studio-logo.png',
  './icons/favicon.ico',
  './icons/icon-32.png',
  './icons/icon-64.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first: quando o servidor local estiver aberto, recebe imediatamente
  // os arquivos mais novos. Se estiver offline, cai para o cache da PWA.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
  );
});
