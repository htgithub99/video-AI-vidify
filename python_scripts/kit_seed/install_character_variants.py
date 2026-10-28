if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import argparse
import json
from pathlib import Path
from chars import ARCH, build_char
from migrate_illustration_library import normalize_art, encoded
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, validate_asset_geometry, resource_semantics
def stage(output):
    records = []
    variants = json.loads(Path(__file__).with_name(_CODE_TEXT.CHARACTER_VARIANTS_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
    for style, style_id in SEED_STYLES.items():
        for key in variants:
            profile = ARCH[key]
            asset = dict(
                id=seed_id(_CODE_TEXT.CHR, _CODE_TEXT.SEEDV1_S_CHAR_S % (style, key)),
                type=_CODE_TEXT.CHARACTER_KIT,
                styleId=style_id,
                archetype=key,
                group=profile[_CODE_TEXT.GROUP],
                gender=profile[_CODE_TEXT.GENDER],
                age=profile[_CODE_TEXT.AGE],
                name=profile[_CODE_TEXT.NAME],
                role=profile[_CODE_TEXT.GROUP],
                desc=profile[_CODE_TEXT.DESC],
                tags=[_CODE_TEXT.SEED, _CODE_TEXT.ARCHETYPE, key, profile[_CODE_TEXT.GROUP], profile[_CODE_TEXT.GENDER], profile[_CODE_TEXT.AGE]],
                uses=0,
                updatedAt=seed_timestamp(),
                catalogVersion=2,
                **build_char(key, style)
            )
            normalize_art(asset)
            resource_semantics(asset)
            validate_asset_geometry(asset, key)
            target = output / _CODE_TEXT.CHARACTER_KIT / (asset[_CODE_TEXT.ID] + _CODE_TEXT.JSON)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(encoded(asset))
            records.append(dict(id=asset[_CODE_TEXT.ID], style=style, path=str(target.resolve())))
    (output / _CODE_TEXT.MANIFEST_JSON).write_bytes(encoded(records))
    return records
if __name__ == _CODE_TEXT.MAIN:
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, required=True)
    parser.add_argument(_CODE_TEXT.LIBRARY_79F64B, type=Path)
    args = parser.parse_args()
    if args.library:
        assert_legacy_library_target(args.library)
    records = stage(args.output)
    if args.library:
        for row in records:
            source = Path(row[_CODE_TEXT.PATH])
            target = args.library / _CODE_TEXT.CHARACTER_KIT / source.name
            if target.exists():
                before, after = json.loads(target.read_bytes()), json.loads(source.read_bytes())
                before.pop(_CODE_TEXT.UPDATEDAT, None)
                after.pop(_CODE_TEXT.UPDATEDAT, None)
                if before != after:
                    raise ValueError(str(target))
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
    print(json.dumps(records))
