(function (root) {
  "use strict";
  const MT = root.MotionEngineText, MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util, C = ME.color;
  const PI = Math.PI;
  const dust = (g, W, H, t, unit, alpha = 0.35) => {
    g.fillStyle = MF.RGBA_255_236_200(`${alpha}`);
    for (let i = 0; i < 70; i++) {
      const x = U.mod(U.hash(i) * W + Math.sin(t * 0.3 + i) * 40 * unit + t * 6 * unit, W);
      const y = U.mod(U.hash(i + 11) * H - t * 8 * unit * (0.5 + U.hash(i + 4)), H);
      g.globalAlpha = 0.3 + 0.7 * U.hash(i + 3);
      g.beginPath();
      g.arc(x, y, (0.8 + U.hash(i + 2) * 1.6) * unit, 0, PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const bgScene = (ctx, bg) => (bg && ME.GEN && ME.GEN.bgInit ? ME.GEN.bgInit(ctx, bg) : null);
  const drawBg = (g, ctx, st, darken = 0.55) => {
    if (st && ME.GEN) {
      try {
        ME.GEN.bgDraw(g, ctx, st);
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = MF.RGBA_4_6_10(`${darken}`);
        g.fillRect(0, 0, ctx.W, ctx.H);
        return;
      } catch (e) {
        void e;
      }
    }
    const gr = g.createRadialGradient(ctx.W / 2, ctx.H * 0.45, 0, ctx.W / 2, ctx.H / 2, Math.max(ctx.W, ctx.H) * 0.75);
    gr.addColorStop(0, ctx.params.bgInner || MT.VALUE_1C2433);
    gr.addColorStop(1, ctx.params.bgOuter || MT.VALUE_040609);
    g.fillStyle = gr;
    g.fillRect(0, 0, ctx.W, ctx.H);
    dust(g, ctx.W, ctx.H, ctx.t, ctx.unit, 0.25);
  };
  const bgDispose = (st) => { if (st && ME.GEN && ME.GEN.disposeShot) ME.GEN.disposeShot(st); };
  const accentOf = (ctx) => ctx.params.accent || (ctx.spec && ctx.spec.accent) || MT.FFB070;
  ME.registerTemplate(MT.TITLE, {
    name: MT.TIEU_DE_MO_DAU,
    category: MT.TEXT,
    description: MT.TIEU_DE_LON_CO_HIEU_UNG_CHU_KICKER,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.5);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const portrait = H > W;
      const acc = accentOf(ctx);
      const size = (p.size || (portrait ? 118 : 132)) * un;
      const lines = ME.wrap(g, p.title || "", W * (portrait ? 0.86 : 0.8), ME.font(700, size, MT.HEAD));
      const cy = H * (portrait ? 0.44 : 0.5) - ((lines.length - 1) * size * 1.02) / 2;
      if (p.kicker) { ME.text(g, String(p.kicker).toUpperCase(), W / 2, cy - size * 0.95, { size: size * 0.2, weight: 700, align: MT.CENTER, tracking: 0.42, color: acc, progress: U.clamp(t / 1.2), shadow: false }); }
      const lw = W * 0.18 * U.easeOut(U.clamp((t - 0.2) / 1.2));
      g.fillStyle = C.rgba(acc, 0.9);
      g.fillRect(W / 2 - lw / 2, cy - size * 0.8, lw, 2 * un);
      lines.forEach((ln, i) => {
        const k = U.clamp((t - 0.35 - i * 0.25) / 1.1);
        g.save();
        const sc = 1.06 - 0.06 * U.easeOut(k);
        g.translate(W / 2, cy + i * size * 1.02);
        g.scale(sc, sc);
        ME.text(g, ln.toUpperCase(), 0, size * 0.35, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, tracking: 0.03, progress: k, reveal: MT.RISE, shadowBlur: 0.25 });
        g.restore();
      });
      if (p.subtitle) { const sy = cy + (lines.length - 1) * size * 1.02 + size * 0.95; ME.text(g, p.subtitle, W / 2, sy, { size: size * 0.24, weight: 500, align: MT.CENTER, tracking: 0.08, color: MT.E6DFD2, progress: U.clamp((t - 1.1) / 1.2) }); }
    },
  });
  ME.registerTemplate(MT.CHAPTER, {
    name: MT.THE_CHUONG,
    category: MT.TEXT,
    description: MT.SO_CHUONG_TEN_CHUONG,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.62);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const portrait = H > W;
      const x = portrait ? W * 0.1 : W * 0.12, y = H * (portrait ? 0.46 : 0.52);
      const n = String(p.number == null ? "" : p.number).padStart(2, MT.VALUE_0);
      g.save();
      g.globalAlpha = 0.9 * U.clamp(t / 0.8);
      g.font = ME.font(700, 300 * un, MT.HEAD);
      g.lineWidth = 2 * un;
      g.strokeStyle = C.rgba(acc, 0.85);
      g.strokeText(n, x - 10 * un, y - 20 * un);
      g.restore();
      const bw = 6 * un;
      g.fillStyle = acc;
      g.fillRect(x, y + 20 * un, bw, 120 * un * U.easeOut(U.clamp((t - 0.3) / 0.6)));
      ME.text(g, String(p.label || MT.CHUONG).toUpperCase() + MT.SYMBOL_3 + n, x + 30 * un, y + 52 * un, { size: 26 * un, weight: 700, tracking: 0.35, color: acc, progress: U.clamp((t - 0.3) / 1), shadow: false });
      const lines = ME.wrap(g, p.title || "", W * 0.75, ME.font(700, 72 * un, MT.HEAD));
      lines.forEach((ln, i) => ME.text(g, ln.toUpperCase(), x + 30 * un, y + (125 + i * 76) * un, { size: 72 * un, family: MT.HEAD, weight: 700, tracking: 0.02, progress: U.clamp((t - 0.5 - i * 0.2) / 1.1), reveal: MT.RISE }));
    },
  });
  ME.registerTemplate(MT.QUOTE, {
    name: MT.TRICH_DAN_CAU_NOI,
    category: MT.TEXT,
    description: MT.CAU_TRICH_DAN_LON_KIEU_SERIF_TU_KHOA,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.62);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const portrait = H > W;
      const size = (p.size || (portrait ? 64 : 66)) * un;
      const font = ME.font(700, size, MT.SERIF, MT.ITALIC);
      const lines = ME.wrap(g, MT.SYMBOL_11 + (p.text || "") + MT.SYMBOL_12, W * (portrait ? 0.82 : 0.7), font);
      const hl = (p.highlight || []).map((w) => String(w).toLowerCase());
      const lh = size * 1.32;
      const y0 = H / 2 - ((lines.length - 1) * lh) / 2;
      let wi = 0;
      const totalWords = lines.join(MT.SYMBOL_3).split(/\s+/).length;
      const per = Math.max(0.6, ctx.dur * 0.6) / totalWords;
      g.save();
      g.font = font;
      g.textBaseline = MT.MIDDLE;
      lines.forEach((ln, li) => {
        const words = ln.split(/\s+/);
        const widths = words.map((w) => g.measureText(w + MT.SYMBOL_3).width);
        let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
        words.forEach((w, i) => {
          const k = U.clamp((t - 0.3 - wi * per) / 0.5);
          wi++;
          const clean = w.toLowerCase().replace(/[“”".,!?;:]/g, "");
          g.globalAlpha = U.easeOut(k);
          g.fillStyle = hl.includes(clean) ? acc : MT.F3EEE4;
          g.shadowColor = MT.RGBA_0_0_0_0_6;
          g.shadowBlur = size * 0.3;
          g.fillText(w, x, y0 + li * lh + (1 - U.easeOut(k)) * size * 0.3);
          x += widths[i];
        });
      });
      g.restore();
      if (p.author) ME.text(g, MT.SYMBOL_13 + p.author, W / 2, y0 + lines.length * lh + size * 0.2, { size: size * 0.36, weight: 600, align: MT.CENTER, tracking: 0.18, color: acc, progress: U.clamp((t - 0.3 - totalWords * per) / 1) });
    },
  });
  ME.registerTemplate(MT.STATS, {
    name: MT.SO_LIEU_DEM_LEN,
    category: MT.INFOGRAPHIC,
    description: MT.VALUE_1_4_CON_SO_LON_CHAY_DEM_8,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.66);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const items = (p.items || []).slice(0, 4);
      const portrait = H > W;
      const n = items.length || 1;
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * (portrait ? 0.16 : 0.2), { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      items.forEach((it, i) => {
        const delay = 0.3 + i * (p.stagger == null ? 0.55 : p.stagger);
        const k = U.clamp((t - delay) / (p.countDuration || 1.6));
        const grid = portrait && n > 2;
        const cx = grid ? W * (i % 2 ? 0.72 : 0.28) : portrait ? W / 2 : W * ((i + 0.5) / n), cy = grid ? H * (0.36 + Math.floor(i / 2) * 0.2) : portrait ? H * (0.34 + (i + 0.5) * (0.36 / n)) : H * 0.52;
        const val = (it.value || 0) * U.expoOut(k);
        const dec = it.decimals || 0;
        const txt = (it.prefix || "") + (dec ? val.toFixed(dec).replace(MT.SYMBOL_8, MT.SYMBOL_14) : Math.round(val).toLocaleString(MT.VI_VN)) + (it.suffix || "");
        const full = (it.prefix || "") + (dec ? (it.value || 0).toFixed(dec).replace(MT.SYMBOL_8, MT.SYMBOL_14) : Math.round(it.value || 0).toLocaleString(MT.VI_VN)) + (it.suffix || "");
        const base = (grid ? 92 : portrait ? 120 : n > 3 ? 110 : 140) * un;
        const colW = (grid ? W * 0.42 : portrait ? W * 0.84 : W / n) * 0.88;
        const fw = ME.measure(g, full, { size: base, family: MT.HEAD, weight: 700, tracking: 0.01 });
        const size = fw > colW ? (base * colW) / fw : base;
        const a = U.clamp((t - delay) / 0.4);
        g.save();
        g.globalAlpha = a;
        ME.text(g, txt, cx, cy, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, tracking: 0.01 });
        g.fillStyle = C.rgba(acc, 0.9);
        const lw = size * 0.9 * U.easeOut(k);
        g.fillRect(cx - lw / 2, cy + size * 0.2, lw, 3 * un);
        ME.text(g, String(it.label || "").toUpperCase(), cx, cy + size * 0.55, { size: 24 * un, weight: 600, align: MT.CENTER, tracking: 0.22, color: MT.D9D2C6, progress: U.clamp((t - delay - 0.4) / 1) });
        g.restore();
      });
    },
  });
  ME.registerTemplate(MT.COUNTER, {
    name: MT.BO_DEM_NGAY_GIO_DONG_HO,
    category: MT.INFOGRAPHIC,
    description: MT.SO_DEM_LON_KIEU_DONG_HO_DEM_NGAY,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.6);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const k = U.clamp((t - 0.3) / Math.max(0.5, ctx.dur - 1.2));
      const from = p.from || 0, to = p.to == null ? 100 : p.to;
      const v = U.lerp(from, to, p.ease === MT.LINEAR ? k : U.smooth(k));
      let txt;
      if (p.format === MT.CLOCK) { const m = Math.floor(v) % (24 * 60); txt = String(Math.floor(m / 60)).padStart(2, MT.VALUE_0) + MT.SYMBOL_15 + String(m % 60).padStart(2, MT.VALUE_0); } else txt = String(Math.round(v)).padStart(p.pad || 1, MT.VALUE_0);
      const size = (H > W ? 220 : 240) * un;
      g.save();
      g.font = ME.font(700, size, MT.HEAD);
      g.textAlign = MT.CENTER;
      g.textBaseline = MT.MIDDLE;
      g.fillStyle = MT.RGBA_255_255_255_0_06;
      g.fillText(p.format === MT.CLOCK ? MT.VALUE_88_88 : MT.VALUE_8.repeat(txt.length), W / 2, H * 0.47);
      g.restore();
      ME.text(g, txt, W / 2, H * 0.47 + size * 0.35, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, color: p.color || MT.F6EFE2 });
      if (p.label) ME.text(g, String(p.label).toUpperCase(), W / 2, H * 0.47 + size * 0.8, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.35, color: acc, progress: U.clamp(t / 1) });
      if (p.tick) { const pulse = 1 - (t % 1); g.fillStyle = C.rgba(acc, 0.5 * pulse); g.beginPath(); g.arc(W / 2, H * 0.47 - size * 0.62, 8 * un, 0, PI * 2); g.fill(); }
    },
  });
  const landShape = (seed) => { const pts = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2; const r = 0.36 + U.fbm(i * 0.21, seed) * 0.12 + 0.05 * Math.sin(a * 3 + seed); pts.push([0.5 + Math.cos(a) * r * 1.25, 0.5 + Math.sin(a) * r]); } return pts; };
  ME.registerTemplate(MT.MAP, {
    name: MT.BAN_DO_SO_DO_MINH_HOA,
    category: MT.INFOGRAPHIC,
    description: MT.BAN_DO_SO_DO_KHONG_PHAI_BAN_DO,
    init: (ctx) => ({ land: landShape(ctx.params.seed || 3) }),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit, u = ctx.u;
      const acc = accentOf(ctx);
      g.fillStyle = p.sea || MT.VALUE_0D1B2A;
      g.fillRect(0, 0, W, H);
      const fz = p.focus ? U.smooth(U.inv(p.focus.at || 0.3, (p.focus.at || 0.3) + 0.4, u)) : 0;
      const zoom = U.lerp(1, p.focus ? p.focus.zoom || 2 : 1, fz);
      const fx = p.focus ? U.lerp(0.5, p.focus.x, fz) : 0.5, fy = p.focus ? U.lerp(0.5, p.focus.y, fz) : 0.5;
      const S = Math.min(W, H) * 1.05 * zoom;
      const ox = W / 2 - fx * S * (W > H ? 1.3 : 1), oy = H / 2 - fy * S;
      const X = (x) => ox + x * S * (W > H ? 1.3 : 1), Y = (y) => oy + y * S;
      g.strokeStyle = MT.RGBA_120_160_200_0_08;
      g.lineWidth = 1 * un;
      for (let i = 0; i <= 20; i++) {
        g.beginPath();
        g.moveTo(X(i / 20), 0);
        g.lineTo(X(i / 20), H);
        g.moveTo(0, Y(i / 20));
        g.lineTo(W, Y(i / 20));
        g.stroke();
      }
      const land = p.land || ctx.state.land;
      g.save();
      g.shadowColor = MT.RGBA_0_0_0_0_5;
      g.shadowBlur = 30 * un;
      g.fillStyle = p.landColor || MT.VALUE_2C3A2E;
      g.beginPath();
      land.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
      g.closePath();
      g.fill();
      g.restore();
      g.strokeStyle = MT.RGBA_220_230_200_0_35;
      g.lineWidth = 2 * un;
      g.stroke();
      for (const r of p.regions || []) {
        g.fillStyle = C.rgba(r.color || acc, 0.18 * U.clamp((u - (r.at || 0)) / 0.1));
        g.beginPath();
        r.points.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
        g.closePath();
        g.fill();
      }
      const pts = {};
      (p.points || []).forEach((pt, i) => (pts[pt.id || i] = pt));
      for (const r of p.routes || []) {
        const a = pts[r.from], b = pts[r.to];
        if (!a || !b) continue;
        const k = U.clamp(U.inv(r.at || 0.2, (r.at || 0.2) + (r.dur || 0.3), u));
        if (k <= 0) continue;
        const mx = (a.x + b.x) / 2 + (r.bend || 0.06), my = (a.y + b.y) / 2 - (r.bend || 0.06);
        g.save();
        g.strokeStyle = r.color || acc;
        g.lineWidth = 3 * un;
        g.setLineDash([12 * un, 9 * un]);
        g.lineDashOffset = -t * 30 * un;
        g.beginPath();
        const N = 40;
        for (let i = 0; i <= N * k; i++) {
          const s = i / N;
          const x = (1 - s) * (1 - s) * a.x + 2 * (1 - s) * s * mx + s * s * b.x, y = (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * my + s * s * b.y;
          i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y));
        }
        g.stroke();
        g.restore();
      }
      (p.points || []).forEach((pt) => {
        const k = U.clamp(U.inv(pt.at || 0, (pt.at || 0) + 0.12, u));
        if (k <= 0) return;
        g.save();
        g.translate(X(pt.x), Y(pt.y));
        g.scale(un * 1.3, un * 1.3);
        {
          const col = pt.color || MT.E2483A;
          const e = U.back(k);
          g.globalAlpha = U.clamp(k * 2);
          g.fillStyle = MT.RGBA_0_0_0_0_35;
          g.beginPath();
          g.ellipse(0, 0, 9 * e, 3.5 * e, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(0, 0);
          g.bezierCurveTo(-14 * e, -18 * e, -16 * e, -40 * e, 0, -42 * e);
          g.bezierCurveTo(16 * e, -40 * e, 14 * e, -18 * e, 0, 0);
          g.fill();
          g.fillStyle = MT.FFFFFF;
          g.beginPath();
          g.arc(0, -29 * e, 5.5 * e, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
        }
        g.restore();
        if (pt.label) { const lx = X(pt.x) + 26 * un, ly = Y(pt.y) - 40 * un; ME.text(g, pt.label, lx, ly, { size: 30 * un, weight: 700, family: MT.HEAD, tracking: 0.06, progress: k, color: MT.F4EFE6 }); if (pt.sub) ME.text(g, pt.sub, lx, ly + 30 * un, { size: 20 * un, weight: 500, tracking: 0.08, progress: k, color: MT.C9C2B6 }); }
      });
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W * 0.06, H * 0.12, { size: 34 * un, family: MT.HEAD, weight: 700, tracking: 0.1, progress: U.clamp(t / 1) });
      ME.text(g, p.note || MT.SO_DO_MINH_HOA, W * 0.94, H * 0.94, { size: 18 * un, weight: 500, align: MT.RIGHT, tracking: 0.2, color: MT.RGBA_230_230_230_0_6, shadow: false });
      g.save();
      g.translate(W * 0.92, H * 0.14);
      g.strokeStyle = MT.RGBA_240_235_225_0_6;
      g.lineWidth = 2 * un;
      g.beginPath();
      g.arc(0, 0, 28 * un, 0, PI * 2);
      g.stroke();
      ME.text(g, MT.N, 0, -36 * un, { size: 18 * un, weight: 700, align: MT.CENTER, shadow: false, color: MT.RGBA_240_235_225_0_8 });
      g.restore();
    },
  });
  ME.registerTemplate(MT.TIMELINE, {
    name: MT.DONG_THOI_GIAN,
    category: MT.INFOGRAPHIC,
    description: MT.CAC_MOC_THOI_GIAN_CHAY_LAN_LUOT_NAM,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit, u = ctx.u;
      drawBg(g, ctx, null);
      const acc = accentOf(ctx);
      const ev = p.events || [];
      const n = ev.length || 1;
      const portrait = H > W;
      const prog = U.clamp(u * 1.15);
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * 0.14, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      g.strokeStyle = MT.RGBA_255_255_255_0_18;
      g.lineWidth = 3 * un;
      g.beginPath();
      if (portrait) { g.moveTo(W * 0.2, H * 0.22); g.lineTo(W * 0.2, H * 0.9); } else { g.moveTo(W * 0.08, H * 0.52); g.lineTo(W * 0.92, H * 0.52); }
      g.stroke();
      g.strokeStyle = acc;
      g.beginPath();
      if (portrait) { g.moveTo(W * 0.2, H * 0.22); g.lineTo(W * 0.2, H * (0.22 + 0.68 * prog)); } else { g.moveTo(W * 0.08, H * 0.52); g.lineTo(W * (0.08 + 0.84 * prog), H * 0.52); }
      g.stroke();
      ev.forEach((e, i) => {
        const pos = (i + 0.5) / n;
        const k = U.clamp((prog - pos * 0.98) / 0.08);
        const x = portrait ? W * 0.2 : W * (0.08 + 0.84 * pos), y = portrait ? H * (0.22 + 0.68 * pos) : H * 0.52;
        g.fillStyle = k > 0 ? acc : MT.RGBA_255_255_255_0_3;
        g.beginPath();
        g.arc(x, y, (8 + 4 * U.back(k)) * un, 0, PI * 2);
        g.fill();
        if (k <= 0) return;
        const up = !portrait && i % 2 === 0;
        const tx = portrait ? x + 40 * un : x, ty = portrait ? y + 12 * un : up ? y - 60 * un : y + 90 * un;
        ME.text(g, e.label || "", tx, ty, { size: 46 * un, family: MT.HEAD, weight: 700, align: portrait ? MT.LEFT : MT.CENTER, progress: k, reveal: MT.RISE });
        const lines = ME.wrap(g, e.text || "", portrait ? W * 0.68 : (W * 0.84) / n - 20 * un, ME.font(500, 22 * un));
        lines.slice(0, 3).forEach((ln, j) => ME.text(g, ln, tx, ty + (34 + j * 28) * un, { size: 22 * un, weight: 500, align: portrait ? MT.LEFT : MT.CENTER, color: MT.D8D1C4, progress: k }));
      });
    },
  });
  ME.registerTemplate(MT.STARMAP, {
    name: MT.BAN_DO_SAO,
    category: MT.INFOGRAPHIC,
    description: MT.BAN_DO_SAO,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit, u = ctx.u;
      const acc = accentOf(ctx);
      const sky = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      sky.addColorStop(0, MT.VALUE_0D1530);
      sky.addColorStop(1, MT.VALUE_02030A);
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      const drift = 1 + 0.04 * u;
      for (let i = 0; i < 260; i++) {
        const x = W / 2 + (U.hash(i + 7) - 0.5) * W * drift, y = H / 2 + (U.hash(i + 91) - 0.5) * H * drift;
        g.globalAlpha = 0.25 + 0.6 * U.hash(i + 13) * (0.75 + 0.25 * Math.sin(t * (1 + U.hash(i)) + i));
        g.fillStyle = MT.FFFFFF;
        g.beginPath();
        g.arc(x, y, (0.5 + 1.3 * U.hash(i + 29)) * un, 0, PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      const portrait = H > W;
      const X = (x) => W * (0.08 + 0.84 * U.clamp(x)), Y = (y) => H * ((portrait ? 0.2 : 0.22) + (portrait ? 0.66 : 0.66) * U.clamp(y));
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * 0.12, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      const stars = p.stars || [];
      const byId = {};
      stars.forEach((s, i) => (byId[s.id] = s));
      (p.links || []).forEach((l, i) => {
        const a = byId[l.from], b = byId[l.to];
        if (!a || !b) return;
        const k = U.clamp(U.inv(l.at, l.at + 0.25, u));
        if (k <= 0) return;
        const ax = X(a.x), ay = Y(a.y), bx = X(b.x), by = Y(b.y);
        g.save();
        g.strokeStyle = C.rgba(acc, 0.85);
        g.lineWidth = 2.5 * un;
        g.setLineDash([10 * un, 8 * un]);
        g.lineDashOffset = -t * 24 * un;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(U.lerp(ax, bx, k), U.lerp(ay, by, k));
        g.stroke();
        g.restore();
        if (l.label && k > 0.6) ME.text(g, l.label, (ax + bx) / 2, (ay + by) / 2 - 16 * un, { size: 22 * un, weight: 700, align: MT.CENTER, color: MT.FFE9C4, progress: U.clamp((k - 0.6) / 0.4) });
      });
      stars.forEach((s) => {
        const k = U.clamp(U.inv(s.at, s.at + 0.12, u));
        if (k <= 0) return;
        const x = X(s.x), y = Y(s.y);
        const r = (s.center ? 13 : 8) * un * U.back(k);
        const halo = g.createRadialGradient(x, y, 0, x, y, r * 4.5);
        halo.addColorStop(0, C.rgba(s.center ? acc : MT.BFE3FF, 0.55 * k));
        halo.addColorStop(1, C.rgba(s.center ? acc : MT.BFE3FF, 0));
        g.fillStyle = halo;
        g.beginPath();
        g.arc(x, y, r * 4.5 * (1 + 0.08 * Math.sin(t * 3)), 0, PI * 2);
        g.fill();
        g.fillStyle = MT.FFFFFF;
        g.beginPath();
        g.arc(x, y, r, 0, PI * 2);
        g.fill();
        if (s.label) ME.text(g, s.label, x, y + r + 34 * un, { size: 26 * un, family: MT.HEAD, weight: 700, align: MT.CENTER, progress: k, reveal: MT.RISE });
        if (s.sub) ME.text(g, s.sub, x, y + r + 62 * un, { size: 19 * un, weight: 500, align: MT.CENTER, color: MT.D8D1C4, progress: k });
      });
    },
  });
  ME.registerTemplate(MT.BITMAP, {
    name: MT.LUOI_DIEM_ANH,
    category: MT.INFOGRAPHIC,
    description: MT.LUOI_DIEM_ANH,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit, u = ctx.u;
      drawBg(g, ctx, null);
      const acc = accentOf(ctx);
      const rows = p.rows || [];
      const nr = rows.length || 1, nc = Math.max(1, ...rows.map((r) => r.length));
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * 0.12, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      const boxW = W * 0.8, boxH = H * (p.caption ? 0.62 : 0.7);
      const cell = Math.min(boxW / nc, boxH / nr);
      const ox = (W - cell * nc) / 2, oy = H * 0.18 + (boxH - cell * nr) / 2;
      const prog = U.clamp(u * 1.25) * nr;
      g.fillStyle = MT.RGBA_255_255_255_0_05;
      g.fillRect(ox - 6 * un, oy - 6 * un, cell * nc + 12 * un, cell * nr + 12 * un);
      rows.forEach((row, r) => {
        const k = U.clamp(prog - r);
        if (k <= 0) return;
        for (let c = 0; c < row.length; c++) {
          const on = row[c] !== MT.VALUE_0 && row[c] !== " " && row[c] !== MT.SYMBOL_8;
          if (!on) continue;
          g.fillStyle = r === Math.floor(prog) ? MT.FFFFFF : C.rgba(acc, 0.35 + 0.65 * k);
          g.fillRect(ox + c * cell + cell * 0.08, oy + r * cell + cell * 0.08, cell * 0.84, cell * 0.84);
        }
      });
      if (p.caption) ME.text(g, p.caption, W / 2, H * 0.9, { size: 24 * un, weight: 500, align: MT.CENTER, color: MT.D8D1C4, progress: U.clamp((u - 0.5) / 0.2) });
    },
  });
  ME.registerTemplate(MT.HEADLINE, {
    name: MT.TIT_BAO_MINH_HOA,
    category: MT.INFOGRAPHIC,
    description: MT.TRANG_BAO_MINH_HOA_CHUNG_CHUNG_KHONG_GIA,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      g.fillStyle = MT.VALUE_0A0A0A;
      g.fillRect(0, 0, W, H);
      const k = U.easeOut(U.clamp(t / 1.2));
      const pw = Math.min(W, H / 1.3) * 0.82, ph = pw * 1.3;
      const push = U.smooth(U.clamp((ctx.u - 0.25) / 0.75));
      g.save();
      g.translate(W / 2, H / 2 + ph * 0.17 * push);
      g.rotate((1 - k) * 0.5 - 0.04 * (1 - push * 0.5));
      const sc = (0.35 + 0.65 * k) * (1 + 0.2 * push);
      g.scale(sc, sc);
      g.shadowColor = MT.RGBA_0_0_0_0_6;
      g.shadowBlur = 40 * un;
      g.fillStyle = MT.ECE5D3;
      g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.shadowBlur = 0;
      const pad = pw * 0.06;
      ME.text(g, (p.paper || MT.LE_QUOTIDIEN).toUpperCase(), 0, -ph / 2 + pad * 1.9, { size: pw * 0.085, family: MT.SERIF, weight: 700, align: MT.CENTER, color: MT.VALUE_151515, shadow: false });
      g.fillStyle = MT.VALUE_151515;
      g.fillRect(-pw / 2 + pad, -ph / 2 + pad * 2.3, pw - pad * 2, 2 * un);
      if (p.date) ME.text(g, p.date, 0, -ph / 2 + pad * 2.9, { size: pw * 0.022, weight: 600, align: MT.CENTER, color: MT.VALUE_333, shadow: false, tracking: 0.2 });
      const lines = ME.wrap(g, (p.headline || "").toUpperCase(), pw - pad * 2, ME.font(700, pw * 0.1, MT.HEAD));
      lines.slice(0, 3).forEach((ln, i) => ME.text(g, ln, 0, -ph / 2 + pad * 4.6 + i * pw * 0.105, { size: pw * 0.1, family: MT.HEAD, weight: 700, align: MT.CENTER, color: MT.VALUE_111, shadow: false }));
      const yb = -ph / 2 + pad * 4.6 + lines.length * pw * 0.105;
      if (p.sub) ME.text(g, p.sub, 0, yb + pw * 0.01, { size: pw * 0.035, family: MT.SERIF, weight: 700, style: MT.ITALIC, align: MT.CENTER, color: MT.VALUE_2A2A2A, shadow: false });
      g.fillStyle = MT.VALUE_6A6A6A;
      g.fillRect(-pw / 2 + pad, yb + pw * 0.05, pw * 0.42, ph * 0.3);
      for (let i = 0; i < 18; i++) g.fillRect(pw * 0.02, yb + pw * 0.05 + i * ph * 0.017, pw * 0.42 - pad, 2 * un);
      g.restore();
    },
  });
  ME.registerTemplate(MT.ENDING, {
    name: MT.KET_THUC,
    category: MT.TEXT,
    description: MT.CAU_KET_CHAM_VA_TOI_DAN,
    init: (ctx) => {
      const bg = bgScene(ctx, ctx.params.bg3d);
      return { bg, dispose: () => bgDispose(bg) };
    },
    draw(g, ctx) {
      const p = ctx.params, W = ctx.W, H = ctx.H, t = ctx.t, un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, 0.55);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const size = (H > W ? 54 : 58) * un;
      const lines = ME.wrap(g, p.text || "", W * 0.74, ME.font(700, size, MT.SERIF, MT.ITALIC));
      lines.forEach((ln, i) => ME.text(g, ln, W / 2, H / 2 + (i - (lines.length - 1) / 2) * size * 1.3, { size, family: MT.SERIF, weight: 700, style: MT.ITALIC, align: MT.CENTER, progress: U.clamp((t - 0.4 - i * 0.6) / 1.6), reveal: MT.FADE }));
      if (p.sub) ME.text(g, String(p.sub).toUpperCase(), W / 2, H / 2 + (lines.length / 2 + 0.8) * size * 1.3, { size: 22 * un, weight: 600, align: MT.CENTER, tracking: 0.35, color: accentOf(ctx), progress: U.clamp((t - 1.5) / 1.5) });
    },
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
