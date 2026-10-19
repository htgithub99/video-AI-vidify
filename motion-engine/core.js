(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = (root.MotionEngine = root.MotionEngine || {});
  const warn = (...args) => root.console?.warn(...args);
  ME.version = MT.VALUE_1_0_0;
  const U = (ME.util = {});
  U.stringifyJson = (value, replacer, space) => JSON.stringify(value, replacer, space);
  U.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, k) => a + (b - a) * k;
  U.inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.smooth = (t) => {
    t = U.clamp(t);
    return t * t * (3 - 2 * t);
  };
  U.ease = (t) => {
    t = U.clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  U.easeOut = (t) => 1 - Math.pow(1 - U.clamp(t), 3);
  U.expoOut = (t) => {
    t = U.clamp(t);
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };
  U.back = (t, s = 1.7) => {
    t = U.clamp(t);
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  };
  U.pulse = (t, a, b, f = 0.3) => U.clamp((t - a) / f) * U.clamp((b - t) / f);
  U.mod = (v, m) => ((v % m) + m) % m;
  U.rng = (seed = 1) => {
    let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  };
  U.hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  U.noise = (x, seed = 0) => {
    const i = Math.floor(x),
      f = x - i,
      a = U.hash(i + seed * 101),
      b = U.hash(i + 1 + seed * 101);
    return (U.lerp(a, b, f * f * (3 - 2 * f)) - 0.5) * 2;
  };
  U.fbm = (x, seed = 0) => U.noise(x, seed) * 0.6 + U.noise(x * 2.1, seed + 7) * 0.3 + U.noise(x * 4.3, seed + 13) * 0.1;
  U.strHash = (s) => {
    let h = 2166136261;
    s = String(s || MT.EMPTY);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return Math.abs(h);
  };
  U.pchip = (T, Y) => {
    const n = T.length;
    if (n === 0) return () => 0;
    if (n === 1) return () => Y[0];
    const d = [],
      m = [];
    for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (T[i + 1] - T[i] || 1e-6));
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * (T[i + 1] - T[i]) + (T[i] - T[i - 1]),
          w2 = T[i + 1] - T[i] + 2 * (T[i] - T[i - 1]);
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (t) => {
      if (t <= T[0]) return Y[0];
      if (t >= T[n - 1]) return Y[n - 1];
      let i = 0;
      while (t > T[i + 1]) i++;
      const h = T[i + 1] - T[i],
        s = (t - T[i]) / h,
        s2 = s * s,
        s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * Y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * Y[i + 1] + (s3 - s2) * h * m[i + 1];
    };
  };
  U.path = (keys) => {
    const ks = (keys || []).slice().sort((a, b) => a[0] - b[0]);
    if (!ks.length) return () => [];
    const T = ks.map((k) => k[0]);
    const fns = ks[0].slice(1).map((_, j) =>
      U.pchip(
        T,
        ks.map((k) => k[j + 1]),
      ),
    );
    return (t) => fns.map((f) => f(t));
  };
  const C = (ME.color = {});
  const hexCache = {};
  C.rgb = (hex) => {
    if (Array.isArray(hex)) return hex;
    if (hexCache[hex]) return hexCache[hex];
    let h = String(hex || MT.VALUE_000).replace(MT.SYMBOL_2, MT.EMPTY);
    if (h.length === 3)
      h = h
        .split(MT.EMPTY)
        .map((c) => c + c)
        .join(MT.EMPTY);
    const v = [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
    hexCache[hex] = v;
    return v;
  };
  C.hex = (r) =>
    MT.SYMBOL_2 +
    r
      .map((v) =>
        Math.round(U.clamp(v, 0, 255))
          .toString(16)
          .padStart(2, MT.VALUE_0),
      )
      .join(MT.EMPTY);
  C.mix = (a, b, k) => {
    const A = C.rgb(a),
      B = C.rgb(b);
    return C.hex([U.lerp(A[0], B[0], k), U.lerp(A[1], B[1], k), U.lerp(A[2], B[2], k)]);
  };
  C.shade = (a, k) => (k >= 0 ? C.mix(a, MT.FFFFFF, k) : C.mix(a, MT.VALUE_000000, -k));
  C.rgba = (a, alpha) => {
    const A = C.rgb(a);
    return MF.RGBA(String(A[0]), String(A[1]), String(A[2]), String(U.clamp(alpha)));
  };
  ME.registry = { templates: {}, transitions: {} };
  ME.registerTemplate = (id, def) => (ME.registry.templates[id] = Object.assign({ id }, def));
  ME.ASPECTS = {
    [MT.VALUE_16_9]: { w: 1920, h: 1080, frameH: 1080, ground: 0.76 },
    [MT.VALUE_9_16]: { w: 1080, h: 1920, frameH: 1500, ground: 0.7 },
    [MT.VALUE_1_1]: { w: 1080, h: 1080, frameH: 1150, ground: 0.74 },
    [MT.VALUE_4_5]: { w: 1080, h: 1350, frameH: 1260, ground: 0.73 },
  };
  ME.LOOKS = {
    documentary: { name: MT.TAI_LIEU_TRUNG_TINH, filter: MT.CONTRAST_1_10_SATURATE_0_94, shadows: MT.VALUE_080D14, highlights: MT.FFF0D0, split: 0.045, vignette: 0.3, grain: 0.035, bloom: 0.11 },
    noir: { name: MT.NOIR_DIEU_TRA, filter: MT.CONTRAST_1_18_SATURATE_0_55_BRIGHTNESS_0, shadows: MT.VALUE_0A1622, highlights: MT.FFE2B8, split: 0.2, vignette: 0.6, grain: 0.08, bloom: 0.22 },
    teal_orange: { name: MT.DIEN_ANH_TEAL_ORANGE, filter: MT.CONTRAST_1_12_SATURATE_1_12, shadows: MT.VALUE_073044, highlights: MT.FFB070, split: 0.24, vignette: 0.45, grain: 0.05, bloom: 0.25 },
    vintage: { name: MT.PHIM_CU_70S, filter: MT.CONTRAST_1_04_SATURATE_0_82_SEPIA_0, shadows: MT.VALUE_2A1D14, highlights: MT.FFE0A8, split: 0.22, vignette: 0.55, grain: 0.11, bloom: 0.2 },
    cold_thriller: { name: MT.LANH_KICH_TINH, filter: MT.CONTRAST_1_15_SATURATE_0_8_HUE_ROTATE, shadows: MT.VALUE_06192E, highlights: MT.D8ECFF, split: 0.22, vignette: 0.55, grain: 0.07, bloom: 0.2 },
    warm_story: { name: MT.KE_CHUYEN_AM, filter: MT.CONTRAST_1_05_SATURATE_1_08_BRIGHTNESS_1, shadows: MT.VALUE_2B1A12, highlights: MT.FFF0C8, split: 0.16, vignette: 0.35, grain: 0.04, bloom: 0.22 },
    clean: { name: MT.SACH_KHONG_GRADE, filter: MT.NONE, shadows: MT.VALUE_000000, highlights: MT.FFFFFF, split: 0, vignette: 0.15, grain: 0, bloom: 0 },
  };
  ME.QUALITY = {
    draft: { supersample: 1, motionBlur: 1, bloom: false, grain: true, layerScale: 0.75 },
    standard: { supersample: 1, motionBlur: 1, bloom: true, grain: true, layerScale: 1 },
    high: { supersample: 1.5, motionBlur: 2, bloom: true, grain: true, layerScale: 1.25 },
    ultra: { supersample: 2, motionBlur: 3, bloom: true, grain: true, layerScale: 1.5 },
  };
  ME.makeCanvas = (w, h) => {
    w = Math.max(1, Math.ceil(w));
    h = Math.max(1, Math.ceil(h));
    if (typeof OffscreenCanvas !== MT.UNDEFINED) return new OffscreenCanvas(w, h);
    const c = document.createElement(MT.CANVAS);
    c.width = w;
    c.height = h;
    return c;
  };
  ME.FONTS = {
    body: MT.BE_VIETNAM_PRO_SEGOE_UI_ARIAL_SANS_SERIF,
    head: MT.OSWALD_BE_VIETNAM_PRO_ARIAL_NARROW_SANS_SERIF,
    serif: MT.PLAYFAIR_DISPLAY_GEORGIA_SERIF,
  };
  ME.font = (weight, size, fam = MT.BODY, style = MT.NORMAL) => MF.PX(String(style), String(weight), String(Math.round(size * 10) / 10), String(ME.FONTS[fam] || fam));
  ME.measure = (g, str, o = {}) => {
    const size = o.size || 40;
    const chars = Array.from(String(str == null ? MT.EMPTY : str));
    g.save();
    g.font = ME.font(o.weight || 700, size, o.family || MT.BODY, o.style || MT.NORMAL);
    const w = chars.reduce((a, c) => a + g.measureText(c).width, 0) + (o.tracking || 0) * size * Math.max(0, chars.length - 1);
    g.restore();
    return w;
  };
  ME.text = (g, str, x, y, o = {}) => {
    str = String(str == null ? MT.EMPTY : str);
    const size = o.size || 40;
    g.save();
    g.font = ME.font(o.weight || 700, size, o.family || MT.BODY, o.style || MT.NORMAL);
    g.textBaseline = o.baseline || MT.ALPHABETIC;
    const track = (o.tracking || 0) * size;
    const chars = Array.from(str);
    const widths = chars.map((c) => g.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + track * Math.max(0, chars.length - 1);
    let cx = o.align === MT.CENTER ? x - total / 2 : o.align === MT.RIGHT ? x - total : x;
    const p = o.progress == null ? 1 : U.clamp(o.progress);
    const mode = o.reveal || MT.FADE;
    if (o.shadow !== false) {
      g.shadowColor = o.shadowColor || MT.RGBA_0_0_0_0_55;
      g.shadowBlur = (o.shadowBlur == null ? 0.35 : o.shadowBlur) * size;
      g.shadowOffsetY = size * 0.05;
    }
    const n = chars.length;
    for (let i = 0; i < n; i++) {
      const local = mode === MT.NONE ? 1 : U.clamp((p * (n + 6)) / 6 - i / 6);
      if (local <= 0) break;
      g.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (mode === MT.FADE || mode === MT.RISE ? U.easeOut(local) : 1);
      const dy = mode === MT.RISE ? (1 - U.easeOut(local)) * size * 0.45 : 0;
      g.fillStyle = o.color || MT.FFFFFF;
      g.fillText(chars[i], cx, y + dy);
      cx += widths[i] + track;
    }
    g.restore();
    return total;
  };
  ME.wrap = (g, str, maxW, font) => {
    g.save();
    g.font = font;
    const words = String(str || MT.EMPTY)
      .split(MT.WHITESPACE_RE)
      .filter(Boolean);
    const lines = [];
    let cur = MT.EMPTY;
    for (const w of words) {
      const test = cur ? cur + MT.SYMBOL_3 + w : w;
      if (g.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    g.restore();
    return lines;
  };
  ME.roundRect = (g, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  ME.glow = (g, x, y, r, color, alpha = 1) => {
    if (r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, C.rgba(color, alpha));
    gr.addColorStop(0.35, C.rgba(color, alpha * 0.35));
    gr.addColorStop(1, C.rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  ME.cone = (g, x, y, angle, spread, len, color, alpha = 0.5) => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    const gr = g.createLinearGradient(0, 0, len, 0);
    gr.addColorStop(0, C.rgba(color, alpha));
    gr.addColorStop(1, C.rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, -spread * 0.08 * len);
    g.lineTo(len, -spread * len);
    g.lineTo(len, spread * len);
    g.lineTo(0, spread * 0.08 * len);
    g.closePath();
    g.fill();
    g.restore();
  };
  ME.normalizeSpec = (spec) => {
    const s = Object.assign({ aspect: MT.VALUE_16_9, fps: 30, look: MT.DOCUMENTARY, shots: [], subtitles: [], cast: {} }, spec || {});
    const a = ME.ASPECTS[s.aspect] || ME.ASPECTS[MT.VALUE_16_9];
    s.width = s.width || a.w;
    s.height = s.height || a.h;
    s.shots = (s.shots || []).filter((sh) => sh && ME.registry.templates[sh.template]).sort((x, y) => x.start - y.start);
    let end = 0;
    s.shots.forEach((sh, i) => {
      sh.index = i;
      if (sh.end == null) sh.end = (s.shots[i + 1] && s.shots[i + 1].start) || sh.start + 4;
      end = Math.max(end, sh.end);
    });
    s.duration = s.duration || end || 5;
    return s;
  };
  ME.createRenderer = (canvas, specIn, opts = {}) => {
    const spec = ME.normalizeSpec(JSON.parse(U.stringifyJson(specIn || {})));
    const q = Object.assign({}, ME.QUALITY.standard, typeof opts.quality === MT.STRING ? ME.QUALITY[opts.quality] : opts.quality || {});
    const W = opts.width || spec.width,
      H = opts.height || spec.height;
    canvas.width = W;
    canvas.height = H;
    const out = canvas.getContext(MT.VALUE_2D, { alpha: false });
    const ss = Math.max(1, q.supersample || 1);
    const SW = Math.round(W * ss),
      SH = Math.round(H * ss);
    const aspect = ME.ASPECTS[spec.aspect] || ME.ASPECTS[MT.VALUE_16_9];
    const look = Object.assign({}, ME.LOOKS[spec.look] || ME.LOOKS.documentary, spec.lookOverrides || {});
    const fps = spec.fps || 30;
    const unit = Math.min(W, H) / 1080;
    const sceneC = ME.makeCanvas(SW, SH),
      sg = sceneC.getContext(MT.VALUE_2D);
    const accC = q.motionBlur > 1 ? ME.makeCanvas(SW, SH) : null;
    const layerA = ME.makeCanvas(SW, SH),
      layerB = ME.makeCanvas(SW, SH);
    const bloomC = q.bloom && look.bloom > 0 ? ME.makeCanvas(Math.ceil(W / 4), Math.ceil(H / 4)) : null;
    const vig = ME.makeCanvas(W, H);
    {
      const v = vig.getContext(MT.VALUE_2D);
      const r = Math.hypot(W, H) / 2;
      const gr = v.createRadialGradient(W / 2, H / 2, r * 0.35, W / 2, H / 2, r * 1.02);
      gr.addColorStop(0, MT.RGBA_0_0_0_0);
      gr.addColorStop(0.6, MF.RGBA_0_0_0(String(look.vignette * 0.25)));
      gr.addColorStop(1, MF.RGBA_0_0_0(String(look.vignette)));
      v.fillStyle = gr;
      v.fillRect(0, 0, W, H);
    }
    const grains = [];
    if (q.grain && look.grain > 0) {
      for (let k = 0; k < 4; k++) {
        const gc = ME.makeCanvas(256, 256),
          gx = gc.getContext(MT.VALUE_2D);
        const img = gx.createImageData(256, 256);
        const r = U.rng(911 + k * 31);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = 128 + (r() + r() + r() - 1.5) * 120;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        gx.putImageData(img, 0, 0);
        grains.push(gc);
      }
    }
    const splitTone = (() => {
      if (!look.split) return null;
      const c = ME.makeCanvas(4, 256),
        x = c.getContext(MT.VALUE_2D);
      const gr = x.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, C.rgba(look.highlights, 1));
      gr.addColorStop(1, C.rgba(look.shadows, 1));
      x.fillStyle = gr;
      x.fillRect(0, 0, 4, 256);
      return c;
    })();
    const finish = spec.finish && typeof spec.finish === MT.OBJECT ? spec.finish : null;
    let finisher = null;
    if (finish && ME.createStyleFinish) {
      try {
        finisher = ME.createStyleFinish(finish, SW, SH);
      } catch (e) {
        warn(MT.MOTION_STYLE_FINISH_FAILED, MT.EMPTY, e);
      }
    }
    const stepTime = (t) => (finish && finish.stepFps > 0 ? Math.floor(t * finish.stepFps + 1e-6) / finish.stepFps : t);
    const finishFonts = finish && finish.fonts ? Object.assign({}, ME.FONTS, finish.fonts) : null;
    const ctxBase = { spec, W: SW, H: SH, ss, unit: Math.min(SW, SH) / 1080, aspect, fps, quality: q, look, cast: spec.cast || {}, preview: !!opts.preview };
    const shots = spec.shots.map((sh, index) => ({ shot: sh, tpl: ME.registry.templates[sh.template], state: null, ready: false, index }));
    const ensure = (inst) => {
      if (inst.ready) return;
      inst.ready = true;
      try {
        inst.state = inst.tpl.init ? inst.tpl.init(Object.assign({}, ctxBase, { shot: inst.shot, params: inst.shot.params || {} })) : {};
        inst.error = null;
      } catch (e) {
        inst.error = e;
        warn(MT.MOTION_INIT_FAILED, inst.shot.template, e);
      }
    };
    const release = (keepFrom, keepTo) => {
      for (const inst of shots) {
        if (inst.ready && (inst.index < keepFrom || inst.index > keepTo)) {
          inst.ready = false;
          if (inst.state && typeof inst.state.dispose === MT.FUNCTION) {
            try {
              inst.state.dispose();
            } catch (e) {
              void e;
            }
          }
          inst.state = null;
        }
      }
    };
    let liveFrom = -1;
    const drawShot = (g, inst, t) => {
      ensure(inst);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = MT.SOURCE_OVER;
      g.filter = MT.NONE;
      g.fillStyle = MT.VALUE_000;
      g.fillRect(0, 0, SW, SH);
      if (!inst.error) {
        const sh = inst.shot;
        const dur = Math.max(0.01, sh.end - sh.start);
        const lt = t - sh.start;
        try {
          inst.tpl.draw(g, Object.assign({}, ctxBase, { shot: sh, params: sh.params || {}, state: inst.state, t: lt, u: lt / dur, dur, abs: t, hud: ME.hudAt ? ME.hudAt(spec.hud, t) : null }));
        } catch (e) {
          if (!inst.warned) warn(MT.MOTION_DRAW_FAILED, sh.template, e);
          inst.warned = true;
          if (opts.strict) throw e;
        }
      }
      g.restore();
    };
    const transitionOf = (sh) => {
      const tr = Object.assign({ type: MT.FADE, duration: 0.6 }, sh.transition || {});
      if (finish && finish.transition && tr.type !== MT.CUT && ME.registry.transitions[finish.transition]) tr.type = finish.transition;
      return tr;
    };
    const renderScene = (t) => {
      let cur = -1;
      for (let i = 0; i < shots.length; i++) if (t >= shots[i].shot.start) cur = i;
      if (cur < 0) cur = 0;
      if (cur !== liveFrom) {
        release(cur - 1, cur + 1);
        liveFrom = cur;
      }
      const B = shots[cur];
      if (!B) {
        sg.fillStyle = MT.VALUE_000;
        sg.fillRect(0, 0, SW, SH);
        return;
      }
      const tr = transitionOf(B.shot);
      const A = shots[cur - 1];
      const k = tr.type === MT.CUT || !A ? 1 : U.clamp((t - B.shot.start) / Math.max(0.05, tr.duration));
      if (k >= 1) {
        drawShot(sg, B, t);
        return;
      }
      const ga = layerA.getContext(MT.VALUE_2D),
        gb = layerB.getContext(MT.VALUE_2D);
      drawShot(ga, A, t);
      drawShot(gb, B, t);
      ME.transitions(tr.type)(sg, layerA, layerB, k, SW, SH, tr);
    };
    const subtitleAt = (t) => {
      const list = spec.subtitles || [];
      for (let i = 0; i < list.length; i++) if (t >= list[i].start && t < list[i].end) return list[i];
      return null;
    };
    const drawOverlays = (t) => {
      for (const inst of shots) {
        const sh = inst.shot;
        if (!sh.overlays || t < sh.start - 0.2 || t > sh.end + 0.6) continue;
        for (const ov of sh.overlays) {
          if (sh.template === MT.GEN3D && ov.type === MT.TAG) continue;
          ME.drawOverlay(out, ov, t - sh.start, sh, { W, H, unit, aspect, look });
        }
      }
      if (ME.drawHud && spec.hud) {
        const live = spec.shots.filter((sh) => t >= sh.start && t < sh.end).pop();
        const p = (live && live.params) || {};
        ME.drawHud(out, spec.hud, t, { W, H, unit, shotText: [p.title, p.verdict, p.label, p.kicker, p.headline].filter(Boolean).join(MT.SYMBOL_3) });
      }
      const sub = spec.subtitleStyle === MT.OFF ? null : subtitleAt(t);
      if (sub) ME.drawSubtitle(out, sub, t, { W, H, unit, aspect, style: spec.subtitleStyle || MT.CINEMA, letterbox: spec.letterbox });
    };
    const post = (t, frameIndex) => {
      const base = accC || sceneC;
      const src = finisher ? finisher.apply(base, frameIndex) : base;
      out.save();
      out.setTransform(1, 0, 0, 1, 0, 0);
      out.globalAlpha = 1;
      out.globalCompositeOperation = MT.SOURCE_OVER;
      out.imageSmoothingEnabled = true;
      out.imageSmoothingQuality = MT.HIGH;
      out.filter = look.filter || MT.NONE;
      out.drawImage(src, 0, 0, W, H);
      out.filter = MT.NONE;
      if (bloomC) {
        const b = bloomC.getContext(MT.VALUE_2D);
        b.globalCompositeOperation = MT.COPY;
        b.filter = MT.BRIGHTNESS_0_85_CONTRAST_2_6_BLUR_3PX;
        b.drawImage(src, 0, 0, bloomC.width, bloomC.height);
        b.filter = MT.NONE;
        out.globalCompositeOperation = MT.SCREEN;
        out.globalAlpha = look.bloom;
        out.drawImage(bloomC, 0, 0, W, H);
        out.globalAlpha = 1;
      }
      if (splitTone) {
        out.globalCompositeOperation = MT.SOFT_LIGHT;
        out.globalAlpha = look.split;
        out.drawImage(splitTone, 0, 0, W, H);
        out.globalAlpha = 1;
      }
      out.globalCompositeOperation = MT.SOURCE_OVER;
      out.drawImage(vig, 0, 0);
      if (spec.letterbox) {
        const bar = spec.aspect === MT.VALUE_16_9 ? Math.round((H - W / 2.39) / 2) : Math.round(H * 0.06);
        out.fillStyle = MT.VALUE_000;
        out.fillRect(0, 0, W, bar);
        out.fillRect(0, H - bar, W, bar);
      }
      drawOverlays(t);
      if (grains.length) {
        out.globalCompositeOperation = MT.OVERLAY;
        out.globalAlpha = look.grain;
        const gp = out.createPattern(grains[frameIndex % grains.length], MT.REPEAT);
        out.fillStyle = gp;
        const ox = (frameIndex * 37) % 256,
          oy = (frameIndex * 91) % 256;
        out.translate(-ox, -oy);
        out.fillRect(0, 0, W + 256, H + 256);
        out.setTransform(1, 0, 0, 1, 0, 0);
        out.globalAlpha = 1;
        out.globalCompositeOperation = MT.SOURCE_OVER;
      }
      const fin = spec.fadeIn == null ? 0.6 : spec.fadeIn,
        fout = spec.fadeOut == null ? 1.2 : spec.fadeOut;
      const fade = Math.min(fin > 0 ? U.clamp(t / fin) : 1, fout > 0 ? U.clamp((spec.duration - t) / fout) : 1);
      if (fade < 1) {
        out.fillStyle = MF.RGBA_0_0_0(String(1 - U.smooth(fade)));
        out.fillRect(0, 0, W, H);
      }
      out.restore();
    };
    const inToon = (fn) => {
      if (!finishFonts) return fn();
      const saved = ME.FONTS;
      ME.FONTS = finishFonts;
      try {
        return fn();
      } finally {
        ME.FONTS = saved;
      }
    };
    const drawFrame = (t) => {
      const frameIndex = Math.round(t * fps);
      const K = Math.max(1, Math.round(q.motionBlur || 1));
      if (K > 1 && accC) {
        const ag = accC.getContext(MT.VALUE_2D);
        const shutter = (spec.shutter == null ? 0.5 : spec.shutter) / fps;
        for (let i = 0; i < K; i++) {
          const ts = t + (i / (K - 1) - 0.5) * shutter;
          renderScene(stepTime(Math.max(0, ts)));
          ag.globalAlpha = 1 / (i + 1);
          ag.globalCompositeOperation = MT.SOURCE_OVER;
          ag.drawImage(sceneC, 0, 0);
        }
        ag.globalAlpha = 1;
      } else renderScene(stepTime(t));
      post(t, frameIndex);
    };
    return {
      spec,
      width: W,
      height: H,
      fps,
      duration: spec.duration,
      quality: q,
      drawFrame: (t) => inToon(() => drawFrame(t)),
      check(step = 1 / 6) {
        return inToon(() => this.checkRaw(step));
      },
      checkRaw(step = 1 / 6) {
        const errs = [];
        for (let t = 0; t < spec.duration; t += step) {
          for (const inst of shots) {
            if (t < inst.shot.start || t > inst.shot.end) continue;
            if (!inst.ready) {
              release(inst.index - 1, inst.index);
              ensure(inst);
            }
            if (inst.error) {
              errs.push({ t, shot: inst.shot.id || inst.shot.index, error: String(inst.error.message || inst.error) });
              continue;
            }
            try {
              drawShot(sg, inst, t);
            } catch (e) {
              errs.push({ t: +t.toFixed(2), shot: inst.shot.id || inst.shot.index, error: String(e.message || e) });
            }
            if (errs.length > 20) return errs;
          }
        }
        return errs;
      },
      shotAt(t) {
        let r = null;
        for (const s of spec.shots) if (t >= s.start) r = s;
        return r;
      },
    };
  };
  ME.transitions = (type) => ME.registry.transitions[type] || ME.registry.transitions.fade;
  const T = ME.registry.transitions;
  T.cut = (g, a, b) => g.drawImage(b, 0, 0);
  T.fade = (g, a, b, k) => {
    g.globalAlpha = 1;
    g.drawImage(a, 0, 0);
    g.globalAlpha = U.smooth(k);
    g.drawImage(b, 0, 0);
    g.globalAlpha = 1;
  };
  T.dip = (g, a, b, k, W, H, tr) => {
    const col = tr.color || MT.VALUE_000;
    if (k < 0.5) {
      g.drawImage(a, 0, 0);
      g.fillStyle = C.rgba(col, U.smooth(k * 2));
    } else {
      g.drawImage(b, 0, 0);
      g.fillStyle = C.rgba(col, 1 - U.smooth((k - 0.5) * 2));
    }
    g.fillRect(0, 0, W, H);
  };
  T.flash = (g, a, b, k, W, H) => {
    g.drawImage(k < 0.5 ? a : b, 0, 0);
    g.fillStyle = MF.RGBA_255_248_235(String(Math.pow(1 - Math.abs(k - 0.5) * 2, 2) * 0.95));
    g.fillRect(0, 0, W, H);
  };
  const smear = (g, img, dx, blurPx, W) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      g.globalAlpha = i === 0 ? 1 : 1 / (i + 1);
      g.drawImage(img, dx + (i / (n - 1) - 0.5) * blurPx, 0, W, g.canvas.height);
    }
    g.globalAlpha = 1;
  };
  T.whip = (g, a, b, k, W, H, tr) => {
    const dir = tr.direction === MT.RIGHT ? 1 : -1;
    const e = U.ease(k);
    const speed = Math.sin(Math.PI * k);
    g.fillStyle = MT.VALUE_000;
    g.fillRect(0, 0, W, H);
    smear(g, a, dir * e * W, speed * W * 0.18, W);
    smear(g, b, dir * (e - 1) * W, speed * W * 0.18, W);
  };
  T.push = (g, a, b, k, W, H, tr) => {
    const dir = tr.direction === MT.RIGHT ? 1 : -1;
    const e = U.ease(k);
    g.drawImage(a, dir * e * W, 0);
    g.drawImage(b, dir * (e - 1) * W, 0);
  };
  T.zoom = (g, a, b, k, W, H) => {
    const e = U.ease(k);
    g.save();
    g.translate(W / 2, H / 2);
    g.scale(1 + e * 0.35, 1 + e * 0.35);
    g.globalAlpha = 1 - U.smooth(k * 1.4);
    g.drawImage(a, -W / 2, -H / 2);
    g.restore();
    g.save();
    g.translate(W / 2, H / 2);
    const s = 0.86 + 0.14 * e;
    g.scale(s, s);
    g.globalAlpha = U.smooth(k * 1.2);
    g.drawImage(b, -W / 2, -H / 2);
    g.restore();
    g.globalAlpha = 1;
  };
  T.wipe = (g, a, b, k, W, H, tr) => {
    g.drawImage(a, 0, 0);
    const e = U.ease(k);
    const soft = W * 0.08;
    const x = -soft + e * (W + soft * 2);
    g.save();
    g.beginPath();
    g.rect(0, 0, x, H);
    g.clip();
    g.drawImage(b, 0, 0);
    g.restore();
    const gr = g.createLinearGradient(x - soft, 0, x, 0);
    gr.addColorStop(0, MT.RGBA_255_255_255_0);
    gr.addColorStop(1, MF.RGBA_255_240_220(String(0.25 * Math.sin(Math.PI * k))));
    g.fillStyle = gr;
    g.fillRect(x - soft, 0, soft, H);
    void tr;
  };
  T.blur = (g, a, b, k) => {
    const s = Math.sin(Math.PI * k);
    g.filter = MF.BLUR_PX(String((s * 14).toFixed(1)));
    g.drawImage(a, 0, 0);
    g.globalAlpha = U.smooth(k);
    g.drawImage(b, 0, 0);
    g.globalAlpha = 1;
    g.filter = MT.NONE;
  };
  const scratch = { c: null };
  const scratchOf = (w, h) => {
    if (!scratch.c || scratch.c.width !== w || scratch.c.height !== h) scratch.c = ME.makeCanvas(w, h);
    return scratch.c;
  };
  T.pixelate = (g, a, b, k, W, H) => {
    const block = Math.max(1, Math.round(1 + Math.sin(Math.PI * k) * 46 * (W / 1920)));
    const src = k < 0.5 ? a : b;
    if (block <= 1) return g.drawImage(src, 0, 0);
    const w = Math.max(1, Math.round(W / block)),
      h = Math.max(1, Math.round(H / block));
    const c = scratchOf(w, h),
      x = c.getContext(MT.VALUE_2D);
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, w, h);
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, W, H);
    g.restore();
  };
  T.iris = (g, a, b, k, W, H) => {
    const diag = Math.hypot(W, H) / 2;
    const closing = k < 0.5;
    const r = Math.max(0, (closing ? 1 - k * 2 : k * 2 - 1) * diag);
    g.fillStyle = MT.VALUE_000;
    g.fillRect(0, 0, W, H);
    g.save();
    g.beginPath();
    g.arc(W / 2, H / 2, r, 0, Math.PI * 2);
    g.clip();
    g.drawImage(closing ? a : b, 0, 0);
    g.restore();
  };
  T.ink = (g, a, b, k, W, H) => {
    g.drawImage(a, 0, 0);
    const rnd = U.rng(4242);
    const e = U.ease(k);
    g.save();
    g.beginPath();
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W,
        y = rnd() * H,
        grow = 0.4 + rnd() * 0.9;
      const r = Math.max(0, e * grow * Math.hypot(W, H) * 0.42);
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, Math.PI * 2);
    }
    g.clip();
    g.drawImage(b, 0, 0);
    g.restore();
  };
  T.tear = (g, a, b, k, W, H) => {
    g.drawImage(a, 0, 0);
    const e = U.ease(k);
    const teeth = 18,
      amp = W * 0.025;
    const x0 = -amp * 2 + e * (W + amp * 4);
    g.save();
    g.beginPath();
    g.moveTo(0, 0);
    for (let i = 0; i <= teeth; i++) g.lineTo(x0 + (i % 2 ? amp : -amp), (H * i) / teeth);
    g.lineTo(0, H);
    g.closePath();
    g.fillStyle = MT.VALUE_000;
    g.shadowColor = MT.RGBA_0_0_0_0_45;
    g.shadowBlur = 18 * (W / 1920);
    g.fill();
    g.clip();
    g.shadowColor = MT.RGBA_0_0_0_0;
    g.drawImage(b, 0, 0);
    g.restore();
  };
  ME.drawSubtitle = (g, sub, t, o) => {
    const { W, H, unit } = o;
    const portrait = H > W;
    const size = (portrait ? 36 : 29) * unit;
    const quote = !!(sub.dialogue || sub.speaker);
    const font = (quote ? MT.SUB_ITALIC : MT.EMPTY) + ME.font(quote ? 600 : 500, size, MT.BODY);
    const lines = ME.wrap(g, quote ? MT.SUB_QUOTE_OPEN + sub.text + MT.SUB_QUOTE_CLOSE : sub.text, W * (portrait ? 0.8 : 0.62), font).slice(0, 2);
    const life = U.clamp((t - sub.start) / 0.2) * U.clamp((sub.end - t) / 0.2);
    const rise = (1 - U.easeOut(U.clamp((t - sub.start) / 0.3))) * size * 0.18;
    const lh = size * 1.36;
    let baseY = portrait ? H * 0.84 : H - (o.letterbox ? H * 0.155 : H * 0.09);
    baseY -= (lines.length - 1) * lh;
    g.save();
    g.globalAlpha = U.smooth(life);
    g.font = font;
    g.textAlign = MT.CENTER;
    g.textBaseline = MT.ALPHABETIC;
    if (o.style === MT.BOXED || o.style === MT.CINEMA) {
      const maxW = Math.max(...lines.map((l) => g.measureText(l).width));
      const padX = size * 0.75,
        padY = size * 0.42;
      const bx = W / 2 - maxW / 2 - padX,
        by = baseY - size * 0.98 - padY * 0.5 + rise,
        bw = maxW + padX * 2,
        bh = lh * (lines.length - 1) + size * 1.3 + padY;
      g.shadowColor = MT.SUB_SHADOW;
      g.shadowBlur = size * 0.6;
      g.shadowOffsetY = size * 0.08;
      g.fillStyle = MT.SUB_BOX;
      ME.roundRect(g, bx, by, bw, bh, Math.min(bh / 2, size * 0.5));
      g.fill();
      g.shadowBlur = 0;
      g.shadowOffsetY = 0;
      g.lineWidth = Math.max(1, unit);
      g.strokeStyle = MT.SUB_BORDER;
      g.stroke();
      if (quote) {
        const aw = Math.min(bw * 0.28, size * 3);
        g.fillStyle = MT.SUB_ACCENT;
        ME.roundRect(g, W / 2 - aw / 2, by - size * 0.06, aw, Math.max(2, size * 0.09), size * 0.05);
        g.fill();
      }
    }
    lines.forEach((ln, i) => {
      const y = baseY + i * lh + rise;
      g.shadowColor = MT.SUB_SHADOW;
      g.shadowBlur = size * 0.25;
      g.shadowOffsetY = size * 0.03;
      g.fillStyle = quote ? MT.SUB_QUOTE_COLOR : MT.SUB_TEXT;
      g.fillText(ln, W / 2, y);
      g.shadowBlur = 0;
    });
    g.restore();
  };
  ME.drawOverlay = (g, ov, lt, shot, o) => {
    const { W, H, unit } = o;
    const at = ov.at || 0,
      dur = ov.duration || Math.max(1.5, shot.end - shot.start - at - 0.3);
    const k = lt - at;
    if (k < 0 || k > dur + 0.6) return;
    const inK = U.easeOut(U.clamp(k / 0.6)),
      outK = U.clamp((dur + 0.6 - k) / 0.6);
    const a = inK * U.smooth(outK);
    const accent = ov.color || MT.FFB070;
    const portrait = H > W;
    g.save();
    g.globalAlpha = a;
    if (ov.type === MT.LOWERTHIRD) {
      const x = W * (portrait ? 0.08 : 0.065),
        y = H * (portrait ? 0.16 : 0.8);
      const s = 34 * unit;
      const barW = (W * 0.004 + 2) * 1;
      g.fillStyle = accent;
      g.fillRect(x, y - s * 1.1, barW, s * 2.3 * inK);
      ME.text(g, ov.text, x + s * 0.6, y, { size: s, weight: 800, tracking: 0.02, progress: U.clamp(k / 0.9), reveal: MT.RISE });
      if (ov.sub) ME.text(g, ov.sub, x + s * 0.62, y + s * 1.05, { size: s * 0.58, weight: 500, color: MT.D8D2C8, tracking: 0.12, progress: U.clamp((k - 0.25) / 0.9) });
    } else if (ov.type === MT.TAG) {
      const s = 28 * unit;
      const x = W * 0.065,
        y = portrait ? H * 0.1 : H * 0.11;
      g.font = ME.font(700, s, MT.HEAD);
      const tw = g.measureText(ov.text).width + s * 0.12 * ov.text.length;
      g.fillStyle = MT.RGBA_8_10_14_0_55;
      ME.roundRect(g, x - s * 0.5, y - s * 1.05, (tw + s) * inK, s * 1.55, s * 0.2);
      g.fill();
      g.fillStyle = accent;
      g.fillRect(x - s * 0.5, y - s * 1.05, s * 0.14, s * 1.55);
      ME.text(g, ov.text, x, y, { size: s, weight: 700, family: MT.HEAD, tracking: 0.12, progress: U.clamp(k / 0.8), color: MT.F3EFE8, shadow: false });
    } else if (ov.type === MT.STAMP) {
      const s = (ov.size || 120) * unit;
      g.translate(W / 2, H * (portrait ? 0.4 : 0.42));
      const sc = 1.25 - 0.25 * U.back(U.clamp(k / 0.5));
      g.scale(sc, sc);
      ME.text(g, ov.text, 0, 0, { size: s, weight: 700, family: MT.HEAD, align: MT.CENTER, tracking: 0.04, color: ov.textColor || MT.F6F1E7 });
      if (ov.sub) ME.text(g, ov.sub, 0, s * 0.62, { size: s * 0.24, weight: 600, align: MT.CENTER, tracking: 0.3, color: accent });
    } else if (ov.type === MT.CAPTION) {
      const s = 30 * unit;
      ME.text(g, ov.text, W / 2, H * (ov.y || 0.15), { size: s, weight: 600, align: MT.CENTER, tracking: 0.18, color: ov.textColor || MT.E9E3D8, progress: U.clamp(k / 1) });
    }
    g.restore();
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
