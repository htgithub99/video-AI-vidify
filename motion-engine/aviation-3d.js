(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const K = ME.T3;
  if (!K || !K.ok || !K.models || !K.EXT) return;
  const T = K.T;
  const C = ME.color;
  const PI = Math.PI;
  const { mesh, box, cyl, sph, cone, mat, group } = K;
  const M = K.models;
  const X = K.EXT;
  X.held = X.held || {};
  const metal = (c, r) => mat(c, { m: 0.7, r: r == null ? 0.4 : r });
  const glowM = (c, i) => mat(c, { e: c, ei: i || 2 });
  const hashN = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const gunMesh = (kind, fire, s) => {
    const g = group();
    const dk = metal(MT.VALUE_1E2024, 0.5),
      md = metal(MT.VALUE_2E3238, 0.6);
    if (kind === MT.RIFLE) {
      g.add(mesh(box(0.06 * s, 0.4 * s, 0.05 * s), dk, 0.03 * s, -0.12 * s, 0));
      g.add(mesh(cyl(0.011 * s, 0.011 * s, 0.26 * s, 8), dk, 0.035 * s, -0.44 * s, 0));
      g.add(mesh(box(0.05 * s, 0.22 * s, 0.045 * s), md, 0.0, 0.16 * s, 0));
      g.add(mesh(box(0.11 * s, 0.035 * s, 0.035 * s), dk, -0.06 * s, -0.12 * s, 0, { rz: 0.15 }));
      g.add(mesh(box(0.08 * s, 0.03 * s, 0.03 * s), dk, -0.03 * s, 0.0, 0));
    } else {
      g.add(mesh(box(0.035 * s, 0.17 * s, 0.03 * s), dk, 0.03 * s, -0.07 * s, 0));
      g.add(mesh(box(0.08 * s, 0.03 * s, 0.028 * s), md, -0.02 * s, 0.0, 0));
    }
    if (fire) {
      const tip = kind === MT.RIFLE ? -0.6 * s : -0.2 * s;
      g.add(mesh(cone(0.06 * s, 0.22 * s, 8), glowM(MT.FFD27A, 3), 0.035 * s, tip - 0.08 * s, 0, { rz: PI, cast: false }));
      const L = new T.PointLight(MT.FFBF5A, 6, 4, 2);
      L.position.set(0.04 * s, tip - 0.1 * s, 0);
      g.add(L);
    }
    return g;
  };
  for (const kind of [MT.RIFLE, MT.PISTOL]) {
    X.held[kind] = (s) => gunMesh(kind, false, s);
    X.held[kind + MT.FIRE_2] = (s) => gunMesh(kind, true, s);
  }
  X.acc.tactical_vest = (o) => {
    const col = (o.ch.colors && o.ch.colors.vest) || MT.VALUE_2C323A;
    o.torsoG.add(mesh(box(o.chestD * 1.3, o.torsoLen * 0.62, o.chestW * 1.1), col, 0, o.torsoLen * 0.5, 0));
    for (const y of [0.32, 0.46]) o.torsoG.add(mesh(box(o.chestD * 0.35, o.torsoLen * 0.12, o.chestW * 0.75), C.shade(col, 0.12), o.chestD * 0.75, o.torsoLen * y, 0));
  };
  X.acc.rifle = (o) => {
    const g = gunMesh(MT.RIFLE, false, o.s);
    g.rotation.z = -2.2;
    g.position.set(o.chestD * 0.95, o.torsoLen * 0.45, 0);
    g.userData.slung = true;
    o.torsoG.add(g);
  };
  X.acc.pistol = (o) => {
    const h = mesh(box(0.06 * o.s, 0.16 * o.s, 0.05 * o.s), MT.VALUE_2A2420, 0, -0.02, o.chestW * 0.62);
    o.body.add(h);
  };
  const SHIRTS = [MT.VALUE_6A7A8A, MT.VALUE_9A5A6A, MT.VALUE_7A6A52, MT.VALUE_4A6A8A, MT.VALUE_8A7A4A, MT.VALUE_5A5A6A, MT.A86A4A, MT.VALUE_3A5A4A, MT.C8C4BC];
  const SKINS = [MT.F0C8A8, MT.D8A07A, MT.A86A4A, MT.E8B890, MT.VALUE_7A4A32];
  const HAIRS = [MT.VALUE_2A1E14, MT.VALUE_5A3A22, MT.D0CCC4, MT.VALUE_1A1410, MT.VALUE_8A6A3A];
  const mannequin = (seed, afraid) => {
    const r = (k) => hashN(seed * 3.1 + k);
    const shirt = SHIRTS[Math.floor(r(1) * SHIRTS.length)],
      skin = SKINS[Math.floor(r(2) * SKINS.length)],
      hair = HAIRS[Math.floor(r(3) * HAIRS.length)];
    const pants = r(4) < 0.5 ? MT.VALUE_2C3038 : MT.VALUE_3A3A44;
    const g = group();
    const lean = afraid ? 0.35 : 0.08;
    const torso = group(mesh(box(0.24, 0.55, 0.36), shirt, 0, 0.27, 0), mesh(sph(0.11, 12), skin, 0.02, 0.68, 0), mesh(sph(0.115, 12), hair, -0.03, 0.72, 0, { sy: 0.8 }));
    torso.position.set(-0.08, 0.5, 0);
    torso.rotation.z = -lean;
    g.add(torso);
    for (const z of [0.09, -0.09]) {
      g.add(mesh(box(0.42, 0.12, 0.12), pants, 0.12, 0.52, z));
      g.add(mesh(box(0.11, 0.46, 0.11), pants, 0.32, 0.25, z));
      g.add(mesh(box(0.2, 0.07, 0.1), MT.VALUE_1A1A1A, 0.38, 0.03, z));
      const arm = mesh(box(0.08, 0.42, 0.08), shirt, afraid ? 0.1 : 0.06, afraid ? 0.75 : 0.62, z * 2.1, { rz: afraid ? 1.2 : 0.5 });
      g.add(arm);
    }
    return g;
  };
  const seatMesh = (o, pilot) => {
    const col = o.color || (pilot ? MT.VALUE_3A3632 : MT.VALUE_2B3A5C);
    const g = group(
      mesh(box(0.52, 0.12, 0.5), col, 0.02, 0.44, 0),
      mesh(box(0.12, pilot ? 0.9 : 0.76, 0.5), C.shade(col, -0.2), -0.27, 0.86, 0, { rz: -0.12 }),
      mesh(box(0.12, 0.22, 0.42), pilot ? MT.E8E0CC : MT.E9E6DC, -0.33, pilot ? 1.34 : 1.22, 0, { rz: -0.12 }),
      mesh(box(0.06, 0.38, 0.06), metal(MT.VALUE_5A5E66), -0.15, 0.19, 0.18),
      mesh(box(0.06, 0.38, 0.06), metal(MT.VALUE_5A5E66), 0.17, 0.19, 0.18),
      mesh(box(0.06, 0.38, 0.06), metal(MT.VALUE_5A5E66), -0.15, 0.19, -0.18),
      mesh(box(0.06, 0.38, 0.06), metal(MT.VALUE_5A5E66), 0.17, 0.19, -0.18),
    );
    for (const z of [0.27, -0.27]) g.add(mesh(box(0.42, 0.05, 0.06), pilot ? MT.VALUE_4A4440 : MT.VALUE_5A5E66, -0.02, 0.68, z));
    if (o.passenger && !pilot) g.add(mannequin(o.seed || 1, o.mood === MT.AFRAID));
    return g;
  };
  M.airplane_seat = (o) => seatMesh(o, false);
  M.pilot_seat = (o) => seatMesh(o, true);
  M.cockpit_door = (o) => {
    const g = group(mesh(box(3.2, 4.3, 0.12), MT.D6D3CB, 0, 2.15, -0.06));
    const leaf = group(mesh(box(0.92, 2.04, 0.06), metal(MT.B8BCC2, 0.5), 0.46, 1.02, 0));
    leaf.position.set(-0.46, 0, 0.02);
    g.add(leaf);
    g.add(mesh(box(1.08, 2.12, 0.04), MT.VALUE_10151E, 0, 1.06, -0.02));
    g.add(mesh(box(0.2, 0.3, 0.04), MT.VALUE_2A2E34, 0.74, 1.21, 0.02));
    const lamp = mesh(sph(0.03, 8), glowM(MT.E2423A, 2), 0.74, 1.29, 0.05, { cast: false });
    g.add(lamp);
    const set = (p) => {
      const op = Math.max(0, Math.min(1, p.open || 0));
      leaf.rotation.y = -op * 1.7;
      lamp.material = glowM(op > 0.5 ? MT.VALUE_3AE27A : MT.E2423A, 2);
    };
    set(o);
    g.userData.setParams = set;
    return g;
  };
  const STAIR = ME.AVIATION ? ME.AVIATION.STAIR : { x0: -150, y0: -66, x1: 214, topW: 76 };
  M.stair_truck = (o) => {
    const k = 0.9 * 0.01;
    const h = Math.max(220, Math.min(700, o.h || 470));
    const body = o.color || MT.E2B62A;
    const g = group(mesh(box(5.6 * 0.9, 0.34, 2.2), body, -0.2 * 0.9, 0.57, 0), mesh(box(1.18 * 0.9, 1.04, 2.0), body, -2.59 * 0.9, 1.16, 0), mesh(box(0.05, 0.5, 1.6), mat(MT.VALUE_9AC8E6, { r: 0.1, m: 0.2 }), -3.12 * 0.9, 1.3, 0));
    for (const wx of [-2.5, 1.7]) for (const z of [0.95, -0.95]) g.add(mesh(cyl(0.26, 0.26, 0.22, 16), MT.VALUE_1C1D20, wx * 0.9, 0.26, z, { rx: PI / 2 }));
    const x0 = STAIR.x0 * k,
      y0 = -STAIR.y0 * k,
      x1 = STAIR.x1 * k,
      y1 = h * k;
    const len = Math.hypot(x1 - x0, y1 - y0),
      ang = Math.atan2(y1 - y0, x1 - x0);
    g.add(mesh(box(len, 0.08, 1.1), metal(MT.CFD2D6, 0.5), (x0 + x1) / 2, (y0 + y1) / 2, 0, { rz: ang }));
    const n = Math.max(6, Math.round((y1 - y0) / 0.22));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.add(mesh(box(0.18, 0.04, 1.1), metal(MT.VALUE_8A8E94, 0.5), x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 0.05, 0));
    }
    for (const z of [0.55, -0.55]) {
      g.add(mesh(box(len, 0.04, 0.04), metal(MT.E8EAEC, 0.3), (x0 + x1) / 2, (y0 + y1) / 2 + 0.85, z, { rz: ang }));
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        g.add(mesh(cyl(0.02, 0.02, 0.85, 6), metal(MT.E8EAEC, 0.3), x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 0.43, z));
      }
    }
    g.add(mesh(box(STAIR.topW * k, 0.08, 1.4), metal(MT.CFD2D6, 0.5), x1 + (STAIR.topW * k) / 2, y1, 0));
    g.add(mesh(box(0.1, y1 - 0.8, 0.1), metal(MT.VALUE_6A6E74, 0.5), x1 - 0.6, (y1 - 0.8) / 2 + 0.7, 0, { rz: 0.5 }));
    return g;
  };
  M.evac_slide = (o) => {
    const k = 0.9 * 0.01;
    const h = Math.max(200, Math.min(700, o.h || 440));
    const g = group();
    const pt = (t) => {
      const e = t < 0.8 ? t / 0.8 : 1;
      const yk = Math.sin((e * PI) / 2) * 0.92 + (t >= 0.8 ? 0.08 * ((t - 0.8) / 0.2) : 0);
      return [(-250 + 520 * t) * k, (h - (h - 8) * yk) * k];
    };
    for (let i = 0; i < 16; i++) {
      const a = pt(i / 16),
        b = pt((i + 1) / 16);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.04,
        ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.add(mesh(box(len, 0.12, 1.5), MT.F0C02E, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0, { rz: ang }));
      for (const z of [0.82, -0.82]) g.add(mesh(cyl(0.16, 0.16, len, 10), MT.FFE27A, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.12, z, { rz: ang + PI / 2 }));
    }
    return g;
  };
  M.airliner = (o) => {
    const kx = 0.008,
      ky = 0.0095;
    const night = !!o.night;
    const white = night ? MT.VALUE_9AA4B4 : MT.F1F2F4,
      belly = night ? MT.VALUE_6A7280 : MT.C9CED6,
      blue = o.stripe || MT.VALUE_1F4A8A;
    const g = group();
    const R = 280 * ky,
      cy = 450 * ky;
    const L0 = -3300 * kx,
      L1 = -520 * kx;
    const len = L1 - L0;
    g.add(mesh(cyl(R, R, len, 28), white, (L0 + L1) / 2, cy, 0, { rz: PI / 2 }));
    g.add(mesh(sph(R, 28, 18), white, L1, cy, 0, { sx: (520 * kx) / R, sy: 1, sz: 1 }));
    g.add(mesh(cone(R, 700 * kx, 28), white, L0 - (350 * kx) / 1.0, cy + 60 * ky, 0, { rz: PI / 2 }));
    g.add(mesh(box(len, 16 * ky, R * 2.02), blue, (L0 + L1) / 2, cy - 22 * ky, 0));
    g.add(mesh(box(len, 140 * ky, R * 1.6), belly, (L0 + L1) / 2, cy - 230 * ky, 0));
    const winM = night ? glowM(MT.FFD98A, 1.2) : mat(MT.VALUE_2A3A50, { r: 0.2, m: 0.1 });
    for (let x = -1010; x > -3250; x -= 52) g.add(mesh(box(17 * kx, 24 * ky, 0.04), winM, x * kx, cy - 84 * ky, R * 0.985, { cast: false }));
    const cw = [-320, -250, -180];
    cw.forEach((x, i) => {
      if (i === 1 && o.windowOpen) return;
      g.add(mesh(box(56 * kx, 38 * ky, 0.05), mat(MT.VALUE_1C2838, { r: 0.1, m: 0.3 }), x * kx, cy + 128 * ky, R * 0.72, { ry: -0.5, cast: false }));
    });
    const doorAt = (x, w) => {
      const d = group(mesh(box(w * kx, 196 * ky, 0.05), mat(C.shade(white, -0.05), { r: 0.5 }), 0, 0, 0));
      d.position.set(x * kx, (456 + 98) * ky, R * 0.99);
      g.add(d);
      const hole = mesh(box(w * kx, 196 * ky, 0.03), MT.VALUE_141A22, x * kx, (456 + 98) * ky, R * 0.985, { cast: false });
      g.add(hole);
      return d;
    };
    const d1 = doorAt(-780, 84),
      d2 = doorAt(-2650, 80);
    g.add(mesh(box(560 * kx, 158 * ky, 1.6), white, -1480 * kx, 153 * ky, 2.6));
    g.add(mesh(cyl(76 * ky, 76 * ky, 560 * kx, 20), night ? MT.VALUE_8A929E : MT.DDE0E5, -1480 * kx, 153 * ky, 3.4, { rz: PI / 2 }));
    g.add(mesh(cyl(60 * ky, 60 * ky, 0.05, 20), MT.VALUE_2A2E34, -1200 * kx, 153 * ky, 3.4, { rz: PI / 2 }));
    g.add(mesh(box(900 * kx, 30 * ky, 14), C.shade(white, -0.12), -1850 * kx, 250 * ky, 0, { ry: 0.35 }));
    g.add(mesh(box(380 * kx, 560 * ky, 0.25), white, -3600 * kx, cy + 520 * ky, 0, { rz: 0.35 }));
    g.add(mesh(box(380 * kx, 140 * ky, 0.27), blue, -3640 * kx, cy + 720 * ky, 0, { rz: 0.35 }));
    g.add(mesh(box(500 * kx, 20 * ky, 6), C.shade(white, -0.08), -3500 * kx, cy + 60 * ky, 0));
    const gear = (x, n, r) => {
      g.add(mesh(cyl(0.08, 0.08, 175 * ky, 8), metal(MT.VALUE_5A5E64), x * kx, (175 * ky) / 2, 0));
      for (const z of n > 1 ? [0.6, -0.6] : [0]) g.add(mesh(cyl(r * ky, r * ky, 0.35, 18), MT.VALUE_1C1D20, x * kx, r * ky, z, { rx: PI / 2 }));
    };
    gear(-420, 1, 28);
    gear(-2050, 2, 40);
    const set = (p) => {
      d1.visible = (p.doorOpen || 0) < 0.5;
      d2.visible = (p.door2Open || 0) < 0.5;
    };
    set(o);
    g.userData.setParams = set;
    return g;
  };
  M.rifle = () => {
    const g = gunMesh(MT.RIFLE, false, 1);
    g.rotation.z = PI / 2;
    g.position.y = 0.1;
    return group(g);
  };
  M.pistol = () => {
    const g = gunMesh(MT.PISTOL, false, 1);
    g.rotation.z = PI / 2;
    g.position.y = 0.05;
    return group(g);
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
