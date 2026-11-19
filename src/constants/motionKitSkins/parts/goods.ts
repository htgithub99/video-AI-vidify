export const MOTION_KIT_GOODS_KINDS = ["bread", "meat", "fish", "cheese", "planks", "bundle", "backpack", "carryingPole", "tray", "teapot", "cup", "palanquin"];
export const SKIN_PART_GOODS = `(c, o, K) => {
  const kind = o.kind;
  if (${JSON.stringify(MOTION_KIT_GOODS_KINDS)}.indexOf(kind) < 0) return null;
  const st = K.S(), R = K.num(o.r, 30), w = K.LW(R), ol = st.ol, night = K.NIGHT();
  const rnd = (i) => K.rnd(K.num(o.seed, 4), i);
  const wood = K.toneOf(night ? "#5e4a3a" : "#8a6444"), crust = K.toneOf(night ? "#8a6a3a" : "#c88a44"), flesh = K.toneOf(night ? "#8a4a44" : "#b8564a"), fat = K.toneOf("#ecd8c4"), scale = K.toneOf(night ? "#6a7e8a" : "#8fb0c0"), cloth = K.toneOf(o.color || (night ? "#7a6e5c" : "#b89a6a")), straw = K.toneOf(night ? "#8a7a50" : "#c9a45a"), clay = K.toneOf(night ? "#6e4a3a" : "#a8643e"), red = K.toneOf("#9a3a30"), iron = K.toneOf("#5a5c62");
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const E = (x, y, a, b) => K.ell(x * R, y * R, a * R, b * R);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-2.5 * R, -3.5 * R, 2.5 * R, 0.3 * R] }, k || {}));
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, col || wood); };
  const basket = (x, y, s) => { fl(S([[x - 0.55 * s, y - 0.75 * s], [x + 0.55 * s, y - 0.75 * s], [x + 0.45 * s, y], [x - 0.45 * s, y]]), straw); for (let i = 1; i < 4; i++) ln([[x - 0.52 * s, y - 0.75 * s + i * 0.19 * s], [x + 0.52 * s, y - 0.75 * s + i * 0.19 * s]], 0.35); };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  K.shadow(c, E(0, 0.02, kind === "palanquin" ? 2.2 : kind === "carryingPole" ? 1.6 : 0.8, 0.1), 0.18, 0.1 * R);
  switch (kind) {
    case "bread": fl(S([[-0.75, 0], [-0.8, -0.3], [-0.4, -0.55], [0.4, -0.55], [0.8, -0.3], [0.75, 0]]), crust); [-0.35, 0, 0.35].forEach((x) => ln([[x - 0.12, -0.5], [x + 0.12, -0.3]], 0.6, K.shade(crust, 0.7))); break;
    case "meat": ln([[0, -2.2], [0, -1.95]], 0.6, iron); ln([[0, -1.95], [0.12, -1.85], [0, -1.75]], 0.6, iron); fl(S([[-0.35, -1.8], [0.35, -1.8], [0.55, -1.2], [0.45, -0.4], [0.1, 0], [-0.1, 0], [-0.45, -0.4], [-0.55, -1.2]]), flesh); for (let i = 0; i < 4; i++) ln([[-0.35, -1.5 + i * 0.3], [0.35, -1.45 + i * 0.3]], 0.5, fat); break;
    case "fish": fl(S([[-0.85, -0.25], [-0.3, -0.5], [0.45, -0.42], [0.75, -0.25], [0.45, -0.06], [-0.3, -0.02]]), scale); fl(P([[0.7, -0.25], [1.05, -0.5], [1.0, -0.25], [1.05, 0.0]]), K.shade(scale, 0.85)); c.fillStyle = ol; c.fill(E(-0.55, -0.3, 0.05, 0.05)); for (let i = 0; i < 3; i++) ln([[-0.1 + i * 0.22, -0.4], [0.0 + i * 0.22, -0.14]], 0.35); break;
    case "cheese": fl(S([[-0.7, 0], [-0.7, -0.45], [0, -0.55], [0.7, -0.45], [0.7, 0]]), K.toneOf("#e8c45a")); ln([[-0.7, -0.45], [0, -0.35], [0.7, -0.45]], 0.5); [[-0.3, -0.18], [0.25, -0.22]].forEach(([x, y]) => { c.fillStyle = K.toneOf("#c9a03a"); c.fill(E(x, y, 0.08, 0.06)); }); break;
    case "planks": for (let i = 0; i < 4; i++) { const y = -0.18 * i; fl(P([[-1.4 + rnd(i) * 0.15, y - 0.18], [1.4 - rnd(i + 5) * 0.15, y - 0.18], [1.4 - rnd(i + 5) * 0.15, y], [-1.4 + rnd(i) * 0.15, y]]), K.shade(wood, 0.95 + rnd(i + 9) * 0.15), { hatch: false }); } break;
    case "bundle": beam([[-1.1, -1.6], [0.6, -0.95]], 0.07); fl(S([[0.35, -1.25], [0.95, -1.45], [1.2, -0.95], [0.95, -0.55], [0.45, -0.6], [0.3, -0.95]]), cloth); ln([[0.62, -1.4], [0.55, -0.98]], 0.6); break;
    case "backpack": fl(S([[-0.5, 0], [-0.55, -1.0], [-0.35, -1.25], [0.35, -1.25], [0.55, -1.0], [0.5, 0]]), cloth); fl(S([[-0.4, -0.55], [0.4, -0.55], [0.4, -0.15], [-0.4, -0.15]]), K.shade(cloth, 0.85)); ln([[-0.3, -1.25], [-0.2, -1.45], [0.2, -1.45], [0.3, -1.25]], 0.7); break;
    case "carryingPole": beam([[-1.5, -2.0], [1.5, -2.0]], 0.08); [-1.2, 1.2].forEach((x) => { ln([[x, -1.98], [x - 0.4, -0.75]], 0.4); ln([[x, -1.98], [x + 0.4, -0.75]], 0.4); basket(x, 0, 0.9); }); break;
    case "tray": fl(P([[-0.9, -0.1], [0.9, -0.1], [0.8, 0], [-0.8, 0]]), wood); [[-0.45, -0.1], [0.05, -0.1], [0.5, -0.1]].forEach(([x, y], i) => fl(E(x, y - 0.12, 0.2, 0.12), i === 1 ? crust : K.toneOf("#efe6cf"))); break;
    case "teapot": fl(S([[-0.5, 0], [-0.62, -0.4], [-0.4, -0.75], [0.4, -0.75], [0.62, -0.4], [0.5, 0]]), clay); fl(P([[0.55, -0.4], [0.95, -0.75], [1.0, -0.68], [0.6, -0.25]]), clay); ln([[-0.58, -0.6], [-0.85, -0.5], [-0.58, -0.25]], 0.8); fl(E(0, -0.8, 0.25, 0.08), K.shade(clay, 0.85)); fl(E(0, -0.9, 0.07, 0.06), K.shade(clay, 0.85)); break;
    case "cup": fl(P([[-0.32, -0.6], [0.32, -0.6], [0.24, 0], [-0.24, 0]]), K.toneOf("#ece4d4")); ln([[0.3, -0.48], [0.5, -0.4], [0.28, -0.18]], 0.7); break;
    case "palanquin": [-0.85, 0.85].forEach((x) => beam([[x, -1.1], [x, 0]], 0.09)); beam([[-2.4, -1.1], [2.4, -1.1]], 0.1); fl(P([[-1.0, -1.1], [1.0, -1.1], [1.0, -2.4], [-1.0, -2.4]]), red); fl(S([[-1.25, -2.4], [-1.0, -2.75], [0, -3.05], [1.0, -2.75], [1.25, -2.4]]), K.shade(red, 0.8)); fl(P([[-0.55, -2.15], [0.55, -2.15], [0.55, -1.35], [-0.55, -1.35]]), K.toneOf(night ? "#2a2420" : "#3a2e28"), { hatch: false }); ln([[-1.0, -1.75], [1.0, -1.75]], 0.4, K.toneOf("#c9a24a")); break;
  }
  c.restore();
  return true;
}`;
