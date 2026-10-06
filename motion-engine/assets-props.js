(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const { R, poly } = ME.shapes;
  const A = (id, name, category, size, draw, extra) => ME.registerAsset(id, Object.assign({ name, category, size, draw, tags: [] }, extra || {}));
  const disc = (g, x, y, r, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, Math.max(0.1, r), 0, PI * 2);
    g.fill();
  };
  const line = (g, pts, col, w) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = MT.ROUND;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  A(
    MT.ALARM_CLOCK,
    MT.DONG_HO_BAO_THUC,
    MT.PROP,
    [70, 80],
    (g, o) => {
      const ring = o.ringing ? Math.sin((o.t || 0) * 60) * 0.12 : 0;
      g.rotate(ring);
      line(
        g,
        [
          [-22, -6],
          [-28, 0],
        ],
        MT.VALUE_333,
        4,
      );
      line(
        g,
        [
          [22, -6],
          [28, 0],
        ],
        MT.VALUE_333,
        4,
      );
      disc(g, -18, -64, 12, MT.B8B9BB);
      disc(g, 18, -64, 12, MT.B8B9BB);
      disc(g, 0, -36, 31, o.color || MT.C43A2C);
      disc(g, 0, -36, 24, MT.F5F1E6);
      const t = o.t || 0;
      line(
        g,
        [
          [0, -36],
          [Math.sin(t * 0.5) * 14, -36 - Math.cos(t * 0.5) * 14],
        ],
        MT.VALUE_222,
        2.5,
      );
      line(
        g,
        [
          [0, -36],
          [Math.sin(t * 6) * 19, -36 - Math.cos(t * 6) * 19],
        ],
        MT.VALUE_222,
        1.4,
      );
      R(g, -2, -72, 4, 8, 1, MT.VALUE_666);
    },
    { tags: [MT.DONG_HO, MT.BAO_THUC], lights: (o) => (o.ringing ? [{ type: MT.RING, x: 0, y: -40, r: 60 + ((o.t || 0) % 0.5) * 120, color: MT.FFFFFF, alpha: 0.25 * (1 - ((o.t || 0) % 0.5) * 2) }] : []) },
  );
  const depositBox = (o) => {
    if (o.drawer == null && !o.content && !o.drawerOpen && !o.reveal && !o.highlight) return null;
    const W = o.w || 600,
      H = o.h || 420;
    const cols = Math.max(1, Math.floor(W / 50)),
      rows = Math.max(1, Math.floor(H / 34));
    const idx = o.drawer == null ? Math.floor(rows * 0.55) * cols + Math.floor(cols / 2) : Math.abs(Math.round(o.drawer)) % (cols * rows);
    const r = Math.floor(idx / cols),
      c = idx % cols;
    return { x: -W / 2 + 4 + c * 50, y: -H + 4 + r * 34 };
  };
  A(
    MT.SAFE_DEPOSIT_WALL,
    MT.TUONG_HOP_KY_GUI,
    MT.INTERIOR,
    [600, 420],
    (g, o) => {
      const W = o.w || 600,
        H = o.h || 420;
      const col = o.color || MT.VALUE_9A8F7A;
      R(g, -W / 2, -H, W, H, 0, C.shade(col, -0.35));
      const cols = Math.floor(W / 50),
        rows = Math.floor(H / 34);
      const rnd = U.rng(5 + (o.seed || 0));
      const openRatio = o.opened || 0;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const x = -W / 2 + 4 + c * 50,
            y = -H + 4 + r * 34;
          const open = rnd() < openRatio;
          if (open) {
            R(g, x, y, 46, 30, 1, MT.VALUE_1B1914);
            R(g, x + 30, y + 2, 20, 26, 1, C.shade(col, 0.05));
          } else {
            R(g, x, y, 46, 30, 1, C.shade(col, (rnd() - 0.5) * 0.08));
            R(g, x, y, 46, 3, 0, C.shade(col, 0.2));
            disc(g, x + 38, y + 15, 3, MT.VALUE_5D5446);
            R(g, x + 8, y + 12, 14, 6, 1, MT.E9E2CF);
          }
        }
      const box = depositBox(o);
      if (box) {
        const t = o.t || 0;
        const d = U.clamp(o.drawerOpen || 0);
        const content = o.content && ME.registry.assets[o.content];
        const cParams = Object.assign({ t }, o.contentParams || {});
        const ringing = !!cParams.ringing;
        const shake = ringing ? Math.sin(t * 70) * 1.6 : 0;
        const { x, y } = box;
        if ((o.highlight || 0) > 0) {
          g.save();
          g.strokeStyle = C.rgba(MT.FFD27A, 0.9 * U.clamp(o.highlight));
          g.lineWidth = 3;
          g.strokeRect(x - 3, y - 3, 52, 36);
          g.restore();
        }
        const drawContent = (cx, cy, alpha) => {
          if (!content) return;
          const sz = content.size || [60, 60];
          const k = 24 / Math.max(sz[0], sz[1]);
          g.save();
          g.globalAlpha *= alpha;
          g.translate(cx, cy);
          g.scale(k, k);
          try {
            content.draw(g, cParams);
          } catch (e) {
            void e;
          }
          g.restore();
        };
        if (d > 0.02) {
          R(g, x, y, 46, 30, 1, MT.VALUE_0D0C0A);
          const k = 1 + 0.35 * d;
          const tw = 46 * k,
            th = 30 * k;
          const tx = x + 23 - tw / 2 + shake,
            ty = y + 30 * 0.75 * d;
          R(g, tx, ty + th * 0.35, tw, th * 0.65, 2, C.shade(col, -0.15));
          R(g, tx + 3, ty + th * 0.35, tw - 6, th * 0.18, 0, MT.VALUE_14120E);
          R(g, tx, ty + th - 4, tw, 4, 0, C.shade(col, 0.15));
          if (d > 0.35) drawContent(x + 23 + shake, ty + th * 0.55, U.clamp((d - 0.35) / 0.3) * (o.showContent == null ? 1 : U.clamp(o.showContent)));
        } else if ((o.reveal || 0) > 0) {
          g.save();
          g.translate(shake, 0);
          R(g, x, y, 46, 30, 1, C.rgba(MT.VALUE_0D0C0A, 0.85 * U.clamp(o.reveal)));
          drawContent(x + 23, y + 27, U.clamp(o.reveal));
          g.restore();
        } else if (shake) {
          R(g, x + shake, y, 46, 30, 1, C.shade(col, 0.06));
          disc(g, x + 38 + shake, y + 15, 3, MT.VALUE_5D5446);
        }
      }
    },
    {
      tags: [MT.NGAN_HANG, MT.KET_SAT, MT.HAM, MT.NGAN_KET],
      params: {
        opened: MT.TI_LE_HOP_DA_BI_MO_0_1,
        drawer: MT.SO_THU_TU_NGAN_DUOC_CHU_Y_MAC,
        drawerOpen: MT.NGAN_KEO_RA_0_1,
        content: MT.ID_DO_VAT_BEN_TRONG_NGAN_VD_ALARM,
        contentParams: MT.THAM_SO_DO_VAT_BEN_TRONG_VD_RINGING,
        reveal: MT.NHIN_XUYEN_NGAN_DONG_THAY_DO_BEN_TRONG,
        highlight: MT.VIEN_SANG_QUANH_NGAN_0_1,
      },
      lights: (o) => {
        const box = depositBox(o);
        if (!box || !(o.contentParams && o.contentParams.ringing)) return [];
        const ph = ((o.t || 0) % 0.6) / 0.6;
        return [
          { type: MT.RING, x: box.x + 23, y: box.y + 15, r: 20 + ph * 90, color: MT.FFFFFF, alpha: 0.35 * (1 - ph) },
          { type: MT.GLOW, x: box.x + 23, y: box.y + 15, r: 60, color: MT.FFD9A0, alpha: 0.25 },
        ];
      },
    },
  );
  A(
    MT.VAULT_DOOR,
    MT.CUA_HAM_THEP_TRON,
    MT.INTERIOR,
    [420, 440],
    (g, o) => {
      const open = U.clamp(o.open || 0);
      R(g, -220, -440, 440, 440, 0, MT.VALUE_5B5F63);
      disc(g, 0, -220, 196, MT.VALUE_2E3135);
      g.save();
      g.translate(0, -220);
      g.scale(1 - open * 0.75, 1);
      disc(g, 0, 0, 186, MT.VALUE_9BA1A6);
      disc(g, 0, 0, 150, MT.VALUE_888E94);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        disc(g, Math.cos(a) * 168, Math.sin(a) * 168, 9, MT.VALUE_6B7076);
      }
      g.rotate(o.wheel || 0);
      disc(g, 0, 0, 40, MT.VALUE_5F646A);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * PI * 2;
        line(
          g,
          [
            [0, 0],
            [Math.cos(a) * 90, Math.sin(a) * 90],
          ],
          MT.C3C8CC,
          10,
        );
      }
      g.restore();
      if (o.welded) {
        g.strokeStyle = MT.FF9A3A;
        g.lineWidth = 4;
        g.setLineDash([8, 6]);
        g.beginPath();
        g.arc(0, -220, 190, 0, PI * 2);
        g.stroke();
        g.setLineDash([]);
      }
    },
    { tags: [MT.HAM, MT.KET_SAT, MT.NGAN_HANG], params: { open: MT.DO_MO_0_1, welded: MT.DA_BI_HAN } },
  );
  A(
    MT.TIME_LOCK,
    MT.KHOA_THOI_GIAN,
    MT.PROP,
    [120, 90],
    (g) => {
      R(g, -60, -90, 120, 90, 6, MT.VALUE_3A3D42);
      for (let i = 0; i < 3; i++) {
        disc(g, -36 + i * 36, -48, 14, MT.E9E4D6);
        line(
          g,
          [
            [-36 + i * 36, -48],
            [-36 + i * 36 + 8, -56],
          ],
          MT.VALUE_222,
          2,
        );
      }
    },
    { tags: [MT.KET_SAT] },
  );
  A(
    MT.GOLD_BARS,
    MT.THOI_VANG,
    MT.PROP,
    [120, 60],
    (g, o) => {
      const n = o.count || 6;
      for (let i = 0; i < n; i++) {
        const row = i < 3 ? 0 : 1,
          c = row ? i - 3 : i;
        const x = -54 + c * 36 + row * 18,
          y = -20 - row * 18;
        poly(
          g,
          [
            [x, y + 18],
            [x + 34, y + 18],
            [x + 28, y],
            [x + 6, y],
          ],
          MT.D8A93A,
        );
        poly(
          g,
          [
            [x + 6, y],
            [x + 28, y],
            [x + 26, y + 4],
            [x + 8, y + 4],
          ],
          MT.F3D67A,
        );
      }
    },
    { tags: [MT.VANG, MT.TIEN], lights: () => [{ type: MT.GLOW, x: 0, y: -24, r: 70, color: MT.FFD36A, alpha: 0.25 }] },
  );
  A(
    MT.CASH_STACK,
    MT.COC_TIEN,
    MT.PROP,
    [140, 70],
    (g, o) => {
      const col = o.color || MT.VALUE_6F8F5A;
      for (let i = 0; i < (o.count || 5); i++) {
        const x = -60 + (i % 3) * 42,
          y = -14 - Math.floor(i / 3) * 16;
        R(g, x, y, 40, 14, 1, col);
        R(g, x + 15, y, 8, 14, 0, MT.E9E2C9);
      }
    },
    { tags: [MT.TIEN] },
  );
  A(
    MT.DIAMOND_POUCH,
    MT.TUI_KIM_CUONG,
    MT.PROP,
    [80, 60],
    (g) => {
      g.fillStyle = MT.VALUE_151515;
      g.beginPath();
      g.ellipse(0, -20, 34, 20, 0, 0, PI * 2);
      g.fill();
      [
        [-10, -34],
        [6, -38],
        [16, -30],
        [-2, -28],
      ].forEach(([x, y]) =>
        poly(
          g,
          [
            [x - 6, y],
            [x + 6, y],
            [x, y + 9],
          ],
          MT.DFF3FF,
        ),
      );
    },
    { tags: [MT.KIM_CUONG], lights: () => [{ type: MT.SPARKLE, x: 0, y: -34, r: 30, color: MT.E9F8FF, alpha: 0.8 }] },
  );
  A(
    MT.LETTERS_BUNDLE,
    MT.XAP_THU,
    MT.PROP,
    [100, 40],
    (g) => {
      for (let i = 0; i < 4; i++) R(g, -44 + i * 3, -10 - i * 7, 84, 8, 1, i % 2 ? MT.EFE6D2 : MT.E2D6BC);
      R(g, -4, -40, 6, 36, 0, MT.A0283A);
    },
    { tags: [MT.THU] },
  );
  A(MT.DOCUMENTS, MT.GIAY_TO_RAI_RAC, MT.PROP, [220, 30], (g, o) => {
    const rnd = U.rng(3 + (o.seed || 0));
    for (let i = 0; i < 9; i++) {
      g.save();
      g.translate(-100 + rnd() * 200, -2 - rnd() * 4);
      g.rotate((rnd() - 0.5) * 0.8);
      R(g, -18, -3, 36, 6, 0, rnd() > 0.5 ? MT.EFE9DA : MT.D8CFB8);
      g.restore();
    }
  });
  A(
    MT.HYDRAULIC_PRESS,
    MT.MAY_EP_THUY_LUC,
    MT.PROP,
    [140, 180],
    (g) => {
      R(g, -60, -24, 120, 24, 2, MT.VALUE_3A3D42);
      R(g, -50, -170, 14, 150, 0, MT.VALUE_55595E);
      R(g, 36, -170, 14, 150, 0, MT.VALUE_55595E);
      R(g, -60, -180, 120, 20, 2, MT.C8A02A);
      R(g, -10, -160, 20, 70, 0, MT.VALUE_8A9096);
    },
    { tags: [MT.DUNG_CU] },
  );
  A(
    MT.GAS_TANK,
    MT.BINH_KHI_NEN,
    MT.PROP,
    [50, 170],
    (g, o) => {
      R(g, -22, -150, 44, 150, 18, o.color || MT.VALUE_3A6A4A);
      R(g, -8, -168, 16, 20, 3, MT.VALUE_888);
    },
    { tags: [MT.DUNG_CU, MT.HAN] },
  );
  A(MT.TOOLBOX, MT.HOP_DUNG_CU, MT.PROP, [110, 70], (g) => {
    R(g, -55, -50, 110, 50, 4, MT.B23A2A);
    R(g, -55, -54, 110, 8, 2, MT.VALUE_8A2A1E);
    line(
      g,
      [
        [-20, -54],
        [-20, -68],
        [20, -68],
        [20, -54],
      ],
      MT.VALUE_333,
      4,
    );
  });
  A(MT.PICKAXE, MT.CUOC_CHIM, MT.PROP, [120, 40], (g) => {
    line(
      g,
      [
        [-50, -6],
        [50, -10],
      ],
      MT.VALUE_6A4A2C,
      5,
    );
    line(
      g,
      [
        [46, -30],
        [54, 10],
      ],
      MT.VALUE_9097A0,
      6,
    );
  });
  A(MT.LADDER, MT.THANG, MT.PROP, [80, 360], (g, o) => {
    const h = o.h || 360;
    line(
      g,
      [
        [-30, 0],
        [-30, -h],
      ],
      MT.VALUE_7A5A3A,
      6,
    );
    line(
      g,
      [
        [30, 0],
        [30, -h],
      ],
      MT.VALUE_7A5A3A,
      6,
    );
    for (let y = 30; y < h; y += 40)
      line(
        g,
        [
          [-30, -y],
          [30, -y],
        ],
        MT.VALUE_7A5A3A,
        4,
      );
  });
  A(
    MT.DUFFEL_BAG,
    MT.TUI_VAI_LON,
    MT.PROP,
    [130, 60],
    (g, o) => {
      g.fillStyle = o.color || MT.VALUE_3B3A33;
      g.beginPath();
      g.ellipse(0, -28, 64, 28, 0, 0, PI * 2);
      g.fill();
      line(
        g,
        [
          [-40, -50],
          [0, -66],
          [40, -50],
        ],
        MT.VALUE_2A2924,
        4,
      );
    },
    { tags: [MT.TUI] },
  );
  A(MT.BRIEFCASE, MT.CAP_TAP, MT.PROP, [90, 70], (g) => {
    R(g, -44, -60, 88, 60, 5, MT.VALUE_4A3020);
    R(g, -14, -70, 28, 12, 4, MT.VALUE_2A1A10);
  });
  A(MT.SUITCASE, MT.VALI, MT.PROP, [100, 150], (g, o) => {
    R(g, -46, -130, 92, 120, 10, o.color || MT.VALUE_2F4A6A);
    R(g, -20, -150, 40, 22, 6, MT.VALUE_222);
    disc(g, -30, -6, 7, MT.VALUE_111);
    disc(g, 30, -6, 7, MT.VALUE_111);
  });
  A(MT.MONEY_BAG, MT.BAO_TIEN, MT.PROP, [80, 100], (g) => {
    g.fillStyle = MT.B99A6A;
    g.beginPath();
    g.ellipse(0, -40, 40, 40, 0, 0, PI * 2);
    g.fill();
    R(g, -14, -90, 28, 18, 6, MT.B99A6A);
    g.fillStyle = MT.VALUE_5A4020;
    g.font = ME.font(800, 34, MT.HEAD);
    g.textAlign = MT.CENTER;
    g.fillText(MT.SYMBOL, 0, -28);
    g.textAlign = MT.LEFT;
  });
  A(MT.RUBBLE, MT.DONG_DAT_DA, MT.PROP, [200, 60], (g, o) => {
    const rnd = U.rng(8 + (o.seed || 0));
    for (let i = 0; i < 18; i++) disc(g, -90 + rnd() * 180, -4 - rnd() * 30 * (1 - Math.abs((i % 9) - 4) / 5), 8 + rnd() * 10, C.shade(o.color || MT.VALUE_6B5A48, (rnd() - 0.5) * 0.3));
  });
  A(MT.CRATE, MT.THUNG_GO, MT.PROP, [100, 100], (g, o) => {
    const col = o.color || MT.VALUE_9A7448;
    R(g, -50, -100, 100, 100, 0, col);
    R(g, -50, -100, 100, 10, 0, C.shade(col, 0.15));
    line(
      g,
      [
        [-46, -96],
        [46, -4],
      ],
      C.shade(col, -0.25),
      6,
    );
    g.strokeStyle = C.shade(col, -0.3);
    g.lineWidth = 3;
    g.strokeRect(-48, -98, 96, 96);
  });
  A(MT.BARREL, MT.THUNG_PHUY, MT.PROP, [80, 120], (g, o) => {
    R(g, -36, -120, 72, 120, 10, o.color || MT.VALUE_3A5A7A);
    R(g, -36, -86, 72, 5, 0, MT.RGBA_0_0_0_0_3);
    R(g, -36, -36, 72, 5, 0, MT.RGBA_0_0_0_0_3);
  });
  A(MT.PIPE, MT.ONG_CONG, MT.INTERIOR, [400, 60], (g, o) => {
    const L = o.w || 400;
    R(g, -L / 2, -50, L, 34, 17, o.color || MT.VALUE_5B6168);
    R(g, -L / 2, -46, L, 6, 3, MT.RGBA_255_255_255_0_12);
  });
  A(MT.TABLE, MT.BAN, MT.FURNITURE, [220, 90], (g, o) => {
    const col = o.color || MT.VALUE_6A4A30;
    R(g, -110, -88, 220, 12, 2, col);
    R(g, -100, -76, 10, 76, 0, C.shade(col, -0.2));
    R(g, 90, -76, 10, 76, 0, C.shade(col, -0.2));
    if (o.cloth) {
      poly(
        g,
        [
          [-116, -88],
          [116, -88],
          [124, -50],
          [-124, -50],
        ],
        o.cloth,
      );
      for (let i = 0; i < 8; i++) R(g, -116 + i * 30, -88, 14, 38, 0, C.shade(o.cloth, -0.08));
    }
  });
  A(
    MT.PICNIC_TABLE,
    MT.BAN_PICNIC_GAP,
    MT.FURNITURE,
    [220, 90],
    (g, o) => {
      R(g, -100, -74, 200, 8, 2, MT.C9C2B0);
      line(
        g,
        [
          [-80, -66],
          [60, 0],
        ],
        MT.VALUE_777,
        4,
      );
      line(
        g,
        [
          [80, -66],
          [-60, 0],
        ],
        MT.VALUE_777,
        4,
      );
      if (o.food !== false) {
        g.save();
        g.translate(-40, -74);
        ME.registry.assets.wine_bottle.draw(g, {});
        g.restore();
        g.save();
        g.translate(30, -74);
        ME.registry.assets.food.draw(g, {});
        g.restore();
      }
    },
    { tags: [MT.BAN_2, MT.AN] },
  );
  A(MT.CHAIR, MT.GHE, MT.FURNITURE, [70, 130], (g, o) => {
    const col = o.color || MT.VALUE_5A3E28;
    R(g, -28, -50, 56, 8, 2, col);
    R(g, -28, -128, 8, 128, 0, col);
    R(g, 20, -50, 8, 50, 0, col);
    R(g, -28, -128, 8, 4, 0, C.shade(col, 0.2));
  });
  A(MT.DESK, MT.BAN_LAM_VIEC, MT.FURNITURE, [260, 110], (g, o) => {
    const col = o.color || MT.VALUE_5A3A24;
    R(g, -130, -96, 260, 14, 2, col);
    R(g, -126, -82, 90, 82, 0, C.shade(col, -0.15));
    R(g, 112, -82, 12, 82, 0, C.shade(col, -0.2));
    for (let i = 0; i < 3; i++) R(g, -110, -74 + i * 26, 58, 3, 0, C.shade(col, -0.35));
  });
  A(MT.SOFA, MT.GHE_SOFA, MT.FURNITURE, [300, 130], (g, o) => {
    const col = o.color || MT.VALUE_6A3A3A;
    R(g, -150, -120, 300, 70, 18, C.shade(col, -0.1));
    R(g, -150, -70, 300, 56, 12, col);
    R(g, -160, -100, 30, 90, 12, col);
    R(g, 130, -100, 30, 90, 12, col);
  });
  A(MT.BED, MT.GIUONG, MT.FURNITURE, [360, 120], (g, o) => {
    R(g, -180, -60, 360, 30, 4, MT.E9E4DA);
    R(g, -180, -34, 360, 34, 0, o.color || MT.VALUE_5A3A2A);
    R(g, -180, -120, 18, 120, 0, o.color || MT.VALUE_5A3A2A);
    R(g, -150, -80, 80, 24, 10, MT.F2EFE8);
  });
  A(MT.AIR_MATTRESS, MT.DEM_HOI, MT.FURNITURE, [260, 40], (g, o) => {
    R(g, -130, -30, 260, 30, 12, o.color || MT.VALUE_3D5F8A);
    for (let i = 1; i < 6; i++) R(g, -130 + i * 43, -28, 2, 26, 0, MT.RGBA_0_0_0_0_2);
  });
  A(MT.BOOKSHELF, MT.GIA_SACH, MT.FURNITURE, [220, 360], (g) => {
    R(g, -110, -360, 220, 360, 0, MT.VALUE_4A3020);
    const rnd = U.rng(4);
    const cols = [MT.VALUE_7A2A2A, MT.VALUE_2A4A6A, MT.VALUE_5A6A2A, MT.C9A24A, MT.VALUE_3A3A3A, MT.VALUE_8A5A3A];
    for (let s = 0; s < 4; s++) {
      R(g, -104, -350 + s * 88, 208, 80, 0, MT.VALUE_2A1A10);
      let x = -100;
      while (x < 96) {
        const w = 10 + rnd() * 10,
          h = 50 + rnd() * 26;
        R(g, x, -350 + s * 88 + 80 - h, w, h, 0, cols[Math.floor(rnd() * cols.length)]);
        x += w + 2;
      }
    }
  });
  A(
    MT.WINDOW,
    MT.CUA_SO,
    MT.INTERIOR,
    [200, 260],
    (g, o) => {
      R(g, -100, -260, 200, 260, 0, MT.VALUE_3A3028);
      const gr = g.createLinearGradient(0, -250, 0, -10);
      gr.addColorStop(0, o.night ? MT.VALUE_0D1830 : MT.A9CBE8);
      gr.addColorStop(1, o.night ? MT.VALUE_1A2A48 : MT.E6F0F7);
      g.fillStyle = gr;
      g.fillRect(-90, -250, 180, 240);
      R(g, -4, -250, 8, 240, 0, MT.VALUE_3A3028);
      R(g, -90, -134, 180, 8, 0, MT.VALUE_3A3028);
      if (o.open) {
        poly(
          g,
          [
            [-90, -250],
            [-150, -230],
            [-150, -30],
            [-90, -10],
          ],
          MT.RGBA_180_200_220_0_35,
        );
      }
    },
    { tags: [MT.CUA_SO_2], lights: (o) => (o.night ? [] : [{ type: MT.SHAFT, x: 0, y: -130, w: 180, h: 240, len: 600, angle: 0.5, color: MT.FFF2D6, alpha: 0.22 }]) },
  );
  A(MT.DOOR, MT.CUA_RA_VAO, MT.INTERIOR, [130, 260], (g, o) => {
    R(g, -65, -260, 130, 260, 0, MT.VALUE_2B2420);
    R(g, -58, -252, 116, 252, 0, o.color || MT.VALUE_6A4A30);
    R(g, -46, -236, 92, 90, 0, C.shade(o.color || MT.VALUE_6A4A30, -0.12));
    R(g, -46, -130, 92, 110, 0, C.shade(o.color || MT.VALUE_6A4A30, -0.12));
    disc(g, 40, -128, 6, MT.C9A24A);
  });
  A(
    MT.PRISON_BARS,
    MT.SONG_SAT_NHA_TU,
    MT.INTERIOR,
    [400, 300],
    (g, o) => {
      const W = o.w || 400;
      for (let x = -W / 2; x <= W / 2; x += 34) R(g, x - 4, -300, 8, 300, 4, MT.VALUE_3A3D42);
      R(g, -W / 2, -300, W, 12, 0, MT.VALUE_2A2D32);
      R(g, -W / 2, -160, W, 10, 0, MT.VALUE_2A2D32);
    },
    { tags: [MT.NHA_TU] },
  );
  A(MT.TYPEWRITER, MT.MAY_DANH_CHU, MT.PROP, [110, 60], (g) => {
    poly(
      g,
      [
        [-50, 0],
        [50, 0],
        [40, -36],
        [-40, -36],
      ],
      MT.VALUE_2B2F33,
    );
    R(g, -36, -60, 72, 26, 2, MT.EFE8D6);
    R(g, -56, -42, 112, 8, 4, MT.VALUE_1D2024);
  });
  A(MT.TELEPHONE, MT.DIEN_THOAI_BAN_CO, MT.PROP, [70, 50], (g) => {
    poly(
      g,
      [
        [-30, 0],
        [30, 0],
        [22, -26],
        [-22, -26],
      ],
      MT.VALUE_1B1B1D,
    );
    R(g, -34, -40, 68, 12, 6, MT.VALUE_1B1B1D);
    disc(g, 0, -14, 9, MT.C9C4B8);
  });
  A(
    MT.DESK_LAMP,
    MT.DEN_BAN,
    MT.PROP,
    [80, 120],
    (g) => {
      R(g, -24, -6, 48, 6, 2, MT.VALUE_2A2A2A);
      line(
        g,
        [
          [0, -6],
          [-14, -70],
          [24, -100],
        ],
        MT.VALUE_2A2A2A,
        5,
      );
      poly(
        g,
        [
          [14, -112],
          [44, -100],
          [36, -82],
          [8, -96],
        ],
        MT.VALUE_2F6B4A,
      );
    },
    { lights: () => [{ type: MT.LAMP, x: 30, y: -92, len: 140, color: MT.FFE2A6, alpha: 0.5 }] },
  );
  A(
    MT.CANDLE,
    MT.NEN,
    MT.PROP,
    [30, 80],
    (g, o) => {
      R(g, -8, -50, 16, 50, 3, MT.EFE6CF);
      const f = 1 + Math.sin((o.t || 0) * 13) * 0.1 + U.noise((o.t || 0) * 6) * 0.1;
      g.fillStyle = MT.FFCF6A;
      g.beginPath();
      g.ellipse(0, -62, 5 * f, 11 * f, 0, 0, PI * 2);
      g.fill();
    },
    { lights: (o) => [{ type: MT.GLOW, x: 0, y: -62, r: 140 * (1 + U.noise((o.t || 0) * 5) * 0.08), color: MT.FFB35A, alpha: 0.6 }] },
  );
  A(MT.WALL_CLOCK, MT.DONG_HO_TREO_TUONG, MT.PROP, [100, 100], (g, o) => {
    disc(g, 0, -50, 46, MT.VALUE_3A2A1A);
    disc(g, 0, -50, 40, MT.F2EDE0);
    const t = o.hour != null ? o.hour : (o.t || 0) / 60;
    line(
      g,
      [
        [0, -50],
        [Math.sin((t * PI) / 6) * 20, -50 - Math.cos((t * PI) / 6) * 20],
      ],
      MT.VALUE_222,
      4,
    );
    line(
      g,
      [
        [0, -50],
        [Math.sin(t * PI * 2) * 32, -50 - Math.cos(t * PI * 2) * 32],
      ],
      MT.VALUE_222,
      2.5,
    );
  });
  A(
    MT.TV_OLD,
    MT.TIVI_CU,
    MT.PROP,
    [150, 130],
    (g, o) => {
      R(g, -75, -130, 150, 120, 12, MT.VALUE_5A3A24);
      R(g, -60, -116, 100, 90, 14, o.on ? MT.VALUE_9FC0D8 : MT.VALUE_1C2228);
      disc(g, 58, -96, 6, MT.VALUE_2A2A2A);
      disc(g, 58, -70, 6, MT.VALUE_2A2A2A);
      line(
        g,
        [
          [-50, -10],
          [-60, 0],
        ],
        MT.VALUE_2A2A2A,
        4,
      );
      line(
        g,
        [
          [50, -10],
          [60, 0],
        ],
        MT.VALUE_2A2A2A,
        4,
      );
    },
    { lights: (o) => (o.on ? [{ type: MT.GLOW, x: -10, y: -70, r: 160, color: MT.VALUE_9FD0FF, alpha: 0.3 }] : []) },
  );
  A(MT.RADIO, MT.RADIO_2, MT.PROP, [120, 70], (g) => {
    R(g, -60, -70, 120, 70, 8, MT.VALUE_7A5A3A);
    disc(g, -26, -36, 22, MT.VALUE_3A2A1A);
    R(g, 14, -54, 34, 10, 2, MT.E9DFC6);
  });
  A(MT.COMPUTER, MT.MAY_TINH, MT.PROP, [160, 140], (g, o) => {
    R(g, -70, -140, 140, 96, 6, MT.VALUE_1E2126);
    R(g, -62, -132, 124, 80, 3, o.on === false ? MT.VALUE_0D0F12 : MT.VALUE_2E5F8A);
    R(g, -10, -44, 20, 30, 0, MT.VALUE_2A2D33);
    R(g, -40, -16, 80, 10, 3, MT.VALUE_2A2D33);
  });
  A(
    MT.CAMERA_TRIPOD,
    MT.MAY_ANH_TREN_CHAN,
    MT.PROP,
    [100, 200],
    (g) => {
      line(
        g,
        [
          [0, -120],
          [-40, 0],
        ],
        MT.VALUE_333,
        4,
      );
      line(
        g,
        [
          [0, -120],
          [40, 0],
        ],
        MT.VALUE_333,
        4,
      );
      line(
        g,
        [
          [0, -120],
          [6, 0],
        ],
        MT.VALUE_333,
        4,
      );
      R(g, -30, -160, 60, 40, 4, MT.VALUE_1B1D22);
      disc(g, 32, -140, 14, MT.VALUE_2F343B);
    },
    { tags: [MT.NHIEP_ANH] },
  );
  A(
    MT.PHOTO_BACKDROP,
    MT.PHONG_NEN_CHUP_ANH,
    MT.INTERIOR,
    [400, 360],
    (g, o) => {
      line(
        g,
        [
          [-200, -360],
          [-200, 0],
        ],
        MT.VALUE_555,
        5,
      );
      line(
        g,
        [
          [200, -360],
          [200, 0],
        ],
        MT.VALUE_555,
        5,
      );
      line(
        g,
        [
          [-210, -350],
          [210, -350],
        ],
        MT.VALUE_555,
        6,
      );
      const col = o.color || MT.VALUE_8A9A8C;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-196, -346);
      g.lineTo(196, -346);
      g.lineTo(196, -40);
      g.quadraticCurveTo(196, 0, 240, 0);
      g.lineTo(-150, 0);
      g.quadraticCurveTo(-196, 0, -196, -40);
      g.fill();
    },
    { tags: [MT.NHIEP_ANH, MT.STUDIO] },
  );
  A(
    MT.STUDIO_LIGHT,
    MT.DEN_STUDIO,
    MT.PROP,
    [120, 280],
    (g) => {
      line(
        g,
        [
          [0, -200],
          [-36, 0],
        ],
        MT.VALUE_333,
        4,
      );
      line(
        g,
        [
          [0, -200],
          [36, 0],
        ],
        MT.VALUE_333,
        4,
      );
      line(
        g,
        [
          [0, -200],
          [0, -240],
        ],
        MT.VALUE_333,
        4,
      );
      poly(
        g,
        [
          [-46, -290],
          [46, -290],
          [26, -236],
          [-26, -236],
        ],
        MT.E9E9E9,
      );
    },
    { lights: () => [{ type: MT.GLOW, x: 0, y: -270, r: 160, color: MT.FFFFFF, alpha: 0.4 }] },
  );
  A(MT.PLANT_POT, MT.CHAU_CAY, MT.PROP, [90, 150], (g, o) => {
    poly(
      g,
      [
        [-30, 0],
        [30, 0],
        [38, -50],
        [-38, -50],
      ],
      MT.A4583A,
    );
    for (let i = 0; i < 7; i++) {
      g.save();
      g.translate(0, -50);
      g.rotate(-0.9 + i * 0.3 + Math.sin((o.t || 0) * 1.3 + i) * 0.03);
      g.fillStyle = i % 2 ? MT.VALUE_3F7A3A : MT.VALUE_2F6430;
      g.beginPath();
      g.ellipse(0, -40, 10, 42, 0, 0, PI * 2);
      g.fill();
      g.restore();
    }
  });
  A(MT.PICTURE_FRAME, MT.KHUNG_TRANH, MT.INTERIOR, [160, 120], (g, o) => {
    R(g, -80, -120, 160, 120, 2, MT.VALUE_7A5A2A);
    R(g, -68, -108, 136, 96, 0, o.color || MT.VALUE_4A6A7A);
    poly(
      g,
      [
        [-68, -12],
        [-20, -70],
        [20, -30],
        [40, -50],
        [68, -12],
      ],
      MT.VALUE_2F4A3A,
    );
  });
  A(
    MT.WINE_BOTTLE,
    MT.CHAI_RUOU_VANG,
    MT.PROP,
    [24, 90],
    (g) => {
      R(g, -10, -60, 20, 60, 6, MT.VALUE_3A1420);
      R(g, -4, -86, 8, 30, 2, MT.VALUE_3A1420);
      R(g, -10, -42, 20, 18, 0, MT.E9DCC0);
    },
    { tags: [MT.RUOU] },
  );
  A(MT.WINE_GLASS, MT.LY_RUOU, MT.PROP, [24, 50], (g) => {
    line(
      g,
      [
        [0, 0],
        [0, -24],
      ],
      MT.RGBA_220_230_240_0_8,
      2,
    );
    line(
      g,
      [
        [-8, 0],
        [8, 0],
      ],
      MT.RGBA_220_230_240_0_8,
      2,
    );
    g.fillStyle = MT.VALUE_6A1A2A;
    g.beginPath();
    g.ellipse(0, -32, 9, 10, 0, 0, PI);
    g.fill();
  });
  A(
    MT.FOOD,
    MT.DO_AN_BANH_MI_PHO_MAI,
    MT.PROP,
    [90, 30],
    (g) => {
      g.fillStyle = MT.D39A52;
      g.beginPath();
      g.ellipse(-12, -8, 34, 8, -0.1, 0, PI * 2);
      g.fill();
      poly(
        g,
        [
          [16, 0],
          [44, 0],
          [44, -16],
        ],
        MT.F1D36A,
      );
      disc(g, -30, -10, 2, MT.A06A32);
    },
    { tags: [MT.AN] },
  );
  A(MT.ENVELOPE, MT.PHONG_BI, MT.PROP, [80, 50], (g, o) => {
    R(g, -40, -50, 80, 50, 2, o.color || MT.EFE7D4);
    poly(
      g,
      [
        [-40, -50],
        [40, -50],
        [0, -22],
      ],
      C.shade(o.color || MT.EFE7D4, -0.08),
    );
  });
  A(
    MT.CHEQUE,
    MT.TAM_SEC,
    MT.PROP,
    [160, 70],
    (g, o) => {
      R(g, -80, -70, 160, 70, 2, MT.E8EFE2);
      R(g, -70, -56, 80, 4, 0, MT.VALUE_9AA89A);
      R(g, -70, -40, 140, 2, 0, MT.VALUE_9AA89A);
      R(g, -70, -24, 60, 2, 0, MT.VALUE_9AA89A);
      if (o.text) {
        g.fillStyle = MT.VALUE_2A3A2A;
        g.font = ME.font(700, 14, MT.BODY);
        g.fillText(String(o.text).slice(0, 18), 10, -18);
      }
    },
    { params: { text: MT.SO_TIEN } },
  );
  A(
    MT.NEWSPAPER,
    MT.TO_BAO,
    MT.PROP,
    [140, 180],
    (g, o) => {
      R(g, -70, -180, 140, 180, 2, MT.ECE6D6);
      R(g, -60, -168, 120, 22, 0, MT.VALUE_2A2A2A);
      if (o.text) {
        g.fillStyle = MT.VALUE_1A1A1A;
        g.font = ME.font(700, 15, MT.HEAD);
        g.fillText(String(o.text).slice(0, 18), -60, -122);
      }
      for (let i = 0; i < 9; i++) R(g, -60 + (i % 2) * 64, -110 + Math.floor(i / 2) * 20, 56, 3, 0, MT.VALUE_9B968A);
    },
    { params: { text: MT.TIT_BAO } },
  );
  A(MT.MAP_BOARD, MT.BANG_BAN_DO, MT.INTERIOR, [320, 240], (g) => {
    R(g, -160, -240, 320, 220, 4, MT.ECE2C8);
    g.strokeStyle = MT.VALUE_7A9AB0;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-140, -80);
    g.bezierCurveTo(-60, -140, 40, -40, 140, -120);
    g.stroke();
    disc(g, -40, -120, 7, MT.C43A2C);
    disc(g, 70, -90, 7, MT.C43A2C);
    line(
      g,
      [
        [-40, -120],
        [70, -90],
      ],
      MT.C43A2C,
      2,
    );
    R(g, -6, -20, 12, 20, 0, MT.VALUE_4A3A2A);
  });
  A(
    MT.BLUEPRINT,
    MT.BAN_VE_DUONG_HAM,
    MT.PROP,
    [200, 140],
    (g) => {
      R(g, -100, -140, 200, 140, 2, MT.VALUE_2A4F8A);
      g.strokeStyle = MT.RGBA_220_235_255_0_7;
      g.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(-90, -130 + i * 22);
        g.lineTo(90, -130 + i * 22);
        g.stroke();
      }
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-80, -30);
      g.lineTo(-10, -30);
      g.lineTo(40, -100);
      g.stroke();
    },
    { tags: [MT.BAN_VE, MT.KE_HOACH] },
  );
  A(
    MT.PAINT_TEXT_WALL,
    MT.DONG_CHU_SON_TREN_TUONG,
    MT.INTERIOR,
    [600, 80],
    (g, o) => {
      const txt = String(o.text || MT.SANS_ARMES_NI_HAINE_NI_VIOLENCE);
      const p = o.progress == null ? 1 : U.clamp(o.progress);
      const cols = [MT.E8E2D0, MT.E05A4A, MT.VALUE_5AB0E0, MT.E0C05A, MT.VALUE_8AD06A];
      g.font = ME.font(700, 46, MT.SERIF, MT.ITALIC);
      const n = Math.floor(txt.length * p);
      let x = -g.measureText(txt).width / 2;
      for (let i = 0; i < n; i++) {
        g.fillStyle = cols[i % cols.length];
        g.fillText(txt[i], x, -20 + Math.sin(i * 1.7) * 2);
        x += g.measureText(txt[i]).width;
      }
    },
    { tags: [MT.CHU, MT.GRAFFITI], params: { text: MT.NOI_DUNG, progress: MT.TIEN_DO_VIET_0_1 } },
  );
  A(
    MT.SPARKS,
    MT.TIA_LUA_HAN,
    MT.FX,
    [120, 120],
    (g, o) => {
      const rnd = U.rng(Math.floor((o.t || 0) * 30) + 1);
      for (let i = 0; i < 16; i++) {
        const a = rnd() * PI * 2,
          d = 20 + rnd() * 60;
        line(
          g,
          [
            [0, -10],
            [Math.cos(a) * d, -10 + Math.sin(a) * d],
          ],
          rnd() > 0.5 ? MT.FFD27A : MT.FFF4D0,
          1.5,
        );
      }
    },
    { lights: () => [{ type: MT.GLOW, x: 0, y: -10, r: 120, color: MT.VALUE_9FD0FF, alpha: 0.6 }] },
  );
  A(
    MT.FIRE,
    MT.LUA,
    MT.FX,
    [120, 160],
    (g, o) => {
      const t = o.t || 0;
      for (let i = 0; i < 6; i++) {
        const h = 80 + U.noise(t * 4 + i, i) * 30,
          w = 30 - i * 3;
        g.fillStyle = [MT.FF6A1A, MT.FF9A2A, MT.FFD25A][i % 3];
        g.beginPath();
        g.moveTo(-w + i * 4, 0);
        g.quadraticCurveTo(-w * 0.5 + U.noise(t * 3 + i) * 10, -h * 0.6, U.noise(t * 5 + i * 3) * 8, -h);
        g.quadraticCurveTo(w * 0.5, -h * 0.5, w - i * 4, 0);
        g.fill();
      }
    },
    { lights: (o) => [{ type: MT.GLOW, x: 0, y: -50, r: 220 * (1 + U.noise((o.t || 0) * 6) * 0.1), color: MT.FF8A3A, alpha: 0.55 }] },
  );
  A(MT.SMOKE, MT.KHOI, MT.FX, [200, 300], (g, o) => {
    const t = o.t || 0;
    for (let i = 0; i < 8; i++) {
      const k = (t * 0.3 + i / 8) % 1;
      g.fillStyle = MF.RGBA_180_180_180(`${0.25 * (1 - k)}`);
      g.beginPath();
      g.arc(U.noise(i + t * 0.5) * 40 * k, -k * 300, 30 + k * 60, 0, PI * 2);
      g.fill();
    }
  });
  A(MT.MAP_PIN, MT.GHIM_BAN_DO, MT.FX, [40, 60], (g, o) => {
    const s = U.back(U.clamp(o.progress == null ? 1 : o.progress));
    g.scale(s, s);
    g.fillStyle = o.color || MT.E2483A;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(-20, -24, -18, -52, 0, -52);
    g.bezierCurveTo(18, -52, 20, -24, 0, 0);
    g.fill();
    disc(g, 0, -36, 7, MT.FFF);
  });
  ME.REAL_SIZE = {
    alarm_clock: 18,
    time_lock: 35,
    gold_bars: 32,
    cash_stack: 45,
    diamond_pouch: 14,
    letters_bundle: 24,
    toolbox: 50,
    pickaxe: 95,
    duffel_bag: 70,
    briefcase: 46,
    suitcase: 70,
    money_bag: 60,
    typewriter: 45,
    telephone: 22,
    desk_lamp: 45,
    candle: 18,
    wall_clock: 35,
    radio: 35,
    wine_bottle: 30,
    wine_glass: 18,
    food: 30,
    envelope: 22,
    cheque: 18,
    laptop: 34,
    smartphone: 15,
    cctv_camera: 30,
    flashlight: 26,
    handcuffs: 22,
    keys: 8,
    passport: 13,
    magnifier: 22,
    case_file: 32,
    coffee_cup: 10,
    umbrella: 95,
    trophy: 35,
    globe: 40,
    hourglass: 25,
    backpack: 45,
    power_drill: 30,
    rope_coil: 40,
    conical_hat: 45,
    banh_chung: 20,
    football: 22,
    gift_box: 35,
    crystal_ball: 25,
    scroll: 45,
    red_envelope: 17,
    medkit: 35,
    rubber_tire: 65,
    crate: 60,
    barrel: 90,
    tv_old: 55,
    computer: 50,
    plant_pot: 70,
  };
  ME.HOLDABLE = {
    alarm_clock: null,
    flashlight: MT.FLASHLIGHT,
    pickaxe: MT.PICKAXE,
    power_drill: MT.DRILL,
    smartphone: MT.PHONE,
    wine_bottle: MT.BOTTLE,
    briefcase: MT.BRIEFCASE,
    keys: null,
    passport: null,
    envelope: null,
    cheque: null,
    letters_bundle: null,
    magnifier: null,
    case_file: null,
    coffee_cup: null,
    wine_glass: null,
    handcuffs: null,
    diamond_pouch: null,
    red_envelope: null,
    trophy: null,
    hourglass: null,
    umbrella: null,
    scroll: null,
    laptop: null,
    telephone: null,
    candle: null,
    crystal_ball: null,
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
