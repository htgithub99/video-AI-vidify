if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from render import render, sheet
style = sys.argv[1]
night = len(sys.argv) > 2 and sys.argv[2] == _CODE_TEXT.NIGHT
keys = list(SCENES)
items = []
for k in keys:
    s, fy, l = build(k, style, night)
    s = s.replace(_CODE_TEXT.SVG, _CODE_TEXT.LINE_X1_0_Y1_D_X2_1920_Y2_D_STROKE_FF00FF_STROKE_WIDTH_3_STR % (fy, fy))
    items.append(s)
imgs = asyncio.run(render(items, 480, 270))
for i in range(0, len(imgs), 12):
    sheet(imgs[i : i + 12], 4, _CODE_TEXT.PREV_S_S_D_JPG % (style, _CODE_TEXT.N if night else _CODE_TEXT.D, i // 12))
print(len(imgs))
