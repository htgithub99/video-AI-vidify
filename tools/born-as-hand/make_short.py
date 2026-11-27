import json
import os
import shutil
import subprocess
import sys

ROOT = "/home/claude/four"
KIT = "/home/claude/kitv2"
END_HOLD = 3.6
END_TEXT = "WATCH THE FULL STORY"
END_SUB = "Full video on the channel"

v, cut, bust = sys.argv[1], float(sys.argv[2]), sys.argv[3]
plan = json.load(open(f"{ROOT}/voice/{v}/plan.json"))
beats = [b for b in plan["beats"] if b["t0"] < cut - 0.3 and b["kind"] != "chapter"]
last = dict(beats[-1])
for k in ("plate", "label", "tag", "bubble", "endCard", "paper"):
    last.pop(k, None)
end = {**plan["beats"][-1], "t0": round(cut, 3), "endCard": {"text": END_TEXT, "sub": END_SUB, "t": round(cut + 0.2, 3)}}
end.pop("plate", None)
end["bg"], end["cast"], end["subject"], end["frame"], end["kind"] = last.get("bg", end["bg"]), [{"sprite": bust, "slot": "c", "place": "ground", "swap": []}], 0, "wide", "bust"
for k in ("label", "bubble", "tag"):
    end.pop(k, None)
total = round(cut + END_HOLD, 3)
plan.update({"beats": beats + [end], "total": total, "recapT": None})
plan["onsets"] = [o for o in plan.get("onsets", []) if (o[0] if isinstance(o, list) else o) < cut]
os.makedirs(f"{ROOT}/voice/{v}_short", exist_ok=True)
json.dump(plan, open(f"{ROOT}/voice/{v}_short/plan.json", "w"))
out = f"{ROOT}/render_short/{v}"
os.makedirs(out, exist_ok=True)
for f in os.listdir(f"{ROOT}/render/{v}"):
    src = f"{ROOT}/render/{v}/{f}"
    if f.endswith((".js", ".png", ".jpg")):
        shutil.copy(src, out)
if not os.path.exists(f"{out}/fonts"):
    shutil.copytree(f"{ROOT}/render/{v}/fonts", f"{out}/fonts")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{ROOT}/voice/{v}/voice.wav", "-af", f"atrim=0:{cut},afade=t=out:st={cut - 0.25}:d=0.25,apad=whole_dur={total}", f"{out}/voice.wav"], check=True)
shutil.copy(f"{ROOT}/shorts/ovt_{v}.png", f"{out}/ovt.png")
if os.path.exists(f"{out}/ov.png"):
    os.remove(f"{out}/ov.png")
r = subprocess.run(f"cd {KIT} && BORN_VERT=1 BORN_ASSETS={ROOT}/assets/{v} node born_build.mjs {ROOT}/voice/{v}_short/plan.json {out}", shell=True, capture_output=True, text=True)
print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-800:])
