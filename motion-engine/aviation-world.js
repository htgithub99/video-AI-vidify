(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  if (!T || !ME.AVIATION) return;
  const K = T.kit;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { paint, rect, rrect, ell, poly, stroke, glowDisc, P } = K;
  const AV = ME.AVIATION;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const box = (g, x, y, w, h, col, o) => paint(g, rect(x, y, w, h), col, Object.assign({ d: 0, lw: 1.2 }, o || {}));
  const flat = (g, x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const vgrad = (g, x, y, w, h, stops) => {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  };
  const add = (id, name, cat, size, draw, tags, extra) => {
    T.NEW(id, name, cat, size, draw, Object.assign({ tags: [MT.TOON, MT.MAY_BAY, MT.HANG_KHONG].concat(tags || []) }, extra || {}));
    AV.assets.push(id);
  };
  const PASSENGERS = [MT.PASSENGER_MAN, MT.PASSENGER_WOMAN, MT.PASSENGER_ELDER, MT.MAN_CASUAL, MT.WOMAN_CASUAL, MT.BUSINESSMAN, MT.BUSINESSWOMAN, MT.YOUNG_WOMAN, MT.YOUNG_MAN, MT.ELDERLY_WOMAN, MT.JOURNALIST, MT.ELDERLY_MAN];
  const hashN = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  ME.registerAction(MT.SIT_AFRAID, {
    name: MT.NGOI_SO_HAI_TREN_GHE_CON_TIN,
    loop: true,
    stride: 0,
    pose: (ph, t) => {
      const base = ME.registry.actions.sit.pose(ph, t, {});
      return Object.assign({}, base, {
        lean: 0.22 + Math.sin(t * 10) * 0.012,
        head: 0.32,
        a: [
          [0.75 + Math.sin(t * 9) * 0.03, 1.75],
          [0.65, 1.85],
        ],
      });
    },
  });
  AV.actions.push(MT.SIT_AFRAID);
  ME.registerAction(MT.SIT_HANDS_UP, {
    name: MT.NGOI_GIO_HAI_TAY_DAU_HANG_BI_KHONG,
    loop: true,
    stride: 0,
    pose: (ph, t) => {
      const base = ME.registry.actions.sit.pose(ph, t, {});
      return Object.assign({}, base, {
        lean: -0.04,
        head: -0.05 + Math.sin(t * 0.8) * 0.03,
        a: [
          [2.8 + Math.sin(t * 9) * 0.025, 0.45],
          [2.7, 0.5],
        ],
      });
    },
  });
  AV.actions.push(MT.SIT_HANDS_UP);
  const seatDraw = (pilot) => (g, o) => {
    const col = o.color || (pilot ? MT.VALUE_3A3632 : MT.VALUE_2B3A5C);
    const dark = C.shade(col, -0.22);
    paint(g, rect(-36, -5, 74, 5), MT.VALUE_4A4E55, { d: 0, lw: 1 });
    paint(g, rect(-22, -38, 5, 34), MT.VALUE_5A5E66, { d: 0, lw: 0.9 });
    paint(g, rect(18, -38, 5, 34), MT.VALUE_5A5E66, { d: 0, lw: 0.9 });
    paint(
      g,
      poly(
        [
          [-38, -42],
          [-22, -44],
          [-27, pilot ? -126 : -118],
          [-45, pilot ? -124 : -116],
        ],
        true,
      ),
      dark,
      { d: 2, lw: 1.2 },
    );
    paint(g, rrect(-48, pilot ? -142 : -132, 21, 24, 6), pilot ? MT.E8E0CC : MT.E9E6DC, { d: 1, lw: 1 });
    paint(g, rrect(-31, -48, 64, 13, 6), col, { d: 1.5, lw: 1.2 });
    if (o.passenger) {
      const seed = (o.seed || 0) + 7;
      const id = typeof o.passenger === MT.STRING && ME.registry.characters[o.passenger] ? o.passenger : PASSENGERS[Math.floor(hashN(seed) * PASSENGERS.length)];
      const action = o.mood === MT.AFRAID ? MT.SIT_AFRAID : MT.SIT;
      g.save();
      g.translate(-2, 0);
      ME.drawCharacter(g, id, { action, t: (o.t || 0) + seed * 0.37, phase: seed, facing: 1, shadow: false });
      g.restore();
    }
    paint(g, rrect(-24, -72, 42, 6, 3), pilot ? MT.VALUE_4A4440 : MT.VALUE_5A5E66, { d: 0.5, lw: 1 });
    paint(g, rect(-6, -68, 4, 20), MT.VALUE_4A4E55, { d: 0, lw: 0.8 });
  };
  add(MT.AIRPLANE_SEAT, MT.GHE_MAY_BAY_CO_THE_CO_HANH_KHACH, MT.FURNITURE, [100, 140], seatDraw(false), [MT.GHE_2, MT.HANH_KHACH]);
  add(MT.PILOT_SEAT, MT.GHE_PHI_CONG_TRONG_BUONG_LAI, MT.FURNITURE, [100, 150], seatDraw(true), [MT.BUONG_LAI, MT.PHI_CONG_2]);
  add(
    MT.COCKPIT_DOOR,
    MT.CUA_BUONG_LAI_BOC_THEP_TREN_VACH_NGAN,
    MT.STRUCTURE,
    [320, 430],
    (g, o) => {
      const open = clamp(o.open || 0, 0, 1);
      const wall = MT.D6D3CB;
      paint(g, rrect(-160, -430, 320, 430, 4), wall, { d: 3, lw: 1.3 });
      flat(g, -160, -430, 320, 26, MT.C4C0B6);
      for (const x of [-120, 120]) flat(g, x - 1, -404, 2, 404, MT.RGBA_0_0_0_0_08);
      paint(g, rect(-54, -212, 108, 212), MT.VALUE_8A8E94, { d: 1, lw: 1.2 });
      const ix = -46,
        iw = 92,
        ih = 204;
      if (open > 0.01) {
        paint(g, rect(ix, -ih, iw, ih), MT.VALUE_10151E, { d: 0, lw: 1 });
        vgrad(g, ix + 4, -ih + 30, iw - 8, 46, [o.night ? MT.VALUE_1A2A4A : MT.BFE2FF, o.night ? MT.VALUE_0A1222 : MT.VALUE_8AC0F0]);
        flat(g, ix + 4, -ih + 76, iw - 8, 26, MT.VALUE_1A1F26);
        for (let i = 0; i < 3; i++) paint(g, rect(ix + 10 + i * 26, -ih + 82, 18, 12), i === 1 ? MT.VALUE_3AD08A : MT.VALUE_4AA0FF, { d: 0, ink: false, glow: MT.RGBA_90_180_255_0_6, glowR: 8 });
      }
      const lw = iw * (1 - open * 0.86);
      const leaf = open > 0.01 ? C.shade(MT.B8BCC2, -0.25 * open) : MT.B8BCC2;
      paint(g, rect(ix, -ih, lw, ih), leaf, { d: 1.5, lw: 1.1 });
      if (lw > 30) {
        for (let y = -ih + 30; y < -10; y += 34) flat(g, ix + 6, y, lw - 12, 2, MT.RGBA_0_0_0_0_12);
        paint(g, ell(ix + lw * 0.5, -ih + 58, 4, 4), MT.VALUE_2A2E34, { d: 0, lw: 0.8 });
        paint(g, rrect(ix + lw - 14, -110, 8, 26, 3), MT.VALUE_6A6E74, { d: 0.5, lw: 0.9 });
      }
      for (let i = 0; i < (o.holes || 0); i++) paint(g, ell(ix + 18 + hashN(i + 3) * (Math.max(20, lw) - 30), -ih + 30 + hashN(i + 9) * 150, 3.2, 3.2), MT.VALUE_1A1A1A, { d: 0, lw: 0.6 });
      paint(g, rrect(64, -136, 20, 30, 3), MT.VALUE_2A2E34, { d: 0.8, lw: 1 });
      const ok = open > 0.5 || o.unlocked;
      paint(g, ell(74, -128, 3, 3), ok ? MT.VALUE_3AE27A : MT.E2423A, { d: 0, ink: false, glow: ok ? MT.RGBA_60_230_120_0_8 : MT.RGBA_230_60_50_0_8, glowR: 10 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) flat(g, 67 + c * 5, -120 + r * 4.5, 3.5, 3, MT.VALUE_8A9098);
      paint(g, rect(-34, -250, 68, 18), MT.VALUE_3A3E44, { d: 0, lw: 0.9 });
      flat(g, -28, -244, 56, 6, MT.E8E4DA);
    },
    [MT.CUA, MT.BUONG_LAI, MT.VACH_NGAN, MT.AN_NINH],
  );
  const STAIR = { x0: -150, y0: -66, x1: 214, topW: 76 };
  AV.STAIR = STAIR;
  add(
    MT.STAIR_TRUCK,
    MT.XE_THANG_LEN_MAY_BAY_THANG_AP_VAO,
    MT.VEHICLE,
    [660, 560],
    (g, o) => {
      const h = clamp(o.h || 470, 220, 700);
      const body = o.color || MT.E2B62A;
      for (const wx of [-250, 170]) {
        paint(g, ell(wx, -26, 26, 26), MT.VALUE_1C1D20, { d: 2, lw: 1.2 });
        paint(g, ell(wx, -26, 11, 11), MT.VALUE_8A8E94, { d: 0, lw: 0.9 });
      }
      paint(g, rrect(-300, -74, 560, 34, 6), body, { d: 2, lw: 1.3 });
      paint(g, rrect(-318, -168, 118, 104, 14), body, { d: 3, lw: 1.3 });
      paint(g, rrect(-306, -156, 72, 50, 8), MT.VALUE_9AC8E6, { d: 0, lw: 1.1 });
      const sx0 = STAIR.x0,
        sy0 = STAIR.y0,
        sx1 = STAIR.x1,
        sy1 = -h;
      stroke(
        g,
        [
          [-60, -74],
          [sx1 - 30, sy1 + 30],
        ],
        MT.VALUE_6A6E74,
        9,
        true,
      );
      stroke(
        g,
        [
          [120, -74],
          [sx1 - 120, sy1 + 80],
        ],
        MT.VALUE_6A6E74,
        9,
        true,
      );
      const n = Math.max(6, Math.round((sy0 - sy1) / 24));
      const sp = P();
      sp.moveTo(sx0, sy0);
      sp.lineTo(sx1, sy1);
      sp.lineTo(sx1, sy1 + 22);
      sp.lineTo(sx0 + 14, sy0 + 10);
      sp.closePath();
      paint(g, sp, MT.CFD2D6, { d: 2, lw: 1.2 });
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const x = U.lerp(sx0, sx1, k),
          y = U.lerp(sy0, sy1, k);
        stroke(
          g,
          [
            [x - 4, y],
            [x + 16, y],
          ],
          MT.VALUE_8A8E94,
          3,
        );
      }
      paint(g, rect(sx1, sy1 - 4, STAIR.topW, 10), MT.CFD2D6, { d: 1, lw: 1.1 });
      const rail = (dy) =>
        stroke(
          g,
          [
            [sx0 + 10, sy0 - dy],
            [sx1, sy1 - dy],
            [sx1 + STAIR.topW, sy1 - dy],
          ],
          MT.E8EAEC,
          3.2,
          true,
        );
      rail(66);
      rail(34);
      for (let i = 0; i <= 6; i++) {
        const k = i / 6;
        const x = U.lerp(sx0 + 10, sx1, k),
          y = U.lerp(sy0, sy1, k);
        stroke(
          g,
          [
            [x, y],
            [x, y - 66],
          ],
          MT.E8EAEC,
          2.4,
        );
      }
      stroke(
        g,
        [
          [sx1 + STAIR.topW, sy1],
          [sx1 + STAIR.topW, sy1 - 66],
        ],
        MT.E8EAEC,
        2.4,
      );
    },
    [MT.XE_THANG, MT.CAU_THANG, MT.LEN_MAY_BAY, MT.DOT_KICH],
  );
  add(
    MT.EVAC_SLIDE,
    MT.CAU_TRUOT_THOAT_HIEM_BOM_HOI_TU_CUA,
    MT.STRUCTURE,
    [560, 470],
    (g, o) => {
      const h = clamp(o.h || 440, 200, 700);
      const x0 = -250,
        y0 = -h,
        x1 = 270,
        y1 = -8;
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const k = i / 20;
        const e = k < 0.8 ? k / 0.8 : 1;
        pts.push([U.lerp(x0, x1, k), U.lerp(y0, y1, Math.sin((e * PI) / 2) * 0.92 + (k >= 0.8 ? 0.08 * ((k - 0.8) / 0.2) : 0))]);
      }
      const p = P();
      p.moveTo(pts[0][0], pts[0][1] - 26);
      for (const q of pts) p.lineTo(q[0], q[1] - 26);
      for (let i = pts.length - 1; i >= 0; i--) p.lineTo(pts[i][0], pts[i][1] + 12);
      p.closePath();
      paint(g, p, MT.F0C02E, { d: 4, lw: 1.3 });
      const top = pts.map((q) => [q[0], q[1] - 22]);
      stroke(g, top, MT.FFE27A, 9, true);
      stroke(
        g,
        pts.map((q) => [q[0], q[1] - 4]),
        MT.F6D45A,
        6,
      );
    },
    [MT.CAU_TRUOT, MT.THOAT_HIEM, MT.SO_TAN],
  );
  const AIRLINER = { door: { x: -780, y: -456 }, door2: { x: -2650, y: -456 }, window: { x: -238, y: -566 }, len: 3900 };
  AV.AIRLINER = AIRLINER;
  add(
    MT.AIRLINER,
    MT.MAY_BAY_CHO_KHACH_DO_DUOI_DAT_THAN,
    MT.AIRCRAFT,
    [3900, 1260],
    (g, o) => {
      const night = !!o.night;
      const white = night ? MT.VALUE_9AA4B4 : MT.F1F2F4,
        belly = night ? MT.VALUE_6A7280 : MT.C9CED6,
        blue = o.stripe || MT.VALUE_1F4A8A;
      const finP = poly([
        [-3260, -700],
        [-3470, -1240],
        [-3720, -1240],
        [-3820, -660],
      ]);
      paint(g, finP, white, { d: 4, lw: 1.3 });
      g.save();
      g.clip(finP);
      flat(g, -3900, -1240, 800, 220, blue);
      g.restore();
      paint(
        g,
        poly([
          [-3300, -560],
          [-3620, -520],
          [-3700, -470],
          [-3330, -500],
        ]),
        C.shade(white, -0.08),
        { d: 2, lw: 1.1 },
      );
      const body = P();
      body.moveTo(-3880, -640);
      body.lineTo(-3300, -730);
      body.lineTo(-560, -730);
      body.bezierCurveTo(-260, -730, -60, -620, 0, -440);
      body.bezierCurveTo(-30, -300, -200, -170, -560, -170);
      body.lineTo(-3050, -170);
      body.bezierCurveTo(-3400, -170, -3700, -420, -3880, -560);
      body.closePath();
      paint(g, body, white, { d: 6, lw: 1.5 });
      g.save();
      g.clip(body);
      flat(g, -3900, -330, 3900, 200, belly);
      flat(g, -3900, -476, 3900, 16, blue);
      flat(g, -3900, -458, 3900, 5, MT.C43A3A);
      for (let x = -1010; x > -3250; x -= 52) {
        if (x < -1500 && x > -1580) continue;
        paint(g, rrect(x, -546, 17, 24, 8), night ? MT.FFD98A : MT.VALUE_2A3A50, { d: 0, lw: 0.8, glow: night ? MT.RGBA_255_210_120_0_8 : null, glowR: 10 });
      }
      g.restore();
      const cock = [
        [
          [-360, -596],
          [-290, -606],
          [-284, -560],
          [-352, -556],
        ],
        [
          [-276, -606],
          [-210, -598],
          [-200, -560],
          [-270, -560],
        ],
        [
          [-196, -594],
          [-150, -572],
          [-140, -548],
          [-188, -556],
        ],
      ];
      cock.forEach((q, i) => {
        const openW = i === 1 && o.windowOpen;
        paint(g, poly(q), openW ? MT.VALUE_0A0E14 : night ? MT.VALUE_2A3446 : MT.VALUE_1C2838, { d: 0, lw: 1 });
        if (!openW) stroke(g, [q[0], [U.lerp(q[0][0], q[1][0], 0.5), U.lerp(q[0][1], q[2][1], 0.4)]], MT.RGBA_255_255_255_0_35, 2);
      });
      const dOpen = clamp(o.doorOpen || 0, 0, 1);
      const dx = AIRLINER.door.x,
        dy = AIRLINER.door.y;
      paint(g, rrect(dx - 42, dy - 196, 84, 196, 12), dOpen > 0.02 ? MT.VALUE_141A22 : C.shade(white, -0.04), { d: 0, lw: 1.4 });
      if (dOpen > 0.02) {
        paint(g, rrect(dx + 42, dy - 196, 84 * dOpen * 0.9, 196, 10), C.shade(white, -0.1), { d: 2, lw: 1.2 });
        if (night) glowDisc(g, dx, dy - 90, 120, MT.FFD98A, 0.45);
      } else paint(g, rrect(dx + 20, dy - 108, 12, 5, 2), MT.VALUE_8A8E94, { d: 0, lw: 0.8 });
      const d2 = clamp(o.door2Open || 0, 0, 1);
      const d2x = AIRLINER.door2.x;
      paint(g, rrect(d2x - 40, dy - 190, 80, 190, 12), d2 > 0.02 ? MT.VALUE_141A22 : C.shade(white, -0.04), { d: 0, lw: 1.4 });
      if (d2 > 0.02 && night) glowDisc(g, d2x, dy - 90, 110, MT.FFD98A, 0.4);
      const eng = rrect(-1760, -232, 560, 158, 76);
      paint(
        g,
        poly([
          [-1350, -300],
          [-1980, -286],
          [-2560, -150],
          [-2440, -140],
          [-1700, -246],
        ]),
        C.shade(white, -0.16),
        { d: 2, lw: 1.2 },
      );
      paint(g, rect(-1560, -300, 70, 70), C.shade(white, -0.12), { d: 1, lw: 1 });
      paint(g, eng, night ? MT.VALUE_8A929E : MT.DDE0E5, { d: 6, lw: 1.3 });
      paint(g, ell(-1206, -153, 22, 74), MT.VALUE_2A2E34, { d: 0, lw: 1.1 });
      paint(g, rect(-1780, -170, 70, 40), MT.VALUE_4A4E55, { d: 0, lw: 1 });
      const gear = (x, n, r) => {
        paint(g, rect(x - 7, -175, 14, 175 - r), MT.VALUE_5A5E64, { d: 0, lw: 1 });
        for (let i = 0; i < n; i++) {
          paint(g, ell(x + (i - (n - 1) / 2) * r * 2.05, -r, r, r), MT.VALUE_1C1D20, { d: 2, lw: 1.2 });
          paint(g, ell(x + (i - (n - 1) / 2) * r * 2.05, -r, r * 0.45, r * 0.45), MT.VALUE_7A7E84, { d: 0, lw: 0.8 });
        }
      };
      gear(-420, 1, 28);
      gear(-2050, 2, 40);
      const blink = Math.sin((o.t || 0) * 6) > 0.6;
      if (blink) {
        glowDisc(g, -2200, -740, 40, MT.FF3A2A, 0.9);
        glowDisc(g, -2200, -165, 34, MT.FF3A2A, 0.8);
      }
    },
    [MT.MAY_BAY, MT.SAN_DO, MT.THAN_MAY_BAY],
    { lights: (o) => (o.night ? [{ type: MT.GLOW, x: -780, y: -560, r: 260, color: MT.FFD98A, alpha: (o.doorOpen || 0) > 0.1 ? 0.5 : 0.15 }] : []) },
  );
  const gunAsset = (kind) => (g) => {
    g.save();
    g.translate(kind === MT.PISTOL ? -8 : -14, -6);
    RI2().HELD_EXTRA[kind](g, {}, 0, 0);
    g.restore();
  };
  const RI2 = () => ME.rigInternals;
  add(MT.RIFLE, MT.SUNG_TRUONG_TIEU_LIEN, MT.PROP, [110, 40], gunAsset(MT.RIFLE), [MT.SUNG, MT.VU_KHI]);
  add(MT.PISTOL, MT.SUNG_NGAN, MT.PROP, [40, 24], gunAsset(MT.PISTOL), [MT.SUNG, MT.VU_KHI]);
  const isN = (tp) => !!tp.night;
  const cabinWall = (g, x0, x1, tp, pitch, off) => {
    g.save();
    g.translate(0, 150);
    const night = isN(tp) || tp.ambient > 0.45;
    vgrad(g, x0, -900, x1 - x0, 900, [MT.C9C6BE, MT.E6E2D8, MT.ECE8E0, MT.D8D4CA]);
    flat(g, x0, -900, x1 - x0, 330, MT.E4E0D6);
    vgrad(g, x0, -600, x1 - x0, 40, [MT.RGBA_0_0_0_0_18, MT.RGBA_0_0_0_0]);
    for (let x = Math.floor((x0 - off) / pitch) * pitch + off; x < x1 + pitch; x += pitch) {
      const wx = x + 6;
      paint(g, rrect(wx - 22, -300, 44, 62, 20), MT.CFCAC0, { d: 1.5, lw: 1.1 });
      const inner = rrect(wx - 15, -292, 30, 46, 14);
      g.save();
      g.clip(inner);
      vgrad(g, wx - 15, -292, 30, 46, night ? [MT.VALUE_0A1430, MT.VALUE_1A2A52] : tp.ambient > 0.15 && tp.ambient < 0.4 ? [MT.E8A06A, MT.F2D29A] : [MT.VALUE_7AB6EA, MT.D8ECFA]);
      if (!night) flat(g, wx - 15, -262, 30, 16, MT.RGBA_255_255_255_0_55);
      const shade = hashN(x * 0.13) < 0.35 ? 0.45 + hashN(x) * 0.4 : 0;
      if (shade) flat(g, wx - 15, -292, 30, 46 * shade, MT.E2DED4);
      g.restore();
      paint(g, inner, MT.RGBA_0_0_0_0, { d: 0, lw: 1 });
    }
    paint(g, rect(x0, -540, x1 - x0, 92), MT.EFECE6, { d: 0, lw: 1.2 });
    vgrad(g, x0, -452, x1 - x0, 18, [MT.A8A49C, MT.D8D4CC]);
    for (let x = Math.floor(x0 / (pitch * 3)) * pitch * 3; x < x1; x += pitch * 3) {
      flat(g, x, -540, 2, 92, MT.RGBA_0_0_0_0_12);
      paint(g, rrect(x + pitch * 1.5 - 18, -470, 36, 7, 3), MT.VALUE_9A968E, { d: 0, lw: 0.8 });
    }
    for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) glowDisc(g, x + 60, -428, 18, MT.FFF4D8, 0.35);
    vgrad(g, x0, -900, x1 - x0, 360, [MT.BDB9B0, MT.E8E4DC]);
    flat(g, x0, -560, x1 - x0, 20, MT.F6F2EA);
    glowDisc(g, (x0 + x1) / 2, -552, 6, MT.FFFBE8, 0);
    g.fillStyle = MT.RGBA_255_250_230_0_55;
    g.fillRect(x0, -558, x1 - x0, 5);
    vgrad(g, x0, -190, x1 - x0, 50, [MT.CFCBC2, MT.A9A59C]);
    g.restore();
  };
  const SEAT_PITCH = 92;
  const SEAT_OFF = 46;
  AV.CABIN = { pitch: SEAT_PITCH, off: SEAT_OFF, lane: MT.MID, backLane: MT.BACK, aisle: MT.FRONT };
  const seatRow = (WW, lane, mood, occ, seedK, off) => {
    const out = [];
    for (let x = off; x < WW + SEAT_PITCH; x += SEAT_PITCH) {
      const h = hashN(x * seedK + 3.1);
      out.push({ asset: MT.AIRPLANE_SEAT, x, lane, params: { passenger: h < occ, seed: Math.round(x * seedK), mood: mood && h < 0.85 ? mood : undefined } });
    }
    return out;
  };
  const reg = (id, def) => {
    ME.registerEnvironment(id, def);
    AV.envs.push(id);
  };
  reg(MT.AIRPLANE_CABIN, {
    name: MT.KHOANG_HANH_KHACH_MAY_BAY_HANG_GHE_LOI,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3200,
    tags: [MT.MAY_BAY, MT.KHOANG_HANH_KHACH, MT.HANG_KHONG, MT.CON_TIN, MT.KHONG_TAC],
    lanes: [MT.BACK, MT.MID, MT.FRONT, MT.FORE],
    lanes3d: { back: -2.5, mid: -1.35, front: 0, fore: 1.1 },
    zBack3d: -3.3,
    sky: (g, W, H) => {
      g.fillStyle = MT.VALUE_1A1814;
      g.fillRect(0, 0, W, H);
    },
    layers: [{ depth: 1, top: 900, draw: (g, x0, x1, tp) => cabinWall(g, x0, x1, tp, SEAT_PITCH, SEAT_OFF) }],
    ground: (g, x0, x1, tp, H) => {
      vgrad(g, x0 - 10, -152, x1 - x0 + 20, H + 170, [MT.VALUE_4A5468, MT.VALUE_5A6478, MT.VALUE_3E4658]);
      vgrad(g, x0 - 10, -30, x1 - x0 + 20, 70, [MT.VALUE_7A3A44, MT.VALUE_6A2E38]);
      for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) flat(g, x, -28, 22, 2, MT.RGBA_255_255_255_0_08);
      for (let x = Math.floor(x0 / 184) * 184 + 40; x < x1; x += 184) glowDisc(g, x, 44, 7, MT.FF5A3A, 0.5);
    },
    props: (WW) => seatRow(WW, MT.BACK, null, 0.82, 0.71, SEAT_OFF + 24),
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 460) }, (_, i) => ({ type: MT.LAMP, x: 230 + i * 460, y: -560, len: 620, color: MT.FFF4E0, alpha: 0.1 })),
    dust: 0.12,
  });
  const cockpitWall = (g, x0, x1, tp) => {
    g.save();
    g.translate(0, 150);
    const night = isN(tp) || tp.ambient > 0.45;
    const dusk = tp.ambient > 0.15 && tp.ambient < 0.4 && !night;
    vgrad(g, x0, -900, x1 - x0, 900, [MT.VALUE_3A3E44, MT.VALUE_4A4E55, MT.VALUE_55595F]);
    const wsx = 1080,
      wsw = 640;
    const ws = P();
    ws.moveTo(wsx, -300);
    ws.lineTo(wsx + 60, -470);
    ws.lineTo(wsx + wsw - 20, -500);
    ws.lineTo(wsx + wsw + 60, -330);
    ws.lineTo(wsx + wsw + 40, -270);
    ws.lineTo(wsx + 10, -262);
    ws.closePath();
    g.save();
    g.clip(ws);
    vgrad(g, wsx, -520, wsw + 80, 270, night ? [MT.VALUE_04081A, MT.VALUE_0E1A3A, MT.VALUE_1A2A4A] : dusk ? [MT.VALUE_3A2A5A, MT.C86A4A, MT.F2B46A] : [MT.VALUE_4A8AD8, MT.VALUE_8AC0EE, MT.D8ECF8]);
    if (night) for (let i = 0; i < 40; i++) flat(g, wsx + hashN(i) * wsw, -500 + hashN(i + 50) * 140, 2, 2, MT.RGBA_255_255_255_0_7);
    flat(g, wsx, -300, wsw + 80, 40, night ? MT.VALUE_0A0E14 : MT.VALUE_5A6A5A);
    if (night) for (let i = 0; i < 14; i++) glowDisc(g, wsx + 40 + i * 44, -288, 5, i % 3 ? MT.FFD27A : MT.VALUE_4A8AFF, 0.9);
    g.restore();
    paint(g, ws, MT.RGBA_0_0_0_0, { d: 0, lw: 2.4 });
    for (const k of [0.33, 0.66])
      stroke(
        g,
        [
          [wsx + wsw * k + 20, -490],
          [wsx + wsw * k + 20, -264],
        ],
        MT.VALUE_2A2E34,
        7,
        true,
      );
    paint(g, rrect(wsx - 10, -268, wsw + 90, 30, 8), MT.VALUE_22262C, { d: 2, lw: 1.2 });
    paint(g, rect(wsx + 10, -238, wsw + 50, 120), MT.VALUE_2C3036, { d: 2, lw: 1.2 });
    for (let i = 0; i < 4; i++) {
      const sx = wsx + 40 + i * 150;
      paint(g, rrect(sx, -226, 110, 84, 6), MT.VALUE_0E1218, { d: 0, lw: 1 });
      const gr = g.createLinearGradient(0, -222, 0, -146);
      gr.addColorStop(0, i % 2 ? MT.VALUE_3A7AFF : MT.VALUE_2A9AE2);
      gr.addColorStop(0.5, i % 2 ? MT.VALUE_0E1A3A : MT.VALUE_7A4A2A);
      gr.addColorStop(1, MT.VALUE_0A0E14);
      g.fillStyle = gr;
      g.fillRect(sx + 6, -220, 98, 72);
      glowDisc(g, sx + 55, -184, 60, MT.VALUE_4AA0FF, 0.12);
      stroke(
        g,
        [
          [sx + 20, -184],
          [sx + 90, -184],
        ],
        MT.E8E8E8,
        1.5,
      );
    }
    paint(g, rect(780, -600, 900, 90), MT.VALUE_2A2E34, { d: 2, lw: 1.2 });
    for (let i = 0; i < 60; i++) flat(g, 800 + (i % 30) * 29, -588 + Math.floor(i / 30) * 36, 12, 8, hashN(i) < 0.2 ? MT.E2A23A : MT.VALUE_8A8E94);
    const sw = rrect(860, -440, 200, 150, 30);
    paint(g, sw, MT.VALUE_1A1E24, { d: 0, lw: 1.4 });
    g.save();
    g.clip(sw);
    vgrad(g, 860, -440, 200, 150, night ? [MT.VALUE_0A1430, MT.VALUE_1A2A52] : dusk ? [MT.C86A4A, MT.F2C27A] : [MT.VALUE_7AB6EA, MT.D8ECFA]);
    flat(g, 860, -330, 200, 40, night ? MT.VALUE_0A0E14 : MT.VALUE_6A7A6A);
    g.restore();
    stroke(
      g,
      [
        [960, -440],
        [960, -290],
      ],
      MT.VALUE_2A2E34,
      5,
      true,
    );
    paint(g, rrect(560, -460, 220, 460, 6), MT.C9C6BE, { d: 3, lw: 1.3 });
    paint(g, rect(614, -212, 112, 212), MT.VALUE_8A8E94, { d: 1, lw: 1.2 });
    paint(g, rect(622, -204, 96, 204), MT.B8BCC2, { d: 1.5, lw: 1.1 });
    paint(g, ell(670, -150, 4, 4), MT.VALUE_2A2E34, { d: 0, lw: 0.8 });
    paint(g, rrect(700, -110, 8, 26, 3), MT.VALUE_6A6E74, { d: 0.5, lw: 0.9 });
    for (let x = 120; x < 560; x += 110) paint(g, rrect(x, -300, 90, 220, 6), MT.VALUE_3A3E44, { d: 2, lw: 1 });
    g.restore();
  };
  reg(MT.AIRPLANE_COCKPIT, {
    name: MT.BUONG_LAI_MAY_BAY_KINH_CHAN_GIO_BANG,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 1900,
    tags: [MT.BUONG_LAI, MT.MAY_BAY, MT.PHI_CONG_2, MT.HANG_KHONG],
    lanes: [MT.BACK, MT.MID, MT.FRONT],
    lanes3d: { back: -2.4, mid: -1.25, front: 0 },
    zBack3d: -2.9,
    frame: { x: 1120 },
    sky: (g, W, H) => {
      g.fillStyle = MT.VALUE_121418;
      g.fillRect(0, 0, W, H);
    },
    layers: [{ depth: 1, top: 900, draw: (g, x0, x1, tp) => cockpitWall(g, x0, x1, tp) }],
    ground: (g, x0, x1, tp, H) => {
      vgrad(g, x0 - 10, -152, x1 - x0 + 20, H + 170, [MT.VALUE_2E3238, MT.VALUE_3A3E44, MT.VALUE_26292E]);
    },
    props: () => [
      { asset: MT.PILOT_SEAT, x: 1120, lane: MT.MID },
      { asset: MT.PILOT_SEAT, x: 1230, lane: MT.FRONT },
    ],
    front: (g, x0, x1) => {
      paint(g, rrect(1290, -150, 200, 160, 10), MT.VALUE_2A2E34, { d: 3, lw: 1.3 });
      for (let i = 0; i < 8; i++) flat(g, 1310 + (i % 4) * 44, -130 + Math.floor(i / 4) * 30, 30, 14, i % 3 ? MT.VALUE_4A4E55 : MT.E2A23A);
      stroke(
        g,
        [
          [1268, -60],
          [1300, -150],
        ],
        MT.VALUE_1A1C20,
        8,
        true,
      );
      paint(g, rrect(1286, -168, 34, 22, 6), MT.VALUE_1A1C20, { d: 1, lw: 1 });
      void x0;
      void x1;
    },
    lightsStatic: () => [
      { type: MT.GLOW, x: 1350, y: -180, r: 260, color: MT.VALUE_4A8AFF, alpha: 0.12 },
      { type: MT.LAMP, x: 1000, y: -620, len: 500, color: MT.FFF4E0, alpha: 0.08 },
    ],
  });
  const apronFar = (g, x0, x1, tp) => {
    const night = isN(tp);
    const col = night ? MT.VALUE_1A2232 : MT.B8C2CC;
    for (let x = Math.floor(x0 / 900) * 900; x < x1; x += 900) {
      paint(g, rect(x, -150, 760, 160), col, { d: 0, lw: 1 });
      for (let i = 0; i < 12; i++) flat(g, x + 20 + i * 60, -120, 40, 60, night ? MT.FFD98A : MT.VALUE_7A9AB8);
      paint(g, rect(x - 10, -170, 780, 22), C.shade(col, -0.15), { d: 0, lw: 1 });
    }
    const jet = ME.registry.assets.airliner;
    if (jet)
      for (let x = Math.floor(x0 / 2600) * 2600 + 2200; x < x1 + 900; x += 2600) {
        g.save();
        g.translate(x, 6);
        g.scale(0.24, 0.24);
        jet.draw(g, { night });
        g.restore();
      }
    const tx = 1400;
    g.save();
    g.translate(0, 470);
    paint(g, rect(tx - 18, -620, 36, 480), night ? MT.VALUE_2A3242 : MT.CFD5DC, { d: 2, lw: 1.1 });
    paint(
      g,
      poly([
        [tx - 70, -700],
        [tx + 70, -700],
        [tx + 52, -620],
        [tx - 52, -620],
      ]),
      night ? MT.VALUE_3A4A6A : MT.VALUE_5A7A9A,
      { d: 2, lw: 1.1 },
    );
    if (night) glowDisc(g, tx, -660, 70, MT.VALUE_9AD0FF, 0.4);
    paint(g, rect(tx - 76, -716, 152, 18), night ? MT.VALUE_2A3242 : MT.E8ECF0, { d: 1, lw: 1 });
    glowDisc(g, tx, -735, 14, MT.FF3A2A, 0.9);
    g.restore();
  };
  reg(MT.AIRPORT_APRON, {
    name: MT.SAN_DO_MAY_BAY_CO_SAN_MAY_BAY,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4600,
    tags: [MT.SAN_BAY, MT.SAN_DO, MT.DUONG_BANG_2, MT.MAY_BAY, MT.KHONG_TAC, MT.DOT_KICH],
    lanes: [MT.BACK, MT.MID, MT.FRONT, MT.FORE],
    frame: { x: 2900 },
    lanes3d: { back: -8.6, mid: -4.4 },
    layers: [
      {
        depth: 0.25,
        blur: 0.8,
        draw: (g, x0, x1, tp) => apronFar(g, x0, x1, tp),
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      const night = isN(tp);
      vgrad(g, x0 - 10, -152, x1 - x0 + 20, H + 170, night ? [MT.VALUE_22262E, MT.VALUE_2A2E36, MT.VALUE_1A1D22] : [MT.VALUE_9A9C9E, MT.A8AAAC, MT.VALUE_8A8C8E]);
      for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) flat(g, x, -150, 2, H + 150, MT.RGBA_0_0_0_0_06);
      g.fillStyle = night ? MT.RGBA_226_190_60_0_55 : MT.E2BE3C;
      g.fillRect(x0, -20, x1 - x0, 7);
      for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) g.fillRect(x, 60, 80, 6);
      if (night) for (let x = Math.floor(x0 / 300) * 300; x < x1; x += 300) glowDisc(g, x, -140, 9, MT.VALUE_4A8AFF, 0.9);
    },
    lightsStatic: (WW, tp) => (isN(tp) ? Array.from({ length: Math.floor(WW / 900) }, (_, i) => ({ type: MT.LAMP, x: 450 + i * 900, y: -900, len: 1000, color: MT.FFE8C0, alpha: 0.16 })) : []),
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
