var CACHE="a2-reja-v1";
var CORE=["/","/index.html","/styles.css","/app.js","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/apple-touch-icon.png"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET") return;
  var url=new URL(req.url);
  // pages: network first so updates show, cache when offline
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(function(res){
      var copy=res.clone();caches.open(CACHE).then(function(c){c.put("/index.html",copy);});return res;
    }).catch(function(){return caches.match("/index.html");}));
    return;
  }
  // same-origin assets and Google Fonts: cache first, refresh in background
  if(url.origin===location.origin||url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.match(req).then(function(hit){
      var net=fetch(req).then(function(res){
        if(res&&(res.ok||res.type==="opaque")){var copy=res.clone();caches.open(CACHE).then(function(c){c.put(req,copy);});}
        return res;
      }).catch(function(){return hit;});
      return hit||net;
    }));
  }
});
