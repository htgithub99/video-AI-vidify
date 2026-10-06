(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const R = (g, x, y, w, h, r, col) => {
    g.fillStyle = col;
    if (r) {
      ME.roundRect(g, x, y, w, h, r);
      g.fill();
    } else g.fillRect(x, y, w, h);
  };
  const poly = (g, pts, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fill();
  };
  ME.shapes = { R, poly };
  const wheel = (g, x, y, r, rot, o = {}) => {
    if (o.ring) {
      g.strokeStyle = o.tyre || MT.VALUE_151619;
      g.lineWidth = r * 0.16;
      g.beginPath();
      g.arc(x, y, r * 0.92, 0, PI * 2);
      g.stroke();
    } else {
      g.fillStyle = o.tyre || MT.VALUE_151619;
      g.beginPath();
      g.arc(x, y, r, 0, PI * 2);
      g.fill();
      g.fillStyle = o.rim || MT.VALUE_8F969E;
      g.beginPath();
      g.arc(x, y, r * 0.58, 0, PI * 2);
      g.fill();
    }
    const sr = o.ring ? 0.88 : 0.55;
    g.strokeStyle = o.spoke || MT.VALUE_5B6168;
    g.lineWidth = o.ring ? 1.1 : Math.max(1, r * 0.1);
    const n = o.spokes || 5;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * PI * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * r * sr, y + Math.sin(a) * r * sr);
      g.stroke();
    }
    g.fillStyle = o.hub || MT.C4C9CE;
    g.beginPath();
    g.arc(x, y, r * 0.16, 0, PI * 2);
    g.fill();
  };
  ME.wheel = wheel;
  const glass = (g, pts, night) => {
    const ys = pts.map((p) => p[1]);
    const gr = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
    gr.addColorStop(0, night ? MT.VALUE_2A3446 : MT.B9D3E6);
    gr.addColorStop(1, night ? MT.VALUE_121823 : MT.VALUE_5F7F99);
    poly(g, pts, gr);
  };
  const spin = (o, r) => ((o.distance != null ? o.distance : (o.t || 0) * (o.speed || 0)) / r) % (PI * 2);
  const V = (id, name, size, draw, extra) => ME.registerAsset(id, Object.assign({ name, category: MT.VEHICLE, size, draw, tags: [MT.XE] }, extra || {}));
  const sedan = (g, o, opt) => {
    const col = o.color || opt.color;
    const night = !!o.night;
    const L = opt.len || 420,
      hgt = opt.h || 120;
    const x0 = -L / 2;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x0 + 6, -22);
    g.lineTo(x0 + 2, -62);
    g.quadraticCurveTo(x0 + 8, -74, x0 + 40, -76);
    g.lineTo(x0 + L * 0.27, -80);
    g.lineTo(x0 + L * 0.36, -hgt);
    g.lineTo(x0 + L * 0.7, -hgt);
    g.lineTo(x0 + L * 0.8, -82);
    g.lineTo(x0 + L - 26, -76);
    g.quadraticCurveTo(x0 + L, -70, x0 + L - 2, -44);
    g.lineTo(x0 + L - 6, -22);
    g.closePath();
    g.fill();
    R(g, x0 + 4, -40, L - 10, 18, 0, C.shade(col, -0.22));
    R(g, x0 + 30, -78, L - 70, 3, 1, C.shade(col, 0.25));
    glass(
      g,
      [
        [x0 + L * 0.3, -82],
        [x0 + L * 0.375, -hgt + 6],
        [x0 + L * 0.52, -hgt + 6],
        [x0 + L * 0.52, -82],
      ],
      night,
    );
    glass(
      g,
      [
        [x0 + L * 0.54, -82],
        [x0 + L * 0.54, -hgt + 6],
        [x0 + L * 0.69, -hgt + 6],
        [x0 + L * 0.775, -82],
      ],
      night,
    );
    R(g, x0 + L * 0.52, -hgt + 4, 6, hgt - 84, 0, C.shade(col, -0.3));
    R(g, x0, -36, 16, 10, 2, MT.B9BEC4);
    R(g, x0 + L - 18, -36, 18, 10, 2, MT.B9BEC4);
    R(g, x0 + L - 14, -66, 12, 10, 3, night || o.lights ? MT.FFF6D6 : MT.E8E2C8);
    R(g, x0 + 2, -64, 9, 10, 2, MT.VALUE_9B1C1C);
    g.strokeStyle = C.shade(col, -0.35);
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0 + L * 0.53, -80);
    g.lineTo(x0 + L * 0.53, -30);
    g.moveTo(x0 + L * 0.3, -78);
    g.lineTo(x0 + L * 0.29, -30);
    g.stroke();
    const wr = opt.wheel || 30;
    const rot = spin(o, wr);
    wheel(g, x0 + L * 0.2, -wr, wr, rot);
    wheel(g, x0 + L * 0.8, -wr, wr, rot);
    if (opt.extra) opt.extra(g, o, x0, L, hgt);
  };
  const carLights = (L) => (o) =>
    o.night || o.lights
      ? [
          { type: MT.BEAM, x: L / 2 - 6, y: -60, angle: 0.06, len: 700, spread: 0.18, color: MT.FFF2C8, alpha: 0.38 },
          { type: MT.GLOW, x: L / 2 - 8, y: -60, r: 40, color: MT.FFF2C8, alpha: 0.9 },
          { type: MT.GLOW, x: -L / 2 + 6, y: -60, r: 22, color: MT.FF3A2A, alpha: 0.7 },
        ]
      : [];
  V(MT.CAR_SEDAN, MT.O_TO_SEDAN, [420, 125], (g, o) => sedan(g, o, { color: MT.VALUE_7A2B2B }), { lights: carLights(420), params: { color: MT.MAU_THAN_XE, lights: MT.BAT_DEN } });
  V(MT.CAR_VINTAGE, MT.O_TO_CO_THAP_NIEN_70, [400, 120], (g, o) => sedan(g, o, { color: MT.C9B48A, len: 400, h: 122, wheel: 28 }), { lights: carLights(400) });
  V(
    MT.POLICE_CAR,
    MT.XE_CANH_SAT,
    [430, 140],
    (g, o) =>
      sedan(g, o, {
        color: MT.E9ECEF,
        len: 430,
        extra: (g2, o2, x0, L) => {
          R(g2, x0 + 8, -56, L - 20, 12, 0, MT.VALUE_1F3C88);
          const k = Math.sin((o2.t || 0) * 12) > 0;
          R(g2, x0 + L * 0.43, -134, 24, 10, 2, k ? MT.VALUE_2F6BFF : MT.VALUE_5A1010);
          R(g2, x0 + L * 0.43 + 26, -134, 24, 10, 2, k ? MT.VALUE_6A0F0F : MT.FF2D2D);
        },
      }),
    { lights: (o) => carLights(430)(o).concat([{ type: MT.GLOW, x: 0, y: -132, r: 120, color: Math.sin((o.t || 0) * 12) > 0 ? MT.VALUE_3A7BFF : MT.FF3030, alpha: 0.75 }]) },
  );
  V(MT.TAXI, MT.TAXI_2, [420, 140], (g, o) => sedan(g, o, { color: MT.E7B416, extra: (g2, o2, x0, L) => R(g2, x0 + L * 0.46, -134, 40, 12, 3, MT.VALUE_222) }), { lights: carLights(420) });
  V(
    MT.VAN,
    MT.XE_VAN,
    [430, 175],
    (g, o) => {
      const col = o.color || MT.D9D6CF;
      const x0 = -215;
      poly(
        g,
        [
          [x0 + 4, -24],
          [x0, -165],
          [x0 + 300, -168],
          [x0 + 340, -112],
          [x0 + 426, -96],
          [x0 + 428, -24],
        ],
        col,
      );
      R(g, x0 + 2, -44, 424, 20, 0, C.shade(col, -0.2));
      glass(
        g,
        [
          [x0 + 312, -160],
          [x0 + 336, -114],
          [x0 + 312, -112],
        ],
        o.night,
      );
      glass(
        g,
        [
          [x0 + 250, -150],
          [x0 + 300, -150],
          [x0 + 300, -112],
          [x0 + 250, -112],
        ],
        o.night,
      );
      if (o.text) {
        g.fillStyle = C.shade(col, -0.5);
        g.font = ME.font(800, 26, MT.HEAD);
        g.fillText(String(o.text).slice(0, 16), x0 + 30, -100);
      }
      const rot = spin(o, 30);
      wheel(g, x0 + 80, -30, 30, rot);
      wheel(g, x0 + 350, -30, 30, rot);
    },
    { lights: carLights(430) },
  );
  V(
    MT.TRUCK,
    MT.XE_TAI,
    [620, 230],
    (g, o) => {
      const col = o.color || MT.VALUE_2F5B7A;
      const x0 = -310;
      R(g, x0, -228, 430, 190, 3, o.cargoColor || MT.C8C3B8);
      R(g, x0, -60, 430, 22, 0, MT.VALUE_55585D);
      poly(
        g,
        [
          [x0 + 440, -38],
          [x0 + 440, -190],
          [x0 + 545, -190],
          [x0 + 600, -120],
          [x0 + 616, -110],
          [x0 + 616, -38],
        ],
        col,
      );
      glass(
        g,
        [
          [x0 + 470, -180],
          [x0 + 540, -180],
          [x0 + 588, -122],
          [x0 + 470, -122],
        ],
        o.night,
      );
      R(g, x0 + 440, -56, 176, 18, 0, C.shade(col, -0.25));
      const rot = spin(o, 34);
      [x0 + 70, x0 + 150, x0 + 530].forEach((x) => wheel(g, x, -34, 34, rot));
    },
    { lights: carLights(620) },
  );
  V(
    MT.ARMORED_TRUCK,
    MT.XE_CHO_TIEN_BOC_THEP,
    [520, 210],
    (g, o) => {
      const col = o.color || MT.VALUE_4A5560;
      const x0 = -260;
      R(g, x0, -205, 380, 170, 10, col);
      R(g, x0 + 20, -150, 80, 14, 2, C.shade(col, -0.3));
      R(g, x0 + 130, -180, 6, 140, 0, C.shade(col, -0.3));
      poly(
        g,
        [
          [x0 + 384, -36],
          [x0 + 384, -180],
          [x0 + 470, -180],
          [x0 + 515, -110],
          [x0 + 520, -36],
        ],
        C.shade(col, 0.08),
      );
      glass(
        g,
        [
          [x0 + 400, -170],
          [x0 + 462, -170],
          [x0 + 500, -115],
          [x0 + 400, -115],
        ],
        o.night,
      );
      R(g, x0 + 30, -120, 60, 30, 2, MT.D0B25A);
      const rot = spin(o, 34);
      [x0 + 80, x0 + 300, x0 + 440].forEach((x) => wheel(g, x, -34, 34, rot));
    },
    { lights: carLights(520) },
  );
  V(
    MT.BUS,
    MT.XE_BUYT,
    [780, 240],
    (g, o) => {
      const col = o.color || MT.D4572E;
      const x0 = -390;
      R(g, x0, -238, 780, 205, 18, col);
      R(g, x0, -80, 780, 30, 0, C.shade(col, -0.25));
      for (let i = 0; i < 7; i++)
        glass(
          g,
          [
            [x0 + 40 + i * 100, -220],
            [x0 + 120 + i * 100, -220],
            [x0 + 120 + i * 100, -140],
            [x0 + 40 + i * 100, -140],
          ],
          o.night,
        );
      R(g, x0 + 740, -200, 30, 150, 4, C.shade(col, -0.35));
      const rot = spin(o, 36);
      wheel(g, x0 + 140, -36, 36, rot);
      wheel(g, x0 + 640, -36, 36, rot);
    },
    { lights: (o) => (o.night ? [{ type: MT.GLOW, x: 360, y: -70, r: 50, color: MT.FFF2C8, alpha: 0.9 }].concat(Array.from({ length: 7 }, (_, i) => ({ type: MT.RECT, x: -350 + i * 100, y: -220, w: 80, h: 80, color: MT.FFD99A, alpha: 0.35 }))) : []) },
  );
  const frameLine = (g, pts, col, w) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = MT.ROUND;
    g.lineJoin = MT.ROUND;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  V(
    MT.MOTORBIKE,
    MT.XE_MO_TO,
    [230, 120],
    (g, o) => {
      const col = o.color || MT.VALUE_20242A;
      const rot = spin(o, 30);
      wheel(g, -80, -30, 30, rot, { spokes: 8 });
      wheel(g, 82, -30, 30, rot, { spokes: 8 });
      frameLine(
        g,
        [
          [-80, -30],
          [-30, -70],
          [40, -70],
          [82, -30],
        ],
        MT.VALUE_5B6168,
        5,
      );
      frameLine(
        g,
        [
          [82, -30],
          [62, -105],
          [50, -112],
        ],
        MT.VALUE_8A9096,
        4,
      );
      R(g, -30, -88, 80, 26, 10, col);
      R(g, -68, -84, 52, 12, 5, MT.VALUE_141414);
      R(g, -20, -58, 46, 22, 4, MT.VALUE_4A4F55);
      frameLine(
        g,
        [
          [-50, -48],
          [-95, -44],
        ],
        MT.VALUE_9AA0A6,
        4,
      );
      R(g, 60, -104, 14, 12, 4, MT.D8D2B8);
    },
    {
      lights: (o) =>
        o.night || o.lights
          ? [
              { type: MT.BEAM, x: 74, y: -98, angle: 0.08, len: 520, spread: 0.16, color: MT.FFF2C8, alpha: 0.35 },
              { type: MT.GLOW, x: 74, y: -98, r: 28, color: MT.FFF2C8, alpha: 0.9 },
            ]
          : [],
      seat: { driver: [-22, -78], passenger: [-62, -76] },
    },
  );
  V(
    MT.SCOOTER,
    MT.XE_TAY_GA,
    [190, 110],
    (g, o) => {
      const col = o.color || MT.VALUE_9FC5C2;
      const rot = spin(o, 22);
      wheel(g, -64, -22, 22, rot, { spokes: 5 });
      wheel(g, 66, -22, 22, rot, { spokes: 5 });
      poly(
        g,
        [
          [-90, -30],
          [-80, -70],
          [-10, -72],
          [10, -36],
          [50, -40],
          [60, -100],
          [74, -104],
          [80, -40],
          [66, -26],
          [-90, -26],
        ],
        col,
      );
      R(g, -74, -86, 64, 14, 6, MT.VALUE_2A2A2A);
      frameLine(
        g,
        [
          [66, -104],
          [52, -118],
        ],
        MT.VALUE_444,
        4,
      );
    },
    { seat: { driver: [-40, -74], passenger: [-70, -74] } },
  );
  V(
    MT.BICYCLE,
    MT.XE_DAP,
    [180, 100],
    (g, o) => {
      const rot = spin(o, 31);
      const col = o.color || MT.VALUE_3D6E8F;
      wheel(g, -58, -31, 31, rot, { ring: true, tyre: MT.VALUE_1A1A1A, spoke: MT.VALUE_9AA3AA, spokes: 12, hub: MT.BBB });
      wheel(g, 60, -31, 31, rot, { ring: true, tyre: MT.VALUE_1A1A1A, spoke: MT.VALUE_9AA3AA, spokes: 12, hub: MT.BBB });
      frameLine(
        g,
        [
          [-58, -31],
          [-8, -31],
          [-22, -78],
          [-58, -31],
        ],
        col,
        4,
      );
      frameLine(
        g,
        [
          [-8, -31],
          [42, -76],
          [-22, -78],
        ],
        col,
        4,
      );
      frameLine(
        g,
        [
          [42, -76],
          [60, -31],
        ],
        col,
        4,
      );
      frameLine(
        g,
        [
          [42, -76],
          [38, -92],
          [52, -94],
        ],
        MT.VALUE_222,
        3,
      );
      R(g, -36, -88, 26, 7, 3, MT.VALUE_222);
    },
    { seat: { driver: [-22, -82] } },
  );
  V(
    MT.AIRPLANE,
    MT.MAY_BAY_CHO_KHACH,
    [900, 300],
    (g, o) => {
      const col = o.color || MT.EEF1F4;
      const ac = o.accent || MT.VALUE_1F4E8C;
      const gearDown = o.gear !== false;
      poly(
        g,
        [
          [-400, -150],
          [-450, -300],
          [-390, -300],
          [-300, -160],
        ],
        ac,
      );
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-430, -150);
      g.quadraticCurveTo(-420, -190, -300, -192);
      g.lineTo(330, -195);
      g.quadraticCurveTo(450, -190, 460, -140);
      g.quadraticCurveTo(440, -106, 330, -102);
      g.lineTo(-300, -104);
      g.quadraticCurveTo(-410, -110, -430, -150);
      g.fill();
      R(g, -300, -128, 640, 14, 0, ac);
      for (let i = 0; i < 22; i++) R(g, -260 + i * 26, -168, 12, 14, 4, o.night ? MT.FFD58A : MT.VALUE_28384D);
      glass(
        g,
        [
          [400, -168],
          [438, -160],
          [446, -146],
          [404, -146],
        ],
        o.night,
      );
      poly(
        g,
        [
          [-40, -112],
          [120, -112],
          [-30, -40],
          [-90, -40],
        ],
        C.shade(col, -0.18),
      );
      R(g, -10, -96, 90, 26, 12, MT.VALUE_9AA3AD);
      if (gearDown) {
        frameLine(
          g,
          [
            [-60, -102],
            [-60, -30],
          ],
          MT.VALUE_555,
          6,
        );
        frameLine(
          g,
          [
            [330, -104],
            [330, -30],
          ],
          MT.VALUE_555,
          5,
        );
        const rot = spin(o, 20);
        wheel(g, -70, -20, 20, rot);
        wheel(g, -40, -20, 20, rot);
        wheel(g, 330, -18, 18, rot);
      }
    },
    {
      category: MT.AIRCRAFT,
      tags: [MT.MAY_BAY, MT.SAN_BAY],
      lights: (o) => {
        const blink = Math.sin((o.t || 0) * 6) > 0.85;
        return [
          { type: MT.GLOW, x: -440, y: -300, r: 26, color: blink ? MT.FF3A3A : MT.VALUE_550000, alpha: 0.9 },
          { type: MT.GLOW, x: 20, y: -40, r: 18, color: MT.VALUE_9DFF9A, alpha: 0.7 },
        ].concat(o.night ? [{ type: MT.BEAM, x: 450, y: -120, angle: 0.15, len: 600, spread: 0.12, color: MT.FFF2C8, alpha: 0.25 }] : []);
      },
    },
  );
  V(
    MT.SMALL_PLANE,
    MT.MAY_BAY_CANH_QUAT_NHO,
    [420, 160],
    (g, o) => {
      const col = o.color || MT.D84A3A;
      poly(
        g,
        [
          [-190, -80],
          [-215, -150],
          [-180, -150],
          [-130, -88],
        ],
        col,
      );
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-200, -80);
      g.quadraticCurveTo(-60, -112, 150, -100);
      g.quadraticCurveTo(190, -88, 180, -66);
      g.quadraticCurveTo(0, -56, -200, -72);
      g.fill();
      glass(
        g,
        [
          [40, -104],
          [100, -104],
          [118, -88],
          [40, -88],
        ],
        o.night,
      );
      poly(
        g,
        [
          [-20, -84],
          [100, -84],
          [80, -70],
          [-30, -70],
        ],
        C.shade(col, -0.25),
      );
      const pr = (o.t || 0) * 40;
      g.fillStyle = MT.RGBA_40_40_40_0_35;
      g.beginPath();
      g.ellipse(190, -82, 6, 46 * Math.abs(Math.cos(pr)) + 6, 0, 0, PI * 2);
      g.fill();
      if (o.gear !== false) {
        frameLine(
          g,
          [
            [60, -64],
            [60, -18],
          ],
          MT.VALUE_444,
          4,
        );
        wheel(g, 60, -14, 14, spin(o, 14));
        wheel(g, -170, -10, 9, spin(o, 9));
      }
    },
    { category: MT.AIRCRAFT, tags: [MT.MAY_BAY] },
  );
  V(
    MT.HELICOPTER,
    MT.TRUC_THANG,
    [480, 200],
    (g, o) => {
      const col = o.color || MT.VALUE_2D3B45;
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(40, -90, 120, 58, 0, 0, PI * 2);
      g.fill();
      poly(
        g,
        [
          [-60, -100],
          [-240, -110],
          [-250, -130],
          [-232, -132],
          [-60, -120],
        ],
        col,
      );
      R(g, -255, -170, 12, 60, 4, col);
      glass(
        g,
        [
          [90, -130],
          [150, -110],
          [150, -80],
          [90, -80],
        ],
        o.night,
      );
      frameLine(
        g,
        [
          [-30, -30],
          [120, -30],
        ],
        MT.VALUE_333,
        5,
      );
      frameLine(
        g,
        [
          [0, -38],
          [10, -30],
        ],
        MT.VALUE_333,
        4,
      );
      frameLine(
        g,
        [
          [90, -38],
          [80, -30],
        ],
        MT.VALUE_333,
        4,
      );
      R(g, 30, -160, 16, 14, 2, MT.VALUE_333);
      const k = Math.abs(Math.sin((o.t || 0) * 30));
      g.fillStyle = MT.RGBA_30_30_30_0_35;
      g.beginPath();
      g.ellipse(38, -164, 250 * (0.4 + 0.6 * k), 5, 0, 0, PI * 2);
      g.fill();
      g.fillStyle = MT.RGBA_30_30_30_0_3;
      g.beginPath();
      g.ellipse(-250, -140, 6, 34 * k + 6, 0, 0, PI * 2);
      g.fill();
    },
    { category: MT.AIRCRAFT, tags: [MT.TRUC_THANG_2], lights: (o) => [{ type: MT.GLOW, x: -250, y: -170, r: 20, color: Math.sin((o.t || 0) * 5) > 0.6 ? MT.FF3030 : MT.VALUE_330000, alpha: 0.9 }] },
  );
  const bob = (o, a = 3) => Math.sin((o.t || 0) * 1.4) * a;
  V(
    MT.BOAT,
    MT.XUONG_MAY,
    [360, 140],
    (g, o) => {
      const col = o.color || MT.F2F2EE;
      g.translate(0, bob(o));
      poly(
        g,
        [
          [-180, -60],
          [170, -60],
          [140, 10],
          [-150, 10],
        ],
        col,
      );
      R(g, -180, -64, 350, 8, 0, C.shade(col, -0.2));
      R(g, -40, -120, 120, 60, 8, C.shade(col, -0.05));
      glass(
        g,
        [
          [-30, -112],
          [70, -112],
          [70, -84],
          [-30, -84],
        ],
        o.night,
      );
      R(g, -190, -70, 16, 50, 4, MT.VALUE_2A2A2A);
    },
    { category: MT.WATERCRAFT, tags: [MT.THUYEN] },
  );
  V(
    MT.SHIP,
    MT.TAU_HANG,
    [1100, 380],
    (g, o) => {
      const col = o.color || MT.VALUE_7A2525;
      g.translate(0, bob(o, 2));
      poly(
        g,
        [
          [-550, -110],
          [520, -110],
          [560, -160],
          [520, 40],
          [-520, 40],
        ],
        col,
      );
      R(g, -550, -130, 1080, 22, 0, MT.VALUE_1D2A35);
      const cc = [MT.VALUE_2F6F8F, MT.C49A2C, MT.VALUE_8A3A2A, MT.VALUE_3D7A4A];
      for (let i = 0; i < 12; i++) R(g, -480 + i * 64, -230 - (i % 3) * 40, 60, 100 + (i % 3) * 40, 0, cc[i % 4]);
      R(g, 330, -330, 140, 200, 4, MT.E8E4DA);
      for (let i = 0; i < 4; i++) R(g, 345 + i * 32, -310, 20, 14, 2, o.night ? MT.FFD58A : MT.VALUE_2B3E52);
    },
    { category: MT.WATERCRAFT, tags: [MT.TAU, MT.CANG] },
  );
  V(
    MT.SAILBOAT,
    MT.THUYEN_BUOM,
    [300, 360],
    (g, o) => {
      g.translate(0, bob(o));
      poly(
        g,
        [
          [-150, -40],
          [150, -40],
          [120, 10],
          [-120, 10],
        ],
        o.color || MT.VALUE_6A3E24,
      );
      R(g, -4, -350, 7, 310, 0, MT.VALUE_4A3A2A);
      poly(
        g,
        [
          [6, -340],
          [130, -60],
          [6, -60],
        ],
        MT.F3EFE4,
      );
      poly(
        g,
        [
          [-6, -300],
          [-110, -70],
          [-6, -70],
        ],
        MT.E6DFD0,
      );
    },
    { category: MT.WATERCRAFT, tags: [MT.THUYEN] },
  );
  V(
    MT.RAFT,
    MT.BE_CAO_SU,
    [240, 70],
    (g, o) => {
      g.translate(0, bob(o, 1.5));
      R(g, -120, -40, 240, 40, 20, o.color || MT.D6732C);
      R(g, -96, -28, 192, 18, 9, C.shade(o.color || MT.D6732C, -0.3));
    },
    { category: MT.WATERCRAFT, tags: [MT.BE, MT.CONG] },
  );
  V(
    MT.ROWBOAT,
    MT.THUYEN_CHEO,
    [260, 90],
    (g, o) => {
      g.translate(0, bob(o));
      poly(
        g,
        [
          [-130, -46],
          [130, -46],
          [100, 4],
          [-100, 4],
        ],
        o.color || MT.VALUE_8A5A34,
      );
      R(g, -130, -50, 260, 6, 0, MT.VALUE_5A3A22);
      frameLine(
        g,
        [
          [30, -50],
          [100, 10],
        ],
        MT.VALUE_5A3A22,
        4,
      );
    },
    { category: MT.WATERCRAFT, tags: [MT.THUYEN] },
  );
  V(
    MT.TRAIN,
    MT.TAU_HOA,
    [1400, 260],
    (g, o) => {
      const col = o.color || MT.VALUE_2E4F6E;
      const rot = spin(o, 24);
      poly(
        g,
        [
          [440, -30],
          [440, -230],
          [640, -230],
          [700, -150],
          [700, -30],
        ],
        col,
      );
      glass(
        g,
        [
          [560, -215],
          [630, -215],
          [670, -160],
          [560, -160],
        ],
        o.night,
      );
      for (let c = 0; c < 2; c++) {
        const x0 = -700 + c * 570;
        R(g, x0, -235, 550, 205, 10, col);
        R(g, x0, -110, 550, 14, 0, MT.C9C2B0);
        for (let i = 0; i < 6; i++) R(g, x0 + 30 + i * 86, -205, 62, 60, 5, o.night ? MT.FFD99A : MT.VALUE_2A3C52);
        [x0 + 60, x0 + 120, x0 + 430, x0 + 490].forEach((x) => wheel(g, x, -24, 24, rot, { spokes: 6 }));
      }
      [480, 540, 640].forEach((x) => wheel(g, x, -24, 24, rot, { spokes: 6 }));
    },
    { category: MT.VEHICLE, tags: [MT.TAU_HOA_2], lights: (o) => (o.night ? [{ type: MT.BEAM, x: 696, y: -80, angle: 0.03, len: 900, spread: 0.12, color: MT.FFF2C8, alpha: 0.35 }] : []) },
  );
  V(
    MT.TRAM,
    MT.TAU_DIEN,
    [620, 300],
    (g, o) => {
      const col = o.color || MT.C9A43A;
      R(g, -310, -260, 620, 230, 22, col);
      R(g, -310, -120, 620, 16, 0, MT.F1EAD6);
      for (let i = 0; i < 6; i++) R(g, -280 + i * 98, -235, 76, 80, 6, o.night ? MT.FFD99A : MT.VALUE_2B3E52);
      frameLine(
        g,
        [
          [0, -260],
          [-40, -330],
          [60, -330],
        ],
        MT.VALUE_333,
        3,
      );
      const rot = spin(o, 22);
      [-220, -160, 160, 220].forEach((x) => wheel(g, x, -22, 22, rot));
    },
    { category: MT.VEHICLE, tags: [MT.TAU_DIEN_2] },
  );
  V(MT.RUBBER_TIRE, MT.LOP_XE, [80, 80], (g) => wheel(g, 0, -40, 40, 0.3), { category: MT.PROP });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
