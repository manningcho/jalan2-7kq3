# 從夜景圖裡把燈火拆出來（跟拆亮星一樣：光是 Codex 畫的，程式只管亮暗）
# 用法（在專案資料夾執行，需要 Pillow、numpy、scipy）：
#   python tools/night-lights.py <name> <預覽輸出資料夾> [--min 25]
# 產出：
#   img/<name>-night-lights.jpg  只有燈光的圖（黑底，跟夜景一樣大、位置對齊），網頁用「加亮／減暗」疊在夜景上
#   <預覽資料夾>/<name>-lights.json   每盞燈：[x, y, 半徑]（0–1 比例）、顏色、面積，分類前的原始清單
#   <預覽資料夾>/<name>-lights-preview.png  夜景上標出每盞燈的編號（看編號決定每盞是哪一種燈）
import sys, json, argparse
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage as nd

ap = argparse.ArgumentParser()
ap.add_argument("name"); ap.add_argument("out")
ap.add_argument("--min", type=float, default=25)  # 比背景亮多少才算燈（0–255）
ap.add_argument("--extra", action="append", default=[], type=lambda v: [float(x) for x in v.split(",")])  # 漏掉的燈：x,y（0–1），附近 12px 內夠亮的點也算
A = ap.parse_args()
n = A.name

im = Image.open(f"img/{n}-night.jpg").convert("RGB")
a = np.asarray(im, float)
H, W = a.shape[:2]
# 背景：每個顏色各自做「開運算」（先找最暗再找最亮），比燈大的東西留下、小亮點被抹掉
bg = np.stack([nd.grey_opening(a[..., c], size=(11, 11)) for c in range(3)], -1)
bg = np.stack([nd.uniform_filter(bg[..., c], 5) for c in range(3)], -1)
ex = np.clip(a - bg, 0, 255)  # 比背景多出來的光
lum = ex.mean(-1)
# 看原圖的顏色：燈是暖黃／橘（色相 15–65°）或紅色，夠鮮艷、夠亮；月光照到的邊緣、白花是藍白色，不算
hsv = np.asarray(im.convert("HSV"), float)
hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
warm = (hue >= 15) & (hue <= 65) & (sat > .3) & (val > .55)
red = ((hue < 15) | (hue > 300)) & (sat > .28) & (val > .6) & (a[..., 0] - a[..., 1] > 60)  # Codex 畫的翼尖燈偏粉紅
white = (sat < .2) & (val > .93) & (lum > A.min * 3)  # 很亮的白點（機尾的燈）
mask = (lum > A.min) & (warm | red | white)
yy_, xx_ = np.mgrid[0:H, 0:W]
for ex_x, ex_y in A.extra:  # 顏色太淡沒被找到、但確定是燈的（例如回家那張中間漁船的燈籠）
    near = (xx_ - ex_x * W) ** 2 + (yy_ - ex_y * H) ** 2 < 12 ** 2
    mask |= near & (lum > A.min) & (val > .8)
lab, cnt = nd.label(nd.binary_dilation(mask, iterations=2))
lights = []
for i, sl in enumerate(nd.find_objects(lab), 1):
    region = lab[sl] == i
    area = int(region.sum())
    if area < 4:
        continue
    ys, xs = np.nonzero(region)
    ys = ys + sl[0].start; xs = xs + sl[1].start
    w = lum[ys, xs] + 1e-3
    cx, cy = float((xs * w).sum() / w.sum()), float((ys * w).sum() / w.sum())
    rad = max(3.0, float(np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2).max())) + 3)
    core = mask[ys, xs]
    kind = "red" if red[ys, xs][core].mean() > .5 else "white" if white[ys, xs][core].mean() > .5 else "warm"
    lights.append(dict(id=len(lights), x=round(cx / W, 4), y=round(cy / H, 4), r=round(rad / W, 4), area=area,
                       peak=int(lum[ys, xs].max()), kind=kind))

# 只有燈光的圖：燈的範圍裡留下比背景多出來的光，邊緣柔和；其他地方全黑
soft = nd.gaussian_filter(nd.binary_dilation(lab > 0, iterations=2).astype(float), 1.5)
L = np.clip(ex * soft[..., None], 0, 255)
Image.fromarray(L.astype("uint8")).save(f"img/{n}-night-lights.jpg", quality=88)

json.dump(lights, open(f"{A.out}/{n}-lights.json", "w"))
pv = im.copy()
d = ImageDraw.Draw(pv)
for l in lights:
    x, y, rr = l["x"] * W, l["y"] * H, l["r"] * W
    c = {"red": (255, 60, 60), "white": (120, 220, 255), "warm": (80, 255, 120)}[l["kind"]]
    d.ellipse([x - rr, y - rr, x + rr, y + rr], outline=c)
    d.text((x + rr + 1, y - 6), str(l["id"]), fill=c)
pv.save(f"{A.out}/{n}-lights-preview.png")
import os
print(n, len(lights), "lights", {k: sum(1 for l in lights if l["kind"] == k) for k in ["warm", "red", "white"]},
      "jpg", os.path.getsize(f"img/{n}-night-lights.jpg") // 1024, "KB")
