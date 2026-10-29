# 交接說明（給在電腦上接手的 Claude）

這是一個給家人用手機看的印尼行程網站（2026/12/14–12/31）。純 HTML/CSS/JS，沒有建置步驟，直接打開 `index.html` 就能看。

## 檔案
- `data.js`：所有內容（每日行程、地點、餐廳、住宿、票券、單字）。三語文字格式是 `["中文", "Bahasa Indonesia", "English"]`。
- `art.js`：每日插畫（SVG 程式畫的）。`ART.svg(name)` 會先看 `TRIP.photos[name]`，有照片就改用照片。
- `app.js`：畫面與路由（hash：`home`、`menu`、`days`、`d1215`…、`food-pwt`、`stay`、`info`、`learn`）。
  - 右上角是漢堡選單（`prefs()`）：語言（中/ID/EN）和顏色（跟手機/淺色/深色）。顏色存在 `localStorage` 的 `trip-theme`，套用方式是 `<html data-theme>`。
  - 匯率換算（`moneyTool()`）和行李清單（`packTool()`）放在選單頁（`#menu`），不在旅遊資料頁。
  - 餐廳頁切換城市頁籤時，上方大字和頁籤包在 `.keep` 裡、不重播動畫，只有列表重新出現。
  - 交通圖示 car / train / flight / boat / walk 是 Codex 重畫的 SVG（`ICON`），線寬 1.8、`currentColor`。
- `style.css`：海報風格（顆粒紙、大字疊在缺角圖框上）。動畫掛在 `<html class="motion">`，一律開啟：沒有開關，也刻意不跟系統的「減少動態效果」（使用者自己的 Mac 有開，但想看動畫）。
- `build-preview.py`：把所有檔案合成 `dist/preview.html`，給 claude.ai 預覽用。GitHub 上不需要。

## 插畫（2026/10/29 已完成）
原本計畫用維基共享資源的實景照片，後來改成**由 OpenAI Codex 生成海報風插畫**，13 張全換（含 wedding、plane、home）。
- 圖在 `img/*.jpg`（1280×924，每張 < 300KB），登記在 `data.js` 的 `TRIP.photos`。`ART.svg()` 看到有 photos 就用圖，否則退回 SVG。
- 旅遊資料頁最下面的「關於插畫」會說明是 AI 畫的、細節僅供示意（`app.js` 的 `artNote`）。
- 生成時的共同風格：霧藍天空 #5677ae 漸層到蜜桃色、深藍層疊剪影，**上方 40% 留乾淨天空**給大字；婚禮那張改用蠟染棕 #9a5b33。要重畫某張時沿用這套描述。
- `build-preview.py` 產生的單檔預覽不會內嵌 `img/`，claude.ai 預覽裡看到的會是圖片載不到；GitHub Pages 上正常。

## 之後的工作
- 已放上 GitHub Pages（2026/10/30）：repo `manningcho/jalan2-7kq3`（公開，名字故意取難猜），網址 https://manningcho.github.io/jalan2-7kq3/ 。從 `main` 分支根目錄發布，push 後約 1–10 分鐘更新。`.nojekyll` 讓 GitHub 不跑 Jekyll。
- 峇里島 Casa Adem 的地圖搜尋字串拿掉了門牌，改成 `Casa Adem, Gang Lange, Seminyak, Bali`，**還沒確認 Google 地圖找得到同一個地方**（Claude 的瀏覽器擋 Google）。若不準，請使用者給 Google 地圖分享連結，填進 `places.casa.map`。
- 還缺的資料：12/15 去程航班號碼、12/16 雅加達到普禾加多的火車車次與車站。拿到後更新 `data.js`。
- 行程上的提醒（目前在網站上用橘色標示）：12/23 日惹王宮約 14:30 關門、水宮約 15:00 關門，排的時間可能進不去；12/31 太晚到機場（15:45 的國際線，14:30 才到）。使用者和家人還在調整。

## 隱私（已和使用者約定）
不放門牌號碼、訂位代號、信用卡、座位。家人用「爸爸、媽媽、姐姐、新郎、新娘」稱呼。
