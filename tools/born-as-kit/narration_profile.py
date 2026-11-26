import json, re, sys, statistics, argparse
from collections import Counter

SECOND = {"en": {"you", "your", "you're", "yours", "yourself"}, "vi": {"bạn", "mày", "cậu", "anh", "em"}}
PAST = {"en": {"was", "were", "had", "did", "went", "said"}, "vi": {"đã", "từng"}}
STOP = {"en": {"the", "a", "an", "and", "of", "to", "in", "on", "it", "is", "that", "with", "for", "at", "but", "as"}, "vi": {"và", "là", "của", "thì", "mà", "những", "các", "một", "cái", "đã", "đang", "sẽ", "này", "đó"}}


def load(path):
    if path.endswith(".json"):
        data = json.load(open(path, encoding="utf-8"))
        return " ".join(s["t"] for s in data), data
    return open(path, encoding="utf-8").read(), None


def sentences(text):
    text = re.sub(r"\s+", " ", text.replace("…", "...")).strip()
    parts = re.split(r"(?<=[.!?])\s+(?=[\"“'A-ZÀ-ỸĐ0-9])", text)
    return [p.strip() for p in parts if re.search(r"\w", p)]


def units(s):
    return re.findall(r"[\wÀ-ỹđĐ'’-]+", s.lower())


def pct(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(q * len(xs)))] if xs else 0


def measure(text, lang, rate, segs=None):
    ss = sentences(text)
    lens = [len(units(s)) for s in ss]
    secs = [n / rate for n in lens]
    allw = [w for s in ss for w in units(s)]
    n = max(len(allw), 1)
    starts = Counter(" ".join(units(s)[:1]) for s in ss if units(s))
    starts2 = Counter(" ".join(units(s)[:2]) for s in ss if len(units(s)) >= 2)
    grams = Counter()
    for s in ss:
        u = units(s)
        for k in (3, 4):
            for i in range(len(u) - k + 1):
                g = u[i:i + k]
                if not all(x in STOP[lang] for x in g):
                    grams[" ".join(g)] += 1
    anaphora = sum(1 for a, b in zip(ss, ss[1:]) if units(a)[:1] and units(a)[:1] == units(b)[:1])
    runs, cur = [], 0
    for L in lens:
        cur = cur + 1 if L <= 3 else 0
        if cur:
            runs.append(cur)
    prof = {
        "lang": lang, "rate_units_per_s": rate, "sentences": len(ss), "units": len(allw),
        "sentence_seconds": {"p10": round(pct(secs, .1), 2), "p25": round(pct(secs, .25), 2), "median": round(statistics.median(secs), 2) if secs else 0, "p75": round(pct(secs, .75), 2), "p90": round(pct(secs, .9), 2)},
        "fragment_share": round(sum(1 for s in secs if s <= 1.2) / max(len(ss), 1), 3),
        "one_word_share": round(sum(1 for L in lens if L == 1) / max(len(ss), 1), 3),
        "question_share": round(sum(1 for s in ss if s.rstrip().endswith("?")) / max(len(ss), 1), 3),
        "exclaim_share": round(sum(1 for s in ss if s.rstrip().endswith("!")) / max(len(ss), 1), 3),
        "second_person_per_100": round(100 * sum(1 for w in allw if w in SECOND[lang]) / n, 2),
        "past_marker_per_100": round(100 * sum(1 for w in allw if w in PAST[lang]) / n, 2),
        "digits_per_100": round(100 * sum(1 for w in allw if re.fullmatch(r"\d+", w)) / n, 2),
        "anaphora_share": round(anaphora / max(len(ss) - 1, 1), 3),
        "max_fragment_run": max(runs) if runs else 0,
        "top_starters": starts.most_common(15),
        "top_starters_2": starts2.most_common(15),
        "repeated_phrases": [g for g in grams.most_common(40) if g[1] >= 3][:25],
    }
    if segs:
        dur = segs[-1]["e"] - segs[0]["s"]
        prof["measured_rate_units_per_s"] = round(len(allw) / max(dur, 1), 2)
        gaps = [b["s"] - a["e"] for a, b in zip(segs, segs[1:]) if b["s"] - a["e"] > 0.15]
        prof["pause_seconds"] = {"median": round(statistics.median(gaps), 2) if gaps else 0, "p90": round(pct(gaps, .9), 2)}
    return prof, ss, secs


def check(prof, ref, ss, secs):
    issues = []
    def band(key, lo, hi, label):
        v, r = prof[key], ref[key]
        if r and not (r * lo <= v <= r * hi + 0.01):
            issues.append(f"{label}: {v} vs sample {r}")
    rs, ps = ref["sentence_seconds"], prof["sentence_seconds"]
    if prof["sentences"] >= 40:
        band("fragment_share", .6, 1.6, "Short fragments share")
        band("question_share", .5, 1.8, "Question share")
        band("second_person_per_100", .5, 1.8, "Second-person per 100 units")
    if prof["sentences"] >= 15 and not (rs["median"] * .7 <= ps["median"] <= rs["median"] * 1.3):
        issues.append(f"Median sentence length {ps['median']}s vs sample {rs['median']}s")
    if ref["past_marker_per_100"] < 1 and prof["past_marker_per_100"] > 2.5:
        issues.append(f"Too many past markers ({prof['past_marker_per_100']}/100); sample narrates in present tense")
    long_ = [(i + 1, round(s, 1), ss[i]) for i, s in enumerate(secs) if s > rs["p90"] * 1.4]
    for i, s, t in long_:
        issues.append(f"Sentence {i} is {s}s (sample p90 {rs['p90']}s), split it: {t[:90]}")
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["profile", "check"])
    ap.add_argument("input")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--rate", type=float, default=0)
    ap.add_argument("--ref")
    ap.add_argument("-o")
    a = ap.parse_args()
    text, segs = load(a.input)
    rate = a.rate
    if not rate and segs:
        rate = len(units(text)) / max(segs[-1]["e"] - segs[0]["s"], 1)
    rate = rate or (2.7 if a.lang == "en" else 3.8)
    prof, ss, secs = measure(text, a.lang, rate, segs)
    if a.mode == "profile":
        json.dump(prof, open(a.o, "w", encoding="utf-8") if a.o else sys.stdout, ensure_ascii=False, indent=1)
        return
    ref = json.load(open(a.ref, encoding="utf-8"))
    issues = check(prof, ref, ss, secs)
    print(json.dumps({"profile": {k: prof[k] for k in ("sentences", "sentence_seconds", "fragment_share", "question_share", "second_person_per_100", "past_marker_per_100", "anaphora_share")}, "issues": issues}, ensure_ascii=False, indent=1))
    sys.exit(1 if issues else 0)


main()
