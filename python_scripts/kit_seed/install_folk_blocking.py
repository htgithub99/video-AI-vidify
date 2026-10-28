if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
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
CATALOG = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding=_CODE_TEXT.UTF_8))
PREFIX = {_CODE_TEXT.SET: _CODE_TEXT.SET_597A4F, _CODE_TEXT.PROP: _CODE_TEXT.PRP, _CODE_TEXT.CHARACTER_KIT: _CODE_TEXT.CHR, _CODE_TEXT.SET_PIECE: _CODE_TEXT.PCS}
def asset_id(style, kind, key, mirror=False, night=False):
    return seed_id(PREFIX[kind], _CODE_TEXT.SYMBOL.join((CATALOG[_CODE_TEXT.NAMESPACE], style, kind, key, str(int(mirror)), str(int(night)))))
def base(style, kind, row):
    return dict(
        id=asset_id(style, kind, row[_CODE_TEXT.KEY]),
        type=kind,
        styleId=SEED_STYLES[style],
        name=row[_CODE_TEXT.NAME],
        desc=F.DESC % row[_CODE_TEXT.NAME],
        tags=list(dict.fromkeys([row[_CODE_TEXT.KEY], _CODE_TEXT.SEED, CATALOG[_CODE_TEXT.PACK], *row.get(_CODE_TEXT.TAGS, [])])),
        catalogVersion=2,
        uses=0,
        updatedAt=seed_timestamp(),
        provenance=dict(sourceVideos=row.get(_CODE_TEXT.SOURCES, []), originalArtwork=True, folkloreExtension=row.get(_CODE_TEXT.EXTENSION, False), reviewScope=_CODE_TEXT.OVERVIEW_AND_SELECTED_FRAMES),
    )
def pieces(style):
    plans = {
        _CODE_TEXT.SLEEPING_MAT_PAIR: (_CODE_TEXT.PATIENTS, _CODE_TEXT.SLEEPING_MAT, [160, 890, 1580, 120], [960, 980], lambda t: mat(t, 470, 920) + mat(t, 1430, 920)),
        _CODE_TEXT.WOODEN_CRADLE: (_CODE_TEXT.CRADLE, _CODE_TEXT.CRADLE, [650, 670, 630, 320], [960, 970], cradle),
        _CODE_TEXT.RAISED_DAYBED: (_CODE_TEXT.RAFTERS, _CODE_TEXT.DAYBED, [550, 630, 780, 370], [940, 980], daybed),
        _CODE_TEXT.BRICK_HEARTH: (_CODE_TEXT.KITCHEN, _CODE_TEXT.HEARTH, [480, 890, 340, 140], [650, 1000], lambda t: hearth(t, 650, 1000)),
        _CODE_TEXT.RITUAL_TABLE: (_CODE_TEXT.RITUAL, _CODE_TEXT.TABLE, [560, 790, 800, 210], [960, 980], ritual_table),
        _CODE_TEXT.RIVER_FERRY: (_CODE_TEXT.BOAT, _CODE_TEXT.BOAT, [310, 830, 1270, 210], [960, 1020], lambda t: ferry_shapes(t) + ferry_shapes(t, True)),
        _CODE_TEXT.LANDING_STAIRS: (_CODE_TEXT.STAIRS, _CODE_TEXT.LANDING, [350, 600, 1220, 450], [960, 980], stair_shapes),
        _CODE_TEXT.GROOMING_SEATS: (_CODE_TEXT.GROOMING, _CODE_TEXT.BENCH, [540, 610, 480, 410], [790, 1000], lambda t: bench(t, 560, 865, 330, 115) + chair(t, 920, 1000)),
    }
    for key in CATALOG[_CODE_TEXT.PIECES]:
        family, fixture, box, anchor, painter = plans[key]
        row = next(row for row in CATALOG[_CODE_TEXT.SCENES] if row[_CODE_TEXT.FAMILY] == family)
        layout = scene(row, style)
        contacts = layout[_CODE_TEXT.SPOTS]
        contacts = [spot for spot in contacts if spot[_CODE_TEXT.FIXTURE] not in (_CODE_TEXT.FRONT_LEFT, _CODE_TEXT.FRONT_CENTER, _CODE_TEXT.FRONT_RIGHT, _CODE_TEXT.FLOOR_OBJECT) and (family not in (_CODE_TEXT.KITCHEN, _CODE_TEXT.RITUAL) or fixture in spot[_CODE_TEXT.FIXTURE])]
        if family == _CODE_TEXT.PATIENTS:
            contacts = [spot for spot in contacts if _CODE_TEXT.SLEEPING_MAT in spot[_CODE_TEXT.FIXTURE]]
        compositions = [item for item in layout[_CODE_TEXT.COMPOSITIONS] if all(any(spot[_CODE_TEXT.KEY] == key for spot in contacts) for key in item[_CODE_TEXT.ROLES].values())]
        def image(night):
            theme = T(style, night)
            return svg(theme, [], [], [], [group(key, painter(theme))], [], vb=_CODE_TEXT.SYMBOL_36A9E7.join(map(str, box)))
        record = base(style, _CODE_TEXT.SET_PIECE, dict(key=_CODE_TEXT.FOLK + key, name=key.replace(_CODE_TEXT.SYMBOL_D2E2AD, _CODE_TEXT.SYMBOL_36A9E7).title(), sources=row.get(_CODE_TEXT.SOURCES, [])))
        record.update(
            key=_CODE_TEXT.FOLK + key,
            desc=F.PIECE_DESC % record[_CODE_TEXT.NAME],
            kind=_CODE_TEXT.FURNITURE,
            environment=_CODE_TEXT.INTERIOR if row[_CODE_TEXT.INTERIOR] else _CODE_TEXT.EXTERIOR,
            slots=[_CODE_TEXT.SCENE_CENTER] if compositions else [_CODE_TEXT.MID_CENTER, _CODE_TEXT.MID_LEFT, _CODE_TEXT.MID_RIGHT],
            svg=image(False),
            night=image(True),
            box=box,
            anchor=anchor,
            native=dict(hz=720, fy=1060),
            spots=contacts,
            compositions=compositions,
            front=family in (_CODE_TEXT.RITUAL, _CODE_TEXT.BOAT),
            lights=[],
            source=_CODE_TEXT.SEED,
        )
        yield record
def assets():
    for style in SEED_STYLES:
        for row in CATALOG[_CODE_TEXT.SCENES]:
            for mirror in (False, True):
                for night in (False, True):
                    record = base(style, _CODE_TEXT.SET, row)
                    record.update(
                        id=asset_id(style, _CODE_TEXT.SET, row[_CODE_TEXT.KEY], mirror, night),
                        group=CATALOG[_CODE_TEXT.PACK] + _CODE_TEXT.SYMBOL + row[_CODE_TEXT.KEY],
                        name=row[_CODE_TEXT.NAME] + (F.MIRRORED if mirror else "") + (F.NIGHT if night else ""),
                        desc=F.DESC % (row[_CODE_TEXT.NAME] + _CODE_TEXT.SYMBOL_8DCCF2 + F.FAMILIES[row[_CODE_TEXT.FAMILY]]),
                        interior=row[_CODE_TEXT.INTERIOR],
                        time=_CODE_TEXT.NIGHT if night else _CODE_TEXT.DAY,
                        placementVersion=3,
                        sceneCondition=_CODE_TEXT.INTACT,
                        variants={_CODE_TEXT.DAY if night else _CODE_TEXT.NIGHT: asset_id(style, _CODE_TEXT.SET, row[_CODE_TEXT.KEY], mirror, not night)},
                        **scene(row, style, night, mirror)
                    )
                    yield record
        for row in CATALOG[_CODE_TEXT.PROPS]:
            record = base(style, _CODE_TEXT.PROP, row)
            record.update(key=row[_CODE_TEXT.KEY], desc=F.PROP_DESC % row[_CODE_TEXT.NAME], svg=prop(row, style), base=[256, 480], height=row[_CODE_TEXT.SIZE], size=row[_CODE_TEXT.SIZE], mount=row[_CODE_TEXT.MOUNT], category=_CODE_TEXT.PROP)
            if row[_CODE_TEXT.SHAPE] == _CODE_TEXT.LAMP:
                record[_CODE_TEXT.EMITTER] = [256, 190]
            yield record
        for row in CATALOG[_CODE_TEXT.CHARACTERS]:
            arch = dict(ARCH[row[_CODE_TEXT.BASE]], name=row[_CODE_TEXT.NAME], body=row[_CODE_TEXT.BODY], sleeve=row[_CODE_TEXT.BODY], hair=row[_CODE_TEXT.HAIR], desc=F.CHARACTER_DESC % (row[_CODE_TEXT.NAME], row[_CODE_TEXT.BODY], row[_CODE_TEXT.HAIR]))
            if _CODE_TEXT.HEIGHT in row:
                arch[_CODE_TEXT.HEIGHT] = row[_CODE_TEXT.HEIGHT]
            if _CODE_TEXT.BAND in row:
                arch[_CODE_TEXT.BAND] = row[_CODE_TEXT.BAND]
            if row[_CODE_TEXT.KEY] == _CODE_TEXT.FOLK_INFANT:
                arch.update(dress=_CODE_TEXT.ROBE, group=_CODE_TEXT.VILLAGER, age=_CODE_TEXT.CHILD)
            ARCH[row[_CODE_TEXT.KEY]] = arch
            record = base(style, _CODE_TEXT.CHARACTER_KIT, row)
            record.update(archetype=row[_CODE_TEXT.KEY], group=arch[_CODE_TEXT.GROUP], gender=arch[_CODE_TEXT.GENDER], age=arch[_CODE_TEXT.AGE], role=arch[_CODE_TEXT.GROUP], desc=arch[_CODE_TEXT.DESC], story="", **build_char(row[_CODE_TEXT.KEY], style))
            yield record
        yield from pieces(style)
def validate(record):
    resource_semantics(record)
    validate_asset_geometry(record, record[_CODE_TEXT.ID])
    if not record[_CODE_TEXT.NAME].isascii() or not record[_CODE_TEXT.DESC].isascii():
        raise ValueError(record[_CODE_TEXT.ID])
    keys = set()
    for spot in record.get(_CODE_TEXT.SPOTS, []):
        x, y, w, h = spot[_CODE_TEXT.BOUNDS]
        sy = spot.get(_CODE_TEXT.SEATY, spot[_CODE_TEXT.Y])
        if spot[_CODE_TEXT.KEY] in keys or not re.fullmatch(F.KEY_RE, spot[_CODE_TEXT.KEY]) or not (x <= spot[_CODE_TEXT.X] <= x + w and y <= sy <= y + h) or (spot[_CODE_TEXT.KIND] == _CODE_TEXT.SIT and not spot[_CODE_TEXT.SEATY] < spot[_CODE_TEXT.GROUNDY]):
            raise ValueError(F.INVALID % record[_CODE_TEXT.ID])
        keys.add(spot[_CODE_TEXT.KEY])
    for group in record.get(_CODE_TEXT.COMPOSITIONS, []):
        values = list(group[_CODE_TEXT.ROLES].values())
        if len(values) != len(set(values)) or any(key not in keys for key in values):
            raise ValueError(F.INVALID % record[_CODE_TEXT.ID])
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.LIBRARY_79F64B, type=Path, default=Path(CATALOG[_CODE_TEXT.LIBRARY]))
    parser.add_argument(_CODE_TEXT.REPORT_8A65B1, type=Path, default=Path(CATALOG[_CODE_TEXT.REPORT]))
    parser.add_argument(_CODE_TEXT.APPLY, action=_CODE_TEXT.STORE_TRUE)
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    records = list(assets())
    assert len({record[_CODE_TEXT.ID] for record in records}) == len(records)
    ids = {record[_CODE_TEXT.ID] for record in records}
    for record in records:
        validate(record)
        assert all(value in ids for value in record.get(_CODE_TEXT.VARIANTS, {}).values())
    planned = []
    for record in records:
        file = args.library / record[_CODE_TEXT.TYPE] / (record[_CODE_TEXT.ID] + _CODE_TEXT.JSON)
        previous = file.read_bytes() if file.exists() else None
        if previous:
            old = json.loads(previous)
            if CATALOG[_CODE_TEXT.PACK] not in old.get(_CODE_TEXT.TAGS, []):
                raise ValueError(F.COLLISION % file)
            record[_CODE_TEXT.USES] = old.get(_CODE_TEXT.USES, 0)
        payload = json.dumps(record, ensure_ascii=False, separators=(_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL)).encode(_CODE_TEXT.UTF_8)
        planned.append((record, file, previous, payload))
    args.report.mkdir(parents=True, exist_ok=True)
    output = []
    for record, file, previous, payload in planned:
        if args.apply:
            if previous:
                backup = args.report / F.BACKUP / record[_CODE_TEXT.TYPE] / file.name
                if not backup.exists():
                    backup.parent.mkdir(parents=True, exist_ok=True)
                    backup.write_bytes(previous)
            file.parent.mkdir(parents=True, exist_ok=True)
            temporary = file.with_suffix(_CODE_TEXT.JSON_TMP)
            temporary.write_bytes(payload)
            os.replace(temporary, file)
        output.append(dict(type=record[_CODE_TEXT.TYPE], id=record[_CODE_TEXT.ID], key=record.get(_CODE_TEXT.KEY, record.get(_CODE_TEXT.ARCHETYPE, record[_CODE_TEXT.TAGS][0])), name=record[_CODE_TEXT.NAME], styleId=record[_CODE_TEXT.STYLEID], path=str(file.resolve()), sha256=hashlib.sha256(payload).hexdigest(), change=_CODE_TEXT.UPDATE if previous else _CODE_TEXT.ADD))
    report = dict(applied=args.apply, pack=CATALOG[_CODE_TEXT.PACK], counts=dict(Counter(record[_CODE_TEXT.TYPE] for record in records)), designs=dict(scenes=len(CATALOG[_CODE_TEXT.SCENES]), props=len(CATALOG[_CODE_TEXT.PROPS]), characters=len(CATALOG[_CODE_TEXT.CHARACTERS]), pieces=len(CATALOG[_CODE_TEXT.PIECES])), records=output)
    (args.report / (F.MANIFEST if args.apply else F.PLANNED)).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    print(json.dumps({key: value for key, value in report.items() if key != _CODE_TEXT.RECORDS}))
if __name__ == _CODE_TEXT.MAIN:
    main()
