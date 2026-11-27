import glob, json, os, shutil, subprocess, sys

ROOT = "/home/claude/four"
KIT = "/home/claude/kitv2"
from beats_rot import HERO
from assets_busts import PRE

import numpy as np
from PIL import Image


def column_cut(key, pre):
    im = np.asarray(Image.open(key).convert("RGBA"))
    a = im[..., 3] > 20
    col = a.sum(0).astype(float)
    W = len(col)
    cuts = [int(lo * W + np.argmin(col[int(lo * W):int(hi * W)])) for lo, hi in ((0.25, 0.42), (0.58, 0.75))]
    out = []
    for i, (x0, x1) in enumerate(zip([0] + cuts, cuts + [W])):
        part = im[:, x0:x1]
        ys, xs = np.where(part[..., 3] > 20)
        f = f"{pre}{i}.png"
        Image.fromarray(part[ys.min():ys.max() + 1, xs.min():xs.max() + 1]).save(f)
        out.append(f)
    return out


video = sys.argv[1]
Q = json.load(open(f"{ROOT}/assets_queue3.json"))[video]
assets = f"{ROOT}/assets/{video}"
work = f"{ROOT}/work3/{video}"
os.makedirs(work, exist_ok=True)
meta = json.load(open(f"{assets}/new_meta.json"))
fix = json.load(open(f"{ROOT}/splitfix.json"))
done = {}
ALIAS = {"jesse": {"robert": ["robert_preacher"], "zerelda": ["zerelda_young", "zerelda_old"], "frank": ["frank_teen"], "bob": ["bob_ford"], "pinkerton": ["pinkerton_throw"]}, "redbaron": {"brown": ["roy_brown"], "may": ["wop_may"]}}.get(video, {})
for sid, job in Q.items():
    src = glob.glob(f"{ROOT}/raw3/{video}/{sid}.png")
    if not src:
        print("missing", sid)
        continue
    key = f"{work}/{sid}_key.png"
    subprocess.run(f"python3 {KIT}/alpha_key.py --edge {src[0]} {key}", shell=True, check=True, capture_output=True)
    out = subprocess.run(f"python3 {KIT}/sheet_split.py {key} {work}/{sid} 3", shell=True, check=True, capture_output=True, text=True).stdout
    files = json.loads(out.strip().splitlines()[-1]).get("files", [])
    if sid in fix:
        files = [files[i] if isinstance(i, int) else f"{work}/{sid}_{i}.png" for i in fix[sid]]
    if len(files) != 3:
        print("COUNT", sid, len(files), "-> column cut")
        files = column_cut(key, f"{work}/{sid}_c")
    age = sid.split("_", 1)[1]
    people = age in ("p1", "p2")
    for n, f in zip(job["names"], files):
        for name in ([f"{a}_b" for a in ALIAS.get(n, [n])] if people else [f"{HERO[video]}_{age}_b_{n}"]):
            shutil.copyfile(f, f"{assets}/png/{name}.png")
            meta[name] = {"kind": "bust", "heightM": 1.0, "new": True, "facing": "l" if people or n == "l" else "r"}
            done[name] = os.path.basename(f)
json.dump(meta, open(f"{assets}/new_meta.json", "w"), indent=1)
print(json.dumps({"busts": len(done)}))
