import sys, glob, os, json
from PIL import Image, ImageDraw, ImageFont
v = sys.argv[1]
fs = sorted(glob.glob(f'snaps60/{v}/t*.jpg'), key=lambda f: float(os.path.basename(f)[1:-4]))
words = json.load(open(f'voice/{v}/words.json'))
starts = [w[0][0] for w in words]
import bisect
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
os.makedirs(f'sheets/{v}', exist_ok=True)
for f in glob.glob(f'sheets/{v}/*'): os.remove(f)
for k in range(0, len(fs), 24):
    c = Image.new('RGB', (6 * 480, 4 * 270))
    for i, f in enumerate(fs[k:k + 24]):
        t = float(os.path.basename(f)[1:-4]); L = bisect.bisect_right(starts, t)
        im = Image.open(f).convert('RGB').resize((480, 270)); d = ImageDraw.Draw(im)
        d.text((6, 244), f'{k+i} t{t:.1f} L{L}', fill=(255, 255, 0), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
        c.paste(im, ((i % 6) * 480, (i // 6) * 270))
    c.save(f'sheets/{v}/s{k // 24:02d}.jpg', quality=80)
print(len(fs), (len(fs) + 23) // 24)
