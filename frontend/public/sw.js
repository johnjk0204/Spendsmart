const CACHE = "spendsmart-v1";
const OFFLINE_URL = "/";

// Cache app shell on install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["/", "/auth/login", "/auth/register", "/manifest.json"])
    )
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first, fallback to cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Don't intercept API calls
  if (e.request.url.includes("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match(OFFLINE_URL)))
  );
});
