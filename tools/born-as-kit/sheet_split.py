import sys, json, numpy as np
from PIL import Image
from scipy import ndimage

src, prefix = sys.argv[1], sys.argv[2]
expect = int(sys.argv[3]) if len(sys.argv) > 3 else 0
im = np.array(Image.open(src).convert("RGBA"))
a = im[:, :, 3] > 0
lab, n = ndimage.label(ndimage.binary_closing(a, iterations=3))
objs = ndimage.find_objects(lab)
sizes = ndimage.sum(a, lab, range(1, n + 1))
box = lambda o: (o[1].start, o[0].start, o[1].stop, o[0].stop)
big = [i for i in range(n) if sizes[i] > a.sum() * 0.004]
small = [i for i in range(n) if a.sum() * 0.0003 < sizes[i] <= a.sum() * 0.004]
parent = {i: i for i in big}


def find(i):
    while parent[i] != i:
        i = parent[i]
    return i


def inter(p, q):
    w = min(p[2], q[2]) - max(p[0], q[0])
    h = min(p[3], q[3]) - max(p[1], q[1])
    return max(w, 0) * max(h, 0)


area = lambda p: (p[2] - p[0]) * (p[3] - p[1])
for x in big:
    for y in big:
        if x < y:
            bx, by = box(objs[x]), box(objs[y])
            if inter(bx, by) > 0.6 * min(area(bx), area(by)):
                parent[find(y)] = find(x)
groups = {}
for i in big:
    groups.setdefault(find(i), []).append(i)
groups = list(groups.values())


def gbox(g):
    bs = [box(objs[i]) for i in g]
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))


for s in small:
    sb = box(objs[s])
    best = max(groups, key=lambda g: inter(gbox(g), (sb[0] - 8, sb[1] - 8, sb[2] + 8, sb[3] + 8)))
    if inter(gbox(best), (sb[0] - 8, sb[1] - 8, sb[2] + 8, sb[3] + 8)) > 0:
        best.append(s)
garea = lambda g: sum(sizes[i] for i in g)


def gap(p, q):
    dx = max(p[0] - q[2], q[0] - p[2], 0)
    dy = max(p[1] - q[3], q[1] - p[3], 0)
    return max(dx, dy)


while len(groups) > 1:
    med = float(np.median([garea(g) for g in groups]))
    tiny = [g for g in groups if garea(g) < 0.12 * med]
    moved = False
    for g in tiny:
        others = [o for o in groups if o is not g]
        near = min(others, key=lambda o: gap(gbox(g), gbox(o)))
        if gap(gbox(g), gbox(near)) < 40:
            near.extend(g)
            groups.remove(g)
            moved = True
            break
    if not moved:
        break
boxes = [gbox(g) for g in groups]
med_h = float(np.median([b[3] - b[1] for b in boxes]))
order = sorted(range(len(groups)), key=lambda k: (boxes[k][1] + boxes[k][3]) / 2)
rows = []
for k in order:
    cy = (boxes[k][1] + boxes[k][3]) / 2
    if rows and cy - rows[-1][0] < med_h * 0.5:
        rows[-1][1].append(k)
    else:
        rows.append([cy, [k]])
seq = [k for _, ks in rows for k in sorted(ks, key=lambda k: boxes[k][0])]
out = []
for idx, k in enumerate(seq):
    m = np.isin(lab, [i + 1 for i in groups[k]]) & a
    ys, xs = np.where(m)
    pad = 4
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad)
    xa, xb = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad)
    crop = im[y0:y1, xa:xb].copy()
    crop[:, :, 3] = np.where(m[y0:y1, xa:xb], crop[:, :, 3], 0)
    p = f"{prefix}_{idx}.png"
    Image.fromarray(crop, "RGBA").save(p)
    out.append(p)
print(json.dumps({"count": len(out), "expected": expect, "ok": not expect or expect == len(out), "files": out}))
