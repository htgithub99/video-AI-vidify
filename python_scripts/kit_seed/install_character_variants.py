from library_release import assert_legacy_library_target
import argparse
import json
from pathlib import Path
from chars import ARCH, build_char
from migrate_illustration_library import normalize_art, encoded
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, validate_asset_geometry, resource_semantics


def stage(output):
    records = []
    variants = json.loads(Path(__file__).with_name("character_variants.json").read_text(encoding="utf-8"))
    for style, style_id in SEED_STYLES.items():
        for key in variants:
            profile = ARCH[key]
            asset = dict(id=seed_id("chr-", "seedv1:%s:char:%s" % (style, key)), type="character_kit", styleId=style_id, archetype=key, group=profile["group"], gender=profile["gender"], age=profile["age"], name=profile["name"], role=profile["group"], desc=profile["desc"], tags=["seed", "archetype", key, profile["group"], profile["gender"], profile["age"]], uses=0, updatedAt=seed_timestamp(), catalogVersion=2, **build_char(key, style))
            normalize_art(asset)
            resource_semantics(asset)
            validate_asset_geometry(asset, key)
            target = output / "character_kit" / (asset["id"] + ".json")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(encoded(asset))
            records.append(dict(id=asset["id"], style=style, path=str(target.resolve())))
    (output / "manifest.json").write_bytes(encoded(records))
    return records


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--library", type=Path)
    args = parser.parse_args()
    if args.library:
        assert_legacy_library_target(args.library)
    records = stage(args.output)
    if args.library:
        for row in records:
            source = Path(row["path"])
            target = args.library / "character_kit" / source.name
            if target.exists():
                before, after = json.loads(target.read_bytes()), json.loads(source.read_bytes())
                before.pop("updatedAt", None)
                after.pop("updatedAt", None)
                if before != after:
                    raise ValueError(str(target))
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
    print(json.dumps(records))
