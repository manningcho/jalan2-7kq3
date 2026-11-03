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
    var hw = art.parentNode && art.parentNode.querySelector(".hw");
    Promise.all([getAssets(), load(src), settled(hw)]).then(function (r) {
      if (g.dead || !art.isConnected) return;
      build(g, art, r[1], r[0], top, frame, opts || {}, hw);
    }).catch(function () {});
  }

  // 大字的字母有進場動畫、字型也要載完，等好了再量位置（最多等 3 秒）
  function settled(hw) {
    var wait = [];
    if (document.fonts && document.fonts.ready) wait.push(document.fonts.ready);
    if (hw && hw.getAnimations) hw.getAnimations({ subtree: true }).forEach(function (a) { wait.push(a.finished.catch(function () {})); });
    return Promise.race([Promise.all(wait), new Promise(function (ok) { setTimeout(ok, 3000); })]);
  }
  // 把伸進插畫的那半截大字畫進「玻璃後面的景色」：霧裡看到糊糊的字，擦開才是清楚的字
  function paintWord(x, hw, o, dpr) {
    var cs = getComputedStyle(hw), spans = hw.querySelectorAll(".hw-in span");
    x.save(); x.scale(dpr, dpr);
    x.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    x.fillStyle = cs.color; x.textBaseline = "alphabetic";
    var m = x.measureText("Hg"), fs = parseFloat(cs.fontSize);
    var fa = m.fontBoundingBoxAscent || fs * .9, fd = m.fontBoundingBoxDescent || fs * .25;
    for (var i = 0; i < spans.length; i++) {
      var r = spans[i].getBoundingClientRect();
      // 字母是行高壓扁的小區塊：基線＝區塊頂＋上下平分的行距＋字型上半部高度
      x.fillText(spans[i].textContent, r.left - o.left, r.top - o.top + (r.height - (fa + fd)) / 2 + fa);
    }
    x.restore();
  }

  function build(g, art, illu, A, top, frame, opts, hw) {
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
    // 晚上下雨：手指是在擦玻璃，點不出流星，星星的提示就拿掉，免得兩個提示疊在一起
    Array.prototype.forEach.call(art.querySelectorAll("span.tilt-chip"), function (c) { c.remove(); }); // 「傾斜手機」按鈕留著：下雨也能傾斜
    var ctx = cv.getContext("2d"), clip = new Path2D(frame);

    // 清楚的插畫（含上緣漸層，跟畫面上的一樣）：拿來做雨滴裡的倒影
    var base = canvas(W, H), bx = base.getContext("2d");
    bx.drawImage(illu, 0, 0, W, H);
    // 上緣漸層和大字固定在畫面上（不會跟著傾斜移動），另外放一張透明的
    var fixed = canvas(W, H), fxc = fixed.getContext("2d");
    var gr = fxc.createLinearGradient(0, 0, 0, 110 * s);
    gr.addColorStop(0, top); gr.addColorStop(.35, rgba(top, .55)); gr.addColorStop(1, rgba(top, 0));
    fxc.fillStyle = gr; fxc.fillRect(0, 0, W, 110 * s);
    if (hw) paintWord(fxc, hw, art.getBoundingClientRect(), dpr);
    bx.drawImage(fixed, 0, 0);

    // 霧：插畫模糊、蓋一層淡淡的白，再疊上霧珠的質感。
    // 傾斜手機時，霧裡模糊的景色跟後面的景色一起移動；白霧、霧珠、雨滴、擦過的痕跡在玻璃上，留在原地
    // （2026/11/02 使用者想要的樣子）。所以景色（會動）和大字、漸層（不動）分開模糊
    // 模糊的做法：先縮到固定寬度，再縮一半一次、放大回來（2026/11/02 使用者選「模糊減半」：
    // 模糊越大，夕陽的粉黃越會暈進山裡，擦開後山是藍的，看起來很突兀）。
    // 一次縮很小再一口氣放大，山的邊緣會變成一階一階的鋸齒（2026/11/02 使用者發現）
    // 霧本來就是糊的，用一半的解析度畫就看不出差別，手機的工作量只剩 1/4（2026/11/02 效能檢測後改）
    var LW = Math.max(2, Math.round(W / 2)), LH = Math.max(2, Math.round(H / 2)), L = LW / W;
    function blurred(from) {
      // 先縮到固定的 360 寬（跟插畫的 viewBox 一樣），霧的濃淡才不會因為螢幕寬窄而不同
      var a = canvas(360, 260), ax = a.getContext("2d"), b = canvas(180, 130), bxx = b.getContext("2d");
      ax.imageSmoothingQuality = "high"; ax.drawImage(from, 0, 0, 360, 260);
      bxx.imageSmoothingQuality = "high"; bxx.drawImage(a, 0, 0, 180, 130);
      ax.globalCompositeOperation = "copy"; ax.drawImage(b, 0, 0, 360, 260);
      var out = canvas(LW, LH), ox = out.getContext("2d");
      ox.imageSmoothingQuality = "high"; ox.drawImage(a, 0, 0, LW, LH);
      return out;
    }
    var fogPic = blurred(illu);
    // 不會動的那張（糊糊的大字和漸層＋白霧）先疊好，每次只要蓋一次
    // 白霧上淡下濃：最上面那條是大字伸進來的地方，天空要跟字同色，字才融得進去
    var sheet = blurred(fixed), shx = sheet.getContext("2d"), hz = shx.createLinearGradient(0, 0, 0, LH);
    hz.addColorStop(0, "rgba(226,232,244,0)"); hz.addColorStop(.3, "rgba(226,232,244,.05)"); hz.addColorStop(.65, "rgba(226,232,244,.21)"); hz.addColorStop(1, "rgba(226,232,244,.26)");
    shx.fillStyle = hz; shx.fillRect(0, 0, LW, LH);
    var T = Math.round(240 * dpr * L), tile = canvas(T, T), k;
    tile.getContext("2d").drawImage(fogTex, 0, 0, T, T);
    // 霧珠質感一樣上面淡一點：先鋪滿，再用上淡下濃的漸層裁透明度
    var tx = canvas(LW, LH), tc = tx.getContext("2d");
    tc.fillStyle = tc.createPattern(tile, "repeat"); tc.fillRect(0, 0, LW, LH);
    var tg = tc.createLinearGradient(0, 0, 0, LH);
    tg.addColorStop(0, "rgba(0,0,0,.2)"); tg.addColorStop(.45, "rgba(0,0,0,.45)"); tg.addColorStop(1, "rgba(0,0,0,.5)");
    tc.globalCompositeOperation = "destination-in"; tc.fillStyle = tg; tc.fillRect(0, 0, LW, LH);

    // 哪裡有霧：用程式自己的小數記，每格 2 CSS px，1＝有霧、0＝擦乾淨；每次畫之前轉成遮罩、放大蓋上去。
    // 不直接在畫布上慢慢補：畫布透明度只有 256 級，每次補的量太小會被捨去，霧就回不來（2026/11/02）
    var GW = Math.max(8, Math.round(cssW / 2)), GH = Math.max(8, Math.round(cssH / 2));
    var fogv = new Float32Array(GW * GH), murky = false, mkDirty = true;
    for (k = 0; k < fogv.length; k++) fogv[k] = 1;
    var mk = canvas(GW, GH), mkx = mk.getContext("2d"), mkImg = mkx.createImageData(GW, GH);
    var layer = canvas(LW, LH), lx = layer.getContext("2d");
    var BR = 20 * dpr; // 手指擦的半徑
    // 在 (x, y) 半徑 r 的圓裡把霧帶走：中間帶走 hard，往外柔柔地變少
    function clearAt(x, y, r, hard) {
      var gx = x / W * GW, gy = y / H * GH, gr = r / W * GW;
      var x0 = Math.max(0, Math.floor(gx - gr)), x1 = Math.min(GW - 1, Math.ceil(gx + gr));
      var y0 = Math.max(0, Math.floor(gy - gr)), y1 = Math.min(GH - 1, Math.ceil(gy + gr));
      for (var yy = y0; yy <= y1; yy++) {
        for (var xx = x0; xx <= x1; xx++) {
          var ex = xx + .5 - gx, ey = yy + .5 - gy, d = Math.sqrt(ex * ex + ey * ey) / gr;
          if (d >= 1) continue;
          var t = d < .35 ? 0 : (d - .35) / .65, a = hard * (1 - t * t * (3 - 2 * t)); // 邊緣用平滑曲線收掉
          fogv[yy * GW + xx] *= 1 - a;
        }
      }
      murky = true; mkDirty = true;
    }

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
    var fade = opts && opts.instant ? 1 : 0, at0 = "", // instant：插畫換時段時本來就在下雨，霧直接是滿的（不然會先清楚一下再起霧）
        mv = { mx: 0, my: 0, zs: 1 };
    function draw(now) {
      // 跟後面的景色移一樣多、放大一樣多（白天、黃昏、夜景都是傾斜開著就放大好，霧也一樣）
      var st = window.TILT ? TILT.state(now) : { x: 0, y: 0, on: 0 };
      var zoom = st.on;
      if (window.TILT) mv = TILT.offset(W, H, dpr, zoom, st);
      var key = mv.zs.toFixed(4) + " " + mv.mx.toFixed(1) + " " + mv.my.toFixed(1);
      if (key !== at0) { at0 = key; mkDirty = true; }
      if (!mkDirty && !dirty) return; // 什麼都沒變：不重畫（省電，低階手機也跑得動）
      dirty = false;
      if (mkDirty) {
        var md = mkImg.data;
        for (var q = 0, n = fogv.length; q < n; q++) md[q * 4 + 3] = fogv[q] * 255;
        mkx.putImageData(mkImg, 0, 0);
        mkDirty = false;
        var zw = LW * mv.zs, zh = LH * mv.zs;
        lx.globalCompositeOperation = "copy"; lx.drawImage(fogPic, (LW - zw) / 2 + mv.mx * L, (LH - zh) / 2 + mv.my * L, zw, zh);
        lx.globalCompositeOperation = "source-over"; lx.drawImage(sheet, 0, 0);
        lx.globalCompositeOperation = "overlay"; lx.drawImage(tx, 0, 0);
        lx.globalCompositeOperation = "destination-in"; lx.imageSmoothingQuality = "high"; lx.drawImage(mk, 0, 0, LW, LH);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clip(clip); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = fade * .86; // 霧不要全蓋死，底下的插畫隱約透得出來
      ctx.imageSmoothingQuality = "high"; ctx.drawImage(layer, 0, 0, W, H);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i], p = d.pop < 1 ? d.pop : 1;
        ctx.globalAlpha = fade * Math.min(1, p * 1.5);
        var w = d.w * (.6 + .4 * p), h = d.h * (.6 + .4 * p);
        ctx.drawImage(d.c, d.x - w / 2, d.y - h / 2, w, h);
      }
      ctx.restore();
    }

    // ---------- 手指擦 ----------
    var last = null, wiped = false, hint = null, touchAt = 0;
    function stamp(x, y) {
      clearAt(x, y, BR, 1);
      // 擦過的地方，雨滴也一起抹掉
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i], dx = d.x - x, dy = d.y - y;
        if (dx * dx + dy * dy < BR * BR * .7) drops.splice(i, 1);
      }
    }
    function at(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    function down(e) { last = at(e); stamp(last[0], last[1]); dirty = true; touchAt = performance.now(); }
    function move(e) {
      if (!last) return;
      touchAt = performance.now();
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

    if (opts.hint) { // app.js 不再傳提示：手指擦玻璃當成小彩蛋（2026/11/02 使用者：插畫上兩個提示很怪）
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
    var prev = 0, nextSlide = 1.5, nextSpawn = .6, dirty = true, raf = 0, REFOG = 18, refogT = 0;
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
      var lite = window.TILT && TILT.lite();
      if (window.TILT) TILT.frame(dt);
      if (fade < 1) { fade = Math.min(1, fade + dt / 1.6); dirty = true; } // 霧慢慢起來
      if (drops.some(function (d) { return d.pop < 1 || d.v != null; })) dirty = true; // 有雨滴正在出現或往下滑
      // 擦開的地方慢慢回霧：全清到全霧大約 18 秒；手指還在擦、剛放開 1.2 秒內先不回
      // 只在「可以回霧」的時候累計時間（2026/11/02 踩過：從一打開就累計，第一次擦完一口氣補回去，霧突然變白）
      if (murky && !last && now - touchAt > 1200) refogT += dt; else refogT = 0;
      if (refogT >= .08) { // 一秒補 12 次就夠：霧回得很慢，看不出差別
        var inc = refogT / REFOG, any = false;
        refogT = 0;
        for (var q = 0, n = fogv.length; q < n; q++) {
          var v = fogv[q];
          if (v < 1) { v += inc; fogv[q] = v > 1 ? 1 : v; any = true; }
        }
        murky = any; mkDirty = true;
      }
      if (opts.motion && !lite) { // 手機跑不動時雨滴不滑、不再多（tilt.js 降級）
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
          // 滑過的地方把霧帶走，留下一條比較清楚的水痕（邊緣柔，不是切開的長條）
          var tr = d.w * .32, seg = Math.sqrt((d.x - d.lx) * (d.x - d.lx) + (d.y - d.ly) * (d.y - d.ly)), sn = Math.max(1, Math.ceil(seg / (tr * .5)));
          for (var si = 1; si <= sn; si++) clearAt(d.lx + (d.x - d.lx) * si / sn, d.ly + (d.y - d.ly) * si / sn - d.h * .2, tr, .85);
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
      draw(now);
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
    window.__glassBase = function () { return base; };
    window.__glassFog = function (fx, fy) { return fogv[Math.min(GH - 1, Math.floor(fy * GH)) * GW + Math.min(GW - 1, Math.floor(fx * GW))]; }; // 測試用：那一點的霧有多少（0–1）
    window.__glass = function () { return { w: W, h: H, drops: drops.length, fade: fade, sliding: drops.filter(function (d) { return d.v != null; }).length }; };
  }

  window.GLASS = { start: start, stop: stop };
})();
