#!/bin/zsh
# 一鍵檢查網站。用法：  tools/run.sh dial | cover | airplane | perf | all
# 需要：Mac 上的 Google Chrome、python3（不用另外裝東西）。會在本機開一個暫時的伺服器，跑完自動關掉。
# 全部通過才回 0；Chrome 沒跑起來、測試沒跑完也算失敗（2026/11/06 Codex 複測：原本 Chrome 當掉會印出「0 項通過、0 項失敗」，看起來像沒問題）
cd "${0:A:h}/.."
ROOT=$PWD
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=$(( 9700 + RANDOM % 200 ))
serve() { python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 & SRV=$!; sleep 1; }
stop() { kill $SRV 2>/dev/null; }

dial() {   # 快速前往轉盤：點擊範圍、拖曳、甩動、無限轉、滑鼠、觸控板、左右手、頁尾不被擋、放開遺失、吸附提示、開著轉橫、聖誕帽……（約 68 項）
  echo "== 轉盤測試"; serve
  "$CHROME" --headless=new --disable-gpu --user-data-dir=$(mktemp -d) --window-size=500,900 --virtual-time-budget=150000 \
    --dump-dom "http://127.0.0.1:$PORT/tools/test-dial.html" > /tmp/trip-dial-dom.txt 2>/dev/null
  local rc=$?
  stop
  sed -n '/<pre id="out">/,/END/p' /tmp/trip-dial-dom.txt | grep "PASS\|FAIL\|ERR" > /tmp/trip-dial.txt
  local p=$(grep -c PASS /tmp/trip-dial.txt) f=$(grep -c 'FAIL\|ERR' /tmp/trip-dial.txt)
  if ! grep -q "^END" /tmp/trip-dial-dom.txt || [ $p -lt 50 ]; then
    echo "轉盤測試沒有跑完（Chrome 結束代碼 $rc，通過 $p 項），不能當成通過"; return 1
  fi
  echo "$p 項通過，$f 項失敗"; grep "FAIL\|ERR" /tmp/trip-dial.txt
  [ $f -eq 0 ]
}
cover() {  # 封面輪播與桌布浮層（24 項，真實時鐘）
  echo "== 封面輪播測試"; serve
  python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 1 2500 tools/test-cover.js > /tmp/trip-cover.json 2>/dev/null
  stop
  python3 -c 'import json, sys
try: l = json.load(open("/tmp/trip-cover.json"))
except Exception: print("封面輪播測試沒有跑完（沒有拿到結果），不能當成通過"); sys.exit(1)
if not isinstance(l, list) or len(l) < 20: print("封面輪播測試沒有跑完（只拿到 %r），不能當成通過" % (l if not isinstance(l, list) else len(l))); sys.exit(1)
bad = [x for x in l if not x.startswith("PASS")]
print(len(l) - len(bad), "項通過"); [print(x) for x in bad]; sys.exit(1 if bad else 0)'
}
airplane() {  # 飛航模式：先讓網站存好，再切斷所有網路（含 Google 字型），檢查每頁、字型和轉盤插畫
  echo "== 飛航模式測試"; python3 tools/test-airplane.py "$ROOT" | tee /tmp/trip-airplane.txt
  if ! grep -q "offline dial:" /tmp/trip-airplane.txt; then echo "飛航模式測試沒有跑完，不能當成通過"; return 1; fi
  ! grep -E "FAILED|NOT OPEN|missing|unreadable" /tmp/trip-airplane.txt | grep -v "FAILED 0$" > /dev/null
}
perf() {   # 第一次打開的速度：模擬 4G（9Mbps）和很慢的網路（1.6Mbps），CPU 放慢 4 倍
  serve
  echo "== 效能：4G"; NET=9,150 python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 4 9000 tools/perf.js
  echo "== 效能：很慢的網路"; NET=1.6,300 python3 tools/cdp.py "http://127.0.0.1:$PORT/index.html#home" 4 20000 tools/perf.js
  stop
}
case ${1:-all} in
  dial) dial;; cover) cover;; airplane) airplane;; perf) perf;;
  all)
    dial; d=$?; cover; c=$?; airplane; a=$?
    if [ $d -eq 0 ] && [ $c -eq 0 ] && [ $a -eq 0 ]; then echo "== 全部通過"
    else echo "== 有測試沒過或沒跑完（轉盤 $d、封面 $c、飛航模式 $a；0＝通過）"; exit 1; fi;;
  *) echo "用法：tools/run.sh dial | cover | airplane | perf | all"; exit 2;;
esac
