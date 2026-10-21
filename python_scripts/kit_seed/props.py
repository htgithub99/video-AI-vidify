from interior import *

B = 480


class PT(T):
    @property
    def lw(self):
        return self.p['lw'] * 1.5


def flame(t, x, y, s=1.0):
    return [path(t, 'M%s %s q %s %s 0 %s q %s %s 0 %s Z' % (f(x), f(y), f(-22 * s), f(-34 * s), f(-80 * s), f(24 * s), f(40 * s), f(80 * s)), t.c('fire'), True, sw=t.lw * 0.6),
            path(t, 'M%s %s q %s %s 0 %s q %s %s 0 %s Z' % (f(x), f(y - 6 * s), f(-10 * s), f(-18 * s), f(-44 * s), f(11 * s), f(22 * s), f(44 * s)), '#ffe08a', False)]


def oil_lamp(t):
    return [ell(t, 256, 452, 110, 28, t.c('wood2')), path(t, 'M186 452 Q 150 380 210 330 L 302 330 Q 362 380 326 452 Z', '#9fb7b3'),
            rect(t, 224, 300, 64, 32, t.c('gold')), path(t, 'M226 300 Q 200 220 236 150 L 276 150 Q 312 220 286 300 Z', '#dfeceb', extra=op(0.75))] + flame(t, 256, 270, 1.0)


def candle(t):
    return [ell(t, 256, 462, 100, 22, t.c('gold')), rect(t, 222, 230, 68, 226, t.c('cloth')), path(t, 'M222 250 q 12 30 0 60', 'none', True, sw=3)] + flame(t, 256, 226, 1.1)


def incense_bowl(t):
    out = [path(t, 'M120 300 Q 130 470 256 470 Q 382 470 392 300 Z', t.c('red')), ell(t, 256, 300, 136, 28, shade(t.c('red'), 0.3)),
           ell(t, 256, 300, 120, 20, '#cfc6b5', True, sw=2)]
    if t.detail:
        out.append(path(t, 'M150 370 Q 256 400 362 370', 'none', True, sw=3, extra=' stroke="%s"' % t.c('gold')))
    for k in range(5):
        out.append(line(t, 210 + k * 22, 300, 196 + k * 30, 70, t.c('red'), 5))
        out.append(circ(t, 196 + k * 30, 70, 5, t.c('fire'), False))
    return out


def incense_sticks(t):
    out = []
    for k in range(7):
        out.append(line(t, 236 + k * 7, 470, 200 + k * 20, 90, t.c('red'), 6))
        out.append(circ(t, 200 + k * 20, 90, 6, t.c('fire'), False))
    out.append(rect(t, 220, 380, 80, 30, t.c('gold'), True))
    for k in range(3):
        out.append(spath('M%s 70 q -20 -30 0 -60' % f(220 + k * 40), '#cfcac0', 3, op(0.7)))
    return out


def coffin(t):
    return [poly(t, [(40, 330), (60, 470), (470, 470), (490, 300)], t.c('dark')), poly(t, [(40, 330), (90, 250), (470, 220), (490, 300)], shade(t.c('dark'), -0.25)),
            rect(t, 210, 330, 110, 90, t.c('red'), True, sw=t.lw * 0.6), circ(t, 265, 375, 26, t.c('gold'), True, sw=t.lw * 0.5)]


def white_mourning_headband(t):
    return [ell(t, 256, 300, 190, 110, t.c('cloth')), ell(t, 256, 300, 150, 76, '#ffffff', False, extra=op(0)), ell(t, 256, 300, 150, 76, 'none', True, sw=t.lw * 0.6),
            path(t, 'M380 330 L 430 470 L 380 460 L 350 350 Z', t.c('cloth')), path(t, 'M350 340 L 360 480 L 320 470 L 320 350 Z', t.c('cloth'))]


def ancestor_portrait(t):
    return [rect(t, 120, 60, 272, 400, t.c('wood')), rect(t, 150, 92, 212, 336, t.c('cloth')), circ(t, 256, 210, 56, '#8d8a85', True), path(t, 'M170 428 Q 180 300 256 290 Q 332 300 342 428 Z', '#6e6b67'),
            rect(t, 100, 440, 312, 30, t.c('wood2'))]


def paper_talisman(t):
    out = [rect(t, 176, 40, 160, 430, '#e8c64a')]
    for y in (110, 200, 290, 380):
        out.append(spath('M216 %s q 40 -30 80 0 q -40 30 -80 0' % f(y), t.c('red'), 8))
    out.append(line(t, 256, 60, 256, 450, t.c('red'), 5))
    return out


def old_mirror(t):
    return [rect(t, 236, 380, 40, 70, t.c('gold')), ell(t, 256, 466, 100, 18, shade(t.c('gold'), 0.2)), circ(t, 256, 220, 170, shade(t.c('gold'), 0.15)),
            circ(t, 256, 220, 136, '#b8c6c9'), path(t, 'M180 170 q 40 -50 100 -40', 'none', False, extra=' stroke="#ffffff" stroke-width="10" opacity="0.6" stroke-linecap="round"')]


def comb(t):
    out = [path(t, 'M80 230 Q 256 120 432 230 L 432 270 L 80 270 Z', t.c('wood2'))]
    for k in range(18):
        x = 96 + k * 19
        out.append(rect(t, x, 268, 10, 150, t.c('wood2'), True, sw=t.lw * 0.5))
    return out


def embroidered_scarf(t):
    out = [path(t, 'M60 160 L 452 120 L 470 360 L 80 400 Z', '#1f1f2a')]
    for k, c in enumerate([t.c('red'), t.c('gold'), '#3f8f5a', '#d9548c']):
        y = 190 + k * 50
        out.append(line(t, 90, y + 4, 440, y - 30, c, 9, extra=' stroke-dasharray="16 10"'))
    for k in range(10):
        x = 86 + k * 40
        out.append(line(t, x, 398 - k * 4, x - 4, 460 - k * 4, [t.c('red'), t.c('gold'), '#3f8f5a'][k % 3], 7))
    return out


def temple_bell(t):
    return [rect(t, 236, 30, 40, 40, t.c('wood')), path(t, 'M150 410 Q 130 100 256 70 Q 382 100 362 410 Z', shade(t.c('gold'), 0.25)),
            rect(t, 120, 400, 272, 40, shade(t.c('gold'), 0.35)), line(t, 160, 180, 352, 180, t.line, 4), line(t, 150, 300, 362, 300, t.line, 4), circ(t, 256, 360, 26, shade(t.c('gold'), 0.45))]


def wooden_fish(t):
    return [path(t, 'M90 330 Q 90 170 256 170 Q 422 170 422 330 Q 422 470 256 470 Q 90 470 90 330 Z', t.c('red')),
            path(t, 'M170 340 Q 256 380 342 340', 'none', True, sw=t.lw * 1.2), circ(t, 170, 260, 14, t.c('dark'), False),
            line(t, 330, 160, 460, 40, t.c('wood2'), 14), circ(t, 465, 36, 22, t.c('wood'))]


def prayer_beads(t):
    out = []
    for k in range(22):
        a = math.radians(k * 360 / 22)
        out.append(circ(t, 256 + math.cos(a) * 150, 250 + math.sin(a) * 150, 22, t.c('wood'), True, sw=t.lw * 0.6))
    out.append(path(t, 'M256 400 L 230 470 L 282 470 Z', t.c('red')))
    return out


def machete(t):
    return [path(t, 'M60 300 Q 250 220 440 150 Q 470 190 430 230 Q 260 300 80 340 Z', '#b9c2c4'), rect(t, 30, 300, 120, 50, t.c('wood'), rx=16)]


def axe(t):
    return [line(t, 120, 470, 360, 70, t.c('wood2'), 26), path(t, 'M300 60 L 450 80 Q 470 170 420 220 L 330 170 Z', '#a7b0b2')]


def walking_stick(t):
    return [path(t, 'M250 470 L 262 140 Q 262 60 330 60 Q 390 70 380 120', 'none', True, sw=30, extra=''), path(t, 'M250 470 L 262 140 Q 262 60 330 60 Q 390 70 380 120', 'none', False, extra=' stroke="%s" stroke-width="20" stroke-linecap="round"' % t.c('wood2'))]


def conical_hat(t):
    out = [poly(t, [(40, 400), (256, 120), (472, 400)], t.c('thatch')), ell(t, 256, 400, 216, 30, t.c('thatch2'))]
    for k in range(1, 6):
        out.append(line(t, 256 - 216 * k / 6, 120 + 280 * k / 6, 256 + 216 * k / 6, 120 + 280 * k / 6, t.c('thatch2'), 3))
    return out


def bamboo_basket(t):
    out = [path(t, 'M130 120 L 382 120 L 350 470 L 162 470 Z', t.c('woven'))]
    for k in range(1, 9):
        y = 120 + k * 40
        out.append(line(t, 130 + k * 4, y, 382 - k * 4, y, t.c('woven2'), 4))
    for k in range(1, 7):
        out.append(line(t, 130 + k * 36, 120, 162 + k * 27, 470, t.c('woven2'), 3))
    out.append(path(t, 'M150 130 Q 256 0 362 130', 'none', True, sw=t.lw * 2))
    return out


def cooking_pot(t):
    return [ell(t, 256, 200, 160, 34, t.c('dark')), path(t, 'M96 200 Q 90 470 256 470 Q 422 470 416 200 Z', shade(t.c('wood'), 0.35)), ell(t, 256, 200, 130, 22, '#1a1614'),
            line(t, 80, 230, 120, 230, t.line, 12), line(t, 392, 230, 432, 230, t.line, 12)]


def rice_bowl(t):
    return [ell(t, 256, 260, 170, 44, '#f4f1ea'), path(t, 'M86 260 Q 110 440 256 440 Q 402 440 426 260 Z', '#d7e3e8'), path(t, 'M120 320 Q 256 360 392 320', 'none', False, extra=' stroke="#4d7fa3" stroke-width="10"'),
            rect(t, 210, 430, 92, 30, '#c3cfd4'), line(t, 230, 250, 220, 40, t.c('wood2'), 10), line(t, 270, 250, 270, 40, t.c('wood2'), 10)]


def teapot(t):
    return [path(t, 'M130 250 Q 120 450 256 450 Q 392 450 382 250 Z', t.c('dirt') if 'dirt' in t.p else t.c('wood')), ell(t, 256, 250, 126, 24, shade(t.c('wood'), 0.2)),
            path(t, 'M380 300 Q 470 300 470 220', 'none', True, sw=22), path(t, 'M130 290 Q 60 300 80 380 Q 100 420 140 400', 'none', True, sw=14), circ(t, 256, 220, 22, t.c('wood'))]


def joss_paper(t):
    out = []
    for k, (x, y, a) in enumerate([(120, 300, -8), (220, 260, 6), (300, 320, -4), (180, 360, 10)]):
        out.append('<g transform="rotate(%d %d %d)">%s%s</g>' % (a, x + 80, y + 50, rect(t, x, y, 170, 110, '#e3c04a' if k % 2 else '#e9e1cf'), rect(t, x + 50, y + 25, 70, 60, t.c('red'), True, sw=t.lw * 0.5)))
    return out


def paper_effigy(t):
    return [circ(t, 256, 110, 60, '#efe8dc'), path(t, 'M150 470 L 180 180 L 332 180 L 362 470 Z', t.c('red')), rect(t, 150, 200, 212, 40, t.c('gold'), True, sw=t.lw * 0.6),
            line(t, 180, 200, 100, 330, t.line, 8), line(t, 332, 200, 412, 330, t.line, 8), circ(t, 236, 100, 7, t.line, False), circ(t, 276, 100, 7, t.line, False), circ(t, 238, 128, 10, t.c('red'), False), circ(t, 274, 128, 10, t.c('red'), False)]


def old_doll(t):
    return [circ(t, 256, 140, 80, '#e9d8c0'), path(t, 'M176 150 Q 170 60 256 56 Q 342 60 336 150 Q 300 110 256 110 Q 212 110 176 150 Z', '#2a2220'),
            path(t, 'M170 470 L 200 230 L 312 230 L 342 470 Z', mix(t.c('red'), '#ffffff', 0.25)), circ(t, 228, 145, 10, t.line, False), line(t, 274, 140, 296, 150, t.line, 5),
            line(t, 240, 290, 270, 320, t.line, 4), line(t, 270, 290, 240, 320, t.line, 4)]


def black_cat(t):
    return [path(t, 'M150 470 Q 120 330 200 280 Q 256 250 312 290 Q 380 340 350 470 Z', '#1d1b1e'), circ(t, 256, 220, 86, '#1d1b1e'),
            poly(t, [(186, 170), (196, 90), (240, 150)], '#1d1b1e'), poly(t, [(326, 170), (316, 90), (272, 150)], '#1d1b1e'),
            ell(t, 222, 220, 20, 14, '#e8d35a', False), ell(t, 290, 220, 20, 14, '#e8d35a', False), ell(t, 222, 220, 5, 12, '#111', False), ell(t, 290, 220, 5, 12, '#111', False),
            path(t, 'M350 450 Q 470 440 450 320', 'none', True, sw=30), path(t, 'M350 450 Q 470 440 450 320', 'none', False, extra=' stroke="#1d1b1e" stroke-width="22" stroke-linecap="round"')]


def crow(t):
    return [path(t, 'M120 300 Q 160 200 270 210 Q 360 220 420 300 Q 330 300 280 340 Q 200 360 120 300 Z', '#1b1b20'), circ(t, 150, 250, 54, '#1b1b20'), poly(t, [(100, 250), (50, 270), (104, 280)], '#3a3532'),
            circ(t, 140, 238, 8, '#d8d0c0', False), line(t, 240, 340, 230, 470, '#3a3532', 8), line(t, 280, 340, 290, 470, '#3a3532', 8)]


def owl(t):
    return [line(t, 60, 440, 452, 440, t.c('wood'), 26), path(t, 'M160 430 Q 140 200 256 140 Q 372 200 352 430 Z', mix(t.c('wood2'), '#ffffff', 0.1)),
            poly(t, [(170, 170), (190, 100), (230, 160)], t.c('wood2')), poly(t, [(342, 170), (322, 100), (282, 160)], t.c('wood2')), circ(t, 212, 220, 40, '#efe6c8'), circ(t, 300, 220, 40, '#efe6c8'),
            circ(t, 212, 222, 16, '#111', False), circ(t, 300, 222, 16, '#111', False), poly(t, [(246, 250), (266, 250), (256, 280)], t.c('gold'))]


def skull(t):
    return [path(t, 'M120 260 Q 120 90 256 90 Q 392 90 392 260 Q 392 330 340 350 L 340 420 L 172 420 L 172 350 Q 120 330 120 260 Z', '#e8e2d2'), circ(t, 200, 260, 38, '#1c1a1a', False), circ(t, 312, 260, 38, '#1c1a1a', False),
            poly(t, [(256, 300), (236, 340), (276, 340)], '#1c1a1a', False), line(t, 210, 380, 210, 420, t.line, 4), line(t, 256, 380, 256, 420, t.line, 4), line(t, 302, 380, 302, 420, t.line, 4)]


def bones(t):
    out = []
    for x1, y1, x2, y2 in [(80, 450, 420, 380), (110, 380, 400, 460), (160, 420, 360, 330)]:
        out.append(line(t, x1, y1, x2, y2, t.line, 34))
        out.append(line(t, x1, y1, x2, y2, '#e8e2d2', 24))
        for x, y in ((x1, y1), (x2, y2)):
            out.append(circ(t, x, y - 10, 18, '#e8e2d2', True, sw=t.lw * 0.6))
            out.append(circ(t, x, y + 10, 18, '#e8e2d2', True, sw=t.lw * 0.6))
    return out


def tombstone_p(t):
    return [path(t, 'M150 460 L 150 160 Q 256 60 362 160 L 362 460 Z', t.c('stone')), rect(t, 110, 440, 292, 36, t.c('stone2')),
            line(t, 210, 200, 300, 200, t.c('stone2'), 8), line(t, 256, 170, 256, 380, t.c('stone2'), 8), line(t, 200, 260, 312, 260, t.c('stone2'), 6)]


def grave_mound(t):
    return [path(t, 'M30 470 Q 256 140 482 470 Z', t.c('mound')), path(t, 'M210 470 L 210 270 Q 256 230 302 270 L 302 470 Z', t.c('stone')),
            line(t, 360, 470, 350, 360, t.c('red'), 5), line(t, 380, 470, 380, 350, t.c('red'), 5), line(t, 400, 470, 410, 360, t.c('red'), 5)]


def red_wedding_dress(t):
    return [path(t, 'M200 60 L 312 60 L 360 140 L 330 170 L 320 470 L 192 470 L 182 170 L 152 140 Z', t.c('red')), path(t, 'M200 60 L 256 120 L 312 60', 'none', True, sw=t.lw),
            line(t, 152, 140, 90, 330, t.line, t.lw), path(t, 'M152 140 L 90 330 L 130 340 L 182 170 Z', t.c('red')), path(t, 'M360 140 L 422 330 L 382 340 L 330 170 Z', t.c('red')),
            circ(t, 256, 220, 30, t.c('gold'), True, sw=t.lw * 0.6), circ(t, 256, 330, 24, t.c('gold'), True, sw=t.lw * 0.6)]


def embroidered_shoes(t):
    out = []
    for x in (150, 350):
        out.append(path(t, 'M%s 460 L %s 360 Q %s 300 %s 340 L %s 460 Z' % (f(x - 90), f(x - 80), f(x), f(x + 90), f(x + 90)), t.c('red')))
        out.append(path(t, 'M%s 380 q 30 -30 60 0' % f(x - 30), 'none', False, extra=' stroke="%s" stroke-width="8"' % t.c('gold')))
    return out


def silver_bracelet(t):
    return [ell(t, 256, 300, 180, 90, '#c9cdd0'), ell(t, 256, 300, 140, 60, '#ffffff', False, extra=op(0)), ell(t, 256, 300, 140, 60, 'none', True),
            path(t, 'M120 280 q 136 60 272 0', 'none', False, extra=' stroke="#ffffff" stroke-width="8" opacity="0.7"')]


def hairpin(t):
    return [line(t, 80, 440, 400, 120, t.line, 22), line(t, 80, 440, 400, 120, '#c9cdd0', 14), circ(t, 410, 110, 46, t.c('red')), circ(t, 410, 110, 18, t.c('gold'), False),
            line(t, 380, 150, 380, 260, t.c('gold'), 5), circ(t, 380, 266, 12, t.c('gold'))]


def water_jar(t):
    return jar(t, 256, 470, 2.6, t.c('wood2')) + [line(t, 300, 110, 420, 40, t.c('wood'), 10), ell(t, 430, 36, 40, 22, t.c('wood2'))]


def firewood(t):
    out = []
    for k in range(7):
        y = 460 - (k % 3) * 60 - (k // 3) * 20
        x0 = 60 + (k % 2) * 30
        out.append(rect(t, x0, y - 50, 380, 50, t.c('wood'), rx=22))
        out.append(ell(t, x0 + 380, y - 25, 22, 25, t.c('wood2')))
    out.append(line(t, 180, 230, 180, 470, t.c('thatch2'), 10))
    out.append(line(t, 340, 230, 340, 470, t.c('thatch2'), 10))
    return out


def torch(t):
    return [line(t, 256, 470, 256, 200, t.line, 30), line(t, 256, 470, 256, 200, t.c('wood2'), 20), rect(t, 220, 170, 72, 60, t.c('thatch2'))] + flame(t, 256, 170, 2.0)


def old_book(t):
    return [poly(t, [(60, 400), (256, 440), (452, 400), (452, 160), (256, 200), (60, 160)], '#e9dcb8'), line(t, 256, 200, 256, 440, t.line, t.lw),
            poly(t, [(50, 410), (256, 455), (462, 410), (462, 420), (256, 470), (50, 420)], t.c('red'))] + [line(t, 90, 210 + k * 40, 220, 236 + k * 40, '#9a8e70', 4) for k in range(5)] + [line(t, 292, 236 + k * 40, 420, 210 + k * 40, '#9a8e70', 4) for k in range(5)]


def ghost_fire(t):
    out = []
    for x, y, s in [(256, 300, 1.8), (150, 380, 0.9), (380, 220, 1.0)]:
        out.append(circ(t, x, y - 40 * s, 90 * s, t.rg([(0, '#9fe3ff', 0.55), (1, '#9fe3ff', 0)]), False))
        out.append(path(t, 'M%s %s q %s %s 0 %s q %s %s 0 %s Z' % (f(x), f(y), f(-34 * s), f(-40 * s), f(-110 * s), f(36 * s), f(50 * s), f(110 * s)), '#bdf1ff', False, extra=op(0.85)))
    return out


def rope(t):
    out = []
    for k in range(5):
        out.append(ell(t, 256, 360 - k * 28, 170 - k * 8, 60, 'none', True, sw=t.lw * 3))
        out.append(ell(t, 256, 360 - k * 28, 170 - k * 8, 60, 'none', False, extra=' stroke="%s" stroke-width="%s"' % (t.c('thatch'), f(t.lw * 2))))
    out.append(path(t, 'M420 360 Q 470 420 430 470', 'none', False, extra=' stroke="%s" stroke-width="14"' % t.c('thatch')))
    return out


PROPS = {
    'oil_lamp': (oil_lamp, 0.3), 'candle': (candle, 0.2), 'incense_bowl': (incense_bowl, 0.3), 'incense_sticks': (incense_sticks, 0.35), 'coffin': (coffin, 0.8),
    'white_mourning_headband': (white_mourning_headband, 0.3), 'ancestor_portrait': (ancestor_portrait, 0.45), 'paper_talisman': (paper_talisman, 0.35), 'old_mirror': (old_mirror, 0.4),
    'comb': (comb, 0.12), 'embroidered_scarf': (embroidered_scarf, 0.4), 'temple_bell': (temple_bell, 1.2), 'wooden_fish': (wooden_fish, 0.35), 'prayer_beads': (prayer_beads, 0.25),
    'machete': (machete, 0.5), 'axe': (axe, 0.7), 'walking_stick': (walking_stick, 1.1), 'conical_hat': (conical_hat, 0.3), 'bamboo_basket': (bamboo_basket, 0.6),
    'cooking_pot': (cooking_pot, 0.35), 'rice_bowl': (rice_bowl, 0.15), 'teapot': (teapot, 0.2), 'joss_paper': (joss_paper, 0.2), 'paper_effigy': (paper_effigy, 0.9),
    'old_doll': (old_doll, 0.35), 'black_cat': (black_cat, 0.35), 'crow': (crow, 0.3), 'owl': (owl, 0.35), 'skull': (skull, 0.22), 'bones': (bones, 0.25),
    'tombstone': (tombstone_p, 0.9), 'grave_mound': (grave_mound, 1.0), 'red_wedding_dress': (red_wedding_dress, 1.3), 'embroidered_shoes': (embroidered_shoes, 0.12),
    'silver_bracelet': (silver_bracelet, 0.1), 'hairpin': (hairpin, 0.15), 'water_jar': (water_jar, 0.8), 'firewood': (firewood, 0.4), 'torch': (torch, 0.8),
    'old_book': (old_book, 0.25), 'ghost_fire': (ghost_fire, 0.5), 'rope': (rope, 0.25),
}


def build_prop(key, style):
    t = PT(style, False, seed=sum(map(ord, key)))
    fn, h = PROPS[key]
    return psvg(t, fn(t)), h
