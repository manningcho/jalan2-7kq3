// 離線用：把整個網站存一份在手機裡，到印尼網路不穩或沒網路也打得開。
// - 網頁、程式、資料（html / js / css）：先抓網路上的新版，3 秒抓不到就用存的；抓到新版順便更新存的那份。
// - 插畫：先用存的（馬上顯示），同時在背景檢查新版，下次就是新的。
// - Google 字型：安裝時讀網站的文字，算出用到哪些字，把需要的字型片段全部先存好（warmFonts）。
// - 其他網站（地圖、導航）不經過這裡，照常需要網路。
// 下面兩段由 make-sw.sh 自動產生：新增或換掉 img/ 的圖之後跑一次 ./make-sw.sh（make-lq.sh 會順便跑）。

// <make-sw>
var VERSION = "f960868f31";
var FONT_CSS = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700;900&display=swap";
var ASSETS = [
  "./",
  "index.html",
  "style.css",
  "data.js",
  "lq.js",
  "art.js",
  "sound.js",
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
  "img/cover-1.jpg",
  "img/cover-2.jpg",
  "img/cover-3.jpg",
  "img/cover-4.jpg",
  "img/cover-5.jpg",
  "img/cover-6.jpg",
  "img/egg.jpg",
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
  "img/m-transport.jpg",
  "img/p-info.jpg",
  "img/p-learn.jpg",
  "img/p-money.jpg",
  "img/p-pack.jpg",
  "img/p-transport.jpg",
  "img/plane.jpg",
  "img/sea.jpg",
  "img/slamet.jpg",
  "img/stupa.jpg",
  "img/tamansari.jpg",
  "img/terrace.jpg",
  "img/volcano.jpg",
  "img/wedding.jpg",
  "img/icon-180.png",
  "img/icon-64.png",
  "img/melati-1.png",
  "img/melati-2.png",
  "img/melati-3.png",
  "img/melati-4.png",
  "img/melati-5.png",
  "img/melati-6.png",
  "snd/birds.m4a",
  "snd/city.m4a",
  "snd/night.m4a",
  "snd/rain.m4a",
  "snd/waves.m4a"
];
// </make-sw>

var SITE = "trip-site-" + VERSION, FONTS = "trip-fonts";

self.addEventListener("install", function (e) {
  // 一個一個存：網路不穩時有幾個失敗也沒關係，之後看到再補存
  e.waitUntil(Promise.all([
    caches.open(SITE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(warmFonts)
  ]).then(function () { return self.skipWaiting(); }));
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

// 字型：Google 把中文字型切成很多小片（每片管一段字）。讀網站文字（data.js、app.js、index.html），
// 對照字型設定檔裡每一片負責的字，把用得到的片全部下載存好；沒網路時才不會變成系統字。
function warmFonts() {
  var cssReq = new Request(FONT_CSS, { mode: "cors", credentials: "omit" });
  return Promise.all([caches.open(FONTS), caches.open(SITE)]).then(function (cs) {
    var fonts = cs[0], site = cs[1];
    return fonts.match(cssReq, { ignoreVary: true }).then(function (hit) {
      return hit || fetch(cssReq).then(function (res) { if (res.ok) fonts.put(cssReq, res.clone()); return res; });
    }).then(function (res) { return res.text(); }).then(function (css) {
      return Promise.all(["data.js", "app.js", "index.html"].map(function (u) {
        return site.match(u).then(function (r) { return r ? r.text() : ""; });
      })).then(function (texts) {
        var codes = {}, all = texts.join("");
        for (var i = 0; i < all.length; i++) codes[all.codePointAt(i)] = 1;
        var list = Object.keys(codes).map(Number), urls = {};
        css.replace(/@font-face\s*{([^}]*)}/g, function (m, body) {
          var src = /url\(([^)]+)\)/.exec(body), ur = /unicode-range:\s*([^;]+)/.exec(body);
          if (src && (!ur || covers(ur[1], list))) urls[src[1].replace(/["']/g, "")] = 1;
        });
        return Promise.all(Object.keys(urls).map(function (u) {
          var r = new Request(u, { mode: "cors", credentials: "omit" });
          return fonts.match(r, { ignoreVary: true }).then(function (hit) {
            return hit || fetch(r).then(function (res) { if (res.ok) return fonts.put(r, res); });
          }).catch(function () {});
        }));
      });
    });
  }).catch(function () {});
}
function covers(ranges, list) {
  var spans = ranges.split(",").map(function (p) {
    p = p.trim().replace(/^U\+/i, "");
    if (p.indexOf("?") >= 0) return [parseInt(p.replace(/\?/g, "0"), 16), parseInt(p.replace(/\?/g, "F"), 16)];
    var ab = p.split("-");
    return [parseInt(ab[0], 16), parseInt(ab[1] || ab[0], 16)];
  });
  return list.some(function (c) { return spans.some(function (sp) { return c >= sp[0] && c <= sp[1]; }); });
}

function cacheFirst(req, name) {
  return caches.open(name).then(function (cache) {
    // ignoreVary：Google 回應會依請求來源變化，網頁和這裡發的請求不完全一樣，但內容一樣可以用
    return cache.match(req, { ignoreVary: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      });
    });
  });
}
