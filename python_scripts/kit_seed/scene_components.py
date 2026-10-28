if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import functools
import importlib
import re
import xml.etree.ElementTree as ET
from seed_utils import RESOURCE_SCHEMA, seed_id, resource_semantics
_collector = None
_depth = 0
_installed = False
_opening = _CODE_TEXT.G_DATA_MOTION_COMPONENT_S
_marker = _CODE_TEXT.G_DATA_MOTION_PIECE_S
_svg = _CODE_TEXT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_1920_1080_S_S
def canonical_svg(value):
    return ET.canonicalize(value)
def install_capture():
    global _installed
    if _installed:
        return
    _installed = True
    modules = [importlib.import_module(name) for name in (_CODE_TEXT.SCENES, _CODE_TEXT.INTERIOR, _CODE_TEXT.REFERENCE_EXPANSION, _CODE_TEXT.FIXED_COMPOSITIONS, _CODE_TEXT.REFKIT)]
    wrappers = {}
    for module in modules:
        for name in RESOURCE_SCHEMA[_CODE_TEXT.EXTRACTABLEPIECES]:
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
                        return [_opening % token, *result, _CODE_TEXT.G]
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
        wrapped = (_opening % part[_CODE_TEXT.TOKEN]) + part[_CODE_TEXT.INNER] + _CODE_TEXT.G
        if wrapped not in original:
            continue
        original = original.replace(wrapped, part[_CODE_TEXT.INNER])
        used.append(part)
    if _CODE_TEXT.DATA_MOTION_COMPONENT in original:
        raise ValueError(key)
    return original, value, used, floor, lights
def component_contexts(tagged):
    stack = []
    contexts = {}
    for match in re.finditer(_CODE_TEXT.G_B_G, tagged):
        tag = match[0]
        if tag == _CODE_TEXT.G:
            stack.pop()
            continue
        token = re.search(_CODE_TEXT.DATA_MOTION_COMPONENT_DC8C8E, tag)
        if token:
            transforms = [item[0] for item in stack if item[0]]
            contexts[token[1]] = (transforms, any(item[1] for item in stack))
        transform = re.search(_CODE_TEXT.TRANSFORM, tag)
        if not tag.endswith(_CODE_TEXT.SYMBOL_CC80A2):
            stack.append((transform[1] if transform else "", _CODE_TEXT.DATA_OCC in tag))
    return contexts
def named_components(value):
    stack = []
    selected = []
    for match in re.finditer(_CODE_TEXT.G_B_G, value):
        tag = match[0]
        if tag == _CODE_TEXT.G:
            entry = stack.pop()
            if entry[_CODE_TEXT.SELECTED]:
                selected.append(dict(start=entry[_CODE_TEXT.START], end=match.end(), key=entry[_CODE_TEXT.KEY]))
            continue
        key = re.search(_CODE_TEXT.BID_A_ZA_Z_A_ZA_Z0_9, tag)
        eligible = bool(key and key[1] not in (_CODE_TEXT.SKY, _CODE_TEXT.BACK, _CODE_TEXT.MID, _CODE_TEXT.FLOOR, _CODE_TEXT.FG, _CODE_TEXT.FOREGROUND) and not any(item[_CODE_TEXT.SELECTED] for item in stack))
        if not tag.endswith(_CODE_TEXT.SYMBOL_CC80A2):
            stack.append(dict(start=match.start(), key=key[1] if key else "", selected=eligible))
    tagged = value
    parts = []
    for index, item in enumerate(sorted(selected, key=lambda item: item[_CODE_TEXT.START])):
        parts.append(dict(token=str(index), inner=value[item[_CODE_TEXT.START] : item[_CODE_TEXT.END]], **item))
    for part in reversed(parts):
        tagged = tagged[: part[_CODE_TEXT.START]] + _opening % part[_CODE_TEXT.TOKEN] + part[_CODE_TEXT.INNER] + _CODE_TEXT.G + tagged[part[_CODE_TEXT.END] :]
    return tagged, parts
def verified_named_source(asset, style):
    group = asset.get(_CODE_TEXT.GROUP, "")
    if group.startswith(_CODE_TEXT.FOLK_BLOCKING_V1):
        from install_folk_blocking import CATALOG
        from folk_blocking_geometry import scene
    elif group.startswith(_CODE_TEXT.CLOSED_PACK_V1):
        from build_closed_pack import CATALOG, scene
    else:
        return None
    key = group.split(_CODE_TEXT.SYMBOL, 1)[1]
    row = next((row for row in CATALOG[_CODE_TEXT.SCENES] if row[_CODE_TEXT.KEY] == key), None)
    if not row:
        return None
    for flip in (False, True):
        original = scene(row, style, asset[_CODE_TEXT.TIME] == _CODE_TEXT.NIGHT, flip)[_CODE_TEXT.SVG_ACDB13]
        if canonical_svg(original) == canonical_svg(asset[_CODE_TEXT.SVG_ACDB13]):
            tagged, parts = named_components(original)
            return original, tagged, parts, key
    return None
def decompose_scene_asset(asset, style, key, variant):
    original, tagged, parts, _, _ = capture_scene(key, style, asset[_CODE_TEXT.TIME] == _CODE_TEXT.NIGHT, variant)
    if canonical_svg(original) != canonical_svg(asset[_CODE_TEXT.SVG_ACDB13]) or not parts:
        return None
    return make_recipe(asset, key, original, tagged, parts)
def decompose_named_asset(asset, style):
    verified = verified_named_source(asset, style)
    if not verified or not verified[2]:
        return None
    return make_recipe(asset, verified[3], verified[0], verified[1], verified[2])
def make_recipe(asset, key, original, tagged, parts):
    defs = re.search(_CODE_TEXT.DEFS_S_S_DEFS, tagged)
    definitions = defs.group(0) if defs else ""
    template = tagged
    instances = []
    pieces = []
    contexts = component_contexts(tagged)
    for part in parts:
        wrapped = (_opening % part[_CODE_TEXT.TOKEN]) + part[_CODE_TEXT.INNER] + _CODE_TEXT.G
        token = _CODE_TEXT.PIECE + part[_CODE_TEXT.TOKEN]
        template = template.replace(wrapped, _marker % token)
        key_name = part[_CODE_TEXT.KEY]
        transforms, front = contexts[part[_CODE_TEXT.TOKEN]]
        local = _svg % (definitions + part[_CODE_TEXT.INNER])
        world = part[_CODE_TEXT.INNER]
        for transform in reversed(transforms):
            world = _CODE_TEXT.G_TRANSFORM_S_S_G % (transform, world)
        body = _svg % (definitions + world)
        identifier = seed_id(_CODE_TEXT.PCS, asset[_CODE_TEXT.STYLEID] + key_name + body)
        pieces.append(
            dict(
                id=identifier,
                type=_CODE_TEXT.SET_PIECE,
                styleId=asset[_CODE_TEXT.STYLEID],
                key=key_name + _CODE_TEXT.SYMBOL_D2E2AD + identifier[4:],
                name=key_name.replace(_CODE_TEXT.SYMBOL_D2E2AD, _CODE_TEXT.SYMBOL_36A9E7),
                desc=key_name.replace(_CODE_TEXT.SYMBOL_D2E2AD, _CODE_TEXT.SYMBOL_36A9E7),
                svg=body,
                recipeSvg=local,
                front=front,
                decompositionVersion=2,
                source=_CODE_TEXT.SEED,
                tags=[_CODE_TEXT.SEED, key_name, _CODE_TEXT.EXTRACTED_COMPONENT],
                environment=_CODE_TEXT.INTERIOR if asset[_CODE_TEXT.INTERIOR] else _CODE_TEXT.EXTERIOR,
                allowedEnvironments=RESOURCE_SCHEMA[_CODE_TEXT.ENVIRONMENTS] if key_name in RESOURCE_SCHEMA[_CODE_TEXT.PORTABLEEXTRACTEDPIECES] else [_CODE_TEXT.INTERIOR if asset[_CODE_TEXT.INTERIOR] else _CODE_TEXT.EXTERIOR],
                slots=[_CODE_TEXT.MID_LEFT, _CODE_TEXT.MID_CENTER, _CODE_TEXT.MID_RIGHT],
                spots=[],
                lights=[],
                uses=0,
                updatedAt=asset[_CODE_TEXT.UPDATEDAT],
                extractedFrom=asset[_CODE_TEXT.ID],
            )
        )
        instances.append(dict(token=token, assetId=identifier))
    base_id = seed_id(_CODE_TEXT.BAS, asset[_CODE_TEXT.STYLEID] + template)
    bare = re.sub(_CODE_TEXT.G_DATA_MOTION_PIECE, "", template)
    base = resource_semantics(
        dict(
            id=base_id,
            type=_CODE_TEXT.SET_BASE,
            styleId=asset[_CODE_TEXT.STYLEID],
            key=_CODE_TEXT.SCENE_BASE + base_id[4:],
            family=_CODE_TEXT.INTERIOR if asset[_CODE_TEXT.INTERIOR] else _CODE_TEXT.EXTERIOR,
            desc=asset[_CODE_TEXT.DESC],
            svg=bare,
            recipeTemplate=template,
            recipeOnly=True,
            decomposition=_CODE_TEXT.PARTIAL,
            horizonY=asset.get(_CODE_TEXT.HORIZONY, 720 if asset[_CODE_TEXT.INTERIOR] else 750),
            floorY=asset[_CODE_TEXT.FLOORY],
            interior=asset[_CODE_TEXT.INTERIOR],
            tags=[_CODE_TEXT.SEED, _CODE_TEXT.EXTRACTED_BACKGROUND, key],
            uses=0,
            updatedAt=asset[_CODE_TEXT.UPDATEDAT],
            extractedFrom=asset[_CODE_TEXT.ID],
        )
    )
    rebuilt = template
    for instance, piece in zip(instances, pieces):
        inner = re.match(_CODE_TEXT.SVG_B_S_S_SVG, piece[_CODE_TEXT.RECIPESVG])[1]
        inner = inner[len(definitions) :] if definitions else inner
        rebuilt = rebuilt.replace(_marker % instance[_CODE_TEXT.TOKEN], inner)
    if canonical_svg(rebuilt) != canonical_svg(original):
        raise ValueError(asset[_CODE_TEXT.ID])
    return dict(base=base, pieces=pieces, recipe=dict(version=RESOURCE_SCHEMA[_CODE_TEXT.RECIPEVERSION], decompositionVersion=2, baseId=base_id, pieces=instances))
