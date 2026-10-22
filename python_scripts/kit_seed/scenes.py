from interior import *

HB = 750
IB = 720


def S(**k):
    base = dict(sky=[], back=[], mid=[], floor=[], fg=[], floorY=900, lights=[], occ=[])
    base.update(k)
    return base


def lamp_light(x, y, kind='lamp'):
    return {'x': x, 'y': y, 'color': '#ffcc88', 'kind': kind}


def ext_base(t, hb=HB, far='trees', ground_kind='earth'):
    sky_ = sky(t, hb)
    back = []
    if far == 'mountains':
        back += mountains(t, hb)
    elif far == 'trees':
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
    elif far == 'hills':
        back += hills(t, hb)
    return sky_, back, ground(t, hb - 10, ground_kind)


def main_room(t):
    back, flo = room(t, IB)
    mid = []
    if t.detail:
        back += textile(t, 120, 260) + window(t, 1560, 260)
    else:
        back += door_panels(t, 1360, IB)
    mid += altar(t, 760, IB + 60)
    flo += bench(t, 220, IB + 200, 380) + tea_table(t, 1420 if t.detail else 1100, IB + 230)
    lights = [lamp_light(820, IB - 220, 'candle'), lamp_light(1120, IB - 220, 'candle')]
    return S(back=back, mid=mid, floor=flo, floorY=950, lights=lights)


def kitchen(t):
    back, flo = room(t, IB)
    back += shelf(t, 1250, 330, 380, 5)
    if t.detail:
        back += window(t, 260, 260, 120, 100)
    for i in range(5):
        back.append(line(t, 360 + i * 30, 160, 340 + i * 34, IB - 40, '#3a3430', 10, extra=op(0.18)))
    flo += stove(t, 560, IB + 170)
    flo += jar(t, 1500, IB + 160, 1.1)
    flo += bench(t, 1080, IB + 230, 160, 70)
    for k in range(8):
        flo.append(rect(t, 140 + (k % 4) * 30, IB + 20 - (k // 4) * 26, 200, 22, t.c('wood'), True, sw=t.lw * 0.6))
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(560, IB + 90, 'fire')])


def bedroom(t):
    back, flo = room(t, IB)
    back += window(t, 1480, 230, 150, 130)
    flo += bed(t, 160, IB + 190, 600)
    flo.append(rect(t, 1380, IB + 60, 220, 120, t.c('wood'), True))
    flo.append(rect(t, 1400, IB + 80, 180, 20, shade(t.c('wood'), 0.2), False))
    stool = bench(t, 1680, IB + 190, 120, 80)
    flo += stool
    flo.append(rect(t, 1722, IB + 66, 36, 44, t.c('glow') if t.night else t.c('cloth'), True, sw=t.lw * 0.6))
    flo.append(ell(t, 1740, IB + 52, 7, 13, t.c('fire'), False))
    if t.night:
        flo += lantern_glow(t, 1740, IB + 60, 200)
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(1740, IB + 52)])


def stilt_house_inside(t):
    back, flo = room(t, IB, woven_wall=True)
    back += textile(t, 180, 230) + window(t, 1500, 250)
    back.append(rect(t, 980, 300, 360, 14, t.c('wood'), True))
    for k in range(6):
        back.append(line(t, 1010 + k * 60, 314, 1010 + k * 60, 380, t.c('wood'), 5))
    back.append(line(t, 1000, 140, 1000, 300, t.c('wood'), 3))
    back.append(line(t, 1320, 140, 1320, 300, t.c('wood'), 3))
    flo.append(rect(t, 700, IB + 120, 520, 110, t.c('dirt'), True))
    flo += stove(t, 960, IB + 200)
    for x in (320, 1650):
        flo += jar(t, x, IB + 130, 0.7, t.c('woven'))
    return S(back=back, floor=flo, floorY=980, lights=[lamp_light(960, IB + 120, 'fire')])


def storeroom(t):
    back, flo = room(t, IB)
    back += cobweb(t, 0, 0, 1.4) + cobweb(t, W, 0, 1.2, -1)
    for i, (x, y) in enumerate([(1380, 320), (1440, 360), (1500, 330)]):
        back.append(line(t, x, y - 160, x, y + 140, t.c('wood'), 7))
    back.append(rect(t, 1340, 170, 200, 10, t.c('wood'), True))
    back.append(poly(t, [(860, 0), (960, 0), (1200, IB), (980, IB)], '#fff6d8', False, extra=op(0.12)))
    for x, s in [(180, 1.2), (360, 1.0), (520, 0.8)]:
        flo += jar(t, x, IB + 150, s)
    for k in range(4):
        x = 1300 + (k % 2) * 170
        y = IB + 170 - (k // 2) * 110
        flo.append(rect(t, x, y - 110, 160, 110, t.c('paper'), True, rx=30))
    return S(back=back, floor=flo, floorY=960)


def funeral_room(t):
    back, flo = room(t, IB)
    back.append(rect(t, 0, 150, W, 70, t.c('cloth'), True))
    for k in range(9):
        back.append(path(t, 'M%s 220 q 107 60 214 0' % f(k * 214), 'none', True, sw=t.lw * 0.6))
    back += altar(t, 760, IB + 40)
    for x in (300, 1620):
        back.append(rect(t, x - 50, 260, 100, 400, t.c('cloth'), True))
        back.append(rect(t, x - 50, 260, 100, 30, t.c('dark'), True))
    for x in (360, 1580):
        flo += incense(t, x, IB + 200, 3)
    return S(back=back, floor=flo, occ=[(IB + 230, coffin(t, 680, IB + 230, 560))], floorY=990, lights=[lamp_light(820, IB - 240, 'candle'), lamp_light(1120, IB - 240, 'candle')])


def temple_hall(t):
    back, flo = room(t, IB, wall=mix(t.c('wood'), t.c('red'), 0.25), woven_wall=False)
    for x in (140, 520, 1400, 1780):
        back += pillar(t, x, IB, IB)
    back += buddha(t, 960, IB - 20, 1.0)
    back.append(rect(t, 700, IB - 30, 520, 30, t.c('red'), True))
    back += bell(t, 330, 300, 1.2)
    flo.append(ell(t, 1600, IB + 150, 110, 70, mix(t.c('wood'), t.c('red'), 0.3), True))
    flo.append(ell(t, 1600, IB + 120, 80, 40, t.c('wood2'), True))
    flo += incense(t, 960, IB + 120, 5)
    for k in range(4):
        flo.append(path(t, 'M%s %s q -30 -80 10 -160 q 30 -60 0 -130' % (f(940 + k * 14), f(IB + 40)), 'none', False, extra=' stroke="#dcd8cf" stroke-width="3" opacity="0.35"'))
    return S(back=back, floor=flo, floorY=980, lights=[lamp_light(960, IB - 200, 'candle')])


def shrine_inside(t):
    back, flo = room(t, IB, wall=mix(t.c('interior_wall'), t.c('stone'), 0.5), woven_wall=False)
    for k in range(6):
        back.append(line(t, 200 + k * 290, 140, 260 + k * 280, 600, t.c('dark'), 3, extra=op(0.5)))
    back.append(rect(t, 760, IB - 260, 400, 260, t.c('red'), True))
    back.append(rect(t, 800, IB - 230, 320, 200, shade(t.c('red'), 0.35), True))
    back += incense(t, 960, IB - 260, 3)
    back.append(rect(t, 720, IB - 300, 480, 40, t.c('wood'), True))
    back += cobweb(t, 0, 0) + cobweb(t, W, 0, 1.0, -1)
    return S(back=back, floor=flo, floorY=960, lights=[lamp_light(960, IB - 330, 'candle')])


def abandoned_house_inside(t):
    back, flo = room(t, IB)
    for x, y, r in [(400, 60, 90), (1400, 40, 70)]:
        back.append(poly(t, [(x - r, 0), (x + r, 0), (x + r * 0.6, y + r), (x - r * 0.2, y + r * 0.7)], t.raw('night_sky') if t.night else t.raw('sky'), True))
    back += cobweb(t, 0, 0, 1.6) + cobweb(t, W, 0, 1.4, -1)
    back += curtain(t, 1500, 200, 200, 380)
    back.append(poly(t, [(760, IB - 160), (1160, IB - 220), (1180, IB - 180), (780, IB - 120)], t.c('wood'), True))
    back.append(rect(t, 900, 260, 120, 150, t.c('wood'), True))
    back.append(line(t, 900, 260, 1020, 410, t.c('dark'), 4))
    flo += broken_chair(t, 260, IB + 200) + broken_chair(t, 1380, IB + 240)
    for k in range(10):
        x = t.rng.uniform(100, 1800)
        y = t.rng.uniform(IB + 40, H - 20)
        flo.append(rect(t, x, y, t.rng.uniform(30, 90), 10, t.c('wood'), True, sw=2))
    return S(back=back, floor=flo, floorY=980)


def roadside_inn(t):
    sky_, back, gr = ext_base(t, HB, 'trees')
    mid = []
    mid.append(rect(t, 300, HB - 380, 26, 380, t.c('post'), True))
    mid.append(rect(t, 1600, HB - 380, 26, 380, t.c('post'), True))
    mid += thatch_roof(t, 220, HB - 560, 1480, 220, t.c('thatch'), t.c('thatch2'), horns=False)
    counter = [rect(t, 1100, HB - 150, 420, 30, t.c('wood'), True), rect(t, 1120, HB - 120, 380, 120, t.c('wood2'), True)]
    for k in range(3):
        counter += jar(t, 1180 + k * 120, HB - 150, 0.35, t.c('cloth'))
    mid.append(line(t, 700, HB - 340, 700, HB - 280, t.c('dark'), 3))
    mid.append(rect(t, 680, HB - 280, 40, 50, t.c('glow') if t.night else t.c('cloth'), True))
    if t.night:
        mid += lantern_glow(t, 700, HB - 255, 220)
    flo = gr + bench(t, 360, HB + 160, 360, 90) + tea_table(t, 860, HB + 190)
    flo += stove(t, 1500, HB + 170, True)
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=[(HB, counter)], floorY=960, lights=[lamp_light(700, HB - 255)])


def front_yard(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'brick' if not t.detail else 'earth')
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
    sky_, back, gr = ext_base(t, HB, 'trees')
    mid = []
    for x in (0, 1360):
        for k in range(10):
            mid += bamboo(t, x + 60 + k * 50, HB, 0.8, 3)
    mid.append(rect(t, 640, HB - 420, 640, 420, t.c('wall'), True))
    mid.append(path(t, 'M760 %s L760 %s Q960 %s 1160 %s L1160 %s Z' % (HB, HB - 230, HB - 370, HB - 230, HB), t.c('dark') if not t.night else '#06090f', True))
    mid += roof_tiles(t, 600, HB - 560, 720, 150, t.c('roof'), 40, curve=True)
    flo = gr + [path(t, 'M760 %s L1160 %s L1400 %s L520 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=930)


def village_lane(t):
    sky_, back, gr = ext_base(t, HB, 'trees')
    mid = []
    mid += house_tile(t, -60, HB - 30, 520, 200, 2) if not t.detail else hut(t, 40, HB - 20, 380, 170)
    mid += house_tile(t, 1460, HB - 30, 520, 200, 2) if not t.detail else hut(t, 1500, HB - 20, 380, 170)
    for k in range(9):
        mid += bamboo(t, 480 + k * 110, HB - 30, 0.7, 3)
    mid += low_wall(t, 440, 1480, HB - 10, 70)
    flo = gr + [path(t, 'M820 %s L1100 %s L1500 %s L420 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=930)


def banyan_tree(t):
    sky_, back, gr = ext_base(t, HB + 30, 'hills' if not t.detail else 'mountains', 'grass' if t.detail else 'earth')
    mid = banyan(t, 1180, HB + 20, 0.9)
    mid += rock(t, 1040, HB + 40, 0.7) + incense(t, 1060, HB + 10, 3)
    mid += reeds(t, 200, HB + 30, 1.0, 12)
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=950)


def abandoned_shrine(t):
    sky_, back, gr = ext_base(t, HB, 'trees')
    mid = []
    mid += bush(t, 500, HB, 1.6) + bush(t, 1450, HB, 1.8)
    mid.append(rect(t, 780, HB - 330, 360, 330, mix(t.c('stone'), t.c('wall'), 0.4), True))
    mid.append(rect(t, 870, HB - 240, 180, 170, t.c('dark'), True))
    mid += roof_tiles(t, 740, HB - 440, 440, 120, mix(t.c('roof'), t.c('grass2'), 0.35), 30, curve=True)
    mid.append(rect(t, 760, HB - 60, 400, 60, t.c('stone2'), True))
    mid += incense(t, 960, HB - 60, 2)
    for k in range(6):
        mid.append(line(t, 790 + k * 60, HB - 330, 800 + k * 58, HB - 200, t.c('grass2'), 4))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=930, lights=[])


def graveyard(t):
    sky_, back, gr = ext_base(t, HB - 40, 'hills', 'grass' if t.detail else 'earth')
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
    sky_, back, gr = ext_base(t, HB - 60, 'mountains' if t.detail else 'hills', 'field')
    flo = gr
    for k in range(7):
        y = HB - 40 + k * 50
        flo.append(line(t, 0, y, W, y + 20, t.c('field2'), 3))
    flo += reeds(t, 1560, HB + 160, 1.3, 7)
    return S(sky=sky_, back=back, mid=[], floor=flo, occ=[(HB + 170, grave(t, 1180, HB + 170, 2.6))], floorY=980)


def village_well(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'earth')
    mid = []
    for k in range(10):
        mid += bamboo(t, 100 + k * 190, HB, 0.8, 4)
    flo = gr
    x, b = 1250, HB + 180
    well = [rect(t, x - 160, b - 140, 320, 140, t.c('stone'), True)]
    for k in range(3):
        well.append(line(t, x - 160, b - 140 + k * 46, x + 160, b - 140 + k * 46, t.c('stone2'), 3))
    well.append(ell(t, x, b - 140, 160, 26, t.c('dark'), True))
    well.append(rect(t, x - 150, b - 330, 14, 190, t.c('wood'), True))
    well.append(rect(t, x + 136, b - 330, 14, 190, t.c('wood'), True))
    well.append(rect(t, x - 170, b - 340, 340, 18, t.c('wood'), True))
    well.append(line(t, x, b - 322, x, b - 230, t.line, 2))
    well.append(rect(t, x - 26, b - 230, 52, 44, t.c('wood2'), True))
    flo.append(rect(t, 520, b - 30, 240, 40, t.c('stone2'), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=[(b, well)], floorY=960)


def river_bank(t):
    sky_, back, _ = ext_base(t, 620, 'mountains' if t.detail else 'trees')
    back += [rect(t, -10, 560, W + 20, 70, t.c('tree2'), True)]
    flo = water_band(t, 620, 790, 14)
    flo += ground(t, 780, 'earth', 3)
    flo += reeds(t, 160, 800, 1.2, 14) + reeds(t, 1700, 800, 1.1, 12)
    flo.append(line(t, 1300, 640, 1300, 820, t.c('wood'), 8))
    flo.append(path(t, 'M1080 700 L1420 700 Q1400 745 1360 750 L1130 750 Q1090 740 1080 700 Z', t.c('wood'), True))
    return S(sky=sky_, back=back, floor=flo, floorY=980)


def ferry_landing(t):
    sky_, back, _ = ext_base(t, 620, 'mountains' if t.detail else 'trees')
    back += [rect(t, -10, 560, W + 20, 70, t.c('tree2'), True)]
    flo = water_band(t, 620, 800, 12) + ground(t, 790, 'earth', 3)
    mid = hut(t, 120, 800, 380, 170)
    flo.append(rect(t, 760, 700, 640, 26, t.c('wood2'), True))
    for k in range(6):
        flo.append(rect(t, 780 + k * 120, 726, 14, 90, t.c('wood'), True))
    flo.append(path(t, 'M1460 690 L1840 690 Q1820 740 1780 748 L1500 748 Q1470 740 1460 690 Z', t.c('wood'), True))
    flo.append(line(t, 1640, 520, 1700, 760, t.c('wood2'), 6))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=990)


def bamboo_bridge(t):
    sky_, back, gr = ext_base(t, HB - 60, 'trees', 'grass')
    flo = gr
    flo += water_band(t, 800, 940, 8)
    flo.append(rect(t, 300, 760, 1320, 24, t.c('bamboo2'), True))
    for k in range(12):
        flo.append(line(t, 320 + k * 110, 784, 330 + k * 110, 900, t.c('bamboo2'), 8))
    flo.append(line(t, 300, 700, 1620, 700, t.c('bamboo2'), 7))
    flo += banana(t, 120, 800, 1.0) + banana(t, 1800, 800, 1.0) + reeds(t, 1650, 960, 1.0, 8)
    return S(sky=sky_, back=back, floor=flo, floorY=760)


def pond(t):
    sky_, back, gr = ext_base(t, HB - 40, 'trees', 'grass')
    mid = house_tile(t, 1200, HB - 50, 600, 180, 2) if not t.detail else hut(t, 1300, HB - 40, 380, 160)
    mid += banana(t, 1120, HB - 40, 1.0)
    flo = gr
    flo.append(ell(t, 820, 880, 760, 150, t.c('water'), True))
    for x, y in [(420, 860), (560, 900), (900, 840), (1180, 900), (700, 950)]:
        flo.append(ell(t, x, y, 50, 18, t.c('leaf'), True, sw=t.lw * 0.6))
    flo.append(rect(t, 1380, 800, 260, 26, t.c('wood2'), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=1000)


def rice_field(t):
    sky_, back, _ = ext_base(t, 620, 'mountains' if t.detail else 'hills')
    flo = [rect(t, -10, 600, W + 20, H - 590, t.c('field'), True)]
    for k in range(9):
        y = 600 + (H - 600) * (k / 9) ** 1.4
        flo.append(line(t, 0, y, W, y, t.c('field2'), 4))
    for k in range(-6, 8):
        flo.append(line(t, 960 + k * 60, 600, 960 + k * 320, H, t.c('field2'), 3, extra=op(0.6)))
    mid = hut(t, 1500, 640, 240, 120)
    sc = [line(t, 420, 780, 420, 560, t.c('wood'), 7), line(t, 360, 620, 480, 620, t.c('wood'), 7), circ(t, 420, 540, 30, t.c('paper'), True), poly(t, [(370, 520), (420, 470), (470, 520)], t.c('thatch'), True)]
    return S(sky=sky_, back=back, mid=mid, floor=flo + sc, floorY=980)


def bamboo_grove(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'earth')
    mid = []
    for k in range(14):
        mid += bamboo(t, 40 + k * 140, HB, 1.1, 5)
    flo = gr + [path(t, 'M860 %s L1060 %s L1400 %s L520 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    for k in range(18):
        x, y = t.rng.uniform(100, 1800), t.rng.uniform(HB + 20, H - 20)
        flo.append(ell(t, x, y, 16, 5, t.c('thatch2'), False))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=950)


def old_forest(t):
    sky_ = sky(t, HB)
    back = [rect(t, -10, 0, W + 20, HB, t.c('tree2'), False)]
    for k in range(9):
        x = 60 + k * 230
        back.append(rect(t, x, 0, 70 + (k % 3) * 20, HB, shade(t.c('trunk'), 0.15), True))
    mid = []
    for x, w in [(200, 150), (820, 120), (1500, 170)]:
        mid.append(rect(t, x, 0, w, HB + 40, t.c('trunk'), True))
        mid.append(path(t, 'M%s %s q -60 30 -100 60 M%s %s q 60 30 100 60' % (f(x), f(HB + 30), f(x + w), f(HB + 30)), 'none', True))
    for k in range(6):
        mid.append(spath('M%s 0 q 30 200 -10 420' % f(300 + k * 260), t.c('leaf'), 6))
    flo = ground(t, HB - 10, 'earth', 4)
    flo += [path(t, 'M860 %s L1060 %s L1300 %s L620 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    flo += bush(t, 120, H - 40, 1.6) + bush(t, 1800, H - 30, 1.7)
    if t.night or t.detail:
        flo.append(rect(t, -10, HB - 80, W + 20, 140, '#dfe6ea', False, extra=op(0.12)))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=950)


def mountain_village(t):
    sky_ = sky(t, 600)
    back = mountains(t, 600)
    flo = [path(t, 'M-20 640 Q 600 540 1940 620 L1940 1080 L-20 1080 Z', t.c('field'), True)]
    for k in range(6):
        y = 660 + k * 60
        flo.append(spath('M-20 %s Q 600 %s 1940 %s' % (f(y), f(y - 80), f(y + 10)), t.c('field2'), 4))
    mid = []
    for x, b, s in [(160, 640, 0.45), (520, 610, 0.4), (1300, 620, 0.42), (1620, 650, 0.5)]:
        mid.append('<g transform="translate(%s %s) scale(%s)">%s</g>' % (f(x), f(b), f(s), ''.join(stilt_house(t, 0, 0, 620))))
    flo += [path(t, 'M-20 840 Q 900 760 1940 860 L1940 1080 L-20 1080 Z', t.c('earth'), True)]
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=990)


def stream(t):
    sky_, back, gr = ext_base(t, HB - 60, 'mountains' if t.detail else 'trees', 'grass')
    flo = gr
    flo.append(path(t, 'M820 %s L1100 %s Q1200 860 1500 %s L420 %s Q760 860 820 %s Z' % (HB - 70, HB - 70, H, H, HB - 70), t.c('water'), True))
    for x, y, s in [(700, 900, 1.0), (1240, 820, 0.8), (980, 1000, 1.1), (560, 1040, 0.9), (1400, 1000, 0.9)]:
        flo += rock(t, x, y, s)
    for k in range(10):
        x = t.rng.uniform(760, 1200)
        y = t.rng.uniform(HB, H - 30)
        flo.append(line(t, x, y, x + 50, y, '#e8f1f3', 3, extra=op(0.7)))
    mid = pine(t, 220, HB - 60, 1.4) + pine(t, 1700, HB - 60, 1.5) + bush(t, 420, HB - 50, 1.2)
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=980)


def forest_path(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'earth')
    back += [rect(t, -10, HB - 300, W + 20, 300, t.c('tree2'), False)]
    mid = []
    for x, s in [(150, 1.4), (420, 1.0), (1500, 1.1), (1780, 1.5)]:
        mid += round_tree(t, x, HB, s) if t.detail else poly_tree(t, x, HB, s * 0.8, x > 900)
    flo = gr + [path(t, 'M900 %s Q 1000 900 760 %s L1260 %s Q 1180 860 1020 %s Z' % (HB - 8, H, H, HB - 8), t.c('dirt'), True, sw=t.lw * 0.6)]
    for k in range(5):
        y = HB + 60 + k * 60
        flo.append(spath('M%s %s q 120 -20 240 10' % (f(800 + k * 20), f(y)), t.c('trunk'), 8))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=960)


def cave(t):
    sky_ = sky(t, HB)
    back = [path(t, 'M-20 %s L-20 120 Q 400 -40 900 60 Q 1500 -60 1940 140 L1940 %s Z' % (HB + 20, HB + 20), t.c('rock'), True)]
    for k in range(10):
        x = 80 + k * 190
        back.append(line(t, x, 100 + (k % 3) * 40, x + 40, 400 + (k % 2) * 80, t.c('stone2'), 3, extra=op(0.7)))
    back.append(path(t, 'M640 %s Q 640 260 960 220 Q 1280 260 1280 %s Z' % (HB + 20, HB + 20), '#08090c', True))
    for k in range(7):
        x = 700 + k * 85
        back.append(poly(t, [(x, 250 + (k % 2) * 20), (x + 30, 250), (x + 15, 330 + (k % 3) * 30)], t.c('rock'), True, sw=t.lw * 0.6))
    for k in range(6):
        back.append(spath('M%s 60 q 20 120 -10 260' % f(300 + k * 260), t.c('leaf'), 6))
    flo = ground(t, HB + 10, 'stone', 4) + rock(t, 360, H - 40, 1.6) + rock(t, 1620, H - 30, 1.4)
    return S(sky=sky_, back=back, floor=flo, floorY=980)


def village_temple(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'stone')
    mid = []
    mid += banyan(t, 230, HB, 0.55)
    mid.append(rect(t, 520, HB - 300, 880, 300, mix(t.c('wood'), t.c('red'), 0.2), True))
    for k in range(7):
        mid.append(rect(t, 540 + k * 136, HB - 300, 30, 300, t.c('post'), True))
    for k in range(3):
        mid += lit(t, 650 + k * 260, HB - 230, 120, 220)
    mid += roof_tiles(t, 440, HB - 560, 1040, 270, t.c('roof'), 80, curve=True)
    mid.append(rect(t, 480, HB - 20, 960, 30, t.c('stone2'), True))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=950)


def pagoda_gate(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'stone')
    back += roof_tiles(t, 760, HB - 620, 400, 120, t.c('roof'), 40, curve=True)
    back.append(rect(t, 820, HB - 500, 280, 140, t.c('wall'), True))
    mid = []
    for x, w, h in [(560, 220, 330), (840, 240, 420), (1140, 220, 330)]:
        mid.append(rect(t, x, HB - h, w, h, t.c('wall'), True))
        mid.append(path(t, 'M%s %s L%s %s Q %s %s %s %s L%s %s Z' % (f(x + 40), f(HB), f(x + 40), f(HB - h * 0.5), f(x + w / 2), f(HB - h * 0.75), f(x + w - 40), f(HB - h * 0.5), f(x + w - 40), f(HB)), '#0b0d10', True))
        mid += roof_tiles(t, x - 20, HB - h - 90, w + 40, 90, t.c('roof'), 20, curve=True)
    mid += round_tree(t, 330, HB, 0.9) if t.detail else bonsai_tree(t, 330, HB, 1.2)
    flo = gr
    for k in range(3):
        flo.append(rect(t, 760 - k * 40, HB + k * 34, 400 + k * 80, 34, t.c('stone2'), True))
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=980)


def market(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'earth')
    mid = []
    occ = []
    for x in (120, 760, 1400):
        mid.append(rect(t, x, HB - 260, 20, 260, t.c('post'), True))
        mid.append(rect(t, x + 400, HB - 260, 20, 260, t.c('post'), True))
        mid += thatch_roof(t, x - 20, HB - 380, 460, 140, t.c('thatch'), t.c('thatch2'), horns=False)
        occ.append((HB, [rect(t, x + 20, HB - 110, 380, 26, t.c('wood'), True), rect(t, x + 30, HB - 84, 360, 84, t.c('wood2'), True)]))
    flo = gr
    for x, c in [(300, 'grass'), (520, 'red'), (980, 'gold'), (1200, 'leaf'), (1600, 'water')]:
        flo.append(ell(t, x, HB + 90, 80, 30, t.c('woven'), True))
        flo.append(ell(t, x, HB + 76, 60, 18, t.c(c), True, sw=t.lw * 0.6))
    return S(sky=sky_, back=back, mid=mid, floor=flo, occ=occ, floorY=980)


def abandoned_house(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'grass')
    mid = []
    x, b, w, h = 520, HB, 880, 250
    mid.append(poly(t, [(x, b - h), (x + w, b - h + 20), (x + w + 8, b), (x - 8, b)], mix(t.c('wall'), t.c('stone2'), 0.4), True))
    mid.append(poly(t, [(x - 40, b - h), (x + w * 0.3, b - h - 120), (x + w * 0.5, b - h - 60), (x + w * 0.62, b - h - 130), (x + w + 40, b - h + 20)], shade(t.c('roof'), 0.2), True))
    mid.append(poly(t, [(x + w * 0.42, b - h - 70), (x + w * 0.5, b - h - 60), (x + w * 0.46, b - h + 10)], t.raw('night_sky') if t.night else t.raw('sky'), True))
    mid.append(rect(t, x + 120, b - 200, 130, 190, '#0b0c0f', True))
    mid.append(poly(t, [(x + 250, b - 200), (x + 300, b - 180), (x + 300, b - 20), (x + 250, b - 10)], t.c('wood'), True))
    mid.append(rect(t, x + 520, b - 190, 160, 100, '#0b0c0f', True))
    mid.append(line(t, x + 520, b - 190, x + 680, b - 90, t.c('wood'), 6))
    mid += [pline(t, [(1560, b), (1580, b - 200), (1520, b - 330)], t.c('trunk'), 16), pline(t, [(1575, b - 220), (1660, b - 330)], t.c('trunk'), 10), pline(t, [(1540, b - 290), (1470, b - 360)], t.c('trunk'), 8)]
    for k in range(14):
        mid.append(line(t, x - 20 + k * 70, b, x - 30 + k * 72, b - t.rng.uniform(40, 110), t.c('grass2'), 4))
    return S(sky=sky_, back=back, mid=mid, floor=gr, floorY=940)


def hill_road(t):
    sky_ = sky(t, 520)
    back = mountains(t, 640) if t.detail else hills(t, 640)
    flo = [path(t, 'M-20 760 L1940 600 L1940 1080 L-20 1080 Z', t.c('rock'), True)]
    flo.append(path(t, 'M-20 820 L1940 660 L1940 760 L-20 960 Z', t.c('dirt'), True))
    for k in range(6):
        flo.append(rect(t, 200 + k * 300, 830 - k * 26, 14, 50, t.c('cloth'), True, sw=t.lw * 0.5))
    mid = pine(t, 1600, 640, 1.2) + pine(t, 1780, 620, 1.0)
    return S(sky=sky_, back=back, mid=mid, floor=flo, floorY=900)


SCENES = {
    'main_room': main_room, 'kitchen': kitchen, 'bedroom': bedroom, 'stilt_house_inside': stilt_house_inside, 'storeroom': storeroom,
    'funeral_room': funeral_room, 'temple_hall': temple_hall, 'shrine_inside': shrine_inside, 'abandoned_house_inside': abandoned_house_inside,
    'roadside_inn': roadside_inn, 'front_yard': front_yard, 'village_gate': village_gate, 'village_lane': village_lane, 'banyan_tree': banyan_tree,
    'abandoned_shrine': abandoned_shrine, 'graveyard': graveyard, 'lonely_grave': lonely_grave, 'village_well': village_well, 'river_bank': river_bank,
    'ferry_landing': ferry_landing, 'bamboo_bridge': bamboo_bridge, 'pond': pond, 'rice_field': rice_field, 'bamboo_grove': bamboo_grove,
    'old_forest': old_forest, 'mountain_village': mountain_village, 'stream': stream, 'forest_path': forest_path, 'cave': cave,
    'village_temple': village_temple, 'pagoda_gate': pagoda_gate, 'market': market, 'abandoned_house': abandoned_house, 'hill_road': hill_road,
}


DECOR = {
    'front_yard': ('ext', HB + 20), 'village_lane': ('ext', HB + 10), 'banyan_tree': ('ext', HB + 40), 'abandoned_shrine': ('ext', HB + 10), 'graveyard': ('ext', HB - 20),
    'village_well': ('ext', HB + 20), 'bamboo_grove': ('ext', HB + 10), 'forest_path': ('ext', HB + 10), 'village_temple': ('ext', HB + 10), 'pagoda_gate': ('ext', HB + 10),
    'market': ('ext', HB + 10), 'abandoned_house': ('ext', HB + 10), 'roadside_inn': ('ext', HB + 10), 'village_gate': ('ext', HB + 10), 'lonely_grave': ('ext', HB - 40),
    'main_room': ('int', IB + 70), 'kitchen': ('int', IB + 60), 'bedroom': ('int', IB + 60), 'stilt_house_inside': ('int', IB + 60), 'storeroom': ('int', IB + 60),
    'shrine_inside': ('int', IB + 60), 'abandoned_house_inside': ('int', IB + 60), 'temple_hall': ('int', IB + 60),
}


def decor(t, kind, y):
    out = []
    xs = [t.rng.uniform(80, 360), t.rng.uniform(1560, 1840)]
    for x in xs:
        r = t.rng.randrange(4)
        if kind == 'ext':
            out += [bush(t, x, y, t.rng.uniform(0.8, 1.2)), rock(t, x, y + 10, t.rng.uniform(0.5, 0.8)), reeds(t, x, y, 0.9, 7), jar(t, x, y + 10, 0.5)][r]
        else:
            out += [jar(t, x, y, t.rng.uniform(0.5, 0.8)), jar(t, x, y, 0.45, t.c('woven')), shelf(t, x - 120, y - 330, 240, 3), [rect(t, x - 60, y - 70, 120, 70, t.c('wood2'), True), rect(t, x - 70, y - 80, 140, 16, t.c('wood'), True)]][r]
    return out


def mirror(items):
    return ['<g transform="translate(1920 0) scale(-1 1)">%s</g>' % ''.join(items)] if items else []


def build(key, style, night=False, v=0):
    t = T(style, night, seed=sum(map(ord, key)) + v * 101, v=v)
    sc = SCENES[key](t)
    if v and key in DECOR:
        sc['floor'] += decor(t, *DECOR[key])
    lights = sc['lights']
    flip = v in (1, 3)
    if flip:
        for k in ('back', 'mid', 'floor', 'fg'):
            sc[k] = mirror(sc[k])
        lights = [dict(l, x=W - l['x']) for l in lights]
    occ = ''.join('<g data-occ="%d">%s</g>' % (y, ''.join(mirror(items) if flip else items)) for y, items in sc.get('occ', []))
    return svg(t, sc['sky'], sc['back'], sc['mid'], sc['floor'], sc['fg'], occ=occ), sc['floorY'], lights
