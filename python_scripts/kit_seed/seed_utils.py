from seed_texts import SeedText as KST
import datetime
import hashlib
import xml.etree.ElementTree as ET
SEED_STYLES = {KST.MINIMAL_MASK: KST.STL_BA8CA635C716C880, KST.CHIBI_FOLK: KST.STL_E70FAC00BBF44662}
def seed_id(prefix, value):
    return prefix + hashlib.sha256(value.encode()).hexdigest()[:16]
def seed_timestamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime(KST.Y_M_DT_H_M_S_000Z)
def validate_asset_geometry(record, file):
    svgs = [record.get(KST.SVG), record.get(KST.NIGHT)]
    for part in (KST.HEAD, KST.BODY):
        svgs.extend(record.get(part, {}).values())
    svgs.extend((value[KST.SVG] for value in record.get(KST.SPRITES, {}).values()))
    for svg in filter(None, svgs):
        ET.fromstring(svg)
    for spot in record.get(KST.SPOTS, []):
        if not 0 <= spot[KST.X] <= 1920 or not 0 <= spot[KST.Y] <= 1080:
            raise ValueError((file, spot))
