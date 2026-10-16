(function (root) {
  "use strict";
  const MT = root.MotionEngineText;
  const ME = root.MotionEngine;
  const U = ME.util, C = ME.color;
  const PI = Math.PI;
  const GEO = root.MotionGeoData || { countries: [], cities: {}, aliases: {}, regions: {} };
  const byName = {};
  for (const c of GEO.countries) byName[c.n.toLowerCase()] = c;
  const cityKey = {};
  for (const [k, v] of Object.entries(GEO.cities || {})) cityKey[k.toLowerCase()] = v;
  const aliasKey = {};
  for (const [k, v] of Object.entries(GEO.aliases || {})) aliasKey[k.toLowerCase()] = v;
  const countriesOf = (name) => {
    const k = String(name || MT.EMPTY)
      .trim()
      .toLowerCase();
    if (!k) return [];
    if (aliasKey[k]) return aliasKey[k].map((n) => byName[n.toLowerCase()]).filter(Boolean);
    return byName[k] ? [byName[k]] : [];
  };
  const lonLatOf = (v) => {
    if (Array.isArray(v) && v.length >= 2 && isFinite(v[0]) && isFinite(v[1])) return [+v[0], +v[1]];
    if (v && typeof v === MT.OBJECT && isFinite(v.lon) && isFinite(v.lat)) return [+v.lon, +v.lat];
    const k = String((v && v.name) || v || MT.EMPTY)
      .trim()
      .toLowerCase();
    return cityKey[k] || null;
  };
  const regionOf = (p) => {
    if (Array.isArray(p.bbox) && p.bbox.length === 4 && p.bbox.every(isFinite)) return p.bbox.map(Number);
    return (GEO.regions || {})[String(p.region || MT.EMPTY).toLowerCase()] || GEO.regions.europe || [-12, 34, 48, 66];
  };
  const mercY = (lat) => Math.log(Math.tan(PI / 4 + (U.clamp(lat, -84, 84) * PI) / 360));
  const wrapLon = (lon, wrap) => (wrap && lon < 0 ? lon + 360 : lon);
  const view = (box, W, H) => {
    const x0 = (box[0] * PI) / 180, x1 = (box[2] * PI) / 180, y0 = mercY(box[1]), y1 = mercY(box[3]);
    const s = Math.max(W / Math.max(1e-6, x1 - x0), H / Math.max(1e-6, y1 - y0));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { s, cx, cy, wrap: box[2] > MT.GEO_WRAP_EAST };
  };
  const project = (v, W, H, lon, lat) => [W / 2 + ((wrapLon(lon, v.wrap) * PI) / 180 - v.cx) * v.s, H / 2 - (mercY(lat) - v.cy) * v.s];
  const lerpBox = (a, b, k) => a.map((x, i) => U.lerp(x, b[i], k));
  const zoomBox = (box, center, factor) => {
    const w = (box[2] - box[0]) / factor, h = (box[3] - box[1]) / factor;
    return [center[0] - w / 2, center[1] - h / 2, center[0] + w / 2, center[1] + h / 2];
  };
  const tracePath = (g, pts) => {
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  };
  const outlinedText = (g, str, x, y, size, o = {}) => {
    str = String(str == null ? MT.EMPTY : str);
    if (!str) return;
    g.save();
    g.font = ME.font(o.weight || 800, size, o.family || MT.HEAD);
    g.textAlign = o.align || MT.CENTER;
    g.textBaseline = MT.MIDDLE;
    g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.lineJoin = MT.ROUND;
    g.lineWidth = size * (o.outline == null ? 0.22 : o.outline);
    g.strokeStyle = o.stroke || MT.GEO_OUTLINE;
    g.strokeText(str, x, y);
    g.fillStyle = o.color || MT.GEO_TEXT;
    g.fillText(str, x, y);
    g.restore();
  };
  const ringPoints = (ring, v, W, H) => {
    const pts = [];
    for (let i = 0; i < ring.length; i += 2) pts.push(project(v, W, H, ring[i], ring[i + 1]));
    return pts;
  };
  const fillCountry = (g, c, v, W, H) => {
    g.beginPath();
    for (const ring of c.r) {
      const pts = ringPoints(ring, v, W, H);
      tracePath(g, pts);
      g.closePath();
    }
  };
  const polyline = (raw) => (Array.isArray(raw) ? raw.map(lonLatOf).filter(Boolean) : []);
  const resample = (pts, n) => {
    if (pts.length < 2) return pts.slice();
    const seg = [0];
    for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = seg[seg.length - 1] || 1, out = [];
    for (let k = 0; k < n; k++) {
      const d = (k / (n - 1)) * total;
      let i = 1;
      while (i < seg.length - 1 && seg[i] < d) i++;
      const f = (d - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
      out.push([U.lerp(pts[i - 1][0], pts[i][0], f), U.lerp(pts[i - 1][1], pts[i][1], f)]);
    }
    return out;
  };
  const drawFront = (g, pts, color, un, flip) => {
    if (pts.length < 2) return;
    g.save();
    g.strokeStyle = MT.GEO_FRONT;
    g.lineWidth = 4 * un;
    g.lineJoin = MT.ROUND;
    g.beginPath();
    tracePath(g, pts);
    g.stroke();
    g.fillStyle = color || MT.GEO_FRONT;
    const step = 26 * un, size = 11 * un;
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1e-3) continue;
      const dx = (x1 - x0) / len, dy = (y1 - y0) / len, nx = flip ? dy : -dy, ny = flip ? -dx : dx;
      for (let d = step - carry; d < len; d += step) {
        const px = x0 + dx * d, py = y0 + dy * d;
        g.beginPath();
        g.moveTo(px - dx * size * 0.6, py - dy * size * 0.6);
        g.lineTo(px + dx * size * 0.6, py + dy * size * 0.6);
        g.lineTo(px + nx * size, py + ny * size);
        g.closePath();
        g.fill();
        g.strokeStyle = MT.GEO_FRONT;
        g.lineWidth = 1.5 * un;
        g.stroke();
      }
      carry = (carry + len) % step;
    }
    g.restore();
  };
  const drawArrow = (g, a, b, k, color, un, label, bend) => {
    const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
    const at = (s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
    const N = 48, end = Math.max(1, Math.round(N * k));
    const pts = [];
    for (let i = 0; i <= end; i++) pts.push(at(i / N));
    if (pts.length < 2) return;
    const tip = pts[pts.length - 1], prev = pts[Math.max(0, pts.length - 3)];
    const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    g.save();
    g.lineCap = MT.ROUND;
    g.lineJoin = MT.ROUND;
    for (const [w, col] of [
      [22 * un, MT.GEO_OUTLINE],
      [14 * un, color],
    ]) {
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath();
      tracePath(g, pts.slice(0, -2));
      g.stroke();
    }
    const head = 30 * un;
    g.translate(tip[0], tip[1]);
    g.rotate(ang);
    g.beginPath();
    g.moveTo(head * 0.4, 0);
    g.lineTo(-head * 0.8, head * 0.75);
    g.lineTo(-head * 0.8, -head * 0.75);
    g.closePath();
    g.fillStyle = color;
    g.lineWidth = 4 * un;
    g.strokeStyle = MT.GEO_OUTLINE;
    g.stroke();
    g.fill();
    g.restore();
    if (label && k > 0.6) {
      const m = at(0.5);
      outlinedText(g, label, m[0], m[1] - 30 * un, 30 * un, { alpha: U.clamp((k - 0.6) / 0.3) });
    }
  };
  const tagBox = (g, str, x, y, size, o = {}) => {
    str = String(str || MT.EMPTY);
    if (!str) return;
    g.save();
    g.font = ME.font(800, size, MT.HEAD);
    const w = g.measureText(str).width + size * 1.2, h = size * 1.7;
    const bx = o.align === MT.RIGHT ? x - w : o.align === MT.CENTER ? x - w / 2 : x;
    g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.fillStyle = o.bg || MT.HUD_PANEL;
    g.strokeStyle = o.edge || MT.HUD_EDGE;
    g.lineWidth = size * 0.12;
    g.beginPath();
    if (g.roundRect) g.roundRect(bx, y - h / 2, w, h, size * 0.3);
    else g.rect(bx, y - h / 2, w, h);
    g.fill();
    g.stroke();
    g.fillStyle = o.color || MT.HUD_TEXT;
    g.textAlign = MT.CENTER;
    g.textBaseline = MT.MIDDLE;
    g.fillText(str, bx + w / 2, y + size * 0.05);
    g.restore();
    return w;
  };
  ME.registerTemplate(MT.GEOMAP, {
    name: MT.GEOMAP_NAME,
    category: MT.INFOGRAPHIC,
    description: MT.GEOMAP_DESC,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, u = ctx.u, un = ctx.unit;
      const base = regionOf(p);
      const target = lonLatOf(p.zoomTo);
      const zk = target ? U.smooth(U.inv(0.15, 0.75, u)) : 0;
      const box = target ? lerpBox(base, zoomBox(base, target, U.clamp(+p.zoom || 2.5, 1, 8)), zk) : base;
      const v = view(box, W, H);
      g.fillStyle = p.sea || MT.GEO_SEA;
      g.fillRect(0, 0, W, H);
      g.strokeStyle = C.rgba(MT.FFFFFF, 0.12);
      g.lineWidth = 1 * un;
      for (let lon = -180; lon <= 360; lon += 10) {
        const a = project(v, W, H, lon, -80), b = project(v, W, H, lon, 84);
        if (b[0] < -10 || a[0] > W + 10) continue;
        g.beginPath();
        g.moveTo(a[0], 0);
        g.lineTo(a[0], H);
        g.stroke();
      }
      for (let lat = -80; lat <= 80; lat += 10) {
        const a = project(v, W, H, box[0], lat);
        if (a[1] < -10 || a[1] > H + 10) continue;
        g.beginPath();
        g.moveTo(0, a[1]);
        g.lineTo(W, a[1]);
        g.stroke();
      }
      const sideOf = new Map();
      (Array.isArray(p.sides) ? p.sides : []).forEach((s, i) => {
        const col = (s && s.color) || MT.GEO_SIDE_COLORS[i % MT.GEO_SIDE_COLORS.length];
        const appear = U.clamp((u - (s && isFinite(s.at) ? +s.at : 0.04 + i * 0.08)) / 0.12);
        for (const n of (s && s.countries) || []) for (const c of countriesOf(n)) sideOf.set(c, { col, appear });
      });
      g.save();
      g.shadowColor = C.rgba(MT.VALUE_000, 0.25);
      g.shadowBlur = 18 * un;
      g.fillStyle = p.land || MT.GEO_LAND;
      for (const c of GEO.countries) {
        fillCountry(g, c, v, W, H);
        g.fill();
      }
      g.restore();
      for (const [c, s] of sideOf) {
        if (s.appear <= 0) continue;
        g.globalAlpha = s.appear;
        g.fillStyle = s.col;
        fillCountry(g, c, v, W, H);
        g.fill();
        g.globalAlpha = 1;
      }
      g.strokeStyle = MT.GEO_BORDER;
      g.lineWidth = 1.4 * un;
      for (const c of GEO.countries) {
        fillCountry(g, c, v, W, H);
        g.stroke();
      }
      const pulse = 0.55 + 0.45 * Math.sin(t * 4);
      for (const n of Array.isArray(p.highlight) ? p.highlight : [])
        for (const c of countriesOf(n)) {
          g.save();
          g.strokeStyle = C.rgba(p.highlightColor || MT.HUD_EDGE, pulse);
          g.lineWidth = 5 * un;
          g.shadowColor = p.highlightColor || MT.HUD_EDGE;
          g.shadowBlur = 16 * un;
          fillCountry(g, c, v, W, H);
          g.stroke();
          g.restore();
        }
      (Array.isArray(p.fronts) ? p.fronts : []).forEach((f, i) => {
        const a = polyline(f && (f.line || f.from));
        if (a.length < 2) return;
        const b = polyline(f.to);
        const show = U.clamp((u - (isFinite(f.at) ? +f.at : 0.12 + i * 0.05)) / 0.12);
        if (show <= 0) return;
        const mk = b.length >= 2 ? U.smooth(U.inv(0.3, 0.85, u)) : 0;
        const n = Math.max(12, a.length * 6);
        const ra = resample(a, n), rb = b.length >= 2 ? resample(b, n) : ra;
        const cur = ra.map((pt, j) => project(v, W, H, U.lerp(pt[0], rb[j][0], mk), U.lerp(pt[1], rb[j][1], mk)));
        g.globalAlpha = show;
        drawFront(g, cur, f.color, un, !!f.flip);
        g.globalAlpha = 1;
      });
      (Array.isArray(p.arrows) ? p.arrows : []).forEach((ar, i) => {
        const a = lonLatOf(ar && ar.from), b = lonLatOf(ar && ar.to);
        if (!a || !b) return;
        const st = isFinite(ar.at) ? +ar.at : 0.25 + i * 0.12;
        const k = U.clamp((u - st) / Math.max(0.1, isFinite(ar.dur) ? +ar.dur : 0.35));
        if (k <= 0) return;
        drawArrow(g, project(v, W, H, a[0], a[1]), project(v, W, H, b[0], b[1]), U.easeOut(k), ar.color || MT.GEO_ARROW, un, ar.label, isFinite(ar.bend) ? +ar.bend : 0.15);
      });
      (Array.isArray(p.cities) ? p.cities : []).forEach((ct, i) => {
        const ll = lonLatOf(ct);
        if (!ll) return;
        const k = U.clamp((u - (isFinite(ct.at) ? +ct.at : 0.06 + i * 0.05)) / 0.1);
        if (k <= 0) return;
        const [x, y] = project(v, W, H, ll[0], ll[1]);
        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) return;
        const r = (ct.capital ? 9 : 7) * un * U.back(k);
        g.fillStyle = MT.GEO_TEXT;
        g.strokeStyle = MT.GEO_CITY;
        g.lineWidth = 3 * un;
        g.beginPath();
        g.arc(x, y, r, 0, PI * 2);
        g.fill();
        g.stroke();
        if (ct.capital) {
          g.fillStyle = MT.GEO_CITY;
          g.beginPath();
          g.arc(x, y, r * 0.45, 0, PI * 2);
          g.fill();
        }
        const label = ct.label || (typeof ct === MT.STRING ? ct : ct.name);
        if (label) outlinedText(g, String(label).toUpperCase(), x, p.title && y < H * MT.GEO_TITLE_BAND ? y + 30 * un : y - 26 * un, 26 * un, { alpha: k });
      });
      (Array.isArray(p.labels) ? p.labels : []).forEach((lb, i) => {
        const ll = lonLatOf(lb && (lb.at || lb.pos || lb)) || lonLatOf([lb && lb.lon, lb && lb.lat]);
        if (!ll || !lb.text) return;
        const k = U.clamp((u - (isFinite(lb.show) ? +lb.show : 0.2 + i * 0.08)) / 0.12);
        if (k <= 0) return;
        const [x, y] = project(v, W, H, ll[0], ll[1]);
        outlinedText(g, String(lb.text).toUpperCase(), x, y, (lb.big ? 64 : 40) * un * (0.7 + 0.3 * U.back(k)), { alpha: k, color: lb.color || MT.GEO_TEXT });
      });
      if (p.title) outlinedText(g, String(p.title).toUpperCase(), W / 2, H * 0.1, 64 * un, { alpha: U.clamp(t / 0.6), color: p.titleColor || MT.GEO_TEXT });
      if (p.date) tagBox(g, String(p.date).toUpperCase(), W * 0.035, H * 0.9, 26 * un, { alpha: U.clamp(t / 0.6) });
      const legend = (Array.isArray(p.sides) ? p.sides : []).map((s, i) => ({ name: s && s.name, col: (s && s.color) || MT.GEO_SIDE_COLORS[i % MT.GEO_SIDE_COLORS.length] })).filter((s) => s.name);
      if (legend.length) {
        const fs = 22 * un, row = fs * 1.5, pad = fs * 0.7;
        g.save();
        g.font = ME.font(800, fs, MT.HEAD);
        const lw = Math.max(...legend.map((s) => g.measureText(String(s.name).toUpperCase()).width)) + fs * 1.6 + pad * 2;
        const lh = legend.length * row + pad * 1.2;
        const lx = W * 0.965 - lw, ly = H * 0.93 - lh;
        g.globalAlpha = U.clamp(t / 0.6);
        g.fillStyle = MT.HUD_PANEL;
        g.strokeStyle = MT.HUD_EDGE;
        g.lineWidth = fs * 0.1;
        g.beginPath();
        if (g.roundRect) g.roundRect(lx, ly, lw, lh, fs * 0.35);
        else g.rect(lx, ly, lw, lh);
        g.fill();
        g.stroke();
        g.textAlign = MT.LEFT;
        g.textBaseline = MT.MIDDLE;
        legend.forEach((s, i) => {
          const cy = ly + pad * 0.6 + row * (i + 0.5);
          g.fillStyle = s.col;
          g.fillRect(lx + pad, cy - fs * 0.4, fs * 0.8, fs * 0.8);
          g.fillStyle = MT.HUD_TEXT;
          g.fillText(String(s.name).toUpperCase(), lx + pad + fs * 1.2, cy);
        });
        g.restore();
      }
    },
  });
  const icon = (g, kind, s, color) => {
    g.fillStyle = color;
    g.strokeStyle = MT.GEO_OUTLINE;
    g.lineWidth = s * 0.06;
    g.lineJoin = MT.ROUND;
    const R = (x, y, w, h, r = 0) => {
      g.beginPath();
      if (g.roundRect) g.roundRect(x * s, y * s, w * s, h * s, r * s);
      else g.rect(x * s, y * s, w * s, h * s);
      g.fill();
      g.stroke();
    };
    const O = (x, y, r) => {
      g.beginPath();
      g.arc(x * s, y * s, r * s, 0, PI * 2);
      g.fill();
      g.stroke();
    };
    const P = (pts) => {
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s)));
      g.closePath();
      g.fill();
      g.stroke();
    };
    switch (kind) {
      case MT.ICON_TANK:
        R(-0.45, 0.05, 0.9, 0.22, 0.1);
        R(-0.38, -0.12, 0.76, 0.2, 0.04);
        R(-0.18, -0.3, 0.36, 0.2, 0.06);
        R(0.16, -0.24, 0.32, 0.06, 0.02);
        break;
      case MT.ICON_PLANE:
        P([
          [-0.45, 0],
          [0.45, -0.05],
          [0.5, 0.02],
          [-0.45, 0.08],
        ]);
        P([
          [-0.05, -0.02],
          [0.1, -0.02],
          [-0.15, -0.38],
          [-0.25, -0.38],
        ]);
        P([
          [-0.05, 0.05],
          [0.1, 0.05],
          [-0.15, 0.4],
          [-0.25, 0.4],
        ]);
        P([
          [-0.45, 0],
          [-0.38, 0],
          [-0.46, -0.18],
          [-0.5, -0.18],
        ]);
        break;
      case MT.ICON_SHIP:
        P([
          [-0.48, 0.05],
          [0.48, 0.05],
          [0.36, 0.25],
          [-0.4, 0.25],
        ]);
        R(-0.2, -0.15, 0.4, 0.2);
        R(-0.05, -0.32, 0.12, 0.18);
        break;
      case MT.ICON_SOLDIER:
        O(0, -0.3, 0.12);
        P([
          [-0.2, -0.36],
          [0.2, -0.36],
          [0.16, -0.44],
          [-0.16, -0.44],
        ]);
        R(-0.16, -0.16, 0.32, 0.32, 0.06);
        R(-0.15, 0.16, 0.12, 0.28);
        R(0.03, 0.16, 0.12, 0.28);
        break;
      case MT.ICON_PERSON:
        O(0, -0.28, 0.13);
        R(-0.18, -0.12, 0.36, 0.3, 0.1);
        R(-0.15, 0.17, 0.12, 0.28);
        R(0.03, 0.17, 0.12, 0.28);
        break;
      case MT.ICON_FACTORY:
        P([
          [-0.45, 0.4],
          [-0.45, -0.05],
          [-0.2, 0.1],
          [-0.2, -0.05],
          [0.05, 0.1],
          [0.05, -0.05],
          [0.3, 0.1],
          [0.3, -0.4],
          [0.45, -0.4],
          [0.45, 0.4],
        ]);
        break;
      case MT.ICON_BOMB:
        O(0, 0.05, 0.3);
        R(-0.08, -0.35, 0.16, 0.12);
        g.strokeStyle = MT.HUD_EDGE;
        g.beginPath();
        g.moveTo(0, -0.35 * s);
        g.quadraticCurveTo(0.15 * s, -0.5 * s, 0.25 * s, -0.42 * s);
        g.stroke();
        break;
      case MT.ICON_COIN:
        O(0, 0, 0.36);
        g.fillStyle = MT.GEO_OUTLINE;
        g.font = ME.font(800, s * 0.42, MT.HEAD);
        g.textAlign = MT.CENTER;
        g.textBaseline = MT.MIDDLE;
        g.fillText(MT.ICON_COIN_MARK, 0, s * 0.02);
        break;
      case MT.ICON_HOUSE:
        P([
          [-0.38, -0.05],
          [0, -0.4],
          [0.38, -0.05],
        ]);
        R(-0.3, -0.05, 0.6, 0.42);
        break;
      case MT.ICON_SACK:
        P([
          [-0.25, -0.3],
          [0.25, -0.3],
          [0.38, 0.3],
          [-0.38, 0.3],
        ]);
        R(-0.1, -0.42, 0.2, 0.14, 0.04);
        break;
      case MT.ICON_TRUCK:
        R(-0.45, -0.25, 0.55, 0.4, 0.04);
        R(0.12, -0.12, 0.33, 0.27, 0.06);
        O(-0.28, 0.22, 0.1);
        O(0.25, 0.22, 0.1);
        break;
      case MT.ICON_GUN:
        R(-0.45, -0.06, 0.8, 0.1, 0.02);
        R(-0.45, -0.04, 0.25, 0.22, 0.04);
        R(0.05, 0.02, 0.08, 0.16, 0.02);
        break;
      case MT.ICON_GEAR:
        for (let i = 0; i < 8; i++) {
          g.save();
          g.rotate((i * PI) / 4);
          R(-0.06, -0.42, 0.12, 0.16, 0.02);
          g.restore();
        }
        O(0, 0, 0.3);
        g.fillStyle = MT.GEO_OUTLINE;
        g.beginPath();
        g.arc(0, 0, 0.1 * s, 0, PI * 2);
        g.fill();
        break;
      default:
        R(-0.28, -0.4, 0.56, 0.8, 0.12);
        g.strokeStyle = MT.GEO_OUTLINE;
        for (const y of [-0.18, 0.18]) {
          g.beginPath();
          g.moveTo(-0.28 * s, y * s);
          g.lineTo(0.28 * s, y * s);
          g.stroke();
        }
    }
  };
  ME.registerTemplate(MT.ICONS, {
    name: MT.ICONS_NAME,
    category: MT.INFOGRAPHIC,
    description: MT.ICONS_DESC,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, u = ctx.u, un = ctx.unit;
      const gr = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      gr.addColorStop(0, p.bgInner || MT.VALUE_1C2433);
      gr.addColorStop(1, p.bgOuter || MT.VALUE_040609);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      const groups = (Array.isArray(p.groups) && p.groups.length ? p.groups : [{ icon: p.icon, count: p.count, highlight: p.highlight, color: p.color, label: p.label }]).slice(0, 3);
      const top = p.title ? H * 0.2 : H * 0.1, bottom = H * 0.9;
      const rowH = (bottom - top) / groups.length;
      if (p.title) outlinedText(g, String(p.title).toUpperCase(), W / 2, H * 0.1, 56 * un, { alpha: U.clamp(t / 0.6) });
      groups.forEach((gp, gi) => {
        const count = U.clamp(Math.round(+gp.count || 10), 1, 100), hi = isFinite(gp.highlight) ? U.clamp(Math.round(+gp.highlight), 0, count) : count;
        const cols = Math.min(count, U.clamp(Math.round(+p.columns || Math.ceil(Math.sqrt(count * (W / H) * (groups.length > 1 ? 2.2 : 1.4)))), 1, 25));
        const rows = Math.ceil(count / cols);
        const labelW = gp.label && groups.length > 1 ? W * 0.2 : 0;
        const areaW = W * 0.86 - labelW, areaH = rowH * (gp.label && groups.length === 1 ? 0.78 : 0.86);
        const cell = Math.min(areaW / cols, areaH / rows), s = cell * 0.82;
        const x0 = W * 0.07 + labelW + (areaW - cell * cols) / 2, y0 = top + gi * rowH + (rowH - cell * rows) / 2;
        if (gp.label) {
          if (groups.length > 1) outlinedText(g, String(gp.label).toUpperCase(), W * 0.07 + labelW / 2, top + gi * rowH + rowH / 2, 30 * un, { alpha: U.clamp(t / 0.6) });
          else outlinedText(g, String(gp.label).toUpperCase(), W / 2, bottom - 10 * un, 34 * un, { alpha: U.clamp(t / 0.6), color: gp.color || MT.HUD_EDGE });
        }
        const appearEnd = 0.55, fillStart = 0.6;
        for (let i = 0; i < count; i++) {
          const k = U.clamp((u - (0.04 + (appearEnd * i) / count)) / 0.06);
          if (k <= 0) break;
          const lit = i < hi && u > fillStart + (0.3 * i) / Math.max(1, hi);
          const cx = x0 + (i % cols) * cell + cell / 2, cy = y0 + Math.floor(i / cols) * cell + cell / 2;
          g.save();
          g.translate(cx, cy);
          const sc = U.back(k);
          g.scale(sc, sc);
          icon(g, String(gp.icon || MT.ICON_BARREL), s, i < hi && (lit || hi === count) ? gp.color || MT.HUD_EDGE : MT.ICON_DIM);
          g.restore();
        }
        if (isFinite(gp.highlight) && hi < count && gp.note) outlinedText(g, String(gp.note).toUpperCase(), W / 2, y0 + rows * cell + 30 * un, 28 * un, { alpha: U.clamp((u - fillStart) / 0.2) });
      });
      if (p.caption) outlinedText(g, String(p.caption), W / 2, H * 0.95, 26 * un, { alpha: U.clamp((u - 0.3) / 0.2), weight: 600 });
    },
  });
  const para = (g, str, x, y, size, maxW, alpha) => {
    const lines = ME.wrap(g, str, maxW, ME.font(600, size, MT.BODY)).slice(0, MT.VERDICT_MAX_LINES);
    lines.forEach((line, i) => ME.text(g, line, x, y + i * size * 1.3, { size, weight: 600, family: MT.BODY, color: MT.VERDICT_MUTED, align: MT.CENTER, shadow: false, alpha }));
  };
  const toneColor = (tone) => MT.VERDICT_TONES[tone] || MT.VERDICT_TONES[MT.VERDICT_DEFAULT_TONE];
  const paper = (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    gr.addColorStop(0, MT.VERDICT_PAPER_IN);
    gr.addColorStop(1, MT.VERDICT_PAPER_OUT);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  };
  const stamp = (g, str, x, y, size, color, o = {}) => {
    str = String(str || MT.EMPTY).toUpperCase();
    if (!str) return;
    g.save();
    g.translate(x, y);
    g.rotate(((o.angle == null ? MT.VERDICT_ANGLE : o.angle) * PI) / 180);
    g.scale(o.scale || 1, o.scale || 1);
    g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.font = ME.font(900, size, MT.HEAD);
    g.textAlign = MT.CENTER;
    g.textBaseline = MT.MIDDLE;
    const w = g.measureText(str).width + size * 1.1, h = size * 1.55;
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = size * 0.12;
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineWidth = size * 0.05;
    g.strokeRect(-w / 2 + size * 0.16, -h / 2 + size * 0.16, w - size * 0.32, h - size * 0.32);
    g.fillText(str, 0, size * 0.04);
    g.fillStyle = MT.VERDICT_SPECK;
    let seed = U.strHash(str) % 9973;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      g.beginPath();
      g.arc((rnd() - 0.5) * w, (rnd() - 0.5) * h, size * (0.01 + rnd() * 0.035), 0, PI * 2);
      g.fill();
    }
    g.restore();
  };
  ME.registerTemplate(MT.VERDICT, {
    name: MT.VERDICT_NAME,
    category: MT.INFOGRAPHIC,
    description: MT.VERDICT_DESC,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, u = ctx.u, un = ctx.unit, dur = ctx.dur || 4;
      const at = isFinite(p.at) ? U.clamp(+p.at, 0.05, 0.9) : MT.VERDICT_STAMP_AT;
      const since = t - at * dur;
      const shake = since > 0 && since < MT.VERDICT_SHAKE ? (1 - since / MT.VERDICT_SHAKE) * 9 * un : 0;
      g.save();
      if (shake) g.translate(Math.sin(t * 90) * shake, Math.cos(t * 77) * shake);
      paper(g, W, H);
      const intro = U.clamp(t / 0.5);
      if (p.label) tagBox(g, String(p.label).toUpperCase(), W / 2, H * 0.16, 26 * un, { align: MT.CENTER, alpha: intro });
      if (p.title) outlinedText(g, String(p.title).toUpperCase(), W / 2, H * 0.3, 62 * un, { alpha: intro });
      if (p.question) para(g, String(p.question), W / 2, H * 0.41, 30 * un, W * 0.8, U.clamp((t - 0.3) / 0.5));
      const k = U.clamp(since / Math.min(MT.VERDICT_SLAM_MAX, MT.VERDICT_SLAM * dur));
      if (since > 0 && p.verdict) stamp(g, p.verdict, W / 2, H * 0.62, 92 * un, toneColor(p.tone), { scale: 1 + 1.6 * (1 - U.easeOut(k)), alpha: U.clamp(k * 1.4) });
      if (p.note && since > 0.4) para(g, String(p.note), W / 2, H * 0.83, 26 * un, W * 0.8, U.clamp((since - 0.4) / 0.4));
      g.restore();
    },
  });
  ME.registerTemplate(MT.SCOREBOARD, {
    name: MT.SCOREBOARD_NAME,
    category: MT.INFOGRAPHIC,
    description: MT.SCOREBOARD_DESC,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, u = ctx.u, un = ctx.unit;
      paper(g, W, H);
      const rows = (Array.isArray(p.rows) ? p.rows : []).slice(0, 10);
      if (p.title) outlinedText(g, String(p.title).toUpperCase(), W / 2, H * 0.1, 54 * un, { alpha: U.clamp(t / 0.5) });
      if (!rows.length) return;
      const top = H * 0.19, bottom = H * 0.93, rowH = Math.min(H * 0.1, (bottom - top) / rows.length), x0 = W * 0.12, x1 = W * 0.88;
      const fs = Math.min(30 * un, rowH * 0.42);
      rows.forEach((r, i) => {
        const st = 0.06 + (i * 0.7) / rows.length, k = U.clamp((u - st) / 0.06);
        if (k <= 0) return;
        const y = top + rowH * (i + 0.5), hi = p.highlight === i || r.highlight === true;
        g.save();
        g.globalAlpha = U.clamp(k * 1.5);
        g.fillStyle = hi && u > 0.82 ? MT.VERDICT_ROW_HI : MT.VERDICT_ROW_BG;
        g.fillRect(x0 - fs * 0.6, y - rowH * 0.44, x1 - x0 + fs * 1.2, rowH * 0.88);
        ME.text(g, String(i + 1).padStart(2, MT.VERDICT_PAD), x0, y + fs * 0.35, { size: fs, weight: 900, family: MT.HEAD, color: MT.HUD_EDGE, shadow: false });
        ME.text(g, String(r.label || MT.EMPTY).toUpperCase(), x0 + fs * 2, y + fs * 0.35, { size: fs, weight: 800, family: MT.HEAD, color: MT.HUD_TEXT, shadow: false });
        g.restore();
        const sk = U.clamp((u - st - 0.04) / 0.05);
        if (sk > 0 && r.verdict) stamp(g, r.verdict, x1 - W * 0.12, y, fs * 1.05, toneColor(r.tone), { angle: -5, scale: 1 + 0.8 * (1 - U.easeOut(sk)), alpha: sk });
      });
    },
  });
  const hudAt = (list, t) => {
    for (let i = 0; i < list.length; i++) if (t >= list[i].start && t < list[i].end) return i;
    return -1;
  };
  ME.drawHud = (g, list, t, o) => {
    if (!Array.isArray(list) || !list.length) return;
    const i = hudAt(list, t);
    if (i < 0) return;
    const cur = list[i], prev = i > 0 && list[i - 1].end >= cur.start - 0.05 ? list[i - 1] : null;
    const W = o.W, H = o.H, un = o.unit;
    const fadeIn = prev ? 1 : U.clamp((t - cur.start) / MT.HUD_FADE), fadeOut = list[i + 1] && list[i + 1].start <= cur.end + 0.05 ? 1 : U.clamp((cur.end - t) / MT.HUD_FADE);
    const alpha = Math.min(fadeIn, fadeOut);
    const ease = U.smooth(U.clamp((t - cur.start) / MT.HUD_EASE));
    let right = H * 0.05;
    if (Array.isArray(cur.bars) && cur.bars.length) {
      const bars = cur.bars.slice(0, 5), rowH = 30 * un, pw = 300 * un, ph = rowH * bars.length + 24 * un, px = W - pw - W * 0.025, py = H * 0.04;
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = MT.HUD_PANEL;
      g.strokeStyle = MT.HUD_EDGE;
      g.lineWidth = 2.5 * un;
      g.beginPath();
      if (g.roundRect) g.roundRect(px, py, pw, ph, 10 * un);
      else g.rect(px, py, pw, ph);
      g.fill();
      g.stroke();
      bars.forEach((b, j) => {
        const before = prev && Array.isArray(prev.bars) ? (prev.bars.find((x) => x.label === b.label) || {}).value : undefined;
        const val = U.lerp(isFinite(before) ? before : b.value, b.value, ease);
        const y = py + 12 * un + j * rowH;
        ME.text(g, String(b.label || MT.EMPTY).toUpperCase(), px + 14 * un, y + rowH * 0.62, { size: 15 * un, weight: 800, family: MT.HEAD, color: MT.HUD_TEXT, shadow: false });
        const bx = px + 110 * un, bw = pw - 128 * un, bh = rowH * 0.42, by = y + rowH * 0.3;
        g.fillStyle = MT.HUD_BAR_BG;
        g.fillRect(bx, by, bw, bh);
        g.fillStyle = b.color || MT.HUD_BAR_COLORS[j % MT.HUD_BAR_COLORS.length];
        g.fillRect(bx, by, (bw * U.clamp(val, 0, 100)) / 100, bh);
      });
      g.restore();
      right = py + ph + 26 * un;
    }
    if (cur.date) tagBox(g, String(cur.date).toUpperCase(), W - W * 0.025, right + 6 * un, 22 * un, { align: MT.RIGHT, alpha });
    if (cur.counter) tagBox(g, String(cur.counter).toUpperCase(), W * 0.025, H - H * 0.06, 22 * un, { alpha });
    if (cur.label) tagBox(g, String(cur.label).toUpperCase(), W * 0.025, H * 0.06, 22 * un, { alpha });
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
