/* Tavern Tome Service Worker for PWA & Offline Support */
const CACHE_NAME = "tt-pwa-v20261111d";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./cards.html",
  "./play.html",
  "./share.html",
  "./manifest.json",
  "./favicon.svg",
  "./favicon.png",
  "./styles.css",
  "./play.css",
  "./data.js",
  "./pool.js",
  "./stats.js",
  "./stats-mmr.js",
  "./stats-change.js",
  "./comp-notes.js",
  "./extra-cards.js",
  "./cards.js",
  "./card-modal.js",
  "./app.js",
  "./sim.js",
  "./finder.js",
  "./search.js",
  "./demos.js",
  "./hero.js",
  "./card-fx.js",
  "./counter.js",
  "./bg.js",
  "./rail.js",
  "./light.js",
  "./history.js",
  "./fun.js",
  "./pool-page.js",
  "./play.js",
  "./share.js",
  "./bg-tavern.jpg"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_ASSETS);
    }).then(function(){
      return self.skipWaiting();
    }).catch(function(err){
      console.warn("Precache failed:", err);
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(k){
          if(k !== CACHE_NAME){
            return caches.delete(k);
          }
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);

  // Network-First for core code, data & navigation so updates are never trapped in cache
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.status === 200){
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(req, clone);
        });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        if(cached) return cached;
        if(req.mode === "navigate"){
          return caches.match("./index.html");
        }
      });
    })
  );
});
