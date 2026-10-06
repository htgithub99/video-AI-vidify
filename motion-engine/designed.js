(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME && ME.TOON;
  if (!ME || !T || !T.kit) return;
  const K = T.kit;
  const C = ME.color;
  const { paint, rect, rrect, ell, poly, stroke, glowDisc, P } = K;
  const LIMITS = { shapes: 420, depth: 6, repeat: 60, path: 6000, pts: 200, layers: 8, elements: 40, props: 30, size: 6000 };
  const SHAPE_TYPES = [MT.RECT, MT.ELLIPSE, MT.CIRCLE, MT.POLY, MT.PATH, MT.LINE, MT.GROUP];
  const CATEGORIES = [MT.FURNITURE, MT.PROP, MT.INTERIOR, MT.STRUCTURE, MT.STREET, MT.VEHICLE, MT.NATURE, MT.URBAN, MT.FX];
  const PATH_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+\-eE]*$/;
  const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const ID_RE = /^[a-z][a-z0-9_]{2,40}$/;
  const num = (v, d, lo, hi) => {
    const n = typeof v === MT.NUMBER && isFinite(v) ? v : d;
    return Math.max(lo, Math.min(hi, n));
  };
  const issues = [];
  const note = (msg) => {
    if (issues.length < 30) issues.push(msg);
  };
  const cleanColor = (c, palette) => {
    if (c == null || c === MT.NONE) return null;
    if (typeof c !== MT.STRING) return null;
    if (palette[c]) return palette[c];
    if (HEX_RE.test(c)) return c;
    if (/^rgba?\([\d.\s,]+\)$/.test(c)) return c;
    note(MT.UNKNOWN_COLOUR + c);
    return null;
  };
  const cleanMap = (v, d, lo, hi) => {
    if (v && typeof v === MT.OBJECT && !Array.isArray(v) && typeof v.p === MT.STRING) return { p: v.p.slice(0, 24), a: num(v.a, d, lo, hi), b: num(v.b, d, lo, hi) };
    return num(v, d, lo, hi);
  };
  const cleanPts = (pts) =>
    Array.isArray(pts)
      ? pts
          .slice(0, LIMITS.pts)
          .filter((q) => Array.isArray(q) && q.length >= 2)
          .map((q) => [num(q[0], 0, -LIMITS.size, LIMITS.size), num(q[1], 0, -LIMITS.size, LIMITS.size)])
      : [];
  let count = 0;
  const cleanShape = (s, palette, depth) => {
    if (!s || typeof s !== MT.OBJECT || count >= LIMITS.shapes) return null;
    const t = SHAPE_TYPES.indexOf(s.t) >= 0 ? s.t : null;
    if (!t) {
      note(MT.UNKNOWN_SHAPE + s.t);
      return null;
    }
    count++;
    const out = { t };
    const B = LIMITS.size;
    if (t === MT.RECT) Object.assign(out, { x: num(s.x, 0, -B, B), y: num(s.y, 0, -B, B), w: num(s.w, 10, 0, B), h: num(s.h, 10, 0, B), r: num(s.r, 0, 0, 400) });
    if (t === MT.ELLIPSE) Object.assign(out, { cx: num(s.cx, 0, -B, B), cy: num(s.cy, 0, -B, B), rx: num(s.rx, 10, 0, B), ry: num(s.ry, 10, 0, B), rot: num(s.rot, 0, -7, 7) });
    if (t === MT.CIRCLE) Object.assign(out, { t: MT.ELLIPSE, cx: num(s.cx, 0, -B, B), cy: num(s.cy, 0, -B, B), rx: num(s.r, 10, 0, B), ry: num(s.r, 10, 0, B), rot: 0 });
    if (t === MT.POLY || t === MT.LINE) Object.assign(out, { pts: cleanPts(s.pts), smooth: !!s.smooth, closed: t === MT.POLY });
    if (t === MT.PATH) {
      const d = typeof s.d === MT.STRING ? s.d.slice(0, LIMITS.path) : "";
      if (!PATH_RE.test(d)) {
        note(MT.BAD_PATH);
        return null;
      }
      out.d = d;
    }
    if (t === MT.GROUP) {
      if (depth >= LIMITS.depth) return null;
      out.shapes = (Array.isArray(s.shapes) ? s.shapes : []).map((c) => cleanShape(c, palette, depth + 1)).filter(Boolean);
      if (s.repeat && typeof s.repeat === MT.OBJECT) out.repeat = { n: Math.round(num(s.repeat.n, 1, 1, LIMITS.repeat)), dx: num(s.repeat.dx, 0, -B, B), dy: num(s.repeat.dy, 0, -B, B) };
    }
    for (const k of [MT.X_2, MT.Y]) if (t === MT.GROUP && s[k] != null) out[k] = cleanMap(s[k], 0, -B, B);
    if (s.rot != null && t === MT.GROUP) out.rot = cleanMap(s.rot, 0, -7, 7);
    if (s.sx != null) out.sx = cleanMap(s.sx, 1, -4, 4);
    if (s.sy != null) out.sy = cleanMap(s.sy, 1, -4, 4);
    if (s.ox != null) out.ox = num(s.ox, 0, -B, B);
    if (s.oy != null) out.oy = num(s.oy, 0, -B, B);
    if (s.alpha != null) out.alpha = cleanMap(s.alpha, 1, 0, 1);
    out.fill = cleanColor(s.fill, palette);
    if (Array.isArray(s.grad) && s.grad.length >= 2) {
      const grad = s.grad
        .slice(0, 4)
        .map((c) => cleanColor(c, palette))
        .filter(Boolean);
      if (grad.length >= 2) out.grad = grad;
      else if (!out.fill && grad.length) out.fill = grad[0];
    }
    out.stroke = cleanColor(s.stroke, palette);
    if (out.stroke) out.sw = num(s.sw, 3, 0.5, 40);
    out.d = t === MT.PATH ? out.d : undefined;
    out.depth = num(s.depth, 3, 0, 10);
    if (s.glow) out.glow = cleanColor(s.glow, palette);
    for (const k of [MT.IF, MT.UNLESS]) if (typeof s[k] === MT.STRING) out[k] = s[k].slice(0, 24);
    return out;
  };
  const cleanPalette = (p) => {
    const out = {};
    if (p && typeof p === MT.OBJECT) for (const [k, v] of Object.entries(p).slice(0, 24)) if (/^[a-zA-Z][a-zA-Z0-9_]{0,24}$/.test(k) && typeof v === MT.STRING && HEX_RE.test(v)) out[k] = v;
    return out;
  };
  const cleanAfford = (a) => {
    if (!a || typeof a !== MT.OBJECT) return undefined;
    const out = {};
    if (Array.isArray(a.seat)) out.seat = a.seat.slice(0, 8).map((s) => ({ dx: num(s && s.dx, 0, -2000, 2000), h: num(s && s.h, 50, 0, 400) }));
    if (a.faces === MT.LEFT || a.faces === MT.RIGHT) out.faces = a.faces;
    if (a.bed) out.bed = { dx: num(a.bed.dx, 0, -500, 500), h: num(a.bed.h, 60, 0, 300) };
    if (a.surface) out.surface = { h: num(a.surface.h, 90, 10, 400), w: num(a.surface.w, 120, 10, 2000) };
    if (a.cover) out.cover = { h: num(a.cover.h, 100, 20, 400) };
    if (a.door) out.door = { dx: num(a.door.dx, 0, -500, 500), param: MT.OPEN };
    if (a.work && (a.work.mode === MT.BEHIND || a.work.mode === MT.BESIDE)) out.work = { mode: a.work.mode, seated: !!a.work.seated, dx: num(a.work.dx, 0, -800, 800) };
    if (typeof a.role === MT.STRING) out.role = a.role.slice(0, 20);
    return Object.keys(out).length ? out : undefined;
  };
  const cleanParams = (p) => {
    const out = {};
    if (p && typeof p === MT.OBJECT) for (const [k, v] of Object.entries(p).slice(0, 8)) if (/^[a-zA-Z][a-zA-Z0-9]{0,20}$/.test(k)) out[k] = String(v).slice(0, 60);
    return Object.keys(out).length ? out : undefined;
  };
  const cleanStaging = (st) => {
    if (!st || typeof st !== MT.OBJECT) return undefined;
    try {
      return JSON.parse(JSON.stringify(st, (k, v) => (typeof v === MT.STRING ? v.slice(0, 60) : v)));
    } catch (e) {
      void e;
      return undefined;
    }
  };
  const validateDesign = (raw) => {
    issues.length = 0;
    count = 0;
    if (!raw || typeof raw !== MT.OBJECT) return { ok: false, issues: [MT.NOT_AN_OBJECT] };
    const id = String(raw.id || "").toLowerCase();
    if (!ID_RE.test(id)) return { ok: false, issues: [MT.BAD_ID + raw.id] };
    const kind = raw.kind === MT.ENV ? MT.ENV : MT.ASSET;
    const palette = cleanPalette(raw.palette);
    const def = { id, kind, name: String(raw.name || id).slice(0, 80), tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8).map((t) => String(t).slice(0, 30)) : [], palette };
    if (kind === MT.ASSET) {
      def.category = CATEGORIES.indexOf(raw.category) >= 0 ? raw.category : MT.PROP;
      def.size = [num(raw.size && raw.size[0], 120, 10, 4000), num(raw.size && raw.size[1], 120, 10, 4000)];
      def.shapes = (Array.isArray(raw.shapes) ? raw.shapes : []).map((s) => cleanShape(s, palette, 0)).filter(Boolean);
      if (!def.shapes.length) return { ok: false, issues: [MT.NO_SHAPES].concat(issues) };
      def.afford = cleanAfford(raw.afford);
      def.params = cleanParams(raw.params);
      def.holdable = !!raw.holdable && def.size[0] <= 90 && def.size[1] <= 90;
      if ([MT.FLOOR, MT.TABLETOP, MT.WALL].indexOf(raw.place) >= 0) def.place = raw.place;
      if (def.place === MT.WALL) def.mountY = num(raw.mountY, 150, 30, 600);
      def.lights = Array.isArray(raw.lights) ? raw.lights.slice(0, 4).map((l) => ({ x: num(l && l.x, 0, -2000, 2000), y: num(l && l.y, -100, -4000, 100), color: cleanColor(l && l.color, palette) || MT.FFD9A0, r: num(l && l.r, 120, 10, 900), if: typeof (l && l.if) === MT.STRING ? l.if : undefined })) : undefined;
    } else {
      const subAssets = [];
      const subIssues = [];
      for (const a of (Array.isArray(raw.assets) ? raw.assets : []).slice(0, 6)) {
        const sub = validateDesign(Object.assign({}, a, { kind: MT.ASSET }));
        if (sub.ok && sub.def) subAssets.push(sub.def);
        else subIssues.push(MT.SUB_ASSET + (a && a.id) + MT.SYMBOL_18 + sub.issues.slice(0, 3).join(MT.SYMBOL_19));
        subIssues.push.apply(
          subIssues,
          (sub.issues || []).slice(0, 2).map((x) => (a && a.id) + MT.SYMBOL_18 + x),
        );
      }
      issues.length = 0;
      count = 0;
      subIssues.slice(0, 10).forEach(note);
      if (subAssets.length) def.assets = subAssets;
      const known = (id) => !!ME.registry.assets[id] || subAssets.some((a) => a.id === id);
      def.category = raw.category === MT.EXTERIOR ? MT.EXTERIOR : MT.INTERIOR;
      def.width = Math.round(num(raw.width, 2600, 1600, 5200));
      def.time = raw.time === MT.DAY || raw.time === MT.NIGHT || raw.time === MT.DUSK ? raw.time : def.category === MT.INTERIOR ? MT.INTERIOR : MT.DAY;
      const wall = raw.wall && typeof raw.wall === MT.OBJECT ? raw.wall : null;
      if (wall) def.wall = { color: cleanColor(wall.color, palette) || MT.VALUE_8A7A68, top: num(wall.top, -760, -1400, -300), base: cleanColor(wall.base, palette), trim: cleanColor(wall.trim, palette) };
      const floor = raw.floor && typeof raw.floor === MT.OBJECT ? raw.floor : {};
      def.floor = { color: cleanColor(floor.color, palette) || MT.VALUE_6A5A48, tile: num(floor.tile, 0, 0, 600), line: cleanColor(floor.line, palette) };
      if (raw.sky && typeof raw.sky === MT.OBJECT) def.sky = { top: cleanColor(raw.sky.top, palette), bottom: cleanColor(raw.sky.bottom, palette) };
      def.layers = (Array.isArray(raw.layers) ? raw.layers : []).slice(0, LIMITS.layers).map((L) => ({
        depth: num(L && L.depth, 0.9, 0.1, 1),
        blur: num(L && L.blur, 0, 0, 4),
        elements: (Array.isArray(L && L.elements) ? L.elements : []).slice(0, LIMITS.elements).map((e) => ({
          x: num(e && e.x, 0, -1000, 6000),
          y: num(e && e.y, 0, -2000, 400),
          every: e && e.every ? num(e.every, 400, 60, 4000) : 0,
          skip: Array.isArray(e && e.skip) ? e.skip.slice(0, 6).map((r) => [num(r[0], 0, -1000, 6000), num(r[1], 0, -1000, 6000)]) : undefined,
          asset: typeof (e && e.asset) === MT.STRING && known(e.asset) ? e.asset : undefined,
          scale: num(e && e.scale, 1, 0.1, 6),
          shapes: (Array.isArray(e && e.shapes) ? e.shapes : []).map((s) => cleanShape(s, palette, 0)).filter(Boolean),
        })),
      }));
      def.props = (Array.isArray(raw.props) ? raw.props : [])
        .slice(0, LIMITS.props)
        .filter((p) => p && typeof p.asset === MT.STRING && (known(p.asset) || (note(MT.UNKNOWN_PROP_ASSET + p.asset + MT.DESIGN_IT_IN_ASSETS_OR_USE_A_LIBRARY), false)))
        .map((p) => ({ asset: p.asset, x: num(p.x, 1000, 0, 6000), lane: [MT.BACK, MT.MID, MT.FRONT, MT.FORE].indexOf(p.lane) >= 0 ? p.lane : MT.BACK, scale: num(p.scale, 1, 0.2, 4), facing: p.facing === MT.LEFT ? MT.LEFT : undefined, y: p.y != null ? num(p.y, 0, -1200, 100) : undefined }));
      def.staging = cleanStaging(raw.staging);
    }
    return { ok: true, def, issues: issues.slice() };
  };
  const pv = (v, o, d) => {
    if (v == null) return d;
    if (typeof v === MT.NUMBER) return v;
    const k = Math.max(0, Math.min(1, +(o && o[v.p]) || 0));
    return v.a + (v.b - v.a) * k;
  };
  const pathOf = (s) => {
    if (s.t === MT.RECT) return s.r ? rrect(s.x, s.y, s.w, s.h, Math.min(s.r, s.w / 2, s.h / 2)) : rect(s.x, s.y, s.w, s.h);
    if (s.t === MT.ELLIPSE) return ell(s.cx, s.cy, s.rx, s.ry, s.rot);
    if (s.t === MT.POLY) return s.pts.length >= 3 ? poly(s.pts, s.smooth) : null;
    if (s.t === MT.PATH) {
      try {
        return new Path2D(s.d);
      } catch (e) {
        void e;
        return null;
      }
    }
    return null;
  };
  const fillOf = (g, s) => {
    if (!s.grad || s.grad.length < 2) return s.fill;
    let y0 = -100,
      y1 = 0;
    if (s.t === MT.RECT) {
      y0 = s.y;
      y1 = s.y + s.h;
    } else if (s.t === MT.ELLIPSE) {
      y0 = s.cy - s.ry;
      y1 = s.cy + s.ry;
    } else if (s.pts && s.pts.length) {
      y0 = Math.min.apply(
        null,
        s.pts.map((q) => q[1]),
      );
      y1 = Math.max.apply(
        null,
        s.pts.map((q) => q[1]),
      );
    }
    const gr = g.createLinearGradient(0, y0, 0, y1 === y0 ? y0 + 1 : y1);
    s.grad.forEach((c, i) => gr.addColorStop(i / (s.grad.length - 1), c));
    return gr;
  };
  const drawShapes = (g, shapes, o) => {
    for (const s of shapes) {
      if (s.if && !(o && o[s.if])) continue;
      if (s.unless && o && o[s.unless]) continue;
      const alpha = pv(s.alpha, o, 1);
      if (alpha <= 0.001) continue;
      const tx = s.t === MT.GROUP ? pv(s.x, o, 0) : 0,
        ty = s.t === MT.GROUP ? pv(s.y, o, 0) : 0;
      const sx = pv(s.sx, o, 1),
        sy = pv(s.sy, o, 1),
        rot = s.t === MT.GROUP ? pv(s.rot, o, 0) : 0;
      const transformed = tx || ty || sx !== 1 || sy !== 1 || rot;
      g.save();
      if (alpha < 1) g.globalAlpha *= alpha;
      if (transformed) {
        g.translate(tx + (s.ox || 0), ty + (s.oy || 0));
        if (rot) g.rotate(rot);
        if (sx !== 1 || sy !== 1) g.scale(sx, sy);
        if (s.ox || s.oy) g.translate(-(s.ox || 0), -(s.oy || 0));
      }
      if (s.t === MT.GROUP) {
        const n = s.repeat ? s.repeat.n : 1;
        for (let i = 0; i < n; i++) {
          g.save();
          if (i) g.translate(s.repeat.dx * i, s.repeat.dy * i);
          drawShapes(g, s.shapes, o);
          g.restore();
        }
      } else if (s.t === MT.LINE) {
        if (s.pts.length >= 2) stroke(g, s.pts, s.stroke || s.fill || MT.VALUE_222222, s.sw || 3, true);
      } else {
        const p = pathOf(s);
        if (p) {
          if (s.glow) {
            const b = s.t === MT.ELLIPSE ? [s.cx, s.cy, Math.max(s.rx, s.ry)] : s.t === MT.RECT ? [s.x + s.w / 2, s.y + s.h / 2, Math.max(s.w, s.h) / 2] : null;
            if (b) glowDisc(g, b[0], b[1], b[2] * 2.4, s.glow, 0.5);
          }
          const fill = fillOf(g, s);
          if (fill) paint(g, p, fill, { d: s.depth, shade: s.grad ? false : undefined, lw: 1.6 });
          if (s.stroke) {
            g.lineJoin = MT.ROUND;
            g.lineCap = MT.ROUND;
            g.strokeStyle = s.stroke;
            g.lineWidth = s.sw || 3;
            g.stroke(p);
          }
        }
      }
      g.restore();
    }
  };
  const tone = (col, tp) => (tp && tp.night && C && C.shade ? C.shade(col, -0.42) : col);
  const registerAsset = (def) => {
    const draw = (g, o) => drawShapes(g, def.shapes, o || {});
    const extra = { tags: [MT.DESIGN].concat(def.tags || []), params: def.params, designed: true, place: def.place, mountY: def.mountY };
    if (def.lights && def.lights.length) extra.lights = (o) => def.lights.filter((l) => !l.if || (o && o[l.if])).map((l) => ({ type: MT.GLOW, x: l.x, y: l.y, r: l.r, color: l.color, alpha: 0.5 }));
    T.NEW(def.id, def.name, def.category, def.size, draw, extra);
    if (def.afford && ME.INTERACT) ME.INTERACT.AFFORD[def.id] = def.afford;
    if (def.holdable && ME.HOLDABLE) ME.HOLDABLE[def.id] = null;
  };
  const registerEnv = (def) => {
    const interior = def.category === MT.INTERIOR;
    const layers = def.layers.map((L, li) => ({
      depth: L.depth,
      blur: L.blur,
      draw: (g, x0, x1, tp, p) => {
        if (li === 0 && def.wall) {
          const w = def.wall;
          paint(g, rect(x0 - 10, w.top, x1 - x0 + 20, -w.top), tone(w.color, interior ? null : tp), { d: 0, ink: false });
          if (w.trim) paint(g, rect(x0 - 10, w.top, x1 - x0 + 20, 26), tone(w.trim, interior ? null : tp), { d: 2, ink: false });
          if (w.base) paint(g, rect(x0 - 10, -34, x1 - x0 + 20, 34), tone(w.base, interior ? null : tp), { d: 2, ink: false });
        }
        for (const e of L.elements) {
          const xs = [];
          if (e.every) for (let x = Math.floor((x0 - e.x) / e.every) * e.every + e.x; x < x1 + e.every; x += e.every) xs.push(x);
          else xs.push(e.x);
          for (const x of xs) {
            if (x < x0 - 1500 || x > x1 + 1500) continue;
            if (e.skip && e.skip.some((r) => x >= r[0] && x <= r[1])) continue;
            g.save();
            g.translate(x, e.y);
            if (e.asset) ME.drawAsset(g, e.asset, 0, 0, { night: !!(tp && tp.night) }, e.scale);
            if (e.shapes.length) {
              if (e.scale !== 1) g.scale(e.scale, e.scale);
              drawShapes(g, e.shapes, { night: !!(tp && tp.night), t: p && p.t });
            }
            g.restore();
          }
        }
      },
    }));
    const env = {
      name: def.name,
      category: def.category,
      time: def.time,
      width: def.width,
      tags: [MT.DESIGN].concat(def.tags || []),
      layers,
      designed: true,
      ground: (g, x0, x1, tp, H) => {
        const col = interior ? def.floor.color : tone(def.floor.color, tp);
        const gr = g.createLinearGradient(0, -150, 0, H * 0.6);
        gr.addColorStop(0, C.shade(col, -0.06));
        gr.addColorStop(0.3, C.shade(col, 0.05));
        gr.addColorStop(1, C.shade(col, -0.32));
        g.fillStyle = gr;
        g.fillRect(x0 - 10, -150, x1 - x0 + 20, H + 160);
        if (def.floor.tile) {
          g.strokeStyle = def.floor.line || MT.RGBA_0_0_0_0_14;
          g.lineWidth = 2;
          for (let x = Math.floor(x0 / def.floor.tile) * def.floor.tile; x < x1; x += def.floor.tile) {
            g.beginPath();
            g.moveTo(x, -150);
            g.lineTo(x + (x - (x0 + x1) / 2) * 0.35, H);
            g.stroke();
          }
        }
      },
      props: () => def.props.map((p) => Object.assign({}, p)),
    };
    if (interior)
      env.sky = (g, W, H) => {
        g.fillStyle = MT.VALUE_0C0B0A;
        g.fillRect(0, 0, W, H);
      };
    else if (def.sky && def.sky.top)
      env.sky = (g, W, H, tp) => {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, tone(def.sky.top, tp));
        gr.addColorStop(1, tone(def.sky.bottom || def.sky.top, tp));
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      };
    if (def.staging) env.staging = def.staging;
    ME.registerEnvironment(def.id, env);
  };
  const registerDesigned = (list) => {
    const out = [];
    for (const raw of Array.isArray(list) ? list : [list]) {
      const v = validateDesign(raw);
      if (!v.ok) continue;
      if (ME.registry.assets[v.def.id] && !ME.registry.assets[v.def.id].designed && v.def.kind === MT.ASSET) continue;
      if (ME.registry.environments[v.def.id] && !ME.registry.environments[v.def.id].designed && v.def.kind === MT.ENV) continue;
      try {
        if (v.def.kind === MT.ENV) {
          for (const a of v.def.assets || []) if (!ME.registry.assets[a.id] || ME.registry.assets[a.id].designed) registerAsset(a);
          registerEnv(v.def);
        } else registerAsset(v.def);
        out.push(v.def.id);
      } catch (e) {
        void e;
      }
    }
    return out;
  };
  ME.validateDesign = validateDesign;
  ME.registerDesigned = registerDesigned;
  ME.registerEnvironment(MT.DESIGN_STUDIO, {
    name: MT.DESIGN_STUDIO_2,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 2400,
    hidden: true,
    sky: (g, W, H) => {
      g.fillStyle = MT.E9E4DA;
      g.fillRect(0, 0, W, H);
    },
    layers: [
      {
        depth: 1,
        draw: (g, x0, x1) => {
          const gr = g.createLinearGradient(0, -900, 0, 0);
          gr.addColorStop(0, MT.F1ECE2);
          gr.addColorStop(1, MT.D9D2C4);
          g.fillStyle = gr;
          g.fillRect(x0 - 10, -900, x1 - x0 + 20, 900);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      g.fillStyle = MT.C9C1B2;
      g.fillRect(x0 - 10, -150, x1 - x0 + 20, H + 160);
    },
  });
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
