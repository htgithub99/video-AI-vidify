// Small scenery for the sketch and comic skins: rocks and boulders with facets and cracks, a cut stump with rings and roots,
// a felled log with bark lines and an end grain, and grass clumps of ink blades. Other scenery kinds return null (core drawer).
export const SKIN_PART_SCENERY = `(c, o, K) => {
  const kind = o.kind;
  if (["rock", "boulder", "stump", "log", "grass"].indexOf(kind) < 0) return null;
  const st = K.S(), R = K.num(o.r, 40), w = K.LW(R), ol = st.ol, night = K.NIGHT(), rnd = (i) => K.rnd(K.num(o.seed, 2), i);
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const stone = o.color ? K.toneOf(o.color) : night ? "#7e7a76" : "#9e9890", bark = night ? "#4f4136" : "#7a5638";
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (kind !== "grass") { c.fillStyle = "rgba(20,16,12,0.2)"; c.fill(K.ell(0, 0.02 * R, (kind === "boulder" ? 1.3 : kind === "log" ? 1.2 : 0.8) * R, 0.1 * R)); }
  if (kind === "rock" || kind === "boulder") {
    const s = kind === "boulder" ? 1.6 : 1, pts = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI, rr = (0.8 + rnd(i) * 0.25) * s; pts.push([Math.cos(a) * rr * 0.9, Math.sin(a) * rr * 0.62]); }
    const p = S([[-0.8 * s, 0.02]].concat(pts.slice(1, -1), [[0.8 * s, 0.02]]));
    K.fill(c, p, stone, w, { R, dx: -0.2 * R * s, dy: -0.15 * R * s, box: [-1.5 * R * s, -R * s, 1.5 * R * s, 0.1 * R] });
    ln([[0.1 * s, -0.55 * s], [0.25 * s, -0.3 * s], [0.18 * s, -0.08 * s]], 0.5);
    ln([[-0.45 * s, -0.25 * s], [-0.25 * s, -0.4 * s]], 0.45);
  } else if (kind === "stump") {
    [-1, 1].forEach((k) => K.fill(c, S([[k * 0.25, -0.05], [k * 0.7, 0.02], [k * 0.65, 0.06], [k * 0.2, 0.05]]), bark, w * 0.8, { R, hatch: false }));
    K.fill(c, S([[-0.45, 0.02], [-0.42, -0.5], [0.42, -0.5], [0.45, 0.02]]), bark, w, { R, box: [-R, -R, R, 0.1 * R] });
    ln([[-0.2, -0.45], [-0.18, -0.05]], 0.45); ln([[0.15, -0.45], [0.18, -0.08]], 0.45);
    K.paint(c, K.ell(0, -0.5 * R, 0.42 * R, 0.12 * R), night ? "#8a7a5a" : "#d8b88a", w * 0.8);
    [0.26, 0.13].forEach((k) => { c.lineWidth = w * 0.4; c.strokeStyle = ol; c.stroke(K.ell(0, -0.5 * R, k * R, k * 0.3 * R)); });
  } else if (kind === "log") {
    const p = S([[-1.1, -0.42], [0.95, -0.42], [0.95, -0.42], [0.95, 0.02], [0.95, 0.02], [-1.1, 0.02], [-1.1, 0.02], [-1.1, -0.42]]);
    K.fill(c, p, bark, w, { R, box: [-1.2 * R, -0.5 * R, 1.2 * R, 0.1 * R] });
    for (let i = 0; i < 4; i++) { const x = -0.9 + i * 0.45; ln([[x, -0.32], [x + 0.25, -0.3]], 0.4); }
    K.paint(c, K.ell(0.95 * R, -0.2 * R, 0.13 * R, 0.22 * R), night ? "#8a7a5a" : "#d8b88a", w * 0.8);
    c.lineWidth = w * 0.4; c.strokeStyle = ol; c.stroke(K.ell(0.95 * R, -0.2 * R, 0.06 * R, 0.11 * R));
    ln([[-0.3, -0.42], [-0.2, -0.62]], 0.8, bark);
  } else {
    const col = night ? "#4a5a40" : (st.ground && st.ground.grass) || "#6d8a3f";
    const n = 9;
    for (let i = 0; i < n; i++) { const x = -0.7 + i * 0.17, h = 0.45 + rnd(i) * 0.4, lean = (rnd(i + 9) - 0.5) * 0.3; K.fill(c, S([[x - 0.06, 0], [x + lean, -h], [x + 0.06, 0]]), K.shade(col, 0.9 + rnd(i + 20) * 0.2), w * 0.6, { R, hatch: false }); }
  }
  c.restore();
  return true;
}`;
