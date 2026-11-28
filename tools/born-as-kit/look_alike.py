"""Which pictures look alike (same figure drawn twice): python look_alike.py a.png b.png c.png ...

Prints JSON {"alike": [[i, j, distance], ...]} for every pair whose silhouette and colour hashes are both close.
Used to keep two near-identical extras out of one crowd.
"""
import json
import sys

import numpy as np
from PIL import Image

SIZE = 16
ALIKE_MAX = 0.12  # sum of shape, edge and colour differences; measured: the same crop 0.0, two views of one bust 0.02-0.09, two different horses 0.17, different soldiers 0.2+


def sig(path):
    im = Image.open(path).convert("RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    if box:
        im = im.crop(box)
    flat = Image.new("RGBA", im.size, (255, 255, 255, 255))
    flat.alpha_composite(im)
    shape = np.asarray(im.getchannel("A").resize((SIZE, SIZE))) > 40
    grey = np.asarray(flat.convert("L").resize((SIZE + 1, SIZE))).astype(int)
    edges = grey[:, 1:] > grey[:, :-1]
    color = np.asarray(flat.convert("RGB").resize((4, 8))).astype(float) / 255
    return shape, edges, color, im.width / max(1, im.height)


def main(paths):
    sigs = [sig(p) for p in paths]
    out = []
    for i in range(len(sigs)):
        for j in range(i + 1, len(sigs)):
            a, b = sigs[i], sigs[j]
            if abs(a[3] - b[3]) > 0.15 * max(a[3], b[3]):
                continue
            shape = float((a[0] != b[0]).mean())
            edges = float((a[1] != b[1]).mean())
            color = float(np.abs(a[2] - b[2]).mean())
            if shape + edges + color <= ALIKE_MAX:
                out.append([i, j, round(shape + edges + color, 3)])
    print(json.dumps({"alike": out}))


main(sys.argv[1:])
