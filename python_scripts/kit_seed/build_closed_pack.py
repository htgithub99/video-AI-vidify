if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import argparse
import hashlib
import itertools
import json
import os
from collections import Counter
from pathlib import Path
from core import T, svg, psvg, rect, ell, path, poly, line, circ
from interior import room
from parts import sky, mountains, ground, round_tree
from refkit import low_bed
from fixed_compositions import chair, table
from folk_blocking_geometry import contact, composition, group, hearth, swap_sides
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, validate_asset_geometry, resource_semantics
from closed_pack_texts import ClosedPackText as K
CATALOG = json.loads(Path(__file__).with_name(K.CATALOG).read_text(encoding=_CODE_TEXT.UTF_8))
OCC = K.OCC
MIRROR = K.MIRROR
def identifier(style, kind, key, mirror=False, night=False):
    return seed_id({_CODE_TEXT.SET: _CODE_TEXT.SET_597A4F, _CODE_TEXT.PROP: _CODE_TEXT.PRP, _CODE_TEXT.SET_PIECE: _CODE_TEXT.PCS}[kind], _CODE_TEXT.SYMBOL.join((CATALOG[_CODE_TEXT.PACK], style, kind, key, str(int(mirror)), str(int(night)))))
def metadata(style, kind, row):
    return dict(id=identifier(style, kind, row[_CODE_TEXT.KEY]), type=kind, styleId=SEED_STYLES[style], name=row[_CODE_TEXT.NAME], desc=K.DESC % row[_CODE_TEXT.NAME], tags=[row[_CODE_TEXT.KEY], _CODE_TEXT.SEED, CATALOG[_CODE_TEXT.PACK]], catalogVersion=2, uses=0, updatedAt=seed_timestamp())
def interaction(kind, roles, variant=None, contacts=None):
    result = composition(kind, **roles)
    if variant:
        result.update(variant=variant, key=result[_CODE_TEXT.KEY] + _CODE_TEXT.SYMBOL_D2E2AD + variant)
    if contacts:
        result[_CODE_TEXT.CONTACTS] = [dict(actor=a, point=p, target=b, targetPoint=q, mode=m) for a, p, b, q, m in contacts]
    return result
def furniture(t, key):
    if key == _CODE_TEXT.BED:
        return (
            low_bed(t, 500, 960, 830),
            [500, 780, 830, 180],
            [860, 960],
            [
                contact(_CODE_TEXT.BED_LIE, _CODE_TEXT.LIE, 860, 836, _CODE_TEXT.BED, ground_y=960, face=_CODE_TEXT.RIGHT),
                contact(_CODE_TEXT.BED_EDGE_SIT, _CODE_TEXT.SIT, 600, 960, _CODE_TEXT.BED, seat=836, ground_y=960),
                contact(_CODE_TEXT.BED_EDGE_RIGHT_SIT, _CODE_TEXT.SIT, 1210, 960, _CODE_TEXT.BED, seat=836, ground_y=960),
                contact(_CODE_TEXT.BEDSIDE_STAND, _CODE_TEXT.STAND, 1440, 1050, _CODE_TEXT.BED, ground_y=1050, relation=_CODE_TEXT.BESIDE),
                contact(_CODE_TEXT.BEDSIDE_PARTNER_STAND, _CODE_TEXT.STAND, 1760, 1050, _CODE_TEXT.BED, ground_y=1050, relation=_CODE_TEXT.BESIDE),
                contact(_CODE_TEXT.BEDSIDE_LEFT_STAND, _CODE_TEXT.STAND, 420, 1050, _CODE_TEXT.BED, ground_y=1050, relation=_CODE_TEXT.BESIDE),
            ],
        )
    if key == _CODE_TEXT.CHAIR:
        return chair(t, 1650, 1000), [1530, 620, 240, 390], [1650, 1000], [contact(_CODE_TEXT.VISITOR_CHAIR_SIT, _CODE_TEXT.SIT, 1650, 1000, _CODE_TEXT.CHAIR, seat=885, ground_y=1000)]
    if key == _CODE_TEXT.TABLE:
        return (
            table(t, 560, 980, 800, 170),
            [550, 800, 820, 190],
            [960, 980],
            [
                contact(_CODE_TEXT.TABLE_TOP_LEFT, _CODE_TEXT.SURFACE, 740, 810, _CODE_TEXT.TABLE),
                contact(_CODE_TEXT.TABLE_TOP_CENTER, _CODE_TEXT.SURFACE, 960, 810, _CODE_TEXT.TABLE),
                contact(_CODE_TEXT.TABLE_TOP_RIGHT, _CODE_TEXT.SURFACE, 1180, 810, _CODE_TEXT.TABLE),
                contact(_CODE_TEXT.TABLE_LEFT_STAND, _CODE_TEXT.STAND, 350, 1060, _CODE_TEXT.TABLE, ground_y=1060, relation=_CODE_TEXT.BESIDE),
                contact(_CODE_TEXT.TABLE_RIGHT_STAND, _CODE_TEXT.STAND, 1570, 1060, _CODE_TEXT.TABLE, ground_y=1060, relation=_CODE_TEXT.BESIDE),
            ],
        )
    if key == _CODE_TEXT.HEARTH:
        return hearth(t, 520, 1000), [350, 910, 340, 100], [520, 1000], [contact(_CODE_TEXT.HEARTH_TOP, _CODE_TEXT.SURFACE, 520, 920, _CODE_TEXT.HEARTH), contact(_CODE_TEXT.COOK_STAND, _CODE_TEXT.STAND, 850, 1000, _CODE_TEXT.HEARTH, ground_y=1000, relation=_CODE_TEXT.BESIDE)]
    if key == _CODE_TEXT.DOOR:
        return (
            [rect(t, 1460, 260, 280, 650, t.c(_CODE_TEXT.DARK)), rect(t, 1460, 260, 35, 650, t.c(_CODE_TEXT.DOOR)), rect(t, 1440, 240, 320, 25, t.c(_CODE_TEXT.WOOD)), rect(t, 1440, 910, 320, 25, t.c(_CODE_TEXT.WOOD))],
            [1430, 230, 340, 710],
            [1600, 935],
            [contact(_CODE_TEXT.DOOR_INSIDE, _CODE_TEXT.STAND, 1260, 1000, _CODE_TEXT.DOOR, ground_y=1000, relation=_CODE_TEXT.INSIDE), contact(_CODE_TEXT.DOOR_OUTSIDE, _CODE_TEXT.DOOR, 1600, 910, _CODE_TEXT.DOOR, ground_y=1000, relation=_CODE_TEXT.OUTSIDE)],
        )
    return (
        [rect(t, 1230, 200, 470, 470, t.c(_CODE_TEXT.DARK)), rect(t, 1220, 190, 490, 18, t.c(_CODE_TEXT.WOOD)), rect(t, 1220, 660, 490, 18, t.c(_CODE_TEXT.WOOD))],
        [1210, 180, 510, 510],
        [1470, 670],
        [contact(_CODE_TEXT.WINDOW_INSIDE, _CODE_TEXT.STAND, 860, 1000, _CODE_TEXT.WINDOW, ground_y=1000, relation=_CODE_TEXT.INSIDE), contact(_CODE_TEXT.WINDOW_OUTSIDE, _CODE_TEXT.STAND, 1470, 800, _CODE_TEXT.WINDOW, ground_y=1000, relation=_CODE_TEXT.OUTSIDE)],
    )
def scene(row, style, night=False, mirror=False):
    t = T(style, night, seed=44)
    inside, family = row[_CODE_TEXT.INTERIOR], row[_CODE_TEXT.FAMILY]
    sk = [] if inside else sky(t, 720)
    back, floor = room(t, 720) if inside else (mountains(t, 720), ground(t, 720, _CODE_TEXT.EARTH, 3))
    pieces, spots, groups, occluders, fixtures = [], [], [], [], []
    def add_piece(key, layer=None):
        shapes, _, _, contacts = furniture(t, key)
        (layer if layer is not None else pieces).append(group(key, shapes))
        spots.extend(contacts)
    def comp(kind, **roles):
        groups.append(interaction(kind, roles))
    if family in (_CODE_TEXT.CONVERSATION, _CODE_TEXT.DINING):
        pieces += [group(_CODE_TEXT.CHAIR_LEFT, chair(t, 470, 1000)), group(_CODE_TEXT.CHAIR_RIGHT, chair(t, 1450, 1000))]
        spots += [contact(_CODE_TEXT.CHAIR_LEFT_SIT, _CODE_TEXT.SIT, 470, 1000, _CODE_TEXT.CHAIR_LEFT, seat=885, ground_y=1000), contact(_CODE_TEXT.CHAIR_RIGHT_SIT, _CODE_TEXT.SIT, 1450, 1000, _CODE_TEXT.CHAIR_RIGHT, seat=885, ground_y=1000)]
        if family == _CODE_TEXT.DINING:
            add_piece(_CODE_TEXT.TABLE, occluders)
            comp(_CODE_TEXT.DINING, diner_left=_CODE_TEXT.CHAIR_LEFT_SIT, diner_right=_CODE_TEXT.CHAIR_RIGHT_SIT)
            comp(_CODE_TEXT.OFFERING, giver=_CODE_TEXT.CHAIR_LEFT_SIT, receiver=_CODE_TEXT.CHAIR_RIGHT_SIT)
        else:
            for left, right in itertools.product((_CODE_TEXT.LEFT_STAND, _CODE_TEXT.CHAIR_LEFT_SIT), (_CODE_TEXT.RIGHT_STAND, _CODE_TEXT.CHAIR_RIGHT_SIT)):
                comp(_CODE_TEXT.CONVERSATION, host=left, guest=right)
            comp(_CODE_TEXT.GROUP_CONVERSATION, host=_CODE_TEXT.CHAIR_LEFT_SIT, guest=_CODE_TEXT.CHAIR_RIGHT_SIT, companion=_CODE_TEXT.CENTER_STAND)
    elif family == _CODE_TEXT.BEDSIDE:
        add_piece(_CODE_TEXT.BED)
        add_piece(_CODE_TEXT.CHAIR)
        for patient, caregiver in itertools.product((_CODE_TEXT.BED_LIE, _CODE_TEXT.BED_EDGE_SIT), (_CODE_TEXT.BEDSIDE_STAND, _CODE_TEXT.VISITOR_CHAIR_SIT, _CODE_TEXT.BED_EDGE_RIGHT_SIT)):
            comp(_CODE_TEXT.BEDSIDE, patient=patient, caregiver=caregiver)
        comp(_CODE_TEXT.CONVERSATION, host=_CODE_TEXT.BED_EDGE_SIT, guest=_CODE_TEXT.VISITOR_CHAIR_SIT)
    elif family in (_CODE_TEXT.PARENT_CHILD, _CODE_TEXT.CARRYING, _CODE_TEXT.ASSISTING, _CODE_TEXT.CONTACT):
        spots += [contact(_CODE_TEXT.PARTICIPANT_A, _CODE_TEXT.STAND, 800, 1000, _CODE_TEXT.GROUND, ground_y=1000), contact(_CODE_TEXT.PARTICIPANT_B, _CODE_TEXT.STAND, 1020, 1000, _CODE_TEXT.GROUND, ground_y=1000)]
        if family == _CODE_TEXT.PARENT_CHILD:
            groups.append(interaction(family, dict(adult=_CODE_TEXT.PARTICIPANT_A, child=_CODE_TEXT.PARTICIPANT_B), contacts=[(_CODE_TEXT.ADULT, _CODE_TEXT.HAND, _CODE_TEXT.CHILD, _CODE_TEXT.HAND, _CODE_TEXT.REACH)]))
        elif family == _CODE_TEXT.CARRYING:
            for variant, point in ((_CODE_TEXT.HOLD_CHILD, _CODE_TEXT.HAND), (_CODE_TEXT.PIGGYBACK, _CODE_TEXT.BACK)):
                groups.append(interaction(family, dict(carrier=_CODE_TEXT.PARTICIPANT_A, carried=_CODE_TEXT.PARTICIPANT_B), variant, [(_CODE_TEXT.CARRIED, _CODE_TEXT.BODY, _CODE_TEXT.CARRIER, point, _CODE_TEXT.ATTACH)]))
        elif family == _CODE_TEXT.ASSISTING:
            groups.append(interaction(family, dict(helper=_CODE_TEXT.PARTICIPANT_A, dependent=_CODE_TEXT.PARTICIPANT_B), contacts=[(_CODE_TEXT.HELPER, _CODE_TEXT.HAND, _CODE_TEXT.DEPENDENT, _CODE_TEXT.SHOULDER, _CODE_TEXT.REACH)]))
        else:
            pieces += [group(_CODE_TEXT.RECIPIENT_CHAIR, chair(t, 1020, 1000))]
            spots += [contact(_CODE_TEXT.RECIPIENT_SEAT, _CODE_TEXT.SIT, 1020, 1000, _CODE_TEXT.CHAIR, seat=885, ground_y=1000)]
            for variant, p, q, mode in ((_CODE_TEXT.HOLD_HANDS, _CODE_TEXT.HAND, _CODE_TEXT.HAND, _CODE_TEXT.REACH), (_CODE_TEXT.TOUCH_SHOULDER, _CODE_TEXT.HAND, _CODE_TEXT.SHOULDER, _CODE_TEXT.REACH), (_CODE_TEXT.BITE_SHOULDER, _CODE_TEXT.MOUTH, _CODE_TEXT.SHOULDER, _CODE_TEXT.ATTACH), (_CODE_TEXT.WHISPER, _CODE_TEXT.MOUTH, _CODE_TEXT.EAR, _CODE_TEXT.ATTACH)):
                groups.append(interaction(family, dict(initiator=_CODE_TEXT.PARTICIPANT_A, recipient=_CODE_TEXT.PARTICIPANT_B), variant, [(_CODE_TEXT.INITIATOR, p, _CODE_TEXT.RECIPIENT, q, mode)]))
                groups.append(interaction(family, dict(initiator=_CODE_TEXT.PARTICIPANT_A, recipient=_CODE_TEXT.RECIPIENT_SEAT), variant, [(_CODE_TEXT.INITIATOR, p, _CODE_TEXT.RECIPIENT, q, mode)]))
    elif family == _CODE_TEXT.WINDOW:
        add_piece(_CODE_TEXT.WINDOW, back)
        occluders += [rect(t, 1200, 0, 720, 190, t.c(_CODE_TEXT.WALL)), rect(t, 1200, 680, 720, 400, t.c(_CODE_TEXT.WALL)), rect(t, 1200, 190, 25, 490, t.c(_CODE_TEXT.WALL)), rect(t, 1710, 190, 210, 490, t.c(_CODE_TEXT.WALL))]
        comp(_CODE_TEXT.WINDOW, inside=_CODE_TEXT.WINDOW_INSIDE, outside=_CODE_TEXT.WINDOW_OUTSIDE)
        comp(_CODE_TEXT.WATCHING, watcher=_CODE_TEXT.WINDOW_INSIDE, subject=_CODE_TEXT.WINDOW_OUTSIDE)
    elif family == _CODE_TEXT.DITCH:
        floor += [group(_CODE_TEXT.DITCH_WATER, [poly(t, [(900, 760), (1920, 790), (1920, 1080), (1050, 1080)], t.c(_CODE_TEXT.WATER)), line(t, 1100, 850, 1870, 865, t.c(_CODE_TEXT.WATER2), 4), line(t, 1200, 960, 1850, 980, t.c(_CODE_TEXT.WATER2), 4)])]
        spots += [contact(_CODE_TEXT.DITCH_WATER_SURFACE, _CODE_TEXT.SURFACE, 1430, 900, _CODE_TEXT.DITCH_WATER), contact(_CODE_TEXT.DRY_BANK_STAND, _CODE_TEXT.STAND, 650, 1000, _CODE_TEXT.DITCH, ground_y=1000, relation=_CODE_TEXT.BESIDE)]
    elif family == _CODE_TEXT.KITCHEN:
        add_piece(_CODE_TEXT.HEARTH)
        shapes, _, _, contacts = furniture(t, _CODE_TEXT.TABLE)
        pieces += [group(_CODE_TEXT.PREPARATION_TABLE, shapes)]
        spots += contacts
        comp(_CODE_TEXT.WORK, worker=_CODE_TEXT.COOK_STAND, observer=_CODE_TEXT.RIGHT_STAND)
    elif family == _CODE_TEXT.WORK:
        back += round_tree(t, 180, 760, 0.9)
        comp(_CODE_TEXT.WORK, worker=_CODE_TEXT.LEFT_STAND, observer=_CODE_TEXT.RIGHT_STAND)
    elif family == _CODE_TEXT.CHASE:
        back += round_tree(t, 180, 760, 1.1) + round_tree(t, 1700, 760, 1.1)
        comp(_CODE_TEXT.CHASE, pursuer=_CODE_TEXT.LEFT_STAND, fugitive=_CODE_TEXT.RIGHT_STAND)
        comp(_CODE_TEXT.SEARCH, leader=_CODE_TEXT.LEFT_STAND, companion=_CODE_TEXT.RIGHT_STAND)
    if inside:
        opened = group(_CODE_TEXT.FIXED_DOOR, [rect(t, 1745, 300, 150, 420, t.c(_CODE_TEXT.DARK)), rect(t, 1745, 300, 25, 420, t.c(_CODE_TEXT.DOOR))])
        closed = group(_CODE_TEXT.FIXED_DOOR, [rect(t, 1745, 300, 150, 420, t.c(_CODE_TEXT.DOOR)), circ(t, 1770, 525, 8, t.c(_CODE_TEXT.GOLD))])
        off = group(_CODE_TEXT.FIXED_LAMP, [line(t, 220, 390, 220, 445, t.c(_CODE_TEXT.WOOD), 8), ell(t, 220, 450, 35, 14, t.c(_CODE_TEXT.GOLD)), path(t, _CODE_TEXT.M202_445_L210_395_L230_395_L238_445Z, t.c(_CODE_TEXT.STONE2))])
        on = group(_CODE_TEXT.FIXED_LAMP, [ell(t, 220, 408, 70, 90, t.c(_CODE_TEXT.GLOW), False), line(t, 220, 390, 220, 445, t.c(_CODE_TEXT.WOOD), 8), ell(t, 220, 450, 35, 14, t.c(_CODE_TEXT.GOLD)), path(t, _CODE_TEXT.M202_445_L210_395_L230_395_L238_445Z, t.c(_CODE_TEXT.CLOTH)), path(t, _CODE_TEXT.M214_415_Q207_400_220_387_Q232_404_225_415Z, t.c(_CODE_TEXT.FIRE))])
        back += [opened, on if night else off]
        fixtures += [dict(key=_CODE_TEXT.DOOR, layer=opened, states=dict(open=opened, closed=closed)), dict(key=_CODE_TEXT.LAMP, layer=on if night else off, states=dict(on=on, off=off, lit=on, unlit=off))]
        spots += [contact(_CODE_TEXT.FIXED_DOOR_STAND, _CODE_TEXT.DOOR, 1810, 750, _CODE_TEXT.DOOR, ground_y=1000), contact(_CODE_TEXT.DOOR_COMPANION_STAND, _CODE_TEXT.STAND, 1510, 980, _CODE_TEXT.DOOR, ground_y=980, relation=_CODE_TEXT.BESIDE), contact(_CODE_TEXT.FIXED_LAMP_HANG, _CODE_TEXT.HANG, 220, 390, _CODE_TEXT.LAMP)]
    spots += [contact(_CODE_TEXT.LEFT_STAND, _CODE_TEXT.STAND, 650, 1050, _CODE_TEXT.GROUND, ground_y=1050), contact(_CODE_TEXT.RIGHT_STAND, _CODE_TEXT.STAND, 1270, 1050, _CODE_TEXT.GROUND, ground_y=1050), contact(_CODE_TEXT.CENTER_STAND, _CODE_TEXT.STAND, 960, 1040, _CODE_TEXT.GROUND, ground_y=1040), contact(_CODE_TEXT.FLOOR_OBJECT, _CODE_TEXT.OPEN, 1530, 1030, _CODE_TEXT.GROUND)]
    if mirror:
        sk, back, floor, pieces, occluders = ([MIRROR % "".join(layer)] if layer else [] for layer in (sk, back, floor, pieces, occluders))
        for spot in spots:
            spot[_CODE_TEXT.X] = 1920 - spot[_CODE_TEXT.X]
            spot[_CODE_TEXT.BOUNDS][0] = 1920 - spot[_CODE_TEXT.BOUNDS][0] - spot[_CODE_TEXT.BOUNDS][2]
            for key in (_CODE_TEXT.KEY, _CODE_TEXT.FIXTURE, _CODE_TEXT.LABEL):
                spot[key] = swap_sides(spot[key])
            if _CODE_TEXT.FACE in spot:
                spot[_CODE_TEXT.FACE] = swap_sides(spot[_CODE_TEXT.FACE])
        for item in groups:
            item[_CODE_TEXT.ROLES] = {swap_sides(role): swap_sides(key) for role, key in item[_CODE_TEXT.ROLES].items()}
            item[_CODE_TEXT.KEY] = swap_sides(item[_CODE_TEXT.KEY])
            for value in item.get(_CODE_TEXT.CONTACTS, []):
                value[_CODE_TEXT.ACTOR], value[_CODE_TEXT.TARGET] = swap_sides(value[_CODE_TEXT.ACTOR]), swap_sides(value[_CODE_TEXT.TARGET])
    return dict(svg=svg(t, sk, back, [], floor + pieces, [], occ=OCC % (1000, "".join(occluders)) if occluders else ""), spots=spots, compositions=groups, floorY=1060, horizonY=720, lights=[], fixtures=fixtures)
def prop_image(row, style):
    t = T(style)
    shape, c = row[_CODE_TEXT.SHAPE], t.c
    if shape == _CODE_TEXT.BROOM:
        shapes = [line(t, 256, 40, 256, 350, c(_CODE_TEXT.WOOD), 24), poly(t, [(220, 335), (292, 335), (410, 470), (100, 470)], c(_CODE_TEXT.WOVEN))] + [line(t, 256, 340, x, 465, c(_CODE_TEXT.WOVEN2), 3) for x in range(110, 411, 30)]
    elif shape in (_CODE_TEXT.PORRIDGE, _CODE_TEXT.WATER_BOWL):
        shapes = [path(t, _CODE_TEXT.M70_280_Q90_465_256_480_Q420_465_442_280Z, c(_CODE_TEXT.EARTH)), ell(t, 256, 280, 186, 55, c(_CODE_TEXT.STONE2)), ell(t, 256, 278, 161, 37, c(_CODE_TEXT.CLOTH) if shape == _CODE_TEXT.PORRIDGE else c(_CODE_TEXT.WATER))]
        if shape == _CODE_TEXT.PORRIDGE:
            shapes += [ell(t, x, y, 9, 3, c(_CODE_TEXT.PAPER), False) for x, y in ((160, 265), (220, 290), (280, 270), (330, 285), (355, 260))]
    elif shape in (_CODE_TEXT.SASH, _CODE_TEXT.WET_SASH):
        shapes = [path(t, _CODE_TEXT.M166_92_Q256_135_346_92_L315_180_L365_460_L280_460_L252_205_, c(_CODE_TEXT.CLOTH)), path(t, _CODE_TEXT.M194_180_Q256_215_315_180, _CODE_TEXT.NONE)]
        if shape == _CODE_TEXT.WET_SASH:
            shapes += [path(t, _CODE_TEXT.M175_300_L210_290_L200_405_L166_420Z, c(_CODE_TEXT.STONE2), False)]
    elif shape == _CODE_TEXT.RICE:
        shapes = [ell(t, x, y, 14, 4, c(_CODE_TEXT.CLOTH), False) for x, y in ((85, 440), (120, 410), (165, 457), (205, 427), (245, 460), (280, 420), (320, 448), (360, 413), (410, 455), (445, 430))]
    elif shape in (_CODE_TEXT.CHOPSTICKS, _CODE_TEXT.OAR, _CODE_TEXT.LATCH):
        shapes = [line(t, 235, 70, 245, 470, c(_CODE_TEXT.BAMBOO) if shape == _CODE_TEXT.CHOPSTICKS else c(_CODE_TEXT.WOOD), 12 if shape == _CODE_TEXT.CHOPSTICKS else 24)]
        if shape == _CODE_TEXT.CHOPSTICKS:
            shapes += [line(t, 278, 70, 267, 470, c(_CODE_TEXT.BAMBOO), 12)]
        elif shape == _CODE_TEXT.OAR:
            shapes += [path(t, _CODE_TEXT.M242_330_L180_370_L195_480_L310_480_L325_370_L270_330Z, c(_CODE_TEXT.WOOD2))]
        else:
            shapes += [rect(t, 70, 310, 370, 65, c(_CODE_TEXT.WOOD2))]
    elif shape == _CODE_TEXT.COMB:
        shapes = [rect(t, 75, 120, 360, 100, c(_CODE_TEXT.BAMBOO), rx=20)] + [rect(t, x, 200, 15, 220, c(_CODE_TEXT.BAMBOO)) for x in range(85, 430, 35)]
    elif shape in (_CODE_TEXT.BLANKET, _CODE_TEXT.PACKET):
        shapes = [rect(t, 70, 170, 370, 295, c(_CODE_TEXT.CLOTH) if shape == _CODE_TEXT.BLANKET else c(_CODE_TEXT.PAPER), rx=15), line(t, 80, 390, 430, 390, c(_CODE_TEXT.WOOD2), 5)]
    elif shape == _CODE_TEXT.SACK:
        shapes = [path(t, _CODE_TEXT.M180_100_L332_100_Q300_180_390_350_Q440_475_256_480_Q70_475_, c(_CODE_TEXT.WOVEN)), line(t, 180, 140, 332, 140, c(_CODE_TEXT.WOOD), 12)]
    elif shape == _CODE_TEXT.TRAY:
        shapes = [ell(t, 256, 380, 215, 85, c(_CODE_TEXT.WOOD)), ell(t, 256, 370, 185, 60, c(_CODE_TEXT.WOOD2))]
    elif shape == _CODE_TEXT.PUDDLE:
        shapes = [ell(t, 256, 460, 230, 20, c(_CODE_TEXT.WATER), False), ell(t, 200, 450, 100, 16, c(_CODE_TEXT.WATER2), False)]
    elif shape == _CODE_TEXT.FOOTPRINTS:
        shapes = [ell(t, 180, 330, 28, 65, c(_CODE_TEXT.DIRT), False), ell(t, 310, 425, 28, 65, c(_CODE_TEXT.DIRT), False)] + [circ(t, 160 + i * 12, 255 + i * 3, 7, c(_CODE_TEXT.DIRT), False) for i in range(4)]
    else:
        shapes = [path(t, _CODE_TEXT.M80_260_Q100_480_256_480_Q410_480_432_260Z, c(_CODE_TEXT.WOVEN)), path(t, _CODE_TEXT.M110_260_Q110_100_256_100_Q400_100_400_260, _CODE_TEXT.NONE)]
    return psvg(t, shapes)
def records():
    for style in SEED_STYLES:
        for row in CATALOG[_CODE_TEXT.SCENES]:
            for mirror, night in itertools.product((False, True), repeat=2):
                item = metadata(style, _CODE_TEXT.SET, row)
                item.update(
                    id=identifier(style, _CODE_TEXT.SET, row[_CODE_TEXT.KEY], mirror, night),
                    group=CATALOG[_CODE_TEXT.PACK] + _CODE_TEXT.SYMBOL + row[_CODE_TEXT.KEY],
                    name=row[_CODE_TEXT.NAME] + (K.MIRRORED if mirror else "") + (K.NIGHT if night else ""),
                    interior=row[_CODE_TEXT.INTERIOR],
                    time=_CODE_TEXT.NIGHT if night else _CODE_TEXT.DAY,
                    placementVersion=4,
                    sceneCondition=_CODE_TEXT.INTACT,
                    variants={_CODE_TEXT.DAY if night else _CODE_TEXT.NIGHT: identifier(style, _CODE_TEXT.SET, row[_CODE_TEXT.KEY], mirror, not night)},
                    **scene(row, style, night, mirror)
                )
                yield item
        for row in CATALOG[_CODE_TEXT.PROPS]:
            item = metadata(style, _CODE_TEXT.PROP, row)
            item.update(key=row[_CODE_TEXT.KEY], svg=prop_image(row, style), base=[256, 480], height=row[_CODE_TEXT.SIZE], size=row[_CODE_TEXT.SIZE], mount=row[_CODE_TEXT.MOUNT], category=_CODE_TEXT.PROP, **{key: row[key] for key in (_CODE_TEXT.GRIP, _CODE_TEXT.ATTACHMENT) if key in row})
            yield item
        for key in (_CODE_TEXT.BED, _CODE_TEXT.CHAIR, _CODE_TEXT.TABLE, _CODE_TEXT.HEARTH, _CODE_TEXT.DOOR, _CODE_TEXT.WINDOW):
            row = dict(key=K.COMPONENT_KEY + key, name=K.COMPONENT_NAME % key.title())
            item = metadata(style, _CODE_TEXT.SET_PIECE, row)
            shapes, box, anchor, spots = furniture(T(style), key)
            night_shapes, _, _, _ = furniture(T(style, True), key)
            groups = []
            if key == _CODE_TEXT.DOOR:
                groups = [composition(_CODE_TEXT.DOORWAY, inside=_CODE_TEXT.DOOR_INSIDE, outside=_CODE_TEXT.DOOR_OUTSIDE)]
            elif key == _CODE_TEXT.WINDOW:
                groups = [composition(_CODE_TEXT.WINDOW, inside=_CODE_TEXT.WINDOW_INSIDE, outside=_CODE_TEXT.WINDOW_OUTSIDE)]
            item.update(
                key=row[_CODE_TEXT.KEY],
                kind=_CODE_TEXT.FIXTURE if key in (_CODE_TEXT.DOOR, _CODE_TEXT.WINDOW) else _CODE_TEXT.FURNITURE,
                environment=_CODE_TEXT.INTERIOR,
                svg=svg(T(style), [], [], [], [group(key, shapes)], [], vb=_CODE_TEXT.SYMBOL_36A9E7.join(map(str, box))),
                night=svg(T(style, True), [], [], [], [group(key, night_shapes)], [], vb=_CODE_TEXT.SYMBOL_36A9E7.join(map(str, box))),
                box=box,
                anchor=anchor,
                native=dict(hz=720, fy=1060),
                slots=[_CODE_TEXT.SCENE_CENTER] if groups or key == _CODE_TEXT.BED else [_CODE_TEXT.MID_LEFT, _CODE_TEXT.MID_CENTER, _CODE_TEXT.MID_RIGHT],
                spots=spots,
                compositions=groups,
                lights=[],
                front=False,
                source=_CODE_TEXT.SEED,
            )
            yield item
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(CATALOG[_CODE_TEXT.STAGING]))
    parser.add_argument(_CODE_TEXT.APPLY, action=_CODE_TEXT.STORE_TRUE)
    args = parser.parse_args()
    rows = list(records())
    ids = {item[_CODE_TEXT.ID] for item in rows}
    assert len(rows) == len(ids)
    output = Path(CATALOG[_CODE_TEXT.LIBRARY]) if args.apply else args.output
    assert_legacy_library_target(output)
    report = Path(CATALOG[_CODE_TEXT.REPORT])
    report.mkdir(parents=True, exist_ok=True)
    manifest = []
    for item in rows:
        resource_semantics(item)
        validate_asset_geometry(item, item[_CODE_TEXT.ID])
        points = {spot[_CODE_TEXT.KEY] for spot in item.get(_CODE_TEXT.SPOTS, [])}
        assert len(points) == len(item.get(_CODE_TEXT.SPOTS, []))
        for comp in item.get(_CODE_TEXT.COMPOSITIONS, []):
            assert set(comp[_CODE_TEXT.ROLES].values()) <= points
            assert len(set(comp[_CODE_TEXT.ROLES].values())) == len(comp[_CODE_TEXT.ROLES])
        assert all(variant in ids for variant in item.get(_CODE_TEXT.VARIANTS, {}).values())
        file = output / item[_CODE_TEXT.TYPE] / (item[_CODE_TEXT.ID] + _CODE_TEXT.JSON)
        file.parent.mkdir(parents=True, exist_ok=True)
        if file.exists():
            old = json.loads(file.read_text(encoding=_CODE_TEXT.UTF_8))
            assert CATALOG[_CODE_TEXT.PACK] in old.get(_CODE_TEXT.TAGS, [])
            if args.apply:
                backup = report / K.BACKUP / item[_CODE_TEXT.TYPE] / file.name
                backup.parent.mkdir(parents=True, exist_ok=True)
                if not backup.exists():
                    backup.write_bytes(file.read_bytes())
            item[_CODE_TEXT.USES] = old.get(_CODE_TEXT.USES, 0)
        payload = json.dumps(item, ensure_ascii=False, separators=(_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL)).encode(_CODE_TEXT.UTF_8)
        temporary = file.with_suffix(_CODE_TEXT.JSON_TMP)
        temporary.write_bytes(payload)
        os.replace(temporary, file)
        manifest.append(dict(id=item[_CODE_TEXT.ID], type=item[_CODE_TEXT.TYPE], styleId=item[_CODE_TEXT.STYLEID], key=item.get(_CODE_TEXT.KEY, item[_CODE_TEXT.TAGS][0]), path=str(file.resolve()), sha256=hashlib.sha256(payload).hexdigest()))
    data = dict(pack=CATALOG[_CODE_TEXT.PACK], applied=args.apply, counts=dict(Counter(item[_CODE_TEXT.TYPE] for item in rows)), records=manifest)
    (report / (K.INSTALLED if args.apply else K.STAGED)).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    print(json.dumps(dict(counts=data[_CODE_TEXT.COUNTS], output=str(output), applied=args.apply)))
if __name__ == _CODE_TEXT.MAIN:
    main()
