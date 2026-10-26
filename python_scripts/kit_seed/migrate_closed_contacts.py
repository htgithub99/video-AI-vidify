from library_release import assert_legacy_library_target
import argparse
import json
import os
from pathlib import Path
from build_closed_pack import CATALOG, records
from seed_utils import validate_asset_geometry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--output", type=Path, default=Path("scratch/closed-contacts-20261024"))
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(CATALOG["library"])
    changed = []
    for generated in records():
        if generated["type"] not in ("set", "set_piece"):
            continue
        file = Path(CATALOG["library"]) / generated["type"] / (generated["id"] + ".json")
        if not file.exists():
            continue
        before = file.read_bytes()
        asset = json.loads(before)
        if CATALOG["pack"] not in asset.get("tags", []):
            continue
        asset["spots"] = generated["spots"]
        asset["compositions"] = generated["compositions"] + [item for item in asset.get("compositions", []) if item["key"] not in {row["key"] for row in generated["compositions"]}]
        validate_asset_geometry(asset, str(file))
        if asset == json.loads(before):
            continue
        backup = args.output / "before" / asset["type"] / file.name
        target = args.output / "staged" / asset["type"] / file.name
        for folder in (backup.parent, target.parent):
            folder.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            backup.write_bytes(before)
        target.write_text(json.dumps(asset, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        changed.append(dict(id=asset["id"], path=str(file.resolve()), backup=str(backup.resolve())))
        if args.apply:
            temporary = file.with_suffix(".contacts.tmp")
            temporary.write_bytes(target.read_bytes())
            os.replace(temporary, file)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "manifest.json").write_text(json.dumps(dict(applied=args.apply, changed=changed), ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(dict(applied=args.apply, changed=len(changed))))


if __name__ == "__main__":
    main()
