import sys
import numpy as np
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove

WHITE_MIN = 238
WHITE_CHROMA = 14
CORE_ERODE = 2
CORE_MIN = 12
HOLE_LEVEL = 6
HOLE_CHROMA = 4
THIN_LEVEL = 9
THIN_CHROMA = 4
MODEL_HOLE = 0.75
MODEL_BG = 0.4
SKIN_RING = 4
SKIN_SHARE = 0.25
EDGE_PX = 2.5
INK_RING = 2
INK_LEVEL = 110
INK_SHARE = 0.5
THIN_MIN = 40
SLIVER_MIN = 8
SLIVER_LEVEL = 14
SLIVER_CHROMA = 8
INK = 40

PAD = 4

def key(src, dst, session, objects, edge_only):
    source = Image.open(src)
    keep = None
    if "A" in source.getbands():
        rgba = source.convert("RGBA")
        flat = Image.new("RGBA", (rgba.width + 2 * PAD, rgba.height + 2 * PAD), (255, 255, 255, 255))
        flat.alpha_composite(rgba, (PAD, PAD))
        keep = np.pad(np.asarray(rgba)[..., 3].astype(float) / 255, PAD)
        source = flat
    source = source.convert("RGB")
    im = np.array(source).astype(int)
    mn, mx = im.min(2), im.max(2)
    chroma = mx - mn
    white = (mn >= WHITE_MIN) & (chroma <= WHITE_CHROMA)
    lab, n = ndimage.label(white)
    idx = np.arange(1, n + 1)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgv = float(np.median(mn[np.isin(lab, list(edge))])) if edge else 255.0
    core = ndimage.binary_erosion(white, iterations=CORE_ERODE)
    clab = np.where(core, lab, 0)
    core_n = ndimage.sum(core, lab, idx)
    core_level = ndimage.median(mn, clab, idx)
    core_chroma = ndimage.mean(chroma, clab, idx)
    level = ndimage.mean(mn, lab, idx)
    tone = ndimage.mean(chroma, lab, idx)
    model = np.ones(n) if keep is not None else ndimage.mean(np.asarray(remove(source, session=session, only_mask=True).convert("L")).astype(float) / 255, lab, idx)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    skin = (r > g) & (g > b) & (r - b > 30) & (mn > 90)
    ring = ndimage.binary_dilation(white, iterations=SKIN_RING) & ~white
    ring_lab = ndimage.grey_dilation(lab, size=2 * SKIN_RING + 1) * ring
    skin_share = ndimage.mean(skin, ring_lab, idx)
    edge_ring = ndimage.binary_dilation(white, iterations=INK_RING) & ~white
    edge_lab = ndimage.grey_dilation(lab, size=2 * INK_RING + 1) * edge_ring
    ink_share = ndimage.mean(mx < INK_LEVEL, edge_lab, idx)
    sizes = ndimage.sum(white, lab, idx)
    kill = np.zeros(n + 1, bool)
    for i in idx:
        k = i - 1
        open_hole = skin_share[k] < SKIN_SHARE and ink_share[k] >= INK_SHARE
        hole = open_hole and core_n[k] >= CORE_MIN and core_level[k] >= bgv - HOLE_LEVEL and core_chroma[k] <= HOLE_CHROMA
        flat = level[k] >= bgv - THIN_LEVEL and tone[k] <= THIN_CHROMA
        thin = flat and sizes[k] >= THIN_MIN and (model[k] < MODEL_HOLE or open_hole)
        sliver = objects and open_hole and sizes[k] >= SLIVER_MIN and level[k] >= bgv - SLIVER_LEVEL and tone[k] <= SLIVER_CHROMA
        kill[i] = (i in edge or (hole and model[k] < MODEL_HOLE)) if edge_only else i in edge or hole or thin or sliver or (model[k] < MODEL_BG and level[k] >= bgv - 10)
    bg = ndimage.binary_dilation(kill[lab], iterations=1) & (mn >= 200)
    alpha = np.where(bg, 0.0, 1.0)
    near = ~bg & (ndimage.distance_transform_edt(~bg) <= EDGE_PX)
    cover = np.clip((bgv - mn) / (bgv - INK), 0, 1)
    alpha[near] = cover[near]
    rgb = im.astype(float)
    a3 = np.maximum(alpha, 1e-3)[..., None]
    fix = np.clip((rgb - (1 - a3) * bgv) / a3, 0, 255)
    rgb = np.where(near[..., None], fix, rgb)
    alpha[alpha < 0.06] = 0
    if keep is not None:
        alpha = np.minimum(alpha, keep)
    out = np.dstack([rgb.round().astype(np.uint8), (alpha * 255).round().astype(np.uint8)])
    if keep is not None:
        out = out[PAD:-PAD, PAD:-PAD]
    Image.fromarray(out, "RGBA").save(dst)
    print(dst, n, int(bg.sum()))


objects = "--objects" in sys.argv
edge_only = "--edge" in sys.argv
paths = [a for a in sys.argv[1:] if a not in ("--objects", "--edge")]
session = new_session("isnet-general-use")
for src, dst in zip(paths[::2], paths[1::2]):
    key(src, dst, session, objects, edge_only)
