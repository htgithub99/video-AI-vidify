from seed_texts import SeedText as KST
from seed_utils import SEED_STYLES
import sys, os, json, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pieces import PIECES, BASES
from core import T, f
import subprocess
STYLES = list(SEED_STYLES)
def piece_svg(t, items):
    defs = KST.DEFS_S_DEFS % KST.EMPTY.join(t.defs) if t.defs else KST.EMPTY
    return (defs, KST.EMPTY.join(items))
async def bboxes(inners):
    runner = os.path.join(os.path.dirname(os.path.abspath(__file__)), KST.EXPORT_PIECE_BOXES_CJS)
    result = subprocess.run([os.environ.get(KST.KIT_NODE, KST.NODE), runner], input=json.dumps(inners), text=True, encoding=KST.UTF_8, capture_output=True, check=True)
    return json.loads(result.stdout)
def build_all():
    res = {}
    jobs = []
    for style in STYLES:
        res[style] = dict(pieces={}, bases={})
        for pc in PIECES:
            for night in (False, True):
                t = T(style, night, seed=sum(map(ord, pc[KST.KEY])))
                jobs.append((style, pc, night, piece_svg(t, pc[KST.BUILD](t)), t.lw))
        for key, fam, desc, fn in BASES:
            for night in (False, True):
                t = T(style, night, seed=sum(map(ord, key)))
                b = fn(t)
                defs = KST.DEFS_S_DEFS % KST.EMPTY.join(t.defs) if t.defs else KST.EMPTY
                svg = KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_1920_1080_S_G_ID_SKY_S_G_G_ID % (defs, KST.EMPTY.join(b[KST.SKY]), KST.EMPTY.join(b[KST.BACK]), KST.EMPTY.join(b[KST.FLOOR]))
                e = res[style][KST.BASES].setdefault(key, dict(key=key, family=fam, desc=desc, horizonY=b[KST.HORIZONY], floorY=b[KST.FLOORY], interior=b[KST.INTERIOR]))
                e[KST.NIGHT if night else KST.SVG] = svg
    boxes = asyncio.run(bboxes([j[3] for j in jobs]))
    pend = {}
    for (style, pc, night, (defs, inner), lw), bb in zip(jobs, boxes):
        m = lw * 2 + 4
        if not night:
            box = [round(bb[0] - m, 1), round(bb[1] - m, 1), round(bb[2] + 2 * m, 1), round(bb[3] + 2 * m, 1)]
            res[style][KST.PIECES][pc[KST.KEY]] = dict(key=pc[KST.KEY], name=pc[KST.NAME], kind=pc[KST.KIND], environment=pc[KST.ENVIRONMENT], slots=pc[KST.SLOTS], desc=pc[KST.DESC], anchor=[pc[KST.AX], pc[KST.AY]], native=pc[KST.NATIVE], spots=pc[KST.SPOTS], lights=pc[KST.LIGHTS], box=box, front=pc[KST.FRONT])
        pend[style, pc[KST.KEY], night] = (defs, inner)
    for (style, key, night), (defs, inner) in pend.items():
        e = res[style][KST.PIECES][key]
        x0, y0, w, h = e[KST.BOX]
        e[KST.NIGHT if night else KST.SVG] = KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_S_S_S_S_S_S_SVG % (f(x0), f(y0), f(w), f(h), defs, inner)
    return res
if __name__ == KST.MAIN:
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    res = build_all()
    for style, d in res.items():
        json.dump(d, open(os.path.join(out, style + KST.JSON_EXTENSION), KST.W, encoding=KST.UTF_8), ensure_ascii=False)
        print(style, len(d[KST.PIECES]), len(d[KST.BASES]), sum((len(p[KST.SVG]) for p in d[KST.PIECES].values())) // 1024, KST.KB)
