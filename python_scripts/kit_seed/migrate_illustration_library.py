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
    catalog = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding="utf-8"))
    for row in catalog["characters"]:
        arch = dict(ARCH[row["base"]], name=row["name"], body=row["body"], sleeve=row["body"], hair=row["hair"], desc=F.CHARACTER_DESC % (row["name"], row["body"], row["hair"]))
        for field in ("height", "band"):
            if field in row:
                arch[field] = row[field]
        if row["key"] == "folk_infant":
            arch.update(dress="robe", group="villager", age="child")
        ARCH[row["key"]] = arch


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def eligible(asset):
    return asset.get("styleId", asset["id"]) in SEED_STYLES.values() and asset.get("catalogStatus") != "quarantined" and (asset["type"] == "style_pack" or I.SEED in asset.get("tags", []) or asset.get("source") == I.SEED)


def normalize_svg(svg):
    return re.sub(I.SVG_TAG, lambda match: svg_attributes(match.group(0)), svg)


def normalize_art(asset):
    changed = False
    for field in ("svg", "night"):
        if isinstance(asset.get(field), str):
            value = normalize_svg(asset[field])
            changed = changed or value != asset[field]
            asset[field] = value
    for field in ("head", "body"):
        for view, svg in asset.get(field, {}).items():
            if isinstance(svg, str):
                value = normalize_svg(svg)
                changed = changed or value != svg
                asset[field][view] = value
    for sprite in asset.get("sprites", {}).values():
        value = normalize_svg(sprite["svg"])
        changed = changed or value != sprite["svg"]
        sprite["svg"] = value
    return changed


def static_compositions(asset):
    existing = asset.get("compositions", [])
    spots = [s for s in asset.get("spots", []) if s["kind"] in ("stand", "sit")]
    additions = []
    for size, kind, roles in ((2, "conversation", ("host", "guest")), (3, "group_conversation", ("host", "guest", "companion"))):
        for group in combinations(sorted(spots, key=lambda s: (s["x"], s["key"])), size):
            if any(abs(a["x"] - b["x"]) < 150 or abs(a["x"] - b["x"]) > 1050 or abs(a["y"] - b["y"]) > 220 for a, b in combinations(group, 2)):
                continue
            key = "illustration_" + kind + "_" + "_".join(s["key"] for s in group)
            additions.append(dict(key=key, kind=kind, roles=dict(zip(roles, (s["key"] for s in group)))))
            if len([item for item in additions if item["kind"] == kind]) >= 12:
                break
    known = {c["key"] for c in existing}
    return existing + [c for c in additions if c["key"] not in known]


def split_layers(asset, pool):
    root = ET.fromstring(asset["svg"])
    recipe = []
    for index, child in enumerate(root):
        fragment = ET.tostring(child, encoding="unicode")
        identifier = I.LAYER_PREFIX + digest(fragment.encode("utf-8"))
        pool.setdefault(identifier, fragment)
        recipe.append(dict(id=identifier, role=child.attrib.get("id", child.tag.split("}")[-1]), order=index))
    return dict(attributes=root.attrib, layers=recipe)


def stage(library, output):
    register_characters()
    installed = Path("scratch/closed-pack-20261024/installed.json")
    new_ids = {json.loads(Path(row["path"]).read_text(encoding="utf-8"))["id"] for row in json.loads(installed.read_text(encoding="utf-8"))["records"]} if installed.exists() else set()
    assets = {asset["id"]: (file, asset) for kind in I.TYPES for file in sorted((library / kind).glob("*.json")) for asset in [json.loads(file.read_text(encoding="utf-8"))]}
    canonical = {}
    for identifier, (_, asset) in assets.items():
        if asset["type"] == "prop" and eligible(asset):
            key = (asset["styleId"], asset.get("key"))
            if key not in canonical or (identifier in new_ids, asset.get("catalogVersion", 0), identifier) > (canonical[key] in new_ids, assets[canonical[key]][1].get("catalogVersion", 0), canonical[key]):
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
            if asset.get("illustrationVersion") != I.VERSION:
                style = next((key for key, value in SEED_STYLES.items() if value == asset.get("styleId", identifier)), None)
                if asset["type"] == "style_pack" and style == I.CHIBI:
                    asset.update(body=CHIBI.BODY, face=CHIBI.FACE, description=CHIBI.DESCRIPTION, chibiDesignVersion=CHIBI.VERSION)
                    repairs.append("chibi_proportions")
                if asset["type"] == "character_kit" and style == I.CHIBI and asset.get("archetype") in ARCH and not asset.get("humanGhostVersion"):
                    asset.update(build_char(asset["archetype"], style))
                    asset["chibiDesignVersion"] = CHIBI.VERSION
                    if asset["archetype"] in CHIBI.DESCRIPTIONS:
                        asset["desc"] = CHIBI.DESCRIPTIONS[asset["archetype"]]
                    repairs.extend(("standing_leg_proportions", "seated_head_and_rig"))
                if "slots" in asset:
                    cleaned = list(dict.fromkeys(asset["slots"]))
                    if cleaned != asset["slots"]:
                        asset["slots"] = cleaned
                        repairs.append("deduplicated_slots")
                if "tags" in asset:
                    asset["tags"] = list(dict.fromkeys(asset["tags"]))
                if asset["type"] in ("set", "set_piece"):
                    compositions = static_compositions(asset)
                    if compositions != asset.get("compositions", []):
                        asset["compositions"] = compositions
                        repairs.append("static_layouts_from_existing_spots")
                if asset["type"] == "set":
                    reverse = {other["time"]: other["id"] for _, other in assets.values() if other.get("styleId") == asset["styleId"] and other.get("type") == "set" and identifier in (other.get("variants") or {}).values() and other.get("time") != asset.get("time")}
                    if reverse:
                        asset["variants"] = {**reverse, **asset.get("variants", {})}
                        repairs.append("bidirectional_time_variants")
                if asset["type"] == "prop":
                    target = canonical.get((asset["styleId"], asset.get("key")))
                    if target and target != identifier:
                        asset["aliasOf"] = target
                        repairs.append("canonical_prop_alias")
                asset["illustrationVersion"] = I.VERSION
            if normalize_art(asset):
                repairs.append("valid_svg_attributes")
            if asset["type"] == "set":
                recipes[identifier] = split_layers(asset, pool)
            if asset["type"] != "style_pack":
                try:
                    validate_asset_geometry(asset, str(file))
                except (ValueError, ET.ParseError) as error:
                    raise ValueError((str(file), str(error))) from error
        target = output / I.STAGED / asset["type"] / file.name
        backup = output / I.BEFORE / asset["type"] / file.name
        target.parent.mkdir(parents=True, exist_ok=True)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists() and backup.read_bytes() != before:
            raise ValueError(I.CONFLICT + str(backup))
        backup.write_bytes(before)
        after = encoded(asset) if eligible(asset) else before
        target.write_bytes(after)
        rows.append(dict(id=identifier, type=asset["type"], styleId=asset.get("styleId", identifier), action=action, repairs=repairs, beforeHash=digest(before), afterHash=digest(after), changed=before != after, source=str(file.resolve()), staged=str(target.resolve()), backup=str(backup.resolve()), visualReview="pending" if eligible(asset) else "not_selected"))
    layers = output / I.LAYER_DIR
    layers.mkdir(parents=True, exist_ok=True)
    for identifier, fragment in pool.items():
        (layers / (identifier + ".svgpart")).write_text(fragment, encoding="utf-8", newline="\n")
    (output / "scene-recipes.json").write_bytes(encoded(recipes))
    manifest = dict(version=I.VERSION, library=str(library.resolve()), records=rows, counts=dict(Counter(row["action"] for row in rows)), changed=sum(row["changed"] for row in rows), repairedCharacters=sum("seated_head_and_rig" in row["repairs"] for row in rows), reusableLayers=len(pool), sceneRecipes=len(recipes), newRecordsPreserved=len(new_ids), installed=False)
    (output / I.REPORT).write_bytes(encoded(manifest))
    print(json.dumps({key: value for key, value in manifest.items() if key != "records"}))


def install(output, rollback=False):
    manifest_file = output / I.REPORT
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    original = "afterHash" if manifest.get("installed") else "beforeHash"
    target_hash = "beforeHash" if rollback else "afterHash"
    payload = "backup" if rollback else "staged"
    for row in manifest["records"]:
        assert_legacy_library_target(row["source"])
        if digest(Path(row["source"]).read_bytes()) != row[original] or digest(Path(row[payload]).read_bytes()) != row[target_hash]:
            raise ValueError(I.CONFLICT + row["source"])
    written = []
    try:
        for row in manifest["records"]:
            if not row["changed"]:
                continue
            target = Path(row["source"])
            previous = target.read_bytes()
            temporary = target.with_suffix(".illustration.tmp")
            temporary.write_bytes(Path(row[payload]).read_bytes())
            os.replace(temporary, target)
            written.append((target, previous))
    except Exception:
        for target, previous in reversed(written):
            temporary = target.with_suffix(".illustration.tmp")
            temporary.write_bytes(previous)
            os.replace(temporary, target)
        raise
    manifest["installed"] = not rollback
    manifest_file.write_bytes(encoded(manifest))
    print(json.dumps(dict(installed=not rollback, changed=manifest["changed"])))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--library", type=Path, default=Path(I.LIBRARY))
    parser.add_argument("--output", type=Path, default=Path(I.ROOT))
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--install", action="store_true")
    modes.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    if args.install or args.rollback:
        install(args.output, args.rollback)
    else:
        stage(args.library, args.output)


if __name__ == "__main__":
    main()
