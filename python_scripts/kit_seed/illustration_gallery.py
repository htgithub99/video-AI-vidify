if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
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
        selected = rows[start : start + per_page]
        height = image_height + 58
        sheet = Image.new(_CODE_TEXT.RGB, (width * columns, height * ((len(selected) + columns - 1) // columns)), _CODE_TEXT.VALUE_20252F)
        draw = ImageDraw.Draw(sheet)
        for index, row in enumerate(selected):
            x, y = (index % columns) * width, (index // columns) * height
            with Image.open(row[_CODE_TEXT.FILE]) as original:
                image = original.convert(_CODE_TEXT.RGB)
                if group == _CODE_TEXT.COMPARISON:
                    image = image.crop((170, 340, 1120, 690))
                image.thumbnail((width, image_height))
                sheet.paste(image, (x + (width - image.width) // 2, y + (image_height - image.height) // 2))
            label = I.BEFORE_LABEL if row[_CODE_TEXT.ID].endswith(_CODE_TEXT.BEFORE_262BA4) else I.AFTER_LABEL if row[_CODE_TEXT.ID].endswith(_CODE_TEXT.AFTER) else row[_CODE_TEXT.TYPE]
            draw.text((x + 8, y + image_height + 3), label + _CODE_TEXT.SYMBOL_588DA4 + row.get(_CODE_TEXT.NAME, "")[:48], font=font, fill=_CODE_TEXT.WHITE)
            draw.text((x + 8, y + image_height + 28), row[_CODE_TEXT.ID], font=font, fill=_CODE_TEXT.AAC5DF)
        filename = f'{group}{_CODE_TEXT.SYMBOL_3973E0}{page}{_CODE_TEXT.JPG}'
        sheet.save(output / I.BOARDS / filename, quality=84, optimize=True)
        sections.append(I.GALLERY_SECTION % (group, filename, filename, group))
    return sections
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(_CODE_TEXT.OUTPUT, type=Path, default=Path(I.ROOT))
    args = parser.parse_args()
    output = args.output
    (output / I.BOARDS).mkdir(parents=True, exist_ok=True)
    rows = json.loads((output / I.REVIEW).read_text(encoding=_CODE_TEXT.UTF_8))
    comparisons = json.loads((output / I.COMPARISON).read_text(encoding=_CODE_TEXT.UTF_8))
    parts = [I.GALLERY_HEAD % (I.GALLERY_TITLE, I.GALLERY_TITLE, I.GALLERY_NOTE)]
    parts.extend(boards(comparisons, output, _CODE_TEXT.COMPARISON, 2, 12, 800, 300))
    for kind in I.TYPES:
        selected = sorted((row for row in rows if row[_CODE_TEXT.TYPE] == kind), key=lambda row: (row[_CODE_TEXT.STYLEID], row[_CODE_TEXT.ID]))
        parts.extend(boards(selected, output, kind, 4, 28, 400, 225))
    parts.append(_CODE_TEXT.DETAILS_SUMMARY_INVENTORY_SUMMARY_UL)
    parts.extend(I.GALLERY_ROW % (html.escape(row[_CODE_TEXT.ID]), html.escape(row.get(_CODE_TEXT.NAME, "")), html.escape(row[_CODE_TEXT.VISUALREVIEW])) for row in rows)
    parts.append(_CODE_TEXT.UL_DETAILS_HTML)
    (output / I.GALLERY).write_text("".join(parts), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    print(json.dumps(dict(records=len(rows), comparisonImages=len(comparisons), failures=sum(not row[_CODE_TEXT.RENDERED] for row in rows))))
if __name__ == _CODE_TEXT.MAIN:
    main()
