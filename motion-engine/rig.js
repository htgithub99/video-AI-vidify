(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const BASE = { hip: 92, thigh: 45, shin: 44, torso: 58, neck: 7, head: 12.5, upper: 29, fore: 27 };
  const BUILD = { slim: 0.86, normal: 1, heavy: 1.32, athletic: 1.08 };
  const dims = (ch) => {
    const age = ch.age || MT.ADULT;
    const h = (ch.height || 1) * (age === MT.CHILD ? 0.62 : age === MT.TEEN ? 0.9 : age === MT.ELDERLY ? 0.95 : 1) * (ch.gender === MT.FEMALE ? 0.95 : 1);
    const b = BUILD[ch.build] || 1;
    const fem = ch.gender === MT.FEMALE;
    return {
      s: h,
      thigh: BASE.thigh,
      shin: BASE.shin,
      torso: BASE.torso,
      neck: BASE.neck,
      upper: BASE.upper,
      fore: BASE.fore,
      head: BASE.head * (age === MT.CHILD ? 1.28 : 1),
      shoulderW: (fem ? 8.5 : 10.5) * b,
      hipW: (fem ? 9.5 : 8) * b,
      waistW: (fem ? 6.8 : 8.3) * b,
      thighW: 14.5 * b,
      shinW: 11 * Math.sqrt(b),
      upperW: 10 * b,
      foreW: 8.4 * Math.sqrt(b),
      belly: ch.build === MT.HEAVY ? 6 : 0,
      stoop: age === MT.ELDERLY ? 0.1 : 0,
    };
  };
  const P = (o) =>
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
  const lerpPose = (A, B, k) => {
    const L = U.lerp;
    return {
      lean: L(A.lean, B.lean, k),
      hipY: L(A.hipY, B.hipY, k),
      dy: L(A.dy, B.dy, k),
      rot: L(A.rot, B.rot, k),
      head: L(A.head, B.head, k),
      l: [0, 1].map((i) => [L(A.l[i][0], B.l[i][0], k), L(A.l[i][1], B.l[i][1], k)]),
      a: [0, 1].map((i) => [L(A.a[i][0], B.a[i][0], k), L(A.a[i][1], B.a[i][1], k)]),
      hold: k < 0.5 ? A.hold : B.hold,
      sparks: k < 0.5 ? A.sparks : B.sparks,
    };
  };
  ME.lerpPose = lerpPose;
  ME.charDims = (ch) => dims(ch);
  const S = Math.sin,
    Co = Math.cos;
  const act = (id, name, loop, stride, pose, extra) => ME.registerAction(id, Object.assign({ name, loop, stride, pose }, extra || {}));
  act(MT.STAND, MT.DUNG, true, 0, (ph, t) =>
    P({
      lean: 0.02 + S(t * 1.6) * 0.008,
      a: [
        [0.07, 0.12 + S(t * 1.6) * 0.02],
        [-0.05, 0.14],
      ],
    }),
  );
  act(MT.IDLE, MT.DUNG_CHO, true, 0, (ph, t) => {
    const w = U.noise(t * 0.4, 3) * 0.04;
    return P({
      lean: 0.03 + w,
      head: U.noise(t * 0.3, 9) * 0.12,
      l: [
        [0.06 + w, 0.02],
        [-0.07 + w, 0.02],
      ],
      a: [
        [0.06, 0.2],
        [-0.08, 0.2],
      ],
    });
  });
  act(MT.WALK, MT.DI_BO, true, 150, (ph) =>
    P({
      lean: 0.06,
      dy: -Math.abs(S(ph)) * 3.2,
      l: [
        [0.44 * S(ph), 0.62 * Math.max(0, S(ph + 1.25))],
        [-0.44 * S(ph), 0.62 * Math.max(0, S(ph + 1.25 + PI))],
      ],
      a: [
        [-0.38 * S(ph), 0.32 - 0.12 * S(ph)],
        [0.38 * S(ph), 0.32 + 0.12 * S(ph)],
      ],
    }),
  );
  act(MT.RUN, MT.CHAY, true, 300, (ph) =>
    P({
      lean: 0.24,
      dy: -Math.abs(S(ph)) * 9,
      l: [
        [0.85 * S(ph), 1.3 * Math.max(0, S(ph + 1.1)) + 0.15],
        [-0.85 * S(ph), 1.3 * Math.max(0, S(ph + 1.1 + PI)) + 0.15],
      ],
      a: [
        [-0.95 * S(ph), 1.45],
        [0.95 * S(ph), 1.45],
      ],
    }),
  );
  act(MT.SNEAK, MT.RON_REN, true, 90, (ph) =>
    P({
      lean: 0.32,
      hipY: 14,
      l: [
        [0.3 + 0.35 * S(ph), 0.7 + 0.3 * Math.max(0, S(ph + 1.2))],
        [0.3 - 0.35 * S(ph), 0.7 + 0.3 * Math.max(0, S(ph + 1.2 + PI))],
      ],
      a: [
        [0.5, 1.1],
        [0.3, 1.2],
      ],
    }),
  );
  act(MT.SIT, MT.NGOI_GHE, true, 0, (ph, t) =>
    P({
      lean: -0.02 + S(t * 1.4) * 0.01,
      hipY: 46,
      l: [
        [1.5, 1.5],
        [1.45, 1.45],
      ],
      a: [
        [0.35, 0.9],
        [0.2, 0.8],
      ],
    }),
  );
  act(MT.SIT_EAT, MT.NGOI_AN_UONG, true, 0, (ph, t) => {
    const k = Math.max(0, S(t * 1.3));
    return P({
      lean: 0.08,
      hipY: 46,
      l: [
        [1.5, 1.5],
        [1.45, 1.45],
      ],
      a: [
        [0.5 + k * 0.9, 1.0 + k * 1.3],
        [0.55, 0.9],
      ],
    });
  });
  act(MT.TYPE, MT.GO_MAY_CHU, true, 0, (ph, t) =>
    P({
      lean: 0.14,
      hipY: 46,
      head: 0.12,
      l: [
        [1.5, 1.5],
        [1.45, 1.45],
      ],
      a: [
        [0.95 + S(t * 13) * 0.04, 0.75],
        [0.9 + S(t * 11 + 1) * 0.04, 0.8],
      ],
    }),
  );
  act(MT.CRAWL, MT.BO, true, 70, (ph) =>
    P({
      lean: 1.38,
      hipY: 46,
      l: [
        [0.05 + 0.25 * S(ph), 1.6],
        [0.05 - 0.25 * S(ph), 1.6],
      ],
      a: [
        [1.58 - 1.2 + 0.25 * S(ph + PI), 0.05],
        [1.58 - 1.2 + 0.25 * S(ph), 0.05],
      ],
      head: -0.6,
    }),
  );
  act(MT.DIG, MT.DAO_CUOC, true, 0, (ph, t) => {
    const c = (t * 1.1) % 1;
    const up = c < 0.55 ? U.ease(c / 0.55) : 1 - U.easeIn((c - 0.55) / 0.45);
    return P({
      lean: 0.55 - up * 0.45,
      hipY: 6,
      l: [
        [0.35, 0.3],
        [-0.25, 0.1],
      ],
      a: [
        [0.9 + up * 2.2, 0.4 - up * 0.2],
        [0.8 + up * 2.1, 0.5 - up * 0.2],
      ],
      hold: MT.PICKAXE,
    });
  });
  act(MT.WELD, MT.HAN_CAT, true, 0, (ph, t) =>
    P({
      lean: 0.35,
      hipY: 40,
      l: [
        [1.45, 3.0],
        [0.2, 1.5],
      ],
      a: [
        [1.15 + S(t * 9) * 0.03, 0.4],
        [1.0, 0.6],
      ],
      hold: MT.TORCH,
      sparks: true,
    }),
  );
  act(MT.DRILL, MT.KHOAN, true, 0, (ph, t) =>
    P({
      lean: 0.18,
      dy: S(t * 40) * 0.6,
      l: [
        [0.3, 0.25],
        [-0.2, 0.05],
      ],
      a: [
        [1.4 + S(t * 40) * 0.02, 0.15],
        [1.25, 0.35],
      ],
      hold: MT.DRILL,
      sparks: true,
    }),
  );
  act(MT.CARRY, MT.VAC_TUI, true, 135, (ph) =>
    P({
      lean: 0.12,
      dy: -Math.abs(S(ph)) * 2.5,
      l: [
        [0.38 * S(ph), 0.55 * Math.max(0, S(ph + 1.25))],
        [-0.38 * S(ph), 0.55 * Math.max(0, S(ph + 1.25 + PI))],
      ],
      a: [
        [-0.3 * S(ph), 0.35],
        [2.6, 2.4],
      ],
      hold: MT.BAG_SHOULDER,
    }),
  );
  act(MT.DRAG, MT.KEO_TUI, true, 110, (ph) =>
    P({
      lean: -0.05,
      l: [
        [0.36 * S(ph), 0.55 * Math.max(0, S(ph + 1.25))],
        [-0.36 * S(ph), 0.55 * Math.max(0, S(ph + 1.25 + PI))],
      ],
      a: [
        [0.2, 0.3],
        [-0.55, 0.05],
      ],
      hold: MT.BAG_DRAG,
    }),
  );
  act(MT.PUSH, MT.DAY_2, true, 90, (ph) =>
    P({
      lean: 0.5,
      l: [
        [0.15 + 0.4 * S(ph), 0.5 * Math.max(0, S(ph + 1.2)) + 0.1],
        [0.15 - 0.4 * S(ph), 0.5 * Math.max(0, S(ph + 1.2 + PI)) + 0.1],
      ],
      a: [
        [1.15, 0.25],
        [1.05, 0.35],
      ],
    }),
  );
  act(MT.LIFT, MT.BE_DO, true, 0, (ph, t) =>
    P({
      lean: 0.05 + S(t * 1.5) * 0.01,
      l: [
        [0.08, 0.05],
        [-0.06, 0.05],
      ],
      a: [
        [0.85, 0.95],
        [0.8, 1.0],
      ],
      hold: MT.BOX,
    }),
  );
  act(MT.CLIMB, MT.LEO, true, 0, (ph) =>
    P({
      lean: 0.05,
      dy: -Math.max(0, S(ph)) * 6,
      l: [
        [0.9 + 0.6 * S(ph), 1.6 + 0.4 * S(ph)],
        [0.9 - 0.6 * S(ph), 1.6 - 0.4 * S(ph)],
      ],
      a: [
        [2.6 + 0.35 * S(ph + PI), 0.2],
        [2.6 + 0.35 * S(ph), 0.2],
      ],
    }),
  );
  act(MT.JUMP, MT.NHAY_MOT_LAN, false, 0, (ph, t, o) => {
    const k = U.clamp(o && o.progress != null ? o.progress : (t % 1.2) / 1.2);
    if (k < 0.2) {
      const c = U.ease(k / 0.2);
      return P({
        lean: 0.3 * c,
        hipY: 22 * c,
        l: [
          [0.6 * c, 1.2 * c],
          [0.5 * c, 1.1 * c],
        ],
        a: [
          [-0.6 * c, 0.3],
          [-0.5 * c, 0.3],
        ],
      });
    }
    if (k < 0.8) {
      const c = (k - 0.2) / 0.6;
      return P({
        lean: 0.1,
        dy: -S(c * PI) * 90,
        l: [
          [0.5 + 0.4 * S(c * PI), 1.2 * S(c * PI) + 0.1],
          [0.3, 0.9 * S(c * PI) + 0.2],
        ],
        a: [
          [2.4 - c, 0.3],
          [2.2 - c, 0.3],
        ],
      });
    }
    const c = U.easeOut((k - 0.8) / 0.2);
    return P({
      lean: 0.3 * (1 - c),
      hipY: 22 * (1 - c),
      l: [
        [0.6 * (1 - c), 1.2 * (1 - c)],
        [0.5 * (1 - c), 1.1 * (1 - c)],
      ],
      a: [
        [0.6, 0.6],
        [0.5, 0.6],
      ],
    });
  });
  act(MT.FALL, MT.NGA_MOT_LAN, false, 0, (ph, t, o) => {
    const k = U.easeIn(U.clamp(o && o.progress != null ? o.progress : (t % 1.4) / 1.4));
    return P({
      rot: -k * 1.5,
      hipY: k * 10,
      lean: 0.2 * k,
      l: [
        [0.3 * k, 0.5 * k],
        [-0.2, 0.3 * k],
      ],
      a: [
        [1.8 * k, 0.4],
        [1.5 * k, 0.3],
      ],
    });
  });
  act(MT.LIE, MT.NAM, true, 0, (ph, t) =>
    P({
      rot: -PI / 2,
      hipY: 84,
      dy: S(t * 1.2) * 0.6,
      lean: 0,
      l: [
        [0.02, 0],
        [-0.03, 0.02],
      ],
      a: [
        [0.15, 0.2],
        [0.05, 0.3],
      ],
    }),
  );
  act(MT.KNEEL, MT.QUY_MOT_GOI, true, 0, (ph, t) =>
    P({
      lean: 0.08 + S(t * 1.4) * 0.01,
      hipY: 40,
      l: [
        [1.5, 1.55],
        [0.1, 1.6],
      ],
      a: [
        [0.6, 0.6],
        [0.3, 0.4],
      ],
    }),
  );
  act(MT.TALK, MT.NOI_CHUYEN, true, 0, (ph, t) => {
    const g1 = Math.max(0, U.noise(t * 1.4, 4)),
      g2 = Math.max(0, U.noise(t * 1.1, 8));
    return P({
      lean: 0.03,
      head: U.noise(t * 1.7, 2) * 0.08,
      l: [
        [0.07, 0.02],
        [-0.06, 0.02],
      ],
      a: [
        [0.15 + g1 * 0.9, 0.5 + g1 * 0.9],
        [0.05 + g2 * 0.5, 0.4 + g2 * 0.6],
      ],
    });
  });
  act(MT.POINT, MT.CHI_TAY, true, 0, (ph, t) =>
    P({
      lean: 0.04,
      l: [
        [0.07, 0.02],
        [-0.06, 0.02],
      ],
      a: [
        [1.75 + S(t * 2) * 0.03, 0.05],
        [-0.05, 0.2],
      ],
    }),
  );
  act(MT.WAVE, MT.VAY_TAY, true, 0, (ph, t) =>
    P({
      lean: 0.02,
      a: [
        [2.7, 0.3 + S(t * 8) * 0.45],
        [-0.05, 0.2],
      ],
    }),
  );
  act(MT.PHONE, MT.NGHE_DIEN_THOAI, true, 0, (ph, t) =>
    P({
      lean: 0.03,
      head: 0.1,
      l: [
        [0.05, 0.02],
        [-0.06, 0.02],
      ],
      a: [
        [0.35, 2.75],
        [-0.05 + S(t) * 0.05, 0.3],
      ],
      hold: MT.PHONE,
    }),
  );
  act(MT.PAINT, MT.VIET_SON_LEN_TUONG, true, 0, (ph, t) =>
    P({
      lean: 0.05,
      l: [
        [0.12, 0.04],
        [-0.1, 0.03],
      ],
      a: [
        [1.65 + S(t * 5) * 0.18, 0.15 + Co(t * 5) * 0.12],
        [0.1, 0.25],
      ],
      hold: MT.MARKER,
    }),
  );
  act(MT.LOOK_AROUND, MT.NHIN_QUANH, true, 0, (ph, t) =>
    P({
      lean: 0.02,
      head: S(t * 0.9) * 0.25,
      a: [
        [0.05, 0.2],
        [-0.05, 0.2],
      ],
    }),
  );
  act(MT.REACH, MT.VOI_TAY_MO_DAT_DO_VAO, true, 0, (ph, t) => {
    const k = 0.5 + 0.5 * Math.sin(t * 2.2);
    return P({
      lean: 0.1 + k * 0.04,
      head: 0.06,
      l: [
        [0.1, 0.04],
        [-0.08, 0.03],
      ],
      a: [
        [1.3 + k * 0.12, 0.35 - k * 0.15],
        [0.35, 0.6],
      ],
    });
  });
  act(MT.CHECK_WATCH, MT.XEM_DONG_HO_DEO_TAY, true, 0, (ph, t) =>
    P({
      lean: 0.03,
      head: 0.28 + S(t * 0.8) * 0.02,
      l: [
        [0.06, 0.02],
        [-0.06, 0.02],
      ],
      a: [
        [0.95, 1.95],
        [0.75, 1.55],
      ],
    }),
  );
  act(MT.HANDS_POCKET, MT.DUT_TAY_TUI_QUAN, true, 0, (ph, t) =>
    P({
      lean: 0.01 + S(t * 1.3) * 0.008,
      a: [
        [-0.12, 0.9],
        [-0.18, 0.9],
      ],
    }),
  );
  act(MT.THINK, MT.SUY_NGHI, true, 0, (ph, t) =>
    P({
      lean: 0.04,
      head: 0.12 + S(t) * 0.03,
      a: [
        [0.4, 2.6],
        [0.55, 1.5],
      ],
    }),
  );
  act(MT.CELEBRATE, MT.AN_MUNG, true, 0, (ph, t) =>
    P({
      lean: -0.05,
      dy: -Math.abs(S(t * 5)) * 5,
      a: [
        [2.8 + S(t * 6) * 0.1, 0.2],
        [2.7 - S(t * 6) * 0.1, 0.2],
      ],
    }),
  );
  act(MT.DRINK, MT.UONG, true, 0, (ph, t) => {
    const k = Math.max(0, S(t * 0.9));
    return P({
      lean: 0.02 - k * 0.06,
      head: -k * 0.25,
      a: [
        [0.4 + k * 1.1, 1.0 + k * 1.4],
        [-0.05, 0.2],
      ],
      hold: MT.BOTTLE,
    });
  });
  act(MT.SWEEP_LIGHT, MT.SOI_DEN_PIN, true, 0, (ph, t) =>
    P({
      lean: 0.08,
      head: S(t * 0.7) * 0.12,
      a: [
        [1.45 + S(t * 0.7) * 0.25, 0.1],
        [0.1, 0.4],
      ],
      hold: MT.FLASHLIGHT,
    }),
  );
  act(MT.RIDE_MOTO, MT.LAI_XE_MAY, true, 0, (ph, t) =>
    P({
      lean: 0.38,
      hipY: 30,
      dy: S(t * 15) * 0.5,
      l: [
        [1.15, 2.1],
        [1.05, 2.0],
      ],
      a: [
        [1.25, 0.35],
        [1.2, 0.4],
      ],
    }),
  );
  act(MT.RIDE_PASSENGER, MT.NGOI_SAU_XE_MAY, true, 0, (ph, t) =>
    P({
      lean: 0.22,
      hipY: 30,
      dy: S(t * 15 + 1) * 0.5,
      l: [
        [1.05, 2.0],
        [0.95, 1.9],
      ],
      a: [
        [0.95, 0.5],
        [0.9, 0.6],
      ],
    }),
  );
  act(MT.RIDE_BIKE, MT.DAP_XE, true, 0, (ph) =>
    P({
      lean: 0.38,
      hipY: 6,
      l: [
        [1.05 + 0.38 * S(ph), 1.25 + 0.45 * Co(ph)],
        [1.05 + 0.38 * S(ph + PI), 1.25 + 0.45 * Co(ph + PI)],
      ],
      a: [
        [1.2, 0.25],
        [1.15, 0.25],
      ],
    }),
  );
  act(MT.DRIVE, MT.LAI_O_TO, true, 0, (ph, t) =>
    P({
      lean: -0.05,
      hipY: 46,
      l: [
        [1.4, 0.4],
        [1.35, 0.5],
      ],
      a: [
        [1.05 + S(t * 0.6) * 0.04, 0.8],
        [1.0, 0.85],
      ],
    }),
  );
  act(MT.SWIM, MT.BOI, true, 120, (ph) =>
    P({
      rot: 1.35,
      lean: 0,
      hipY: 0,
      l: [
        [0.25 * S(ph * 2), 0.1],
        [-0.25 * S(ph * 2), 0.1],
      ],
      a: [
        [2.9 + 1.2 * S(ph), 0.2],
        [2.9 - 1.2 * S(ph), 0.2],
      ],
    }),
  );
  ME.ACTIONS_LIST = () => Object.keys(ME.registry.actions);
  const pt = (x, y, ang, len) => [x + S(ang) * len, y + Co(ang) * len];
  ME.skeleton = (ch, pose) => {
    const d = dims(ch);
    const hipY = -BASE.hip + pose.hipY + pose.dy;
    const lean = pose.lean + d.stoop;
    const hip = [0, hipY];
    const sh = [S(lean) * d.torso, hipY - Co(lean) * d.torso];
    const neck = [sh[0] + S(lean * 1.2) * d.neck, sh[1] - Co(lean * 1.2) * d.neck];
    const hd = [neck[0] + S(lean + pose.head) * d.head * 0.9, neck[1] - Co(lean + pose.head) * d.head * 0.95];
    const legs = pose.l.map(([a, k]) => {
      const knee = pt(hip[0], hip[1], a, d.thigh);
      const foot = pt(knee[0], knee[1], a - k, d.shin);
      return { knee, foot, a, k };
    });
    const arms = pose.a.map(([a, e]) => {
      const elbow = pt(sh[0], sh[1], a + lean * 0.3, d.upper);
      const hand = pt(elbow[0], elbow[1], a + lean * 0.3 + e, d.fore);
      return { elbow, hand, a: a + lean * 0.3, e };
    });
    return { d, hip, sh, neck, hd, legs, arms, lean };
  };
  const limb = (g, a, b, c, w1, w2, col) => {
    g.strokeStyle = col;
    g.lineCap = MT.ROUND;
    g.lineJoin = MT.ROUND;
    g.lineWidth = w1;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
    g.lineWidth = w2;
    g.beginPath();
    g.moveTo(b[0], b[1]);
    g.lineTo(c[0], c[1]);
    g.stroke();
  };
  const disc = (g, x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, Math.max(0.1, r), 0, PI * 2);
    g.fill();
  };
  const R = (g, x, y, w, h, r, col) => {
    g.fillStyle = col;
    if (r) {
      ME.roundRect(g, x, y, w, h, r);
      g.fill();
    } else g.fillRect(x, y, w, h);
  };
  const palette = (ch, o) => {
    const c = Object.assign({ skin: MT.C99A78, hair: MT.VALUE_2A1E18, top: MT.VALUE_3A4A5E, bottom: MT.VALUE_24272E, shoes: MT.VALUE_16130F, hat: MT.VALUE_2B2B2F, accent: MT.C8553D }, ch.colors || {});
    if (o.style === MT.SILHOUETTE) {
      const s = o.sil || MT.VALUE_07090D;
      const back = C.shade(s, 0.07);
      return { skin: s, hair: s, top: s, bottom: s, shoes: s, hat: s, accent: s, backTop: back, backBottom: back, backSkin: back, detail: C.shade(s, 0.12) };
    }
    const k = o.ambient == null ? 0 : o.ambient;
    const mk = (col) => (k ? C.mix(col, o.ambientColor || MT.VALUE_0B1220, k) : col);
    const r = { skin: mk(c.skin), hair: mk(c.hair), top: mk(c.top), bottom: mk(c.bottom), shoes: mk(c.shoes), hat: mk(c.hat), accent: mk(c.accent) };
    r.backTop = C.shade(r.top, -0.28);
    r.backBottom = C.shade(r.bottom, -0.28);
    r.backSkin = C.shade(r.skin, -0.25);
    r.detail = C.shade(r.top, -0.35);
    return r;
  };
  ME.charPalette = (ch, o) => palette(ch, o || {});
  const hatCol = (ch, pal, def) => (ch.colors && ch.colors.hat ? pal.hat : def);
  const OUTFIT_EXTRA = {};
  const ACC_EXTRA = {};
  ME.CHAR_FX = ME.CHAR_FX || {};
  ME.charFx = (draw) => (g, chIn, o) => {
    const ch = typeof chIn === MT.STRING ? ME.registry.characters[chIn] || (ME.customCharacters && ME.customCharacters[chIn]) : chIn;
    const fx = ch && ch.fx && ME.CHAR_FX[ch.fx];
    if (!fx) return draw(g, chIn, o);
    return fx(g, ch, o || {}, draw);
  };
  const HEADWEAR_EXTRA = {
    crown: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.E2B33A);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-r * 0.95, -r * 0.55);
      const pts = 5;
      for (let i = 0; i <= pts * 2; i++) {
        const x = -r * 0.95 + (i / (pts * 2)) * r * 1.9;
        g.lineTo(x, i % 2 ? -r * 1.15 : -r * 1.7);
      }
      g.lineTo(r * 0.95, -r * 0.55);
      g.closePath();
      g.fill();
      g.fillStyle = C.shade(col, -0.25);
      g.fillRect(-r * 0.97, -r * 0.75, r * 1.94, r * 0.22);
      disc(g, 0, -r * 0.64, r * 0.1, MT.C42A3A);
      disc(g, -r * 0.5, -r * 0.64, r * 0.08, MT.VALUE_2A6AD0);
      disc(g, r * 0.5, -r * 0.64, r * 0.08, MT.VALUE_1AA260);
    },
    tiara: (g, r, pal, ch) => {
      g.fillStyle = hatCol(ch, pal, MT.E8E4F2);
      g.beginPath();
      g.moveTo(-r * 0.8, -r * 0.72);
      g.lineTo(-r * 0.3, -r * 1.0);
      g.lineTo(0, -r * 1.35);
      g.lineTo(r * 0.3, -r * 1.0);
      g.lineTo(r * 0.8, -r * 0.72);
      g.lineTo(r * 0.8, -r * 0.6);
      g.lineTo(-r * 0.8, -r * 0.6);
      g.closePath();
      g.fill();
      disc(g, 0, -r * 1.05, r * 0.1, MT.VALUE_8AD0FF);
    },
    knight_helmet: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.A3ABB3);
      disc(g, 0, -r * 0.05, r * 1.22, col);
      g.fillStyle = C.shade(col, -0.25);
      g.fillRect(-r * 1.22, -r * 0.05, r * 2.44, r * 0.18);
      g.fillStyle = MT.VALUE_14161A;
      g.fillRect(r * 0.25, -r * 0.35, r * 0.95, r * 0.14);
      g.fillStyle = (ch.colors && ch.colors.accent) || MT.B02A2A;
      g.beginPath();
      g.moveTo(-r * 0.2, -r * 1.15);
      g.quadraticCurveTo(-r * 1.4, -r * 2.0, -r * 1.9, -r * 0.6);
      g.quadraticCurveTo(-r * 1.0, -r * 1.3, -r * 0.05, -r * 1.05);
      g.fill();
    },
    cowboy_hat: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_8A5A32);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-r * 2.0, -r * 0.85);
      g.quadraticCurveTo(0, -r * 0.2, r * 2.0, -r * 0.85);
      g.quadraticCurveTo(0, -r * 0.45, -r * 2.0, -r * 0.85);
      g.fill();
      g.beginPath();
      g.moveTo(-r * 0.95, -r * 0.55);
      g.lineTo(-r * 0.85, -r * 1.65);
      g.quadraticCurveTo(0, -r * 1.35, r * 0.85, -r * 1.65);
      g.lineTo(r * 0.95, -r * 0.55);
      g.closePath();
      g.fill();
      g.fillStyle = C.shade(col, -0.35);
      g.fillRect(-r * 0.93, -r * 0.82, r * 1.86, r * 0.18);
    },
    wizard_hat: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_3A2A6A);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, -r * 0.62, r * 1.85, r * 0.32, 0, 0, PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-r * 0.95, -r * 0.65);
      g.quadraticCurveTo(-r * 0.4, -r * 2.2, -r * 1.6, -r * 3.0);
      g.quadraticCurveTo(r * 0.3, -r * 2.3, r * 0.95, -r * 0.65);
      g.closePath();
      g.fill();
      g.fillStyle = MT.F2D36A;
      g.beginPath();
      g.arc(r * 0.05, -r * 1.35, r * 0.18, 0, PI * 2);
      g.fill();
    },
    tricorn: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_1A1A1E);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-r * 1.65, -r * 0.6);
      g.quadraticCurveTo(-r * 0.6, -r * 2.1, 0, -r * 1.25);
      g.quadraticCurveTo(r * 0.6, -r * 2.1, r * 1.65, -r * 0.6);
      g.quadraticCurveTo(0, -r * 0.3, -r * 1.65, -r * 0.6);
      g.fill();
      g.strokeStyle = MT.D6B25A;
      g.lineWidth = Math.max(1, r * 0.08);
      g.beginPath();
      g.moveTo(-r * 1.6, -r * 0.62);
      g.quadraticCurveTo(0, -r * 0.34, r * 1.6, -r * 0.62);
      g.stroke();
    },
    turban: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.E8DCC0);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(-r * 0.05, -r * 0.62, r * 1.2, r * 0.82, 0, PI, 0);
      g.fill();
      g.strokeStyle = C.shade(col, -0.2);
      g.lineWidth = Math.max(1, r * 0.07);
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.ellipse(-r * 0.05, -r * 0.62, r * (1.15 - i * 0.12), r * (0.75 - i * 0.2), -0.25 + i * 0.25, PI * 1.05, PI * 1.95);
        g.stroke();
      }
      disc(g, r * 0.35, -r * 1.05, r * 0.13, (ch.colors && ch.colors.accent) || MT.C42A3A);
    },
    khan_dong: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_1C1A22);
      g.fillStyle = col;
      ME.roundRect(g, -r * 1.12, -r * 1.18, r * 2.24, r * 0.75, r * 0.3);
      g.fill();
      g.strokeStyle = C.shade(col, 0.25);
      g.lineWidth = Math.max(1, r * 0.06);
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-r * 1.0 + i * r * 0.5, -r * 1.15);
        g.lineTo(-r * 0.75 + i * r * 0.5, -r * 0.48);
        g.stroke();
      }
    },
    hijab: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_4A5A7A);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(r * 0.75, -r * 0.6);
      g.arc(-r * 0.05, -r * 0.05, r * 1.28, -PI * 0.28, PI * 0.62, true);
      g.lineTo(-r * 0.9, r * 1.9);
      g.quadraticCurveTo(r * 0.2, r * 2.0, r * 0.85, r * 1.2);
      g.lineTo(r * 0.55, r * 0.75);
      g.quadraticCurveTo(r * 0.0, r * 0.4, r * 0.05, -r * 0.2);
      g.quadraticCurveTo(r * 0.2, -r * 0.62, r * 0.75, -r * 0.6);
      g.fill();
    },
    headband: (g, r, pal, ch) => {
      const col = (ch.colors && (ch.colors.hat || ch.colors.accent)) || MT.C42A2A;
      g.fillStyle = col;
      g.fillRect(-r * 1.04, -r * 0.62, r * 2.08, r * 0.26);
      g.beginPath();
      g.moveTo(-r * 1.0, -r * 0.55);
      g.quadraticCurveTo(-r * 1.6, -r * 0.3, -r * 1.9, r * 0.2);
      g.lineTo(-r * 1.7, r * 0.25);
      g.quadraticCurveTo(-r * 1.45, -r * 0.2, -r * 1.0, -r * 0.4);
      g.fill();
    },
    top_hat: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_16161A);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, -r * 0.62, r * 1.45, r * 0.24, 0, 0, PI * 2);
      g.fill();
      g.fillRect(-r * 0.85, -r * 2.25, r * 1.7, r * 1.65);
      g.fillStyle = (ch.colors && ch.colors.accent) || MT.VALUE_6A1A1A;
      g.fillRect(-r * 0.85, -r * 0.98, r * 1.7, r * 0.24);
    },
    grad_cap: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.VALUE_16161A);
      g.fillStyle = col;
      g.beginPath();
      g.arc(0, -r * 0.35, r * 1.02, PI, 0);
      g.fill();
      g.beginPath();
      g.moveTo(-r * 1.7, -r * 1.05);
      g.lineTo(0, -r * 1.45);
      g.lineTo(r * 1.7, -r * 1.05);
      g.lineTo(0, -r * 0.7);
      g.closePath();
      g.fill();
      g.strokeStyle = MT.E2B33A;
      g.lineWidth = Math.max(1, r * 0.07);
      g.beginPath();
      g.moveTo(0, -r * 1.08);
      g.lineTo(-r * 1.3, -r * 0.95);
      g.lineTo(-r * 1.3, -r * 0.3);
      g.stroke();
    },
    straw_hat: (g, r, pal, ch) => {
      const col = hatCol(ch, pal, MT.D9B86A);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, -r * 0.62, r * 2.1, r * 0.36, 0, 0, PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(0, -r * 0.8, r * 1.0, r * 0.62, 0, PI, 0);
      g.fill();
      g.fillStyle = (ch.colors && ch.colors.accent) || MT.B02A2A;
      g.fillRect(-r * 0.98, -r * 0.92, r * 1.96, r * 0.16);
    },
    bubble_helmet: (g, r) => {
      g.fillStyle = MT.RGBA_190_225_255_0_22;
      g.beginPath();
      g.arc(0, -r * 0.05, r * 1.55, 0, PI * 2);
      g.fill();
      g.strokeStyle = MT.RGBA_240_248_255_0_85;
      g.lineWidth = Math.max(1.2, r * 0.1);
      g.stroke();
      g.strokeStyle = MT.RGBA_255_255_255_0_6;
      g.beginPath();
      g.arc(0, -r * 0.05, r * 1.2, -PI * 0.85, -PI * 0.55);
      g.stroke();
      g.fillStyle = MT.D8DDE2;
      g.fillRect(-r * 1.2, r * 1.15, r * 2.4, r * 0.35);
    },
    santa_hat: (g, r) => {
      g.fillStyle = MT.C42A2A;
      g.beginPath();
      g.moveTo(-r * 1.0, -r * 0.6);
      g.quadraticCurveTo(-r * 0.2, -r * 2.2, -r * 1.7, -r * 1.6);
      g.quadraticCurveTo(-r * 0.2, -r * 1.4, r * 1.0, -r * 0.6);
      g.closePath();
      g.fill();
      g.fillStyle = MT.F4F2EE;
      ME.roundRect(g, -r * 1.1, -r * 0.82, r * 2.2, r * 0.36, r * 0.18);
      g.fill();
      disc(g, -r * 1.72, -r * 1.55, r * 0.26, MT.F4F2EE);
    },
  };
  const drawHead = (g, ch, sk, pal) => {
    const [hx, hy] = sk.hd;
    const r = sk.d.head;
    const ang = sk.lean + 0;
    const hair = ch.hair || MT.SHORT;
    if (hair === MT.LONG || hair === MT.PONYTAIL || hair === MT.BUN) {
      g.fillStyle = pal.hair;
      g.beginPath();
      if (hair === MT.LONG) {
        g.moveTo(hx - r * 0.9, hy - r * 0.2);
        g.quadraticCurveTo(hx - r * 1.35, hy + r * 1.6, hx - r * 0.2, hy + r * 2.3);
        g.lineTo(hx + r * 0.25, hy + r * 0.6);
        g.closePath();
      } else if (hair === MT.PONYTAIL) {
        g.ellipse(hx - r * 1.25, hy + r * 0.2, r * 0.38, r * 0.85, 0.35, 0, PI * 2);
      } else {
        g.arc(hx - r * 0.95, hy - r * 0.45, r * 0.55, 0, PI * 2);
      }
      g.fill();
    }
    disc(g, hx, hy, r, pal.skin);
    g.fillStyle = pal.skin;
    g.beginPath();
    g.moveTo(hx + r * 0.85, hy - r * 0.15);
    g.lineTo(hx + r * 1.12, hy + r * 0.12);
    g.lineTo(hx + r * 0.82, hy + r * 0.3);
    g.fill();
    if (hair !== MT.BALD) {
      g.fillStyle = pal.hair;
      g.beginPath();
      if (hair === MT.CURLY) {
        for (let i = 0; i < 6; i++) {
          const a = -PI * 0.95 + i * 0.36;
          g.moveTo(hx, hy);
          g.arc(hx + Math.cos(a) * r * 0.75, hy + Math.sin(a) * r * 0.75, r * 0.42, 0, PI * 2);
        }
      } else {
        g.arc(hx - r * 0.06, hy - r * 0.05, r * 1.04, PI * 0.82, PI * 1.98);
        g.quadraticCurveTo(hx + r * 0.4, hy - r * 0.55, hx - r * 0.35, hy - r * 0.25);
        g.lineTo(hx - r * 0.75, hy + r * 0.5);
        g.closePath();
      }
      g.fill();
    }
    if (ch.facial === MT.BEARD || (ch.accessories || []).includes(MT.BEARD)) {
      g.fillStyle = pal.hair;
      g.beginPath();
      g.moveTo(hx + r * 0.95, hy + r * 0.3);
      g.quadraticCurveTo(hx + r * 0.7, hy + r * 1.25, hx - r * 0.1, hy + r * 0.95);
      g.lineTo(hx + r * 0.1, hy + r * 0.35);
      g.fill();
    } else if (ch.facial === MT.MUSTACHE || (ch.accessories || []).includes(MT.MUSTACHE)) {
      g.fillStyle = pal.hair;
      g.fillRect(hx + r * 0.55, hy + r * 0.32, r * 0.48, r * 0.16);
    }
    if ((ch.accessories || []).includes(MT.GLASSES)) {
      g.strokeStyle = pal.detail;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(hx + r * 0.2, hy - r * 0.15);
      g.lineTo(hx + r * 1.0, hy - r * 0.12);
      g.stroke();
    }
    const accH = ch.accessories || [];
    if (accH.includes(MT.EYEPATCH)) {
      g.strokeStyle = MT.VALUE_111;
      g.lineWidth = Math.max(1, r * 0.08);
      g.beginPath();
      g.moveTo(hx - r * 0.95, hy - r * 0.55);
      g.lineTo(hx + r * 0.9, hy - r * 0.05);
      g.stroke();
      disc(g, hx + r * 0.55, hy - r * 0.18, r * 0.24, MT.VALUE_111);
    }
    if (accH.includes(MT.FACE_MASK)) {
      g.fillStyle = (ch.colors && ch.colors.mask) || MT.CFE3EE;
      ME.roundRect(g, hx + r * 0.05, hy + r * 0.02, r * 1.05, r * 0.7, r * 0.25);
      g.fill();
      g.strokeStyle = MT.RGBA_0_0_0_0_25;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(hx + r * 0.05, hy + r * 0.2);
      g.lineTo(hx - r * 0.8, hy - r * 0.1);
      g.stroke();
    }
    const hw = ch.headwear || MT.NONE;
    g.fillStyle = pal.hat;
    g.save();
    g.translate(hx, hy);
    g.rotate(ang * 0.6);
    if (hw === MT.CAP || hw === MT.POLICE_CAP) {
      g.beginPath();
      g.arc(0, -r * 0.15, r * 1.06, PI, 0);
      g.fill();
      g.fillRect(r * 0.2, -r * 0.3, r * 1.25, r * 0.22);
      if (hw === MT.POLICE_CAP) {
        g.fillRect(-r * 1.15, -r * 1.05, r * 2.2, r * 0.55);
        g.fillStyle = pal.accent;
        g.fillRect(-r * 0.2, -r * 0.85, r * 0.4, r * 0.3);
      }
    } else if (hw === MT.FEDORA) {
      g.beginPath();
      g.ellipse(0, -r * 0.55, r * 1.75, r * 0.3, 0, 0, PI * 2);
      g.fill();
      ME.roundRect(g, -r * 0.95, -r * 1.55, r * 1.9, r * 1.1, r * 0.35);
      g.fill();
      g.fillStyle = pal.detail;
      g.fillRect(-r * 0.95, -r * 0.8, r * 1.9, r * 0.2);
    } else if (hw === MT.BERET) {
      g.beginPath();
      g.ellipse(-r * 0.15, -r * 0.7, r * 1.25, r * 0.55, -0.15, 0, PI * 2);
      g.fill();
    } else if (hw === MT.HELMET || hw === MT.HARDHAT) {
      g.beginPath();
      g.arc(0, -r * 0.1, r * 1.14, PI, 0);
      g.fill();
      if (hw === MT.HARDHAT) g.fillRect(-r * 1.4, -r * 0.2, r * 2.8, r * 0.2);
    } else if (hw === MT.BEANIE) {
      g.beginPath();
      g.arc(0, -r * 0.1, r * 1.08, PI, 0);
      g.fill();
      g.fillRect(-r * 1.08, -r * 0.3, r * 2.16, r * 0.3);
    } else if (hw === MT.HEADLAMP) {
      g.fillStyle = pal.detail;
      g.fillRect(-r * 1.02, -r * 0.55, r * 2.05, r * 0.25);
      g.fillStyle = MT.E9E2C8;
      g.fillRect(r * 0.85, -r * 0.62, r * 0.32, r * 0.38);
    } else if (hw === MT.HOOD) {
      g.beginPath();
      g.arc(-r * 0.1, -r * 0.05, r * 1.3, PI * 0.55, PI * 2.05);
      g.fill();
    } else if (hw === MT.CONICAL) {
      g.fillStyle = ch.colors && ch.colors.hat ? pal.hat : MT.D9C48F;
      g.beginPath();
      g.moveTo(-r * 2.1, -r * 0.35);
      g.lineTo(0, -r * 1.9);
      g.lineTo(r * 2.1, -r * 0.35);
      g.quadraticCurveTo(0, -r * 0.05, -r * 2.1, -r * 0.35);
      g.fill();
      g.strokeStyle = MT.RGBA_0_0_0_0_18;
      g.lineWidth = Math.max(0.6, r * 0.05);
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(-r * 2.1 * (1 - i * 0.22), -r * 0.35 - r * 1.55 * i * 0.22);
        g.lineTo(r * 2.1 * (1 - i * 0.22), -r * 0.35 - r * 1.55 * i * 0.22);
        g.stroke();
      }
    } else if (hw === MT.CHEF_HAT) {
      g.fillStyle = MT.F4F4F2;
      ME.roundRect(g, -r * 0.9, -r * 1.9, r * 1.8, r * 1.3, r * 0.5);
      g.fill();
      g.fillRect(-r * 1.0, -r * 0.75, r * 2.0, r * 0.35);
    } else if (hw === MT.CROWN_BUN) {
      g.fillStyle = pal.hair;
      g.beginPath();
      g.arc(-r * 0.1, -r * 1.05, r * 0.5, 0, PI * 2);
      g.fill();
    } else if (hw !== MT.NONE && HEADWEAR_EXTRA[hw]) HEADWEAR_EXTRA[hw](g, r, pal, ch);
    g.restore();
  };
  const drawTorso = (g, ch, sk, pal) => {
    const d = sk.d,
      [hx, hy] = sk.hip,
      [sx, sy] = sk.sh;
    const outfit = ch.outfit || MT.CASUAL;
    const nx = -Math.cos(sk.lean),
      ny = -Math.sin(sk.lean);
    const fx = -nx,
      fy = -ny;
    const shW = d.shoulderW,
      hipW = d.hipW + (outfit === MT.DRESS ? 1 : 0);
    const belly = d.belly;
    g.fillStyle = pal.top;
    g.beginPath();
    g.moveTo(sx + nx * shW, sy + ny * shW);
    g.quadraticCurveTo(sx + fx * shW * 1.05 + (hx - sx) * 0.1, sy + fy * shW, sx + fx * shW, sy + fy * shW);
    const midx = (sx + hx) / 2 + fx * (d.waistW + belly),
      midy = (sy + hy) / 2 + fy * (d.waistW + belly);
    g.quadraticCurveTo(midx, midy, hx + fx * hipW, hy + fy * hipW);
    g.lineTo(hx + nx * hipW, hy + ny * hipW);
    g.quadraticCurveTo((sx + hx) / 2 + nx * d.waistW, (sy + hy) / 2 + ny * d.waistW, sx + nx * shW, sy + ny * shW);
    g.closePath();
    g.fill();
    const knees = sk.legs.map((l) => l.knee),
      feet = sk.legs.map((l) => l.foot);
    const hem = (target, extra, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(hx + nx * hipW * 1.05, hy + ny * hipW * 1.05);
      g.lineTo(hx + fx * hipW * 1.05, hy + fy * hipW * 1.05);
      const minX = Math.min(target[0][0], target[1][0]) - extra,
        maxX = Math.max(target[0][0], target[1][0]) + extra;
      const ty = Math.max(target[0][1], target[1][1]);
      g.lineTo(maxX, ty);
      g.lineTo(minX, ty);
      g.closePath();
      g.fill();
    };
    if (outfit === MT.COAT || outfit === MT.TRENCH) {
      hem(
        knees.map((k, i) => [U.lerp(k[0], feet[i][0], 0.25), U.lerp(k[1], feet[i][1], 0.25)]),
        6,
        pal.top,
      );
    } else if (outfit === MT.SUIT || outfit === MT.UNIFORM || outfit === MT.MILITARY) {
      hem(
        [
          [U.lerp(hx, knees[0][0], 0.28), U.lerp(hy, knees[0][1], 0.28)],
          [U.lerp(hx, knees[1][0], 0.28), U.lerp(hy, knees[1][1], 0.28)],
        ],
        3,
        pal.top,
      );
      if (outfit === MT.SUIT) {
        g.strokeStyle = pal.accent;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(sx + fx * 2 + (hx - sx) * 0.05, sy + 4);
        g.lineTo(sx + fx * 4 + (hx - sx) * 0.45, sy + (hy - sy) * 0.45);
        g.stroke();
      }
      if (outfit === MT.UNIFORM || outfit === MT.MILITARY) {
        g.fillStyle = pal.detail;
        g.fillRect(Math.min(hx, sx) - shW, U.lerp(sy, hy, 0.86), shW * 2.2, 3.2);
      }
    } else if (outfit === MT.DRESS) {
      hem(
        knees.map((k, i) => [U.lerp(k[0], feet[i][0], 0.2), U.lerp(k[1], feet[i][1], 0.2)]),
        10,
        pal.top,
      );
    } else if (outfit === MT.ROBE) {
      hem(
        feet.map((f) => [f[0], f[1] - 6]),
        12,
        pal.top,
      );
    } else if (outfit === MT.GOWN) {
      hem(
        feet.map((f) => [f[0], f[1] - 2]),
        26,
        pal.top,
      );
      g.fillStyle = pal.accent;
      g.fillRect(Math.min(sx, hx) - shW, U.lerp(sy, hy, 0.62), shW * 2.2, 3);
    } else if (outfit === MT.AO_DAI_2) {
      hem(
        knees.map((k, i) => [U.lerp(k[0], feet[i][0], 0.55), U.lerp(k[1], feet[i][1], 0.55)]),
        5,
        pal.top,
      );
      g.strokeStyle = C.shade(pal.top, -0.15);
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(hx, hy);
      g.lineTo(hx, U.lerp(hy, Math.max(feet[0][1], feet[1][1]), 0.6));
      g.stroke();
    } else if (outfit === MT.TUNIC || outfit === MT.ARMOR) {
      hem(
        [
          [U.lerp(hx, knees[0][0], 0.5), U.lerp(hy, knees[0][1], 0.5)],
          [U.lerp(hx, knees[1][0], 0.5), U.lerp(hy, knees[1][1], 0.5)],
        ],
        5,
        outfit === MT.ARMOR ? C.shade(pal.top, -0.12) : pal.top,
      );
      g.fillStyle = outfit === MT.ARMOR ? C.shade(pal.top, -0.35) : pal.accent;
      g.fillRect(Math.min(hx, sx) - shW, U.lerp(sy, hy, 0.86), shW * 2.2, 4);
      if (outfit === MT.ARMOR) {
        g.strokeStyle = C.shade(pal.top, 0.25);
        g.lineWidth = 1.6;
        for (const k of [0.3, 0.55]) {
          g.beginPath();
          g.moveTo(U.lerp(sx, hx, k) - shW, U.lerp(sy, hy, k));
          g.lineTo(U.lerp(sx, hx, k) + shW, U.lerp(sy, hy, k));
          g.stroke();
        }
        disc(g, sx, sy + 4, shW * 0.75, C.shade(pal.top, 0.12));
      }
    } else if (outfit === MT.SPACESUIT) {
      hem(
        [
          [U.lerp(hx, knees[0][0], 0.2), U.lerp(hy, knees[0][1], 0.2)],
          [U.lerp(hx, knees[1][0], 0.2), U.lerp(hy, knees[1][1], 0.2)],
        ],
        4,
        pal.top,
      );
      R(g, U.lerp(sx, hx, 0.3) + fx * 2 - 6, U.lerp(sy, hy, 0.3), 12, 10, 2, MT.VALUE_5A6A7A);
      disc(g, U.lerp(sx, hx, 0.3) + fx * 2 - 2, U.lerp(sy, hy, 0.3) + 4, 1.8, MT.E24A3A);
      disc(g, U.lerp(sx, hx, 0.3) + fx * 2 + 3, U.lerp(sy, hy, 0.3) + 4, 1.8, MT.VALUE_3AE27A);
      g.fillStyle = pal.accent;
      g.fillRect(Math.min(hx, sx) - shW, U.lerp(sy, hy, 0.86), shW * 2.2, 3);
    } else if (outfit === MT.SPORT) {
      g.strokeStyle = pal.accent;
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(sx + nx * shW * 0.9, sy + 4);
      g.lineTo(hx + nx * hipW * 0.9, hy - 2);
      g.stroke();
      g.fillStyle = pal.accent;
      g.font = MF.BOLD_PX_SANS_SERIF(`${Math.round(shW * 0.9)}`);
      g.textAlign = MT.CENTER;
      g.fillText(String(ch.number || 10), U.lerp(sx, hx, 0.45), U.lerp(sy, hy, 0.55));
    } else if (outfit === MT.APRON) {
      g.fillStyle = (ch.colors && ch.colors.apron) || MT.F2EFE6;
      g.fillRect(U.lerp(sx, hx, 0.35) + fx * shW * 0.2 - shW * 0.6, U.lerp(sy, hy, 0.35), shW * 1.2, (hy - sy) * 0.65 + 26);
    } else if (outfit === MT.OVERALLS) {
      g.strokeStyle = pal.bottom;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(sx + fx * shW * 0.4, sy + 2);
      g.lineTo(U.lerp(sx, hx, 0.55) + fx * 3, U.lerp(sy, hy, 0.55));
      g.stroke();
      g.fillStyle = pal.bottom;
      g.fillRect(Math.min(sx, hx) - 2, U.lerp(sy, hy, 0.55), shW * 1.6, (hy - sy) * 0.45);
    } else if (OUTFIT_EXTRA[outfit]) {
      OUTFIT_EXTRA[outfit](g, { ch, sk, pal, hem, sx, sy, hx, hy, fx, fy, nx, ny, shW, hipW, knees, feet });
    }
    if ((ch.accessories || []).includes(MT.VEST)) {
      g.fillStyle = pal.accent;
      g.fillRect(U.lerp(sx, hx, 0.35) - shW * 0.9, U.lerp(sy, hy, 0.35), shW * 1.8, 3);
      g.fillRect(U.lerp(sx, hx, 0.7) - shW * 0.9, U.lerp(sy, hy, 0.7), shW * 1.8, 3);
    }
    const accT = ch.accessories || [];
    if (accT.includes(MT.NECKLACE)) {
      g.strokeStyle = MT.E2B33A;
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(sk.neck[0] + fx * 2, sk.neck[1] + 2, 7, 0.2, PI - 0.2);
      g.stroke();
    }
    if (accT.includes(MT.MEDAL)) {
      disc(g, U.lerp(sx, hx, 0.28) + fx * shW * 0.55, U.lerp(sy, hy, 0.28), 3.6, MT.E2B33A);
      g.fillStyle = MT.C42A2A;
      g.fillRect(U.lerp(sx, hx, 0.28) + fx * shW * 0.55 - 2, U.lerp(sy, hy, 0.28) - 9, 4, 6);
    }
    if ((ch.accessories || []).includes(MT.SCARF) || (ch.accessories || []).includes(MT.TIE)) {
      g.fillStyle = pal.accent;
      g.beginPath();
      g.ellipse(sk.neck[0] + fx * 1.5, sk.neck[1] + 3, 7, 4, sk.lean, 0, PI * 2);
      g.fill();
    }
  };
  const drawShoe = (g, foot, kneeA, col, f) => {
    void kneeA;
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(foot[0] + 4.5 * f, foot[1] - 1.5, 8.5, 4.6, 0, 0, PI * 2);
    g.fill();
  };
  const HELD_KINDS = { pickaxe: 1, torch: 1, drill: 1, flashlight: 1, marker: 1, phone: 1, bottle: 1, box: 1, bag_shoulder: 1, bag_drag: 1, briefcase: 1 };
  const heldKindFor = (pose, o, acc) => {
    if (pose.hold) return pose.hold;
    if (o && o.hold) {
      if (HELD_KINDS[o.hold]) return o.hold;
      const mapped = ME.HOLDABLE && ME.HOLDABLE[o.hold];
      if (mapped) return mapped;
    }
    return acc.includes(MT.BRIEFCASE) ? MT.BRIEFCASE : null;
  };
  ME.heldKindFor = heldKindFor;
  const drawHeldAsset = (g, id, hand, scale) => {
    const a = ME.registry.assets[id];
    if (!a) return;
    const size = a.size || [60, 60];
    const real = (ME.REAL_SIZE && ME.REAL_SIZE[id]) || 24;
    const sc = scale || real / Math.max(size[0], size[1]);
    g.save();
    g.translate(hand[0] + 2, hand[1] + size[1] * sc * 0.45);
    g.scale(sc, sc);
    try {
      a.draw(g, {});
    } catch (e) {
      void e;
    }
    g.restore();
  };
  const drawHeld = (g, kind, hand, elbow, pal, t) => {
    if (!kind) return;
    const ang = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]);
    g.save();
    g.translate(hand[0], hand[1]);
    g.rotate(ang);
    const metal = MT.VALUE_8D949C,
      dark = MT.VALUE_1B1D22;
    if (kind === MT.PICKAXE) {
      g.strokeStyle = MT.VALUE_6A4A2C;
      g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(-12, 0);
      g.lineTo(48, 0);
      g.stroke();
      g.strokeStyle = metal;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(48, -22);
      g.quadraticCurveTo(54, 0, 48, 22);
      g.stroke();
    } else if (kind === MT.TORCH) {
      g.fillStyle = dark;
      g.fillRect(0, -2.5, 26, 5);
      g.fillStyle = MT.CFE3FF;
      ME.glow(g, 30, 0, 10, MT.BFE0FF, 0.9);
    } else if (kind === MT.DRILL) {
      g.fillStyle = MT.C8A02A;
      ME.roundRect(g, -6, -9, 26, 14, 3);
      g.fill();
      g.fillStyle = metal;
      g.fillRect(20, -3, 18, 3.4);
    } else if (kind === MT.FLASHLIGHT) {
      g.fillStyle = dark;
      ME.roundRect(g, -3, -3.2, 20, 6.4, 2);
      g.fill();
      g.fillStyle = MT.F4ECD0;
      g.fillRect(16, -4, 3, 8);
    } else if (kind === MT.MARKER) {
      g.fillStyle = pal.accent || MT.C8553D;
      g.fillRect(0, -1.8, 13, 3.6);
    } else if (kind === MT.PHONE) {
      g.fillStyle = dark;
      g.fillRect(-2, -8, 5, 14);
    } else if (kind === MT.BOTTLE) {
      g.fillStyle = MT.VALUE_3D1A22;
      ME.roundRect(g, -3, -14, 7, 22, 2.5);
      g.fill();
    } else if (kind === MT.BOX) {
      g.restore();
      g.fillStyle = MT.VALUE_8A6A46;
      g.fillRect(hand[0] - 4, hand[1] - 26, 34, 28);
      g.fillStyle = MT.VALUE_6F5436;
      g.fillRect(hand[0] - 4, hand[1] - 15, 34, 3);
      return;
    } else if (kind === MT.BAG_SHOULDER) {
      g.restore();
      g.fillStyle = MT.VALUE_3B3A33;
      g.beginPath();
      g.ellipse(hand[0] - 6, hand[1] + 6, 26, 13, -0.2, 0, PI * 2);
      g.fill();
      g.strokeStyle = MT.VALUE_57554B;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(hand[0] - 26, hand[1] + 4);
      g.lineTo(hand[0] + 14, hand[1] + 1);
      g.stroke();
      return;
    } else if (kind === MT.BAG_DRAG) {
      g.restore();
      g.fillStyle = MT.VALUE_3B3A33;
      g.beginPath();
      g.ellipse(hand[0] - 30, -12, 30, 12, 0, 0, PI * 2);
      g.fill();
      g.strokeStyle = MT.VALUE_3B3A33;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(hand[0], hand[1]);
      g.lineTo(hand[0] - 8, -18);
      g.stroke();
      return;
    } else if (kind === MT.BRIEFCASE) {
      g.restore();
      g.fillStyle = MT.VALUE_3A2A1D;
      g.fillRect(hand[0] - 13, hand[1] + 2, 26, 19);
      g.fillStyle = MT.VALUE_24190F;
      g.fillRect(hand[0] - 4, hand[1] - 1, 8, 4);
      return;
    }
    void t;
    g.restore();
  };
  const lightEmitters = [];
  const GROUND_LOCK = { walk: 0, carry: 0, sneak: 0, drag: 0, push: 0, hands_pocket: 0, look_around: 0, run: 7 };
  const STAND_FOOT_Y = -3.1;
  ME.drawCharacter = (g, ch, o = {}) => {
    ch = typeof ch === MT.STRING ? ME.registry.characters[ch] || (ME.customCharacters && ME.customCharacters[ch]) || ME.registry.characters.man_casual : ch || ME.registry.characters.man_casual;
    const a = ME.registry.actions[o.action || MT.STAND] || ME.registry.actions.stand;
    const pose = o.pose || a.pose(o.phase || 0, o.t || 0, o);
    const sk = ME.skeleton(ch, pose);
    const pal = palette(ch, o);
    const f = o.facing == null ? 1 : o.facing;
    const scale = (o.scale || 1) * sk.d.s;
    let footLock = 0;
    if (!pose.rot && GROUND_LOCK[o.action || MT.STAND] != null) {
      const lowest = Math.max(sk.legs[0].foot[1], sk.legs[1].foot[1]);
      footLock = Math.max(0, STAND_FOOT_Y - lowest - GROUND_LOCK[o.action || MT.STAND]);
    }
    g.save();
    if (o.shadow !== false && !pose.rot) {
      g.fillStyle = MF.RGBA_0_0_0(`${o.shadowAlpha == null ? 0.28 : o.shadowAlpha}`);
      g.beginPath();
      g.ellipse(0, 0, 26 * scale, 4.5 * scale, 0, 0, PI * 2);
      g.fill();
    }
    g.scale(scale * (Math.abs(f) < 0.12 ? 0.12 * Math.sign(f || 1) : f), scale);
    if (footLock) g.translate(0, footLock);
    if (pose.rot) {
      g.translate(0, sk.hip[1]);
      g.rotate(pose.rot);
      g.translate(0, -sk.hip[1]);
    }
    const passes = o.rim && o.style !== MT.FLAT_NORIM ? 2 : 1;
    for (let pass = 0; pass < passes; pass++) {
      const rimPass = passes === 2 && pass === 0;
      const P2 = rimPass ? rimPal(o.rim) : pal;
      g.save();
      if (rimPass) g.translate((o.rim.dx == null ? -1.8 : o.rim.dx) * (f < 0 ? -1 : 1), o.rim.dy == null ? -1.4 : o.rim.dy);
      const bl = sk.legs[1],
        fl = sk.legs[0],
        ba = sk.arms[1],
        fa = sk.arms[0];
      const outfit = ch.outfit || MT.CASUAL;
      const legCol = outfit === MT.DRESS ? P2.skin : P2.bottom;
      const legColB = outfit === MT.DRESS ? P2.backSkin : P2.backBottom;
      const accB = ch.accessories || [];
      if (accB.includes(MT.CAPE) && !rimPass) {
        const capeCol = (ch.colors && ch.colors.cape) || P2.accent || MT.VALUE_8A1A1A;
        const kneeY = Math.max(bl.knee[1], fl.knee[1]) + 18;
        const wave = Math.sin((o.t || 0) * 3.2 + (o.phase || 0)) * 8 + (Math.abs(o.speed || 0) > 0 ? -18 : 0);
        g.fillStyle = C.shade(capeCol, -0.12);
        g.beginPath();
        g.moveTo(sk.sh[0] + sk.d.shoulderW * 0.6, sk.sh[1] - 2);
        g.quadraticCurveTo(sk.hip[0] - 30 + wave * 0.5, sk.hip[1], sk.hip[0] - 34 + wave, kneeY);
        g.lineTo(sk.hip[0] + 8 + wave * 0.4, kneeY + 4);
        g.quadraticCurveTo(sk.hip[0] + 6, sk.hip[1], sk.sh[0] - sk.d.shoulderW * 0.4, sk.sh[1] + 2);
        g.closePath();
        g.fill();
      }
      limb(g, sk.sh, ba.elbow, ba.hand, sk.d.upperW, sk.d.foreW, P2.backTop);
      disc(g, ba.hand[0], ba.hand[1], 4.4, P2.backSkin);
      if (!rimPass && accB.includes(MT.STAFF) && !pose.hold) {
        g.strokeStyle = MT.VALUE_6A4A2A;
        g.lineWidth = 3.4;
        g.beginPath();
        g.moveTo(ba.hand[0] - 2, ba.hand[1] + 70);
        g.lineTo(ba.hand[0] + 4, ba.hand[1] - 110);
        g.stroke();
        ME.glow(g, ba.hand[0] + 4, ba.hand[1] - 116, 9, (ch.colors && ch.colors.accent) || MT.VALUE_8AD0FF, 0.9);
      }
      if (!rimPass && accB.includes(MT.HANDBAG)) {
        g.strokeStyle = MT.VALUE_2A1A12;
        g.lineWidth = 1.2;
        g.beginPath();
        g.arc(ba.hand[0], ba.hand[1] + 8, 7, PI, 0);
        g.stroke();
        R(g, ba.hand[0] - 10, ba.hand[1] + 8, 20, 15, 3, (ch.colors && ch.colors.bag) || MT.VALUE_7A3A2A);
      }
      limb(g, sk.hip, bl.knee, bl.foot, sk.d.thighW, sk.d.shinW, legColB);
      drawShoe(g, bl.foot, bl.a, C.shade(P2.shoes, -0.2), 1);
      limb(g, sk.hip, fl.knee, fl.foot, sk.d.thighW, sk.d.shinW, legCol);
      drawShoe(g, fl.foot, fl.a, P2.shoes, 1);
      drawTorso(g, ch, sk, P2);
      if (!rimPass && accB.includes(MT.SWORD)) {
        g.save();
        g.translate(sk.hip[0] - 2, sk.hip[1] - 2);
        g.rotate(0.95);
        R(g, 0, -2.2, 52, 4.4, 2, MT.VALUE_3A2A1E);
        R(g, -10, -2, 10, 4, 1, MT.C9A23A);
        R(g, -2, -6, 3, 12, 1, MT.C9A23A);
        g.restore();
      }
      limb(g, sk.sh, sk.neck, sk.neck, 7, 7, P2.skin);
      for (const ax of accB) if (!rimPass && ACC_EXTRA[ax] && ACC_EXTRA[ax].back) ACC_EXTRA[ax].back(g, { ch, sk, pal: P2, o, fa, ba, bl, fl, before: true });
      drawHead(g, ch, sk, P2);
      for (const ax of accB) if (!rimPass && ACC_EXTRA[ax] && ACC_EXTRA[ax].front) ACC_EXTRA[ax].front(g, { ch, sk, pal: P2, o, fa, ba, bl, fl });
      if (!rimPass) {
        const acc = ch.accessories || [];
        if (acc.includes(MT.CAMERA)) {
          g.fillStyle = MT.VALUE_15171B;
          ME.roundRect(g, sk.sh[0] + 3, U.lerp(sk.sh[1], sk.hip[1], 0.32), 15, 10, 2);
          g.fill();
          g.fillStyle = MT.VALUE_3D434C;
          disc(g, sk.sh[0] + 14, U.lerp(sk.sh[1], sk.hip[1], 0.32) + 5, 3.6, MT.VALUE_2F343B);
        }
        if (acc.includes(MT.BACKPACK) || acc.includes(MT.TANK)) {
          g.fillStyle = acc.includes(MT.TANK) ? MT.VALUE_9AA3AB : MT.VALUE_35362F;
          ME.roundRect(g, sk.sh[0] - sk.d.shoulderW - 11, sk.sh[1] + 2, 12, 38, 5);
          g.fill();
        }
        const heldKind = heldKindFor(pose, o, acc);
        drawHeld(g, heldKind, (heldKind === MT.BRIEFCASE ? ba : fa).hand, (heldKind === MT.BRIEFCASE ? ba : fa).elbow, P2, o.t);
        if (!pose.hold && o.hold && !HELD_KINDS[o.hold] && !(ME.HOLDABLE && ME.HOLDABLE[o.hold])) drawHeldAsset(g, o.hold, fa.hand, o.holdScale);
      }
      limb(g, sk.sh, fa.elbow, fa.hand, sk.d.upperW, sk.d.foreW, P2.top);
      disc(g, fa.hand[0], fa.hand[1], 4.6, P2.skin);
      if (!rimPass && (ch.accessories || []).includes(MT.SHIELD)) {
        const mx = U.lerp(fa.elbow[0], fa.hand[0], 0.45) + 4,
          my = U.lerp(fa.elbow[1], fa.hand[1], 0.45);
        const sc = (ch.colors && ch.colors.shield) || P2.accent || MT.VALUE_2A4A8A;
        g.fillStyle = MT.VALUE_8D949C;
        g.beginPath();
        g.moveTo(mx - 15, my - 20);
        g.lineTo(mx + 15, my - 20);
        g.quadraticCurveTo(mx + 16, my + 12, mx, my + 24);
        g.quadraticCurveTo(mx - 16, my + 12, mx - 15, my - 20);
        g.fill();
        g.fillStyle = sc;
        g.beginPath();
        g.moveTo(mx - 12, my - 17);
        g.lineTo(mx + 12, my - 17);
        g.quadraticCurveTo(mx + 13, my + 10, mx, my + 20);
        g.quadraticCurveTo(mx - 13, my + 10, mx - 12, my - 17);
        g.fill();
        g.fillStyle = MT.E2B33A;
        g.fillRect(mx - 1.5, my - 14, 3, 30);
        g.fillRect(mx - 10, my - 4, 20, 3);
      }
      g.restore();
    }
    if (o.lights) {
      const m = g.getTransform ? g.getTransform() : null;
      const toWorld = (p) => (m ? [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f] : p);
      const fa = sk.arms[0];
      const dir = Math.atan2(fa.hand[1] - fa.elbow[1], fa.hand[0] - fa.elbow[0]);
      if (heldKindFor(pose, o, ch.accessories || []) === MT.FLASHLIGHT) o.lights.push({ type: MT.BEAM, p: toWorld([fa.hand[0] + Math.cos(dir) * 18, fa.hand[1] + Math.sin(dir) * 18]), angle: f < 0 ? PI - dir : dir, len: 520 * scale, color: MT.FFF2CF });
      if (pose.sparks) o.lights.push({ type: MT.SPARKS, p: toWorld([fa.hand[0] + Math.cos(dir) * 30, fa.hand[1] + Math.sin(dir) * 30]), color: MT.BFE0FF, seed: ch.id });
      if ((ch.headwear || "") === MT.HEADLAMP) o.lights.push({ type: MT.BEAM, p: toWorld([sk.hd[0] + 12, sk.hd[1] - 6]), angle: f < 0 ? PI - 0.12 : 0.12, len: 420 * scale, color: MT.FFF4D8 });
    }
    g.restore();
    return sk;
  };
  ME.drawCharacter = ME.charFx(ME.drawCharacter);
  ME.rigInternals = { GROUND_LOCK, STAND_FOOT_Y, heldKindFor, drawHeld, drawHeldAsset, HELD_KINDS, palette, HEADWEAR_EXTRA, OUTFIT_EXTRA, ACC_EXTRA };
  const rimCache = {};
  const rimPal = (rim) => {
    const col = rim.color || MT.FFCF9A;
    if (rimCache[col]) return rimCache[col];
    const c = C.rgba(col, rim.alpha == null ? 0.85 : rim.alpha);
    return (rimCache[col] = { skin: c, hair: c, top: c, bottom: c, shoes: c, hat: c, accent: c, backTop: c, backBottom: c, backSkin: c, detail: c });
  };
  void lightEmitters;
  const CH = (id, name, tags, o) => ME.registerCharacter(Object.assign({ id, name, tags, builtin: true, gender: MT.MALE, age: MT.ADULT, build: MT.NORMAL, hair: MT.SHORT, headwear: MT.NONE, outfit: MT.CASUAL, accessories: [] }, o));
  CH(MT.MAN_CASUAL, MT.DAN_ONG_THUONG_PHUC, [MT.NGUOI, MT.NAM_2], { colors: { top: MT.VALUE_5B6B7D, bottom: MT.VALUE_2C3038 } });
  CH(MT.WOMAN_CASUAL, MT.PHU_NU_THUONG_PHUC, [MT.NGUOI, MT.NU], { gender: MT.FEMALE, hair: MT.LONG, outfit: MT.DRESS, colors: { top: MT.VALUE_8A4B52, hair: MT.VALUE_3A2518 } });
  CH(MT.PHOTOGRAPHER, MT.NHIEP_ANH_GIA, [MT.NHIEP_ANH, MT.NAM_2, MT.TRUNG_NIEN], { outfit: MT.SUIT, accessories: [MT.CAMERA, MT.MUSTACHE], colors: { top: MT.VALUE_4A4036, bottom: MT.VALUE_2A2622, accent: MT.VALUE_9B3B2F, hair: MT.VALUE_2A2420 } });
  CH(MT.BUSINESSMAN, MT.DOANH_NHAN, [MT.DOANH_NHAN_2, MT.VEST], { outfit: MT.SUIT, accessories: [MT.BRIEFCASE], colors: { top: MT.VALUE_2D3442, bottom: MT.VALUE_23262E, accent: MT.VALUE_7A2632 } });
  CH(MT.BUSINESSWOMAN, MT.NU_DOANH_NHAN, [MT.DOANH_NHAN_2, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.SUIT, colors: { top: MT.VALUE_30343F, bottom: MT.VALUE_2A2D36, accent: MT.C9B38A } });
  CH(MT.BANK_MANAGER, MT.QUAN_LY_NGAN_HANG, [MT.NGAN_HANG, MT.VEST, MT.TRUNG_NIEN], { outfit: MT.SUIT, build: MT.HEAVY, hair: MT.BALD, accessories: [MT.GLASSES], colors: { top: MT.VALUE_262C38, bottom: MT.VALUE_1F222A, accent: MT.A33A3A } });
  CH(MT.BANK_TELLER, MT.NHAN_VIEN_NGAN_HANG, [MT.NGAN_HANG, MT.NU], { gender: MT.FEMALE, hair: MT.PONYTAIL, outfit: MT.SUIT, colors: { top: MT.VALUE_3D4A63, accent: MT.E8E2D4 } });
  CH(MT.SECURITY_GUARD, MT.BAO_VE, [MT.BAO_VE_2, MT.DONG_PHUC], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, build: MT.HEAVY, colors: { top: MT.VALUE_2B3446, bottom: MT.VALUE_222838, hat: MT.VALUE_20283A, accent: MT.D8B45A } });
  CH(MT.POLICE_OFFICER, MT.CANH_SAT_2, [MT.CANH_SAT, MT.DONG_PHUC], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, colors: { top: MT.VALUE_283A5C, bottom: MT.VALUE_1E2A44, hat: MT.VALUE_1E2A44, accent: MT.E3C35C } });
  CH(MT.POLICEWOMAN, MT.NU_CANH_SAT, [MT.CANH_SAT, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, colors: { top: MT.VALUE_283A5C, bottom: MT.VALUE_1E2A44, hat: MT.VALUE_1E2A44, accent: MT.E3C35C } });
  CH(MT.DETECTIVE, MT.THAM_TU_AO_CHOANG, [MT.THAM_TU, MT.DIEU_TRA], { outfit: MT.TRENCH, headwear: MT.FEDORA, colors: { top: MT.VALUE_7A6A4F, bottom: MT.VALUE_2B2A27, hat: MT.VALUE_3A352C } });
  CH(MT.JUDGE, MT.THAM_PHAN_2, [MT.THAM_PHAN, MT.TOA_AN_2], { outfit: MT.ROBE, hair: MT.SHORT, accessories: [MT.GLASSES], age: MT.ELDERLY, colors: { top: MT.VALUE_141418, hair: MT.C9C4BC, accent: MT.E8E2D4 } });
  CH(MT.LAWYER, MT.LUAT_SU, [MT.LUAT_SU_2, MT.TOA_AN_2], { outfit: MT.SUIT, accessories: [MT.BRIEFCASE], colors: { top: MT.VALUE_1F2633, accent: MT.VALUE_5A6F8A } });
  CH(MT.WORKER_WELDER, MT.THO_HAN, [MT.THO, MT.HAN, MT.DUONG_HAM], { outfit: MT.OVERALLS, headwear: MT.BEANIE, build: MT.ATHLETIC, colors: { top: MT.VALUE_4B5560, bottom: MT.VALUE_3A4752, hat: MT.VALUE_2A2F35 } });
  CH(MT.WORKER_DIGGER, MT.THO_DAO, [MT.THO, MT.DAO, MT.DUONG_HAM], { outfit: MT.CASUAL, headwear: MT.HEADLAMP, build: MT.ATHLETIC, accessories: [MT.BEARD], colors: { top: MT.VALUE_5C4C3A, bottom: MT.VALUE_33302B } });
  CH(MT.LOCKSMITH, MT.THO_KHOA, [MT.THO, MT.KHOA], { outfit: MT.OVERALLS, headwear: MT.CAP, accessories: [MT.GLASSES], colors: { top: MT.VALUE_3F4B45, bottom: MT.VALUE_33403A } });
  CH(MT.CONSTRUCTION_WORKER, MT.CONG_NHAN_XAY_DUNG, [MT.CONG_NHAN], { outfit: MT.CASUAL, headwear: MT.HARDHAT, accessories: [MT.VEST], colors: { top: MT.VALUE_4A5866, hat: MT.E0A92A, accent: MT.E9E14B } });
  CH(MT.SOLDIER, MT.LINH_DU, [MT.QUAN_DOI, MT.LINH], { outfit: MT.MILITARY, headwear: MT.BERET, build: MT.ATHLETIC, accessories: [MT.BACKPACK], colors: { top: MT.VALUE_4B5A3A, bottom: MT.VALUE_3E4A31, hat: MT.VALUE_7A2A2A } });
  CH(MT.THIEF_HOODED, MT.KE_TROM_DOI_MU_TRUM, [MT.TOI_PHAM, MT.BI_AN], { outfit: MT.CASUAL, headwear: MT.HOOD, colors: { top: MT.VALUE_1E2126, bottom: MT.VALUE_17191D } });
  CH(MT.GANGSTER, MT.TAY_ANH_CHI, [MT.TOI_PHAM, MT.GIANG_HO], { outfit: MT.COAT, headwear: MT.FEDORA, build: MT.HEAVY, colors: { top: MT.VALUE_2B2B2E, bottom: MT.VALUE_1D1D20, hat: MT.VALUE_1B1B1D } });
  CH(MT.ELDERLY_WOMAN, MT.BA_CU, [MT.NGUOI_GIA, MT.NU, MT.ME], { gender: MT.FEMALE, age: MT.ELDERLY, hair: MT.BUN, outfit: MT.DRESS, colors: { top: MT.VALUE_5A4E5E, hair: MT.D8D2CA } });
  CH(MT.ELDERLY_MAN, MT.ONG_CU, [MT.NGUOI_GIA, MT.NAM_2], { age: MT.ELDERLY, hair: MT.BALD, outfit: MT.COAT, accessories: [MT.GLASSES], colors: { top: MT.VALUE_5B5446, hair: MT.CFC9C0 } });
  CH(MT.YOUNG_WOMAN, MT.CO_GAI_TRE, [MT.NU, MT.TRE, MT.BAN_GAI], { gender: MT.FEMALE, hair: MT.PONYTAIL, outfit: MT.CASUAL, build: MT.SLIM, colors: { top: MT.B2654F, bottom: MT.VALUE_2D3B52, hair: MT.VALUE_1E140F } });
  CH(MT.YOUNG_MAN, MT.CHANG_TRAI_TRE, [MT.NAM_2, MT.TRE], { build: MT.SLIM, hair: MT.CURLY, colors: { top: MT.VALUE_3B6B7A, bottom: MT.VALUE_2F3440 } });
  CH(MT.CHILD_BOY, MT.BE_TRAI, [MT.TRE_EM], { age: MT.CHILD, hair: MT.SHORT, colors: { top: MT.D07A3A, bottom: MT.VALUE_2E4566 } });
  CH(MT.CHILD_GIRL, MT.BE_GAI, [MT.TRE_EM, MT.NU], { gender: MT.FEMALE, age: MT.CHILD, hair: MT.PONYTAIL, outfit: MT.DRESS, colors: { top: MT.C75B7A } });
  CH(MT.JOURNALIST, MT.PHONG_VIEN, [MT.BAO_CHI], { outfit: MT.COAT, accessories: [MT.CAMERA], colors: { top: MT.VALUE_6B5B45 } });
  CH(MT.DOCTOR, MT.BAC_SI, [MT.Y_TE], { outfit: MT.COAT, accessories: [MT.GLASSES], colors: { top: MT.E7E7E2, bottom: MT.VALUE_3A4252 } });
  CH(MT.CHEF, MT.DAU_BEP, [MT.NHA_HANG], { outfit: MT.CASUAL, headwear: MT.BEANIE, colors: { top: MT.ECEBE6, hat: MT.F2F2EE, bottom: MT.VALUE_2A2A2A } });
  CH(MT.PILOT, MT.PHI_CONG, [MT.HANG_KHONG], { outfit: MT.UNIFORM, headwear: MT.POLICE_CAP, colors: { top: MT.VALUE_1D2740, hat: MT.VALUE_1D2740, accent: MT.D9B85A } });
  CH(MT.FARMER, MT.NONG_DAN, [MT.NONG_THON], { outfit: MT.OVERALLS, headwear: MT.FEDORA, accessories: [MT.BEARD], colors: { top: MT.VALUE_8C6A45, bottom: MT.VALUE_46607A, hat: MT.B28C55 } });
  CH(MT.DIVER, MT.THO_LAN, [MT.LAN], { outfit: MT.CASUAL, headwear: MT.HELMET, accessories: [MT.TANK], colors: { top: MT.VALUE_1D2A35, bottom: MT.VALUE_1D2A35, hat: MT.VALUE_2B3B48 } });
  CH(MT.MOTORCYCLIST, MT.NGUOI_LAI_MO_TO, [MT.XE_MAY], { outfit: MT.COAT, headwear: MT.HELMET, colors: { top: MT.VALUE_2B2B2B, hat: MT.VALUE_1A1A1A } });
  CH(MT.PRISONER, MT.PHAM_NHAN, [MT.NHA_TU], { outfit: MT.OVERALLS, colors: { top: MT.C46A2C, bottom: MT.C46A2C } });
  CH(MT.TEACHER, MT.GIAO_VIEN, [MT.GIAO_DUC, MT.NU], { gender: MT.FEMALE, hair: MT.BUN, outfit: MT.DRESS, accessories: [MT.GLASSES], colors: { top: MT.VALUE_4F6A5A } });
  CH(MT.SCIENTIST, MT.NHA_KHOA_HOC, [MT.KHOA_HOC], { outfit: MT.COAT, hair: MT.CURLY, accessories: [MT.GLASSES], colors: { top: MT.F0F0EC, hair: MT.VALUE_8A8A8A } });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
