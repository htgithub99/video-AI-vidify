// The remaining scenery for the sketch and comic skins: landforms, water, sky bodies, weather and plants.
// Same options and footprints as the core kit (x, y, r, width, height, count, seed). Sun and moon keep the core
// clamp-into-frame logic (the hook runs after it).
export const SKIN_PART_SCENERY2 = `(c, o, K) => {
  const kind = o.kind;
  const st = K.S(), R = K.num(o.r, 40), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R), ol = st.ol, night = K.NIGHT(), ink = !!st.hatch;
  const rnd = (i) => K.rnd(K.num(o.seed, 2), i);
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const Sp = (pts) => K.smooth(pts, true);
  const E = (x, y, a, b) => K.ell(x * R, y * R, a * R, b * R);
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const lnp = (pts, k, col) => K.line(c, pts, w * (k || 0.5), col || ol);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-14 * R, -7 * R, 14 * R, 8 * R] }, k || {}));
  const clip = (p, fn) => { c.save(); c.clip(p); fn(); c.restore(); };
  const water = o.color || (night ? "#4a5e6e" : st.water || "#6a94a8"), grass = (st.ground && st.ground.grass) || "#6d8a3f";
  const leaves = night ? K.organic.leafNight : K.organic.leaf;
  const ripples = (x0, x1, y0, y1, n, col) => { for (let i = 0; i < n; i++) { const x = x0 + ((rnd(i) * (x1 - x0) + t * 12) % (x1 - x0)), y = y0 + rnd(i + 30) * (y1 - y0), s = 0.25 + rnd(i + 60) * 0.35; lnp([[x - s * R, y], [x - s * 0.3 * R, y - 0.06 * R], [x + s * 0.3 * R, y], [x + s * R, y - 0.04 * R]], 0.45, col || "#e8f0f2"); } };
  const reed = (x, y, h, k) => { lnp([[x, y], [x + Math.sin(t + x) * 0.06 * R, y - h]], 0.9 * (k || 1), K.toneOf("#6a7a3a")); K.paint(c, K.ell(x + Math.sin(t + x) * 0.06 * R, y - h + 0.12 * R, 0.06 * R, 0.16 * R), "#7a5a3a", w * 0.5); };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  switch (kind) {
    case "mountain": { const p = S([[-3.0, 0], [-1.6, -2.2], [-1.0, -2.0], [-0.1, -4.0], [0.6, -3.2], [1.2, -3.4], [3.0, 0]]); fl(p, o.color || (night ? "#5e6270" : "#8e94a2"), { dx: -0.6 * R, dy: 0 }); clip(p, () => { K.paint(c, S([[-0.55, -3.1], [-0.1, -4.05], [0.6, -3.2], [0.35, -2.95], [0.1, -3.2], [-0.2, -2.9]]), night ? "#c8c4bc" : "#f2f0ea", w * 0.6); ln([[-0.1, -4], [0.3, -2.0], [0.1, 0]], 0.5); ln([[1.2, -3.4], [1.6, -1.6]], 0.45); }); break; }
    case "hill": { const p = S([[-3.25, 0], [-2.2, -1.2], [-0.4, -1.75], [1.4, -1.5], [3.3, 0]]); fl(p, o.color || grass, { dx: -0.3 * R, dy: -0.2 * R }); clip(p, () => { for (let i = 0; i < 8; i++) { const x = -2.6 + rnd(i) * 5.2, y = -0.2 - rnd(i + 9) * 1.2; ln([[x - 0.06, y], [x, y - 0.18], [x + 0.06, y]], 0.5); } }); break; }
    case "flowers": { for (let i = 0; i < 6; i++) { const x = -0.9 + i * 0.33, h = 0.2 + rnd(i) * 0.12; ln([[x, 0], [x + 0.02, -h]], 0.6, K.toneOf(grass)); const col = o.color || ["#f2e8d0", "#e8c84a", "#d86a5a"][i % 3]; for (let j = 0; j < 5; j++) { const a = j * 1.2566; c.fillStyle = K.toneOf(col); c.fill(E(x + Math.cos(a) * 0.06, -h + Math.sin(a) * 0.06, 0.05, 0.05)); } K.paint(c, E(x, -h, 0.035, 0.035), "#c89a3a", w * 0.3); } break; }
    case "reeds": { for (let i = 0; i < 6; i++) reed((-0.6 + i * 0.22) * R, 0, (1.3 + rnd(i) * 0.6) * R); break; }
    case "sun": { const g = c.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 1.8); g.addColorStop(0, "rgba(255,214,110,0.3)"); g.addColorStop(1, "rgba(255,214,110,0)"); c.fillStyle = g; c.fill(E(0, 0, 1.8, 1.8)); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * 0.1; ln([[Math.cos(a) * 1.18, Math.sin(a) * 1.18], [Math.cos(a) * 1.45, Math.sin(a) * 1.45]], 1.2, "#e2a23a"); } fl(E(0, 0, 1, 1), o.color || "#f2c45a", { hatch: false, dx: -0.15 * R, dy: -0.15 * R }); break; }
    case "moon": { const g = c.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.9); g.addColorStop(0, "rgba(230,232,220,0.25)"); g.addColorStop(1, "rgba(230,232,220,0)"); c.fillStyle = g; c.fill(E(0, 0, 1.9, 1.9)); fl(E(0, 0, 1, 1), o.color || "#e6e2d2", { hatch: false, dx: -0.2 * R, dy: -0.12 * R }); [[-0.3, -0.25, 0.2], [0.35, 0.2, 0.14], [0.05, 0.45, 0.1]].forEach(([x, y, r]) => { c.lineWidth = w * 0.45; c.strokeStyle = ol; c.stroke(E(x, y, r, r)); }); break; }
    case "stars": { const W = K.num(o.width, 10 * R), H = K.num(o.height, 4 * R); for (let i = 0; i < K.num(o.count, 30); i++) { const a = 0.45 + 0.55 * Math.abs(Math.sin(t * 2 + i * 1.7)), x = (rnd(i) - 0.5) * W, y = -rnd(i + 50) * H, s = R * (0.05 + rnd(i + 90) * 0.06); c.save(); c.globalAlpha *= a; c.fillStyle = "#f6f0d8"; c.beginPath(); for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4, d = j % 2 ? s * 0.35 : s * 1.4; c.lineTo(x + Math.cos(an) * d, y + Math.sin(an) * d); } c.fill(); c.restore(); } break; }
    case "rain": case "snow": { const W = K.num(o.width, 10 * R), H = K.num(o.height, 6 * R); for (let i = 0; i < K.num(o.count, 60); i++) { const k = (t * (kind === "rain" ? 1.4 : 0.25) + rnd(i)) % 1, x = (rnd(i + 7) - 0.5) * W + (kind === "snow" ? Math.sin(t + i) * 0.2 * R : -k * 0.4 * R), y = -H + k * H; if (kind === "rain") lnp([[x, y], [x - 0.08 * R, y + 0.45 * R]], 0.5, "rgba(200,214,226,0.85)"); else { c.fillStyle = "#f4f4f0"; c.fill(K.ell(x, y, 0.06 * R, 0.06 * R)); c.lineWidth = w * 0.3; c.strokeStyle = ol; c.stroke(K.ell(x, y, 0.06 * R, 0.06 * R)); } } break; }
    case "mist": { const W = K.num(o.width, 10 * R); for (let i = 0; i < 6; i++) { const mx = ((rnd(i) - 0.5) * W + t * 10 * (i % 2 ? 1 : -1)) % (W / 2), my = -rnd(i + 3) * R; c.save(); c.globalAlpha *= night ? 0.22 : 0.32; const list = []; for (let j = 0; j < 5; j++) list.push(K.ell(mx + (j - 2) * W * 0.07, my + Math.sin(j * 1.7) * 0.12 * R, W * 0.09, R * 0.3)); const all = new Path2D(); list.forEach((p) => all.addPath(p)); c.fillStyle = "#f0f0ec"; c.fill(all); c.restore(); } break; }
    case "puddle": { fl(S([[-1.2, 0], [-0.8, -0.18], [0.3, -0.2], [1.2, -0.05], [0.9, 0.16], [-0.6, 0.18]]), water, { hatch: false }); ripples(-0.8 * R, 0.8 * R, -0.05 * R, 0.08 * R, 2); break; }
    case "ricePaddy": case "field": { const W = K.num(o.width, 8 * R), H = K.num(o.height, 1.5 * R); const p = Sp([[-W / 2, 0], [-W / 2 + H, -H], [W / 2 - H, -H], [W / 2, 0]]); const paddy = kind === "ricePaddy"; fl(p, paddy ? (night ? "#5e7a7a" : "#8ab0b0") : o.color || (night ? "#9a8a50" : "#c8aa5a"), { box: [-W / 2, -H, W / 2, 0] }); clip(p, () => { for (let r = 0; r < 7; r++) { const k = (r + 0.5) / 7, y = -H * (1 - k), half = W / 2 - H * (1 - k); for (let j = 0; j < 16; j++) { const x = -half + (j + 0.5) * (2 * half / 16), s = (0.08 + k * 0.12) * R; lnp([[x - s, y], [x, y - s * 1.8], [x + s, y]], 0.5, K.toneOf(paddy ? "#5a8a3a" : "#8a6a2a")); } } }); break; }
    case "river": case "stream": case "lake": case "pond": case "swamp": {
      const W = K.num(o.width, kind === "pond" ? 4 * R : kind === "lake" ? 8.4 * R : 10 * R), H = K.num(o.height, kind === "pond" ? 1.2 * R : kind === "lake" ? 2 * R : kind === "stream" ? 1.4 * R : 1.2 * R);
      const round = kind === "lake" || kind === "pond" || kind === "swamp";
      const p = round ? Sp([[-W / 2, 0], [-W * 0.35, -H * 0.5], [0, -H * 0.55], [W * 0.38, -H * 0.45], [W / 2, 0], [W * 0.35, H * 0.45], [0, H * 0.5], [-W * 0.38, H * 0.42]]) : Sp([[-W / 2, -H * 0.2], [0, -H * 0.5], [W / 2, -H * 0.3], [W / 2, H * 0.4], [0, H * 0.6], [-W / 2, H * 0.3]]);
      const lip = round ? Sp([[-W / 2 - 0.15 * R, 0], [-W * 0.35, -H * 0.5 - 0.15 * R], [0, -H * 0.55 - 0.18 * R], [W * 0.38, -H * 0.45 - 0.15 * R], [W / 2 + 0.15 * R, 0], [W * 0.35, H * 0.45 + 0.12 * R], [0, H * 0.5 + 0.14 * R], [-W * 0.38, H * 0.42 + 0.12 * R]]) : null;
      if (lip) K.paint(c, lip, K.toneOf((st.ground && st.ground.dirt) || "#8a7a5a"), w);
      fl(p, kind === "swamp" ? (night ? "#3a4a3a" : "#5a6a4a") : water, { hatch: false, dx: 0, dy: 0.2 * R });
      clip(p, () => { ripples(-W / 2, W / 2, -H * 0.3, H * 0.4, Math.round(W / (1.4 * R)), kind === "swamp" ? "#8a9a6a" : null); if (kind === "swamp") for (let i = 0; i < 6; i++) K.paint(c, K.ell((rnd(i + 80) - 0.5) * W * 0.8, (rnd(i + 90) - 0.5) * H * 0.5, 0.3 * R, 0.1 * R), "#6a8a4a", w * 0.5); if (kind === "stream") for (let i = 0; i < 3; i++) K.paint(c, K.ell((rnd(i + 40) - 0.5) * W * 0.8, 0.1 * R, 0.22 * R, 0.12 * R), "#8e8a84", w * 0.6); });
      if (kind === "pond" || kind === "swamp") { [-W * 0.42, W * 0.4].forEach((x, i) => { for (let j = 0; j < 4; j++) reed(x + (j - 1.5) * 0.12 * R, -H * 0.2, (0.9 + rnd(j + i * 9) * 0.5) * R, 0.8); }); if (kind === "pond") [[-0.3, 0.05], [0.4, -0.1]].forEach(([x, y]) => K.paint(c, S([[x - 0.25, y], [x, y - 0.1], [x + 0.25, y], [x, y + 0.1]]), "#6a9a4a", w * 0.5)); }
      break;
    }
    case "lotus": { K.paint(c, S([[-0.9, 0.1], [-0.4, -0.12], [0.4, -0.12], [0.9, 0.1], [0, 0.28]]), "#5a8a4a", w * 0.7); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45; K.paint(c, S([[0, -0.05], [Math.cos(a - 0.2) * 0.35, -0.05 + Math.sin(a - 0.2) * 0.5], [Math.cos(a) * 0.5, -0.05 + Math.sin(a) * 0.75], [Math.cos(a + 0.2) * 0.35, -0.05 + Math.sin(a + 0.2) * 0.5]]), i === 2 ? "#f2c0c8" : "#e8a0b0", w * 0.6); } break; }
    case "sea": case "beach": {
      const W = K.num(o.width, 2600), H = K.num(o.height, 400);
      if (kind === "beach") { const p = new Path2D(); p.rect(-W / 2, 0, W, H); K.fill(c, p, o.color || (night ? "#a8987a" : "#dcc898"), w, { R, box: [-W / 2, 0, W / 2, H], hatch: false }); clip(p, () => { for (let i = 0; i < Math.round(W / 60); i++) { c.fillStyle = K.toneOf("#b8a478"); c.fill(K.ell(-W / 2 + rnd(i) * W, rnd(i + 70) * H, 2.5, 1.5)); } }); break; }
      const p = new Path2D(); p.rect(-W / 2, 0, W, H);
      K.fill(c, p, water, 0, { R: H / 6, dx: 0, dy: -H * 0.35, box: [-W / 2, 0, W / 2, H], hatch: false });
      lnp([[-W / 2, 0], [W / 2, 0]], 1);
      clip(p, () => { for (let row = 0; row < 7; row++) { const y = (row + 0.6) * H / 8; ripples(-W / 2, W / 2, y, y + 2, Math.round(W / 140), "#e8f0f2"); } });
      break;
    }
    case "waterfall": {
      [-1, 1].forEach((k) => fl(S([[k * 2.6, 0], [k * 2.55, -5.5], [k * 1.0, -5.65], [k * 0.95, -1.2]]), night ? "#5e5a56" : "#8e887e", { dx: k * 0.2 * R, dy: 0 }));
      const fall = S([[-1.0, -5.6], [1.0, -5.6], [1.05, -0.8], [-1.05, -0.8]]); fl(fall, night ? "#7a96a6" : "#a8cad6", { hatch: false });
      clip(fall, () => { for (let i = 0; i < 7; i++) { const x = -0.85 + i * 0.28, k = (t * 1.5 + i * 0.3) % 1; ln([[x, -5.6 + k * 2], [x, -3.5 + k * 2]], 0.6, "#f0f6f8"); } });
      const pool = S([[-2.2, -0.3], [0, -0.75], [2.2, -0.3], [1.6, 0.6], [-1.6, 0.6]]); fl(pool, water, { hatch: false }); clip(pool, () => ripples(-2 * R, 2 * R, -0.3 * R, 0.4 * R, 5));
      for (let i = 0; i < 5; i++) { const k = (t * 0.6 + i / 5) % 1; c.save(); c.globalAlpha *= 0.7 - k * 0.6; K.paint(c, E(-0.8 + i * 0.4, -0.7 - k * 0.5, 0.25 + k * 0.2, 0.18 + k * 0.15), "#f0f4f4", w * 0.4); c.restore(); }
      break;
    }
    case "island": { const p = S([[-2.1, 0], [-1.2, -0.55], [0.6, -0.65], [2.3, -0.05], [1.0, 0.18], [-1.2, 0.18]]); fl(p, night ? "#a8987a" : "#dcc898"); ln([[-2.3, 0.1], [2.5, 0.1]], 0.6, "#5a7a8a"); const tr = K.part && K.part("tree"); if (tr) { tr(c, { kind: "palm", x: -0.6 * R, y: -0.5 * R, r: R * 0.6, t, seed: 3 }, K); tr(c, { kind: "palm", x: 0.5 * R, y: -0.55 * R, r: R * 0.5, t, seed: 7 }, K); } break; }
    case "birds": { for (let i = 0; i < K.num(o.count, 5); i++) { const bx = (i - 2) * 0.9 * R + t * K.num(o.speed, 20) + rnd(i) * 0.5 * R, by = (rnd(i + 3) - 0.5) * 1.2 * R, f = Math.sin(t * 8 + i) * 0.22 * R; c.fillStyle = "#2a2a30"; c.beginPath(); c.moveTo(bx - 0.38 * R, by - f); c.quadraticCurveTo(bx - 0.15 * R, by - 0.12 * R, bx, by + 0.03 * R); c.quadraticCurveTo(bx + 0.15 * R, by - 0.12 * R, bx + 0.38 * R, by - f); c.quadraticCurveTo(bx + 0.15 * R, by - 0.02 * R, bx, by + 0.1 * R); c.quadraticCurveTo(bx - 0.15 * R, by - 0.02 * R, bx - 0.38 * R, by - f); c.fill(); } break; }
    default: c.restore(); return null;
  }
  c.restore();
  return true;
}`;
