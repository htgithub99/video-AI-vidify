from seed_texts import SeedText as KST
from interior import *
from core import path as base_path
from core import ell as base_ell
def path(t, d, fill, stroke=True, sw=None, extra=KST.EMPTY, color=None):
    value = base_path(t, d, fill, stroke, sw, extra)
    return value.replace(KST.STROKE_S % t.line, KST.STROKE_S % color) if color else value
def ell(t, x, y, rx, ry, fill, stroke=True, sw=None, extra=KST.EMPTY, color=None):
    value = base_ell(t, x, y, rx, ry, fill, stroke, sw, extra)
    return value.replace(KST.STROKE_S % t.line, KST.STROKE_S % color) if color else value
def open_book(t):
    out = [path(t, KST.M256_170_Q150_100_40_140_L40_440_Q160_400_256_470_Q352_400_472_440_L472_140, t.c(KST.PAPER)), line(t, 256, 170, 256, 470, t.line, 6)]
    for y in (220, 260, 300, 340, 380):
        out += [line(t, 75, y, 220, y + 15, t.c(KST.WOOD), 3), line(t, 292, y + 15, 437, y, t.c(KST.WOOD), 3)]
    return out
def blue_sandals(t):
    out = []
    for x in (145, 365):
        out += [ell(t, x, 320, 85, 154, KST.VALUE_447792, True), path(t, KST.M_S_360_Q_S_180_S_250_M_S_250_L_S_180 % (x - 65, x - 45, x + 65, x, x), KST.NONE, True, color=KST.VALUE_24465E, sw=24)]
    return out
def oar(t):
    return [poly(t, [(244, 24), (267, 24), (267, 330), (310, 380), (298, 480), (214, 480), (202, 380), (244, 330)], t.c(KST.WOOD), True), line(t, 256, 380, 256, 465, t.c(KST.WOOD2), 5)]
def ritual_nails(t):
    out = []
    for x in (120, 256, 392):
        out += [rect(t, x - 42, 110, 84, 22, KST.VALUE_92999E, True), poly(t, [(x - 12, 132), (x + 12, 132), (x + 10, 405), (x, 480), (x - 10, 405)], KST.B7BDC1, True)]
    return out
def red_thread(t, broken=False):
    d = KST.M25_410_Q110_180_200_280_L235_300_M280_330_L312_350_Q400_420_485_160 if broken else KST.M25_410_Q110_180_200_280_Q320_430_485_160
    return [path(t, d, KST.NONE, True, color=t.c(KST.RED), sw=12)]
def hair_jar(t):
    return [
        path(t, KST.M150_100_L362_100_L362_170_Q455_220_420_450_L390_480_L122_480_L92_450_Q57_22, KST.B4C8BC, True),
        path(t, KST.M185_280_Q150_450_290_420_Q375_370_265_245_Q140_350_335_380, KST.NONE, True, color=KST.VALUE_28242A, sw=25),
        rect(t, 138, 70, 236, 40, t.c(KST.WOOD), True),
        line(t, 150, 146, 362, 146, t.c(KST.RED), 12),
        path(t, KST.M250_146_Q190_80_170_135_Q180_175_250_146_Q320_80_340_135_Q330_175_250_146_L, KST.NONE, True, color=t.c(KST.RED), sw=9),
    ]
def mortar_pestle(t):
    return [poly(t, [(260, 100), (302, 80), (430, 350), (380, 370)], t.c(KST.WOOD), True), path(t, KST.M60_280_Q256_220_452_280_L410_450_Q256_495_102_450Z, t.c(KST.STONE), True), ell(t, 256, 280, 196, 42, t.c(KST.STONE2), True)]
def wooden_chisel(t):
    return [rect(t, 206, 35, 100, 220, t.c(KST.WOOD), True, rx=20), rect(t, 221, 240, 70, 190, KST.A8B1B7, True), poly(t, [(221, 430), (291, 430), (300, 480), (212, 480)], KST.D4DADE, True)]
def paper_tiger(t):
    out = [ell(t, 260, 290, 175, 95, t.c(KST.GOLD), True), circ(t, 380, 220, 86, t.c(KST.GOLD), True), circ(t, 340, 150, 27, t.c(KST.GOLD), True), circ(t, 424, 150, 27, t.c(KST.GOLD), True)]
    for x in (150, 230, 330, 400):
        out += [rect(t, x - 17, 335, 34, 140, t.c(KST.GOLD), True), line(t, x - 15, 380, x + 15, 400, t.line, 8)]
    for x in (150, 220, 290):
        out.append(path(t, KST.M_S_210_L_S_280_L_S_250 % (x, x + 35, x + 45), KST.NONE, True, color=t.line, sw=10))
    out += [circ(t, 360, 210, 8, t.line, False), circ(t, 409, 210, 8, t.line, False), ell(t, 385, 252, 16, 10, t.line, False), path(t, KST.M90_280_Q5_220_50_150, KST.NONE, True, color=t.c(KST.GOLD), sw=26)]
    return out
def ritual_seal(t):
    out = [ell(t, 256, 300, 240, 170, KST.NONE, True, color=t.c(KST.RED), sw=8), ell(t, 256, 300, 190, 130, KST.NONE, True, color=t.c(KST.RED), sw=5)]
    for angle in range(0, 360, 45):
        x = 256 + 215 * math.cos(math.radians(angle))
        y = 300 + 150 * math.sin(math.radians(angle))
        out += [line(t, x - 12, y - 8, x + 12, y + 8, t.c(KST.RED), 6), line(t, x + 12, y - 8, x - 12, y + 8, t.c(KST.RED), 6)]
    return out
def bamboo_mat(t):
    out = [rect(t, 24, 150, 464, 330, t.c(KST.WOVEN), True, rx=8)]
    for x in range(42, 480, 18):
        out.append(line(t, x, 160, x, 470, t.c(KST.WOVEN2), 3))
    for y in (180, 450):
        out.append(line(t, 28, y, 484, y, t.c(KST.RED), 6))
    return out
def pith_helmet(t):
    return [path(t, KST.M60_360_Q75_100_256_90_Q437_100_452_360Z, KST.VALUE_73815A, True), ell(t, 256, 360, 240, 60, KST.VALUE_64724B, True), path(t, KST.M135_365_Q256_480_380_365, KST.NONE, True, color=t.c(KST.WOOD), sw=9), circ(t, 256, 290, 22, t.c(KST.GOLD), True)]
def pillow(t):
    return [rect(t, 20, 200, 472, 260, t.c(KST.CLOTH), True, rx=50), path(t, KST.M40_240_Q256_280_470_240_M40_420_Q256_380_470_420, KST.NONE, True, color=t.c(KST.WOVEN), sw=5)]
PROP_CATALOG = {
    KST.OPEN_BOOK: (open_book, 0.35, KST.TABLE, KST.SACH_MO, KST.OPEN_BOOK_WITH_VISIBLE_PAGES, [KST.SACH_MO_ALIAS, KST.MO_SO, KST.OPEN_BOOK]),
    KST.BLUE_SANDALS: (blue_sandals, 0.28, KST.FLOOR, KST.DOI_DEP_XANH, KST.PAIR_OF_BLUE_SANDALS, [KST.DEP, KST.DEP_XANH, KST.SANDALS]),
    KST.OAR: (oar, 1.5, KST.HELD, KST.MAI_CHEO, KST.LONG_WOODEN_BOAT_OAR, [KST.MAI_CHEO_ALIAS, KST.CHEO, KST.PADDLE]),
    KST.RITUAL_NAILS: (ritual_nails, 0.15, KST.TABLE, KST.DINH_SAT, KST.THREE_SEPARATE_IRON_NAILS_FOR_A_RITUAL, [KST.DINH, KST.DINH_SAT_ALIAS, KST.NAILS]),
    KST.RED_THREAD: (lambda t: red_thread(t), 0.6, KST.TABLE, KST.SOI_CHI_DO, KST.CONTINUOUS_UNBROKEN_RED_THREAD, [KST.CHI_DO, KST.DAY_DO, KST.RED_STRING]),
    KST.BROKEN_RED_THREAD: (lambda t: red_thread(t, True), 0.6, KST.TABLE, KST.CHI_DO_DUT, KST.TWO_RED_THREAD_ENDS_SEPARATED_BY_A_VISIBLE_GAP, [KST.CHI_DUT, KST.DAY_DUT, KST.BROKEN_THREAD]),
    KST.HAIR_JAR: (hair_jar, 0.35, KST.TABLE, KST.LO_TOC_BUOC_CHI, KST.GLASS_JAR_CONTAINING_HAIR_TIED_WITH_RED_THREAD, [KST.LO_TOC, KST.TOC, KST.HAIR_JAR]),
    KST.MORTAR_PESTLE: (mortar_pestle, 0.35, KST.TABLE, KST.COI_VA_CHAY, KST.STONE_MORTAR_WITH_A_WOODEN_PESTLE, [KST.COI, KST.CHAY, KST.MORTAR]),
    KST.WOODEN_CHISEL: (wooden_chisel, 0.3, KST.HELD, KST.CAI_DUC, KST.CARPENTER_CHISEL_WITH_A_WOODEN_HANDLE_AND_FLAT_METAL_BLADE, [KST.DUC, KST.CHISEL]),
    KST.PAPER_TIGER: (paper_tiger, 1.2, KST.FLOOR, KST.HO_GIAY, KST.PAPER_TIGER_EFFIGY_WITH_STRIPES_AND_FOUR_LEGS, [KST.HO_GIAY_ALIAS, KST.HO, KST.PAPER_TIGER]),
    KST.RITUAL_SEAL: (ritual_seal, 2.2, KST.FLOOR, KST.VONG_TRAN_PHAP, KST.RED_RITUAL_CIRCLE_LYING_FLAT_ON_THE_FLOOR, [KST.TRAN_PHAP, KST.VONG_BUA, KST.RITUAL_CIRCLE]),
    KST.BAMBOO_MAT: (bamboo_mat, 1.8, KST.FLOOR, KST.CHIEU_TRE, KST.WOVEN_BAMBOO_SLEEPING_MAT, [KST.CHIEU, KST.CHIEU_TRE_ALIAS, KST.MAT]),
    KST.PITH_HELMET: (pith_helmet, 0.3, KST.WEAR, KST.MU_COI, KST.OLIVE_PITH_HELMET, [KST.MU_COI_ALIAS, KST.HELMET]),
    KST.PILLOW: (pillow, 0.5, KST.TABLE, KST.GOI_NAM, KST.RECTANGULAR_WHITE_SLEEPING_PILLOW, [KST.GOI, KST.PILLOW]),
}
def cradle(t):
    out = [rect(t, 740, 780, 440, 46, t.c(KST.CLOTH), True, rx=14)]
    for x in (730, 1170):
        out += [rect(t, x, 680, 22, 240, t.c(KST.WOOD), True), path(t, KST.M_S_920_Q_S_960_S_920 % (x - 45, x + 11, x + 65), KST.NONE, True, sw=14)]
    for x in range(780, 1160, 55):
        out.append(rect(t, x, 760, 14, 120, t.c(KST.WOOD2), True))
    out += [rect(t, 720, 740, 470, 20, t.c(KST.WOOD), True), rect(t, 730, 865, 450, 20, t.c(KST.WOOD), True)]
    return out
def open_chest(t):
    return [poly(t, [(740, 770), (760, 540), (1160, 540), (1180, 770)], t.c(KST.WOOD), True), rect(t, 765, 570, 390, 170, t.c(KST.WOOD2), True), rect(t, 740, 770, 440, 150, t.c(KST.WOOD), True), ell(t, 960, 770, 220, 32, t.c(KST.DARK), True), rect(t, 942, 820, 36, 36, t.c(KST.GOLD), True)]
def attic_ladder(t):
    out = [rect(t, 1300, 200, 360, 140, t.c(KST.DARK), True), poly(t, [(1260, 920), (1290, 920), (1560, 320), (1530, 320)], t.c(KST.WOOD), True), poly(t, [(1460, 920), (1490, 920), (1760, 320), (1730, 320)], t.c(KST.WOOD), True)]
    for i in range(8):
        y = 860 - i * 70
        x = 1280 + i * 31
        out.append(line(t, x, y, x + 195, y, t.c(KST.WOOD2), 14))
    return out
def rowboat(t):
    return [path(t, KST.M540_820_L620_920_Q960_1040_1300_920_L1380_820Z, t.c(KST.WOOD), True), ell(t, 960, 820, 420, 48, t.c(KST.WOOD2), True), rect(t, 740, 800, 440, 25, t.c(KST.WOOD), True), path(t, KST.M600_900_Q960_1030_1320_900, KST.NONE, True, sw=5)]
def feeding_trough(t):
    return [poly(t, [(650, 790), (1200, 790), (1250, 840), (610, 840)], t.c(KST.WOOD2), True), poly(t, [(610, 840), (1250, 840), (1210, 930), (650, 930)], t.c(KST.WOOD), True), ell(t, 930, 815, 260, 20, t.c(KST.PAPER), True)]
def privacy_bush(t):
    return bush(t, 960, 940, 2.4)
def nursery_room(t):
    back, flo = room(t, 720)
    return dict(back=back, floor=flo + bed(t, 180, 930, 650), occ=[(900, cradle(t))])
def attic_room(t):
    back, flo = room(t, 720)
    return dict(back=back, floor=flo + attic_ladder(t) + open_chest(t))
def river_dock(t):
    back = mountains(t, 600) + [rect(t, 0, 600, 1920, 480, t.c(KST.WATER), False)]
    flo = [rect(t, 0, 880, 1920, 200, t.c(KST.EARTH), False)]
    for x in range(0, 900, 90):
        flo.append(rect(t, x, 760, 86, 160, t.c(KST.WOOD2), True))
    return dict(sky=sky(t, 620), back=back, floor=flo, occ=[(960, rowboat(t))])
def ritual_room(t):
    back, flo = room(t, 720)
    flo += bed(t, 700, 930, 520)
    flo += bench(t, 1480, 900, 180, 100)
    return dict(back=back, floor=flo, lights=[dict(x=1550, y=720, color=KST.FFCC88, kind=KST.LAMP)])
SCENE_CATALOG = {
    KST.NURSERY_ROOM: (nursery_room, KST.PHONG_CO_NOI_EM_BE, KST.BEDROOM_WITH_AN_ADULT_BED_ON_THE_LEFT_AND_A_SEPARATE_BABY_CRADLE_IN_THE_MIDD, True, [KST.NOI, KST.EM_BE, KST.PHONG_NGU, KST.CRADLE]),
    KST.ATTIC_ROOM: (attic_room, KST.GIAN_NHA_CO_GAC, KST.WOODEN_ROOM_WITH_A_LADDER_TO_AN_ATTIC_HATCH_AND_AN_OPEN_STORAGE_CHEST, True, [KST.GAC, KST.THANG, KST.RUONG, KST.ATTIC]),
    KST.RIVER_DOCK: (river_dock, KST.CAU_GO_VA_THUYEN, KST.OUTDOOR_WOODEN_RIVER_DOCK_AT_LEFT_WATER_AND_A_WOODEN_ROWBOAT_AT_RIGHT, False, [KST.CAU_GO, KST.BEN_SONG, KST.THUYEN, KST.DOCK, KST.RIVER]),
    KST.RITUAL_BEDROOM: (ritual_room, KST.GIAN_GIUONG_LAM_LE, KST.RITUAL_ROOM_WITH_A_WIDE_HORIZONTAL_BED_A_CLEAR_STANDING_AREA_AT_EITHER_END_A, True, [KST.GIUONG, KST.LAM_LE, KST.TRAN_PHAP, KST.RITUAL, KST.BED]),
}
SCENE_SPOTS = {
    KST.NURSERY_ROOM: [(KST.ADULT_BED, KST.LIE, 505, 810, KST.LYING_ON_THE_ADULT_BED), (KST.CRADLE_BABY, KST.LIE, 960, 780, KST.BABY_LYING_IN_THE_SEPARATE_CRADLE), (KST.BESIDE_BED, KST.STAND, 240, 960, KST.STANDING_BY_THE_ADULT_BED), (KST.BESIDE_CRADLE, KST.STAND, 1330, 940, KST.STANDING_BESIDE_THE_CRADLE), (KST.CRADLE_PILLOW, KST.SURFACE, 800, 780, KST.ON_THE_CRADLE_MATTRESS)],
    KST.ATTIC_ROOM: [(KST.LADDER_FOOT, KST.STAND, 1220, 950, KST.AT_THE_FOOT_OF_THE_ATTIC_LADDER), (KST.CHEST_SIDE, KST.STAND, 650, 960, KST.STANDING_BESIDE_THE_OPEN_CHEST), (KST.CHEST_INSIDE, KST.SURFACE, 960, 775, KST.INSIDE_THE_OPEN_CHEST), (KST.LADDER_SIDE, KST.STAND, 1770, 940, KST.STANDING_BESIDE_THE_LADDER)],
    KST.RIVER_DOCK: [(KST.DOCK_LEFT, KST.STAND, 330, 855, KST.STANDING_ON_THE_WOODEN_DOCK), (KST.DOCK_EDGE, KST.STAND, 710, 880, KST.STANDING_AT_THE_DOCK_EDGE), (KST.BOAT_ROWER, KST.SIT, 850, 850, KST.SITTING_IN_THE_BOAT_ROWING, 800), (KST.BOAT_PASSENGER, KST.SIT, 1120, 850, KST.SITTING_IN_THE_BOAT_AS_PASSENGER, 800), (KST.BOAT_FLOOR, KST.SURFACE, 960, 880, KST.INSIDE_THE_BOAT)],
    KST.RITUAL_BEDROOM: [
        (KST.BED, KST.LIE, 960, 810, KST.LYING_LENGTHWISE_ON_THE_RITUAL_BED, None, 930),
        (KST.BED_HEAD, KST.STAND, 580, 940, KST.STANDING_BESIDE_THE_BED_AT_THE_HEAD),
        (KST.BED_FOOT, KST.STAND, 1340, 940, KST.STANDING_AT_THE_FOOT_OF_THE_BED),
        (KST.BED_SIDE, KST.STAND, 960, 980, KST.STANDING_IN_FRONT_OF_THE_BED),
        (KST.RITUAL_FLOOR, KST.OPEN, 960, 980, KST.RITUAL_CIRCLE_ON_THE_FLOOR),
        (KST.LAMP_TABLE, KST.SURFACE, 1550, 800, KST.OIL_LAMP_BESIDE_THE_BED),
        (KST.BED_PILLOW, KST.SURFACE, 760, 780, KST.SMALL_TOOL_PLACED_ON_THE_PILLOW),
    ],
}
CHAR_CATALOG = {
    KST.SOLDIER: dict(name=KST.SOLDIER_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.SOLDIER, hair=KST.HELMET, hairc=KST.VALUE_62764D, face=KST.ECD2B4, body=KST.VALUE_63774C, sleeve=KST.VALUE_63774C, dress=KST.SHIRT, sash=KST.VALUE_71613C, height=1.02, desc=KST.VILLAGE_SOLDIER_IN_AN_OLIVE_UNIFORM_AND_A_PITH_HELMET),
    KST.CARPENTER: dict(name=KST.CARPENTER_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.WORKER, hair=KST.BAND, band=KST.DAD1B8, hairc=KST.VALUE_211B19, face=KST.E1C19F, body=KST.VALUE_79543B, sleeve=KST.VALUE_79543B, dress=KST.SHIRT, height=1.0, desc=KST.CARPENTER_IN_A_BROWN_WORK_SHIRT_AND_PALE_SWEAT_HEADBAND),
    KST.FISHERMAN: dict(name=KST.FISHERMAN_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.WORKER, hair=KST.SHORT, hairc=KST.VALUE_211B19, face=KST.D2AE85, body=KST.VALUE_4F6F7B, sleeve=KST.VALUE_4F6F7B, dress=KST.SHIRT, height=1.0, desc=KST.RIVER_FERRYMAN_IN_FADED_BLUE_CLOTHES_WITH_SHORT_BLACK_HAIR),
    KST.TEACHER: dict(name=KST.TEACHER_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.TOWN, hair=KST.SHORT, hairc=KST.VALUE_211B19, face=KST.ECD2B4, body=KST.E9E4D9, sleeve=KST.E9E4D9, dress=KST.SHIRT, height=1.02, desc=KST.SCHOOL_TEACHER_WITH_NEAT_BLACK_HAIR_AND_AN_IVORY_COLLARED_SHIRT),
    KST.MIDWIFE: dict(name=KST.MIDWIFE_LABEL, gender=KST.FEMALE, age=KST.SENIOR, group=KST.VILLAGER, hair=KST.WRAP, hairc=KST.VALUE_4F4539, face=KST.D8B893, body=KST.VALUE_5E6457, sleeve=KST.VALUE_5E6457, dress=KST.DRESS, height=0.9, desc=KST.ELDERLY_VILLAGE_MIDWIFE_IN_A_MUTED_GREEN_BLOUSE_WITH_A_BROWN_HEADSCARF),
    KST.BABY: dict(name=KST.BABY_LABEL, gender=KST.FEMALE, age=KST.CHILD, group=KST.BABY, hair=KST.BALD, hairc=KST.E6CFB3, face=KST.F1DCC3, body=KST.E9E2CF, sleeve=KST.E9E2CF, dress=KST.ROBE, height=0.42, desc=KST.SMALL_INFANT_WRAPPED_IN_AN_IVORY_SWADDLING_CLOTH_NO_ADULT_HAIRSTYLE),
    KST.HIGHLAND_MAN: dict(name=KST.HIGHLAND_MAN_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.VILLAGER_MAN, hair=KST.WRAP, hairc=KST.VALUE_252D43, face=KST.DFBE99, body=KST.VALUE_252D43, sleeve=KST.VALUE_252D43, dress=KST.SHIRT, sash=KST.A83439, height=1.0, desc=KST.HIGHLAND_MAN_IN_INDIGO_CLOTHES_INDIGO_HEADWRAP_AND_A_RED_WOVEN_WAIST_SASH),
    KST.FESTIVAL_WOMAN: dict(name=KST.FESTIVAL_WOMAN_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.VILLAGER_WOMAN, hair=KST.TURBAN, hairc=KST.VALUE_293146, face=KST.ECD2B4, body=KST.VALUE_336458, sleeve=KST.VALUE_336458, dress=KST.DRESS, sash=KST.AE343F, height=0.94, desc=KST.HIGHLAND_FESTIVAL_WOMAN_WEARING_A_DARK_WRAPPED_HEADDRESS_TEAL_BLOUSE_PATTERN),
}
