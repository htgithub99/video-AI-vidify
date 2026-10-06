(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util;
  const cache = {};
  const ABSOLUTE = /^(data:|blob:|https?:|\/)/;
  const urlOf = (src) => (ABSOLUTE.test(src) ? src : ME.REAL && ME.REAL.url ? ME.REAL.url(src) : src);
  const load = (src) => {
    if (!src || typeof Image === MT.UNDEFINED) return null;
    if (cache[src]) return cache[src];
    const img = new Image();
    const rec = { img, ok: false, failed: false };
    rec.promise = new Promise((resolve) => {
      img.onload = () => {
        rec.ok = true;
        resolve(rec);
      };
      img.onerror = () => {
        rec.failed = true;
        resolve(rec);
      };
    });
    img.crossOrigin = MT.ANONYMOUS;
    img.decoding = MT.ASYNC;
    img.src = urlOf(src);
    cache[src] = rec;
    return rec;
  };
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const MOVES = {
    push_in: { z0: 1.04, z1: 1.2, x0: 0, x1: 0, y0: 0, y1: 0 },
    pull_out: { z0: 1.2, z1: 1.04, x0: 0, x1: 0, y0: 0, y1: 0 },
    pan_left: { z0: 1.16, z1: 1.16, x0: 0.06, x1: -0.06, y0: 0, y1: 0 },
    pan_right: { z0: 1.16, z1: 1.16, x0: -0.06, x1: 0.06, y0: 0, y1: 0 },
    rise: { z0: 1.16, z1: 1.12, x0: 0, x1: 0, y0: 0.06, y1: -0.05 },
    descend: { z0: 1.12, z1: 1.16, x0: 0, x1: 0, y0: -0.05, y1: 0.06 },
    still: { z0: 1.06, z1: 1.1, x0: 0, x1: 0, y0: 0, y1: 0 },
  };
  ME.ILLU = {
    load,
    moves: Object.keys(MOVES),
    fx: [MT.DUST, MT.RAIN, MT.SMOKE, MT.EMBERS, MT.FLICKER, MT.SNOW, MT.NONE],
    prepare: (spec, timeoutMs) => {
      const srcs = [];
      ((spec && spec.shots) || []).forEach((sh) => {
        const p = (sh && sh.params) || {};
        if (p.src && sh.template === MT.ILLUSTRATION) srcs.push(p.src);
        if (p.bgImage) srcs.push(p.bgImage);
      });
      const all = Promise.all(srcs.map((s) => (load(s) || { promise: Promise.resolve() }).promise));
      return Promise.race([all, new Promise((resolve) => setTimeout(resolve, timeoutMs || 60000))]);
    },
  };
  const particles = (g, W, H, unit, t, seed, n, fn) => {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) fn(r(), r(), r(), r(), i);
  };
  const dust = (g, W, H, unit, t, seed) => {
    g.save();
    g.globalCompositeOperation = MT.SCREEN;
    particles(g, W, H, unit, t, seed, 26, (bx, by, a, b) => {
      const sp = 0.006 + a * 0.014,
        sz = (1.2 + b * 2.6) * unit,
        ph = a * 6.28;
      const x = ((bx + t * sp + Math.sin(t * 0.35 + ph) * 0.01) % 1) * W;
      const y = ((by - t * sp * 0.6 + 1) % 1) * H;
      g.globalAlpha = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.9 + ph));
      g.fillStyle = MT.FFF3DD;
      g.beginPath();
      g.arc(x, y, sz, 0, Math.PI * 2);
      g.fill();
    });
    g.restore();
  };
  const rain = (g, W, H, unit, t, seed) => {
    g.save();
    g.strokeStyle = MT.RGBA_200_215_235_0_28;
    g.lineWidth = 1.4 * unit;
    g.beginPath();
    particles(g, W, H, unit, t, seed, 140, (bx, by, a) => {
      const sp = 1.6 + a * 0.9;
      const x = ((bx + t * 0.08) % 1) * W;
      const y = ((by + t * sp) % 1) * H;
      const len = (26 + a * 30) * unit;
      g.moveTo(x, y);
      g.lineTo(x - len * 0.18, y + len);
    });
    g.stroke();
    g.fillStyle = MT.RGBA_20_28_40_0_12;
    g.fillRect(0, 0, W, H);
    g.restore();
  };
  const snow = (g, W, H, unit, t, seed) => {
    g.save();
    g.fillStyle = MT.RGBA_255_255_255_0_75;
    particles(g, W, H, unit, t, seed, 90, (bx, by, a, b) => {
      const x = ((bx + Math.sin(t * 0.6 + a * 9) * 0.02 + t * 0.01) % 1) * W;
      const y = ((by + t * (0.05 + a * 0.06)) % 1) * H;
      g.globalAlpha = 0.35 + b * 0.5;
      g.beginPath();
      g.arc(x, y, (1.5 + b * 3) * unit, 0, Math.PI * 2);
      g.fill();
    });
    g.restore();
  };
  const smoke = (g, W, H, unit, t, seed) => {
    g.save();
    particles(g, W, H, unit, t, seed, 7, (bx, by, a, b) => {
      const x = ((bx + t * (0.01 + a * 0.015)) % 1.3) * W - W * 0.15;
      const y = H * (0.45 + by * 0.6) - t * 6 * unit;
      const r = (220 + b * 260) * unit;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, MT.RGBA_190_190_195_0_16);
      gr.addColorStop(1, MT.RGBA_190_190_195_0);
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    g.restore();
  };
  const embers = (g, W, H, unit, t, seed) => {
    g.save();
    g.globalCompositeOperation = MT.SCREEN;
    particles(g, W, H, unit, t, seed, 40, (bx, by, a, b) => {
      const x = ((bx + Math.sin(t * 1.3 + a * 7) * 0.015) % 1) * W;
      const y = (1 - ((by + t * (0.05 + a * 0.08)) % 1)) * H;
      g.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 3 + b * 9));
      g.fillStyle = b > 0.5 ? MT.FFB347 : MT.FF7A2F;
      g.beginPath();
      g.arc(x, y, (1.4 + b * 2.4) * unit, 0, Math.PI * 2);
      g.fill();
    });
    g.restore();
  };
  const flicker = (g, W, H, unit, t) => {
    const f = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 2.9 + 1.1);
    g.save();
    g.fillStyle = MT.RGBA_0_0_0_2 + (0.06 + 0.1 * f).toFixed(3) + MT.SYMBOL_17;
    g.fillRect(0, 0, W, H);
    g.restore();
  };
  const FX = { dust, rain, smoke, embers, flicker, snow };
  const paint = (g, ctx, src, params) => {
    const W = ctx.W,
      H = ctx.H,
      t = ctx.t || 0,
      unit = ctx.unit || 1;
    const u = ctx.u == null ? 0.5 : ctx.u;
    const rec = load(src);
    g.fillStyle = MT.VALUE_0B0C10;
    g.fillRect(0, 0, W, H);
    if (!rec || !rec.ok) {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, MT.VALUE_1A1D26);
      gr.addColorStop(1, MT.VALUE_0B0C10);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      return false;
    }
    const img = rec.img;
    const iw = img.naturalWidth || img.width,
      ih = img.naturalHeight || img.height;
    const mv = MOVES[params.move] || MOVES.push_in;
    const k = ease(U.clamp(u));
    const zoom = U.lerp(mv.z0, mv.z1, k);
    const base = Math.max(W / iw, H / ih);
    const s = base * zoom;
    const dw = iw * s,
      dh = ih * s;
    const f = Array.isArray(params.focus) ? params.focus : [0.5, 0.45];
    const pull = U.clamp((zoom - 1) / 0.2);
    let cx = U.lerp(0.5, U.clamp(Number(f[0]) || 0.5, 0.15, 0.85), pull * 0.65) + U.lerp(mv.x0, mv.x1, k);
    let cy = U.lerp(0.5, U.clamp(Number(f[1]) || 0.45, 0.15, 0.85), pull * 0.65) + U.lerp(mv.y0, mv.y1, k);
    cx += Math.sin(t * 0.37 + 1.3) * 0.0025;
    cy += Math.sin(t * 0.29) * 0.002;
    let x = W / 2 - cx * dw,
      y = H / 2 - cy * dh;
    x = U.clamp(x, W - dw, 0);
    y = U.clamp(y, H - dh, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = MT.HIGH;
    g.drawImage(img, x, y, dw, dh);
    g.restore();
    const light = g.createRadialGradient(W * (0.3 + 0.1 * Math.sin(t * 0.2)), H * 0.25, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6);
    light.addColorStop(0, MT.RGBA_255_236_200_0_06);
    light.addColorStop(1, MT.RGBA_0_0_0_0);
    g.fillStyle = light;
    g.fillRect(0, 0, W, H);
    const seed = 137 + (params.seed || 0);
    const fx = FX[params.fx] || (params.fx === MT.NONE ? null : dust);
    if (fx) fx(g, W, H, unit, t + (params.seed || 0), seed);
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    vg.addColorStop(0, MT.RGBA_0_0_0_0);
    vg.addColorStop(1, MT.RGBA_0_0_0_0_38);
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return true;
  };
  ME.ILLU.draw = paint;
  ME.registerTemplate(MT.ILLUSTRATION, {
    name: MT.ANH_MINH_HOA_AI_MAY_QUAY_CHUYEN_DONG,
    category: MT.SCENE,
    description: MT.ANH_MINH_HOA_DO_AI_VE_MAY_QUAY,
    init: (ctx) => ({ rec: load(ctx.params.src) }),
    draw: (g, ctx) => {
      paint(g, ctx, ctx.params.src, ctx.params);
    },
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
