export const MOTION_KIT_CRAFT_KINDS = ["junk", "sampan", "cog", "caravel"];
export const SKIN_PART_CRAFT = `(c, o, K) => {
  const kind = o.kind;
  if (${JSON.stringify(MOTION_KIT_CRAFT_KINDS)}.indexOf(kind) < 0 || (o.view && o.view !== "side")) return null;
  const st = K.S(), R = K.num(o.r, 30), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R) * 0.9, ol = st.ol, night = K.NIGHT();
  const wood = K.toneOf(o.color || (night ? "#5a4636" : "#8a6040")), dark = K.shade(wood, 0.78), sailCol = K.toneOf(night ? "#b8b0a0" : "#efe6cf"), mat = K.toneOf(night ? "#7a6a48" : "#b8995a"), junkSail = K.toneOf(night ? "#8a5a44" : "#b86a48"), sea = K.toneOf("#5a7a8a");
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-3.5 * R, -6 * R, 3.5 * R, 0.5 * R] }, k || {}));
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, col || dark); };
  const clip = (p, fn) => { c.save(); c.clip(p); fn(); c.restore(); };
  const water = (hw) => { for (let i = 0; i < 4; i++) { const x = -hw + 0.3 + i * (2 * hw - 0.6) / 3 + Math.sin(t + i) * 0.1; ln([[x, 0.15], [x + 0.35, 0.12], [x + 0.6, 0.15]], 0.45, sea); } };
  const hull = (pts, col) => { const p = S(pts); fl(p, col || wood); clip(p, () => { for (let y = -2; y < 1; y += 0.2) ln([[-4, y], [4, y - 0.02]], 0.4); }); c.lineWidth = w; c.strokeStyle = ol; c.stroke(p); return p; };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(K.num(o.facing, 1) < 0 ? -1 : 1, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  c.translate(0, Math.sin(t * 1.6 + K.num(o.seed, 2)) * 0.03 * R);
  switch (kind) {
    case "sampan": {
      water(2.2);
      hull([[-2.2, -0.55], [-2.2, -0.55], [-1.7, 0.15], [1.6, 0.15], [2.3, -0.6], [2.3, -0.6]]);
      const roof = S([[-0.9, -0.5], [-0.9, -0.5], [-0.8, -1.25], [0, -1.5], [0.8, -1.25], [0.9, -0.5], [0.9, -0.5]]);
      fl(roof, mat); clip(roof, () => { for (let x = -0.9; x < 0.9; x += 0.18) ln([[x, -1.6], [x, -0.5]], 0.35); });
      beam([[1.6, -0.55], [2.6, -1.7]], 0.06);
      break;
    }
    case "junk": {
      water(3.0);
      hull([[-2.9, -1.45], [-2.9, -1.45], [-2.5, -0.1], [-1.5, 0.2], [1.8, 0.2], [2.8, -0.7], [2.8, -0.7]]);
      fl(P([[-2.95, -1.5], [-2.0, -1.5], [-2.0, -1.0], [-2.85, -1.0]]), dark);
      [[-1.3, 3.9, 1.5], [0.6, 5.0, 1.9], [2.0, 3.4, 1.1]].forEach(([x, h, wd]) => {
        beam([[x, -0.6], [x, -h - 0.2]], 0.09);
        const top = -h, bot = -1.0, p = S([[x - wd * 0.2, top], [x + wd * 0.75, top + 0.2], [x + wd, bot], [x - wd * 0.25, bot], [x - wd * 0.25, bot]]);
        fl(p, junkSail, { hatch: false });
        clip(p, () => { for (let y = top + 0.45; y < bot; y += 0.45) ln([[x - wd, y], [x + wd * 1.2, y + 0.06]], 0.6); });
        c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
      });
      break;
    }
    case "cog": {
      water(2.8);
      hull([[-2.6, -1.3], [-2.6, -1.3], [-2.2, 0.0], [-1.3, 0.25], [1.4, 0.25], [2.3, 0.0], [2.7, -1.3], [2.7, -1.3]]);
      fl(P([[-2.65, -1.95], [-1.5, -1.95], [-1.5, -1.25], [-2.6, -1.25]]), dark);
      fl(P([[1.6, -1.85], [2.7, -1.85], [2.7, -1.25], [1.6, -1.25]]), dark);
      beam([[0, -1.2], [0, -5.2]], 0.11);
      beam([[-1.3, -4.7], [1.3, -4.7]], 0.07);
      const sail = S([[-1.25, -4.65], [1.25, -4.65], [1.4, -3.2], [1.2, -1.75], [-1.2, -1.75], [-1.4, -3.2]]);
      fl(sail, sailCol, { hatch: false, dark: 0.9 });
      clip(sail, () => { for (let x = -1.0; x < 1.3; x += 0.5) ln([[x, -4.7], [x, -1.7]], 0.35); });
      ln([[0, -5.2], [2.7, -1.85]], 0.35); ln([[0, -5.2], [-2.6, -1.95]], 0.35);
      break;
    }
    case "caravel": {
      water(2.9);
      hull([[-2.6, -1.4], [-2.6, -1.4], [-2.2, 0.0], [-1.3, 0.22], [1.6, 0.22], [2.8, -1.0], [2.8, -1.0]]);
      fl(P([[-2.65, -2.0], [-1.4, -2.0], [-1.4, -1.35], [-2.6, -1.35]]), dark);
      [[-1.2, 4.0, 1.7], [0.9, 4.8, 2.1]].forEach(([x, h, wd]) => {
        beam([[x, -1.1], [x, -h]], 0.1);
        beam([[x - wd * 0.6, -1.5], [x + wd * 0.55, -h + 0.15]], 0.06);
        const p = S([[x + wd * 0.55, -h + 0.15], [x + wd * 0.55, -h + 0.15], [x + wd * 0.35, -2.4], [x - wd * 0.6, -1.5], [x - wd * 0.6, -1.5], [x - wd * 0.05, -2.9]]);
        fl(p, sailCol, { hatch: false, dark: 0.9 });
        c.lineWidth = w; c.strokeStyle = ol; c.stroke(p);
      });
      break;
    }
  }
  c.restore();
  return true;
}`;
