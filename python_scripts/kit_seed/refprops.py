from seed_texts import SeedText as KST
from interior import *
METAL = KST.B9BEC2
INK = KST.VALUE_1D1B1E
def ancient_coin(t):
    return [circ(t, 256, 270, 190, shade(t.c(KST.GOLD), 0.25)), circ(t, 256, 270, 150, KST.NONE, True, sw=t.lw * 0.6), rect(t, 216, 230, 80, 80, KST.VALUE_2A2622, True), line(t, 256, 110, 256, 150, t.line, 8), line(t, 256, 390, 256, 430, t.line, 8), line(t, 96, 270, 136, 270, t.line, 8), line(t, 376, 270, 416, 270, t.line, 8)]
def smartphone(t):
    return [rect(t, 150, 40, 212, 430, INK, True, rx=30), rect(t, 168, 80, 176, 340, mix(KST.VALUE_7FA6C9, KST.FFFFFF, 0.3), False), circ(t, 256, 448, 10, KST.VALUE_555, False), rect(t, 186, 110, 140, 18, KST.FFFFFF, False, extra=op(0.8)), rect(t, 186, 150, 110, 14, KST.FFFFFF, False, extra=op(0.6)), rect(t, 186, 180, 125, 14, KST.FFFFFF, False, extra=op(0.6))]
def cigarette(t):
    return [rect(t, 40, 240, 340, 40, KST.F4F1EA, True, rx=6), rect(t, 380, 240, 92, 40, KST.D79A4A, True, rx=6), rect(t, 30, 244, 20, 32, t.c(KST.FIRE), False), circ(t, 34, 260, 12, KST.FF7A2A, False)]
def cigarette_pack(t):
    return [rect(t, 130, 140, 252, 330, t.c(KST.RED), True, rx=8), rect(t, 130, 140, 252, 90, KST.F4F1EA, True), rect(t, 170, 300, 172, 60, KST.F4F1EA, True, sw=t.lw * 0.5), rect(t, 170, 100, 30, 50, KST.F4F1EA, True, sw=t.lw * 0.5), rect(t, 210, 90, 30, 60, KST.F4F1EA, True, sw=t.lw * 0.5)]
def lighter(t):
    return [rect(t, 170, 180, 172, 290, t.c(KST.RED), True, rx=20), rect(t, 190, 120, 132, 70, METAL, True, rx=8), circ(t, 300, 150, 24, KST.VALUE_7A7F84, True, sw=t.lw * 0.5)]
def motorbike(t):
    return [
        circ(t, 110, 400, 70, INK, True),
        circ(t, 110, 400, 30, METAL, True, sw=t.lw * 0.5),
        circ(t, 402, 400, 70, INK, True),
        circ(t, 402, 400, 30, METAL, True, sw=t.lw * 0.5),
        path(t, KST.M120_330_Q_190_250_300_300_L_380_300_Q_410_330_402_400_L_300_400_Q_230_360_1, mix(t.c(KST.WATER), t.c(KST.DARK), 0.45), True),
        rect(t, 200, 250, 150, 40, INK, True, rx=14),
        line(t, 380, 300, 420, 190, METAL, 14),
        line(t, 400, 190, 460, 180, INK, 12),
        ell(t, 430, 230, 20, 14, t.c(KST.LAMP), True, sw=t.lw * 0.5),
    ]
def bicycle(t):
    return [
        circ(t, 120, 380, 90, KST.NONE, True, sw=t.lw * 1.4),
        circ(t, 392, 380, 90, KST.NONE, True, sw=t.lw * 1.4),
        pline(t, [(120, 380), (220, 250), (340, 250), (392, 380)], t.c(KST.RED), 16),
        pline(t, [(220, 250), (260, 380), (340, 250)], t.c(KST.RED), 16),
        line(t, 220, 250, 210, 200, INK, 10),
        rect(t, 180, 186, 70, 20, INK, True, sw=t.lw * 0.5),
        line(t, 340, 250, 350, 180, INK, 10),
        line(t, 330, 180, 390, 175, INK, 10),
    ]
def pig(t):
    c = KST.VALUE_3A3436
    return (
        [ell(t, 250, 330, 200, 110, c, True), circ(t, 430, 300, 70, c, True), ell(t, 490, 310, 26, 22, mix(c, KST.D08A8A, 0.4), True, sw=t.lw * 0.5), poly(t, [(410, 240), (440, 200), (460, 250)], c, True, sw=t.lw * 0.6), circ(t, 440, 285, 7, KST.E8E2D0, False)]
        + [rect(t, x, 400, 32, 70, c, True, sw=t.lw * 0.6) for x in (110, 170, 320, 380)]
        + [path(t, KST.M50_310_Q_30_20_10_50, KST.NONE, True, sw=t.lw * 1.2)]
    )
def black_dog(t):
    c = KST.VALUE_151416
    return [ell(t, 240, 300, 170, 80, c, True), circ(t, 410, 230, 62, c, True), poly(t, [(450, 230), (500, 250), (470, 270)], c, True), poly(t, [(380, 190), (390, 130), (420, 180)], c, True)] + [rect(t, x, 330, 26, 140, c, True, sw=t.lw * 0.6) for x in (110, 160, 300, 350)] + [path(t, KST.M80_280_Q_50_40_40_110, KST.NONE, True, sw=t.lw * 2.4), circ(t, 425, 222, 9, KST.F2D34A, False)]
def chicken_tray(t):
    return [ell(t, 256, 420, 230, 50, shade(t.c(KST.RED), 0.15), True), ell(t, 256, 400, 210, 40, t.c(KST.RED), True), ell(t, 220, 350, 120, 70, KST.E9B14A, True), path(t, KST.M120_340_Q_40_60_10_70, KST.NONE, True, sw=t.lw * 1.6), circ(t, 340, 370, 26, KST.F4F1EA, True, sw=t.lw * 0.6), circ(t, 390, 380, 26, KST.F4F1EA, True, sw=t.lw * 0.6)]
def wine_bottle(t):
    return [path(t, KST.M200_470_L_200_230_Q_200_180_236_160_L_236_70_L_276_70_L_276_160_Q_312_180_3, mix(t.c(KST.WATER), t.c(KST.CLOTH), 0.4), True), rect(t, 230, 40, 52, 34, t.c(KST.RED), True, sw=t.lw * 0.5), rect(t, 210, 300, 92, 110, KST.F4F1EA, True, sw=t.lw * 0.5)]
def wine_cup(t):
    return [path(t, KST.M150_240_L_362_240_L_330_420_L_182_420_Z, KST.F4F1EA, True), ell(t, 256, 240, 106, 22, mix(t.c(KST.WATER), KST.FFFFFF, 0.5), True, sw=t.lw * 0.5), rect(t, 200, 420, 112, 40, KST.F4F1EA, True, sw=t.lw * 0.6)]
def plate_of_rice(t):
    return [ell(t, 256, 380, 230, 60, KST.E4E8EA, True), ell(t, 256, 360, 190, 40, KST.F4F1EA, False), path(t, KST.M120_360_Q_256_220_392_360_Z, KST.FFFFFF, True, sw=t.lw * 0.6)]
def spoon(t):
    return [ell(t, 120, 300, 80, 50, METAL, True), line(t, 190, 290, 470, 220, METAL, 18), line(t, 190, 290, 470, 220, t.line, 4, extra=op(0.4))]
def playing_card(t):
    return [rect(t, 150, 50, 212, 420, KST.E9DCB8, True, rx=14), rect(t, 172, 74, 168, 372, KST.NONE, True, sw=t.lw * 0.5, rx=8), path(t, KST.M210_200_L_300_200_M_255_160_L_255_330_M_205_280_L_305_280_M_225_330_L_285_3, KST.NONE, False, extra=KST.STROKE_S_STROKE_WIDTH_18_STROKE_LINECAP_ROUND % t.c(KST.RED))]
def letter(t):
    return [rect(t, 60, 140, 392, 260, KST.F4F1EA, True), pline(t, [(60, 140), (256, 290), (452, 140)], t.line, t.lw), rect(t, 360, 160, 60, 70, t.c(KST.RED), True, sw=t.lw * 0.5)]
def land_deed(t):
    out = [rect(t, 90, 50, 332, 420, KST.EFE6CC, True)]
    for k in range(7):
        out.append(line(t, 130, 110 + k * 40, 380 - k % 3 * 40, 110 + k * 40, KST.VALUE_7A705C, 5))
    out.append(circ(t, 340, 400, 44, KST.NONE, False, extra=KST.STROKE_S_STROKE_WIDTH_10 % t.c(KST.RED)))
    return out
def debt_ledger(t):
    out = [rect(t, 110, 60, 300, 400, KST.VALUE_5A3D2A, True, rx=10), rect(t, 140, 60, 260, 400, KST.EFE6CC, True)]
    for k in range(9):
        out.append(line(t, 170, 110 + k * 36, 370, 110 + k * 36, KST.VALUE_8A7F66, 4))
    out.append(line(t, 140, 60, 140, 460, t.line, t.lw))
    return out
def pen(t):
    return [line(t, 80, 430, 420, 90, KST.VALUE_2F4F9A, 30), line(t, 80, 430, 420, 90, t.line, 4, extra=op(0.3)), poly(t, [(60, 450), (68, 420), (92, 440)], INK, True), line(t, 330, 160, 400, 90, METAL, 8)]
def kite(t):
    return [poly(t, [(256, 40), (380, 200), (256, 380), (132, 200)], t.c(KST.GOLD), True), line(t, 256, 40, 256, 380, t.line, 4), line(t, 132, 200, 380, 200, t.line, 4), path(t, KST.M256_380_Q_30_40_0_70_Q_30_30_10_50, KST.NONE, False, extra=KST.STROKE_S_STROKE_WIDTH_6 % t.c(KST.RED))]
def wooden_effigy(t):
    return [circ(t, 256, 110, 60, t.c(KST.WOOD2), True), rect(t, 206, 170, 100, 180, t.c(KST.WOOD2), True, rx=20), rect(t, 120, 190, 272, 44, t.c(KST.WOOD2), True, rx=18), rect(t, 210, 340, 38, 130, t.c(KST.WOOD2), True, rx=12), rect(t, 264, 340, 38, 130, t.c(KST.WOOD2), True, rx=12), line(t, 236, 100, 276, 100, t.line, 5)]
def straw_effigy(t):
    c = t.c(KST.THATCH)
    return [circ(t, 256, 110, 60, c, True), path(t, KST.M216_170_L_296_170_L_330_470_L_182_470_Z, c, True), path(t, KST.M90_210_L_422_210_L_422_250_L_90_250_Z, c, True), line(t, 200, 300, 312, 300, t.c(KST.RED), 10)] + [line(t, 200 + k * 22, 330, 190 + k * 26, 460, shade(c, 0.25), 4) for k in range(6)]
def kitchen_knife(t):
    return [path(t, KST.M60_250_L_330_230_L_340_290_L_70_290_Q_40_270_60_250_Z, METAL, True), rect(t, 330, 236, 140, 50, t.c(KST.WOOD), True, rx=12)]
def cap(t):
    return [path(t, KST.M110_330_Q_120_140_256_130_Q_392_140_402_330_Z, mix(t.c(KST.WATER), t.c(KST.DARK), 0.5), True), path(t, KST.M380_320_Q_470_320_490_360_L_380_360_Z, mix(t.c(KST.WATER), t.c(KST.DARK), 0.65), True), rect(t, 100, 320, 300, 34, mix(t.c(KST.WATER), t.c(KST.DARK), 0.65), True), circ(t, 256, 130, 14, INK, False)]
def flashlight(t):
    return [rect(t, 60, 220, 300, 80, INK, True, rx=16), path(t, KST.M360_200_L_440_170_L_440_350_L_360_320_Z, METAL, True), ell(t, 445, 260, 18, 90, t.c(KST.LAMP), True, sw=t.lw * 0.5)]
def cake_basket(t):
    return [path(t, KST.M70_250_L_442_250_L_400_460_L_112_460_Z, t.c(KST.WOVEN), True)] + [ell(t, 140 + k * 60, 240 - k % 2 * 30, 50, 30, t.c(KST.GOLD), True, sw=t.lw * 0.6) for k in range(5)]
def chili_bundle(t):
    out = [line(t, 256, 20, 256, 120, t.c(KST.THATCH2), 10)]
    for k in range(9):
        a = -60 + k * 15
        import math
        r = math.radians(a + 90)
        x2, y2 = (256 + math.cos(r) * 300, 120 + math.sin(r) * 330)
        out.append(line(t, 256, 130, x2, y2, t.c(KST.RED), 26))
    return out
def hammer(t):
    return [rect(t, 236, 160, 40, 310, t.c(KST.WOOD2), True, rx=10), rect(t, 120, 60, 272, 100, KST.VALUE_4F5459, True, rx=12)]
def hand_saw(t):
    return [path(t, KST.M60_200_L_400_160_L_400_300_L_60_270_Z, METAL, True), rect(t, 380, 140, 100, 180, t.c(KST.WOOD2), True, rx=30)] + [poly(t, [(60 + k * 30, 270 + k * 3.5), (75 + k * 30, 295 + k * 3.5), (90 + k * 30, 274 + k * 3.5)], METAL, True, sw=t.lw * 0.4) for k in range(11)]
def sickle(t):
    return [path(t, KST.M120_420_Q_60_160_300_100_Q_440_80_470_200_Q_400_140_300_160_Q_160_200_170_4, METAL, True), rect(t, 110, 400, 70, 80, t.c(KST.WOOD2), True, rx=14)]
def carrying_pole(t):
    out = [line(t, 30, 140, 482, 140, t.c(KST.WOOD2), 18)]
    for x in (90, 422):
        out += [line(t, x - 50, 140, x - 60, 330, t.line, 4), line(t, x + 50, 140, x + 60, 330, t.line, 4), path(t, KST.M_S_330_L_S_330_L_S_460_L_S_460_Z % (x - 80, x + 80, x + 60, x - 60), t.c(KST.WOVEN), True)]
    return out
def banknotes(t):
    return [rect(t, 70 + k * 18, 160 + k * 26, 340, 170, mix(KST.VALUE_7FB08A, KST.FFFFFF, 0.25), True, rx=8) for k in range(4)] + [circ(t, 300, 300, 40, KST.NONE, True, sw=t.lw * 0.6)]
def umbrella(t):
    return [path(t, KST.M40_260_Q_256_20_472_260_Q_420_230_364_260_Q_310_230_256_260_Q_202_230_148_2, INK, True), line(t, 256, 60, 256, 440, t.c(KST.WOOD2), 12), path(t, KST.M256_440_Q_256_480_220_470, KST.NONE, True, sw=t.lw * 1.4)]
def ghost_face(t):
    return [circ(t, 256, 256, 200, KST.F1F1EE, True), ell(t, 190, 220, 26, 34, INK, False), ell(t, 322, 220, 26, 34, INK, False), path(t, KST.M150_320_Q_256_400_362_320_Q_256_360_150_320_Z, INK, True), pline(t, [(150, 150), (190, 130), (180, 160), (220, 150)], t.c(KST.RED), 6)]
REF_PROPS = {
    KST.ANCIENT_COIN: (ancient_coin, 0.04, KST.BODY),
    KST.SMARTPHONE: (smartphone, 0.15, KST.HELD),
    KST.CIGARETTE: (cigarette, 0.09, KST.HELD),
    KST.CIGARETTE_PACK: (cigarette_pack, 0.09, KST.TABLE),
    KST.LIGHTER: (lighter, 0.07, KST.HELD),
    KST.MOTORBIKE: (motorbike, 1.9, KST.FLOOR),
    KST.BICYCLE: (bicycle, 1.7, KST.FLOOR),
    KST.PIG: (pig, 1.2, KST.FLOOR),
    KST.BLACK_DOG: (black_dog, 0.9, KST.FLOOR),
    KST.OFFERING_TRAY: (chicken_tray, 0.6, KST.TABLE),
    KST.WINE_BOTTLE: (wine_bottle, 0.3, KST.TABLE),
    KST.WINE_CUP: (wine_cup, 0.06, KST.TABLE),
    KST.PLATE_OF_RICE: (plate_of_rice, 0.25, KST.TABLE),
    KST.SPOON: (spoon, 0.15, KST.HELD),
    KST.PLAYING_CARD: (playing_card, 0.09, KST.HELD),
    KST.LETTER: (letter, 0.22, KST.HELD),
    KST.LAND_DEED: (land_deed, 0.3, KST.HELD),
    KST.DEBT_LEDGER: (debt_ledger, 0.25, KST.HELD),
    KST.PEN: (pen, 0.14, KST.HELD),
    KST.KITE: (kite, 0.8, KST.AIR),
    KST.WOODEN_EFFIGY: (wooden_effigy, 0.25, KST.HELD),
    KST.STRAW_EFFIGY: (straw_effigy, 0.6, KST.FLOOR),
    KST.KITCHEN_KNIFE: (kitchen_knife, 0.3, KST.HELD),
    KST.CAP: (cap, 0.25, KST.WEAR),
    KST.FLASHLIGHT: (flashlight, 0.25, KST.HELD),
    KST.CAKE_BASKET: (cake_basket, 0.45, KST.HANG),
    KST.CHILI_BUNDLE: (chili_bundle, 0.5, KST.HANG),
    KST.HAMMER: (hammer, 0.35, KST.HELD),
    KST.HAND_SAW: (hand_saw, 0.6, KST.HELD),
    KST.SICKLE: (sickle, 0.45, KST.HELD),
    KST.CARRYING_POLE: (carrying_pole, 1.6, KST.SHOULDER),
    KST.BANKNOTES: (banknotes, 0.16, KST.HELD),
    KST.UMBRELLA: (umbrella, 0.9, KST.HELD),
    KST.GHOST_FACE: (ghost_face, 0.4, KST.AIR),
}
from reference_expansion import PROP_CATALOG
from fixed_compositions import PROPS as FIXED_PROPS
PROP_CATALOG = dict(PROP_CATALOG, **FIXED_PROPS)
for _key, (_fn, _size, _mount, _name, _desc, _tags) in PROP_CATALOG.items():
    REF_PROPS[_key] = (_fn, _size, _mount)
