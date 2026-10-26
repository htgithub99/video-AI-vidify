import functools
import importlib
import re
import xml.etree.ElementTree as ET
from seed_utils import RESOURCE_SCHEMA, seed_id, resource_semantics

_collector = None
_depth = 0
_installed = False
_opening = '<g data-motion-component="%s">'
_marker = '<g data-motion-piece="%s"/>'
_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">%s</svg>'


def canonical_svg(value):
    return ET.canonicalize(value)


def install_capture():
    global _installed
    if _installed:
        return
    _installed = True
    modules = [importlib.import_module(name) for name in ("scenes", "interior", "reference_expansion", "fixed_compositions", "refkit")]
    wrappers = {}
    for module in modules:
        for name in RESOURCE_SCHEMA["extractablePieces"]:
            original = getattr(module, name, None)
            if not callable(original):
                continue
            identity = id(original)
            if identity not in wrappers:
                @functools.wraps(original)
                def capture(*args, _fn=original, _name=name, **kwargs):
                    global _depth
                    active = _collector is not None and _depth == 0
                    _depth += 1
                    try:
                        result = _fn(*args, **kwargs)
                    finally:
                        _depth -= 1
                    if active and isinstance(result, list) and result:
                        token = str(len(_collector))
                        _collector.append(dict(token=token, key=_name, inner="".join(result)))
                        return [_opening % token, *result, "</g>"]
                    return result
                wrappers[identity] = capture
            setattr(module, name, wrappers[identity])


def capture_scene(key, style, night, variant):
    global _collector
    install_capture()
    import scenes
    _collector = []
    try:
        value, floor, lights = scenes.build(key, style, night, variant)
        parts = _collector
    finally:
        _collector = None
    original = value
    used = []
    for part in parts:
        wrapped = (_opening % part["token"]) + part["inner"] + "</g>"
        if wrapped not in original:
            continue
        original = original.replace(wrapped, part["inner"])
        used.append(part)
    if "data-motion-component" in original:
        raise ValueError(key)
    return original, value, used, floor, lights


def component_contexts(tagged):
    stack = []
    contexts = {}
    for match in re.finditer(r"<g\b[^>]*>|</g>", tagged):
        tag = match[0]
        if tag == "</g>":
            stack.pop()
            continue
        token = re.search(r'data-motion-component="([^"]+)"', tag)
        if token:
            transforms = [item[0] for item in stack if item[0]]
            contexts[token[1]] = (transforms, any(item[1] for item in stack))
        transform = re.search(r'transform="([^"]+)"', tag)
        if not tag.endswith("/>"):
            stack.append((transform[1] if transform else "", "data-occ=" in tag))
    return contexts


def named_components(value):
    stack = []
    selected = []
    for match in re.finditer(r"<g\b[^>]*>|</g>", value):
        tag = match[0]
        if tag == "</g>":
            entry = stack.pop()
            if entry["selected"]:
                selected.append(dict(start=entry["start"], end=match.end(), key=entry["key"]))
            continue
        key = re.search(r'\bid="([a-zA-Z][a-zA-Z0-9_-]*)"', tag)
        eligible = bool(key and key[1] not in ("sky", "back", "mid", "floor", "fg", "foreground") and not any(item["selected"] for item in stack))
        if not tag.endswith("/>"):
            stack.append(dict(start=match.start(), key=key[1] if key else "", selected=eligible))
    tagged = value
    parts = []
    for index, item in enumerate(sorted(selected, key=lambda item: item["start"])):
        parts.append(dict(token=str(index), inner=value[item["start"]:item["end"]], **item))
    for part in reversed(parts):
        tagged = tagged[:part["start"]] + _opening % part["token"] + part["inner"] + "</g>" + tagged[part["end"]:]
    return tagged, parts


def verified_named_source(asset, style):
    group = asset.get("group", "")
    if group.startswith("folk_blocking_v1:"):
        from install_folk_blocking import CATALOG
        from folk_blocking_geometry import scene
    elif group.startswith("closed_pack_v1:"):
        from build_closed_pack import CATALOG, scene
    else:
        return None
    key = group.split(":", 1)[1]
    row = next((row for row in CATALOG["scenes"] if row["key"] == key), None)
    if not row:
        return None
    for flip in (False, True):
        original = scene(row, style, asset["time"] == "night", flip)["svg"]
        if canonical_svg(original) == canonical_svg(asset["svg"]):
            tagged, parts = named_components(original)
            return original, tagged, parts, key
    return None


def decompose_scene_asset(asset, style, key, variant):
    original, tagged, parts, _, _ = capture_scene(key, style, asset["time"] == "night", variant)
    if canonical_svg(original) != canonical_svg(asset["svg"]) or not parts:
        return None
    return make_recipe(asset, key, original, tagged, parts)


def decompose_named_asset(asset, style):
    verified = verified_named_source(asset, style)
    if not verified or not verified[2]:
        return None
    return make_recipe(asset, verified[3], verified[0], verified[1], verified[2])


def make_recipe(asset, key, original, tagged, parts):
    defs = re.search(r"<defs>[\s\S]*?</defs>", tagged)
    definitions = defs.group(0) if defs else ""
    template = tagged
    instances = []
    pieces = []
    contexts = component_contexts(tagged)
    for part in parts:
        wrapped = (_opening % part["token"]) + part["inner"] + "</g>"
        token = "piece_" + part["token"]
        template = template.replace(wrapped, _marker % token)
        key_name = part["key"]
        transforms, front = contexts[part["token"]]
        local = _svg % (definitions + part["inner"])
        world = part["inner"]
        for transform in reversed(transforms):
            world = '<g transform="%s">%s</g>' % (transform, world)
        body = _svg % (definitions + world)
        identifier = seed_id("pcs-", asset["styleId"] + key_name + body)
        pieces.append(dict(id=identifier, type="set_piece", styleId=asset["styleId"], key=key_name + "_" + identifier[4:], name=key_name.replace("_", " "), desc=key_name.replace("_", " "), svg=body, recipeSvg=local, front=front, decompositionVersion=2, source="seed", tags=["seed", key_name, "extracted_component"], environment="interior" if asset["interior"] else "exterior", allowedEnvironments=RESOURCE_SCHEMA["environments"] if key_name in RESOURCE_SCHEMA["portableExtractedPieces"] else ["interior" if asset["interior"] else "exterior"], slots=["mid_left", "mid_center", "mid_right"], spots=[], lights=[], uses=0, updatedAt=asset["updatedAt"], extractedFrom=asset["id"]))
        instances.append(dict(token=token, assetId=identifier))
    base_id = seed_id("bas-", asset["styleId"] + template)
    bare = re.sub(r'<g data-motion-piece="[^"]+"/>', "", template)
    base = resource_semantics(dict(id=base_id, type="set_base", styleId=asset["styleId"], key="scene_base_" + base_id[4:], family="interior" if asset["interior"] else "exterior", desc=asset["desc"], svg=bare, recipeTemplate=template, recipeOnly=True, decomposition="partial", horizonY=asset.get("horizonY", 720 if asset["interior"] else 750), floorY=asset["floorY"], interior=asset["interior"], tags=["seed", "extracted_background", key], uses=0, updatedAt=asset["updatedAt"], extractedFrom=asset["id"]))
    rebuilt = template
    for instance, piece in zip(instances, pieces):
        inner = re.match(r"<svg\b[^>]*>([\s\S]*)</svg>", piece["recipeSvg"])[1]
        inner = inner[len(definitions):] if definitions else inner
        rebuilt = rebuilt.replace(_marker % instance["token"], inner)
    if canonical_svg(rebuilt) != canonical_svg(original):
        raise ValueError(asset["id"])
    return dict(base=base, pieces=pieces, recipe=dict(version=RESOURCE_SCHEMA["recipeVersion"], decompositionVersion=2, baseId=base_id, pieces=instances))
