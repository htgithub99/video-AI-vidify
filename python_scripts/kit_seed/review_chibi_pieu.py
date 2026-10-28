if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import html
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import chibi_design as D
ROOT = Path(D.ROOT)
FONT = ImageFont.truetype(_CODE_TEXT.C_WINDOWS_FONTS_ARIAL_TTF, 20)
SMALL = ImageFont.truetype(_CODE_TEXT.C_WINDOWS_FONTS_ARIAL_TTF, 16)
BACKGROUND = _CODE_TEXT.VALUE_1C2029
manifest = json.loads((ROOT / _CODE_TEXT.MANIFEST_JSON).read_text(encoding=_CODE_TEXT.UTF_8))
records = [row for row in manifest[_CODE_TEXT.RECORDS] if row[_CODE_TEXT.TYPE] == _CODE_TEXT.CHARACTER_KIT]
boards = ROOT / _CODE_TEXT.BOARDS
boards.mkdir(exist_ok=True)
sections = []
def panel(file, label, width=640, crop=(0, 285, 1280, 680)):
    image = Image.open(file).convert(_CODE_TEXT.RGB).crop(crop)
    image = image.resize((width, round(image.height * width / image.width)))
    result = Image.new(_CODE_TEXT.RGB, (width, image.height + 34), BACKGROUND)
    result.paste(image, (0, 34))
    ImageDraw.Draw(result).text((10, 6), label, font=SMALL, fill=_CODE_TEXT.WHITE)
    return result
def board(name, title, rows):
    image = Image.new(_CODE_TEXT.RGB, (1280, 44 + sum(row[0].height for row in rows)), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.text((12, 10), title, font=FONT, fill=_CODE_TEXT.WHITE)
    y = 44
    for row in rows:
        x = 0
        for cell in row:
            image.paste(cell, (x, y))
            x += cell.width
        y += row[0].height
    image.save(boards / name, quality=89, optimize=True)
    sections.append((name, title))
for start in range(0, len(records), 10):
    rows = []
    for row in records[start : start + 10]:
        asset = json.loads(Path(row[_CODE_TEXT.STAGED]).read_text(encoding=_CODE_TEXT.UTF_8))
        name = asset[_CODE_TEXT.ARCHETYPE]
        rows.append([panel(ROOT / _CODE_TEXT.STILLS / (row[_CODE_TEXT.ID] + _CODE_TEXT.BEFORE_JPG), name + _CODE_TEXT.TR_C), panel(ROOT / _CODE_TEXT.STILLS / (row[_CODE_TEXT.ID] + _CODE_TEXT.AFTER_JPG), name + _CODE_TEXT.SAU)])
    board(_CODE_TEXT.CHARACTERS_S_JPG % (start // 10 + 1), _CODE_TEXT.NG_NG_I_QU_N_M_SO_S_NH_NH_N_V_T, rows)
for key in (_CODE_TEXT.FESTIVAL_WOMAN, _CODE_TEXT.HMONG_WOMAN, _CODE_TEXT.HIGHLAND_MAN, _CODE_TEXT.OLD_WOMAN, _CODE_TEXT.BOY, _CODE_TEXT.GHOST_WOMAN):
    rows = [[panel(ROOT / _CODE_TEXT.STILLS / (key + _CODE_TEXT.ACTIONS_S_JPG % group), [_CODE_TEXT.NG_NG_I_QU_N_M_GI_TAY_CH_TAY, _CODE_TEXT.A_C_M_KH_N_S_CHE_M_T_C_I_CH_O, _CODE_TEXT.NG_I_X_M_GI_HAI_TAY_C_V_Y_TAY_NGH_U_NG][group], 1280)] for group in range(3)]
    rows.append([panel(ROOT / _CODE_TEXT.STILLS / (key + _CODE_TEXT.VIEWS_JPG), _CODE_TEXT.CH_NH_DI_N_QUAY_TR_I_QUAY_PH_I_QUAY_L_NG, 1280)])
    board(key + _CODE_TEXT.JPG, key, rows)
panel(ROOT / _CODE_TEXT.STILLS_FESTIVAL_WOMAN_ACTIONS_0_JPG, _CODE_TEXT.CHIBI_M_I_NG_NG_I_QU_N_M_GI_TAY_CH_TAY, 1280).save(ROOT / _CODE_TEXT.PREVIEW_JPG, quality=90, optimize=True)
scene_files = sorted((ROOT / _CODE_TEXT.STILLS).glob(_CODE_TEXT.SCENE_JPG))
rows = []
for start in range(0, len(scene_files), 2):
    cells = []
    for file in scene_files[start : start + 2]:
        image = Image.open(file).convert(_CODE_TEXT.RGB).resize((640, 360))
        cell = Image.new(_CODE_TEXT.RGB, (640, 394), BACKGROUND)
        cell.paste(image, (0, 34))
        ImageDraw.Draw(cell).text((10, 6), file.stem, font=SMALL, fill=_CODE_TEXT.WHITE)
        cells.append(cell)
    rows.append(cells)
board(_CODE_TEXT.SCENES_JPG, _CODE_TEXT.KI_M_T_TH_TRONG_B_I_C_NH_B_NG_ENGINE_TH_T, rows)
cells = []
for key in (_CODE_TEXT.FISHERMAN, _CODE_TEXT.FESTIVAL_WOMAN):
    row = next(row for row in records if json.loads(Path(row[_CODE_TEXT.STAGED]).read_text(encoding=_CODE_TEXT.UTF_8))[_CODE_TEXT.ARCHETYPE] == key)
    for suffix, label in ((_CODE_TEXT.BEFORE, _CODE_TEXT.TR_C_E63210), (_CODE_TEXT.AFTER_F39592, _CODE_TEXT.SAU_233B92)):
        cells.append(panel(ROOT / _CODE_TEXT.STILLS / (row[_CODE_TEXT.ID] + _CODE_TEXT.SYMBOL_3973E0 + suffix + _CODE_TEXT.JPG), key + _CODE_TEXT.SYMBOL_588DA4 + label, 320, (60, 290, 290, 660)))
board(_CODE_TEXT.LOWER_BODY_COMPARISON_JPG, _CODE_TEXT.TH_N_D_I_KH_P_G_N_B_KHE_CH_N_V_HAI_B_N_CH_N_R_I, [cells])
page = _CODE_TEXT.DOCTYPE_HTML_HTML_LANG_VI_META_CHARSET_UTF_8_TITLE_CHIBI_KH_
for name, title in sections:
    page += _CODE_TEXT.SECTION_H2_S_H2_A_HREF_BOARDS_S_IMG_LOADING_LAZY_SRC_BOARDS_ % (html.escape(title), name, name)
(ROOT / _CODE_TEXT.INDEX_HTML).write_text(page + _CODE_TEXT.HTML, encoding=_CODE_TEXT.UTF_8)
print(json.dumps(dict(boards=len(sections), characters=len(records))))
