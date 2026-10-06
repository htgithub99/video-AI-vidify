(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  if (!T) return;
  const K = T.kit;
  const C = ME.color;
  const PI = Math.PI;
  const U = ME.util;
  const TALES = (ME.TALES = ME.TALES || { characters: [], assets: [], envs: [] });
  const IDS = [];
  const NIGHT = MT.VALUE_14203A;
  const INKC = MT.VALUE_2A1C22;
  const reg = (id, name, cat, size, draw, extra) => {
    const ex = Object.assign({}, extra || {});
    ex.tags = [MT.TOON].concat(ex.tags || []);
    T.NEW(id, name, cat, size, draw, ex);
    IDS.push(id);
  };
  const isLine = () => T.style === MT.LINE;
  const nt = (c, o, k) => (o.night ? C.mix(c, NIGHT, k == null ? 0.5 : k) : c);
  const rng = (o, k) => U.rng(((o.seed == null ? 3 : o.seed) + 1) * 7919 + (k || 0) * 104729);
  const F = (g, p, c, d, x) => K.paint(g, p, c, Object.assign({ d: d == null ? 3 : d, lw: 1.5 }, x || {}));
  const R = (g, x, y, w, h, c, d, e) => F(g, K.rect(x, y, w, h), c, d, e);
  const RR = (g, x, y, w, h, r, c, d, e) => F(g, K.rrect(x, y, w, h, r), c, d, e);
  const E = (g, x, y, rx, ry, c, d, e, rot) => F(g, K.ell(x, y, rx, ry, rot || 0), c, d, e);
  const PL = (g, pts, c, d, e, sm) => F(g, K.poly(pts, sm), c, d, e);
  const SK = (g, pts, c, w, ink) => K.stroke(g, pts, c, w, ink);
  const inkLine = (g, p, w) => {
    if (!isLine()) return;
    g.save();
    g.strokeStyle = INKC;
    g.lineWidth = w || 1.6;
    g.lineJoin = MT.ROUND;
    g.stroke(p);
    g.restore();
  };
  const marks = (g, clip, col, lw, segs, a) => {
    g.save();
    if (clip) g.clip(clip);
    g.globalAlpha *= a == null ? 1 : a;
    g.strokeStyle = col;
    g.lineWidth = lw;
    g.lineCap = MT.ROUND;
    g.beginPath();
    for (const s of segs) {
      g.moveTo(s[0], s[1]);
      if (s.length === 6) g.quadraticCurveTo(s[2], s[3], s[4], s[5]);
      else g.lineTo(s[2], s[3]);
    }
    g.stroke();
    g.restore();
  };
  const blocks = (g, clip, x, y, w, h, bh, bw, col, a) => {
    const segs = [];
    let r = 0;
    for (let yy = y; yy < y + h - 1; yy += bh, r++) {
      if (yy > y) segs.push([x, yy, x + w, yy]);
      for (let xx = x + (r % 2 ? bw / 2 : 0) + bw * 0.01; xx < x + w; xx += bw) segs.push([xx, yy, xx, Math.min(y + h, yy + bh)]);
    }
    marks(g, clip, col, 1.3, segs, a == null ? 0.35 : a);
  };
  const planks = (g, clip, x, y, w, h, step, col, vert, a) => {
    const segs = [];
    if (vert) for (let xx = x + step; xx < x + w; xx += step) segs.push([xx, y, xx, y + h]);
    else for (let yy = y + step; yy < y + h; yy += step) segs.push([x, yy, x + w, yy]);
    marks(g, clip, col, 1.3, segs, a == null ? 0.4 : a);
  };
  const shadow = (g, w, h, a, x) => {
    g.save();
    g.fillStyle = MT.RGBA_0_0_0_2 + (a == null ? 0.25 : a) + MT.SYMBOL_17;
    g.beginPath();
    g.ellipse(x || 0, -2, w, h || 10, 0, 0, PI * 2);
    g.fill();
    g.restore();
  };
  const glowAt = (g, x, y, r, col, a) => K.glowDisc(g, x, y, r, col, a);
  const spin = (o, r) => (o.distance != null ? o.distance : (o.t || 0) * (o.speed || 0)) / r;
  const gait = (o) => (o.distance != null ? o.distance : (o.t || 0) * (o.speed || 0)) / 34;
  const archP = (x, y, w, h) => {
    const p = K.P();
    p.moveTo(x, y + h);
    p.lineTo(x, y + w / 2);
    p.arc(x + w / 2, y + w / 2, w / 2, PI, 0);
    p.lineTo(x + w, y + h);
    p.closePath();
    return p;
  };
  const gothP = (x, y, w, h) => {
    const p = K.P();
    p.moveTo(x, y + h);
    p.lineTo(x, y + w * 0.75);
    p.quadraticCurveTo(x + w * 0.04, y + w * 0.12, x + w / 2, y);
    p.quadraticCurveTo(x + w * 0.96, y + w * 0.12, x + w, y + w * 0.75);
    p.lineTo(x + w, y + h);
    p.closePath();
    return p;
  };
  const shine = (g, x, y, w, h) => {
    g.save();
    g.globalAlpha = 0.22;
    g.fillStyle = MT.FFFFFF;
    g.beginPath();
    g.moveTo(x + w * 0.15, y + h * 0.9);
    g.lineTo(x + w * 0.45, y + h * 0.1);
    g.lineTo(x + w * 0.62, y + h * 0.1);
    g.lineTo(x + w * 0.32, y + h * 0.9);
    g.fill();
    g.restore();
  };
  const LIT = MT.FFD889;
  const LITGLOW = MT.RGBA_255_200_110_0_75;
  const glassC = (o, lit) => (lit ? LIT : o.night ? MT.VALUE_2A3452 : MT.VALUE_7FA6C4);
  const win = (g, x, y, w, h, o, lit, opt) => {
    opt = opt || {};
    const fr = opt.frame || MT.EFE6D6;
    const shp = (ix) => (opt.arch === MT.POINT ? gothP(x + ix, y + ix, w - ix * 2, h - ix * 2) : opt.arch ? archP(x + ix, y + ix, w - ix * 2, h - ix * 2) : K.rrect(x + ix, y + ix, w - ix * 2, h - ix * 2, 2));
    if (opt.sill !== false) R(g, x - 5, y + h - 2, w + 10, 7, opt.sillC || fr, 1, { lw: 1.2 });
    F(g, shp(0), fr, 0, { lw: 1.4 });
    const gp = shp(opt.inset || 4);
    F(g, gp, opt.dark || glassC(o, lit), 0, { lw: 1.2, glow: lit ? LITGLOW : null, glowR: 20 });
    if (!lit && !o.night && !opt.dark) {
      g.save();
      g.clip(gp);
      shine(g, x, y, w, h);
      g.restore();
    }
    if (lit && opt.curtain) {
      g.save();
      g.clip(gp);
      g.fillStyle = C.rgba(opt.curtain, 0.55);
      g.fillRect(x, y, w * 0.28, h);
      g.fillRect(x + w * 0.72, y, w * 0.28, h);
      g.restore();
    }
    if (opt.broken) {
      const r = opt.broken;
      const cx = x + w * (0.3 + r() * 0.4),
        cy = y + h * (0.3 + r() * 0.4);
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2;
        const rr = (0.12 + r() * 0.22) * Math.min(w, h);
        pts.push([cx + Math.cos(a) * rr * 1.2, cy + Math.sin(a) * rr]);
      }
      g.save();
      g.clip(gp);
      F(g, K.poly(pts), MT.VALUE_0E1018, 0, { lw: 1 });
      g.restore();
    }
    if (opt.cross !== false) {
      const mc = opt.mullion || fr;
      SK(
        g,
        [
          [x + w / 2, y + 4],
          [x + w / 2, y + h - 3],
        ],
        mc,
        2.2,
        false,
      );
      SK(
        g,
        [
          [x + 4, y + h * 0.48],
          [x + w - 4, y + h * 0.48],
        ],
        mc,
        2.2,
        false,
      );
    }
    if (opt.board) {
      const bc = opt.board;
      const b1 = K.P();
      b1.moveTo(x - 6, y + h * 0.18);
      b1.lineTo(x + w + 6, y + h * 0.42);
      b1.lineTo(x + w + 6, y + h * 0.42 + 14);
      b1.lineTo(x - 6, y + h * 0.18 + 14);
      b1.closePath();
      F(g, b1, bc, 1.5, { lw: 1.2 });
      const b2 = K.P();
      b2.moveTo(x - 6, y + h * 0.7);
      b2.lineTo(x + w + 6, y + h * 0.56);
      b2.lineTo(x + w + 6, y + h * 0.56 + 14);
      b2.lineTo(x - 6, y + h * 0.7 + 14);
      b2.closePath();
      F(g, b2, C.shade(bc, -0.08), 1.5, { lw: 1.2 });
      for (const [nx, ny] of [
        [x, y + h * 0.18 + 7],
        [x + w, y + h * 0.42 + 7],
        [x, y + h * 0.7 + 7],
        [x + w, y + h * 0.56 + 7],
      ])
        E(g, nx, ny, 1.6, 1.6, MT.VALUE_3A3036, 0, { ink: false });
    }
  };
  const shutter = (g, x, y, w, h, col, tilt) => {
    g.save();
    g.translate(x + (tilt > 0 ? 0 : w), y);
    g.rotate(tilt || 0);
    const sx = tilt > 0 ? 0 : -w;
    R(g, sx, 0, w, h, col, 2, { lw: 1.3 });
    const segs = [];
    for (let k = 1; k < 7; k++) segs.push([sx + 3, (k * h) / 7, sx + w - 3, (k * h) / 7]);
    marks(g, null, C.shade(col, -0.3), 1.3, segs, 0.8);
    g.restore();
  };
  const limb = (g, pts, w0, w1, col, d, x) => {
    const n = pts.length;
    const L = [],
      Rr = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0],
        dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
      L.push([pts[i][0] - (dy / l) * w, pts[i][1] + (dx / l) * w]);
      Rr.push([pts[i][0] + (dy / l) * w, pts[i][1] - (dx / l) * w]);
    }
    const p = K.P();
    const all = L.concat(Rr.reverse());
    p.moveTo(all[0][0], all[0][1]);
    for (let i = 1; i < all.length; i++) p.lineTo(all[i][0], all[i][1]);
    p.closePath();
    F(g, p, col, d == null ? 1.5 : d, Object.assign({ lw: 1.3 }, x || {}));
    return p;
  };
  const curve = (pts, n) => {
    const out = [];
    const m = pts.length - 1;
    n = n || 8;
    for (let s = 0; s < m; s++)
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const p0 = pts[Math.max(0, s - 1)],
          p1 = pts[s],
          p2 = pts[s + 1],
          p3 = pts[Math.min(m, s + 2)];
        const t2 = t * t,
          t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    out.push(pts[m]);
    return out;
  };
  const tube = (g, pts, w0, w1, col, d, x) => limb(g, curve(pts, 6), w0, w1, col, d, x);
  const leg = (g, hx, hy, len, a, b, w, col, hoof) => {
    const kx = hx + Math.sin(a) * len * 0.5,
      ky = hy + Math.cos(a) * len * 0.5;
    const fx = kx + Math.sin(a - b) * len * 0.5,
      fy = Math.min(0, ky + Math.cos(a - b) * len * 0.5);
    limb(
      g,
      [
        [hx, hy - 6],
        [kx, ky],
        [fx, fy - 6],
      ],
      w * 1.5,
      w * 0.75,
      col,
      1.5,
    );
    E(g, kx, ky, w * 0.5, w * 0.5, col, 0, { ink: false });
    RR(g, fx - w * 0.5, fy - 10, w * 1.05, 11, [3, 3, 2, 2], hoof, 0, { lw: 1.1 });
  };
  const horse = (g, x, o, col, s) => {
    g.save();
    g.translate(x, 0);
    g.scale(s || 1, s || 1);
    const c = nt(col || MT.VALUE_9A5F38, o, 0.45),
      far = C.shade(c, -0.22),
      mane = nt(MT.VALUE_33221A, o, 0.35),
      hoof = MT.VALUE_2A2224;
    const ph = gait(o);
    const lg = (hx, off, cc) => {
      const sn = Math.sin(ph + off);
      leg(g, hx, -122, 124, 0.3 * sn, Math.max(0, Math.cos(ph + off)) * 0.8, 13, cc, hoof);
    };
    lg(-62, PI, far);
    lg(48, 0, far);
    const sw = Math.sin((o.t || 0) * 3) * 6;
    tube(
      g,
      [
        [-84, -150],
        [-108, -128],
        [-112 + sw * 0.3, -96],
        [-104 + sw, -64],
      ],
      18,
      7,
      mane,
      1,
    );
    const body = K.poly(
      [
        [-92, -152],
        [-60, -170],
        [0, -164],
        [52, -172],
        [84, -150],
        [86, -120],
        [54, -100],
        [0, -102],
        [-60, -98],
        [-94, -120],
      ],
      true,
    );
    F(g, body, c, 6, { lw: 1.6 });
    F(
      g,
      K.poly(
        [
          [42, -164],
          [76, -222],
          [100, -240],
          [118, -226],
          [104, -186],
          [88, -128],
        ],
        true,
      ),
      c,
      3,
      { lw: 1.6 },
    );
    F(
      g,
      K.poly(
        [
          [98, -240],
          [114, -246],
          [156, -204],
          [154, -188],
          [138, -182],
          [104, -208],
        ],
        true,
      ),
      c,
      3,
      { lw: 1.6 },
    );
    PL(
      g,
      [
        [100, -238],
        [104, -262],
        [114, -240],
      ],
      c,
      1,
      { lw: 1.3 },
    );
    tube(
      g,
      [
        [110, -246],
        [92, -226],
        [70, -196],
        [46, -164],
      ],
      15,
      9,
      mane,
      1,
    );
    E(g, 124, -222, 3.4, 3.4, MT.VALUE_1A1416, 0, { ink: false });
    E(g, 150, -194, 2.4, 2, C.shade(c, -0.5), 0, { ink: false });
    SK(
      g,
      [
        [-30, -150],
        [-2, -158],
      ],
      C.mix(c, MT.FFFFFF, 0.25),
      4,
      false,
    );
    lg(-46, PI + 1.6, c);
    lg(64, 1.6, c);
    g.restore();
  };
  const ox = (g, x, o, col, s) => {
    g.save();
    g.translate(x, 0);
    g.scale(s || 1, s || 1);
    const c = nt(col || MT.VALUE_4D4A48, o, 0.4),
      far = C.shade(c, -0.25),
      horn = nt(MT.D8CFB8, o, 0.4),
      hoof = MT.VALUE_222;
    const ph = gait(o) * 0.8;
    const lg = (hx, off, cc) => leg(g, hx, -96, 96, 0.22 * Math.sin(ph + off), Math.max(0, Math.cos(ph + off)) * 0.5, 17, cc, hoof);
    lg(-70, PI, far);
    lg(52, 0, far);
    const sw = Math.sin((o.t || 0) * 2.4) * 5;
    tube(
      g,
      [
        [-100, -122],
        [-114, -96],
        [-110 + sw, -60],
      ],
      6,
      4,
      c,
      0.5,
    );
    E(g, -110 + sw, -56, 5, 9, C.shade(c, -0.4), 0, { lw: 1 });
    F(
      g,
      K.poly(
        [
          [-104, -128],
          [-60, -154],
          [20, -156],
          [84, -146],
          [104, -112],
          [86, -78],
          [10, -70],
          [-70, -74],
          [-108, -98],
        ],
        true,
      ),
      c,
      7,
      { lw: 1.6 },
    );
    F(
      g,
      K.poly(
        [
          [70, -146],
          [112, -136],
          [150, -112],
          [164, -88],
          [150, -74],
          [122, -80],
          [82, -94],
        ],
        true,
      ),
      c,
      3,
      { lw: 1.6 },
    );
    E(g, 156, -84, 12, 10, C.mix(c, MT.B8A89A, 0.5), 1, { lw: 1.2 });
    F(
      g,
      K.poly(
        [
          [114, -128],
          [104, -154],
          [82, -174],
          [52, -182],
          [70, -164],
          [88, -146],
          [124, -122],
        ],
        true,
      ),
      horn,
      2,
      { lw: 1.4 },
    );
    E(g, 108, -118, 12, 6, C.shade(c, -0.15), 1, { lw: 1.2 }, -0.4);
    E(g, 128, -110, 3, 3, MT.VALUE_121012, 0, { ink: false });
    lg(-54, PI + 1.5, c);
    lg(68, 1.5, c);
    g.restore();
  };
  const wwheel = (g, x, y, r, rot, col, n, hub) => {
    const sp = C.shade(col, -0.12);
    for (let i = 0; i < (n || 10); i++) {
      const a = rot + (i * PI * 2) / (n || 10);
      SK(
        g,
        [
          [x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16],
          [x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84],
        ],
        isLine() ? C.shade(col, -0.45) : sp,
        Math.max(2.5, r * 0.085),
        false,
      );
    }
    const rim = K.P();
    rim.arc(x, y, r, 0, PI * 2);
    rim.arc(x, y, r * 0.82, 0, PI * 2, true);
    F(g, rim, col, r * 0.06, { lw: 1.5 });
    const tire = K.P();
    tire.arc(x, y, r, 0, PI * 2);
    tire.arc(x, y, r * 0.93, 0, PI * 2, true);
    F(g, tire, C.shade(col, -0.45), 0, { ink: false });
    E(g, x, y, r * 0.2, r * 0.2, hub || C.shade(col, -0.25), r * 0.04, { lw: 1.3 });
    E(g, x, y, r * 0.07, r * 0.07, MT.VALUE_2A2426, 0, { ink: false });
  };
  const twheel = (g, x, y, r, rot, rim, n) => {
    E(g, x, y, r, r, MT.VALUE_1E2026, r * 0.15, { lw: 1.6 });
    E(g, x, y, r * 0.6, r * 0.6, rim || MT.CFD5DC, r * 0.1, { lw: 1.3 });
    for (let i = 0; i < (n || 6); i++) {
      const a = rot + (i * PI * 2) / (n || 6);
      SK(
        g,
        [
          [x, y],
          [x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55],
        ],
        MT.VALUE_7A828C,
        2,
        false,
      );
    }
    E(g, x, y, r * 0.2, r * 0.2, MT.VALUE_8A929C, 0, { lw: 1.1 });
  };
  const headlight = (x, y, ang) => (o) =>
    o.night || o.lights
      ? [
          { type: MT.BEAM, x, y, angle: ang || 0.06, len: 520, spread: 0.16, color: MT.FFF2C8, alpha: 0.35 },
          { type: MT.GLOW, x, y, r: 28, color: MT.FFF2C8, alpha: 0.9 },
        ]
      : [];
  const lamp = (g, x, y, o, r) => {
    const on = o.night || o.lights;
    E(g, x, y, r || 9, r || 9, on ? MT.FFF3C4 : MT.F0E6C8, 0, { lw: 1.2, glow: on ? MT.RGBA_255_240_190_1 : null });
  };
  const curvedRoof = (cx, yt, wt, yb, wb, lift, th) => {
    const p = K.P();
    const xr = cx + wb / 2,
      xl = cx - wb / 2;
    p.moveTo(cx - wt / 2, yt);
    p.lineTo(cx + wt / 2, yt);
    p.quadraticCurveTo(cx + wt / 2 + (wb - wt) * 0.25, yb - th * 0.2, xr + lift * 0.5, yb - lift);
    p.quadraticCurveTo(xr - th * 0.2, yb + th * 0.2, xr - th * 1.8, yb + th);
    p.lineTo(xl + th * 1.8, yb + th);
    p.quadraticCurveTo(xl + th * 0.2, yb + th * 0.2, xl - lift * 0.5, yb - lift);
    p.quadraticCurveTo(cx - wt / 2 - (wb - wt) * 0.25, yb - th * 0.2, cx - wt / 2, yt);
    p.closePath();
    return p;
  };
  const tiles = (g, p, x0, x1, yt, yb, step, col, a) => {
    const segs = [];
    for (let xx = x0; xx <= x1; xx += step) segs.push([xx, yt, xx + (xx - (x0 + x1) / 2) * 0.12, yb + 20]);
    marks(g, p, col, Math.max(1.4, step * 0.18), segs, a == null ? 0.45 : a);
  };
  const tileEdge = (g, x0, x1, y, step, col) => {
    for (let xx = x0; xx <= x1; xx += step) E(g, xx, y, step * 0.32, step * 0.32, col, 0, { lw: 1 });
  };
  const roofDo = (g, p, col, o2) => {
    F(g, p, col, 8, { lw: 1.8, sy: -1 });
    if (o2) tiles(g, p, o2[0], o2[1], o2[2], o2[3], o2[4], C.shade(col, -0.35), o2[5]);
  };
  const curl = (g, x, y, s, dir, col) => {
    g.save();
    g.translate(x, y);
    g.scale(s * dir, s);
    F(
      g,
      K.poly(
        [
          [0, 6],
          [-4, -4],
          [2, -18],
          [14, -30],
          [26, -34],
          [32, -26],
          [24, -22],
          [16, -24],
          [10, -16],
          [12, -8],
          [20, -6],
          [14, 4],
        ],
        true,
      ),
      col,
      2,
      { lw: 1.3 },
    );
    g.restore();
  };
  const smoke = (g, x, y, o, n, spread, rise, col) => {
    const t = o.t || 0;
    g.save();
    for (let i = 0; i < n; i++) {
      const a = (t * 0.55 + i / n) % 1;
      g.globalAlpha = Math.max(0, (1 - a) * 0.75 * Math.min(1, a * 6));
      const r = 16 + a * 46;
      F(g, K.ell(x - a * spread + Math.sin(i * 2.1 + t) * 8, y - a * rise, r, r * 0.82), col, r * 0.15, { lw: 1.2 });
    }
    g.restore();
  };
  reg(
    MT.CHARIOT,
    MT.CHIEN_XA_NGUA_KEO,
    MT.VEHICLE,
    [420, 270],
    (g, o) => {
      shadow(g, 210, 10);
      const col = nt(o.color || MT.B8322A, o, 0.4),
        gold = nt(MT.E2B544, o, 0.4),
        wood = nt(MT.VALUE_7A5232, o, 0.45);
      tube(
        g,
        [
          [-80, -70],
          [-10, -82],
          [60, -116],
          [96, -150],
        ],
        9,
        7,
        wood,
        1,
      );
      horse(g, 50, o, MT.ECE2D2);
      PL(
        g,
        [
          [86, -170],
          [98, -160],
          [118, -120],
          [108, -116],
          [92, -152],
          [80, -160],
        ],
        nt(MT.VALUE_7A2A22, o, 0.4),
        1,
        { lw: 1.2 },
      );
      E(g, 94, -164, 9, 6, gold, 1, { lw: 1.2 });
      const body = K.P();
      body.moveTo(-196, -74);
      body.lineTo(-194, -120);
      body.quadraticCurveTo(-170, -126, -140, -132);
      body.quadraticCurveTo(-104, -140, -88, -168);
      body.quadraticCurveTo(-72, -170, -70, -150);
      body.quadraticCurveTo(-72, -100, -78, -74);
      body.closePath();
      F(g, body, col, 7, { lw: 1.7 });
      SK(
        g,
        [
          [-194, -120],
          [-170, -126, -140, -132],
          [-104, -140, -88, -168],
        ],
        gold,
        5,
        false,
      );
      E(g, -124, -104, 15, 15, gold, 2, { lw: 1.3 });
      E(g, -124, -104, 7, 7, C.shade(gold, -0.25), 0, { lw: 1 });
      for (let i = 0; i < 8; i++) {
        const a = (i * PI) / 4;
        SK(
          g,
          [
            [-124 + Math.cos(a) * 17, -104 + Math.sin(a) * 17],
            [-124 + Math.cos(a) * 25, -104 + Math.sin(a) * 25],
          ],
          gold,
          3,
          false,
        );
      }
      RR(g, -204, -80, 140, 12, 3, wood, 2, { lw: 1.3 });
      wwheel(g, -136, -56, 56, spin(o, 56), nt(MT.VALUE_8A5A34, o, 0.45), 8, gold);
    },
    { tags: [MT.XE, MT.CHIEN_XA, MT.XE_NGUA, MT.LA_MA_2, MT.AI_CAP_2, MT.CO_DAI], seat: { driver: [-136, -164] } },
  );
  reg(
    MT.OX_CART,
    MT.XE_TRAU_BO_KEO,
    MT.VEHICLE,
    [560, 240],
    (g, o) => {
      shadow(g, 270, 10);
      const wood = nt(o.color || MT.VALUE_8A6038, o, 0.45),
        dk = C.shade(wood, -0.28),
        straw = nt(MT.C8A052, o, 0.45);
      tube(
        g,
        [
          [-40, -116],
          [60, -122],
          [140, -136],
          [204, -148],
        ],
        9,
        7,
        dk,
        1,
      );
      ox(g, 120, o);
      PL(
        g,
        [
          [200, -166],
          [214, -168],
          [222, -120],
          [210, -120],
        ],
        dk,
        1,
        { lw: 1.2 },
      );
      const hood = K.P();
      hood.moveTo(-268, -168);
      hood.bezierCurveTo(-268, -250, -110, -250, -110, -168);
      hood.closePath();
      F(g, hood, straw, 8, { lw: 1.6 });
      const hs = [];
      for (let k = 1; k < 7; k++) {
        const xx = -268 + k * 22.6;
        hs.push([xx, -168, xx, -240]);
      }
      marks(g, hood, C.shade(straw, -0.3), 1.6, hs, 0.55);
      marks(
        g,
        hood,
        C.shade(straw, -0.3),
        1.2,
        [
          [-270, -196, -108, -196],
          [-270, -222, -108, -222],
        ],
        0.35,
      );
      R(g, -276, -128, 256, 18, wood, 3, { lw: 1.5 });
      for (let i = 0; i <= 8; i++) R(g, -272 + i * 30, -172, 7, 44, dk, 1, { lw: 1.1 });
      R(g, -276, -176, 256, 9, wood, 2, { lw: 1.3 });
      R(g, -276, -150, 256, 6, C.shade(wood, -0.1), 0, { lw: 1 });
      wwheel(g, -150, -66, 66, spin(o, 66), nt(MT.VALUE_7A5230, o, 0.45), 12);
    },
    { tags: [MT.XE, MT.XE_TRAU, MT.XE_BO, MT.LANG_QUE, MT.NONG_THON, MT.VIET_NAM_2], seat: { driver: [-46, -150], passenger: [-150, -150] } },
  );
  reg(
    MT.RICKSHAW,
    MT.XE_KEO_TAY,
    MT.VEHICLE,
    [320, 260],
    (g, o) => {
      shadow(g, 150, 9);
      const lac = nt(o.color || MT.VALUE_2A2426, o, 0.3),
        red = nt(MT.B8322A, o, 0.4),
        brass = nt(MT.D8B04A, o, 0.4),
        wood = nt(MT.VALUE_8A5A34, o, 0.45);
      tube(
        g,
        [
          [-30, -102],
          [60, -100],
          [150, -94],
        ],
        8,
        6,
        wood,
        1,
      );
      R(g, 144, -110, 8, 30, wood, 1, { lw: 1.1 });
      const hood = K.P();
      hood.moveTo(-136, -146);
      hood.lineTo(-142, -206);
      hood.bezierCurveTo(-140, -252, -70, -266, -14, -236);
      hood.lineTo(-24, -222);
      hood.bezierCurveTo(-70, -238, -108, -214, -112, -146);
      hood.closePath();
      F(g, hood, lac, 7, { lw: 1.6 });
      marks(
        g,
        hood,
        C.shade(lac, 0.3),
        1.6,
        [
          [-120, -150, -136, -236],
          [-120, -150, -96, -254],
          [-120, -150, -50, -250],
        ],
        0.5,
      );
      const back = K.P();
      back.moveTo(-124, -100);
      back.lineTo(-130, -190);
      back.quadraticCurveTo(-110, -200, -92, -186);
      back.lineTo(-86, -140);
      back.lineTo(-20, -136);
      back.quadraticCurveTo(-6, -120, -14, -96);
      back.closePath();
      F(g, back, lac, 6, { lw: 1.6 });
      RR(g, -100, -150, 84, 16, 6, red, 2, { lw: 1.3 });
      RR(g, -122, -186, 26, 46, 6, red, 2, { lw: 1.3 });
      SK(
        g,
        [
          [-128, -112],
          [-20, -110],
        ],
        brass,
        3,
        false,
      );
      const fb = K.P();
      fb.moveTo(-18, -100);
      fb.lineTo(20, -48);
      fb.lineTo(62, -48);
      fb.lineTo(62, -40);
      fb.lineTo(14, -40);
      fb.lineTo(-26, -92);
      fb.closePath();
      F(g, fb, lac, 2, { lw: 1.3 });
      const mg = K.P();
      mg.moveTo(-132, -64);
      mg.arc(-62, -62, 70, PI, PI * 1.62);
      mg.lineTo(-30, -114);
      mg.arc(-62, -62, 62, PI * 1.62, PI, true);
      mg.closePath();
      F(g, mg, lac, 2, { lw: 1.2 });
      wwheel(g, -62, -60, 60, spin(o, 60), nt(MT.VALUE_3A3034, o, 0.3), 14, brass);
      const on = o.night || o.lights;
      RR(g, -24, -170, 12, 20, 3, on ? MT.FFD889 : brass, 0, { lw: 1.1, glow: on ? LITGLOW : null });
    },
    {
      tags: [MT.XE, MT.XE_KEO, MT.XE_TAY, MT.CHAU_A, MT.XUA],
      seat: { driver: [152, -94], puller: [152, -94], passenger: [-66, -138] },
      lights: (o) => (o.night || o.lights ? [{ type: MT.GLOW, x: -18, y: -160, r: 40, color: MT.FFD889, alpha: 0.7 }] : []),
    },
  );
  reg(
    MT.PALANQUIN,
    MT.KIEU_HOANG_GIA,
    MT.VEHICLE,
    [480, 340],
    (g, o) => {
      const red = nt(o.color || MT.B02A22, o, 0.4),
        gold = nt(MT.E2B544, o, 0.4),
        dk = C.shade(red, -0.3),
        pole = nt(MT.VALUE_6A3A22, o, 0.4);
      RR(g, -240, -158, 480, 12, 6, C.shade(pole, -0.2), 1, { lw: 1.3 });
      R(g, -104, -126, 208, 16, gold, 2, { lw: 1.3 });
      R(g, -92, -266, 184, 142, red, 8, { lw: 1.7 });
      for (const px of [-92, 80]) R(g, px, -266, 12, 142, gold, 1, { lw: 1.2 });
      const lit = !!o.night;
      const wp = K.rrect(-56, -240, 112, 84, [40, 40, 3, 3]);
      F(g, wp, gold, 0, { lw: 1.3 });
      F(g, K.rrect(-50, -234, 100, 76, [36, 36, 2, 2]), lit ? LIT : MT.VALUE_3A1A18, 0, { lw: 1.1, glow: lit ? LITGLOW : null });
      const cur = nt(MT.E8C04A, o, 0.4);
      g.save();
      g.clip(K.rrect(-50, -234, 100, 76, [36, 36, 2, 2]));
      F(
        g,
        K.poly(
          [
            [-52, -236],
            [-14, -236],
            [-22, -200],
            [-40, -184],
            [-52, -150],
          ],
          true,
        ),
        cur,
        2,
        { lw: 1.1 },
      );
      F(
        g,
        K.poly(
          [
            [52, -236],
            [14, -236],
            [22, -200],
            [40, -184],
            [52, -150],
          ],
          true,
        ),
        cur,
        2,
        { lw: 1.1 },
      );
      g.restore();
      SK(
        g,
        [
          [-50, -231],
          [50, -231],
        ],
        gold,
        4,
        false,
      );
      R(g, -96, -146, 192, 10, gold, 1, { lw: 1.1 });
      for (let i = 0; i < 9; i++) E(g, -80 + i * 20, -141, 3.5, 3.5, red, 0, { ink: false });
      const roof = curvedRoof(0, -312, 70, -268, 250, 22, 12);
      roofDo(g, roof, nt(MT.C8302A, o, 0.4), [-120, 120, -312, -268, 14, 0.35]);
      SK(
        g,
        [
          [-118, -258],
          [118, -258],
        ],
        gold,
        4,
        false,
      );
      curl(g, 124, -276, 0.8, 1, gold);
      curl(g, -124, -276, 0.8, -1, gold);
      E(g, 0, -322, 14, 14, gold, 2, { lw: 1.3 });
      PL(
        g,
        [
          [-6, -334],
          [0, -352],
          [6, -334],
        ],
        gold,
        1,
        { lw: 1.1 },
      );
      for (const tx of [-108, 108]) {
        SK(
          g,
          [
            [tx, -262],
            [tx, -230],
          ],
          gold,
          2,
          false,
        );
        E(g, tx, -224, 5, 8, nt(MT.D83A2A, o, 0.4), 0, { lw: 1 });
      }
      RR(g, -236, -150, 472, 12, 6, pole, 2, { lw: 1.4 });
      for (const ex of [-236, 224]) RR(g, ex, -152, 12, 16, 4, gold, 0, { lw: 1.1 });
    },
    {
      tags: [MT.KIEU, MT.VUA, MT.HOANG_GIA, MT.CUNG_DINH, MT.VIET_NAM_2, MT.CHAU_A],
      seat: { passenger: [0, -140], driver: [206, -92], front: [206, -92], back: [-206, -92] },
      lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -196, r: 90, color: MT.FFD889, alpha: 0.45 }] : []),
    },
  );
  reg(
    MT.STEAM_LOCOMOTIVE,
    MT.DAU_MAY_XE_LUA_HOI_NUOC,
    MT.VEHICLE,
    [720, 360],
    (g, o) => {
      shadow(g, 340, 11);
      const blk = nt(o.color || MT.VALUE_2C2F36, o, 0.3),
        red = nt(MT.B8322A, o, 0.35),
        brass = nt(MT.D8B04A, o, 0.35),
        cab = nt(MT.VALUE_3A4A3E, o, 0.3);
      smoke(g, 220, -350, o, 6, 300, 120, o.night ? MT.VALUE_7A808C : MT.ECEBE6);
      const rot = spin(o, 62);
      R(g, -306, -112, 590, 16, red, 2, { lw: 1.5 });
      const cc = K.P();
      cc.moveTo(256, -100);
      cc.lineTo(346, -6);
      cc.lineTo(250, -6);
      cc.closePath();
      F(g, cc, red, 3, { lw: 1.5 });
      marks(
        g,
        cc,
        C.shade(red, -0.4),
        2.2,
        [
          [270, -90, 266, -6],
          [290, -72, 290, -6],
          [310, -52, 312, -6],
          [330, -30, 332, -6],
        ],
        0.8,
      );
      R(g, -320, -284, 144, 176, cab, 6, { lw: 1.7 });
      RR(g, -334, -298, 172, 16, 4, blk, 2, { lw: 1.5 });
      const cl = !!o.night;
      F(g, K.rrect(-298, -260, 70, 62, [24, 24, 3, 3]), MT.E8DCC0, 0, { lw: 1.3 });
      F(g, K.rrect(-292, -254, 58, 52, [20, 20, 2, 2]), cl ? MT.FFB85A : o.night ? MT.VALUE_2A3452 : MT.VALUE_7FA6C4, 0, { lw: 1.1, glow: cl ? MT.RGBA_255_160_70_0_8 : null });
      R(g, -320, -186, 144, 8, brass, 0, { lw: 1 });
      const boiler = K.rrect(-180, -246, 384, 112, [10, 4, 4, 10]);
      F(g, boiler, blk, 12, { lw: 1.8, sy: -1 });
      g.save();
      g.clip(boiler);
      g.globalAlpha = 0.18;
      g.fillStyle = MT.FFFFFF;
      g.fillRect(-180, -232, 384, 12);
      g.restore();
      for (const bx of [-110, -20, 70, 150]) R(g, bx, -246, 7, 112, brass, 0, { lw: 1 });
      R(g, 198, -252, 56, 124, C.shade(blk, -0.15), 4, { lw: 1.6 });
      E(g, 254, -190, 8, 56, C.shade(blk, 0.1), 0, { lw: 1.3 });
      E(g, -70, -250, 22, 18, blk, 3, { lw: 1.4 });
      E(g, 30, -254, 26, 24, brass, 4, { lw: 1.4 });
      R(g, 4, -256, 52, 10, brass, 0, { lw: 1.1 });
      PL(
        g,
        [
          [212, -252],
          [236, -252],
          [256, -334],
          [192, -334],
        ],
        blk,
        5,
        { lw: 1.6 },
      );
      RR(g, 184, -346, 80, 14, 4, C.shade(blk, 0.15), 2, { lw: 1.4 });
      R(g, 226, -300, 46, 38, blk, 3, { lw: 1.4 });
      E(g, 274, -281, 7, 14, MT.CFD5DC, 0, { lw: 1.1 });
      lamp(g, 276, -281, o, 9);
      E(g, 150, -260, 9, 11, brass, 2, { lw: 1.2 });
      R(g, 146, -280, 8, 14, blk, 0, { lw: 1 });
      R(g, 160, -156, 92, 46, C.shade(blk, 0.05), 5, { lw: 1.5 });
      for (const [wx, r] of [
        [146, 30],
        [222, 30],
      ])
        twheel(g, wx, -r, r, spin(o, r), MT.B8322A, 8);
      const pin = (x) => [x + Math.cos(rot) * 24, -62 + Math.sin(rot) * 24];
      for (const wx of [-120, 24]) {
        wwheel(g, wx, -62, 62, rot, red, 14, C.shade(red, -0.2));
        F(g, K.ell(wx + Math.cos(rot + PI) * 30, -62 + Math.sin(rot + PI) * 30, 18, 12, rot), C.shade(red, -0.25), 0, { lw: 1.1 });
      }
      const p1 = pin(-120),
        p2 = pin(24);
      SK(g, [p1, p2], MT.A8B0B8, 9, false);
      const xh = [196 + Math.cos(rot) * 18, -134];
      SK(g, [xh, p2], MT.VALUE_8A929C, 8, false);
      for (const pp of [p1, p2]) E(g, pp[0], pp[1], 6, 6, MT.CFD5DC, 0, { lw: 1 });
      RR(g, xh[0] - 10, -142, 22, 16, 3, MT.VALUE_8A929C, 0, { lw: 1 });
    },
    { tags: [MT.XE_LUA, MT.TAU_HOA_2, MT.DAU_MAY, MT.HOI_NUOC, MT.THE_KY_19, MT.DUONG_SAT], seat: { driver: [-250, -196] }, lights: headlight(282, -281, 0.04) },
  );
  reg(
    MT.HEARSE,
    MT.XE_TANG_CO_DIEN,
    MT.VEHICLE,
    [480, 170],
    (g, o) => {
      shadow(g, 240, 10);
      const col = nt(o.color || MT.VALUE_24252C, o, 0.25),
        chrome = nt(MT.C9CED6, o, 0.3),
        dk = C.shade(col, -0.3);
      const rot = spin(o, 32);
      const body = K.P();
      body.moveTo(-236, -40);
      body.lineTo(-240, -128);
      body.quadraticCurveTo(-238, -156, -204, -158);
      body.lineTo(52, -158);
      body.quadraticCurveTo(76, -156, 92, -104);
      body.lineTo(206, -96);
      body.quadraticCurveTo(232, -94, 234, -70);
      body.lineTo(236, -40);
      body.closePath();
      F(g, body, col, 10, { lw: 1.8, sy: -1 });
      const cur = nt(MT.VALUE_7A5A8A, o, 0.4);
      for (const [x, w] of [
        [-206, 110],
        [-84, 110],
      ]) {
        F(g, K.rrect(x, -140, w, 58, 6), o.night ? MT.VALUE_2A3452 : MT.VALUE_3A4A5E, 0, { lw: 1.3 });
        g.save();
        g.clip(K.rrect(x, -140, w, 58, 6));
        F(
          g,
          K.poly([
            [x, -140],
            [x + w, -140],
            [x + w, -130],
            [x + w * 0.75, -118],
            [x + w / 2, -130],
            [x + w * 0.25, -118],
            [x, -130],
          ]),
          cur,
          0,
          { lw: 1 },
        );
        R(g, x, -140, 14, 58, cur, 0, { lw: 1 });
        R(g, x + w - 14, -140, 14, 58, cur, 0, { lw: 1 });
        g.restore();
      }
      const ws = K.P();
      ws.moveTo(38, -140);
      ws.lineTo(60, -140);
      ws.quadraticCurveTo(72, -136, 82, -104);
      ws.lineTo(38, -104);
      ws.closePath();
      F(g, ws, o.night ? MT.VALUE_2A3452 : MT.A9D4EA, 0, { lw: 1.3 });
      SK(
        g,
        [
          [-230, -112],
          [-214, -100, -226, -86],
          [-238, -72, -222, -62],
        ],
        chrome,
        3.5,
        false,
      );
      R(g, 220, -110, 14, 64, chrome, 2, { lw: 1.3 });
      marks(
        g,
        null,
        C.shade(chrome, -0.4),
        1.2,
        [
          [223, -104, 223, -50],
          [227, -104, 227, -50],
          [231, -104, 231, -50],
        ],
        0.8,
      );
      SK(
        g,
        [
          [-236, -58],
          [234, -58],
        ],
        chrome,
        3,
        false,
      );
      for (const [fx, dir] of [
        [-160, 1],
        [158, 1],
      ]) {
        const fp = K.P();
        fp.moveTo(fx - 54, -30);
        fp.bezierCurveTo(fx - 50, -80, fx + 40, -84, fx + 60, -30);
        fp.closePath();
        F(g, fp, dk, 4, { lw: 1.5 });
        twheel(g, fx, -32, 32, rot * dir, MT.E8E2D4, 8);
      }
      R(g, -104, -36, 206, 8, dk, 0, { lw: 1.2 });
      E(g, 210, -120, 10, 10, chrome, 1, { lw: 1.2 });
      lamp(g, 216, -120, o, 7);
      RR(g, -246, -48, 18, 12, 4, chrome, 1, { lw: 1.1 });
      RR(g, 228, -48, 18, 12, 4, chrome, 1, { lw: 1.1 });
    },
    { tags: [MT.XE, MT.XE_TANG_2, MT.DAM_TANG, MT.CO_DIEN, MT.KINH_DI, MT.THAP_NIEN_1930], seat: { driver: [44, -86], passenger: [20, -86] }, lights: headlight(222, -120) },
  );
  reg(
    MT.MILITARY_TRUCK,
    MT.XE_TAI_QUAN_SU_THE_CHIEN,
    MT.VEHICLE,
    [580, 260],
    (g, o) => {
      shadow(g, 290, 11);
      const ol = nt(o.color || MT.VALUE_5A6238, o, 0.3),
        dk = C.shade(ol, -0.3),
        canvas = nt(MT.VALUE_8A8A5C, o, 0.35);
      const rot = spin(o, 38);
      const tarp = K.P();
      tarp.moveTo(-290, -96);
      tarp.lineTo(-290, -196);
      tarp.quadraticCurveTo(-290, -232, -250, -232);
      tarp.lineTo(30, -232);
      tarp.quadraticCurveTo(64, -232, 64, -196);
      tarp.lineTo(64, -96);
      tarp.closePath();
      F(g, tarp, canvas, 9, { lw: 1.7, sy: -1 });
      marks(
        g,
        tarp,
        C.shade(canvas, -0.3),
        2,
        [-210, -130, -50, 20].map((x) => [x, -232, x - 4, -96]),
        0.5,
      );
      marks(g, tarp, C.shade(canvas, -0.35), 1.2, [[-300, -120, 70, -120]], 0.5);
      for (const x of [-250, -170, -90, -10])
        SK(
          g,
          [
            [x, -128],
            [x + 6, -96],
          ],
          C.shade(canvas, -0.45),
          2,
          false,
        );
      R(g, -296, -102, 366, 36, ol, 4, { lw: 1.6 });
      planks(g, K.rect(-296, -102, 366, 36), -296, -102, 366, 36, 12, C.shade(ol, -0.35), false, 0.5);
      R(g, -300, -66, 590, 12, dk, 1, { lw: 1.4 });
      const cab = K.P();
      cab.moveTo(72, -66);
      cab.lineTo(72, -206);
      cab.lineTo(170, -206);
      cab.lineTo(184, -150);
      cab.lineTo(278, -146);
      cab.quadraticCurveTo(290, -144, 290, -128);
      cab.lineTo(290, -66);
      cab.closePath();
      F(g, cab, ol, 9, { lw: 1.7 });
      F(g, K.rrect(84, -194, 70, 50, 4), o.night ? MT.VALUE_2A3452 : MT.VALUE_9AB8C8, 0, { lw: 1.3 });
      SK(
        g,
        [
          [184, -150],
          [184, -66],
        ],
        dk,
        2,
        false,
      );
      for (let i = 0; i < 6; i++) R(g, 196 + i * 13, -138, 4, 30, dk, 0, { lw: 0.8 });
      R(g, 276, -140, 12, 66, C.shade(ol, -0.15), 1, { lw: 1.2 });
      const star = K.P();
      for (let i = 0; i < 10; i++) {
        const a = -PI / 2 + (i * PI) / 5;
        const rr = i % 2 ? 7 : 17;
        if (i) star.lineTo(120 + Math.cos(a) * rr, -112 + Math.sin(a) * rr);
        else star.moveTo(120 + Math.cos(a) * rr, -112 + Math.sin(a) * rr);
      }
      star.closePath();
      E(g, 120, -112, 21, 21, nt(MT.E8E4D8, o, 0.35), 0, { lw: 1.1 });
      F(g, star, ol, 0, { lw: 1 });
      for (const fx of [222, -88, -196]) {
        const fp = K.P();
        fp.moveTo(fx - 52, -60);
        fp.quadraticCurveTo(fx, -102, fx + 52, -60);
        fp.closePath();
        F(g, fp, dk, 2, { lw: 1.4 });
      }
      for (const wx of [-196, -88, 222]) twheel(g, wx, -38, 38, rot, MT.VALUE_4A5030, 6);
      E(g, 270, -160, 11, 11, dk, 1, { lw: 1.2 });
      lamp(g, 276, -160, o, 8);
    },
    { tags: [MT.XE, MT.XE_TAI_2, MT.QUAN_DOI, MT.CHIEN_TRANH, MT.THE_CHIEN], seat: { driver: [122, -118], passenger: [96, -118] }, lights: headlight(282, -160) },
  );
  reg(
    MT.SIDECAR_MOTORBIKE,
    MT.MO_TO_THUNG_THE_CHIEN,
    MT.VEHICLE,
    [320, 160],
    (g, o) => {
      shadow(g, 160, 9);
      const ol = nt(o.color || MT.VALUE_5D6650, o, 0.3),
        dk = C.shade(ol, -0.3),
        steel = nt(MT.VALUE_8A929C, o, 0.3);
      const rot = spin(o, 28);
      const tub = K.P();
      tub.moveTo(-130, -54);
      tub.lineTo(-132, -96);
      tub.quadraticCurveTo(-120, -112, -70, -110);
      tub.lineTo(20, -108);
      tub.bezierCurveTo(60, -106, 74, -80, 60, -64);
      tub.quadraticCurveTo(40, -50, 0, -50);
      tub.closePath();
      F(g, tub, C.shade(ol, -0.12), 8, { lw: 1.7, sy: -1 });
      RR(g, -110, -116, 62, 10, 4, MT.VALUE_3A2A22, 1, { lw: 1.2 });
      SK(
        g,
        [
          [-130, -82],
          [50, -80],
        ],
        C.shade(ol, 0.12),
        2,
        false,
      );
      SK(
        g,
        [
          [-20, -54],
          [-10, -40],
          [40, -40],
        ],
        steel,
        4,
        false,
      );
      for (const wx of [-86, 92]) twheel(g, wx, -28, 28, rot, MT.VALUE_5A5E58, 10);
      const rf = K.P();
      rf.moveTo(-124, -30);
      rf.quadraticCurveTo(-120, -72, -76, -66);
      rf.lineTo(-70, -60);
      rf.quadraticCurveTo(-110, -62, -112, -30);
      rf.closePath();
      F(g, rf, ol, 2, { lw: 1.3 });
      SK(
        g,
        [
          [66, -116],
          [92, -28],
        ],
        steel,
        6,
        false,
      );
      const ff = K.P();
      ff.moveTo(62, -38);
      ff.quadraticCurveTo(84, -70, 118, -44);
      ff.lineTo(112, -40);
      ff.quadraticCurveTo(86, -60, 70, -36);
      ff.closePath();
      F(g, ff, ol, 1, { lw: 1.2 });
      SK(
        g,
        [
          [-44, -96],
          [-80, -40],
        ],
        dk,
        5,
        false,
      );
      SK(
        g,
        [
          [-12, -82],
          [-30, -40],
          [60, -100],
        ],
        dk,
        5,
        false,
      );
      R(g, -36, -78, 56, 40, MT.VALUE_4A4E54, 4, { lw: 1.4 });
      for (let i = 0; i < 4; i++) R(g, -28 + i * 12, -84, 6, 48, MT.VALUE_6A6E74, 0, { lw: 0.8 });
      SK(
        g,
        [
          [-30, -40],
          [-90, -44],
          [-140, -50],
        ],
        MT.VALUE_7A7A80,
        6,
        false,
      );
      F(
        g,
        K.poly(
          [
            [-24, -96],
            [4, -110],
            [52, -106],
            [64, -92],
            [40, -80],
            [-12, -80],
          ],
          true,
        ),
        ol,
        5,
        { lw: 1.5 },
      );
      RR(g, -66, -108, 44, 12, 5, MT.VALUE_3A2A22, 2, { lw: 1.3 });
      SK(
        g,
        [
          [-44, -96],
          [-48, -80],
        ],
        steel,
        3,
        false,
      );
      SK(
        g,
        [
          [60, -128],
          [74, -118],
          [52, -132],
        ],
        MT.VALUE_2A2A2E,
        4,
        false,
      );
      E(g, 82, -104, 10, 10, dk, 1, { lw: 1.2 });
      lamp(g, 86, -104, o, 7);
    },
    { tags: [MT.XE, MT.MO_TO, MT.XE_MAY, MT.QUAN_DOI, MT.THE_CHIEN], seat: { driver: [-40, -110], passenger: [-80, -86] }, lights: headlight(90, -104) },
  );
  reg(
    MT.GYPSY_WAGON,
    MT.XE_NHA_DU_MUC,
    MT.VEHICLE,
    [460, 380],
    (g, o) => {
      shadow(g, 220, 10);
      const grn = nt(o.color || MT.VALUE_2F6A4A, o, 0.4),
        red = nt(MT.B03A2E, o, 0.4),
        gold = nt(MT.E8B83A, o, 0.4),
        wood = nt(MT.VALUE_6A4428, o, 0.45);
      const rot = spin(o, 60);
      tube(
        g,
        [
          [140, -100],
          [200, -110],
          [262, -118],
        ],
        8,
        6,
        wood,
        1,
      );
      R(g, -200, -104, 346, 14, wood, 2, { lw: 1.4 });
      const body = K.poly([
        [-190, -110],
        [140, -110],
        [160, -276],
        [-210, -276],
      ]);
      F(g, body, grn, 10, { lw: 1.7 });
      planks(g, body, -210, -276, 370, 166, 18, C.shade(grn, -0.35), true, 0.35);
      SK(
        g,
        [
          [-196, -128],
          [146, -128],
        ],
        gold,
        4,
        false,
      );
      SK(
        g,
        [
          [-208, -262],
          [158, -262],
        ],
        gold,
        4,
        false,
      );
      for (const sx of [-150, 70]) {
        SK(
          g,
          [
            [sx - 26, -150],
            [sx - 10, -170, sx, -152],
            [sx + 10, -134, sx + 26, -154],
          ],
          gold,
          3,
          false,
        );
        E(g, sx, -152, 4, 4, red, 0, { lw: 1 });
      }
      const lit = !!o.night;
      shutter(g, -116, -244, 18, 70, red, 0);
      shutter(g, -34, -244, 18, 70, red, 0);
      win(g, -98, -244, 64, 70, o, lit, { arch: true, frame: gold, curtain: MT.C84A4A });
      const roof = K.P();
      roof.moveTo(-232, -270);
      roof.bezierCurveTo(-220, -360, 170, -360, 182, -270);
      roof.closePath();
      F(g, roof, red, 9, { lw: 1.7, sy: -1 });
      const rr = [];
      for (let i = 1; i < 9; i++) rr.push([-232 + i * 46, -270, -232 + i * 46 + (i - 4.5) * 3, -334]);
      marks(g, roof, C.shade(red, -0.3), 1.6, rr, 0.4);
      SK(
        g,
        [
          [-232, -270],
          [182, -270],
        ],
        gold,
        4,
        false,
      );
      R(g, -136, -360, 18, 46, MT.VALUE_3A3A40, 2, { lw: 1.3 });
      R(g, -142, -368, 30, 10, MT.VALUE_2A2A30, 0, { lw: 1.2 });
      SK(
        g,
        [
          [156, -262],
          [176, -252],
        ],
        MT.VALUE_2A2A30,
        2,
        false,
      );
      RR(g, 168, -254, 18, 26, 4, lit ? MT.FFD889 : nt(MT.C8B07A, o, 0.4), 0, { lw: 1.2, glow: lit ? LITGLOW : null });
      for (let i = 0; i < 3; i++) R(g, 150 + i * 6, -96 + i * 30, 30, 6, wood, 0, { lw: 1 });
      wwheel(g, -120, -60, 60, rot, gold, 12, red);
      wwheel(g, 104, -46, 46, (rot * 60) / 46, gold, 10, red);
    },
    { tags: [MT.XE, MT.DU_MUC, MT.DI_GAN, MT.XE_NHA, MT.CO_TICH], seat: { driver: [166, -132] }, lights: (o) => (o.night ? [{ type: MT.GLOW, x: 177, y: -241, r: 70, color: MT.FFD889, alpha: 0.7 }] : []) },
  );
  const airfoil = (g, x0, x1, y, th, col) => {
    const p = K.P();
    p.moveTo(x0, y);
    p.bezierCurveTo(x0 + (x1 - x0) * 0.1, y - th * 1.2, x0 + (x1 - x0) * 0.5, y - th, x1, y - th * 0.15);
    p.bezierCurveTo(x0 + (x1 - x0) * 0.5, y + th * 0.25, x0 + (x1 - x0) * 0.1, y + th * 0.35, x0, y);
    p.closePath();
    F(g, p, col, 3, { lw: 1.5 });
    return p;
  };
  const roundel = (g, x, y, r) => {
    E(g, x, y, r, r, MT.VALUE_2A4A9A, 0, { lw: 1.2 });
    E(g, x, y, r * 0.66, r * 0.66, MT.F4F0E6, 0, { ink: false });
    E(g, x, y, r * 0.33, r * 0.33, MT.C83A2E, 0, { ink: false });
  };
  reg(
    MT.BIPLANE,
    MT.MAY_BAY_HAI_TANG_CANH,
    MT.AIRCRAFT,
    [440, 210],
    (g, o) => {
      const col = nt(o.color || MT.C0392B, o, 0.35),
        wing = nt(MT.E2CF9A, o, 0.4),
        wood = nt(MT.VALUE_7A5232, o, 0.4),
        steel = nt(MT.VALUE_5A5E66, o, 0.3);
      const t = o.t || 0;
      SK(
        g,
        [
          [30, -96],
          [16, -24],
          [52, -24],
          [64, -96],
        ],
        steel,
        4,
        false,
      );
      SK(
        g,
        [
          [-196, -112],
          [-206, -84],
        ],
        steel,
        3,
        false,
      );
      airfoil(g, -60, 90, -80, 14, C.shade(wing, -0.12));
      for (const sx of [-40, 60])
        SK(
          g,
          [
            [sx, -84],
            [sx + 6, -196],
          ],
          wood,
          5,
          false,
        );
      SK(
        g,
        [
          [-40, -84],
          [66, -196],
        ],
        MT.VALUE_8A8A90,
        1.5,
        false,
      );
      SK(
        g,
        [
          [60, -84],
          [-34, -196],
        ],
        MT.VALUE_8A8A90,
        1.5,
        false,
      );
      SK(
        g,
        [
          [10, -132],
          [20, -196],
        ],
        steel,
        3,
        false,
      );
      SK(
        g,
        [
          [40, -126],
          [46, -196],
        ],
        steel,
        3,
        false,
      );
      const fus = K.P();
      fus.moveTo(-222, -112);
      fus.quadraticCurveTo(-150, -102, -40, -94);
      fus.quadraticCurveTo(80, -84, 150, -86);
      fus.lineTo(150, -138);
      fus.quadraticCurveTo(60, -146, -40, -142);
      fus.quadraticCurveTo(-150, -134, -222, -122);
      fus.closePath();
      F(g, fus, col, 8, { lw: 1.7, sy: -1 });
      marks(
        g,
        fus,
        C.shade(col, -0.35),
        1.2,
        [-170, -120, -70, -20, 30, 80].map((x) => [x, -150, x, -80]),
        0.35,
      );
      const fin = K.P();
      fin.moveTo(-222, -118);
      fin.quadraticCurveTo(-232, -190, -196, -192);
      fin.quadraticCurveTo(-176, -170, -170, -128);
      fin.closePath();
      F(g, fin, col, 4, { lw: 1.5 });
      g.save();
      g.clip(fin);
      R(g, -240, -200, 22, 90, MT.F4F0E6, 0, { ink: false });
      R(g, -218, -200, 16, 90, MT.VALUE_2A4A9A, 0, { ink: false });
      g.restore();
      airfoil(g, -228, -150, -118, 8, wing);
      roundel(g, -96, -118, 16);
      F(g, K.rrect(-30, -150, 46, 14, 7), MT.VALUE_2A2224, 0, { lw: 1.2 });
      F(
        g,
        K.poly([
          [18, -150],
          [30, -168],
          [36, -150],
        ]),
        o.night ? MT.VALUE_3A4A6A : MT.BFE0F0,
        0,
        { lw: 1.1 },
      );
      RR(g, 134, -142, 30, 60, [4, 12, 12, 4], steel, 4, { lw: 1.4 });
      marks(
        g,
        K.rrect(134, -142, 30, 60, [4, 12, 12, 4]),
        MT.VALUE_2A2A30,
        1.4,
        [
          [134, -130, 164, -130],
          [134, -112, 164, -112],
          [134, -94, 164, -94],
        ],
        0.6,
      );
      airfoil(g, -80, 100, -196, 16, wing);
      roundel(g, 0, -200, 9);
      const a = t * 40 + spin(o, 10);
      g.save();
      g.globalAlpha = 0.2;
      E(g, 172, -112, 8, 66, MT.E8E4DC, 0, { ink: false });
      g.restore();
      const bl = 64 * Math.abs(Math.cos(a)) + 6;
      F(g, K.ell(172, -112, 5, bl), wood, 1, { lw: 1.2 });
      E(g, 174, -112, 7, 9, steel, 1, { lw: 1.1 });
      twheel(g, 34, -22, 22, spin(o, 22), MT.CFD5DC, 6);
    },
    { tags: [MT.MAY_BAY, MT.THE_CHIEN, MT.CANH_KEP, MT.PHI_CONG_2, MT.CO_DIEN], seat: { driver: [-10, -146], passenger: [-30, -146] } },
  );
  reg(
    MT.ZEPPELIN,
    MT.KHI_CAU_ZEPPELIN,
    MT.AIRCRAFT,
    [820, 320],
    (g, o) => {
      const sil = nt(o.color || MT.C9CCD2, o, 0.45),
        dk = C.shade(sil, -0.3),
        red = nt(MT.B8322A, o, 0.4);
      const t = o.t || 0;
      for (const [y, s] of [
        [-218, -1],
        [-140, 1],
      ]) {
        const fp = K.P();
        fp.moveTo(-300, -180 + s * 30);
        fp.lineTo(-404, y + s * 66);
        fp.lineTo(-412, y + s * 66);
        fp.lineTo(-400, -180 + s * 4);
        fp.closePath();
        F(g, fp, C.shade(sil, -0.12), 3, { lw: 1.5 });
      }
      const env = K.P();
      env.moveTo(392, -180);
      env.bezierCurveTo(392, -260, 260, -284, 60, -284);
      env.bezierCurveTo(-180, -284, -340, -250, -404, -180);
      env.bezierCurveTo(-340, -110, -180, -76, 60, -76);
      env.bezierCurveTo(260, -76, 392, -100, 392, -180);
      env.closePath();
      F(g, env, sil, 16, { lw: 1.8, sy: -1 });
      const seams = [];
      for (let x = -300; x < 380; x += 56) {
        const k = 1 - Math.pow(Math.max(0, (x - 40) / 360), 2) * 0.3;
        seams.push([x, -290, x - 10 * k, -180, x, -70]);
      }
      marks(g, env, dk, 1.3, seams, 0.4);
      marks(g, env, dk, 1.2, [[-404, -180, 60, -170, 392, -180]], 0.35);
      marks(g, env, red, 7, [[-380, -150, 60, -112, 380, -150]], 0.8);
      g.save();
      g.clip(env);
      g.globalAlpha = 0.28;
      g.fillStyle = MT.FFFFFF;
      g.beginPath();
      g.ellipse(40, -250, 300, 18, 0, 0, PI * 2);
      g.fill();
      g.restore();
      const hfin = K.P();
      hfin.moveTo(-290, -178);
      hfin.lineTo(-410, -186);
      hfin.lineTo(-418, -168);
      hfin.lineTo(-300, -170);
      hfin.closePath();
      F(g, hfin, C.shade(sil, -0.05), 2, { lw: 1.4 });
      R(g, -414, -200, 6, 48, red, 0, { lw: 1 });
      SK(
        g,
        [
          [-40, -84],
          [-20, -56],
        ],
        dk,
        2.5,
        false,
      );
      SK(
        g,
        [
          [120, -82],
          [100, -56],
        ],
        dk,
        2.5,
        false,
      );
      const gon = K.rrect(-60, -58, 190, 52, [10, 22, 22, 10]);
      F(g, gon, nt(MT.VALUE_6A5A4A, o, 0.4), 6, { lw: 1.6 });
      for (let i = 0; i < 6; i++) {
        const lit = !!o.night && i % 3 !== 1;
        F(g, K.rrect(-44 + i * 26, -48, 18, 18, 3), lit ? LIT : o.night ? MT.VALUE_2A3452 : MT.VALUE_9AB8C8, 0, { lw: 1.1, glow: lit ? LITGLOW : null });
      }
      for (const ex of [-150, 250]) {
        SK(
          g,
          [
            [ex, -96],
            [ex + 10, -70],
          ],
          dk,
          3,
          false,
        );
        RR(g, ex - 22, -74, 50, 22, 10, dk, 3, { lw: 1.3 });
        const a = t * 30;
        F(g, K.ell(ex - 26, -63, 3, 22 * Math.abs(Math.cos(a)) + 3), MT.VALUE_5A4A3A, 0, { lw: 1 });
      }
      const blink = Math.sin(t * 5) > 0;
      E(g, 392, -180, 5, 5, blink ? MT.FF5040 : MT.VALUE_7A2A22, 0, { lw: 1, glow: blink ? MT.RGBA_255_80_60_0_9 : null });
    },
    { tags: [MT.KHI_CAU, MT.ZEPPELIN, MT.PHI_THUYEN_2, MT.CO_DIEN, MT.BAU_TROI], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 35, y: -40, r: 120, color: MT.FFD889, alpha: 0.35 }] : []) },
  );
  reg(
    MT.VIKING_LONGSHIP,
    MT.THUYEN_RONG_VIKING,
    MT.WATERCRAFT,
    [720, 480],
    (g, o) => {
      const wood = nt(o.color || MT.VALUE_8A5A34, o, 0.45),
        dk = C.shade(wood, -0.3),
        red = nt(MT.B8322A, o, 0.4),
        cream = nt(MT.EFE4CC, o, 0.4);
      const t = o.t || 0;
      const bil = Math.sin(t * 1.3) * 6;
      R(g, -6, -470, 12, 360, dk, 2, { lw: 1.4 });
      SK(
        g,
        [
          [0, -466],
          [300, -150],
        ],
        MT.VALUE_5A4A3A,
        1.6,
        false,
      );
      SK(
        g,
        [
          [0, -466],
          [-300, -150],
        ],
        MT.VALUE_5A4A3A,
        1.6,
        false,
      );
      RR(g, -160, -446, 320, 10, 5, dk, 1, { lw: 1.3 });
      const sail = K.P();
      sail.moveTo(-150, -436);
      sail.lineTo(150, -436);
      sail.quadraticCurveTo(168 + bil, -330, 140, -224);
      sail.lineTo(-140, -224);
      sail.quadraticCurveTo(-130 + bil * 0.6, -330, -150, -436);
      sail.closePath();
      F(g, sail, cream, 10, { lw: 1.7 });
      g.save();
      g.clip(sail);
      for (let i = 0; i < 6; i++) if (i % 2 === 0) R(g, -170 + i * 56, -440, 56, 220, red, 0, { ink: false });
      g.restore();
      inkLine(g, sail, 1.7);
      const r = rng(o, 2);
      for (let i = 0; i < 7; i++) {
        const ox2 = -210 + i * 64;
        const a = Math.sin(t * 2 + i * 0.3) * 0.12;
        const ex = ox2 - 60 + Math.sin(a) * 80,
          ey = 14;
        SK(
          g,
          [
            [ox2, -112],
            [ex, ey],
          ],
          dk,
          4,
          false,
        );
        RR(g, ex - 12, ey - 6, 24, 9, 4, dk, 0, { lw: 1 });
      }
      const gun = (x) => -112 - Math.pow(Math.abs(x) / 300, 2.4) * 30;
      const hull = K.P();
      hull.moveTo(-304, -142);
      hull.quadraticCurveTo(-270, -10, -150, -2);
      hull.lineTo(150, -2);
      hull.quadraticCurveTo(272, -10, 304, -146);
      hull.quadraticCurveTo(150, -110, 0, -110);
      hull.quadraticCurveTo(-150, -110, -304, -142);
      hull.closePath();
      F(g, hull, wood, 10, { lw: 1.8, sy: -1 });
      const strakes = [];
      for (let k = 1; k < 5; k++) strakes.push([-304, -142 + k * 24, 0, -110 + k * 30, 304, -146 + k * 24]);
      marks(g, hull, dk, 1.6, strakes, 0.55);
      tube(
        g,
        [
          [290, -136],
          [318, -200],
          [324, -262],
          [314, -292],
        ],
        26,
        18,
        wood,
        3,
      );
      F(
        g,
        K.poly(
          [
            [300, -290],
            [304, -318],
            [328, -332],
            [362, -320],
            [370, -304],
            [346, -300],
            [360, -290],
            [332, -284],
            [318, -270],
          ],
          true,
        ),
        wood,
        3,
        { lw: 1.5 },
      );
      PL(
        g,
        [
          [306, -314],
          [292, -344],
          [318, -324],
        ],
        dk,
        1,
        { lw: 1.2 },
      );
      E(g, 330, -314, 4, 4, MT.F4E04A, 0, { lw: 1 });
      SK(
        g,
        [
          [348, -298],
          [350, -292],
        ],
        MT.F4F0E6,
        2,
        false,
      );
      tube(
        g,
        [
          [-292, -136],
          [-322, -196],
          [-322, -258],
          [-298, -284],
          [-276, -272],
          [-286, -256],
        ],
        24,
        10,
        wood,
        3,
      );
      const cols = [MT.C83A2E, MT.E8B83A, MT.VALUE_2A5A9A, MT.EFE4CC];
      for (let i = 0; i < 9; i++) {
        const sx = -240 + i * 60;
        const sy = gun(sx) + 12;
        const c = nt(cols[(i + Math.floor(r() * 2)) % 4], o, 0.45);
        E(g, sx, sy, 22, 22, c, 3, { lw: 1.4 });
        SK(
          g,
          [
            [sx - 21, sy],
            [sx + 21, sy],
          ],
          C.shade(c, -0.25),
          2,
          false,
        );
        E(g, sx, sy, 6, 6, MT.VALUE_9AA0A6, 0, { lw: 1 });
      }
      SK(
        g,
        [
          [-304, -142],
          [-150, -110, 0, -110],
          [150, -110, 304, -146],
        ],
        C.shade(wood, 0.15),
        4,
        false,
      );
    },
    { tags: [MT.THUYEN, MT.VIKING, MT.THUYEN_RONG, MT.BAC_AU_2, MT.CO_DAI, MT.BIEN], seat: { driver: [-250, -220] } },
  );
  reg(
    MT.JUNK_SHIP,
    MT.THUYEN_BUOM_MANH_TRUNG_HOA,
    MT.WATERCRAFT,
    [640, 560],
    (g, o) => {
      const wood = nt(o.color || MT.VALUE_7A4A2A, o, 0.45),
        dk = C.shade(wood, -0.35),
        red = nt(MT.A83A2A, o, 0.4),
        sailC = nt(MT.D06A3A, o, 0.45),
        bat = nt(MT.VALUE_4A2E22, o, 0.4);
      const t = o.t || 0;
      const batten = (mx, top, bot, w, k) => {
        const sw = Math.sin(t * 1.1 + k) * 4;
        const p = K.P();
        p.moveTo(mx + w * 0.22, top);
        p.lineTo(mx + w * 0.26, bot);
        p.lineTo(mx - w * 0.74, bot + 6);
        p.quadraticCurveTo(mx - w * 0.92 + sw, (top + bot) / 2, mx - w * 0.7, top - 20);
        p.closePath();
        F(g, p, sailC, 8, { lw: 1.6 });
        const n = 7;
        const segs = [];
        for (let i = 1; i < n; i++) {
          const y = top + ((bot - top) * i) / n;
          segs.push([mx + w * 0.24, y, mx - w * 0.2, y + 4, mx - w * 0.86, y - 8 + i * 2]);
        }
        marks(g, p, bat, 2.6, segs, 0.9);
        for (let i = 1; i < n; i += 2)
          SK(
            g,
            [
              [mx - w * 0.84, top + ((bot - top) * i) / n],
              [mx - w * 1.02, bot + 20],
            ],
            MT.VALUE_5A4A3A,
            1,
            false,
          );
        return p;
      };
      R(g, -236, -380, 10, 250, dk, 2, { lw: 1.3 });
      batten(-231, -360, -190, 110, 2);
      R(g, -6, -520, 12, 400, dk, 2, { lw: 1.3 });
      batten(0, -500, -170, 190, 0);
      R(g, 196, -420, 10, 290, dk, 2, { lw: 1.3 });
      batten(201, -400, -170, 140, 1);
      PL(
        g,
        [
          [6, -520],
          [44, -512 + Math.sin(t * 4) * 4],
          [6, -500],
        ],
        red,
        1,
        { lw: 1.1 },
      );
      const hull = K.P();
      hull.moveTo(-304, -230);
      hull.lineTo(-282, -70);
      hull.quadraticCurveTo(-240, -4, -140, -2);
      hull.lineTo(160, -2);
      hull.quadraticCurveTo(270, -20, 312, -150);
      hull.lineTo(300, -160);
      hull.quadraticCurveTo(120, -132, -120, -140);
      hull.lineTo(-180, -150);
      hull.lineTo(-200, -230);
      hull.closePath();
      F(g, hull, wood, 10, { lw: 1.8, sy: -1 });
      marks(
        g,
        hull,
        dk,
        1.5,
        [
          [-290, -110, 0, -94, 310, -128],
          [-286, -76, 0, -62, 290, -90],
          [-270, -40, 0, -30, 270, -54],
        ],
        0.5,
      );
      g.save();
      g.clip(hull);
      R(g, -320, -40, 660, 50, nt(MT.VALUE_3A2A22, o, 0.4), 0, { ink: false });
      g.restore();
      SK(
        g,
        [
          [-180, -146],
          [120, -136, 300, -160],
        ],
        red,
        8,
        false,
      );
      R(g, -298, -270, 112, 44, red, 4, { lw: 1.5 });
      const lit = !!o.night;
      for (let i = 0; i < 3; i++) F(g, K.rrect(-288 + i * 34, -262, 24, 26, [8, 8, 2, 2]), lit ? LIT : MT.VALUE_2A2224, 0, { lw: 1.1, glow: lit ? LITGLOW : null });
      const rf = curvedRoof(-242, -300, 80, -270, 150, 10, 8);
      F(g, rf, nt(MT.VALUE_3A3034, o, 0.3), 3, { lw: 1.4 });
      E(g, 262, -104, 15, 11, MT.F4F0E6, 0, { lw: 1.2 });
      E(g, 266, -104, 7, 8, MT.VALUE_1A1416, 0, { ink: false });
      PL(
        g,
        [
          [-282, -70],
          [-320, -40],
          [-316, 6],
          [-276, -24],
        ],
        dk,
        2,
        { lw: 1.4 },
      );
    },
    { tags: [MT.THUYEN, MT.THUYEN_BUOM_2, MT.TRUNG_HOA_2, MT.CHAU_A, MT.BIEN, MT.CO_DAI], seat: { driver: [-240, -320] }, lights: (o) => (o.night ? [{ type: MT.GLOW, x: -242, y: -250, r: 90, color: MT.FFD889, alpha: 0.4 }] : []) },
  );
  reg(
    MT.CATAPULT,
    MT.MAY_BAN_DA,
    MT.PROP,
    [340, 300],
    (g, o) => {
      shadow(g, 160, 9);
      const wood = nt(o.color || MT.VALUE_8A5A34, o, 0.45),
        dk = C.shade(wood, -0.28),
        rope = nt(MT.C8B07A, o, 0.4),
        stone = nt(MT.VALUE_8A8A90, o, 0.4);
      const k = Math.max(0, Math.min(1, o.launch != null ? o.launch : o.progress || 0));
      const a = PI + 0.14 + (PI * 0.5 + 0.06) * (k * k * (3 - 2 * k));
      R(g, -150, -82, 300, 20, dk, 2, { lw: 1.4 });
      limb(
        g,
        [
          [-6, -76],
          [56, -212],
        ],
        18,
        14,
        dk,
        2,
      );
      limb(
        g,
        [
          [116, -76],
          [56, -212],
        ],
        18,
        14,
        dk,
        2,
      );
      RR(g, 30, -226, 60, 22, 4, wood, 3, { lw: 1.4 });
      RR(g, 54, -232, 16, 34, 6, rope, 1, { lw: 1.2 });
      const px = 20,
        py = -96;
      const ex = px + Math.cos(a) * 190,
        ey = py + Math.sin(a) * 190;
      limb(
        g,
        [
          [px, py],
          [ex, ey],
        ],
        18,
        12,
        wood,
        3,
      );
      g.save();
      g.translate(ex, ey);
      g.rotate(a + PI / 2);
      const cup = K.P();
      cup.moveTo(-26, 0);
      cup.quadraticCurveTo(-26, 26, 0, 26);
      cup.quadraticCurveTo(26, 26, 26, 0);
      cup.closePath();
      if (k < 0.5) E(g, 0, -4, 18, 18, stone, 3, { lw: 1.3 });
      F(g, cup, dk, 2, { lw: 1.4 });
      g.restore();
      E(g, px, py, 22, 22, rope, 3, { lw: 1.4 });
      marks(
        g,
        K.ell(px, py, 22, 22),
        C.shade(rope, -0.3),
        1.4,
        [
          [px - 22, py - 10, px + 22, py - 6],
          [px - 22, py + 2, px + 22, py + 6],
          [px - 22, py + 12, px + 22, py + 16],
        ],
        0.7,
      );
      E(g, px, py, 7, 7, dk, 0, { lw: 1 });
      R(g, -150, -62, 300, 14, wood, 2, { lw: 1.4 });
      E(g, -118, -84, 18, 18, dk, 2, { lw: 1.2 });
      SK(
        g,
        [
          [-118, -84],
          [px - 4, py - 4],
        ],
        rope,
        2,
        false,
      );
      const rot = spin(o, 30);
      wwheel(g, -100, -30, 30, rot, wood, 8);
      wwheel(g, 100, -30, 30, rot, wood, 8);
    },
    { tags: [MT.MAY_BAN_DA_2, MT.TRUNG_CO, MT.CHIEN_TRANH, MT.CONG_THANH, MT.VU_KHI] },
  );
  reg(
    MT.TREBUCHET,
    MT.MAY_BAN_DA_DOI_TRONG,
    MT.PROP,
    [400, 460],
    (g, o) => {
      shadow(g, 190, 10);
      const wood = nt(o.color || MT.VALUE_8A5A34, o, 0.45),
        dk = C.shade(wood, -0.28),
        rope = nt(MT.C8B07A, o, 0.4),
        stone = nt(MT.VALUE_8A8A90, o, 0.4);
      const k = Math.max(0, Math.min(1, o.launch != null ? o.launch : o.progress || 0));
      const e = k * k * (3 - 2 * k);
      const a = PI * 0.8 + (-PI * 0.42 - PI * 0.8) * e;
      const ax = 0,
        ay = -330;
      limb(
        g,
        [
          [-120, -60],
          [ax, ay],
        ],
        22,
        16,
        dk,
        2,
      );
      limb(
        g,
        [
          [120, -60],
          [ax, ay],
        ],
        22,
        16,
        dk,
        2,
      );
      limb(
        g,
        [
          [-80, -150],
          [80, -150],
        ],
        14,
        14,
        dk,
        1,
      );
      limb(
        g,
        [
          [-60, -60],
          [ax - 4, -250],
        ],
        12,
        10,
        dk,
        1,
      );
      const lx = ax + Math.cos(a) * 290,
        ly = ay + Math.sin(a) * 290;
      const sx = ax - Math.cos(a) * 90,
        sy = ay - Math.sin(a) * 90;
      if (e < 0.5) {
        const py = Math.min(-14, ly + 90);
        SK(
          g,
          [
            [lx, ly],
            [lx + 20, py],
          ],
          rope,
          2,
          false,
        );
        E(g, lx + 24, py - 4, 18, 16, stone, 3, { lw: 1.3 });
        E(g, lx + 24, py + 6, 20, 8, rope, 1, { lw: 1.1 });
      } else
        SK(
          g,
          [
            [lx, ly],
            [lx + Math.cos(a + 0.6) * 70, ly + Math.sin(a + 0.6) * 70],
          ],
          rope,
          2,
          false,
        );
      limb(
        g,
        [
          [sx, sy],
          [lx, ly],
        ],
        24,
        12,
        wood,
        3,
      );
      SK(
        g,
        [
          [sx - 20, sy + 4],
          [sx, sy + 20],
          [sx + 20, sy + 4],
        ],
        MT.VALUE_4A4A50,
        3,
        false,
      );
      const box = K.rrect(sx - 46, sy + 18, 92, 80, 4);
      F(g, box, wood, 6, { lw: 1.6 });
      planks(g, box, sx - 46, sy + 18, 92, 80, 20, dk, false, 0.6);
      R(g, sx - 48, sy + 16, 96, 8, dk, 1, { lw: 1.2 });
      E(g, ax, ay, 12, 12, nt(MT.VALUE_5A5E66, o, 0.3), 2, { lw: 1.3 });
      R(g, -180, -78, 360, 22, wood, 3, { lw: 1.5 });
      const rot = spin(o, 28);
      wwheel(g, -136, -28, 28, rot, wood, 8);
      wwheel(g, 136, -28, 28, rot, wood, 8);
    },
    { tags: [MT.MAY_BAN_DA_2, MT.TREBUCHET, MT.TRUNG_CO, MT.CONG_THANH, MT.VU_KHI] },
  );
  reg(
    MT.SIEGE_TOWER,
    MT.THAP_CONG_THANH,
    MT.PROP,
    [280, 620],
    (g, o) => {
      shadow(g, 140, 9);
      const wood = nt(o.color || MT.VALUE_8A5A34, o, 0.45),
        dk = C.shade(wood, -0.3),
        hide = nt(MT.B08A5A, o, 0.45);
      const body = K.poly([
        [-124, -50],
        [124, -50],
        [104, -520],
        [-104, -520],
      ]);
      F(g, body, wood, 12, { lw: 1.8 });
      planks(g, body, -130, -520, 260, 470, 20, dk, false, 0.45);
      for (const [y0, y1] of [
        [-200, -60],
        [-360, -216],
        [-500, -376],
      ]) {
        const w0 = 124 - ((-y1 - 50) / 470) * 20,
          w1 = 124 - ((-y0 - 50) / 470) * 20;
        const hp = K.poly([
          [-w0 + 14, y1 - 8],
          [w0 - 14, y1 - 8],
          [w1 - 14, y0 + 6],
          [-w1 + 14, y0 + 6],
        ]);
        F(g, hp, hide, 4, { lw: 1.4 });
        const st = [];
        for (let yy = y0 + 14; yy < y1 - 10; yy += 14) st.push([-w1 + 18, yy, -w1 + 24, yy], [w1 - 24, yy, w1 - 18, yy]);
        marks(g, null, C.shade(hide, -0.4), 1.5, st, 0.8);
        R(g, -6, y0 + 40, 12, 40, MT.VALUE_1A1416, 0, { lw: 1 });
      }
      for (const y of [-56, -210, -366, -514]) {
        const w = 124 - ((-y - 50) / 470) * 20;
        R(g, -w - 6, y - 10, w * 2 + 12, 14, dk, 2, { lw: 1.4 });
      }
      for (let i = 0; i < 5; i++) R(g, -108 + i * 46, -560, 32, 40, wood, 3, { lw: 1.4 });
      const db = K.rect(96, -630, 20, 120);
      F(g, db, C.shade(wood, 0.08), 3, { lw: 1.4 });
      SK(
        g,
        [
          [106, -620],
          [60, -560],
        ],
        MT.VALUE_4A4A50,
        2,
        false,
      );
      SK(
        g,
        [
          [-60, -560],
          [-60, -620],
        ],
        dk,
        4,
        false,
      );
      PL(
        g,
        [
          [-60, -620],
          [-10, -608 + Math.sin((o.t || 0) * 4) * 4],
          [-60, -596],
        ],
        nt(MT.B8322A, o, 0.4),
        1,
        { lw: 1.1 },
      );
      const rot = spin(o, 42);
      for (const wx of [-84, 0, 84]) {
        E(g, wx, -42, 42, 42, dk, 4, { lw: 1.6 });
        E(g, wx, -42, 32, 32, wood, 2, { lw: 1.2 });
        SK(
          g,
          [
            [wx + Math.cos(rot) * 30, -42 + Math.sin(rot) * 30],
            [wx - Math.cos(rot) * 30, -42 - Math.sin(rot) * 30],
          ],
          dk,
          3,
          false,
        );
        E(g, wx, -42, 8, 8, MT.VALUE_4A4A50, 0, { lw: 1 });
      }
    },
    { tags: [MT.THAP_CONG_THANH_2, MT.TRUNG_CO, MT.CHIEN_TRANH, MT.CONG_THANH] },
  );
  const siding = (g, clip, x, y, w, h, step, col, a) => planks(g, clip, x, y, w, h, step, col, false, a == null ? 0.3 : a);
  const vines = (g, x, y, h, o, k) => {
    const r = rng(o, k);
    const c = nt(MT.VALUE_33402C, o, 0.45);
    let px = x,
      py = y;
    const pts = [[px, py]];
    for (let i = 0; i < 6; i++) {
      px += (r() - 0.5) * 40;
      py -= h / 6;
      pts.push([px, py]);
    }
    tube(g, pts, 5, 2, c, 0, { ink: false });
    for (let i = 1; i < pts.length; i++) {
      const s = r() > 0.5 ? 1 : -1;
      SK(g, [pts[i], [pts[i][0] + s * (14 + r() * 16), pts[i][1] - 10 - r() * 14]], c, 2, false);
    }
  };
  const crack = (g, x, y, len, col, r) => {
    const pts = [[x, y]];
    let px = x,
      py = y;
    for (let i = 0; i < 4; i++) {
      px += (r() - 0.5) * 16;
      py += len / 4;
      pts.push([px, py]);
    }
    SK(g, pts, col, 1.6, false);
  };
  const colm = (g, x, yb, yt, w, col, kind) => {
    const shaft = K.poly([
      [x - w / 2, yb],
      [x + w / 2, yb],
      [x + w * 0.42, yt],
      [x - w * 0.42, yt],
    ]);
    F(g, shaft, col, w * 0.16, { lw: 1.5 });
    const fl = [];
    for (let i = -2; i <= 2; i++) fl.push([x + i * w * 0.17, yb - 4, x + i * w * 0.14, yt + 4]);
    marks(g, shaft, C.shade(col, -0.3), 1.4, fl, 0.45);
    R(g, x - w * 0.62, yb - 10, w * 1.24, 10, col, 2, { lw: 1.3 });
    if (kind === MT.PAPYRUS) {
      const cap = K.P();
      cap.moveTo(x - w * 0.42, yt);
      cap.bezierCurveTo(x - w * 0.5, yt - 20, x - w * 0.95, yt - 30, x - w * 0.8, yt - 50);
      cap.lineTo(x + w * 0.8, yt - 50);
      cap.bezierCurveTo(x + w * 0.95, yt - 30, x + w * 0.5, yt - 20, x + w * 0.42, yt);
      cap.closePath();
      F(g, cap, col, 4, { lw: 1.4 });
      marks(
        g,
        cap,
        C.shade(col, -0.3),
        1.3,
        [
          [x - w * 0.3, yt, x - w * 0.6, yt - 48],
          [x, yt, x, yt - 48],
          [x + w * 0.3, yt, x + w * 0.6, yt - 48],
        ],
        0.5,
      );
      R(g, x - w * 0.6, yt - 62, w * 1.2, 12, col, 2, { lw: 1.3 });
      for (const [yy, c2] of [
        [yt + 10, MT.VALUE_3A6A9A],
        [yt + 22, MT.B8322A],
      ])
        R(g, x - w * 0.43, yy, w * 0.86, 6, C.mix(c2, col, 0.4), 0, { lw: 1 });
    } else if (kind === MT.IONIC) {
      R(g, x - w * 0.7, yt - 14, w * 1.4, 14, col, 2, { lw: 1.3 });
      for (const s of [-1, 1]) {
        E(g, x + s * w * 0.6, yt - 4, w * 0.18, w * 0.18, col, 1, { lw: 1.2 });
        E(g, x + s * w * 0.6, yt - 4, w * 0.07, w * 0.07, C.shade(col, -0.3), 0, { ink: false });
      }
      R(g, x - w * 0.64, yt - 22, w * 1.28, 8, col, 1, { lw: 1.2 });
    } else {
      F(
        g,
        K.poly([
          [x - w * 0.42, yt],
          [x + w * 0.42, yt],
          [x + w * 0.62, yt - 12],
          [x - w * 0.62, yt - 12],
        ]),
        col,
        2,
        { lw: 1.3 },
      );
      R(g, x - w * 0.68, yt - 24, w * 1.36, 12, col, 2, { lw: 1.3 });
    }
  };
  const holeArch = (p, x, y, w, h) => {
    p.moveTo(x, y + h);
    p.lineTo(x + w, y + h);
    p.lineTo(x + w, y + w / 2);
    p.arc(x + w / 2, y + w / 2, w / 2, 0, PI, true);
    p.closePath();
  };
  const glyph = (g, k, x, y, s, col) => {
    g.save();
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineWidth = Math.max(1, s * 0.14);
    g.lineCap = MT.ROUND;
    g.beginPath();
    if (k === 0) {
      g.arc(x, y, s * 0.3, 0, PI * 2);
      g.stroke();
    } else if (k === 1) {
      g.ellipse(x, y + s * 0.05, s * 0.28, s * 0.18, 0, 0, PI * 2);
      g.fill();
      g.beginPath();
      g.arc(x + s * 0.24, y - s * 0.16, s * 0.11, 0, PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(x - s * 0.1, y + s * 0.2);
      g.lineTo(x - s * 0.1, y + s * 0.4);
      g.moveTo(x + s * 0.06, y + s * 0.2);
      g.lineTo(x + s * 0.06, y + s * 0.4);
      g.stroke();
    } else if (k === 2) {
      g.arc(x, y - s * 0.22, s * 0.13, 0, PI * 2);
      g.moveTo(x, y - s * 0.09);
      g.lineTo(x, y + s * 0.4);
      g.moveTo(x - s * 0.22, y);
      g.lineTo(x + s * 0.22, y);
      g.stroke();
    } else if (k === 3) {
      g.moveTo(x - s * 0.36, y);
      for (let i = 0; i < 4; i++) g.quadraticCurveTo(x - s * 0.36 + s * 0.18 * (i + 0.5), y + (i % 2 ? s * 0.16 : -s * 0.16), x - s * 0.36 + s * 0.18 * (i + 1), y);
      g.stroke();
    } else if (k === 4) {
      g.ellipse(x, y, s * 0.3, s * 0.14, 0, 0, PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(x, y, s * 0.07, 0, PI * 2);
      g.fill();
    } else if (k === 5) {
      g.fillRect(x - s * 0.2, y - s * 0.35, s * 0.1, s * 0.7);
      g.fillRect(x + s * 0.1, y - s * 0.35, s * 0.1, s * 0.7);
    } else {
      g.arc(x, y + s * 0.2, s * 0.3, PI, 0);
      g.closePath();
      g.fill();
    }
    g.restore();
  };
  const relief = (g, x, y, k, dir, col, acc) => {
    g.save();
    g.translate(x, y);
    g.scale(k * dir, k);
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineCap = MT.ROUND;
    g.beginPath();
    g.arc(0, -180, 13, 0, PI * 2);
    g.fill();
    g.fillStyle = acc;
    g.beginPath();
    g.moveTo(-14, -194);
    g.lineTo(10, -196);
    g.lineTo(-4, -160);
    g.lineTo(-20, -156);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-14, -164);
    g.lineTo(14, -164);
    g.lineTo(10, -110);
    g.lineTo(-10, -110);
    g.closePath();
    g.moveTo(-14, -112);
    g.lineTo(16, -112);
    g.lineTo(24, -70);
    g.lineTo(-14, -70);
    g.closePath();
    g.fill();
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(-4, -72);
    g.lineTo(-12, 0);
    g.moveTo(8, -72);
    g.lineTo(20, 0);
    g.moveTo(10, -156);
    g.lineTo(36, -128);
    g.stroke();
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(38, -200);
    g.lineTo(38, 0);
    g.moveTo(28, -186);
    g.lineTo(48, -186);
    g.stroke();
    g.beginPath();
    g.ellipse(38, -204, 7, 9, 0, 0, PI * 2);
    g.stroke();
    g.restore();
  };
  const glyphBand = (g, x, y, w, h, s, col, r) => {
    const segs = [];
    for (let cx = x + s * 0.55; cx < x + w - s * 0.3; cx += s * 1.1) {
      for (let cy = y + s * 0.6; cy < y + h - s * 0.4; cy += s) glyph(g, Math.floor(r() * 7), cx, cy, s * 0.8, col);
      segs.push([cx + s * 0.55, y + 4, cx + s * 0.55, y + h - 4]);
    }
    marks(g, null, col, 1, segs, 0.5);
  };
  reg(
    MT.HAUNTED_MANSION,
    MT.DINH_THU_MA_AM,
    MT.URBAN,
    [900, 800],
    (g, o) => {
      const wall = nt(o.color || MT.VALUE_857B92, o, 0.55),
        roof = nt(MT.VALUE_3E3A4C, o, 0.5),
        trim = nt(MT.D8D0C4, o, 0.5),
        wood = nt(MT.VALUE_4A3A36, o, 0.45),
        shut = nt(MT.VALUE_3E4E44, o, 0.5),
        ink2 = C.shade(wall, -0.4);
      const r = rng(o, 11);
      const lits = o.night ? [1, 5, 9, 12] : [];
      let wi = 0;
      const W = (x, y, w, h, opt) => {
        const lit = lits.includes(wi);
        const br = !lit && (wi % 4 === 2 || wi === 7) ? r : null;
        win(g, x, y, w, h, o, lit, Object.assign({ frame: trim, broken: br, curtain: MT.VALUE_7A2030 }, opt || {}));
        wi++;
      };
      R(g, -160, -640, 36, 90, nt(MT.VALUE_6A5450, o, 0.5), 3, { lw: 1.4 });
      PL(
        g,
        [
          [-166, -640],
          [-118, -640],
          [-118, -650],
          [-130, -662],
          [-142, -648],
          [-166, -656],
        ],
        nt(MT.VALUE_6A5450, o, 0.5),
        1,
        { lw: 1.3 },
      );
      R(g, 160, -630, 36, 80, nt(MT.VALUE_6A5450, o, 0.5), 3, { lw: 1.4 });
      R(g, 154, -636, 48, 10, nt(MT.VALUE_5A4440, o, 0.5), 1, { lw: 1.2 });
      const wing = K.rect(250, -320, 190, 320);
      F(g, wing, C.shade(wall, -0.06), 8, { lw: 1.7 });
      siding(g, wing, 250, -320, 190, 320, 14, ink2);
      PL(
        g,
        [
          [234, -312],
          [345, -480],
          [456, -312],
        ],
        roof,
        8,
        { lw: 1.7 },
      );
      PL(
        g,
        [
          [256, -318],
          [345, -456],
          [434, -318],
        ],
        C.shade(wall, -0.12),
        3,
        { lw: 1.4 },
      );
      SK(
        g,
        [
          [234, -312],
          [345, -480],
          [456, -312],
        ],
        trim,
        5,
        false,
      );
      E(g, 345, -380, 22, 22, trim, 1, { lw: 1.3 });
      F(g, K.ell(345, -380, 16, 16), o.night ? MT.VALUE_2A3452 : MT.VALUE_6A8AA8, 0, { lw: 1 });
      F(
        g,
        K.poly([
          [338, -394],
          [352, -386],
          [344, -372],
          [356, -366],
          [340, -366],
          [332, -380],
        ]),
        MT.VALUE_0E1018,
        0,
        { lw: 1 },
      );
      W(310, -270, 70, 110);
      shutter(g, 288, -270, 20, 110, shut, 0);
      shutter(g, 382, -270, 20, 110, shut, 0.35);
      W(310, -136, 70, 100);
      const main = K.rect(-270, -420, 530, 420);
      F(g, main, wall, 12, { lw: 1.8 });
      siding(g, main, -270, -420, 530, 420, 14, ink2);
      const mans = K.poly([
        [-292, -414],
        [-250, -566],
        [240, -566],
        [282, -414],
      ]);
      F(g, mans, roof, 10, { lw: 1.8, sy: -1 });
      const sc = [];
      for (let y = -550; y < -414; y += 16) for (let x = -280 + ((y / 16) % 2) * 10; x < 280; x += 20) sc.push([x, y, x + 10, y + 10, x + 20, y]);
      marks(g, mans, C.shade(roof, 0.25), 1.2, sc, 0.35);
      R(g, -256, -572, 502, 8, nt(MT.VALUE_2A2630, o, 0.4), 1, { lw: 1.2 });
      const sp = [];
      for (let x = -240; x <= 230; x += 22) sp.push([x, -572, x, -588]);
      marks(g, null, nt(MT.VALUE_2A2630, o, 0.4), 2.4, sp, 1);
      R(g, -280, -424, 550, 14, trim, 3, { lw: 1.5 });
      for (const dx of [-170, -5, 160]) {
        R(g, dx - 36, -540, 72, 90, C.shade(wall, -0.1), 3, { lw: 1.4 });
        PL(
          g,
          [
            [dx - 48, -536],
            [dx, -600],
            [dx + 48, -536],
          ],
          roof,
          4,
          { lw: 1.5 },
        );
        SK(
          g,
          [
            [dx - 48, -536],
            [dx, -600],
            [dx + 48, -536],
          ],
          trim,
          4,
          false,
        );
        W(dx - 20, -526, 40, 64, { arch: true, sill: false });
      }
      for (const [x, tilt] of [
        [-222, 0],
        [-120, 0.4],
        [90, 0],
        [180, -0.3],
      ]) {
        W(x, -380, 56, 110);
        if (tilt >= 0) shutter(g, x - 20, -380, 18, 110, shut, tilt);
        if (tilt <= 0) shutter(g, x + 58, -380, 18, 110, shut, tilt);
      }
      W(-34, -384, 68, 116, { arch: true });
      for (const x of [-232, -144, 108, 196]) W(x, -196, 56, 124);
      R(g, -124, -250, 238, 18, trim, 3, { lw: 1.4 });
      PL(
        g,
        [
          [-130, -248],
          [-5, -306],
          [120, -248],
        ],
        roof,
        5,
        { lw: 1.5 },
      );
      SK(
        g,
        [
          [-130, -248],
          [-5, -306],
          [120, -248],
        ],
        trim,
        4,
        false,
      );
      R(g, -54, -190, 98, 146, nt(MT.VALUE_2A2024, o, 0.3), 4, { lw: 1.5 });
      F(g, K.rrect(-50, -184, 42, 140, [20, 2, 0, 0]), wood, 4, { lw: 1.3 });
      F(
        g,
        K.poly([
          [-4, -184],
          [36, -190],
          [36, -40],
          [-4, -44],
        ]),
        C.shade(wood, -0.15),
        3,
        { lw: 1.3 },
      );
      E(g, -14, -112, 3, 3, nt(MT.C8A050, o, 0.4), 0, { ink: false });
      for (const cx of [-114, -64, 54, 104]) {
        R(g, cx - 6, -232, 12, 186, trim, 2, { lw: 1.3 });
        R(g, cx - 9, -238, 18, 8, trim, 1, { lw: 1.1 });
      }
      R(g, -130, -48, 250, 14, wood, 2, { lw: 1.4 });
      R(g, -80, -34, 150, 14, C.shade(wood, 0.1), 2, { lw: 1.3 });
      R(g, -70, -20, 130, 20, C.shade(wood, 0.15), 2, { lw: 1.3 });
      const rail = [];
      for (let x = -124; x < 116; x += 12) if (x < -66 || x > 46) rail.push([x, -48, x, -86]);
      marks(g, null, trim, 2.5, rail, 1);
      SK(
        g,
        [
          [-124, -86],
          [-66, -86],
        ],
        trim,
        4,
        false,
      );
      SK(
        g,
        [
          [46, -86],
          [116, -86],
        ],
        trim,
        4,
        false,
      );
      const tower = K.rect(-440, -560, 160, 560);
      F(g, tower, C.shade(wall, 0.04), 10, { lw: 1.8 });
      siding(g, tower, -440, -560, 160, 560, 14, ink2);
      for (const y of [-400, -240]) R(g, -446, y, 172, 10, trim, 2, { lw: 1.3 });
      R(g, -450, -566, 180, 14, trim, 3, { lw: 1.4 });
      W(-388, -530, 56, 104, { arch: true });
      W(-388, -370, 56, 104, { arch: true });
      W(-388, -200, 56, 110, { arch: true });
      const spire = K.P();
      spire.moveTo(-460, -560);
      spire.quadraticCurveTo(-382, -600, -360, -770);
      spire.quadraticCurveTo(-338, -600, -260, -560);
      spire.closePath();
      F(g, spire, roof, 8, { lw: 1.8 });
      marks(
        g,
        spire,
        C.shade(roof, 0.25),
        1.2,
        [
          [-440, -578, -280, -578],
          [-420, -610, -300, -610],
          [-400, -650, -320, -650],
          [-386, -700, -334, -700],
        ],
        0.4,
      );
      SK(
        g,
        [
          [-360, -770],
          [-360, -810],
        ],
        MT.VALUE_2A2630,
        3,
        false,
      );
      PL(
        g,
        [
          [-382, -800],
          [-344, -800],
          [-336, -806],
          [-344, -812],
          [-382, -806],
        ],
        MT.VALUE_2A2630,
        0,
        { lw: 1 },
      );
      vines(g, -280, 0, 360, o, 1);
      vines(g, 250, 0, 260, o, 2);
      const cr = rng(o, 5);
      crack(g, 140, -420, 90, ink2, cr);
      crack(g, -300, -300, 80, ink2, cr);
    },
    { tags: [MT.NHA_MA, MT.BIET_THU, MT.MA_AM, MT.KINH_DI, MT.HALLOWEEN, MT.CO_3], lights: (o) => (o.night ? [{ type: MT.GLOW, x: -360, y: -480, r: 120, color: MT.FFC070, alpha: 0.35 }] : []) },
  );
  reg(
    MT.ABANDONED_HOUSE,
    MT.NHA_HOANG_DO_NAT,
    MT.URBAN,
    [540, 480],
    (g, o) => {
      const wall = nt(o.color || MT.A89C86, o, 0.55),
        roof = nt(MT.VALUE_5A4A42, o, 0.5),
        wood = nt(MT.VALUE_7A6A58, o, 0.5),
        board = nt(MT.VALUE_9A7A58, o, 0.5),
        dkw = C.shade(wall, -0.4);
      const r = rng(o, 21);
      R(g, 100, -450, 40, 110, nt(MT.VALUE_7A5248, o, 0.5), 3, { lw: 1.4 });
      PL(
        g,
        [
          [96, -450],
          [144, -450],
          [144, -462],
          [130, -476],
          [118, -458],
          [104, -468],
        ],
        nt(MT.VALUE_7A5248, o, 0.5),
        1,
        { lw: 1.2 },
      );
      const body = K.rect(-220, -300, 440, 300);
      F(g, body, wall, 12, { lw: 1.8 });
      siding(g, body, -220, -300, 440, 300, 15, dkw, 0.4);
      g.save();
      g.clip(body);
      for (let i = 0; i < 6; i++) {
        g.globalAlpha = 0.35;
        F(g, K.ell(-200 + r() * 400, -280 + r() * 260, 20 + r() * 26, 8 + r() * 10), C.shade(wall, -0.18), 0, { ink: false });
      }
      g.restore();
      const rp = K.poly([
        [-256, -292],
        [0, -476],
        [256, -292],
      ]);
      F(g, rp, roof, 10, { lw: 1.8 });
      const sh = [];
      for (let y = -460; y < -292; y += 18) {
        const hw = ((y + 476) / 184) * 256;
        sh.push([-hw, y, hw, y]);
        for (let x = -hw + ((y / 18) % 2) * 15; x < hw; x += 30) sh.push([x, y, x, y + 18]);
      }
      marks(g, rp, C.shade(roof, 0.25), 1.2, sh, 0.4);
      for (const [hx, hy, hw, hh] of [
        [-120, -360, 70, 40],
        [60, -410, 50, 34],
      ]) {
        const hp = K.poly([
          [hx, hy],
          [hx + hw * 0.6, hy - hh * 0.2],
          [hx + hw, hy + hh * 0.5],
          [hx + hw * 0.4, hy + hh],
          [hx - hw * 0.1, hy + hh * 0.6],
        ]);
        F(g, hp, MT.VALUE_141016, 0, { lw: 1.2 });
        marks(
          g,
          hp,
          nt(MT.VALUE_6A5040, o, 0.4),
          4,
          [
            [hx + 10, hy - 10, hx - 10, hy + hh + 10],
            [hx + 40, hy - 10, hx + 20, hy + hh + 10],
          ],
          1,
        );
      }
      SK(
        g,
        [
          [-256, -292],
          [0, -476],
          [256, -292],
        ],
        C.shade(wood, 0.1),
        5,
        false,
      );
      E(g, 0, -360, 24, 24, wood, 1, { lw: 1.3 });
      win(g, -18, -378, 36, 36, o, false, { frame: wood, broken: r, sill: false, cross: false, arch: true });
      win(g, -180, -268, 64, 90, o, false, { frame: wood, board });
      win(g, 116, -268, 64, 90, o, !!o.night && r() > 0.3, { frame: wood, broken: r });
      win(g, -186, -150, 70, 92, o, false, { frame: wood, board });
      win(g, 118, -150, 70, 92, o, false, { frame: wood, broken: r });
      R(g, -38, -176, 76, 132, MT.VALUE_16121A, 0, { lw: 1.4 });
      F(
        g,
        K.poly([
          [-38, -176],
          [-10, -168],
          [-10, -48],
          [-38, -44],
        ]),
        C.shade(board, -0.12),
        2,
        { lw: 1.3 },
      );
      F(
        g,
        K.poly([
          [-250, -46],
          [250, -52],
          [250, -40],
          [-250, -34],
        ]),
        wood,
        2,
        { lw: 1.4 },
      );
      for (const px of [-80, 80, 232]) R(g, px - 6, px < 0 ? -186 : -194, 12, px < 0 ? 140 : 148, wood, 2, { lw: 1.3 });
      const pr = K.poly([
        [-256, -150],
        [-80, -198],
        [256, -214],
        [256, -196],
        [-80, -182],
        [-256, -136],
      ]);
      F(g, pr, roof, 5, { lw: 1.5 });
      F(
        g,
        K.poly([
          [-226, -18],
          [-110, -40],
          [-106, -28],
          [-222, -6],
        ]),
        C.shade(wood, -0.1),
        2,
        { lw: 1.3 },
      );
      R(g, -40, -34, 80, 12, wood, 1, { lw: 1.2 });
      F(
        g,
        K.poly([
          [-30, -22],
          [40, -22],
          [30, -10],
          [-40, -6],
        ]),
        C.shade(wood, 0.1),
        1,
        { lw: 1.2 },
      );
      const grass = [];
      for (let i = 0; i < 26; i++) {
        const gx = -250 + r() * 500;
        grass.push([gx, 0, gx + (r() - 0.5) * 16, -14 - r() * 22]);
      }
      marks(g, null, nt(MT.VALUE_6A7A3A, o, 0.5), 2.2, grass, 1);
    },
    { tags: [MT.NHA_HOANG, MT.BO_HOANG, MT.DO_NAT, MT.KINH_DI, MT.MA], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 148, y: -222, r: 90, color: MT.FFC070, alpha: 0.3 }] : []) },
  );
  reg(
    MT.MAUSOLEUM,
    MT.LANG_MO_DA,
    MT.URBAN,
    [380, 360],
    (g, o) => {
      const st = nt(o.color || MT.BCB6A6, o, 0.55),
        dk = C.shade(st, -0.35),
        door = nt(MT.VALUE_3A5A50, o, 0.45);
      const r = rng(o, 31);
      R(g, -190, -16, 380, 16, C.shade(st, -0.08), 2, { lw: 1.4 });
      R(g, -174, -30, 348, 14, st, 2, { lw: 1.4 });
      R(g, -160, -44, 320, 14, C.shade(st, 0.05), 2, { lw: 1.4 });
      const body = K.rect(-150, -262, 300, 218);
      F(g, body, st, 10, { lw: 1.7 });
      blocks(g, body, -150, -262, 300, 218, 22, 50, dk, 0.3);
      F(g, K.rect(-52, -218, 104, 174), C.shade(st, -0.2), 2, { lw: 1.3 });
      R(g, -44, -210, 88, 166, door, 4, { lw: 1.4 });
      SK(
        g,
        [
          [0, -210],
          [0, -44],
        ],
        C.shade(door, -0.35),
        2,
        false,
      );
      for (const s of [-1, 1]) {
        RR(g, s * 22 - 14, -190, 28, 50, 3, C.shade(door, 0.08), 1, { lw: 1.1 });
        RR(g, s * 22 - 14, -126, 28, 64, 3, C.shade(door, 0.08), 1, { lw: 1.1 });
        E(g, s * 8, -120, 3.5, 3.5, nt(MT.C8A050, o, 0.4), 0, { lw: 1 });
      }
      RR(g, -60, -246, 120, 22, 2, C.shade(st, 0.12), 1, { lw: 1.2 });
      marks(
        g,
        null,
        dk,
        1.4,
        [
          [-46, -235, -14, -235],
          [-6, -235, 22, -235],
          [30, -235, 46, -235],
        ],
        0.7,
      );
      for (const cx of [-108, 108]) colm(g, cx, -44, -250, 34, C.shade(st, 0.08), MT.DORIC);
      for (const px of [-146, 146]) R(g, px - 8, -262, 16, 218, C.shade(st, 0.04), 1, { lw: 1.2 });
      R(g, -172, -290, 344, 30, st, 4, { lw: 1.5 });
      R(g, -180, -298, 360, 10, C.shade(st, 0.08), 1, { lw: 1.3 });
      PL(
        g,
        [
          [-182, -298],
          [0, -372],
          [182, -298],
        ],
        st,
        6,
        { lw: 1.6 },
      );
      PL(
        g,
        [
          [-150, -304],
          [0, -362],
          [150, -304],
        ],
        C.shade(st, -0.12),
        1,
        { lw: 1.2 },
      );
      E(g, 0, -326, 12, 12, C.shade(st, 0.1), 1, { lw: 1.2 });
      SK(
        g,
        [
          [0, -336],
          [0, -316],
        ],
        dk,
        2.5,
        false,
      );
      SK(
        g,
        [
          [-7, -330],
          [7, -330],
        ],
        dk,
        2.5,
        false,
      );
      for (const ux of [-168, 168]) {
        F(
          g,
          K.poly(
            [
              [ux - 12, -298],
              [ux + 12, -298],
              [ux + 16, -318],
              [ux + 8, -330],
              [ux - 8, -330],
              [ux - 16, -318],
            ],
            true,
          ),
          C.shade(st, 0.05),
          2,
          { lw: 1.2 },
        );
        R(g, ux - 10, -336, 20, 6, st, 0, { lw: 1 });
      }
      g.save();
      g.clip(body);
      g.globalAlpha = 0.45;
      for (let i = 0; i < 5; i++) F(g, K.ell(-140 + r() * 280, -44 - r() * 20, 22 + r() * 20, 10 + r() * 8), nt(MT.VALUE_5A7A3A, o, 0.5), 0, { ink: false });
      g.restore();
      crack(g, 120, -250, 70, dk, r);
    },
    { tags: [MT.LANG_MO, MT.NGHIA_TRANG, MT.MO, MT.KINH_DI, MT.DA] },
  );
  reg(
    MT.RUINED_CHURCH,
    MT.NHA_THO_DO_NAT,
    MT.URBAN,
    [580, 640],
    (g, o) => {
      const st = nt(o.color || MT.VALUE_9A968A, o, 0.55),
        dk = C.shade(st, -0.4),
        hole = MT.VALUE_15151D,
        beam = nt(MT.VALUE_4A3A30, o, 0.45);
      const r = rng(o, 41);
      const nave = K.poly([
        [140, 0],
        [140, -330],
        [170, -340],
        [190, -310],
        [220, -330],
        [250, -290],
        [270, -300],
        [290, -260],
        [290, 0],
      ]);
      F(g, nave, C.shade(st, -0.1), 6, { lw: 1.6 });
      blocks(g, nave, 140, -340, 150, 340, 26, 46, dk, 0.3);
      F(g, gothP(200, -260, 50, 150), hole, 0, { lw: 1.3 });
      limb(
        g,
        [
          [150, -420],
          [250, -330],
        ],
        12,
        12,
        beam,
        1,
      );
      limb(
        g,
        [
          [150, -380],
          [214, -320],
        ],
        10,
        10,
        beam,
        1,
      );
      limb(
        g,
        [
          [200, -380],
          [300, -300],
        ],
        10,
        10,
        beam,
        1,
      );
      const tw = K.poly([
        [-290, 0],
        [-290, -560],
        [-272, -580],
        [-252, -560],
        [-236, -604],
        [-214, -572],
        [-192, -592],
        [-160, -540],
        [-160, 0],
      ]);
      F(g, tw, C.shade(st, 0.04), 8, { lw: 1.7 });
      blocks(g, tw, -290, -604, 130, 604, 26, 44, dk, 0.3);
      F(g, gothP(-250, -510, 50, 90), hole, 0, { lw: 1.3 });
      F(g, gothP(-238, -300, 26, 70), hole, 0, { lw: 1.2 });
      const fac = K.poly([
        [-170, 0],
        [-170, -400],
        [-30, -540],
        [-12, -556],
        [10, -522],
        [30, -534],
        [62, -484],
        [84, -492],
        [110, -446],
        [140, -430],
        [170, -400],
        [170, 0],
      ]);
      F(g, fac, st, 10, { lw: 1.8 });
      blocks(g, fac, -170, -560, 340, 560, 26, 48, dk, 0.3);
      for (const bx of [-188, 166]) {
        PL(
          g,
          [
            [bx, 0],
            [bx, -280],
            [bx + 11, -300],
            [bx + 22, -280],
            [bx + 22, 0],
          ],
          C.shade(st, 0.06),
          3,
          { lw: 1.4 },
        );
      }
      const gw = gothP(-74, -446, 148, 256);
      F(g, gw, C.shade(st, 0.12), 0, { lw: 1.5 });
      F(g, gothP(-62, -434, 124, 238), hole, 0, { lw: 1.3 });
      SK(
        g,
        [
          [0, -198],
          [0, -300],
        ],
        C.shade(st, 0.12),
        6,
        false,
      );
      SK(
        g,
        [
          [-62, -320],
          [-30, -360],
          [0, -330],
        ],
        C.shade(st, 0.12),
        5,
        false,
      );
      SK(
        g,
        [
          [0, -300],
          [-14, -312],
        ],
        C.shade(st, 0.12),
        6,
        false,
      );
      const gl = [
        [-58, -250, -30, -230],
        [30, -270, 58, -240],
      ];
      for (const q of gl)
        F(
          g,
          K.poly([
            [q[0], q[1]],
            [q[2], q[1] + 6],
            [q[2] - 6, q[3]],
            [q[0] + 4, q[3] - 4],
          ]),
          nt(MT.VALUE_7A4A8A, o, 0.4),
          0,
          { lw: 1 },
        );
      F(g, gothP(-52, -156, 104, 156), C.shade(st, 0.1), 0, { lw: 1.4 });
      F(g, gothP(-42, -146, 84, 146), hole, 0, { lw: 1.2 });
      F(
        g,
        K.poly([
          [-42, -110],
          [-6, -100],
          [-6, 0],
          [-42, 0],
        ]),
        nt(MT.VALUE_5A4030, o, 0.45),
        2,
        { lw: 1.3 },
      );
      SK(
        g,
        [
          [0, -556],
          [0, -600],
        ],
        dk,
        4,
        false,
      );
      for (let i = 0; i < 16; i++) {
        const rx = (r() > 0.5 ? 1 : -1) * (80 + r() * 200),
          rs = 8 + r() * 14;
        F(
          g,
          K.poly([
            [rx - rs, 0],
            [rx - rs * 0.7, -rs * 0.9],
            [rx + rs * 0.4, -rs],
            [rx + rs, -rs * 0.2],
            [rx + rs, 0],
          ]),
          C.shade(st, (r() - 0.5) * 0.2),
          2,
          { lw: 1.2 },
        );
      }
      g.save();
      g.clip(fac);
      g.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) F(g, K.ell(-150 + r() * 120, -380 + r() * 300, 26, 40), nt(MT.VALUE_4A6A34, o, 0.5), 0, { ink: false });
      g.restore();
      vines(g, -160, 0, 300, o, 3);
    },
    { tags: [MT.NHA_THO_2, MT.DO_NAT, MT.GOTHIC, MT.KINH_DI, MT.PHE_TICH] },
  );
  reg(
    MT.EGYPTIAN_TEMPLE,
    MT.DEN_AI_CAP_CO,
    MT.URBAN,
    [840, 520],
    (g, o) => {
      const sand = nt(o.color || MT.DCBC80, o, 0.55),
        dk = C.shade(sand, -0.35),
        blue = nt(MT.VALUE_2A5A9A, o, 0.45),
        red = nt(MT.B8422E, o, 0.45),
        gold = nt(MT.E2B544, o, 0.45);
      const r = rng(o, 51);
      const t = o.t || 0;
      for (const fx of [-330, -170, 170, 330]) {
        SK(
          g,
          [
            [fx, -380],
            [fx, -500],
          ],
          nt(MT.VALUE_7A5232, o, 0.45),
          5,
          false,
        );
        const wv = Math.sin(t * 3 + fx) * 6;
        PL(
          g,
          [
            [fx, -498],
            [fx + 40, -490 + wv],
            [fx + 34, -478 + wv],
            [fx, -472],
          ],
          fx < 0 ? red : blue,
          1,
          { lw: 1.1 },
        );
      }
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? -410 : 410,
          x1 = s < 0 ? -96 : 96;
        const py = K.poly([
          [x0, 0],
          [x1, 0],
          [x1 - s * 10, -390],
          [x0 + s * 40, -390],
        ]);
        F(g, py, sand, 12, { lw: 1.8 });
        blocks(g, py, Math.min(x0, x1), -390, 314, 390, 30, 70, dk, 0.22);
        const corn = K.poly([
          [x0 + s * 40, -390],
          [x1 - s * 10, -390],
          [x1 - s * 2, -420],
          [x0 + s * 28, -420],
        ]);
        F(g, corn, C.shade(sand, 0.06), 4, { lw: 1.5 });
        marks(
          g,
          corn,
          blue,
          3,
          Array.from({ length: 14 }, (_, i) => [Math.min(x0, x1) + 30 + i * 20, -416, Math.min(x0, x1) + 30 + i * 20, -396]),
          0.5,
        );
        R(g, Math.min(x0 + s * 28, x1 - s * 12) - 2, -396, 296, 6, C.shade(sand, -0.12), 0, { lw: 1 });
        const bx = s < 0 ? -380 : 116;
        R(g, bx, -360, 264, 40, C.shade(sand, 0.08), 0, { lw: 1.1 });
        glyphBand(g, bx, -360, 264, 40, 20, C.rgba(dk, 0.75), r);
        const fx = s < 0 ? -250 : 250;
        relief(g, fx, -50, 1.1, -s, C.rgba(dk, 0.55), C.rgba(blue, 0.6));
        R(g, bx + 12, -190, 34, 150, C.shade(sand, 0.08), 0, { lw: 1 });
        glyphBand(g, bx + 12, -190, 34, 150, 22, C.rgba(dk, 0.75), r);
        R(g, bx + 218, -190, 34, 150, C.shade(sand, 0.08), 0, { lw: 1 });
        glyphBand(g, bx + 218, -190, 34, 150, 22, C.rgba(dk, 0.75), r);
      }
      const gate = K.rect(-108, -300, 216, 300);
      F(g, gate, C.shade(sand, 0.04), 8, { lw: 1.7 });
      blocks(g, gate, -108, -300, 216, 300, 30, 54, dk, 0.22);
      F(
        g,
        K.poly([
          [-116, -300],
          [116, -300],
          [126, -330],
          [-126, -330],
        ]),
        C.shade(sand, 0.08),
        3,
        { lw: 1.5 },
      );
      R(g, -62, -236, 124, 236, MT.VALUE_1E1820, 0, { lw: 1.4 });
      const lit = !!o.night;
      if (lit) {
        g.save();
        g.globalAlpha = 0.6;
        F(g, K.rect(-54, -228, 108, 228), MT.FF9A40, 0, { ink: false, glow: MT.RGBA_255_150_60_0_8, glowR: 30 });
        g.restore();
      }
      E(g, 0, -272, 14, 14, red, 2, { lw: 1.3 });
      for (const s of [-1, 1]) {
        F(
          g,
          K.poly(
            [
              [s * 14, -280],
              [s * 90, -286],
              [s * 84, -272],
              [s * 60, -266],
              [s * 14, -266],
            ],
            true,
          ),
          blue,
          2,
          { lw: 1.2 },
        );
        SK(
          g,
          [
            [s * 22, -276],
            [s * 80, -280],
          ],
          gold,
          2,
          false,
        );
      }
      for (const cx of [-160, 160]) colm(g, cx, 0, -270, 54, C.shade(sand, 0.06), MT.PAPYRUS);
    },
    { tags: [MT.AI_CAP_2, MT.DEN_2, MT.CO_DAI, MT.PHARAOH, MT.SA_MAC], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -100, r: 160, color: MT.FF9A40, alpha: 0.4 }] : []) },
  );
  reg(
    MT.OBELISK,
    MT.COT_THAP_OBELISK,
    MT.URBAN,
    [120, 540],
    (g, o) => {
      const st = nt(o.color || MT.CFA982, o, 0.55),
        dk = C.shade(st, -0.38),
        gold = nt(MT.E8C050, o, 0.45);
      const r = rng(o, 61);
      R(g, -56, -22, 112, 22, C.shade(st, -0.1), 2, { lw: 1.4 });
      R(g, -46, -44, 92, 22, st, 2, { lw: 1.4 });
      const sh = K.poly([
        [-32, -44],
        [32, -44],
        [22, -470],
        [-22, -470],
      ]);
      F(g, sh, st, 10, { lw: 1.7 });
      g.save();
      g.clip(sh);
      g.globalAlpha = 0.18;
      g.fillStyle = MT.FFFFFF;
      g.fillRect(-30, -480, 10, 440);
      g.restore();
      for (let i = 0; i < 14; i++) glyph(g, Math.floor(r() * 7), 0, -420 + i * 26, 18 - i * 0.2, C.rgba(dk, 0.8));
      marks(
        g,
        null,
        dk,
        1,
        [
          [-11, -440, -14, -60],
          [11, -440, 14, -60],
        ],
        0.5,
      );
      PL(
        g,
        [
          [-22, -470],
          [22, -470],
          [0, -528],
        ],
        gold,
        4,
        { lw: 1.5, glow: o.night ? null : null },
      );
    },
    { tags: [MT.AI_CAP_2, MT.COT, MT.OBELISK, MT.CO_DAI, MT.TUONG_DAI] },
  );
  reg(
    MT.SPHINX,
    MT.TUONG_NHAN_SU,
    MT.URBAN,
    [640, 380],
    (g, o) => {
      const st = nt(o.color || MT.D6B47C, o, 0.55),
        dk = C.shade(st, -0.35),
        lt = C.shade(st, 0.08);
      const r = rng(o, 71);
      const pl = K.rect(-320, -40, 640, 40);
      F(g, pl, C.shade(st, -0.08), 3, { lw: 1.5 });
      blocks(g, pl, -320, -40, 640, 40, 20, 80, dk, 0.3);
      tube(
        g,
        [
          [-292, -60],
          [-250, -48],
          [-210, -54],
        ],
        12,
        8,
        st,
        1,
      );
      RR(g, -200, -84, 120, 44, [12, 20, 6, 6], C.shade(st, -0.1), 3, { lw: 1.4 });
      const body = K.poly(
        [
          [-292, -44],
          [-296, -110],
          [-254, -172],
          [-150, -184],
          [0, -178],
          [100, -198],
          [170, -206],
          [206, -150],
          [214, -90],
          [224, -44],
        ],
        true,
      );
      F(g, body, st, 14, { lw: 1.8 });
      E(g, -200, -116, 92, 70, st, 6, { lw: 1.5 });
      marks(
        g,
        body,
        dk,
        1.4,
        [
          [-270, -110, -100, -120],
          [-80, -150, 120, -160],
          [-200, -60, 180, -60],
          [40, -100, 180, -110],
        ],
        0.25,
      );
      RR(g, 120, -88, 196, 48, [10, 24, 22, 8], lt, 4, { lw: 1.5 });
      marks(
        g,
        null,
        dk,
        1.5,
        [
          [296, -74, 316, -74],
          [294, -62, 316, -62],
          [296, -50, 314, -50],
        ],
        0.7,
      );
      RR(g, 96, -70, 190, 30, [8, 18, 14, 6], st, 3, { lw: 1.4 });
      const nm = K.poly(
        [
          [96, -196],
          [112, -326],
          [148, -352],
          [196, -348],
          [214, -300],
          [224, -196],
        ],
        true,
      );
      F(g, nm, st, 8, { lw: 1.6 });
      const ns = [];
      for (let y = -330; y < -196; y += 12) ns.push([96, y, 230, y + 6]);
      marks(g, nm, dk, 2, ns, 0.4);
      F(
        g,
        K.poly(
          [
            [194, -342],
            [224, -338],
            [230, -302],
            [246, -286],
            [234, -278],
            [236, -262],
            [228, -254],
            [230, -240],
            [214, -228],
            [196, -232],
          ],
          true,
        ),
        lt,
        4,
        { lw: 1.5 },
      );
      E(g, 176, -290, 11, 20, st, 2, { lw: 1.3 });
      F(g, K.ell(218, -302, 7, 3.4), MT.VALUE_3A2A20, 0, { lw: 1 });
      SK(
        g,
        [
          [206, -310],
          [226, -312],
        ],
        dk,
        2,
        false,
      );
      SK(
        g,
        [
          [220, -262],
          [232, -262],
        ],
        dk,
        2,
        false,
      );
      RR(g, 212, -236, 14, 34, 4, st, 2, { lw: 1.3 });
      F(
        g,
        K.poly([
          [186, -234],
          [212, -226],
          [206, -168],
          [182, -172],
        ]),
        st,
        2,
        { lw: 1.3 },
      );
      marks(
        g,
        K.poly([
          [186, -234],
          [212, -226],
          [206, -168],
          [182, -172],
        ]),
        dk,
        2,
        [
          [180, -218, 214, -210],
          [180, -200, 214, -192],
          [180, -184, 214, -176],
        ],
        0.45,
      );
      SK(
        g,
        [
          [222, -340],
          [226, -356],
          [232, -346],
        ],
        dk,
        3,
        false,
      );
      crack(g, -60, -178, 60, dk, r);
      crack(g, 140, -204, 50, dk, r);
    },
    { tags: [MT.NHAN_SU, MT.AI_CAP_2, MT.TUONG_2, MT.CO_DAI, MT.SA_MAC, MT.PHARAOH] },
  );
  reg(
    MT.GREEK_TEMPLE,
    MT.DEN_HY_LAP_CO,
    MT.URBAN,
    [820, 560],
    (g, o) => {
      const mb = nt(o.color || MT.ECE6DA, o, 0.55),
        dk = C.shade(mb, -0.35),
        sh = C.shade(mb, -0.28);
      R(g, -410, -16, 820, 16, C.shade(mb, -0.08), 2, { lw: 1.4 });
      R(g, -390, -32, 780, 16, C.shade(mb, -0.04), 2, { lw: 1.4 });
      R(g, -370, -48, 740, 16, mb, 2, { lw: 1.4 });
      F(g, K.rect(-330, -380, 660, 332), sh, 0, { lw: 1.4 });
      R(g, -60, -250, 120, 202, nt(MT.VALUE_4A4038, o, 0.4), 0, { lw: 1.2 });
      if (o.night) F(g, K.rect(-52, -242, 104, 194), MT.FFB860, 0, { ink: false, glow: MT.RGBA_255_170_80_0_7, glowR: 26 });
      for (let i = 0; i < 6; i++) colm(g, -300 + i * 120, -48, -364, 56, mb, MT.DORIC);
      R(g, -360, -406, 720, 42, mb, 4, { lw: 1.6 });
      const fr = K.rect(-360, -446, 720, 40);
      F(g, fr, mb, 3, { lw: 1.5 });
      for (let x = -350; x < 350; x += 40) {
        R(g, x, -442, 18, 32, C.shade(mb, -0.12), 0, { lw: 1 });
        marks(
          g,
          null,
          dk,
          1.4,
          [
            [x + 6, -440, x + 6, -412],
            [x + 12, -440, x + 12, -412],
          ],
          0.5,
        );
      }
      R(g, -376, -458, 752, 12, C.shade(mb, 0.04), 2, { lw: 1.4 });
      PL(
        g,
        [
          [-380, -456],
          [0, -560],
          [380, -456],
        ],
        mb,
        8,
        { lw: 1.7 },
      );
      PL(
        g,
        [
          [-330, -464],
          [0, -546],
          [330, -464],
        ],
        C.shade(mb, -0.14),
        1,
        { lw: 1.2 },
      );
      for (const [x, h] of [
        [-120, 30],
        [-60, 46],
        [0, 56],
        [60, 46],
        [120, 30],
      ]) {
        E(g, x, -464 - h + 8, 7, 7, C.shade(mb, -0.05), 0, { lw: 1 });
        RR(g, x - 7, -464 - h + 14, 14, h - 14, 4, C.shade(mb, -0.05), 0, { lw: 1 });
      }
      SK(
        g,
        [
          [-384, -458],
          [0, -566],
          [384, -458],
        ],
        C.shade(mb, 0.1),
        4,
        false,
      );
      E(g, 0, -570, 8, 8, mb, 1, { lw: 1.1 });
    },
    { tags: [MT.HY_LAP_2, MT.DEN_2, MT.PARTHENON, MT.CO_DAI, MT.COT_DA], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -150, r: 140, color: MT.FFB860, alpha: 0.35 }] : []) },
  );
  reg(
    MT.ROMAN_ARCH,
    MT.KHAI_HOAN_MON_LA_MA,
    MT.URBAN,
    [540, 540],
    (g, o) => {
      const st = nt(o.color || MT.D8CCAE, o, 0.55),
        dk = C.shade(st, -0.35),
        bronze = nt(MT.A07A3A, o, 0.45);
      const body = K.P();
      body.moveTo(-260, -420);
      body.lineTo(260, -420);
      body.lineTo(260, 0);
      body.lineTo(-260, 0);
      body.closePath();
      holeArch(body, -82, -330, 164, 330);
      holeArch(body, -186, -210, 62, 210);
      holeArch(body, 124, -210, 62, 210);
      F(g, body, st, 12, { lw: 1.8 });
      blocks(g, body, -260, -420, 520, 420, 28, 60, dk, 0.22);
      for (const [x, w, h] of [
        [-82, 164, 330],
        [-186, 62, 210],
        [124, 62, 210],
      ]) {
        const ap = K.P();
        ap.arc(x + w / 2, -h + w / 2, w / 2 + 10, PI, 0);
        ap.arc(x + w / 2, -h + w / 2, w / 2, 0, PI, true);
        ap.closePath();
        F(g, ap, C.shade(st, 0.08), 1, { lw: 1.3 });
        const vs = [];
        for (let i = 1; i < 9; i++) {
          const a = PI + (i * PI) / 9;
          vs.push([x + w / 2 + Math.cos(a) * (w / 2), -h + w / 2 + Math.sin(a) * (w / 2), x + w / 2 + Math.cos(a) * (w / 2 + 10), -h + w / 2 + Math.sin(a) * (w / 2 + 10)]);
        }
        marks(g, ap, dk, 1.2, vs, 0.6);
        R(g, x - 4, -h + w / 2 - 4, 8, 8, C.shade(st, 0.08), 0, { lw: 1 });
        R(g, x + w - 4, -h + w / 2 - 4, 8, 8, C.shade(st, 0.08), 0, { lw: 1 });
      }
      for (const cx of [-226, -104, 104, 226]) {
        R(g, cx - 24, -70, 48, 70, C.shade(st, 0.04), 3, { lw: 1.4 });
        colm(g, cx, -70, -330, 30, C.shade(st, 0.1), MT.IONIC);
      }
      for (const cx of [-155, 155]) {
        E(g, cx, -282, 34, 34, C.shade(st, -0.06), 2, { lw: 1.3 });
        E(g, cx, -282, 26, 26, C.shade(st, -0.14), 0, { lw: 1 });
        E(g, cx, -286, 9, 12, C.shade(st, 0.05), 0, { lw: 1 });
        R(g, cx - 14, -276, 28, 16, C.shade(st, 0.05), 0, { lw: 1 });
      }
      E(g, 0, -342, 10, 10, C.shade(st, 0.1), 1, { lw: 1.1 });
      R(g, -272, -366, 544, 26, C.shade(st, 0.06), 3, { lw: 1.5 });
      const at = K.rect(-252, -502, 504, 136);
      F(g, at, st, 6, { lw: 1.6 });
      R(g, -262, -512, 524, 12, C.shade(st, 0.08), 2, { lw: 1.4 });
      R(g, -156, -486, 312, 104, C.shade(st, 0.06), 2, { lw: 1.4 });
      const tx = [];
      for (let row = 0; row < 4; row++) {
        let x = -138;
        const rr = rng(o, 80 + row);
        while (x < 130) {
          const wl = 14 + rr() * 30;
          if (x + wl > 138) break;
          tx.push([x, -466 + row * 22, x + wl, -466 + row * 22]);
          x += wl + 10;
        }
      }
      marks(g, null, bronze, 4, tx, 0.85);
    },
    { tags: [MT.LA_MA_2, MT.KHAI_HOAN_MON, MT.CO_DAI, MT.CONG_2, MT.TUONG_DAI] },
  );
  reg(
    MT.COLOSSEUM_WALL,
    MT.TUONG_DAU_TRUONG_LA_MA,
    MT.URBAN,
    [920, 560],
    (g, o) => {
      const st = nt(o.color || MT.D4BF96, o, 0.55),
        dk = C.shade(st, -0.35),
        inside = nt(MT.VALUE_6A5642, o, 0.4);
      const shape = K.poly([
        [-460, 0],
        [-460, -540],
        [90, -540],
        [120, -524],
        [150, -470],
        [196, -462],
        [230, -404],
        [290, -394],
        [320, -320],
        [380, -300],
        [410, -220],
        [460, -200],
        [460, 0],
      ]);
      F(g, shape, st, 0, { lw: 1.8 });
      g.save();
      g.clip(shape);
      const N = 9,
        A = 1.15;
      const X = (u) => (460 * Math.sin(u * A)) / Math.sin(A);
      const tiers = [
        [0, -150],
        [-170, -300],
        [-320, -440],
      ];
      for (let i = 0; i < N; i++) {
        const u0 = -1 + (2 * i) / N,
          u1 = -1 + (2 * (i + 1)) / N;
        const x0 = X(u0),
          x1 = X(u1),
          bw = x1 - x0;
        for (const [yb, yt] of tiers) {
          const aw = bw * 0.62,
            ax = x0 + (bw - aw) / 2;
          const ah = (yb - yt) * 0.8;
          const ap = archP(ax, yb - ah, aw, ah);
          F(g, ap, inside, 0, { lw: 1.3 });
          g.save();
          g.clip(ap);
          g.globalAlpha = 0.35;
          g.fillStyle = MT.VALUE_000000;
          g.fillRect(ax, yb - ah, aw * 0.35, ah);
          g.restore();
          const ring = K.P();
          ring.arc(ax + aw / 2, yb - ah + aw / 2, aw / 2 + 6, PI, 0);
          ring.arc(ax + aw / 2, yb - ah + aw / 2, aw / 2, 0, PI, true);
          ring.closePath();
          F(g, ring, C.shade(st, 0.08), 0, { lw: 1.1 });
          R(g, x0 - bw * 0.06, yt + 4, bw * 0.12, yb - yt - 4, C.shade(st, 0.06), 2, { lw: 1.2 });
        }
        if (i % 2 === 0) R(g, x0 + bw * 0.38, -508, bw * 0.24, 34, inside, 0, { lw: 1.2 });
        R(g, x0 - bw * 0.05, -536, bw * 0.1, 96, C.shade(st, 0.04), 1, { lw: 1.1 });
      }
      for (const [y, h] of [
        [-170, 20],
        [-320, 20],
        [-452, 14],
        [-548, 12],
      ])
        R(g, -470, y, 940, h, C.shade(st, 0.1), 2, { lw: 1.4 });
      blocks(g, null, -460, -540, 920, 540, 30, 70, dk, 0.16);
      const gr = g.createLinearGradient(-460, 0, 460, 0);
      gr.addColorStop(0, MT.RGBA_40_30_20_0_32);
      gr.addColorStop(0.35, MT.RGBA_40_30_20_0);
      gr.addColorStop(0.7, MT.RGBA_40_30_20_0);
      gr.addColorStop(1, MT.RGBA_40_30_20_0_28);
      g.fillStyle = gr;
      g.fillRect(-460, -560, 920, 560);
      g.restore();
      inkLine(g, shape, 1.8);
    },
    { tags: [MT.DAU_TRUONG, MT.COLOSSEUM, MT.LA_MA_2, MT.CO_DAI, MT.TUONG_3] },
  );
  const flame = (g, x, y, s, o) => {
    const t = o.t || 0;
    const f = 1 + Math.sin(t * 17 + x) * 0.12;
    if (o.night) glowAt(g, x, y - 10 * s, 70 * s, MT.FFB050, 0.5);
    F(
      g,
      K.poly(
        [
          [x - 9 * s, y],
          [x - 7 * s, y - 14 * s * f],
          [x, y - 26 * s * f],
          [x + 7 * s, y - 14 * s * f],
          [x + 9 * s, y],
        ],
        true,
      ),
      MT.FF9A30,
      0,
      { lw: 1, glow: MT.RGBA_255_150_50_0_8, glowR: 16 },
    );
    F(
      g,
      K.poly(
        [
          [x - 4 * s, y],
          [x, y - 14 * s * f],
          [x + 4 * s, y],
        ],
        true,
      ),
      MT.FFE27A,
      0,
      { ink: false },
    );
  };
  const lantern = (g, x, y, s, o, col) => {
    const sw = Math.sin((o.t || 0) * 2 + x) * 0.05;
    g.save();
    g.translate(x, y);
    g.rotate(sw);
    SK(
      g,
      [
        [0, 0],
        [0, 12 * s],
      ],
      MT.VALUE_2A2426,
      1.5,
      false,
    );
    const on = !!o.night;
    E(g, 0, 28 * s, 13 * s, 16 * s, on ? C.mix(col, MT.FFD889, 0.35) : nt(col, o, 0.4), 2, { lw: 1.2, glow: on ? MT.RGBA_255_120_70_0_8 : null, glowR: 22 });
    R(g, -7 * s, 10 * s, 14 * s, 4 * s, MT.VALUE_2A2426, 0, { lw: 1 });
    R(g, -7 * s, 42 * s, 14 * s, 4 * s, MT.VALUE_2A2426, 0, { lw: 1 });
    g.restore();
  };
  const shoji = (g, x, y, w, h, o, lit, wood) => {
    const p = K.rect(x, y, w, h);
    F(g, p, lit ? MT.FFDC9C : nt(MT.F4EFE2, o, 0.45), 0, { lw: 1.3, glow: lit ? MT.RGBA_255_200_120_0_6 : null, glowR: 16 });
    const segs = [];
    for (let i = 1; i < 3; i++) segs.push([x + (w * i) / 3, y, x + (w * i) / 3, y + h]);
    for (let j = 1; j < 5; j++) segs.push([x, y + (h * j) / 5, x + w, y + (h * j) / 5]);
    marks(g, p, wood, 2, segs, 0.85);
    inkLine(g, p, 1.2);
  };
  reg(
    MT.TORII_GATE,
    MT.CONG_TORII_NHAT_BAN,
    MT.URBAN,
    [460, 400],
    (g, o) => {
      const red = nt(o.color || MT.D23A2A, o, 0.45),
        blk = nt(MT.VALUE_2A2426, o, 0.3),
        gold = nt(MT.E2B544, o, 0.45);
      for (const s of [-1, 1]) {
        const x = s * 130;
        PL(
          g,
          [
            [x - 17, 0],
            [x + 17, 0],
            [x + 13, -340],
            [x - 13, -340],
          ],
          red,
          6,
          { lw: 1.6 },
        );
        R(g, x - 21, -34, 42, 34, blk, 3, { lw: 1.4 });
      }
      R(g, -184, -264, 368, 24, red, 4, { lw: 1.5 });
      R(g, -12, -322, 24, 60, red, 2, { lw: 1.3 });
      RR(g, -30, -318, 60, 52, 3, blk, 2, { lw: 1.3 });
      R(g, -24, -312, 48, 40, C.shade(blk, 0.1), 0, { lw: 1 });
      marks(
        g,
        null,
        gold,
        3,
        [
          [-8, -304, 8, -304],
          [0, -310, 0, -280],
          [-10, -290, 10, -290],
        ],
        0.9,
      );
      R(g, -188, -340, 376, 22, red, 4, { lw: 1.5 });
      const k1 = K.P();
      k1.moveTo(-216, -366);
      k1.quadraticCurveTo(0, -340, 216, -366);
      k1.lineTo(210, -346);
      k1.quadraticCurveTo(0, -322, -210, -346);
      k1.closePath();
      F(g, k1, red, 4, { lw: 1.5 });
      const k2 = K.P();
      k2.moveTo(-228, -392);
      k2.quadraticCurveTo(0, -352, 228, -392);
      k2.lineTo(220, -366);
      k2.quadraticCurveTo(0, -338, -220, -366);
      k2.closePath();
      F(g, k2, blk, 5, { lw: 1.6 });
    },
    { tags: [MT.NHAT_BAN_2, MT.TORII, MT.CONG_2, MT.DEN_2, MT.THAN_DAO] },
  );
  reg(
    MT.JAPANESE_HOUSE,
    MT.NHA_GO_NHAT_BAN,
    MT.URBAN,
    [640, 420],
    (g, o) => {
      const wood = nt(MT.VALUE_5A3A28, o, 0.4),
        plaster = nt(MT.EFE8D8, o, 0.55),
        tile = nt(o.color || MT.VALUE_4A5462, o, 0.4),
        stone = nt(MT.VALUE_8A8A86, o, 0.5);
      const r = rng(o, 91);
      const base = K.rect(-270, -40, 540, 40);
      F(g, base, stone, 3, { lw: 1.5 });
      blocks(g, base, -270, -40, 540, 40, 20, 60, C.shade(stone, -0.4), 0.4);
      R(g, -284, -62, 568, 22, C.shade(wood, 0.25), 3, { lw: 1.5 });
      R(g, -250, -290, 500, 230, C.shade(wood, -0.2), 0, { lw: 1.4 });
      for (let b = 0; b < 5; b++) {
        const bx = -250 + b * 100;
        if (b === 2) {
          R(g, bx + 8, -232, 84, 170, nt(MT.VALUE_3A2A20, o, 0.3), 0, { lw: 1.2 });
          F(g, K.rect(bx + 8, -96, 84, 34), nt(MT.B8A868, o, 0.4), 0, { lw: 1 });
          if (o.night) F(g, K.rect(bx + 8, -232, 84, 170), MT.RGBA_255_190_110_0_35, 0, { ink: false });
          continue;
        }
        const lit = !!o.night && r() > 0.25;
        shoji(g, bx + 8, -232, 42, 170, o, lit, wood);
        shoji(g, bx + 50, -232, 42, 170, o, lit, wood);
      }
      for (let i = 0; i <= 5; i++) R(g, -257 + i * 100, -290, 14, 230, wood, 2, { lw: 1.4 });
      R(g, -260, -244, 520, 12, wood, 1, { lw: 1.3 });
      const up = K.rect(-250, -292, 500, 46);
      F(g, up, plaster, 2, { lw: 1.3 });
      for (let i = 0; i < 5; i++) R(g, -232 + i * 100, -284, 64, 30, C.shade(wood, 0.1), 0, { lw: 1 });
      const roof = curvedRoof(0, -410, 340, -282, 660, 22, 18);
      roofDo(g, roof, tile, [-330, 330, -410, -282, 14, 0.45]);
      tileEdge(g, -300, 300, -266, 14, C.shade(tile, 0.08));
      R(g, -182, -426, 364, 18, C.shade(tile, -0.2), 2, { lw: 1.4 });
      for (const s of [-1, 1])
        F(
          g,
          K.poly(
            [
              [s * 182, -426],
              [s * 204, -446],
              [s * 210, -416],
              [s * 182, -408],
            ],
            true,
          ),
          C.shade(tile, -0.25),
          1,
          { lw: 1.3 },
        );
      lantern(g, 236, -262, 1.2, o, MT.D83A2A);
      for (const bx of [-300, 290]) E(g, bx, -16, 36, 22, nt(MT.VALUE_4A7A4A, o, 0.5), 4, { lw: 1.3 });
    },
    { tags: [MT.NHAT_BAN_2, MT.NHA_GO, MT.NHA_CO, MT.CHAU_A], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -150, r: 260, color: MT.FFC880, alpha: 0.3 }] : []) },
  );
  reg(
    MT.SHINTO_SHRINE,
    MT.DEN_THAN_DAO,
    MT.URBAN,
    [400, 440],
    (g, o) => {
      const red = nt(MT.C8342A, o, 0.45),
        wall = nt(MT.F2ECE0, o, 0.55),
        cu = nt(o.color || MT.VALUE_4A8A78, o, 0.45),
        wood = nt(MT.VALUE_6A4A30, o, 0.45),
        stone = nt(MT.VALUE_9A968E, o, 0.5),
        gold = nt(MT.E2B544, o, 0.45),
        rope = nt(MT.D8C48A, o, 0.45);
      const base = K.rect(-170, -48, 340, 48);
      F(g, base, stone, 4, { lw: 1.5 });
      blocks(g, base, -170, -48, 340, 48, 24, 56, C.shade(stone, -0.4), 0.4);
      for (let i = 0; i < 3; i++) R(g, -60 + i * 6, -16 * (i + 1), 120 - i * 12, 16, C.shade(stone, 0.06 * i), 2, { lw: 1.3 });
      R(g, -124, -232, 248, 184, wall, 6, { lw: 1.6 });
      const lit = !!o.night;
      for (const dx of [-100, 8]) {
        const dp = K.rect(dx, -200, 92, 140);
        F(g, dp, lit ? MT.FFDC9C : C.shade(wood, 0.15), 0, { lw: 1.3, glow: lit ? MT.RGBA_255_200_120_0_6 : null, glowR: 16 });
        const ls = [];
        for (let i = 1; i < 6; i++) ls.push([dx + (92 * i) / 6, -200, dx + (92 * i) / 6, -60]);
        for (let j = 1; j < 9; j++) ls.push([dx, -200 + (140 * j) / 9, dx + 92, -200 + (140 * j) / 9]);
        marks(g, dp, wood, 2.2, ls, 0.9);
      }
      for (const px of [-124, -8, 108]) R(g, px, -236, 16, 188, red, 3, { lw: 1.4 });
      R(g, -134, -244, 268, 16, red, 3, { lw: 1.4 });
      R(g, -130, -62, 260, 12, red, 2, { lw: 1.3 });
      const roof = curvedRoof(0, -368, 110, -240, 340, 16, 16);
      roofDo(g, roof, cu, [-170, 170, -368, -240, 12, 0.4]);
      R(g, -62, -378, 124, 12, C.shade(cu, -0.2), 2, { lw: 1.3 });
      for (const kx of [-36, 0, 36]) RR(g, kx - 14, -390, 28, 12, 6, gold, 1, { lw: 1.2 });
      for (const s of [-1, 1]) {
        limb(
          g,
          [
            [s * 50, -368],
            [s * 86, -428],
          ],
          10,
          8,
          C.shade(cu, -0.15),
          1,
        );
        limb(
          g,
          [
            [s * 80, -368],
            [s * 46, -428],
          ],
          10,
          8,
          C.shade(cu, -0.15),
          1,
        );
      }
      tube(
        g,
        [
          [-132, -240],
          [-60, -224],
          [0, -220],
          [60, -224],
          [132, -240],
        ],
        16,
        16,
        rope,
        2,
      );
      const tw = [];
      for (let x = -120; x < 124; x += 14) tw.push([x, -236 + Math.pow(x / 132, 2) * -14 + 12, x + 8, -222 + Math.pow(x / 132, 2) * -14 + 12]);
      marks(g, null, C.shade(rope, -0.35), 1.6, tw, 0.7);
      for (const sx of [-80, 0, 80]) {
        const sy = -226 + Math.pow(sx / 132, 2) * -14 + 8;
        PL(
          g,
          [
            [sx - 6, sy],
            [sx + 6, sy],
            [sx + 6, sy + 12],
            [sx - 2, sy + 12],
            [sx + 6, sy + 24],
            [sx - 2, sy + 24],
            [sx + 4, sy + 38],
            [sx - 8, sy + 26],
            [sx, sy + 26],
            [sx - 8, sy + 14],
            [sx, sy + 14],
            [sx - 6, sy + 4],
          ],
          nt(MT.FFFFFF, o, 0.45),
          0,
          { lw: 1 },
        );
      }
      E(g, 40, -204, 12, 12, gold, 2, { lw: 1.2 });
      tube(
        g,
        [
          [40, -192],
          [42, -150],
          [40, -110],
        ],
        6,
        5,
        nt(MT.E8E0D0, o, 0.45),
        0,
      );
      R(g, -44, -96, 88, 46, wood, 3, { lw: 1.4 });
      marks(
        g,
        null,
        C.shade(wood, -0.4),
        2,
        [
          [-36, -88, 36, -88],
          [-36, -80, 36, -80],
          [-36, -72, 36, -72],
        ],
        0.8,
      );
    },
    { tags: [MT.NHAT_BAN_2, MT.DEN_2, MT.THAN_DAO, MT.SHINTO, MT.CHAU_A], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -130, r: 160, color: MT.FFC880, alpha: 0.35 }] : []) },
  );
  reg(
    MT.VN_COMMUNAL_HOUSE,
    MT.DINH_LANG_VIET_NAM,
    MT.URBAN,
    [940, 520],
    (g, o) => {
      const tile = nt(o.color || MT.VALUE_8A4E36, o, 0.45),
        tlt = C.shade(tile, 0.12),
        pillar = nt(MT.VALUE_9A2A22, o, 0.45),
        wood = nt(MT.VALUE_6A4026, o, 0.45),
        stone = nt(MT.VALUE_9A9488, o, 0.5),
        gold = nt(MT.D8A83A, o, 0.45),
        glaze = nt(MT.VALUE_3A7A6A, o, 0.45);
      const t = o.t || 0;
      const base = K.rect(-400, -42, 800, 42);
      F(g, base, stone, 4, { lw: 1.5 });
      blocks(g, base, -400, -42, 800, 42, 21, 64, C.shade(stone, -0.4), 0.4);
      R(g, -90, -22, 180, 22, C.shade(stone, 0.08), 2, { lw: 1.3 });
      const wl = K.rect(-356, -182, 712, 140);
      F(g, wl, wood, 0, { lw: 1.4 });
      planks(g, wl, -356, -182, 712, 140, 10, C.shade(wood, -0.4), true, 0.5);
      R(g, -356, -84, 712, 42, C.shade(wood, -0.15), 1, { lw: 1.2 });
      if (o.night) {
        g.save();
        g.globalAlpha = 0.55;
        F(g, K.rect(-100, -176, 200, 92), MT.FFB860, 0, { ink: false, glow: MT.RGBA_255_170_80_0_8, glowR: 30 });
        g.restore();
      }
      for (const px of [-340, -222, -104, 104, 222, 340]) {
        R(g, px - 12, -186, 24, 144, pillar, 4, { lw: 1.4 });
        R(g, px - 16, -50, 32, 10, stone, 1, { lw: 1.1 });
      }
      R(g, -370, -196, 740, 16, C.shade(wood, 0.05), 2, { lw: 1.4 });
      const roof = curvedRoof(0, -430, 420, -176, 900, 52, 26);
      roofDo(g, roof, tile, [-460, 460, -430, -176, 13, 0.4]);
      const rows = [];
      for (let y = -410; y < -170; y += 22) rows.push([-470, y, 470, y]);
      marks(g, roof, C.shade(tile, -0.3), 1, rows, 0.25);
      g.save();
      g.clip(roof);
      g.globalAlpha = 0.12;
      const r = rng(o, 101);
      for (let i = 0; i < 8; i++) F(g, K.ell(-380 + r() * 760, -200 - r() * 200, 30 + r() * 30, 10 + r() * 8), nt(MT.VALUE_3A4A2A, o, 0.4), 0, { ink: false });
      g.restore();
      tileEdge(g, -400, 400, -152, 13, tlt);
      for (const s of [-1, 1]) {
        const hp = [];
        for (let i = 0; i <= 12; i++) {
          const k = i / 12;
          hp.push([s * ((1 - k) * (1 - k) * 206 + 2 * k * (1 - k) * 326 + k * k * 466), (1 - k) * (1 - k) * -426 + 2 * k * (1 - k) * -186 + k * k * -226]);
        }
        limb(g, hp, 18, 13, tlt, 3);
        curl(g, s * 468, -222, 2.4, s, tlt);
        curl(g, s * 226, -444, 1.6, s, tlt);
      }
      R(g, -224, -452, 448, 26, tlt, 4, { lw: 1.6 });
      marks(
        g,
        null,
        C.shade(tile, -0.3),
        1.4,
        Array.from({ length: 20 }, (_, i) => [-216 + i * 22, -450, -216 + i * 22, -428]),
        0.5,
      );
      E(g, 0, -478, 22, 22, gold, 3, { lw: 1.4 });
      for (let i = 0; i < 10; i++) {
        const a = (i * PI) / 5 + t * 0.3;
        SK(
          g,
          [
            [Math.cos(a) * 26, -478 + Math.sin(a) * 26],
            [Math.cos(a) * 36, -478 + Math.sin(a) * 36],
          ],
          gold,
          3,
          false,
        );
      }
      for (const s of [-1, 1]) {
        tube(
          g,
          [
            [s * 190, -452],
            [s * 150, -488],
            [s * 110, -466],
            [s * 70, -496],
            [s * 40, -484],
          ],
          12,
          9,
          glaze,
          2,
        );
        E(g, s * 40, -486, 12, 9, glaze, 2, { lw: 1.2 });
        for (const k of [0.25, 0.5, 0.75])
          SK(
            g,
            [
              [s * (190 - 150 * k), -470 - 14 * Math.sin(k * 9)],
              [s * (186 - 150 * k), -500 - 14 * Math.sin(k * 9)],
            ],
            glaze,
            3,
            false,
          );
      }
      for (const lx of [-280, -160, 160, 280]) lantern(g, lx, -180, 1, o, MT.D83A2A);
    },
    { tags: [MT.DINH_LANG, MT.DINH, MT.VIET_NAM_2, MT.LANG_QUE, MT.KIEN_TRUC_CO, MT.LE_HOI], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 0, y: -120, r: 300, color: MT.FFB070, alpha: 0.3 }] : []) },
  );
  reg(
    MT.VN_CITADEL_GATE,
    MT.CONG_THANH_NGO_MON_2,
    MT.URBAN,
    [940, 640],
    (g, o) => {
      const stone = nt(o.color || MT.VALUE_8C8270, o, 0.5),
        dkS = C.shade(stone, -0.4),
        red = nt(MT.A8302A, o, 0.45),
        yel = nt(MT.E2B030, o, 0.45),
        wood = nt(MT.VALUE_7A3A22, o, 0.45),
        gold = nt(MT.E8C050, o, 0.45),
        blue = nt(MT.VALUE_2A4A7A, o, 0.45);
      const base = K.P();
      base.moveTo(-460, -276);
      base.lineTo(460, -276);
      base.lineTo(460, 0);
      base.lineTo(-460, 0);
      base.closePath();
      F(g, base, stone, 12, { lw: 1.8 });
      blocks(g, base, -460, -276, 920, 276, 23, 56, dkS, 0.3);
      const lit = !!o.night;
      for (const [x, w, h, open] of [
        [-62, 124, 216, true],
        [-236, 88, 164, false],
        [148, 88, 164, false],
      ]) {
        const ring = archP(x - 12, -h - 12, w + 24, h + 12);
        F(g, ring, C.shade(stone, 0.12), 2, { lw: 1.4 });
        const ap = archP(x, -h, w, h);
        F(g, ap, open ? (lit ? MT.FFB860 : MT.VALUE_1A1416) : wood, open ? 0 : 4, { lw: 1.4, glow: open && lit ? MT.RGBA_255_170_80_0_7 : null, glowR: 26 });
        if (!open) {
          SK(
            g,
            [
              [x + w / 2, -h + 4],
              [x + w / 2, 0],
            ],
            C.shade(wood, -0.4),
            2,
            false,
          );
          for (let yy = -h + w / 2; yy < -10; yy += 20) for (let xx = x + 12; xx < x + w - 6; xx += 18) E(g, xx, yy, 2.6, 2.6, gold, 0, { ink: false });
        } else {
          F(
            g,
            K.poly([
              [x, 0],
              [x, -h + w / 2],
              [x + 22, -h + w / 2 + 14],
              [x + 22, -8],
            ]),
            wood,
            3,
            { lw: 1.3 },
          );
          F(
            g,
            K.poly([
              [x + w, 0],
              [x + w, -h + w / 2],
              [x + w - 22, -h + w / 2 + 14],
              [x + w - 22, -8],
            ]),
            wood,
            3,
            { lw: 1.3 },
          );
        }
      }
      RR(g, -64, -270, 128, 40, 3, blue, 2, { lw: 1.4 });
      SK(
        g,
        [
          [-58, -264],
          [58, -264],
          [58, -236],
          [-58, -236],
          [-58, -264],
        ],
        gold,
        2.5,
        false,
      );
      for (const cx of [-30, 0, 30])
        marks(
          g,
          null,
          gold,
          2.5,
          [
            [cx - 8, -258, cx + 8, -258],
            [cx, -262, cx, -240],
            [cx - 8, -248, cx + 8, -248],
            [cx - 6, -242, cx + 6, -242],
          ],
          1,
        );
      R(g, -472, -298, 944, 22, C.shade(stone, 0.08), 3, { lw: 1.5 });
      for (let x = -460; x < 460; x += 40) R(g, x, -316, 22, 18, C.shade(stone, 0.04), 1, { lw: 1.2 });
      R(g, -380, -330, 760, 14, C.shade(stone, 0.12), 2, { lw: 1.4 });
      R(g, -340, -414, 680, 84, wood, 0, { lw: 1.4 });
      planks(g, K.rect(-340, -414, 680, 84), -340, -414, 680, 84, 12, C.shade(wood, -0.35), true, 0.5);
      if (lit) F(g, K.rect(-300, -404, 600, 60), MT.RGBA_255_190_110_0_45, 0, { ink: false });
      for (let x = -330; x <= 330; x += 60) R(g, x - 7, -418, 14, 88, red, 2, { lw: 1.3 });
      R(g, -350, -356, 700, 8, C.shade(red, 0.1), 1, { lw: 1.1 });
      marks(
        g,
        null,
        gold,
        2,
        Array.from({ length: 35 }, (_, i) => [-340 + i * 20, -356, -340 + i * 20, -340]),
        0.8,
      );
      R(g, -356, -340, 712, 6, C.shade(red, 0.1), 1, { lw: 1.1 });
      const r1 = curvedRoof(0, -470, 560, -404, 800, 26, 18);
      roofDo(g, r1, yel, [-400, 400, -470, -404, 13, 0.45]);
      tileEdge(g, -370, 370, -385, 13, C.shade(yel, 0.12));
      for (const s of [-1, 1]) curl(g, s * 412, -408, 1.4, s, C.shade(yel, 0.1));
      R(g, -214, -540, 428, 72, wood, 0, { lw: 1.4 });
      planks(g, K.rect(-214, -540, 428, 72), -214, -540, 428, 72, 12, C.shade(wood, -0.35), true, 0.5);
      if (lit) F(g, K.rect(-190, -532, 380, 56), MT.RGBA_255_190_110_0_45, 0, { ink: false });
      for (let x = -206; x <= 206; x += 58.8) R(g, x - 6, -544, 12, 76, red, 2, { lw: 1.2 });
      const r2 = curvedRoof(0, -616, 300, -530, 540, 24, 18);
      roofDo(g, r2, yel, [-270, 270, -616, -530, 13, 0.45]);
      tileEdge(g, -240, 240, -511, 13, C.shade(yel, 0.12));
      for (const s of [-1, 1]) {
        curl(g, s * 280, -534, 1.4, s, C.shade(yel, 0.1));
        curl(g, s * 162, -630, 1.2, s, C.shade(yel, 0.1));
      }
      R(g, -160, -632, 320, 18, C.shade(yel, -0.15), 3, { lw: 1.4 });
      E(g, 0, -646, 12, 12, gold, 2, { lw: 1.2 });
      PL(
        g,
        [
          [-6, -656],
          [0, -676],
          [6, -656],
        ],
        gold,
        1,
        { lw: 1.1 },
      );
      for (const lx of [-300, -150, 150, 300]) lantern(g, lx, -398, 0.9, o, MT.D83A2A);
    },
    {
      tags: [MT.NGO_MON, MT.CONG_THANH_2, MT.KINH_THANH, MT.HUE_2, MT.HOANG_CUNG, MT.VIET_NAM_2, MT.TRIEU_NGUYEN],
      lights: (o) =>
        o.night
          ? [
              { type: MT.GLOW, x: 0, y: -100, r: 200, color: MT.FFB070, alpha: 0.4 },
              { type: MT.GLOW, x: 0, y: -380, r: 380, color: MT.FFB070, alpha: 0.2 },
            ]
          : [],
    },
  );
  reg(
    MT.WATCHTOWER,
    MT.THAP_CANH_GO,
    MT.URBAN,
    [260, 580],
    (g, o) => {
      const wood = nt(o.color || MT.VALUE_7A5232, o, 0.45),
        dk = C.shade(wood, -0.3),
        thatch = nt(MT.A88A4A, o, 0.45);
      shadow(g, 110, 8);
      limb(
        g,
        [
          [-58, 0],
          [-46, -384],
        ],
        14,
        12,
        dk,
        1,
      );
      limb(
        g,
        [
          [58, 0],
          [46, -384],
        ],
        14,
        12,
        dk,
        1,
      );
      for (const [a, b] of [
        [
          [-86, -30],
          [70, -190],
        ],
        [
          [86, -30],
          [-70, -190],
        ],
        [
          [-74, -206],
          [64, -370],
        ],
        [
          [74, -206],
          [-64, -370],
        ],
      ])
        limb(g, [a, b], 9, 9, C.shade(wood, -0.1), 1);
      limb(
        g,
        [
          [-80, -198],
          [80, -198],
        ],
        10,
        10,
        wood,
        1,
      );
      limb(
        g,
        [
          [-94, 0],
          [-64, -390],
        ],
        20,
        16,
        wood,
        2,
      );
      limb(
        g,
        [
          [94, 0],
          [64, -390],
        ],
        20,
        16,
        wood,
        2,
      );
      for (const s of [-1, 1])
        limb(
          g,
          [
            [s * 14, 0],
            [s * 14, -396],
          ],
          7,
          7,
          C.shade(wood, 0.12),
          1,
        );
      for (let y = -24; y > -390; y -= 26) R(g, -14, y, 28, 5, C.shade(wood, 0.12), 0, { lw: 1 });
      R(g, -108, -404, 216, 16, dk, 2, { lw: 1.4 });
      const hut = K.rect(-92, -448, 184, 46);
      F(g, hut, wood, 3, { lw: 1.4 });
      planks(g, hut, -92, -448, 184, 46, 14, dk, true, 0.5);
      for (const px of [-92, 80]) R(g, px, -486, 12, 84, dk, 1, { lw: 1.2 });
      R(g, -98, -454, 196, 8, dk, 1, { lw: 1.2 });
      const rf = K.poly([
        [-128, -478],
        [0, -574],
        [128, -478],
      ]);
      F(g, rf, thatch, 6, { lw: 1.6 });
      const th = [];
      for (let x = -120; x < 128; x += 12) th.push([x, -478, x * 0.2, -560]);
      marks(g, rf, C.shade(thatch, -0.35), 1.4, th, 0.45);
      R(g, 84, -436, 30, 14, MT.VALUE_3A3A40, 2, { lw: 1.2 });
      flame(g, 99, -436, 1, o);
    },
    { tags: [MT.THAP_CANH, MT.CHOI_CANH, MT.TRUNG_CO, MT.BIEN_GIOI, MT.GO], lights: (o) => (o.night ? [{ type: MT.GLOW, x: 99, y: -450, r: 150, color: MT.FFA040, alpha: 0.55 }] : []) },
  );
  reg(
    MT.MEDIEVAL_TAVERN,
    MT.QUAN_RUOU_TRUNG_CO,
    MT.URBAN,
    [620, 620],
    (g, o) => {
      const stone = nt(MT.VALUE_9A9080, o, 0.5),
        plaster = nt(o.color || MT.ECDCB8, o, 0.55),
        timber = nt(MT.VALUE_4A3020, o, 0.4),
        roof = nt(MT.VALUE_7A4A3A, o, 0.45),
        iron = MT.VALUE_2A2A30;
      const r = rng(o, 111);
      const t = o.t || 0;
      const ch = K.rect(170, -600, 50, 200);
      F(g, ch, stone, 4, { lw: 1.5 });
      blocks(g, ch, 170, -600, 50, 200, 18, 25, C.shade(stone, -0.4), 0.4);
      R(g, 164, -608, 62, 12, C.shade(stone, -0.1), 1, { lw: 1.3 });
      const rf = K.poly([
        [-304, -378],
        [-214, -544],
        [214, -544],
        [304, -378],
      ]);
      F(g, rf, roof, 10, { lw: 1.8 });
      const sh = [];
      for (let y = -530; y < -378; y += 16) {
        const k = (y + 544) / 166;
        const hw = 214 + 90 * k;
        sh.push([-hw, y, hw, y]);
        for (let x = -hw + ((y / 16) % 2) * 11; x < hw; x += 22) sh.push([x, y, x, y + 16]);
      }
      marks(g, rf, C.shade(roof, -0.3), 1.2, sh, 0.4);
      R(g, -42, -508, 84, 80, plaster, 3, { lw: 1.4 });
      PL(
        g,
        [
          [-54, -504],
          [0, -556],
          [54, -504],
        ],
        roof,
        3,
        { lw: 1.4 },
      );
      win(g, -22, -496, 44, 50, o, !!o.night, { frame: timber, arch: false, curtain: MT.A8322A });
      const up = K.rect(-272, -384, 544, 178);
      F(g, up, plaster, 8, { lw: 1.7 });
      const lits = o.night ? [0, 2] : [];
      for (let i = 0; i < 3; i++) win(g, -196 + i * 158, -350, 60, 72, o, lits.includes(i), { frame: timber, curtain: MT.A8322A });
      for (let i = 0; i <= 8; i++) R(g, -272 + i * 66.5, -384, 10, 178, timber, 1, { lw: 1.1 });
      for (let i = 0; i < 8; i++)
        if (i % 3 !== 0 && i !== 4)
          limb(
            g,
            i % 2
              ? [
                  [-262 + i * 66.5, -212],
                  [-206 + i * 66.5, -270],
                ]
              : [
                  [-262 + i * 66.5, -270],
                  [-206 + i * 66.5, -212],
                ],
            8,
            8,
            timber,
            0,
          );
      R(g, -276, -388, 552, 12, timber, 2, { lw: 1.3 });
      R(g, -272, -276, 544, 8, timber, 0, { lw: 1 });
      R(g, -280, -212, 560, 14, timber, 3, { lw: 1.4 });
      for (let x = -260; x < 270; x += 40) R(g, x, -198, 12, 10, timber, 0, { lw: 1 });
      const gf = K.rect(-250, -198, 500, 198);
      F(g, gf, stone, 8, { lw: 1.7 });
      blocks(g, gf, -250, -198, 500, 198, 22, 46, C.shade(stone, -0.4), 0.4);
      const lit = !!o.night;
      for (const wx of [-210, 120]) {
        win(g, wx, -160, 92, 80, o, lit, { frame: timber, cross: false });
        const lat = [];
        for (let k = -4; k <= 8; k++) {
          lat.push([wx + k * 16, -156, wx + k * 16 + 76, -84]);
          lat.push([wx + k * 16 + 76, -156, wx + k * 16, -84]);
        }
        marks(g, K.rect(wx + 4, -156, 84, 72), iron, 1.4, lat, 0.7);
      }
      const dp = archP(-44, -160, 88, 160);
      F(g, dp, nt(MT.VALUE_6A4428, o, 0.45), 6, { lw: 1.6 });
      planks(g, dp, -44, -160, 88, 160, 15, C.shade(timber, -0.1), true, 0.6);
      for (const y of [-120, -40])
        SK(
          g,
          [
            [-40, y],
            [10, y],
          ],
          iron,
          4,
          false,
        );
      E(g, 30, -80, 4, 4, iron, 0, { ink: false });
      SK(
        g,
        [
          [66, -150],
          [66, -136],
        ],
        iron,
        2,
        false,
      );
      RR(g, 58, -136, 16, 24, 4, lit ? MT.FFD889 : nt(MT.C8B07A, o, 0.4), 0, { lw: 1.2, glow: lit ? LITGLOW : null });
      SK(
        g,
        [
          [250, -258],
          [306, -258],
        ],
        iron,
        4,
        false,
      );
      SK(
        g,
        [
          [250, -236],
          [282, -258],
        ],
        iron,
        3,
        false,
      );
      g.save();
      g.translate(296, -258);
      g.rotate(Math.sin(t * 1.6) * 0.07);
      SK(
        g,
        [
          [-22, 0],
          [-22, 12],
        ],
        iron,
        1.6,
        false,
      );
      SK(
        g,
        [
          [22, 0],
          [22, 12],
        ],
        iron,
        1.6,
        false,
      );
      RR(g, -36, 12, 72, 56, 6, nt(MT.VALUE_8A5A34, o, 0.45), 3, { lw: 1.5 });
      RR(g, -14, 24, 24, 34, 3, nt(MT.E2B544, o, 0.45), 2, { lw: 1.2 });
      E(g, -2, 24, 14, 6, nt(MT.FFFFFF, o, 0.4), 0, { lw: 1 });
      SK(
        g,
        [
          [10, 30],
          [20, 34, 20, 42],
          [20, 50, 10, 52],
        ],
        nt(MT.E2B544, o, 0.45),
        4,
        false,
      );
      g.restore();
      for (const [bx, by] of [
        [-286, 0],
        [-246, 0],
      ]) {
        F(g, K.rrect(bx - 18, by - 54, 36, 54, 10), nt(MT.VALUE_8A5A34, o, 0.45), 4, { lw: 1.3 });
        marks(
          g,
          null,
          iron,
          3,
          [
            [bx - 17, by - 44, bx + 17, by - 44],
            [bx - 17, by - 10, bx + 17, by - 10],
          ],
          0.8,
        );
      }
    },
    {
      tags: [MT.QUAN_RUOU, MT.TRUNG_CO, MT.LU_QUAN, MT.NHA_TRO, MT.CHAU_AU],
      lights: (o) =>
        o.night
          ? [
              { type: MT.GLOW, x: 66, y: -124, r: 90, color: MT.FFD889, alpha: 0.6 },
              { type: MT.GLOW, x: 0, y: -120, r: 260, color: MT.FFC070, alpha: 0.25 },
            ]
          : [],
    },
  );
  reg(
    MT.STONE_BRIDGE,
    MT.CAU_DA_VOM,
    MT.URBAN,
    [720, 240],
    (g, o) => {
      const st = nt(o.color || MT.A8A090, o, 0.5),
        dk = C.shade(st, -0.4);
      const deck = (x) => -150 - 14 * (1 - Math.pow(x / 360, 2));
      const body = K.P();
      body.moveTo(-360, 0);
      body.lineTo(-360, -70);
      body.quadraticCurveTo(-320, -150, -260, deck(-260));
      body.quadraticCurveTo(0, -174, 260, deck(260));
      body.quadraticCurveTo(320, -150, 360, -70);
      body.lineTo(360, 0);
      body.closePath();
      const arches = [
        [0, 270, 124],
        [-210, 120, 74],
        [210, 120, 74],
      ];
      for (const [cx, sp, rise] of arches) {
        body.moveTo(cx + sp / 2, 0);
        body.ellipse(cx, 0, sp / 2, rise, 0, 0, PI, true);
        body.closePath();
      }
      F(g, body, st, 10, { lw: 1.8 });
      blocks(g, body, -360, -180, 720, 180, 20, 44, dk, 0.25);
      for (const [cx, sp, rise] of arches) {
        const ring = K.P();
        ring.ellipse(cx, 0, sp / 2 + 16, rise + 16, 0, PI, 0);
        ring.lineTo(cx + sp / 2, 0);
        ring.ellipse(cx, 0, sp / 2, rise, 0, 0, PI, true);
        ring.closePath();
        F(g, ring, C.shade(st, 0.1), 2, { lw: 1.4 });
        const vs = [];
        for (let i = 1; i < 12; i++) {
          const a = PI + (i * PI) / 12;
          vs.push([cx + Math.cos(a) * (sp / 2), Math.sin(a) * rise, cx + Math.cos(a) * (sp / 2 + 16), Math.sin(a) * (rise + 16)]);
        }
        marks(g, ring, dk, 1.4, vs, 0.6);
      }
      const par = K.P();
      par.moveTo(-340, -82);
      par.quadraticCurveTo(-310, -146, -260, deck(-260) - 2);
      par.quadraticCurveTo(0, -174, 260, deck(260) - 2);
      par.quadraticCurveTo(310, -146, 340, -82);
      par.lineTo(340, -112);
      par.quadraticCurveTo(310, -176, 260, deck(260) - 32);
      par.quadraticCurveTo(0, -204, -260, deck(-260) - 32);
      par.quadraticCurveTo(-310, -176, -340, -112);
      par.closePath();
      F(g, par, C.shade(st, 0.06), 4, { lw: 1.6 });
      const cp = [];
      for (let x = -300; x <= 300; x += 40) {
        const y = deck(x) - 30 - (Math.abs(x) > 260 ? (Math.abs(x) - 260) * -0.8 : 0);
        cp.push([x, y, x, y + 28]);
      }
      marks(g, par, dk, 1.3, cp, 0.4);
      SK(
        g,
        [
          [-340, -112],
          [-310, -176, -260, deck(-260) - 32],
          [0, -204, 260, deck(260) - 32],
          [310, -176, 340, -112],
        ],
        C.shade(st, 0.18),
        5,
        false,
      );
    },
    { tags: [MT.CAU, MT.CAU_DA, MT.CAU_VOM, MT.CO_3, MT.SONG] },
  );
  const leafSet = (o, base) => {
    const b = nt(o.color || base, o, 0.6);
    return [b, C.shade(b, -0.16), C.mix(b, MT.F2F6B0, o.night ? 0.06 : 0.18)];
  };
  const blob = (g, x, y, rr, c) => F(g, K.ell(x, y, rr, rr * 0.9), c, rr * 0.22, { lw: 1.6, sx: 1, sy: 1 });
  reg(
    MT.BANYAN_TREE,
    MT.CAY_DA_CO_THU,
    MT.NATURE,
    [780, 680],
    (g, o) => {
      const t = o.t || 0;
      const sw = Math.sin(t * 0.8 + (o.seed || 0)) * 8;
      const sx = (y) => (sw * -y) / 600;
      const bark = nt(MT.VALUE_6E5E4C, o, 0.55),
        root = C.shade(bark, 0.12);
      const L = leafSet(o, MT.VALUE_3F7A3A);
      const r = rng(o, 121);
      shadow(g, 340, 16, 0.22);
      for (const [x, y, rr] of [
        [-290, -440, 92],
        [290, -450, 96],
        [-160, -572, 104],
        [160, -580, 108],
        [0, -612, 112],
        [-350, -370, 70],
        [350, -380, 72],
      ])
        blob(g, x + sx(y), y, rr, L[1]);
      const lim = [
        [
          [-40, -250],
          [-120, -340],
          [-230, -400],
          [-310, -410],
        ],
        [
          [40, -260],
          [130, -350],
          [240, -410],
          [320, -420],
        ],
        [
          [0, -280],
          [-10, -400],
          [10, -520],
        ],
        [
          [-20, -300],
          [-90, -450],
          [-140, -530],
        ],
        [
          [20, -300],
          [90, -460],
          [150, -540],
        ],
      ];
      lim.forEach((pts, i) =>
        tube(
          g,
          pts.map((p) => [p[0] + sx(p[1]), p[1]]),
          i < 2 ? 50 : 38,
          14,
          bark,
          4,
        ),
      );
      for (const [x0, y0, x1] of [
        [-236, -398, -250],
        [252, -410, 268],
        [-150, -360, -158],
      ])
        limb(
          g,
          [
            [x0 + sx(y0), y0],
            [(x0 + x1) / 2 + sx(y0 / 2), y0 / 2],
            [x1, 0],
          ],
          10,
          18,
          root,
          2,
        );
      const tr = K.P();
      tr.moveTo(-200, 0);
      tr.bezierCurveTo(-120, -16, -96, -60, -94, -140);
      tr.bezierCurveTo(-92, -200, -74, -250, -52, -296);
      tr.lineTo(54, -300);
      tr.bezierCurveTo(74, -250, 98, -200, 98, -140);
      tr.bezierCurveTo(98, -60, 130, -16, 210, 0);
      tr.closePath();
      F(g, tr, bark, 16, { lw: 1.8 });
      const fl = [];
      for (let i = 0; i < 12; i++) {
        const x = -80 + i * 15 + (r() - 0.5) * 6;
        fl.push([x * 1.6, -4, x * 0.9 + (r() - 0.5) * 20, -150, x * 0.55, -296]);
      }
      marks(g, tr, C.shade(bark, -0.35), 2.2, fl, 0.5);
      marks(
        g,
        tr,
        C.shade(bark, 0.25),
        1.6,
        fl.map((q) => [q[0] + 5, q[1], q[2] + 5, q[3], q[4] + 4, q[5]]),
        0.35,
      );
      for (const [x, y, rr, k] of [
        [-230, -480, 96, 0],
        [230, -490, 100, 0],
        [-70, -540, 112, 2],
        [100, -548, 104, 0],
        [-370, -420, 62, 0],
        [372, -430, 64, 2],
        [-10, -440, 84, 2],
        [-140, -430, 76, 0],
        [150, -440, 78, 2],
        [0, -640, 80, 0],
      ])
        blob(g, x + sx(y), y, rr, L[k]);
      const strands = [];
      for (let i = 0; i < 34; i++) {
        const x = -360 + r() * 720;
        const y0 = -380 - r() * 50;
        const len = 70 + r() * 220;
        const tip = Math.sin(t * 1.2 + i) * 4 + sx(y0) * 0.6;
        strands.push([x + sx(y0), y0, x + sx(y0) + tip * 0.5, y0 + len * 0.5, x + sx(y0) + tip, y0 + len]);
      }
      marks(g, null, root, 2.4, strands, 0.9);
      if (isLine())
        marks(
          g,
          null,
          INKC,
          0.8,
          strands.map((q) => [q[0] + 1.4, q[1], q[2] + 1.4, q[3], q[4] + 1.4, q[5]]),
          0.6,
        );
    },
    { tags: [MT.CAY_DA, MT.CAY, MT.CO_THU, MT.LANG_QUE, MT.VIET_NAM_2, MT.RE_PHU] },
  );
  reg(
    MT.DEAD_TREE_TWISTED,
    MT.CAY_CHET_VAN_VEO,
    MT.NATURE,
    [440, 520],
    (g, o) => {
      const bark = nt(o.color || MT.VALUE_5E544E, o, 0.5);
      const r = rng(o, 141);
      const br = (x, y, a, len, w, d) => {
        if (d === 0 || len < 14) return;
        const ex = x + Math.sin(a) * len,
          ey = y - Math.cos(a) * len;
        const mx = (x + ex) / 2 + (r() - 0.5) * len * 0.4,
          my = (y + ey) / 2 + (r() - 0.5) * len * 0.2;
        tube(
          g,
          [
            [x, y],
            [mx, my],
            [ex, ey],
          ],
          w,
          w * 0.6,
          bark,
          1.5,
        );
        const n = d > 3 ? 2 : r() > 0.35 ? 2 : 1;
        for (let i = 0; i < n; i++) br(ex, ey, a + (i === 0 ? -1 : 1) * (0.3 + r() * 0.55) + (r() - 0.5) * 0.3, len * (0.6 + r() * 0.16), w * 0.62, d - 1);
      };
      shadow(g, 120, 9, 0.2);
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 10, -20],
            [s * 50, -10],
            [s * 90, -2],
            [s * 110, 0],
          ],
          22,
          6,
          bark,
          1,
        );
      br(-14, -250, -0.8, 96, 26, 5);
      br(14, -270, 0.7, 100, 26, 5);
      br(0, -300, 0.05, 86, 22, 4);
      br(-20, -160, -1.2, 80, 18, 3);
      const tr = tube(
        g,
        [
          [0, 0],
          [-28, -80],
          [20, -160],
          [-16, -240],
          [6, -300],
        ],
        64,
        26,
        bark,
        6,
      );
      marks(
        g,
        tr,
        C.shade(bark, -0.4),
        2,
        [
          [-26, -10, -48, -90, 0, -180],
          [10, -10, -8, -110, 14, -190],
          [24, -6, 30, -90, -6, -250],
        ],
        0.55,
      );
      E(g, -4, -150, 10, 17, MT.VALUE_121016, 0, { lw: 1.3 });
    },
    { tags: [MT.CAY_CHET, MT.CAY_KHO, MT.KINH_DI, MT.MA_QUAI, MT.HALLOWEEN] },
  );
  reg(
    MT.SWAMP_REEDS,
    MT.BUI_CO_NEN_DAM_LAY,
    MT.NATURE,
    [240, 230],
    (g, o) => {
      const t = o.t || 0;
      const r = rng(o, 151);
      const gs = [nt(MT.VALUE_4F7A3A, o, 0.55), nt(MT.VALUE_6A8A42, o, 0.55), nt(MT.VALUE_3E6A34, o, 0.55)];
      g.save();
      g.fillStyle = MT.RGBA_40_50_30_0_35;
      g.beginPath();
      g.ellipse(0, -3, 104, 10, 0, 0, PI * 2);
      g.fill();
      g.restore();
      const blade = (i, back) => {
        const bx = -90 + r() * 180,
          h = (back ? 120 : 80) + r() * 100;
        const lean = (r() - 0.5) * 0.7 + Math.sin(t * 1.4 + i) * 0.05;
        const bend = (r() - 0.5) * 0.5;
        const p1 = [bx + Math.sin(lean) * h * 0.5, -h * 0.5];
        const p2 = [bx + Math.sin(lean + bend) * h, -h * Math.cos(lean + bend)];
        limb(g, [[bx, 0], p1, p2], 9, 1, back ? C.shade(gs[i % 3], -0.15) : gs[i % 3], 1, { lw: 1.1 });
      };
      for (let i = 0; i < 10; i++) blade(i, true);
      for (let i = 0; i < 6; i++) {
        const bx = -70 + i * 28 + (r() - 0.5) * 14,
          h = 150 + r() * 70;
        const lean = (r() - 0.5) * 0.3 + Math.sin(t * 1.2 + i * 0.7) * 0.04;
        const tx = bx + Math.sin(lean) * h,
          ty = -h * Math.cos(lean);
        SK(
          g,
          [
            [bx, 0],
            [tx, ty],
          ],
          nt(MT.VALUE_6A7A3A, o, 0.55),
          3,
          true,
        );
        F(g, K.ell(bx + Math.sin(lean) * (h - 28), -Math.cos(lean) * (h - 28), 7, 24, lean), nt(MT.VALUE_6A3E24, o, 0.5), 2, { lw: 1.2 });
        SK(
          g,
          [
            [tx, ty],
            [tx + Math.sin(lean) * 16, ty - Math.cos(lean) * 16],
          ],
          nt(MT.VALUE_6A7A3A, o, 0.55),
          2,
          true,
        );
      }
      for (let i = 0; i < 9; i++) blade(i + 20, false);
    },
    { tags: [MT.CO_NEN, MT.LAU_SAY, MT.DAM_LAY, MT.CO_4, MT.BO_SONG] },
  );
  reg(
    MT.SCARECROW,
    MT.BU_NHIN_ROM,
    MT.NATURE,
    [200, 260],
    (g, o) => {
      const t = o.t || 0;
      const wood = nt(MT.VALUE_7A5232, o, 0.45),
        shirt = nt(o.color || MT.B8443A, o, 0.45),
        straw = nt(MT.E2BF5A, o, 0.45),
        sack = nt(MT.C8A878, o, 0.45),
        patch = nt(MT.VALUE_3A6A9A, o, 0.45);
      const fl = Math.sin(t * 2.2) * 4;
      R(g, -6, -236, 12, 236, wood, 2, { lw: 1.3 });
      R(g, -96, -164, 192, 10, wood, 2, { lw: 1.3 });
      const tuft = (x, y, dir, n) => {
        const segs = [];
        for (let i = 0; i < n; i++) {
          const a = dir + (i / (n - 1) - 0.5) * 1.1;
          segs.push([x, y, x + Math.cos(a) * 22, y + Math.sin(a) * 22]);
        }
        marks(g, null, straw, 2.4, segs, 1);
      };
      tuft(-100, -154, PI, 7);
      tuft(100, -154, 0, 7);
      for (const x of [-30, -10, 10, 30]) tuft(x, -72, PI / 2, 3);
      const sl = K.poly([
        [-44, -172],
        [-98, -174 + fl],
        [-100, -144 + fl],
        [-44, -138],
      ]);
      F(g, sl, shirt, 2, { lw: 1.4 });
      const sr = K.poly([
        [44, -172],
        [98, -174 - fl],
        [100, -144 - fl],
        [44, -138],
      ]);
      F(g, sr, shirt, 2, { lw: 1.4 });
      const tor = K.poly([
        [-46, -172],
        [46, -172],
        [52, -84],
        [40, -72],
        [20, -78],
        [0, -70],
        [-22, -78],
        [-40, -72],
        [-52, -84],
      ]);
      F(g, tor, shirt, 5, { lw: 1.5 });
      const pl = [];
      for (let x = -90; x < 100; x += 18) pl.push([x, -180, x, -60]);
      for (let y = -170; y < -60; y += 18) pl.push([-100, y, 100, y]);
      for (const p of [sl, sr, tor]) marks(g, p, C.shade(shirt, -0.35), 2, pl, 0.4);
      R(g, -30, -150, 22, 20, patch, 1, { lw: 1.1 });
      marks(
        g,
        null,
        MT.F4F0E0,
        1.2,
        [
          [-28, -150, -26, -146],
          [-22, -150, -20, -146],
          [-14, -150, -12, -146],
        ],
        0.8,
      );
      R(g, -48, -100, 96, 7, nt(MT.A88A5A, o, 0.45), 1, { lw: 1.1 });
      E(g, 0, -200, 27, 29, sack, 4, { lw: 1.5 });
      SK(
        g,
        [
          [-12, -212],
          [-4, -204],
        ],
        MT.VALUE_2A2224,
        2.5,
        false,
      );
      SK(
        g,
        [
          [-4, -212],
          [-12, -204],
        ],
        MT.VALUE_2A2224,
        2.5,
        false,
      );
      SK(
        g,
        [
          [6, -212],
          [14, -204],
        ],
        MT.VALUE_2A2224,
        2.5,
        false,
      );
      SK(
        g,
        [
          [14, -212],
          [6, -204],
        ],
        MT.VALUE_2A2224,
        2.5,
        false,
      );
      SK(
        g,
        [
          [-12, -188],
          [-6, -184, 0, -188],
          [6, -184, 12, -188],
        ],
        MT.VALUE_2A2224,
        2,
        false,
      );
      marks(
        g,
        null,
        MT.VALUE_2A2224,
        1.4,
        [
          [-8, -191, -8, -185],
          [0, -191, 0, -185],
          [8, -191, 8, -185],
        ],
        1,
      );
      R(g, -14, -176, 28, 6, nt(MT.A88A5A, o, 0.45), 1, { lw: 1.1 });
      E(g, 0, -222, 50, 9, straw, 2, { lw: 1.4 });
      RR(g, -24, -256, 48, 36, [16, 16, 2, 2], straw, 3, { lw: 1.4 });
      R(g, -24, -232, 48, 7, nt(MT.A8322A, o, 0.45), 0, { lw: 1 });
    },
    { tags: [MT.BU_NHIN, MT.DONG_RUONG, MT.NONG_TRAI, MT.ROM, MT.HALLOWEEN] },
  );
  reg(
    MT.GRAVEYARD_CROSS,
    MT.THANH_GIA_MO,
    MT.STREET,
    [130, 200],
    (g, o) => {
      const wood = (o.seed || 0) % 2 === 1;
      const r = rng(o, 161);
      const dirt = nt(MT.VALUE_6A5A44, o, 0.5);
      F(g, K.ell(0, -2, 58, 14), dirt, 3, { lw: 1.3 });
      const gr = [];
      for (let i = 0; i < 10; i++) {
        const x = -54 + r() * 108;
        gr.push([x, -2, x + (r() - 0.5) * 8, -10 - r() * 10]);
      }
      if (wood) {
        const w = nt(MT.VALUE_7A5A3A, o, 0.45);
        g.save();
        g.rotate(0.06);
        R(g, -9, -156, 18, 158, w, 3, { lw: 1.4 });
        g.save();
        g.translate(0, -118);
        g.rotate(-0.1);
        R(g, -38, -8, 76, 16, w, 3, { lw: 1.4 });
        g.restore();
        planks(g, K.rect(-9, -156, 18, 158), -9, -156, 18, 158, 6, C.shade(w, -0.35), true, 0.6);
        marks(
          g,
          null,
          nt(MT.C8B07A, o, 0.45),
          2.4,
          [
            [-10, -126, 10, -112],
            [-10, -118, 10, -104],
            [10, -126, -10, -112],
          ],
          1,
        );
        g.restore();
      } else {
        const st = nt(o.color || MT.A8A49A, o, 0.5);
        R(g, -36, -32, 72, 30, C.shade(st, -0.08), 3, { lw: 1.4 });
        const ring = K.P();
        ring.arc(0, -138, 30, 0, PI * 2);
        ring.arc(0, -138, 22, 0, PI * 2, true);
        F(g, ring, st, 2, { lw: 1.3 });
        R(g, -12, -184, 24, 154, st, 4, { lw: 1.5 });
        R(g, -44, -150, 88, 24, st, 4, { lw: 1.5 });
        g.save();
        g.globalAlpha = 0.5;
        F(g, K.ell(-6, -44, 14, 10), nt(MT.VALUE_5A7A3A, o, 0.5), 0, { ink: false });
        F(g, K.ell(-36, -140, 8, 6), nt(MT.VALUE_5A7A3A, o, 0.5), 0, { ink: false });
        g.restore();
        crack(g, 4, -184, 40, C.shade(st, -0.4), r);
      }
      marks(g, null, nt(MT.VALUE_5A7A3A, o, 0.5), 2, gr, 1);
    },
    { tags: [MT.THANH_GIA, MT.MO, MT.NGHIA_TRANG, MT.KINH_DI, MT.BIA_MO_2] },
  );
  reg(
    MT.IRON_GATE,
    MT.CONG_SAT_NGHIA_TRANG,
    MT.STREET,
    [440, 370],
    (g, o) => {
      const st = nt(o.color || MT.VALUE_9A968C, o, 0.5),
        iron = o.night ? MT.VALUE_4E5262 : MT.VALUE_24242A;
      const top = (x) => -250 - 64 * (1 - Math.pow(x / 160, 2));
      g.save();
      g.lineCap = MT.ROUND;
      g.strokeStyle = iron;
      g.fillStyle = iron;
      g.lineWidth = 4;
      g.beginPath();
      for (let x = -150; x <= 150; x += 15) {
        g.moveTo(x, -14);
        g.lineTo(x, top(x));
      }
      g.stroke();
      for (let x = -150; x <= 150; x += 15) {
        const y = top(x);
        g.beginPath();
        g.moveTo(x - 5, y + 2);
        g.lineTo(x, y - 14);
        g.lineTo(x + 5, y + 2);
        g.closePath();
        g.fill();
      }
      g.lineWidth = 6;
      g.beginPath();
      for (const y of [-16, -70, -200]) {
        g.moveTo(-160, y);
        g.lineTo(160, y);
      }
      g.moveTo(-160, top(-160) + 28);
      for (let x = -160; x <= 160; x += 8) g.lineTo(x, top(x) + 28);
      g.stroke();
      g.lineWidth = 3;
      for (let x = -140; x <= 140; x += 40) {
        g.beginPath();
        g.arc(x, -235 + 64 * (1 - Math.pow(x / 160, 2)) * -0.25, 10, 0.4, PI * 2 - 0.4);
        g.stroke();
        g.beginPath();
        g.arc(x + 20, -214, 7, PI + 0.4, PI * 3 - 0.4);
        g.stroke();
      }
      for (let x = -150; x <= 150; x += 30) {
        g.beginPath();
        g.arc(x + 15, -43, 11, 0, PI * 2);
        g.stroke();
      }
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(0, -12);
      g.lineTo(0, top(0) + 4);
      g.stroke();
      g.lineWidth = 5;
      g.beginPath();
      g.arc(0, -138, 30, 0, PI * 2);
      g.moveTo(0, -162);
      g.lineTo(0, -114);
      g.moveTo(-18, -146);
      g.lineTo(18, -146);
      g.stroke();
      g.restore();
      RR(g, -12, -112, 24, 28, 4, nt(MT.VALUE_5A4A3A, o, 0.4), 1, { lw: 1.2 });
      for (const x0 of [-226, 166]) {
        const pp = K.rect(x0, -300, 60, 300);
        F(g, pp, st, 6, { lw: 1.6 });
        blocks(g, pp, x0, -300, 60, 300, 30, 30, C.shade(st, -0.4), 0.35);
        R(g, x0 - 8, -316, 76, 18, C.shade(st, 0.08), 3, { lw: 1.4 });
        R(g, x0 + 14, -330, 32, 14, C.shade(st, 0.04), 1, { lw: 1.2 });
        E(g, x0 + 30, -350, 20, 20, C.shade(st, 0.06), 4, { lw: 1.4 });
        g.save();
        g.globalAlpha = 0.45;
        F(g, K.ell(x0 + 30, -18, 30, 14), nt(MT.VALUE_4A6A34, o, 0.5), 0, { ink: false });
        g.restore();
        for (const y of [-260, -60]) R(g, x0 + (x0 < 0 ? 54 : -4), y, 10, 14, iron, 0, { lw: 1 });
      }
    },
    { tags: [MT.CONG_SAT, MT.CONG_2, MT.NGHIA_TRANG, MT.KINH_DI, MT.BIET_THU] },
  );
  for (const id of IDS) if (!TALES.assets.includes(id)) TALES.assets.push(id);
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
