const CACHE_NAME = "vetcare-world-v14-0";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css?v=14.0",
  "./app.js?v=14.0",
  "./manifest.json",
  "./hero-farm.svg",
  "./hero-vetcare.jpg",
  "./hero-scene-clean.jpg",
  "./hero-mobile-art.jpg",
  "./hero-desktop-art.jpg",
  "./cat-disease.jpg",
  "./cat-vaccine.jpg",
  "./cat-feed.jpg",
  "./cat-breeds.jpg",
  "./cat-farm.jpg",
  "./cat-calf.jpg",
  "./community-photo.jpg",
  "./market-photo.jpg",
  "./footer-landscape.jpg",
  "./brand-cow-logo.jpg",
  "./knowledge.html",
  "./disease-treatment.html",
  "./about-us.html",
  "./contact.html",
  "./privacy-policy.html",
  "./sitemap.xml",
  "./robots.txt"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit => hit || caches.match("./index.html"))
    )
  );
});
