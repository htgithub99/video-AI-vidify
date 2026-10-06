(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const K = ME.T3;
  if (!K || !K.ok || !K.models) return;
  const T = K.T;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const PX = K.PX;
  const { mesh, box, cyl, sph, cap, ico, cone, mat, group, profile } = K;
  const M = K.models;
  const shade = (c, k) => C.shade(c, k);
  const metal = (c, r = 0.35) => mat(c, { m: 0.75, r });
  const glow = (c, i = 2) => mat(c, { e: c, ei: i });
  const torus = (r, t, a = 10, b = 24) => K.geo(MF.T(`${r.toFixed(3)}`, `${t.toFixed(3)}`, `${a}`, `${b}`), () => new T.TorusGeometry(r, t, a, b));
  const wheelX = (r, w, x, y, z, col) => mesh(cyl(r, r, w, 18), col || MT.VALUE_2A2C30, x, y, z, { rx: PI / 2 });
  const card = (id, params, s = 1) => K.cardFrom2D(id, params || {}, s);
  M.tank = (o) => {
    const col = o.color || MT.VALUE_4B5A3A;
    const g = group();
    for (const z of [1.25, -1.25]) {
      g.add(mesh(box(5.0, 0.8, 0.7), MT.VALUE_22241F, 0, 0.4, z));
      for (let i = 0; i < 6; i++) g.add(wheelX(0.32, 0.72, -2.0 + i * 0.8, 0.38, z, MT.VALUE_3A3D36));
    }
    g.add(
      profile(
        [
          [-2.6, 0.75],
          [-2.3, 1.25],
          [2.3, 1.25],
          [2.7, 0.8],
        ],
        3.2,
        col,
        { bevel: 0.04 },
      ),
    );
    const tur = group(mesh(cyl(1.0, 1.2, 0.65, 8), shade(col, 0.06), 0, 0, 0), mesh(cyl(0.11, 0.13, 3.2, 12), shade(col, -0.3), 1.9, 0.05, 0, { rz: PI / 2 }), mesh(box(0.5, 0.2, 0.5), shade(col, -0.3), -0.3, 0.42, 0.3));
    tur.position.y = 1.58;
    g.add(tur);
    return g;
  };
  M.covered_wagon = (o) => {
    const g = group(mesh(box(3.8, 0.4, 1.6), MT.VALUE_7A5232, -0.1, 1.0, 0));
    const tarp = mesh(cyl(0.95, 0.95, 3.6, 18, true), mat(o.color || MT.ECE2C6, { side: 2 }), -0.1, 1.2, 0, { rz: PI / 2, sz: 0.85 });
    tarp.geometry = K.geo(MT.WAGONTARP, () => new T.CylinderGeometry(0.95, 0.95, 3.6, 18, 1, true, -PI / 2, PI));
    g.add(tarp);
    for (const x of [-1.3, 1.2])
      for (const z of [0.85, -0.85]) {
        const w = group(mesh(torus(0.55, 0.05, 6, 20), MT.VALUE_3A2A1E), mesh(cyl(0.02, 0.02, 1.05, 4), MT.A07A4A, 0, 0, 0), mesh(cyl(0.02, 0.02, 1.05, 4), MT.A07A4A, 0, 0, 0, { rz: PI / 2 }));
        w.position.set(x, 0.6, z);
        w.userData.wheel = 0.6;
        g.add(w);
      }
    g.add(mesh(cyl(0.04, 0.04, 1.6, 6), MT.VALUE_7A5232, 2.4, 0.8, 0, { rz: 1.3 }));
    return g;
  };
  M.horse_carriage = (o) => {
    const col = o.color || MT.VALUE_1F2A44;
    const g = group(mesh(box(2.4, 1.6, 1.5), col, -0.8, 1.6, 0), mesh(box(2.5, 0.12, 1.6), MT.E2B33A, -0.8, 2.45, 0), mesh(box(0.7, 0.6, 1.52), K.glass(!!o.night), -1.2, 1.9, 0), mesh(box(0.7, 0.6, 1.52), K.glass(!!o.night), -0.4, 1.9, 0));
    for (const x of [-1.6, 0.0])
      for (const z of [0.8, -0.8]) {
        const w = group(mesh(torus(0.55, 0.04, 6, 20), metal(MT.E2B33A)));
        w.position.set(x, 0.58, z);
        w.userData.wheel = 0.58;
        g.add(w);
      }
    const h = card(MT.HORSE, o);
    if (h) {
      h.position.x = 1.9;
      g.add(h);
    }
    return g;
  };
  M.excavator = (o) => {
    const col = o.color || MT.E2A22A;
    const g = group(mesh(box(3.4, 0.7, 2.4), MT.VALUE_2A2A2A, 0, 0.35, 0), mesh(box(3.0, 0.6, 2.2), col, 0, 1.0, 0), mesh(box(1.3, 1.3, 1.2), col, -0.3, 1.95, 0.4), mesh(box(1.0, 0.9, 0.05), K.glass(!!o.night), 0.1, 2.0, 1.0));
    const arm = group(mesh(box(2.4, 0.3, 0.3), col, 1.2, 0, 0));
    arm.position.set(0.5, 2.0, -0.3);
    arm.rotation.z = 0.5;
    const fore = group(mesh(box(1.8, 0.25, 0.25), shade(col, -0.1), 0.9, 0, 0), mesh(box(0.6, 0.5, 0.7), MT.VALUE_5A5A5A, 1.9, -0.1, 0));
    fore.position.x = 2.4;
    fore.rotation.z = -1.8;
    arm.add(fore);
    g.add(arm);
    return g;
  };
  M.fighter_jet = (o) => {
    const col = o.color || MT.VALUE_7C8A96;
    const g = group(mesh(cap(0.55, 7.5, 12), col, 0, 0, 0, { rz: PI / 2 }), mesh(cone(0.5, 1.6, 12), col, 4.7, 0, 0, { rz: -PI / 2 }));
    g.add(
      profile(
        [
          [-1.2, -0.05],
          [1.4, -0.05],
          [-0.6, 0.05],
        ],
        7.5,
        shade(col, -0.12),
      ),
    );
    g.add(mesh(box(2.4, 0.08, 7), shade(col, -0.12), -0.6, -0.1, 0));
    g.add(mesh(box(1.2, 1.8, 0.08), shade(col, -0.1), -3.4, 1.0, 0, { rz: -0.4 }));
    g.add(mesh(sph(0.5, 14), K.glass(!!o.night), 2.2, 0.45, 0, { sx: 1.8, sy: 0.7, sz: 0.8 }));
    g.add(mesh(sph(0.35, 10), glow(MT.FFB04A, 3), -4.3, 0, 0, { cast: false }));
    const h = group(g);
    g.position.y = 6;
    return h;
  };
  M.rocket = (o) => {
    const col = o.color || MT.EEF0F2;
    const g = group(mesh(cyl(0.6, 0.6, 5.2, 20), col, 0, 3.6, 0), mesh(cone(0.6, 1.8, 20), MT.C42A2A, 0, 7.1, 0), mesh(cyl(0.45, 0.6, 0.6, 16), MT.VALUE_5A5D62, 0, 0.7, 0), mesh(cyl(0.62, 0.62, 0.15, 20), MT.C42A2A, 0, 4.4, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2;
      g.add(mesh(box(0.08, 1.4, 1.0), MT.C42A2A, Math.cos(a) * 0.75, 1.5, Math.sin(a) * 0.75, { ry: -a }));
    }
    g.add(mesh(cyl(0.22, 0.22, 0.05, 16), K.glass(!!o.night), 0.6, 5.0, 0, { rz: PI / 2 }));
    if (o.launch || o.fire) g.add(mesh(cone(0.55, 2.6, 14), glow(MT.FFB04A, 4), 0, -0.9, 0, { rx: PI, cast: false }));
    return g;
  };
  M.spaceship = (o) => {
    const col = o.color || MT.CFD6DE;
    const g = group(
      profile(
        [
          [-2.6, -0.4],
          [-2.0, 0.4],
          [2.0, 0.3],
          [2.9, 0],
          [2.0, -0.3],
        ],
        1.8,
        col,
        { bevel: 0.05 },
      ),
    );
    g.add(mesh(box(2.2, 0.12, 5.0), shade(col, -0.15), -0.6, -0.05, 0));
    g.add(mesh(sph(0.6, 14), K.glass(true), 1.5, 0.3, 0, { sx: 1.5, sy: 0.5, sz: 0.8 }));
    g.add(mesh(cyl(0.35, 0.35, 0.3, 14), glow(MT.VALUE_6AD0FF, 4), -2.7, 0, 0, { rz: PI / 2, cast: false }));
    const h = group(g);
    g.position.y = 2.2;
    g.userData.bob = 0;
    h.userData.bob = 0.06;
    return h;
  };
  M.ufo = (o) => {
    const g = group(mesh(sph(1.0, 18), mat(MT.A0E6FF, { t: 0.7, r: 0.1 }), 0, 0.3, 0, { sy: 0.7 }), mesh(sph(2.2, 24), metal(o.color || MT.VALUE_9AA3AB), 0, 0, 0, { sy: 0.22 }));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      g.add(mesh(sph(0.12, 8), glow(i % 2 ? MT.FFE36A : MT.VALUE_6AFFB0, 3), Math.cos(a) * 1.9, -0.12, Math.sin(a) * 1.9, { cast: false }));
    }
    if (o.beam) {
      const b = K.lightCone(MT.A0FFBE, 3.2, 1.6, 0.22);
      b.position.y = -0.3;
      b.rotation.z = PI;
      g.add(b);
    }
    const h = group(g);
    g.position.y = 3.6;
    h.userData.bob = 0.12;
    return h;
  };
  M.satellite = () => {
    const g = group(mesh(box(0.8, 0.8, 0.8), metal(MT.E2B33A, 0.25), 0, 0, 0), mesh(box(0.05, 0.7, 1.6), MT.VALUE_2A4A8A, 0, 0, 1.3), mesh(box(0.05, 0.7, 1.6), MT.VALUE_2A4A8A, 0, 0, -1.3), mesh(cone(0.3, 0.3, 14, true), MT.CFD6DE, 0, 0.6, 0, { rx: PI }));
    const h = group(g);
    g.position.y = 4;
    g.userData.spinY = 0.2;
    return h;
  };
  M.submarine = (o) => {
    const col = o.color || MT.VALUE_3A4A52;
    const g = group(mesh(cap(0.7, 4.6, 16), metal(col, 0.5), 0, 0, 0, { rz: PI / 2 }), mesh(box(1.2, 0.9, 0.5), metal(shade(col, -0.1), 0.5), -0.2, 0.9, 0), mesh(cyl(0.04, 0.04, 0.8, 6), MT.VALUE_222, 0.1, 1.7, 0), mesh(box(0.06, 0.9, 0.9), shade(col, -0.2), -3.0, 0, 0));
    const h = group(g);
    g.position.y = 0.6;
    h.userData.bob = 0.04;
    return h;
  };
  M.pirate_ship = (o) => {
    const wood = o.color || MT.VALUE_5A3A22;
    const g = group(
      profile(
        [
          [-5.4, 0.6],
          [-5.6, 2.8],
          [5.6, 2.4],
          [6.4, 2.9],
          [4.6, 0.3],
        ],
        3.0,
        wood,
        { bevel: 0.05 },
      ),
      mesh(box(2.4, 1.0, 3.0), shade(wood, 0.1), -4.4, 3.2, 0),
      mesh(box(11, 0.08, 3.05), MT.C9A23A, 0.2, 2.5, 0),
    );
    for (const [x, h] of [
      [-1.6, 8],
      [2.0, 9.5],
    ]) {
      g.add(mesh(cyl(0.12, 0.15, h, 8), MT.VALUE_3A2A1E, x, 2.6 + h / 2, 0));
      const sail = mesh(box(0.06, h * 0.5, 3.6), mat(o.sailColor || MT.ECE2C6, { side: 2 }), x + 0.1, 2.9 + h * 0.45, 0, { rz: 0.05 });
      g.add(sail);
    }
    g.add(mesh(box(1.2, 0.8, 0.02), MT.VALUE_111, 2.6, 12.4, 0));
    g.userData.bob = 0.08;
    return g;
  };
  M.snowy_pine = (o) => {
    const g = group(mesh(cyl(0.1, 0.14, 1.0, 8), MT.VALUE_3E2C1E, 0, 0.5, 0));
    const col = o.color || MT.VALUE_24402E;
    for (let i = 0; i < 4; i++) {
      g.add(mesh(cone(1.3 - i * 0.24, 1.5, 10), mat(shade(col, i * 0.04), { flat: true }), 0, 1.2 + i * 0.75, 0));
      g.add(mesh(cone(1.0 - i * 0.22, 0.6, 10), mat(MT.F2F6FA, { flat: true }), 0, 1.65 + i * 0.75, 0));
    }
    return g;
  };
  M.planet = (o) => {
    const col = o.color || MT.D8A26A;
    const g = group(mesh(sph(1.5, 32), col, 0, 0, 0));
    if (o.ring !== false) g.add(mesh(torus(2.3, 0.12, 4, 48), mat(MT.E6D2AA, { t: 0.85 }), 0, 0, 0, { rx: PI / 2 - 0.3, sz: 0.25 }));
    const h = group(g);
    g.position.y = 6;
    g.userData.spinY = 0.1;
    return h;
  };
  M.earth = () => {
    const tex = K.canvasTex(MT.EARTHTEX, 256, 128, (g2, w, h) => {
      g2.fillStyle = MT.VALUE_2A6AB0;
      g2.fillRect(0, 0, w, h);
      const r = U.rng(5);
      g2.fillStyle = MT.VALUE_4A9A4A;
      for (let i = 0; i < 14; i++) {
        g2.beginPath();
        g2.ellipse(r() * w, 20 + r() * (h - 40), 10 + r() * 30, 6 + r() * 18, r(), 0, PI * 2);
        g2.fill();
      }
      g2.fillStyle = MT.RGBA_255_255_255_0_5;
      for (let i = 0; i < 20; i++) g2.fillRect(r() * w, r() * h, 20 + r() * 30, 3);
    });
    const m = new T.Mesh(sph(1.6, 32), new T.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    m.castShadow = true;
    const h = group(m);
    m.position.y = 6;
    m.userData.spinY = 0.15;
    return h;
  };
  const stoneMat = (col) =>
    new T.MeshStandardMaterial({
      map: K.canvasTex(MF.STONE(`${col}`), 128, 128, (g2, w, h) => {
        g2.fillStyle = col;
        g2.fillRect(0, 0, w, h);
        g2.strokeStyle = shade(col, -0.25);
        g2.lineWidth = 2;
        for (let y = 0; y < h; y += 16) {
          g2.beginPath();
          g2.moveTo(0, y);
          g2.lineTo(w, y);
          g2.stroke();
          for (let x = (y / 16) % 2 ? 16 : 0; x < w; x += 32) {
            g2.beginPath();
            g2.moveTo(x, y);
            g2.lineTo(x, y + 16);
            g2.stroke();
          }
        }
      }),
      roughness: 0.95,
    });
  const tower = (o, h, r, col) => {
    const sm = stoneMat(col);
    const g = group(new T.Mesh(cyl(r, r * 1.05, h, 18), sm));
    g.children[0].position.y = h / 2;
    g.children[0].castShadow = g.children[0].receiveShadow = true;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      g.add(mesh(box(0.45, 0.6, 0.45), col, Math.cos(a) * r, h + 0.3, Math.sin(a) * r));
    }
    g.add(mesh(cone(r * 1.25, r * 2.2, 18), o.roof || MT.VALUE_3A4A7A, 0, h + 0.6 + r * 1.1, 0));
    for (const y of [h * 0.45, h * 0.7]) g.add(mesh(box(0.1, 0.9, 0.45), o.night ? glow(MT.F2C374, 1.4) : mat(MT.VALUE_1A1A1E), r * 0.98, y, 0, { cast: false }));
    return g;
  };
  M.castle_tower = (o) => tower(o, 9, 1.4, o.color || MT.VALUE_8F8A80);
  M.castle = (o) => {
    const col = o.color || MT.VALUE_8F8A80;
    const sm = stoneMat(col);
    const g = group();
    const wall = new T.Mesh(box(14, 6, 1.6), sm);
    wall.position.set(0, 3, -1);
    wall.castShadow = wall.receiveShadow = true;
    g.add(wall);
    for (let x = -6.8; x <= 6.8; x += 0.9) g.add(mesh(box(0.5, 0.6, 1.6), col, x, 6.3, -1));
    g.add(mesh(cyl(1.4, 1.4, 1.65, 20, true), MT.VALUE_2A1E16, 0, 1.2, -0.2, { rx: PI / 2, sy: 1 }));
    g.add(mesh(box(2.8, 2.6, 0.1), MT.VALUE_3A2A1E, 0, 1.3, -0.15));
    for (const x of [-7.6, 7.6]) {
      const t = tower(o, 9, 1.7, col);
      t.position.set(x, 0, -1);
      g.add(t);
    }
    const keep = tower(o, 13, 2.2, col);
    keep.position.set(0, 0, -6);
    g.add(keep);
    return g;
  };
  M.cottage = (o) => {
    const wall = o.color || MT.C9B08A;
    const g = group(mesh(box(4.2, 2.4, 3.6), wall, 0, 1.2, -1.8));
    const roof = mesh(
      K.geo(MT.COTTAGEROOF, () => new T.CylinderGeometry(0.01, 3.0, 2.0, 4, 1).rotateY(PI / 4)),
      mat(o.roof || MT.A07A3A, { flat: true }),
      0,
      3.4,
      -1.8,
      { sx: 1.0, sz: 0.88 },
    );
    g.add(roof);
    g.add(mesh(box(0.8, 1.6, 0.06), MT.VALUE_5A3A22, 0, 0.8, 0.02));
    for (const x of [-1.4, 1.4]) g.add(mesh(box(0.7, 0.6, 0.06), o.night ? glow(MT.F2C374, 1.4) : K.glass(false), x, 1.5, 0.02));
    g.add(mesh(box(0.4, 1.4, 0.4), MT.VALUE_6A5A4A, 1.2, 4.0, -2.2));
    return g;
  };
  M.saloon = (o) => {
    const wood = o.color || MT.VALUE_9A6A3A;
    const g = group(mesh(box(5.2, 5.0, 5), wood, 0, 2.5, -2.5), mesh(box(5.4, 0.8, 0.12), wood, 0, 5.2, 0.05));
    const sign = K.canvasTex(MF.SALOONSIGN(`${o.sign || MT.EXTRA_2}`), 256, 48, (g2, w, h) => {
      g2.fillStyle = MT.ECE2C6;
      g2.fillRect(0, 0, w, h);
      g2.fillStyle = MT.VALUE_3A1A10;
      g2.font = MT.BOLD_34PX_SERIF;
      g2.textAlign = MT.CENTER;
      g2.fillText(o.sign || MT.SALOON_2, w / 2, 36);
    });
    const sm = new T.Mesh(box(4.0, 0.7, 0.05), new T.MeshStandardMaterial({ map: sign }));
    sm.position.set(0, 4.5, 0.08);
    g.add(sm);
    g.add(mesh(box(5.6, 0.12, 1.4), shade(wood, -0.3), 0, 2.6, 0.7));
    for (const x of [-2.7, 2.7]) g.add(mesh(box(0.14, 2.6, 0.14), shade(wood, -0.3), x, 1.3, 1.35));
    g.add(mesh(box(1.0, 1.2, 0.06), shade(wood, -0.35), 0, 1.2, 0.03));
    for (const x of [-1.8, 1.4]) g.add(mesh(box(0.7, 0.8, 0.05), o.night ? glow(MT.F2C374, 1.4) : mat(MT.VALUE_3A3A3A), x, 3.4, 0.03));
    return g;
  };
  M.palace_gate = (o) => {
    const wall = o.color || MT.B03A2A;
    const roofC = o.roof || MT.D9A83A;
    const g = group(mesh(box(11, 3, 4), MT.VALUE_8A7A6A, 0, 1.5, -2));
    for (const x of [-3, 0, 3]) g.add(mesh(box(1.4, 2.2, 4.1), MT.VALUE_2A1E16, x, 1.1, -2));
    g.add(mesh(box(8.4, 0.6, 3.6), wall, 0, 3.3, -2));
    for (let x = -4; x <= 4; x += 1) g.add(mesh(cyl(0.12, 0.12, 1.4, 10), wall, x, 4.3, -0.4));
    const roof = (y, w, d) =>
      mesh(
        K.geo(MF.PGROOF(`${w}`, `${d}`), () => new T.CylinderGeometry(0.2, 1, 1, 4, 1).rotateY(PI / 4)),
        mat(roofC, { flat: true }),
        0,
        y,
        -2,
        { sx: w * 0.72, sy: 0.9, sz: d * 0.72 },
      );
    g.add(roof(5.4, 9.5, 5));
    g.add(mesh(box(6, 0.5, 3), wall, 0, 6.0, -2));
    g.add(roof(6.7, 7.5, 4));
    return g;
  };
  M.igloo = () => {
    const g = group(
      mesh(
        K.geo(MT.IGLOODOME, () => new T.SphereGeometry(1.6, 20, 12, 0, PI * 2, 0, PI / 2)),
        MT.EEF4FA,
        0,
        0,
        0,
      ),
    );
    g.add(
      mesh(
        K.geo(MT.IGLOODOOR, () => new T.CylinderGeometry(0.55, 0.55, 1.2, 14, 1, false, 0, PI).rotateZ(PI / 2).rotateX(PI / 2)),
        MT.E2EAF2,
        1.5,
        0,
        0,
      ),
    );
    return g;
  };
  M.pyramid = (o) => group(mesh(cone(7, 5.6, 4), mat(o.color || MT.D8B878, { flat: true }), 0, 2.8, 0, { ry: PI / 4 }));
  M.temple_columns = (o) => {
    const col = o.color || MT.E6E0D2;
    const g = group(mesh(box(9.4, 0.4, 4.4), shade(col, -0.1), 0, 0.2, -2), mesh(box(9.0, 0.3, 4.0), shade(col, -0.05), 0, 0.55, -2));
    for (let i = 0; i < 8; i++) for (const z of [-0.3, -3.7]) g.add(mesh(cyl(0.26, 0.3, 4.0, 14), col, -3.6 + i * 1.03, 2.7, z));
    g.add(mesh(box(9.0, 0.5, 4.2), col, 0, 4.95, -2));
    g.add(
      mesh(
        K.geo(MT.TEMPLEPED, () => new T.CylinderGeometry(0.01, 1, 1, 3, 1).rotateX(PI / 2).rotateZ(PI)),
        col,
        0,
        5.6,
        -2,
        { sx: 4.6, sy: 0.8, sz: 2.1 },
      ),
    );
    return g;
  };
  M.well = () => group(mesh(cyl(0.9, 0.9, 1.0, 16), MT.VALUE_8A8378, 0, 0.5, 0), mesh(cyl(0.75, 0.75, 1.02, 16), MT.VALUE_1A1A1E, 0, 0.5, 0), mesh(box(0.1, 1.5, 0.1), MT.VALUE_5A3A22, 0, 1.75, 0.8), mesh(box(0.1, 1.5, 0.1), MT.VALUE_5A3A22, 0, 1.75, -0.8), mesh(cone(1.2, 0.8, 4), mat(MT.VALUE_7A4A2A, { flat: true }), 0, 2.8, 0, { ry: PI / 4 }));
  M.goal_post = () => {
    const w = mat(MT.F4F4F2);
    const g = group(mesh(cyl(0.06, 0.06, 2.44, 8), w, 0, 1.22, 3.66), mesh(cyl(0.06, 0.06, 2.44, 8), w, 0, 1.22, -3.66), mesh(cyl(0.06, 0.06, 7.4, 8), w, 0, 2.44, 0, { rx: PI / 2 }));
    g.add(mesh(box(1.5, 2.44, 7.3), mat(MT.FFFFFF, { t: 0.1 }), -0.75, 1.22, 0, { cast: false }));
    return g;
  };
  M.gravestone = (o) => group(mesh(box(0.2, 0.9, 0.6), o.color || MT.VALUE_8A8A8E, 0, 0.45, 0), mesh(cyl(0.3, 0.3, 0.2, 14), o.color || MT.VALUE_8A8A8E, 0, 0.9, 0, { rz: PI / 2 }));
  M.sandbags = () => {
    const g = group();
    for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) g.add(mesh(cap(0.16, 0.35, 8), MT.B39A6E, 0, 0.16 + row * 0.28, -1.2 + row * 0.3 + i * 0.6, { rx: PI / 2, sx: 1.3 }));
    return g;
  };
  M.cannon = (o) => {
    const g = group(mesh(box(1.0, 0.35, 0.8), MT.VALUE_5A3A22, -0.3, 0.45, 0));
    for (const z of [0.5, -0.5]) {
      const w = wheelX(0.45, 0.1, -0.3, 0.45, z, MT.VALUE_4A2E1A);
      g.add(w);
    }
    g.add(mesh(cyl(0.2, 0.26, 2.0, 16), metal(MT.VALUE_2A2C30, 0.5), 0.5, 0.8, 0, { rz: PI / 2 - 0.18 }));
    if (o.fire) g.add(mesh(sph(0.5, 12), glow(MT.FFB04A, 3), 1.6, 1.0, 0, { cast: false }));
    return g;
  };
  M.stage_speaker = () => group(mesh(box(0.9, 2.4, 0.9), MT.VALUE_1A1A1E, 0, 1.2, 0), mesh(cyl(0.34, 0.34, 0.05, 20), MT.VALUE_2A2A2E, 0.46, 0.8, 0, { rz: PI / 2 }), mesh(cyl(0.18, 0.18, 0.05, 16), MT.VALUE_2A2A2E, 0.46, 1.8, 0, { rz: PI / 2 }));
  M.microphone_stand = () => group(mesh(cyl(0.015, 0.015, 1.6, 6), MT.VALUE_2A2A2E, 0, 0.8, 0), mesh(cyl(0.25, 0.25, 0.03, 12), MT.VALUE_2A2A2E, 0, 0.015, 0), mesh(cap(0.05, 0.12, 8), MT.VALUE_4A4A4E, 0, 1.68, 0));
  M.christmas_tree = () => {
    const g = M.tree_pine({ color: MT.VALUE_1F5A32 });
    const r = U.rng(4);
    const cols = [MT.F2C14E, MT.E24A3A, MT.VALUE_4AB0E0, MT.F4F2EE];
    for (let i = 0; i < 26; i++) {
      const y = 1.2 + r() * 2.4,
        rad = (1.25 - (y - 1.2) * 0.38) * 0.95,
        a = r() * PI * 2;
      g.add(mesh(sph(0.07, 8), glow(cols[i % 4], 1.6), Math.cos(a) * rad, y, Math.sin(a) * rad, { cast: false }));
    }
    g.add(mesh(ico(0.2, 0), glow(MT.F2D36A, 2), 0, 4.3, 0, { cast: false }));
    g.userData.sway = 0;
    return g;
  };
  M.red_lantern = (o) => {
    const g = group(mesh(cyl(0.02, 0.02, 4.4, 4), MT.VALUE_3A2A1E, 0, 2.5, 0, { rx: PI / 2 }));
    for (const z of [-1.4, 0, 1.4]) {
      g.add(mesh(sph(0.45, 16), o.night ? glow(MT.D42A2A, 1.2) : mat(MT.D42A2A), 0, 1.6, z, { sy: 1.2 }));
      g.add(mesh(cyl(0.3, 0.3, 0.08, 12), MT.E2B33A, 0, 2.12, z));
      g.add(mesh(cyl(0.3, 0.3, 0.08, 12), MT.E2B33A, 0, 1.08, z));
    }
    return g;
  };
  M.throne = (o) => {
    const col = o.color || MT.E2B33A;
    return group(
      mesh(box(0.9, 0.5, 0.9), metal(col, 0.4), 0, 0.25, 0),
      mesh(box(0.85, 0.12, 0.8), o.cloth || MT.VALUE_8A1A2A, 0, 0.56, 0),
      mesh(box(0.18, 2.4, 1.0), metal(col, 0.4), -0.42, 1.2, 0),
      mesh(box(0.1, 1.6, 0.7), o.cloth || MT.VALUE_8A1A2A, -0.3, 1.4, 0),
      mesh(box(0.7, 0.12, 0.12), metal(col, 0.4), 0, 0.85, 0.45),
      mesh(box(0.7, 0.12, 0.12), metal(col, 0.4), 0, 0.85, -0.45),
      mesh(sph(0.12, 10), MT.C42A3A, -0.42, 2.5, 0),
    );
  };
  M.airplane_seat = (o) => {
    const col = o.color || MT.VALUE_2A3A5A;
    const g = group();
    for (const z of [-0.55, 0, 0.55]) g.add(mesh(box(0.5, 0.15, 0.5), col, 0, 0.45, z), mesh(box(0.15, 0.75, 0.5), col, -0.25, 0.85, z), mesh(box(0.16, 0.18, 0.45), MT.E9E6DC, -0.25, 1.2, z));
    g.add(mesh(box(0.06, 0.45, 1.6), MT.VALUE_5A5D62, 0, 0.22, 0));
    return g;
  };
  M.lab_bench = () => {
    const g = group(mesh(box(3.4, 0.9, 1.0), MT.E6E8EA, 0, 0.45, 0), mesh(box(3.5, 0.06, 1.1), MT.VALUE_2A2E34, 0, 0.93, 0));
    const cols = [MT.VALUE_4AE2A0, MT.E24AB0, MT.VALUE_4AB0E2];
    for (let i = 0; i < 3; i++) g.add(mesh(cone(0.12, 0.3, 12), mat(cols[i], { t: 0.85, e: cols[i], ei: 0.4 }), -1.0 + i * 0.4, 1.11, 0.1));
    return g;
  };
  M.store_shelf = (o) => {
    const g = group(mesh(box(4, 2.8, 0.06), MT.D8DCE0, 0, 1.4, -0.3));
    const r = U.rng(5 + (o.seed || 0));
    const cols = [MT.E24A3A, MT.F2C14E, MT.VALUE_3A7BD5, MT.VALUE_1AA260, MT.F27A4A, MT.F2F2EE];
    for (let s = 0; s < 4; s++) {
      const y = 0.2 + s * 0.7;
      g.add(mesh(box(4, 0.05, 0.6), MT.VALUE_9AA3AB, 0, y, 0));
      for (let x = -1.85; x < 1.9; x += 0.3) {
        const h = 0.25 + r() * 0.2;
        g.add(mesh(box(0.22, h, 0.35), cols[Math.floor(r() * 6)], x, y + h / 2 + 0.03, 0.02));
      }
    }
    return g;
  };
  M.cash_register = () => group(mesh(box(3.2, 1.0, 0.9), MT.VALUE_6A4A32, 0, 0.5, 0), mesh(box(3.2, 0.06, 1.0), MT.VALUE_3A2A1E, 0, 1.03, 0), mesh(box(0.5, 0.35, 0.4), MT.VALUE_2A2A2E, 0.8, 1.24, 0), mesh(box(0.02, 0.18, 0.32), glow(MT.VALUE_4AE2A0, 1.2), 1.06, 1.3, 0, { cast: false }));
  M.piano = (o) => {
    const col = o.color || MT.VALUE_141416;
    return group(mesh(box(0.7, 1.4, 1.6), mat(col, { r: 0.2 }), -0.15, 0.95, 0), mesh(box(0.3, 0.06, 1.55), MT.F4F4F2, 0.32, 0.86, 0), mesh(box(0.1, 0.8, 0.1), col, 0.32, 0.4, 0.7), mesh(box(0.1, 0.8, 0.1), col, 0.32, 0.4, -0.7));
  };
  M.coffin = (o) => group(mesh(box(2.0, 0.6, 0.7), o.color || MT.VALUE_3A2216, 0, 0.3, 0), mesh(box(0.06, 0.02, 0.4), MT.C9A23A, -0.3, 0.61, 0), mesh(box(0.3, 0.02, 0.06), MT.C9A23A, -0.3, 0.61, 0));
  M.cauldron = (o) =>
    group(
      mesh(
        K.geo(MT.CAULDRON, () => new T.SphereGeometry(0.7, 20, 12, 0, PI * 2, PI * 0.35, PI * 0.65)),
        MT.VALUE_1E1E22,
        0,
        0.7,
        0,
      ),
      mesh(cyl(0.6, 0.6, 0.05, 20), glow(o.color || MT.VALUE_5AE26A, 1.2), 0, 0.98, 0, { cast: false }),
      mesh(sph(0.25, 8), glow(MT.FFB04A, 2), 0, 0.12, 0, { cast: false }),
    );
  M.treasure_chest = (o) => {
    const g = group(mesh(box(0.9, 0.5, 0.6), MT.VALUE_6A4226, 0, 0.25, 0), mesh(box(0.92, 0.06, 0.62), MT.C9A23A, 0, 0.32, 0));
    const lid = group(
      mesh(
        K.geo(MT.CHESTLID, () => new T.CylinderGeometry(0.3, 0.3, 0.9, 14, 1, false, 0, PI).rotateZ(PI / 2)),
        MT.VALUE_7A4E2C,
        0,
        0,
        0.3,
      ),
    );
    lid.position.set(0, 0.5, -0.3);
    lid.rotation.x = -(o.open || 0) * 1.6;
    g.add(lid);
    if ((o.open || 0) > 0.2) g.add(mesh(sph(0.35, 12), glow(MT.F2C41E, 1.4), 0, 0.5, 0, { sy: 0.4, cast: false }));
    return g;
  };
  M.football = () => group(mesh(ico(0.11, 1), mat(MT.F4F4F2, { flat: true }), 0, 0.11, 0));
  M.gift_box = (o) => group(mesh(box(0.5, 0.45, 0.5), o.color || MT.D42A3A, 0, 0.225, 0), mesh(box(0.52, 0.47, 0.08), MT.F2D36A, 0, 0.225, 0), mesh(box(0.08, 0.47, 0.52), MT.F2D36A, 0, 0.225, 0));
  M.birthday_cake = () => group(mesh(cyl(0.4, 0.4, 0.3, 24), MT.F2D6C0, 0, 0.15, 0), mesh(cyl(0.3, 0.3, 0.25, 24), MT.F2B8C8, 0, 0.42, 0), mesh(sph(0.03, 8), glow(MT.FFB04A, 3), 0, 0.62, 0, { cast: false }), mesh(cyl(0.012, 0.012, 0.1, 6), MT.VALUE_4AB0E0, 0, 0.58, 0));
  M.balloon_bunch = (o) => {
    const g = group();
    const cols = [MT.E24A3A, MT.F2C14E, MT.VALUE_3A7BD5, MT.VALUE_1AA260, MT.E86AB0];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      g.add(mesh(sph(0.28, 14), mat(cols[i], { r: 0.3 }), Math.cos(a) * 0.3, 2.6 + (i % 2) * 0.35, Math.sin(a) * 0.3, { sy: 1.2 }));
    }
    g.add(mesh(cyl(0.005, 0.005, 2.3, 4), MT.E9E6DC, 0, 1.3, 0));
    g.userData.sway = 0.03;
    return g;
  };
  M.crystal_ball = () => group(mesh(cyl(0.18, 0.22, 0.12, 14), MT.VALUE_5A3A22, 0, 0.06, 0), mesh(sph(0.2, 20), mat(MT.B08AFF, { t: 0.8, e: MT.VALUE_7A4AD0, ei: 0.8, r: 0.1 }), 0, 0.3, 0, { cast: false }));
  M.trophy_cup = () => group(mesh(box(0.3, 0.12, 0.3), MT.VALUE_3A2A1E, 0, 0.06, 0), mesh(cyl(0.04, 0.04, 0.25, 8), metal(MT.E2B33A), 0, 0.24, 0), mesh(cyl(0.2, 0.08, 0.35, 18), metal(MT.F2C41E, 0.25), 0, 0.55, 0));
  M.medkit = () => group(mesh(box(0.45, 0.32, 0.18), MT.F2F2EE, 0, 0.16, 0), mesh(box(0.08, 0.2, 0.19), MT.D42A2A, 0, 0.16, 0), mesh(box(0.2, 0.08, 0.19), MT.D42A2A, 0, 0.16, 0));
  const SETS = K.ENV_SETS;
  if (!SETS) return;
  const row = (scene, WW, z, step, make, jitter = 0) => {
    const r = U.rng(Math.round(z * 100) + step * 7);
    for (let x = -WW * 0.6 * PX; x < WW * 1.6 * PX; x += step + r() * jitter) {
      const o = make(x, r);
      if (!o) continue;
      o.position.x = x;
      o.position.z = z;
      scene.add(o);
    }
  };
  const at = (scene, obj, x, z, ry = 0) => {
    if (!obj) return;
    obj.position.set(x, 0, z);
    obj.rotation.y = ry;
    scene.add(obj);
  };
  const dim = (col, tp, k = 0.6) => (tp.night ? C.mix(col, MT.VALUE_0B1322, k) : col);
  Object.assign(SETS, {
    medieval_village: {
      minDepth: 0.2,
      build: (scene, WW, tp) => {
        at(scene, M.castle({ night: tp.night, color: dim(MT.VALUE_8F8A80, tp, 0.4) }), (WW / 2) * PX, -40);
        row(scene, WW, -13, 6.5, (x, r) => (r() > 0.45 ? M.cottage({ night: tp.night, color: dim(MT.C9B08A, tp, 0.5) }) : K.asset(MT.TREE_OAK, { color: tp.night ? MT.VALUE_132013 : undefined })), 2);
      },
    },
    castle_courtyard: { minDepth: 0.8, build: (scene, WW, tp) => at(scene, M.castle({ night: tp.night, color: dim(MT.VALUE_9A958A, tp, 0.45) }), (WW / 2) * PX, -12) },
    imperial_palace: { minDepth: 0.8, build: (scene, WW, tp) => at(scene, M.palace_gate({ night: tp.night, color: dim(MT.B03A2A, tp, 0.5), roof: dim(MT.D9A83A, tp, 0.5) }), (WW / 2) * PX, -11) },
    ancient_ruins: { minDepth: 0.6, build: (scene, WW, tp) => at(scene, M.temple_columns({ color: dim(MT.E6E0D2, tp, 0.55) }), (WW / 2) * PX, -14) },
    wild_west_town: {
      minDepth: 0.8,
      build: (scene, WW, tp) => {
        let i = 0;
        row(scene, WW, -11, 6.2, (x, r) => M.saloon({ night: tp.night, color: dim([MT.VALUE_9A6A3A, MT.VALUE_8A5A32, MT.A87A4A][Math.floor(r() * 3)], tp, 0.55), sign: [MT.SALOON_2, MT.HOTEL, MT.BANK, MT.SHERIFF_2][i++ % 4] }));
      },
    },
    snow_mountain: {
      minDepth: 0.3,
      build: (scene, WW, tp) => {
        row(scene, WW, -12, 2.2, () => M.snowy_pine({ color: tp.night ? MT.VALUE_0E1A14 : MT.VALUE_24402E }), 1.6);
        row(scene, WW, -17, 2.6, () => M.snowy_pine({ color: tp.night ? MT.VALUE_0C1612 : MT.VALUE_2A4A36 }), 1.8);
      },
    },
    desert_dunes: {
      minDepth: 0.1,
      build: (scene, WW, tp) => {
        row(scene, WW, -60, 40, () => M.pyramid({ color: dim(MT.D8B878, tp, 0.55) }), 20);
      },
    },
    city_park: {
      minDepth: 0.4,
      build: (scene, WW, tp) => {
        row(scene, WW, -11, 3.6, (x, r) => K.asset(r() > 0.5 ? MT.TREE_OAK : MT.TREE_ROUND, { color: tp.night ? MT.VALUE_132013 : undefined }), 1.5);
      },
    },
    graveyard: {
      minDepth: 0.3,
      build: (scene, WW, tp) => {
        row(scene, WW, -12, 6, () => K.asset(MT.TREE_BARE, { color: MT.VALUE_1A1612 }), 3);
        row(scene, WW, -7, 1.8, (x, r) => (r() > 0.3 ? M.gravestone({ color: dim(MT.VALUE_7A7A80, tp, 0.45) }) : null), 0.8);
      },
    },
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
