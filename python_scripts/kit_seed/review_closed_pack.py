import json
from collections import Counter
from html import escape
from pathlib import Path
from PIL import Image, ImageDraw
from closed_pack_texts import ClosedPackText as K
from seed_utils import SEED_STYLES


def main():
    config = json.loads(Path(__file__).with_name(K.CATALOG).read_text(encoding="utf-8"))
    root = Path(config["report"])
    review = Path(K.REVIEW_DIR)
    review.mkdir(parents=True, exist_ok=True)
    verification = json.loads((root / K.VERIFICATION).read_text(encoding="utf-8"))
    rows = verification["cases"]
    figures = []
    for offset in range(0, len(rows), 8):
        subset = rows[offset : offset + 8]
        sheet = Image.new("RGB", (1304, ((len(subset) + 1) // 2) * 398 + 8), "#ededed")
        draw = ImageDraw.Draw(sheet)
        for index, item in enumerate(subset):
            x, y = 8 + index % 2 * 648, 8 + index // 2 * 398
            sheet.paste(Image.open(item["file"]).convert("RGB").resize((640, 360)), (x, y))
            draw.text((x + 5, y + 363), item["key"][:93], fill="black")
        name = K.SHEET % (offset // 8 + 1)
        sheet.save(review / name, quality=87, optimize=True)
        figures.append(K.FIGURE % (name, name))
    assets = {}
    for directory in (Path(config["library"]), Path(config["staging"])):
        for kind in ("style_pack", "character_kit", "prop", "set", "set_base", "set_piece"):
            for file in (directory / kind).glob("*.json"):
                item = json.loads(file.read_text(encoding="utf-8"))
                if item.get("styleId", item["id"]) in SEED_STYLES.values() and item.get("catalogStatus") != K.QUARANTINED and ("seed" in item.get("tags", []) or item.get("source") == "seed" or kind == "style_pack"):
                    assets[item["id"]] = item
    styles = {}
    for name, identifier in SEED_STYLES.items():
        selected = [item for item in assets.values() if item.get("styleId", item["id"]) == identifier]
        kinds = Counter(comp["kind"] for item in selected if item["type"] == "set" for comp in item.get("compositions", []))
        styles[name] = dict(counts=dict(Counter(item["type"] for item in selected)), interactionFamilies=sorted(kinds), sceneDesigns=len({item["tags"][0] for item in selected if item["type"] == "set"}))
    reference = json.loads(Path(K.REFERENCE_COVERAGE).read_text(encoding="utf-8"))
    data = dict(styles=styles, addedDesigns=dict(scenes=len(config["scenes"]), props=len(config["props"]), pieces=6), verification={key: verification[key] for key in ("checks", "stills", "aiCalls")}, sources=reference["videos"], exhaustiveSourceSceneReview=False, cases=[{key: value for key, value in row.items() if key not in ("file", "frame")} for row in rows])
    (review / K.COVERAGE).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    metrics = K.METRICS % (verification["checks"], verification["stills"], verification["aiCalls"])
    (review / K.INDEX).write_text(K.FORMAT % (escape(K.TITLE), escape(K.TITLE), escape(K.INTRO), escape(metrics), escape(K.SOURCE_NOTE), "".join(figures)), encoding="utf-8", newline="\n")
    print(json.dumps(dict(sheets=len(figures), styles=styles)))


if __name__ == "__main__":
    main()
