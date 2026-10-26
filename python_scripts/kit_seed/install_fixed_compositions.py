from library_release import assert_legacy_library_target
from seed_texts import SeedText as KST
from seed_utils import SEED_STYLES, validate_asset_geometry, resource_semantics
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
from fixed_compositions import SCENES, PROPS, CHARACTERS
PIECES = {KST.WOODEN_CHAIR, KST.CONVERSATION_FURNITURE, KST.SLEEPING_MAT_PAIR, KST.OFFERING_TABLE}
STYLES = SEED_STYLES
PREFIXES = {KST.SET: KST.SET_ID_PREFIX, KST.PROP: KST.PRP, KST.CHARACTER_KIT: KST.CHR, KST.SET_PIECE: KST.PCS}
def collect(stage):
    rows = []
    expected = {}
    for style, sid in STYLES.items():
        for kind, keys, count in [(KST.SET, SCENES, 8), (KST.PROP, PROPS, 1), (KST.CHARACTER_KIT, CHARACTERS, 1), (KST.SET_PIECE, PIECES, 1)]:
            expected[sid, kind] = len(keys) * count
    for kind, keys in [(KST.SET, SCENES), (KST.PROP, PROPS), (KST.CHARACTER_KIT, CHARACTERS), (KST.SET_PIECE, PIECES)]:
        for file in sorted((stage / kind).glob(KST.JSON_GLOB)):
            data = json.loads(file.read_text(encoding=KST.UTF_8))
            key = data.get(KST.KEY) or data.get(KST.ARCHETYPE) or data.get(KST.GROUP, KST.EMPTY).removeprefix(KST.SEED_GROUP_PREFIX)
            if key not in keys:
                continue
            if file.stem != data[KST.ID] or data[KST.TYPE] != kind or data[KST.STYLEID] not in STYLES.values():
                raise ValueError(str(file))
            for field in (KST.NAME, KST.DESC):
                if not data[field].isascii():
                    raise ValueError((file, field))
            resource_semantics(data)
            validate_asset_geometry(data, file)
            spots = data.get(KST.SPOTS, [])
            if len({s[KST.KEY] for s in spots}) != len(spots):
                raise ValueError((file, KST.DUPLICATE_SPOTS))
            for spot in spots:
                if spot[KST.KIND] == KST.SIT and (not all((k in spot for k in (KST.SEATY, KST.GROUNDY)))):
                    raise ValueError((file, spot))
            data[KST.CATALOGVERSION] = 2
            data[KST.TAGS] = list(dict.fromkeys(data[KST.TAGS] + [KST.REFERENCE_22, KST.FIXED_COMPOSITION]))
            if kind == KST.PROP:
                data[KST.CATEGORY] = KST.PROP
            if kind == KST.SET:
                data[KST.HORIZONY] = 720 if data[KST.INTERIOR] else 750
            rows.append((kind, file.name, data))
    actual = {key: sum((r[0] == key[1] and r[2][KST.STYLEID] == key[0] for r in rows)) for key in expected}
    if actual != expected:
        raise ValueError((actual, expected))
    ids = {data[KST.ID] for _, _, data in rows}
    if any((data.get(KST.VARIANTS, {}).get(KST.NIGHT) not in ids for kind, _, data in rows if kind == KST.SET and data[KST.TIME] == KST.DAY)):
        raise ValueError(KST.MISSING_NIGHT_VARIANT)
    return rows
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(KST.STAGE, type=Path)
    parser.add_argument(KST.LIBRARY, type=Path)
    parser.add_argument(KST.REPORT, type=Path)
    parser.add_argument(KST.APPLY, action=KST.STORE_TRUE)
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    rows = collect(args.stage)
    args.report.mkdir(parents=True, exist_ok=True)
    backup = args.report / (KST.BACKUP + datetime.datetime.now(datetime.timezone.utc).strftime(KST.Y_M_DT_H_M_SZ))
    records = []
    for kind, name, data in rows:
        target = args.library / kind / name
        previous = target.read_bytes() if target.exists() else None
        if previous:
            old = json.loads(previous)
            if old.get(KST.STYLEID) != data[KST.STYLEID] or KST.SEED not in old.get(KST.TAGS, []):
                raise ValueError((KST.REFUSING_TO_REPLACE_CUSTOM_ASSET, target))
            data[KST.USES] = old.get(KST.USES, 0)
        payload = json.dumps(data, ensure_ascii=False).encode(KST.UTF_8)
        records.append(dict(type=kind, id=data[KST.ID], name=data[KST.NAME], path=str(target.resolve()), change=KST.UPDATE if previous else KST.ADD, sha256=hashlib.sha256(payload).hexdigest()))
        if not args.apply:
            continue
        if previous:
            saved = backup / kind / name
            saved.parent.mkdir(parents=True, exist_ok=True)
            saved.write_bytes(previous)
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(KST.JSON_TMP)
        temporary.write_bytes(payload)
        os.replace(temporary, target)
    if args.apply:
        for record in records:
            if hashlib.sha256(Path(record[KST.PATH]).read_bytes()).hexdigest() != record[KST.SHA256]:
                raise ValueError(record[KST.PATH])
    report = dict(applied=args.apply, assets=len(rows), counts={kind: sum((row[0] == kind for row in rows)) for kind in PREFIXES}, backup=str(backup.resolve()), records=records)
    (args.report / (KST.INSTALLED_JSON if args.apply else KST.PLANNED_JSON)).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding=KST.UTF_8, newline=KST.NEWLINE)
    print(json.dumps({k: v for k, v in report.items() if k != KST.RECORDS}))
if __name__ == KST.MAIN:
    main()
