if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import argparse
import json
import os
from pathlib import Path
from build_closed_pack import CATALOG, records
from seed_utils import validate_asset_geometry
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.APPLY, action=_CODE_TEXT.STORE_TRUE)
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(_CODE_TEXT.SCRATCH_CLOSED_CONTACTS_20261024))
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(CATALOG[_CODE_TEXT.LIBRARY])
    changed = []
    for generated in records():
        if generated[_CODE_TEXT.TYPE] not in (_CODE_TEXT.SET, _CODE_TEXT.SET_PIECE):
            continue
        file = Path(CATALOG[_CODE_TEXT.LIBRARY]) / generated[_CODE_TEXT.TYPE] / (generated[_CODE_TEXT.ID] + _CODE_TEXT.JSON)
        if not file.exists():
            continue
        before = file.read_bytes()
        asset = json.loads(before)
        if CATALOG[_CODE_TEXT.PACK] not in asset.get(_CODE_TEXT.TAGS, []):
            continue
        asset[_CODE_TEXT.SPOTS] = generated[_CODE_TEXT.SPOTS]
        asset[_CODE_TEXT.COMPOSITIONS] = generated[_CODE_TEXT.COMPOSITIONS] + [item for item in asset.get(_CODE_TEXT.COMPOSITIONS, []) if item[_CODE_TEXT.KEY] not in {row[_CODE_TEXT.KEY] for row in generated[_CODE_TEXT.COMPOSITIONS]}]
        validate_asset_geometry(asset, str(file))
        if asset == json.loads(before):
            continue
        backup = args.output / _CODE_TEXT.BEFORE / asset[_CODE_TEXT.TYPE] / file.name
        target = args.output / _CODE_TEXT.STAGED / asset[_CODE_TEXT.TYPE] / file.name
        for folder in (backup.parent, target.parent):
            folder.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            backup.write_bytes(before)
        target.write_text(json.dumps(asset, ensure_ascii=False, separators=(_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL)), encoding=_CODE_TEXT.UTF_8)
        changed.append(dict(id=asset[_CODE_TEXT.ID], path=str(file.resolve()), backup=str(backup.resolve())))
        if args.apply:
            temporary = file.with_suffix(_CODE_TEXT.CONTACTS_TMP)
            temporary.write_bytes(target.read_bytes())
            os.replace(temporary, file)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / _CODE_TEXT.MANIFEST_JSON).write_text(json.dumps(dict(applied=args.apply, changed=changed), ensure_ascii=False, indent=2), encoding=_CODE_TEXT.UTF_8)
    print(json.dumps(dict(applied=args.apply, changed=len(changed))))
if __name__ == _CODE_TEXT.MAIN:
    main()
