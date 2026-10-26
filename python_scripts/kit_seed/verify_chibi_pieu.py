import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from migrate_illustration_library import digest
from seed_utils import validate_asset_geometry
import chibi_design as D

parser = argparse.ArgumentParser()
parser.add_argument("--baseline", action="store_true")
parser.add_argument("--installed", action="store_true")
args = parser.parse_args()
root = Path(D.ROOT)
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
baseline_file = root / "inventory-before.json"
library = Path("storage/output/motion-video/kit-library")
inventory = {str(file): digest(file.read_bytes()) for file in library.glob("*/*.json")}
if args.baseline:
    assert not manifest["installed"]
    baseline_file.write_text(json.dumps(inventory), encoding="utf-8")
rows = manifest["records"]
assert len({row["id"] for row in rows}) == len(rows)
characters = 0
for row in rows:
    asset = json.loads(Path(row["staged"]).read_text(encoding="utf-8"))
    assert asset.get("styleId", asset["id"]) == D.STYLE_ID
    assert asset["chibiDesignVersion"] == D.VERSION
    if row["type"] == "style_pack":
        assert asset["body"] == D.BODY and asset["face"] == D.FACE
        continue
    characters += 1
    original = json.loads(Path(row["backup"]).read_text(encoding="utf-8"))
    for field in ("id", "styleId", "archetype", "gender", "age", "height", "name", "originalName"):
        assert asset.get(field) == original.get(field), (row["id"], field)
    validate_asset_geometry(asset, row["id"])
    assert set(asset["head"]) == {"front", "side", "back"}
    assert set(asset["body"]) == {"front", "side", "back"}
    for pose in ("sit", "kneel", "crouch"):
        sprite = asset["sprites"][pose]
        assert sprite["bodyOnly"] is True
        assert not any("translate" in node.attrib.get("transform", "") and "scale" in node.attrib.get("transform", "") for node in ET.fromstring(sprite["svg"])), (row["id"], pose)
        assert sprite["rig"]["headH"] == D.BODY["head"]
        assert sprite["rig"]["headW"] == D.BODY["head"] * D.BODY["headW"]
assert characters == 59
if args.installed:
    assert manifest["installed"]
    changed = {str(Path(row["source"]).relative_to(Path.cwd())): row["afterHash"] for row in rows}
    baseline = json.loads(baseline_file.read_text(encoding="utf-8"))
    assert inventory.keys() == baseline.keys()
    for file, value in inventory.items():
        assert value == changed.get(file, baseline[file]), file
    renders = json.loads((root / "render-review.json").read_text(encoding="utf-8"))
    assert len(renders) == 146 and all(not row["issues"] and Path(row["file"]).is_file() for row in renders)
    result = dict(characters=characters, records=len(rows), images=len(renders), unchangedRecords=len(inventory) - len(rows), installed=True)
    (root / "verification.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result))
else:
    print(json.dumps(dict(characters=characters, records=len(rows), staged=True)))
