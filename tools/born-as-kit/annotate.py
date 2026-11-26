import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from face_box import face_box

PEOPLE = {"person", "bust"}
TILE, COLS, ROWS = 300, 6, 5


def font(size):
    for f in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def head_box(a, w, h):
    top = a[: max(1, int(h * 0.16))]
    cols = np.where(top.any(0))[0]
    c = (cols.min() + cols.max()) / 2 if len(cols) else w / 2
    hw = h * 0.06
    return {"l": round((c - hw) / w, 4), "r": round((c + hw) / w, 4), "t": 0.0, "b": 0.16}


def measure_one(item):
    im = Image.open(item["png"]).convert("RGBA")
    a = np.asarray(im)[..., 3] > 128
    h, w = a.shape
    rows = np.where(a.any(1))[0]
    if not len(rows):
        return {"empty": True}
    yb = int(rows.max())
    band = a[max(0, yb - max(2, int(h * 0.04))):yb + 1]
    xs = np.where(band.any(0))[0]
    out = {"aspect": round(w / h, 4), "foot": round(float(xs.mean()) / w, 4), "pad": round((h - 1 - yb) / h, 4), "suspect": []}
    if item.get("kind") in PEOPLE:
        bust = item["kind"] == "bust"
        try:
            f = face_box(item["png"], {"x": 0, "y": 0, "w": w, "h": h}, 0.8 if bust else 0.5)
        except Exception:
            f = head_box(a, w, h)
            out["suspect"].append("noskin")
        fh, fw = f["b"] - f["t"], f["r"] - f["l"]
        if f["t"] == 0.0 and abs(f["b"] - 0.16) < 1e-6:
            out["suspect"].append("noskin")
        standing = w / h < 0.8 and not bust
        if standing and not (0.07 <= fh <= 0.24):
            out["suspect"].append("size")
        if standing and f["t"] > 0.35:
            out["suspect"].append("low")
        if fw > 0.9:
            out["suspect"].append("wide")
        out["face"] = f
        out["mouth"] = [round((f["l"] + f["r"]) / 2, 4), round(f["t"] + (f["b"] - f["t"]) * 0.78, 4)]
    return out


def measure(manifest, out):
    items = json.load(open(manifest, encoding="utf-8"))
    res = {}
    for it in items:
        try:
            res[it["name"]] = measure_one(it)
        except Exception:
            res[it["name"]] = {"empty": True}
    json.dump(res, open(out, "w", encoding="utf-8"))
    print(json.dumps({"count": len(res), "suspect": sum(1 for v in res.values() if v.get("suspect"))}))


def sprite_sheets(manifest, prefix):
    items = json.load(open(manifest, encoding="utf-8"))
    per = COLS * ROWS
    out = []
    big, small = font(34), font(16)
    for s in range(0, len(items), per):
        part = items[s:s + per]
        rows = (len(part) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * TILE, rows * (TILE + 30)), (236, 236, 236))
        d = ImageDraw.Draw(sheet)
        for i, it in enumerate(part):
            x, y = (i % COLS) * TILE, (i // COLS) * (TILE + 30)
            d.rectangle([x + 4, y + 4, x + TILE - 4, y + TILE - 4], fill=(255, 255, 255), outline=(180, 180, 180))
            im = Image.open(it["png"]).convert("RGBA")
            sc = min((TILE - 24) / im.width, (TILE - 24) / im.height)
            im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))))
            ox, oy = x + (TILE - im.width) // 2, y + (TILE - im.height) // 2
            sheet.paste(im, (ox, oy), im)
            f = it.get("face")
            if f:
                d.rectangle([ox + f["l"] * im.width, oy + f["t"] * im.height, ox + f["r"] * im.width, oy + f["b"] * im.height], outline=(230, 0, 0), width=3)
            d.text((x + 10, y + 8), str(s + i + 1), fill=(200, 0, 0), font=big)
            d.text((x + 8, y + TILE + 4), it["name"][-30:], fill=(40, 40, 40), font=small)
        f = f"{prefix}_{s // per + 1}.jpg"
        sheet.save(f, quality=85)
        out.append({"file": f, "names": [it["name"] for it in part], "start": s + 1})
    print(json.dumps(out))


def bg_sheets(manifest, prefix):
    items = json.load(open(manifest, encoding="utf-8"))
    out = []
    lab = font(26)
    for i, it in enumerate(items):
        im = Image.open(it["png"]).convert("RGB").resize((1920, 1080))
        d = ImageDraw.Draw(im, "RGBA")
        for gx in range(0, 1921, 100):
            d.line([(gx, 0), (gx, 1080)], fill=(255, 0, 0, 90 if gx % 500 else 170), width=2 if gx % 500 else 3)
            if gx % 200 == 0:
                d.text((gx + 4, 4), str(gx), fill=(255, 0, 0, 255), font=lab)
        for gy in range(0, 1081, 50):
            major = gy % 100 == 0
            d.line([(0, gy), (1920, gy)], fill=(0, 90, 255, 110 if major else 50), width=2 if major else 1)
            if major:
                d.text((4, gy + 2), str(gy), fill=(0, 60, 220, 255), font=lab)
        d.text((800, 1040), f"#{i + 1} {it['name']}", fill=(0, 0, 0, 255), font=lab)
        f = f"{prefix}_{i + 1}.jpg"
        im.resize((1440, 810)).save(f, quality=86)
        out.append({"file": f, "name": it["name"]})
    print(json.dumps(out))


def free_zones(png):
    im = np.asarray(Image.open(png).convert("L").resize((96, 54))).astype(float)
    gy, gx = np.gradient(im)
    edge = np.hypot(gx, gy)
    zones = []
    for y0 in range(0, 27, 3):
        for x0 in range(0, 96 - 24, 6):
            e = edge[y0:y0 + 9, x0:x0 + 24].mean()
            zones.append((e, x0, y0))
    zones.sort()
    keep = []
    for e, x0, y0 in zones:
        if len(keep) >= 3:
            break
        if all(abs(x0 - k[1]) >= 24 or abs(y0 - k[2]) >= 9 for k in keep):
            keep.append((e, x0, y0))
    return [[x * 20, y * 20, x * 20 + 480, y * 20 + 180] for _, x, y in keep]


def bg_free(manifest, out):
    items = json.load(open(manifest, encoding="utf-8"))
    json.dump({it["name"]: free_zones(it["png"]) for it in items}, open(out, "w", encoding="utf-8"))
    print(json.dumps({"count": len(items)}))


def frame_sheets(manifest, prefix):
    items = json.load(open(manifest, encoding="utf-8"))
    cols, rows, tw, th, band = 4, 3, 640, 360, 40
    per = cols * rows
    lab = font(30)
    out = []
    for s in range(0, len(items), per):
        part = items[s:s + per]
        sheet = Image.new("RGB", (cols * tw, ((len(part) + cols - 1) // cols) * (th + band)), (20, 20, 20))
        d = ImageDraw.Draw(sheet)
        for i, it in enumerate(part):
            x, y = (i % cols) * tw, (i // cols) * (th + band)
            sheet.paste(Image.open(it["file"]).convert("RGB").resize((tw - 6, th - 6)), (x + 3, y + 3))
            d.text((x + 10, y + th + 2), str(s + i + 1), fill=(255, 230, 0), font=lab)
        f = f"{prefix}_{s // per + 1}.jpg"
        sheet.save(f, quality=84)
        out.append({"file": f, "start": s + 1, "count": len(part)})
    print(json.dumps(out))


if __name__ == "__main__":
    mode = sys.argv[1]
    {"measure": measure, "sprites": sprite_sheets, "bgs": bg_sheets, "free": bg_free, "frames": frame_sheets}[mode](sys.argv[2], sys.argv[3])
