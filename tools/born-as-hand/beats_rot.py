import json, os, re

ROOT = "/home/claude/four"
ROT = ["wide", "L", "two", "prop", "R", "wide", "talk"]
HERO = {"jesse": "jesse", "redbaron": "richthofen", "spartacus": "spartacus", "sherlock": "holmes", "audie": "audie", "billy": "billy", "musashi": "musashi", "caesar": "caesar"}
AGE = {
    "jesse": [(r"young_boy", "boy"), (r"young_teen", "farm"), (r"young_(guerrilla|wounded)", "bush"), (r"adult", "adult"), (r"old", "old")],
    "redbaron": [(r"young_boy", "boy"), (r"young_cadet", "cadet"), (r"young_(uhlan|supply)", "uhlan"), (r"young_observer", "observer"), (r"adult", "adult")],
    "spartacus": [(r"young_boy", "boy"), (r"young_(youth|auxiliary)", "warrior"), (r"young_chained", "slave"), (r"young_(thraex|sit_cell|sleep)", "gladiator"), (r"adult", "adult")],
    "sherlock": [(r"young_boy", "boy"), (r"young_(student|lab)", "student"), (r"adult_home", "home"), (r"young_old", "old"), (r"(adult|young_priest|young_bookseller)", "adult")],
}
SKIP = ("montage", "end", "keepwide")


def C(s):
    return {"sprite": s, "slot": "c", "dir": None, "place": "ground", "mv": None, "crowd": None, "swap": []}


def rotate(video, beats):
    meta = f"{ROOT}/assets/{video}/new_meta.json"
    avail = set(json.load(open(meta))) if os.path.exists(meta) else set()
    hero = HERO[video]
    kinds = {n: m.get("kind") for n, m in (json.load(open(meta)).items() if os.path.exists(meta) else [])}
    for l in ("wildwest", "ww", "ancient", "eastasia"):
        c = f"{ROOT}/lib/{l}/catalog.json"
        if os.path.exists(c):
            for n, v in json.load(open(c))["items"].items():
                kinds.setdefault(n, v.get("kind"))

    def prop_of(cast):
        return next((c["sprite"] for c in cast if kinds.get(c["sprite"]) in ("prop", "weapon") and not c.get("crowd")), None)

    def age_of(s):
        if not s.startswith(hero + "_") or "baby" in s or s.endswith(("_b_r", "_b_l", "_b_talk")):
            return None
        rest = s[len(hero) + 1:]
        return next((a for rx, a in AGE[video] if re.match(rx, rest)), None) if video in AGE else rest.split("_")[0]

    def hero_busts(cast):
        for c in cast:
            a = age_of(c["sprite"])
            if a and all(f"{hero}_{a}_b_{k}" in avail for k in ("r", "talk", "l")):
                return {k: f"{hero}_{a}_b_{k}" for k in ("r", "talk", "l")}
        return None

    def other_bust(cast, want=None, exact=False):
        if want is not None and 0 <= want < len(cast) and not cast[want].get("crowd") and f"{cast[want]['sprite']}_b" in avail:
            return f"{cast[want]['sprite']}_b"
        if exact:
            return None
        pool = [c["sprite"] for c in cast if f"{c['sprite']}_b" in avail and not c.get("crowd")]
        return f"{pool[0]}_b" if pool else None

    stats = {}
    k, last, prev_bg, cur_hb, recent = 0, None, None, None, []
    for b in beats:
        if b["kind"] != "scene" or not b.get("bg") or any(b.get(x) for x in SKIP):
            last = b["kind"]
            b.pop("keepwide", None)
            continue
        if b["bg"] != prev_bg:
            k, prev_bg = (1 if b["bg"] in recent[-8:] else 0), b["bg"]
        recent.append(b["bg"])
        cast = b["cast"]
        own = hero_busts(cast)
        if own:
            cur_hb = own
        if any(c["sprite"].startswith(hero + "_baby") for c in cast):
            cur_hb = None
        hb = own or (cur_hb if k % 2 else None)
        lab, bub = b.get("label"), b.get("bubble")
        target = lab[2] if lab else bub[1] if bub else None
        comp = None
        if k == 0:
            comp = "wide"
        elif target is not None and 0 <= target < len(cast):
            hero_t = age_of(cast[target]["sprite"]) is not None
            ob = other_bust(cast, target, exact=True)
            comp = ("L" if last != "L" else "R") if hero_t and hb else "solo" if ob else "wide"
        else:
            for step in range(len(ROT)):
                want = ROT[(k + step) % len(ROT)]
                if want == last:
                    continue
                if want == "wide" or (hb and want in ("L", "R", "talk")) or (want == "two" and hb and other_bust(cast)) or (want == "prop" and prop_of(cast) and not lab and not bub):
                    comp = want
                    break
            comp = comp or "wide"
        if comp != "wide":
            ob = other_bust(cast, target, exact=target is not None)
            idx = 0
            if comp == "two":
                nc = [C(hb["r"]), C(ob)]
                idx = 0 if target is None or age_of(cast[target]["sprite"]) else 1
            elif comp == "prop":
                nc = [C(prop_of(cast))]
            elif comp == "solo":
                nc = [C(ob)]
            else:
                nc = [C(hb[{"L": "r", "R": "l", "talk": "talk"}[comp]])]
            if lab:
                b["label"] = (lab[0], lab[1], idx, *lab[3:])
            if bub:
                b["bubble"] = (bub[0], idx, *bub[2:])
            b["cast"], b["kind"] = nc, "scene" if comp == "prop" else "bust"
        stats[comp] = stats.get(comp, 0) + 1
        last = comp
        k += 1
    return stats
