import argparse
import html
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from illustration_texts import IllustrationText as I


def boards(rows, output, group, columns, per_page, width, image_height):
    font = ImageFont.truetype(I.FONT, 16)
    sections = []
    for page, start in enumerate(range(0, len(rows), per_page), 1):
        selected = rows[start:start + per_page]
        height = image_height + 58
        sheet = Image.new("RGB", (width * columns, height * ((len(selected) + columns - 1) // columns)), "#20252f")
        draw = ImageDraw.Draw(sheet)
        for index, row in enumerate(selected):
            x, y = (index % columns) * width, (index // columns) * height
            with Image.open(row["file"]) as original:
                image = original.convert("RGB")
                if group == "comparison":
                    image = image.crop((170, 340, 1120, 690))
                image.thumbnail((width, image_height))
                sheet.paste(image, (x + (width - image.width) // 2, y + (image_height - image.height) // 2))
            label = I.BEFORE_LABEL if row["id"].endswith("-before") else I.AFTER_LABEL if row["id"].endswith("-after") else row["type"]
            draw.text((x + 8, y + image_height + 3), label + " · " + row.get("name", "")[:48], font=font, fill="white")
            draw.text((x + 8, y + image_height + 28), row["id"], font=font, fill="#aac5df")
        filename = f"{group}-{page}.jpg"
        sheet.save(output / I.BOARDS / filename, quality=84, optimize=True)
        sections.append(I.GALLERY_SECTION % (group, filename, filename, group))
    return sections


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path(I.ROOT))
    args = parser.parse_args()
    output = args.output
    (output / I.BOARDS).mkdir(parents=True, exist_ok=True)
    rows = json.loads((output / I.REVIEW).read_text(encoding="utf-8"))
    comparisons = json.loads((output / I.COMPARISON).read_text(encoding="utf-8"))
    parts = [I.GALLERY_HEAD % (I.GALLERY_TITLE, I.GALLERY_TITLE, I.GALLERY_NOTE)]
    parts.extend(boards(comparisons, output, "comparison", 2, 12, 800, 300))
    for kind in I.TYPES:
        selected = sorted((row for row in rows if row["type"] == kind), key=lambda row: (row["styleId"], row["id"]))
        parts.extend(boards(selected, output, kind, 4, 28, 400, 225))
    parts.append("<details><summary>Inventory</summary><ul>")
    parts.extend(I.GALLERY_ROW % (html.escape(row["id"]), html.escape(row.get("name", "")), html.escape(row["visualReview"])) for row in rows)
    parts.append("</ul></details></html>")
    (output / I.GALLERY).write_text("".join(parts), encoding="utf-8", newline="\n")
    print(json.dumps(dict(records=len(rows), comparisonImages=len(comparisons), failures=sum(not row["rendered"] for row in rows))))


if __name__ == "__main__":
    main()
