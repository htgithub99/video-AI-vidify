// Hand tools and hand weapons for every skin, drawn lying along the ground (units of R, ground y = 0): the handle
// end at -x, the working end at +x, so the figure table can stand a long one up by turning it around its foot.
// Kinds: hammer, mallet, whetstone, sickle, scythe, hoe, pitchfork, shovel, pickaxe, saw, tongs, dagger, mace, halberd,
// crossbow, club, oar, fishingRod, broom, staff; long guns (arquebus, musket, rifle, carbine, bayonet: a rifle with its
// blade) and arrows (a sheaf stuck in the ground, drawn standing).
export const MOTION_KIT_TOOL_KINDS = ["hammer", "mallet", "whetstone", "sickle", "scythe", "hoe", "pitchfork", "shovel", "pickaxe", "saw", "tongs", "dagger", "mace", "halberd", "crossbow", "club", "oar", "fishingRod", "broom", "staff", "arquebus", "musket", "rifle", "carbine", "bayonet", "arrows"];
export const SKIN_PART_TOOL = `(c, o, K) => {
  const kind = o.kind;
  if (${JSON.stringify(MOTION_KIT_TOOL_KINDS)}.indexOf(kind) < 0) return null;
  const st = K.S(), R = K.num(o.r, 30), w = K.LW(R) * 0.8, ol = st.ol, night = K.NIGHT();
  const wood = K.toneOf(o.color || (night ? "#5e4a3a" : "#8a6444")), iron = K.toneOf(night ? "#55585e" : "#6e7278"), steel = K.toneOf(night ? "#8a8e96" : "#b9bec6"), stone = K.toneOf(night ? "#6e6a64" : "#8f8b83"), straw = K.toneOf(night ? "#9a8a5a" : "#d8bc6a"), cord = K.toneOf("#c9b07a");
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const fl = (p, col) => K.fill(c, p, col, w, { R, box: [-2.5 * R, -1.2 * R, 2.5 * R, 0.2 * R], hatch: false });
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, col || wood); };
  const handle = (x0, x1, wd) => beam([[x0, -0.1], [x1, -0.1]], wd || 0.12);
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  switch (kind) {
    case "hammer": handle(-1.1, 0.9); fl(P([[0.85, -0.42], [1.15, -0.42], [1.15, 0.02], [0.85, 0.02]]), iron); fl(P([[0.72, -0.34], [0.85, -0.34], [0.85, -0.06], [0.72, -0.06]]), iron); break;
    case "mallet": handle(-1.0, 0.8); fl(S([[0.72, -0.5], [1.32, -0.5], [1.36, -0.25], [1.32, 0.02], [0.72, 0.02], [0.68, -0.25]]), K.shade(wood, 1.1)); ln([[0.9, -0.48], [0.9, 0]], 0.4); ln([[1.14, -0.48], [1.14, 0]], 0.4); break;
    case "whetstone": { const slate = K.toneOf(night ? "#7a8088" : "#a9b0b6"); fl(S([[-0.56, -0.07], [-0.5, -0.27], [0, -0.31], [0.5, -0.28], [0.57, -0.07], [0.46, 0], [-0.46, 0]]), slate); ln([[-0.4, -0.22], [0.38, -0.24]], 0.35, K.shade(slate, 1.25)); c.fillStyle = K.shade(slate, 0.7); [[-0.25, -0.12], [0.05, -0.08], [0.3, -0.14], [-0.05, -0.18]].forEach(([x, y]) => c.fill(K.ell(x * R, y * R, 0.025 * R, 0.025 * R))); break; }
    case "sickle": handle(-0.9, 0.15, 0.14); fl(S([[0.12, -0.16], [0.6, -0.55], [1.05, -0.5], [1.2, -0.2], [1.0, -0.36], [0.6, -0.36], [0.2, -0.04]]), steel); break;
    case "scythe": handle(-2.2, 1.6, 0.1); beam([[-0.9, -0.1], [-0.75, -0.42]], 0.08); fl(S([[1.55, -0.16], [1.5, -0.5], [1.0, -0.82], [0.2, -0.9], [0.9, -0.66], [1.38, -0.36]]), steel); break;
    case "hoe": handle(-1.9, 1.3, 0.1); fl(P([[1.25, -0.22], [1.45, -0.22], [1.6, 0.0], [1.0, 0.0]]), iron); break;
    case "pitchfork": handle(-1.9, 1.0, 0.1); beam([[1.0, -0.36], [1.0, 0.16]], 0.07, iron); [-0.3, -0.1, 0.1].forEach((y) => beam([[1.0, y], [1.7, y - 0.02]], 0.05, iron)); break;
    case "shovel": handle(-1.8, 0.8, 0.1); beam([[-1.8, -0.24], [-1.8, 0.04]], 0.08); fl(S([[0.7, -0.38], [1.35, -0.42], [1.65, -0.1], [1.35, 0.22], [0.7, 0.18]]), iron); break;
    case "pickaxe": handle(-1.6, 1.0, 0.12); fl(S([[1.05, -0.12], [0.75, -0.55], [0.4, -0.95], [0.85, -0.62], [1.12, -0.32], [1.4, -0.62], [1.85, -0.95], [1.5, -0.55], [1.2, -0.12]]), iron); break;
    case "saw": beam([[-1.3, -0.2], [-0.9, -0.2]], 0.24); { const p = P([[-0.9, -0.38], [1.4, -0.28], [1.4, -0.08], [-0.9, -0.02]]); fl(p, steel); for (let i = 0; i < 12; i++) { const x = -0.85 + i * 0.19; ln([[x, -0.02], [x + 0.09, 0.06], [x + 0.18, -0.02]], 0.35); } } break;
    case "tongs": beam([[-1.0, -0.18], [0.7, -0.26]], 0.07, iron); beam([[-1.0, -0.06], [0.7, -0.02]], 0.07, iron); beam([[0.7, -0.26], [1.05, -0.2]], 0.08, iron); beam([[0.7, -0.02], [1.05, -0.08]], 0.08, iron); break;
    case "dagger": beam([[-0.7, -0.14], [-0.15, -0.14]], 0.14); beam([[-0.15, -0.38], [-0.15, 0.1]], 0.07, iron); fl(P([[-0.1, -0.24], [0.9, -0.15], [-0.1, -0.04]]), steel); break;
    case "mace": handle(-1.2, 0.7, 0.12); fl(K.ell(0.95 * R, -0.3 * R, 0.32 * R, 0.3 * R), iron); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ln([[0.95 + Math.cos(a) * 0.3, -0.3 + Math.sin(a) * 0.28], [0.95 + Math.cos(a) * 0.46, -0.3 + Math.sin(a) * 0.42]], 0.9, iron); } break;
    case "halberd": handle(-2.6, 2.2, 0.1); fl(P([[1.7, -0.14], [1.75, -0.7], [2.05, -0.62], [2.0, -0.14]]), steel); fl(P([[1.75, -0.06], [1.95, -0.06], [1.85, 0.12]]), steel); fl(P([[2.2, -0.2], [2.8, -0.1], [2.2, 0.0]]), steel); break;
    case "crossbow": beam([[-1.1, -0.14], [0.8, -0.14]], 0.16); fl(S([[0.75, -0.14], [0.6, -0.75], [0.55, -0.9], [0.68, -0.75], [0.88, -0.14], [0.68, 0.0], [0.6, 0.02]]), K.shade(wood, 0.85)); ln([[0.6, -0.84], [0.2, -0.14]], 0.35, cord); ln([[0.2, -0.14], [0.6, 0.02]], 0.35, cord); break;
    case "club": fl(S([[-1.0, -0.14], [-0.2, -0.2], [0.8, -0.38], [1.15, -0.26], [1.12, -0.02], [0.8, 0.02], [-0.2, -0.02], [-1.0, -0.04]]), wood); [0.3, 0.7].forEach((x) => ln([[x, -0.3], [x + 0.08, -0.06]], 0.35)); break;
    case "oar": handle(-1.9, 0.9, 0.1); fl(S([[0.8, -0.18], [1.2, -0.3], [2.0, -0.28], [2.1, -0.1], [2.0, 0.08], [1.2, 0.08], [0.8, -0.02]]), K.shade(wood, 1.08)); break;
    case "fishingRod": beam([[-1.8, -0.1], [2.2, -0.5]], 0.05); beam([[-1.8, -0.1], [-1.0, -0.18]], 0.09); ln([[2.2, -0.5], [2.35, 0.0]], 0.3, "#c8c8c8"); break;
    case "broom": handle(-1.7, 0.6, 0.09); fl(S([[0.55, -0.22], [0.75, -0.24], [1.6, -0.45], [1.65, 0.0], [0.75, 0.04], [0.55, 0.02]]), straw); for (let i = 0; i < 5; i++) ln([[0.8, -0.18 + i * 0.05], [1.6, -0.4 + i * 0.09]], 0.3); ln([[0.72, -0.24], [0.72, 0.04]], 0.6, cord); break;
    case "arquebus": case "musket": case "rifle": case "carbine": case "bayonet": {
      const len = kind === "carbine" ? 1.6 : kind === "arquebus" ? 2.1 : 2.3, dk = K.shade(wood, 0.85);
      fl(S([[-1.7, -0.3], [-1.2, -0.42], [-0.3, -0.3], [0.2, -0.28], [0.2, -0.12], [-0.3, -0.1], [-1.2, -0.02], [-1.7, 0.0]]), dk);
      beam([[0.15, -0.24], [len, -0.24]], 0.07, iron);
      if (kind !== "rifle" && kind !== "carbine" && kind !== "bayonet") beam([[0.2, -0.17], [len - 0.3, -0.17]], 0.04, K.shade(wood, 0.7));
      ln([[-0.45, -0.1], [-0.35, 0.05], [-0.15, 0.05]], 0.45);
      if (kind === "arquebus") ln([[-0.25, -0.28], [-0.1, -0.5]], 0.6, iron);
      if (kind === "bayonet") fl(P([[len - 0.05, -0.3], [len + 0.9, -0.24], [len - 0.05, -0.18]]), steel);
      break;
    }
    case "arrows": { for (let i = 0; i < 6; i++) { const x = -0.6 + i * 0.24 + (K.rnd(K.num(o.seed, 3), i) - 0.5) * 0.1, a = -Math.PI / 2 + (K.rnd(K.num(o.seed, 3), i + 9) - 0.5) * 0.5, L = 1.6 + K.rnd(K.num(o.seed, 3), i + 3) * 0.4, ex = x + Math.cos(a) * L, ey = Math.sin(a) * L; beam([[x, 0], [ex, ey]], 0.05); const nx = -Math.sin(a) * 0.1, ny = Math.cos(a) * 0.1; for (let f = 0; f < 3; f++) { const q = 0.78 + f * 0.08, px = x + (ex - x) * q, py = ey * q; ln([[px - nx, py - ny], [px + nx, py + ny]], 0.6, K.toneOf("#e9e2d0")); } } break; }
    case "staff": handle(-2.0, 2.0, 0.11); fl(K.ell(2.05 * R, -0.1 * R, 0.14 * R, 0.13 * R), K.shade(wood, 0.8)); break;
  }
  c.restore();
  return true;
}`;
