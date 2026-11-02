# 把 Codex 畫的白天版、夜景裁回 1280x924、對齊原圖，算夜景的天空範圍（星星只出現在這裡）和地平線高度
# 用法（在專案資料夾執行，需要 Pillow、numpy、scipy）：
#   python tools/time-art.py <資料夾> <name>
# <資料夾> 裡要有 Codex 畫的 <name>-day.png、<name>-night.png（1536x1024，原圖左右各鏡像補 53px 成 3:2 再給 Codex 改畫）。
# 產出在同一個資料夾：<name>-day.jpg、<name>-night.jpg、<name>-night-sky.png（複製到 img/）、
# result.json（top 顏色、hz 地平線，填進 data.js）、預覽圖 <name>-night-stars-preview.jpg、<name>-mask-preview.jpg
import sys, json, os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as nd

G, n = sys.argv[1], sys.argv[2]
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
horizon = np.zeros(W, int)
for x in range(W):
    col = sm[:, x]
    ref = col[5]
    y = 5
    while y < H - 1:
        if np.abs(col[y] - ref).sum() > 26:
            break
        ref = ref * .85 + col[y] * .15
        y += 1
    horizon[x] = y
mask = np.zeros((H, W))
for x in range(W):
    mask[:horizon[x], x] = 1
mask = nd.minimum_filter(mask, size=(9, 3))
mask = nd.gaussian_filter(mask, 3)
yy = np.linspace(0, 1, H)[:, None]
fade = np.clip((np.median(horizon) / H - yy) / 0.18, 0, 1) ** .8  # 越靠近地平線星星越稀
mask = mask * np.clip(.25 + .75 * fade, 0, 1)
m = Image.fromarray((mask * 255).astype("uint8")).resize((640, 462), Image.LANCZOS)
rgba = Image.new("RGBA", m.size, (255, 255, 255, 0))
rgba.putalpha(m)
rgba.save(f"{G}/{n}-night-sky.png", optimize=True)
am = np.asarray(m.resize((64, 462), Image.BILINEAR), float) / 255
res["hz"] = [round(float((am[:, i] > .15).sum() / 462), 3) for i in range(64)]
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
