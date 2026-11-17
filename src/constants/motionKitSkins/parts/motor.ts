// Road vehicles of the 19th and 20th centuries and animal-drawn carts for every skin, side view (units of R, ground
// y = 0, front toward +x): earlyCar (a Model T), earlyTruck (a canvas-covered army lorry), armoredCar, halftrack,
// sidecar (a motorcycle with sidecar), rickshaw, cyclo, oxCart, horseCarriage, tram, scooter, tractor. Wheels turn when
// moving; a drawn cart shows its animal (ox or horse) through the shared animal parts.
export const MOTION_KIT_MOTOR_KINDS = ["earlyCar", "earlyTruck", "armoredCar", "halftrack", "sidecar", "rickshaw", "cyclo", "oxCart", "horseCarriage", "tram", "scooter", "tractor"];
export const SKIN_PART_MOTOR = `(c, o, K) => {
  const kind = o.kind;
  if (${JSON.stringify(MOTION_KIT_MOTOR_KINDS)}.indexOf(kind) < 0 || (o.view && o.view !== "side")) return null;
  const st = K.S(), R = K.num(o.r, 30), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R) * 0.9, ol = st.ol, night = K.NIGHT();
  const moving = o.moving !== false && o.pose !== "stand", spin = moving ? (o.distance != null ? +o.distance / R : t * 6) : 0;
  const wood = K.toneOf(night ? "#5a4636" : "#8a6040"), metal = K.toneOf(o.color || (night ? "#3a3c42" : "#2e3034")), olive = K.toneOf(o.color || (night ? "#4a5038" : "#6a7350")), canvas = K.toneOf(night ? "#6a6a52" : "#8e8e6a"), glass = K.toneOf(night ? "#4a5a70" : "#a8c4d8"), rubber = K.toneOf("#24242a"), red = K.toneOf(o.color || "#9a3a30"), cream = K.toneOf(night ? "#b8b0a0" : "#ece2c8");
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const E = (x, y, a, b) => K.ell(x * R, y * R, a * R, b * R);
  const rect = (x0, y0, x1, y1) => P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-4 * R, -5 * R, 4 * R, 0.5 * R] }, k || {}));
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, col || wood); };
  // A wheel: tyre, rim and spokes (n) or a solid hub, turning with the distance travelled.
  const wheel = (x, r, n, hub) => { fl(E(x, -r, r, r), rubber, { hatch: false }); fl(E(x, -r, r * 0.72, r * 0.72), hub || K.toneOf("#8a8c90"), { hatch: false }); if (n) for (let i = 0; i < n; i++) { const a = spin + i * Math.PI * 2 / n; ln([[x, -r], [x + Math.cos(a) * r * 0.7, -r + Math.sin(a) * r * 0.7]], 0.45); } fl(E(x, -r, r * 0.16, r * 0.16), K.toneOf("#4a4c52"), { hatch: false }); };
  const woodWheel = (x, r) => { fl(E(x, -r, r, r), K.shade(wood, 0.8), { hatch: false }); fl(E(x, -r, r * 0.8, r * 0.8), K.shade(wood, 1.1), { hatch: false }); for (let i = 0; i < 10; i++) { const a = spin + i * Math.PI / 5; ln([[x, -r], [x + Math.cos(a) * r * 0.8, -r + Math.sin(a) * r * 0.8]], 0.5, K.shade(wood, 0.6)); } fl(E(x, -r, r * 0.18, r * 0.18), K.shade(wood, 0.6), { hatch: false }); };
  const animal = (kind2, x) => { if (typeof K.person !== "function" || !K.part) return; const part = K.part(kind2 === "ox" ? "quad" : "horse"); if (part) part(c, { kind: kind2, x: x * R, y: 0, r: R * (kind2 === "ox" ? 0.82 : 0.78), facing: 1, pose: moving ? "walk" : "stand", t, seed: K.num(o.seed, 3) }, K); };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  K.shadow(c, E(0, 0.03, 2.2, 0.14), 0.22, 0.14 * R);
  switch (kind) {
    case "earlyCar": {
      fl(S([[-1.7, -0.75], [-1.75, -1.25], [-0.2, -1.3], [0.4, -1.25], [0.45, -1.05], [1.55, -1.0], [1.65, -0.72]]), metal);
      fl(rect(-1.45, -2.25, 0.1, -2.15), metal); [-1.4, 0.05].forEach((x) => beam([[x, -2.2], [x, -1.28]], 0.05, metal));
      fl(rect(0.5, -1.45, 0.62, -1.02), K.toneOf("#c8a040")); fl(rect(0.0, -1.55, 0.12, -1.3), glass);
      ln([[-1.9, -0.72], [-1.2, -0.95], [1.2, -0.9], [1.9, -0.72]], 1.4);
      wheel(-1.15, 0.62, 12, K.toneOf("#c8b890")); wheel(1.15, 0.62, 12, K.toneOf("#c8b890"));
      break;
    }
    case "earlyTruck": {
      fl(rect(-2.2, -1.25, 0.6, -0.9), K.shade(olive, 0.85));
      const cover = S([[-2.25, -1.2], [-2.25, -2.6], [-1.9, -2.85], [0.25, -2.85], [0.55, -2.6], [0.55, -1.2]]); fl(cover, canvas); for (let x = -1.7; x < 0.4; x += 0.5) ln([[x, -2.85], [x, -1.2]], 0.4);
      fl(S([[0.65, -0.9], [0.65, -2.2], [1.25, -2.25], [1.45, -1.6], [2.1, -1.5], [2.15, -0.9]]), olive); fl(P([[0.8, -2.05], [1.2, -2.08], [1.32, -1.6], [0.8, -1.6]]), glass);
      ln([[1.5, -1.3], [2.1, -1.3]], 0.5); wheel(-1.4, 0.55, 0, K.toneOf("#6a6e58")); wheel(1.5, 0.55, 0, K.toneOf("#6a6e58"));
      break;
    }
    case "armoredCar": {
      fl(P([[-2.0, -0.7], [-2.1, -1.6], [-1.5, -1.95], [1.2, -1.95], [1.9, -1.55], [2.05, -0.7]]), olive);
      fl(rect(-0.7, -2.55, 0.5, -1.95), K.shade(olive, 0.92)); beam([[0.5, -2.3], [1.5, -2.3]], 0.1, K.toneOf("#3a3c34"));
      for (let x = -1.8; x <= 1.8; x += 0.45) { c.fillStyle = ol; c.fill(E(x, -1.0, 0.04, 0.04)); }
      fl(rect(1.2, -1.6, 1.5, -1.45), K.toneOf("#1e1e22"), { hatch: false });
      wheel(-1.3, 0.55, 0, K.toneOf("#5a5e4a")); wheel(1.3, 0.55, 0, K.toneOf("#5a5e4a"));
      break;
    }
    case "halftrack": {
      fl(S([[-2.3, -0.4], [-2.3, -0.85], [-2.0, -0.95], [-0.2, -0.95], [0.1, -0.85], [0.1, -0.4]]), K.toneOf("#3a3c3a"));
      for (let i = 0; i < 4; i++) fl(E(-1.95 + i * 0.6, -0.42, 0.26, 0.26), K.toneOf("#5a5c52"), { hatch: false });
      fl(P([[-2.3, -0.95], [-2.3, -1.8], [0.4, -1.8], [0.9, -1.45], [2.1, -1.35], [2.15, -0.8], [0.3, -0.8]]), olive);
      fl(P([[0.4, -1.8], [0.6, -2.25], [1.0, -2.25], [0.9, -1.45]]), glass);
      wheel(1.55, 0.5, 0, K.toneOf("#5a5e4a"));
      break;
    }
    case "sidecar": {
      wheel(-1.05, 0.48, 10); wheel(1.05, 0.48, 10);
      fl(S([[-1.0, -0.6], [-0.3, -1.25], [0.6, -1.2], [1.0, -0.65], [0.2, -0.55]]), metal);
      beam([[0.65, -1.2], [0.95, -1.55]], 0.06, K.toneOf("#8a8c90")); beam([[0.85, -1.6], [1.15, -1.5]], 0.05, rubber);
      fl(S([[-1.3, -0.5], [-1.25, -1.1], [-0.2, -1.15], [0.2, -0.9], [0.1, -0.45]]), K.shade(metal, 1.25));
      fl(E(-0.1, -0.35, 0.3, 0.3), rubber, { hatch: false });
      break;
    }
    case "rickshaw": {
      woodWheel(-0.4, 0.95);
      fl(S([[-1.3, -1.2], [-1.25, -1.95], [-0.75, -2.0], [-0.7, -1.2]]), red);
      const hood = S([[-1.35, -1.9], [-1.25, -2.9], [-0.55, -2.95], [-0.25, -2.4], [-0.6, -1.95]]); fl(hood, K.toneOf("#2a2a2e"));
      fl(rect(-1.3, -1.25, -0.2, -1.05), red); beam([[-0.2, -1.15], [2.2, -0.6]], 0.07); beam([[2.2, -0.6], [2.2, -0.4]], 0.06);
      break;
    }
    case "cyclo": {
      wheel(-1.25, 0.45, 12); wheel(-0.1, 0.45, 12); wheel(1.4, 0.48, 12);
      fl(S([[-1.7, -0.75], [-1.7, -1.4], [-1.45, -1.55], [-0.15, -1.55], [0.05, -1.0], [-0.1, -0.75]]), red);
      fl(S([[-1.75, -1.4], [-1.6, -2.25], [-0.35, -2.3], [-0.05, -1.55]]), K.toneOf("#2a2a2e"));
      beam([[0.0, -0.95], [1.4, -0.48]], 0.06, metal); beam([[0.6, -0.7], [0.75, -1.45]], 0.06, metal); fl(rect(0.6, -1.55, 0.95, -1.45), rubber); beam([[1.4, -0.48], [1.2, -1.45]], 0.06, metal); beam([[1.05, -1.5], [1.35, -1.45]], 0.05, rubber);
      break;
    }
    case "oxCart": {
      animal("ox", 2.6);
      fl(rect(-1.8, -1.55, 0.9, -1.2), wood); for (let x = -1.6; x < 0.9; x += 0.4) beam([[x, -1.55], [x, -2.0]], 0.07); beam([[-1.8, -2.0], [0.9, -2.0]], 0.06);
      beam([[0.9, -1.35], [2.6, -1.95]], 0.09); woodWheel(-0.45, 0.95);
      break;
    }
    case "horseCarriage": {
      animal("horse", 2.7);
      fl(S([[-2.1, -1.15], [-2.15, -2.7], [-1.9, -3.0], [0.3, -3.0], [0.5, -2.7], [0.55, -1.15]]), K.toneOf(o.color || "#2a2a30")); fl(rect(-1.55, -2.65, -0.3, -1.9), glass); fl(rect(-0.15, -2.55, 0.25, -1.4), K.shade(K.toneOf(o.color || "#2a2a30"), 1.3));
      beam([[0.55, -1.4], [2.7, -2.0]], 0.07); woodWheel(-1.6, 0.85); woodWheel(0.25, 0.65);
      ln([[-2.1, -3.05], [0.5, -3.05]], 1.2, K.toneOf("#c8a040"));
      break;
    }
    case "tram": {
      fl(S([[-2.9, -0.55], [-3.0, -2.6], [-2.6, -2.85], [2.6, -2.85], [3.0, -2.6], [2.9, -0.55]]), K.toneOf(o.color || "#b84a30"));
      for (let i = 0; i < 6; i++) fl(rect(-2.6 + i * 0.9, -2.45, -2.05 + i * 0.9, -1.7), glass, { hatch: false });
      fl(rect(-2.95, -1.2, 2.95, -1.0), cream); ln([[0, -2.85], [0.6, -3.6], [1.6, -3.9]], 0.8);
      [-2.0, -1.4, 1.4, 2.0].forEach((x) => wheel(x, 0.3, 0, K.toneOf("#3a3a3e")));
      break;
    }
    case "scooter": {
      wheel(-0.85, 0.38, 0); wheel(0.95, 0.38, 0);
      fl(S([[-1.2, -0.5], [-1.15, -1.0], [-0.3, -1.05], [0.0, -0.55], [0.6, -0.5], [0.95, -0.75], [0.85, -1.35], [0.7, -1.4], [0.6, -0.9], [0.1, -0.35], [-1.0, -0.35]]), K.toneOf(o.color || "#7ab0a8"));
      fl(rect(-1.05, -1.2, -0.25, -1.02), K.toneOf("#4a3a2e")); beam([[0.75, -1.4], [0.6, -1.75]], 0.05, metal); beam([[0.45, -1.78], [0.8, -1.72]], 0.05, rubber);
      break;
    }
    case "tractor": {
      wheel(-0.9, 1.0, 0, K.toneOf("#c8302a")); for (let i = 0; i < 12; i++) { const a = spin + i * Math.PI / 6; ln([[-0.9 + Math.cos(a) * 0.95, -1 + Math.sin(a) * 0.95], [-0.9 + Math.cos(a) * 1.05, -1 + Math.sin(a) * 1.05]], 1.4); }
      fl(rect(-0.4, -1.55, 1.7, -0.8), K.toneOf(o.color || "#3a7a3a")); beam([[1.2, -1.55], [1.2, -2.2]], 0.08, K.toneOf("#3a3a3e"));
      fl(rect(-1.1, -2.5, -0.3, -2.4), K.toneOf("#3a3a3e")); beam([[-1.0, -2.45], [-1.0, -1.6]], 0.05, metal); fl(rect(-0.9, -1.85, -0.45, -1.6), K.toneOf("#4a3a2e"));
      wheel(1.35, 0.5, 0, K.toneOf("#c8302a"));
      break;
    }
  }
  c.restore();
  return true;
}`;
