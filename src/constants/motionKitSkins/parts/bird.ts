// Birds for every skin, side view (units of R, ground y = 0, head toward +x): poultry (chicken, rooster, duck, goose),
// and wild birds (dove, crow, eagle, vulture, owl, peacock, crane). pose "fly" spreads the wings and lifts the bird off
// its ground point; other poses stand.
export const MOTION_KIT_BIRD_KINDS = ["chicken", "rooster", "duck", "goose", "dove", "crow", "eagle", "vulture", "owl", "peacock", "crane"];
export const SKIN_PART_BIRD = `(c, o, K) => {
  const SP = {
    chicken: { L: 0.95, H: 0.8, leg: 0.32, neck: 0.22, head: 0.2, col: "#e8dcc4", wing: "#d4c4a6", beak: "#e0a83a", comb: "#c83a2e", tail: "fan", legCol: "#e0a83a" },
    rooster: { L: 1.05, H: 0.9, leg: 0.4, neck: 0.32, head: 0.22, col: "#b8562e", wing: "#6a3a22", beak: "#e0a83a", comb: "#d23a2e", tail: "plume", tailCol: "#1e3a2a", legCol: "#e0a83a" },
    duck: { L: 1.1, H: 0.6, leg: 0.18, neck: 0.3, head: 0.2, col: "#f2eee4", wing: "#dcd4c4", beak: "#e8a030", tail: "point", legCol: "#e8a030", flat: 1 },
    goose: { L: 1.3, H: 0.75, leg: 0.24, neck: 0.62, head: 0.2, col: "#eeeae0", wing: "#d6d0c4", beak: "#e8902a", tail: "point", legCol: "#e8902a", flat: 1 },
    dove: { L: 0.75, H: 0.5, leg: 0.14, neck: 0.12, head: 0.16, col: "#c8ccd4", wing: "#a8aeba", beak: "#6a6a70", tail: "point", legCol: "#c86a6a" },
    crow: { L: 0.85, H: 0.55, leg: 0.2, neck: 0.12, head: 0.17, col: "#2a2a30", wing: "#1c1c22", beak: "#2a2a30", tail: "point", legCol: "#2a2a30", big: 1 },
    eagle: { L: 1.3, H: 0.95, leg: 0.3, neck: 0.15, head: 0.22, col: "#5a3e28", wing: "#4a321e", beak: "#e0b030", hood: "#f2eee4", tail: "point", legCol: "#e0b030", hook: 1 },
    vulture: { L: 1.3, H: 0.95, leg: 0.3, neck: 0.32, head: 0.17, col: "#3a3230", wing: "#2a2422", beak: "#c8b8a0", ruff: "#e8e0d0", face: "#d89a8a", tail: "point", legCol: "#8a8078", hook: 1 },
    owl: { L: 0.85, H: 1.0, leg: 0.12, neck: 0, head: 0.34, col: "#8a6a48", wing: "#6a4e34", beak: "#d8b040", tail: "short", legCol: "#d8b040", owl: 1 },
    peacock: { L: 1.1, H: 0.85, leg: 0.42, neck: 0.42, head: 0.16, col: "#2a5aa8", wing: "#3a6a5a", beak: "#5a5a5a", crest: "#2a5aa8", tail: "train", legCol: "#8a8078" },
    crane: { L: 1.2, H: 0.7, leg: 1.0, neck: 0.7, head: 0.17, col: "#f2f0ea", wing: "#2a2a30", beak: "#7a7a5a", cap: "#c8302a", tail: "point", legCol: "#3a3a3a" },
  };
  const A = SP[o.kind];
  if (!A) return null;
  const st = K.S(), R = K.num(o.r, 30), w = K.LW(R / 1.6) * 0.9, ol = st.ol, t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const f = K.num(o.facing, 1) < 0 ? -1 : 1, fly = o.pose === "fly";
  const B = K.toneOf(o.color || A.col), Wg = K.toneOf(A.wing);
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const E = (x, y, a, b, r) => K.ell(x * R, y * R, a * R, b * R, r);
  const fl = (p, col) => K.fill(c, p, col, w, { R, box: [-2 * R, -3 * R, 2 * R, 0.2 * R] });
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.6), col || ol);
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(f, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  const lift = fly ? A.leg + 0.6 : 0, bodyY = -A.leg - A.H * 0.45 - lift, peck = !fly && o.pose === "eat" ? 1 : 0;
  if (!fly) { K.shadow(c, E(0, 0.02, A.L * 0.55, 0.06), 0.18, 0.06 * R); }
  // Legs (standing): thin, two-jointed, toes forward.
  if (!fly && A.leg > 0) [-0.08, 0.1].forEach((dx, i) => { const x = dx * A.L; ln([[x, bodyY + A.H * 0.3], [x - 0.02, -A.leg * 0.45], [x + 0.03, 0]], 0.9, K.toneOf(A.legCol)); ln([[x - 0.08, 0], [x + 0.14, 0]], 0.8, K.toneOf(A.legCol)); });
  // Tail behind the body.
  const tx = -A.L * 0.48, ty = bodyY - A.H * 0.05;
  if (A.tail === "fan") fl(S([[tx + 0.1, ty - 0.05], [tx - 0.2, ty - 0.4], [tx - 0.12, ty + 0.15]]), Wg);
  if (A.tail === "plume") { const col = K.toneOf(A.tailCol || A.wing); [0, 1, 2].forEach((i) => ln([[tx + 0.1, ty], [tx - 0.15 - i * 0.05, ty - 0.45 + i * 0.12], [tx - 0.05 - i * 0.08, ty - 0.75 + i * 0.2]], 3.2 - i * 0.6, col)); }
  if (A.tail === "point") fl(P([[tx + 0.15, ty - 0.08], [tx - 0.3, ty + 0.02], [tx + 0.15, ty + 0.14]]), Wg);
  if (A.tail === "train") { const p = S([[tx + 0.2, ty - 0.1], [tx - 1.4, ty + 0.1 + A.leg * 0.6], [tx - 1.5, ty + 0.35 + A.leg * 0.6], [tx + 0.2, ty + 0.18]]); fl(p, K.toneOf("#3a6a4a")); for (let i = 0; i < 5; i++) { const ex = tx - 0.3 - i * 0.24, ey = ty + 0.12 + i * 0.07 * (1 + A.leg); c.fillStyle = K.toneOf("#c8a83a"); c.fill(E(ex, ey, 0.07, 0.06)); c.fillStyle = K.toneOf("#1e3a8a"); c.fill(E(ex, ey, 0.035, 0.03)); } }
  // Far wing when flying.
  const flap = fly ? Math.sin(t * 9 + K.num(o.seed, 0)) : 0;
  if (fly) fl(S([[-0.05, bodyY - 0.1], [-0.35, bodyY - 0.55 - 0.35 * flap], [0.25, bodyY - 0.95 - 0.4 * flap], [0.2, bodyY - 0.1]]), K.shade(Wg, 0.85));
  // Body.
  const body = S([[-A.L * 0.48, bodyY - A.H * 0.05], [-A.L * 0.25, bodyY - A.H * (A.flat ? 0.38 : 0.48)], [A.L * 0.25, bodyY - A.H * (A.flat ? 0.36 : 0.45)], [A.L * 0.45, bodyY - A.H * 0.15], [A.L * 0.3, bodyY + A.H * 0.4], [-A.L * 0.2, bodyY + A.H * 0.42]]);
  fl(body, B);
  // Neck and head.
  const hx = A.owl ? 0.05 : A.L * 0.38 + A.neck * 0.35, hy = A.owl ? bodyY - A.H * 0.55 : bodyY - A.H * 0.35 - A.neck + peck * (A.neck + 0.4);
  if (A.neck > 0) { const nk = S([[A.L * 0.2, bodyY - A.H * 0.3], [hx - A.head * 0.6, hy], [hx + A.head * 0.5, hy + 0.05], [A.L * 0.42, bodyY - A.H * 0.05]]); fl(nk, A.ruff && !A.owl ? K.toneOf(A.ruff) : B); }
  if (A.ruff) fl(E(A.L * 0.28, bodyY - A.H * 0.3, 0.2, 0.14), K.toneOf(A.ruff));
  fl(E(hx, hy, A.head, A.head * (A.owl ? 0.85 : 0.9)), A.face ? K.toneOf(A.face) : A.hood ? K.toneOf(A.hood) : B);
  // Beak.
  const bx = hx + A.head * (A.owl ? 0.2 : 0.85), by = hy + A.head * (A.owl ? 0.2 : 0.1), bl = A.flat ? 0.28 : A.big ? 0.24 : A.hook ? 0.2 : A.owl ? 0.08 : 0.15;
  if (A.flat) fl(S([[bx - 0.04, by - 0.06], [bx + bl, by - 0.02], [bx + bl, by + 0.05], [bx - 0.04, by + 0.06]]), K.toneOf(A.beak));
  else if (A.hook) fl(S([[bx - 0.04, by - 0.08], [bx + bl * 0.7, by - 0.06], [bx + bl, by + 0.06], [bx + bl * 0.6, by + 0.04], [bx - 0.04, by + 0.06]]), K.toneOf(A.beak));
  else fl(P([[bx - 0.03, by - 0.06], [bx + bl, by], [bx - 0.03, by + 0.06]]), K.toneOf(A.beak));
  // Comb, wattle, crest, cap.
  if (A.comb) { fl(S([[hx - 0.12, hy - A.head * 0.7], [hx - 0.08, hy - A.head * 1.5], [hx, hy - A.head * 1.1], [hx + 0.06, hy - A.head * 1.55], [hx + 0.13, hy - A.head * 0.75]]), K.toneOf(A.comb)); fl(E(bx - 0.02, by + 0.13, 0.05, 0.08), K.toneOf(A.comb)); }
  if (A.crest) for (let i = 0; i < 3; i++) { const x = hx - 0.06 + i * 0.06; ln([[x, hy - A.head * 0.8], [x - 0.04, hy - A.head * 1.8]], 0.4); c.fillStyle = K.toneOf(A.crest); c.fill(E(x - 0.04, hy - A.head * 1.85, 0.03, 0.03)); }
  if (A.cap) { c.fillStyle = K.toneOf(A.cap); c.fill(E(hx, hy - A.head * 0.7, A.head * 0.45, A.head * 0.25)); }
  // Eye.
  const ex = hx + A.head * (A.owl ? 0.25 : 0.35), ey = hy - A.head * (A.owl ? 0.1 : 0.2);
  if (A.owl) { [-0.12, 0.12].forEach((d) => { c.fillStyle = K.toneOf("#f2e6b0"); c.fill(E(ex + d, ey, 0.1, 0.1)); c.fillStyle = ol; c.fill(E(ex + d, ey, 0.05, 0.05)); }); }
  else { c.fillStyle = ol; c.fill(E(ex, ey, 0.035 + A.head * 0.08, 0.035 + A.head * 0.08)); }
  // Near wing.
  if (fly) fl(S([[-0.15, bodyY], [-0.5, bodyY - 0.5 - 0.45 * flap], [0.2, bodyY - 1.05 - 0.5 * flap], [0.25, bodyY - 0.05]]), Wg);
  else fl(S([[-A.L * 0.32, bodyY - A.H * 0.12], [A.L * 0.05, bodyY - A.H * 0.3], [A.L * 0.25, bodyY - A.H * 0.05], [-A.L * 0.05, bodyY + A.H * 0.25], [-A.L * 0.42, bodyY + A.H * 0.05]]), Wg);
  if (!fly) for (let i = 0; i < 3; i++) ln([[-A.L * 0.3 + i * 0.12, bodyY + A.H * 0.02], [-A.L * 0.15 + i * 0.12, bodyY + A.H * 0.15]], 0.35);
  c.restore();
  return { head: [K.num(o.x, 0) + f * hx * R, K.num(o.y, 0) + hy * R] };
}`;
