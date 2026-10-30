# 交接說明（給在電腦上接手的 Claude）

這是一個給家人用手機看的印尼行程網站（2026/12/14–12/31）。純 HTML/CSS/JS，沒有建置步驟，直接打開 `index.html` 就能看。

## 檔案
- `data.js`：所有內容（每日行程、地點、餐廳、住宿、票券、單字）。三語文字格式是 `["中文", "Bahasa Indonesia", "English"]`。
- `art.js`：每日插畫（SVG 程式畫的）。`ART.svg(name)` 會先看 `TRIP.photos[name]`，有照片就改用照片。
- `app.js`：畫面與路由（hash：`home`、`menu`、`days`、`d1215`…、`food-pwt`、`stay`、`info`、`learn`）。
  - 右上角是漢堡選單（`prefs()`）：語言（中/ID/EN）和顏色（跟手機/淺色/深色）。顏色存在 `localStorage` 的 `trip-theme`，套用方式是 `<html data-theme>`。
  - 匯率換算（`#money`，大字 rupiah）和行李清單（`#pack`，大字 koper）是選單頁最後兩個按鈕，各自一頁；不在旅遊資料頁。
  - 行程沒有 `time` 時，左邊顯示淡色小字「時間未定」（`u("tbd")`），不是小圓點。
  - 每段車程的小字會寫「到 目的地」（`goBlock()`），有 `label` 的話改用 label。
  - 大字裡有 j g p q y 時加 `has-desc`，列表頁會多留底部空間，尾巴才不會壓到下面。
  - 每日頁最下面「前一天／後一天」中間有日曆圓鈕，點開是從下方滑出的日期面板（`showJump()`），18 天按城市分組。
  - 右下角浮動小花按鈕是「快速前往」轉盤（`buildDial()`、`openDial()`），封面和 00 頁以外每頁都有。點開後以按鈕為圓心展開四分之一圓：00 頁的 7 個選項排在半徑 200px 的圓上，每格 28°，一次露出 4 個。手指沿圓弧拖曳就能轉（移動超過 6px 才算轉，放手會吸附到格子，甩一下最多多轉一格）；電腦可以用滾輪。打開時會自動轉到看得到目前這頁的位置。有轉盤的頁面底部留白加高到 104px，才不會擋到「後一天」。
  - 婚禮兩天（12/19、12/20，`wedding: true`）會飄白色茉莉花瓣（`setPetals()`），固定在畫面上、`pointer-events: none` 不擋點擊。
  - 學印尼文每句後面有喇叭（`speak()`），用裝置內建的印尼文語音（`speechSynthesis`，lang `id-ID`，iPhone/Mac 是 Damayanti），速度 0.85。沒有錄音檔。
  - 餐廳頁切換城市頁籤時，上方大字和頁籤包在 `.keep` 裡、不重播動畫，只有列表重新出現。
  - 交通圖示 car / train / flight / boat / walk 是 Codex 重畫的 SVG（`ICON`），線寬 1.8、`currentColor`。
- `style.css`：海報風格（顆粒紙、大字疊在缺角圖框上）。動畫掛在 `<html class="motion">`，一律開啟：沒有開關，也刻意不跟系統的「減少動態效果」（使用者自己的 Mac 有開，但想看動畫）。
- `build-preview.py`：把所有檔案合成 `dist/preview.html`，給 claude.ai 預覽用。GitHub 上不需要。

## 插畫（2026/10/29 已完成）
原本計畫用維基共享資源的實景照片，後來改成**由 OpenAI Codex 生成海報風插畫**，13 張全換（含 wedding、plane、home）。
- 圖在 `img/*.jpg`（1280×924，每張 < 300KB），登記在 `data.js` 的 `TRIP.photos`。`ART.svg()` 看到有 photos 就用圖，否則退回 SVG。
- 旅遊資料頁最下面的「關於插畫」會說明是 AI 畫的、細節僅供示意（`app.js` 的 `artNote`）。
- 生成時的共同風格：霧藍天空 #5677ae 漸層到蜜桃色、深藍層疊剪影，**上方 40% 留乾淨天空**給大字；婚禮那張改用蠟染棕 #9a5b33。要重畫某張時沿用這套描述。
- 2026/10/30 又請 Codex 加了 16 張：App 圖示（`img/icon-180.png`、`icon-64.png`，主畫面名稱「印尼之旅」）、選單小插畫 7 張（`TRIP.menuArt`，168px）、餐廳頁城市美食橫幅 4 張（`TRIP.bands["food-*"]`）、旅遊資料／學印尼文／匯率／行李四頁的頂部插畫（`photos` 的 `p-info`、`p-learn`、`p-money`、`p-pack`，用 `pageHead()` 疊大字）。
- 圖片先顯示模糊小預覽、載完再淡入：預覽圖在 `lq.js`（`window.LQ`，32px base64），由 `./make-lq.sh` 產生。**新增或換掉 `img/` 裡的插畫、橫幅後要重跑 `./make-lq.sh`**，不然那張圖會沒有模糊預覽（仍會淡入，只是底下是空的）。
- 每張插畫在 `TRIP.photos` 裡有 `top`：圖片上緣 20% 的平均天空色。大字和上緣漸層都用這個顏色（`ART.topColor()`），字伸進天空的部分才不會有色差。**換新插畫時要重新量這個顏色。**
- 行程列表和住宿頁的城市橫幅另外有一套 Codex 畫的橫幅版（`img/band-*.jpg`，1200×359，登記在 `TRIP.bands`）。生成時用 3:2 畫布、重點放在 28%–72% 高度的橫帶，再裁切；左下角留暗給城市名稱。
- `build-preview.py` 產生的單檔預覽不會內嵌 `img/`，claude.ai 預覽裡看到的會是圖片載不到；GitHub Pages 上正常。

## 之後的工作
- 已放上 GitHub Pages（2026/10/30）：repo `manningcho/jalan2-7kq3`（公開，名字故意取難猜），網址 https://manningcho.github.io/jalan2-7kq3/ 。從 `main` 分支根目錄發布，push 後約 1–10 分鐘更新。`.nojekyll` 讓 GitHub 不跑 Jekyll。
- 峇里島 Casa Adem 的地圖搜尋字串拿掉了門牌，改成 `Casa Adem, Gang Lange, Seminyak, Bali`；使用者 2026/10/30 用手機確認 Google 地圖找得到正確的 villa。
- 還缺的資料：12/15 去程航班號碼、12/16 雅加達到普禾加多的火車車次與車站。拿到後更新 `data.js`。
- 2026/10/30 依使用者決定：12/23 不去王宮，日惹站直接開車到水宮（14:15 到，車程 15–20 分、約 4 km 是估計值）；12/31 午餐提早到 11:30，12:45 到機場。12/23 的插畫已換成 Codex 畫的水宮（`tamansari`），原本的王宮圖已刪除。

## 隱私（已和使用者約定）
不放門牌號碼、訂位代號、信用卡、座位。家人用「爸爸、媽媽、姐姐、新郎、新娘」稱呼。
