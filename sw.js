// 離線用：把整個網站存一份在手機裡，到印尼網路不穩或沒網路也打得開。
// - 網頁、程式、資料（html / js / css）：先抓網路上的新版，3 秒抓不到就用存的；抓到新版順便更新存的那份。
// - 插畫：先用存的（馬上顯示），同時在背景檢查新版，下次就是新的。
// - Google 字型：看過的字存起來，下次直接用。
// - 其他網站（地圖、導航）不經過這裡，照常需要網路。
// 下面兩段由 make-sw.sh 自動產生：新增或換掉 img/ 的圖之後跑一次 ./make-sw.sh（make-lq.sh 會順便跑）。

// <make-sw>
var VERSION = "d211fa6a7f";
var ASSETS = [
  "./",
  "index.html",
  "style.css",
  "data.js",
  "lq.js",
  "art.js",
  "app.js",
  "img/band-bali.jpg",
  "img/band-food-bali.jpg",
  "img/band-food-jkt.jpg",
  "img/band-food-pwt.jpg",
  "img/band-food-yk.jpg",
  "img/band-jkt.jpg",
  "img/band-pwt.jpg",
  "img/band-tw.jpg",
  "img/band-yk.jpg",
  "img/city.jpg",
  "img/cliff.jpg",
  "img/gate.jpg",
  "img/home.jpg",
  "img/lake.jpg",
  "img/m-days.jpg",
  "img/m-food.jpg",
  "img/m-info.jpg",
  "img/m-learn.jpg",
  "img/m-money.jpg",
  "img/m-pack.jpg",
  "img/m-stay.jpg",
  "img/p-info.jpg",
  "img/p-learn.jpg",
  "img/p-money.jpg",
  "img/p-pack.jpg",
  "img/plane.jpg",
  "img/sea.jpg",
  "img/slamet.jpg",
  "img/stupa.jpg",
  "img/tamansari.jpg",
  "img/terrace.jpg",
  "img/volcano.jpg",
  "img/wedding.jpg",
  "img/icon-180.png",
  "img/icon-64.png"
];
// </make-sw>

var SITE = "trip-site-" + VERSION, FONTS = "trip-fonts";

self.addEventListener("install", function (e) {
  // 一個一個存：網路不穩時有幾個失敗也沒關係，之後看到再補存
  e.waitUntil(caches.open(SITE).then(function (c) {
    return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("trip-site-") === 0 && k !== SITE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate" || /\.(html|js|css)$/.test(url.pathname) || /\/$/.test(url.pathname)) e.respondWith(networkFirst(e));
    else e.respondWith(cachedThenRefresh(e));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(cacheFirst(req, FONTS));
  }
});

// 先抓網路，3 秒沒回應或沒網路就用存的
function networkFirst(e) {
  var req = e.request;
  return caches.open(SITE).then(function (cache) {
    var net = fetch(req).then(function (res) {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    e.waitUntil(net.catch(function () {}));
    var late = new Promise(function (r) { setTimeout(function () { r(null); }, 3000); });
    return Promise.race([net, late]).catch(function () { return null; }).then(function (res) {
      if (res) return res;
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return cache.match("./").then(function (home) { return home || net; });
        return net; // 沒存過：只好繼續等網路
      });
    });
  });
}

// 先給存的，背景更新
function cachedThenRefresh(e) {
  var req = e.request;
  return caches.open(SITE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
      e.waitUntil(net.catch(function () {}));
      return hit || net;
    });
  });
}

function cacheFirst(req, name) {
  return caches.open(name).then(function (cache) {
    return cache.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
    });
  });
}
