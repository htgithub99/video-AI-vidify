import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from props import PROPS, build_prop
from render import render, sheet
style = sys.argv[1]
items = [build_prop(k, style)[0].replace('<svg ', '<svg style="background:#e9e6df" ', 1) for k in PROPS]
imgs = asyncio.run(render(items, 200, 200))
sheet(imgs, 9, 'props_%s.jpg' % style)
print(len(imgs))
