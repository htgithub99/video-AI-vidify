// Effects for the sketch and comic skins, drawn like the reference videos: outlined puffy smoke clouds,
// a dirt-and-smoke shell burst with flying clods (video 2 "beyond the next hedge"), flat flame tongues for fires,
// dust clouds. Kinds: explosion, impact, smoke, darkSmoke, whiteSmoke, smokeColumn, dust, dustTrail, fire, bonfire, burning, debris.
// Every other effect (tints, rays, glow, magic…) returns null and uses the core drawer with the skin style layer.
export const SKIN_PART_EFFECT = `(c, o, K) => {
  const kind = o.kind;
  const LIST = ["explosion", "impact", "smoke", "darkSmoke", "whiteSmoke", "smokeColumn", "dust", "dustTrail", "fire", "bonfire", "burning", "debris"];
  if (LIST.indexOf(kind) < 0) return null;
  const st = K.S(), R = K.num(o.r, 40), t = K.num(o.t, K.num(window.__motionKitTime, 0)), x = K.num(o.x, 0), y = K.num(o.y, 0), w = K.LW(R) * 0.8, ol = st.ol;
  const seed = K.num(o.seed, 1), rnd = (i) => K.rnd(seed, i), night = K.NIGHT();
  const puff = (cx, cy, r, col, a) => { if (r <= 0.5) return; c.save(); c.globalAlpha *= K.clamp(a == null ? 1 : a, 0, 1); const list = []; const n = 6; list.push(K.ell(cx, cy, r * 0.8, r * 0.72)); for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + rnd(i + Math.round(cx)) * 0.6, rr = r * (0.42 + rnd(i + 7) * 0.18); list.push(K.ell(cx + Math.cos(an) * r * 0.62, cy + Math.sin(an) * r * 0.5, rr, rr)); } K.union(c, list, col, w, { R: r, dx: r * 0.12, dy: -r * 0.18, dark: 0.82, box: [cx - 2 * r, cy - 2 * r, cx + 2 * r, cy + 2 * r] }); c.restore(); };
  const smokeCol = kind === "darkSmoke" ? "#4a4a4e" : kind === "whiteSmoke" ? "#e6e6e2" : night ? "#7a7a80" : "#a8a8a8";
  const flame = (cx, by, h, wd, ph) => { const sw = Math.sin(t * 9 + ph) * wd * 0.25; const outer = K.smooth([[cx - wd, by], [cx - wd * 0.85, by - h * 0.45], [cx - wd * 0.3 + sw, by - h * 0.7], [cx + sw * 1.4, by - h], [cx + wd * 0.35 + sw, by - h * 0.62], [cx + wd * 0.9, by - h * 0.4], [cx + wd, by]], true); K.paint(c, outer, "#e2672b", w); const inner = K.smooth([[cx - wd * 0.55, by], [cx - wd * 0.4, by - h * 0.35], [cx + sw, by - h * 0.62], [cx + wd * 0.42, by - h * 0.32], [cx + wd * 0.55, by]], true); c.fillStyle = "#f5b13a"; c.fill(inner); c.fillStyle = "#fff0b0"; c.fill(K.ell(cx + sw * 0.4, by - h * 0.18, wd * 0.25, h * 0.14)); };
  c.save();
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  switch (kind) {
    case "explosion": case "impact": {
      const k = o.progress == null ? (t % 1.6) / 1.6 : K.clamp(o.progress, 0, 1), big = kind === "explosion";
      const s = R * (big ? 1 : 0.6);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.35, d = s * (0.6 + k * 2.6) * (0.8 + rnd(i) * 0.4); puff(x + Math.cos(a) * d * 0.5, y - s * 0.3 + Math.sin(a) * d, s * (0.45 + k * 0.6) * (0.8 + rnd(i + 3) * 0.3), smokeCol, 1 - k * 0.6); }
      const cone = K.smooth([[x - s * 0.9, y], [x - s * 0.6, y - s * (0.6 + k * 0.9)], [x - s * 0.15, y - s * (1.2 + k * 1.2)], [x + s * 0.25, y - s * (1.0 + k * 1.3)], [x + s * 0.7, y - s * (0.55 + k * 0.8)], [x + s * 0.95, y]], true);
      K.fill(c, cone, "#5a3e2a", w, { R: s, box: [x - 2 * s, y - 3 * s, x + 2 * s, y] });
      if (k < 0.25) { c.save(); c.globalAlpha *= 1 - k * 4; K.paint(c, K.ell(x, y - s * 0.4, s * 0.55, s * 0.4), "#f5b13a", w); c.fillStyle = "#fff0b0"; c.fill(K.ell(x, y - s * 0.4, s * 0.25, s * 0.18)); c.restore(); }
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (rnd(i + 20) - 0.5) * 2.4, sp = s * (1 + rnd(i + 30) * 2.5); const px = x + Math.cos(a) * sp * k * 1.3, py = y - s * 0.5 + Math.sin(a) * sp * k + s * 3.2 * k * k; const rr = s * (0.05 + rnd(i + 40) * 0.07); K.paint(c, K.smooth([[px - rr, py], [px, py - rr], [px + rr * 1.2, py - rr * 0.2], [px + rr * 0.3, py + rr]], true), "#3a2a1e", w * 0.5); }
      break;
    }
    case "smoke": case "darkSmoke": case "whiteSmoke": case "smokeColumn": {
      const n = kind === "smokeColumn" ? 7 : 5, rise = kind === "smokeColumn" ? 5 : 2.6;
      for (let i = 0; i < n; i++) { const k = ((t * 0.35 + i / n) % 1); puff(x + Math.sin(k * 3 + i) * R * 0.3 + k * R * 0.6, y - k * R * rise, R * (0.3 + k * 0.6), smokeCol, 1 - k * 0.85); }
      break;
    }
    case "dust": case "dustTrail": {
      const col = night ? "#8a7e6a" : "#c8b48a";
      for (let i = 0; i < 5; i++) { const k = ((t * 0.6 + i / 5) % 1); puff(x - (kind === "dustTrail" ? k * R * 2.5 : (i - 2) * R * 0.5), y - R * 0.2 - k * R * 0.5, R * (0.25 + k * 0.35), col, 0.9 - k * 0.8); }
      break;
    }
    case "fire": case "bonfire": case "burning": {
      const n = kind === "bonfire" ? 5 : kind === "burning" ? 4 : 3, wd = R * (kind === "bonfire" ? 0.42 : 0.35);
      { const g = c.createRadialGradient(x, y - R * 0.6, R * 0.1, x, y - R * 0.6, R * 3.2); g.addColorStop(0, "rgba(255,190,90," + (night ? 0.45 : 0.25) + ")"); g.addColorStop(1, "rgba(255,190,90,0)"); c.fillStyle = g; c.fillRect(x - R * 3.2, y - R * 3.8, R * 6.4, R * 6.4); }
      if (kind !== "burning") { [-1, 1].forEach((k) => K.line(c, [[x - k * R * 0.7, y + R * 0.02], [x + k * R * 0.7, y - R * 0.12]], R * 0.14 + w * 2, ol)); [-1, 1].forEach((k) => K.line(c, [[x - k * R * 0.7, y + R * 0.02], [x + k * R * 0.7, y - R * 0.12]], R * 0.14, "#6a4a30")); }
      for (let i = 0; i < n; i++) flame(x + (i - (n - 1) / 2) * wd * 0.9, y - R * 0.05, R * (0.9 + Math.sin(t * 6 + i * 2) * 0.12 + (i === Math.floor(n / 2) ? 0.5 : 0)), wd, i * 1.7);
      if (kind === "bonfire" || (kind === "burning" && o.smoke !== false)) for (let i = 0; i < 3; i++) { const k = ((t * 0.3 + i / 3) % 1); puff(x + k * R * 0.5, y - R * (1.6 + k * 2), R * (0.25 + k * 0.4), "#7a7a80", 0.8 - k * 0.7); }
      for (let i = 0; i < 4; i++) { const k = ((t * 0.8 + i / 4) % 1); c.fillStyle = "#f5b13a"; c.fill(K.ell(x + Math.sin(i * 3 + t * 2) * R * 0.5, y - R * (1 + k * 1.8), R * 0.04, R * 0.04)); }
      break;
    }
    case "debris": {
      for (let i = 0; i < 12; i++) { const px = x + (rnd(i) - 0.5) * R * 3, py = y - rnd(i + 9) * R * 0.3, rr = R * (0.08 + rnd(i + 18) * 0.14); K.paint(c, K.smooth([[px - rr, py], [px - rr * 0.6, py - rr * 0.8], [px + rr * 0.7, py - rr * 0.6], [px + rr, py]], true), i % 3 ? "#7a6a5a" : "#5a4a3a", w * 0.6); }
      break;
    }
  }
  c.restore();
  return true;
}`;
