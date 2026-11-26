import sys
from PIL import Image, ImageDraw, ImageFont

out = sys.argv[1]
files = sys.argv[2:]
tile, pad, cols = 260, 16, 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tile + pad) + pad, rows * (tile + pad + 34) + pad), (235, 235, 235))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arial.ttf", 30)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert("RGBA")
    im.thumbnail((tile, tile))
    x = pad + (i % cols) * (tile + pad)
    y = pad + (i // cols) * (tile + pad + 34)
    draw.rectangle([x, y, x + tile, y + tile], fill=(255, 255, 255))
    sheet.paste(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2), im)
    draw.text((x + 6, y + tile + 2), str(i + 1), fill=(200, 0, 0), font=font)
sheet.save(out, quality=88)
print(out)
