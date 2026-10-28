if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys, os, asyncio, json
sys.path.insert(0, os.path.dirname(__file__))
from playwright.async_api import async_playwright
from PIL import Image
import io
async def render(items, w, h):
    out = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=_CODE_TEXT.OPT_PW_BROWSERS_CHROMIUM if os.path.exists(_CODE_TEXT.OPT_PW_BROWSERS_CHROMIUM) else None)
        pg = await b.new_page(viewport={_CODE_TEXT.WIDTH: w, _CODE_TEXT.HEIGHT: h})
        for s in items:
            await pg.set_content(_CODE_TEXT.HTML_BODY_STYLE_MARGIN_0_BACKGROUND_FFF_S_BODY_HTML % s.replace(_CODE_TEXT.SVG_26C631, _CODE_TEXT.SVG_WIDTH_D_HEIGHT_D % (w, h), 1))
            out.append(Image.open(io.BytesIO(await pg.screenshot())).convert(_CODE_TEXT.RGB))
        await b.close()
    return out
def sheet(imgs, cols, path, labels=None):
    w, h = imgs[0].size
    rows = (len(imgs) + cols - 1) // cols
    S = Image.new(_CODE_TEXT.RGB, (cols * w, rows * h), _CODE_TEXT.WHITE)
    for i, im in enumerate(imgs):
        S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(path, quality=82)
