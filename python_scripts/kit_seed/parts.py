from core import *


def sky(t, horizon=760):
    out = []
    if t.night:
        if t.p['grad']:
            out.append(rect(t, 0, 0, W, H, t.lg([(0, t.raw('night_sky')), (1, t.raw('night_sky2'))]), False))
        else:
            out.append(rect(t, 0, 0, W, H, t.raw('night_sky'), False))
        if t.detail:
            for _ in range(46):
                x, y = t.rng.uniform(0, W), t.rng.uniform(0, horizon * 0.7)
                out.append(circ(t, x, y, t.rng.uniform(1.2, 2.6), '#dfe6f2', False, extra=op(t.rng.uniform(0.35, 0.9))))
            out.append(circ(t, 1560, 150, 120, t.rg([(0, '#f3efd8', 0.35), (1, '#f3efd8', 0)]), False))
        mx = 1560 if t.detail else 1640
        out.append(circ(t, mx, 150, 34 if t.detail else 30, t.c('moon'), False, extra=op(0.95 if t.detail else 0.55)))
    else:
        if t.p['grad']:
            out.append(rect(t, 0, 0, W, H, t.lg([(0, t.raw('sky')), (1, t.raw('sky2'))]), False))
        else:
            out.append(rect(t, 0, 0, W, H, t.raw('sky'), False))
        if t.p['cloud']:
            for cx, cy, s in [(260, 120, 1.0), (980, 80, 0.8), (1560, 150, 1.2)]:
                out.append(ell(t, cx, cy, 150 * s, 26 * s, t.c('cloud'), False, extra=op(0.85)))
                out.append(ell(t, cx + 70 * s, cy - 14 * s, 90 * s, 22 * s, t.c('cloud'), False, extra=op(0.85)))
    return out


def zig(t, y, amp, step, color, seed=0, stroke=False, top=None):
    r = __import__('random').Random(seed)
    ps = [(-40, H)]
    x = -40
    up = True
    while x < W + 80:
        ps.append((x, y - (amp * r.uniform(0.55, 1.0) if up else amp * r.uniform(0.0, 0.25))))
        x += step * r.uniform(0.7, 1.25)
        up = not up
    ps.append((W + 80, H))
    return poly(t, ps, color, stroke, sw=t.lw * 0.6)


def mountains(t, base=640, n=3):
    cols = [mix(m, NAVY, min(0.88, t.p['night_k'] * 1.18)) if t.night else m for m in t.p['mtn']]
    out = []
    for i in range(n):
        out.append(zig(t, base - 260 + i * 95, 170 - i * 30, 260 - i * 30, cols[min(i, len(cols) - 1)], seed=11 + i, stroke=bool(t.detail and i == n - 1)))
    if t.detail and not t.night:
        for i in range(3):
            out.append(ell(t, 300 + i * 650, base - 150 + i * 20, 260, 30, t.c('cloud'), False, extra=op(0.55)))
    return out


def hills(t, base=700):
    return [path(t, 'M-20 %s Q 320 %s 700 %s T 1500 %s Q 1760 %s 1940 %s L1940 1080 L-20 1080 Z' % (base, base - 160, base - 60, base - 90, base - 170, base - 40), mix(t.c('tree2'), mix(t.p['mtn'][1], NAVY, t.p['night_k']) if t.night else t.p['mtn'][1], 0.4), True, sw=t.lw * 0.7)]


def poly_tree(t, x, y, s=1.0, dark=False):
    c = t.c('tree2' if dark else 'tree')
    ps = [(x - 160 * s, y), (x - 210 * s, y - 220 * s), (x - 120 * s, y - 420 * s), (x + 30 * s, y - 470 * s), (x + 150 * s, y - 330 * s), (x + 170 * s, y - 120 * s), (x + 90 * s, y)]
    return [poly(t, ps, c, False)]


def round_tree(t, x, y, s=1.0):
    out = [rect(t, x - 14 * s, y - 170 * s, 28 * s, 170 * s, t.c('trunk'), True)]
    for dx, dy, r in [(-70, -230, 90), (60, -240, 95), (0, -320, 110), (-20, -200, 85), (90, -180, 70), (-100, -170, 65)]:
        out.append(circ(t, x + dx * s, y + dy * s, r * s, t.c('tree'), True))
    if t.detail:
        for dx, dy, r in [(-50, -290, 40), (40, -330, 36), (80, -230, 30)]:
            out.append(circ(t, x + dx * s, y + dy * s, r * s, mix(t.c('tree'), '#ffffff', 0.12), False))
    return out


def bonsai_tree(t, x, y, s=1.0):
    out = [pline(t, [(x, y), (x + 10 * s, y - 120 * s), (x - 20 * s, y - 220 * s), (x + 30 * s, y - 300 * s)], t.c('trunk'), 12 * s)]
    for dx, dy in [(-40, -300), (10, -330), (60, -300), (-60, -250), (40, -260)]:
        out.append(ell(t, x + dx * s, y + dy * s, 36 * s, 20 * s, t.c('leaf'), True, sw=t.lw * 0.6))
    return out


def banyan(t, x, y, s=1.0):
    out = []
    for dx, dy, r in [(-260, -470, 170), (0, -560, 210), (250, -470, 170), (-140, -380, 140), (150, -380, 150), (-360, -340, 110), (360, -340, 110)]:
        out.append(circ(t, x + dx * s, y + dy * s, r * s, t.c('tree2'), True))
    if t.detail:
        for dx, dy, r in [(-120, -560, 80), (120, -600, 90), (280, -500, 70), (-280, -500, 70)]:
            out.append(circ(t, x + dx * s, y + dy * s, r * s, t.c('tree'), False))
    out.append(path(t, 'M%s %s C %s %s %s %s %s %s L %s %s C %s %s %s %s %s %s Z' % (
        f(x - 110 * s), f(y), f(x - 70 * s), f(y - 120 * s), f(x - 90 * s), f(y - 260 * s), f(x - 60 * s), f(y - 380 * s),
        f(x + 70 * s), f(y - 380 * s), f(x + 90 * s), f(y - 260 * s), f(x + 70 * s), f(y - 120 * s), f(x + 120 * s), f(y)), t.c('trunk'), True))
    for i in range(9):
        rx = x + (-330 + i * 82) * s
        out.append(line(t, rx, y - 330 * s, rx + t.rng.uniform(-10, 10), y - (60 + (i % 3) * 50) * s, t.c('trunk'), 4 * s if not t.detail else 3))
    return out


def palm(t, x, y, s=1.0):
    out = [pline(t, [(x, y), (x + 8 * s, y - 220 * s), (x + 4 * s, y - 470 * s)], t.c('trunk'), 9 * s)]
    for a in range(0, 360, 30):
        r = math.radians(a)
        out.append(line(t, x + 4 * s, y - 470 * s, x + 4 * s + math.cos(r) * 130 * s, y - 470 * s + math.sin(r) * 50 * s - 10, t.c('leaf'), 5 * s))
    return out


def bamboo(t, x, y, s=1.0, n=7):
    out = []
    r = t.rng
    for i in range(n):
        bx = x + (i - n / 2) * 18 * s
        top = y - r.uniform(380, 560) * s
        lean = r.uniform(-60, 60) * s
        out.append(pline(t, [(bx, y), (bx + lean * 0.4, (y + top) / 2), (bx + lean, top)], t.c('bamboo2'), 7 * s))
        for k in range(6):
            yy = y - k * (y - top) / 6 - 40 * s
            xx = bx + lean * (y - yy) / (y - top)
            side = 1 if k % 2 else -1
            out.append(spath('M%s %s q %s %s %s %s' % (f(xx), f(yy), f(side * 30 * s), f(-14 * s), f(side * 62 * s), f(6 * s)), t.c('bamboo'), 6 * s))
    return out


def banana(t, x, y, s=1.0):
    out = [rect(t, x - 12 * s, y - 230 * s, 24 * s, 230 * s, t.c('grass2'), True, sw=t.lw * 0.7)]
    for a, l in [(-150, 170), (-120, 190), (-60, 190), (-30, 170), (-95, 150)]:
        r = math.radians(a)
        ex, ey = x + math.cos(r) * l * s, y - 230 * s + math.sin(r) * l * s
        out.append(path(t, 'M%s %s Q %s %s %s %s Q %s %s %s %s Z' % (f(x), f(y - 230 * s), f((x + ex) / 2 - 30 * s), f((y - 230 * s + ey) / 2 - 30 * s), f(ex), f(ey), f((x + ex) / 2 + 20 * s), f((y - 230 * s + ey) / 2 + 20 * s), f(x), f(y - 230 * s)), t.c('grass'), True, sw=t.lw * 0.6))
    return out


def pine(t, x, y, s=1.0):
    out = [rect(t, x - 8 * s, y - 80 * s, 16 * s, 80 * s, t.c('trunk'), True, sw=t.lw * 0.6)]
    for i in range(3):
        w, top = (120 - i * 30) * s, y - (80 + i * 80) * s
        out.append(poly(t, [(x - w, top), (x, top - 150 * s), (x + w, top)], t.c('tree2'), True, sw=t.lw * 0.7))
    return out


def reeds(t, x, y, s=1.0, n=9):
    out = []
    for i in range(n):
        bx = x + (i - n / 2) * 12 * s
        h = t.rng.uniform(120, 220) * s
        lean = t.rng.uniform(-30, 30) * s
        out.append(pline(t, [(bx, y), (bx + lean, y - h)], t.c('grass2'), 4 * s))
    return out


def bush(t, x, y, s=1.0):
    return [circ(t, x + dx * s, y + dy * s, r * s, t.c('tree'), True, sw=t.lw * 0.7) for dx, dy, r in [(-50, -30, 45), (0, -55, 55), (55, -30, 45)]]


def roof_tiles(t, x, y, w, h, color, overhang=40, curve=False):
    out = []
    if curve:
        d = 'M%s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z' % (f(x - overhang - 30), f(y + h - 30), f(x + w * 0.2), f(y + h - 10), f(x + w * 0.25), f(y), f(x + w * 0.75), f(y), f(x + w * 0.8), f(y + h - 10), f(x + w + overhang + 30), f(y + h - 30))
        out.append(path(t, d, color, True))
    else:
        out.append(poly(t, [(x - overhang, y + h), (x + w * 0.22, y), (x + w * 0.78, y), (x + w + overhang, y + h)], color, True))
    if t.detail:
        for i in range(1, 12):
            xx = x - overhang + (w + 2 * overhang) * i / 12
            out.append(line(t, xx, y + h, x + w * 0.22 + (w * 0.56) * i / 12, y + 6, shade(color, 0.18), 2))
    return out


def thatch_roof(t, x, y, w, h, color, color2, horns=True):
    d = 'M%s %s Q %s %s %s %s Q %s %s %s %s Z' % (f(x - 30), f(y + h), f(x - 10), f(y - h * 0.15), f(x + w / 2), f(y), f(x + w + 10), f(y - h * 0.15), f(x + w + 30), f(y + h))
    out = [path(t, d, color, True)]
    if t.detail:
        for i in range(26):
            xx = x + w * (i + 0.5) / 26
            out.append(line(t, xx, y + h * 0.18 + (abs(i - 13) ** 1.6) * 0.6, xx + t.rng.uniform(-8, 8), y + h - 10, color2, 2))
        out.append(path(t, 'M%s %s Q %s %s %s %s' % (f(x - 26), f(y + h - 4), f(x + w / 2), f(y + h + 12), f(x + w + 26), f(y + h - 4)), 'none', True, sw=t.lw))
    if horns:
        for hx_ in (x + w * 0.18, x + w * 0.82):
            yy = y + h * 0.12
            out.append(line(t, hx_ - 28, yy - 50, hx_ + 18, yy + 20, t.c('post'), 7))
            out.append(line(t, hx_ + 28, yy - 50, hx_ - 18, yy + 20, t.c('post'), 7))
    return out


def woven(t, x, y, w, h, base, lines_c, step=14):
    out = [rect(t, x, y, w, h, base, True)]
    if t.detail:
        rows = int(h / step)
        for r in range(1, rows):
            yy = y + r * step
            out.append(line(t, x + 2, yy, x + w - 2, yy, lines_c, 2, extra=' stroke-dasharray="16 10" stroke-dashoffset="%d"' % ((r % 2) * 13)))
    return out


def lit(t, x, y, w, h):
    if t.night:
        return [rect(t, x, y, w, h, t.c('glow') if t.detail else '#151515', True), rect(t, x - 30, y - 30, w + 60, h + 60, t.rg([(0, t.c('glow'), 0.35), (1, t.c('glow'), 0)]), False)] if t.detail else [rect(t, x, y, w, h, '#14161a', True)]
    return [rect(t, x, y, w, h, t.c('door'), True)]


def house_tile(t, x, base, w=900, h=240, doors=3, roof=None):
    out = []
    doors = max(1, doors + [0, 1, -1, 0][t.v]) if doors > 1 else doors
    roof = roof or [t.c('roof'), shade(t.c('roof'), 0.25), mix(t.c('roof'), t.c('stone'), 0.45), t.c('roof')][t.v]
    rh = h * 0.45
    out += roof_tiles(t, x, base - h - rh + 10, w, rh, roof or t.c('roof'))
    out.append(poly(t, [(x, base - h), (x + w, base - h), (x + w + 8, base), (x - 8, base)], t.c('wall'), True))
    if t.detail == 0:
        for i in range(10):
            xx = x + 40 + i * w / 10
            out.append(line(t, xx, base - h + 30, xx - 30, base - 40, t.c('wall2'), 2, extra=op(0.5)))
    dw = w * 0.13
    for i in range(doors):
        dx = x + w * (i + 0.5) / doors - dw / 2
        out += lit(t, dx, base - h * 0.8, dw, h * 0.8 - 10)
    return out


def stilt_house(t, x, base, w=620, h=200, legs=180, ladder=True):
    out = []
    floor = base - legs
    for i in range(7):
        px = x + 20 + i * (w - 40) / 6
        out.append(rect(t, px - 8, floor, 16, legs, t.c('post'), True, sw=t.lw * 0.8))
    if t.detail:
        out.append(rect(t, x, floor + legs * 0.45, w, 10, t.c('wood'), True, sw=t.lw * 0.6))
    out.append(rect(t, x - 20, floor - 14, w + 40, 18, t.c('wood'), True))
    out += woven(t, x + 20, floor - h, w - 40, h - 14, t.c('woven'), t.c('woven2'))
    dx = [0.62, 0.3, 0.5, 0.7][t.v]
    out += lit(t, x + w * dx, floor - h * 0.72, w * 0.12, h * 0.6)
    out += lit(t, x + w * (0.2 if dx > 0.45 else 0.75), floor - h * 0.62, w * 0.08, h * 0.16)
    out += thatch_roof(t, x - 40, floor - h - 230, w + 80, 260, t.c('thatch'), t.c('thatch2'))
    if ladder:
        lx = x + w * 0.66
        out.append(line(t, lx, base, lx + 40, floor - 6, t.c('post'), 6))
        out.append(line(t, lx + 46, base, lx + 86, floor - 6, t.c('post'), 6))
        for k in range(1, 6):
            yy = base - k * legs / 6
            xx = lx + 40 * k / 6
            out.append(line(t, xx, yy, xx + 46, yy, t.c('post'), 4))
    return out


def hut(t, x, base, w=360, h=170):
    out = [rect(t, x, base - h, w, h, t.c('woven'), True)]
    out += lit(t, x + w * 0.4, base - h * 0.7, w * 0.22, h * 0.7)
    out += thatch_roof(t, x - 30, base - h - 150, w + 60, 170, t.c('thatch'), t.c('thatch2'), horns=False)
    return out


def ground(t, top, kind='earth', lines_n=5):
    out = []
    if kind == 'brick':
        out.append(rect(t, -10, top, W + 20, H - top + 10, t.c('brick'), True))
        for i in range(1, lines_n + 2):
            yy = top + (H - top) * (i / (lines_n + 2)) ** 1.3
            out.append(line(t, 0, yy, W, yy, t.c('brick2'), 2))
        for i in range(-6, 26):
            out.append(line(t, W / 2 + i * 90 - 60 * 9, H, W / 2 + (i - 9) * 70 + 300, top, t.c('brick2'), 2, extra=op(0.7)))
    else:
        base = t.c(kind)
        out.append(rect(t, -10, top, W + 20, H - top + 10, base, True))
        c2 = t.c(kind + '2') if kind + '2' in t.p else shade(base, 0.12)
        for i in range(1, lines_n + 1):
            yy = top + (H - top) * (i / (lines_n + 1)) ** 1.4
            x0 = t.rng.uniform(-200, 400)
            out.append(line(t, x0, yy, x0 + t.rng.uniform(600, 1500), yy + t.rng.uniform(-6, 6), c2, 3 if t.detail else 2, extra=op(0.8)))
    return out


def water_band(t, top, bottom, ripples=10):
    out = [rect(t, -10, top, W + 20, bottom - top, t.c('water'), True)]
    for i in range(ripples):
        x = t.rng.uniform(0, W)
        y = t.rng.uniform(top + 15, bottom - 10)
        out.append(line(t, x, y, x + t.rng.uniform(40, 120), y, t.c('water2'), 3, extra=op(0.9)))
    return out


def fence(t, x0, x1, base, h=90, kind='bamboo'):
    out = []
    n = int((x1 - x0) / 34)
    for i in range(n + 1):
        x = x0 + i * (x1 - x0) / max(1, n)
        out.append(rect(t, x - 5, base - h, 10, h, t.c('wood2' if kind == 'bamboo' else 'stone'), True, sw=t.lw * 0.5))
    out.append(line(t, x0, base - h * 0.7, x1, base - h * 0.7, t.c('wood'), 6))
    out.append(line(t, x0, base - h * 0.3, x1, base - h * 0.3, t.c('wood'), 6))
    return out


def low_wall(t, x0, x1, base, h=60):
    out = [rect(t, x0, base - h, x1 - x0, h, t.c('stone'), True)]
    for i in range(int((x1 - x0) / 120)):
        out.append(rect(t, x0 + 20 + i * 120, base - h + 14, 60, 18, t.c('stone2'), False, extra=op(0.8)))
    return out


def grave(t, x, base, s=1.0, stone=True):
    out = [path(t, 'M%s %s Q %s %s %s %s Z' % (f(x - 110 * s), f(base), f(x), f(base - 150 * s), f(x + 110 * s), f(base)), t.c('mound'), True)]
    if stone:
        out.append(path(t, 'M%s %s L %s %s Q %s %s %s %s L %s %s Z' % (f(x - 26 * s), f(base - 40 * s), f(x - 26 * s), f(base - 120 * s), f(x), f(base - 145 * s), f(x + 26 * s), f(base - 120 * s), f(x + 26 * s), f(base - 40 * s)), t.c('stone'), True))
    for k in (-1, 0, 1):
        out.append(line(t, x + 50 * s + k * 8, base - 30 * s, x + 50 * s + k * 10, base - 80 * s, t.c('red'), 3))
    return out


def tombstone(t, x, base, s=1.0):
    return [rect(t, x - 40 * s, base - 140 * s, 80 * s, 140 * s, t.c('stone'), True, rx=10 * s), rect(t, x - 55 * s, base - 16 * s, 110 * s, 16 * s, t.c('stone2'), True)]


def rock(t, x, base, s=1.0):
    return [path(t, 'M%s %s L %s %s L %s %s L %s %s L %s %s Z' % (f(x - 90 * s), f(base), f(x - 70 * s), f(base - 60 * s), f(x - 10 * s), f(base - 90 * s), f(x + 70 * s), f(base - 55 * s), f(x + 95 * s), f(base)), t.c('rock'), True)]


def incense(t, x, base, n=3):
    out = [rect(t, x - 22, base - 26, 44, 26, t.c('red'), True, sw=t.lw * 0.6)]
    for k in range(n):
        out.append(line(t, x - 10 + k * 10, base - 26, x - 14 + k * 14, base - 90, t.c('wood2'), 3))
        if t.night:
            out.append(circ(t, x - 14 + k * 14, base - 90, 3, t.c('fire'), False))
    return out


def lantern_glow(t, x, y, r=160):
    return [circ(t, x, y, r, t.rg([(0, t.c('glow'), 0.45), (1, t.c('glow'), 0)]), False)]
