// 傾斜手機：每日頁插畫整張微微跟著手機移動，像鏡頭在動（白天、晚上、下雨共用這一套）
//   白天：移動 SVG 插畫本身（art.js 包在 g.a-tilt 裡）
//   晚上：night.js 的夜景畫布照這裡的數字移動，星星動得比地面少
//   下雨：glass.js 的霧跟著景色一起移動；雨滴、霧珠、擦過的痕跡在玻璃上，留在原地
// 這裡負責：拿手機方向（iPhone 要先點一下允許）、算出現在要移多少、慢慢回正、「傾斜手機」按鈕
(function () {
  var MAXDEG = 15;      // 傾斜 15 度就移到最多
  var RECENTER = 15000; // 換了拿手機的姿勢，約 15 秒慢慢把那個姿勢當成正中間
  // （2026/11/02 原本每個事件拉 0.4%，iPhone 一秒 60 次，斜著停 4 秒就滑回中間，截圖時看起來像沒動）
  var DR = 16;          // 最多移動幾個 CSS px（左右；上下是 0.6 倍）。原本 9，iPhone 上幾乎看不出來（2026/11/02）

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var motionOK = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- 手機方向 ----------
  var g0 = null, b0 = null, oriT = 0, tgx = 0, tgy = 0, got = false, listening = false;
  var evs = 0, lastG = null, lastB = null, perm = "-";
  function onOri(e) {
    evs++; lastG = e.gamma; lastB = e.beta;
    if (lite) { tgx = tgy = 0; return; } // 手機跑不動：慢慢回到正中間後就不再移動
    if (e.gamma == null || e.beta == null) return; // 電腦有時候會送一次空的
    var now = performance.now();
    if (g0 == null) { g0 = e.gamma; b0 = e.beta; oriT = now; }
    var k = 1 - Math.exp(-Math.min(now - oriT, 200) / RECENTER); oriT = now;
    g0 += (e.gamma - g0) * k; b0 += (e.beta - b0) * k;
    tgx = -clamp((e.gamma - g0) / MAXDEG, -1, 1);
    tgy = -clamp((e.beta - b0) / MAXDEG, -1, 1) * .6;
    got = true;
  }
  function listen() { if (!listening && motionOK) { window.addEventListener("deviceorientation", onOri); listening = true; } }

  // ---------- 手機跑不動時自動降級 ----------
  // 夜空、雨天每畫一格就回報一次間隔；跑了 3 秒以後，平均一格超過 45ms（一秒不到 22 格）就降級：
  // 不再跟著傾斜移動、雨滴不再滑落、星星閃爍放慢。一旦降級，這次打開網頁就一直維持（2026/11/02 網友說低階手機會跑不動）
  var lite = /[?&]lite=1/.test(location.search), ema = 0, runT = 0;
  function frame(dt) {
    if (lite || !dt) return;
    runT += dt;
    ema = ema ? ema + (dt - ema) * .05 : dt;
    if (runT > 3 && ema > .045) lite = true;
  }

  // ---------- 現在要移多少（每一格畫面問一次；同一格問好幾次也一樣）----------
  // x、y：-1～1（乘上 dr 就是 px）；on：開始收到傾斜後 1.2 秒從 0 慢慢變 1（畫面先微微放大，邊緣才不會露白）
  var x = 0, y = 0, on = 0, lastT = 0;
  function state(now) {
    now = now || performance.now();
    var dt = lastT ? Math.min(.05, Math.max(0, now - lastT) / 1000) : 0;
    lastT = now;
    if (dt) {
      x += (tgx - x) * Math.min(1, dt * 4); y += (tgy - y) * Math.min(1, dt * 4);
      if (got && on < 1) on = Math.min(1, on + dt / 1.2);
    }
    return { x: x, y: y, on: on };
  }
  function busy() { return got && (on < 1 || Math.abs(tgx - x) > .002 || Math.abs(tgy - y) > .002); }
  // 一張 W×H（螢幕 px）的畫面要先放大幾倍，移動時四邊才不會露白
  function fit(W, H, dpr) {
    var dr = DR * dpr;
    return { dr: dr, sc: Math.max(1 + 2 * (dr + 1) / W, 1 + 1.2 * (dr + 1) / H) };
  }
  // zoom：0～1，這一層現在放大到幾成（晚上入夜時是慢慢放大的）
  // 回傳 zs 放大倍數、mx/my 移動的螢幕 px（已經夾在不會露白的範圍內）
  function offset(W, H, dpr, zoom, st) {
    var f = fit(W, H, dpr), zs = 1 + (f.sc - 1) * zoom;
    var lim = Math.max(0, (W * zs - W) / 2 - .5), limY = Math.max(0, (H * zs - H) / 2 - .5);
    return { zs: zs, mx: clamp(st.x * f.dr, -lim, lim), my: clamp(st.y * f.dr, -limY, limY), lim: lim, sc: f.sc };
  }

  // ---------- 權限：iPhone 要點一下允許；允許過就記住（trip-tilt） ----------
  // 只有觸控螢幕（手機、平板）才問；新版電腦 Chrome 也有這個詢問功能，但電腦沒有方向感測器
  var touch = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  var needAsk = touch && motionOK && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function";
  var remembered = null; // "1" 允許過、"0" 按了按鈕但被拒絕（之後不再出按鈕，免得每頁都跳）
  try { remembered = localStorage.getItem("trip-tilt"); } catch (e) {}
  var granted = false;
  function ask() {
    perm = "asking";
    return DeviceOrientationEvent.requestPermission().then(function (st) {
      perm = st;
      if (st === "granted") { granted = true; listen(); }
      return st;
    }, function (err) { perm = "err " + (err && err.name || err); throw err; });
  }
  function save(v) { remembered = v; try { localStorage.setItem("trip-tilt", v); } catch (e) {} }

  // 允許過：先開始聽（有時候不用再問就收得到），再在第一次「點一下」時悄悄要一次；被拒絕就把按鈕叫出來。
  // 要用 touchend／click：iPhone 只把完整的點擊當作同意，手指剛碰到（pointerdown）不算
  // （2026/11/02 踩過：原本用 pointerdown，重開網頁後傾斜完全不動）
  var FIRST = ["touchend", "click"], firstOn = false;
  function onFirst() {
    FIRST.forEach(function (ev) { document.removeEventListener(ev, onFirst, true); });
    firstOn = false;
    ask().then(function (st) { if (st !== "granted") { save("0"); offerChip(); } }).catch(function () { offerChip(); });
  }
  if (!needAsk) listen();
  else if (remembered === "1") {
    listen();
    firstOn = true;
    FIRST.forEach(function (ev) { document.addEventListener(ev, onFirst, true); });
  }

  // 「傾斜手機看看」按鈕：放在插畫裡，點了才問
  var chip = null, chipArt = null, chipText = "", onGranted = null;
  function offerChip() {
    if (!chipArt || !chipArt.isConnected || !chipText || granted || remembered === "0") return;
    if (chip) chip.remove();
    var c = chip = document.createElement("button");
    c.type = "button";
    c.className = "tilt-chip";
    c.textContent = chipText + " ✦";
    chipArt.appendChild(c);
    setTimeout(function () { c.classList.add("is-in"); }, 1600);
    c.addEventListener("click", function (e) {
      e.stopPropagation();
      if (firstOn) { FIRST.forEach(function (ev) { document.removeEventListener(ev, onFirst, true); }); firstOn = false; }
      ask().then(function (st) {
        c.classList.add("is-gone");
        if (st === "granted") { save("1"); if (onGranted) onGranted(); }
        else save("0");
      }).catch(function () { c.classList.add("is-gone"); });
    });
  }
  // 每換一頁叫一次：text 是按鈕上的字（晚上「傾斜手機看星星」），granted 是允許之後要做的事（晚上送一顆流星）
  function prompt(art, text, cb) {
    if (chip) { chip.remove(); chip = null; }
    chipArt = art; chipText = text; onGranted = cb || null;
    if (needAsk && remembered !== "1") offerChip();
  }
  // 晚上的提示（點天空看流星）要讓位給按鈕：還需要按鈕時回傳 true
  function asking() { return !!(needAsk && !granted && remembered !== "1" && remembered !== "0"); }

  // ---------- 白天：移動 SVG 插畫本身 ----------
  var day = null;
  function scene(art) {
    if (day) day.dead = true;
    if (!motionOK || !touch) return; // 電腦不動（2026/11/02 使用者：滑鼠帶動很怪）
    var g = art && art.querySelector("svg.art g.a-tilt"), svg = art && art.querySelector("svg.art");
    if (!g || !svg) return;
    var me = day = { dead: false }, shown = "";
    function step(now) {
      if (me.dead || !g.isConnected) return;
      requestAnimationFrame(step);
      if (document.hidden) return;
      // 夜景蓋在上面時不用動（看不到）；省電
      if (art.classList.contains("has-night")) { if (shown) { g.removeAttribute("transform"); shown = ""; } return; }
      var st = state(now);
      if (!st.on) return;
      var cssW = svg.clientWidth, cssH = svg.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!cssW || !cssH) return;
      var o = offset(cssW * dpr, cssH * dpr, dpr, st.on, st);
      // 螢幕 px 換成插畫的座標（viewBox 360×260，xMidYMax slice）
      var k = Math.max(cssW / 360, cssH / 260), vh = cssH / k, cx = 180, cy = 260 - vh / 2;
      var ux = o.mx / dpr / k, uy = o.my / dpr / k;
      var tr = "translate(" + (ux + cx).toFixed(2) + " " + (uy + cy).toFixed(2) + ") scale(" + o.zs.toFixed(4) + ") translate(" + (-cx) + " " + (-cy).toFixed(2) + ")";
      if (tr !== shown) { g.setAttribute("transform", tr); shown = tr; }
    }
    requestAnimationFrame(step);
  }

  function debug() {
    var f = function (v) { return v == null ? "-" : (+v).toFixed(1); };
    return "v7 evs " + evs + "  touch " + (touch ? 1 : 0) + " ask " + (needAsk ? 1 : 0) + " saved " + (remembered || "-") + " perm " + perm +
      "\ngamma " + f(lastG) + "  beta " + f(lastB) + "  g0 " + f(g0) + "  b0 " + f(b0) + "  on " + on.toFixed(2) +
      "\nx " + x.toFixed(2) + "  y " + y.toFixed(2) + "  frame " + (ema * 1000).toFixed(0) + "ms  lite " + (lite ? 1 : 0);
  }

  window.TILT = { frame: frame, lite: function () { return lite; }, state: state, busy: busy, fit: fit, offset: offset, prompt: prompt, asking: asking, scene: scene, debug: debug };
  window.__tilt = function (gamma, beta) { onOri({ gamma: gamma, beta: beta }); }; // 測試用：假裝手機傾斜
})();
