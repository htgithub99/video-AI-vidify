import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
for p in sys.argv[1:]:
    a = np.array(Image.open(p).convert("RGBA"))
    rgb = a[..., :3].astype(int); mn, mx = rgb.min(2), rgb.max(2)
    white = (a[..., 3] > 0) & (mn >= 238) & (mx - mn <= 14)
    lab, n = ndimage.label(white)
    if not n:
        continue
    idx = range(1, n + 1)
    s = ndimage.sum(white, lab, idx); m = ndimage.mean(mn, lab, idx)
    w = ndimage.maximum(ndimage.distance_transform_edt(white), lab, idx)
    kill = np.zeros(n + 1, bool)
    for i in range(n):
        if (s[i] >= 15 and m[i] >= 250) or (s[i] >= 20 and w[i] <= 3 and m[i] >= 247):
            kill[i + 1] = True
    bg = ndimage.binary_dilation(kill[lab], iterations=1) & (mn >= 200)
    if bg.any():
        a[..., 3][bg] = 0
        Image.fromarray(a).save(p)
        print(p, int(bg.sum()))
