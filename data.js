/*
  行程資料：要改行程，改這個檔案就好。
  文字格式：["中文", "Bahasa Indonesia", "English"]
  只寫一個字串的話，三種語言都顯示同一段（地名常用）。

  每一天的 items 裡有兩種東西：
    { time, t, note, place, kind, warn, options, links }  ← 行程卡片
    { go: [交通方式, 分鐘, 距離, 起點 key, 終點 key] }        ← 卡片之間的交通
  交通方式：car 開車、walk 走路
  分鐘可以寫成 [最少, 最多]
*/

window.TRIP = {
  title: ["印尼之旅", "Perjalanan ke Indonesia", "Indonesia Trip"],
  start: "2026-12-14",
  // 行程列表和住宿頁的城市橫幅：Codex 專門畫的橫幅版（1200×359 JPG）
  bands: {
    tw: { src: "img/band-tw.jpg" },
    jkt: { src: "img/band-jkt.jpg" },
    pwt: { src: "img/band-pwt.jpg" },
    yk: { src: "img/band-yk.jpg" },
    bali: { src: "img/band-bali.jpg" },
    // 餐廳頁的城市美食橫幅
    "food-jkt": { src: "img/band-food-jkt.jpg" },
    "food-pwt": { src: "img/band-food-pwt.jpg" },
    "food-yk": { src: "img/band-food-yk.jpg" },
    "food-bali": { src: "img/band-food-bali.jpg" }
  },
  // 選單每一列左邊的小插畫（key 是連到的頁面）
  menuArt: {
    days: "img/m-days.jpg", "food-jkt": "img/m-food.jpg", stay: "img/m-stay.jpg", transport: "img/m-transport.jpg", info: "img/m-info.jpg",
    learn: "img/m-learn.jpg", money: "img/m-money.jpg", pack: "img/m-pack.jpg"
  },
  // 快速前往轉盤的卡片用：Codex 照 tools/fan-template.png 畫的扇形專用直式插畫（1024×1536，主題和畫風照選單小插畫），
  // 裁出扇形那一條（尖端在下方中央、左右各 12.5°）縮成 454×1024。2026/11/06 使用者：正方形的圖只鋪得到卡片外側，靠近按鈕那截空著很可惜
  dialArt: {
    days: "img/m-days-fan.jpg", "food-jkt": "img/m-food-fan.jpg", stay: "img/m-stay-fan.jpg", transport: "img/m-transport-fan.jpg", info: "img/m-info-fan.jpg",
    learn: "img/m-learn-fan.jpg", money: "img/m-money-fan.jpg", pack: "img/m-pack-fan.jpg"
  },
  // 插畫：OpenAI Codex 生成（2026/10），1280×924 JPG；top 是圖片上緣 20% 的平均天空色，大字和漸層用它才不會有色差
  // 封面輪播：第一張是原本的婆羅浮屠，後面 6 張是可以存成手機桌布的插畫（wall/，1179×2556）
  // tag 是封面右上角的落款；第一張用「made for 桌桌's family」
  covers: [
    { art: "stupa" },
    { art: "cover1", wall: "wall/wall-1.jpg", tag: "sizihwan · kaohsiung" },
    { art: "cover2", wall: "wall/wall-2.jpg", tag: "sizihwan · kaohsiung" },
    { art: "cover3", wall: "wall/wall-3.jpg", tag: "kaohsiung harbour" },
    { art: "cover4", wall: "wall/wall-4.jpg", tag: "borobudur · java" },
    { art: "cover5", wall: "wall/wall-5.jpg", tag: "bali" },
    { art: "cover6", wall: "wall/wall-6.jpg", tag: "kaohsiung × indonesia" }
  ],
  // 天氣：12 月平均（Open-Meteo 歷史資料 2015–2024 的 12 月，rain＝一個月裡下雨 ≥1mm 的天數）；
  // 出發前 16 天內改抓 Open-Meteo 的真實預報（app.js 的 wxRefresh），座標在 wx
  climate: { jkt: { hi: 31, lo: 24, rain: 26 }, pwt: { hi: 29, lo: 23, rain: 29 }, yk: { hi: 29, lo: 23, rain: 28 }, bali: { hi: 29, lo: 24, rain: 28 }, tw: { hi: 20, lo: 15, rain: 15 } },
  wx: { jkt: [-6.20, 106.82], pwt: [-7.42, 109.23], yk: [-7.80, 110.36], bali: [-8.69, 115.17], tw: [24.99, 121.30] },
  photos: {
    stupa: { src: "img/stupa.jpg", what: "Borobudur", by: "AI (OpenAI Codex)", top: "#587bbb",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/stupa-day.jpg", top: "#7ba5d6" },
      night: { src: "img/stupa-night.jpg", sky: "img/stupa-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/stupa-night-lights.jpg", lamps: [[0.9056, 0.5779, 0.0074, "far"], [0.8958, 0.578, 0.0044, "far"], [0.0871, 0.579, 0.0043, "far"], [0.0996, 0.5828, 0.0044, "far"], [0.1279, 0.583, 0.0147, "far"], [0.2135, 0.5865, 0.0111, "far"], [0.4223, 0.5873, 0.0114, "far"], [0.0752, 0.5977, 0.0049, "far"], [0.0878, 0.5979, 0.0115, "far"], [0.3235, 0.6088, 0.0212, "far"]], top: "#21306a",
        hz: [.524, .528, .526, .528, .53, .535, .532, .526, .524, .526, .526, .522, .515, .513, .506, .498, .498, .489, .485, .481, .474, .476, .47, .461, .448, .435, .433, .444, .455, .465, .472, .472,
          .478, .485, .491, .489, .487, .483, .478, .476, .481, .481, .481, .45, .455, .487, .491, .496, .498, .496, .494, .489, .487, .491, .494, .496, .498, .502, .504, .506, .502, .496, .491, .494] } },
    cover1: { src: "img/cover-1.jpg", what: "Sizihwan, Kaohsiung", by: "AI (OpenAI Codex)", top: "#af9eab" },
    cover2: { src: "img/cover-2.jpg", what: "Sizihwan, Kaohsiung", by: "AI (OpenAI Codex)", top: "#cfa9a7" },
    cover3: { src: "img/cover-3.jpg", what: "Kaohsiung harbour", by: "AI (OpenAI Codex)", top: "#d0abae" },
    cover4: { src: "img/cover-4.jpg", what: "Borobudur", by: "AI (OpenAI Codex)", top: "#f4ad92" },
    cover5: { src: "img/cover-5.jpg", what: "Bali", by: "AI (OpenAI Codex)", top: "#c59e9e" },
    cover6: { src: "img/cover-6.jpg", what: "Kaohsiung and Indonesia", by: "AI (OpenAI Codex)", top: "#e5aa97" },
    tamansari: { src: "img/tamansari.jpg", what: "Taman Sari", by: "AI (OpenAI Codex)", top: "#5c84c0",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/tamansari-day.jpg", top: "#7da6da" },
      night: { src: "img/tamansari-night.jpg", sky: "img/tamansari-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/tamansari-night-lights.jpg", lamps: [[0.7084, 0.4393, 0.0168, "flame"], [0.1122, 0.6376, 0.0118, "flame"], [0.4176, 0.6668, 0.0062, "flame"], [0.6923, 0.6714, 0.0107, "flame"], [0.6919, 0.8164, 0.0193, "water"], [0.4179, 0.8708, 0.0123, "water"], [0.687, 0.9207, 0.0065, "water"], [0.1118, 0.9364, 0.012, "water"], [0.1123, 0.9545, 0.0058, "water"], [0.1122, 0.9663, 0.0052, "water"], [0.1108, 0.9743, 0.0048, "water"], [0.1125, 0.9848, 0.0039, "water"]], top: "#233269",
        hz: [.407, .42, .403, .366, .359, .331, .34, .329, .348, .357, .431, .463, .444, .439, .448, .444, .442, .446, .465, .465, .472, .502, .496, .504, .524, .485, .481, .468, .47, .489, .528, .528,
          .541, .552, .554, .571, .569, .569, .554, .554, .556, .461, .381, .37, .344, .329, .34, .353, .377, .457, .502, .526, .519, .522, .532, .528, .519, .483, .452, .442, .444, .452, .448, .411] } },
    slamet: { src: "img/slamet.jpg", what: "Gunung Slamet", by: "AI (OpenAI Codex)", top: "#5b7fbe",
      // 白天的版本（app.js timeSlot）：同構圖的大白天，Codex 用黃昏那張改畫（2026/11/02 使用者選中午那版：大白天不會有霧）
      day: { src: "img/slamet-day.jpg", top: "#779fd3" },
      // 晚上的版本（night.js）：同構圖的夜景、天空範圍（星星只出現在這裡）、夜空頂端色、每 1/64 寬的地平線高度（點天空才有流星）
      night: { src: "img/slamet-night.jpg", sky: "img/slamet-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/slamet-night-lights.jpg", lamps: [[0.7523, 0.677, 0.0047, "far"], [0.4734, 0.7104, 0.0043, "far"], [0.5751, 0.7215, 0.0054, "far"], [0.6361, 0.7225, 0.0044, "far"], [0.6181, 0.7267, 0.0056, "far"], [0.6031, 0.7272, 0.0056, "far"], [0.3391, 0.746, 0.0095, "far"], [0.4271, 0.7592, 0.0081, "far"], [0.4098, 0.7736, 0.0106, "far"], [0.826, 0.7738, 0.0229, "far"], [0.5667, 0.7772, 0.0058, "far"], [0.7122, 0.7777, 0.0099, "far"], [0.5311, 0.7899, 0.0085, "far"], [0.7615, 0.7905, 0.0088, "far"], [0.6717, 0.799, 0.0061, "far"], [0.5786, 0.8041, 0.0083, "far"], [0.9574, 0.8048, 0.0066, "far"], [0.6189, 0.8051, 0.0066, "far"], [0.8688, 0.8125, 0.0102, "far"], [0.7887, 0.822, 0.0238, "far"]], top: "#1e326f",
        hz: [.403, .394, .39, .411, .411, .426, .459, .498, .498, .494, .491, .491, .485, .483, .485, .483, .485, .483, .476, .472, .47, .461, .452, .446, .442, .435, .429, .424, .416, .409, .403, .396,
          .39, .379, .37, .361, .351, .346, .344, .342, .342, .342, .346, .346, .344, .353, .364, .37, .377, .385, .394, .4, .409, .416, .42, .426, .433, .437, .444, .448, .452, .457, .463, .468] } },
    city: { src: "img/city.jpg", what: "Monas, Jakarta", by: "AI (OpenAI Codex)", top: "#587aba",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet（城市光害，星星少一點：time-art.py --stars .4 --cap .55；紀念塔打燈、大樓窗戶亮著）
      day: { src: "img/city-day.jpg", top: "#75a3d9" },
      night: { src: "img/city-night.jpg", sky: "img/city-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/city-night-lights.jpg", lamps: [[0.8425, 0.5208, 0.005, "beacon"], [0.7244, 0.5598, 0.0049, "beacon"], [0.8167, 0.5831, 0.0065, "window"], [0.727, 0.5837, 0.0044, "window"], [0.9987, 0.5863, 0.0049, "beacon"], [0.3767, 0.5909, 0.0048, "beacon"], [0.8306, 0.592, 0.0048, "window"], [0.8197, 0.5921, 0.0041, "window"], [0.2571, 0.5984, 0.0049, "beacon"], [0.5684, 0.6005, 0.0051, "beacon"], [0.5038, 0.6035, 0.005, "beacon"], [0.7431, 0.6037, 0.0048, "window"], [0.7431, 0.6142, 0.0048, "window"], [0.8901, 0.616, 0.005, "beacon"], [0.743, 0.6213, 0.004, "window"], [0.8277, 0.6256, 0.0047, "window"], [0.497, 0.6285, 0.0046, "window"], [0.5721, 0.6298, 0.0049, "window"], [0.743, 0.6299, 0.0048, "window"], [0.5817, 0.63, 0.0051, "window"], [0.8156, 0.6366, 0.0041, "window"], [0.8216, 0.6368, 0.0052, "window"], [0.8281, 0.6368, 0.0044, "window"], [0.743, 0.638, 0.0047, "window"], [0.743, 0.6452, 0.004, "window"], [0.5632, 0.6499, 0.0043, "window"], [0.743, 0.6533, 0.0047, "window"], [0.5719, 0.6595, 0.0058, "window"], [0.743, 0.6611, 0.0048, "window"], [0.5633, 0.665, 0.0043, "window"], [0.2578, 0.6678, 0.0049, "window"], [0.7429, 0.6689, 0.0046, "window"], [0.8206, 0.6729, 0.0042, "window"], [0.9469, 0.674, 0.0041, "window"], [0.572, 0.6779, 0.0046, "window"], [0.2509, 0.678, 0.0043, "window"], [0.3068, 0.6788, 0.0049, "window"], [0.3117, 0.6789, 0.0041, "window"], [0.743, 0.679, 0.0052, "window"], [0.0548, 0.6818, 0.0053, "beacon"], [0.2508, 0.6868, 0.0047, "window"], [0.4425, 0.6883, 0.0042, "window"], [0.9473, 0.6904, 0.0042, "window"], [0.7431, 0.691, 0.0051, "window"], [0.4489, 0.692, 0.0045, "window"], [0.5721, 0.6935, 0.0046, "window"], [0.9473, 0.7008, 0.0043, "window"], [0.5723, 0.7028, 0.0044, "window"], [0.3087, 0.7043, 0.0041, "window"], [0.0627, 0.7075, 0.005, "window"], [0.0535, 0.7077, 0.0042, "window"], [0.4489, 0.7078, 0.0044, "window"], [0.8211, 0.7087, 0.0048, "window"], [0.8319, 0.7087, 0.0049, "window"], [0.8156, 0.7088, 0.0048, "window"], [0.2579, 0.71, 0.0046, "window"], [0.4425, 0.7132, 0.0042, "window"], [0.0853, 0.716, 0.0046, "window"], [0.071, 0.7163, 0.0072, "window"], [0.0627, 0.7164, 0.0048, "window"], [0.4489, 0.717, 0.0044, "window"], [0.5083, 0.719, 0.0044, "window"], [0.5142, 0.7193, 0.0046, "window"], [0.5261, 0.7193, 0.0099, "window"], [0.2579, 0.722, 0.004, "window"], [0.4428, 0.7225, 0.0045, "window"], [0.5083, 0.7276, 0.005, "window"], [0.5207, 0.7277, 0.0044, "window"], [0.5261, 0.7277, 0.0044, "window"], [0.5317, 0.7278, 0.0044, "window"], [0.0627, 0.7295, 0.0049, "window"], [0.5082, 0.7349, 0.0043, "window"], [0.5141, 0.7349, 0.0102, "window"], [0.526, 0.7349, 0.0041, "window"], [0.0537, 0.7399, 0.0045, "window"], [0.0626, 0.7401, 0.0053, "window"], [0.0852, 0.7402, 0.0048, "window"], [0.0687, 0.7403, 0.0049, "window"], [0.1977, 0.7413, 0.0039, "window"], [0.5261, 0.7415, 0.0043, "window"], [0.2193, 0.7424, 0.0041, "window"], [0.5082, 0.7425, 0.0048, "window"], [0.8439, 0.7456, 0.0064, "window"], [0.8644, 0.7456, 0.0043, "window"], [0.8531, 0.7468, 0.0047, "window"], [0.8583, 0.7472, 0.0052, "window"], [0.477, 0.7505, 0.0044, "window"], [0.4816, 0.7509, 0.0043, "window"], [0.9077, 0.7545, 0.005, "window"], [0.897, 0.7547, 0.0057, "window"], [0.9303, 0.7547, 0.005, "window"], [0.8867, 0.7548, 0.0078, "window"], [0.9236, 0.7548, 0.0052, "window"], [0.9425, 0.7548, 0.0052, "window"], [0.9166, 0.7549, 0.0051, "window"], [0.9367, 0.7549, 0.0052, "window"], [0.8764, 0.7551, 0.0057, "window"], [0.8536, 0.7565, 0.0048, "window"], [0.845, 0.7572, 0.0066, "window"], [0.0007, 0.759, 0.005, "window"], [0.0055, 0.7591, 0.0044, "window"], [0.0104, 0.7591, 0.0045, "window"], [0.7633, 0.7621, 0.0041, "lamp"], [0.0795, 0.7648, 0.0045, "lamp"], [0.0851, 0.7651, 0.004, "lamp"], [0.9082, 0.7657, 0.0051, "lamp"], [0.8632, 0.7664, 0.0057, "lamp"], [0.8124, 0.7697, 0.0041, "lamp"], [0.4255, 0.7699, 0.0042, "lamp"], [0.0006, 0.7704, 0.0049, "lamp"], [0.0055, 0.7704, 0.0048, "lamp"], [0.0102, 0.7704, 0.004, "lamp"], [0.7632, 0.7737, 0.004, "lamp"], [0.9305, 0.7742, 0.0042, "lamp"], [0.939, 0.7761, 0.0056, "lamp"], [0.4253, 0.7773, 0.0042, "lamp"], [0.4303, 0.7776, 0.0043, "lamp"], [0.6615, 0.7782, 0.0044, "lamp"], [0.6338, 0.7806, 0.0057, "lamp"], [0.6402, 0.7834, 0.0044, "lamp"], [0.6724, 0.7859, 0.006, "lamp"], [0.7389, 0.786, 0.0061, "lamp"], [0.544, 0.8117, 0.0054, "lamp"], [0.5678, 0.8128, 0.0048, "lamp"], [0.5077, 0.8129, 0.0057, "lamp"], [0.4944, 0.8137, 0.0046, "lamp"], [0.7595, 0.8139, 0.0057, "lamp"], [0.457, 0.8141, 0.0065, "lamp"], [0.4034, 0.8143, 0.0083, "lamp"], [0.7337, 0.8144, 0.0056, "lamp"], [0.3513, 0.8156, 0.0061, "lamp"], [0.7929, 0.8157, 0.0063, "lamp"], [0.3726, 0.8159, 0.004, "lamp"], [0.323, 0.8162, 0.0066, "lamp"], [0.2875, 0.8167, 0.006, "lamp"], [0.8333, 0.8174, 0.0053, "lamp"], [0.2549, 0.8181, 0.0068, "lamp"], [0.8182, 0.8185, 0.0045, "lamp"], [0.8529, 0.8186, 0.0061, "lamp"], [0.1922, 0.8194, 0.004, "lamp"], [0.8821, 0.8201, 0.0057, "lamp"], [0.1641, 0.8205, 0.0063, "lamp"], [0.1188, 0.8215, 0.0065, "lamp"], [0.9199, 0.8216, 0.0067, "lamp"], [0.9752, 0.8234, 0.0062, "lamp"], [0.0528, 0.8235, 0.0066, "lamp"], [0.0282, 0.8238, 0.0067, "lamp"], [0.7806, 0.8289, 0.004, "lamp"], [0.7855, 0.8301, 0.0051, "lamp"], [0.5644, 0.8326, 0.0043, "lamp"], [0.7328, 0.8328, 0.0078, "lamp"], [0.746, 0.8332, 0.0048, "lamp"], [0.6447, 0.8352, 0.0088, "lamp"], [0.6733, 0.8355, 0.0053, "lamp"], [0.5593, 0.8367, 0.004, "lamp"], [0.5471, 0.848, 0.0086, "lamp"], [0.5659, 0.8487, 0.0066, "lamp"], [0.707, 0.8497, 0.004, "lamp"], [0.5364, 0.8498, 0.0044, "lamp"], [0.5823, 0.8562, 0.0041, "lamp"], [0.7681, 0.8886, 0.0079, "lamp"], [0.809, 0.8947, 0.0062, "lamp"]], top: "#222f62",
        hz: [.539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .537, .537, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539, .539,
          .539, .539, .539, .539, .539, .539, .539, .539, .526, .416, .433, .537, .539, .539, .539, .539, .539, .539, .539, .539, .539, .53, .537, .539, .539, .539, .539, .539, .539, .539, .539, .539] } },
    gate: { src: "img/gate.jpg", what: "Candi bentar", by: "AI (OpenAI Codex)", top: "#5677b5",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/gate-day.jpg", top: "#7da3d3" },
      night: { src: "img/gate-night.jpg", sky: "img/gate-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/gate-night-lights.jpg", lamps: [[0.3516, 0.7432, 0.012, "flame"], [0.624, 0.7742, 0.0193, "flame"], [0.8167, 0.7764, 0.0194, "flame"]], top: "#213063",
        hz: [.593, .591, .589, .593, .6, .604, .604, .582, .58, .58, .584, .602, .602, .6, .593, .58, .569, .563, .563, .574, .587, .595, .595, .504, .47, .461, .437, .439, .47, .463, .45, .444,
          .437, .446, .476, .519, .532, .519, .468, .431, .398, .368, .327, .504, .574, .576, .582, .587, .519, .327, .366, .398, .42, .465, .517, .522, .429, .342, .32, .329, .323, .327, .325, .348] } },
    terrace: { src: "img/terrace.jpg", what: "Tegalalang", by: "AI (OpenAI Codex)", top: "#537ac0",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/terrace-day.jpg", top: "#77a4db" },
      night: { src: "img/terrace-night.jpg", sky: "img/terrace-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/terrace-night-lights.jpg", lamps: [[0.9361, 0.6154, 0.0166, "flame"]], top: "#233262",
        hz: [.45, .455, .463, .465, .463, .47, .476, .478, .481, .481, .478, .476, .476, .474, .47, .465, .463, .461, .455, .452, .45, .446, .439, .435, .433, .437, .444, .446, .444, .446, .45, .455,
          .452, .448, .444, .442, .442, .446, .448, .448, .442, .437, .431, .429, .42, .413, .407, .405, .409, .418, .422, .424, .426, .433, .433, .418, .4, .398, .413, .42, .422, .411, .394, .387] } },
    sea: { src: "img/sea.jpg", what: "Kelingking, Nusa Penida", by: "AI (OpenAI Codex)", top: "#6081bf",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/sea-day.jpg", top: "#7da8d8" },
      night: { src: "img/sea-night.jpg", sky: "img/sea-night-sky.png", top: "#1f3169",
        hz: [.316, .32, .325, .327, .329, .331, .333, .335, .338, .34, .342, .344, .346, .346, .348, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351,
          .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351, .351] } },
    cliff: { src: "img/cliff.jpg", what: "Uluwatu", by: "AI (OpenAI Codex)", top: "#577bb6",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet（星星在雲層上方就淡掉：time-art.py --cap .44）
      day: { src: "img/cliff-day.jpg", top: "#7ea6db" },
      night: { src: "img/cliff-night.jpg", sky: "img/cliff-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/cliff-night-lights.jpg", lamps: [[0.7052, 0.4585, 0.0049, "far"], [0.7483, 0.4619, 0.0054, "far"]], top: "#1e2e60",
        hz: [.426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426,
          .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .426, .416, .39, .411, .424, .424, .426, .426, .426, .426, .426, .422, .418, .422, .426, .426, .426, .426, .426, .424, .424] } },
    volcano: { src: "img/volcano.jpg", what: "Gunung Batur", by: "AI (OpenAI Codex)", top: "#547abb",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/volcano-day.jpg", top: "#739fd7" },
      night: { src: "img/volcano-night.jpg", sky: "img/volcano-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/volcano-night-lights.jpg", lamps: [[0.3499, 0.6949, 0.0102, "far"], [0.4094, 0.6975, 0.0172, "far"], [0.4345, 0.6994, 0.0061, "far"], [0.3965, 0.7463, 0.0121, "far"], [0.3848, 0.7506, 0.0043, "far"]], top: "#212d66",
        hz: [.587, .584, .58, .578, .58, .58, .582, .584, .589, .593, .595, .593, .589, .591, .591, .589, .582, .58, .578, .574, .574, .571, .567, .565, .569, .569, .565, .561, .561, .558, .554, .55,
          .554, .556, .556, .558, .552, .541, .535, .535, .532, .5, .489, .476, .461, .461, .528, .526, .524, .524, .517, .506, .5, .494, .481, .481, .487, .485, .478, .476, .485, .494, .502, .509] } },
    lake: { src: "img/lake.jpg", what: "Pura Ulun Danu Beratan", by: "AI (OpenAI Codex)", top: "#4e77bc",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet
      day: { src: "img/lake-day.jpg", top: "#7ca5d7" },
      night: { src: "img/lake-night.jpg", sky: "img/lake-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/lake-night-lights.jpg", lamps: [[0.7614, 0.6666, 0.0042, "flame"], [0.7645, 0.6807, 0.0043, "flame"], [0.6589, 0.701, 0.0202, "flame"], [0.7201, 0.7031, 0.0096, "flame"], [0.4584, 0.7132, 0.0136, "flame"], [0.8588, 0.7175, 0.0129, "flame"], [0.4868, 0.7204, 0.0102, "flame"], [0.5499, 0.7254, 0.0127, "flame"], [0.723, 0.8214, 0.0052, "water"], [0.5506, 0.8316, 0.023, "water"], [0.4626, 0.8344, 0.0188, "water"], [0.8582, 0.8397, 0.0179, "water"], [0.7223, 0.8443, 0.0156, "water"], [0.6609, 0.846, 0.0264, "water"], [0.6612, 0.8843, 0.0045, "water"]], top: "#213269",
        hz: [.539, .543, .552, .556, .556, .552, .55, .552, .548, .543, .543, .548, .548, .539, .535, .53, .528, .532, .537, .541, .537, .53, .524, .522, .513, .506, .502, .502, .504, .5, .491, .487,
          .487, .489, .496, .5, .504, .504, .502, .504, .506, .491, .431, .338, .335, .409, .481, .483, .474, .465, .457, .455, .461, .465, .47, .463, .455, .452, .45, .442, .435, .437, .442, .448] } },
    wedding: { src: "img/wedding.jpg", what: "Pernikahan", by: "AI (OpenAI Codex)", top: "#a25d30" },
    plane: { src: "img/plane.jpg", what: "Berangkat", by: "AI (OpenAI Codex)", top: "#5279be",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet（星星繞過飛機：time-art.py --skip .335,.40,.53 --skip .40,.67,.565 --skip .67,.88,.535）
      day: { src: "img/plane-day.jpg", top: "#77a0d4" },
      night: { src: "img/plane-night.jpg", sky: "img/plane-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/plane-night-lights.jpg", lamps: [[0.5314, 0.4187, 0.0048, "strobe"], [0.4132, 0.4501, 0.0049, "beacon"]], top: "#212f67",
        hz: [.504, .504, .509, .517, .524, .53, .532, .53, .528, .522, .524, .53, .541, .545, .545, .548, .554, .558, .561, .561, .556, .556, .565, .569, .569, .569, .567, .552, .556, .556, .543, .537,
          .532, .528, .476, .47, .487, .489, .491, .498, .504, .494, .509, .506, .504, .504, .5, .498, .489, .474, .472, .483, .522, .539, .565, .615, .617, .617, .619, .621, .623, .621, .623, .623] } },
    home: { src: "img/home.jpg", what: "Pulang", by: "AI (OpenAI Codex)", top: "#557ab6",
      // 白天、晚上的版本（2026/11/03）：同構圖，Codex 用黃昏那張改畫，做法同 slamet（星星繞過飛機：time-art.py --skip .50,.88,.535 --cap .58）
      day: { src: "img/home-day.jpg", top: "#78a2d7" },
      night: { src: "img/home-night.jpg", sky: "img/home-night-sky.png",
        // 燈火（tools/night-lights.py 從夜景拆出來）：[x, y, 半徑, 種類]，種類見 night.js 的 LIGHT
        lights: "img/home-night-lights.jpg", lamps: [[0.8165, 0.3897, 0.0049, "beacon"], [0.8499, 0.4362, 0.004, "strobe"], [0.862, 0.7071, 0.009, "far"], [0.8317, 0.7169, 0.0091, "far"], [0.8981, 0.73, 0.0051, "far"], [0.3878, 0.7696, 0.005, "flame"], [0.2495, 0.7926, 0.0044, "flame"], [0.5264, 0.7983, 0.0053, "flame"], [0.0977, 0.8703, 0.0064, "flame"]], top: "#1e2d67",
        hz: [.561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .561, .556, .554, .556, .558, .561, .561, .561, .561,
          .561, .561, .541, .515, .509, .509, .506, .478, .485, .496, .498, .496, .491, .472, .461, .457, .476, .489, .5, .502, .491, .498, .55, .558, .556, .554, .545, .545, .543, .539, .53, .535] } },
    "p-info": { src: "img/p-info.jpg", what: "Bandara Ngurah Rai", by: "AI (OpenAI Codex)", top: "#557ab6" },
    "p-transport": { src: "img/p-transport.jpg", what: "Kereta di Jawa", by: "AI (OpenAI Codex)", top: "#5579b4" },
    "p-learn": { src: "img/p-learn.jpg", what: "Pasar", by: "AI (OpenAI Codex)", top: "#5a78ac" },
    "p-money": { src: "img/p-money.jpg", what: "Warung", by: "AI (OpenAI Codex)", top: "#5478b5" },
    "p-pack": { src: "img/p-pack.jpg", what: "Dermaga", by: "AI (OpenAI Codex)", top: "#6086c0" }
  },
  end: "2026-12-31",

  cities: {
    tw:   ["台灣", "Taiwan", "Taiwan"],
    jkt:  ["雅加達", "Jakarta", "Jakarta"],
    pwt:  ["普禾加多", "Purwokerto", "Purwokerto"],
    yk:   ["日惹", "Yogyakarta", "Yogyakarta"],
    bali: ["峇里島", "Bali", "Bali"]
  },

  // 地點：n 名稱、a 區域（給司機看）、q 導航用的搜尋字、map 地圖連結
  places: {
    tpe:   { n: "桃園國際機場 T1", a: "Taoyuan, Taiwan", q: "Taoyuan International Airport Terminal 1" },
    cgk:   { n: "Soekarno-Hatta International Airport T3 (CGK)", a: "Tangerang, Banten", q: "Soekarno-Hatta International Airport Terminal 3" },
    harris:{ n: "HARRIS Suites Puri Mansion", a: "Puri Mansion, Kembangan, Jakarta Barat", q: "HARRIS Suites Puri Mansion", map: "https://maps.app.goo.gl/ENnsafzJh2t17X3Z9" },
    anneve:{ n: "Ann & Eve Atelier", a: "Taman Ratu, Kedoya Utara, Jakarta Barat", q: "Ann & Eve Atelier Kedoya", map: "https://maps.app.goo.gl/bZt6miKM5SF92m2K9" },
    bsteak:{ n: "B'Steak Grill & Pancake Greenville", a: "Green Ville, Duri Kepa, Jakarta Barat", q: "B'Steak Grill & Pancake Greenville", map: "https://maps.app.goo.gl/ipBZyYfBnsstAsqf7" },
    republik:{ n: "Republik Seafood PIK", a: "Pantai Indah Kapuk, Jakarta Utara", q: "Republik Seafood PIK", map: "https://maps.app.goo.gl/aJtJxdHnJnfwGx3V8" },
    pagisore:{ n: "RM Pagi Sore Kedoya", a: "Kedoya, Jakarta Barat", q: "-6.1707286,106.7647468", map: "https://maps.app.goo.gl/DtxbQA7ZNcX3a6Pu6" },
    gambir:{ n: "Stasiun Gambir", a: "Gambir, Jakarta Pusat", q: "Stasiun Gambir" },
    senen: { n: "Stasiun Pasar Senen", a: "Senen, Jakarta Pusat", q: "Stasiun Pasar Senen" },
    pwtst: { n: "Stasiun Purwokerto", a: "Purwokerto, Banyumas", q: "Stasiun Purwokerto" },
    jhh:   { n: "Java Heritage Hotel Purwokerto", a: "Jl. Dr. Angka, Purwokerto", q: "Java Heritage Hotel Purwokerto", map: "https://maps.app.goo.gl/sojcETc5W7BYkpNW9" },
    lina:  { n: "Lina Gunawan Salon & Bridal House", a: "Jl. Pramuka, Purwokerto Selatan", q: "Lina Gunawan Salon & Bridal House Purwokerto", map: "https://maps.app.goo.gl/tPqtUs43usdCaPhu8" },
    baturraden:{ n: "Lokawisata Baturraden", a: "Baturraden, Banyumas", q: "Lokawisata Baturraden", map: "https://maps.app.goo.gl/nPFchggCRJSLxSJAA" },
    furama:{ n: "Furama Resto & Cuisine", a: "Jl. Dr. Angka, Purwokerto Utara", q: "Furama Resto & Cuisine Purwokerto", map: "https://maps.app.goo.gl/RksDL7Ppu8dPcecN8" },
    ykst:  { n: "Stasiun Yogyakarta (Tugu)", a: "Malioboro, Yogyakarta", q: "Stasiun Yogyakarta Tugu" },
    keraton:{ n: "Keraton Yogyakarta", a: "Kraton, Yogyakarta", q: "Keraton Ngayogyakarta Hadiningrat", map: "https://maps.app.goo.gl/KhoPkgCVEAdiAE8Y7" },
    tamansari:{ n: "Taman Sari", a: "Kraton, Yogyakarta", q: "Taman Sari Yogyakarta", map: "https://maps.app.goo.gl/LaY4f4vdkvv12QwM9" },
    malioboro:{ n: "Jalan Malioboro", a: "Yogyakarta", q: "Malioboro Yogyakarta", map: "https://maps.app.goo.gl/Wm9pKmmSpi3phQte6" },
    villa: { n: "Villa Juliette (Alterstay Jogja)", a: "Jalan Pendul, Sedayu, Bantul", q: "-7.834125,110.2669715", map: "https://maps.app.goo.gl/38MMLbHUBQCGB7FM8" },
    borobudur:{ n: "Candi Borobudur", a: "Borobudur, Magelang", q: "Candi Borobudur" },
    mendut:{ n: "Candi Mendut", a: "Mungkid, Magelang", q: "Candi Mendut" },
    demenake:{ n: "Warung De'menake", a: "Candirejo, Borobudur", q: "Warung De'menake Borobudur", map: "https://maps.app.goo.gl/QDEVkgLRHAkgNUpcA" },
    silver:{ n: "Borobudur Silver Resto", a: "Mungkid, Magelang", q: "Borobudur Silver Resto", map: "https://maps.app.goo.gl/qnAbNgLS3gtTMv7UA" },
    vanbloemen:{ n: "Van Bloemen 1881", a: "Kembanglimus, Borobudur", q: "Van Bloemen 1881", map: "https://maps.app.goo.gl/uuxdTvYpVJ73pdULA" },
    yia:   { n: "Yogyakarta International Airport (YIA)", a: "Kulon Progo", q: "Yogyakarta International Airport" },
    dps:   { n: "Bandara I Gusti Ngurah Rai – Terminal Internasional (DPS)", a: "Tuban, Badung, Bali", q: "Ngurah Rai International Airport International Terminal" },
    casa:  { n: "Casa Adem", a: "Gang Lange, Seminyak, Bali", q: "Casa Adem, Gang Lange, Seminyak, Bali" },
    monkey:{ n: "Ubud Monkey Forest", a: "Ubud, Gianyar", q: "Ubud Monkey Forest" },
    tegalalang:{ n: "Tegalalang Rice Terrace", a: "Tegalalang, Gianyar", q: "Tegalalang Rice Terrace" },
    sanur: { n: "Pelabuhan Sanur", a: "Sanur, Denpasar", q: "Sanur Harbour Bali" },
    benoa: { n: "Tanjung Benoa", a: "Nusa Dua, Badung", q: "Tanjung Benoa Bali" },
    uluwatu:{ n: "Pura Luhur Uluwatu", a: "Pecatu, Badung", q: "Pura Luhur Uluwatu" },
    penglipuran:{ n: "Desa Penglipuran", a: "Bangli", q: "Desa Penglipuran Bangli" },
    kintamani:{ n: "Penelokan, Kintamani", a: "Kintamani, Bangli", q: "Penelokan Kintamani" },
    ulundanu:{ n: "Pura Ulun Danu Beratan", a: "Bedugul, Tabanan", q: "Pura Ulun Danu Beratan" },
    handara:{ n: "Handara Gate", a: "Pancasari, Buleleng", q: "Handara Gate" },
    krisna:{ n: "Krisna Oleh-Oleh Bali", a: "Sunset Road, Kuta", q: "Krisna Oleh-Oleh Sunset Road" }
  },

  days: [
    {
      date: "2026-12-14", city: "tw", word: "berangkat", art: "plane",
      title: ["出發前一晚", "Malam sebelum berangkat", "The night before"],
      items: [
        { time: ["下午", "Sore", "PM"], t: ["前往桃園", "Berangkat ke Taoyuan", "Head to Taoyuan"],
          note: ["先住桃園，隔天一早搭機", "Menginap di Taoyuan, besok pagi terbang", "Stay near the airport for the early flight"] }
      ]
    },
    {
      date: "2026-12-15", city: "jkt", word: "jakarta", art: "city",
      title: ["抵達雅加達・試禮服", "Tiba di Jakarta · fitting gaun", "Arrive in Jakarta · dress fitting"],
      items: [
        { time: "6:00", t: ["桃園機場報到", "Check-in di Bandara Taoyuan", "Check in at Taoyuan Airport"], place: "tpe" },
        { time: "9:10", kind: "flight", t: ["華航 CI761 飛雅加達", "China Airlines CI761 ke Jakarta", "China Airlines CI761 to Jakarta"],
          note: ["桃園 T1 出發，飛行約 5.5 小時", "Dari Taoyuan T1, terbang ± 5,5 jam", "From Taoyuan T1, about 5.5 hours"] },
        { time: "13:40", t: ["抵達雅加達機場 T3", "Tiba di Bandara Soekarno-Hatta T3", "Land at Soekarno-Hatta T3"], place: "cgk",
          note: ["雅加達比台灣慢 1 小時，手錶記得調", "Jakarta 1 jam lebih lambat dari Taiwan", "Jakarta is 1 hour behind Taiwan"] },
        { go: ["car", 28, "20.7 km", "cgk", "harris"] },
        { time: "14:30", kind: "stay", t: ["入住飯店", "Check-in hotel", "Check in at the hotel"], place: "harris" },
        { go: ["car", 30, "9.7 km", "harris", "anneve"] },
        { time: "15:30", t: ["試訂婚禮服", "Fitting gaun lamaran", "Engagement dress fitting"], place: "anneve",
          note: ["店家下午 5 點休息", "Tutup pukul 17.00", "Closes at 5 pm"] },
        { time: "17:00", t: ["晚餐（三選一）", "Makan malam (pilih satu)", "Dinner (pick one)"],
          options: [
            { place: "bsteak",   tag: ["西餐・牛排", "Steak", "Steak"], go: ["car", 3, "850 m"] },
            { place: "pagisore", tag: ["印尼菜", "Masakan Indonesia", "Indonesian"], go: ["car", 4, "1.1 km"] },
            { place: "republik", tag: ["海鮮", "Seafood", "Seafood"], go: ["car", 42, "16.6 km"] }
          ],
          note: ["交通時間是從禮服店出發", "Waktu tempuh dari butik", "Drive times are from the dress shop"] },
        { go: ["car", [29, 36], "9–14 km", "pagisore", "harris"], label: ["從餐廳回飯店", "Dari restoran ke hotel", "Restaurant to hotel"] },
        { time: "20:00", t: ["回飯店休息", "Kembali ke hotel, istirahat", "Back to the hotel to rest"], place: "harris" }
      ]
    },
    {
      date: "2026-12-16", city: "pwt", word: "purwokerto", art: "slamet",
      title: ["搭火車到普禾加多", "Naik kereta ke Purwokerto", "Train to Purwokerto"],
      items: [
        { time: "6:00", t: ["準備出門", "Bersiap berangkat", "Get ready"],
          note: ["飯店早餐外帶", "Sarapan hotel dibungkus", "Take the hotel breakfast to go"] },
        { time: "6:30", t: ["最晚這時候出門去火車站", "Paling lambat berangkat ke stasiun", "Leave for the station by now"], place: "harris",
          note: ["早上雅加達很塞", "Pagi hari Jakarta macet", "Jakarta traffic is heavy in the morning"] },
        { go: ["car", [46, 54], "19–28 km", "harris", "gambir"],
          label: ["到 Gambir 或 Pasar Senen 站（哪一站待確認）", "Ke Stasiun Gambir atau Pasar Senen (belum pasti)", "To Gambir or Pasar Senen station (to be confirmed)"] },
        { time: "8:50", kind: "train", t: ["搭火車去普禾加多", "Kereta ke Purwokerto", "Train to Purwokerto"],
          note: ["車上有供餐和點心。車次待補", "Ada makanan di kereta. Nama kereta menyusul", "Meals and snacks on board. Train name to be added"] },
        { time: "13:00", t: ["抵達普禾加多站", "Tiba di Stasiun Purwokerto", "Arrive at Purwokerto Station"], place: "pwtst" },
        { go: ["car", 7, "2.4 km", "pwtst", "jhh"] },
        { kind: "stay", t: ["入住飯店", "Check-in hotel", "Check in at the hotel"], place: "jhh" },
        { time: "13:30", t: ["新娘送禮盒的東西去裝飾", "Mempelai wanita antar seserahan untuk dihias", "The bride drops off the gift boxes for decorating"] },
        { go: ["car", 9, "3.0 km", "jhh", "lina"] },
        { time: "15:00", t: ["去婚紗店", "Ke salon & bridal", "Bridal shop visit"], place: "lina" },
        { time: "18:00", t: ["晚餐", "Makan malam", "Dinner"],
          note: ["可以跟新娘的爸媽一起吃", "Bisa makan bersama orang tua mempelai wanita", "Possibly with the bride's parents"], links: [["food-pwt", ["普禾加多餐廳清單", "Daftar tempat makan Purwokerto", "Purwokerto restaurants"]]] }
      ]
    },
    {
      date: "2026-12-17", city: "pwt", word: "baturraden", art: "slamet",
      title: ["自由活動", "Hari bebas", "Free day"],
      items: [
        { go: ["car", 27, "13.3 km", "jhh", "baturraden"] },
        { t: ["可以去 Baturraden 山區走走", "Bisa jalan-jalan ke Baturraden", "Option: the hills at Baturraden"], place: "baturraden",
          note: ["行程看當天狀況", "Tergantung situasi hari itu", "Depends on how the day goes"] }
      ]
    },
    {
      date: "2026-12-18", city: "pwt", word: "bebas", art: "slamet",
      title: ["自由活動", "Hari bebas", "Free day"],
      items: [
        { t: ["逛小百貨、按摩、做頭髮", "Jalan ke mal, pijat, salon", "Shopping, massage, salon"],
          note: ["行程看當天狀況", "Tergantung situasi hari itu", "Depends on how the day goes"],
          links: [["food-pwt", ["按摩和沙龍清單", "Daftar spa & salon", "Spa & salon list"]]] }
      ]
    },
    {
      date: "2026-12-19", city: "pwt", word: "lamaran", art: "wedding", wedding: true,
      title: ["訂婚", "Lamaran", "Engagement"],
      items: [
        { time: "6:30", t: ["媽媽、姐姐開始化妝", "Mama & kakak mulai dirias", "Mom and sister start makeup"],
          note: ["在姐姐或媽媽的房間，二選一", "Di kamar kakak atau kamar mama, pilih satu", "In sister's or mom's room, pick one"] },
        { time: "9:00", t: ["新郎準備好", "Mempelai pria sudah siap", "Groom ready"],
          note: ["先跟新娘一起拍照", "Foto bersama mempelai wanita dulu", "Photos with the bride first"] },
        { go: ["walk", 3, "210 m", "jhh", "furama"], label: ["走到 Furama，就在飯店旁邊", "Jalan ke Furama, dekat hotel", "Walk to Furama, right by the hotel"] },
        { time: "11:30", t: ["前往訂婚會場", "Ke tempat lamaran", "Go to the engagement venue"], place: "furama" },
        { time: "12:00", kind: "wedding", t: ["訂婚", "Acara lamaran", "Engagement ceremony"] },
        { time: "15:00", t: ["回飯店", "Kembali ke hotel", "Back to the hotel"], place: "jhh" },
        { time: "17:00", t: ["晚餐", "Makan malam", "Dinner"] }
      ]
    },
    {
      date: "2026-12-20", city: "pwt", word: "menikah", art: "wedding", wedding: true,
      title: ["結婚", "Pernikahan", "Wedding day"],
      items: [
        { time: "4:00", t: ["媽媽、姐姐開始化妝", "Mama & kakak mulai dirias", "Mom and sister start makeup"],
          note: ["在新娘媽媽的房間。新郎會用姐姐的房間拍照；媽媽的房間怕爸爸不方便，而且新娘的媽媽也會一起在那裡化妝",
                 "Di kamar mama mempelai wanita. Kamar kakak dipakai mempelai pria untuk foto; kamar mama kurang nyaman untuk papa, dan mama mempelai wanita juga dirias di sana",
                 "In the bride's mother's room. The groom uses sister's room for photos, mom's room would be awkward for dad, and the bride's mother does her makeup there too"] },
        { time: "5:30", t: ["新郎起床準備", "Mempelai pria bangun & bersiap", "Groom gets ready"] },
        { time: "6:00", t: ["爸爸準備", "Papa bersiap", "Dad gets ready"] },
        { time: "7:00", kind: "wedding", t: ["傳統習俗開始", "Upacara adat dimulai", "Traditional ceremony begins"],
          note: ["之後跟著婚禮流程走", "Selanjutnya ikuti susunan acara", "Then follow the wedding schedule"] },
        { time: "14:30", t: ["婚禮結束，休息", "Acara selesai, istirahat", "Wedding ends, rest"] },
        { t: ["晚餐", "Makan malam", "Dinner"] }
      ]
    },
    {
      date: "2026-12-21", city: "pwt", word: "kuliner", art: "slamet",
      title: ["登記結婚・吃美食", "Catatan sipil · wisata kuliner", "Civil registration · food day"],
      items: [
        { t: ["新郎新娘去政府登記結婚", "Pengantin ke catatan sipil", "The couple registers the marriage"] },
        { t: ["去按摩", "Pijat", "Massage"], links: [["food-pwt", ["按摩和沙龍清單", "Daftar spa & salon", "Spa & salon list"]]] },
        { t: ["美食之旅", "Wisata kuliner", "Food tour"], links: [["food-pwt", ["普禾加多餐廳清單", "Daftar tempat makan Purwokerto", "Purwokerto restaurants"]]] }
      ]
    },
    {
      date: "2026-12-22", city: "pwt", word: "santai", art: "slamet",
      title: ["彈性日", "Hari fleksibel", "Flexible day"],
      items: [
        { t: ["文件都好的話，新娘去寄文件", "Jika dokumen lengkap, mempelai wanita kirim dokumen", "If the papers are ready, the bride mails them"],
          note: ["行程可以調整", "Jadwal bisa diubah", "Plans can change"] }
      ]
    },
    {
      date: "2026-12-23", city: "yk", word: "jogja", art: "tamansari",
      title: ["火車到日惹・水宮", "Kereta ke Yogyakarta · Taman Sari", "Train to Yogyakarta · water castle"],
      items: [
        { time: "9:45", kind: "stay", t: ["退房，去火車站", "Check-out, ke stasiun", "Check out, go to the station"], place: "jhh" },
        { go: ["car", 7, "2.3 km", "jhh", "pwtst"] },
        { time: "10:42", kind: "train", t: ["KA Argo Semeru 商務艙到日惹", "KA Argo Semeru Eksekutif ke Yogyakarta", "KA Argo Semeru (executive) to Yogyakarta"], place: "pwtst" },
        { time: "12:46", t: ["抵達日惹站", "Tiba di Stasiun Yogyakarta", "Arrive at Yogyakarta Station"], place: "ykst" },
        { go: ["car", [15, 20], "~4 km", "ykst", "tamansari"] },
        { time: "13:10", t: ["水宮與地下清真寺", "Taman Sari & masjid bawah tanah", "Taman Sari water castle & underground mosque"], place: "tamansari",
          warn: ["水宮大約 15:00 關門，到了先進去逛", "Taman Sari tutup sekitar 15.00, langsung masuk dulu", "Closes around 3 pm, go in first"] },
        { time: "16:00", t: ["吃飯", "Makan", "Meal"], links: [["food-yk", ["日惹餐廳清單", "Daftar tempat makan Yogyakarta", "Yogyakarta restaurants"]]] },
        { go: ["car", 16, "4.1 km", "tamansari", "malioboro"] },
        { time: "18:00", t: ["逛馬里奧博羅街", "Jalan-jalan di Malioboro", "Stroll Malioboro Street"], place: "malioboro" },
        { time: "20:00", t: ["晚餐", "Makan malam", "Dinner"] },
        { go: ["car", 47, "14.4 km", "malioboro", "villa"] },
        { time: "22:00", kind: "stay", t: ["回 villa 休息", "Ke villa, istirahat", "Back to the villa"], place: "villa",
          note: ["villa 下午 2 點後可入住", "Check-in mulai 14.00", "Check-in from 2 pm"] }
      ]
    },
    {
      date: "2026-12-24", city: "yk", word: "borobudur", art: "stupa", xmas: true, // 聖誕兩天：飄雪花和金粉、小花戴聖誕帽、天空飛過雪橇、背景淡淡的聖誕花紋
      title: ["婆羅浮屠", "Candi Borobudur", "Borobudur"],
      items: [
        { time: "9:00", t: ["出發去婆羅浮屠", "Berangkat ke Borobudur", "Leave for Borobudur"], place: "villa" },
        { go: ["car", 67, "41.3 km", "villa", "borobudur"] },
        { time: "10:20", t: ["抵達婆羅浮屠", "Tiba di Borobudur", "Arrive at Borobudur"], place: "borobudur" },
        { time: "10:30", t: ["開始逛婆羅浮屠", "Mulai keliling Borobudur", "Explore Borobudur"],
          note: ["要爬上主塔得另外預約時段票，名額有限，出發前確認", "Naik ke candi perlu tiket khusus dengan kuota, cek sebelum berangkat", "Climbing the temple needs a timed ticket with limited spots, check ahead"] },
        { go: ["car", 9, "4.6 km", "borobudur", "mendut"] },
        { time: "12:00", t: ["附近的寺廟（例如孟督寺）", "Candi di sekitar (misalnya Candi Mendut)", "A nearby temple (e.g. Candi Mendut)"], place: "mendut" },
        { time: "13:00", t: ["午餐（三選一）", "Makan siang (pilih satu)", "Lunch (pick one)"],
          options: [
            { place: "silver",     tag: ["印尼菜", "Masakan Indonesia", "Indonesian"], go: ["car", 5, "3.5 km"] },
            { place: "demenake",   tag: ["自助取餐", "Prasmanan", "Buffet-style"], go: ["car", 9, "4.9 km"] },
            { place: "vanbloemen", tag: ["景觀餐廳", "Resto pemandangan", "Restaurant with a view"], go: ["car", 11, "6.3 km"] }
          ],
          note: ["交通時間是從孟督寺出發", "Waktu tempuh dari Candi Mendut", "Drive times are from Candi Mendut"] },
        { go: ["car", 82, "40.6 km", "borobudur", "malioboro"] },
        { time: "15:00", t: ["回日惹市區", "Kembali ke kota Yogyakarta", "Back to Yogyakarta city"],
          note: ["可以再去馬里奧博羅街，穿傳統服裝拍照", "Bisa ke Malioboro lagi, foto pakai baju adat", "Option: Malioboro again for photos in traditional dress"], place: "malioboro" },
        { go: ["car", 47, "14.4 km", "malioboro", "villa"] },
        { kind: "stay", t: ["回 villa", "Kembali ke villa", "Back to the villa"], place: "villa" }
      ]
    },
    {
      date: "2026-12-25", city: "bali", word: "bali", art: "gate", xmas: true,
      title: ["飛往峇里島", "Terbang ke Bali", "Fly to Bali"],
      items: [
        { time: "10:00", kind: "stay", t: ["退房出門", "Check-out, berangkat", "Check out and leave"], place: "villa",
          note: ["villa 中午 12 點前退房", "Check-out paling lambat 12.00", "Check-out by noon"] },
        { go: ["car", 52, "33.1 km", "villa", "yia"] },
        { time: "13:40", kind: "flight", t: ["Garuda GA252 飛峇里島", "Garuda GA252 ke Bali", "Garuda GA252 to Bali"], place: "yia",
          note: ["最晚 13:10 報到。托運行李 1 件 23 公斤", "Check-in tutup 13.10. Bagasi 1 koli 23 kg", "Check-in closes 1:10 pm. 1 checked bag, 23 kg"] },
        { time: "16:10", t: ["抵達峇里島機場", "Tiba di Bandara Ngurah Rai", "Land at Ngurah Rai Airport"], place: "dps",
          note: ["峇里島跟台灣同時間，比日惹快 1 小時", "Bali sama dengan waktu Taiwan, 1 jam lebih cepat dari Yogyakarta", "Bali is on Taiwan time, 1 hour ahead of Yogyakarta"] },
        { go: ["car", 32, "10.5 km", "dps", "casa"] },
        { time: "17:30", kind: "stay", t: ["入住水明漾的 villa", "Check-in villa di Seminyak", "Check in at the Seminyak villa"], place: "casa",
          note: ["下午 3 點後可入住，住到 12/31", "Check-in mulai 15.00, sampai 31 Des", "Check-in from 3 pm, staying until Dec 31"] },
        { time: "18:30", t: ["晚餐", "Makan malam", "Dinner"], links: [["food-bali", ["峇里島餐廳清單", "Daftar tempat makan Bali", "Bali restaurants"]]] }
      ]
    },
    {
      date: "2026-12-26", city: "bali", word: "ubud", art: "terrace",
      title: ["烏布", "Ubud", "Ubud"],
      items: [
        { time: "9:30", t: ["專車前往烏布", "Mobil sewaan ke Ubud", "Private car to Ubud"], place: "casa" },
        { go: ["car", 91, "31.8 km", "casa", "monkey"],
          note: ["試算表預估 1 小時（Google Maps 約 1.5 小時）", "Rencana 1 jam (Google Maps sekitar 1,5 jam)", "Planned 1 hr (Google Maps about 1.5 hrs)"] },
        { time: "10:30", t: ["烏布聖猴森林、烏布藝術市場", "Monkey Forest & Pasar Seni Ubud", "Monkey Forest & Ubud Art Market"], place: "monkey",
          note: ["猴子會搶東西，眼鏡、帽子、食物收好", "Monyet suka merebut barang, simpan kacamata, topi, makanan", "Monkeys grab things, keep glasses, hats and food put away"] },
        { time: "13:00", t: ["烏布午餐", "Makan siang di Ubud", "Lunch in Ubud"],
          note: ["烤乳豬飯或印尼菜", "Babi guling atau masakan Indonesia", "Roast pork rice or Indonesian food"], links: [["food-bali", ["峇里島餐廳清單（烏布區）", "Daftar tempat makan Bali (Ubud)", "Bali restaurants (Ubud)"]]] },
        { go: ["car", 34, "11.4 km", "monkey", "tegalalang"] },
        { time: "14:30", t: ["德格拉朗梯田", "Sawah Terasering Tegalalang", "Tegalalang Rice Terrace"], place: "tegalalang",
          note: ["可以自費玩高空鞦韆 Bali Swing", "Bisa coba Bali Swing (bayar sendiri)", "Optional: Bali Swing (extra cost)"] },
        { go: ["car", 112, "41.8 km", "tegalalang", "casa"] },
        { time: "17:30", t: ["回飯店休息，或去百貨逛街", "Kembali ke hotel atau ke mal", "Back to rest, or go shopping"], place: "casa" }
      ]
    },
    {
      date: "2026-12-27", city: "bali", word: "penida", art: "sea",
      title: ["佩尼達島一日遊", "Nusa Penida sehari", "Nusa Penida day trip"],
      items: [
        { time: "6:30", t: ["出發去沙努爾碼頭", "Berangkat ke Pelabuhan Sanur", "Leave for Sanur Harbour"], place: "casa",
          note: ["不帶大行李", "Tidak bawa koper", "No big luggage"] },
        { go: ["car", 67, "17.9 km", "casa", "sanur"],
          note: ["試算表預估 1 小時（Google Maps 白天約 1 小時，清晨通常更快）", "Rencana 1 jam (Google Maps siang hari ±1 jam, pagi biasanya lebih cepat)", "Planned 1 hr (Google Maps about 1 hr by day, faster at dawn)"] },
        { time: "7:30", kind: "boat", t: ["搭快艇去佩尼達島", "Fast boat ke Nusa Penida", "Fast boat to Nusa Penida"], place: "sanur",
          note: ["船程約 45 分鐘", "Sekitar 45 menit", "About 45 minutes"],
          links: [["https://nusapenidafastboatticket.com/", ["快艇訂票網站", "Situs tiket fast boat", "Fast boat tickets"]]] },
        { time: "8:30–15:30", t: ["佩尼達島景點", "Keliling Nusa Penida", "Nusa Penida highlights"],
          note: ["浮潛（Manta Bay／Gamat Bay 找魔鬼魚和熱帶魚）・精靈海灘 Kelingking・破碎海灘 Broken Beach・天仙裂痕 Angel's Billabong・島上吃午餐",
                 "Snorkeling (Manta Bay / Gamat Bay) · Pantai Kelingking · Broken Beach · Angel's Billabong · makan siang di pulau",
                 "Snorkeling (Manta Bay / Gamat Bay for manta rays) · Kelingking Beach · Broken Beach · Angel's Billabong · lunch on the island"] },
        { time: "16:30", kind: "boat", t: ["搭末班快艇回沙努爾", "Fast boat terakhir ke Sanur", "Last fast boat back to Sanur"], place: "sanur" },
        { go: ["car", 50, "14.2 km", "sanur", "casa"] },
        { time: "18:00", t: ["接送回飯店", "Diantar ke hotel", "Transfer back to the villa"], place: "casa" }
      ]
    },
    {
      date: "2026-12-28", city: "bali", word: "uluwatu", art: "cliff",
      title: ["南灣水上活動・烏魯瓦圖", "Tanjung Benoa · Uluwatu", "Tanjung Benoa · Uluwatu"],
      items: [
        { time: "9:00", t: ["出發去南灣", "Berangkat ke Tanjung Benoa", "Leave for Tanjung Benoa"], place: "casa" },
        { go: ["car", 41, "21.2 km", "casa", "benoa"] },
        { t: ["水上活動", "Olahraga air", "Water sports"], place: "benoa",
          note: ["拖曳傘、水上摩托車、香蕉船等", "Parasailing, jet ski, banana boat, dll.", "Parasailing, jet ski, banana boat and more"] },
        { time: "13:00", t: ["午餐", "Makan siang", "Lunch"] },
        { go: ["car", 63, "27.8 km", "benoa", "uluwatu"] },
        { time: "15:30", t: ["懸崖上的烏魯瓦圖神廟", "Pura Luhur Uluwatu di tebing", "Uluwatu Temple on the cliffs"], place: "uluwatu",
          note: ["這裡的猴子也會搶東西。進廟要圍紗龍，現場會提供", "Monyet di sini juga suka merebut barang. Wajib pakai sarung (disediakan)", "Monkeys here grab things too. Sarongs are required and provided"] },
        { time: "18:00", t: ["夕陽卡恰火舞表演", "Tari Kecak & Api saat matahari terbenam", "Kecak & Fire Dance at sunset"], place: "uluwatu" },
        { time: "19:30", t: ["晚餐後回飯店", "Makan malam lalu kembali ke hotel", "Dinner, then back to the villa"],
          note: ["回程會經過金巴蘭，可以吃海鮮", "Searah dengan Jimbaran, bisa makan seafood", "Jimbaran seafood is on the way back"],
          links: [["food-bali", ["峇里島餐廳清單（海鮮）", "Daftar tempat makan Bali (seafood)", "Bali restaurants (seafood)"]]] },
        { go: ["car", 84, "26.7 km", "uluwatu", "casa"] }
      ]
    },
    {
      date: "2026-12-29", city: "bali", word: "kintamani", art: "volcano",
      title: ["傳統村落・京打馬尼火山", "Desa Penglipuran · Kintamani", "Penglipuran village · Kintamani volcano"],
      items: [
        { time: "8:30", t: ["專車前往邦利縣", "Mobil sewaan ke Bangli", "Private car to Bangli"], place: "casa" },
        { go: ["car", 121, "52.9 km", "casa", "penglipuran"],
          note: ["試算表預估 1 小時（Google Maps 約 2 小時）", "Rencana 1 jam (Google Maps sekitar 2 jam)", "Planned 1 hr (Google Maps about 2 hrs)"] },
        { time: "9:30", t: ["彭利普蘭文化村", "Desa Wisata Penglipuran", "Penglipuran Village"], place: "penglipuran",
          note: ["全世界最乾淨的傳統村落之一", "Salah satu desa terbersih di dunia", "One of the cleanest traditional villages in the world"] },
        { go: ["car", 28, "19.0 km", "penglipuran", "kintamani"] },
        { time: "11:30", t: ["前往京打馬尼高地", "Menuju Kintamani", "Up to Kintamani"], place: "kintamani",
          note: ["山上比較涼，帶件薄外套", "Di atas lebih sejuk, bawa jaket tipis", "Cooler up here, bring a light jacket"] },
        { time: "12:30", t: ["景觀午餐，看巴杜爾火山和湖", "Makan siang dengan pemandangan Gunung & Danau Batur", "Lunch overlooking Mount Batur and the lake"] },
        { time: "14:30", t: ["景觀咖啡廳拍照，或去咖啡園", "Kafe dengan pemandangan atau kebun kopi", "View café or a local coffee farm"] },
        { go: ["car", 137, "62.7 km", "kintamani", "casa"] },
        { time: "17:30", t: ["回飯店", "Kembali ke hotel", "Back to the villa"], place: "casa" }
      ]
    },
    {
      date: "2026-12-30", city: "bali", word: "bedugul", art: "lake",
      title: ["貝都古・水神廟", "Bedugul · Ulun Danu Beratan", "Bedugul · lake temple"],
      items: [
        { time: "8:30", t: ["出發去山區貝都古", "Berangkat ke Bedugul", "Leave for Bedugul in the hills"], place: "casa" },
        { go: ["car", 117, "56.0 km", "casa", "ulundanu"] },
        { time: "10:30", t: ["湖上的水神廟", "Pura Ulun Danu Beratan", "Ulun Danu Beratan lake temple"], place: "ulundanu" },
        { time: "13:00", t: ["在貝都古吃午餐", "Makan siang di Bedugul", "Lunch in Bedugul"] },
        { go: ["car", 5, "3.0 km", "ulundanu", "handara"] },
        { time: "14:30", t: ["漢達拉門拍照", "Foto di Gerbang Handara", "Photos at Handara Gate"], place: "handara" },
        { go: ["car", 111, "56.3 km", "handara", "casa"] },
        { time: "17:30", t: ["回飯店", "Kembali ke hotel", "Back to the villa"], place: "casa" }
      ]
    },
    {
      date: "2026-12-31", city: "bali", word: "pulang", art: "home",
      title: ["回台灣", "Pulang ke Taiwan", "Fly home"],
      items: [
        { time: "10:00", kind: "stay", t: ["退房，去買伴手禮", "Check-out, beli oleh-oleh", "Check out, souvenir shopping"], place: "casa",
          note: ["villa 上午 11 點前退房", "Check-out paling lambat 11.00", "Check-out by 11 am"] },
        { go: ["car", 9, "2.7 km", "casa", "krisna"] },
        { t: ["Krisna 伴手禮中心", "Krisna Oleh-Oleh", "Krisna souvenir store"], place: "krisna" },
        { time: "11:30", t: ["機場附近吃午餐", "Makan siang dekat bandara", "Lunch near the airport"] },
        { go: ["car", 20, "8.3 km", "krisna", "dps"] },
        { time: "12:45", t: ["抵達機場，辦登機和出境", "Tiba di bandara, check-in & imigrasi", "At the airport: check-in and immigration"], place: "dps",
          note: ["起飛前 3 小時到，時間很充裕", "Tiba 3 jam sebelum terbang, waktunya cukup", "3 hours before the flight, plenty of time"] },
        { time: "15:45", kind: "flight", t: ["華航 CI772 飛桃園", "China Airlines CI772 ke Taipei", "China Airlines CI772 to Taipei"], place: "dps",
          note: ["托運行李每人 1 件", "Bagasi 1 koli per orang", "1 checked bag per person"] },
        { time: "21:00", t: ["抵達桃園 T1，旅程結束", "Tiba di Taoyuan T1", "Land at Taoyuan T1, trip complete"], place: "tpe" }
      ]
    }
  ],

  stays: [
    { place: "harris", city: "jkt", nights: ["12/15 – 12/16", "15–16 Des", "Dec 15–16"], inout: null },
    { place: "jhh", city: "pwt", nights: ["12/16 – 12/23", "16–23 Des", "Dec 16–23"], inout: ["退房 12/23 9:45 出發", "Check-out 23 Des", "Check out Dec 23"],
      phone: "(0281) 634321" },
    { place: "villa", city: "yk", nights: ["12/23 – 12/25", "23–25 Des", "Dec 23–25"], inout: ["入住 14:00 ／ 退房 12:00", "Check-in 14.00 / check-out 12.00", "Check-in 2 pm / check-out noon"],
      host: "Alterstay Jogja (Airbnb)" },
    { place: "casa", city: "bali", nights: ["12/25 – 12/31", "25–31 Des", "Dec 25–31"], inout: ["入住 15:00 ／ 退房 11:00", "Check-in 15.00 / check-out 11.00", "Check-in 3 pm / check-out 11 am"],
      host: "The Bali Agent (Airbnb)" }
  ],

  // 餐廳清單（來自試算表）
  food: [
    { id: "jkt", city: "jkt", groups: [
      { name: ["12/15 晚餐候選", "Pilihan makan malam 15 Des", "Dinner options, Dec 15"], items: [
        ["B'Steak Grill & Pancake", ["西餐・牛排", "Steak", "Steak"], "https://maps.app.goo.gl/ipBZyYfBnsstAsqf7"],
        ["Republik Seafood PIK", ["海鮮", "Seafood", "Seafood"], "https://maps.app.goo.gl/aJtJxdHnJnfwGx3V8"],
        ["RM Pagi Sore", ["印尼菜", "Masakan Indonesia", "Indonesian"], "https://maps.app.goo.gl/DtxbQA7ZNcX3a6Pu6"]
      ]}
    ]},
    { id: "pwt", city: "pwt", groups: [
      { name: ["吃飯", "Tempat makan", "Restaurants"], items: [
        ["Taman Pringgading", null, "https://maps.app.goo.gl/7HZJwzf81xYzHh5B6"],
        ["Warung Gado-Gado", ["花生醬蔬菜沙拉", "Gado-gado", "Veg salad with peanut sauce"], "https://maps.app.goo.gl/hTztoHhQrF4yZ8gw7"],
        ["Lembayung Restaurant", null, "https://maps.app.goo.gl/XbusZjL2p4FpmyvJ9"],
        ["Red Chili", null, "https://maps.app.goo.gl/VWbsZ9C9mS6kizA19"],
        ["Kaliandra Baturaden", ["在 Baturraden 山上", "Di Baturraden", "Up in Baturraden"], "https://maps.app.goo.gl/xMbxo7k5zHAHCzv6A"],
        ["Djago Jowo", null, "https://maps.app.goo.gl/FRGaFsLSrozG1gvL7"],
        ["Table Nine", null, "https://share.google/PzjUjaXGxJOAefIgV"],
        ["RM Cahaya Mas", null, "https://maps.app.goo.gl/sr7W4ZTgBPcBpsrn7"],
        ["Mang Engking", ["淡水魚蝦", "Udang & ikan air tawar", "Freshwater prawns & fish"], "https://maps.app.goo.gl/TXFuowXMLJfjVUTt9"]
      ]},
      { name: ["按摩・沙龍", "Spa & salon", "Spa & salon"], items: [
        ["De Wave", ["按摩、美容", "Pijat & salon", "Massage & beauty"], "https://maps.app.goo.gl/czLgLVRx8jKB72cf7"],
        ["Nakamura Holistik", ["按摩", "Pijat", "Massage"], "https://maps.app.goo.gl/SDJR2No839VrpfGe7"],
        ["Jimmy Salon", ["沙龍", "Salon", "Salon"], "https://maps.app.goo.gl/yciuBdipk9HHHCLV8"]
      ]}
    ]},
    { id: "yk", city: "yk", groups: [
      { name: ["吃飯", "Tempat makan", "Restaurants"], items: [
        ["The House of Raminten", null, "https://maps.app.goo.gl/seNNKB2KJdBgcK5a8"],
        ["Mediterranea Restaurant", ["西餐", "Masakan Barat", "Western"], "https://maps.app.goo.gl/wAcvoBnmxBXtx71V7"],
        ["Ayam Rempah Kranggan", ["香料雞", "Ayam rempah", "Spiced chicken"], "https://maps.app.goo.gl/DNQX7JwR4jM9cCPf7"],
        ["Gudeg Jeng Nia", ["日惹菠蘿蜜燉菜", "Gudeg", "Gudeg (jackfruit stew)"], "https://maps.app.goo.gl/XEvacUG1xAgXhL8d6"],
        ["Ayam Bacem Pakuningratan", ["甜滷雞", "Ayam bacem", "Sweet braised chicken"], "https://maps.app.goo.gl/aLm9VU1AunR5uKSx6"],
        ["Lalawuh Garden", null, "https://maps.app.goo.gl/Lypz9dSQu7X2oxcD8"],
        ["Warung Soto Kadipiro", ["印尼雞湯", "Soto", "Soto soup"], "https://maps.app.goo.gl/P4dVhFYpqmNPh7jQ7"],
        ["Baki Venue and Convention", null, "https://maps.app.goo.gl/CgExddR5qWrJ6CrD7"],
        ["Gianti Indonesian Fine Dining", ["印尼菜精緻料理", "Fine dining Indonesia", "Indonesian fine dining"], "https://maps.app.goo.gl/HXRGCSyJXhvHDf5i8"],
        ["Sate Klathak Samirono", ["羊肉串", "Sate kambing", "Goat satay"], "https://maps.app.goo.gl/MfEQ2aHgWaWzXr2x6"],
        ["Sate Ratu", ["沙嗲串燒", "Sate", "Satay"], "https://maps.app.goo.gl/s5RaQLhWSjeq13ho8"],
        ["Sate Klathak Pak Pong", ["羊肉串", "Sate kambing", "Goat satay"], "https://maps.app.goo.gl/MK6i4vBmxrPCVnWv5"],
        ["Pesona Kampung Sunda", ["巽他菜", "Masakan Sunda", "Sundanese food"], "https://maps.app.goo.gl/puFuEkM6yUy734tn7"]
      ]},
      { name: ["按摩", "Spa", "Spa"], items: [
        ["Griya Larasati Spa", ["按摩、美容", "Spa & kecantikan", "Spa & beauty"], "https://maps.app.goo.gl/pHaLXJHiWrKagCsL7"]
      ]}
    ]},
    { id: "bali", city: "bali", groups: [
      { name: ["烏布一帶", "Sekitar Ubud", "Around Ubud"], items: [
        ["Ayam Betutu Khas Gilimanuk", ["峇里島燉雞", "Ayam betutu", "Balinese spiced chicken"], "https://maps.app.goo.gl/uYjzeeYpzHyxW1Xs5"],
        ["Warung Babi Guling Ibu Oka 2", ["烤乳豬飯", "Babi guling", "Roast suckling pig"], "https://maps.app.goo.gl/p7xFhbvWvEgxGRqd7"],
        ["Bebek Tepi Sawah", ["脆皮鴨，稻田旁", "Bebek, tepi sawah", "Crispy duck by the rice fields"], "https://maps.app.goo.gl/Ykhk1hD4LKw1AJe76"],
        ["Babi Guling Pande Egi", ["烤乳豬飯", "Babi guling", "Roast suckling pig"], "https://maps.app.goo.gl/9F6LGMp8qcUX3CRF6"],
        ["Bebek Bengil", ["脆皮鴨", "Bebek goreng", "Crispy duck"], "https://maps.app.goo.gl/usEcjLqGxbeFT3YL7"],
        ["Seniman Coffee", ["咖啡", "Kopi", "Coffee"], "https://maps.app.goo.gl/1fWZiaFFfcVt3Umf8"]
      ]},
      { name: ["水明漾一帶（住處附近）", "Sekitar Seminyak (dekat villa)", "Around Seminyak (near the villa)"], items: [
        ["Bebek Tepi Sawah Restaurant", ["脆皮鴨", "Bebek", "Crispy duck"], "https://maps.app.goo.gl/fe4meY3K2i4BHqEd6"],
        ["Merah Putih", ["印尼菜", "Masakan Indonesia", "Indonesian"], "https://maps.app.goo.gl/tuqHH4Lga37RZhNE7"],
        ["Naughty Nuri's", ["烤豬肋排", "Iga babi bakar", "Pork ribs"], "https://maps.app.goo.gl/an2fVBaoyUjSGEV6A"],
        ["Gusto Gelato & Caffè", ["義式冰淇淋", "Gelato", "Gelato"], "https://maps.app.goo.gl/tGfnyEnPCSEh7VEq7"],
        ["Legong Bumbu Bali", ["峇里島菜", "Masakan Bali", "Balinese"], "https://share.google/EvikgXAgV2Lnhd8Fc"]
      ]},
      { name: ["金巴蘭・庫塔（海鮮）", "Jimbaran & Kuta (seafood)", "Jimbaran & Kuta (seafood)"], items: [
        ["Bawang Merah Jimbaran", ["海灘海鮮", "Seafood tepi pantai", "Beachfront seafood"], "https://maps.app.goo.gl/N2Vfc9h4mByRYX9Y9"],
        ["Menega Cafe", ["海灘海鮮", "Seafood tepi pantai", "Beachfront seafood"], "https://maps.app.goo.gl/jAQS8DbHxQ8h2YTt6"],
        ["RM Babi Guling Karya Rebo", ["烤乳豬飯", "Babi guling", "Roast suckling pig"], "https://maps.app.goo.gl/zhQAkFP6G5DiJKsM6"]
      ]}
    ]}
  ],

  // 交通票券（交通頁 #transport 用；不放訂位代號、座位和付款資料）
  // from / to：c 是機場或車站代碼（大字），n 是名稱和航廈；no 是航班或車次；info 是票下半部的小字
  tickets: [
    { date: "2026-12-15", kind: "flight", no: ["華航 CI761", "China Airlines CI761", "China Airlines CI761"],
      from: { c: "TPE", n: ["桃園 T1", "Taoyuan T1", "Taoyuan T1"] }, to: { c: "CGK", n: ["雅加達 T3", "Jakarta T3", "Jakarta T3"] },
      dep: "9:10", arr: "13:40",
      info: [["飛行約 5.5 小時", "Terbang ± 5,5 jam", "About 5.5 hours"], ["托運每人 1 件", "Bagasi 1 koli/orang", "1 checked bag each"]] },
    { date: "2026-12-16", kind: "train", no: ["車次待補", "Nama kereta menyusul", "Train TBA"],
      from: { c: "JKT", n: ["Gambir 或 Pasar Senen", "Gambir / Pasar Senen", "Gambir or Pasar Senen"] }, to: { c: "PWT", n: ["普禾加多站", "Stasiun Purwokerto", "Purwokerto Station"] },
      dep: "8:50", arr: "13:00",
      info: [["哪一站上車待確認", "Stasiun keberangkatan belum pasti", "Departure station TBC"], ["車上有供餐和點心", "Ada makanan di kereta", "Meals on board"]] },
    { date: "2026-12-23", kind: "train", no: ["KA Argo Semeru 商務艙", "KA Argo Semeru Eksekutif", "KA Argo Semeru, executive"],
      from: { c: "PWT", n: ["普禾加多站", "Stasiun Purwokerto", "Purwokerto Station"] }, to: { c: "YK", n: ["日惹 Tugu 站", "Stasiun Yogyakarta (Tugu)", "Yogyakarta (Tugu)"] },
      dep: "10:42", arr: "12:46", info: [] },
    { date: "2026-12-25", kind: "flight", no: ["Garuda GA252", "Garuda GA252", "Garuda GA252"],
      from: { c: "YIA", n: ["日惹國際機場", "Bandara YIA", "Yogyakarta Intl"] }, to: { c: "DPS", n: ["峇里島", "Bali", "Bali"] },
      dep: "13:40", arr: "16:10",
      info: [["日惹和峇里島差 1 小時，抵達是峇里島時間", "Tiba pukul 16.10 waktu Bali (WITA)", "Lands 16:10 Bali time (1 h ahead)"], ["托運 1 件 23kg", "Bagasi 1 × 23 kg", "1 checked bag, 23 kg"]] },
    { date: "2026-12-31", kind: "flight", no: ["華航 CI772", "China Airlines CI772", "China Airlines CI772"],
      from: { c: "DPS", n: ["峇里島國際線", "Bali (internasional)", "Bali (international)"] }, to: { c: "TPE", n: ["桃園 T1", "Taoyuan T1", "Taoyuan T1"] },
      dep: "15:45", arr: "21:00",
      info: [["飛行約 5 小時 15 分", "Terbang ± 5 jam 15 menit", "About 5 h 15 min"], ["托運每人 1 件", "Bagasi 1 koli/orang", "1 checked bag each"]] }
  ],


  // 匯率（參考值，出發前更新）
  rate: { twd: 560, asOf: "2026-08" },

  packing: [
    ["護照（效期要超過 6 個月）", "Paspor (berlaku > 6 bulan)", "Passport (valid 6+ months)"],
    ["印尼電子落地簽 e-VOA", "e-VOA", "Indonesia e-VOA"],
    ["印尼盾現金、信用卡", "Uang rupiah & kartu kredit", "Rupiah cash & credit card"],
    ["網卡或 eSIM", "Kartu SIM / eSIM", "SIM card or eSIM"],
    ["轉接頭（兩根圓腳，220V）", "Adaptor colokan (2 kaki bulat, 220V)", "Plug adapter (two round pins, 220V)"],
    ["行動電源（放隨身行李）", "Power bank (di tas kabin)", "Power bank (carry-on only)"],
    ["婚禮、訂婚的衣服", "Pakaian lamaran & pernikahan", "Engagement & wedding outfits"],
    ["防曬、帽子、太陽眼鏡", "Tabir surya, topi, kacamata hitam", "Sunscreen, hat, sunglasses"],
    ["防蚊液", "Obat nyamuk", "Mosquito repellent"],
    ["薄外套（火車冷氣、山上涼）", "Jaket tipis (AC kereta, pegunungan)", "Light jacket (train AC, mountains)"],
    ["泳衣（浮潛）", "Baju renang (snorkeling)", "Swimwear (snorkeling)"],
    ["好走的鞋、拖鞋", "Sepatu nyaman & sandal", "Comfortable shoes & sandals"],
    ["進寺廟用的長褲或圍巾", "Celana panjang / selendang untuk ke pura", "Long pants or scarf for temples"],
    ["常備藥（腸胃藥、暈船藥）", "Obat pribadi (sakit perut, mabuk laut)", "Medicine (stomach, seasickness)"],
    ["雨傘或輕便雨衣（12 月是雨季）", "Payung / jas hujan (Desember musim hujan)", "Umbrella or poncho (December is rainy season)"]
  ],

  phrases: [
    ["Terima kasih", "德里瑪 卡西", ["謝謝", "Thank you"]],
    ["Sama-sama", "沙瑪 沙瑪", ["不客氣", "You're welcome"]],
    ["Selamat pagi", "瑟拉瑪 巴gi", ["早安", "Good morning"]],
    ["Permisi", "撥米西", ["不好意思（借過、請問）", "Excuse me"]],
    ["Maaf", "瑪阿夫", ["對不起", "Sorry"]],
    ["Berapa?", "伯拉巴", ["多少錢？", "How much?"]],
    ["Bisa kurang?", "比沙 估朗", ["可以算便宜一點嗎？", "Can you lower the price?"]],
    ["Di mana toilet?", "迪 瑪納 多一列", ["廁所在哪裡？", "Where is the toilet?"]],
    ["Enak!", "欸那", ["好吃！", "Delicious!"]],
    ["Tidak pedas", "低搭 不搭斯", ["不要辣", "Not spicy"]],
    ["Saya tidak makan daging", "沙雅 低搭 媽甘 搭頂", ["我不吃肉", "I don't eat meat"]],
    ["Air putih", "阿一兒 不地", ["白開水", "Plain water"]],
    ["Tolong", "多弄", ["請幫忙", "Please help"]],
    ["Tidak, terima kasih", "低搭，德里瑪 卡西", ["不用了，謝謝", "No, thank you"]],
    ["Selamat menempuh hidup baru!", "四啦嗎 麼呢不 ㄏㄧ˙都 怕如", ["新婚快樂！", "Happy married life!"],
      ["（直譯：恭喜展開新生活。新娘教的，Claude 記下來）", "(lit. \"congrats on starting a new life\" · taught by the bride, noted by Claude)"]]
  ]
};
