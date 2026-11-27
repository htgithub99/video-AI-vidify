import json, sys, subprocess, wave, re
import numpy as np

video = sys.argv[1]
ROOT = "/home/claude/four"
lines = json.load(open(f"{ROOT}/born4_lines.json"))[video]
V = json.load(open(f"{ROOT}/voice_map.json"))[video]
T = json.load(open(f"{ROOT}/voice/{video}/timing.json"))
SR = 16000


def load(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse", "-f", "s16le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32)


def weight(w):
    core = re.sub(r"[^A-Za-z0-9']", "", w)
    return max(1.0, len(core) * 0.9 + 1.2)


out = []
for i, l in enumerate(lines):
    a = load(f"{ROOT}/wav/{V[i]['h']}.wav")
    dur = len(a) / SR
    hop = int(SR * 0.01)
    env = np.array([np.sqrt(np.mean(a[k:k + hop] ** 2)) for k in range(0, len(a) - hop, hop)]) if len(a) > hop else np.array([1.0])
    thr = max(env.max() * 0.06, 150)
    quiet = env < thr
    gaps = []
    k = 0
    while k < len(quiet):
        if quiet[k]:
            j = k
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - k) >= 9 and k > 5 and j < len(quiet) - 5:
                gaps.append(((k + j) / 2 * 0.01, (j - k) * 0.01))
            k = j
        else:
            k += 1
    toks = l["text"].split()
    ws = [weight(t) for t in toks]
    tot = sum(ws)
    starts = []
    acc = 0
    for w in ws:
        starts.append(acc / tot * dur)
        acc += w
    breaks = [j for j, t in enumerate(toks[:-1]) if re.search(r"[,;:.?!]$", t)]
    for b, (gc, gl) in zip(breaks, sorted(gaps, key=lambda g: -g[1])[: len(breaks)]):
        pass
    if breaks and gaps:
        gs = sorted(sorted(gaps, key=lambda g: -g[1])[: len(breaks)])
        for b, (gc, gl) in zip(breaks, gs):
            shift = (gc + gl / 2) - starts[b + 1]
            for j in range(b + 1, len(starts)):
                starts[j] += shift * (1 - (j - b - 1) / max(1, len(starts) - b - 1)) if j == b + 1 else shift * 0.5
    starts = [min(max(0, s), dur - 0.05) for s in starts]
    for j in range(1, len(starts)):
        starts[j] = max(starts[j], starts[j - 1] + 0.05)
    t0 = T["starts"][i]
    row = []
    for j, t in enumerate(toks):
        s = t0 + starts[j]
        e = t0 + (starts[j + 1] if j + 1 < len(starts) else dur)
        row.append([round(s, 3), round(e, 3), t])
    out.append(row)
json.dump(out, open(f"{ROOT}/voice/{video}/words.json", "w"))
print(video, len(out), out[0][:3], out[-1][-1])
