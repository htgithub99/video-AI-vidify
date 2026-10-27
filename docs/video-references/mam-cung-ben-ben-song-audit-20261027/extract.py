from pathlib import Path
import json
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageStat

sys.stdout.reconfigure(encoding="utf-8")
root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
base = root / "storage/output/motion-video"
record = json.loads((base / "productions/53c01d81007bf76dbed7f4ad42f72999.json").read_text(encoding="utf-8-sig"))
result = record["result"]
spec = result["compiled"]["spec"]
video = base / result["rendered"]["fileName"]
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
ffmpeg = "C:/ffmpeg/bin/ffmpeg.exe"
rows = []

def frame(t, file):
    subprocess.run([ffmpeg, "-v", "error", "-ss", str(t), "-i", str(video), "-frames:v", "1", "-q:v", "2", "-y", str(file)], check=True)

for i, scene in enumerate(spec["scenes"], 1):
    start, end = scene["startFrame"] / spec["fps"], scene["endFrame"] / spec["fps"]
    file = out / f"scene-{i:02d}.jpg"
    frame((start + end) / 2, file)
    background = spec["assets"].get(scene.get("backgroundKey"), {})
    rows.append({"index": i, "start": start, "end": end, "sample": (start + end) / 2, "text": scene["text"], "file": file.name, "backgroundKey": scene.get("backgroundKey"), "backgroundDescription": background.get("description"), "scene": scene})

for page in range(3):
    board = Image.new("RGB", (1280, 1410), "#181c22")
    draw = ImageDraw.Draw(board)
    for k, row in enumerate(rows[page * 6:(page + 1) * 6]):
        x, y = (k % 2) * 640, (k // 2) * 470
        img = Image.open(out / row["file"])
        img.thumbnail((640, 360))
        board.paste(img, (x, y + 30))
        draw.text((x + 10, y + 5), f"C{row['index']:02} | {row['start']:.2f}-{row['end']:.2f}s", font=font, fill="white")
        lines, line = [], ""
        for word in row["text"].split():
            next_line = (line + " " + word).strip()
            if draw.textlength(next_line, font=small) > 615:
                lines.append(line)
                line = word
            else:
                line = next_line
        lines.append(line)
        for n, line in enumerate(lines[:4]):
            draw.text((x + 10, y + 394 + n * 18), line, font=small, fill="#eeeeee")
    board.save(out / f"board-{page + 1}.jpg", quality=89, optimize=True)

checks = []
for index in [4, 18]:
    row = rows[index - 1]
    files = [out / f"effect-{index:02d}-{side}.png" for side in [0, 1]]
    times = [row["start"] + 1.3, row["end"] - 1.3]
    for t, file in zip(times, files):
        frame(t, file)
    a, b = [Image.open(file).convert("RGB").crop((0, 0, 1280, 590)) for file in files]
    diff = ImageChops.difference(a, b)
    checks.append({"scene": index, "times": times, "upper590MeanDiff": ImageStat.Stat(diff).mean, "upper590Identical": diff.getbbox() is None})

(out / "timeline.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
(out / "effect-checks.json").write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"video": str(video), "scenes": len(rows), "duration": spec["duration"], "output": str(out), "effects": checks}, ensure_ascii=False))
