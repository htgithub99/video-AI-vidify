if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from core import circ, ell, f, line, path, poly, rect, shade, spath
import chibi_design as D
def svg(items, box=_CODE_TEXT.VALUE_0_0_400_400):
    return _CODE_TEXT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_S_S_SVG % (box, "".join(items))
def ethnic(a):
    return any(word in a[_CODE_TEXT.KEY] for word in (_CODE_TEXT.HIGHLAND, _CODE_TEXT.HMONG, _CODE_TEXT.FESTIVAL))
def headwear(t, a):
    color = a[_CODE_TEXT.HAIRC]
    if a[_CODE_TEXT.HAIR] == _CODE_TEXT.CAP:
        return [path(t, D.CAP_CROWN, color, True), path(t, D.CAP_BAND, _CODE_TEXT.VALUE_263F60, True), path(t, D.HAT_BRIM, _CODE_TEXT.VALUE_263F60, True), circ(t, 200, 100, 11, D.GOLD, True, sw=4)]
    if a[_CODE_TEXT.HAIR] == _CODE_TEXT.HELMET:
        return [path(t, D.HELMET_CROWN, color, True), path(t, D.HAT_BRIM, color, True), circ(t, 200, 102, 12, D.GOLD, True, sw=4)]
    return []
def heads(t, a):
    views = {}
    for view in (_CODE_TEXT.FRONT, _CODE_TEXT.SIDE, _CODE_TEXT.BACK):
        hair, color, skin = a[_CODE_TEXT.HAIR], a[_CODE_TEXT.HAIRC], a[_CODE_TEXT.FACE]
        bare = hair in (_CODE_TEXT.NONE, _CODE_TEXT.BALD)
        back = view == _CODE_TEXT.BACK
        items = []
        if hair == _CODE_TEXT.BUN:
            items.append(ell(t, 203, 39, 62, 36, color, True))
        if hair in (_CODE_TEXT.LONG, _CODE_TEXT.WET):
            items.append(path(t, _CODE_TEXT.M41_147_Q_3_233_35_389_L110_399_L315_396_Q396_361_361_143Z, color, True))
        items.append(path(t, D.SPIKY_HEAD if hair == _CODE_TEXT.SPIKY else D.SIDE_HEAD if view == _CODE_TEXT.SIDE else D.HEAD, color if back and not bare else skin, True))
        if not back:
            if not bare:
                items.append(path(t, D.HAIR.get(hair, D.HAIR[_CODE_TEXT.LONG] if hair == _CODE_TEXT.WET else D.HAIR[_CODE_TEXT.SHORT]), color, True))
            if hair in (_CODE_TEXT.WRAP, _CODE_TEXT.TURBAN, _CODE_TEXT.BAND):
                wrap = a.get(_CODE_TEXT.BAND, color)
                items.append(path(t, _CODE_TEXT.M25_167_Q28_37_191_25_Q352_15_375_165_Q200_107_25_167Z, wrap, True))
                for y in (80, 113, 145):
                    items.append(spath(_CODE_TEXT.M39_S_Q200_S_361_S % (y, y - 47, y), shade(wrap, -0.2), 5))
            if hair == _CODE_TEXT.SPIKY:
                items.append(path(t, D.SPIKY_HAIR, color, True))
            if hair == _CODE_TEXT.HORNS:
                items.extend([poly(t, [(69, 89), (56, 3), (130, 74)], D.SILVER), poly(t, [(271, 74), (344, 3), (331, 89)], D.SILVER)])
            if view == _CODE_TEXT.SIDE and not bare:
                items.append(path(t, _CODE_TEXT.M26_212_Q12_92_99_47_L130_195_Q109_245_70_270_L69_330_Q35_30, color, True))
            if a.get(_CODE_TEXT.BEARD):
                items.append(path(t, _CODE_TEXT.M135_332_Q201_359_266_332_Q250_399_201_399_Q151_399_135_332Z, color, True))
            if a.get(_CODE_TEXT.AGE) == _CODE_TEXT.SENIOR:
                items.extend([spath(_CODE_TEXT.M80_262_L22_7_M297_269_L23_7, shade(skin, 0.4), 3)])
        if back and hair == _CODE_TEXT.SPIKY:
            items.append(path(t, D.SPIKY_HAIR, color, True))
        items += headwear(t, a)
        if ethnic(a) and hair in (_CODE_TEXT.LONG, _CODE_TEXT.BOB, _CODE_TEXT.BUN, _CODE_TEXT.WRAP, _CODE_TEXT.TURBAN):
            items.extend([spath(_CODE_TEXT.M42_166_Q200_99_358_166, D.GOLD, 5)])
            for x in range(55, 350, 24):
                items.append(circ(t, x, 135 + (x - 200) ** 2 / 820, 4, D.SILVER, False))
        if a[_CODE_TEXT.KEY] == _CODE_TEXT.FESTIVAL_WOMAN and view != _CODE_TEXT.BACK:
            for x, y in ((312, 59), (290, 76), (302, 99), (327, 98), (338, 76)):
                items.append(ell(t, x, y, 13, 17, _CODE_TEXT.CF6B83, True, sw=4))
            items.append(circ(t, 315, 80, 10, D.GOLD, True, sw=4))
        views[view] = svg(items)
    return views
def woven(t, y, width=245):
    left = 200 - width / 2
    items = [rect(t, left, y, width, 40, _CODE_TEXT.VALUE_8C384D, True), line(t, left, y + 5, left + width, y + 5, D.GOLD, 4), line(t, left, y + 35, left + width, y + 35, D.GOLD, 4)]
    for x in range(int(left + 18), int(left + width - 8), 30):
        items.append(poly(t, [(x, y + 11), (x + 10, y + 20), (x, y + 29), (x - 10, y + 20)], D.GOLD, False))
    return items
def bodies(t, a):
    views = {}
    for view in (_CODE_TEXT.FRONT, _CODE_TEXT.SIDE, _CODE_TEXT.BACK):
        items = []
        if a[_CODE_TEXT.HAIR] in (_CODE_TEXT.LONG, _CODE_TEXT.WET):
            items.append(path(t, _CODE_TEXT.M34_0_L366_0_L357_253_Q346_310_306_318_L90_318_Q46_301_41_25, a[_CODE_TEXT.HAIRC], True))
        dress = a[_CODE_TEXT.DRESS]
        if dress != _CODE_TEXT.ROBE:
            items.append(path(t, D.SKIRT if dress == _CODE_TEXT.DRESS else D.TROUSERS, D.DARK, True))
        items.append(path(t, D.ROBE if dress == _CODE_TEXT.ROBE else D.BLOUSE, a[_CODE_TEXT.BODY], True))
        if view != _CODE_TEXT.BACK:
            items.append(path(t, _CODE_TEXT.M151_11_Q200_64_249_11_L224_52_L200_88_L176_52Z, a[_CODE_TEXT.FACE], True))
            if dress == _CODE_TEXT.ROBE:
                items.append(spath(_CODE_TEXT.M148_18_L221_113_L221_555, shade(a[_CODE_TEXT.BODY], 0.45), 5))
            elif ethnic(a) and a[_CODE_TEXT.GENDER] == _CODE_TEXT.FEMALE:
                for y in (112, 158, 204):
                    items.append(path(t, _CODE_TEXT.M184_S_L216_S_L184_SZ_M216_S_L184_S_L216_SZ % (y, y + 12, y + 24, y, y + 12, y + 24), D.SILVER, True, sw=4))
                for y in (35, 48, 61):
                    items.append(spath(_CODE_TEXT.M145_S_Q200_S_255_S % (y, y + 43, y), D.SILVER, 4))
            else:
                items.append(line(t, 200, 88, 200, 302, shade(a[_CODE_TEXT.BODY], 0.4), 4))
                for y in (117, 165, 213, 261):
                    items.append(circ(t, 210, y, 5, D.SILVER, True, sw=3))
        if ethnic(a):
            items += woven(t, 513)
        if a.get(_CODE_TEXT.SASH) or ethnic(a):
            sash = a.get(_CODE_TEXT.SASH, D.GOLD)
            items.append(rect(t, 79, 295, 242, 21, sash, True))
            if view != _CODE_TEXT.BACK:
                items.append(path(t, _CODE_TEXT.M231_302_Q192_270_182_295_Q182_317_231_302_Q274_271_277_297_, sash, True, sw=4))
        if view == _CODE_TEXT.BACK and a[_CODE_TEXT.HAIR] in (_CODE_TEXT.LONG, _CODE_TEXT.WET):
            items.append(path(t, _CODE_TEXT.M95_0_L305_0_L294_227_Q200_285_106_227Z, a[_CODE_TEXT.HAIRC], True))
        if view == _CODE_TEXT.SIDE:
            items = [_CODE_TEXT.G_TRANSFORM_TRANSLATE_56_0_SCALE_72_1 + "".join(items) + _CODE_TEXT.G]
        views[view] = svg(items, _CODE_TEXT.VALUE_0_0_400_600)
    return views
def sprites(t, a, body):
    result = {}
    for pose, legs in ((_CODE_TEXT.SIT, D.SIT_LEGS), (_CODE_TEXT.KNEEL, D.KNEEL_LEGS), (_CODE_TEXT.CROUCH, D.CROUCH_LEGS)):
        items = [path(t, legs, a[_CODE_TEXT.BODY] if a[_CODE_TEXT.DRESS] == _CODE_TEXT.ROBE else D.DARK, True)]
        blouse = body[_CODE_TEXT.FRONT].split(_CODE_TEXT.SYMBOL_62B67E, 1)[1].rsplit(_CODE_TEXT.SVG, 1)[0]
        items.append(_CODE_TEXT.SVG_X_110_Y_S_WIDTH_280_HEIGHT_98_VIEWBOX_0_0_400_330_PRESER % (310 if pose == _CODE_TEXT.CROUCH else 290, blouse))
        if ethnic(a):
            items.append(_CODE_TEXT.G_TRANSFORM_TRANSLATE_50_0 + "".join(woven(t, 434, 140)) + _CODE_TEXT.G)
        result[pose] = dict(svg=svg(items, _CODE_TEXT.VALUE_0_0_500_500), w=1, h=0.78 if pose == _CODE_TEXT.CROUCH else 0.84, anchor=[0.5, 0.97], bodyOnly=True, rig=dict(headW=D.BODY[_CODE_TEXT.HEAD] * D.BODY[_CODE_TEXT.HEADW], headH=D.BODY[_CODE_TEXT.HEAD], headCy=-0.51 if pose == _CODE_TEXT.CROUCH else -0.57, bodyH=0.28 if pose == _CODE_TEXT.CROUCH else 0.34, bodyW=0.54))
    return result
