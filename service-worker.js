/* Vistoria Veicular: cache offline seguro para Cloudflare Pages.
 * O Pages pode redirecionar /index.html para /; nunca guardar
 * a resposta redirecionada como fallback de navegacao.
 */
const CACHE_NAME = 'vistoria-veicular-shell-v1.4.8';
const APP_SHELL = [
  './', './manifest.webmanifest', './service-worker.js', './version.json',
  './assets/app.css', './assets/print-and-custom.css',
  './assets/icons.js', './assets/app.js', './assets/export.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('vistoria-veicular-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Versionamento: sempre consultar o servidor.
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Documentos: rede primeiro; fallback SEM REDIRECIONAMENTO em caso de falha.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./', response.clone()).catch(() => {});
        }
        return response;
      } catch (_error) {
        return (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Assets: cache primeiro para uso offline.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached && !cached.redirected) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected && response.type === 'basic' && !url.search) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_error) {
      return Response.error();
    }
  })());
});
