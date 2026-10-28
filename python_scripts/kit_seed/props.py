if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from interior import *
B = 480
class PT(T):
    @property
    def lw(self):
        return self.p[_CODE_TEXT.LW] * 1.5
def flame(t, x, y, s=1.0):
    return [path(t, _CODE_TEXT.M_S_S_Q_S_S_0_S_Q_S_S_0_S_Z % (f(x), f(y), f(-22 * s), f(-34 * s), f(-80 * s), f(24 * s), f(40 * s), f(80 * s)), t.c(_CODE_TEXT.FIRE), True, sw=t.lw * 0.6), path(t, _CODE_TEXT.M_S_S_Q_S_S_0_S_Q_S_S_0_S_Z % (f(x), f(y - 6 * s), f(-10 * s), f(-18 * s), f(-44 * s), f(11 * s), f(22 * s), f(44 * s)), _CODE_TEXT.FFE08A, False)]
def oil_lamp(t):
    return [ell(t, 256, 452, 110, 28, t.c(_CODE_TEXT.WOOD2)), path(t, _CODE_TEXT.M186_452_Q_150_380_210_330_L_302_330_Q_362_380_326_452_Z, _CODE_TEXT.VALUE_9FB7B3), rect(t, 224, 300, 64, 32, t.c(_CODE_TEXT.GOLD)), path(t, _CODE_TEXT.M226_300_Q_200_220_236_150_L_276_150_Q_312_220_286_300_Z, _CODE_TEXT.DFECEB, extra=op(0.75))] + flame(t, 256, 270, 1.0)
def candle(t):
    return [ell(t, 256, 462, 100, 22, t.c(_CODE_TEXT.GOLD)), rect(t, 222, 230, 68, 226, t.c(_CODE_TEXT.CLOTH)), path(t, _CODE_TEXT.M222_250_Q_12_30_0_60, _CODE_TEXT.NONE, True, sw=3)] + flame(t, 256, 226, 1.1)
def incense_bowl(t):
    out = [path(t, _CODE_TEXT.M120_300_Q_130_470_256_470_Q_382_470_392_300_Z, t.c(_CODE_TEXT.RED)), ell(t, 256, 300, 136, 28, shade(t.c(_CODE_TEXT.RED), 0.3)), ell(t, 256, 300, 120, 20, _CODE_TEXT.CFC6B5, True, sw=2)]
    if t.detail:
        out.append(path(t, _CODE_TEXT.M150_370_Q_256_400_362_370, _CODE_TEXT.NONE, True, sw=3, extra=_CODE_TEXT.STROKE_S % t.c(_CODE_TEXT.GOLD)))
    for k in range(5):
        out.append(line(t, 210 + k * 22, 300, 196 + k * 30, 70, t.c(_CODE_TEXT.RED), 5))
        out.append(circ(t, 196 + k * 30, 70, 5, t.c(_CODE_TEXT.FIRE), False))
    return out
def incense_sticks(t):
    out = []
    for k in range(7):
        out.append(line(t, 236 + k * 7, 470, 200 + k * 20, 90, t.c(_CODE_TEXT.RED), 6))
        out.append(circ(t, 200 + k * 20, 90, 6, t.c(_CODE_TEXT.FIRE), False))
    out.append(rect(t, 220, 380, 80, 30, t.c(_CODE_TEXT.GOLD), True))
    for k in range(3):
        out.append(spath(_CODE_TEXT.M_S_70_Q_20_30_0_60 % f(220 + k * 40), _CODE_TEXT.CFCAC0, 3, op(0.7)))
    return out
def coffin(t):
    return [poly(t, [(40, 330), (60, 470), (470, 470), (490, 300)], t.c(_CODE_TEXT.DARK)), poly(t, [(40, 330), (90, 250), (470, 220), (490, 300)], shade(t.c(_CODE_TEXT.DARK), -0.25)), rect(t, 210, 330, 110, 90, t.c(_CODE_TEXT.RED), True, sw=t.lw * 0.6), circ(t, 265, 375, 26, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.5)]
def white_mourning_headband(t):
    return [ell(t, 256, 300, 190, 110, t.c(_CODE_TEXT.CLOTH)), ell(t, 256, 300, 150, 76, _CODE_TEXT.FFFFFF, False, extra=op(0)), ell(t, 256, 300, 150, 76, _CODE_TEXT.NONE, True, sw=t.lw * 0.6), path(t, _CODE_TEXT.M380_330_L_430_470_L_380_460_L_350_350_Z, t.c(_CODE_TEXT.CLOTH)), path(t, _CODE_TEXT.M350_340_L_360_480_L_320_470_L_320_350_Z, t.c(_CODE_TEXT.CLOTH))]
def ancestor_portrait(t):
    return [rect(t, 120, 60, 272, 400, t.c(_CODE_TEXT.WOOD)), rect(t, 150, 92, 212, 336, t.c(_CODE_TEXT.CLOTH)), circ(t, 256, 210, 56, _CODE_TEXT.VALUE_8D8A85, True), path(t, _CODE_TEXT.M170_428_Q_180_300_256_290_Q_332_300_342_428_Z, _CODE_TEXT.VALUE_6E6B67), rect(t, 100, 440, 312, 30, t.c(_CODE_TEXT.WOOD2))]
def paper_talisman(t):
    out = [rect(t, 176, 40, 160, 430, _CODE_TEXT.E8C64A)]
    for y in (110, 200, 290, 380):
        out.append(spath(_CODE_TEXT.M216_S_Q_40_30_80_0_Q_40_30_80_0 % f(y), t.c(_CODE_TEXT.RED), 8))
    out.append(line(t, 256, 60, 256, 450, t.c(_CODE_TEXT.RED), 5))
    return out
def old_mirror(t):
    return [rect(t, 236, 380, 40, 70, t.c(_CODE_TEXT.GOLD)), ell(t, 256, 466, 100, 18, shade(t.c(_CODE_TEXT.GOLD), 0.2)), circ(t, 256, 220, 170, shade(t.c(_CODE_TEXT.GOLD), 0.15)), circ(t, 256, 220, 136, _CODE_TEXT.B8C6C9), path(t, _CODE_TEXT.M180_170_Q_40_50_100_40, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_FFFFFF_STROKE_WIDTH_10_OPACITY_0_6_STROKE_LINECAP_ROU)]
def comb(t):
    out = [path(t, _CODE_TEXT.M80_230_Q_256_120_432_230_L_432_270_L_80_270_Z, t.c(_CODE_TEXT.WOOD2))]
    for k in range(18):
        x = 96 + k * 19
        out.append(rect(t, x, 268, 10, 150, t.c(_CODE_TEXT.WOOD2), True, sw=t.lw * 0.5))
    return out
def embroidered_scarf(t):
    out = [path(t, _CODE_TEXT.M60_160_L_452_120_L_470_360_L_80_400_Z, _CODE_TEXT.VALUE_1F1F2A)]
    for k, c in enumerate([t.c(_CODE_TEXT.RED), t.c(_CODE_TEXT.GOLD), _CODE_TEXT.VALUE_3F8F5A, _CODE_TEXT.D9548C]):
        y = 190 + k * 50
        out.append(line(t, 90, y + 4, 440, y - 30, c, 9, extra=_CODE_TEXT.STROKE_DASHARRAY_16_10))
    for k in range(10):
        x = 86 + k * 40
        out.append(line(t, x, 398 - k * 4, x - 4, 460 - k * 4, [t.c(_CODE_TEXT.RED), t.c(_CODE_TEXT.GOLD), _CODE_TEXT.VALUE_3F8F5A][k % 3], 7))
    return out
def temple_bell(t):
    return [rect(t, 236, 30, 40, 40, t.c(_CODE_TEXT.WOOD)), path(t, _CODE_TEXT.M150_410_Q_130_100_256_70_Q_382_100_362_410_Z, shade(t.c(_CODE_TEXT.GOLD), 0.25)), rect(t, 120, 400, 272, 40, shade(t.c(_CODE_TEXT.GOLD), 0.35)), line(t, 160, 180, 352, 180, t.line, 4), line(t, 150, 300, 362, 300, t.line, 4), circ(t, 256, 360, 26, shade(t.c(_CODE_TEXT.GOLD), 0.45))]
def wooden_fish(t):
    return [path(t, _CODE_TEXT.M90_330_Q_90_170_256_170_Q_422_170_422_330_Q_422_470_256_470, t.c(_CODE_TEXT.RED)), path(t, _CODE_TEXT.M170_340_Q_256_380_342_340, _CODE_TEXT.NONE, True, sw=t.lw * 1.2), circ(t, 170, 260, 14, t.c(_CODE_TEXT.DARK), False), line(t, 330, 160, 460, 40, t.c(_CODE_TEXT.WOOD2), 14), circ(t, 465, 36, 22, t.c(_CODE_TEXT.WOOD))]
def prayer_beads(t):
    out = []
    for k in range(22):
        a = math.radians(k * 360 / 22)
        out.append(circ(t, 256 + math.cos(a) * 150, 250 + math.sin(a) * 150, 22, t.c(_CODE_TEXT.WOOD), True, sw=t.lw * 0.6))
    out.append(path(t, _CODE_TEXT.M256_400_L_230_470_L_282_470_Z, t.c(_CODE_TEXT.RED)))
    return out
def machete(t):
    return [path(t, _CODE_TEXT.M60_300_Q_250_220_440_150_Q_470_190_430_230_Q_260_300_80_340, _CODE_TEXT.B9C2C4), rect(t, 30, 300, 120, 50, t.c(_CODE_TEXT.WOOD), rx=16)]
def axe(t):
    return [line(t, 120, 470, 360, 70, t.c(_CODE_TEXT.WOOD2), 26), path(t, _CODE_TEXT.M300_60_L_450_80_Q_470_170_420_220_L_330_170_Z, _CODE_TEXT.A7B0B2)]
def walking_stick(t):
    return [path(t, _CODE_TEXT.M250_470_L_262_140_Q_262_60_330_60_Q_390_70_380_120, _CODE_TEXT.NONE, True, sw=30, extra=''), path(t, _CODE_TEXT.M250_470_L_262_140_Q_262_60_330_60_Q_390_70_380_120, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_S_STROKE_WIDTH_20_STROKE_LINECAP_ROUND % t.c(_CODE_TEXT.WOOD2))]
def conical_hat(t):
    out = [poly(t, [(40, 400), (256, 120), (472, 400)], t.c(_CODE_TEXT.THATCH)), ell(t, 256, 400, 216, 30, t.c(_CODE_TEXT.THATCH2))]
    for k in range(1, 6):
        out.append(line(t, 256 - 216 * k / 6, 120 + 280 * k / 6, 256 + 216 * k / 6, 120 + 280 * k / 6, t.c(_CODE_TEXT.THATCH2), 3))
    return out
def bamboo_basket(t):
    out = [path(t, _CODE_TEXT.M130_120_L_382_120_L_350_470_L_162_470_Z, t.c(_CODE_TEXT.WOVEN))]
    for k in range(1, 9):
        y = 120 + k * 40
        out.append(line(t, 130 + k * 4, y, 382 - k * 4, y, t.c(_CODE_TEXT.WOVEN2), 4))
    for k in range(1, 7):
        out.append(line(t, 130 + k * 36, 120, 162 + k * 27, 470, t.c(_CODE_TEXT.WOVEN2), 3))
    out.append(path(t, _CODE_TEXT.M150_130_Q_256_0_362_130, _CODE_TEXT.NONE, True, sw=t.lw * 2))
    return out
def cooking_pot(t):
    return [ell(t, 256, 200, 160, 34, t.c(_CODE_TEXT.DARK)), path(t, _CODE_TEXT.M96_200_Q_90_470_256_470_Q_422_470_416_200_Z, shade(t.c(_CODE_TEXT.WOOD), 0.35)), ell(t, 256, 200, 130, 22, _CODE_TEXT.VALUE_1A1614), line(t, 80, 230, 120, 230, t.line, 12), line(t, 392, 230, 432, 230, t.line, 12)]
def rice_bowl(t):
    return [
        ell(t, 256, 260, 170, 44, _CODE_TEXT.F4F1EA),
        path(t, _CODE_TEXT.M86_260_Q_110_440_256_440_Q_402_440_426_260_Z, _CODE_TEXT.D7E3E8),
        path(t, _CODE_TEXT.M120_320_Q_256_360_392_320, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_4D7FA3_STROKE_WIDTH_10),
        rect(t, 210, 430, 92, 30, _CODE_TEXT.C3CFD4),
        line(t, 230, 250, 220, 40, t.c(_CODE_TEXT.WOOD2), 10),
        line(t, 270, 250, 270, 40, t.c(_CODE_TEXT.WOOD2), 10),
    ]
def teapot(t):
    return [
        path(t, _CODE_TEXT.M130_250_Q_120_450_256_450_Q_392_450_382_250_Z, t.c(_CODE_TEXT.DIRT) if _CODE_TEXT.DIRT in t.p else t.c(_CODE_TEXT.WOOD)),
        ell(t, 256, 250, 126, 24, shade(t.c(_CODE_TEXT.WOOD), 0.2)),
        path(t, _CODE_TEXT.M380_300_Q_470_300_470_220, _CODE_TEXT.NONE, True, sw=22),
        path(t, _CODE_TEXT.M130_290_Q_60_300_80_380_Q_100_420_140_400, _CODE_TEXT.NONE, True, sw=14),
        circ(t, 256, 220, 22, t.c(_CODE_TEXT.WOOD)),
    ]
def joss_paper(t):
    out = []
    for k, (x, y, a) in enumerate([(120, 300, -8), (220, 260, 6), (300, 320, -4), (180, 360, 10)]):
        out.append(_CODE_TEXT.G_TRANSFORM_ROTATE_D_D_D_S_S_G % (a, x + 80, y + 50, rect(t, x, y, 170, 110, _CODE_TEXT.E3C04A if k % 2 else _CODE_TEXT.E9E1CF), rect(t, x + 50, y + 25, 70, 60, t.c(_CODE_TEXT.RED), True, sw=t.lw * 0.5)))
    return out
def paper_effigy(t):
    return [
        circ(t, 256, 110, 60, _CODE_TEXT.EFE8DC),
        path(t, _CODE_TEXT.M150_470_L_180_180_L_332_180_L_362_470_Z, t.c(_CODE_TEXT.RED)),
        rect(t, 150, 200, 212, 40, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.6),
        line(t, 180, 200, 100, 330, t.line, 8),
        line(t, 332, 200, 412, 330, t.line, 8),
        circ(t, 236, 100, 7, t.line, False),
        circ(t, 276, 100, 7, t.line, False),
        circ(t, 238, 128, 10, t.c(_CODE_TEXT.RED), False),
        circ(t, 274, 128, 10, t.c(_CODE_TEXT.RED), False),
    ]
def old_doll(t):
    return [
        circ(t, 256, 140, 80, _CODE_TEXT.E9D8C0),
        path(t, _CODE_TEXT.M176_150_Q_170_60_256_56_Q_342_60_336_150_Q_300_110_256_110_, _CODE_TEXT.VALUE_2A2220),
        path(t, _CODE_TEXT.M170_470_L_200_230_L_312_230_L_342_470_Z, mix(t.c(_CODE_TEXT.RED), _CODE_TEXT.FFFFFF, 0.25)),
        circ(t, 228, 145, 10, t.line, False),
        line(t, 274, 140, 296, 150, t.line, 5),
        line(t, 240, 290, 270, 320, t.line, 4),
        line(t, 270, 290, 240, 320, t.line, 4),
    ]
def black_cat(t):
    return [
        path(t, _CODE_TEXT.M150_470_Q_120_330_200_280_Q_256_250_312_290_Q_380_340_350_4, _CODE_TEXT.VALUE_1D1B1E),
        circ(t, 256, 220, 86, _CODE_TEXT.VALUE_1D1B1E),
        poly(t, [(186, 170), (196, 90), (240, 150)], _CODE_TEXT.VALUE_1D1B1E),
        poly(t, [(326, 170), (316, 90), (272, 150)], _CODE_TEXT.VALUE_1D1B1E),
        ell(t, 222, 220, 20, 14, _CODE_TEXT.E8D35A, False),
        ell(t, 290, 220, 20, 14, _CODE_TEXT.E8D35A, False),
        ell(t, 222, 220, 5, 12, _CODE_TEXT.VALUE_111, False),
        ell(t, 290, 220, 5, 12, _CODE_TEXT.VALUE_111, False),
        path(t, _CODE_TEXT.M350_450_Q_470_440_450_320, _CODE_TEXT.NONE, True, sw=30),
        path(t, _CODE_TEXT.M350_450_Q_470_440_450_320, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_1D1B1E_STROKE_WIDTH_22_STROKE_LINECAP_ROUND),
    ]
def crow(t):
    return [path(t, _CODE_TEXT.M120_300_Q_160_200_270_210_Q_360_220_420_300_Q_330_300_280_3, _CODE_TEXT.VALUE_1B1B20), circ(t, 150, 250, 54, _CODE_TEXT.VALUE_1B1B20), poly(t, [(100, 250), (50, 270), (104, 280)], _CODE_TEXT.VALUE_3A3532), circ(t, 140, 238, 8, _CODE_TEXT.D8D0C0, False), line(t, 240, 340, 230, 470, _CODE_TEXT.VALUE_3A3532, 8), line(t, 280, 340, 290, 470, _CODE_TEXT.VALUE_3A3532, 8)]
def owl(t):
    return [
        line(t, 60, 440, 452, 440, t.c(_CODE_TEXT.WOOD), 26),
        path(t, _CODE_TEXT.M160_430_Q_140_200_256_140_Q_372_200_352_430_Z, mix(t.c(_CODE_TEXT.WOOD2), _CODE_TEXT.FFFFFF, 0.1)),
        poly(t, [(170, 170), (190, 100), (230, 160)], t.c(_CODE_TEXT.WOOD2)),
        poly(t, [(342, 170), (322, 100), (282, 160)], t.c(_CODE_TEXT.WOOD2)),
        circ(t, 212, 220, 40, _CODE_TEXT.EFE6C8),
        circ(t, 300, 220, 40, _CODE_TEXT.EFE6C8),
        circ(t, 212, 222, 16, _CODE_TEXT.VALUE_111, False),
        circ(t, 300, 222, 16, _CODE_TEXT.VALUE_111, False),
        poly(t, [(246, 250), (266, 250), (256, 280)], t.c(_CODE_TEXT.GOLD)),
    ]
def skull(t):
    return [
        path(t, _CODE_TEXT.M120_260_Q_120_90_256_90_Q_392_90_392_260_Q_392_330_340_350_, _CODE_TEXT.E8E2D2),
        circ(t, 200, 260, 38, _CODE_TEXT.VALUE_1C1A1A, False),
        circ(t, 312, 260, 38, _CODE_TEXT.VALUE_1C1A1A, False),
        poly(t, [(256, 300), (236, 340), (276, 340)], _CODE_TEXT.VALUE_1C1A1A, False),
        line(t, 210, 380, 210, 420, t.line, 4),
        line(t, 256, 380, 256, 420, t.line, 4),
        line(t, 302, 380, 302, 420, t.line, 4),
    ]
def bones(t):
    out = []
    for x1, y1, x2, y2 in [(80, 450, 420, 380), (110, 380, 400, 460), (160, 420, 360, 330)]:
        out.append(line(t, x1, y1, x2, y2, t.line, 34))
        out.append(line(t, x1, y1, x2, y2, _CODE_TEXT.E8E2D2, 24))
        for x, y in ((x1, y1), (x2, y2)):
            out.append(circ(t, x, y - 10, 18, _CODE_TEXT.E8E2D2, True, sw=t.lw * 0.6))
            out.append(circ(t, x, y + 10, 18, _CODE_TEXT.E8E2D2, True, sw=t.lw * 0.6))
    return out
def tombstone_p(t):
    return [path(t, _CODE_TEXT.M150_460_L_150_160_Q_256_60_362_160_L_362_460_Z, t.c(_CODE_TEXT.STONE)), rect(t, 110, 440, 292, 36, t.c(_CODE_TEXT.STONE2)), line(t, 210, 200, 300, 200, t.c(_CODE_TEXT.STONE2), 8), line(t, 256, 170, 256, 380, t.c(_CODE_TEXT.STONE2), 8), line(t, 200, 260, 312, 260, t.c(_CODE_TEXT.STONE2), 6)]
def grave_mound(t):
    return [path(t, _CODE_TEXT.M30_470_Q_256_140_482_470_Z, t.c(_CODE_TEXT.MOUND)), path(t, _CODE_TEXT.M210_470_L_210_270_Q_256_230_302_270_L_302_470_Z, t.c(_CODE_TEXT.STONE)), line(t, 360, 470, 350, 360, t.c(_CODE_TEXT.RED), 5), line(t, 380, 470, 380, 350, t.c(_CODE_TEXT.RED), 5), line(t, 400, 470, 410, 360, t.c(_CODE_TEXT.RED), 5)]
def red_wedding_dress(t):
    return [
        path(t, _CODE_TEXT.M200_60_L_312_60_L_360_140_L_330_170_L_320_470_L_192_470_L_1, t.c(_CODE_TEXT.RED)),
        path(t, _CODE_TEXT.M200_60_L_256_120_L_312_60, _CODE_TEXT.NONE, True, sw=t.lw),
        line(t, 152, 140, 90, 330, t.line, t.lw),
        path(t, _CODE_TEXT.M152_140_L_90_330_L_130_340_L_182_170_Z, t.c(_CODE_TEXT.RED)),
        path(t, _CODE_TEXT.M360_140_L_422_330_L_382_340_L_330_170_Z, t.c(_CODE_TEXT.RED)),
        circ(t, 256, 220, 30, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.6),
        circ(t, 256, 330, 24, t.c(_CODE_TEXT.GOLD), True, sw=t.lw * 0.6),
    ]
def embroidered_shoes(t):
    out = []
    for x in (150, 350):
        out.append(path(t, _CODE_TEXT.M_S_460_L_S_360_Q_S_300_S_340_L_S_460_Z % (f(x - 90), f(x - 80), f(x), f(x + 90), f(x + 90)), t.c(_CODE_TEXT.RED)))
        out.append(path(t, _CODE_TEXT.M_S_380_Q_30_30_60_0 % f(x - 30), _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_S_STROKE_WIDTH_8 % t.c(_CODE_TEXT.GOLD)))
    return out
def silver_bracelet(t):
    return [ell(t, 256, 300, 180, 90, _CODE_TEXT.C9CDD0), ell(t, 256, 300, 140, 60, _CODE_TEXT.FFFFFF, False, extra=op(0)), ell(t, 256, 300, 140, 60, _CODE_TEXT.NONE, True), path(t, _CODE_TEXT.M120_280_Q_136_60_272_0, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_FFFFFF_STROKE_WIDTH_8_OPACITY_0_7)]
def hairpin(t):
    return [line(t, 80, 440, 400, 120, t.line, 22), line(t, 80, 440, 400, 120, _CODE_TEXT.C9CDD0, 14), circ(t, 410, 110, 46, t.c(_CODE_TEXT.RED)), circ(t, 410, 110, 18, t.c(_CODE_TEXT.GOLD), False), line(t, 380, 150, 380, 260, t.c(_CODE_TEXT.GOLD), 5), circ(t, 380, 266, 12, t.c(_CODE_TEXT.GOLD))]
def water_jar(t):
    return jar(t, 256, 470, 2.6, t.c(_CODE_TEXT.WOOD2)) + [line(t, 300, 110, 420, 40, t.c(_CODE_TEXT.WOOD), 10), ell(t, 430, 36, 40, 22, t.c(_CODE_TEXT.WOOD2))]
def firewood(t):
    out = []
    for k in range(7):
        y = 460 - (k % 3) * 60 - (k // 3) * 20
        x0 = 60 + (k % 2) * 30
        out.append(rect(t, x0, y - 50, 380, 50, t.c(_CODE_TEXT.WOOD), rx=22))
        out.append(ell(t, x0 + 380, y - 25, 22, 25, t.c(_CODE_TEXT.WOOD2)))
    out.append(line(t, 180, 230, 180, 470, t.c(_CODE_TEXT.THATCH2), 10))
    out.append(line(t, 340, 230, 340, 470, t.c(_CODE_TEXT.THATCH2), 10))
    return out
def torch(t):
    return [line(t, 256, 470, 256, 200, t.line, 30), line(t, 256, 470, 256, 200, t.c(_CODE_TEXT.WOOD2), 20), rect(t, 220, 170, 72, 60, t.c(_CODE_TEXT.THATCH2))] + flame(t, 256, 170, 2.0)
def old_book(t):
    return (
        [poly(t, [(60, 400), (256, 440), (452, 400), (452, 160), (256, 200), (60, 160)], _CODE_TEXT.E9DCB8), line(t, 256, 200, 256, 440, t.line, t.lw), poly(t, [(50, 410), (256, 455), (462, 410), (462, 420), (256, 470), (50, 420)], t.c(_CODE_TEXT.RED))]
        + [line(t, 90, 210 + k * 40, 220, 236 + k * 40, _CODE_TEXT.VALUE_9A8E70, 4) for k in range(5)]
        + [line(t, 292, 236 + k * 40, 420, 210 + k * 40, _CODE_TEXT.VALUE_9A8E70, 4) for k in range(5)]
    )
def ghost_fire(t):
    out = []
    for x, y, s in [(256, 300, 1.8), (150, 380, 0.9), (380, 220, 1.0)]:
        out.append(circ(t, x, y - 40 * s, 90 * s, t.rg([(0, _CODE_TEXT.VALUE_9FE3FF, 0.55), (1, _CODE_TEXT.VALUE_9FE3FF, 0)]), False))
        out.append(path(t, _CODE_TEXT.M_S_S_Q_S_S_0_S_Q_S_S_0_S_Z % (f(x), f(y), f(-34 * s), f(-40 * s), f(-110 * s), f(36 * s), f(50 * s), f(110 * s)), _CODE_TEXT.BDF1FF, False, extra=op(0.85)))
    return out
def rope(t):
    out = []
    for k in range(5):
        out.append(ell(t, 256, 360 - k * 28, 170 - k * 8, 60, _CODE_TEXT.NONE, True, sw=t.lw * 3))
        out.append(ell(t, 256, 360 - k * 28, 170 - k * 8, 60, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_S_STROKE_WIDTH_S % (t.c(_CODE_TEXT.THATCH), f(t.lw * 2))))
    out.append(path(t, _CODE_TEXT.M420_360_Q_470_420_430_470, _CODE_TEXT.NONE, False, extra=_CODE_TEXT.STROKE_S_STROKE_WIDTH_14 % t.c(_CODE_TEXT.THATCH)))
    return out
PROPS = {
    _CODE_TEXT.OIL_LAMP: (oil_lamp, 0.3),
    _CODE_TEXT.CANDLE: (candle, 0.2),
    _CODE_TEXT.INCENSE_BOWL: (incense_bowl, 0.3),
    _CODE_TEXT.INCENSE_STICKS: (incense_sticks, 0.35),
    _CODE_TEXT.COFFIN: (coffin, 0.8),
    _CODE_TEXT.WHITE_MOURNING_HEADBAND: (white_mourning_headband, 0.3),
    _CODE_TEXT.ANCESTOR_PORTRAIT: (ancestor_portrait, 0.45),
    _CODE_TEXT.PAPER_TALISMAN: (paper_talisman, 0.35),
    _CODE_TEXT.OLD_MIRROR: (old_mirror, 0.4),
    _CODE_TEXT.COMB: (comb, 0.12),
    _CODE_TEXT.EMBROIDERED_SCARF: (embroidered_scarf, 0.4),
    _CODE_TEXT.TEMPLE_BELL: (temple_bell, 1.2),
    _CODE_TEXT.WOODEN_FISH: (wooden_fish, 0.35),
    _CODE_TEXT.PRAYER_BEADS: (prayer_beads, 0.25),
    _CODE_TEXT.MACHETE: (machete, 0.5),
    _CODE_TEXT.AXE: (axe, 0.7),
    _CODE_TEXT.WALKING_STICK: (walking_stick, 1.1),
    _CODE_TEXT.CONICAL_HAT: (conical_hat, 0.3),
    _CODE_TEXT.BAMBOO_BASKET: (bamboo_basket, 0.6),
    _CODE_TEXT.COOKING_POT: (cooking_pot, 0.35),
    _CODE_TEXT.RICE_BOWL: (rice_bowl, 0.15),
    _CODE_TEXT.TEAPOT: (teapot, 0.2),
    _CODE_TEXT.JOSS_PAPER: (joss_paper, 0.2),
    _CODE_TEXT.PAPER_EFFIGY: (paper_effigy, 0.9),
    _CODE_TEXT.OLD_DOLL: (old_doll, 0.35),
    _CODE_TEXT.BLACK_CAT: (black_cat, 0.35),
    _CODE_TEXT.CROW: (crow, 0.3),
    _CODE_TEXT.OWL: (owl, 0.35),
    _CODE_TEXT.SKULL: (skull, 0.22),
    _CODE_TEXT.BONES: (bones, 0.25),
    _CODE_TEXT.TOMBSTONE: (tombstone_p, 0.9),
    _CODE_TEXT.GRAVE_MOUND: (grave_mound, 1.0),
    _CODE_TEXT.RED_WEDDING_DRESS: (red_wedding_dress, 1.3),
    _CODE_TEXT.EMBROIDERED_SHOES: (embroidered_shoes, 0.12),
    _CODE_TEXT.SILVER_BRACELET: (silver_bracelet, 0.1),
    _CODE_TEXT.HAIRPIN: (hairpin, 0.15),
    _CODE_TEXT.WATER_JAR: (water_jar, 0.8),
    _CODE_TEXT.FIREWOOD: (firewood, 0.4),
    _CODE_TEXT.TORCH: (torch, 0.8),
    _CODE_TEXT.OLD_BOOK: (old_book, 0.25),
    _CODE_TEXT.GHOST_FIRE: (ghost_fire, 0.5),
    _CODE_TEXT.ROPE: (rope, 0.25),
}
def build_prop(key, style):
    t = PT(style, False, seed=sum(map(ord, key)))
    fn, h = PROPS[key]
    return psvg(t, fn(t)), h
from refprops import REF_PROPS
for _k, (_fn, _h, _m) in REF_PROPS.items():
    PROPS[_k] = (_fn, _h)
