import argparse
import json
from pathlib import Path
import chibi_design as D
from chars import ARCH, build_char
from migrate_illustration_library import digest, encoded, install, normalize_art, register_characters
from seed_utils import validate_asset_geometry, seed_timestamp


def stage(library, output):
    register_characters()
    rows = []
    for kind in ("character_kit", "style_pack"):
        for file in sorted((library / kind).glob("*.json")):
            before = file.read_bytes()
            asset = json.loads(before)
            if asset.get("styleId", asset["id"]) != D.STYLE_ID:
                continue
            if kind == "character_kit":
                if asset.get("archetype") not in ARCH:
                    raise ValueError((file, "Unknown character archetype"))
                asset.update(build_char(asset["archetype"], D.STYLE))
                if asset["archetype"] in D.DESCRIPTIONS:
                    asset["desc"] = D.DESCRIPTIONS[asset["archetype"]]
                normalize_art(asset)
                validate_asset_geometry(asset, str(file))
            else:
                asset.update(body=D.BODY, face=D.FACE, description=D.DESCRIPTION)
            asset["chibiDesignVersion"] = D.VERSION
            asset["updatedAt"] = seed_timestamp()
            target = output / "staged" / kind / file.name
            backup = output / "before" / kind / file.name
            target.parent.mkdir(parents=True, exist_ok=True)
            backup.parent.mkdir(parents=True, exist_ok=True)
            if backup.exists() and backup.read_bytes() != before:
                raise ValueError((file, "Existing backup differs"))
            backup.write_bytes(before)
            after = encoded(asset)
            target.write_bytes(after)
            rows.append(dict(id=asset["id"], type=kind, source=str(file.resolve()), backup=str(backup.resolve()), staged=str(target.resolve()), beforeHash=digest(before), afterHash=digest(after), changed=before != after))
    manifest = dict(version=D.VERSION, records=rows, changed=sum(row["changed"] for row in rows), installed=False)
    (output / "manifest.json").write_bytes(encoded(manifest))
    print(json.dumps(dict(records=len(rows), changed=manifest["changed"])))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path(D.ROOT))
    parser.add_argument("--library", type=Path, default=Path("storage/output/motion-video/kit-library"))
    parser.add_argument("--install", action="store_true")
    parser.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    if args.install or args.rollback:
        install(args.output, args.rollback)
    else:
        stage(args.library, args.output)
