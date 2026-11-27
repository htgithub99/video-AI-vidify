import json, sys, os
sys.path.insert(0, "/home/claude/kitv2")
from annotate import free_zones

ROOT = "/home/claude/four"
spec = json.load(open(f"{ROOT}/bgs/new_spec.json"))
out = json.load(open(f"{ROOT}/bgs/new_ann.json")) if os.path.exists(f"{ROOT}/bgs/new_ann.json") else {}
for name, s in spec.items():
    h = s["horizon"]
    g = s["ground"]
    sc = lambda y: round(max(60, (y - h) * 1.75 / 1.6))
    xs = s.get("xs", [240, 520, 800, 1100, 1400, 1680])
    gy = lambda x: g[0] + (g[1] - g[0]) * min(1, x / 960) if x < 960 else g[1] + (g[2] - g[1]) * (x - 960) / 960
    spots = [[x, round(gy(x)), sc(gy(x))] for x in xs]
    out[name] = {"v": 6, "ground": g, "person": [sc(y) for y in g], "horizon": h, "spots": spots, "walls": s.get("walls", []), "table": s.get("table"), "water": s.get("water"),
                 "free": free_zones(f"{ROOT}/bgs/{name}.png"), "seats": s.get("seats", []), "rails": s.get("rails"), "boats": s.get("boats"), "desc": s.get("desc", name)}
json.dump(out, open(f"{ROOT}/bgs/new_ann.json", "w"), indent=0)
print(len(out))
