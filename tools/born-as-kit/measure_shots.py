import cv2, numpy as np, json, sys
src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "shots.json"
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
prev = None; rows = []; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (320, 180)), cv2.COLOR_BGR2GRAY)
    if prev is not None:
        diff = float(np.abs(g.astype(int) - prev.astype(int)).mean())
        s = 1.0; dx = dy = rot = 0.0; inl = 0
        p0 = cv2.goodFeaturesToTrack(prev, 200, 0.01, 6)
        if p0 is not None and len(p0) > 8:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None)
            a = p0[st == 1]; b = p1[st == 1]
            if len(a) > 8:
                M, inliers = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=1.5)
                if M is not None:
                    s = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))); dx = float(M[0, 2]); dy = float(M[1, 2]); inl = int(inliers.sum())
        rows.append([i / fps, diff, s, dx, dy, rot, inl])
    prev = g; i += 1
R = np.array(rows); t, diff, s, dx, dy, rot, inl = R.T
shots = []; start = 0.0
for k in range(len(t)):
    if diff[k] > 14 and t[k] - start > 0.3:
        shots.append((start, t[k])); start = t[k]
shots.append((start, t[-1]))
res = []
for a, b in shots:
    m = (t > a + 0.05) & (t < b - 0.05) & (inl > 20)
    if m.sum() < 3:
        res.append({"a": round(a, 2), "b": round(b, 2), "fx": True}); continue
    res.append({"a": round(a, 2), "b": round(b, 2), "zoom": round(float(np.prod(s[m])), 3), "panX": round(float(dx[m].sum()) / 320, 3), "panY": round(float(dy[m].sum()) / 180, 3), "roll": round(float(rot[m].sum()), 2)})
real = [r for r in res if not r.get("fx") and r["b"] - r["a"] > 0.31]
d = np.array([r["b"] - r["a"] for r in real]); z = np.array([r["zoom"] for r in real])
summary = {"shots": len(real), "transitions": len(res) - len(real), "dur_p10_p50_p90": np.percentile(d, [10, 50, 90]).round(2).tolist(), "push": float((z > 1.01).mean().round(2)), "pull": float((z < 0.99).mean().round(2)), "hold": float(((z >= 0.99) & (z <= 1.01)).mean().round(2)), "zoom_rate_p10_p50_p90": np.percentile((z - 1) / d, [10, 50, 90]).round(3).tolist()}
json.dump({"summary": summary, "shots": res}, open(out, "w"))
print(json.dumps(summary))
