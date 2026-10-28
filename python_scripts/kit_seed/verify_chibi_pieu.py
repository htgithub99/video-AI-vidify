if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from migrate_illustration_library import digest
from seed_utils import validate_asset_geometry
import chibi_design as D
parser = argparse.ArgumentParser()
parser.add_argument(_CODE_TEXT.BASELINE, action=_CODE_TEXT.STORE_TRUE)
parser.add_argument(_CODE_TEXT.INSTALLED_9DF685, action=_CODE_TEXT.STORE_TRUE)
args = parser.parse_args()
root = Path(D.ROOT)
manifest = json.loads((root / _CODE_TEXT.MANIFEST_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
baseline_file = root / _CODE_TEXT.INVENTORY_BEFORE_JSON
library = Path(_CODE_TEXT.STORAGE_OUTPUT_MOTION_VIDEO_KIT_LIBRARY)
inventory = {str(file): digest(file.read_bytes()) for file in library.glob(_CODE_TEXT.JSON_E3F97F)}
if args.baseline:
    assert not manifest[_CODE_TEXT.INSTALLED]
    baseline_file.write_text(json.dumps(inventory), encoding=_CODE_TEXT.UTF_8)
rows = manifest[_CODE_TEXT.RECORDS]
assert len({row[_CODE_TEXT.ID] for row in rows}) == len(rows)
characters = 0
for row in rows:
    asset = json.loads(Path(row[_CODE_TEXT.STAGED]).read_text(encoding=_CODE_TEXT.UTF_8))
    assert asset.get(_CODE_TEXT.STYLEID, asset[_CODE_TEXT.ID]) == D.STYLE_ID
    assert asset[_CODE_TEXT.CHIBIDESIGNVERSION] == D.VERSION
    if row[_CODE_TEXT.TYPE] == _CODE_TEXT.STYLE_PACK:
        assert asset[_CODE_TEXT.BODY] == D.BODY and asset[_CODE_TEXT.FACE] == D.FACE
        continue
    characters += 1
    original = json.loads(Path(row[_CODE_TEXT.BACKUP]).read_text(encoding=_CODE_TEXT.UTF_8))
    for field in (_CODE_TEXT.ID, _CODE_TEXT.STYLEID, _CODE_TEXT.ARCHETYPE, _CODE_TEXT.GENDER, _CODE_TEXT.AGE, _CODE_TEXT.HEIGHT, _CODE_TEXT.NAME, _CODE_TEXT.ORIGINALNAME):
        assert asset.get(field) == original.get(field), (row[_CODE_TEXT.ID], field)
    validate_asset_geometry(asset, row[_CODE_TEXT.ID])
    assert set(asset[_CODE_TEXT.HEAD]) == {_CODE_TEXT.FRONT, _CODE_TEXT.SIDE, _CODE_TEXT.BACK}
    assert set(asset[_CODE_TEXT.BODY]) == {_CODE_TEXT.FRONT, _CODE_TEXT.SIDE, _CODE_TEXT.BACK}
    for pose in (_CODE_TEXT.SIT, _CODE_TEXT.KNEEL, _CODE_TEXT.CROUCH):
        sprite = asset[_CODE_TEXT.SPRITES][pose]
        assert sprite[_CODE_TEXT.BODYONLY] is True
        assert not any(_CODE_TEXT.TRANSLATE in node.attrib.get(_CODE_TEXT.TRANSFORM_AA214E, "") and _CODE_TEXT.SCALE in node.attrib.get(_CODE_TEXT.TRANSFORM_AA214E, "") for node in ET.fromstring(sprite[_CODE_TEXT.SVG_ACDB13])), (row[_CODE_TEXT.ID], pose)
        assert sprite[_CODE_TEXT.RIG][_CODE_TEXT.HEADH] == D.BODY[_CODE_TEXT.HEAD]
        assert sprite[_CODE_TEXT.RIG][_CODE_TEXT.HEADW] == D.BODY[_CODE_TEXT.HEAD] * D.BODY[_CODE_TEXT.HEADW]
assert characters == 59
if args.installed:
    assert manifest[_CODE_TEXT.INSTALLED]
    changed = {str(Path(row[_CODE_TEXT.SOURCE]).relative_to(Path.cwd())): row[_CODE_TEXT.AFTERHASH] for row in rows}
    baseline = json.loads(baseline_file.read_text(encoding=_CODE_TEXT.UTF_8))
    assert inventory.keys() == baseline.keys()
    for file, value in inventory.items():
        assert value == changed.get(file, baseline[file]), file
    renders = json.loads((root / _CODE_TEXT.RENDER_REVIEW_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
    assert len(renders) == 146 and all(not row[_CODE_TEXT.ISSUES] and Path(row[_CODE_TEXT.FILE]).is_file() for row in renders)
    result = dict(characters=characters, records=len(rows), images=len(renders), unchangedRecords=len(inventory) - len(rows), installed=True)
    (root / _CODE_TEXT.VERIFICATION_JSON).write_text(json.dumps(result, indent=2), encoding=_CODE_TEXT.UTF_8)
    print(json.dumps(result))
else:
    print(json.dumps(dict(characters=characters, records=len(rows), staged=True)))
