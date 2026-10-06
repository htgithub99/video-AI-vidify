(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { paint, rect, rrect, ell, poly, stroke, glowDisc, P } = T.kit;
  const E = T.E;
  const asset = (g, id, x, y, o, s) => ME.drawAsset(g, id, x, y, o, s);
  const isNight = (tp) => !!tp.night;
  const isDusk = (tp) => !tp.night && tp.rim && tp.ambient > 0.15 && tp.ambient < 0.4;
  T.sky = (g, W, H, tp) => {
    const n = isNight(tp),
      d = isDusk(tp);
    const gr = g.createLinearGradient(0, 0, 0, H * 0.72);
    if (n) {
      gr.addColorStop(0, MT.VALUE_0B1230);
      gr.addColorStop(0.7, MT.VALUE_22305E);
      gr.addColorStop(1, MT.VALUE_3A3F72);
    } else if (d) {
      gr.addColorStop(0, MT.VALUE_26345F);
      gr.addColorStop(0.55, MT.VALUE_9A5A86);
      gr.addColorStop(1, MT.F6A36A);
    } else {
      gr.addColorStop(0, MT.VALUE_4F9DDC);
      gr.addColorStop(0.65, MT.A6D6F2);
      gr.addColorStop(1, MT.FDE6BF);
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    const unit = Math.min(W, H) / 1080;
    if (n) {
      const r = U.rng(41);
      for (let i = 0; i < 160; i++) {
        g.globalAlpha = 0.3 + r() * 0.6;
        g.fillStyle = MT.FFFFFF;
        const s = (r() < 0.08 ? 2.6 : 1.4) * unit;
        g.fillRect(r() * W, r() * H * 0.55, s, s);
      }
      g.globalAlpha = 1;
      g.save();
      g.translate(W * 0.8, H * 0.22);
      g.scale(unit, unit);
      ME.registry.assets.moon.draw(g, { night: true });
      g.restore();
    } else {
      g.save();
      g.translate(W * (d ? 0.72 : 0.84), H * (d ? 0.62 : 0.2));
      g.scale(unit * (d ? 1.3 : 1), unit * (d ? 1.3 : 1));
      ME.registry.assets.sun.draw(g, {});
      g.restore();
      for (let i = 0; i < 4; i++) {
        g.save();
        g.translate(W * (0.12 + i * 0.26), H * (0.12 + (i % 2) * 0.09));
        g.scale(unit * (0.8 - (i % 2) * 0.2), unit * (0.8 - (i % 2) * 0.2));
        ME.registry.assets.cloud.draw(g, { alpha: d ? 0.7 : 0.95, night: false });
        if (d) {
          g.globalCompositeOperation = MT.SOURCE_ATOP;
        }
        g.restore();
      }
    }
  };
  const hazeOf = (tp) => (isNight(tp) ? MT.VALUE_2A3460 : isDusk(tp) ? MT.A86A86 : MT.B9D6EE);
  const skylineToon = (g, x0, x1, col, minH, maxH, seed, tp) => {
    const r = U.rng(seed);
    let x = x0;
    while (x < x1) {
      const w = 80 + r() * 140,
        h = minH + r() * (maxH - minH);
      const p = P();
      const kind = r();
      p.moveTo(x, 40);
      p.lineTo(x, -h);
      if (kind < 0.3) {
        p.lineTo(x + w * 0.2, -h - 40);
        p.lineTo(x + w * 0.8, -h - 40);
      } else if (kind < 0.45) p.arc(x + w / 2, -h, w / 2, PI, 0);
      p.lineTo(x + w, -h);
      p.lineTo(x + w, 40);
      p.closePath();
      g.fillStyle = col;
      g.fill(p);
      if (r() < 0.3) g.fillRect(x + w * 0.3, -h - 70, 10, 40);
      if (isNight(tp)) {
        g.fillStyle = MT.RGBA_255_214_140_0_7;
        for (let wy = -h + 20; wy < -20; wy += 26) for (let wx = x + 10; wx < x + w - 12; wx += 20) if (r() < 0.2) g.fillRect(wx, wy, 8, 11);
      }
      x += w + 2;
    }
  };
  const hillsToon = (g, x0, x1, col, amp, base, seed, ink) => {
    const p = P();
    p.moveTo(x0, 60);
    for (let x = x0; x <= x1 + 60; x += 60) p.lineTo(x, -base - (U.fbm(x / 800, seed) * 0.5 + 0.5) * amp);
    p.lineTo(x1 + 60, 60);
    p.closePath();
    paint(g, p, col, { d: 0, lw: 2, ink: !!ink });
  };
  const streetGround = (opt) => (g, x0, x1, tp, H) => {
    const n = isNight(tp);
    const side = n ? MT.VALUE_5A5470 : opt.side || MT.D9CFC4;
    const road = n ? MT.VALUE_272536 : opt.road || MT.VALUE_5B6170;
    paint(g, rect(x0, -150, x1 - x0, 42), side, { d: 0, lw: 1.6 });
    g.save();
    g.strokeStyle = MT.RGBA_0_0_0_0_13;
    g.lineWidth = 2;
    g.beginPath();
    for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) {
      g.moveTo(x, -149);
      g.lineTo(x - 22, -109);
    }
    g.moveTo(x0, -130);
    g.lineTo(x1, -130);
    g.stroke();
    g.restore();
    paint(g, rect(x0, -110, x1 - x0, 9), C.shade(side, -0.14), { d: 0, lw: 1.5 });
    paint(g, rect(x0, -101, x1 - x0, 92), road, { d: 0, lw: 1.5 });
    const r = U.rng(5);
    g.fillStyle = MT.RGBA_255_255_255_0_06;
    for (let i = 0; i < (x1 - x0) / 4; i++) g.fillRect(x0 + r() * (x1 - x0), -100 + r() * 90, 3, 2);
    for (let x = Math.floor(x0 / 180) * 180; x < x1; x += 180) paint(g, rrect(x, -59, 90, 6, 3), n ? MT.CFC6A4 : MT.F2EAD2, { d: 0, ink: false });
    paint(g, rect(x0, -9, x1 - x0, 10), C.shade(side, -0.08), { d: 0, lw: 1.5 });
    paint(g, rect(x0, 1, x1 - x0, H + 10), side, { d: 0, ink: false });
    g.save();
    g.strokeStyle = MT.RGBA_0_0_0_0_1;
    g.lineWidth = 2;
    g.beginPath();
    for (let x = Math.floor(x0 / 110) * 110; x < x1; x += 110) {
      g.moveTo(x, 2);
      g.lineTo(x + 40, H);
    }
    g.moveTo(x0, 60);
    g.lineTo(x1, 60);
    g.stroke();
    g.restore();
    if (n) {
      g.save();
      g.globalCompositeOperation = MT.SCREEN;
      g.fillStyle = MT.RGBA_255_200_120_0_08;
      g.fillRect(x0, -150, x1 - x0, 50);
      g.restore();
    }
  };
  const buildingsRow = (kind, seed, gap) => (g, x0, x1, tp) => {
    const r = U.rng(seed);
    let x = x0;
    while (x < x1) {
      const w = kind === MT.MODERN ? 280 + r() * 180 : 360 + Math.floor(r() * 3) * 60;
      const h = kind === MT.MODERN ? 600 + r() * 500 : 520 + r() * 160;
      asset(g, kind === MT.MODERN ? MT.BUILDING_MODERN : MT.BUILDING_HAUSSMANN, x + w / 2, 0, { w, h, night: tp.night, seed: Math.floor(r() * 99), litRatio: 0.45, color: kind === MT.MODERN ? C.mix(MT.VALUE_5F86A8, MT.VALUE_9FB7CF, r()) : undefined });
      x += w + (gap == null ? 10 : gap);
    }
  };
  const farRow = (seed) => (g, x0, x1, tp) => {
    g.save();
    buildingsRow(MT.HAUSSMANN, seed, 6)(g, x0, x1, tp);
    g.globalCompositeOperation = MT.SOURCE_ATOP;
    g.fillStyle = C.rgba(hazeOf(tp), 0.55);
    g.fillRect(x0 - 100, -1400, x1 - x0 + 200, 1500);
    g.restore();
  };
  E(MT.CITY_STREET, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.12, blur: 1.5, draw: (g, x0, x1, tp) => skylineToon(g, x0, x1, C.mix(hazeOf(tp), MT.FFFFFF, isNight(tp) ? 0.05 : 0.25), 240, 520, 3, tp) },
      {
        depth: 0.4,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          g.save();
          g.scale(0.62, 0.62);
          farRow(17)(g, x0 / 0.62, x1 / 0.62, tp);
          g.restore();
        },
      },
      { depth: 0.8, blur: 0, draw: buildingsRow(MT.HAUSSMANN, 21) },
    ],
    ground: streetGround({}),
    props: (WW) => {
      const out = [];
      for (let x = 200; x < WW; x += 620) out.push({ asset: MT.STREET_LAMP, x, lane: MT.BACK });
      for (let x = 520; x < WW; x += 1240) out.push({ asset: MT.TREE_ROUND, x, lane: MT.BACK, scale: 0.9 });
      return out;
    },
  });
  E(MT.CITY_MODERN, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.15, blur: 1.5, draw: (g, x0, x1, tp) => skylineToon(g, x0, x1, C.mix(hazeOf(tp), MT.FFFFFF, 0.15), 320, 820, 5, tp) },
      { depth: 0.6, blur: 0.4, draw: buildingsRow(MT.MODERN, 8, 40) },
    ],
    ground: streetGround({ side: MT.CFD3D8, road: MT.VALUE_4F5562 }),
    props: (WW) => {
      const out = [];
      for (let x = 300; x < WW; x += 700) out.push({ asset: MT.DOUBLE_LAMP, x, lane: MT.BACK });
      for (let x = 650; x < WW; x += 1400) out.push({ asset: MT.TREE_LOLLIPOP, x, lane: MT.BACK, scale: 0.85 });
      return out;
    },
  });
  E(MT.CITY_PARK, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.15, blur: 1.5, draw: (g, x0, x1, tp) => skylineToon(g, x0, x1, C.mix(hazeOf(tp), MT.FFFFFF, 0.2), 260, 560, 9, tp) },
      { depth: 0.35, blur: 0.6, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_1F3A3A : MT.VALUE_7CC47A, 120, 40, 4) },
      {
        depth: 0.6,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(4);
          for (let x = x0; x < x1; x += 220 + r() * 120) asset(g, [MT.TREE_ROUND, MT.TREE_OAK, MT.TREE_BLOSSOM, MT.TREE_POPLAR][Math.floor(r() * 4)], x, 0, { night: tp.night, seed: Math.floor(x) }, 0.7 + r() * 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      const n = isNight(tp);
      paint(g, rect(x0, -150, x1 - x0, H + 160), n ? MT.VALUE_1F3A2E : MT.VALUE_6CBF6A, { d: 0, ink: false });
      paint(g, rect(x0, -112, x1 - x0, 70), n ? MT.VALUE_5A5470 : MT.E8D8B8, { d: 0, lw: 1.5 });
      const r = U.rng(7);
      g.fillStyle = n ? MT.RGBA_0_0_0_0_15 : MT.RGBA_40_120_50_0_35;
      for (let i = 0; i < (x1 - x0) / 12; i++) g.fillRect(x0 + r() * (x1 - x0), -40 + r() * 300, 3, 8);
    },
    props: (WW) => {
      const out = [];
      for (let x = 260; x < WW; x += 760) out.push({ asset: MT.STREET_LAMP, x, lane: MT.BACK });
      for (let x = 600; x < WW; x += 900) out.push({ asset: MT.BENCH, x, lane: MT.BACK });
      for (let x = 900; x < WW; x += 1400) out.push({ asset: MT.FLOWER_BED, x, lane: MT.BACK });
      return out;
    },
  });
  const countryGround = (col) => (g, x0, x1, tp, H) => {
    const n = isNight(tp);
    paint(g, rect(x0, -150, x1 - x0, H + 160), n ? MT.VALUE_1D3426 : col, { d: 0, ink: false });
    paint(g, rect(x0, -96, x1 - x0, 60), n ? MT.VALUE_4A4038 : MT.D8B98A, { d: 0, lw: 1.4 });
    const r = U.rng(3);
    g.fillStyle = n ? MT.RGBA_0_0_0_0_15 : MT.RGBA_40_110_40_0_3;
    for (let i = 0; i < (x1 - x0) / 10; i++) g.fillRect(x0 + r() * (x1 - x0), -150 + r() * 400, 3, 7);
  };
  E(MT.COUNTRYSIDE, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.1, blur: 1.5, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_24305A : MT.VALUE_9FB8D8, 260, 120, 2) },
      { depth: 0.3, blur: 0.8, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_1F3A3A : MT.VALUE_8CCF7A, 160, 60, 6, true) },
      {
        depth: 0.55,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_1D3426 : MT.VALUE_6CBF5A, 90, 10, 9, true);
          const r = U.rng(8);
          for (let x = x0; x < x1; x += 300 + r() * 300) asset(g, r() > 0.5 ? MT.TREE_ROUND : MT.TREE_FRUIT, x, -10, { night: tp.night }, 0.6);
          for (let x = Math.floor(x0 / 1600) * 1600 + 800; x < x1; x += 1600) asset(g, MT.COTTAGE, x, -10, { night: tp.night }, 0.7);
        },
      },
    ],
    ground: countryGround(MT.VALUE_78C464),
    props: (WW) => {
      const out = [];
      for (let x = 300; x < WW; x += 800) out.push({ asset: MT.FENCE, x, lane: MT.BACK });
      return out;
    },
  });
  E(MT.FOREST, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.15, blur: 1.5, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_1C2A48 : MT.VALUE_9FC0C8, 200, 160, 2) },
      {
        depth: 0.35,
        blur: 0.8,
        draw: (g, x0, x1, tp) => {
          g.save();
          const r = U.rng(3);
          for (let x = x0; x < x1; x += 90 + r() * 60) asset(g, MT.TREE_PINE, x, 0, { night: tp.night, color: isNight(tp) ? MT.VALUE_183A38 : MT.VALUE_5A9A7A }, 0.7 + r() * 0.3);
          g.restore();
        },
      },
      {
        depth: 0.7,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(9);
          for (let x = x0; x < x1; x += 180 + r() * 160) asset(g, r() > 0.3 ? MT.TREE_PINE : MT.TREE_BIRCH, x, 0, { night: tp.night }, 0.9 + r() * 0.3);
        },
      },
    ],
    ground: countryGround(MT.VALUE_5AA060),
    props: (WW) => {
      const out = [];
      for (let x = 400; x < WW; x += 700) out.push({ asset: MT.BUSH, x, lane: MT.BACK });
      for (let x = 800; x < WW; x += 1100) out.push({ asset: MT.ROCK, x, lane: MT.MID, scale: 0.7 });
      return out;
    },
  });
  const seaLayer = (g, x0, x1, tp) => {
    const n = isNight(tp);
    const gr = g.createLinearGradient(0, -260, 0, 40);
    gr.addColorStop(0, n ? MT.VALUE_1C2A58 : MT.VALUE_3AA0D0);
    gr.addColorStop(1, n ? MT.VALUE_0E1838 : MT.VALUE_1F7AB0);
    g.fillStyle = gr;
    g.fillRect(x0, -260, x1 - x0, 300);
    g.strokeStyle = n ? MT.RGBA_200_220_255_0_18 : MT.RGBA_255_255_255_0_5;
    g.lineWidth = 3;
    const r = U.rng(2);
    for (let i = 0; i < (x1 - x0) / 60; i++) {
      const x = x0 + r() * (x1 - x0),
        y = -240 + r() * 260;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 14, y - 6, x + 28, y);
      g.stroke();
    }
  };
  E(MT.BEACH, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.1, blur: 1, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_24305A : MT.VALUE_8FB0D0, 160, 260, 4) },
      { depth: 0.4, blur: 0, draw: seaLayer },
      {
        depth: 0.7,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(5);
          for (let x = x0; x < x1; x += 500 + r() * 400) asset(g, MT.TREE_PALM, x, 0, { night: tp.night }, 0.8 + r() * 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      const n = isNight(tp);
      paint(g, rect(x0, -150, x1 - x0, H + 160), n ? MT.VALUE_5A5060 : MT.F2D9A2, { d: 0, ink: false });
      g.strokeStyle = MT.RGBA_255_255_255_0_7;
      g.lineWidth = 6;
      g.beginPath();
      for (let x = x0; x < x1; x += 30) g.lineTo(x, -146 + Math.sin(x / 70) * 4);
      g.stroke();
    },
  });
  E(MT.RIVIERA_PROMENADE, {
    sky: (g, W, H, tp) => T.sky(g, W, H, tp),
    layers: [
      { depth: 0.1, blur: 1, draw: (g, x0, x1, tp) => hillsToon(g, x0, x1, isNight(tp) ? MT.VALUE_24305A : MT.VALUE_9FB8D8, 180, 240, 7) },
      { depth: 0.35, blur: 0, draw: seaLayer },
      {
        depth: 0.75,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(11);
          for (let x = x0; x < x1; x += 420 + r() * 200) asset(g, MT.TREE_PALM, x, 0, { night: tp.night }, 0.85);
        },
      },
    ],
    ground: streetGround({ side: MT.EFE3C8, road: MT.VALUE_5B6170 }),
    props: (WW) => {
      const out = [];
      for (let x = 260; x < WW; x += 520) out.push({ asset: MT.DOUBLE_LAMP, x, lane: MT.BACK });
      for (let x = 520; x < WW; x += 1040) out.push({ asset: MT.BENCH, x, lane: MT.BACK });
      return out;
    },
  });
  const ROOMS = {
    bank_lobby: { wall: MT.EFE3CC, panel: MT.C9A879, floor: MT.E6DCCB, floorType: MT.CHECKER, floorAlt: MT.B9AD98, columns: MT.F6EFE0, windows: true, pendant: true },
    office: { wall: MT.DFE6DD, panel: MT.VALUE_8A6A4A, floor: MT.VALUE_8A5E3C, floorType: MT.WOOD, windows: true, pendant: true },
    home_interior: { wall: MT.F2D9B8, panel: MT.C99D74, floor: MT.VALUE_9A6A42, floorType: MT.WOOD, wallpaper: MT.E8CAA4, windows: false },
    bedroom: { wall: MT.CFE0EF, panel: MT.FFFFFF, floor: MT.B08058, floorType: MT.WOOD, wallpaper: MT.BCD2E6 },
    cafe_interior: { wall: MT.F4E0C4, panel: MT.VALUE_7A4E32, floor: MT.E8E0D0, floorType: MT.CHECKER, floorAlt: MT.C9B49A, windows: true, pendant: true },
    classroom: { wall: MT.E8ECCF, panel: MT.VALUE_9AB07A, floor: MT.C89A6A, floorType: MT.WOOD, windows: true },
    police_station: { wall: MT.D6DDE6, panel: MT.VALUE_5A6A82, floor: MT.VALUE_8A929C, floorType: MT.TILES, windows: true, pendant: true },
    hospital_room: { wall: MT.E6F2F0, panel: MT.VALUE_9FD0C8, floor: MT.D8E2E6, floorType: MT.TILES, windows: true },
    photo_studio: { wall: MT.VALUE_3A3440, panel: MT.VALUE_2A2430, floor: MT.VALUE_6A5A4A, floorType: MT.WOOD },
    courtroom: { wall: MT.E2D2B8, panel: MT.VALUE_6A4228, floor: MT.VALUE_7A4E32, floorType: MT.WOOD, pendant: true },
    kitchen: { wall: MT.F2F0E6, panel: MT.FFFFFF, floor: MT.E8E2D4, floorType: MT.CHECKER, floorAlt: MT.D89A8A, tilesWall: true },
    laboratory: { wall: MT.E2EEF2, panel: MT.CFDDE4, floor: MT.CFD8DC, floorType: MT.TILES, windows: true, pendant: true },
    supermarket: { wall: MT.F4F1E8, panel: MT.E2574C, floor: MT.E6E2D8, floorType: MT.TILES, pendant: true },
    warehouse_interior: { wall: MT.VALUE_7A848C, panel: MT.VALUE_5A646C, floor: MT.VALUE_5A5E64, floorType: MT.CONCRETE, pendant: true },
    prison_cell: { wall: MT.VALUE_8A8E8A, panel: MT.VALUE_6A6E6A, floor: MT.VALUE_6A6A66, floorType: MT.CONCRETE },
    bank_vault: { wall: MT.VALUE_8A8478, panel: MT.VALUE_6A6458, floor: MT.VALUE_7A766C, floorType: MT.TILES, keepLayers: true },
  };
  const roomWall = (cfg) => (g, x0, x1, tp) => {
    const n = isNight(tp) || tp.ambient > 0.4;
    const wall = n ? C.mix(cfg.wall, MT.VALUE_1A1A2E, 0.45) : cfg.wall;
    paint(g, rect(x0, -900, x1 - x0, 900), wall, { d: 0, ink: false });
    if (cfg.wallpaper) {
      g.save();
      g.fillStyle = n ? C.mix(cfg.wallpaper, MT.VALUE_1A1A2E, 0.45) : cfg.wallpaper;
      for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) g.fillRect(x, -760, 24, 520);
      g.restore();
    }
    if (cfg.tilesWall) {
      g.save();
      g.strokeStyle = MT.RGBA_0_0_0_0_08;
      g.lineWidth = 2;
      g.beginPath();
      for (let y = -420; y < -240; y += 30) {
        g.moveTo(x0, y);
        g.lineTo(x1, y);
      }
      for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) {
        g.moveTo(x, -420);
        g.lineTo(x, -240);
      }
      g.stroke();
      g.restore();
    }
    paint(g, rect(x0, -800, x1 - x0, 26), C.shade(wall, 0.08), { d: 0, lw: 1.6 });
    paint(g, rect(x0, -774, x1 - x0, 8), C.shade(wall, -0.12), { d: 0, ink: false });
    const panel = n ? C.mix(cfg.panel, MT.VALUE_1A1A2E, 0.45) : cfg.panel;
    paint(g, rect(x0, -240, x1 - x0, 240), panel, { d: 0, lw: 1.6 });
    paint(g, rect(x0, -250, x1 - x0, 12), C.shade(panel, 0.15), { d: 0, lw: 1.4 });
    for (let x = Math.floor(x0 / 180) * 180; x < x1; x += 180) paint(g, rrect(x + 16, -214, 148, 170, 6), C.shade(panel, -0.08), { d: 0, lw: 1.2 });
    paint(g, rect(x0, -24, x1 - x0, 24), C.shade(panel, -0.28), { d: 0, lw: 1.4 });
    if (cfg.columns)
      for (let x = Math.floor(x0 / 520) * 520 + 40; x < x1; x += 520) {
        paint(g, rect(x, -800, 56, 800), n ? C.mix(cfg.columns, MT.VALUE_1A1A2E, 0.45) : cfg.columns, { d: 10, lw: 1.6 });
        paint(g, rect(x - 8, -800, 72, 22), C.shade(cfg.columns, -0.05), { d: 2, lw: 1.4 });
        paint(g, rect(x - 8, -40, 72, 40), C.shade(cfg.columns, -0.05), { d: 2, lw: 1.4 });
      }
    if (cfg.windows) for (let x = Math.floor(x0 / 1040) * 1040 + 300; x < x1; x += 1040) asset(g, MT.WINDOW, x, -330, { night: n, lit: false }, 1.3);
    if (cfg.pendant)
      for (let x = Math.floor(x0 / 520) * 520 + 300; x < x1; x += 520) {
        stroke(
          g,
          [
            [x, -900],
            [x, -700],
          ],
          MT.VALUE_2A2A2E,
          3,
          false,
        );
        paint(
          g,
          poly([
            [x - 40, -660],
            [x - 26, -700],
            [x + 26, -700],
            [x + 40, -660],
          ]),
          MT.VALUE_2F5A4A,
          { d: 3, lw: 1.4 },
        );
        glowDisc(g, x, -650, 120, MT.FFE2A8, n ? 0.5 : 0.25);
      }
  };
  const roomFloor = (cfg) => (g, x0, x1, tp, H) => {
    const n = isNight(tp) || tp.ambient > 0.4;
    const col = n ? C.mix(cfg.floor, MT.VALUE_12121E, 0.45) : cfg.floor;
    paint(g, rect(x0, -150, x1 - x0, H + 160), col, { d: 0, ink: false });
    const mid = (x0 + x1) / 2;
    g.save();
    if (cfg.floorType === MT.WOOD) {
      g.strokeStyle = MT.RGBA_0_0_0_0_18;
      g.lineWidth = 2;
      g.beginPath();
      for (let y = -150; y < H; y += 26 + (y + 150) * 0.12) {
        g.moveTo(x0, y);
        g.lineTo(x1, y);
      }
      for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) {
        g.moveTo(x, -150);
        g.lineTo(x + (x - mid) * 0.4, H);
      }
      g.stroke();
    } else if (cfg.floorType === MT.CHECKER || cfg.floorType === MT.TILES) {
      const alt = cfg.floorAlt ? (n ? C.mix(cfg.floorAlt, MT.VALUE_12121E, 0.45) : cfg.floorAlt) : C.shade(col, -0.08);
      const rows = [-150, -112, -66, -10, 60, 150, 260];
      for (let ri = 0; ri < rows.length - 1; ri++) {
        const ya = rows[ri],
          yb = rows[ri + 1];
        const sc = 1 + ri * 0.35;
        const tw = 64 * sc;
        let k = 0;
        for (let x = Math.floor((x0 - mid) / tw) * tw + mid; x < x1; x += tw, k++) {
          if (cfg.floorType === MT.CHECKER ? (k + ri) % 2 : false) {
            g.fillStyle = alt;
            g.fillRect(x, ya, tw, yb - ya);
          }
        }
        g.strokeStyle = MT.RGBA_0_0_0_0_12;
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(x0, ya);
        g.lineTo(x1, ya);
        g.stroke();
      }
      if (cfg.floorType === MT.TILES) {
        g.strokeStyle = MT.RGBA_0_0_0_0_1;
        g.beginPath();
        for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) {
          g.moveTo(x, -150);
          g.lineTo(x + (x - mid) * 0.5, H);
        }
        g.stroke();
      }
    } else if (cfg.floorType === MT.CONCRETE) {
      const r = U.rng(3);
      g.fillStyle = MT.RGBA_0_0_0_0_08;
      for (let i = 0; i < 80; i++) g.fillRect(x0 + r() * (x1 - x0), -150 + r() * 300, 40 + r() * 80, 3);
    }
    g.restore();
    const gr = g.createLinearGradient(0, -150, 0, -60);
    gr.addColorStop(0, MT.RGBA_0_0_0_0_22);
    gr.addColorStop(1, MT.RGBA_0_0_0_0);
    g.fillStyle = gr;
    g.fillRect(x0, -150, x1 - x0, 90);
  };
  const decorReplay = (base, orig) => (g, x0, x1, tp, p) => {
    base(g, x0, x1, tp, p);
    if (!orig || !orig.draw) return;
    const recs = [];
    const saved = {};
    const reg = ME.registry.assets;
    for (const id of Object.keys(reg)) {
      saved[id] = reg[id].draw;
      reg[id].draw = function (gg, o) {
        recs.push({ id, m: gg.getTransform(), o: Object.assign({}, o || {}), alpha: gg.globalAlpha });
      };
    }
    try {
      const dc = ME.makeCanvas(2, 2).getContext(MT.VALUE_2D);
      dc.setTransform(g.getTransform());
      orig.draw(dc, x0, x1, tp, p);
    } catch (e) {
      void e;
    } finally {
      for (const id of Object.keys(saved)) reg[id].draw = saved[id];
    }
    for (const r of recs) {
      g.save();
      g.setTransform(r.m);
      g.globalAlpha = r.alpha;
      try {
        reg[r.id].draw(g, r.o);
      } catch (e) {
        void e;
      }
      g.restore();
    }
  };
  T.decorReplay = decorReplay;
  for (const id of Object.keys(ROOMS)) {
    const cfg = ROOMS[id];
    E(id, (orig) => {
      const layers = orig.layers || [];
      const near = layers[layers.length - 1];
      const rest = layers.slice(0, -1);
      return { ground: roomFloor(cfg), layers: rest.concat([{ depth: near ? near.depth : 0.9, blur: 0, draw: decorReplay(roomWall(cfg), near) }]) };
    });
  }
  T.roomWall = roomWall;
  E(MT.SEWER_TUNNEL, {
    sky: (g, W, H) => {
      g.fillStyle = MT.VALUE_0B0D12;
      g.fillRect(0, 0, W, H);
    },
    layers: [
      {
        depth: 0.85,
        blur: 0,
        draw: (g, x0, x1) => {
          paint(g, rect(x0, -760, x1 - x0, 760), MT.VALUE_4A3E36, { d: 0, ink: false });
          const r = U.rng(4);
          for (let y = -540; y < 0; y += 30) for (let x = x0 + ((y / 30) % 2 ? 30 : 0); x < x1; x += 62) paint(g, rrect(x, y, 58, 26, 4), C.mix(MT.VALUE_7A5A46, MT.VALUE_5A463A, r()), { d: 0, lw: 1.1, inkCol: MT.VALUE_2A2020 });
          const p = P();
          p.rect(x0, -900, x1 - x0, 360);
          for (let x = Math.floor(x0 / 900) * 900; x < x1; x += 900) {
            p.moveTo(x + 900, -540);
            p.ellipse(x + 450, -540, 450, 130, 0, 0, PI, true);
          }
          g.save();
          g.fillStyle = MT.VALUE_1A1612;
          g.fill(p, MT.EVENODD);
          g.restore();
          for (let x = Math.floor(x0 / 700) * 700; x < x1; x += 700) asset(g, MT.PIPE, x + 350, -420, { w: 600 });
          for (let x = Math.floor(x0 / 600) * 600 + 300; x < x1; x += 600) {
            paint(g, rrect(x - 14, -480, 28, 18, 4), MT.VALUE_2A2A2E, { d: 0, lw: 1.2 });
            glowDisc(g, x, -460, 140, MT.FFD89A, 0.35);
            paint(g, ell(x, -458, 9, 7), MT.FFE8B0, { d: 0, ink: false, glow: MT.RGBA_255_220_150_1 });
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H, t) => {
      paint(g, rect(x0, -150, x1 - x0, 22), MT.VALUE_6A5A4A, { d: 0, lw: 1.5 });
      const gr = g.createLinearGradient(0, -128, 0, -32);
      gr.addColorStop(0, MT.VALUE_2F5A50);
      gr.addColorStop(1, MT.VALUE_16302A);
      g.fillStyle = gr;
      g.fillRect(x0, -128, x1 - x0, 98);
      g.strokeStyle = MT.RGBA_180_230_200_0_25;
      g.lineWidth = 3;
      for (let row = 0; row < 4; row++) {
        g.beginPath();
        for (let x = x0; x < x1; x += 30) g.lineTo(x, -112 + row * 22 + Math.sin(x / 50 + (t || 0) * 2 + row) * 3);
        g.stroke();
      }
      paint(g, rect(x0, -30, x1 - x0, H + 40), MT.VALUE_55483C, { d: 0, lw: 1.5 });
      const r = U.rng(9);
      g.fillStyle = MT.RGBA_0_0_0_0_18;
      for (let i = 0; i < (x1 - x0) / 40; i++) g.fillRect(x0 + r() * (x1 - x0), -20 + r() * 200, 30 + r() * 40, 3);
    },
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
