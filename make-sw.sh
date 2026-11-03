#!/bin/zsh
# 更新 sw.js 裡「要存在手機裡的檔案清單」和版本號（版本號＝這些檔案內容的雜湊，內容一變手機就會重新存一份）。
# 新增或換掉 img/ 的圖之後跑一次：  ./make-sw.sh    （make-lq.sh 最後會自動跑）
cd "${0:A:h}"
# 白天版、夜景、星空這些「跟著當地時間」才用得到的圖，不預先存進手機（2026/11/02 使用者：圖多了下載量會很大）。
# 另外列進 timepack.js（路徑＋大小），選單打開「跟著當地時間」時才下載，下載前先告訴使用者有多大
timefiles=(img/*-day.jpg(N) img/*-night.jpg(N) img/*-night-sky.png(N) img/*-night-lights.jpg(N) img/sky-*.jpg(N))
{
  echo "// 自動產生（make-sw.sh）：「插畫跟著當地時間」要另外下載的圖和大小（bytes）"
  printf 'window.TIMEPACK = ['
  sep=""; for f in "${timefiles[@]}"; do printf '%s["%s", %s]' "$sep" "$f" "$(stat -f %z "$f")"; sep=", "; done
  echo '];'
} > timepack.js
imgs=()
for f in img/*.jpg img/*.png(N); do (( ${timefiles[(Ie)$f]} )) || imgs+=("$f"); done
files=(index.html style.css data.js lq.js art.js sound.js tilt.js glass.js night.js timepack.js app.js "${imgs[@]}" snd/*.m4a(N))
version=$(cat "${files[@]}" "${timefiles[@]}" | shasum | cut -c1-10)
fontcss=$(grep -o 'https://fonts.googleapis.com/css2[^"]*' index.html | head -1 | sed 's/&amp;/\&/g')
list=$(printf '  "./"'; for f in "${files[@]}"; do printf ',\n  "%s"' "$f"; done)
python3 - "$version" "$list" "$fontcss" <<'PY'
import re, sys
version, lst, fontcss = sys.argv[1], sys.argv[2], sys.argv[3]
p = "sw.js"
s = open(p, encoding="utf-8").read()
block = '// <make-sw>\nvar VERSION = "%s";\nvar FONT_CSS = "%s";\nvar ASSETS = [\n%s\n];\n// </make-sw>' % (version, fontcss, lst)
s, n = re.subn(r"// <make-sw>.*?// </make-sw>", lambda m: block, s, flags=re.S)
assert n == 1, "markers not found in sw.js"
open(p, "w", encoding="utf-8").write(s)
PY
echo "sw.js: ${#files[@]} 個檔案，版本 $version"
