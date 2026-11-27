import json
import sys

import numpy as np
from PIL import Image

ALPHA_MIN = 20
WINDOWS = ((0.2, 0.45), (0.55, 0.8))


def main(key, prefix):
    im = np.asarray(Image.open(key).convert("RGBA"))
    col = (im[..., 3] > ALPHA_MIN).sum(0).astype(float)
    width = len(col)
    cuts = [int(lo * width + np.argmin(col[int(lo * width):int(hi * width)])) for lo, hi in WINDOWS]
    files = []
    for i, (x0, x1) in enumerate(zip([0] + cuts, cuts + [width])):
        part = im[:, x0:x1]
        ys, xs = np.where(part[..., 3] > ALPHA_MIN)
        if not len(ys):
            continue
        f = f"{prefix}_{i}.png"
        Image.fromarray(part[ys.min():ys.max() + 1, xs.min():xs.max() + 1]).save(f)
        files.append(f)
    print(json.dumps({"files": files}))


main(sys.argv[1], sys.argv[2])
