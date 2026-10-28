if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
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
    for kind in (_CODE_TEXT.CHARACTER_KIT, _CODE_TEXT.STYLE_PACK):
        for file in sorted((library / kind).glob(_CODE_TEXT.JSON_7C7C35)):
            before = file.read_bytes()
            asset = json.loads(before)
            if asset.get(_CODE_TEXT.STYLEID, asset[_CODE_TEXT.ID]) != D.STYLE_ID:
                continue
            if kind == _CODE_TEXT.CHARACTER_KIT:
                if asset.get(_CODE_TEXT.ARCHETYPE) not in ARCH:
                    raise ValueError((file, _CODE_TEXT.UNKNOWN_CHARACTER_ARCHETYPE))
                asset.update(build_char(asset[_CODE_TEXT.ARCHETYPE], D.STYLE))
                if asset[_CODE_TEXT.ARCHETYPE] in D.DESCRIPTIONS:
                    asset[_CODE_TEXT.DESC] = D.DESCRIPTIONS[asset[_CODE_TEXT.ARCHETYPE]]
                normalize_art(asset)
                validate_asset_geometry(asset, str(file))
            else:
                asset.update(body=D.BODY, face=D.FACE, description=D.DESCRIPTION)
            asset[_CODE_TEXT.CHIBIDESIGNVERSION] = D.VERSION
            asset[_CODE_TEXT.UPDATEDAT] = seed_timestamp()
            target = output / _CODE_TEXT.STAGED / kind / file.name
            backup = output / _CODE_TEXT.BEFORE / kind / file.name
            target.parent.mkdir(parents=True, exist_ok=True)
            backup.parent.mkdir(parents=True, exist_ok=True)
            if backup.exists() and backup.read_bytes() != before:
                raise ValueError((file, _CODE_TEXT.EXISTING_BACKUP_DIFFERS))
            backup.write_bytes(before)
            after = encoded(asset)
            target.write_bytes(after)
            rows.append(dict(id=asset[_CODE_TEXT.ID], type=kind, source=str(file.resolve()), backup=str(backup.resolve()), staged=str(target.resolve()), beforeHash=digest(before), afterHash=digest(after), changed=before != after))
    manifest = dict(version=D.VERSION, records=rows, changed=sum(row[_CODE_TEXT.CHANGED] for row in rows), installed=False)
    (output / _CODE_TEXT.MANIFEST_JSON).write_bytes(encoded(manifest))
    print(json.dumps(dict(records=len(rows), changed=manifest[_CODE_TEXT.CHANGED])))
if __name__ == _CODE_TEXT.MAIN:
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(D.ROOT))
    parser.add_argument(_CODE_TEXT.LIBRARY_79F64B, type=Path, default=Path(_CODE_TEXT.STORAGE_OUTPUT_MOTION_VIDEO_KIT_LIBRARY))
    parser.add_argument(_CODE_TEXT.INSTALL, action=_CODE_TEXT.STORE_TRUE)
    parser.add_argument(_CODE_TEXT.ROLLBACK, action=_CODE_TEXT.STORE_TRUE)
    args = parser.parse_args()
    if args.install or args.rollback:
        install(args.output, args.rollback)
    else:
        stage(args.library, args.output)
