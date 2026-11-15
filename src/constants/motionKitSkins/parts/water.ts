// Shared water for every skin (outline, sketch, comic, horror): one geometry for river, sea, lake, pond, swamp,
// stream and puddle, painted with the active skin's ink, fill and its own water look (params.waterLook: day and
// night colours plus a ripple style: soft, hatch, highlight or faint). Geometry follows the kit doc:
// river and sea: y = far bank or horizon, a band from y down to y + height; lake, pond, swamp, puddle: a shore
// shape centred on y; stream: points (width = water thickness) or a winding band across width (height = thickness).
export const SKIN_PART_WATER = `(c, o, K) => {
  const kind = o.kind;
  const st = K.S(), look = st.waterLook || {}, R = K.num(o.r, 40), t = K.num(o.t, K.num(window.__motionKitTime, 0)), w = K.LW(R), ol = st.ol, night = K.NIGHT();
  const rnd = (i) => K.rnd(K.num(o.seed, 2), i);
  const swamp = kind === "swamp";
  const col = o.color || (swamp ? (night ? "#3a4a3a" : "#5e6e4a") : night ? look.night || "#4e6680" : look.day || "#7fb8e0");
  const deep = K.shade(col, 0.84), dirt = (st.ground && st.ground.dirt) || "#8a7a5a";
  const style = look.ripple || "soft";
  const ripCol = look.rippleCol || (style === "faint" ? "rgba(170,180,182,0.45)" : style === "hatch" ? "#e8f0f2" : "rgba(255,255,255,0.75)");
  const fill = (p, color, box, hatch) => K.fill(c, p, color, 0, { R, box, hatch: !!hatch });
  const ripples = (x0, x1, y0, y1, n) => {
    for (let i = 0; i < n; i++) {
      const span = Math.max(1, x1 - x0), x = x0 + ((rnd(i) * span + t * 12 * (i % 2 ? 1 : -1)) % span + span) % span, y = y0 + rnd(i + 30) * (y1 - y0), s = (0.22 + rnd(i + 60) * 0.35) * R;
      if (style === "highlight") { K.line(c, [[x - s, y], [x, y - 0.07 * R], [x + s, y]], w * 0.7, ripCol); if (i % 3 === 0) K.line(c, [[x - s * 0.5, y + 0.12 * R], [x + s * 0.5, y + 0.12 * R]], w * 0.5, ripCol); }
      else if (style === "hatch") K.line(c, [[x - s, y], [x - s * 0.3, y - 0.06 * R], [x + s * 0.3, y], [x + s, y - 0.04 * R]], w * 0.45, ripCol);
      else if (style === "faint") K.line(c, [[x - s * 1.4, y], [x + s * 1.4, y]], w * 0.35, ripCol);
      else K.line(c, [[x - s, y], [x - s * 0.4, y - 0.05 * R], [x + s * 0.4, y - 0.05 * R], [x + s, y]], w * 0.5, ripCol);
    }
  };
  const shoreLine = (pts) => K.line(c, pts, Math.max(1, w * 0.9), ol);
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  if (kind === "river" || kind === "sea") {
    const W = K.num(o.width, kind === "sea" ? 2600 : 10 * R), H = Math.max(8, K.num(o.height, kind === "sea" ? 400 : 1.2 * R));
    const top = [], n = Math.max(6, Math.round(W / (2.2 * R)));
    for (let i = 0; i <= n; i++) top.push([-W / 2 + (i / n) * W, (rnd(i + 5) - 0.5) * Math.min(0.12 * R, H * 0.06)]);
    const p = new Path2D(); top.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.lineTo(W / 2, H); p.lineTo(-W / 2, H); p.closePath();
    fill(p, col, [-W / 2, 0, W / 2, H]);
    c.save(); c.clip(p);
    c.fillStyle = deep; c.globalAlpha *= 0.55; c.fillRect(-W / 2, 0, W, Math.min(H, 0.18 * R + H * 0.12)); c.globalAlpha /= 0.55;
    if (style === "highlight") { c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(-W / 2, H * 0.55, W, H * 0.08); }
    ripples(-W / 2, W / 2, Math.min(H * 0.2, 0.3 * R), H * 0.92, Math.min(90, Math.round(W / (1.3 * R))));
    c.restore();
    shoreLine(top);
  } else if (kind === "lake" || kind === "pond" || swamp || kind === "puddle") {
    const W = K.num(o.width, kind === "pond" ? 4 * R : kind === "puddle" ? 2.4 * R : kind === "lake" ? 8.4 * R : 8 * R), H = K.num(o.height, kind === "pond" ? 1.2 * R : kind === "puddle" ? 0.4 * R : kind === "lake" ? 2 * R : 1.6 * R);
    const pts = [[-W / 2, 0], [-W * 0.35, -H * 0.5], [0, -H * 0.55], [W * 0.38, -H * 0.45], [W / 2, 0], [W * 0.35, H * 0.45], [0, H * 0.5], [-W * 0.38, H * 0.42]];
    const p = K.smooth(pts, true);
    if (kind !== "puddle") { const lip = K.smooth(pts.map(([x, y]) => [x * 1.04 + Math.sign(x) * 0.12 * R, y * 1.12]), true); K.fill(c, lip, K.toneOf(dirt), w, { R, box: [-W / 2, -H / 2, W / 2, H / 2], hatch: false }); }
    fill(p, col, [-W / 2, -H / 2, W / 2, H / 2]);
    c.save(); c.clip(p);
    c.fillStyle = deep; c.globalAlpha *= 0.5; c.fillRect(-W / 2, -H * 0.6, W, H * 0.35); c.globalAlpha /= 0.5;
    ripples(-W * 0.42, W * 0.42, -H * 0.25, H * 0.35, Math.max(2, Math.round(W / (1.5 * R))));
    if (swamp) for (let i = 0; i < 6; i++) K.paint(c, K.ell((rnd(i + 80) - 0.5) * W * 0.8, (rnd(i + 90) - 0.5) * H * 0.5, 0.3 * R, 0.1 * R), "#6a8a4a", w * 0.5);
    c.restore();
    c.lineWidth = Math.max(1, w * 0.8); c.strokeStyle = ol; c.stroke(p);
    if (kind === "pond" || swamp) [-W * 0.42, W * 0.4].forEach((x, i) => { for (let j = 0; j < 4; j++) { const rx = x + (j - 1.5) * 0.12 * R, h = (0.9 + rnd(j + i * 9) * 0.5) * R; K.line(c, [[rx, -H * 0.2], [rx + Math.sin(t + rx) * 0.06 * R, -H * 0.2 - h]], w * 0.9, K.toneOf("#6a7a3a")); } });
  } else if (kind === "stream") {
    let pts = Array.isArray(o.points) && o.points.length > 1 ? o.points.map((q) => [+q[0], +q[1]]) : null, thick;
    if (pts) thick = Math.max(6, K.num(o.width, 0.9 * R));
    else { const half = K.num(o.width, 10 * R) / 2; thick = Math.max(6, K.num(o.height, 0.9 * R)); pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([-half + k * 2 * half, Math.sin(k * Math.PI * 2 + K.num(o.seed, 1)) * thick * 0.35]); } }
    const chaikin = (list) => { const out = [list[0]]; for (let i = 0; i < list.length - 1; i++) { const [a, b] = [list[i], list[i + 1]]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } out.push(list[list.length - 1]); return out; };
    const line = chaikin(chaikin(chaikin(pts)));
    const taper = Array.isArray(o.taper) ? o.taper : [1, 1], last = line.length - 1;
    const half = (i) => (thick / 2) * (taper[0] + (taper[1] - taper[0]) * (i / last));
    const left = [], right = [];
    line.forEach((q, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(last, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, h = half(i); left.push([q[0] + nx * h, q[1] + ny * h]); right.push([q[0] - nx * h, q[1] - ny * h]); });
    const body = new Path2D(); left.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y))); for (let i = right.length - 1; i >= 0; i--) body.lineTo(right[i][0], right[i][1]); body.closePath();
    const xs = line.map((q) => q[0]), ys = line.map((q) => q[1]), box = [Math.min(...xs) - thick, Math.min(...ys) - thick, Math.max(...xs) + thick, Math.max(...ys) + thick];
    fill(body, col, box);
    c.save(); c.clip(body);
    c.fillStyle = deep; c.globalAlpha *= 0.4; const centre = new Path2D(); line.forEach(([x, y], i) => (i ? centre.lineTo(x, y) : centre.moveTo(x, y))); c.lineWidth = thick * 0.35; c.strokeStyle = deep; c.stroke(centre); c.globalAlpha /= 0.4;
    c.setLineDash([thick * 0.5, thick * 0.9]); c.lineDashOffset = -t * thick * 2.5; c.strokeStyle = ripCol; c.lineWidth = Math.max(1, thick * 0.08); c.lineCap = "round"; c.stroke(centre); c.setLineDash([]);
    if (o.ford) {
      const mid = Math.round(last * 0.3), q = line[mid], a = line[Math.max(0, mid - 1)], b = line[Math.min(last, mid + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, h = half(mid);
      c.fillStyle = "rgba(235,225,190,0.35)"; c.beginPath(); c.ellipse(q[0], q[1], h * 1.2, h * 0.95, Math.atan2(ny, nx), 0, Math.PI * 2); c.fill();
      for (let s = -2; s <= 2; s++) { const sx = q[0] + nx * h * s * 0.45 + (rnd(s + 40) - 0.5) * h * 0.15, sy = q[1] + ny * h * s * 0.45, r = h * (0.24 + rnd(s + 50) * 0.08); K.fill(c, K.ell(sx, sy, r * 1.3, r * 0.8), K.toneOf("#a39d92"), w * 0.7, { R, box: [sx - r * 2, sy - r * 2, sx + r * 2, sy + r * 2], hatch: false }); }
    }
    c.restore();
    K.line(c, left, Math.max(1, w * 0.8), ol);
    K.line(c, right, Math.max(1, w * 0.8), ol);
  } else { c.restore(); return null; }
  c.restore();
  return true;
}`;
