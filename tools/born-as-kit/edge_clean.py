import sys

import numpy as np
from PIL import Image
from scipy import ndimage

RING_PX = 2
MIN_LEVEL = 200
MAX_SAT = 40
MAX_SHARE = 0.5

for path in sys.argv[1:]:
    im = np.asarray(Image.open(path).convert("RGBA")).copy()
    solid = im[..., 3] > 16
    ring = solid & ndimage.binary_dilation(~solid, iterations=RING_PX)
    rgb = im[..., :3].astype(int)
    halo = ring & (rgb.min(2) > MIN_LEVEL) & (rgb.max(2) - rgb.min(2) < MAX_SAT)
    if 0 < halo.sum() < ring.sum() * MAX_SHARE:
        im[halo, 3] = 0
        Image.fromarray(im).save(path)
    print(path, int(halo.sum()))
