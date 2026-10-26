from library_release import assert_legacy_library_target
import argparse
import json
from pathlib import Path
from core import T, rect, poly, line, svg
from interior import room
from parts import sky, mountains, ground
from fixed_compositions import chair
from seed_texts import SeedText as KST
from placement_texts import PlacementText as PT
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, validate_asset_geometry, resource_semantics


def contact(key, kind, x, y, label, fixture, relation=None, bounds=None, **extra):
    return dict(key=key, kind=kind, x=x, y=y, label=label, fixture=fixture, **({"relation": relation} if relation else {}), **({"bounds": bounds} if bounds else {}), **extra)


def bedroom(t):
    back, floor = room(t, 720)
    bed = [rect(t, 450, 650, 34, 350, t.c(KST.WOOD), True), rect(t, 1416, 650, 34, 350, t.c(KST.WOOD), True), rect(t, 435, 500, 30, 166, t.c(KST.WOOD2), True), rect(t, 450, 620, 1000, 46, t.c(KST.WOOD2), True), rect(t, 458, 600, 984, 22, t.c(KST.WOVEN), True), rect(t, 790, 550, 160, 50, t.c(KST.CLOTH), True, rx=12)]
    floor += [PT.XML_GROUP % (PT.BED, KST.EMPTY.join(bed))] + chair(t, 1710, 990)
    spots = [
        contact(PT.TOP, KST.LIE, 950, 600, PT.BED_CONTACT, PT.BED, bounds=[610, 580, 720, 50], face=KST.RIGHT, groundY=1000),
        contact(PT.SEAT, KST.SIT, 1210, 1000, PT.BED_EDGE, PT.BED, bounds=[1020, 600, 300, 70], seatY=622, groundY=1000),
        contact(PT.BELOW_LIE, KST.LIE, 950, 1000, PT.UNDER_LIE, PT.BED, PT.UNDER, [520, 980, 870, 35], face=KST.RIGHT, groundY=1000),
        contact(PT.BELOW_CROUCH, KST.STAND, 950, 1000, PT.UNDER_CROUCH, PT.BED, PT.UNDER, [520, 980, 870, 35], groundY=1000),
        contact(PT.BESIDE, KST.STAND, 270, 1000, PT.BESIDE_LABEL, PT.BED, PT.BESIDE_RELATION, [100, 980, 290, 40], groundY=1000),
        contact(PT.CHAIR, KST.SIT, 1710, 990, PT.CHAIR_LABEL, PT.CHAIR, bounds=[1620, 870, 180, 35], seatY=875, groundY=990),
    ]
    return [], back, floor, spots


def ruined_house(t):
    back = mountains(t, 750)
    house = [poly(t, [(300, 400), (920, 400), (990, 600), (800, 530), (650, 780), (300, 780)], t.c(KST.WOOD2), True), poly(t, [(180, 430), (620, 150), (1030, 400), (850, 330), (760, 420), (600, 350), (400, 435)], t.c(KST.ROOF), True), rect(t, 390, 520, 150, 260, t.c(KST.DOOR), True)]
    for x in (1070, 1220, 1370):
        house += [poly(t, [(x, 610), (x + 140, 730), (x + 100, 770), (x - 40, 650)], t.c(KST.WOOD), True)]
    for x in range(600, 850, 70):
        house.append(line(t, x, 470, x, 690, t.c(KST.WOOD), 5))
    back += [PT.XML_GROUP % (PT.RUIN, KST.EMPTY.join(house))]
    return sky(t, 750), back, ground(t, 750, KST.EARTH, 3), [contact(PT.FRONT, KST.STAND, 960, 980, PT.FRONT_LABEL, PT.FRONT, bounds=[280, 960, 1360, 40], groundY=980)]


def assets():
    for style, sid in SEED_STYLES.items():
        for key, name, desc, inside, condition, painter in [(PT.UNDER_ROOM, PT.UNDER_NAME, PT.UNDER_DESC, True, PT.INTACT, bedroom), (PT.RUIN, PT.RUIN_NAME, PT.RUIN_DESC, False, PT.RUINED, ruined_house)]:
            for flip in (False, True):
                ids = {night: seed_id(KST.SET_ID_PREFIX, PT.SEED % (style, key, int(flip), int(night))) for night in (False, True)}
                for night in (False, True):
                    theme = T(style, night)
                    sky_layer, back, floor, spots = painter(theme)
                    if flip:
                        back = [PT.MIRROR % KST.EMPTY.join(back)]
                        floor = [PT.MIRROR % KST.EMPTY.join(floor)]
                        for spot in spots:
                            spot[KST.X] = 1920 - spot[KST.X]
                            if KST.FACE in spot:
                                spot[KST.FACE] = KST.LEFT
                            if "bounds" in spot:
                                x, y, w, h = spot["bounds"]
                                spot["bounds"] = [1920 - x - w, y, w, h]
                    record = dict(id=ids[night], type=KST.SET, styleId=sid, group=PT.GROUP % key, name=name + (KST.NIGHT_VARIANT_SUFFIX if night else KST.EMPTY), desc=desc, tags=[key, KST.SEED, PT.PACK, condition], interior=inside, time=KST.NIGHT if night else KST.DAY, floorY=1020, horizonY=720 if inside else 750, svg=svg(theme, sky_layer, back, [], floor, []), spots=spots, lights=[], uses=0, placementVersion=2, sceneCondition=condition, updatedAt=seed_timestamp())
                    if not night:
                        record[KST.VARIANTS] = {KST.NIGHT: ids[True]}
                    resource_semantics(record)
                    validate_asset_geometry(record, record[KST.ID])
                    yield record


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(KST.LIBRARY, default=PT.ROOT)
    parser.add_argument(KST.REPORT, default=PT.REPORT)
    parser.add_argument(KST.APPLY, action=KST.STORE_TRUE)
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    report = Path(args.report)
    report.mkdir(parents=True, exist_ok=True)
    rows = []
    for record in assets():
        file = Path(args.library) / KST.SET / (record[KST.ID] + KST.JSON_EXTENSION)
        if file.exists():
            old = json.loads(file.read_text(encoding=KST.UTF_8))
            if PT.PACK not in old[KST.TAGS]:
                raise ValueError(str(file))
            record[KST.USES] = old.get(KST.USES, 0)
        if args.apply:
            if file.exists():
                backup = report / PT.BACKUP / file.name
                if not backup.exists():
                    backup.parent.mkdir(parents=True, exist_ok=True)
                    backup.write_bytes(file.read_bytes())
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(json.dumps(record, ensure_ascii=False), encoding=KST.UTF_8, newline=KST.NEWLINE)
        rows.append({KST.ID: record[KST.ID], KST.STYLEID: record[KST.STYLEID], KST.PATH: str(file.resolve()), KST.KEY: record[KST.TAGS][0]})
    (report / PT.MANIFEST).write_text(json.dumps({"applied": args.apply, "records": rows}, indent=2), encoding=KST.UTF_8, newline=KST.NEWLINE)
    print(json.dumps({"applied": args.apply, "assets": len(rows)}))


if __name__ == KST.MAIN:
    main()
