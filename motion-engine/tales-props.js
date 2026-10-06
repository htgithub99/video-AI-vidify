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
  const P = K.P;
  const INK = MT.VALUE_2A1C22;
  const TALES = (ME.TALES = ME.TALES || { characters: [], assets: [], envs: [] });
  const ids = [];
  const isLine = () => T.style === MT.LINE;
  const nt = (col, o, k) => (o.night ? C.mix(col, MT.VALUE_16203A, k == null ? 0.4 : k) : col);
  const tm = (o) => o.t || 0;
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const add = (id, name, cat, size, draw, tags, lights) => {
    const extra = { tags: [MT.TOON].concat(tags || []) };
    if (lights) extra.lights = lights;
    T.NEW(id, name, cat, size, draw, extra);
    ids.push(id);
  };
  const glowAt = (x, y, r, color, alpha) => (o) => (o.night ? [{ type: MT.GLOW, x, y, r, color, alpha }] : []);
  const tube = (g, pts, col, w) => {
    if (isLine()) K.stroke(g, pts, INK, w + 2.2);
    K.stroke(g, pts, col, w);
  };
  const line = (g, pts, col, w) => K.stroke(g, pts, col, w);
  const ringS = (g, x, y, rx, ry, rot, col, w) => {
    const p = K.ell(x, y, rx, ry, rot);
    g.save();
    if (isLine()) {
      g.strokeStyle = INK;
      g.lineWidth = w + 2;
      g.stroke(p);
    }
    g.strokeStyle = col;
    g.lineWidth = w;
    g.stroke(p);
    g.restore();
  };
  const ringPath = (x, y, ro, ri) => {
    const p = P();
    p.ellipse(x, y, ro, ro, 0, 0, PI * 2);
    p.moveTo(x + ri, y);
    p.ellipse(x, y, ri, ri, 0, 0, PI * 2, true);
    return p;
  };
  const sym = (right) => {
    const left = right
      .slice()
      .reverse()
      .map(([x, y]) => [-x, y]);
    return right.concat(left);
  };
  const flame = (g, x, y, h, o, ph) => {
    const tt = tm(o) + (ph || 0);
    const s = Math.sin(tt * 11 + x) * 0.5 + Math.sin(tt * 7.3 + x * 1.7) * 0.5;
    const hh = h * (1 + 0.08 * s);
    const sw = s * h * 0.12;
    K.glowDisc(g, x, y - hh * 0.5, h * (o.night ? 4.5 : 2.6), MT.FFBF5A, o.night ? 0.5 : 0.22);
    const f = (k, col, opt) => {
      const p = P();
      const w = h * 0.36 * k;
      const H = hh * k;
      p.moveTo(x, y + h * 0.05);
      p.bezierCurveTo(x - w * 1.1, y - H * 0.2, x - w * 0.6 + sw * 0.4, y - H * 0.65, x + sw, y - H);
      p.bezierCurveTo(x + w * 0.6 + sw * 0.4, y - H * 0.65, x + w * 1.1, y - H * 0.2, x, y + h * 0.05);
      K.paint(g, p, col, opt);
    };
    f(1, MT.FF9F2E, { d: 0, lw: 0.9, glow: o.night ? MT.RGBA_255_180_80_0_9 : null, glowR: 14 });
    f(0.58, MT.FFF1A8, { d: 0, ink: false });
  };
  const fire = (g, x, y, w, h, o, ph) => {
    const tt = tm(o) + (ph || 0);
    const s = Math.sin(tt * 8 + ph * 3) * 0.6 + Math.sin(tt * 13.7 + ph) * 0.4;
    const H = h * (1 + 0.12 * s);
    const sw = s * w * 0.35;
    const layer = (k, col, opt) => {
      const p = P();
      const hw = (w / 2) * k;
      p.moveTo(x - hw, y);
      p.bezierCurveTo(x - hw * 1.1, y - H * k * 0.45, x - hw * 0.3 + sw * 0.5, y - H * k * 0.7, x + sw, y - H * k);
      p.bezierCurveTo(x + hw * 0.4 + sw * 0.5, y - H * k * 0.6, x + hw * 1.1, y - H * k * 0.4, x + hw, y);
      p.closePath();
      K.paint(g, p, col, opt);
    };
    layer(1, MT.E8542A, { d: 0, lw: 1, glow: o.night ? MT.RGBA_255_120_40_0_9 : null, glowR: 20 });
    layer(0.72, MT.FFA53A, { d: 0, ink: false });
    layer(0.42, MT.FFE27A, { d: 0, ink: false });
  };
  const candle = (g, x, y, w, h, col, o, ph) => {
    K.paint(g, K.rrect(x - w / 2, y - h, w, h, Math.min(2, w * 0.3)), col, { d: Math.max(1, w * 0.25), lw: 1 });
    K.paint(g, K.ell(x, y - h, w / 2, w * 0.18), C.shade(col, 0.12), { d: 0, ink: false });
    K.paint(g, K.rrect(x + w * 0.12, y - h, w * 0.22, h * 0.32, w * 0.11), C.shade(col, 0.08), { d: 0, ink: false });
    line(
      g,
      [
        [x, y - h],
        [x, y - h - 2],
      ],
      MT.VALUE_2A2020,
      0.9,
    );
    flame(g, x, y - h - 1.2, w * 1.1 + 3, o, ph);
  };
  const bone = (g, x, y, len, ang, col, w) => {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    const h = len / 2;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) K.paint(g, K.ell(sx * h, sy * w * 0.42, w * 0.7, w * 0.7), col, { d: 1, lw: 1 });
    K.paint(g, K.rect(-h, -w / 2, len, w), col, { d: 1, ink: false });
    if (isLine()) {
      line(
        g,
        [
          [-h + w * 0.7, -w / 2],
          [h - w * 0.7, -w / 2],
        ],
        INK,
        1,
      );
      line(
        g,
        [
          [-h + w * 0.7, w / 2],
          [h - w * 0.7, w / 2],
        ],
        INK,
        1,
      );
    }
    g.restore();
  };
  const skullAt = (g, x, y, s, o, rot) => {
    const b = nt(MT.E8DFC8, o, 0.3);
    const dk = MT.VALUE_2A2022;
    g.save();
    g.translate(x, y);
    g.rotate(rot || 0);
    g.scale(s, s);
    K.paint(g, K.rrect(-6.5, -10, 13, 10, 3.5), C.shade(b, -0.05), { d: 1.5, lw: 1.1 });
    K.paint(g, K.ell(0, -14.5, 11, 10), b, { d: 2.5, lw: 1.2 });
    K.paint(g, K.rrect(-6.2, -10.5, 12.4, 4, 2), b, { d: 0, ink: false });
    K.paint(g, K.ell(-4.3, -12.8, 3.3, 3.8, 0.15), dk, { d: 0, ink: false });
    K.paint(g, K.ell(4.3, -12.8, 3.3, 3.8, -0.15), dk, { d: 0, ink: false });
    K.paint(
      g,
      K.poly([
        [0, -9.6],
        [-1.7, -6.6],
        [1.7, -6.6],
      ]),
      dk,
      { d: 0, ink: false },
    );
    for (let i = -2; i <= 2; i++)
      line(
        g,
        [
          [i * 1.6, -4.6],
          [i * 1.6, -1.6],
        ],
        MT.VALUE_6A5E50,
        0.6,
      );
    line(
      g,
      [
        [-4.6, -3.2],
        [4.6, -3.2],
      ],
      MT.VALUE_6A5E50,
      0.6,
    );
    g.restore();
  };
  add(
    MT.CANDELABRA,
    MT.CHAN_NEN_BA_NGON,
    MT.FURNITURE,
    [62, 80],
    (g, o) => {
      const b = nt(o.color || MT.C9A24A, o, 0.3);
      K.paint(g, K.ell(0, -3.5, 16, 4), C.shade(b, -0.15), { d: 1.5, lw: 1.2 });
      K.paint(
        g,
        K.poly([
          [-12, -5],
          [12, -5],
          [5, -13],
          [-5, -13],
        ]),
        b,
        { d: 2, lw: 1.2 },
      );
      for (const s of [-1, 1]) {
        tube(
          g,
          [
            [0, -30],
            [s * 22, -26, s * 22, -42],
          ],
          b,
          3.2,
        );
        K.paint(g, K.rrect(s * 22 - 5.5, -45, 11, 4, 1.5), b, { d: 1.5, lw: 1.1 });
      }
      K.paint(g, K.rrect(-2.6, -51, 5.2, 40, 2), b, { d: 1.5, lw: 1.1 });
      K.paint(g, K.ell(0, -20, 4.8, 3), C.shade(b, 0.1), { d: 1.5, lw: 1.1 });
      K.paint(g, K.ell(0, -31, 4.2, 2.6), C.shade(b, 0.1), { d: 1.5, lw: 1.1 });
      K.paint(g, K.rrect(-6, -53, 12, 4, 1.5), b, { d: 1.5, lw: 1.1 });
      candle(g, -22, -45, 6, 13, MT.EFE6CF, o, 0.3);
      candle(g, 22, -45, 6, 13, MT.EFE6CF, o, 1.1);
      candle(g, 0, -53, 6.5, 16, MT.EFE6CF, o, 2.2);
    },
    [MT.KINH_DI, MT.NEN_3, MT.DEN],
    glowAt(0, -66, 120, MT.FFC76A, 0.4),
  );
  add(
    MT.OIL_LAMP,
    MT.DEN_DAU,
    MT.PROP,
    [36, 62],
    (g, o) => {
      const b = nt(o.color || MT.B8873A, o, 0.3);
      K.paint(g, K.ell(0, -3, 13, 3.4), C.shade(b, -0.15), { d: 1, lw: 1.1 });
      K.paint(
        g,
        K.poly([
          [-9, -4],
          [9, -4],
          [4, -11],
          [-4, -11],
        ]),
        b,
        { d: 1.5, lw: 1.1 },
      );
      ringS(g, 14, -20, 4.5, 5, 0, b, 2);
      K.paint(g, K.ell(0, -19, 13, 9), nt(MT.C98A3A, o, 0.3), { d: 3, lw: 1.2 });
      K.paint(g, K.ell(0, -22, 9, 3), C.rgba(MT.FFF0C0, 0.35), { d: 0, ink: false });
      K.paint(g, K.rrect(-7, -31, 14, 5, 1.5), b, { d: 1.5, lw: 1.1 });
      K.paint(g, K.rrect(-5.5, -35, 11, 4, 1.2), C.shade(b, 0.1), { d: 1, lw: 1 });
      flame(g, 0, -36, 9, o, 0.5);
      const gl = P();
      gl.moveTo(-4.5, -35);
      gl.bezierCurveTo(-11, -40, -10, -50, -4.5, -54);
      gl.lineTo(-4, -61);
      gl.lineTo(4, -61);
      gl.lineTo(4.5, -54);
      gl.bezierCurveTo(10, -50, 11, -40, 4.5, -35);
      gl.closePath();
      K.paint(g, gl, o.night ? MT.RGBA_255_236_190_0_28 : MT.RGBA_220_238_245_0_38, { d: 0, lw: 1 });
      line(
        g,
        [
          [-6.5, -40],
          [-7.5, -46, -5, -51],
        ],
        MT.RGBA_255_255_255_0_75,
        1.2,
      );
    },
    [MT.KINH_DI, MT.DEN, MT.CO_3],
    glowAt(0, -42, 110, MT.FFC76A, 0.4),
  );
  add(
    MT.HAUNTED_MIRROR,
    MT.GUONG_MA_AM,
    MT.INTERIOR,
    [96, 150],
    (g, o) => {
      const gold = nt(o.color || MT.B8903A, o, 0.4);
      const cy = -76;
      const pts = [];
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * PI * 2;
        const r = i % 2 ? 1 : 1.07;
        pts.push([Math.cos(a) * 42 * r, cy + Math.sin(a) * 64 * r]);
      }
      K.paint(
        g,
        K.poly([
          [0, -150],
          [12, -140],
          [6, -134],
          [-6, -134],
          [-12, -140],
        ]),
        gold,
        { d: 2, lw: 1.2 },
      );
      K.paint(g, K.poly(pts, true), gold, { d: 4, lw: 1.4 });
      K.paint(g, K.ell(0, cy, 35, 56), C.shade(gold, -0.25), { d: 2, lw: 1.2 });
      const glass = K.ell(0, cy, 31, 51);
      const gr = g.createRadialGradient(-6, cy - 14, 4, 0, cy, 58);
      gr.addColorStop(0, o.night ? MT.VALUE_26343E : MT.VALUE_3E525C);
      gr.addColorStop(1, MT.VALUE_0E1418);
      K.paint(g, glass, gr, { d: 0, lw: 1.2 });
      g.save();
      g.clip(glass);
      K.glowDisc(g, 4, cy - 8, 40, MT.VALUE_9FC0CC, 0.18);
      g.globalAlpha = 0.3 + 0.08 * Math.sin(tm(o) * 1.7);
      K.paint(g, K.ell(4, cy - 10, 11, 14.5), MT.DFE8EA, { d: 0, ink: false });
      K.paint(
        g,
        K.poly(
          [
            [-8, cy + 2],
            [16, cy + 2],
            [22, cy + 40],
            [-14, cy + 40],
          ],
          true,
        ),
        MT.C9D6DA,
        { d: 0, ink: false },
      );
      g.globalAlpha = 0.75;
      K.paint(g, K.ell(0, cy - 12, 2.6, 3.4), MT.VALUE_0A0E10, { d: 0, ink: false });
      K.paint(g, K.ell(8, cy - 12, 2.6, 3.4), MT.VALUE_0A0E10, { d: 0, ink: false });
      K.paint(g, K.ell(4, cy - 3, 2, 3), MT.VALUE_0A0E10, { d: 0, ink: false });
      g.globalAlpha = 1;
      line(
        g,
        [
          [-22, cy - 30],
          [-6, cy - 46],
        ],
        MT.RGBA_255_255_255_0_22,
        5,
      );
      line(
        g,
        [
          [-24, cy - 18],
          [-14, cy - 28],
        ],
        MT.RGBA_255_255_255_0_15,
        2.5,
      );
      g.restore();
      for (const a of [0.5, 2.64, 4.2, 5.2]) K.paint(g, K.ell(Math.cos(a) * 41, cy + Math.sin(a) * 62, 4, 4), C.shade(gold, 0.15), { d: 1, lw: 1 });
    },
    [MT.KINH_DI, MT.GUONG, MT.MA],
  );
  add(
    MT.CREEPY_DOLL,
    MT.BUP_BE_MA,
    MT.PROP,
    [44, 56],
    (g, o) => {
      const skin = nt(MT.F2E6DA, o, 0.3);
      const dress = nt(o.color || MT.VALUE_8A4A5A, o, 0.35);
      for (const s of [-1, 1]) {
        K.paint(g, K.rrect(s * 7 - 4, -12, 8, 10, 3), nt(MT.F4F1EA, o, 0.3), { d: 1, lw: 1 });
        K.paint(g, K.ell(s * 7, -2.6, 5, 3), MT.VALUE_2A2226, { d: 1, lw: 1 });
      }
      K.paint(
        g,
        K.poly(
          [
            [-6, -32],
            [6, -32],
            [12, -20],
            [19, -9],
            [0, -7],
            [-19, -9],
            [-12, -20],
          ],
          true,
        ),
        dress,
        { d: 3, lw: 1.2 },
      );
      for (let i = 0; i < 7; i++) K.paint(g, K.ell(-15 + i * 5, -9.5, 3, 2), nt(MT.F4F1EA, o, 0.3), { d: 0, lw: 0.8 });
      for (const s of [-1, 1]) {
        tube(
          g,
          [
            [s * 7, -30],
            [s * 13, -22, s * 14, -16],
          ],
          dress,
          4,
        );
        K.paint(g, K.ell(s * 14, -14.5, 2.4, 2.4), skin, { d: 0.8, lw: 0.9 });
      }
      K.paint(g, K.rrect(-5, -34, 10, 4, 2), nt(MT.F4F1EA, o, 0.3), { d: 0, lw: 0.9 });
      g.save();
      g.translate(0, -43);
      g.rotate(0.16);
      const hair = nt(MT.VALUE_5A3A24, o, 0.35);
      K.paint(g, K.ell(-9.5, 4, 3.6, 6.5), hair, { d: 1.5, lw: 1 });
      K.paint(g, K.ell(9.5, 4, 3.6, 6.5), hair, { d: 1.5, lw: 1 });
      K.paint(g, K.ell(0, 0, 10, 10.5), skin, { d: 2, lw: 1.2 });
      K.paint(
        g,
        K.poly(
          [
            [-11, 0],
            [-9, -9],
            [0, -12],
            [9, -9],
            [11, 0],
            [5, -6],
            [-3, -7],
          ],
          true,
        ),
        hair,
        { d: 1.5, lw: 1.1 },
      );
      K.paint(g, K.ell(-6, -10, 4, 2.6, -0.4), MT.A82A3A, { d: 1, lw: 0.9 });
      K.paint(g, K.ell(-3.6, 0.5, 2.4, 2.8), MT.VALUE_1A1418, { d: 0, ink: false });
      K.paint(g, K.ell(3.6, 0.5, 2.4, 2.8), MT.VALUE_1A1418, { d: 0, ink: false });
      K.paint(g, K.ell(-3.1, -0.3, 0.7, 0.7), MT.FFFFFF, { d: 0, ink: false });
      K.paint(g, K.ell(4.1, -0.3, 0.7, 0.7), MT.FFFFFF, { d: 0, ink: false });
      K.paint(g, K.ell(-6, 4.5, 1.8, 1.1), MT.RGBA_220_110_120_0_45, { d: 0, ink: false });
      K.paint(g, K.ell(6, 4.5, 1.8, 1.1), MT.RGBA_220_110_120_0_45, { d: 0, ink: false });
      K.paint(g, K.ell(0, 6, 1.4, 0.9), MT.VALUE_8A2A30, { d: 0, ink: false });
      line(
        g,
        [
          [1, -8],
          [2.5, -5],
          [1.5, -3],
          [3, -1],
          [2, 3],
          [3.5, 6],
        ],
        MT.VALUE_4A3A3A,
        0.7,
      );
      line(
        g,
        [
          [2.5, -5],
          [5, -6],
        ],
        MT.VALUE_4A3A3A,
        0.6,
      );
      g.restore();
    },
    [MT.KINH_DI, MT.BUP_BE, MT.MA],
  );
  add(
    MT.ROCKING_CHAIR,
    MT.GHE_BAP_BENH,
    MT.FURNITURE,
    [96, 108],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_7A4E32, o, 0.35);
      const dk = C.shade(w, -0.18);
      tube(
        g,
        [
          [-30, -50],
          [-44, -104],
        ],
        dk,
        4,
      );
      tube(
        g,
        [
          [-22, -6],
          [-26, -50],
        ],
        dk,
        4,
      );
      for (let i = 0; i < 4; i++) {
        const u = 0.15 + i * 0.23;
        tube(
          g,
          [
            [-30 + u * 11, -54],
            [-45 + u * 12, -98],
          ],
          w,
          2.2,
        );
      }
      tube(
        g,
        [
          [-28, -50],
          [-42, -104],
        ],
        w,
        4.5,
      );
      tube(
        g,
        [
          [-19, -52],
          [-33, -102],
        ],
        w,
        4,
      );
      K.paint(g, K.rrect(-49, -110, 20, 9, 4), w, { d: 2, lw: 1.2 });
      tube(
        g,
        [
          [-44, -8],
          [0, 9, 44, -8],
        ],
        C.shade(w, 0.05),
        5,
      );
      tube(
        g,
        [
          [22, -4],
          [22, -52],
        ],
        w,
        4,
      );
      tube(
        g,
        [
          [-24, -2],
          [-22, -50],
        ],
        w,
        4,
      );
      K.paint(g, K.rrect(-31, -56, 60, 7, 3), C.shade(w, 0.08), { d: 2, lw: 1.3 });
      tube(
        g,
        [
          [20, -55],
          [21, -72],
        ],
        w,
        3,
      );
      tube(
        g,
        [
          [-32, -74],
          [6, -78, 26, -73],
        ],
        C.shade(w, 0.06),
        4,
      );
      K.paint(g, K.rrect(-29, -60, 50, 6, 3), nt(MT.VALUE_9A3A3A, o, 0.35), { d: 1.5, lw: 1.1 });
    },
    [MT.KINH_DI, MT.GHE_2, MT.CO_3],
  );
  add(
    MT.OUIJA_BOARD,
    MT.BAN_CAU_CO,
    MT.PROP,
    [120, 34],
    (g, o) => {
      const w = nt(o.color || MT.C8975A, o, 0.35);
      K.paint(
        g,
        K.poly([
          [-57, -3],
          [57, -3],
          [57, 0],
          [-57, 0],
        ]),
        C.shade(w, -0.35),
        { d: 0, lw: 1.1 },
      );
      K.paint(
        g,
        K.poly([
          [-57, -3],
          [57, -3],
          [47, -30],
          [-47, -30],
        ]),
        w,
        { d: 2, lw: 1.3 },
      );
      line(
        g,
        [
          [-51, -5],
          [51, -5],
          [43, -28],
          [-43, -28],
          [-51, -5],
        ],
        C.shade(w, -0.4),
        0.8,
      );
      const ink = nt(MT.VALUE_3A2216, o, 0.2);
      for (let r = 0; r < 2; r++)
        for (let i = 0; i <= 12; i++) {
          const u = -1 + (i / 12) * 2;
          const x = u * (32 - r * 2);
          const y = -15 - r * 5.5 - (1 - u * u) * 4;
          K.paint(g, K.rect(x - 0.9, y - 1.3, 1.8, 2.6), ink, { d: 0, ink: false });
        }
      for (let i = 0; i < 10; i++) K.paint(g, K.rect(-20 + i * 4.4, -9.5, 1.6, 2.2), ink, { d: 0, ink: false });
      K.paint(g, K.ell(-37, -24, 3.5, 2), ink, { d: 0, ink: false });
      K.paint(g, K.ell(37, -24, 3.5, 2), ink, { d: 0, ink: false });
      K.paint(g, K.ell(38.4, -24.4, 3, 1.8), w, { d: 0, ink: false });
      g.save();
      g.translate(12, -13);
      g.rotate(-0.25);
      K.paint(
        g,
        K.poly(
          [
            [0, -7],
            [9, 2],
            [0, 4.5],
            [-9, 2],
          ],
          true,
        ),
        nt(MT.ECE0C4, o, 0.3),
        { d: 1.5, lw: 1.1 },
      );
      K.paint(g, K.ell(0, -1, 2.6, 1.8), MT.RGBA_170_210_225_0_7, { d: 0, lw: 0.8 });
      g.restore();
    },
    [MT.KINH_DI, MT.CAU_CO, MT.TAM_LINH],
  );
  add(MT.SKULL, MT.DAU_LAU, MT.PROP, [26, 26], (g, o) => skullAt(g, 0, 0, 1, o, 0), [MT.KINH_DI, MT.DAU_LAU_2, MT.XUONG_2]);
  add(
    MT.BONE_PILE,
    MT.DONG_XUONG,
    MT.PROP,
    [96, 40],
    (g, o) => {
      const b = nt(MT.E3D8BD, o, 0.3);
      const list = [
        [-30, -4, 30, 0.08],
        [22, -4, 34, -0.05],
        [-6, -6, 28, 0.35],
        [-24, -10, 26, -0.5],
        [30, -11, 22, 0.6],
        [4, -12, 32, -0.12],
        [-12, -15, 20, 0.9],
      ];
      for (const [x, y, l, a] of list) bone(g, x, y, l, a, C.shade(b, hash(x) * 0.1 - 0.05), 3.4);
      skullAt(g, 10, -14, 0.95, o, -0.2);
      skullAt(g, -34, -6, 0.62, o, 0.5);
    },
    [MT.KINH_DI, MT.XUONG_2],
  );
  add(
    MT.COBWEB,
    MT.MANG_NHEN,
    MT.INTERIOR,
    [120, 120],
    (g, o) => {
      const cx = -60,
        cy = -120;
      const col = o.night ? MT.RGBA_215_225_240_0_7 : MT.RGBA_252_252_255_0_9;
      const sh = MT.RGBA_30_30_40_0_28;
      const n = 8;
      const rad = [];
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1)) * (PI / 2);
        const L = 112 * (0.82 + 0.18 * hash(i + 3));
        rad.push([a, L]);
      }
      const pt = (i, r) => [cx + Math.cos(rad[i][0]) * Math.min(r, rad[i][1]), cy + Math.sin(rad[i][0]) * Math.min(r, rad[i][1])];
      const draw = (c, off, w) => {
        g.save();
        g.translate(off, off);
        for (let i = 0; i < n; i++) line(g, [[cx, cy], pt(i, rad[i][1])], c, w);
        for (let k = 1; k <= 6; k++) {
          const r = k * 16;
          for (let i = 0; i < n - 1; i++) {
            const a = pt(i, r),
              b = pt(i + 1, r);
            const mx = (a[0] + b[0]) / 2,
              my = (a[1] + b[1]) / 2;
            line(g, [a, [cx + (mx - cx) * 0.9, cy + (my - cy) * 0.9 + 2, b[0], b[1]]], c, w * 0.85);
          }
        }
        const e = pt(4, 96);
        line(g, [e, [e[0] + 6, e[1] + 14, e[0] + 2, e[1] + 26]], c, w * 0.8);
        g.restore();
      };
      draw(sh, 0.8, 1);
      draw(col, 0, 1);
    },
    [MT.KINH_DI, MT.MANG_NHEN_2, MT.GOC_TUONG],
  );
  add(
    MT.CROW,
    MT.CON_QUA,
    MT.ANIMAL,
    [38, 32],
    (g, o) => {
      const b = o.color || MT.VALUE_1D2130;
      const sheen = MT.RGBA_110_150_210_0_55;
      line(
        g,
        [
          [-1, -9],
          [-2, 0],
        ],
        MT.VALUE_3A3A40,
        1.2,
      );
      line(
        g,
        [
          [3, -9],
          [4, 0],
        ],
        MT.VALUE_3A3A40,
        1.2,
      );
      line(
        g,
        [
          [-5, 0],
          [2, 0],
        ],
        MT.VALUE_3A3A40,
        1,
      );
      line(
        g,
        [
          [1, 0],
          [8, 0],
        ],
        MT.VALUE_3A3A40,
        1,
      );
      K.paint(
        g,
        K.poly([
          [-7, -15],
          [-23, -6],
          [-21, -1],
          [-17, -2],
          [-5, -8],
        ]),
        b,
        { d: 1, lw: 1.1 },
      );
      K.paint(g, K.ell(0, -16, 12.5, 8.5, -0.32), b, { d: 2, lw: 1.2 });
      K.paint(g, K.ell(9, -24, 6.5, 6), b, { d: 1.5, lw: 1.2 });
      K.paint(
        g,
        K.poly(
          [
            [-9, -17],
            [2, -22],
            [7, -15],
            [-2, -11],
            [-14, -9],
          ],
          true,
        ),
        C.shade(b, -0.2),
        { d: 0, lw: 1 },
      );
      line(
        g,
        [
          [-4, -20],
          [2, -22, 5, -18],
        ],
        sheen,
        1.6,
      );
      line(
        g,
        [
          [6, -28],
          [10, -30, 13, -27],
        ],
        sheen,
        1.2,
      );
      K.paint(
        g,
        K.poly([
          [13.5, -26.5],
          [22, -23.5],
          [13.5, -21.5],
        ]),
        MT.VALUE_3A3A42,
        { d: 0, lw: 1 },
      );
      K.paint(g, K.ell(11, -25.2, 1.5, 1.5), o.night ? MT.FFD84A : MT.E8D36A, { d: 0, ink: false, glow: o.night ? MT.RGBA_255_210_80_0_9 : null, glowR: 6 });
      K.paint(g, K.ell(11.3, -25.2, 0.7, 0.7), MT.VALUE_0A0A0A, { d: 0, ink: false });
    },
    [MT.KINH_DI, MT.CHIM, MT.QUA_2],
  );
  add(
    MT.BAT,
    MT.CON_DOI,
    MT.ANIMAL,
    [72, 120],
    (g, o) => {
      const tt = tm(o);
      const f = Math.sin(tt * 10);
      const by = -98 + Math.sin(tt * 2) * 3;
      const mem = nt(o.color || MT.VALUE_3A2E40, o, 0.15);
      for (const s of [-1, 1]) {
        g.save();
        g.translate(0, by);
        g.scale(s, 1);
        const a = f * 10;
        const p = P();
        p.moveTo(3, -3);
        p.quadraticCurveTo(16, -12 - a * 0.6, 34, -10 - a);
        p.quadraticCurveTo(30, -2 - a * 0.6, 28, 2 - a * 0.6);
        p.quadraticCurveTo(24, -1 - a * 0.4, 20, 4 - a * 0.4);
        p.quadraticCurveTo(15, 1 - a * 0.2, 11, 6 - a * 0.2);
        p.quadraticCurveTo(7, 3, 3, 6);
        p.closePath();
        K.paint(g, p, mem, { d: 2, lw: 1.1 });
        const bc = C.shade(mem, -0.35);
        line(
          g,
          [
            [3, -3],
            [16, -12 - a * 0.6],
            [34, -10 - a],
          ],
          bc,
          1,
        );
        line(
          g,
          [
            [16, -12 - a * 0.6],
            [28, 2 - a * 0.6],
          ],
          bc,
          0.8,
        );
        line(
          g,
          [
            [16, -12 - a * 0.6],
            [20, 4 - a * 0.4],
          ],
          bc,
          0.8,
        );
        line(
          g,
          [
            [16, -12 - a * 0.6],
            [11, 6 - a * 0.2],
          ],
          bc,
          0.8,
        );
        g.restore();
      }
      const body = C.shade(mem, -0.25);
      K.paint(g, K.ell(0, by + 2, 5, 8), body, { d: 1.5, lw: 1.1 });
      for (const s of [-1, 1])
        K.paint(
          g,
          K.poly([
            [s * 1.5, by - 8],
            [s * 4.5, by - 15],
            [s * 4.5, by - 7],
          ]),
          body,
          { d: 0, lw: 1 },
        );
      K.paint(g, K.ell(0, by - 6, 4.6, 4.2), body, { d: 1, lw: 1.1 });
      for (const s of [-1, 1]) K.paint(g, K.ell(s * 1.8, by - 6.5, 0.9, 0.9), MT.FF4A3A, { d: 0, ink: false, glow: o.night ? MT.RGBA_255_70_50_1 : null, glowR: 6 });
    },
    [MT.KINH_DI, MT.DOI_2, MT.BAY],
  );
  add(
    MT.SPIDER,
    MT.CON_NHEN_TREO,
    MT.ANIMAL,
    [34, 150],
    (g, o) => {
      const bob = Math.sin(tm(o) * 1.4) * 3;
      const y0 = -40 + bob;
      line(
        g,
        [
          [0.6, -150],
          [0.6, y0 - 8],
        ],
        MT.RGBA_30_30_40_0_3,
        1,
      );
      line(
        g,
        [
          [0, -150],
          [0, y0 - 8],
        ],
        o.night ? MT.RGBA_220_228_240_0_8 : MT.RGBA_250_250_255_0_95,
        0.9,
      );
      const b = o.color || MT.VALUE_1E1A1E;
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const yy = y0 - 6 + i * 2;
          const kx = s * (9 + i * 1.2),
            ky = y0 - 13 + i * 4;
          const fx = s * (13 + (i % 2) * 2),
            fy = y0 - 2 + i * 4.5;
          tube(
            g,
            [
              [s * 2, yy],
              [kx, ky],
              [fx, fy],
            ],
            b,
            1.3,
          );
        }
      K.paint(g, K.ell(0, y0, 6.5, 8), b, { d: 1.5, lw: 1.1 });
      K.paint(g, K.ell(0, y0 - 8, 4.2, 3.8), b, { d: 1, lw: 1.1 });
      K.paint(
        g,
        K.poly([
          [0, y0 - 1],
          [1.8, y0 + 2],
          [0, y0 + 5],
          [-1.8, y0 + 2],
        ]),
        MT.C82A2A,
        { d: 0, ink: false },
      );
      line(
        g,
        [
          [-2.5, y0 - 4],
          [-1, y0 - 6],
        ],
        MT.RGBA_140_160_200_0_5,
        1.2,
      );
      for (const s of [-1, 1]) K.paint(g, K.ell(s * 1.4, y0 - 10, 0.7, 0.7), o.night ? MT.FF5A4A : MT.VALUE_6A2A2A, { d: 0, ink: false });
    },
    [MT.KINH_DI, MT.NHEN],
  );
  add(
    MT.JACK_O_LANTERN,
    MT.BI_NGO_MA,
    MT.PROP,
    [50, 42],
    (g, o) => {
      const or = nt(o.color || MT.E8811F, o, 0.2);
      K.glowDisc(g, 0, -18, o.night ? 60 : 34, MT.FFA040, o.night ? 0.45 : 0.18);
      K.paint(
        g,
        K.poly(
          [
            [-1.5, -32],
            [2.5, -32],
            [4, -40],
            [1, -41],
          ],
          true,
        ),
        nt(MT.VALUE_5E6A2E, o, 0.3),
        { d: 1, lw: 1.1 },
      );
      K.paint(g, K.ell(-11, -16, 12, 15.5), C.shade(or, -0.06), { d: 3, lw: 1.2 });
      K.paint(g, K.ell(11, -16, 12, 15.5), C.shade(or, -0.06), { d: 3, lw: 1.2 });
      K.paint(g, K.ell(0, -16.5, 13, 16.5), or, { d: 3, lw: 1.2 });
      const lit = o.night ? MT.FFE066 : MT.FFC43A;
      const opt = { d: 0, lw: 1, glow: o.night ? MT.RGBA_255_190_60_1 : MT.RGBA_255_190_60_0_6, glowR: o.night ? 14 : 6 };
      for (const s of [-1, 1])
        K.paint(
          g,
          K.poly([
            [s * 3, -19],
            [s * 12, -19],
            [s * 7, -26],
          ]),
          lit,
          opt,
        );
      K.paint(
        g,
        K.poly([
          [-2, -14],
          [2, -14],
          [0, -17.5],
        ]),
        lit,
        opt,
      );
      K.paint(
        g,
        K.poly([
          [-13, -11],
          [-9, -9],
          [-7, -6],
          [-4, -8],
          [-1, -5],
          [2, -8],
          [5, -5],
          [8, -8],
          [10, -6],
          [13, -11],
          [8, -2],
          [0, 0.5],
          [-8, -2],
        ]),
        lit,
        opt,
      );
    },
    [MT.KINH_DI, MT.HALLOWEEN, MT.BI_NGO],
    glowAt(0, -18, 100, MT.FFA040, 0.45),
  );
  add(
    MT.CRYSTAL_BALL,
    MT.QUA_CAU_PHA_LE,
    MT.PROP,
    [44, 58],
    (g, o) => {
      const br = nt(MT.VALUE_6B4A2A, o, 0.3);
      const tt = tm(o);
      K.glowDisc(g, 0, -32, o.night ? 48 : 32, MT.VALUE_9A7CFF, o.night ? 0.55 : 0.25);
      K.paint(
        g,
        K.poly([
          [-16, 0],
          [16, 0],
          [11, -7],
          [-11, -7],
        ]),
        br,
        { d: 2, lw: 1.2 },
      );
      K.paint(g, K.rrect(-6, -15, 12, 9, 2), C.shade(br, 0.1), { d: 1.5, lw: 1.1 });
      const r = 17;
      const gr = g.createRadialGradient(-5, -37, 2, 0, -32, r);
      gr.addColorStop(0, MT.E6DCFF);
      gr.addColorStop(0.45, MT.VALUE_8A6CE0);
      gr.addColorStop(1, MT.VALUE_2A2A72);
      K.paint(g, K.ell(0, -32, r, r), gr, { d: 0, lw: 1.3, glow: o.night ? MT.RGBA_150_120_255_0_9 : null, glowR: 20 });
      g.save();
      g.translate(0, -32);
      g.rotate(tt * 0.8);
      line(
        g,
        [
          [-9, 3],
          [-2, -9, 8, -2],
        ],
        MT.RGBA_255_255_255_0_45,
        1.6,
      );
      line(
        g,
        [
          [6, 6],
          [0, 10, -6, 4],
        ],
        MT.RGBA_200_230_255_0_4,
        1.3,
      );
      g.restore();
      K.paint(g, K.ell(-6, -39, 3.5, 2.2, -0.6), MT.RGBA_255_255_255_0_75, { d: 0, ink: false });
      for (const s of [-1, 0, 1])
        tube(
          g,
          [
            [s * 7, -15],
            [s * 13, -17, s * 12, -22],
          ],
          C.shade(br, 0.15),
          2.4,
        );
    },
    [MT.TAM_LINH, MT.BOI_TOAN, MT.PHA_LE],
    glowAt(0, -32, 100, MT.VALUE_9A7CFF, 0.45),
  );
  add(
    MT.TAROT_CARDS,
    MT.BAN_BOI_BAI_TAROT,
    MT.PROP,
    [84, 76],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_6A3F2A, o, 0.35);
      for (const s of [-1, 1])
        tube(
          g,
          [
            [0, -14],
            [s * 16, -10, s * 24, 0],
          ],
          C.shade(w, -0.1),
          3.2,
        );
      tube(
        g,
        [
          [0, -14],
          [1, -1],
        ],
        w,
        3.2,
      );
      K.paint(g, K.rrect(-3, -60, 6, 48, 2), w, { d: 1.5, lw: 1.1 });
      K.paint(g, K.ell(0, -30, 5, 3), C.shade(w, 0.1), { d: 1, lw: 1 });
      K.paint(g, K.ell(0, -59, 38, 10), C.shade(w, -0.2), { d: 0, lw: 1.2 });
      K.paint(g, K.ell(0, -62, 38, 10), w, { d: 2, lw: 1.2 });
      g.save();
      g.translate(0, -63);
      g.scale(1, 0.42);
      const back = nt(MT.VALUE_3A2A6A, o, 0.2);
      for (let i = 0; i < 5; i++) {
        g.save();
        g.translate(-4, 8);
        g.rotate(-0.7 + i * 0.32);
        g.translate(0, -14);
        K.paint(g, K.rrect(-6.5, -10, 13, 20, 1.5), back, { d: 0, lw: 1 });
        line(
          g,
          [
            [-4.5, -8],
            [4.5, -8],
            [4.5, 8],
            [-4.5, 8],
            [-4.5, -8],
          ],
          MT.D9B24A,
          0.7,
        );
        K.paint(g, K.ell(0, 0, 2, 2), MT.D9B24A, { d: 0, ink: false });
        g.restore();
      }
      g.save();
      g.translate(20, 6);
      g.rotate(0.35);
      K.paint(g, K.rrect(-7, -11, 14, 22, 1.5), nt(MT.EFE3C4, o, 0.25), { d: 0, lw: 1 });
      K.paint(g, K.ell(0, -1, 4, 4), MT.E8A22A, { d: 0, ink: false });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * PI * 2;
        line(
          g,
          [
            [Math.cos(a) * 5, -1 + Math.sin(a) * 5],
            [Math.cos(a) * 7, -1 + Math.sin(a) * 7],
          ],
          MT.E8A22A,
          0.9,
        );
      }
      g.restore();
      g.save();
      g.translate(-24, 4);
      g.rotate(-0.3);
      K.paint(g, K.rrect(-7, -11, 14, 22, 1.5), nt(MT.EFE3C4, o, 0.25), { d: 0, lw: 1 });
      K.paint(g, K.ell(0, -1, 4, 4), MT.VALUE_3A4A8A, { d: 0, ink: false });
      K.paint(g, K.ell(1.6, -2, 3.4, 3.4), nt(MT.EFE3C4, o, 0.25), { d: 0, ink: false });
      g.restore();
      g.restore();
    },
    [MT.TAM_LINH, MT.BOI_TOAN, MT.BAI],
  );
  const chainAlong = (g, f, n, col, size) => {
    for (let i = 0; i < n; i++) {
      const u0 = i / n,
        u1 = (i + 1) / n;
      const a = f(u0),
        b = f(u1);
      const mx = (a[0] + b[0]) / 2,
        my = (a[1] + b[1]) / 2;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (i % 2 === 0) ringS(g, mx, my, L * 0.62, size, ang, col, 1.8);
      else {
        g.save();
        g.translate(mx, my);
        g.rotate(ang);
        K.paint(g, K.rrect(-L * 0.62, -1.1, L * 1.24, 2.2, 1.1), C.shade(col, -0.15), { d: 0, lw: 0.9 });
        g.restore();
      }
    }
  };
  add(
    MT.CHAINS,
    MT.XICH_SAT_TREO,
    MT.INTERIOR,
    [70, 152],
    (g, o) => {
      const m = nt(o.color || MT.VALUE_6E6F76, o, 0.3);
      const sw = Math.sin(tm(o) * 1.2) * 2;
      K.paint(g, K.rrect(-30, -152, 60, 9, 2), C.shade(m, -0.2), { d: 2, lw: 1.2 });
      for (const x of [-24, 0, 24]) K.paint(g, K.ell(x, -147.5, 1.8, 1.8), C.shade(m, 0.2), { d: 0, lw: 0.8 });
      chainAlong(g, (u) => [-16 + (16 + 16) * u, -138 + Math.sin(u * PI) * 26], 8, C.shade(m, -0.05), 2.2);
      for (const [x, len, ph] of [
        [-16, 104, 0],
        [16, 120, 1.7],
      ]) {
        const s = sw * Math.cos(ph);
        chainAlong(g, (u) => [x + s * u * u, -143 + len * u], Math.round(len / 7.5), m, 2.4);
        const bx = x + s,
          byy = -143 + len + 6;
        ringS(g, bx, byy, 9, 5, 0, C.shade(m, -0.1), 3.4);
        K.paint(g, K.rrect(bx - 3, byy + 2, 6, 5, 1), C.shade(m, -0.25), { d: 0, lw: 0.9 });
        line(
          g,
          [
            [bx - 7, byy - 2],
            [bx - 2, byy - 4.5],
          ],
          MT.RGBA_255_255_255_0_35,
          1,
        );
      }
    },
    [MT.KINH_DI, MT.XICH, MT.NGUC],
  );
  add(
    MT.MUSIC_BOX,
    MT.HOP_NHAC,
    MT.PROP,
    [56, 54],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_7A3F2A, o, 0.35);
      const gold = nt(MT.D4AC4A, o, 0.3);
      K.paint(
        g,
        K.poly([
          [-20, -26],
          [20, -26],
          [22, -50],
          [-22, -50],
        ]),
        w,
        { d: 2, lw: 1.2 },
      );
      K.paint(
        g,
        K.poly([
          [-16, -29],
          [16, -29],
          [17.5, -46],
          [-17.5, -46],
        ]),
        o.night ? MT.VALUE_5C7480 : MT.BCD0D8,
        { d: 0, lw: 1 },
      );
      line(
        g,
        [
          [-10, -32],
          [-4, -43],
        ],
        MT.RGBA_255_255_255_0_5,
        2,
      );
      K.paint(
        g,
        K.poly([
          [-22, -20],
          [22, -20],
          [19, -27],
          [-19, -27],
        ]),
        nt(MT.VALUE_8A1F30, o, 0.25),
        { d: 1, lw: 1.1 },
      );
      tube(
        g,
        [
          [24, -11],
          [29, -11],
        ],
        gold,
        1.6,
      );
      K.paint(
        g,
        K.poly(
          [
            [29, -11],
            [32, -16],
            [34, -11],
            [32, -6],
          ],
          true,
        ),
        gold,
        { d: 0, lw: 0.9 },
      );
      K.paint(g, K.rrect(-23, -21, 46, 21, 2), w, { d: 2.5, lw: 1.2 });
      line(
        g,
        [
          [-20, -18],
          [20, -18],
          [20, -3],
          [-20, -3],
          [-20, -18],
        ],
        gold,
        0.9,
      );
      K.paint(g, K.ell(0, -11, 2, 2.4), MT.VALUE_2A1A12, { d: 0, ink: false });
      for (const x of [-18, 18]) K.paint(g, K.rrect(x - 3, -2, 6, 3, 1), gold, { d: 0, lw: 0.9 });
      g.save();
      g.translate(0, -24);
      const sp = Math.cos(tm(o) * 3);
      g.scale(0.55 + 0.45 * Math.abs(sp), 1);
      line(
        g,
        [
          [0, 0],
          [0, -3],
        ],
        gold,
        1,
      );
      line(
        g,
        [
          [0, -3],
          [0, -9],
        ],
        MT.F2E2D6,
        1.3,
      );
      line(
        g,
        [
          [0, -8],
          [3, -12],
        ],
        MT.F2E2D6,
        1,
      );
      K.paint(g, K.ell(0, -9, 5, 1.8), MT.F3B8C8, { d: 0, lw: 0.8 });
      K.paint(g, K.rrect(-1.3, -14, 2.6, 5, 1), MT.F3B8C8, { d: 0, lw: 0.7 });
      line(
        g,
        [
          [-1, -13],
          [-3, -17, 0, -19],
        ],
        MT.F2E2D6,
        0.9,
      );
      line(
        g,
        [
          [1, -13],
          [3, -17, 0, -19],
        ],
        MT.F2E2D6,
        0.9,
      );
      K.paint(g, K.ell(0, -16, 1.6, 1.6), MT.F2E2D6, { d: 0, lw: 0.7 });
      g.restore();
    },
    [MT.KINH_DI, MT.HOP_NHAC_2, MT.CO_3],
  );
  add(
    MT.PORTRAIT_CREEPY,
    MT.CHAN_DUNG_MA_QUAI,
    MT.INTERIOR,
    [92, 122],
    (g, o) => {
      const gold = nt(o.color || MT.A8823A, o, 0.4);
      K.paint(g, K.rrect(-44, -120, 88, 116, 3), gold, { d: 4, lw: 1.4 });
      K.paint(g, K.rect(-37, -113, 74, 102), C.shade(gold, -0.3), { d: 2, lw: 1.1 });
      const cv = K.rect(-33, -109, 66, 94);
      const gr = g.createLinearGradient(0, -109, 0, -15);
      gr.addColorStop(0, o.night ? MT.VALUE_2A2018 : MT.VALUE_4A3628);
      gr.addColorStop(1, MT.VALUE_16110D);
      K.paint(g, cv, gr, { d: 0, lw: 1 });
      g.save();
      g.clip(cv);
      K.glowDisc(g, 0, -76, 36, MT.C8A878, 0.18);
      const coat = MT.VALUE_221D1A;
      K.paint(
        g,
        K.poly(
          [
            [-30, -14],
            [-28, -40],
            [-12, -52],
            [12, -52],
            [28, -40],
            [30, -14],
          ],
          true,
        ),
        coat,
        { d: 0, lw: 1 },
      );
      K.paint(
        g,
        K.poly([
          [-6, -52],
          [6, -52],
          [0, -38],
        ]),
        MT.D8CFC0,
        { d: 0, ink: false },
      );
      const hair = MT.VALUE_2E2620;
      K.paint(g, K.ell(0, -80, 16, 19), hair, { d: 0, lw: 1 });
      K.paint(g, K.rrect(-5, -60, 10, 8, 3), nt(MT.C9B896, o, 0.3), { d: 0, ink: false });
      K.paint(g, K.ell(0, -72, 11.5, 14.5), nt(MT.D4C4A2, o, 0.3), { d: 2, lw: 1 });
      K.paint(g, K.ell(0, -90, 13, 6), hair, { d: 0, ink: false });
      K.paint(g, K.ell(0, -97, 7, 5), hair, { d: 0, lw: 0.9 });
      const px = Math.sin(tm(o) * 0.8) * 1.4;
      for (const s of [-1, 1]) {
        K.paint(g, K.ell(s * 4.6, -74, 2.8, 1.8), MT.E8E0CC, { d: 0, ink: false });
        K.paint(g, K.ell(s * 4.6 + px, -74, 1.2, 1.4), o.night ? MT.FF3A2A : MT.VALUE_1A1010, { d: 0, ink: false, glow: o.night ? MT.RGBA_255_60_40_1 : null, glowR: 6 });
        line(
          g,
          [
            [s * 7.5, -78],
            [s * 2, -77],
          ],
          MT.VALUE_3A2A20,
          0.9,
        );
      }
      line(
        g,
        [
          [-3, -64],
          [3, -64],
        ],
        MT.VALUE_6A4A3A,
        0.9,
      );
      line(
        g,
        [
          [0, -71],
          [-1, -68],
          [0.6, -67.5],
        ],
        MT.VALUE_8A7050,
        0.7,
      );
      for (let i = 0; i < 5; i++)
        line(
          g,
          [
            [-33 + hash(i) * 66, -109 + hash(i + 9) * 90],
            [-33 + hash(i + 2) * 66, -109 + hash(i + 4) * 90],
          ],
          MT.RGBA_255_240_210_0_07,
          0.8,
        );
      g.restore();
      for (const [x, y] of [
        [-40, -116],
        [40, -116],
        [-40, -8],
        [40, -8],
      ])
        K.paint(g, K.ell(x, y, 5, 5), C.shade(gold, 0.15), { d: 1, lw: 1 });
      K.paint(g, K.rrect(-12, -14, 24, 6, 1.5), C.shade(gold, 0.2), { d: 0, lw: 0.9 });
    },
    [MT.KINH_DI, MT.TRANH, MT.CHAN_DUNG],
  );
  add(
    MT.WHEELCHAIR_OLD,
    MT.XE_LAN_CO,
    MT.FURNITURE,
    [100, 106],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_7A5232, o, 0.35);
      const m = nt(MT.VALUE_4A4A4E, o, 0.3);
      tube(
        g,
        [
          [-28, -54],
          [-42, -100],
          [-52, -104],
        ],
        w,
        3.6,
      );
      const back = K.poly([
        [-30, -56],
        [-18, -56],
        [-30, -98],
        [-42, -98],
      ]);
      K.paint(g, back, nt(MT.D8B880, o, 0.35), { d: 1.5, lw: 1.1 });
      g.save();
      g.clip(back);
      for (let i = -6; i < 8; i++) {
        line(
          g,
          [
            [-48 + i * 4, -100],
            [-24 + i * 4, -54],
          ],
          MT.RGBA_120_80_40_0_45,
          0.7,
        );
        line(
          g,
          [
            [-14 + i * 4, -100],
            [-44 + i * 4, -54],
          ],
          MT.RGBA_120_80_40_0_45,
          0.7,
        );
      }
      g.restore();
      tube(
        g,
        [
          [-18, -56],
          [-30, -100],
        ],
        w,
        3.2,
      );
      const wx = -10,
        wy = -33,
        R = 32;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        line(
          g,
          [
            [wx, wy],
            [wx + Math.cos(a) * R, wy + Math.sin(a) * R],
          ],
          C.shade(w, -0.2),
          1.4,
        );
      }
      ringS(g, wx, wy, R, R, 0, w, 3.4);
      ringS(g, wx, wy, R + 2, R + 2, 0, m, 1.6);
      ringS(g, wx, wy, R - 4, R - 4, 0, m, 1.2);
      K.paint(g, K.ell(wx, wy, 4, 4), m, { d: 1, lw: 1 });
      K.paint(g, K.rrect(-26, -60, 54, 7, 3), w, { d: 2, lw: 1.2 });
      K.paint(g, K.rrect(-24, -64, 46, 5, 2.5), nt(MT.VALUE_8A3A30, o, 0.35), { d: 1, lw: 1 });
      tube(
        g,
        [
          [-28, -76],
          [16, -76],
          [20, -58],
        ],
        w,
        3.4,
      );
      tube(
        g,
        [
          [22, -54],
          [34, -24],
        ],
        m,
        2.4,
      );
      tube(
        g,
        [
          [30, -22],
          [44, -22],
        ],
        m,
        3,
      );
      tube(
        g,
        [
          [18, -54],
          [36, -14],
        ],
        m,
        2,
      );
      ringS(g, 37, -8, 7.5, 7.5, 0, m, 2.6);
      K.paint(g, K.ell(37, -8, 2, 2), m, { d: 0, lw: 0.8 });
    },
    [MT.KINH_DI, MT.XE_LAN, MT.BENH_VIEN_2],
  );
  add(
    MT.GURNEY,
    MT.BANG_CA_BENH_VIEN_CU,
    MT.FURNITURE,
    [184, 98],
    (g, o) => {
      const m = nt(o.color || MT.VALUE_8A9096, o, 0.3);
      const dk = C.shade(m, -0.25);
      for (const x of [-70, 70]) {
        tube(
          g,
          [
            [x, -62],
            [x, -14],
          ],
          m,
          3,
        );
        tube(
          g,
          [
            [x, -14],
            [x + 3, -10],
          ],
          dk,
          2,
        );
        ringS(g, x + 3, -6, 5.5, 5.5, 0, MT.VALUE_2A2A2E, 2.6);
      }
      tube(
        g,
        [
          [-70, -26],
          [70, -26],
        ],
        m,
        2.6,
      );
      tube(
        g,
        [
          [-70, -58],
          [70, -28],
        ],
        dk,
        1.6,
      );
      tube(
        g,
        [
          [70, -58],
          [-70, -28],
        ],
        dk,
        1.6,
      );
      K.paint(g, K.rrect(-86, -66, 172, 6, 2), m, { d: 1.5, lw: 1.2 });
      K.paint(g, K.rrect(-84, -74, 168, 9, 4), nt(MT.VALUE_6F8A86, o, 0.3), { d: 2, lw: 1.1 });
      const sh = nt(MT.E9ECE6, o, 0.4);
      const p = P();
      p.moveTo(-90, -68);
      p.bezierCurveTo(-88, -80, -78, -94, -64, -93);
      p.bezierCurveTo(-52, -92, -52, -84, -44, -84);
      p.bezierCurveTo(-30, -88, -10, -88, 4, -82);
      p.bezierCurveTo(20, -80, 30, -88, 44, -87);
      p.bezierCurveTo(56, -86, 62, -96, 70, -94);
      p.bezierCurveTo(82, -92, 88, -80, 90, -68);
      p.lineTo(92, -42);
      p.quadraticCurveTo(78, -38, 66, -44);
      p.quadraticCurveTo(50, -38, 36, -45);
      p.quadraticCurveTo(18, -38, 0, -44);
      p.quadraticCurveTo(-18, -38, -36, -45);
      p.quadraticCurveTo(-54, -38, -70, -44);
      p.quadraticCurveTo(-82, -38, -92, -42);
      p.closePath();
      K.paint(g, p, sh, { d: 4, lw: 1.3 });
      const fold = C.shade(sh, -0.18);
      for (const [x0, x1] of [
        [-60, -66],
        [-30, -34],
        [10, 12],
        [48, 52],
      ])
        line(
          g,
          [
            [x0, -80],
            [x1 - 4, -60, x1, -46],
          ],
          fold,
          1,
        );
      K.paint(g, K.ell(18, -70, 6, 3), MT.RGBA_150_90_60_0_25, { d: 0, ink: false });
      line(
        g,
        [
          [84, -74],
          [90, -66],
          [96, -60],
        ],
        MT.A89070,
        0.8,
      );
      K.paint(g, K.rrect(93, -61, 7, 10, 1.5), nt(MT.E8D8A8, o, 0.3), { d: 0, lw: 0.8 });
    },
    [MT.KINH_DI, MT.BENH_VIEN_2, MT.NHA_XAC],
  );
  add(
    MT.RITUAL_CANDLES,
    MT.VONG_NEN_NGHI_LE,
    MT.PROP,
    [184, 66],
    (g, o) => {
      const cy = -26;
      if (o.night) {
        g.save();
        g.translate(0, cy);
        g.scale(1, 0.3);
        K.glowDisc(g, 0, 0, 120, MT.FF9A40, 0.35);
        g.restore();
      }
      const chalk = o.night ? MT.RGBA_235_225_255_0_85 : MT.RGBA_250_248_240_0_9;
      const st = (p, w) => {
        g.save();
        g.strokeStyle = chalk;
        g.lineWidth = w;
        g.stroke(p);
        g.restore();
      };
      st(K.ell(0, cy, 82, 22), 1.8);
      st(K.ell(0, cy, 70, 18.5), 1.1);
      const sp = P();
      for (let k = 0; k <= 5; k++) {
        const a = -PI / 2 + ((k * 2) % 5) * ((PI * 2) / 5);
        const x = Math.cos(a) * 70,
          y = cy + Math.sin(a) * 18.5;
        if (k === 0) sp.moveTo(x, y);
        else sp.lineTo(x, y);
      }
      st(sp, 1.1);
      const list = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2 + 0.2;
        list.push([Math.cos(a) * 82, cy + Math.sin(a) * 22, i]);
      }
      list.sort((a, b) => a[1] - b[1]);
      for (const [x, y, i] of list) {
        const h = 10 + hash(i + 1) * 12;
        const col = i % 3 === 0 ? nt(MT.VALUE_7A1C22, o, 0.15) : nt(MT.E9E0C8, o, 0.15);
        candle(g, x, y + 2, 6, h, col, o, i * 0.7);
      }
    },
    [MT.KINH_DI, MT.NEN_3, MT.NGHI_LE, MT.TAM_LINH],
    glowAt(0, -34, 170, MT.FFB050, 0.35),
  );
  add(
    MT.INCENSE_ALTAR,
    MT.BAN_THO_GIA_TIEN,
    MT.FURNITURE,
    [176, 168],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_6A2A1E, o, 0.35);
      const gold = nt(MT.E2B23A, o, 0.3);
      for (const x of [-72, 63]) K.paint(g, K.rrect(x, -92, 9, 92, 2), C.shade(w, -0.1), { d: 2, lw: 1.2 });
      K.paint(g, K.rrect(-74, -14, 148, 5, 2), C.shade(w, -0.15), { d: 1, lw: 1 });
      K.paint(g, K.rrect(-80, -100, 160, 9, 2), w, { d: 2.5, lw: 1.3 });
      for (const s of [-1, 1])
        K.paint(
          g,
          K.poly(
            [
              [s * 76, -100],
              [s * 88, -104],
              [s * 90, -96],
              [s * 80, -92],
            ],
            true,
          ),
          w,
          { d: 1.5, lw: 1.1 },
        );
      const cl = P();
      cl.moveTo(-64, -91);
      cl.lineTo(64, -91);
      cl.lineTo(64, -28);
      for (let i = 0; i <= 8; i++) cl.lineTo(64 - i * 16, -28 + (i % 2 ? 4 : 0));
      cl.closePath();
      K.paint(g, cl, nt(MT.B8242A, o, 0.3), { d: 3, lw: 1.2 });
      line(
        g,
        [
          [-58, -85],
          [58, -85],
          [58, -34],
          [-58, -34],
          [-58, -85],
        ],
        gold,
        1.4,
      );
      ringS(g, 0, -60, 13, 13, 0, gold, 1.8);
      K.paint(g, K.ell(0, -60, 6, 6), gold, { d: 0, lw: 0.9 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * PI * 2 + PI / 4;
        K.paint(g, K.ell(Math.cos(a) * 9.5, -60 + Math.sin(a) * 9.5, 1.6, 1.6), gold, { d: 0, ink: false });
      }
      for (const s of [-1, 1]) {
        line(
          g,
          [
            [s * 24, -60],
            [s * 46, -60],
          ],
          gold,
          1.2,
        );
        K.paint(g, K.ell(s * 50, -60, 3, 3), gold, { d: 0, ink: false });
      }
      const brass = nt(MT.C9A24A, o, 0.3);
      for (const s of [-1, 1]) {
        const x = s * 64;
        K.paint(g, K.ell(x, -101.5, 7, 2.4), brass, { d: 0, lw: 1 });
        K.paint(g, K.rrect(x - 1.8, -116, 3.6, 15, 1.5), brass, { d: 1, lw: 1 });
        K.paint(g, K.ell(x, -116, 5.5, 1.8), brass, { d: 0, lw: 1 });
        candle(g, x, -117, 6, 18, nt(MT.C42A2A, o, 0.1), o, s);
      }
      const fx = -32;
      K.paint(g, K.rrect(fx - 4, -106, 8, 6, 1), brass, { d: 1, lw: 1 });
      K.paint(g, K.ell(fx, -107, 18, 3.5), brass, { d: 1, lw: 1.1 });
      K.paint(
        g,
        K.poly(
          [
            [fx - 4, -110],
            [fx + 4, -112],
            [fx + 14, -126],
            [fx + 10, -128],
            [fx + 2, -116],
          ],
          true,
        ),
        nt(MT.F2D040, o, 0.25),
        { d: 1, lw: 0.9 },
      );
      K.paint(
        g,
        K.poly(
          [
            [fx - 6, -110],
            [fx + 2, -113],
            [fx + 10, -131],
            [fx + 6, -132],
            [fx - 2, -117],
          ],
          true,
        ),
        nt(MT.F5D84A, o, 0.25),
        { d: 1, lw: 0.9 },
      );
      for (const [x, y, r, c] of [
        [fx - 10, -113, 6, MT.E8851E],
        [fx + 9, -113, 6, MT.E8851E],
        [fx - 1, -114, 6.5, MT.VALUE_8AB83A],
        [fx - 6, -122, 5.5, MT.E8851E],
        [fx + 5, -122, 5.5, MT.D23A2A],
        [fx, -129, 5, MT.E8851E],
      ])
        K.paint(g, K.ell(x, y, r, r), nt(c, o, 0.25), { d: 1.5, lw: 1 });
      const vx = 32;
      K.paint(
        g,
        K.poly(
          [
            [vx - 5, -100],
            [vx + 5, -100],
            [vx + 8, -110],
            [vx + 3, -118],
            [vx + 4, -122],
            [vx - 4, -122],
            [vx - 3, -118],
            [vx - 8, -110],
          ],
          true,
        ),
        nt(MT.VALUE_3A6AA8, o, 0.25),
        { d: 1.5, lw: 1 },
      );
      for (const [dx, dy] of [
        [-8, -134],
        [0, -140],
        [8, -134],
        [-3, -130],
        [5, -129],
      ]) {
        line(
          g,
          [
            [vx, -121],
            [vx + dx, dy],
          ],
          MT.VALUE_4A7A2A,
          1,
        );
        K.paint(g, K.ell(vx + dx, dy, 4, 3.6), nt(MT.F5C51E, o, 0.2), { d: 1, lw: 0.9 });
      }
      const bw = nt(MT.E8EEF2, o, 0.3);
      K.paint(
        g,
        K.poly(
          [
            [-11, -100],
            [11, -100],
            [17, -110],
            [16, -118],
            [-16, -118],
            [-17, -110],
          ],
          true,
        ),
        bw,
        { d: 2, lw: 1.2 },
      );
      K.paint(g, K.rect(-16, -112, 32, 4), nt(MT.VALUE_2F5AA8, o, 0.25), { d: 0, ink: false });
      K.paint(g, K.ell(0, -117, 15, 3.2), MT.VALUE_8A8580, { d: 0, lw: 1 });
      const tt = tm(o);
      for (const [x, tx, ty] of [
        [-3, -6, -150],
        [0, 0, -153],
        [3, 6, -150],
      ]) {
        line(
          g,
          [
            [x, -117],
            [tx, ty],
          ],
          MT.B8463A,
          1.1,
        );
        K.paint(g, K.ell(tx, ty, 1.2, 1.2), MT.FF7A2A, { d: 0, ink: false, glow: MT.RGBA_255_120_40_1, glowR: 6 });
        for (let k = 0; k < 5; k++) {
          const y0 = ty - k * 4,
            y1 = ty - (k + 1) * 4;
          const sx = (yy) => tx + Math.sin(yy * 0.25 + tt * 2 + tx) * (1 + k * 0.8);
          line(
            g,
            [
              [sx(y0), y0],
              [sx(y1), y1],
            ],
            C.rgba(o.night ? MT.C8D0E0 : MT.FFFFFF, 0.6 - k * 0.11),
            1.3,
          );
        }
      }
    },
    [MT.TAM_LINH, MT.BAN_THO, MT.VIET_NAM_2, MT.NHANG],
    (o) =>
      o.night
        ? [
            { type: MT.GLOW, x: -64, y: -142, r: 70, color: MT.FFC060, alpha: 0.35 },
            { type: MT.GLOW, x: 64, y: -142, r: 70, color: MT.FFC060, alpha: 0.35 },
          ]
        : [],
  );
  add(
    MT.WHITE_LANTERN,
    MT.DEN_LONG_TRANG_TANG_LE,
    MT.STREET,
    [70, 186],
    (g, o) => {
      const bam = nt(MT.B8A46A, o, 0.4);
      tube(
        g,
        [
          [-20, 0],
          [-20, -180],
        ],
        bam,
        4,
      );
      for (let i = 1; i < 6; i++)
        line(
          g,
          [
            [-22, -i * 30],
            [-18, -i * 30],
          ],
          C.shade(bam, -0.3),
          1.4,
        );
      tube(
        g,
        [
          [-20, -172],
          [16, -172],
        ],
        bam,
        3,
      );
      tube(
        g,
        [
          [-20, -150],
          [0, -172],
        ],
        bam,
        2,
      );
      const hx = 14,
        hy = -172;
      g.save();
      g.translate(hx, hy);
      g.rotate(Math.sin(tm(o) * 1.3) * 0.06);
      line(
        g,
        [
          [0, 0],
          [0, -2 + 14],
        ],
        MT.VALUE_3A3030,
        1,
      );
      const cy = 46;
      if (o.night) K.glowDisc(g, 0, cy, 70, MT.FFF0C8, 0.5);
      const body = K.ell(0, cy, 16, 27);
      K.paint(g, body, o.night ? MT.FFF8E6 : MT.F2F0EA, { d: o.night ? 0 : 3, lw: 1.2, glow: o.night ? MT.RGBA_255_240_200_0_9 : null, glowR: 24 });
      g.save();
      g.clip(body);
      for (let i = -3; i <= 3; i++) {
        const yy = cy + i * 7;
        line(
          g,
          [
            [-16, yy],
            [0, yy + 2.5, 16, yy],
          ],
          MT.RGBA_150_140_130_0_4,
          0.7,
        );
      }
      g.restore();
      const ink = MT.VALUE_2A2224;
      line(
        g,
        [
          [-5, cy - 7],
          [5, cy - 7],
        ],
        ink,
        1.6,
      );
      line(
        g,
        [
          [0, cy - 11],
          [0, cy + 9],
        ],
        ink,
        1.6,
      );
      line(
        g,
        [
          [-6, cy + 1],
          [-2, cy - 2],
        ],
        ink,
        1.4,
      );
      line(
        g,
        [
          [6, cy + 1],
          [2, cy - 2],
        ],
        ink,
        1.4,
      );
      line(
        g,
        [
          [-4, cy + 6],
          [4, cy + 6],
        ],
        ink,
        1.4,
      );
      K.paint(g, K.rrect(-8, 12, 16, 7, 2), MT.VALUE_2A2A2C, { d: 0, lw: 1 });
      K.paint(g, K.rrect(-8, cy + 24, 16, 6, 2), MT.VALUE_2A2A2C, { d: 0, lw: 1 });
      for (let i = -2; i <= 2; i++)
        line(
          g,
          [
            [i * 2.5, cy + 30],
            [i * 3, cy + 46],
          ],
          o.night ? MT.E8E4DC : MT.F4F2EC,
          1.6,
        );
      g.restore();
    },
    [MT.KINH_DI, MT.DEN_LONG, MT.TANG_LE, MT.VIET_NAM_2],
    glowAt(14, -126, 110, MT.FFF0C8, 0.4),
  );
  add(
    MT.FOG_BANK,
    MT.DAI_SUONG_MU,
    MT.FX,
    [900, 140],
    (g, o) => {
      const tt = tm(o);
      const col = o.night ? MT.C4D0E8 : MT.FFFFFF;
      const base = o.night ? 0.34 : 0.5;
      for (let i = 0; i < 11; i++) {
        const x = -450 + i * 90 + Math.sin(tt * 0.3 + i) * 12;
        const f = clamp((470 - Math.abs(x)) / 160, 0, 1);
        if (f <= 0) continue;
        g.save();
        g.translate(x, -16);
        g.scale(3.2, 1);
        K.glowDisc(g, 0, 0, 44, col, base * 0.75 * f);
        g.restore();
      }
      for (let i = 0; i < 16; i++) {
        const v = 6 + hash(i + 1) * 10;
        const x = ((((hash(i + 7) * 1100 + tt * v) % 1100) + 1100) % 1100) - 550;
        const y = -26 - hash(i + 3) * 70;
        const ry = 22 + hash(i + 5) * 26;
        const rx = 110 + hash(i + 11) * 120;
        const f = clamp((540 - Math.abs(x)) / 200, 0, 1);
        const a = (base * 0.8 + hash(i + 13) * 0.12) * f * (1 - (-y - 26) / 140);
        if (a <= 0.005) continue;
        g.save();
        g.translate(x, y);
        g.scale(rx / ry, 1);
        K.glowDisc(g, 0, 0, ry * 1.6, col, a);
        g.restore();
      }
    },
    [MT.KINH_DI, MT.SUONG_MU, MT.HIEU_UNG],
  );
  add(
    MT.GHOST_ORB,
    MT.DOM_SANG_MA,
    MT.FX,
    [90, 130],
    (g, o) => {
      const tt = tm(o);
      const col = o.color || MT.BFE8FF;
      for (let i = 0; i < 7; i++) {
        const x = -36 + hash(i + 2) * 72 + Math.cos(tt * 0.9 + i * 2) * 4;
        const y = -30 - hash(i + 5) * 90 + Math.sin(tt * 1.3 + i) * 6;
        const r = 2.2 + hash(i + 8) * 2.6;
        const pulse = 0.75 + 0.25 * Math.sin(tt * 2.2 + i * 1.7);
        K.glowDisc(g, x, y, r * 5, col, (o.night ? 0.7 : 0.5) * pulse);
        K.paint(g, K.ell(x, y, r, r), C.rgba(MT.FFFFFF, 0.9 * pulse), { d: 0, ink: false });
        g.save();
        g.strokeStyle = C.rgba(col, 0.5 * pulse);
        g.lineWidth = 0.8;
        g.stroke(K.ell(x, y, r * 2, r * 2));
        g.restore();
      }
    },
    [MT.KINH_DI, MT.MA, MT.ANH_SANG, MT.HIEU_UNG],
  );
  add(
    MT.EVIDENCE_BOARD,
    MT.BANG_MANH_MOI,
    MT.INTERIOR,
    [212, 150],
    (g, o) => {
      const w = nt(MT.VALUE_6A4A2E, o, 0.35);
      K.paint(g, K.rrect(-104, -148, 208, 136, 3), w, { d: 3, lw: 1.4 });
      const cork = nt(MT.C49A62, o, 0.35);
      K.paint(g, K.rect(-96, -140, 192, 120), cork, { d: 2, lw: 1.1 });
      for (let i = 0; i < 90; i++) K.paint(g, K.ell(-94 + hash(i) * 188, -138 + hash(i + 50) * 116, 0.8, 0.8), C.shade(cork, -0.25), { d: 0, ink: false });
      const paper = nt(MT.ECE4CC, o, 0.3);
      const card = (x, y, ww, hh, rot, col, fn) => {
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        K.paint(g, K.rect(-ww / 2, -hh / 2, ww, hh), col, { d: 1, lw: 1 });
        if (fn) fn(ww, hh);
        g.restore();
      };
      card(-58, -110, 64, 46, -0.03, paper, (ww, hh) => {
        line(
          g,
          [
            [-30, 8],
            [-10, -4, 6, 6],
            [30, -10],
          ],
          MT.VALUE_6AA0D0,
          2.2,
        );
        for (const [a, b, c, d] of [
          [-30, -14, 30, -2],
          [-14, -22, -6, 22],
          [12, -22, 18, 22],
        ])
          line(
            g,
            [
              [a, b],
              [c, d],
            ],
            MT.B8A888,
            0.9,
          );
        ringS(g, 10, 4, 6, 4, 0, MT.D22A2A, 1.2);
      });
      const photo = (x, y, rot, scene) =>
        card(x, y, 30, 36, rot, nt(MT.F6F4EE, o, 0.25), () => {
          K.paint(g, K.rect(-12, -15, 24, 24), nt(scene === 0 ? MT.VALUE_8A96A0 : MT.VALUE_7A9A7A, o, 0.25), { d: 0, ink: false });
          if (scene === 0) {
            K.paint(g, K.ell(0, -6, 4.5, 5), MT.VALUE_3A3A40, { d: 0, ink: false });
            K.paint(g, K.rrect(-9, 0, 18, 9, 4), MT.VALUE_3A3A40, { d: 0, ink: false });
          } else {
            K.paint(
              g,
              K.poly([
                [-8, 9],
                [-8, -2],
                [0, -9],
                [8, -2],
                [8, 9],
              ]),
              MT.VALUE_4A3A34,
              { d: 0, ink: false },
            );
            K.paint(g, K.rect(-2, 2, 4, 7), MT.E8D070, { d: 0, ink: false });
          }
        });
      photo(4, -112, 0.06, 0);
      photo(60, -108, -0.08, 0);
      photo(-30, -54, -0.1, 1);
      const note = (x, y, rot, col) =>
        card(x, y, 22, 22, rot, nt(col, o, 0.25), () => {
          for (let k = 0; k < 3; k++)
            line(
              g,
              [
                [-7, -5 + k * 5],
                [7 - k * 3, -5 + k * 5],
              ],
              MT.VALUE_5A5040,
              0.8,
            );
        });
      note(36, -60, 0.1, MT.F2D65A);
      note(80, -64, -0.12, MT.F2A6B8);
      note(-80, -48, 0.08, MT.VALUE_9AD0E8);
      card(4, -50, 34, 28, 0.04, paper, () => {
        for (let k = 0; k < 4; k++)
          line(
            g,
            [
              [-14, -9 + k * 6],
              [14 - (k % 2) * 6, -9 + k * 6],
            ],
            MT.VALUE_6A6050,
            0.9,
          );
      });
      const pins = [
        [-58, -128],
        [4, -126],
        [60, -122],
        [-30, -68],
        [36, -68],
        [80, -72],
        [4, -60],
        [-80, -56],
      ];
      const links = [
        [0, 1],
        [1, 2],
        [1, 6],
        [0, 3],
        [3, 6],
        [6, 4],
        [4, 5],
        [2, 5],
        [3, 7],
      ];
      for (const [a, b] of links) line(g, [pins[a], pins[b]], MT.D22A2A, 1.1);
      for (const [x, y] of pins) K.paint(g, K.ell(x, y, 2.4, 2.4), MT.E83A3A, { d: 0.8, lw: 0.8 });
    },
    [MT.BI_AN, MT.DIEU_TRA, MT.MANH_MOI, MT.THAM_TU],
  );
  add(
    MT.OLD_KEY,
    MT.CHIA_KHOA_CO,
    MT.PROP,
    [66, 22],
    (g, o) => {
      const b = nt(o.color || MT.A88A4A, o, 0.3);
      g.save();
      g.translate(0, -9);
      g.rotate(-0.04);
      K.paint(g, K.rrect(-16, -2.2, 42, 4.4, 2), b, { d: 1.5, lw: 1.1 });
      for (const x of [-14, -10]) K.paint(g, K.rrect(x, -3.4, 2.4, 6.8, 1), C.shade(b, 0.1), { d: 0, lw: 0.9 });
      K.paint(
        g,
        K.poly([
          [16, 1.5],
          [26, 1.5],
          [26, 9],
          [23.5, 9],
          [23.5, 5.5],
          [21, 5.5],
          [21, 8],
          [18.5, 8],
          [18.5, 4],
          [16, 4],
        ]),
        b,
        { d: 1, lw: 1.1 },
      );
      for (const [x, y] of [
        [-30, -6],
        [-30, 6],
        [-38, 0],
      ])
        K.paint(g, ringPath(x, y, 5, 2.2), b, { d: 1.5, lw: 1.1 });
      K.paint(g, ringPath(-26, 0, 7, 3.6), b, { d: 2, lw: 1.2 });
      line(
        g,
        [
          [-12, -1],
          [22, -1],
        ],
        MT.RGBA_255_240_200_0_55,
        1,
      );
      g.restore();
    },
    [MT.BI_AN, MT.CHIA_KHOA, MT.CO_3],
  );
  add(
    MT.WAX_LETTER,
    MT.THU_NIEM_PHONG_SAP,
    MT.PROP,
    [52, 26],
    (g, o) => {
      const pp = nt(o.color || MT.EFE3C4, o, 0.3);
      g.save();
      g.translate(0, -12);
      g.scale(1, 0.55);
      g.rotate(-0.1);
      K.paint(g, K.rect(-23, -15, 46, 30), pp, { d: 2, lw: 1.2 });
      line(
        g,
        [
          [-23, -15],
          [0, 4],
          [23, -15],
        ],
        C.shade(pp, -0.25),
        1,
      );
      line(
        g,
        [
          [-23, 15],
          [-5, 0],
        ],
        C.shade(pp, -0.18),
        0.8,
      );
      line(
        g,
        [
          [23, 15],
          [5, 0],
        ],
        C.shade(pp, -0.18),
        0.8,
      );
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        const r = 7 + (hash(i) - 0.5) * 2.4;
        pts.push([Math.cos(a) * r, 4 + Math.sin(a) * r]);
      }
      K.paint(g, K.poly(pts, true), nt(MT.B0202A, o, 0.2), { d: 1.5, lw: 1 });
      ringS(g, 0, 4, 4, 4, 0, MT.VALUE_801820, 0.9);
      line(
        g,
        [
          [-1.5, 6],
          [0, 1.5],
          [1.5, 6],
        ],
        MT.VALUE_801820,
        0.9,
      );
      g.restore();
    },
    [MT.BI_AN, MT.THU, MT.NIEM_PHONG],
  );
  add(
    MT.POCKET_WATCH,
    MT.DONG_HO_QUA_QUYT,
    MT.PROP,
    [62, 48],
    (g, o) => {
      const gold = nt(o.color || MT.D4A84A, o, 0.3);
      for (let i = 0; i < 14; i++) {
        const u = i / 14;
        const x = 4 + u * 26;
        const y = -38 + Math.pow(u, 0.5) * 36 + 0;
        ringS(g, x, Math.min(-1.2, y), 1.6, 1.1, 0, C.shade(gold, -0.05), 0.9);
      }
      K.paint(g, K.rrect(28, -3.5, 7, 2, 1), gold, { d: 0, lw: 0.8 });
      K.paint(g, K.ell(-11, -23, 14, 16, -0.25), C.shade(gold, -0.12), { d: 2, lw: 1.2 });
      K.paint(g, K.ell(-11, -23, 10.5, 12.5, -0.25), C.shade(gold, 0.08), { d: 0, lw: 0.8 });
      ringS(g, 4, -40, 3.4, 3.4, 0, gold, 1.6);
      K.paint(g, K.rrect(1.5, -38.5, 5, 4, 1.2), gold, { d: 0.5, lw: 0.9 });
      K.paint(g, K.ell(4, -18, 16, 16), gold, { d: 2.5, lw: 1.3 });
      K.paint(g, K.ell(4, -18, 12.5, 12.5), nt(MT.F6F0E0, o, 0.25), { d: 0, lw: 1 });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * PI * 2;
        const r1 = k % 3 ? 10.5 : 9.2;
        line(
          g,
          [
            [4 + Math.cos(a) * r1, -18 + Math.sin(a) * r1],
            [4 + Math.cos(a) * 11.6, -18 + Math.sin(a) * 11.6],
          ],
          MT.VALUE_3A3030,
          k % 3 ? 0.6 : 1,
        );
      }
      const tt = tm(o);
      const am = tt * 0.2 - PI / 2,
        ah = -PI / 2 + 2.2;
      line(
        g,
        [
          [4, -18],
          [4 + Math.cos(ah) * 6, -18 + Math.sin(ah) * 6],
        ],
        MT.VALUE_2A2020,
        1.3,
      );
      line(
        g,
        [
          [4, -18],
          [4 + Math.cos(am) * 9, -18 + Math.sin(am) * 9],
        ],
        MT.VALUE_2A2020,
        0.9,
      );
      K.paint(g, K.ell(4, -18, 1.1, 1.1), MT.VALUE_2A2020, { d: 0, ink: false });
      K.paint(g, K.ell(-1, -24, 3, 1.4, -0.7), MT.RGBA_255_255_255_0_6, { d: 0, ink: false });
    },
    [MT.BI_AN, MT.DONG_HO, MT.CO_3],
  );
  add(
    MT.FOOTPRINTS,
    MT.DAU_CHAN_BUN,
    MT.PROP,
    [200, 50],
    (g, o) => {
      const mud = nt(MT.VALUE_5A4130, o, 0.2);
      const n = 7;
      for (let k = n - 1; k >= 0; k--) {
        const u = k / (n - 1);
        const s = 1 - u * 0.4;
        const side = k % 2 ? 1 : -1;
        const x = -78 + u * 150 + side * 9 * s;
        const y = -8 - u * 34 + side * 3 * s;
        g.save();
        g.translate(x, y);
        g.scale(s * 2.2, s * 1.1);
        g.rotate(1.25 + side * 0.08);
        g.globalAlpha = 0.78;
        K.paint(g, K.ell(0, -4, 4.2, 5.4), mud, { d: 0, ink: false });
        K.paint(g, K.ell(0, 6.2, 3.4, 3.2), mud, { d: 0, ink: false });
        K.paint(g, K.ell(0.6, -4.5, 2.2, 3), C.shade(mud, -0.25), { d: 0, ink: false });
        g.globalAlpha = 0.5;
        for (let j = 0; j < 3; j++) K.paint(g, K.ell((hash(k * 7 + j) - 0.5) * 16, (hash(k * 3 + j + 9) - 0.5) * 18, 0.8, 0.8), mud, { d: 0, ink: false });
        g.restore();
      }
    },
    [MT.BI_AN, MT.DAU_CHAN, MT.DIEU_TRA],
  );
  add(
    MT.POLAROID_PHOTOS,
    MT.ANH_POLAROID_ROI_VAI,
    MT.PROP,
    [120, 34],
    (g, o) => {
      const list = [
        [-30, -24, 0.4, 2],
        [26, -22, -0.3, 3],
        [-8, -16, -0.15, 0],
        [36, -10, 0.25, 1],
        [-40, -8, -0.5, 4],
      ];
      const skies = [MT.VALUE_8AB4D8, MT.VALUE_7A9A7A, MT.C8A07A, MT.VALUE_3A4A6A, MT.VALUE_9AA4AE];
      for (const [x, y, r, sc] of list) {
        g.save();
        g.translate(x, y);
        g.scale(1, 0.45);
        g.rotate(r);
        K.paint(g, K.rrect(-13, -15, 26, 31, 1), nt(MT.F6F4EE, o, 0.3), { d: 1, lw: 1 });
        const pic = K.rect(-11, -13, 22, 21);
        K.paint(g, pic, nt(skies[sc], o, 0.3), { d: 0, ink: false });
        g.save();
        g.clip(pic);
        if (sc === 0) {
          K.paint(g, K.ell(0, -4, 4, 4.5), MT.VALUE_2E2E34, { d: 0, ink: false });
          K.paint(g, K.rrect(-8, 1, 16, 10, 4), MT.VALUE_2E2E34, { d: 0, ink: false });
        } else if (sc === 1) {
          K.paint(g, K.rect(-11, 2, 22, 6), MT.VALUE_4A6A3A, { d: 0, ink: false });
          K.paint(g, K.ell(0, -4, 6, 7), MT.VALUE_2E4A2E, { d: 0, ink: false });
        } else if (sc === 2) {
          K.paint(
            g,
            K.poly([
              [-8, 8],
              [-8, -1],
              [0, -8],
              [8, -1],
              [8, 8],
            ]),
            MT.VALUE_5A3A30,
            { d: 0, ink: false },
          );
        } else if (sc === 3) {
          K.paint(g, K.ell(4, -6, 3.5, 3.5), MT.F2ECD0, { d: 0, ink: false });
          K.paint(g, K.rect(-11, 3, 22, 6), MT.VALUE_1E2430, { d: 0, ink: false });
        } else {
          K.paint(g, K.rrect(-9, -2, 18, 7, 2), MT.VALUE_5A2A2A, { d: 0, ink: false });
          K.paint(g, K.ell(-5, 5, 2.4, 2.4), MT.VALUE_1E1E1E, { d: 0, ink: false });
          K.paint(g, K.ell(5, 5, 2.4, 2.4), MT.VALUE_1E1E1E, { d: 0, ink: false });
        }
        g.restore();
        g.restore();
      }
    },
    [MT.BI_AN, MT.ANH, MT.DIEU_TRA],
  );
  add(
    MT.SECRET_BOOKCASE,
    MT.TU_SACH_CUA_BI_MAT,
    MT.FURNITURE,
    [150, 212],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_6A4428, o, 0.35);
      const dg = g.createLinearGradient(-60, 0, 60, 0);
      dg.addColorStop(0, MT.VALUE_0A0A10);
      dg.addColorStop(1, MT.VALUE_1A1620);
      K.paint(g, K.rect(-58, -200, 116, 200), dg, { d: 0, lw: 1.2 });
      g.save();
      g.clip(K.rect(-58, -200, 116, 200));
      K.glowDisc(g, 46, -60, 80, MT.FFA850, o.night ? 0.5 : 0.4);
      for (let i = 0; i < 4; i++) K.paint(g, K.rect(30 + i * 6, -10 - i * 12, 30, 3), C.rgba(MT.D0A070, 0.22 - i * 0.04), { d: 0, ink: false });
      g.restore();
      K.paint(g, K.rect(-64, -206, 8, 206), C.shade(w, -0.1), { d: 0, lw: 1.1 });
      K.paint(g, K.rect(56, -206, 8, 206), C.shade(w, -0.1), { d: 0, lw: 1.1 });
      K.paint(g, K.rect(-64, -210, 128, 6), C.shade(w, -0.05), { d: 0, lw: 1.1 });
      g.save();
      g.transform(0.76, 0, 0, 1, -60, 0);
      K.paint(g, K.rect(118, -204, 12, 204), C.shade(w, -0.3), { d: 0, lw: 1.3 });
      K.paint(g, K.rect(0, -204, 120, 204), w, { d: 3, lw: 1.5 });
      K.paint(g, K.rect(-2, -212, 124, 9), C.shade(w, 0.08), { d: 1.5, lw: 1.3 });
      const inner = C.shade(w, -0.45);
      const shelves = [-196, -150, -104, -58];
      const pal = [MT.VALUE_8A2A2A, MT.VALUE_2A4A6A, MT.VALUE_3A5A3A, MT.VALUE_8A6A2A, MT.VALUE_5A3A5A, MT.A84A2A, MT.VALUE_2A3A3A, MT.C8B070];
      let seed = 1;
      for (const sy of shelves) {
        K.paint(g, K.rect(8, sy, 104, 40), inner, { d: 0, ink: false });
        let x = 10;
        while (x < 104) {
          const bw = 6 + hash(seed) * 6,
            bh = 26 + hash(seed + 1) * 12;
          const col = nt(pal[Math.floor(hash(seed + 2) * pal.length)], o, 0.3);
          if (hash(seed + 3) > 0.9 && x < 96) {
            g.save();
            g.translate(x, sy + 40);
            g.rotate(0.25);
            K.paint(g, K.rect(0, -bh, bw, bh), col, { d: 1, lw: 1 });
            g.restore();
            x += bw + 8;
          } else {
            K.paint(g, K.rect(x, sy + 40 - bh, bw, bh), col, { d: 1, lw: 1 });
            line(
              g,
              [
                [x + 1.5, sy + 44 - bh],
                [x + bw - 1.5, sy + 44 - bh],
              ],
              MT.E8D090,
              0.8,
            );
            x += bw + 0.6;
          }
          seed += 4;
        }
        K.paint(g, K.rect(4, sy + 40, 112, 6), C.shade(w, 0.06), { d: 0, lw: 1.1 });
      }
      K.paint(g, K.rect(8, -12, 104, 10), C.shade(w, -0.12), { d: 0, lw: 1.1 });
      g.restore();
    },
    [MT.BI_AN, MT.TU_SACH, MT.LOI_DI_BI_MAT],
  );
  add(
    MT.GRAMOPHONE,
    MT.MAY_HAT_GRAMOPHONE,
    MT.PROP,
    [84, 100],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_7A4428, o, 0.35);
      const brass = nt(MT.D4A34A, o, 0.3);
      K.paint(g, K.rrect(-30, -6, 60, 6, 1.5), C.shade(w, -0.15), { d: 1, lw: 1.1 });
      K.paint(g, K.rrect(-27, -28, 54, 23, 2), w, { d: 3, lw: 1.3 });
      K.paint(g, K.rrect(-21, -23, 42, 13, 1.5), C.shade(w, -0.12), { d: 0, lw: 0.9 });
      tube(
        g,
        [
          [27, -18],
          [34, -18],
          [34, -10],
        ],
        brass,
        1.8,
      );
      K.paint(g, K.rrect(32, -11, 5, 5, 1.5), MT.VALUE_2A1A12, { d: 0, lw: 0.9 });
      K.paint(g, K.ell(-3, -29, 22, 4), MT.VALUE_2A2A2C, { d: 0, lw: 1.1 });
      K.paint(g, K.ell(-3, -30, 20, 3.4), MT.VALUE_1A1A1C, { d: 0, ink: false });
      K.paint(g, K.ell(-3, -30, 5, 1.2), MT.C83A2A, { d: 0, ink: false });
      tube(
        g,
        [
          [18, -28],
          [18, -40],
          [26, -42],
        ],
        brass,
        3,
      );
      tube(
        g,
        [
          [18, -32],
          [6, -31],
        ],
        brass,
        1.8,
      );
      K.paint(g, K.ell(6, -31, 2.4, 2.4), brass, { d: 0, lw: 0.9 });
      const M = [2, -76],
        rx = 30,
        ry = 18,
        rot = -0.5;
      const ca = Math.cos(rot),
        sa = Math.sin(rot);
      const A = [M[0] + ca * rx, M[1] + sa * rx],
        B = [M[0] - ca * rx, M[1] - sa * rx];
      const hp = P();
      hp.moveTo(24, -40);
      hp.quadraticCurveTo(12, -50, B[0], B[1]);
      hp.lineTo(A[0], A[1]);
      hp.quadraticCurveTo(30, -56, 28, -44);
      hp.closePath();
      hp.ellipse(M[0], M[1], rx, ry, rot, 0, PI * 2);
      K.paint(g, hp, brass, { d: 4, lw: 1.3 });
      for (const k of [-0.5, 0, 0.5]) {
        const ex = M[0] + ca * rx * k - sa * ry * 0.9,
          ey = M[1] + sa * rx * k + ca * ry * 0.9;
        line(
          g,
          [
            [26, -42],
            [M[0] + 8 + k * 8, -52, ex, ey],
          ],
          C.shade(brass, -0.25),
          0.8,
        );
      }
      const mg = g.createRadialGradient(M[0] + 6, M[1] + 4, 1, M[0], M[1], rx);
      mg.addColorStop(0, MT.VALUE_3A240E);
      mg.addColorStop(1, o.night ? MT.VALUE_8A6A32 : MT.B8873A);
      K.paint(g, K.ell(M[0], M[1], rx - 3, ry - 3, rot), mg, { d: 0, lw: 1 });
    },
    [MT.BI_AN, MT.CO_3, MT.AM_NHAC, MT.MAY_HAT],
  );
  add(
    MT.QUILL_INKWELL,
    MT.BUT_LONG_NGONG_VA_LO_MUC,
    MT.PROP,
    [44, 66],
    (g, o) => {
      const glass = nt(MT.VALUE_24304A, o, 0.2);
      K.paint(g, K.ell(14, -1.4, 7, 1.6), MT.RGBA_20_24_40_0_7, { d: 0, ink: false });
      const q = P();
      q.moveTo(3, -24);
      q.bezierCurveTo(-4, -36, 2, -54, 18, -64);
      q.bezierCurveTo(12, -52, 10, -40, 6, -30);
      q.closePath();
      const q2 = P();
      q2.moveTo(5, -28);
      q2.bezierCurveTo(12, -34, 20, -48, 18, -64);
      q2.bezierCurveTo(24, -48, 18, -34, 8, -24);
      q2.closePath();
      const fc = nt(MT.F2EAD8, o, 0.35);
      K.paint(g, q2, C.shade(fc, -0.08), { d: 1, lw: 1 });
      K.paint(g, q, fc, { d: 1.5, lw: 1.1 });
      line(
        g,
        [
          [0, -14],
          [8, -36, 18, -64],
        ],
        MT.B8A888,
        1,
      );
      for (let i = 0; i < 6; i++) {
        const u = 0.3 + i * 0.1;
        const x = 8 * u * 2 * (1 - u) + 18 * u * u,
          y = -14 * (1 - u) * (1 - u) - 36 * 2 * u * (1 - u) - 64 * u * u;
        line(
          g,
          [
            [x, y],
            [x - 5, y + 5],
          ],
          MT.RGBA_150_140_120_0_6,
          0.6,
        );
      }
      K.paint(
        g,
        K.poly(
          [
            [-12, 0],
            [12, 0],
            [13, -8],
            [8, -14],
            [5, -16],
            [-5, -16],
            [-8, -14],
            [-13, -8],
          ],
          true,
        ),
        glass,
        { d: 2.5, lw: 1.2 },
      );
      K.paint(g, K.rrect(-5.5, -20, 11, 5, 1.5), C.shade(glass, 0.15), { d: 1, lw: 1 });
      K.paint(g, K.ell(0, -20, 5.5, 1.5), MT.VALUE_0A0A14, { d: 0, ink: false });
      line(
        g,
        [
          [-8, -10],
          [-6, -4],
        ],
        MT.RGBA_255_255_255_0_45,
        1.6,
      );
    },
    [MT.BI_AN, MT.BUT, MT.MUC, MT.CO_3],
  );
  add(
    MT.OLD_SAFE,
    MT.KET_SAT_CO,
    MT.FURNITURE,
    [96, 116],
    (g, o) => {
      const b = nt(o.color || MT.VALUE_2F3A36, o, 0.3);
      const gold = nt(MT.C9A24A, o, 0.3);
      for (const x of [-38, 30]) K.paint(g, K.rrect(x, -10, 8, 10, 2), MT.VALUE_1E2220, { d: 0, lw: 1 });
      K.paint(g, K.rrect(-44, -112, 88, 104, 5), b, { d: 4, lw: 1.5 });
      K.paint(g, K.rrect(-36, -104, 72, 86, 3), C.shade(b, 0.08), { d: 2, lw: 1.2 });
      line(
        g,
        [
          [-32, -100],
          [32, -100],
          [32, -22],
          [-32, -22],
          [-32, -100],
        ],
        gold,
        0.9,
      );
      for (const y of [-92, -32]) K.paint(g, K.rrect(-41, y - 6, 6, 12, 2), MT.VALUE_1A1E1C, { d: 0, lw: 1 });
      K.paint(g, K.ell(0, -70, 14, 14), gold, { d: 2, lw: 1.2 });
      K.paint(g, K.ell(0, -70, 10, 10), MT.VALUE_1E2422, { d: 0, lw: 1 });
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * PI * 2;
        line(
          g,
          [
            [Math.cos(a) * 11.5, -70 + Math.sin(a) * 11.5],
            [Math.cos(a) * 13.5, -70 + Math.sin(a) * 13.5],
          ],
          MT.VALUE_3A3020,
          0.7,
        );
      }
      K.paint(g, K.ell(0, -70, 4, 4), gold, { d: 1, lw: 1 });
      K.paint(
        g,
        K.poly([
          [-1, -81],
          [1, -81],
          [0, -77],
        ]),
        MT.F2E2A0,
        { d: 0, ink: false },
      );
      tube(
        g,
        [
          [16, -46],
          [26, -46],
        ],
        gold,
        3,
      );
      K.paint(g, K.ell(16, -46, 4, 4), gold, { d: 1, lw: 1 });
      K.paint(g, K.rrect(-16, -34, 32, 7, 2), gold, { d: 1, lw: 1 });
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        line(
          g,
          [
            [sx * 26, -61 + sy * 33],
            [sx * 20, -61 + sy * 38, sx * 16, -61 + sy * 33],
          ],
          gold,
          0.9,
        );
    },
    [MT.BI_AN, MT.KET_SAT, MT.KHO_BAU],
  );
  add(
    MT.SARCOPHAGUS,
    MT.QUAN_TAI_AI_CAP,
    MT.PROP,
    [84, 200],
    (g, o) => {
      const gold = nt(o.color || MT.D6A636, o, 0.3);
      const blue = nt(MT.VALUE_2A4A9A, o, 0.25);
      const red = nt(MT.B83A2A, o, 0.25);
      const tq = nt(MT.VALUE_3AA0A0, o, 0.25);
      K.paint(g, K.rrect(-32, -8, 64, 8, 2), nt(MT.VALUE_8A7A62, o, 0.3), { d: 1.5, lw: 1.2 });
      const body = K.poly(
        sym([
          [0, -194],
          [14, -191],
          [24, -180],
          [28, -164],
          [34, -140],
          [36, -126],
          [33, -100],
          [29, -60],
          [24, -24],
          [26, -14],
          [24, -8],
        ]),
        true,
      );
      K.paint(g, body, gold, { d: 5, lw: 1.5 });
      g.save();
      g.clip(body);
      const nem = K.poly(
        sym([
          [0, -193],
          [16, -188],
          [26, -170],
          [32, -140],
          [20, -136],
          [14, -160],
        ]),
        true,
      );
      K.paint(g, nem, blue, { d: 0, ink: false });
      g.save();
      g.clip(nem);
      for (let i = 0; i < 9; i++) K.paint(g, K.rect(-40, -194 + i * 7, 80, 3), gold, { d: 0, ink: false });
      g.restore();
      for (let k = 0; k < 4; k++) {
        const r = 30 - k * 5;
        g.save();
        g.strokeStyle = [blue, red, tq, gold][k];
        g.lineWidth = 4.2;
        g.beginPath();
        g.arc(0, -150, r, 0.15 * PI, 0.85 * PI);
        g.stroke();
        g.restore();
      }
      for (let i = 0; i < 6; i++) {
        const y = -92 + i * 10;
        K.paint(g, K.rect(-40, y, 80, 4), i % 2 ? blue : tq, { d: 0, ink: false });
      }
      K.paint(g, K.rect(-5, -94, 10, 82), gold, { d: 0, ink: false });
      for (let i = 0; i < 9; i++) {
        const y = -90 + i * 8.5;
        const kind = i % 3;
        if (kind === 0) K.paint(g, K.ell(0, y, 2.2, 2.2), MT.VALUE_2A2A2A, { d: 0, ink: false });
        else if (kind === 1)
          line(
            g,
            [
              [-2.5, y - 2],
              [2.5, y + 2],
            ],
            MT.VALUE_2A2A2A,
            1,
          );
        else
          K.paint(
            g,
            K.poly([
              [-2.5, y + 2],
              [2.5, y + 2],
              [0, y - 2.5],
            ]),
            MT.VALUE_2A2A2A,
            { d: 0, ink: false },
          );
      }
      g.restore();
      K.paint(g, K.ell(0, -164, 11.5, 14), nt(MT.E2B44A, o, 0.3), { d: 2.5, lw: 1.2 });
      for (const s of [-1, 1]) {
        K.paint(g, K.ell(s * 4.5, -167, 2.6, 1.5), MT.F4ECD8, { d: 0, ink: false });
        K.paint(g, K.ell(s * 4.5, -167, 1.1, 1.3), MT.VALUE_1A1A1A, { d: 0, ink: false });
        line(
          g,
          [
            [s * 1.5, -168.5],
            [s * 8.5, -168],
            [s * 10, -166],
          ],
          MT.VALUE_1A1A1A,
          0.9,
        );
      }
      K.paint(g, K.rrect(-3, -151, 6, 10, 2), blue, { d: 0, lw: 1 });
      for (const s of [-1, 1]) {
        tube(
          g,
          [
            [s * 24, -134],
            [s * 6, -112],
          ],
          gold,
          6,
        );
        K.paint(g, K.ell(s * 6, -112, 3.6, 3.6), nt(MT.E2B44A, o, 0.3), { d: 1, lw: 1 });
      }
      tube(
        g,
        [
          [-4, -108],
          [-14, -134],
          [-11, -140],
          [-7, -137],
        ],
        blue,
        2.2,
      );
      tube(
        g,
        [
          [4, -108],
          [14, -136],
        ],
        gold,
        2,
      );
      for (let i = 0; i < 3; i++)
        line(
          g,
          [
            [14, -136],
            [18 + i * 2, -128 + i],
          ],
          blue,
          1.5,
        );
    },
    [MT.LICH_SU, MT.AI_CAP_2, MT.XAC_UOP_2, MT.CO_DAI],
  );
  add(
    MT.AMPHORA,
    MT.BINH_GOM_HY_LAP,
    MT.PROP,
    [44, 78],
    (g, o) => {
      const tc = nt(o.color || MT.C4683A, o, 0.3);
      const bk = MT.VALUE_2A1C18;
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 5, -66],
            [s * 18, -68, s * 15, -54],
          ],
          tc,
          2.6,
        );
      const body = K.poly(
        sym([
          [0, -73],
          [6, -73],
          [5, -62],
          [17, -54],
          [20, -42],
          [15, -22],
          [8, -10],
          [6, -6],
          [9, -1],
          [0, -1],
        ]),
        true,
      );
      K.paint(g, body, tc, { d: 3, lw: 1.3 });
      g.save();
      g.clip(body);
      K.paint(g, K.rect(-30, -48, 60, 15), bk, { d: 0, ink: false });
      for (const x of [-10, 4]) {
        K.paint(g, K.ell(x, -44, 1.8, 1.8), tc, { d: 0, ink: false });
        line(
          g,
          [
            [x, -42.5],
            [x + 1, -39],
            [x - 2, -35],
          ],
          tc,
          1.6,
        );
        line(
          g,
          [
            [x + 1, -39],
            [x + 4, -36],
          ],
          tc,
          1.4,
        );
        line(
          g,
          [
            [x - 3, -41],
            [x + 4, -40],
          ],
          tc,
          1.2,
        );
      }
      for (let i = 0; i < 9; i++) {
        const x = -18 + i * 4.5;
        line(
          g,
          [
            [x, -31],
            [x, -28],
            [x + 3, -28],
          ],
          bk,
          1,
        );
      }
      K.paint(g, K.rect(-30, -26, 60, 2), bk, { d: 0, ink: false });
      K.paint(g, K.rect(-30, -60, 60, 2.2), bk, { d: 0, ink: false });
      g.restore();
      K.paint(g, K.ell(0, -73.5, 6.5, 1.8), MT.VALUE_3A2018, { d: 0, lw: 1 });
    },
    [MT.LICH_SU, MT.HY_LAP_2, MT.GOM, MT.CO_DAI],
  );
  add(
    MT.SCROLL,
    MT.CUON_GIAY_CO,
    MT.PROP,
    [80, 26],
    (g, o) => {
      const pp = nt(o.color || MT.E8D4A2, o, 0.3);
      const wd = nt(MT.VALUE_6A3F22, o, 0.3);
      K.paint(
        g,
        K.poly([
          [-34, -3],
          [22, -3],
          [16, -16],
          [-28, -16],
        ]),
        pp,
        { d: 1.5, lw: 1.1 },
      );
      for (let i = 0; i < 4; i++) {
        const y = -6 - i * 2.8;
        const k = (y + 3) / -13;
        line(
          g,
          [
            [-30 + k * 5, y],
            [12 - k * 5 - (i % 2) * 8, y],
          ],
          MT.RGBA_90_60_40_0_55,
          0.8,
        );
      }
      K.paint(
        g,
        K.poly([
          [-40, -1],
          [-32, -1],
          [-26, -18],
          [-32, -18],
        ]),
        C.shade(pp, -0.08),
        { d: 1, lw: 1 },
      );
      K.paint(
        g,
        K.poly(
          [
            [18, -1],
            [30, -1],
            [24, -19],
            [12, -19],
          ],
          true,
        ),
        C.shade(pp, -0.05),
        { d: 2, lw: 1.1 },
      );
      K.paint(g, K.ell(24, -1, 6, 3.4), C.shade(pp, 0.06), { d: 0, lw: 1 });
      ringS(g, 24, -1, 3, 1.6, 0, C.shade(pp, -0.3), 0.7);
      for (const [x, y] of [
        [24, 2],
        [18, -21],
      ])
        K.paint(g, K.ell(x, y, 2.6, 2), wd, { d: 0, lw: 0.9 });
      K.paint(g, K.ell(-36, 1, 2.2, 1.7), wd, { d: 0, lw: 0.9 });
      K.paint(g, K.ell(-29, -20, 2.2, 1.7), wd, { d: 0, lw: 0.9 });
      K.paint(g, K.ell(-6, -10, 3.4, 1.5), nt(MT.B0202A, o, 0.2), { d: 0, ink: false });
    },
    [MT.LICH_SU, MT.CUON_GIAY, MT.CO_3],
  );
  const sword = (g, x, tip, top, col, o) => {
    const st = nt(MT.C8D0D8, o, 0.3);
    K.paint(
      g,
      K.poly([
        [x - 2.2, top + 18],
        [x + 2.2, top + 18],
        [x + 2.2, tip - 6],
        [x, tip],
        [x - 2.2, tip - 6],
      ]),
      st,
      { d: 1, lw: 1 },
    );
    line(
      g,
      [
        [x, top + 20],
        [x, tip - 6],
      ],
      C.shade(st, -0.2),
      0.6,
    );
    K.paint(g, K.rrect(x - 9, top + 16, 18, 3.4, 1.5), nt(MT.C9A24A, o, 0.3), { d: 0.5, lw: 1 });
    K.paint(g, K.rrect(x - 1.8, top + 3, 3.6, 13, 1), col, { d: 0.5, lw: 1 });
    K.paint(g, K.ell(x, top + 2, 3, 3), nt(MT.C9A24A, o, 0.3), { d: 0.5, lw: 1 });
  };
  const spear = (g, x, top, o) => {
    tube(
      g,
      [
        [x, -2],
        [x, top + 16],
      ],
      nt(MT.VALUE_8A5A32, o, 0.3),
      2.6,
    );
    K.paint(
      g,
      K.poly(
        [
          [x, top],
          [x + 4, top + 10],
          [x + 1.5, top + 17],
          [x - 1.5, top + 17],
          [x - 4, top + 10],
        ],
        true,
      ),
      nt(MT.C8D0D8, o, 0.3),
      { d: 1, lw: 1 },
    );
    K.paint(g, K.rrect(x - 2.5, top + 16, 5, 4, 1), nt(MT.VALUE_6A6A70, o, 0.3), { d: 0, lw: 0.9 });
  };
  add(
    MT.SWORD_RACK,
    MT.GIA_BINH_KHI,
    MT.FURNITURE,
    [130, 166],
    (g, o) => {
      const w = nt(o.color || MT.VALUE_7A4E2E, o, 0.35);
      for (const x of [-56, 48]) K.paint(g, K.rrect(x, -104, 8, 104, 2), w, { d: 2, lw: 1.2 });
      K.paint(g, K.rrect(-62, -8, 124, 8, 2), C.shade(w, -0.1), { d: 1.5, lw: 1.2 });
      K.paint(g, K.rrect(-62, -102, 124, 7, 2), w, { d: 1.5, lw: 1.2 });
      spear(g, -40, -160, o);
      sword(g, -22, -8, -110, nt(MT.VALUE_5A2A1A, o, 0.3), o);
      spear(g, 22, -150, o);
      sword(g, 0, -8, -114, nt(MT.VALUE_2A2A4A, o, 0.3), o);
      sword(g, 38, -8, -106, nt(MT.VALUE_5A2A1A, o, 0.3), o);
      K.paint(g, K.rrect(-62, -58, 124, 6, 2), C.shade(w, 0.05), { d: 1.5, lw: 1.2 });
      for (const x of [-40, -22, 0, 22, 38]) K.paint(g, K.ell(x, -98.5, 3, 2), C.shade(w, -0.4), { d: 0, ink: false });
      const sh = nt(MT.VALUE_8A3A2A, o, 0.3);
      K.paint(g, K.ell(-40, -26, 20, 20), sh, { d: 3, lw: 1.3 });
      ringS(g, -40, -26, 17, 17, 0, nt(MT.C9A24A, o, 0.3), 1.6);
      K.paint(g, K.ell(-40, -26, 5, 5), nt(MT.C9A24A, o, 0.3), { d: 1, lw: 1 });
    },
    [MT.LICH_SU, MT.VU_KHI, MT.KIEM, MT.GIAO],
  );
  add(
    MT.ARMOR_STAND,
    MT.BO_GIAP_HIEP_SI,
    MT.FURNITURE,
    [80, 198],
    (g, o) => {
      const m = nt(o.color || MT.AAB3BD, o, 0.35);
      const dk = C.shade(m, -0.15);
      K.paint(g, K.rrect(-28, -8, 56, 8, 2), nt(MT.VALUE_6A4428, o, 0.35), { d: 1.5, lw: 1.2 });
      for (const s of [-1, 1]) {
        K.paint(g, K.rrect(s * 9 - 6, -98, 12, 36, 5), m, { d: 2, lw: 1.1 });
        K.paint(g, K.rrect(s * 9 - 5.5, -60, 11, 48, 5), m, { d: 2, lw: 1.1 });
        K.paint(g, K.ell(s * 9, -62, 6, 5), dk, { d: 1, lw: 1 });
        K.paint(
          g,
          K.poly(
            [
              [s * 9 - 6, -14],
              [s * 9 + 6, -14],
              [s * 9 + s * 12, -8],
              [s * 9 - s * 5, -8],
            ].map(([x, y]) => [x, y]),
            true,
          ),
          dk,
          { d: 1, lw: 1 },
        );
      }
      for (let i = 2; i >= 0; i--)
        K.paint(
          g,
          K.poly([
            [-19 - i * 1.5, -110 + i * 7],
            [19 + i * 1.5, -110 + i * 7],
            [20 + i * 1.5, -100 + i * 7],
            [-20 - i * 1.5, -100 + i * 7],
          ]),
          i % 2 ? dk : m,
          { d: 1, lw: 1 },
        );
      for (const s of [-1, 1]) {
        tube(
          g,
          [
            [s * 24, -140],
            [s * 28, -120],
          ],
          m,
          8,
        );
        K.paint(g, K.ell(s * 28, -118, 5, 5), dk, { d: 1, lw: 1 });
        tube(
          g,
          [
            [s * 28, -116],
            [s * 26, -98],
          ],
          m,
          7,
        );
        K.paint(g, K.rrect(s * 26 - 5, -98, 10, 12, 4), dk, { d: 1, lw: 1 });
      }
      const chest = K.poly(
        sym([
          [0, -150],
          [17, -150],
          [21, -136],
          [17, -118],
          [14, -110],
          [0, -108],
        ]),
        true,
      );
      K.paint(g, chest, m, { d: 4, lw: 1.3 });
      line(
        g,
        [
          [0, -148],
          [0, -112],
        ],
        dk,
        1,
      );
      line(
        g,
        [
          [-8, -140],
          [-4, -126],
        ],
        MT.RGBA_255_255_255_0_6,
        2,
      );
      for (const s of [-1, 1]) {
        K.paint(g, K.ell(s * 24, -144, 11, 8, s * 0.3), m, { d: 2, lw: 1.1 });
        K.paint(g, K.ell(s * 25, -139, 10, 6, s * 0.3), dk, { d: 1, lw: 1 });
      }
      K.paint(g, K.rrect(-9, -156, 18, 8, 3), dk, { d: 1, lw: 1 });
      K.paint(
        g,
        K.poly(
          [
            [-6, -184],
            [-4, -194],
            [4, -194],
            [6, -184],
          ],
          true,
        ),
        nt(MT.B82A2A, o, 0.3),
        { d: 1, lw: 1 },
      );
      K.paint(g, K.ell(0, -170, 12.5, 15), m, { d: 3, lw: 1.3 });
      K.paint(
        g,
        K.poly(
          [
            [-12, -172],
            [12, -172],
            [8, -158],
            [0, -155],
            [-8, -158],
          ],
          true,
        ),
        dk,
        { d: 1, lw: 1.1 },
      );
      for (const y of [-170, -166])
        line(
          g,
          [
            [-8, y],
            [8, y],
          ],
          MT.VALUE_1A1E24,
          1.2,
        );
      line(
        g,
        [
          [0, -184],
          [0, -173],
        ],
        dk,
        1,
      );
    },
    [MT.LICH_SU, MT.TRUNG_CO, MT.HIEP_SI_2, MT.GIAP],
  );
  add(
    MT.WAR_DRUM,
    MT.TRONG_TRAN,
    MT.PROP,
    [120, 124],
    (g, o) => {
      const w = nt(MT.VALUE_6A3A22, o, 0.35);
      const red = nt(o.color || MT.A8282A, o, 0.3);
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 50, 0],
            [s * 40, -86],
          ],
          w,
          5,
        );
      tube(
        g,
        [
          [-46, -28],
          [46, -28],
        ],
        w,
        3.5,
      );
      const cx = -4,
        cy = -72,
        R = 34;
      K.paint(g, K.ell(cx + 18, cy, R * 0.32, R), C.shade(red, -0.25), { d: 0, lw: 1.2 });
      K.paint(g, K.rect(cx, cy - R, 18, R * 2), red, { d: 0, ink: false });
      if (isLine())
        for (const yy of [cy - R, cy + R])
          line(
            g,
            [
              [cx, yy],
              [cx + 18, yy],
            ],
            INK,
            1.3,
          );
      for (let i = 0; i < 9; i++) {
        const a = -PI / 2 + (i / 8) * PI;
        K.paint(g, K.ell(cx + 4 + Math.cos(a) * R * 0.3, cy + Math.sin(a) * (R - 3), 1.3, 1.3), MT.E8C25A, { d: 0, ink: false });
      }
      K.paint(g, K.ell(cx, cy, R * 0.34, R), C.shade(red, 0.05), { d: 0, lw: 1.2 });
      g.save();
      g.translate(cx - 2, cy);
      K.paint(g, K.ell(0, 0, R - 1, R - 1), nt(MT.E8D6A8, o, 0.35), { d: 3, lw: 1.3 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * PI * 2;
        K.paint(g, K.ell(Math.cos(a) * (R - 3.5), Math.sin(a) * (R - 3.5), 1.5, 1.5), MT.C9A24A, { d: 0, ink: false });
      }
      ringS(g, 0, 0, 14, 14, 0, nt(MT.B8282A, o, 0.3), 2.4);
      K.paint(g, K.ell(0, 0, 5, 5), nt(MT.B8282A, o, 0.3), { d: 0, ink: false });
      g.restore();
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 40, -86],
            [s * 34, -78],
          ],
          w,
          4,
        );
      tube(
        g,
        [
          [26, -2],
          [44, -40],
        ],
        nt(MT.VALUE_8A5A32, o, 0.3),
        2.4,
      );
      K.paint(g, K.ell(44, -42, 4.5, 4.5), red, { d: 1, lw: 1 });
      tube(
        g,
        [
          [32, -2],
          [52, -36],
        ],
        nt(MT.VALUE_8A5A32, o, 0.3),
        2.4,
      );
      K.paint(g, K.ell(52, -38, 4.5, 4.5), red, { d: 1, lw: 1 });
    },
    [MT.LICH_SU, MT.TRONG, MT.CHIEN_TRANH],
  );
  add(
    MT.BRONZE_DRUM,
    MT.TRONG_DONG_DONG_SON,
    MT.PROP,
    [124, 80],
    (g, o) => {
      const br = nt(o.color || MT.VALUE_8A7340, o, 0.3);
      const top = nt(MT.B0924E, o, 0.3);
      const pat = C.shade(br, -0.35);
      const body = P();
      body.moveTo(-54, -66);
      body.bezierCurveTo(-62, -58, -58, -46, -46, -38);
      body.bezierCurveTo(-42, -26, -46, -10, -52, -2);
      body.quadraticCurveTo(0, 6, 52, -2);
      body.bezierCurveTo(46, -10, 42, -26, 46, -38);
      body.bezierCurveTo(58, -46, 62, -58, 54, -66);
      body.closePath();
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 55, -56],
            [s * 62, -50, s * 50, -40],
          ],
          br,
          3,
        );
      K.paint(g, body, br, { d: 5, lw: 1.4 });
      g.save();
      g.clip(body);
      for (const [y, k] of [
        [-58, 1],
        [-50, 1],
        [-38, 0.8],
        [-18, 0.82],
        [-10, 0.9],
      ])
        line(
          g,
          [
            [-60, y],
            [0, y + 6 * k, 60, y],
          ],
          pat,
          1,
        );
      for (let i = 0; i < 12; i++) K.paint(g, K.ell(-44 + i * 8, -52 + Math.sin((i / 11) * PI) * 3.5, 1.4, 1.4), pat, { d: 0, ink: false });
      for (let i = 0; i < 6; i++) K.paint(g, K.ell(-40 + hash(i + 4) * 80, -48 + hash(i + 9) * 40, 4 + hash(i) * 4, 2.5), MT.RGBA_80_140_120_0_35, { d: 0, ink: false });
      g.restore();
      const ry = 15;
      K.paint(g, K.ell(0, -66, 56, ry + 1.5), C.shade(br, -0.1), { d: 0, lw: 1.3 });
      K.paint(g, K.ell(0, -67, 54, ry), top, { d: 0, lw: 1.2 });
      const sr = ry / 54;
      for (const r of [48, 40, 30, 20, 11]) ringS(g, 0, -67, r, r * sr, 0, C.shade(top, -0.3), 0.7);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2;
        const x = Math.cos(a) * 35,
          y = -67 + Math.sin(a) * 35 * sr;
        line(
          g,
          [
            [x - 3, y - 0.6],
            [x, y],
            [x + 3, y - 0.6],
          ],
          C.shade(top, -0.4),
          0.9,
        );
      }
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * PI * 2;
        line(
          g,
          [
            [Math.cos(a) * 21.5, -67 + Math.sin(a) * 21.5 * sr],
            [Math.cos(a) * 28.5, -67 + Math.sin(a) * 28.5 * sr],
          ],
          C.shade(top, -0.25),
          0.6,
        );
      }
      const star = [];
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * PI * 2;
        const r = i % 2 ? 4 : 10.5;
        star.push([Math.cos(a) * r, -67 + Math.sin(a) * r * sr]);
      }
      K.paint(g, K.poly(star), nt(MT.ECD27A, o, 0.3), { d: 0, lw: 0.8, glow: o.night ? null : MT.RGBA_255_220_120_0_5, glowR: 6 });
    },
    [MT.LICH_SU, MT.VIET_NAM_2, MT.TRONG_DONG, MT.DONG_SON],
  );
  add(
    MT.STELE,
    MT.BIA_DA_TREN_RUA,
    MT.STREET,
    [104, 140],
    (g, o) => {
      const st = nt(o.color || MT.VALUE_8F9188, o, 0.35);
      const dk = C.shade(st, -0.15);
      K.paint(g, K.ell(46, -12, 9, 7, 0.2), st, { d: 1.5, lw: 1.2 });
      K.paint(g, K.rrect(32, -16, 14, 9, 4), st, { d: 1, lw: 1.1 });
      K.paint(g, K.ell(49, -14, 1.3, 1.3), MT.VALUE_2A2A2A, { d: 0, ink: false });
      for (const x of [-30, 22]) K.paint(g, K.rrect(x, -10, 14, 10, 4), dk, { d: 1, lw: 1.1 });
      K.paint(
        g,
        K.poly([
          [-44, -10],
          [-52, -6],
          [-44, -4],
        ]),
        dk,
        { d: 0, lw: 1 },
      );
      const shell = P();
      shell.moveTo(-44, -8);
      shell.bezierCurveTo(-44, -34, -20, -42, 0, -42);
      shell.bezierCurveTo(20, -42, 40, -34, 40, -8);
      shell.closePath();
      K.paint(g, shell, st, { d: 4, lw: 1.3 });
      g.save();
      g.clip(shell);
      for (let i = -3; i <= 3; i++)
        for (let j = 0; j < 3; j++) {
          const cx = i * 13 + (j % 2) * 6.5,
            cy = -14 - j * 10;
          const hx = [];
          for (let k = 0; k < 6; k++) hx.push([cx + Math.cos((k * PI) / 3) * 6, cy + Math.sin((k * PI) / 3) * 4.5]);
          hx.push(hx[0]);
          line(g, hx, dk, 0.9);
        }
      g.restore();
      K.paint(g, K.rrect(-46, -10, 88, 4, 2), dk, { d: 0, lw: 1.1 });
      const slab = P();
      slab.moveTo(-20, -38);
      slab.lineTo(-20, -116);
      slab.quadraticCurveTo(-20, -134, 0, -134);
      slab.quadraticCurveTo(20, -134, 20, -116);
      slab.lineTo(20, -38);
      slab.closePath();
      K.paint(g, K.rrect(-24, -42, 48, 6, 2), dk, { d: 1, lw: 1.1 });
      K.paint(g, slab, C.shade(st, 0.06), { d: 3, lw: 1.3 });
      line(
        g,
        [
          [-15, -44],
          [-15, -112],
          [-15, -126, 0, -127],
          [15, -126, 15, -112],
          [15, -44],
        ],
        dk,
        1,
      );
      ringS(g, 0, -118, 5, 5, 0, dk, 1.2);
      for (const s of [-1, 1])
        line(
          g,
          [
            [s * 6, -120],
            [s * 12, -124, s * 11, -116],
          ],
          dk,
          1,
        );
      for (let c = 0; c < 5; c++)
        for (let r = 0; r < 9; r++) {
          if (hash(c * 11 + r) > 0.85) continue;
          K.paint(g, K.rect(-10 + c * 5, -106 + r * 6.6, 2.2, 3.6), C.shade(st, -0.3), { d: 0, ink: false });
        }
      K.paint(g, K.ell(-12, -50, 6, 3), MT.RGBA_90_130_70_0_4, { d: 0, ink: false });
      K.paint(g, K.ell(-20, -14, 8, 3), MT.RGBA_90_130_70_0_4, { d: 0, ink: false });
    },
    [MT.LICH_SU, MT.VIET_NAM_2, MT.VAN_MIEU, MT.BIA_TIEN_SI],
  );
  add(
    MT.STONE_LANTERN,
    MT.DEN_DA_NHAT_BAN,
    MT.STREET,
    [72, 120],
    (g, o) => {
      const st = nt(o.color || MT.VALUE_9A9A92, o, 0.35);
      const dk = C.shade(st, -0.15);
      K.paint(
        g,
        K.poly([
          [-22, 0],
          [22, 0],
          [18, -9],
          [-18, -9],
        ]),
        dk,
        { d: 1.5, lw: 1.2 },
      );
      K.paint(g, K.ell(0, -10, 14, 4), st, { d: 1, lw: 1.1 });
      K.paint(g, K.rrect(-6, -54, 12, 44, 3), st, { d: 2, lw: 1.2 });
      K.paint(
        g,
        K.poly([
          [-20, -54],
          [20, -54],
          [15, -62],
          [-15, -62],
        ]),
        dk,
        { d: 1.5, lw: 1.2 },
      );
      K.paint(g, K.rect(-14, -86, 28, 24), st, { d: 2, lw: 1.2 });
      const lit = o.night;
      if (lit) K.glowDisc(g, 0, -74, 46, MT.FFD27A, 0.55);
      K.paint(g, K.rect(-7, -82, 14, 16), lit ? MT.FFD27A : MT.VALUE_3A3A38, { d: 0, lw: 1, glow: lit ? MT.RGBA_255_200_110_1 : null, glowR: 16 });
      K.paint(
        g,
        K.poly([
          [-34, -88],
          [-26, -86],
          [26, -86],
          [34, -88],
          [24, -96],
          [8, -104],
          [-8, -104],
          [-24, -96],
        ]),
        dk,
        { d: 2.5, lw: 1.3 },
      );
      K.paint(g, K.ell(0, -106, 5, 3), st, { d: 1, lw: 1 });
      K.paint(
        g,
        K.poly(
          [
            [0, -118],
            [5, -111],
            [0, -107],
            [-5, -111],
          ],
          true,
        ),
        st,
        { d: 1, lw: 1.1 },
      );
      K.paint(g, K.ell(-10, -60, 6, 2), MT.RGBA_90_130_70_0_45, { d: 0, ink: false });
    },
    [MT.LICH_SU, MT.NHAT_BAN_2, MT.DEN_DA],
    glowAt(0, -74, 90, MT.FFD27A, 0.4),
  );
  add(
    MT.ROMAN_COLUMN,
    MT.COT_DA_LA_MA_DO_NAT,
    MT.STREET,
    [92, 184],
    (g, o) => {
      const mb = nt(o.color || MT.E6E1D6, o, 0.4);
      const dk = C.shade(mb, -0.15);
      K.paint(g, K.rect(-32, -12, 64, 12), dk, { d: 2, lw: 1.3 });
      K.paint(g, K.rrect(-26, -19, 52, 8, 4), mb, { d: 1.5, lw: 1.2 });
      const sh = K.poly([
        [-20, -18],
        [20, -18],
        [19, -150],
        [13, -158],
        [8, -151],
        [2, -174],
        [-5, -160],
        [-11, -166],
        [-19, -146],
      ]);
      K.paint(g, sh, mb, { d: 4, lw: 1.4 });
      g.save();
      g.clip(sh);
      for (let i = 0; i < 7; i++) {
        const x = -15 + i * 5;
        line(
          g,
          [
            [x, -20],
            [x, -176],
          ],
          dk,
          1,
        );
      }
      line(
        g,
        [
          [-12, -90],
          [-4, -100],
          [-8, -108],
          [2, -118],
        ],
        C.shade(mb, -0.35),
        0.9,
      );
      g.restore();
      K.paint(
        g,
        K.poly([
          [26, 0],
          [48, 0],
          [50, -14],
          [42, -18],
          [28, -16],
        ]),
        mb,
        { d: 2, lw: 1.2 },
      );
      for (const x of [33, 40])
        line(
          g,
          [
            [x, -2],
            [x, -15],
          ],
          dk,
          0.9,
        );
      K.paint(
        g,
        K.poly([
          [-40, 0],
          [-34, 0],
          [-35, -5],
          [-40, -4],
        ]),
        dk,
        { d: 0, lw: 1 },
      );
      K.paint(g, K.ell(-12, -24, 7, 3), MT.RGBA_100_140_80_0_4, { d: 0, ink: false });
    },
    [MT.LICH_SU, MT.LA_MA_2, MT.TAN_TICH, MT.CO_DAI],
  );
  add(
    MT.GREEK_STATUE,
    MT.TUONG_CAM_THACH_HY_LAP,
    MT.STREET,
    [76, 204],
    (g, o) => {
      const mb = nt(o.color || MT.EBE7DF, o, 0.4);
      const dk = C.shade(mb, -0.18);
      K.paint(g, K.rect(-30, -34, 60, 34), dk, { d: 3, lw: 1.3 });
      K.paint(g, K.rect(-34, -40, 68, 7), mb, { d: 1.5, lw: 1.2 });
      K.paint(g, K.rect(-34, -6, 68, 6), mb, { d: 1, lw: 1.2 });
      tube(
        g,
        [
          [15, -164],
          [22, -134],
          [20, -110],
        ],
        mb,
        6.5,
      );
      K.paint(g, K.ell(20, -107, 3.6, 4), mb, { d: 1, lw: 1 });
      const robe = K.poly(
        [
          [-14, -168],
          [15, -168],
          [18, -150],
          [14, -128],
          [18, -100],
          [21, -62],
          [23, -42],
          [-21, -42],
          [-19, -70],
          [-15, -110],
          [-16, -140],
          [-16, -160],
        ],
        true,
      );
      K.paint(g, robe, mb, { d: 5, lw: 1.4 });
      for (const [x0, y0, x1, y1] of [
        [-10, -120, -12, -44],
        [-2, -118, -4, -44],
        [8, -112, 10, -44],
        [14, -96, 18, -48],
        [-12, -150, 10, -128],
        [-8, -158, 14, -138],
      ])
        line(
          g,
          [
            [x0, y0],
            [(x0 + x1) / 2 + 2, (y0 + y1) / 2, x1, y1],
          ],
          dk,
          1,
        );
      K.paint(g, K.ell(6, -84, 6, 14), C.shade(mb, 0.05), { d: 0, ink: false });
      tube(
        g,
        [
          [-14, -164],
          [-20, -138],
          [-2, -128],
        ],
        mb,
        6,
      );
      K.paint(g, K.ell(0, -128, 3.4, 3.4), mb, { d: 1, lw: 1 });
      K.paint(g, K.rrect(-3, -176, 7, 9, 2), mb, { d: 1, lw: 1.1 });
      K.paint(g, K.ell(-3, -192, 6.5, 5.5), dk, { d: 1, lw: 1.1 });
      K.paint(g, K.ell(1, -184, 9, 11), mb, { d: 2.5, lw: 1.2 });
      K.paint(
        g,
        K.poly(
          [
            [-8, -186],
            [-4, -195],
            [6, -195],
            [10, -188],
            [4, -190],
            [-4, -188],
          ],
          true,
        ),
        dk,
        { d: 0, lw: 1 },
      );
      line(
        g,
        [
          [4, -184],
          [7, -184],
        ],
        dk,
        0.8,
      );
    },
    [MT.LICH_SU, MT.HY_LAP_2, MT.TUONG_2, MT.CAM_THACH],
  );
  add(
    MT.BRAZIER,
    MT.LO_LUA_SAT,
    MT.STREET,
    [70, 112],
    (g, o) => {
      const ir = nt(o.color || MT.VALUE_3A3636, o, 0.2);
      tube(
        g,
        [
          [0, -58],
          [2, -2],
        ],
        C.shade(ir, -0.2),
        3,
      );
      for (const s of [-1, 1])
        tube(
          g,
          [
            [s * 14, -60],
            [s * 22, -30, s * 28, 0],
          ],
          ir,
          3.2,
        );
      tube(
        g,
        [
          [-20, -30],
          [20, -30],
        ],
        ir,
        2,
      );
      K.glowDisc(g, 0, -86, o.night ? 80 : 46, MT.FF9A3A, o.night ? 0.5 : 0.25);
      const tt = tm(o);
      for (const [x, h, ph] of [
        [-12, 22, 0.3],
        [10, 26, 1.7],
        [0, 36, 0.9],
        [-5, 28, 2.6],
        [6, 30, 3.4],
      ])
        fire(g, x, -78, 14, h, o, ph);
      K.paint(g, K.ell(0, -80, 22, 4.5), MT.FF7A2A, { d: 0, lw: 1, glow: MT.RGBA_255_120_40_1, glowR: 10 });
      const bowl = K.poly([
        [-26, -82],
        [26, -82],
        [17, -58],
        [-17, -58],
      ]);
      K.paint(g, bowl, ir, { d: 2.5, lw: 1.3 });
      g.save();
      g.clip(bowl);
      for (let i = -3; i <= 3; i++)
        line(
          g,
          [
            [i * 7, -82],
            [i * 5, -58],
          ],
          C.shade(ir, 0.25),
          1,
        );
      line(
        g,
        [
          [-30, -70],
          [30, -70],
        ],
        C.shade(ir, 0.25),
        1,
      );
      g.restore();
      K.paint(g, K.rrect(-28, -84, 56, 4, 2), C.shade(ir, 0.12), { d: 0, lw: 1.1 });
      for (let i = 0; i < 6; i++) {
        const u = (tt * 0.6 + hash(i)) % 1;
        const x = (hash(i + 3) - 0.5) * 30 + Math.sin(u * 6 + i) * 4;
        const y = -90 - u * 34;
        K.paint(g, K.ell(x, y, 1.1, 1.1), C.rgba(MT.FFD27A, 1 - u), { d: 0, ink: false });
      }
    },
    [MT.LICH_SU, MT.LUA_3, MT.DUOC],
    (o) => [{ type: MT.GLOW, x: 0, y: -94, r: o.night ? 150 : 90, color: MT.FF9A3A, alpha: o.night ? 0.45 : 0.2 }],
  );
  add(
    MT.HAY_BALE,
    MT.KIEN_ROM,
    MT.NATURE,
    [96, 62],
    (g, o) => {
      const hy = nt(o.color || MT.D8B04A, o, 0.35);
      const tw = nt(MT.VALUE_8A5A2A, o, 0.3);
      const front = K.rect(-46, -46, 64, 46);
      const topF = K.poly([
        [-46, -46],
        [18, -46],
        [40, -58],
        [-24, -58],
      ]);
      const side = K.poly([
        [18, 0],
        [18, -46],
        [40, -58],
        [40, -12],
      ]);
      K.paint(g, side, C.shade(hy, -0.18), { d: 0, lw: 1.2 });
      K.paint(g, topF, C.shade(hy, 0.12), { d: 0, lw: 1.2 });
      K.paint(g, front, hy, { d: 3, lw: 1.3 });
      const straw = (clip, n, seed, ox, oy, w, h) => {
        g.save();
        g.clip(clip);
        for (let i = 0; i < n; i++) {
          const x = ox + hash(seed + i) * w,
            y = oy + hash(seed + i + 200) * h;
          const a = (hash(seed + i + 400) - 0.5) * 1.2;
          line(
            g,
            [
              [x, y],
              [x + Math.cos(a) * 7, y + Math.sin(a) * 7],
            ],
            hash(seed + i + 600) > 0.5 ? C.shade(hy, -0.25) : C.shade(hy, 0.25),
            0.8,
          );
        }
        g.restore();
      };
      straw(front, 70, 1, -46, -46, 64, 46);
      straw(topF, 30, 90, -46, -58, 86, 12);
      straw(side, 25, 150, 18, -58, 22, 58);
      for (const x of [-30, 2]) {
        line(
          g,
          [
            [x, 0],
            [x, -46],
            [x + 22, -58],
          ],
          tw,
          1.6,
        );
      }
      for (const y of [-14, -32])
        line(
          g,
          [
            [18, y],
            [40, y - 12],
          ],
          tw,
          1.6,
        );
      for (let i = 0; i < 6; i++) {
        const x = -44 + hash(i + 31) * 80;
        line(
          g,
          [
            [x, 0],
            [x + 4 + hash(i) * 4, -3 - hash(i + 7) * 3],
          ],
          C.shade(hy, -0.1),
          0.9,
        );
      }
    },
    [MT.THIEN_NHIEN, MT.NONG_TRAI, MT.ROM],
  );
  add(
    MT.WANTED_POSTER,
    MT.AP_PHICH_TRUY_NA,
    MT.INTERIOR,
    [76, 106],
    (g, o) => {
      const pp = nt(o.color || MT.E6CF9C, o, 0.35);
      const ink = MT.VALUE_2A1A10;
      const pts = [];
      const W = 34,
        top = -104,
        bot = -6;
      for (let i = 0; i <= 8; i++) pts.push([-W + i * 8.5, top + (hash(i) - 0.5) * 2.4]);
      for (let i = 1; i <= 10; i++) pts.push([W + (hash(i + 20) - 0.5) * 2, top + i * 9.8]);
      for (let i = 1; i <= 8; i++) pts.push([W - i * 8.5, bot + (hash(i + 40) - 0.5) * 3]);
      for (let i = 1; i < 10; i++) pts.push([-W + (hash(i + 60) - 0.5) * 2, bot - i * 9.8]);
      const paper = K.poly(pts);
      K.paint(g, paper, pp, { d: 2, lw: 1.2 });
      g.save();
      g.clip(paper);
      K.paint(g, K.ell(20, -30, 10, 7), MT.RGBA_140_90_40_0_18, { d: 0, ink: false });
      K.paint(g, K.ell(-24, -96, 8, 6), MT.RGBA_140_90_40_0_15, { d: 0, ink: false });
      g.restore();
      g.save();
      g.fillStyle = ink;
      g.textAlign = MT.CENTER;
      g.textBaseline = MT.ALPHABETIC;
      g.font = MT.BOLD_15PX_GEORGIA_SERIF;
      g.fillText(MT.WANTED, 0, -86);
      g.font = MT.BOLD_6PX_GEORGIA_SERIF;
      g.fillText(MT.DEAD_OR_ALIVE, 0, -78);
      g.font = MT.BOLD_9PX_GEORGIA_SERIF;
      g.fillText(MT.REWARD, 0, -22);
      g.font = MT.BOLD_11PX_GEORGIA_SERIF;
      g.fillText(MT.VALUE_5_000, 0, -10);
      g.restore();
      K.paint(g, K.rect(-20, -73, 40, 42), nt(MT.D4BA84, o, 0.3), { d: 0, lw: 1 });
      g.save();
      g.clip(K.rect(-20, -73, 40, 42));
      K.paint(g, K.rrect(-16, -42, 32, 16, 8), ink, { d: 0, ink: false });
      K.paint(g, K.ell(0, -52, 8, 9.5), ink, { d: 0, ink: false });
      K.paint(g, K.ell(0, -59, 16, 3), ink, { d: 0, ink: false });
      K.paint(g, K.rrect(-8, -68, 16, 10, 4), ink, { d: 0, ink: false });
      g.restore();
      line(
        g,
        [
          [-20, -73],
          [20, -73],
          [20, -31],
          [-20, -31],
          [-20, -73],
        ],
        ink,
        1,
      );
      K.paint(g, K.ell(0, -100, 1.8, 1.8), MT.VALUE_5A5A5E, { d: 0, lw: 0.8 });
    },
    [MT.MIEN_TAY_2, MT.TRUY_NA, MT.CAO_BOI],
  );
  for (const id of ids) if (!TALES.assets.includes(id)) TALES.assets.push(id);
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
