// The figure table every scene is drawn through: window.MotionFigures.use() gives FIG.<fn>(ctx, o), which puts the options
// in the figure vocabulary's words and draws each thing with the kit in the chosen style, fitted into the box the scene
// gives (ground point x, y, height h, width w). A thing the kit cannot draw is left out, never drawn as something else.
export const MOTION_FIGURES = {
  ATTR: "data-motion-figures",
  // The style layer of each kit look ("Bộ vẽ chuẩn" only): outline ink and width factor, the tone every scene colour is
  // pulled toward (k: how far, sat: saturation factor, light: lightness shift), the finishing pass, the header card.
  STYLES: {
    outline: { ink: "#26201c", inkWidth: 1.25, tone: { col: [192, 136, 80], k: 0.06, sat: 1.08, light: 0.02 } },
    sketch: { ink: "#16172a", inkWidth: 0.85, tone: { col: [58, 64, 88], k: 0.2, sat: 0.72, light: 0 } },
    // split: dark tones lean to violet-navy, light ones to warm cream (lavender hills, sand ground, deep-navy nights).
    stick: { ink: "#2a1f1c", inkWidth: 1.15, tone: { col: [118, 104, 150], k: 0.05, sat: 1.1, light: 0.01, split: { shadow: [70, 60, 130], highlight: [250, 226, 182], k: 0.32 } } },
    comic: { ink: "#15140f", inkWidth: 1.3, tone: { col: [90, 90, 58], k: 0.12, sat: 0.8, light: -0.02 }, finish: "grain" },
    cutout: { ink: "#2b2622", inkWidth: 0.8, tone: { col: [74, 74, 64], k: 0.08, sat: 0.92, light: 0 } },
    horror: { ink: "#1c1a18", inkWidth: 1.2, tone: { col: [60, 70, 80], k: 0.3, sat: 0.45, light: -0.06 }, finish: "vignette", darkCard: true },
  } as Record<string, { ink: string; inkWidth: number; tone: { col: number[]; k: number; sat: number; light: number; split?: { shadow: number[]; highlight: number[]; k: number } }; finish?: string; darkCard?: boolean }>,
  // Bumped whenever the way a page's figures are drawn changes, so pictures captured the old way are drawn again.
  RENDER_REVISION: 7,
  // Each frame starts the kit's clock; the kit's own whole-frame finishing (night tint, grain, header) does not run, the
  // scene engine lights and finishes the frame itself.
  KIT_HOOK:
    "(function(){var v=window.motionScene;var wrap=function(x){if(x&&typeof x.renderAt==='function'&&!x.__motionKit){var f=x.renderAt;x.renderAt=function(i){var K=window.MotionKit,self=this,args=arguments;var go=function(){K.time(i&&typeof i.time==='number'?i.time:0);return f.apply(self,args)};return K.fontsLoaded()?go():K.fontsReady.then(go)};x.__motionKit=true}return x};Object.defineProperty(window,'motionScene',{configurable:true,get:function(){return v},set:function(x){v=wrap(x)}});wrap(v)})();",
  // How a scene is shown, over the scene the AI drew once (window.__motionView, set by the app before this script):
  // - style: "Bộ vẽ chuẩn" only. Every colour the scene paints goes through the style's tone (what the scene reads back is
  //   what it set), thin dark outlines take the style's ink and width, and a finish (vignette and mist, paper grain) goes
  //   over the frame. Coordinates and paths are never touched, and the kit, which draws in its own style, is left alone.
  // - shot: the layout's virtual camera. One measuring pass records every person the figure table draws; the frame then
  //   follows the editor's rules: eyes on the upper third, the cut at the shot's point on the body (never a joint), the
  //   whole head kept in, a single subject on the third behind its look, a two-shot only when both fit the action-safe
  //   area (93 %) at that size, one zoom for the whole scene, a smoothed pan, never past the drawn frame.
  VIEW: `(function () {
  var cfg = window.__motionView || {}, S = cfg.style || null, CUTOUT = cfg.movement === 'cutout';
  var FOCUS = Array.isArray(cfg.focus) ? cfg.focus.map(String) : [];
  // kit: the kit is drawing (its own device-space transforms and colours); screen: the scene draws over the frame (story
  // devices, the finishing light), outside the camera.
  var hooks = window.__motionViewHooks = { kit: 0, screen: 0, header: null, speak: null, person: function () {} };
  // Whether a person is speaking now: a speaker span of the narration names the person by its mark, id or cast key.
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
  // Colours: parsed once per string through a scratch context (not the scene canvas, so it is never toned).
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
  // What the scene set is what it reads back; only the paint is toned.
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
  // Thin dark strokes are outlines: the style's ink and width, and thinner in a closer shot (by the square root of the zoom).
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
  // The camera: every transform the scene sets is taken inside it, also after the scene resizes its canvas. The kit sets
  // device-space transforms of its own (read from the current transform, which already holds the camera), so it is left alone.
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
  // Every person the figure table draws, in frame shares: ground point, crown, eye line, waist and facing. The eye line
  // and waist are the ones the drawing returns (the kit's from its skeleton: the head centre is the eye line); without them,
  // the shares of the base figure design.
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
    // The width that must stay in frame: the drawn width, never less than a big cartoon head.
    var wide = Math.max(+o.w > 0 ? +o.w : 0, 0.5 * h), half = Math.abs(at(x + wide / 2, y)[0] - at(x - wide / 2, y)[0]) / 2;
    seen.push({ id: o.mark == null ? null : String(o.mark), x: foot[0], half: half, foot: foot[1], top: top, eye: eye, hip: hip, facing: +o.facing < 0 ? -1 : 1 });
  };
  // ---------- The camera: one shot list for every layout, two ways of moving through it ----------
  // A layout sets the shot sizes (the cinematographer's cut points on the lead: full = head to toe, cowboy = mid-thigh,
  // medium = just below the waist, mcu = mid-chest; wide = the whole master frame). The scene is cut into shots at the
  // narration cues (each at least PLAN.MIN_SHOT seconds; in "Điện ảnh" a long sentence is cut once more in its middle);
  // neighbouring shots differ by at least one size (else they are one shot: no jump cut). Inside a shot the smooth
  // movement pushes in slowly and follows the lead; the cut-out movement pushes in briefly at the shot's start, then
  // holds, panning at an even speed with a lead who crosses the frame. "Toàn cảnh" drifts by DRIFT (smooth) or holds still
  // (cut-out). "Tự động" picks the layout from the kind of scene. Story devices never hold the camera back (they are drawn
  // over the frame by the scene engine).
  var LAYOUT = cfg.layout || 'wide', INTENT = cfg.scene || {};
  var PAIRS = Array.isArray(cfg.pairs) ? cfg.pairs : [];
  var SAFE = 0.93, SMOOTH = 3;
  var PLAN = { SAMPLES: 24, MIN_SHOT: 1.8, LONG_SHOT: 7, PUSH: 0.08, PUSH_SECONDS: 1.2, DRIFT: 0.03, MIN_STEP: 1.18, TRAVEL: 0.15 };
  var ZMAX = { full: 3, cowboy: 4, medium: 5, mcu: 6 };
  // Where each size cuts the lead, as a share of their height from the crown (cartoon figures have big heads, so the cut
  // points are read on the drawn figure, not on a real body): full shows all of them, cowboy to mid-thigh, medium to
  // just below the waist, mcu to mid-chest. HEADROOM is the air above the crown.
  var CUT = { full: 1, cowboy: 0.76, medium: 0.6, mcu: 0.44 }, HEADROOM = { full: 0.07, cowboy: 0.06, medium: 0.06, mcu: 0.05 }, FOOTROOM = 0.04;
  var SEQUENCE = { wide: ['wide'], stage: ['full'], medium: ['full', 'cowboy'], cinematic: ['wide', 'medium', 'mcu', 'medium', 'mcu'], close: ['medium', 'mcu'] };
  var min = function (list, key) { return Math.min.apply(null, list.map(function (p) { return p[key]; })); };
  var max = function (list, key) { return Math.max.apply(null, list.map(function (p) { return p[key]; })); };
  // The frame for these people at one size: the crown HEADROOM below the top edge, the cut on the bottom edge (a full
  // shot keeps a little ground below the feet); a single is placed on a third with the room in front of the face.
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
    var marks = window.__motionMarks, kept = Array.isArray(marks) ? marks.length : 0, frames = [];
    var duration = Number(input.duration) > 0 ? Number(input.duration) : 3, fps = Number(input.fps) > 0 ? Number(input.fps) : 30;
    recording = true;
    // The samples are only read for where people stand: painted through a one-pixel clip, so the pixels cost nothing.
    var pc = document.getElementById('motion-canvas'), pctx = pc && pc.getContext('2d');
    try {
      for (var i = 0; i <= PLAN.SAMPLES; i++) {
        seen = [];
        var k = i / PLAN.SAMPLES;
        if (pctx) { proto.save.call(pctx); native.setTransform.call(pctx, 1, 0, 0, 1, 0, 0); proto.beginPath.call(pctx); proto.rect.call(pctx, 0, 0, 1, 1); proto.clip.call(pctx); }
        try { await render.call(self, Object.assign({}, input, { progress: k, time: k * duration, frame: Math.round(k * duration * fps) })); } finally { if (pctx) proto.restore.call(pctx); }
        frames.push(seen.filter(function (p) { return p.id !== null; }));
      }
    } finally { recording = false; seen = []; hooks.header = null; if (Array.isArray(marks)) marks.length = kept; }
    // Subjects: one person per mark (a mark shared by several people is a group, never framed closer than its wide shot),
    // the plan's focal person first, then whoever stands largest. A partner joins the frame when the plan pairs them with
    // the lead, or when they stand at about the same size and depth (a two-shot); a pair too wide for the frame at that
    // size is cut to a single.
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
    // "Tự động": a map, an establishing or wide scene is seen whole; a close scene close; a lead who travels in medium
    // shots; any other scene is cut like a film.
    var layout = LAYOUT;
    if (layout === 'auto') {
      var first = lead && frames.map(function (f, n) { return at(n, lead); }).filter(Boolean);
      var travels = first && first.length > 1 && Math.abs(first[first.length - 1].x - first[0].x) > PLAN.TRAVEL;
      var shot = String(INTENT.shot || '').toLowerCase(), kind = String(INTENT.kind || '').toLowerCase();
      layout = kind === 'map' || /establish|wide|overhead|aerial|extreme/.test(shot) ? 'wide' : /close/.test(shot) ? 'close' : travels ? 'medium' : 'cinematic';
    }
    if (String(INTENT.kind || '').toLowerCase() === 'map' || !lead) layout = 'wide';
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
          var ps = [at(n, lead)], q = partner && at(n, partner);
          if (q) ps.push(q);
          ps = ps.filter(Boolean);
          if (!ps.length) continue;
          var fr = frameFor(ps, sz);
          // A pair whose bodies do not fit the action-safe width at this size is framed as a single on the lead.
          if (ps.length > 1 && (max(ps.map(function (p) { return { v: p.x + p.half }; }), 'v') - min(ps.map(function (p) { return { v: p.x - p.half }; }), 'v') + 0.04) * fr.z > SAFE) fr = frameFor([ps[0]], sz);
          shotInfo.pts.push({ n: n, x: fr.x, y: fr.y, z: fr.z });
        }
        if (shotInfo.pts.length) {
          var zs = shotInfo.pts.map(function (p) { return p.z; }).sort(function (u, v) { return u - v; });
          shotInfo.z = zs[zs.length >> 1];
        }
      }
      // No jump cut: a shot that would look like its neighbour is part of it.
      var prev = shots[shots.length - 1];
      if (prev && Math.max(prev.z, shotInfo.z) / Math.max(1e-6, Math.min(prev.z, shotInfo.z)) < PLAN.MIN_STEP) { prev.b = b; prev.pts = prev.pts.concat(shotInfo.pts); continue; }
      shots.push(shotInfo);
    }
    // The way through each shot: the frame centres smoothed over a few samples; the cut-out movement pans at an even
    // speed from the shot's first frame to its last.
    shots.forEach(function (sh) {
      if (sh.z <= 1.001 || !sh.pts.length) { sh.z = 1; sh.path = null; return; }
      var half = 0.5 / sh.z, pts = sh.pts.map(function (p) { return { x: clamp(p.x, half, 1 - half), y: clamp(p.y - 0.5 / p.z + half, half, 1 - half) }; });
      if (CUTOUT) { var p0 = pts[0], p1 = pts[pts.length - 1], still = Math.abs(p1.x - p0.x) < PLAN.TRAVEL / 3; sh.path = still ? [{ x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }] : [p0, p1]; return; }
      sh.path = pts.map(function (p, i) { var w = 0, sx = 0, sy = 0; for (var q = -SMOOTH; q <= SMOOTH; q++) { var r = pts[clamp(i + q, 0, pts.length - 1)], g = SMOOTH + 1 - Math.abs(q); w += g; sx += r.x * g; sy += r.y * g; } return { x: sx / w, y: sy / w }; });
    });
    var leadPts = lead ? frames.map(function (f, n) { return at(n, lead); }) : [];
    var anchor = leadPts.filter(Boolean)[0];
    return { layout: layout, shots: shots, duration: duration, subjects: [lead, partner].filter(Boolean), lead: anchor ? { x: anchor.x, y: (anchor.top + anchor.foot) / 2 } : null };
  };
  var ease = function (s) { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };
  var shotAt = function (plan, progress) {
    var p = clamp(progress, 0, 1), shot = plan.shots[plan.shots.length - 1];
    for (var i = 0; i < plan.shots.length; i++) if (p < plan.shots[i].b) { shot = plan.shots[i]; break; }
    var u = clamp((p - shot.a) / Math.max(1e-6, shot.b - shot.a), 0, 1), local = (p - shot.a) * plan.duration;
    // The whole frame: the smooth movement drifts in by DRIFT on the lead's side; the cut-out movement holds still.
    if (shot.z <= 1.001) {
      if (CUTOUT || plan.layout !== 'wide' || !plan.lead) return { z: 1, x: 0.5, y: 0.5 };
      var zd = 1 + PLAN.DRIFT * ease(u), hd = 0.5 / zd;
      return { z: zd, x: clamp(0.5 + (plan.lead.x - 0.5) * (zd - 1) * 8, hd, 1 - hd), y: clamp(0.5 + (plan.lead.y - 0.5) * (zd - 1) * 8, hd, 1 - hd) };
    }
    var k = CUTOUT ? 1 + PLAN.PUSH * ease(local / PLAN.PUSH_SECONDS) : 1 + PLAN.PUSH * ease(u);
    var path = shot.path || [{ x: 0.5, y: 0.5 }], f = u * (path.length - 1), j = Math.floor(f), t = f - j, pa = path[j], pb = path[Math.min(j + 1, path.length - 1)];
    var z = shot.z * k, half = 0.5 / z;
    return { z: z, x: clamp(pa.x + (pb.x - pa.x) * t, half, 1 - half), y: clamp(pa.y + (pb.y - pa.y) * t, half, 1 - half) };
  };
  // The finishing pass of a style, in screen pixels over the whole frame (same grain on every frame and every export page).
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
      // The shots depend on the scene's length and narration cues: planned again when either changes.
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
      // Who is speaking now (the narration's speaker spans): the kit opens and closes their mouth.
      hooks.speak = { t: Number(opt.time) || 0, list: Array.isArray(opt.speaking) ? opt.speaking : [] };
      active = true;
      try { await render.apply(self, args); } finally { active = false; M = null; zoom = 1; }
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
  // Chained after any earlier hook on window.motionScene (the kit's clock), so this wrapper is the outermost.
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
  // The kit figure is stretched sideways to the scene's width only this far, so its drawing never distorts.
  var STRETCH_MIN = 0.8, STRETCH_MAX = 1.25;
  var speakingNow = function (o) { var v = window.__motionViewHooks; return !!(v && v.speaking && v.speaking(o)); };
  var seedOf = function (o) { if (o.seed != null) return o.seed; var s = String(o.mark == null ? '' : o.mark), h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return s ? h : undefined; };
  var kit = function () { return window.MotionKit || null; };
  // A hand's look (blackPalm, bloodyHands, sootHandColor...) is not a placement: the kit draws it as the colour of the
  // hands (gloves), so it is never a fault.
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
  // The figure vocabulary (motionFigureVocabulary, window.__motionVocab): every call's options are put in its words
  // before either renderer draws, so the scene's own function and the kit get the same options and show the same things.
  // What is left out is reported to the scene check as !fault:drop:fn.key.
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
      // holdingSpear: true holds a spear; sootFace or tornCloak is dirty, bloodySleeve wounded.
      if (!to && spec.holdPrefix) spec.holdPrefix.some(function (pre) { var k = plain(key); if (k.length > pre.length && k.slice(0, pre.length) === pre) { to = 'hold'; if (v === true) v = k.slice(pre.length); return true; } return false; });
      if (!to && spec.wordKeys && v) { var kw = wordsOf(key); Object.keys(spec.wordKeys).some(function (k) { if (kw.some(function (w) { return spec.wordKeys[k].indexOf(w) >= 0; })) { to = k; v = true; return true; } return false; }); }
      // A hand's look stays the scene's own word for its function (the kit draws it as the hands' colour).
      if (!to) { if (!(fn === 'person' && handLookKey(key))) dropped(fn, key); return; }
      if (spec.values[to]) {
        // A switch named by its word (helmet: true, mail: true) is that word; a colour given for headgear is its colour.
        var word = wordIn(spec, to, v === true ? key : v);
        if (word === undefined && typeof v === 'string' && HEX.test(v) && to === 'head') { if (o.headColor == null) out.headColor = v; word = wordIn(spec, 'head', key); }
        if (word === undefined && typeof v === 'string' && HEX.test(v) && to === 'shield') { if (o.shieldColor == null) out.shieldColor = v; word = 'round'; }
        // A held thing the hold words lack is drawn as its own prop in the hand (by the table, for both renderers).
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
  // Large things (a third of the frame height or more) are also recorded unmarked as ~fn:kind, so the scene check can
  // see when the frame cuts them or two of them stand on top of each other.
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
  // The box o gives: things stand on (x, y); a side-view bridge hangs from its deck at y down to the water; a chart, meter
  // or timeline has (x, y) as its top-left corner.
  var boxOf = function (fn, o) {
    var h = num(+o.h, 0), w = num(+o.w, 0), x = num(+o.x, 0), y = num(+o.y, 0);
    if (fn === 'bridge' && Array.isArray(o.from) && Array.isArray(o.to)) return { x: Math.min(o.from[0], o.to[0]) - w / 2, y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]) + w, h: Math.abs(o.to[1] - o.from[1]) };
    if (fn === 'bridge') return { x: x - w / 2, y: y, w: w, h: h };
    if (fn === 'chart' || fn === 'meter' || fn === 'timeline') return { x: x, y: y, w: w, h: h };
    // A map icon fills the circle of radius r; an arrow spans from..to. (Without these the box was empty and the scene
    // check read the icon or arrow as outside the frame.)
    if (fn === 'icon') { var r = num(+o.r, 20); return { x: x - r, y: y - r, w: 2 * r, h: 2 * r }; }
    if (fn === 'arrow' && Array.isArray(o.from) && Array.isArray(o.to)) return { x: Math.min(o.from[0], o.to[0]), y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]), h: Math.abs(o.to[1] - o.from[1]) };
    // A thing given only its height (the scene engine's items) gets the usual width of its kind of thing, so the camera,
    // the marks and the fire over a burning thing have a real box.
    if (!w && h) w = h * (BOX_ASPECT[fn] || 1);
    return { x: x - w / 2, y: y - h, w: w, h: h };
  };
  var BOX_ASPECT = { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1 };
  // Measures a kit drawing once from its own pixels: drawn standing at a reference size on a hidden canvas, its painted
  // extent (soft ground shadows left out) gives the height, width and how far it sits off its ground point. A pose never
  // changes the size, and every kind the kit draws, the added items included, fills the box it is given.
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
    // The body: the painted extent less thin parts reaching out at either side (a wagon's shaft, a cart's handles, a
    // flagpole's tip), which a scene's box does not count.
    var thin = Math.max(2, (y1 + 1 - y0) * THIN), b0 = x0, b1 = x1;
    while (b0 < b1 && cols[b0] < thin) b0++;
    while (b1 > b0 && cols[b1] < thin) b1--;
    return { left: ox - x0, right: x1 + 1 - ox, top: oy - y0, bottom: y1 + 1 - oy, bodyLeft: ox - b0, bodyRight: b1 + 1 - ox, edge: x0 <= 0 || y0 <= 0 || x1 >= PAD - 1 || y1 >= PAD - 1 };
  };
  var measure = function (K, fn, o, key) {
    // Measured with the seed it is drawn with: the kit picks variants by seed (a wagon with or without its cover).
    var seed = o.seed != null ? o.seed : 1;
    var id = [K.style ? K.style() : '', K.proportion ? K.proportion() : '', fn, o.kind || '', o.view || '', o.build || '', o.count || '', o.rider ? 'rider' : '', o.cover === false ? 'bare' : '', o.load || '', fn === 'person' ? [o.cape ? 'cape' : '', o.robe ? 'robe' : '', o.armor || '', o.outfit || '', o.region || ''].join(',') : '', seed].join('|');
    if (sizes[id] !== undefined) return sizes[id];
    var probe = { kind: o.kind, view: o.view, build: o.build, count: o.count, cover: o.cover, load: o.load, x: PAD / 2, y: PAD - 100, seed: seed };
    if (fn === 'person' || fn === 'animal') probe.pose = 'stand';
    // A person's width counts what it wears out to the side (a cape, a robe, an outfit's), so the kit fills the scene's box with it.
    if (fn === 'person') ['cape', 'robe', 'armor', 'outfit', 'region'].forEach(function (k) { if (o[k] != null) probe[k] = o[k]; });
    // A big thing (a galleon, an airship) drawn at the probe size can run off the probe canvas: it is measured again
    // smaller until it fits whole.
    var size = PROBE, box = null;
    for (var tries = 0; tries < 4; tries++) {
      probe[key] = size;
      box = painted(function (c) { K[fn](c, probe); }, PAD / 2, PAD - 100);
      if (!box || !box.edge) break;
      size /= 2.5;
    }
    // A person (its arms are part of its width) and a row of pieces (count: its ends are its length) are measured whole;
    // anything else by its body.
    var body = box && fn !== 'person' && o.count == null, left = body ? box.bodyLeft : box && box.left, right = body ? box.bodyRight : box && box.right;
    sizes[id] = box && box.top > 0 && left + right > 0 ? { h: box.top / size, w: (left + right) / size, shift: (right - left) / 2 / size } : null;
    return sizes[id];
  };
  // A turn the scene gives a thing (angle or rotation, radians, clockwise around its ground point).
  var turnOf = function (o) { var a = num(+o.angle, num(+o.rotation, 0)); return Math.abs(a) <= Math.PI * 2 ? a : 0; };
  var truthy = function (v) { return v === true || (typeof v === 'number' && v > 0) || (typeof v === 'string' && v !== '' && v !== 'false') || (Array.isArray(v) && v.length > 0); };
  // A thing the kit draws at least LONG times as wide as tall is a long thing (spear, pole, oar).
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
  // Draws o with the kit inside the scene's box: the size option makes the height h, a sideways stretch around the ground
  // point makes the width w (within the limits), and the points the kit returns are mapped through the same stretch.
  // How far an elastic thing's length may follow its box (shorter, longer) before it keeps its shape.
  var ELASTIC = [0.85, 1.3];
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
    // A long thing (spear, pole, oar: the kit draws it lying) given as standing (its h is the longer side) stands on the
    // scene's point, h long, turned by angle around its foot like the scene's own drawing.
    if (fn === 'prop' && fit !== 'ground' && fit !== 'rigid' && unit.w >= unit.h * LONG && !(w > h)) return upright(c, K, o, opt, unit, key, x, y, h, angle);
    // A rigid or lying thing whose box has quite another shape than the standard drawing (a stump drawn as a fat log, a
    // squat barrel drawn tall) is the scene's own: the standard one would shrink inside the box and what rests on it (a sitter,
    // a load) would float.
    if (fn === 'prop' && (fit === 'rigid' || fit === 'ground') && w > 0 && h > 0) { var shape = (w / h) / (unit.w / unit.h); if (shape < SHAPE_FIT[0] || shape > SHAPE_FIT[1]) return null; }
    var size = h / unit.h, natural = unit.w * size;
    // A flat thing on the ground (a pond, a ditch, planks) is as long as its box: its height follows from its own shape.
    // Given only a height, a very flat one is at most LONG times that height long (its height alone would make a fallen
    // banner a bar across the frame).
    if (fit === 'ground' && !(w > 0) && natural > h * LONG) { w = h * LONG; }
    if (fit === 'ground' && w > 0) { size = w / unit.w; natural = w; h = unit.h * size; }
    var sx = w > 0 ? clamp(w / natural, STRETCH_MIN, STRETCH_MAX) : 1;
    // A thing fills exactly the box the scene gives, its length following the box; an elastic thing (a vehicle: round
    // wheels) follows the box's length only within ELASTIC, then keeps that shape, as large as fits and centred; a rigid
    // thing (an animal, a barrel) keeps its shape, as large as fits the box and centred in it; a person keeps its build
    // within the stretch limits.
    if (fit === 'rigid' || fit === 'elastic') {
      var most = fit === 'rigid' ? 1 : ELASTIC[1], least = fit === 'rigid' ? 1 : ELASTIC[0];
      sx = w > 0 ? clamp(w / natural, least, most) : 1;
      if (w > 0 && natural * sx > w) { size = w / (unit.w * sx); natural = unit.w * size; h = unit.h * size; }
    } else if (fn !== 'person' && w > 0) sx = w / natural;
    opt[key] = size;
    var map = function (pt) { return Array.isArray(pt) ? [x + (pt[0] - x) * sx, pt[1]] : pt; };
    // The scene's hand points, into the kit's unstretched drawing.
    if (Array.isArray(opt.handsAt)) opt.handsAt = opt.handsAt.map(function (pt) { return Array.isArray(pt) ? [x + (pt[0] - x) / sx, pt[1]] : pt; });
    opt.x = x - (num(+o.facing, 1) < 0 ? -1 : 1) * unit.shift * size;
    var overturned = fn !== 'person' && fn !== 'animal' && TURNED.some(function (k) { return truthy(o[k]); });
    c.save();
    // A figure seen against the light (silhouette) is drawn as a dark shape.
    if (o.silhouette) c.filter = 'brightness(0.22) saturate(0.35)';
    // Turned by angle around its ground point; an overturned thing lies upside down in its box.
    if (angle) { c.translate(x, y); c.rotate(angle); c.translate(-x, -y); }
    if (overturned) { c.translate(x, y - h / 2); c.rotate(Math.PI); c.translate(-x, -(y - h / 2)); }
    c.translate(x, y); c.scale(sx, 1); c.translate(-x, -y);
    var out;
    try { out = K[fn](c, opt); } finally { c.restore(); }
    var res = out && typeof out === 'object' ? Object.assign({}, out) : {};
    ['head', 'hand', 'backHand', 'back'].forEach(function (name) { if (res[name]) res[name] = map(res[name]); });
    if (res.rider && typeof res.rider === 'object') { res.rider = Object.assign({}, res.rider); ['head', 'hand', 'backHand'].forEach(function (name) { if (res.rider[name]) res.rider[name] = map(res.rider[name]); }); }
    res.box = { x: x - natural * sx / 2, y: y - h, w: natural * sx, h: h };
    return res;
  };
  var has = function (list, kind) { return Array.isArray(list) && list.indexOf(kind) >= 0; };
  // Amounts scenes often give instead of a pose (sitUp 0..1 from lying to sitting, crouchAmt 0..1 from standing to
  // crouching): past halfway the figure takes the second pose, below it the first.
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
  // How long a wagon is for its height, as the kit and the scenes draw one.
  var WAGON_ASPECT = 1.6, WAGON_SHAFT = 0.4;
  // The story's year (window.__motionView.year), or NaN when it names no time.
  var yearOf = function () { var v = window.__motionView && window.__motionView.year; return v == null ? NaN : +v; };
  // The object catalogue (motionObjectCatalog): which kit drawing shows a FIG call's kind in the story's year and the
  // build the scene gives. A word it does not list, a thing outside its years or a build it cannot draw returns null, and
  // the scene's own drawing shows it: the kit never draws something only like it.
  var CATALOG = window.__motionCatalog || { entries: [], words: {} };
  var wordOf = function (v) { return String(v == null ? '' : v).toLowerCase().replace(/[^a-z]/g, ''); };
  var THING_FNS = ['vehicle', 'building', 'prop', 'animal', 'tree'];
  var inYears = function (v, year) { return !(isFinite(year) && ((v.from != null && year < v.from) || (v.to != null && year > v.to))); };
  // A call without a kind is named by its mark ('wagons' is a wagon), as the scene check reads it.
  var markKind = function (fn, o) {
    var m = wordOf(o.mark), words = CATALOG.words[fn] || {};
    if (!m) return '';
    var one = [m, m.replace(/es$/, ''), m.replace(/s$/, '')].filter(function (w) { return words[w] != null; })[0];
    return one || '';
  };
  var pick = function (fn, o) {
    var words = CATALOG.words[fn] || {}, word = wordOf(o.kind), at = words[word];
    // A thing called through another thing function (FIG.prop for a tent) is still that thing.
    if (at == null && THING_FNS.indexOf(fn) >= 0) THING_FNS.some(function (other) { var hit = (CATALOG.words[other] || {})[word]; if (hit != null) at = hit; return hit != null; });
    var e = at == null ? null : CATALOG.entries[at], year = yearOf(), build = wordOf(o.build);
    if (!e || !inYears(e, year) || (build && e.builds && e.builds.indexOf(build) < 0)) return null;
    var byBuild = build ? e.variants.filter(function (v) { return v.builds && v.builds.indexOf(build) >= 0; })[0] : null;
    var byYear = e.variants.filter(function (v) { return !v.builds && inYears(v, year); })[0];
    var kit = (byBuild || byYear || {}).kit;
    return kit ? [kit[0], kit[1], e.fit || 'stretch'] : null;
  };
  // A state the kit cannot draw (broken, sinking, on fire, open...) or people the scene's function draws inside the thing
  // (passengers on a ferry): the scene's own drawing shows them.
  var STATES = ['broken', 'smashed', 'wrecked', 'collapsed', 'sinking', 'sunk', 'destroyed', 'damaged', 'burning', 'onFire', 'ablaze', 'open', 'opened', 'splintered', 'shattered', 'cracked'];
  var PEOPLE = ['passengers', 'occupants', 'people', 'riders', 'sailors', 'rowers', 'soldiers', 'refugees', 'figures'];
  var THINGS = ['animal', 'vehicle', 'building', 'tree', 'prop', 'wall'];
  // Options that carry the kit's own lists (a chain's points, a wagon fort's wagons, a chart's values...).
  var KIT_LISTS = ['points', 'wagons', 'from', 'to', 'values', 'labels', 'colors', 'items', 'groups', 'crew', 'load'];
  var kitCan = function (fn, o, nested) {
    if (THINGS.indexOf(fn) < 0) return true;
    if (STATES.some(function (k) { return truthy(o[k]); })) return false;
    // A call that hands its function a list of its own (a volley of arrows, each with its own place and flight) is many
    // things or an effect drawn by the scene's function, not one thing the kit could fit into the box.
    if (Object.keys(o).some(function (k) { var v = o[k]; return KIT_LISTS.indexOf(k) < 0 && Array.isArray(v) && v.length > 1 && v.some(function (e) { return e && typeof e === 'object'; }); })) return false;
    // People in the thing: the kit draws the thing only when the scene's function draws them with figure calls, which are
    // then drawn on it by the table; people painted straight into the thing keep the scene's whole drawing.
    return nested || !PEOPLE.some(function (k) { return truthy(o[k]); });
  };
  // A chain hangs across the scene's box: from its left to its right end at the top, sagging down to its bottom.
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
  // A wagon fort whose scene placed each wagon (o.wagons: boxes x, y, w, h): every wagon in its own box, chained front to
  // back, instead of the kit's evenly spaced row.
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
  // A bridge as it was built in the scene's period (build wood|stone|rope|iron|concrete; wood when the scene gives none):
  // drawn along its deck from one end (a) to the other (b), wa and wb the deck width at each end (a bridge seen from the
  // side is a deck a few px thick), drop the height from deck to water, rail the railing height.
  var BRIDGE_COLORS = { wood: '#8a6444', stone: '#a39d92', rope: '#8a6444', iron: '#5c626b', concrete: '#9a9c9e' };
  var BRIDGE_INK = '#2a2420', FAR_DECK = 0.56;
  var rgbOf = function (hex) { var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return null; var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  var shadeOf = function (hex, k) { var v = rgbOf(hex) || [128, 128, 128]; return 'rgb(' + v.map(function (n) { return Math.round(clamp(n * k, 0, 255)); }).join(',') + ')'; };
  // The scene's colour holds when it chose the build, or when the build is a modern one (its grey is then right).
  var bridgeColor = function (o, build) { return (o.build || build === 'concrete' || build === 'iron') && rgbOf(o.color) ? o.color : BRIDGE_COLORS[build]; };
  var drawBridge = function (c, o, build, a, b, wa, wb, drop, rail) {
    var base = bridgeColor(o, build);
    // The deck's width runs sideways on the screen (as the scenes draw it): a bridge into the picture is a band from the
    // near bank to the far one; a bridge seen from the side (a and b level) is a deck a few px thick, its width up and down.
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, level = Math.abs(dy) < 1, nx = level ? 0 : 1, ny = level ? 1 : 0;
    var sag = build === 'rope' ? Math.max(wa, wb) * 0.35 + len * 0.04 : 0;
    var at = function (t, side) { var hw = (wa + (wb - wa) * t) / 2, cx = a[0] + dx * t, cy = a[1] + dy * t + Math.sin(Math.PI * t) * sag; return [cx + nx * hw * side, cy + ny * hw * side]; };
    // Heights shrink with the deck toward the far end.
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
      // A stone face under the near edge, cut by an arch between each pair of piers.
      var face = near.concat(near.slice().reverse().map(function (q, i) { return [q[0], q[1] + dropAt(1 - i / N)]; }));
      poly(face, shadeOf(base, 0.82));
      for (k = 0; k < piers; k++) {
        var t0 = (k + 0.12) / piers, t1 = (k + 0.88) / piers, arch = [];
        for (var j = 0; j <= 12; j++) { t = t0 + (t1 - t0) * j / 12; var q = at(t, 1), d = dropAt(t); arch.push([q[0], q[1] + d - Math.sin(Math.PI * j / 12) * d * 0.72]); }
        arch.push([at(t1, 1)[0], at(t1, 1)[1] + dropAt(t1)]);
        poly(arch.concat([[at(t0, 1)[0], at(t0, 1)[1] + dropAt(t0)]]), 'rgba(18,22,30,0.82)');
      }
    } else if (build !== 'rope') {
      // Piles (wood) or piers (iron, concrete) from the deck down into the water.
      for (k = 0; k <= piers; k++) {
        t = Math.min(0.97, Math.max(0.03, k / piers));
        [1, -1].forEach(function (side) { var q = at(t, side); line([q, [q[0], q[1] + dropAt(t) * (side < 0 ? 0.8 : 1)]], Math.max(2, (wa + (wb - wa) * t) * (build === 'wood' ? 0.07 : 0.12)), side < 0 ? shadeOf(base, 0.55) : shadeOf(base, 0.72)); });
      }
      var edge = near.concat(near.slice().reverse().map(function (q) { return [q[0], q[1] + Math.max(3, (wa + wb) * 0.05)]; }));
      poly(edge, shadeOf(base, 0.7));
    }
    poly(near.concat(far.slice().reverse()), base);
    if (build === 'wood' || build === 'rope') {
      // Planks across the deck.
      var planks = Math.max(6, Math.round(len / Math.max(6, (wa + wb) * 0.09)));
      for (k = 1; k < planks; k++) { t = k / planks; line([at(t, -1), at(t, 1)], Math.max(1, lw * 0.6), shadeOf(base, 0.6)); }
    } else if (build === 'stone') {
      for (k = 1; k < piers * 3; k++) { t = k / (piers * 3); line([at(t, -1), at(t, 1)], Math.max(1, lw * 0.5), shadeOf(base, 0.75)); }
    }
    // Railing: posts and a rail (handropes on a rope bridge, a low parapet on stone).
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
  // Paint the figures runtime draws itself (not the kit) goes through the drawing style like the scene's own paint: its
  // colours are toned and its dark strokes inked.
  var asScene = function (draw) {
    var view = window.__motionViewHooks, held = view ? view.kit : 0;
    if (view) view.kit = 0;
    try { draw(); } finally { if (view) view.kit = held; }
  };
  // Story devices (FIG.device): what a picture cannot show by itself, drawn the same in both renderers through the
  // drawing style, never with words. thought and inset hold a small picture the scene draws inside them.
  // A count shows at most COUNT_MAX figures for its largest group (each one then stands for many).
  var DEVICE_INK = '#26201c', DEVICE_PAPER = '#fbf8ef', COUNT_MAX = 24;
  var devicePath = function (kind, x, y, r) {
    var p = new Path2D();
    if (kind === 'inset') { p.arc(x, y, r, 0, Math.PI * 2); return p; }
    // A thought bubble: a cloud about 1.5 r wide either side and r tall, of overlapping lobes.
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
        // Grows in from its centre; the tail points at what it comes from (a head, or the spot it magnifies).
        c.translate(x, y); c.scale(a, a); c.translate(-x, -y);
        var from = Array.isArray(o.from) ? [num(+o.from[0], x), num(+o.from[1], y + r * 2)] : null;
        if (from && kind === 'thought') for (var i = 0; i < 3; i++) { var t = 0.35 + i * 0.22, bx = x + (from[0] - x) * t, by = y + (from[1] - y) * t, br = r * (0.16 - i * 0.04); c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fillStyle = DEVICE_PAPER; c.fill(); c.stroke(); }
        if (from && kind === 'inset') { var d = Math.hypot(from[0] - x, from[1] - y) || 1; c.beginPath(); c.moveTo(x + (from[0] - x) / d * r, y + (from[1] - y) / d * r); c.lineTo(from[0], from[1]); c.stroke(); c.beginPath(); c.arc(from[0], from[1], r * 0.12, 0, Math.PI * 2); c.stroke(); }
        var p = devicePath(kind, x, y, r), box = kind === 'inset' ? { x: x - r * 0.75, y: y - r * 0.75, w: r * 1.5, h: r * 1.5 } : { x: x - r * 1.1, y: y - r * 0.68, w: r * 2.2, h: r * 1.36 };
        // The centre and radius too (cx, cy, r): pictures drawn around the bubble's centre land inside it.
        box.cx = x; box.cy = y; box.r = r;
        c.fillStyle = DEVICE_PAPER; c.fill(p);
        if (typeof inner === 'function') { c.save(); c.clip(p); try { inner(c, box); } catch (e) {} c.restore(); }
        c.lineWidth = Math.max(2, r * 0.06); c.stroke(p);
        return { box: { x: x - r * (kind === 'inset' ? 1 : 1.6), y: y - r * (kind === 'inset' ? 1 : 1.05), w: r * (kind === 'inset' ? 2 : 3.2), h: r * (kind === 'inset' ? 2 : 2.1) } };
      }
      if (kind === 'emote') { var sign = SIGNS[o.sign] || SIGNS.alarm; c.translate(x, y); c.scale(a, a); c.translate(-x, -y); sign(c, x, y, r); return { box: { x: x - r * 1.1, y: y - r * 1.4, w: r * 2.5, h: r * 2.4 } }; }
      if (kind === 'count') {
        // Blocks of small figures, one block per group side by side, as many figures as n (one figure for many when n is large).
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
        // The sun or moon along a dashed sky arc: progress 0 at the left horizon, 1 at the right.
        var pr = clamp(num(+o.progress, 0.5), 0, 1), ang = Math.PI + pr * Math.PI, sx = x + Math.cos(ang) * r, sy = y + Math.sin(ang) * r * 0.6, moon = o.body === 'moon';
        c.lineWidth = Math.max(1.2, r * 0.02); c.setLineDash([r * 0.05, r * 0.05]); c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, Math.PI, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = moon ? '#f2ecd2' : '#f6c34a'; c.beginPath(); c.arc(sx, sy, r * 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
        return { box: { x: x - r * 1.15, y: y - r * 0.8, w: r * 2.3, h: r * 0.95 } };
      }
      if (kind === 'sound') {
        // Rings spreading from the source on the side it faces, starting over every 1.2 s of input.time.
        var f = num(+o.facing, 1) < 0 ? -1 : 1, time = num(+o.t, 0);
        for (var j = 0; j < 3; j++) { var ph = ((time / 1.2) + j / 3) % 1, rr = r * (0.3 + ph * 0.9); c.globalAlpha = (1 - ph) * a; c.beginPath(); c.arc(x, y, rr, f > 0 ? -0.6 : Math.PI - 0.6, f > 0 ? 0.6 : Math.PI + 0.6); c.stroke(); }
        return { box: { x: f > 0 ? x : x - r * 1.3, y: y - r * 0.8, w: r * 1.3, h: r * 1.6 } };
      }
      if (kind === 'speed') {
        // Streaks trailing behind a fast mover: x, y = its back, facing = the way it goes; lines run toward -facing.
        var sf = num(+o.facing, 1) < 0 ? -1 : 1, st = num(+o.t, 0);
        c.lineWidth = Math.max(1.5, r * 0.045);
        for (var q = 0; q < 5; q++) { var lp = ((st * 1.6) + q * 0.37) % 1, ly = y + (q - 2) * r * 0.22, l0 = r * (0.15 + lp * 0.3), l1 = l0 + r * (0.55 + (q % 2) * 0.35) * a; c.globalAlpha = 0.85 * (1 - lp * 0.6); c.beginPath(); c.moveTo(x - sf * l0, ly); c.lineTo(x - sf * l1, ly); c.stroke(); }
        return { box: { x: sf > 0 ? x - r * 1.6 : x, y: y - r * 0.6, w: r * 1.6, h: r * 1.2 } };
      }
      if (kind === 'impact') {
        // A jagged burst where a blow, shot or crash lands: grows in with appear, flickers with t.
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
        // The subject in light, the rest of the frame dimmed: drawn over everything but the header.
        var g = c.createRadialGradient(x, y, r * 0.75, x, y, r * 1.6);
        g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(1, 'rgba(10,8,20,' + (0.45 * a).toFixed(3) + ')');
        c.fillStyle = g; c.fillRect(x - 5000, y - 5000, 10000, 10000);
        return { box: { x: x - r, y: y - r, w: 2 * r, h: 2 * r } };
      }
      return null;
    } finally { c.restore(); }
  };
  // A thing the catalogue lists, drawn by its kit drawing in the scene's box (a chain hangs across it).
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
      // A wall built of one library thing along its length (a row of stakes, an earthen bank): as many whole pieces as
      // fill the length, each as tall as the wall.
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
        // A wagon fort in one box: as many whole wagons as its length holds side by side, each as tall as the box, the
        // last one's shaft (WAGON_SHAFT of a wagon's length) still inside it.
        if (!(w > 0) || !(h > 0)) return null;
        var n = Math.max(1, Math.round(w / (h * WAGON_ASPECT))), each = w / (n + WAGON_SHAFT), left = num(+o.facing, 1) < 0 ? x - w / 2 + each * WAGON_SHAFT : x - w / 2;
        return wagonsIn(c, K, Object.assign({}, o, { wagons: Array.apply(null, Array(n)).map(function (_, i) { return { x: left + each * (i + 0.5), y: y, w: each * 0.94, h: h }; }) }));
      }
      // A row is measured with two and three pieces (a row has at least two): as many pieces as fill the length.
      var two = measure(K, 'prop', Object.assign({}, o, { count: 2 }), 'p'), three = measure(K, 'prop', Object.assign({}, o, { count: 3 }), 'p');
      if (!two || !three || !(h > 0)) return null;
      var p = h / two.h, step = (three.w - two.w) * p, count = step > 0.5 ? Math.max(2, 2 + Math.round((w - two.w * p) / step)) : 2;
      return fitted(c, K, 'prop', Object.assign({}, o, { count: count }), 'p');
    },
    bridge: function (c, K, o) {
      var w = num(+o.w, 0), k = pick('bridge', Object.assign({}, o, { kind: 'bridge' })), build = k && k[1];
      if (!(w > 0) || !build) return null;
      if (Array.isArray(o.from) && Array.isArray(o.to)) {
        // Into the picture: from the near bank (deck w wide across the screen) to the far bank, as narrow as the scenes draw
        // it there (FAR_DECK), piers and parapets in proportion to the near deck.
        var a = [num(+o.from[0], 0), num(+o.from[1], 0)], b = [num(+o.to[0], 0), num(+o.to[1], 0)];
        asScene(function () { drawBridge(c, o, build, a, b, w, w * FAR_DECK, w * 0.38, w * 0.24); });
        return { box: boxOf('bridge', o), deck: a };
      }
      var x = num(+o.x, 0), y = num(+o.y, 0), h = num(+o.h, 0);
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
    // An icon always shows at full size (appear 0..1 grows it in); pulse 0..1 (pop in older scenes) is a ring around it.
    // The kit's symbol is scaled so its painted extent fills the circle of radius r the scene gives.
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
    // curve is how far the middle of the arrow bends sideways, in px (to the right of travel when positive); the kit bends
    // by a share of the length.
    arrow: function (c, K, o) { var len = Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]) || 1; K.arrow(c, Object.assign({}, o, { curve: num(+o.curve, 0) / len })); return { box: { x: Math.min(o.from[0], o.to[0]), y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]), h: Math.abs(o.to[1] - o.from[1]) } }; },
    label: function (c, K, o) {
      // The kit reads a left-aligned label as the time header: a label that starts at x is centred on its own width instead.
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
  // Keyframe reading for both renderers: one monotone cubic through all keyframes (the speed carries on through a keyframe
  // where the move continues and through a keyframe on the scene's first or last frame; it eases only where a value holds
  // or turns back, and never overshoots). Numbers are read from the curve, other values from the keyframe that has started.
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
  // The header card, in screen pixels inside the 90 % title-safe area (SMPTE ST 2046-1), sized to the frame height.
  // The cut-out style's place and time title: centred at the top in serif capitals, the place large and the date
  // under it, in spaced capitals, light with a dark edge, fading in at the scene's start and out after a few seconds, like a storybook caption.
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
    // Capitals spaced apart (the canvas has no true small capitals in every browser).
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
      // Every figure is drawn by the kit in the chosen style, fitted into the box the scene gives; a thing the kit
      // cannot draw is left out (never something only like it).
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
            // While the kit draws, the camera and the style's tones stay off its own device-space transforms and colours.
            if (view) view.kit++;
            try { out = KIT[fn](c, K, Object.assign({}, opt, { mark: undefined, seed: opt.seed != null ? opt.seed : seedOf(opt) }, fn === 'person' && !opt.talking && speakingNow(opt) ? { talking: true } : {})); } catch (e) { out = null; } finally { if (view) view.kit--; }
          }
          if (!out) return {};
          // A held thing outside the hold words: a prop of that kind in the near hand, as large as a hand-held thing.
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
      // The time header is the video's own card in the title-safe corner, outside the camera: the scene only gives the text.
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
