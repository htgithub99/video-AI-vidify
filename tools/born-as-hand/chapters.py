import json, sys
for v in sys.argv[1:]:
    st = json.load(open(f"voice/{v}/timing.json"))["starts"]
    i, out = 0, [("0:00", "Intro")]
    for line in open(f"{v}.txt", encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            s = st[i]
            out.append((f"{int(s//60)}:{int(s%60):02d}", line.lstrip("# ").strip()))
        else:
            i += 1
    print(v, round(json.load(open(f"voice/{v}/timing.json"))["total"]), out)
