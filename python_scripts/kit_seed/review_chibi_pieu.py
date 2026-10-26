import html
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import chibi_design as D

ROOT = Path(D.ROOT)
FONT = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
BACKGROUND = "#1c2029"
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
records = [row for row in manifest["records"] if row["type"] == "character_kit"]
boards = ROOT / "boards"
boards.mkdir(exist_ok=True)
sections = []


def panel(file, label, width=640, crop=(0, 285, 1280, 680)):
    image = Image.open(file).convert("RGB").crop(crop)
    image = image.resize((width, round(image.height * width / image.width)))
    result = Image.new("RGB", (width, image.height + 34), BACKGROUND)
    result.paste(image, (0, 34))
    ImageDraw.Draw(result).text((10, 6), label, font=SMALL, fill="white")
    return result


def board(name, title, rows):
    image = Image.new("RGB", (1280, 44 + sum(row[0].height for row in rows)), BACKGROUND)
    draw = ImageDraw.Draw(image)
    draw.text((12, 10), title, font=FONT, fill="white")
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
    for row in records[start:start + 10]:
        asset = json.loads(Path(row["staged"]).read_text(encoding="utf-8"))
        name = asset["archetype"]
        rows.append([panel(ROOT / "stills" / (row["id"] + "-before.jpg"), name + " · TRƯỚC"), panel(ROOT / "stills" / (row["id"] + "-after.jpg"), name + " · SAU")])
    board("characters-%s.jpg" % (start // 10 + 1), "Đứng / ngồi / quỳ / nằm · So sánh nhân vật", rows)

for key in ("festival_woman", "hmong_woman", "highland_man", "old_woman", "boy", "ghost_woman"):
    rows = [[panel(ROOT / "stills" / (key + "-actions-%s.jpg" % group), ["Đứng · ngồi · quỳ · nằm · giơ tay · chỉ tay", "Đưa · cầm · khấn · sợ · che mặt · cúi chào", "Ngồi xổm · giơ hai tay · đọc · vẫy tay · nghĩ · uống"][group], 1280)] for group in range(3)]
    rows.append([panel(ROOT / "stills" / (key + "-views.jpg"), "Chính diện · quay trái · quay phải · quay lưng", 1280)])
    board(key + ".jpg", key, rows)

panel(ROOT / "stills/festival_woman-actions-0.jpg", "Chibi mới · Đứng / ngồi / quỳ / nằm / giơ tay / chỉ tay", 1280).save(ROOT / "preview.jpg", quality=90, optimize=True)

scene_files = sorted((ROOT / "stills").glob("scene-*.jpg"))
rows = []
for start in range(0, len(scene_files), 2):
    cells = []
    for file in scene_files[start:start + 2]:
        image = Image.open(file).convert("RGB").resize((640, 360))
        cell = Image.new("RGB", (640, 394), BACKGROUND)
        cell.paste(image, (0, 34))
        ImageDraw.Draw(cell).text((10, 6), file.stem, font=SMALL, fill="white")
        cells.append(cell)
    rows.append(cells)
board("scenes.jpg", "Kiểm tư thế trong bối cảnh bằng engine thật", rows)
cells = []
for key in ("fisherman", "festival_woman"):
    row = next(row for row in records if json.loads(Path(row["staged"]).read_text(encoding="utf-8"))["archetype"] == key)
    for suffix, label in (("before", "TRƯỚC"), ("after", "SAU")):
        cells.append(panel(ROOT / "stills" / (row["id"] + "-" + suffix + ".jpg"), key + " · " + label, 320, (60, 290, 290, 660)))
board("lower-body-comparison.jpg", "Thân dưới khép gọn · Bỏ khe chân và hai bàn chân rời", [cells])
page = '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Chibi Khăn Piêu</title><style>body{margin:24px;background:#161a22;color:#eee;font:16px system-ui}section{max-width:1280px;margin:30px auto}img{width:100%;height:auto}a{color:#cde3ff}</style><h1>Chibi theo mẫu Khăn Piêu</h1><p>59 nhân vật, ba góc quay và quay lưng, các tư thế minh họa tĩnh. Ảnh do engine Video Motion dựng.</p>'
for name, title in sections:
    page += '<section><h2>%s</h2><a href="boards/%s"><img loading="lazy" src="boards/%s"></a></section>' % (html.escape(title), name, name)
(ROOT / "index.html").write_text(page + "</html>", encoding="utf-8")
print(json.dumps(dict(boards=len(sections), characters=len(records))))
