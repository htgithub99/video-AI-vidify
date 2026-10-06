(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { R, poly } = ME.shapes;
  const A = (id, name, category, size, draw, extra) => ME.registerAsset(id, Object.assign({ name, category, size, draw, tags: [] }, extra || {}));
  const sway = (o, amp = 0.012) => Math.sin((o.t || 0) * 1.3 + (o.seed || 0)) * amp * (o.wind == null ? 1 : o.wind);
  const blob = (g, x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, r, 0, PI * 2);
    g.fill();
  };
  const foliage = (g, cx, cy, rw, rh, seed, base, n = 16) => {
    const rnd = U.rng(seed);
    const dark = C.shade(base, -0.28),
      light = C.shade(base, 0.16);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * PI * 2,
        d = Math.sqrt(rnd());
      pts.push([cx + Math.cos(a) * rw * d * 0.75, cy + Math.sin(a) * rh * d * 0.7, (0.32 + rnd() * 0.25) * Math.min(rw, rh)]);
    }
    pts.forEach((p) => blob(g, p[0] - p[2] * 0.12, p[1] + p[2] * 0.15, p[2], dark));
    pts.forEach((p) => blob(g, p[0], p[1], p[2] * 0.92, base));
    pts.filter((p) => p[1] < cy).forEach((p) => blob(g, p[0] + p[2] * 0.2, p[1] - p[2] * 0.25, p[2] * 0.5, light));
  };
  const trunk = (g, h, w, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-w, 0);
    g.quadraticCurveTo(-w * 0.5, -h * 0.5, -w * 0.4, -h);
    g.lineTo(w * 0.4, -h);
    g.quadraticCurveTo(w * 0.5, -h * 0.5, w, 0);
    g.closePath();
    g.fill();
  };
  ME.kit = Object.assign(ME.kit || {}, { foliage, trunk, blob, sway });
  A(
    MT.TREE_ROUND,
    MT.CAY_TAN_TRON,
    MT.NATURE,
    [260, 380],
    (g, o) => {
      const s = o.scale || 1;
      g.scale(s, s);
      trunk(g, 190, 16, o.trunk || MT.VALUE_4A3626);
      g.rotate(sway(o));
      foliage(g, 0, -250, 130, 120, 11 + (o.seed || 0), o.color || MT.VALUE_3F6B3A, 18);
    },
    { tags: [MT.CAY] },
  );
  A(
    MT.TREE_PINE,
    MT.CAY_THONG,
    MT.NATURE,
    [180, 420],
    (g, o) => {
      trunk(g, 80, 10, MT.VALUE_3E2C1E);
      g.rotate(sway(o, 0.008));
      const col = o.color || MT.VALUE_2C4A36;
      for (let i = 0; i < 5; i++) {
        const y = -60 - i * 68,
          w = 95 - i * 15;
        poly(
          g,
          [
            [-w, y],
            [w, y],
            [0, y - 120],
          ],
          C.shade(col, i * 0.04),
        );
        poly(
          g,
          [
            [0, y],
            [w, y],
            [0, y - 120],
          ],
          C.shade(col, -0.18),
        );
      }
    },
    { tags: [MT.CAY, MT.RUNG] },
  );
  A(
    MT.TREE_PALM,
    MT.CAY_CO,
    MT.NATURE,
    [300, 480],
    (g, o) => {
      const col = o.color || MT.VALUE_3D7A3F;
      g.strokeStyle = MT.VALUE_7A5B3A;
      g.lineWidth = 16;
      g.lineCap = MT.ROUND;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(30, -220, 10, -420);
      g.stroke();
      g.strokeStyle = MT.RGBA_60_40_20_0_5;
      g.lineWidth = 2;
      for (let i = 1; i < 12; i++) {
        const y = -i * 34;
        g.beginPath();
        g.moveTo(-6 + i * 1.5, y);
        g.lineTo(10 + i * 1.5, y - 4);
        g.stroke();
      }
      g.translate(10, -420);
      g.rotate(sway(o, 0.03));
      for (let i = 0; i < 9; i++) {
        const a = -PI / 2 + (i - 4) * 0.42;
        g.save();
        g.rotate(a + PI / 2);
        g.fillStyle = i % 2 ? col : C.shade(col, -0.2);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(70, -40, 170, 30);
        g.quadraticCurveTo(80, -10, 0, 8);
        g.fill();
        g.restore();
      }
    },
    { tags: [MT.CAY, MT.BIEN, MT.NHIET_DOI] },
  );
  A(
    MT.TREE_CYPRESS,
    MT.CAY_BACH,
    MT.NATURE,
    [90, 420],
    (g, o) => {
      trunk(g, 40, 7, MT.VALUE_3A2A1C);
      g.rotate(sway(o, 0.01));
      const col = o.color || MT.VALUE_2F4A2F;
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, -220, 42, 190, 0, 0, PI * 2);
      g.fill();
      g.fillStyle = C.shade(col, -0.2);
      g.beginPath();
      g.ellipse(-12, -210, 26, 180, 0, 0, PI * 2);
      g.fill();
    },
    { tags: [MT.CAY, MT.DIA_TRUNG_HAI] },
  );
  A(
    MT.TREE_BARE,
    MT.CAY_TRUI_LA,
    MT.NATURE,
    [260, 360],
    (g, o) => {
      const col = o.color || MT.VALUE_3B2E26;
      g.strokeStyle = col;
      g.lineCap = MT.ROUND;
      const rnd = U.rng(31 + (o.seed || 0));
      const br = (x, y, a, len, w, d) => {
        const x2 = x + Math.sin(a) * len,
          y2 = y - Math.cos(a) * len;
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x2, y2);
        g.stroke();
        if (d > 0) {
          br(x2, y2, a - 0.4 - rnd() * 0.3, len * 0.72, w * 0.65, d - 1);
          br(x2, y2, a + 0.35 + rnd() * 0.3, len * 0.7, w * 0.65, d - 1);
        }
      };
      br(0, 0, sway(o, 0.02), 120, 16, 5);
    },
    { tags: [MT.CAY, MT.MUA_DONG] },
  );
  A(
    MT.TREE_JUNGLE,
    MT.CAY_RUNG_NHIET_DOI,
    MT.NATURE,
    [320, 420],
    (g, o) => {
      trunk(g, 240, 14, MT.VALUE_4A3A26);
      g.rotate(sway(o, 0.015));
      const col = o.color || MT.VALUE_2F5A2C;
      for (let i = 0; i < 7; i++) {
        const a = -PI / 2 + (i - 3) * 0.45;
        g.save();
        g.translate(0, -240);
        g.rotate(a + PI / 2);
        g.fillStyle = i % 2 ? col : C.shade(col, 0.12);
        g.beginPath();
        g.ellipse(80, 0, 95, 30, 0.25, 0, PI * 2);
        g.fill();
        g.restore();
      }
    },
    { tags: [MT.CAY, MT.RUNG, MT.NHIET_DOI, MT.DONG_DUONG] },
  );
  A(MT.BUSH, MT.BUI_CAY, MT.NATURE, [200, 110], (g, o) => foliage(g, 0, -50, 100, 50, 7 + (o.seed || 0), o.color || MT.VALUE_3E6A38, 10), { tags: [MT.CAY] });
  A(MT.HEDGE, MT.HANG_RAO_CAY, MT.NATURE, [400, 100], (g, o) => {
    const col = o.color || MT.VALUE_35603A;
    R(g, -200, -90, 400, 90, 22, C.shade(col, -0.15));
    for (let i = 0; i < 9; i++) blob(g, -180 + i * 45, -82, 30, i % 2 ? col : C.shade(col, 0.08));
  });
  A(MT.GRASS, MT.CO, MT.NATURE, [160, 40], (g, o) => {
    g.strokeStyle = o.color || MT.VALUE_4C7A3E;
    g.lineWidth = 2;
    const rnd = U.rng(5 + (o.seed || 0));
    for (let i = 0; i < 26; i++) {
      const x = -80 + rnd() * 160,
        h = 14 + rnd() * 26,
        b = sway(o, 0.25) * h;
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + b * 0.3, -h * 0.6, x + b + (rnd() - 0.5) * 8, -h);
      g.stroke();
    }
  });
  A(MT.FLOWERS, MT.HOA, MT.NATURE, [140, 60], (g, o) => {
    const rnd = U.rng(9 + (o.seed || 0));
    const cols = o.colors || [MT.E85A6A, MT.F2C14E, MT.F4F0E6, MT.B77CE0];
    for (let i = 0; i < 12; i++) {
      const x = -70 + rnd() * 140,
        h = 18 + rnd() * 34;
      g.strokeStyle = MT.VALUE_3F6A32;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + sway(o, 0.3) * h, -h);
      g.stroke();
      blob(g, x + sway(o, 0.3) * h, -h, 5, cols[i % cols.length]);
    }
  });
  A(MT.ROCK, MT.TANG_DA, MT.NATURE, [160, 90], (g, o) => {
    const col = o.color || MT.VALUE_6B6A66;
    poly(
      g,
      [
        [-80, 0],
        [-62, -52],
        [-10, -86],
        [50, -70],
        [80, 0],
      ],
      col,
    );
    poly(
      g,
      [
        [-10, -86],
        [50, -70],
        [80, 0],
        [10, 0],
      ],
      C.shade(col, -0.2),
    );
    poly(
      g,
      [
        [-62, -52],
        [-10, -86],
        [-20, -40],
      ],
      C.shade(col, 0.15),
    );
  });
  A(MT.CLOUD, MT.MAY, MT.SKY, [420, 160], (g, o) => {
    const col = o.color || MT.F2F4F6;
    const a = o.alpha == null ? 0.9 : o.alpha;
    g.globalAlpha *= a;
    const rnd = U.rng(3 + (o.seed || 0));
    for (let i = 0; i < 8; i++) blob(g, -160 + i * 46 + rnd() * 20, -40 - Math.sin((i / 7) * PI) * 50 - rnd() * 20, 46 + rnd() * 30, i % 3 ? col : C.shade(col, -0.08));
  });
  A(MT.MOON, MT.MAT_TRANG, MT.SKY, [140, 140], (g, o) => {
    ME.glow(g, 0, -70, 200, MT.CFDCFF, 0.35);
    blob(g, 0, -70, 52, MT.EEF1F6);
    g.fillStyle = MT.RGBA_160_170_190_0_35;
    blob(g, -14, -84, 10, MT.RGBA_160_170_190_0_35);
    blob(g, 16, -60, 7, MT.RGBA_160_170_190_0_3);
    void o;
  });
  A(MT.SUN, MT.MAT_TROI, MT.SKY, [200, 200], (g) => {
    ME.glow(g, 0, -100, 320, MT.FFD9A0, 0.55);
    blob(g, 0, -100, 64, MT.FFF3D6);
  });
  A(
    MT.BIRD,
    MT.CHIM_BAY,
    MT.NATURE,
    [60, 30],
    (g, o) => {
      const k = Math.sin((o.t || 0) * 10 + (o.seed || 0));
      g.strokeStyle = o.color || MT.VALUE_1B1D22;
      g.lineWidth = 3;
      g.lineCap = MT.ROUND;
      g.beginPath();
      g.moveTo(-26, -14 - k * 10);
      g.quadraticCurveTo(-10, -12, 0, -6);
      g.quadraticCurveTo(10, -12, 26, -14 - k * 10);
      g.stroke();
    },
    { tags: [MT.CHIM] },
  );
  A(MT.MOUNTAIN, MT.DAY_NUI, MT.NATURE, [1400, 500], (g, o) => {
    const col = o.color || MT.VALUE_5A6A7A;
    const rnd = U.rng(17 + (o.seed || 0));
    const pts = [[-700, 0]];
    for (let i = 0; i <= 14; i++) pts.push([-700 + i * 100, -200 - rnd() * 280 * (i % 2 ? 0.6 : 1)]);
    pts.push([700, 0]);
    poly(g, pts, col);
    for (let i = 1; i < pts.length - 2; i += 2) poly(g, [pts[i], [pts[i][0] + 60, 0], [pts[i][0] - 10, 0]], C.shade(col, -0.12));
    if (o.snow) for (let i = 1; i < pts.length - 1; i++) if (pts[i][1] < -380) poly(g, [pts[i], [pts[i][0] + 36, pts[i][1] + 60], [pts[i][0] - 36, pts[i][1] + 60]], MT.F2F4F6);
  });
  const windowsGrid = (g, x0, y0, cols, rows, w, h, gx, gy, col, o, lit) => {
    const rnd = U.rng(77 + (o.seed || 0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * gx,
          y = y0 + r * gy;
        const on = o.night && rnd() < (o.litRatio == null ? 0.45 : o.litRatio);
        R(g, x, y, w, h, 0, on ? MT.F7C977 : col);
        if (on && lit) lit.push({ x: x + w / 2, y: y + h / 2, w, h });
        if (!on) R(g, x, y, w, h * 0.12, 0, MT.RGBA_255_255_255_0_12);
      }
  };
  A(
    MT.BUILDING_HAUSSMANN,
    MT.NHA_PHO_PHAP_CO,
    MT.URBAN,
    [420, 620],
    (g, o) => {
      const col = o.color || MT.D8C7A6;
      const W = o.w || 420,
        H = o.h || 600;
      R(g, -W / 2, -H, W, H, 0, col);
      R(g, -W / 2 - 8, -H - 40, W + 16, 46, 0, MT.VALUE_56606C);
      poly(
        g,
        [
          [-W / 2 - 8, -H - 40],
          [W / 2 + 8, -H - 40],
          [W / 2 - 30, -H - 90],
          [-W / 2 + 30, -H - 90],
        ],
        MT.VALUE_4A535E,
      );
      for (let i = 0; i < 3; i++) R(g, -W / 2 + 60 + i * 130, -H - 80, 30, 34, 3, o.night ? MT.E9B86A : MT.VALUE_2B3440);
      const lit = [];
      const rows = Math.floor((H - 150) / 110);
      windowsGrid(g, -W / 2 + 40, -H + 40, Math.floor((W - 40) / 95), rows, 52, 78, 95, 110, MT.VALUE_2F3A46, o, lit);
      for (let r = 0; r < rows; r++) R(g, -W / 2 + 30, -H + 120 + r * 110, W - 60, 6, 0, MT.VALUE_3A3F45);
      R(g, -W / 2, -120, W, 120, 0, C.shade(col, -0.18));
      R(g, -40, -110, 80, 110, 0, MT.VALUE_3A2A20);
      R(g, -W / 2, -H, W, 10, 0, C.shade(col, 0.1));
      g.__lit = lit;
    },
    { tags: [MT.NHA, MT.PHAP, MT.PHO_CO] },
  );
  A(
    MT.BUILDING_MODERN,
    MT.TOA_NHA_HIEN_DAI,
    MT.URBAN,
    [360, 900],
    (g, o) => {
      const W = o.w || 360,
        H = o.h || 900;
      const col = o.color || MT.VALUE_5F7488;
      R(g, -W / 2, -H, W, H, 0, col);
      const lit = [];
      windowsGrid(g, -W / 2 + 18, -H + 20, Math.floor((W - 20) / 48), Math.floor((H - 40) / 46), 36, 30, 48, 46, C.shade(col, -0.35), o, lit);
      R(g, -W / 2, -H, 14, H, 0, C.shade(col, 0.15));
      g.__lit = lit;
    },
    { tags: [MT.NHA, MT.THANH_PHO] },
  );
  A(
    MT.HOUSE,
    MT.NHA_O,
    MT.URBAN,
    [360, 320],
    (g, o) => {
      const col = o.color || MT.E6D6BF;
      R(g, -170, -200, 340, 200, 0, col);
      poly(
        g,
        [
          [-200, -195],
          [0, -330],
          [200, -195],
        ],
        o.roof || MT.VALUE_8A3B2A,
      );
      R(g, -30, -120, 60, 120, 0, MT.VALUE_5A3A2A);
      R(g, -140, -150, 70, 60, 0, o.night ? MT.F7C977 : MT.VALUE_3A4A5A);
      R(g, 70, -150, 70, 60, 0, o.night ? MT.F7C977 : MT.VALUE_3A4A5A);
      R(g, 90, -310, 30, 80, 0, MT.VALUE_6A5A4A);
    },
    { tags: [MT.NHA] },
  );
  A(
    MT.FARMHOUSE,
    MT.NHA_TRANG_TRAI_DA,
    MT.URBAN,
    [420, 300],
    (g, o) => {
      const col = o.color || MT.B9A88C;
      R(g, -210, -190, 420, 190, 0, col);
      const rnd = U.rng(4);
      for (let i = 0; i < 40; i++) R(g, -200 + rnd() * 380, -180 + rnd() * 170, 30 + rnd() * 20, 14, 3, C.shade(col, (rnd() - 0.5) * 0.2));
      poly(
        g,
        [
          [-230, -185],
          [0, -290],
          [230, -185],
        ],
        MT.VALUE_9A4B30,
      );
      R(g, -40, -120, 70, 120, 0, MT.VALUE_4A3020);
      R(g, 90, -140, 60, 50, 0, o.night ? MT.F2BE6E : MT.VALUE_2F3A3F);
    },
    { tags: [MT.NHA, MT.NONG_THON] },
  );
  A(
    MT.SHOP_FRONT,
    MT.CUA_HANG_STUDIO,
    MT.URBAN,
    [420, 380],
    (g, o) => {
      const col = o.color || MT.E4DCCB;
      R(g, -210, -380, 420, 380, 0, col);
      R(g, -190, -250, 380, 230, 0, o.night ? MT.F3D08C : MT.VALUE_2E3D4C);
      R(g, -190, -250, 380, 8, 0, MT.VALUE_3A3A3A);
      const aw = o.awning || MT.VALUE_7A2A2A;
      for (let i = 0; i < 10; i++)
        poly(
          g,
          [
            [-210 + i * 42, -300],
            [-168 + i * 42, -300],
            [-172 + i * 42, -250],
            [-206 + i * 42, -250],
          ],
          i % 2 ? aw : MT.EFE7D6,
        );
      R(g, -210, -350, 420, 50, 0, MT.VALUE_2A2D33);
      if (o.text) {
        g.fillStyle = MT.E9DCC0;
        g.font = ME.font(700, 30, MT.SERIF);
        g.textAlign = MT.CENTER;
        g.fillText(String(o.text).slice(0, 24), 0, -314);
        g.textAlign = MT.LEFT;
      }
      R(g, 120, -240, 60, 220, 0, MT.VALUE_4A3426);
      g.__lit = o.night ? [{ x: 0, y: -135, w: 380, h: 230 }] : [];
    },
    { tags: [MT.CUA_HANG, MT.STUDIO_ANH], params: { text: MT.BIEN_HIEU, awning: MT.MAU_MAI_HIEN } },
  );
  A(
    MT.BANK_FACADE,
    MT.MAT_TIEN_NGAN_HANG,
    MT.URBAN,
    [720, 560],
    (g, o) => {
      const col = o.color || MT.E2DCCD;
      R(g, -360, -520, 720, 520, 0, col);
      poly(
        g,
        [
          [-380, -520],
          [380, -520],
          [0, -620],
        ],
        C.shade(col, -0.08),
      );
      R(g, -380, -530, 760, 20, 0, C.shade(col, -0.15));
      for (let i = 0; i < 6; i++) {
        R(g, -300 + i * 120, -500, 44, 430, 0, C.shade(col, 0.06));
        R(g, -300 + i * 120, -500, 10, 430, 0, C.shade(col, -0.12));
      }
      R(g, -380, -70, 760, 70, 0, C.shade(col, -0.2));
      for (let i = 0; i < 4; i++) R(g, -380 - i * 14, -70 + i * 17, 760 + i * 28, 17, 0, C.shade(col, -0.1 - i * 0.04));
      R(g, -50, -300, 100, 230, 0, MT.VALUE_2E2A24);
      if (o.text) {
        g.fillStyle = MT.VALUE_3A3A3A;
        g.font = ME.font(700, 34, MT.SERIF);
        g.textAlign = MT.CENTER;
        g.fillText(String(o.text).toUpperCase().slice(0, 28), 0, -548);
        g.textAlign = MT.LEFT;
      }
    },
    { tags: [MT.NGAN_HANG], params: { text: MT.TEN_NGAN_HANG } },
  );
  A(MT.WAREHOUSE, MT.NHA_KHO, MT.URBAN, [600, 320], (g, o) => {
    const col = o.color || MT.VALUE_7C8890;
    R(g, -300, -260, 600, 260, 0, col);
    poly(
      g,
      [
        [-310, -255],
        [0, -320],
        [310, -255],
      ],
      C.shade(col, -0.2),
    );
    for (let i = 0; i < 12; i++) R(g, -300 + i * 50, -260, 3, 260, 0, C.shade(col, -0.12));
    R(g, -80, -180, 160, 180, 0, C.shade(col, -0.35));
  });
  A(
    MT.CHURCH,
    MT.NHA_THO,
    MT.URBAN,
    [380, 760],
    (g, o) => {
      const col = o.color || MT.CFC4B0;
      R(g, -190, -360, 380, 360, 0, col);
      poly(
        g,
        [
          [-200, -360],
          [0, -470],
          [200, -360],
        ],
        C.shade(col, -0.12),
      );
      R(g, -60, -700, 120, 340, 0, col);
      poly(
        g,
        [
          [-70, -700],
          [0, -800],
          [70, -700],
        ],
        MT.VALUE_5A5F66,
      );
      blob(g, 0, -600, 30, MT.VALUE_2E3540);
      R(g, -45, -170, 90, 170, 0, MT.VALUE_4A3020);
    },
    { tags: [MT.NHA_THO_2] },
  );
  A(
    MT.COURTHOUSE,
    MT.TOA_AN,
    MT.URBAN,
    [700, 520],
    (g, o) => {
      ME.registry.assets.bank_facade.draw(g, Object.assign({}, o, { text: o.text || MT.PALAIS_DE_JUSTICE, color: o.color || MT.D9D2C2 }));
    },
    { tags: [MT.TOA_AN_2] },
  );
  A(
    MT.PRISON_WALL,
    MT.TUONG_NHA_TU,
    MT.URBAN,
    [900, 420],
    (g, o) => {
      const col = o.color || MT.VALUE_8C8A84;
      R(g, -450, -320, 900, 320, 0, col);
      for (let i = 0; i < 18; i++) R(g, -450 + i * 50, -320, 2, 320, 0, C.shade(col, -0.1));
      R(g, 300, -430, 90, 430, 0, C.shade(col, -0.08));
      R(g, 280, -450, 130, 30, 0, C.shade(col, -0.2));
      g.strokeStyle = MT.VALUE_3A3A3A;
      g.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        g.beginPath();
        g.arc(-440 + i * 30, -330, 10, PI, 0);
        g.stroke();
      }
    },
    { tags: [MT.NHA_TU] },
  );
  A(
    MT.CONTROL_TOWER,
    MT.DAI_KIEM_SOAT_SAN_BAY,
    MT.URBAN,
    [220, 700],
    (g, o) => {
      R(g, -40, -560, 80, 560, 0, o.color || MT.D7D9DC);
      poly(
        g,
        [
          [-110, -560],
          [110, -560],
          [90, -660],
          [-90, -660],
        ],
        MT.VALUE_2D3B4A,
      );
      R(g, -100, -680, 200, 24, 0, MT.C9CCD0);
      R(g, -6, -760, 12, 80, 0, MT.VALUE_999);
    },
    { tags: [MT.SAN_BAY], lights: (o) => [{ type: MT.GLOW, x: 0, y: -760, r: 30, color: Math.sin((o.t || 0) * 4) > 0.5 ? MT.FF3030 : MT.VALUE_400000, alpha: 0.9 }] },
  );
  A(
    MT.STREET_LAMP,
    MT.DEN_DUONG,
    MT.STREET,
    [80, 420],
    (g, o) => {
      R(g, -6, -400, 12, 400, 2, MT.VALUE_25282D);
      g.strokeStyle = MT.VALUE_25282D;
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(0, -390);
      g.quadraticCurveTo(10, -430, 60, -425);
      g.stroke();
      poly(
        g,
        [
          [40, -430],
          [82, -430],
          [74, -410],
          [48, -410],
        ],
        MT.VALUE_2A2D33,
      );
      R(g, 50, -410, 22, 6, 2, o.night !== false ? MT.FFF0C4 : MT.DDD);
      R(g, -14, -20, 28, 20, 2, MT.VALUE_25282D);
    },
    { tags: [MT.DEN], lights: (o) => (o.night ? [{ type: MT.LAMP, x: 61, y: -406, len: 440, color: MT.FFD89A, alpha: 0.42 }] : []) },
  );
  A(MT.TRAFFIC_LIGHT, MT.DEN_GIAO_THONG, MT.STREET, [60, 360], (g, o) => {
    R(g, -5, -360, 10, 360, 2, MT.VALUE_2A2D33);
    R(g, -18, -360, 36, 96, 6, MT.VALUE_1D1F23);
    const st = o.state || [MT.RED, MT.GREEN, MT.YELLOW][Math.floor(((o.t || 0) / 3) % 3)];
    [
      [MT.RED, MT.FF3B30],
      [MT.YELLOW, MT.FFCC00],
      [MT.GREEN, MT.VALUE_34C759],
    ].forEach(([k, c], i) => {
      ME.glow(g, 0, -342 + i * 30, 0, c, 0);
      R(g, -9, -351 + i * 30, 18, 18, 9, st === k ? c : C.shade(c, -0.75));
    });
  });
  A(MT.BENCH, MT.GHE_DA_CONG_VIEN, MT.STREET, [180, 80], (g, o) => {
    const col = o.color || MT.VALUE_6A4A2E;
    R(g, -90, -48, 180, 10, 2, col);
    R(g, -90, -80, 180, 8, 2, col);
    R(g, -80, -48, 8, 48, 0, MT.VALUE_2B2B2B);
    R(g, 72, -48, 8, 48, 0, MT.VALUE_2B2B2B);
  });
  A(MT.FENCE, MT.HANG_RAO, MT.STREET, [400, 120], (g, o) => {
    const col = o.color || MT.VALUE_2A2D33;
    R(g, -200, -100, 400, 6, 0, col);
    R(g, -200, -40, 400, 6, 0, col);
    for (let i = 0; i <= 20; i++) R(g, -200 + i * 20, -118, 5, 118, 0, col);
  });
  A(
    MT.POWER_POLE,
    MT.COT_DIEN,
    MT.STREET,
    [180, 560],
    (g, o) => {
      R(g, -7, -540, 14, 540, 0, o.color || MT.VALUE_4A3A2C);
      R(g, -80, -500, 160, 9, 0, MT.VALUE_3A2E22);
      [-70, -20, 30, 70].forEach((x) => R(g, x - 3, -514, 6, 14, 1, MT.BFC6CC));
    },
    { tags: [MT.DAY_DIEN] },
  );
  A(MT.PHONE_BOOTH, MT.BOT_DIEN_THOAI, MT.STREET, [110, 300], (g, o) => {
    const col = o.color || MT.A42A24;
    R(g, -55, -300, 110, 300, 6, col);
    for (let r = 0; r < 4; r++) R(g, -40, -270 + r * 56, 80, 46, 2, o.night ? MT.FFE2A0 : MT.VALUE_33414F);
  });
  A(MT.MAILBOX, MT.HOM_THU, MT.STREET, [60, 140], (g, o) => {
    R(g, -6, -80, 12, 80, 0, MT.VALUE_333);
    R(g, -30, -140, 60, 64, 26, o.color || MT.D9A21B);
  });
  A(
    MT.SIGNPOST,
    MT.BIEN_CHI_DUONG,
    MT.STREET,
    [200, 300],
    (g, o) => {
      R(g, -5, -300, 10, 300, 0, MT.VALUE_555);
      R(g, -90, -290, 180, 50, 4, o.color || MT.VALUE_2A5F9E);
      if (o.text) {
        g.fillStyle = MT.FFF;
        g.font = ME.font(700, 24, MT.HEAD);
        g.textAlign = MT.CENTER;
        g.fillText(String(o.text).slice(0, 14), 0, -256);
        g.textAlign = MT.LEFT;
      }
    },
    { params: { text: MT.CHU_TREN_BIEN } },
  );
  A(MT.CAFE_TABLE, MT.BAN_CA_PHE_VIA_HE, MT.STREET, [160, 140], (g, o) => {
    R(g, -60, -80, 120, 8, 4, o.color || MT.D9D2C4);
    R(g, -4, -80, 8, 80, 0, MT.VALUE_333);
    R(g, -30, -4, 60, 4, 2, MT.VALUE_333);
    poly(
      g,
      [
        [-80, -230],
        [80, -230],
        [0, -270],
      ],
      MT.VALUE_8A2A2A,
    );
    R(g, -2, -230, 4, 150, 0, MT.VALUE_333);
  });
  A(MT.NEWSPAPER_STAND, MT.SAP_BAO, MT.STREET, [200, 260], (g, o) => {
    R(g, -100, -220, 200, 220, 4, o.color || MT.VALUE_2E5A3E);
    poly(
      g,
      [
        [-115, -220],
        [115, -220],
        [100, -250],
        [-100, -250],
      ],
      MT.VALUE_1E3A2A,
    );
    for (let i = 0; i < 6; i++) R(g, -85 + (i % 3) * 58, -200 + Math.floor(i / 3) * 70, 48, 60, 1, i % 2 ? MT.EBE6DA : MT.D9D1BF);
  });
  A(
    MT.MANHOLE,
    MT.NAP_CONG,
    MT.STREET,
    [120, 16],
    (g) => {
      g.fillStyle = MT.VALUE_2A2A2A;
      g.beginPath();
      g.ellipse(0, -3, 60, 8, 0, 0, PI * 2);
      g.fill();
    },
    { tags: [MT.CONG] },
  );
  A(
    MT.FLAG,
    MT.LA_CO,
    MT.STREET,
    [160, 420],
    (g, o) => {
      R(g, -3, -420, 6, 420, 0, MT.VALUE_999);
      const cols = o.colors || [MT.VALUE_1F3F8A, MT.F1F1F1, MT.C8102E];
      const w = 150,
        h = 96,
        t = o.t || 0;
      for (let i = 0; i < cols.length; i++) {
        g.fillStyle = cols[i];
        g.beginPath();
        const x0 = 3 + (i * w) / cols.length,
          x1 = 3 + ((i + 1) * w) / cols.length;
        const wv = (x) => Math.sin(x * 0.05 - t * 4) * (x / w) * 8;
        g.moveTo(x0, -410 + wv(x0));
        g.lineTo(x1, -410 + wv(x1));
        g.lineTo(x1, -410 + h + wv(x1));
        g.lineTo(x0, -410 + h + wv(x0));
        g.fill();
      }
    },
    { params: { colors: MT.MANG_MAU_CO_TU_CHON_VI_DU_3 } },
  );
  A(MT.FOUNTAIN, MT.DAI_PHUN_NUOC, MT.STREET, [300, 260], (g, o) => {
    R(g, -150, -60, 300, 60, 8, MT.B7B0A2);
    R(g, -20, -180, 40, 120, 4, MT.B7B0A2);
    g.strokeStyle = MT.RGBA_200_225_255_0_7;
    g.lineWidth = 3;
    for (let i = -3; i <= 3; i++) {
      const s = Math.sin((o.t || 0) * 3 + i) * 4;
      g.beginPath();
      g.moveTo(0, -180);
      g.quadraticCurveTo(i * 30, -260 + s, i * 45, -60);
      g.stroke();
    }
  });
  A(
    MT.RUNWAY,
    MT.DUONG_BANG,
    MT.STREET,
    [1600, 40],
    (g) => {
      R(g, -800, -14, 1600, 14, 0, MT.VALUE_3A3D42);
      for (let i = 0; i < 16; i++) R(g, -780 + i * 100, -9, 60, 4, 0, MT.E9E6DC);
    },
    { tags: [MT.SAN_BAY] },
  );
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
