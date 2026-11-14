// Terrain bands for the sketch and comic skins: ground, hills, mountain ranges, snow peaks, bush rows and dirt banks.
// Same geometry contract as the core terrain: x = centre, y = top line, width W, height H. Other kinds return null (core drawer).
// Sketch: flat fills, one outline, a few outlined pebbles and blade tufts. Comic: the same plus ink tufts, hatching and mud patches.
export const SKIN_PART_TERRAIN = `(c, o0, K) => {
  const kind = (o0 && o0.kind) || "hills";
  if (["ground", "hills", "mountainRange", "snowPeaks", "bushes", "bank"].indexOf(kind) < 0) return null;
  const o = Object.assign({ x: 640, y: 400, width: 2200, height: 300, r: 40, seed: 3 }, o0);
  const st = K.S(), ink = !!st.hatch, W = o.width, H = o.height, R = o.r, w = K.LW(R), x0 = o.x - W / 2, seed = o.seed, night = K.NIGHT();
  const rnd = (i) => K.rnd(seed, i), ol = st.ol;
  const gcols = Object.assign({ grass: "#8fae5a", dirt: "#b39a72", sand: "#e2cc96", snow: "#eef2f4", mud: "#7a6650", stone: "#a8a196", field: "#cdb46a", paddy: "#9ec4a0", battlefield: "#8a7a5a" }, st.ground || {});
  const tuft = (x, y, s, col) => { c.strokeStyle = col || ol; c.lineWidth = Math.max(0.8, w * 0.5); c.lineCap = "round"; c.beginPath(); [-0.5, -0.15, 0.2, 0.55].forEach((d, i) => { c.moveTo(x + d * s * 0.5, y); c.lineTo(x + d * s * (1 + (i % 2) * 0.3), y - s * (0.7 + (i % 2) * 0.5)); }); c.stroke(); };
  const pebble = (x, y, s, col) => K.paint(c, K.smooth([[x - s, y + s * 0.3], [x - s * 0.6, y - s * 0.45], [x + s * 0.5, y - s * 0.5], [x + s, y + s * 0.25], [x, y + s * 0.45]], true), col, w * 0.6);
  const ridge = (base, amp, n, sd, peaky) => {
    const narrow = W < 1400, foot = narrow ? base : base + H * 2, pts = [[x0, foot]];
    for (let i = 0; i <= n; i++) {
      const k = i / n, v = peaky ? Math.abs(Math.sin(k * K.PI * (2 + K.rnd(sd, 1) * 2) + sd)) : 0.5 + 0.5 * Math.sin(k * K.PI * (2 + K.rnd(sd, 2)) + sd);
      const env = narrow ? Math.pow(Math.sin(K.PI * k), 0.7) : 1;
      pts.push([x0 + k * W, base - env * amp * (0.35 + 0.65 * v * (0.75 + K.rnd(sd, i) * 0.25))]);
    }
    pts.push([x0 + W, foot]);
    return pts;
  };
  const poly = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
  c.save();
  if (kind === "ground") {
    const col = o.color || gcols[o.ground || "grass"] || gcols.grass;
    const base = night ? K.shade(col, 0.7) : col;
    const p = K.smooth([[x0, o.y + 10], [x0 + W * 0.3, o.y - 6], [x0 + W * 0.7, o.y + 4], [x0 + W, o.y - 4], [x0 + W, o.y - 4], [x0 + W, o.y + H], [x0 + W, o.y + H], [x0, o.y + H], [x0, o.y + H], [x0, o.y + 10]], true);
    K.paint(c, p, base, w);
    c.save(); c.clip(p);
    for (let i = 0; i < 6; i++) { const px = x0 + rnd(i + 70) * W, py = o.y + 30 + rnd(i + 80) * Math.min(H, 340), pw = 80 + rnd(i + 90) * 200; c.fillStyle = K.toneOf(K.shade(col, i % 2 ? 1.07 : 0.93)); c.fill(K.smooth([[px - pw / 2, py], [px - pw * 0.3, py - 9], [px + pw * 0.25, py - 8], [px + pw / 2, py + 2], [px + pw * 0.2, py + 10], [px - pw * 0.3, py + 8]], true)); }
    if (ink) for (let i = 0; i < 5; i++) { const px = x0 + rnd(i + 170) * W, py = o.y + 40 + rnd(i + 180) * Math.min(H, 300), pw = 70 + rnd(i + 190) * 130; K.paint(c, K.smooth([[px - pw / 2, py], [px - pw * 0.25, py - 10], [px + pw * 0.3, py - 7], [px + pw / 2, py + 3], [px, py + 11]], true), K.toneOf(gcols.mud || "#6b5a3f"), w * 0.6); }
    const n = Math.round(W / (ink ? 22 : 70));
    for (let i = 0; i < n; i++) { const x = x0 + rnd(i * 3 + 1) * W, y = o.y + 16 + rnd(i * 3 + 2) * Math.min(H, 360); tuft(x, y, (ink ? 9 : 7) + rnd(i * 3 + 3) * 8, ink ? ol : K.shade(base, 0.6)); }
    for (let i = 0; i < Math.round(W / 160); i++) pebble(x0 + rnd(i + 400) * W, o.y + 30 + rnd(i + 410) * Math.min(H, 320), 5 + rnd(i + 420) * 9, K.toneOf(K.shade(col, 1.15)));
    if (ink && !night) for (let i = 0; i < Math.round(W / 90); i++) { c.fillStyle = ["#f2efe6", "#e8c96a", "#c8574a"][i % 3]; c.fill(K.ell(x0 + rnd(i + 600) * W, o.y + 20 + rnd(i + 610) * Math.min(H, 260), 2.5, 2.5)); }
    c.restore();
  } else if (kind === "hills" || kind === "mountainRange" || kind === "snowPeaks") {
    const layers = K.num(o.layers, 3), peaky = kind !== "hills";
    const far = peaky ? (o.colors || st.mountains || ["#b9bdc6", "#9ea4b0", "#868d99"]) : (o.colors || st.hills || ["#a9b88f", "#8ea86e", "#759658"]);
    for (let L = 0; L < layers; L++) {
      const k = L / Math.max(1, layers - 1), amp = H * (1 - k * 0.4);
      const pts = ridge(o.y + k * H * 0.08, amp, peaky ? 9 : 5, seed + L * 7, peaky);
      const p = peaky ? poly(pts) : K.smooth(pts, true);
      let col = far[Math.min(far.length - 1, L)];
      if (night) col = K.shade(col, 0.6);
      K.fill(c, p, col, w * (0.7 + k * 0.3), { R: amp / 4, dx: peaky ? -amp * 0.12 : 0, dy: peaky ? 0 : -amp * 0.05, box: [x0, o.y - H * 1.2, x0 + W, o.y + H * 2], gap: w * 2.2, hatch: ink && L === layers - 1 });
      if (peaky && (kind === "snowPeaks" || o.snow)) {
        c.save(); c.clip(p);
        for (let i = 1; i < pts.length - 1; i++) { const q = pts[i]; if (q[1] < pts[i - 1][1] && q[1] < pts[i + 1][1] && q[1] < o.y - amp * 0.62) K.paint(c, poly([[q[0], q[1] - 2], [q[0] + amp * 0.2, q[1] + amp * 0.24], [q[0] + amp * 0.08, q[1] + amp * 0.18], [q[0] - amp * 0.04, q[1] + amp * 0.27], [q[0] - amp * 0.2, q[1] + amp * 0.22]]), night ? "#d0ccc4" : "#f4f3ee", w * 0.6); }
        c.restore();
      }
      if (!peaky && L === layers - 1) { c.save(); c.clip(p); for (let i = 0; i < Math.round(W / 60); i++) { const x = x0 + rnd(i + 700) * W; tuft(x, o.y + rnd(i + 710) * H * 0.5 + 10, 8, ink ? ol : K.shade(col, 0.6)); } c.restore(); }
    }
  } else if (kind === "bushes") {
    const n = Math.max(4, Math.round(W / 150));
    const leaves = night ? K.organic.leafNight : K.organic.leaf;
    for (let i = 0; i < n; i++) {
      const cx = x0 + ((i + 0.5) / n) * W + (rnd(i) - 0.5) * 60, rx = (W / n) * (0.75 + rnd(i + 50) * 0.35), ry = H * (0.55 + rnd(i + 90) * 0.35);
      const list = [K.ell(cx, o.y - ry * 0.5, rx * 0.8, ry * 0.75)];
      const m = 7;
      for (let j = 0; j < m; j++) { const a = K.PI + (j / (m - 1)) * K.PI, br = rx * (0.3 + K.rnd(seed + i, j) * 0.12); list.push(K.ell(cx + Math.cos(a) * (rx - br * 0.7), o.y - ry * 0.5 + Math.sin(a) * (ry - br * 0.6), br, br)); }
      list.push(K.ell(cx, o.y - ry * 0.15, rx, ry * 0.4));
      const all = K.union(c, list, leaves[i % leaves.length], w, { R: ry / 2.5, dx: -rx * 0.12, dy: -ry * 0.12, box: [cx - rx * 1.2, o.y - ry * 1.6, cx + rx * 1.2, o.y + 10] });
      c.save(); c.clip(all); c.strokeStyle = ol; c.lineWidth = w * 0.5; c.lineCap = "round";
      for (let j = 0; j < (ink ? 9 : 3); j++) { const a = new Path2D(), x = cx + (K.rnd(seed + i, j + 30) - 0.5) * rx * 1.4, y = o.y - ry * (0.2 + K.rnd(seed + i, j + 40) * 0.8); a.arc(x, y, ry * 0.18, K.PI * 0.15, K.PI * 0.85); c.stroke(a); }
      if (ink) {
        const lc = leaves[i % leaves.length];
        for (let j = 0; j < 5; j++) { const x = cx + (K.rnd(seed + i, j + 60) - 0.5) * rx * 1.3, y = o.y - ry * (0.25 + K.rnd(seed + i, j + 70) * 0.6), rr = ry * (0.18 + K.rnd(seed + i, j + 80) * 0.12); c.fillStyle = K.toneOf(K.shade(lc, 0.8)); c.beginPath(); c.arc(x, y, rr, 0, K.PI); c.fill(); c.beginPath(); c.arc(x, y, rr, K.PI * 0.05, K.PI * 0.95); c.stroke(); }
        const nl = Math.round(rx * ry / 260);
        c.lineWidth = Math.max(0.7, w * 0.4);
        for (let j = 0; j < nl; j++) { const x = cx + (K.rnd(seed + i, j + 100) - 0.5) * rx * 1.8, y = o.y - ry * K.rnd(seed + i, j + 300) * 1.3, s = 3 + K.rnd(seed + i, j + 500) * 4, an = K.rnd(seed + i, j + 700) * K.PI; c.beginPath(); c.moveTo(x - Math.cos(an) * s, y - Math.sin(an) * s); c.quadraticCurveTo(x, y - s * 0.6, x + Math.cos(an) * s, y + Math.sin(an) * s); c.stroke(); }
      }
      c.restore();
    }
  } else {
    const col = o.color || gcols.dirt || "#8a6a48", top = o.y;
    const pts = [[x0, top + H]];
    for (let i = 0; i <= 12; i++) pts.push([x0 + (i / 12) * W, top + (rnd(i) - 0.5) * 0.08 * H]);
    pts.push([x0 + W, top + H]);
    const p = K.smooth(pts, true);
    K.paint(c, p, night ? K.shade(col, 0.7) : col, w);
    c.save(); c.clip(p);
    c.fillStyle = K.toneOf(K.shade(col, 0.8)); c.fill(K.smooth(pts.slice(1, -1).map(([x, y]) => [x, y + H * 0.06]).concat([[x0 + W, top - H], [x0, top - H]]), true));
    c.strokeStyle = ol; c.lineCap = "round";
    const n = Math.round(W / (ink ? 9 : 26));
    for (let i = 0; i < n; i++) { const x = x0 + rnd(i * 2 + 7) * W, y = top + 8 + rnd(i * 2 + 8) * H * 0.85; c.globalAlpha = ink ? 0.55 : 0.35; c.lineWidth = Math.max(0.8, w * 0.4); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 3, y + 10, x + (rnd(i + 3) - 0.5) * 8, y + 16 + rnd(i + 4) * 30); c.stroke(); }
    c.globalAlpha = 1;
    for (let i = 0; i < Math.round(W / 70); i++) pebble(x0 + rnd(i + 300) * W, top + 14 + rnd(i + 400) * H * 0.8, 5 + rnd(i + 500) * 8, K.toneOf(K.shade(col, 1.12)));
    c.restore();
    const lip = [];
    for (let i = 0; i <= 24; i++) lip.push([x0 + (i / 24) * W, top + (i % 2 ? 10 : -4) + (rnd(i + 800) - 0.5) * 6]);
    const lp = K.smooth(lip.concat([[x0 + W, top - 8], [x0, top - 8]]), true);
    K.paint(c, lp, K.toneOf((st.ground && st.ground.grass) || "#8fae5a"), w * 0.8);
  }
  c.restore();
  return true;
}`;
