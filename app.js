(function () {
  "use strict";
  var T = window.TRIP, ART = window.ART;
  var LANGS = ["zh", "id", "en"];
  var lang = "zh";
  try { var saved = localStorage.getItem("trip-lang"); if (LANGS.indexOf(saved) >= 0) lang = saved; } catch (e) {}
  // 動畫一律開啟（使用者決定拿掉開關，也不跟系統的「減少動態效果」）
  document.documentElement.classList.add("motion");
  try { localStorage.removeItem("trip-motion"); } catch (e) {} // 以前開關留下的紀錄

  // 顏色：跟手機 / 淺色 / 深色，存在這支手機上
  var THEMES = ["auto", "light", "dark"];
  var theme = "auto";
  try { var savedTheme = localStorage.getItem("trip-theme"); if (THEMES.indexOf(savedTheme) >= 0) theme = savedTheme; } catch (e) {}
  function applyTheme() {
    var root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]'); // 手機瀏覽器網址列的顏色
    if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--paper").trim() || "#e9e7e2");
  }
  applyTheme();
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) {}
  var prefsOpen = false; // 右上角選單是否打開

  // 介面文字
  var UI = {
    open: ["打開行程", "Buka jadwal", "Open the trip"],
    today: ["看今天行程", "Jadwal hari ini", "Today's plan"],
    countdown: ["還有 {n} 天出發", "{n} hari lagi berangkat", "{n} days to go"],
    coverSub: ["一家五口的印尼行程", "Perjalanan keluarga ke Indonesia", "A family trip to Indonesia"],
    madeFor: ["made for 桌桌's family", "made for 桌桌's family", "made for 桌桌's family"],
    back: ["返回", "Kembali", "Back"],
    prefs: ["設定", "Pengaturan", "Settings"],
    langLabel: ["語言", "Bahasa", "Language"],
    themeLabel: ["顏色", "Tampilan", "Appearance"],
    themeAuto: ["跟手機", "Ikuti HP", "Auto"],
    themeLight: ["淺色", "Terang", "Light"],
    themeDark: ["深色", "Gelap", "Dark"],
    home: ["封面", "Sampul", "Cover"],
    days: ["每日行程", "Jadwal harian", "Daily plan"],
    daysSub: ["18 天，一天一頁", "18 hari, satu hari satu halaman", "18 days, one page each"],
    food: ["餐廳清單", "Tempat makan", "Restaurants"],
    foodSub: ["雅加達・普禾加多・日惹・峇里島", "Jakarta · Purwokerto · Yogyakarta · Bali", "Jakarta · Purwokerto · Yogyakarta · Bali"],
    stay: ["住宿", "Penginapan", "Where we stay"],
    staySub: ["四間飯店和 villa", "Empat hotel & villa", "Four hotels and villas"],
    info: ["旅遊資料", "Info perjalanan", "Travel info"],
    infoSub: ["時差・入境・緊急電話・機票火車", "Waktu · masuk · darurat · tiket", "Time · entry · emergency · tickets"],
    learn: ["學一點印尼文", "Belajar bahasa Indonesia", "Learn some Indonesian"],
    learnSub: ["附中文唸法", "Dengan cara baca Mandarin", "With Chinese pronunciation"],
    moneySub: ["印尼盾和台幣互換", "Rupiah ke dolar Taiwan", "Rupiah ↔ Taiwan dollar"],
    packSub: ["出發前勾一勾", "Centang sebelum berangkat", "Tick off before you go"],
    mChecked: ["已勾", "Dicentang", "Ticked"],
    map: ["地圖", "Peta", "Map"],
    driver: ["給司機看", "Tunjukkan ke sopir", "Show the driver"],
    nav: ["導航", "Rute", "Route"],
    goTo: ["到 ", "Ke ", "To "],
    car: ["開車約", "Mobil sekitar", "Drive about"],
    walk: ["走路約", "Jalan kaki sekitar", "Walk about"],
    min: ["分", "menit", "min"],
    hr: ["小時", "jam", "hr"],
    prev: ["前一天", "Sebelumnya", "Previous"],
    next: ["後一天", "Berikutnya", "Next"],
    flight: ["航班", "Pesawat", "Flight"],
    train: ["火車", "Kereta", "Train"],
    boat: ["快艇", "Kapal", "Boat"],
    staytag: ["住宿", "Inap", "Stay"],
    wedding: ["婚禮", "Nikah", "Wedding"],
    takeMe: ["請帶我到這裡", "Tolong antar saya ke sini", "Please take me here"],
    close: ["關閉", "Tutup", "Close"],
    openMap: ["打開地圖", "Buka peta", "Open map"],
    tzJava: ["比台灣慢 1 小時", "1 jam lebih lambat dari Taiwan", "1 hour behind Taiwan"],
    tzBali: ["跟台灣同時間", "Sama dengan waktu Taiwan", "Same time as Taiwan"],
    tzTw: ["台灣時間", "Waktu Taiwan", "Taiwan time"],
    phone: ["電話", "Telepon", "Phone"],
    host: ["房東", "Tuan rumah", "Host"],
    copy: ["複製", "Salin", "Copy"],
    copied: ["已複製", "Tersalin", "Copied"],
    timeTitle: ["時差", "Zona waktu", "Time difference"],
    moneyTitle: ["印尼盾換算", "Kalkulator rupiah", "Rupiah converter"],
    moneyRule: ["快速心算：印尼盾去掉三個 0，再乘以 1.8 ≈ 台幣", "Cara cepat: 1.000 rupiah ≈ NT$1,8", "Quick math: drop three zeros, × 1.8 ≈ NT$"],
    moneyAsOf: ["匯率 1 台幣 ≈ {r} 印尼盾（{d} 參考值，出發前再確認）", "Kurs NT$1 ≈ Rp{r} (acuan {d}, cek lagi sebelum berangkat)", "Rate NT$1 ≈ Rp{r} ({d} reference, check before you go)"],
    idr: ["印尼盾", "Rupiah", "Rupiah"],
    twd: ["台幣", "NT$", "NT$"],
    entryTitle: ["入境", "Masuk Indonesia", "Entry"],
    emergTitle: ["緊急電話", "Nomor darurat", "Emergency numbers"],
    ticketTitle: ["機票和火車", "Tiket pesawat & kereta", "Flights & trains"],
    packTitle: ["行李清單", "Daftar barang bawaan", "Packing list"],
    packNote: ["勾選只存在這支手機上", "Centang hanya tersimpan di HP ini", "Ticks are saved on this phone only"],
    learnNote: ["唸法是用中文字大概拼的，聽起來像就好", "Cara baca ditulis dengan huruf Mandarin, kira-kira saja", "Pronunciation spelled with Chinese characters, roughly"],
    mTrip: ["旅程", "Trip", "Trip"], mDate: ["日期", "Tanggal", "Date"], mDays: ["天數", "Hari", "Days"], mNo: ["編號", "No.", "No."],
    mDay: ["第幾天", "Hari ke", "Day"], mCity: ["城市", "Kota", "City"], mTime: ["時間", "Waktu", "Time"],
    mPages: ["頁數", "Halaman", "Pages"], mPlaces: ["地點", "Tempat", "Places"], mItems: ["項目", "Item", "Items"],
    indonesia: ["印尼", "Indonesia", "Indonesia"],
    photoTitle: ["關於插畫", "Tentang ilustrasi", "About the illustrations"],
    artNote: ["每天的插畫都是 AI（OpenAI Codex）畫的，只是示意，建築和風景的細節不一定跟實景一樣。", "Semua ilustrasi dibuat oleh AI (OpenAI Codex), hanya gambaran; detail bangunan dan pemandangan bisa berbeda dari aslinya.", "All illustrations were made by AI (OpenAI Codex) and are only impressions; details may differ from the real places."]
  };
  var WEEK = [
    ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  ];

  function L(x) {
    if (x == null) return "";
    if (typeof x === "string") return x;
    return x[LANGS.indexOf(lang)] || x[0];
  }
  function u(k) { return L(UI[k]); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function place(k) { return T.places[k]; }
  function mapUrl(k) {
    var p = place(k);
    return p.map || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.q);
  }
  function dirUrl(a, b, mode) {
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(place(a).q) +
      "&destination=" + encodeURIComponent(place(b).q) + "&travelmode=" + (mode === "walk" ? "walking" : "driving");
  }
  function dur(m) {
    function one(n) {
      if (n < 60) return n + " " + u("min");
      var h = Math.floor(n / 60), r = n % 60;
      return h + " " + u("hr") + (r ? " " + r + " " + u("min") : "");
    }
    return Array.isArray(m) ? m[0] + "–" + one(m[1]) : one(m);
  }
  function dayId(d) { return "d" + d.date.slice(5, 7) + d.date.slice(8, 10); }
  function parseDate(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function md(d) { var x = parseDate(d.date); return (x.getMonth() + 1) + "/" + x.getDate(); }
  function dm(d) { return d.date.slice(8, 10) + "." + d.date.slice(5, 7); }
  function wk(d) { return WEEK[LANGS.indexOf(lang)][parseDate(d.date).getDay()]; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function todayStr() { var n = new Date(); return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate()); }
  function tzNote(city) { return city === "bali" ? u("tzBali") : city === "tw" ? u("tzTw") : u("tzJava"); }
  function tzCode(city) { return city === "bali" ? "WITA" : city === "tw" ? "CST" : "WIB"; }

  // ---------- 小圖示與裝飾 ----------
  // car / train / flight / boat / walk 由 Codex 重畫（2026/10/30）
  var ICON = {
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 17.2H3.7a.7.7 0 0 1-.7-.7V13q0-1.2 1.2-1.2l1.7-3.3q.7-1.4 2.3-1.4h3.4q1.4 0 2.4 1.2l2.7 3.5 2.6.6q1.7.4 1.7 2.2v1.8q0 .8-.8.8h-.5M8.9 17.2h6.4M4.2 11.8h12.5"/><circle cx="6.7" cy="17.2" r="2.2"/><circle cx="17.5" cy="17.2" r="2.2"/></g></svg>',
    walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.2" cy="4.5" r="1.8" fill="currentColor"/><path d="m12.2 8.3-1.2 5.6 4.2 3.1 1.3 4M11 13.9l-2.7 4.5-2.8 2.1M12.2 8.3l3.4 3.2h2.8M12.2 8.3l-3.4 2.2-1.3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.4 3.7c.8-.8 2-1 2.8-.2s.6 2-.2 2.8l-4 4 1.4 8.1-1.9 1.9-3.2-6.2-3.6 3.2.4 2.7-1.3 1-1.9-3.5-3-1.8 1.1-1.3 2.7.4 3.2-3.6-6.2-3.2 1.9-1.9 7.8 1.6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    train: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.2" width="14" height="14.4" rx="3.4"/><path d="M5 10.5h14M8 20.8l2-3.2m6 3.2-2-3.2"/></g><circle cx="9" cy="13.9" r="1" fill="currentColor"/><circle cx="15" cy="13.9" r="1" fill="currentColor"/></svg>',
    boat: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13.5h18l-2.3 3.2q-.8 1.1-2.4 1.1H7q-2 0-2.8-1.9L3 13.5ZM6 13.5v-6h7l3.8 6M6 10.5h8.9M3 20q2.25-1.4 4.5 0t4.5 0 4.5 0 4.5 0"/></g></svg>',
    stay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19V7M3 14h18v5M21 14v-2a3 3 0 0 0-3-3h-7v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="11" r="1.8" fill="currentColor"/></svg>',
    wedding: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.1" fill="currentColor"/></svg>'
  };
  var STAR = '<svg class="star" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 0L26.6 19 40.9 7.1 29 21.4 48 24 29 26.6 40.9 40.9 26.6 29 24 48 21.4 29 7.1 40.9 19 26.6 0 24 19 21.4 7.1 7.1 21.4 19Z" fill="currentColor"/></svg>';
  var SPARK = '<svg class="spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" fill="currentColor"/></svg>';
  function flower(petals) {
    var s = "";
    for (var i = 0; i < petals; i++) s += '<ellipse cx="12" cy="6" rx="3.4" ry="6" transform="rotate(' + (360 / petals * i) + ' 12 12)"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' + s + '<circle cx="12" cy="12" r="2.2" fill="var(--paper)"/></svg>';
  }
  function flowers() {
    return '<div class="flowers" aria-hidden="true"><span class="dash"></span>' + flower(4) + flower(8) + flower(4) + '<span class="dash"></span></div>';
  }
  function barcode(str) {
    var bars = "", x = 0;
    for (var i = 0; x < 116 && i < 200; i++) {
      var c = str.charCodeAt(i % str.length) + i * 7;
      var w = 1 + (c % 3), gap = 1 + ((c >> 2) % 3);
      bars += '<rect x="' + x + '" width="' + w + '" height="26"/>';
      x += w + gap;
    }
    return '<svg class="barcode" viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true" fill="currentColor">' + bars + "</svg>";
  }
  function posterTop(code) {
    return '<div class="ptop r">' + STAR + barcode(code) + "</div>";
  }
  function meta(pairs) {
    return '<dl class="meta r">' + pairs.map(function (p) {
      return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>";
    }).join("") + "</dl>";
  }
  // 內頁用的一行小字（取代星星、條碼、四欄資料）
  function kicker(items, raw) { // raw：內容是自己組好的 HTML，不再跳脫
    return '<p class="kicker r">' + items.map(function (x) { return "<span>" + (raw ? x : esc(x)) + "</span>"; }).join("") + "</p>";
  }
  function word(w, color) {
    var letters = Array.from(w).map(function (c, i) { return '<span style="--i:' + i + '">' + esc(c) + "</span>"; }).join("");
    // 有往下長的字母（j g p q y）時多留一點底部空間，才不會壓到下面的線和圖
    return '<p class="hw' + (/[gjpqy]/.test(w) ? " has-desc" : "") + '" aria-hidden="true"' + (color ? ' style="color:' + color + '"' : "") + '><span class="hw-in">' + letters + "</span></p>";
  }
  function hero(w, art, overlay) {
    return '<section class="hero r">' + word(w, ART.topColor(art)) +
      '<div class="hero-art">' + ART.svg(art, w) + (overlay ? '<div class="hero-over">' + overlay + "</div>" : "") + "</div></section>";
  }

  // ---------- 外框 ----------
  // 右上角的漢堡選單：語言和顏色
  var BURGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function seg(attr, items, cur, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '">' + items.map(function (it) {
      return '<button type="button" ' + attr + '="' + it[0] + '" aria-pressed="' + (it[0] === cur) + '">' + esc(it[1]) + "</button>";
    }).join("") + "</div>";
  }
  function prefs() {
    var names = ["中", "ID", "EN"];
    return '<div class="prefs' + (prefsOpen ? " is-open" : "") + '">' +
      '<button type="button" class="prefs-btn" data-prefs="1" aria-expanded="' + prefsOpen + '" aria-label="' + esc(u("prefs")) + '">' + BURGER + "</button>" +
      '<div class="prefs-pop"' + (prefsOpen ? "" : " hidden") + ">" +
      '<p class="prefs-h">' + esc(u("langLabel")) + "</p>" + seg("data-lang", LANGS.map(function (l, i) { return [l, names[i]]; }), lang, u("langLabel")) +
      '<p class="prefs-h">' + esc(u("themeLabel")) + "</p>" +
      seg("data-theme-pick", [["auto", u("themeAuto")], ["light", u("themeLight")], ["dark", u("themeDark")]], theme, u("themeLabel")) +
      "</div></div>";
  }
  function setPrefsOpen(open) {
    prefsOpen = open;
    document.querySelectorAll(".prefs").forEach(function (p) {
      p.classList.toggle("is-open", open);
      p.querySelector(".prefs-btn").setAttribute("aria-expanded", open);
      p.querySelector(".prefs-pop").hidden = !open;
    });
  }
  function bar(label, backTo) {
    return '<header class="bar"><div class="bar-in">' +
      '<a class="back" href="#' + backTo + '">' + ICON.left + "<span>" + esc(backTo === "home" ? u("home") : u("back")) + "</span></a>" +
      '<span class="bar-label">' + esc(label) + "</span>" + prefs() + "</div></header>";
  }

  // ---------- 封面 ----------
  function todayDay() { var t = todayStr(); return T.days.filter(function (d) { return d.date === t; })[0]; }
  function viewHome() {
    var t = todayStr(), td = todayDay(), extra = "";
    if (td) extra = '<a class="btn btn-line" href="#' + dayId(td) + '">' + esc(u("today")) + ICON.arrow + "</a>";
    else if (t < T.start) extra = '<p class="count">' + SPARK + esc(u("countdown").replace("{n}", Math.round((parseDate(T.start) - parseDate(t)) / 86400000))) + "</p>";
    var route = ["tw", "jkt", "pwt", "yk", "bali", "tw"].map(function (c) { return "<li>" + esc(L(T.cities[c])) + "</li>"; }).join("");
    var over = '<p class="by">' + esc(u("madeFor")) + "</p>" + flowers();
    return '<main class="wrap cover">' +
      '<div class="cover-bar r">' + STAR + prefs() + "</div>" +
      meta([[u("mTrip"), u("indonesia")], [u("mDate"), "14–31.12"], [u("mDays"), "18"], [u("mNo"), "#2026"]]) +
      hero("jalan²", "stupa", over) +
      '<section class="cover-body r"><p class="vert" aria-hidden="true">印尼之旅・二〇二六</p>' +
      '<div class="cover-main"><h1 class="cover-title">' + esc(L(T.title)) + "</h1>" +
      '<p class="cover-sub">' + esc(u("coverSub")) + "</p>" +
      '<ol class="route">' + route + "</ol>" +
      '<div class="cover-actions"><a class="btn btn-ink" href="#menu">' + esc(u("open")) + ICON.arrow + "</a>" + extra + "</div></div></section>" +
      '<footer class="pfoot r"><span>2026</span><span>Jakarta · Purwokerto · Yogyakarta · Bali</span><span>' + SPARK + "</span></footer>" +
      "</main>";
  }

  // ---------- 主選單 ----------
  function sec(title, body) { return '<section class="sec r"><h2 class="sec-h">' + SPARK + esc(title) + "</h2>" + body + "</section>"; }
  // 匯率換算和行李清單：選單頁的最後兩個按鈕，各自一頁
  function moneyTool() {
    var r = T.rate.twd;
    return sec(u("moneyTitle"), '<div class="conv">' +
      '<label for="idr">' + esc(u("idr")) + '</label><input id="idr" inputmode="numeric" autocomplete="off" value="100.000">' +
      '<label for="twd">' + esc(u("twd")) + '</label><input id="twd" inputmode="decimal" autocomplete="off">' +
      '<div class="quick">' + [10000, 50000, 100000, 500000].map(function (v) { return '<button type="button" data-idr="' + v + '">' + v.toLocaleString("id-ID") + "</button>"; }).join("") + "</div>" +
      '<p class="fine">' + esc(u("moneyRule")) + '</p><p class="fine">' + esc(u("moneyAsOf").replace("{r}", r).replace("{d}", T.rate.asOf)) + "</p></div>");
  }
  function packTool() {
    var checked = {};
    try { checked = JSON.parse(localStorage.getItem("trip-pack") || "{}"); } catch (e) {}
    return sec(u("packTitle"), '<ul class="list checks">' + T.packing.map(function (p, i) {
      return '<li><label><input type="checkbox" id="pk' + i + '" data-pack="' + i + '"' + (checked[i] ? " checked" : "") + "><span>" + esc(L(p)) + "</span></label></li>";
    }).join("") + '</ul><p class="fine">' + esc(u("packNote")) + "</p>");
  }
  function viewMenu() {
    var td = todayDay();
    var rows = [["days", "days", "daysSub"], ["food-jkt", "food", "foodSub"], ["stay", "stay", "staySub"], ["info", "info", "infoSub"], ["learn", "learn", "learnSub"],
      ["money", "moneyTitle", "moneySub"], ["pack", "packTitle", "packSub"]];
    if (td) rows.unshift([dayId(td), "today", null, md(td) + " " + L(td.title)]);
    return bar("No.#00", "home") + '<main class="wrap">' + posterTop("DAFTAR") +
      meta([[u("mTrip"), u("indonesia")], [u("mPages"), "07"], [u("mDays"), "18"]]) +
      '<section class="tword r">' + word("daftar") + "</section>" +
      '<nav class="menu">' + rows.map(function (x) {
        return '<a class="mrow r' + (x[1] === "today" ? " is-today" : "") + '" href="#' + x[0] + '">' + SPARK +
          '<span class="mrow-t"><b>' + esc(u(x[1])) + "</b><small>" + esc(x[3] || u(x[2])) + "</small></span>" + ICON.arrow + "</a>";
      }).join("") + "</nav>" + flowers() + "</main>";
  }

  // ---------- 日期列表 ----------
  var CITY_ART = { tw: "plane", jkt: "city", pwt: "slamet", yk: "stupa", bali: "gate" };
  function viewDays() {
    var t = todayStr(), html = "", last = null, n = 0;
    T.days.forEach(function (d) {
      n++;
      if (d.city !== last) {
        if (last !== null) html += "</ol></section>";
        html += '<section class="cityblock r"><div class="strip">' + ART.svg(CITY_ART[d.city], d.city, true) +
          '<h2 class="strip-name">' + esc(L(T.cities[d.city])) + "</h2></div><ol class=\"daylist\">";
        last = d.city;
      }
      html += '<li><a class="dayrow' + (d.wedding ? " is-wedding" : "") + (d.date === t ? " is-today" : "") + '" href="#' + dayId(d) + '">' +
        '<span class="dr-no">' + pad(n) + "</span>" +
        '<span class="dr-date"><b>' + dm(d) + "</b><small>" + esc(wk(d)) + "</small></span>" +
        '<span class="dr-title">' + esc(L(d.title)) + "</span>" + ICON.arrow + "</a></li>";
    });
    return bar("No.#01", "menu") + '<main class="wrap">' +
      kicker(["14.12 – 31.12", u("mDays") + " 18", u("mCity") + " 4"]) +
      '<section class="tword r">' + word("jadwal") + "</section>" + html + "</ol></section></main>";
  }

  // ---------- 單日 ----------
  function goBlock(it) {
    var g = it.go, mode = g[0], from = g[3], to = g[4];
    var link = from && to ? '<a class="go-nav" href="' + esc(dirUrl(from, to, mode)) + '" target="_blank" rel="noopener">' + esc(u("nav")) + ICON.arrow + "</a>" : "";
    return '<li class="go r"><div class="go-rail" aria-hidden="true"></div><div class="go-main"><div class="go-body">' +
      '<span class="go-ic">' + ICON[mode] + "</span>" +
      // 小字：距離 · 要去哪（有自訂說明就用說明）
      '<span class="go-txt"><b>' + esc(u(mode) + " " + dur(g[1])) + '</b><small><span class="go-km">' + esc(g[2]) + "</span> · " +
      esc(it.label ? L(it.label) : to ? u("goTo") + place(to).n : "") + "</small></span>" + link + "</div>" +
      (it.note ? '<p class="go-note">' + esc(L(it.note)) + "</p>" : "") +
      (it.warn ? '<p class="warn">' + ICON.warn + "<span>" + esc(L(it.warn)) + "</span></p>" : "") + "</div></li>";
  }
  function linkHtml(l) {
    var href = l[0].indexOf("http") === 0 ? l[0] : "#" + l[0];
    var ext = href[0] !== "#" ? ' target="_blank" rel="noopener"' : "";
    return '<a class="lnk" href="' + esc(href) + '"' + ext + ">" + esc(L(l[1])) + ICON.arrow + "</a>";
  }
  // 地圖是右上角的小圓圖示（外層要加 has-map），給司機看是主要按鈕
  function mapBtn(k) {
    return '<a class="map-ic" href="' + esc(mapUrl(k)) + '" target="_blank" rel="noopener" aria-label="' + esc(u("map")) + '" title="' + esc(u("map")) + '">' + ICON.pin + "</a>";
  }
  function placeActions(k) {
    return '<div class="acts"><button type="button" class="act act-driver" data-driver="' + k + '">' + esc(u("driver")) + "</button></div>";
  }
  function card(it) {
    var chip = it.kind ? '<em class="chip chip-' + it.kind + '">' + ICON[it.kind] + esc(u(it.kind === "stay" ? "staytag" : it.kind)) + "</em>" : "";
    var p = it.place ? place(it.place) : null;
    var h = '<li class="ev r"><div class="ev-time">' + esc(it.time || "·") + "</div>" +
      '<article class="ev-card' + (it.kind ? " k-" + it.kind : "") + (p ? " has-map" : "") + '">' + (p ? mapBtn(it.place) : "") + (chip ? '<div class="ev-chips">' + chip + "</div>" : "") +
      '<h3 class="ev-t">' + esc(L(it.t)) + "</h3>" +
      (p ? '<p class="ev-place">' + esc(p.n) + "</p>" : "") +
      (it.note ? '<p class="ev-note">' + esc(L(it.note)) + "</p>" : "") +
      (it.warn ? '<p class="warn">' + ICON.warn + "<span>" + esc(L(it.warn)) + "</span></p>" : "");
    if (it.options) {
      h += '<ul class="opts">' + it.options.map(function (o) {
        var op = place(o.place);
        return '<li class="opt has-map">' + mapBtn(o.place) + '<div class="opt-head"><b>' + esc(op.n) + "</b><em>" + esc(L(o.tag)) + "</em></div>" +
          '<div class="opt-go">' + ICON[o.go[0]] + esc(u(o.go[0]) + " " + dur(o.go[1]) + " · " + o.go[2]) + "</div>" + placeActions(o.place) + "</li>";
      }).join("") + "</ul>";
    }
    if (it.place) h += placeActions(it.place);
    if (it.links) h += '<div class="lnks">' + it.links.map(linkHtml).join("") + "</div>";
    return h + "</article></li>";
  }
  function viewDay(d) {
    var i = T.days.indexOf(d), prev = T.days[i - 1], next = T.days[i + 1];
    var items = d.items.map(function (it) { return it.go ? goBlock(it) : card(it); }).join("");
    var pager = '<nav class="pager r">' +
      (prev ? '<a href="#' + dayId(prev) + '">' + ICON.left + "<span><small>" + esc(u("prev")) + "</small>" + dm(prev) + "</span></a>" : "<span></span>") +
      (next ? '<a class="pg-next" href="#' + dayId(next) + '"><span><small>' + esc(u("next")) + "</small>" + dm(next) + "</span>" + ICON.chev + "</a>" : "<span></span>") + "</nav>";
    return bar("No.#" + pad(i + 1) + " / 18", "days") + '<main class="wrap' + (d.wedding ? " is-wedding" : "") + '">' +
      kicker([pad(i + 1) + "/18", dm(d) + " " + wk(d), L(T.cities[d.city]), tzCode(d.city)]) +
      hero(d.word, d.art) +
      '<section class="day-head r"><h1 class="dh-title">' + esc(L(d.title)) + "</h1>" +
      '<p class="dh-tz">' + SPARK + esc(tzNote(d.city)) + "</p></section>" + flowers() +
      '<ol class="flow">' + items + "</ol>" + pager + "</main>";
  }

  // ---------- 餐廳 ----------
  function viewFood(id) {
    var cur = T.food.filter(function (f) { return f.id === id; })[0] || T.food[0];
    var count = 0; cur.groups.forEach(function (g) { count += g.items.length; });
    var tabs = '<div class="tabs r" role="tablist">' + T.food.map(function (f) {
      return '<a role="tab" href="#food-' + f.id + '" aria-selected="' + (f === cur) + '">' + esc(L(T.cities[f.city])) + "</a>";
    }).join("") + "</div>";
    var groups = cur.groups.map(function (g) {
      return '<h2 class="sec-h r">' + SPARK + esc(L(g.name)) + '</h2><ul class="list r">' + g.items.map(function (r) {
        return '<li><a class="row" href="' + esc(r[2]) + '" target="_blank" rel="noopener"><span class="row-main"><b>' + esc(r[0]) + "</b>" +
          (r[1] ? "<small>" + esc(L(r[1])) + "</small>" : "") + '</span><span class="row-act">' + ICON.pin + esc(u("map")) + "</span></a></li>";
      }).join("") + "</ul>";
    }).join("");
    return bar("No.#02", "menu") + '<main class="wrap">' +
      '<div class="keep">' + kicker([L(T.cities[cur.city]), u("mPlaces") + " " + pad(count)]) +
      '<section class="tword r">' + word("makan") + "</section>" + tabs + "</div>" + groups + "</main>";
  }

  // ---------- 住宿 ----------
  function viewStay() {
    return bar("No.#03", "menu") + '<main class="wrap">' +
      kicker(["15.12 – 31.12", u("mPlaces") + " 04"]) +
      '<section class="tword r">' + word("menginap") + '</section><ul class="stays">' + T.stays.map(function (s) {
        var p = place(s.place);
        return '<li class="stay r"><div class="strip strip-s">' + ART.svg(CITY_ART[s.city], s.city, true) + '<p class="strip-name">' + esc(L(T.cities[s.city])) + "</p></div>" +
          '<div class="stay-body has-map">' + mapBtn(s.place) + '<p class="stay-when">' + esc(L(s.nights)) + "</p>" +
          '<h2 class="stay-name">' + esc(p.n) + '</h2><p class="stay-area">' + esc(p.a) + "</p>" +
          (s.inout ? '<p class="stay-meta">' + esc(L(s.inout)) + "</p>" : "") +
          (s.host ? '<p class="stay-meta">' + esc(u("host")) + "：" + esc(s.host) + "</p>" : "") +
          (s.phone ? '<p class="stay-meta">' + esc(u("phone")) + '：<span class="sel">' + esc(s.phone) + "</span></p>" : "") +
          placeActions(s.place) + "</div></li>";
      }).join("") + "</ul></main>";
  }

  // ---------- 旅遊資料 ----------
  var ENTRY = [
    [["電子落地簽 e-VOA", "e-VOA (Visa on Arrival elektronik)", "e-VOA (electronic visa on arrival)"],
     ["台灣護照要簽證。出發前到印尼移民署官網 evisa.imigrasi.go.id 線上辦，目前 50 萬印尼盾，可停留 30 天。小心假網站。",
      "Paspor Taiwan wajib visa. Ajukan di evisa.imigrasi.go.id sebelum berangkat, saat ini Rp500.000, berlaku 30 hari.",
      "Taiwan passports need a visa. Apply at evisa.imigrasi.go.id before the trip, currently Rp500,000 for 30 days. Beware of fake sites."]],
    [["峇里島觀光稅", "Pungutan wisatawan Bali", "Bali tourist levy"],
     ["進峇里島每人 15 萬印尼盾，可以先在 lovebali.baliprov.go.id 線上付。",
      "Rp150.000 per orang, bisa dibayar di lovebali.baliprov.go.id.",
      "Rp150,000 per person, payable online at lovebali.baliprov.go.id."]],
    [["入境申報", "Deklarasi kedatangan", "Arrival declaration"],
     ["印尼現在要線上填入境和海關申報（All Indonesia），出發前三天內填。出發前再確認一次規定。",
      "Isi deklarasi kedatangan online (All Indonesia) maksimal 3 hari sebelum tiba. Cek lagi aturannya.",
      "Indonesia now uses an online arrival and customs form (All Indonesia), filled within 3 days of arrival. Double-check before you go."]]
  ];
  var EMERG = [
    ["112", ["印尼緊急電話（警察、救護、消防）", "Darurat umum", "General emergency"]],
    ["110", ["警察", "Polisi", "Police"]],
    ["118 / 119", ["救護車", "Ambulans", "Ambulance"]],
    ["0811-984-676", ["駐印尼台北經濟貿易代表處（急難救助）", "Kantor Dagang Taipei (darurat)", "Taipei Economic & Trade Office (emergencies)"]],
    ["021-515-3939", ["駐印尼代表處（一般業務，上班時間）", "Kantor Dagang Taipei (umum)", "Taipei office (general, office hours)"]]
  ];
  function viewInfo() {
    var time = sec(u("timeTitle"), '<ul class="list kv">' +
      "<li><b>" + esc(L(T.cities.jkt) + "・" + L(T.cities.pwt) + "・" + L(T.cities.yk)) + "</b><span>WIB · " + esc(u("tzJava")) + "</span></li>" +
      "<li><b>" + esc(L(T.cities.bali)) + "</b><span>WITA · " + esc(u("tzBali")) + "</span></li></ul>");
    var entry = sec(u("entryTitle"), '<ul class="list">' + ENTRY.map(function (e) {
      return '<li class="para"><b>' + esc(L(e[0])) + "</b><p>" + esc(L(e[1])) + "</p></li>";
    }).join("") + "</ul>");
    var emerg = sec(u("emergTitle"), '<ul class="list">' + EMERG.map(function (e) {
      return '<li class="phone-row"><span><b class="sel">' + esc(e[0]) + "</b><small>" + esc(L(e[1])) + '</small></span><button type="button" class="copy" data-copy="' + esc(e[0].split(" ")[0]) + '">' + esc(u("copy")) + "</button></li>";
    }).join("") + "</ul>");
    var tickets = sec(u("ticketTitle"), '<ul class="list tickets">' + T.tickets.map(function (k) {
      return '<li class="tk"><span class="tk-ic">' + ICON[k.kind] + '</span><span><b>' + esc(k.date + "　" + L(k.t)) + "</b><small>" + esc(L(k.d)) + "</small></span></li>";
    }).join("") + "</ul>");
    var credits = "";
    if (Object.keys(T.photos || {}).length) credits = sec(u("photoTitle"), '<p class="fine">' + esc(u("artNote")) + "</p>");
    return bar("No.#04", "menu") + '<main class="wrap">' +
      kicker(["WIB / WITA", u("mItems") + " 04"]) +
      '<section class="tword r">' + word("info") + "</section>" + time + entry + emerg + tickets + credits + "</main>";
  }

  // ---------- 學印尼文 ----------
  function viewMoney() {
    return bar("No.#06", "menu") + '<main class="wrap">' +
      kicker(["IDR → TWD", "1 : " + T.rate.twd]) +
      '<section class="tword r">' + word("rupiah") + "</section>" + moneyTool() + flowers() + "</main>";
  }
  function packCount() {
    var c = {}, n = 0;
    try { c = JSON.parse(localStorage.getItem("trip-pack") || "{}"); } catch (e) {}
    T.packing.forEach(function (p, i) { if (c[i]) n++; });
    return n;
  }
  function viewPack() {
    return bar("No.#07", "menu") + '<main class="wrap">' +
      kicker([esc(u("mItems")) + " " + pad(T.packing.length), esc(u("mChecked")) + ' <b class="pk-n">' + pad(packCount()) + "</b>"], true) +
      '<section class="tword r">' + word("koper") + "</section>" + packTool() + flowers() + "</main>";
  }
  function viewLearn() {
    return bar("No.#05", "menu") + '<main class="wrap">' +
      kicker([u("mItems") + " " + pad(T.phrases.length)]) +
      '<section class="tword r">' + word("belajar") + '</section><p class="fine lead r">' + esc(u("learnNote")) + '</p><ul class="phrases">' + T.phrases.map(function (p, i) {
        var mean = lang === "en" ? p[2][1] : p[2][0];
        return '<li class="ph r"><span class="ph-no">' + pad(i + 1) + '</span><b class="ph-id">' + esc(p[0]) + '</b><span class="ph-say">' + esc(p[1]) + '</span><span class="ph-mean">' + esc(mean) + "</span></li>";
      }).join("") + "</ul>" + flowers() + "</main>";
  }

  // ---------- 給司機看 ----------
  function showDriver(k) {
    var p = place(k);
    var ov = document.createElement("div");
    ov.className = "driver";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.innerHTML = '<div class="driver-in">' + STAR + '<p class="drv-ask">Tolong antar saya ke:</p>' +
      (lang !== "id" ? '<p class="drv-tr">' + esc(u("takeMe")) + "</p>" : "") +
      '<p class="drv-name">' + esc(p.n) + '</p><p class="drv-area">' + esc(p.a) + "</p>" +
      '<div class="drv-acts"><a class="btn btn-ink" href="' + esc(mapUrl(k)) + '" target="_blank" rel="noopener">' + esc(u("openMap")) + "</a>" +
      '<button type="button" class="btn btn-line" data-close="1">' + esc(u("close")) + "</button></div></div>";
    document.body.appendChild(ov);
    ov.querySelector("[data-close]").focus();
    ov.addEventListener("click", function (e) { if (e.target === ov || e.target.closest("[data-close]")) ov.remove(); });
  }

  // ---------- 大字自動撐滿寬度 ----------
  function fit() {
    app.querySelectorAll(".hw").forEach(function (el) {
      var inner = el.firstChild;
      el.style.fontSize = "100px";
      var w = inner.getBoundingClientRect().width, max = el.clientWidth;
      if (w > 0 && max > 0) el.style.fontSize = Math.min(100 * max / w, 220) + "px";
    });
  }

  // ---------- 路由 ----------
  var app = document.getElementById("app");
  var lastRoute = null; // 上一次畫的是哪一頁
  function render() {
    var h = (location.hash || "").replace(/^#/, "") || "home";
    var html;
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : lang;
    if (h === "home") html = viewHome();
    else if (h === "menu") html = viewMenu();
    else if (h === "days") html = viewDays();
    else if (h.indexOf("food") === 0) html = viewFood(h.split("-")[1]);
    else if (h === "stay") html = viewStay();
    else if (h === "info") html = viewInfo();
    else if (h === "learn") html = viewLearn();
    else if (h === "money") html = viewMoney();
    else if (h === "pack") html = viewPack();
    else {
      var d = T.days.filter(function (x) { return dayId(x) === h; })[0];
      html = d ? viewDay(d) : viewHome();
    }
    app.innerHTML = html;
    // 餐廳頁換頁籤：上面的大字和頁籤不重播動畫，只有列表重新出現
    if (lastRoute && lastRoute !== h && lastRoute.indexOf("food") === 0 && h.indexOf("food") === 0) {
      app.querySelectorAll(".keep").forEach(function (el) { el.classList.add("no-anim"); });
    }
    lastRoute = h;
    var n = 0;
    app.querySelectorAll(".r").forEach(function (el) { if (!el.closest(".no-anim")) el.style.setProperty("--d", Math.min(n++, 14)); });
    fit();
    if (h === "money") convert("idr");
    var old = document.querySelector(".driver");
    if (old) old.remove();
  }
  function convert(from) {
    var a = document.getElementById("idr"), b = document.getElementById("twd");
    if (!a || !b) return;
    var r = T.rate.twd;
    if (from === "idr") {
      var n = +a.value.replace(/[^\d]/g, "");
      b.value = n ? (n / r).toFixed(n / r < 100 ? 1 : 0) : "";
    } else {
      var m = +b.value.replace(/[^\d.]/g, "");
      a.value = m ? Math.round(m * r).toLocaleString("id-ID") : "";
    }
  }

  document.addEventListener("click", function (e) {
    if (prefsOpen && !e.target.closest(".prefs")) setPrefsOpen(false); // 點選單外面就收起來
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.prefs) {
      setPrefsOpen(!prefsOpen);
    } else if (t.dataset.themePick) {
      theme = t.dataset.themePick;
      try { localStorage.setItem("trip-theme", theme); } catch (err) {}
      applyTheme();
      document.querySelectorAll("[data-theme-pick]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.themePick === theme); });
    } else if (t.dataset.lang) {
      lang = t.dataset.lang;
      try { localStorage.setItem("trip-lang", lang); } catch (err) {}
      render();
    } else if (t.dataset.driver) {
      showDriver(t.dataset.driver);
    } else if (t.dataset.idr) {
      document.getElementById("idr").value = (+t.dataset.idr).toLocaleString("id-ID");
      convert("idr");
    } else if (t.dataset.copy) {
      var done = function () { t.textContent = u("copied"); setTimeout(function () { t.textContent = u("copy"); }, 1500); };
      try { navigator.clipboard.writeText(t.dataset.copy).then(done, function () { selectText(t); }); } catch (err) { selectText(t); }
    }
  });
  function selectText(btn) {
    var el = btn.parentNode.querySelector(".sel");
    if (!el) return;
    var range = document.createRange();
    range.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(range);
  }
  document.addEventListener("input", function (e) {
    if (e.target.id === "idr" || e.target.id === "twd") convert(e.target.id);
  });
  document.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.pack != null) {
      var c = {};
      try { c = JSON.parse(localStorage.getItem("trip-pack") || "{}"); } catch (err) {}
      c[e.target.dataset.pack] = e.target.checked;
      try { localStorage.setItem("trip-pack", JSON.stringify(c)); } catch (err) {}
      var pk = document.querySelector(".pk-n");
      if (pk) pk.textContent = pad(packCount());
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var o = document.querySelector(".driver"); if (o) o.remove(); if (prefsOpen) setPrefsOpen(false); }
  });
  window.addEventListener("hashchange", function () { prefsOpen = false; render(); window.scrollTo(0, 0); });
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  render();
})();
