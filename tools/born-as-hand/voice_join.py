import json, sys, subprocess, os, wave
import numpy as np

video = sys.argv[1]
lines = json.load(open("/home/claude/four/born4_lines.json"))[video]
V = json.load(open("/home/claude/four/voice_map.json"))[video]
src = "/home/claude/four/wav"
out = f"/home/claude/four/voice/{video}"
os.makedirs(out, exist_ok=True)
SR = 44100
GAP, TURN, CHAP = 0.32, 0.8, 2.25
turn = next(i for i, l in enumerate(lines) if l["text"].startswith("But right now?"))


def load(path):
    tmp = f"{out}/_t.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse", tmp], check=True)
    with wave.open(tmp) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    return a


parts, starts, t = [], [], 0.4
parts.append(np.zeros(int(0.4 * SR), np.float32))
prev_ch = lines[0]["ch"]
for i, l in enumerate(lines):
    if i > 0:
        g = CHAP if l["ch"] != prev_ch and l["ch"] not in ("HOOK",) else (TURN if i == turn else GAP)
        if l["ch"] == "Recap" and prev_ch != "Recap":
            g = 1.0
        parts.append(np.zeros(int(g * SR), np.float32))
        t += g
    prev_ch = l["ch"]
    a = load(f"{src}/{V[i]['h']}.wav")
    starts.append(round(t, 3))
    parts.append(a)
    t += len(a) / SR
parts.append(np.zeros(int(1.0 * SR), np.float32))
y = np.concatenate(parts)
with wave.open(f"{out}/raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{out}/raw.wav", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "1", f"{out}/voice.wav"], check=True)
json.dump({"starts": starts, "total": round(len(y) / SR, 3)}, open(f"{out}/timing.json", "w"))
print(video, "total", round(len(y) / SR, 1), "s")
