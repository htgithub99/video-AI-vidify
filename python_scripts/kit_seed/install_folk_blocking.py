from library_release import assert_legacy_library_target
import argparse
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path
from chars import ARCH, build_char
from core import T, svg
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, validate_asset_geometry, resource_semantics
from folk_blocking_geometry import scene, prop, group, mat, cradle, daybed, ritual_table, ferry_shapes, stair_shapes, hearth
from fixed_compositions import chair
from interior import bench
from folk_blocking_texts import FolkText as F

CATALOG = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding="utf-8"))
PREFIX = {"set":"set-", "prop":"prp-", "character_kit":"chr-", "set_piece":"pcs-"}


def asset_id(style, kind, key, mirror=False, night=False):
    return seed_id(PREFIX[kind], ":".join((CATALOG["namespace"], style, kind, key, str(int(mirror)), str(int(night)))))


def base(style, kind, row):
    return dict(id=asset_id(style, kind, row["key"]), type=kind, styleId=SEED_STYLES[style], name=row["name"], desc=F.DESC % row["name"], tags=list(dict.fromkeys([row["key"], "seed", CATALOG["pack"], *row.get("tags", [])])), catalogVersion=2, uses=0, updatedAt=seed_timestamp(), provenance=dict(sourceVideos=row.get("sources", []), originalArtwork=True, folkloreExtension=row.get("extension", False), reviewScope="overview_and_selected_frames"))


def pieces(style):
    plans = {
        "sleeping_mat_pair": ("patients", "sleeping_mat", [160,890,1580,120], [960,980], lambda t:mat(t,470,920)+mat(t,1430,920)),
        "wooden_cradle": ("cradle", "cradle", [650,670,630,320], [960,970], cradle),
        "raised_daybed": ("rafters", "daybed", [550,630,780,370], [940,980], daybed),
        "brick_hearth": ("kitchen", "hearth", [480,890,340,140], [650,1000], lambda t:hearth(t,650,1000)),
        "ritual_table": ("ritual", "table", [560,790,800,210], [960,980], ritual_table),
        "river_ferry": ("boat", "boat", [310,830,1270,210], [960,1020], lambda t:ferry_shapes(t)+ferry_shapes(t,True)),
        "landing_stairs": ("stairs", "landing", [350,600,1220,450], [960,980], stair_shapes),
        "grooming_seats": ("grooming", "bench", [540,610,480,410], [790,1000], lambda t:bench(t,560,865,330,115)+chair(t,920,1000))
    }
    for key in CATALOG["pieces"]:
        family, fixture, box, anchor, painter = plans[key]
        row = next(row for row in CATALOG["scenes"] if row["family"] == family)
        layout = scene(row,style)
        contacts = layout["spots"]
        contacts = [spot for spot in contacts if spot["fixture"] not in ("front_left","front_center","front_right","floor_object") and (family not in ("kitchen","ritual") or fixture in spot["fixture"])]
        if family == "patients":
            contacts = [spot for spot in contacts if "sleeping_mat" in spot["fixture"]]
        compositions = [item for item in layout["compositions"] if all(any(spot["key"] == key for spot in contacts) for key in item["roles"].values())]
        def image(night):
            theme = T(style,night)
            return svg(theme,[],[],[],[group(key,painter(theme))],[],vb=" ".join(map(str,box)))
        record = base(style,"set_piece",dict(key="folk_"+key,name=key.replace("_"," ").title(),sources=row.get("sources",[])))
        record.update(key="folk_"+key,desc=F.PIECE_DESC % record["name"],kind="furniture",environment="interior" if row["interior"] else "exterior",slots=["scene_center"] if compositions else ["mid_center","mid_left","mid_right"],svg=image(False),night=image(True),box=box,anchor=anchor,native=dict(hz=720,fy=1060),spots=contacts,compositions=compositions,front=family in ("ritual","boat"),lights=[],source="seed")
        yield record


def assets():
    for style in SEED_STYLES:
        for row in CATALOG["scenes"]:
            for mirror in (False,True):
                for night in (False,True):
                    record = base(style,"set",row)
                    record.update(id=asset_id(style,"set",row["key"],mirror,night),group=CATALOG["pack"]+":"+row["key"],name=row["name"]+(F.MIRRORED if mirror else "")+(F.NIGHT if night else ""),desc=F.DESC % (row["name"]+". "+F.FAMILIES[row["family"]]),interior=row["interior"],time="night" if night else "day",placementVersion=3,sceneCondition="intact",variants={"day" if night else "night":asset_id(style,"set",row["key"],mirror,not night)},**scene(row,style,night,mirror))
                    yield record
        for row in CATALOG["props"]:
            record = base(style,"prop",row)
            record.update(key=row["key"],desc=F.PROP_DESC % row["name"],svg=prop(row,style),base=[256,480],height=row["size"],size=row["size"],mount=row["mount"],category="prop")
            if row["shape"] == "lamp":
                record["emitter"] = [256,190]
            yield record
        for row in CATALOG["characters"]:
            arch = dict(ARCH[row["base"]],name=row["name"],body=row["body"],sleeve=row["body"],hair=row["hair"],desc=F.CHARACTER_DESC % (row["name"],row["body"],row["hair"]))
            if "height" in row:
                arch["height"] = row["height"]
            if "band" in row:
                arch["band"] = row["band"]
            if row["key"] == "folk_infant":
                arch.update(dress="robe",group="villager",age="child")
            ARCH[row["key"]] = arch
            record = base(style,"character_kit",row)
            record.update(archetype=row["key"],group=arch["group"],gender=arch["gender"],age=arch["age"],role=arch["group"],desc=arch["desc"],story="",**build_char(row["key"],style))
            yield record
        yield from pieces(style)


def validate(record):
    resource_semantics(record)
    validate_asset_geometry(record,record["id"])
    if not record["name"].isascii() or not record["desc"].isascii():
        raise ValueError(record["id"])
    keys = set()
    for spot in record.get("spots",[]):
        x,y,w,h = spot["bounds"]
        sy = spot.get("seatY",spot["y"])
        if spot["key"] in keys or not re.fullmatch(F.KEY_RE,spot["key"]) or not (x<=spot["x"]<=x+w and y<=sy<=y+h) or (spot["kind"] == "sit" and not spot["seatY"] < spot["groundY"]):
            raise ValueError(F.INVALID % record["id"])
        keys.add(spot["key"])
    for group in record.get("compositions",[]):
        values = list(group["roles"].values())
        if len(values)!=len(set(values)) or any(key not in keys for key in values):
            raise ValueError(F.INVALID % record["id"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--library",type=Path,default=Path(CATALOG["library"]))
    parser.add_argument("--report",type=Path,default=Path(CATALOG["report"]))
    parser.add_argument("--apply",action="store_true")
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    records = list(assets())
    assert len({record["id"] for record in records}) == len(records)
    ids = {record["id"] for record in records}
    for record in records:
        validate(record)
        assert all(value in ids for value in record.get("variants",{}).values())
    planned = []
    for record in records:
        file = args.library / record["type"] / (record["id"]+".json")
        previous = file.read_bytes() if file.exists() else None
        if previous:
            old = json.loads(previous)
            if CATALOG["pack"] not in old.get("tags",[]):
                raise ValueError(F.COLLISION % file)
            record["uses"] = old.get("uses",0)
        payload = json.dumps(record,ensure_ascii=False,separators=(",",":")).encode("utf-8")
        planned.append((record,file,previous,payload))
    args.report.mkdir(parents=True,exist_ok=True)
    output = []
    for record,file,previous,payload in planned:
        if args.apply:
            if previous:
                backup = args.report / F.BACKUP / record["type"] / file.name
                if not backup.exists():
                    backup.parent.mkdir(parents=True,exist_ok=True)
                    backup.write_bytes(previous)
            file.parent.mkdir(parents=True,exist_ok=True)
            temporary = file.with_suffix(".json.tmp")
            temporary.write_bytes(payload)
            os.replace(temporary,file)
        output.append(dict(type=record["type"],id=record["id"],key=record.get("key",record.get("archetype",record["tags"][0])),name=record["name"],styleId=record["styleId"],path=str(file.resolve()),sha256=hashlib.sha256(payload).hexdigest(),change="update" if previous else "add"))
    report = dict(applied=args.apply,pack=CATALOG["pack"],counts=dict(Counter(record["type"] for record in records)),designs=dict(scenes=len(CATALOG["scenes"]),props=len(CATALOG["props"]),characters=len(CATALOG["characters"]),pieces=len(CATALOG["pieces"])),records=output)
    (args.report / (F.MANIFEST if args.apply else F.PLANNED)).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8",newline="\n")
    print(json.dumps({key:value for key,value in report.items() if key!="records"}))


if __name__ == "__main__":
    main()
