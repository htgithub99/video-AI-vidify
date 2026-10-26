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

CATALOG = json.loads(Path(__file__).with_name(K.CATALOG).read_text(encoding="utf-8"))
OCC = K.OCC
MIRROR = K.MIRROR


def identifier(style, kind, key, mirror=False, night=False):
    return seed_id({"set": "set-", "prop": "prp-", "set_piece": "pcs-"}[kind], ":".join((CATALOG["pack"], style, kind, key, str(int(mirror)), str(int(night)))))


def metadata(style, kind, row):
    return dict(id=identifier(style, kind, row["key"]), type=kind, styleId=SEED_STYLES[style], name=row["name"], desc=K.DESC % row["name"], tags=[row["key"], "seed", CATALOG["pack"]], catalogVersion=2, uses=0, updatedAt=seed_timestamp())


def interaction(kind, roles, variant=None, contacts=None):
    result = composition(kind, **roles)
    if variant:
        result.update(variant=variant, key=result["key"] + "_" + variant)
    if contacts:
        result["contacts"] = [dict(actor=a, point=p, target=b, targetPoint=q, mode=m) for a, p, b, q, m in contacts]
    return result


def furniture(t, key):
    if key == "bed":
        return low_bed(t, 500, 960, 830), [500, 780, 830, 180], [860, 960], [contact("bed_lie", "lie", 860, 836, "bed", ground_y=960, face="right"), contact("bed_edge_sit", "sit", 600, 960, "bed", seat=836, ground_y=960), contact("bed_edge_right_sit", "sit", 1210, 960, "bed", seat=836, ground_y=960), contact("bedside_stand", "stand", 1440, 1050, "bed", ground_y=1050, relation="beside"), contact("bedside_partner_stand", "stand", 1760, 1050, "bed", ground_y=1050, relation="beside"), contact("bedside_left_stand", "stand", 420, 1050, "bed", ground_y=1050, relation="beside")]
    if key == "chair":
        return chair(t, 1650, 1000), [1530, 620, 240, 390], [1650, 1000], [contact("visitor_chair_sit", "sit", 1650, 1000, "chair", seat=885, ground_y=1000)]
    if key == "table":
        return table(t, 560, 980, 800, 170), [550, 800, 820, 190], [960, 980], [contact("table_top_left", "surface", 740, 810, "table"), contact("table_top_center", "surface", 960, 810, "table"), contact("table_top_right", "surface", 1180, 810, "table"), contact("table_left_stand", "stand", 350, 1060, "table", ground_y=1060, relation="beside"), contact("table_right_stand", "stand", 1570, 1060, "table", ground_y=1060, relation="beside")]
    if key == "hearth":
        return hearth(t, 520, 1000), [350, 910, 340, 100], [520, 1000], [contact("hearth_top", "surface", 520, 920, "hearth"), contact("cook_stand", "stand", 850, 1000, "hearth", ground_y=1000, relation="beside")]
    if key == "door":
        return [rect(t, 1460, 260, 280, 650, t.c("dark")), rect(t, 1460, 260, 35, 650, t.c("door")), rect(t, 1440, 240, 320, 25, t.c("wood")), rect(t, 1440, 910, 320, 25, t.c("wood"))], [1430, 230, 340, 710], [1600, 935], [contact("door_inside", "stand", 1260, 1000, "door", ground_y=1000, relation="inside"), contact("door_outside", "door", 1600, 910, "door", ground_y=1000, relation="outside")]
    return [rect(t, 1230, 200, 470, 470, t.c("dark")), rect(t, 1220, 190, 490, 18, t.c("wood")), rect(t, 1220, 660, 490, 18, t.c("wood"))], [1210, 180, 510, 510], [1470, 670], [contact("window_inside", "stand", 860, 1000, "window", ground_y=1000, relation="inside"), contact("window_outside", "stand", 1470, 800, "window", ground_y=1000, relation="outside")]


def scene(row, style, night=False, mirror=False):
    t = T(style, night, seed=44)
    inside, family = row["interior"], row["family"]
    sk = [] if inside else sky(t, 720)
    back, floor = room(t, 720) if inside else (mountains(t, 720), ground(t, 720, "earth", 3))
    pieces, spots, groups, occluders, fixtures = [], [], [], [], []

    def add_piece(key, layer=None):
        shapes, _, _, contacts = furniture(t, key)
        (layer if layer is not None else pieces).append(group(key, shapes))
        spots.extend(contacts)

    def comp(kind, **roles):
        groups.append(interaction(kind, roles))

    if family in ("conversation", "dining"):
        pieces += [group("chair_left", chair(t, 470, 1000)), group("chair_right", chair(t, 1450, 1000))]
        spots += [contact("chair_left_sit", "sit", 470, 1000, "chair_left", seat=885, ground_y=1000), contact("chair_right_sit", "sit", 1450, 1000, "chair_right", seat=885, ground_y=1000)]
        if family == "dining":
            add_piece("table", occluders)
            comp("dining", diner_left="chair_left_sit", diner_right="chair_right_sit")
            comp("offering", giver="chair_left_sit", receiver="chair_right_sit")
        else:
            for left, right in itertools.product(("left_stand", "chair_left_sit"), ("right_stand", "chair_right_sit")):
                comp("conversation", host=left, guest=right)
            comp("group_conversation", host="chair_left_sit", guest="chair_right_sit", companion="center_stand")
    elif family == "bedside":
        add_piece("bed")
        add_piece("chair")
        for patient, caregiver in itertools.product(("bed_lie", "bed_edge_sit"), ("bedside_stand", "visitor_chair_sit", "bed_edge_right_sit")):
            comp("bedside", patient=patient, caregiver=caregiver)
        comp("conversation", host="bed_edge_sit", guest="visitor_chair_sit")
    elif family in ("parent_child", "carrying", "assisting", "contact"):
        spots += [contact("participant_a", "stand", 800, 1000, "ground", ground_y=1000), contact("participant_b", "stand", 1020, 1000, "ground", ground_y=1000)]
        if family == "parent_child":
            groups.append(interaction(family, dict(adult="participant_a", child="participant_b"), contacts=[("adult", "hand", "child", "hand", "reach")]))
        elif family == "carrying":
            for variant, point in (("hold_child", "hand"), ("piggyback", "back")):
                groups.append(interaction(family, dict(carrier="participant_a", carried="participant_b"), variant, [("carried", "body", "carrier", point, "attach")]))
        elif family == "assisting":
            groups.append(interaction(family, dict(helper="participant_a", dependent="participant_b"), contacts=[("helper", "hand", "dependent", "shoulder", "reach")]))
        else:
            pieces += [group("recipient_chair", chair(t, 1020, 1000))]
            spots += [contact("recipient_seat", "sit", 1020, 1000, "chair", seat=885, ground_y=1000)]
            for variant, p, q, mode in (("hold_hands", "hand", "hand", "reach"), ("touch_shoulder", "hand", "shoulder", "reach"), ("bite_shoulder", "mouth", "shoulder", "attach"), ("whisper", "mouth", "ear", "attach")):
                groups.append(interaction(family, dict(initiator="participant_a", recipient="participant_b"), variant, [("initiator", p, "recipient", q, mode)]))
                groups.append(interaction(family, dict(initiator="participant_a", recipient="recipient_seat"), variant, [("initiator", p, "recipient", q, mode)]))
    elif family == "window":
        add_piece("window", back)
        occluders += [rect(t, 1200, 0, 720, 190, t.c("wall")), rect(t, 1200, 680, 720, 400, t.c("wall")), rect(t, 1200, 190, 25, 490, t.c("wall")), rect(t, 1710, 190, 210, 490, t.c("wall"))]
        comp("window", inside="window_inside", outside="window_outside")
        comp("watching", watcher="window_inside", subject="window_outside")
    elif family == "ditch":
        floor += [group("ditch_water", [poly(t, [(900, 760), (1920, 790), (1920, 1080), (1050, 1080)], t.c("water")), line(t, 1100, 850, 1870, 865, t.c("water2"), 4), line(t, 1200, 960, 1850, 980, t.c("water2"), 4)])]
        spots += [contact("ditch_water_surface", "surface", 1430, 900, "ditch_water"), contact("dry_bank_stand", "stand", 650, 1000, "ditch", ground_y=1000, relation="beside")]
    elif family == "kitchen":
        add_piece("hearth")
        shapes, _, _, contacts = furniture(t, "table")
        pieces += [group("preparation_table", shapes)]
        spots += contacts
        comp("work", worker="cook_stand", observer="right_stand")
    elif family == "work":
        back += round_tree(t, 180, 760, 0.9)
        comp("work", worker="left_stand", observer="right_stand")
    elif family == "chase":
        back += round_tree(t, 180, 760, 1.1) + round_tree(t, 1700, 760, 1.1)
        comp("chase", pursuer="left_stand", fugitive="right_stand")
        comp("search", leader="left_stand", companion="right_stand")
    if inside:
        opened = group("fixed_door", [rect(t, 1745, 300, 150, 420, t.c("dark")), rect(t, 1745, 300, 25, 420, t.c("door"))])
        closed = group("fixed_door", [rect(t, 1745, 300, 150, 420, t.c("door")), circ(t, 1770, 525, 8, t.c("gold"))])
        off = group("fixed_lamp", [line(t, 220, 390, 220, 445, t.c("wood"), 8), ell(t, 220, 450, 35, 14, t.c("gold")), path(t, "M202 445 L210 395 L230 395 L238 445Z", t.c("stone2"))])
        on = group("fixed_lamp", [ell(t, 220, 408, 70, 90, t.c("glow"), False), line(t, 220, 390, 220, 445, t.c("wood"), 8), ell(t, 220, 450, 35, 14, t.c("gold")), path(t, "M202 445 L210 395 L230 395 L238 445Z", t.c("cloth")), path(t, "M214 415 Q207 400 220 387 Q232 404 225 415Z", t.c("fire"))])
        back += [opened, on if night else off]
        fixtures += [dict(key="door", layer=opened, states=dict(open=opened, closed=closed)), dict(key="lamp", layer=on if night else off, states=dict(on=on, off=off, lit=on, unlit=off))]
        spots += [contact("fixed_door_stand", "door", 1810, 750, "door", ground_y=1000), contact("door_companion_stand", "stand", 1510, 980, "door", ground_y=980, relation="beside"), contact("fixed_lamp_hang", "hang", 220, 390, "lamp")]
    spots += [contact("left_stand", "stand", 650, 1050, "ground", ground_y=1050), contact("right_stand", "stand", 1270, 1050, "ground", ground_y=1050), contact("center_stand", "stand", 960, 1040, "ground", ground_y=1040), contact("floor_object", "open", 1530, 1030, "ground")]
    if mirror:
        sk, back, floor, pieces, occluders = ([MIRROR % "".join(layer)] if layer else [] for layer in (sk, back, floor, pieces, occluders))
        for spot in spots:
            spot["x"] = 1920 - spot["x"]
            spot["bounds"][0] = 1920 - spot["bounds"][0] - spot["bounds"][2]
            for key in ("key", "fixture", "label"):
                spot[key] = swap_sides(spot[key])
            if "face" in spot:
                spot["face"] = swap_sides(spot["face"])
        for item in groups:
            item["roles"] = {swap_sides(role): swap_sides(key) for role, key in item["roles"].items()}
            item["key"] = swap_sides(item["key"])
            for value in item.get("contacts", []):
                value["actor"], value["target"] = swap_sides(value["actor"]), swap_sides(value["target"])
    return dict(svg=svg(t, sk, back, [], floor + pieces, [], occ=OCC % (1000, "".join(occluders)) if occluders else ""), spots=spots, compositions=groups, floorY=1060, horizonY=720, lights=[], fixtures=fixtures)


def prop_image(row, style):
    t = T(style)
    shape, c = row["shape"], t.c
    if shape == "broom":
        shapes = [line(t, 256, 40, 256, 350, c("wood"), 24), poly(t, [(220, 335), (292, 335), (410, 470), (100, 470)], c("woven"))] + [line(t, 256, 340, x, 465, c("woven2"), 3) for x in range(110, 411, 30)]
    elif shape in ("porridge", "water_bowl"):
        shapes = [path(t, "M70 280 Q90 465 256 480 Q420 465 442 280Z", c("earth")), ell(t, 256, 280, 186, 55, c("stone2")), ell(t, 256, 278, 161, 37, c("cloth") if shape == "porridge" else c("water"))]
        if shape == "porridge":
            shapes += [ell(t, x, y, 9, 3, c("paper"), False) for x, y in ((160, 265), (220, 290), (280, 270), (330, 285), (355, 260))]
    elif shape in ("sash", "wet_sash"):
        shapes = [path(t, "M166 92 Q256 135 346 92 L315 180 L365 460 L280 460 L252 205 L223 460 L140 460 L194 180Z", c("cloth")), path(t, "M194 180 Q256 215 315 180", "none")]
        if shape == "wet_sash":
            shapes += [path(t, "M175 300 L210 290 L200 405 L166 420Z", c("stone2"), False)]
    elif shape == "rice":
        shapes = [ell(t, x, y, 14, 4, c("cloth"), False) for x, y in ((85, 440), (120, 410), (165, 457), (205, 427), (245, 460), (280, 420), (320, 448), (360, 413), (410, 455), (445, 430))]
    elif shape in ("chopsticks", "oar", "latch"):
        shapes = [line(t, 235, 70, 245, 470, c("bamboo") if shape == "chopsticks" else c("wood"), 12 if shape == "chopsticks" else 24)]
        if shape == "chopsticks":
            shapes += [line(t, 278, 70, 267, 470, c("bamboo"), 12)]
        elif shape == "oar":
            shapes += [path(t, "M242 330 L180 370 L195 480 L310 480 L325 370 L270 330Z", c("wood2"))]
        else:
            shapes += [rect(t, 70, 310, 370, 65, c("wood2"))]
    elif shape == "comb":
        shapes = [rect(t, 75, 120, 360, 100, c("bamboo"), rx=20)] + [rect(t, x, 200, 15, 220, c("bamboo")) for x in range(85, 430, 35)]
    elif shape in ("blanket", "packet"):
        shapes = [rect(t, 70, 170, 370, 295, c("cloth") if shape == "blanket" else c("paper"), rx=15), line(t, 80, 390, 430, 390, c("wood2"), 5)]
    elif shape == "sack":
        shapes = [path(t, "M180 100 L332 100 Q300 180 390 350 Q440 475 256 480 Q70 475 120 350 Q210 180 180 100Z", c("woven")), line(t, 180, 140, 332, 140, c("wood"), 12)]
    elif shape == "tray":
        shapes = [ell(t, 256, 380, 215, 85, c("wood")), ell(t, 256, 370, 185, 60, c("wood2"))]
    elif shape == "puddle":
        shapes = [ell(t, 256, 460, 230, 20, c("water"), False), ell(t, 200, 450, 100, 16, c("water2"), False)]
    elif shape == "footprints":
        shapes = [ell(t, 180, 330, 28, 65, c("dirt"), False), ell(t, 310, 425, 28, 65, c("dirt"), False)] + [circ(t, 160 + i * 12, 255 + i * 3, 7, c("dirt"), False) for i in range(4)]
    else:
        shapes = [path(t, "M80 260 Q100 480 256 480 Q410 480 432 260Z", c("woven")), path(t, "M110 260 Q110 100 256 100 Q400 100 400 260", "none")]
    return psvg(t, shapes)


def records():
    for style in SEED_STYLES:
        for row in CATALOG["scenes"]:
            for mirror, night in itertools.product((False, True), repeat=2):
                item = metadata(style, "set", row)
                item.update(
                    id=identifier(style, "set", row["key"], mirror, night),
                    group=CATALOG["pack"] + ":" + row["key"],
                    name=row["name"] + (K.MIRRORED if mirror else "") + (K.NIGHT if night else ""),
                    interior=row["interior"],
                    time="night" if night else "day",
                    placementVersion=4,
                    sceneCondition="intact",
                    variants={"day" if night else "night": identifier(style, "set", row["key"], mirror, not night)},
                    **scene(row, style, night, mirror)
                )
                yield item
        for row in CATALOG["props"]:
            item = metadata(style, "prop", row)
            item.update(key=row["key"], svg=prop_image(row, style), base=[256, 480], height=row["size"], size=row["size"], mount=row["mount"], category="prop", **{key: row[key] for key in ("grip", "attachment") if key in row})
            yield item
        for key in ("bed", "chair", "table", "hearth", "door", "window"):
            row = dict(key=K.COMPONENT_KEY + key, name=K.COMPONENT_NAME % key.title())
            item = metadata(style, "set_piece", row)
            shapes, box, anchor, spots = furniture(T(style), key)
            night_shapes, _, _, _ = furniture(T(style, True), key)
            groups = []
            if key == "door":
                groups = [composition("doorway", inside="door_inside", outside="door_outside")]
            elif key == "window":
                groups = [composition("window", inside="window_inside", outside="window_outside")]
            item.update(
                key=row["key"],
                kind="fixture" if key in ("door", "window") else "furniture",
                environment="interior",
                svg=svg(T(style), [], [], [], [group(key, shapes)], [], vb=" ".join(map(str, box))),
                night=svg(T(style, True), [], [], [], [group(key, night_shapes)], [], vb=" ".join(map(str, box))),
                box=box,
                anchor=anchor,
                native=dict(hz=720, fy=1060),
                slots=["scene_center"] if groups or key == "bed" else ["mid_left", "mid_center", "mid_right"],
                spots=spots,
                compositions=groups,
                lights=[],
                front=False,
                source="seed",
            )
            yield item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path(CATALOG["staging"]))
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    rows = list(records())
    ids = {item["id"] for item in rows}
    assert len(rows) == len(ids)
    output = Path(CATALOG["library"]) if args.apply else args.output
    assert_legacy_library_target(output)
    report = Path(CATALOG["report"])
    report.mkdir(parents=True, exist_ok=True)
    manifest = []
    for item in rows:
        resource_semantics(item)
        validate_asset_geometry(item, item["id"])
        points = {spot["key"] for spot in item.get("spots", [])}
        assert len(points) == len(item.get("spots", []))
        for comp in item.get("compositions", []):
            assert set(comp["roles"].values()) <= points
            assert len(set(comp["roles"].values())) == len(comp["roles"])
        assert all(variant in ids for variant in item.get("variants", {}).values())
        file = output / item["type"] / (item["id"] + ".json")
        file.parent.mkdir(parents=True, exist_ok=True)
        if file.exists():
            old = json.loads(file.read_text(encoding="utf-8"))
            assert CATALOG["pack"] in old.get("tags", [])
            if args.apply:
                backup = report / K.BACKUP / item["type"] / file.name
                backup.parent.mkdir(parents=True, exist_ok=True)
                if not backup.exists():
                    backup.write_bytes(file.read_bytes())
            item["uses"] = old.get("uses", 0)
        payload = json.dumps(item, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        temporary = file.with_suffix(".json.tmp")
        temporary.write_bytes(payload)
        os.replace(temporary, file)
        manifest.append(dict(id=item["id"], type=item["type"], styleId=item["styleId"], key=item.get("key", item["tags"][0]), path=str(file.resolve()), sha256=hashlib.sha256(payload).hexdigest()))
    data = dict(pack=CATALOG["pack"], applied=args.apply, counts=dict(Counter(item["type"] for item in rows)), records=manifest)
    (report / (K.INSTALLED if args.apply else K.STAGED)).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps(dict(counts=data["counts"], output=str(output), applied=args.apply)))


if __name__ == "__main__":
    main()
