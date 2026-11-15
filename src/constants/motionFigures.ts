// One scene, two renderers. Every scene the AI writes registers its own drawing functions for the things the standard figure
// kit can draw (people, animals, vehicles, buildings, trees, props, bridges, walls, charts, meters, timelines, map icons,
// arrows, labels) through window.MotionFigures.use(own), and draws each of them as FIG.<fn>(ctx, o) with a box: the ground
// point (x, y), the standing height h and the width w, in the scene's own coordinates. "Dựng cảnh AI" runs the scene's own
// functions; "Bộ vẽ chuẩn" draws the same o with the kit, fitted into exactly that box (feet on y, height h, width w) in the
// colours o gives. Anything the kit has no drawing for stays the scene's own drawing. Positions, sizes, timing and colours
// always come from the scene; nothing is moved, resized or added.
export const MOTION_FIGURES = {
  ATTR: "data-motion-figures",
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
    "THE BOX: x, y = the ground point under feet, hooves, wheels, trunk or base (top-left corner for chart, meter, timeline); h = full standing height in px (a person soles to head top or headgear; an animal hooves to ear tips without rider; a building to the roof top; a tree to the crown top), the same in every pose; w = full width at rest (shoulders with arms down, nose to tail, end to end, crown width). Return { box: {x, y, w, h} } (top-left and size of what you drew); a person also returns head, hand (near hand) and backHand as [x, y], an animal back (saddle point). A held object the person options do not cover (flask, chain end, rope) is drawn by you after FIG.person at the returned hand. No figure part is drawn outside its function (arms, heads, riders, saddles, held weapons), and every colour of a figure is in o.",
    "OPTIONS (read by your function and by the kit): person: facing 1|-1, view side|front|back, pose stand|walk|run|point|raise|wave|cheer|hold|carry|aim|fight|thrust|talk|pray|face|hips|sit|kneel|lie|fall|salute|drink|shrug|block|cower|crouch|push|read|bow|beckon|clap|chop|hammer|dig|row|pull|throw|climb|write|reload|ride (nearest one for any action), distance (px walked, walk/run), lean (degrees), look (-1..1), pointAt and reachAt [x, y], expression calm|happy|worried|scared|angry|stern|grave|sad|sleep|shout|surprised|dead, top (jacket colour), trim, pants, boots, belt, cape, robe, armor mail|plate, skin, hair, hairColor, beard moustache|full|goatee, head (headgear: kettle, nasal, coif, hood, cap, steppe, crown, turban, leafhat, tophat, shako, stahlhelm, modern...), headColor, hold (spear, sword, sabre, bow, crossbow, musket, rifle, torch, flag, shield, axe, staff, lantern, scroll, letter, basket, sack, cup...), itemColor, shield round|kite|scutum, shieldColor, barefoot, wounded, build slim|stocky. animal: kind (horse, ox, mule, camel, dog, sheep, elephant...), facing, view, pose stand|walk|run|graze, distance, color, mane, saddle, blanket, rider {person options} (the rider belongs to the animal). vehicle: kind (wagon, cart, chariot, cannon, trebuchet, catapult, boat, longship, galleon, ship, car, truck, tank, train, plane...), facing, color, cover, load, moving, firing, sail, crew {person options}. building: kind (house, cottage, hut, longhouse, tent, yurt, church, temple, pagoda, castle, tower, barn, windmill, ruins...), color, roof, trim, lit, burnt. tree: kind (oak, pine, birch, palm, willow, bamboo, dead, bush...), color, trunk. prop: kind (barrel, crate, sack, campfire, well, haystack, chest, table, cauldron, banner, torch, ladder, woodpile, chain, bucket... or any everyday object), color, facing, lying. bridge: side view x (centre), y (deck), w (span), h (deck to water), or into the picture from [x, y] (near bank) to [x, y] (far bank) with w (near deck width); color. wall: kind palisade|wall|gate|fence|wagonFort|sandbags, x (centre), y (base), w (length), h, color. chart: kind bar|line|pie, values, labels, colors, grow 0..1. meter: kind bar|gauge|thermometer, value 0..1, color, label. timeline: items [{year, label}], progress 0..1. icon: kind (pin, flag, swords, crown, shield, skull, star, house, person...), r, color, pop. arrow: from, to, curve, width, color, dashed, grow 0..1. label: x, y, text, size, color. Any call may add mark: 'id' and seed.",
    "Everything else (sky, ground, water, hills, smoke, fire, light, the header) is your own drawing. Read keyframes with MotionFigures.track(keys, input.progress) and phases with MotionFigures.phase(input.progress, N, input.cues) (see MOTION).",
  ].join("\n"),
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
    return { x: x - w / 2, y: y - h, w: w, h: h };
  };
  // Measures a kit figure at a reference size, standing, so a pose never changes the figure's size.
  var sizes = {};
  var measure = function (K, fn, o, key) {
    var id = [K.style ? K.style() : '', K.proportion ? K.proportion() : '', fn, o.kind || '', o.view || '', o.build || '', o.count || ''].join('|');
    if (sizes[id]) return sizes[id];
    var probe = { kind: o.kind, view: o.view, build: o.build, count: o.count };
    probe[key] = 30;
    if (fn === 'person') probe.pose = 'stand';
    if (fn === 'animal') probe.pose = 'stand';
    var m = null;
    try { m = K.size(fn, probe); } catch (e) { m = null; }
    if (!m || !(m.height > 0) || !(m.width > 0)) return null;
    sizes[id] = { h: m.height / 30, w: m.width / 30, shift: (num(m.right, m.width / 2) - num(m.left, m.width / 2)) / 60 };
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
      var one = measure(K, 'prop', Object.assign({}, o, { count: 1 }), 'p'), two = measure(K, 'prop', Object.assign({}, o, { count: 2 }), 'p');
      if (!one || !two || !(h > 0)) return null;
      // As many pieces as fill the length: the first piece, then one step per further piece.
      var p = h / one.h, step = (two.w - one.w) * p, count = step > 0.5 ? Math.max(1, 1 + Math.round((w - one.w * p) / step)) : 1;
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
    icon: function (c, K, o) { if (!has(K.icons, o.kind)) return null; K.icon(c, o); var r = num(+o.r, 20); return { box: { x: +o.x - r, y: +o.y - r, w: 2 * r, h: 2 * r } }; },
    arrow: function (c, K, o) { K.arrow(c, o); return { box: { x: Math.min(o.from[0], o.to[0]), y: Math.min(o.from[1], o.to[1]), w: Math.abs(o.to[0] - o.from[0]), h: Math.abs(o.to[1] - o.from[1]) } }; },
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
  window.MotionFigures = {
    track: track,
    phase: phase,
    use: function (own) {
      var mine = own && typeof own === 'object' ? own : {};
      var table = {};
      FNS.forEach(function (fn) {
        table[fn] = function (c, o) {
          var opt = o && typeof o === 'object' ? o : {};
          var K = kit(), out = null;
          // The table records the box once; the kit draws without its own mark, keyed by a seed that follows the mark.
          if (K && c) { try { out = KIT[fn](c, K, Object.assign({}, opt, { mark: undefined, seed: opt.seed != null ? opt.seed : seedOf(opt) })); } catch (e) { out = null; } }
          if (!out) out = typeof mine[fn] === 'function' ? mine[fn](c, opt) : null;
          var res = out && typeof out === 'object' ? out : {};
          res.box = boxOf(fn, opt);
          markBox(c, opt, res.box, fn);
          return res;
        };
      });
      return table;
    },
  };
})();`,
} as const;
