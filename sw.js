// =========================================================
// sw.js · Service Worker de AU Originals
// Cada vez que subas cambios (precios, catálogo, diseño), sube este número
// para que los clientes reciban la versión nueva enseguida.
// =========================================================
const CACHE_NAME = "au-originals-v2.3";

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "config.js",
  "catalogo.js",
  "css/styles.css",
  "js/frascos.js",
  "js/app.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(FILES_TO_CACHE.map((url) =>
        cache.add(new Request(url, { cache: "reload" })).catch((err) => console.warn("[SW] No se pudo cachear:", url, err))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Red primero (para ver siempre precios al día); si no hay conexión, caché.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // El catálogo y la config siempre se piden frescos (los edita el panel admin).
  const fresco = /\/(catalogo|config)\.js$/.test(new URL(req.url).pathname);
  event.respondWith(
    fetch(req, fresco ? { cache: "no-cache" } : undefined)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
