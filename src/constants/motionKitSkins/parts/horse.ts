// Sketch-skin horse, traced from the standing saddled horse of reference video 1 (frame 498, facing left).
// Reference units: hooves on y=552, withers y=212, nose x=198, buttock x=705. m() mirrors to kit space (head toward +x).
// Line width matches the people next to it (LW of their head unit p = R/1.6); near legs share one union outline with the body.
export const SKIN_PART_HORSE_REAL = `(c, o, K) => {
  if (K.viewOf(o) !== "side") { const v = K.part && K.part("quadView"); return v ? v(c, o, K) : null; }
  const R = K.num(o.r, 30), s = R / 144, f = K.num(o.facing, 1) < 0 ? -1 : 1, t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const kind = o.kind || "horse", st = K.S();
  const B = o.color ? K.toneOf(o.color) : kind === "donkey" ? "#837d78" : kind === "mule" ? "#6e5444" : "#7c5f4a";
  const D = K.shade(B, 0.84), M = o.mane ? K.toneOf(o.mane) : K.shade(B, 0.62);
  const w = Math.max(3.2, 1.3 / s) * K.clamp(K.num(st.lw, 0.042) / 0.042, 0.6, 3), ol = st.ol;
  const rr = (x0, y0, x1, y1, q) => [[x0 + q, y0], [x1 - q, y0], [x1, y0], [x1, y0 + q], [x1, y1 - q], [x1, y1], [x1 - q, y1], [x0 + q, y1], [x0, y1], [x0, y1 - q], [x0, y0 + q], [x0, y0]];
  const moving = o.pose === "walk" || o.pose === "run" || o.phase != null || o.distance != null, run = o.pose === "run";
  const amp = run ? 0.62 : 0.3, legLen = 190 * s;
  const stride = Math.max(0.05 * R, 2 * Math.sin(amp) * legLen * 0.8);
  const ph = o.distance != null && isFinite(+o.distance) ? +o.distance * K.PI / stride : K.num(o.phase, t * (run ? 10 : 5) + K.num(o.seed, 0));
  const bob = moving ? Math.abs(Math.sin(ph)) * (run ? 14 : 5) : 0;
  const m = (p) => [451 - p[0], p[1] - 552];
  const rot = (p, q, a) => { const dx = p[0] - q[0], dy = p[1] - q[1], cs = Math.cos(a), sn = Math.sin(a); return [q[0] + dx * cs - dy * sn, q[1] + dx * sn + dy * cs]; };
  const P = (pts) => K.smooth(pts.map(m), true);
  const strap = (pts, sw, col) => { const q = pts.map(m); K.line(c, q, sw + w * 1.6, ol); K.line(c, q, sw, col); };
  const legPath = (L, ph0, hind) => {
    const sw = moving && !L.fixed ? amp * Math.sin(ph + ph0) : 0, lift = moving && !L.fixed ? Math.max(0, Math.cos(ph + ph0)) : 0;
    const flex = -lift * (run ? 1.3 : 0.75) * (hind ? 0.8 : 1);
    const pv = L.pv || L.p[0];
    let p = L.p.map((q) => rot(q, pv, sw));
    p = p.map((q, i) => (i < 2 ? q : rot(q, p[1], flex)));
    p = p.map((q, i) => (i < 3 ? q : rot(q, p[2], flex * 0.6)));
    const sink = L.fixed ? 0 : (540 - p[3][1]) * (1 - Math.min(1, lift * 3));
    p = p.map((q, i) => [q[0], q[1] + sink * i / 3]);
    const side = (k) => p.map((q, i) => { const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [q[0] - dy / l * L.w[i] * 0.5 * k, q[1] + dx / l * L.w[i] * 0.5 * k]; });
    const out = side(1).concat(side(-1).reverse());
    return { path: P(out), hoof: p[3], ang: Math.atan2(p[3][0] - p[2][0], p[3][1] - p[2][1]) };
  };
  const hoof = (h, ang, col) => {
    const pts = [[-11, -17], [11, -17], [16, 0], [-16, 0]].map(([x, y]) => m([h[0] + x * Math.cos(ang) + y * Math.sin(ang), h[1] - x * Math.sin(ang) + y * Math.cos(ang) + 1]));
    const hp = new Path2D(); pts.forEach((q, i) => (i ? hp.lineTo(q[0], q[1]) : hp.moveTo(q[0], q[1]))); hp.closePath();
    c.lineJoin = "round"; K.paint(c, hp, col, w);
  };
  const legs = {
    nf: { p: [[378, 345], [380, 440], [372, 520], [366, 540]], w: [40, 28, 22, 22] },
    ff: { p: [[412, 345], [414, 440], [418, 520], [420, 540]], w: [38, 27, 21, 21] },
    nh: { pv: [650, 320], p: [[652, 372], [660, 458], [628, 522], [622, 540]], w: [78, 30, 22, 22] },
    fh: { pv: [672, 318], p: [[684, 368], [694, 456], [690, 520], [692, 540]], w: [56, 28, 21, 21] },
  };
  const lying = o.pose === "lie" || o.pose === "sit", lieDy = lying ? 150 : 0, gL = 552 - lieDy;
  if (lying) {
    legs.nf = { fixed: 1, p: [[378, 345], [372, gL - 30], [330, gL - 18], [300, gL - 12]], w: [40, 28, 22, 22] };
    legs.ff = { fixed: 1, p: [[412, 345], [404, gL - 28], [360, gL - 16], [332, gL - 10]], w: [38, 27, 21, 21] };
    legs.nh = { fixed: 1, p: [[652, 372], [700, gL - 30], [640, gL - 20], [590, gL - 12]], w: [78, 30, 22, 22] };
    legs.fh = { fixed: 1, p: [[684, 368], [720, gL - 26], [672, gL - 18], [624, gL - 10]], w: [56, 28, 21, 21] };
  }
  const graze = o.pose === "graze" ? -0.9 : 0, piv = [440, 236];
  const nh = (pts) => pts.map((q) => rot(q, piv, graze));
  const earLen = kind === "donkey" ? 2.1 : kind === "mule" ? 1.7 : 1;
  const ear = (b0, b1, tip) => { const mid = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2]; return nh([b0, [mid[0] + (tip[0] - mid[0]) * earLen, mid[1] + (tip[1] - mid[1]) * earLen], b1]); };
  if (o.cart && !lying) { const cr = K.part && K.part("cartRig"); if (cr) cr(c, { ox: K.num(o.x, 0), oy: K.num(o.y, 0), x0: (451 - 705) * s, R, f, ph, hitch: [(451 - 372) * s, (330 - 552) * s], color: o.cartColor, cover: o.cover }, K); }
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  c.scale(f * s, s);
  c.fillStyle = "rgba(20,16,12,0.22)";
  c.fill(K.ell(451 - 528, 0, 200, 12));
  c.translate(0, -bob + lieDy);
  const far = [legPath(legs.ff, run ? 0.7 : K.PI, false), legPath(legs.fh, run ? K.PI + 0.9 : K.PI * 1.5, true)];
  far.forEach((L) => K.paint(c, L.path, D, w));
  far.forEach((L) => hoof(L.hoof, L.ang, "#3a302c"));
  const ts = Math.sin(t * 2.1 + K.num(o.seed, 0)) * 8;
  K.paint(c, P([[694, 262], [712, 266], [722, 298], [728 + ts * 0.4, 350], [731 + ts, 405], [727 + ts, 445], [718 + ts, 470], [709 + ts, 452], [704 + ts * 0.6, 402], [700, 340], [693, 300]]), M, w);
  K.paint(c, P(ear([272, 142], [289, 140], [270, 110])), D, w);
  const body = P([[430, 210], [470, 215], [522, 213], [578, 211], [622, 219], [664, 236], [692, 262], [704, 292], [706, 324], [698, 352], [684, 378], [662, 398], [640, 396], [616, 362], [580, 360], [522, 380], [462, 386], [420, 382], [394, 372], [370, 352], [358, 322], [372, 290], [410, 252]]);
  const head = P(nh([[444, 214], [404, 188], [362, 166], [322, 146], [292, 132], [268, 134], [246, 146], [226, 170], [210, 196], [199, 216], [200, 233], [210, 246], [228, 251], [246, 246], [264, 241], [284, 237], [299, 240], [322, 264], [346, 292], [360, 318], [394, 330], [436, 262]]));
  const near = [legPath(legs.nf, 0, false), legPath(legs.nh, run ? K.PI + 0.25 : K.PI * 0.5, true)];
  const parts = [body, head].concat(near.map((L) => L.path));
  c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = ol; c.lineWidth = w * 2;
  parts.forEach((p) => c.stroke(p));
  c.fillStyle = B;
  parts.forEach((p) => c.fill(p));
  near.forEach((L) => hoof(L.hoof, L.ang, "#3a302c"));
  const det = (pts, k) => K.line(c, pts.map(m), w * (k || 0.7), ol);
  det([[398, 388], [391, 366], [396, 348]]);
  det([[612, 336], [624, 362], [627, 392]]);
  det(nh([[250, 238], [282, 232], [294, 212], [286, 192]]));
  det(nh([[213, 242], [230, 240]]), 0.55);
  det(nh([[214, 216], [208, 224], [214, 230]]), 0.6);
  K.paint(c, P(nh([[290, 126], [322, 138], [362, 158], [402, 180], [440, 206], [432, 224], [416, 214], [410, 234], [394, 206], [384, 230], [372, 196], [362, 220], [350, 186], [340, 208], [330, 175], [318, 198], [310, 164], [298, 178], [289, 150]])), M, w);
  K.paint(c, P(ear([262, 144], [280, 140], [257, 106])), B, w);
  K.paint(c, P(nh([[268, 134], [256, 156], [270, 147], [275, 160], [283, 138]])), M, w * 0.8);
  const eye = m(nh([[250, 171]])[0]);
  c.fillStyle = ol;
  c.fill(K.ell(eye[0], eye[1], 6, 7));
  det(nh([[240, 162], [252, 160], [262, 165]]), 0.5);
  const tack = o.saddle || o.rider || o.tack === true;
  if (tack || o.bridle) {
    const lea = "#4a2c1e", brass = "#c9a24a";
    strap(nh([[284, 140], [266, 190], [246, 232]]), 5, lea);
    strap(nh([[204, 210], [226, 218], [246, 226]]), 5, lea);
    strap(nh([[262, 150], [288, 150]]), 5, lea);
    strap(nh([[288, 146], [296, 200], [298, 236]]), 4, lea);
    [nh([[286, 150]])[0], nh([[244, 230]])[0]].forEach((q) => { const z = m(q); K.paint(c, K.ell(z[0], z[1], 7, 7), brass, w * 0.6); });
    if (tack) strap(nh([[244, 232], [272, 300], [330, 332]]).concat([[400, 300], [446, 244]]), 4, lea);
  }
  if (tack) {
    const lea = "#3e2a20", cloth = o.blanket ? K.toneOf(o.blanket) : "#8a4440", sad = "#a07a52", brass = "#c9a24a";
    strap([[440, 282], [404, 300], [366, 318]], 7, "#7a3b2c");
    strap([[560, 262], [622, 270], [698, 276]], 7, "#7a3b2c");
    K.paint(c, K.ell(451 - 628, 270 - 552, 7, 7), brass, w * 0.6);
    K.paint(c, P(rr(432, 220, 588, 332, 10)), cloth, w);
    strap([[482, 318], [480, 384]], 9, lea);
    K.paint(c, P([[438, 196], [452, 194], [464, 226], [500, 234], [532, 226], [546, 194], [558, 198], [554, 232], [530, 252], [468, 254], [444, 234]]), sad, w);
    K.paint(c, P([[468, 248], [532, 248], [530, 316], [500, 328], [470, 314]]), K.shade(sad, 0.9), w);
    strap([[498, 252], [498, 372]], 6, lea);
    const sp = [[484, 370], [512, 370], [516, 396], [480, 396]].map(m);
    c.lineWidth = w * 1.4; c.strokeStyle = ol; c.stroke(K.smooth(sp, true));
    c.lineWidth = w * 0.7; c.strokeStyle = "#d8d8de"; c.stroke(K.smooth(sp, true));
  }
  c.restore();
  const ox = K.num(o.x, 0), oy = K.num(o.y, 0);
  const pt = (q) => [ox + f * q[0], oy + q[1]];
  const earTop = oy + (Math.min(nh([[257, 106]])[0][1], 212) - 552 + lieDy) * s - bob * s;
  let rider = null;
  if (o.rider) {
    const rr = K.num(o.rider.r, R * 0.62);
    c.save(); c.translate(ox, oy); c.scale(f, 1);
    const seat = m([497, 230]);
    const info = K.person(c, Object.assign({}, o.rider, { x: seat[0] * s, y: (seat[1] - bob + lieDy) * s + st.hip * rr, r: rr, facing: 1, pose: "ride", noShadow: true, look: K.num(o.rider.look, 0) * f, t }));
    c.restore();
    if (info) rider = { head: pt(info.head), hand: pt(info.hand), backHand: pt(info.backHand), top: oy + info.top, height: info.height };
  }
  return { back: oy + (lieDy - 340) * s, top: rider ? Math.min(rider.top, earTop) : earTop, rider };
}`;
