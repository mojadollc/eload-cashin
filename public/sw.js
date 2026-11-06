self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  // Only handle GET requests, skip everything else (POST, navigation, etc.)
  if (e.request.method !== "GET") return;
  // Skip cross-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request));
});
