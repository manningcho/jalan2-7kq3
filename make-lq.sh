#!/bin/zsh
# 產生 lq.js：每張插畫／橫幅一張超小的模糊預覽圖（base64），圖片載入前先墊著，載完再淡入。
# 換了或新增 img/ 裡的插畫之後，重新跑一次：  ./make-lq.sh
cd "${0:A:h}"
tmp=$(mktemp -d)
{
  echo "// 自動產生（make-lq.sh），不要手改"
  echo "window.LQ = {"
  first=1
  for f in img/*.jpg; do
    case $(basename $f) in m-*|glass-*) continue;; esac   # 選單小圖、雨天玻璃的素材不需要
    sips -Z 32 "$f" -s format jpeg -s formatOptions 45 --out "$tmp/p.jpg" >/dev/null
    b=$(base64 -i "$tmp/p.jpg" | tr -d '\n')
    [[ $first == 1 ]] || echo ","
    printf '  "%s": "data:image/jpeg;base64,%s"' "$f" "$b"
    first=0
  done
  echo ""
  echo "};"
} > lq.js
rm -rf "$tmp"
echo "lq.js: $(grep -c 'data:image' lq.js) 張，$(( $(stat -f%z lq.js) / 1024 ))KB"
./make-sw.sh   # 圖換了，離線清單和版本號也要跟著更新
