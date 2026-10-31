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
  // 手機最上面狀態列的顏色：iOS 26 的 Safari 不看 theme-color，而是取「貼在畫面最上緣、實心的固定元素」的顏色，
  // 也就是 body::before 那條頂部色帶。半透明、正在淡入的遮罩它不採用，要等之後重新取色，頂部就慢半拍才變暗。
  // 所以打開遮罩的當下，直接把那條色帶換成「底色疊上遮罩」的實心顏色（theme-color 也一起改，給其他瀏覽器）。
  // a = [r, g, b, 透明度]，不給就是還原。
  function barTint(a) {
    var root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]');
    var base = getComputedStyle(root).getPropertyValue("--paper").trim() || "#e9e7e2";
    if (!a) {
      root.classList.remove("bar-tinted"); root.style.removeProperty("--bar-top");
      if (meta) meta.setAttribute("content", base);
      return;
    }
    var h = base.replace("#", ""), c = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    var mix = "#" + c.map(function (v, i) { return ("0" + Math.round(v * (1 - a[3]) + a[i] * a[3]).toString(16)).slice(-2); }).join("");
    root.style.setProperty("--bar-top", mix); root.classList.add("bar-tinted");
    if (meta) meta.setAttribute("content", mix);
  }
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) {}
  var prefsOpen = false; // 右上角選單是否打開

  // 介面文字
  var UI = {
    open: ["打開行程", "Buka jadwal", "Open the trip"],
    today: ["看今天行程", "Jadwal hari ini", "Today's plan"],
    countdown: ["還有 {n} 天出發", "{n} hari lagi berangkat", "{n} days to go"],
    coverSub: ["一家五口的印尼行程", "Perjalanan keluarga ke Indonesia", "A family trip to Indonesia"],
    madeFor: ["made for 桌桌's family", "made for 桌桌's family", "made for 桌桌's family"],
    egg: ["從一張試算表開始", "Berawal dari satu spreadsheet", "It started with a spreadsheet"],
    eggLabel: ["小彩蛋", "Kejutan kecil", "A little surprise"],
    tipDial: ["其他頁角落的 {ic} 點開可以轉轉看，快速跳到任何一頁", "Di halaman lain, ketuk {ic} di pojok bawah lalu putar untuk pindah halaman", "On other pages, tap {ic} in the corner and spin to jump to any page"],
    tipDialHere: ["角落的 {ic} 點開可以轉轉看，快速跳到任何一頁", "Ketuk {ic} di pojok bawah lalu putar untuk pindah halaman", "Tap {ic} in the corner and spin to jump to any page"],
    tipDrag: ["按住 {ic} 可以拖到另一邊，左手也好按", "Tahan {ic} lalu geser ke sisi lain, pas untuk tangan kiri", "Hold {ic} and drag it to the other side, handy for left thumbs"],
    tipDragOther: ["在其他頁按住 {ic} 可以拖到另一邊，左手也好按", "Di halaman lain, tahan {ic} lalu geser ke sisi lain", "On other pages, hold {ic} and drag it to the other side"],
    tipJump: ["換日按鈕中間的 {cal} 可以直接跳到任何一天", "Ketuk {cal} di antara tombol hari untuk lompat ke hari mana saja", "Tap {cal} between the day buttons to jump to any day"],
    tipDriver: ["「給司機看」會把地點放大，直接拿手機給司機看", "\"Tunjukkan ke sopir\" menampilkan alamat besar-besar untuk sopir", "\"Show the driver\" puts the place in big letters for the driver"],
    tipCopy: ["電話號碼旁的「複製」可以直接複製號碼", "Ketuk \"Salin\" untuk menyalin nomor", "Tap \"Copy\" to copy a number"],
    tipSpeak: ["點 {spk} 可以聽印尼文怎麼唸，再點一次停止", "Ketuk {spk} untuk mendengar cara bacanya", "Tap {spk} to hear how it sounds"],
    foodMore: ["還有想去的店，再丟出來，之後幫你加進清單", "Ada tempat lain yang ingin dikunjungi? Kabari saja, nanti kami tambahkan ke daftar", "Want to go somewhere else? Just let us know and we'll add it to the list"],
    tipWall: ["封面的圖可以左右滑，點開還能存成手機桌布", "Gambar sampul bisa digeser; ketuk untuk menyimpan wallpaper", "Swipe the cover picture, tap it to save a phone wallpaper"],
    wpTitle: ["手機桌布", "Wallpaper HP", "Phone wallpapers"],
    wpHint: ["長按圖片，存成手機桌布", "Tekan lama gambar untuk menyimpan wallpaper", "Press and hold the picture to save it as a wallpaper"],
    wpHintDesk: ["按右鍵「另存圖片」，存成桌布", "Klik kanan lalu \"Simpan gambar\"", "Right-click and choose \"Save image\""],
    wpPrev: ["上一張", "Sebelumnya", "Previous"],
    wpNext: ["下一張", "Berikutnya", "Next"],
    call: ["撥打", "Telepon", "Call"],
    callAsk: ["要撥打這支電話嗎？", "Telepon nomor ini?", "Call this number?"],
    cancel: ["取消", "Batal", "Cancel"],
    linksTitle: ["好用連結", "Tautan berguna", "Handy links"],
    localShort: ["當地", "Lokal", "Local"],
    twShort: ["台灣", "Taiwan", "Taiwan"],
    wxAvg: ["12 月平均", "Rata-rata Des", "Dec avg"],
    wxRain: ["雨", "Hujan", "Rain"],
    wxTitle: ["天氣", "Cuaca", "Weather"],
    tipWx: ["天氣是 12 月平均；出發前 16 天內會自動換成當天預報", "Cuaca rata-rata Desember; 16 hari sebelum berangkat berganti jadi prakiraan", "Weather shows December averages; within 16 days of the trip it switches to the real forecast"],
    tipHome: ["用瀏覽器的「加入主畫面」，就能像 App 一樣一點就打開", "Pilih \"Tambahkan ke Layar Utama\" di browser agar bisa dibuka seperti aplikasi", "Use \"Add to Home Screen\" in your browser to open it like an app"],
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
    tbd: ["時間未定", "Waktu belum pasti", "Time TBD"],
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
    vert: ["印尼之旅・二〇二六", "JALAN-JALAN · 2026", "INDONESIA · 2026"],
    jumpTo: ["跳到其他天", "Pilih hari lain", "Jump to another day"],
    dial: ["快速前往", "Pintasan", "Quick menu"],
    dialHint: ["轉一轉看更多", "Putar untuk lainnya", "Spin for more"],
    dDays: ["行程", "Jadwal", "Days"],
    dFood: ["美食", "Makan", "Food"],
    dStay: ["住宿", "Menginap", "Stay"],
    dInfo: ["旅遊資料", "Info", "Info"],
    dLearn: ["印尼文", "Belajar", "Learn"],
    dMoney: ["匯率", "Kurs", "Money"],
    dPack: ["行李", "Koper", "Packing"],
    listen: ["聽發音", "Dengarkan", "Listen"],
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
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4.1-2 1.5a12.5 12.5 0 0 0 6.3 6.3l1.5-2 4.1 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10.5a3.8 3.8 0 0 0 .4-7.6A5.6 5.6 0 0 0 7.1 9.2 4.4 4.4 0 0 0 7 18z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    rain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 15h10.5a3.6 3.6 0 0 0 .4-7.2A5.4 5.4 0 0 0 7.1 6.6 4.2 4.2 0 0 0 7 15z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    storm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14.5h10.5a3.6 3.6 0 0 0 .4-7.2A5.4 5.4 0 0 0 7.1 6.1 4.2 4.2 0 0 0 7 14.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12.5 15.5l-2 3.2h3l-2 3.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="14" r="1.1" fill="currentColor"/><circle cx="12" cy="14" r="1.1" fill="currentColor"/><circle cx="16" cy="14" r="1.1" fill="currentColor"/><circle cx="8" cy="17.3" r="1.1" fill="currentColor"/><circle cx="12" cy="17.3" r="1.1" fill="currentColor"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path class="wave1" d="M15.5 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path class="wave2" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
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
  // 頁尾：小花分隔線下面放這一頁的灰色小字。一條就靜靜放著；好幾條就變成輪播，像滾輪一樣一條條從上面掉下來（startTicker）
  // 字裡的 {ic} {cal} {spk} 換成迷你的小花按鈕、日曆鈕、喇叭
  function tipHtml(n) {
    var mini = function (cls, label, svg) { return '<span class="foot-ic' + cls + '" role="img" aria-label="' + esc(label) + '">' + svg + "</span>"; };
    return esc(n).replace("{ic}", mini("", u("dial"), DIAL_IC)).replace("{cal}", mini(" is-soft", u("jumpTo"), ICON.cal)).replace("{spk}", mini(" is-say", u("listen"), ICON.speaker));
  }
  function footNotes(notes) {
    var body = notes.length < 2 ? "<p>" + tipHtml(notes[0]) + "</p>" :
      '<div class="tick" data-tick="1" role="note">' + notes.map(function (n, i) {
        return '<p class="tick-i' + (i ? "" : " is-on") + '"' + (i ? ' aria-hidden="true"' : "") + ">" + tipHtml(n) + "</p>";
      }).join("") + "</div>";
    return '<footer class="foot r">' + flowers() + body + "</footer>";
  }
  // 有小花按鈕的頁面都會輪播的小技巧
  function commonTips() { return [u("tipDialHere"), u("tipDrag"), u("tipHome")]; }
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
  // 內頁標題：有插畫（TRIP.photos[art]）就像每日頁一樣字疊在圖上，沒有就只放大字
  function pageHead(w, art) {
    return (T.photos || {})[art] ? hero(w, art) : '<section class="tword r">' + word(w) + "</section>";
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
      '<span class="bar-label">' + esc(label) + "</span>" + clockHtml() + prefs() + "</div></header>";
  }

  // ---------- 上方的時間：當地／台灣（漢堡選單旁邊，每秒檢查、分鐘一換就更新）----------
  function clockHtml() { return '<span class="clk" data-clk="1"></span>'; }
  function clockCity() {
    var h = (location.hash || "").replace(/^#/, ""), d = T.days.filter(function (x) { return dayId(x) === h; })[0] || todayDay();
    return d ? d.city : "jkt"; // 出發前先顯示雅加達
  }
  function tickClock() {
    var els = document.querySelectorAll("[data-clk]");
    if (!els.length) return;
    var fmt = function (tz) { try { return new Date().toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
    var c = clockCity(), tw = fmt("Asia/Taipei");
    // 一行淡色小字：「當地 16:05 · 台灣 17:05」；太窄的手機只留當地（.clk-tw 由 CSS 藏起來）
    var html = c === "tw" ? "<span>" + esc(u("twShort")) + " " + tw + "</span>" :
      "<span>" + esc(u("localShort")) + " " + fmt(c === "bali" ? "Asia/Makassar" : "Asia/Jakarta") + "</span>" +
      '<span class="clk-tw">&nbsp;· ' + esc(u("twShort")) + " " + tw + "</span>";
    var changed = false;
    els.forEach(function (el) { if (el.innerHTML !== html) { el.innerHTML = html; changed = true; } });
    if (changed) fitClock(); // 字變了才重量上方列寬度（每秒檢查時不用每次都量）
  }
  // 最窄的手機（例如 320px 的印尼文、英文）一行放不下時，只留當地時間
  function fitClock() {
    document.querySelectorAll(".bar-in, .cover-bar").forEach(function (row) {
      if (!row.querySelector(".clk")) return;
      row.classList.remove("clk-short");
      if (row.scrollWidth > row.clientWidth + 1) row.classList.add("clk-short");
    });
  }
  // 每秒看一次（文字沒變就不動畫面，幾乎不耗電）：分鐘一換就跟手機狀態列同時跳。
  // iPhone 切到背景會暫停計時，切回來最多 1 秒內更新；下面幾個事件讓它切回來當下就更新。
  setInterval(tickClock, 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tickClock(); });
  document.addEventListener("resume", tickClock);
  window.addEventListener("pageshow", tickClock);
  window.addEventListener("focus", tickClock);

  // ---------- 封面 ----------
  function todayDay() { var t = todayStr(); return T.days.filter(function (d) { return d.date === t; })[0]; }
  function viewHome() {
    var t = todayStr(), td = todayDay(), extra = "";
    if (td) extra = '<a class="btn btn-line" href="#' + dayId(td) + '">' + esc(u("today")) + ICON.arrow + "</a>";
    else if (t < T.start) extra = '<p class="count">' + SPARK + esc(u("countdown").replace("{n}", Math.round((parseDate(T.start) - parseDate(t)) / 86400000))) + "</p>";
    var route = ["tw", "jkt", "pwt", "yk", "bali", "tw"].map(function (c) { return "<li>" + esc(L(T.cities[c])) + "</li>"; }).join("");

    return '<main class="wrap cover">' +
      '<div class="cover-bar r"><button type="button" class="egg-btn" data-egg="1" aria-label="' + esc(u("eggLabel")) + '">' + STAR + "</button>" + clockHtml() + prefs() + "</div>" +
      meta([[u("mTrip"), u("indonesia")], [u("mDate"), "14–31.12"], [u("mDays"), "18"], [u("mNo"), "#2026"]]) +
      coverHero() +
      '<section class="cover-body r"><p class="vert' + (lang === "zh" ? "" : " is-latin") + '" aria-hidden="true">' + esc(u("vert")) + "</p>" +
      '<div class="cover-main"><h1 class="cover-title">' + esc(L(T.title)) + "</h1>" +
      '<p class="cover-sub">' + esc(u("coverSub")) + "</p>" +
      '<ol class="route">' + route + "</ol>" +
      '<div class="cover-actions"><a class="btn btn-ink" href="#menu">' + esc(u("open")) + ICON.arrow + "</a>" + extra + "</div></div></section>" +
      '<footer class="pfoot r"><span>2026</span><span>Jakarta · Purwokerto · Yogyakarta · Bali</span><span>' + SPARK + "</span></footer>" +
      "</main>";
  }

  // ---------- 封面輪播：同一個圖框裡左右滑的插畫，點開可以存成手機桌布 ----------
  function coverHero() {
    var cs = T.covers || [{ art: "stupa" }];
    var dots = cs.length > 1 ? '<div class="cv-dots" aria-hidden="true">' + cs.map(function (c, i) { return "<i" + (i ? "" : ' class="is-on"') + "></i>"; }).join("") + "</div>" : "";
    return '<section class="hero r">' + word("jalan²", ART.topColor(cs[0].art)) +
      '<div class="hero-art cv" data-cv="1" role="button" tabindex="0" aria-label="' + esc(u("wpTitle")) + '">' +
      ART.slides(cs.map(function (c) { return c.art; }), "jalan²") +
      '<div class="hero-over"><p class="by" data-cv-tag>' + esc(cs[0].tag || u("madeFor")) + "</p>" + flowers() + "</div>" + dots + "</div></section>";
  }
  var cvCur = 0, cvPos = [], cvTimer = null, cvDrag = null, cvMoved = false;
  // 每張的位置 o：0＝正在看的，±1＝左右鄰居；超過一圈就從另一邊接回來
  function cvOffset(i, cur, n) { var o = ((i - cur) % n + n) % n; return o > n / 2 ? o - n : o; }
  function cvShow(next, drag) {
    var root = app.querySelector("[data-cv]");
    if (!root) return;
    var slides = root.querySelectorAll(".cv-slide"), n = slides.length;
    if (!n) return;
    var prev = cvCur;
    cvCur = ((next % n) + n) % n;
    slides.forEach(function (g, i) {
      var o = cvOffset(i, cvCur, n), was = cvPos[i];
      if ((drag != null || prev !== cvCur) && Math.abs(o) <= 1) cvLoad(g.querySelector("image[data-href]")); // 要滑到的那幾張先載
      var anim = drag == null && was != null && Math.abs(o) <= 1 && Math.abs(was) <= 1;
      g.style.transition = anim ? "transform .6s cubic-bezier(.3, .8, .3, 1)" : "none";
      g.style.transform = "translateX(" + (o * 360 + (drag || 0)) + "px)";
      cvPos[i] = o;
    });
    var c = T.covers[cvCur], w = app.querySelector(".hero .hw"), tag = root.querySelector("[data-cv-tag]");
    if (w) w.style.color = ART.topColor(c.art); // 大字跟著換成這張的天空色
    var star = app.querySelector(".cover-bar .star"); // 左上角的星星也跟著換（晚一點，像離得比較遠才被染到）；第一張回到原本的藍
    if (star) star.style.color = cvCur ? ART.topColor(c.art) : "";
    if (tag && prev !== cvCur) tag.textContent = c.tag || u("madeFor");
    root.querySelectorAll(".cv-dots i").forEach(function (d, i) { d.classList.toggle("is-on", i === cvCur); });
  }
  // 封面其他張：等第一張載好後，一張一張在背景補上（不跟第一張搶網路）
  function cvLoad(el) {
    if (!el || !el.hasAttribute("data-href")) return;
    el.setAttribute("href", el.getAttribute("data-href"));
    el.removeAttribute("data-href");
    fadeIn(el.closest("svg"));
  }
  function cvLoadRest() {
    var root = app.querySelector("[data-cv]");
    if (!root) return;
    var first = root.querySelector(".cv-slide image.fade"), wait = new Image();
    var go = function () {
      var rest = [].slice.call(root.querySelectorAll("image[data-href]"));
      (function step() {
        var el = rest.shift();
        if (!el || !root.isConnected) return;
        if (!el.hasAttribute("data-href")) return step(); // 已經因為滑動先載了
        var pre = new Image();
        pre.onload = pre.onerror = function () { cvLoad(el); step(); };
        pre.src = el.getAttribute("data-href");
      })();
    };
    wait.onload = wait.onerror = function () { setTimeout(go, 300); };
    wait.src = first ? first.getAttribute("href") : "";
  }
  function cvStart() {
    clearInterval(cvTimer);
    if (!app.querySelector("[data-cv]") || !T.covers || T.covers.length < 2) return;
    cvTimer = setInterval(function () { if (!document.hidden && !wpOpen && !cvDrag) cvShow(cvCur + 1); }, 5000);
  }
  // 手指左右滑：上下滑照常捲動頁面
  document.addEventListener("pointerdown", function (e) {
    var r = e.target.closest && e.target.closest("[data-cv]");
    if (!r || (e.pointerType === "mouse" && e.button !== 0)) return;
    cvDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false, w: r.getBoundingClientRect().width };
  });
  document.addEventListener("pointermove", function (e) {
    if (!cvDrag || e.pointerId !== cvDrag.id) return;
    var dx = e.clientX - cvDrag.x, dy = e.clientY - cvDrag.y;
    if (!cvDrag.on) {
      if (!(cvT && cvT.lock === "x") && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { cvDrag = null; return; }
      if (Math.abs(dx) < 8) return;
      cvDrag.on = true;
    }
    cvDrag.lx = e.clientX;
    cvShow(cvCur, dx * 360 / cvDrag.w);
  });
  function cvEnd(e) {
    if (!cvDrag || e.pointerId !== cvDrag.id) return;
    var d = cvDrag; cvDrag = null;
    if (!d.on) return;
    var dx = (e.type === "pointercancel" || !e.clientX ? (d.lx || d.x) : e.clientX) - d.x; // 被取消時沒有座標，用最後一次的位置
    cvShow(cvCur + (dx < -d.w * .18 ? 1 : dx > d.w * .18 ? -1 : 0));
    cvStart(); // 手動換過就重新計時 5 秒
    cvMoved = true;
    setTimeout(function () { cvMoved = false; }, 0);
  }
  document.addEventListener("pointerup", cvEnd);
  document.addEventListener("pointercancel", cvEnd);
  // iPhone Safari：只靠 CSS 的 touch-action: pan-y，手指稍微斜一點就會被當成上下捲動、輪播卡住。
  // 所以手指一開始移動就判斷方向：偏左右就擋掉這次捲動（第一下 touchmove 就要擋，晚了 Safari 不理），偏上下才讓頁面捲。
  var cvT = null;
  document.addEventListener("touchstart", function (e) {
    var r = e.target.closest && e.target.closest("[data-cv]");
    cvT = r && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, lock: "" } : null;
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (!cvT || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - cvT.x, dy = e.touches[0].clientY - cvT.y;
    if (!cvT.lock) {
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      cvT.lock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (cvT.lock === "x" && e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", function () { cvT = null; });
  document.addEventListener("touchcancel", function () { cvT = null; });

  // ---------- 小彩蛋：點封面左上角的星星，跳出一張小插畫「試算表長出八角星」----------
  // 這個網站是從一張 Google 試算表開始的。插畫是 Codex 畫的（img/egg.jpg），會跟著網站一起存進手機，沒網路也看得到。
  var eggOpen = false;
  function openEgg() {
    closeEgg(true);
    var ov = document.createElement("div");
    ov.className = "egg"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", u("eggLabel"));
    ov.innerHTML = '<div class="egg-card"><img class="egg-art" src="img/egg.jpg" alt="" draggable="false">' +
      '<p class="egg-cap">' + esc(u("egg")) + "<small>made with Claude</small></p></div>";
    document.body.appendChild(ov);
    eggOpen = true;
    ov.addEventListener("click", function () { closeEgg(); });
    var img = ov.querySelector("img"), go = function () { requestAnimationFrame(function () { ov.classList.add("is-on"); }); };
    if (img.decode) img.decode().then(go, go); else go(); // 圖解碼好才開始彈出，不會先看到空白卡片
  }
  function closeEgg(now) {
    var ov = document.querySelector(".egg");
    eggOpen = false;
    if (!ov) return;
    if (now) { ov.remove(); return; }
    ov.classList.remove("is-on");
    setTimeout(function () { ov.remove(); }, 250);
  }
  document.addEventListener("keydown", function (e) { if (eggOpen && e.key === "Escape") closeEgg(); });

  // ---------- 桌布浮層：暗色遮罩、右上 X、左右換張、長按存圖 ----------
  var wpOpen = false, wpIdx = 0;
  function walls() { return (T.covers || []).filter(function (c) { return c.wall; }); }
  function openWall(i) {
    closeWall();
    var ws = walls();
    if (!ws.length) return;
    wpIdx = ((i % ws.length) + ws.length) % ws.length;
    var desk = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    var ov = document.createElement("div");
    ov.className = "wp";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", u("wpTitle"));
    ov.innerHTML = '<div class="wp-scrim" data-wp-close="1"></div>' +
      '<figure class="wp-fig"><img class="wp-img" alt=""><figcaption class="wp-hint"><span>' + esc(u(desk ? "wpHintDesk" : "wpHint")) + '</span><b class="wp-n"></b></figcaption></figure>' +
      '<button type="button" class="wp-nav wp-prev" data-wp-step="-1" aria-label="' + esc(u("wpPrev")) + '">' + ICON.left + "</button>" +
      '<button type="button" class="wp-nav wp-next" data-wp-step="1" aria-label="' + esc(u("wpNext")) + '">' + ICON.chev + "</button>" +
      '<button type="button" class="wp-x" data-wp-close="1" aria-label="' + esc(u("close")) + '">' + ICON.x + "</button>";
    document.body.appendChild(ov);
    document.documentElement.classList.add("wp-open");
    barTint([8, 10, 18, .82]); // 跟 .wp-scrim 同一個顏色
    wpOpen = true;
    wallShow(0);
    ov.querySelector(".wp-x").focus({ preventScroll: true });
    // 在浮層裡左右滑也能換張
    var sw = null;
    ov.addEventListener("pointerdown", function (e) { if (!e.target.closest("button")) sw = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
    ov.addEventListener("pointerup", function (e) {
      if (!sw || e.pointerId !== sw.id) return;
      var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { wallShow(dx < 0 ? 1 : -1); ov.dataset.swiped = "1"; setTimeout(function () { delete ov.dataset.swiped; }, 0); }
    });
  }
  // 桌布先在背景下載並解碼好（打開浮層時 6 張都先載），換張時才不會先滑進舊圖、再突然跳成新圖
  var wpCache = {}, wpToken = 0;
  function wallImg(src) {
    if (!wpCache[src]) {
      var im = new Image();
      im.src = src;
      wpCache[src] = (im.decode ? im.decode() : new Promise(function (r) { im.onload = r; })).catch(function () {});
    }
    return wpCache[src];
  }
  function wallShow(dir) {
    var ov = document.querySelector(".wp"), ws = walls();
    if (!ov || !ws.length) return;
    wpIdx = ((wpIdx + dir) % ws.length + ws.length) % ws.length;
    var img = ov.querySelector(".wp-img"), c = ws[wpIdx], ph = (T.photos || {})[c.art], tk = ++wpToken;
    ov.querySelector(".wp-n").textContent = (wpIdx + 1) + " / " + ws.length;
    if (dir) img.classList.add("is-wait"); // 新圖還沒好（網路慢）時舊圖先變淡，知道正在載
    wallImg(c.wall).then(function () {
      if (tk !== wpToken || !img.isConnected) return; // 連按好幾下：只換最後那張
      img.classList.remove("is-in-l", "is-in-r", "is-wait");
      img.src = c.wall;
      img.alt = (ph && ph.what) || "";
      void img.offsetWidth;
      if (dir) img.classList.add(dir > 0 ? "is-in-r" : "is-in-l");
    });
    ws.forEach(function (w) { wallImg(w.wall); });
  }
  function closeWall() {
    var ov = document.querySelector(".wp");
    if (ov) ov.remove();
    document.documentElement.classList.remove("wp-open");
    barTint();
    wpOpen = false;
  }

  // 印尼的市話／手機（0 開頭）改成 +62，台灣門號漫遊也撥得通
  function telIntl(n) { var d = n.replace(/[^\d+]/g, ""); return d[0] === "0" ? "+62" + d.slice(1) : d; }
  // 撥打前先跳確認視窗，避免誤觸；有兩個號碼（118 / 119）就讓人選
  function showCall(btn) {
    closeCall();
    var nums = btn.dataset.call.split(","), ov = document.createElement("div");
    ov.className = "callbox";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", u("callAsk"));
    ov.innerHTML = '<div class="callbox-card"><p class="callbox-q">' + esc(u("callAsk")) + '</p><p class="callbox-who">' + esc(btn.dataset.callLabel) + "</p>" +
      nums.map(function (n) { return '<a class="callbox-go" href="tel:' + esc(n) + '" data-call-close="1">' + ICON.phone + esc(u("call")) + " " + esc(n) + "</a>"; }).join("") +
      '<button type="button" class="callbox-no" data-call-close="1">' + esc(u("cancel")) + "</button></div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov || e.target.closest("[data-call-close]")) setTimeout(closeCall, 0); });
    ov.querySelector(".callbox-no").focus({ preventScroll: true });
  }
  function closeCall() { var o = document.querySelector(".callbox"); if (o) o.remove(); }

  // ---------- 主選單 ----------
  function sec(title, body) { return '<section class="sec r"><h2 class="sec-h">' + SPARK + esc(title) + "</h2>" + body + "</section>"; }
  // 匯率換算和行李清單：選單頁的最後兩個按鈕，各自一頁
  function moneyTool() {
    return sec(u("moneyTitle"), '<div class="conv">' +
      '<label for="idr">' + esc(u("idr")) + '</label><input id="idr" inputmode="numeric" autocomplete="off" value="100.000">' +
      '<label for="twd">' + esc(u("twd")) + '</label><input id="twd" inputmode="decimal" autocomplete="off">' +
      '<div class="quick">' + [10000, 50000, 100000, 500000].map(function (v) { return '<button type="button" data-idr="' + v + '">' + v.toLocaleString("id-ID") + "</button>"; }).join("") + "</div></div>");
  }
  function packTool() {
    var checked = {};
    try { checked = JSON.parse(localStorage.getItem("trip-pack") || "{}"); } catch (e) {}
    return sec(u("packTitle"), '<ul class="list checks">' + T.packing.map(function (p, i) {
      return '<li><label><input type="checkbox" id="pk' + i + '" data-pack="' + i + '"' + (checked[i] ? " checked" : "") + "><span>" + esc(L(p)) + "</span></label></li>";
    }).join("") + "</ul>");
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
        var ic = (T.menuArt || {})[x[0]];
        return '<a class="mrow r' + (x[1] === "today" ? " is-today" : "") + '" href="#' + x[0] + '">' +
          (ic ? '<span class="mrow-ic"><img class="fade" src="' + esc(ic) + '" alt="" loading="lazy" decoding="async"></span>' : SPARK) +
          '<span class="mrow-t"><b>' + esc(u(x[1])) + "</b><small>" + esc(x[3] || u(x[2])) + "</small></span>" + ICON.arrow + "</a>";
      }).join("") + "</nav>" + footNotes([u("tipWall"), u("tipDial"), u("tipDragOther"), u("tipHome"), u("artNote")]) + "</main>";
  }

  // ---------- 日期列表 ----------
  var CITY_ART = { tw: "plane", jkt: "city", pwt: "slamet", yk: "stupa", bali: "gate" };
  // 橫幅圖：模糊小預覽墊底，清楚的圖載完淡入
  function bandImg(src, lazy) {
    var lq = (window.LQ || {})[src];
    return (lq ? '<img class="band-lq" src="' + lq + '" alt="" aria-hidden="true">' : "") +
      '<img class="band fade" src="' + esc(src) + '" alt=""' + (lazy ? ' loading="lazy"' : "") + ' decoding="async">';
  }
  // 城市橫幅：有專門畫的橫幅圖（TRIP.bands）就用它，沒有才從大插畫裁一條
  function stripArt(city) {
    var b = (T.bands || {})[city];
    if (!b) return ART.svg(CITY_ART[city], city, true);
    return bandImg(b.src, true) + '<span class="band-shade" aria-hidden="true"></span>';
  }
  function viewDays() {
    var t = todayStr(), html = "", last = null, n = 0;
    T.days.forEach(function (d) {
      n++;
      if (d.city !== last) {
        if (last !== null) html += "</ol></section>";
        html += '<section class="cityblock r"><div class="strip">' + stripArt(d.city) +
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
      '<section class="tword r">' + word("jadwal") + "</section>" + html + "</ol></section>" + footNotes(commonTips()) + "</main>";
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
    var h = '<li class="ev r">' + (it.time ? '<div class="ev-time">' + esc(L(it.time)) : '<div class="ev-time is-tbd">' + esc(u("tbd"))) + "</div>" +
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
  // ---------- 天氣：日期那一行的右邊 ----------
  // 平常顯示 12 月平均（T.climate）；出發前 16 天內抓 Open-Meteo 預報，存在這支手機（trip-wx），沒網路就用上次存的
  function wxCache() { try { return JSON.parse(localStorage.getItem("trip-wx") || "{}"); } catch (e) { return {}; } }
  function wxIcon(code) {
    if (code == null) return ICON.rain; // 12 月是雨季：平均值用雨雲
    if (code >= 95) return ICON.storm;
    if (code >= 51) return ICON.rain;
    if (code >= 2) return ICON.cloud;
    return ICON.sun;
  }
  function wxHtml(d) {
    var c = wxCache()[d.city], f = c && c.days && c.days[d.date], n = (T.climate || {})[d.city];
    if (!f && !n) return "";
    var hi = f ? f[0] : n.hi, lo = f ? f[1] : n.lo;
    var note = f ? (f[3] >= 30 ? u("wxRain") + " " + f[3] + "%" : "") : u("wxAvg");
    return '<em class="wx' + (f ? " is-fc" : "") + '" data-wx="' + d.date + '" title="' + esc(u("wxTitle")) + '">' + wxIcon(f ? f[2] : null) +
      "<b>" + lo + "–" + hi + "°</b>" + (note ? "<small>" + esc(note) + "</small>" : "") + "</em>";
  }
  function wxRefresh(d) {
    var ll = (T.wx || {})[d.city];
    if (!ll || !window.fetch || !navigator.onLine) return;
    var ahead = Math.round((parseDate(d.date) - parseDate(todayStr())) / 86400000);
    if (ahead < 0 || ahead > 15) return; // 預報只到 16 天後
    var cache = wxCache(), c = cache[d.city];
    if (c && Date.now() - c.at < 3 * 3600000 && c.days[d.date]) return; // 3 小時內抓過就不再抓
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + ll[0] + "&longitude=" + ll[1] +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16")
      .then(function (r) { return r.json(); }).then(function (j) {
        var days = {};
        j.daily.time.forEach(function (t, i) {
          days[t] = [Math.round(j.daily.temperature_2m_max[i]), Math.round(j.daily.temperature_2m_min[i]), j.daily.weather_code[i], j.daily.precipitation_probability_max[i] || 0];
        });
        var all = wxCache(); all[d.city] = { at: Date.now(), days: days };
        try { localStorage.setItem("trip-wx", JSON.stringify(all)); } catch (e) {}
        var el = app.querySelector('[data-wx="' + d.date + '"]');
        if (el) el.outerHTML = wxHtml(d);
      }).catch(function () {});
  }
  function viewDay(d) {
    var i = T.days.indexOf(d), prev = T.days[i - 1], next = T.days[i + 1];
    var items = d.items.map(function (it) { return it.go ? goBlock(it) : card(it); }).join("");
    var pager = '<nav class="pager r">' +
      (prev ? '<a href="#' + dayId(prev) + '">' + ICON.left + "<span><small>" + esc(u("prev")) + "</small>" + dm(prev) + "</span></a>" : "<span></span>") +
      '<button type="button" class="pg-jump" data-jump="1" aria-label="' + esc(u("jumpTo")) + '" title="' + esc(u("jumpTo")) + '">' + ICON.cal + "</button>" +
      (next ? '<a class="pg-next" href="#' + dayId(next) + '"><span><small>' + esc(u("next")) + "</small>" + dm(next) + "</span>" + ICON.chev + "</a>" : "<span></span>") + "</nav>";
    return bar("No.#" + pad(i + 1) + " / 18", "days") + '<main class="wrap' + (d.wedding ? " is-wedding" : "") + '">' +
      kicker([pad(i + 1) + "/18", dm(d) + " " + wk(d), L(T.cities[d.city]), tzCode(d.city)]) +
      hero(d.word, d.art, wxHtml(d)) + // 天氣放在插畫天空的右上角（跟封面的小字一樣），日期那行才排得下一行
      '<section class="day-head r"><h1 class="dh-title">' + esc(L(d.title)) + "</h1>" +
      '<p class="dh-tz">' + SPARK + esc(tzNote(d.city)) + "</p></section>" +
      // 小花線只當「這一頁到底了」的記號：小花線＋提示輪播放在換日按鈕下面，當整頁的結尾（跟其他頁一樣）
      '<ol class="flow">' + items + "</ol>" + pager +
      footNotes([u("tipJump"), u("tipWx")].concat(d.items.some(function (it) { return it.place || it.options; }) ? [u("tipDriver")] : [], commonTips())) + "</main>";
  }

  // ---------- 餐廳 ----------
  function foodBand(id) { // 餐廳頁：每個城市一張美食橫幅
    var b = (T.bands || {})["food-" + id];
    return b ? '<div class="strip r">' + bandImg(b.src) + "</div>" : "";
  }
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
      '<section class="tword r">' + word("makan") + "</section>" + tabs + "</div>" + foodBand(cur.id) + groups + footNotes([u("foodMore")].concat(commonTips())) + "</main>";
  }

  // ---------- 住宿 ----------
  function viewStay() {
    return bar("No.#03", "menu") + '<main class="wrap">' +
      kicker(["15.12 – 31.12", u("mPlaces") + " 04"]) +
      '<section class="tword r">' + word("menginap") + '</section><ul class="stays">' + T.stays.map(function (s) {
        var p = place(s.place);
        return '<li class="stay r"><div class="strip strip-s">' + stripArt(s.city) + '<p class="strip-name">' + esc(L(T.cities[s.city])) + "</p></div>" +
          '<div class="stay-body has-map">' + mapBtn(s.place) + '<p class="stay-when">' + esc(L(s.nights)) + "</p>" +
          '<h2 class="stay-name">' + esc(p.n) + '</h2><p class="stay-area">' + esc(p.a) + "</p>" +
          (s.inout ? '<p class="stay-meta">' + esc(L(s.inout)) + "</p>" : "") +
          (s.host ? '<p class="stay-meta">' + esc(u("host")) + "：" + esc(s.host) + "</p>" : "") +
          (s.phone ? '<p class="stay-meta stay-phone">' + esc(u("phone")) + '：<span class="sel">' + esc(s.phone) + "</span>" + callBtn([telIntl(s.phone)], p.n) + "</p>" : "") +
          placeActions(s.place) + "</div></li>";
      }).join("") + "</ul>" + footNotes([u("tipDriver")].concat(commonTips())) + "</main>";
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
  // [顯示的號碼, 說明, 實際撥出的號碼（印尼市話改成 +62，台灣門號漫遊也撥得通）]
  // 外交部資料（2026/10 查證）：雅加達代表處管雅加達、普禾加多、日惹；峇里島歸泗水辦事處管
  var EMERG = [
    ["112", ["印尼緊急電話（警察、救護、消防）", "Darurat umum", "General emergency"], ["112"]],
    ["110", ["警察", "Polisi", "Police"], ["110"]],
    ["118 / 119", ["救護車", "Ambulans", "Ambulance"], ["118", "119"]],
    ["0811-984-676", ["駐印尼代表處・急難救助（雅加達、普禾加多、日惹）", "Kantor Dagang Taipei Jakarta, darurat (Jakarta, Purwokerto, Yogyakarta)", "Taipei office Jakarta, emergencies (Jakarta, Purwokerto, Yogyakarta)"], ["+62811984676"]],
    ["021-515-3939", ["駐印尼代表處・一般業務（上班時間）", "Kantor Dagang Taipei Jakarta, umum (jam kerja)", "Taipei office Jakarta, general (office hours)"], ["+62215153939"]],
    ["0822-5766-9680", ["駐泗水辦事處・急難救助（峇里島，下班後與假日）", "Kantor Taipei Surabaya, darurat (Bali, di luar jam kerja)", "Taipei office Surabaya, emergencies (Bali, after hours)"], ["+6282257669680"]],
    ["031-9901-4600", ["駐泗水辦事處（峇里島，上班時間）", "Kantor Taipei Surabaya (Bali, jam kerja)", "Taipei office Surabaya (Bali, office hours)"], ["+623199014600"]]
  ];
  // 好用連結（2026/10 查證都是官方網址）
  var LINKS = [
    [["證件和規定", "Dokumen & aturan", "Documents & rules"], [
      ["https://evisa.imigrasi.go.id/", "e-VOA", ["印尼電子落地簽官網", "Situs resmi visa elektronik", "Official e-visa site"]],
      ["https://allindonesia.imigrasi.go.id/", "All Indonesia", ["入境與海關線上申報", "Deklarasi kedatangan & bea cukai", "Arrival and customs declaration"]],
      ["https://lovebali.baliprov.go.id/", "Love Bali", ["峇里島觀光稅線上繳費", "Pungutan wisatawan Bali", "Bali tourist levy"]]
    ]],
    [["台灣官方", "Pemerintah Taiwan", "Taiwan government"], [
      ["https://www.boca.gov.tw/sp-trwa-content-3117-e5522-1.html", "外交部領事局・印尼旅遊警示", ["最新旅遊警示和注意事項", "Peringatan perjalanan terbaru", "Latest travel advice"]],
      ["https://www.boca.gov.tw/sp-foof-countrycp-02-12-c23b0-1.html", "外交部領事局・駐印尼館處", ["地址、電話、轄區", "Alamat, telepon, wilayah", "Addresses, phones, coverage"]],
      ["https://www.roc-taiwan.org/id/", "駐印尼台北經濟貿易代表處", ["代表處官網", "Situs Kantor Dagang Taipei", "Taipei office website"]]
    ]],
    [["好用 App", "Aplikasi berguna", "Handy apps"], [
      ["https://www.grab.com/id/en/", "Grab", ["叫車、外送", "Transportasi & pesan antar", "Rides and delivery"]],
      ["https://www.gojek.com/en-id/", "Gojek", ["叫車、外送（印尼最普遍）", "Transportasi & pesan antar", "Rides and delivery (most common in Indonesia)"]],
      ["https://translate.google.com/", "Google 翻譯", ["可以拍照翻譯菜單和招牌", "Bisa terjemahkan foto menu", "Translate menus and signs with the camera"]],
      ["https://www.google.com/maps", "Google 地圖", ["導航、找店", "Navigasi & cari tempat", "Directions and places"]],
      ["https://www.airbnb.com.tw/", "Airbnb", ["日惹和峇里島的住宿", "Penginapan Yogyakarta & Bali", "Our stays in Yogyakarta and Bali"]]
    ]]
  ];
  function callBtn(nums, label) {
    return '<button type="button" class="copy call" data-call="' + esc(nums.join(",")) + '" data-call-label="' + esc(label) + '">' + ICON.phone + esc(u("call")) + "</button>";
  }
  function viewInfo() {
    var time = sec(u("timeTitle"), '<ul class="list kv">' +
      "<li><b>" + esc(L(T.cities.jkt) + "・" + L(T.cities.pwt) + "・" + L(T.cities.yk)) + "</b><span>WIB · " + esc(u("tzJava")) + "</span></li>" +
      "<li><b>" + esc(L(T.cities.bali)) + "</b><span>WITA · " + esc(u("tzBali")) + "</span></li></ul>");
    var entry = sec(u("entryTitle"), '<ul class="list">' + ENTRY.map(function (e) {
      return '<li class="para"><b>' + esc(L(e[0])) + "</b><p>" + esc(L(e[1])) + "</p></li>";
    }).join("") + "</ul>");
    var emerg = sec(u("emergTitle"), '<ul class="list">' + EMERG.map(function (e) {
      return '<li class="phone-row"><span><b class="sel">' + esc(e[0]) + "</b><small>" + esc(L(e[1])) + "</small></span>" + callBtn(e[2], L(e[1])) + "</li>";
    }).join("") + "</ul>");
    var links = sec(u("linksTitle"), LINKS.map(function (g) {
      return '<h3 class="link-h">' + esc(L(g[0])) + '</h3><ul class="list">' + g[1].map(function (l) {
        return '<li><a class="row" href="' + esc(l[0]) + '" target="_blank" rel="noopener"><span class="row-main"><b>' + esc(l[1]) + "</b><small>" + esc(L(l[2])) + '</small></span><span class="row-act">' + ICON.arrow + "</span></a></li>";
      }).join("") + "</ul>";
    }).join(""));
    var tickets = sec(u("ticketTitle"), '<ul class="list tickets">' + T.tickets.map(function (k) {
      return '<li class="tk"><span class="tk-ic">' + ICON[k.kind] + '</span><span><b>' + esc(k.date + "　" + L(k.t)) + "</b><small>" + esc(L(k.d)) + "</small></span></li>";
    }).join("") + "</ul>");
    // 「插畫是 AI 畫的」說明搬到選單頁的輪播了（從那頁開始就有很多插畫）
    var credits = footNotes([u("tipCopy")].concat(commonTips()));
    return bar("No.#04", "menu") + '<main class="wrap">' +
      kicker(["WIB / WITA", u("mItems") + " 04"]) +
      pageHead("info", "p-info") + time + entry + emerg + links + tickets + credits + "</main>";
  }

  // ---------- 學印尼文 ----------
  function viewMoney() {
    return bar("No.#06", "menu") + '<main class="wrap">' +
      kicker(["IDR → TWD", "1 : " + T.rate.twd]) +
      pageHead("rupiah", "p-money") + moneyTool() +
      footNotes([u("moneyRule"), u("moneyAsOf").replace("{r}", T.rate.twd).replace("{d}", T.rate.asOf.replace(/-/g, "-\u2060"))].concat(commonTips())) + "</main>"; // 日期不要從 - 斷行
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
      pageHead("koper", "p-pack") + packTool() + footNotes([u("packNote")].concat(commonTips())) + "</main>";
  }
  // 用手機內建的印尼文語音念出來（iPhone 是 Damayanti），不用另外放錄音檔
  var canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if (canSpeak) try { speechSynthesis.getVoices(); } catch (e) {} // 先讓瀏覽器載入語音清單
  function idVoice() {
    try { return speechSynthesis.getVoices().filter(function (v) { return /^id([-_]|$)/i.test(v.lang); })[0] || null; } catch (e) { return null; }
  }
  function stopSpeaking() {
    if (!canSpeak) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    document.querySelectorAll(".say.is-playing").forEach(function (b) { b.classList.remove("is-playing"); });
  }
  function speak(btn) {
    var again = btn.classList.contains("is-playing");
    stopSpeaking();
    if (again) return; // 正在念的那顆再按一次＝停止
    var ut = new SpeechSynthesisUtterance(btn.dataset.say);
    ut.lang = "id-ID";
    var v = idVoice();
    if (v) ut.voice = v;
    ut.rate = .85; // 放慢一點比較好跟著唸
    ut.onend = ut.onerror = function () { btn.classList.remove("is-playing"); };
    btn.classList.add("is-playing");
    speechSynthesis.speak(ut);
  }
  function viewLearn() {
    return bar("No.#05", "menu") + '<main class="wrap">' +
      kicker([u("mItems") + " " + pad(T.phrases.length)]) +
      pageHead("belajar", "p-learn") + '<ul class="phrases">' + T.phrases.map(function (p, i) {
        var mean = lang === "en" ? p[2][1] : p[2][0];
        // 喇叭放在句子第一行的尾巴（placeSays() 量好位置）；長句斷行時就不會卡在兩行字中間
        var say = canSpeak ? '<button type="button" class="say" data-say="' + esc(p[0]) + '" aria-label="' + esc(u("listen") + "：" + p[0]) + '">' + ICON.speaker + "</button>" : "";
        return '<li class="ph r"><span class="ph-no">' + pad(i + 1) + '</span><span class="ph-top"><b class="ph-id">' + esc(p[0]) + "</b>" + say +
          '</span><span class="ph-say">' + esc(p[1]) + '</span><span class="ph-mean">' + esc(mean) + "</span>" +
          (p[3] ? '<span class="ph-note">' + esc(lang === "en" ? p[3][1] : p[3][0]) + "</span>" : "") + "</li>"; // 第 4 欄（可省略）：小字註解
      }).join("") + "</ul>" + footNotes([u("learnNote")].concat(canSpeak ? [u("tipSpeak")] : [], commonTips())) + "</main>";
  }

  // ---------- 快速跳到其他天：從下方滑出的日期面板 ----------
  function showJump() {
    var cur = location.hash.replace(/^#/, ""), t = todayStr(), html = "", last = null;
    T.days.forEach(function (d) {
      if (d.city !== last) {
        if (last !== null) html += "</div>";
        html += '<p class="jump-city">' + esc(L(T.cities[d.city])) + '</p><div class="jump-grid">';
        last = d.city;
      }
      var here = dayId(d) === cur;
      html += '<a class="jump-day' + (here ? " is-cur" : "") + (d.wedding ? " is-wedding" : "") + (d.date === t ? " is-today" : "") +
        '" href="#' + dayId(d) + '"' + (here ? ' aria-current="page"' : "") + "><b>" + dm(d) + "</b><small>" + esc(wk(d)) + "</small></a>";
    });
    var ov = document.createElement("div");
    ov.className = "jump";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", u("jumpTo"));
    ov.innerHTML = '<div class="jump-sheet"><div class="jump-head"><b>' + esc(u("jumpTo")) + "</b>" +
      '<button type="button" class="jump-x" data-close-jump="1" aria-label="' + esc(u("close")) + '">' + ICON.x + "</button></div>" + html + "</div></div>";
    document.body.appendChild(ov);
    document.documentElement.classList.add("jump-open");
    var sheet = ov.querySelector(".jump-sheet"); // 對焦放在面板上，手機上不會出現對焦框
    sheet.setAttribute("tabindex", "-1");
    sheet.focus({ preventScroll: true });
    // 點背景、叉叉或任何一天都收起來（點日期會照常跳頁）
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("[data-close-jump]") || e.target.closest(".jump-day")) closeJump();
    });
  }
  // ---------- 婚禮那兩天：飄落的白色茉莉花瓣 ----------
  var PETAL = '<svg viewBox="0 0 10 14" aria-hidden="true"><path d="M5 .5C8.2 3.4 9.6 7.2 5 13.5.4 7.2 1.8 3.4 5 .5Z"/></svg>';
  function setPetals(on) {
    var box = document.querySelector(".petals");
    if (!on) { if (box) box.remove(); return; }
    if (box) return; // 已經在飄（例如 12/19 換到 12/20、換語言），就讓它繼續
    var html = "";
    for (var i = 0; i < 12; i++) {
      var dur = 10 + Math.random() * 8; // 每片落下 10–18 秒，起點和大小都不同
      html += '<span class="petal" style="--x:' + (Math.random() * 100).toFixed(1) + "%;--dur:" + dur.toFixed(1) + "s;--delay:" + (-Math.random() * dur).toFixed(1) +
        "s;--rot:" + (Math.random() < .5 ? -1 : 1) * Math.round(180 + Math.random() * 360) + 'deg"><i style="--s:' + (10 + Math.random() * 6).toFixed(1) +
        "px;--sw:" + (2.5 + Math.random() * 2).toFixed(1) + "s;--o:" + (.6 + Math.random() * .35).toFixed(2) + '">' + PETAL + "</i></span>";
    }
    box = document.createElement("div");
    box.className = "petals";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = html;
    document.body.appendChild(box);
  }
  // 圖片載完才淡入；已經在快取裡的就直接顯示，不重播
  function fadeIn(root) {
    root.querySelectorAll(".fade:not(.is-loaded)").forEach(function (el) {
      var done = function () { el.classList.add("is-loaded"); };
      if (el.tagName.toLowerCase() === "img") {
        if (el.complete && el.naturalWidth) { el.classList.add("no-fade"); done(); }
        else { el.addEventListener("load", done); el.addEventListener("error", done); }
      } else { // 插畫裡的 SVG <image>：用一張看不見的圖來知道它載好了沒
        if (!el.getAttribute("href")) return; // 還沒輪到載入的封面圖（data-href）
        var im = new Image();
        im.onload = im.onerror = done;
        im.src = el.getAttribute("href");
        if (im.complete && im.naturalWidth) { el.classList.add("no-fade"); done(); }
      }
    });
  }
  function closeJump() {
    var o = document.querySelector(".jump");
    if (o) o.remove();
    document.documentElement.classList.remove("jump-open");
  }

  // ---------- 右下角快速選單：點開像一本扇形色票卡，手指沿圓弧滑可以轉 ----------
  // 7 張扇形卡以按鈕為圓心排開，每張 22.5°，一次露出 4 張（中心角 258.75° 到 191.25°）。
  // 可以無限轉：卡片排成一圈，位置 p（0＝最上面那格）超出 -1.5～5.5 就從另一頭接回來；換邊的地方在畫面外、卡片完全透明，看不出來
  var DIAL = [["days", "dDays"], ["food-jkt", "dFood"], ["stay", "dStay"], ["info", "dInfo"], ["learn", "dLearn"], ["money", "dMoney"], ["pack", "dPack"]];
  var D_STEP = 22.5, D_TOP = 270 - D_STEP / 2, D_LO = D_TOP - 3 * D_STEP, D_N = DIAL.length;
  // 卡片尺寸：內半徑 38（留一圈給按鈕）、色塊從 150 開始、外半徑 250；每張兩邊各留 0.5° 縫
  var C_R0 = 38, C_R1 = 150, C_R = 250, C_HALF = (D_STEP / 2 - .5) * Math.PI / 180;
  var C_H = Math.ceil(2 * C_R * Math.sin(C_HALF)) + 2, C_MID = C_H / 2;
  function sector(r0, r1) {
    var c = Math.cos(C_HALF), s = Math.sin(C_HALF), f = function (n) { return Math.round(n * 100) / 100; };
    return "M" + f(r0 * c) + " " + f(C_MID - r0 * s) + "L" + f(r1 * c) + " " + f(C_MID - r1 * s) +
      "A" + r1 + " " + r1 + " 0 0 1 " + f(r1 * c) + " " + f(C_MID + r1 * s) +
      "L" + f(r0 * c) + " " + f(C_MID + r0 * s) + "A" + r0 + " " + r0 + " 0 0 0 " + f(r0 * c) + " " + f(C_MID - r0 * s) + "Z";
  }
  var C_CARD = sector(C_R0, C_R), C_BAND = sector(C_R0, C_R1);
  var dial = null, dialItems = [], dialOpen = false, dialLang = null, dRot = 0, openToken = 0, cardP = [], wrapTimer = null;
  // 按鈕可以拖到左下角（左撇子用左手大拇指）。左邊時整個轉盤左右鏡像：程式裡的角度照右邊算，最後才換成螢幕角度
  var dialLeft = false;
  try { dialLeft = localStorage.getItem("trip-dial-side") === "left"; } catch (e) {}
  function scrAng(th) { return dialLeft ? 180 - th : th; }
  var DIAL_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><ellipse cx="12" cy="6.2" rx="3.3" ry="5.4"/><ellipse cx="12" cy="6.2" rx="3.3" ry="5.4" transform="rotate(90 12 12)"/><ellipse cx="12" cy="6.2" rx="3.3" ry="5.4" transform="rotate(180 12 12)"/><ellipse cx="12" cy="6.2" rx="3.3" ry="5.4" transform="rotate(270 12 12)"/></g><circle cx="12" cy="12" r="2.3" fill="var(--ink)"/></svg>';
  function dialSection(h) {
    if (/^d12\d\d$/.test(h) || h === "days") return "days";
    if (h.indexOf("food") === 0) return "food-jkt";
    return h;
  }
  // 卡片外緣再往外一點的弧線，提示可以轉（字印在一條深色弧形底帶上）
  var H_R = C_R + 22, H_MID = 226, H_TEXT = H_R - 4.6; // 字的基線往內 0.35em，字身才會正好在底帶中間
  function arcPath(r, from, to) {
    var a = from * Math.PI / 180, b = to * Math.PI / 180, f = function (n) { return Math.round(n * 10) / 10; };
    return "M" + f(r * Math.cos(a)) + " " + f(r * Math.sin(a)) + "A" + r + " " + r + " 0 0 1 " + f(r * Math.cos(b)) + " " + f(r * Math.sin(b));
  }
  // 弧線都順時針畫（字頭朝外、不會倒過來），左邊時中心角換到右上方
  function hintMid() { var m = scrAng(H_MID); return (m % 360 + 360) % 360; }
  function hintArc() { return arcPath(H_TEXT, hintMid() - 40, hintMid() + 40); }
  function sizeHint() {
    var len = 120;
    try { len = dial.querySelector(".dial-hint text").getComputedTextLength() || len; } catch (err) {}
    var half = (len / 2 + 12) / H_R * 180 / Math.PI; // 底帶剛好比字長一點
    dial.querySelector("#dialArc").setAttribute("d", hintArc());
    dial.querySelector(".dial-hint-band").setAttribute("d", arcPath(H_R, hintMid() - half, hintMid() + half));
  }
  function buildDial() {
    dial = document.createElement("div");
    dial.className = "dial";
    dial.innerHTML = '<div class="dial-scrim" aria-hidden="true"></div><div class="dial-hub">' +
      '<svg class="dial-hint" viewBox="-300 -300 600 600" aria-hidden="true"><path id="dialArc" d="' + hintArc() + '" fill="none"/><path class="dial-hint-band" d=""/>' +
      '<text text-anchor="middle"><textPath href="#dialArc" startOffset="50%" text-anchor="middle"></textPath></text></svg>' +
      '<nav class="dial-items" inert></nav>' +
      '<button type="button" class="dial-btn" aria-expanded="false">' + DIAL_IC + ICON.x + "</button></div>";
    if (dialLeft) dial.classList.add("is-left");
    document.body.appendChild(dial);
    var btn = dial.querySelector(".dial-btn"), hub = dial.querySelector(".dial-hub");
    btn.addEventListener("click", function () {
      if (btn.dataset.moved) return; // 剛拖完按鈕，不算點擊
      dialOpen ? closeDial() : openDial();
    });
    // 按住小花拖到另一邊，放開吸到最近的下角，記在這支手機上
    var mv = null;
    btn.addEventListener("pointerdown", function (e) {
      if (dialOpen || (e.pointerType === "mouse" && e.button !== 0)) return;
      mv = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false };
    });
    btn.addEventListener("pointermove", function (e) {
      if (!mv || e.pointerId !== mv.id) return;
      var dx = e.clientX - mv.x, dy = e.clientY - mv.y;
      if (!mv.on) {
        if (Math.hypot(dx, dy) < 8) return;
        mv.on = true;
        try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        dial.classList.add("is-moving");
      }
      hub.style.transition = "none";
      hub.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    function endMove(e) {
      if (!mv || e.pointerId !== mv.id) return;
      if (mv.on) {
        var before = btn.getBoundingClientRect();
        setDialSide(before.left + before.width / 2 < window.innerWidth / 2);
        hub.style.transform = "none";
        var after = btn.getBoundingClientRect();
        // 從放手的位置滑到新的角落
        hub.style.transform = "translate(" + (before.left - after.left) + "px," + (before.top - after.top) + "px)";
        void hub.offsetWidth;
        hub.style.transition = "transform .38s cubic-bezier(.2, .9, .3, 1.15)";
        hub.style.transform = "none";
        dial.classList.remove("is-moving");
        btn.dataset.moved = "1";
        setTimeout(function () { delete btn.dataset.moved; }, 0);
      }
      mv = null;
    }
    btn.addEventListener("pointerup", endMove);
    btn.addEventListener("pointercancel", endMove);
    dial.querySelector(".dial-scrim").addEventListener("click", function () { closeDial(); });
    // 拖曳轉盤：在卡片或旁邊暗色背景上都可以拖；手指移動超過 6px 才算轉，沒移動就照常點選（點背景＝收起）
    var drag = null;
    dial.addEventListener("pointerdown", function (e) {
      if (!dialOpen || e.target.closest(".dial-btn") || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (e.pointerType === "mouse") e.preventDefault(); // 滑鼠按住拖時不要選到字
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, a: dialAngle(e), rot: dRot, moved: false, t: e.timeStamp, v: 0 };
    });
    dial.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
        drag.moved = true;
        try { dial.setPointerCapture(e.pointerId); } catch (err) {}
        dial.classList.add("is-dragging");
      }
      var a = dialAngle(e), d = a - drag.a;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      drag.a = a;
      drag.rot += d;
      var dt = Math.max(1, e.timeStamp - drag.t);
      drag.v = drag.v * .5 + (d / dt) * .5; // 度／毫秒，放手時用來判斷甩的方向
      drag.t = e.timeStamp;
      dRot = drag.rot;
      placeDial("drag");
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        if (e.timeStamp - drag.t > 80) drag.v = 0; // 停住才放手就不算甩
        var aim = drag.rot + Math.max(-D_STEP, Math.min(D_STEP, drag.v * 100)); // 甩一下最多多轉一格
        dRot = Math.round(aim / D_STEP) * D_STEP;
        dial.classList.remove("is-dragging");
        placeDial("snap");
        dial.dataset.justDragged = "1";
        setTimeout(function () { delete dial.dataset.justDragged; }, 0);
      }
      drag = null;
    }
    dial.addEventListener("pointerup", endDrag);
    dial.addEventListener("pointercancel", endDrag);
    // 拖曳完放手不算點擊；點目前這頁就只收起來
    dial.addEventListener("click", function (e) {
      if (dial.dataset.justDragged) { e.preventDefault(); e.stopPropagation(); return; }
      var a = e.target.closest(".dial-item");
      if (!a) return;
      if (a.classList.contains("is-cur") && (a.getAttribute("href") === location.hash || a.dataset.k === "food-jkt")) { e.preventDefault(); closeDial(); }
    }, true);
    // 電腦用滑鼠拖：不讓瀏覽器把它當成「拖曳連結／圖片」搶走手勢
    dial.addEventListener("dragstart", function (e) { e.preventDefault(); });
    // 電腦用滾輪或觸控板也能轉：累積滾動量，每 60 單位轉一格，觸控板才不會一下轉到底
    var wheelAcc = 0, wheelTimer = null;
    dial.addEventListener("wheel", function (e) {
      if (!dialOpen) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      wheelAcc += dy;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { wheelAcc = 0; }, 220);
      while (Math.abs(wheelAcc) >= 60) {
        var dir = wheelAcc > 0 ? 1 : -1;
        wheelAcc -= dir * 60;
        turnDial(dir);
      }
    }, { passive: false });
    // 用鍵盤移到看不到的卡片時，自動轉過去
    dial.querySelector(".dial-items").addEventListener("focusin", function (e) {
      var i = dialItems.indexOf(e.target.closest(".dial-item"));
      if (i < 0) return;
      var p = Math.round(cardP[i]);
      if (p < 0) { dRot += p * D_STEP; placeDial("snap"); }
      else if (p > 3) { dRot += (p - 3) * D_STEP; placeDial("snap"); }
    });
  }
  function turnDial(dir) { dRot += dir * D_STEP; placeDial("snap"); }
  function dialAngle(e) {
    var b = dial.querySelector(".dial-btn").getBoundingClientRect();
    var a = scrAng(Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI);
    return (a % 360 + 360) % 360;
  }
  // p 換回 -1.5～5.5 之間（一圈 7 格）
  function wrapP(p) { return ((p + 1.5) % D_N + D_N) % D_N - 1.5; }
  function pTheta(p) { return D_TOP - p * D_STEP; }
  // 看得到的範圍內完全不透明，超出範圍 30° 內慢慢淡掉
  function dialVis(th) { var out = Math.max(0, D_LO - 1 - th, th - D_TOP - 1); return Math.max(0, 1 - out / 30); }
  function dialTf(th, s) { return "rotate(" + scrAng(th) + "deg) scale(" + s + ")"; }
  // mode：drag 跟著手指不加動畫；snap 放手對齊；open 展開時一張接一張從圓心轉出來
  function inRange(p) { return p >= -1.5 && p < D_N - 1.5; }
  function placeDial(mode) {
    var k = dRot / D_STEP, targets = [], jumped = false;
    clearTimeout(wrapTimer);
    dialItems.forEach(function (el, i) {
      var base = i - k, prev = cardP[i], p;
      if (mode !== "snap" || prev == null) p = wrapP(base); // 跟著手指或剛打開：直接放到範圍內（換邊發生在看不見的地方）
      else {
        p = base + D_N * Math.round((prev - base) / D_N); // 往最近的方向轉
        // 已經在畫面外、還要繼續往外走的卡：先在看不見的地方移到另一頭，再從那頭滑進來
        if (!inRange(p) && !inRange(prev)) {
          p = wrapP(p);
          var from = prev + D_N * Math.round((p - prev) / D_N);
          el.style.transition = "none";
          el.style.transform = dialTf(pTheta(from), 1);
          el.style.opacity = 0;
          jumped = true;
        }
      }
      targets.push(p);
    });
    if (jumped) void dial.offsetWidth;
    dialItems.forEach(function (el, i) {
      var p = cardP[i] = targets[i];
      var th = pTheta(p), o = dialVis(th);
      if (mode === "drag") el.style.transition = "none";
      else if (mode === "open") {
        var wait = Math.max(0, Math.round(p)) * 70;
        el.style.transition = "transform .66s cubic-bezier(.22, 1.12, .36, 1) " + wait + "ms, opacity .22s ease " + wait + "ms";
      } else el.style.transition = "transform .42s cubic-bezier(.25, 1.15, .45, 1), opacity .3s ease";
      el.style.transform = dialTf(th, 1);
      el.style.opacity = o;
      el.classList.toggle("is-off", o < .5);
    });
    if (mode === "snap") wrapTimer = setTimeout(wrapCards, 600);
  }
  // 轉完後，跑出範圍外（完全透明）的卡片悄悄移到另一頭
  function wrapCards() {
    if (!dialOpen) return;
    dRot = ((dRot % (D_N * D_STEP)) + D_N * D_STEP) % (D_N * D_STEP); // 轉了很多圈也不會讓數字一直變大
    dialItems.forEach(function (el, i) {
      var w = wrapP(cardP[i]);
      if (Math.abs(w - cardP[i]) < .01) return;
      cardP[i] = w;
      el.style.transition = "none";
      el.style.transform = dialTf(pTheta(w), 1);
      el.style.opacity = dialVis(pTheta(w));
    });
  }
  // 一張卡：畫面預先畫進 <canvas>（動畫時手機只需要搬動一張畫好的圖，不必重畫）；點擊只算在透明的扇形 .dial-hit 上
  function dialCard(x, i) {
    var name = u(x[1]);
    return '<a class="dial-item" href="#' + x[0] + '" data-k="' + x[0] + '" aria-label="' + esc(name) + '" draggable="false" style="z-index:' + (20 - i) + '">' +
      '<canvas class="dial-cv" aria-hidden="true"></canvas>' +
      '<svg viewBox="0 0 ' + C_R + " " + C_H + '" width="' + C_R + '" height="' + C_H + '" aria-hidden="true"><path class="dial-hit" d="' + C_CARD + '"/></svg></a>';
  }
  var cardPath = null, bandPath = null, dialImgs = {}, cardKeys = [], dialFonts = null;
  function dialPaint() {
    var cs = getComputedStyle(document.documentElement), v = function (n) { return cs.getPropertyValue(n).trim(); };
    return { bg: v("--blue-soft"), card: v("--card"), goldSoft: v("--gold-soft"), gold: v("--gold"), line: v("--line"), ink: v("--ink"), muted: v("--muted"), body: v("--f-body"), mono: v("--f-mono") };
  }
  // 小插畫：下載並解碼好才畫上去；晚到的話到了再補畫
  function dialImg(src) {
    var im = dialImgs[src];
    if (im) return im;
    im = dialImgs[src] = new Image();
    im.onload = function () {
      (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(function () { im.ready = true; drawCards(); });
    };
    im.src = src;
    return im;
  }
  // 字型：Google 字型是分片下載的，先把卡片上會用到的字載好再畫，不然畫出來會是備用字型
  function loadDialFonts() {
    if (dialFonts && dialFonts.lang === lang) return;
    var mine = dialFonts = { lang: lang, ready: false };
    var done = function () { mine.ready = true; drawCards(); };
    if (!document.fonts || !document.fonts.load) return done();
    var p = dialPaint(), text = DIAL.map(function (x) { return u(x[1]); }).join("");
    Promise.all([document.fonts.load("800 15px " + p.body, text), document.fonts.load("600 11px " + p.mono, "0123456789")])
      .catch(function () {}).then(done);
  }
  function drawCards() {
    if (!dial || !dialItems.length || !window.Path2D) return;
    if (!cardPath) { cardPath = new Path2D(C_CARD); bandPath = new Path2D(C_BAND); }
    var p = dialPaint(), dpr = Math.min(3, Math.max(1, Math.ceil(window.devicePixelRatio || 1))), pk = JSON.stringify(p);
    dialItems.forEach(function (el, i) {
      var x = DIAL[i], cur = el.classList.contains("is-cur"), src = (T.menuArt || {})[x[0]], im = src ? dialImg(src) : null;
      var ready = !!(im && im.ready), fonts = !!(dialFonts && dialFonts.ready);
      var key = [pk, cur, dialLang, dpr, ready, fonts, dialLeft].join("|");
      if (cardKeys[i] === key) return; // 沒變就不重畫
      cardKeys[i] = key;
      var cv = el.querySelector("canvas"), c = cv.getContext("2d");
      if (cv.width !== C_R * dpr) { cv.width = C_R * dpr; cv.height = C_H * dpr; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, C_R, C_H);
      c.save();
      c.clip(cardPath);
      c.fillStyle = p.bg;
      c.fillRect(0, 0, C_R, C_H);
      if (ready) { // 圖的上方朝外
        var cx = (C_R1 + C_R) / 2, sz = 112;
        c.save(); c.translate(cx, C_MID); c.rotate(Math.PI / 2); c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore();
      }
      c.fillStyle = cur ? p.goldSoft : p.card;
      c.fill(bandPath);
      c.lineWidth = cur ? 5 : 2; // 線畫在邊上、只留裡面那一半
      c.strokeStyle = cur ? p.gold : p.line;
      c.stroke(cardPath);
      c.restore();
      // 字貼著色塊交界處、沿著卡片排。按鈕在右邊時卡片朝左上，轉 180° 往圓心讀才不會倒過來；
      // 在左邊時卡片朝右上，直接往外讀，字尾對齊交界處
      var no = pad(i + 1), name = u(x[1]), fNo = "600 11px " + p.mono, fName = "800 15px " + p.body;
      c.save();
      c.translate(C_R1 - 8, C_MID);
      c.textBaseline = "middle"; c.textAlign = "left";
      c.font = fNo; var wNo = c.measureText(no).width + 7;
      c.font = fName; var wName = c.measureText(name).width;
      var x0 = 0;
      if (dialLeft) x0 = -(wNo + wName); else c.rotate(Math.PI);
      c.font = fNo; c.fillStyle = cur ? p.gold : p.muted;
      c.fillText(no, x0, 0);
      c.font = fName; c.fillStyle = cur ? p.gold : p.ink;
      c.fillText(name, x0 + wNo, 0);
      c.restore();
    });
  }
  function fillDial() {
    var cur = dialSection((location.hash || "").replace(/^#/, ""));
    if (dialLang !== lang) {
      dialLang = lang;
      var nav = dial.querySelector(".dial-items");
      nav.innerHTML = DIAL.map(dialCard).join("");
      nav.setAttribute("aria-label", u("dial"));
      dial.querySelector(".dial-hint textPath").textContent = "↻ " + u("dialHint");
      sizeHint();
      dialItems = [].slice.call(dial.querySelectorAll(".dial-item"));
      dialItems.forEach(function (el, i) { el.style.transform = dialTf(D_TOP - i * D_STEP - 150, .12); }); // 收起的位置
      cardKeys = [];
      loadDialFonts();
    }
    dialItems.forEach(function (el) {
      var here = el.dataset.k === cur;
      el.classList.toggle("is-cur", here);
      if (here) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    // 目前這頁如果在後面幾張，打開時先轉到看得到它的位置
    var ci = DIAL.map(function (x) { return x[0]; }).indexOf(cur);
    dRot = ci > 3 ? (ci - 3) * D_STEP : 0;
    cardP = dialItems.map(function (el, i) { return wrapP(i - dRot / D_STEP); });
    drawCards(); // 只重畫有變的卡（換了目前頁、深淺色或語言）
  }
  function openDial() {
    if (!dial || dialOpen) return;
    dialOpen = true;
    fillDial();
    // 每張卡先縮在按鈕裡、往回轉 150°，接著一張接一張一邊轉一邊長大到定位
    dialItems.forEach(function (el, i) {
      el.style.transition = "none";
      el.style.transform = dialTf(pTheta(cardP[i]) - 150, .12);
      el.style.opacity = 0;
    });
    void dial.offsetWidth;
    dial.classList.add("is-open");
    dial.querySelector(".dial-items").removeAttribute("inert");
    var b = dial.querySelector(".dial-btn");
    b.setAttribute("aria-expanded", "true");
    b.setAttribute("aria-label", u("close"));
    // 等兩格畫面（約 0.03 秒）再開始轉：手機第一次準備卡片的時間不會吃掉動畫，動畫一定從頭完整播
    var tk = ++openToken, started = false;
    var start = function () { if (started || !dialOpen || tk !== openToken) return; started = true; placeDial("open"); };
    requestAnimationFrame(function () { requestAnimationFrame(start); });
    setTimeout(start, 250); // 萬一畫面回呼沒來（例如分頁剛切回來），0.25 秒後也照樣開始
  }
  function closeDial(now) {
    if (!dial || !dialOpen) return;
    dialOpen = false;
    openToken++;
    dial.classList.remove("is-open", "is-dragging");
    dial.querySelector(".dial-items").setAttribute("inert", "");
    var b = dial.querySelector(".dial-btn");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", u("dial"));
    if (dial.contains(document.activeElement)) b.focus({ preventScroll: true });
    // 反過來：轉回去、縮回按鈕
    var n = dialItems.length;
    dialItems.forEach(function (el, i) {
      var wait = now ? 0 : (n - 1 - i) * 25;
      el.style.transition = now ? "none" : "transform .32s cubic-bezier(.5, 0, .75, 0) " + wait + "ms, opacity .2s ease " + (wait + 110) + "ms";
      el.style.transform = dialTf(pTheta(cardP[i]) - 110, .12);
      el.style.opacity = 0;
    });
  }
  function setDialSide(left) {
    dialLeft = left;
    try { localStorage.setItem("trip-dial-side", left ? "left" : "right"); } catch (e) {}
    if (!dial) return;
    dial.classList.toggle("is-left", left);
    sizeHint();
    drawCards(); // 字的方向跟著換
  }
  // ---------- 學印尼文：喇叭擺在每句第一行的尾巴、對齊第一行的中線 ----------
  // 文字右邊固定留了喇叭的位置（.ph-top 的 padding-right），所以第一行尾巴一定放得下
  function placeSays() {
    app.querySelectorAll(".ph-top").forEach(function (top) {
      var id = top.querySelector(".ph-id"), b = top.querySelector(".say");
      if (!id || !b) return;
      var r = document.createRange();
      r.selectNodeContents(id);
      var lines = [].filter.call(r.getClientRects(), function (q) { return q.width > 0; });
      if (!lines.length) return;
      var first = lines[0], right = first.right;
      lines.forEach(function (q) { if (Math.abs(q.top - first.top) < 2) right = Math.max(right, q.right); });
      var box = top.getBoundingClientRect();
      b.style.left = Math.round(right - box.left + 10) + "px";
      b.style.top = Math.round((first.top + first.bottom) / 2 - box.top - b.offsetHeight / 2) + "px";
    });
  }
  // ---------- 頁尾輪播：每 4.5 秒換一條，點一下立刻換；分頁在背景時不換 ----------
  var tickTimer = null;
  function nextTip(t) {
    var items = t.querySelectorAll(".tick-i"), cur = t.querySelector(".tick-i.is-on");
    var nx = items[([].indexOf.call(items, cur) + 1) % items.length];
    cur.classList.remove("is-on", "is-in"); cur.classList.add("is-out"); cur.setAttribute("aria-hidden", "true");
    nx.classList.remove("is-out"); nx.classList.add("is-on", "is-in"); nx.removeAttribute("aria-hidden");
  }
  function startTicker() {
    clearInterval(tickTimer);
    var t = app.querySelector("[data-tick]");
    if (!t) return;
    tickTimer = setInterval(function () { if (!document.hidden && t.isConnected) nextTip(t); }, 4500);
  }
  // 網頁閒下來時先把卡片建好、圖片下載並解碼，第一次打開才不會卡
  var warmTimer = null;
  function warmDial() {
    if (!dial || dialOpen || dialLang === lang || warmTimer) return;
    var go = function () {
      warmTimer = null;
      if (dialOpen || dialLang === lang) return;
      fillDial(); // 建卡片、載字型和小插畫，好了就先畫好
    };
    warmTimer = window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 600);
  }
  // 封面和 00 頁不需要；其他頁都有
  function syncDial(h) {
    var show = h !== "home" && h !== "menu";
    if (show && !dial) buildDial();
    document.documentElement.classList.toggle("has-dial", show);
    if (!dial) return;
    closeDial(true);
    dial.hidden = !show;
    dial.querySelector(".dial-btn").setAttribute("aria-label", u("dial"));
    if (show) warmDial();
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
    // 天空上的天氣：大字有 g、j、p 這種尾巴時，尾巴會伸進插畫，天氣就往下挪到尾巴下面
    app.querySelectorAll(".hero").forEach(function (h) {
      var over = h.querySelector(".hero-over"), hw = h.querySelector(".hw.has-desc"), art = h.querySelector(".hero-art");
      if (!over || !over.querySelector(".wx")) return;
      over.style.top = "";
      if (!hw) return;
      // 每個字母是行高壓扁（.78）的小區塊：從區塊底部推回基線，再加上字母尾巴實際伸到的深度，多留一點空
      var cs = getComputedStyle(hw), fs = parseFloat(cs.fontSize), ctx = (fit.c = fit.c || document.createElement("canvas").getContext("2d"));
      ctx.font = cs.fontSize + " " + cs.fontFamily;
      var m = ctx.measureText(hw.textContent), fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent;
      if (!fa || !fd) return; // 舊瀏覽器量不到就維持原位
      // 只看水平方向跟天氣重疊、而且有尾巴的字母（jakarta 的 j 在最左邊，不會擋到右邊的天氣）
      // 用版面位置（offset）算，不用 getBoundingClientRect：字母有往上跳出來的進場動畫，動畫途中量會偏低
      var wxEl = over.querySelector(".wx"), wxL = art.offsetLeft + over.offsetLeft + wxEl.offsetLeft, wxR = wxL + wxEl.offsetWidth, need = 0;
      hw.querySelectorAll(".hw-in span").forEach(function (sp) {
        if (!/[gjpqy]/.test(sp.textContent)) return;
        var l = hw.offsetLeft + sp.offsetLeft, r = l + sp.offsetWidth;
        if (r < wxL - 4 || l > wxR + 4) return;
        var bottom = hw.offsetTop + sp.offsetTop + sp.offsetHeight - art.offsetTop; // 字母區塊底部，從插畫頂端算
        var base = bottom - fd + (fa + fd - parseFloat(cs.lineHeight)) / 2;
        need = Math.max(need, base + ctx.measureText(sp.textContent).actualBoundingBoxDescent + 8);
      });
      if (need > over.offsetTop) over.style.top = need + "px";
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
    closeJump();
    stopSpeaking();
    fadeIn(app);
    placeSays();
    setPetals(!!(d && d.wedding)); // 只有 12/19、12/20 飄花瓣
    if (d) wxRefresh(d);
    syncDial(h);
    startTicker();
    closeWall();
    closeCall();
    tickClock();
    cvCur = 0; cvPos = [];
    cvShow(0);
    cvStart();
    cvLoadRest();
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
    var wpc = e.target.closest("[data-wp-close]"), wps = e.target.closest("[data-wp-step]");
    if (wpc) { if (!wpc.closest(".wp").dataset.swiped) closeWall(); return; } // 剛滑完換張，不算點背景
    if (wps) { wallShow(+wps.dataset.wpStep); return; }
    if (e.target.closest("[data-egg]")) { openEgg(); return; } // 封面左上角的星星：小彩蛋
    var cv = e.target.closest("[data-cv]");
    if (cv) { if (!cvMoved) openWall(cvCur ? cvCur - 1 : 0); return; } // 第一張（婆羅浮屠）點開就從第 1 張桌布開始
    var tk = e.target.closest("[data-tick]");
    if (tk) { nextTip(tk); startTicker(); return; } // 點輪播區＝馬上換下一條
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
    } else if (t.dataset.say) {
      speak(t);
    } else if (t.dataset.jump) {
      showJump();
    } else if (t.dataset.idr) {
      document.getElementById("idr").value = (+t.dataset.idr).toLocaleString("id-ID");
      convert("idr");
    } else if (t.dataset.call) {
      showCall(t);
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
    if (wpOpen) {
      if (e.key === "Escape") closeWall();
      else if (e.key === "ArrowRight") wallShow(1);
      else if (e.key === "ArrowLeft") wallShow(-1);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest("[data-cv]")) { e.preventDefault(); openWall(cvCur ? cvCur - 1 : 0); return; }
    if (e.key === "Escape") closeCall();
    if (e.key === "Escape") { var o = document.querySelector(".driver"); if (o) o.remove(); if (prefsOpen) setPrefsOpen(false); closeJump(); closeDial(); }
  });
  window.addEventListener("hashchange", function () { prefsOpen = false; render(); window.scrollTo(0, 0); });
  window.addEventListener("resize", function () { fit(); placeSays(); fitClock(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); placeSays(); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", function () { placeSays(); fitClock(); }); // 字型晚到，字寬會變
  render();
  // 離線版：把整個網站存一份在手機裡（sw.js），到印尼網路不穩也打得開
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
