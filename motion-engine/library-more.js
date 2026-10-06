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
  const A = (id, name, category, size, draw, tags) => ME.registerAsset(id, { name, category, size, draw, tags: tags || [] });
  const ell = (g, x, y, rx, ry, col, rot = 0) => {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, PI * 2);
    g.fill();
  };
  const circle = (g, x, y, r, col) => ell(g, x, y, r, r, col);
  const line = (g, x0, y0, x1, y1, w, col) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = MT.ROUND;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  };
  const spin = (o, r) => ((o.distance != null ? o.distance : (o.t || 0) * (o.speed || 0)) / r) % (PI * 2);
  const legs4 = (g, o, xs, y0, len, w, col, speed = 5) => {
    const ph = o.distance != null ? o.distance / 30 : (o.t || 0) * speed * (o.moving === false ? 0 : 1);
    xs.forEach((x, i) => {
      const a = Math.sin(ph + (i % 2 ? PI : 0) + (i > 1 ? PI / 2 : 0)) * 0.35;
      line(g, x, y0, x + Math.sin(a) * len, y0 + Math.cos(a) * len, w, col);
    });
  };
  const glow = (g, x, y, r, col, a) => ME.glow(g, x, y, r, col, a);
  const nightLights = (fn) => (o) => (o.night || o.lights ? fn(o) : []);
  A(
    MT.TANK,
    MT.XE_TANG,
    MT.VEHICLE,
    [520, 250],
    (g, o) => {
      const col = o.color || MT.VALUE_4B5A3A;
      const dk = C.shade(col, -0.3);
      R(g, -250, -78, 500, 78, 38, MT.VALUE_22241F);
      const rot = spin(o, 28);
      for (let i = 0; i < 7; i++) {
        const x = -200 + i * 66;
        circle(g, x, -38, 28, MT.VALUE_3A3D36);
        circle(g, x, -38, 12, MT.VALUE_5A5D55);
        line(g, x, -38, x + Math.cos(rot) * 24, -38 + Math.sin(rot) * 24, 3, MT.VALUE_2A2C28);
      }
      poly(
        g,
        [
          [-262, -84],
          [-230, -120],
          [236, -120],
          [266, -84],
        ],
        col,
      );
      R(g, -240, -132, 480, 18, 4, dk);
      poly(
        g,
        [
          [-130, -132],
          [-110, -200],
          [90, -200],
          [120, -132],
        ],
        C.shade(col, 0.06),
      );
      R(g, 100, -182, 210, 18, 6, dk);
      R(g, 300, -186, 26, 26, 4, dk);
      R(g, -60, -222, 60, 22, 6, dk);
      R(g, -200, -116, 400, 4, 0, C.shade(col, 0.15));
      if (o.fire) glow(g, 330, -173, 50 + Math.sin((o.t || 0) * 30) * 10, MT.FFB04A, 0.9);
    },
    [MT.QUAN_DOI, MT.CHIEN_TRANH, MT.XE],
  );
  A(
    MT.COVERED_WAGON,
    MT.XE_NGUA_MUI_BAT_MIEN_TAY,
    MT.VEHICLE,
    [460, 300],
    (g, o) => {
      const rot = spin(o, 60);
      const wood = MT.VALUE_7A5232;
      R(g, -200, -120, 380, 40, 4, wood);
      g.fillStyle = o.color || MT.ECE2C6;
      g.beginPath();
      g.moveTo(-200, -120);
      g.quadraticCurveTo(-210, -300, -10, -290);
      g.quadraticCurveTo(190, -300, 180, -120);
      g.closePath();
      g.fill();
      g.strokeStyle = MT.RGBA_0_0_0_0_15;
      g.lineWidth = 3;
      for (const x of [-120, -10, 100]) {
        g.beginPath();
        g.moveTo(x, -122);
        g.quadraticCurveTo(x, -280, x, -288);
        g.stroke();
      }
      for (const x of [-130, 120]) {
        circle(g, x, -60, 58, MT.VALUE_3A2A1E);
        circle(g, x, -60, 50, MT.RGBA_0_0_0_0);
        g.strokeStyle = MT.A07A4A;
        g.lineWidth = 4;
        for (let k = 0; k < 8; k++) {
          const a = rot + (k * PI) / 4;
          line(g, x, -60, x + Math.cos(a) * 50, -60 + Math.sin(a) * 50, 4, MT.A07A4A);
        }
        circle(g, x, -60, 10, MT.VALUE_3A2A1E);
      }
      line(g, 180, -96, 240, -80, 6, wood);
    },
    [MT.MIEN_TAY, MT.CAO_BOI, MT.XE_NGUA],
  );
  A(
    MT.HORSE_CARRIAGE,
    MT.XE_NGUA_HOANG_GIA,
    MT.VEHICLE,
    [560, 330],
    (g, o) => {
      const rot = spin(o, 50);
      const col = o.color || MT.VALUE_1F2A44;
      ME.drawAsset(g, MT.HORSE, 170, 0, o, 0.95);
      line(g, 60, -120, 120, -130, 5, MT.VALUE_4A3020);
      R(g, -230, -150, 270, 20, 6, C.shade(col, -0.25));
      ME.roundRect(g, -220, -300, 240, 160, 40);
      g.fillStyle = col;
      g.fill();
      R(g, -170, -270, 70, 70, 10, MT.E8D79A);
      R(g, -80, -270, 70, 70, 10, MT.E8D79A);
      R(g, -165, -265, 60, 60, 8, o.night ? MT.F2C374 : MT.VALUE_9FB8C9);
      R(g, -75, -265, 60, 60, 8, o.night ? MT.F2C374 : MT.VALUE_9FB8C9);
      poly(
        g,
        [
          [-140, -300],
          [-100, -330],
          [-60, -300],
        ],
        MT.E2B33A,
      );
      for (const x of [-180, 0]) {
        g.strokeStyle = MT.E2B33A;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(x, -60, 56, 0, PI * 2);
        g.stroke();
        for (let k = 0; k < 10; k++) {
          const a = rot + (k * PI) / 5;
          line(g, x, -60, x + Math.cos(a) * 54, -60 + Math.sin(a) * 54, 2.5, MT.E2B33A);
        }
      }
    },
    [MT.CO_TICH, MT.HOANG_GIA, MT.CONG_CHUA],
  );
  A(
    MT.EXCAVATOR,
    MT.MAY_XUC,
    MT.VEHICLE,
    [560, 360],
    (g, o) => {
      const col = o.color || MT.E2A22A;
      R(g, -200, -70, 330, 70, 34, MT.VALUE_2A2A2A);
      for (let i = 0; i < 5; i++) circle(g, -165 + i * 65, -35, 22, MT.VALUE_4A4A4A);
      R(g, -190, -130, 300, 60, 6, col);
      R(g, -80, -260, 140, 130, 10, col);
      R(g, -60, -240, 90, 80, 6, o.night ? MT.VALUE_2A3446 : MT.VALUE_9FB8C9);
      const lift = Math.sin((o.t || 0) * 0.9) * 0.15 + (o.lift || 0);
      g.save();
      g.translate(60, -200);
      g.rotate(-0.55 - lift);
      R(g, 0, -14, 200, 28, 10, col);
      g.translate(200, 0);
      g.rotate(1.6 + lift * 2);
      R(g, 0, -11, 150, 22, 8, C.shade(col, -0.1));
      g.translate(150, 0);
      poly(
        g,
        [
          [0, -20],
          [50, -40],
          [70, 10],
          [10, 30],
        ],
        MT.VALUE_5A5A5A,
      );
      g.restore();
    },
    [MT.CONG_TRUONG, MT.XAY_DUNG],
  );
  A(
    MT.FIGHTER_JET,
    MT.MAY_BAY_CHIEN_DAU,
    MT.AIRCRAFT,
    [620, 200],
    (g, o) => {
      const col = o.color || MT.VALUE_7C8A96;
      poly(
        g,
        [
          [-300, -80],
          [-240, -110],
          [180, -110],
          [310, -90],
          [180, -70],
          [-240, -70],
        ],
        col,
      );
      poly(
        g,
        [
          [-80, -90],
          [80, -90],
          [-120, -10],
          [-170, -10],
        ],
        C.shade(col, -0.15),
      );
      poly(
        g,
        [
          [-270, -105],
          [-230, -105],
          [-280, -190],
          [-300, -190],
        ],
        C.shade(col, -0.1),
      );
      poly(
        g,
        [
          [100, -110],
          [200, -112],
          [160, -138],
          [120, -136],
        ],
        o.night ? MT.VALUE_2A3446 : MT.VALUE_4A7AB0,
      );
      if (o.t != null && o.afterburner !== false) glow(g, -310, -90, 30 + Math.sin((o.t || 0) * 40) * 6, MT.FFB04A, 0.8);
    },
    [MT.QUAN_DOI, MT.MAY_BAY],
  );
  A(
    MT.ROCKET,
    MT.TEN_LUA_TAU_VU_TRU,
    MT.AIRCRAFT,
    [200, 700],
    (g, o) => {
      const col = o.color || MT.EEF0F2;
      const lift = o.launch ? -((o.t || 0) ** 2) * 40 : 0;
      g.save();
      g.translate(0, lift);
      if (o.launch || o.fire) {
        for (let i = 0; i < 4; i++) glow(g, 0, -10 + i * 40, 70 - i * 10, i % 2 ? MT.FFD27A : MT.FF8A3A, 0.85);
      }
      R(g, -50, -520, 100, 440, 10, col);
      poly(
        g,
        [
          [-50, -520],
          [0, -680],
          [50, -520],
        ],
        MT.C42A2A,
      );
      poly(
        g,
        [
          [-50, -200],
          [-110, -60],
          [-50, -90],
        ],
        MT.C42A2A,
      );
      poly(
        g,
        [
          [50, -200],
          [110, -60],
          [50, -90],
        ],
        MT.C42A2A,
      );
      R(g, -36, -90, 72, 30, 4, MT.VALUE_5A5D62);
      circle(g, 0, -420, 22, MT.VALUE_2A3446);
      circle(g, 0, -420, 16, o.night ? MT.F2C374 : MT.VALUE_7AB0E0);
      R(g, -50, -300, 100, 10, 0, MT.C42A2A);
      g.restore();
    },
    [MT.VU_TRU, MT.KHOA_HOC],
  );
  A(
    MT.SPACESHIP,
    MT.PHI_THUYEN,
    MT.AIRCRAFT,
    [560, 220],
    (g, o) => {
      const col = o.color || MT.CFD6DE;
      const bob = Math.sin((o.t || 0) * 1.4) * 6;
      g.save();
      g.translate(0, -110 + bob);
      poly(
        g,
        [
          [-260, 10],
          [-200, -40],
          [200, -30],
          [290, 0],
          [200, 30],
          [-200, 40],
        ],
        col,
      );
      poly(
        g,
        [
          [-120, -30],
          [40, -30],
          [-60, -110],
          [-140, -110],
        ],
        C.shade(col, -0.15),
      );
      poly(
        g,
        [
          [-120, 30],
          [40, 30],
          [-60, 110],
          [-140, 110],
        ],
        C.shade(col, -0.25),
      );
      ell(g, 150, -22, 60, 18, o.night ? MT.VALUE_7AB0E0 : MT.VALUE_4A7AB0);
      glow(g, -270, 0, 34, MT.VALUE_6AD0FF, 0.9);
      glow(g, -270, 0, 16, MT.FFFFFF, 0.9);
      g.restore();
    },
    [MT.VU_TRU, MT.VIEN_TUONG],
  );
  A(
    MT.UFO,
    MT.DIA_BAY_UFO,
    MT.AIRCRAFT,
    [360, 240],
    (g, o) => {
      const bob = Math.sin((o.t || 0) * 2) * 8;
      g.save();
      g.translate(0, -150 + bob);
      if (o.beam) {
        const gr = g.createLinearGradient(0, 0, 0, 150);
        gr.addColorStop(0, MT.RGBA_160_255_190_0_55);
        gr.addColorStop(1, MT.RGBA_160_255_190_0);
        g.fillStyle = gr;
        poly(
          g,
          [
            [-40, 10],
            [40, 10],
            [120, 150],
            [-120, 150],
          ],
          gr,
        );
      }
      ell(g, 0, -20, 70, 50, MT.RGBA_160_230_255_0_75);
      ell(g, 0, 0, 170, 36, o.color || MT.VALUE_9AA3AB);
      ell(g, 0, -6, 170, 20, C.shade(o.color || MT.VALUE_9AA3AB, 0.2));
      for (let i = 0; i < 7; i++) {
        const on = Math.sin((o.t || 0) * 6 + i) > 0;
        circle(g, -120 + i * 40, 12, 8, on ? MT.FFE36A : MT.VALUE_6A6A3A);
      }
      g.restore();
    },
    [MT.VIEN_TUONG, MT.NGUOI_NGOAI_HANH_TINH],
  );
  A(
    MT.SATELLITE,
    MT.VE_TINH,
    MT.AIRCRAFT,
    [420, 200],
    (g, o) => {
      g.save();
      g.translate(0, -100);
      g.rotate(Math.sin((o.t || 0) * 0.3) * 0.1);
      R(g, -40, -40, 80, 80, 6, MT.E2B33A);
      for (const s of [-1, 1]) {
        R(g, s > 0 ? 50 : -200, -30, 150, 60, 2, MT.VALUE_2A4A8A);
        g.strokeStyle = MT.VALUE_8AB0E0;
        g.lineWidth = 1.5;
        for (let i = 1; i < 5; i++) line(g, (s > 0 ? 50 : -200) + i * 30, -30, (s > 0 ? 50 : -200) + i * 30, 30, 1.5, MT.VALUE_8AB0E0);
        line(g, s * 40, 0, s * 50, 0, 4, MT.VALUE_9AA3AB);
      }
      line(g, 0, -40, 0, -80, 3, MT.VALUE_9AA3AB);
      circle(g, 0, -84, 10, MT.CFD6DE);
      g.restore();
    },
    [MT.VU_TRU],
  );
  A(
    MT.SUBMARINE,
    MT.TAU_NGAM,
    MT.WATERCRAFT,
    [620, 220],
    (g, o) => {
      const col = o.color || MT.VALUE_3A4A52;
      const bob = Math.sin((o.t || 0) * 1.2) * 4;
      g.save();
      g.translate(0, -90 + bob);
      ell(g, 0, 0, 300, 70, col);
      R(g, -60, -140, 140, 90, 20, C.shade(col, -0.1));
      line(g, 40, -140, 40, -200, 6, MT.VALUE_2A3036);
      line(g, 40, -200, 70, -200, 6, MT.VALUE_2A3036);
      for (let i = 0; i < 5; i++) circle(g, -180 + i * 80, -6, 12, o.night ? MT.F2C374 : MT.VALUE_1D262C);
      poly(
        g,
        [
          [-300, 0],
          [-350, -60],
          [-350, 60],
        ],
        C.shade(col, -0.2),
      );
      g.restore();
    },
    [MT.BIEN, MT.QUAN_DOI, MT.DUOI_NUOC],
  );
  A(
    MT.PIRATE_SHIP,
    MT.THUYEN_BUOM_CUOP_BIEN,
    MT.WATERCRAFT,
    [700, 760],
    (g, o) => {
      const bob = Math.sin((o.t || 0) * 1.3) * 6;
      const rock = Math.sin((o.t || 0) * 1.1) * 0.02;
      g.save();
      g.translate(0, bob);
      g.rotate(rock);
      const wood = o.color || MT.VALUE_5A3A22;
      poly(
        g,
        [
          [-330, -200],
          [330, -230],
          [280, -40],
          [-260, -30],
        ],
        wood,
      );
      R(g, -330, -260, 160, 60, 0, C.shade(wood, 0.1));
      for (let i = 0; i < 5; i++) R(g, -180 + i * 90, -150, 30, 22, 3, MT.VALUE_1A120C);
      R(g, -320, -205, 650, 10, 0, MT.C9A23A);
      for (const [x, h] of [
        [-120, 470],
        [100, 560],
      ]) {
        line(g, x, -220, x, -220 - h, 10, MT.VALUE_3A2A1E);
        const sail = o.sailColor || MT.ECE2C6;
        g.fillStyle = sail;
        g.beginPath();
        g.moveTo(x - 140, -220 - h + 60);
        g.quadraticCurveTo(x + 40, -220 - h + 140, x + 140, -220 - h + 60);
        g.lineTo(x + 130, -260);
        g.quadraticCurveTo(x + 20, -230, x - 130, -260);
        g.closePath();
        g.fill();
      }
      g.fillStyle = MT.VALUE_111;
      g.beginPath();
      g.moveTo(100, -780);
      g.lineTo(190, -760 + Math.sin((o.t || 0) * 4) * 6);
      g.lineTo(100, -730);
      g.fill();
      circle(g, 140, -757, 9, MT.F2F2EE);
      g.restore();
    },
    [MT.CUOP_BIEN, MT.BIEN, MT.PHIEU_LUU],
  );
  A(
    MT.SNOWY_PINE,
    MT.THONG_PHU_TUYET,
    MT.NATURE,
    [200, 440],
    (g, o) => {
      ME.drawAsset(g, MT.TREE_PINE, 0, 0, Object.assign({}, o, { color: o.color || MT.VALUE_24402E }));
      for (let i = 0; i < 5; i++) {
        const y = -60 - i * 68,
          w = 95 - i * 15;
        poly(
          g,
          [
            [-w, y],
            [-w * 0.6, y - 18],
            [w * 0.2, y - 30],
            [w * 0.7, y - 14],
            [w, y],
          ],
          MT.RGBA_244_248_252_0_92,
        );
      }
      poly(
        g,
        [
          [-14, -400],
          [0, -420],
          [14, -400],
        ],
        MT.F4F8FC,
      );
    },
    [MT.TUYET, MT.MUA_DONG, MT.CAY],
  );
  A(
    MT.CORAL,
    MT.SAN_HO,
    MT.NATURE,
    [220, 180],
    (g, o) => {
      const cols = [o.color || MT.F06A6A, MT.F2A24A, MT.C46AD0];
      const r = U.rng(5 + (o.seed || 0));
      for (let k = 0; k < 3; k++) {
        const x0 = -70 + k * 70;
        const col = cols[k % 3];
        const branch = (x, y, a, len, w, d) => {
          const x1 = x + Math.cos(a) * len,
            y1 = y + Math.sin(a) * len;
          line(g, x, y, x1, y1, w, col);
          if (d > 0) {
            branch(x1, y1, a - 0.45 - r() * 0.2, len * 0.75, w * 0.75, d - 1);
            branch(x1, y1, a + 0.45 + r() * 0.2, len * 0.75, w * 0.75, d - 1);
          } else circle(g, x1, y1, w * 0.9, C.shade(col, 0.2));
        };
        branch(x0, 0, -PI / 2 + Math.sin((o.t || 0) + k) * 0.05, 50, 12, 3);
      }
    },
    [MT.BIEN, MT.DUOI_NUOC],
  );
  A(
    MT.SEAWEED,
    MT.RONG_BIEN,
    MT.NATURE,
    [120, 300],
    (g, o) => {
      for (let k = 0; k < 4; k++) {
        g.strokeStyle = C.shade(o.color || MT.VALUE_2F8A5A, k * 0.05);
        g.lineWidth = 12 - k;
        g.beginPath();
        g.moveTo(-40 + k * 26, 0);
        for (let y = 0; y > -260 + k * 20; y -= 20) g.lineTo(-40 + k * 26 + Math.sin(y / 40 + (o.t || 0) * 1.5 + k) * 14, y);
        g.stroke();
      }
    },
    [MT.BIEN, MT.DUOI_NUOC],
  );
  A(
    MT.WATERFALL,
    MT.THAC_NUOC,
    MT.NATURE,
    [520, 620],
    (g, o) => {
      poly(
        g,
        [
          [-260, 0],
          [-240, -600],
          [-120, -620],
          [-100, 0],
        ],
        MT.VALUE_5A5A52,
      );
      poly(
        g,
        [
          [100, 0],
          [120, -620],
          [250, -600],
          [260, 0],
        ],
        MT.VALUE_5A5A52,
      );
      const gr = g.createLinearGradient(0, -620, 0, 0);
      gr.addColorStop(0, MT.BFE3F2);
      gr.addColorStop(1, MT.E8F6FB);
      g.fillStyle = gr;
      g.fillRect(-110, -620, 220, 620);
      g.strokeStyle = MT.RGBA_255_255_255_0_7;
      g.lineWidth = 3;
      const t = (o.t || 0) * 300;
      for (let i = 0; i < 14; i++) {
        const x = -100 + i * 15;
        const y = -620 + ((t + i * 47) % 620);
        line(g, x, y, x, y + 60, 3, MT.RGBA_255_255_255_0_75);
      }
      ell(g, 0, -10, 200, 30, MT.RGBA_255_255_255_0_8);
      ME.kit.foliage && ME.kit.foliage(g, -200, -600, 120, 60, 3, MT.VALUE_3E6A38, 10);
      ME.kit.foliage && ME.kit.foliage(g, 200, -600, 120, 60, 9, MT.VALUE_3E6A38, 10);
    },
    [MT.THIEN_NHIEN, MT.RUNG, MT.NUI],
  );
  A(
    MT.VOLCANO,
    MT.NUI_LUA,
    MT.NATURE,
    [1000, 560],
    (g, o) => {
      poly(
        g,
        [
          [-500, 0],
          [-110, -520],
          [110, -520],
          [500, 0],
        ],
        o.color || MT.VALUE_4A3A32,
      );
      poly(
        g,
        [
          [-110, -520],
          [-60, -480],
          [-20, -520],
          [30, -470],
          [110, -520],
          [140, -460],
          [-140, -460],
        ],
        MT.E2552A,
      );
      g.strokeStyle = MT.FF7A2A;
      g.lineWidth = 14;
      g.beginPath();
      g.moveTo(-20, -500);
      g.quadraticCurveTo(-80, -300, -60, -120);
      g.stroke();
      if (o.erupt !== false) {
        for (let i = 0; i < 6; i++) {
          const k = ((o.t || 0) * 0.6 + i / 6) % 1;
          ell(g, Math.sin(i * 2.1) * 60 * k, -540 - k * 260, 60 + k * 120, 40 + k * 80, MF.RGBA_70_64_60(`${0.6 * (1 - k)}`));
        }
        glow(g, 0, -520, 140, MT.FF7A2A, 0.6);
      }
    },
    [MT.THAM_HOA, MT.NUI],
  );
  A(
    MT.PLANET,
    MT.HANH_TINH,
    MT.SKY,
    [400, 400],
    (g, o) => {
      const col = o.color || MT.D8A26A;
      g.save();
      g.translate(0, -200);
      const gr = g.createRadialGradient(-60, -60, 10, 0, 0, 160);
      gr.addColorStop(0, C.shade(col, 0.25));
      gr.addColorStop(1, C.shade(col, -0.45));
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, 150, 0, PI * 2);
      g.fill();
      g.strokeStyle = MT.RGBA_0_0_0_0_12;
      g.lineWidth = 10;
      for (const y of [-60, 0, 50]) {
        g.beginPath();
        g.ellipse(0, y, 145 - Math.abs(y) * 0.5, 12, 0, 0, PI * 2);
        g.stroke();
      }
      if (o.ring !== false) {
        g.strokeStyle = MT.RGBA_230_210_170_0_75;
        g.lineWidth = 12;
        g.beginPath();
        g.ellipse(0, 0, 230, 46, -0.25, 0.2, PI - 0.2, true);
        g.stroke();
      }
      g.restore();
    },
    [MT.VU_TRU],
  );
  A(
    MT.EARTH,
    MT.TRAI_DAT,
    MT.SKY,
    [400, 400],
    (g) => {
      g.save();
      g.translate(0, -200);
      circle(g, 0, 0, 160, MT.VALUE_2A6AB0);
      g.fillStyle = MT.VALUE_4A9A4A;
      for (const [x, y, rx, ry] of [
        [-60, -40, 60, 40],
        [50, 30, 50, 70],
        [-30, 80, 40, 20],
        [80, -80, 30, 24],
      ])
        ell(g, x, y, rx, ry, MT.VALUE_4A9A4A);
      const gr = g.createRadialGradient(-50, -50, 20, 0, 0, 170);
      gr.addColorStop(0, MT.RGBA_255_255_255_0_15);
      gr.addColorStop(1, MT.RGBA_0_0_30_0_45);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, 160, 0, PI * 2);
      g.fill();
      g.restore();
    },
    [MT.VU_TRU, MT.THE_GIOI],
  );
  A(
    MT.SHARK,
    MT.CA_MAP,
    MT.ANIMAL,
    [420, 200],
    (g, o) => {
      const col = o.color || MT.VALUE_6A7A88;
      const sw = Math.sin((o.t || 0) * 5) * 0.12;
      g.save();
      g.translate(0, -100);
      ell(g, 0, 0, 190, 46, col);
      ell(g, 10, 14, 170, 26, MT.E8ECEF);
      poly(
        g,
        [
          [-20, -40],
          [30, -120],
          [60, -40],
        ],
        col,
      );
      g.save();
      g.translate(-180, 0);
      g.rotate(sw);
      poly(
        g,
        [
          [0, 0],
          [-80, -70],
          [-60, 0],
          [-80, 60],
        ],
        col,
      );
      g.restore();
      poly(
        g,
        [
          [20, 30],
          [60, 80],
          [80, 30],
        ],
        C.shade(col, -0.15),
      );
      circle(g, 140, -10, 6, MT.VALUE_111);
      for (let i = 0; i < 3; i++) line(g, 90 - i * 12, -14, 86 - i * 12, 14, 2, C.shade(col, -0.3));
      g.restore();
    },
    [MT.BIEN, MT.DUOI_NUOC, MT.NGUY_HIEM],
  );
  A(
    MT.FISH_SCHOOL,
    MT.DAN_CA,
    MT.ANIMAL,
    [500, 260],
    (g, o) => {
      const r = U.rng(7 + (o.seed || 0));
      for (let i = 0; i < 22; i++) {
        const x = (r() - 0.5) * 460 + Math.sin((o.t || 0) * 1.5 + i) * 10,
          y = -40 - r() * 200 + Math.cos((o.t || 0) * 2 + i) * 6;
        const col = o.color || [MT.F2C14E, MT.VALUE_4AB0E0, MT.F27A4A][i % 3];
        ell(g, x, y, 16, 7, col);
        poly(
          g,
          [
            [x - 14, y],
            [x - 26, y - 8],
            [x - 26, y + 8],
          ],
          col,
        );
      }
    },
    [MT.BIEN, MT.DUOI_NUOC],
  );
  A(
    MT.ELEPHANT,
    MT.VOI,
    MT.ANIMAL,
    [420, 360],
    (g, o) => {
      const col = o.color || MT.VALUE_8A8A8E;
      legs4(g, o, [-110, -80, 70, 100], -150, 150, 42, C.shade(col, -0.1), 3);
      ell(g, 0, -200, 170, 100, col);
      ell(g, 160, -230, 70, 70, col);
      ell(g, 120, -230, 50, 70, C.shade(col, -0.12));
      g.strokeStyle = col;
      g.lineWidth = 28;
      g.lineCap = MT.ROUND;
      g.beginPath();
      g.moveTo(215, -220);
      g.quadraticCurveTo(250, -120, 230, -60 + Math.sin((o.t || 0) * 2) * 10);
      g.stroke();
      line(g, 200, -195, 240, -170, 8, MT.F2ECE0);
      circle(g, 185, -250, 5, MT.VALUE_111);
    },
    [MT.THU_2, MT.RUNG, MT.THAI_LAN],
  );
  A(
    MT.DEER,
    MT.HUOU,
    MT.ANIMAL,
    [240, 260],
    (g, o) => {
      const col = o.color || MT.A0683A;
      legs4(g, o, [-50, -38, 40, 52], -100, 100, 8, C.shade(col, -0.15), 6);
      ell(g, 0, -116, 70, 30, col);
      poly(
        g,
        [
          [50, -130],
          [80, -190],
          [100, -186],
          [76, -120],
        ],
        col,
      );
      ell(g, 100, -190, 22, 13, col, 0.4);
      g.strokeStyle = MT.VALUE_6A4A2A;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(90, -200);
      g.lineTo(80, -250);
      g.moveTo(84, -230);
      g.lineTo(66, -245);
      g.moveTo(98, -200);
      g.lineTo(112, -248);
      g.moveTo(108, -232);
      g.lineTo(124, -244);
      g.stroke();
    },
    [MT.THU_2, MT.RUNG],
  );
  A(
    MT.PIG,
    MT.HEO,
    MT.ANIMAL,
    [200, 120],
    (g, o) => {
      const col = o.color || MT.F0B0A8;
      legs4(g, o, [-40, -28, 30, 42], -40, 40, 12, C.shade(col, -0.1), 6);
      ell(g, 0, -58, 70, 36, col);
      ell(g, 72, -62, 18, 16, C.shade(col, 0.05));
      circle(g, 60, -76, 3, MT.VALUE_111);
      poly(
        g,
        [
          [46, -86],
          [52, -104],
          [62, -88],
        ],
        col,
      );
    },
    [MT.THU_2, MT.NONG_TRAI],
  );
  A(
    MT.SHEEP,
    MT.CUU,
    MT.ANIMAL,
    [200, 140],
    (g, o) => {
      legs4(g, o, [-40, -28, 30, 42], -44, 44, 8, MT.VALUE_3A3A3A, 6);
      for (let i = 0; i < 8; i++) circle(g, -50 + (i % 4) * 32, -70 - Math.floor(i / 4) * 20, 26, MT.F2EFE6);
      ell(g, 72, -76, 18, 22, MT.VALUE_3A3A3A);
    },
    [MT.THU_2, MT.NONG_TRAI],
  );
  A(
    MT.EAGLE,
    MT.DAI_BANG,
    MT.ANIMAL,
    [360, 200],
    (g, o) => {
      const flap = Math.sin((o.t || 0) * 6);
      g.save();
      g.translate(0, -100);
      poly(
        g,
        [
          [-30, -6],
          [30, -6],
          [10 - flap * 10, -40 - flap * 60],
          [-90, -30 - flap * 50],
        ],
        MT.VALUE_3A2412,
      );
      ell(g, 0, 0, 62, 20, MT.VALUE_5A3A22);
      poly(
        g,
        [
          [-62, 0],
          [-110, -14],
          [-110, 14],
        ],
        MT.F2EFE6,
      );
      circle(g, 60, -12, 16, MT.F2EFE6);
      poly(
        g,
        [
          [72, -14],
          [92, -6],
          [74, -2],
        ],
        MT.E2B33A,
      );
      circle(g, 64, -16, 2.5, MT.VALUE_111);
      poly(
        g,
        [
          [-30, 2],
          [30, 2],
          [40 + flap * 10, 40 + flap * 70],
          [-80, 30 + flap * 60],
        ],
        MT.VALUE_4A2E1A,
      );
      g.restore();
    },
    [MT.CHIM, MT.TROI],
  );
  A(
    MT.CAMEL,
    MT.LAC_DA,
    MT.ANIMAL,
    [300, 300],
    (g, o) => {
      const col = o.color || MT.C9A26A;
      legs4(g, o, [-60, -46, 50, 64], -150, 150, 12, C.shade(col, -0.15), 4);
      ell(g, 0, -170, 90, 40, col);
      ell(g, -20, -215, 36, 30, col);
      ell(g, 30, -210, 30, 26, col);
      g.strokeStyle = col;
      g.lineWidth = 22;
      g.lineCap = MT.ROUND;
      g.beginPath();
      g.moveTo(80, -180);
      g.quadraticCurveTo(130, -200, 120, -260);
      g.stroke();
      ell(g, 134, -266, 28, 15, col, 0.2);
      circle(g, 140, -272, 3, MT.VALUE_111);
    },
    [MT.SA_MAC, MT.THU_2],
  );
  const stoneWall = (g, x, y, w, h, col, seed) => {
    R(g, x, y, w, h, 0, col);
    const r = U.rng(seed || 3);
    g.strokeStyle = C.shade(col, -0.2);
    g.lineWidth = 2;
    for (let yy = y + 30; yy < y + h; yy += 30) {
      g.beginPath();
      g.moveTo(x, yy);
      g.lineTo(x + w, yy);
      g.stroke();
      const off = ((yy - y) / 30) % 2 ? 30 : 0;
      for (let xx = x + off; xx < x + w; xx += 60) {
        g.beginPath();
        g.moveTo(xx, yy - 30);
        g.lineTo(xx, yy);
        g.stroke();
      }
    }
    for (let i = 0; i < 10; i++) {
      g.fillStyle = MF.RGBA_0_0_0(`${0.04 + r() * 0.05}`);
      g.fillRect(x + r() * w, y + r() * h, 40 + r() * 80, 20 + r() * 50);
    }
  };
  const crenel = (g, x, y, w, col) => {
    for (let xx = x; xx < x + w - 10; xx += 40) R(g, xx, y - 30, 24, 30, 0, col);
  };
  A(
    MT.CASTLE_TOWER,
    MT.THAP_LAU_DAI,
    MT.URBAN,
    [260, 900],
    (g, o) => {
      const col = o.color || MT.VALUE_8F8A80;
      stoneWall(g, -100, -700, 200, 700, col, 4);
      R(g, -120, -720, 240, 30, 0, C.shade(col, -0.1));
      poly(
        g,
        [
          [-130, -720],
          [0, -900],
          [130, -720],
        ],
        o.roof || MT.VALUE_3A4A7A,
      );
      line(g, 0, -900, 0, -960, 4, MT.VALUE_3A3A3A);
      g.fillStyle = o.flag || MT.C42A2A;
      g.beginPath();
      g.moveTo(0, -960);
      g.lineTo(60, -945 + Math.sin((o.t || 0) * 4) * 5);
      g.lineTo(0, -930);
      g.fill();
      for (const y of [-560, -380]) {
        R(g, -18, y, 36, 70, 18, o.night ? MT.F2C374 : MT.VALUE_1A1A1E);
      }
    },
    [MT.LAU_DAI, MT.CO_TICH, MT.TRUNG_CO],
  );
  A(
    MT.CASTLE,
    MT.LAU_DAI_2,
    MT.URBAN,
    [1300, 1000],
    (g, o) => {
      const col = o.color || MT.VALUE_8F8A80;
      stoneWall(g, -500, -440, 1000, 440, col, 8);
      crenel(g, -500, -440, 1000, col);
      R(g, -110, -260, 220, 260, 110, MT.VALUE_2A1E16);
      g.strokeStyle = MT.VALUE_1A120C;
      g.lineWidth = 4;
      for (let x = -90; x < 110; x += 30) line(g, x, -250, x, 0, 4, MT.VALUE_4A3A2A);
      for (const x of [-560, 440]) {
        ME.drawAsset(g, MT.CASTLE_TOWER, x + 60, 0, o, 0.85);
      }
      ME.drawAsset(g, MT.CASTLE_TOWER, 0, -440, Object.assign({}, o, { flag: o.flag || MT.E2B33A }), 0.6);
      for (const x of [-330, -220, 220, 330]) R(g, x - 16, -340, 32, 60, 16, o.night ? MT.F2C374 : MT.VALUE_1A1A1E);
    },
    [MT.LAU_DAI, MT.CO_TICH, MT.HOANG_GIA],
  );
  A(
    MT.COTTAGE,
    MT.NHA_TRANH_NHA_GO,
    MT.URBAN,
    [460, 420],
    (g, o) => {
      const wall = o.color || MT.C9B08A;
      R(g, -200, -230, 400, 230, 0, wall);
      for (let y = -220; y < 0; y += 26) line(g, -200, y, 200, y, 2, C.shade(wall, -0.15));
      poly(
        g,
        [
          [-240, -220],
          [0, -410],
          [240, -220],
        ],
        o.roof || MT.A07A3A,
      );
      g.strokeStyle = C.shade(o.roof || MT.A07A3A, -0.25);
      g.lineWidth = 2;
      for (let i = 1; i < 6; i++) line(g, -240 + i * 40, -220, -240 + i * 40 + 30, -250, 2, C.shade(o.roof || MT.A07A3A, -0.25));
      R(g, -40, -150, 80, 150, 6, MT.VALUE_5A3A22);
      R(g, -160, -170, 70, 60, 4, o.night ? MT.F2C374 : MT.VALUE_9FB8C9);
      R(g, 90, -170, 70, 60, 4, o.night ? MT.F2C374 : MT.VALUE_9FB8C9);
      R(g, 120, -400, 40, 110, 0, MT.VALUE_6A5A4A);
    },
    [MT.LANG, MT.CO_TICH, MT.NONG_THON],
  );
  A(
    MT.SALOON,
    MT.QUAN_RUOU_MIEN_TAY,
    MT.URBAN,
    [560, 520],
    (g, o) => {
      const wood = o.color || MT.VALUE_9A6A3A;
      R(g, -260, -500, 520, 500, 0, wood);
      for (let x = -250; x < 260; x += 24) line(g, x, -500, x, 0, 2, C.shade(wood, -0.15));
      R(g, -270, -520, 540, 30, 0, C.shade(wood, -0.25));
      R(g, -200, -470, 400, 60, 4, MT.ECE2C6);
      g.fillStyle = MT.VALUE_3A1A10;
      g.font = MT.BOLD_44PX_SERIF;
      g.textAlign = MT.CENTER;
      g.fillText(o.sign || MT.SALOON_2, 0, -425);
      R(g, -280, -260, 560, 16, 0, C.shade(wood, -0.3));
      for (const x of [-260, 260]) R(g, x - 8, -260, 16, 260, 0, C.shade(wood, -0.3));
      R(g, -60, -200, 50, 120, 0, C.shade(wood, -0.35));
      R(g, 10, -200, 50, 120, 0, C.shade(wood, -0.35));
      for (const x of [-200, 140]) R(g, x, -360, 70, 80, 2, o.night ? MT.F2C374 : MT.VALUE_3A3A3A);
    },
    [MT.MIEN_TAY, MT.CAO_BOI],
  );
  A(
    MT.PALACE_GATE,
    MT.CONG_THANH_NGO_MON,
    MT.URBAN,
    [1100, 700],
    (g, o) => {
      const wall = o.color || MT.B03A2A;
      R(g, -540, -300, 1080, 300, 0, MT.VALUE_8A7A6A);
      for (const x of [-300, 0, 300]) R(g, x - 70, -220, 140, 220, 70, MT.VALUE_2A1E16);
      R(g, -420, -360, 840, 60, 0, wall);
      for (let x = -400; x <= 400; x += 100) R(g, x - 12, -500, 24, 140, 0, wall);
      const roof = (y, w, h) => {
        g.fillStyle = o.roof || MT.D9A83A;
        g.beginPath();
        g.moveTo(-w / 2 - 40, y + 10);
        g.quadraticCurveTo(-w / 2, y, -w / 2 + 40, y - h);
        g.lineTo(w / 2 - 40, y - h);
        g.quadraticCurveTo(w / 2, y, w / 2 + 40, y + 10);
        g.closePath();
        g.fill();
      };
      roof(-500, 900, 80);
      R(g, -300, -600, 600, 50, 0, wall);
      roof(-600, 700, 70);
      R(g, -60, -430, 120, 50, 4, MT.VALUE_1A3A6A);
    },
    [MT.VIET_NAM, MT.HUE, MT.CUNG_DIEN, MT.CO_DAI],
  );
  A(
    MT.IGLOO,
    MT.LEU_TUYET_IGLOO,
    MT.URBAN,
    [380, 190],
    (g) => {
      g.save();
      g.beginPath();
      g.ellipse(0, 0, 150, 160, 0, PI, 0);
      g.closePath();
      g.fillStyle = MT.EEF4FA;
      g.fill();
      g.clip();
      for (let y = -32, row = 0; y > -170; y -= 32, row++) {
        line(g, -160, y, 160, y, 2, MT.C9D6E2);
        for (let x = -150 + (row % 2) * 30; x < 160; x += 60) line(g, x, y, x, y + 32, 2, MT.C9D6E2);
      }
      g.restore();
      g.beginPath();
      g.ellipse(120, 0, 56, 64, 0, PI, 0);
      g.fillStyle = MT.E2EAF2;
      g.fill();
      g.beginPath();
      g.ellipse(132, 0, 28, 42, 0, PI, 0);
      g.fillStyle = MT.VALUE_2A3446;
      g.fill();
    },
    [MT.TUYET, MT.BAC_CUC],
  );
  A(
    MT.PYRAMID,
    MT.KIM_TU_THAP,
    MT.URBAN,
    [1000, 560],
    (g, o) => {
      poly(
        g,
        [
          [-500, 0],
          [0, -540],
          [500, 0],
        ],
        o.color || MT.D8B878,
      );
      poly(
        g,
        [
          [0, -540],
          [500, 0],
          [80, 0],
        ],
        C.shade(o.color || MT.D8B878, -0.18),
      );
      g.strokeStyle = MT.RGBA_0_0_0_0_12;
      g.lineWidth = 2;
      for (let y = -40; y > -540; y -= 40) {
        const w = (1 + y / 540) * 500;
        line(g, -w, y, w, y, 2, MT.RGBA_0_0_0_0_12);
      }
    },
    [MT.AI_CAP, MT.CO_DAI, MT.SA_MAC],
  );
  A(
    MT.TEMPLE_COLUMNS,
    MT.DEN_COT_HY_LAP_LA_MA,
    MT.URBAN,
    [900, 620],
    (g, o) => {
      const col = o.color || MT.E6E0D2;
      R(g, -440, -40, 880, 40, 0, C.shade(col, -0.1));
      R(g, -420, -70, 840, 30, 0, C.shade(col, -0.05));
      for (let i = 0; i < 8; i++) {
        const x = -360 + i * 103;
        R(g, x - 26, -470, 52, 400, 0, col);
        for (let k = -18; k <= 18; k += 12) line(g, x + k, -460, x + k, -80, 2, C.shade(col, -0.12));
        R(g, x - 34, -490, 68, 20, 0, C.shade(col, 0.05));
      }
      R(g, -440, -540, 880, 50, 0, col);
      poly(
        g,
        [
          [-460, -540],
          [0, -640],
          [460, -540],
        ],
        C.shade(col, -0.05),
      );
    },
    [MT.CO_DAI, MT.HY_LAP, MT.LA_MA, MT.BAO_TANG],
  );
  A(
    MT.RUINED_WALL,
    MT.TUONG_DO_NAT,
    MT.URBAN,
    [600, 380],
    (g, o) => {
      const col = o.color || MT.VALUE_8A8378;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-300, 0);
      g.lineTo(-300, -300);
      g.lineTo(-220, -340);
      g.lineTo(-160, -250);
      g.lineTo(-60, -280);
      g.lineTo(0, -160);
      g.lineTo(80, -200);
      g.lineTo(160, -110);
      g.lineTo(300, -140);
      g.lineTo(300, 0);
      g.closePath();
      g.fill();
      R(g, -220, -220, 60, 80, 0, MT.VALUE_2A2622);
      ME.drawAsset(g, MT.RUBBLE, 180, 0, o, 0.8);
    },
    [MT.CHIEN_TRANH, MT.DO_NAT, MT.THAM_HOA],
  );
  A(
    MT.STADIUM_STAND,
    MT.KHAN_DAI_SAN_VAN_DONG,
    MT.URBAN,
    [1400, 520],
    (g, o) => {
      const r = U.rng(11);
      for (let row = 0; row < 8; row++) {
        const y = -60 - row * 56;
        R(g, -700, y, 1400, 56, 0, row % 2 ? MT.VALUE_3A4A6A : MT.VALUE_33425F);
        for (let x = -690; x < 700; x += 22) {
          const c = [MT.E24A3A, MT.F2C14E, MT.F2F2EE, MT.VALUE_3A7BD5, MT.VALUE_1AA260, MT.VALUE_2A2A2A][Math.floor(r() * 6)];
          const jump = o.cheer ? Math.abs(Math.sin((o.t || 0) * 6 + x)) * 6 : 0;
          circle(g, x, y + 16 - jump, 8, c);
          R(g, x - 8, y + 22 - jump, 16, 24, 4, C.shade(c, -0.2));
        }
      }
      R(g, -700, -40, 1400, 40, 0, MT.E9E2CC);
    },
    [MT.THE_THAO, MT.BONG_DA, MT.DAM_DONG],
  );
  A(
    MT.WELL,
    MT.GIENG_NUOC,
    MT.STREET,
    [220, 300],
    (g) => {
      R(g, -90, -100, 180, 100, 10, MT.VALUE_8A8378);
      for (let y = -90; y < 0; y += 22) line(g, -90, y, 90, y, 2, MT.VALUE_6A645A);
      line(g, -80, -100, -80, -250, 10, MT.VALUE_5A3A22);
      line(g, 80, -100, 80, -250, 10, MT.VALUE_5A3A22);
      poly(
        g,
        [
          [-110, -240],
          [0, -300],
          [110, -240],
        ],
        MT.VALUE_7A4A2A,
      );
      line(g, 0, -250, 0, -150, 2, MT.VALUE_3A2A1E);
      R(g, -14, -160, 28, 26, 4, MT.VALUE_6A4A2A);
    },
    [MT.LANG, MT.CO_TICH],
  );
  A(
    MT.GOAL_POST,
    MT.KHUNG_THANH_BONG_DA,
    MT.STREET,
    [460, 270],
    (g) => {
      g.strokeStyle = MT.RGBA_255_255_255_0_45;
      g.lineWidth = 1;
      for (let x = -210; x <= 210; x += 20) line(g, x, -240, x + 30, 0, 1, MT.RGBA_255_255_255_0_4);
      for (let y = -240; y <= 0; y += 20) line(g, -210, y, 210, y, 1, MT.RGBA_255_255_255_0_4);
      line(g, -220, 0, -220, -250, 10, MT.F4F4F2);
      line(g, 220, 0, 220, -250, 10, MT.F4F4F2);
      line(g, -220, -250, 220, -250, 10, MT.F4F4F2);
    },
    [MT.THE_THAO, MT.BONG_DA],
  );
  A(
    MT.GRAVESTONE,
    MT.BIA_MO,
    MT.STREET,
    [120, 160],
    (g, o) => {
      const col = o.color || MT.VALUE_8A8A8E;
      R(g, -50, -150, 100, 150, 50, col);
      R(g, -55, -10, 110, 10, 0, C.shade(col, -0.2));
      line(g, 0, -120, 0, -70, 5, C.shade(col, -0.3));
      line(g, -18, -105, 18, -105, 5, C.shade(col, -0.3));
    },
    [MT.NGHIA_TRANG, MT.KINH_DI],
  );
  A(
    MT.BARBED_WIRE,
    MT.HANG_RAO_DAY_THEP_GAI,
    MT.STREET,
    [500, 120],
    (g) => {
      for (const x of [-230, 0, 230]) {
        line(g, x - 30, 0, x + 30, -100, 6, MT.VALUE_4A3A2A);
        line(g, x + 30, 0, x - 30, -100, 6, MT.VALUE_4A3A2A);
      }
      g.strokeStyle = MT.VALUE_6A6A6A;
      g.lineWidth = 2;
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        for (let x = -250; x <= 250; x += 8) g.lineTo(x, -30 - k * 40 + Math.sin(x / 9) * 14);
        g.stroke();
      }
    },
    [MT.CHIEN_TRANH, MT.NHA_TU],
  );
  A(
    MT.SANDBAGS,
    MT.BAO_CAT,
    MT.STREET,
    [320, 120],
    (g) => {
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) ell(g, -120 + row * 30 + i * 60, -18 - row * 32, 32, 18, row % 2 ? MT.A08A62 : MT.B39A6E);
    },
    [MT.CHIEN_TRANH],
  );
  A(
    MT.CANNON,
    MT.KHAU_PHAO_CO,
    MT.STREET,
    [320, 160],
    (g, o) => {
      for (const x of [-40]) {
        circle(g, x, -46, 46, MT.VALUE_5A3A22);
        circle(g, x, -46, 10, MT.VALUE_2A1A10);
      }
      g.save();
      g.translate(-40, -70);
      g.rotate(-0.18);
      R(g, -40, -24, 200, 48, 22, MT.VALUE_2A2C30);
      R(g, 150, -28, 20, 56, 6, MT.VALUE_1A1C20);
      g.restore();
      if (o.fire) glow(g, 160, -110, 60, MT.FFB04A, 0.9);
    },
    [MT.CUOP_BIEN, MT.CHIEN_TRANH, MT.CO_DAI],
  );
  A(
    MT.STAGE_SPEAKER,
    MT.LOA_SAN_KHAU,
    MT.STREET,
    [140, 260],
    (g) => {
      R(g, -60, -250, 120, 250, 6, MT.VALUE_1A1A1E);
      circle(g, 0, -80, 44, MT.VALUE_2A2A2E);
      circle(g, 0, -80, 22, MT.VALUE_3A3A3E);
      circle(g, 0, -190, 24, MT.VALUE_2A2A2E);
    },
    [MT.AM_NHAC, MT.SAN_KHAU],
  );
  A(
    MT.MICROPHONE_STAND,
    MT.MICRO_DUNG,
    MT.STREET,
    [80, 200],
    (g) => {
      line(g, 0, 0, 0, -170, 4, MT.VALUE_2A2A2E);
      line(g, -24, 0, 24, 0, 5, MT.VALUE_2A2A2E);
      ell(g, 0, -184, 9, 15, MT.VALUE_4A4A4E);
    },
    [MT.AM_NHAC, MT.SAN_KHAU, MT.PHAT_BIEU],
  );
  A(
    MT.WEDDING_ARCH,
    MT.CONG_HOA_CUOI,
    MT.STREET,
    [360, 420],
    (g) => {
      g.strokeStyle = MT.F2EFE6;
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(-160, 0);
      g.lineTo(-160, -260);
      g.arc(0, -260, 160, PI, 0);
      g.lineTo(160, 0);
      g.stroke();
      const r = U.rng(4);
      for (let i = 0; i < 40; i++) {
        const a = PI + r() * PI;
        const side = r();
        const x = side < 0.6 ? Math.cos(a) * 160 : r() < 0.5 ? -160 : 160,
          y = side < 0.6 ? -260 + Math.sin(a) * 160 : -r() * 260;
        circle(g, x, y, 10 + r() * 6, [MT.F2B8C8, MT.F4F2EE, MT.E86A8A][i % 3]);
      }
    },
    [MT.DAM_CUOI, MT.LE_HOI],
  );
  A(
    MT.CHRISTMAS_TREE,
    MT.CAY_THONG_NOEL,
    MT.STREET,
    [240, 440],
    (g, o) => {
      ME.drawAsset(g, MT.TREE_PINE, 0, 0, Object.assign({}, o, { color: MT.VALUE_1F5A32 }));
      const r = U.rng(9);
      for (let i = 0; i < 18; i++) {
        const y = -80 - r() * 300,
          w = (95 - ((-y - 60) / 68) * 15) * 0.8;
        const on = Math.sin((o.t || 0) * 4 + i) > -0.3;
        circle(g, (r() - 0.5) * w * 1.6, y, 7, on ? [MT.F2C14E, MT.E24A3A, MT.VALUE_4AB0E0, MT.F4F2EE][i % 4] : MT.VALUE_3A3A3A);
      }
      poly(
        g,
        [
          [0, -440],
          [10, -415],
          [36, -415],
          [16, -400],
          [24, -375],
          [0, -390],
          [-24, -375],
          [-16, -400],
          [-36, -415],
          [-10, -415],
        ],
        MT.F2D36A,
      );
      ME.drawAsset(g, MT.GIFT_BOX, -60, 0, {}, 0.6);
      ME.drawAsset(g, MT.GIFT_BOX, 60, 0, { color: MT.VALUE_2A6AD0 }, 0.5);
    },
    [MT.GIANG_SINH, MT.LE_HOI, MT.MUA_DONG],
  );
  A(
    MT.RED_LANTERN,
    MT.DEN_LONG_DO_TET,
    MT.STREET,
    [400, 260],
    (g, o) => {
      line(g, -200, -250, 200, -250, 2, MT.VALUE_3A2A1E);
      for (const x of [-140, 0, 140]) {
        const sw = Math.sin((o.t || 0) * 1.5 + x) * 0.06;
        g.save();
        g.translate(x, -250);
        g.rotate(sw);
        line(g, 0, 0, 0, 30, 2, MT.VALUE_3A2A1E);
        ell(g, 0, 90, 50, 60, MT.D42A2A);
        R(g, -30, 24, 60, 10, 2, MT.E2B33A);
        R(g, -30, 146, 60, 10, 2, MT.E2B33A);
        line(g, 0, 156, 0, 200, 4, MT.E2B33A);
        if (o.night) glow(g, 0, 90, 70, MT.FF7A4A, 0.6);
        g.restore();
      }
    },
    [MT.TET, MT.LE_HOI, MT.VIET_NAM, MT.TRUNG_HOA],
  );
  A(
    MT.PEACH_BLOSSOM,
    MT.CANH_DAO_TET,
    MT.NATURE,
    [300, 420],
    (g, o) => {
      line(g, 0, 0, -10, -200, 14, MT.VALUE_4A2E1E);
      line(g, -10, -200, -100, -360, 8, MT.VALUE_4A2E1E);
      line(g, -10, -200, 90, -380, 8, MT.VALUE_4A2E1E);
      line(g, 30, -280, 140, -300, 5, MT.VALUE_4A2E1E);
      const r = U.rng(3 + (o.seed || 0));
      for (let i = 0; i < 46; i++) circle(g, (r() - 0.5) * 280, -200 - r() * 210, 7 + r() * 5, r() < 0.7 ? MT.F2A2B8 : MT.F8D6E0);
    },
    [MT.TET, MT.HOA_2, MT.VIET_NAM],
  );
  A(
    MT.MAI_BLOSSOM,
    MT.CAY_MAI_VANG,
    MT.NATURE,
    [300, 400],
    (g, o) => {
      line(g, 0, 0, 0, -180, 12, MT.VALUE_5A3A22);
      line(g, 0, -180, -90, -330, 7, MT.VALUE_5A3A22);
      line(g, 0, -180, 100, -340, 7, MT.VALUE_5A3A22);
      const r = U.rng(6 + (o.seed || 0));
      for (let i = 0; i < 46; i++) circle(g, (r() - 0.5) * 280, -180 - r() * 200, 6 + r() * 5, r() < 0.8 ? MT.F2C41E : MT.VALUE_7AA04A);
      R(g, -50, -40, 100, 40, 6, MT.VALUE_2A5A8A);
    },
    [MT.TET, MT.HOA_2, MT.VIET_NAM, MT.MIEN_NAM],
  );
  A(
    MT.THRONE,
    MT.NGAI_VANG,
    MT.FURNITURE,
    [240, 360],
    (g, o) => {
      const col = o.color || MT.E2B33A;
      R(g, -90, -340, 180, 340, 30, col);
      R(g, -70, -320, 140, 200, 20, o.cloth || MT.VALUE_8A1A2A);
      R(g, -110, -130, 220, 50, 10, C.shade(col, -0.15));
      R(g, -120, -170, 30, 170, 8, C.shade(col, -0.2));
      R(g, 90, -170, 30, 170, 8, C.shade(col, -0.2));
      circle(g, 0, -350, 18, MT.C42A3A);
    },
    [MT.VUA, MT.HOANG_GIA, MT.CUNG_DIEN],
  );
  A(
    MT.ROYAL_BANNER,
    MT.CO_PHUON_LAU_DAI,
    MT.INTERIOR,
    [140, 420],
    (g, o) => {
      line(g, -70, -420, 70, -420, 6, MT.VALUE_3A2A1E);
      const col = o.color || MT.VALUE_8A1A2A;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-60, -416);
      g.lineTo(60, -416);
      g.lineTo(60, -80);
      g.lineTo(0, -120);
      g.lineTo(-60, -80);
      g.closePath();
      g.fill();
      circle(g, 0, -300, 30, MT.E2B33A);
      poly(
        g,
        [
          [0, -330],
          [12, -300],
          [0, -270],
          [-12, -300],
        ],
        col,
      );
    },
    [MT.LAU_DAI, MT.TRUNG_CO],
  );
  A(
    MT.WALL_TORCH,
    MT.DUOC_TREO_TUONG,
    MT.INTERIOR,
    [80, 160],
    (g, o) => {
      poly(
        g,
        [
          [-10, -60],
          [10, -60],
          [6, -120],
          [-6, -120],
        ],
        MT.VALUE_5A3A22,
      );
      R(g, -12, -126, 24, 10, 2, MT.VALUE_3A3A3A);
      const f = 1 + Math.sin((o.t || 0) * 18) * 0.1;
      ell(g, 0, -150, 14 * f, 26 * f, MT.FFB04A);
      ell(g, 0, -144, 8 * f, 14 * f, MT.FFF2B0);
      glow(g, 0, -146, 90, MT.FFA04A, 0.55);
    },
    [MT.LAU_DAI, MT.HANG_DONG, MT.KINH_DI],
  );
  A(
    MT.AIRPLANE_SEAT,
    MT.GHE_MAY_BAY,
    MT.FURNITURE,
    [120, 220],
    (g, o) => {
      const col = o.color || MT.VALUE_2A3A5A;
      R(g, -50, -210, 50, 170, 14, col);
      R(g, -50, -90, 100, 40, 10, C.shade(col, 0.1));
      R(g, -40, -50, 10, 50, 0, MT.VALUE_5A5D62);
      R(g, 30, -50, 10, 50, 0, MT.VALUE_5A5D62);
      R(g, -50, -210, 50, 30, 10, MT.E9E6DC);
    },
    [MT.MAY_BAY, MT.HANH_KHACH],
  );
  A(
    MT.LAB_BENCH,
    MT.BAN_THI_NGHIEM,
    MT.FURNITURE,
    [360, 220],
    (g, o) => {
      R(g, -170, -110, 340, 16, 0, MT.VALUE_2A2E34);
      R(g, -160, -94, 320, 94, 0, MT.E6E8EA);
      for (const x of [-80, 0, 80]) R(g, x - 36, -84, 72, 70, 4, MT.CFD3D8);
      const cols = [MT.VALUE_4AE2A0, MT.E24AB0, MT.VALUE_4AB0E2];
      for (let i = 0; i < 3; i++) {
        const x = -110 + i * 70;
        poly(
          g,
          [
            [x - 6, -170],
            [x + 6, -170],
            [x + 20, -112],
            [x - 20, -112],
          ],
          MT.RGBA_220_235_245_0_6,
        );
        poly(
          g,
          [
            [x - 12, -140],
            [x + 12, -140],
            [x + 19, -113],
            [x - 19, -113],
          ],
          cols[i],
        );
        if (o.bubbles !== false) circle(g, x + Math.sin((o.t || 0) * 3 + i) * 4, -150 - (((o.t || 0) * 40 + i * 20) % 40), 3, C.rgba(cols[i], 0.7));
      }
      ME.drawAsset(g, MT.COMPUTER, 120, -110, {}, 0.5);
    },
    [MT.KHOA_HOC, MT.PHONG_THI_NGHIEM],
  );
  A(
    MT.STORE_SHELF,
    MT.KE_SIEU_THI,
    MT.FURNITURE,
    [400, 300],
    (g, o) => {
      R(g, -200, -290, 400, 290, 0, MT.D8DCE0);
      const r = U.rng(5 + (o.seed || 0));
      for (let s = 0; s < 4; s++) {
        const y = -20 - s * 70;
        R(g, -200, y, 400, 8, 0, MT.VALUE_9AA3AB);
        for (let x = -190; x < 190; x += 24) {
          const h = 30 + r() * 26;
          R(g, x, y - h, 20, h, 2, [MT.E24A3A, MT.F2C14E, MT.VALUE_3A7BD5, MT.VALUE_1AA260, MT.F27A4A, MT.F2F2EE][Math.floor(r() * 6)]);
        }
      }
    },
    [MT.SIEU_THI, MT.CUA_HANG, MT.MUA_SAM],
  );
  A(
    MT.CASH_REGISTER,
    MT.QUAY_THU_NGAN,
    MT.FURNITURE,
    [320, 200],
    (g) => {
      R(g, -160, -110, 320, 110, 4, MT.VALUE_6A4A32);
      R(g, -160, -120, 320, 12, 0, MT.VALUE_3A2A1E);
      R(g, 40, -180, 90, 60, 6, MT.VALUE_2A2A2E);
      R(g, 50, -172, 70, 30, 2, MT.VALUE_4AE2A0);
    },
    [MT.SIEU_THI, MT.CUA_HANG],
  );
  A(
    MT.PIANO,
    MT.DAN_PIANO,
    MT.FURNITURE,
    [360, 260],
    (g, o) => {
      const col = o.color || MT.VALUE_141416;
      R(g, -170, -250, 340, 150, 10, col);
      R(g, -170, -110, 340, 24, 0, C.shade(col, 0.1));
      for (let x = -165; x < 165; x += 16) R(g, x, -110, 14, 22, 1, MT.F4F4F2);
      for (let x = -158; x < 160; x += 16) if ((Math.floor((x + 158) / 16) % 7) % 3 !== 2) R(g, x + 8, -110, 8, 13, 1, MT.VALUE_111);
      R(g, -160, -86, 14, 86, 0, col);
      R(g, 146, -86, 14, 86, 0, col);
    },
    [MT.AM_NHAC],
  );
  A(
    MT.ALTAR_VN,
    MT.BAN_THO_GIA_TIEN,
    MT.FURNITURE,
    [360, 360],
    (g, o) => {
      R(g, -170, -200, 340, 200, 4, MT.VALUE_7A2A1A);
      R(g, -180, -210, 360, 16, 2, MT.C9A23A);
      R(g, -140, -180, 280, 150, 6, MT.VALUE_5A1A10);
      ME.drawAsset(g, MT.PICTURE_FRAME, 0, -260, {}, 0.6);
      for (const x of [-110, 110]) {
        R(g, x - 8, -270, 16, 60, 2, MT.F2E6C8);
        ell(g, x, -276, 5, 9, MT.FFB04A);
        if (o.night !== false) glow(g, x, -276, 40, MT.FFB04A, 0.5);
      }
      R(g, -30, -240, 60, 30, 6, MT.C9A23A);
      for (const dx of [-8, 0, 8]) line(g, dx, -240, dx + 4, -290, 2, MT.VALUE_8A3A1A);
      ell(g, -60, -222, 26, 12, MT.F2C14E);
    },
    [MT.VIET_NAM, MT.TET, MT.GIA_DINH, MT.TAM_LINH],
  );
  A(
    MT.COFFIN,
    MT.QUAN_TAI,
    MT.FURNITURE,
    [320, 120],
    (g, o) => {
      poly(
        g,
        [
          [-150, -10],
          [-130, -100],
          [120, -110],
          [160, -60],
          [150, -10],
        ],
        o.color || MT.VALUE_3A2216,
      );
      line(g, -60, -95, -60, -20, 5, MT.C9A23A);
      line(g, -85, -70, -35, -70, 5, MT.C9A23A);
    },
    [MT.TANG_LE, MT.KINH_DI],
  );
  A(
    MT.CAULDRON,
    MT.VAC_PHU_THUY,
    MT.FURNITURE,
    [200, 220],
    (g, o) => {
      ME.drawAsset(g, MT.CAMPFIRE, 0, 0, o, 0.7);
      ell(g, 0, -90, 90, 70, MT.VALUE_1E1E22);
      ell(g, 0, -150, 90, 16, MT.VALUE_3A3A3E);
      ell(g, 0, -152, 80, 12, o.color || MT.VALUE_5AE26A);
      for (let i = 0; i < 4; i++) {
        const k = ((o.t || 0) * 0.8 + i / 4) % 1;
        circle(g, Math.sin(i * 2.4) * 40, -160 - k * 120, 10 + k * 18, C.rgba(o.color || MT.VALUE_5AE26A, 0.5 * (1 - k)));
      }
    },
    [MT.PHU_THUY, MT.PHEP_THUAT, MT.KINH_DI],
  );
  A(
    MT.TREASURE_CHEST,
    MT.RUONG_KHO_BAU,
    MT.PROP,
    [200, 160],
    (g, o) => {
      R(g, -90, -90, 180, 90, 6, MT.VALUE_6A4226);
      const open = o.open || 0;
      g.save();
      g.translate(-90, -90);
      g.rotate(-open * 1.6);
      R(g, 0, -50, 180, 50, 24, MT.VALUE_7A4E2C);
      R(g, 0, -6, 180, 8, 0, MT.C9A23A);
      g.restore();
      if (open > 0.2) {
        ell(g, 0, -96, 70, 18, MT.F2C41E);
        glow(g, 0, -110, 120, MT.FFD86A, 0.5 * open);
      }
      R(g, -90, -60, 180, 8, 0, MT.C9A23A);
      R(g, -12, -70, 24, 26, 3, MT.E2B33A);
    },
    [MT.KHO_BAU, MT.CUOP_BIEN, MT.PHIEU_LUU],
  );
  A(
    MT.FOOTBALL,
    MT.QUA_BONG_DA,
    MT.PROP,
    [40, 40],
    (g, o) => {
      g.save();
      g.translate(0, -20);
      g.rotate(spin(o, 20));
      circle(g, 0, 0, 20, MT.F4F4F2);
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * PI) / 5;
        circle(g, Math.cos(a) * 13, Math.sin(a) * 13, 3.4, MT.VALUE_1A1A1A);
      }
      circle(g, 0, 0, 6, MT.VALUE_1A1A1A);
      g.restore();
    },
    [MT.THE_THAO, MT.BONG_DA],
  );
  A(
    MT.GIFT_BOX,
    MT.HOP_QUA,
    MT.PROP,
    [120, 120],
    (g, o) => {
      const col = o.color || MT.D42A3A;
      R(g, -55, -100, 110, 100, 4, col);
      R(g, -60, -110, 120, 24, 4, C.shade(col, 0.1));
      R(g, -8, -110, 16, 110, 0, MT.F2D36A);
      ell(g, -16, -118, 16, 10, MT.F2D36A, -0.4);
      ell(g, 16, -118, 16, 10, MT.F2D36A, 0.4);
    },
    [MT.QUA, MT.GIANG_SINH, MT.SINH_NHAT],
  );
  A(
    MT.BIRTHDAY_CAKE,
    MT.BANH_SINH_NHAT,
    MT.PROP,
    [160, 170],
    (g, o) => {
      R(g, -70, -70, 140, 70, 8, MT.F2D6C0);
      R(g, -70, -78, 140, 18, 8, MT.F4F2EE);
      R(g, -50, -130, 100, 52, 8, MT.F2B8C8);
      R(g, -50, -136, 100, 12, 6, MT.F4F2EE);
      for (const x of [-25, 0, 25]) {
        R(g, x - 3, -162, 6, 26, 1, [MT.VALUE_4AB0E0, MT.F2C14E, MT.E24A3A][(x / 25 + 1) | 0]);
        ell(g, x, -168, 4, 7, MT.FFB04A);
        glow(g, x, -168, 16, MT.FFD27A, 0.6);
      }
    },
    [MT.SINH_NHAT, MT.LE_HOI],
  );
  A(
    MT.BALLOON_BUNCH,
    MT.CHUM_BONG_BAY,
    MT.PROP,
    [180, 360],
    (g, o) => {
      const cols = [MT.E24A3A, MT.F2C14E, MT.VALUE_3A7BD5, MT.VALUE_1AA260, MT.E86AB0];
      for (let i = 0; i < 5; i++) {
        const x = -60 + i * 30 + Math.sin((o.t || 0) * 1.2 + i) * 6,
          y = -260 - (i % 2) * 50;
        line(g, 0, -40, x, y + 40, 1.4, MT.E9E6DC);
        ell(g, x, y, 32, 40, cols[i]);
        ell(g, x - 10, y - 14, 8, 12, MT.RGBA_255_255_255_0_35);
      }
    },
    [MT.LE_HOI, MT.SINH_NHAT, MT.TRE_EM],
  );
  A(
    MT.CRYSTAL_BALL,
    MT.QUA_CAU_PHA_LE,
    MT.PROP,
    [80, 110],
    (g, o) => {
      R(g, -30, -20, 60, 20, 6, MT.VALUE_5A3A22);
      const gr = g.createRadialGradient(-10, -60, 4, 0, -50, 36);
      gr.addColorStop(0, MT.E8D6FF);
      gr.addColorStop(1, MT.VALUE_6A3AB0);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, -52, 34, 0, PI * 2);
      g.fill();
      glow(g, 0, -52, 60 + Math.sin((o.t || 0) * 3) * 8, MT.B08AFF, 0.5);
    },
    [MT.PHEP_THUAT, MT.BOI_TOAN],
  );
  A(
    MT.SCROLL,
    MT.CUON_GIAY_SAC_PHONG,
    MT.PROP,
    [120, 160],
    (g, o) => {
      R(g, -40, -140, 80, 120, 0, o.color || MT.EFE2B8);
      R(g, -50, -150, 100, 14, 7, MT.VALUE_8A5A2A);
      R(g, -50, -26, 100, 14, 7, MT.VALUE_8A5A2A);
      for (let y = -120; y < -40; y += 14) line(g, -26, y, 26, y, 2, MT.RGBA_60_40_20_0_45);
    },
    [MT.CO_DAI, MT.LICH_SU, MT.VIET_NAM],
  );
  A(
    MT.RED_ENVELOPE,
    MT.BAO_LI_XI,
    MT.PROP,
    [60, 80],
    (g) => {
      R(g, -26, -76, 52, 76, 4, MT.D42A2A);
      circle(g, 0, -46, 12, MT.E2B33A);
    },
    [MT.TET, MT.VIET_NAM],
  );
  A(
    MT.SHOPPING_CART,
    MT.XE_DAY_SIEU_THI,
    MT.PROP,
    [180, 160],
    (g, o) => {
      g.strokeStyle = MT.VALUE_9AA3AB;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-80, -140);
      g.lineTo(-60, -50);
      g.lineTo(70, -50);
      g.lineTo(90, -120);
      g.lineTo(-74, -120);
      g.stroke();
      for (let x = -60; x < 80; x += 16) line(g, x, -120, x + 2, -50, 1.5, MT.VALUE_9AA3AB);
      line(g, -80, -140, -100, -150, 4, MT.C42A2A);
      for (const x of [-50, 60]) circle(g, x, -12, 10, MT.VALUE_2A2A2E);
      line(g, -60, -50, -50, -22, 3, MT.VALUE_9AA3AB);
      line(g, 70, -50, 60, -22, 3, MT.VALUE_9AA3AB);
    },
    [MT.SIEU_THI, MT.MUA_SAM],
  );
  A(
    MT.MEDKIT,
    MT.HOP_CUU_THUONG,
    MT.PROP,
    [100, 80],
    (g) => {
      R(g, -46, -70, 92, 70, 8, MT.F2F2EE);
      R(g, -8, -60, 16, 50, 0, MT.D42A2A);
      R(g, -25, -43, 50, 16, 0, MT.D42A2A);
      R(g, -14, -80, 28, 12, 4, MT.VALUE_9AA3AB);
    },
    [MT.Y_TE, MT.CUU_HO],
  );
  A(
    MT.TROPHY_CUP,
    MT.CUP_VO_DICH,
    MT.PROP,
    [100, 170],
    (g) => {
      R(g, -36, -24, 72, 24, 4, MT.VALUE_3A2A1E);
      R(g, -10, -70, 20, 46, 0, MT.E2B33A);
      g.fillStyle = MT.F2C41E;
      g.beginPath();
      g.moveTo(-44, -160);
      g.lineTo(44, -160);
      g.quadraticCurveTo(40, -80, 0, -72);
      g.quadraticCurveTo(-40, -80, -44, -160);
      g.fill();
      g.strokeStyle = MT.E2B33A;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(-46, -130, 18, PI * 0.5, PI * 1.5);
      g.stroke();
      g.beginPath();
      g.arc(46, -130, 18, -PI * 0.5, PI * 0.5);
      g.stroke();
    },
    [MT.THE_THAO, MT.CHIEN_THANG],
  );
  A(
    MT.FIREWORKS,
    MT.PHAO_HOA,
    MT.FX,
    [700, 700],
    (g, o) => {
      const t = o.t || 0;
      const cols = [MT.F2C14E, MT.E24A3A, MT.VALUE_4AB0E0, MT.E86AB0, MT.VALUE_7AE26A];
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.55 + k * 0.27) % 1;
        const cx = -240 + k * 160,
          cy = -420 - (k % 2) * 140;
        const col = cols[k % cols.length];
        if (ph < 0.25) {
          line(g, cx, 0, cx, cy + (1 - ph / 0.25) * -cy, 3, C.rgba(col, 0.8));
          continue;
        }
        const e = (ph - 0.25) / 0.75;
        const rr = 40 + e * 150;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * PI * 2;
          circle(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + e * e * 60, 4 * (1 - e) + 1, C.rgba(col, 1 - e));
        }
        glow(g, cx, cy, rr * 0.8, col, 0.35 * (1 - e));
      }
    },
    [MT.LE_HOI, MT.TET, MT.DEM],
  );
  A(
    MT.EXPLOSION,
    MT.VU_NO,
    MT.FX,
    [500, 500],
    (g, o) => {
      const k = ((o.t || 0) * 0.8) % 1;
      const s = 0.4 + k * 0.9;
      glow(g, 0, -200, 260 * s, MT.FFB04A, 0.8 * (1 - k));
      const r = U.rng(3);
      for (let i = 0; i < 14; i++) {
        const a = r() * PI * 2;
        const d = r() * 120 * s;
        circle(g, Math.cos(a) * d, -200 + Math.sin(a) * d, (40 + r() * 60) * s, i % 3 ? MF.RGBA_255_40(`${120 + r() * 100}`, `${0.8 * (1 - k)}`) : MF.RGBA_60_56_52(`${0.7 * (1 - k * 0.5)}`));
      }
      for (let i = 0; i < 12; i++) {
        const a = r() * PI * 2;
        line(g, Math.cos(a) * 60 * s, -200 + Math.sin(a) * 60 * s, Math.cos(a) * 220 * s, -200 + Math.sin(a) * 220 * s, 3, MF.RGBA_255_220_120(`${1 - k}`));
      }
    },
    [MT.CHIEN_TRANH, MT.HANH_DONG, MT.THAM_HOA],
  );
  A(
    MT.LIGHTNING,
    MT.TIA_SET,
    MT.FX,
    [300, 900],
    (g, o) => {
      const on = Math.sin((o.t || 0) * 7) > 0.85 || o.strike;
      if (!on) return;
      const r = U.rng(Math.floor((o.t || 0) * 3) + 1);
      g.strokeStyle = MT.RGBA_230_240_255_0_95;
      g.lineWidth = 5;
      g.beginPath();
      let x = 0,
        y = -900;
      g.moveTo(x, y);
      while (y < 0) {
        x += (r() - 0.5) * 80;
        y += 40 + r() * 50;
        g.lineTo(x, Math.min(0, y));
      }
      g.stroke();
      glow(g, 0, -450, 300, MT.C8D8FF, 0.35);
    },
    [MT.BAO, MT.THOI_TIET, MT.KINH_DI],
  );
  A(
    MT.MAGIC_GLOW,
    MT.HAO_QUANG_PHEP_THUAT,
    MT.FX,
    [300, 300],
    (g, o) => {
      const t = o.t || 0;
      const col = o.color || MT.B08AFF;
      glow(g, 0, -150, 140 + Math.sin(t * 2) * 20, col, 0.45);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * PI * 2 + t * 0.8;
        const d = 80 + Math.sin(t * 3 + i) * 30;
        const x = Math.cos(a) * d,
          y = -150 + Math.sin(a) * d;
        poly(
          g,
          [
            [x, y - 8],
            [x + 3, y - 3],
            [x + 8, y],
            [x + 3, y + 3],
            [x, y + 8],
            [x - 3, y + 3],
            [x - 8, y],
            [x - 3, y - 3],
          ],
          MT.FFF6C8,
        );
      }
    },
    [MT.PHEP_THUAT, MT.CO_TICH],
  );
  const CH = (id, name, tags, o) => ME.registerCharacter(Object.assign({ id, name, tags, builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [] }, o));
  CH(MT.KING, MT.NHA_VUA, [MT.VUA, MT.HOANG_GIA, MT.CO_TICH], { outfit: MT.ROBE, headwear: MT.CROWN, build: MT.HEAVY, accessories: [MT.CAPE, MT.BEARD], colors: { top: MT.VALUE_7A1A2A, bottom: MT.VALUE_4A1018, accent: MT.E2B33A, cape: MT.VALUE_8A1A2A, hair: MT.VALUE_8A7A6A } });
  CH(MT.QUEEN, MT.HOANG_HAU, [MT.HOANG_GIA, MT.NU, MT.CO_TICH], { gender: MT.FEMALE, outfit: MT.GOWN, headwear: MT.CROWN, hair: MT.LONG, accessories: [MT.CAPE, MT.NECKLACE], colors: { top: MT.VALUE_5A2A7A, accent: MT.E2B33A, cape: MT.VALUE_3A1A5A, hair: MT.VALUE_3A2518 } });
  CH(MT.PRINCE, MT.HOANG_TU, [MT.HOANG_GIA, MT.CO_TICH], { outfit: MT.TUNIC, headwear: MT.TIARA, build: MT.ATHLETIC, accessories: [MT.CAPE, MT.SWORD], colors: { top: MT.VALUE_2A4A8A, bottom: MT.E9E2CC, accent: MT.E2B33A, cape: MT.VALUE_1A2A5A, hat: MT.E2B33A, hair: MT.VALUE_6A4A2A } });
  CH(MT.PRINCESS, MT.CONG_CHUA_2, [MT.HOANG_GIA, MT.NU, MT.CO_TICH], { gender: MT.FEMALE, outfit: MT.GOWN, headwear: MT.TIARA, hair: MT.LONG, accessories: [MT.NECKLACE], colors: { top: MT.E88AB0, accent: MT.F2D36A, hair: MT.E2C26A } });
  CH(MT.KNIGHT, MT.HIEP_SI, [MT.TRUNG_CO, MT.CHIEN_BINH, MT.CO_TICH], { outfit: MT.ARMOR, headwear: MT.KNIGHT_HELMET, build: MT.ATHLETIC, accessories: [MT.SHIELD, MT.SWORD, MT.CAPE], colors: { top: MT.A3ABB3, bottom: MT.VALUE_6A7078, accent: MT.B02A2A, cape: MT.VALUE_8A1A2A, shield: MT.VALUE_2A4A8A, hat: MT.A3ABB3 } });
  CH(MT.CASTLE_GUARD, MT.LINH_GAC_LAU_DAI, [MT.TRUNG_CO, MT.LINH], { outfit: MT.ARMOR, headwear: MT.HELMET, accessories: [MT.SHIELD, MT.SWORD], colors: { top: MT.VALUE_8D949C, bottom: MT.VALUE_5A3A22, hat: MT.VALUE_8D949C, shield: MT.VALUE_8A1A2A } });
  CH(MT.PEASANT, MT.NONG_DAN_THOI_TRUNG_CO, [MT.TRUNG_CO, MT.LANG], { outfit: MT.TUNIC, build: MT.SLIM, accessories: [MT.BEARD], colors: { top: MT.VALUE_8A6A4A, bottom: MT.VALUE_5A4A3A, accent: MT.VALUE_4A3020, hair: MT.VALUE_5A3A22 } });
  CH(MT.WIZARD, MT.PHAP_SU, [MT.PHEP_THUAT, MT.CO_TICH], { outfit: MT.ROBE, headwear: MT.WIZARD_HAT, age: MT.ELDERLY, accessories: [MT.BEARD, MT.STAFF], colors: { top: MT.VALUE_3A2A6A, hat: MT.VALUE_3A2A6A, accent: MT.VALUE_8AD0FF, hair: MT.E8E8E8 } });
  CH(MT.WITCH, MT.PHU_THUY_2, [MT.PHEP_THUAT, MT.KINH_DI, MT.NU], { gender: MT.FEMALE, outfit: MT.ROBE, headwear: MT.WIZARD_HAT, hair: MT.LONG, accessories: [MT.STAFF], colors: { top: MT.VALUE_1E1A24, hat: MT.VALUE_1E1A24, accent: MT.VALUE_7AE26A, hair: MT.VALUE_3A1A2A, skin: MT.D8E2C8 } });
  CH(MT.PIRATE_CAPTAIN, MT.THUYEN_TRUONG_CUOP_BIEN, [MT.CUOP_BIEN, MT.PHIEU_LUU], { outfit: MT.COAT, headwear: MT.TRICORN, build: MT.HEAVY, accessories: [MT.EYEPATCH, MT.BEARD, MT.SWORD], colors: { top: MT.VALUE_8A1A1A, bottom: MT.VALUE_2A2018, hair: MT.VALUE_1A1410 } });
  CH(MT.PIRATE, MT.CUOP_BIEN_2, [MT.CUOP_BIEN, MT.PHIEU_LUU], { outfit: MT.CASUAL, headwear: MT.HEADBAND, accessories: [MT.SWORD, MT.MUSTACHE], colors: { top: MT.E9E2CC, bottom: MT.VALUE_3A2A1E, hat: MT.C42A2A } });
  CH(MT.COWBOY, MT.CAO_BOI_2, [MT.MIEN_TAY, MT.CAO_BOI], { outfit: MT.CASUAL, headwear: MT.COWBOY_HAT, accessories: [MT.VEST, MT.SCARF], colors: { top: MT.C9A26A, bottom: MT.VALUE_3A4A6A, accent: MT.B02A2A, hat: MT.VALUE_8A5A32 } });
  CH(MT.SHERIFF, MT.CANH_SAT_TRUONG_MIEN_TAY, [MT.MIEN_TAY, MT.CANH_SAT], { outfit: MT.CASUAL, headwear: MT.COWBOY_HAT, accessories: [MT.VEST, MT.MEDAL, MT.MUSTACHE], colors: { top: MT.E9E2CC, bottom: MT.VALUE_3A3226, accent: MT.VALUE_5A3A22, hat: MT.VALUE_1A1A1E } });
  CH(MT.EXPLORER, MT.NHA_THAM_HIEM, [MT.PHIEU_LUU, MT.RUNG, MT.KHAO_CO], { outfit: MT.CASUAL, headwear: MT.COWBOY_HAT, accessories: [MT.BACKPACK, MT.SCARF], colors: { top: MT.C9B08A, bottom: MT.VALUE_8A7A5A, hat: MT.A08A5A, accent: MT.B02A2A } });
  CH(MT.CAVEMAN, MT.NGUOI_TIEN_SU, [MT.TIEN_SU, MT.CO_DAI], { outfit: MT.TUNIC, hair: MT.LONG, build: MT.HEAVY, accessories: [MT.BEARD], colors: { top: MT.VALUE_8A5A32, bottom: MT.VALUE_8A5A32, accent: MT.VALUE_5A3A22, hair: MT.VALUE_3A2414, skin: MT.C08A62 } });
  CH(MT.VIKING, MT.CHIEN_BINH_VIKING, [MT.CHIEN_BINH, MT.BAC_AU], { outfit: MT.TUNIC, headwear: MT.HELMET, build: MT.HEAVY, accessories: [MT.BEARD, MT.SHIELD, MT.SWORD], colors: { top: MT.VALUE_6A5A4A, bottom: MT.VALUE_4A3A2A, hat: MT.VALUE_8D949C, shield: MT.VALUE_8A5A2A, hair: MT.C9862A } });
  CH(MT.ROMAN_SOLDIER, MT.LINH_LA_MA, [MT.CO_DAI, MT.LA_MA, MT.CHIEN_BINH], { outfit: MT.ARMOR, headwear: MT.HELMET, accessories: [MT.SHIELD, MT.SWORD, MT.CAPE], colors: { top: MT.C9A23A, bottom: MT.VALUE_8A1A1A, hat: MT.C9A23A, shield: MT.VALUE_8A1A1A, cape: MT.VALUE_8A1A1A } });
  CH(MT.NINJA, MT.NINJA_2, [MT.NHAT_BAN, MT.BI_AN, MT.CHIEN_BINH], { outfit: MT.CASUAL, headwear: MT.HEADBAND, build: MT.ATHLETIC, accessories: [MT.FACE_MASK, MT.SWORD], colors: { top: MT.VALUE_16161A, bottom: MT.VALUE_16161A, hat: MT.VALUE_16161A, mask: MT.VALUE_16161A } });
  CH(MT.SAMURAI, MT.VO_SI_SAMURAI, [MT.NHAT_BAN, MT.CHIEN_BINH, MT.CO_DAI], { outfit: MT.ARMOR, hair: MT.BUN, accessories: [MT.SWORD], colors: { top: MT.VALUE_8A1A1A, bottom: MT.VALUE_1A1A1E, hair: MT.VALUE_141010 } });
  CH(MT.EMPEROR_VN, MT.VUA_TRIEU_NGUYEN, [MT.VIET_NAM, MT.VUA, MT.LICH_SU, MT.HUE], { outfit: MT.ROBE, headwear: MT.KHAN_DONG, accessories: [MT.BEARD], colors: { top: MT.D9A83A, bottom: MT.D9A83A, hat: MT.D9A83A, accent: MT.B02A2A, hair: MT.VALUE_1A1410 } });
  CH(MT.MANDARIN_VN, MT.QUAN_LAI, [MT.VIET_NAM, MT.LICH_SU, MT.QUAN_2], { outfit: MT.ROBE, headwear: MT.KHAN_DONG, age: MT.ELDERLY, accessories: [MT.BEARD], colors: { top: MT.VALUE_2A3A7A, bottom: MT.VALUE_2A3A7A, hat: MT.VALUE_16161A, hair: MT.BDBDBD } });
  CH(MT.GENERAL_VN, MT.TUONG_QUAN_VIET, [MT.VIET_NAM, MT.LICH_SU, MT.CHIEN_BINH], { outfit: MT.ARMOR, headwear: MT.HELMET, build: MT.ATHLETIC, accessories: [MT.CAPE, MT.SWORD, MT.BEARD], colors: { top: MT.VALUE_8A6A3A, bottom: MT.VALUE_5A1A1A, hat: MT.VALUE_8A6A3A, cape: MT.B02A2A, hair: MT.VALUE_141010 } });
  CH(MT.ONG_DO, MT.ONG_DO_CHO_CHU, [MT.VIET_NAM, MT.TET, MT.THU_PHAP], { outfit: MT.ROBE, headwear: MT.KHAN_DONG, age: MT.ELDERLY, accessories: [MT.BEARD, MT.GLASSES], colors: { top: MT.VALUE_5A3A2A, bottom: MT.VALUE_5A3A2A, hat: MT.VALUE_16161A, hair: MT.E8E8E8 } });
  CH(MT.VN_SOLDIER, MT.BO_DOI, [MT.VIET_NAM, MT.QUAN_DOI, MT.LICH_SU], { outfit: MT.MILITARY, headwear: MT.HELMET, accessories: [MT.BACKPACK], colors: { top: MT.VALUE_5A6A3A, bottom: MT.VALUE_5A6A3A, hat: MT.VALUE_6A7A42, accent: MT.VALUE_3A2A1E } });
  CH(MT.STREET_VENDOR_VN, MT.CO_BAN_HANG_RONG, [MT.VIET_NAM, MT.CHO_3, MT.NU], { gender: MT.FEMALE, outfit: MT.AO_DAI_2, headwear: MT.CONICAL, hair: MT.BUN, colors: { top: MT.VALUE_6A8AA0, bottom: MT.VALUE_1A1A1E } });
  CH(MT.AO_DAI_RED, MT.THIEU_NU_AO_DAI_DO_TET, [MT.VIET_NAM, MT.TET, MT.NU, MT.AO_DAI], { gender: MT.FEMALE, outfit: MT.AO_DAI_2, hair: MT.LONG, accessories: [MT.NECKLACE], colors: { top: MT.C42A2A, bottom: MT.F4F2EA, hair: MT.VALUE_141010 } });
  CH(MT.SURGEON, MT.BAC_SI_PHAU_THUAT, [MT.Y_TE, MT.BENH_VIEN_2], { outfit: MT.UNIFORM, headwear: MT.BEANIE, accessories: [MT.FACE_MASK], colors: { top: MT.VALUE_3A8A7A, bottom: MT.VALUE_3A8A7A, hat: MT.VALUE_3A8A7A, accent: MT.VALUE_2A6A5A, mask: MT.CFE3EE } });
  CH(MT.FLIGHT_ATTENDANT, MT.TIEP_VIEN_HANG_KHONG, [MT.HANG_KHONG, MT.NU], { gender: MT.FEMALE, outfit: MT.SUIT, hair: MT.BUN, accessories: [MT.SCARF], colors: { top: MT.VALUE_1F2A44, bottom: MT.VALUE_1F2A44, accent: MT.C42A2A } });
  CH(MT.HACKER, MT.HACKER_2, [MT.CONG_NGHE, MT.BI_AN, MT.TOI_PHAM], { outfit: MT.CASUAL, headwear: MT.HOOD, accessories: [MT.GLASSES], colors: { top: MT.VALUE_1E2126, bottom: MT.VALUE_24262B, hat: MT.VALUE_1E2126 } });
  CH(MT.SCIENTIST_WOMAN, MT.NU_NHA_KHOA_HOC, [MT.KHOA_HOC, MT.NU], { gender: MT.FEMALE, outfit: MT.COAT, hair: MT.PONYTAIL, accessories: [MT.GLASSES], colors: { top: MT.F0F0EC, bottom: MT.VALUE_3A4A6A, hair: MT.VALUE_3A2518 } });
  CH(MT.FOOTBALLER, MT.CAU_THU_BONG_DA, [MT.THE_THAO, MT.BONG_DA], { outfit: MT.SPORT, build: MT.ATHLETIC, number: 10, colors: { top: MT.C42A2A, bottom: MT.F4F4F2, accent: MT.F4F4F2, shoes: MT.VALUE_16161A } });
  CH(MT.RUNNER, MT.VAN_DONG_VIEN, [MT.THE_THAO, MT.NU], { gender: MT.FEMALE, outfit: MT.SPORT, hair: MT.PONYTAIL, build: MT.ATHLETIC, number: 7, colors: { top: MT.VALUE_2A6AD0, bottom: MT.VALUE_16161A, accent: MT.F2C14E } });
  CH(MT.BOXER, MT.VO_SI_QUYEN_ANH, [MT.THE_THAO, MT.VO_THUAT], { outfit: MT.SPORT, headwear: MT.HEADBAND, build: MT.ATHLETIC, number: 1, colors: { top: MT.C42A2A, bottom: MT.C42A2A, accent: MT.F4F4F2, hat: MT.F4F4F2 } });
  CH(MT.SINGER, MT.CA_SI, [MT.AM_NHAC, MT.SAN_KHAU, MT.NU], { gender: MT.FEMALE, outfit: MT.GOWN, hair: MT.LONG, accessories: [MT.NECKLACE], colors: { top: MT.C9A23A, accent: MT.F4F2EE, hair: MT.VALUE_3A1A14 } });
  CH(MT.BRIDE, MT.CO_DAU, [MT.DAM_CUOI, MT.NU], { gender: MT.FEMALE, outfit: MT.GOWN, headwear: MT.TIARA, hair: MT.BUN, accessories: [MT.NECKLACE], colors: { top: MT.F8F6F0, accent: MT.E8DCC0 } });
  CH(MT.GROOM, MT.CHU_RE, [MT.DAM_CUOI], { outfit: MT.SUIT, accessories: [MT.TIE], colors: { top: MT.VALUE_16161A, bottom: MT.VALUE_16161A, accent: MT.E8E4DC } });
  CH(MT.GRADUATE, MT.TAN_CU_NHAN, [MT.GIAO_DUC, MT.TOT_NGHIEP], { outfit: MT.ROBE, headwear: MT.GRAD_CAP, age: MT.TEEN, colors: { top: MT.VALUE_16161A, hat: MT.VALUE_16161A, accent: MT.E2B33A } });
  CH(MT.GENTLEMAN_1900, MT.QUY_ONG_THE_KY_19, [MT.LICH_SU, MT.CO_DIEN], { outfit: MT.SUIT, headwear: MT.TOP_HAT, accessories: [MT.MUSTACHE, MT.VEST], colors: { top: MT.VALUE_2A2A30, bottom: MT.VALUE_4A4A50, accent: MT.VALUE_6A1A1A } });
  CH(MT.LADY_1900, MT.QUY_BA_THE_KY_19, [MT.LICH_SU, MT.CO_DIEN, MT.NU], { gender: MT.FEMALE, outfit: MT.GOWN, hair: MT.BUN, headwear: MT.STRAW_HAT, accessories: [MT.HANDBAG], colors: { top: MT.VALUE_6A8A7A, hat: MT.E8DCC0, accent: MT.VALUE_4A2A3A } });
  CH(MT.PRIEST, MT.LINH_MUC, [MT.TON_GIAO], { outfit: MT.ROBE, accessories: [MT.NECKLACE, MT.GLASSES], colors: { top: MT.VALUE_16161A, bottom: MT.VALUE_16161A, hair: MT.VALUE_9A9A9A } });
  CH(MT.MUSLIM_WOMAN, MT.PHU_NU_DOI_KHAN, [MT.TRUNG_DONG, MT.NU], { gender: MT.FEMALE, outfit: MT.DRESS, headwear: MT.HIJAB, colors: { top: MT.VALUE_4A5A7A, bottom: MT.VALUE_2A2A34, hat: MT.VALUE_3A4A6A } });
  CH(MT.INDIAN_MAN, MT.NGUOI_DAN_ONG_AN_DO, [MT.AN_DO], { outfit: MT.TUNIC, headwear: MT.TURBAN, accessories: [MT.BEARD], colors: { top: MT.E9E2CC, bottom: MT.E9E2CC, hat: MT.D9862A, skin: MT.A8724A } });
  CH(MT.SANTA, MT.ONG_GIA_NOEL, [MT.GIANG_SINH, MT.LE_HOI], { outfit: MT.COAT, headwear: MT.SANTA_HAT, age: MT.ELDERLY, build: MT.HEAVY, accessories: [MT.BEARD], colors: { top: MT.C42A2A, bottom: MT.C42A2A, hair: MT.F4F4F2, shoes: MT.VALUE_16161A, accent: MT.VALUE_16161A } });
  CH(MT.ROBOT, MT.NGUOI_MAY, [MT.ROBOT, MT.KHOA_HOC_VIEN_TUONG, MT.CONG_NGHE], { outfit: MT.SPACESUIT, hair: MT.BALD, build: MT.ATHLETIC, colors: { top: MT.VALUE_9AA3AB, bottom: MT.VALUE_7A838B, skin: MT.C9D0D6, accent: MT.VALUE_4AB0E0, shoes: MT.VALUE_5A636B } });
  CH(MT.ALIEN, MT.NGUOI_NGOAI_HANH_TINH_2, [MT.VIEN_TUONG, MT.VU_TRU], { outfit: MT.SPACESUIT, hair: MT.BALD, build: MT.SLIM, height: 0.85, colors: { top: MT.C9D0D6, bottom: MT.C9D0D6, skin: MT.VALUE_8AD07A, accent: MT.VALUE_7A3AB0 } });
  CH(MT.SPACE_EXPLORER, MT.PHI_HANH_GIA_MU_KINH, [MT.VU_TRU, MT.KHOA_HOC], { outfit: MT.SPACESUIT, headwear: MT.BUBBLE_HELMET, colors: { top: MT.EEF0F2, bottom: MT.EEF0F2, accent: MT.E2552A } });
  CH(MT.HERO_CAPED, MT.SIEU_ANH_HUNG_AO_CHOANG, [MT.SIEU_ANH_HUNG, MT.HANH_DONG], { outfit: MT.SPORT, build: MT.ATHLETIC, accessories: [MT.CAPE, MT.FACE_MASK], number: MT.SYMBOL_4, colors: { top: MT.VALUE_1F8A8A, bottom: MT.VALUE_16323A, accent: MT.F2C14E, cape: MT.E2742A, mask: MT.VALUE_16323A } });
  CH(MT.ZOMBIE, MT.XAC_SONG, [MT.KINH_DI, MT.ZOMBIE], { outfit: MT.CASUAL, hair: MT.SHORT, colors: { top: MT.VALUE_5A6A5A, bottom: MT.VALUE_3A3A34, skin: MT.VALUE_8AA88A, hair: MT.VALUE_2A2A24 } });
  const { E, I, asset, hills, sea, wallTex, floor, skyline } = K;
  const ground2 = (top, base, road) => (g, x0, x1, tp, H) => {
    R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? C.mix(base, MT.VALUE_06090F, 0.65) : base);
    R(g, x0, -150, x1 - x0, 20, 0, tp.night ? C.mix(top, MT.VALUE_06090F, 0.65) : top);
    if (road) R(g, x0, -60, x1 - x0, 60, 0, tp.night ? C.mix(road, MT.VALUE_06090F, 0.6) : road);
  };
  const dim = (col, tp, k = 0.62) => (tp.night ? C.mix(col, MT.VALUE_0B1322, k) : col);
  const spread = (g, x0, x1, step, fn) => {
    for (let x = Math.floor(x0 / step) * step; x < x1; x += step) fn(x, U.hash(x));
  };
  const starSky = (g, W, H, tp, p, earth) => {
    g.fillStyle = MT.VALUE_02040A;
    g.fillRect(0, 0, W, H);
    const r = U.rng(77);
    for (let i = 0; i < 420; i++) {
      g.fillStyle = MF.RGBA_230_236_255(`${0.2 + r() * 0.7}`);
      const s = r() < 0.05 ? 2.4 : 1.2;
      g.fillRect(r() * W, r() * H, s, s);
    }
    const neb = g.createRadialGradient(W * 0.3, H * 0.35, 0, W * 0.3, H * 0.35, W * 0.4);
    neb.addColorStop(0, MT.RGBA_120_80_200_0_18);
    neb.addColorStop(1, MT.RGBA_0_0_0_0);
    g.fillStyle = neb;
    g.fillRect(0, 0, W, H);
    if (earth) {
      g.save();
      g.translate(W * 0.78, H * 0.26);
      g.scale(W / 2400, W / 2400);
      asset(g, MT.EARTH, 0, 200, {});
      g.restore();
    }
  };
  E(MT.MEDIEVAL_VILLAGE, MT.LANG_TRUNG_CO, {
    tags: [MT.TRUNG_CO, MT.CO_TICH, MT.LANG],
    width: 4000,
    layers: [
      { depth: 0.08, blur: 2.4, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.3), 240, 160, 12) },
      { depth: 0.22, blur: 1.4, draw: (g, x0, x1, tp) => asset(g, MT.CASTLE, (x0 + x1) / 2, -170, { night: tp.night, color: dim(MT.VALUE_8F8A80, tp, 0.4) }, 0.45) },
      { depth: 0.75, blur: 0, draw: (g, x0, x1, tp) => spread(g, x0, x1, 560, (x, h) => asset(g, h > 0.4 ? MT.COTTAGE : MT.TREE_OAK, x + 200, 0, { night: tp.night, seed: x, color: h > 0.4 ? dim(MT.C9B08A, tp, 0.5) : tp.night ? MT.VALUE_132013 : undefined })) },
    ],
    ground: ground2(MT.VALUE_7A8A4A, MT.VALUE_8A8A5A, MT.VALUE_9A7A52),
    props: (WW) => [
      { asset: MT.WELL, x: WW * 0.42, lane: MT.BACK },
      { asset: MT.COVERED_WAGON, x: WW * 0.7, lane: MT.BACK },
    ],
  });
  E(MT.CASTLE_COURTYARD, MT.SAN_LAU_DAI, {
    tags: [MT.LAU_DAI, MT.CO_TICH, MT.HOANG_GIA],
    width: 3600,
    layers: [
      { depth: 0.15, blur: 1.6, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.35), 200, 120, 21) },
      { depth: 0.85, blur: 0, draw: (g, x0, x1, tp) => asset(g, MT.CASTLE, (x0 + x1) / 2, -30, { night: tp.night, color: dim(MT.VALUE_9A958A, tp, 0.45) }, 1.0) },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, dim(MT.VALUE_8A8378, tp));
      g.strokeStyle = MT.RGBA_0_0_0_0_15;
      g.lineWidth = 2;
      for (let y = -130, k = 0; y < H; y += 26 + k * 4, k++) line(g, x0, y, x1, y, 2, MT.RGBA_0_0_0_0_15);
    },
    props: (WW) => [
      { asset: MT.ROYAL_BANNER, x: WW * 0.3, lane: MT.BACK },
      { asset: MT.ROYAL_BANNER, x: WW * 0.7, lane: MT.BACK },
    ],
    lightsStatic: (WW, tp) =>
      tp && tp.night
        ? [
            { type: MT.GLOW, x: WW * 0.38, y: -300, r: 80, color: MT.FFA04A, alpha: 0.5 },
            { type: MT.GLOW, x: WW * 0.62, y: -300, r: 80, color: MT.FFA04A, alpha: 0.5 },
          ]
        : [],
  });
  I(MT.CASTLE_HALL, MT.DAI_SANH_PHONG_NGAI_VANG, {
    tags: [MT.LAU_DAI, MT.VUA, MT.HOANG_GIA, MT.CUNG_DIEN],
    width: 2800,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -900, MT.VALUE_6F6A62, 31);
          for (let x = Math.floor(x0 / 420) * 420 + 210; x < x1; x += 420) {
            asset(g, MT.ROYAL_BANNER, x, -380, {});
            asset(g, MT.WALL_TORCH, x + 210, -380, { t: x });
          }
          for (let x = Math.floor(x0 / 420) * 420; x < x1; x += 420) R(g, x - 30, -900, 60, 900, 0, MT.VALUE_5A554E);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      floor(MT.VALUE_5A5048, 200)(g, x0, x1, tp, H);
      R(g, x0, -110, x1 - x0, 80, 0, MT.VALUE_7A1A22);
    },
    props: (WW) => [{ asset: MT.THRONE, x: WW * 0.5, lane: MT.BACK }],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 420) }, (_, i) => ({ type: MT.GLOW, x: 420 + i * 420, y: -530, r: 90, color: MT.FFA04A, alpha: 0.5 })),
  });
  E(MT.IMPERIAL_PALACE, MT.HOANG_THANH_DAI_NOI_HUE, {
    tags: [MT.VIET_NAM, MT.HUE, MT.CUNG_DIEN, MT.LICH_SU, MT.VUA],
    width: 4000,
    layers: [
      { depth: 0.1, blur: 2.2, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.4), 180, 120, 5) },
      { depth: 0.8, blur: 0, draw: (g, x0, x1, tp) => asset(g, MT.PALACE_GATE, (x0 + x1) / 2, -40, { night: tp.night, color: dim(MT.B03A2A, tp, 0.5), roof: dim(MT.D9A83A, tp, 0.5) }, 1.1) },
    ],
    ground: ground2(MT.VALUE_9A8A72, MT.B8A88A),
    props: (WW) =>
      [
        { asset: MT.RED_LANTERN, x: WW * 0.3, lane: MT.BACK },
        { asset: MT.RED_LANTERN, x: WW * 0.7, lane: MT.BACK },
        { asset: MT.BONSAI_VN, x: WW * 0.2, lane: MT.MID },
      ].filter((p) => ME.registry.assets[p.asset]),
  });
  E(MT.ANCIENT_RUINS, MT.TAN_TICH_CO_DAI, {
    tags: [MT.CO_DAI, MT.HY_LAP, MT.LA_MA, MT.KHAO_CO],
    width: 3800,
    layers: [
      { depth: 0.1, blur: 2.0, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.35), 220, 140, 15) },
      { depth: 0.6, blur: 0.4, draw: (g, x0, x1, tp) => asset(g, MT.TEMPLE_COLUMNS, (x0 + x1) / 2, -60, { color: dim(MT.E6E0D2, tp, 0.55) }, 0.95) },
    ],
    ground: ground2(MT.B8A888, MT.C9B896),
    props: (WW) => [
      { asset: MT.RUINED_WALL, x: WW * 0.25, lane: MT.BACK },
      { asset: MT.TREE_CYPRESS, x: WW * 0.8, lane: MT.BACK },
    ],
  });
  E(MT.DESERT_DUNES, MT.SA_MAC_CAT, {
    tags: [MT.SA_MAC, MT.AI_CAP, MT.NONG],
    width: 4200,
    layers: [
      { depth: 0.06, blur: 1.5, draw: (g, x0, x1, tp) => spread(g, x0, x1, 1400, (x) => asset(g, MT.PYRAMID, x + 400, -120, { color: dim(MT.D8B878, tp, 0.55) }, 0.55)) },
      { depth: 0.2, blur: 0.8, draw: (g, x0, x1, tp) => hills(g, x0, x1, dim(MT.E0B878, tp), 160, 60, 31) },
      { depth: 0.5, blur: 0, draw: (g, x0, x1, tp) => hills(g, x0, x1, dim(MT.D8A868, tp), 120, 0, 47) },
    ],
    ground: ground2(MT.E2BC80, MT.E8C48A),
    props: (WW) =>
      [
        { asset: MT.CACTUS, x: WW * 0.3, lane: MT.BACK },
        { asset: MT.CAMEL, x: WW * 0.6, lane: MT.MID },
      ].filter((p) => ME.registry.assets[p.asset]),
  });
  E(MT.WILD_WEST_TOWN, MT.THI_TRAN_MIEN_TAY, {
    tags: [MT.MIEN_TAY, MT.CAO_BOI, MT.SA_MAC],
    width: 4200,
    layers: [
      { depth: 0.08, blur: 2.0, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(dim(MT.C47A4A, tp), tp.sky[1], 0.3), 260, 120, 9) },
      { depth: 0.8, blur: 0, draw: (g, x0, x1, tp) => spread(g, x0, x1, 620, (x, h) => asset(g, MT.SALOON, x + 300, 0, { night: tp.night, color: dim([MT.VALUE_9A6A3A, MT.VALUE_8A5A32, MT.A87A4A][Math.floor(h * 3)], tp, 0.55), sign: [MT.SALOON_2, MT.HOTEL, MT.BANK, MT.SHERIFF_2][Math.floor(h * 4)] }, 0.9)) },
    ],
    ground: ground2(MT.C9A26A, MT.D4AE78),
    props: (WW) => [
      { asset: MT.COVERED_WAGON, x: WW * 0.3, lane: MT.MID },
      { asset: MT.HORSE, x: WW * 0.55, lane: MT.BACK },
      { asset: MT.CACTUS, x: WW * 0.8, lane: MT.BACK },
    ],
  });
  E(MT.SNOW_MOUNTAIN, MT.NUI_TUYET, {
    tags: [MT.TUYET, MT.MUA_DONG, MT.NUI, MT.LANH],
    width: 4200,
    layers: [
      {
        depth: 0.06,
        blur: 1.8,
        draw: (g, x0, x1, tp) => {
          spread(g, x0, x1, 900, (x, h) => {
            const w = 600 + h * 300,
              ht = 600 + h * 260;
            poly(
              g,
              [
                [x - w, -100],
                [x, -100 - ht],
                [x + w, -100],
              ],
              dim(MT.VALUE_8A9AAA, tp),
            );
            poly(
              g,
              [
                [x - w * 0.32, -100 - ht * 0.68],
                [x, -100 - ht],
                [x + w * 0.32, -100 - ht * 0.68],
                [x + w * 0.1, -100 - ht * 0.6],
                [x - w * 0.1, -100 - ht * 0.64],
              ],
              dim(MT.F4F8FC, tp, 0.4),
            );
          });
        },
      },
      { depth: 0.35, blur: 0.8, draw: (g, x0, x1, tp) => spread(g, x0, x1, 180, (x, h) => asset(g, MT.SNOWY_PINE, x, -110, { color: tp.night ? MT.VALUE_0E1A14 : MT.VALUE_24402E }, 0.5 + h * 0.3)) },
    ],
    ground: ground2(MT.E8EEF4, MT.F2F6FA),
    props: (WW) => [
      { asset: MT.SNOWY_PINE, x: WW * 0.2, lane: MT.BACK },
      { asset: MT.IGLOO, x: WW * 0.7, lane: MT.BACK },
      { asset: MT.SNOWY_PINE, x: WW * 0.85, lane: MT.BACK },
    ],
  });
  E(MT.CITY_PARK, MT.CONG_VIEN_THANH_PHO, {
    tags: [MT.CONG_VIEN, MT.THANH_PHO, MT.THU_GIAN],
    width: 4200,
    layers: [
      { depth: 0.12, blur: 2.2, draw: (g, x0, x1, tp) => skyline(g, x0, x1, C.mix(tp.far, tp.sky[1], 0.3), 240, 520, 41, true, tp.night) },
      { depth: 0.45, blur: 0.6, draw: (g, x0, x1, tp) => spread(g, x0, x1, 300, (x, h) => asset(g, h > 0.5 ? MT.TREE_OAK : MT.TREE_ROUND, x, -60, { color: tp.night ? MT.VALUE_132013 : h > 0.7 ? MT.VALUE_4F7F3A : MT.VALUE_3F6B3A, seed: x }, 0.8)) },
    ],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_142014 : MT.VALUE_6A9A4A);
      R(g, x0, -80, x1 - x0, 60, 0, tp.night ? MT.VALUE_2A2622 : MT.CDB896);
    },
    props: (WW) => [
      { asset: MT.BENCH, x: WW * 0.3, lane: MT.BACK },
      { asset: MT.FOUNTAIN, x: WW * 0.5, lane: MT.BACK },
      { asset: MT.STREET_LAMP, x: WW * 0.42, lane: MT.BACK },
      { asset: MT.BENCH, x: WW * 0.7, lane: MT.BACK },
      { asset: MT.STREET_LAMP, x: WW * 0.78, lane: MT.BACK },
    ],
  });
  E(MT.STADIUM, MT.SAN_VAN_DONG, {
    tags: [MT.THE_THAO, MT.BONG_DA, MT.DAM_DONG],
    width: 4200,
    layers: [{ depth: 0.55, blur: 0.5, draw: (g, x0, x1, tp) => spread(g, x0, x1, 1400, (x) => asset(g, MT.STADIUM_STAND, x + 700, -150, { cheer: true, t: 0 }, 1)) }],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, tp.night ? MT.VALUE_1F4A24 : MT.VALUE_3F8A3A);
      for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) R(g, x, -150, 120, H + 150, 0, tp.night ? MT.VALUE_22502A : MT.VALUE_479640);
      R(g, x0, -130, x1 - x0, 5, 0, MT.RGBA_255_255_255_0_8);
    },
    props: (WW) => [
      { asset: MT.GOAL_POST, x: WW * 0.18, lane: MT.BACK },
      { asset: MT.GOAL_POST, x: WW * 0.82, lane: MT.BACK },
    ],
    lightsStatic: (WW, tp) =>
      tp && tp.night
        ? [
            { type: MT.GLOW, x: WW * 0.25, y: -900, r: 140, color: MT.FFFFFF, alpha: 0.7 },
            { type: MT.GLOW, x: WW * 0.75, y: -900, r: 140, color: MT.FFFFFF, alpha: 0.7 },
          ]
        : [],
  });
  E(MT.BATTLEFIELD, MT.CHIEN_TRUONG, {
    tags: [MT.CHIEN_TRANH, MT.QUAN_DOI, MT.LICH_SU],
    width: 4200,
    dust: 0.6,
    layers: [
      { depth: 0.1, blur: 2.4, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(MT.VALUE_5A5A52, tp.sky[1], 0.35), 160, 120, 61) },
      { depth: 0.4, blur: 0.8, draw: (g, x0, x1, tp) => spread(g, x0, x1, 700, (x, h) => asset(g, h > 0.5 ? MT.RUINED_WALL : MT.TREE_BARE, x + 200, -40, { color: dim(MT.VALUE_6A645A, tp) }, 0.7)) },
    ],
    ground: ground2(MT.VALUE_5A5240, MT.VALUE_6A604A),
    props: (WW) => [
      { asset: MT.SANDBAGS, x: WW * 0.3, lane: MT.MID },
      { asset: MT.BARBED_WIRE, x: WW * 0.5, lane: MT.BACK },
      { asset: MT.TANK, x: WW * 0.72, lane: MT.BACK },
      { asset: MT.SMOKE, x: WW * 0.6, lane: MT.BACK },
    ],
  });
  E(MT.GRAVEYARD, MT.NGHIA_DIA_KINH_DI, {
    tags: [MT.KINH_DI, MT.DEM, MT.MA],
    width: 3800,
    time: MT.NIGHT,
    layers: [
      { depth: 0.1, blur: 2.0, draw: (g, x0, x1, tp) => hills(g, x0, x1, C.mix(tp.far, MT.VALUE_1A1A2A, 0.4), 200, 100, 13) },
      { depth: 0.35, blur: 0.8, draw: (g, x0, x1, tp) => spread(g, x0, x1, 520, (x) => asset(g, MT.TREE_BARE, x, -90, { color: MT.VALUE_1A1612 }, 0.8)) },
      { depth: 0.7, blur: 0, draw: (g, x0, x1, tp) => spread(g, x0, x1, 170, (x, h) => (h > 0.3 ? asset(g, MT.GRAVESTONE, x, -10 - h * 20, { color: dim(MT.VALUE_7A7A80, tp, 0.45) }, 0.7 + h * 0.3) : null)) },
    ],
    ground: ground2(MT.VALUE_2A3022, MT.VALUE_323828),
    props: (WW) =>
      [
        { asset: MT.FENCE, x: WW * 0.4, lane: MT.BACK },
        { asset: MT.LANTERN, x: WW * 0.6, lane: MT.MID },
      ].filter((p) => ME.registry.assets[p.asset]),
  });
  E(MT.VN_MARKET, MT.CHO_QUE_CHO_TRUYEN_THONG, {
    tags: [MT.VIET_NAM, MT.CHO_3, MT.TET],
    width: 4200,
    layers: [
      { depth: 0.15, blur: 2.0, draw: (g, x0, x1, tp) => spread(g, x0, x1, 260, (x, h) => asset(g, MT.TUBE_HOUSE, x, -120, { seed: x, h: 380 + h * 160, night: tp.night, color: tp.night ? MT.VALUE_1A2232 : [MT.E8C96A, MT.D9E3C4, MT.F2B8A0][Math.floor(h * 3)] }, 0.7)) },
      { depth: 0.8, blur: 0, draw: (g, x0, x1, tp) => spread(g, x0, x1, 420, (x) => asset(g, MT.MARKET_STALL, x + 200, 0, { night: tp.night, seed: x })) },
    ],
    ground: ground2(MT.VALUE_8A7A62, MT.VALUE_9A8A72),
    props: (WW) => [
      { asset: MT.RED_LANTERN, x: WW * 0.35, lane: MT.BACK },
      { asset: MT.PEACH_BLOSSOM, x: WW * 0.6, lane: MT.BACK },
      { asset: MT.BASKET_BOAT, x: WW * 0.8, lane: MT.MID },
    ],
  });
  E(MT.UNDERWATER, MT.DUOI_DAY_BIEN, {
    tags: [MT.BIEN, MT.DUOI_NUOC, MT.LAN],
    width: 4000,
    ownMoon: true,
    fog3d: MT.VALUE_0E4A6A,
    sky: (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, MT.VALUE_2A8AB0);
      gr.addColorStop(0.6, MT.VALUE_0E4A6A);
      gr.addColorStop(1, MT.VALUE_06223A);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.fillStyle = MT.RGBA_200_240_255_0_08;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(W * (0.1 + i * 0.16), 0);
        g.lineTo(W * (0.05 + i * 0.16), H);
        g.lineTo(W * (0.12 + i * 0.16), H);
        g.lineTo(W * (0.14 + i * 0.16), 0);
        g.fill();
      }
    },
    layers: [
      { depth: 0.2, blur: 1.5, draw: (g, x0, x1) => hills(g, x0, x1, MT.VALUE_0E3A52, 200, 60, 19) },
      { depth: 0.5, blur: 0.4, draw: (g, x0, x1) => spread(g, x0, x1, 260, (x, h) => asset(g, h > 0.5 ? MT.CORAL : MT.SEAWEED, x, -40, { seed: x }, 0.8)) },
    ],
    ground: ground2(MT.C9B88A, MT.A89A72),
    props: (WW) => [
      { asset: MT.FISH_SCHOOL, x: WW * 0.3, lane: MT.BACK, y: -200 },
      { asset: MT.TREASURE_CHEST, x: WW * 0.6, lane: MT.MID },
      { asset: MT.CORAL, x: WW * 0.8, lane: MT.FRONT },
    ],
    dust: 0.4,
  });
  E(MT.MOON_SURFACE, MT.BE_MAT_MAT_TRANG, {
    tags: [MT.VU_TRU, MT.MAT_TRANG_2, MT.KHOA_HOC],
    width: 4000,
    time: MT.NIGHT,
    ownMoon: true,
    sky: (g, W, H, tp, p) => starSky(g, W, H, tp, p, true),
    layers: [{ depth: 0.15, blur: 1.2, draw: (g, x0, x1) => hills(g, x0, x1, MT.VALUE_5A5A5E, 120, 40, 23) }],
    ground: (g, x0, x1, tp, H) => {
      R(g, x0, -150, x1 - x0, H + 150, 0, MT.VALUE_8A8A8E);
      spread(g, x0, x1, 230, (x, h) => ell(g, x + h * 100, -60 + h * 120, 40 + h * 50, 10 + h * 12, MT.VALUE_6E6E72));
    },
    props: (WW) => [
      { asset: MT.ROCKET, x: WW * 0.7, lane: MT.BACK },
      { asset: MT.FLAG, x: WW * 0.45, lane: MT.MID, params: { colors: [MT.F4F4F2], color: MT.F4F4F2 } },
    ],
  });
  E(MT.OUTER_SPACE, MT.VU_TRU_KHONG_TRONG_LUC, {
    category: MT.ABSTRACT,
    tags: [MT.VU_TRU, MT.HANH_TINH_2],
    width: 3200,
    time: MT.NIGHT,
    ownMoon: true,
    sky: (g, W, H, tp, p) => starSky(g, W, H, tp, p, false),
    layers: [
      {
        depth: 0.05,
        blur: 0,
        draw: (g, x0, x1) => {
          asset(g, MT.PLANET, x0 + (x1 - x0) * 0.25, -500, {});
          asset(g, MT.EARTH, x0 + (x1 - x0) * 0.75, -300, {}, 0.6);
        },
      },
    ],
    ground: () => {},
  });
  I(MT.AIRPLANE_CABIN, MT.KHOANG_MAY_BAY, {
    tags: [MT.MAY_BAY, MT.HANH_KHACH, MT.HANG_KHONG],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          R(g, x0, -820, x1 - x0, 820, 0, MT.D8D6D0);
          R(g, x0, -820, x1 - x0, 120, 0, MT.C9C6BE);
          for (let x = Math.floor(x0 / 220) * 220; x < x1; x += 220) {
            ell(g, x + 110, -500, 44, 62, MT.VALUE_9A9890);
            ell(g, x + 110, -500, 36, 52, tp.night ? MT.VALUE_0B1322 : MT.VALUE_8AC0E8);
          }
          for (let x = Math.floor(x0 / 220) * 220; x < x1; x += 220) asset(g, MT.AIRPLANE_SEAT, x + 60, -40, {}, 1.1);
        },
      },
    ],
    ground: floor(MT.VALUE_4A5568, 0),
    props: (WW) => Array.from({ length: Math.floor(WW / 360) }, (_, i) => ({ asset: MT.AIRPLANE_SEAT, x: 200 + i * 360, lane: MT.FRONT })),
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 500) }, (_, i) => ({ type: MT.LAMP, x: 250 + i * 500, y: -780, len: 800, color: MT.FFF4E0, alpha: 0.12 })),
  });
  I(MT.LABORATORY, MT.PHONG_THI_NGHIEM_2, {
    tags: [MT.KHOA_HOC, MT.PHONG_THI_NGHIEM, MT.NGHIEN_CUU],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -800, MT.D6E0E4, 51);
          for (let x = Math.floor(x0 / 600) * 600 + 300; x < x1; x += 600) asset(g, MT.BOOKSHELF, x, -26, {});
        },
      },
    ],
    ground: floor(MT.B8C4C8, 160),
    props: (WW) => [
      { asset: MT.LAB_BENCH, x: WW * 0.35, lane: MT.MID },
      { asset: MT.LAB_BENCH, x: WW * 0.7, lane: MT.MID },
    ],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 600) }, (_, i) => ({ type: MT.LAMP, x: 300 + i * 600, y: -780, len: 800, color: MT.E8F4FF, alpha: 0.18 })),
  });
  I(MT.SUPERMARKET, MT.SIEU_THI_CUA_HANG, {
    tags: [MT.SIEU_THI, MT.CUA_HANG, MT.MUA_SAM],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -800, MT.E8ECEF, 52);
          for (let x = Math.floor(x0 / 420) * 420; x < x1; x += 420) asset(g, MT.STORE_SHELF, x + 210, -26, { seed: x });
        },
      },
    ],
    ground: floor(MT.CFD3D6, 140),
    props: (WW) => [
      { asset: MT.CASH_REGISTER, x: WW * 0.3, lane: MT.MID },
      { asset: MT.SHOPPING_CART, x: WW * 0.6, lane: MT.MID },
    ],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 400) }, (_, i) => ({ type: MT.LAMP, x: 200 + i * 400, y: -780, len: 800, color: MT.F4FBFF, alpha: 0.14 })),
  });
  I(MT.CONCERT_STAGE, MT.SAN_KHAU_CA_NHAC, {
    tags: [MT.AM_NHAC, MT.SAN_KHAU, MT.BIEU_DIEN],
    time: MT.INTERIOR_DARK,
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          R(g, x0, -900, x1 - x0, 900, 0, MT.VALUE_0E0C14);
          for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) R(g, x, -900, 80, 900, 0, MT.VALUE_14111C);
          R(g, x0, -120, x1 - x0, 100, 0, MT.VALUE_1E1A24);
          for (let x = Math.floor(x0 / 700) * 700 + 200; x < x1; x += 700) asset(g, MT.STAGE_SPEAKER, x, -20, {});
        },
      },
    ],
    ground: floor(MT.VALUE_2A2430, 0),
    props: (WW) => [
      { asset: MT.MICROPHONE_STAND, x: WW * 0.5, lane: MT.MID },
      { asset: MT.PIANO, x: WW * 0.3, lane: MT.BACK },
    ],
    lightsStatic: (WW) => [
      { type: MT.LAMP, x: WW * 0.3, y: -880, len: 900, color: MT.E86AB0, alpha: 0.32 },
      { type: MT.LAMP, x: WW * 0.5, y: -880, len: 900, color: MT.FFF2D0, alpha: 0.4 },
      { type: MT.LAMP, x: WW * 0.7, y: -880, len: 900, color: MT.VALUE_4AB0E0, alpha: 0.32 },
    ],
  });
  I(MT.SPACE_STATION, MT.TRAM_VU_TRU, {
    tags: [MT.VU_TRU, MT.KHOA_HOC_VIEN_TUONG],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          R(g, x0, -820, x1 - x0, 820, 0, MT.CFD6DE);
          for (let x = Math.floor(x0 / 300) * 300; x < x1; x += 300) {
            R(g, x + 6, -800, 288, 760, 8, MT.DFE5EB);
            line(g, x, -820, x, 0, 3, MT.VALUE_9AA3AB);
          }
          for (let x = Math.floor(x0 / 900) * 900 + 450; x < x1; x += 900) {
            ell(g, x, -480, 130, 130, MT.VALUE_5A636B);
            ell(g, x, -480, 112, 112, MT.VALUE_02040A);
            const r = U.rng(x);
            for (let i = 0; i < 30; i++) g.fillRect(x - 100 + r() * 200, -580 + r() * 200, 2, 2);
            asset(g, MT.EARTH, x + 40, -400, {}, 0.3);
          }
          for (let x = Math.floor(x0 / 300) * 300 + 150; x < x1; x += 600) {
            R(g, x - 40, -300, 80, 50, 6, MT.VALUE_2A3036);
            R(g, x - 32, -292, 64, 34, 3, MT.VALUE_4AE2A0);
          }
        },
      },
    ],
    ground: floor(MT.VALUE_8A939B, 100),
    props: () => [],
    lightsStatic: (WW) => Array.from({ length: Math.floor(WW / 600) }, (_, i) => ({ type: MT.LAMP, x: 300 + i * 600, y: -780, len: 800, color: MT.D8F0FF, alpha: 0.16 })),
  });
  I(MT.KITCHEN, MT.NHA_BEP, {
    tags: [MT.NHA, MT.NAU_AN, MT.GIA_DINH],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.E8DCC8, 53);
          g.strokeStyle = MT.RGBA_0_0_0_0_08;
          g.lineWidth = 2;
          for (let y = -700; y < -300; y += 40) for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) g.strokeRect(x, y, 40, 40);
          asset(g, MT.WINDOW, 1200, -420, {});
        },
      },
    ],
    ground: floor(MT.A08A6A, 120),
    props: (WW) => [
      { asset: MT.KITCHEN_STOVE, x: WW * 0.3, lane: MT.BACK },
      { asset: MT.FRIDGE, x: WW * 0.15, lane: MT.BACK },
      { asset: MT.TABLE, x: WW * 0.65, lane: MT.MID },
    ],
  });
  I(MT.BEDROOM, MT.PHONG_NGU, {
    tags: [MT.NHA, MT.PHONG_NGU_2, MT.GIA_DINH],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.B8C4D8, 54);
          asset(g, MT.WINDOW, 1500, -400, {});
          asset(g, MT.PICTURE_FRAME, 800, -460, {});
        },
      },
    ],
    ground: floor(MT.VALUE_8A6A4A, 120),
    props: (WW) => [
      { asset: MT.BED, x: WW * 0.4, lane: MT.BACK },
      { asset: MT.WARDROBE, x: WW * 0.8, lane: MT.BACK },
      { asset: MT.DESK_LAMP, x: WW * 0.6, lane: MT.MID },
    ],
    lightsStatic: (WW) => [{ type: MT.LAMP, x: WW * 0.5, y: -760, len: 800, color: MT.FFE0B0, alpha: 0.2 }],
  });
  I(MT.VN_HOUSE_TET, MT.NHA_VIET_NGAY_TET, {
    tags: [MT.VIET_NAM, MT.TET, MT.GIA_DINH, MT.NHA],
    layers: [
      {
        depth: 0.9,
        blur: 0,
        draw: (g, x0, x1) => {
          wallTex(g, x0, x1, -760, MT.E8D4A8, 55);
          asset(g, MT.ALTAR_VN, 1200, -26, {});
          asset(g, MT.PEACH_BLOSSOM, 700, -26, {}, 0.9);
          asset(g, MT.MAI_BLOSSOM, 1700, -26, {}, 0.9);
          R(g, 1090, -720, 220, 60, 4, MT.C42A2A);
        },
      },
    ],
    ground: floor(MT.A0503A, 150),
    props: (WW) => [
      { asset: MT.TABLE, x: WW * 0.45, lane: MT.MID },
      { asset: MT.RED_ENVELOPE, x: WW * 0.47, lane: MT.MID, y: -76 },
    ],
    lightsStatic: (WW) => [{ type: MT.LAMP, x: WW * 0.5, y: -760, len: 800, color: MT.FFD8A0, alpha: 0.24 }],
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
