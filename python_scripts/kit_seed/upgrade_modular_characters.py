if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import json
import sys
from chars import build_char
from migrate_illustration_library import normalize_art, register_characters
from seed_utils import validate_asset_geometry
from chibi_design import STYLE, VERSION
register_characters()
records = json.load(sys.stdin)
for asset in records:
    asset.update(build_char(asset[_CODE_TEXT.ARCHETYPE], STYLE))
    normalize_art(asset)
    asset[_CODE_TEXT.CHIBIDESIGNVERSION] = VERSION
    validate_asset_geometry(asset, asset[_CODE_TEXT.ID])
json.dump(records, sys.stdout, ensure_ascii=False)
