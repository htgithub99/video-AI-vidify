if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import argparse
import hashlib
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from itertools import combinations
from pathlib import Path
from chars import ARCH, build_char
from core import svg_attributes
from illustration_texts import IllustrationText as I
from seed_utils import SEED_STYLES, validate_asset_geometry
from folk_blocking_texts import FolkText as F
import chibi_design as CHIBI
def register_characters():
    catalog = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding=_CODE_TEXT.UTF_8))
    for row in catalog[_CODE_TEXT.CHARACTERS]:
        arch = dict(ARCH[row[_CODE_TEXT.BASE]], name=row[_CODE_TEXT.NAME], body=row[_CODE_TEXT.BODY], sleeve=row[_CODE_TEXT.BODY], hair=row[_CODE_TEXT.HAIR], desc=F.CHARACTER_DESC % (row[_CODE_TEXT.NAME], row[_CODE_TEXT.BODY], row[_CODE_TEXT.HAIR]))
        for field in (_CODE_TEXT.HEIGHT, _CODE_TEXT.BAND):
            if field in row:
                arch[field] = row[field]
        if row[_CODE_TEXT.KEY] == _CODE_TEXT.FOLK_INFANT:
            arch.update(dress=_CODE_TEXT.ROBE, group=_CODE_TEXT.VILLAGER, age=_CODE_TEXT.CHILD)
        ARCH[row[_CODE_TEXT.KEY]] = arch
def digest(data):
    return hashlib.sha256(data).hexdigest()
def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL)).encode(_CODE_TEXT.UTF_8)
def eligible(asset):
    return asset.get(_CODE_TEXT.STYLEID, asset[_CODE_TEXT.ID]) in SEED_STYLES.values() and asset.get(_CODE_TEXT.CATALOGSTATUS) != _CODE_TEXT.QUARANTINED and (asset[_CODE_TEXT.TYPE] == _CODE_TEXT.STYLE_PACK or I.SEED in asset.get(_CODE_TEXT.TAGS, []) or asset.get(_CODE_TEXT.SOURCE) == I.SEED)
def normalize_svg(svg):
    return re.sub(I.SVG_TAG, lambda match: svg_attributes(match.group(0)), svg)
def normalize_art(asset):
    changed = False
    for field in (_CODE_TEXT.SVG_ACDB13, _CODE_TEXT.NIGHT):
        if isinstance(asset.get(field), str):
            value = normalize_svg(asset[field])
            changed = changed or value != asset[field]
            asset[field] = value
    for field in (_CODE_TEXT.HEAD, _CODE_TEXT.BODY):
        for view, svg in asset.get(field, {}).items():
            if isinstance(svg, str):
                value = normalize_svg(svg)
                changed = changed or value != svg
                asset[field][view] = value
    for sprite in asset.get(_CODE_TEXT.SPRITES, {}).values():
        value = normalize_svg(sprite[_CODE_TEXT.SVG_ACDB13])
        changed = changed or value != sprite[_CODE_TEXT.SVG_ACDB13]
        sprite[_CODE_TEXT.SVG_ACDB13] = value
    return changed
def static_compositions(asset):
    existing = asset.get(_CODE_TEXT.COMPOSITIONS, [])
    spots = [s for s in asset.get(_CODE_TEXT.SPOTS, []) if s[_CODE_TEXT.KIND] in (_CODE_TEXT.STAND, _CODE_TEXT.SIT)]
    additions = []
    for size, kind, roles in ((2, _CODE_TEXT.CONVERSATION, (_CODE_TEXT.HOST, _CODE_TEXT.GUEST)), (3, _CODE_TEXT.GROUP_CONVERSATION, (_CODE_TEXT.HOST, _CODE_TEXT.GUEST, _CODE_TEXT.COMPANION))):
        for group in combinations(sorted(spots, key=lambda s: (s[_CODE_TEXT.X], s[_CODE_TEXT.KEY])), size):
            if any(abs(a[_CODE_TEXT.X] - b[_CODE_TEXT.X]) < 150 or abs(a[_CODE_TEXT.X] - b[_CODE_TEXT.X]) > 1050 or abs(a[_CODE_TEXT.Y] - b[_CODE_TEXT.Y]) > 220 for a, b in combinations(group, 2)):
                continue
            key = _CODE_TEXT.ILLUSTRATION + kind + _CODE_TEXT.SYMBOL_D2E2AD + _CODE_TEXT.SYMBOL_D2E2AD.join(s[_CODE_TEXT.KEY] for s in group)
            additions.append(dict(key=key, kind=kind, roles=dict(zip(roles, (s[_CODE_TEXT.KEY] for s in group)))))
            if len([item for item in additions if item[_CODE_TEXT.KIND] == kind]) >= 12:
                break
    known = {c[_CODE_TEXT.KEY] for c in existing}
    return existing + [c for c in additions if c[_CODE_TEXT.KEY] not in known]
def split_layers(asset, pool):
    root = ET.fromstring(asset[_CODE_TEXT.SVG_ACDB13])
    recipe = []
    for index, child in enumerate(root):
        fragment = ET.tostring(child, encoding=_CODE_TEXT.UNICODE)
        identifier = I.LAYER_PREFIX + digest(fragment.encode(_CODE_TEXT.UTF_8))
        pool.setdefault(identifier, fragment)
        recipe.append(dict(id=identifier, role=child.attrib.get(_CODE_TEXT.ID, child.tag.split(_CODE_TEXT.SYMBOL_D10B36)[-1]), order=index))
    return dict(attributes=root.attrib, layers=recipe)
def stage(library, output):
    register_characters()
    installed = Path(_CODE_TEXT.SCRATCH_CLOSED_PACK_20261024_INSTALLED_JSON)
    new_ids = {json.loads(Path(row[_CODE_TEXT.PATH]).read_text(encoding=_CODE_TEXT.UTF_8))[_CODE_TEXT.ID] for row in json.loads(installed.read_text(encoding=_CODE_TEXT.UTF_8))[_CODE_TEXT.RECORDS]} if installed.exists() else set()
    assets = {asset[_CODE_TEXT.ID]: (file, asset) for kind in I.TYPES for file in sorted((library / kind).glob(_CODE_TEXT.JSON_7C7C35)) for asset in [json.loads(file.read_text(encoding=_CODE_TEXT.UTF_8))]}
    canonical = {}
    for identifier, (_, asset) in assets.items():
        if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.PROP and eligible(asset):
            key = (asset[_CODE_TEXT.STYLEID], asset.get(_CODE_TEXT.KEY))
            if key not in canonical or (identifier in new_ids, asset.get(_CODE_TEXT.CATALOGVERSION, 0), identifier) > (canonical[key] in new_ids, assets[canonical[key]][1].get(_CODE_TEXT.CATALOGVERSION, 0), canonical[key]):
                canonical[key] = identifier
    rows, pool, recipes = [], {}, {}
    for identifier, (file, original) in assets.items():
        if identifier in new_ids:
            continue
        before = file.read_bytes()
        asset = json.loads(before)
        action, repairs = I.HISTORICAL, []
        if eligible(asset):
            action = I.STATUS
            if asset.get(_CODE_TEXT.ILLUSTRATIONVERSION) != I.VERSION:
                style = next((key for key, value in SEED_STYLES.items() if value == asset.get(_CODE_TEXT.STYLEID, identifier)), None)
                if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.STYLE_PACK and style == I.CHIBI:
                    asset.update(body=CHIBI.BODY, face=CHIBI.FACE, description=CHIBI.DESCRIPTION, chibiDesignVersion=CHIBI.VERSION)
                    repairs.append(_CODE_TEXT.CHIBI_PROPORTIONS)
                if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.CHARACTER_KIT and style == I.CHIBI and asset.get(_CODE_TEXT.ARCHETYPE) in ARCH and not asset.get(_CODE_TEXT.HUMANGHOSTVERSION):
                    asset.update(build_char(asset[_CODE_TEXT.ARCHETYPE], style))
                    asset[_CODE_TEXT.CHIBIDESIGNVERSION] = CHIBI.VERSION
                    if asset[_CODE_TEXT.ARCHETYPE] in CHIBI.DESCRIPTIONS:
                        asset[_CODE_TEXT.DESC] = CHIBI.DESCRIPTIONS[asset[_CODE_TEXT.ARCHETYPE]]
                    repairs.extend((_CODE_TEXT.STANDING_LEG_PROPORTIONS, _CODE_TEXT.SEATED_HEAD_AND_RIG))
                if _CODE_TEXT.SLOTS in asset:
                    cleaned = list(dict.fromkeys(asset[_CODE_TEXT.SLOTS]))
                    if cleaned != asset[_CODE_TEXT.SLOTS]:
                        asset[_CODE_TEXT.SLOTS] = cleaned
                        repairs.append(_CODE_TEXT.DEDUPLICATED_SLOTS)
                if _CODE_TEXT.TAGS in asset:
                    asset[_CODE_TEXT.TAGS] = list(dict.fromkeys(asset[_CODE_TEXT.TAGS]))
                if asset[_CODE_TEXT.TYPE] in (_CODE_TEXT.SET, _CODE_TEXT.SET_PIECE):
                    compositions = static_compositions(asset)
                    if compositions != asset.get(_CODE_TEXT.COMPOSITIONS, []):
                        asset[_CODE_TEXT.COMPOSITIONS] = compositions
                        repairs.append(_CODE_TEXT.STATIC_LAYOUTS_FROM_EXISTING_SPOTS)
                if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.SET:
                    reverse = {other[_CODE_TEXT.TIME]: other[_CODE_TEXT.ID] for _, other in assets.values() if other.get(_CODE_TEXT.STYLEID) == asset[_CODE_TEXT.STYLEID] and other.get(_CODE_TEXT.TYPE) == _CODE_TEXT.SET and identifier in (other.get(_CODE_TEXT.VARIANTS) or {}).values() and other.get(_CODE_TEXT.TIME) != asset.get(_CODE_TEXT.TIME)}
                    if reverse:
                        asset[_CODE_TEXT.VARIANTS] = {**reverse, **asset.get(_CODE_TEXT.VARIANTS, {})}
                        repairs.append(_CODE_TEXT.BIDIRECTIONAL_TIME_VARIANTS)
                if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.PROP:
                    target = canonical.get((asset[_CODE_TEXT.STYLEID], asset.get(_CODE_TEXT.KEY)))
                    if target and target != identifier:
                        asset[_CODE_TEXT.ALIASOF] = target
                        repairs.append(_CODE_TEXT.CANONICAL_PROP_ALIAS)
                asset[_CODE_TEXT.ILLUSTRATIONVERSION] = I.VERSION
            if normalize_art(asset):
                repairs.append(_CODE_TEXT.VALID_SVG_ATTRIBUTES)
            if asset[_CODE_TEXT.TYPE] == _CODE_TEXT.SET:
                recipes[identifier] = split_layers(asset, pool)
            if asset[_CODE_TEXT.TYPE] != _CODE_TEXT.STYLE_PACK:
                try:
                    validate_asset_geometry(asset, str(file))
                except (ValueError, ET.ParseError) as error:
                    raise ValueError((str(file), str(error))) from error
        target = output / I.STAGED / asset[_CODE_TEXT.TYPE] / file.name
        backup = output / I.BEFORE / asset[_CODE_TEXT.TYPE] / file.name
        target.parent.mkdir(parents=True, exist_ok=True)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists() and backup.read_bytes() != before:
            raise ValueError(I.CONFLICT + str(backup))
        backup.write_bytes(before)
        after = encoded(asset) if eligible(asset) else before
        target.write_bytes(after)
        rows.append(dict(id=identifier, type=asset[_CODE_TEXT.TYPE], styleId=asset.get(_CODE_TEXT.STYLEID, identifier), action=action, repairs=repairs, beforeHash=digest(before), afterHash=digest(after), changed=before != after, source=str(file.resolve()), staged=str(target.resolve()), backup=str(backup.resolve()), visualReview=_CODE_TEXT.PENDING if eligible(asset) else _CODE_TEXT.NOT_SELECTED))
    layers = output / I.LAYER_DIR
    layers.mkdir(parents=True, exist_ok=True)
    for identifier, fragment in pool.items():
        (layers / (identifier + _CODE_TEXT.SVGPART)).write_text(fragment, encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    (output / _CODE_TEXT.SCENE_RECIPES_JSON).write_bytes(encoded(recipes))
    manifest = dict(
        version=I.VERSION, library=str(library.resolve()), records=rows, counts=dict(Counter(row[_CODE_TEXT.ACTION] for row in rows)), changed=sum(row[_CODE_TEXT.CHANGED] for row in rows), repairedCharacters=sum(_CODE_TEXT.SEATED_HEAD_AND_RIG in row[_CODE_TEXT.REPAIRS] for row in rows), reusableLayers=len(pool), sceneRecipes=len(recipes), newRecordsPreserved=len(new_ids), installed=False
    )
    (output / I.REPORT).write_bytes(encoded(manifest))
    print(json.dumps({key: value for key, value in manifest.items() if key != _CODE_TEXT.RECORDS}))
def install(output, rollback=False):
    manifest_file = output / I.REPORT
    manifest = json.loads(manifest_file.read_text(encoding=_CODE_TEXT.UTF_8))
    original = _CODE_TEXT.AFTERHASH if manifest.get(_CODE_TEXT.INSTALLED) else _CODE_TEXT.BEFOREHASH
    target_hash = _CODE_TEXT.BEFOREHASH if rollback else _CODE_TEXT.AFTERHASH
    payload = _CODE_TEXT.BACKUP if rollback else _CODE_TEXT.STAGED
    for row in manifest[_CODE_TEXT.RECORDS]:
        assert_legacy_library_target(row[_CODE_TEXT.SOURCE])
        if digest(Path(row[_CODE_TEXT.SOURCE]).read_bytes()) != row[original] or digest(Path(row[payload]).read_bytes()) != row[target_hash]:
            raise ValueError(I.CONFLICT + row[_CODE_TEXT.SOURCE])
    written = []
    try:
        for row in manifest[_CODE_TEXT.RECORDS]:
            if not row[_CODE_TEXT.CHANGED]:
                continue
            target = Path(row[_CODE_TEXT.SOURCE])
            previous = target.read_bytes()
            temporary = target.with_suffix(_CODE_TEXT.ILLUSTRATION_TMP)
            temporary.write_bytes(Path(row[payload]).read_bytes())
            os.replace(temporary, target)
            written.append((target, previous))
    except Exception:
        for target, previous in reversed(written):
            temporary = target.with_suffix(_CODE_TEXT.ILLUSTRATION_TMP)
            temporary.write_bytes(previous)
            os.replace(temporary, target)
        raise
    manifest[_CODE_TEXT.INSTALLED] = not rollback
    manifest_file.write_bytes(encoded(manifest))
    print(json.dumps(dict(installed=not rollback, changed=manifest[_CODE_TEXT.CHANGED])))
def main():
    sys.stdout.reconfigure(encoding=_CODE_TEXT.UTF_8)
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.LIBRARY_79F64B, type=Path, default=Path(I.LIBRARY))
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(I.ROOT))
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument(_CODE_TEXT.INSTALL, action=_CODE_TEXT.STORE_TRUE)
    modes.add_argument(_CODE_TEXT.ROLLBACK, action=_CODE_TEXT.STORE_TRUE)
    args = parser.parse_args()
    if args.install or args.rollback:
        install(args.output, args.rollback)
    else:
        stage(args.library, args.output)
if __name__ == _CODE_TEXT.MAIN:
    main()
