if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from seed_texts import SeedText as KST
import datetime
import hashlib
import xml.etree.ElementTree as ET
import json
import math
import re
import unicodedata
from pathlib import Path
RESOURCE_SCHEMA = json.loads((Path(__file__).resolve().parents[2] / _CODE_TEXT.SRC_CONSTANTS_MOTIONRESOURCESCHEMA_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
def resource_location_family(value):
    value = unicodedata.normalize(_CODE_TEXT.NFC, value.lower())
    for family, pattern in RESOURCE_SCHEMA[_CODE_TEXT.LOCATIONACCENTPATTERNS].items():
        if re.search(pattern, value):
            return family
    value = "".join(char for char in unicodedata.normalize(_CODE_TEXT.NFD, value) if not unicodedata.combining(char)).replace(_CODE_TEXT.SYMBOL_BF502A, _CODE_TEXT.D)
    value = re.sub(_CODE_TEXT.A_Z0_9, _CODE_TEXT.SYMBOL_36A9E7, value).strip()
    if value in RESOURCE_SCHEMA[_CODE_TEXT.LOCATIONPATTERNS]:
        return value
    return next((family for family, pattern in RESOURCE_SCHEMA[_CODE_TEXT.LOCATIONPATTERNS].items() if re.search(pattern, value)), None)
def resource_semantics(record):
    if record.get(_CODE_TEXT.TYPE) not in RESOURCE_SCHEMA[_CODE_TEXT.ASSETTYPES]:
        return record
    record[_CODE_TEXT.SEMANTICVERSION] = RESOURCE_SCHEMA[_CODE_TEXT.VERSION]
    if record.get(_CODE_TEXT.TYPE) == _CODE_TEXT.PROP and record.get(_CODE_TEXT.KEY) in RESOURCE_SCHEMA.get(_CODE_TEXT.PROPSURFACES, {}):
        record[_CODE_TEXT.SURFACE] = RESOURCE_SCHEMA[_CODE_TEXT.PROPSURFACES][record[_CODE_TEXT.KEY]]
    if record.get(_CODE_TEXT.TYPE) == _CODE_TEXT.SET_PIECE:
        fixtures = RESOURCE_SCHEMA.get(_CODE_TEXT.PIECECONTACTFIXTURES, {}).get(record.get(_CODE_TEXT.KEY), {})
        for spot in record.get(_CODE_TEXT.SPOTS, []):
            tokens = set(re.split(_CODE_TEXT.A_Z0_9, (spot.get(_CODE_TEXT.FIXTURE) or spot[_CODE_TEXT.KEY]).lower()))
            fixture = next((value for key, value in fixtures.items() if set(key.split(_CODE_TEXT.SYMBOL_D2E2AD)).issubset(tokens)), None)
            if fixture:
                spot[_CODE_TEXT.FIXTURE] = fixture
        record[_CODE_TEXT.ALLOWEDENVIRONMENTS] = record.get(_CODE_TEXT.ALLOWEDENVIRONMENTS, RESOURCE_SCHEMA[_CODE_TEXT.ENVIRONMENTS] if record.get(_CODE_TEXT.KEY) in RESOURCE_SCHEMA[_CODE_TEXT.PORTABLEPIECES] or not record.get(_CODE_TEXT.ENVIRONMENT) else [record[_CODE_TEXT.ENVIRONMENT]])
        if _CODE_TEXT.EXTRACTED_COMPONENT in record.get(_CODE_TEXT.TAGS, []):
            key = next((tag for tag in record.get(_CODE_TEXT.TAGS, []) if tag in RESOURCE_SCHEMA[_CODE_TEXT.EXTRACTABLEPIECES]), record[_CODE_TEXT.NAME].replace(_CODE_TEXT.SYMBOL_36A9E7, _CODE_TEXT.SYMBOL_D2E2AD))
            record[_CODE_TEXT.KIND] = next((kind for kind, keys in RESOURCE_SCHEMA[_CODE_TEXT.EXTRACTEDPIECEKINDS].items() if key in keys), _CODE_TEXT.SCENERY)
            aliases = [key, *RESOURCE_SCHEMA[_CODE_TEXT.EXTRACTEDFIXTUREALIASES].get(key, [])]
            record[_CODE_TEXT.SPOTS] = [spot for spot in record.get(_CODE_TEXT.SPOTS, []) if any(set(alias.split(_CODE_TEXT.SYMBOL_D2E2AD)).issubset(set(re.split(_CODE_TEXT.A_Z0_9, spot.get(_CODE_TEXT.FIXTURE, "").lower()))) for alias in aliases)]
    if record.get(_CODE_TEXT.TYPE) in (_CODE_TEXT.SET, _CODE_TEXT.SET_BASE):
        family = record.get(_CODE_TEXT.LOCATIONFAMILY)
        if family not in RESOURCE_SCHEMA[_CODE_TEXT.LOCATIONPATTERNS]:
            family = next((found for text in (record.get(_CODE_TEXT.NAME, ""), record.get(_CODE_TEXT.GROUP) or record.get(_CODE_TEXT.FAMILY, ""), record.get(_CODE_TEXT.DESC, "").split(RESOURCE_SCHEMA[_CODE_TEXT.DESCRIPTIONFIXTUREBOUNDARY])[0], _CODE_TEXT.SYMBOL_36A9E7.join(record.get(_CODE_TEXT.TAGS, []))) if (found := resource_location_family(text))), None)
        if family:
            record[_CODE_TEXT.LOCATIONFAMILY] = family
    return record
SEED_STYLES = {KST.MINIMAL_MASK: KST.STL_BA8CA635C716C880, KST.CHIBI_FOLK: KST.STL_E70FAC00BBF44662}
def seed_id(prefix, value):
    return prefix + hashlib.sha256(value.encode()).hexdigest()[:16]
def seed_timestamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime(KST.Y_M_DT_H_M_S_000Z)
def validate_asset_geometry(record, file):
    if record.get(_CODE_TEXT.SEMANTICVERSION) is not None and record[_CODE_TEXT.SEMANTICVERSION] != RESOURCE_SCHEMA[_CODE_TEXT.VERSION]:
        raise ValueError((file, record[_CODE_TEXT.SEMANTICVERSION]))
    if record.get(_CODE_TEXT.LOCATIONFAMILY) is not None and record[_CODE_TEXT.LOCATIONFAMILY] not in RESOURCE_SCHEMA[_CODE_TEXT.LOCATIONPATTERNS]:
        raise ValueError((file, record[_CODE_TEXT.LOCATIONFAMILY]))
    if record.get(_CODE_TEXT.TYPE) == _CODE_TEXT.SET_PIECE and record.get(_CODE_TEXT.KIND) not in RESOURCE_SCHEMA[_CODE_TEXT.PIECEKINDS]:
        raise ValueError((file, record.get(_CODE_TEXT.KIND)))
    surface = record.get(_CODE_TEXT.SURFACE)
    if surface is not None:
        bounds = surface.get(_CODE_TEXT.BOUNDS, [])
        ratio = surface.get(_CODE_TEXT.MAXRATIO, 0)
        if len(bounds) != 4 or not all(isinstance(value, (int, float)) and math.isfinite(value) for value in [*bounds, ratio]):
            raise ValueError((file, surface))
        x, y, width, height = bounds
        if not (x >= 0 and y >= 0 and width > 0 and height > 0 and x + width <= 512 and y + height <= 512 and 0 < ratio <= 1):
            raise ValueError((file, surface))
    environments = record.get(_CODE_TEXT.ALLOWEDENVIRONMENTS)
    if environments is not None and (not isinstance(environments, list) or not environments or len(set(environments)) != len(environments) or any(value not in RESOURCE_SCHEMA[_CODE_TEXT.ENVIRONMENTS] for value in environments)):
        raise ValueError((file, environments))
    svgs = [record.get(KST.SVG), record.get(KST.NIGHT)]
    for part in (KST.HEAD, KST.BODY):
        svgs.extend(record.get(part, {}).values())
    svgs.extend((value[KST.SVG] for value in record.get(KST.SPRITES, {}).values()))
    for svg in filter(None, svgs):
        ET.fromstring(svg)
    for spot in record.get(KST.SPOTS, []):
        if not 0 <= spot[KST.X] <= 1920 or not 0 <= spot[KST.Y] <= 1080:
            raise ValueError((file, spot))
