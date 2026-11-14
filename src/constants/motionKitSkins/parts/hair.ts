// Hair for the sketch and comic skins, traced from the reference videos: a tufted cap that follows the skull,
// a jagged fringe over the forehead and short sideburns (video 2 GIs, video 1 legionaries).
// Hooks: skinPart('hair', kind, c, {o, hx, hy, r, side: 'back' | 'front'}). Back draws long hair, braids and buns behind the head; front draws the cap.
export const SKIN_PART_HAIR = `(c, a, K) => {
  const { o, hx, hy, r } = a;
  const st = K.S(), h = o.hair || "short", w = K.LW(r), col = o.hairColor || "#3a2a20";
  const P = (pts) => K.smooth(pts.map((q) => [hx + q[0] * r, hy + q[1] * r]), true);
  const box = [hx - 1.5 * r, hy - 1.5 * r, hx + 1.5 * r, hy + 1.6 * r];
  const seed = K.num(o.seed, 3);
  if (a.side === "back") {
    if (h === "long" || h === "braids") K.fill(c, P([[-1.0, -0.2], [-1.12, 0.6], [-0.95, 1.35], [-0.4, 1.45], [0.4, 1.45], [0.95, 1.35], [1.12, 0.6], [1.0, -0.2], [0, -1.1]]), col, w, { R: r, box });
    if (h === "bob") K.fill(c, P([[-1.05, -0.2], [-1.12, 0.55], [-0.9, 0.85], [0.9, 0.85], [1.12, 0.55], [1.05, -0.2], [0, -1.12]]), col, w, { R: r, box });
    if (h === "bun") K.fill(c, K.ell(hx - 0.25 * r, hy - 1.0 * r, 0.42 * r, 0.36 * r), col, w, { R: r * 0.5, box });
    if (h === "braids") [-1, 1].forEach((k) => { for (let i = 0; i < 5; i++) K.paint(c, K.ell(hx + k * 0.9 * r, hy + (0.7 + i * 0.24) * r, 0.14 * r, 0.13 * r), col, w * 0.7); });
    return true;
  }
  const top = [];
  const n = h === "spiky" ? 9 : 7;
  for (let i = 0; i <= n; i++) {
    const t = Math.PI * (1.04 + 0.92 * i / n), out = h === "spiky" ? (i % 2 ? 1.06 : 1.32) : (i % 2 ? 1.04 : 1.13) + K.rnd(seed, i) * 0.04;
    top.push([Math.cos(t) * out, Math.sin(t) * out * 0.98]);
  }
  const fringe = [[1.0, -0.08], [0.92, 0.22], [0.82, -0.18], [0.55, -0.38], [0.42, -0.2], [0.18, -0.46], [0.02, -0.26], [-0.22, -0.48], [-0.38, -0.25], [-0.6, -0.4], [-0.78, -0.12], [-0.9, 0.24], [-1.0, -0.08]];
  const p = P(top.concat(fringe));
  K.fill(c, p, col, w, { R: r, dx: -0.15 * r, dy: -0.22 * r, box, gap: w * 1.2 });
  c.save(); c.clip(p); c.strokeStyle = st.ol; c.lineWidth = w * 0.45; c.lineCap = "round";
  for (let i = 0; i < 4; i++) { const x = -0.55 + i * 0.36; c.beginPath(); c.moveTo(hx + x * r, hy - 0.95 * r); c.quadraticCurveTo(hx + (x + 0.12) * r, hy - 0.7 * r, hx + (x + 0.05) * r, hy - 0.45 * r); c.stroke(); }
  c.restore();
  if (h === "long" || h === "bob" || h === "braids") [-1, 1].forEach((k) => K.fill(c, P([[k * 0.98, -0.1], [k * 1.08, 0.5], [k * 0.98, h === "bob" ? 0.8 : 1.2], [k * 0.8, h === "bob" ? 0.65 : 1.0], [k * 0.86, 0.2]]), col, w, { R: r, box, hatch: false }));
  return true;
}`;
