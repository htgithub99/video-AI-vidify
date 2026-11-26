import sys, numpy as np
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove
src, dst = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert("RGB")).astype(int)
mn, mx = im.min(2), im.max(2)
white = (mn >= 238) & (mx - mn <= 14)
lab, n = ndimage.label(white)
idx = range(1, n + 1)
sizes = ndimage.sum(white, lab, idx)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bgv = float(np.median(mn[np.isin(lab, list(edge))])) if edge else 255.0
level = ndimage.mean(mn, lab, idx)
thick = ndimage.maximum(ndimage.distance_transform_edt(white), lab, idx)
chroma = ndimage.mean(mx - mn, lab, idx)
fg = np.asarray(remove(Image.open(src).convert("RGB"), session=new_session("isnet-general-use"), only_mask=True).convert("L")).astype(float) / 255
model = ndimage.mean(fg, lab, idx)
pure = ndimage.mean(mn >= bgv - 2, lab, idx)
kill = np.zeros(n + 1, bool)
for i, (s, m, c, w, f, q) in enumerate(zip(sizes, level, chroma, thick, model, pure), 1):
    rule = (s >= 30 and w > 3 and m >= bgv - 7 and c <= 6) or (s >= 60 and w <= 3 and m >= bgv - 9 and 4.5 <= c <= 7.5)
    if i in edge or (f < 0.4 and m >= bgv - 10) or (rule and (f < 0.75 or (m >= bgv - 3 and q >= 0.5 and c <= 2))):
        kill[i] = True
bg = kill[lab]
bg = ndimage.binary_dilation(bg, iterations=1) & (mn >= 200)
alpha = np.where(bg, 0, 255).astype(np.uint8)
out = np.dstack([im.astype(np.uint8), alpha])
Image.fromarray(out, "RGBA").save(dst)
print(dst, n, int(bg.sum()))
