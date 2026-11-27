import glob
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

READABLE = (0.34, 0.6)
PER_SHEET = 12
TILE = (640, 360)


def main():
    root, out, ref = sys.argv[1], sys.argv[2], sys.argv[3]
    only = set(sys.argv[4:])
    person = Image.open(ref).convert("RGBA")
    person = person.crop(person.getbbox())
    font = ImageFont.load_default()
    items = []
    for cat in sorted(glob.glob(os.path.join(root, "*", "catalog.json"))):
        lib = os.path.basename(os.path.dirname(cat))
        for name, bg in json.load(open(cat, encoding="utf8"))["backgrounds"].items():
            files = glob.glob(os.path.join(root, lib, "bg", f"{name}.*"))
            if files and (not only or name in only):
                items.append((lib, name, files[0], bg.get("ann") or {}))
    os.makedirs(out, exist_ok=True)
    for k in range(0, len(items), PER_SHEET):
        sheet = Image.new("RGB", (TILE[0] * 3, TILE[1] * 4))
        for i, (lib, name, path, ann) in enumerate(items[k : k + PER_SHEET]):
            im = Image.open(path).convert("RGB").resize((1920, 1080))
            for x, y, h in ann.get("spots") or []:
                h = int(min(max(h, 1080 * READABLE[0]), 1080 * READABLE[1]))
                w = int(person.width * h / person.height)
                fig = person.resize((w, h))
                im.paste(fig, (int(x - w / 2), int(y - h)), fig)
            if ann.get("horizon") is not None:
                ImageDraw.Draw(im).line([(0, ann["horizon"]), (1920, ann["horizon"])], fill=(255, 0, 0), width=4)
            tile = im.resize(TILE)
            ImageDraw.Draw(tile).text((8, 8), f"{k + i} {lib}/{name}", fill=(255, 255, 0), font=font)
            sheet.paste(tile, ((i % 3) * TILE[0], (i // 3) * TILE[1]))
        sheet.save(os.path.join(out, f"scale_{k // PER_SHEET:02d}.jpg"), quality=82)
    print(json.dumps({"backgrounds": len(items), "sheets": (len(items) + PER_SHEET - 1) // PER_SHEET}))


main()
