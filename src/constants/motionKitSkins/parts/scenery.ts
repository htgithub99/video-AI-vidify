export const SKIN_PART_SCENERY = `(c, o, K) => {
  const kind = o.kind;
  if (["rock", "boulder", "stump", "log", "grass"].indexOf(kind) < 0) return null;
  const st = K.S(), R = K.num(o.r, 40), w = Math.min(K.LW(R), K.LW(60)), ol = st.ol, night = K.NIGHT(), rnd = (i) => K.rnd(K.num(o.seed, 2), i);
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const P = (pts) => { const q = new Path2D(); pts.forEach(([x, y], i) => (i ? q.lineTo(x * R, y * R) : q.moveTo(x * R, y * R))); q.closePath(); return q; };
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const stone = o.color ? K.toneOf(o.color) : night ? "#7e7a76" : "#9e9890", bark = night ? "#4f4136" : "#7a5638";
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (kind !== "grass") { K.shadow(c, K.ell(0, 0.02 * R, (kind === "boulder" ? 1.3 : kind === "log" ? 1.2 : 0.8) * R, 0.1 * R), 0.2, 0.1 * R); }
  if (kind === "rock" || kind === "boulder") {
    const s = kind === "boulder" ? 1.6 : 1, pts = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI, rr = (0.8 + rnd(i) * 0.25) * s; pts.push([Math.cos(a) * rr * 0.9, Math.sin(a) * rr * 0.62]); }
    const p = S([[-0.8 * s, 0.02]].concat(pts.slice(1, -1), [[0.8 * s, 0.02]]));
    K.fill(c, p, stone, w, { R, dx: -0.2 * R * s, dy: -0.15 * R * s, box: [-1.5 * R * s, -R * s, 1.5 * R * s, 0.1 * R] });
    ln([[0.1 * s, -0.55 * s], [0.25 * s, -0.3 * s], [0.18 * s, -0.08 * s]], 0.5);
    ln([[-0.45 * s, -0.25 * s], [-0.25 * s, -0.4 * s]], 0.45);
  } else if (kind === "stump") {
    // A cut trunk: straight, slightly flaring sides, roots spreading into the ground, a flat cut face with rings and a crack.
    const wood = night ? "#8a7a5a" : "#d8b88a";
    [[-1, 0.32, 0.78], [1, 0.3, 0.72], [-1, 0.1, 0.42]].forEach(([k, at, out], i) => K.fill(c, S([[k * at, -0.22], [k * (at + 0.18), -0.12], [k * out, 0.02], [k * (at - 0.02), 0.03]]), K.shade(bark, 0.9 + i * 0.05), w * 0.8, { R, hatch: false }));
    K.fill(c, P([[-0.47, 0.02], [-0.4, -0.52], [0.4, -0.52], [0.47, 0.02]]), bark, w, { R, box: [-R, -R, R, 0.1 * R] });
    [-0.24, -0.02, 0.2].forEach((x, i) => ln([[x, -0.46], [x + 0.02 * (i - 1), -0.24], [x + 0.03 * (i - 1), -0.04]], 0.4));
    K.paint(c, K.ell(0, -0.52 * R, 0.4 * R, 0.11 * R), wood, w * 0.8);
    [0.27, 0.15, 0.05].forEach((k) => { c.lineWidth = w * 0.35; c.strokeStyle = ol; c.stroke(K.ell(0.02 * R, -0.52 * R, k * R, k * 0.27 * R)); });
    ln([[0.02, -0.52], [0.3, -0.56]], 0.4);
  } else if (kind === "log") {
    // A felled trunk: a long cylinder (rounded far end, end grain toward the viewer's side), bark grooves along it, a cut branch.
    const wood = night ? "#8a7a5a" : "#d8b88a", p = new Path2D();
    p.moveTo(0.95 * R, -0.42 * R); p.lineTo(-1.0 * R, -0.42 * R); p.ellipse(-1.0 * R, -0.2 * R, 0.12 * R, 0.22 * R, 0, -Math.PI / 2, Math.PI / 2, true); p.lineTo(0.95 * R, 0.02 * R); p.closePath();
    K.fill(c, p, bark, w, { R, box: [-1.2 * R, -0.5 * R, 1.2 * R, 0.1 * R] });
    [-0.31, -0.2, -0.09].forEach((y, i) => { const x0 = -0.85 + rnd(i) * 0.25; ln([[x0, y], [x0 + 0.35, y + 0.015], [x0 + 0.6, y - 0.01]], 0.38); });
    [-0.34, -0.12].forEach((y, i) => { const x0 = 0.05 + rnd(i + 4) * 0.25; ln([[x0, y], [x0 + 0.45, y + 0.01]], 0.38); });
    K.paint(c, K.ell(0.95 * R, -0.2 * R, 0.13 * R, 0.22 * R), wood, w * 0.8);
    [0.08, 0.035].forEach((k) => { c.lineWidth = w * 0.35; c.strokeStyle = ol; c.stroke(K.ell(0.95 * R, -0.2 * R, k * R, k * 1.7 * R)); });
    K.fill(c, P([[-0.32, -0.41], [-0.24, -0.62], [-0.17, -0.6], [-0.22, -0.41]]), bark, w * 0.7, { R, hatch: false });
    K.paint(c, K.ell(-0.205 * R, -0.61 * R, 0.035 * R, 0.02 * R), wood, w * 0.5);
  } else {
    const col = night ? "#4a5a40" : (st.ground && st.ground.grass) || "#6d8a3f";
    const n = 9;
    for (let i = 0; i < n; i++) { const x = -0.7 + i * 0.17, h = 0.45 + rnd(i) * 0.4, lean = (rnd(i + 9) - 0.5) * 0.3; K.fill(c, S([[x - 0.06, 0], [x + lean, -h], [x + 0.06, 0]]), K.shade(col, 0.9 + rnd(i + 20) * 0.2), w * 0.6, { R, hatch: false }); }
  }
  c.restore();
  return true;
}`;
