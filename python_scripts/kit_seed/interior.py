from parts import *


def room(t, base=760, wall=None, woven_wall=None):
    back, flo = [], []
    stilt = woven_wall if woven_wall is not None else bool(t.detail)
    wc = wall or t.c('interior_wall')
    if stilt:
        back += woven(t, -10, 0, W + 20, base, wc, t.c('interior_wall2'), 18)
        for i in range(9):
            x = -20 + i * 245
            back.append(rect(t, x, 0, 26, base, t.c('post'), True))
        back.append(rect(t, -10, 40, W + 20, 34, t.c('beam'), True))
        back.append(rect(t, -10, 120, W + 20, 18, t.c('beam'), True))
        flo.append(rect(t, -10, base, W + 20, H - base + 10, t.c('floorwood'), True))
        for i in range(1, 16):
            yy = base + (H - base) * (i / 16) ** 1.25
            flo.append(line(t, 0, yy, W, yy, t.c('floorwood2'), 2))
    else:
        back.append(rect(t, -10, 0, W + 20, base, wc, True))
        for i in range(14):
            x = 60 + i * 150
            back.append(line(t, x, 130, x - 50, base - 30, t.c('interior_wall2'), 2, extra=op(0.45)))
        back.append(rect(t, -10, 20, W + 20, 70, t.c('beam'), True))
        back.append(rect(t, -10, base - 40, W + 20, 40, shade(wc, 0.08), False))
        flo.append(rect(t, -10, base, W + 20, H - base + 10, t.c('floorwood'), True))
        for i in range(1, 5):
            yy = base + (H - base) * (i / 5) ** 1.4
            flo.append(line(t, 0, yy, W, yy, t.c('floorwood2'), 2))
    if t.v == 1:
        for x in (520, 1300):
            back.append(rect(t, x, 200, 120, 160, t.c('wood'), True))
            back.append(rect(t, x + 14, 214, 92, 132, mix(t.c('paper'), t.c('interior_wall'), 0.3), True, sw=t.lw * 0.5))
            back.append(path(t, 'M%s 330 L%s 260 L%s 300 L%s 250 L%s 330 Z' % (f(x + 14), f(x + 40), f(x + 60), f(x + 86), f(x + 106)), t.c('stone2'), False))
    elif t.v == 2:
        flo.append(rect(t, -10, base, W + 20, H - base + 10, t.c('brick'), True))
        for i in range(1, 7):
            yy = base + (H - base) * (i / 7) ** 1.3
            flo.append(line(t, 0, yy, W, yy, t.c('brick2'), 2))
        for i in range(-10, 30):
            flo.append(line(t, W / 2 + (i - 10) * 120, H, W / 2 + (i - 10) * 70, base, t.c('brick2'), 2, extra=op(0.6)))
    elif t.v == 3:
        for x in range(0, W, 96):
            back.append(line(t, x, 90, x, base - 40, shade(wc, 0.18), 3, extra=op(0.6)))
        back.append(rect(t, -10, base - 140, W + 20, 16, t.c('wood'), True))
    return back, flo


def door_panels(t, x, base, n=4, w=95, h=470):
    out = []
    for i in range(n):
        out.append(rect(t, x + i * (w + 8), base - h, w, h, t.c('door') if not t.night else t.c('wood'), True))
        out.append(line(t, x + i * (w + 8) + 10, base - h * 0.55, x + i * (w + 8) + w - 10, base - h * 0.55, shade(t.c('door'), 0.2), 3))
    return out


def window(t, x, y, w=120, h=110, bars=5):
    out = [rect(t, x, y, w, h, t.c('glow') if t.night and t.detail else (t.c('sky') if not t.night else '#1a2236'), True)]
    for i in range(1, bars):
        out.append(rect(t, x + i * w / bars - 4, y, 8, h, t.c('wood'), False))
    out.append(rect(t, x - 8, y - 8, w + 16, h + 16, 'none', True))
    return out


def textile(t, x, y, w=70, h=210):
    out = [rect(t, x, y, w, h, t.c('red'), True)]
    if t.detail:
        for k in range(1, 6):
            yy = y + k * h / 6
            out.append(line(t, x + 6, yy, x + w - 6, yy, t.c('gold'), 3, extra=' stroke-dasharray="6 6"'))
    return out


def altar(t, x, base, w=420):
    out = []
    top = base - 200
    out.append(rect(t, x, top, w, 26, t.c('wood'), True))
    out.append(rect(t, x + 20, top + 26, w - 40, 174, t.c('wood2'), True))
    if t.detail:
        out.append(rect(t, x + 50, top + 60, w - 100, 100, shade(t.c('wood2'), 0.12), True, sw=2))
    out.append(rect(t, x + w / 2 - 70, top - 190, 140, 170, t.c('wood'), True))
    out.append(rect(t, x + w / 2 - 52, top - 172, 104, 134, t.c('cloth'), True))
    out.append(circ(t, x + w / 2, top - 120, 30, t.c('stone2'), True, sw=t.lw * 0.6))
    out.append(rect(t, x + w / 2 - 34, top - 88, 68, 50, t.c('stone2'), True, sw=t.lw * 0.6))
    out += incense(t, x + w / 2, top)
    for cx in (x + 60, x + w - 60):
        out.append(rect(t, cx - 10, top - 70, 20, 70, t.c('cloth'), True, sw=t.lw * 0.6))
        out.append(ell(t, cx, top - 82, 7, 13, t.c('fire'), False))
        if t.night:
            out += lantern_glow(t, cx, top - 82, 90)
    out.append(rect(t, x - 30, top - 230, w + 60, 30, t.c('red'), True))
    return out


def bench(t, x, base, w=360, h=90):
    return [rect(t, x, base - h, w, 22, t.c('wood'), True), rect(t, x + 20, base - h + 22, 18, h - 22, t.c('wood'), True), rect(t, x + w - 38, base - h + 22, 18, h - 22, t.c('wood'), True)]


def tea_table(t, x, base):
    out = bench(t, x, base, 220, 110)
    out.append(path(t, 'M%s %s q 20 -46 40 0 Z' % (f(x + 70), f(base - 110)), t.c('stone2'), True, sw=t.lw * 0.6))
    out.append(rect(t, x + 130, base - 128, 22, 18, t.c('cloth'), True, sw=t.lw * 0.5))
    return out


def bed(t, x, base, w=520):
    out = [rect(t, x, base - 120, w, 30, t.c('wood2'), True)]
    for xx in (x + 10, x + w - 30):
        out.append(rect(t, xx, base - 90, 20, 90, t.c('wood'), True))
    out.append(rect(t, x + 10, base - 150, 110, 32, t.c('cloth'), True, rx=10))
    out.append(rect(t, x + 120, base - 136, w - 140, 18, mix(t.c('red'), t.c('cloth'), 0.4), True, sw=t.lw * 0.6))
    out.append(poly(t, [(x - 10, base - 120), (x + 20, base - 470), (x + w - 20, base - 470), (x + w + 10, base - 120)], t.c('cloth'), True, sw=t.lw * 0.6, extra=op(0.55)))
    out.append(line(t, x + 20, base - 470, x + w - 20, base - 470, t.c('wood'), 6))
    return out


def stove(t, x, base, fire=True):
    out = []
    if fire:
        out += lantern_glow(t, x, base - 80, 260) if (t.night or t.detail) else []
        for dx in (-46, 0, 46):
            out.append(path(t, 'M%s %s q -18 -40 0 -86 q 18 46 0 86 Z' % (f(x + dx), f(base - 30)), t.c('fire'), False))
    for dx in (-80, 0, 80):
        out.append(ell(t, x + dx, base - 30, 34, 26, t.c('stone'), True))
    out.append(path(t, 'M%s %s Q %s %s %s %s Z' % (f(x - 90), f(base - 120), f(x), f(base - 10), f(x + 90), f(base - 120)), t.c('dark'), True))
    out.append(rect(t, x - 96, base - 132, 192, 16, t.c('dark'), True))
    for k in range(6):
        out.append(line(t, x - 160 + k * 20, base, x + 120 - k * 12, base - 16, t.c('wood'), 7))
    return out


def shelf(t, x, y, w=340, items=4):
    out = [rect(t, x, y, w, 16, t.c('wood'), True)]
    for k in (x + 20, x + w - 30):
        out.append(line(t, k, y + 16, k, y + 60, t.c('wood'), 6))
    for i in range(items):
        bx = x + 30 + i * (w - 60) / max(1, items - 1)
        out.append(path(t, 'M%s %s q 24 34 48 0 Z' % (f(bx - 24), f(y)), t.c('cloth'), True, sw=t.lw * 0.6))
    return out


def jar(t, x, base, s=1.0, color=None):
    c = color or t.c('wood2')
    d = 'M%s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z' % (f(x - 40 * s), f(base - 150 * s), f(x - 120 * s), f(base - 90 * s), f(x - 52 * s), f(base), f(x + 52 * s), f(base), f(x + 120 * s), f(base - 90 * s), f(x + 40 * s), f(base - 150 * s))
    return [path(t, d, c, True), ell(t, x, base - 150 * s, 42 * s, 12 * s, t.c('dark'), True), spath('M%s %s Q %s %s %s %s' % (f(x - 78 * s), f(base - 80 * s), f(x), f(base - 64 * s), f(x + 78 * s), f(base - 80 * s)), shade(c, 0.25), 3)]


def coffin(t, x, base, w=560):
    out = bench(t, x - 30, base, 140, 100) + bench(t, x + w - 110, base, 140, 100)
    out.append(poly(t, [(x, base - 100), (x - 10, base - 210), (x + w + 10, base - 230), (x + w, base - 100)], t.c('dark'), True))
    out.append(poly(t, [(x - 10, base - 210), (x + 20, base - 250), (x + w - 20, base - 270), (x + w + 10, base - 230)], shade(t.c('dark'), -0.15), True))
    out.append(rect(t, x + w * 0.4, base - 190, w * 0.2, 70, t.c('red'), True, sw=t.lw * 0.6))
    return out


def cobweb(t, x, y, s=1.0, flip=1):
    out = []
    for a in range(0, 91, 18):
        r = math.radians(a)
        out.append(line(t, x, y, x + flip * math.cos(r) * 140 * s, y + math.sin(r) * 140 * s, '#d9d6cf', 1.5, extra=op(0.7)))
    for rr in (50, 90, 130):
        ps = [(x + flip * math.cos(math.radians(a)) * rr * s, y + math.sin(math.radians(a)) * rr * s) for a in range(0, 91, 18)]
        out.append(pline(t, ps, '#d9d6cf', 1.5, extra=op(0.7)))
    return out


def pillar(t, x, base, h=700, color=None):
    return [rect(t, x - 24, base - h, 48, h, color or t.c('red'), True), rect(t, x - 34, base - 24, 68, 24, t.c('stone'), True)]


def buddha(t, x, base, s=1.0):
    gc = t.c('gold')
    out = [rect(t, x - 170 * s, base - 120 * s, 340 * s, 120 * s, t.c('red'), True)]
    out.append(path(t, 'M%s %s Q %s %s %s %s Q %s %s %s %s Z' % (f(x - 140 * s), f(base - 120 * s), f(x - 140 * s), f(base - 260 * s), f(x), f(base - 300 * s), f(x + 140 * s), f(base - 260 * s), f(x + 140 * s), f(base - 120 * s)), gc, True))
    out.append(circ(t, x, base - 350 * s, 62 * s, gc, True))
    out.append(circ(t, x, base - 420 * s, 26 * s, gc, True))
    out.append(circ(t, x, base - 350 * s, 140 * s, 'none', True, sw=t.lw * 0.8))
    return out


def bell(t, x, y, s=1.0):
    d = 'M%s %s Q %s %s %s %s Q %s %s %s %s L %s %s L %s %s Z' % (f(x - 40 * s), f(y + 110 * s), f(x - 46 * s), f(y), f(x), f(y), f(x + 46 * s), f(y), f(x + 40 * s), f(y + 110 * s), f(x + 56 * s), f(y + 130 * s), f(x - 56 * s), f(y + 130 * s))
    return [line(t, x, y - 80 * s, x, y, t.c('wood'), 6), path(t, d, shade(t.c('gold'), 0.2), True)]


def broken_chair(t, x, base):
    return [poly(t, [(x, base - 20), (x + 160, base - 60), (x + 170, base - 40), (x + 10, base)], t.c('wood'), True),
            line(t, x + 40, base - 30, x + 20, base - 150, t.c('wood'), 10), line(t, x + 140, base - 54, x + 190, base - 120, t.c('wood'), 10)]


def curtain(t, x, y, w=200, h=420):
    d = 'M%s %s L %s %s L %s %s Q %s %s %s %s Q %s %s %s %s Z' % (f(x), f(y), f(x + w), f(y), f(x + w - 30), f(y + h), f(x + w * 0.6), f(y + h - 40), f(x + w * 0.4), f(y + h + 10), f(x + w * 0.15), f(y + h - 30), f(x), f(y + h - 60))
    return [path(t, d, mix(t.c('red'), t.c('dark'), 0.45), True)]
