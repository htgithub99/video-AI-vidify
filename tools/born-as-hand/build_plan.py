import json, os, sys, importlib, shutil, subprocess
sys.path.insert(0, "/home/claude/four")
import beats_lib

ROOT = "/home/claude/four"
KIT = "/home/claude/kitv2"
video = sys.argv[1]
SERIES = {"jesse": "JESSE JAMES · WILD WEST", "redbaron": "THE RED BARON · WW1", "spartacus": "SPARTACUS · ROME", "sherlock": "SHERLOCK HOLMES", "audie": "AUDIE MURPHY · WW2", "billy": "BILLY THE KID · WILD WEST", "musashi": "MIYAMOTO MUSASHI", "caesar": "JULIUS CAESAR · ROME"}
LOOK = {"jesse": "wildwest", "billy": "wildwest", "redbaron": "ww", "audie": "ww", "spartacus": "ancient", "caesar": "ancient", "musashi": "eastasia", "sherlock": "victorian"}
ART = {"musashi": "anime", "sherlock": "anime"}
WALL = {"shrike", "sampler", "antlers", "lewis_gun", "cups_shelf", "auto_261125_09cb9f_10__wall_picture_frame_landscape"}
TABLE = {"medal", "magazine", "letter", "newspaper", "tintype", "list", "book", "silver_cup", "coins", "telegraph_key", "dna_vial", "cleaver", "meat_spit", "wax_bust", "violin", "blue_max"}
HEAD_MIN_W = 0.05
HEAD_H = 0.15
LYING = ("wounded", "fallen", "lying", "sleep", "student_bed", "_lie", "dead", "lying_dead")

lines = [l["text"] for l in json.load(open(f"{ROOT}/born4_lines.json"))[video]]
chapters = []
prev = None
n = 0
for l in open(f"{ROOT}/{video}.txt"):
    l = l.strip()
    if not l:
        continue
    if l.startswith("#"):
        prev = l[1:].strip()
        continue
    n += 1
    if prev and prev not in ("HOOK", "Recap"):
        chapters.append((n, prev))
    prev = None
words = json.load(open(f"{ROOT}/voice/{video}/words.json"))
beats_lib.BEATS.clear()
beats_lib.ALIAS.clear()
importlib.import_module(f"beats_{video}")
import beats_rot
print("rotation", beats_rot.rotate(video, beats_lib.BEATS))
tmp = f"{ROOT}/voice/{video}/plan_beats.json"
turn = next(i + 1 for i, t in enumerate(lines) if t.startswith("But right now?"))
beats_lib.build(video, lines, chapters, words, SERIES[video], tmp, turn)
plan = json.load(open(tmp))
used = sorted({c["sprite"] for b in plan["beats"] for c in b["cast"]} | {s["sprite"] for b in plan["beats"] for c in b["cast"] for s in c["swap"]})
bgs = sorted({b["bg"] for b in plan["beats"] if b.get("bg")} | {g for b in plan["beats"] for g in b.get("montage", {}).get("bgs", [])})

assets = f"{ROOT}/assets/{video}"
lib = {}
for l in ("wildwest", "ww", "ancient", "eastasia"):
    p = f"{ROOT}/lib/{l}/catalog.json"
    if os.path.exists(p):
        c = json.load(open(p))
        for k, v in c["items"].items():
            lib[k] = (l, v)
new = json.load(open(f"{assets}/new_meta.json"))
sprites = {}
missing = []
measure_in = []
for s in used:
    if s in new:
        sprites[s] = {"kind": new[s]["kind"], "heightM": new[s]["heightM"], "ann": {"facing": new[s].get("facing", "r")}}
        measure_in.append({"name": s, "png": f"{assets}/png/{s}.png", "kind": new[s]["kind"]})
    elif s in lib:
        l, v = lib[s]
        shutil.copyfile(f"{ROOT}/lib/{l}/sprites/{s}.png", f"{assets}/png/{s}.png")
        sprites[s] = {"kind": v["kind"], "heightM": v["heightM"], "ann": dict(v.get("ann") or {})}
        sprites[s]["ann"].setdefault("facing", v.get("facing", "r"))
        sprites[s]["ann"].setdefault("place", "ground")
        sprites[s]["ann"].setdefault("is", s.split("__")[-1].replace("_", " "))
        if not sprites[s]["ann"].get("foot"):
            measure_in.append({"name": s, "png": f"{assets}/png/{s}.png", "kind": v["kind"]})
    else:
        missing.append(s)
if measure_in:
    json.dump(measure_in, open(f"{assets}/m_in.json", "w"))
    subprocess.run(f"cd {KIT} && python3 annotate.py measure {assets}/m_in.json {assets}/m_out.json", shell=True, check=True, capture_output=True)
    m = json.load(open(f"{assets}/m_out.json"))
    for s, v in m.items():
        a = sprites[s].setdefault("ann", {})
        for k in ("aspect", "foot", "pad", "face", "mouth"):
            if k in v:
                a[k] = v[k]
        if s in new and sprites[s]["kind"] == "person" and not any(w in s for w in LYING + ("bust", "ride", "sit", "climb", "baby")):
            import numpy as np
            from PIL import Image
            al = np.asarray(Image.open(f"{assets}/png/{s}.png").convert("RGBA"))[..., 3] > 128
            hh, ww = al.shape
            rows = np.where(al.sum(1) >= hh * HEAD_MIN_W)[0]
            t0 = int(rows[0]) if len(rows) else 0
            body = hh - t0
            band = al[t0 : t0 + max(1, int(body * 0.08))]
            cols = np.where(band.any(0))[0]
            cx = (cols.min() + cols.max()) / 2 if len(cols) else ww / 2
            hw = body * 0.065
            fb = (t0 + body * HEAD_H) / hh
            a["face"] = {"l": round(max(0, cx - hw) / ww, 4), "r": round(min(ww, cx + hw) / ww, 4), "t": round(t0 / hh, 4), "b": round(fb, 4)}
            a["mouth"] = [round(cx / ww, 4), round((t0 + body * 0.11) / hh, 4)]
        a.setdefault("v", 2)
        a.setdefault("facing", "r")
        a["place"] = "wall" if s in WALL else "table" if s in TABLE else a.get("place", "ground")
        a["is"] = ("lying flat " if any(w in s for w in LYING) else "") + s.replace("_", " ")
        for k in ("text", "double", "cut", "mismatch", "partial", "aims"):
            a.setdefault(k, False)
        a["aims"] = any(w in s for w in ("aim", "rifle", "_fire", "throw", "gunner", "moran"))
bgcat = {}
for l in ("wildwest", "ww", "ancient", "eastasia"):
    p = f"{ROOT}/lib/{l}/catalog.json"
    if os.path.exists(p):
        bgcat.update(json.load(open(p))["backgrounds"])
over = json.load(open(f"{ROOT}/bgs/override.json"))
hz = json.load(open(f"{ROOT}/bgs/horizon.json"))
newbg = json.load(open(f"{ROOT}/bgs/new_ann.json")) if os.path.exists(f"{ROOT}/bgs/new_ann.json") else {}
bgAnn, ground, bgDesc = {}, {}, {}
for b in bgs:
    if b in newbg:
        a = dict(newbg[b])
        desc = a.pop("desc", b)
    elif b in bgcat:
        a = dict(bgcat[b]["ann"])
        desc = bgcat[b].get("desc", b)
        o = over.get(b, {})
        if "ground" in o:
            a["ground"] = o["ground"]
            a["spots"] = [[x, o["ground"][min(2, x // 640)], 0] for x in (260, 560, 860, 1160, 1460, 1700)]
        h = o.get("horizon", (hz.get(b) or {}).get("horizon"))
        if h is not None and (hz.get(b) or {}).get("conf", 0) < 0.45 and "horizon" not in o:
            h = None
        if h is not None:
            a["horizon"] = h
            sc = lambda y: round(max(60, (y - h) * 1.75 / 1.6))
            a["person"] = [sc(y) for y in a["ground"]]
            a["spots"] = [[s[0], s[1], sc(s[1])] for s in a["spots"]]
        a["v"] = 6
    else:
        missing.append(b)
        continue
    bgAnn[b] = a
    ground[b] = a["ground"][1]
    bgDesc[b] = desc
    src = f"{ROOT}/bgs/{b}.png"
    if os.path.exists(src):
        shutil.copyfile(src, f"{ROOT}/render/{video}/{b}.png") if os.path.isdir(f"{ROOT}/render/{video}") else None
if missing:
    print(json.dumps({"missing": missing}))
plan.update({"pxPerM": 240, "ground": ground, "bgDesc": bgDesc, "sprites": sprites, "bgAnn": bgAnn})
plan.update({"look": LOOK[video], "art": ART.get(video, ""), "words": words})
json.dump(plan, open(f"{ROOT}/voice/{video}/plan.json", "w"), ensure_ascii=False)
actors = [s for s, v in sprites.items() if "__" not in s and v["kind"] in ("person", "bust")]
json.dump({"actor": "^(" + "|".join(actors) + ")$", "facing": {s: v["ann"]["facing"] for s, v in sprites.items() if v.get("ann", {}).get("facing") == "l"}, "faceFix": {}}, open(f"{assets}/catalog.json", "w"))
json.dump({s: v["ann"]["face"] for s, v in sprites.items() if v.get("ann", {}).get("face")}, open(f"{assets}/faces.json", "w"))
print(json.dumps({"beats": len(plan["beats"]), "sprites": len(sprites), "bgs": len(bgAnn), "total": plan["total"]}))
