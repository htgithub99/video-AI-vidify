import json, os, sys, subprocess, shutil
from collections import OrderedDict
KIT = "/home/claude/kitv2"
bad = []
for lib in sys.argv[1:]:
    cat = json.load(open(f"{lib}/catalog.json"))
    sheets = OrderedDict()
    for k, v in cat["items"].items():
        sheets.setdefault(v["sheet"], []).append(k)
    for sid, names in sheets.items():
        raw = f"{lib}/raw/{sid}.jpg"
        subprocess.run(["python3", f"{KIT}/alpha_key.py", raw, f"{lib}/key/{sid}.png"], capture_output=True, check=True)
        os.makedirs("/tmp/rg", exist_ok=True)
        r = json.loads(subprocess.run(["python3", f"{KIT}/sheet_split.py", f"{lib}/key/{sid}.png", f"/tmp/rg/{sid}", str(len(names))], capture_output=True, text=True, check=True).stdout)
        if r["count"] != len(names):
            bad.append((lib, sid, r["count"], len(names)))
            continue
        for f, n in zip(r["files"], names):
            shutil.copy(f, f"{lib}/sprites/{n}.png")
print("mismatch", bad)
