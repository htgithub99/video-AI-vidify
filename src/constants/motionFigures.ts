export const MOTION_FIGURES = {
  ATTR: "data-motion-figures",
  STYLES: {
    outline: { ink: "#26201c", inkWidth: 1.25, tone: { col: [192, 136, 80], k: 0.06, sat: 1.08, light: 0.02 } },
    sketch: { ink: "#16172a", inkWidth: 0.85, tone: { col: [58, 64, 88], k: 0.2, sat: 0.72, light: 0 } },
    stick: { ink: "#2a1f1c", inkWidth: 1.15, tone: { col: [118, 104, 150], k: 0.05, sat: 1.1, light: 0.01, split: { shadow: [70, 60, 130], highlight: [250, 226, 182], k: 0.32 } } },
    comic: { ink: "#15140f", inkWidth: 1.3, tone: { col: [90, 90, 58], k: 0.12, sat: 0.8, light: -0.02 }, finish: "grain" },
    cutout: { ink: "#2b2622", inkWidth: 0.8, tone: { col: [74, 74, 64], k: 0.08, sat: 0.92, light: 0 } },
    horror: { ink: "#1c1a18", inkWidth: 1.2, tone: { col: [60, 70, 80], k: 0.3, sat: 0.45, light: -0.06 }, finish: "vignette", darkCard: true },
  } as Record<string, { ink: string; inkWidth: number; tone: { col: number[]; k: number; sat: number; light: number; split?: { shadow: number[]; highlight: number[]; k: number } }; finish?: string; darkCard?: boolean }>,
  RENDER_REVISION: 9,
  KIT_HOOK:
    "(function(){var v=window.motionScene;var wrap=function(x){if(x&&typeof x.renderAt==='function'&&!x.__motionKit){var f=x.renderAt;x.renderAt=function(i){var K=window.MotionKit,self=this,args=arguments;var go=function(){K.time(i&&typeof i.time==='number'?i.time:0);return f.apply(self,args)};return K.fontsLoaded()?go():K.fontsReady.then(go)};x.__motionKit=true}return x};Object.defineProperty(window,'motionScene',{configurable:true,get:function(){return v},set:function(x){v=wrap(x)}});wrap(v)})();",
  VIEW: `(function () {
  var cfg = window.__motionView || {}, S = cfg.style || null, CUTOUT = cfg.movement === 'cutout';
  var FOCUS = Array.isArray(cfg.focus) ? cfg.focus.map(String) : [];
  var hooks = window.__motionViewHooks = { kit: 0, screen: 0, header: null, speak: null, person: function () {} };
  hooks.speaking = function (o) {
    var sp = hooks.speak;
    if (!sp || !sp.list.length) return false;
    var ids = [o.mark, o.id, o.cast, o.who].filter(function (v) { return v != null; }).map(String);
    return ids.length > 0 && sp.list.some(function (s) { return s && ids.indexOf(String(s.entityId)) >= 0 && sp.t >= +s.start && sp.t < +s.end; });
  };
  if (typeof CanvasRenderingContext2D === 'undefined') return;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var proto = CanvasRenderingContext2D.prototype, Grad = window.CanvasGradient && CanvasGradient.prototype;
  var native = { setTransform: proto.setTransform, resetTransform: proto.resetTransform, stroke: proto.stroke, strokeRect: proto.strokeRect, addColorStop: Grad && Grad.addColorStop };
  var desc = {};
  ['fillStyle', 'strokeStyle', 'shadowColor'].forEach(function (name) { desc[name] = Object.getOwnPropertyDescriptor(proto, name); });
  var active = false, zoom = 1, M = null, recording = false, seen = [];
  var isScene = function (c) { return !!c && !!c.canvas && c.canvas.id === 'motion-canvas'; };
  var parsed = new Map(), toned = new Map(), scratch = null;
  var rgba = function (v) {
    if (typeof v !== 'string') return null;
    if (parsed.has(v)) return parsed.get(v);
    if (parsed.size > 4000) parsed.clear();
    scratch = scratch || document.createElement('canvas').getContext('2d');
    desc.fillStyle.set.call(scratch, '#000'); desc.fillStyle.set.call(scratch, v);
    var s = desc.fillStyle.get.call(scratch), out = null;
    if (s[0] === '#') out = [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
    else { var m = s.match(/[\\d.]+/g); if (m && m.length >= 3) out = [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]]; }
    parsed.set(v, out);
    return out;
  };
  var luma = function (c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  var hsl = function (r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0; if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
  var rgb = function (h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; var f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; };
  var tone = function (v) {
    if (typeof v !== 'string') return v;
    if (toned.has(v)) return toned.get(v);
    if (toned.size > 4000) toned.clear();
    var c = rgba(v), out = v;
    if (c) {
      var t = S.tone, r = c[0] + (t.col[0] - c[0]) * t.k, g = c[1] + (t.col[1] - c[1]) * t.k, b = c[2] + (t.col[2] - c[2]) * t.k;
      if (t.split) { var L = luma([r, g, b]), ws = t.split.k * Math.pow(1 - L, 1.5), wh = t.split.k * Math.pow(L, 1.5), sh = t.split.shadow, hi = t.split.highlight; r += (sh[0] - r) * ws + (hi[0] - r) * wh; g += (sh[1] - g) * ws + (hi[1] - g) * wh; b += (sh[2] - b) * ws + (hi[2] - b) * wh; }
      var x = hsl(r, g, b), o = rgb(x[0], clamp(x[1] * t.sat, 0, 1), clamp(x[2] + t.light, 0, 1));
      out = 'rgba(' + Math.round(o[0]) + ',' + Math.round(o[1]) + ',' + Math.round(o[2]) + ',' + c[3] + ')';
    }
    toned.set(v, out);
    return out;
  };
  var styling = function (c) { return !!S && active && !hooks.kit && isScene(c); };
  var stored = new WeakMap();
  if (S) {
    ['fillStyle', 'strokeStyle', 'shadowColor'].forEach(function (name) {
      var d = desc[name];
      Object.defineProperty(proto, name, {
        configurable: true,
        get: function () { var m = stored.get(this); return m && Object.prototype.hasOwnProperty.call(m, name) ? m[name] : d.get.call(this); },
        set: function (v) {
          var m = stored.get(this);
          if (styling(this)) { if (!m) stored.set(this, (m = {})); m[name] = v; d.set.call(this, tone(v)); }
          else { if (m) delete m[name]; d.set.call(this, v); }
        },
      });
    });
    if (Grad && native.addColorStop) Grad.addColorStop = function (at, color) { return native.addColorStop.call(this, at, S && active && !hooks.kit ? tone(color) : color); };
  }
  var rawStroke = function (c) { var m = stored.get(c); return m && Object.prototype.hasOwnProperty.call(m, 'strokeStyle') ? m.strokeStyle : desc.strokeStyle.get.call(c); };
  var inked = function (c, fn, args) {
    if (!active || !isScene(c)) return fn.apply(c, args);
    var lw = c.lineWidth, col = lw <= 6 ? rgba(rawStroke(c)) : null;
    if (!col || luma(col) >= 0.3) return fn.apply(c, args);
    var ink = styling(c);
    if (!ink && zoom === 1) return fn.apply(c, args);
    var keepStyle = desc.strokeStyle.get.call(c), keepAlpha = c.globalAlpha;
    if (ink) { desc.strokeStyle.set.call(c, S.ink); c.globalAlpha = keepAlpha * col[3]; }
    c.lineWidth = (lw * (ink ? S.inkWidth : 1)) / Math.sqrt(zoom);
    try { return fn.apply(c, args); } finally { c.lineWidth = lw; desc.strokeStyle.set.call(c, keepStyle); c.globalAlpha = keepAlpha; }
  };
  proto.stroke = function () { return inked(this, native.stroke, arguments); };
  proto.strokeRect = function () { return inked(this, native.strokeRect, arguments); };
  var put = function (c) { if (M) native.setTransform.call(c, M.a, M.b, M.c, M.d, M.e, M.f); };
  proto.setTransform = function (a, b, c, d, e, f) {
    if (!M || hooks.kit || hooks.screen || !isScene(this)) return native.setTransform.apply(this, arguments);
    var m = !arguments.length ? new DOMMatrix() : typeof a === 'object' && a ? new DOMMatrix([a.a != null ? a.a : a.m11 != null ? a.m11 : 1, a.b != null ? a.b : a.m12 || 0, a.c != null ? a.c : a.m21 || 0, a.d != null ? a.d : a.m22 != null ? a.m22 : 1, a.e != null ? a.e : a.m41 || 0, a.f != null ? a.f : a.m42 || 0]) : new DOMMatrix([a, b, c, d, e, f]);
    var r = M.multiply(m);
    return native.setTransform.call(this, r.a, r.b, r.c, r.d, r.e, r.f);
  };
  proto.resetTransform = function () { if (!M || hooks.kit || hooks.screen || !isScene(this)) return native.resetTransform.call(this); put(this); };
  ['width', 'height'].forEach(function (name) {
    var d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name);
    if (!d || !d.set) return;
    Object.defineProperty(HTMLCanvasElement.prototype, name, { configurable: true, get: d.get, set: function (v) { d.set.call(this, v); if (M && this.id === 'motion-canvas') put(this.getContext('2d')); } });
  });
  hooks.person = function (c, o, res, byKit) {
    if (!recording || !isScene(c)) return;
    var x = +o.x, y = +o.y, h = +o.h;
    if (!isFinite(x) || !isFinite(y) || !(h > 0)) return;
    var t = c.getTransform(), W = c.canvas.width, H = c.canvas.height;
    var at = function (px, py) { return [(t.a * px + t.c * py + t.e) / W, (t.b * px + t.d * py + t.f) / H]; };
    var foot = at(x, y), top = at(x, y - h)[1], span = foot[1] - top;
    if (!(span > 0)) return;
    var eye = isFinite(+res.eye) ? +res.eye : byKit && Array.isArray(res.head) && isFinite(+res.head[1]) ? +res.head[1] - 0.03 * h : y - 0.78 * h;
    var hip = isFinite(+res.hip) ? +res.hip : y - 0.42 * h;
    eye = clamp(at(x, eye)[1], top + 0.04 * span, foot[1] - 0.5 * span);
    hip = clamp(at(x, hip)[1], eye + 0.1 * span, foot[1] - 0.2 * span);
    var wide = Math.max(+o.w > 0 ? +o.w : 0, 0.5 * h), half = Math.abs(at(x + wide / 2, y)[0] - at(x - wide / 2, y)[0]) / 2;
    seen.push({ id: o.mark == null ? null : String(o.mark), x: foot[0], half: half, foot: foot[1], top: top, eye: eye, hip: hip, facing: +o.facing < 0 ? -1 : 1 });
  };
  var LAYOUT = cfg.layout || 'wide', INTENT = cfg.scene || {};
  var PAIRS = Array.isArray(cfg.pairs) ? cfg.pairs : [];
  var SAFE = 0.93, SMOOTH = 3;
  var PLAN = { SAMPLES: 24, MIN_SHOT: 1.8, LONG_SHOT: 7, PUSH: 0.08, PUSH_SECONDS: 1.2, DRIFT: 0.03, MIN_STEP: 1.18, TRAVEL: 0.15, QUIET_SECONDS: 8, QUIET_PUSH: 0.07, QUIET_TRAVEL: 0.03, REFRAME: 0.16, REFRAME_PUSH: 0.04 };
  var ZMAX = { full: 10, cowboy: 10, medium: 10, mcu: 10 };
  var THING_FILL = { full: 0.8, cowboy: 0.86, medium: 0.92, mcu: 1.1 };
  var frameThing = function (b, size, group) {
    var fill = group ? THING_FILL.full : THING_FILL[size] || THING_FILL.full;
    var z = clamp(fill / Math.max(1e-6, b.w, b.h), 1, ZMAX[size] || 1), half = 0.5 / z;
    return { z: z, x: clamp(b.x + b.w / 2, half, 1 - half), y: clamp(b.y + b.h / 2, half, 1 - half) };
  };
  var CUT = { full: 1, cowboy: 0.76, medium: 0.6, mcu: 0.44 }, HEADROOM = { full: 0.1, cowboy: 0.06, medium: 0.06, mcu: 0.05 }, FOOTROOM = 0.06;
  var SEQUENCE = { wide: ['wide'], stage: ['full'], medium: ['full', 'cowboy'], cinematic: ['wide', 'medium', 'mcu', 'medium', 'mcu'], close: ['medium', 'mcu'] };
  var min = function (list, key) { return Math.min.apply(null, list.map(function (p) { return p[key]; })); };
  var max = function (list, key) { return Math.max.apply(null, list.map(function (p) { return p[key]; })); };
  var frameFor = function (people, size) {
    var top = min(people, 'top'), cut = Math.max.apply(null, people.map(function (p) { return p.top + CUT[size] * (p.foot - p.top); })) + (size === 'full' ? FOOTROOM * (max(people, 'foot') - top) : 0);
    var z = clamp((1 - HEADROOM[size]) / Math.max(1e-6, cut - top), 1, ZMAX[size] || 1);
    var viewTop = top - HEADROOM[size] / z;
    var left = min(people.map(function (p) { return { v: p.x - p.half }; }), 'v'), right = max(people.map(function (p) { return { v: p.x + p.half }; }), 'v');
    var cx = people.length === 1 ? people[0].x + (people[0].facing * (1 / 6)) / z : (left + right) / 2;
    var half = 0.5 / z;
    return { z: z, x: clamp(cx, half, 1 - half), y: clamp(viewTop + half, half, 1 - half) };
  };
  var measurePlan = async function (render, self, input) {
    var marks = window.__motionMarks, kept = Array.isArray(marks) ? marks.length : 0, frames = [], thingFrames = [];
    var duration = Number(input.duration) > 0 ? Number(input.duration) : 3, fps = Number(input.fps) > 0 ? Number(input.fps) : 30;
    recording = true;
    var pc = document.getElementById('motion-canvas'), pctx = pc && pc.getContext('2d');
    try {
      for (var i = 0; i <= PLAN.SAMPLES; i++) {
        seen = [];
        var k = i / PLAN.SAMPLES;
        if (pctx) { proto.save.call(pctx); native.setTransform.call(pctx, 1, 0, 0, 1, 0, 0); proto.beginPath.call(pctx); proto.rect.call(pctx, 0, 0, 1, 1); proto.clip.call(pctx); }
        var markStart = Array.isArray(window.__motionMarks) ? window.__motionMarks.length : 0;
        try { await render.call(self, Object.assign({}, input, { progress: k, time: k * duration, frame: Math.round(k * duration * fps) })); } finally { if (pctx) proto.restore.call(pctx); }
        frames.push(seen.filter(function (p) { return p.id !== null; }));
        var mk = Array.isArray(window.__motionMarks) ? window.__motionMarks.slice(markStart) : [];
        var cw = pc ? pc.width : 1280, ch = pc ? pc.height : 720;
        mk = mk.map(function (q) { return q.x > 1.5 || q.y > 1.5 || q.w > 1.5 || q.h > 1.5 ? { id: q.id, x: q.x / cw, y: q.y / ch, w: q.w / cw, h: q.h / ch } : q; });
        thingFrames.push(mk.filter(function (q) { return FOCUS.indexOf(String(q.id)) >= 0; }).reduce(function (b, q) { return b ? { x: Math.min(b.x, q.x), y: Math.min(b.y, q.y), w: Math.max(b.x + b.w, q.x + q.w) - Math.min(b.x, q.x), h: Math.max(b.y + b.h, q.y + q.h) - Math.min(b.y, q.y) } : { x: q.x, y: q.y, w: q.w, h: q.h }; }, null));
      }
    } finally { recording = false; seen = []; hooks.header = null; if (Array.isArray(marks)) marks.length = kept; }
    var size = {}, group = {}, height = {}, ground = {};
    frames.forEach(function (f) {
      var count = {};
      f.forEach(function (p) { count[p.id] = (count[p.id] || 0) + 1; size[p.id] = (size[p.id] || 0) + (p.foot - p.top); (height[p.id] = height[p.id] || []).push(p.foot - p.top); (ground[p.id] = ground[p.id] || []).push(p.foot); });
      Object.keys(count).forEach(function (id) { if (count[id] > 1) group[id] = true; });
    });
    var median = function (list) { var s = list.slice().sort(function (a, b) { return a - b; }); return s[s.length >> 1]; };
    var norm = function (v) { return String(v).toLowerCase().replace(/[^a-z0-9]+/g, ''); };
    var ids = Object.keys(size).filter(function (id) { return !group[id]; }).sort(function (a, b) { var fa = FOCUS.indexOf(a), fb = FOCUS.indexOf(b); if ((fa >= 0) !== (fb >= 0)) return fa >= 0 ? -1 : 1; return size[b] - size[a]; });
    var lead = ids[0] || null;
    var pairedWith = function (a, b) { return PAIRS.some(function (p) { return (norm(p[0]) === norm(a) && norm(p[1]) === norm(b)) || (norm(p[1]) === norm(a) && norm(p[0]) === norm(b)); }); };
    var partner = lead ? ids.slice(1).filter(function (id) { return pairedWith(lead, id); })[0] || ids.slice(1).filter(function (id) { var r = median(height[id]) / median(height[lead]); return r > 0.8 && r < 1.25 && Math.abs(median(ground[id]) - median(ground[lead])) < 0.06; })[0] : null;
    var at = function (n, id) { return frames[n].filter(function (p) { return p.id === id; })[0] || null; };
    var focusThing = FOCUS.length > 0 && !(FOCUS[0] in size) && thingFrames.some(Boolean);
    if (focusThing) { lead = null; partner = null; }
    var groupId = !lead && !focusThing ? Object.keys(group).sort(function (a, b) { return size[b] - size[a]; })[0] || null : null;
    var boxAt = function (n) {
      if (focusThing) return thingFrames[n];
      if (!groupId) return null;
      var ms = frames[n].filter(function (p) { return p.id === groupId; });
      if (!ms.length) return null;
      var x0 = min(ms.map(function (p) { return { v: p.x - p.half }; }), 'v'), x1 = max(ms.map(function (p) { return { v: p.x + p.half }; }), 'v'), y0 = min(ms, 'top'), y1 = max(ms, 'foot');
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };
    var layout = LAYOUT;
    if (layout === 'auto') {
      var first = lead ? frames.map(function (f, n) { return at(n, lead); }).filter(Boolean) : frames.map(function (f, n) { var b = boxAt(n); return b && { x: b.x + b.w / 2 }; }).filter(Boolean);
      var travels = first.length > 1 && Math.abs(first[first.length - 1].x - first[0].x) > PLAN.TRAVEL;
      var shot = String(INTENT.shot || '').toLowerCase(), kind = String(INTENT.kind || '').toLowerCase();
      layout = kind === 'map' || /establish|wide|overhead|aerial|extreme/.test(shot) ? 'wide' : /close/.test(shot) ? 'close' : travels ? 'medium' : 'cinematic';
    }
    if (String(INTENT.kind || '').toLowerCase() === 'map' || (!lead && !focusThing && !groupId)) layout = 'wide';
    var cues = (Array.isArray(input.cues) ? input.cues : []).map(Number).filter(function (v) { return isFinite(v) && v > 0.02 && v < 0.98; }).sort(function (a, b) { return a - b; });
    var cuts = [0];
    cues.forEach(function (v) { if ((v - cuts[cuts.length - 1]) * duration >= PLAN.MIN_SHOT && (1 - v) * duration >= PLAN.MIN_SHOT) cuts.push(v); });
    cuts.push(1);
    if (layout === 'cinematic') for (var c = 0; c + 1 < cuts.length; c++) if ((cuts[c + 1] - cuts[c]) * duration > PLAN.LONG_SHOT) { cuts.splice(c + 1, 0, (cuts[c] + cuts[c + 1]) / 2); c++; }
    if (layout === 'wide' || layout === 'stage') cuts = [0, 1];
    var seq = SEQUENCE[layout] || SEQUENCE.wide;
    var shots = [];
    for (var s = 0; s + 1 < cuts.length; s++) {
      var a = cuts[s], b = cuts[s + 1], lo = Math.round(a * PLAN.SAMPLES), hi = Math.round(b * PLAN.SAMPLES);
      var sz = seq[Math.min(s, seq.length - 1)];
      if (layout === 'cinematic' && s >= seq.length) sz = seq[seq.length - 2 + ((s - seq.length) % 2)];
      var shotInfo = { a: a, b: b, size: sz, z: 1, pts: [] };
      if (sz !== 'wide') {
        for (var n = lo; n <= hi; n++) {
          if (!lead) { var tb = boxAt(n); if (tb) { var ft = frameThing(tb, sz, !!groupId); shotInfo.pts.push({ n: n, x: ft.x, y: ft.y, z: ft.z }); } continue; }
          var ps = [at(n, lead)], q = partner && at(n, partner);
          if (q) ps.push(q);
          ps = ps.filter(Boolean);
          if (!ps.length) continue;
          var fr = frameFor(ps, sz);
          if (ps.length > 1 && (max(ps.map(function (p) { return { v: p.x + p.half }; }), 'v') - min(ps.map(function (p) { return { v: p.x - p.half }; }), 'v') + 0.04) * fr.z > SAFE) fr = frameFor([ps[0]], sz);
          shotInfo.pts.push({ n: n, x: fr.x, y: fr.y, z: fr.z });
        }
        if (shotInfo.pts.length) {
          var zs = shotInfo.pts.map(function (p) { return p.z; }).sort(function (u, v) { return u - v; });
          shotInfo.z = zs[zs.length >> 1];
        }
      }
      var prev = shots[shots.length - 1];
      if (prev && Math.max(prev.z, shotInfo.z) / Math.max(1e-6, Math.min(prev.z, shotInfo.z)) < PLAN.MIN_STEP) { prev.b = b; prev.pts = prev.pts.concat(shotInfo.pts); continue; }
      shots.push(shotInfo);
    }
    shots.forEach(function (sh) {
      if (sh.z <= 1.001 || !sh.pts.length) { sh.z = 1; sh.path = null; return; }
      var half = 0.5 / sh.z, pts = sh.pts.map(function (p) { return { x: clamp(p.x, half, 1 - half), y: clamp(p.y - 0.5 / p.z + half, half, 1 - half) }; });
      if (CUTOUT) { var p0 = pts[0], p1 = pts[pts.length - 1], still = Math.abs(p1.x - p0.x) < PLAN.TRAVEL / 3; sh.path = still ? [{ x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }] : [p0, p1]; return; }
      sh.path = pts.map(function (p, i) { var w = 0, sx = 0, sy = 0; for (var q = -SMOOTH; q <= SMOOTH; q++) { var r = pts[clamp(i + q, 0, pts.length - 1)], g = SMOOTH + 1 - Math.abs(q); w += g; sx += r.x * g; sy += r.y * g; } return { x: sx / w, y: sy / w }; });
    });
    var leadPts = lead ? frames.map(function (f, n) { return at(n, lead); }) : [];
    var anchor = leadPts.filter(Boolean)[0], box0 = !lead ? thingFrames.map(function (b, n) { return boxAt(n); }).filter(Boolean)[0] : null;
    var xs = leadPts.filter(Boolean).map(function (q) { return q.x; }), quiet = duration > PLAN.QUIET_SECONDS && (!xs.length || Math.max.apply(null, xs) - Math.min.apply(null, xs) < PLAN.QUIET_TRAVEL);
    var reframe = +((cfg.scene || {}).vary || 0) >= 2;
    return { layout: layout, quiet: quiet, reframe: reframe, shots: shots, duration: duration, subjects: [lead, partner, focusThing ? FOCUS[0] : groupId].filter(Boolean), lead: anchor ? { x: anchor.x, y: (anchor.top + anchor.foot) / 2 } : box0 ? { x: box0.x + box0.w / 2, y: box0.y + box0.h / 2 } : null };
  };
  var ease = function (s) { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };
  var shotAt = function (plan, progress) {
    var p = clamp(progress, 0, 1), shot = plan.shots[plan.shots.length - 1];
    for (var i = 0; i < plan.shots.length; i++) if (p < plan.shots[i].b) { shot = plan.shots[i]; break; }
    var u = clamp((p - shot.a) / Math.max(1e-6, shot.b - shot.a), 0, 1), local = (p - shot.a) * plan.duration;
    if (shot.z <= 1.001) {
      if (plan.reframe && plan.lead) { var zr = 1 + PLAN.REFRAME + PLAN.REFRAME_PUSH * ease(u), hr = 0.5 / zr; return { z: zr, x: clamp(plan.lead.x, hr, 1 - hr), y: clamp(plan.lead.y, hr, 1 - hr) }; }
      if (plan.quiet) { var zq = 1 + PLAN.QUIET_PUSH * ease(u), hq = 0.5 / zq, cq = plan.lead || { x: 0.5, y: 0.5 }; return { z: zq, x: clamp(0.5 + (cq.x - 0.5) * (zq - 1) * 6, hq, 1 - hq), y: clamp(0.5 + (cq.y - 0.5) * (zq - 1) * 6, hq, 1 - hq) }; }
      if (CUTOUT || plan.layout !== 'wide' || !plan.lead) return { z: 1, x: 0.5, y: 0.5 };
      var zd = 1 + PLAN.DRIFT * ease(u), hd = 0.5 / zd;
      return { z: zd, x: clamp(0.5 + (plan.lead.x - 0.5) * (zd - 1) * 8, hd, 1 - hd), y: clamp(0.5 + (plan.lead.y - 0.5) * (zd - 1) * 8, hd, 1 - hd) };
    }
    var k = CUTOUT ? 1 + PLAN.PUSH * ease(local / PLAN.PUSH_SECONDS) : 1 + PLAN.PUSH * ease(u);
    var path = shot.path || [{ x: 0.5, y: 0.5 }], f = u * (path.length - 1), j = Math.floor(f), t = f - j, pa = path[j], pb = path[Math.min(j + 1, path.length - 1)];
    var z = shot.z * k, half = 0.5 / z;
    return { z: z, x: clamp(pa.x + (pb.x - pa.x) * t, half, 1 - half), y: clamp(pa.y + (pb.y - pa.y) * t, half, 1 - half) };
  };
  var grain = null;
  var finish = function (c, W, H) {
    if (!S || !S.finish) return;
    c.save();
    if (S.finish === 'vignette') {
      var g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
      native.addColorStop.call(g, 0, 'rgba(10,10,16,0)'); native.addColorStop.call(g, 1, 'rgba(10,10,16,0.55)');
      desc.fillStyle.set.call(c, g); c.fillRect(0, 0, W, H);
      var mist = c.createLinearGradient(0, H * 0.55, 0, H);
      native.addColorStop.call(mist, 0, 'rgba(200,205,210,0)'); native.addColorStop.call(mist, 1, 'rgba(200,205,210,0.18)');
      desc.fillStyle.set.call(c, mist); c.fillRect(0, 0, W, H);
    }
    if (S.finish === 'grain') {
      if (!grain) {
        grain = document.createElement('canvas'); grain.width = grain.height = 128;
        var gc = grain.getContext('2d'), img = gc.createImageData(128, 128), seed = 1234567;
        for (var i = 0; i < img.data.length; i += 4) { seed = (seed * 1103515245 + 12345) % 2147483648; var v = 200 + (seed / 2147483648) * 55; img.data[i] = v; img.data[i + 1] = v * 0.97; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255; }
        gc.putImageData(img, 0, 0);
      }
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35;
      desc.fillStyle.set.call(c, c.createPattern(grain, 'repeat')); c.fillRect(0, 0, W, H);
    }
    c.restore();
  };
  var wrap = function (scene) {
    if (!scene || typeof scene.renderAt !== 'function' || scene.__motionView) return scene;
    var render = scene.renderAt, plans = new Map();
    scene.renderAt = async function (input) {
      var self = this, args = arguments, opt = input || {};
      var canvas = document.getElementById('motion-canvas'), ctx = canvas && canvas.getContext('2d');
      M = null; zoom = 1;
      var key = JSON.stringify([Number(opt.duration) || 0, Array.isArray(opt.cues) ? opt.cues : []]);
      if (!plans.has(key)) { var plan = null; try { plan = (await measurePlan(render, self, opt)) || null; } catch (e) { plan = null; } plans.set(key, plan); }
      var current = plans.get(key);
      hooks.plan = current;
      if (current && canvas && opt.cameraEnabled !== false) {
        var v = shotAt(current, Number(opt.progress) || 0), W = canvas.width, H = canvas.height;
        if (v.z > 1.0005) {
          zoom = v.z;
          M = new DOMMatrix().translate(W / 2, H / 2).scale(zoom).translate(-v.x * W, -v.y * H);
          put(ctx);
        }
      }
      hooks.header = null;
      hooks.speak = { t: Number(opt.time) || 0, list: Array.isArray(opt.speaking) ? opt.speaking : [] };
      active = true;
      window.__motionKitZoom = zoom;
      try { await render.apply(self, args); } finally { active = false; M = null; zoom = 1; window.__motionKitZoom = 1; }
      if (!ctx) return;
      native.setTransform.call(ctx, 1, 0, 0, 1, 0, 0);
      finish(ctx, canvas.width, canvas.height);
      if (hooks.header) window.MotionFigures.header(ctx, hooks.header, S && S.darkCard, CUTOUT ? { time: isFinite(+opt.headerTime) ? +opt.headerTime : Number(opt.time) || 0 } : null);
      var dip = clamp(Number(opt.dip) || 0, 0, 1);
      if (dip > 0) { ctx.save(); ctx.globalAlpha = dip; desc.fillStyle.set.call(ctx, '#000'); ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }
      hooks.header = null;
    };
    scene.__motionView = true;
    return scene;
  };
  var before = Object.getOwnPropertyDescriptor(window, 'motionScene'), value = window.motionScene;
  Object.defineProperty(window, 'motionScene', {
    configurable: true,
    get: function () { return value; },
    set: function (x) { if (before && before.set) { before.set.call(window, x); x = before.get.call(window); } value = wrap(x); },
  });
  if (value) value = wrap(before && before.get ? before.get.call(window) : value);
})();`,
  SCRIPT: `(function () {
  if (window.MotionFigures) return;
  var num = function (v, d) { return typeof v === 'number' && isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var LOOK = ['top', 'trim', 'pants', 'boots', 'belt', 'sleeve', 'robe', 'cape', 'armor', 'emblem', 'emblemColor', 'build', 'skin', 'hair', 'hairColor', 'beard', 'head', 'headColor', 'crest', 'hold', 'itemColor', 'shield', 'shieldColor', 'quiver', 'backpack', 'sword', 'barefoot', 'wounded', 'outfit', 'region', 'bandage', 'tied', 'wet', 'dirty'];
  var SPAN_WALLS = ['wall', 'gate', 'barbedWire'];
  var ROW_WALLS = ['fence', 'wagonFort', 'palisade', 'sandbags'];
  var STRETCH_MIN = 0.8, STRETCH_MAX = 1.25;
  var speakingNow = function (o) { var v = window.__motionViewHooks; return !!(v && v.speaking && v.speaking(o)); };
  var seedOf = function (o) { if (o.seed != null) return o.seed; var s = String(o.mark == null ? '' : o.mark), h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return s ? h : undefined; };
  var kit = function () { return window.MotionKit || null; };
  var LOOK_WORD = /^(black|blackened|dark|dirty|soot|sooty|burnt|burned|charred|blistered|bloody|blood|red|color|colour|tint|stained|muddy)$/;
  var HAND_WORD = /^(hand|hands|palm|palms|fist|fists|finger|fingers)$/;
  var wordsOf = function (key) { return key.split(/(?=[A-Z])|[_\\d]+/).map(function (word) { return word.toLowerCase(); }); };
  var handLook = function (o) {
    if (o.gloves || o.mitten) return null;
    for (var key in o) {
      var words = wordsOf(key), v = o[key];
      if (!v || !words.some(function (w) { return HAND_WORD.test(w); }) || !words.some(function (w) { return LOOK_WORD.test(w); })) continue;
      if (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)) return v;
      return words.some(function (w) { return /^(bloody|blood|red)$/.test(w); }) ? '#8a2a22' : words.some(function (w) { return /^(muddy|dirty|stained)$/.test(w); }) ? '#6a5442' : '#3a2c26';
    }
    return null;
  };
  var VOCAB = window.__motionVocab || null;
  var plain = function (v) { return String(v == null ? '' : v).toLowerCase().replace(/[^a-z]/g, ''); };
  var stems = function (w) {
    var out = [w];
    [['ing', ''], ['ing', 'e'], ['ed', ''], ['ed', 'e'], ['es', ''], ['s', '']].forEach(function (p) {
      if (w.length <= p[0].length + 2 || w.slice(-p[0].length) !== p[0]) return;
      var b = w.slice(0, -p[0].length);
      out.push(b + p[1]);
      if (b.length > 2 && b[b.length - 1] === b[b.length - 2]) out.push(b.slice(0, -1));
    });
    return out;
  };
  var lowOf = function (spec, key) {
    spec.low = spec.low || {};
    if (!spec.low[key]) { var map = {}; spec.values[key].forEach(function (w) { map[plain(w)] = w; }); spec.low[key] = map; }
    return spec.low[key];
  };
  var wordIn = function (spec, key, v) {
    if (typeof v !== 'string') return undefined;
    var low = lowOf(spec, key), as = spec.valueAs[key] || {}, tries = stems(plain(v));
    for (var i = 0; i < tries.length; i++) {
      if (low[tries[i]]) return low[tries[i]];
      if (as[tries[i]] && low[plain(as[tries[i]])]) return low[plain(as[tries[i]])];
    }
    return undefined;
  };
  var HEX = /^#[0-9a-f]{3,8}$/i;
  var heldOf = new WeakMap();
  var dropped = function (fn, key) {
    var list = window.__motionMarks;
    if (!Array.isArray(list)) return;
    var id = '!fault:drop:' + fn + '.' + key;
    if (!list.some(function (m) { return m.id === id; })) list.push({ id: id, x: 0, y: 0, w: 0, h: 0 });
  };
  var handLookKey = function (key) { var words = wordsOf(key); return words.some(function (w) { return HAND_WORD.test(w); }) && words.some(function (w) { return LOOK_WORD.test(w); }); };
  var normalized = function (fn, o) {
    if (!VOCAB || !o || typeof o !== 'object') return o;
    var spec = VOCAB[fn];
    if (!spec) return o;
    var out = {};
    Object.keys(o).forEach(function (key) {
      var v = o[key];
      if (v === undefined) return;
      var to = spec.keys.indexOf(key) >= 0 ? key : spec.keyAs[plain(key)];
      if (!to && spec.holdPrefix) spec.holdPrefix.some(function (pre) { var k = plain(key); if (k.length > pre.length && k.slice(0, pre.length) === pre) { to = 'hold'; if (v === true) v = k.slice(pre.length); return true; } return false; });
      if (!to && spec.wordKeys && v) { var kw = wordsOf(key); Object.keys(spec.wordKeys).some(function (k) { if (kw.some(function (w) { return spec.wordKeys[k].indexOf(w) >= 0; })) { to = k; v = true; return true; } return false; }); }
      if (!to) { if (!(fn === 'person' && handLookKey(key))) dropped(fn, key); return; }
      if (spec.values[to]) {
        var word = wordIn(spec, to, v === true ? key : v);
        if (word === undefined && typeof v === 'string' && HEX.test(v) && to === 'head') { if (o.headColor == null) out.headColor = v; word = wordIn(spec, 'head', key); }
        if (word === undefined && typeof v === 'string' && HEX.test(v) && to === 'shield') { if (o.shieldColor == null) out.shieldColor = v; word = 'round'; }
        if (word === undefined && to === 'hold' && typeof v === 'string' && v.trim()) { heldOf.set(out, v.trim()); return; }
        if (word === undefined) { dropped(fn, key); return; }
        v = word;
      }
      if (to === 'robe' && v === true) v = o.top || '#6e4735';
      if (to === 'rider' && v && typeof v === 'object') v = normalized('person', v);
      if (out[to] === undefined || key === to) out[to] = v;
    });
    return out;
  };
  var LARGE_FNS = ['building', 'vehicle', 'tree', 'bridge', 'wall'], LARGE = 0.3;
  var markBox = function (c, o, box, fn) {
    if (!o || typeof window.motionMark !== 'function' || !box) return;
    var list = window.__motionMarks, big = LARGE_FNS.indexOf(fn) >= 0;
    if (o.mark == null && !big) return;
    var count = Array.isArray(list) ? list.length : 0;
    window.motionMark(c, o.mark == null ? '~' + fn + ':' + (o.kind || fn) : String(o.mark), box.x, box.y, box.w, box.h);
    if (!Array.isArray(list) || list.length <= count) return;
    var last = list[list.length - 1], look = {};
    if (big && last.h >= LARGE) last.large = true;
    if (o.mark == null) { if (!last.large) list.pop(); return; }
    LOOK.forEach(function (key) { if (o[key] != null) look[key] = o[key]; });
    last.src = 'fig';
    last.fn = fn;
    if (o.kind) last.kind = String(o.kind);
    if (fn === 'person' && Object.keys(look).length) last.look = look;
  };
  var boxOf = function (fn, o) {
    var h = num(+o.h, 0), w = num(+o.w, 0), x = num(+o.x, 0), y = num(+o.y, 0);
    if (fn === 'bridge' && Array.isArray(o.from) && Array.isArray(o.to)) return { x: Math.min(o.from[0], o.to[0]) - w / 2, y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]) + w, h: Math.abs(o.to[1] - o.from[1]) };
    if (fn === 'bridge') return { x: x - w / 2, y: y, w: w, h: h };
    if (fn === 'chart' || fn === 'meter' || fn === 'timeline') return { x: x, y: y, w: w, h: h };
    if (fn === 'icon') { var r = num(+o.r, 20); return { x: x - r, y: y - r, w: 2 * r, h: 2 * r }; }
    if (fn === 'arrow' && Array.isArray(o.from) && Array.isArray(o.to)) return { x: Math.min(o.from[0], o.to[0]), y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]), h: Math.abs(o.to[1] - o.from[1]) };
    if (!w && h) w = h * (BOX_ASPECT[fn] || 1);
    return { x: x - w / 2, y: y - h, w: w, h: h };
  };
  var BOX_ASPECT = { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1 };
  var sizes = {}, PROBE = 30, PAD = 1400, SOLID = 110, THIN = 0.12, probeCanvas = null;
  var painted = function (draw, ox, oy) {
    probeCanvas = probeCanvas || document.createElement('canvas');
    if (probeCanvas.width !== PAD) { probeCanvas.width = PAD; probeCanvas.height = PAD; }
    var c = probeCanvas.getContext('2d', { willReadFrequently: true });
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, PAD, PAD);
    try { draw(c); } catch (e) { return null; }
    var d = c.getImageData(0, 0, PAD, PAD).data, x0 = PAD, y0 = PAD, x1 = -1, y1 = -1, cols = new Uint16Array(PAD);
    for (var y = 0; y < PAD; y++) for (var x = 0; x < PAD; x++) if (d[(y * PAD + x) * 4 + 3] > SOLID) { cols[x]++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    var thin = Math.max(2, (y1 + 1 - y0) * THIN), b0 = x0, b1 = x1;
    while (b0 < b1 && cols[b0] < thin) b0++;
    while (b1 > b0 && cols[b1] < thin) b1--;
    return { left: ox - x0, right: x1 + 1 - ox, top: oy - y0, bottom: y1 + 1 - oy, bodyLeft: ox - b0, bodyRight: b1 + 1 - ox, edge: x0 <= 0 || y0 <= 0 || x1 >= PAD - 1 || y1 >= PAD - 1 };
  };
  var measure = function (K, fn, o, key) {
    var seed = o.seed != null ? o.seed : 1;
    var id = [K.style ? K.style() : '', K.proportion ? K.proportion() : '', fn, o.kind || '', o.view || '', o.build || '', fn === 'vehicle' ? o.pose || '' : '', o.count || '', o.rider ? 'rider' : '', o.cover === false ? 'bare' : '', o.load || '', fn === 'person' ? [o.cape ? 'cape' : '', o.robe ? 'robe' : '', o.armor || '', o.outfit || '', o.region || ''].join(',') : '', seed].join('|');
    if (sizes[id] !== undefined) return sizes[id];
    var probe = { kind: o.kind, view: o.view, build: o.build, count: o.count, cover: o.cover, load: o.load, x: PAD / 2, y: PAD - 100, seed: seed };
    if (fn === 'person' || fn === 'animal') probe.pose = 'stand';
    if (fn === 'vehicle' && o.pose) probe.pose = o.pose;
    if (fn === 'person') ['cape', 'robe', 'armor', 'outfit', 'region'].forEach(function (k) { if (o[k] != null) probe[k] = o[k]; });
    var size = PROBE, box = null;
    for (var tries = 0; tries < 4; tries++) {
      probe[key] = size;
      box = painted(function (c) { K[fn](c, probe); }, PAD / 2, PAD - 100);
      if (!box || !box.edge) break;
      size /= 2.5;
    }
    var body = box && fn !== 'person' && o.count == null, left = body ? box.bodyLeft : box && box.left, right = body ? box.bodyRight : box && box.right;
    sizes[id] = box && box.top > 0 && left + right > 0 ? { h: box.top / size, w: (left + right) / size, shift: (right - left) / 2 / size } : null;
    return sizes[id];
  };
  var turnOf = function (o) { var a = num(+o.angle, num(+o.rotation, 0)); return Math.abs(a) <= Math.PI * 2 ? a : 0; };
  var truthy = function (v) { return v === true || (typeof v === 'number' && v > 0) || (typeof v === 'string' && v !== '' && v !== 'false') || (Array.isArray(v) && v.length > 0); };
  var LONG = 3;
  var TURNED = ['overturned', 'upturned', 'capsized', 'toppled', 'flipped', 'upsideDown'];
  var upright = function (c, K, o, opt, unit, key, x, y, len, angle) {
    var size = len / unit.w, f = num(+o.facing, 1) < 0 ? -1 : 1, left = (unit.w / 2 - unit.shift) * size, turn = -Math.PI / 2 + angle;
    opt[key] = size; opt.x = left; opt.y = 0; opt.facing = 1;
    c.save();
    if (o.silhouette) c.filter = 'brightness(0.22) saturate(0.35)';
    c.translate(x, y); c.rotate(turn); if (f < 0) c.scale(1, -1);
    try { K.prop(c, opt); } finally { c.restore(); }
    var tip = [x + Math.cos(turn) * len, y + Math.sin(turn) * len], thick = unit.h * size;
    return { box: { x: Math.min(x, tip[0]) - thick / 2, y: Math.min(y, tip[1]) - thick / 2, w: Math.abs(tip[0] - x) + thick, h: Math.abs(tip[1] - y) + thick }, tip: tip };
  };
  var ELASTIC = [0.85, 1.3];
  var LIE_FLAT = 0.45;
  var SHAPE_FIT = [0.6, 3];
  var fitted = function (c, K, fn, o, key, extra, fit) {
    if (o.seed == null) o = Object.assign({}, o, { seed: seedOf(o) });
    var unit = measure(K, fn, o, key);
    if (!unit) return null;
    var h = num(+o.h, 0), w = num(+o.w, 0), x = num(+o.x, 0), y = num(+o.y, 0);
    if (!(h > 0)) return null;
    var opt = Object.assign({}, o, extra || {});
    delete opt.h; delete opt.w; delete opt.r; delete opt.p; delete opt.mark; delete opt.angle;
    var angle = fn === 'person' || fn === 'animal' ? 0 : turnOf(o);
    if (fn === 'prop' && fit !== 'ground' && fit !== 'rigid' && unit.w >= unit.h * LONG && !(w > h)) return upright(c, K, o, opt, unit, key, x, y, h, angle);
    if (fn === 'prop' && (fit === 'rigid' || fit === 'ground') && w > 0 && h > 0) { var shape = (w / h) / (unit.w / unit.h); if (shape < SHAPE_FIT[0] || shape > SHAPE_FIT[1]) return null; }
    var size = h / unit.h, natural = unit.w * size;
    if (fit === 'ground' && !(w > 0) && natural > h * LONG) { w = h * LONG; }
    if (fit === 'ground' && w > 0) { size = w / unit.w; natural = w; h = unit.h * size; }
    var sx = w > 0 ? clamp(w / natural, STRETCH_MIN, STRETCH_MAX) : 1;
    if (fit === 'rigid' || fit === 'elastic') {
      var most = fit === 'rigid' ? 1 : ELASTIC[1], least = fit === 'rigid' ? 1 : ELASTIC[0];
      sx = w > 0 ? clamp(w / natural, least, most) : 1;
      if (w > 0 && natural * sx > w) { size = w / (unit.w * sx); natural = unit.w * size; h = unit.h * size; }
    } else if (fn !== 'person' && w > 0) sx = w / natural;
    opt[key] = size;
    var map = function (pt) { return Array.isArray(pt) ? [x + (pt[0] - x) * sx, pt[1]] : pt; };
    if (Array.isArray(opt.handsAt)) opt.handsAt = opt.handsAt.map(function (pt) { return Array.isArray(pt) ? [x + (pt[0] - x) / sx, pt[1]] : pt; });
    opt.x = x - (num(+o.facing, 1) < 0 ? -1 : 1) * unit.shift * size;
    var overturned = fn !== 'person' && fn !== 'animal' && TURNED.some(function (k) { return truthy(o[k]); });
    c.save();
    if (o.silhouette) c.filter = 'brightness(0.22) saturate(0.35)';
    if (angle) { c.translate(x, y); c.rotate(angle); c.translate(-x, -y); }
    if (overturned) { c.translate(x, y - h / 2); c.rotate(Math.PI); c.translate(-x, -(y - h / 2)); }
    var flat = fn === 'prop' && truthy(o.lying) ? LIE_FLAT : 1;
    c.translate(x, y); c.scale(sx, flat); c.translate(-x, -y);
    var out;
    try { out = K[fn](c, opt); } finally { c.restore(); }
    var res = out && typeof out === 'object' ? Object.assign({}, out) : {};
    ['head', 'hand', 'backHand', 'back'].forEach(function (name) { if (res[name]) res[name] = map(res[name]); });
    if (res.rider && typeof res.rider === 'object') { res.rider = Object.assign({}, res.rider); ['head', 'hand', 'backHand'].forEach(function (name) { if (res.rider[name]) res.rider[name] = map(res.rider[name]); }); }
    res.box = { x: x - natural * sx / 2, y: y - h * flat, w: natural * sx, h: h * flat };
    return res;
  };
  var has = function (list, kind) { return Array.isArray(list) && list.indexOf(kind) >= 0; };
  var AMOUNT_POSES = { sitUp: ['lie', 'sit'], crouchAmt: ['stand', 'crouch'], crouch: ['stand', 'crouch'], kneelAmt: ['stand', 'kneel'] };
  var poseOf = function (K, o) {
    var pose = o.pose && has(K.poses, o.pose) ? o.pose : null;
    for (var key in AMOUNT_POSES) {
      var v = o[key], pair = AMOUNT_POSES[key];
      if (typeof v !== 'number' || !isFinite(v) || (pose && pose !== pair[0])) continue;
      var next = v >= 0.5 ? pair[1] : pair[0];
      if (has(K.poses, next)) return next;
    }
    return pose || 'stand';
  };
  var WAGON_ASPECT = 1.6, WAGON_SHAFT = 0.4;
  var yearOf = function () { var v = window.__motionView && window.__motionView.year; return v == null ? NaN : +v; };
  var CATALOG = window.__motionCatalog || { entries: [], words: {} };
  var wordOf = function (v) { return String(v == null ? '' : v).toLowerCase().replace(/[^a-z]/g, ''); };
  var THING_FNS = ['vehicle', 'building', 'prop', 'animal', 'tree'];
  var inYears = function (v, year) { return !(isFinite(year) && ((v.from != null && year < v.from) || (v.to != null && year > v.to))); };
  var markKind = function (fn, o) {
    var m = wordOf(o.mark), words = CATALOG.words[fn] || {};
    if (!m) return '';
    var one = [m, m.replace(/es$/, ''), m.replace(/s$/, '')].filter(function (w) { return words[w] != null; })[0];
    return one || '';
  };
  var pick = function (fn, o) {
    var words = CATALOG.words[fn] || {}, word = wordOf(o.kind), at = words[word];
    if (at == null && THING_FNS.indexOf(fn) >= 0) THING_FNS.some(function (other) { var hit = (CATALOG.words[other] || {})[word]; if (hit != null) at = hit; return hit != null; });
    var e = at == null ? null : CATALOG.entries[at], year = yearOf(), build = wordOf(o.build);
    if (!e || !inYears(e, year) || (build && e.builds && e.builds.indexOf(build) < 0)) return null;
    var byBuild = build ? e.variants.filter(function (v) { return v.builds && v.builds.indexOf(build) >= 0 && inYears(v, year); })[0] : null;
    var byYear = e.variants.filter(function (v) { return !v.builds && inYears(v, year); })[0];
    var kit = (byBuild || byYear || {}).kit;
    return kit ? [kit[0], kit[1], e.fit || 'stretch'] : null;
  };
  var STATES = ['broken', 'smashed', 'wrecked', 'collapsed', 'sinking', 'sunk', 'destroyed', 'damaged', 'burning', 'onFire', 'ablaze', 'open', 'opened', 'splintered', 'shattered', 'cracked'];
  var PEOPLE = ['passengers', 'occupants', 'people', 'riders', 'sailors', 'rowers', 'soldiers', 'refugees', 'figures'];
  var THINGS = ['animal', 'vehicle', 'building', 'tree', 'prop', 'wall'];
  var KIT_LISTS = ['points', 'wagons', 'from', 'to', 'values', 'labels', 'colors', 'items', 'groups', 'crew', 'load'];
  var kitCan = function (fn, o, nested) {
    if (THINGS.indexOf(fn) < 0) return true;
    if (STATES.some(function (k) { return truthy(o[k]); })) return false;
    if (Object.keys(o).some(function (k) { var v = o[k]; return KIT_LISTS.indexOf(k) < 0 && Array.isArray(v) && v.length > 1 && v.some(function (e) { return e && typeof e === 'object'; }); })) return false;
    return nested || !PEOPLE.some(function (k) { return truthy(o[k]); });
  };
  var chainIn = function (c, K, o) {
    var x = num(+o.x, 0), y = num(+o.y, 0), w = num(+o.w, 0), h = num(+o.h, 0);
    if (!(w > 0) || !(h > 0)) return null;
    var link = clamp(Math.min(h * 0.3, w / 10), 3, 40), opt = Object.assign({}, o, { kind: 'chain', x: x, y: y - h + link, width: w - link * 2, sag: Math.max(0, h - link * 2), r: link * 1.6, p: link / 0.22 });
    delete opt.w; delete opt.h; delete opt.mark;
    c.save();
    if (o.silhouette) c.filter = 'brightness(0.22) saturate(0.35)';
    try { K.prop(c, opt); } finally { c.restore(); }
    return { box: { x: x - w / 2, y: y - h, w: w, h: h } };
  };
  var wagonsIn = function (c, K, o) {
    var list = o.wagons.filter(function (b) { return b && num(+b.w, 0) > 0 && num(+b.h, 0) > 0; }), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, prev = null;
    list.forEach(function (b, i) {
      var box = { x: num(+b.x, 0), y: num(+b.y, 0), w: +b.w, h: +b.h };
      fitted(c, K, 'vehicle', { kind: 'wagon', x: box.x, y: box.y, w: box.w, h: box.h, facing: o.facing, load: o.load, color: b.color || o.color, silhouette: o.silhouette, seed: num(+o.seed, 3) + i }, 'p');
      if (prev) {
        var from = [prev.x + prev.w * 0.34, prev.y - prev.h * 0.27], to = [box.x - box.w * 0.34, box.y - box.h * 0.27], link = clamp(Math.min(prev.h, box.h) * 0.05, 3, 20);
        if (to[0] - from[0] > link * 2) K.prop(c, { kind: 'chain', points: [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + link * 2], to], r: link * 1.6, p: link / 0.22 });
      }
      prev = box;
      x0 = Math.min(x0, box.x - box.w / 2); x1 = Math.max(x1, box.x + box.w / 2); y0 = Math.min(y0, box.y - box.h); y1 = Math.max(y1, box.y);
    });
    return list.length ? { box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } } : null;
  };
  var BRIDGE_COLORS = { wood: '#8a6444', stone: '#a39d92', rope: '#8a6444', iron: '#5c626b', concrete: '#9a9c9e' };
  var BRIDGE_INK = '#2a2420', FAR_DECK = 0.56;
  var rgbOf = function (hex) { var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return null; var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  var shadeOf = function (hex, k) { var v = rgbOf(hex) || [128, 128, 128]; return 'rgb(' + v.map(function (n) { return Math.round(clamp(n * k, 0, 255)); }).join(',') + ')'; };
  var bridgeColor = function (o, build) { return (o.build || build === 'concrete' || build === 'iron') && rgbOf(o.color) ? o.color : BRIDGE_COLORS[build]; };
  var sideBridge = function (c, o, build, x, y, w, h) {
    var base = bridgeColor(o, build), yr = num(+(window.__motionView || {}).year, 1900), x0 = x - w / 2, x1 = x + w / 2, water = y + h, lw = Math.max(1.2, h * 0.025);
    var hump = build === 'stone' && yr < 1750 ? Math.min(h * 0.22, w * 0.035) : 0, deckAt = function (px) { var u = (px - x0) / w; return y - hump * Math.sin(Math.PI * clamp(u, 0, 1)); };
    var path = function (pts) { var p = new Path2D(); pts.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); return p; };
    var ink = function (p, width) { c.lineWidth = width || lw; c.strokeStyle = BRIDGE_INK; c.stroke(p); };
    var under = function (top, bottom) { var g = c.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, 'rgba(24,30,36,0.95)'); g.addColorStop(0.5, 'rgba(52,76,92,0.92)'); g.addColorStop(1, 'rgba(98,134,154,0.9)'); return g; };
    var N = 32, deck = [];
    for (var i = 0; i <= N; i++) { var px = x0 + (w * i) / N; deck.push([px, deckAt(px)]); }
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (o.railOnly) { c.beginPath(); deck.forEach(function (q, j) { if (j) c.lineTo(q[0], q[1] + lw); else c.moveTo(q[0], q[1] + lw); }); c.lineTo(x1, y - h * 4); c.lineTo(x0, y - h * 4); c.closePath(); c.clip(); }
    if (build === 'stone') {
      var spans = Math.max(2, Math.round(w / (h * 1.5))), pier = (w / spans) * 0.2, open = w / spans - pier, rail = Math.min(h * 0.32, w * 0.05), coping = Math.max(2, rail * 0.18);
      var face = path(deck.concat([[x1, water + h * 0.06], [x0, water + h * 0.06]]));
      var g = c.createLinearGradient(0, y - hump, 0, water); g.addColorStop(0, shadeOf(base, 1.06)); g.addColorStop(1, shadeOf(base, 0.8)); c.fillStyle = g; c.fill(face);
      c.save(); c.clip(face); c.strokeStyle = shadeOf(base, 0.7); c.lineWidth = Math.max(0.6, lw * 0.4); c.globalAlpha = 0.5;
      for (var r = 0, cy = y + h * 0.16; cy < water; cy += h * 0.16, r++) { c.beginPath(); c.moveTo(x0, cy); c.lineTo(x1, cy); c.stroke(); for (var jx = x0 + (r % 2) * h * 0.2; jx < x1; jx += h * 0.4) { c.beginPath(); c.moveTo(jx, cy); c.lineTo(jx, cy + h * 0.16); c.stroke(); } }
      c.restore();
      for (var k = 0; k < spans; k++) {
        var ax = x0 + pier / 2 + k * (open + pier), half = open / 2, mid = ax + half, spring = water - Math.min(h * 0.35, half * 0.6), rise = Math.min(half, spring - deckAt(mid) - h * 0.14);
        var arch = new Path2D(); arch.moveTo(ax, water + h * 0.06); arch.lineTo(ax, spring); arch.ellipse(mid, spring, half, Math.max(4, rise), 0, Math.PI, 0); arch.lineTo(ax + open, water + h * 0.06); arch.closePath();
        c.fillStyle = under(spring - rise, water); c.fill(arch);
        c.save(); c.clip(arch); c.strokeStyle = 'rgba(220,236,244,0.55)'; c.lineWidth = Math.max(1, lw * 0.6); for (var q = 0; q < 3; q++) { var ry = water - h * (0.05 + q * 0.06); c.beginPath(); c.moveTo(ax + open * (0.15 + q * 0.12), ry); c.lineTo(ax + open * (0.55 + q * 0.1), ry); c.stroke(); } c.restore();
        var ring = new Path2D(); ring.ellipse(mid, spring, half + h * 0.06, Math.max(4, rise) + h * 0.06, 0, Math.PI, 0); c.lineWidth = h * 0.09; c.strokeStyle = shadeOf(base, 0.9); c.stroke(ring);
        c.lineWidth = Math.max(0.6, lw * 0.45); c.strokeStyle = shadeOf(base, 0.6);
        for (var v = 1; v < 9; v++) { var an = Math.PI + (Math.PI * v) / 9, cx1 = Math.cos(an), sy1 = Math.sin(an); c.beginPath(); c.moveTo(mid + cx1 * half, spring + sy1 * Math.max(4, rise)); c.lineTo(mid + cx1 * (half + h * 0.11), spring + sy1 * (Math.max(4, rise) + h * 0.11)); c.stroke(); }
        ink(arch, lw * 0.9);
      }
      for (k = 0; k <= spans; k++) { var px2 = x0 + k * (open + pier), cw = pier * 0.8; if (k === 0 || k === spans) continue; var cut = path([[px2 - cw / 2, water + h * 0.06], [px2 - cw / 2, water - h * 0.32], [px2, water - h * 0.44], [px2 + cw / 2, water - h * 0.32], [px2 + cw / 2, water + h * 0.06]]); c.fillStyle = shadeOf(base, 0.86); c.fill(cut); ink(cut, lw * 0.7); }
      ink(face);
      [-1, 1].forEach(function (sd) { var ex = sd < 0 ? x0 : x1, far2 = ex + sd * h * 1.2, low = water - h * 0.12; var wing = path([[ex, deckAt(ex)], [far2, low], [far2, water + h * 0.06], [ex, water + h * 0.06]]); c.fillStyle = shadeOf(base, 0.9); c.fill(wing); ink(wing); var wr = path([[ex, deckAt(ex) - rail], [far2, low - rail * 0.7], [far2, low], [ex, deckAt(ex)]]); c.fillStyle = shadeOf(base, 0.97); c.fill(wr); ink(wr, lw * 0.8); });
      var top = deck.map(function (q) { return [q[0], q[1] - rail]; });
      var wall = path(deck.concat(top.slice().reverse())); c.fillStyle = shadeOf(base, 0.95); c.fill(wall); ink(wall);
      var cap = path(top.map(function (q) { return [q[0], q[1] + coping]; }).concat(top.slice().reverse().map(function (q) { return [q[0], q[1] - coping * 0.4]; }))); c.fillStyle = shadeOf(base, 1.12); c.fill(cap); ink(cap, lw * 0.7);
    } else {
      var bents = Math.max(3, Math.round(w / (h * 1.1))), beam = Math.max(3, h * 0.13), hand = Math.min(h * 0.38, w * 0.05), wood = base, post = Math.max(2, h * 0.07);
      for (var b2 = 0; b2 <= bents; b2++) {
        var bx = x0 + (w * b2) / bents, foot = water + h * 0.12, top2 = y + beam;
        [-1, 1].forEach(function (sd) { var p2 = path([[bx + sd * post * 0.3, top2], [bx + sd * post * 1.6, foot]]); c.lineWidth = post; c.strokeStyle = shadeOf(wood, 0.72); c.stroke(p2); });
        if (b2 < bents) { var nx = x0 + (w * (b2 + 1)) / bents, my = (top2 + water) / 2; [[[bx, top2 + h * 0.08], [nx, my]], [[bx, my], [nx, top2 + h * 0.08]]].forEach(function (seg) { var p3 = path(seg); c.lineWidth = Math.max(1.2, post * 0.45); c.strokeStyle = shadeOf(wood, 0.62); c.stroke(p3); }); }
        c.save(); c.globalAlpha = 0.45; c.strokeStyle = 'rgba(230,240,246,0.9)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.ellipse(bx, water + h * 0.02, post * 2.2, post * 0.5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
      [-1, 1].forEach(function (sd) { var ex = sd < 0 ? x0 : x1, far3 = ex + sd * h * 1.3, low2 = water - h * 0.08, ramp = path([[ex, y], [far3, low2], [far3, low2 + beam], [ex, y + beam]]); c.fillStyle = shadeOf(wood, 0.82); c.fill(ramp); ink(ramp); var pr = path([[ex, y - hand], [far3, low2 - hand * 0.7]]); c.lineWidth = Math.max(1.5, post * 0.7); c.strokeStyle = shadeOf(wood, 0.7); c.stroke(pr); var pp = path([[far3, low2], [far3, low2 - hand * 0.7]]); c.stroke(pp); });
      var stringer = path([[x0, y], [x1, y], [x1, y + beam], [x0, y + beam]]); c.fillStyle = shadeOf(wood, 0.82); c.fill(stringer); ink(stringer);
      c.lineWidth = Math.max(0.6, lw * 0.45); c.strokeStyle = shadeOf(wood, 0.55);
      for (var pk = x0 + beam; pk < x1; pk += beam * 1.1) { c.beginPath(); c.moveTo(pk, y + beam * 0.15); c.lineTo(pk, y + beam * 0.85); c.stroke(); }
      for (b2 = 0; b2 <= bents * 2; b2++) { var hx = x0 + (w * b2) / (bents * 2), hp = path([[hx, y], [hx, y - hand]]); c.lineWidth = Math.max(1.5, post * 0.7); c.strokeStyle = shadeOf(wood, 0.7); c.stroke(hp); }
      [hand, hand * 0.5].forEach(function (hh, i2) { var rl = path([[x0, y - hh], [x1, y - hh]]); c.lineWidth = Math.max(1.5, post * (i2 ? 0.45 : 0.7)); c.strokeStyle = shadeOf(wood, 0.7); c.stroke(rl); });
    }
    c.restore();
  };
  var drawBridge = function (c, o, build, a, b, wa, wb, drop, rail) {
    var base = bridgeColor(o, build);
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, level = Math.abs(dy) < 1, nx = level ? 0 : 1, ny = level ? 1 : 0;
    var sag = build === 'rope' ? Math.max(wa, wb) * 0.35 + len * 0.04 : 0;
    var at = function (t, side) { var hw = (wa + (wb - wa) * t) / 2, cx = a[0] + dx * t, cy = a[1] + dy * t + Math.sin(Math.PI * t) * sag; return [cx + nx * hw * side, cy + ny * hw * side]; };
    var scaleAt = function (t) { return (wa + (wb - wa) * t) / wa; }, dropAt = function (t) { return drop * scaleAt(t); };
    var lw = Math.max(1.4, Math.min(wa, wb, drop) * 0.03 + 1), N = 24, k, t;
    var line = function (pts, width, col) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.lineWidth = width; c.strokeStyle = col; c.stroke(); };
    var poly = function (pts, fill) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = BRIDGE_INK; c.stroke(); };
    var near = [], far = [];
    for (k = 0; k <= N; k++) { near.push(at(k / N, 1)); far.push(at(k / N, -1)); }
    var piers = Math.max(2, Math.round(len / Math.max(40, (wa + wb) * 0.8)));
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (build === 'stone') {
      var face = near.concat(near.slice().reverse().map(function (q, i) { return [q[0], q[1] + dropAt(1 - i / N)]; }));
      poly(face, shadeOf(base, 0.82));
      for (k = 0; k < piers; k++) {
        var t0 = (k + 0.12) / piers, t1 = (k + 0.88) / piers, arch = [];
        for (var j = 0; j <= 12; j++) { t = t0 + (t1 - t0) * j / 12; var q = at(t, 1), d = dropAt(t); arch.push([q[0], q[1] + d - Math.sin(Math.PI * j / 12) * d * 0.62]); }
        arch.push([at(t1, 1)[0], at(t1, 1)[1] + dropAt(t1)]);
        var top = Math.min.apply(null, arch.map(function (q) { return q[1]; })), bottom = at(t0, 1)[1] + dropAt(t0), under = c.createLinearGradient(0, top, 0, bottom);
        under.addColorStop(0, 'rgba(28,36,44,0.92)'); under.addColorStop(0.45, 'rgba(58,84,100,0.9)'); under.addColorStop(1, 'rgba(104,140,160,0.85)');
        poly(arch.concat([[at(t0, 1)[0], at(t0, 1)[1] + dropAt(t0)]]), under);
      }
    } else if (build !== 'rope') {
      for (k = 0; k <= piers; k++) {
        t = Math.min(0.97, Math.max(0.03, k / piers));
        [1, -1].forEach(function (side) { var q = at(t, side); line([q, [q[0], q[1] + dropAt(t) * (side < 0 ? 0.8 : 1)]], Math.max(2, (wa + (wb - wa) * t) * (build === 'wood' ? 0.07 : 0.12)), side < 0 ? shadeOf(base, 0.55) : shadeOf(base, 0.72)); });
      }
      var edge = near.concat(near.slice().reverse().map(function (q) { return [q[0], q[1] + Math.max(3, (wa + wb) * 0.05)]; }));
      poly(edge, shadeOf(base, 0.7));
    }
    poly(near.concat(far.slice().reverse()), base);
    if (build === 'wood' || build === 'rope') {
      var planks = Math.max(6, Math.round(len / Math.max(6, (wa + wb) * 0.09)));
      for (k = 1; k < planks; k++) { t = k / planks; line([at(t, -1), at(t, 1)], Math.max(1, lw * 0.6), shadeOf(base, 0.6)); }
    } else if (build === 'stone') {
      for (k = 1; k < piers * 3; k++) { t = k / (piers * 3); line([at(t, -1), at(t, 1)], Math.max(1, lw * 0.5), shadeOf(base, 0.75)); }
    }
    [-1, 1].forEach(function (side) {
      var top = [];
      for (k = 0; k <= N; k++) { var q = at(k / N, side); top.push([q[0], q[1] - rail * scaleAt(k / N)]); }
      if (build === 'stone') { poly((side < 0 ? far : near).concat(top.slice().reverse()), shadeOf(base, side < 0 ? 0.78 : 0.92)); return; }
      var posts = Math.max(3, Math.round(len / Math.max(18, rail * 1.6)));
      for (k = 0; k <= posts; k++) { var i = Math.round(k / posts * N), q = side < 0 ? far[i] : near[i]; line([q, top[i]], build === 'rope' ? Math.max(1, lw * 0.5) : Math.max(1.5, lw * 1.1), build === 'rope' ? '#c8b088' : shadeOf(base, 0.62)); }
      line(top, Math.max(1.5, lw * (build === 'rope' ? 0.9 : 1.2)), build === 'rope' ? '#c8b088' : shadeOf(base, 0.62));
    });
    c.restore();
  };
  var asScene = function (draw) {
    var view = window.__motionViewHooks, held = view ? view.kit : 0;
    if (view) view.kit = 0;
    try { draw(); } finally { if (view) view.kit = held; }
  };
  var DEVICE_INK = '#26201c', DEVICE_PAPER = '#fbf8ef', INSET_PAPER = '#efe4cc', COUNT_MAX = 24;
  var devicePath = function (kind, x, y, r) {
    var p = new Path2D();
    if (kind === 'inset') { p.arc(x, y, r, 0, Math.PI * 2); return p; }
    var lobes = 9, rx = r * 1.25, ry = r * 0.78;
    for (var i = 0; i <= lobes; i++) {
      var a = (i / lobes) * Math.PI * 2, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
      if (i === 0) p.moveTo(px, py);
      else { var m = ((i - 0.5) / lobes) * Math.PI * 2; p.quadraticCurveTo(x + Math.cos(m) * rx * 1.32, y + Math.sin(m) * ry * 1.36, px, py); }
    }
    p.closePath();
    return p;
  };
  var SIGNS = {
    alarm: function (c, x, y, r) { c.fillStyle = '#d23b2b'; c.beginPath(); c.moveTo(x - r * 0.16, y - r); c.lineTo(x + r * 0.16, y - r); c.lineTo(x + r * 0.08, y - r * 0.2); c.lineTo(x - r * 0.08, y - r * 0.2); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y + r * 0.05, r * 0.13, 0, Math.PI * 2); c.fill(); c.stroke(); },
    question: function (c, x, y, r) { c.lineWidth *= 2.2; c.strokeStyle = '#3a5fa8'; c.beginPath(); c.arc(x, y - r * 0.6, r * 0.32, Math.PI * 1.1, Math.PI * 2.35); c.quadraticCurveTo(x, y - r * 0.2, x, y - r * 0.05); c.stroke(); c.fillStyle = '#3a5fa8'; c.beginPath(); c.arc(x, y + r * 0.25, r * 0.1, 0, Math.PI * 2); c.fill(); },
    sweat: function (c, x, y, r) { c.fillStyle = '#9cd2f0'; c.beginPath(); c.moveTo(x + r * 0.5, y - r * 0.7); c.quadraticCurveTo(x + r * 0.85, y - r * 0.15, x + r * 0.5, y - r * 0.05); c.quadraticCurveTo(x + r * 0.15, y - r * 0.15, x + r * 0.5, y - r * 0.7); c.fill(); c.stroke(); },
    sleep: function (c, x, y, r) { c.lineWidth *= 1.6; [[0, 0, 0.3], [0.35, -0.45, 0.42], [0.8, -1, 0.55]].forEach(function (z) { var zx = x + z[0] * r, zy = y + z[1] * r, s = z[2] * r; c.beginPath(); c.moveTo(zx - s / 2, zy - s / 2); c.lineTo(zx + s / 2, zy - s / 2); c.lineTo(zx - s / 2, zy + s / 2); c.lineTo(zx + s / 2, zy + s / 2); c.stroke(); }); },
    shiver: function (c, x, y, r) { [-1, 1].forEach(function (side) { for (var i = 0; i < 3; i++) { var bx = x + side * r * (0.75 + i * 0.18), by = y + r * (0.2 + i * 0.25); c.beginPath(); c.moveTo(bx, by - r * 0.2); c.quadraticCurveTo(bx + side * r * 0.1, by, bx, by + r * 0.2); c.stroke(); } }); },
    anger: function (c, x, y, r) { c.strokeStyle = '#d23b2b'; c.lineWidth *= 1.8; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) { c.beginPath(); c.moveTo(x + q[0] * r * 0.12, y + q[1] * r * 0.45); c.quadraticCurveTo(x + q[0] * r * 0.12, y + q[1] * r * 0.12, x + q[0] * r * 0.45, y + q[1] * r * 0.12); c.stroke(); }); },
  };
  var drawDevice = function (c, o, inner) {
    var kind = String(o.kind || ''), x = num(+o.x, 0), y = num(+o.y, 0), r = Math.max(4, num(+o.r, 40)), a = o.appear == null ? 1 : clamp(num(+o.appear, 1), 0, 1);
    if (!(a > 0)) return null;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = DEVICE_INK; c.lineWidth = Math.max(1.5, r * 0.05);
    try {
      if (kind === 'thought' || kind === 'inset') {
        var from = Array.isArray(o.from) ? [num(+o.from[0], x), num(+o.from[1], y + r * 2)] : null;
        if (from && kind === 'inset') { var d = Math.hypot(from[0] - x, from[1] - y) || 1; c.globalAlpha *= a; c.beginPath(); c.moveTo(x + (from[0] - x) / d * r * a, y + (from[1] - y) / d * r * a); c.lineTo(from[0], from[1]); c.stroke(); c.beginPath(); c.arc(from[0], from[1], r * 0.12, 0, Math.PI * 2); c.stroke(); c.globalAlpha /= a; }
        c.translate(x, y); c.scale(a, a); c.translate(-x, -y);
        if (from && kind === 'thought') for (var i = 0; i < 3; i++) { var t = 0.35 + i * 0.22, bx = x + (from[0] - x) * t, by = y + (from[1] - y) * t, br = r * (0.16 - i * 0.04); c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fillStyle = DEVICE_PAPER; c.fill(); c.stroke(); }
        var p = devicePath(kind, x, y, r), box = kind === 'inset' ? { x: x - r * 0.75, y: y - r * 0.75, w: r * 1.5, h: r * 1.5 } : { x: x - r * 1.1, y: y - r * 0.68, w: r * 2.2, h: r * 1.36 };
        box.cx = x; box.cy = y; box.r = r;
        c.fillStyle = kind === 'inset' ? INSET_PAPER : DEVICE_PAPER; c.fill(p);
        if (typeof inner === 'function') { c.save(); c.clip(p); try { inner(c, box); } catch (e) {} c.restore(); }
        c.lineWidth = Math.max(2, r * 0.06); c.stroke(p);
        return { box: { x: x - r * (kind === 'inset' ? 1 : 1.6), y: y - r * (kind === 'inset' ? 1 : 1.05), w: r * (kind === 'inset' ? 2 : 3.2), h: r * (kind === 'inset' ? 2 : 2.1) } };
      }
      if (kind === 'emote') { var sign = SIGNS[o.sign] || SIGNS.alarm; c.translate(x, y); c.scale(a, a); c.translate(-x, -y); sign(c, x, y, r); return { box: { x: x - r * 1.1, y: y - r * 1.4, w: r * 2.5, h: r * 2.4 } }; }
      if (kind === 'count') {
        var groups = (Array.isArray(o.groups) ? o.groups : []).filter(function (g) { return g && num(+g.n, 0) > 0; }), w = num(+o.w, 300), h = num(+o.h, 120);
        if (!groups.length) return null;
        var most = Math.max.apply(null, groups.map(function (g) { return +g.n; })), each = Math.max(1, Math.ceil(most / COUNT_MAX)), cols = Math.max(3, Math.ceil(Math.sqrt(Math.ceil(most / each) * 1.3))), gw = w / groups.length, cell = Math.min(gw / (cols + 0.6), h / (Math.ceil(Math.ceil(most / each) / cols) + 0.4));
        groups.forEach(function (g, gi) {
          var count = Math.max(1, Math.round(+g.n / each)), shown = Math.ceil(count * a);
          c.fillStyle = g.color || '#6b5a48';
          for (var k = 0; k < shown; k++) { var cx = x + gi * gw + cell * (k % cols + 0.8), cy = y + h - cell * (Math.floor(k / cols) + 0.6); c.beginPath(); c.arc(cx, cy - cell * 0.32, cell * 0.17, 0, Math.PI * 2); c.moveTo(cx - cell * 0.22, cy + cell * 0.25); c.quadraticCurveTo(cx, cy - cell * 0.3, cx + cell * 0.22, cy + cell * 0.25); c.closePath(); c.fill(); }
        });
        return { box: { x: x, y: y, w: w, h: h } };
      }
      if (kind === 'time') {
        var pr = clamp(num(+o.progress, 0.5), 0, 1), ang = Math.PI + pr * Math.PI, sx = x + Math.cos(ang) * r, sy = y + Math.sin(ang) * r * 0.6, moon = o.body === 'moon';
        c.lineWidth = Math.max(1.2, r * 0.02); c.setLineDash([r * 0.05, r * 0.05]); c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, Math.PI, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = moon ? '#f2ecd2' : '#f6c34a'; c.beginPath(); c.arc(sx, sy, r * 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
        return { box: { x: x - r * 1.15, y: y - r * 0.8, w: r * 2.3, h: r * 0.95 } };
      }
      if (kind === 'sound') {
        var f = num(+o.facing, 1) < 0 ? -1 : 1, time = num(+o.t, 0);
        for (var j = 0; j < 3; j++) { var ph = ((time / 1.2) + j / 3) % 1, rr = r * (0.3 + ph * 0.9); c.globalAlpha = (1 - ph) * a; c.beginPath(); c.arc(x, y, rr, f > 0 ? -0.6 : Math.PI - 0.6, f > 0 ? 0.6 : Math.PI + 0.6); c.stroke(); }
        return { box: { x: f > 0 ? x : x - r * 1.3, y: y - r * 0.8, w: r * 1.3, h: r * 1.6 } };
      }
      if (kind === 'speed') {
        var sf = num(+o.facing, 1) < 0 ? -1 : 1, st = num(+o.t, 0);
        c.lineWidth = Math.max(1.5, r * 0.045);
        for (var q = 0; q < 5; q++) { var lp = ((st * 1.6) + q * 0.37) % 1, ly = y + (q - 2) * r * 0.22, l0 = r * (0.15 + lp * 0.3), l1 = l0 + r * (0.55 + (q % 2) * 0.35) * a; c.globalAlpha = 0.85 * (1 - lp * 0.6); c.beginPath(); c.moveTo(x - sf * l0, ly); c.lineTo(x - sf * l1, ly); c.stroke(); }
        return { box: { x: sf > 0 ? x - r * 1.6 : x, y: y - r * 0.6, w: r * 1.6, h: r * 1.2 } };
      }
      if (kind === 'impact') {
        var it = num(+o.t, 0), spikes = 9, pulse = 1 + Math.sin(it * 18) * 0.05;
        c.translate(x, y); c.scale(a * pulse, a * pulse);
        [[1, '#f6c34a'], [0.55, '#fff4c8']].forEach(function (layer) {
          c.beginPath();
          for (var k = 0; k < spikes * 2; k++) { var ang = k * Math.PI / spikes - Math.PI / 2, rad = r * layer[0] * (k % 2 ? 0.48 : 1) * (k % 4 === 0 ? 1 : 0.86); c[k ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad); }
          c.closePath(); c.fillStyle = layer[1]; c.fill(); c.stroke();
        });
        return { box: { x: x - r, y: y - r, w: 2 * r, h: 2 * r } };
      }
      if (kind === 'spotlight') {
        var g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 1.7);
        g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(1, 'rgba(10,8,20,' + (num(+o.dim, 0.45) * a).toFixed(3) + ')');
        c.fillStyle = g; c.fillRect(x - 5000, y - 5000, 10000, 10000);
        return { box: { x: x - r, y: y - r, w: 2 * r, h: 2 * r } };
      }
      return null;
    } finally { c.restore(); }
  };
  var thing = function (c, K, fn, o) {
    var k = pick(fn, o);
    if (!k) return null;
    if (k[1] === 'chain') return chainIn(c, K, o);
    return fitted(c, K, k[0], Object.assign({}, o, { kind: k[1] }), 'p', null, k[2]);
  };
  var KIT = {
    person: function (c, K, o) { return fitted(c, K, 'person', o, 'r', { pose: poseOf(K, o) }); },
    animal: function (c, K, o) { var k = pick('animal', Object.assign({}, o, { kind: o.kind || 'horse' })); return k ? fitted(c, K, k[0], Object.assign({}, o, { kind: k[1] }), 'p', null, k[2]) : null; },
    vehicle: function (c, K, o) { return thing(c, K, 'vehicle', o); },
    building: function (c, K, o) { return thing(c, K, 'building', o); },
    tree: function (c, K, o) { return thing(c, K, 'tree', Object.assign({}, o, { kind: o.kind || 'oak' })); },
    prop: function (c, K, o) { return thing(c, K, 'prop', o); },
    wall: function (c, K, o) {
      var k = pick('wall', o);
      if (!k) {
        var q = pick('prop', o);
        if (!q || q[0] !== 'prop') return null;
        var tw = num(+o.w, 0), th = num(+o.h, 0), piece = measure(K, 'prop', Object.assign({}, o, { kind: q[1] }), 'p');
        if (!piece || !(tw > 0) || !(th > 0)) return null;
        var pw = piece.w * th / piece.h, n = Math.max(1, Math.round(tw / pw)), each = tw / n, x0 = num(+o.x, 0) - tw / 2;
        for (var i = 0; i < n; i++) fitted(c, K, 'prop', Object.assign({}, o, { kind: q[1], x: x0 + each * (i + 0.5), w: each, h: th, seed: num(+o.seed, 3) + i }), 'p', null, 'stretch');
        return { box: { x: x0, y: num(+o.y, 0) - th, w: tw, h: th } };
      }
      o = Object.assign({}, o, { kind: k[1] });
      var x = num(+o.x, 0), y = num(+o.y, 0), w = num(+o.w, 0), h = num(+o.h, 0);
      if (SPAN_WALLS.indexOf(o.kind) >= 0) { var opt = Object.assign({}, o, { width: w, height: h }); delete opt.w; delete opt.h; K.prop(c, opt); return { box: { x: x - w / 2, y: y - h, w: w, h: h } }; }
      if (ROW_WALLS.indexOf(o.kind) < 0) return null;
      if (o.kind === 'wagonFort') {
        if (Array.isArray(o.wagons) && o.wagons.length) return wagonsIn(c, K, o);
        if (!(w > 0) || !(h > 0)) return null;
        var n = Math.max(1, Math.round(w / (h * WAGON_ASPECT))), each = w / (n + WAGON_SHAFT), left = num(+o.facing, 1) < 0 ? x - w / 2 + each * WAGON_SHAFT : x - w / 2;
        return wagonsIn(c, K, Object.assign({}, o, { wagons: Array.apply(null, Array(n)).map(function (_, i) { return { x: left + each * (i + 0.5), y: y, w: each * 0.94, h: h }; }) }));
      }
      var two = measure(K, 'prop', Object.assign({}, o, { count: 2 }), 'p'), three = measure(K, 'prop', Object.assign({}, o, { count: 3 }), 'p');
      if (!two || !three || !(h > 0)) return null;
      var p = h / two.h, step = (three.w - two.w) * p, count = step > 0.5 ? Math.max(2, 2 + Math.round((w - two.w * p) / step)) : 2;
      return fitted(c, K, 'prop', Object.assign({}, o, { count: count }), 'p');
    },
    bridge: function (c, K, o) {
      var w = num(+o.w, 0), k = pick('bridge', Object.assign({}, o, { kind: 'bridge' })), build = k && k[1];
      if (!(w > 0) || !build) return null;
      if (Array.isArray(o.from) && Array.isArray(o.to)) {
        var a = [num(+o.from[0], 0), num(+o.from[1], 0)], b = [num(+o.to[0], 0), num(+o.to[1], 0)];
        asScene(function () { drawBridge(c, o, build, a, b, w, w * FAR_DECK, w * 0.38, w * 0.24); });
        return { box: boxOf('bridge', o), deck: a };
      }
      var x = num(+o.x, 0), y = num(+o.y, 0), h = num(+o.h, 0);
      if ((build === 'stone' || build === 'wood') && h > 0) { asScene(function () { sideBridge(c, o, build, x, y, w, h); }); return { box: { x: x - w / 2, y: y - h * 0.4, w: w, h: h * 1.4 }, deck: [x, y] }; }
      if (build !== 'wood') { var drop = h > 0 ? h : w * 0.25; asScene(function () { drawBridge(c, o, build, [x - w / 2, y], [x + w / 2, y], Math.max(4, drop * 0.12), Math.max(4, drop * 0.12), drop, Math.min(drop * 0.5, w * 0.06)); }); return { box: { x: x - w / 2, y: y, w: w, h: h }, deck: [x, y] }; }
      var opt = Object.assign({}, o, { kind: 'bridge', width: w, height: h > 0 ? h : undefined });
      if (!o.build) delete opt.color;
      delete opt.w; delete opt.h;
      K.prop(c, opt);
      return { box: { x: x - w / 2, y: y, w: w, h: h }, deck: [x, y] };
    },
    chart: function (c, K, o) { K.chart(c, { kind: o.kind, x: o.x, y: o.y, width: o.w, height: o.h, values: o.values, labels: o.labels, colors: o.colors, grow: o.grow }); return { box: { x: +o.x, y: +o.y, w: +o.w, h: +o.h } }; },
    meter: function (c, K, o) { K.meter(c, { kind: o.kind, x: o.x, y: o.y, width: o.w, height: o.h, value: o.value, color: o.color, label: o.label }); return { box: { x: +o.x, y: +o.y, w: +o.w, h: +o.h } }; },
    timeline: function (c, K, o) { K.timeline(c, { x: o.x, y: o.y, width: o.w, items: o.items, progress: o.progress, color: o.color, size: o.size }); return { box: { x: +o.x, y: +o.y, w: +o.w, h: num(+o.h, 0) } }; },
    icon: function (c, K, o) {
      if (!has(K.icons, o.kind)) return null;
      var r = num(+o.r, 20), x = num(+o.x, 0), y = num(+o.y, 0), id = [K.style ? K.style() : '', 'icon', o.kind].join('|');
      if (sizes[id] === undefined) { var b = painted(function (q) { K.icon(q, { kind: o.kind, x: PAD / 2, y: PAD / 2, r: 100, color: '#888' }); }, PAD / 2, PAD / 2); sizes[id] = b ? Math.max(b.left, b.right, b.top, b.bottom) / 100 : 1; }
      var appear = o.appear == null ? 1 : clamp(num(+o.appear, 1), 0, 1.2), pulse = clamp(num(+(o.pulse != null ? o.pulse : o.pop), 0), 0, 1);
      if (pulse > 0) { c.save(); c.strokeStyle = o.color || '#8a2f26'; c.globalAlpha *= 0.55 * (1 - pulse * 0.55); c.lineWidth = Math.max(2, r * 0.1); c.beginPath(); c.arc(x, y, r * (1.2 + pulse * 0.85), 0, Math.PI * 2); c.stroke(); c.restore(); }
      var opt = Object.assign({}, o, { r: r / Math.max(0.5, sizes[id]), pop: appear });
      delete opt.mark; delete opt.pulse;
      K.icon(c, opt);
      return { box: { x: x - r, y: y - r, w: 2 * r, h: 2 * r } };
    },
    arrow: function (c, K, o) { var len = Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]) || 1; K.arrow(c, Object.assign({}, o, { curve: num(+o.curve, 0) / len })); return { box: { x: Math.min(o.from[0], o.to[0]), y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]), h: Math.abs(o.to[1] - o.from[1]) } }; },
    label: function (c, K, o) {
      if (o.align === 'left') {
        var size = num(+o.size, 22);
        c.save(); c.font = '700 ' + size + 'px sans-serif';
        var width = Math.max.apply(null, String(o.text || '').split('\\n').map(function (l) { return c.measureText(l).width; })) + size * 1.1;
        c.restore();
        o = Object.assign({}, o, { align: 'center', x: num(+o.x, 0) + width / 2 });
      }
      K.label(c, o);
      return { box: { x: +o.x, y: +o.y, w: 0, h: 0 } };
    },
  };
  var FNS = Object.keys(KIT);
  var track = function (keys, progress) {
    var list = (Array.isArray(keys) ? keys : []).filter(function (key) { return key && isFinite(+key.at); }).slice().sort(function (a, b) { return a.at - b.at; });
    if (!list.length) return {};
    var p = clamp(num(+progress, 0), 0, 1), i = 0;
    while (i + 1 < list.length && p >= +list[i + 1].at) i++;
    var a = list[i], j = Math.min(i + 1, list.length - 1), b = list[j], span = +b.at - +a.at;
    var raw = span > 0 ? clamp((p - +a.at) / span, 0, 1) : 0, out = Object.assign({}, a), names = {};
    var field = function (name) {
      var v = [];
      list.forEach(function (key, q) { v.push(typeof key[name] === 'number' && isFinite(key[name]) ? key[name] : q ? v[q - 1] : NaN); });
      for (var q = v.length - 2; q >= 0; q--) if (!isFinite(v[q])) v[q] = v[q + 1];
      if (!v.every(function (u) { return isFinite(u); })) return null;
      var d = [];
      for (q = 0; q + 1 < v.length; q++) { var hh = +list[q + 1].at - +list[q].at; d.push(hh > 0 ? (v[q + 1] - v[q]) / hh : 0); }
      var m = v.map(function (u, k) {
        if (k === 0) return +list[0].at <= 0.001 && v.length > 1 ? d[0] : 0;
        if (k === v.length - 1) return +list[k].at >= 0.999 ? d[k - 1] : 0;
        var l = d[k - 1], r = d[k];
        if (l * r <= 0) return 0;
        var s = (l + r) / 2, cap = 3 * Math.min(Math.abs(l), Math.abs(r));
        return (s < 0 ? -1 : 1) * Math.min(Math.abs(s), cap);
      });
      return { v: v, m: m };
    };
    var at = function (f) {
      if (!f) return null;
      if (i === j || span <= 0) return { v: f.v[i], dv: 0 };
      var s = raw, s2 = s * s, s3 = s2 * s, h = span;
      return {
        v: (2 * s3 - 3 * s2 + 1) * f.v[i] + (s3 - 2 * s2 + s) * h * f.m[i] + (-2 * s3 + 3 * s2) * f.v[j] + (s3 - s2) * h * f.m[j],
        dv: ((6 * s2 - 6 * s) * f.v[i] + (-6 * s2 + 6 * s) * f.v[j]) / h + (3 * s2 - 4 * s + 1) * f.m[i] + (3 * s2 - 2 * s) * f.m[j],
      };
    };
    list.forEach(function (key) { Object.keys(key).forEach(function (name) { if (name !== 'at' && typeof key[name] === 'number') names[name] = true; }); });
    var fx = null, vx = 0, vy = 0;
    Object.keys(names).forEach(function (name) {
      if (typeof a[name] !== 'number' && typeof b[name] !== 'number') return;
      var f = field(name), r = at(f);
      if (!r) return;
      out[name] = r.v;
      if (name === 'x') { fx = f; vx = r.dv; }
      if (name === 'y') vy = r.dv;
    });
    out.moving = Math.sqrt(vx * vx + vy * vy) > 40;
    var travelled = 0;
    if (fx) { for (var q = 0; q < i; q++) travelled += Math.abs(fx.v[q + 1] - fx.v[q]); travelled += Math.abs(num(out.x, fx.v[i]) - fx.v[i]); }
    out.distance = travelled;
    out.k = raw * raw * (3 - 2 * raw);
    out.index = i;
    return out;
  };
  var TITLE = { IN: 0.35, HOLD: 3.6, OUT: 0.5 };
  var storyTitle = function (c, text, time) {
    var a = time < TITLE.IN ? time / TITLE.IN : 1 - clamp((time - TITLE.HOLD) / TITLE.OUT, 0, 1);
    if (!(a > 0)) return;
    var W = c.canvas.width, H = c.canvas.height, k = H / 720, parts = String(text).split(/\\s*[,·|\u2013\u2014]\\s*/).filter(Boolean);
    var lines = parts.length > 1 ? [parts.slice(0, -1).join(', '), parts[parts.length - 1]] : [parts[0] || String(text)];
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = a; c.globalCompositeOperation = 'source-over'; c.setLineDash([]);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach(function (line, i) {
      var size = Math.round((i ? 24 : 40) * k), y = H * 0.1 + (i ? 46 * k : 0);
      line = line.toLocaleUpperCase('vi');
      c.font = '700 ' + size + "px 'Cinzel', 'Trajan Pro', Georgia, 'Times New Roman', serif";
      if ('letterSpacing' in c) c.letterSpacing = Math.round(size * (i ? 0.16 : 0.1)) + 'px';
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 8 * k; c.shadowOffsetY = 2 * k;
      c.lineJoin = 'round'; c.lineWidth = 5 * k; c.strokeStyle = 'rgba(28,22,18,0.85)'; c.strokeText(line, W / 2, y);
      c.shadowColor = 'rgba(0,0,0,0)'; c.fillStyle = '#f4ead2'; c.fillText(line, W / 2, y);
    });
    c.restore();
  };
  var header = function (c, text, dark, look) {
    if (look) return storyTitle(c, text, num(+look.time, 0));
    var W = c.canvas.width, H = c.canvas.height, k = H / 720, pad = 14 * k, size = Math.round(30 * k);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'rgba(0,0,0,0)'; c.setLineDash([]);
    c.font = '700 ' + size + "px 'Comic Sans MS', 'Patrick Hand', sans-serif";
    c.textBaseline = 'middle'; c.textAlign = 'left';
    var label = text.toUpperCase(), w = c.measureText(label).width + 2 * pad, h = size + 2 * pad, x = W * 0.05, y = H * 0.05, r = 12 * k;
    var card = function () { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.save(); c.translate(4 * k, 4 * k); card(); c.fill(); c.restore();
    card(); c.fillStyle = dark ? '#26211d' : '#fbf7ee'; c.fill();
    c.lineWidth = 4 * k; c.strokeStyle = '#1c1a18'; c.stroke();
    c.fillStyle = dark ? '#ebe2d0' : '#1c1a18'; c.fillText(label, x + pad, y + h / 2 + k);
    c.restore();
  };
  window.MotionFigures = {
    track: track,
    header: header,
    use: function () {
      var table = {};
      FNS.forEach(function (fn) {
        table[fn] = function (c, o) {
          var raw = o && typeof o === 'object' ? o : {};
          var gloves = fn === 'person' ? handLook(raw) : null;
          var opt = normalized(fn, raw);
          var heldThing = fn === 'person' ? heldOf.get(opt) || null : null;
          if (gloves && opt.gloves == null) opt = Object.assign({}, opt, { gloves: gloves });
          if (!opt.kind && THINGS.indexOf(fn) >= 0 && markKind(fn, opt)) opt = Object.assign({}, opt, { kind: markKind(fn, opt) });
          var K = kit(), out = null, view = window.__motionViewHooks;
          if (K && c && kitCan(fn, opt)) {
            if (view) view.kit++;
            try { out = KIT[fn](c, K, Object.assign({}, opt, { mark: undefined, seed: opt.seed != null ? opt.seed : seedOf(opt) }, fn === 'person' && !opt.talking && speakingNow(opt) ? { talking: true } : {})); } catch (e) { out = null; } finally { if (view) view.kit--; }
          }
          if (!out) return {};
          if (heldThing && Array.isArray(out.hand) && table.prop) {
            var hs = num(+opt.h, 100) * 0.22;
            try { table.prop(c, { kind: heldThing, x: +out.hand[0], y: +out.hand[1] + hs * 0.35, h: hs, w: hs }); } catch (e) {}
          }
          var res = typeof out === 'object' ? out : {};
          res.box = boxOf(fn, opt);
          markBox(c, opt, res.box, fn);
          if (view && fn === 'person' && c) view.person(c, opt, res, true);
          return res;
        };
      });
      table.device = function (c, o, inner) {
        if (!c || !o || typeof o !== 'object') return {};
        var out = null;
        asScene(function () { out = drawDevice(c, o, inner); });
        return out || {};
      };
      table.header = function (c, o) {
        var text = o && o.text != null ? String(o.text).trim() : '';
        if (!text || !c) return {};
        var view = window.__motionViewHooks;
        if (view) view.header = text; else header(c, text);
        return {};
      };
      return table;
    },
  };
})();`,
} as const;
