if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import html
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from folk_blocking_texts import FolkText as F
ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding=_CODE_TEXT.UTF_8))
REPORT = ROOT / CATALOG[_CODE_TEXT.REPORT] / _CODE_TEXT.VERIFICATION_JSON
OUTPUT = ROOT / CATALOG[_CODE_TEXT.GALLERY]
FONT = ImageFont.truetype(_CODE_TEXT.C_WINDOWS_FONTS_ARIAL_TTF, 20)
TITLE = ImageFont.truetype(_CODE_TEXT.C_WINDOWS_FONTS_ARIAL_TTF, 26)
def main():
    report = json.loads(REPORT.read_text(encoding=_CODE_TEXT.UTF_8))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sections = []
    for sid in dict.fromkeys(row[_CODE_TEXT.STYLEID] for row in report[_CODE_TEXT.CASES]):
        for mode in (_CODE_TEXT.DAY, _CODE_TEXT.NIGHT, _CODE_TEXT.ASSETS):
            rows = [row for row in report[_CODE_TEXT.CASES] if row[_CODE_TEXT.STYLEID] == sid and ((row[_CODE_TEXT.KEY] == _CODE_TEXT.ASSETS) if mode == _CODE_TEXT.ASSETS else (row[_CODE_TEXT.KEY] != _CODE_TEXT.ASSETS and row[_CODE_TEXT.TIME] == mode))]
            for page in range(math.ceil(len(rows) / 8)):
                selected = rows[page * 8 : (page + 1) * 8]
                sheet = Image.new(_CODE_TEXT.RGB, (1280, 60 + math.ceil(len(selected) / 2) * 420), _CODE_TEXT.E5DFD4)
                draw = ImageDraw.Draw(sheet)
                title = F.PLOT_TITLE % (sid, mode)
                draw.text((15, 16), title, fill=_CODE_TEXT.VALUE_24211F, font=TITLE)
                for n, row in enumerate(selected):
                    x, y = n % 2 * 640, 60 + n // 2 * 420
                    with Image.open(row[_CODE_TEXT.FILE]) as im:
                        sheet.paste(im.resize((640, 360), Image.Resampling.LANCZOS), (x, y))
                    label = row[_CODE_TEXT.NAME] if mode != _CODE_TEXT.ASSETS else row[_CODE_TEXT.ID]
                    draw.text((x + 12, y + 365), label[:62], fill=_CODE_TEXT.VALUE_24211F, font=FONT)
                    draw.text((x + 12, y + 389), row[_CODE_TEXT.KEY], fill=_CODE_TEXT.VALUE_4C4439, font=FONT)
                name = sid + _CODE_TEXT.SYMBOL_3973E0 + mode + _CODE_TEXT.SYMBOL_3973E0 + str(page + 1) + _CODE_TEXT.JPG
                sheet.save(OUTPUT / name, quality=86, optimize=True)
                sections.append(_CODE_TEXT.A_HREF_S_IMG_LOADING_LAZY_SRC_S_ALT_S_A % (name, name, html.escape(title)))
    document = _CODE_TEXT.DOCTYPE_HTML_HTML_LANG_VI_META_CHARSET_UTF_8_TITLE_KHO_B_C_C % (report[_CODE_TEXT.CHECKS], report[_CODE_TEXT.STILLS], "".join(sections))
    (OUTPUT / _CODE_TEXT.INDEX_HTML).write_text(document, encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    coverage = []
    for folder in sorted((ROOT / F.REFERENCES).glob(_CODE_TEXT.VALUE_0_9_0_9)):
        source = json.loads((folder / _CODE_TEXT.INDEX_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
        mapped = {kind: [row[_CODE_TEXT.KEY] for row in CATALOG[kind] if source[_CODE_TEXT.ID] in row.get(_CODE_TEXT.SOURCES, [])] for kind in (_CODE_TEXT.SCENES, _CODE_TEXT.PROPS, _CODE_TEXT.CHARACTERS)}
        coverage.append(dict(id=source[_CODE_TEXT.ID], title=source[_CODE_TEXT.TITLE], reference=str(folder.relative_to(ROOT)), captureStatus=source.get(_CODE_TEXT.STATUS), frames=len(source.get(_CODE_TEXT.FRAMES, [])), reviewScope=F.REVIEW, exhaustiveSceneInventory=False, resources=mapped))
    (OUTPUT / F.COVERAGE).write_text(json.dumps(dict(pack=CATALOG[_CODE_TEXT.PACK], originalArtwork=True, videos=coverage, extensions={kind: [row[_CODE_TEXT.KEY] for row in CATALOG[kind] if row.get(_CODE_TEXT.EXTENSION)] for kind in (_CODE_TEXT.SCENES, _CODE_TEXT.PROPS, _CODE_TEXT.CHARACTERS)}), ensure_ascii=False, indent=2), encoding=_CODE_TEXT.UTF_8, newline=_CODE_TEXT.SYMBOL_01BA47)
    print(json.dumps(dict(stills=report[_CODE_TEXT.STILLS], boards=len(sections), gallery=str(OUTPUT / _CODE_TEXT.INDEX_HTML))))
if __name__ == _CODE_TEXT.MAIN:
    main()
