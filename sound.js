// 背景聲音：播放一段真的海浪錄音（snd/waves.m4a），無縫循環。
// 錄音來源：BigSoundBank「Sea waves and seagulls」（s0267，DenisChardonnet 錄，CC0 公有領域，可自由使用）
//   https://bigsoundbank.com/sea-waves-and-seagulls-s0267.html
//   原檔 58 秒；剪成 53.6 秒，結尾 4 秒和開頭交叉淡入淡出，循環時聽不出接縫；轉成 AAC 96kbps（約 650KB）。
// 用 Web Audio 播（不是 <audio>），因為 <audio loop> 在接回開頭時會有一小段空白。
// 用法：var s = SOUND.loop(ctx, 目的地, 網址)；s.out 是音量（GainNode），s.ready 在開始播之後完成。
(function () {
  function decode(ctx, data) {
    return new Promise(function (ok, fail) { // 舊版 Safari 只支援 callback 寫法
      var p = ctx.decodeAudioData(data, ok, fail);
      if (p && p.then) p.then(ok, fail);
    });
  }
  function loop(ctx, dest, url) {
    var out = ctx.createGain();
    out.gain.value = 0;
    out.connect(dest);
    var ready = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (data) { return decode(ctx, data); })
      .then(function (buf) {
        var src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(out); src.start(0);
      });
    return { out: out, ready: ready };
  }
  window.SOUND = { loop: loop };
})();
