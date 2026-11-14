// Buildings for the sketch and comic skins: all 20 kit kinds rebuilt from flat walls, roofs and openings,
// with material textures in the reference style (rounded stone blocks like the video 1 camp wall, plank boards,
// thatch strokes, roof tiles). Footprints follow the core kit in units of R (ground y = 0) so scenes keep their scale.
// Also serves the wall, gate and palisade props (prop:wall / prop:gate / prop:palisade).
export const SKIN_PART_BUILDING = `(c, o0, K) => {
  const o = Object.assign({ kind: "house", x: 0, y: 0, r: 40 }, o0 || {});
  const kind = o.kind, R = o.r, st = K.S(), ink = !!st.hatch, w = K.LW(R), ol = st.ol, t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const night = K.NIGHT(), lit = o.lit != null ? !!o.lit : night;
  const rnd = (i) => K.rnd(K.num(o.seed, 7), i);
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const rect = (x0, y0, x1, y1) => P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const box = (x0, y0, x1, y1) => [x0 * R, y0 * R, x1 * R, y1 * R];
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const stone0 = o.color || (night ? "#8e8a84" : "#b7ad9c"), plaster = o.wallColor || (night ? "#a8a090" : "#e4dac4");
  const wood = night ? "#5e4a3a" : "#8a6444", thatch = night ? "#8c7a50" : "#c9a45a", tile = o.roofColor || (night ? "#6e3e34" : "#a24a38");
  const fillT = (p, col, b, k) => K.fill(c, p, col, w, Object.assign({ R, box: b }, k || {}));
  const clip = (p, fn) => { c.save(); c.clip(p); fn(); c.restore(); };
  const stones = (x0, y0, x1, y1, col, sz) => {
    const p = rect(x0, y0, x1, y1);
    fillT(p, col, box(x0, y0, x1, y1));
    clip(p, () => {
      const h = sz || 0.32, bw = h * 1.9;
      for (let r = 0, y = y1; y > y0 - h; r++, y -= h) for (let x = x0 - (r % 2 ? bw / 2 : 0), i = 0; x < x1; x += bw, i++) {
        const q = K.smooth([[x + 0.03, y - 0.03], [x + bw - 0.03, y - 0.03], [x + bw - 0.03, y - h + 0.03], [x + 0.03, y - h + 0.03]].map(([a, b]) => [a * R, b * R]), true);
        c.fillStyle = K.toneOf(K.shade(col, 0.92 + rnd(r * 13 + i) * 0.14)); c.fill(q);
        c.lineWidth = w * 0.5; c.strokeStyle = ol; c.stroke(q);
      }
    });
    c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
    return p;
  };
  const planks = (x0, y0, x1, y1, col, vert) => {
    const p = rect(x0, y0, x1, y1);
    fillT(p, col, box(x0, y0, x1, y1));
    clip(p, () => { const n = vert ? Math.round((x1 - x0) / 0.32) : Math.round((y1 - y0) / 0.28); for (let i = 1; i < n; i++) { if (vert) { const x = x0 + (x1 - x0) * i / n; ln([[x, y0], [x, y1]], 0.5); } else { const y = y0 + (y1 - y0) * i / n; ln([[x0, y], [x1, y]], 0.5); } } for (let i = 0; i < 4; i++) { const x = x0 + rnd(i + 30) * (x1 - x0), y = y0 + rnd(i + 40) * (y1 - y0); c.fillStyle = ol; c.fill(K.ell(x * R, y * R, 0.03 * R, 0.03 * R)); } });
    c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
    return p;
  };
  const plasterWall = (x0, y0, x1, y1, col) => {
    const p = rect(x0, y0, x1, y1);
    fillT(p, col || plaster, box(x0, y0, x1, y1));
    clip(p, () => { for (let i = 0; i < 2; i++) { const x = x0 + 0.25 + rnd(i + 50) * (x1 - x0 - 0.5), y = y0 + 0.35 + rnd(i + 60) * (y1 - y0 - 0.7); [[0, 0], [0.22, 0], [0.11, 0.13]].forEach(([dx, dy]) => { const b = rect(x + dx - 0.1, y + dy - 0.06, x + dx + 0.1, y + dy + 0.06); c.fillStyle = K.toneOf(K.shade(stone0, 0.95)); c.fill(b); c.lineWidth = w * 0.4; c.strokeStyle = ol; c.stroke(b); }); ln([[x - 0.2, y - 0.25], [x - 0.05, y - 0.12], [x - 0.12, y + 0.02]], 0.4); } });
    c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
    return p;
  };
  const gable = (x0, x1, y, h, col, mat) => {
    const p = P([[x0 - 0.15, y], [(x0 + x1) / 2, y - h], [x1 + 0.15, y]]);
    fillT(p, col, box(x0, y - h, x1, y), { dx: 0.2 * R, dy: 0 });
    clip(p, () => { if (mat === "thatch") for (let i = 0; i < 30; i++) { const x = x0 + rnd(i) * (x1 - x0), yy = y - rnd(i + 99) * h * 0.9; ln([[x, yy], [x + 0.06, yy + 0.25]], 0.45); } else for (let k = 1; k < 5; k++) { const yy = y - h * k / 5; ln([[x0 - 0.2, yy], [x1 + 0.2, yy]], 0.45); for (let j = 0; j < 8; j++) { const x = x0 + (j + (k % 2) * 0.5) * (x1 - x0) / 8; ln([[x, yy], [x, yy + h / 5]], 0.4); } } });
    c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
    return p;
  };
  const hipRoof = (x0, x1, y, h, col, mat) => {
    const p = S([[x0 - 0.25, y + 0.05], [x0 - 0.25, y + 0.05], [x0 + 0.35, y - h], [x0 + 0.35, y - h], [x1 - 0.35, y - h], [x1 - 0.35, y - h], [x1 + 0.25, y + 0.05], [x1 + 0.25, y + 0.05]]);
    fillT(p, col, box(x0, y - h, x1, y), { dx: 0.2 * R, dy: 0 });
    clip(p, () => { if (mat === "thatch") { for (let i = 0; i < 40; i++) { const x = x0 + rnd(i) * (x1 - x0), yy = y - rnd(i + 99) * h; ln([[x, yy], [x + 0.05, yy + 0.22]], 0.45); } ln([[x0 - 0.25, y - 0.12], [x1 + 0.25, y - 0.12]], 0.6); } else for (let k = 1; k < 4; k++) ln([[x0 - 0.3, y - h * k / 4], [x1 + 0.3, y - h * k / 4]], 0.45); });
    c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
    return p;
  };
  const door = (x, w0, h, arch, col) => { const p = arch ? S([[x - w0 / 2, 0], [x - w0 / 2, -h + w0 / 2], [x - w0 / 2, -h + w0 / 2], [x, -h], [x + w0 / 2, -h + w0 / 2], [x + w0 / 2, -h + w0 / 2], [x + w0 / 2, 0], [x + w0 / 2, 0]]) : rect(x - w0 / 2, -h, x + w0 / 2, 0); fillT(p, col || K.shade(wood, 0.8), box(x - w0, -h, x + w0, 0), { hatch: false }); clip(p, () => { for (let i = 1; i < 3; i++) ln([[x - w0 / 2 + w0 * i / 3, -h], [x - w0 / 2 + w0 * i / 3, 0]], 0.45); }); K.paint(c, K.ell((x + w0 * 0.3) * R, -h * 0.45 * R, 0.035 * R, 0.035 * R), "#3a302c", 0); };
  const win = (x, y, wd, h, arch) => { const p = arch ? S([[x - wd / 2, y + h / 2], [x - wd / 2, y - h / 2 + wd / 2], [x, y - h / 2], [x + wd / 2, y - h / 2 + wd / 2], [x + wd / 2, y + h / 2]]) : rect(x - wd / 2, y - h / 2, x + wd / 2, y + h / 2); K.paint(c, p, lit ? "#f2c66a" : "#3c4048", w * 0.9); if (!arch) { ln([[x, y - h / 2], [x, y + h / 2]], 0.45); ln([[x - wd / 2, y], [x + wd / 2, y]], 0.45); } ln([[x - wd / 2 - 0.05, y + h / 2 + 0.03], [x + wd / 2 + 0.05, y + h / 2 + 0.03]], 0.9); };
  const merlons = (x0, x1, y, n, col) => { const bw = (x1 - x0) / (n * 2 - 1); for (let i = 0; i < n; i++) stones(x0 + i * 2 * bw, y - 0.35, x0 + i * 2 * bw + bw, y, col, 0.35); };
  const tower = (x0, x1, y0, col, cap) => { stones(x0, y0, x1, 0, col); if (cap === "cone") gable(x0 - 0.05, x1 + 0.05, y0, (x1 - x0) * 0.95, tile, "tile"); else merlons(x0 - 0.05, x1 + 0.05, y0, 3, col); };
  c.save();
  c.translate(o.x, o.y);
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  c.fillStyle = "rgba(20,16,12,0.2)";
  c.fill(K.ell(0, 0.02 * R, 2.2 * R, 0.14 * R));
  switch (kind) {
    case "house": stones(-1.45, -1.75, 1.45, 0, stone0, 0.3); gable(-1.5, 1.5, -1.75, 1.2, tile, "tile"); door(-0.55, 0.55, 1.05); win(0.65, -0.95, 0.55, 0.6); win(0.65 - 0, -2.25, 0.32, 0.3, true); break;
    case "cottage": plasterWall(-1.3, -1.6, 1.3, 0); hipRoof(-1.35, 1.35, -1.55, 1.2, thatch, "thatch"); door(0, 0.55, 1.05); win(-0.75, -0.9, 0.45, 0.5); win(0.75, -0.9, 0.45, 0.5); break;
    case "hut": planks(-1.2, -1.3, 1.2, 0, wood, true); hipRoof(-1.45, 1.45, -1.25, 1.2, thatch, "thatch"); door(0.1, 0.55, 0.95, false, K.shade(wood, 0.6)); break;
    case "barn": planks(-1.75, -1.9, 1.75, 0, o.color || (night ? "#6a3a32" : "#9a4a3a"), true); gable(-1.8, 1.8, -1.9, 1.15, K.shade(wood, 0.8), "tile"); { const d = rect(-0.7, -1.4, 0.7, 0); fillT(d, K.shade(wood, 0.85), box(-0.7, -1.4, 0.7, 0), { hatch: false }); ln([[-0.7, -1.4], [0.7, 0]], 0.7); ln([[0.7, -1.4], [-0.7, 0]], 0.7); ln([[0, -1.4], [0, 0]], 0.6); } win(0, -2.3, 0.45, 0.4); break;
    case "longhouse": planks(-2.4, -1.05, 2.4, 0, wood, true); hipRoof(-2.6, 2.6, -1.0, 1.35, thatch, "thatch"); door(0, 0.6, 0.9); break;
    case "stiltHouse": [-1.7, -0.9, -0.1, 0.7, 1.5].forEach((x) => planks(x - 0.08, -1.3, x + 0.08, 0, K.shade(wood, 0.8), true)); planks(-1.9, -1.4, 1.9, -1.2, K.shade(wood, 0.9)); planks(-1.6, -2.4, 1.6, -1.4, wood, true); hipRoof(-1.9, 1.9, -2.35, 1.05, thatch, "thatch"); door(0.3, 0.45, 0.8); c.save(); c.translate(0, -1.4 * R); door(0.3, 0.45, 0.8); c.restore(); ln([[1.9, -1.35], [2.35, 0]], 0.9); ln([[2.0, -0.95], [2.22, -0.95]], 0.6); ln([[2.1, -0.5], [2.3, -0.5]], 0.6); break;
    case "castle": tower(-2.2, -1.25, -4.1, stone0, "merlon"); tower(1.25, 2.2, -4.1, stone0, "merlon"); stones(-1.25, -3.2, 1.25, 0, K.shade(stone0, 0.95)); merlons(-1.25, 1.25, -3.2, 5, stone0); door(0, 0.9, 1.4, true, "#4a3a30"); win(-1.72, -2.6, 0.22, 0.5, true); win(1.72, -2.6, 0.22, 0.5, true); if (o.flag !== false) { ln([[-1.72, -4.45], [-1.72, -5.1]], 0.9); K.paint(c, P([[-1.72, -5.1], [-1.2, -4.95], [-1.72, -4.8]]), o.flagColor || "#9a2e28", w * 0.8); } break;
    case "tower": tower(-0.8, 0.8, -4.9, stone0, "merlon"); win(0, -3.6, 0.28, 0.55, true); win(0, -2.2, 0.28, 0.55, true); door(0, 0.55, 0.9, true); break;
    case "lighthouse": { const p = P([[-0.75, 0], [-0.45, -4.4], [0.45, -4.4], [0.75, 0]]); fillT(p, "#ece6da", box(-0.8, -4.4, 0.8, 0)); clip(p, () => { [1, 3].forEach((k) => { c.fillStyle = K.toneOf("#a8382e"); c.fillRect(-R, -(k * 1.1 + 0.55) * R, 2 * R, 0.55 * R); }); }); c.lineWidth = w; c.strokeStyle = ol; c.stroke(p); K.paint(c, rect(-0.42, -4.95, 0.42, -4.4), "#f2d06a", w); gable(-0.5, 0.5, -4.95, 0.35, "#3a3a40", "tile"); door(0, 0.4, 0.75, true); if (lit || o.beam) { c.save(); c.globalAlpha *= 0.35; c.fillStyle = "#fff2b0"; c.fill(P([[0.42, -4.7], [5.9, -5.2], [5.9, -4.2]])); c.restore(); } break; }
    case "church": plasterWall(-1.9, -2.2, 0.6, 0); gable(-1.95, 0.65, -2.2, 1.0, tile, "tile"); stones(0.6, -3.8, 1.95, 0, stone0); gable(0.55, 2.0, -3.8, 1.6, tile, "tile"); ln([[1.27, -5.4], [1.27, -5.0]], 0.9); ln([[1.12, -5.25], [1.42, -5.25]], 0.9); door(1.27, 0.6, 1.1, true); win(-0.65, -1.2, 0.35, 0.75, true); win(1.27, -2.8, 0.3, 0.5, true); break;
    case "temple": { stones(-2.75, -0.45, 2.75, 0, stone0, 0.22); for (let i = 0; i < 6; i++) { const x = -2.3 + i * 0.92; const p = rect(x - 0.17, -2.85, x + 0.17, -0.45); fillT(p, "#ece6da", box(x - 0.2, -2.85, x + 0.2, -0.45), { hatch: false }); clip(p, () => { ln([[x - 0.06, -2.85], [x - 0.06, -0.45]], 0.45); ln([[x + 0.06, -2.85], [x + 0.06, -0.45]], 0.45); }); } K.paint(c, rect(-2.65, -3.15, 2.65, -2.85), "#e2dac8", w); K.fill(c, P([[-2.75, -3.15], [0, -3.77], [2.75, -3.15]]), "#e8e0cc", w, { R, box: box(-2.75, -3.8, 2.75, -3.1) }); break; }
    case "pagoda": { const lv = [[-1.2, -1.3, -0], [-0.95, -2.5, -1.3], [-0.7, -3.6, -2.5]]; lv.forEach(([x, top, bot], i) => { plasterWall(x, top, -x, bot, "#a83a2e"); const p = S([[x - 0.6, top + 0.12], [x - 0.6, top + 0.12], [x - 0.1, top - 0.32], [x - 0.1, top - 0.32], [-x + 0.1, top - 0.32], [-x + 0.1, top - 0.32], [-x + 0.6, top + 0.12], [-x + 0.6, top + 0.12]]); fillT(p, "#3a3a40", box(x - 0.6, top - 0.4, -x + 0.6, top + 0.2)); if (i === 0) door(0, 0.5, 0.9, true); }); ln([[0, -3.9], [0, -4.42]], 0.9); break; }
    case "factory": { stones(-2.3, -2.0, 1.5, 0, o.color || "#9a5a44", 0.22); [-2.3, -1.3, -0.3, 0.7].forEach((x) => fillT(P([[x, -2.0], [x + 0.5, -2.6], [x + 1.0, -2.0]]), "#6a3e34", box(x, -2.6, x + 1, -2), { hatch: false })); stones(1.5, -6.2, 2.15, 0, "#8a4a3a", 0.22); for (let i = 0; i < 3; i++) win(-1.8 + i * 1.0, -1.0, 0.55, 0.6); for (let i = 0; i < 3; i++) { const k = ((t * 0.4 + i / 3) % 1); c.save(); c.globalAlpha *= 0.85 - k * 0.6; K.paint(c, K.ell((1.85 + k * 0.6) * R, (-6.4 - k * 1.2) * R, (0.25 + k * 0.35) * R, (0.22 + k * 0.3) * R), "#8a8a8e", w * 0.6); c.restore(); } break; }
    case "skyscraper": { stones(-0.95, -7.0, 0.95, 0, o.color || "#7a8494", 0.5); for (let r = 0; r < 12; r++) for (let k = 0; k < 3; k++) K.paint(c, rect(-0.75 + k * 0.55, -6.7 + r * 0.55, -0.4 + k * 0.55, -6.35 + r * 0.55), lit && rnd(r * 3 + k) > 0.4 ? "#f2c66a" : "#3c4a5a", w * 0.5); break; }
    case "windmill": { const p = P([[-1.0, 0], [-0.6, -3.4], [0.6, -3.4], [1.0, 0]]); plasterWall(-1.0, -3.4, 1.0, 0); c.save(); c.globalCompositeOperation = "destination-out"; c.fill(P([[-1.05, 0], [-1.05, -3.45], [-0.6, -3.45]])); c.fill(P([[1.05, 0], [1.05, -3.45], [0.6, -3.45]])); c.restore(); c.lineWidth = w; c.strokeStyle = ol; c.stroke(p); gable(-0.75, 0.75, -3.4, 0.75, tile, "tile"); door(0, 0.5, 0.9, true); const a = t * 0.8; for (let i = 0; i < 4; i++) { const an = a + i * K.PI / 2, cx = 0, cy = -3.5; const tip = [cx + Math.cos(an) * 2.2, cy + Math.sin(an) * 2.2], nx = -Math.sin(an) * 0.3, ny = Math.cos(an) * 0.3; ln([[cx, cy], tip], 0.9); K.fill(c, P([[cx + Math.cos(an) * 0.6, cy + Math.sin(an) * 0.6], tip, [tip[0] + nx, tip[1] + ny], [cx + Math.cos(an) * 0.6 + nx, cy + Math.sin(an) * 0.6 + ny]]), "#ece6da", w * 0.8, { R, hatch: false }); } K.paint(c, K.ell(0, -3.5 * R, 0.14 * R, 0.14 * R), "#5a4a3a", w * 0.8); break; }
    case "tent": { const col = o.color || (night ? "#7a6e5c" : "#c8b892"); const p = P([[-2.0, 0], [0, -2.45], [2.0, 0]]); fillT(p, col, box(-2, -2.45, 2, 0), { dx: 0.25 * R, dy: 0 }); clip(p, () => { for (let i = 1; i < 6; i++) ln([[0, -2.45], [-2 + i * 4 / 6, 0]], 0.45); }); c.lineWidth = w; c.strokeStyle = ol; c.stroke(p); K.paint(c, P([[-0.38, 0], [0, -1.35], [0.38, 0]]), K.shade(col, 0.35), w * 0.8); ln([[0, -2.45], [0, -2.75]], 1); ln([[2.0, 0], [2.3, 0.05]], 0.6); ln([[-2.0, 0], [-2.3, 0.05]], 0.6); ln([[-1.0, -1.22], [-2.2, 0]], 0.4); ln([[1.0, -1.22], [2.2, 0]], 0.4); break; }
    case "yurt": { const col = "#ece2cc"; plasterWall(-1.55, -1.25, 1.55, 0, col); const p = S([[-1.65, -1.2], [-1.65, -1.2], [0, -2.2], [1.65, -1.2], [1.65, -1.2]]); fillT(p, K.shade(col, 0.95), box(-1.65, -2.2, 1.65, -1.2)); [-1, 1].forEach((k) => ln([[-1.55, -0.6 + k * 0.25], [1.55, -0.6 + k * 0.25]], 0.6, "#a83a2e")); door(0, 0.55, 0.95, false, "#a83a2e"); break; }
    case "ruins": { stones(-1.85, -2.2, -1.1, 0, stone0); stones(0.6, -1.4, 1.5, 0, stone0); c.save(); c.globalCompositeOperation = "destination-out"; c.fill(P([[-1.9, -2.3], [-1.05, -2.3], [-1.05, -1.4], [-1.5, -1.9]])); c.fill(P([[0.55, -1.5], [1.55, -1.5], [1.55, -0.8], [1.1, -1.2]])); c.restore(); win(-1.47, -1.1, 0.3, 0.55, true); [[-0.6, -0.15], [-0.15, -0.12], [0.25, -0.18]].forEach(([x, y], i) => K.paint(c, S([[x - 0.25, 0], [x - 0.2, y - 0.1], [x + 0.2, y - 0.12], [x + 0.25, 0]]), K.shade(stone0, 0.9 + i * 0.05), w * 0.7)); ln([[-0.9, -0.3], [-0.2, -0.9]], 1.6, wood); break; }
    case "bunker": { const p = S([[-2.2, 0], [-2.2, 0], [-1.7, -1.25], [-1.7, -1.25], [1.7, -1.25], [1.7, -1.25], [2.2, 0], [2.2, 0]]); fillT(p, "#8a8a80", box(-2.2, -1.3, 2.2, 0)); K.paint(c, rect(-0.9, -0.85, 0.9, -0.55), "#1c1c20", w); const bag = (x, y) => K.paint(c, S([[x - 0.26, y], [x - 0.24, y - 0.18], [x + 0.24, y - 0.18], [x + 0.26, y]]), "#b8a678", w * 0.7); for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) { bag(-2.9 + i * 0.5 + r * 0.25, -r * 0.18); bag(2.0 + i * 0.5 + r * 0.25, -r * 0.18); } fillT(S([[-1.9, -1.2], [0, -1.45], [1.9, -1.2], [1.6, -1.1], [-1.6, -1.1]]), "#6a7a4a", box(-2, -1.5, 2, -1), { hatch: false }); break; }
    case "trench": { const p = S([[-2.9, 0], [-2.9, 0], [-2.6, 0.9], [2.6, 0.9], [2.9, 0], [2.9, 0]]); fillT(p, "#4a3a2e", box(-2.9, 0, 2.9, 0.95)); clip(p, () => { for (let i = 0; i < 14; i++) ln([[-2.7 + i * 0.4, 0.05], [-2.7 + i * 0.4, 0.85]], 0.5, "#2a2018"); ln([[-2.9, 0.45], [2.9, 0.45]], 0.5); }); const bag = (x, y) => K.paint(c, S([[x - 0.24, y], [x - 0.22, y - 0.16], [x + 0.22, y - 0.16], [x + 0.24, y]]), "#b8a678", w * 0.7); [-2.0, -0.2, 1.6].forEach((x0) => { for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) bag(x0 + i * 0.45 + r * 0.22, -r * 0.16); }); break; }
    case "wall": case "gate": { stones(-2.0, -1.95, 2.0, 0, stone0, 0.32); merlons(-2.0, 2.0, -1.95, 6, stone0); if (kind === "gate") door(0, 1.05, 1.5, true, "#4a3a30"); break; }
    case "palisade": { for (let i = 0; i < 9; i++) { const x = -1.6 + i * 0.4, h = 2.6 + rnd(i) * 0.3; const p = P([[x - 0.17, 0], [x - 0.17, -h], [x, -h - 0.35], [x + 0.17, -h], [x + 0.17, 0]]); fillT(p, K.shade(wood, 0.92 + rnd(i + 5) * 0.12), box(x - 0.2, -h - 0.4, x + 0.2, 0), { hatch: false }); ln([[x - 0.05, -h + 0.3], [x - 0.02, -0.3]], 0.4); } ln([[-1.8, -2.0], [1.8, -2.0]], 1.6, K.shade(wood, 0.7)); ln([[-1.8, -0.7], [1.8, -0.7]], 1.6, K.shade(wood, 0.7)); break; }
    default: c.restore(); return null;
  }
  c.restore();
  return true;
}`;
