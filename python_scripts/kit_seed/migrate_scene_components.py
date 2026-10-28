if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import argparse
import copy
import json
import os
import re
import subprocess
from pathlib import Path
from scene_components import decompose_scene_asset, decompose_named_asset, capture_scene, canonical_svg
from seed_utils import SEED_STYLES, seed_id, resource_semantics, validate_asset_geometry
def write_atomic(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    temporary = file.with_suffix(file.suffix + _CODE_TEXT.TMP)
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL)), encoding=_CODE_TEXT.UTF_8)
    os.replace(temporary, file)
def migrate(library, output, apply):
    from scenes import SCENES
    records = []
    skipped = []
    styles = {value: key for key, value in SEED_STYLES.items()}
    for file in sorted((library / _CODE_TEXT.SET).glob(_CODE_TEXT.JSON_7C7C35)):
        asset = json.loads(file.read_text(encoding=_CODE_TEXT.UTF_8))
        if asset.get(_CODE_TEXT.STYLEID) not in styles or asset.get(_CODE_TEXT.RECIPE, {}).get(_CODE_TEXT.DECOMPOSITIONVERSION, 0) >= 2:
            continue
        key = asset.get(_CODE_TEXT.GROUP, "").removeprefix(_CODE_TEXT.SEED_15FA77)
        if key not in SCENES:
            result = decompose_named_asset(asset, styles[asset[_CODE_TEXT.STYLEID]])
            if result:
                records.append(dict(file=file, original=asset, **result))
            else:
                skipped.append(dict(id=asset[_CODE_TEXT.ID], reason=_CODE_TEXT.COMPOSED_RECIPE_RETAINED if asset.get(_CODE_TEXT.PLAN) else _CODE_TEXT.NAMED_SOURCE_NOT_VERIFIED if asset.get(_CODE_TEXT.GROUP, "").startswith((_CODE_TEXT.FOLK_BLOCKING_V1, _CODE_TEXT.CLOSED_PACK_V1)) else _CODE_TEXT.SOURCE_NOT_VERIFIED))
            continue
        result = None
        matched = False
        for variant in range(4):
            candidate = decompose_scene_asset(asset, styles[asset[_CODE_TEXT.STYLEID]], key, variant)
            if candidate:
                result = candidate
                break
            original, _, _, _, _ = capture_scene(key, styles[asset[_CODE_TEXT.STYLEID]], asset[_CODE_TEXT.TIME] == _CODE_TEXT.NIGHT, variant)
            matched = matched or canonical_svg(original) == canonical_svg(asset[_CODE_TEXT.SVG_ACDB13])
        if result:
            records.append(dict(file=file, original=asset, **result))
        else:
            skipped.append(dict(id=asset[_CODE_TEXT.ID], reason=_CODE_TEXT.NO_EXTRACTABLE_COMPONENTS if matched else _CODE_TEXT.SOURCE_GEOMETRY_CHANGED))
    unique = {piece[_CODE_TEXT.ID]: piece for row in records for piece in row[_CODE_TEXT.PIECES]}
    boxes = {}
    if unique:
        inners = []
        for piece in unique.values():
            inner = re.match(_CODE_TEXT.SVG_B_S_S_SVG, piece[_CODE_TEXT.SVG_ACDB13])[1]
            inners.append(["", inner])
        runner = Path(__file__).with_name(_CODE_TEXT.EXPORT_PIECE_BOXES_CJS)
        result = subprocess.run([os.environ.get(_CODE_TEXT.KIT_NODE, _CODE_TEXT.NODE), str(runner)], input=json.dumps(inners), text=True, encoding=_CODE_TEXT.UTF_8, capture_output=True, check=True)
        boxes = dict(zip(unique, json.loads(result.stdout)))
    final = {}
    changed = []
    for row in records:
        asset = row[_CODE_TEXT.ORIGINAL]
        for instance, piece in zip(row[_CODE_TEXT.RECIPE][_CODE_TEXT.PIECES], row[_CODE_TEXT.PIECES]):
            x, y, width, height = boxes[piece[_CODE_TEXT.ID]]
            if width <= 0 or height <= 0:
                raise ValueError(piece[_CODE_TEXT.ID])
            box = [x - 8, y - 8, width + 16, height + 16]
            piece.update(box=box, anchor=[x + width / 2, y + height], native=dict(hz=row[_CODE_TEXT.BASE][_CODE_TEXT.HORIZONY], fy=asset[_CODE_TEXT.FLOORY]))
            piece[_CODE_TEXT.SPOTS] = [copy.deepcopy(spot) for spot in asset.get(_CODE_TEXT.SPOTS, []) if spot.get(_CODE_TEXT.FIXTURE) and x - 20 <= spot[_CODE_TEXT.X] <= x + width + 20 and y - 20 <= spot[_CODE_TEXT.Y] <= y + height + 20]
            identity = seed_id(_CODE_TEXT.PCS, piece[_CODE_TEXT.ID] + json.dumps([piece[_CODE_TEXT.SPOTS], piece[_CODE_TEXT.ALLOWEDENVIRONMENTS]], sort_keys=True))
            piece.update(id=identity, key=piece[_CODE_TEXT.NAME].replace(_CODE_TEXT.SYMBOL_36A9E7, _CODE_TEXT.SYMBOL_D2E2AD) + _CODE_TEXT.SYMBOL_D2E2AD + identity[4:])
            instance[_CODE_TEXT.ASSETID] = identity
            resource_semantics(piece)
            validate_asset_geometry(piece, identity)
            final[identity] = piece
        validate_asset_geometry(row[_CODE_TEXT.BASE], row[_CODE_TEXT.BASE][_CODE_TEXT.ID])
        final[row[_CODE_TEXT.BASE][_CODE_TEXT.ID]] = row[_CODE_TEXT.BASE]
        after = dict(asset, recipe=row[_CODE_TEXT.RECIPE])
        final[asset[_CODE_TEXT.ID]] = after
        changed.append(dict(id=asset[_CODE_TEXT.ID], base=row[_CODE_TEXT.BASE][_CODE_TEXT.ID], pieces=[part[_CODE_TEXT.ASSETID] for part in row[_CODE_TEXT.RECIPE][_CODE_TEXT.PIECES]]))
    retired = []
    for file in sorted((library / _CODE_TEXT.SET_PIECE).glob(_CODE_TEXT.JSON_7C7C35)):
        piece = json.loads(file.read_text(encoding=_CODE_TEXT.UTF_8))
        if _CODE_TEXT.EXTRACTED_COMPONENT in piece.get(_CODE_TEXT.TAGS, []) and piece.get(_CODE_TEXT.DECOMPOSITIONVERSION, 0) < 2 and piece[_CODE_TEXT.ID] not in final and not piece.get(_CODE_TEXT.RECIPEONLY):
            final[piece[_CODE_TEXT.ID]] = dict(piece, recipeOnly=True)
            retired.append(piece[_CODE_TEXT.ID])
    report = dict(apply=apply, migrated=changed, skipped=skipped, assets=len(final), deleted=[], retainedRecipeOnlyPieces=retired, backgroundsRequireReview=[row[_CODE_TEXT.BASE][_CODE_TEXT.ID] for row in records])
    output.mkdir(parents=True, exist_ok=True)
    report_file = output / _CODE_TEXT.REPORT_JSON
    if report_file.exists():
        previous = json.loads(report_file.read_text(encoding=_CODE_TEXT.UTF_8))
        if previous.get(_CODE_TEXT.APPLY_97A5E4) and previous.get(_CODE_TEXT.MIGRATED):
            history = output / _CODE_TEXT.HISTORY
            history.mkdir(parents=True, exist_ok=True)
            identity = __import__(_CODE_TEXT.HASHLIB).sha256(report_file.read_bytes()).hexdigest()[:16]
            archive = history / (identity + _CODE_TEXT.JSON)
            if not archive.exists():
                archive.write_bytes(report_file.read_bytes())
    for asset in final.values():
        target = library / asset[_CODE_TEXT.TYPE] / (asset[_CODE_TEXT.ID] + _CODE_TEXT.JSON)
        if target.exists() and apply:
            backup = output / _CODE_TEXT.BACKUP / asset[_CODE_TEXT.TYPE] / target.name
            if not backup.exists():
                backup.parent.mkdir(parents=True, exist_ok=True)
                backup.write_bytes(target.read_bytes())
        if apply:
            write_atomic(target, asset)
        else:
            write_atomic(output / _CODE_TEXT.STAGED / asset[_CODE_TEXT.TYPE] / target.name, asset)
    write_atomic(output / _CODE_TEXT.REPORT_JSON, report)
    print(json.dumps(dict(apply=apply, scenes=len(changed), assets=len(final), skipped=len(skipped), report=str(output / _CODE_TEXT.REPORT_JSON))))
if __name__ == _CODE_TEXT.MAIN:
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.LIBRARY_79F64B, type=Path, default=Path(_CODE_TEXT.STORAGE_OUTPUT_MOTION_VIDEO_KIT_LIBRARY))
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(_CODE_TEXT.SCRATCH_MOTION_SCENE_COMPONENTS_20261026))
    parser.add_argument(_CODE_TEXT.APPLY, action=_CODE_TEXT.STORE_TRUE)
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    migrate(args.library.resolve(), args.output.resolve(), args.apply)
