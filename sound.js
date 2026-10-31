// 背景聲音：用瀏覽器內建的 Web Audio 「合成」海浪聲，不用任何音檔，沒有版權問題，沒網路也能播。
// 做法：
// - 低沉的浪身：褐色雜訊（低頻多）經過低通濾波，音量和濾波一起一波一波地起伏。
// - 浪花的沙沙聲：白雜訊經過帶通濾波，在浪頭拍下來時出現，退潮時慢慢消失。
// - 每一波的長短、大小、左右位置都隨機，聽起來才不會像機器。
// 用法：var w = SOUND.waves(ctx, 目的地)；之後一直呼叫 w.until(秒數) 把浪排到那個時間點（app.js 每 2 秒排一次）。
(function () {
  function noise(ctx, sec, brown) {
    var n = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch), last = 0;
      for (var i = 0; i < n; i++) {
        var w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * 0.5;
      }
    }
    return buf;
  }
  function loop(ctx, buf) {
    var s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.start(0);
    return s;
  }

  function waves(ctx, dest) {
    var out = ctx.createGain(); out.gain.value = 1;
    var comp = ctx.createDynamicsCompressor(); // 浪特別大的時候壓一下，不會爆音
    comp.threshold.value = -14; comp.ratio.value = 4;
    out.connect(comp); comp.connect(dest);
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    pan.connect(out);

    // 浪身
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320; lp.Q.value = 0.4;
    var body = ctx.createGain(); body.gain.value = 0.1;
    loop(ctx, noise(ctx, 8, true)).connect(lp); lp.connect(body); body.connect(pan);
    // 浪花
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.6;
    var foam = ctx.createGain(); foam.gain.value = 0;
    loop(ctx, noise(ctx, 6, false)).connect(bp); bp.connect(foam); foam.connect(pan);
    // 遠方一直都在的低低浪聲
    var far = ctx.createGain(); far.gain.value = 0.11;
    var lp2 = ctx.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 220;
    loop(ctx, noise(ctx, 7, true)).connect(lp2); lp2.connect(far); far.connect(out);

    var next = ctx.currentTime + 0.2;
    function wave(t0) {
      var D = 6.5 + Math.random() * 4.5, A = 0.45 + Math.random() * 0.55; // 一波 6.5–11 秒，大小隨機
      // 浪湧上來：音量變大、聲音變亮
      body.gain.setTargetAtTime(0.07 + A * 0.75, t0, D * 0.14);
      lp.frequency.setTargetAtTime(420 + A * 900, t0, D * 0.14);
      // 浪頭拍下來：沙沙聲出現
      foam.gain.setTargetAtTime(A * 0.32, t0 + D * 0.33, D * 0.06);
      bp.frequency.setTargetAtTime(1800 + A * 1400, t0 + D * 0.33, D * 0.1);
      // 退潮：浪身先退，沙沙聲拖長一點慢慢消失
      body.gain.setTargetAtTime(0.1, t0 + D * 0.45, D * 0.17);
      lp.frequency.setTargetAtTime(320, t0 + D * 0.45, D * 0.2);
      foam.gain.setTargetAtTime(0, t0 + D * 0.52, D * 0.2);
      if (pan.pan) pan.pan.setTargetAtTime(Math.random() * 0.8 - 0.4, t0, 1.2); // 每一波從稍微不同的方向來
      return D * (0.82 + Math.random() * 0.2); // 下一波在這一波快退完時就來
    }
    return {
      out: out,
      until: function (t) { while (next < t) next += wave(next); }
    };
  }

  window.SOUND = { waves: waves };
})();
