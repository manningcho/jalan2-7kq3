/* 插畫：每張都是 360×260 的 SVG，外框是有缺角的海報形狀。 */
(function () {
  "use strict";
  var W = 360, H = 260, uid = 0;
  var C = {
    skyTop: "#5677ae", skyMid: "#8fa3c6", skyLow: "#dcbcb4",
    sun: "#f7dcb6", far: "#8394b8", mid: "#4c5a7c", near: "#262c3e",
    pink: "#ecb8a8", white: "#ffffff", gold: "#e3b45a",
    soga: "#9a5b33", sogaLow: "#d9a06f"
  };
  // 海報缺角形狀：右上有一個凹口，左下有一個凹口
  var FRAME = "M3 0H357Q360 0 360 3V84C360 84 328 86 328 116C328 146 360 148 360 148V232Q360 260 332 260H28Q0 260 0 232V200C0 200 30 198 30 172C30 146 0 144 0 144V3Q0 0 3 0Z";

  function sky(id, top, mid, low) {
    return '<linearGradient id="s' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + (top || C.skyTop) + '"/><stop offset=".55" stop-color="' + (mid || C.skyMid) + '"/><stop offset="1" stop-color="' + (low || C.skyLow) + '"/></linearGradient>';
  }
  function clouds(y, o) {
    o = o == null ? .55 : o;
    return '<g class="a-drift" fill="#fff" opacity="' + o + '">' +
      '<ellipse cx="60" cy="' + y + '" rx="34" ry="7"/><ellipse cx="78" cy="' + (y - 5) + '" rx="18" ry="7"/>' +
      '<ellipse cx="250" cy="' + (y + 18) + '" rx="40" ry="6"/><ellipse cx="236" cy="' + (y + 13) + '" rx="16" ry="6"/>' +
      '<ellipse cx="410" cy="' + (y + 4) + '" rx="30" ry="6"/></g>';
  }
  function sun(x, y, r) {
    return '<g class="a-bob"><circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.9) + '" fill="' + C.sun + '" opacity=".25"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + C.sun + '"/></g>';
  }
  function palm(x, y, h, col) {
    col = col || C.near;
    var t = y - h;
    return '<g fill="none" stroke="' + col + '" stroke-linecap="round"><path d="M' + x + ' ' + y + ' Q' + (x + 6) + ' ' + (y - h / 2) + ' ' + (x + 3) + ' ' + t + '" stroke-width="3.5"/></g>' +
      '<g class="a-sway" style="transform-origin:' + (x + 3) + 'px ' + t + 'px" fill="' + col + '">' +
      [[-26, 6], [-18, -8], [0, -14], [18, -8], [26, 6], [-10, 12], [12, 12]].map(function (f) {
        var ex = x + 3 + f[0], ey = t + f[1];
        return '<path d="M' + (x + 3) + ' ' + t + ' Q' + ((x + 3 + ex) / 2) + ' ' + (Math.min(t, ey) - 8) + ' ' + ex + ' ' + ey + ' Q' + ((x + 3 + ex) / 2) + ' ' + (Math.min(t, ey) - 3) + ' ' + (x + 3) + ' ' + t + 'Z"/>';
      }).join("") + "</g>";
  }
  function bell(x, y, s) {
    return '<path d="M' + (x - s) + ' ' + y + 'Q' + (x - s) + ' ' + (y - s * 1.35) + ' ' + x + ' ' + (y - s * 1.45) + 'Q' + (x + s) + ' ' + (y - s * 1.35) + ' ' + (x + s) + ' ' + y + 'Z"/>' +
      '<rect x="' + (x - s * .14) + '" y="' + (y - s * 2.1) + '" width="' + (s * .28) + '" height="' + (s * .75) + '"/>';
  }
  function cone(l, peakL, peakR, r, base, col, hi) {
    var s = '<polygon points="' + l + ',' + base + ' ' + peakL[0] + ',' + peakL[1] + ' ' + peakR[0] + ',' + peakR[1] + ' ' + r + ',' + base + '" fill="' + col + '"/>';
    if (hi) {
      var px = peakL[0], py = peakL[1];
      s += '<path d="M' + px + ' ' + py + 'L' + peakR[0] + ' ' + peakR[1] + 'L' + (peakR[0] + 14) + ' ' + (peakR[1] + 18) + 'L' + (px + 4) + ' ' + (py + 22) + 'L' + (px - 10) + ' ' + (py + 38) + 'L' + (px - 22) + ' ' + (py + 30) + 'Z" fill="' + C.pink + '" opacity=".9"/>';
    }
    return s;
  }
  function water(y, col) {
    return '<rect x="0" y="' + y + '" width="' + W + '" height="' + (H - y) + '" fill="' + (col || "#6f86b3") + '"/>' +
      '<g class="a-shimmer" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".45">' +
      '<path d="M40 ' + (y + 14) + 'h40M150 ' + (y + 22) + 'h60M260 ' + (y + 12) + 'h44M90 ' + (y + 34) + 'h30M220 ' + (y + 40) + 'h50"/></g>';
  }

  var SCENES = {
    plane: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(270, 70, 22) + clouds(60) +
        '<g fill="#fff" opacity=".85"><ellipse cx="80" cy="235" rx="120" ry="40"/><ellipse cx="250" cy="245" rx="150" ry="42"/><ellipse cx="170" cy="215" rx="60" ry="22"/></g>' +
        '<g class="a-fly"><path d="M0 0h-90" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>' +
        '<path d="M0 0l-22-4-6-16h-6l2 15-18-2-5-8h-4l2 10-2 10h4l5-8 18-2-2 15h6l6-16z" fill="' + C.near + '"/></g>';
    },
    home: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(110, 150, 30) + clouds(70, .4) + water(175, "#7d7fa6") +
        '<g class="a-fly a-fly-r"><path d="M0 0h90" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>' +
        '<path d="M0 0l22-4 6-16h6l-2 15 18-2 5-8h4l-2 10 2 10h-4l-5-8-18-2 2 15h-6l-6-16z" fill="' + C.near + '"/></g>';
    },
    city: function (id) {
      var b = "", x = 0, hs = [70, 110, 85, 130, 95, 60, 0, 0, 120, 90, 140, 75, 105, 65];
      hs.forEach(function (h, i) {
        var w = 26;
        if (h) b += '<rect x="' + x + '" y="' + (220 - h) + '" width="' + (w - 3) + '" height="' + (h + 40) + '" fill="' + (i % 3 ? C.mid : C.far) + '"/>';
        x += w;
      });
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(80, 80, 18) + clouds(50) + b +
        '<polygon points="160,222 200,222 194,206 166,206" fill="' + C.near + '"/>' +
        '<polygon points="177,70 183,70 187,206 173,206" fill="' + C.near + '"/>' +
        '<rect x="171" y="62" width="18" height="8" fill="' + C.near + '"/>' +
        '<path class="a-flame" d="M180 34c7 10 9 17 4 26h-8c-5-9-3-16 4-26z" fill="' + C.gold + '"/>' +
        '<rect x="0" y="220" width="360" height="40" fill="' + C.near + '"/>';
    },
    slamet: function (id) {
      var rows = "";
      for (var i = 0; i < 5; i++) rows += '<path d="M0 ' + (206 + i * 11) + 'Q180 ' + (198 + i * 11) + ' 360 ' + (208 + i * 11) + '" stroke="#9fb08a" stroke-width="1" fill="none" opacity=".6"/>';
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(285, 64, 18) + clouds(44) +
        cone(10, [168, 66], [192, 64], 350, 210, C.mid, true) +
        '<rect x="0" y="196" width="360" height="64" fill="#57704f"/>' + rows +
        palm(40, 214, 52) + palm(312, 220, 60) +
        '<rect x="0" y="236" width="360" height="24" fill="' + C.near + '"/>';
    },
    palace: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(180, 120, 34) + clouds(40, .4) +
        '<g fill="' + C.near + '"><polygon points="70,190 130,140 230,140 290,190"/><polygon points="130,140 160,104 200,104 230,140"/>' +
        '<polygon points="160,104 172,86 188,86 200,104"/>' +
        '<rect x="96" y="190" width="6" height="40"/><rect x="140" y="190" width="6" height="40"/><rect x="214" y="190" width="6" height="40"/><rect x="258" y="190" width="6" height="40"/>' +
        '<rect x="60" y="228" width="240" height="8"/></g>' +
        palm(30, 236, 80) + palm(332, 236, 70) +
        '<rect x="0" y="236" width="360" height="24" fill="' + C.near + '"/>';
    },
    stupa: function (id) {
      var g = '<g fill="' + C.near + '">';
      g += '<rect x="40" y="212" width="280" height="48"/><rect x="66" y="196" width="228" height="18"/><rect x="92" y="181" width="176" height="17"/><rect x="116" y="167" width="128" height="16"/>';
      [70, 98, 126, 154, 206, 234, 262, 290].forEach(function (x) { g += bell(x, 196, 7); });
      [104, 130, 156, 204, 230, 256].forEach(function (x) { g += bell(x, 181, 6.5); });
      [128, 152, 208, 232].forEach(function (x) { g += bell(x, 167, 6); });
      g += bell(180, 167, 16) + "</g>";
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(92, 92, 20) + clouds(36) +
        cone(150, [246, 70], [262, 72], 360, 190, C.far, true) +
        '<rect x="0" y="160" width="360" height="40" fill="#fff" opacity=".22" class="a-mist"/>' + g +
        palm(14, 246, 66) + palm(346, 250, 74);
    },
    gate: function (id) {
      var L = "40,260 40,206 50,206 50,176 62,176 62,148 74,148 74,122 86,122 86,98 98,98 98,78 110,78 110,62 122,62 122,50 134,50 134,40 152,40 152,260";
      var R = L.split(" ").map(function (p) { var a = p.split(","); return (360 - +a[0]) + "," + a[1]; }).join(" ");
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + clouds(30, .45) + sun(180, 150, 40) + water(196, "#7a8cb6") +
        '<g fill="' + C.near + '"><polygon points="' + L + '"/><polygon points="' + R + '"/></g>' +
        '<g fill="' + C.mid + '" opacity=".9"><rect x="60" y="182" width="70" height="4"/><rect x="230" y="182" width="70" height="4"/><rect x="84" y="110" width="50" height="3"/><rect x="226" y="110" width="50" height="3"/></g>';
    },
    cliff: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(110, 120, 28) + clouds(50, .45) + water(160, "#6f7fac") +
        '<polygon points="200,260 214,170 240,150 300,138 360,132 360,260" fill="' + C.near + '"/>' +
        '<g fill="' + C.near + '"><rect x="300" y="106" width="34" height="30"/><polygon points="294,108 317,86 340,108"/><polygon points="304,88 317,72 330,88"/></g>' +
        palm(250, 152, 40);
    },
    sea: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(70, 70, 20) + clouds(40) + water(150, "#4f7fa6") +
        '<path d="M360 80C320 82 296 96 286 120C276 142 250 150 236 172C222 196 214 220 210 260H360Z" fill="' + C.near + '"/>' +
        '<path d="M360 80C320 82 296 96 286 120C281 131 272 138 264 144C282 128 300 104 360 96Z" fill="#6b8a5c"/>' +
        '<path d="M236 172C244 186 252 196 268 200C252 204 240 214 232 230" fill="none" stroke="#e9dcc4" stroke-width="3" opacity=".8"/>';
    },
    terrace: function (id) {
      var bands = [["#7e9b6f", 150], ["#6a8a60", 170], ["#577a52", 190], ["#466846", 210], ["#38573b", 230]], s = "";
      bands.forEach(function (b, i) {
        var y = b[1];
        s += '<path d="M0 ' + y + 'C80 ' + (y - 16) + ' 140 ' + (y + 14) + ' 220 ' + (y - 6) + 'S330 ' + (y - 14) + ' 360 ' + (y - 2) + 'V260H0Z" fill="' + b[0] + '"/>';
        s += '<path d="M0 ' + (y + 1) + 'C80 ' + (y - 15) + ' 140 ' + (y + 15) + ' 220 ' + (y - 5) + 'S330 ' + (y - 13) + ' 360 ' + (y - 1) + '" fill="none" stroke="#d8e4b8" stroke-width="1.2" opacity=".55"/>';
      });
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(260, 70, 18) + clouds(46) +
        cone(60, [190, 96], [204, 98], 330, 160, C.far, false) + s + palm(70, 182, 70) + palm(300, 200, 82) + palm(330, 210, 60);
    },
    volcano: function (id) {
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + sun(70, 60, 16) +
        '<g class="a-puff" fill="#fff" opacity=".6"><ellipse cx="186" cy="64" rx="14" ry="8"/><ellipse cx="200" cy="50" rx="18" ry="9"/><ellipse cx="220" cy="38" rx="20" ry="9"/></g>' +
        cone(20, [160, 84], [206, 80], 340, 190, C.mid, true) +
        '<path d="M160 84Q183 92 206 80" fill="none" stroke="' + C.near + '" stroke-width="2"/>' +
        water(186, "#7488b2") +
        '<path d="M0 260V206C60 196 110 214 150 222C200 232 240 214 300 220C330 223 350 230 360 232V260Z" fill="' + C.near + '"/>';
    },
    lake: function (id) {
      var meru = function (x, y, n, w0, flip) {
        var s = "", w = w0, yy = y;
        for (var i = 0; i < n; i++) {
          var h = 7;
          var y2 = flip ? yy + h : yy - h;
          s += '<polygon points="' + (x - w) + ',' + yy + ' ' + (x - w * .72) + ',' + y2 + ' ' + (x + w * .72) + ',' + y2 + ' ' + (x + w) + ',' + yy + '"/>';
          yy = flip ? y2 + 2 : y2 - 2; w *= .86;
        }
        return s;
      };
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + clouds(44) +
        cone(-20, [90, 96], [110, 98], 230, 176, C.far, false) + cone(140, [250, 110], [266, 112], 380, 176, C.mid, false) +
        water(176, "#6d84b0") +
        '<g fill="' + C.near + '"><rect x="200" y="168" width="70" height="10"/>' + meru(220, 168, 11, 26, false) + meru(256, 168, 7, 20, false) + "</g>" +
        '<g fill="' + C.near + '" opacity=".28">' + meru(220, 180, 11, 26, true) + meru(256, 180, 7, 20, true) + "</g>";
    },
    wedding: function (id) {
      var k = "";
      for (var y = 20; y < 260; y += 60) for (var x = 20; x < 380; x += 60) {
        k += '<g opacity=".18" fill="#fff"><ellipse cx="' + x + '" cy="' + (y - 14) + '" rx="8" ry="13"/><ellipse cx="' + x + '" cy="' + (y + 14) + '" rx="8" ry="13"/>' +
          '<ellipse cx="' + (x - 14) + '" cy="' + y + '" rx="13" ry="8"/><ellipse cx="' + (x + 14) + '" cy="' + y + '" rx="13" ry="8"/></g>';
      }
      var strands = "";
      [44, 92, 268, 316].forEach(function (x, i) {
        var len = [150, 190, 180, 140][i], f = "";
        for (var y2 = 10; y2 < len; y2 += 13) f += '<circle cx="' + x + '" cy="' + y2 + '" r="4.2"/><circle cx="' + x + '" cy="' + (y2 + 6) + '" r="2.2" fill="#f5e9c8"/>';
        strands += '<g class="a-sway2" style="transform-origin:' + x + 'px 0px;animation-delay:' + (-i * .7) + 's" fill="#fff">' + f + "</g>";
      });
      return '<rect width="360" height="260" fill="url(#s' + id + ')"/>' + k + strands +
        '<g fill="none" stroke="' + C.gold + '" stroke-width="7"><circle cx="164" cy="150" r="34"/><circle cx="198" cy="150" r="34"/></g>' +
        '<g fill="none" stroke="#fff4d8" stroke-width="1.5" opacity=".7"><circle cx="164" cy="150" r="30"/><circle cx="198" cy="150" r="30"/></g>';
    }
  };
  var PAL = {
    wedding: [C.soga, "#b9784a", C.sogaLow],
    home: [C.skyTop, "#a49ac0", "#efb99a"],
    cliff: [C.skyTop, "#a59cc2", "#f0c09f"],
    palace: [C.skyTop, "#a3a3c8", "#f0c6a6"],
    gate: [C.skyTop, "#9fa6c9", "#f2c7a5"]
  };

  window.ART = {
    // 封面輪播：同一個缺角圖框裡放好幾張圖，左右排開（每張寬 360），由 app.js 移動 .cv-slide
    slides: function (names, label) {
      var id = "a" + (++uid), defs = '<clipPath id="c' + id + '"><path d="' + FRAME + '"/></clipPath>', body = "";
      names.forEach(function (name, i) {
        var photo = (window.TRIP && TRIP.photos || {})[name];
        if (!photo) return;
        var top = photo.top || C.skyTop, lq = (window.LQ || {})[photo.src], gid = id + "g" + i;
        // 大字壓進圖框的那一段（約上緣 16%）鋪滿同色，再慢慢淡進畫面，字的下半截才會融進去
        defs += '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset=".3" stop-color="' + top + '"/><stop offset=".62" stop-color="' + top + '" stop-opacity=".45"/><stop offset="1" stop-color="' + top + '" stop-opacity="0"/></linearGradient>';
        if (lq && i === 0) defs += '<filter id="' + id + 'b" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="7" edgeMode="duplicate"/></filter>';
        body += '<g class="cv-slide" data-i="' + i + '" style="transform:translateX(' + (i ? 360 : 0) + 'px)">' +
          (lq && i === 0 ? '<image href="' + lq + '" width="360" height="260" preserveAspectRatio="xMidYMid slice" filter="url(#' + id + 'b)"/>' : "") +
          '<image class="fade" href="' + photo.src + '" width="360" height="260" preserveAspectRatio="xMidYMid slice"/>' +
          (i ? '<rect width="360" height="140" fill="url(#' + gid + ')"/>' : '<rect width="360" height="110" fill="url(#' + gid + 'o)"/>') + "</g>";
        if (!i) defs += '<linearGradient id="' + gid + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset=".35" stop-color="' + top + '" stop-opacity=".55"/><stop offset="1" stop-color="' + top + '" stop-opacity="0"/></linearGradient>';
      });
      return '<svg class="art" viewBox="0 0 360 260" role="img" aria-label="' + (label || "") + '" preserveAspectRatio="xMidYMax slice"><defs>' + defs + "</defs>" +
        '<g clip-path="url(#c' + id + ')"><rect width="360" height="260" fill="' + C.skyTop + '"/>' + body + "</g></svg>";
    },
    // 大字的顏色：有插畫就用插畫自己的天空色，字和天空才接得起來
    topColor: function (name) { var ph = (window.TRIP && TRIP.photos || {})[name]; return (ph && ph.top) || (PAL[name] || [C.skyTop])[0]; },
    svg: function (name, label, plain) {
      var id = "a" + (++uid);
      var photo = (window.TRIP && TRIP.photos || {})[name];
      var p = PAL[name] || [];
      var body;
      if (photo) {
        // 照片：上緣漸層成大字的顏色，讓字看起來融進圖裡
        var top = photo.top || p[0] || C.skyTop;
        // 先墊一張模糊的小預覽（lq.js），清楚的大圖載完再淡入（app.js 的 fadeIn）
        var lq = (window.LQ || {})[photo.src];
        body = (lq ? '<image href="' + lq + '" x="0" y="0" width="360" height="260" preserveAspectRatio="xMidYMid slice" filter="url(#b' + id + ')"/>' : "") +
          '<image class="a-kb fade" href="' + photo.src + '" x="0" y="0" width="360" height="260" preserveAspectRatio="xMidYMid slice"' +
          (photo.focus ? ' style="transform-origin:' + photo.focus + '"' : "") + "/>" +
          (plain ? '<rect width="360" height="260" fill="url(#g' + id + ')" opacity=".55"/>' : '<rect width="360" height="110" fill="url(#g' + id + ')"/>');
        var grad = '<linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset=".35" stop-color="' + top + '" stop-opacity=".55"/><stop offset="1" stop-color="' + top + '" stop-opacity="0"/></linearGradient>';
        if (plain) grad = '<linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#151a2b" stop-opacity="0"/><stop offset="1" stop-color="#151a2b" stop-opacity=".85"/></linearGradient>';
        if (lq) grad += '<filter id="b' + id + '" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="7" edgeMode="duplicate"/></filter>';
        body = "<defs>" + grad + "</defs>" + body;
      } else {
        body = (SCENES[name] || SCENES.plane)(id);
      }
      return '<svg class="art" viewBox="0 0 360 260" role="img" aria-label="' + (label || name) + '" preserveAspectRatio="xMidYMax slice">' +
        "<defs>" + sky(id, p[0], p[1], p[2]) + (plain ? "" : '<clipPath id="c' + id + '"><path d="' + FRAME + '"/></clipPath>') + "</defs>" +
        (plain ? "<g>" : '<g clip-path="url(#c' + id + ')">') + body + "</g></svg>";
    }
  };
})();
