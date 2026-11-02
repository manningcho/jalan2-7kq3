# 把 Codex 畫的白天版、夜景裁回 1280x924、對齊原圖，算夜景的天空範圍（星星只出現在這裡）和地平線高度
# 用法（在專案資料夾執行，需要 Pillow、numpy、scipy）：
#   python tools/time-art.py <資料夾> <name> [--cap .44] [--stars .4] [--skip x0,x1,y]
#   --cap   星星最低到哪裡（0–1，從上往下算）。地平線附近有雲時用，星星在雲層上方就淡掉，
#           不然雲那一段會一欄有一欄沒有（烏魯瓦圖 cliff 用 .44）
#   --stars 星星整體的濃度（0–1）。城市光害大，雅加達 city 用比較少的星星
#   --skip  天空中間有東西（飛機）時：x0–x1 這幾欄碰到東西停下來後，跳到 y 再繼續往下找天空，
#           飛機下面的天空才會有星星（plane、home）。三個數都是 0–1 的比例；飛機各段高低不同時可以給好幾個 --skip
# <資料夾> 裡要有 Codex 畫的 <name>-day.png、<name>-night.png（1536x1024，原圖左右各鏡像補 53px 成 3:2 再給 Codex 改畫）。
# 產出在同一個資料夾：<name>-day.jpg、<name>-night.jpg、<name>-night-sky.png（複製到 img/）、
# result.json（top 顏色、hz 地平線，填進 data.js）、預覽圖 <name>-night-stars-preview.jpg、<name>-mask-preview.jpg
import sys, json, os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as nd

import argparse
ap = argparse.ArgumentParser()
ap.add_argument("dir"); ap.add_argument("name")
ap.add_argument("cap_pos", nargs="?", type=float)  # 舊寫法：第三個參數就是 --cap
ap.add_argument("--cap", type=float); ap.add_argument("--stars", type=float, default=1.0)
ap.add_argument("--skip", action="append", default=[], type=lambda v: [float(x) for x in v.split(",")])
A = ap.parse_args()
G, n = A.dir, A.name
cap = A.cap if A.cap is not None else A.cap_pos
orig = Image.open(f"img/{n}.jpg").convert("RGB")


def edges(im):
    return np.asarray(im.convert("L").filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(2)), float)


E0 = edges(orig)


def align(src):
    im = Image.open(src).convert("RGB")
    k = im.height / 1024  # Codex 偶爾不是剛好 1536x1024，照比例換算
    best = None
    for dx in range(-10, 11, 2):
        for dy in range(-10, 11, 2):
            x0 = (58.74 + dx) * k
            c = im.crop((x0, dy * k, x0 + 1418.53 * k, (1024 + dy) * k)).resize((1280, 924), Image.LANCZOS)
            e = edges(c)
            sc = (e * E0).sum() / np.sqrt((e * e).sum() * (E0 * E0).sum())
            if not best or sc > best[0]:
                best = (sc, dx, dy, c)
    return best


def top(im, r=.2):
    a = np.asarray(im, float)
    return "#%02x%02x%02x" % tuple(int(round(v)) for v in a[:int(a.shape[0] * r)].reshape(-1, 3).mean(0))


res = {"name": n}
sc, dx, dy, day = align(f"{G}/{n}-day.png")
day.save(f"{G}/{n}-day.jpg", quality=90)
res["day"] = dict(score=round(sc, 3), dx=dx, dy=dy, top=top(day), kb=os.path.getsize(f"{G}/{n}-day.jpg") // 1024)

sc, dx, dy, night = align(f"{G}/{n}-night.png")
night.save(f"{G}/{n}-night.jpg", quality=86)
res["night"] = dict(score=round(sc, 3), dx=dx, dy=dy, top=top(night), kb=os.path.getsize(f"{G}/{n}-night.jpg") // 1024)

# 天空範圍：每一欄從上往下，遇到第一個明顯變化（山脊、樹、煙）就停（跟火山那張同一套）
a = np.asarray(night, float)
H, W = a.shape[:2]
sm = np.stack([nd.gaussian_filter(a[..., c], 1.2) for c in range(3)], -1)
def scan(col, y, ref=None):  # 從 y 往下走，遇到第一個明顯變化就停，回傳停下來的位置
    ref = col[y] if ref is None else ref
    while y < H - 1:
        if np.abs(col[y] - ref).sum() > 26:
            break
        ref = ref * .85 + col[y] * .15
        y += 1
    return y


horizon = np.zeros(W, int)
mask = np.zeros((H, W))
for x in range(W):
    y = scan(sm[:, x], 5)
    mask[:y, x] = 1
    horizon[x] = y
# 飛機那一塊（x0–x1、從上面到 y）：一點一點比顏色，跟同一高度旁邊天空的顏色差不多的就算天空，
# 星星才會貼著飛機的輪廓，機翼和機身之間的空隙也有星星（只用一欄一欄往下找的話，會框成一個長方形）
for sk in A.skip:
    xa, xb, yb = int(sk[0] * W), int(sk[1] * W), int(sk[2] * H)
    side = [c for c in list(range(max(0, xa - 120), xa)) + list(range(xb + 1, min(W, xb + 121)))]
    box = np.zeros((yb, xb - xa + 1))
    last = None
    for y in range(yb):
        cols = [c for c in side if mask[y, c] == 1]
        if len(cols) >= 10:
            last = np.median(sm[y, cols], axis=0)
        if last is None:
            continue
        box[y] = (np.abs(sm[y, xa:xb + 1] - last).sum(-1) < 24)
    box = nd.median_filter(box, size=5)  # 去掉顆粒造成的小點
    mask[:yb, xa:xb + 1] = box
    # 飛機下面：從 y 繼續往下找到地平線；起點的顏色要跟旁邊的天空一樣才算（不然會從遠山的霧裡開始，畫出直條）
    for x in range(xa, xb + 1):
        horizon[x] = yb
        if last is None:
            continue
        for y0 in range(yb, min(H - 1, yb + 20)):  # 起點剛好在飛機邊上時，往下多找幾個像素
            if np.abs(sm[y0, x] - last).sum() < 24:
                y = scan(sm[:, x], y0, last)
                mask[y0:y, x] = 1
                horizon[x] = y
                break
mask = nd.minimum_filter(mask, size=(9, 3))
mask = nd.gaussian_filter(mask, 3)
yy = np.linspace(0, 1, H)[:, None]
fade = np.clip((np.median(horizon) / H - yy) / 0.18, 0, 1) ** .8  # 越靠近地平線星星越稀
mask = mask * np.clip(.25 + .75 * fade, 0, 1)
if cap is not None:
    mask = mask * np.clip((cap - yy) / 0.05, 0, 1)
mask = mask * A.stars
m = Image.fromarray((mask * 255).astype("uint8")).resize((640, 462), Image.LANCZOS)
rgba = Image.new("RGBA", m.size, (255, 255, 255, 0))
rgba.putalpha(m)
rgba.save(f"{G}/{n}-night-sky.png", optimize=True)
am = np.asarray(m.resize((64, 462), Image.BILINEAR), float) / 255
res["hz"] = [round(float((am[:, i] > .15 * A.stars).sum() / 462), 3) for i in range(64)]
res["horizon"] = dict(median=round(float(np.median(horizon) / H), 3), min=round(float(horizon.min() / H), 3), max=round(float(horizon.max() / H), 3))

# 預覽：夜景＋星星（照天空範圍疊上去），還有天空範圍的紅色標示
st = Image.open("img/sky-stars-dim.jpg").convert("RGB")
st = np.asarray(st.resize((int(st.width * 1.0), int(st.height * 1.0))).crop((0, 0, W, min(H, st.height))), float) / 255
stars = np.zeros((H, W, 3))
stars[:st.shape[0], :st.shape[1]] = st
mk = np.asarray(m.resize((W, H), Image.LANCZOS), float)[..., None] / 255
nn = a / 255
comp = 1 - (1 - nn) * (1 - stars * mk)  # screen
Image.fromarray((comp * 255).astype("uint8")).save(f"{G}/{n}-night-stars-preview.jpg", quality=88)
red = nn.copy()
red[..., 0] = np.clip(red[..., 0] + mk[..., 0] * .5, 0, 1)
Image.fromarray((red * 255).astype("uint8")).resize((640, 462)).save(f"{G}/{n}-mask-preview.jpg", quality=85)

json.dump(res, open(f"{G}/result.json", "w"))
print(json.dumps({k: v for k, v in res.items() if k != "hz"}, ensure_ascii=False))
