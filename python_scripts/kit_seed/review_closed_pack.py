if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import json
from collections import Counter
from html import escape
from pathlib import Path
from PIL import Image, ImageDraw
from closed_pack_texts import ClosedPackText as K
from seed_utils import SEED_STYLES
def main():
    config = json.loads(Path(__file__).with_name(K.CATALOG).read_text(encoding=_CODE_TEXT.UTF_8))
    root = Path(config[_CODE_TEXT.REPORT])
    review = Path(K.REVIEW_DIR)
    review.mkdir(parents=True, exist_ok=True)
    verification = json.loads((root / K.VERIFICATION).read_text(encoding=_CODE_TEXT.UTF_8))
    rows = verification[_CODE_TEXT.CASES]
    figures = []
    for offset in range(0, len(rows), 8):
        subset = rows[offset : offset + 8]
        sheet = Image.new(_CODE_TEXT.RGB, (1304, ((len(subset) + 1) // 2) * 398 + 8), _CODE_TEXT.EDEDED)
        draw = ImageDraw.Draw(sheet)
        for index, item in enumerate(subset):
            x, y = 8 + index % 2 * 648, 8 + index // 2 * 398
            sheet.paste(Image.open(item[_CODE_TEXT.FILE]).convert(_CODE_TEXT.RGB).resize((640, 360)), (x, y))
            draw.text((x + 5, y + 363), item[_CODE_TEXT.KEY][:93], fill=_CODE_TEXT.BLACK)
        name = K.SHEET % (offset // 8 + 1)
        sheet.save(review / name, quality=87, optimize=True)
        figures.append(K.FIGURE % (name, name))
    assets = {}
    for directory in (Path(config[_CODE_TEXT.LIBRARY]), Path(config[_CODE_TEXT.STAGING])):
        for kind in (_CODE_TEXT.STYLE_PACK, _CODE_TEXT.CHARACTER_KIT, _CODE_TEXT.PROP, _CODE_TEXT.SET, _CODE_TEXT.SET_BASE, _CODE_TEXT.SET_PIECE):
            for file in (directory / kind).glob(_CODE_TEXT.JSON_7C7C35):
                item = json.loads(file.read_text(encoding=_CODE_TEXT.UTF_8))
                if item.get(_CODE_TEXT.STYLEID, item[_CODE_TEXT.ID]) in SEED_STYLES.values() and item.get(_CODE_TEXT.CATALOGSTATUS) != K.QUARANTINED and (_CODE_TEXT.SEED in item.get(_CODE_TEXT.TAGS, []) or item.get(_CODE_TEXT.SOURCE) == _CODE_TEXT.SEED or kind == _CODE_TEXT.STYLE_PACK):
                    assets[item[_CODE_TEXT.ID]] = item
    styles = {}
    for name, identifier in SEED_STYLES.items():
        selected = [item for item in assets.values() if item.get(_CODE_TEXT.STYLEID, item[_CODE_TEXT.ID]) == identifier]
        kinds = Counter(comp[_CODE_TEXT.KIND] for item in selected if item[_CODE_TEXT.TYPE] == _CODE_TEXT.SET for comp in item.get(_CODE_TEXT.COMPOSITIONS, []))
        styles[name] = dict(counts=dict(Counter(item[_CODE_TEXT.TYPE] for item in selected)), interactionFamilies=sorted(kinds), sceneDesigns=len({item[_CODE_TEXT.TAGS][0] for item in selected if item[_CODE_TEXT.TYPE] == _CODE_TEXT.SET}))
    reference = json.loads(Path(K.REFERENCE_COVERAGE).read_text(encoding=_CODE_TEXT.UTF_8))
    data = dict(
        styles=styles,
        addedDesigns=dict(scenes=len(config[_CODE_TEXT.SCENES]), props=len(config[_CODE_TEXT.PROPS]), pieces=6),
        verification={key: verification[key] for key in (_CODE_TEXT.CHECKS, _CODE_TEXT.STILLS, _CODE_TEXT.AICALLS)},
        sources=reference[_CODE_TEXT.VIDEOS],
        exhaustiveSourceSceneReview=False,
        cases=[{key: value for key, value in row.items() if key not in (_CODE_TEXT.FILE, _CODE_TEXT.FRAME)} for row in rows],
    )
    (review / K.COVERAGE).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    metrics = K.METRICS % (verification[_CODE_TEXT.CHECKS], verification[_CODE_TEXT.STILLS], verification[_CODE_TEXT.AICALLS])
    (review / K.INDEX).write_text(K.FORMAT % (escape(K.TITLE), escape(K.TITLE), escape(K.INTRO), escape(metrics), escape(K.SOURCE_NOTE), "".join(figures)), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    print(json.dumps(dict(sheets=len(figures), styles=styles)))
if __name__ == _CODE_TEXT.MAIN:
    main()
