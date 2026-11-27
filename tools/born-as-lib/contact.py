import sys, json
from PIL import Image, ImageDraw
lib = sys.argv[1]
c = json.load(open(f"{lib}/catalog.json"))
names = list(c["items"])
cell, cols = 150, 15
rows = (len(names) + cols - 1) // cols
S = Image.new("RGB", (cell * cols, (cell + 16) * rows), (236, 236, 236))
d = ImageDraw.Draw(S)
for i, n in enumerate(names):
    im = Image.open(f"{lib}/sprites/{n}.png"); im.thumbnail((cell - 10, cell - 10))
    x, y = (i % cols) * cell, (i // cols) * (cell + 16)
    S.paste(im, (x + 5 + (cell - 10 - im.width) // 2, y + 5 + (cell - 10 - im.height)), im)
    d.text((x + 3, y + cell), n.split("__")[1][:22], fill="black")
S.save(f"{lib}/contact_items.jpg", quality=88)
bg = list(c["backgrounds"])
B = Image.new("RGB", (688 * 3, 384 * ((len(bg) + 2) // 3)), "white")
for i, b in enumerate(bg):
    B.paste(Image.open(f"{lib}/bg/{b}.jpg").resize((688, 384)), ((i % 3) * 688, (i // 3) * 384))
B.save(f"{lib}/contact_bg.jpg", quality=85)
print(lib, len(names), len(bg))
