if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from interior import *
from scenes import HB, IB, ext_base
GOODS = [_CODE_TEXT.RED, _CODE_TEXT.GOLD, _CODE_TEXT.CLOTH, _CODE_TEXT.STONE, _CODE_TEXT.WATER, _CODE_TEXT.GRASS, _CODE_TEXT.PAPER, _CODE_TEXT.BRICK]
def goods_shelves(t, x=120, top=250, w=700, rows=3):
    out = []
    for r in range(rows):
        y = top + r * 120
        n = int(w / 62)
        for i in range(n):
            c = t.c(GOODS[(i * 3 + r * 5) % len(GOODS)])
            bh = 46 + ((i + r) % 3) * 8
            out.append(rect(t, x + 14 + i * 62, y - bh, 44, bh, c, True, sw=t.lw * 0.5))
        out.append(rect(t, x, y, w, 14, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.6))
    return out
def shop_counter(t, x=560, base=IB + 230, w=800):
    out = [rect(t, x, base - 150, w, 150, t.c(_CODE_TEXT.WOOD2), True), rect(t, x - 20, base - 170, w + 40, 24, t.c(_CODE_TEXT.WOOD), True)]
    if t.detail:
        out.append(rect(t, x + 40, base - 120, w - 80, 80, shade(t.c(_CODE_TEXT.WOOD2), 0.12), True, sw=2))
    out.append(rect(t, x + 60, base - 214, 90, 44, t.c(_CODE_TEXT.CLOTH), True, sw=t.lw * 0.6))
    for k, cx in enumerate((x + 60, x + 86, x + 112)):
        out.append(circ(t, cx + 10, base - 192, 8, t.c([_CODE_TEXT.RED, _CODE_TEXT.GOLD, _CODE_TEXT.GRASS][k]), False))
    out.append(rect(t, x + w - 180, base - 200, 70, 30, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.5))
    return out
def wall_altar_shelf(t, x=1500, y=360):
    out = [rect(t, x - 120, y, 240, 22, t.c(_CODE_TEXT.WOOD), True), rect(t, x - 120, y + 22, 240, 26, shade(t.c(_CODE_TEXT.WOOD), 0.15), True, sw=t.lw * 0.6)]
    out.append(rect(t, x - 34, y - 96, 68, 90, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.7))
    out.append(rect(t, x - 24, y - 86, 48, 70, t.c(_CODE_TEXT.CLOTH), True, sw=t.lw * 0.5))
    out.append(circ(t, x, y - 60, 12, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.4))
    for cx in (x - 80, x + 80):
        out.append(rect(t, cx - 6, y - 40, 12, 40, t.c(_CODE_TEXT.CLOTH), True, sw=t.lw * 0.4))
        out.append(ell(t, cx, y - 48, 5, 9, t.c(_CODE_TEXT.FIRE), False))
    out += incense(t, x + 44, y, 2)
    out.append(rect(t, x - 160, y - 150, 320, 26, t.c(_CODE_TEXT.RED), True))
    return out
def ceiling_lamp(t, x=960, y=0):
    out = [line(t, x, y, x, y + 160, t.line, 4), path(t, _CODE_TEXT.M_S_S_Q_S_S_S_S_Z % (f(x - 60), f(y + 210), f(x), f(y + 130), f(x + 60), f(y + 210)), t.c(_CODE_TEXT.STONE2), True)]
    out.append(circ(t, x, y + 214, 18, t.c(_CODE_TEXT.LAMP) if t.night else t.c(_CODE_TEXT.CLOTH), True, sw=t.lw * 0.6))
    if t.night:
        out.append(circ(t, x, y + 230, 260, t.rg([(0, t.c(_CODE_TEXT.GLOW), 0.35), (1, t.c(_CODE_TEXT.GLOW), 0)]), False))
    return out
def modern_window(t, x=1480, y=200, w=260, h=240):
    out = [rect(t, x - 12, y - 12, w + 24, h + 24, t.c(_CODE_TEXT.CLOTH), True)]
    glass = _CODE_TEXT.VALUE_1A2236 if t.night else mix(t.raw(_CODE_TEXT.SKY), _CODE_TEXT.FFFFFF, 0.25)
    out.append(rect(t, x, y, w, h, glass, True))
    out.append(line(t, x + w / 2, y, x + w / 2, y + h, t.c(_CODE_TEXT.CLOTH), 12))
    out.append(line(t, x, y + h / 2, x + w, y + h / 2, t.c(_CODE_TEXT.CLOTH), 12))
    return out
def modern_door(t, x=1560, base=IB, w=170, h=440):
    out = [rect(t, x - 10, base - h - 10, w + 20, h + 10, shade(t.c(_CODE_TEXT.WOOD), 0.2), True), rect(t, x, base - h, w, h, t.c(_CODE_TEXT.DOOR), True)]
    if t.detail:
        out += [rect(t, x + 24, base - h + 30, w - 48, 160, shade(t.c(_CODE_TEXT.DOOR), 0.12), True, sw=2), rect(t, x + 24, base - 230, w - 48, 180, shade(t.c(_CODE_TEXT.DOOR), 0.12), True, sw=2)]
    out.append(circ(t, x + w - 26, base - h / 2, 9, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.5))
    return out
def low_bed(t, x=760, base=IB + 210, w=640):
    out = [rect(t, x, base - 90, w, 70, t.c(_CODE_TEXT.WOOD2), True), rect(t, x - 20, base - 200, 34, 200, t.c(_CODE_TEXT.WOOD), True)]
    out.append(rect(t, x + 10, base - 124, w - 20, 40, t.c(_CODE_TEXT.CLOTH), True, rx=12))
    out.append(rect(t, x + 30, base - 150, 120, 36, _CODE_TEXT.F4F1EA, True, rx=12))
    out.append(rect(t, x + 200, base - 132, w - 230, 30, mix(t.c(_CODE_TEXT.WATER), t.c(_CODE_TEXT.CLOTH), 0.3), True, sw=t.lw * 0.6, rx=8))
    for xx in (x + 10, x + w - 30):
        out.append(rect(t, xx, base - 20, 20, 20, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.5))
    return out
def hospital_bed(t, x=700, base=IB + 220, w=620):
    metal = mix(t.c(_CODE_TEXT.STONE), _CODE_TEXT.FFFFFF, 0.35)
    out = [rect(t, x, base - 120, w, 26, metal, True)]
    for xx in (x + 20, x + w - 30):
        out.append(rect(t, xx, base - 94, 12, 94, metal, True, sw=t.lw * 0.5))
        out.append(circ(t, xx + 6, base - 4, 10, t.c(_CODE_TEXT.DARK), True, sw=t.lw * 0.4))
    out.append(rect(t, x - 10, base - 260, 20, 160, metal, True, sw=t.lw * 0.6))
    out.append(rect(t, x + w - 10, base - 200, 20, 100, metal, True, sw=t.lw * 0.6))
    out.append(rect(t, x + 10, base - 150, w - 20, 32, _CODE_TEXT.F4F1EA, True, rx=8))
    out.append(rect(t, x + 20, base - 172, 110, 30, _CODE_TEXT.FFFFFF, True, rx=10))
    out.append(line(t, x + 150, base - 190, x + w - 40, base - 190, metal, 6))
    out.append(line(t, x + w + 80, base, x + w + 80, base - 380, metal, 6))
    out.append(rect(t, x + w + 56, base - 400, 48, 70, mix(t.c(_CODE_TEXT.WATER), _CODE_TEXT.FFFFFF, 0.5), True, sw=t.lw * 0.5, rx=8))
    return out
def wardrobe(t, x=180, base=IB, w=240, h=420):
    out = [rect(t, x, base - h, w, h, t.c(_CODE_TEXT.WOOD), True), line(t, x + w / 2, base - h + 10, x + w / 2, base - 10, t.line, t.lw * 0.6)]
    for xx in (x + w / 2 - 18, x + w / 2 + 18):
        out.append(circ(t, xx, base - h / 2, 7, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.4))
    out.append(rect(t, x - 10, base - h - 18, w + 20, 20, shade(t.c(_CODE_TEXT.WOOD), 0.2), True))
    return out
def desk(t, x=1100, base=IB + 220, w=420):
    out = [rect(t, x, base - 150, w, 22, t.c(_CODE_TEXT.WOOD), True)]
    for xx in (x + 10, x + w - 30):
        out.append(rect(t, xx, base - 128, 20, 128, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.6))
    out.append(rect(t, x + 60, base - 180, 80, 30, t.c(_CODE_TEXT.CLOTH), True, sw=t.lw * 0.5))
    out.append(rect(t, x + w - 110, base - 230, 16, 80, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.4))
    out.append(path(t, _CODE_TEXT.M_S_S_L_S_S_L_S_S_Z % (f(x + w - 150), f(base - 230), f(x + w - 60), f(base - 230), f(x + w - 102), f(base - 270)), t.c(_CODE_TEXT.LAMP), True, sw=t.lw * 0.5))
    out.append(rect(t, x + w + 30, base - 110, 110, 18, t.c(_CODE_TEXT.WOOD2), True))
    out.append(rect(t, x + w + 120, base - 230, 18, 230, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.6))
    out.append(rect(t, x + w + 40, base - 92, 14, 92, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.5))
    return out
def chalkboard(t, x=1100, y=200, w=440, h=230):
    out = [rect(t, x - 14, y - 14, w + 28, h + 28, t.c(_CODE_TEXT.WOOD), True), rect(t, x, y, w, h, _CODE_TEXT.VALUE_2F4A3A, True)]
    for k in range(3):
        out.append(line(t, x + 50, y + 60 + k * 50, x + 50 + (w - 140) * (1 - k * 0.2), y + 60 + k * 50, _CODE_TEXT.E6ECE4, 5))
    out.append(rect(t, x, y + h + 14, w, 12, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.5))
    return out
def school_benches(t, x=600, base=IB + 230, n=2):
    out = []
    for i in range(n):
        bx = x + i * 400
        out.append(rect(t, bx, base - 130, 320, 22, t.c(_CODE_TEXT.WOOD), True))
        for xx in (bx + 14, bx + 290):
            out.append(rect(t, xx, base - 108, 16, 108, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.6))
        out.append(rect(t, bx + 14, base - 110, 292, 70, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.6))
    return out
def eye_chart(t, x=400, y=220):
    out = [rect(t, x, y, 220, 280, _CODE_TEXT.F4F1EA, True)]
    for k, n in enumerate((1, 2, 3, 4, 5)):
        sz = 36 - k * 6
        for i in range(n):
            out.append(rect(t, x + 110 - n * sz * 0.6 + i * sz * 1.2, y + 30 + k * 48, sz * 0.8, sz, t.line, False))
    return out
def hammock(t, x=560, base=IB + 230, w=760):
    out = [rect(t, x - 20, base - 380, 26, 380, t.c(_CODE_TEXT.POST), True), rect(t, x + w - 6, base - 380, 26, 380, t.c(_CODE_TEXT.POST), True)]
    out.append(path(t, _CODE_TEXT.M_S_S_Q_S_S_S_S % (f(x), f(base - 330), f(x + w / 2), f(base - 60), f(x + w), f(base - 330)), _CODE_TEXT.NONE, True, sw=t.lw * 2))
    out.append(path(t, _CODE_TEXT.M_S_S_Q_S_S_S_S_Q_S_S_S_S_Z % (f(x + 90), f(base - 250), f(x + w / 2), f(base - 70), f(x + w - 90), f(base - 250), f(x + w / 2), f(base - 150), f(x + 90), f(base - 250)), mix(t.c(_CODE_TEXT.RED), t.c(_CODE_TEXT.CLOTH), 0.3), True, sw=t.lw * 0.7))
    return out
def plank_stack(t, x=200, base=IB + 200, w=420):
    out = []
    for k in range(5):
        out.append(rect(t, x + (k % 2) * 16, base - 40 - k * 40, w, 36, mix(t.c(_CODE_TEXT.WOOD2), t.c(_CODE_TEXT.WOOD), (k % 3) * 0.3), True, sw=t.lw * 0.7))
    return out
def saw_bench(t, x=760, base=IB + 220, w=420):
    out = [rect(t, x, base - 160, w, 34, t.c(_CODE_TEXT.WOOD), True)]
    for xx in (x + 20, x + w - 40):
        out.append(rect(t, xx, base - 126, 20, 126, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.6))
    metal = mix(t.c(_CODE_TEXT.STONE), _CODE_TEXT.FFFFFF, 0.3)
    out.append(circ(t, x + w / 2, base - 180, 70, metal, True))
    out.append(circ(t, x + w / 2, base - 180, 14, t.c(_CODE_TEXT.DARK), True, sw=t.lw * 0.4))
    out.append(rect(t, x + w / 2 - 60, base - 190, 120, 30, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.6))
    return out
def hanging_basket(t, x=420, y=140):
    out = [line(t, x, 0, x, y + 60, t.line, 4), path(t, _CODE_TEXT.M_S_S_L_S_S_L_S_S_L_S_S_Z % (f(x - 80), f(y + 60), f(x + 80), f(y + 60), f(x + 60), f(y + 190), f(x - 60), f(y + 190)), t.c(_CODE_TEXT.WOVEN), True)]
    for k in range(4):
        out.append(ell(t, x - 45 + k * 30, y + 50 - (k % 2) * 14, 26, 16, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.5))
    return out
def wall_calendar(t, x=1300, y=230):
    return [rect(t, x, y, 90, 120, _CODE_TEXT.F4F1EA, True), rect(t, x, y, 90, 30, t.c(_CODE_TEXT.RED), True), rect(t, x + 28, y + 50, 34, 44, t.line, False)]
def stairs(t, x=1360, base=IB, w=440, steps=9):
    out = [
        poly(
            t,
            [
                (x, base),
                (x + w, base - 440),
                (x + w + 40, base - 440),
                (x + w + 40, base),
            ],
            shade(t.c(_CODE_TEXT.INTERIOR_WALL), 0.12),
            True,
        )
    ]
    for k in range(steps):
        sx = x + k * w / steps
        sy = base - k * 440 / steps
        out.append(rect(t, sx, sy - 440 / steps, w / steps + 40, 440 / steps, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.6))
    out.append(line(t, x + 20, base - 120, x + w + 20, base - 560, t.c(_CODE_TEXT.WOOD), 10))
    return out
def meeting_table(t, x=420, base=IB + 220, w=1080):
    out = [rect(t, x, base - 200, w, 30, t.c(_CODE_TEXT.WOOD), True), rect(t, x + 20, base - 170, w - 40, 170, shade(t.c(_CODE_TEXT.WOOD), 0.15), True, sw=t.lw * 0.6)]
    for k in range(5):
        out.append(rect(t, x + 90 + k * 200, base - 222, 70, 22, _CODE_TEXT.F4F1EA, True, sw=t.lw * 0.4))
    return out
def rolling_shutter(t, x=1360, base=IB, w=360, h=420):
    metal = mix(t.c(_CODE_TEXT.STONE), _CODE_TEXT.FFFFFF, 0.2)
    out = [rect(t, x, base - h, w, h, metal, True)]
    for k in range(1, 14):
        out.append(line(t, x, base - h + k * h / 14, x + w, base - h + k * h / 14, shade(metal, 0.18), 3))
    out.append(rect(t, x - 10, base - h - 26, w + 20, 30, shade(metal, 0.25), True))
    return out
def shophouse(t, x=440, base=HB, w=1040, h=330):
    out = [rect(t, x, base - h, w, h, t.c(_CODE_TEXT.WALL), True), rect(t, x - 20, base - h - 30, w + 40, 34, shade(t.c(_CODE_TEXT.WALL), 0.2), True)]
    out.append(rect(t, x + 60, base - h + 30, 200, 56, t.c(_CODE_TEXT.GOLD), True))
    for k in range(3):
        out.append(rect(t, x + 80 + k * 60, base - h + 46, 40, 24, t.c(_CODE_TEXT.RED), False))
    out += rolling_shutter(t, x + 340, base, 380, 250)
    out += lit(t, x + 120, base - 230, 120, 230)
    out.append(rect(t, x + 800, base - 260, 150, 110, _CODE_TEXT.VALUE_1A2236 if t.night else mix(t.raw(_CODE_TEXT.SKY), _CODE_TEXT.FFFFFF, 0.2), True))
    out.append(line(t, x + 875, base - 260, x + 875, base - 150, t.line, 4))
    out.append(rect(t, x - 30, base - 8, w + 60, 14, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.6))
    return out
def street_lamp(t, x=1700, base=HB + 60):
    out = [rect(t, x - 8, base - 520, 16, 520, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.6), path(t, _CODE_TEXT.M_S_S_Q_S_S_S_S % (f(x), f(base - 520), f(x - 20), f(base - 570), f(x - 110), f(base - 560)), _CODE_TEXT.NONE, True, sw=t.lw * 1.4)]
    out.append(rect(t, x - 150, base - 568, 80, 22, t.c(_CODE_TEXT.STONE2), True, sw=t.lw * 0.6))
    out.append(ell(t, x - 110, base - 544, 30, 8, t.c(_CODE_TEXT.LAMP) if t.night else t.c(_CODE_TEXT.CLOTH), False))
    if t.night:
        out.append(circ(t, x - 110, base - 520, 220, t.rg([(0, t.c(_CODE_TEXT.GLOW), 0.4), (1, t.c(_CODE_TEXT.GLOW), 0)]), False))
    return out
def thatch_house(t, x=200, base=HB, w=620, h=230):
    out = [rect(t, x, base - h, w, h, t.c(_CODE_TEXT.WOVEN), True)]
    out += lit(t, x + w * 0.38, base - h * 0.78, w * 0.18, h * 0.78)
    out += thatch_roof(t, x - 60, base - h - 200, w + 120, 230, t.c(_CODE_TEXT.THATCH), t.c(_CODE_TEXT.THATCH2), horns=False)
    return out
def pig_pen(t, x=1200, base=HB + 120, w=420):
    out = [rect(t, x, base - 120, w, 120, mix(t.c(_CODE_TEXT.WOOD), t.c(_CODE_TEXT.EARTH), 0.2), True)]
    for k in range(1, 8):
        out.append(line(t, x + k * w / 8, base - 120, x + k * w / 8, base, t.line, t.lw * 0.6))
    out.append(poly(t, [(x - 30, base - 120), (x + 40, base - 200), (x + w - 40, base - 200), (x + w + 30, base - 120)], t.c(_CODE_TEXT.THATCH), True))
    out.append(rect(t, x + w * 0.4, base - 70, w * 0.3, 40, t.c(_CODE_TEXT.DARK), True, sw=t.lw * 0.5))
    return out
def casuarina(t, x=960, base=HB, s=1.0):
    out = [line(t, x, base, x + 6 * s, base - 520 * s, t.c(_CODE_TEXT.TRUNK), 14 * s)]
    for k in range(6):
        y = base - 160 * s - k * 70 * s
        w = (140 - k * 18) * s
        out.append(ell(t, x + 6 * s, y, w, 40 * s, t.c(_CODE_TEXT.TREE2), True, sw=t.lw * 0.6))
    return out
def fishing_boat(t, x=960, base=HB + 160, w=640):
    out = [path(t, _CODE_TEXT.M_S_S_L_S_S_Q_S_S_S_S_Q_S_S_S_S_Z % (f(x - w / 2), f(base - 110), f(x + w / 2), f(base - 110), f(x + w / 2 - 40), f(base), f(x), f(base), f(x - w / 2 + 40), f(base), f(x - w / 2), f(base - 110)), t.c(_CODE_TEXT.WOOD), True)]
    out.append(rect(t, x - w / 2, base - 126, w, 20, shade(t.c(_CODE_TEXT.WOOD), 0.2), True))
    out.append(line(t, x - w / 2 + 40, base - 60, x + w / 2 - 40, base - 60, t.c(_CODE_TEXT.RED), 8))
    return out
def field_fence(t, x0=400, x1=1500, base=HB + 120):
    out = []
    n = 9
    for i in range(n):
        x = x0 + i * (x1 - x0) / (n - 1)
        b = base - i * 18
        out.append(rect(t, x - 7, b - 150, 14, 150, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.5))
    out.append(line(t, x0, base - 110, x1, base - 110 - (n - 1) * 18, t.c(_CODE_TEXT.WOOD), 6))
    out.append(line(t, x0, base - 50, x1, base - 50 - (n - 1) * 18, t.c(_CODE_TEXT.WOOD), 6))
    return out
def bamboo_hollow(t, x=1400, base=HB + 40):
    out = bamboo(t, x - 160, base, 1.0, 8) + bamboo(t, x + 160, base, 1.0, 8)
    out.append(path(t, _CODE_TEXT.M_S_S_Q_S_S_S_S_Q_S_S_S_S_Z % (f(x - 330), f(base), f(x - 300), f(base - 360), f(x), f(base - 420), f(x + 300), f(base - 360), f(x + 330), f(base)), t.c(_CODE_TEXT.BAMBOO2), True))
    out.append(ell(t, x, base - 90, 90, 70, _CODE_TEXT.VALUE_07080B, True, sw=t.lw * 0.6))
    out += bamboo(t, x - 250, base, 0.9, 6) + bamboo(t, x + 250, base, 0.9, 6) + bamboo(t, x, base - 200, 0.7, 5)
    return out
def plank_room(t):
    back, flo = [], []
    base = IB
    wc = mix(t.c(_CODE_TEXT.WOOD), t.c(_CODE_TEXT.DARK), 0.35)
    back.append(rect(t, -10, 0, W + 20, base, wc, True))
    for x in range(0, W, 130):
        back.append(line(t, x, 0, x, base, shade(wc, 0.25), 4))
    back.append(rect(t, -10, 30, W + 20, 40, t.c(_CODE_TEXT.BEAM), True))
    flo.append(rect(t, -10, base, W + 20, H - base + 10, shade(t.c(_CODE_TEXT.FLOORWOOD), 0.2), True))
    for i in range(1, 6):
        yy = base + (H - base) * (i / 6) ** 1.3
        flo.append(line(t, 0, yy, W, yy, t.c(_CODE_TEXT.FLOORWOOD2), 2))
    return back, flo
def modern_room(t, warm=False):
    back, flo = [], []
    base = IB
    wc = mix(t.c(_CODE_TEXT.INTERIOR_WALL), _CODE_TEXT.FFFFFF, 0.15) if warm else mix(t.c(_CODE_TEXT.STONE), _CODE_TEXT.FFFFFF, 0.45)
    back.append(rect(t, -10, 0, W + 20, base, wc, True))
    back.append(rect(t, -10, base - 30, W + 20, 30, shade(wc, 0.15), True, sw=t.lw * 0.5))
    tile = mix(t.c(_CODE_TEXT.STONE), _CODE_TEXT.FFFFFF, 0.2) if not warm else mix(t.c(_CODE_TEXT.BRICK), t.c(_CODE_TEXT.CLOTH), 0.35)
    flo.append(rect(t, -10, base, W + 20, H - base + 10, tile, True))
    for i in range(1, 6):
        yy = base + (H - base) * (i / 6) ** 1.3
        flo.append(line(t, 0, yy, W, yy, shade(tile, 0.15), 2))
    for i in range(-8, 26):
        flo.append(line(t, W / 2 + (i - 9) * 140, H, W / 2 + (i - 9) * 60, base, shade(tile, 0.15), 2, extra=op(0.7)))
    return back, flo
def base_room2(t, kind):
    back, flo = plank_room(t) if kind == _CODE_TEXT.PLANK else modern_room(t, kind == _CODE_TEXT.SHOP)
    return dict(sky=[], back=back, floor=flo, horizonY=IB, floorY=950, interior=True)
def base_street(t):
    sky_, back, _ = ext_base(t, HB, _CODE_TEXT.TREES)
    flo = [rect(t, -10, HB - 10, W + 20, 60, mix(t.c(_CODE_TEXT.STONE), t.c(_CODE_TEXT.CLOTH), 0.25), True)]
    road = mix(t.c(_CODE_TEXT.STONE2), t.c(_CODE_TEXT.DARK), 0.35)
    flo.append(rect(t, -10, HB + 50, W + 20, H - HB, road, True))
    for k in range(6):
        flo.append(rect(t, 80 + k * 330, HB + 200, 160, 14, t.c(_CODE_TEXT.CLOTH), False, extra=op(0.7)))
    return dict(sky=sky_, back=back, floor=flo, horizonY=HB, floorY=960, interior=False)
def base_beach(t):
    sky_ = sky(t, 600)
    back = water_band(t, 560, 690, 16)
    flo = [rect(t, -10, 680, W + 20, H - 670, mix(t.c(_CODE_TEXT.EARTH), t.c(_CODE_TEXT.CLOTH), 0.45), True)]
    for k in range(5):
        y = 720 + k * 70
        flo.append(path(t, _CODE_TEXT.M_S_S_Q_80_14_160_0 % (f(200 + k * 310), f(y)), _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_S_STROKE_WIDTH_3 % shade(mix(t.c(_CODE_TEXT.EARTH), t.c(_CODE_TEXT.CLOTH), 0.45), 0.15)))
    return dict(sky=sky_, back=back, floor=flo, horizonY=700, floorY=960, interior=False)
def base_terraces(t):
    sky_, back, _ = ext_base(t, 560, _CODE_TEXT.MOUNTAINS)
    flo = []
    for k in range(7):
        y = 520 + k * 80
        c = t.c(_CODE_TEXT.FIELD) if k % 2 == 0 else t.c(_CODE_TEXT.FIELD2)
        flo.append(path(t, _CODE_TEXT.M_20_S_Q_480_S_960_S_T_1940_S_L_1940_S_L_20_S_Z % (f(y), f(y - 40), f(y), f(y - 30), f(y + 90), f(y + 90)), c, True, sw=t.lw * 0.6))
    flo.append(rect(t, -10, 960, W + 20, 140, t.c(_CODE_TEXT.EARTH), True))
    return dict(sky=sky_, back=back, floor=flo, horizonY=780, floorY=990, interior=False)
def base_mountain_road(t):
    sky_, back, gr = ext_base(t, HB, _CODE_TEXT.MOUNTAINS, _CODE_TEXT.GRASS)
    gr = gr + [path(t, _CODE_TEXT.M_S_S_L_S_S_L_S_S_L_S_S_Z % (f(1000), f(HB - 8), f(1120), f(HB - 8), f(1700), f(H), f(700), f(H)), mix(t.c(_CODE_TEXT.STONE2), t.c(_CODE_TEXT.DARK), 0.3), True, sw=t.lw * 0.6)]
    return dict(sky=sky_, back=back, floor=gr, horizonY=HB, floorY=950, interior=False)
