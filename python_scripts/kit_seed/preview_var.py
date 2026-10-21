import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from render import render, sheet
style = sys.argv[1]; keys = sys.argv[2].split(',')
items = [build(k, style, n == 'n', v)[0] for k in keys for n in 'd' for v in range(4)]
imgs = asyncio.run(render(items, 480, 270))
sheet(imgs, 4, 'var_%s.jpg' % style)
