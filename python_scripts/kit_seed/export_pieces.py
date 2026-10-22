import sys, os, json, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pieces import PIECES, BASES
from core import T, f
from playwright.async_api import async_playwright

STYLES = ['minimal_mask', 'chibi_folk']


def piece_svg(t, items):
    defs = '<defs>%s</defs>' % ''.join(t.defs) if t.defs else ''
    return defs, ''.join(items)


async def bboxes(inners):
    out = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        pg = await b.new_page()
        for defs, inner in inners:
            await pg.set_content('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">%s<g id="x">%s</g></svg>' % (defs, inner))
            out.append(await pg.evaluate('(() => { const b = document.getElementById("x").getBBox(); return [b.x, b.y, b.width, b.height]; })()'))
        await b.close()
    return out


def build_all():
    res = {}
    jobs = []
    for style in STYLES:
        res[style] = dict(pieces={}, bases={})
        for pc in PIECES:
            for night in (False, True):
                t = T(style, night, seed=sum(map(ord, pc['key'])))
                jobs.append((style, pc, night, piece_svg(t, pc['build'](t)), t.lw))
        for key, fam, desc, fn in BASES:
            for night in (False, True):
                t = T(style, night, seed=sum(map(ord, key)))
                b = fn(t)
                defs = '<defs>%s</defs>' % ''.join(t.defs) if t.defs else ''
                svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">%s<g id="sky">%s</g><g id="back">%s</g><g id="floor">%s</g></svg>' % (defs, ''.join(b['sky']), ''.join(b['back']), ''.join(b['floor']))
                e = res[style]['bases'].setdefault(key, dict(key=key, family=fam, desc=desc, horizonY=b['horizonY'], floorY=b['floorY'], interior=b['interior']))
                e['night' if night else 'svg'] = svg
    boxes = asyncio.run(bboxes([j[3] for j in jobs]))
    pend = {}
    for (style, pc, night, (defs, inner), lw), bb in zip(jobs, boxes):
        m = lw * 2 + 4
        if not night:
            box = [round(bb[0] - m, 1), round(bb[1] - m, 1), round(bb[2] + 2 * m, 1), round(bb[3] + 2 * m, 1)]
            res[style]['pieces'][pc['key']] = dict(key=pc['key'], name=pc['name'], kind=pc['kind'], slots=pc['slots'], desc=pc['desc'], anchor=[pc['ax'], pc['ay']], native=pc['native'], spots=pc['spots'], lights=pc['lights'], box=box, front=pc['front'])
        pend[(style, pc['key'], night)] = (defs, inner)
    for (style, key, night), (defs, inner) in pend.items():
        e = res[style]['pieces'][key]
        x0, y0, w, h = e['box']
        e['night' if night else 'svg'] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s">%s%s</svg>' % (f(x0), f(y0), f(w), f(h), defs, inner)
    return res


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    res = build_all()
    for style, d in res.items():
        json.dump(d, open(os.path.join(out, style + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(style, len(d['pieces']), len(d['bases']), sum(len(p['svg']) for p in d['pieces'].values()) // 1024, 'KB')
