// Compatibility candidate: keep this URL and the registration entry point so
// existing visitors receive the replacement through the normal update lifecycle.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Deliberately no fetch handler: the browser handles navigation and TLS directly.
// Do not reload open documents or clear caches, cookies, storage, or user drafts.
