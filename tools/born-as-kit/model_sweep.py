import sys, numpy as np
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove
sess = new_session("isnet-general-use")
lvl = float(sys.argv[1]); cut = float(sys.argv[2])
for p in sys.argv[3:]:
    a = np.array(Image.open(p).convert("RGBA"))
    flat = Image.new("RGB", (a.shape[1] + 40, a.shape[0] + 40), (255, 255, 255))
    flat.paste(Image.fromarray(a), (20, 20), Image.fromarray(a))
    fg = np.asarray(remove(flat, session=sess, only_mask=True).convert("L")).astype(float)[20:-20, 20:-20] / 255
    rgb = a[..., :3].astype(int); mn, mx = rgb.min(2), rgb.max(2)
    white = (a[..., 3] > 0) & (mn >= 225) & (mx - mn <= 16)
    lab, n = ndimage.label(white)
    if not n:
        continue
    idx = range(1, n + 1)
    s = ndimage.sum(white, lab, idx); m = ndimage.mean(mn, lab, idx); f = ndimage.mean(fg, lab, idx)
    kill = np.zeros(n + 1, bool)
    for i in range(n):
        if s[i] >= 8 and m[i] >= lvl and f[i] < cut:
            kill[i + 1] = True
    bg = ndimage.binary_dilation(kill[lab], iterations=1) & (mn >= 190)
    if bg.sum():
        a[..., 3][bg] = 0
        Image.fromarray(a).save(p)
        print(p, int(bg.sum()))
