from seed_texts import SeedText as KST
import html
import json
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / KST.SCRATCH_FIXED_LIBRARY_20261022_VERIFICATION_REPORT_JSON
OUTPUT = ROOT / KST.DOCS_VIDEO_REFERENCES_FIXED_LIBRARY_LABEL
STYLES = {KST.MINIMAL_MASK: KST.TOI_GIAN_MAT_NA, KST.CHIBI_FOLK: KST.CHIBI_MAU_DAN_GIAN}
FONT = KST.C_WINDOWS_FONTS_ARIAL_TTF
SIZE = (640, 360)
FONT_TITLE = ImageFont.truetype(FONT, 26)
FONT_CAPTION = ImageFont.truetype(FONT, 19)
def wrap(draw, text, width):
    lines = []
    current = KST.EMPTY
    for word in text.split():
        trial = (current + KST.SPACE + word).strip()
        if draw.textlength(trial, font=FONT_CAPTION) > width and current:
            lines.append(current)
            current = word
        else:
            current = trial
    return lines + [current]
def sheet(rows, title, name, columns=3):
    cell_h = SIZE[1] + 100
    result = Image.new(KST.RGB, (columns * SIZE[0], 60 + math.ceil(len(rows) / columns) * cell_h), KST.EEE8DC)
    draw = ImageDraw.Draw(result)
    draw.text((18, 15), title, fill=KST.VALUE_28231F, font=FONT_TITLE)
    for index, row in enumerate(rows):
        x, y = (index % columns * SIZE[0], 60 + index // columns * cell_h)
        with Image.open(row[KST.FILE]) as source:
            result.paste(source.resize(SIZE, Image.Resampling.LANCZOS), (x, y))
        caption = row[KST.TEXT]
        for offset, line in enumerate(wrap(draw, caption, SIZE[0] - 24)):
            if offset > 3:
                break
            draw.text((x + 12, y + SIZE[1] + 8 + offset * 22), line, fill=KST.VALUE_28231F, font=FONT_CAPTION)
    target = OUTPUT / (name + KST.JPG)
    result.save(target, quality=84, optimize=True)
    return target.name
def main():
    report = json.loads(SOURCE.read_text(encoding=KST.UTF_8))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    blocks = []
    for style, label in STYLES.items():
        cases = [row for row in report[KST.CASES] if row[KST.ID].startswith(style + KST.TILDE)]
        for variant, motion in [(0, 0), (1, 0), (0, 1), (1, 1)]:
            rows = [row for row in cases if row[KST.ID].endswith(KST.D_D % (variant, motion))]
            title = label + KST.EM_DASH_SEPARATOR + (KST.BAN_DEM_BAT_CHUYEN_DONG if motion else KST.BAN_NGAY_TAT_CHUYEN_DONG) + (KST.LAT_CANH if variant else KST.EMPTY)
            filename = sheet(rows, title, KST.S_D_D % (style, variant, motion))
            blocks.append(KST.SECTION_H2_S_H2_A_HREF_S_IMG_LOADING_LAZY_SRC_S_ALT_S_A_DETAILS_SUMMARY_LOI % (html.escape(title), filename, filename, html.escape(title), KST.EMPTY.join((KST.LI_A_HREF_S_S_A_LI % (Path(os.path.relpath(row[KST.FILE], OUTPUT)).as_posix(), html.escape(row[KST.TEXT])) for row in rows))))
        previews = [row for row in report[KST.CASES] if row[KST.ID].startswith(style + KST.UNDERSCORE)]
        title = label + KST.VALUE_6_NHAN_VAT_VA_12_DAO_CU_MOI
        filename = sheet(previews, title, style + KST.ASSETS_ARGUMENT, 2)
        blocks.append(KST.SECTION_H2_S_H2_A_HREF_S_IMG_LOADING_LAZY_SRC_S_ALT_S_A_SECTION % (html.escape(title), filename, filename, html.escape(title)))
    document = KST.DOCTYPE_HTML_HTML_LANG_VI_META_CHARSET_UTF_8_META_NAME_VIEWPORT_CONTENT_WIDT % (report[KST.STILLS], KST.EMPTY.join(blocks))
    (OUTPUT / KST.INDEX_HTML).write_text(document, encoding=KST.UTF_8, newline=KST.NEWLINE)
    print(json.dumps({KST.STILLS: report[KST.STILLS], KST.SHEETS: len(blocks), KST.GALLERY: str(OUTPUT / KST.INDEX_HTML)}, ensure_ascii=False))
if __name__ == KST.MAIN:
    main()
