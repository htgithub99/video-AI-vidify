(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const K = ME.T3;
  if (!K || !K.ok || !K.EXT) return;
  const T = K.T;
  const C = ME.color;
  const PI = Math.PI;
  const { mesh, box, cyl, sph, cone, mat, group } = K;
  const X = K.EXT;
  const H = (fn) => (headG, o) => fn(headG, o.headR, o.headR * 0.85, o);
  const hc = (o, def) => (o.ch.colors && o.ch.colors.hat) || def;
  const ac = (o, def) => (o.ch.colors && o.ch.colors.accent) || def;
  X.hats.nemes = H((g, h, c, o) => {
    const gold = hc(o, MT.D9B04A);
    g.add(mesh(sph(1, 18), gold, -h * 0.05, c + h * 0.12, 0, { sx: h * 1.1, sy: h * 1.0, sz: h * 1.1 }));
    g.add(mesh(box(h * 0.35, h * 1.9, h * 1.5), gold, -h * 0.75, c - h * 0.85, 0));
    for (const z of [h * 0.98, -h * 0.98]) g.add(mesh(box(h * 0.55, h * 1.7, h * 0.14), gold, -h * 0.05, c - h * 0.8, z));
    for (let i = 0; i < 4; i++) g.add(mesh(cyl(h * 1.12, h * 1.12, h * 0.07, 20), MT.VALUE_2A4F8F, -h * 0.05, c + h * (0.45 - i * 0.28), 0));
    g.add(mesh(sph(h * 0.12, 8), MT.E2B33A, h * 1.05, c + h * 0.6, 0));
  });
  X.hats.roman_helmet = H((g, h, c, o) => {
    const m = mat(hc(o, MT.B9BEC4), { m: 0.75, r: 0.35 });
    g.add(mesh(sph(1, 18), m, 0, c + h * 0.15, 0, { sx: h * 1.16, sy: h * 1.05, sz: h * 1.16 }));
    g.add(mesh(box(h * 0.28, h * 0.6, h * 2.1), ac(o, MT.B8322A), 0, c + h * 1.32, 0));
    for (const z of [h * 0.95, -h * 0.95]) g.add(mesh(box(h * 0.6, h * 0.9, h * 0.08), m, h * 0.25, c - h * 0.45, z));
    g.add(mesh(box(h * 0.5, h * 0.12, h * 1.8), m, -h * 1.05, c - h * 0.35, 0, { rz: 0.4 }));
  });
  X.hats.viking_helmet = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_8D949C);
    const m = mat(col, { m: 0.7, r: 0.45 });
    g.add(mesh(sph(1, 18), m, 0, c + h * 0.2, 0, { sx: h * 1.15, sy: h * 1.15, sz: h * 1.15 }));
    g.add(mesh(cyl(h * 1.17, h * 1.17, h * 0.2, 20), mat(C.shade(col, -0.25), { m: 0.7, r: 0.45 }), 0, c + h * 0.35, 0));
    g.add(mesh(box(h * 0.12, h * 0.8, h * 0.16), m, h * 1.12, c - h * 0.05, 0));
  });
  X.hats.kabuto = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_2A2226);
    g.add(mesh(sph(1, 18), mat(col, { r: 0.35 }), 0, c + h * 0.2, 0, { sx: h * 1.18, sy: h * 1.08, sz: h * 1.18 }));
    g.add(mesh(cyl(h * 1.2, h * 1.75, h * 0.7, 20), C.shade(col, 0.12), -h * 0.15, c - h * 0.15, 0));
    for (const r of [0.45, -0.45]) g.add(mesh(box(h * 0.06, h * 1.1, h * 0.12), mat(ac(o, MT.D9A93A), { m: 0.8, r: 0.3 }), h * 1.05, c + h * 1.1, r * h, { rx: r }));
  });
  X.hats.nun_veil = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_1A1A1E);
    g.add(mesh(sph(1, 18), col, -h * 0.08, c + h * 0.08, 0, { sx: h * 1.16, sy: h * 1.14, sz: h * 1.16 }));
    g.add(mesh(box(h * 0.5, h * 2.6, h * 2.0), col, -h * 0.7, c - h * 1.25, 0));
    g.add(mesh(cyl(h * 1.18, h * 1.18, h * 0.22, 22), MT.F2F0EA, 0, c + h * 0.45, 0));
  });
  X.hats.plague_hat = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_1C1A1D);
    g.add(mesh(cyl(h * 1.9, h * 1.9, h * 0.08, 24), col, 0, c + h * 0.65, 0));
    g.add(mesh(cyl(h * 0.92, h * 1.0, h * 1.15, 18), col, 0, c + h * 1.25, 0));
  });
  X.hats.deerstalker = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_8A6A48);
    g.add(mesh(sph(1, 18), col, 0, c + h * 0.3, 0, { sx: h * 1.12, sy: h * 0.92, sz: h * 1.12 }));
    g.add(mesh(box(h * 0.7, h * 0.08, h * 1.1), C.shade(col, -0.1), h * 1.2, c + h * 0.45, 0, { rz: -0.15 }));
    g.add(mesh(box(h * 0.6, h * 0.08, h * 1.0), C.shade(col, -0.1), -h * 1.15, c + h * 0.45, 0, { rz: 0.15 }));
  });
  X.hats.bonnet = H((g, h, c, o) => {
    g.add(mesh(sph(1, 18), hc(o, MT.E8DCC8), -h * 0.2, c + h * 0.2, 0, { sx: h * 1.15, sy: h * 1.15, sz: h * 1.25 }));
    g.add(mesh(cyl(h * 0.06, h * 0.06, h * 1.6, 6), MT.VALUE_7A2A3A, h * 0.35, c - h * 0.65, 0, { rx: PI / 2 }));
  });
  X.hats.laurel = H((g, h, c, o) => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      g.add(mesh(sph(h * 0.2, 6), hc(o, MT.VALUE_5F8A3A), Math.cos(a) * h * 1.02, c + h * 0.5, Math.sin(a) * h * 1.02, { sy: 0.5, cast: false }));
    }
  });
  X.hats.jester_hat = H((g, h, c, o) => {
    const a = hc(o, MT.B8322A),
      b = ac(o, MT.E2B33A);
    g.add(mesh(cyl(h * 1.1, h * 1.1, h * 0.35, 20), b, 0, c + h * 0.55, 0));
    g.add(mesh(cone(h * 0.45, h * 1.5, 12), a, 0, c + h * 1.0, h * 0.9, { rx: 1.1 }));
    g.add(mesh(cone(h * 0.45, h * 1.5, 12), b, 0, c + h * 1.0, -h * 0.9, { rx: -1.1 }));
    g.add(mesh(cone(h * 0.4, h * 1.4, 12), a, 0, c + h * 1.4, 0));
    for (const q of [
      [0, c + h * 1.15, h * 1.6],
      [0, c + h * 1.15, -h * 1.6],
      [0, c + h * 2.1, 0],
    ])
      g.add(mesh(sph(h * 0.16, 8), MT.E8C64A, q[0], q[1], q[2]));
  });
  X.hats.fur_hat = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_6B4A2E);
    g.add(mesh(sph(1, 14), mat(col, { r: 1 }), 0, c + h * 0.45, 0, { sx: h * 1.3, sy: h * 1.0, sz: h * 1.3 }));
    for (const z of [h * 1.0, -h * 1.0]) g.add(mesh(box(h * 0.7, h * 0.9, h * 0.18), mat(C.shade(col, -0.1), { r: 1 }), -h * 0.15, c - h * 0.1, z));
  });
  X.hats.tin_helmet = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_5A6045);
    g.add(mesh(cyl(h * 1.75, h * 1.75, h * 0.08, 24), col, 0, c + h * 0.6, 0));
    g.add(mesh(sph(1, 16), col, 0, c + h * 0.6, 0, { sx: h * 1.0, sy: h * 0.6, sz: h * 1.0 }));
  });
  X.hats.m1_helmet = H((g, h, c, o) => g.add(mesh(sph(1, 18), hc(o, MT.VALUE_4A5034), 0, c + h * 0.15, 0, { sx: h * 1.24, sy: h * 1.08, sz: h * 1.24 })));
  X.hats.pith_helmet = H((g, h, c, o) => {
    const col = hc(o, MT.E3D9BC);
    g.add(mesh(cyl(h * 1.6, h * 1.6, h * 0.08, 24), col, 0, c + h * 0.5, 0));
    g.add(mesh(sph(1, 18), col, 0, c + h * 0.55, 0, { sx: h * 1.05, sy: h * 1.15, sz: h * 1.05 }));
    g.add(mesh(cyl(h * 1.06, h * 1.06, h * 0.14, 20), ac(o, MT.VALUE_8A6A48), 0, c + h * 0.62, 0));
  });
  X.hats.aviator_cap = H((g, h, c, o) => {
    const col = hc(o, MT.VALUE_6A4630);
    g.add(mesh(sph(1, 18), col, -h * 0.05, c + h * 0.08, 0, { sx: h * 1.12, sy: h * 1.12, sz: h * 1.14 }));
    for (const z of [h * 0.4, -h * 0.4]) g.add(mesh(cyl(h * 0.24, h * 0.24, h * 0.15, 14), MT.VALUE_9FC6DC, h * 0.95, c + h * 0.85, z, { rz: PI / 2 - 0.5 }));
  });
  for (const id of [MT.NEMES, MT.NUN_VEIL, MT.KABUTO, MT.ROMAN_HELMET, MT.VIKING_HELMET, MT.M1_HELMET, MT.AVIATOR_CAP, MT.FUR_HAT]) X.hideHair.add(id);
  const longGarment = (len, flare, colFn) => (o) => {
    const l = o.L(o.d.thigh + o.d.shin) * len;
    o.body.add(mesh(cyl(o.chestW * 0.5, o.chestW * flare, l, 16), colFn ? colFn(o) : o.top, 0, -l / 2 + 0.02, 0, { sx: (o.chestD / o.chestW) * 1.15 }));
  };
  for (const id of [MT.TOGA, MT.KIMONO, MT.SHROUD]) X.longSkirt.add(id);
  X.outfits.toga = (o) => {
    longGarment(0.95, 0.78)(o);
    o.torsoG.add(mesh(box(o.chestD * 1.15, o.torsoLen * 1.1, o.chestW * 0.22), (o.ch.colors && o.ch.colors.accent) || MT.VALUE_6A2A6A, 0, o.torsoLen * 0.5, 0, { rx: 0.7 }));
  };
  X.outfits.kimono = (o) => {
    longGarment(0.98, 0.62)(o);
    o.torsoG.add(mesh(cyl(o.chestW * 0.53, o.chestW * 0.53, o.torsoLen * 0.22, 16), (o.ch.colors && o.ch.colors.accent) || MT.C9A23A, 0, o.torsoLen * 0.2, 0, { sx: (o.chestD / o.chestW) * 1.2 }));
  };
  X.outfits.shroud = longGarment(1.06, 0.95);
  X.acc.plague_mask = (o) => o.headG.add(mesh(cone(o.headR * 0.28, o.headR * 1.5, 10), MT.D8C8A0, o.headR * 1.6, o.headR * 0.7, 0, { rz: -PI / 2 - 0.25 }));
  X.acc.spear = (o) => {
    const g = group(mesh(cyl(0.012 * o.s, 0.012 * o.s, 2.1 * o.s, 6), MT.VALUE_6A4A2A, 0, 0, 0), mesh(cone(0.035 * o.s, 0.2 * o.s, 6), mat(MT.B9BEC4, { m: 0.8, r: 0.3 }), 0, 1.13 * o.s, 0));
    g.position.set(0.12 * o.s, o.torsoLen * 0.4, -o.chestW * 0.95);
    o.body.add(g);
  };
  X.acc.lantern_hand = (o) => o.body.add(mesh(box(0.08 * o.s, 0.12 * o.s, 0.08 * o.s), mat(MT.FFD27A, { e: MT.FFB04A, ei: 1.6 }), 0.1 * o.s, -0.05, o.chestW * 0.8, { cast: false }));
  const remat = (rig, fn) =>
    rig.root.traverse((m) => {
      if (!m.isMesh || !m.material) return;
      m.material = fn(m.material.clone(), m);
    });
  X.fx.ghost = (rig) => {
    rig.body.position.y += 0.18;
    remat(rig, (mt, m) => {
      mt.transparent = true;
      mt.opacity = 0.42;
      mt.depthWrite = false;
      mt.color.lerp(new T.Color(MT.DCECFF), 0.6);
      mt.emissive = new T.Color(MT.VALUE_9FD0FF);
      mt.emissiveIntensity = 0.55;
      m.castShadow = false;
      return mt;
    });
  };
  X.fx.shadow = (rig) =>
    remat(rig, (mt) => {
      mt.color = new T.Color(MT.VALUE_050507);
      mt.roughness = 1;
      mt.metalness = 0;
      if (mt.emissive) mt.emissive = new T.Color(MT.VALUE_000000);
      return mt;
    });
  X.fx.mummy = (rig) =>
    remat(rig, (mt) => {
      mt.color = new T.Color(MT.D6C9A2);
      mt.roughness = 1;
      return mt;
    });
  X.fx.skeleton = (rig) =>
    remat(rig, (mt) => {
      mt.color = new T.Color(MT.E8E2D2);
      mt.roughness = 0.7;
      return mt;
    });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
