from interior import *
from scenes import HB, IB, ext_base

INT = dict(hz=IB, fy=950)
EXT = dict(hz=HB, fy=930)


def P(key, kind, slots, desc, build, ax, ay, native, spots=(), lights=(), name=None, size=1.0, front=False):
    return dict(key=key, kind=kind, slots=list(slots), desc=desc, build=build, ax=ax, ay=ay, native=native, spots=list(spots), lights=list(lights), name=name or key.replace('_', ' '), size=size, front=front)


def S(key, kind, x, y, label):
    return dict(key=key, kind=kind, x=x, y=y, label=label)


def well(t):
    x, b = 1250, HB + 180
    out = [rect(t, x - 160, b - 140, 320, 140, t.c('stone'), True)]
    for k in range(3):
        out.append(line(t, x - 160, b - 140 + k * 46, x + 160, b - 140 + k * 46, t.c('stone2'), 3))
    out += [ell(t, x, b - 140, 160, 26, t.c('dark'), True), rect(t, x - 150, b - 330, 14, 190, t.c('wood'), True), rect(t, x + 136, b - 330, 14, 190, t.c('wood'), True), rect(t, x - 170, b - 340, 340, 18, t.c('wood'), True), line(t, x, b - 322, x, b - 230, t.line, 2), rect(t, x - 26, b - 230, 52, 44, t.c('wood2'), True)]
    return out


def shrine_small(t):
    out = [rect(t, 780, HB - 330, 360, 330, mix(t.c('stone'), t.c('wall'), 0.4), True), rect(t, 870, HB - 240, 180, 170, t.c('dark'), True)]
    out += roof_tiles(t, 740, HB - 440, 440, 120, mix(t.c('roof'), t.c('grass2'), 0.35), 30, curve=True)
    out += [rect(t, 760, HB - 60, 400, 60, t.c('stone2'), True)] + incense(t, 960, HB - 60, 2)
    return out


def gate(t):
    out = [rect(t, 640, HB - 420, 640, 420, t.c('wall'), True), path(t, 'M760 %s L760 %s Q960 %s 1160 %s L1160 %s Z' % (HB, HB - 230, HB - 370, HB - 230, HB), t.c('dark') if not t.night else '#06090f', True)]
    out += roof_tiles(t, 600, HB - 560, 720, 150, t.c('roof'), 40, curve=True)
    return out


def temple_front(t):
    out = [rect(t, 520, HB - 300, 880, 300, mix(t.c('wood'), t.c('red'), 0.2), True)]
    for k in range(7):
        out.append(rect(t, 540 + k * 136, HB - 300, 30, 300, t.c('post'), True))
    for k in range(3):
        out += lit(t, 650 + k * 260, HB - 230, 120, 220)
    out += roof_tiles(t, 440, HB - 560, 1040, 270, t.c('roof'), 80, curve=True)
    out.append(rect(t, 480, HB - 20, 960, 30, t.c('stone2'), True))
    return out


def stall(t):
    x = 760
    out = [rect(t, x, HB - 260, 20, 260, t.c('post'), True), rect(t, x + 400, HB - 260, 20, 260, t.c('post'), True)]
    out += thatch_roof(t, x - 20, HB - 380, 460, 140, t.c('thatch'), t.c('thatch2'), horns=False)
    out.append(rect(t, x + 20, HB - 110, 380, 26, t.c('wood'), True))
    return out


def ruin_house(t):
    x, b, w, h = 520, HB, 880, 250
    out = [poly(t, [(x, b - h), (x + w, b - h + 20), (x + w + 8, b), (x - 8, b)], mix(t.c('wall'), t.c('stone2'), 0.4), True)]
    out.append(poly(t, [(x - 40, b - h), (x + w * 0.3, b - h - 120), (x + w * 0.5, b - h - 60), (x + w * 0.62, b - h - 130), (x + w + 40, b - h + 20)], shade(t.c('roof'), 0.2), True))
    out.append(rect(t, x + 120, b - 200, 130, 190, '#0b0c0f', True))
    out.append(poly(t, [(x + 250, b - 200), (x + 300, b - 180), (x + 300, b - 20), (x + 250, b - 10)], t.c('wood'), True))
    out.append(rect(t, x + 520, b - 190, 160, 100, '#0b0c0f', True))
    out.append(line(t, x + 520, b - 190, x + 680, b - 90, t.c('wood'), 6))
    return out


def dead_tree(t):
    b = HB
    return [pline(t, [(1560, b), (1580, b - 200), (1520, b - 330)], t.c('trunk'), 16), pline(t, [(1575, b - 220), (1660, b - 330)], t.c('trunk'), 10), pline(t, [(1540, b - 290), (1470, b - 360)], t.c('trunk'), 8)]


def hearth_pit(t):
    return [rect(t, 700, IB + 120, 520, 110, t.c('dirt'), True)] + stove(t, 960, IB + 200)


def bed_frame(t):
    return bed(t, 160, IB + 190, 600)


WALL = ['wall_left', 'wall_right']
BACK = ['back_center', 'back_left', 'back_right']
MIDI = ['mid_left', 'mid_right', 'mid_center']
EDGE = ['edge_left', 'edge_right']
FAR = ['far_center', 'far_left', 'far_right']
CORNER = ['corner_left', 'corner_right']
MIDE = ['mid_left', 'mid_right', 'mid_center']

PIECES = [
    P('altar', 'furniture', BACK, 'ancestor altar table with a portrait, candles and an incense bowl', lambda t: altar(t, 760, IB + 60, 420), 970, IB + 60, INT,
      [S('altar_front', 'stand', 970, IB + 130, 'in front of the altar (pray, kneel, offer incense)'), S('beside_altar_left', 'stand', 690, IB + 100, 'beside the altar, left'), S('beside_altar_right', 'stand', 1250, IB + 100, 'beside the altar, right'), S('altar_top', 'surface', 970, IB - 140, 'on the altar'), S('incense_source', 'smoke', 970, IB - 160, 'incense on the altar')],
      [dict(x=820, y=IB - 220, kind='candle'), dict(x=1120, y=IB - 220, kind='candle')]),
    P('door_panels', 'fixture', ['door_right', 'door_left'], 'tall wooden door panels in the back wall', lambda t: door_panels(t, 1360, IB), 1566, IB, INT, [S('door', 'door', 1566, IB + 50, 'at the doors')]),
    P('window', 'wall', WALL, 'small window with wooden bars in the wall', lambda t: window(t, 1560, 260), 1620, 370, INT, [S('window', 'stand', 1620, IB + 70, 'by the window')]),
    P('red_textile', 'wall', WALL, 'red woven cloth hanging on the wall', lambda t: textile(t, 120, 260), 155, 470, INT),
    P('shelf', 'wall', WALL, 'wooden shelf with jars on the wall', lambda t: shelf(t, 1250, 330, 380, 5), 1440, 346, INT),
    P('bench', 'furniture', MIDI + BACK, 'long low wooden bench', lambda t: bench(t, 220, IB + 200, 380), 410, IB + 200, INT, [S('bench', 'sit', 410, IB + 215, 'on the bench')]),
    P('tea_table', 'furniture', MIDI, 'low tea table with a teapot', lambda t: tea_table(t, 1100, IB + 230), 1210, IB + 230, INT, [S('tea_table', 'surface', 1210, IB + 120, 'on the tea table'), S('beside_table', 'stand', 1400, IB + 250, 'beside the tea table')]),
    P('bed', 'furniture', MIDI + BACK, 'wooden bed with a mosquito net', bed_frame, 460, IB + 190, INT, [S('bed', 'lie', 470, IB + 70, 'lying on the bed'), S('bed_edge', 'sit', 560, IB + 200, 'on the edge of the bed'), S('beside_bed', 'stand', 860, IB + 210, 'beside the bed')]),
    P('daybed', 'furniture', MIDI + BACK, 'wide plank daybed (phan go)', lambda t: bench(t, 600, IB + 220, 720, 120), 960, IB + 220, INT, [S('daybed', 'lie', 960, IB + 100, 'lying on the plank daybed'), S('daybed_edge', 'sit', 960, IB + 235, 'on the edge of the daybed')]),
    P('hearth', 'furniture', MIDI, 'cooking hearth with three stones, fire and a pot', lambda t: stove(t, 560, IB + 170), 560, IB + 170, INT, [S('hearth', 'stand', 560, IB + 230, 'at the hearth'), S('hearth_sit', 'sit', 760, IB + 240, 'sitting by the fire'), S('hearth_top', 'surface', 560, IB + 40, 'on the fire'), S('hearth_smoke', 'smoke', 560, IB + 60, 'smoke of the fire')], [dict(x=560, y=IB + 90, kind='fire')]),
    P('hearth_pit', 'furniture', ['mid_center'], 'square fire pit in the plank floor of a stilt house', hearth_pit, 960, IB + 230, INT, [S('hearth', 'stand', 960, IB + 260, 'at the fire pit'), S('hearth_left', 'sit', 640, IB + 220, 'sitting left of the fire'), S('hearth_right', 'sit', 1280, IB + 220, 'sitting right of the fire'), S('hearth_top', 'surface', 960, IB + 90, 'on the fire'), S('hearth_smoke', 'smoke', 960, IB + 100, 'smoke of the fire')], [dict(x=960, y=IB + 120, kind='fire')]),
    P('coffin', 'furniture', ['mid_center', 'back_center'], 'dark wooden coffin on two trestles', lambda t: coffin(t, 680, IB + 230, 560), 960, IB + 230, INT, [S('coffin', 'surface', 960, IB + 10, 'on the coffin'), S('coffin_left', 'stand', 560, IB + 250, 'left of the coffin'), S('coffin_right', 'stand', 1360, IB + 250, 'right of the coffin'), S('behind_coffin', 'stand', 960, IB + 205, 'behind the coffin')], front=True),
    P('buddha', 'furniture', ['back_center'], 'golden statue on a red altar', lambda t: buddha(t, 960, IB - 20, 1.0), 960, IB - 20, INT, [S('statue_front', 'stand', 960, IB + 180, 'in front of the statue (pray, kneel)')]),
    P('bell', 'wall', WALL, 'temple bell hanging from a frame', lambda t: bell(t, 330, 300, 1.2), 330, 420, INT),
    P('curtain', 'wall', WALL, 'torn curtain', lambda t: curtain(t, 1500, 200, 200, 380), 1600, 600, INT),
    P('broken_chair', 'furniture', MIDI, 'broken wooden chair', lambda t: broken_chair(t, 260, IB + 200), 350, IB + 200, INT),
    P('jar', 'scenery', MIDI + EDGE + MIDE, 'big clay jar', lambda t: jar(t, 400, IB + 160, 1.0), 400, IB + 160, INT),
    P('incense_bowl', 'scenery', MIDI, 'incense bowl with burning sticks', lambda t: incense(t, 400, IB + 160, 3), 400, IB + 160, INT, [S('incense_smoke', 'smoke', 400, IB + 60, 'incense smoke')]),
    P('house_tile', 'building', FAR, 'long one-storey village house with a tiled roof and three doors', lambda t: house_tile(t, 520, HB, 880, 250), 960, HB, EXT, [S('house_door', 'door', 960, HB + 20, 'at the door of the house')], size=1.0),
    P('stilt_house', 'building', FAR, 'stilt house with a thatched roof, crossed gable horns and a ladder', lambda t: stilt_house(t, 600, HB, 720), 960, HB, EXT, [S('ladder', 'stand', 1180, HB + 30, 'at the foot of the ladder')]),
    P('hut', 'building', FAR, 'small woven hut with a thatched roof', lambda t: hut(t, 40, HB - 20, 380, 170), 230, HB - 20, EXT, [S('hut_door', 'door', 230, HB, 'at the hut')]),
    P('shrine', 'building', FAR, 'small old stone shrine with a curved roof', shrine_small, 960, HB, EXT, [S('shrine_door', 'door', 960, HB + 20, 'at the shrine'), S('shrine_step', 'surface', 960, HB - 60, 'on the shrine step')]),
    P('village_gate', 'building', ['far_center'], 'village gate with an arch and a tiled roof', gate, 960, HB, EXT, [S('gate', 'door', 960, HB + 10, 'in the gateway')]),
    P('temple', 'building', ['far_center'], 'village temple front with red posts and a big curved roof', temple_front, 960, HB, EXT, [S('temple_door', 'door', 960, HB + 10, 'at the temple doors')]),
    P('market_stall', 'building', FAR, 'market stall with a thatched roof and a counter', stall, 970, HB, EXT, [S('stall', 'stand', 970, HB + 40, 'at the stall'), S('stall_top', 'surface', 970, HB - 110, 'on the counter')]),
    P('ruined_house', 'building', FAR, 'abandoned ruined house with a broken roof', ruin_house, 960, HB, EXT, [S('ruin_door', 'door', 705, HB + 10, 'at the broken door')]),
    P('well', 'scenery', MIDE, 'stone village well with a wooden frame', well, 1250, HB + 180, EXT, [S('well', 'stand', 1000, HB + 200, 'beside the well'), S('well_top', 'surface', 1250, HB + 40, 'on the rim of the well')]),
    P('poly_tree', 'scenery', CORNER + ['far_left', 'far_right'], 'simple dark green tree', lambda t: poly_tree(t, 960, HB, 1.0), 960, HB, EXT),
    P('round_tree', 'scenery', CORNER + ['far_left', 'far_right'], 'round leafy tree', lambda t: round_tree(t, 960, HB, 1.0), 960, HB, EXT),
    P('bonsai_tree', 'scenery', CORNER + ['far_left', 'far_right', 'mid_left', 'mid_right'], 'twisted pine-like garden tree', lambda t: bonsai_tree(t, 960, HB, 1.0), 960, HB, EXT),
    P('banyan', 'scenery', ['far_center', 'far_left', 'far_right'], 'huge old banyan tree with hanging roots', lambda t: banyan(t, 960, HB, 0.9), 960, HB, EXT, [S('tree_root', 'stand', 960, HB + 80, 'under the banyan tree')]),
    P('palm', 'scenery', CORNER + ['far_left', 'far_right'], 'palm tree', lambda t: palm(t, 960, HB, 1.0), 960, HB, EXT),
    P('bamboo', 'scenery', CORNER + ['far_left', 'far_right', 'edge_left', 'edge_right'], 'clump of bamboo', lambda t: bamboo(t, 960, HB, 1.0, 7), 960, HB, EXT),
    P('banana', 'scenery', CORNER + ['far_left', 'far_right', 'mid_left', 'mid_right'], 'banana plant', lambda t: banana(t, 960, HB, 1.0), 960, HB, EXT),
    P('pine', 'scenery', CORNER + ['far_left', 'far_right'], 'tall pine tree', lambda t: pine(t, 960, HB, 1.2), 960, HB, EXT),
    P('dead_tree', 'scenery', CORNER + ['far_left', 'far_right'], 'bare dead tree', dead_tree, 1560, HB, EXT),
    P('bush', 'scenery', MIDE + EDGE + ['far_left', 'far_right'], 'round bush', lambda t: bush(t, 960, HB + 100, 1.5), 960, HB + 100, EXT),
    P('reeds', 'scenery', EDGE + MIDE, 'tall reeds', lambda t: reeds(t, 960, HB + 100, 1.0, 9), 960, HB + 100, EXT),
    P('rock', 'scenery', MIDE + EDGE, 'big rock', lambda t: rock(t, 960, HB + 100, 1.0), 960, HB + 100, EXT, [S('rock', 'sit', 960, HB + 110, 'sitting on the rock')]),
    P('grave', 'scenery', MIDE + ['far_left', 'far_right', 'far_center'], 'earth grave mound with a small stone and incense', lambda t: grave(t, 960, HB + 150, 1.4), 960, HB + 150, EXT, [S('grave_front', 'stand', 900, HB + 200, 'in front of the grave'), S('grave_smoke', 'smoke', 1030, HB + 90, 'incense at the grave')]),
    P('tombstone', 'scenery', MIDE + EDGE, 'stone tombstone', lambda t: tombstone(t, 960, HB + 150, 1.2), 960, HB + 150, EXT),
    P('low_wall', 'scenery', ['far_center'], 'low stone wall', lambda t: low_wall(t, 440, 1480, HB - 10, 70), 960, HB - 10, EXT),
    P('fence', 'scenery', ['far_center'], 'bamboo fence', lambda t: fence(t, 300, 1620, HB - 5, 90), 960, HB - 5, EXT),
    P('jar_yard', 'scenery', MIDE + EDGE, 'clay jar in the yard', lambda t: jar(t, 960, HB + 120, 0.6), 960, HB + 120, EXT),
]


def base_room(t, kind):
    if kind == 'woven':
        back, flo = room(t, IB, woven_wall=True)
    elif kind == 'red':
        back, flo = room(t, IB, wall=mix(t.c('wood'), t.c('red'), 0.25), woven_wall=False)
    elif kind == 'stone':
        back, flo = room(t, IB, wall=mix(t.c('interior_wall'), t.c('stone'), 0.5), woven_wall=False)
    else:
        back, flo = room(t, IB, woven_wall=False)
    return dict(sky=[], back=back, floor=flo, horizonY=IB, floorY=950, interior=True)


def base_ext(t, far, ground_kind, hb=HB):
    sky_, back, gr = ext_base(t, hb, far, ground_kind)
    return dict(sky=sky_, back=back, floor=gr, horizonY=hb, floorY=930, interior=False)


def base_river(t):
    sky_, back, _ = ext_base(t, 620, 'mountains' if t.detail else 'trees')
    back += [rect(t, -10, 560, W + 20, 70, t.c('tree2'), True)]
    flo = water_band(t, 620, 790, 14) + ground(t, 780, 'earth', 3)
    return dict(sky=sky_, back=back, floor=flo, horizonY=790, floorY=980, interior=False)


def base_field(t):
    sky_, back, _ = ext_base(t, 620, 'mountains' if t.detail else 'hills')
    flo = [rect(t, -10, 600, W + 20, H - 590, t.c('field'), True)]
    for k in range(9):
        y = 600 + (H - 600) * (k / 9) ** 1.4
        flo.append(line(t, 0, y, W, y, t.c('field2'), 4))
    return dict(sky=sky_, back=back, floor=flo, horizonY=620, floorY=980, interior=False)


def base_forest(t):
    sky_ = sky(t, HB)
    back = [rect(t, -10, 0, W + 20, HB, t.c('tree2'), False)]
    for k in range(9):
        x = 60 + k * 230
        back.append(rect(t, x, 0, 70 + (k % 3) * 20, HB, shade(t.c('trunk'), 0.15), True))
    flo = ground(t, HB - 10, 'earth', 4) + [path(t, 'M860 %s L1060 %s L1300 %s L620 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    return dict(sky=sky_, back=back, floor=flo, horizonY=HB, floorY=950, interior=False)


def base_path(t):
    sky_, back, gr = ext_base(t, HB, 'trees', 'earth')
    gr = gr + [path(t, 'M820 %s L1100 %s L1500 %s L420 %s Z' % (HB - 8, HB - 8, H, H), t.c('dirt'), True, sw=t.lw * 0.6)]
    return dict(sky=sky_, back=back, floor=gr, horizonY=HB, floorY=930, interior=False)


BASES = [
    ('room_plain', 'interior', 'plain room: beige wall with a dark beam on top and a plank floor', lambda t: base_room(t, 'plain')),
    ('room_woven', 'interior', 'stilt house room: woven bamboo walls, wooden posts and beams, plank floor', lambda t: base_room(t, 'woven')),
    ('room_temple', 'interior', 'temple hall: dark red wooden wall and floor', lambda t: base_room(t, 'red')),
    ('room_stone', 'interior', 'old stone room or shrine inside', lambda t: base_room(t, 'stone')),
    ('yard_brick', 'exterior', 'yard of brick tiles under the sky with trees far away', lambda t: base_ext(t, 'trees', 'brick')),
    ('yard_earth', 'exterior', 'dirt yard or ground under the sky with trees far away', lambda t: base_ext(t, 'trees', 'earth')),
    ('mountain_ground', 'exterior', 'earth ground in front of layered mountains', lambda t: base_ext(t, 'mountains', 'earth')),
    ('hill_grass', 'exterior', 'grass in front of rolling hills', lambda t: base_ext(t, 'hills', 'grass')),
    ('stone_yard', 'exterior', 'stone paved yard (temple, pagoda)', lambda t: base_ext(t, 'trees', 'stone')),
    ('riverside', 'exterior', 'river bank: water across the middle, earth bank in front', base_river),
    ('rice_field', 'exterior', 'open rice field to the horizon', base_field),
    ('forest', 'exterior', 'dark forest with tree trunks and a path', base_forest),
    ('village_path', 'exterior', 'dirt path going away between trees', base_path),
]


from refkit import *

PIECES += [
    P('goods_shelves', 'furniture', BACK, 'grocery shop shelves full of colourful goods', lambda t: goods_shelves(t, 120, 250, 700, 3), 470, 490, INT),
    P('shop_counter', 'furniture', MIDI + BACK, 'shop counter with a cash box and goods on top', lambda t: shop_counter(t, 560, IB + 230, 800), 960, IB + 230, INT, [S('behind_counter', 'stand', 960, IB + 190, 'behind the shop counter'), S('behind_counter_left', 'stand', 720, IB + 190, 'behind the counter, left'), S('counter_top', 'surface', 760, IB + 60, 'on the counter'), S('before_counter', 'stand', 1300, IB + 260, 'in front of the counter (customer)'), S('before_counter_left', 'stand', 660, IB + 270, 'in front of the counter, left (customer)')], front=True),
    P('wall_altar_shelf', 'wall', WALL, 'small ancestor altar shelf high on the wall with a portrait, candles and incense', lambda t: wall_altar_shelf(t, 1500, 360), 1500, 400, INT, [S('wall_altar', 'surface', 1500, 360, 'on the wall altar shelf'), S('wall_altar_smoke', 'smoke', 1544, 270, 'incense on the wall altar')], [dict(x=1420, y=312, kind='candle'), dict(x=1580, y=312, kind='candle')]),
    P('ceiling_lamp', 'wall', WALL, 'electric lamp hanging from the ceiling', lambda t: ceiling_lamp(t, 960, 0), 960, 240, INT, [S('under_lamp', 'stand', 960, IB + 90, 'under the hanging lamp')], [dict(x=960, y=230, kind='lamp')]),
    P('modern_window', 'wall', WALL, 'glass window with a white frame (town house, rented room, office)', lambda t: modern_window(t, 1480, 200), 1610, 452, INT, [S('window', 'stand', 1610, IB + 70, 'by the window, looking out'), S('window_side', 'stand', 1380, IB + 90, 'beside the window')]),
    P('modern_door', 'fixture', ['door_right', 'door_left'], 'plain wooden room door with a knob', lambda t: modern_door(t, 1560, IB), 1645, IB, INT, [S('door', 'door', 1645, IB + 50, 'in the doorway'), S('beside_door', 'stand', 1440, IB + 80, 'beside the door, listening or waiting')]),
    P('rolling_shutter', 'fixture', ['door_right', 'door_left'], 'metal rolling shutter of a shop front', lambda t: rolling_shutter(t, 1360, IB), 1540, IB, INT, [S('shutter', 'door', 1540, IB + 50, 'at the shutter')]),
    P('low_bed', 'furniture', MIDI + BACK, 'modern low bed with a pillow and a blanket', lambda t: low_bed(t, 760, IB + 210, 640), 1080, IB + 210, INT, [S('bed', 'lie', 1080, IB + 90, 'lying on the bed'), S('bed_edge', 'sit', 1200, IB + 215, 'on the edge of the bed'), S('beside_bed', 'stand', 640, IB + 230, 'beside the bed, at its head'), S('bed_foot', 'stand', 1480, IB + 240, 'at the foot of the bed')]),
    P('hospital_bed', 'furniture', MIDI + BACK, 'hospital bed with metal rails and a drip stand', hospital_bed, 1010, IB + 220, INT, [S('bed', 'lie', 1010, IB + 75, 'lying in the hospital bed'), S('beside_bed', 'stand', 560, IB + 240, 'beside the hospital bed')]),
    P('wardrobe', 'furniture', BACK + WALL, 'tall wooden wardrobe with two doors', lambda t: wardrobe(t, 180, IB), 300, IB, INT, [S('wardrobe', 'stand', 300, IB + 60, 'at the wardrobe (opening it)'), S('beside_wardrobe', 'stand', 520, IB + 80, 'beside the wardrobe')]),
    P('desk', 'furniture', MIDI + BACK, 'desk with a lamp and a chair', lambda t: desk(t, 1100, IB + 220), 1400, IB + 220, INT, [S('desk_chair', 'sit', 1640, IB + 230, 'on the chair at the desk (studying, writing)'), S('behind_desk', 'sit', 1300, IB + 200, 'sitting behind the desk'), S('beside_desk', 'stand', 980, IB + 250, 'standing beside the desk'), S('desk_top', 'surface', 1200, IB + 70, 'on the desk')], front=True),
    P('chalkboard', 'wall', WALL, 'green school chalkboard', lambda t: chalkboard(t, 1100, 200), 1320, 470, INT, [S('board', 'stand', 1320, IB + 70, 'at the chalkboard (teacher writing)'), S('before_board', 'stand', 1120, IB + 160, 'in front of the board (teacher talking to the class)'), S('board_side', 'stand', 1600, IB + 110, 'beside the board')]),
    P('school_benches', 'furniture', ['mid_left', 'mid_right', 'back_left', 'back_right'], 'long wooden school desk (pupils sit behind it)', lambda t: school_benches(t, 780, IB + 230, 1), 940, IB + 230, INT, [S('school_desk_left', 'sit', 840, IB + 205, 'sitting behind the school desk, left'), S('school_desk', 'sit', 940, IB + 205, 'sitting behind the school desk, middle'), S('school_desk_right', 'sit', 1040, IB + 205, 'sitting behind the school desk, right'), S('desk_aisle', 'stand', 1180, IB + 250, 'in the aisle beside the desk')], front=True),
    P('eye_chart', 'wall', WALL, 'eye test chart on the wall (clinic)', lambda t: eye_chart(t, 400, 220), 510, 500, INT),
    P('hammock', 'furniture', MIDI, 'hammock hung between two wooden posts', lambda t: hammock(t, 560, IB + 230, 760), 940, IB + 230, INT, [S('hammock', 'sit', 940, IB + 140, 'in the hammock'), S('beside_hammock', 'stand', 1420, IB + 250, 'beside the hammock')]),
    P('plank_stack', 'scenery', MIDI + EDGE, 'stack of sawn wooden planks (carpentry)', lambda t: plank_stack(t, 200, IB + 200, 420), 420, IB + 200, INT),
    P('saw_bench', 'furniture', MIDI, 'carpenter workbench with a circular saw', lambda t: saw_bench(t, 760, IB + 220, 420), 970, IB + 220, INT, [S('saw', 'stand', 1280, IB + 240, 'at the saw bench'), S('bench_top', 'surface', 900, IB + 60, 'on the workbench')]),
    P('hanging_basket', 'wall', WALL, 'basket of cakes hanging from a beam', lambda t: hanging_basket(t, 420, 140), 420, 330, INT),
    P('wall_calendar', 'wall', WALL, 'tear-off wall calendar', lambda t: wall_calendar(t, 1300, 230), 1345, 350, INT, [S('calendar', 'stand', 1345, IB + 80, 'at the wall calendar (tearing a page)')]),
    P('stairs', 'fixture', ['door_right', 'door_left'], 'wooden staircase going up', lambda t: stairs(t, 1360, IB), 1600, IB, INT, [S('stairs_foot', 'stand', 1380, IB + 60, 'at the foot of the stairs'), S('stairs_sit', 'sit', 1460, IB - 20, 'sitting on the stairs')]),
    P('meeting_table', 'furniture', ['back_center', 'mid_center'], 'long meeting table with papers', lambda t: meeting_table(t, 420, IB + 220, 1080), 960, IB + 220, INT, [S('behind_table_left', 'stand', 640, IB + 195, 'behind the meeting table, left'), S('behind_table', 'stand', 960, IB + 195, 'behind the meeting table, middle'), S('behind_table_right', 'stand', 1280, IB + 195, 'behind the meeting table, right'), S('table_top', 'surface', 960, IB + 20, 'on the meeting table'), S('before_table', 'stand', 960, IB + 280, 'in front of the meeting table')], front=True),
    P('shophouse', 'building', FAR, 'town shop house with a sign, a rolling shutter and a window', shophouse, 960, HB, EXT, [S('shop_door', 'door', 960, HB + 30, 'in front of the shop')]),
    P('street_lamp', 'scenery', CORNER + EDGE + ['far_left', 'far_right'], 'street lamp post', lambda t: street_lamp(t, 1700, HB + 60), 1700, HB + 60, EXT, [S('under_lamp', 'stand', 1600, HB + 90, 'under the street lamp')], [dict(x=1590, y=HB - 480, kind='lamp')]),
    P('thatch_house', 'building', FAR, 'southern countryside house with woven walls and a thatched roof', thatch_house, 510, HB, EXT, [S('house_door', 'door', 560, HB + 30, 'at the door of the thatched house')]),
    P('pig_pen', 'scenery', MIDE + ['far_left', 'far_right'], 'wooden pig pen with a thatched roof', pig_pen, 1410, HB + 120, EXT, [S('pen_front', 'stand', 1300, HB + 160, 'in front of the pig pen')]),
    P('casuarina', 'scenery', CORNER + ['far_left', 'far_right'], 'tall casuarina tree of the coast', lambda t: casuarina(t, 960, HB, 1.0), 966, HB, EXT),
    P('fishing_boat', 'scenery', MIDE, 'wooden fishing boat pulled up on the sand', lambda t: fishing_boat(t, 960, HB + 160, 640), 960, HB + 160, EXT, [S('boat_side', 'stand', 1320, HB + 190, 'beside the boat'), S('boat_in', 'sit', 960, HB + 40, 'sitting in the boat')]),
    P('field_fence', 'scenery', ['far_center', 'mid_center'], 'wooden post fence across the field path', lambda t: field_fence(t, 400, 1500, HB + 120), 950, HB + 120, EXT),
    P('bamboo_hollow', 'scenery', ['far_center', 'far_right', 'far_left'], 'dense bamboo clump with a dark hollow inside', lambda t: bamboo_hollow(t, 1400, HB + 40), 1400, HB + 40, EXT, [S('hollow', 'stand', 1180, HB + 80, 'at the bamboo clump'), S('hollow_mouth', 'stand', 1400, HB + 70, 'right in front of the dark hollow'), S('in_hollow', 'stand', 1400, HB - 20, 'inside the dark hollow (hidden, peeking out)'), S('clump_left', 'stand', 1080, HB + 120, 'left of the bamboo clump'), S('clump_right', 'stand', 1720, HB + 120, 'right of the bamboo clump')]),
]

BASES += [
    ('room_modern', 'interior', 'modern room: pale painted wall and a tiled floor (town house, rented room, hospital, office, school)', lambda t: base_room2(t, 'modern')),
    ('room_shop', 'interior', 'shop or town house inside: warm painted wall and tiled floor', lambda t: base_room2(t, 'shop')),
    ('room_plank', 'interior', 'dark wooden plank house inside (mountain village, poor hut)', lambda t: base_room2(t, 'plank')),
    ('street', 'exterior', 'town street: pavement and an asphalt road', base_street),
    ('beach', 'exterior', 'sandy beach with the sea behind', base_beach),
    ('terraces', 'exterior', 'terraced rice fields on mountain slopes', base_terraces),
    ('mountain_road', 'exterior', 'road winding between mountains', base_mountain_road),
]
