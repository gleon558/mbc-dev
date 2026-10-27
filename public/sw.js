const CACHE = 'mbc-pedidos-v12'; // Subir este número en cada deploy importante fuerza a limpiar la caché vieja
const ASSETS = ['/manifest.json']; // OJO: index.html y '/' ya NO se cachean acá (ver más abajo)

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // La navegación principal (la página en sí, index.html) NUNCA pasa por la caché del
  // Service Worker: siempre va directo a la red. Es el archivo que más cambia y el que
  // tiene toda la lógica de la app — cachearlo es lo que causaba que, después de un
  // deploy, la gente siguiera viendo la versión vieja hasta borrar datos del sitio a mano.
  if (e.request.mode === 'navigate' || e.request.url.endsWith('/index.html') || e.request.url.endsWith('/')) {
    return;
  }
  // Solo cachear recursos propios, no Firebase
  if (e.request.url.includes('firebase') || 
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic') ||
      e.request.url.includes('fonts')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
