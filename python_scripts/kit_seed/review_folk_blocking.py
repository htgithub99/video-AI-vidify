import html
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from folk_blocking_texts import FolkText as F

ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads(Path(__file__).with_name(F.CATALOG).read_text(encoding="utf-8"))
REPORT = ROOT / CATALOG["report"] / "verification.json"
OUTPUT = ROOT / CATALOG["gallery"]
FONT = ImageFont.truetype("C:/Windows/Fonts/arial.ttf",20)
TITLE = ImageFont.truetype("C:/Windows/Fonts/arial.ttf",26)


def main():
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True,exist_ok=True)
    sections = []
    for sid in dict.fromkeys(row["styleId"] for row in report["cases"]):
        for mode in ("day","night","assets"):
            rows = [row for row in report["cases"] if row["styleId"]==sid and ((row["key"]=="assets") if mode=="assets" else (row["key"]!="assets" and row["time"]==mode))]
            for page in range(math.ceil(len(rows)/8)):
                selected = rows[page*8:(page+1)*8]
                sheet = Image.new("RGB",(1280,60+math.ceil(len(selected)/2)*420),"#e5dfd4")
                draw = ImageDraw.Draw(sheet)
                title = F.PLOT_TITLE % (sid,mode)
                draw.text((15,16),title,fill="#24211f",font=TITLE)
                for n,row in enumerate(selected):
                    x,y = n%2*640,60+n//2*420
                    with Image.open(row["file"]) as im:
                        sheet.paste(im.resize((640,360),Image.Resampling.LANCZOS),(x,y))
                    label = row["name"] if mode!="assets" else row["id"]
                    draw.text((x+12,y+365),label[:62],fill="#24211f",font=FONT)
                    draw.text((x+12,y+389),row["key"],fill="#4c4439",font=FONT)
                name = sid+"-"+mode+"-"+str(page+1)+".jpg"
                sheet.save(OUTPUT/name,quality=86,optimize=True)
                sections.append('<a href="%s"><img loading="lazy" src="%s" alt="%s"></a>' % (name,name,html.escape(title)))
    document = '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kho bố cục truyện dân gian</title><style>body{margin:24px;background:#181b20;color:#eee;font:18px Arial}img{width:100%%;max-width:1280px}a{display:block;margin:24px 0}</style><h1>Kho bố cục truyện dân gian</h1><p>%d lượt kiểm tra nhóm vị trí; %d ảnh dựng trực tiếp từ engine. Ảnh đơn giữ trong scratch, chỉ bảng JPEG được đưa vào tài liệu.</p>%s</html>' % (report["checks"],report["stills"],"".join(sections))
    (OUTPUT/"index.html").write_text(document,encoding="utf-8",newline="\n")
    coverage = []
    for folder in sorted((ROOT/F.REFERENCES).glob("[0-9][0-9]-*")):
        source = json.loads((folder/"index.json").read_text(encoding="utf-8"))
        mapped = {kind:[row["key"] for row in CATALOG[kind] if source["id"] in row.get("sources",[])] for kind in ("scenes","props","characters")}
        coverage.append(dict(id=source["id"],title=source["title"],reference=str(folder.relative_to(ROOT)),captureStatus=source.get("status"),frames=len(source.get("frames",[])),reviewScope=F.REVIEW,exhaustiveSceneInventory=False,resources=mapped))
    (OUTPUT/F.COVERAGE).write_text(json.dumps(dict(pack=CATALOG["pack"],originalArtwork=True,videos=coverage,extensions={kind:[row["key"] for row in CATALOG[kind] if row.get("extension")] for kind in ("scenes","props","characters")}),ensure_ascii=False,indent=2),encoding="utf-8",newline="\n")
    print(json.dumps(dict(stills=report["stills"],boards=len(sections),gallery=str(OUTPUT/"index.html"))))


if __name__ == "__main__":
    main()
