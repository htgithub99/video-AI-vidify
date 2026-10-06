(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { paint, rect, rrect, ell, poly, spec, stroke, glowDisc, P } = T.kit;
  const A = T.A,
    NEW = T.NEW;
  const rng = (seed) => U.rng(seed || 1);
  const night = (o) => !!o.night;
  const litGlass = MT.FFD889;
  const glassDay = MT.VALUE_6F9FC0;
  const glassNight = MT.VALUE_2E3A58;
  const glass = (g, p, o, lit) => {
    paint(g, p, lit ? litGlass : night(o) ? glassNight : glassDay, { d: 0, lw: 1.4, glow: lit ? MT.RGBA_255_200_110_0_7 : null, glowR: 18 });
  };
  const shine = (g, x, y, w, h) => {
    if (T.style === MT.FLAT && false) return;
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
  const windowMod = (g, x, y, w, h, o, opt) => {
    const lit = opt.lit;
    paint(g, rect(x - 7, y - 12, w + 14, 9), opt.trim, { d: 2, lw: 1.4 });
    const arch = opt.arch !== false;
    paint(g, rrect(x, y, w, h, arch ? [w / 2, w / 2, 2, 2] : 2), opt.frame, { d: 0, lw: 1.5 });
    const gp = rrect(x + 4, y + 4, w - 8, h - 7, arch ? [w / 2 - 4, w / 2 - 4, 1, 1] : 1);
    glass(g, gp, o, lit);
    if (!lit) shine(g, x + 4, y + 4, w - 8, h - 8);
    stroke(
      g,
      [
        [x + w / 2, y + 5],
        [x + w / 2, y + h - 3],
      ],
      opt.frame,
      2.2,
      false,
    );
    stroke(
      g,
      [
        [x + 4, y + h * 0.45],
        [x + w - 4, y + h * 0.45],
      ],
      opt.frame,
      2.2,
      false,
    );
    if (opt.shutter) {
      for (const side of [-1, 1]) {
        const sx = side < 0 ? x - 17 : x + w + 2;
        paint(g, rect(sx, y, 15, h), opt.shutter, { d: 2, lw: 1.3 });
        g.save();
        g.strokeStyle = C.shade(opt.shutter, -0.25);
        g.lineWidth = 1.4;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const yy = y + 7 + (k * (h - 12)) / 6;
          g.moveTo(sx + 3, yy);
          g.lineTo(sx + 12, yy);
        }
        g.stroke();
        g.restore();
      }
    }
    if (opt.balcony) {
      paint(g, rect(x - 10, y + h - 2, w + 20, 6), opt.iron, { d: 0, lw: 1.1 });
      g.save();
      g.strokeStyle = opt.iron;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(x - 8, y + h - 22);
      g.lineTo(x + w + 8, y + h - 22);
      for (let i = 0; i <= 6; i++) {
        const bx = x - 5 + (i * (w + 10)) / 6;
        g.moveTo(bx, y + h - 22);
        g.lineTo(bx, y + h);
      }
      g.stroke();
      g.restore();
    }
    if (opt.flowers) {
      paint(g, rrect(x - 4, y + h - 6, w + 8, 8, 2), MT.VALUE_8A5A3C, { d: 0, lw: 1.1 });
      for (let i = 0; i < 5; i++) paint(g, ell(x + 2 + i * ((w - 4) / 4), y + h - 9, 5, 4), [MT.E2574C, MT.F2A7C0, MT.F4D35E][i % 3], { d: 0, lw: 0.9 });
    }
  };
  const awning = (g, x, y, w, col, o) => {
    const n = Math.max(4, Math.round(w / 26));
    const aw = w / n;
    for (let i = 0; i < n; i++) {
      const ax = x + i * aw;
      const p = P();
      p.moveTo(ax, y);
      p.lineTo(ax + aw, y);
      p.lineTo(ax + aw + 3, y + 30);
      p.ellipse(ax + aw / 2 + 1.5, y + 30, aw / 2 + 1.5, 8, 0, 0, PI, false);
      p.closePath();
      paint(g, p, i % 2 ? MT.F6F0E2 : col, { d: 0, lw: 1.2 });
    }
    void o;
  };
  const storefront = (g, x, w, o, pal, seed) => {
    const r = rng(seed);
    paint(g, rect(x, -132, w, 132), pal.ground, { d: 0, lw: 1.6 });
    paint(g, rect(x - 4, -140, w + 8, 12), pal.trim, { d: 2, lw: 1.4 });
    const doorX = x + w / 2 - 30;
    const dp = P();
    dp.moveTo(doorX, 0);
    dp.lineTo(doorX, -84);
    dp.arc(doorX + 30, -84, 30, PI, 0);
    dp.lineTo(doorX + 60, 0);
    dp.closePath();
    paint(g, dp, pal.door, { d: 6, lw: 1.6 });
    stroke(
      g,
      [
        [doorX + 30, -110],
        [doorX + 30, 0],
      ],
      C.shade(pal.door, -0.3),
      2,
      false,
    );
    paint(g, ell(doorX + 24, -50, 2.6, 2.6), MT.E8C66A, { d: 0, ink: false });
    for (const side of [-1, 1]) {
      const sw = (w - 110) / 2 - 14,
        sx = side < 0 ? x + 12 : x + w - 12 - sw;
      if (sw < 30) continue;
      const lit = night(o);
      const gp = rrect(sx, -94, sw, 82, 3);
      paint(g, gp, lit ? MT.FFCF7A : MT.VALUE_7FA9C6, { d: 0, lw: 1.5, glow: lit ? MT.RGBA_255_190_100_0_7 : null, glowR: 20 });
      if (!lit) shine(g, sx, -94, sw, 82);
      else {
        g.save();
        g.fillStyle = MT.RGBA_120_70_40_0_5;
        for (let i = 0; i < 3; i++) g.fillRect(sx + 8 + (i * (sw - 16)) / 3, -46, (sw - 16) / 3 - 6, 30);
        g.restore();
      }
      awning(g, sx - 8, -124, sw + 16, pal.awnings[Math.floor(r() * pal.awnings.length)], o);
    }
  };
  const PAL_H = [
    { wall: MT.F2DEB6, roof: MT.VALUE_5B6A94, trim: MT.FFF6E4, frame: MT.FFF6E4, shutter: MT.VALUE_4F8A78, iron: MT.VALUE_30303E, ground: MT.E3C79E, door: MT.VALUE_7A4636, chimney: MT.C9806A },
    { wall: MT.EECDC0, roof: MT.VALUE_4F5F8A, trim: MT.FFF4EE, frame: MT.FFF4EE, shutter: MT.VALUE_5F7FB0, iron: MT.VALUE_30303E, ground: MT.E0B9A9, door: MT.VALUE_3F6A5A, chimney: MT.B9765F },
    { wall: MT.E9E0CF, roof: MT.VALUE_5A6273, trim: MT.FFFFFF, frame: MT.FFFFFF, shutter: MT.VALUE_8C5A8A, iron: MT.VALUE_2C2C36, ground: MT.D6C7AB, door: MT.VALUE_5A3A6A, chimney: MT.A8735E },
    { wall: MT.F4E3A8, roof: MT.VALUE_6A5A8A, trim: MT.FFFBE8, frame: MT.FFFBE8, shutter: MT.VALUE_3F7A9A, iron: MT.VALUE_30303E, ground: MT.E2CC8A, door: MT.VALUE_8A3A3A, chimney: MT.C0705A },
    { wall: MT.D9E4E2, roof: MT.VALUE_4A5A7A, trim: MT.FFFFFF, frame: MT.FFFFFF, shutter: MT.B85A4A, iron: MT.VALUE_2C2C36, ground: MT.C4D2CF, door: MT.VALUE_2F5A7A, chimney: MT.A0705E },
  ];
  const AWN = [MT.E2574C, MT.VALUE_2F8F7A, MT.VALUE_3A6AB0, MT.E09A2C, MT.VALUE_8A4AB0];
  const nightTint = (col, o, k) => (night(o) ? C.mix(col, MT.VALUE_14203A, k == null ? 0.55 : k) : col);
  const palFor = (o, seed) => {
    const base = PAL_H[(o.seed == null ? seed : o.seed) % PAL_H.length];
    const pal = {};
    for (const k of Object.keys(base)) pal[k] = nightTint(base[k], o, k === MT.TRIM || k === MT.FRAME ? 0.45 : 0.55);
    if (o.color && !night(o)) pal.wall = C.mix(o.color, base.wall, 0.5);
    pal.awnings = AWN.map((c) => nightTint(c, o, 0.4));
    return pal;
  };
  A(MT.BUILDING_HAUSSMANN, {
    draw(g, o) {
      const W = o.w || 420,
        H = o.h || 600;
      const pal = palFor(o, 1);
      const r = rng((o.seed || 7) * 13 + 5);
      const x = -W / 2;
      for (const cx of [x + W * 0.24, x + W * 0.76]) {
        paint(g, rect(cx - 12, -H - 120, 24, 50), pal.chimney, { d: 4, lw: 1.5 });
        paint(g, rect(cx - 16, -H - 126, 32, 8), C.shade(pal.chimney, -0.2), { d: 0, lw: 1.3 });
      }
      paint(
        g,
        poly([
          [x - 8, -H + 8],
          [x + 30, -H - 86],
          [x + W - 30, -H - 86],
          [x + W + 8, -H + 8],
        ]),
        pal.roof,
        { d: 10, lw: 1.8, sy: -1 },
      );
      const nd = Math.max(2, Math.round(W / 120));
      for (let i = 0; i < nd; i++) {
        const dx = x + 54 + (i * (W - 108)) / Math.max(1, nd - 1);
        const dp = P();
        dp.moveTo(dx - 18, -H + 4);
        dp.lineTo(dx - 18, -H - 50);
        dp.arc(dx, -H - 50, 18, PI, 0);
        dp.lineTo(dx + 18, -H + 4);
        dp.closePath();
        paint(g, dp, pal.trim, { d: 3, lw: 1.4 });
        glass(g, rrect(dx - 10, -H - 52, 20, 32, [10, 10, 1, 1]), o, night(o) && r() > 0.5);
      }
      paint(g, rect(x, -H, W, H), pal.wall, { d: 0, lw: 1.8 });
      g.save();
      g.globalAlpha = 0.12;
      g.strokeStyle = C.shade(pal.wall, -0.5);
      g.lineWidth = 1;
      g.beginPath();
      for (let yy = -H + 22; yy < -150; yy += 22) {
        g.moveTo(x + 3, yy);
        g.lineTo(x + W - 3, yy);
      }
      g.stroke();
      g.restore();
      paint(g, rect(x, -H, 14, H - 132), C.mix(pal.wall, MT.FFFFFF, 0.18), { d: 0, ink: false });
      paint(g, rect(x + W - 16, -H, 16, H - 132), C.mix(pal.wall, MT.VALUE_2C1F4E, 0.2), { d: 0, ink: false });
      paint(g, rect(x - 6, -H - 6, W + 12, 14), pal.trim, { d: 3, lw: 1.5 });
      const cols = Math.max(3, Math.round(W / 100));
      const floors = Math.max(1, Math.floor((H - 170) / 104));
      const cw = (W - 50) / cols;
      for (let f2 = 0; f2 < floors; f2++) {
        const wy = -H + 34 + f2 * 104;
        if (f2 > 0) paint(g, rect(x - 3, wy - 22, W + 6, 6), C.mix(pal.trim, pal.wall, 0.4), { d: 0, lw: 1.1 });
        for (let c = 0; c < cols; c++) windowMod(g, x + 25 + c * cw + cw / 2 - 19, wy, 38, 64, o, { trim: pal.trim, frame: pal.frame, shutter: pal.shutter, iron: pal.iron, lit: night(o) && r() < (o.litRatio == null ? 0.45 : o.litRatio), balcony: f2 === 0 || (f2 === 2 && c % 2 === 0), flowers: f2 === 1 && r() > 0.6 });
      }
      if (o.noShop) {
        paint(g, rect(x, -132, W, 132), pal.ground, { d: 0, lw: 1.6 });
        const dp = rrect(-32, -110, 64, 110, [32, 32, 0, 0]);
        paint(g, dp, pal.door, { d: 6, lw: 1.6 });
      } else storefront(g, x, W, o, pal, (o.seed || 3) * 7);
    },
  });
  A(MT.BUILDING_MODERN, {
    draw(g, o) {
      const W = o.w || 360,
        H = o.h || 900;
      const base = o.color || MT.VALUE_5F7488;
      const col = night(o) ? C.mix(base, MT.VALUE_0D1424, 0.6) : base;
      const r = rng((o.seed || 3) * 31);
      paint(g, rect(-W / 2, -H, W, H), col, { d: 14, lw: 1.8 });
      paint(g, rect(-W / 2 - 6, -H - 10, W + 12, 12), C.shade(col, 0.2), { d: 2, lw: 1.4 });
      const cols = Math.max(3, Math.floor((W - 30) / 44)),
        rows = Math.floor((H - 120) / 42);
      const cw = (W - 30) / cols;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const lit = night(o) && r() < 0.35;
          const gx = -W / 2 + 15 + i * cw + 3,
            gy = -H + 20 + j * 42;
          g.fillStyle = lit ? MT.FFD889 : night(o) ? MT.VALUE_1C2740 : C.mix(MT.VALUE_8FC0DC, col, 0.25 + 0.2 * Math.sin(i * 1.7 + j));
          g.fillRect(gx, gy, cw - 6, 32);
        }
      if (!night(o)) {
        g.save();
        g.globalAlpha = 0.18;
        g.fillStyle = MT.FFFFFF;
        g.beginPath();
        g.moveTo(-W / 2 + W * 0.1, -110);
        g.lineTo(-W / 2 + W * 0.55, -H + 10);
        g.lineTo(-W / 2 + W * 0.8, -H + 10);
        g.lineTo(-W / 2 + W * 0.35, -110);
        g.fill();
        g.restore();
      }
      paint(g, rect(-W / 2, -110, W, 110), C.shade(col, -0.25), { d: 0, lw: 1.6 });
      paint(g, rect(-50, -96, 100, 96), night(o) ? MT.FFD889 : MT.VALUE_9CC8DE, { d: 0, lw: 1.4, glow: night(o) ? MT.RGBA_255_200_110_0_6 : null });
      stroke(
        g,
        [
          [0, -96],
          [0, 0],
        ],
        MT.VALUE_2A3446,
        2.4,
        false,
      );
    },
  });
  A(MT.HOUSE, {
    draw(g, o) {
      const wall = nightTint(o.color || MT.F0D7B0, o),
        roof = nightTint(MT.B8524A, o);
      paint(g, rect(110, -330, 30, 70), nightTint(MT.VALUE_9A6A58, o), { d: 4, lw: 1.5 });
      paint(g, rect(-180, -220, 360, 220), wall, { d: 12, lw: 1.8 });
      paint(
        g,
        poly([
          [-206, -214],
          [0, -330],
          [206, -214],
        ]),
        roof,
        { d: 10, lw: 1.8 },
      );
      paint(
        g,
        poly([
          [-206, -214],
          [206, -214],
          [196, -200],
          [-196, -200],
        ]),
        C.shade(roof, -0.2),
        { d: 0, lw: 1.4 },
      );
      windowMod(g, -140, -170, 60, 70, o, { trim: MT.FFFFFF, frame: MT.FFFFFF, shutter: nightTint(MT.VALUE_4F8A78, o), iron: MT.VALUE_333, lit: night(o), arch: false });
      windowMod(g, 80, -170, 60, 70, o, { trim: MT.FFFFFF, frame: MT.FFFFFF, shutter: nightTint(MT.VALUE_4F8A78, o), iron: MT.VALUE_333, lit: false, arch: false });
      paint(g, rrect(-34, -130, 68, 130, [6, 6, 0, 0]), nightTint(MT.VALUE_7A4636, o), { d: 6, lw: 1.6 });
      paint(g, ell(20, -64, 3, 3), MT.E8C66A, { d: 0, ink: false });
      paint(g, ell(0, -226, 18, 18), MT.FFFFFF, { d: 2, lw: 1.4 });
      glass(g, ell(0, -226, 12, 12), o, night(o));
      for (const bx of [-150, 130]) paint(g, ell(bx, -12, 34, 18), nightTint(MT.VALUE_4F9A5E, o), { d: 4, lw: 1.4 });
    },
  });
  A(MT.SHOP_FRONT, {
    draw(g, o) {
      const pal = palFor(o, 2);
      const W = 420;
      paint(g, rect(-W / 2, -380, W, 380), pal.wall, { d: 12, lw: 1.8 });
      paint(g, rect(-W / 2 - 6, -386, W + 12, 14), pal.trim, { d: 2, lw: 1.5 });
      for (let c = 0; c < 3; c++) windowMod(g, -W / 2 + 50 + c * 120, -340, 46, 70, o, { trim: pal.trim, frame: pal.frame, shutter: pal.shutter, iron: pal.iron, lit: night(o) && c !== 1, balcony: true });
      paint(g, rrect(-W / 2 + 30, -226, W - 60, 46, 4), nightTint(MT.VALUE_2A3446, o), { d: 3, lw: 1.6 });
      if (o.text) {
        g.save();
        g.fillStyle = MT.F6E7B8;
        g.font = MT.VALUE_700_26PX + (ME.FONTS && ME.FONTS.head ? ME.FONTS.head : MT.SANS_SERIF);
        g.textAlign = MT.CENTER;
        g.textBaseline = MT.MIDDLE;
        g.fillText(String(o.text).toUpperCase(), 0, -203, W - 80);
        g.restore();
      }
      const p2 = Object.assign({}, pal, { awnings: [o.awning || pal.awnings[0]] });
      storefront(g, -W / 2, W, o, p2, 5);
    },
  });
  A(MT.BANK_FACADE, {
    draw(g, o) {
      const stone = nightTint(o.color || MT.EFE6D2, o),
        dark = C.shade(stone, -0.25);
      paint(g, rect(-420, -60, 840, 60), C.shade(stone, -0.1), { d: 4, lw: 1.6 });
      for (let i = 0; i < 3; i++) paint(g, rect(-400 + i * 14, -20 - i * 20, 800 - i * 28, 20), C.shade(stone, -0.05 * i), { d: 2, lw: 1.3 });
      paint(g, rect(-380, -520, 760, 460), stone, { d: 14, lw: 1.8 });
      paint(
        g,
        poly([
          [-410, -520],
          [0, -620],
          [410, -520],
        ]),
        stone,
        { d: 8, lw: 1.8 },
      );
      paint(
        g,
        poly([
          [-350, -528],
          [0, -604],
          [350, -528],
        ]),
        C.shade(stone, -0.08),
        { d: 0, lw: 1.4 },
      );
      paint(g, rect(-420, -540, 840, 24), C.shade(stone, 0.06), { d: 3, lw: 1.6 });
      for (let i = 0; i < 6; i++) {
        const cx = -300 + i * 120;
        paint(g, rect(cx - 24, -500, 48, 18), C.shade(stone, 0.06), { d: 2, lw: 1.3 });
        paint(g, rect(cx - 18, -482, 36, 400), C.shade(stone, 0.04), { d: 8, lw: 1.5 });
        g.save();
        g.strokeStyle = C.rgba(dark, 0.6);
        g.lineWidth = 1.4;
        g.beginPath();
        for (const dx of [-8, 0, 8]) {
          g.moveTo(cx + dx, -478);
          g.lineTo(cx + dx, -86);
        }
        g.stroke();
        g.restore();
        paint(g, rect(cx - 24, -86, 48, 18), C.shade(stone, 0.06), { d: 2, lw: 1.3 });
      }
      paint(g, rrect(-62, -260, 124, 200, [62, 62, 0, 0]), nightTint(MT.VALUE_3A2A20, o), { d: 8, lw: 1.6 });
      glass(g, rrect(-46, -246, 92, 70, [46, 46, 0, 0]), o, night(o));
      g.save();
      g.fillStyle = night(o) ? MT.D8C9A0 : MT.VALUE_5A4A32;
      g.font = MT.VALUE_700_30PX + (ME.FONTS && ME.FONTS.head ? ME.FONTS.head : MT.SERIF);
      g.textAlign = MT.CENTER;
      g.textBaseline = MT.MIDDLE;
      g.fillText(String(o.text || MT.BANQUE).toUpperCase(), 0, -528, 700);
      g.restore();
    },
  });
  A(MT.APARTMENT_BLOCK, {
    draw(g, o) {
      const W = o.w || 460,
        H = o.h || 600;
      const wall = nightTint(o.color || MT.D7B49A, o);
      const r = rng((o.seed || 2) * 17);
      paint(g, rect(-W / 2, -H, W, H), wall, { d: 14, lw: 1.8 });
      const rows = Math.floor((H - 60) / 86),
        cols = Math.floor(W / 110);
      for (let j = 0; j < rows; j++) {
        paint(g, rect(-W / 2 - 4, -H + 70 + j * 86, W + 8, 7), C.shade(wall, -0.15), { d: 0, lw: 1.1 });
        for (let i = 0; i < cols; i++) {
          const wx = -W / 2 + 28 + i * ((W - 56) / cols) + 10;
          windowMod(g, wx, -H + 10 + j * 86, 52, 52, o, { trim: C.shade(wall, 0.2), frame: MT.FFFFFF, iron: MT.VALUE_3A3A44, lit: night(o) && r() < 0.4, arch: false, balcony: i % 2 === 0 });
        }
      }
      paint(g, rect(-40, -100, 80, 100), nightTint(MT.VALUE_4A3A32, o), { d: 4, lw: 1.5 });
    },
  });
  A(MT.TUBE_HOUSE, {
    draw(g, o) {
      const cols = [MT.F2C66A, MT.VALUE_9AD0C2, MT.F2A28A, MT.C6B6E0, MT.E8E0A0];
      const wall = nightTint(o.color || cols[(o.seed || 0) % cols.length], o);
      paint(g, rect(-78, -520, 156, 520), wall, { d: 10, lw: 1.8 });
      paint(g, rect(-84, -528, 168, 14), C.shade(wall, -0.2), { d: 2, lw: 1.4 });
      for (let f = 0; f < 3; f++) {
        const y = -490 + f * 130;
        windowMod(g, -40, y, 80, 76, o, { trim: MT.FFFFFF, frame: MT.FFFFFF, iron: MT.VALUE_2C2C36, lit: night(o) && f !== 1, arch: false, balcony: true, flowers: true });
      }
      paint(g, rect(-78, -120, 156, 120), C.shade(wall, -0.12), { d: 0, lw: 1.5 });
      paint(g, rect(-56, -104, 112, 104), nightTint(MT.VALUE_7A8A96, o), { d: 2, lw: 1.4 });
      g.save();
      g.strokeStyle = C.shade(nightTint(MT.VALUE_7A8A96, o), -0.3);
      g.lineWidth = 1.4;
      g.beginPath();
      for (let yy = -100; yy < 0; yy += 8) {
        g.moveTo(-54, yy);
        g.lineTo(54, yy);
      }
      g.stroke();
      g.restore();
    },
  });
  A(MT.CHURCH, {
    draw(g, o) {
      const stone = nightTint(o.color || MT.E6DCC8, o);
      const roof = nightTint(MT.VALUE_55607A, o);
      paint(
        g,
        poly([
          [-20, -800],
          [-44, -620],
          [44, -620],
        ]),
        roof,
        { d: 6, lw: 1.7 },
      );
      stroke(
        g,
        [
          [0, -800],
          [0, -840],
        ],
        MT.C9A23A,
        4,
        true,
      );
      stroke(
        g,
        [
          [-12, -826],
          [12, -826],
        ],
        MT.C9A23A,
        4,
        true,
      );
      paint(g, rect(-56, -620, 112, 200), stone, { d: 8, lw: 1.7 });
      paint(g, rrect(-22, -590, 44, 70, [22, 22, 0, 0]), night(o) ? litGlass : MT.VALUE_3A4A66, { d: 0, lw: 1.4 });
      paint(g, rect(-190, -420, 380, 420), stone, { d: 14, lw: 1.8 });
      paint(
        g,
        poly([
          [-206, -414],
          [0, -520],
          [206, -414],
        ]),
        roof,
        { d: 8, lw: 1.7 },
      );
      paint(g, ell(0, -330, 50, 50), MT.FFFFFF, { d: 2, lw: 1.5 });
      const rp = ell(0, -330, 42, 42);
      paint(g, rp, night(o) ? litGlass : MT.VALUE_5A6AA0, { d: 0, lw: 1.3, glow: night(o) ? MT.RGBA_255_200_110_0_6 : null });
      g.save();
      g.strokeStyle = MT.FFFFFF;
      g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        g.moveTo(0, -330);
        g.lineTo(Math.cos((i * PI) / 4) * 42, -330 + Math.sin((i * PI) / 4) * 42);
      }
      g.stroke();
      g.restore();
      paint(g, rrect(-46, -170, 92, 170, [46, 46, 0, 0]), nightTint(MT.VALUE_6A3A2A, o), { d: 6, lw: 1.6 });
      for (const sx of [-140, 110]) windowMod(g, sx, -260, 30, 110, o, { trim: stone, frame: MT.FFFFFF, lit: night(o) });
    },
  });
  A(MT.WAREHOUSE, {
    draw(g, o) {
      const wall = nightTint(o.color || MT.A8B4BA, o);
      paint(
        g,
        poly([
          [-310, -260],
          [-310, -300],
          [0, -320],
          [310, -300],
          [310, -260],
        ]),
        C.shade(wall, -0.25),
        { d: 4, lw: 1.7 },
      );
      paint(g, rect(-300, -270, 600, 270), wall, { d: 14, lw: 1.8 });
      g.save();
      g.strokeStyle = C.shade(wall, -0.18);
      g.lineWidth = 2;
      g.beginPath();
      for (let x = -290; x < 300; x += 16) {
        g.moveTo(x, -266);
        g.lineTo(x, -4);
      }
      g.stroke();
      g.restore();
      paint(g, rect(-120, -200, 240, 200), C.shade(wall, -0.32), { d: 4, lw: 1.6 });
      g.save();
      g.strokeStyle = C.shade(wall, -0.45);
      g.lineWidth = 1.6;
      g.beginPath();
      for (let y = -190; y < 0; y += 14) {
        g.moveTo(-116, y);
        g.lineTo(116, y);
      }
      g.stroke();
      g.restore();
      for (const sx of [-260, 180]) windowMod(g, sx, -230, 80, 40, o, { trim: C.shade(wall, 0.15), frame: MT.E6EEF2, lit: night(o), arch: false });
    },
  });
  A(MT.COTTAGE, {
    draw(g, o) {
      const wall = nightTint(o.color || MT.F3E6CC, o);
      const timber = nightTint(MT.VALUE_6A4632, o);
      paint(g, rect(-200, -250, 400, 250), wall, { d: 12, lw: 1.8 });
      g.save();
      g.strokeStyle = timber;
      g.lineWidth = 8;
      g.beginPath();
      for (const x of [-196, -70, 70, 196]) {
        g.moveTo(x, -250);
        g.lineTo(x, 0);
      }
      g.moveTo(-200, -126);
      g.lineTo(200, -126);
      g.moveTo(-196, -250);
      g.lineTo(-70, -126);
      g.moveTo(196, -250);
      g.lineTo(70, -126);
      g.stroke();
      g.restore();
      paint(
        g,
        poly([
          [-238, -240],
          [-60, -410],
          [60, -410],
          [238, -240],
        ]),
        nightTint(MT.VALUE_7A5A3A, o),
        { d: 10, lw: 1.8 },
      );
      g.save();
      g.strokeStyle = C.shade(nightTint(MT.VALUE_7A5A3A, o), -0.25);
      g.lineWidth = 2;
      g.beginPath();
      for (let k = 1; k < 6; k++) {
        const y = -240 - k * 28;
        const t = k / 6;
        g.moveTo(-238 + 178 * t, y);
        g.lineTo(238 - 178 * t, y);
      }
      g.stroke();
      g.restore();
      paint(g, rrect(-34, -150, 68, 150, [34, 34, 0, 0]), nightTint(MT.VALUE_8A3A2A, o), { d: 6, lw: 1.6 });
      for (const sx of [-170, 110]) windowMod(g, sx, -210, 60, 60, o, { trim: MT.FFFFFF, frame: MT.FFFFFF, lit: night(o), arch: false, flowers: true });
    },
  });
  A(MT.STREET_LAMP, {
    draw(g, o) {
      const col = MT.VALUE_2B3240;
      paint(g, rrect(-14, -24, 28, 24, 4), col, { d: 3, lw: 1.5 });
      paint(
        g,
        poly([
          [-6, -24],
          [-4, -396],
          [4, -396],
          [6, -24],
        ]),
        col,
        { d: 3, lw: 1.5 },
      );
      paint(g, rrect(-9, -150, 18, 16, 3), col, { d: 2, lw: 1.3 });
      stroke(
        g,
        [
          [0, -390],
          [10, -432, 46, -432],
          [64, -430, 62, -414],
        ],
        col,
        6,
        false,
      );
      const lit = o.night !== false && night(o);
      if (lit) glowDisc(g, 61, -404, 90, MT.FFD89A, 0.55);
      paint(
        g,
        poly([
          [46, -414],
          [76, -414],
          [72, -394],
          [50, -394],
        ]),
        lit ? MT.FFEAB0 : MT.F3EAD0,
        { d: 1, lw: 1.4, glow: lit ? MT.RGBA_255_220_150_1 : null },
      );
      paint(g, rrect(42, -420, 38, 8, 4), col, { d: 1, lw: 1.3 });
    },
  });
  A(MT.TRAFFIC_LIGHT, {
    draw(g, o) {
      paint(g, rect(-5, -360, 10, 360), MT.VALUE_2A2D33, { d: 2, lw: 1.4 });
      paint(g, rrect(-19, -364, 38, 100, 8), MT.VALUE_1D1F23, { d: 3, lw: 1.6 });
      const st = o.state || [MT.RED, MT.GREEN, MT.YELLOW][Math.floor(((o.t || 0) / 3) % 3)];
      [
        [MT.RED, MT.FF3B30],
        [MT.YELLOW, MT.FFCC00],
        [MT.GREEN, MT.VALUE_34C759],
      ].forEach(([k, c], i) => {
        const on = st === k;
        if (on) glowDisc(g, 0, -342 + i * 30, 30, c, 0.5);
        paint(g, ell(0, -342 + i * 30, 10, 10), on ? c : C.shade(c, -0.7), { d: 0, lw: 1.2 });
      });
    },
  });
  A(MT.BENCH, {
    draw(g, o) {
      const wood = nightTint(o.color || MT.A8683A, o, 0.4),
        iron = MT.VALUE_2B3240;
      for (const x of [-80, 66])
        paint(
          g,
          poly([
            [x, 0],
            [x + 14, 0],
            [x + 14, -46],
            [x + 10, -84],
            [x + 4, -84],
            [x, -46],
          ]),
          iron,
          { d: 2, lw: 1.4 },
        );
      for (let i = 0; i < 2; i++) paint(g, rrect(-92, -50 + i * 10, 184, 8, 3), wood, { d: 2, lw: 1.3 });
      for (let i = 0; i < 2; i++) paint(g, rrect(-90, -82 + i * 12, 180, 9, 3), wood, { d: 2, lw: 1.3 });
    },
  });
  A(MT.FENCE, {
    draw(g, o) {
      const col = nightTint(o.color || MT.F4EFE4, o, 0.45);
      paint(g, rect(-200, -80, 400, 12), col, { d: 2, lw: 1.3 });
      paint(g, rect(-200, -36, 400, 12), col, { d: 2, lw: 1.3 });
      for (let x = -196; x < 200; x += 28)
        paint(
          g,
          poly([
            [x, 0],
            [x + 18, 0],
            [x + 18, -100],
            [x + 9, -116],
            [x, -100],
          ]),
          col,
          { d: 2, lw: 1.3 },
        );
    },
  });
  A(MT.MAILBOX, {
    draw(g, o) {
      paint(g, rect(-6, -70, 12, 70), MT.VALUE_2B3240, { d: 1, lw: 1.3 });
      const p = P();
      p.moveTo(-28, -60);
      p.lineTo(-28, -112);
      p.arc(0, -112, 28, PI, 0);
      p.lineTo(28, -60);
      p.closePath();
      paint(g, p, nightTint(o.color || MT.D8463C, o, 0.4), { d: 4, lw: 1.5 });
      paint(g, rrect(-16, -110, 32, 6, 3), MT.VALUE_2A1C22, { d: 0, ink: false });
    },
  });
  A(MT.FIRE_HYDRANT, {
    draw(g, o) {
      const col = nightTint(MT.D8463C, o, 0.4);
      paint(g, rrect(-16, -78, 32, 78, 4), col, { d: 3, lw: 1.4 });
      paint(g, ell(0, -80, 18, 14), col, { d: 2, lw: 1.4 });
      paint(g, rrect(-26, -58, 52, 14, 5), col, { d: 2, lw: 1.3 });
      paint(g, rrect(-20, -6, 40, 8, 2), C.shade(col, -0.2), { d: 0, lw: 1.2 });
      paint(g, ell(0, -94, 6, 5), C.shade(col, -0.2), { d: 0, lw: 1.1 });
    },
  });
  A(MT.TRASH_BIN, {
    draw(g, o) {
      const col = nightTint(o.color || MT.VALUE_3F7A5A, o, 0.45);
      paint(
        g,
        poly([
          [-30, -100],
          [30, -100],
          [26, 0],
          [-26, 0],
        ]),
        col,
        { d: 4, lw: 1.5 },
      );
      paint(g, rrect(-34, -110, 68, 12, 4), C.shade(col, -0.15), { d: 1, lw: 1.4 });
      g.save();
      g.strokeStyle = C.shade(col, -0.25);
      g.lineWidth = 2;
      g.beginPath();
      for (const x of [-14, 0, 14]) {
        g.moveTo(x, -92);
        g.lineTo(x * 0.92, -8);
      }
      g.stroke();
      g.restore();
    },
  });
  A(MT.CAFE_TABLE, {
    draw(g, o) {
      const tab = nightTint(MT.F4EFE4, o, 0.4);
      paint(
        g,
        poly([
          [-6, -258],
          [6, -258],
          [4, -60],
          [-4, -60],
        ]),
        MT.VALUE_6A5A4A,
        { d: 1, lw: 1.2 },
      );
      const p = P();
      p.moveTo(-78, -230);
      p.quadraticCurveTo(0, -300, 78, -230);
      p.closePath();
      paint(g, p, nightTint(o.color || MT.E2574C, o, 0.4), { d: 4, lw: 1.4 });
      paint(
        g,
        poly([
          [-3, -64],
          [3, -64],
          [3, 0],
          [-3, 0],
        ]),
        MT.VALUE_2B3240,
        { d: 0, lw: 1.2 },
      );
      paint(g, ell(0, -66, 46, 7), tab, { d: 1, lw: 1.3 });
      for (const sx of [-1, 1]) {
        const cx = sx * 52;
        paint(g, rect(cx - 16, -46, 32, 6), MT.VALUE_2B3240, { d: 0, lw: 1.1 });
        stroke(
          g,
          [
            [cx - 14, -40],
            [cx - 16, 0],
          ],
          MT.VALUE_2B3240,
          3,
          false,
        );
        stroke(
          g,
          [
            [cx + 14, -40],
            [cx + 16, 0],
          ],
          MT.VALUE_2B3240,
          3,
          false,
        );
        stroke(
          g,
          [
            [cx + sx * 14, -46],
            [cx + sx * 18, -86],
          ],
          MT.VALUE_2B3240,
          3,
          false,
        );
      }
      paint(g, rrect(-12, -78, 10, 12, 2), MT.FFFFFF, { d: 0, lw: 1 });
    },
  });
  A(MT.PHONE_BOOTH, {
    draw(g, o) {
      const col = nightTint(MT.C8352C, o, 0.4);
      paint(g, rrect(-54, -300, 108, 300, [12, 12, 0, 0]), col, { d: 6, lw: 1.6 });
      paint(g, rect(-44, -268, 88, 20), MT.VALUE_1D1F23, { d: 0, lw: 1.2 });
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) glass(g, rect(-40 + i * 42, -240 + j * 54, 36, 46), o, night(o));
    },
  });
  A(MT.SIGNPOST, {
    draw(g, o) {
      paint(g, rect(-5, -300, 10, 300), MT.VALUE_6A5A4A, { d: 1, lw: 1.3 });
      paint(
        g,
        poly([
          [-90, -270],
          [70, -270],
          [90, -250],
          [70, -230],
          [-90, -230],
        ]),
        nightTint(MT.VALUE_2F6A4A, o, 0.4),
        { d: 3, lw: 1.5 },
      );
      if (o.text) {
        g.save();
        g.fillStyle = MT.FFFFFF;
        g.font = MT.VALUE_700_20PX_SANS_SERIF;
        g.textAlign = MT.CENTER;
        g.textBaseline = MT.MIDDLE;
        g.fillText(String(o.text), -6, -250, 150);
        g.restore();
      }
    },
  });
  A(MT.NEWSPAPER_STAND, {
    draw(g, o) {
      const col = nightTint(MT.VALUE_2F5A7A, o, 0.4);
      paint(g, rect(-110, -220, 220, 220), col, { d: 8, lw: 1.6 });
      awning(g, -118, -250, 236, nightTint(MT.E2574C, o, 0.4), o);
      paint(g, rect(-96, -170, 192, 110), nightTint(MT.F2EAD8, o, 0.3), { d: 0, lw: 1.3 });
      const cols = [MT.E2574C, MT.VALUE_3A6AB0, MT.F4D35E, MT.VALUE_2F8F7A];
      for (let i = 0; i < 8; i++) paint(g, rect(-90 + (i % 4) * 46, -164 + Math.floor(i / 4) * 52, 40, 46), nightTint(cols[i % 4], o, 0.4), { d: 1, lw: 1.1 });
    },
  });
  A(MT.BUS_STOP, {
    draw(g, o) {
      paint(g, rect(-150, -260, 300, 14), MT.VALUE_3A4A5A, { d: 2, lw: 1.4 });
      for (const x of [-140, 132]) paint(g, rect(x, -248, 8, 248), MT.VALUE_3A4A5A, { d: 1, lw: 1.2 });
      g.save();
      g.globalAlpha = 0.5;
      paint(g, rect(-136, -240, 268, 200), MT.BFE0EE, { d: 0, lw: 1.2 });
      g.restore();
      paint(g, rrect(-90, -60, 180, 12, 3), MT.A8683A, { d: 1, lw: 1.2 });
      paint(g, rect(160, -330, 8, 330), MT.VALUE_3A4A5A, { d: 1, lw: 1.2 });
      paint(g, ell(164, -320, 18, 18), MT.VALUE_2F6AB0, { d: 2, lw: 1.4 });
    },
  });
  const leafCols = (o, base) => {
    const b = o.color || base;
    const c = night(o) ? C.mix(b, MT.VALUE_0D1A24, 0.55) : b;
    return [c, C.shade(c, -0.14), C.mix(c, MT.FFF3C0, 0.18)];
  };
  const trunk = (g, h, w, col, o, fork) => {
    const c = nightTint(col || MT.VALUE_7A5236, o, 0.5);
    const p = P();
    p.moveTo(-w, 0);
    p.bezierCurveTo(-w * 0.8, -h * 0.4, -w * 0.5, -h * 0.7, -w * 0.4, -h);
    p.lineTo(w * 0.4, -h);
    p.bezierCurveTo(w * 0.5, -h * 0.7, w * 0.8, -h * 0.4, w, 0);
    p.closePath();
    paint(g, p, c, { d: 4, lw: 1.5 });
    if (fork) {
      stroke(
        g,
        [
          [-w * 0.3, -h * 0.75],
          [-w * 2.2, -h * 0.95],
        ],
        c,
        w * 0.55,
        false,
      );
      stroke(
        g,
        [
          [w * 0.3, -h * 0.7],
          [w * 2.4, -h * 0.92],
        ],
        c,
        w * 0.5,
        false,
      );
    }
  };
  const blobs = (g, list, cols, d) => {
    for (const [x, y, r, k] of list) paint(g, ell(x, y, r, r * 0.92), cols[k || 0], { d: d || r * 0.22, lw: 1.6, sx: 1, sy: 1 });
  };
  A(MT.TREE_ROUND, {
    draw(g, o) {
      trunk(g, 190, 14, null, o, true);
      blobs(
        g,
        [
          [-72, -230, 62, 1],
          [64, -236, 66, 1],
          [0, -300, 82, 0],
          [-44, -190, 52, 2],
          [46, -196, 50, 0],
          [-6, -236, 70, 2],
        ],
        leafCols(o, MT.VALUE_4F9A5E),
      );
    },
  });
  A(MT.TREE_OAK, {
    draw(g, o) {
      trunk(g, 230, 26, MT.VALUE_6A4A32, o, true);
      blobs(
        g,
        [
          [-150, -300, 90, 1],
          [140, -300, 92, 1],
          [-60, -380, 100, 0],
          [70, -390, 100, 0],
          [0, -300, 110, 2],
          [-170, -230, 60, 1],
          [170, -236, 62, 0],
        ],
        leafCols(o, MT.VALUE_3F8650),
      );
    },
  });
  A(MT.TREE_AUTUMN, {
    draw(g, o) {
      trunk(g, 190, 16, null, o, true);
      blobs(
        g,
        [
          [-80, -240, 66, 1],
          [76, -244, 68, 1],
          [0, -310, 86, 0],
          [-40, -200, 54, 2],
          [44, -206, 52, 0],
        ],
        leafCols(o, MT.E08A3A),
      );
      const r = rng(o.seed || 5);
      for (let i = 0; i < 6; i++) paint(g, ell(-120 + r() * 240, -6 - r() * 8, 7, 3, r()), nightTint(MT.E0603A, o, 0.5), { d: 0, lw: 0.9 });
    },
  });
  A(MT.TREE_BLOSSOM, {
    draw(g, o) {
      trunk(g, 180, 14, MT.VALUE_5A3A2E, o, true);
      blobs(
        g,
        [
          [-74, -230, 60, 1],
          [70, -232, 62, 1],
          [0, -296, 80, 0],
          [-40, -196, 50, 2],
          [48, -200, 48, 0],
        ],
        leafCols(o, MT.F4A7C4),
      );
      const r = rng(o.seed || 9);
      for (let i = 0; i < 18; i++) paint(g, ell(-120 + r() * 240, -340 + r() * 190, 3.4, 3.4), MT.FFFFFF, { d: 0, ink: false });
    },
  });
  A(MT.TREE_BIRCH, {
    draw(g, o) {
      const bark = nightTint(MT.F2EFE6, o, 0.5);
      paint(
        g,
        poly([
          [-9, 0],
          [-6, -300],
          [6, -300],
          [9, 0],
        ]),
        bark,
        { d: 3, lw: 1.4 },
      );
      g.save();
      g.fillStyle = MT.VALUE_2A2A2E;
      for (let y = -280; y < -10; y += 34) g.fillRect(-7 + ((y / 34) % 2) * 4, y, 8, 3);
      g.restore();
      blobs(
        g,
        [
          [-40, -330, 46, 1],
          [36, -350, 50, 0],
          [0, -400, 46, 2],
          [-30, -280, 36, 0],
          [36, -290, 38, 1],
        ],
        leafCols(o, MT.VALUE_8CBF5A),
      );
    },
  });
  A(MT.TREE_PINE, {
    draw(g, o) {
      trunk(g, 80, 12, MT.VALUE_6A4632, o, false);
      const cols = leafCols(o, MT.VALUE_2F7A5A);
      for (let i = 0; i < 4; i++) {
        const y = -70 - i * 92,
          w = 96 - i * 18;
        const p = P();
        p.moveTo(-w, y);
        p.quadraticCurveTo(0, y - 10, w, y);
        p.lineTo(w * 0.15, y - 120);
        p.lineTo(-w * 0.15, y - 120);
        p.closePath();
        paint(g, p, cols[i % 2], { d: 10, lw: 1.6 });
      }
    },
  });
  A(MT.TREE_CYPRESS, {
    draw(g, o) {
      trunk(g, 40, 8, MT.VALUE_6A4632, o, false);
      const p = P();
      p.moveTo(0, -410);
      p.bezierCurveTo(46, -330, 46, -100, 30, -36);
      p.lineTo(-30, -36);
      p.bezierCurveTo(-46, -100, -46, -330, 0, -410);
      p.closePath();
      paint(g, p, leafCols(o, MT.VALUE_2F6A4A)[0], { d: 10, lw: 1.6 });
    },
  });
  A(MT.TREE_PALM, {
    draw(g, o) {
      const c = nightTint(MT.VALUE_9A7A52, o, 0.5);
      const p = P();
      p.moveTo(-12, 0);
      p.bezierCurveTo(10, -200, 60, -420, 100, -540);
      p.lineTo(116, -536);
      p.bezierCurveTo(80, -410, 34, -200, 14, 0);
      p.closePath();
      paint(g, p, c, { d: 5, lw: 1.6 });
      const cols = leafCols(o, MT.VALUE_3F9A5A);
      const top = [108, -546];
      for (let i = 0; i < 7; i++) {
        const a = -PI * 0.95 + (i * PI * 1.1) / 6;
        const L = 150;
        const ex = top[0] + Math.cos(a) * L,
          ey = top[1] + Math.sin(a) * L * 0.6 + 40;
        const q = P();
        q.moveTo(top[0], top[1]);
        q.quadraticCurveTo(top[0] + Math.cos(a) * L * 0.5, top[1] + Math.sin(a) * L * 0.5 - 40, ex, ey);
        q.quadraticCurveTo(top[0] + Math.cos(a) * L * 0.5 + 10, top[1] + Math.sin(a) * L * 0.5 - 10, top[0], top[1] + 8);
        q.closePath();
        paint(g, q, cols[i % 2], { d: 6, lw: 1.5 });
      }
      paint(g, ell(top[0], top[1] + 8, 14, 12), MT.VALUE_7A5A32, { d: 2, lw: 1.2 });
    },
  });
  A(MT.BUSH, {
    draw(g, o) {
      blobs(
        g,
        [
          [-44, -40, 40, 1],
          [38, -40, 38, 1],
          [-4, -64, 46, 0],
          [-18, -30, 34, 2],
        ],
        leafCols(o, MT.VALUE_4F9A5E),
        8,
      );
    },
  });
  A(MT.HEDGE, {
    draw(g, o) {
      const c = leafCols(o, MT.VALUE_3F8650);
      paint(g, rrect(-208, -104, 416, 104, 30), c[0], { d: 10, lw: 1.6 });
      for (let x = -180; x < 200; x += 60) paint(g, ell(x, -96, 30, 18), c[2], { d: 0, ink: false });
    },
  });
  A(MT.FLOWERS, {
    draw(g, o) {
      const cols = [MT.E2574C, MT.F4D35E, MT.F2A7C0, MT.VALUE_8A6AD0, MT.FFFFFF];
      const r = rng(o.seed || 4);
      for (let i = 0; i < 9; i++) {
        const x = -64 + i * 15,
          h = 22 + r() * 24;
        stroke(
          g,
          [
            [x, 0],
            [x + 2, -h],
          ],
          nightTint(MT.VALUE_3F8650, o),
          2.4,
          false,
        );
        paint(g, ell(x + 2, -h, 7, 7), nightTint(cols[i % cols.length], o, 0.4), { d: 1, lw: 1 });
        paint(g, ell(x + 2, -h, 2.4, 2.4), MT.F6E08A, { d: 0, ink: false });
      }
    },
  });
  A(MT.ROCK, {
    draw(g, o) {
      const c = nightTint(o.color || MT.VALUE_9A9AA0, o);
      paint(
        g,
        poly(
          [
            [-80, 0],
            [-70, -50],
            [-30, -84],
            [30, -78],
            [72, -40],
            [80, 0],
          ],
          true,
        ),
        c,
        { d: 12, lw: 1.6 },
      );
      paint(
        g,
        poly(
          [
            [-40, -60],
            [-20, -74],
            [10, -70],
          ],
          false,
        ),
        C.shade(c, 0.2),
        { d: 0, ink: false },
      );
    },
  });
  A(MT.GRASS, {
    draw(g, o) {
      const c = leafCols(o, MT.VALUE_5AA55A);
      g.save();
      for (let i = 0; i < 14; i++) {
        const x = -76 + i * 11;
        const p = P();
        p.moveTo(x - 4, 0);
        p.quadraticCurveTo(x, -26, x + (i % 2 ? 6 : -6), -36 - (i % 3) * 4);
        p.quadraticCurveTo(x + 2, -16, x + 5, 0);
        p.closePath();
        paint(g, p, c[i % 3], { d: 0, lw: 1 });
      }
      g.restore();
    },
  });
  A(MT.CLOUD, {
    draw(g, o) {
      g.save();
      g.globalAlpha *= o.alpha == null ? 1 : Math.min(1, o.alpha + 0.2);
      const c = night(o) ? MT.VALUE_5A5F82 : MT.FFFFFF;
      const p = P();
      p.moveTo(-200, 10);
      p.lineTo(220, 10);
      p.arc(200, -30, 40, PI / 2, -PI / 2, true);
      p.arc(110, -70, 66, 0, -PI, true);
      p.arc(-10, -50, 54, -0.2, -PI, true);
      p.arc(-150, -30, 46, -0.4, PI / 2, true);
      p.closePath();
      paint(g, p, c, { d: 0, ink: false });
      g.save();
      g.clip(p);
      g.fillStyle = night(o) ? MT.RGBA_30_30_60_0_25 : MT.RGBA_160_190_230_0_35;
      g.fillRect(-220, -10, 460, 30);
      g.restore();
      g.restore();
    },
  });
  A(MT.SUN, {
    draw(g, o) {
      glowDisc(g, 0, -100, 220, MT.FFF2C4, 0.55);
      paint(g, ell(0, -100, 70, 70), MT.FFE8A0, { d: 0, ink: false, glow: MT.RGBA_255_230_150_0_9, glowR: 40 });
      void o;
    },
  });
  A(MT.MOON, {
    draw(g, o) {
      glowDisc(g, 0, -70, 140, MT.DFE8FF, 0.35);
      const p = ell(0, -70, 50, 50);
      paint(g, p, MT.F2EFE0, { d: 0, ink: false, glow: MT.RGBA_230_236_255_0_9, glowR: 30 });
      for (const [x, y, r] of [
        [-14, -84, 9],
        [16, -60, 6],
        [8, -96, 5],
      ])
        paint(g, ell(x, y, r, r), MT.DCD6C2, { d: 0, ink: false });
      void o;
    },
  });
  A(MT.MOUNTAIN, {
    draw(g, o) {
      const c = o.color || (night(o) ? MT.VALUE_2A3350 : MT.VALUE_7A8AB0);
      paint(
        g,
        poly([
          [-710, 0],
          [-240, -440],
          [-120, -360],
          [20, -468],
          [300, -220],
          [700, 0],
        ]),
        c,
        { d: 30, lw: 1.8 },
      );
      paint(
        g,
        poly([
          [-300, -384],
          [-240, -440],
          [-180, -386],
          [-210, -370],
          [-240, -392],
          [-268, -366],
        ]),
        MT.FFFFFF,
        { d: 0, lw: 1.4 },
      );
      paint(
        g,
        poly([
          [-50, -408],
          [20, -468],
          [90, -404],
          [56, -396],
          [20, -420],
          [-14, -390],
        ]),
        MT.FFFFFF,
        { d: 0, lw: 1.4 },
      );
    },
  });
  const spin = (o, r) => -((o.distance || 0) / r);
  const wheel = (g, x, y, r, rot, rim) => {
    paint(g, ell(x, y, r, r), MT.VALUE_1E2026, { d: r * 0.15, lw: 1.6 });
    paint(g, ell(x, y, r * 0.58, r * 0.58), rim || MT.CFD5DC, { d: r * 0.12, lw: 1.3 });
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.strokeStyle = MT.VALUE_7A828C;
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * PI * 2) / 5;
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    }
    g.stroke();
    g.restore();
    paint(g, ell(x, y, r * 0.18, r * 0.18), MT.VALUE_8A929C, { d: 0, lw: 1.1 });
  };
  const carBody = (g, o, opt) => {
    const L = opt.len || 420;
    const x0 = -L / 2;
    const col = nightTint(o.color || opt.color, o, 0.35);
    const hgt = opt.h || 120;
    const wr = opt.wheel || 30;
    g.save();
    g.fillStyle = MT.RGBA_0_0_0_0_28;
    g.beginPath();
    g.ellipse(0, -2, L * 0.52, 10, 0, 0, PI * 2);
    g.fill();
    g.restore();
    const p = P();
    if (opt.shape === MT.BEETLE) {
      p.moveTo(x0 + 10, -28);
      p.bezierCurveTo(x0, -60, x0 + 20, -84, x0 + 60, -90);
      p.bezierCurveTo(x0 + L * 0.3, -hgt - 6, x0 + L * 0.62, -hgt - 6, x0 + L * 0.8, -88);
      p.bezierCurveTo(x0 + L - 10, -82, x0 + L + 4, -60, x0 + L - 8, -28);
    } else {
      p.moveTo(x0 + 8, -28);
      p.bezierCurveTo(x0, -54, x0 + 4, -74, x0 + 34, -78);
      p.lineTo(x0 + L * 0.27, -82);
      p.bezierCurveTo(x0 + L * 0.34, -hgt + 2, x0 + L * 0.38, -hgt, x0 + L * 0.46, -hgt);
      p.lineTo(x0 + L * 0.66, -hgt);
      p.bezierCurveTo(x0 + L * 0.74, -hgt, x0 + L * 0.78, -96, x0 + L * 0.82, -82);
      p.lineTo(x0 + L - 28, -76);
      p.bezierCurveTo(x0 + L - 2, -72, x0 + L + 2, -52, x0 + L - 6, -28);
    }
    p.closePath();
    paint(g, p, col, { d: 10, lw: 1.8, sx: 0.4, sy: -1 });
    const wy = -82;
    const wp1 = P(),
      wp2 = P();
    if (opt.shape === MT.BEETLE) {
      wp1.moveTo(x0 + L * 0.3, wy - 4);
      wp1.bezierCurveTo(x0 + L * 0.34, -hgt + 10, x0 + L * 0.44, -hgt + 6, x0 + L * 0.5, -hgt + 6);
      wp1.lineTo(x0 + L * 0.5, wy - 4);
      wp1.closePath();
      wp2.moveTo(x0 + L * 0.53, wy - 4);
      wp2.lineTo(x0 + L * 0.53, -hgt + 6);
      wp2.bezierCurveTo(x0 + L * 0.64, -hgt + 8, x0 + L * 0.72, -hgt + 18, x0 + L * 0.76, wy - 4);
      wp2.closePath();
    } else {
      wp1.moveTo(x0 + L * 0.31, wy);
      wp1.lineTo(x0 + L * 0.385, -hgt + 8);
      wp1.lineTo(x0 + L * 0.545, -hgt + 8);
      wp1.lineTo(x0 + L * 0.545, wy);
      wp1.closePath();
      wp2.moveTo(x0 + L * 0.565, wy);
      wp2.lineTo(x0 + L * 0.565, -hgt + 8);
      wp2.lineTo(x0 + L * 0.66, -hgt + 8);
      wp2.lineTo(x0 + L * 0.78, wy);
      wp2.closePath();
    }
    const gcol = night(o) ? MT.VALUE_2E3A58 : MT.A9D4EA;
    paint(g, wp1, gcol, { d: 0, lw: 1.4 });
    paint(g, wp2, gcol, { d: 0, lw: 1.4 });
    if (!night(o)) {
      g.save();
      g.globalAlpha = 0.45;
      g.fillStyle = MT.FFFFFF;
      g.beginPath();
      g.moveTo(x0 + L * 0.37, wy - 4);
      g.lineTo(x0 + L * 0.42, -hgt + 12);
      g.lineTo(x0 + L * 0.45, -hgt + 12);
      g.lineTo(x0 + L * 0.4, wy - 4);
      g.fill();
      g.restore();
    }
    stroke(
      g,
      [
        [x0 + L * 0.555, -hgt + 6],
        [x0 + L * 0.555, -30],
      ],
      C.shade(col, -0.4),
      2.2,
      true,
    );
    stroke(
      g,
      [
        [x0 + L * 0.3, -80],
        [x0 + L * 0.29, -30],
      ],
      C.shade(col, -0.4),
      2.2,
      true,
    );
    paint(g, rrect(x0 + L * 0.6, -70, 20, 5, 2), MT.E6E8EC, { d: 0, lw: 1 });
    paint(g, rrect(x0 + 10, -56, L - 20, 5, 2), C.mix(col, MT.FFFFFF, 0.35), { d: 0, ink: false });
    paint(g, rrect(x0 - 6, -40, 40, 14, 6), MT.D9DFE6, { d: 2, lw: 1.3 });
    paint(g, rrect(x0 + L - 34, -40, 40, 14, 6), MT.D9DFE6, { d: 2, lw: 1.3 });
    const lightsOn = night(o) || o.lights;
    paint(g, ell(x0 + L - 12, -64, 9, 8), lightsOn ? MT.FFF3C4 : MT.F4EAD0, { d: 0, lw: 1.2, glow: lightsOn ? MT.RGBA_255_240_190_1 : null });
    paint(g, rrect(x0 + 2, -70, 10, 14, 3), MT.D24A3A, { d: 0, lw: 1.1 });
    for (const wx of [x0 + L * 0.2, x0 + L * 0.8]) {
      const ap = P();
      ap.moveTo(wx - wr - 9, -24);
      ap.arc(wx, -wr + 4, wr + 9, PI, 0);
      ap.closePath();
      paint(g, ap, C.shade(col, -0.45), { d: 0, lw: 1.2 });
      wheel(g, wx, -wr, wr, spin(o, wr), opt.rim);
    }
    if (opt.extra) opt.extra(g, o, x0, L, hgt, col);
  };
  A(MT.CAR_SEDAN, { draw: (g, o) => carBody(g, o, { color: MT.VALUE_3A6AB0, len: 420, h: 122 }) });
  A(MT.CAR_VINTAGE, { draw: (g, o) => carBody(g, o, { color: MT.D64A40, len: 400, h: 124, wheel: 28, shape: MT.BEETLE }) });
  A(MT.TAXI, {
    draw: (g, o) =>
      carBody(g, o, {
        color: MT.F2C230,
        len: 420,
        h: 122,
        extra: (g2, o2, x0, L) => {
          paint(g2, rrect(-28, -138, 56, 18, 4), MT.VALUE_2A2A2E, { d: 0, lw: 1.2 });
          g2.save();
          g2.fillStyle = MT.F2C230;
          g2.font = MT.VALUE_700_12PX_SANS_SERIF;
          g2.textAlign = MT.CENTER;
          g2.textBaseline = MT.MIDDLE;
          g2.fillText(MT.TAXI_3, 0, -129);
          g2.restore();
          g2.save();
          g2.fillStyle = MT.VALUE_2A2A2E;
          for (let i = 0; i < 12; i++) g2.fillRect(x0 + 30 + i * ((L - 60) / 12), -48 + (i % 2) * 5, (L - 60) / 24, 5);
          g2.restore();
        },
      }),
  });
  A(MT.POLICE_CAR, {
    draw: (g, o) =>
      carBody(g, o, {
        color: MT.F4F6F8,
        len: 430,
        h: 124,
        extra: (g2, o2, x0, L) => {
          paint(g2, rrect(x0 + 20, -66, L - 40, 16, 3), nightTint(MT.VALUE_1E3A7A, o2, 0.3), { d: 0, lw: 1.2 });
          const on = Math.sin((o2.t || 0) * 12) > 0;
          paint(g2, rrect(-34, -140, 34, 14, 4), on ? MT.FF3B30 : MT.VALUE_8A1A1A, { d: 0, lw: 1.2, glow: on ? MT.RGBA_255_60_50_0_9 : null });
          paint(g2, rrect(0, -140, 34, 14, 4), on ? MT.VALUE_1A2A6A : MT.VALUE_2F6AFF, { d: 0, lw: 1.2, glow: !on ? MT.RGBA_60_120_255_0_9 : null });
        },
      }),
  });
  A(MT.SPORTS_CAR, {
    draw(g, o) {
      const col = nightTint(o.color || MT.E2302C, o, 0.35);
      const L = 440,
        x0 = -220;
      g.save();
      g.fillStyle = MT.RGBA_0_0_0_0_28;
      g.beginPath();
      g.ellipse(0, -2, 230, 9, 0, 0, PI * 2);
      g.fill();
      g.restore();
      const p = P();
      p.moveTo(x0 + 6, -26);
      p.bezierCurveTo(x0, -50, x0 + 10, -62, x0 + 60, -66);
      p.bezierCurveTo(x0 + 150, -100, x0 + 240, -104, x0 + 300, -74);
      p.bezierCurveTo(x0 + 380, -64, x0 + 436, -56, x0 + L, -36);
      p.lineTo(x0 + L - 6, -26);
      p.closePath();
      paint(g, p, col, { d: 10, lw: 1.8 });
      const w = P();
      w.moveTo(x0 + 160, -76);
      w.bezierCurveTo(x0 + 190, -96, x0 + 240, -98, x0 + 280, -76);
      w.closePath();
      paint(g, w, night(o) ? MT.VALUE_2E3A58 : MT.A9D4EA, { d: 0, lw: 1.4 });
      paint(g, ell(x0 + L - 14, -44, 10, 5), night(o) || o.lights ? MT.FFF3C4 : MT.F4EAD0, { d: 0, lw: 1.1 });
      for (const wx of [x0 + 88, x0 + 350]) wheel(g, wx, -28, 28, spin(o, 28), MT.D8D8DC);
    },
  });
  const boxVehicle = (g, o, opt) => {
    const L = opt.len,
      H = opt.h,
      x0 = -L / 2;
    const col = nightTint(o.color || opt.color, o, 0.35);
    g.save();
    g.fillStyle = MT.RGBA_0_0_0_0_28;
    g.beginPath();
    g.ellipse(0, -2, L * 0.52, 10, 0, 0, PI * 2);
    g.fill();
    g.restore();
    if (opt.cargo) paint(g, rrect(x0, -H, L * opt.cargo, H - 30, 6), nightTint(opt.cargoCol || MT.E8E4DA, o, 0.35), { d: 12, lw: 1.8 });
    const cab = opt.cargo ? x0 + L * opt.cargo + 4 : x0;
    const cw = opt.cargo ? L - L * opt.cargo - 4 : L;
    const p = P();
    p.moveTo(cab, -28);
    p.lineTo(cab, -H + 8);
    p.quadraticCurveTo(cab, -H, cab + 10, -H);
    p.lineTo(cab + cw * (opt.cargo ? 0.5 : 0.8), -H);
    p.quadraticCurveTo(cab + cw - 6, -H + 4, cab + cw - 2, -H * 0.55);
    p.lineTo(cab + cw, -28);
    p.closePath();
    paint(g, p, col, { d: 10, lw: 1.8 });
    const gw = P();
    gw.moveTo(cab + cw * (opt.cargo ? 0.42 : 0.72), -H + 12);
    gw.lineTo(cab + cw * (opt.cargo ? 0.55 : 0.82), -H + 12);
    gw.quadraticCurveTo(cab + cw - 10, -H + 16, cab + cw - 8, -H * 0.58);
    gw.lineTo(cab + cw * (opt.cargo ? 0.42 : 0.72), -H * 0.58);
    gw.closePath();
    paint(g, gw, night(o) ? MT.VALUE_2E3A58 : MT.A9D4EA, { d: 0, lw: 1.4 });
    if (!opt.cargo && opt.windows)
      for (let i = 0; i < opt.windows; i++) {
        const wx = cab + 20 + i * ((cw * 0.68 - 20) / opt.windows);
        paint(g, rrect(wx, -H + 14, (cw * 0.68 - 20) / opt.windows - 10, H * 0.32, 4), night(o) ? MT.FFD889 : MT.A9D4EA, { d: 0, lw: 1.3, glow: night(o) ? MT.RGBA_255_200_110_0_5 : null });
      }
    paint(g, rrect(x0 - 4, -42, L + 8, 14, 5), MT.D9DFE6, { d: 2, lw: 1.3 });
    const lightsOn = night(o) || o.lights;
    paint(g, ell(x0 + L - 8, -60, 8, 9), lightsOn ? MT.FFF3C4 : MT.F4EAD0, { d: 0, lw: 1.2, glow: lightsOn ? MT.RGBA_255_240_190_1 : null });
    const wr = opt.wheel || 32;
    for (const wx of opt.wheels.map((k) => x0 + L * k)) wheel(g, wx, -wr, wr, spin(o, wr));
    if (opt.extra) opt.extra(g, o, x0, L, H, col);
  };
  A(MT.VAN, { draw: (g, o) => boxVehicle(g, o, { len: 430, h: 168, color: MT.F2EFE8, wheels: [0.2, 0.8], windows: 2 }) });
  A(MT.TRUCK, { draw: (g, o) => boxVehicle(g, o, { len: 620, h: 228, color: MT.VALUE_2F6AB0, cargo: 0.66, wheels: [0.14, 0.32, 0.84], wheel: 34 }) });
  A(MT.BUS, { draw: (g, o) => boxVehicle(g, o, { len: 780, h: 236, color: MT.E2A42C, wheels: [0.16, 0.8], windows: 6, wheel: 36 }) });
  A(MT.AMBULANCE, {
    draw: (g, o) =>
      boxVehicle(g, o, {
        len: 460,
        h: 200,
        color: MT.F4F6F8,
        cargo: 0.6,
        cargoCol: MT.F4F6F8,
        wheels: [0.2, 0.8],
        extra: (g2, o2, x0) => {
          paint(g2, rect(x0 + 110, -150, 16, 52), MT.E2302C, { d: 0, lw: 1 });
          paint(g2, rect(x0 + 92, -132, 52, 16), MT.E2302C, { d: 0, lw: 1 });
          paint(g2, rect(x0 + 4, -80, 452, 10), MT.E2302C, { d: 0, lw: 1 });
          const on = Math.sin((o2.t || 0) * 10) > 0;
          paint(g2, rrect(x0 + 300, -212, 40, 12, 4), on ? MT.FF3B30 : MT.VALUE_2F6AFF, { d: 0, lw: 1.1, glow: MT.RGBA_255_80_80_0_7 });
        },
      }),
  });
  A(MT.PICKUP_TRUCK, { draw: (g, o) => boxVehicle(g, o, { len: 440, h: 134, color: MT.VALUE_7A8A5A, cargo: 0.44, cargoCol: C.shade(MT.VALUE_7A8A5A, -0.1), wheels: [0.2, 0.8] }) });
  A(MT.JEEP, { draw: (g, o) => boxVehicle(g, o, { len: 400, h: 170, color: MT.VALUE_5A6A3A, wheels: [0.2, 0.8], windows: 1, wheel: 36 }) });
  const twoWheel = (g, o, opt) => {
    const col = nightTint(o.color || opt.color, o, 0.35);
    const r = opt.r || 30;
    const xs = opt.wb || [-70, 70];
    for (const wx of xs) {
      paint(g, ell(wx, -r, r, r), MT.VALUE_1E2026, { d: 3, lw: 1.5 });
      paint(g, ell(wx, -r, r * 0.7, r * 0.7), opt.spoke ? MT.E8E4DC : MT.VALUE_9AA2AC, { d: 0, lw: 1.1 });
      if (opt.spoke) {
        g.save();
        g.strokeStyle = MT.VALUE_6A6A70;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * PI) / 4 + spin(o, r);
          g.moveTo(wx, -r);
          g.lineTo(wx + Math.cos(a) * r * 0.7, -r + Math.sin(a) * r * 0.7);
        }
        g.stroke();
        g.restore();
      }
    }
    opt.body(g, col, r, xs);
  };
  A(MT.BICYCLE, {
    draw: (g, o) =>
      twoWheel(g, o, {
        color: MT.VALUE_2F8F7A,
        r: 32,
        wb: [-56, 56],
        spoke: true,
        body: (g2, col) => {
          stroke(
            g2,
            [
              [-56, -32],
              [-10, -32],
              [26, -74],
              [-24, -74],
              [-56, -32],
            ],
            col,
            5,
            false,
          );
          stroke(
            g2,
            [
              [-10, -32],
              [-24, -82],
            ],
            col,
            5,
            false,
          );
          stroke(
            g2,
            [
              [26, -74],
              [56, -32],
            ],
            col,
            5,
            false,
          );
          stroke(
            g2,
            [
              [26, -74],
              [22, -94],
              [34, -96],
            ],
            MT.VALUE_2A2A2E,
            4,
            false,
          );
          paint(g2, rrect(-36, -88, 26, 7, 3), MT.VALUE_2A2A2E, { d: 0, lw: 1 });
        },
      }),
  });
  A(MT.MOTORBIKE, {
    draw: (g, o) =>
      twoWheel(g, o, {
        color: MT.C8352C,
        r: 32,
        wb: [-74, 74],
        body: (g2, col) => {
          const p = P();
          p.moveTo(-80, -50);
          p.lineTo(-30, -70);
          p.lineTo(30, -76);
          p.bezierCurveTo(60, -78, 70, -60, 60, -46);
          p.lineTo(-40, -40);
          p.closePath();
          paint(g2, p, col, { d: 5, lw: 1.5 });
          paint(g2, rrect(-56, -86, 54, 12, 5), MT.VALUE_2A2A2E, { d: 1, lw: 1.2 });
          stroke(
            g2,
            [
              [56, -60],
              [74, -32],
            ],
            MT.VALUE_3A3A40,
            5,
            false,
          );
          stroke(
            g2,
            [
              [50, -78],
              [44, -104],
              [60, -108],
            ],
            MT.VALUE_2A2A2E,
            4,
            false,
          );
          paint(g2, ell(70, -84, 8, 8), night(o) ? MT.FFF3C4 : MT.E8E2C8, { d: 0, lw: 1.1, glow: night(o) ? MT.RGBA_255_240_190_1 : null });
        },
      }),
  });
  A(MT.SCOOTER, {
    draw: (g, o) =>
      twoWheel(g, o, {
        color: MT.VALUE_7AC0C8,
        r: 22,
        wb: [-60, 60],
        body: (g2, col) => {
          const p = P();
          p.moveTo(-84, -44);
          p.bezierCurveTo(-84, -86, -30, -86, -20, -60);
          p.lineTo(30, -40);
          p.lineTo(46, -96);
          p.lineTo(60, -96);
          p.lineTo(62, -36);
          p.lineTo(-74, -30);
          p.closePath();
          paint(g2, p, col, { d: 5, lw: 1.5 });
          paint(g2, rrect(-70, -86, 50, 10, 5), MT.VALUE_5A3A2A, { d: 1, lw: 1.2 });
          stroke(
            g2,
            [
              [52, -96],
              [44, -116],
              [66, -118],
            ],
            MT.VALUE_2A2A2E,
            4,
            false,
          );
        },
      }),
  });
  const furn = (c, o) => nightTint(c, o, 0.35);
  A(MT.DESK, {
    draw(g, o) {
      const w = furn(o.color || MT.VALUE_9A6A42, o);
      paint(g, rrect(-132, -98, 264, 14, 3), C.shade(w, 0.1), { d: 3, lw: 1.5 });
      paint(g, rect(-124, -84, 90, 84), w, { d: 6, lw: 1.5 });
      for (let i = 0; i < 3; i++) {
        paint(g, rect(-118, -78 + i * 26, 78, 22), C.shade(w, 0.06), { d: 0, lw: 1.1 });
        paint(g, rrect(-88, -70 + i * 26, 18, 4, 2), MT.E8C66A, { d: 0, ink: false });
      }
      paint(g, rect(110, -84, 12, 84), w, { d: 2, lw: 1.3 });
    },
  });
  A(MT.CHAIR, {
    draw(g, o) {
      const w = furn(o.color || MT.VALUE_7A4E32, o);
      paint(g, rrect(-4, -128, 14, 80, 5), w, { d: 2, lw: 1.3 });
      paint(g, rrect(-28, -54, 56, 10, 4), C.shade(w, 0.1), { d: 2, lw: 1.3 });
      stroke(
        g,
        [
          [-22, -46],
          [-26, 0],
        ],
        w,
        6,
        true,
      );
      stroke(
        g,
        [
          [22, -46],
          [24, 0],
        ],
        w,
        6,
        true,
      );
    },
  });
  A(MT.TABLE, {
    draw(g, o) {
      const w = furn(o.color || MT.A8743E, o);
      paint(g, rrect(-112, -90, 224, 12, 3), C.shade(w, 0.1), { d: 3, lw: 1.5 });
      for (const x of [-96, 86]) paint(g, rect(x, -78, 10, 78), w, { d: 1, lw: 1.3 });
    },
  });
  A(MT.SOFA, {
    draw(g, o) {
      const c = furn(o.color || MT.B8524A, o);
      paint(g, rrect(-150, -118, 300, 60, 18), c, { d: 8, lw: 1.6 });
      paint(g, rrect(-160, -80, 320, 50, 14), C.shade(c, 0.06), { d: 6, lw: 1.6 });
      for (const x of [-170, 130]) paint(g, rrect(x, -96, 40, 70, 16), C.shade(c, -0.06), { d: 4, lw: 1.5 });
      for (const x of [-140, 128]) paint(g, rect(x, -30, 10, 18), MT.VALUE_4A3A2A, { d: 0, lw: 1.1 });
      paint(g, rrect(-60, -112, 50, 40, 12), MT.F4D35E, { d: 3, lw: 1.3 });
    },
  });
  A(MT.BED, {
    draw(g, o) {
      const wood = furn(MT.VALUE_8A5A3A, o),
        sheet = furn(o.color || MT.F2EFE8, o);
      paint(g, rrect(-182, -150, 22, 150, 6), wood, { d: 3, lw: 1.5 });
      paint(g, rect(-170, -70, 350, 40), wood, { d: 4, lw: 1.5 });
      paint(g, rrect(-164, -96, 340, 32, 10), sheet, { d: 4, lw: 1.5 });
      paint(g, rrect(-40, -100, 216, 40, 12), furn(MT.VALUE_5A7AB0, o), { d: 5, lw: 1.5 });
      paint(g, rrect(-150, -116, 70, 26, 12), MT.FFFFFF, { d: 3, lw: 1.4 });
      for (const x of [-166, 164]) paint(g, rect(x, -30, 12, 30), wood, { d: 0, lw: 1.2 });
    },
  });
  A(MT.BOOKSHELF, {
    draw(g, o) {
      const w = furn(o.color || MT.VALUE_7A4E32, o);
      paint(g, rect(-110, -360, 220, 360), w, { d: 8, lw: 1.6 });
      const cols = [MT.C8352C, MT.VALUE_2F6AB0, MT.E2A42C, MT.VALUE_2F8F7A, MT.VALUE_8A4AB0, MT.F2EFE8];
      const r = rng(o.seed || 3);
      for (let s = 0; s < 4; s++) {
        const y = -340 + s * 86;
        paint(g, rect(-98, y, 196, 70), C.shade(w, -0.3), { d: 0, lw: 1.2 });
        let x = -94;
        while (x < 88) {
          const bw = 10 + r() * 12,
            bh = 46 + r() * 20;
          paint(g, rect(x, y + 70 - bh, bw, bh), furn(cols[Math.floor(r() * cols.length)], o), { d: 0, lw: 1 });
          x += bw + 1;
        }
      }
    },
  });
  A(MT.WARDROBE, {
    draw(g, o) {
      const w = furn(o.color || MT.VALUE_9A6A42, o);
      paint(g, rrect(-90, -300, 180, 290, 4), w, { d: 8, lw: 1.6 });
      paint(g, rect(-96, -308, 192, 14), C.shade(w, -0.12), { d: 1, lw: 1.4 });
      stroke(
        g,
        [
          [0, -290],
          [0, -20],
        ],
        C.shade(w, -0.35),
        2,
        true,
      );
      for (const x of [-12, 8]) paint(g, rrect(x, -170, 4, 30, 2), MT.E8C66A, { d: 0, ink: false });
      for (const x of [-76, 6]) paint(g, rrect(x, -280, 70, 120, 4), C.shade(w, 0.06), { d: 0, lw: 1.1 });
    },
  });
  A(MT.PLANT_POT, {
    draw(g, o) {
      paint(
        g,
        poly([
          [-34, -48],
          [34, -48],
          [26, 0],
          [-26, 0],
        ]),
        furn(MT.C8704A, o),
        { d: 4, lw: 1.5 },
      );
      paint(g, rrect(-38, -56, 76, 12, 4), furn(MT.D8805A, o), { d: 1, lw: 1.3 });
      const c = leafCols(o, MT.VALUE_3F8650);
      for (let i = 0; i < 7; i++) {
        const a = -PI / 2 + (i - 3) * 0.32;
        const p = P();
        const ex = Math.cos(a) * 80,
          ey = -56 + Math.sin(a) * 80;
        p.moveTo(0, -56);
        p.quadraticCurveTo(ex * 0.5 - 14, ey * 0.6 - 30, ex, ey);
        p.quadraticCurveTo(ex * 0.5 + 14, ey * 0.6 - 4, 0, -56);
        p.closePath();
        paint(g, p, c[i % 3], { d: 3, lw: 1.2 });
      }
    },
  });
  A(MT.WINDOW, {
    draw(g, o) {
      const frame = furn(o.color || MT.F4EFE4, o);
      paint(g, rect(-100, -260, 200, 260), frame, { d: 6, lw: 1.6 });
      const lit = night(o) && o.lit;
      const sk = night(o) ? MT.VALUE_1D2A48 : MT.VALUE_9FD0EF;
      paint(g, rect(-86, -246, 172, 232), lit ? litGlass : sk, { d: 0, lw: 1.3 });
      if (!night(o)) paint(g, ell(30, -150, 50, 18), MT.FFFFFF, { d: 0, ink: false });
      stroke(
        g,
        [
          [0, -246],
          [0, -14],
        ],
        frame,
        6,
        false,
      );
      stroke(
        g,
        [
          [-86, -130],
          [86, -130],
        ],
        frame,
        6,
        false,
      );
      paint(g, rect(-110, -14, 220, 14), C.shade(frame, -0.1), { d: 1, lw: 1.4 });
      for (const sx of [-1, 1]) {
        const p = P();
        p.moveTo(sx * 96, -270);
        p.quadraticCurveTo(sx * 60, -150, sx * 104, -20);
        p.lineTo(sx * 128, -20);
        p.lineTo(sx * 124, -270);
        p.closePath();
        paint(g, p, furn(MT.C8524A, o), { d: 4, lw: 1.4 });
      }
    },
  });
  A(MT.DOOR, {
    draw(g, o) {
      const c = furn(o.color || MT.VALUE_8A5A3A, o);
      paint(g, rect(-66, -264, 132, 264), C.shade(c, 0.2), { d: 2, lw: 1.5 });
      paint(g, rect(-58, -256, 116, 256), c, { d: 6, lw: 1.5 });
      for (const [y, h] of [
        [-240, 100],
        [-124, 110],
      ])
        paint(g, rrect(-44, y, 88, h, 4), C.shade(c, -0.08), { d: 0, lw: 1.1 });
      paint(g, ell(40, -128, 5, 5), MT.E8C66A, { d: 0, lw: 1 });
    },
  });
  A(MT.PICTURE_FRAME, {
    draw(g, o) {
      paint(g, rect(-80, -120, 160, 120), furn(MT.C9A23A, o), { d: 3, lw: 1.5 });
      paint(g, rect(-66, -106, 132, 92), furn(MT.VALUE_9FD0EF, o), { d: 0, lw: 1.1 });
      paint(
        g,
        poly([
          [-66, -14],
          [-20, -70],
          [10, -40],
          [30, -60],
          [66, -14],
        ]),
        furn(MT.VALUE_4F9A5E, o),
        { d: 0, lw: 1 },
      );
      paint(g, ell(36, -84, 10, 10), MT.FFE8A0, { d: 0, ink: false });
    },
  });
  A(MT.DESK_LAMP, {
    draw(g, o) {
      paint(g, ell(0, -4, 22, 5), MT.VALUE_2F6A4A, { d: 0, lw: 1.2 });
      stroke(
        g,
        [
          [0, -6],
          [10, -70],
          [30, -96],
        ],
        MT.VALUE_2F6A4A,
        4,
        true,
      );
      paint(
        g,
        poly([
          [18, -110],
          [44, -96],
          [36, -80],
          [12, -94],
        ]),
        MT.VALUE_2F8F6A,
        { d: 2, lw: 1.3 },
      );
      if (night(o) || o.on) glowDisc(g, 36, -80, 60, MT.FFE2A0, 0.5);
    },
  });
  const extraTrees = [
    [
      MT.TREE_LOLLIPOP,
      MT.CAY_KEO_MUT_HOAT_HINH,
      MT.VALUE_6AC06A,
      (g, o) => {
        trunk(g, 150, 10, null, o, false);
        paint(g, ell(0, -230, 80, 80), leafCols(o, MT.VALUE_6AC06A)[0], { d: 16, lw: 1.7 });
      },
    ],
    [
      MT.TREE_MAPLE,
      MT.CAY_PHONG_DO_HOAT_HINH,
      MT.D8402C,
      (g, o) => {
        trunk(g, 170, 14, null, o, true);
        blobs(
          g,
          [
            [-70, -220, 58, 1],
            [70, -226, 60, 1],
            [0, -290, 78, 0],
            [-34, -186, 48, 2],
            [40, -190, 46, 0],
          ],
          leafCols(o, MT.D8402C),
        );
      },
    ],
    [
      MT.TREE_POPLAR,
      MT.CAY_DUONG_HOAT_HINH,
      MT.VALUE_5AA05A,
      (g, o) => {
        trunk(g, 60, 10, null, o, false);
        paint(g, ell(0, -250, 48, 200), leafCols(o, MT.VALUE_5AA05A)[0], { d: 12, lw: 1.7 });
      },
    ],
    [
      MT.TREE_FRUIT,
      MT.CAY_AN_QUA_HOAT_HINH,
      MT.VALUE_4F9A5E,
      (g, o) => {
        trunk(g, 160, 13, null, o, true);
        blobs(
          g,
          [
            [-66, -214, 56, 1],
            [64, -220, 58, 1],
            [0, -280, 74, 0],
            [-30, -186, 46, 2],
          ],
          leafCols(o, MT.VALUE_4F9A5E),
        );
        const r = rng(5);
        for (let i = 0; i < 9; i++) paint(g, ell(-90 + r() * 180, -300 + r() * 140, 8, 8), nightTint(MT.E2402C, o, 0.4), { d: 1, lw: 1 });
      },
    ],
    [
      MT.BUSH_FLOWERING,
      MT.BUI_HOA_HOAT_HINH,
      MT.VALUE_4F9A5E,
      (g, o) => {
        blobs(
          g,
          [
            [-44, -40, 40, 1],
            [38, -40, 38, 1],
            [-4, -64, 46, 0],
          ],
          leafCols(o, MT.VALUE_4F9A5E),
          8,
        );
        const r = rng(3);
        for (let i = 0; i < 12; i++) paint(g, ell(-70 + r() * 140, -96 + r() * 70, 6, 6), nightTint([MT.F2A7C0, MT.FFFFFF, MT.F4D35E][i % 3], o, 0.4), { d: 0, lw: 0.9 });
      },
    ],
  ];
  for (const [id, name, , draw] of extraTrees) NEW(id, name, MT.NATURE, [260, 380], draw, { tags: [MT.TOON, MT.CAY, MT.HOAT_HINH] });
  NEW(
    MT.FOOD_TRUCK,
    MT.XE_BAN_DO_AN_HOAT_HINH,
    MT.VEHICLE,
    [480, 230],
    (g, o) =>
      boxVehicle(g, o, {
        len: 480,
        h: 220,
        color: MT.F2A7C0,
        wheels: [0.2, 0.8],
        extra: (g2, o2, x0) => {
          paint(g2, rect(x0 + 40, -170, 220, 80), night(o2) ? MT.FFD889 : MT.FFF4DC, { d: 0, lw: 1.4, glow: night(o2) ? MT.RGBA_255_200_110_0_6 : null });
          awning(g2, x0 + 30, -190, 240, MT.E2574C, o2);
          paint(g2, rrect(x0 + 60, -240, 160, 36, 8), MT.E2574C, { d: 2, lw: 1.4 });
        },
      }),
    { tags: [MT.TOON, MT.XE, MT.HOAT_HINH], lights: (o) => (o.night || o.lights ? [{ type: MT.BEAM, x: 232, y: -60, angle: 0.06, len: 700, spread: 0.18, color: MT.FFF2C8, alpha: 0.38 }] : []) },
  );
  NEW(MT.VINTAGE_BUS, MT.XE_BUYT_CO_HOAT_HINH, MT.VEHICLE, [700, 260], (g, o) => boxVehicle(g, o, { len: 700, h: 250, color: MT.VALUE_2F8F7A, wheels: [0.16, 0.8], windows: 5, wheel: 38, extra: (g2, o2, x0, L) => paint(g2, rect(x0 + 6, -110, L - 12, 12), MT.F4EFE4, { d: 0, lw: 1.1 }) }), { tags: [MT.TOON, MT.XE, MT.HOAT_HINH] });
  NEW(MT.CONVERTIBLE, MT.XE_MUI_TRAN_HOAT_HINH, MT.VEHICLE, [420, 110], (g, o) => carBody(g, o, { color: MT.F2C230, len: 420, h: 84, shape: MT.BEETLE }), { tags: [MT.TOON, MT.XE, MT.HOAT_HINH] });
  NEW(
    MT.DELIVERY_BIKE,
    MT.XE_DAP_GIAO_HANG_HOAT_HINH,
    MT.VEHICLE,
    [200, 140],
    (g, o) => {
      T.assets.bicycle.draw(g, o);
      paint(g, rrect(30, -140, 60, 50, 6), nightTint(MT.E2A42C, o, 0.4), { d: 3, lw: 1.4 });
    },
    { tags: [MT.TOON, MT.XE, MT.HOAT_HINH] },
  );
  NEW(
    MT.FLOWER_BED,
    MT.BON_HOA_HOAT_HINH,
    MT.NATURE,
    [300, 90],
    (g, o) => {
      paint(g, rrect(-150, -40, 300, 40, 8), nightTint(MT.C8A07A, o), { d: 4, lw: 1.5 });
      T.assets.flowers.draw(g, o);
      g.save();
      g.translate(90, 0);
      T.assets.flowers.draw(g, Object.assign({}, o, { seed: 7 }));
      g.restore();
      g.save();
      g.translate(-90, 0);
      T.assets.flowers.draw(g, Object.assign({}, o, { seed: 3 }));
      g.restore();
    },
    { tags: [MT.TOON, MT.HOA_2, MT.HOAT_HINH] },
  );
  NEW(
    MT.DOUBLE_LAMP,
    MT.DEN_DUONG_DOI_HOAT_HINH,
    MT.STREET,
    [180, 420],
    (g, o) => {
      const col = MT.VALUE_2B3240;
      paint(g, rrect(-16, -26, 32, 26, 4), col, { d: 3, lw: 1.5 });
      paint(
        g,
        poly([
          [-6, -26],
          [-4, -380],
          [4, -380],
          [6, -26],
        ]),
        col,
        { d: 3, lw: 1.5 },
      );
      stroke(
        g,
        [
          [0, -370],
          [-40, -400, -62, -380],
          [-64, -366],
        ],
        col,
        6,
        false,
      );
      stroke(
        g,
        [
          [0, -370],
          [40, -400, 62, -380],
          [64, -366],
        ],
        col,
        6,
        false,
      );
      for (const lx of [-64, 64]) {
        if (night(o)) glowDisc(g, lx, -352, 90, MT.FFD89A, 0.55);
        paint(
          g,
          poly([
            [lx - 14, -366],
            [lx + 14, -366],
            [lx + 10, -336],
            [lx - 10, -336],
          ]),
          night(o) ? MT.FFEAB0 : MT.F3EAD0,
          { d: 1, lw: 1.4, glow: night(o) ? MT.RGBA_255_220_150_1 : null },
        );
      }
    },
    {
      tags: [MT.TOON, MT.DEN, MT.HOAT_HINH],
      lights: (o) =>
        o.night
          ? [
              { type: MT.LAMP, x: -64, y: -340, len: 420, color: MT.FFD89A, alpha: 0.36 },
              { type: MT.LAMP, x: 64, y: -340, len: 420, color: MT.FFD89A, alpha: 0.36 },
            ]
          : [],
    },
  );
  NEW(
    MT.KIOSK,
    MT.KI_OT_CA_PHE_HOAT_HINH,
    MT.STREET,
    [240, 300],
    (g, o) => {
      paint(g, rect(-110, -200, 220, 200), nightTint(MT.VALUE_3F7A5A, o, 0.4), { d: 8, lw: 1.6 });
      awning(g, -122, -236, 244, nightTint(MT.F4EFE4, o, 0.3), o);
      paint(g, rect(-90, -170, 180, 80), night(o) ? MT.FFD889 : MT.FFF4DC, { d: 0, lw: 1.3, glow: night(o) ? MT.RGBA_255_200_110_0_6 : null });
      paint(g, rrect(-70, -290, 140, 44, 10), nightTint(MT.E2574C, o, 0.4), { d: 3, lw: 1.5 });
      paint(g, ell(0, -268, 12, 10), MT.F6E7B8, { d: 0, ink: false });
    },
    { tags: [MT.TOON, MT.QUAN, MT.HOAT_HINH] },
  );
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
