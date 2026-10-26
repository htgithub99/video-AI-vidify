import json
import sys
from chars import build_char
from migrate_illustration_library import normalize_art, register_characters
from seed_utils import validate_asset_geometry
from chibi_design import STYLE, VERSION

register_characters()
records = json.load(sys.stdin)
for asset in records:
    asset.update(build_char(asset["archetype"], STYLE))
    normalize_art(asset)
    asset["chibiDesignVersion"] = VERSION
    validate_asset_geometry(asset, asset["id"])
json.dump(records, sys.stdout, ensure_ascii=False)
