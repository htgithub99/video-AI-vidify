from seed_texts import SeedText as KST
import datetime
import hashlib
import xml.etree.ElementTree as ET
import json
import math
import re
import unicodedata
from pathlib import Path
RESOURCE_SCHEMA = json.loads((Path(__file__).resolve().parents[2] / "src/constants/motionResourceSchema.json").read_text(encoding="utf-8"))

def resource_location_family(value):
    value = unicodedata.normalize("NFC", value.lower())
    for family, pattern in RESOURCE_SCHEMA["locationAccentPatterns"].items():
        if re.search(pattern, value):
            return family
    value = "".join(char for char in unicodedata.normalize("NFD", value) if not unicodedata.combining(char)).replace("đ", "d")
    value = re.sub(r"[^a-z0-9]+", " ", value).strip()
    if value in RESOURCE_SCHEMA["locationPatterns"]:
        return value
    return next((family for family, pattern in RESOURCE_SCHEMA["locationPatterns"].items() if re.search(pattern, value)), None)

def resource_semantics(record):
    if record.get("type") not in RESOURCE_SCHEMA["assetTypes"]:
        return record
    record["semanticVersion"] = RESOURCE_SCHEMA["version"]
    if record.get("type") == "prop" and record.get("key") in RESOURCE_SCHEMA.get("propSurfaces", {}):
        record["surface"] = RESOURCE_SCHEMA["propSurfaces"][record["key"]]
    if record.get("type") == "set_piece":
        fixtures = RESOURCE_SCHEMA.get("pieceContactFixtures", {}).get(record.get("key"), {})
        for spot in record.get("spots", []):
            tokens = set(re.split(r"[^a-z0-9]+", (spot.get("fixture") or spot["key"]).lower()))
            fixture = next((value for key, value in fixtures.items() if set(key.split("_")).issubset(tokens)), None)
            if fixture:
                spot["fixture"] = fixture
        record["allowedEnvironments"] = record.get("allowedEnvironments", RESOURCE_SCHEMA["environments"] if record.get("key") in RESOURCE_SCHEMA["portablePieces"] or not record.get("environment") else [record["environment"]])
        if "extracted_component" in record.get("tags", []):
            key = next((tag for tag in record.get("tags", []) if tag in RESOURCE_SCHEMA["extractablePieces"]), record["name"].replace(" ", "_"))
            record["kind"] = next((kind for kind, keys in RESOURCE_SCHEMA["extractedPieceKinds"].items() if key in keys), "scenery")
            aliases = [key, *RESOURCE_SCHEMA["extractedFixtureAliases"].get(key, [])]
            record["spots"] = [spot for spot in record.get("spots", []) if any(set(alias.split("_")).issubset(set(re.split(r"[^a-z0-9]+", spot.get("fixture", "").lower()))) for alias in aliases)]
    if record.get("type") in ("set", "set_base"):
        family = record.get("locationFamily")
        if family not in RESOURCE_SCHEMA["locationPatterns"]:
            family = next((found for text in (record.get("name", ""), record.get("group") or record.get("family", ""), record.get("desc", "").split(RESOURCE_SCHEMA["descriptionFixtureBoundary"])[0], " ".join(record.get("tags", []))) if (found := resource_location_family(text))), None)
        if family:
            record["locationFamily"] = family
    return record
SEED_STYLES = {KST.MINIMAL_MASK: KST.STL_BA8CA635C716C880, KST.CHIBI_FOLK: KST.STL_E70FAC00BBF44662}
def seed_id(prefix, value):
    return prefix + hashlib.sha256(value.encode()).hexdigest()[:16]
def seed_timestamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime(KST.Y_M_DT_H_M_S_000Z)
def validate_asset_geometry(record, file):
    if record.get("semanticVersion") is not None and record["semanticVersion"] != RESOURCE_SCHEMA["version"]:
        raise ValueError((file, record["semanticVersion"]))
    if record.get("locationFamily") is not None and record["locationFamily"] not in RESOURCE_SCHEMA["locationPatterns"]:
        raise ValueError((file, record["locationFamily"]))
    if record.get("type") == "set_piece" and record.get("kind") not in RESOURCE_SCHEMA["pieceKinds"]:
        raise ValueError((file, record.get("kind")))
    surface = record.get("surface")
    if surface is not None:
        bounds = surface.get("bounds", [])
        ratio = surface.get("maxRatio", 0)
        if len(bounds) != 4 or not all(isinstance(value, (int, float)) and math.isfinite(value) for value in [*bounds, ratio]):
            raise ValueError((file, surface))
        x, y, width, height = bounds
        if not (x >= 0 and y >= 0 and width > 0 and height > 0 and x + width <= 512 and y + height <= 512 and 0 < ratio <= 1):
            raise ValueError((file, surface))
    environments = record.get("allowedEnvironments")
    if environments is not None and (not isinstance(environments, list) or not environments or len(set(environments)) != len(environments) or any(value not in RESOURCE_SCHEMA["environments"] for value in environments)):
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
