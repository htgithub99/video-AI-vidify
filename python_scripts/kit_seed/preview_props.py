if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from props import PROPS, build_prop
from render import render, sheet
style = sys.argv[1]
items = [build_prop(k, style)[0].replace(_CODE_TEXT.SVG_26C631, _CODE_TEXT.SVG_STYLE_BACKGROUND_E9E6DF, 1) for k in PROPS]
imgs = asyncio.run(render(items, 200, 200))
sheet(imgs, 9, _CODE_TEXT.PROPS_S_JPG % style)
print(len(imgs))
