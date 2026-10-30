#!/bin/zsh
# 一鍵檢查網站。用法：  tools/run.sh dial | cover | airplane | perf | all
# 需要：Mac 上的 Google Chrome、python3（不用另外裝東西）。會在本機開一個暫時的伺服器，跑完自動關掉。
cd "${0:A:h}/.."
ROOT=$PWD
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=$(( 9700 + RANDOM % 200 ))
serve() { python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 & SRV=$!; sleep 1; }
stop() { kill $SRV 2>/dev/null; }

dial() {   # 快速前往轉盤：點擊範圍、拖曳、甩動、無限轉、滑鼠、觸控板、左右手、頁尾不被擋……（約 54 項）
  echo "== 轉盤測試"; serve
  "$CHROME" --headless=new --disable-gpu --user-data-dir=$(mktemp -d) --window-size=500,900 --virtual-time-budget=150000 \
    --dump-dom "http://127.0.0.1:$PORT/tools/test-dial.html" 2>/dev/null | sed -n '/<pre id="out">/,/END/p' | grep "PASS\|FAIL\|ERR" > /tmp/trip-dial.txt
  stop; echo "$(grep -c PASS /tmp/trip-dial.txt) 項通過，$(grep -c 'FAIL\|ERR' /tmp/trip-dial.txt) 項失敗"; grep "FAIL\|ERR" /tmp/trip-dial.txt
}
cover() {  # 封面輪播與桌布浮層（20 項，真實時鐘）
  echo "== 封面輪播測試"; serve
  python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 1 2500 tools/test-cover.js | python3 -c 'import json,sys;l=json.load(sys.stdin);print(sum(x.startswith("PASS") for x in l),"項通過");[print(x) for x in l if not x.startswith("PASS")]'
  stop
}
airplane() {  # 飛航模式：先讓網站存好，再切斷所有網路（含 Google 字型），檢查每頁和字型
  echo "== 飛航模式測試"; python3 tools/test-airplane.py "$ROOT"
}
perf() {   # 第一次打開的速度：模擬 4G（9Mbps）和很慢的網路（1.6Mbps），CPU 放慢 4 倍
  serve
  echo "== 效能：4G"; NET=9,150 python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 4 9000 tools/perf.js
  echo "== 效能：很慢的網路"; NET=1.6,300 python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 4 20000 tools/perf.js
  stop
}
case ${1:-all} in
  dial) dial;; cover) cover;; airplane) airplane;; perf) perf;;
  all) dial; cover; airplane;;
  *) echo "用法：tools/run.sh dial | cover | airplane | perf | all";;
esac
