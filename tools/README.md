# 測試工具

改完網站後，在專案資料夾執行：

```
tools/run.sh all        # 轉盤＋封面輪播＋飛航模式（約 3–5 分鐘）
tools/run.sh dial       # 只測快速前往轉盤
tools/run.sh cover      # 只測封面輪播和桌布浮層
tools/run.sh airplane   # 只測沒網路時打不打得開、字型對不對
tools/run.sh perf       # 量第一次打開的速度（不算在 all 裡）
```

只需要 Mac 上的 Google Chrome 和內建的 python3，不用另外安裝。工具會在本機開一個暫時的伺服器，跑完會自己關掉。

| 檔案 | 用途 |
|---|---|
| `run.sh` | 一鍵執行上面的測試 |
| `cdp.py` | 很小的 Chrome 除錯介面工具：打開網址、（可選）放慢 CPU 和網速、執行一段 JS、可截圖。`NET=下載Mbps,延遲ms`、`WIN=寬,高` 用環境變數設定（新版無頭 Chrome 視窗最窄 500px，所以寬度改用模擬手機螢幕設定；2026/10/30 以前用 `WIN=320` 量的其實都是 500px） |
| `test-dial.html` | 轉盤的 54 項自動測試（在無頭 Chrome 的模擬時鐘裡跑） |
| `test-cover.js` | 封面輪播和桌布浮層的 20 項測試（真實時鐘） |
| `test-airplane.py` | 飛航模式：Chrome 只能透過一個可開關的代理上網，先讓網站存好，再把網路全部切斷（含 Google 字型）、清掉瀏覽器暫存，逐頁檢查 |
| `perf.js` | 量畫面出現時間、下載量、背景存了多少 |

注意：無頭 Chrome 的「模擬時鐘」有時不會跑 CSS 動畫和 requestAnimationFrame，看到動畫相關的測試偶爾失敗時，先重跑一次；要看真正的動畫時序，用 `cdp.py`（真實時鐘）。
