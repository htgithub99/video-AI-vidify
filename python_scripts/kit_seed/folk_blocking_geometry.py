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
    sy = seat if kind == "sit" and seat is not None else y
    result = dict(key=key, kind=kind, x=x, y=y, fixture=fixture, label=F.CONTACT % (kind, fixture), bounds=[x - 45, sy - 12, 90, 24])
    if ground_y is not None:
        result["groundY"] = ground_y
    if seat is not None:
        result["seatY"] = seat
    if face:
        result["face"] = face
    if relation:
        result["relation"] = relation
    return result


def composition(kind, **roles):
    return dict(key=kind + "_" + "_".join(roles.values()), kind=kind, roles=roles)


def mat(t, x, y, w=600):
    return [rect(t, x - w / 2, y, w, 70, t.c("woven"), rx=7), rect(t, x - w / 2 + 16, y - 18, 110, 35, t.c("cloth"), rx=8)] + [line(t, xx, y + 4, xx, y + 64, t.c("woven2"), 2) for xx in range(int(x - w / 2 + 145), int(x + w / 2 - 10), 35)]


def cradle(t):
    return [rect(t, 670, 730, 590, 28, t.c("wood2")), rect(t, 690, 758, 30, 210, t.c("wood")), rect(t, 1210, 758, 30, 210, t.c("wood")), rect(t, 695, 700, 540, 30, t.c("cloth"), rx=10), rect(t, 710, 676, 85, 24, t.c("cloth"), rx=8)]


def daybed(t):
    return [rect(t, 580, 650, 720, 30, t.c("woven")), rect(t, 585, 680, 30, 300, t.c("wood")), rect(t, 1260, 680, 30, 300, t.c("wood")), rect(t, 570, 670, 740, 30, t.c("wood2"))]


def stair_shapes(t):
    out = [rect(t, 370, 620, 650, 35, t.c("wood")), rect(t, 380, 655, 30, 325, t.c("post")), rect(t, 970, 655, 30, 325, t.c("post"))]
    for i in range(6):
        out += [rect(t, 1000 + i * 72, 620 + i * 60, 110, 28, t.c("wood2"))]
    return out


def ferry_shapes(t, front=False):
    if front:
        return [poly(t, [(370, 940), (1510, 940), (1360, 1020), (490, 1020)], t.c("wood2"))]
    return [poly(t, [(330, 850), (1560, 850), (1510, 940), (370, 940)], t.c("wood")), rect(t, 560, 850, 630, 28, t.c("wood2"))]


def ritual_table(t):
    return [rect(t, 580, 810, 760, 30, t.c("wood")), rect(t, 610, 840, 700, 140, t.c("red")), rect(t, 610, 955, 700, 20, t.c("gold"))]


def hearth(t, x, base):
    return [rect(t, x - 160, base - 80, 320, 80, t.c("brick")), line(t, x - 160, base - 40, x + 160, base - 40, t.c("brick2"), 4), line(t, x - 80, base - 80, x - 80, base - 40, t.c("brick2"), 4), line(t, x + 80, base - 80, x + 80, base - 40, t.c("brick2"), 4), rect(t, x - 45, base - 50, 90, 50, t.c("dark")), ell(t, x, base - 80, 100, 10, t.c("dark"))]


def swap_sides(value):
    return re.sub(r"(?<![a-z])(left|right)(?![a-z])", lambda match: "right" if match[0] == "left" else "left", value)


def scene(row, style, night=False, mirror=False):
    t = T(style, night, seed=31)
    family = row["family"]
    inside = row["interior"]
    sk = [] if inside else sky(t, 720)
    back, floor = room(t, 720) if inside else (mountains(t, 720), ground(t, 720, "earth", 3))
    spots, groups, occ, lights, mid = [], [], [], [], []
    add = spots.append
    comp = groups.append
    if inside:
        back += modern_door(t, 1650, 720) + modern_window(t, 130, 180, 300, 240)
    if family == "patients":
        floor += [group("sleeping_mat_left", mat(t, 470, 920)), group("sleeping_mat_right", mat(t, 1430, 920))]
        add(contact("sleeping_mat_left_lie", "lie", 470, 920, "sleeping_mat_left", ground_y=980, face="right"))
        add(contact("sleeping_mat_right_lie", "lie", 1430, 920, "sleeping_mat_right", ground_y=980, face="right"))
        add(contact("between_sleeping_mats", "stand", 960, 1000, "sleeping_mat", ground_y=1000, relation="between"))
        comp(composition("two_patients", patient_left="sleeping_mat_left_lie", patient_right="sleeping_mat_right_lie", caregiver="between_sleeping_mats"))
        comp(composition("bedside", patient="sleeping_mat_left_lie", caregiver="between_sleeping_mats"))
        if row["key"] == "stilt_hearth_patients":
            mid += [group("hearth", hearth(t, 250, 770))]
            back += [group("roof_beam", [rect(t, 0, 100, 1920, 25, t.c("beam"))]), line(t, 1540, 125, 1540, 560, t.c("dark"), 6)]
            add(contact("hanging_pot", "hang", 1540, 560, "roof_beam"))
            add(contact("hearth_top", "surface", 250, 690, "hearth"))
    elif family in ("bedside", "hospital", "mourning"):
        bed = hospital_bed(t, 500, 960, 830) if family == "hospital" else low_bed(t, 500, 960, 830)
        floor += [group("bier" if family == "mourning" else "bed", bed), group("visitor_chair", chair(t, 1650, 1000))]
        top = 810 if family == "hospital" else 836
        add(contact("bed_lie", "lie", 860, top, "bier" if family == "mourning" else "bed", ground_y=960, face="right"))
        add(contact("beside_bed_head", "stand", 280, 1000, "bed", ground_y=1000, relation="beside"))
        add(contact("visitor_chair_sit", "sit", 1650, 1000, "chair", seat=885, ground_y=1000))
        kind, patient, caregiver = ("mourning", "deceased", "mourner") if family == "mourning" else ("bedside", "patient", "caregiver")
        comp(composition(kind, **{patient:"bed_lie", caregiver:"beside_bed_head"}))
        comp(composition(kind, **{patient:"bed_lie", caregiver:"visitor_chair_sit"}))
        back += wall_altar_shelf(t, 960, 300) if family == "mourning" else []
    elif family == "grooming":
        floor += [group("groomer_bench", bench(t, 560, 865, 330, 115)), group("subject_chair", chair(t, 920, 1000))]
        add(contact("groomer_bench_sit", "sit", 730, 865, "bench", seat=750, ground_y=865))
        add(contact("groomer_behind", "stand", 730, 865, "subject_chair", ground_y=865, relation="behind"))
        add(contact("subject_chair_sit", "sit", 920, 1000, "chair", seat=885, ground_y=1000))
        comp(composition("grooming", subject="subject_chair_sit", groomer="groomer_bench_sit"))
        comp(composition("grooming", subject="subject_chair_sit", groomer="groomer_behind"))
    elif family in ("stairs", "bell"):
        mid += [group("raised_house", house_tile(t, 350, 620, 700, 220)), group("landing_stairs", stair_shapes(t))]
        if family == "bell":
            mid += [group("temple_bell", [line(t, 950, 280, 950, 400, t.c("wood"), 12), path(t, "M870 510 Q870 410 950 400 Q1030 410 1030 510Z", t.c("gold")), ell(t, 950, 510, 80, 16, t.c("wood2"))])]
            add(contact("temple_bell_hang", "hang", 950, 400, "temple_bell"))
        add(contact("upper_landing", "stand", 700, 620, "landing", ground_y=990))
        add(contact("below_stairs", "stand", 1520, 1000, "stairs", ground_y=1000, relation="below"))
        comp(composition("stairs", upper="upper_landing", lower="below_stairs"))
    elif family in ("rafters", "scaffold"):
        mid += [group("wooden_column", [rect(t, 1110, 120, 38, 860, t.c("post"))]), group("roof_beam", [rect(t, 0, 110, 1920, 40, t.c("beam"))])]
        floor += [group("daybed" if family == "rafters" else "scaffold", daybed(t))]
        add(contact("raised_platform_stand", "stand", 940, 650, "daybed" if family == "rafters" else "scaffold", ground_y=980))
        add(contact("observer_below", "stand", 350, 1010, "daybed" if family == "rafters" else "scaffold", ground_y=1010, relation="beside"))
        comp(composition("rafters", climber="raised_platform_stand", observer="observer_below"))
    elif family == "cradle":
        floor += [group("cradle", cradle(t))]
        occ += [(970, [rect(t, 670, 760, 590, 18, t.c("wood2"))] + [rect(t, x, 778, 12, 62, t.c("wood")) for x in range(690, 1250, 50)])]
        add(contact("cradle_lie", "lie", 950, 700, "cradle", ground_y=970, face="right"))
        add(contact("beside_cradle", "stand", 400, 1000, "cradle", ground_y=1000, relation="beside"))
        comp(composition("cradle", infant="cradle_lie", caregiver="beside_cradle"))
    elif family in ("ritual", "counter", "repair", "cards"):
        if family == "ritual":
            furniture = ritual_table(t)
            back += wall_altar_shelf(t, 960, 300)
        else:
            furniture = table(t, 520, 980, 860, 170)
            if family in ("counter", "repair"):
                furniture += [rect(t, 530, 835, 840, 140, t.c("wood2"))]
            if family == "counter":
                back += goods_shelves(t, 510, 180, 850, 3)
            elif family == "repair":
                back += [rect(t, 600, 150, 700, 570, t.c("stone2"))] + [line(t, 600, y, 1300, y, t.c("stone"), 3) for y in range(170, 710, 40)]
            else:
                floor += chair(t, 750, 900) + chair(t, 1500, 1010)
        occ += [(980, [group("offering_table" if family == "ritual" else "counter" if family in ("counter", "repair") else "card_table", furniture)])]
        add(contact("behind_table", "stand", 940, 880, "table" if family == "ritual" else "counter", ground_y=880, relation="behind"))
        add(contact("front_visitor", "stand", 350, 1030, "table" if family == "ritual" else "counter", ground_y=1030, relation="before"))
        for x, side in ((740,"left"),(960,"center"),(1180,"right")):
            add(contact("table_top_" + side, "surface", x, 810, "table"))
        if family == "cards":
            add(contact("player_left", "sit", 750, 900, "chair", seat=785, ground_y=900))
            add(contact("player_right", "sit", 1500, 1010, "chair", seat=895, ground_y=1010))
            comp(composition("conversation", host="player_left", guest="player_right"))
        else:
            comp(composition("ritual", officiant="behind_table", visitor="front_visitor") if family == "ritual" else composition("counter", seller="behind_table", customer="front_visitor"))
    elif family == "conversation":
        floor += [group("chair_left", chair(t, 490, 980)), group("chair_right", chair(t, 1430, 980)), group("tea_table", table(t, 730, 970, 460, 180))]
        back += wall_altar_shelf(t, 960, 320)
        add(contact("chair_left_sit", "sit", 490, 980, "chair_left", seat=865, ground_y=980))
        add(contact("chair_right_sit", "sit", 1430, 980, "chair_right", seat=865, ground_y=980))
        add(contact("tea_table_top", "surface", 960, 790, "tea_table"))
        comp(composition("conversation", host="chair_left_sit", guest="chair_right_sit"))
    elif family == "doorway":
        mid += [group("threshold", [rect(t, 1450, 300, 270, 600, t.c("door")), rect(t, 1435, 900, 300, 25, t.c("wood"))])]
        floor += [group("bed", low_bed(t, 250, 980, 650))]
        add(contact("inside_room", "stand", 1120, 1020, "room", ground_y=1020))
        add(contact("outside_threshold", "door", 1580, 900, "door", ground_y=900))
        add(contact("bed_lie", "lie", 540, 856, "bed", ground_y=980, face="right"))
        comp(composition("doorway", inside="inside_room", outside="outside_threshold"))
    elif family in ("rescue", "boat", "bridge"):
        floor = [rect(t, 0, 720, 1920, 360, t.c("water"), False)]
        for y in (760,820,900,990):
            floor += [line(t, 40, y, 1880, y, t.c("water2"), 3)]
        if family == "boat":
            floor += [group("ferry", ferry_shapes(t))]
            occ += [(1030, ferry_shapes(t, True))]
            add(contact("rower_deck", "stand", 590, 940, "boat", ground_y=1000))
            add(contact("passenger_seat", "sit", 1130, 950, "boat", seat=850, ground_y=1000))
            comp(composition("boat", rower="rower_deck", passenger="passenger_seat"))
        elif family == "bridge":
            floor += [poly(t, [(0,850),(320,850),(520,1080),(0,1080)],t.c("earth")), poly(t, [(1600,850),(1920,850),(1920,1080),(1430,1080)], t.c("earth")), group("bridge", [rect(t, 300, 860, 1350, 40, t.c("wood"))] + [line(t, x, 865, x, 900, t.c("wood2"), 3) for x in range(310,1640,55)])]
            add(contact("bridge_left", "stand", 660, 860, "bridge", ground_y=990))
            add(contact("bridge_right", "stand", 1260, 860, "bridge", ground_y=990))
            comp(composition("search", leader="bridge_left", companion="bridge_right"))
        else:
            floor += [poly(t, [(0,760),(1200,810),(1450,1080),(0,1080)],t.c("earth")), group("river_rock", [ell(t, 780, 955, 350, 45, t.c("rock"))])]
            add(contact("rock_survivor_lie", "lie", 780, 925, "rock", ground_y=1000, face="right"))
            add(contact("bank_rescuer", "stand", 280, 1020, "riverbank", ground_y=1020))
            comp(composition("river_rescue", survivor="rock_survivor_lie", rescuer="bank_rescuer"))
    elif family == "hammock":
        back += [group("hammock_trees", [rect(t, 330, 0, 35, 1000, t.c("trunk")), rect(t, 1410, 0, 35, 1000, t.c("trunk"))])]
        floor += [group("hammock", [path(t, "M350 720 Q880 980 1430 720 L1410 790 Q880 1010 370 790Z", t.c("cloth"))])]
        add(contact("hammock_lie", "lie", 880, 850, "hammock", ground_y=990, face="right"))
        add(contact("hammock_companion", "stand", 200, 1010, "hammock", ground_y=1010, relation="beside"))
        comp(composition("bedside", patient="hammock_lie", caregiver="hammock_companion"))
    elif family == "teaching":
        back += [group("chalkboard", [rect(t, 1180, 200, 600, 270, t.c("tree2"))])]
        floor += [group("pupil_bench", bench(t, 380, 980, 650, 115))]
        add(contact("pupil_bench_sit", "sit", 690, 980, "bench", seat=865, ground_y=980))
        add(contact("teacher_board", "stand", 1510, 980, "chalkboard", ground_y=980))
        comp(composition("teaching", teacher="teacher_board", pupil="pupil_bench_sit"))
    elif family == "kitchen":
        floor += [group("hearth", hearth(t, 650, 1000)), group("jar_shelf", bench(t, 1280, 860, 380, 240))]
        add(contact("cook_beside_hearth", "stand", 1050, 1000, "hearth", ground_y=1000, relation="beside"))
        add(contact("hearth_top", "surface", 650, 920, "hearth"))
        add(contact("jar_shelf_top", "surface", 1470, 620, "shelf"))
    else:
        if family == "canopy":
            back += house_tile(t, 420, 720, 1100, 240)
            back += [group("funeral_canopy", [rect(t, 460, 400, 25, 500, t.c("cloth")), rect(t, 1420, 400, 25, 500, t.c("cloth")), poly(t, [(420,400),(960,210),(1490,400)], t.c("cloth")), rect(t, 500, 400, 880, 90, t.c("cloth"))])]
        elif family == "village":
            for x in (20,720,1390):
                back += stilt_house(t, x, 730, 480, 170, 160)
        elif family in ("bamboo", "well"):
            for x in (60,140,230,1580,1680,1810):
                back += [line(t, x, 730, x + 20, 140, t.c("bamboo"), 18)] + [line(t, x, y, x + 70, y - 60, t.c("leaf"), 8) for y in (250,400,550)]
            if family == "well":
                floor += [group("well", [rect(t, 710, 770, 500, 180, t.c("stone")), ell(t, 960, 770, 250, 70, t.c("stone2")), ell(t, 960, 770, 190, 45, t.c("dark"))])]
                add(contact("well_rim", "surface", 1170, 775, "well"))
            else:
                floor += [group("offering_stump", [rect(t, 1300, 820, 220, 140, t.c("wood"))])]
                add(contact("bowl_stump_surface", "surface", 1410, 820, "stump"))
        elif family in ("shrine", "grave", "field"):
            if family == "shrine":
                back += banyan(t, 1460, 760, 0.85) + house_tile(t, 1260, 810, 340, 150, doors=1)
            else:
                if family == "field":
                    back += [rect(t, 0, 600, 1920, 170, t.c("field"))] + [line(t,x,600,x-70,770,t.c("field2"),4) for x in range(0,1920,80)]
                floor += [group("grave_mound", [ell(t, 1470, 870, 300, 95, t.c("mound")), rect(t, 1430, 680, 85, 170, t.c("stone"), rx=22)])]
        else:
            back += round_tree(t, 180, 760, 1.2) + round_tree(t, 1700, 760, 1.4)
            if family == "banana":
                back += thatch_house(t, 1280, 750, 430)
                for x in (120,400):
                    back += [rect(t,x,450,22,300,t.c("bamboo"))] + [ell(t,x+dx,420-dy,150,30,t.c("leaf")) for dx,dy in ((-90,0),(90,0),(0,80))]
        add(contact("left_ground", "stand", 560, 1000, "ground", ground_y=1000))
        add(contact("right_ground", "stand", 1160, 1000, "ground", ground_y=1000))
        comp(composition("search", leader="left_ground", companion="right_ground"))
        comp(composition("watching", watcher="left_ground", subject="right_ground"))
    spots += [contact("front_left", "stand", 200, 1040, ground_y=1040), contact("front_center", "stand", 960, 1040, ground_y=1040), contact("front_right", "stand", 1720, 1040, ground_y=1040), contact("floor_object", "open", 1500, 1020)]
    if mirror:
        sk, back, floor, mid = ([F.MIRROR % swap_sides("".join(layer))] for layer in (sk, back, floor, mid))
        occ = [(depth, [F.MIRROR % swap_sides("".join(shapes))]) for depth, shapes in occ]
        for spot in spots:
            spot["x"] = 1920 - spot["x"]
            spot["bounds"][0] = 1920 - spot["bounds"][0] - spot["bounds"][2]
            for key in ("key", "fixture", "label"):
                spot[key] = swap_sides(spot[key])
            if "face" in spot:
                spot["face"] = "left" if spot["face"] == "right" else "right"
        groups = [dict(key=swap_sides(item["key"]), kind=item["kind"], roles={swap_sides(role): swap_sides(key) for role, key in item["roles"].items()}) for item in groups]
    image = svg(t, sk, back, mid, floor, [], occ="".join(F.OCC % (depth, "".join(shapes)) for depth, shapes in occ))
    return dict(svg=image, spots=spots, compositions=groups, floorY=1060, horizonY=720, lights=lights)


def prop(row, style):
    t = T(style)
    c = lambda key: t.c(key)
    shape = row["shape"]
    items = []
    if shape == "scissors":
        items = [ell(t,150,370,65,80,"none"),ell(t,360,370,65,80,"none"),line(t,185,305,380,70,c("stone"),22),line(t,325,305,125,70,c("stone"),22),circ(t,255,245,14,c("dark"))]
    elif shape == "cutter":
        items = [path(t,"M110 270 Q250 40 395 270 L330 295 Q255 145 170 295Z",c("stone")),line(t,160,280,105,455,c("wood"),32),line(t,350,280,405,455,c("wood"),32),circ(t,255,220,15,c("gold"))]
    elif shape in ("thread", "cards", "ledger", "cloth"):
        if shape == "thread":
            items = [ell(t,256,300,160,90,c("red"),False),ell(t,256,300,110,50,c("paper"),False),spath("M400 340 Q470 420 280 470", c("red"), 9)]
        elif shape == "cards":
            for i in range(4):
                items += [rect(t,80+i*78,180+i*22,112,210,c("cloth"),rx=9),poly(t,[(120+i*78,240+i*22),(135+i*78,260+i*22),(120+i*78,280+i*22),(105+i*78,260+i*22)], c("red"))]
        else:
            items = [rect(t,90,100,330,370,c("paper") if shape == "ledger" else c("cloth"),rx=10),line(t,170,100,170,470,c("wood2"),8)]
            if shape == "ledger":
                items += [line(t,205,y,375,y,c("wood2"),4) for y in range(160,430,45)]
    elif shape in ("betel", "rice_salt"):
        items = [ell(t,256,390,210,72,c("gold"))]
        if shape == "betel":
            items += [poly(t,[(110,375),(180,180),(270,360)],c("leaf")),ell(t,330,340,55,65,c("earth")),ell(t,400,360,35,45,c("red"))]
        else:
            items += [ell(t,170,370,65,30,c("cloth")),ell(t,340,370,65,30,c("paper"))]
    elif shape == "gong":
        items = [circ(t,235,250,185,c("gold")),circ(t,235,250,95,c("wood2")),circ(t,235,250,40,c("gold")),line(t,420,450,330,230,c("wood"),22),circ(t,330,230,30,c("cloth"))]
    elif shape in ("pig", "tiger"):
        color = c("dark") if shape == "pig" else c("gold")
        items = [ell(t,245,300,170,95,color),circ(t,390,255,70,color),poly(t,[(345,215),(350,145),(390,195)],color),poly(t,[(400,195),(445,145),(450,235)],color),circ(t,405,245,9,c("cloth")),circ(t,405,245,4,c("dark")),line(t,100,310,40,190,color,15)]
        for x in (140,220,310,385):
            items += [rect(t,x,355,22,115,color)]
        if shape == "pig":
            items += [ell(t,450,280,40,28,c("earth2")),circ(t,447,280,5,c("dark")),circ(t,463,280,5,c("dark"))]
            for x in range(365,416,10):
                items += [rect(t,x,454,8,20,c("stone"))]
        else:
            for x in (135,190,245,300):
                items += [poly(t,[(x,220),(x+20,220),(x+38,305),(x+14,280)],c("dark"))]
            items += [line(t,425,270,450,275,c("dark"),5)]
    elif shape in ("jar", "basket", "trap", "brazier"):
        color = c("woven") if shape in ("basket","trap") else c("earth")
        items = [path(t,"M140 140 Q60 260 125 460 L385 460 Q450 260 370 140Z",color),ell(t,255,140,115,35,c("wood2"))]
        if shape in ("basket","trap"):
            items += [line(t,x,175,x,445,c("woven2"),3) for x in range(145,380,28)] + [line(t,130,y,385,y,c("woven2"),3) for y in range(220,450,35)]
            if shape == "trap":
                items += [ell(t,255,140,60,23,c("dark"))]
        elif shape == "jar":
            items += [poly(t,[(115,115),(390,115),(425,200),(320,175),(270,210),(200,175),(100,200)],c("cloth")),line(t,120,175,400,175,c("red"),9)]
        else:
            items += [ell(t,255,140,90,25,c("dark")),poly(t,[(180,140),(220,50),(245,140)],c("fire")),poly(t,[(260,140),(300,35),(330,140)],c("fire")),rect(t,210,340,90,80,c("dark"))]
    elif shape in ("bowl", "dipper"):
        items = [path(t,"M85 250 Q115 470 255 470 Q400 470 430 250Z",c("cloth")),ell(t,255,250,172,40,c("earth2")),ell(t,255,245,145,30,c("paper"))]
        if shape == "dipper":
            items += [line(t,390,280,470,65,c("wood"),25)]
        else:
            items += [path(t,"M110 245 Q165 100 255 155 Q335 95 400 245Z",c("cloth"))]
    elif shape in ("bar", "flute", "pipe", "chisel", "sword", "spade"):
        if shape == "bar":
            items = [rect(t,220,45,70,425,c("wood"),rx=8)]
        elif shape == "flute":
            items = [rect(t,220,45,70,425,c("bamboo"),rx=8)] + [circ(t,255,y,10,c("dark")) for y in range(120,430,48)]
        elif shape == "pipe":
            items = [rect(t,200,100,110,370,c("bamboo"),rx=8),ell(t,255,100,55,20,c("dark")),line(t,300,250,415,155,c("wood"),30)]
        elif shape == "chisel":
            items = [rect(t,195,45,120,200,c("wood"),rx=16),rect(t,225,245,60,220,c("stone"))]
        elif shape == "sword":
            items = [poly(t,[(245,25),(290,95),(280,350),(230,350),(220,95)],c("wood2")),rect(t,155,340,200,30,c("red")),rect(t,235,370,40,100,c("wood"))]
        else:
            items = [ell(t,255,80,85,55,"none"),rect(t,240,120,30,220,c("wood")),path(t,"M150 330 L360 330 L340 435 L255 480 L170 435Z",c("stone"))]
    elif shape == "comb":
        items = [rect(t,75,160,360,70,c("wood"),rx=12)] + [rect(t,x,225,12,150,c("wood2")) for x in range(80,430,24)]
    elif shape == "tablet":
        items = [rect(t,145,75,220,340,c("wood"),rx=25),rect(t,180,115,150,240,c("gold")),rect(t,95,420,320,50,c("wood2"))] + [line(t,255,y,255,y+22,c("red"),10) for y in (155,215,275)]
    elif shape == "balance":
        items = [rect(t,190,435,130,35,c("wood")),line(t,255,435,255,120,c("gold"),18),line(t,70,160,440,160,c("gold"),10)]
        for x in (100,410):
            items += [line(t,x,160,x-55,340,c("dark"),3),line(t,x,160,x+55,340,c("dark"),3),path(t,"M%s 340 Q%s 430 %s 340Z" % (x-70,x,x+70),c("gold"))]
    elif shape == "bundle":
        items = [poly(t,[(90,280),(185,120),(335,120),(430,280),(385,470),(135,470)],c("cloth")),path(t,"M90 280 Q255 370 430 280","none",True,sw=6),line(t,185,120,335,470,c("wood2"),5)]
    elif shape == "paper_boat":
        items = [poly(t,[(45,290),(465,290),(370,450),(145,450)],c("paper")),poly(t,[(165,285),(255,100),(345,285)],c("cloth")),line(t,255,100,255,290,c("wood2"),4)]
    elif shape == "fan":
        items = [poly(t,[(255,470),(70,170),(160,70),(355,70),(445,170)],c("woven")),line(t,255,470,255,95,c("wood"),9)] + [line(t,255,430,x,130,c("woven2"),3) for x in (100,180,330,410)]
    elif shape == "rattle":
        items = [rect(t,235,280,40,190,c("wood")),circ(t,255,195,110,c("red")),circ(t,255,195,65,c("gold"))]
    elif shape == "bell":
        items = [rect(t,235,55,40,130,c("wood")),path(t,"M170 200 Q255 135 340 200 L400 410 L110 410Z",c("gold")),ell(t,255,410,145,35,c("wood2")),circ(t,255,435,25,c("gold"))]
    elif shape == "lamp":
        from props import oil_lamp
        items = [ell(t,255,470,200,28,c("stone"))] + oil_lamp(t)
    else:
        raise ValueError(shape)
    return psvg(t, items)
