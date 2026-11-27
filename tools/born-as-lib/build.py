import json, os, sys, glob, shutil, subprocess
from PIL import Image

lib, sheets_file = sys.argv[1], sys.argv[2]
KIT = "/home/claude/kitv2"
os.chdir(lib)
for d in ("key", "items", "sprites", "bg", "raw"):
    os.makedirs(d, exist_ok=True)
cat = json.load(open("catalog.json")) if os.path.exists("catalog.json") else {"style": "bold cartoon, thick black outlines, flat cel shading", "items": {}, "backgrounds": {}}
report = []
for s in json.load(open(sheets_file))["sheets"]:
    if "bgs" in s:
        for bid, era, _ in s["bgs"]:
            if os.path.exists(f"raw/{bid}.jpg"):
                shutil.copy(f"raw/{bid}.jpg", f"bg/{bid}.jpg")
                cat["backgrounds"][bid] = {"era": era, "px": list(Image.open(f"raw/{bid}.jpg").size)}
        continue
    sid = s["id"]
    if not os.path.exists(f"raw/{sid}.jpg"):
        report.append(f"{sid}: missing")
        continue
    subprocess.run(["python3", f"{KIT}/alpha_key.py", f"raw/{sid}.jpg", f"key/{sid}.png"], capture_output=True, check=True)
    for f in glob.glob(f"items/{sid}_*.png"):
        os.remove(f)
    r = json.loads(subprocess.run(["python3", f"{KIT}/sheet_split.py", f"key/{sid}.png", f"items/{sid}", str(len(s["items"]))], capture_output=True, text=True, check=True).stdout)
    items = s.get("splitNames") or [i[0] for i in s["items"]]
    heights = {i[0]: i[1] for i in s["items"]}
    report.append(f"{sid}: {r['count']}/{len(items)}")
    if r["count"] != len(items):
        continue
    for f, n in zip(r["files"], items):
        nm = f"{sid}__{n}"
        shutil.copy(f, f"sprites/{nm}.png")
        cat["items"][nm] = {"sheet": sid, "era": s["era"], "kind": s["kind"], "heightM": heights.get(n, s.get("heightM", 1.0)), "facing": "r", "px": list(Image.open(f).size)}
json.dump(cat, open("catalog.json", "w"), indent=1, ensure_ascii=False)
print("\n".join(report))
print(len(cat["items"]), "items", len(cat["backgrounds"]), "backgrounds")
