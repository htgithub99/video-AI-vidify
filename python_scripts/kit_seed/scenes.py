from seed_texts import SeedText as KST
from interior import *
HB = 750
IB = 720
def S(**k):
    base = dict(sky=[], back=[], mid=[], floor=[], fg=[], floorY=900, lights=[], occ=[])
    base.update(k)
    return base
def lamp_light(x, y, kind=KST.LAMP):
    return {KST.X: x, KST.Y: y, KST.COLOR: KST.FFCC88, KST.KIND: kind}
def ext_base(t, hb=HB, far=KST.TREES, ground_kind=KST.EARTH):
    sky_ = sky(t, hb)
    back = []
    if far == KST.MOUNTAINS:
        back += mountains(t, hb)
    elif far == KST.TREES:
        if t.detail:
            back += mountains(t, hb + 40, 2)
        elif t.v == 1:
            back += bonsai_tree(t, 160, hb - 20, 1.3) + round_tree(t, 1780, hb - 20, 0.9)
        elif t.v == 2:
            back += palm(t, 140, hb - 10, 1.0) + palm(t, 300, hb - 10, 0.8) + bush(t, 1760, hb - 10, 1.6)
        elif t.v == 3:
            back += bamboo(t, 160, hb - 10, 1.0, 9) + bamboo(t, 1780, hb - 10, 1.0, 9)
        else:
            back += poly_tree(t, 120, hb - 120, 1.1) + poly_tree(t, 1820, hb - 80, 1.0, True)
    elif far == KST.HILLS:
        back += hills(t, hb)
    return (sky_, back, ground(t, hb - 10, ground_kind))
def main_room(t):
    back, flo = room(t, IB)
    mid = []
    if t.detail:
        back += textile(t, 120, 260) + window(t, 1560, 260)
    else:
        back += door_panels(t, 1360, IB)
    mid += altar(t, 760, IB + 60)
    flo += bench(t, 220, IB + 200, 380) + tea_table(t, 1420 if t.detail else 1100, IB + 230)
    lights = [lamp_light(820, IB - 220, KST.CANDLE), lamp_light(1120, IB - 220, KST.CANDLE)]
    return S(back=back, mid=mid, floor=flo, floorY=950, lights=lights)
def kitchen(t):
    back, flo = room(t, IB)
    back += shelf(t, 1250, 330, 380, 5)
    if t.detail:
        back += window(t, 260, 260, 120, 100)
    for i in range(5):
        back.append(line(t, 360 + i * 30, 160, 340 + i * 34, IB - 40, KST.VALUE_3A3430, 10, extra=op(0.18)))
    flo += stove(t, 560, IB + 170)
    flo += jar(t, 1500, IB + 160, 1.1)
    flo += bench(t, 1080, IB + 230, 160, 70)
    for k in range(8):
        flo.append(rect(t, 140 + k % 4 * 30, IB + 20 - k // 4 * 26, 200, 22, t.c(KST.WOOD), True, sw=t.lw * 0.6))
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(560, IB + 90, KST.FIRE)])
def bedroom(t):
    back, flo = room(t, IB)
    back += window(t, 1480, 230, 150, 130)
    flo += bed(t, 160, IB + 190, 600)
    flo.append(rect(t, 1380, IB + 60, 220, 120, t.c(KST.WOOD), True))
    flo.append(rect(t, 1400, IB + 80, 180, 20, shade(t.c(KST.WOOD), 0.2), False))
    stool = bench(t, 1680, IB + 190, 120, 80)
    flo += stool
    flo.append(rect(t, 1722, IB + 66, 36, 44, t.c(KST.GLOW) if t.night else t.c(KST.CLOTH), True, sw=t.lw * 0.6))
    flo.append(ell(t, 1740, IB + 52, 7, 13, t.c(KST.FIRE), False))
    if t.night:
        flo += lantern_glow(t, 1740, IB + 60, 200)
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(1740, IB + 52)])
def stilt_house_inside(t):
    back, flo = room(t, IB, woven_wall=True)
    back += textile(t, 180, 230) + window(t, 1500, 250)
    back.append(rect(t, 980, 300, 360, 14, t.c(KST.WOOD), True))
    for k in range(6):
        back.append(line(t, 1010 + k * 60, 314, 1010 + k * 60, 380, t.c(KST.WOOD), 5))
    back.append(line(t, 1000, 140, 1000, 300, t.c(KST.WOOD), 3))
    back.append(line(t, 1320, 140, 1320, 300, t.c(KST.WOOD), 3))
    flo.append(rect(t, 700, IB + 120, 520, 110, t.c(KST.DIRT), True))
    flo += stove(t, 960, IB + 200)
    for x in (320, 1650):
        flo += jar(t, x, IB + 130, 0.7, t.c(KST.WOVEN))
    return S(back=back, floor=flo, floorY=980, lights=[lamp_light(960, IB + 120, KST.FIRE)])
def storeroom(t):
    back, flo = room(t, IB)
    back += cobweb(t, 0, 0, 1.4) + cobweb(t, W, 0, 1.2, -1)
    for i, (x, y) in enumerate([(1380, 320), (1440, 360), (1500, 330)]):
        back.append(line(t, x, y - 160, x, y + 140, t.c(KST.WOOD), 7))
    back.append(rect(t, 1340, 170, 200, 10, t.c(KST.WOOD), True))
    back.append(poly(t, [(860, 0), (960, 0), (1200, IB), (980, IB)], KST.FFF6D8, False, extra=op(0.12)))
    for x, s in [(180, 1.2), (360, 1.0), (520, 0.8)]:
        flo += jar(t, x, IB + 150, s)
    for k in range(4):
        x = 1300 + k % 2 * 170
        y = IB + 170 - k // 2 * 110
        flo.append(rect(t, x, y - 110, 160, 110, t.c(KST.PAPER), True, rx=30))
    return S(back=back, floor=flo, floorY=960)
def funeral_room(t):
    back, flo = room(t, IB)
    back.append(rect(t, 0, 150, W, 70, t.c(KST.CLOTH), True))
    for k in range(9):
        back.append(path(t, KST.M_S_220_Q_107_60_214_0 % f(k * 214), KST.NONE, True, sw=t.lw * 0.6))
    back += altar(t, 760, IB + 40)
    for x in (300, 1620):
        back.append(rect(t, x - 50, 260, 100, 400, t.c(KST.CLOTH), True))
        back.append(rect(t, x - 50, 260, 100, 30, t.c(KST.DARK), True))
    for x in (360, 1580):
        flo += incense(t, x, IB + 200, 3)
    return S(back=back, floor=flo, occ=[(IB + 230, coffin(t, 680, IB + 230, 560))], floorY=990, lights=[lamp_light(820, IB - 240, KST.CANDLE), lamp_light(1120, IB - 240, KST.CANDLE)])
def temple_hall(t):
    back, flo = room(t, IB, wall=mix(t.c(KST.WOOD), t.c(KST.RED), 0.25), woven_wall=False)
    for x in (140, 520, 1400, 1780):
        back += pillar(t, x, IB, IB)
    back += buddha(t, 960, IB - 20, 1.0)
    back.append(rect(t, 700, IB - 30, 520, 30, t.c(KST.RED), True))
    back += bell(t, 330, 300, 1.2)
    flo.append(ell(t, 1600, IB + 150, 110, 70, mix(t.c(KST.WOOD), t.c(KST.RED), 0.3), True))
    flo.append(ell(t, 1600, IB + 120, 80, 40, t.c(KST.WOOD2), True))
    flo += incense(t, 960, IB + 120, 5)
    for k in range(4):
        flo.append(path(t, KST.M_S_S_Q_30_80_10_160_Q_30_60_0_130 % (f(940 + k * 14), f(IB + 40)), KST.NONE, False, extra=KST.STROKE_DCD8CF_STROKE_WIDTH_3_OPACITY_0_35))
    return S(back=back, floor=flo, floorY=980, lights=[lamp_light(960, IB - 200, KST.CANDLE)])
def shrine_inside(t):
    back, flo = room(t, IB, wall=mix(t.c(KST.INTERIOR_WALL), t.c(KST.STONE), 0.5), woven_wall=False)
    for k in range(6):
        back.append(line(t, 200 + k * 290, 140, 260 + k * 280, 600, t.c(KST.DARK), 3, extra=op(0.5)))
    back.append(rect(t, 760, IB - 260, 400, 260, t.c(KST.RED), True))
    back.append(rect(t, 800, IB - 230, 320, 200, shade(t.c(KST.RED), 0.35), True))
    back += incense(t, 960, IB - 260, 3)
    back.append(rect(t, 720, IB - 300, 480, 40, t.c(KST.WOOD), True))
    back += cobweb(t, 0, 0) + cobweb(t, W, 0, 1.0, -1)
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(960, IB - 330, KST.CANDLE)])
def abandoned_house_inside(t):
    back, flo = room(t, IB)
    for x, y, r in [(400, 60, 90), (1400, 40, 70)]:
        back.append(poly(t, [(x - r, 0), (x + r, 0), (x + r * 0.6, y + r), (x - r * 0.2, y + r * 0.7)], t.raw(KST.NIGHT_SKY) if t.night else t.raw(KST.SKY), True))
    back += cobweb(t, 0, 0, 1.6) + cobweb(t, W, 0, 1.4, -1)
    back += curtain(t, 1500, 200, 200, 380)
    back.append(poly(t, [(760, IB - 160), (1160, IB - 220), (1180, IB - 180), (780, IB - 120)], t.c(KST.WOOD), True))
    back.append(rect(t, 900, 260, 120, 150, t.c(KST.WOOD), True))
    back.append(line(t, 900, 260, 1020, 410, t.c(KST.DARK), 4))
    flo += broken_chair(t, 260, IB + 200) + broken_chair(t, 1380, IB + 240)
    for k in range(10):
        x = t.rng.uniform(100, 1800)
        y = t.rng.uniform(IB + 40, H - 20)
        flo.append(rect(t, x, y, t.rng.uniform(30, 90), 10, t.c(KST.WOOD), True, sw=2))
    return S(back=back, floor=flo, floorY=980)
def roadside_inn(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES)
    mid = []
    mid.append(rect(t, 300, HB - 380, 26, 380, t.c(KST.POST), True))
    mid.append(rect(t, 1600, HB - 380, 26, 380, t.c(KST.POST), True))
    mid += thatch_roof(t, 220, HB - 560, 1480, 220, t.c(KST.THATCH), t.c(KST.THATCH2), horns=False)
    counter = [rect(t, 1100, HB - 150, 420, 30, t.c(KST.WOOD), True), rect(t, 1120, HB - 120, 380, 120, t.c(KST.WOOD2), True)]
    for k in range(3):
        counter += jar(t, 1180 + k * 120, HB - 150, 0.35, t.c(KST.CLOTH))
    mid.append(line(t, 700, HB - 340, 700, HB - 280, t.c(KST.DARK), 3))
    mid.append(rect(t, 680, HB - 280, 40, 50, t.c(KST.GLOW) if t.night else t.c(KST.CLOTH), True))
    if t.night:
        mid += lantern_glow(t, 700, HB - 255, 220)
    flo = gr + bench(t, 360, HB + 160, 360, 90) + tea_table(t, 860, HB + 190)
    flo += stove(t, 1500, HB + 170, True)
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=[(HB, counter)], floorY=960, lights=[lamp_light(700, HB - 255)])
def front_yard(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.BRICK if not t.detail else KST.EARTH)
    mid = []
    if t.detail:
        mid += stilt_house(t, 600, HB, 720)
        mid += bamboo(t, 230, HB, 1.0) + banana(t, 1700, HB, 1.1)
    else:
        mid += house_tile(t, 520, HB, 880, 250)
        mid += bonsai_tree(t, 1560, HB, 1.0)
    mid += jar(t, 1460, HB + 20, 0.6)
    fg = []
    return S(sky=sky_, back=back, mid=mid, floor=gr, fg=fg, floorY=930)
def village_gate(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES)
    mid = []
    for x in (0, 1360):
        for k in range(10):
            mid += bamboo(t, x + 60 + k * 50, HB, 0.8, 3)
    mid.append(rect(t, 640, HB - 420, 640, 420, t.c(KST.WALL), True))
    mid.append(path(t, KST.M760_S_L760_S_Q960_S_1160_S_L1160_S_Z % (HB, HB - 230, HB - 370, HB - 230, HB), t.c(KST.DARK) if not t.night else KST.VALUE_06090F, True))
    mid += roof_tiles(t, 600, HB - 560, 720, 150, t.c(KST.ROOF), 40, curve=True)
    flo = gr + [path(t, KST.M760_S_L1160_S_L1400_S_L520_S_Z % (HB - 8, HB - 8, H, H), t.c(KST.DIRT), True, sw=t.lw * 0.6)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=930)
def village_lane(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES)
    mid = []
    mid += house_tile(t, -60, HB - 30, 520, 200, 2) if not t.detail else hut(t, 40, HB - 20, 380, 170)
    mid += house_tile(t, 1460, HB - 30, 520, 200, 2) if not t.detail else hut(t, 1500, HB - 20, 380, 170)
    for k in range(9):
        mid += bamboo(t, 480 + k * 110, HB - 30, 0.7, 3)
    mid += low_wall(t, 440, 1480, HB - 10, 70)
    flo = gr + [path(t, KST.M820_S_L1100_S_L1500_S_L420_S_Z % (HB - 8, HB - 8, H, H), t.c(KST.DIRT), True, sw=t.lw * 0.6)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=930)
def banyan_tree(t):
    sky_, back, gr = ext_base(t, HB + 30, KST.HILLS if not t.detail else KST.MOUNTAINS, KST.GRASS if t.detail else KST.EARTH)
    mid = banyan(t, 1180, HB + 20, 0.9)
    mid += rock(t, 1040, HB + 40, 0.7) + incense(t, 1060, HB + 10, 3)
    mid += reeds(t, 200, HB + 30, 1.0, 12)
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=950)
def abandoned_shrine(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES)
    mid = []
    mid += bush(t, 500, HB, 1.6) + bush(t, 1450, HB, 1.8)
    mid.append(rect(t, 780, HB - 330, 360, 330, mix(t.c(KST.STONE), t.c(KST.WALL), 0.4), True))
    mid.append(rect(t, 870, HB - 240, 180, 170, t.c(KST.DARK), True))
    mid += roof_tiles(t, 740, HB - 440, 440, 120, mix(t.c(KST.ROOF), t.c(KST.GRASS2), 0.35), 30, curve=True)
    mid.append(rect(t, 760, HB - 60, 400, 60, t.c(KST.STONE2), True))
    mid += incense(t, 960, HB - 60, 2)
    for k in range(6):
        mid.append(line(t, 790 + k * 60, HB - 330, 800 + k * 58, HB - 200, t.c(KST.GRASS2), 4))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=930, lights=[])
def graveyard(t):
    sky_, back, gr = ext_base(t, HB - 40, KST.HILLS, KST.GRASS if t.detail else KST.EARTH)
    mid = []
    mid += round_tree(t, 1640, HB - 60, 1.0) if t.detail else bonsai_tree(t, 1680, HB - 40, 1.2)
    occ = []
    for i, (x, b, s) in enumerate([(300, HB - 30, 0.7), (620, HB - 40, 0.6), (980, HB - 35, 0.65), (1300, HB - 30, 0.7), (420, HB + 70, 1.4), (1450, HB + 90, 1.5), (900, HB + 40, 1.1)]):
        if s >= 1.0:
            occ.append((b, grave(t, x, b, s, stone=i % 2 == 0)))
        else:
            mid += grave(t, x, b, s, stone=i % 2 == 0)
    flo = gr
    fg = tombstone(t, 120, H - 20, 1.2) + reeds(t, 1820, H, 1.0, 8)
    return S(sky=sky_, back=back, mid=mid, floor=flo, fg=fg, occ=occ, floorY=980)
def lonely_grave(t):
    sky_, back, gr = ext_base(t, HB - 60, KST.MOUNTAINS if t.detail else KST.HILLS, KST.FIELD)
    flo = gr
    for k in range(7):
        y = HB - 40 + k * 50
        flo.append(line(t, 0, y, W, y + 20, t.c(KST.FIELD2), 3))
    flo += reeds(t, 1560, HB + 160, 1.3, 7)
    return S(sky=sky_, back=back, mid=[], floor=flo, occ=[(HB + 170, grave(t, 1180, HB + 170, 2.6))], floorY=980)
def village_well(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.EARTH)
    mid = []
    for k in range(10):
        mid += bamboo(t, 100 + k * 190, HB, 0.8, 4)
    flo = gr
    x, b = (1250, HB + 180)
    well = [rect(t, x - 160, b - 140, 320, 140, t.c(KST.STONE), True)]
    for k in range(3):
        well.append(line(t, x - 160, b - 140 + k * 46, x + 160, b - 140 + k * 46, t.c(KST.STONE2), 3))
    well.append(ell(t, x, b - 140, 160, 26, t.c(KST.DARK), True))
    well.append(rect(t, x - 150, b - 330, 14, 190, t.c(KST.WOOD), True))
    well.append(rect(t, x + 136, b - 330, 14, 190, t.c(KST.WOOD), True))
    well.append(rect(t, x - 170, b - 340, 340, 18, t.c(KST.WOOD), True))
    well.append(line(t, x, b - 322, x, b - 230, t.line, 2))
    well.append(rect(t, x - 26, b - 230, 52, 44, t.c(KST.WOOD2), True))
    flo.append(rect(t, 520, b - 30, 240, 40, t.c(KST.STONE2), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=[(b, well)], floorY=960)
def river_bank(t):
    sky_, back, _ = ext_base(t, 620, KST.MOUNTAINS if t.detail else KST.TREES)
    back += [rect(t, -10, 560, W + 20, 70, t.c(KST.TREE2), True)]
    flo = water_band(t, 620, 790, 14)
    flo += ground(t, 780, KST.EARTH, 3)
    flo += reeds(t, 160, 800, 1.2, 14) + reeds(t, 1700, 800, 1.1, 12)
    flo.append(line(t, 1300, 640, 1300, 820, t.c(KST.WOOD), 8))
    flo.append(path(t, KST.M1080_700_L1420_700_Q1400_745_1360_750_L1130_750_Q1090_740_1080_700_Z, t.c(KST.WOOD), True))
    return S(sky=sky_, back=back, floor=flo, floorY=980)
def ferry_landing(t):
    sky_, back, _ = ext_base(t, 620, KST.MOUNTAINS if t.detail else KST.TREES)
    back += [rect(t, -10, 560, W + 20, 70, t.c(KST.TREE2), True)]
    flo = water_band(t, 620, 800, 12) + ground(t, 790, KST.EARTH, 3)
    mid = hut(t, 120, 800, 380, 170)
    flo.append(rect(t, 760, 700, 640, 26, t.c(KST.WOOD2), True))
    for k in range(6):
        flo.append(rect(t, 780 + k * 120, 726, 14, 90, t.c(KST.WOOD), True))
    flo.append(path(t, KST.M1460_690_L1840_690_Q1820_740_1780_748_L1500_748_Q1470_740_1460_690_Z, t.c(KST.WOOD), True))
    flo.append(line(t, 1640, 520, 1700, 760, t.c(KST.WOOD2), 6))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=990)
def bamboo_bridge(t):
    sky_, back, gr = ext_base(t, HB - 60, KST.TREES, KST.GRASS)
    flo = gr
    flo += water_band(t, 800, 940, 8)
    flo.append(rect(t, 300, 760, 1320, 24, t.c(KST.BAMBOO2), True))
    for k in range(12):
        flo.append(line(t, 320 + k * 110, 784, 330 + k * 110, 900, t.c(KST.BAMBOO2), 8))
    flo.append(line(t, 300, 700, 1620, 700, t.c(KST.BAMBOO2), 7))
    flo += banana(t, 120, 800, 1.0) + banana(t, 1800, 800, 1.0) + reeds(t, 1650, 960, 1.0, 8)
    return S(sky=sky_, back=back, floor=flo, floorY=760)
def pond(t):
    sky_, back, gr = ext_base(t, HB - 40, KST.TREES, KST.GRASS)
    mid = house_tile(t, 1200, HB - 50, 600, 180, 2) if not t.detail else hut(t, 1300, HB - 40, 380, 160)
    mid += banana(t, 1120, HB - 40, 1.0)
    flo = gr
    flo.append(ell(t, 820, 880, 760, 150, t.c(KST.WATER), True))
    for x, y in [(420, 860), (560, 900), (900, 840), (1180, 900), (700, 950)]:
        flo.append(ell(t, x, y, 50, 18, t.c(KST.LEAF), True, sw=t.lw * 0.6))
    flo.append(rect(t, 1380, 800, 260, 26, t.c(KST.WOOD2), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=1000)
def rice_field(t):
    sky_, back, _ = ext_base(t, 620, KST.MOUNTAINS if t.detail else KST.HILLS)
    flo = [rect(t, -10, 600, W + 20, H - 590, t.c(KST.FIELD), True)]
    for k in range(9):
        y = 600 + (H - 600) * (k / 9) ** 1.4
        flo.append(line(t, 0, y, W, y, t.c(KST.FIELD2), 4))
    for k in range(-6, 8):
        flo.append(line(t, 960 + k * 60, 600, 960 + k * 320, H, t.c(KST.FIELD2), 3, extra=op(0.6)))
    mid = hut(t, 1500, 640, 240, 120)
    sc = [line(t, 420, 780, 420, 560, t.c(KST.WOOD), 7), line(t, 360, 620, 480, 620, t.c(KST.WOOD), 7), circ(t, 420, 540, 30, t.c(KST.PAPER), True), poly(t, [(370, 520), (420, 470), (470, 520)], t.c(KST.THATCH), True)]
    return S(sky=sky_, back=back, mid=mid, floor=flo + sc, floorY=980)
def bamboo_grove(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.EARTH)
    mid = []
    for k in range(14):
        mid += bamboo(t, 40 + k * 140, HB, 1.1, 5)
    flo = gr + [path(t, KST.M860_S_L1060_S_L1400_S_L520_S_Z % (HB - 8, HB - 8, H, H), t.c(KST.DIRT), True, sw=t.lw * 0.6)]
    for k in range(18):
        x, y = (t.rng.uniform(100, 1800), t.rng.uniform(HB + 20, H - 20))
        flo.append(ell(t, x, y, 16, 5, t.c(KST.THATCH2), False))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=950)
def old_forest(t):
    sky_ = sky(t, HB)
    back = [rect(t, -10, 0, W + 20, HB, t.c(KST.TREE2), False)]
    for k in range(9):
        x = 60 + k * 230
        back.append(rect(t, x, 0, 70 + k % 3 * 20, HB, shade(t.c(KST.TRUNK), 0.15), True))
    mid = []
    for x, w in [(200, 150), (820, 120), (1500, 170)]:
        mid.append(rect(t, x, 0, w, HB + 40, t.c(KST.TRUNK), True))
        mid.append(path(t, KST.M_S_S_Q_60_30_100_60_M_S_S_Q_60_30_100_60 % (f(x), f(HB + 30), f(x + w), f(HB + 30)), KST.NONE, True))
    for k in range(6):
        mid.append(spath(KST.M_S_0_Q_30_200_10_420 % f(300 + k * 260), t.c(KST.LEAF), 6))
    flo = ground(t, HB - 10, KST.EARTH, 4)
    flo += [path(t, KST.M860_S_L1060_S_L1300_S_L620_S_Z % (HB - 8, HB - 8, H, H), t.c(KST.DIRT), True, sw=t.lw * 0.6)]
    flo += bush(t, 120, H - 40, 1.6) + bush(t, 1800, H - 30, 1.7)
    if t.night or t.detail:
        flo.append(rect(t, -10, HB - 80, W + 20, 140, KST.DFE6EA, False, extra=op(0.12)))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=950)
def mountain_village(t):
    sky_ = sky(t, 600)
    back = mountains(t, 600)
    flo = [path(t, KST.M_20_640_Q_600_540_1940_620_L1940_1080_L_20_1080_Z, t.c(KST.FIELD), True)]
    for k in range(6):
        y = 660 + k * 60
        flo.append(spath(KST.M_20_S_Q_600_S_1940_S % (f(y), f(y - 80), f(y + 10)), t.c(KST.FIELD2), 4))
    mid = []
    for x, b, s in [(160, 640, 0.45), (520, 610, 0.4), (1300, 620, 0.42), (1620, 650, 0.5)]:
        mid.append(KST.G_TRANSFORM_TRANSLATE_S_S_SCALE_S_S_G % (f(x), f(b), f(s), KST.EMPTY.join(stilt_house(t, 0, 0, 620))))
    flo += [path(t, KST.M_20_840_Q_900_760_1940_860_L1940_1080_L_20_1080_Z, t.c(KST.EARTH), True)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=990)
def stream(t):
    sky_, back, gr = ext_base(t, HB - 60, KST.MOUNTAINS if t.detail else KST.TREES, KST.GRASS)
    flo = gr
    flo.append(path(t, KST.M820_S_L1100_S_Q1200_860_1500_S_L420_S_Q760_860_820_S_Z % (HB - 70, HB - 70, H, H, HB - 70), t.c(KST.WATER), True))
    for x, y, s in [(700, 900, 1.0), (1240, 820, 0.8), (980, 1000, 1.1), (560, 1040, 0.9), (1400, 1000, 0.9)]:
        flo += rock(t, x, y, s)
    for k in range(10):
        x = t.rng.uniform(760, 1200)
        y = t.rng.uniform(HB, H - 30)
        flo.append(line(t, x, y, x + 50, y, KST.E8F1F3, 3, extra=op(0.7)))
    mid = pine(t, 220, HB - 60, 1.4) + pine(t, 1700, HB - 60, 1.5) + bush(t, 420, HB - 50, 1.2)
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=980)
def forest_path(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.EARTH)
    back += [rect(t, -10, HB - 300, W + 20, 300, t.c(KST.TREE2), False)]
    mid = []
    for x, s in [(150, 1.4), (420, 1.0), (1500, 1.1), (1780, 1.5)]:
        mid += round_tree(t, x, HB, s) if t.detail else poly_tree(t, x, HB, s * 0.8, x > 900)
    flo = gr + [path(t, KST.M900_S_Q_1000_900_760_S_L1260_S_Q_1180_860_1020_S_Z % (HB - 8, H, H, HB - 8), t.c(KST.DIRT), True, sw=t.lw * 0.6)]
    for k in range(5):
        y = HB + 60 + k * 60
        flo.append(spath(KST.M_S_S_Q_120_20_240_10 % (f(800 + k * 20), f(y)), t.c(KST.TRUNK), 8))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=960)
def cave(t):
    sky_ = sky(t, HB)
    back = [path(t, KST.M_20_S_L_20_120_Q_400_40_900_60_Q_1500_60_1940_140_L1940_S_Z % (HB + 20, HB + 20), t.c(KST.ROCK), True)]
    for k in range(10):
        x = 80 + k * 190
        back.append(line(t, x, 100 + k % 3 * 40, x + 40, 400 + k % 2 * 80, t.c(KST.STONE2), 3, extra=op(0.7)))
    back.append(path(t, KST.M640_S_Q_640_260_960_220_Q_1280_260_1280_S_Z % (HB + 20, HB + 20), KST.VALUE_08090C, True))
    for k in range(7):
        x = 700 + k * 85
        back.append(poly(t, [(x, 250 + k % 2 * 20), (x + 30, 250), (x + 15, 330 + k % 3 * 30)], t.c(KST.ROCK), True, sw=t.lw * 0.6))
    for k in range(6):
        back.append(spath(KST.M_S_60_Q_20_120_10_260 % f(300 + k * 260), t.c(KST.LEAF), 6))
    flo = ground(t, HB + 10, KST.STONE, 4) + rock(t, 360, H - 40, 1.6) + rock(t, 1620, H - 30, 1.4)
    return S(sky=sky_, back=back, floor=flo, floorY=980)
def village_temple(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.STONE)
    mid = []
    mid += banyan(t, 230, HB, 0.55)
    mid.append(rect(t, 520, HB - 300, 880, 300, mix(t.c(KST.WOOD), t.c(KST.RED), 0.2), True))
    for k in range(7):
        mid.append(rect(t, 540 + k * 136, HB - 300, 30, 300, t.c(KST.POST), True))
    for k in range(3):
        mid += lit(t, 650 + k * 260, HB - 230, 120, 220)
    mid += roof_tiles(t, 440, HB - 560, 1040, 270, t.c(KST.ROOF), 80, curve=True)
    mid.append(rect(t, 480, HB - 20, 960, 30, t.c(KST.STONE2), True))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=950)
def pagoda_gate(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.STONE)
    back += roof_tiles(t, 760, HB - 620, 400, 120, t.c(KST.ROOF), 40, curve=True)
    back.append(rect(t, 820, HB - 500, 280, 140, t.c(KST.WALL), True))
    mid = []
    for x, w, h in [(560, 220, 330), (840, 240, 420), (1140, 220, 330)]:
        mid.append(rect(t, x, HB - h, w, h, t.c(KST.WALL), True))
        mid.append(path(t, KST.M_S_S_L_S_S_Q_S_S_S_S_L_S_S_Z % (f(x + 40), f(HB), f(x + 40), f(HB - h * 0.5), f(x + w / 2), f(HB - h * 0.75), f(x + w - 40), f(HB - h * 0.5), f(x + w - 40), f(HB)), KST.VALUE_0B0D10, True))
        mid += roof_tiles(t, x - 20, HB - h - 90, w + 40, 90, t.c(KST.ROOF), 20, curve=True)
    mid += round_tree(t, 330, HB, 0.9) if t.detail else bonsai_tree(t, 330, HB, 1.2)
    flo = gr
    for k in range(3):
        flo.append(rect(t, 760 - k * 40, HB + k * 34, 400 + k * 80, 34, t.c(KST.STONE2), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=980)
def market(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.EARTH)
    mid = []
    occ = []
    for x in (120, 760, 1400):
        mid.append(rect(t, x, HB - 260, 20, 260, t.c(KST.POST), True))
        mid.append(rect(t, x + 400, HB - 260, 20, 260, t.c(KST.POST), True))
        mid += thatch_roof(t, x - 20, HB - 380, 460, 140, t.c(KST.THATCH), t.c(KST.THATCH2), horns=False)
        occ.append((HB, [rect(t, x + 20, HB - 110, 380, 26, t.c(KST.WOOD), True), rect(t, x + 30, HB - 84, 360, 84, t.c(KST.WOOD2), True)]))
    flo = gr
    for x, c in [(300, KST.GRASS), (520, KST.RED), (980, KST.GOLD), (1200, KST.LEAF), (1600, KST.WATER)]:
        flo.append(ell(t, x, HB + 90, 80, 30, t.c(KST.WOVEN), True))
        flo.append(ell(t, x, HB + 76, 60, 18, t.c(c), True, sw=t.lw * 0.6))
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=occ, floorY=980)
def abandoned_house(t):
    sky_, back, gr = ext_base(t, HB, KST.TREES, KST.GRASS)
    mid = []
    x, b, w, h = (520, HB, 880, 250)
    mid.append(poly(t, [(x, b - h), (x + w, b - h + 20), (x + w + 8, b), (x - 8, b)], mix(t.c(KST.WALL), t.c(KST.STONE2), 0.4), True))
    mid.append(poly(t, [(x - 40, b - h), (x + w * 0.3, b - h - 120), (x + w * 0.5, b - h - 60), (x + w * 0.62, b - h - 130), (x + w + 40, b - h + 20)], shade(t.c(KST.ROOF), 0.2), True))
    mid.append(poly(t, [(x + w * 0.42, b - h - 70), (x + w * 0.5, b - h - 60), (x + w * 0.46, b - h + 10)], t.raw(KST.NIGHT_SKY) if t.night else t.raw(KST.SKY), True))
    mid.append(rect(t, x + 120, b - 200, 130, 190, KST.VALUE_0B0C0F, True))
    mid.append(poly(t, [(x + 250, b - 200), (x + 300, b - 180), (x + 300, b - 20), (x + 250, b - 10)], t.c(KST.WOOD), True))
    mid.append(rect(t, x + 520, b - 190, 160, 100, KST.VALUE_0B0C0F, True))
    mid.append(line(t, x + 520, b - 190, x + 680, b - 90, t.c(KST.WOOD), 6))
    mid += [pline(t, [(1560, b), (1580, b - 200), (1520, b - 330)], t.c(KST.TRUNK), 16), pline(t, [(1575, b - 220), (1660, b - 330)], t.c(KST.TRUNK), 10), pline(t, [(1540, b - 290), (1470, b - 360)], t.c(KST.TRUNK), 8)]
    for k in range(14):
        mid.append(line(t, x - 20 + k * 70, b, x - 30 + k * 72, b - t.rng.uniform(40, 110), t.c(KST.GRASS2), 4))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=940)
def hill_road(t):
    sky_ = sky(t, 520)
    back = mountains(t, 640) if t.detail else hills(t, 640)
    flo = [path(t, KST.M_20_760_L1940_600_L1940_1080_L_20_1080_Z, t.c(KST.ROCK), True)]
    flo.append(path(t, KST.M_20_820_L1940_660_L1940_760_L_20_960_Z, t.c(KST.DIRT), True))
    for k in range(6):
        flo.append(rect(t, 200 + k * 300, 830 - k * 26, 14, 50, t.c(KST.CLOTH), True, sw=t.lw * 0.5))
    mid = pine(t, 1600, 640, 1.2) + pine(t, 1780, 620, 1.0)
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=900)
SCENES = {
    KST.MAIN_ROOM: main_room,
    KST.KITCHEN: kitchen,
    KST.BEDROOM: bedroom,
    KST.STILT_HOUSE_INSIDE: stilt_house_inside,
    KST.STOREROOM: storeroom,
    KST.FUNERAL_ROOM: funeral_room,
    KST.TEMPLE_HALL: temple_hall,
    KST.SHRINE_INSIDE: shrine_inside,
    KST.ABANDONED_HOUSE_INSIDE: abandoned_house_inside,
    KST.ROADSIDE_INN: roadside_inn,
    KST.FRONT_YARD: front_yard,
    KST.VILLAGE_GATE: village_gate,
    KST.VILLAGE_LANE: village_lane,
    KST.BANYAN_TREE: banyan_tree,
    KST.ABANDONED_SHRINE: abandoned_shrine,
    KST.GRAVEYARD: graveyard,
    KST.LONELY_GRAVE: lonely_grave,
    KST.VILLAGE_WELL: village_well,
    KST.RIVER_BANK: river_bank,
    KST.FERRY_LANDING: ferry_landing,
    KST.BAMBOO_BRIDGE: bamboo_bridge,
    KST.POND: pond,
    KST.RICE_FIELD: rice_field,
    KST.BAMBOO_GROVE: bamboo_grove,
    KST.OLD_FOREST: old_forest,
    KST.MOUNTAIN_VILLAGE: mountain_village,
    KST.STREAM: stream,
    KST.FOREST_PATH: forest_path,
    KST.CAVE: cave,
    KST.VILLAGE_TEMPLE: village_temple,
    KST.PAGODA_GATE: pagoda_gate,
    KST.MARKET: market,
    KST.ABANDONED_HOUSE: abandoned_house,
    KST.HILL_ROAD: hill_road,
}
DECOR = {
    KST.FRONT_YARD: (KST.EXT, HB + 20),
    KST.VILLAGE_LANE: (KST.EXT, HB + 10),
    KST.BANYAN_TREE: (KST.EXT, HB + 40),
    KST.ABANDONED_SHRINE: (KST.EXT, HB + 10),
    KST.GRAVEYARD: (KST.EXT, HB - 20),
    KST.VILLAGE_WELL: (KST.EXT, HB + 20),
    KST.BAMBOO_GROVE: (KST.EXT, HB + 10),
    KST.FOREST_PATH: (KST.EXT, HB + 10),
    KST.VILLAGE_TEMPLE: (KST.EXT, HB + 10),
    KST.PAGODA_GATE: (KST.EXT, HB + 10),
    KST.MARKET: (KST.EXT, HB + 10),
    KST.ABANDONED_HOUSE: (KST.EXT, HB + 10),
    KST.ROADSIDE_INN: (KST.EXT, HB + 10),
    KST.VILLAGE_GATE: (KST.EXT, HB + 10),
    KST.LONELY_GRAVE: (KST.EXT, HB - 40),
    KST.MAIN_ROOM: (KST.INT, IB + 70),
    KST.KITCHEN: (KST.INT, IB + 60),
    KST.BEDROOM: (KST.INT, IB + 60),
    KST.STILT_HOUSE_INSIDE: (KST.INT, IB + 60),
    KST.STOREROOM: (KST.INT, IB + 60),
    KST.SHRINE_INSIDE: (KST.INT, IB + 60),
    KST.ABANDONED_HOUSE_INSIDE: (KST.INT, IB + 60),
    KST.TEMPLE_HALL: (KST.INT, IB + 60),
}
def decor(t, kind, y):
    out = []
    xs = [t.rng.uniform(80, 360), t.rng.uniform(1560, 1840)]
    for x in xs:
        r = t.rng.randrange(4)
        if kind == KST.EXT:
            out += [bush(t, x, y, t.rng.uniform(0.8, 1.2)), rock(t, x, y + 10, t.rng.uniform(0.5, 0.8)), reeds(t, x, y, 0.9, 7), jar(t, x, y + 10, 0.5)][r]
        else:
            out += [jar(t, x, y, t.rng.uniform(0.5, 0.8)), jar(t, x, y, 0.45, t.c(KST.WOVEN)), shelf(t, x - 120, y - 330, 240, 3), [rect(t, x - 60, y - 70, 120, 70, t.c(KST.WOOD2), True), rect(t, x - 70, y - 80, 140, 16, t.c(KST.WOOD), True)]][r]
    return out
def mirror(items):
    return [KST.G_TRANSFORM_TRANSLATE_1920_0_SCALE_1_1_S_G % KST.EMPTY.join(items)] if items else []
def build(key, style, night=False, v=0):
    t = T(style, night, seed=sum(map(ord, key)) + v * 101, v=v)
    sc = SCENES[key](t)
    if v and key in DECOR:
        sc[KST.FLOOR] += decor(t, *DECOR[key])
    lights = sc[KST.LIGHTS]
    flip = v in (1, 3)
    if flip:
        for k in (KST.BACK, KST.MID, KST.FLOOR, KST.FG):
            sc[k] = mirror(sc[k])
        lights = [dict(l, x=W - l[KST.X]) for l in lights]
    occ = KST.EMPTY.join((KST.G_DATA_OCC_D_S_G % (y, KST.EMPTY.join(mirror(items) if flip else items)) for y, items in sc.get(KST.OCC, [])))
    return (svg(t, sc[KST.SKY], sc[KST.BACK], sc[KST.MID], sc[KST.FLOOR], sc[KST.FG], occ=occ), sc[KST.FLOORY], lights)
from reference_expansion import SCENE_CATALOG
from fixed_compositions import SCENES as FIXED_SCENES
SCENE_CATALOG = dict(SCENE_CATALOG, **FIXED_SCENES)
for _key, (_fn, _name, _desc, _inside, _tags) in SCENE_CATALOG.items():
    SCENES[_key] = lambda t, fn=_fn: S(floorY=960, **fn(t))
