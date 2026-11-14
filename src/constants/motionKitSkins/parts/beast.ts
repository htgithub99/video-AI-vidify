export const SKIN_PART_BEAST = `(c, o, K) => {
  const SP = {
    ox: { l: 4.6, h: 3.3, d: 1.6, n: 0.5, hd: 1.0, col: "#6b4a30", horn: 0.8 },
    cow: { l: 4.4, h: 3.1, d: 1.5, n: 0.5, hd: 0.95, col: "#f1efe8", spots: "#2a2420", horn: 0.4 },
    buffalo: { l: 4.6, h: 3.0, d: 1.6, n: 0.4, hd: 1.0, col: "#3b3632", horn: 1.3 },
    dog: { l: 2.4, h: 1.6, d: 0.7, n: 0.55, hd: 0.6, col: "#8a5a32", ear: 1, tail: 1 },
    wolf: { l: 2.7, h: 1.8, d: 0.8, n: 0.6, hd: 0.65, col: "#7a7570", ear: 1, tail: 1 },
    fox: { l: 2.1, h: 1.2, d: 0.6, n: 0.45, hd: 0.55, col: "#c0642a", ear: 1, tail: 1.4 },
    cat: { l: 1.6, h: 1.0, d: 0.5, n: 0.35, hd: 0.45, col: "#8a7a6a", ear: 1, tail: 1.2 },
    sheep: { l: 2.4, h: 1.7, d: 1.0, n: 0.35, hd: 0.55, col: "#ebe6da", wool: 1, face: "#3a3430" },
    goat: { l: 2.2, h: 1.8, d: 0.8, n: 0.55, hd: 0.55, col: "#b8a68a", horn: 0.5, beard: 1 },
    pig: { l: 2.4, h: 1.3, d: 1.0, n: 0.1, hd: 0.6, col: "#e2a6a0", snout: 1 },
    boar: { l: 2.5, h: 1.5, d: 1.0, n: 0.1, hd: 0.65, col: "#4a3a2e", snout: 1, tusk: 1 },
    deer: { l: 3.2, h: 2.6, d: 0.9, n: 1.0, hd: 0.6, col: "#9a6a3c", antler: 1, ear: 1 },
  };
  const A = Object.assign({}, SP[o.kind]);
  A.hd *= 1.25;
  if (!SP[o.kind] || o.rider || o.pose === "lie" || o.pose === "sit" || K.viewOf(o) !== "side") return null;
  const R = K.num(o.r, 30) * 0.62, f = o.facing === -1 ? -1 : 1, t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const col = o.color || A.col, dark = K.shade(col, 0.72), w = K.LW(R);
  const L = A.l * R, H = A.h * R, D = A.d * R, top = -H, bot = -H + D;
  const mv = o.pose === "walk" || o.pose === "run" ? Math.sin(t * (o.pose === "run" ? 10 : 5) + K.num(o.seed, 0)) : 0;
  const lw = 0.12 * H;
  c.save();
  c.translate(o.x, o.y);
  c.scale(f, 1);
  c.fillStyle = "rgba(20,16,12,0.18)";
  c.fill(K.ell(0, 0, L * 0.55, 0.12 * R));
  if (A.tail) K.tube(c, [[-L / 2, top + D * 0.2], [-L / 2 - 0.4 * R * A.tail, top - 0.1 * R], [-L / 2 - 0.7 * R * A.tail, top + 0.2 * R]], lw * 0.55, col, R);
  else K.line(c, [[-L / 2, top + D * 0.2], [-L / 2 - 0.25 * R, top + D * 0.9]], w * 1.6, dark);
  [[-L / 2 + 0.3 * D, dark, 1], [L / 2 - 0.35 * D, dark, -1], [-L / 2 + 0.55 * D, col, -1], [L / 2 - 0.1 * D, col, 1]].forEach(([lx, cc, ph]) => {
    const sw = mv * 0.25 * H * ph;
    K.tube(c, [[lx, bot - 0.2 * D], [lx + sw * 0.4, (bot + 0) / 2], [lx + sw, -0.08 * R]], lw, cc, R);
    K.paint(c, K.smooth([[lx + sw - lw * 0.6, -0.12 * R], [lx + sw + lw * 0.6, -0.12 * R], [lx + sw + lw * 0.65, 0], [lx + sw - lw * 0.6, 0]], true), "#2c2a2e", w * 0.8);
  });
  const body = K.smooth([[-L / 2, top + D * 0.3], [-L * 0.35, top], [L * 0.3, top - 0.03 * D], [L / 2, top + D * 0.25], [L / 2, bot - D * 0.1], [L * 0.2, bot], [-L * 0.3, bot], [-L / 2, bot - D * 0.25]], true);
  K.paint(c, body, col, w);
  if (A.spots) [[-0.25, 0.3], [0.05, 0.55], [0.25, 0.25]].forEach(([u, v]) => { c.save(); c.clip(body); c.fillStyle = K.toneOf(A.spots); c.fill(K.ell(u * L, top + v * D, 0.18 * L, 0.3 * D)); c.restore(); });
  if (A.wool) for (let i = 0; i < 9; i++) K.paint(c, K.ell(-L * 0.38 + (i % 5) * L * 0.18, top + (i < 5 ? 0.15 : 0.55) * D, 0.16 * L, 0.28 * D), col, w * 0.6);
  const nx = L / 2 - 0.1 * L, ny = top + 0.15 * D, hx = nx + 0.25 * A.hd * R + 0.15 * R, hy = top - A.n * R;
  K.paint(c, K.smooth([[nx - 0.35 * D, ny + 0.3 * D], [nx - 0.1 * D, ny - 0.1 * D], [hx - 0.1 * R, hy - 0.2 * R], [hx + 0.15 * R, hy], [nx + 0.25 * D, ny + 0.5 * D]], true), col, w);
  const hc = A.face || col;
  const head = K.smooth([[hx - 0.35 * A.hd * R, hy - 0.35 * A.hd * R], [hx + 0.2 * A.hd * R, hy - 0.4 * A.hd * R], [hx + 1.05 * A.hd * R, hy + 0.05 * A.hd * R], [hx + 1.05 * A.hd * R, hy + 0.4 * A.hd * R], [hx + 0.3 * A.hd * R, hy + 0.5 * A.hd * R], [hx - 0.35 * A.hd * R, hy + 0.25 * A.hd * R]], true);
  if (A.ear) K.paint(c, K.smooth([[hx - 0.2 * R, hy - 0.25 * A.hd * R], [hx - 0.1 * R, hy - 0.9 * A.hd * R], [hx + 0.15 * R, hy - 0.3 * A.hd * R]], true), dark, w * 0.8);
  if (A.horn) K.line(c, [[hx - 0.05 * R, hy - 0.3 * A.hd * R], [hx - 0.3 * R * A.horn, hy - 0.7 * R * A.horn], [hx - 0.1 * R * A.horn, hy - 0.95 * R * A.horn]], Math.max(2, 0.12 * R), "#d9cfb8");
  if (A.antler) [[0, 1], [0.25, 0.7]].forEach(([dx, k]) => K.line(c, [[hx + dx * R, hy - 0.3 * A.hd * R], [hx + dx * R - 0.2 * R, hy - 1.1 * R * k], [hx + dx * R - 0.5 * R, hy - 1.4 * R * k]], Math.max(2, 0.08 * R), "#6a4a2c"));
  K.paint(c, head, hc, w);
  if (A.snout) K.paint(c, K.ell(hx + 1.05 * A.hd * R, hy + 0.22 * A.hd * R, 0.12 * R, 0.16 * R), K.shade(hc, 0.85), w * 0.7);
  if (A.tusk) K.line(c, [[hx + 0.85 * A.hd * R, hy + 0.45 * A.hd * R], [hx + 1.0 * A.hd * R, hy + 0.1 * A.hd * R]], Math.max(2, 0.07 * R), "#efe8d8");
  if (A.beard) K.paint(c, K.smooth([[hx + 0.6 * A.hd * R, hy + 0.45 * A.hd * R], [hx + 0.75 * A.hd * R, hy + 0.9 * A.hd * R], [hx + 0.85 * A.hd * R, hy + 0.45 * A.hd * R]], true), K.shade(col, 0.8), w * 0.6);
  c.fillStyle = "#14141c";
  c.fill(K.ell(hx + 0.25 * A.hd * R, hy - 0.02 * R, Math.max(1.5, 0.06 * R), Math.max(1.5, 0.06 * R)));
  c.restore();
  return true;
}`;
