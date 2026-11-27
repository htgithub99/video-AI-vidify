import sys
import numpy as np
from PIL import Image
from scipy import ndimage
for f in sys.argv[1:]:
    a = np.array(Image.open(f).convert('RGBA'))
    lab, n = ndimage.label(a[..., 3] > 20)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        a[lab != keep, 3] = 0
        r = np.where(a[..., 3].any(1))[0]; c = np.where(a[..., 3].any(0))[0]
        a = a[r.min():r.max() + 1, c.min():c.max() + 1]
    Image.fromarray(a).save(f)
    print(f, n, a.shape[1], a.shape[0])
