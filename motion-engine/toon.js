(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const T = (ME.TOON = { style: MT.PLAIN, active: null, assets: {}, envs: {}, LF: 1, list: { assets: [], envs: [] } });
  const INK = MT.VALUE_2A1C22;
  const isHex = (c) => typeof c === MT.STRING && c[0] === MT.SYMBOL_2 && (c.length === 7 || c.length === 4);
  const shadeOf = (c, a) => C.mix(c, MT.VALUE_2C1F4E, a == null ? 0.34 : a);
  const hiOf = (c) => C.mix(c, MT.FFF3DC, 0.3);
  const crescent = (g, p, dx, dy, col, alpha) => {
    g.save();
    g.clip(p);
    const q = new Path2D();
    q.rect(-1e5, -1e5, 2e5, 2e5);
    q.addPath(p, new DOMMatrix([1, 0, 0, 1, dx, dy]));
    g.clip(q, MT.EVENODD);
    g.globalAlpha *= alpha == null ? 1 : alpha;
    g.fillStyle = col;
    g.fillRect(-1e5, -1e5, 2e5, 2e5);
    g.restore();
  };
  const paint = (g, p, col, o) => {
    o = o || {};
    const line = T.style === MT.LINE;
    const plain = T.style !== MT.LINE && T.style !== MT.FLAT;
    g.save();
    if (o.glow) {
      g.shadowColor = o.glow;
      g.shadowBlur = o.glowR || 30;
    }
    g.fillStyle = col;
    g.fill(p);
    g.shadowBlur = 0;
    const d = o.d == null ? 4 : o.d;
    if (d && isHex(col) && o.shade !== false) {
      crescent(g, p, -d * T.LF * (o.sx == null ? 1 : o.sx), -d * 0.6 * (o.sy == null ? 1 : o.sy), shadeOf(col, o.sa), plain ? 0.55 : 1);
      if (!line && !plain && o.hi !== false) crescent(g, p, d * 0.45 * T.LF, d * 0.3, hiOf(col), 0.85);
    }
    if (line && o.ink !== false) {
      g.lineJoin = MT.ROUND;
      g.lineCap = MT.ROUND;
      g.strokeStyle = o.inkCol || INK;
      g.lineWidth = o.lw || 1.6;
      g.stroke(p);
    }
    g.restore();
  };
  const P = () => new Path2D();
  const rect = (x, y, w, h) => {
    const p = P();
    p.rect(x, y, w, h);
    return p;
  };
  const rrect = (x, y, w, h, r) => {
    const p = P();
    p.roundRect(x, y, w, h, r);
    return p;
  };
  const ell = (x, y, rx, ry, rot) => {
    const p = P();
    p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, PI * 2);
    return p;
  };
  const poly = (pts, smooth) => {
    const p = P();
    if (!smooth) {
      p.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    } else {
      const n = pts.length;
      const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
      const s = mid(n - 1);
      p.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) {
        const e = mid(i);
        p.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]);
      }
    }
    p.closePath();
    return p;
  };
  const spec = (segs, tx, ty, s, fx) => {
    const p = P();
    const X = (v) => tx + v * s * (fx || 1),
      Y = (v) => ty + v * s;
    p.moveTo(X(segs[0][0]), Y(segs[0][1]));
    for (let i = 1; i < segs.length; i++) {
      const q = segs[i];
      if (q.length === 6) p.bezierCurveTo(X(q[0]), Y(q[1]), X(q[2]), Y(q[3]), X(q[4]), Y(q[5]));
      else p.lineTo(X(q[0]), Y(q[1]));
    }
    p.closePath();
    return p;
  };
  const stroke = (g, pts, col, w, ink) => {
    g.save();
    g.lineCap = MT.ROUND;
    g.lineJoin = MT.ROUND;
    g.strokeStyle = ink && T.style === MT.LINE ? INK : col;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const q = pts[i];
      if (q.length === 4) g.quadraticCurveTo(q[0], q[1], q[2], q[3]);
      else g.lineTo(q[0], q[1]);
    }
    g.stroke();
    g.restore();
  };
  const glowDisc = (g, x, y, r, col, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, C.rgba(col, a == null ? 0.6 : a));
    gr.addColorStop(1, C.rgba(col, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  T.kit = { paint, rect, rrect, ell, poly, spec, stroke, glowDisc, P, shadeOf, hiOf };
  const HEAD = [
    [-44, -5],
    [-48, -37, -24, -55, 2, -53],
    [28, -51, 42, -33, 42, -11],
    [42, -5, 44, -1, 50, 9],
    [54, 15, 50, 17, 44, 17],
    [44, 25, 46, 29, 42, 33],
    [40, 39, 38, 43, 32, 47],
    [24, 53, 12, 55, 0, 53],
    [-20, 51, -36, 41, -42, 23],
    [-46, 13, -46, 3, -44, -5],
  ];
  const HAIR_W = [
    [-48, 7],
    [-54, -37, -26, -65, 6, -61],
    [34, -57, 48, -37, 46, -13],
    [36, -25, 20, -33, 2, -29],
    [-6, -17, -16, -9, -28, -7],
    [-32, 3, -34, 15, -32, 27],
    [-40, 25, -46, 17, -48, 7],
  ];
  const HAIR_M = [
    [-48, 15],
    [-56, -27, -32, -63, 4, -59],
    [34, -57, 50, -37, 44, -13],
    [34, -23, 22, -25, 8, -21],
    [-2, -29, -12, -23, -20, -15],
    [-28, -11, -32, -1, -30, 11],
    [-36, 17, -40, 23, -42, 31],
    [-46, 27, -48, 21, -48, 15],
  ];
  const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = (v) => Math.hypot(v[0], v[1]) || 1;
  const nrm = (v) => [v[0] / len(v), v[1] / len(v)];
  const perp = (v) => [-v[1], v[0]];
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const limbPath = (a, b, c, w1, w2) => {
    const d1 = nrm(sub(b, a)),
      d2 = nrm(sub(c, b));
    const n1 = perp(d1),
      n2 = perp(d2);
    let nb = nrm([n1[0] + n2[0], n1[1] + n2[1]]);
    if (!isFinite(nb[0])) nb = n1;
    const wb = (w1 + w2) / 2;
    const p = P();
    const A1 = add(a, n1, w1),
      B1 = add(b, nb, wb),
      C1 = add(c, n2, w2),
      C2 = add(c, n2, -w2),
      B2 = add(b, nb, -wb),
      A2 = add(a, n1, -w1);
    p.moveTo(A1[0], A1[1]);
    p.lineTo(B1[0], B1[1]);
    p.lineTo(C1[0], C1[1]);
    const ang2 = Math.atan2(n2[1], n2[0]);
    p.arc(c[0], c[1], w2, ang2, ang2 + PI, true);
    p.lineTo(B2[0], B2[1]);
    p.lineTo(A2[0], A2[1]);
    const ang1 = Math.atan2(-n1[1], -n1[0]);
    p.arc(a[0], a[1], w1, ang1, ang1 + PI, true);
    p.closePath();
    return p;
  };
  const handPath = (h, dir, r) => {
    const p = P();
    p.ellipse(h[0] + dir[0] * r * 0.25, h[1] + dir[1] * r * 0.25, r, r * 0.86, Math.atan2(dir[1], dir[0]), 0, PI * 2);
    const t = add(h, perp(dir), -r * 0.7);
    p.moveTo(t[0] + r * 0.45, t[1]);
    p.ellipse(t[0], t[1], r * 0.45, r * 0.32, Math.atan2(dir[1], dir[0]) - 0.6, 0, PI * 2);
    return p;
  };
  const shoePath = (foot, a, col, heel) => {
    const p = P();
    const fx = foot[0],
      fy = foot[1];
    p.moveTo(fx - 7, fy + 2);
    p.bezierCurveTo(fx - 8, fy - 7, fx + 4, fy - 9, fx + 9, fy - 4);
    p.bezierCurveTo(fx + 15, fy - 3, fx + 17, fy + 1, fx + 16, fy + 3.5);
    p.lineTo(fx - 7, fy + 3.5);
    p.closePath();
    void a;
    void col;
    void heel;
    return p;
  };
  const OUTFIT_LEN = (T.OUTFIT_LEN = { coat: 26, trench: 40, robe: 92, gown: 92, dress: 44, ao_dai: 60, armor: 10, tunic: 30, spacesuit: 8 });
  T.OUTFIT_FLARE = {};
  T.OUTFIT_EXTRA = {};
  T.ACC_EXTRA = {};
  T.SKIRTS = new Set();
  T.HAIR_KEEP = new Set([MT.BERET, MT.HEADLAMP, MT.CROWN, MT.CONICAL_HAT]);
  T.HAIR_HIDE = new Set([MT.HOOD, MT.HELMET]);
  const torsoPath = (sk, w, extraLen, flare) => {
    const up = nrm(sub(sk.sh, sk.hip));
    const fw = [-up[1], up[0]];
    const fwd = fw[0] < 0 ? [-fw[0], -fw[1]] : fw;
    const sh = sk.sh,
      hip = sk.hip;
    const down = [-up[0], -up[1]];
    const S1 = add(add(sh, fwd, w.sh), up, -1),
      S2 = add(add(sh, fwd, -w.sh), up, -1);
    const W1 = add(lerp2(hip, sh, 0.45), fwd, w.waist),
      W2 = add(lerp2(hip, sh, 0.45), fwd, -w.waist);
    const H1 = add(add(hip, fwd, w.hip + flare * 0.5), down, extraLen),
      H2 = add(add(hip, fwd, -w.hip - flare * 0.5), down, extraLen);
    const p = P();
    p.moveTo(sh[0] - fwd[0] * 4, sh[1] + up[1] * -2 - 3);
    p.quadraticCurveTo(S1[0] + up[0] * 3, S1[1] - 2, S1[0], S1[1] + 4);
    p.quadraticCurveTo(W1[0] + 2, W1[1], H1[0], H1[1]);
    p.lineTo(H2[0], H2[1]);
    p.quadraticCurveTo(W2[0] - 2, W2[1], S2[0], S2[1] + 4);
    p.quadraticCurveTo(S2[0] + up[0] * 3, S2[1] - 2, sh[0] - fwd[0] * 4, sh[1] - 5);
    p.closePath();
    return { p, up, fwd, S1, S2, W1, W2, H1, H2 };
  };
  const hairFor = (ch) => ch.hair || MT.SHORT;
  const drawHair = (g, ch, hc, s, col, back) => {
    const hair = hairFor(ch);
    const fem = ch.gender === MT.FEMALE;
    const hx = hc[0],
      hy = hc[1];
    if (back) {
      if (hair === MT.LONG)
        paint(
          g,
          spec(
            [
              [-46, -10],
              [-60, 30, -54, 80, -40, 104],
              [-20, 108, 6, 100, 10, 80],
              [-6, 60, -20, 30, -20, 6],
            ],
            hx,
            hy,
            s,
          ),
          col,
          { d: 3, lw: 1.3 },
        );
      if (hair === MT.PONYTAIL)
        paint(
          g,
          spec(
            [
              [-40, -26],
              [-70, -20, -80, 20, -66, 60],
              [-58, 40, -52, 10, -36, -4],
            ],
            hx,
            hy,
            s,
          ),
          col,
          { d: 3, lw: 1.3 },
        );
      if (hair === MT.BUN) paint(g, ell(hx - 30 * s, hy - 36 * s, 22 * s, 22 * s), col, { d: 3, lw: 1.3 });
      if (hair === MT.AFRO) paint(g, ell(hx - 4 * s, hy - 12 * s, 66 * s, 62 * s), col, { d: 5, lw: 1.3 });
      if (hair === MT.CURLY)
        for (const [dx, dy, r] of [
          [-40, -30, 18],
          [-46, 0, 16],
          [-30, -50, 18],
          [-6, -60, 18],
          [20, -56, 16],
          [36, -40, 14],
        ])
          paint(g, ell(hx + dx * s, hy + dy * s, r * s, r * s), col, { d: 2, lw: 1.2 });
      return;
    }
    if (hair === MT.BALD) {
      paint(
        g,
        spec(
          [
            [-46, 6],
            [-48, -6, -42, -16, -34, -18],
            [-36, -6, -34, 8, -32, 18],
            [-40, 20, -46, 14, -46, 6],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 1, lw: 1.1 },
      );
      return;
    }
    if (hair === MT.AFRO) return;
    if (hair === MT.CURLY) {
      for (const [dx, dy, r] of [
        [-26, -44, 16],
        [-4, -52, 17],
        [18, -48, 15],
        [32, -34, 12],
      ])
        paint(g, ell(hx + dx * s, hy + dy * s, r * s, r * s), col, { d: 2, lw: 1.2 });
      return;
    }
    paint(g, spec(fem || hair === MT.LONG || hair === MT.BUN || hair === MT.PONYTAIL ? HAIR_W : HAIR_M, hx, hy, s), col, { d: 3, lw: 1.3 });
    if (hair === MT.SPIKY)
      for (const [dx, dy] of [
        [-20, -62],
        [0, -68],
        [20, -62],
      ])
        paint(
          g,
          poly([
            [hx + (dx - 10) * s, hy + (dy + 14) * s],
            [hx + dx * s, hy + (dy - 8) * s],
            [hx + (dx + 10) * s, hy + (dy + 14) * s],
          ]),
          col,
          { d: 1, lw: 1.1 },
        );
  };
  const HAT = {
    police_cap: (g, hx, hy, s, col, acc) => {
      paint(
        g,
        spec(
          [
            [-44, -30],
            [-46, -56, 40, -64, 48, -34],
            [48, -26, -44, -22, -44, -30],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(
        g,
        poly([
          [hx + 20 * s, hy - 28 * s],
          [hx + 62 * s, hy - 24 * s],
          [hx + 58 * s, hy - 18 * s],
          [hx + 18 * s, hy - 20 * s],
        ]),
        MT.VALUE_15171C,
        { d: 1, lw: 1.2 },
      );
      paint(g, ell(hx + 12 * s, hy - 40 * s, 6 * s, 7 * s), acc || MT.E3C35C, { d: 0, lw: 0.9 });
    },
    fedora: (g, hx, hy, s, col) => {
      paint(g, ell(hx + 4 * s, hy - 28 * s, 70 * s, 12 * s), col, { d: 2, lw: 1.3 });
      paint(
        g,
        spec(
          [
            [-38, -30],
            [-40, -70, 40, -76, 42, -30],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(g, rect(hx - 38 * s, hy - 40 * s, 80 * s, 8 * s), C.shade(col, -0.35), { d: 0, lw: 1 });
    },
    beanie: (g, hx, hy, s, col) => {
      paint(
        g,
        spec(
          [
            [-46, -16],
            [-48, -76, 46, -76, 46, -16],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(g, rrect(hx - 48 * s, hy - 24 * s, 96 * s, 14 * s, 5 * s), C.shade(col, -0.15), { d: 1, lw: 1.2 });
    },
    hardhat: (g, hx, hy, s, col) => {
      paint(
        g,
        spec(
          [
            [-46, -22],
            [-46, -80, 46, -80, 46, -22],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(g, rrect(hx - 54 * s, hy - 26 * s, 116 * s, 9 * s, 4 * s), col, { d: 1, lw: 1.2 });
      paint(g, rect(hx - 4 * s, hy - 74 * s, 8 * s, 50 * s), C.shade(col, 0.15), { d: 0, ink: false });
    },
    helmet: (g, hx, hy, s, col) => {
      paint(
        g,
        spec(
          [
            [-52, 20],
            [-60, -70, 56, -76, 54, 10],
            [40, 12, 40, -16, 10, -18],
            [-10, -18, -14, 10, -16, 30],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(
        g,
        spec(
          [
            [10, -14],
            [40, -16, 52, -6, 52, 12],
            [36, 14, 18, 8, 10, -14],
          ],
          hx,
          hy,
          s,
        ),
        MT.VALUE_9FC6DC,
        { d: 1, lw: 1.1 },
      );
    },
    beret: (g, hx, hy, s, col) => paint(g, ell(hx + 2 * s, hy - 46 * s, 54 * s, 18 * s, -0.15), col, { d: 2, lw: 1.3 }),
    cap: (g, hx, hy, s, col) => {
      paint(
        g,
        spec(
          [
            [-46, -24],
            [-46, -72, 44, -72, 46, -24],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 3, lw: 1.3 },
      );
      paint(
        g,
        poly([
          [hx + 30 * s, hy - 30 * s],
          [hx + 74 * s, hy - 26 * s],
          [hx + 70 * s, hy - 18 * s],
          [hx + 28 * s, hy - 22 * s],
        ]),
        C.shade(col, -0.15),
        { d: 1, lw: 1.2 },
      );
    },
    hood: (g, hx, hy, s, col) =>
      paint(
        g,
        spec(
          [
            [-58, 50],
            [-70, -40, -20, -78, 20, -70],
            [56, -60, 60, -20, 50, 4],
            [40, -30, 10, -40, -10, -30],
            [-30, -10, -30, 30, -20, 56],
          ],
          hx,
          hy,
          s,
        ),
        col,
        { d: 4, lw: 1.3 },
      ),
    headlamp: (g, hx, hy, s, col) => {
      paint(g, rrect(hx - 46 * s, hy - 32 * s, 94 * s, 10 * s, 4 * s), MT.VALUE_2B2B30, { d: 0, lw: 1 });
      paint(g, rrect(hx + 34 * s, hy - 38 * s, 16 * s, 20 * s, 4 * s), MT.E8E2C0, { d: 1, lw: 1, glow: MT.RGBA_255_240_190_0_9 });
      void col;
    },
    crown: (g, hx, hy, s, col) =>
      paint(
        g,
        poly([
          [hx - 40 * s, hy - 34 * s],
          [hx - 44 * s, hy - 74 * s],
          [hx - 20 * s, hy - 52 * s],
          [hx, hy - 82 * s],
          [hx + 20 * s, hy - 52 * s],
          [hx + 44 * s, hy - 74 * s],
          [hx + 40 * s, hy - 34 * s],
        ]),
        col || MT.E2B33A,
        { d: 2, lw: 1.2 },
      ),
    conical_hat: (g, hx, hy, s, col) =>
      paint(
        g,
        poly([
          [hx - 80 * s, hy - 24 * s],
          [hx, hy - 96 * s],
          [hx + 84 * s, hy - 24 * s],
        ]),
        col || MT.E3CF96,
        { d: 3, lw: 1.3 },
      ),
    chef_hat: (g, hx, hy, s, col) =>
      paint(
        g,
        spec(
          [
            [-40, -24],
            [-58, -60, -30, -100, 0, -84],
            [30, -104, 62, -60, 42, -24],
          ],
          hx,
          hy,
          s,
        ),
        col || MT.F5F5F2,
        { d: 2, lw: 1.3 },
      ),
  };
  const HAT_DEFAULT = { police_cap: MT.VALUE_1E2A44, fedora: MT.VALUE_3A352C, beanie: MT.VALUE_3A3F4A, hardhat: MT.E0A92A, helmet: MT.VALUE_2B3B48, beret: MT.VALUE_7A2A2A, cap: MT.VALUE_2F4B7A, hood: null, headlamp: MT.VALUE_2B2B30, crown: MT.E2B33A, conical_hat: MT.E3CF96, chef_hat: MT.F5F5F2 };
  T.HAT = HAT;
  T.HAT_DEFAULT = HAT_DEFAULT;
  const drawFace = (g, ch, hc, s, pal, o) => {
    const hx = hc[0],
      hy = hc[1];
    const fem = ch.gender === MT.FEMALE;
    const kid = ch.age === MT.CHILD;
    const old = ch.age === MT.ELDERLY;
    const acc = ch.accessories || [];
    const blink = Math.sin((o.t || 0) * 1.7 + (o.phase || 0)) > 0.985 ? 0.15 : 1;
    const er = (kid ? 1.25 : 1) * s;
    paint(g, ell(hx - 20 * s, hy + 6 * s, 8 * s, 12 * s), C.mix(pal.skin, MT.C86A50, 0.15), { d: 1, lw: 1 });
    stroke(
      g,
      [
        [hx - 22 * s, hy + 1 * s],
        [hx - 17 * s, hy + 6 * s, hx - 21 * s, hy + 12 * s],
      ],
      C.mix(pal.skin, MT.VALUE_7A3A2A, 0.5),
      1.1 * s * 1.6,
      false,
    );
    if (!acc.includes(MT.EYEPATCH)) {
      paint(
        g,
        spec(
          [
            [14, -1],
            [18, -11, 32, -11, 36, -1],
            [32, 5, 18, 5, 14, -1],
          ],
          hx,
          hy,
          s,
          1,
        ),
        MT.FFFFFF,
        { d: 0, lw: 0.9 * s * 1.4 },
      );
      g.save();
      g.translate(hx + 28 * s, hy - 1 * s);
      g.scale(er, er * blink);
      g.fillStyle = MT.VALUE_2B1E1E;
      g.beginPath();
      g.ellipse(0, 0, 4.4, 5.2, 0, 0, PI * 2);
      g.fill();
      g.fillStyle = MT.FFFFFF;
      g.beginPath();
      g.arc(1.4, -1.8, 1.5, 0, PI * 2);
      g.fill();
      g.restore();
    } else paint(g, ell(hx + 26 * s, hy - 1 * s, 10 * s, 9 * s), MT.VALUE_151515, { d: 0, lw: 1 });
    stroke(
      g,
      [
        [hx + 13 * s, hy - 3 * s],
        [hx + 24 * s, hy - 12 * s, hx + 38 * s, hy - 3 * s],
      ],
      INK,
      1.4 * s,
      true,
    );
    if (fem)
      stroke(
        g,
        [
          [hx + 36 * s, hy - 5 * s],
          [hx + 41 * s, hy - 8 * s],
        ],
        INK,
        1.1 * s,
        true,
      );
    stroke(
      g,
      [
        [hx + 10 * s, hy - 18 * s],
        [hx + 24 * s, hy - 25 * s, hx + 40 * s, hy - 17 * s],
      ],
      fem ? pal.hair : C.shade(pal.hair, -0.1),
      (fem ? 2.6 : 4) * s,
      false,
    );
    stroke(
      g,
      [
        [hx + 44 * s, hy + 12 * s],
        [hx + 50 * s, hy + 20 * s, hx + 41 * s, hy + 21 * s],
      ],
      C.mix(pal.skin, MT.VALUE_7A3A2A, 0.55),
      1.8 * s,
      false,
    );
    const talk = o.action === MT.TALK || o.action === MT.SHOUT || o.action === MT.PHONE;
    const open = talk ? 0.5 + 0.5 * Math.sin((o.t || 0) * 14) : 0;
    const happy = o.action === MT.CELEBRATE || o.action === MT.CLAP || o.action === MT.WAVE;
    if (acc.includes(MT.MUSTACHE))
      paint(
        g,
        spec(
          [
            [24, 31],
            [30, 23, 42, 23, 48, 31],
            [50, 37, 42, 39, 38, 35],
            [34, 39, 24, 39, 24, 31],
          ],
          hx,
          hy,
          s,
        ),
        pal.hair,
        { d: 1, lw: 1 },
      );
    if (open > 0.15) paint(g, ell(hx + 38 * s, hy + 40 * s, 6 * s, 4 * s * open + 1.5 * s), MT.VALUE_5A1F24, { d: 0, lw: 0.9 });
    else
      stroke(
        g,
        happy
          ? [
              [hx + 30 * s, hy + 37 * s],
              [hx + 38 * s, hy + 46 * s, hx + 46 * s, hy + 36 * s],
            ]
          : [
              [hx + 30 * s, hy + 40 * s],
              [hx + 38 * s, hy + 43 * s, hx + 45 * s, hy + 39 * s],
            ],
        fem ? MT.B4505A : MT.VALUE_6A3030,
        (fem ? 2.4 : 1.8) * s,
        !fem,
      );
    g.save();
    g.globalAlpha = 0.3;
    g.fillStyle = MT.EB7A6E;
    g.beginPath();
    g.ellipse(hx + 20 * s, hy + 22 * s, 9 * s, 5 * s, 0, 0, PI * 2);
    g.fill();
    g.restore();
    if (old)
      stroke(
        g,
        [
          [hx + 36 * s, hy + 22 * s],
          [hx + 40 * s, hy + 30 * s],
        ],
        C.shade(pal.skin, -0.3),
        1 * s,
        false,
      );
    if (acc.includes(MT.BEARD))
      paint(
        g,
        spec(
          [
            [-14, 20],
            [0, 30, 20, 30, 30, 34],
            [40, 36, 46, 40, 44, 46],
            [40, 60, 20, 66, 0, 60],
            [-18, 54, -26, 40, -14, 20],
          ],
          hx,
          hy,
          s,
        ),
        pal.hair,
        { d: 2, lw: 1.1 },
      );
    if (acc.includes(MT.GLASSES)) {
      g.save();
      g.lineWidth = 2 * s;
      g.strokeStyle = MT.VALUE_1F1F24;
      g.beginPath();
      g.ellipse(hx + 26 * s, hy - 1 * s, 11 * s, 9 * s, 0, 0, PI * 2);
      g.moveTo(hx + 15 * s, hy - 2 * s);
      g.lineTo(hx - 14 * s, hy - 4 * s);
      g.stroke();
      g.restore();
    }
    if (acc.includes(MT.FACE_MASK))
      paint(
        g,
        spec(
          [
            [6, 16],
            [30, 10, 52, 14, 52, 28],
            [50, 44, 30, 52, 8, 46],
          ],
          hx,
          hy,
          s,
        ),
        (ch.colors && ch.colors.mask) || MT.DFE8EE,
        { d: 1, lw: 1 },
      );
  };
  const drawHead = (g, ch, sk, pal, o) => {
    const r = sk.d.head * 1.55;
    const s = r / 52;
    const hc = [sk.hd[0] + 1, sk.hd[1] - (r - sk.d.head) * 0.75];
    const hat = ch.headwear && ch.headwear !== MT.NONE ? ch.headwear : null;
    const hatCol = (ch.colors && ch.colors.hat) || HAT_DEFAULT[hat] || pal.top;
    if (!T.HAIR_HIDE.has(hat)) drawHair(g, ch, hc, s, pal.hair, true);
    if (hat === MT.HOOD) HAT.hood(g, hc[0], hc[1], s, hatCol || pal.top);
    paint(g, spec(HEAD, hc[0], hc[1], s), pal.skin, { d: 3, lw: 1.3, sa: 0.28 });
    if (!hat || T.HAIR_KEEP.has(hat)) drawHair(g, ch, hc, s, pal.hair, false);
    else if (!T.HAIR_HIDE.has(hat))
      paint(
        g,
        spec(
          [
            [-48, 15],
            [-50, -6, -46, -16, -40, -20],
            [-34, -6, -32, 6, -32, 16],
          ],
          hc[0],
          hc[1],
          s,
        ),
        pal.hair,
        { d: 1, lw: 1.1 },
      );
    drawFace(g, ch, hc, s, pal, o);
    if (hat && hat !== MT.HOOD && HAT[hat]) HAT[hat](g, hc[0], hc[1], s, hatCol, pal.accent);
    else if (hat === MT.HOOD)
      paint(
        g,
        spec(
          [
            [-58, 50],
            [-60, 20, -50, -10, -44, -20],
            [-40, 0, -36, 30, -30, 56],
          ],
          hc[0],
          hc[1],
          s,
        ),
        C.shade(hatCol || pal.top, -0.1),
        { d: 1, lw: 1.2 },
      );
  };
  const sleeveCol = (ch, pal) => {
    const o = ch.outfit;
    if (o === MT.DRESS || o === MT.GOWN) return (ch.colors && ch.colors.sleeve) || pal.top;
    return pal.top;
  };
  const drawTorso = (g, ch, sk, pal) => {
    const b = sk.d.shoulderW / 10.5;
    const fem = ch.gender === MT.FEMALE;
    const heavy = ch.build === MT.HEAVY;
    const w = { sh: (fem ? 13 : 15.5) * Math.max(0.85, b), waist: (fem ? 10.5 : 13) * (heavy ? 1.3 : 1), hip: (fem ? 13.5 : 13) * (heavy ? 1.25 : 1) };
    const outfit = ch.outfit || MT.CASUAL;
    const L = OUTFIT_LEN[outfit] || 6;
    const flare = T.OUTFIT_FLARE[outfit] != null ? T.OUTFIT_FLARE[outfit] : outfit === MT.DRESS || outfit === MT.GOWN || outfit === MT.ROBE ? 26 : outfit === MT.TRENCH || outfit === MT.COAT ? 6 : 0;
    const T0 = torsoPath(sk, w, L, flare);
    const top = pal.top;
    if (outfit === MT.OVERALLS) {
      paint(g, T0.p, (ch.colors && ch.colors.shirt) || MT.E6DCC8, { d: 4, lw: 1.3 });
      const bib = torsoPath({ sh: lerp2(sk.hip, sk.sh, 0.62), hip: sk.hip }, { sh: w.sh * 0.6, waist: w.waist * 0.95, hip: w.hip }, 4, 0);
      paint(g, bib.p, pal.bottom || top, { d: 4, lw: 1.3 });
      stroke(g, [add(sk.sh, T0.fwd, 6), lerp2(sk.hip, sk.sh, 0.62)], C.shade(pal.bottom || top, -0.2), 2.4, false);
      return T0;
    }
    paint(g, T0.p, top, { d: 4.5, lw: 1.3 });
    const neckBase = add(sk.sh, T0.up, -1);
    const vtip = add(lerp2(sk.hip, sk.sh, 0.55), T0.fwd, 2);
    if (outfit === MT.SUIT || outfit === MT.COAT || outfit === MT.TRENCH || outfit === MT.UNIFORM || outfit === MT.MILITARY) {
      const shirt = (ch.colors && ch.colors.shirt) || (outfit === MT.UNIFORM || outfit === MT.MILITARY ? C.shade(top, 0.25) : MT.F1ECE2);
      paint(g, poly([add(neckBase, T0.fwd, -3), add(neckBase, T0.fwd, 6), vtip]), shirt, { d: 0, lw: 1 });
      if (outfit === MT.SUIT && !fem) paint(g, poly([add(neckBase, T0.fwd, 1), add(neckBase, T0.fwd, 3.5), add(vtip, T0.up, 4), add(vtip, T0.fwd, 1)]), pal.accent || MT.VALUE_7A2632, { d: 0, lw: 0.9 });
      paint(g, poly([add(neckBase, T0.fwd, 6), add(add(neckBase, T0.fwd, 11), T0.up, -8), vtip]), C.shade(top, 0.12), { d: 0, lw: 1 });
      paint(g, poly([add(neckBase, T0.fwd, -3), add(add(neckBase, T0.fwd, -7), T0.up, -8), vtip]), C.shade(top, -0.12), { d: 0, lw: 1 });
      for (const k of [0.4, 0.22]) paint(g, ell(...add(lerp2(sk.hip, sk.sh, k), T0.fwd, 3), 1.3, 1.3), outfit === MT.UNIFORM || outfit === MT.MILITARY ? MT.E3C35C : MT.VALUE_2A1C22, { d: 0, ink: false });
      if (outfit === MT.UNIFORM || outfit === MT.MILITARY) {
        paint(g, rect(sk.hip[0] - w.hip, sk.hip[1] - 3, w.hip * 2, 4), MT.VALUE_1E1A18, { d: 0, lw: 0.9 });
        if (outfit === MT.UNIFORM) paint(g, poly([add(lerp2(sk.hip, sk.sh, 0.78), T0.fwd, 5), add(lerp2(sk.hip, sk.sh, 0.78), T0.fwd, 10), add(lerp2(sk.hip, sk.sh, 0.68), T0.fwd, 7.5)]), MT.E3C35C, { d: 0, lw: 0.8 });
      }
      if (outfit === MT.TRENCH) paint(g, rect(sk.hip[0] - w.hip - 2, sk.hip[1] - 6, (w.hip + 2) * 2, 5), C.shade(top, -0.2), { d: 0, lw: 0.9 });
    } else if (outfit === MT.DRESS || outfit === MT.GOWN) {
      const belt = lerp2(sk.hip, sk.sh, 0.12);
      paint(g, rect(belt[0] - w.waist - 1, belt[1] - 2, (w.waist + 1) * 2, 3), C.shade(top, -0.25), { d: 0, lw: 0.8 });
      paint(g, ell(...add(neckBase, T0.up, -2.5), 6, 3.5), pal.skin, { d: 0, lw: 0.9 });
    } else if (outfit === MT.ROBE) {
      paint(g, poly([add(neckBase, T0.fwd, -3), add(neckBase, T0.fwd, 6), vtip]), (ch.colors && ch.colors.accent) || MT.E8E2D4, { d: 0, lw: 1 });
    } else if (outfit === MT.APRON) {
      paint(g, rrect(sk.hip[0] - 4, lerp2(sk.hip, sk.sh, 0.7)[1], w.hip + 6, 30, 3), MT.F2EFE8, { d: 2, lw: 1 });
    } else if (outfit === MT.SPORT) {
      stroke(g, [add(sk.sh, T0.fwd, -w.sh + 2), add(sk.hip, T0.fwd, -w.hip + 1)], MT.FFFFFF, 2.4, false);
    } else if (T.OUTFIT_EXTRA[outfit]) {
      T.OUTFIT_EXTRA[outfit](g, { ch, sk, pal, w, T0, top, neckBase, vtip, add, lerp2 });
    } else {
      paint(g, ell(...add(neckBase, T0.up, -1.5), 6, 3), C.shade(top, -0.2), { d: 0, lw: 0.9 });
    }
    if ((ch.accessories || []).includes(MT.VEST)) paint(g, torsoPath(sk, { sh: w.sh * 0.9, waist: w.waist * 0.95, hip: w.hip * 0.95 }, 2, 0).p, (ch.colors && ch.colors.accent) || MT.E9E14B, { d: 3, lw: 1.2, sa: 0.2 });
    if ((ch.accessories || []).includes(MT.SCARF)) paint(g, rrect(sk.sh[0] - 8, sk.sh[1] - 3, 18, 8, 4), (ch.colors && ch.colors.accent) || MT.B03A3A, { d: 1, lw: 1 });
    return T0;
  };
  T.drawCharacter = (g, ch, o) => {
    o = o || {};
    ch = typeof ch === MT.STRING ? ME.registry.characters[ch] || (ME.customCharacters && ME.customCharacters[ch]) || ME.registry.characters.man_casual : ch || ME.registry.characters.man_casual;
    const RI = ME.rigInternals || {};
    const a = ME.registry.actions[o.action || MT.STAND] || ME.registry.actions.stand;
    const pose = o.pose || a.pose(o.phase || 0, o.t || 0, o);
    const sk = ME.skeleton(ch, pose);
    const pal = RI.palette ? RI.palette(ch, Object.assign({}, o, { style: MT.FLAT })) : ME.charPalette(ch, {});
    const f = o.facing == null ? 1 : o.facing;
    const scale = (o.scale || 1) * sk.d.s;
    let footLock = 0;
    if (!pose.rot && RI.GROUND_LOCK && RI.GROUND_LOCK[o.action || MT.STAND] != null) {
      const lowest = Math.max(sk.legs[0].foot[1], sk.legs[1].foot[1]);
      footLock = Math.max(0, RI.STAND_FOOT_Y - lowest - RI.GROUND_LOCK[o.action || MT.STAND]);
    }
    g.save();
    if (o.shadow !== false && !pose.rot) {
      g.fillStyle = MT.RGBA_20_10_30_0_28;
      g.beginPath();
      g.ellipse(0, 0, 30 * scale, 5 * scale, 0, 0, PI * 2);
      g.fill();
    }
    const fs = Math.abs(f) < 0.12 ? 0.12 * Math.sign(f || 1) : f;
    g.scale(scale * fs, scale);
    const prevLF = T.LF;
    T.LF = fs < 0 ? -1 : 1;
    if (footLock) g.translate(0, footLock);
    if (pose.rot) {
      g.translate(0, sk.hip[1]);
      g.rotate(pose.rot);
      g.translate(0, -sk.hip[1]);
    }
    const outfit = ch.outfit || MT.CASUAL;
    const skirt = outfit === MT.DRESS || outfit === MT.GOWN || outfit === MT.ROBE || outfit === MT.AO_DAI_2 || T.SKIRTS.has(outfit);
    const legCol = outfit === MT.DRESS || outfit === MT.GOWN ? pal.skin : outfit === MT.AO_DAI_2 ? (ch.colors && ch.colors.bottom) || MT.F4F1EA : pal.bottom;
    const bl = sk.legs[1],
      fl = sk.legs[0],
      ba = sk.arms[1],
      fa = sk.arms[0];
    const dk = (c) => C.shade(c, -0.18);
    const tw = sk.d.thighW / 14.5;
    const legW = [(ch.gender === MT.FEMALE ? 6.2 : 7.6) * tw, (ch.gender === MT.FEMALE ? 4.6 : 6.1) * Math.sqrt(tw)];
    const armW = [5.8 * (sk.d.upperW / 10), 4.8 * Math.sqrt(sk.d.foreW / 8.4)];
    const shoe = pal.shoes;
    paint(g, limbPath(sk.sh, ba.elbow, ba.hand, armW[0], armW[1]), dk(sleeveCol(ch, pal)), { d: 2.5, lw: 1.2 });
    const bdir = nrm(sub(ba.hand, ba.elbow));
    paint(g, handPath(ba.hand, bdir, 5.2), dk(pal.skin), { d: 1.4, lw: 1.1 });
    paint(g, limbPath(sk.hip, bl.knee, bl.foot, legW[0], legW[1]), dk(legCol), { d: 2.5, lw: 1.2 });
    paint(g, shoePath(bl.foot), dk(shoe), { d: 1.5, lw: 1.1 });
    paint(g, limbPath(sk.hip, fl.knee, fl.foot, legW[0], legW[1]), legCol, { d: 3, lw: 1.2 });
    paint(g, shoePath(fl.foot), shoe, { d: 1.5, lw: 1.1 });
    if (skirt && outfit !== MT.ROBE) {
      const knee = lerp2(fl.knee, bl.knee, 0.5);
      const hemY = Math.max(knee[1] + (outfit === MT.GOWN || outfit === MT.AO_DAI_2 ? 30 : 6), sk.hip[1] + 20);
      paint(
        g,
        poly([
          [sk.hip[0] - 11, sk.hip[1] - 8],
          [sk.hip[0] + 11, sk.hip[1] - 8],
          [sk.hip[0] + 19, hemY],
          [sk.hip[0] - 19, hemY],
        ]),
        outfit === MT.AO_DAI_2 ? pal.top : (ch.colors && ch.colors.bottom) || pal.top,
        { d: 4, lw: 1.2 },
      );
    }
    const acc = ch.accessories || [];
    if (acc.includes(MT.BACKPACK) || acc.includes(MT.TANK)) paint(g, rrect(sk.sh[0] - 22, sk.sh[1] + 2, 13, 38, 5), acc.includes(MT.TANK) ? MT.VALUE_9AA3AB : MT.VALUE_55503F, { d: 2, lw: 1.2 });
    if (acc.includes(MT.CAPE))
      paint(
        g,
        poly([
          [sk.sh[0] - 6, sk.sh[1]],
          [sk.hip[0] - 34 + Math.sin((o.t || 0) * 3) * 6, Math.max(bl.knee[1], fl.knee[1]) + 18],
          [sk.hip[0] + 4, Math.max(bl.knee[1], fl.knee[1]) + 20],
          [sk.sh[0] + 6, sk.sh[1] + 2],
        ]),
        (ch.colors && ch.colors.cape) || pal.accent || MT.VALUE_8A1A1A,
        { d: 3, lw: 1.2 },
      );
    for (const ax of acc) if (T.ACC_EXTRA[ax] && T.ACC_EXTRA[ax].back) T.ACC_EXTRA[ax].back(g, { ch, sk, pal, o, fa, ba, bl, fl });
    const neckA = add(sk.sh, nrm(sub(sk.neck, sk.sh)), -2);
    paint(g, limbPath(neckA, sk.neck, add(sk.neck, nrm(sub(sk.neck, sk.sh)), 4), 3.6, 3.4), C.shade(pal.skin, -0.1), { d: 0, lw: 1.1 });
    const T0 = drawTorso(g, ch, sk, pal);
    void T0;
    if (acc.includes(MT.CAMERA)) {
      const cp = lerp2(sk.sh, sk.hip, 0.32);
      paint(g, rrect(cp[0] + 4, cp[1] - 2, 15, 10, 2), MT.VALUE_1D1F24, { d: 1, lw: 1 });
      paint(g, ell(cp[0] + 14, cp[1] + 3, 3.6, 3.6), MT.VALUE_3D434C, { d: 0, lw: 0.8 });
    }
    drawHead(g, ch, sk, pal, o);
    for (const ax of acc) if (T.ACC_EXTRA[ax] && T.ACC_EXTRA[ax].front) T.ACC_EXTRA[ax].front(g, { ch, sk, pal, o, fa, ba, bl, fl });
    if (RI.heldKindFor) {
      const heldKind = RI.heldKindFor(pose, o, acc);
      const arm = heldKind === MT.BRIEFCASE ? ba : fa;
      if (heldKind) RI.drawHeld(g, heldKind, arm.hand, arm.elbow, pal, o.t);
      if (!pose.hold && o.hold && !(RI.HELD_KINDS && RI.HELD_KINDS[o.hold]) && !(ME.HOLDABLE && ME.HOLDABLE[o.hold])) RI.drawHeldAsset(g, o.hold, fa.hand, o.holdScale);
    }
    paint(g, limbPath(sk.sh, fa.elbow, fa.hand, armW[0], armW[1]), sleeveCol(ch, pal), { d: 3, lw: 1.2 });
    const cuff = lerp2(fa.elbow, fa.hand, 0.86);
    void cuff;
    paint(g, handPath(fa.hand, nrm(sub(fa.hand, fa.elbow)), 5.4), pal.skin, { d: 1.4, lw: 1.1 });
    T.LF = prevLF;
    if (o.lights) {
      const m = g.getTransform();
      const toWorld = (p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
      const dir = Math.atan2(fa.hand[1] - fa.elbow[1], fa.hand[0] - fa.elbow[0]);
      if (RI.heldKindFor && RI.heldKindFor(pose, o, acc) === MT.FLASHLIGHT) o.lights.push({ type: MT.BEAM, p: toWorld([fa.hand[0] + Math.cos(dir) * 18, fa.hand[1] + Math.sin(dir) * 18]), angle: f < 0 ? PI - dir : dir, len: 520 * scale, color: MT.FFF2CF });
      if (pose.sparks) o.lights.push({ type: MT.SPARKS, p: toWorld([fa.hand[0] + Math.cos(dir) * 30, fa.hand[1] + Math.sin(dir) * 30]), color: MT.BFE0FF, seed: ch.id });
      if ((ch.headwear || "") === MT.HEADLAMP) o.lights.push({ type: MT.BEAM, p: toWorld([sk.hd[0] + 14, sk.hd[1] - 8]), angle: f < 0 ? PI - 0.12 : 0.12, len: 420 * scale, color: MT.FFF4D8 });
    }
    g.restore();
    return sk;
  };
  if (ME.charFx) T.drawCharacter = ME.charFx(T.drawCharacter);
  const CH = (id, name, tags, o) => ME.registerCharacter(Object.assign({ id, name, tags: tags.concat([MT.HOAT_HINH]), builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [], toon: true }, o));
  CH(MT.TOON_WOMAN_AFRO, MT.CO_GAI_TOC_XOAN_BONG, [MT.NU, MT.TRE], { gender: MT.FEMALE, hair: MT.AFRO, outfit: MT.CASUAL, colors: { skin: MT.VALUE_8D5A3B, hair: MT.VALUE_1E140F, top: MT.E2A42C, bottom: MT.VALUE_2F4B7A, shoes: MT.F2EFE8 } });
  CH(MT.TOON_MAN_SUIT_DARK, MT.DOANH_NHAN_DA_MAU, [MT.NAM_2, MT.DOANH_NHAN_2], { outfit: MT.SUIT, accessories: [MT.BRIEFCASE], colors: { skin: MT.VALUE_6B4430, hair: MT.VALUE_141010, top: MT.VALUE_2F3B55, bottom: MT.VALUE_232838, accent: MT.C8352C } });
  CH(MT.TOON_TEEN_BOY, MT.CAU_THIEU_NIEN_TOC_DUNG, [MT.NAM_2, MT.THIEU_NIEN], { age: MT.TEEN, hair: MT.SPIKY, build: MT.SLIM, colors: { skin: MT.F0C49E, hair: MT.VALUE_3A2418, top: MT.VALUE_3A6AB0, bottom: MT.VALUE_2C3038, shoes: MT.E2574C } });
  CH(MT.TOON_TEEN_GIRL, MT.NU_SINH_DEO_BA_LO, [MT.NU, MT.THIEU_NIEN, MT.HOC_SINH_2], { gender: MT.FEMALE, age: MT.TEEN, hair: MT.PONYTAIL, accessories: [MT.BACKPACK], colors: { skin: MT.F2C9A8, hair: MT.VALUE_5A2F20, top: MT.F2A7C0, bottom: MT.VALUE_3A4A6A } });
  CH(MT.TOON_REDHEAD_WOMAN, MT.NU_NHAN_VIEN_TOC_DO, [MT.NU, MT.VAN_PHONG], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.SUIT, colors: { skin: MT.F6D2B8, hair: MT.C0542C, top: MT.VALUE_2F8F7A, bottom: MT.VALUE_2A3A3A, accent: MT.F4EFE4 } });
  CH(MT.TOON_HIPSTER, MT.CHANG_RAU_KINH_MU_LEN, [MT.NAM_2, MT.TRE], { headwear: MT.BEANIE, accessories: [MT.BEARD, MT.GLASSES], colors: { skin: MT.E8B48C, hair: MT.VALUE_5A3A22, top: MT.C8704A, bottom: MT.VALUE_2F3B55, hat: MT.VALUE_3A5A4A } });
  CH(MT.TOON_CURLY_GLASSES, MT.CO_GAI_TOC_XOAN_DEO_KINH, [MT.NU, MT.TRE], { gender: MT.FEMALE, hair: MT.CURLY, accessories: [MT.GLASSES], outfit: MT.DRESS, colors: { skin: MT.D89A74, hair: MT.VALUE_2A1A12, top: MT.VALUE_8A4AB0 } });
  CH(MT.TOON_TOURIST, MT.KHACH_DU_LICH, [MT.NAM_2, MT.DU_LICH], { headwear: MT.CAP, accessories: [MT.CAMERA, MT.BACKPACK], colors: { skin: MT.F4CAA4, hair: MT.VALUE_8A6A3A, top: MT.F2C230, bottom: MT.C8B48A, hat: MT.E2574C } });
  CH(MT.TOON_PAINTER, MT.HOA_SI_DOI_MU_NOI, [MT.NAM_2, MT.NGHE_SI], { headwear: MT.BERET, accessories: [MT.MUSTACHE, MT.SCARF], outfit: MT.COAT, colors: { skin: MT.F0C09A, hair: MT.VALUE_2A1E18, top: MT.VALUE_4A5A7A, hat: MT.VALUE_1E1E24, accent: MT.E2574C } });
  CH(MT.TOON_GRANDPA, MT.ONG_CU_HIEN_HAU, [MT.NAM_2, MT.NGUOI_GIA], { age: MT.ELDERLY, hair: MT.BALD, accessories: [MT.GLASSES, MT.MUSTACHE], outfit: MT.COAT, colors: { skin: MT.EABD98, hair: MT.E8E4DC, top: MT.VALUE_7A6A52, bottom: MT.VALUE_4A4A52 } });
  CH(MT.TOON_GRANDMA, MT.BA_CU_DEO_KINH, [MT.NU, MT.NGUOI_GIA], { gender: MT.FEMALE, age: MT.ELDERLY, hair: MT.BUN, accessories: [MT.GLASSES], outfit: MT.DRESS, colors: { skin: MT.E8B896, hair: MT.E6E2DA, top: MT.VALUE_8A5A7A } });
  CH(MT.TOON_KID_BOY, MT.BE_TRAI_TOC_XOAN, [MT.TRE_EM, MT.NAM_2], { age: MT.CHILD, hair: MT.CURLY, colors: { skin: MT.A86A48, hair: MT.VALUE_1E140F, top: MT.VALUE_4FA05A, bottom: MT.VALUE_2F4B7A } });
  CH(MT.TOON_KID_GIRL, MT.BE_GAI_TOC_BIM, [MT.TRE_EM, MT.NU], { gender: MT.FEMALE, age: MT.CHILD, hair: MT.PONYTAIL, outfit: MT.DRESS, colors: { skin: MT.F4D0B4, hair: MT.D8A040, top: MT.E2574C } });
  CH(MT.TOON_CHEF_WOMAN, MT.NU_DAU_BEP, [MT.NU, MT.NHA_HANG], { gender: MT.FEMALE, hair: MT.BUN, headwear: MT.CHEF_HAT, outfit: MT.APRON, colors: { skin: MT.F0C4A0, hair: MT.VALUE_3A2418, top: MT.F4F4F0, bottom: MT.VALUE_2A2A30 } });
  CH(MT.TOON_MECHANIC_WOMAN, MT.NU_THO_MAY, [MT.NU, MT.THO], { gender: MT.FEMALE, hair: MT.PONYTAIL, outfit: MT.OVERALLS, headwear: MT.CAP, colors: { skin: MT.C88A64, hair: MT.VALUE_2A1A12, top: MT.E6DCC8, bottom: MT.VALUE_2F6AB0, hat: MT.E2574C } });
  CH(MT.TOON_BUSINESSMAN_GRAY, MT.QUY_ONG_TOC_BAC, [MT.NAM_2, MT.DOANH_NHAN_2, MT.TRUNG_NIEN], { outfit: MT.SUIT, build: MT.HEAVY, hair: MT.SHORT, accessories: [MT.GLASSES], colors: { skin: MT.F2C8A4, hair: MT.B8B4AC, top: MT.VALUE_6A6E78, bottom: MT.VALUE_3A3E48, accent: MT.VALUE_2F6AB0 } });
  T.characters = [MT.TOON_WOMAN_AFRO, MT.TOON_MAN_SUIT_DARK, MT.TOON_TEEN_BOY, MT.TOON_TEEN_GIRL, MT.TOON_REDHEAD_WOMAN, MT.TOON_HIPSTER, MT.TOON_CURLY_GLASSES, MT.TOON_TOURIST, MT.TOON_PAINTER, MT.TOON_GRANDPA, MT.TOON_GRANDMA, MT.TOON_KID_BOY, MT.TOON_KID_GIRL, MT.TOON_CHEF_WOMAN, MT.TOON_MECHANIC_WOMAN, MT.TOON_BUSINESSMAN_GRAY];
  const A = (id, def) => {
    T.assets[id] = def;
    if (!T.list.assets.includes(id)) T.list.assets.push(id);
  };
  const NEW = (id, name, category, size, draw, extra) => {
    ME.registerAsset(id, Object.assign({ name, category, size, draw: (g, o) => withToon(() => draw(g, o || {})), tags: [MT.TOON] }, extra || {}));
    T.assets[id] = { draw };
    if (!T.list.assets.includes(id)) T.list.assets.push(id);
  };
  const withToon = (fn) => {
    const prev = T.LF;
    try {
      return fn();
    } finally {
      T.LF = prev;
    }
  };
  T.A = A;
  T.NEW = NEW;
  const E = (id, def) => {
    T.envs[id] = def;
    if (!T.list.envs.includes(id)) T.list.envs.push(id);
  };
  T.E = E;
  T.enter = (style) => {
    if (T.active) return null;
    const saved = { assets: {}, envs: {}, draw: ME.drawCharacter, style: T.style };
    T.style = style === MT.FLAT ? MT.FLAT : MT.LINE;
    for (const id of Object.keys(T.assets)) {
      const a = ME.registry.assets[id];
      if (!a) continue;
      saved.assets[id] = a.draw;
      a.draw = T.assets[id].draw;
      if (T.assets[id].lights) {
        saved.assets[id + MT.L] = a.lights;
        a.lights = T.assets[id].lights;
      }
    }
    for (const id of Object.keys(T.envs)) {
      const e = ME.registry.environments[id];
      if (!e) continue;
      saved.envs[id] = e;
      const ov = typeof T.envs[id] === MT.FUNCTION ? T.envs[id](e) : T.envs[id];
      ME.registry.environments[id] = Object.assign({}, e, ov);
    }
    ME.drawCharacter = T.drawCharacter;
    T.active = saved;
    return saved;
  };
  T.exit = (saved) => {
    if (!saved || T.active !== saved) return;
    for (const id of Object.keys(saved.assets)) {
      if (id.endsWith(MT.L)) {
        const a = ME.registry.assets[id.slice(0, -2)];
        if (a) a.lights = saved.assets[id];
        continue;
      }
      const a = ME.registry.assets[id];
      if (a) a.draw = saved.assets[id];
    }
    for (const id of Object.keys(saved.envs)) ME.registry.environments[id] = saved.envs[id];
    ME.drawCharacter = saved.draw;
    T.style = saved.style;
    T.active = null;
  };
  T.wrap = (style, fn) => {
    const s = T.enter(style);
    try {
      return fn();
    } finally {
      T.exit(s);
    }
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
