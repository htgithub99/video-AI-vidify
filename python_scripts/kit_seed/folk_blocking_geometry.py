if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import re
from core import T, rect, ell, circ, poly, path, line, svg, psvg, spath
from parts import sky, mountains, ground, round_tree, banyan, house_tile, stilt_house
from interior import room, bench
from refkit import thatch_house, low_bed, hospital_bed, modern_door, modern_window, wall_altar_shelf, goods_shelves
from fixed_compositions import chair, table
from folk_blocking_texts import FolkText as F
def group(key, shapes):
    return F.GROUP % (key, "".join(shapes))
def contact(key, kind, x, y, fixture=None, seat=None, ground_y=None, face=None, relation=None):
    fixture = fixture or key
    sy = seat if kind == _CODE_TEXT.SIT and seat is not None else y
    result = dict(key=key, kind=kind, x=x, y=y, fixture=fixture, label=F.CONTACT % (kind, fixture), bounds=[x - 45, sy - 12, 90, 24])
    if ground_y is not None:
        result[_CODE_TEXT.GROUNDY] = ground_y
    if seat is not None:
        result[_CODE_TEXT.SEATY] = seat
    if face:
        result[_CODE_TEXT.FACE] = face
    if relation:
        result[_CODE_TEXT.RELATION] = relation
    return result
def composition(kind, **roles):
    return dict(key=kind + _CODE_TEXT.SYMBOL_D2E2AD + _CODE_TEXT.SYMBOL_D2E2AD.join(roles.values()), kind=kind, roles=roles)
def mat(t, x, y, w=600):
    return [rect(t, x - w / 2, y, w, 70, t.c(_CODE_TEXT.WOVEN), rx=7), rect(t, x - w / 2 + 16, y - 18, 110, 35, t.c(_CODE_TEXT.CLOTH), rx=8)] + [line(t, xx, y + 4, xx, y + 64, t.c(_CODE_TEXT.WOVEN2), 2) for xx in range(int(x - w / 2 + 145), int(x + w / 2 - 10), 35)]
def cradle(t):
    return [rect(t, 670, 730, 590, 28, t.c(_CODE_TEXT.WOOD2)), rect(t, 690, 758, 30, 210, t.c(_CODE_TEXT.WOOD)), rect(t, 1210, 758, 30, 210, t.c(_CODE_TEXT.WOOD)), rect(t, 695, 700, 540, 30, t.c(_CODE_TEXT.CLOTH), rx=10), rect(t, 710, 676, 85, 24, t.c(_CODE_TEXT.CLOTH), rx=8)]
def daybed(t):
    return [rect(t, 580, 650, 720, 30, t.c(_CODE_TEXT.WOVEN)), rect(t, 585, 680, 30, 300, t.c(_CODE_TEXT.WOOD)), rect(t, 1260, 680, 30, 300, t.c(_CODE_TEXT.WOOD)), rect(t, 570, 670, 740, 30, t.c(_CODE_TEXT.WOOD2))]
def stair_shapes(t):
    out = [rect(t, 370, 620, 650, 35, t.c(_CODE_TEXT.WOOD)), rect(t, 380, 655, 30, 325, t.c(_CODE_TEXT.POST)), rect(t, 970, 655, 30, 325, t.c(_CODE_TEXT.POST))]
    for i in range(6):
        out += [rect(t, 1000 + i * 72, 620 + i * 60, 110, 28, t.c(_CODE_TEXT.WOOD2))]
    return out
def ferry_shapes(t, front=False):
    if front:
        return [poly(t, [(370, 940), (1510, 940), (1360, 1020), (490, 1020)], t.c(_CODE_TEXT.WOOD2))]
    return [poly(t, [(330, 850), (1560, 850), (1510, 940), (370, 940)], t.c(_CODE_TEXT.WOOD)), rect(t, 560, 850, 630, 28, t.c(_CODE_TEXT.WOOD2))]
def ritual_table(t):
    return [rect(t, 580, 810, 760, 30, t.c(_CODE_TEXT.WOOD)), rect(t, 610, 840, 700, 140, t.c(_CODE_TEXT.RED)), rect(t, 610, 955, 700, 20, t.c(_CODE_TEXT.GOLD))]
def hearth(t, x, base):
    return [
        rect(t, x - 160, base - 80, 320, 80, t.c(_CODE_TEXT.BRICK)),
        line(t, x - 160, base - 40, x + 160, base - 40, t.c(_CODE_TEXT.BRICK2), 4),
        line(t, x - 80, base - 80, x - 80, base - 40, t.c(_CODE_TEXT.BRICK2), 4),
        line(t, x + 80, base - 80, x + 80, base - 40, t.c(_CODE_TEXT.BRICK2), 4),
        rect(t, x - 45, base - 50, 90, 50, t.c(_CODE_TEXT.DARK)),
        ell(t, x, base - 80, 100, 10, t.c(_CODE_TEXT.DARK)),
    ]
def swap_sides(value):
    return re.sub(_CODE_TEXT.A_Z_LEFT_RIGHT_A_Z, lambda match: _CODE_TEXT.RIGHT if match[0] == _CODE_TEXT.LEFT else _CODE_TEXT.LEFT, value)
def scene(row, style, night=False, mirror=False):
    t = T(style, night, seed=31)
    family = row[_CODE_TEXT.FAMILY]
    inside = row[_CODE_TEXT.INTERIOR]
    sk = [] if inside else sky(t, 720)
    back, floor = room(t, 720) if inside else (mountains(t, 720), ground(t, 720, _CODE_TEXT.EARTH, 3))
    spots, groups, occ, lights, mid = [], [], [], [], []
    add = spots.append
    comp = groups.append
    if inside:
        back += modern_door(t, 1650, 720) + modern_window(t, 130, 180, 300, 240)
    if family == _CODE_TEXT.PATIENTS:
        floor += [group(_CODE_TEXT.SLEEPING_MAT_LEFT, mat(t, 470, 920)), group(_CODE_TEXT.SLEEPING_MAT_RIGHT, mat(t, 1430, 920))]
        add(contact(_CODE_TEXT.SLEEPING_MAT_LEFT_LIE, _CODE_TEXT.LIE, 470, 920, _CODE_TEXT.SLEEPING_MAT_LEFT, ground_y=980, face=_CODE_TEXT.RIGHT))
        add(contact(_CODE_TEXT.SLEEPING_MAT_RIGHT_LIE, _CODE_TEXT.LIE, 1430, 920, _CODE_TEXT.SLEEPING_MAT_RIGHT, ground_y=980, face=_CODE_TEXT.RIGHT))
        add(contact(_CODE_TEXT.BETWEEN_SLEEPING_MATS, _CODE_TEXT.STAND, 960, 1000, _CODE_TEXT.SLEEPING_MAT, ground_y=1000, relation=_CODE_TEXT.BETWEEN))
        comp(composition(_CODE_TEXT.TWO_PATIENTS, patient_left=_CODE_TEXT.SLEEPING_MAT_LEFT_LIE, patient_right=_CODE_TEXT.SLEEPING_MAT_RIGHT_LIE, caregiver=_CODE_TEXT.BETWEEN_SLEEPING_MATS))
        comp(composition(_CODE_TEXT.BEDSIDE, patient=_CODE_TEXT.SLEEPING_MAT_LEFT_LIE, caregiver=_CODE_TEXT.BETWEEN_SLEEPING_MATS))
        if row[_CODE_TEXT.KEY] == _CODE_TEXT.STILT_HEARTH_PATIENTS:
            mid += [group(_CODE_TEXT.HEARTH, hearth(t, 250, 770))]
            back += [group(_CODE_TEXT.ROOF_BEAM, [rect(t, 0, 100, 1920, 25, t.c(_CODE_TEXT.BEAM))]), line(t, 1540, 125, 1540, 560, t.c(_CODE_TEXT.DARK), 6)]
            add(contact(_CODE_TEXT.HANGING_POT, _CODE_TEXT.HANG, 1540, 560, _CODE_TEXT.ROOF_BEAM))
            add(contact(_CODE_TEXT.HEARTH_TOP, _CODE_TEXT.SURFACE, 250, 690, _CODE_TEXT.HEARTH))
    elif family in (_CODE_TEXT.BEDSIDE, _CODE_TEXT.HOSPITAL, _CODE_TEXT.MOURNING):
        bed = hospital_bed(t, 500, 960, 830) if family == _CODE_TEXT.HOSPITAL else low_bed(t, 500, 960, 830)
        floor += [group(_CODE_TEXT.BIER if family == _CODE_TEXT.MOURNING else _CODE_TEXT.BED, bed), group(_CODE_TEXT.VISITOR_CHAIR, chair(t, 1650, 1000))]
        top = 810 if family == _CODE_TEXT.HOSPITAL else 836
        add(contact(_CODE_TEXT.BED_LIE, _CODE_TEXT.LIE, 860, top, _CODE_TEXT.BIER if family == _CODE_TEXT.MOURNING else _CODE_TEXT.BED, ground_y=960, face=_CODE_TEXT.RIGHT))
        add(contact(_CODE_TEXT.BESIDE_BED_HEAD, _CODE_TEXT.STAND, 280, 1000, _CODE_TEXT.BED, ground_y=1000, relation=_CODE_TEXT.BESIDE))
        add(contact(_CODE_TEXT.VISITOR_CHAIR_SIT, _CODE_TEXT.SIT, 1650, 1000, _CODE_TEXT.CHAIR, seat=885, ground_y=1000))
        kind, patient, caregiver = (_CODE_TEXT.MOURNING, _CODE_TEXT.DECEASED, _CODE_TEXT.MOURNER) if family == _CODE_TEXT.MOURNING else (_CODE_TEXT.BEDSIDE, _CODE_TEXT.PATIENT, _CODE_TEXT.CAREGIVER)
        comp(composition(kind, **{patient: _CODE_TEXT.BED_LIE, caregiver: _CODE_TEXT.BESIDE_BED_HEAD}))
        comp(composition(kind, **{patient: _CODE_TEXT.BED_LIE, caregiver: _CODE_TEXT.VISITOR_CHAIR_SIT}))
        back += wall_altar_shelf(t, 960, 300) if family == _CODE_TEXT.MOURNING else []
    elif family == _CODE_TEXT.GROOMING:
        floor += [group(_CODE_TEXT.GROOMER_BENCH, bench(t, 560, 865, 330, 115)), group(_CODE_TEXT.SUBJECT_CHAIR, chair(t, 920, 1000))]
        add(contact(_CODE_TEXT.GROOMER_BENCH_SIT, _CODE_TEXT.SIT, 730, 865, _CODE_TEXT.BENCH, seat=750, ground_y=865))
        add(contact(_CODE_TEXT.GROOMER_BEHIND, _CODE_TEXT.STAND, 730, 865, _CODE_TEXT.SUBJECT_CHAIR, ground_y=865, relation=_CODE_TEXT.BEHIND))
        add(contact(_CODE_TEXT.SUBJECT_CHAIR_SIT, _CODE_TEXT.SIT, 920, 1000, _CODE_TEXT.CHAIR, seat=885, ground_y=1000))
        comp(composition(_CODE_TEXT.GROOMING, subject=_CODE_TEXT.SUBJECT_CHAIR_SIT, groomer=_CODE_TEXT.GROOMER_BENCH_SIT))
        comp(composition(_CODE_TEXT.GROOMING, subject=_CODE_TEXT.SUBJECT_CHAIR_SIT, groomer=_CODE_TEXT.GROOMER_BEHIND))
    elif family in (_CODE_TEXT.STAIRS, _CODE_TEXT.BELL):
        mid += [group(_CODE_TEXT.RAISED_HOUSE, house_tile(t, 350, 620, 700, 220)), group(_CODE_TEXT.LANDING_STAIRS, stair_shapes(t))]
        if family == _CODE_TEXT.BELL:
            mid += [group(_CODE_TEXT.TEMPLE_BELL, [line(t, 950, 280, 950, 400, t.c(_CODE_TEXT.WOOD), 12), path(t, _CODE_TEXT.M870_510_Q870_410_950_400_Q1030_410_1030_510Z, t.c(_CODE_TEXT.GOLD)), ell(t, 950, 510, 80, 16, t.c(_CODE_TEXT.WOOD2))])]
            add(contact(_CODE_TEXT.TEMPLE_BELL_HANG, _CODE_TEXT.HANG, 950, 400, _CODE_TEXT.TEMPLE_BELL))
        add(contact(_CODE_TEXT.UPPER_LANDING, _CODE_TEXT.STAND, 700, 620, _CODE_TEXT.LANDING, ground_y=990))
        add(contact(_CODE_TEXT.BELOW_STAIRS, _CODE_TEXT.STAND, 1520, 1000, _CODE_TEXT.STAIRS, ground_y=1000, relation=_CODE_TEXT.BELOW))
        comp(composition(_CODE_TEXT.STAIRS, upper=_CODE_TEXT.UPPER_LANDING, lower=_CODE_TEXT.BELOW_STAIRS))
    elif family in (_CODE_TEXT.RAFTERS, _CODE_TEXT.SCAFFOLD):
        mid += [group(_CODE_TEXT.WOODEN_COLUMN, [rect(t, 1110, 120, 38, 860, t.c(_CODE_TEXT.POST))]), group(_CODE_TEXT.ROOF_BEAM, [rect(t, 0, 110, 1920, 40, t.c(_CODE_TEXT.BEAM))])]
        floor += [group(_CODE_TEXT.DAYBED if family == _CODE_TEXT.RAFTERS else _CODE_TEXT.SCAFFOLD, daybed(t))]
        add(contact(_CODE_TEXT.RAISED_PLATFORM_STAND, _CODE_TEXT.STAND, 940, 650, _CODE_TEXT.DAYBED if family == _CODE_TEXT.RAFTERS else _CODE_TEXT.SCAFFOLD, ground_y=980))
        add(contact(_CODE_TEXT.OBSERVER_BELOW, _CODE_TEXT.STAND, 350, 1010, _CODE_TEXT.DAYBED if family == _CODE_TEXT.RAFTERS else _CODE_TEXT.SCAFFOLD, ground_y=1010, relation=_CODE_TEXT.BESIDE))
        comp(composition(_CODE_TEXT.RAFTERS, climber=_CODE_TEXT.RAISED_PLATFORM_STAND, observer=_CODE_TEXT.OBSERVER_BELOW))
    elif family == _CODE_TEXT.CRADLE:
        floor += [group(_CODE_TEXT.CRADLE, cradle(t))]
        occ += [(970, [rect(t, 670, 760, 590, 18, t.c(_CODE_TEXT.WOOD2))] + [rect(t, x, 778, 12, 62, t.c(_CODE_TEXT.WOOD)) for x in range(690, 1250, 50)])]
        add(contact(_CODE_TEXT.CRADLE_LIE, _CODE_TEXT.LIE, 950, 700, _CODE_TEXT.CRADLE, ground_y=970, face=_CODE_TEXT.RIGHT))
        add(contact(_CODE_TEXT.BESIDE_CRADLE, _CODE_TEXT.STAND, 400, 1000, _CODE_TEXT.CRADLE, ground_y=1000, relation=_CODE_TEXT.BESIDE))
        comp(composition(_CODE_TEXT.CRADLE, infant=_CODE_TEXT.CRADLE_LIE, caregiver=_CODE_TEXT.BESIDE_CRADLE))
    elif family in (_CODE_TEXT.RITUAL, _CODE_TEXT.COUNTER, _CODE_TEXT.REPAIR, _CODE_TEXT.CARDS):
        if family == _CODE_TEXT.RITUAL:
            furniture = ritual_table(t)
            back += wall_altar_shelf(t, 960, 300)
        else:
            furniture = table(t, 520, 980, 860, 170)
            if family in (_CODE_TEXT.COUNTER, _CODE_TEXT.REPAIR):
                furniture += [rect(t, 530, 835, 840, 140, t.c(_CODE_TEXT.WOOD2))]
            if family == _CODE_TEXT.COUNTER:
                back += goods_shelves(t, 510, 180, 850, 3)
            elif family == _CODE_TEXT.REPAIR:
                back += [rect(t, 600, 150, 700, 570, t.c(_CODE_TEXT.STONE2))] + [line(t, 600, y, 1300, y, t.c(_CODE_TEXT.STONE), 3) for y in range(170, 710, 40)]
            else:
                floor += chair(t, 750, 900) + chair(t, 1500, 1010)
        occ += [(980, [group(_CODE_TEXT.OFFERING_TABLE if family == _CODE_TEXT.RITUAL else _CODE_TEXT.COUNTER if family in (_CODE_TEXT.COUNTER, _CODE_TEXT.REPAIR) else _CODE_TEXT.CARD_TABLE, furniture)])]
        add(contact(_CODE_TEXT.BEHIND_TABLE, _CODE_TEXT.STAND, 940, 880, _CODE_TEXT.TABLE if family == _CODE_TEXT.RITUAL else _CODE_TEXT.COUNTER, ground_y=880, relation=_CODE_TEXT.BEHIND))
        add(contact(_CODE_TEXT.FRONT_VISITOR, _CODE_TEXT.STAND, 350, 1030, _CODE_TEXT.TABLE if family == _CODE_TEXT.RITUAL else _CODE_TEXT.COUNTER, ground_y=1030, relation=_CODE_TEXT.BEFORE))
        for x, side in ((740, _CODE_TEXT.LEFT), (960, _CODE_TEXT.CENTER), (1180, _CODE_TEXT.RIGHT)):
            add(contact(_CODE_TEXT.TABLE_TOP + side, _CODE_TEXT.SURFACE, x, 810, _CODE_TEXT.TABLE))
        if family == _CODE_TEXT.CARDS:
            add(contact(_CODE_TEXT.PLAYER_LEFT, _CODE_TEXT.SIT, 750, 900, _CODE_TEXT.CHAIR, seat=785, ground_y=900))
            add(contact(_CODE_TEXT.PLAYER_RIGHT, _CODE_TEXT.SIT, 1500, 1010, _CODE_TEXT.CHAIR, seat=895, ground_y=1010))
            comp(composition(_CODE_TEXT.CONVERSATION, host=_CODE_TEXT.PLAYER_LEFT, guest=_CODE_TEXT.PLAYER_RIGHT))
        else:
            comp(composition(_CODE_TEXT.RITUAL, officiant=_CODE_TEXT.BEHIND_TABLE, visitor=_CODE_TEXT.FRONT_VISITOR) if family == _CODE_TEXT.RITUAL else composition(_CODE_TEXT.COUNTER, seller=_CODE_TEXT.BEHIND_TABLE, customer=_CODE_TEXT.FRONT_VISITOR))
    elif family == _CODE_TEXT.CONVERSATION:
        floor += [group(_CODE_TEXT.CHAIR_LEFT, chair(t, 490, 980)), group(_CODE_TEXT.CHAIR_RIGHT, chair(t, 1430, 980)), group(_CODE_TEXT.TEA_TABLE, table(t, 730, 970, 460, 180))]
        back += wall_altar_shelf(t, 960, 320)
        add(contact(_CODE_TEXT.CHAIR_LEFT_SIT, _CODE_TEXT.SIT, 490, 980, _CODE_TEXT.CHAIR_LEFT, seat=865, ground_y=980))
        add(contact(_CODE_TEXT.CHAIR_RIGHT_SIT, _CODE_TEXT.SIT, 1430, 980, _CODE_TEXT.CHAIR_RIGHT, seat=865, ground_y=980))
        add(contact(_CODE_TEXT.TEA_TABLE_TOP, _CODE_TEXT.SURFACE, 960, 790, _CODE_TEXT.TEA_TABLE))
        comp(composition(_CODE_TEXT.CONVERSATION, host=_CODE_TEXT.CHAIR_LEFT_SIT, guest=_CODE_TEXT.CHAIR_RIGHT_SIT))
    elif family == _CODE_TEXT.DOORWAY:
        mid += [group(_CODE_TEXT.THRESHOLD, [rect(t, 1450, 300, 270, 600, t.c(_CODE_TEXT.DOOR)), rect(t, 1435, 900, 300, 25, t.c(_CODE_TEXT.WOOD))])]
        floor += [group(_CODE_TEXT.BED, low_bed(t, 250, 980, 650))]
        add(contact(_CODE_TEXT.INSIDE_ROOM, _CODE_TEXT.STAND, 1120, 1020, _CODE_TEXT.ROOM, ground_y=1020))
        add(contact(_CODE_TEXT.OUTSIDE_THRESHOLD, _CODE_TEXT.DOOR, 1580, 900, _CODE_TEXT.DOOR, ground_y=900))
        add(contact(_CODE_TEXT.BED_LIE, _CODE_TEXT.LIE, 540, 856, _CODE_TEXT.BED, ground_y=980, face=_CODE_TEXT.RIGHT))
        comp(composition(_CODE_TEXT.DOORWAY, inside=_CODE_TEXT.INSIDE_ROOM, outside=_CODE_TEXT.OUTSIDE_THRESHOLD))
    elif family in (_CODE_TEXT.RESCUE, _CODE_TEXT.BOAT, _CODE_TEXT.BRIDGE):
        floor = [rect(t, 0, 720, 1920, 360, t.c(_CODE_TEXT.WATER), False)]
        for y in (760, 820, 900, 990):
            floor += [line(t, 40, y, 1880, y, t.c(_CODE_TEXT.WATER2), 3)]
        if family == _CODE_TEXT.BOAT:
            floor += [group(_CODE_TEXT.FERRY, ferry_shapes(t))]
            occ += [(1030, ferry_shapes(t, True))]
            add(contact(_CODE_TEXT.ROWER_DECK, _CODE_TEXT.STAND, 590, 940, _CODE_TEXT.BOAT, ground_y=1000))
            add(contact(_CODE_TEXT.PASSENGER_SEAT, _CODE_TEXT.SIT, 1130, 950, _CODE_TEXT.BOAT, seat=850, ground_y=1000))
            comp(composition(_CODE_TEXT.BOAT, rower=_CODE_TEXT.ROWER_DECK, passenger=_CODE_TEXT.PASSENGER_SEAT))
        elif family == _CODE_TEXT.BRIDGE:
            floor += [poly(t, [(0, 850), (320, 850), (520, 1080), (0, 1080)], t.c(_CODE_TEXT.EARTH)), poly(t, [(1600, 850), (1920, 850), (1920, 1080), (1430, 1080)], t.c(_CODE_TEXT.EARTH)), group(_CODE_TEXT.BRIDGE, [rect(t, 300, 860, 1350, 40, t.c(_CODE_TEXT.WOOD))] + [line(t, x, 865, x, 900, t.c(_CODE_TEXT.WOOD2), 3) for x in range(310, 1640, 55)])]
            add(contact(_CODE_TEXT.BRIDGE_LEFT, _CODE_TEXT.STAND, 660, 860, _CODE_TEXT.BRIDGE, ground_y=990))
            add(contact(_CODE_TEXT.BRIDGE_RIGHT, _CODE_TEXT.STAND, 1260, 860, _CODE_TEXT.BRIDGE, ground_y=990))
            comp(composition(_CODE_TEXT.SEARCH, leader=_CODE_TEXT.BRIDGE_LEFT, companion=_CODE_TEXT.BRIDGE_RIGHT))
        else:
            floor += [poly(t, [(0, 760), (1200, 810), (1450, 1080), (0, 1080)], t.c(_CODE_TEXT.EARTH)), group(_CODE_TEXT.RIVER_ROCK, [ell(t, 780, 955, 350, 45, t.c(_CODE_TEXT.ROCK))])]
            add(contact(_CODE_TEXT.ROCK_SURVIVOR_LIE, _CODE_TEXT.LIE, 780, 925, _CODE_TEXT.ROCK, ground_y=1000, face=_CODE_TEXT.RIGHT))
            add(contact(_CODE_TEXT.BANK_RESCUER, _CODE_TEXT.STAND, 280, 1020, _CODE_TEXT.RIVERBANK, ground_y=1020))
            comp(composition(_CODE_TEXT.RIVER_RESCUE, survivor=_CODE_TEXT.ROCK_SURVIVOR_LIE, rescuer=_CODE_TEXT.BANK_RESCUER))
    elif family == _CODE_TEXT.HAMMOCK:
        back += [group(_CODE_TEXT.HAMMOCK_TREES, [rect(t, 330, 0, 35, 1000, t.c(_CODE_TEXT.TRUNK)), rect(t, 1410, 0, 35, 1000, t.c(_CODE_TEXT.TRUNK))])]
        floor += [group(_CODE_TEXT.HAMMOCK, [path(t, _CODE_TEXT.M350_720_Q880_980_1430_720_L1410_790_Q880_1010_370_790Z, t.c(_CODE_TEXT.CLOTH))])]
        add(contact(_CODE_TEXT.HAMMOCK_LIE, _CODE_TEXT.LIE, 880, 850, _CODE_TEXT.HAMMOCK, ground_y=990, face=_CODE_TEXT.RIGHT))
        add(contact(_CODE_TEXT.HAMMOCK_COMPANION, _CODE_TEXT.STAND, 200, 1010, _CODE_TEXT.HAMMOCK, ground_y=1010, relation=_CODE_TEXT.BESIDE))
        comp(composition(_CODE_TEXT.BEDSIDE, patient=_CODE_TEXT.HAMMOCK_LIE, caregiver=_CODE_TEXT.HAMMOCK_COMPANION))
    elif family == _CODE_TEXT.TEACHING:
        back += [group(_CODE_TEXT.CHALKBOARD, [rect(t, 1180, 200, 600, 270, t.c(_CODE_TEXT.TREE2))])]
        floor += [group(_CODE_TEXT.PUPIL_BENCH, bench(t, 380, 980, 650, 115))]
        add(contact(_CODE_TEXT.PUPIL_BENCH_SIT, _CODE_TEXT.SIT, 690, 980, _CODE_TEXT.BENCH, seat=865, ground_y=980))
        add(contact(_CODE_TEXT.TEACHER_BOARD, _CODE_TEXT.STAND, 1510, 980, _CODE_TEXT.CHALKBOARD, ground_y=980))
        comp(composition(_CODE_TEXT.TEACHING, teacher=_CODE_TEXT.TEACHER_BOARD, pupil=_CODE_TEXT.PUPIL_BENCH_SIT))
    elif family == _CODE_TEXT.KITCHEN:
        floor += [group(_CODE_TEXT.HEARTH, hearth(t, 650, 1000)), group(_CODE_TEXT.JAR_SHELF, bench(t, 1280, 860, 380, 240))]
        add(contact(_CODE_TEXT.COOK_BESIDE_HEARTH, _CODE_TEXT.STAND, 1050, 1000, _CODE_TEXT.HEARTH, ground_y=1000, relation=_CODE_TEXT.BESIDE))
        add(contact(_CODE_TEXT.HEARTH_TOP, _CODE_TEXT.SURFACE, 650, 920, _CODE_TEXT.HEARTH))
        add(contact(_CODE_TEXT.JAR_SHELF_TOP, _CODE_TEXT.SURFACE, 1470, 620, _CODE_TEXT.SHELF))
    else:
        if family == _CODE_TEXT.CANOPY:
            back += house_tile(t, 420, 720, 1100, 240)
            back += [group(_CODE_TEXT.FUNERAL_CANOPY, [rect(t, 460, 400, 25, 500, t.c(_CODE_TEXT.CLOTH)), rect(t, 1420, 400, 25, 500, t.c(_CODE_TEXT.CLOTH)), poly(t, [(420, 400), (960, 210), (1490, 400)], t.c(_CODE_TEXT.CLOTH)), rect(t, 500, 400, 880, 90, t.c(_CODE_TEXT.CLOTH))])]
        elif family == _CODE_TEXT.VILLAGE:
            for x in (20, 720, 1390):
                back += stilt_house(t, x, 730, 480, 170, 160)
        elif family in (_CODE_TEXT.BAMBOO, _CODE_TEXT.WELL):
            for x in (60, 140, 230, 1580, 1680, 1810):
                back += [line(t, x, 730, x + 20, 140, t.c(_CODE_TEXT.BAMBOO), 18)] + [line(t, x, y, x + 70, y - 60, t.c(_CODE_TEXT.LEAF), 8) for y in (250, 400, 550)]
            if family == _CODE_TEXT.WELL:
                floor += [group(_CODE_TEXT.WELL, [rect(t, 710, 770, 500, 180, t.c(_CODE_TEXT.STONE)), ell(t, 960, 770, 250, 70, t.c(_CODE_TEXT.STONE2)), ell(t, 960, 770, 190, 45, t.c(_CODE_TEXT.DARK))])]
                add(contact(_CODE_TEXT.WELL_RIM, _CODE_TEXT.SURFACE, 1170, 775, _CODE_TEXT.WELL))
            else:
                floor += [group(_CODE_TEXT.OFFERING_STUMP, [rect(t, 1300, 820, 220, 140, t.c(_CODE_TEXT.WOOD))])]
                add(contact(_CODE_TEXT.BOWL_STUMP_SURFACE, _CODE_TEXT.SURFACE, 1410, 820, _CODE_TEXT.STUMP))
        elif family in (_CODE_TEXT.SHRINE, _CODE_TEXT.GRAVE, _CODE_TEXT.FIELD):
            if family == _CODE_TEXT.SHRINE:
                back += banyan(t, 1460, 760, 0.85) + house_tile(t, 1260, 810, 340, 150, doors=1)
            else:
                if family == _CODE_TEXT.FIELD:
                    back += [rect(t, 0, 600, 1920, 170, t.c(_CODE_TEXT.FIELD))] + [line(t, x, 600, x - 70, 770, t.c(_CODE_TEXT.FIELD2), 4) for x in range(0, 1920, 80)]
                floor += [group(_CODE_TEXT.GRAVE_MOUND, [ell(t, 1470, 870, 300, 95, t.c(_CODE_TEXT.MOUND)), rect(t, 1430, 680, 85, 170, t.c(_CODE_TEXT.STONE), rx=22)])]
        else:
            back += round_tree(t, 180, 760, 1.2) + round_tree(t, 1700, 760, 1.4)
            if family == _CODE_TEXT.BANANA:
                back += thatch_house(t, 1280, 750, 430)
                for x in (120, 400):
                    back += [rect(t, x, 450, 22, 300, t.c(_CODE_TEXT.BAMBOO))] + [ell(t, x + dx, 420 - dy, 150, 30, t.c(_CODE_TEXT.LEAF)) for dx, dy in ((-90, 0), (90, 0), (0, 80))]
        add(contact(_CODE_TEXT.LEFT_GROUND, _CODE_TEXT.STAND, 560, 1000, _CODE_TEXT.GROUND, ground_y=1000))
        add(contact(_CODE_TEXT.RIGHT_GROUND, _CODE_TEXT.STAND, 1160, 1000, _CODE_TEXT.GROUND, ground_y=1000))
        comp(composition(_CODE_TEXT.SEARCH, leader=_CODE_TEXT.LEFT_GROUND, companion=_CODE_TEXT.RIGHT_GROUND))
        comp(composition(_CODE_TEXT.WATCHING, watcher=_CODE_TEXT.LEFT_GROUND, subject=_CODE_TEXT.RIGHT_GROUND))
    spots += [contact(_CODE_TEXT.FRONT_LEFT, _CODE_TEXT.STAND, 200, 1040, ground_y=1040), contact(_CODE_TEXT.FRONT_CENTER, _CODE_TEXT.STAND, 960, 1040, ground_y=1040), contact(_CODE_TEXT.FRONT_RIGHT, _CODE_TEXT.STAND, 1720, 1040, ground_y=1040), contact(_CODE_TEXT.FLOOR_OBJECT, _CODE_TEXT.OPEN, 1500, 1020)]
    if mirror:
        sk, back, floor, mid = ([F.MIRROR % swap_sides("".join(layer))] for layer in (sk, back, floor, mid))
        occ = [(depth, [F.MIRROR % swap_sides("".join(shapes))]) for depth, shapes in occ]
        for spot in spots:
            spot[_CODE_TEXT.X] = 1920 - spot[_CODE_TEXT.X]
            spot[_CODE_TEXT.BOUNDS][0] = 1920 - spot[_CODE_TEXT.BOUNDS][0] - spot[_CODE_TEXT.BOUNDS][2]
            for key in (_CODE_TEXT.KEY, _CODE_TEXT.FIXTURE, _CODE_TEXT.LABEL):
                spot[key] = swap_sides(spot[key])
            if _CODE_TEXT.FACE in spot:
                spot[_CODE_TEXT.FACE] = _CODE_TEXT.LEFT if spot[_CODE_TEXT.FACE] == _CODE_TEXT.RIGHT else _CODE_TEXT.RIGHT
        groups = [dict(key=swap_sides(item[_CODE_TEXT.KEY]), kind=item[_CODE_TEXT.KIND], roles={swap_sides(role): swap_sides(key) for role, key in item[_CODE_TEXT.ROLES].items()}) for item in groups]
    image = svg(t, sk, back, mid, floor, [], occ="".join(F.OCC % (depth, "".join(shapes)) for depth, shapes in occ))
    return dict(svg=image, spots=spots, compositions=groups, floorY=1060, horizonY=720, lights=lights)
def prop(row, style):
    t = T(style)
    c = lambda key: t.c(key)
    shape = row[_CODE_TEXT.SHAPE]
    items = []
    if shape == _CODE_TEXT.SCISSORS:
        items = [ell(t, 150, 370, 65, 80, _CODE_TEXT.NONE), ell(t, 360, 370, 65, 80, _CODE_TEXT.NONE), line(t, 185, 305, 380, 70, c(_CODE_TEXT.STONE), 22), line(t, 325, 305, 125, 70, c(_CODE_TEXT.STONE), 22), circ(t, 255, 245, 14, c(_CODE_TEXT.DARK))]
    elif shape == _CODE_TEXT.CUTTER:
        items = [path(t, _CODE_TEXT.M110_270_Q250_40_395_270_L330_295_Q255_145_170_295Z, c(_CODE_TEXT.STONE)), line(t, 160, 280, 105, 455, c(_CODE_TEXT.WOOD), 32), line(t, 350, 280, 405, 455, c(_CODE_TEXT.WOOD), 32), circ(t, 255, 220, 15, c(_CODE_TEXT.GOLD))]
    elif shape in (_CODE_TEXT.THREAD, _CODE_TEXT.CARDS, _CODE_TEXT.LEDGER, _CODE_TEXT.CLOTH):
        if shape == _CODE_TEXT.THREAD:
            items = [ell(t, 256, 300, 160, 90, c(_CODE_TEXT.RED), False), ell(t, 256, 300, 110, 50, c(_CODE_TEXT.PAPER), False), spath(_CODE_TEXT.M400_340_Q470_420_280_470, c(_CODE_TEXT.RED), 9)]
        elif shape == _CODE_TEXT.CARDS:
            for i in range(4):
                items += [rect(t, 80 + i * 78, 180 + i * 22, 112, 210, c(_CODE_TEXT.CLOTH), rx=9), poly(t, [(120 + i * 78, 240 + i * 22), (135 + i * 78, 260 + i * 22), (120 + i * 78, 280 + i * 22), (105 + i * 78, 260 + i * 22)], c(_CODE_TEXT.RED))]
        else:
            items = [rect(t, 90, 100, 330, 370, c(_CODE_TEXT.PAPER) if shape == _CODE_TEXT.LEDGER else c(_CODE_TEXT.CLOTH), rx=10), line(t, 170, 100, 170, 470, c(_CODE_TEXT.WOOD2), 8)]
            if shape == _CODE_TEXT.LEDGER:
                items += [line(t, 205, y, 375, y, c(_CODE_TEXT.WOOD2), 4) for y in range(160, 430, 45)]
    elif shape in (_CODE_TEXT.BETEL, _CODE_TEXT.RICE_SALT):
        items = [ell(t, 256, 390, 210, 72, c(_CODE_TEXT.GOLD))]
        if shape == _CODE_TEXT.BETEL:
            items += [poly(t, [(110, 375), (180, 180), (270, 360)], c(_CODE_TEXT.LEAF)), ell(t, 330, 340, 55, 65, c(_CODE_TEXT.EARTH)), ell(t, 400, 360, 35, 45, c(_CODE_TEXT.RED))]
        else:
            items += [ell(t, 170, 370, 65, 30, c(_CODE_TEXT.CLOTH)), ell(t, 340, 370, 65, 30, c(_CODE_TEXT.PAPER))]
    elif shape == _CODE_TEXT.GONG:
        items = [circ(t, 235, 250, 185, c(_CODE_TEXT.GOLD)), circ(t, 235, 250, 95, c(_CODE_TEXT.WOOD2)), circ(t, 235, 250, 40, c(_CODE_TEXT.GOLD)), line(t, 420, 450, 330, 230, c(_CODE_TEXT.WOOD), 22), circ(t, 330, 230, 30, c(_CODE_TEXT.CLOTH))]
    elif shape in (_CODE_TEXT.PIG, _CODE_TEXT.TIGER):
        color = c(_CODE_TEXT.DARK) if shape == _CODE_TEXT.PIG else c(_CODE_TEXT.GOLD)
        items = [ell(t, 245, 300, 170, 95, color), circ(t, 390, 255, 70, color), poly(t, [(345, 215), (350, 145), (390, 195)], color), poly(t, [(400, 195), (445, 145), (450, 235)], color), circ(t, 405, 245, 9, c(_CODE_TEXT.CLOTH)), circ(t, 405, 245, 4, c(_CODE_TEXT.DARK)), line(t, 100, 310, 40, 190, color, 15)]
        for x in (140, 220, 310, 385):
            items += [rect(t, x, 355, 22, 115, color)]
        if shape == _CODE_TEXT.PIG:
            items += [ell(t, 450, 280, 40, 28, c(_CODE_TEXT.EARTH2)), circ(t, 447, 280, 5, c(_CODE_TEXT.DARK)), circ(t, 463, 280, 5, c(_CODE_TEXT.DARK))]
            for x in range(365, 416, 10):
                items += [rect(t, x, 454, 8, 20, c(_CODE_TEXT.STONE))]
        else:
            for x in (135, 190, 245, 300):
                items += [poly(t, [(x, 220), (x + 20, 220), (x + 38, 305), (x + 14, 280)], c(_CODE_TEXT.DARK))]
            items += [line(t, 425, 270, 450, 275, c(_CODE_TEXT.DARK), 5)]
    elif shape in (_CODE_TEXT.JAR, _CODE_TEXT.BASKET, _CODE_TEXT.TRAP, _CODE_TEXT.BRAZIER):
        color = c(_CODE_TEXT.WOVEN) if shape in (_CODE_TEXT.BASKET, _CODE_TEXT.TRAP) else c(_CODE_TEXT.EARTH)
        items = [path(t, _CODE_TEXT.M140_140_Q60_260_125_460_L385_460_Q450_260_370_140Z, color), ell(t, 255, 140, 115, 35, c(_CODE_TEXT.WOOD2))]
        if shape in (_CODE_TEXT.BASKET, _CODE_TEXT.TRAP):
            items += [line(t, x, 175, x, 445, c(_CODE_TEXT.WOVEN2), 3) for x in range(145, 380, 28)] + [line(t, 130, y, 385, y, c(_CODE_TEXT.WOVEN2), 3) for y in range(220, 450, 35)]
            if shape == _CODE_TEXT.TRAP:
                items += [ell(t, 255, 140, 60, 23, c(_CODE_TEXT.DARK))]
        elif shape == _CODE_TEXT.JAR:
            items += [poly(t, [(115, 115), (390, 115), (425, 200), (320, 175), (270, 210), (200, 175), (100, 200)], c(_CODE_TEXT.CLOTH)), line(t, 120, 175, 400, 175, c(_CODE_TEXT.RED), 9)]
        else:
            items += [ell(t, 255, 140, 90, 25, c(_CODE_TEXT.DARK)), poly(t, [(180, 140), (220, 50), (245, 140)], c(_CODE_TEXT.FIRE)), poly(t, [(260, 140), (300, 35), (330, 140)], c(_CODE_TEXT.FIRE)), rect(t, 210, 340, 90, 80, c(_CODE_TEXT.DARK))]
    elif shape in (_CODE_TEXT.BOWL, _CODE_TEXT.DIPPER):
        items = [path(t, _CODE_TEXT.M85_250_Q115_470_255_470_Q400_470_430_250Z, c(_CODE_TEXT.CLOTH)), ell(t, 255, 250, 172, 40, c(_CODE_TEXT.EARTH2)), ell(t, 255, 245, 145, 30, c(_CODE_TEXT.PAPER))]
        if shape == _CODE_TEXT.DIPPER:
            items += [line(t, 390, 280, 470, 65, c(_CODE_TEXT.WOOD), 25)]
        else:
            items += [path(t, _CODE_TEXT.M110_245_Q165_100_255_155_Q335_95_400_245Z, c(_CODE_TEXT.CLOTH))]
    elif shape in (_CODE_TEXT.BAR, _CODE_TEXT.FLUTE, _CODE_TEXT.PIPE, _CODE_TEXT.CHISEL, _CODE_TEXT.SWORD, _CODE_TEXT.SPADE):
        if shape == _CODE_TEXT.BAR:
            items = [rect(t, 220, 45, 70, 425, c(_CODE_TEXT.WOOD), rx=8)]
        elif shape == _CODE_TEXT.FLUTE:
            items = [rect(t, 220, 45, 70, 425, c(_CODE_TEXT.BAMBOO), rx=8)] + [circ(t, 255, y, 10, c(_CODE_TEXT.DARK)) for y in range(120, 430, 48)]
        elif shape == _CODE_TEXT.PIPE:
            items = [rect(t, 200, 100, 110, 370, c(_CODE_TEXT.BAMBOO), rx=8), ell(t, 255, 100, 55, 20, c(_CODE_TEXT.DARK)), line(t, 300, 250, 415, 155, c(_CODE_TEXT.WOOD), 30)]
        elif shape == _CODE_TEXT.CHISEL:
            items = [rect(t, 195, 45, 120, 200, c(_CODE_TEXT.WOOD), rx=16), rect(t, 225, 245, 60, 220, c(_CODE_TEXT.STONE))]
        elif shape == _CODE_TEXT.SWORD:
            items = [poly(t, [(245, 25), (290, 95), (280, 350), (230, 350), (220, 95)], c(_CODE_TEXT.WOOD2)), rect(t, 155, 340, 200, 30, c(_CODE_TEXT.RED)), rect(t, 235, 370, 40, 100, c(_CODE_TEXT.WOOD))]
        else:
            items = [ell(t, 255, 80, 85, 55, _CODE_TEXT.NONE), rect(t, 240, 120, 30, 220, c(_CODE_TEXT.WOOD)), path(t, _CODE_TEXT.M150_330_L360_330_L340_435_L255_480_L170_435Z, c(_CODE_TEXT.STONE))]
    elif shape == _CODE_TEXT.COMB:
        items = [rect(t, 75, 160, 360, 70, c(_CODE_TEXT.WOOD), rx=12)] + [rect(t, x, 225, 12, 150, c(_CODE_TEXT.WOOD2)) for x in range(80, 430, 24)]
    elif shape == _CODE_TEXT.TABLET:
        items = [rect(t, 145, 75, 220, 340, c(_CODE_TEXT.WOOD), rx=25), rect(t, 180, 115, 150, 240, c(_CODE_TEXT.GOLD)), rect(t, 95, 420, 320, 50, c(_CODE_TEXT.WOOD2))] + [line(t, 255, y, 255, y + 22, c(_CODE_TEXT.RED), 10) for y in (155, 215, 275)]
    elif shape == _CODE_TEXT.BALANCE:
        items = [rect(t, 190, 435, 130, 35, c(_CODE_TEXT.WOOD)), line(t, 255, 435, 255, 120, c(_CODE_TEXT.GOLD), 18), line(t, 70, 160, 440, 160, c(_CODE_TEXT.GOLD), 10)]
        for x in (100, 410):
            items += [line(t, x, 160, x - 55, 340, c(_CODE_TEXT.DARK), 3), line(t, x, 160, x + 55, 340, c(_CODE_TEXT.DARK), 3), path(t, _CODE_TEXT.M_S_340_Q_S_430_S_340Z % (x - 70, x, x + 70), c(_CODE_TEXT.GOLD))]
    elif shape == _CODE_TEXT.BUNDLE:
        items = [poly(t, [(90, 280), (185, 120), (335, 120), (430, 280), (385, 470), (135, 470)], c(_CODE_TEXT.CLOTH)), path(t, _CODE_TEXT.M90_280_Q255_370_430_280, _CODE_TEXT.NONE, True, sw=6), line(t, 185, 120, 335, 470, c(_CODE_TEXT.WOOD2), 5)]
    elif shape == _CODE_TEXT.PAPER_BOAT:
        items = [poly(t, [(45, 290), (465, 290), (370, 450), (145, 450)], c(_CODE_TEXT.PAPER)), poly(t, [(165, 285), (255, 100), (345, 285)], c(_CODE_TEXT.CLOTH)), line(t, 255, 100, 255, 290, c(_CODE_TEXT.WOOD2), 4)]
    elif shape == _CODE_TEXT.FAN:
        items = [poly(t, [(255, 470), (70, 170), (160, 70), (355, 70), (445, 170)], c(_CODE_TEXT.WOVEN)), line(t, 255, 470, 255, 95, c(_CODE_TEXT.WOOD), 9)] + [line(t, 255, 430, x, 130, c(_CODE_TEXT.WOVEN2), 3) for x in (100, 180, 330, 410)]
    elif shape == _CODE_TEXT.RATTLE:
        items = [rect(t, 235, 280, 40, 190, c(_CODE_TEXT.WOOD)), circ(t, 255, 195, 110, c(_CODE_TEXT.RED)), circ(t, 255, 195, 65, c(_CODE_TEXT.GOLD))]
    elif shape == _CODE_TEXT.BELL:
        items = [rect(t, 235, 55, 40, 130, c(_CODE_TEXT.WOOD)), path(t, _CODE_TEXT.M170_200_Q255_135_340_200_L400_410_L110_410Z, c(_CODE_TEXT.GOLD)), ell(t, 255, 410, 145, 35, c(_CODE_TEXT.WOOD2)), circ(t, 255, 435, 25, c(_CODE_TEXT.GOLD))]
    elif shape == _CODE_TEXT.LAMP:
        from props import oil_lamp
        items = [ell(t, 255, 470, 200, 28, c(_CODE_TEXT.STONE))] + oil_lamp(t)
    else:
        raise ValueError(shape)
    return psvg(t, items)
