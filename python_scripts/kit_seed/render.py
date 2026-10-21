import sys, os, asyncio, json
sys.path.insert(0, os.path.dirname(__file__))
from playwright.async_api import async_playwright
from PIL import Image
import io

async def render(items, w, h):
    out = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
        pg = await b.new_page(viewport={'width': w, 'height': h})
        for s in items:
            await pg.set_content('<html><body style="margin:0;background:#fff">%s</body></html>' % s.replace('<svg ', '<svg width="%d" height="%d" ' % (w, h), 1))
            out.append(Image.open(io.BytesIO(await pg.screenshot())).convert('RGB'))
        await b.close()
    return out

def sheet(imgs, cols, path, labels=None):
    w, h = imgs[0].size
    rows = (len(imgs) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * h), 'white')
    for i, im in enumerate(imgs):
        S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(path, quality=82)
