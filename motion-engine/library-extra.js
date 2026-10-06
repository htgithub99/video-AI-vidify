(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { R, poly } = ME.shapes;
  const K = ME.kit;
  const wheel = ME.wheel;
  const A = (id, name, category, size, draw, extra) => ME.registerAsset(id, Object.assign({ name, category, size, draw, tags: [] }, extra || {}));
  const spin = (o, r) => ((o.distance != null ? o.distance : (o.t || 0) * (o.speed || 0)) / r) % (PI * 2);
  const circle = (g, x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, r, 0, PI * 2);
    g.fill();
  };
  const ell = (g, x, y, rx, ry, col, rot = 0) => {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot, 0, PI * 2);
    g.fill();
  };
  const glassGrad = (g, y0, y1, night) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, night ? MT.VALUE_2A3446 : MT.B9D3E6);
    gr.addColorStop(1, night ? MT.VALUE_121823 : MT.VALUE_5F7F99);
    return gr;
  };
  const headLights = (x, y) => (o) =>
    o.night || o.lights
      ? [
          { type: MT.BEAM, x, y, angle: 0.06, len: 700, spread: 0.18, color: MT.FFF2C8, alpha: 0.38 },
          { type: MT.GLOW, x, y, r: 40, color: MT.FFF2C8, alpha: 0.9 },
        ]
      : [];
  const boxy = (g, o, opt) => {
    const night = !!o.night;
    const L = opt.len,
      x0 = -L / 2;
    const body = o.color || opt.color;
    const wr = opt.wheel || 32;
    R(g, x0, -opt.boxH - 24, opt.boxL, opt.boxH, 6, opt.boxColor || body);
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(x0 + opt.boxL - 4, -24);
    g.lineTo(x0 + opt.boxL - 4, -opt.cabH - 24);
    g.lineTo(x0 + L - 70, -opt.cabH - 24);
    g.lineTo(x0 + L - 8, -opt.cabH * 0.55 - 24);
    g.lineTo(x0 + L, -40);
    g.lineTo(x0 + L, -24);
    g.closePath();
    g.fill();
    poly(
      g,
      [
        [x0 + L - 92, -opt.cabH - 14],
        [x0 + L - 72, -opt.cabH - 14],
        [x0 + L - 22, -opt.cabH * 0.58 - 22],
        [x0 + L - 92, -opt.cabH * 0.58 - 22],
      ],
      glassGrad(g, -opt.cabH - 14, -40, night),
    );
    R(g, x0, -36, L, 14, 2, C.shade(body, -0.3));
    R(g, x0 + L - 14, -64, 12, 12, 3, night || o.lights ? MT.FFF6D6 : MT.E8E2C8);
    if (opt.extra) opt.extra(g, o, x0, L);
    const rot = spin(o, wr);
    wheel(g, x0 + L * 0.2, -wr, wr, rot);
    wheel(g, x0 + L * 0.8, -wr, wr, rot);
    if (opt.thirdWheel) wheel(g, x0 + L * 0.34, -wr, wr, rot);
  };
  const siren = (o, x, y, a, b) => {
    const k = Math.sin((o.t || 0) * 12) > 0;
    return [{ type: MT.GLOW, x, y, r: 110, color: k ? a : b, alpha: 0.7 }];
  };
  A(
    MT.AMBULANCE,
    MT.XE_CUU_THUONG,
    MT.VEHICLE,
    [460, 200],
    (g, o) =>
      boxy(g, o, {
        len: 460,
        boxL: 300,
        boxH: 170,
        cabH: 120,
        color: MT.F2F2EE,
        extra: (g2, o2, x0) => {
          R(g2, x0, -110, 460, 16, 0, MT.C42A2A);
          R(g2, x0 + 120, -170, 16, 54, 0, MT.C42A2A);
          R(g2, x0 + 101, -151, 54, 16, 0, MT.C42A2A);
          const k = Math.sin((o2.t || 0) * 12) > 0;
          R(g2, x0 + 30, -206, 40, 12, 3, k ? MT.FF3B3B : MT.VALUE_5A1414);
          R(g2, x0 + 230, -206, 40, 12, 3, k ? MT.VALUE_4A1010 : MT.VALUE_3A6BFF);
        },
      }),
    { tags: [MT.XE, MT.CUU_THUONG, MT.Y_TE], lights: (o) => headLights(225, -60)(o).concat(siren(o, -150, -200, MT.FF3030, MT.VALUE_3A6BFF)) },
  );
  A(
    MT.FIRE_TRUCK,
    MT.XE_CUU_HOA,
    MT.VEHICLE,
    [560, 230],
    (g, o) =>
      boxy(g, o, {
        len: 560,
        boxL: 380,
        boxH: 140,
        cabH: 120,
        color: MT.C0281F,
        thirdWheel: true,
        extra: (g2, o2, x0) => {
          R(g2, x0 + 20, -120, 340, 10, 0, MT.E9E2CC);
          g2.strokeStyle = MT.CFD4D8;
          g2.lineWidth = 6;
          g2.beginPath();
          g2.moveTo(x0 + 10, -190);
          g2.lineTo(x0 + 400, -205);
          g2.moveTo(x0 + 10, -176);
          g2.lineTo(x0 + 400, -191);
          g2.stroke();
          g2.lineWidth = 3;
          for (let i = 0; i < 12; i++) {
            g2.beginPath();
            g2.moveTo(x0 + 20 + i * 32, -190 - i * 0.4);
            g2.lineTo(x0 + 20 + i * 32, -176 - i * 0.4);
            g2.stroke();
          }
          const k = Math.sin((o2.t || 0) * 12) > 0;
          R(g2, x0 + 410, -170, 40, 12, 3, k ? MT.FF3B3B : MT.VALUE_4A1010);
        },
      }),
    { tags: [MT.XE, MT.CUU_HOA], lights: (o) => headLights(275, -60)(o).concat(siren(o, 150, -165, MT.FF3030, MT.FF8A30)) },
  );
  A(
    MT.PICKUP_TRUCK,
    MT.XE_BAN_TAI,
    MT.VEHICLE,
    [440, 150],
    (g, o) =>
      boxy(g, o, {
        len: 440,
        boxL: 210,
        boxH: 50,
        cabH: 110,
        color: MT.VALUE_3B5A7A,
        extra: (g2, o2, x0) => R(g2, x0 + 4, -84, 200, 8, 0, MT.VALUE_2A3A4A),
      }),
    { tags: [MT.XE], lights: headLights(215, -60) },
  );
  A(
    MT.JEEP,
    MT.XE_JEEP_DIA_HINH,
    MT.VEHICLE,
    [380, 170],
    (g, o) => {
      const col = o.color || MT.VALUE_5A6A3A,
        night = !!o.night,
        x0 = -190;
      R(g, x0, -110, 380, 76, 10, col);
      R(g, x0 + 150, -170, 120, 64, 4, C.shade(col, -0.05));
      poly(
        g,
        [
          [x0 + 158, -162],
          [x0 + 262, -162],
          [x0 + 262, -114],
          [x0 + 158, -114],
        ],
        glassGrad(g, -162, -114, night),
      );
      R(g, x0 + 210, -162, 6, 50, 0, col);
      R(g, x0 - 22, -126, 26, 60, 6, MT.VALUE_222);
      R(g, x0 + 360, -84, 24, 12, 2, MT.VALUE_888);
      R(g, x0 + 366, -100, 12, 12, 3, night || o.lights ? MT.FFF6D6 : MT.E8E2C8);
      const wr = 36,
        rot = spin(o, wr);
      wheel(g, x0 + 70, -wr, wr, rot, { rim: MT.VALUE_5A5A50 });
      wheel(g, x0 + 310, -wr, wr, rot, { rim: MT.VALUE_5A5A50 });
    },
    { tags: [MT.XE, MT.QUAN_SU, MT.DIA_HINH], lights: headLights(180, -94) },
  );
  A(
    MT.SPORTS_CAR,
    MT.XE_THE_THAO,
    MT.VEHICLE,
    [440, 110],
    (g, o) => {
      const col = o.color || MT.D0302A,
        night = !!o.night,
        x0 = -220;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x0 + 4, -26);
      g.lineTo(x0 + 2, -58);
      g.quadraticCurveTo(x0 + 60, -66, x0 + 140, -70);
      g.quadraticCurveTo(x0 + 200, -104, x0 + 260, -100);
      g.quadraticCurveTo(x0 + 320, -78, x0 + 430, -50);
      g.lineTo(x0 + 440, -26);
      g.closePath();
      g.fill();
      poly(
        g,
        [
          [x0 + 170, -74],
          [x0 + 210, -96],
          [x0 + 262, -94],
          [x0 + 300, -74],
        ],
        glassGrad(g, -96, -74, night),
      );
      R(g, x0 + 10, -40, 420, 10, 3, C.shade(col, -0.3));
      const wr = 28,
        rot = spin(o, wr);
      wheel(g, x0 + 90, -wr, wr, rot);
      wheel(g, x0 + 360, -wr, wr, rot);
    },
    { tags: [MT.XE, MT.SANG], lights: headLights(214, -48) },
  );
  A(
    MT.LIMOUSINE,
    MT.XE_LIMOUSINE,
    MT.VEHICLE,
    [600, 125],
    (g, o) => {
      const col = o.color || MT.VALUE_16181C,
        night = !!o.night,
        x0 = -300;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x0 + 6, -22);
      g.lineTo(x0 + 2, -64);
      g.lineTo(x0 + 90, -80);
      g.lineTo(x0 + 130, -118);
      g.lineTo(x0 + 470, -118);
      g.lineTo(x0 + 510, -82);
      g.lineTo(x0 + 594, -70);
      g.lineTo(x0 + 598, -22);
      g.closePath();
      g.fill();
      for (let i = 0; i < 4; i++)
        poly(
          g,
          [
            [x0 + 140 + i * 84, -112],
            [x0 + 216 + i * 84, -112],
            [x0 + 216 + i * 84, -84],
            [x0 + 140 + i * 84, -84],
          ],
          glassGrad(g, -112, -84, night),
        );
      R(g, x0 + 6, -40, 590, 6, 2, MT.VALUE_9AA0A6);
      const wr = 30,
        rot = spin(o, wr);
      wheel(g, x0 + 100, -wr, wr, rot);
      wheel(g, x0 + 500, -wr, wr, rot);
    },
    { tags: [MT.XE, MT.SANG], lights: headLights(294, -60) },
  );
  A(
    MT.TRACTOR,
    MT.MAY_CAY,
    MT.VEHICLE,
    [340, 230],
    (g, o) => {
      const col = o.color || MT.C8452A,
        x0 = -170;
      R(g, x0 + 40, -150, 220, 70, 8, col);
      R(g, x0 + 150, -230, 100, 90, 4, MT.VALUE_2A2D33);
      poly(
        g,
        [
          [x0 + 158, -222],
          [x0 + 242, -222],
          [x0 + 242, -152],
          [x0 + 158, -152],
        ],
        glassGrad(g, -222, -152, !!o.night),
      );
      R(g, x0 + 70, -210, 12, 64, 0, MT.VALUE_333);
      const rot = spin(o, 70);
      wheel(g, x0 + 230, -70, 70, rot, { rim: MT.D9A22A, spokes: 8 });
      wheel(g, x0 + 40, -40, 40, spin(o, 40), { rim: MT.D9A22A });
    },
    { tags: [MT.XE, MT.NONG_NGHIEP] },
  );
  A(
    MT.CYCLO,
    MT.XICH_LO,
    MT.VEHICLE,
    [300, 190],
    (g, o) => {
      const col = o.color || MT.VALUE_2F5F8A,
        x0 = -150,
        rot = spin(o, 34);
      R(g, x0 + 160, -150, 110, 70, 14, col);
      R(g, x0 + 150, -170, 40, 90, 10, C.shade(col, -0.2));
      R(g, x0 + 150, -184, 130, 18, 8, MT.E0C46A);
      g.strokeStyle = MT.VALUE_2A2A2A;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x0 + 40, -34);
      g.lineTo(x0 + 120, -96);
      g.lineTo(x0 + 220, -80);
      g.moveTo(x0 + 70, -150);
      g.lineTo(x0 + 120, -96);
      g.stroke();
      R(g, x0 + 50, -158, 44, 10, 4, MT.VALUE_1A1A1A);
      wheel(g, x0 + 40, -34, 34, rot, { ring: true, spokes: 12 });
      wheel(g, x0 + 230, -34, 34, rot, { ring: true, spokes: 12 });
    },
    { tags: [MT.XE, MT.VIET_NAM, MT.XICH_LO_2], seat: { driver: [-90, -150], passenger: [70, -120] } },
  );
  A(
    MT.VESPA,
    MT.XE_VESPA_CO,
    MT.VEHICLE,
    [230, 150],
    (g, o) => {
      const col = o.color || MT.VALUE_9FD0C8,
        rot = spin(o, 26);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-100, -40);
      g.quadraticCurveTo(-110, -110, -40, -110);
      g.lineTo(10, -100);
      g.lineTo(30, -40);
      g.closePath();
      g.fill();
      R(g, 40, -140, 18, 100, 6, col);
      R(g, 30, -150, 60, 10, 4, MT.VALUE_222);
      R(g, -80, -122, 80, 14, 6, MT.VALUE_3A2A22);
      wheel(g, -70, -26, 26, rot);
      wheel(g, 66, -26, 26, rot);
    },
    { tags: [MT.XE, MT.XE_MAY], seat: { driver: [-30, -110], passenger: [-80, -114] } },
  );
  A(
    MT.HOT_AIR_BALLOON,
    MT.KHINH_KHI_CAU,
    MT.AIRCRAFT,
    [260, 420],
    (g, o) => {
      const cols = o.colors || [MT.E2553A, MT.F2C14E, MT.VALUE_3A7BD5];
      const y = -300 + Math.sin((o.t || 0) * 0.8) * 8;
      g.save();
      g.beginPath();
      g.ellipse(0, y, 130, 150, 0, 0, PI * 2);
      g.clip();
      for (let i = 0; i < 7; i++) R(g, -130 + i * 37.2, y - 150, 38, 300, 0, cols[i % cols.length]);
      const shade = g.createLinearGradient(-130, 0, 130, 0);
      shade.addColorStop(0, MT.RGBA_255_255_255_0_18);
      shade.addColorStop(0.6, MT.RGBA_0_0_0_0);
      shade.addColorStop(1, MT.RGBA_0_0_0_0_28);
      g.fillStyle = shade;
      g.fillRect(-130, y - 150, 260, 300);
      g.restore();
      poly(
        g,
        [
          [-62, y + 128],
          [62, y + 128],
          [24, y + 186],
          [-24, y + 186],
        ],
        C.shade(cols[0], -0.25),
      );
      g.strokeStyle = MT.VALUE_5A4A3A;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-24, y + 186);
      g.lineTo(-20, y + 236);
      g.moveTo(24, y + 186);
      g.lineTo(20, y + 236);
      g.stroke();
      R(g, -26, y + 236, 52, 40, 4, MT.VALUE_8A5A32);
    },
    { tags: [MT.BAY, MT.KHINH_KHI_CAU_2] },
  );
  A(
    MT.DRONE,
    MT.DRONE_FLYCAM,
    MT.AIRCRAFT,
    [140, 50],
    (g, o) => {
      const y = -40 + Math.sin((o.t || 0) * 3) * 6;
      R(g, -30, y - 10, 60, 20, 8, o.color || MT.VALUE_2A2D33);
      g.strokeStyle = MT.VALUE_2A2D33;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(-60, y - 14);
      g.lineTo(60, y - 14);
      g.stroke();
      const k = Math.abs(Math.sin((o.t || 0) * 40));
      ell(g, -60, y - 20, 34 * k + 4, 3, MT.RGBA_60_60_70_0_6);
      ell(g, 60, y - 20, 34 * (1 - k) + 4, 3, MT.RGBA_60_60_70_0_6);
      circle(g, 0, y + 12, 7, MT.VALUE_111);
    },
    { tags: [MT.BAY, MT.FLYCAM] },
  );
  A(
    MT.SPEEDBOAT,
    MT.CA_NO,
    MT.WATERCRAFT,
    [380, 120],
    (g, o) => {
      const col = o.color || MT.F0F0EC;
      const b = Math.sin((o.t || 0) * 3) * 3;
      g.save();
      g.translate(0, b);
      poly(
        g,
        [
          [-190, -60],
          [170, -60],
          [190, -40],
          [140, 0],
          [-180, 0],
        ],
        col,
      );
      R(g, -190, -30, 360, 10, 0, o.stripe || MT.VALUE_1F5FA8);
      poly(
        g,
        [
          [-40, -60],
          [40, -60],
          [60, -96],
          [-10, -96],
        ],
        glassGrad(g, -96, -60, !!o.night),
      );
      g.restore();
      if (o.distance || o.speed) {
        g.fillStyle = MT.RGBA_255_255_255_0_55;
        for (let i = 0; i < 6; i++) ell(g, -200 - i * 30, 2, 20 - i * 2, 4, MT.RGBA_255_255_255_0_5);
      }
    },
    { tags: [MT.THUYEN, MT.BIEN] },
  );
  A(
    MT.FISHING_BOAT,
    MT.THUYEN_DANH_CA,
    MT.WATERCRAFT,
    [420, 260],
    (g, o) => {
      const col = o.color || MT.VALUE_2F6B8A;
      const b = Math.sin((o.t || 0) * 2) * 4;
      g.save();
      g.translate(0, b);
      poly(
        g,
        [
          [-210, -70],
          [210, -90],
          [170, 0],
          [-170, 0],
        ],
        col,
      );
      R(g, -200, -80, 400, 12, 0, MT.C4402A);
      R(g, -40, -150, 110, 76, 4, MT.E9E2CC);
      R(g, -30, -140, 30, 26, 0, MT.VALUE_3A4A5A);
      R(g, 120, -260, 6, 180, 0, MT.VALUE_5A4A3A);
      g.restore();
    },
    { tags: [MT.THUYEN, MT.BIEN, MT.NGU_DAN] },
  );
  A(
    MT.BASKET_BOAT,
    MT.THUYEN_THUNG,
    MT.WATERCRAFT,
    [200, 80],
    (g, o) => {
      const b = Math.sin((o.t || 0) * 2.2) * 3;
      g.save();
      g.translate(0, b);
      g.fillStyle = o.color || MT.VALUE_6A5236;
      g.beginPath();
      g.ellipse(0, -30, 100, 34, 0, 0, PI);
      g.fill();
      R(g, -102, -36, 204, 10, 5, C.shade(o.color || MT.VALUE_6A5236, -0.25));
      g.strokeStyle = MT.RGBA_0_0_0_0_2;
      g.lineWidth = 2;
      for (let i = -80; i <= 80; i += 20) {
        g.beginPath();
        g.moveTo(i, -26);
        g.lineTo(i * 0.7, 2);
        g.stroke();
      }
      g.restore();
    },
    { tags: [MT.THUYEN, MT.VIET_NAM] },
  );
  const { foliage, trunk } = K;
  A(
    MT.TREE_OAK,
    MT.CAY_SOI_LON,
    MT.NATURE,
    [420, 460],
    (g, o) => {
      trunk(g, 230, 28, o.trunk || MT.VALUE_4A3626);
      g.rotate(K.sway(o, 0.008));
      foliage(g, -60, -300, 150, 110, 3 + (o.seed || 0), o.color || MT.VALUE_3D6A35, 18);
      foliage(g, 80, -320, 150, 120, 7 + (o.seed || 0), o.color || MT.VALUE_3D6A35, 18);
      foliage(g, 0, -400, 140, 90, 11 + (o.seed || 0), C.shade(o.color || MT.VALUE_3D6A35, 0.05), 14);
    },
    { tags: [MT.CAY] },
  );
  A(
    MT.TREE_BIRCH,
    MT.CAY_BACH_DUONG,
    MT.NATURE,
    [180, 420],
    (g, o) => {
      R(g, -9, -380, 18, 380, 4, MT.E9E6DD);
      const r = U.rng(5 + (o.seed || 0));
      for (let i = 0; i < 12; i++) R(g, -9, -360 + r() * 340, 8 + r() * 10, 4, 0, MT.VALUE_2A2A2A);
      g.rotate(K.sway(o, 0.01));
      foliage(g, 0, -340, 80, 110, 9 + (o.seed || 0), o.color || MT.VALUE_9CB54A, 14);
    },
    { tags: [MT.CAY] },
  );
  A(
    MT.TREE_WILLOW,
    MT.CAY_LIEU,
    MT.NATURE,
    [380, 400],
    (g, o) => {
      trunk(g, 200, 22, MT.VALUE_4A3A2A);
      const col = o.color || MT.VALUE_6F9A4A;
      g.strokeStyle = col;
      g.lineCap = MT.ROUND;
      const r = U.rng(3 + (o.seed || 0));
      const sw = Math.sin((o.t || 0) * 1.1) * 6;
      for (let i = 0; i < 40; i++) {
        const x = -170 + r() * 340,
          len = 140 + r() * 140;
        g.lineWidth = 5 + r() * 4;
        g.beginPath();
        g.moveTo(x * 0.6, -330 + Math.abs(x) * 0.3);
        g.quadraticCurveTo(x, -260, x + sw, -330 + len + Math.abs(x) * 0.3);
        g.stroke();
      }
      foliage(g, 0, -320, 160, 60, 21, col, 12);
    },
    { tags: [MT.CAY, MT.VEN_HO] },
  );
  A(
    MT.TREE_AUTUMN,
    MT.CAY_MUA_THU,
    MT.NATURE,
    [300, 400],
    (g, o) => {
      trunk(g, 200, 18, MT.VALUE_4A3626);
      g.rotate(K.sway(o));
      foliage(g, 0, -270, 140, 120, 31 + (o.seed || 0), o.color || MT.C9762E, 18);
    },
    { tags: [MT.CAY, MT.MUA_THU] },
  );
  A(
    MT.TREE_BLOSSOM,
    MT.CAY_HOA_DAO,
    MT.NATURE,
    [320, 380],
    (g, o) => {
      g.strokeStyle = MT.VALUE_4A2F26;
      g.lineCap = MT.ROUND;
      const r = U.rng(8 + (o.seed || 0));
      g.lineWidth = 18;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(-10, -120, 10, -200);
      g.stroke();
      const tips = [];
      for (let i = 0; i < 7; i++) {
        const a = -PI / 2 + (r() - 0.5) * 2.2,
          l = 90 + r() * 90;
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(10, -200);
        const tx = 10 + Math.cos(a) * l,
          ty = -200 + Math.sin(a) * l;
        g.lineTo(tx, ty);
        g.stroke();
        tips.push([tx, ty]);
      }
      const col = o.color || MT.F2A7C0;
      for (const [x, y] of tips) foliage(g, x, y, 60, 46, Math.round(x * 7 + y), col, 9);
    },
    { tags: [MT.CAY, MT.TET, MT.HOA_2] },
  );
  A(
    MT.BANANA_TREE,
    MT.CAY_CHUOI,
    MT.NATURE,
    [260, 340],
    (g, o) => {
      R(g, -12, -220, 24, 220, 8, MT.VALUE_7A8A4A);
      const col = o.color || MT.VALUE_5F9A3A;
      const sw = K.sway(o, 0.05);
      for (let i = 0; i < 6; i++) {
        const a = -PI / 2 + (i - 2.5) * 0.5 + sw;
        g.save();
        g.translate(0, -220);
        g.rotate(a + PI / 2);
        g.fillStyle = i % 2 ? col : C.shade(col, -0.15);
        g.beginPath();
        g.ellipse(0, -80, 30, 90, 0, 0, PI * 2);
        g.fill();
        g.restore();
      }
    },
    { tags: [MT.CAY, MT.VIET_NAM, MT.NHIET_DOI] },
  );
  A(
    MT.BAMBOO,
    MT.BUI_TRE,
    MT.NATURE,
    [280, 520],
    (g, o) => {
      const col = o.color || MT.VALUE_6A9A3A;
      const r = U.rng(4 + (o.seed || 0));
      const sw = Math.sin((o.t || 0) * 1.2) * 10;
      for (let i = 0; i < 9; i++) {
        const x = -110 + i * 28 + r() * 10,
          h = 380 + r() * 140;
        g.strokeStyle = C.shade(col, (r() - 0.5) * 0.3);
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(x, 0);
        g.quadraticCurveTo(x, -h * 0.6, x + sw * (h / 500), -h);
        g.stroke();
        g.strokeStyle = MT.RGBA_0_0_0_0_25;
        g.lineWidth = 10;
        for (let y = -60; y > -h + 40; y -= 70) {
          g.beginPath();
          g.moveTo(x - 5, y);
          g.lineTo(x + 5, y);
          g.stroke();
        }
      }
      foliage(g, sw * 0.6, -440, 150, 90, 13, C.shade(col, -0.05), 16);
    },
    { tags: [MT.CAY, MT.VIET_NAM, MT.LANG_QUE] },
  );
  A(
    MT.CACTUS,
    MT.XUONG_RONG,
    MT.NATURE,
    [160, 260],
    (g, o) => {
      const col = o.color || MT.VALUE_4A7A46;
      R(g, -22, -240, 44, 240, 22, col);
      R(g, -80, -170, 30, 90, 15, col);
      R(g, -80, -100, 70, 26, 13, col);
      R(g, 50, -200, 30, 80, 15, col);
      R(g, 20, -140, 60, 26, 13, col);
      R(g, -6, -230, 6, 220, 3, C.shade(col, 0.15));
    },
    { tags: [MT.SA_MAC] },
  );
  A(
    MT.RICE_FIELD,
    MT.RUONG_LUA,
    MT.NATURE,
    [600, 70],
    (g, o) => {
      const col = o.color || MT.VALUE_8FBF4A;
      const r = U.rng(2 + (o.seed || 0));
      const sw = Math.sin((o.t || 0) * 1.4);
      g.strokeStyle = col;
      g.lineWidth = 3;
      for (let i = 0; i < 90; i++) {
        const x = -300 + r() * 600,
          h = 40 + r() * 30;
        g.strokeStyle = C.shade(col, (r() - 0.5) * 0.25);
        g.beginPath();
        g.moveTo(x, 0);
        g.quadraticCurveTo(x + 2, -h * 0.5, x + 6 + sw * 4, -h);
        g.stroke();
      }
    },
    { tags: [MT.LUA_2, MT.VIET_NAM, MT.RUONG] },
  );
  A(
    MT.LOTUS,
    MT.HOA_SEN,
    MT.NATURE,
    [120, 90],
    (g, o) => {
      ell(g, -30, -6, 40, 10, MT.VALUE_3E7A3A);
      ell(g, 34, -4, 30, 8, MT.VALUE_447F3E);
      R(g, -3, -60, 6, 54, 2, MT.VALUE_3E6A34);
      const col = o.color || MT.F0A1B8;
      for (let i = -2; i <= 2; i++) {
        g.save();
        g.translate(0, -60);
        g.rotate(i * 0.35);
        ell(g, 0, -20, 11, 24, i % 2 ? col : C.shade(col, 0.15));
        g.restore();
      }
    },
    { tags: [MT.HOA_2, MT.VIET_NAM, MT.HO] },
  );
  A(
    MT.CAMPFIRE,
    MT.LUA_TRAI,
    MT.FX,
    [120, 140],
    (g, o) => {
      const t = o.t || 0;
      for (let i = 0; i < 4; i++) R(g, -50 + i * 6, -14 - i * 2, 100 - i * 12, 12, 6, MT.VALUE_5A3A22);
      for (let i = 0; i < 5; i++) {
        const h = 70 + Math.sin(t * 9 + i * 1.7) * 18;
        g.fillStyle = i % 2 ? MT.RGBA_255_140_40_0_85 : MT.RGBA_255_210_90_0_9;
        g.beginPath();
        g.moveTo(-30 + i * 15, -14);
        g.quadraticCurveTo(-36 + i * 15, -h * 0.5, -22 + i * 15 + Math.sin(t * 6 + i) * 6, -h);
        g.quadraticCurveTo(-8 + i * 15, -h * 0.5, -14 + i * 15, -14);
        g.fill();
      }
    },
    { tags: [MT.LUA_3], lights: () => [{ type: MT.GLOW, x: 0, y: -50, r: 260, color: MT.FF9A40, alpha: 0.55 }] },
  );
  const legs4 = (g, o, xs, y0, len, w, col, speed = 5) => {
    const ph = o.distance != null ? o.distance / 30 : (o.t || 0) * speed * (o.moving === false ? 0 : 1);
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = MT.ROUND;
    xs.forEach((x, i) => {
      const a = Math.sin(ph + (i % 2 ? PI : 0) + (i > 1 ? PI / 2 : 0)) * 0.35;
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x + Math.sin(a) * len, y0 + Math.cos(a) * len);
      g.stroke();
    });
  };
  A(
    MT.DOG,
    MT.CHO,
    MT.ANIMAL,
    [140, 90],
    (g, o) => {
      const col = o.color || MT.VALUE_8A5A32;
      legs4(g, o, [-40, -28, 30, 42], -44, 44, 9, C.shade(col, -0.15), 8);
      ell(g, 0, -56, 56, 22, col);
      circle(g, 58, -76, 18, col);
      ell(g, 74, -70, 14, 8, col);
      ell(g, 50, -90, 6, 12, C.shade(col, -0.3), -0.3);
      circle(g, 84, -72, 3.5, MT.VALUE_111);
      g.strokeStyle = col;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(-54, -62);
      g.quadraticCurveTo(-74, -80 + Math.sin((o.t || 0) * 12) * 6, -70, -96);
      g.stroke();
    },
    { tags: [MT.THU_2, MT.CHO_2] },
  );
  A(
    MT.CAT,
    MT.MEO,
    MT.ANIMAL,
    [100, 70],
    (g, o) => {
      const col = o.color || MT.VALUE_3A3A3E;
      legs4(g, o, [-26, -18, 20, 28], -30, 30, 6, col, 7);
      ell(g, 0, -40, 38, 15, col);
      circle(g, 40, -56, 13, col);
      poly(
        g,
        [
          [32, -66],
          [36, -82],
          [42, -68],
        ],
        col,
      );
      poly(
        g,
        [
          [42, -68],
          [50, -80],
          [52, -64],
        ],
        col,
      );
      g.strokeStyle = col;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(-36, -44);
      g.quadraticCurveTo(-60, -50, -56, -80 + Math.sin((o.t || 0) * 3) * 4);
      g.stroke();
    },
    { tags: [MT.THU_2, MT.MEO_2] },
  );
  A(
    MT.HORSE,
    MT.NGUA,
    MT.ANIMAL,
    [260, 230],
    (g, o) => {
      const col = o.color || MT.VALUE_6A4228;
      legs4(g, o, [-70, -56, 58, 72], -110, 108, 13, C.shade(col, -0.15), 6);
      ell(g, 0, -130, 100, 42, col);
      poly(
        g,
        [
          [70, -150],
          [110, -230],
          [140, -220],
          [110, -130],
        ],
        col,
      );
      ell(g, 140, -214, 34, 18, col, 0.5);
      g.strokeStyle = C.shade(col, -0.45);
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(84, -168);
      g.lineTo(112, -232);
      g.stroke();
      g.beginPath();
      g.moveTo(-96, -136);
      g.quadraticCurveTo(-130, -110 + Math.sin((o.t || 0) * 4) * 8, -126, -60);
      g.stroke();
    },
    { tags: [MT.THU_2, MT.NGUA_2] },
  );
  const bovine = (g, o, col, horns) => {
    legs4(g, o, [-70, -56, 54, 68], -86, 86, 15, C.shade(col, -0.15), 3);
    ell(g, 0, -108, 104, 46, col);
    ell(g, 116, -110, 36, 26, col, 0.3);
    ell(g, 140, -98, 20, 16, C.shade(col, 0.15));
    if (horns) {
      g.strokeStyle = horns;
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(108, -128);
      g.quadraticCurveTo(70, -170, 112, -176);
      g.stroke();
    }
    g.strokeStyle = col;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-100, -116);
    g.quadraticCurveTo(-120, -80, -112, -56 + Math.sin((o.t || 0) * 3) * 4);
    g.stroke();
  };
  A(
    MT.COW,
    MT.BO,
    MT.ANIMAL,
    [260, 170],
    (g, o) => {
      bovine(g, o, o.color || MT.E9E3D8, MT.D8D0BC);
      const r = U.rng(6);
      for (let i = 0; i < 5; i++) ell(g, -70 + r() * 140, -120 + r() * 30, 18 + r() * 16, 12 + r() * 10, MT.VALUE_2A2522, r());
    },
    { tags: [MT.THU_2, MT.BO_2, MT.NONG_TRAI] },
  );
  A(MT.WATER_BUFFALO, MT.TRAU, MT.ANIMAL, [270, 180], (g, o) => bovine(g, o, o.color || MT.VALUE_3A3836, MT.CFC6B0), { tags: [MT.THU_2, MT.TRAU_2, MT.VIET_NAM, MT.LANG_QUE] });
  A(
    MT.CHICKEN,
    MT.GA,
    MT.ANIMAL,
    [60, 70],
    (g, o) => {
      const col = o.color || MT.C96A2A;
      const peck = Math.max(0, Math.sin((o.t || 0) * 3)) * 10;
      g.strokeStyle = MT.D9A22A;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-4, -22);
      g.lineTo(-6, 0);
      g.moveTo(6, -22);
      g.lineTo(8, 0);
      g.stroke();
      ell(g, 0, -36, 24, 18, col);
      circle(g, 22, -56 + peck, 10, col);
      poly(
        g,
        [
          [30, -58 + peck],
          [40, -54 + peck],
          [30, -50 + peck],
        ],
        MT.E8B02A,
      );
      poly(
        g,
        [
          [16, -66 + peck],
          [22, -74 + peck],
          [26, -64 + peck],
        ],
        MT.C4241A,
      );
      poly(
        g,
        [
          [-20, -40],
          [-36, -66],
          [-14, -48],
        ],
        C.shade(col, -0.3),
      );
    },
    { tags: [MT.GA_2, MT.NONG_TRAI, MT.VIET_NAM] },
  );
  A(
    MT.BIRD_FLOCK,
    MT.DAN_CHIM,
    MT.ANIMAL,
    [400, 160],
    (g, o) => {
      const r = U.rng(3 + (o.seed || 0));
      for (let i = 0; i < 9; i++) {
        const x = -180 + r() * 360,
          y = -40 - r() * 120;
        g.save();
        g.translate(x + Math.sin((o.t || 0) * 0.7 + i) * 8, y);
        g.scale(0.6 + r() * 0.5, 0.6 + r() * 0.5);
        ME.registry.assets.bird.draw(g, { t: (o.t || 0) + i * 0.3, color: o.color });
        g.restore();
      }
    },
    { tags: [MT.CHIM] },
  );
  const windows = (g, x0, y0, cols, rows, w, h, gx, gy, night, seed, lit = 0.35) => {
    const r = U.rng(seed || 3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) R(g, x0 + i * gx, y0 + j * gy, w, h, 0, night ? (r() < lit ? MT.F3C97A : MT.VALUE_1D2533) : r() < 0.15 ? MT.VALUE_7D97AD : MT.VALUE_3D5266);
  };
  A(
    MT.SKYSCRAPER,
    MT.TOA_NHA_CHOC_TROI,
    MT.URBAN,
    [300, 1100],
    (g, o) => {
      const col = o.color || MT.VALUE_5F7488;
      R(g, -150, -1050, 300, 1050, 0, col);
      R(g, -150, -1050, 70, 1050, 0, C.shade(col, -0.12));
      windows(g, -136, -1030, 9, 48, 18, 12, 31, 21, !!o.night, 4, 0.3);
      R(g, -20, -1130, 6, 80, 0, MT.VALUE_3A3A3A);
    },
    { tags: [MT.THANH_PHO, MT.HIEN_DAI] },
  );
  A(
    MT.APARTMENT_BLOCK,
    MT.CHUNG_CU,
    MT.URBAN,
    [460, 620],
    (g, o) => {
      const col = o.color || MT.CFC4B2;
      R(g, -230, -600, 460, 600, 0, col);
      windows(g, -205, -570, 8, 11, 34, 28, 54, 52, !!o.night, 8, 0.4);
      for (let j = 0; j < 11; j++) R(g, -215, -540 + j * 52, 430, 5, 0, C.shade(col, -0.2));
    },
    { tags: [MT.NHA, MT.CHUNG_CU_2] },
  );
  A(
    MT.TUBE_HOUSE,
    MT.NHA_ONG_PHO_VIET,
    MT.URBAN,
    [160, 560],
    (g, o) => {
      const cols = [MT.E8C96A, MT.D9E3C4, MT.F2B8A0, MT.BCD6E0, MT.E9E1CF];
      const col = o.color || cols[(o.seed || 0) % cols.length];
      const h = o.h || 520;
      R(g, -80, -h, 160, h, 0, col);
      R(g, -80, -h, 160, 14, 0, C.shade(col, -0.25));
      for (let y = -h + 50; y < -150; y += 110) {
        R(g, -56, y, 112, 70, 0, o.night ? MT.F2C374 : MT.VALUE_4A5A6A);
        R(g, -70, y + 70, 140, 10, 0, C.shade(col, -0.3));
        g.strokeStyle = MT.VALUE_2A2A2A;
        g.lineWidth = 2;
        for (let x = -66; x <= 66; x += 12) {
          g.beginPath();
          g.moveTo(x, y + 52);
          g.lineTo(x, y + 70);
          g.stroke();
        }
      }
      R(g, -70, -140, 140, 140, 0, MT.VALUE_3A3430);
      for (let x = -66; x < 66; x += 10) R(g, x, -138, 2, 136, 0, MT.VALUE_5A524A);
      R(g, -76, -170, 152, 24, 2, o.sign || MT.B8322A);
    },
    { tags: [MT.NHA, MT.VIET_NAM, MT.PHO] },
  );
  A(
    MT.PAGODA,
    MT.CHUA_DINH,
    MT.URBAN,
    [520, 420],
    (g, o) => {
      const roof = o.roof || MT.VALUE_8A3A2A,
        wall = o.color || MT.E9D8B0;
      R(g, -200, -170, 400, 170, 0, wall);
      for (let x = -170; x <= 170; x += 85) R(g, x - 8, -170, 16, 170, 0, MT.VALUE_7A2A22);
      const eave = (y, w, h) => {
        g.fillStyle = roof;
        g.beginPath();
        g.moveTo(-w - 30, y - 6);
        g.quadraticCurveTo(-w, y, -w + 30, y - 4);
        g.lineTo(w - 30, y - 4);
        g.quadraticCurveTo(w, y, w + 30, y - 6);
        g.lineTo(w - 40, y - h);
        g.lineTo(-w + 40, y - h);
        g.closePath();
        g.fill();
      };
      eave(-170, 260, 80);
      R(g, -150, -300, 300, 60, 0, wall);
      eave(-290, 200, 90);
      R(g, -30, -120, 60, 120, 0, MT.VALUE_4A2A1A);
      circle(g, 0, -330, 10, MT.E3B24A);
    },
    { tags: [MT.CHUA, MT.VIET_NAM, MT.DINH] },
  );
  A(
    MT.HOSPITAL,
    MT.BENH_VIEN,
    MT.URBAN,
    [560, 420],
    (g, o) => {
      const col = o.color || MT.EEF0EE;
      R(g, -280, -400, 560, 400, 0, col);
      windows(g, -250, -370, 9, 5, 34, 30, 56, 64, !!o.night, 12, 0.5);
      R(g, -60, -140, 120, 140, 0, MT.VALUE_7AA5C0);
      R(g, -30, -470, 60, 70, 4, MT.D23A3A);
      R(g, -10, -460, 20, 50, 0, MT.FFF);
      R(g, -25, -445, 50, 20, 0, MT.FFF);
    },
    { tags: [MT.Y_TE, MT.BENH_VIEN_2] },
  );
  A(
    MT.SCHOOL,
    MT.TRUONG_HOC,
    MT.URBAN,
    [560, 360],
    (g, o) => {
      const col = o.color || MT.F0D27A;
      R(g, -280, -300, 560, 300, 0, col);
      windows(g, -250, -270, 8, 2, 42, 50, 64, 110, !!o.night, 5, 0.3);
      poly(
        g,
        [
          [-300, -295],
          [0, -370],
          [300, -295],
        ],
        MT.VALUE_9A3A2A,
      );
      R(g, -50, -130, 100, 130, 0, MT.VALUE_6A4A32);
      R(g, -2, -440, 4, 80, 0, MT.VALUE_555);
      R(g, 2, -440, 50, 30, 0, MT.D42A2A);
    },
    { tags: [MT.TRUONG_HOC_2] },
  );
  A(
    MT.FACTORY,
    MT.NHA_MAY,
    MT.URBAN,
    [620, 520],
    (g, o) => {
      const col = o.color || MT.VALUE_8A7A6A;
      R(g, -310, -220, 620, 220, 0, col);
      for (let i = 0; i < 4; i++)
        poly(
          g,
          [
            [-310 + i * 155, -220],
            [-310 + i * 155, -300],
            [-155 + i * 155, -220],
          ],
          C.shade(col, -0.15),
        );
      R(g, 180, -500, 50, 300, 0, MT.VALUE_6A5A4A);
      R(g, 250, -440, 40, 240, 0, MT.VALUE_6A5A4A);
      const t = o.t || 0;
      for (let i = 0; i < 5; i++) circle(g, 205 + Math.sin(t + i) * 10 + i * 8, -520 - i * 30 - ((t * 20) % 30), 20 + i * 6, MF.RGBA_120_120_120(`${0.35 - i * 0.05}`));
      windows(g, -290, -180, 10, 1, 40, 40, 56, 0, !!o.night, 9, 0.5);
    },
    { tags: [MT.NHA_MAY_2, MT.CONG_NGHIEP] },
  );
  A(
    MT.LIGHTHOUSE,
    MT.NGON_HAI_DANG,
    MT.URBAN,
    [160, 560],
    (g, o) => {
      poly(
        g,
        [
          [-60, 0],
          [60, 0],
          [36, -460],
          [-36, -460],
        ],
        MT.EFEFE9,
      );
      for (let i = 0; i < 4; i++)
        poly(
          g,
          [
            [-58 + i * 6, -i * 120 - 60],
            [58 - i * 6, -i * 120 - 60],
            [55 - i * 6, -i * 120 - 110],
            [-55 + i * 6, -i * 120 - 110],
          ],
          MT.C43A2A,
        );
      R(g, -44, -530, 88, 70, 4, MT.VALUE_2A2D33);
      R(g, -34, -520, 68, 48, 0, o.night ? MT.FFF1B0 : MT.VALUE_9FB4C4);
      poly(
        g,
        [
          [-50, -530],
          [50, -530],
          [0, -580],
        ],
        MT.VALUE_2A2D33,
      );
    },
    {
      tags: [MT.BIEN, MT.HAI_DANG],
      lights: (o) =>
        o.night
          ? [
              { type: MT.BEAM, x: 0, y: -500, angle: Math.sin((o.t || 0) * 0.8) * 0.6, len: 1600, spread: 0.08, color: MT.FFF2C0, alpha: 0.45 },
              { type: MT.GLOW, x: 0, y: -500, r: 90, color: MT.FFF2C0, alpha: 0.9 },
            ]
          : [],
    },
  );
  A(
    MT.WINDMILL,
    MT.COI_XAY_GIO,
    MT.URBAN,
    [360, 520],
    (g, o) => {
      poly(
        g,
        [
          [-60, 0],
          [60, 0],
          [36, -340],
          [-36, -340],
        ],
        o.color || MT.D9CDB4,
      );
      poly(
        g,
        [
          [-46, -330],
          [46, -330],
          [0, -390],
        ],
        MT.VALUE_6A4A32,
      );
      const a = (o.t || 0) * 1.2;
      g.save();
      g.translate(0, -340);
      for (let i = 0; i < 4; i++) {
        g.save();
        g.rotate(a + (i * PI) / 2);
        R(g, -8, -200, 16, 200, 2, MT.VALUE_5A4A3A);
        R(g, 8, -190, 40, 160, 0, MT.RGBA_240_236_224_0_9);
        g.restore();
      }
      circle(g, 0, 0, 12, MT.VALUE_3A2A1A);
      g.restore();
    },
    { tags: [MT.NONG_THON] },
  );
  A(
    MT.BRIDGE_TRUSS,
    MT.CAU_THEP,
    MT.URBAN,
    [900, 260],
    (g, o) => {
      const col = o.color || MT.VALUE_6A7A8A;
      R(g, -450, -40, 900, 24, 0, C.shade(col, -0.2));
      g.strokeStyle = col;
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(-450, -40);
      g.quadraticCurveTo(0, -300, 450, -40);
      g.stroke();
      g.lineWidth = 4;
      for (let x = -400; x <= 400; x += 50) {
        const y = -40 - (1 - Math.pow(x / 450, 2)) * 130;
        g.beginPath();
        g.moveTo(x, -40);
        g.lineTo(x, y);
        g.stroke();
      }
      R(g, -460, -16, 40, 220, 0, MT.VALUE_5A5A5A);
      R(g, 420, -16, 40, 220, 0, MT.VALUE_5A5A5A);
    },
    { tags: [MT.CAU, MT.SONG] },
  );
  A(
    MT.GAS_STATION,
    MT.CAY_XANG,
    MT.URBAN,
    [520, 300],
    (g, o) => {
      R(g, -260, -280, 520, 40, 0, o.color || MT.D23A2A);
      R(g, -240, -240, 14, 240, 0, MT.CCC);
      R(g, 226, -240, 14, 240, 0, MT.CCC);
      for (const x of [-100, 60]) {
        R(g, x, -130, 50, 130, 6, MT.EEE);
        R(g, x + 8, -118, 34, 30, 0, MT.VALUE_2A3A4A);
      }
    },
    { tags: [MT.XANG, MT.DUONG] },
  );
  A(
    MT.TENT,
    MT.LEU_TRAI,
    MT.URBAN,
    [240, 160],
    (g, o) => {
      const col = o.color || MT.D0702A;
      poly(
        g,
        [
          [-120, 0],
          [0, -150],
          [120, 0],
        ],
        col,
      );
      poly(
        g,
        [
          [0, -150],
          [120, 0],
          [20, 0],
        ],
        C.shade(col, -0.2),
      );
      poly(
        g,
        [
          [-20, 0],
          [0, -90],
          [20, 0],
        ],
        MT.VALUE_2A1A10,
      );
    },
    { tags: [MT.CAM_TRAI] },
  );
  A(
    MT.BUS_STOP,
    MT.TRAM_XE_BUYT,
    MT.STREET,
    [300, 260],
    (g) => {
      R(g, -150, -250, 300, 14, 0, MT.VALUE_3A4A5A);
      R(g, -140, -236, 8, 236, 0, MT.VALUE_555);
      R(g, 132, -236, 8, 236, 0, MT.VALUE_555);
      R(g, -130, -230, 260, 150, 0, MT.RGBA_170_200_220_0_35);
      R(g, -100, -70, 200, 12, 3, MT.VALUE_6A4A32);
      R(g, 150, -320, 8, 320, 0, MT.VALUE_666);
      R(g, 130, -330, 50, 50, 25, MT.VALUE_2A6AD0);
    },
    { tags: [MT.PHO] },
  );
  A(
    MT.FIRE_HYDRANT,
    MT.TRU_CUU_HOA,
    MT.STREET,
    [50, 90],
    (g) => {
      R(g, -18, -80, 36, 80, 8, MT.C4281F);
      R(g, -26, -60, 52, 14, 5, MT.A01F18);
      circle(g, 0, -84, 14, MT.C4281F);
    },
    { tags: [MT.PHO] },
  );
  A(
    MT.TRASH_BIN,
    MT.THUNG_RAC,
    MT.STREET,
    [70, 110],
    (g, o) => {
      poly(
        g,
        [
          [-30, -100],
          [30, -100],
          [26, 0],
          [-26, 0],
        ],
        o.color || MT.VALUE_2A6A3A,
      );
      R(g, -34, -110, 68, 12, 4, C.shade(o.color || MT.VALUE_2A6A3A, -0.2));
    },
    { tags: [MT.PHO] },
  );
  A(
    MT.TRAFFIC_CONE,
    MT.COC_GIAO_THONG,
    MT.STREET,
    [60, 80],
    (g) => {
      poly(
        g,
        [
          [-22, -6],
          [22, -6],
          [6, -76],
          [-6, -76],
        ],
        MT.F2701A,
      );
      poly(
        g,
        [
          [-15, -32],
          [15, -32],
          [11, -48],
          [-11, -48],
        ],
        MT.FFF,
      );
      R(g, -30, -8, 60, 8, 2, MT.VALUE_222);
    },
    { tags: [MT.PHO, MT.CONG_TRUONG] },
  );
  A(
    MT.POLICE_TAPE,
    MT.DAY_PHONG_TOA,
    MT.STREET,
    [500, 120],
    (g, o) => {
      R(g, -250, -110, 10, 110, 0, MT.VALUE_666);
      R(g, 240, -110, 10, 110, 0, MT.VALUE_666);
      g.save();
      g.beginPath();
      g.moveTo(-245, -96);
      g.quadraticCurveTo(0, -80 + Math.sin((o.t || 0) * 2) * 4, 245, -96);
      g.lineWidth = 14;
      g.strokeStyle = MT.F2D02A;
      g.stroke();
      g.setLineDash([18, 18]);
      g.lineWidth = 6;
      g.strokeStyle = MT.VALUE_1A1A1A;
      g.stroke();
      g.restore();
    },
    { tags: [MT.DIEU_TRA, MT.HIEN_TRUONG] },
  );
  A(
    MT.BILLBOARD,
    MT.BIEN_QUANG_CAO,
    MT.STREET,
    [420, 420],
    (g, o) => {
      R(g, -10, -260, 20, 260, 0, MT.VALUE_555);
      R(g, -210, -420, 420, 180, 4, MT.VALUE_2A2D33);
      R(g, -200, -410, 400, 160, 0, o.color || MT.E8C34A);
      R(g, -170, -370, 220, 24, 4, MT.RGBA_0_0_0_0_6);
      R(g, -170, -330, 160, 16, 4, MT.RGBA_0_0_0_0_4);
    },
    { tags: [MT.PHO] },
  );
  A(
    MT.STREET_VENDOR_CART,
    MT.XE_DAY_HANG_RONG,
    MT.STREET,
    [220, 200],
    (g, o) => {
      R(g, -100, -110, 200, 70, 6, o.color || MT.VALUE_3A7A9A);
      R(g, -90, -190, 6, 84, 0, MT.VALUE_555);
      R(g, 84, -190, 6, 84, 0, MT.VALUE_555);
      R(g, -110, -200, 220, 14, 3, MT.D24A2A);
      for (let i = 0; i < 5; i++) circle(g, -70 + i * 34, -124, 12, [MT.E2A23A, MT.C44A2A, MT.VALUE_7AA83A][i % 3]);
      wheel(g, -60, -24, 24, 0, { ring: true, spokes: 8 });
      wheel(g, 60, -24, 24, 0, { ring: true, spokes: 8 });
    },
    { tags: [MT.PHO, MT.VIET_NAM, MT.HANG_RONG] },
  );
  A(
    MT.MARKET_STALL,
    MT.SAP_CHO,
    MT.STREET,
    [320, 260],
    (g, o) => {
      const aw = o.color || MT.VALUE_2A6AD0;
      R(g, -150, -100, 300, 100, 4, MT.VALUE_8A6A4A);
      R(g, -150, -240, 8, 140, 0, MT.VALUE_555);
      R(g, 142, -240, 8, 140, 0, MT.VALUE_555);
      for (let i = 0; i < 6; i++)
        poly(
          g,
          [
            [-160 + i * 53, -250],
            [-107 + i * 53, -250],
            [-110 + i * 53, -210],
            [-157 + i * 53, -210],
          ],
          i % 2 ? aw : MT.EFE7D6,
        );
      const r = U.rng(4);
      for (let i = 0; i < 14; i++) circle(g, -130 + r() * 260, -108 - r() * 14, 10 + r() * 6, [MT.E2A23A, MT.C44A2A, MT.VALUE_7AA83A, MT.E2D23A][Math.floor(r() * 4)]);
    },
    { tags: [MT.CHO_3, MT.VIET_NAM] },
  );
  A(
    MT.LANTERN_STRING,
    MT.DAY_DEN_LONG,
    MT.STREET,
    [600, 140],
    (g, o) => {
      g.strokeStyle = MT.VALUE_2A2A2A;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-300, -130);
      g.quadraticCurveTo(0, -60, 300, -130);
      g.stroke();
      const cols = o.colors || [MT.D42A2A, MT.E8A02A, MT.D42A2A];
      for (let i = 0; i < 8; i++) {
        const x = -262 + i * 75,
          y = -130 + (1 - Math.pow(x / 300, 2)) * 70 + 10;
        ell(g, x, y + 14, 16, 20, cols[i % cols.length]);
        R(g, x - 8, y - 6, 16, 6, 0, MT.E3B24A);
      }
    },
    { tags: [MT.VIET_NAM, MT.TET, MT.LE_HOI], lights: (o) => (o.night ? Array.from({ length: 8 }, (_, i) => ({ type: MT.GLOW, x: -262 + i * 75, y: -86, r: 50, color: MT.FFB050, alpha: 0.6 })) : []) },
  );
  const P = (id, name, size, draw, tags, extra) => A(id, name, MT.PROP, size, draw, Object.assign({ tags: tags || [] }, extra || {}));
  P(
    MT.LAPTOP,
    MT.LAPTOP_2,
    [90, 60],
    (g, o) => {
      poly(
        g,
        [
          [-40, -6],
          [40, -6],
          [46, 0],
          [-46, 0],
        ],
        MT.VALUE_9AA0A6,
      );
      poly(
        g,
        [
          [-38, -6],
          [-30, -58],
          [34, -58],
          [38, -6],
        ],
        MT.VALUE_2A2D33,
      );
      poly(
        g,
        [
          [-33, -10],
          [-26, -53],
          [29, -53],
          [33, -10],
        ],
        o.night ? MT.VALUE_7AB0FF : MT.VALUE_4A7AB0,
      );
    },
    [MT.MAY_TINH_2],
  );
  P(
    MT.SMARTPHONE,
    MT.DIEN_THOAI,
    [30, 56],
    (g) => {
      R(g, -14, -56, 28, 56, 5, MT.VALUE_1A1A1E);
      R(g, -11, -51, 22, 44, 2, MT.VALUE_5A8AD0);
    },
    [MT.DIEN_THOAI_2],
  );
  P(
    MT.CCTV_CAMERA,
    MT.CAMERA_AN_NINH,
    [90, 60],
    (g, o) => {
      R(g, -6, -60, 12, 30, 0, MT.VALUE_777);
      g.save();
      g.translate(0, -40);
      g.rotate(0.2 + Math.sin((o.t || 0) * 0.6) * 0.15);
      R(g, -10, -10, 70, 26, 5, MT.E9E9E6);
      R(g, 56, -6, 12, 18, 2, MT.VALUE_222);
      circle(g, 8, 0, 4, (o.t || 0) % 1 < 0.5 ? MT.FF3030 : MT.VALUE_5A1A1A);
      g.restore();
    },
    [MT.AN_NINH, MT.CAMERA],
  );
  P(
    MT.FLASHLIGHT,
    MT.DEN_PIN,
    [60, 24],
    (g) => {
      R(g, -30, -18, 44, 14, 4, MT.VALUE_2A2D33);
      R(g, 12, -22, 16, 22, 3, MT.VALUE_3A3D43);
    },
    [MT.DEN],
    { lights: () => [{ type: MT.BEAM, x: 28, y: -11, angle: 0, len: 600, spread: 0.18, color: MT.FFF4D8, alpha: 0.4 }] },
  );
  P(
    MT.HANDCUFFS,
    MT.CONG_TAY,
    [70, 40],
    (g) => {
      g.strokeStyle = MT.AAB0B6;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(-18, -18, 14, 0, PI * 2);
      g.moveTo(32, -18);
      g.arc(18, -18, 14, 0, PI * 2);
      g.stroke();
    },
    [MT.CANH_SAT],
  );
  P(
    MT.KEYS,
    MT.CHUM_CHIA_KHOA,
    [50, 40],
    (g) => {
      g.strokeStyle = MT.C9A24A;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, -26, 10, 0, PI * 2);
      g.stroke();
      R(g, 6, -22, 30, 5, 1, MT.C9A24A);
      R(g, -4, -16, 5, 26, 1, MT.AAB0B6);
    },
    [MT.CHIA_KHOA],
  );
  P(
    MT.PASSPORT,
    MT.HO_CHIEU,
    [44, 60],
    (g) => {
      R(g, -22, -60, 44, 60, 3, MT.VALUE_2A3A6A);
      circle(g, 0, -34, 9, MT.C9A24A);
    },
    [MT.GIAY_TO],
  );
  P(
    MT.MAGNIFIER,
    MT.KINH_LUP,
    [80, 80],
    (g) => {
      g.strokeStyle = MT.VALUE_2A2A2A;
      g.lineWidth = 8;
      g.beginPath();
      g.arc(-6, -46, 22, 0, PI * 2);
      g.stroke();
      circle(g, -6, -46, 18, MT.RGBA_190_220_240_0_45);
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(10, -30);
      g.lineTo(36, -4);
      g.stroke();
    },
    [MT.DIEU_TRA],
  );
  P(
    MT.CASE_FILE,
    MT.HO_SO_VU_AN,
    [80, 30],
    (g) => {
      for (let i = 0; i < 3; i++) R(g, -40 + i * 3, -10 - i * 8, 80, 8, 1, i % 2 ? MT.D9C48F : MT.C9B07A);
      R(g, -40, -34, 80, 10, 1, MT.B8964A);
      R(g, -10, -32, 24, 6, 0, MT.C42A2A);
    },
    [MT.HO_SO, MT.DIEU_TRA],
  );
  P(
    MT.COFFEE_CUP,
    MT.LY_CA_PHE,
    [36, 44],
    (g) => {
      poly(
        g,
        [
          [-14, -40],
          [14, -40],
          [10, 0],
          [-10, 0],
        ],
        MT.F2EFE8,
      );
      R(g, -16, -44, 32, 6, 2, MT.VALUE_5A3A22);
      R(g, -12, -28, 24, 10, 0, MT.VALUE_8A5A32);
    },
    [MT.DO_UONG],
  );
  P(
    MT.UMBRELLA,
    MT.O_DU,
    [140, 150],
    (g, o) => {
      R(g, -2, -140, 4, 140, 0, MT.VALUE_3A3A3A);
      g.fillStyle = o.color || MT.VALUE_1F2A3A;
      g.beginPath();
      g.arc(0, -120, 70, PI, 0);
      g.fill();
    },
    [MT.MUA],
  );
  P(
    MT.GUITAR,
    MT.DAN_GUITAR,
    [60, 160],
    (g) => {
      ell(g, 0, -40, 28, 36, MT.B46A2A);
      ell(g, 0, -86, 22, 26, MT.B46A2A);
      circle(g, 0, -60, 8, MT.VALUE_2A1A10);
      R(g, -4, -160, 8, 80, 1, MT.VALUE_3A2A1A);
    },
    [MT.AM_NHAC],
  );
  P(
    MT.TROPHY,
    MT.CUP,
    [60, 80],
    (g) => {
      R(g, -20, -8, 40, 8, 1, MT.VALUE_5A3A22);
      R(g, -4, -30, 8, 22, 0, MT.D4A83A);
      g.fillStyle = MT.E3B84A;
      g.beginPath();
      g.moveTo(-24, -76);
      g.lineTo(24, -76);
      g.quadraticCurveTo(22, -34, 0, -30);
      g.quadraticCurveTo(-22, -34, -24, -76);
      g.fill();
    },
    [MT.THANH_CONG],
  );
  P(
    MT.GLOBE,
    MT.QUA_DIA_CAU,
    [70, 100],
    (g) => {
      R(g, -20, -8, 40, 8, 2, MT.VALUE_5A3A22);
      R(g, -3, -26, 6, 18, 0, MT.VALUE_5A3A22);
      circle(g, 0, -60, 32, MT.VALUE_3A7AB0);
      ell(g, -8, -66, 14, 10, MT.VALUE_6AA04A);
      ell(g, 12, -52, 10, 8, MT.VALUE_6AA04A);
    },
    [MT.DU_LICH],
  );
  P(
    MT.HOURGLASS,
    MT.DONG_HO_CAT,
    [50, 90],
    (g, o) => {
      R(g, -24, -88, 48, 8, 2, MT.VALUE_6A4A2A);
      R(g, -24, -8, 48, 8, 2, MT.VALUE_6A4A2A);
      poly(
        g,
        [
          [-18, -80],
          [18, -80],
          [3, -48],
          [18, -8],
          [-18, -8],
          [-3, -48],
        ],
        MT.RGBA_200_220_235_0_5,
      );
      const k = ((o.t || 0) * 0.1) % 1;
      poly(
        g,
        [
          [-14 * (1 - k), -78 + 28 * k],
          [14 * (1 - k), -78 + 28 * k],
          [0, -50],
        ],
        MT.D9B46A,
      );
      poly(
        g,
        [
          [-14 * k, -10 - 18 * k],
          [14 * k, -10 - 18 * k],
          [16, -10],
          [-16, -10],
        ],
        MT.D9B46A,
      );
    },
    [MT.THOI_GIAN],
  );
  P(
    MT.BACKPACK,
    MT.BA_LO,
    [60, 80],
    (g, o) => {
      R(g, -26, -76, 52, 76, 14, o.color || MT.VALUE_3A5A3A);
      R(g, -20, -40, 40, 26, 6, C.shade(o.color || MT.VALUE_3A5A3A, -0.2));
    },
    [MT.DU_LICH],
  );
  P(
    MT.POWER_DRILL,
    MT.MAY_KHOAN,
    [90, 70],
    (g) => {
      R(g, -40, -64, 70, 26, 6, MT.E2A22A);
      R(g, 28, -56, 30, 8, 2, MT.VALUE_888);
      R(g, -20, -40, 22, 40, 4, MT.VALUE_2A2A2A);
    },
    [MT.DUNG_CU],
  );
  P(
    MT.ROPE_COIL,
    MT.CUON_DAY_THUNG,
    [70, 40],
    (g) => {
      g.strokeStyle = MT.A07A4A;
      g.lineWidth = 6;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(0, -16, 34 - i * 6, 12 - i * 2, 0, 0, PI * 2);
        g.stroke();
      }
    },
    [MT.DUNG_CU],
  );
  P(
    MT.CONICAL_HAT,
    MT.NON_LA,
    [90, 40],
    (g) => {
      poly(
        g,
        [
          [-44, -6],
          [0, -40],
          [44, -6],
        ],
        MT.D9C48F,
      );
      ell(g, 0, -6, 44, 6, MT.C9B07A);
    },
    [MT.VIET_NAM],
  );
  P(
    MT.BANH_CHUNG,
    MT.BANH_CHUNG_2,
    [60, 40],
    (g) => {
      R(g, -28, -36, 56, 36, 3, MT.VALUE_3E7A3A);
      R(g, -28, -20, 56, 4, 0, MT.C9B07A);
      R(g, -2, -36, 4, 36, 0, MT.C9B07A);
    },
    [MT.VIET_NAM, MT.TET],
  );
  const F = (id, name, size, draw, tags) => A(id, name, MT.FURNITURE, size, draw, { tags: tags || [] });
  F(
    MT.HOSPITAL_BED,
    MT.GIUONG_BENH,
    [300, 140],
    (g) => {
      R(g, -150, -70, 300, 24, 4, MT.DFE4E8);
      R(g, -150, -80, 300, 14, 6, MT.F4F6F8);
      R(g, -140, -46, 6, 46, 0, MT.VALUE_9AA0A6);
      R(g, 134, -46, 6, 46, 0, MT.VALUE_9AA0A6);
      R(g, 130, -130, 10, 70, 2, MT.VALUE_9AA0A6);
      R(g, -120, -96, 80, 18, 8, MT.FFFFFF);
    },
    [MT.BENH_VIEN_2],
  );
  F(
    MT.WARDROBE,
    MT.TU_QUAN_AO,
    [180, 300],
    (g, o) => {
      R(g, -90, -300, 180, 300, 4, o.color || MT.VALUE_7A5236);
      R(g, -2, -290, 4, 280, 0, MT.RGBA_0_0_0_0_3);
      R(g, -14, -170, 6, 30, 2, MT.D9B46A);
      R(g, 8, -170, 6, 30, 2, MT.D9B46A);
    },
    [MT.NOI_THAT],
  );
  F(
    MT.FRIDGE,
    MT.TU_LANH,
    [120, 260],
    (g) => {
      R(g, -60, -260, 120, 260, 10, MT.E9ECEE);
      R(g, -60, -170, 120, 4, 0, MT.B8BCC0);
      R(g, 40, -240, 6, 50, 2, MT.VALUE_9AA0A6);
    },
    [MT.BEP],
  );
  F(
    MT.SCHOOL_DESK,
    MT.BAN_HOC_SINH,
    [180, 110],
    (g) => {
      R(g, -90, -100, 180, 14, 2, MT.A07A4A);
      R(g, -80, -86, 8, 86, 0, MT.VALUE_5A5A5A);
      R(g, 72, -86, 8, 86, 0, MT.VALUE_5A5A5A);
    },
    [MT.TRUONG_HOC_2],
  );
  F(
    MT.BLACKBOARD,
    MT.BANG_DEN,
    [420, 260],
    (g) => {
      R(g, -210, -300, 420, 220, 4, MT.VALUE_6A4A2A);
      R(g, -200, -290, 400, 200, 0, MT.VALUE_2A3A32);
      g.strokeStyle = MT.RGBA_240_240_230_0_6;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-170, -250);
      g.lineTo(-40, -250);
      g.moveTo(-170, -215);
      g.lineTo(60, -215);
      g.stroke();
    },
    [MT.TRUONG_HOC_2],
  );
  F(
    MT.KITCHEN_STOVE,
    MT.BEP_NAU,
    [200, 120],
    (g, o) => {
      R(g, -100, -110, 200, 110, 4, MT.D9D2C4);
      R(g, -100, -116, 200, 8, 2, MT.VALUE_3A3A3A);
      for (const x of [-50, 50]) ell(g, x, -118, 30, 5, MT.VALUE_2A2A2A);
      if (o.on) for (const x of [-50, 50]) ell(g, x, -124, 18, 6, MT.RGBA_80_140_255_0_7);
    },
    [MT.BEP],
  );
  const CH = (id, name, tags, o) => ME.registerCharacter(Object.assign({ id, name, tags, builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [] }, o));
  CH(MT.NURSE, MT.Y_TA, [MT.Y_TE, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.DRESS, colors: { top: MT.E9EEF2, bottom: MT.E9EEF2, accent: MT.C42A2A } });
  CH(MT.FIREFIGHTER, MT.LINH_CUU_HOA, [MT.CUU_HOA], { outfit: MT.UNIFORM, headwear: MT.HELMET, build: MT.ATHLETIC, colors: { top: MT.VALUE_3A3226, bottom: MT.VALUE_3A3226, hat: MT.C4281F, accent: MT.E8D24A } });
  CH(MT.SAILOR, MT.THUY_THU, [MT.BIEN], { outfit: MT.UNIFORM, headwear: MT.CAP, colors: { top: MT.F0F0EC, bottom: MT.VALUE_1F2A44, hat: MT.F0F0EC, accent: MT.VALUE_1F2A44 } });
  CH(MT.MECHANIC, MT.THO_MAY, [MT.THO, MT.SUA_XE], { outfit: MT.OVERALLS, headwear: MT.CAP, colors: { top: MT.VALUE_2A4A6A, bottom: MT.VALUE_2A4A6A, hat: MT.C4402A } });
  CH(MT.FISHERMAN, MT.NGU_DAN_2, [MT.BIEN, MT.VIET_NAM], { outfit: MT.CASUAL, headwear: MT.CONICAL, accessories: [], build: MT.SLIM, colors: { top: MT.VALUE_5A6A7A, bottom: MT.VALUE_2F3A3A, skin: MT.B07A52 } });
  CH(MT.FARMER_VN, MT.NONG_DAN_NON_LA, [MT.NONG_THON, MT.VIET_NAM], { outfit: MT.CASUAL, headwear: MT.CONICAL, colors: { top: MT.VALUE_7A6A4A, bottom: MT.VALUE_3A3226, skin: MT.B07A52 } });
  CH(MT.WOMAN_AODAI, MT.THIEU_NU_AO_DAI, [MT.VIET_NAM, MT.NU, MT.AO_DAI], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.DRESS, colors: { top: MT.F4F2EA, bottom: MT.F4F2EA, hair: MT.VALUE_141010 } });
  CH(MT.MONK, MT.NHA_SU, [MT.CHUA, MT.TON_GIAO], { hair: MT.BALD, outfit: MT.ROBE, colors: { top: MT.C9862A, bottom: MT.C9862A } });
  CH(MT.STUDENT, MT.HOC_SINH, [MT.TRUONG_HOC_2, MT.TRE], { age: MT.TEEN, build: MT.SLIM, accessories: [MT.BACKPACK], colors: { top: MT.F2F2F2, bottom: MT.VALUE_1F2A44 } });
  CH(MT.SCHOOLGIRL, MT.NU_SINH, [MT.TRUONG_HOC_2, MT.NU, MT.TRE], { gender: MT.FEMALE, age: MT.TEEN, hair: MT.PONYTAIL, build: MT.SLIM, accessories: [MT.BACKPACK], outfit: MT.DRESS, colors: { top: MT.F2F2F2, bottom: MT.F2F2F2 } });
  CH(MT.WAITER, MT.BOI_BAN, [MT.NHA_HANG], { outfit: MT.SUIT, accessories: [MT.VEST, MT.TIE], colors: { top: MT.F2F2F2, bottom: MT.VALUE_1A1A1E, accent: MT.VALUE_1A1A1E } });
  CH(MT.CHEF_HAT_COOK, MT.DAU_BEP_MU_TRANG, [MT.NHA_HANG, MT.BEP], { outfit: MT.CASUAL, headwear: MT.CHEF_HAT, colors: { top: MT.F4F4F2, bottom: MT.VALUE_2A2A2A } });
  CH(MT.DELIVERY_RIDER, MT.SHIPPER, [MT.GIAO_HANG, MT.VIET_NAM], { headwear: MT.HELMET, accessories: [MT.BACKPACK], colors: { top: MT.VALUE_1AA260, bottom: MT.VALUE_2A2A2A, hat: MT.VALUE_1AA260 } });
  CH(MT.OFFICE_WOMAN, MT.NU_NHAN_VIEN_VAN_PHONG, [MT.VAN_PHONG, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.SUIT, accessories: [MT.GLASSES], colors: { top: MT.VALUE_3A4A6A, bottom: MT.VALUE_2A2A34 } });
  CH(MT.REPORTER, MT.PHONG_VIEN_HIEN_TRUONG, [MT.BAO_CHI], { outfit: MT.COAT, accessories: [MT.CAMERA], colors: { top: MT.VALUE_6A5A4A, bottom: MT.VALUE_2A2A2A } });
  CH(MT.OLD_MAN_VN, MT.CU_ONG, [MT.VIET_NAM, MT.GIA], { age: MT.ELDERLY, build: MT.SLIM, hair: MT.SHORT, accessories: [MT.BEARD], colors: { top: MT.E9E2CF, bottom: MT.VALUE_3A3226, hair: MT.CFCFCF } });
  CH(MT.GRANDMA_VN, MT.BA_CU, [MT.VIET_NAM, MT.GIA, MT.NU], { gender: MT.FEMALE, age: MT.ELDERLY, hair: MT.BUN, outfit: MT.DRESS, colors: { top: MT.VALUE_5A3A4A, bottom: MT.VALUE_2A2226, hair: MT.CFCFCF } });
  CH(MT.ASTRONAUT, MT.PHI_HANH_GIA, [MT.VU_TRU], { outfit: MT.UNIFORM, headwear: MT.HELMET, build: MT.ATHLETIC, accessories: [MT.TANK], colors: { top: MT.ECEFF1, bottom: MT.ECEFF1, hat: MT.F4F6F8 } });
  const { E, I, asset, hills, sea, wallTex, floor, skyline } = K;
  E(MT.VN_STREET, MT.PHO_VIET_NHA_ONG, {
    tags: [MT.VIET_NAM, MT.PHO, MT.HA_NOI, MT.SAI_GON],
    width: 4200,
    layers: [
      { depth: 0.15, blur: 2.2, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.3), 260, 520, 11, true, tp.night) },
      {
        depth: 0.8,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          let x = x0;
          let i = 0;
          const r = U.rng(31);
          while (x < x1) {
            asset(g, MT.TUBE_HOUSE, x + 80, 0, { seed: i++, h: 440 + r() * 180, night: tp.night, color: tp.night ? C.mix([MT.E8C96A, MT.D9E3C4, MT.F2B8A0, MT.BCD6E0][i % 4], MT.VALUE_0B1322, 0.7) : undefined, sign: [MT.B8322A, MT.VALUE_2A6AD0, MT.VALUE_1AA260, MT.E2A22A][i % 4] });
            x += 164;
          }
          g.strokeStyle = MT.VALUE_1A1A1A;
          g.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            g.moveTo(x0, -380 - k * 12);
            for (let xx = x0; xx < x1; xx += 300) g.quadraticCurveTo(xx + 150, -340 - k * 12, xx + 300, -380 - k * 12);
            g.stroke();
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 46, 0, C.shade(tp.ground, 0.05));
      R(g, x0, -104, x1 - x0, 92, 0, tp.road);
      for (let x = Math.floor(x0 / 180) * 180; x < x1; x += 180) R(g, x, -60, 90, 5, 0, C.rgba(MT.E9E2CC, tp.night ? 0.25 : 0.6));
      R(g, x0, -12, x1 - x0, H + 12, 0, tp.ground);
    },
    props: (WW) => {
      const out = [];
      for (let x = 300; x < WW; x += 700) out.push({ asset: MT.POWER_POLE, x, lane: MT.BACK });
      for (let x = 520; x < WW; x += 1300) out.push({ asset: MT.STREET_VENDOR_CART, x, lane: MT.BACK });
      return out;
    },
  });
  E(MT.RICE_FIELD, MT.CANH_DONG_LUA, {
    tags: [MT.VIET_NAM, MT.LANG_QUE, MT.RUONG],
    width: 4000,
    layers: [
      { depth: 0.08, blur: 2.5, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.4), 260, 150, 4) },
      {
        depth: 0.25,
        blur: 1.2,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 120) asset(g, U.hash(x) > 0.6 ? MT.BANANA_TREE : MT.TREE_ROUND, x, -150, { color: tp.night ? MT.VALUE_132013 : MT.VALUE_4F7F3A, seed: x }, 0.55 + U.hash(x + 1) * 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      const base = tp.night ? MT.VALUE_1F2E18 : MT.VALUE_8DB84A;
      R(g, x0, -150, x1 - x0, H + 150, 0, base);
      let y = -150,
        row = 0;
      while (y < H) {
        const h = 10 + row * 7;
        R(g, x0, y, x1 - x0, h, 0, row % 2 ? C.shade(base, 0.06) : C.shade(base, -0.05));
        if (row % 3 === 1) R(g, x0, y + h - 3, x1 - x0, 3, 0, tp.night ? MT.RGBA_140_170_220_0_18 : MT.RGBA_220_235_240_0_35);
        g.strokeStyle = tp.night ? MT.VALUE_2C4224 : MT.VALUE_6F9A36;
        g.lineWidth = 1 + row * 0.35;
        const step = 14 + row * 5;
        for (let x = Math.floor(x0 / step) * step; x < x1; x += step) {
          g.beginPath();
          g.moveTo(x, y + h);
          g.lineTo(x - 2 - row * 0.4, y + h - h * 0.9);
          g.moveTo(x, y + h);
          g.lineTo(x + 2 + row * 0.4, y + h - h * 0.8);
          g.stroke();
        }
        y += h;
        row++;
      }
      R(g, x0, -44, x1 - x0, 30, 0, tp.night ? MT.VALUE_2A241C : MT.A8875A);
    },
    props: (WW) => [
      { asset: MT.WATER_BUFFALO, x: WW * 0.32, lane: MT.BACK },
      { asset: MT.BANANA_TREE, x: WW * 0.7, lane: MT.BACK },
    ],
  });
  E(MT.VN_VILLAGE, MT.LANG_QUE_VIET, {
    tags: [MT.VIET_NAM, MT.LANG, MT.CHUA, MT.TRE_2],
    width: 3800,
    layers: [
      { depth: 0.1, blur: 2.5, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.35), 240, 140, 6) },
      {
        depth: 0.5,
        blur: 0.8,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 220) asset(g, MT.BAMBOO, x, -20, { color: tp.night ? MT.VALUE_132013 : MT.VALUE_5F8F3A, seed: x }, 0.85);
          asset(g, MT.PAGODA, (x0 + x1) / 2, -20, { night: tp.night }, 0.9);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_1A2014 : MT.VALUE_8A8A52);
      R(g, x0, -40, x1 - x0, 46, 0, tp.night ? MT.VALUE_1D1A16 : MT.B08A5A);
    },
    props: (WW) => [
      { asset: MT.BANANA_TREE, x: WW * 0.2, lane: MT.BACK },
      { asset: MT.CHICKEN, x: WW * 0.45, lane: MT.MID },
      { asset: MT.TREE_BLOSSOM, x: WW * 0.78, lane: MT.BACK },
    ],
  });
  E(MT.BEACH, MT.BAI_BIEN, {
    tags: [MT.BIEN, MT.DU_LICH],
    width: 4000,
    layers: [
      { depth: 0.1, blur: 0, draw: (g, x0, x1, tp) => sea(g, x0, x1, tp.night ? MT.VALUE_0D2238 : MT.VALUE_3F8FBF, 260) },
      {
        depth: 0.4,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          for (let x = x0 + 200; x < x1; x += 900) asset(g, MT.TREE_PALM, x, -60, { color: tp.night ? MT.VALUE_0E1A10 : MT.VALUE_3D7A3F, seed: x });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_3A3326 : MT.E3CFA0);
      const t = 0;
      g.fillStyle = MT.RGBA_255_255_255_0_35;
      for (let x = Math.floor(x0 / 200) * 200; x < x1; x += 200) g.fillRect(x + t, -150, 120, 4);
    },
    props: (WW) => [
      { asset: MT.LIGHTHOUSE, x: WW * 0.85, lane: MT.BACK },
      { asset: MT.BASKET_BOAT, x: WW * 0.3, lane: MT.BACK },
    ],
  });
  E(MT.TRAIN_STATION, MT.GA_TAU, {
    tags: [MT.GA_3, MT.TAU_HOA_2],
    width: 4200,
    layers: [
      { depth: 0.2, blur: 1.5, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.25), 200, 420, 17, true, tp.night) },
      {
        depth: 0.85,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          R(g, x0, -520, x1 - x0, 30, 0, MT.VALUE_3A3D43);
          for (let x = Math.floor(x0 / 400) * 400; x < x1; x += 400) R(g, x, -520, 14, 380, 0, MT.VALUE_4A4D53);
          asset(g, MT.TRAIN, (x0 + x1) / 2, -150, { night: tp.night }, 1.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 30, 0, MT.VALUE_5A5A5A);
      R(g, x0, -120, x1 - x0, 14, 0, MT.E2C42A);
      R(g, x0, -106, x1 - x0, H + 106, 0, tp.night ? MT.VALUE_2A2A2C : MT.VALUE_9A968E);
    },
  });
  I(MT.HOSPITAL_ROOM, MT.PHONG_BENH, {
    tags: [MT.BENH_VIEN_2, MT.Y_TE],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.CFDCD8, 14);
          for (let x = 600; x < x1; x += 900) asset(g, MT.WINDOW, x, -360, {});
        },
      },
    ],
    ground: floor(MT.B9C2C0, 160),
    props: () => [{ asset: MT.HOSPITAL_BED, x: 1200, lane: MT.MID }],
  });
  I(MT.CLASSROOM, MT.LOP_HOC, {
    tags: [MT.TRUONG_HOC_2],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.E8DCB8, 15);
          asset(g, MT.BLACKBOARD, 1200, -120, {});
        },
      },
    ],
    ground: floor(MT.VALUE_8A6A4A, 120),
    props: () => [
      { asset: MT.SCHOOL_DESK, x: 800, lane: MT.FRONT },
      { asset: MT.SCHOOL_DESK, x: 1600, lane: MT.FRONT },
    ],
  });
  I(MT.CAFE_INTERIOR, MT.QUAN_CA_PHE, {
    tags: [MT.CA_PHE, MT.QUAN],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_5A4232, 16);
          for (let x = 500; x < x1; x += 700) asset(g, MT.WINDOW, x, -380, {});
        },
      },
    ],
    ground: floor(MT.VALUE_3A2A20, 140),
    props: () => [
      { asset: MT.CAFE_TABLE, x: 800, lane: MT.MID },
      { asset: MT.CAFE_TABLE, x: 1600, lane: MT.MID },
    ],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 600) }, (_, i) => ({ type: MT.LAMP, x: 300 + i * 600, y: -700, len: 700, color: MT.FFCF8A, alpha: 0.22 })),
  });
  I(MT.POLICE_STATION, MT.DON_CANH_SAT, {
    tags: [MT.CANH_SAT, MT.DIEU_TRA],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_9AA6AE, 17);
          asset(g, MT.MAP_BOARD, 1300, -300, {});
        },
      },
    ],
    ground: floor(MT.VALUE_6A6E72, 140),
    props: () => [
      { asset: MT.DESK, x: 900, lane: MT.MID },
      { asset: MT.COMPUTER, x: 900, lane: MT.MID, y: -80 },
    ],
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
