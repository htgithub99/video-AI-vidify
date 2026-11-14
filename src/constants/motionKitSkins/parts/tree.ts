// Trees for the sketch and comic skins, one drawer for every kit tree kind.
// Sketch (video 1): flat muted crown made of merged bumps, one darker side, a few scallop lines.
// Comic (video 2): the same build with ink hatching on the shadow side (skin param hatch), leaf ticks and bark lines.
// Footprints follow the core kit (units of R, ground at y=0): oak ±1.3 × 3.8, pine 4.5, palm 5.3, cypress 4.8, bush ±1.3 × 1.05, banyan ±2.1.
export const SKIN_PART_TREE = `(c, o, K) => {
  const st = K.S(), R = K.num(o.r, 40), w = K.LW(R), seed = K.num(o.seed, 1), ink = !!st.hatch;
  const t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const kind = o.kind || "oak";
  const night = K.NIGHT();
  const leaves = night ? K.organic.leafNight : K.organic.leaf;
  const leaf = o.color || leaves[Math.floor(K.rnd(seed, 5) * leaves.length)];
  const bark = o.trunk || (night ? K.organic.barkNight : K.organic.bark);
  const sway = Math.sin(t * 1.2 + seed) * K.num(o.sway, 1) * 0.04 * R;
  const rnd = (i) => K.rnd(seed, i);
  const ol = st.ol;
  const P = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const circ = (x, y, r) => K.ell(x * R, y * R, r * R, r * R);
  const box = (x0, y0, x1, y1) => [x0 * R, y0 * R, x1 * R, y1 * R];
  const stroke = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.6), col || ol);
  const trunk = (h, b, n, col, bend) => {
    const q = bend || 0;
    const p = P([[-b, 0.02], [-b * 0.62, -0.3], [-n + q * 0.4, -h * 0.6], [-n + q, -h], [n + q, -h], [n + q * 0.4, -h * 0.6], [b * 0.62, -0.3], [b, 0.02]]);
    K.fill(c, p, col || bark, w, { R, box: box(-b, -h, b, 0.1) });
    if (ink) for (let i = 0; i < 4; i++) { const y = -0.25 - rnd(i + 70) * h * 0.7; stroke([[-n * 0.4 + rnd(i + 80) * n * 0.6, y], [-n * 0.3 + rnd(i + 80) * n * 0.6, y - 0.22]], 0.45); }
    return p;
  };
  const crown = (cx, cy, rx, ry, bumps, br, col, k) => {
    const list = [K.ell((cx) * R + sway, cy * R, rx * 0.9 * R, ry * 0.9 * R)];
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * K.PI * 2 + rnd(i + 3) * 0.35, rr = br * (0.85 + rnd(i + 20) * 0.35);
      const bx = cx + Math.cos(a) * (rx - rr * 0.55), by = cy + Math.sin(a) * (ry - rr * 0.55);
      if (by > cy + ry * 0.55 && (k && k.flatBottom)) continue;
      list.push(K.ell(bx * R + sway, by * R, rr * R, rr * R));
    }
    const all = K.union(c, list, col || leaf, w, { R, dx: -0.22 * R, dy: -0.2 * R, box: box(cx - rx - 0.5, cy - ry - 0.5, cx + rx + 0.5, cy + ry + 0.5) });
    c.save();
    c.clip(all);
    const n = ink ? 7 : 3;
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd(i + 40) - 0.5) * rx * 1.3, y = cy + (rnd(i + 50) - 0.3) * ry * 1.1, a = 0.25 + rnd(i + 60) * 0.25;
      const arc = new Path2D();
      arc.arc(x * R + sway, y * R, a * R, K.PI * 0.15, K.PI * 0.85);
      c.lineWidth = w * 0.55; c.strokeStyle = ol; c.lineCap = "round"; c.stroke(arc);
    }
    if (ink) for (let i = 0; i < 10; i++) {
      const x = cx + (rnd(i + 90) - 0.5) * rx * 1.6, y = cy + (rnd(i + 100) - 0.5) * ry * 1.5;
      c.beginPath(); c.moveTo(x * R + sway, y * R); c.lineTo((x + 0.08) * R + sway, (y - 0.06) * R); c.lineWidth = w * 0.45; c.stroke();
    }
    c.restore();
    return all;
  };
  const dots = (cx, cy, rx, ry, n, col, rr) => { for (let i = 0; i < n; i++) { const a = rnd(i + 120) * K.PI * 2, d = Math.sqrt(rnd(i + 130)) * 0.8; K.paint(c, circ(cx + Math.cos(a) * rx * d + sway / R, cy + Math.sin(a) * ry * d, rr), col, w * 0.5); } };
  const branch = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, K.toneOf(col || bark)); };
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  if (kind !== "bush") { c.fillStyle = "rgba(20,16,12,0.18)"; c.fill(K.ell(0, 0, 1.0 * R, 0.13 * R)); }
  switch (kind) {
    case "pine": case "cypress": {
      const col = o.color || (night ? K.organic.pineNight : K.organic.pine);
      trunk(0.7, 0.16, 0.1);
      if (kind === "cypress") {
        const pts = [[0, -4.78]];
        for (let i = 1; i <= 8; i++) { const k = i / 8, y = -4.78 + k * 4.3, wd = 0.18 + Math.sin(k * K.PI * 0.9) * 0.42; pts.push([wd * (i % 2 ? 1 : 0.86), y]); }
        const right = pts.map(([x, y]) => [x + sway / R * (1 + y / 4.8), y]);
        const all = right.concat([[0, -0.4]], right.slice(1).reverse().map(([x, y]) => [-x + 2 * sway / R * (1 + y / 4.8), y]));
        const p = P(all);
        K.fill(c, p, col, w, { R, dx: -0.2 * R, dy: -0.1 * R, box: box(-1.1, -4.8, 1.1, 0) });
        for (let i = 0; i < 5; i++) stroke([[-0.3 + rnd(i) * 0.3, -1.0 - i * 0.7], [0.1 + rnd(i + 9) * 0.25, -1.25 - i * 0.7]], 0.5);
      } else {
        const tiers = 5, H = 4.53;
        const paths = [];
        for (let i = 0; i < tiers; i++) {
          const k = i / (tiers - 1), top = -H + k * H * 0.62, bot = top + 1.35 - k * 0.15, wd = 0.45 + k * 0.8, sw = sway / R * (1 - k * 0.6);
          const pts = [[sw, top]];
          const n = 4;
          for (let j = 1; j <= n; j++) { const u = j / n; pts.push([sw + wd * u * (j % 2 ? 1 : 0.92), top + (bot - top) * u - (j === n ? 0 : 0.08)]); }
          pts.push([sw + wd * 0.35, bot - 0.1], [sw - wd * 0.35, bot - 0.1]);
          for (let j = n; j >= 1; j--) { const u = j / n; pts.push([sw - wd * u * (j % 2 ? 1 : 0.92), top + (bot - top) * u - (j === n ? 0 : 0.08)]); }
          const p = new Path2D();
          pts.forEach(([x, y], q) => (q ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R)));
          p.closePath();
          paths.push(p);
        }
        K.union(c, paths, col, w, { R, dx: -0.22 * R, dy: -0.12 * R, box: box(-1.3, -4.6, 1.3, 0) });
        if (ink) for (let i = 1; i < tiers; i++) { const y = -H + (i / (tiers - 1)) * H * 0.62 + 0.9; stroke([[-0.35, y], [0, y + 0.18], [0.35, y]], 0.45); }
      }
      break;
    }
    case "palm": {
      const bend = 0.55 + Math.sin(t * 0.9 + seed) * 0.05;
      const tp = (u) => [bend * u * u, -4.6 * u];
      const pts = []; for (let i = 0; i <= 10; i++) pts.push(tp(i / 10));
      branch(pts, 0.24);
      for (let i = 1; i < 10; i++) { const a = tp(i / 10); stroke([[a[0] - 0.12, a[1]], [a[0] + 0.12, a[1] + 0.05]], 0.5); }
      const top = tp(1);
      const fronds = [[-2.2, 0.5], [-1.4, -0.7], [-0.2, -1.0], [1.2, -0.6], [2.0, 0.6], [0.9, 0.9], [-1.0, 1.0]];
      fronds.forEach(([dx, dy], i) => {
        const tip = [top[0] + dx * 0.8 + sway / R, top[1] + dy * 0.6 + 0.3], mid = [top[0] + dx * 0.45, top[1] + dy * 0.45 - 0.35];
        const nx = -(tip[1] - top[1]), ny = tip[0] - top[0], l = Math.hypot(nx, ny) || 1, k = 0.22;
        const p = P([top, [mid[0] + nx / l * k, mid[1] + ny / l * k], tip, [mid[0] - nx / l * k * 0.6, mid[1] - ny / l * k * 0.6]]);
        K.fill(c, p, i % 2 ? leaf : K.shade(leaf, 0.9), w, { R, hatch: false });
        stroke([top, mid, tip], 0.45);
      });
      K.paint(c, circ(top[0], top[1] + 0.15, 0.15), K.shade(bark, 0.8), w * 0.7);
      break;
    }
    case "banana": {
      trunk(1.6, 0.26, 0.2, K.shade(leaf, 0.75));
      [[-1.2, -3.0], [-0.6, -3.4], [0.5, -3.3], [1.25, -2.9], [0.2, -2.6]].forEach(([x, y], i) => {
        const base = [0, -1.5], tip = [x + sway / R, y + 0.35];
        const p = P([base, [x * 0.45 - 0.25, (y - 1.5) * 0.5 - 1.0], tip, [x * 0.55 + 0.25, (y - 1.5) * 0.5 - 0.55]]);
        K.fill(c, p, i % 2 ? leaf : K.shade(leaf, 1.08), w, { R });
        stroke([base, [x * 0.5, (y - 1.5) * 0.5 - 0.8], tip], 0.45);
      });
      break;
    }
    case "bamboo": {
      [[-0.75, 4.0, -0.15], [-0.25, 4.37, 0.05], [0.25, 4.1, 0.15], [0.7, 3.6, 0.25]].forEach(([x, h, lean], i) => {
        const top = [x + lean + sway / R, -h], pts = [[x, 0], [x + lean * 0.5, -h * 0.5], top];
        branch(pts, 0.14, K.shade(leaf, 1.1));
        for (let j = 1; j < 6; j++) { const u = j / 6, p = [x + lean * u, -h * u]; stroke([[p[0] - 0.09, p[1]], [p[0] + 0.09, p[1]]], 0.6); }
        for (let j = 0; j < 3; j++) { const u = 0.55 + j * 0.15, p = [x + lean * u, -h * u], d = (i + j) % 2 ? 1 : -1; K.fill(c, P([p, [p[0] + d * 0.35, p[1] - 0.25], [p[0] + d * 0.7, p[1] - 0.05], [p[0] + d * 0.35, p[1] - 0.06]]), leaf, w * 0.8, { R, hatch: false }); }
      });
      break;
    }
    case "dead": {
      trunk(2.2, 0.26, 0.12, bark);
      branch([[0, -2.1], [-0.35, -2.8], [-0.95, -3.3]], 0.12);
      branch([[0, -2.1], [0.3, -2.9], [0.6, -3.5]], 0.11);
      branch([[0, -1.4], [0.55, -1.9], [1.0, -2.0]], 0.09);
      branch([[-0.35, -2.8], [-0.2, -3.25]], 0.06);
      branch([[0.3, -2.9], [0.75, -3.0]], 0.06);
      branch([[0, -1.7], [-0.6, -2.1], [-1.0, -2.1]], 0.08);
      break;
    }
    case "bush": {
      const col = o.color || leaf;
      crown(0, -0.55, 1.25, 0.55, 7, 0.45, col, { flatBottom: true });
      if (o.flowers && !night) dots(0, -0.6, 1.0, 0.4, 7, o.bloom || "#f2e8d0", 0.07);
      break;
    }
    case "willow": {
      trunk(2.2, 0.3, 0.16);
      crown(0, -2.75, 1.2, 0.95, 9, 0.45);
      for (let i = 0; i < 9; i++) {
        const x = -1.2 + i * 0.3, top = -2.5 + Math.abs(x) * 0.35, len = 1.6 + rnd(i + 200) * 0.6;
        const sw = sway / R * (1 + i * 0.1);
        const p = P([[x - 0.1, top], [x + 0.1, top], [x + 0.08 + sw, top + len], [x + sw * 1.2, top + len + 0.15], [x - 0.08 + sw, top + len]]);
        K.fill(c, p, K.shade(leaf, 0.92), w * 0.8, { R, hatch: false });
      }
      break;
    }
    case "banyan": {
      trunk(2.0, 0.55, 0.4);
      for (let i = 0; i < 7; i++) { const x = -1.8 + i * 0.6; if (Math.abs(x) < 0.5) continue; stroke([[x, -2.0], [x + 0.05, -1.0], [x - 0.02, 0]], 0.7, K.shade(bark, 0.8)); }
      crown(0, -2.75, 2.05, 1.05, 12, 0.55);
      break;
    }
    case "birch": {
      const p = trunk(2.6, 0.2, 0.12, night ? "#b9b4aa" : "#ece8de");
      c.save(); c.clip(p); c.fillStyle = "#2e2a28";
      for (let i = 0; i < 7; i++) c.fill(K.ell((rnd(i) - 0.5) * 0.2 * R, -(0.3 + i * 0.32) * R, 0.09 * R, 0.035 * R));
      c.restore();
      branch([[0, -2.3], [-0.45, -2.9]], 0.06, "#ece8de");
      crown(0, -3.45, 0.95, 1.05, 8, 0.42);
      break;
    }
    default: {
      trunk(2.25, 0.34, 0.2);
      branch([[0, -1.9], [-0.45, -2.45]], 0.12);
      branch([[0, -2.0], [0.5, -2.55]], 0.11);
      const blossom = kind === "cherry";
      const col = o.color || (blossom ? (night ? "#a98a95" : "#e8b4c4") : leaf);
      crown(0, -2.75, 1.27, 1.03, 10, 0.48, col);
      if (kind === "fruit") dots(0, -2.75, 1.0, 0.8, 9, o.fruit || "#b8432f", 0.1);
      if (blossom) dots(0, -2.75, 1.0, 0.8, 12, "#f8eef0", 0.07);
    }
  }
  c.restore();
  return true;
}`;
