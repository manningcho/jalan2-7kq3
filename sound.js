// 背景聲音：播放真的環境錄音，無縫循環。全部來自 BigSoundBank，都是 CC0（公有領域，可自由使用）：
//   waves  海浪＋海鳥   s0267 Sea waves and seagulls   https://bigsoundbank.com/sea-waves-and-seagulls-s0267.html
//   birds  早晨田野鳥叫 s0912 Campaign morning         https://bigsoundbank.com/campaign-morning-s0912.html
//   city   熱鬧街道     s2676 Lourdes pedestrian street https://bigsoundbank.com/lourdes-pedestrian-street-s2676.html
//   rain   陣雨         s1019 Summer rain on terrace    https://bigsoundbank.com/summer-rain-on-terrace-s1019.html
//   night  夜晚蟲鳴蛙叫 s1880 Campaign at night #4      https://bigsoundbank.com/campaign-at-night-4-s1880.html
// 每段剪成約 1 分鐘、結尾 4 秒和開頭交叉淡化（循環聽不出接縫）、音量對齊海浪那段、轉成 AAC 96kbps（約 0.7–0.85MB）。
// 用 Web Audio 播（不是 <audio>），因為 <audio loop> 接回開頭時會有一小段空白。
// 用法：var s = SOUND.loop(ctx, 目的地, 網址)；s.out 是這段的音量，s.ready 在開始播之後完成，s.stop() 停掉並放掉記憶體。
(function () {
  function decode(ctx, data) {
    return new Promise(function (ok, fail) { // 舊版 Safari 只支援 callback 寫法
      var p = ctx.decodeAudioData(data, ok, fail);
      if (p && p.then) p.then(ok, fail);
    });
  }
  function loop(ctx, dest, url) {
    var out = ctx.createGain(), src = null, dead = false;
    out.gain.value = 0;
    out.connect(dest);
    var ready = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (data) { return decode(ctx, data); })
      .then(function (buf) {
        if (dead) return;
        src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(out); src.start(0);
      });
    return {
      out: out, ready: ready,
      stop: function () { // 解碼後的聲音很佔記憶體（1 分鐘約 20MB），不用的就放掉
        dead = true;
        try { if (src) { src.stop(); src.disconnect(); src.buffer = null; } out.disconnect(); } catch (e) {}
      }
    };
  }
  window.SOUND = { loop: loop };
})();
