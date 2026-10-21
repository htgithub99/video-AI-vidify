import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from render import render, sheet
style = sys.argv[1]; night = len(sys.argv) > 2 and sys.argv[2] == 'night'
keys = list(SCENES)
items = []
for k in keys:
    s, fy, l = build(k, style, night)
    s = s.replace('</svg>', '<line x1="0" y1="%d" x2="1920" y2="%d" stroke="#ff00ff" stroke-width="3" stroke-dasharray="20 20"/></svg>' % (fy, fy))
    items.append(s)
imgs = asyncio.run(render(items, 480, 270))
for i in range(0, len(imgs), 12):
    sheet(imgs[i:i + 12], 4, 'prev_%s_%s_%d.jpg' % (style, 'n' if night else 'd', i // 12))
print(len(imgs))
