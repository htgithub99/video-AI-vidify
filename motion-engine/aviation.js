(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  const RI = ME.rigInternals;
  if (!T || !RI) return;
  const K = T.kit;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const S = Math.sin;
  const { paint, rect, rrect, ell, poly, stroke, glowDisc, P } = K;
  const AV = (ME.AVIATION = ME.AVIATION || { characters: [], assets: [], envs: [], actions: [] });
  const PZ = (o) =>
    Object.assign(
      {
        lean: 0.02,
        hipY: 0,
        dy: 0,
        rot: 0,
        head: 0,
        l: [
          [0.04, 0],
          [-0.04, 0],
        ],
        a: [
          [0.08, 0.15],
          [-0.06, 0.15],
        ],
      },
      o,
    );
  const act = (id, name, loop, stride, pose, extra) => {
    ME.registerAction(id, Object.assign({ name, loop, stride, pose }, extra || {}));
    AV.actions.push(id);
  };
  const GUN_ACTIONS = new Set([MT.AIM, MT.SHOOT, MT.TAKE_COVER]);
  AV.GUN_ACTIONS = GUN_ACTIONS;
  const AIM_ARMS = [
    [0.95, 0.62],
    [1.42, 0.16],
  ];
  const STANCE = [
    [0.24, 0.14],
    [-0.2, 0.1],
  ];
  act(MT.AIM, MT.GIUONG_SUNG_NGAM_CHIA_SUNG_KHONG_CHE, true, 0, (ph, t) =>
    PZ({
      lean: 0.07 + S(t * 1.3) * 0.006,
      head: 0.05,
      hipY: 3,
      l: STANCE,
      a: [
        [AIM_ARMS[0][0] + S(t * 1.7) * 0.012, AIM_ARMS[0][1]],
        [AIM_ARMS[1][0] + S(t * 1.7) * 0.012, AIM_ARMS[1][1]],
      ],
      hold: MT.GUN,
    }),
  );
  act(MT.SHOOT, MT.NO_SUNG_DAU_SUNG, true, 0, (ph, t, o) => {
    const c = (t * 5.2 + ((o && o.phase) || 0) * 0.37) % 1;
    const burst = Math.floor(t * 5.2) % 5 !== 4;
    const fire = burst && c < 0.24;
    const r = fire ? (0.24 - c) * 0.42 : 0;
    return PZ({
      lean: 0.07 - r * 0.5,
      head: 0.05 - r * 0.3,
      hipY: 3,
      l: STANCE,
      a: [
        [AIM_ARMS[0][0] + r, AIM_ARMS[0][1] - r * 0.5],
        [AIM_ARMS[1][0] + r * 0.6, AIM_ARMS[1][1]],
      ],
      hold: fire ? MT.GUN_FIRE : MT.GUN,
    });
  });
  act(MT.TAKE_COVER, MT.NAP_SAU_VAT_CHE_CHO_BAN, true, 0, (ph, t) => {
    const peek = S(t * 0.85) > 0.35;
    return PZ({
      lean: peek ? 0.12 : 0.28,
      hipY: 40,
      head: peek ? 0.05 : 0.25,
      l: [
        [1.5, 1.55],
        [0.1, 1.6],
      ],
      a: peek
        ? AIM_ARMS
        : [
            [0.55, 1.35],
            [0.8, 1.1],
          ],
      hold: MT.GUN,
    });
  });
  act(MT.HANDS_UP, MT.GIO_TAY_DAU_HANG_CON_TIN, true, 0, (ph, t) =>
    PZ({
      lean: -0.03,
      head: -0.06 + S(t * 0.7) * 0.03,
      l: [
        [0.06, 0.02],
        [-0.06, 0.02],
      ],
      a: [
        [2.85 + S(t * 9) * 0.025, 0.4],
        [2.75 + S(t * 9 + 1) * 0.025, 0.45],
      ],
    }),
  );
  act(MT.COWER, MT.CO_RUM_SO_HAI_OM_DAU, true, 0, (ph, t) =>
    PZ({
      lean: 0.42 + S(t * 11) * 0.012,
      hipY: 44,
      head: 0.35,
      l: [
        [1.3, 1.9],
        [1.15, 1.75],
      ],
      a: [
        [2.55, 1.95],
        [2.45, 2.05],
      ],
    }),
  );
  act(MT.SURRENDER, MT.QUY_HAI_TAY_OM_GAY_BI_BAT, true, 0, (ph, t) =>
    PZ({
      lean: 0.05,
      hipY: 40,
      head: 0.12 + S(t * 0.8) * 0.02,
      l: [
        [1.5, 1.55],
        [0.1, 1.6],
      ],
      a: [
        [2.7, 2.35],
        [2.6, 2.45],
      ],
    }),
  );
  act(MT.KICK_DOOR, MT.DAP_PHA_CUA, true, 0, (ph, t) => {
    const k = (t % 1.15) / 1.15;
    const up = k < 0.32 ? U.smooth(k / 0.32) : k < 0.5 ? 1 : 1 - U.smooth((k - 0.5) / 0.3);
    const ext = k > 0.3 && k < 0.5 ? U.smooth((k - 0.3) / 0.12) : k >= 0.5 ? Math.max(0, 1 - (k - 0.5) / 0.15) : 0;
    return PZ({
      lean: -0.12 * up,
      l: [
        [0.15 + up * 1.35, (1 - ext) * up * 1.6],
        [-0.12, 0.05],
      ],
      a: [
        [0.9 + up * 0.2, 1.2],
        [0.5, 1.4],
      ],
    });
  });
  act(MT.KNOCK, MT.DAP_GO_MANH_VAO_CUA, true, 0, (ph, t) => {
    const k = Math.max(0, S(t * 9));
    return PZ({
      lean: 0.08 + k * 0.04,
      l: STANCE,
      a: [
        [1.95 - k * 0.45, 1.05 - k * 0.4],
        [0.25, 0.4],
      ],
    });
  });
  act(MT.OPEN_DOOR, MT.MO_KEO_CUA, true, 0, (ph, t) => {
    const k = 0.5 + 0.5 * S(t * 1.6);
    return PZ({
      lean: -0.06 * k,
      l: STANCE,
      a: [
        [1.45 - k * 0.25, 0.25 + k * 0.55],
        [0.2, 0.3],
      ],
    });
  });
  act(MT.RESTRAIN, MT.KHONG_CHE_GHI_CHAT_NGUOI_KHAC, true, 0, (ph, t) =>
    PZ({
      lean: 0.36 + S(t * 2.4) * 0.02,
      hipY: 10,
      l: [
        [0.45, 0.4],
        [-0.35, 0.2],
      ],
      a: [
        [1.05, 0.35],
        [0.95, 0.5],
      ],
    }),
  );
  act(MT.FLY, MT.LAI_MAY_BAY_NGOI_GHE_PHI_CONG_CAM, true, 0, (ph, t) =>
    PZ({
      lean: -0.02,
      hipY: 46,
      head: S(t * 0.4) * 0.04,
      l: [
        [1.45, 1.35],
        [1.4, 1.3],
      ],
      a: [
        [1.15 + S(t * 0.7) * 0.03, 0.55],
        [1.05 + S(t * 0.7) * 0.03, 0.6],
      ],
    }),
  );
  act(MT.SLIDE, MT.TRUOT_XUONG_CAU_TRUOT_THOAT_HIEM, true, 0, () =>
    PZ({
      lean: -0.38,
      hipY: 52,
      head: -0.1,
      l: [
        [1.55, 0.15],
        [1.5, 0.12],
      ],
      a: [
        [2.3, 0.35],
        [2.1, 0.35],
      ],
    }),
  );
  act(MT.THROW, MT.NEM_LUU_DAN_DO_VAT, true, 0, (ph, t) => {
    const k = (t % 1.3) / 1.3;
    const sw = k < 0.45 ? -U.smooth(k / 0.45) : U.smooth(Math.min(1, (k - 0.45) / 0.15));
    return PZ({
      lean: 0.05 + sw * 0.15,
      l: [
        [0.35, 0.2],
        [-0.3, 0.12],
      ],
      a: [
        [sw < 0 ? 2.6 - sw * 0.6 : 2.6 - sw * 1.4, 0.5],
        [1.0, 0.4],
      ],
    });
  });
  act(MT.PUNCH, MT.DAM_AU_DA, true, 0, (ph, t) => {
    const a = Math.max(0, S(t * 7)),
      b = Math.max(0, S(t * 7 + PI));
    return PZ({
      lean: 0.12,
      l: STANCE,
      a: [
        [1.0 + a * 0.6, 1.6 - a * 1.4],
        [1.0 + b * 0.6, 1.6 - b * 1.4],
      ],
    });
  });
  const INK = MT.VALUE_2A1C22;
  const line = () => T.style === MT.LINE;
  const gunBody = (g, kind, dark, mid) => {
    if (kind === MT.PISTOL) {
      paint(g, rrect(-5, -11, 27, 7, 1.5), dark, { d: 0.8, lw: 1 });
      paint(
        g,
        poly([
          [-4, -5],
          [5, -5],
          [3, 8],
          [-4, 8],
        ]),
        mid,
        { d: 0.6, lw: 1 },
      );
      return [23, -7.5];
    }
    paint(
      g,
      poly([
        [-34, -10],
        [-14, -8],
        [-14, -2],
        [-36, 2],
      ]),
      mid,
      { d: 0.8, lw: 1 },
    );
    paint(g, rrect(-15, -12, 44, 9, 2), dark, { d: 1, lw: 1 });
    paint(g, rrect(26, -11, 20, 6, 1.5), mid, { d: 0.6, lw: 1 });
    paint(g, rect(44, -9.5, 22, 3), dark, { d: 0, lw: 0.9 });
    paint(
      g,
      poly([
        [-2, -4],
        [5, -4],
        [3, 7],
        [-3, 7],
      ]),
      dark,
      { d: 0.5, lw: 1 },
    );
    paint(
      g,
      poly([
        [10, -4],
        [17, -4],
        [20, 12],
        [13, 13],
      ]),
      dark,
      { d: 0.5, lw: 1 },
    );
    paint(g, rect(0, -15, 12, 3), dark, { d: 0, lw: 0.8 });
    return [66, -8];
  };
  const flash = (g, x, y, t) => {
    const f = 0.8 + 0.4 * S(t * 97);
    glowDisc(g, x + 8, y, 46 * f, MT.FFCF6A, 0.55);
    const p = P();
    p.moveTo(x, y - 6 * f);
    p.lineTo(x + 30 * f, y);
    p.lineTo(x, y + 6 * f);
    p.lineTo(x + 8 * f, y);
    p.closePath();
    p.moveTo(x + 4, y - 13 * f);
    p.lineTo(x + 14 * f, y);
    p.lineTo(x + 4, y + 13 * f);
    p.closePath();
    paint(g, p, MT.FFF2B8, { d: 0, ink: false, glow: MT.RGBA_255_200_90_0_95, glowR: 18 });
  };
  for (const w of [MT.RIFLE, MT.PISTOL]) {
    RI.HELD_EXTRA[w] = (g) => gunBody(g, w, MT.VALUE_1E2024, MT.VALUE_2E3238);
    RI.HELD_EXTRA[w + MT.FIRE_2] = (g, pal, t) => {
      const m = gunBody(g, w, MT.VALUE_1E2024, MT.VALUE_2E3238);
      flash(g, m[0], m[1], t || 0);
    };
  }
  const weaponOf = (acc) => (acc.includes(MT.RIFLE) ? MT.RIFLE : acc.includes(MT.PISTOL) ? MT.PISTOL : MT.RIFLE);
  RI.HELD_ALIAS.gun = (acc) => weaponOf(acc || []);
  RI.HELD_ALIAS.gun_fire = (acc) => weaponOf(acc || []) + MT.FIRE_2;
  ME.HOLDABLE.rifle = MT.RIFLE;
  ME.HOLDABLE.pistol = MT.PISTOL;
  ME.REAL_SIZE.rifle = 90;
  ME.REAL_SIZE.pistol = 22;
  const lerp2 = (a, b, k) => [U.lerp(a[0], b[0], k), U.lerp(a[1], b[1], k)];
  const perp = (a, b) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  const gunInHands = (c) => {
    const a = ME.registry.actions[(c.o && c.o.action) || MT.STAND];
    if (GUN_ACTIONS.has((c.o && c.o.action) || "")) return true;
    return !!(a && a.pose && c.o && c.o.hold && ME.HOLDABLE[c.o.hold] && [MT.RIFLE, MT.PISTOL].includes(ME.HOLDABLE[c.o.hold]));
  };
  const busyHands = new Set([MT.CARRY, MT.DRAG, MT.PUSH, MT.LIFT, MT.DIG, MT.DRILL, MT.WELD, MT.CLIMB, MT.PHONE, MT.TYPE, MT.SIT_EAT, MT.FLY, MT.SLIDE, MT.HANDS_UP, MT.COWER, MT.SURRENDER, MT.THROW, MT.PUNCH, MT.RESTRAIN, MT.KNOCK, MT.OPEN_DOOR, MT.CRAWL, MT.SWIM]);
  const ACC = {
    tactical_vest: {
      front: (g, c) => {
        const sk = c.sk;
        const top = lerp2(sk.sh, sk.hip, 0.06),
          bot = lerp2(sk.sh, sk.hip, 0.8);
        const n = perp(top, bot);
        const w = (sk.d.shoulderW || 10) * 1.12 + 2.5;
        const q = [
          [top[0] + n[0] * w, top[1] + n[1] * w],
          [top[0] - n[0] * w, top[1] - n[1] * w],
          [bot[0] - n[0] * (w - 1), bot[1] - n[1] * (w - 1)],
          [bot[0] + n[0] * (w - 1), bot[1] + n[1] * (w - 1)],
        ];
        const col = (c.ch.colors && c.ch.colors.vest) || MT.VALUE_2A2F36;
        paint(g, poly(q), col, { d: 1.6, lw: 1.1 });
        for (const k of [0.45, 0.62]) {
          const p0 = lerp2(top, bot, k);
          const fx = Math.sign(c.o && c.o.facing ? 1 : 1);
          void fx;
          paint(g, rrect(p0[0] - w * 0.15, p0[1] - 4.5, w * 0.95, 9, 1.5), C.shade(col, 0.12), { d: 0.8, lw: 0.9 });
        }
        const pb = lerp2(top, bot, 0.2);
        paint(g, rect(pb[0] - w * 0.2, pb[1] - 2, w * 0.7, 4), C.shade(col, 0.25), { d: 0, lw: 0.8 });
      },
    },
    rifle: {
      front: (g, c) => {
        if (gunInHands(c) || busyHands.has((c.o && c.o.action) || "")) return;
        const sk = c.sk;
        const a = lerp2(sk.sh, sk.hip, 0.18),
          b = lerp2(sk.sh, sk.hip, 0.95);
        g.save();
        g.translate(U.lerp(a[0], b[0], 0.5) + 3, U.lerp(a[1], b[1], 0.5));
        g.rotate(1.15);
        g.scale(0.92, 0.92);
        gunBody(g, MT.RIFLE, MT.VALUE_1E2024, MT.VALUE_2E3238);
        g.restore();
      },
    },
    pistol: {
      front: (g, c) => {
        if (gunInHands(c)) return;
        const sk = c.sk;
        const h = lerp2(sk.sh, sk.hip, 0.92);
        paint(g, rrect(h[0] - 9, h[1] - 2, 10, 15, 2), MT.VALUE_2A2420, { d: 0.6, lw: 0.9 });
      },
    },
  };
  for (const id of Object.keys(ACC)) {
    RI.ACC_EXTRA[id] = ACC[id];
    T.ACC_EXTRA[id] = ACC[id];
  }
  const CH = (id, name, tags, o) => {
    ME.registerCharacter(Object.assign({ id, name, tags, builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [] }, o));
    AV.characters.push(id);
  };
  CH(MT.SWAT_OFFICER, MT.DAC_NHIEM_CHONG_KHUNG_BO_SWAT_GIGN_DEO, [MT.DAC_NHIEM, MT.SWAT, MT.GIGN, MT.BIET_KICH, MT.CANH_SAT, MT.CHONG_KHUNG_BO, MT.GIAI_CUU], {
    outfit: MT.MILITARY,
    headwear: MT.HELMET,
    build: MT.ATHLETIC,
    accessories: [MT.TACTICAL_VEST, MT.FACE_MASK, MT.RIFLE],
    colors: { top: MT.VALUE_23272E, bottom: MT.VALUE_1D2026, hat: MT.VALUE_1A1D22, mask: MT.VALUE_15171A, vest: MT.VALUE_2C323A, shoes: MT.VALUE_121316, accent: MT.VALUE_3A4A5A },
  });
  CH(MT.SWAT_OFFICER_2, MT.DAC_NHIEM_AO_XANH_DEN_SUNG_TRUONG, [MT.DAC_NHIEM, MT.SWAT, MT.GIGN, MT.CANH_SAT, MT.GIAI_CUU], {
    outfit: MT.MILITARY,
    headwear: MT.HELMET,
    build: MT.ATHLETIC,
    hair: MT.SHORT,
    accessories: [MT.TACTICAL_VEST, MT.RIFLE],
    colors: { top: MT.VALUE_1F2A3D, bottom: MT.VALUE_1B2333, hat: MT.VALUE_1C2433, vest: MT.VALUE_283246, skin: MT.E2B894, shoes: MT.VALUE_121316, accent: MT.VALUE_3A4A6A },
  });
  CH(MT.SWAT_COMMANDER, MT.CHI_HUY_DAC_NHIEM_SUNG_NGAN_BO_DAM, [MT.DAC_NHIEM, MT.CHI_HUY, MT.CANH_SAT, MT.GIGN], { outfit: MT.MILITARY, headwear: MT.BERET, build: MT.ATHLETIC, accessories: [MT.TACTICAL_VEST, MT.PISTOL], colors: { top: MT.VALUE_202838, bottom: MT.VALUE_1B2230, hat: MT.VALUE_1A2240, vest: MT.VALUE_2A3242, shoes: MT.VALUE_121316 } });
  CH(MT.HIJACKER, MT.KHONG_TAC_KHUNG_BO_CO_VU_TRANG_SUNG, [MT.KHONG_TAC, MT.KHUNG_BO, MT.TAY_SUNG, MT.BAT_COC, MT.TOI_PHAM], { outfit: MT.COAT, headwear: MT.BEANIE, accessories: [MT.FACE_MASK, MT.PISTOL], colors: { top: MT.VALUE_3B3631, bottom: MT.VALUE_26262B, hat: MT.VALUE_1E1E22, mask: MT.VALUE_232326, shoes: MT.VALUE_1A1614 } });
  CH(MT.HIJACKER_RIFLE, MT.KHONG_TAC_KHUNG_BO_CAM_SUNG_TRUONG, [MT.KHONG_TAC, MT.KHUNG_BO, MT.TAY_SUNG, MT.BAT_COC], { outfit: MT.CASUAL, headwear: MT.CAP, build: MT.ATHLETIC, accessories: [MT.FACE_MASK, MT.RIFLE, MT.BEARD], colors: { top: MT.VALUE_4A4A36, bottom: MT.VALUE_2A2A24, hat: MT.VALUE_2A2A24, mask: MT.VALUE_2A2A2A, shoes: MT.VALUE_1A1614 } });
  CH(MT.HIJACKER_DISGUISED, MT.KHONG_TAC_GIA_DANG_NHAN_VIEN_AN_NINH, [MT.KHONG_TAC, MT.KHUNG_BO, MT.GIA_DANG, MT.AN_NINH], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, accessories: [MT.RIFLE, MT.MUSTACHE], colors: { top: MT.VALUE_2C3A52, bottom: MT.VALUE_222A3A, hat: MT.VALUE_222A3A, accent: MT.C9A23A } });
  CH(MT.COPILOT, MT.CO_PHO_PHI_CONG_PHU, [MT.PHI_CONG_2, MT.CO_PHO, MT.HANG_KHONG], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, hair: MT.SHORT, accessories: [MT.MUSTACHE], colors: { top: MT.VALUE_1D2740, bottom: MT.VALUE_1D2740, hat: MT.VALUE_1D2740, accent: MT.D9B85A, hair: MT.VALUE_5A3A22 } });
  CH(MT.CAPTAIN_PILOT, MT.CO_TRUONG_MAY_BAY_TOC_BAC, [MT.PHI_CONG_2, MT.CO_TRUONG, MT.HANG_KHONG], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, age: MT.ELDERLY, hair: MT.SHORT, colors: { top: MT.VALUE_1D2740, bottom: MT.VALUE_1D2740, hat: MT.VALUE_1D2740, accent: MT.D9B85A, hair: MT.C8C4BC } });
  CH(MT.PASSENGER_MAN, MT.HANH_KHACH_NAM, [MT.HANH_KHACH, MT.CON_TIN, MT.MAY_BAY], { outfit: MT.CASUAL, colors: { top: MT.VALUE_6A7A8A, bottom: MT.VALUE_2C3038, hair: MT.VALUE_2A1E14 } });
  CH(MT.PASSENGER_WOMAN, MT.HANH_KHACH_NU, [MT.HANH_KHACH, MT.CON_TIN, MT.MAY_BAY, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.CASUAL, colors: { top: MT.VALUE_9A5A6A, bottom: MT.VALUE_3A3040, hair: MT.VALUE_3A2518 } });
  CH(MT.PASSENGER_ELDER, MT.HANH_KHACH_LON_TUOI, [MT.HANH_KHACH, MT.CON_TIN, MT.NGUOI_GIA], { age: MT.ELDERLY, outfit: MT.SUIT, hair: MT.SHORT, accessories: [MT.GLASSES], colors: { top: MT.VALUE_7A6A52, bottom: MT.VALUE_4A4034, hair: MT.D0CCC4 } });
  for (const id of AV.characters) if (!T.characters.includes(id)) T.characters.push(id);
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
