// One scene, two renderers. Every scene the AI writes registers its own drawing functions for the things the standard figure
// kit can draw (people, animals, vehicles, buildings, trees, props, bridges, walls, charts, meters, timelines, map icons,
// arrows, labels) through window.MotionFigures.use(own), and draws each of them as FIG.<fn>(ctx, o) with a box: the ground
// point (x, y), the standing height h and the width w, in the scene's own coordinates. "Dựng cảnh AI" runs the scene's own
// functions; "Bộ vẽ chuẩn" draws the same o with the kit, fitted into exactly that box (feet on y, height h, width w) in the
// colours o gives. Anything the kit has no drawing for stays the scene's own drawing. Positions, sizes, timing and colours
// always come from the scene; nothing is moved, resized or added.
export const MOTION_FIGURES = {
  ATTR: "data-motion-figures",
  // The style layer of each kit look ("Bộ vẽ chuẩn" only): outline ink and width factor, the tone every scene colour is
  // pulled toward (k: how far, sat: saturation factor, light: lightness shift), the finishing pass, the header card.
  STYLES: {
    outline: { ink: "#26201c", inkWidth: 1.25, tone: { col: [192, 136, 80], k: 0.06, sat: 1.08, light: 0.02 } },
    sketch: { ink: "#16172a", inkWidth: 0.85, tone: { col: [58, 64, 88], k: 0.2, sat: 0.72, light: 0 } },
    comic: { ink: "#15140f", inkWidth: 1.3, tone: { col: [90, 90, 58], k: 0.12, sat: 0.8, light: -0.02 }, finish: "grain" },
    horror: { ink: "#1c1a18", inkWidth: 1.2, tone: { col: [60, 70, 80], k: 0.3, sat: 0.45, light: -0.06 }, finish: "vignette", darkCard: true },
  } as Record<string, { ink: string; inkWidth: number; tone: { col: number[]; k: number; sat: number; light: number }; finish?: string; darkCard?: boolean }>,
  // A scene written against the figure contract (only those can switch renderer without a new drawing).
  USES: /MotionFigures\.use\s*\(/,
  // The kit is not on the page in "Dựng cảnh AI", so a scene that calls it directly cannot render there.
  KIT_CALL: /\bMotionKit\s*\./,
  KIT_CALL_ISSUE: "Cảnh gọi thẳng MotionKit – trang Dựng cảnh AI không có bộ vẽ chuẩn nên cảnh không chạy được, yêu cầu AI vẽ lại.",
  KIT_CALL_RETRY: "PREVIOUS ANSWER REJECTED: it called MotionKit, which is not on the page. Draw people, animals, vehicles, buildings, trees, props, bridges, walls, charts and map markers only through the FIG table from window.MotionFigures.use, everything else with your own canvas code, and answer again with the complete HTML.",
  // "Bộ vẽ chuẩn" only lends the scene its figures: each frame starts the kit's clock, and none of the kit's whole-frame
  // finishing (night tint, grain, header) runs, so the scene's own light, colours and header stay as the AI drew them.
  KIT_HOOK:
    "(function(){var v=window.motionScene;var wrap=function(x){if(x&&typeof x.renderAt==='function'&&!x.__motionKit){var f=x.renderAt;x.renderAt=function(i){var K=window.MotionKit,self=this,args=arguments;var go=function(){K.time(i&&typeof i.time==='number'?i.time:0);return f.apply(self,args)};return K.fontsLoaded()?go():K.fontsReady.then(go)};x.__motionKit=true}return x};Object.defineProperty(window,'motionScene',{configurable:true,get:function(){return v},set:function(x){v=wrap(x)}});wrap(v)})();",
  MISSING_WARNING: "Cảnh chưa vẽ nhân vật/đồ vật qua khung sườn chung – khi chọn Bộ vẽ chuẩn, cảnh này vẫn hiện nét AI vẽ.",
  // The figure contract every scene is written against (part of the drawing prompt).
  DOC: [
    "FIGURE TABLE (mandatory): people, animals, vehicles, buildings and tents, trees, props, bridges, walls and fences, charts, meters, timelines and map icons, arrows and labels are drawn only through one table. Once, before window.motionScene, write your own drawing function for each kind the scene uses and register them: const FIG = window.MotionFigures.use({ person(ctx, o) {...}, animal(ctx, o) {...}, vehicle, building, tree, prop, bridge, wall, chart, meter, timeline, icon, arrow, label }); then draw each item only as FIG.person(ctx, o), FIG.animal(ctx, o) and so on, inside your camera transforms (depth order is your draw order). The same o is drawn either by your function or by the standard figure kit fitted into the box o gives, so o describes the thing completely and your function draws exactly that box. window.MotionKit is never on the page. The FIGURES guide is how your person and animal functions draw (derive the head radius from o.h).",
    "THE BOX: x, y = the ground point under feet, hooves, wheels, trunk or base (top-left corner for chart, meter, timeline); h = full standing height in px (a person soles to head top or headgear; an animal hooves to ear tips without rider; a building to the roof top; a tree to the crown top), the same in every pose; w = full width at rest (shoulders with arms down, nose to tail, end to end, crown width). Return { box: {x, y, w, h} } (top-left and size of what you drew); a person also returns head, hand (near hand) and backHand as [x, y], eye (the y of its eye line) and hip (the y of its waist), an animal back (saddle point). A held object the person options do not cover (flask, chain end, rope) is drawn by you after FIG.person at the returned hand. No figure part is drawn outside its function (arms, heads, riders, saddles, held weapons), and every colour of a figure is in o.",
    "OPTIONS (read by your function and by the kit): person: facing 1|-1, view side|front|back, pose stand|walk|run|point|raise|wave|cheer|hold|carry|aim|fight|thrust|talk|pray|face|hips|sit|kneel|lie|fall|salute|drink|shrug|block|cower|crouch|push|read|bow|beckon|clap|chop|hammer|dig|row|pull|throw|climb|write|reload|ride (nearest one for any action), distance (px walked, walk/run), lean (degrees), look (-1..1), pointAt and reachAt [x, y], expression calm|happy|worried|scared|angry|stern|grave|sad|sleep|shout|surprised|dead, top (jacket colour), trim, pants, boots, belt, cape, robe, armor mail|plate, skin, hair, hairColor, beard moustache|full|goatee, head (headgear: kettle, nasal, coif, hood, cap, steppe, crown, turban, leafhat, tophat, shako, stahlhelm, modern...), headColor, hold (spear, sword, sabre, bow, crossbow, musket, rifle, torch, flag, shield, axe, staff, lantern, scroll, letter, basket, sack, cup...), itemColor, shield round|kite|scutum, shieldColor, barefoot, wounded, build slim|stocky. animal: kind (horse, ox, mule, camel, dog, sheep, elephant...), facing, view, pose stand|walk|run|graze, distance, color, mane, saddle, blanket, rider {person options} (the rider belongs to the animal). vehicle: kind (wagon, cart, chariot, cannon, trebuchet, catapult, boat, longship, galleon, ship, car, truck, tank, train, plane...), facing, color, cover, load, moving, firing, sail, crew {person options}. building: kind (house, cottage, hut, longhouse, tent, yurt, church, temple, pagoda, castle, tower, barn, windmill, ruins...), color, roof, trim, lit, burnt. tree: kind (oak, pine, birch, palm, willow, bamboo, dead, bush...), color, trunk. prop: kind (barrel, crate, sack, campfire, well, haystack, chest, table, cauldron, banner, torch, ladder, woodpile, chain, bucket... or any everyday object), color, facing, lying. bridge: side view x (centre), y (deck), w (span), h (deck to water), or into the picture from [x, y] (near bank) to [x, y] (far bank) with w (near deck width); color. wall: kind palisade|wall|gate|fence|wagonFort|sandbags, x (centre), y (base), w (length), h, color. chart: kind bar|line|pie, values, labels, colors, grow 0..1. meter: kind bar|gauge|thermometer, value 0..1, color, label. timeline: items [{year, label}], progress 0..1. icon: kind (pin, flag, swords, crown, shield, skull, star, house, person...), x, y (centre), r (radius of the whole symbol), color, appear 0..1 (grows in, default 1), pulse 0..1 (a ring around it, 0 = none). arrow: from, to, curve (px the middle bends sideways, positive = to the right of travel), width, color, dashed, grow 0..1. label: x, y, text, size, color. Any call may add mark: 'id' and seed.",
    "Everything else (sky, ground, water, hills, smoke, fire, light) is your own drawing; the time header is only FIG.header(ctx, { text }) as the last call of the frame (see LABELS). Read keyframes with MotionFigures.track(keys, input.progress) and phases with MotionFigures.phase(input.progress, N, input.cues) (see MOTION).",
  ].join("\n"),
  // How a scene is shown, over the scene the AI drew once (window.__motionView, set by the app before this script):
  // - style: "Bộ vẽ chuẩn" only. Every colour the scene paints goes through the style's tone (what the scene reads back is
  //   what it set), thin dark outlines take the style's ink and width, and a finish (vignette and mist, paper grain) goes
  //   over the frame. Coordinates and paths are never touched, and the kit, which draws in its own style, is left alone.
  // - shot: the layout's virtual camera. One measuring pass records every person the figure table draws; the frame then
  //   follows the editor's rules: eyes on the upper third, the cut at the shot's point on the body (never a joint), the
  //   whole head kept in, a single subject on the third behind its look, a two-shot only when both fit the action-safe
  //   area (93 %) at that size, one zoom for the whole scene, a smoothed pan, never past the drawn frame.
  VIEW: `(function () {
  var cfg = window.__motionView || {}, S = cfg.style || null, SHOT = cfg.shot && cfg.shot !== 'wide' ? cfg.shot : null;
  var FOCUS = Array.isArray(cfg.focus) ? cfg.focus.map(String) : [];
  var hooks = window.__motionViewHooks = { kit: 0, header: null, person: function () {} };
  if ((!S && !SHOT) || typeof CanvasRenderingContext2D === 'undefined') return;
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
    if (!M || hooks.kit || !isScene(this)) return native.setTransform.apply(this, arguments);
    var m = !arguments.length ? new DOMMatrix() : typeof a === 'object' && a ? new DOMMatrix([a.a != null ? a.a : a.m11 != null ? a.m11 : 1, a.b != null ? a.b : a.m12 || 0, a.c != null ? a.c : a.m21 || 0, a.d != null ? a.d : a.m22 != null ? a.m22 : 1, a.e != null ? a.e : a.m41 || 0, a.f != null ? a.f : a.m42 || 0]) : new DOMMatrix([a, b, c, d, e, f]);
    var r = M.multiply(m);
    return native.setTransform.call(this, r.a, r.b, r.c, r.d, r.e, r.f);
  };
  proto.resetTransform = function () { if (!M || hooks.kit || !isScene(this)) return native.resetTransform.call(this); put(this); };
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
  var SAFE = 0.93, ZMAX = 8, SAMPLES = 20, SMOOTH = 4;
  var CUT = {
    cowboy: function (p) { return p.hip + 0.45 * (p.foot - p.hip); },
    medium: function (p) { return p.hip + 0.08 * (p.foot - p.hip); },
    mcu: function (p) { return p.eye + 0.6 * (p.hip - p.eye); },
  };
  var min = function (list, key) { return Math.min.apply(null, list.map(function (p) { return p[key]; })); };
  var max = function (list, key) { return Math.max.apply(null, list.map(function (p) { return p[key]; })); };
  // The frame for these people: a full shot keeps 9 % above the crown and about 5 % below the feet; closer shots put the
  // eyes on the upper third and the cut on the bottom edge; the crown never leaves the frame.
  var frameFor = function (people, fixed) {
    var top = min(people, 'top'), eye = min(people, 'eye'), cut = SHOT === 'full' ? max(people, 'foot') : Math.max.apply(null, people.map(CUT[SHOT]));
    var z = clamp(fixed || (SHOT === 'full' ? 0.86 / (cut - top) : (2 / 3) / (cut - eye)), 1, ZMAX);
    var viewTop = SHOT === 'full' ? top - 0.09 / z : eye - 1 / 3 / z;
    if (top - viewTop < 0.03 / z) viewTop = top - 0.03 / z;
    var left = Math.min.apply(null, people.map(function (p) { return p.x - p.half; })), right = Math.max.apply(null, people.map(function (p) { return p.x + p.half; }));
    var cx = people.length === 1 ? people[0].x + (people[0].facing * (1 / 6)) / z : (left + right) / 2;
    return { z: z, x: cx, y: viewTop + 0.5 / z };
  };
  var measure = async function (render, self, input) {
    var marks = window.__motionMarks, kept = Array.isArray(marks) ? marks.length : 0, frames = [];
    var duration = Number(input.duration) > 0 ? Number(input.duration) : 3, fps = Number(input.fps) > 0 ? Number(input.fps) : 30;
    recording = true;
    try {
      for (var i = 0; i <= SAMPLES; i++) {
        seen = [];
        var k = i / SAMPLES;
        await render.call(self, Object.assign({}, input, { progress: k, time: k * duration, frame: Math.round(k * duration * fps) }));
        frames.push(seen.filter(function (p) { return p.id !== null; }));
      }
    } finally { recording = false; seen = []; hooks.header = null; if (Array.isArray(marks)) marks.length = kept; }
    // The subjects: one person per mark (a mark shared by several people is a group, framed by the wide shot), the plan's
    // focal people first, then whoever stands largest over the scene. A second subject joins only when it stands at about
    // the same size and depth as the first, as a two-shot is framed; otherwise the shot is a single.
    var size = {}, group = {}, height = {}, ground = {};
    frames.forEach(function (f) {
      var count = {};
      f.forEach(function (p) { count[p.id] = (count[p.id] || 0) + 1; size[p.id] = (size[p.id] || 0) + (p.foot - p.top); (height[p.id] = height[p.id] || []).push(p.foot - p.top); (ground[p.id] = ground[p.id] || []).push(p.foot); });
      Object.keys(count).forEach(function (id) { if (count[id] > 1) group[id] = true; });
    });
    var median = function (list) { var s = list.slice().sort(function (a, b) { return a - b; }); return s[s.length >> 1]; };
    var ids = Object.keys(size).filter(function (id) { return !group[id]; }).sort(function (a, b) { var fa = FOCUS.indexOf(a), fb = FOCUS.indexOf(b); if ((fa >= 0) !== (fb >= 0)) return fa >= 0 ? -1 : 1; if (fa >= 0) return fa - fb; return size[b] - size[a]; });
    if (!ids.length) return null;
    var lead = ids[0], partner = ids.slice(1).filter(function (id) { var r = median(height[id]) / median(height[lead]); return r > 0.8 && r < 1.25 && Math.abs(median(ground[id]) - median(ground[lead])) < 0.06; })[0];
    ids = partner ? [lead, partner] : [lead];
    var pick = function (f, list) { return list.map(function (id) { return f.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean); };
    var zoomOf = function (list) { var zs = []; frames.forEach(function (f) { var ps = pick(f, list); if (ps.length) zs.push(frameFor(ps).z); }); zs.sort(function (a, b) { return a - b; }); return zs.length ? zs[zs.length >> 1] : 0; };
    var list = ids, z = zoomOf(list);
    // A pair whose bodies (shoulder to shoulder, with a little air) do not fit the action-safe area at this size is cut
    // to a single on the main subject.
    var span = function (ps) { return Math.max.apply(null, ps.map(function (p) { return p.x + p.half; })) - Math.min.apply(null, ps.map(function (p) { return p.x - p.half; })) + 0.04; };
    if (list.length > 1 && frames.some(function (f) { var ps = pick(f, list); return ps.length > 1 && span(ps) * z > SAFE; })) { list = ids.slice(0, 1); z = zoomOf(list); }
    if (!(z > 1.001)) return null;
    var pts = frames.map(function (f) { var ps = pick(f, list); return ps.length ? frameFor(ps, z) : null; });
    var first = pts.filter(Boolean)[0];
    for (var j = 0; j < pts.length; j++) if (!pts[j]) pts[j] = pts[j - 1] || first;
    var half = 0.5 / z;
    var smooth = pts.map(function (p, n) {
      var w = 0, sx = 0, sy = 0;
      for (var q = -SMOOTH; q <= SMOOTH; q++) { var r = pts[clamp(n + q, 0, pts.length - 1)], g = SMOOTH + 1 - Math.abs(q); w += g; sx += r.x * g; sy += r.y * g; }
      return { x: clamp(sx / w, half, 1 - half), y: clamp(sy / w, half, 1 - half) };
    });
    return { z: z, pts: smooth, subjects: list, people: pick(frames[SAMPLES >> 1], list) };
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
    var render = scene.renderAt, path;
    scene.renderAt = async function (input) {
      var self = this, args = arguments, opt = input || {};
      var canvas = document.getElementById('motion-canvas'), ctx = canvas && canvas.getContext('2d');
      M = null; zoom = 1;
      if (SHOT && path === undefined) { try { path = (await measure(render, self, opt)) || null; } catch (e) { path = null; } hooks.path = path; }
      if (path && canvas) {
        var f = clamp(Number(opt.progress) || 0, 0, 1) * (path.pts.length - 1), i = Math.floor(f), k = f - i, a = path.pts[i], b = path.pts[Math.min(i + 1, path.pts.length - 1)];
        var W = canvas.width, H = canvas.height;
        zoom = path.z;
        M = new DOMMatrix().translate(W / 2, H / 2).scale(zoom).translate(-(a.x + (b.x - a.x) * k) * W, -(a.y + (b.y - a.y) * k) * H);
        put(ctx);
      }
      hooks.header = null;
      active = true;
      try { await render.apply(self, args); } finally { active = false; M = null; zoom = 1; }
      if (!ctx) return;
      native.setTransform.call(ctx, 1, 0, 0, 1, 0, 0);
      finish(ctx, canvas.width, canvas.height);
      if (hooks.header) window.MotionFigures.header(ctx, hooks.header, S && S.darkCard);
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
  var LOOK = ['top', 'trim', 'pants', 'boots', 'belt', 'sleeve', 'robe', 'cape', 'armor', 'emblem', 'emblemColor', 'build', 'skin', 'hair', 'hairColor', 'beard', 'head', 'headColor', 'crest', 'hold', 'itemColor', 'shield', 'shieldColor', 'quiver', 'backpack', 'sword', 'barefoot', 'wounded'];
  var SPAN_WALLS = ['wall', 'gate', 'barbedWire'];
  var ROW_WALLS = ['fence', 'wagonFort', 'palisade', 'sandbags'];
  // The kit figure is stretched sideways to the scene's width only this far, so its drawing never distorts.
  var STRETCH_MIN = 0.8, STRETCH_MAX = 1.25;
  var seedOf = function (o) { if (o.seed != null) return o.seed; var s = String(o.mark == null ? '' : o.mark), h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return s ? h : undefined; };
  var kit = function () { return window.MotionKit || null; };
  var depth = 0;
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
    return { x: x - w / 2, y: y - h, w: w, h: h };
  };
  // Measures a kit drawing once from its own pixels: drawn standing at a reference size on a hidden canvas, its painted
  // extent (soft ground shadows left out) gives the height, width and how far it sits off its ground point. A pose never
  // changes the size, and every kind the kit draws, the added items included, fills the box it is given.
  var sizes = {}, PROBE = 30, PAD = 1400, SOLID = 110, probeCanvas = null;
  var painted = function (draw, ox, oy) {
    probeCanvas = probeCanvas || document.createElement('canvas');
    if (probeCanvas.width !== PAD) { probeCanvas.width = PAD; probeCanvas.height = PAD; }
    var c = probeCanvas.getContext('2d', { willReadFrequently: true });
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, PAD, PAD);
    try { draw(c); } catch (e) { return null; }
    var d = c.getImageData(0, 0, PAD, PAD).data, x0 = PAD, y0 = PAD, x1 = -1, y1 = -1;
    for (var y = 0; y < PAD; y++) for (var x = 0; x < PAD; x++) if (d[(y * PAD + x) * 4 + 3] > SOLID) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { left: ox - x0, right: x1 + 1 - ox, top: oy - y0, bottom: y1 + 1 - oy };
  };
  var measure = function (K, fn, o, key) {
    var id = [K.style ? K.style() : '', K.proportion ? K.proportion() : '', fn, o.kind || '', o.view || '', o.build || '', o.count || '', o.rider ? 'rider' : ''].join('|');
    if (sizes[id] !== undefined) return sizes[id];
    var probe = { kind: o.kind, view: o.view, build: o.build, count: o.count, x: PAD / 2, y: PAD - 100, seed: 1 };
    probe[key] = PROBE;
    if (fn === 'person' || fn === 'animal') probe.pose = 'stand';
    var box = painted(function (c) { K[fn](c, probe); }, PAD / 2, PAD - 100);
    sizes[id] = box && box.top > 0 && box.left + box.right > 0 ? { h: box.top / PROBE, w: (box.left + box.right) / PROBE, shift: (box.right - box.left) / 2 / PROBE } : null;
    return sizes[id];
  };
  // Draws o with the kit inside the scene's box: the size option makes the height h, a sideways stretch around the ground
  // point makes the width w (within the limits), and the points the kit returns are mapped through the same stretch.
  var fitted = function (c, K, fn, o, key, extra) {
    var unit = measure(K, fn, o, key);
    if (!unit) return null;
    var h = num(+o.h, 0), w = num(+o.w, 0), x = num(+o.x, 0), y = num(+o.y, 0);
    if (!(h > 0)) return null;
    var size = h / unit.h, natural = unit.w * size;
    var sx = w > 0 ? clamp(w / natural, STRETCH_MIN, STRETCH_MAX) : 1;
    var opt = Object.assign({}, o, extra || {});
    delete opt.h; delete opt.w; delete opt.r; delete opt.p; delete opt.mark;
    if (opt.seed == null) opt.seed = seedOf(o);
    opt[key] = size;
    var map = function (pt) { return Array.isArray(pt) ? [x + (pt[0] - x) * sx, pt[1]] : pt; };
    opt.x = x - (num(+o.facing, 1) < 0 ? -1 : 1) * unit.shift * size;
    c.save();
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
  // Any kind the kit draws, its own words for things included (a palace is drawn as a castle).
  var knows = function (K, fn, kind) { return typeof K.knows === 'function' && !!K.knows(fn, kind); };
  // Which kit function draws o, or null when the kit has no drawing for it (then the scene's own function draws it).
  var KIT = {
    person: function (c, K, o) { return fitted(c, K, 'person', o, 'r', { pose: o.pose && has(K.poses, o.pose) ? o.pose : 'stand' }); },
    animal: function (c, K, o) { return knows(K, 'animal', o.kind || 'horse') ? fitted(c, K, 'animal', o, 'p') : null; },
    vehicle: function (c, K, o) { return knows(K, 'vehicle', o.kind) ? fitted(c, K, 'vehicle', o, 'p') : null; },
    building: function (c, K, o) { return knows(K, 'building', o.kind) ? fitted(c, K, 'building', o, 'p') : null; },
    tree: function (c, K, o) { return knows(K, 'tree', o.kind || 'oak') ? fitted(c, K, 'tree', o, 'p') : null; },
    prop: function (c, K, o) { return knows(K, 'prop', o.kind) && SPAN_WALLS.indexOf(o.kind) < 0 && ROW_WALLS.indexOf(o.kind) < 0 && o.kind !== 'bridge' ? fitted(c, K, 'prop', o, 'p') : null; },
    wall: function (c, K, o) {
      if (!knows(K, 'prop', o.kind)) return null;
      var x = num(+o.x, 0), y = num(+o.y, 0), w = num(+o.w, 0), h = num(+o.h, 0);
      if (SPAN_WALLS.indexOf(o.kind) >= 0) { var opt = Object.assign({}, o, { width: w, height: h }); delete opt.w; delete opt.h; K.prop(c, opt); return { box: { x: x - w / 2, y: y - h, w: w, h: h } }; }
      if (ROW_WALLS.indexOf(o.kind) < 0) return null;
      // A row is measured with two and three pieces (a row has at least two): as many pieces as fill the length.
      var two = measure(K, 'prop', Object.assign({}, o, { count: 2 }), 'p'), three = measure(K, 'prop', Object.assign({}, o, { count: 3 }), 'p');
      if (!two || !three || !(h > 0)) return null;
      var p = h / two.h, step = (three.w - two.w) * p, count = step > 0.5 ? Math.max(2, 2 + Math.round((w - two.w * p) / step)) : 2;
      return fitted(c, K, 'prop', Object.assign({}, o, { count: count }), 'p');
    },
    bridge: function (c, K, o) {
      if (Array.isArray(o.from) && Array.isArray(o.to)) return null;
      var x = num(+o.x, 0), y = num(+o.y, 0), w = num(+o.w, 0), h = num(+o.h, 0);
      if (!(w > 0)) return null;
      var opt = Object.assign({}, o, { kind: 'bridge', width: w, height: h > 0 ? h : undefined });
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
    label: function (c, K, o) { K.label(c, o); return { box: { x: +o.x, y: +o.y, w: 0, h: 0 } }; },
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
  // Phases timed to the narration: cues is input.cues (the progress at which each spoken line starts).
  var phase = function (progress, count, cues) {
    var N = Math.max(1, Math.round(num(+count, 1))), p = clamp(num(+progress, 0), 0, 1), at = [], list = Array.isArray(cues) ? cues.map(Number).filter(function (v) { return isFinite(v) && v >= 0 && v < 1; }) : [];
    for (var i = 0; i < N; i++) {
      if (list.length >= 2) { var f = (i * list.length) / N, lo = Math.floor(f), a = list[lo], b = lo + 1 < list.length ? list[lo + 1] : 1; at.push(a + (b - a) * (f - lo)); }
      else at.push(i / N);
    }
    at[0] = 0;
    var index = 0;
    for (i = 0; i < N; i++) if (p >= at[i]) index = i;
    var end = index + 1 < N ? at[index + 1] : 1;
    return {
      index: index, count: N, at: at,
      k: end > at[index] ? Math.min(1, (p - at[index]) / (end - at[index])) : 1,
      of: function (k) { var a = at[k], b = k + 1 < N ? at[k + 1] : 1; return !(k >= 0 && k < N) ? 0 : p <= a ? 0 : p >= b ? 1 : (p - a) / (b - a); },
    };
  };
  // The header card, in screen pixels inside the 90 % title-safe area (SMPTE ST 2046-1), sized to the frame height.
  var header = function (c, text, dark) {
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
    phase: phase,
    header: header,
    use: function (own) {
      var mine = own && typeof own === 'object' ? own : {};
      var table = {};
      FNS.forEach(function (fn) {
        table[fn] = function (c, o) {
          var opt = o && typeof o === 'object' ? o : {};
          var K = kit(), out = null, view = window.__motionViewHooks;
          // The table records the box once; the kit draws without its own mark, keyed by a seed that follows the mark.
          // The kit draws in its own style, so the style layer stands aside while it draws.
          var byKit = false;
          if (K && c) {
            if (view) view.kit++;
            try { out = KIT[fn](c, K, Object.assign({}, opt, { mark: undefined, seed: opt.seed != null ? opt.seed : seedOf(opt) })); } catch (e) { out = null; } finally { if (view) view.kit--; }
            byKit = !!out;
          }
          // A figure drawn inside another (a rider in its animal's function) is part of that one, never a subject alone.
          var inner = depth > 0;
          depth++;
          try { if (!out) out = typeof mine[fn] === 'function' ? mine[fn](c, opt) : null; } finally { depth--; }
          var res = out && typeof out === 'object' ? out : {};
          res.box = boxOf(fn, opt);
          markBox(c, opt, res.box, fn);
          if (view && fn === 'person' && c && !inner) view.person(c, opt, res, byKit);
          return res;
        };
      });
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
