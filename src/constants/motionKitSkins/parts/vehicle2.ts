// Modern and civilian vehicles for the sketch and comic skins, side view: taxi, police car, bus, bicycle, motorbike,
// steam train, jet, airliner, helicopter, airship, balloon, submarine, rocket, missile. Flat skin-ink drawing with
// panel lines, rivets and simple shading; footprints follow the core kit (units of R, ground y = 0, front toward +x).
export const SKIN_PART_VEHICLE2 = `(c, o0, K) => {
  const o = Object.assign({}, o0 || {});
  const kind = o.kind;
  const LIST = ["taxi", "police", "bus", "bicycle", "motorbike", "train", "jet", "airliner", "helicopter", "airship", "balloon", "submarine", "rocket", "missile"];
  if (LIST.indexOf(kind) < 0 || (o.view && o.view !== "side")) return null;
  const st = K.S(), R = K.num(o.r, 30), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R) * 0.9, ol = st.ol;
  const f = K.num(o.facing, 1) < 0 ? -1 : 1, moving = o.moving !== false && o.pose !== "stand", night = K.NIGHT();
  const air = /jet|airliner|helicopter|airship|balloon|rocket|missile/.test(kind), sea = kind === "submarine";
  const spin = moving ? (o.distance != null ? +o.distance / R : t * 6) : 0;
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const rr = (x0, y0, x1, y1, q) => S([[x0 + q, y0], [x1 - q, y0], [x1, y0], [x1, y0 + q], [x1, y1 - q], [x1, y1], [x1 - q, y1], [x0 + q, y1], [x0, y1], [x0, y1 - q], [x0, y0 + q], [x0, y0]]);
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.55), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, K.toneOf(col)); };
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-4.5 * R, -5.5 * R, 3.5 * R, 1 * R] }, k || {}));
  const glass = (p) => K.paint(c, p, night ? "#f2c66a" : "#3c4a58", w * 0.7);
  const tyre = (x, y, r, hub) => { K.paint(c, K.ell(x * R, y * R, r * R, r * R), "#2e2e32", w); K.paint(c, K.ell(x * R, y * R, r * 0.55 * R, r * 0.55 * R), K.toneOf(hub || "#8a8a90"), w * 0.6); for (let i = 0; i < 5; i++) { const a = spin + i * 1.2566; c.fillStyle = ol; c.fill(K.ell((x + Math.cos(a) * r * 0.3) * R, (y + Math.sin(a) * r * 0.3) * R, 0.035 * R, 0.035 * R)); } };
  const spokeWheel = (x, y, r) => { c.lineWidth = w * 1.4; c.strokeStyle = ol; c.stroke(K.ell(x * R, y * R, r * R, r * R)); c.lineWidth = w * 0.6; c.strokeStyle = "#5a5a60"; c.stroke(K.ell(x * R, y * R, r * 0.92 * R, r * 0.92 * R)); for (let i = 0; i < 8; i++) { const a = spin + i * Math.PI / 4; ln([[x, y], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], 0.3); } };
  const smoke = (x, y, s) => { const fx = K.part && K.part("effect"); if (fx) fx(c, { kind: "smoke", x: x * R, y: y * R, r: s * R, t, seed: 2 }, K); };
  const rider = (x, y, k, extra) => { if (!o.crew) return; const p = Array.isArray(o.crew) ? o.crew[0] : o.crew; const r2 = R * k; K.person(c, Object.assign({}, typeof p === "object" ? p : {}, extra || {}, { x: x * R, y: y * R + st.hip * r2, r: r2, facing: 1, pose: "ride", arms: "rein", noShadow: true, t })); };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(f, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  if (!air && !sea) { c.fillStyle = "rgba(20,16,12,0.24)"; c.fill(K.ell(0, 0, (kind === "train" ? 3.1 : /bicycle|motorbike/.test(kind) ? 1.3 : 2.4) * R, 0.2 * R)); }
  if (air) { c.translate(0, Math.sin(t * 1.3 + K.num(o.seed, 0)) * 0.08 * R); c.rotate(-K.num(o.tilt, 0) * Math.PI / 180); }
  if (sea) c.translate(0, Math.sin(t * 1.6) * 0.05 * R);
  switch (kind) {
    case "taxi": case "police": {
      const col = o.color || (kind === "taxi" ? "#d8a83a" : "#e6e6e8");
      const p = S([[-2.2, -0.5], [-2.2, -0.5], [-2.2, -1.05], [-1.15, -1.15], [-0.7, -1.7], [0.75, -1.7], [1.2, -1.15], [2.2, -1.0], [2.25, -0.5], [2.25, -0.5]]);
      fl(p, col);
      glass(S([[-0.6, -1.15], [-0.48, -1.58], [0.0, -1.58], [0.0, -1.15]])); glass(S([[0.12, -1.15], [0.12, -1.58], [0.65, -1.58], [0.98, -1.15]]));
      ln([[0.06, -1.15], [0.06, -0.55]], 0.5); ln([[-2.2, -0.82], [2.22, -0.82]], 0.45);
      if (kind === "taxi") { fl(rr(-0.3, -1.95, 0.3, -1.7, 0.04), "#f2e6c0", { hatch: false }); for (let i = 0; i < 6; i++) { c.fillStyle = ol; c.fillRect((-1.9 + i * 0.3) * R, -0.92 * R, 0.15 * R, 0.08 * R); } }
      else { const b = Math.sin(t * 8) > 0; K.paint(c, rr(-0.35, -1.95, -0.02, -1.7, 0.04), b ? "#d84a3a" : "#7a2a22", w * 0.8); K.paint(c, rr(0.02, -1.95, 0.35, -1.7, 0.04), b ? "#2a4a8a" : "#4a7ae0", w * 0.8); ln([[-2.1, -0.75], [2.15, -0.75]], 1.6, "#2a4a8a"); }
      tyre(-1.35, -0.42, 0.42); tyre(1.35, -0.42, 0.42); rider(0.35, -0.95, 0.4);
      break;
    }
    case "bus": {
      const col = o.color || "#c89a3a";
      const p = rr(-2.9, -2.05, 2.95, -0.45, 0.25); fl(p, col);
      for (let i = 0; i < 6; i++) glass(rr(-2.6 + i * 0.85, -1.8, -1.95 + i * 0.85, -1.25, 0.06));
      fl(rr(2.25, -1.8, 2.75, -0.55, 0.05), K.shade(col, 0.85), { hatch: false }); glass(rr(2.3, -1.75, 2.7, -1.25, 0.04));
      ln([[-2.9, -1.05], [2.95, -1.05]], 0.5); ln([[-2.9, -0.95], [2.25, -0.95]], 1.2, K.shade(col, 0.7));
      tyre(-1.9, -0.42, 0.45); tyre(-1.0, -0.42, 0.45); tyre(1.9, -0.42, 0.45);
      break;
    }
    case "bicycle": case "motorbike": {
      const moto = kind === "motorbike";
      if (moto) { tyre(-0.95, -0.42, 0.42); tyre(0.95, -0.42, 0.42); fl(S([[-0.8, -0.65], [-0.5, -1.05], [0.35, -1.1], [0.75, -0.75], [0.2, -0.6]]), o.color || "#8a3a35"); fl(rr(-0.75, -1.15, -0.05, -0.95, 0.08), "#2e2e32", { hatch: false }); beam([[0.75, -0.75], [0.95, -0.42]], 0.06, "#5a5a60"); beam([[0.55, -1.0], [0.7, -1.3]], 0.05, "#5a5a60"); }
      else { spokeWheel(-0.95, -0.45, 0.45); spokeWheel(0.95, -0.45, 0.45); const fr = o.color || "#2a5a8a"; beam([[-0.95, -0.45], [-0.25, -0.45], [0.55, -1.0], [-0.3, -1.0], [-0.95, -0.45]], 0.045, fr); beam([[-0.3, -1.0], [-0.25, -0.45]], 0.045, fr); beam([[0.55, -1.0], [0.95, -0.45]], 0.045, fr); beam([[0.5, -1.0], [0.6, -1.25], [0.75, -1.25]], 0.04, "#3a3a40"); fl(rr(-0.45, -1.12, -0.15, -1.02, 0.04), "#2e2e32", { hatch: false }); }
      rider(-0.3, moto ? -1.05 : -1.1, 0.42, { arms: "rein", pose: "ride" });
      break;
    }
    case "train": {
      const col = o.color || "#2e2e34";
      fl(rr(-3.0, -3.0, -1.4, -0.6, 0.05), K.shade(col, 1.15)); glass(rr(-2.75, -2.7, -1.65, -2.0, 0.05)); fl(rr(-3.15, -3.25, -1.25, -3.0, 0.04), K.shade(col, 0.9), { hatch: false });
      const boiler = rr(-1.45, -2.2, 2.7, -0.75, 0.6); fl(boiler, col);
      [-0.6, 0.4, 1.4].forEach((x) => ln([[x, -2.2], [x, -0.75]], 0.6, "#8a6a3a"));
      fl(rr(1.6, -3.4, 2.0, -2.15, 0.05), K.shade(col, 0.9), { hatch: false }); fl(S([[1.45, -3.4], [2.15, -3.4], [2.05, -3.65], [1.55, -3.65]]), K.shade(col, 0.9), { hatch: false });
      fl(rr(0.2, -2.6, 0.7, -2.15, 0.2), "#b8863a", { hatch: false });
      fl(P([[2.7, -0.75], [3.15, -0.2], [2.7, -0.2]]), "#8a3a35", { hatch: false });
      fl(rr(-3.1, -0.7, 2.95, -0.45, 0.04), "#3a3a40", { hatch: false });
      [[-2.4, 0.42], [-1.0, 0.55], [0.3, 0.55], [1.6, 0.55]].forEach(([x, r]) => { K.paint(c, K.ell(x * R, -r * R, r * R, r * R), "#8a3a35", w); for (let i = 0; i < 8; i++) { const a = spin + i * Math.PI / 4; ln([[x, -r], [x + Math.cos(a) * r * 0.85, -r + Math.sin(a) * r * 0.85]], 0.4); } });
      beam([[-1.0 + Math.cos(spin) * 0.3, -0.55 + Math.sin(spin) * 0.3], [1.6 + Math.cos(spin) * 0.3, -0.55 + Math.sin(spin) * 0.3]], 0.07, "#8a8a90");
      if (moving) smoke(1.8, -3.8, 0.45);
      break;
    }
    case "jet": case "airliner": {
      const big = kind === "airliner", col = o.color || (big ? "#e8e8ec" : "#7a8494"), L = big ? 2.3 : 1.6;
      const body = S([[-L - 0.1, -0.5], [-L + 0.4, -0.75], [L - 0.5, -0.75], [L + 0.05, -0.55], [L + 0.05, -0.45], [L - 0.5, -0.25], [-L + 0.4, -0.25]]); fl(body, col);
      K.fill(c, S([[-L + 0.05, -0.7], [-L - 0.15, -1.15], [-L + 0.35, -1.15], [-L + 0.7, -0.72]]), K.shade(col, 0.9), w, { R, hatch: false });
      fl(S([[-0.5, -0.45], [0.3, -0.45], [-0.6, 0.35], [-0.95, 0.35]]), K.shade(col, 0.92), { hatch: false });
      if (big) { for (let i = 0; i < 9; i++) K.paint(c, K.ell((-1.5 + i * 0.38) * R, -0.58 * R, 0.06 * R, 0.07 * R), "#3c4a58", w * 0.4); ln([[-L + 0.3, -0.42], [L - 0.4, -0.42]], 1.2, "#3a5a8a"); fl(rr(-0.4, -0.15, 0.2, 0.08, 0.1), K.shade(col, 0.8), { hatch: false }); }
      glass(S([[L - 0.45, -0.72], [L - 0.05, -0.58], [L - 0.45, -0.58]]));
      if (moving && !big) { c.fillStyle = "#f2b632"; c.fill(K.ell((-L - 0.25) * R, -0.5 * R, 0.18 * R, 0.08 * R)); }
      break;
    }
    case "helicopter": {
      const col = o.color || "#5f6b3e";
      fl(S([[-0.9, -0.3], [-1.0, -0.85], [-0.4, -1.15], [0.6, -1.15], [1.2, -0.75], [1.1, -0.3]]), col);
      glass(S([[0.45, -1.1], [1.15, -0.72], [0.55, -0.62]]));
      beam([[-0.95, -0.75], [-3.0, -0.95]], 0.12, K.shade(col, 0.95)); fl(S([[-3.1, -1.4], [-2.8, -1.4], [-2.85, -0.85], [-3.05, -0.85]]), K.shade(col, 0.9), { hatch: false });
      ln([[-0.6, -0.05], [0.8, -0.05]], 1.4, "#3a3a40"); ln([[-0.3, -0.3], [-0.4, -0.05]], 0.8); ln([[0.5, -0.3], [0.45, -0.05]], 0.8);
      beam([[0, -1.15], [0, -1.35]], 0.06, "#3a3a40"); const ra = Math.cos(t * 40) * 2.6; ln([[-ra, -1.4], [ra, -1.38]], 1.0, "#3a3a40"); const ta = t * 50; ln([[-2.95 + Math.cos(ta) * 0.35, -0.95 + Math.sin(ta) * 0.35], [-2.95 - Math.cos(ta) * 0.35, -0.95 - Math.sin(ta) * 0.35]], 0.7);
      break;
    }
    case "airship": {
      const col = o.color || "#b8b4a8"; const env = S([[-3.3, -1.0], [-2.6, -1.75], [0, -1.8], [2.2, -1.55], [2.6, -1.0], [2.2, -0.45], [0, -0.2], [-2.6, -0.25]]); fl(env, col);
      c.save(); c.clip(env); for (let i = 0; i < 9; i++) ln([[-3 + i * 0.65, -1.9], [-3 + i * 0.65, -0.1]], 0.4); c.restore();
      fl(P([[-3.0, -1.0], [-3.45, -1.7], [-2.6, -1.25]]), K.shade(col, 0.85), { hatch: false }); fl(P([[-3.0, -1.0], [-3.45, -0.3], [-2.6, -0.75]]), K.shade(col, 0.85), { hatch: false });
      fl(rr(-0.6, -0.15, 0.7, 0.2, 0.06), "#6a5a4a", { hatch: false }); [-0.35, 0, 0.35].forEach((x) => K.paint(c, K.ell(x * R, 0.02 * R, 0.07 * R, 0.06 * R), night ? "#f2c66a" : "#3c4a58", w * 0.4));
      break;
    }
    case "balloon": {
      const sw = Math.sin(t * 1.2) * 0.05; const env = S([[0, -3.2], [1.3, -2.6], [1.25, -1.6], [0.45, -0.8], [-0.45, -0.8], [-1.25, -1.6], [-1.3, -2.6]]);
      fl(env, o.color || "#a83a2e"); c.save(); c.clip(env); [-0.65, 0, 0.65].forEach((x, i) => { c.fillStyle = K.toneOf(i === 1 ? "#e0b84a" : "#e6dccc"); c.fill(S([[x - 0.15, -3.3], [x + 0.15, -3.3], [x * 0.4 + 0.08, -0.8], [x * 0.4 - 0.08, -0.8]])); }); c.restore(); c.lineWidth = w; c.strokeStyle = ol; c.stroke(env);
      [-0.4, 0.4].forEach((x) => ln([[x, -0.82], [x * 0.7 + sw, -0.15]], 0.5)); fl(rr(-0.3 + sw, -0.18, 0.3 + sw, 0.15, 0.05), "#8a6444", { hatch: false });
      break;
    }
    case "submarine": {
      const col = o.color || "#3e4450"; ln([[-3.2, 0], [2.3, 0]], 0.6, "#5a7a8a");
      fl(rr(-3.0, -1.0, 2.2, -0.15, 0.42), col); fl(rr(-0.5, -1.65, 0.6, -0.95, 0.1), K.shade(col, 1.1)); beam([[0.2, -1.65], [0.2, -2.15], [0.45, -2.15]], 0.05, "#5a5a60");
      fl(P([[-3.0, -0.6], [-3.25, -1.0], [-3.25, -0.2]]), K.shade(col, 0.9), { hatch: false }); for (let i = 0; i < 4; i++) K.paint(c, K.ell((-1.8 + i * 0.7) * R, -0.55 * R, 0.08 * R, 0.08 * R), K.shade(col, 1.25), w * 0.4);
      break;
    }
    case "rocket": case "missile": {
      const big = kind === "rocket", L = big ? 2.3 : 2.2, H = big ? 0.42 : 0.28, col = o.color || (big ? "#e6e6ea" : "#7a8494");
      fl(S([[-L, -0.55 - H], [L - 0.7, -0.55 - H], [L + 0.05, -0.55], [L - 0.7, -0.55 + H], [-L, -0.55 + H]]), col);
      fl(P([[-L + 0.1, -0.55 - H], [-L - 0.35, -0.55 - H - 0.45], [-L + 0.7, -0.55 - H]]), "#a83a2e", { hatch: false }); fl(P([[-L + 0.1, -0.55 + H], [-L - 0.35, -0.55 + H + 0.45], [-L + 0.7, -0.55 + H]]), "#a83a2e", { hatch: false });
      ln([[L - 0.7, -0.55 - H], [L - 0.7, -0.55 + H]], 0.5); if (big) K.paint(c, K.ell(0.6 * R, -0.55 * R, 0.14 * R, 0.14 * R), "#3c4a58", w * 0.6);
      if (moving) { const fl2 = 0.6 + Math.sin(t * 30) * 0.12; K.paint(c, S([[-L, -0.55 - H * 0.6], [-L - fl2 * 1.4, -0.55], [-L, -0.55 + H * 0.6]]), "#f2b632", w * 0.6); smoke(-L - 1.8, -0.4, 0.3); }
      break;
    }
  }
  c.restore();
  return true;
}`;
