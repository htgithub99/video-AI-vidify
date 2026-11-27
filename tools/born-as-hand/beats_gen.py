import json
from beats_lib import B

ROOT = "/home/claude/four"
CAMS = ["push", "push", "pull", "push"]


def gen(video, scenes, texts):
    lines = [l["text"] for l in json.load(open(f"{ROOT}/born4_lines.json"))[video]]

    def find(anchor):
        hits = [i for i, t in enumerate(lines, 1) if t.startswith(anchor)]
        if not hits:
            raise SystemExit(f"{video}: no line starts with '{anchor}'")
        return hits[0]

    starts = sorted((find(a), bg, cast, opts) for a, bg, cast, opts in scenes)
    over = {find(a): o for a, o in texts.items()}
    cur = None
    for i in range(1, len(lines) + 1):
        hit = [s for s in starts if s[0] == i]
        if hit:
            cur = hit[0]
        if not cur:
            raise SystemExit(f"{video}: line {i} has no scene")
        _, bg, cast, opts = cur
        o = dict(opts)
        o.update(over.get(i, {}))
        o.setdefault("cam", CAMS[i % len(CAMS)])
        o.pop("f", None)
        b_bg = o.pop("bg", bg)
        b_cast = o.pop("cast", cast)
        kind = o.pop("kind", "scene")
        if kind in ("paper", "black"):
            b_cast = []
        B(i, o.pop("kw", None), b_bg, b_cast, kind=kind, f="wide", **o)
