// 晚上的天空：那個城市入夜後，每日頁插畫換成同一個地方的夜景，天空有星星（night 分支試做）
// 素材都是 Codex 畫的：夜景（用白天的圖改畫，構圖對齊）、星空、流星；天空範圍是從夜景圖算出來的
//   TRIP.photos[art].night = { src 夜景, sky 天空範圍（透明度）, top 夜空頂端色, hz 每 1/64 寬的地平線高度 }
//   img/sky-stars-dim.jpg     一般的星星（黑底，用「濾色」疊，黑色會消失）
//   img/sky-stars-bright.jpg  拆出來的 60 顆亮星，每顆各自閃爍
//   img/sky-meteor.jpg        流星
// 程式只負責：夜景淡入、星星閃爍、傾斜手機整個畫面微微移動（星星比地面動得少）、點天空有流星、偶爾自己劃過一顆、燈火的亮暗
//   TRIP.photos[art].night.lights  只有燈光的圖（tools/night-lights.py 從夜景拆出來，黑底、位置對齊）
//   TRIP.photos[art].night.lamps   每盞燈 [x, y, 半徑, 種類]（0–1 比例），種類見下面 LIGHT
// 燈火是把「只有燈光的圖」那一小塊加亮（lighter）或減暗（difference：夜景減掉燈光＝燈熄掉）疊上去，光本身都是 Codex 畫的
(function () {
  // 亮星在星空圖上的位置（1360×620）
  var BRIGHT = [[621, 180], [28, 474], [36, 244], [1314, 377], [312, 494], [360, 178], [1257, 150], [606, 265], [1091, 246], [356, 131], [550, 68], [183, 608],
    [1117, 571], [1052, 468], [630, 70], [1239, 20], [788, 92], [132, 212], [1094, 406], [869, 327], [1051, 392], [443, 80], [375, 284], [787, 37], [707, 188],
    [1204, 346], [853, 163], [233, 418], [845, 232], [385, 19], [1048, 43], [1049, 187], [1311, 558], [151, 404], [141, 113], [147, 341], [24, 48], [612, 323],
    [1151, 606], [1206, 424], [1340, 173], [441, 507], [439, 142], [1094, 65], [388, 458], [200, 317], [1028, 345], [1238, 463], [1169, 268], [1062, 309],
    [53, 296], [488, 67], [901, 365], [1292, 321], [993, 314], [340, 58], [930, 204], [32, 359], [927, 417], [83, 520]];
  var ORIGIN = 40, DRIFT = 36; // 插畫左上角對到星空圖的 (40, 40)；星星最多移動 36（星空圖的 px），四邊都有留空間
  var STAR = .35; // 傾斜時整個畫面一起動；星星比山遠，移動得比地面少（越遠動越少，像坐車看窗外：路樹一下就過、遠山幾乎不動）
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

  // art：.hero-art；n：TRIP.photos[art].night；opts：frame（缺角圖框路徑）
  function start(art, n, opts) {
    stop();
    var g = { dead: false };
    cur = g;
    // 大字慢慢變成夜空的顏色（大字伸進插畫的那截才融得進夜空）
    var hw = art.parentNode && art.parentNode.querySelector(".hw");
    if (hw) { hw.style.transition = "color 2s ease"; hw.style.color = n.top; }
    var lp = n.lights && n.lamps ? load(n.lights).catch(function () { return null; }) : Promise.resolve(null); // 沒下載到也沒關係，只是燈不會動
    Promise.all([load(n.src), load(n.sky), getAssets(), lp]).then(function (r) {
      if (g.dead || !art.isConnected) return;
      build(g, art, r[0], r[1], r[2], n, opts || {}, r[3]);
    }).catch(function () {});
  }

  // ---------- 燈火 ----------
  // 每種燈照它在現實裡的樣子動，幅度都很小（2026/11/03 使用者：燈火也想有點動態；要克制，不像聖誕燈飾）
  //   flame  油燈、燈籠、火焰：亮度不規則地搖曳
  //   far    遠處房子的窗：隔著空氣慢慢地閃
  //   lamp   公園路燈：幾乎不動，只有很慢的一點起伏
  //   water  湖面倒影：跟著水波晃（左右微微移動、亮暗起伏）
  //   beacon 紅燈：大部分時間暗暗的，規律地亮一下（飛機翼尖約 1.2 秒、大樓頂約 2 秒）
  //   strobe 機尾白燈：一次閃兩下
  //   window 大樓窗戶：平常不動，偶爾有一扇熄掉，過一陣子再亮
  var TAU = 6.283;
  function makeLamp(p, BW, BH, plane) {
    var L = { x: p[0] * BW, y: p[1] * BH, h: p[2] * BW * 1.2 + 1, t: p[3], p1: rnd(0, TAU), p2: rnd(0, TAU), p3: rnd(0, TAU), cur: 0, want: 0, left: 0 };
    if (L.t === "flame") { L.f1 = rnd(1.3, 2.2); L.f2 = rnd(3.1, 4.7); L.f3 = rnd(6, 9); }
    else if (L.t === "far") { L.f1 = rnd(.15, .45); L.f2 = rnd(1, 2); }
    else if (L.t === "lamp") { L.f1 = rnd(.08, .25); }
    else if (L.t === "water") { L.f1 = rnd(.6, 1.2); L.f2 = rnd(1.7, 2.9); L.fs = rnd(.45, .9); L.amp = BW * .0016; }
    else if (L.t === "beacon") { L.P = plane ? rnd(1.1, 1.3) : rnd(1.7, 2.4); L.p1 = rnd(0, L.P); }
    else if (L.t === "strobe") { L.P = 1.25; L.p1 = rnd(0, L.P); }
    return L;
  }
  function pulse(ph, at, w) { var d = (ph - at) / w; return Math.exp(-d * d); }
  function lampMod(L, t) { // >0 加亮、<0 減暗（-1＝整盞熄掉）
    switch (L.t) {
      case "flame": return .2 * Math.sin(t * L.f1 * TAU + L.p1) + .13 * Math.sin(t * L.f2 * TAU + L.p2) + .08 * Math.sin(t * L.f3 * TAU + L.p3);
      case "far": return .25 * Math.sin(t * L.f1 * TAU + L.p1) + .07 * Math.sin(t * L.f2 * TAU + L.p2);
      case "lamp": return .12 * Math.sin(t * L.f1 * TAU + L.p1);
      case "water": return .3 * Math.sin(t * L.f1 * TAU + L.p1) + .2 * Math.sin(t * L.f2 * TAU + L.p2);
      case "beacon": var ph = ((t + L.p1) % L.P) / L.P; return -.8 + 1.5 * pulse(ph, .06, .045);
      case "strobe": ph = ((t + L.p1) % L.P) / L.P; return -.85 + 1.6 * (pulse(ph, .03, .018) + pulse(ph, .15, .018));
      case "window": return L.cur;
    }
    return 0;
  }

  function build(g, art, img, sky, A, n, opts, limg) {
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
    // 下雨時也一起動：glass.js 的霧照同樣的數字移動（2026/11/02 使用者想要：霧跟著景色、雨滴留在玻璃上）
    // 移多少、放大多少都照 tilt.js（白天、下雨的霧用同一套，才對得上）
    var sc = TILT.fit(W, H, dpr).sc, BW = Math.round(W * sc), BH = Math.round(H * sc);
    function pre(src, w, h) { var c = canvas(w, h), x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, w, h); return c; }
    var big = pre(img, BW, BH), bigMask = pre(sky, BW, BH);
    var bigL = limg ? pre(limg, BW, BH) : null;
    var plane = !!(n.lamps && n.lamps.some(function (p) { return p[3] === "strobe"; }));
    var lamps = bigL ? n.lamps.map(function (p) { return makeLamp(p, BW, BH, plane); }) : [];
    var wins = lamps.filter(function (L) { return L.t === "window"; }), nextWin = rnd(2, 5);
    // 窗戶：偶爾挑一扇熄掉 6–16 秒（同時最多 3 扇），開關燈很快（約 0.3 秒）
    function stepWindows(dt) {
      if (!wins.length) return;
      nextWin -= dt;
      var off = 0, i, L;
      for (i = 0; i < wins.length; i++) {
        L = wins[i];
        if (L.left > 0 && (L.left -= dt) <= 0) L.want = 0;
        if (L.want) off++;
        L.cur += (L.want - L.cur) * Math.min(1, dt * 9);
      }
      if (nextWin <= 0) {
        nextWin = rnd(3, 8);
        L = wins[Math.floor(Math.random() * wins.length)];
        if (off < 3 && !L.want) { L.want = -.92; L.left = rnd(6, 16); }
      }
    }
    // 把燈光圖的一小塊疊到夜景上（燈火跟地面一起動：位置照夜景現在的位置和放大）
    function lampBlit(dc, L, op, a, bx0, by0, z, ox) {
      var sx = Math.max(0, L.x - L.h), sy = Math.max(0, L.y - L.h), ex = Math.min(BW, L.x + L.h), ey = Math.min(BH, L.y + L.h);
      if (ex <= sx || ey <= sy || a <= .01) return;
      dc.globalCompositeOperation = op; dc.globalAlpha = Math.min(1, a);
      dc.drawImage(bigL, sx, sy, ex - sx, ey - sy, bx0 + (sx + ox) * z, by0 + sy * z, (ex - sx) * z, (ey - sy) * z);
    }
    function drawLamps(dc, t, bx0, by0, z) { // dc 一定是不透明的（夜景已經鋪滿），加亮減暗才不會改到透明度
      for (var i = 0; i < lamps.length; i++) {
        var L = lamps[i], m = lampMod(L, t);
        if (L.t === "water") { // 倒影：原位置減暗一些，再加亮到旁邊一點點，看起來在水裡晃
          lampBlit(dc, L, "difference", .55, bx0, by0, z, 0);
          lampBlit(dc, L, "lighter", .55 + m, bx0, by0, z, L.amp * Math.sin(t * L.fs * TAU + L.p3));
        } else if (m > .01) lampBlit(dc, L, "lighter", m, bx0, by0, z, 0);
        else if (m < -.01) lampBlit(dc, L, "difference", -m, bx0, by0, z, 0);
      }
      dc.globalCompositeOperation = "source-over"; dc.globalAlpha = 1;
    }
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
    var fade = 0, px = 0, py = 0, lim = 0, comp = null;
    function draw(t, st) {
      // 入夜那 2 秒（還有開始收到傾斜的時候）從原尺寸慢慢放大到 sc（像鏡頭推近），邊緣才不會露白
      var o = TILT.offset(W, H, dpr, fade * st.on, st), zs = o.zs, zw = W * zs, zh = H * zs, mx = o.mx, my = o.my;
      px = mx; py = my; lim = o.lim;
      var bx0 = (W - zw) / 2 + mx, by0 = (H - zh) / 2 + my;
      // 星空圖上，對到插畫左上角的位置（星星動得比地面少）
      var ox = ORIGIN - clamp(STAR * mx / k, -DRIFT, DRIFT), oy = ORIGIN - clamp(STAR * my / k, -DRIFT, DRIFT);
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
      lx.drawImage(bigMask, bx0, by0, zw, zh); // 天空範圍跟著地面一起動

      // 入夜那 2 秒：夜景、燈火、星星先在另一張畫布組好（不透明），再整張一起淡入。
      // 一層一層各自用 fade 疊的話，燈火的加亮／減暗會讓那一小塊比旁邊更不透明，多遮住底下的黃昏圖，
      // 漸變時看得到一塊塊方塊（2026/11/03 使用者在雅加達紀念塔、大樓頂的紅燈抓到）
      var fading = fade < 1;
      if (fading && !comp) comp = canvas(W, H);
      else if (!fading) comp = null; // 入夜以後就用不到了，放掉記憶體
      var dc = fading ? comp.getContext("2d") : ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clip(clip); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (fading) dc.clearRect(0, 0, W, H);
      dc.globalCompositeOperation = "source-over"; dc.globalAlpha = 1;
      dc.drawImage(big, bx0, by0, zw, zh);
      if (lamps.length) drawLamps(dc, t, bx0, by0, zw / BW);
      dc.drawImage(grc, 0, 0);
      dc.globalCompositeOperation = "screen";
      dc.drawImage(layer, 0, 0);
      dc.globalCompositeOperation = "source-over";
      if (fading) { ctx.globalAlpha = fade; ctx.drawImage(comp, 0, 0); }
      ctx.restore();
    }

    // 不出提示：點天空有流星、傾斜手機，都當成小彩蛋（2026/11/02 使用者）
    var chip = null;

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
      if (fade < 1) g.fade = fade = Math.min(1, fade + dt / 2); // 跟大字一起，2 秒慢慢入夜
      nextMet -= dt;
      if (nextMet <= 0) { meteor(W * rnd(.2, .85), skyH * rnd(.08, .4)); nextMet = rnd(20, 45); }
      for (var i = mets.length - 1; i >= 0; i--) { mets[i].t += dt; if (mets[i].t > mets[i].dur) mets.splice(i, 1); }
      stepWindows(dt);
      // 星星閃爍不用每格都畫：沒有流星、沒在移動時，一秒畫 30 次就夠（省電）
      if (!art.classList.contains("has-glass")) TILT.frame(dt); // 下雨時玻璃那邊回報就好
      var st = TILT.state(now);
      var moving = mets.length || fade < 1 || TILT.busy();
      if (!moving && now - last < (TILT.lite() ? 100 : 33)) return; // 跑不動的手機一秒閃 10 次就好
      last = now;
      draw(now / 1000, st);
    }
    raf = requestAnimationFrame(step);

    var onResize = function () { clearTimeout(g.rt); g.rt = setTimeout(function () { if (!g.dead && svg.clientWidth !== cssW) start(art, n, opts); }, 250); };
    window.addEventListener("resize", onResize);
    function cleanup() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      if (cv.parentNode) cv.remove();
      if (chip && chip.parentNode) chip.remove();
      art.classList.remove("has-night");
    }
    g.off = cleanup;
    window.__night = function () { return { w: W, h: H, fade: fade, px: px, py: py, meteors: mets.length, nextMeteor: nextMet }; };
    window.__nightMeteor = function () { meteor(W * .6, skyH * .25); }; // 測試用
    window.__nightLamps = function (t) { // 測試用：有幾盞燈、各種幾盞、熄掉的窗戶、某個時間點每盞的亮暗
      var by = {}; lamps.forEach(function (L) { by[L.t] = (by[L.t] || 0) + 1; });
      return { n: lamps.length, by: by, off: wins.filter(function (L) { return L.want; }).length,
        mods: t == null ? null : lamps.map(function (L) { return Math.round(lampMod(L, t) * 100) / 100; }) };
    };
    window.__nightTilt = function (gamma, beta) { window.__tilt(gamma, beta); }; // 測試用：假裝手機傾斜
  }

  // 下雨的霧要跟夜景放大一樣多：入夜到幾成了
  function fadeNow() { return cur && cur.fade != null ? cur.fade : 1; }
  window.NIGHT = { start: start, stop: stop, fade: fadeNow };
})();
