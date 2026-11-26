import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

def face_box(png, meta, top=0.5):
    im = np.asarray(Image.open(png).convert("RGBA")).astype(float) / 255
    x0, y0, w, h = meta["x"], meta["y"], meta["w"], meta["h"]
    sub = im[y0:y0 + int(h * top), x0:x0 + w]
    r, g, b, a = sub[..., 0], sub[..., 1], sub[..., 2], sub[..., 3]
    mx, mn = sub[..., :3].max(-1), sub[..., :3].min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    hue = np.where(mx == r, ((g - b) / np.maximum(mx - mn, 1e-3)) * 60, 0)
    skin = (a > 0.5) & (mx == r) & (mx > 0.62) & (sat > 0.16) & (sat < 0.58) & (hue > 8) & (hue < 42)
    lab, n = ndimage.label(ndimage.binary_opening(skin, iterations=1))
    if not n:
        cols = np.where(im[y0:y0 + int(h * 0.16), x0:x0 + w, 3].max(0) > 0.5)[0]
        c, hw = (cols.min() + cols.max()) / 2 if len(cols) else w / 2, h * 0.07
        return {"l": round((c - hw) / w, 4), "r": round((c + hw) / w, 4), "t": 0.0, "b": 0.16}
    sizes = ndimage.sum(skin, lab, range(1, n + 1))
    big = [i + 1 for i in range(n) if sizes[i] >= max(sizes) * 0.3 and sizes[i] > 40]
    body = im[y0 + int(h * 0.3):y0 + int(h * 0.6), x0:x0 + w, 3] > 0.5
    bx = np.median(np.where(body)[1]) if body.any() else w / 2
    k = min(big, key=lambda i: abs(np.where(lab == i)[1].mean() - bx) / w + np.where(lab == i)[0].min() / (h * top) * 0.3)
    ys, xs = np.where(lab == k)
    fl, fr, ft, fb = xs.min(), xs.max(), ys.min(), ys.max()
    fw, fh = fr - fl, fb - ft
    col = (sub[..., 3] > 0.5)
    hx0, hx1 = max(0, int(fl - fw * 0.15)), min(w, int(fr + fw * 0.15))
    rows = np.where(col[:ft + 1, hx0:hx1].any(1))[0]
    ht = int(rows.min()) if len(rows) else ft
    ht = max(ht, int(ft - fh * 1.2))
    return {"l": round(float(fl - fw * 0.12) / w, 4), "r": round(float(fr + fw * 0.12) / w, 4), "t": round(ht / h, 4), "b": round(float(fb) / h, 4)}

if __name__ == "__main__":
    root, out = sys.argv[1], sys.argv[2]
    res = {}
    for n in sys.argv[3:]:
        j = next((q for q in (f"{root}/{n}.json", f"{root}/pose/{n}.json") if os.path.exists(q)), None)
        if j:
            png = f"{root}/pose/{n}.png" if os.path.exists(f"{root}/pose/{n}.png") else f"{root}/key/{n}.png"
            meta = json.load(open(j))["meta"]
        else:
            png = f"{root}/png/{n}.png"
            w, h = Image.open(png).size
            meta = {"x": 0, "y": 0, "w": w, "h": h}
        res[n] = face_box(png, meta, 0.8 if n.startswith("bust") else 0.5)
    json.dump(res, open(out, "w"), indent=0)
    print(json.dumps(res))
