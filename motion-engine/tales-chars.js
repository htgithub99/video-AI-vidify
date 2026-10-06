(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  const RI = ME.rigInternals;
  if (!T || !RI) return;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const K = T.kit;
  const TALES = (ME.TALES = ME.TALES || { characters: [], assets: [], envs: [] });
  const mkD = (g, ox, oy, u, col, acc) => {
    const X = (x) => ox + x * u,
      Y = (y) => oy + y * u;
    const D = { g, u, col, acc };
    D.p = (pts, smooth) =>
      K.poly(
        pts.map((q) => [X(q[0]), Y(q[1])]),
        smooth,
      );
    D.q = (segs) => {
      const p = new Path2D();
      p.moveTo(X(segs[0][0]), Y(segs[0][1]));
      for (let i = 1; i < segs.length; i++) {
        const s = segs[i];
        if (s.length === 6) p.bezierCurveTo(X(s[0]), Y(s[1]), X(s[2]), Y(s[3]), X(s[4]), Y(s[5]));
        else if (s.length === 4) p.quadraticCurveTo(X(s[0]), Y(s[1]), X(s[2]), Y(s[3]));
        else p.lineTo(X(s[0]), Y(s[1]));
      }
      p.closePath();
      return p;
    };
    D.e = (x, y, rx, ry, rot) => K.ell(X(x), Y(y), rx * u, ry * u, rot || 0);
    D.r = (x, y, w, h, rad) => K.rrect(X(x), Y(y), w * u, h * u, (rad || 0) * u);
    D.f = (path, c, o) => {
      o = o || {};
      K.paint(g, path, c, Object.assign({}, o, { d: (o.d == null ? 0.15 : o.d) * u, lw: o.lw || 1.2 }));
    };
    D.s = (pts, c, w) =>
      K.stroke(
        g,
        pts.map((q) => (q.length === 4 ? [X(q[0]), Y(q[1]), X(q[2]), Y(q[3])] : [X(q[0]), Y(q[1])])),
        c,
        Math.max(0.6, w * u),
        false,
      );
    D.clip = (path, fn) => {
      g.save();
      g.clip(path);
      fn();
      g.restore();
    };
    D.stripes = (path, c, step, w, slope) =>
      D.clip(path, () => {
        for (let y = -3; y < 3; y += step)
          D.s(
            [
              [-3, y],
              [3, y + (slope || 0)],
            ],
            c,
            w,
          );
      });
    return D;
  };
  const dome = (D, y0, h, w, back) =>
    D.q([
      [-(back || 1.1), y0 + 0.1],
      [-(back || 1.1), y0 - h, w, y0 - h - 0.05, w + 0.02, y0 - 0.1],
      [0, y0 - 0.25, -(back || 1.1), y0 + 0.1],
    ]);
  const HATS = {
    nemes: (D) => {
      const gold = D.col,
        blue = (D.acc && D.acc !== gold && D.acc) || MT.VALUE_2A4F8F;
      const back = D.p([
        [-0.55, -0.2],
        [-1.25, -0.1],
        [-1.45, 1.7],
        [-0.55, 1.6],
      ]);
      D.f(back, gold, { d: 0.1 });
      D.stripes(back, blue, 0.24, 0.07);
      const cap = D.q([
        [-1.12, 0.25],
        [-1.2, -1.2, 0.9, -1.4, 1.05, -0.45],
        [0.95, -0.38],
        [0.2, -0.55, -0.42, -0.4],
        [-0.5, 0.3],
      ]);
      D.f(cap, gold, { d: 0.15 });
      D.stripes(cap, blue, 0.24, 0.07, -0.15);
      const front = D.p([
        [-0.42, -0.4],
        [-0.05, -0.32],
        [0.15, 1.55],
        [-0.45, 1.6],
      ]);
      D.f(front, gold, { d: 0.1 });
      D.stripes(front, blue, 0.24, 0.07);
      D.f(D.r(-0.45, -0.55, 1.5, 0.16, 0.05), MT.C9952E, { d: 0 });
      D.f(D.e(1.02, -0.68, 0.11, 0.18), MT.E2B33A, { d: 0.05 });
    },
    roman_helmet: (D) => {
      const m = D.col,
        crest = D.acc || MT.B8322A;
      D.f(
        D.q([
          [-0.85, -1.0],
          [-0.95, -1.9, 0.75, -2.0, 0.85, -1.05],
          [0, -1.32, -0.85, -1.0],
        ]),
        crest,
        { d: 0.12 },
      );
      D.f(
        D.p([
          [-1.1, 0.15],
          [-1.38, 0.55],
          [-0.72, 0.6],
          [-0.5, 0.25],
        ]),
        C.shade(m, -0.15),
        { d: 0.08 },
      );
      D.f(
        D.q([
          [-1.1, 0.35],
          [-1.15, -1.3, 1.0, -1.4, 1.02, -0.42],
          [0.55, -0.45],
          [-0.3, -0.4, -0.45, 0.4],
        ]),
        m,
        { d: 0.18 },
      );
      D.f(
        D.p([
          [0.02, -0.45],
          [0.36, -0.42],
          [0.44, 0.45],
          [0.06, 0.52],
        ]),
        C.shade(m, -0.08),
        { d: 0.06 },
      );
      D.f(D.r(-1.05, -0.62, 2.1, 0.14, 0.05), C.shade(m, -0.25), { d: 0 });
    },
    viking_helmet: (D) => {
      const m = D.col;
      D.f(
        D.q([
          [-1.1, -0.2],
          [-1.0, -1.6, 0.9, -1.65, 1.08, -0.3],
          [0, -0.55, -1.1, -0.2],
        ]),
        m,
        { d: 0.18 },
      );
      D.f(
        D.p([
          [-1.12, -0.32],
          [1.1, -0.45],
          [1.1, -0.26],
          [-1.12, -0.12],
        ]),
        C.shade(m, -0.25),
        { d: 0 },
      );
      D.f(
        D.p([
          [-0.08, -1.45],
          [0.08, -1.45],
          [0.08, -0.4],
          [-0.08, -0.38],
        ]),
        C.shade(m, -0.2),
        { d: 0 },
      );
      D.f(D.r(0.84, -0.45, 0.15, 0.78, 0.05), C.shade(m, -0.15), { d: 0.03 });
    },
    kabuto: (D) => {
      const m = D.col,
        gold = D.acc || MT.D9A93A;
      const neck = D.p([
        [-0.85, -0.4],
        [-1.8, 0.35],
        [-1.62, 0.65],
        [-0.55, 0.28],
      ]);
      D.f(neck, C.shade(m, 0.1), { d: 0.1 });
      D.stripes(neck, C.shade(m, -0.35), 0.2, 0.05, 0.3);
      D.f(dome(D, -0.3, 1.25, 1.05), m, { d: 0.18 });
      D.f(
        D.p([
          [0.42, -0.5],
          [1.0, -0.78],
          [0.86, -0.22],
        ]),
        C.shade(m, 0.15),
        { d: 0.05 },
      );
      D.f(
        D.p([
          [0.55, -0.9],
          [1.55, -1.95],
          [0.8, -1.0],
          [0.15, -1.95],
        ]),
        gold,
        { d: 0.05 },
      );
    },
    nun_veil: (D) => {
      D.f(
        D.q([
          [0.55, -0.75],
          [0.4, -1.32, -1.1, -1.38, -1.22, -0.2],
          [-1.6, 2.0],
          [-0.45, 1.95],
          [-0.35, 0.4],
          [-0.2, -0.5, 0.55, -0.75],
        ]),
        D.col,
        { d: 0.18 },
      );
      D.s(
        [
          [0.88, -0.42],
          [0.35, -0.95, -0.35, -0.86],
          [-0.52, 0.35],
        ],
        MT.F2F0EA,
        0.2,
      );
    },
    plague_hat: (D) => {
      D.f(
        D.p([
          [-0.82, -0.6],
          [-0.72, -1.72],
          [0.78, -1.72],
          [0.86, -0.6],
        ]),
        D.col,
        { d: 0.18 },
      );
      D.f(D.r(-0.8, -0.95, 1.64, 0.18), C.shade(D.col, 0.25), { d: 0 });
      D.f(D.e(0.05, -0.6, 1.8, 0.22), D.col, { d: 0.08 });
    },
    deerstalker: (D) => {
      const c = D.col;
      D.f(
        D.p([
          [-0.75, -0.45],
          [-1.55, -0.18],
          [-0.95, -0.12],
        ]),
        C.shade(c, -0.1),
        { d: 0.05 },
      );
      const d = dome(D, -0.3, 1.2, 1.05);
      D.f(d, c, { d: 0.18 });
      D.clip(d, () => {
        for (let x = -1.2; x < 1.2; x += 0.3)
          D.s(
            [
              [x, -1.6],
              [x + 0.2, -0.2],
            ],
            C.shade(c, -0.3),
            0.04,
          );
        for (let y = -1.5; y < -0.2; y += 0.3)
          D.s(
            [
              [-1.2, y],
              [1.2, y - 0.05],
            ],
            C.shade(c, -0.3),
            0.04,
          );
      });
      D.f(
        D.p([
          [0.7, -0.5],
          [1.6, -0.36],
          [0.92, -0.24],
        ]),
        C.shade(c, -0.1),
        { d: 0.05 },
      );
      D.f(D.e(-0.1, -1.38, 0.38, 0.14), C.shade(c, 0.12), { d: 0.04 });
    },
    bonnet: (D) => {
      D.f(
        D.q([
          [1.15, 0.05],
          [1.35, -1.35, -0.7, -1.78, -1.35, -0.5],
          [-1.3, 0.45],
          [-0.75, 0.45],
          [-0.85, -0.75, 0.6, -1.0, 0.85, 0.05],
        ]),
        D.col,
        { d: 0.15 },
      );
      D.s(
        [
          [-0.55, 0.3],
          [-0.35, 1.0],
        ],
        MT.VALUE_7A2A3A,
        0.12,
      );
      D.f(D.e(-0.3, 1.05, 0.24, 0.13, 0.3), MT.VALUE_7A2A3A, { d: 0.04 });
    },
    laurel: (D) => {
      const c = D.col;
      for (let i = 0; i < 9; i++) {
        const a = PI * (1.06 + i * 0.1);
        const x = Math.cos(a) * 1.04,
          y = Math.sin(a) * 1.0 - 0.08;
        D.f(D.e(x, y, 0.24, 0.1, a + PI / 2 + 0.5), i % 2 ? c : C.shade(c, 0.15), { d: 0.03, lw: 0.9 });
      }
    },
    jester_hat: (D) => {
      const a = D.col,
        b = D.acc || MT.E2B33A;
      D.f(
        D.q([
          [-0.9, -0.75],
          [-1.0, -1.9, -1.9, -1.7, -2.05, -0.95],
          [-1.3, -1.25, -0.2, -0.82],
        ]),
        a,
        { d: 0.12 },
      );
      D.f(
        D.q([
          [0.95, -0.75],
          [1.0, -1.9, 1.9, -1.75, 2.05, -1.0],
          [1.3, -1.28, 0.2, -0.82],
        ]),
        b,
        { d: 0.12 },
      );
      D.f(
        D.q([
          [-0.4, -0.85],
          [-0.45, -2.1, 0.3, -2.3, 0.2, -2.35],
          [0.5, -1.7, 0.45, -0.85],
        ]),
        b === a ? C.shade(a, 0.2) : a,
        { d: 0.12 },
      );
      D.f(D.r(-1.02, -0.92, 2.04, 0.34, 0.12), b, { d: 0.05 });
      for (const q of [
        [-2.05, -0.95],
        [2.05, -1.0],
        [0.2, -2.35],
      ])
        D.f(D.e(q[0], q[1], 0.17, 0.17), MT.E8C64A, { d: 0.05 });
    },
    fur_hat: (D) => {
      const c = D.col;
      D.f(
        D.p([
          [-1.12, -0.35],
          [-1.32, 0.55],
          [-0.68, 0.58],
          [-0.55, -0.4],
        ]),
        C.shade(c, -0.1),
        { d: 0.08 },
      );
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const t = PI + (i / 14) * PI;
        const rr = 1.22 + (i % 2 ? 0.07 : -0.02);
        pts.push([Math.cos(t) * rr, -0.45 + Math.sin(t) * rr * 0.95]);
      }
      pts.push([1.15, -0.25], [-1.15, -0.25]);
      D.f(D.p(pts, true), c, { d: 0.18 });
      D.f(D.r(-1.18, -0.68, 2.36, 0.42, 0.18), C.shade(c, 0.18), { d: 0.06 });
    },
    m1_helmet: (D) => {
      D.f(
        D.q([
          [-1.2, -0.25],
          [-1.25, -1.62, 1.15, -1.66, 1.18, -0.3],
          [0.6, -0.5, -0.4, -0.45, -1.2, -0.25],
        ]),
        D.col,
        { d: 0.18 },
      );
      D.clip(
        D.q([
          [-1.2, -0.25],
          [-1.25, -1.62, 1.15, -1.66, 1.18, -0.3],
          [0.6, -0.5, -0.4, -0.45, -1.2, -0.25],
        ]),
        () => {
          for (let x = -1.2; x < 1.2; x += 0.28)
            D.s(
              [
                [x, -1.7],
                [x + 0.35, -0.2],
              ],
              C.shade(D.col, -0.25),
              0.035,
            );
        },
      );
      D.s(
        [
          [0.7, -0.4],
          [0.75, 0.2, 0.55, 0.55],
        ],
        MT.VALUE_2A2A22,
        0.05,
      );
    },
    tin_helmet: (D) => {
      D.f(
        D.q([
          [-0.95, -0.6],
          [-0.9, -1.55, 0.9, -1.55, 0.95, -0.6],
        ]),
        D.col,
        { d: 0.18 },
      );
      D.f(D.e(0, -0.62, 1.78, 0.24), C.shade(D.col, -0.08), { d: 0.06 });
    },
    pith_helmet: (D) => {
      D.f(D.e(0.02, -0.55, 1.62, 0.28), C.shade(D.col, -0.06), { d: 0.06 });
      D.f(
        D.q([
          [-0.95, -0.62],
          [-1.0, -1.78, 0.95, -1.82, 0.95, -0.62],
        ]),
        D.col,
        { d: 0.18 },
      );
      D.f(D.r(-0.95, -0.82, 1.9, 0.14), D.acc || MT.VALUE_8A6A48, { d: 0 });
      D.f(D.e(0, -1.55, 0.13, 0.08), C.shade(D.col, -0.2), { d: 0 });
    },
    aviator_cap: (D) => {
      const c = D.col;
      D.f(
        D.q([
          [-1.12, 0.35],
          [-1.2, -1.35, 1.0, -1.45, 1.0, -0.45],
          [0.55, -0.5],
          [-0.2, -0.45, -0.35, 0.5],
        ]),
        c,
        { d: 0.18 },
      );
      D.f(D.e(-0.12, 0.38, 0.34, 0.44), C.shade(c, -0.12), { d: 0.06 });
      D.s(
        [
          [-0.95, -0.85],
          [0.95, -0.95],
        ],
        MT.VALUE_3A2A20,
        0.1,
      );
      D.f(D.r(0.12, -1.08, 0.44, 0.32, 0.12), MT.VALUE_9FC6DC, { d: 0.03 });
      D.f(D.r(0.6, -1.03, 0.38, 0.3, 0.12), MT.VALUE_9FC6DC, { d: 0.03 });
    },
    tiara: (D) => {
      D.f(
        D.p([
          [-0.7, -0.78],
          [-0.45, -1.12],
          [-0.2, -0.92],
          [0.05, -1.35],
          [0.3, -0.92],
          [0.55, -1.12],
          [0.78, -0.78],
        ]),
        D.col,
        { d: 0.05 },
      );
      D.f(D.e(0.05, -1.02, 0.09, 0.09), D.acc || MT.C42A3A, { d: 0 });
    },
    knight_helmet: (D) => {
      const m = D.col;
      D.f(
        D.q([
          [-0.2, -1.15],
          [-1.4, -2.0, -1.9, -0.6],
          [-1.0, -1.3, -0.05, -1.05],
        ]),
        D.acc || MT.B02A2A,
        { d: 0.08 },
      );
      D.f(D.e(0, -0.05, 1.22, 1.22), m, { d: 0.2 });
      D.f(D.r(-1.22, -0.08, 2.44, 0.18), C.shade(m, -0.25), { d: 0 });
      D.f(D.r(0.25, -0.38, 0.95, 0.14), MT.VALUE_14161A, { d: 0 });
    },
    cowboy_hat: (D) => {
      const c = D.col;
      D.f(
        D.q([
          [-0.95, -0.55],
          [-0.85, -1.65],
          [0, -1.35, 0.85, -1.65],
          [0.95, -0.55],
        ]),
        c,
        { d: 0.15 },
      );
      D.f(D.r(-0.93, -0.86, 1.86, 0.18), C.shade(c, -0.35), { d: 0 });
      D.f(
        D.q([
          [-2.0, -0.85],
          [0, -0.2, 2.0, -0.85],
          [0, -0.45, -2.0, -0.85],
        ]),
        c,
        { d: 0.06 },
      );
    },
    wizard_hat: (D) => {
      const c = D.col;
      D.f(
        D.q([
          [-0.95, -0.65],
          [-0.4, -2.2, -1.6, -3.0],
          [0.3, -2.3, 0.95, -0.65],
        ]),
        c,
        { d: 0.15 },
      );
      D.f(D.e(0, -0.62, 1.85, 0.32), c, { d: 0.06 });
      D.f(D.e(0.05, -1.35, 0.18, 0.18), MT.F2D36A, { d: 0 });
    },
    tricorn: (D) => {
      D.f(
        D.q([
          [-1.65, -0.6],
          [-0.6, -2.1, 0, -1.25],
          [0.6, -2.1, 1.65, -0.6],
          [0, -0.3, -1.65, -0.6],
        ]),
        D.col,
        { d: 0.12 },
      );
      D.s(
        [
          [-1.6, -0.62],
          [0, -0.34, 1.6, -0.62],
        ],
        MT.D6B25A,
        0.08,
      );
    },
    turban: (D) => {
      const c = D.col;
      D.f(
        D.q([
          [-1.25, -0.5],
          [-1.3, -1.55, 1.2, -1.6, 1.15, -0.55],
          [0, -0.75, -1.25, -0.5],
        ]),
        c,
        { d: 0.15 },
      );
      for (let i = 0; i < 3; i++)
        D.s(
          [
            [-1.1 + i * 0.1, -0.7 - i * 0.2],
            [0, -1.45 + i * 0.15, 1.05 - i * 0.1, -0.75 - i * 0.2],
          ],
          C.shade(c, -0.2),
          0.06,
        );
      D.f(D.e(0.35, -1.05, 0.13, 0.13), D.acc || MT.C42A3A, { d: 0 });
    },
    khan_dong: (D) => {
      const c = D.col;
      D.f(D.r(-1.12, -1.18, 2.24, 0.75, 0.3), c, { d: 0.12 });
      for (let i = 0; i < 4; i++)
        D.s(
          [
            [-1.0 + i * 0.5, -1.15],
            [-0.75 + i * 0.5, -0.48],
          ],
          C.shade(c, 0.25),
          0.06,
        );
    },
    hijab: (D) => {
      D.f(
        D.q([
          [0.72, -0.78],
          [0.35, -1.42, -1.3, -1.32, -1.28, 0.0],
          [-1.15, 1.45],
          [0.55, 1.5],
          [0.95, 1.0, 0.62, 0.78],
          [-0.08, 0.62, -0.18, 0.0],
          [-0.08, -0.72, 0.72, -0.78],
        ]),
        D.col,
        { d: 0.18 },
      );
    },
    headband: (D) => {
      D.f(D.r(-1.06, -0.78, 2.12, 0.24, 0.1), D.col, { d: 0.04 });
      D.f(
        D.p([
          [-1.05, -0.7],
          [-1.55, -0.35],
          [-1.45, -0.2],
          [-1.0, -0.55],
        ]),
        D.col,
        { d: 0.04 },
      );
    },
    top_hat: (D) => {
      D.f(D.r(-0.85, -2.25, 1.7, 1.65, 0.05), D.col, { d: 0.15 });
      D.f(D.r(-0.85, -0.98, 1.7, 0.24), D.acc || MT.VALUE_6A1A1A, { d: 0 });
      D.f(D.e(0, -0.62, 1.45, 0.24), D.col, { d: 0.06 });
    },
    grad_cap: (D) => {
      D.f(dome(D, -0.3, 0.75, 1.02), D.col, { d: 0.12 });
      D.f(
        D.p([
          [-1.7, -1.05],
          [0, -1.45],
          [1.7, -1.05],
          [0, -0.7],
        ]),
        D.col,
        { d: 0.08 },
      );
      D.s(
        [
          [0, -1.08],
          [-1.3, -0.95],
          [-1.3, -0.3],
        ],
        MT.E2B33A,
        0.07,
      );
    },
    straw_hat: (D) => {
      D.f(
        D.q([
          [-0.9, -0.6],
          [-0.85, -1.55, 0.85, -1.55, 0.9, -0.6],
        ]),
        D.col,
        { d: 0.15 },
      );
      D.f(D.r(-0.9, -0.85, 1.8, 0.16), D.acc || MT.B8322A, { d: 0 });
      D.f(D.e(0, -0.6, 1.95, 0.3), D.col, { d: 0.06 });
    },
    bubble_helmet: (D) => {
      D.f(D.e(0, -0.1, 1.55, 1.55), MT.RGBA_200_230_255_0_22, { d: 0 });
      D.s(
        [
          [-0.7, -1.1],
          [-1.05, -0.6, -1.0, -0.1],
        ],
        MT.RGBA_255_255_255_0_6,
        0.1,
      );
    },
    santa_hat: (D) => {
      D.f(
        D.q([
          [-1.0, -0.65],
          [-0.6, -2.0, 0.9, -2.0, -1.5, -1.2],
          [0.4, -1.6, 1.0, -0.65],
        ]),
        D.col,
        { d: 0.15 },
      );
      D.f(D.r(-1.1, -0.85, 2.2, 0.36, 0.16), MT.F4F4F0, { d: 0.05 });
      D.f(D.e(-1.55, -1.18, 0.24, 0.24), MT.F4F4F0, { d: 0.05 });
    },
  };
  const HAT_COL = {
    nemes: MT.D9B04A,
    roman_helmet: MT.B9BEC4,
    viking_helmet: MT.VALUE_8D949C,
    kabuto: MT.VALUE_2A2226,
    nun_veil: MT.VALUE_1A1A1E,
    plague_hat: MT.VALUE_1C1A1D,
    deerstalker: MT.VALUE_8A6A48,
    bonnet: MT.E8DCC8,
    laurel: MT.VALUE_5F8A3A,
    jester_hat: MT.B8322A,
    fur_hat: MT.VALUE_6B4A2E,
    tin_helmet: MT.VALUE_5A6045,
    m1_helmet: MT.VALUE_4A5034,
    pith_helmet: MT.E3D9BC,
    aviator_cap: MT.VALUE_6A4630,
    tiara: MT.E8E4F2,
    knight_helmet: MT.A3ABB3,
    cowboy_hat: MT.VALUE_8A5A32,
    wizard_hat: MT.VALUE_3A2A6A,
    tricorn: MT.VALUE_1A1A1E,
    turban: MT.E8DCC0,
    khan_dong: MT.VALUE_1C1A22,
    hijab: MT.VALUE_3A4A6A,
    headband: MT.C42A3A,
    top_hat: MT.VALUE_16161A,
    grad_cap: MT.VALUE_16161A,
    straw_hat: MT.E3C88A,
    bubble_helmet: MT.FFFFFF,
    santa_hat: MT.C42A2A,
  };
  const NEW_HATS = [MT.NEMES, MT.ROMAN_HELMET, MT.VIKING_HELMET, MT.KABUTO, MT.NUN_VEIL, MT.PLAGUE_HAT, MT.DEERSTALKER, MT.BONNET, MT.LAUREL, MT.JESTER_HAT, MT.FUR_HAT, MT.TIN_HELMET, MT.M1_HELMET, MT.PITH_HELMET, MT.AVIATOR_CAP];
  TALES.HATS = HATS;
  for (const id of NEW_HATS)
    RI.HEADWEAR_EXTRA[id] = (g, r, pal, ch) => {
      const col = (ch.colors && ch.colors.hat) || HAT_COL[id];
      HATS[id](mkD(g, 0, 0, r, col, (ch.colors && ch.colors.accent) || null));
    };
  for (const id of Object.keys(HATS)) {
    T.HAT[id] = (g, hx, hy, s, col, acc) => HATS[id](mkD(g, hx, hy, 50 * s, col, acc));
    T.HAT_DEFAULT[id] = HAT_COL[id];
  }
  T.HAT.conical = T.HAT.conical_hat;
  T.HAT_DEFAULT.conical = T.HAT_DEFAULT.conical_hat;
  for (const id of [MT.LAUREL, MT.BONNET, MT.TIARA, MT.HEADBAND, MT.BUBBLE_HELMET, MT.CONICAL, MT.JESTER_HAT, MT.STRAW_HAT]) T.HAIR_KEEP.add(id);
  for (const id of [MT.NEMES, MT.NUN_VEIL, MT.KNIGHT_HELMET, MT.HIJAB, MT.AVIATOR_CAP, MT.FUR_HAT, MT.KABUTO, MT.ROMAN_HELMET, MT.VIKING_HELMET, MT.M1_HELMET]) T.HAIR_HIDE.add(id);
  const toonHead = (sk) => {
    const r = sk.d.head * 1.55;
    return { x: sk.hd[0] + 1, y: sk.hd[1] - (r - sk.d.head) * 0.75, u: r };
  };
  const headOf = (sk) => (T.active ? toonHead(sk) : { x: sk.hd[0], y: sk.hd[1], u: sk.d.head });
  const body = (g) => mkD(g, 0, 0, 1, null, null);
  const ACC = {
    plague_mask: {
      front: (g, c) => {
        const h = headOf(c.sk);
        const D = mkD(g, h.x, h.y, h.u, null, null);
        D.f(
          D.p([
            [0.38, -0.12],
            [2.35, 0.6],
            [0.5, 0.66],
          ]),
          MT.D8C8A0,
          { d: 0.12 },
        );
        D.s(
          [
            [0.7, 0.05],
            [1.6, 0.45],
          ],
          MT.A8946A,
          0.05,
        );
        D.f(D.e(0.6, -0.2, 0.22, 0.22), MT.VALUE_1A1A1A, { d: 0 });
        D.f(D.e(0.6, -0.2, 0.13, 0.13), MT.B04030, { d: 0, ink: false });
      },
    },
    spear: {
      back: (g, c) => {
        const h = c.ba.hand;
        const D = body(g);
        D.s(
          [
            [h[0] - 5, h[1] + 82],
            [h[0] + 6, h[1] - 128],
          ],
          MT.VALUE_6A4A2A,
          3.2,
        );
        D.f(
          D.p([
            [h[0] + 6.3, h[1] - 150],
            [h[0] + 11.5, h[1] - 124],
            [h[0] + 6, h[1] - 118],
            [h[0] + 1, h[1] - 125],
          ]),
          MT.B9BEC4,
          { d: 1.5 },
        );
      },
    },
    lantern_hand: {
      front: (g, c) => {
        const h = c.fa.hand;
        const D = body(g);
        D.s(
          [
            [h[0], h[1]],
            [h[0], h[1] + 10],
          ],
          MT.VALUE_2A2A2A,
          1.2,
        );
        D.f(D.r(h[0] - 6, h[1] + 10, 12, 16, 2), MT.VALUE_3A3028, { d: 1 });
        D.f(D.r(h[0] - 4, h[1] + 12, 8, 11, 2), MT.FFD27A, { d: 0, ink: false, glow: MT.RGBA_255_200_110_0_9, glowR: 26 });
      },
    },
  };
  const TOON_ONLY_ACC = {
    shield: {
      front: (g, c) => {
        const fa = c.fa;
        const mx = U.lerp(fa.elbow[0], fa.hand[0], 0.45) + 4,
          my = U.lerp(fa.elbow[1], fa.hand[1], 0.45);
        const D = body(g);
        D.f(
          D.q([
            [mx - 15, my - 20],
            [mx + 15, my - 20],
            [mx + 16, my + 12, mx, my + 24],
            [mx - 16, my + 12, mx - 15, my - 20],
          ]),
          MT.VALUE_8D949C,
          { d: 3 },
        );
        D.f(
          D.q([
            [mx - 11, my - 16],
            [mx + 11, my - 16],
            [mx + 12, my + 9, mx, my + 19],
            [mx - 12, my + 9, mx - 11, my - 16],
          ]),
          (c.ch.colors && c.ch.colors.shield) || c.pal.accent || MT.VALUE_2A4A8A,
          { d: 2 },
        );
        D.f(D.r(mx - 2, my - 13, 4, 26), MT.E2B33A, { d: 0, lw: 0.8 });
        D.f(D.r(mx - 10, my - 4, 20, 4), MT.E2B33A, { d: 0, lw: 0.8 });
      },
    },
    staff: {
      back: (g, c) => {
        const h = c.ba.hand;
        const D = body(g);
        D.s(
          [
            [h[0] - 2, h[1] + 70],
            [h[0] + 4, h[1] - 110],
          ],
          MT.VALUE_6A4A2A,
          3.4,
        );
        K.glowDisc(g, h[0] + 4, h[1] - 116, 16, (c.ch.colors && c.ch.colors.accent) || MT.VALUE_8AD0FF, 0.9);
        D.f(D.e(h[0] + 4, h[1] - 116, 4.5, 4.5), (c.ch.colors && c.ch.colors.accent) || MT.VALUE_8AD0FF, { d: 0.5, lw: 0.9 });
      },
    },
    sword: {
      front: (g, c) => {
        const sk = c.sk;
        g.save();
        g.translate(sk.hip[0] - 2, sk.hip[1] - 2);
        g.rotate(0.95);
        const D = body(g);
        D.f(D.r(0, -2.4, 54, 4.8, 2), MT.VALUE_3A2A1E, { d: 1, lw: 1 });
        D.f(D.r(-11, -2.2, 11, 4.4, 1), MT.C9A23A, { d: 0, lw: 0.9 });
        D.f(D.r(-2.5, -7, 3.6, 14, 1), MT.C9A23A, { d: 0, lw: 0.9 });
        g.restore();
      },
    },
    necklace: {
      front: (g, c) => {
        const n = c.sk.neck;
        const D = body(g);
        D.s(
          [
            [n[0] - 6, n[1] + 2],
            [n[0] + 1, n[1] + 12, n[0] + 8, n[1] + 3],
          ],
          MT.E2B33A,
          1.6,
        );
        D.f(D.e(n[0] + 1.5, n[1] + 9, 2.2, 2.6), MT.C42A3A, { d: 0, lw: 0.8 });
      },
    },
    medal: {
      front: (g, c) => {
        const sk = c.sk;
        const x = U.lerp(sk.sh[0], sk.hip[0], 0.28) + 6,
          y = U.lerp(sk.sh[1], sk.hip[1], 0.28);
        const D = body(g);
        D.f(D.r(x - 2, y - 9, 4, 6), MT.C42A2A, { d: 0, lw: 0.8 });
        D.f(D.e(x, y, 3.6, 3.6), MT.E2B33A, { d: 0.8, lw: 0.9 });
      },
    },
    handbag: {
      back: (g, c) => {
        const h = c.ba.hand;
        const D = body(g);
        D.s(
          [
            [h[0] - 7, h[1] + 8],
            [h[0], h[1] - 2, h[0] + 7, h[1] + 8],
          ],
          MT.VALUE_2A1A12,
          1.2,
        );
        D.f(D.r(h[0] - 10, h[1] + 8, 20, 15, 3), (c.ch.colors && c.ch.colors.bag) || MT.VALUE_7A3A2A, { d: 2, lw: 1.1 });
      },
    },
  };
  for (const id of Object.keys(ACC)) {
    RI.ACC_EXTRA[id] = ACC[id];
    T.ACC_EXTRA[id] = ACC[id];
  }
  for (const id of Object.keys(TOON_ONLY_ACC)) T.ACC_EXTRA[id] = TOON_ONLY_ACC[id];
  T.OUTFIT_LEN.toga = 92;
  T.OUTFIT_LEN.kimono = 92;
  T.OUTFIT_LEN.shroud = 104;
  T.OUTFIT_FLARE.toga = 16;
  T.OUTFIT_FLARE.kimono = 6;
  T.OUTFIT_FLARE.shroud = 30;
  T.OUTFIT_FLARE.armor = 4;
  const accentOf = (ch, pal, def) => (ch.colors && ch.colors.accent) || def || pal.accent;
  T.OUTFIT_EXTRA.toga = (g, c) => {
    const D = body(g);
    const a = c.add(c.add(c.sk.sh, c.T0.fwd, c.w.sh * 0.7), c.T0.up, 2),
      b = c.add(c.add(c.sk.hip, c.T0.fwd, -c.w.hip - 3), c.T0.up, -12);
    D.f(D.p([a, c.add(a, c.T0.fwd, -9), c.add(b, c.T0.up, 10), b]), C.shade(c.top, -0.08), { d: 2, lw: 1.1 });
    D.f(D.p([c.add(a, c.T0.fwd, -2), c.add(a, c.T0.fwd, -5), c.add(b, c.T0.up, 6), c.add(b, c.T0.up, 3)]), accentOf(c.ch, c.pal, MT.VALUE_6A2A6A), { d: 0, lw: 0.8 });
  };
  T.OUTFIT_EXTRA.kimono = (g, c) => {
    const D = body(g);
    const sk = c.sk;
    const belt = c.lerp2(sk.hip, sk.sh, 0.3);
    D.f(D.p([c.add(c.neckBase, c.T0.fwd, -4), c.add(c.neckBase, c.T0.fwd, 7), c.add(belt, c.T0.fwd, c.w.waist - 2)]), C.shade(c.top, 0.25), { d: 0, lw: 1 });
    D.f(D.r(belt[0] - c.w.waist - 2, belt[1] - 6, (c.w.waist + 2) * 2, 12, 2), accentOf(c.ch, c.pal, MT.C9A23A), { d: 2, lw: 1.1 });
  };
  T.OUTFIT_EXTRA.shroud = (g, c) => {
    const D = body(g);
    for (let k = 0.15; k < 1; k += 0.28) {
      const p = c.lerp2(c.sk.hip, c.sk.sh, k);
      D.s(
        [
          [p[0] - c.w.waist, p[1] + 2],
          [p[0] + c.w.waist, p[1] - 2],
        ],
        C.shade(c.top, -0.12),
        1.1,
      );
    }
  };
  T.OUTFIT_EXTRA.armor = (g, c) => {
    const D = body(g);
    const sk = c.sk;
    for (const k of [0.32, 0.56]) {
      const p = c.lerp2(sk.hip, sk.sh, k);
      D.s(
        [
          [p[0] - c.w.waist - 1, p[1]],
          [p[0] + c.w.waist + 1, p[1]],
        ],
        C.shade(c.top, 0.3),
        1.6,
      );
    }
    const belt = c.lerp2(sk.hip, sk.sh, 0.1);
    D.f(D.r(belt[0] - c.w.hip - 1, belt[1] - 3, (c.w.hip + 1) * 2, 6, 1), C.shade(c.top, -0.35), { d: 0, lw: 1 });
    D.f(D.e(sk.sh[0] + 1, sk.sh[1] + 5, c.w.sh * 0.62, c.w.sh * 0.5), C.shade(c.top, 0.12), { d: 2, lw: 1.1 });
  };
  T.OUTFIT_EXTRA.tunic = (g, c) => {
    const D = body(g);
    const belt = c.lerp2(c.sk.hip, c.sk.sh, 0.1);
    D.f(D.r(belt[0] - c.w.hip - 1, belt[1] - 3, (c.w.hip + 1) * 2, 6, 1), accentOf(c.ch, c.pal, MT.VALUE_5A3A22), { d: 0, lw: 1 });
  };
  T.OUTFIT_EXTRA.spacesuit = (g, c) => {
    const D = body(g);
    const p = c.lerp2(c.sk.hip, c.sk.sh, 0.62);
    D.f(D.r(p[0] - 3, p[1] - 6, 13, 10, 2), MT.VALUE_5A6A7A, { d: 1, lw: 1 });
    D.f(D.e(p[0] + 1, p[1] - 1, 1.6, 1.6), MT.E24A3A, { d: 0, ink: false });
    D.f(D.e(p[0] + 6, p[1] - 1, 1.6, 1.6), MT.VALUE_3AE27A, { d: 0, ink: false });
  };
  RI.OUTFIT_EXTRA.toga = (g, c) => {
    c.hem(
      c.feet.map((f) => [f[0], f[1] - 6]),
      14,
      c.pal.top,
    );
    g.strokeStyle = C.shade(c.pal.top, -0.12);
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(c.sx + c.fx * c.shW * 0.6, c.sy + 2);
    g.lineTo(c.hx + c.nx * c.hipW, c.hy + 12);
    g.stroke();
    g.strokeStyle = accentOf(c.ch, c.pal, MT.VALUE_6A2A6A);
    g.lineWidth = 2;
    g.stroke();
  };
  RI.OUTFIT_EXTRA.kimono = (g, c) => {
    c.hem(
      c.feet.map((f) => [f[0], f[1] - 4]),
      8,
      c.pal.top,
    );
    g.fillStyle = accentOf(c.ch, c.pal, MT.C9A23A);
    g.fillRect(Math.min(c.sx, c.hx) - c.shW, U.lerp(c.sy, c.hy, 0.68), c.shW * 2.3, 9);
    g.strokeStyle = C.shade(c.pal.top, 0.3);
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(c.sx + c.nx * 3, c.sy + 2);
    g.lineTo(c.sx + c.fx * 6, U.lerp(c.sy, c.hy, 0.6));
    g.stroke();
  };
  RI.OUTFIT_EXTRA.shroud = (g, c) => {
    c.hem(
      c.feet.map((f) => [f[0], f[1] + 4]),
      26,
      c.pal.top,
    );
  };
  const layer = { c: null, g: null };
  const getLayer = (w, h) => {
    if (!layer.c || layer.c.width < w || layer.c.height < h) {
      layer.c = ME.makeCanvas(Math.max(w, layer.c ? layer.c.width : 0), Math.max(h, layer.c ? layer.c.height : 0));
      layer.g = layer.c.getContext(MT.VALUE_2D);
    }
    return layer;
  };
  const poseOf = (ch, o) => {
    const a = ME.registry.actions[o.action || MT.STAND] || ME.registry.actions.stand;
    return o.pose || a.pose(o.phase || 0, o.t || 0, o);
  };
  const fxLayer = (g, ch, o, draw, cfg) => {
    const m = g.getTransform();
    const sc = (o.scale || 1) * 1.4;
    const pts = [
      [-150 * sc, -310 * sc],
      [150 * sc, -310 * sc],
      [150 * sc, 50 * sc],
      [-150 * sc, 50 * sc],
    ].map((q) => [m.a * q[0] + m.c * q[1] + m.e, m.b * q[0] + m.d * q[1] + m.f]);
    const cw = g.canvas ? g.canvas.width : 4096,
      chh = g.canvas ? g.canvas.height : 4096;
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((q) => q[0])))),
      y0 = Math.max(0, Math.floor(Math.min(...pts.map((q) => q[1]))));
    const x1 = Math.min(cw, Math.ceil(Math.max(...pts.map((q) => q[0])))),
      y1 = Math.min(chh, Math.ceil(Math.max(...pts.map((q) => q[1]))));
    const w = x1 - x0,
      h = y1 - y0;
    if (w < 2 || h < 2) return null;
    const L = getLayer(w, h);
    const lg = L.g;
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalAlpha = 1;
    lg.globalCompositeOperation = MT.SOURCE_OVER;
    lg.shadowBlur = 0;
    lg.clearRect(0, 0, w, h);
    lg.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
    if (cfg.lift) lg.translate(0, cfg.lift);
    const o2 = Object.assign({}, o, cfg.o || {});
    const lights = o.lights;
    o2.lights = lights ? [] : undefined;
    const sk = draw(lg, ch, o2);
    if (lights && o2.lights) for (const l of o2.lights) lights.push(Object.assign({}, l, l.p ? { p: [l.p[0] + x0, l.p[1] + y0] } : {}));
    const scale = (o.scale || 1) * (sk && sk.d ? sk.d.s : 1);
    const f = o.facing == null ? 1 : o.facing < 0 ? -1 : 1;
    const loc = (p) => [p[0] * scale * f, p[1] * scale];
    lg.save();
    lg.globalCompositeOperation = MT.SOURCE_ATOP;
    if (cfg.post && sk) cfg.post(lg, sk, loc, scale, o);
    lg.restore();
    if (cfg.fade) {
      lg.save();
      lg.globalCompositeOperation = MT.DESTINATION_OUT;
      const gr = lg.createLinearGradient(0, cfg.fade[0] * scale, 0, cfg.fade[1] * scale);
      gr.addColorStop(0, MT.RGBA_0_0_0_0);
      gr.addColorStop(1, MT.RGBA_0_0_0_1);
      lg.fillStyle = gr;
      lg.fillRect(-400 * scale, -400 * scale, 800 * scale, 520 * scale);
      lg.restore();
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (cfg.alpha != null) g.globalAlpha *= cfg.alpha;
    if (cfg.glow) {
      g.shadowColor = cfg.glow;
      g.shadowBlur = cfg.glowR || 20;
    }
    g.drawImage(L.c, 0, 0, w, h, x0, y0, w, h);
    g.restore();
    return sk;
  };
  const tint = (lg, col) => {
    lg.fillStyle = col;
    lg.fillRect(-2000, -2000, 4000, 4000);
  };
  const eyesAt = (lg, sk, loc, scale, col, rr) => {
    const h = loc(sk.hd);
    const r = sk.d.head * scale;
    lg.globalCompositeOperation = MT.SOURCE_OVER;
    for (const dx of [0.28, 0.72]) {
      const x = h[0] + r * dx * (loc([1, 0])[0] >= 0 ? 1 : -1),
        y = h[1] - r * 0.1;
      const gr = lg.createRadialGradient(x, y, 0, x, y, r * (rr || 0.5));
      gr.addColorStop(0, col);
      gr.addColorStop(1, MT.RGBA_0_0_0_0);
      lg.fillStyle = gr;
      lg.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };
  ME.CHAR_FX.ghost = (g, ch, o, draw) =>
    fxLayer(g, ch, o, draw, {
      lift: -(16 + Math.sin((o.t || 0) * 2.1 + (o.phase || 0)) * 6) * (o.scale || 1),
      o: { shadow: false },
      alpha: 0.66,
      glow: MT.RGBA_170_215_255_0_95,
      glowR: 24 * (o.scale || 1),
      fade: [-70, 6],
      post: (lg) => tint(lg, MT.RGBA_214_234_255_0_5),
    });
  ME.CHAR_FX.shadow = (g, ch, o, draw) =>
    fxLayer(g, ch, o, draw, {
      alpha: 0.94,
      glow: MT.RGBA_0_0_0_0_75,
      glowR: 16 * (o.scale || 1),
      fade: [-30, 12],
      post: (lg, sk, loc, scale) => {
        tint(lg, MT.VALUE_07070A);
        eyesAt(lg, sk, loc, scale, MT.RGBA_255_60_40_1, 0.42);
      },
    });
  ME.CHAR_FX.mummy = (g, ch, o, draw) =>
    fxLayer(g, ch, o, draw, {
      post: (lg, sk, loc, scale) => {
        tint(lg, MT.RGBA_216_203_166_0_93);
        lg.strokeStyle = MT.RGBA_96_78_48_0_6;
        lg.lineWidth = 1.3 * scale;
        for (let y = -300, i = 0; y < 40; y += 6.5, i++) {
          lg.beginPath();
          lg.moveTo(-200 * scale, (y + (i % 2 ? 4 : -4)) * scale);
          lg.lineTo(200 * scale, (y + (i % 2 ? -4 : 4)) * scale);
          lg.stroke();
        }
        eyesAt(lg, sk, loc, scale, MT.RGBA_255_210_90_0_95, 0.3);
      },
    });
  ME.CHAR_FX.skeleton = (g, ch, o, draw) =>
    fxLayer(g, ch, o, draw, {
      post: (lg, sk, loc, scale) => {
        tint(lg, MT.E9E4D6);
        lg.strokeStyle = MT.RGBA_40_36_44_0_75;
        lg.lineWidth = 1.6 * scale;
        for (let k = 0.2; k < 0.85; k += 0.13) {
          const a = loc([U.lerp(sk.sh[0], sk.hip[0], k) - 9, U.lerp(sk.sh[1], sk.hip[1], k)]),
            b = loc([U.lerp(sk.sh[0], sk.hip[0], k) + 9, U.lerp(sk.sh[1], sk.hip[1], k) + 2]);
          lg.beginPath();
          lg.moveTo(a[0], a[1]);
          lg.lineTo(b[0], b[1]);
          lg.stroke();
        }
        const h = loc(sk.hd);
        const r = sk.d.head * scale;
        const fw = loc([1, 0])[0] >= 0 ? 1 : -1;
        lg.fillStyle = MT.RGBA_20_18_24_0_92;
        for (const dx of [0.2, 0.62]) {
          lg.beginPath();
          lg.ellipse(h[0] + r * dx * fw, h[1] - r * 0.12, r * 0.22, r * 0.26, 0, 0, PI * 2);
          lg.fill();
        }
        lg.beginPath();
        lg.moveTo(h[0] + r * 0.45 * fw, h[1] + r * 0.12);
        lg.lineTo(h[0] + r * 0.36 * fw, h[1] + r * 0.32);
        lg.lineTo(h[0] + r * 0.54 * fw, h[1] + r * 0.32);
        lg.fill();
        lg.lineWidth = 1 * scale;
        lg.beginPath();
        lg.moveTo(h[0] + r * 0.1 * fw, h[1] + r * 0.55);
        lg.lineTo(h[0] + r * 0.8 * fw, h[1] + r * 0.52);
        lg.stroke();
      },
    });
  const CH = (id, name, tags, o) => {
    ME.registerCharacter(Object.assign({ id, name, tags, builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [] }, o));
    TALES.characters.push(id);
  };
  CH(MT.GHOST_LADY, MT.MA_NU_AO_TRANG, [MT.KINH_DI, MT.MA, MT.TRUYEN_MA, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.SHROUD, fx: MT.GHOST, colors: { skin: MT.E8EEF2, hair: MT.VALUE_0E0E12, top: MT.F4F6F8, bottom: MT.F4F6F8, shoes: MT.E8EEF2 } });
  CH(MT.GHOST_CHILD, MT.HON_MA_BE_GAI, [MT.KINH_DI, MT.MA, MT.TRUYEN_MA, MT.TRE_EM], { gender: MT.FEMALE, age: MT.CHILD, hair: MT.LONG, outfit: MT.DRESS, fx: MT.GHOST, colors: { skin: MT.E6EDF2, hair: MT.VALUE_16141A, top: MT.EEF2F6, bottom: MT.EEF2F6, shoes: MT.D8E0E6 } });
  CH(MT.GHOST_OLD_MAN, MT.HON_MA_ONG_LAO, [MT.KINH_DI, MT.MA, MT.TRUYEN_MA, MT.NGUOI_GIA], { age: MT.ELDERLY, hair: MT.BALD, outfit: MT.ROBE, fx: MT.GHOST, accessories: [MT.BEARD], colors: { skin: MT.DFE8EE, hair: MT.E8EEF2, top: MT.C8D2DA, bottom: MT.C8D2DA } });
  CH(MT.GHOST_SOLDIER, MT.HON_MA_NGUOI_LINH, [MT.KINH_DI, MT.MA, MT.CHIEN_TRANH, MT.LINH], { outfit: MT.MILITARY, headwear: MT.TIN_HELMET, fx: MT.GHOST, colors: { skin: MT.DCE6EC, top: MT.VALUE_9AA6A0, bottom: MT.VALUE_8A948E, hat: MT.VALUE_7A847E } });
  CH(MT.SHADOW_FIGURE, MT.BONG_DEN_BI_AN, [MT.KINH_DI, MT.BI_AN, MT.BONG_DEN], { outfit: MT.TRENCH, headwear: MT.FEDORA, build: MT.ATHLETIC, fx: MT.SHADOW, colors: { top: MT.VALUE_111, bottom: MT.VALUE_111, hat: MT.VALUE_111 } });
  CH(MT.HOODED_SHADOW, MT.BONG_MA_TRUM_DAU, [MT.KINH_DI, MT.BI_AN, MT.BONG_DEN], { outfit: MT.SHROUD, headwear: MT.HOOD, fx: MT.SHADOW, colors: { top: MT.VALUE_111, hat: MT.VALUE_111 } });
  CH(MT.VAMPIRE, MT.MA_CA_RONG, [MT.KINH_DI, MT.MA_CA_RONG_2, MT.CO_TICH], { outfit: MT.SUIT, hair: MT.SHORT, accessories: [MT.CAPE], colors: { skin: MT.E4DCDC, hair: MT.VALUE_0D0B10, top: MT.VALUE_16141A, bottom: MT.VALUE_121016, accent: MT.VALUE_8A1A24, cape: MT.VALUE_1A0E14, shirt: MT.F0ECE6 } });
  CH(MT.MUMMY, MT.XAC_UOP, [MT.KINH_DI, MT.AI_CAP_2, MT.XAC_UOP_2], { outfit: MT.TUNIC, hair: MT.BALD, fx: MT.MUMMY, colors: { top: MT.D8CBA6, bottom: MT.D8CBA6 } });
  CH(MT.SKELETON, MT.BO_XUONG, [MT.KINH_DI, MT.BO_XUONG_2, MT.HALLOWEEN], { outfit: MT.CASUAL, hair: MT.BALD, build: MT.SLIM, fx: MT.SKELETON });
  CH(MT.PLAGUE_DOCTOR, MT.BAC_SI_DICH_HACH, [MT.LICH_SU, MT.TRUNG_CO, MT.BI_AN, MT.DICH_BENH], { outfit: MT.ROBE, headwear: MT.PLAGUE_HAT, accessories: [MT.PLAGUE_MASK, MT.LANTERN_HAND], colors: { top: MT.VALUE_1C1A1D, bottom: MT.VALUE_1C1A1D, accent: MT.VALUE_3A3438 } });
  CH(MT.NUN, MT.NU_TU, [MT.TON_GIAO, MT.KINH_DI, MT.NU], { gender: MT.FEMALE, outfit: MT.ROBE, headwear: MT.NUN_VEIL, accessories: [MT.NECKLACE], colors: { top: MT.VALUE_1A1A1E, bottom: MT.VALUE_1A1A1E, accent: MT.F2F0EA } });
  CH(MT.EXORCIST, MT.LINH_MUC_TRU_TA, [MT.TON_GIAO, MT.KINH_DI, MT.TRU_TA], { age: MT.ELDERLY, outfit: MT.COAT, accessories: [MT.NECKLACE, MT.GLASSES], colors: { top: MT.VALUE_141418, bottom: MT.VALUE_141418, hair: MT.CFC8C0 } });
  CH(MT.GRAVEDIGGER, MT.NGUOI_DAO_MO, [MT.KINH_DI, MT.NGHIA_TRANG, MT.NGUOI_GIA], { age: MT.ELDERLY, outfit: MT.COAT, headwear: MT.BEANIE, build: MT.HEAVY, accessories: [MT.BEARD, MT.LANTERN_HAND], colors: { top: MT.VALUE_3A3A30, bottom: MT.VALUE_2A2A24, hat: MT.VALUE_2A2A28, hair: MT.VALUE_8A8A80 } });
  CH(MT.FORTUNE_TELLER, MT.BA_THAY_BOI, [MT.BI_AN, MT.TAM_LINH, MT.NU], { gender: MT.FEMALE, age: MT.ELDERLY, outfit: MT.ROBE, headwear: MT.TURBAN, hair: MT.LONG, accessories: [MT.NECKLACE], colors: { top: MT.VALUE_5A2A6A, bottom: MT.VALUE_5A2A6A, hat: MT.VALUE_8A3A7A, accent: MT.E2B33A, hair: MT.VALUE_3A2A2A } });
  CH(MT.BUTLER, MT.QUAN_GIA, [MT.BI_AN, MT.DINH_THU, MT.NGUOI_GIA], { age: MT.ELDERLY, outfit: MT.SUIT, hair: MT.SHORT, accessories: [MT.MUSTACHE], colors: { top: MT.VALUE_141418, bottom: MT.VALUE_141418, accent: MT.E8E4DC, hair: MT.VALUE_9A9488 } });
  CH(MT.VICTORIAN_MAID, MT.HAU_GAI_THOI_VICTORIA, [MT.BI_AN, MT.DINH_THU, MT.NU, MT.THE_KY_19], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.APRON, headwear: MT.HEADBAND, colors: { top: MT.VALUE_1A1A20, bottom: MT.VALUE_1A1A20, hat: MT.F2F0EA, hair: MT.VALUE_5A3A2A } });
  CH(MT.VICTORIAN_DETECTIVE, MT.THAM_TU_MU_SAN_HUOU, [MT.THAM_TU, MT.BI_AN, MT.THE_KY_19], { outfit: MT.COAT, headwear: MT.DEERSTALKER, colors: { top: MT.VALUE_7A6448, bottom: MT.VALUE_3A3228, hair: MT.VALUE_2A1E18 } });
  CH(MT.VICTORIAN_LADY, MT.QUY_BA_THOI_VICTORIA, [MT.THE_KY_19, MT.QUY_TOC, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.GOWN, headwear: MT.BONNET, accessories: [MT.NECKLACE], colors: { top: MT.VALUE_5A2A3A, hat: MT.E8DCC8, hair: MT.VALUE_6A3A22 } });
  CH(MT.CULT_MEMBER, MT.KE_TRONG_GIAO_PHAI, [MT.KINH_DI, MT.BI_AN, MT.GIAO_PHAI], { outfit: MT.SHROUD, headwear: MT.HOOD, colors: { top: MT.VALUE_5A1418, hat: MT.VALUE_5A1418 } });
  CH(MT.THAY_PHAP, MT.THAY_PHAP_2, [MT.TAM_LINH, MT.VIET_NAM_2, MT.TRU_TA], { age: MT.ELDERLY, outfit: MT.ROBE, headwear: MT.HEADBAND, accessories: [MT.BEARD, MT.STAFF], colors: { top: MT.E0B02A, bottom: MT.E0B02A, hat: MT.C42A2A, accent: MT.FF7A3A, hair: MT.D8D0C4 } });
  CH(MT.BA_DONG, MT.BA_DONG_2, [MT.TAM_LINH, MT.VIET_NAM_2, MT.NU], { gender: MT.FEMALE, outfit: MT.AO_DAI_2, headwear: MT.KHAN_DONG, accessories: [MT.NECKLACE], colors: { top: MT.C42A2A, bottom: MT.F4F1EA, hat: MT.C42A2A } });
  CH(MT.PHARAOH, MT.PHARAOH_2, [MT.LICH_SU, MT.AI_CAP_2, MT.VUA], { outfit: MT.TUNIC, headwear: MT.NEMES, hair: MT.BALD, accessories: [MT.NECKLACE, MT.STAFF], colors: { skin: MT.B47A50, top: MT.F2ECDA, bottom: MT.B47A50, accent: MT.E2B33A, hat: MT.D9B04A } });
  CH(MT.EGYPTIAN_QUEEN, MT.NU_HOANG_AI_CAP, [MT.LICH_SU, MT.AI_CAP_2, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.GOWN, headwear: MT.TIARA, accessories: [MT.NECKLACE], colors: { skin: MT.B9805A, top: MT.F2ECDA, hair: MT.VALUE_0E0C10, hat: MT.E2B33A, accent: MT.VALUE_2A6A8A } });
  CH(MT.EGYPTIAN_WORKER, MT.NO_LE_XAY_KIM_TU_THAP, [MT.LICH_SU, MT.AI_CAP_2, MT.LAO_DONG], { outfit: MT.TUNIC, hair: MT.SHORT, build: MT.ATHLETIC, colors: { skin: MT.A86A44, top: MT.E6DCC4, bottom: MT.A86A44, accent: MT.VALUE_8A6A3A, hair: MT.VALUE_1A1410 } });
  CH(MT.EGYPTIAN_PRIEST, MT.TU_TE_AI_CAP, [MT.LICH_SU, MT.AI_CAP_2, MT.TON_GIAO], { outfit: MT.ROBE, hair: MT.BALD, accessories: [MT.NECKLACE], colors: { skin: MT.B07A52, top: MT.F4F0E2, bottom: MT.F4F0E2, accent: MT.E2B33A } });
  CH(MT.ROMAN_CENTURION, MT.BACH_PHU_TRUONG_LA_MA, [MT.LICH_SU, MT.LA_MA_2, MT.CHIEN_BINH], { outfit: MT.ARMOR, headwear: MT.ROMAN_HELMET, build: MT.ATHLETIC, accessories: [MT.CAPE, MT.SHIELD, MT.SWORD], colors: { top: MT.A83A2A, bottom: MT.C49A6A, accent: MT.B8322A, cape: MT.VALUE_8A1A1A, shield: MT.A8322A, hat: MT.C0A060 } });
  CH(MT.GLADIATOR, MT.DAU_SI, [MT.LICH_SU, MT.LA_MA_2, MT.DAU_TRUONG], { outfit: MT.TUNIC, headwear: MT.ROMAN_HELMET, build: MT.ATHLETIC, accessories: [MT.SHIELD, MT.SWORD], colors: { top: MT.VALUE_8A5A3A, bottom: MT.C49A6A, shield: MT.VALUE_6A4A2A, hat: MT.VALUE_9A9EA2, accent: MT.VALUE_3A3A3A } });
  CH(MT.ROMAN_SENATOR, MT.NGUYEN_LAO_LA_MA, [MT.LICH_SU, MT.LA_MA_2, MT.CHINH_TRI], { age: MT.ELDERLY, outfit: MT.TOGA, headwear: MT.LAUREL, hair: MT.SHORT, colors: { top: MT.F2EEE4, bottom: MT.F2EEE4, accent: MT.VALUE_6A2A6A, hair: MT.B8B0A4 } });
  CH(MT.GREEK_PHILOSOPHER, MT.TRIET_GIA_HY_LAP, [MT.LICH_SU, MT.HY_LAP_2, MT.TRIET_HOC], { age: MT.ELDERLY, outfit: MT.TOGA, accessories: [MT.BEARD], colors: { top: MT.ECE6D6, bottom: MT.ECE6D6, accent: MT.VALUE_2A5A8A, hair: MT.D8D2C8 } });
  CH(MT.MEDIEVAL_MONK, MT.THAY_TU_TRUNG_CO, [MT.LICH_SU, MT.TRUNG_CO, MT.TON_GIAO], { outfit: MT.ROBE, hair: MT.BALD, build: MT.HEAVY, colors: { top: MT.VALUE_6A4A2E, bottom: MT.VALUE_6A4A2E, accent: MT.VALUE_3A2A1A } });
  CH(MT.CRUSADER, MT.HIEP_SI_THAP_TU, [MT.LICH_SU, MT.TRUNG_CO, MT.HIEP_SI_2], { outfit: MT.ARMOR, headwear: MT.KNIGHT_HELMET, build: MT.ATHLETIC, accessories: [MT.CAPE, MT.SHIELD, MT.SWORD], colors: { top: MT.E8E4DC, bottom: MT.VALUE_8D949C, accent: MT.B8322A, cape: MT.F0ECE4, shield: MT.F0ECE4, hat: MT.A3ABB3 } });
  CH(MT.JESTER, MT.CHU_HE_CUNG_DINH, [MT.LICH_SU, MT.TRUNG_CO, MT.CUNG_DINH], { outfit: MT.TUNIC, headwear: MT.JESTER_HAT, colors: { top: MT.C0392B, bottom: MT.E2B33A, hat: MT.C0392B, accent: MT.E2B33A } });
  CH(MT.BLACKSMITH, MT.THO_REN, [MT.LICH_SU, MT.TRUNG_CO, MT.THO], { outfit: MT.APRON, build: MT.HEAVY, accessories: [MT.BEARD], colors: { top: MT.VALUE_6A5A4A, bottom: MT.VALUE_3A3028, apron: MT.VALUE_5A3A22, hair: MT.VALUE_2A1E14 } });
  CH(MT.MEDIEVAL_MERCHANT, MT.THUONG_NHAN_TRUNG_CO, [MT.LICH_SU, MT.TRUNG_CO, MT.BUON_BAN], { outfit: MT.ROBE, headwear: MT.BERET, build: MT.HEAVY, accessories: [MT.HANDBAG], colors: { top: MT.VALUE_2A4A6A, bottom: MT.VALUE_2A4A6A, hat: MT.VALUE_7A2A2A, accent: MT.C9A23A } });
  CH(MT.PEASANT_WOMAN, MT.NONG_PHU_TRUNG_CO, [MT.LICH_SU, MT.TRUNG_CO, MT.NU], { gender: MT.FEMALE, outfit: MT.DRESS, headwear: MT.BONNET, colors: { top: MT.VALUE_7A6A4A, hat: MT.E8E0CC, skin: MT.E8C0A0 } });
  CH(MT.MONGOL_WARRIOR, MT.CHIEN_BINH_MONG_CO, [MT.LICH_SU, MT.MONG_CO, MT.CHIEN_BINH], { outfit: MT.ARMOR, headwear: MT.FUR_HAT, build: MT.ATHLETIC, accessories: [MT.SWORD], colors: { top: MT.VALUE_7A4A2A, bottom: MT.VALUE_4A3A2A, hat: MT.VALUE_6B4A2E, skin: MT.D8A47A } });
  CH(MT.SAMURAI_LORD, MT.LANH_CHUA_SAMURAI, [MT.LICH_SU, MT.NHAT_BAN_2, MT.SAMURAI], { outfit: MT.ARMOR, headwear: MT.KABUTO, build: MT.ATHLETIC, accessories: [MT.SWORD], colors: { top: MT.VALUE_8A2A2A, bottom: MT.VALUE_2A2226, hat: MT.VALUE_2A2226, accent: MT.D9A93A, skin: MT.E8C4A0 } });
  CH(MT.GEISHA, MT.GEISHA_2, [MT.LICH_SU, MT.NHAT_BAN_2, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.KIMONO, colors: { skin: MT.F6ECE6, top: MT.B8324A, bottom: MT.B8324A, accent: MT.E8C45A, hair: MT.VALUE_0E0C10 } });
  CH(MT.RONIN, MT.LANG_NHAN, [MT.LICH_SU, MT.NHAT_BAN_2, MT.SAMURAI], { hair: MT.BUN, outfit: MT.KIMONO, accessories: [MT.SWORD], colors: { skin: MT.E2B892, top: MT.VALUE_3A4048, bottom: MT.VALUE_3A4048, accent: MT.VALUE_1A1A1E, hair: MT.VALUE_0E0C10 } });
  CH(MT.VIKING_SHIELDMAIDEN, MT.NU_CHIEN_BINH_VIKING, [MT.LICH_SU, MT.VIKING, MT.NU], { gender: MT.FEMALE, hair: MT.PONYTAIL, outfit: MT.ARMOR, headwear: MT.VIKING_HELMET, accessories: [MT.SHIELD, MT.SPEAR], colors: { top: MT.VALUE_6A5A4A, bottom: MT.VALUE_4A3A2A, hair: MT.D8B46A, shield: MT.VALUE_8A3A2A } });
  CH(MT.VN_FEMALE_GENERAL, MT.NU_TUONG_VIET_CO, [MT.LICH_SU, MT.VIET_NAM_2, MT.NU, MT.TUONG], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.ARMOR, headwear: MT.KHAN_DONG, accessories: [MT.CAPE, MT.SWORD], colors: { top: MT.C9952E, bottom: MT.VALUE_7A2A2A, hat: MT.C42A2A, cape: MT.A82A2A } });
  CH(MT.VN_COURT_LADY, MT.CUNG_NU, [MT.LICH_SU, MT.VIET_NAM_2, MT.CUNG_DINH, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.ROBE, accessories: [MT.NECKLACE], colors: { top: MT.E88AA0, bottom: MT.E88AA0, accent: MT.E2B33A } });
  CH(MT.NGUYEN_SOLDIER, MT.LINH_TRIEU_NGUYEN, [MT.LICH_SU, MT.VIET_NAM_2, MT.LINH], { outfit: MT.TUNIC, headwear: MT.CONICAL, accessories: [MT.SPEAR], colors: { top: MT.B8322A, bottom: MT.VALUE_2A2A30, hat: MT.D9C48F, accent: MT.VALUE_1A1A1E } });
  CH(MT.NHO_SINH, MT.NHO_SINH_2, [MT.LICH_SU, MT.VIET_NAM_2, MT.HOC_TRO], { outfit: MT.ROBE, headwear: MT.KHAN_DONG, colors: { top: MT.VALUE_2A4A7A, bottom: MT.VALUE_2A4A7A, hat: MT.VALUE_1C1A22 } });
  CH(MT.COLONIAL_OFFICER, MT.SI_QUAN_THUOC_DIA, [MT.LICH_SU, MT.THUOC_DIA, MT.QUAN_DOI], { outfit: MT.UNIFORM, headwear: MT.PITH_HELMET, accessories: [MT.MUSTACHE], colors: { top: MT.ECE6D4, bottom: MT.ECE6D4, hat: MT.ECE6D4, accent: MT.C9A23A } });
  CH(MT.WW1_SOLDIER, MT.LINH_THE_CHIEN_I, [MT.LICH_SU, MT.THE_CHIEN, MT.LINH], { outfit: MT.MILITARY, headwear: MT.TIN_HELMET, accessories: [MT.BACKPACK], colors: { top: MT.VALUE_6A6A4A, bottom: MT.VALUE_5A5A3E, hat: MT.VALUE_5A6045 } });
  CH(MT.WW2_SOLDIER, MT.LINH_THE_CHIEN_II, [MT.LICH_SU, MT.THE_CHIEN, MT.LINH], { outfit: MT.MILITARY, headwear: MT.M1_HELMET, accessories: [MT.BACKPACK], colors: { top: MT.VALUE_5A6040, bottom: MT.VALUE_4A5034, hat: MT.VALUE_4A5034 } });
  CH(MT.WW2_OFFICER, MT.SI_QUAN_THE_CHIEN_II, [MT.LICH_SU, MT.THE_CHIEN, MT.SI_QUAN], { outfit: MT.COAT, headwear: MT.POLICE_CAP, accessories: [MT.MEDAL], colors: { top: MT.VALUE_5A5E62, bottom: MT.VALUE_4A4E52, hat: MT.VALUE_4A4E52, accent: MT.C9A23A } });
  CH(MT.RESISTANCE_FIGHTER, MT.CHIEN_SI_KHANG_CHIEN, [MT.LICH_SU, MT.CHIEN_TRANH, MT.KHANG_CHIEN], { outfit: MT.COAT, headwear: MT.BERET, accessories: [MT.SCARF], colors: { top: MT.VALUE_4A4A3A, bottom: MT.VALUE_2A2A24, hat: MT.VALUE_1A1A1E, accent: MT.VALUE_8A2A2A } });
  CH(MT.AVIATOR_1940, MT.PHI_CONG_THAP_NIEN_40, [MT.LICH_SU, MT.THE_CHIEN, MT.PHI_CONG_2], { outfit: MT.COAT, headwear: MT.AVIATOR_CAP, accessories: [MT.SCARF], colors: { top: MT.VALUE_5A3A28, bottom: MT.VALUE_4A4034, hat: MT.VALUE_6A4630, accent: MT.F0ECE4 } });
  CH(MT.ARCHAEOLOGIST, MT.NHA_KHAO_CO, [MT.KHAM_PHA, MT.KHAO_CO, MT.NU], { gender: MT.FEMALE, hair: MT.PONYTAIL, outfit: MT.CASUAL, headwear: MT.PITH_HELMET, accessories: [MT.BACKPACK], colors: { top: MT.C8B48A, bottom: MT.VALUE_7A6A4A, hat: MT.E3D9BC } });
  CH(MT.OUTLAW, MT.KE_CUOP_MIEN_TAY, [MT.MIEN_TAY_2, MT.TOI_PHAM, MT.CAO_BOI], { outfit: MT.COAT, headwear: MT.COWBOY_HAT, accessories: [MT.FACE_MASK], colors: { top: MT.VALUE_4A3A2A, bottom: MT.VALUE_2A2420, hat: MT.VALUE_1A1614, mask: MT.VALUE_8A2A2A } });
  CH(MT.INVENTOR_1900, MT.NHA_PHAT_MINH, [MT.LICH_SU, MT.KHOA_HOC, MT.THE_KY_19], { outfit: MT.SUIT, accessories: [MT.MUSTACHE], colors: { top: MT.VALUE_2A2A30, bottom: MT.VALUE_2A2A30, accent: MT.VALUE_7A2A2A, hair: MT.VALUE_2A2420 } });
  CH(MT.NEWSBOY, MT.CAU_BE_BAN_BAO, [MT.LICH_SU, MT.THAP_NIEN_20, MT.TRE_EM], { age: MT.CHILD, outfit: MT.CASUAL, headwear: MT.CAP, colors: { top: MT.VALUE_8A7A5A, bottom: MT.VALUE_4A4034, hat: MT.VALUE_5A4A3A } });
  CH(MT.FLAPPER_1920, MT.QUY_CO_THAP_NIEN_20, [MT.LICH_SU, MT.THAP_NIEN_20, MT.NU], { gender: MT.FEMALE, hair: MT.SHORT, outfit: MT.DRESS, headwear: MT.HEADBAND, accessories: [MT.NECKLACE], colors: { top: MT.VALUE_1A1A20, hat: MT.C9A23A, hair: MT.VALUE_1A1410 } });
  for (const id of TALES.characters) if (!T.characters.includes(id)) T.characters.push(id);
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
