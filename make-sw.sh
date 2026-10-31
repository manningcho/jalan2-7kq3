#!/bin/zsh
# 更新 sw.js 裡「要存在手機裡的檔案清單」和版本號（版本號＝這些檔案內容的雜湊，內容一變手機就會重新存一份）。
# 新增或換掉 img/ 的圖之後跑一次：  ./make-sw.sh    （make-lq.sh 最後會自動跑）
cd "${0:A:h}"
files=(index.html style.css data.js lq.js art.js sound.js app.js img/*.jpg img/*.png(N) snd/*.m4a(N))
version=$(cat "${files[@]}" | shasum | cut -c1-10)
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
