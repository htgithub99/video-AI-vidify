import json, re, os, sys
src = sys.argv[1]
libs = {}
cur = None
lib = None
for line in open(src, encoding="utf-8"):
    line = line.strip()
    if not line:
        continue
    if line.startswith("LIB "):
        lib = line[4:]; libs.setdefault(lib, []); cur = None; continue
    if line.startswith("SHEET "):
        _, sid, kind, era, grid, h = line.split()
        c, r = map(int, grid.split("x"))
        cur = {"id": sid, "kind": kind, "era": era, "cols": c, "rows": r, "heightM": float(h), "items": []}
        libs[lib].append(cur); continue
    if line.startswith("BG "):
        m = re.match(r"BG (\S+) (\S+): (.*)", line)
        libs[lib].append({"id": m[1], "bgs": [[m[1], m[2], m[3]]]}); cur = None; continue
    m = re.match(r"(.*?)\s*@([\d.]+)$", line)
    desc, h = (m[1], float(m[2])) if m else (line, cur["heightM"])
    words = re.sub(r"[^a-z0-9 ]", "", desc.lower().encode("ascii", "ignore").decode()).split()
    stop = {"a", "an", "the", "with", "and", "of", "in", "on", "as", "one", "without", "to", "at", "its", "his", "her", "from"}
    name = "_".join([w for w in words if w not in stop][:5])
    names = [i[0] for i in cur["items"]]
    if name in names:
        name += f"_{len(names)}"
    cur["items"].append([name, h, desc])
q = []
for lib, sheets in libs.items():
    os.makedirs(lib, exist_ok=True)
    json.dump({"sheets": sheets}, open(f"{lib}/sheets_{os.path.basename(src).split('.')[0]}.json", "w"), indent=1, ensure_ascii=False)
    for s in sheets:
        if "bgs" in s:
            q.append([lib, s["id"], 0, 0, s["bgs"][0][2]])
        else:
            q.append([lib, s["id"], s["cols"], s["rows"], "|".join(i[2] for i in s["items"])])
open("queue3.json", "w").write(json.dumps(q, ensure_ascii=False))
print({k: len(v) for k, v in libs.items()}, len(q), len(json.dumps(q, ensure_ascii=False)))
