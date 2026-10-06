(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { R, poly } = ME.shapes;
  const asset = (g, id, x, y, o, s = 1) => {
    const a = ME.registry.assets[id];
    if (ME.__recordAssets) ME.__recordAssets.add(id);
    if (!a) return;
    g.save();
    g.translate(x, y);
    if (s !== 1) g.scale(s, s);
    a.draw(g, o || {});
    g.restore();
  };
  ME.drawAsset = asset;
  const TIMES = {
    day: { sky: [MT.VALUE_7FB0D9, MT.CFE3EF], haze: MT.DFE9EF, ambient: 0, ambientColor: MT.VALUE_000000, far: MT.VALUE_9FB4C4, mid: MT.VALUE_8A9AA8, ground: MT.VALUE_8D8A82, road: MT.VALUE_4B4E54, night: false, figure: MT.FLAT, rim: null },
    dusk: { sky: [MT.VALUE_3A4F7A, MT.F0A36A], haze: MT.E7A77A, ambient: 0.22, ambientColor: MT.VALUE_3A2A48, far: MT.VALUE_5D5470, mid: MT.VALUE_4A4258, ground: MT.VALUE_5D5550, road: MT.VALUE_3A3A40, night: false, figure: MT.FLAT, rim: { color: MT.FFB37A, alpha: 0.75 } },
    night: { sky: [MT.VALUE_03070F, MT.VALUE_14223A], haze: MT.VALUE_1D2C46, ambient: 0.58, ambientColor: MT.VALUE_08111F, far: MT.VALUE_0D1626, mid: MT.VALUE_111B2C, ground: MT.VALUE_12161D, road: MT.VALUE_0D1015, night: true, figure: MT.SILHOUETTE, rim: { color: MT.FFCF9A, alpha: 0.8 } },
    interior: { sky: [MT.VALUE_000000, MT.VALUE_000000], haze: MT.VALUE_000, ambient: 0.12, ambientColor: MT.VALUE_1A1410, far: MT.VALUE_000, mid: MT.VALUE_000, ground: MT.VALUE_2A2622, road: MT.VALUE_000, night: false, figure: MT.FLAT, rim: { color: MT.FFD9A8, alpha: 0.55 } },
    interior_dark: { sky: [MT.VALUE_000000, MT.VALUE_000000], haze: MT.VALUE_000, ambient: 0.5, ambientColor: MT.VALUE_06080C, far: MT.VALUE_000, mid: MT.VALUE_000, ground: MT.VALUE_121214, road: MT.VALUE_000, night: true, figure: MT.SILHOUETTE, rim: { color: MT.FFD9A8, alpha: 0.8 } },
  };
  ME.TIMES = TIMES;
  const skyGrad = (g, W, H, tp, extra) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, tp.sky[0]);
    gr.addColorStop(0.75, tp.sky[1]);
    gr.addColorStop(1, tp.haze);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    if (tp.night) {
      const r = U.rng(99);
      for (let i = 0; i < 260; i++) {
        const a = r() * 0.8 + 0.2;
        g.fillStyle = MF.RGBA_230_236_255(`${a * 0.75}`);
        const s = r() < 0.06 ? 2.2 : 1.2;
        g.fillRect(r() * W, r() * H * 0.62, s, s);
      }
    }
    if (extra) extra(g, W, H);
  };
  const skyline = (g, x0, x1, col, minH, maxH, seed, windows, night) => {
    const r = U.rng(seed);
    let x = x0;
    while (x < x1) {
      const w = 60 + r() * 140,
        h = minH + r() * (maxH - minH);
      g.fillStyle = col;
      g.fillRect(x, -h, w + 1, h + 2);
      if (r() < 0.25) g.fillRect(x + w * 0.4, -h - 30 - r() * 60, 6, 40 + r() * 60);
      if (windows && night) {
        for (let wy = -h + 14; wy < -16; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 16) if (r() < 0.22) R(g, wx, wy, 7, 9, 0, r() < 0.5 ? MT.F2C374 : MT.D9A85A);
      }
      x += w + r() * 10;
    }
  };
  const hills = (g, x0, x1, col, amp, base, seed) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x0, 40);
    for (let x = x0; x <= x1 + 40; x += 40) g.lineTo(x, -base - (U.fbm(x / 700, seed) * 0.5 + 0.5) * amp);
    g.lineTo(x1 + 40, 40);
    g.closePath();
    g.fill();
  };
  const sea = (g, x0, x1, col, y0) => {
    const gr = g.createLinearGradient(0, -y0, 0, 40);
    gr.addColorStop(0, col);
    gr.addColorStop(1, C.shade(col, -0.35));
    g.fillStyle = gr;
    g.fillRect(x0, -y0, x1 - x0, y0 + 40);
  };
  const E = (id, name, def) => ME.registerEnvironment(id, Object.assign({ name, category: MT.EXTERIOR, tags: [], width: 3200 }, def));
  E(MT.CITY_STREET, MT.PHO_CO_CHAU_AU, {
    tags: [MT.THANH_PHO, MT.PHAP, MT.PHO, MT.DEM, MT.NGAY],
    width: 4200,
    layers: [
      { depth: 0.12, blur: 2.5, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.25), 220, 520, 3, true, tp.night) },
      { depth: 0.35, blur: 1.2, draw: (g, x0, x1, tp) => skyline(g, x0, x1, tp.far, 300, 640, 7, true, tp.night) },
      {
        depth: 0.8,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(21);
          let x = x0;
          const cols = [MT.D8C7A6, MT.CDB796, MT.E1D3B8, MT.C9B9A0, MT.D3C2A8];
          while (x < x1) {
            const w = 360 + Math.floor(r() * 3) * 60;
            asset(g, MT.BUILDING_HAUSSMANN, x + w / 2, 0, { w, h: 520 + r() * 160, color: tp.night ? C.mix(cols[Math.floor(r() * 5)], MT.VALUE_0B1322, 0.72) : cols[Math.floor(r() * 5)], night: tp.night, seed: Math.floor(r() * 99), litRatio: 0.35 });
            x += w + 14;
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 40, 0, tp.ground);
      R(g, x0, -112, x1 - x0, 6, 0, C.shade(tp.ground, 0.15));
      R(g, x0, -106, x1 - x0, 92, 0, tp.road);
      for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) R(g, x, -62, 80, 5, 0, C.rgba(MT.E9E2CC, tp.night ? 0.25 : 0.6));
      R(g, x0, -14, x1 - x0, 10, 0, C.shade(tp.ground, 0.18));
      R(g, x0, -4, x1 - x0, H, 0, tp.ground);
      for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) R(g, x, -4, 2, H, 0, MT.RGBA_0_0_0_0_08);
    },
    props: (WW) => {
      const out = [];
      for (let x = 200; x < WW; x += 620) out.push({ asset: MT.STREET_LAMP, x, lane: MT.BACK });
      return out;
    },
  });
  E(MT.CITY_MODERN, MT.THANH_PHO_HIEN_DAI, {
    tags: [MT.THANH_PHO, MT.HIEN_DAI],
    width: 4200,
    layers: [
      { depth: 0.15, blur: 2.5, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.3), 300, 800, 5, true, tp.night) },
      {
        depth: 0.6,
        blur: 0.8,
        draw: (g, x0, x1, tp) => {
          const r = U.rng(8);
          let x = x0;
          while (x < x1) {
            const w = 260 + r() * 200;
            asset(g, MT.BUILDING_MODERN, x + w / 2, 0, { w, h: 500 + r() * 600, color: tp.night ? MT.VALUE_141D2B : C.mix(MT.VALUE_5F7488, MT.VALUE_9FB0BF, r()), night: tp.night, seed: Math.floor(r() * 99) });
            x += w + 40;
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 40, 0, C.shade(tp.ground, 0.12));
      R(g, x0, -110, x1 - x0, 100, 0, tp.road);
      for (let x = Math.floor(x0 / 200) * 200; x < x1; x += 200) R(g, x, -62, 110, 5, 0, C.rgba(MT.FFFFFF, 0.5));
      R(g, x0, -10, x1 - x0, H, 0, C.shade(tp.ground, 0.08));
    },
    props: (WW) => Array.from({ length: Math.floor(WW / 700) }, (_, i) => ({ asset: i % 3 === 2 ? MT.TRAFFIC_LIGHT : MT.STREET_LAMP, x: 300 + i * 700, lane: MT.BACK })),
  });
  E(MT.RIVIERA_PROMENADE, MT.BO_BIEN_DIA_TRUNG_HAI_NICE, {
    tags: [MT.BIEN, MT.NICE, MT.PHAP, MT.CO_2],
    width: 4000,
    sky: (g, W, H, tp) => skyGrad(g, W, H, tp),
    layers: [
      { depth: 0.08, blur: 2, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.35), 260, 140, 4) },
      { depth: 0.2, blur: 0, draw: (g, x0, x1, tp) => sea(g, x0, x1, tp.night ? MT.VALUE_0C1A2C : MT.VALUE_2F7AA6, 120) },
      {
        depth: 0.75,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          R(g, x0, -60, x1 - x0, 60, 0, tp.night ? MT.VALUE_1A1E24 : MT.D9CDB3);
          for (let x = Math.floor(x0 / 420) * 420; x < x1; x += 420) asset(g, MT.TREE_PALM, x + 120, -50, { color: tp.night ? MT.VALUE_0F1A12 : MT.VALUE_3D7A3F, seed: x });
          for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) R(g, x, -78, 6, 28, 0, tp.night ? MT.VALUE_20242A : MT.EFE9DC);
          R(g, x0, -82, x1 - x0, 6, 0, tp.night ? MT.VALUE_20242A : MT.EFE9DC);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_1B1D22 : MT.CBBD9F);
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) R(g, x, -150, 2, H + 150, 0, MT.RGBA_0_0_0_0_06);
    },
    props: (WW) => Array.from({ length: Math.floor(WW / 800) }, (_, i) => ({ asset: MT.STREET_LAMP, x: 400 + i * 800, lane: MT.BACK })),
  });
  E(MT.COUNTRYSIDE, MT.DOI_QUE_TRANG_TRAI, {
    tags: [MT.NONG_THON, MT.TRANG_TRAI, MT.DOI],
    width: 3600,
    layers: [
      { depth: 0.08, blur: 2.5, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.35), 320, 160, 2) },
      { depth: 0.3, blur: 1, draw: (g, x0, x1, tp) => hills(g, x0, x1, tp.night ? MT.VALUE_121C18 : MT.VALUE_6F8F5A, 200, 60, 9) },
      {
        depth: 0.65,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          hills(g, x0, x1, tp.night ? MT.VALUE_151F19 : MT.VALUE_7FA064, 60, 10, 13);
          asset(g, MT.FARMHOUSE, (x0 + x1) / 2, -20, { night: tp.night, color: tp.night ? MT.VALUE_2A2A2A : MT.B9A88C });
          for (let x = x0 + 100; x < x1; x += 330) asset(g, (x / 330) % 2 > 1 ? MT.TREE_CYPRESS : MT.TREE_ROUND, x, -14, { color: tp.night ? MT.VALUE_101A12 : MT.VALUE_4A7A3E, seed: x });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_141A14 : MT.VALUE_8A9A5A);
      R(g, x0, -40, x1 - x0, 60, 0, tp.night ? MT.VALUE_1D1A16 : MT.A48A62);
    },
    props: (WW) => [
      { asset: MT.FENCE, x: WW * 0.3, lane: MT.BACK },
      { asset: MT.FENCE, x: WW * 0.3 + 400, lane: MT.BACK },
    ],
  });
  E(MT.FOREST, MT.RUNG_THONG, {
    tags: [MT.RUNG],
    width: 3600,
    layers: [
      {
        depth: 0.12,
        blur: 2.5,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 70) asset(g, MT.TREE_PINE, x, 0, { color: C.mix(tp.night ? MT.VALUE_0B1410 : MT.VALUE_3A5A48, tp.sky[1], 0.35), seed: x }, 1.1 + U.hash(x) * 0.5);
        },
      },
      {
        depth: 0.45,
        blur: 1,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 120) asset(g, MT.TREE_PINE, x, 0, { color: tp.night ? MT.VALUE_0D1712 : MT.VALUE_2C4A36, seed: x }, 1.2 + U.hash(x + 3) * 0.6);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_0F1410 : MT.VALUE_4A5A32);
    },
    props: (WW) => Array.from({ length: Math.floor(WW / 520) }, (_, i) => ({ asset: i % 2 ? MT.BUSH : MT.TREE_PINE, x: 260 + i * 520, lane: MT.BACK })),
  });
  E(MT.JUNGLE, MT.RUNG_NHIET_DOI, {
    tags: [MT.RUNG, MT.NHIET_DOI, MT.DONG_DUONG, MT.CHIEN_TRANH],
    width: 3600,
    layers: [
      {
        depth: 0.12,
        blur: 3,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 140) asset(g, MT.TREE_JUNGLE, x, 0, { color: C.mix(MT.VALUE_2F5A2C, tp.haze, 0.45) }, 1.3);
        },
      },
      {
        depth: 0.45,
        blur: 1.2,
        draw: (g, x0, x1) => {
          for (let x = x0; x < x1; x += 180) asset(g, U.hash(x) > 0.5 ? MT.TREE_PALM : MT.TREE_JUNGLE, x, 0, { color: MT.VALUE_2A4F26, seed: x }, 1.1);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_141A10 : MT.VALUE_3A3A22),
    props: (WW) => Array.from({ length: Math.floor(WW / 300) }, (_, i) => ({ asset: MT.BUSH, x: 150 + i * 300, lane: MT.FRONT, color: MT.VALUE_2F5A2C })),
    fog: 0.35,
  });
  E(MT.DESERT_ROAD, MT.DUONG_SA_MAC, {
    tags: [MT.SA_MAC, MT.DUONG],
    width: 4000,
    layers: [
      { depth: 0.1, blur: 2, draw: (g, x0, x1, tp) => asset(g, MT.MOUNTAIN, (x0 + x1) / 2, 0, { color: C.mix(MT.B07A52, tp.sky[1], 0.4) }, (x1 - x0) / 1400) },
      { depth: 0.4, blur: 0.8, draw: (g, x0, x1, tp) => hills(g, x0, x1, tp.night ? MT.VALUE_2A2018 : MT.D0A46C, 80, 0, 5) },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_2A2018 : MT.D9B07A);
      R(g, x0, -110, x1 - x0, 100, 0, tp.road);
      for (let x = Math.floor(x0 / 220) * 220; x < x1; x += 220) R(g, x, -62, 110, 5, 0, MT.E6D36A);
    },
  });
  E(MT.MOUNTAIN_ROAD, MT.DUONG_NUI, {
    tags: [MT.NUI, MT.DUONG],
    width: 4000,
    layers: [
      { depth: 0.06, blur: 2, draw: (g, x0, x1, tp) => asset(g, MT.MOUNTAIN, (x0 + x1) / 2, 0, { color: C.mix(MT.VALUE_6A7A8A, tp.sky[1], 0.35), snow: true }, (x1 - x0) / 1400) },
      {
        depth: 0.3,
        blur: 1,
        draw: (g, x0, x1, tp) => {
          hills(g, x0, x1, tp.night ? MT.VALUE_101814 : MT.VALUE_4A6A4A, 260, 40, 3);
          for (let x = x0; x < x1; x += 90) asset(g, MT.TREE_PINE, x, -60 - U.hash(x) * 120, { color: tp.night ? MT.VALUE_0B120E : MT.VALUE_2C4A36 }, 0.6);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 40, 0, tp.night ? MT.VALUE_141A14 : MT.VALUE_5A6A4A);
      R(g, x0, -110, x1 - x0, 100, 0, tp.road);
      R(g, x0, -122, x1 - x0, 12, 0, MT.VALUE_9A9A9A);
      R(g, x0, -10, x1 - x0, H, 0, tp.night ? MT.VALUE_141A14 : MT.VALUE_5A6A4A);
    },
  });
  E(MT.HARBOR, MT.BEN_CANG, {
    tags: [MT.CANG, MT.BIEN, MT.TAU],
    width: 4200,
    layers: [
      { depth: 0.1, blur: 2, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.3), 180, 80, 6) },
      {
        depth: 0.3,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          sea(g, x0, x1, tp.night ? MT.VALUE_0A1828 : MT.VALUE_2A6A8A, 70);
          asset(g, MT.SHIP, x0 + (x1 - x0) * 0.35, -10, { night: tp.night }, 0.7);
          asset(g, MT.SAILBOAT, x0 + (x1 - x0) * 0.7, -20, {}, 0.6);
        },
      },
      {
        depth: 0.7,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 900) {
            R(g, x, -520, 18, 520, 0, MT.C8902A);
            R(g, x - 160, -520, 340, 16, 0, MT.C8902A);
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_16181C : MT.VALUE_7A7A76);
      R(g, x0, -150, x1 - x0, 8, 0, MT.C9B04A);
    },
    props: (WW) => [
      { asset: MT.CRATE, x: WW * 0.25, lane: MT.BACK },
      { asset: MT.BARREL, x: WW * 0.25 + 120, lane: MT.BACK },
      { asset: MT.CRATE, x: WW * 0.6, lane: MT.BACK },
    ],
  });
  E(MT.AIRPORT, MT.SAN_BAY_2, {
    tags: [MT.SAN_BAY, MT.MAY_BAY],
    width: 5000,
    layers: [
      { depth: 0.1, blur: 2, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.4), 120, 20, 8) },
      {
        depth: 0.4,
        blur: 0.8,
        draw: (g, x0, x1, tp) => {
          asset(g, MT.CONTROL_TOWER, x0 + (x1 - x0) * 0.3, 0, { color: tp.night ? MT.VALUE_2A2E34 : MT.D7D9DC });
          R(g, x0 + (x1 - x0) * 0.45, -160, 900, 160, 0, tp.night ? MT.VALUE_1A1E24 : MT.B9BEC4);
          for (let i = 0; i < 12; i++) R(g, x0 + (x1 - x0) * 0.45 + 20 + i * 72, -130, 50, 60, 0, tp.night ? MT.E9C27A : MT.VALUE_5F7F99);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_141818 : MT.VALUE_6F7D5F);
      R(g, x0, -110, x1 - x0, 110, 0, MT.VALUE_3A3D42);
      for (let x = Math.floor(x0 / 200) * 200; x < x1; x += 200) R(g, x, -58, 100, 5, 0, MT.E9E6DC);
    },
    lightsStatic: (WW, tp) => (tp.night ? Array.from({ length: Math.floor(WW / 120) }, (_, i) => ({ type: MT.GLOW, x: i * 120, y: -4, r: 14, color: i % 2 ? MT.VALUE_4AA3FF : MT.FFD36A, alpha: 0.9 })) : []),
  });
  E(MT.HIGHWAY, MT.DUONG_CAO_TOC, {
    tags: [MT.DUONG, MT.XE],
    width: 5000,
    layers: [
      { depth: 0.1, blur: 2, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.4), 120, 360, 12, true, tp.night) },
      {
        depth: 0.5,
        blur: 0.5,
        draw: (g, x0, x1, tp) => {
          for (let x = x0; x < x1; x += 260) asset(g, MT.TREE_ROUND, x, 0, { color: tp.night ? MT.VALUE_0E1612 : MT.VALUE_4A6A3A }, 0.6);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, 12, 0, MT.A0A4A8);
      R(g, x0, -138, x1 - x0, 130, 0, tp.road);
      for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) R(g, x, -76, 130, 5, 0, MT.E9E6DC);
      R(g, x0, -8, x1 - x0, H, 0, tp.night ? MT.VALUE_121612 : MT.VALUE_5A6A4A);
    },
  });
  E(MT.COURTYARD, MT.SAN_TRONG_TOA_NHA, {
    tags: [MT.SAN, MT.TOA_AN_2, MT.TAU_THOAT],
    width: 3000,
    layers: [
      { depth: 0.3, blur: 1, draw: (g, x0, x1, tp) => skyline(g, x0, x1, tp.far, 400, 700, 31, true, tp.night) },
      {
        depth: 0.85,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          asset(g, MT.COURTHOUSE, (x0 + x1) / 2, 0, { color: tp.night ? MT.VALUE_2A2A2C : MT.D9D2C2 }, 0.95);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_16181C : MT.VALUE_9C958A);
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) R(g, x, -150, 2, H + 150, 0, MT.RGBA_0_0_0_0_1);
    },
  });
  E(MT.OPEN_SEA, MT.BIEN_KHOI, {
    tags: [MT.BIEN],
    width: 4000,
    layers: [{ depth: 0.05, blur: 1, draw: (g, x0, x1, tp) => sea(g, x0, x1, tp.night ? MT.VALUE_08162A : MT.VALUE_2A6F9A, 60) }],
    ground: (g, x0, x1, tp, H, t) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, tp.night ? MT.VALUE_0A1A2E : MT.VALUE_2F7AA6);
      gr.addColorStop(1, tp.night ? MT.VALUE_030812 : MT.VALUE_123A56);
      g.fillStyle = gr;
      g.fillRect(x0, -150, x1 - x0, H + 150);
      g.strokeStyle = MT.RGBA_255_255_255_0_18;
      g.lineWidth = 2;
      for (let row = 0; row < 8; row++) {
        g.beginPath();
        for (let x = x0; x < x1; x += 30) g.lineTo(x, -140 + row * 40 + Math.sin(x / 60 + (t || 0) * 1.6 + row) * 4);
        g.stroke();
      }
    },
  });
  E(MT.SEWER_TUNNEL, MT.DUONG_CONG_NGAM, {
    category: MT.UNDERGROUND,
    lanes: [MT.FRONT, MT.FORE],
    tags: [MT.CONG, MT.DUONG_HAM, MT.NGAM],
    width: 3600,
    time: MT.INTERIOR_DARK,
    sky: (g, W, H) => {
      g.fillStyle = MT.VALUE_07090B;
      g.fillRect(0, 0, W, H);
    },
    layers: [
      {
        depth: 0.85,
        blur: 0,
        draw: (g, x0, x1) => {
          R(g, x0, -560, x1 - x0, 560, 0, MT.VALUE_2A2620);
          const r = U.rng(4);
          for (let y = -540; y < 0; y += 26) for (let x = x0 + ((y / 26) % 2) * 30; x < x1; x += 60) R(g, x, y, 56, 22, 2, C.mix(MT.VALUE_3A332A, MT.VALUE_2A241E, r()));
          g.fillStyle = MT.VALUE_0D0C0A;
          g.beginPath();
          g.moveTo(x0, -560);
          for (let x = x0; x <= x1; x += 40) g.lineTo(x, -560 - Math.sin(((x - x0) / (x1 - x0)) * PI) * 0);
          g.lineTo(x1, -760);
          g.lineTo(x0, -760);
          g.fill();
          for (let x = Math.floor(x0 / 700) * 700; x < x1; x += 700) asset(g, MT.PIPE, x + 350, -420, { w: 600 });
        },
      },
    ],
    ground: (g, x0, x1, tp, H, t) => {
      R(g, x0, -150, x1 - x0, 20, 0, MT.VALUE_3A342A);
      R(g, x0, -130, x1 - x0, 100, 0, MT.VALUE_0F1612);
      R(g, x0, -30, x1 - x0, H, 0, MT.VALUE_2E2A22);
      const gr = g.createLinearGradient(0, -130, 0, -30);
      gr.addColorStop(0, MT.VALUE_1D2A24);
      gr.addColorStop(1, MT.VALUE_0A100D);
      g.fillStyle = gr;
      g.fillRect(x0, -128, x1 - x0, 96);
      g.strokeStyle = MT.RGBA_160_200_170_0_12;
      g.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        g.beginPath();
        for (let x = x0; x < x1; x += 30) g.lineTo(x, -110 + row * 22 + Math.sin(x / 50 + (t || 0) * 2 + row) * 3);
        g.stroke();
      }
    },
    fog: 0.25,
  });
  E(MT.UNDERGROUND_SECTION, MT.MAT_CAT_LONG_DAT_PHO_CONG_HAM, {
    category: MT.UNDERGROUND,
    params: { tunnelProgress: MT.DUONG_HAM_TU_CONG_TOI_HAM_KET_0, opened: MT.TI_LE_HOP_KET_DA_MO_0_1, bankName: MT.TEN_NGAN_HANG_TREN_MAT_TIEN },
    frame: { zoom: 0.92, x: 1000 },
    tags: [MT.MAT_CAT, MT.DUONG_HAM, MT.HAM, MT.CONG, MT.SO_DO],
    width: 2400,
    base: 0,
    time: MT.INTERIOR,
    sky: (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, MT.VALUE_0B1424);
      gr.addColorStop(1, MT.VALUE_1A2A44);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    },
    layers: [],
    ground: (g, x0, x1, tp, H, t, p) => {
      p = p || {};
      const streetY = -620;
      for (let x = Math.floor(x0 / 420) * 420; x < x1; x += 420) asset(g, MT.BUILDING_HAUSSMANN, x + 200, streetY, { w: 400, h: 420, color: MT.VALUE_2A3140, night: true, seed: x }, 1);
      asset(g, MT.BANK_FACADE, 1500, streetY, { color: MT.VALUE_3A3E48, text: p.bankName || "" }, 0.8);
      R(g, x0, streetY, x1 - x0, 24, 0, MT.VALUE_3A3D44);
      const gr = g.createLinearGradient(0, streetY + 24, 0, H);
      gr.addColorStop(0, MT.VALUE_5A4632);
      gr.addColorStop(1, MT.VALUE_2A2016);
      g.fillStyle = gr;
      g.fillRect(x0, streetY + 24, x1 - x0, H - streetY);
      const r = U.rng(12);
      for (let i = 0; i < 160; i++) {
        g.fillStyle = MF.RGBA_0_0_0(`${0.08 + r() * 0.12}`);
        g.beginPath();
        g.ellipse(x0 + r() * (x1 - x0), streetY + 60 + r() * 900, 6 + r() * 30, 3 + r() * 8, 0, 0, PI * 2);
        g.fill();
      }
      for (let k = 0; k < 5; k++) {
        g.strokeStyle = MT.RGBA_0_0_0_0_18;
        g.lineWidth = 2;
        g.beginPath();
        for (let x = x0; x < x1; x += 40) g.lineTo(x, streetY + 120 + k * 150 + U.fbm(x / 400, k) * 30);
        g.stroke();
      }
      const sx = p.sewerX || 500,
        sy = p.sewerY || -260;
      g.fillStyle = MT.VALUE_1A1A18;
      g.beginPath();
      g.arc(sx, sy, 110, 0, PI * 2);
      g.fill();
      g.strokeStyle = MT.VALUE_7A6A58;
      g.lineWidth = 12;
      g.stroke();
      g.fillStyle = MT.VALUE_2A4A3A;
      g.beginPath();
      g.arc(sx, sy, 98, 0.15 * PI, 0.85 * PI);
      g.fill();
      const vx = p.vaultX || 1500,
        vy = p.vaultY || -330;
      R(g, vx - 230, vy - 200, 460, 230, 0, MT.VALUE_6D7176);
      R(g, vx - 210, vy - 180, 420, 190, 0, MT.VALUE_1C1E22);
      ME.drawAsset(g, MT.SAFE_DEPOSIT_WALL, vx, vy + 4, { w: 400, h: 170, opened: p.opened || 0 }, 1);
      const prog = U.clamp(p.tunnelProgress == null ? U.clamp((t || 0) / 6) : p.tunnelProgress);
      const tx0 = sx + 100,
        tx1 = vx - 40;
      const ty = sy + 40;
      const endX = U.lerp(tx0, tx1, prog);
      g.fillStyle = MT.VALUE_120E0A;
      g.beginPath();
      g.moveTo(tx0, ty - 26);
      g.lineTo(endX, ty - 26 + (vy + 30 - ty) * prog * 0);
      g.lineTo(endX, ty + 26);
      g.lineTo(tx0, ty + 26);
      g.fill();
      if (prog >= 0.98) {
        R(g, tx1 - 30, vy + 10, 60, ty - vy, 0, MT.VALUE_120E0A);
      }
      g.strokeStyle = MT.RGBA_255_190_120_0_8;
      g.setLineDash([10, 8]);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(tx0, ty);
      g.lineTo(tx1, ty);
      g.lineTo(tx1, vy + 30);
      g.stroke();
      g.setLineDash([]);
      if (prog > 0 && prog < 0.98) ME.glow(g, endX, ty, 70, MT.FFB070, 0.45);
    },
  });
  const wallTex = (g, x0, x1, top, col, seed) => {
    R(g, x0, top, x1 - x0, -top, 0, col);
    const r = U.rng(seed);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = MF.RGBA_0_0_0(`${0.03 + r() * 0.05}`);
      g.fillRect(x0 + r() * (x1 - x0), top + r() * -top, 80 + r() * 200, 2 + r() * 40);
    }
    R(g, x0, -26, x1 - x0, 26, 0, C.shade(col, -0.3));
  };
  const floor = (col, lines) => (g, x0, x1, tp, H) => {
    const gr = g.createLinearGradient(0, -150, 0, H * 0.6);
    gr.addColorStop(0, C.shade(col, -0.05));
    gr.addColorStop(0.3, C.shade(col, 0.06));
    gr.addColorStop(1, C.shade(col, -0.35));
    g.fillStyle = gr;
    g.fillRect(x0, -150, x1 - x0, H + 150);
    if (lines) {
      g.strokeStyle = MT.RGBA_0_0_0_0_15;
      g.lineWidth = 2;
      for (let x = Math.floor(x0 / lines) * lines; x < x1; x += lines) {
        g.beginPath();
        g.moveTo(x, -150);
        g.lineTo(x + (x - (x0 + x1) / 2) * 0.35, H);
        g.stroke();
      }
    }
  };
  const I = (id, name, def) =>
    E(
      id,
      name,
      Object.assign(
        {
          category: MT.INTERIOR,
          time: MT.INTERIOR,
          width: 2400,
          sky: (g, W, H) => {
            g.fillStyle = MT.VALUE_0C0B0A;
            g.fillRect(0, 0, W, H);
          },
        },
        def,
      ),
    );
  I(MT.BANK_VAULT, MT.HAM_KET_SAT_NGAN_HANG_TUONG_HOP_KY, {
    tags: [MT.NGAN_HANG, MT.HAM, MT.KET_SAT],
    params: { opened: MT.TI_LE_HOP_KET_TREN_TUONG_DA_BI, doorOpen: MT.CUA_HAM_MO_0_1, welded: MT.CUA_BI_HAN_KIN },
    width: 2600,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1, tp, p) => {
          wallTex(g, x0, x1, -760, MT.VALUE_6F6A60, 3);
          for (let x = Math.floor(x0 / 640) * 640 + 320; x < x1; x += 640) {
            if (Math.abs(x - 1300) < 200) continue;
            asset(g, MT.SAFE_DEPOSIT_WALL, x, -40, { w: 600, h: 620, opened: (p && p.opened) || 0, seed: x });
          }
          asset(g, MT.VAULT_DOOR, 1300, -40, { open: (p && p.doorOpen) || 0, welded: p && p.welded });
        },
      },
    ],
    ground: floor(MT.VALUE_5A5650, 0),
    ambient: { day: 0.15 },
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 520) }, (_, i) => ({ type: MT.LAMP, x: 260 + i * 520, y: -880, len: 900, color: MT.FFF0D0, alpha: 0.18 })),
  });
  I(MT.BANK_LOBBY, MT.SANH_NGAN_HANG, {
    tags: [MT.NGAN_HANG, MT.SANH],
    width: 2600,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.D9D0BF, 7);
          for (let x = Math.floor(x0 / 360) * 360; x < x1; x += 360) {
            R(g, x, -900, 50, 860, 0, MT.E9E2D2);
            R(g, x, -900, 10, 860, 0, MT.C9C0AD);
          }
          for (let x = Math.floor(x0 / 720) * 720 + 180; x < x1; x += 720) {
            R(g, x, -860, 230, 300, 115, MT.B9C9D4);
            R(g, x + 12, -848, 206, 288, 103, MT.D8E4EA);
            R(g, x + 113, -860, 4, 300, 0, MT.C9C0AD);
          }
          R(g, x0, -260, x1 - x0, 220, 0, MT.VALUE_5A3A26);
          for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) R(g, x + 10, -240, 140, 180, 4, MT.VALUE_64432C);
          R(g, x0, -278, x1 - x0, 20, 0, MT.E6E0D4);
          R(g, x0, -282, x1 - x0, 5, 0, MT.B8AE9C);
          for (let x = Math.floor(x0 / 300) * 300 + 20; x < x1; x += 300) {
            R(g, x, -560, 260, 282, 0, MT.RGBA_200_220_228_0_35);
            R(g, x, -560, 260, 8, 0, MT.C9A24A);
            R(g, x, -560, 8, 282, 0, MT.C9A24A);
            R(g, x + 252, -560, 8, 282, 0, MT.C9A24A);
            R(g, x + 90, -330, 80, 26, 3, MT.VALUE_2A2A2A);
            R(g, x + 70, -620, 120, 40, 4, MT.VALUE_1F2A44);
            ME.text(g, String((Math.round(x / 300) % 9) + 1), x + 130, -593, { size: 26, weight: 700, align: MT.CENTER, color: MT.E8D9A8, shadow: false });
          }
          const cx = (x0 + x1) / 2;
          g.fillStyle = MT.C9A24A;
          g.beginPath();
          g.arc(cx, -760, 46, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = MT.F4EFE2;
          g.beginPath();
          g.arc(cx, -760, 38, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = MT.VALUE_222;
          g.lineWidth = 4;
          g.beginPath();
          g.moveTo(cx, -760);
          g.lineTo(cx, -788);
          g.moveTo(cx, -760);
          g.lineTo(cx + 20, -752);
          g.stroke();
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      floor(MT.CFC6B4, 0)(g, x0, x1, tp, H);
      for (let y = -150, row = 0; y < H; row++) {
        const h = 26 + row * 9;
        for (let x = Math.floor(x0 / 140) * 140 + (row % 2) * 70; x < x1; x += 140) {
          g.fillStyle = MT.RGBA_60_50_40_0_13;
          g.fillRect(x, y, 70, h);
        }
        y += h;
      }
    },
    props: (WW) => [
      { asset: MT.PLANT_POT, x: WW * 0.12, lane: MT.BACK },
      { asset: MT.PLANT_POT, x: WW * 0.88, lane: MT.BACK },
      { asset: MT.BENCH, x: WW * 0.25, lane: MT.MID },
    ],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 650) }, (_, i) => ({ type: MT.LAMP, x: 325 + i * 650, y: -880, len: 900, color: MT.FFF2D6, alpha: 0.14 })),
  });
  I(MT.PHOTO_STUDIO, MT.STUDIO_ANH_2, {
    tags: [MT.STUDIO, MT.NHIEP_ANH],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_3D3A36, 9);
          asset(g, MT.PHOTO_BACKDROP, 1200, -10, { color: MT.VALUE_7D8F86 }, 1.6);
          for (let x = 300; x < x1; x += 700) asset(g, MT.PICTURE_FRAME, x, -520, { color: MT.VALUE_5A6A7A });
        },
      },
    ],
    ground: floor(MT.VALUE_4A3A2C, 120),
    props: () => [
      { asset: MT.STUDIO_LIGHT, x: 760, lane: MT.BACK },
      { asset: MT.STUDIO_LIGHT, x: 1640, lane: MT.BACK },
      { asset: MT.CAMERA_TRIPOD, x: 900, lane: MT.MID },
    ],
  });
  I(MT.OFFICE, MT.VAN_PHONG_THAM_PHAN_DIEU_TRA, {
    tags: [MT.VAN_PHONG, MT.TOA_AN_2, MT.THAM_PHAN],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1, tp, p) => {
          wallTex(g, x0, x1, -760, MT.VALUE_8A7A62, 11);
          R(g, x0, -380, x1 - x0, 10, 0, MT.VALUE_5A4A36);
          asset(g, MT.WINDOW, 1500, -360, { night: p && p.night, open: p && p.windowOpen }, 1.6);
          asset(g, MT.BOOKSHELF, 500, -40, {}, 1.4);
          asset(g, MT.PICTURE_FRAME, 1000, -560, {});
        },
      },
    ],
    ground: floor(MT.VALUE_5A3E2A, 110),
    props: () => [
      { asset: MT.DESK, x: 1000, lane: MT.MID },
      { asset: MT.CHAIR, x: 1150, lane: MT.MID },
      { asset: MT.DESK_LAMP, x: 920, lane: MT.MID, y: -96 },
    ],
  });
  I(MT.PRISON_CELL, MT.PHONG_GIAM, {
    tags: [MT.NHA_TU],
    time: MT.INTERIOR_DARK,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_5C5A56, 13);
          R(g, 1150, -720, 160, 110, 0, MT.VALUE_9AB0C4);
          for (let i = 0; i < 4; i++) R(g, 1165 + i * 40, -720, 8, 110, 0, MT.VALUE_2A2A2A);
        },
      },
    ],
    ground: floor(MT.VALUE_3A3936, 0),
    props: () => [{ asset: MT.BED, x: 700, lane: MT.BACK }],
    front: (g, x0, x1) => asset(g, MT.PRISON_BARS, (x0 + x1) / 2, 0, { w: x1 - x0 }, 1),
    lightsStatic: () => [{ type: MT.SHAFT, x: 1230, y: -665, w: 160, h: 110, len: 900, angle: 1.0, color: MT.CFE0FF, alpha: 0.2 }],
  });
  I(MT.COURTROOM, MT.PHONG_XU_AN, {
    tags: [MT.TOA_AN_2],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_6A4A32, 15);
          for (let x = Math.floor(x0 / 200) * 200; x < x1; x += 200) R(g, x, -900, 8, 860, 0, MT.VALUE_4A3020);
          R(g, 900, -360, 700, 320, 0, MT.VALUE_4A2E1C);
          R(g, 880, -380, 740, 26, 0, MT.VALUE_3A2414);
          asset(g, MT.FLAG, 1700, -40, { colors: [MT.VALUE_1F3F8A, MT.F1F1F1, MT.C8102E] });
        },
      },
    ],
    ground: floor(MT.VALUE_4A3424, 0),
  });
  I(MT.HOME_INTERIOR, MT.PHONG_KHACH, {
    tags: [MT.NHA, MT.GIA_DINH],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1, tp, p) => {
          wallTex(g, x0, x1, -760, MT.B9A487, 17);
          asset(g, MT.WINDOW, 1500, -330, { night: p && p.night }, 1.4);
          asset(g, MT.PICTURE_FRAME, 800, -520, {});
          asset(g, MT.WALL_CLOCK, 1100, -560, {});
        },
      },
    ],
    ground: floor(MT.VALUE_6A4A32, 120),
    props: () => [
      { asset: MT.SOFA, x: 900, lane: MT.BACK },
      { asset: MT.PLANT_POT, x: 1250, lane: MT.BACK },
      { asset: MT.TV_OLD, x: 560, lane: MT.BACK, y: 0 },
    ],
  });
  I(MT.WAREHOUSE_INTERIOR, MT.NHA_KHO_XUONG, {
    tags: [MT.NHA_KHO_2, MT.XUONG, MT.BI_MAT],
    time: MT.INTERIOR_DARK,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.VALUE_3E4448, 19);
          for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) R(g, x, -900, 14, 860, 0, MT.VALUE_2A2E32);
        },
      },
    ],
    ground: floor(MT.VALUE_2E3034, 0),
    props: (WW) => [
      { asset: MT.CRATE, x: WW * 0.3, lane: MT.BACK },
      { asset: MT.CRATE, x: WW * 0.3 + 104, lane: MT.BACK },
      { asset: MT.BARREL, x: WW * 0.7, lane: MT.BACK },
    ],
    lightsStatic: (WW) => [{ type: MT.LAMP, x: WW * 0.5, y: -860, len: 900, color: MT.FFE6B0, alpha: 0.32 }],
  });
  E(MT.ABSTRACT_DARK, MT.NEN_TOI_DIEN_ANH_CHO_CHU, {
    category: MT.ABSTRACT,
    tags: [MT.NEN_2, MT.CHU],
    width: 2400,
    time: MT.INTERIOR,
    sky: (g, W, H) => {
      const gr = g.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      gr.addColorStop(0, MT.VALUE_1D2533);
      gr.addColorStop(1, MT.VALUE_05070B);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    },
    layers: [],
    ground: () => {},
    dust: 1,
  });
  E(MT.NIGHT_SKY, MT.BAU_TROI_DEM, {
    category: MT.ABSTRACT,
    tags: [MT.DEM, MT.TROI],
    width: 2400,
    time: MT.NIGHT,
    ownMoon: true,
    layers: [{ depth: 0.05, blur: 0, draw: (g, x0, x1) => asset(g, MT.MOON, x0 + (x1 - x0) * 0.7, -700, {}) }],
    ground: (g, x0, x1, tp, H) => R(g, x0, 0, x1 - x0, H, 0, MT.VALUE_05080E),
  });
  ME.kit = Object.assign(ME.kit || {}, { asset, skyline, hills, sea, wallTex, floor, skyGrad, E, I });
  const stubCtx = () => {
    const grad = { addColorStop() {} };
    const store = { canvas: { width: 1, height: 1 } };
    return new Proxy(store, {
      get: (t, k) => {
        if (k in t) return t[k];
        if (k === MT.MEASURETEXT) return () => ({ width: 10 });
        if (k === MT.GETTRANSFORM) return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
        if (k === MT.GETIMAGEDATA || k === MT.CREATEIMAGEDATA) return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
        return () => grad;
      },
      set: (t, k, v) => {
        t[k] = v;
        return true;
      },
    });
  };
  ME.envBuiltins = (envId) => {
    const env = ME.registry.environments[envId];
    if (!env) return [];
    if (env.__builtins) return env.__builtins;
    const seen = new Set();
    const W = env.width || 3200;
    const tp = TIMES[env.time || MT.DAY] || TIMES.day;
    const g = stubCtx();
    ME.__recordAssets = seen;
    try {
      for (const L of env.layers || []) {
        try {
          L.draw(g, 0, W, tp, {});
        } catch (e) {
          void e;
        }
      }
      try {
        if (env.ground) env.ground(g, 0, W, tp, 600, 0, {});
      } catch (e) {
        void e;
      }
      try {
        if (env.front) env.front(g, 0, W, tp);
      } catch (e) {
        void e;
      }
      try {
        for (const it of env.props ? env.props(W, tp) : []) seen.add(it.asset);
      } catch (e) {
        void e;
      }
    } finally {
      ME.__recordAssets = null;
    }
    env.__builtins = Array.from(seen);
    return env.__builtins;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
