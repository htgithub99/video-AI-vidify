from core import circ, ell, f, line, path, poly, rect, shade, spath
import chibi_design as D


def svg(items, box="0 0 400 400"):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">%s</svg>' % (box, "".join(items))


def ethnic(a):
    return any(word in a["key"] for word in ("highland", "hmong", "festival"))


def headwear(t, a):
    color = a["hairc"]
    if a["hair"] == "cap":
        return [path(t, D.CAP_CROWN, color, True), path(t, D.CAP_BAND, "#263f60", True), path(t, D.HAT_BRIM, "#263f60", True), circ(t, 200, 100, 11, D.GOLD, True, sw=4)]
    if a["hair"] == "helmet":
        return [path(t, D.HELMET_CROWN, color, True), path(t, D.HAT_BRIM, color, True), circ(t, 200, 102, 12, D.GOLD, True, sw=4)]
    return []


def heads(t, a):
    views = {}
    for view in ("front", "side", "back"):
        hair, color, skin = a["hair"], a["hairc"], a["face"]
        bare = hair in ("none", "bald")
        back = view == "back"
        items = []
        if hair == "bun":
            items.append(ell(t, 203, 39, 62, 36, color, True))
        if hair in ("long", "wet"):
            items.append(path(t, "M41 147 Q-3 233 35 389 L110 399 L315 396 Q396 361 361 143Z", color, True))
        items.append(path(t, D.SPIKY_HEAD if hair == "spiky" else D.SIDE_HEAD if view == "side" else D.HEAD, color if back and not bare else skin, True))
        if not back:
            if not bare:
                items.append(path(t, D.HAIR.get(hair, D.HAIR["long"] if hair == "wet" else D.HAIR["short"]), color, True))
            if hair in ("wrap", "turban", "band"):
                wrap = a.get("band", color)
                items.append(path(t, "M25 167 Q28 37 191 25 Q352 15 375 165 Q200 107 25 167Z", wrap, True))
                for y in (80, 113, 145):
                    items.append(spath("M39 %s Q200 %s 361 %s" % (y, y - 47, y), shade(wrap, -0.2), 5))
            if hair == "spiky":
                items.append(path(t, D.SPIKY_HAIR, color, True))
            if hair == "horns":
                items.extend([poly(t, [(69, 89), (56, 3), (130, 74)], D.SILVER), poly(t, [(271, 74), (344, 3), (331, 89)], D.SILVER)])
            if view == "side" and not bare:
                items.append(path(t, "M26 212 Q12 92 99 47 L130 195 Q109 245 70 270 L69 330 Q35 304 26 212Z", color, True))
            if a.get("beard"):
                items.append(path(t, "M135 332 Q201 359 266 332 Q250 399 201 399 Q151 399 135 332Z", color, True))
            if a.get("age") == "senior":
                items.extend([spath("M80 262 l22 7 M297 269 l23 -7", shade(skin, 0.4), 3)])
        if back and hair == "spiky":
            items.append(path(t, D.SPIKY_HAIR, color, True))
        items += headwear(t, a)
        if ethnic(a) and hair in ("long", "bob", "bun", "wrap", "turban"):
            items.extend([spath("M42 166 Q200 99 358 166", D.GOLD, 5)])
            for x in range(55, 350, 24):
                items.append(circ(t, x, 135 + (x - 200) ** 2 / 820, 4, D.SILVER, False))
        if a["key"] == "festival_woman" and view != "back":
            for x, y in ((312, 59), (290, 76), (302, 99), (327, 98), (338, 76)):
                items.append(ell(t, x, y, 13, 17, "#cf6b83", True, sw=4))
            items.append(circ(t, 315, 80, 10, D.GOLD, True, sw=4))
        views[view] = svg(items)
    return views


def woven(t, y, width=245):
    left = 200 - width / 2
    items = [rect(t, left, y, width, 40, "#8c384d", True), line(t, left, y + 5, left + width, y + 5, D.GOLD, 4), line(t, left, y + 35, left + width, y + 35, D.GOLD, 4)]
    for x in range(int(left + 18), int(left + width - 8), 30):
        items.append(poly(t, [(x, y + 11), (x + 10, y + 20), (x, y + 29), (x - 10, y + 20)], D.GOLD, False))
    return items


def bodies(t, a):
    views = {}
    for view in ("front", "side", "back"):
        items = []
        if a["hair"] in ("long", "wet"):
            items.append(path(t, "M34 0 L366 0 L357 253 Q346 310 306 318 L90 318 Q46 301 41 253Z", a["hairc"], True))
        dress = a["dress"]
        if dress != "robe":
            items.append(path(t, D.SKIRT if dress == "dress" else D.TROUSERS, D.DARK, True))
        items.append(path(t, D.ROBE if dress == "robe" else D.BLOUSE, a["body"], True))
        if view != "back":
            items.append(path(t, "M151 11 Q200 64 249 11 L224 52 L200 88 L176 52Z", a["face"], True))
            if dress == "robe":
                items.append(spath("M148 18 L221 113 L221 555", shade(a["body"], 0.45), 5))
            elif ethnic(a) and a["gender"] == "female":
                for y in (112, 158, 204):
                    items.append(path(t, "M184 %s L216 %s L184 %sZ M216 %s L184 %s L216 %sZ" % (y, y + 12, y + 24, y, y + 12, y + 24), D.SILVER, True, sw=4))
                for y in (35, 48, 61):
                    items.append(spath("M145 %s Q200 %s 255 %s" % (y, y + 43, y), D.SILVER, 4))
            else:
                items.append(line(t, 200, 88, 200, 302, shade(a["body"], 0.4), 4))
                for y in (117, 165, 213, 261):
                    items.append(circ(t, 210, y, 5, D.SILVER, True, sw=3))
        if ethnic(a):
            items += woven(t, 513)
        if a.get("sash") or ethnic(a):
            sash = a.get("sash", D.GOLD)
            items.append(rect(t, 79, 295, 242, 21, sash, True))
            if view != "back":
                items.append(path(t, "M231 302 Q192 270 182 295 Q182 317 231 302 Q274 271 277 297 Q270 319 231 302 L242 534 L226 549 L219 316Z", sash, True, sw=4))
        if view == "back" and a["hair"] in ("long", "wet"):
            items.append(path(t, "M95 0 L305 0 L294 227 Q200 285 106 227Z", a["hairc"], True))
        if view == "side":
            items = ['<g transform="translate(56 0) scale(.72 1)">' + "".join(items) + "</g>"]
        views[view] = svg(items, "0 0 400 600")
    return views


def sprites(t, a, body):
    result = {}
    for pose, legs in (("sit", D.SIT_LEGS), ("kneel", D.KNEEL_LEGS), ("crouch", D.CROUCH_LEGS)):
        items = [path(t, legs, a["body"] if a["dress"] == "robe" else D.DARK, True)]
        blouse = body["front"].split(">", 1)[1].rsplit("</svg>", 1)[0]
        items.append('<svg x="110" y="%s" width="280" height="98" viewBox="0 0 400 330" preserveAspectRatio="none">%s</svg>' % (310 if pose == "crouch" else 290, blouse))
        if ethnic(a):
            items.append('<g transform="translate(50 0)">' + "".join(woven(t, 434, 140)) + "</g>")
        result[pose] = dict(svg=svg(items, "0 0 500 500"), w=1, h=0.78 if pose == "crouch" else 0.84, anchor=[0.5, 0.97], bodyOnly=True, rig=dict(headW=D.BODY["head"] * D.BODY["headW"], headH=D.BODY["head"], headCy=-0.51 if pose == "crouch" else -0.57, bodyH=0.28 if pose == "crouch" else 0.34, bodyW=0.54))
    return result
