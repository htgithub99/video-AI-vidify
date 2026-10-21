from scenes import HB, IB

W = 1920


def sp(key, kind, x, y, label):
    return dict(key=key, kind=kind, x=int(x), y=int(y), label=label)


def front(fy, xs=(480, 960, 1440), names=('front_left', 'front_center', 'front_right')):
    return [sp(n, 'stand', x, fy - 10, n.replace('_', ' ')) for n, x in zip(names, xs)]


def main_room(t, fy):
    ax, aw, ab = 760, 420, IB + 60
    tx = 1420 if t.detail else 1100
    out = [
        sp('altar_front', 'stand', ax + aw / 2, ab + 70, 'right in front of the altar (pray, kneel, offer incense)'),
        sp('beside_altar_left', 'stand', ax - 70, ab + 40, 'beside the altar, left'),
        sp('beside_altar_right', 'stand', ax + aw + 70, ab + 40, 'beside the altar, right'),
        sp('altar_top', 'surface', ax + aw / 2, ab - 200, 'on top of the altar'),
        sp('bench', 'sit', 410, IB + 215, 'on the long wooden bench'),
        sp('tea_table', 'surface', tx + 110, IB + 120, 'on the low tea table'),
        sp('beside_table', 'stand', tx + 300 if tx + 300 < 1860 else tx - 80, IB + 250, 'beside the tea table'),
        sp('floor_center', 'lie', 960, fy - 20, 'lying on the floor in the middle'),
        sp('open_floor', 'open', 960, fy - 40, 'open floor in the middle'),
    ]
    if t.detail:
        out.append(sp('window', 'stand', 1620, IB + 60, 'by the window'))
    else:
        out.append(sp('door', 'door', 1565, IB + 50, 'at the tall wooden doors'))
    return out + front(fy, (300, 960, 1640))


def kitchen(t, fy):
    return [
        sp('hearth', 'stand', 560, IB + 230, 'at the cooking hearth'),
        sp('hearth_sit', 'sit', 760, IB + 240, 'sitting by the hearth fire'),
        sp('hearth_top', 'surface', 560, IB + 40, 'on the hearth fire'),
        sp('water_jar', 'stand', 1360, IB + 200, 'beside the big water jar'),
        sp('stool', 'sit', 1160, IB + 240, 'on the small stool'),
        sp('woodpile', 'stand', 260, IB + 120, 'by the stack of firewood'),
        sp('open_floor', 'open', 960, fy - 30, 'open floor'),
    ] + front(fy, (360, 960, 1600))


def bedroom(t, fy):
    return [
        sp('bed', 'lie', 470, IB + 70, 'lying on the bed'),
        sp('bed_edge', 'sit', 560, IB + 200, 'sitting on the edge of the bed'),
        sp('beside_bed', 'stand', 860, IB + 210, 'standing beside the bed'),
        sp('window', 'stand', 1555, IB + 80, 'by the window'),
        sp('chest_top', 'surface', 1490, IB + 60, 'on the wooden chest'),
        sp('lamp_stool', 'surface', 1740, IB + 110, 'on the stool with the oil lamp'),
        sp('open_floor', 'open', 1100, fy - 30, 'open floor'),
    ] + front(fy, (420, 1060, 1500))


def stilt_house_inside(t, fy):
    return [
        sp('hearth', 'stand', 960, IB + 260, 'at the square fire hearth'),
        sp('hearth_left', 'sit', 640, IB + 220, 'sitting left of the hearth fire'),
        sp('hearth_right', 'sit', 1280, IB + 220, 'sitting right of the hearth fire'),
        sp('hearth_top', 'surface', 960, IB + 90, 'on the hearth fire'),
        sp('mat', 'lie', 440, fy - 30, 'lying on a mat on the plank floor'),
        sp('window', 'stand', 1560, IB + 70, 'by the window'),
        sp('beam', 'hang', 1160, 320, 'hanging from the roof beam'),
        sp('open_floor', 'open', 960, fy - 20, 'open floor'),
    ] + front(fy, (360, 960, 1560))


def storeroom(t, fy):
    return [
        sp('jars', 'stand', 640, IB + 200, 'beside the old jars'),
        sp('sacks', 'stand', 1250, IB + 210, 'beside the rice sacks'),
        sp('light_beam', 'stand', 1040, IB + 140, 'in the beam of light from the roof'),
        sp('floor', 'lie', 960, fy - 20, 'lying on the floor'),
        sp('open_floor', 'open', 960, fy - 30, 'open floor'),
    ] + front(fy, (420, 960, 1520))


def funeral_room(t, fy):
    return [
        sp('coffin', 'surface', 960, IB + 10, 'on the coffin'),
        sp('coffin_left', 'stand', 560, IB + 250, 'left of the coffin'),
        sp('coffin_right', 'stand', 1360, IB + 250, 'right of the coffin'),
        sp('coffin_kneel', 'stand', 960, fy - 10, 'kneeling in front of the coffin'),
        sp('altar_top', 'surface', 970, IB - 160, 'on the altar behind the coffin'),
        sp('mourner_left', 'stand', 300, IB + 230, 'among the mourners on the left'),
        sp('mourner_right', 'stand', 1620, IB + 230, 'among the mourners on the right'),
    ] + front(fy, (360, 960, 1560))


def temple_hall(t, fy):
    return [
        sp('buddha_front', 'stand', 960, IB + 180, 'in front of the statue (pray, kneel)'),
        sp('incense', 'surface', 960, IB + 100, 'at the incense bowl'),
        sp('bell', 'stand', 330, IB + 160, 'beside the bell'),
        sp('drum', 'stand', 1600, IB + 200, 'beside the wooden drum'),
        sp('pillar_left', 'stand', 640, IB + 150, 'by the red pillar'),
        sp('open_floor', 'open', 960, fy - 30, 'open floor'),
    ] + front(fy, (400, 960, 1520))


def shrine_inside(t, fy):
    return [
        sp('shrine_front', 'stand', 960, IB + 150, 'in front of the shrine (pray, kneel)'),
        sp('shrine_top', 'surface', 960, IB - 300, 'on the shrine'),
        sp('wall_left', 'stand', 520, IB + 120, 'by the old wall'),
        sp('floor', 'lie', 960, fy - 20, 'lying on the floor'),
        sp('open_floor', 'open', 960, fy - 30, 'open floor'),
    ] + front(fy, (420, 960, 1500))


def abandoned_house_inside(t, fy):
    return [
        sp('broken_chair', 'stand', 520, IB + 230, 'beside the broken chair'),
        sp('curtain', 'stand', 1600, IB + 140, 'by the torn curtain'),
        sp('hole_light', 'stand', 960, IB + 160, 'under the hole in the roof'),
        sp('floor', 'lie', 960, fy - 20, 'lying on the floor'),
        sp('open_floor', 'open', 960, fy - 30, 'open floor'),
    ] + front(fy, (420, 960, 1520))


def roadside_inn(t, fy):
    return [
        sp('bench', 'sit', 540, HB + 175, 'on the bench of the inn'),
        sp('tea_table', 'surface', 970, HB + 80, 'on the tea table'),
        sp('counter', 'stand', 1300, HB + 40, 'at the counter with jars'),
        sp('stove', 'stand', 1660, HB + 180, 'by the cooking stove'),
        sp('lamp', 'hang', 700, HB - 280, 'hanging lamp'),
        sp('open_floor', 'open', 960, fy - 30, 'open ground in front of the inn'),
    ] + front(fy, (420, 960, 1520))


def front_yard(t, fy):
    return [
        sp('house_door', 'door', 960, HB + 20, 'at the door of the house'),
        sp('yard_center', 'stand', 960, HB + 120, 'in the middle of the yard'),
        sp('yard_left', 'stand', 520, HB + 100, 'left side of the yard'),
        sp('yard_right', 'stand', 1400, HB + 100, 'right side of the yard, by the jar'),
        sp('open_floor', 'open', 960, fy - 40, 'open yard'),
        sp('ground', 'lie', 960, fy - 20, 'lying on the ground'),
    ] + front(fy, (420, 960, 1520))


def village_gate(t, fy):
    return [
        sp('gate', 'door', 960, HB + 10, 'in the gateway'),
        sp('gate_left', 'stand', 640, HB + 60, 'left of the gate'),
        sp('gate_right', 'stand', 1300, HB + 60, 'right of the gate'),
        sp('path', 'stand', 960, HB + 180, 'on the dirt path to the gate'),
        sp('open_floor', 'open', 960, fy - 40, 'open ground'),
    ] + front(fy, (420, 960, 1520))


def village_lane(t, fy):
    return [
        sp('lane_far', 'stand', 960, HB + 40, 'far down the lane'),
        sp('lane_mid', 'stand', 960, HB + 170, 'in the middle of the lane'),
        sp('house_left', 'door', 300, HB + 20, 'at the house on the left'),
        sp('house_right', 'door', 1660, HB + 20, 'at the house on the right'),
        sp('wall', 'stand', 1300, HB + 60, 'by the low stone wall'),
        sp('open_floor', 'open', 960, fy - 40, 'open lane'),
    ] + front(fy, (420, 960, 1520))


def banyan_tree(t, fy):
    return [
        sp('tree_root', 'stand', 1180, HB + 80, 'under the old banyan tree'),
        sp('stone_altar', 'surface', 1060, HB + 10, 'on the stone with incense'),
        sp('reeds', 'stand', 420, HB + 90, 'by the reeds'),
        sp('tree_branch', 'hang', 1400, HB - 360, 'hanging from a banyan branch'),
        sp('open_floor', 'open', 760, fy - 40, 'open ground'),
    ] + front(fy, (420, 900, 1500))


def abandoned_shrine(t, fy):
    return [
        sp('shrine_door', 'door', 960, HB + 20, 'at the dark door of the shrine'),
        sp('shrine_step', 'surface', 960, HB - 60, 'on the stone step of the shrine'),
        sp('bush_left', 'stand', 560, HB + 60, 'by the bushes, left'),
        sp('bush_right', 'stand', 1400, HB + 60, 'by the bushes, right'),
        sp('open_floor', 'open', 960, fy - 40, 'open ground'),
    ] + front(fy, (420, 960, 1520))


def graveyard(t, fy):
    return [
        sp('grave_front', 'stand', 900, HB + 150, 'in front of a grave'),
        sp('grave_left', 'stand', 560, HB + 120, 'between the graves, left'),
        sp('grave_right', 'stand', 1300, HB + 130, 'between the graves, right'),
        sp('tree', 'stand', 1660, HB + 10, 'under the tree'),
        sp('open_floor', 'open', 1100, fy - 40, 'open ground among the graves'),
    ] + front(fy, (480, 1000, 1560))


def lonely_grave(t, fy):
    return [
        sp('grave_front', 'stand', 1180, HB + 210, 'in front of the lonely grave'),
        sp('grave_side', 'stand', 860, HB + 180, 'beside the grave'),
        sp('field', 'stand', 500, HB + 100, 'in the empty field'),
        sp('open_floor', 'open', 700, fy - 40, 'open field'),
    ] + front(fy, (420, 960, 1520))


def village_well(t, fy):
    return [
        sp('well', 'stand', 1000, HB + 200, 'beside the stone well'),
        sp('well_top', 'surface', 1250, HB + 40, 'on the rim of the well'),
        sp('stone_slab', 'sit', 640, HB + 170, 'on the stone slab'),
        sp('bamboo', 'stand', 300, HB + 60, 'by the bamboo hedge'),
        sp('open_floor', 'open', 760, fy - 40, 'open ground'),
    ] + front(fy, (420, 860, 1560))


def river_bank(t, fy):
    return [
        sp('shore', 'stand', 760, 830, 'on the river bank'),
        sp('boat', 'stand', 1250, 720, 'in the small boat'),
        sp('reeds', 'stand', 300, 840, 'among the reeds'),
        sp('water_edge', 'stand', 1000, 800, 'at the edge of the water'),
        sp('open_floor', 'open', 960, fy - 40, 'open bank'),
    ] + front(fy, (420, 960, 1520))


def ferry_landing(t, fy):
    return [
        sp('jetty', 'stand', 1080, 710, 'on the wooden jetty'),
        sp('boat', 'stand', 1650, 710, 'in the ferry boat'),
        sp('hut', 'door', 300, 810, 'at the ferryman hut'),
        sp('shore', 'stand', 760, 860, 'on the shore'),
        sp('open_floor', 'open', 960, fy - 40, 'open shore'),
    ] + front(fy, (420, 960, 1520))


def bamboo_bridge(t, fy):
    return [
        sp('bridge_left', 'stand', 600, 762, 'on the bamboo bridge, left'),
        sp('bridge_mid', 'stand', 960, 762, 'in the middle of the bamboo bridge'),
        sp('bridge_right', 'stand', 1320, 762, 'on the bamboo bridge, right'),
        sp('bank_left', 'stand', 160, 980, 'on the bank'),
    ]


def pond(t, fy):
    return [
        sp('pond_edge', 'stand', 1180, 760, 'at the edge of the pond'),
        sp('jetty', 'stand', 1500, 800, 'on the little wooden jetty'),
        sp('bank_left', 'stand', 300, 800, 'on the bank'),
        sp('water', 'open', 820, 900, 'in the pond water'),
    ] + front(fy, (200, 1720), ('front_left', 'front_right'))


def rice_field(t, fy):
    return [
        sp('field_mid', 'stand', 960, 760, 'in the middle of the rice field'),
        sp('scarecrow', 'stand', 520, 790, 'beside the scarecrow'),
        sp('hut', 'door', 1620, 650, 'at the field hut'),
        sp('field_far', 'stand', 1200, 660, 'far across the field'),
        sp('open_floor', 'open', 960, fy - 60, 'open field'),
    ] + front(fy, (420, 960, 1520))


def bamboo_grove(t, fy):
    return [
        sp('path_far', 'stand', 960, HB + 30, 'far down the path in the bamboo'),
        sp('path_mid', 'stand', 960, HB + 170, 'on the path through the bamboo'),
        sp('bamboo_left', 'stand', 520, HB + 120, 'between the bamboo, left'),
        sp('bamboo_right', 'stand', 1400, HB + 120, 'between the bamboo, right'),
        sp('open_floor', 'open', 960, fy - 40, 'open path'),
    ] + front(fy, (420, 960, 1520))


def old_forest(t, fy):
    return [
        sp('path_far', 'stand', 960, HB + 20, 'far down the forest path'),
        sp('path_mid', 'stand', 960, HB + 170, 'on the forest path'),
        sp('trunk_left', 'stand', 360, HB + 90, 'by a big tree trunk'),
        sp('trunk_right', 'stand', 1680, HB + 90, 'by a big tree trunk, right'),
        sp('open_floor', 'open', 960, fy - 40, 'open forest floor'),
    ] + front(fy, (480, 960, 1440))


def mountain_village(t, fy):
    return [
        sp('slope', 'stand', 900, 820, 'on the slope above the village'),
        sp('house_left', 'door', 300, 700, 'by the stilt house, left'),
        sp('house_right', 'door', 1500, 690, 'by the stilt house, right'),
        sp('open_floor', 'open', 960, fy - 50, 'open slope'),
    ] + front(fy, (420, 960, 1520))


def stream(t, fy):
    return [
        sp('stones', 'stand', 980, 980, 'on the stones in the stream'),
        sp('bank_left', 'stand', 400, 900, 'on the left bank'),
        sp('bank_right', 'stand', 1520, 900, 'on the right bank'),
        sp('stream_far', 'stand', 960, HB - 20, 'far up the stream'),
    ] + front(fy, (300, 1640), ('front_left', 'front_right'))


def forest_path(t, fy):
    return [
        sp('path_far', 'stand', 1000, HB + 30, 'far down the path'),
        sp('path_mid', 'stand', 1000, HB + 180, 'on the forest path'),
        sp('tree_left', 'stand', 520, HB + 90, 'by the trees, left'),
        sp('tree_right', 'stand', 1420, HB + 90, 'by the trees, right'),
        sp('open_floor', 'open', 1000, fy - 40, 'open path'),
    ] + front(fy, (480, 1000, 1500))


def cave(t, fy):
    return [
        sp('mouth', 'door', 960, HB + 30, 'at the dark mouth of the cave'),
        sp('cave_left', 'stand', 600, HB + 120, 'inside the cave, left'),
        sp('cave_right', 'stand', 1320, HB + 120, 'inside the cave, right'),
        sp('rock', 'sit', 520, fy - 20, 'sitting on a rock'),
        sp('open_floor', 'open', 960, fy - 40, 'open cave floor'),
    ] + front(fy, (480, 960, 1440))


def village_temple(t, fy):
    return [
        sp('temple_door', 'door', 960, HB + 10, 'at the temple doors'),
        sp('step', 'stand', 960, HB + 90, 'on the stone step of the temple'),
        sp('banyan', 'stand', 300, HB + 60, 'under the banyan tree'),
        sp('yard_right', 'stand', 1560, HB + 80, 'in the temple yard, right'),
        sp('open_floor', 'open', 960, fy - 40, 'open temple yard'),
    ] + front(fy, (420, 960, 1520))


def pagoda_gate(t, fy):
    return [
        sp('gate', 'door', 960, HB + 10, 'in the middle gateway of the pagoda'),
        sp('steps', 'stand', 960, HB + 100, 'on the stone steps'),
        sp('tree', 'stand', 330, HB + 40, 'under the tree'),
        sp('gate_right', 'stand', 1360, HB + 60, 'by the side gate'),
        sp('open_floor', 'open', 960, fy - 40, 'open ground'),
    ] + front(fy, (420, 960, 1520))


def market(t, fy):
    return [
        sp('stall_left', 'stand', 330, HB + 40, 'at the market stall, left'),
        sp('stall_mid', 'stand', 970, HB + 40, 'at the middle market stall'),
        sp('stall_right', 'stand', 1610, HB + 40, 'at the market stall, right'),
        sp('stall_top', 'surface', 970, HB - 110, 'on the stall table'),
        sp('baskets', 'stand', 760, HB + 160, 'among the baskets of goods'),
        sp('open_floor', 'open', 960, fy - 40, 'open market ground'),
    ] + front(fy, (420, 960, 1520))


def abandoned_house(t, fy):
    return [
        sp('door', 'door', 705, HB + 10, 'at the broken door of the house'),
        sp('window', 'stand', 1120, HB + 30, 'below the broken window'),
        sp('dead_tree', 'stand', 1560, HB + 40, 'by the dead tree'),
        sp('yard', 'stand', 960, HB + 140, 'in the overgrown yard'),
        sp('open_floor', 'open', 960, fy - 40, 'open yard'),
    ] + front(fy, (420, 960, 1520))


def hill_road(t, fy):
    return [
        sp('road_left', 'stand', 420, 900, 'on the mountain road, left'),
        sp('road_mid', 'stand', 960, 830, 'on the mountain road'),
        sp('road_right', 'stand', 1480, 760, 'further up the road'),
        sp('cliff', 'stand', 300, 990, 'at the edge of the road'),
    ]


SPOTS = {k: v for k, v in globals().items() if k in (
    'main_room', 'kitchen', 'bedroom', 'stilt_house_inside', 'storeroom', 'funeral_room', 'temple_hall', 'shrine_inside', 'abandoned_house_inside',
    'roadside_inn', 'front_yard', 'village_gate', 'village_lane', 'banyan_tree', 'abandoned_shrine', 'graveyard', 'lonely_grave', 'village_well',
    'river_bank', 'ferry_landing', 'bamboo_bridge', 'pond', 'rice_field', 'bamboo_grove', 'old_forest', 'mountain_village', 'stream', 'forest_path',
    'cave', 'village_temple', 'pagoda_gate', 'market', 'abandoned_house', 'hill_road')}


import re

SWAP = {'left': 'right', 'right': 'left'}


def mirror_word(t):
    return re.sub(r'(?<![a-z])(left|right)(?![a-z])', lambda m: SWAP[m.group(1)], t)


def spots_for(key, t, fy, v):
    out = SPOTS[key](t, fy)
    if v in (1, 3):
        out = [dict(s, x=W - s['x'], label=mirror_word(s['label']), key=mirror_word(s['key'].replace('_', ' ')).replace(' ', '_')) for s in out]
    return out
