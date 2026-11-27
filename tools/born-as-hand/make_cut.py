import json, os, shutil, subprocess, sys

ROOT = "/home/claude/four"
KIT = "/home/claude/kitv2"
HOLD = 1.2
v, cut = sys.argv[1], float(sys.argv[2])
plan = json.load(open(f"{ROOT}/voice/{v}/plan.json"))
beats = [b for b in plan["beats"] if b["t0"] < cut - 0.3]
total = round(cut + HOLD, 3)
plan.update({"beats": beats, "total": total, "recapT": total})
plan["onsets"] = [o for o in plan.get("onsets", []) if o < cut]
os.makedirs(f"{ROOT}/voice/{v}_cut", exist_ok=True)
json.dump(plan, open(f"{ROOT}/voice/{v}_cut/plan.json", "w"))
out = f"{ROOT}/render_cut/{v}"
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out)
for f in os.listdir(f"{ROOT}/render/{v}"):
    if f.endswith((".js", ".png", ".cmd")):
        shutil.copy(f"{ROOT}/render/{v}/{f}", out)
shutil.copytree(f"{ROOT}/render/{v}/fonts", f"{out}/fonts")
shutil.copy(f"{KIT}/kit.js", out)
for b in plan["bgAnn"]:
    if os.path.exists(f"{ROOT}/bgs/{b}.png"):
        shutil.copy(f"{ROOT}/bgs/{b}.png", out)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{ROOT}/render/{v}/voice.wav", "-af", f"atrim=0:{cut + 0.4},afade=t=out:st={cut - 0.6}:d=1.0,apad=whole_dur={total}", f"{out}/voice.wav"], check=True)
r = subprocess.run(f"cd {KIT} && BORN_ASSETS={ROOT}/assets/{v} node born_build.mjs {ROOT}/voice/{v}_cut/plan.json {out}", shell=True, capture_output=True, text=True)
print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-800:])
