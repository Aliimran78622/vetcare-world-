'use strict';

const CACHE_NAME = 'vetcare-world-v21-1';
const APP_FILES = [
  './',
  './index.html',
  './style.css?v=21.0',
  './app.js?v=21.0',
  './manifest.json',
  './hero-farm.svg',
  './hero-vetcare.jpg',
  './hero-scene-clean.jpg',
  './hero-mobile-art.jpg',
  './hero-desktop-art.jpg',
  './cat-disease.jpg',
  './cat-vaccine.jpg',
  './cat-feed.jpg',
  './cat-breeds.jpg',
  './cat-farm.jpg',
  './cat-calf.jpg',
  './community-photo.jpg',
  './market-photo.jpg',
  './footer-landscape.jpg',
  './brand-cow-logo.jpg',
  './knowledge.html',
  './disease-treatment.html',
  './about-us.html',
  './contact.html',
  './privacy-policy.html',
  './sitemap.xml',
  './robots.txt',
  './googleb113d3ee55b74ec0.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() =>
      caches.match(request).then(cached => cached || caches.match('./index.html'))
    )
  );
});
