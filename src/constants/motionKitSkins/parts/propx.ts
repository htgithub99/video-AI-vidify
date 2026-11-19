export const SKIN_PART_PROPX = `(c, o, K) => {
  const kind = o.kind;
  const st = K.S(), p = K.num(o.p, K.num(o.r, 30) / 1.6), w = K.LW(p * 1.4), ol = st.ol, night = K.NIGHT();
  const rnd = (i) => K.rnd(K.num(o.seed, 3), i);
  const wood = o.color ? K.toneOf(o.color) : K.toneOf(night ? "#5e4a3a" : "#8a6444"), iron = K.toneOf("#6c7076"), stone = K.toneOf(night ? "#7e7a72" : "#a39d92");
  const P = (pts) => { const q = new Path2D(); pts.forEach(([x, y], i) => (i ? q.lineTo(x * p, y * p) : q.moveTo(x * p, y * p))); q.closePath(); return q; };
  const fl = (q, col, box) => K.fill(c, q, col, w, { R: p, box: box || [-4 * p, -4 * p, 4 * p, 1 * p] });
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * p, y * p]); K.line(c, q, wd * p + w * 2, ol); K.line(c, q, wd * p, col || wood); };
  const f = K.num(o.facing, 1) < 0 ? -1 : 1;
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (kind !== "pyramid" && kind !== "chain") c.scale(f, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  switch (kind) {
    case "spear": beam([[-3.4, -0.12], [3.0, -0.22]], 0.14); fl(P([[3.0, -0.36], [3.75, -0.24], [3.0, -0.08]]), iron); break;
    case "axe": beam([[-1.4, -0.1], [1.2, -0.2]], 0.16); fl(P([[0.9, -0.25], [1.5, -0.75], [1.65, -0.15], [1.45, 0.25]]), iron); break;
    case "scroll": fl(P([[-0.7, -0.32], [0.7, -0.32], [0.7, 0], [-0.7, 0]]), K.toneOf("#efe2bf")); beam([[-0.78, -0.36], [-0.78, 0.04]], 0.14, "#b08a52"); beam([[0.78, -0.36], [0.78, 0.04]], 0.14, "#b08a52"); break;
    case "bow": { const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.15 + (0.7 * i) / 16); pts.push([Math.cos(a) * 1.6, Math.sin(a) * 1.6 + 1.3]); } beam(pts, 0.16); K.line(c, [[pts[0][0] * p, pts[0][1] * p], [pts[16][0] * p, pts[16][1] * p]], Math.max(1, w * 0.4), K.toneOf("#e8e0cc")); break; }
    case "bucket": { const body = P([[-0.5, -1.0], [0.5, -1.0], [0.4, 0], [-0.4, 0]]); fl(body, wood); [-0.25, 0, 0.25].forEach((x) => K.line(c, [[x * p, -0.98 * p], [x * 0.82 * p, -0.02 * p]], w * 0.4, ol)); [[-0.7, 0.475], [-0.25, 0.43]].forEach(([y, hw]) => K.line(c, [[-hw * p, y * p], [hw * p, y * p]], 0.06 * p, iron)); K.paint(c, K.ell(0, -1.0 * p, 0.5 * p, 0.1 * p), K.shade(wood, 0.7), w * 0.8); const h = new Path2D(); h.arc(0, -1.0 * p, 0.48 * p, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = w * 0.7; c.strokeStyle = ol; c.stroke(h); break; }
    case "stonePile": [[-1.2, 0, 0.55], [-0.2, 0, 0.65], [0.85, 0, 0.5], [-0.65, -0.62, 0.5], [0.35, -0.68, 0.5], [-0.15, -1.2, 0.42]].forEach(([x, y, r], i) => fl(K.smooth([[x - r, y], [x - r * 0.7, y - r * 1.1], [x + r * 0.6, y - r * 1.15], [x + r, y - r * 0.2], [x + r * 0.6, y + 0.02]].map(([a, b]) => [a * p, b * p]), true), i % 2 ? stone : K.shade(stone, 0.9))); break;
    case "pyramid": { const W = K.num(o.width, 6 * p), H = K.num(o.height, W * 0.62), q = new Path2D(); q.moveTo(-W / 2, 0); q.lineTo(0, -H); q.lineTo(W / 2, 0); q.closePath(); K.fill(c, q, K.toneOf(o.color || "#d9bf86"), w, { R: W / 8, box: [-W / 2, -H, W / 2, 0] }); const sh = new Path2D(); sh.moveTo(0, -H); sh.lineTo(W / 2, 0); sh.lineTo(W * 0.12, 0); sh.closePath(); c.fillStyle = "rgba(90,60,30,0.28)"; c.fill(sh); c.save(); c.clip(q); c.strokeStyle = ol; c.globalAlpha *= 0.25; c.lineWidth = Math.max(0.8, w * 0.35); for (let k = 1; k < 10; k++) { const y = -(H * k) / 10; c.beginPath(); c.moveTo(-W / 2, y); c.lineTo(W / 2, y); c.stroke(); } c.restore(); c.lineWidth = w; c.strokeStyle = ol; c.stroke(q); break; }
    case "chain": {
      const link = Math.max(3, K.num(o.r, p * 0.22 * 1.6) / 1.6);
      let pts = Array.isArray(o.points) && o.points.length > 1 ? o.points.map((q) => [+q[0] - K.num(o.x, 0), +q[1] - K.num(o.y, 0)]) : null;
      if (!pts) { const half = K.num(o.width, link * 16) / 2, sag = K.num(o.sag, half * 0.12); pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push([-half + k * 2 * half, Math.sin(Math.PI * k) * sag]); } }
      let index = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0), an = Math.atan2(y1 - y0, x1 - x0), steps = Math.max(1, Math.round(len / (link * 1.5)));
        for (let j = 0; j < steps; j++, index++) { const k = (j + 0.5) / steps; c.save(); c.translate(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); c.rotate(an); const q = new Path2D(); if (index % 2) q.ellipse(0, 0, link * 0.95, link * 0.55, 0, 0, Math.PI * 2); else { q.moveTo(-link * 0.95, 0); q.lineTo(link * 0.95, 0); } c.lineWidth = Math.max(2, link * 0.42); c.strokeStyle = ol; c.stroke(q); c.lineWidth = Math.max(1, link * 0.24); c.strokeStyle = o.color ? K.toneOf(o.color) : iron; c.stroke(q); c.restore(); }
      }
      break;
    }
    default: c.restore(); return null;
  }
  c.restore();
  return true;
}`;
