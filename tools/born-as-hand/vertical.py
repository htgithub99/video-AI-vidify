import json
import re
import shutil
import sys

from PIL import Image, ImageEnhance, ImageFilter

ROOT = "/home/claude/four"
W, H = 1080, 1920
SCALE = 1404 / 1920
LEFT, TOP = -162, 640

v = sys.argv[1]
d = f"{ROOT}/render_short/{v}"
plan = json.load(open(f"{ROOT}/voice/{v}_short/plan.json"))
bg = Image.open(f"{ROOT}/render/{v}/{plan['beats'][0]['bg']}.jpg").convert("RGB")
k = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * k), round(bg.height * k)), Image.LANCZOS)
x, y = (bg.width - W) // 2, (bg.height - H) // 2
bg = bg.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(28))
ImageEnhance.Brightness(bg).enhance(0.55).save(f"{d}/sbg.jpg", quality=88)
shutil.copy(f"{ROOT}/shorts/ov_{v}.png", f"{d}/ov.png")
html = open(f"{d}/index.html", encoding="utf-8").read()
html = html.replace('data-width="1920" data-height="1080"', f'data-width="{W}" data-height="{H}"', 1)
css = f"<style>#root{{width:{W}px!important;height:{H}px!important;background:#000 url(sbg.jpg) center/cover!important}}#stage{{position:absolute;left:{LEFT}px;top:{TOP}px;width:1920px;height:1080px;transform:scale({SCALE});transform-origin:0 0;overflow:hidden}}#stage .grain,#stage .vig{{position:absolute;inset:0}}#stage .hud{{transform:scale(.77);transform-origin:960px 540px}}#ovl{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;z-index:60;pointer-events:none}}</style></head>"
html = html.replace("</head>", css, 1)
html = re.sub(r'(<div id="root"[^>]*>\n?)', r'\1<div id="stage">', html, count=1)
html = html.replace('<div class="grain"></div><div class="vig"></div>', '<div class="grain"></div><div class="vig"></div></div><img id="ovl" src="ov.png">', 1)
open(f"{d}/index.html", "w", encoding="utf-8").write(html)
print("ok", v)
