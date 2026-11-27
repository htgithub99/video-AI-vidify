import json, os, sys, subprocess, shutil, glob, re
from PIL import Image

KIT = "/home/claude/kitv2"
ROOT = "/home/claude/four"
PREFIX = {"j_": "jesse_", "mr_": "richthofen_", "sp_": "spartacus_", "sh_": "holmes_", "au_": "audie_", "bk_": "billy_", "mu_": "musashi_", "ca_": "caesar_"}
NEW_VIDEOS = {"audie", "billy", "musashi", "caesar"}
KIND_OF = {
    "vehicle": {"albatros_red", "albatros_two", "fe2b", "dh2", "dr1_red", "dr1_crashed", "hansom", "weapon_wagon"},
    "animal": {"bull_terrier", "hound", "snake", "dead_horse"},
    "aircraft": {"plane"},
    "person": {"kids", "joseph"},
    "ship": {"ship", "boat"},
    "structure": {"burning_house", "stone_hut", "wall"},
    "nature": {"pine"},
    "prop": {"camera", "notice", "statue", "pompey_statue", "cross", "shrike", "gravestone", "grave"},
}
H = {
    "jesse_young_boy": 1.15, "jesse_young_boy_run": 1.15, "jesse_young_teen_hoe": 1.65, "jesse_young_teen_kneel": 1.15,
    "jesse_young_guerrilla": 1.72, "jesse_young_guerrilla_ride": 2.4, "jesse_young_wounded": 1.72, "jesse_adult_ride": 2.4,
    "jesse_old_reach": 2.3, "jesse_old_fallen": 1.78, "jesse_baby": 1.3,
    "richthofen_young_boy_hunt": 1.4, "richthofen_young_boy_antlers": 1.4, "richthofen_young_cadet": 1.55, "richthofen_young_uhlan_ride": 2.6,
    "richthofen_young_uhlan": 1.8, "richthofen_baby": 1.3,
    "spartacus_young_boy": 1.7, "spartacus_young_sit_cell": 1.2, "spartacus_young_sleep": 1.8, "spartacus_adult_climb": 3.2, "spartacus_adult_ride": 2.4,
    "spartacus_young_thraex": 1.85, "spartacus_baby": 1.3, "spartacus_adult_stand": 1.85, "spartacus_adult_point": 1.85, "spartacus_adult_fight": 1.85,
    "spartacus_adult_cleaver": 1.85,
    "holmes_young_boy": 1.4, "holmes_young_student_bed": 1.8, "holmes_adult_lie": 1.85, "holmes_baby": 1.3, "holmes_young_bookseller": 1.65,
    "holmes_adult_stand": 1.85, "holmes_adult_walk": 1.85, "holmes_adult_point": 1.85, "holmes_adult_home": 1.85, "holmes_adult_fight": 1.85,
    "audie_kid_stand": 1.35, "audie_kid_aim": 1.35, "audie_kid_pick": 1.1, "audie_teen_stand": 1.65, "audie_teen_walk": 1.65, "audie_teen_fist": 1.65, "audie_star_lie": 1.8, "audie_baby": 1.3,
    "billy_boy_stand": 1.45, "billy_boy_read": 1.45, "billy_boy_sing": 1.45, "billy_teen_scared": 1.6, "billy_teen_climb": 2.4, "billy_teen_run": 1.6, "billy_kid_ride": 2.4, "billy_baby": 1.3,
    "musashi_boy_stand": 1.45, "musashi_boy_staff": 1.6, "musashi_boy_write": 1.9, "musashi_island_carve": 1.1, "musashi_island_boat": 1.9, "musashi_two_crouch": 1.2, "musashi_old_paint": 1.05, "musashi_old_write": 1.05, "musashi_baby": 1.3,
    "caesar_boy_stand": 1.6, "caesar_boy_walk": 1.6, "caesar_boy_sad": 1.6, "caesar_young_hide": 1.25, "caesar_young_sick": 1.75, "caesar_general_ride": 2.4, "caesar_dictator_fall": 1.6, "caesar_baby": 1.3,
    "albatros_red": 2.9, "albatros_two": 3.2, "fe2b": 3.8, "dh2": 2.9, "dr1_red": 2.95, "dr1_crashed": 2.6, "hansom": 2.5, "weapon_wagon": 2.2,
}


def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(cmd + "\n" + r.stderr[-2000:])
    return r.stdout


def split_new(video, raw_dir, plan):
    out = {}
    work = f"{ROOT}/work/{video}"
    os.makedirs(work, exist_ok=True)
    for sid, job in plan.items():
        if job["kind"] == "bg":
            continue
        src = glob.glob(f"{raw_dir}/{sid}.*")
        if not src:
            print("missing raw", sid)
            continue
        names = job["names"]
        if job["kind"] == "cast":
            pre = next(v for k, v in PREFIX.items() if sid.startswith(k))
            base = sid.split("_", 1)[1]
            final = [pre + ("baby" if base == "baby" else "adult_bust" if base == "bust" else f"{base}_{n}") for n in names]
        else:
            final = names
        keyed = f"{work}/{sid}_key.png"
        sh(f"python3 {KIT}/alpha_key.py {src[0]} {keyed}")
        res = json.loads(sh(f"python3 {KIT}/sheet_split.py {keyed} {work}/{sid} {len(names)}").strip().splitlines()[-1])
        files = res.get("files", [])
        fix = json.load(open(f"{ROOT}/splitfix.json")).get(sid) if os.path.exists(f"{ROOT}/splitfix.json") else None
        if fix:
            files = [files[i] if isinstance(i, int) else f"{work}/{sid}_{i}.png" for i in fix]
        if len(files) != len(final):
            print("COUNT", sid, len(files), "want", len(final))
        for i, f in enumerate(files[: len(final)]):
            out[final[i]] = {"file": f, "sheet": sid, "kind": job["kind"], "height": (job.get("heights") or [None] * 99)[i]}
    hires = f"{ROOT}/busts/{video}.png"
    for name in out:
        if name.endswith("_adult_bust") and os.path.exists(hires):
            out[name]["file"] = hires
    return out


def kind_heights(name, info):
    if info["kind"] == "cast":
        k = "bust" if name.endswith("_bust") else "person"
        return k, H.get(name, 1.78)
    for k, s in KIND_OF.items():
        if name in s:
            return k, H.get(name, info["height"] or 1)
    h = info["height"] or 1
    return ("person" if h >= 1.2 and not name.endswith(("frame", "sampler", "gravestone", "ladder", "antlers", "gun", "shelf", "wreath", "hive", "cane"))
            else "prop"), h


def measure(items, assets):
    man = [{"name": n, "png": f"{assets}/png/{n}.png", "kind": k} for n, k in items]
    json.dump(man, open(f"{assets}/measure_in.json", "w"))
    sh(f"cd {KIT} && python3 annotate.py measure {assets}/measure_in.json {assets}/measure_out.json")
    return json.load(open(f"{assets}/measure_out.json"))


if __name__ == "__main__":
    video = sys.argv[1]
    Q = json.load(open(f"{ROOT}/assets_queue2.json" if video in NEW_VIDEOS else f"{ROOT}/assets_queue.json"))[video]
    assets = f"{ROOT}/assets/{video}"
    os.makedirs(f"{assets}/png", exist_ok=True)
    new = split_new(video, f"{ROOT}/raw/{video}", Q)
    meta = {}
    for n, info in new.items():
        shutil.copyfile(info["file"], f"{assets}/png/{n}.png")
        k, h = kind_heights(n, info)
        meta[n] = {"kind": k, "heightM": h, "new": True}
    json.dump(meta, open(f"{assets}/new_meta.json", "w"), indent=1)
    print(json.dumps({"new": len(meta)}))
