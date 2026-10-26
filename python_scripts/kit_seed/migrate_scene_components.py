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
    temporary = file.with_suffix(file.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(temporary, file)


def migrate(library, output, apply):
    from scenes import SCENES
    records = []
    skipped = []
    styles = {value: key for key, value in SEED_STYLES.items()}
    for file in sorted((library / "set").glob("*.json")):
        asset = json.loads(file.read_text(encoding="utf-8"))
        if asset.get("styleId") not in styles or asset.get("recipe", {}).get("decompositionVersion", 0) >= 2:
            continue
        key = asset.get("group", "").removeprefix("seed:")
        if key not in SCENES:
            result = decompose_named_asset(asset, styles[asset["styleId"]])
            if result:
                records.append(dict(file=file, original=asset, **result))
            else:
                skipped.append(dict(id=asset["id"], reason="composed_recipe_retained" if asset.get("plan") else "named_source_not_verified" if asset.get("group", "").startswith(("folk_blocking_v1:", "closed_pack_v1:")) else "source_not_verified"))
            continue
        result = None
        matched = False
        for variant in range(4):
            candidate = decompose_scene_asset(asset, styles[asset["styleId"]], key, variant)
            if candidate:
                result = candidate
                break
            original, _, _, _, _ = capture_scene(key, styles[asset["styleId"]], asset["time"] == "night", variant)
            matched = matched or canonical_svg(original) == canonical_svg(asset["svg"])
        if result:
            records.append(dict(file=file, original=asset, **result))
        else:
            skipped.append(dict(id=asset["id"], reason="no_extractable_components" if matched else "source_geometry_changed"))
    unique = {piece["id"]: piece for row in records for piece in row["pieces"]}
    boxes = {}
    if unique:
        inners = []
        for piece in unique.values():
            inner = re.match(r"<svg\b[^>]*>([\s\S]*)</svg>", piece["svg"])[1]
            inners.append(["", inner])
        runner = Path(__file__).with_name("export_piece_boxes.cjs")
        result = subprocess.run([os.environ.get("KIT_NODE", "node"), str(runner)], input=json.dumps(inners), text=True, encoding="utf-8", capture_output=True, check=True)
        boxes = dict(zip(unique, json.loads(result.stdout)))
    final = {}
    changed = []
    for row in records:
        asset = row["original"]
        for instance, piece in zip(row["recipe"]["pieces"], row["pieces"]):
            x, y, width, height = boxes[piece["id"]]
            if width <= 0 or height <= 0:
                raise ValueError(piece["id"])
            box = [x - 8, y - 8, width + 16, height + 16]
            piece.update(box=box, anchor=[x + width / 2, y + height], native=dict(hz=row["base"]["horizonY"], fy=asset["floorY"]))
            piece["spots"] = [copy.deepcopy(spot) for spot in asset.get("spots", []) if spot.get("fixture") and x - 20 <= spot["x"] <= x + width + 20 and y - 20 <= spot["y"] <= y + height + 20]
            identity = seed_id("pcs-", piece["id"] + json.dumps([piece["spots"], piece["allowedEnvironments"]], sort_keys=True))
            piece.update(id=identity, key=piece["name"].replace(" ", "_") + "_" + identity[4:])
            instance["assetId"] = identity
            resource_semantics(piece)
            validate_asset_geometry(piece, identity)
            final[identity] = piece
        validate_asset_geometry(row["base"], row["base"]["id"])
        final[row["base"]["id"]] = row["base"]
        after = dict(asset, recipe=row["recipe"])
        final[asset["id"]] = after
        changed.append(dict(id=asset["id"], base=row["base"]["id"], pieces=[part["assetId"] for part in row["recipe"]["pieces"]]))
    retired = []
    for file in sorted((library / "set_piece").glob("*.json")):
        piece = json.loads(file.read_text(encoding="utf-8"))
        if "extracted_component" in piece.get("tags", []) and piece.get("decompositionVersion", 0) < 2 and piece["id"] not in final and not piece.get("recipeOnly"):
            final[piece["id"]] = dict(piece, recipeOnly=True)
            retired.append(piece["id"])
    report = dict(apply=apply, migrated=changed, skipped=skipped, assets=len(final), deleted=[], retainedRecipeOnlyPieces=retired, backgroundsRequireReview=[row["base"]["id"] for row in records])
    output.mkdir(parents=True, exist_ok=True)
    report_file = output / "report.json"
    if report_file.exists():
        previous = json.loads(report_file.read_text(encoding="utf-8"))
        if previous.get("apply") and previous.get("migrated"):
            history = output / "history"
            history.mkdir(parents=True, exist_ok=True)
            identity = __import__("hashlib").sha256(report_file.read_bytes()).hexdigest()[:16]
            archive = history / (identity + ".json")
            if not archive.exists():
                archive.write_bytes(report_file.read_bytes())
    for asset in final.values():
        target = library / asset["type"] / (asset["id"] + ".json")
        if target.exists() and apply:
            backup = output / "backup" / asset["type"] / target.name
            if not backup.exists():
                backup.parent.mkdir(parents=True, exist_ok=True)
                backup.write_bytes(target.read_bytes())
        if apply:
            write_atomic(target, asset)
        else:
            write_atomic(output / "staged" / asset["type"] / target.name, asset)
    write_atomic(output / "report.json", report)
    print(json.dumps(dict(apply=apply, scenes=len(changed), assets=len(final), skipped=len(skipped), report=str(output / "report.json"))))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--library", type=Path, default=Path("storage/output/motion-video/kit-library"))
    parser.add_argument("--output", type=Path, default=Path("scratch/motion-scene-components-20261026"))
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.apply:
        assert_legacy_library_target(args.library)
    migrate(args.library.resolve(), args.output.resolve(), args.apply)
