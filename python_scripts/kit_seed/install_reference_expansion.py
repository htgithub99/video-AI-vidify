from seed_texts import SeedText as KST
from seed_utils import validate_asset_geometry
import argparse
import datetime
import hashlib
import json
from pathlib import Path
from reference_expansion import PROP_CATALOG, SCENE_CATALOG, CHAR_CATALOG
PIECES = {KST.BABY_CRADLE, KST.OPEN_CHEST, KST.ATTIC_LADDER, KST.ROWBOAT, KST.FEEDING_TROUGH, KST.PRIVACY_BUSH}
def merge_spots(existing, record):
    generated = {s[KST.KEY]: s for s in record.get(KST.SPOTS, [])}
    out = []
    for spot in existing.get(KST.SPOTS, []):
        fresh = generated.get(spot[KST.KEY], {})
        meta = {k: fresh[k] for k in (KST.SEATY, KST.GROUNDY, KST.FACE) if k in fresh} if all((spot.get(k) == fresh.get(k) for k in (KST.X, KST.Y, KST.KIND))) else {}
        out.append(dict(spot, **meta))
    return out
def collect(stage):
    selected = []
    for kind in (KST.SET, KST.PROP, KST.CHARACTER_KIT, KST.SET_PIECE):
        for file in sorted((stage / kind).glob(KST.JSON_GLOB)):
            record = json.loads(file.read_text(encoding=KST.UTF_8))
            key = record.get(KST.KEY) or record.get(KST.ARCHETYPE) or record.get(KST.GROUP, KST.EMPTY).removeprefix(KST.SEED_GROUP_PREFIX)
            wanted = {KST.SET: SCENE_CATALOG, KST.PROP: PROP_CATALOG, KST.CHARACTER_KIT: CHAR_CATALOG, KST.SET_PIECE: PIECES}[kind]
            if key not in wanted:
                continue
            if file.stem != record[KST.ID] or record[KST.TYPE] != kind:
                raise ValueError(str(file))
            validate_asset_geometry(record, file)
            selected.append((kind, file, record))
    expected = 2 * (len(SCENE_CATALOG) * 8 + len(PROP_CATALOG) + len(CHAR_CATALOG) + len(PIECES))
    if len(selected) != expected:
        raise ValueError((len(selected), expected))
    return selected
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(KST.STAGE, type=Path)
    parser.add_argument(KST.LIBRARY, type=Path)
    parser.add_argument(KST.REPORT, type=Path)
    parser.add_argument(KST.APPLY, action=KST.STORE_TRUE)
    args = parser.parse_args()
    assets = collect(args.stage)
    planned = list(assets)
    for file in sorted((args.stage / KST.SET_PIECE).glob(KST.JSON_GLOB)):
        record = json.loads(file.read_text(encoding=KST.UTF_8))
        target = args.library / KST.SET_PIECE / file.name
        if record[KST.KEY] in PIECES or not target.exists():
            continue
        existing = json.loads(target.read_text(encoding=KST.UTF_8))
        if existing.get(KST.SOURCE) != KST.SEED or existing.get(KST.KEY) != record[KST.KEY]:
            continue
        spots = merge_spots(existing, record)
        updated = dict(existing, environment=record[KST.ENVIRONMENT], spots=spots)
        if existing != updated:
            planned.append((KST.SET_PIECE, file, updated))
    for file in sorted((args.stage / KST.SET).glob(KST.JSON_GLOB)):
        record = json.loads(file.read_text(encoding=KST.UTF_8))
        target = args.library / KST.SET / file.name
        if record.get(KST.GROUP, KST.EMPTY).removeprefix(KST.SEED_GROUP_PREFIX) in SCENE_CATALOG or not target.exists():
            continue
        existing = json.loads(target.read_text(encoding=KST.UTF_8))
        if KST.SEED not in existing.get(KST.TAGS, []) or existing.get(KST.SVG) != record.get(KST.SVG):
            continue
        updated = dict(existing, spots=merge_spots(existing, record))
        if existing != updated:
            planned.append((KST.SET, file, updated))
    for file in sorted((args.stage / KST.CHARACTER_KIT).glob(KST.JSON_GLOB)):
        record = json.loads(file.read_text(encoding=KST.UTF_8))
        target = args.library / KST.CHARACTER_KIT / file.name
        if record.get(KST.ARCHETYPE) in CHAR_CATALOG or not target.exists() or (not record.get(KST.SPRITES, {}).get(KST.SIT)):
            continue
        existing = json.loads(target.read_text(encoding=KST.UTF_8))
        if KST.SEED not in existing.get(KST.TAGS, []) or existing.get(KST.HEAD) != record.get(KST.HEAD) or existing.get(KST.BODY) != record.get(KST.BODY):
            continue
        sprites = dict(existing.get(KST.SPRITES, {}), sit=record[KST.SPRITES][KST.SIT], kneel=record[KST.SPRITES][KST.KNEEL])
        for key, sprite in record[KST.SPRITES].items():
            if sprite.get(KST.RIG) and sprites.get(key, {}).get(KST.SVG) == sprite[KST.SVG]:
                sprites[key] = dict(sprites[key], rig=sprite[KST.RIG])
        updated = dict(existing, sprites=sprites)
        if updated != existing:
            planned.append((KST.CHARACTER_KIT, file, updated))
    args.report.mkdir(parents=True, exist_ok=True)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime(KST.Y_M_DT_H_M_SZ)
    backup = args.report / (KST.BACKUP + stamp)
    records = []
    for kind, source, record in planned:
        target = args.library / kind / source.name
        data = json.dumps(record, ensure_ascii=False).encode(KST.UTF_8)
        previous = target.read_bytes() if target.exists() else None
        records.append(dict(type=kind, id=record[KST.ID], name=record[KST.NAME], path=str(target.resolve()), change=KST.UPDATE if previous else KST.ADD, sha256=hashlib.sha256(data).hexdigest()))
        if not args.apply:
            continue
        if previous is not None:
            saved = backup / kind / source.name
            saved.parent.mkdir(parents=True, exist_ok=True)
            saved.write_bytes(previous)
        target.parent.mkdir(parents=True, exist_ok=True)
        if previous:
            record[KST.USES] = json.loads(previous).get(KST.USES, 0)
            data = json.dumps(record, ensure_ascii=False).encode(KST.UTF_8)
            records[-1][KST.SHA256] = hashlib.sha256(data).hexdigest()
        target.write_bytes(data)
    manifest = dict(applied=args.apply, assets=len(assets), metadata_updates=len(planned) - len(assets), backup=str(backup.resolve()), records=records)
    (args.report / (KST.INSTALLED_JSON if args.apply else KST.PLANNED_JSON)).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding=KST.UTF_8, newline=KST.NEWLINE)
    print(json.dumps(dict(assets=manifest[KST.ASSETS], metadata_updates=manifest[KST.METADATA_UPDATES], applied=args.apply)))
if __name__ == KST.MAIN:
    main()
