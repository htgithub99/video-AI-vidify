(function (root) {
  "use strict";
  const MT = root.MotionEngineText;
  const ME = root.MotionEngine;
  const U = ME.util;
  const GEN = (ME.GEN = ME.GEN || {});
  const T = root.THREE || null;
  GEN.T = T;
  GEN.X = (T && T.addons) || {};
  const SHAPES = [MT.BOX, MT.CYLINDER, MT.SPHERE, MT.CONE, MT.TORUS, MT.CAPSULE, MT.PLANE, MT.DISC, MT.RING, MT.EXTRUDE, MT.LATHE, MT.TUBE, MT.STROKE, MT.TEXT, MT.GROUP, MT.USE, MT.REPEAT, MT.LIGHT, MT.MODEL, MT.ARROW];
  GEN.library = GEN.library || {};
  GEN.setLibrary = (map) => {
    GEN.library = map || {};
  };
  const PATTERNS = [MT.NONE, MT.CONCRETE, MT.ASPHALT, MT.TILES, MT.BRICK, MT.WOOD, MT.PLANKS, MT.MARBLE, MT.METAL, MT.FABRIC, MT.GRASS, MT.DIRT, MT.SAND, MT.WATER, MT.STRIPES, MT.CHECKER, MT.CARPET, MT.STONE, MT.PLASTER, MT.PANELS, MT.LEATHER, MT.NOISE, MT.ROAD, MT.GRAVEL, MT.RUST];
  const LIGHT_TYPES = [MT.POINT, MT.SPOT, MT.SUN, MT.HEMI, MT.AMBIENT];
  const LIMITS = { nodes: 900, depth: 7, repeat: 400, instances: 4000, points: 64, lights: 16, defs: 24, materials: 60, text: 60 };
  GEN.SHAPES = SHAPES;
  GEN.PATTERNS = PATTERNS;
  GEN.LIMITS = LIMITS;
  const isNum = (v) => typeof v === MT.NUMBER && isFinite(v);
  const num = (v, d, a = -1e6, b = 1e6) => {
    const n = typeof v === MT.STRING && v.trim() !== MT.EMPTY ? Number(v) : v;
    return isNum(n) ? U.clamp(n, a, b) : d;
  };
  const vec = (v, d, n = 3, a = -1e4, b = 1e4) => {
    if (!Array.isArray(v)) return d ? d.slice() : null;
    const out = [];
    for (let i = 0; i < n; i++) out.push(num(v[i], d ? d[i] : 0, a, b));
    return out;
  };
  const COLOR_RE = MT.GEN_COLOR_RE;
  const NAMED = { white: MT.F2F2F2, black: MT.VALUE_111111, red: MT.C0262D, blue: MT.VALUE_2456B8, green: MT.VALUE_2F7D3A, yellow: MT.E8C33A, orange: MT.E07A26, grey: MT.VALUE_808080, gray: MT.VALUE_808080, silver: MT.B9BCC0, gold: MT.C9A24A, brown: MT.VALUE_6B4A2E, navy: MT.VALUE_1C2A4A, beige: MT.D8C8A8, cream: MT.EFE6D0, pink: MT.E59AB0, purple: MT.VALUE_6B3FA0, teal: MT.VALUE_2A7F80 };
  const color = (v, d) => {
    if (typeof v !== MT.STRING) return d;
    const s = v.trim().toLowerCase();
    if (COLOR_RE.test(s)) return s.length === 4 ? MT.SYMBOL_2 + s[1] + s[1] + s[2] + s[2] + s[3] + s[3] : s;
    return NAMED[s] || d;
  };
  GEN.num = num;
  GEN.vec = vec;
  GEN.color = color;
  const idOk = (s) => typeof s === MT.STRING && MT.GEN_ID_RE.test(s);
  GEN.idOk = idOk;
  const cleanMaterial = (m, errors, key) => {
    if (typeof m === MT.STRING) m = { color: m };
    if (!m || typeof m !== MT.OBJECT) {
      errors.push(MT.MATERIAL + key + MT.IS_NOT_AN_OBJECT);
      return { color: MT.VALUE_9A9A9A, roughness: 0.8, metalness: 0 };
    }
    const out = { color: color(m.color, MT.VALUE_9A9A9A), roughness: num(m.roughness, m.glass ? 0.05 : 0.75, 0, 1), metalness: num(m.metalness, 0, 0, 1) };
    const pattern = typeof m.pattern === MT.STRING ? m.pattern.toLowerCase() : MT.NONE;
    if (pattern !== MT.NONE) {
      if (PATTERNS.includes(pattern)) out.pattern = pattern;
      else errors.push(MT.MATERIAL + key + MT.UNKNOWN_PATTERN + m.pattern + MT.USE_ONE_OF + PATTERNS.join(MT.SYMBOL_19) + MT.SYMBOL_17);
    }
    if (m.patternColor) out.patternColor = color(m.patternColor, undefined);
    if (m.scale != null) out.scale = num(m.scale, 1, 0.02, 50);
    if (m.cols != null) out.cols = Math.round(num(m.cols, 4, 1, 40));
    if (m.rows != null) out.rows = Math.round(num(m.rows, 4, 1, 40));
    if (m.opacity != null && num(m.opacity, 1, 0, 1) < 1) out.opacity = num(m.opacity, 1, 0.02, 1);
    if (m.emissive) out.emissive = color(m.emissive, undefined);
    if (m.emissiveIntensity != null) out.emissiveIntensity = num(m.emissiveIntensity, 1, 0, 0.85);
    if (m.glass) out.glass = true;
    if (m.clearcoat != null) out.clearcoat = num(m.clearcoat, 0, 0, 1);
    if (m.double || m.side === MT.DOUBLE) out.double = true;
    if (m.flat) out.flat = true;
    if (m.lit === false || m.unlit) out.unlit = true;
    if (m.bump != null) out.bump = num(m.bump, 0.5, 0, 2);
    return out;
  };
  GEN.cleanMaterial = cleanMaterial;
  const cleanLight = (l, st, where) => {
    const requested = typeof l.type === MT.STRING ? l.type.trim().toLowerCase().replace(MT.LIGHT_TYPE_SEPARATORS_RE, MT.EMPTY).replace(MT.LIGHT_TYPE_SUFFIX_RE, MT.EMPTY) : MT.EMPTY;
    const aliases = { directional: MT.SUN, hemisphere: MT.HEMI };
    const normalized = aliases[requested] || requested || MT.POINT;
    const type = LIGHT_TYPES.includes(normalized) ? normalized : MT.POINT;
    if (!LIGHT_TYPES.includes(normalized)) st.errors.push(where + MT.LIGHT_TYPE_MUST_BE_ONE_OF + LIGHT_TYPES.join(MT.SYMBOL_19));
    else if (l.type !== type) st.warnings.push(where + MT.LIGHT_TYPE_NORMALIZED + type);
    const out = { shape: MT.LIGHT, type, color: color(l.color, MT.FFF4E0), intensity: num(l.intensity, type === MT.SUN ? 2.5 : type === MT.HEMI || type === MT.AMBIENT ? 0.6 : 3, 0, 60) };
    if (type === MT.POINT || type === MT.SPOT) {
      out.pos = vec(l.pos || l.position, [0, 3, 0]);
      out.distance = num(l.distance, type === MT.SPOT ? 30 : 14, 0, 300);
    }
    if (type === MT.SPOT || type === MT.SUN) out.target = vec(l.target, [0, 0, 0]);
    if (type === MT.SUN) out.pos = vec(l.pos || l.position, [-20, 30, 15]);
    if (type === MT.SPOT) {
      out.angle = num(l.angle, 35, 2, 89);
      out.penumbra = num(l.penumbra, 0.5, 0, 1);
    }
    if (type === MT.HEMI) out.ground = color(l.ground, MT.VALUE_3A3530);
    if (l.shadow) out.shadow = true;
    if (l.flash && typeof l.flash === MT.OBJECT) {
      const cols = Array.isArray(l.flash.colors)
        ? l.flash.colors
            .map((c) => color(c, null))
            .filter(Boolean)
            .slice(0, 4)
        : [];
      out.flash = { hz: num(l.flash.hz, 2, 0.1, 12), colors: cols.length ? cols : [out.color], phase: num(l.flash.phase, 0, 0, 1), duty: num(l.flash.duty, 0.5, 0.05, 0.95) };
    }
    if (l.flicker) out.flicker = num(l.flicker, 0.2, 0, 1);
    if (l.volume) out.volume = num(l.volume, 0.25, 0, 1);
    return out;
  };
  const cleanPoints2 = (pts, errors, where, min = 3) => {
    if (!Array.isArray(pts) || pts.length < min) {
      errors.push(where + MT.NEEDS_AT_LEAST + min + MT.X_Y_POINTS);
      return null;
    }
    return pts.slice(0, LIMITS.points).map((p) => [num(Array.isArray(p) ? p[0] : 0, 0, -500, 500), num(Array.isArray(p) ? p[1] : 0, 0, -500, 500)]);
  };
  const cleanNode = (n, st, depth, where) => {
    const errors = st.errors;
    if (!n || typeof n !== MT.OBJECT || Array.isArray(n)) {
      errors.push(where + MT.NODE_MUST_BE_AN_OBJECT);
      return null;
    }
    if (depth > LIMITS.depth) {
      errors.push(where + MT.NESTED_TOO_DEEP);
      return null;
    }
    st.count++;
    if (st.count > LIMITS.nodes) {
      if (st.count === LIMITS.nodes + 1) errors.push(MT.TOO_MANY_NODES_MAX + LIMITS.nodes + MT.USE_REPEAT_USE_FOR_COPIES);
      return null;
    }
    let shape = typeof n.shape === MT.STRING ? n.shape.toLowerCase() : typeof n.type === MT.STRING && SHAPES.includes(n.type.toLowerCase()) ? n.type.toLowerCase() : n.children ? MT.GROUP : n.ref ? (MT.MODEL_REF_RE.test(String(n.ref)) ? MT.MODEL : MT.USE) : MT.EMPTY;
    if (shape === MT.USE && MT.MODEL_REF_RE.test(String(n.ref || MT.EMPTY))) shape = MT.MODEL;
    if (shape === MT.CUBE) shape = MT.BOX;
    if (shape === MT.CYLINDER_Y || shape === MT.CYL) shape = MT.CYLINDER;
    if (!SHAPES.includes(shape)) {
      errors.push(where + MT.UNKNOWN_SHAPE_2 + n.shape + MT.ALLOWED + SHAPES.join(MT.SYMBOL_19) + MT.SYMBOL_17);
      return null;
    }
    if (shape === MT.LIGHT) {
      st.lights++;
      if (st.lights > LIMITS.lights) {
        errors.push(MT.TOO_MANY_LIGHTS_MAX + LIMITS.lights + MT.SYMBOL_17);
        return null;
      }
      return cleanLight(n, st, where);
    }
    const out = { shape };
    if (n.name && typeof n.name === MT.STRING) out.name = n.name.slice(0, 40);
    out.pos = vec(n.pos || n.position, [0, 0, 0]);
    if (n.rot || n.rotation) out.rot = vec(n.rot || n.rotation, [0, 0, 0], 3, -720, 720);
    if (n.scale != null) out.scale = Array.isArray(n.scale) ? vec(n.scale, [1, 1, 1], 3, 0.01, 100) : [num(n.scale, 1, 0.01, 100), num(n.scale, 1, 0.01, 100), num(n.scale, 1, 0.01, 100)];
    if (n.mat != null || n.material != null) {
      const m = n.mat != null ? n.mat : n.material;
      if (typeof m === MT.STRING && st.materials[m]) out.mat = m;
      else if (typeof m === MT.STRING && color(m, null)) out.mat = { color: color(m) };
      else if (m && typeof m === MT.OBJECT) out.mat = cleanMaterial(m, errors, where);
      else errors.push(where + MT.MATERIAL_2 + m + MT.IS_NOT_DEFINED_IN_MATERIALS);
    }
    if (n.shadow === false) out.noShadow = true;
    if (n.hidden) out.hidden = true;
    if (n.travel && typeof n.travel === MT.OBJECT && !Array.isArray(n.travel)) {
      const to = vec(n.travel.to, null);
      const start = num(n.travel.start, 0, 0, 1);
      if (to) out.travel = { to, start, end: Math.max(start + 0.05, num(n.travel.end, 1, 0, 1)) };
    }
    const size3 = (d) => vec(n.size, d, 3, 0.001, 2000);
    switch (shape) {
      case MT.BOX:
        out.size = size3([1, 1, 1]);
        if (n.bevel) out.bevel = num(n.bevel, 0.02, 0, Math.min(out.size[0], out.size[1], out.size[2]) * 0.45);
        break;
      case MT.CYLINDER:
      case MT.CONE:
        out.radius = num(n.radius, 0.5, 0.001, 500);
        if (shape === MT.CYLINDER && n.radiusTop != null) out.radiusTop = num(n.radiusTop, out.radius, 0, 500);
        if (shape === MT.CYLINDER && n.radiusBottom != null) out.radiusBottom = num(n.radiusBottom, out.radius, 0, 500);
        out.height = num(n.height, 1, 0.001, 2000);
        out.segments = Math.round(num(n.segments, 24, 3, 64));
        if (n.open) out.open = true;
        if (n.arc != null) out.arc = num(n.arc, 360, 1, 360);
        break;
      case MT.SPHERE:
        out.radius = num(n.radius, 0.5, 0.001, 500);
        out.segments = Math.round(num(n.segments, 24, 4, 64));
        if (n.hemisphere) out.hemisphere = true;
        break;
      case MT.TORUS:
        out.radius = num(n.radius, 0.5, 0.001, 500);
        out.tube = Math.min(num(n.tube, 0.05, 0.001, 100), out.radius * 0.6);
        if (n.arc != null) out.arc = num(n.arc, 360, 1, 360);
        break;
      case MT.CAPSULE:
        out.radius = num(n.radius, 0.2, 0.001, 100);
        out.height = num(n.height, 1, 0.001, 500);
        break;
      case MT.PLANE:
        out.size = vec(n.size, [1, 1], 2, 0.001, 4000);
        break;
      case MT.DISC:
        out.radius = num(n.radius, 0.5, 0.001, 2000);
        out.segments = Math.round(num(n.segments, 32, 3, 96));
        break;
      case MT.RING:
        out.radius = num(n.radius, 0.5, 0.001, 2000);
        out.inner = num(n.inner, out.radius * 0.7, 0, out.radius * 0.999);
        break;
      case MT.EXTRUDE:
        out.points = cleanPoints2(n.points || n.shapePoints, errors, where);
        if (!out.points) return null;
        out.depth = num(n.depth, 0.2, 0.001, 500);
        if (n.bevel) out.bevel = num(n.bevel, 0.01, 0, 2);
        if (Array.isArray(n.holes))
          out.holes = n.holes
            .slice(0, 12)
            .map((h, i) => cleanPoints2(h, errors, where + MT.HOLES + i + MT.SYMBOL_5))
            .filter(Boolean);
        if (n.smooth) out.smooth = true;
        break;
      case MT.LATHE:
        out.points = cleanPoints2(n.points, errors, where, 2);
        if (!out.points) return null;
        out.points = out.points.map((p) => [Math.abs(p[0]), p[1]]);
        out.segments = Math.round(num(n.segments, 32, 3, 96));
        break;
      case MT.STROKE:
        out.points = cleanPoints2(n.points, errors, where, 2);
        if (!out.points) return null;
        out.width = num(n.width, 0.02, 0.001, 20);
        if (n.closed) out.closed = true;
        if (n.fill) out.fill = true;
        if (n.straight) out.straight = true;
        break;
      case MT.TUBE:
        if (!Array.isArray(n.path) || n.path.length < 2) {
          errors.push(where + MT.TUBE_NEEDS_PATH_WITH_AT_LEAST_2);
          return null;
        }
        out.path = n.path.slice(0, LIMITS.points).map((p) => vec(p, [0, 0, 0]));
        out.radius = num(n.radius, 0.03, 0.001, 50);
        if (n.closed) out.closed = true;
        break;
      case MT.TEXT:
        out.text = String(n.text == null ? MT.EMPTY : n.text).slice(0, LIMITS.text);
        out.height = num(n.height || n.size, 0.3, 0.02, 50);
        out.color = color(n.color, MT.FFFFFF);
        if (n.bg || n.background) out.bg = color(n.bg || n.background, undefined);
        if (n.glow) out.glow = true;
        if (n.billboard || n.face === MT.CAMERA) out.billboard = true;
        out.weight = num(n.weight, 700, 300, 900);
        break;
      case MT.ARROW: {
        const from = vec(n.from, null),
          to = vec(n.to, null);
        if (!from || !to) {
          errors.push(where + MT.ARROW_NEEDS);
          return null;
        }
        out.from = from;
        out.to = to;
        out.pos = from.slice();
        delete out.rot;
        out.radius = num(n.radius, 0.03, 0.005, 1);
        out.color = color(n.color, MT.ARROW_COLOR);
        out.glow = n.glow !== false;
        break;
      }
      case MT.GROUP: {
        if (!Array.isArray(n.children)) {
          errors.push(where + MT.GROUP_NEEDS_CHILDREN);
          return null;
        }
        out.children = n.children.map((c, i) => cleanNode(c, st, depth + 1, where + MT.CHILDREN + i + MT.SYMBOL_5)).filter(Boolean);
        break;
      }
      case MT.MODEL: {
        const ref = String(n.ref || n.model || MT.EMPTY);
        const info = GEN.library[ref];
        const url = typeof n._url === MT.STRING ? n._url : info && info.url;
        const sz = Array.isArray(n._size) && n._size.length === 3 ? n._size : info && info.size;
        if (!url || !sz) {
          errors.push(where + MT.MODEL_REF + ref + MT.IS_NOT_IN_LIBRARY);
          return null;
        }
        out.ref = ref;
        out._url = url;
        out._size = sz.map((v) => num(v, 1, 0.01, 2000));
        if (n.length != null) out.length = num(n.length, out._size[2], 0.05, 2000);
        if (n.height != null) out.height = num(n.height, out._size[1], 0.05, 2000);
        if (n.width != null) out.width = num(n.width, out._size[0], 0.05, 2000);
        if (n.tint) out.tint = color(n.tint, undefined);
        break;
      }
      case MT.USE:
        if (!st.defs[n.ref]) {
          errors.push(where + MT.USE_REF + n.ref + MT.IS_NOT_IN_DEFS);
          return null;
        }
        out.ref = n.ref;
        if (n.tint) out.tint = color(n.tint, undefined);
        break;
      case MT.REPEAT: {
        const counts = vec(n.count, [1, 1, 1], 3, 1, 200).map((v) => Math.round(v));
        const total = counts[0] * counts[1] * counts[2];
        if (total > LIMITS.repeat) {
          errors.push(where + MT.REPEAT_COUNT_TOO_LARGE_MAX + LIMITS.repeat + MT.COPIES);
          return null;
        }
        out.count = counts;
        out.step = vec(n.step, [1, 1, 1], 3, -500, 500);
        if (n.jitter) out.jitter = num(n.jitter, 0, 0, 10);
        if (n.skip) out.skip = num(n.skip, 0, 0, 0.95);
        const inner = n.node || n.item || (Array.isArray(n.children) ? { shape: MT.GROUP, children: n.children } : null);
        if (!inner) {
          errors.push(where + MT.REPEAT_NEEDS_NODE);
          return null;
        }
        out.node = cleanNode(inner, st, depth + 1, where + MT.NODE);
        if (!out.node) return null;
        st.instances += total;
        break;
      }
    }
    return out;
  };
  GEN.cleanNodes = (list, st, where) => (Array.isArray(list) ? list : []).map((n, i) => cleanNode(n, st, 0, where + MT.SYMBOL_9 + i + MT.SYMBOL_5)).filter(Boolean);
  const newState = (materials) => ({ errors: [], warnings: [], count: 0, lights: 0, instances: 0, materials: materials || {}, defs: {} });
  GEN.newState = newState;
  const cleanMaterials = (raw, st) => {
    const out = {};
    if (raw && typeof raw === MT.OBJECT && !Array.isArray(raw)) {
      Object.keys(raw)
        .slice(0, LIMITS.materials)
        .forEach((k) => {
          if (!idOk(k)) return st.errors.push(MT.MATERIAL_NAME + k + MT.INVALID_LETTERS_DIGITS_ONLY);
          out[k] = cleanMaterial(raw[k], st.errors, k);
        });
    }
    return out;
  };
  GEN.cleanMaterials = cleanMaterials;
  const TIMES = [MT.DAY, MT.DUSK, MT.NIGHT, MT.DAWN, MT.OVERCAST, MT.INTERIOR, MT.INTERIOR_DARK];
  GEN.TIMES = TIMES;
  GEN.validateLocation = (raw) => {
    const st = newState();
    const L = raw && typeof raw === MT.OBJECT ? raw : {};
    const out = {};
    out.name = String(L.name || MT.EMPTY).slice(0, 80);
    out.interior = !!L.interior;
    out.time = TIMES.includes(L.time) ? L.time : out.interior ? MT.INTERIOR : MT.DAY;
    out.materials = cleanMaterials(L.materials, st);
    st.materials = out.materials;
    const defs = {};
    if (L.defs && typeof L.defs === MT.OBJECT && !Array.isArray(L.defs)) {
      const keys = Object.keys(L.defs).slice(0, LIMITS.defs);
      keys.forEach((k) => {
        if (idOk(k)) st.defs[k] = true;
      });
      keys.forEach((k) => {
        if (!idOk(k)) return st.errors.push(MT.DEF_NAME + k + MT.INVALID);
        const v = L.defs[k];
        const list = Array.isArray(v) ? v : v && Array.isArray(v.nodes) ? v.nodes : v && v.shape ? [v] : null;
        if (!list) return st.errors.push(MT.DEF + k + MT.MUST_BE_AN_ARRAY_OF_NODES);
        defs[k] = GEN.cleanNodes(list, st, MT.DEFS + k);
      });
    }
    out.defs = defs;
    out.nodes = GEN.cleanNodes(L.nodes, st, MT.NODES);
    for (const n of out.nodes) {
      if (n.shape !== MT.DISC && n.shape !== MT.RING && n.shape !== MT.PLANE) continue;
      const r = n.rot || [0, 0, 0];
      if (r[0] || r[2] || !n.pos || Math.abs(n.pos[1]) > 0.3) continue;
      const span = n.shape === MT.PLANE ? Math.max(...(n.size || [0])) : (n.radius || 0) * 2;
      if (span < 6) continue;
      n.rot = [-90, r[1] || 0, 0];
      st.warnings.push((n.name || n.shape) + MT.FLOOR_LAID_FLAT);
    }
    const g = L.ground && typeof L.ground === MT.OBJECT ? L.ground : {};
    out.ground = { size: vec(g.size, [80, 80], 2, 2, 4000), mat: typeof g.mat === MT.STRING && out.materials[g.mat] ? g.mat : g.mat && typeof g.mat === MT.OBJECT ? cleanMaterial(g.mat, st.errors, MT.GROUND) : { color: out.interior ? MT.VALUE_6D6A66 : MT.VALUE_5D6056, roughness: 0.92, pattern: out.interior ? MT.CONCRETE : MT.DIRT } };
    if (g.none) out.ground.none = true;
    const sky = L.sky && typeof L.sky === MT.OBJECT ? L.sky : {};
    out.sky = { top: color(sky.top, undefined), horizon: color(sky.horizon, undefined), sun: vec(sky.sun, null, 2, -90, 360) || undefined, clouds: num(sky.clouds, 0.3, 0, 1), stars: sky.stars == null ? undefined : !!sky.stars, city: sky.city == null ? undefined : num(sky.city, 0.5, 0, 1) };
    const fog = L.fog && typeof L.fog === MT.OBJECT ? L.fog : {};
    out.fog = { color: color(fog.color, undefined), density: num(fog.density, out.interior ? 0.012 : 0.008, 0, 0.2) };
    out.background = color(L.background, undefined);
    out.exposure = num(L.exposure, 1, 0.2, 4);
    out.ambient = num(L.ambient, 1, 0, 4);
    const marks = {};
    if (L.marks && typeof L.marks === MT.OBJECT) {
      Object.keys(L.marks)
        .slice(0, 40)
        .forEach((k) => {
          if (!idOk(k)) return;
          const v = vec(L.marks[k], null, Array.isArray(L.marks[k]) && L.marks[k].length >= 3 ? 3 : 2, -2000, 2000);
          if (v) marks[k] = v.length === 3 ? [v[0], v[2]] : v;
        });
    }
    out.marks = marks;
    const stage = L.stage && typeof L.stage === MT.OBJECT ? L.stage : {};
    out.stage = { center: vec(stage.center, [0, 0], 2, -2000, 2000), size: vec(stage.size, [10, 8], 2, 1, 400) };
    const cam = L.camera && typeof L.camera === MT.OBJECT ? L.camera : {};
    out.camera = { pos: vec(cam.pos, [0, 1.7, 9]), target: vec(cam.target, [0, 1.2, 0]), fov: num(cam.fov, 40, 10, 100) };
    if (st.instances > LIMITS.instances) st.errors.push(MT.TOO_MANY_REPEATED_COPIES_IN_TOTAL_MAX + LIMITS.instances + MT.SYMBOL_17);
    if (!out.nodes.length) st.errors.push(MT.NODES_IS_EMPTY_DRAW_THE_LOCATION);
    return { value: out, errors: st.errors, warnings: st.warnings, stats: { nodes: st.count, lights: st.lights, instances: st.instances } };
  };
  GEN.validateCharacter = (raw) => {
    const source = raw && typeof raw === MT.OBJECT ? raw : {},
      st = newState(),
      out = { materials: cleanMaterials(source.materials, st), parts: [], anchors: Object.create(null), poses: Object.create(null), motions: Object.create(null), expressions: Object.create(null) };
    st.materials = out.materials;
    const cleanTransform = (value) => {
      const result = {};
      if (value && value.pos) result.pos = vec(value.pos, [0, 0, 0]);
      if (value && value.rot) result.rot = vec(value.rot, [0, 0, 0], 3, -3600, 3600);
      if (value && value.scale != null) result.scale = typeof value.scale === MT.NUMBER ? [value.scale, value.scale, value.scale].map((x) => num(x, 1, 0.001, 100)) : vec(value.scale, [1, 1, 1], 3, 0.001, 100);
      if (value && typeof value.visible === MT.BOOLEAN) result.visible = value.visible;
      return result;
    };
    const geometry = (nodes, depth = 0) => (depth > LIMITS.depth ? [] : (Array.isArray(nodes) ? nodes : []).filter((node) => node && ![MT.MODEL, MT.USE, MT.LIGHT, MT.TEXT, MT.ARROW].includes(node.shape)).map((node) => ({ ...node, ...(node.children ? { children: geometry(node.children, depth + 1) } : {}), ...(node.node ? { node: geometry([node.node], depth + 1)[0] } : {}) })));
    for (const part of (Array.isArray(source.parts) ? source.parts : []).slice(0, 64)) {
      if (!part || !idOk(part.id) || out.parts.some((p) => p.id === part.id)) {
        st.errors.push(MT.CHARACTER_PART_INVALID);
        continue;
      }
      const nodes = GEN.cleanNodes(geometry(part.nodes), st, part.id);
      out.parts.push({ id: part.id, ...cleanTransform(part), ...(idOk(part.parent) ? { parent: part.parent } : {}), nodes });
    }
    const ids = new Set(out.parts.map((p) => p.id));
    for (const part of out.parts) {
      const seen = new Set([part.id]);
      let parent = part.parent;
      while (parent) {
        if (!ids.has(parent) || seen.has(parent)) {
          delete part.parent;
          st.errors.push(MT.CHARACTER_PARENT_INVALID + part.id);
          break;
        }
        seen.add(parent);
        parent = out.parts.find((p) => p.id === parent).parent;
      }
    }
    const visible = (nodes) => nodes.some((node) => (node.shape === MT.GROUP ? visible(node.children || []) : node.shape === MT.REPEAT ? node.node && visible([node.node]) : true));
    if (!out.parts.some((p) => visible(p.nodes))) {
      out.parts = [];
      st.errors.push(MT.CHARACTER_GEOMETRY_REQUIRED);
    }
    for (const [name, id] of Object.entries(source.anchors || {}).slice(0, 64)) if (idOk(name) && ids.has(id)) out.anchors[name] = id;
    for (const [name, pose] of Object.entries(source.poses || {}).slice(0, 64)) {
      if (!idOk(name) || !pose || typeof pose !== MT.OBJECT) continue;
      out.poses[name] = {};
      for (const [id, value] of Object.entries(pose)) if (ids.has(id)) out.poses[name][id] = cleanTransform(value);
    }
    for (const [name, expression] of Object.entries(source.expressions || {}).slice(0, 24)) {
      if (!idOk(name) || !expression || typeof expression !== MT.OBJECT) continue;
      out.expressions[name] = {};
      for (const [id, value] of Object.entries(expression)) if (ids.has(id)) out.expressions[name][id] = cleanTransform(value);
    }
    for (const [name, motion] of Object.entries(source.motions || {}).slice(0, 64)) {
      if (!idOk(name) || !motion || typeof motion !== MT.OBJECT) continue;
      const duration = num(motion.duration, 1, 0.05, 120),
        tracks = [];
      for (const track of (Array.isArray(motion.tracks) ? motion.tracks : []).slice(0, 64)) {
        if (!track || !ids.has(track.part)) continue;
        const keys = (Array.isArray(track.keys) ? track.keys : [])
          .filter((k) => k && typeof k === MT.OBJECT)
          .slice(0, 64)
          .map((k) => ({ t: num(k.t, 0, 0, duration), ...cleanTransform(k) }))
          .sort((a, b) => a.t - b.t);
        if (keys.length) tracks.push({ part: track.part, keys });
      }
      if (tracks.length)
        out.motions[name] = {
          duration,
          loop: !!motion.loop,
          tracks,
          events: (Array.isArray(motion.events) ? motion.events : [])
            .slice(0, 24)
            .filter((event) => event && typeof event.kind === MT.STRING)
            .map((event, index) => ({ id: String(event.id || index).slice(0, 80), t: num(event.t, 0, 0, duration), kind: event.kind.slice(0, 40), description: String(event.description || MT.EMPTY).slice(0, 240), part: ids.has(event.part) ? event.part : undefined })),
        };
    }
    return { value: out, errors: st.errors, warnings: st.warnings };
  };
  const nodeExtent = (n) => {
    if (!n) return 0;
    const sc = Array.isArray(n.scale) ? Math.max(...n.scale.map(Math.abs)) : typeof n.scale === MT.NUMBER ? Math.abs(n.scale) : 1;
    let e = 0;
    if (Array.isArray(n.size)) e = Math.max(e, ...n.size);
    if (n.radius) e = Math.max(e, n.radius * 2);
    if (n.height) e = Math.max(e, n.height);
    if (n.depth) e = Math.max(e, n.depth);
    if (Array.isArray(n.children)) for (const c of n.children) e = Math.max(e, nodeExtent(c) + Math.max(...(c.pos || [0]).map(Math.abs)));
    return e * sc;
  };
  GEN.smallNodes = (raw, st, where, max) => {
    const keep = [];
    (Array.isArray(raw) ? raw : []).forEach((n, j) => {
      if (!n || typeof n !== MT.OBJECT) return;
      const shape = String(n.shape || MT.EMPTY).toLowerCase();
      const missing = (shape === MT.BOX && !Array.isArray(n.size)) || (MT.ROUND_SHAPES.includes(shape) && !(+n.radius > 0));
      if (missing) return st.errors.push(where + MT.NODES_2 + j + MT.SMALL_NEEDS_SIZE);
      keep.push(n);
    });
    return GEN.cleanNodes(keep, st, where).filter((n, j) => {
      const e = nodeExtent(n);
      if (e <= max) return true;
      st.errors.push(where + MT.NODES_2 + j + MT.SMALL_IS + e.toFixed(2) + MT.SMALL_TOO_BIG + max + MT.M_2);
      return false;
    });
  };
  GEN.actionId = (value) => {
    const name = String(value || MT.IDLE)
      .trim()
      .toLowerCase()
      .replace(MT.GEN_WORD_SEPARATOR_RE, MT.SYMBOL_10);
    return idOk(name) ? name : null;
  };
  GEN.SHOTS = [MT.WIDE, MT.MEDIUM, MT.CLOSE, MT.EXTREME_CLOSE, MT.OVER_SHOULDER, MT.LOW, MT.HIGH, MT.AERIAL, MT.INSERT, MT.POV];
  GEN.MOVES = [MT.STATIC, MT.DOLLY_IN, MT.DOLLY_OUT, MT.PAN_LEFT, MT.PAN_RIGHT, MT.ORBIT_LEFT, MT.ORBIT_RIGHT, MT.CRANE_UP, MT.CRANE_DOWN, MT.TRUCK_LEFT, MT.TRUCK_RIGHT, MT.FOLLOW, MT.HANDHELD];
  GEN.validateStaging = (raw, ctx) => {
    const errors = [];
    const warnings = [];
    const s = raw && typeof raw === MT.OBJECT ? raw : {};
    const out = {};
    const locs = (ctx && ctx.locations) || {};
    const loc = typeof s.location === MT.STRING && locs[s.location] ? s.location : null;
    if (!loc) errors.push(MT.LOCATION_MUST_BE_ONE_OF + Object.keys(locs).join(MT.SYMBOL_19));
    out.location = loc || Object.keys(locs)[0] || MT.EMPTY;
    const L = locs[out.location] || { marks: {}, materials: {} };
    if (s.time && TIMES.includes(s.time)) out.time = s.time;
    const castKeys = (ctx && ctx.cast) || [];
    const point2 = (v, where) => {
      if (typeof v === MT.STRING) {
        if (L.marks && L.marks[v]) return L.marks[v].slice();
        errors.push(where + MT.MARK + v + MT.DOES_NOT_EXIST_IN_THE_LOCATION);
        return null;
      }
      const p = vec(v, null, Array.isArray(v) && v.length >= 3 ? 3 : 2, -2000, 2000);
      return p ? (p.length === 3 ? [p[0], p[2]] : p) : null;
    };
    out.actors = [];
    (Array.isArray(s.actors) ? s.actors : []).slice(0, 8).forEach((a, i) => {
      if (!a || typeof a !== MT.OBJECT) return;
      const cast = String(a.cast || a.who || MT.EMPTY);
      if (!castKeys.includes(cast)) return errors.push(MT.ACTORS + i + MT.CAST + cast + MT.UNKNOWN_USE + castKeys.join(MT.SYMBOL_19) + MT.SYMBOL_17);
      const action = GEN.actionId(a.action) || MT.IDLE;
      if (a.action && !GEN.actionId(a.action)) errors.push(MT.ACTORS + i + MT.UNKNOWN_ACTION + a.action + MT.SYMBOL_16);
      const at = point2(a.at != null ? a.at : a.pos, MT.ACTORS + i + MT.AT) || [0, 0];
      const o = { cast, action, at };
      if (a.y != null) o.y = num(a.y, 0, -50, 200);
      if (a.face != null) {
        if (typeof a.face === MT.NUMBER || (typeof a.face === MT.STRING && MT.GEN_NUMBER_RE.test(a.face))) o.face = num(a.face, 0, -720, 720);
        else if (a.face === MT.CAMERA) o.face = MT.CAMERA;
        else if (typeof a.face === MT.STRING && castKeys.includes(a.face)) o.faceActor = a.face;
        else {
          const fp = point2(a.face, MT.ACTORS + i + MT.FACE_2);
          if (fp) o.faceAt = fp;
        }
      }
      if (a.moveTo != null || a.to != null) {
        const mt = point2(a.moveTo != null ? a.moveTo : a.to, MT.ACTORS + i + MT.MOVETO);
        if (mt) {
          o.moveTo = mt.map((value, axis) => U.clamp(value, L.stage.center[axis] - L.stage.size[axis] / 2, L.stage.center[axis] + L.stage.size[axis] / 2));
          o.moveStart = num(a.moveStart, 0, 0, 0.95);
          o.moveEnd = num(a.moveEnd, 1, o.moveStart + 0.05, 1);
          const then = a.then ? GEN.actionId(a.then) : null;
          if (then) o.then = then;
        }
      }
      if (a.then && !o.then) {
        const then = GEN.actionId(a.then);
        if (then) {
          o.then = then;
          o.thenAt = num(a.thenAt, 0.6, 0.05, 0.98);
        }
      }
      if (a.offset != null) o.offset = num(a.offset, 0, 0, 20);
      if (a.ghost) o.ghost = true;
      if (typeof a.expression === MT.STRING && idOk(a.expression)) o.expression = a.expression;
      if (a.talk === true) o.talk = [0, 1];
      else if (Array.isArray(a.talk) && a.talk.length === 2) o.talk = [num(a.talk[0], 0, 0, 1), num(a.talk[1], 1, 0, 1)];
      if (Array.isArray(a.hold) || (a.hold && typeof a.hold === MT.OBJECT)) {
        const st = newState(L.materials || {});
        const nodes = GEN.smallNodes(Array.isArray(a.hold) ? a.hold : a.hold.nodes || [a.hold], st, MT.ACTORS + i + MT.HOLD, 2.4);
        errors.push(...st.errors);
        warnings.push(...st.warnings);
        if (nodes.length) o.hold = { part: idOk(a.hold.part || a.part) ? a.hold.part || a.part : MT.BODY, nodes };
      }
      out.actors.push(o);
    });
    const st = newState(L.materials || {});
    Object.keys(L.defs || {}).forEach((key) => {
      st.defs[key] = true;
    });
    const withoutCallouts = (nodes) =>
      (Array.isArray(nodes) ? nodes : [])
        .filter((n) => n && n.shape !== MT.ARROW && !(n.shape === MT.TEXT && n.billboard))
        .map((n) => {
          const copy = Object.assign({}, n);
          if (n.children) copy.children = withoutCallouts(n.children);
          if (n.node) copy.node = withoutCallouts([n.node])[0];
          return copy;
        })
        .filter((n) => n.shape !== MT.REPEAT || n.node);
    out.props = GEN.cleanNodes(withoutCallouts(s.props), st, MT.PROPS);
    out.hide = Array.isArray(s.hide) ? s.hide.filter((x) => typeof x === MT.STRING).slice(0, 20) : [];
    errors.push(...st.errors);
    warnings.push(...st.warnings);
    const cleanCam = (cam) => {
      cam = cam && typeof cam === MT.OBJECT ? cam : {};
      const c = { shot: GEN.SHOTS.includes(cam.shot) ? cam.shot : MT.MEDIUM, move: GEN.MOVES.includes(cam.move) ? cam.move : MT.STATIC, amount: num(cam.amount, 1, 0, 4), angle: num(cam.angle, 0, -180, 180), fov: num(cam.fov, 0, 0, 100) || undefined, at: num(cam.at, 0, 0, 0.95) };
      if (cam.pos) c.pos = vec(cam.pos, [0, 1.6, 8]);
      if (cam.target) c.target = vec(cam.target, [0, 1.2, 0]);
      if (cam.focus && castKeys.includes(cam.focus)) c.focus = cam.focus;
      if (cam.focusProp && typeof cam.focusProp === MT.STRING) c.focusProp = cam.focusProp.slice(0, 40);
      if ([MT.FRONT, MT.PROFILE, MT.REAR].includes(cam.view)) c.view = cam.view;
      if (cam.follow && castKeys.includes(cam.follow)) c.follow = cam.follow;
      if (cam.dof != null) c.dof = num(cam.dof, 0.4, 0, 1);
      if (typeof cam.utterance === MT.STRING && cam.utterance) c.utterance = cam.utterance.slice(0, 100);
      return c;
    };
    const camList = Array.isArray(s.cameras) && s.cameras.length ? s.cameras : [s.camera || {}];
    out.cameras = camList
      .slice(0, 4)
      .map(cleanCam)
      .sort((a, b) => a.at - b.at);
    out.cameras[0].at = 0;
    out.cameras = out.cameras.filter((c, i, arr) => i === 0 || c.at - arr[i - 1].at >= 0.12);
    out.camera = out.cameras[0];
    if (s.tOffset != null) out.tOffset = num(s.tOffset, 0, 0, 600);
    if (s.beatDur != null) out.beatDur = num(s.beatDur, 0, 0, 600) || undefined;
    if (s.mood && typeof s.mood === MT.STRING) out.mood = s.mood.slice(0, 40);
    if (s.weather && [MT.RAIN, MT.SNOW, MT.FOG, MT.DUST, MT.NONE].includes(s.weather)) out.weather = s.weather;
    return { value: out, errors, warnings };
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
