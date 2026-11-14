// Front and back views of every kit animal for the sketch and comic skins (animal coming toward or going away from the camera).
// Called from horse.ts and quad.ts through K.part("quadView") when view is front or back. Sizes follow the core ANIMALS table.
// Front: rear legs behind, barrel body, chest, neck, face with eyes, nostrils, ears, horns. Back: rump, tail, legs, ears over the back.
export const SKIN_PART_QUAD_VIEW = `(c, o, K) => {
  const T = {
    horse: [2.6, 1.15, 0.34, 1.2, 0.45, "#7c5f4a", "pointed", "", "long"], mule: [2.2, 1.05, 0.3, 1.1, 0.42, "#6e5444", "long", "", "long"], donkey: [2.1, 1.05, 0.3, 1.1, 0.42, "#837d78", "long", "", "long"],
    zebra: [2.4, 1.1, 0.32, 1.15, 0.44, "#f2efe8", "pointed", "", "long"], ox: [2.35, 1.35, 0.4, 1.0, 0.62, "#8a6440", "side", "curve", "long"], cow: [2.3, 1.3, 0.38, 0.95, 0.6, "#f0ede6", "side", "short", "long"],
    buffalo: [2.3, 1.4, 0.42, 0.95, 0.66, "#4a4440", "side", "wide", "long"], deer: [2.15, 0.92, 0.2, 0.85, 0.38, "#a8743e", "pointed", "antler", "long"], goat: [1.75, 0.92, 0.2, 0.75, 0.38, "#d9cdb8", "side", "back", "long"],
    sheep: [1.7, 1.1, 0.2, 0.68, 0.45, "#efeae0", "side", "", "long"], camel: [3.0, 1.05, 0.28, 0.95, 0.42, "#c9a46a", "side", "", "long"], pig: [1.5, 1.1, 0.28, 0.75, 0.62, "#e8b8b0", "flop", "", "snout"],
    boar: [1.65, 1.15, 0.28, 0.85, 0.62, "#4a3a30", "pointed", "", "snout"], dog: [1.65, 0.82, 0.26, 0.82, 0.5, "#a0703f", "flop", "", "round"], wolf: [1.75, 0.85, 0.26, 0.95, 0.5, "#7d7d80", "pointed", "", "round"],
    fox: [1.45, 0.75, 0.2, 0.85, 0.45, "#d9773a", "pointed", "", "round"], cat: [1.3, 0.72, 0.19, 0.62, 0.52, "#8a8a8e", "pointed", "", "round"], rat: [0.9, 0.75, 0.16, 0.75, 0.42, "#7a7470", "round", "", "round"],
    tiger: [1.9, 1.0, 0.34, 0.78, 0.66, "#e08a2e", "round", "", "round"], lion: [1.95, 1.05, 0.34, 0.78, 0.66, "#d9a85a", "round", "", "round"], bear: [2.0, 1.35, 0.44, 0.8, 0.62, "#5a3e2a", "round", "", "round"],
    elephant: [3.5, 2.0, 0.68, 1.1, 1.0, "#8a8a8e", "elephant", "", "trunk"],
  };
  const A = T[o.kind];
  const view = K.viewOf(o);
  if (!A || (view !== "front" && view !== "back") || o.pose === "lie" || o.pose === "sit") return null;
  const [back, D, legW, hl, hw, col0, ears, horns, face] = A;
  const st = K.S(), R = K.num(o.r, 30), t = K.num(o.t, K.num(window.__motionKitTime, 0)), ol = st.ol, w = K.LW(R / 1.6);
  const B = o.color ? K.toneOf(o.color) : K.toneOf(col0), Dk = K.shade(B, 0.82);
  const moving = o.pose === "walk" || o.pose === "run" || o.phase != null || o.distance != null, run = o.pose === "run";
  const ph = o.distance != null && isFinite(+o.distance) ? +o.distance * K.PI / (1.2 * R) : K.num(o.phase, t * (run ? 10 : 5) + K.num(o.seed, 0));
  const Bw = D * 0.9, backY = -back, bellyY = -back + D, cy = (backY + bellyY) / 2;
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const box = [-2 * R, (backY - 2.5) * R, 2 * R, 0.2 * R];
  const front = view === "front";
  const leg = (x, y0, lift, col, k) => {
    const wd = legW * 0.78 * (k || 1), bot = -lift;
    const p = S([[x - wd * 0.62, y0], [x + wd * 0.62, y0], [x + wd * 0.45, (y0 + bot) / 2], [x + wd * 0.4, bot - 0.12], [x - wd * 0.4, bot - 0.12], [x - wd * 0.45, (y0 + bot) / 2]]);
    K.paint(c, p, col, w);
    K.paint(c, S([[x - wd * 0.48, bot - 0.16], [x + wd * 0.48, bot - 0.16], [x + wd * 0.55, bot], [x - wd * 0.55, bot]]), o.kind === "elephant" ? K.shade(col, 0.9) : "#3a302c", w * 0.9);
  };
  const lift = (off) => (moving ? Math.max(0, Math.sin(ph + off)) * (run ? 0.3 : 0.12) : 0);
  let info = null;
  const saddle = () => { if (o.saddle || o.rider) K.paint(c, S([[-Bw * 0.42, backY + 0.02], [-Bw * 0.42, backY + 0.02], [Bw * 0.42, backY + 0.02], [Bw * 0.42, backY + 0.02], [Bw * 0.36, backY + 0.4], [-Bw * 0.36, backY + 0.4]]), o.saddleColor ? K.toneOf(o.saddleColor) : "#6b4423", w * 0.8); };
  const drawRider = () => {
    if (!o.rider) return;
    const rr = K.num(o.rider.r, R * 0.62);
    info = K.person(c, Object.assign({}, o.rider, { x: 0, y: (backY - 0.05) * R, r: rr, view, pose: "ride", noShadow: true, t }));
  };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  c.fillStyle = "rgba(20,16,12,0.22)";
  c.fill(K.ell(0, 0, Bw * 0.75 * R, 0.14 * R));
  const bob = moving ? Math.abs(Math.sin(ph)) * (run ? 0.06 : 0.02) : 0;
  c.translate(0, -bob * R);
  const farX = Bw * 0.24, nearX = Bw * 0.3;
  leg(-farX, bellyY - 0.3, lift(K.PI * 0.5) + 0.06, Dk, 0.9);
  leg(farX, bellyY - 0.3, lift(K.PI * 1.5) + 0.06, Dk, 0.9);
  const body = S([[-Bw / 2, cy - D * 0.2], [-Bw * 0.38, backY + 0.05], [0, backY - 0.04], [Bw * 0.38, backY + 0.05], [Bw / 2, cy - D * 0.2], [Bw / 2, cy + D * 0.25], [Bw * 0.3, bellyY], [-Bw * 0.3, bellyY], [-Bw / 2, cy + D * 0.25]]);
  if (!front) {
    const sw = Math.sin(t * 2.2) * 0.06;
    const hy = backY - 0.15;
    if (ears === "elephant") [-1, 1].forEach((k) => K.paint(c, S([[k * 0.35, hy - 0.4], [k * 1.15, hy - 0.2], [k * 1.1, hy + 0.7], [k * 0.4, hy + 0.5]]), K.shade(B, 0.9), w));
    K.fill(c, S([[-hw * 0.5, hy + 0.15], [-hw * 0.48, hy - 0.35], [0, hy - 0.45], [hw * 0.48, hy - 0.35], [hw * 0.5, hy + 0.15]]), B, w, { R, box, hatch: false });
    if (ears !== "elephant") [-1, 1].forEach((k) => K.paint(c, S([[k * hw * 0.25, hy - 0.35], [k * hw * (ears === "side" ? 0.95 : 0.45), hy - (ears === "long" ? 0.95 : ears === "side" ? 0.4 : 0.7)], [k * hw * 0.48, hy - 0.25]]), B, w * 0.9));
    K.fill(c, body, B, w, { R, box, dx: 0, dy: -0.15 * R });
    K.line(c, [[0, (backY + 0.25) * R], [0, (bellyY - 0.05) * R]], w * 0.6, ol);
    saddle();
    leg(-nearX, bellyY - 0.35, lift(0), B, 1);
    leg(nearX, bellyY - 0.35, lift(K.PI), B, 1);
    if (face !== "snout") { const q = [[0, backY + 0.12], [sw * 0.5, backY + 0.8], [sw, backY + 1.35]].map(([x, y]) => [x * R, y * R]); K.line(c, q, (face === "long" ? 0.2 : 0.09) * R + w * 2, ol); K.line(c, q, (face === "long" ? 0.2 : 0.09) * R, K.shade(B, 0.6)); }
    else { const p = new Path2D(); p.arc(0, (backY + 0.3) * R, 0.1 * R, 0, K.PI * 1.6); c.lineWidth = w * 1.2; c.strokeStyle = ol; c.stroke(p); }
    drawRider();
  } else {
    K.fill(c, body, B, w, { R, box, dx: 0, dy: -0.15 * R });
    if (o.kind === "zebra" || o.kind === "tiger") { c.save(); c.clip(body); c.strokeStyle = K.toneOf(o.kind === "zebra" ? "#1e1e22" : "#2a2018"); c.lineWidth = 0.08 * R; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 0.2 * R, (backY - 0.1) * R); c.quadraticCurveTo((i * 0.2 + 0.08) * R, cy * R, i * 0.18 * R, (backY + D * 0.6) * R); c.stroke(); } c.restore(); }
    leg(-nearX, bellyY - 0.35, lift(0), B, 1);
    leg(nearX, bellyY - 0.35, lift(K.PI), B, 1);
    saddle();
    drawRider();
    const ny = backY + 0.15, long = face === "long", round = face === "round";
    const headTop = long ? backY - hl * 0.6 : backY - hw * 0.75, headBot = long ? headTop + hl : headTop + hw * 1.1;
    if (long) K.fill(c, S([[-hw * 0.45, ny + 0.2], [-hw * 0.4, headTop + 0.4], [hw * 0.4, headTop + 0.4], [hw * 0.45, ny + 0.2]]), B, w, { R, box, hatch: false });
    if (ears === "elephant") [-1, 1].forEach((k) => K.paint(c, S([[k * 0.3, headTop + 0.1], [k * 1.2, headTop + 0.2], [k * 1.15, headTop + 1.1], [k * 0.45, headTop + 0.9]]), K.shade(B, 0.9), w));
    if (o.kind === "lion") { const rr = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * K.PI * 2, k = i % 2 ? 0.95 : 1.12; rr.push([Math.cos(a) * hw * 1.0 * k, (headTop + hw * 0.55) + Math.sin(a) * hw * 1.0 * k]); } K.fill(c, S(rr), "#8a5a2a", w, { R, box }); }
    const earY = headTop + 0.1;
    if (ears !== "elephant") [-1, 1].forEach((k) => {
      if (ears === "round") K.paint(c, K.ell(k * hw * 0.42 * R, (earY - 0.02) * R, 0.13 * R, 0.13 * R), K.shade(B, 0.9), w * 0.9);
      else if (ears === "side" || ears === "flop") K.paint(c, K.ell(k * hw * 0.72 * R, (earY + (ears === "flop" ? 0.25 : 0.08)) * R, 0.22 * R, 0.09 * R, k * (ears === "flop" ? 0.9 : 0.3)), K.shade(B, 0.88), w * 0.9);
      else K.paint(c, S([[k * hw * 0.18, earY + 0.05], [k * hw * 0.42, earY - (ears === "long" ? 0.75 : 0.42)], [k * hw * 0.45, earY + 0.12]]), B, w * 0.9);
    });
    if (horns === "curve" || horns === "short" || horns === "wide") [-1, 1].forEach((k) => K.paint(c, S([[k * hw * 0.3, earY], [k * hw * (horns === "wide" ? 1.3 : 0.75), earY - (horns === "short" ? 0.1 : 0.25)], [k * hw * (horns === "wide" ? 1.45 : 0.85), earY - (horns === "short" ? 0.25 : 0.5)], [k * hw * 0.42, earY + 0.08]]), "#e8e0cc", w * 0.8));
    if (horns === "antler") [-1, 1].forEach((k) => { const q = [[k * 0.12, earY], [k * 0.3, earY - 0.5], [k * 0.6, earY - 0.95]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.06 * R + w * 2, ol); K.line(c, q, 0.06 * R, "#8a6a44"); });
    const headP = long
      ? S([[-hw * 0.5, headTop + 0.05], [hw * 0.5, headTop + 0.05], [hw * 0.42, headTop + hl * 0.55], [hw * 0.36, headBot - 0.08], [0, headBot], [-hw * 0.36, headBot - 0.08], [-hw * 0.42, headTop + hl * 0.55]])
      : S([[-hw * 0.5, headTop + 0.1], [0, headTop - 0.02], [hw * 0.5, headTop + 0.1], [hw * 0.55, headTop + hw * 0.55], [hw * 0.35, headBot], [-hw * 0.35, headBot], [-hw * 0.55, headTop + hw * 0.55]]);
    K.fill(c, headP, B, w, { R, box, hatch: false });
    const eyeY = headTop + (long ? 0.32 : hw * 0.45);
    c.fillStyle = ol;
    [-1, 1].forEach((k) => c.fill(K.ell(k * hw * 0.28 * R, eyeY * R, Math.max(1.4, 0.05 * R), Math.max(1.6, 0.065 * R))));
    if (face === "snout") { K.paint(c, K.ell(0, (headBot - 0.12) * R, hw * 0.35 * R, 0.16 * R), K.shade(B, 0.88), w * 0.8); c.fillStyle = ol; [-1, 1].forEach((k) => c.fill(K.ell(k * 0.06 * R, (headBot - 0.12) * R, 0.03 * R, 0.045 * R))); }
    else if (face === "trunk") { const sw = Math.sin(t * 1.6) * 0.1; const q = [[0, headBot - 0.1], [sw, headBot + 0.6], [sw * 1.5, headBot + 1.3]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.32 * R + w * 2, ol); K.line(c, q, 0.32 * R, B); [-1, 1].forEach((k) => K.paint(c, S([[k * 0.22, headBot - 0.05], [k * 0.45, headBot + 0.45], [k * 0.38, headBot + 0.5], [k * 0.15, headBot + 0.05]]), "#f2ead8", w * 0.8)); }
    else { [-1, 1].forEach((k) => c.fill(K.ell(k * hw * (long ? 0.16 : 0.1) * R, (headBot - (long ? 0.14 : 0.18)) * R, Math.max(1.2, 0.035 * R), Math.max(1, 0.03 * R)))); if (round) K.line(c, [[-0.08 * R, (headBot - 0.06) * R], [0, (headBot - 0.02) * R], [0.08 * R, (headBot - 0.06) * R]], w * 0.5, ol); }
  }
  c.restore();
  const ox = K.num(o.x, 0), oy = K.num(o.y, 0) - bob * R;
  const pt = (q) => [ox + q[0], oy + q[1]];
  const rider = info ? { head: pt(info.head), hand: pt(info.hand), backHand: pt(info.backHand), top: oy + info.top, height: info.height } : null;
  const top = oy + (backY - (front ? (face === "long" ? 1.0 : 0.5) : 0.6)) * R;
  return { back: oy + backY * R, top: rider ? Math.min(rider.top, top) : top, rider };
}`;
