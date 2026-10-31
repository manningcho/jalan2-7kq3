// 下雨天的玻璃：每日頁插畫上起一層霧、玻璃上有雨滴，手指可以擦開（rain 分支試做）
// 素材都是 Codex 畫的，畫在純灰底（128）上，用「疊加」只留下亮光和陰影，灰色本身會消失：
//   img/glass-fog.jpg         細細的霧珠（可以重複鋪）
//   img/glass-drops.jpg       24 顆雨滴的亮暗
//   img/glass-drops-mask.png  同一張的雨滴形狀（透明度）
// 程式只負責：把插畫模糊調白當成霧、雨滴裡放上下顛倒的插畫當倒影、手指擦開、慢慢回霧、偶爾一顆滑下來
(function () {
  // glass-drops 圖裡每顆雨滴的位置 [x, y, 寬, 高]（768×512），由小到大
  var BOX = [[328, 190, 31, 32], [713, 200, 33, 34], [705, 36, 34, 35], [180, 41, 38, 40], [431, 65, 39, 42], [172, 170, 40, 46],
    [568, 362, 44, 44], [357, 292, 37, 55], [261, 382, 46, 49], [227, 113, 51, 53], [487, 258, 55, 58], [529, 61, 46, 70],
    [239, 256, 60, 59], [24, 349, 63, 60], [507, 173, 76, 54], [403, 150, 55, 76], [606, 226, 51, 82], [681, 337, 56, 78],
    [625, 74, 64, 74], [70, 59, 54, 88], [294, 41, 70, 72], [139, 341, 60, 92], [418, 360, 80, 84], [36, 201, 100, 88]];
  var TEAR = BOX.filter(function (b) { return b[3] > b[2] * 1.3; }); // 長的水滴形，拿來滑

  var assets = null, cur = null;
  function load(src) {
    return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; });
  }
  function getAssets() {
    return assets || (assets = Promise.all([load("img/glass-fog.jpg"), load("img/glass-drops.jpg"), load("img/glass-drops-mask.png")]));
  }
  function canvas(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function stop() {
    if (!cur) return;
    cur.dead = true;
    if (cur.off) cur.off();
    cur = null;
  }

  // art：.hero-art；src：插畫；top：插畫上緣的天空色；frame：缺角圖框的路徑（360×260）
  function start(art, src, top, frame, opts) {
    stop();
    var g = { dead: false };
    cur = g;
    Promise.all([getAssets(), load(src)]).then(function (r) {
      if (g.dead || !art.isConnected) return;
      build(g, art, r[1], r[0], top, frame, opts || {});
    }).catch(function () {});
  }

  function build(g, art, illu, A, top, frame, opts) {
    var svg = art.querySelector("svg.art");
    if (!svg) return;
    var fogTex = A[0], shade = A[1], dmask = A[2];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = svg.clientWidth, cssH = svg.clientHeight;
    if (!cssW || !cssH) return;
    var W = Math.round(cssW * dpr), H = Math.round(cssH * dpr), s = W / 360;

    var cv = canvas(W, H);
    cv.className = "glass";
    cv.setAttribute("aria-hidden", "true");
    art.insertBefore(cv, svg.nextSibling);
    art.classList.add("has-glass");
    var ctx = cv.getContext("2d"), clip = new Path2D(frame);

    // 清楚的插畫（含上緣漸層，跟畫面上的一樣）：拿來做霧和雨滴裡的倒影
    var base = canvas(W, H), bx = base.getContext("2d");
    bx.drawImage(illu, 0, 0, W, H);
    var gr = bx.createLinearGradient(0, 0, 0, 110 * s);
    gr.addColorStop(0, top); gr.addColorStop(.35, rgba(top, .55)); gr.addColorStop(1, rgba(top, 0));
    bx.fillStyle = gr; bx.fillRect(0, 0, W, 110 * s);

    // 霧：插畫縮很小再放大（＝模糊），蓋一層淡淡的白，再疊上霧珠的質感
    var fog = canvas(W, H), fx = fog.getContext("2d");
    var sm = canvas(W / 11, H / 11), md = canvas(W / 3, H / 3);
    sm.getContext("2d").drawImage(base, 0, 0, sm.width, sm.height);
    var mdx = md.getContext("2d"); mdx.imageSmoothingQuality = "high"; mdx.drawImage(sm, 0, 0, md.width, md.height);
    fx.imageSmoothingQuality = "high"; fx.drawImage(md, 0, 0, W, H);
    fx.fillStyle = "rgba(226,232,244,.16)"; fx.fillRect(0, 0, W, H);
    var T = Math.round(240 * dpr), tile = canvas(T, T);
    tile.getContext("2d").drawImage(fogTex, 0, 0, T, T);
    fx.globalCompositeOperation = "overlay"; fx.globalAlpha = .45; fx.fillStyle = fx.createPattern(tile, "repeat"); fx.fillRect(0, 0, W, H);
    fx.globalCompositeOperation = "source-over"; fx.globalAlpha = 1;

    // 哪裡有霧：黑＝有霧，擦掉的地方變透明，之後慢慢補回來
    var mk = canvas(W, H), mx = mk.getContext("2d");
    mx.fillStyle = "#000"; mx.fillRect(0, 0, W, H);
    var layer = canvas(W, H), lx = layer.getContext("2d");

    // 手指的筆刷：中間全擦、邊緣柔
    var BR = Math.round(20 * dpr), brush = canvas(BR * 2, BR * 2), brx = brush.getContext("2d");
    var bg = brx.createRadialGradient(BR, BR, 0, BR, BR, BR);
    bg.addColorStop(0, "rgba(0,0,0,1)"); bg.addColorStop(.55, "rgba(0,0,0,.9)"); bg.addColorStop(1, "rgba(0,0,0,0)");
    brx.fillStyle = bg; brx.fillRect(0, 0, BR * 2, BR * 2);

    // ---------- 雨滴 ----------
    var drops = [];
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function makeDrop(x, y, cssSize, box) {
      var b = box || pick(BOX), w = cssSize * dpr, k = w / b[2];
      var d = { b: b, x: x, y: y, w: w, h: b[3] * k, pop: 0, c: null };
      refract(d);
      return d;
    }
    // 雨滴裡的倒影：周圍大約 4 倍範圍的景色，上下左右顛倒縮進水滴裡，再疊上水滴的亮暗
    function refract(d) {
      var c = d.c || (d.c = canvas(1, 1)), w = Math.max(2, Math.round(d.w)), h = Math.max(2, Math.round(d.h));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      var x = c.getContext("2d"), R = 4, sw = d.w * R, sh = d.h * R, sx = d.x - sw / 2, sy = d.y - sh * .6;
      // 來源超出插畫範圍的部分裁掉（舊 Safari 遇到超出範圍會整個不畫）
      var x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(W, sx + sw), y1 = Math.min(H, sy + sh);
      x.globalCompositeOperation = "copy";
      x.fillStyle = "#8fa3c8"; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "source-over";
      if (x1 > x0 && y1 > y0) {
        x.save(); x.translate(w, h); x.scale(-1, -1);
        x.drawImage(base, x0, y0, x1 - x0, y1 - y0, (x0 - sx) / sw * w, (y0 - sy) / sh * h, (x1 - x0) / sw * w, (y1 - y0) / sh * h);
        x.restore();
      }
      x.fillStyle = "rgba(255,255,255,.1)"; x.fillRect(0, 0, w, h);
      var b = d.b;
      x.globalCompositeOperation = "destination-in"; x.drawImage(dmask, b[0], b[1], b[2], b[3], 0, 0, w, h);
      x.globalCompositeOperation = "overlay"; x.drawImage(shade, b[0], b[1], b[2], b[3], 0, 0, w, h);
      x.globalCompositeOperation = "destination-in"; x.drawImage(dmask, b[0], b[1], b[2], b[3], 0, 0, w, h);
      x.globalCompositeOperation = "source-over";
    }
    function size() { return 4 + 15 * Math.pow(Math.random(), 2.2); } // 小顆的多、大顆的少（CSS px）
    var N = Math.round(cssW * cssH / 4000);
    for (var i = 0; i < N; i++) { var dd = makeDrop(rnd(0, W), rnd(0, H), size()); dd.pop = 1; drops.push(dd); }

    // ---------- 畫 ----------
    var fade = 0;
    function draw() {
      lx.globalCompositeOperation = "copy"; lx.drawImage(fog, 0, 0);
      lx.globalCompositeOperation = "destination-in"; lx.drawImage(mk, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clip(clip); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = fade * .86; // 霧不要全蓋死，底下的插畫隱約透得出來
      ctx.drawImage(layer, 0, 0);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i], p = d.pop < 1 ? d.pop : 1;
        ctx.globalAlpha = fade * Math.min(1, p * 1.5);
        var w = d.w * (.6 + .4 * p), h = d.h * (.6 + .4 * p);
        ctx.drawImage(d.c, d.x - w / 2, d.y - h / 2, w, h);
      }
      ctx.restore();
    }

    // ---------- 手指擦 ----------
    var last = null, wiped = false, hint = null;
    function stamp(x, y) {
      mx.globalCompositeOperation = "destination-out";
      mx.drawImage(brush, x - BR, y - BR);
      mx.globalCompositeOperation = "source-over";
      // 擦過的地方，雨滴也一起抹掉
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i], dx = d.x - x, dy = d.y - y;
        if (dx * dx + dy * dy < BR * BR * .7) drops.splice(i, 1);
      }
    }
    function at(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    function down(e) { last = at(e); stamp(last[0], last[1]); dirty = true; }
    function move(e) {
      if (!last) return;
      var p = at(e), dx = p[0] - last[0], dy = p[1] - last[1], dist = Math.sqrt(dx * dx + dy * dy), step = BR / 3;
      for (var t = step; t <= dist; t += step) stamp(last[0] + dx * t / dist, last[1] + dy * t / dist);
      if (dist >= step) last = p;
      if (!wiped) { wiped = true; if (hint) hint.classList.add("is-gone"); }
      dirty = true;
    }
    function up() { last = null; }
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up); // 手指改成上下捲動頁面時，瀏覽器會取消
    cv.addEventListener("pointerleave", up);

    if (opts.hint) {
      hint = document.createElement("span");
      hint.className = "glass-hint";
      hint.textContent = opts.hint;
      art.appendChild(hint);
      setTimeout(function () { if (hint) hint.classList.add("is-in"); }, 1400); // 霧起來之後才出現
      setTimeout(function () { if (hint) hint.classList.add("is-gone"); }, 7000);
    }

    // ---------- 動起來 ----------
    var seen = true, io = null;
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (es) { seen = es[0].isIntersecting; });
      io.observe(cv);
    }
    var prev = 0, nextSlide = 1.5, nextSpawn = .6, dirty = true, raf = 0;
    function slideOne() {
      // 挑一顆比較大的開始往下滑；沒有的話在上半部生一顆新的水滴形
      var big = drops.filter(function (d) { return !d.v && d.w > 9 * dpr && d.y < H * .7; });
      var d = big.length ? pick(big) : null;
      if (!d) { d = makeDrop(rnd(W * .05, W * .95), rnd(H * .05, H * .4), rnd(11, 17), pick(TEAR)); d.pop = 1; drops.push(d); }
      d.b = pick(TEAR); d.h = d.b[3] * d.w / d.b[2];
      d.v = 0; d.go = 0; d.jx = 0;
    }
    function step(now) {
      raf = 0;
      if (g.dead || !cv.isConnected) { cleanup(); return; }
      raf = requestAnimationFrame(step);
      var dt = prev ? Math.min(.05, (now - prev) / 1000) : 0;
      prev = now;
      if (document.hidden || !seen) return;
      if (fade < 1) { fade = Math.min(1, fade + dt / 1.6); dirty = true; } // 霧慢慢起來
      // 擦開的地方慢慢回霧（大約 10 秒回到七成）
      mx.fillStyle = "rgba(0,0,0," + (dt * .11).toFixed(4) + ")"; mx.fillRect(0, 0, W, H);
      if (opts.motion) {
        nextSlide -= dt; nextSpawn -= dt;
        if (nextSlide <= 0) { slideOne(); nextSlide = rnd(3.5, 8); }
        if (nextSpawn <= 0 && drops.length < N * 1.4) { // 新的雨打到玻璃上
          drops.push(makeDrop(rnd(0, W), rnd(0, H), size()));
          nextSpawn = rnd(.5, 1.6);
        }
      }
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        if (d.pop < 1) d.pop = Math.min(1, d.pop + dt / .18);
        if (d.v == null) continue;
        // 水滴走走停停：一下快一下慢，左右微微晃
        d.go -= dt;
        if (d.go <= 0) { d.target = Math.random() < .25 ? 0 : rnd(40, 150) * dpr; d.go = rnd(.15, .7); }
        d.v += (d.target - d.v) * Math.min(1, dt * 6);
        if (d.ly == null) { d.lx = d.x; d.ly = d.y; }
        d.y += d.v * dt;
        d.jx += (Math.random() - .5) * dt * 30 * dpr; d.jx *= .9; d.x += d.jx * dt * 8;
        if (d.y - d.ly > 1) {
          // 滑過的地方把霧帶走，留下一條清楚的水痕
          mx.globalCompositeOperation = "destination-out";
          mx.strokeStyle = "rgba(0,0,0,.95)"; mx.lineWidth = d.w * .5; mx.lineCap = "round";
          mx.beginPath(); mx.moveTo(d.lx, d.ly - d.h * .2); mx.lineTo(d.x, d.y - d.h * .2); mx.stroke();
          mx.globalCompositeOperation = "source-over";
          d.lx = d.x; d.ly = d.y;
          // 碰到別的水滴就吃掉，變大一點
          for (var j = drops.length - 1; j >= 0; j--) {
            var o = drops[j];
            if (o === d || o.v != null) continue;
            var ex = o.x - d.x, ey = o.y - d.y;
            if (ex * ex + ey * ey < (d.w * .6) * (d.w * .6)) { drops.splice(j, 1); if (j < i) i--; d.w = Math.min(d.w * 1.06, 22 * dpr); d.h = d.b[3] * d.w / d.b[2]; }
          }
          refract(d);
        }
        if (d.y - d.h > H) drops.splice(i, 1);
      }
      draw();
    }
    raf = requestAnimationFrame(step);

    var onResize = function () { clearTimeout(g.rt); g.rt = setTimeout(function () { if (!g.dead && svg.clientWidth !== cssW) start(art, illu.src, top, frame, opts); }, 250); };
    window.addEventListener("resize", onResize);
    function cleanup() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      if (cv.parentNode) cv.remove();
      if (hint && hint.parentNode) hint.remove();
      art.classList.remove("has-glass");
    }
    g.off = cleanup;
    window.__glass = function () { return { w: W, h: H, drops: drops.length, fade: fade, sliding: drops.filter(function (d) { return d.v != null; }).length }; };
  }

  window.GLASS = { start: start, stop: stop };
})();
