if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import math, random, re
from illustration_texts import IllustrationText as I
W, H = 1920, 1080
NAVY = (12, 20, 38)
def hx(c):
    c = c.lstrip(_CODE_TEXT.SYMBOL_334359)
    return tuple(int(c[i : i + 2], 16) for i in (0, 2, 4))
def tohex(t):
    return _CODE_TEXT.VALUE_02X_02X_02X % tuple(max(0, min(255, int(round(v)))) for v in t)
def mix(a, b, k):
    A, B = hx(a), hx(b) if isinstance(b, str) else b
    return tohex(tuple(A[i] * (1 - k) + B[i] * k for i in range(3)))
def shade(c, k):
    return mix(c, _CODE_TEXT.VALUE_000000, k) if k > 0 else mix(c, _CODE_TEXT.FFFFFF, -k)
THEMES = {
    _CODE_TEXT.MINIMAL_MASK: dict(
        line=_CODE_TEXT.VALUE_0D0E10,
        lw=5,
        detail=0,
        grad=False,
        night_k=0.8,
        sky=_CODE_TEXT.VALUE_95A3AD,
        sky2=_CODE_TEXT.VALUE_95A3AD,
        night_sky=_CODE_TEXT.VALUE_0B1322,
        night_sky2=_CODE_TEXT.VALUE_0F182A,
        cloud=None,
        mtn=[_CODE_TEXT.VALUE_8A9AA2, _CODE_TEXT.VALUE_6F8288, _CODE_TEXT.VALUE_55696C],
        tree=_CODE_TEXT.VALUE_4B5D3E,
        tree2=_CODE_TEXT.VALUE_3F5034,
        trunk=_CODE_TEXT.VALUE_7A6650,
        wall=_CODE_TEXT.B9AD97,
        wall2=_CODE_TEXT.A89B84,
        roof=_CODE_TEXT.VALUE_7B4B3B,
        roof2=_CODE_TEXT.VALUE_5E3A2E,
        thatch=_CODE_TEXT.VALUE_9C8A5C,
        thatch2=_CODE_TEXT.VALUE_7F6F48,
        door=_CODE_TEXT.VALUE_4A3322,
        wood=_CODE_TEXT.VALUE_6B4A32,
        wood2=_CODE_TEXT.VALUE_8A6545,
        post=_CODE_TEXT.VALUE_5A3F2B,
        woven=_CODE_TEXT.A99674,
        woven2=_CODE_TEXT.VALUE_8F7D5E,
        brick=_CODE_TEXT.A5634A,
        brick2=_CODE_TEXT.VALUE_8A4F3A,
        earth=_CODE_TEXT.B6A88B,
        earth2=_CODE_TEXT.A1937A,
        dirt=_CODE_TEXT.VALUE_8C6B4F,
        grass=_CODE_TEXT.VALUE_6F7D52,
        grass2=_CODE_TEXT.VALUE_5C6A43,
        field=_CODE_TEXT.VALUE_7F8C55,
        field2=_CODE_TEXT.VALUE_6C7849,
        water=_CODE_TEXT.VALUE_6F8790,
        water2=_CODE_TEXT.VALUE_5C737C,
        stone=_CODE_TEXT.VALUE_8D8A83,
        stone2=_CODE_TEXT.VALUE_6F6C66,
        red=_CODE_TEXT.A6352B,
        gold=_CODE_TEXT.C9A548,
        cloth=_CODE_TEXT.E6E2D8,
        paper=_CODE_TEXT.D9C99A,
        dark=_CODE_TEXT.VALUE_25211E,
        fire=_CODE_TEXT.E8913A,
        glow=_CODE_TEXT.F2C46A,
        beam=_CODE_TEXT.VALUE_4A3727,
        floorwood=_CODE_TEXT.VALUE_7A5638,
        floorwood2=_CODE_TEXT.VALUE_664630,
        bamboo=_CODE_TEXT.VALUE_7E8F52,
        bamboo2=_CODE_TEXT.VALUE_5D6B3C,
        leaf=_CODE_TEXT.VALUE_5A6D45,
        mound=_CODE_TEXT.VALUE_7D6A50,
        rock=_CODE_TEXT.VALUE_7F7C75,
        lamp=_CODE_TEXT.F0D27A,
        moon=_CODE_TEXT.E9E4CF,
        interior_wall=_CODE_TEXT.B9AD97,
        interior_wall2=_CODE_TEXT.A89B84,
    ),
    _CODE_TEXT.CHIBI_FOLK: dict(
        line=_CODE_TEXT.VALUE_2A2220,
        lw=3,
        detail=2,
        grad=True,
        night_k=0.7,
        sky=_CODE_TEXT.A7C0D3,
        sky2=_CODE_TEXT.E2E9EA,
        night_sky=_CODE_TEXT.VALUE_0C1530,
        night_sky2=_CODE_TEXT.VALUE_1D2849,
        cloud=_CODE_TEXT.F1F4F3,
        mtn=[_CODE_TEXT.B4C3C8, _CODE_TEXT.VALUE_8FA6AB, _CODE_TEXT.VALUE_5F8180],
        tree=_CODE_TEXT.VALUE_4F7A45,
        tree2=_CODE_TEXT.VALUE_3D6338,
        trunk=_CODE_TEXT.VALUE_6D4C30,
        wall=_CODE_TEXT.C9A46A,
        wall2=_CODE_TEXT.A8854F,
        roof=_CODE_TEXT.VALUE_6B4A3A,
        roof2=_CODE_TEXT.VALUE_523628,
        thatch=_CODE_TEXT.B9A062,
        thatch2=_CODE_TEXT.VALUE_8F7744,
        door=_CODE_TEXT.VALUE_4B3424,
        wood=_CODE_TEXT.VALUE_8A6440,
        wood2=_CODE_TEXT.A87D52,
        post=_CODE_TEXT.VALUE_6D4C30,
        woven=_CODE_TEXT.C3A067,
        woven2=_CODE_TEXT.A3834F,
        brick=_CODE_TEXT.VALUE_9B6A4B,
        brick2=_CODE_TEXT.VALUE_835739,
        earth=_CODE_TEXT.VALUE_9D7150,
        earth2=_CODE_TEXT.VALUE_8A6143,
        dirt=_CODE_TEXT.VALUE_8A6143,
        grass=_CODE_TEXT.VALUE_6B9A4C,
        grass2=_CODE_TEXT.VALUE_55803C,
        field=_CODE_TEXT.VALUE_8CBF5F,
        field2=_CODE_TEXT.VALUE_6EA54A,
        water=_CODE_TEXT.VALUE_8DB7C7,
        water2=_CODE_TEXT.VALUE_6F9CB0,
        stone=_CODE_TEXT.A19F97,
        stone2=_CODE_TEXT.VALUE_85837B,
        red=_CODE_TEXT.B8343C,
        gold=_CODE_TEXT.D9A93B,
        cloth=_CODE_TEXT.ECE6DA,
        paper=_CODE_TEXT.E2CF98,
        dark=_CODE_TEXT.VALUE_2B231F,
        fire=_CODE_TEXT.F08A2C,
        glow=_CODE_TEXT.F6B85A,
        beam=_CODE_TEXT.VALUE_3B2A1E,
        floorwood=_CODE_TEXT.B58A55,
        floorwood2=_CODE_TEXT.VALUE_9A7243,
        bamboo=_CODE_TEXT.VALUE_93B05C,
        bamboo2=_CODE_TEXT.VALUE_64823B,
        leaf=_CODE_TEXT.VALUE_5D8A3F,
        mound=_CODE_TEXT.VALUE_8A6A48,
        rock=_CODE_TEXT.VALUE_8F8C84,
        lamp=_CODE_TEXT.F6D27A,
        moon=_CODE_TEXT.F3EFD8,
        interior_wall=_CODE_TEXT.B8925A,
        interior_wall2=_CODE_TEXT.VALUE_9C7A47,
    ),
}
KEEP = {_CODE_TEXT.FIRE, _CODE_TEXT.GLOW, _CODE_TEXT.LAMP, _CODE_TEXT.MOON, _CODE_TEXT.LINE, _CODE_TEXT.NIGHT_SKY, _CODE_TEXT.NIGHT_SKY2, _CODE_TEXT.RED, _CODE_TEXT.GOLD, _CODE_TEXT.CLOTH, _CODE_TEXT.PAPER}
WARM = {_CODE_TEXT.WALL, _CODE_TEXT.WALL2, _CODE_TEXT.INTERIOR_WALL, _CODE_TEXT.INTERIOR_WALL2, _CODE_TEXT.WOOD, _CODE_TEXT.WOOD2, _CODE_TEXT.FLOORWOOD, _CODE_TEXT.FLOORWOOD2, _CODE_TEXT.EARTH, _CODE_TEXT.EARTH2, _CODE_TEXT.ROOF, _CODE_TEXT.ROOF2, _CODE_TEXT.DOOR, _CODE_TEXT.BRICK, _CODE_TEXT.BRICK2, _CODE_TEXT.THATCH, _CODE_TEXT.THATCH2, _CODE_TEXT.WOVEN, _CODE_TEXT.WOVEN2}
GREEN = {_CODE_TEXT.TREE, _CODE_TEXT.TREE2, _CODE_TEXT.LEAF, _CODE_TEXT.GRASS, _CODE_TEXT.GRASS2, _CODE_TEXT.BAMBOO, _CODE_TEXT.BAMBOO2, _CODE_TEXT.FIELD, _CODE_TEXT.FIELD2}
def vary(k, c, v):
    if v == 1:
        return mix(c, _CODE_TEXT.C27A3A, 0.13) if k in WARM else mix(c, _CODE_TEXT.VALUE_4F7A3A, 0.12) if k in GREEN else c
    if v == 2:
        return mix(c, _CODE_TEXT.C8962E, 0.4) if k in GREEN else mix(c, _CODE_TEXT.B07A4A, 0.08) if k in WARM else c
    if v == 3:
        return mix(c, _CODE_TEXT.VALUE_7D868C, 0.38) if k in (_CODE_TEXT.SKY, _CODE_TEXT.SKY2, _CODE_TEXT.MTN) else mix(c, _CODE_TEXT.VALUE_8A9096, 0.14)
    return c
class T:
    def __init__(self, key, night=False, seed=0, v=0):
        self.key = key
        self.v = v
        self.p = dict(THEMES[key])
        for k in list(self.p):
            if isinstance(self.p[k], str) and self.p[k].startswith(_CODE_TEXT.SYMBOL_334359) and k not in KEEP:
                self.p[k] = vary(k, self.p[k], v)
        self.p[_CODE_TEXT.MTN] = [vary(_CODE_TEXT.MTN, m, v) for m in THEMES[key][_CODE_TEXT.MTN]]
        self.night = night
        self.rng = random.Random(seed)
        self.grad_id = 0
        self.defs = []
    def c(self, name):
        v = self.p[name]
        if self.night and name not in KEEP:
            return mix(v, NAVY, self.p[_CODE_TEXT.NIGHT_K])
        return v
    def raw(self, name):
        return self.p[name]
    @property
    def lw(self):
        return self.p[_CODE_TEXT.LW]
    @property
    def line(self):
        return self.p[_CODE_TEXT.LINE]
    @property
    def detail(self):
        return self.p[_CODE_TEXT.DETAIL]
    def lg(self, stops, x1=0, y1=0, x2=0, y2=1):
        self.grad_id += 1
        gid = _CODE_TEXT.G_D % self.grad_id
        s = ''.join(_CODE_TEXT.STOP_OFFSET_S_STOP_COLOR_S % (o, c) for o, c in stops)
        self.defs.append(_CODE_TEXT.LINEARGRADIENT_ID_S_X1_S_Y1_S_X2_S_Y2_S_S_LINEARGRADIENT % (gid, x1, y1, x2, y2, s))
        return _CODE_TEXT.URL_S % gid
    def rg(self, stops):
        self.grad_id += 1
        gid = _CODE_TEXT.G_D % self.grad_id
        s = ''.join(_CODE_TEXT.STOP_OFFSET_S_STOP_COLOR_S_STOP_OPACITY_S % (o, c, a) for o, c, a in stops)
        self.defs.append(_CODE_TEXT.RADIALGRADIENT_ID_S_S_RADIALGRADIENT % (gid, s))
        return _CODE_TEXT.URL_S % gid
def f(v):
    return (_CODE_TEXT.VALUE_1F % v).rstrip(_CODE_TEXT.VALUE_0).rstrip(_CODE_TEXT.SYMBOL_CDB4EE)
def pts(ps):
    return _CODE_TEXT.SYMBOL_36A9E7.join(_CODE_TEXT.S_S % (f(x), f(y)) for x, y in ps)
def svg_attributes(value):
    last = {attr.group(1): attr.start() for attr in re.finditer(I.SVG_ATTRIBUTE, value)}
    return re.sub(I.SVG_ATTRIBUTE, lambda attr: attr.group(0) if attr.start() == last[attr.group(1)] else '', value)
def st(t, fill, stroke=True, sw=None, extra=''):
    s = _CODE_TEXT.FILL_S % fill
    if stroke:
        s += _CODE_TEXT.STROKE_S_STROKE_WIDTH_S_STROKE_LINEJOIN_ROUND % (t.line, f(sw if sw is not None else t.lw))
    return svg_attributes(s + extra)
def rect(t, x, y, w, h, fill, stroke=True, sw=None, rx=0, extra=''):
    r = _CODE_TEXT.RX_S % f(rx) if rx else ''
    return _CODE_TEXT.RECT_X_S_Y_S_WIDTH_S_HEIGHT_S_S_S % (f(x), f(y), f(w), f(h), r, st(t, fill, stroke, sw, extra))
def poly(t, ps, fill, stroke=True, sw=None, extra=''):
    return _CODE_TEXT.POLYGON_POINTS_S_S % (pts(ps), st(t, fill, stroke, sw, extra))
def path(t, d, fill, stroke=True, sw=None, extra=''):
    return _CODE_TEXT.PATH_D_S_S % (d, st(t, fill, stroke, sw, extra))
def circ(t, x, y, r, fill, stroke=True, sw=None, extra=''):
    return _CODE_TEXT.CIRCLE_CX_S_CY_S_R_S_S % (f(x), f(y), f(r), st(t, fill, stroke, sw, extra))
def ell(t, x, y, rx, ry, fill, stroke=True, sw=None, extra=''):
    return _CODE_TEXT.ELLIPSE_CX_S_CY_S_RX_S_RY_S_S % (f(x), f(y), f(rx), f(ry), st(t, fill, stroke, sw, extra))
def line(t, x1, y1, x2, y2, color=None, sw=None, extra=''):
    return svg_attributes(_CODE_TEXT.LINE_X1_S_Y1_S_X2_S_Y2_S_STROKE_S_STROKE_WIDTH_S_STROKE_LINE % (f(x1), f(y1), f(x2), f(y2), color or t.line, f(sw if sw is not None else t.lw), extra))
def pline(t, ps, color=None, sw=None, extra=''):
    return svg_attributes(_CODE_TEXT.POLYLINE_POINTS_S_FILL_NONE_STROKE_S_STROKE_WIDTH_S_STROKE_L % (pts(ps), color or t.line, f(sw if sw is not None else t.lw), extra))
def op(a):
    return _CODE_TEXT.OPACITY_S % f(a)
def g(id_, items):
    return _CODE_TEXT.G_ID_S_S_G % (id_, ''.join(items))
def svg(t, sky, back, mid, floor, fg, vb=_CODE_TEXT.VALUE_0_0_1920_1080, occ=''):
    defs = _CODE_TEXT.DEFS_S_DEFS % ''.join(t.defs) if t.defs else ''
    return _CODE_TEXT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_S_S_S_S_S_S_S_S_S % (vb, defs, g(_CODE_TEXT.SKY, sky), g(_CODE_TEXT.BACK, back), g(_CODE_TEXT.MID, mid), g(_CODE_TEXT.FLOOR, floor), occ, g(_CODE_TEXT.FG, fg))
def psvg(t, items):
    defs = _CODE_TEXT.DEFS_S_DEFS % ''.join(t.defs) if t.defs else ''
    return _CODE_TEXT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_512_512_S_S_S % (defs, ''.join(items))
def spath(d, color, sw, extra=''):
    return svg_attributes(_CODE_TEXT.PATH_D_S_FILL_NONE_STROKE_S_STROKE_WIDTH_S_STROKE_LINECAP_RO % (d, color, f(sw), extra))
