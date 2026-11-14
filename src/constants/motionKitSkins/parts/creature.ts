// Small animals and eerie beings for the sketch and comic skins: crow, eagle, dove, chicken, duck, fish, snake,
// butterfly, bat, frog, shadow, spirit (a tall pale wraith in a torn robe), glowing eyes, ghost hand, spider.
// Same options as the core kit (x, y, r, facing, flying, progress, thread, every, alpha, seed).
export const SKIN_PART_CREATURE = `(c, o, K) => {
  const kind = o.kind;
  const st = K.S(), R = K.num(o.r, 20), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R) * 0.8, ol = st.ol, seed = K.num(o.seed, 1);
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const E = (x, y, a, b, r) => K.ell(x * R, y * R, a * R, b * R, r);
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.6), col || ol);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-3 * R, -6 * R, 3 * R, 1 * R] }, k || {}));
  const eye = (x, y, s) => { c.fillStyle = ol; c.fill(E(x, y, s || 0.06, s || 0.06)); };
  const flap = Math.sin(t * 10 + seed);
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null && kind !== "spirit" && kind !== "shadow" && kind !== "ghostHand") c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  switch (kind) {
    case "crow": case "eagle": case "dove": {
      const col = o.color || (kind === "crow" ? "#2a2a30" : kind === "eagle" ? "#6a4a30" : "#ecebe6"), wing = K.shade(col, kind === "dove" ? 0.9 : 0.8), span = kind === "eagle" ? 2.4 : 1.7;
      const wingP = (k) => S([[-0.1, -0.15], [-0.25, -0.2 - flap * 0.6 * k], [-0.15 - span * 0.35, -0.35 - flap * span * 0.55 * k], [-0.3 - span * 0.6, -0.15 - flap * span * 0.45 * k], [-0.45, 0.05]]);
      if (o.flying !== false) { c.save(); c.translate(0.15 * R, 0); fl(wingP(1), K.shade(wing, 0.85), { hatch: false }); c.restore(); }
      fl(S([[-0.6, -0.05], [-1.15, -0.25], [-1.2, 0], [-1.1, 0.2]]), wing, { hatch: false });
      fl(S([[-0.75, 0], [-0.3, -0.3], [0.45, -0.3], [0.75, -0.05], [0.4, 0.25], [-0.4, 0.2]]), col);
      fl(E(0.68, -0.28, 0.26, 0.24), kind === "eagle" ? "#f2f0ea" : col, { hatch: false });
      K.paint(c, S([[0.9, -0.33], [1.18, -0.24], [0.9, -0.18]]), kind === "dove" ? "#d88a6a" : "#e0b84a", w * 0.6); eye(0.74, -0.33, 0.045);
      if (o.flying !== false) fl(wingP(-0.6), wing, { hatch: false }); else { ln([[0.0, 0.2], [-0.05, 0.45]], 0.6); ln([[0.2, 0.2], [0.18, 0.45]], 0.6); }
      break;
    }
    case "chicken": case "duck": {
      const duck = kind === "duck", col = o.color || (duck ? "#8a7a5a" : "#f2ece0");
      if (duck) { c.fillStyle = "rgba(90,122,138,0.5)"; c.fill(E(0, 0, 0.9, 0.12)); } else { ln([[-0.05, -0.35], [-0.1, 0]], 0.7, "#c8863a"); ln([[0.2, -0.35], [0.2, 0]], 0.7, "#c8863a"); }
      const by = duck ? -0.05 : -0.35;
      fl(S([[-0.75, by - 0.35], [-0.5, by - 0.7], [0.3, by - 0.65], [0.6, by - 0.3], [0.3, by], [-0.5, by]]), col);
      fl(S([[0.35, by - 0.6], [0.5, by - 1.05], [0.8, by - 1.1], [0.9, by - 0.85], [0.7, by - 0.55]]), duck ? "#3a6a4a" : col, { hatch: false });
      K.paint(c, S([[0.88, by - 0.95], [1.1, by - 0.88], [0.88, by - 0.8]]), "#e0a83a", w * 0.5);
      if (!duck) K.paint(c, S([[0.55, by - 1.1], [0.62, by - 1.25], [0.72, by - 1.15], [0.82, by - 1.22], [0.8, by - 1.05]]), "#c84a3a", w * 0.5);
      eye(0.72, by - 0.92, 0.045); ln([[-0.4, by - 0.45], [0.1, by - 0.5]], 0.5);
      break;
    }
    case "fish": { const sw = Math.sin(t * 6 + seed) * 0.15; fl(S([[-0.7, 0], [-0.2, -0.35], [0.5, -0.3], [0.8, 0], [0.5, 0.3], [-0.2, 0.35]]), o.color || "#7a9aaa"); fl(S([[-0.65, 0], [-1.2, -0.4 + sw], [-1.05, 0], [-1.2, 0.4 + sw]]), K.shade(o.color || "#7a9aaa", 0.85), { hatch: false }); eye(0.5, -0.08, 0.05); ln([[0.25, -0.25], [0.3, 0.25]], 0.5); break; }
    case "snake": { const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push([-1.7 + k * 3.6, Math.sin(k * 9 + t * 3) * 0.18 * (1 - k * 0.4)]); } const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.24 * R + w * 2, ol); K.line(c, q, 0.24 * R, K.toneOf(o.color || "#6a7a3a")); const h = pts[pts.length - 1]; fl(E(h[0] + 0.15, h[1], 0.25, 0.17), o.color || "#6a7a3a", { hatch: false }); eye(h[0] + 0.22, h[1] - 0.06, 0.04); ln([[h[0] + 0.38, h[1]], [h[0] + 0.55, h[1] + 0.05]], 0.5, "#c84a3a"); break; }
    case "butterfly": { const fp = Math.abs(Math.sin(t * 12 + seed)); const col = o.color || "#e0a83a"; [-1, 1].forEach((k) => { c.save(); c.scale(1, 1); fl(S([[0, -0.05], [k * 0.6 * (0.4 + fp * 0.6), -0.5], [k * 0.65 * (0.4 + fp * 0.6), -0.1], [0, 0.0]]), col, { hatch: false }); fl(S([[0, 0], [k * 0.45 * (0.4 + fp * 0.6), 0.1], [k * 0.3 * (0.4 + fp * 0.6), 0.3], [0, 0.1]]), K.shade(col, 0.85), { hatch: false }); c.restore(); }); ln([[0, -0.25], [0, 0.2]], 1.2); ln([[0, -0.25], [0.12, -0.45]], 0.4); ln([[0, -0.25], [-0.12, -0.45]], 0.4); break; }
    case "bat": { const u = flap * 0.4; fl(S([[0, -0.1], [-0.5, -0.4 - u], [-1.2, -0.45 - u], [-0.95, -0.2], [-0.75, 0.05], [-0.45, -0.05], [-0.2, 0.15], [0.2, 0.15], [0.45, -0.05], [0.75, 0.05], [0.95, -0.2], [1.2, -0.45 - u], [0.5, -0.4 - u]]), o.color || "#2a2a30", { hatch: false }); fl(E(0, -0.05, 0.22, 0.25), o.color || "#2a2a30", { hatch: false }); K.paint(c, S([[-0.15, -0.25], [-0.12, -0.45], [-0.02, -0.28]]), "#2a2a30", w * 0.4); K.paint(c, S([[0.15, -0.25], [0.12, -0.45], [0.02, -0.28]]), "#2a2a30", w * 0.4); c.fillStyle = "#e8d84a"; [-0.07, 0.07].forEach((x) => c.fill(E(x, -0.08, 0.03, 0.03))); break; }
    case "frog": { const hop = Math.max(0, Math.sin(t * 2 + seed)) * 0.2; c.translate(0, -hop * R); fl(S([[-0.55, 0], [-0.5, -0.4], [-0.1, -0.6], [0.4, -0.55], [0.6, -0.2], [0.5, 0]]), o.color || "#6a8a3a"); [0.15, 0.4].forEach((x) => { fl(E(x, -0.6, 0.12, 0.12), o.color || "#6a8a3a", { hatch: false }); eye(x + 0.02, -0.62, 0.05); }); ln([[0.2, -0.3], [0.55, -0.28]], 0.5); fl(S([[-0.55, 0], [-0.65, -0.25], [-0.3, -0.1], [-0.2, 0]]), K.shade(o.color || "#6a8a3a", 0.85), { hatch: false }); break; }
    case "shadow": { c.globalAlpha *= K.num(o.alpha, 0.75); const sw = Math.sin(t * 1.2) * 0.05; c.fillStyle = "#121014"; c.fill(S([[-0.8, 0], [-0.7, -2.2], [-0.5 + sw, -3.2], [0, -3.6], [0.5 + sw, -3.2], [0.7, -2.2], [0.8, 0], [0.3, 0.1], [-0.3, 0.1]])); c.fillStyle = "#c8c8c0"; [-0.18, 0.18].forEach((x) => c.fill(E(x, -3.0, 0.06, 0.03))); break; }
    case "spirit": {
      c.globalAlpha *= K.num(o.alpha, 0.85);
      const fl2 = Math.sin(t * 1.6 + seed) * 0.12, bob = Math.sin(t * 1.1) * 0.12; c.translate(0, -bob * R);
      const g = c.createRadialGradient(0, -3 * R, R * 0.5, 0, -3 * R, R * 3.5); g.addColorStop(0, "rgba(220,230,235,0.25)"); g.addColorStop(1, "rgba(220,230,235,0)"); c.fillStyle = g; c.fillRect(-3.5 * R, -6.5 * R, 7 * R, 7 * R);
      const robe = S([[-0.5, -4.2], [-0.95, -2.8], [-1.05, -1.0], [-0.9 + fl2, -0.2], [-0.6 + fl2, -0.6], [-0.4 + fl2, 0], [-0.15 + fl2, -0.5], [0.15 + fl2, 0.05], [0.4 + fl2, -0.45], [0.65 + fl2, -0.05], [0.95 + fl2, -0.5], [1.05, -1.0], [0.95, -2.8], [0.5, -4.2]]);
      fl(robe, "#d8dcda", { hatch: false, dark: 0.8 });
      [-1, 1].forEach((k) => { const q = [[k * 0.7, -3.6], [k * 1.15, -2.6 + Math.sin(t * 2 + k) * 0.2], [k * 1.1, -1.9]].map(([x, y]) => [x * R, y * R]); K.line(c, q, 0.28 * R + w * 2, ol); K.line(c, q, 0.28 * R, "#d8dcda"); });
      fl(S([[-0.5, -4.1], [-0.55, -4.8], [-0.2, -5.25], [0.2, -5.25], [0.55, -4.8], [0.5, -4.1], [0, -3.95]]), "#c8ccca", { hatch: false });
      fl(S([[-0.32, -4.25], [-0.36, -4.75], [0, -5.0], [0.36, -4.75], [0.32, -4.25], [0, -4.1]]), "#2a2c30", { hatch: false });
      c.fillStyle = "#e8eef0"; [-0.13, 0.13].forEach((x) => c.fill(E(x, -4.6, 0.06, 0.08)));
      break;
    }
    case "eyes": { const open = (t % K.num(o.every, 3.5)) > 0.15; const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 1.4); g.addColorStop(0, "rgba(" + (o.rgb || "230,60,40") + ",0.25)"); g.addColorStop(1, "rgba(" + (o.rgb || "230,60,40") + ",0)"); c.fillStyle = g; c.fillRect(-1.4 * R, -1.4 * R, 2.8 * R, 2.8 * R); if (open) [-0.4, 0.4].forEach((x) => { K.paint(c, E(x, 0, 0.2, 0.11, x * 0.3), o.color || "#f2d24a", w * 0.5); c.fillStyle = ol; c.fill(E(x, 0, 0.04, 0.09)); }); break; }
    case "ghostHand": { const rise = K.clamp(K.num(o.progress, 1), 0, 1); c.globalAlpha *= K.num(o.alpha, 0.85); fl(S([[-0.3, 0], [-0.32, -1.6 * rise], [-0.45, -2.0 * rise], [-0.42, -2.3 * rise], [-0.3, -2.0 * rise], [-0.22, -2.4 * rise], [-0.1, -2.05 * rise], [0, -2.45 * rise], [0.1, -2.05 * rise], [0.2, -2.38 * rise], [0.3, -1.95 * rise], [0.3, -1.6 * rise], [0.3, 0]]), "#d8dcd6", { hatch: false }); ln([[-0.15, -0.5 * rise], [-0.1, -1.4 * rise]], 0.4); break; }
    case "spider": { ln([[0, -K.num(o.thread, 3)], [0, -0.3]], 0.4, "rgba(240,240,240,0.8)"); for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => ln([[0, 0], [s * 0.6, -0.4 + i * 0.25], [s * 0.9, i * 0.25]], 0.9)); fl(E(0, 0.05, 0.35, 0.3), "#2a2420", { hatch: false }); fl(E(0, -0.28, 0.18, 0.15), "#2a2420", { hatch: false }); c.fillStyle = "#c84a3a"; [-0.07, 0.07].forEach((x) => c.fill(E(x, -0.3, 0.03, 0.03))); break; }
    default: c.restore(); return null;
  }
  c.restore();
  return true;
}`;
