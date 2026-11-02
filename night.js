// 晚上的天空：那個城市入夜後，每日頁插畫換成同一個地方的夜景，天空有星星（night 分支試做）
// 素材都是 Codex 畫的：夜景（用白天的圖改畫，構圖對齊）、星空、流星；天空範圍是從夜景圖算出來的
//   TRIP.photos[art].night = { src 夜景, sky 天空範圍（透明度）, top 夜空頂端色, hz 每 1/64 寬的地平線高度 }
//   img/sky-stars-dim.jpg     一般的星星（黑底，用「濾色」疊，黑色會消失）
//   img/sky-stars-bright.jpg  拆出來的 60 顆亮星，每顆各自閃爍
//   img/sky-meteor.jpg        流星
// 程式只負責：夜景淡入、星星閃爍、傾斜手機整個畫面微微移動（星星比地面動得少）、點天空有流星、偶爾自己劃過一顆
(function () {
  // 亮星在星空圖上的位置（1360×620）
  var BRIGHT = [[621, 180], [28, 474], [36, 244], [1314, 377], [312, 494], [360, 178], [1257, 150], [606, 265], [1091, 246], [356, 131], [550, 68], [183, 608],
    [1117, 571], [1052, 468], [630, 70], [1239, 20], [788, 92], [132, 212], [1094, 406], [869, 327], [1051, 392], [443, 80], [375, 284], [787, 37], [707, 188],
    [1204, 346], [853, 163], [233, 418], [845, 232], [385, 19], [1048, 43], [1049, 187], [1311, 558], [151, 404], [141, 113], [147, 341], [24, 48], [612, 323],
    [1151, 606], [1206, 424], [1340, 173], [441, 507], [439, 142], [1094, 65], [388, 458], [200, 317], [1028, 345], [1238, 463], [1169, 268], [1062, 309],
    [53, 296], [488, 67], [901, 365], [1292, 321], [993, 314], [340, 58], [930, 204], [32, 359], [927, 417], [83, 520]];
  var ORIGIN = 40, DRIFT = 36; // 插畫左上角對到星空圖的 (40, 40)；星星最多移動 36（星空圖的 px），四邊都有留空間
  var STAR = .5; // 傾斜時整個畫面一起動；星星比山遠，移動得比地面少（越遠動越少，像坐車看窗外：路樹一下就過、遠山幾乎不動）
  var MET_HEAD = [41, 293], MET_LEN = 602; // 流星圖（581×335）裡頭的位置、頭到尾的長度；尾巴朝右上

  var assets = null, cur = null;
  function load(src) {
    return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; });
  }
  function getAssets() {
    return assets || (assets = Promise.all([load("img/sky-stars-dim.jpg"), load("img/sky-stars-bright.jpg"), load("img/sky-meteor.jpg")]));
  }
  function canvas(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function stop() {
    if (!cur) return;
    cur.dead = true;
    if (cur.off) cur.off();
    cur = null;
  }

  // art：.hero-art；n：TRIP.photos[art].night；opts：frame（缺角圖框路徑）、tiltHint、starHint
  function start(art, n, opts) {
    stop();
    var g = { dead: false };
    cur = g;
    // 大字慢慢變成夜空的顏色（大字伸進插畫的那截才融得進夜空）
    var hw = art.parentNode && art.parentNode.querySelector(".hw");
    if (hw) { hw.style.transition = "color 2s ease"; hw.style.color = n.top; }
    Promise.all([load(n.src), load(n.sky), getAssets()]).then(function (r) {
      if (g.dead || !art.isConnected) return;
      build(g, art, r[0], r[1], r[2], n, opts || {});
    }).catch(function () {});
  }

  function build(g, art, img, sky, A, n, opts) {
    var svg = art.querySelector("svg.art");
    if (!svg) return;
    var dimS = A[0], brightS = A[1], met = A[2];
    var dpr = Math.min(window.devicePixelRatio || 1, 2), cssW = svg.clientWidth, cssH = svg.clientHeight;
    if (!cssW || !cssH) return;
    var W = Math.round(cssW * dpr), H = Math.round(cssH * dpr), s = W / 360, k = W / 1280; // k：星空圖 1 px 畫成幾個螢幕 px（跟插畫同比例）

    var cv = canvas(W, H);
    cv.className = "night-sky";
    cv.setAttribute("aria-hidden", "true");
    art.insertBefore(cv, svg.nextSibling);
    art.classList.add("has-night");
    var ctx = cv.getContext("2d"), clip = new Path2D(opts.frame);

    // 傾斜手機時整張夜景一起移動（像鏡頭在動）：夜景和天空範圍先放大一點，移動時邊緣才不會露出空白。
    // 下雨時不動也不放大：霧是用原尺寸的夜景做的，擦開後要對得上
    var DR = 9 * dpr; // 夜景最多移動幾個螢幕 px（左右；上下是 0.6 倍）
    var sc = Math.max(1 + 2 * (DR + 1) / W, 1 + 1.2 * (DR + 1) / H), BW = Math.round(W * sc), BH = Math.round(H * sc);
    function pre(src, w, h) { var c = canvas(w, h), x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, w, h); return c; }
    var flat = pre(img, W, H), big = pre(img, BW, BH), mask = pre(sky, W, H), bigMask = pre(sky, BW, BH);
    // 上緣跟白天一樣漸層成夜空頂端色，大字才融得進去；這層固定不動，跟著大字
    var grc = canvas(W, Math.ceil(110 * s)), gx = grc.getContext("2d"), gr = gx.createLinearGradient(0, 0, 0, 110 * s);
    gr.addColorStop(0, n.top); gr.addColorStop(.35, rgba(n.top, .55)); gr.addColorStop(1, rgba(n.top, 0));
    gx.fillStyle = gr; gx.fillRect(0, 0, W, 110 * s);
    var layer = canvas(W, H), lx = layer.getContext("2d");
    var skyH = Math.min(H, Math.ceil(H * .58)); // 星星只會在上面這段（地平線最低在 50% 左右；再多會超出星空圖範圍）

    // 每顆亮星有自己的閃爍節奏
    var stars = BRIGHT.map(function (p) { return { x: p[0], y: p[1], f: rnd(.25, .9), f2: rnd(1.1, 2.3), ph: rnd(0, 6.28) }; });

    // ---------- 流星 ----------
    var mets = [];
    function meteor(x, y) { // (x, y)：流星頭大約經過的位置（螢幕 px）
      var flip = Math.random() < .5, dx = flip ? 530 : -530, dy = 285, d = Math.sqrt(dx * dx + dy * dy);
      var len = rnd(.2, .3) * W, ux = dx / d, uy = dy / d;
      mets.push({ sx: x - ux * len * .6, sy: y - uy * len * .6, ux: ux, uy: uy, len: len, dur: rnd(.55, .85), t: 0, flip: flip });
    }
    function drawMeteor(m) {
      var p = m.t / m.dur, a = Math.min(1, p / .12) * (p > .55 ? Math.max(0, 1 - (p - .55) / .45) : 1);
      var kk = m.len / MET_LEN, ang = Math.atan2(m.uy, m.ux), big = W * 3;
      lx.save();
      lx.globalAlpha = a;
      lx.translate(m.sx, m.sy); lx.rotate(ang);
      lx.beginPath(); lx.rect(0, -big, big, big * 2); lx.clip(); // 尾巴不會畫到起點後面：看起來是從那裡劃出來的
      lx.translate(m.len * 1.25 * p, 0); lx.rotate(-ang);
      if (m.flip) lx.scale(-1, 1);
      lx.drawImage(met, -MET_HEAD[0] * kk, -MET_HEAD[1] * kk, met.width * kk, met.height * kk);
      lx.restore();
    }

    // ---------- 畫 ----------
    var fade = 0, px = 0, py = 0, tx = 0, ty = 0;
    function draw(t) {
      var still = art.classList.contains("has-glass"), mx = still ? 0 : px, my = still ? 0 : py;
      // 星空圖上，對到插畫左上角的位置（星星動得比地面少）
      var ox = ORIGIN - clamp(STAR * mx / k, -DRIFT, DRIFT), oy = ORIGIN - clamp(STAR * my / k, -DRIFT, DRIFT);
      var bx0 = (W - BW) / 2 + mx, by0 = (H - BH) / 2 + my;
      lx.globalCompositeOperation = "copy"; lx.globalAlpha = 1;
      lx.drawImage(dimS, ox, oy, W / k, skyH / k, 0, 0, W, skyH);
      lx.globalCompositeOperation = "lighter";
      var r = 7, rr = r * k;
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i], cx = (st.x - ox) * k, cy = (st.y - oy) * k;
        if (cx < -rr || cy < -rr || cx > W + rr || cy > skyH + rr) continue;
        // 兩個不同快慢的起伏疊在一起，亮暗不會太規律
        var v = .55 + .3 * Math.sin(t * st.f * 6.283 + st.ph) + .15 * Math.sin(t * st.f2 * 6.283 + st.ph * 1.7);
        lx.globalAlpha = clamp(v, .18, 1);
        lx.drawImage(brightS, st.x - r, st.y - r, r * 2, r * 2, cx - rr, cy - rr, rr * 2, rr * 2);
      }
      lx.globalAlpha = 1;
      for (i = 0; i < mets.length; i++) drawMeteor(mets[i]);
      lx.globalCompositeOperation = "destination-in"; lx.globalAlpha = 1;
      if (still) lx.drawImage(mask, 0, 0); else lx.drawImage(bigMask, bx0, by0); // 天空範圍跟著地面一起動

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clip(clip); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = fade;
      if (still) ctx.drawImage(flat, 0, 0); else ctx.drawImage(big, bx0, by0);
      ctx.drawImage(grc, 0, 0);
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }

    // ---------- 傾斜手機：整個畫面微微移動 ----------
    var g0 = null, b0 = null, tilting = false;
    function onOri(e) {
      if (e.gamma == null || e.beta == null) return;
      if (g0 == null) { g0 = e.gamma; b0 = e.beta; }
      g0 += (e.gamma - g0) * .004; b0 += (e.beta - b0) * .004; // 換了拿手機的姿勢，慢慢把那個姿勢當成正中間
      tx = -clamp((e.gamma - g0) / 18, -1, 1) * DR;
      ty = -clamp((e.beta - b0) / 18, -1, 1) * DR * .6;
      tilting = true;
    }
    function listenTilt() { window.addEventListener("deviceorientation", onOri); }
    // 電腦不用滑鼠帶動星星：只有天空在動、地面不動，像鏡頭在移動卻只動了一半，很怪（2026/11/02 使用者建議拿掉）

    // iPhone 要先點一下允許，才拿得到手機的方向；允許過就記住（trip-tilt）
    // 只有觸控螢幕（手機、平板）才問；新版電腦 Chrome 也有這個詢問功能，但電腦沒有方向感測器，用滑鼠就好
    var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    var chip = null, needAsk = touch && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function";
    var asked = false;
    try { asked = localStorage.getItem("trip-tilt") === "1"; } catch (e) {}
    function ask() {
      return DeviceOrientationEvent.requestPermission().then(function (st) {
        if (st === "granted") { listenTilt(); try { localStorage.setItem("trip-tilt", "1"); } catch (e) {} }
        return st;
      });
    }
    function showChip(text, button, ms) {
      if (chip) chip.remove();
      if (art.classList.contains("has-glass")) return document.createElement("span"); // 下雨的玻璃已經在了：不出提示
      chip = document.createElement(button ? "button" : "span");
      if (button) chip.type = "button";
      chip.className = "night-chip" + (button ? " is-btn" : "");
      chip.textContent = text;
      art.appendChild(chip);
      setTimeout(function () { if (chip) chip.classList.add("is-in"); }, 1600);
      if (ms) setTimeout(function () { if (chip) chip.classList.add("is-gone"); }, ms);
      return chip;
    }
    // 「傾斜手機看星星」按鈕：點了才問
    function askChip() {
      if (!opts.tiltHint) return;
      showChip(opts.tiltHint + " ✦", true, 0).addEventListener("click", function () {
        var c = chip;
        ask().then(function (st) {
          if (c) c.classList.add("is-gone");
          if (st === "granted") meteor(W * rnd(.35, .7), skyH * rnd(.15, .35)); // 允許之後先送一顆流星
        }).catch(function () { if (c) c.classList.add("is-gone"); });
      });
    }
    // 允許過：先開始聽（有時候不用再問就收得到），再在第一次「點一下」時悄悄要一次；被拒絕就把按鈕叫出來。
    // 要用 touchend／click：iPhone 只把完整的點擊當作同意，手指剛碰到（pointerdown）不算
    // （2026/11/02 踩過：原本用 pointerdown，重開網頁後傾斜完全不動）
    var onFirst = null, FIRST = ["touchend", "click"];
    function offFirst() { FIRST.forEach(function (ev) { document.removeEventListener(ev, onFirst, true); }); onFirst = null; }
    if (needAsk && asked) {
      listenTilt();
      onFirst = function () {
        offFirst();
        ask().then(function (st) { if (st !== "granted") askChip(); }).catch(function () { askChip(); });
      };
      FIRST.forEach(function (ev) { document.addEventListener(ev, onFirst, true); });
      if (opts.starHint) showChip(opts.starHint, false, 7000);
    } else if (needAsk) {
      askChip();
    } else {
      listenTilt();
      if (opts.starHint) showChip(opts.starHint, false, 7000);
    }

    // 點天空：從那裡劃過一顆流星（地平線以下、山上不會）
    cv.addEventListener("click", function (e) {
      var r = cv.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      var hz = n.hz && n.hz[clamp(Math.floor(fx * n.hz.length), 0, n.hz.length - 1)];
      if (hz && fy < hz - .03) meteor(fx * W, fy * H);
    });

    // ---------- 動起來 ----------
    var seen = true, io = null;
    if (window.IntersectionObserver) { io = new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }); io.observe(cv); }
    var prev = 0, last = 0, nextMet = rnd(5, 10), raf = 0;
    function step(now) {
      raf = 0;
      if (g.dead || !cv.isConnected) { cleanup(); return; }
      raf = requestAnimationFrame(step);
      var dt = prev ? Math.min(.05, (now - prev) / 1000) : 0;
      prev = now;
      if (document.hidden || !seen) return;
      if (fade < 1) fade = Math.min(1, fade + dt / 2); // 跟大字一起，2 秒慢慢入夜
      px += (tx - px) * Math.min(1, dt * 4); py += (ty - py) * Math.min(1, dt * 4);
      nextMet -= dt;
      if (nextMet <= 0) { meteor(W * rnd(.2, .85), skyH * rnd(.08, .4)); nextMet = rnd(20, 45); }
      for (var i = mets.length - 1; i >= 0; i--) { mets[i].t += dt; if (mets[i].t > mets[i].dur) mets.splice(i, 1); }
      // 星星閃爍不用每格都畫：沒有流星、沒在移動時，一秒畫 30 次就夠（省電）
      var moving = mets.length || fade < 1 || Math.abs(tx - px) > .05 || Math.abs(ty - py) > .05;
      if (!moving && now - last < 33) return;
      last = now;
      draw(now / 1000);
    }
    raf = requestAnimationFrame(step);

    var onResize = function () { clearTimeout(g.rt); g.rt = setTimeout(function () { if (!g.dead && svg.clientWidth !== cssW) start(art, n, opts); }, 250); };
    window.addEventListener("resize", onResize);
    function cleanup() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("deviceorientation", onOri);
      if (onFirst) offFirst();
      if (cv.parentNode) cv.remove();
      if (chip && chip.parentNode) chip.remove();
      art.classList.remove("has-night");
    }
    g.off = cleanup;
    window.__night = function () { return { w: W, h: H, fade: fade, px: px, py: py, meteors: mets.length, nextMeteor: nextMet }; };
    window.__nightMeteor = function () { meteor(W * .6, skyH * .25); }; // 測試用
    window.__nightTilt = function (gamma, beta) { onOri({ gamma: gamma, beta: beta }); }; // 測試用：假裝手機傾斜
  }

  window.NIGHT = { start: start, stop: stop };
})();
