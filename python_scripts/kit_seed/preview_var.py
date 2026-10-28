if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from render import render, sheet
style = sys.argv[1]
keys = sys.argv[2].split(_CODE_TEXT.SYMBOL_D03502)
items = [build(k, style, n == _CODE_TEXT.N, v)[0] for k in keys for n in _CODE_TEXT.D for v in range(4)]
imgs = asyncio.run(render(items, 480, 270))
sheet(imgs, 4, _CODE_TEXT.VAR_S_JPG % style)
