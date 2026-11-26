import json
import sys

import cv2
import numpy as np

MIN_LEN = 70
FLAT_DEG = 4
STEEP_DEG = 75
Y_RANGE = (-1500, 1000)
BIN = 8
PAIRS = 6000


def lines_of(path):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None, None
    scale = 1920 / img.shape[1]
    img = cv2.resize(img, (1920, round(img.shape[0] * scale)))
    edges = cv2.Canny(cv2.GaussianBlur(img, (3, 3), 0), 60, 160)
    found = cv2.HoughLinesP(edges, 1, np.pi / 360, 80, minLineLength=MIN_LEN, maxLineGap=6)
    out = []
    for x1, y1, x2, y2 in (found.reshape(-1, 4) if found is not None else []):
        dx, dy = x2 - x1, y2 - y1
        deg = abs(np.degrees(np.arctan2(dy, dx)))
        deg = min(deg, 180 - deg)
        if FLAT_DEG < deg < STEEP_DEG:
            out.append((float(x1), float(y1), float(x2), float(y2), float(np.hypot(dx, dy))))
    return out, img.shape[0]


def meet(a, b):
    x1, y1, x2, y2 = a[:4]
    x3, y3, x4, y4 = b[:4]
    d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(d) < 1e-6:
        return None
    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d
    return x1 + t * (x2 - x1), y1 + t * (y2 - y1)


def horizon(path):
    lines, height = lines_of(path)
    if not lines or len(lines) < 6:
        return {"horizon": None, "lines": len(lines or []), "conf": 0}
    rng = np.random.default_rng(7)
    slope = lambda l: (l[3] - l[1]) / (l[2] - l[0] + 1e-9)
    up = [l for l in lines if slope(l) < 0]
    down = [l for l in lines if slope(l) > 0]
    groups = [(up, down)] if up and down else [(lines, lines)]
    ys, ws = [], []
    for a_list, b_list in groups:
        n = min(PAIRS, len(a_list) * len(b_list))
        for _ in range(n):
            a = a_list[rng.integers(len(a_list))]
            b = b_list[rng.integers(len(b_list))]
            if a is b:
                continue
            p = meet(a, b)
            if p is None or not (-2500 < p[0] < 4400) or not (Y_RANGE[0] < p[1] < Y_RANGE[1]):
                continue
            ys.append(p[1])
            ws.append(a[4] * b[4])
    if len(ys) < 20:
        return {"horizon": None, "lines": len(lines), "conf": 0}
    ys, ws = np.array(ys), np.array(ws)
    bins = np.arange(Y_RANGE[0], Y_RANGE[1] + BIN, BIN)
    hist, _ = np.histogram(ys, bins=bins, weights=ws)
    hist = np.convolve(hist, np.ones(5) / 5, mode="same")
    k = int(np.argmax(hist))
    y = float((bins[k] + bins[k + 1]) / 2)
    near = np.abs(ys - y) < 40
    conf = float(ws[near].sum() / ws.sum())
    return {"horizon": round(y), "lines": len(lines), "conf": round(conf, 3)}


if __name__ == "__main__":
    items = json.load(open(sys.argv[1], encoding="utf-8"))
    print(json.dumps({it["name"]: horizon(it["png"]) for it in items}))
