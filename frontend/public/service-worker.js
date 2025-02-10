importScripts("https://cdn.jsdelivr.net/npm/idb@7/build/umd.js");

const CACHE_NAME = "pos-v1";

// Add all the routes and assets that need to be available offline
const ROUTES_TO_CACHE = [
  "/",
  "/login",
  "/dashboard",
  "/products",
  "/transactions",
  "/transaction-history",
];

// Add essential assets and API responses to cache
const ASSETS_TO_CACHE = [
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/index.html",
  "/offline.html",
  "/src/main.jsx",
  "/src/App.jsx",
  // Add your CSS and JS files
];

// API endpoints to cache
const API_ROUTES_TO_CACHE = [
  "/api/users/me",
  "/api/products",
  "/api/transactions",
  "/api/dashboard/stats",
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all([
        // Cache routes
        cache.addAll(ROUTES_TO_CACHE),
        // Cache assets
        cache.addAll(ASSETS_TO_CACHE),
      ]);
    })
  );
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  // Handle navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches
          .match("/offline.html")
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // Handle API requests
  if (event.request.url.includes("/api/")) {
    const isApiRoute = API_ROUTES_TO_CACHE.some((route) =>
      event.request.url.includes(route)
    );

    if (isApiRoute) {
      event.respondWith(
        caches
          .match(event.request)
          .then((cachedResponse) => cachedResponse || fetch(event.request))
      );
      return;
    }
  }

  // Handle all other requests
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});

// Update service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle service worker updates
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Handle offline sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncTransactions());
  }
});

// Background sync function
async function syncTransactions() {
  try {
    const db = await openDB("pos-offline", 1);
    const tx = db.transaction("offline-transactions", "readwrite");
    const store = tx.objectStore("offline-transactions");

    const offlineTransactions = await store.getAll();

    for (const transaction of offlineTransactions) {
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
        });

        if (response.ok) {
          await store.delete(transaction.id);
        }
      } catch (error) {
        console.error("Failed to sync transaction:", error);
      }
    }
  } catch (error) {
    console.error("Failed to sync transactions:", error);
  }
}

// Handle push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  };

  event.waitUntil(
    self.registration.showNotification("F&M's POS System", options)
  );
});
