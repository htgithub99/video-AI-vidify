from interior import *

METAL = '#b9bec2'
INK = '#1d1b1e'


def ancient_coin(t):
    return [circ(t, 256, 270, 190, shade(t.c('gold'), 0.25)), circ(t, 256, 270, 150, 'none', True, sw=t.lw * 0.6), rect(t, 216, 230, 80, 80, '#2a2622', True),
            line(t, 256, 110, 256, 150, t.line, 8), line(t, 256, 390, 256, 430, t.line, 8), line(t, 96, 270, 136, 270, t.line, 8), line(t, 376, 270, 416, 270, t.line, 8)]


def smartphone(t):
    return [rect(t, 150, 40, 212, 430, INK, True, rx=30), rect(t, 168, 80, 176, 340, mix('#7fa6c9', '#ffffff', 0.3), False), circ(t, 256, 448, 10, '#555', False),
            rect(t, 186, 110, 140, 18, '#ffffff', False, extra=op(0.8)), rect(t, 186, 150, 110, 14, '#ffffff', False, extra=op(0.6)), rect(t, 186, 180, 125, 14, '#ffffff', False, extra=op(0.6))]


def cigarette(t):
    return [rect(t, 40, 240, 340, 40, '#f4f1ea', True, rx=6), rect(t, 380, 240, 92, 40, '#d79a4a', True, rx=6), rect(t, 30, 244, 20, 32, t.c('fire'), False),
            circ(t, 34, 260, 12, '#ff7a2a', False)]


def cigarette_pack(t):
    return [rect(t, 130, 140, 252, 330, t.c('red'), True, rx=8), rect(t, 130, 140, 252, 90, '#f4f1ea', True), rect(t, 170, 300, 172, 60, '#f4f1ea', True, sw=t.lw * 0.5),
            rect(t, 170, 100, 30, 50, '#f4f1ea', True, sw=t.lw * 0.5), rect(t, 210, 90, 30, 60, '#f4f1ea', True, sw=t.lw * 0.5)]


def lighter(t):
    return [rect(t, 170, 180, 172, 290, t.c('red'), True, rx=20), rect(t, 190, 120, 132, 70, METAL, True, rx=8), circ(t, 300, 150, 24, '#7a7f84', True, sw=t.lw * 0.5)]


def motorbike(t):
    return [circ(t, 110, 400, 70, INK, True), circ(t, 110, 400, 30, METAL, True, sw=t.lw * 0.5), circ(t, 402, 400, 70, INK, True), circ(t, 402, 400, 30, METAL, True, sw=t.lw * 0.5),
            path(t, 'M120 330 Q 190 250 300 300 L 380 300 Q 410 330 402 400 L 300 400 Q 230 360 120 400 Z', mix(t.c('water'), t.c('dark'), 0.45), True),
            rect(t, 200, 250, 150, 40, INK, True, rx=14), line(t, 380, 300, 420, 190, METAL, 14), line(t, 400, 190, 460, 180, INK, 12), ell(t, 430, 230, 20, 14, t.c('lamp'), True, sw=t.lw * 0.5)]


def bicycle(t):
    return [circ(t, 120, 380, 90, 'none', True, sw=t.lw * 1.4), circ(t, 392, 380, 90, 'none', True, sw=t.lw * 1.4), pline(t, [(120, 380), (220, 250), (340, 250), (392, 380)], t.c('red'), 16),
            pline(t, [(220, 250), (260, 380), (340, 250)], t.c('red'), 16), line(t, 220, 250, 210, 200, INK, 10), rect(t, 180, 186, 70, 20, INK, True, sw=t.lw * 0.5), line(t, 340, 250, 350, 180, INK, 10), line(t, 330, 180, 390, 175, INK, 10)]


def pig(t):
    c = '#3a3436'
    return [ell(t, 250, 330, 200, 110, c, True), circ(t, 430, 300, 70, c, True), ell(t, 490, 310, 26, 22, mix(c, '#d08a8a', 0.4), True, sw=t.lw * 0.5),
            poly(t, [(410, 240), (440, 200), (460, 250)], c, True, sw=t.lw * 0.6), circ(t, 440, 285, 7, '#e8e2d0', False)] + [rect(t, x, 400, 32, 70, c, True, sw=t.lw * 0.6) for x in (110, 170, 320, 380)] + [path(t, 'M50 310 q -30 -20 -10 -50', 'none', True, sw=t.lw * 1.2)]


def black_dog(t):
    c = '#151416'
    return [ell(t, 240, 300, 170, 80, c, True), circ(t, 410, 230, 62, c, True), poly(t, [(450, 230), (500, 250), (470, 270)], c, True), poly(t, [(380, 190), (390, 130), (420, 180)], c, True)] + \
           [rect(t, x, 330, 26, 140, c, True, sw=t.lw * 0.6) for x in (110, 160, 300, 350)] + [path(t, 'M80 280 q -50 -40 -40 -110', 'none', True, sw=t.lw * 2.4), circ(t, 425, 222, 9, '#f2d34a', False)]


def chicken_tray(t):
    return [ell(t, 256, 420, 230, 50, shade(t.c('red'), 0.15), True), ell(t, 256, 400, 210, 40, t.c('red'), True), ell(t, 220, 350, 120, 70, '#e9b14a', True),
            path(t, 'M120 340 q -40 -60 10 -70', 'none', True, sw=t.lw * 1.6), circ(t, 340, 370, 26, '#f4f1ea', True, sw=t.lw * 0.6), circ(t, 390, 380, 26, '#f4f1ea', True, sw=t.lw * 0.6)]


def wine_bottle(t):
    return [path(t, 'M200 470 L 200 230 Q 200 180 236 160 L 236 70 L 276 70 L 276 160 Q 312 180 312 230 L 312 470 Z', mix(t.c('water'), t.c('cloth'), 0.4), True), rect(t, 230, 40, 52, 34, t.c('red'), True, sw=t.lw * 0.5),
            rect(t, 210, 300, 92, 110, '#f4f1ea', True, sw=t.lw * 0.5)]


def wine_cup(t):
    return [path(t, 'M150 240 L 362 240 L 330 420 L 182 420 Z', '#f4f1ea', True), ell(t, 256, 240, 106, 22, mix(t.c('water'), '#ffffff', 0.5), True, sw=t.lw * 0.5), rect(t, 200, 420, 112, 40, '#f4f1ea', True, sw=t.lw * 0.6)]


def plate_of_rice(t):
    return [ell(t, 256, 380, 230, 60, '#e4e8ea', True), ell(t, 256, 360, 190, 40, '#f4f1ea', False), path(t, 'M120 360 Q 256 220 392 360 Z', '#ffffff', True, sw=t.lw * 0.6)]


def spoon(t):
    return [ell(t, 120, 300, 80, 50, METAL, True), line(t, 190, 290, 470, 220, METAL, 18), line(t, 190, 290, 470, 220, t.line, 4, extra=op(0.4))]


def playing_card(t):
    return [rect(t, 150, 50, 212, 420, '#e9dcb8', True, rx=14), rect(t, 172, 74, 168, 372, 'none', True, sw=t.lw * 0.5, rx=8),
            path(t, 'M210 200 L 300 200 M 255 160 L 255 330 M 205 280 L 305 280 M 225 330 L 285 330', 'none', False, extra=' stroke="%s" stroke-width="18" stroke-linecap="round"' % t.c('red'))]


def letter(t):
    return [rect(t, 60, 140, 392, 260, '#f4f1ea', True), pline(t, [(60, 140), (256, 290), (452, 140)], t.line, t.lw), rect(t, 360, 160, 60, 70, t.c('red'), True, sw=t.lw * 0.5)]


def land_deed(t):
    out = [rect(t, 90, 50, 332, 420, '#efe6cc', True)]
    for k in range(7):
        out.append(line(t, 130, 110 + k * 40, 380 - (k % 3) * 40, 110 + k * 40, '#7a705c', 5))
    out.append(circ(t, 340, 400, 44, 'none', False, extra=' stroke="%s" stroke-width="10"' % t.c('red')))
    return out


def debt_ledger(t):
    out = [rect(t, 110, 60, 300, 400, '#5a3d2a', True, rx=10), rect(t, 140, 60, 260, 400, '#efe6cc', True)]
    for k in range(9):
        out.append(line(t, 170, 110 + k * 36, 370, 110 + k * 36, '#8a7f66', 4))
    out.append(line(t, 140, 60, 140, 460, t.line, t.lw))
    return out


def pen(t):
    return [line(t, 80, 430, 420, 90, '#2f4f9a', 30), line(t, 80, 430, 420, 90, t.line, 4, extra=op(0.3)), poly(t, [(60, 450), (68, 420), (92, 440)], INK, True), line(t, 330, 160, 400, 90, METAL, 8)]


def kite(t):
    return [poly(t, [(256, 40), (380, 200), (256, 380), (132, 200)], t.c('gold'), True), line(t, 256, 40, 256, 380, t.line, 4), line(t, 132, 200, 380, 200, t.line, 4),
            path(t, 'M256 380 q -30 40 0 70 q 30 30 -10 50', 'none', False, extra=' stroke="%s" stroke-width="6"' % t.c('red'))]


def wooden_effigy(t):
    return [circ(t, 256, 110, 60, t.c('wood2'), True), rect(t, 206, 170, 100, 180, t.c('wood2'), True, rx=20), rect(t, 120, 190, 272, 44, t.c('wood2'), True, rx=18),
            rect(t, 210, 340, 38, 130, t.c('wood2'), True, rx=12), rect(t, 264, 340, 38, 130, t.c('wood2'), True, rx=12), line(t, 236, 100, 276, 100, t.line, 5)]


def straw_effigy(t):
    c = t.c('thatch')
    return [circ(t, 256, 110, 60, c, True), path(t, 'M216 170 L 296 170 L 330 470 L 182 470 Z', c, True), path(t, 'M90 210 L 422 210 L 422 250 L 90 250 Z', c, True),
            line(t, 200, 300, 312, 300, t.c('red'), 10)] + [line(t, 200 + k * 22, 330, 190 + k * 26, 460, shade(c, 0.25), 4) for k in range(6)]


def kitchen_knife(t):
    return [path(t, 'M60 250 L 330 230 L 340 290 L 70 290 Q 40 270 60 250 Z', METAL, True), rect(t, 330, 236, 140, 50, t.c('wood'), True, rx=12)]


def cap(t):
    return [path(t, 'M110 330 Q 120 140 256 130 Q 392 140 402 330 Z', mix(t.c('water'), t.c('dark'), 0.5), True), path(t, 'M380 320 Q 470 320 490 360 L 380 360 Z', mix(t.c('water'), t.c('dark'), 0.65), True),
            rect(t, 100, 320, 300, 34, mix(t.c('water'), t.c('dark'), 0.65), True), circ(t, 256, 130, 14, INK, False)]


def flashlight(t):
    return [rect(t, 60, 220, 300, 80, INK, True, rx=16), path(t, 'M360 200 L 440 170 L 440 350 L 360 320 Z', METAL, True), ell(t, 445, 260, 18, 90, t.c('lamp'), True, sw=t.lw * 0.5)]


def cake_basket(t):
    return [path(t, 'M70 250 L 442 250 L 400 460 L 112 460 Z', t.c('woven'), True)] + [ell(t, 140 + k * 60, 240 - (k % 2) * 30, 50, 30, t.c('gold'), True, sw=t.lw * 0.6) for k in range(5)]


def chili_bundle(t):
    out = [line(t, 256, 20, 256, 120, t.c('thatch2'), 10)]
    for k in range(9):
        a = -60 + k * 15
        import math
        r = math.radians(a + 90)
        x2, y2 = 256 + math.cos(r) * 300, 120 + math.sin(r) * 330
        out.append(line(t, 256, 130, x2, y2, t.c('red'), 26))
    return out


def hammer(t):
    return [rect(t, 236, 160, 40, 310, t.c('wood2'), True, rx=10), rect(t, 120, 60, 272, 100, '#4f5459', True, rx=12)]


def hand_saw(t):
    return [path(t, 'M60 200 L 400 160 L 400 300 L 60 270 Z', METAL, True), rect(t, 380, 140, 100, 180, t.c('wood2'), True, rx=30)] + [poly(t, [(60 + k * 30, 270 + k * 3.5), (75 + k * 30, 295 + k * 3.5), (90 + k * 30, 274 + k * 3.5)], METAL, True, sw=t.lw * 0.4) for k in range(11)]


def sickle(t):
    return [path(t, 'M120 420 Q 60 160 300 100 Q 440 80 470 200 Q 400 140 300 160 Q 160 200 170 420 Z', METAL, True), rect(t, 110, 400, 70, 80, t.c('wood2'), True, rx=14)]


def carrying_pole(t):
    out = [line(t, 30, 140, 482, 140, t.c('wood2'), 18)]
    for x in (90, 422):
        out += [line(t, x - 50, 140, x - 60, 330, t.line, 4), line(t, x + 50, 140, x + 60, 330, t.line, 4), path(t, 'M%s 330 L %s 330 L %s 460 L %s 460 Z' % (x - 80, x + 80, x + 60, x - 60), t.c('woven'), True)]
    return out


def banknotes(t):
    return [rect(t, 70 + k * 18, 160 + k * 26, 340, 170, mix('#7fb08a', '#ffffff', 0.25), True, rx=8) for k in range(4)] + [circ(t, 300, 300, 40, 'none', True, sw=t.lw * 0.6)]


def umbrella(t):
    return [path(t, 'M40 260 Q 256 20 472 260 Q 420 230 364 260 Q 310 230 256 260 Q 202 230 148 260 Q 92 230 40 260 Z', INK, True), line(t, 256, 60, 256, 440, t.c('wood2'), 12),
            path(t, 'M256 440 Q 256 480 220 470', 'none', True, sw=t.lw * 1.4)]


def ghost_face(t):
    return [circ(t, 256, 256, 200, '#f1f1ee', True), ell(t, 190, 220, 26, 34, INK, False), ell(t, 322, 220, 26, 34, INK, False),
            path(t, 'M150 320 Q 256 400 362 320 Q 256 360 150 320 Z', INK, True), pline(t, [(150, 150), (190, 130), (180, 160), (220, 150)], t.c('red'), 6)]


REF_PROPS = {
    'ancient_coin': (ancient_coin, 0.04, 'body'), 'smartphone': (smartphone, 0.15, 'held'), 'cigarette': (cigarette, 0.09, 'held'), 'cigarette_pack': (cigarette_pack, 0.09, 'table'),
    'lighter': (lighter, 0.07, 'held'), 'motorbike': (motorbike, 1.9, 'floor'), 'bicycle': (bicycle, 1.7, 'floor'), 'pig': (pig, 1.2, 'floor'), 'black_dog': (black_dog, 0.9, 'floor'),
    'offering_tray': (chicken_tray, 0.6, 'table'), 'wine_bottle': (wine_bottle, 0.3, 'table'), 'wine_cup': (wine_cup, 0.06, 'table'), 'plate_of_rice': (plate_of_rice, 0.25, 'table'),
    'spoon': (spoon, 0.15, 'held'), 'playing_card': (playing_card, 0.09, 'held'), 'letter': (letter, 0.22, 'held'), 'land_deed': (land_deed, 0.3, 'held'), 'debt_ledger': (debt_ledger, 0.25, 'held'),
    'pen': (pen, 0.14, 'held'), 'kite': (kite, 0.8, 'air'), 'wooden_effigy': (wooden_effigy, 0.25, 'held'), 'straw_effigy': (straw_effigy, 0.6, 'floor'), 'kitchen_knife': (kitchen_knife, 0.3, 'held'),
    'cap': (cap, 0.25, 'wear'), 'flashlight': (flashlight, 0.25, 'held'), 'cake_basket': (cake_basket, 0.45, 'hang'), 'chili_bundle': (chili_bundle, 0.5, 'hang'), 'hammer': (hammer, 0.35, 'held'),
    'hand_saw': (hand_saw, 0.6, 'held'), 'sickle': (sickle, 0.45, 'held'), 'carrying_pole': (carrying_pole, 1.6, 'shoulder'), 'banknotes': (banknotes, 0.16, 'held'), 'umbrella': (umbrella, 0.9, 'held'),
    'ghost_face': (ghost_face, 0.4, 'air'),
}
