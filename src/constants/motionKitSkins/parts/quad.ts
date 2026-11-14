// General quadruped for the sketch and comic skins: every kit animal except horse, mule and donkey (those use horse.ts).
// Sizes follow the core ANIMALS table (units of R, ground y=0, head toward +x), so scenes keep their scale.
// Build: far legs (darker), tail, then body + neck + head + near legs stroked as one merged outline, then details.
// Legs are tapered and jointed (knee in front, hock behind), with hooves or paws. Gait is locked to distance like the horse.
export const SKIN_PART_QUAD = `(c, o, K) => {
  const SP = {
    ox: { L: 3.2, D: 1.35, back: 2.35, legW: 0.4, neck: [0.75, -0.35, 0.8], head: [1.0, 0.55, 0.8], col: "#8a6440", tail: "tuft", ears: "side", horns: "curve", muzzle: "#cdbfa8", hoof: 1, dew: 1 },
    cow: { L: 3.1, D: 1.3, back: 2.3, legW: 0.38, neck: [0.75, -0.35, 0.78], head: [0.95, 0.6, 0.78], col: "#f0ede6", spots: "#2c2a28", tail: "tuft", ears: "side", horns: "short", muzzle: "#e2b2aa", hoof: 1, udder: 1 },
    buffalo: { L: 3.3, D: 1.4, back: 2.3, legW: 0.42, neck: [0.6, -0.25, 0.85], head: [0.95, 0.55, 0.85], col: "#4a4440", tail: "tuft", ears: "side", horns: "wide", muzzle: "#6a6460", hoof: 1 },
    dog: { L: 2.2, D: 0.82, back: 1.65, legW: 0.26, neck: [0.65, -0.95, 0.42], head: [0.82, 0.25, 0.52], col: "#a0703f", tail: "up", ears: "flop", paw: 1, snoutK: 0.55 },
    wolf: { L: 2.4, D: 0.85, back: 1.75, legW: 0.26, neck: [0.65, -0.75, 0.46], head: [0.95, 0.3, 0.52], col: "#7d7d80", tail: "bushy", ears: "pointed", paw: 1, snoutK: 0.6 },
    fox: { L: 2.2, D: 0.75, back: 1.45, legW: 0.2, neck: [0.55, -0.75, 0.4], head: [0.85, 0.3, 0.46], col: "#d9773a", tail: "bushy", ears: "pointed", paw: 1, snoutK: 0.65, tip: "#f2ece0", sock: "#2c2420" },
    cat: { L: 1.9, D: 0.72, back: 1.3, legW: 0.19, neck: [0.42, -0.95, 0.36], head: [0.62, 0.15, 0.56], col: "#8a8a8e", tail: "up", ears: "pointed", paw: 1, snoutK: 0.2 },
    rat: { L: 1.7, D: 0.75, back: 0.9, legW: 0.16, neck: [0.25, -0.2, 0.5], head: [0.75, 0.25, 0.5], col: "#7a7470", tail: "thin", ears: "round", paw: 1, snoutK: 0.7 },
    sheep: { L: 2.2, D: 1.1, back: 1.7, legW: 0.2, neck: [0.45, -0.65, 0.5], head: [0.68, 0.55, 0.5], col: "#efeae0", wool: 1, face: "#3a3532", tail: "short", ears: "side", hoof: 1 },
    goat: { L: 2.2, D: 0.92, back: 1.75, legW: 0.2, neck: [0.65, -1.0, 0.42], head: [0.75, 0.5, 0.46], col: "#d9cdb8", tail: "up", ears: "side", horns: "back", beard: 1, hoof: 1 },
    pig: { L: 2.4, D: 1.1, back: 1.5, legW: 0.28, neck: [0.25, -0.2, 0.85], head: [0.75, 0.15, 0.78], col: "#e8b8b0", tail: "curl", ears: "flop", snout: 1, hoof: 1 },
    boar: { L: 2.5, D: 1.15, back: 1.65, legW: 0.28, neck: [0.25, -0.25, 0.9], head: [0.85, 0.35, 0.78], col: "#4a3a30", tail: "short", ears: "pointed", snout: 1, tusks: 1, crest: "#2a201a", hoof: 1 },
    camel: { L: 3.0, D: 1.05, back: 3.0, legW: 0.28, neck: [1.6, -0.45, 0.42], head: [0.95, 0.45, 0.48], col: "#c9a46a", hump: 1, tail: "tuft", ears: "side", hoof: 1, pad: 1 },
    elephant: { L: 3.4, D: 2.0, back: 3.5, legW: 0.68, neck: [0.3, -0.2, 1.4], head: [1.1, 1.2, 1.25], col: "#8a8a8e", tail: "tuft", ears: "elephant", trunk: 1, tusks: 1, column: 1 },
    tiger: { L: 2.9, D: 1.0, back: 1.9, legW: 0.34, neck: [0.5, -0.45, 0.62], head: [0.78, 0.25, 0.7], col: "#e08a2e", stripes: "#2a2018", belly: "#f2e6d0", tail: "long", ears: "round", paw: 1, snoutK: 0.3 },
    lion: { L: 2.9, D: 1.05, back: 1.95, legW: 0.34, neck: [0.5, -0.45, 0.64], head: [0.78, 0.25, 0.7], col: "#d9a85a", ruff: "#8a5a2a", tail: "long", ears: "round", paw: 1, snoutK: 0.3 },
    bear: { L: 2.7, D: 1.35, back: 2.0, legW: 0.44, neck: [0.4, -0.3, 0.75], head: [0.8, 0.35, 0.66], col: "#5a3e2a", tail: "short", ears: "round", muzzle: "#a8835a", paw: 1, snoutK: 0.45, hump: 0.35 },
    zebra: { L: 2.9, D: 1.1, back: 2.4, legW: 0.3, neck: [1.3, -1.05, 0.52], head: [1.1, 0.95, 0.5], col: "#f2efe8", stripes: "#1e1e22", mane: "#1e1e22", tail: "tuft", ears: "pointed", hoof: 1 },
    deer: { L: 2.6, D: 0.92, back: 2.15, legW: 0.2, neck: [1.0, -1.05, 0.4], head: [0.85, 0.55, 0.42], col: "#a8743e", tail: "short", ears: "pointed", horns: "antler", hoof: 1, rumpPatch: "#f0e6d4" },
  };
  const A = SP[o.kind];
  if (!A) return null;
  if (K.viewOf(o) !== "side") { const v = K.part && K.part("quadView"); return v ? v(c, o, K) : null; }
  const st = K.S(), R = K.num(o.r, 30), f = K.num(o.facing, 1) < 0 ? -1 : 1, t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const ink = !!st.hatch, ol = st.ol, w = K.LW(R / 1.6) * 1.0;
  const B = o.color ? K.toneOf(o.color) : K.toneOf(A.col), Dk = K.shade(B, 0.82);
  const moving = o.pose === "walk" || o.pose === "run" || o.phase != null || o.distance != null, run = o.pose === "run";
  const backY = -A.back, bellyY = -A.back + A.D, L = A.L, legLen = -bellyY + 0.3 * A.D;
  const amp = run ? 0.55 : 0.28, stride = Math.max(0.05, 2 * Math.sin(amp) * legLen * 0.8) * R;
  const ph = o.distance != null && isFinite(+o.distance) ? +o.distance * K.PI / stride : K.num(o.phase, t * (run ? 10 : 5) + K.num(o.seed, 0));
  const bob = moving ? Math.abs(Math.sin(ph)) * (run ? 0.08 : 0.025) : 0;
  const rot = (p, q, a) => { const dx = p[0] - q[0], dy = p[1] - q[1], cs = Math.cos(a), sn = Math.sin(a); return [q[0] + dx * cs - dy * sn, q[1] + dx * sn + dy * cs]; };
  const S = (pts) => { let ar = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; } const q = ar < 0 ? pts.slice().reverse() : pts; return K.smooth(q.map(([x, y]) => [x * R, y * R]), true); };
  const lineR = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.6), col || ol);
  const box = [-L * R, (backY - 2) * R, L * R, 0.2 * R];
  const legW = A.legW;
  const legDef = (x, hind, far) => {
    const top = [x, bellyY - 0.28 * A.D], len = -top[1];
    const knee = hind ? [x - 0.12 * len, top[1] + len * 0.52] : [x + 0.02 * len, top[1] + len * 0.52];
    const fet = hind ? [x - 0.04 * len, top[1] + len * 0.9] : [x - 0.02 * len, top[1] + len * 0.9];
    const end = [fet[0] + (A.paw ? 0.06 : 0.02) * len, 0];
    const wk = A.column ? [1.0, 0.95, 0.9, 0.92] : hind && A.hoof ? [2.0, 0.85, 0.62, 0.66] : hind ? [1.7, 0.85, 0.7, 0.75] : [1.25, 0.82, 0.62, 0.66];
    return { p: [top, knee, fet, end], w: wk.map((k) => k * legW), pv: hind ? [x + 0.05, top[1] - 0.25] : top, far };
  };
  const legPath = (Ld, ph0, hind) => {
    const sw = moving && !Ld.fixed ? amp * Math.sin(ph + ph0) : 0, lift = moving && !Ld.fixed ? Math.max(0, Math.cos(ph + ph0)) : 0;
    const flex = -lift * (run ? 1.1 : 0.7);
    let p = Ld.p.map((q) => rot(q, Ld.pv, sw));
    p = p.map((q, i) => (i < 2 ? q : rot(q, p[1], flex)));
    p = p.map((q, i) => (i < 3 ? q : rot(q, p[2], flex * 0.5)));
    const sink = Ld.fixed ? 0 : (0 - p[3][1]) * (1 - Math.min(1, lift * 3));
    p = p.map((q, i) => [q[0], q[1] + sink * i / 3]);
    const side = (k) => p.map((q, i) => { const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [q[0] - dy / l * Ld.w[i] * 0.5 * k, q[1] + dx / l * Ld.w[i] * 0.5 * k]; });
    return { path: S(side(1).concat(side(-1).reverse())), end: p[3], ang: Math.atan2(p[3][0] - p[2][0], p[3][1] - p[2][1]) };
  };
  const foot = (Lp, col) => {
    const e = Lp.end, a = Lp.ang, ww = legW;
    const pts = A.paw ? [[-0.55 * ww, -0.35 * ww], [0.35 * ww, -0.42 * ww], [0.85 * ww, -0.1 * ww], [0.8 * ww, 0.02], [-0.6 * ww, 0.02]] : A.column ? [[-0.55 * ww, -0.25 * ww], [0.55 * ww, -0.25 * ww], [0.58 * ww, 0.02], [-0.58 * ww, 0.02]] : [[-0.42 * ww, -0.42 * ww], [0.42 * ww, -0.42 * ww], [0.58 * ww, 0.02], [-0.58 * ww, 0.02]];
    const q = pts.map(([x, y]) => [(e[0] + x * Math.cos(a) + y * Math.sin(a)) * R, (e[1] - x * Math.sin(a) + y * Math.cos(a)) * R]);
    if (A.paw || A.column) K.paint(c, K.smooth(q, true), col, w * 0.9);
    else { const hp = new Path2D(); q.forEach(([x, y], i) => (i ? hp.lineTo(x, y) : hp.moveTo(x, y))); hp.closePath(); K.paint(c, hp, "#3a302c", w * 0.9); }
  };
  const xf = L * 0.33, xh = -L * 0.33;
  const legs = { nf: legDef(xf + 0.05, false), ff: legDef(xf - 0.12, false), nh: legDef(xh - 0.02, true), fh: legDef(xh + 0.16, true) };
  const sitting = o.pose === "sit" && !!A.paw, lying = o.pose === "lie" || (o.pose === "sit" && !A.paw);
  const lieDy = lying ? -bellyY - 0.12 : sitting ? -bellyY - 0.32 : 0, gL = -lieDy;
  const sitA = sitting ? -0.5 : 0, piv = [xh + 0.1, bellyY - 0.05];
  const fold = (x, hind, k) => ({ fixed: 1, pv: [x, bellyY - 0.28 * A.D], w: (hind ? [1.7, 0.8, 0.66, 0.7] : [1.2, 0.8, 0.62, 0.66]).map((q) => q * legW * (k || 1)), p: hind ? [[x, bellyY - 0.28 * A.D], [x - 0.32, gL - 0.13], [x + 0.05, gL - 0.08], [x + 0.32, gL - 0.06]] : [[x, bellyY - 0.28 * A.D], [x + 0.04, gL - 0.14], [x + 0.32, gL - 0.1], [x + 0.55, gL - 0.07]] });
  if (lying) { legs.nf = fold(xf + 0.05, false); legs.ff = fold(xf - 0.12, false); legs.nh = fold(xh - 0.02, true); legs.fh = fold(xh + 0.16, true); }
  if (sitting) {
    legs.nh = fold(xh - 0.02, true); legs.fh = fold(xh + 0.16, true);
    const straight = (x) => { const t0 = [x, bellyY - 0.28 * A.D], tw = rot(t0, piv, sitA), fw = [tw[0] + 0.04, gL], f0 = rot(fw, piv, -sitA), k0 = [(t0[0] + f0[0]) / 2 + 0.03, (t0[1] + f0[1]) / 2], m0 = [f0[0] - 0.02, f0[1] - 0.12]; return { fixed: 1, pv: t0, w: [1.2, 0.8, 0.62, 0.66].map((q) => q * legW), p: [t0, k0, m0, f0] }; };
    legs.nf = straight(xf + 0.05); legs.ff = straight(xf - 0.12);
  }
  const graze = o.pose === "graze" ? 0.9 : 0;
  const nb = [L * 0.36, backY + 0.3 * A.D];
  const na = A.neck[1] + graze, nl = A.neck[0], nw = A.neck[2];
  const nt = [nb[0] + Math.cos(na) * nl, nb[1] + Math.sin(na) * nl];
  const ha = A.head[1] + graze * 0.6, hl = A.head[0], hd = A.head[2];
  const hs = [nt[0] - Math.cos(ha) * hd * 0.15, nt[1] - Math.sin(ha) * hd * 0.15];
  const he = [hs[0] + Math.cos(ha) * hl, hs[1] + Math.sin(ha) * hl];
  const pn = [-Math.sin(na), Math.cos(na)], ph_ = [-Math.sin(ha), Math.cos(ha)];
  const hpt = (u, v) => [hs[0] + Math.cos(ha) * hl * u + ph_[0] * hd * v, hs[1] + Math.sin(ha) * hl * u + ph_[1] * hd * v];
  if (o.cart && !lying && !sitting) { const cr = K.part && K.part("cartRig"); if (cr) cr(c, { ox: K.num(o.x, 0), oy: K.num(o.y, 0), x0: -L * 0.5 * R, R, f, ph, hitch: [L * 0.36 * R, (bellyY - 0.35) * R], color: o.cartColor, cover: o.cover !== false && o.cover }, K); }
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  c.scale(f, 1);
  c.fillStyle = "rgba(20,16,12,0.22)";
  c.fill(K.ell(0, 0, L * 0.6 * R, 0.13 * R));
  c.translate(0, -bob * R);
  if (lieDy) c.translate(0, lieDy * R);
  if (sitA) { c.translate(piv[0] * R, piv[1] * R); c.rotate(sitA); c.translate(-piv[0] * R, -piv[1] * R); }
  const far = [legPath(legs.ff, run ? 0.7 : K.PI, false), legPath(legs.fh, run ? K.PI + 0.9 : K.PI * 1.5, true)];
  far.forEach((Lp) => K.paint(c, Lp.path, Dk, w));
  far.forEach((Lp) => foot(Lp, Dk));
  const tx = -L * 0.5, ty = backY + 0.22 * A.D, sw = Math.sin(t * 2.2 + K.num(o.seed, 0)) * 0.1;
  const tailCol = A.mane ? K.toneOf(A.mane) : K.shade(B, 0.7);
  if (A.tail === "bushy") K.paint(c, S([[tx + 0.08, ty], [tx - 0.5, ty + 0.15 + sw], [tx - 0.95, ty + 0.55 + sw], [tx - 0.85, ty + 0.8 + sw], [tx - 0.35, ty + 0.55], [tx + 0.05, ty + 0.3]]), B, w);
  else if (A.tail === "up") K.paint(c, S([[tx + 0.05, ty + 0.05], [tx - 0.35, ty - 0.2 + sw], [tx - 0.42, ty - 0.62 + sw], [tx - 0.3, ty - 0.66 + sw], [tx - 0.25, ty - 0.25], [tx + 0.08, ty + 0.18]]), B, w);
  else if (A.tail === "long") { const q = [[tx + 0.05, ty + 0.1], [tx - 0.55, ty + 0.4 + sw], [tx - 0.95, ty + 0.05 + sw]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.13 * R + w * 2, ol); K.line(c, q, 0.13 * R, B); K.paint(c, K.ell((tx - 0.98) * R, (ty + 0.02 + sw) * R, 0.1 * R, 0.13 * R), A.ruff ? K.toneOf(A.ruff) : K.shade(B, 0.4), w * 0.8); }
  else if (A.tail === "thin") lineR([[tx + 0.05, ty + 0.25], [tx - 0.6, ty + 0.55 + sw], [tx - 1.2, ty + 0.3 + sw]], 0.9, K.shade(B, 1.15));
  else if (A.tail === "curl") { const p = new Path2D(); p.arc((tx - 0.12) * R, (ty + 0.15) * R, 0.12 * R, 0, K.PI * 1.6); c.lineWidth = w * 1.3; c.strokeStyle = ol; c.stroke(p); }
  else if (A.tail === "tuft") { const q = [[tx + 0.05, ty], [tx - 0.15 + sw * 0.5, ty + 0.7], [tx - 0.12 + sw * 0.5, ty + 1.2]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.07 * R + w * 2, ol); K.line(c, q, 0.07 * R, B); K.paint(c, S([[tx - 0.12 + sw * 0.5, ty + 1.1], [tx - 0.24 + sw * 0.5, ty + 1.45], [tx - 0.02 + sw * 0.5, ty + 1.42]]), tailCol, w * 0.8); }
  const body = A.wool
    ? (() => { const list = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * K.PI * 2; list.push([Math.cos(a) * L * 0.5 * (i % 2 ? 1 : 1.07), (backY + bellyY) / 2 + Math.sin(a) * A.D * 0.55 * (i % 2 ? 1 : 1.08)]); } return S(list); })()
    : S([[-L * 0.42, backY + 0.06], [-L * 0.28, backY - 0.02], [0, backY + 0.05], [L * 0.3, backY - 0.04], [L * 0.5, backY + 0.28 * A.D], [L * 0.53, backY + 0.62 * A.D], [L * 0.42, bellyY - 0.04], [0, bellyY + 0.03], [-L * 0.3, bellyY - 0.06], [-L * 0.5, backY + 0.75 * A.D], [-L * 0.53, backY + 0.35 * A.D]]);
  const neck = S([[nb[0] - pn[0] * nw * 0.55 - 0.15, nb[1] - pn[1] * nw * 0.55], [nt[0] - pn[0] * nw * 0.38, nt[1] - pn[1] * nw * 0.38], [nt[0] + pn[0] * nw * 0.42, nt[1] + pn[1] * nw * 0.42], [nb[0] + pn[0] * nw * 0.6, nb[1] + pn[1] * nw * 0.6 + 0.1]]);
  const sk = A.snoutK != null ? A.snoutK : 0.35;
  const head = S([hpt(0, -0.55), hpt(0.45, -0.5), hpt(0.85, -0.5 * (1 - sk * 0.5)), hpt(1.0, -0.3 * (1 - sk * 0.4)), hpt(1.04, 0.1), hpt(0.95, 0.42 * (1 - sk * 0.3)), hpt(0.55, 0.5), hpt(0.1, 0.55)]);
  const hump = A.hump ? S([[-0.75 * A.hump * L / 3, backY + 0.25], [-0.35 * L / 3, backY - 0.85 * A.hump], [0.35 * L / 3 * A.hump, backY - 0.85 * A.hump], [0.75 * L / 3, backY + 0.25]]) : null;
  const near = [legPath(legs.nf, 0, false), legPath(legs.nh, run ? K.PI + 0.25 : K.PI * 0.5, true)];
  if (A.ears === "elephant") K.paint(c, S([hpt(0.05, -0.6), hpt(-0.65, -0.55), hpt(-0.75, 0.6), hpt(-0.2, 0.75), hpt(0.1, 0.3)]), K.shade(B, 0.92), w);
  const parts = [body, neck, head].concat(hump ? [hump] : [], near.map((Lp) => Lp.path));
  c.save(); c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = ol; c.lineWidth = w * 2; parts.forEach((p) => c.stroke(p)); c.restore();
  const all = new Path2D(); parts.forEach((p) => all.addPath(p));
  K.fill(c, all, B, 0, { R, dx: 0, dy: -0.22 * R, box, hatch: ink });
  near.forEach((Lp) => foot(Lp, K.shade(B, 0.9)));
  c.save(); c.clip(all);
  if (A.stripes) { c.strokeStyle = K.toneOf(A.stripes); c.lineCap = "round"; for (let i = 0; i < 10; i++) { const x = (-L * 0.48 + i * L * 0.1) * R; c.lineWidth = 0.1 * R; c.beginPath(); c.moveTo(x, (backY - 0.1) * R); c.quadraticCurveTo(x + 0.15 * R, ((backY + bellyY) / 2) * R, x - 0.05 * R, (backY + A.D * 0.7) * R); c.stroke(); } [0.3, 0.55].forEach((u) => { const p = hpt(u, -0.5), q = hpt(u + 0.05, 0.1); c.beginPath(); c.moveTo(p[0] * R, p[1] * R); c.lineTo(q[0] * R, q[1] * R); c.stroke(); }); }
  if (A.spots) { c.fillStyle = K.toneOf(A.spots); [[-0.3, 0.35, 0.42], [0.1, 0.65, 0.32], [0.33, 0.25, 0.28], [-0.05, 0.15, 0.22]].forEach(([u, v, r]) => c.fill(K.ell(u * L * R, (backY + v * A.D) * R, r * R, r * 0.8 * R))); }
  if (A.belly) { c.fillStyle = K.toneOf(A.belly); c.fill(K.ell(0, bellyY * R, L * 0.4 * R, 0.22 * A.D * R)); }
  if (A.rumpPatch) { c.fillStyle = K.toneOf(A.rumpPatch); c.fill(K.ell(-L * 0.48 * R, (backY + 0.3 * A.D) * R, 0.25 * R, 0.3 * R)); }
  if (A.crest) { c.fillStyle = K.toneOf(A.crest); c.fill(S([[-L * 0.2, backY - 0.05], [L * 0.35, backY - 0.12], [nt[0], nt[1] - 0.2], [nt[0], nt[1] + 0.1], [L * 0.3, backY + 0.12], [-L * 0.2, backY + 0.1]])); }
  if (A.face) { c.fillStyle = K.toneOf(A.face); c.fill(head); }
  if (A.muzzle) { c.fillStyle = K.toneOf(A.muzzle); c.fill(K.ell(hpt(0.88, 0.05)[0] * R, hpt(0.88, 0.05)[1] * R, hd * 0.42 * R, hd * 0.4 * R)); }
  if (A.sock) { c.fillStyle = K.toneOf(A.sock); near.concat(far).forEach((Lp) => c.fill(K.ell(Lp.end[0] * R, -0.12 * R, legW * 0.8 * R, 0.25 * R))); }
  c.restore();
  if (A.wool) { for (let i = 0; i < 9; i++) { const a = new Path2D(), x = (-L * 0.38 + (i % 5) * L * 0.19) * R, y = (backY + (i < 5 ? 0.3 : 0.7) * A.D) * R; a.arc(x, y, 0.16 * R, K.PI * 0.1, K.PI * 0.9); c.lineWidth = w * 0.55; c.strokeStyle = ol; c.stroke(a); } }
  if (A.udder) K.paint(c, K.ell(-L * 0.12 * R, (bellyY + 0.05) * R, 0.2 * R, 0.13 * R), "#e8b4ae", w * 0.7);
  lineR([[L * 0.36, bellyY - 0.12], [L * 0.33, bellyY - 0.4]], 0.55);
  lineR([[-L * 0.3, backY + 0.35], [-L * 0.36, bellyY - 0.15]], 0.55);
  if (A.ruff) { const c0 = hpt(0.3, 0); const rr = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * K.PI * 2, k = i % 2 ? 0.95 : 1.12; rr.push([c0[0] + Math.cos(a) * hd * 1.05 * k, c0[1] + Math.sin(a) * hd * 1.05 * k]); } const rp = S(rr); K.fill(c, rp, A.ruff, w, { R, box }); K.fill(c, head, B, w, { R, box, hatch: false }); }
  const earB = hpt(0.15, -0.48), earB2 = hpt(0.32, -0.5), up = [-ph_[0], -ph_[1]];
  if (A.ears === "pointed" || A.ears === "long") { const k = A.ears === "long" ? 0.75 : 0.36; K.paint(c, S([earB, [earB[0] + up[0] * k - 0.04, earB[1] + up[1] * k], earB2]), B, w); }
  if (A.ears === "round") K.paint(c, K.ell(earB[0] * R, (earB[1] - 0.05) * R, 0.15 * R, 0.15 * R), K.shade(B, 0.9), w);
  if (A.ears === "side") K.paint(c, K.ell((earB[0] - 0.12) * R, (earB[1] + 0.08) * R, 0.24 * R, 0.1 * R, 0.35), K.shade(B, 0.9), w);
  if (A.ears === "flop") K.paint(c, S([earB, [earB[0] - 0.18, earB[1] + 0.12], [earB[0] - 0.12, earB[1] + 0.48], [earB[0] + 0.08, earB[1] + 0.32]]), K.shade(B, 0.75), w);
  if (A.horns === "curve" || A.horns === "short" || A.horns === "wide") { const b = hpt(0.2, -0.52), len = A.horns === "short" ? 0.25 : A.horns === "wide" ? 0.7 : 0.45; K.paint(c, S([[b[0] - 0.06, b[1]], [b[0] - (A.horns === "wide" ? 0.45 : 0.05), b[1] - len * 0.6], [b[0] + (A.horns === "wide" ? -0.65 : 0.12), b[1] - len], [b[0] + 0.08, b[1] - 0.02]]), "#e8e0cc", w * 0.8); }
  if (A.horns === "back") K.paint(c, S([[earB2[0], earB2[1]], [earB2[0] - 0.25, earB2[1] - 0.35], [earB2[0] - 0.55, earB2[1] - 0.3], [earB2[0] - 0.3, earB2[1] - 0.2], [earB2[0] + 0.08, earB2[1] + 0.02]]), "#cfc4ae", w * 0.8);
  if (A.horns === "antler" && !o.doe) { const b = earB2; const br = (pts) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.07 * R + w * 2, ol); K.line(c, q, 0.07 * R, "#8a6a44"); }; br([b, [b[0] - 0.1, b[1] - 0.5], [b[0] - 0.4, b[1] - 0.95]]); br([[b[0] - 0.1, b[1] - 0.45], [b[0] + 0.22, b[1] - 0.8]]); br([[b[0] - 0.25, b[1] - 0.75], [b[0] - 0.05, b[1] - 1.05]]); }
  if (A.mane) K.paint(c, S([[L * 0.2, backY - 0.02], [nt[0] - pn[0] * nw * 0.4, nt[1] - pn[1] * nw * 0.4 - 0.05], [nt[0] - pn[0] * nw * 0.2, nt[1] - pn[1] * nw * 0.2 + 0.1], [L * 0.25, backY + 0.12]]), K.toneOf(A.mane), w * 0.8);
  if (A.snout) { const s0 = hpt(1.0, 0.05); K.paint(c, K.ell(s0[0] * R, s0[1] * R, 0.12 * R, 0.2 * R), K.shade(B, 0.88), w * 0.8); c.fillStyle = ol; c.fill(K.ell((s0[0] + 0.02) * R, (s0[1] - 0.06) * R, 0.025 * R, 0.035 * R)); c.fill(K.ell((s0[0] + 0.02) * R, (s0[1] + 0.06) * R, 0.025 * R, 0.035 * R)); }
  if (A.tusks) { const tp = A.trunk ? hpt(0.75, 0.55) : hpt(0.85, 0.35); K.paint(c, S([[tp[0] - 0.06, tp[1]], [tp[0] + (A.trunk ? 0.45 : 0.15), tp[1] + (A.trunk ? 0.35 : -0.2)], [tp[0] + (A.trunk ? 0.5 : 0.2), tp[1] + (A.trunk ? 0.25 : -0.28)], [tp[0] + 0.06, tp[1] - 0.06]]), "#f2ead8", w * 0.8); }
  if (A.trunk) { const tw = Math.sin(t * 1.6) * 0.15; const q = [hpt(0.95, 0.1), [he[0] + 0.25, he[1] + 0.7], [he[0] + 0.2 + tw, he[1] + 1.4], [he[0] + 0.4 + tw, he[1] + 1.65]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.36 * R + w * 2, ol); K.line(c, q, 0.36 * R, B); for (let i = 1; i < 6; i++) { const u = i / 6, x = q[1][0] + (q[2][0] - q[1][0]) * u, y = q[1][1] + (q[2][1] - q[1][1]) * u; K.line(c, [[x - 0.12 * R, y], [x + 0.12 * R, y]], w * 0.5); } }
  if (A.beard) K.paint(c, S([hpt(0.8, 0.45), hpt(0.75, 0.95), hpt(0.95, 0.5)]), K.shade(B, 0.8), w * 0.7);
  const eye = hpt(0.38, -0.18);
  c.fillStyle = ol; c.fill(K.ell(eye[0] * R, eye[1] * R, Math.max(1.5, 0.055 * R), Math.max(1.6, 0.065 * R)));
  if (!A.snout && !A.trunk) { const ns = hpt(0.96, -0.08); c.fill(K.ell(ns[0] * R, ns[1] * R, Math.max(1.2, 0.04 * R), Math.max(1, 0.03 * R))); lineR([hpt(0.98, 0.25), hpt(0.78, 0.3)], 0.45); }
  c.restore();
  const ox = K.num(o.x, 0), oy = K.num(o.y, 0);
  let rider = null;
  if (o.rider) {
    const rr = K.num(o.rider.r, R * 0.62);
    c.save(); c.translate(ox, oy); c.scale(f, 1);
    const info = K.person(c, Object.assign({}, o.rider, { x: (A.hump ? -0.3 : 0) * R, y: (backY - (A.hump ? 0.6 : 0.05) - bob) * R + st.hip * rr, r: rr, facing: 1, pose: "ride", noShadow: true, look: K.num(o.rider.look, 0) * f, t }));
    c.restore();
    const pt = (q) => [ox + f * q[0], oy + q[1]];
    if (info) rider = { head: pt(info.head), hand: pt(info.hand), backHand: pt(info.backHand), top: oy + info.top, height: info.height };
  }
  const top = oy + Math.min(backY - (A.hump || 0) * 0.85, hs[1] - 0.6) * R;
  return { back: oy + (backY + lieDy) * R, top: (rider ? Math.min(rider.top, top) : top) + lieDy * R, rider };
}`;
