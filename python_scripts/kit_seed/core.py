import math, random

W, H = 1920, 1080
NAVY = (12, 20, 38)


def hx(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def tohex(t):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in t)


def mix(a, b, k):
    A, B = hx(a), hx(b) if isinstance(b, str) else b
    return tohex(tuple(A[i] * (1 - k) + B[i] * k for i in range(3)))


def shade(c, k):
    return mix(c, '#000000', k) if k > 0 else mix(c, '#ffffff', -k)


THEMES = {
    'minimal_mask': dict(
        line='#0d0e10', lw=5, detail=0, grad=False, night_k=0.8,
        sky='#95a3ad', sky2='#95a3ad', night_sky='#0b1322', night_sky2='#0f182a',
        cloud=None, mtn=['#8a9aa2', '#6f8288', '#55696c'],
        tree='#4b5d3e', tree2='#3f5034', trunk='#7a6650',
        wall='#b9ad97', wall2='#a89b84', roof='#7b4b3b', roof2='#5e3a2e', thatch='#9c8a5c', thatch2='#7f6f48',
        door='#4a3322', wood='#6b4a32', wood2='#8a6545', post='#5a3f2b', woven='#a99674', woven2='#8f7d5e',
        brick='#a5634a', brick2='#8a4f3a', earth='#b6a88b', earth2='#a1937a', dirt='#8c6b4f', grass='#6f7d52', grass2='#5c6a43',
        field='#7f8c55', field2='#6c7849', water='#6f8790', water2='#5c737c', stone='#8d8a83', stone2='#6f6c66',
        red='#a6352b', gold='#c9a548', cloth='#e6e2d8', paper='#d9c99a', dark='#25211e', fire='#e8913a', glow='#f2c46a',
        beam='#4a3727', floorwood='#7a5638', floorwood2='#664630', bamboo='#7e8f52', bamboo2='#5d6b3c', leaf='#5a6d45',
        mound='#7d6a50', rock='#7f7c75', lamp='#f0d27a', moon='#e9e4cf', interior_wall='#b9ad97', interior_wall2='#a89b84',
    ),
    'chibi_folk': dict(
        line='#2a2220', lw=3, detail=2, grad=True, night_k=0.7,
        sky='#a7c0d3', sky2='#e2e9ea', night_sky='#0c1530', night_sky2='#1d2849',
        cloud='#f1f4f3', mtn=['#b4c3c8', '#8fa6ab', '#5f8180'],
        tree='#4f7a45', tree2='#3d6338', trunk='#6d4c30',
        wall='#c9a46a', wall2='#a8854f', roof='#6b4a3a', roof2='#523628', thatch='#b9a062', thatch2='#8f7744',
        door='#4b3424', wood='#8a6440', wood2='#a87d52', post='#6d4c30', woven='#c3a067', woven2='#a3834f',
        brick='#9b6a4b', brick2='#835739', earth='#9d7150', earth2='#8a6143', dirt='#8a6143', grass='#6b9a4c', grass2='#55803c',
        field='#8cbf5f', field2='#6ea54a', water='#8db7c7', water2='#6f9cb0', stone='#a19f97', stone2='#85837b',
        red='#b8343c', gold='#d9a93b', cloth='#ece6da', paper='#e2cf98', dark='#2b231f', fire='#f08a2c', glow='#f6b85a',
        beam='#3b2a1e', floorwood='#b58a55', floorwood2='#9a7243', bamboo='#93b05c', bamboo2='#64823b', leaf='#5d8a3f',
        mound='#8a6a48', rock='#8f8c84', lamp='#f6d27a', moon='#f3efd8', interior_wall='#b8925a', interior_wall2='#9c7a47',
    ),
}

KEEP = {'fire', 'glow', 'lamp', 'moon', 'line', 'night_sky', 'night_sky2', 'red', 'gold', 'cloth', 'paper'}
WARM = {'wall', 'wall2', 'interior_wall', 'interior_wall2', 'wood', 'wood2', 'floorwood', 'floorwood2', 'earth', 'earth2', 'roof', 'roof2', 'door', 'brick', 'brick2', 'thatch', 'thatch2', 'woven', 'woven2'}
GREEN = {'tree', 'tree2', 'leaf', 'grass', 'grass2', 'bamboo', 'bamboo2', 'field', 'field2'}


def vary(k, c, v):
    if v == 1:
        return mix(c, '#c27a3a', 0.13) if k in WARM else mix(c, '#4f7a3a', 0.12) if k in GREEN else c
    if v == 2:
        return mix(c, '#c8962e', 0.4) if k in GREEN else mix(c, '#b07a4a', 0.08) if k in WARM else c
    if v == 3:
        return mix(c, '#7d868c', 0.38) if k in ('sky', 'sky2', 'mtn') else mix(c, '#8a9096', 0.14)
    return c


class T:
    def __init__(self, key, night=False, seed=0, v=0):
        self.key = key
        self.v = v
        self.p = dict(THEMES[key])
        for k in list(self.p):
            if isinstance(self.p[k], str) and self.p[k].startswith('#') and k not in KEEP:
                self.p[k] = vary(k, self.p[k], v)
        self.p['mtn'] = [vary('mtn', m, v) for m in THEMES[key]['mtn']]
        self.night = night
        self.rng = random.Random(seed)
        self.grad_id = 0
        self.defs = []

    def c(self, name):
        v = self.p[name]
        if self.night and name not in KEEP:
            return mix(v, NAVY, self.p['night_k'])
        return v

    def raw(self, name):
        return self.p[name]

    @property
    def lw(self):
        return self.p['lw']

    @property
    def line(self):
        return self.p['line']

    @property
    def detail(self):
        return self.p['detail']

    def lg(self, stops, x1=0, y1=0, x2=0, y2=1):
        self.grad_id += 1
        gid = 'g%d' % self.grad_id
        s = ''.join('<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in stops)
        self.defs.append('<linearGradient id="%s" x1="%s" y1="%s" x2="%s" y2="%s">%s</linearGradient>' % (gid, x1, y1, x2, y2, s))
        return 'url(#%s)' % gid

    def rg(self, stops):
        self.grad_id += 1
        gid = 'g%d' % self.grad_id
        s = ''.join('<stop offset="%s" stop-color="%s" stop-opacity="%s"/>' % (o, c, a) for o, c, a in stops)
        self.defs.append('<radialGradient id="%s">%s</radialGradient>' % (gid, s))
        return 'url(#%s)' % gid


def f(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')


def pts(ps):
    return ' '.join('%s,%s' % (f(x), f(y)) for x, y in ps)


def st(t, fill, stroke=True, sw=None, extra=''):
    s = 'fill="%s"' % fill
    if stroke:
        s += ' stroke="%s" stroke-width="%s" stroke-linejoin="round"' % (t.line, f(sw if sw is not None else t.lw))
    return s + extra


def rect(t, x, y, w, h, fill, stroke=True, sw=None, rx=0, extra=''):
    r = ' rx="%s"' % f(rx) if rx else ''
    return '<rect x="%s" y="%s" width="%s" height="%s"%s %s/>' % (f(x), f(y), f(w), f(h), r, st(t, fill, stroke, sw, extra))


def poly(t, ps, fill, stroke=True, sw=None, extra=''):
    return '<polygon points="%s" %s/>' % (pts(ps), st(t, fill, stroke, sw, extra))


def path(t, d, fill, stroke=True, sw=None, extra=''):
    return '<path d="%s" %s/>' % (d, st(t, fill, stroke, sw, extra))


def circ(t, x, y, r, fill, stroke=True, sw=None, extra=''):
    return '<circle cx="%s" cy="%s" r="%s" %s/>' % (f(x), f(y), f(r), st(t, fill, stroke, sw, extra))


def ell(t, x, y, rx, ry, fill, stroke=True, sw=None, extra=''):
    return '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" %s/>' % (f(x), f(y), f(rx), f(ry), st(t, fill, stroke, sw, extra))


def line(t, x1, y1, x2, y2, color=None, sw=None, extra=''):
    return '<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" stroke-linecap="round"%s/>' % (f(x1), f(y1), f(x2), f(y2), color or t.line, f(sw if sw is not None else t.lw), extra)


def pline(t, ps, color=None, sw=None, extra=''):
    return '<polyline points="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"%s/>' % (pts(ps), color or t.line, f(sw if sw is not None else t.lw), extra)


def op(a):
    return ' opacity="%s"' % f(a)


def g(id_, items):
    return '<g id="%s">%s</g>' % (id_, ''.join(items))


def svg(t, sky, back, mid, floor, fg, vb='0 0 1920 1080', occ=''):
    defs = '<defs>%s</defs>' % ''.join(t.defs) if t.defs else ''
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">%s%s%s%s%s%s%s</svg>' % (vb, defs, g('sky', sky), g('back', back), g('mid', mid), g('floor', floor), occ, g('fg', fg))


def psvg(t, items):
    defs = '<defs>%s</defs>' % ''.join(t.defs) if t.defs else ''
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">%s%s</svg>' % (defs, ''.join(items))


def spath(d, color, sw, extra=''):
    return '<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"%s/>' % (d, color, f(sw), extra)
