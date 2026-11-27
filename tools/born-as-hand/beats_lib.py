import json, re, sys

BEATS = []
ALIAS = {}


def C(sprite, slot="c", dir=None, place="ground", mv=None, crowd=None, swap=None):
    return {"sprite": ALIAS.get(sprite, sprite), "slot": slot, "dir": dir, "place": place, "mv": mv, "crowd": crowd, "swap": [(ALIAS.get(s, s), l, k) for s, l, k in (swap or [])]}


def B(line, kw=None, bg=None, cast=(), kind="scene", f="wide", cam="push", sub=0, **o):
    BEATS.append({"line": line, "kw": kw, "bg": bg, "cast": list(cast), "kind": kind, "f": f, "cam": cam, "sub": sub, **o})


def tok(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def build(name, lines, chapters, words, series, out, turn_line, total_pad=1.5):
    def at(line, kw):
        w = words[line - 1]
        if not kw:
            return w[0][0]
        k = tok(kw)
        for x in w:
            if tok(x[2]).startswith(k):
                return x[0]
        raise SystemExit(f"{name}: word '{kw}' not in line {line}: {lines[line-1]}")

    def ref(r, line, t0):
        if r is None or r is True:
            return t0
        if isinstance(r, tuple):
            return max(t0, at(*r))
        return max(t0, at(line, r))

    beats = []
    for b in BEATS:
        t0 = 0.0 if not beats else at(b["line"], b["kw"])
        L = b["line"]
        cast = []
        for c in b["cast"]:
            cc = {"sprite": c["sprite"], "slot": c["slot"], "place": c["place"], "swap": [{"sprite": s, "t": round(at(l, k), 3)} for s, l, k in c["swap"]]}
            if c["dir"]:
                cc["dir"] = c["dir"]
            if c["mv"]:
                cc["move"] = c["mv"]
            if c["crowd"]:
                cc["crowd"] = c["crowd"]
            cast.append(cc)
        x = {"t0": round(t0, 3), "kind": b["kind"], "bg": b["bg"], "cast": cast, "subject": b["sub"], "frame": b["f"], "cam": b["cam"], "keep": True}
        if "tag" in b:
            t = b["tag"]
            x["tag"] = {"text": t[0], "sub": t[1], "corner": "tl", "t": round(ref(t[2] if len(t) > 2 else None, L, t0), 3)}
        if "plate" in b:
            p = b["plate"]
            x["plate"] = {"text": p[0], "sub": p[1], "at": p[2], "t": round(ref(p[3] if len(p) > 3 else None, L, t0), 3)}
        if "label" in b:
            p = b["label"]
            x["label"] = {"text": p[0], "sub": p[1], "cast": p[2], "t": round(ref(p[3] if len(p) > 3 else None, L, t0), 3)}
        if "bubble" in b:
            p = b["bubble"]
            x["bubble"] = {"text": p[0], "cast": p[1], "t": round(ref(p[2] if len(p) > 2 else None, L, t0), 3)}
        for k in ("focus", "flash", "shake"):
            if k in b:
                x[{"focus": "focusT", "flash": "flash", "shake": "shake"}[k]] = round(ref(b[k], L, t0), 3)
        for k in ("dark", "blur"):
            if k in b:
                x[k] = b[k]
        for k in ("warm", "cool", "smoke"):
            if b.get(k):
                x[k] = True
        if "paper" in b:
            x["paper"] = {"lines": [{"text": p[0], "size": p[1], "t": round(ref(p[2] if len(p) > 2 else None, L, t0), 3)} for p in b["paper"]]}
            if "stamp" in b:
                s = b["stamp"]
                x["paper"]["stamp"] = {"text": s[0], "t": round(ref(s[1] if len(s) > 1 else None, L, t0), 3)}
        if "montage" in b:
            bgs, caps = b["montage"]
            x["montage"] = {"bgs": bgs, "caps": caps, "capT": [round(t0 + 0.3 + i * 0.6, 3) for i in range(len(bgs))]}
        if b.get("end"):
            x["endCard"] = {"text": "WHO SHOULD BE NEXT?", "sub": "Drop a name in the comments", "t": round(ref(b["end"], L, t0), 3)}
        beats.append(x)
    roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"]
    for n, (line, title) in enumerate(chapters):
        start = words[line - 1][0][0]
        t0 = round(start - 1.8 - 0.15, 3)
        for b in beats:
            if t0 <= b["t0"] < start:
                b["t0"] = start
        beats.append({"t0": t0, "kind": "chapter", "cast": [], "subject": 0, "frame": "wide", "cam": "push", "chapter": {"label": f"CHAPTER {roman[n]}", "title": title}})
    beats.sort(key=lambda b: b["t0"])
    seen = set()
    uniq = []
    for b in beats:
        if b["t0"] in seen:
            raise SystemExit(f"{name}: two beats at {b['t0']}")
        seen.add(b["t0"])
        uniq.append(b)
    total = words[-1][-1][1] + total_pad
    recap = next((b["t0"] for b in uniq if b["kind"] == "montage"), total * 0.86)
    plan = {"total": round(total, 3), "series": series, "turnT": round(at(turn_line, None), 3), "recapT": recap, "beats": uniq, "onsets": sorted(x[0] for w in words for x in w)}
    json.dump(plan, open(out, "w"), ensure_ascii=False, indent=1)
    used_s = sorted({c["sprite"] for b in uniq for c in b["cast"]} | {s["sprite"] for b in uniq for c in b["cast"] for s in c["swap"]})
    used_b = sorted({b["bg"] for b in uniq if b.get("bg")} | {g for b in uniq for g in b.get("montage", {}).get("bgs", [])})
    print(json.dumps({"beats": len(uniq), "sprites": used_s, "bgs": used_b}))
