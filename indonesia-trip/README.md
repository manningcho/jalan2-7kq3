# 印尼之旅 2026

給家人用手機看的行程網站。純 HTML/CSS/JS，不需要安裝或編譯。

## 檔案
- `data.js`：所有行程、住宿、餐廳、單字。**要改內容只改這個檔案。**
- `app.js`：畫面程式
- `style.css`：樣式
- `index.html`：入口
- `build-preview.py`、`head.html`、`dist/`：產生 claude.ai 預覽用的單一檔案，GitHub 上用不到

## 放到 GitHub Pages
1. 建一個 repo（名字取難猜一點），把這個資料夾的檔案推上去
2. repo 的 Settings → Pages → Source 選 `main` 分支、根目錄
3. 幾分鐘後網址會是 `https://<帳號>.github.io/<repo 名稱>/`

網站有加 `noindex`，搜尋引擎不會收錄，但知道網址的人都能看。
