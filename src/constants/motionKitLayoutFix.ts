// Layout guards applied on top of every kit skin (outline, sketch, comic, horror) through the public MotionKit API,
// which stage() also uses. They fix geometry the AI cannot reliably get right from the scene side:
// - a broad river (width >= 1200) is a straight water band across the whole frame from y (its far bank) down to
//   y + height, instead of a floating lens shape;
// - a ground band narrower than the frame drawn after such a river leaves water, not sky, beside it;
// - a cloud placed below the sky becomes ground mist, and a sky cloud never hangs from the top edge;
// - every frame keeps a map of its surfaces (ground bands, hills, water, bridge decks); people, animals, fires,
//   tents, props, buildings and land vehicles that land on open water or float in the sky are moved onto the
//   nearest surface at their x;
// - kit calls with mark: 'id' record their real bounding box for the scene QA, and large objects record theirs so
//   the QA can see when the frame cuts them.
export const MOTION_KIT_LAYOUT_FIX = `(function (K) {
    if (!K || K.__layoutFix) return;
    K.__layoutFix = true;
    const WORLD_L = -450, WORLD_R = 1730, WORLD_B = 980, BROAD = 1200, SKY_LINE = 260;
    const FLOAT_TOL = 0.05, WATER_EDGE = 0.012, DECK_TOL = 0.06, LARGE = 0.3;
    const WATER_KINDS = ['river', 'sea', 'lake', 'pond', 'swamp'];
    const STREAMS = ['stream', 'ford', 'creek', 'brook', 'moat', 'canal'];
    // A stream never stops in open land: without points it becomes a winding course that recedes from the near
    // ground toward the horizon (wide near, narrow far), and the near end of any course runs on past the frame edge.
    const streamCourse = (c, o) => {
      const x = n(o.x, 0), y = n(o.y, 0), R = n(o.r, 40), dir = n(o.facing, 1) < 0 ? -1 : 1, seed = n(o.seed, 1);
      let pts, thick;
      if (Array.isArray(o.points) && o.points.length > 1) { pts = o.points.map((q) => [+q[0], +q[1]]).filter((q) => isFinite(q[0]) && isFinite(q[1])); thick = Math.max(8, n(o.width, 0.9 * R)); }
      else {
        const half = Math.max(2 * R, n(o.width, 10 * R) / 2);
        thick = Math.max(10, n(o.height, 0.9 * R));
        pts = [];
        for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push([dir * (-half + k * 2 * half), (1 - k) * thick * 2.4 - k * thick * 1.4 + Math.sin(k * Math.PI * 2.2 + seed) * thick * 0.7]); }
      }
      if (pts.length < 2) return Object.assign({}, o, { kind: 'stream' });
      if (pts[0][1] < pts[pts.length - 1][1]) pts.reverse();
      const inside = (q) => x + q[0] > WORLD_L && x + q[0] < WORLD_R && y + q[1] < WORLD_B;
      let guard = 0;
      while (inside(pts[0]) && guard++ < 14) {
        const a = pts[0], b = pts[1], len = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, step = Math.max(120, thick * 3);
        pts.unshift([a[0] + ((a[0] - b[0]) / len) * step, a[1] + ((a[1] - b[1]) / len) * step + step * 0.35]);
      }
      const groundTop = (lx) => { const [sx] = toScreen(c, x + lx, y); const tops = S.grounds.filter((g) => sx >= g.l && sx <= g.r).map((g) => g.t); if (!tops.length) return null; const ly = toLocalY(c, x + lx, Math.min.apply(null, tops)); return ly == null ? null : ly - y; };
      pts = pts.map((q) => { const top = groundTop(q[0]); return top != null && q[1] < top + thick * 0.4 ? [q[0], top + thick * 0.4] : q; });
      const farOut = !inside(pts[pts.length - 1]);
      return Object.assign({}, o, { kind: 'stream', points: pts, width: thick, taper: farOut ? [1.25, 1] : [1.35, 0.3], ford: o.ford || o.kind === 'ford' });
    };
    const RIDGE_KINDS = ['hills', 'mountainRange', 'snowPeaks', 'dunes', 'plateau', 'cliff', 'valley', 'glacier', 'terraces'];
    const FREE = { animal: ['bird', 'birds', 'eagle', 'crow', 'raven', 'hawk', 'bat', 'fish', 'dragonfly', 'butterfly'], prop: ['boat', 'bridge', 'pier', 'net', 'fishTrap', 'rope', 'lantern', 'banner', 'window', 'door'], vehicle: ['boat', 'ship', 'raft', 'canoe', 'galley', 'junk', 'plane', 'aircraft', 'airship', 'balloon', 'helicopter', 'submarine'], effect: [], person: [] };
    const BOUND_EFFECTS = ['fire', 'bonfire', 'campfire'];
    const WET_POSES = ['swim', 'fall', 'drown', 'dive'];
    const LARGE_FNS = ['vehicle', 'building', 'prop'];
    const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : isFinite(+v) && v !== null && v !== '' ? +v : d);
    let busy = 0, water = null, map = false, S = { grounds: [], waters: [], decks: [], ridges: [] };
    const reset = () => { water = null; map = false; S = { grounds: [], waters: [], decks: [], ridges: [] }; };
    const dims = (c) => [c && c.canvas ? c.canvas.width : 1280, c && c.canvas ? c.canvas.height : 720];
    const toScreen = (c, x, y) => { const m = c.getTransform(); const [cw, ch] = dims(c); return [(m.a * x + m.c * y + m.e) / cw, (m.b * x + m.d * y + m.f) / ch]; };
    const toLocalY = (c, x, sy) => { const m = c.getTransform(); const [, ch] = dims(c); return Math.abs(m.d) > 1e-6 ? (sy * ch - m.f - m.b * x) / m.d : null; };
    const span = (c, x0, x1, y) => { const a = toScreen(c, x0, y), b = toScreen(c, x1, y); return [Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1]]; };
    const addWater = (c, x0, x1, y0, y1) => { const [l, r, t] = span(c, x0, x1, y0); S.waters.push({ l, r, t, b: toScreen(c, x0, y1)[1] }); };
    const addLine = (list, c, x0, x1, y) => { const [l, r, t] = span(c, x0, x1, y); list.push({ l, r, t }); };
    const issue = (text) => { const list = (window.__motionKitIssues = window.__motionKitIssues || []); if (list.length < 40) list.push(text); };
    const mark = (c, id, x0, y0, w, h, extra) => { if (typeof window.motionMark !== 'function') return; window.motionMark(c, id, x0, y0, w, h); const list = window.__motionMarks; if (Array.isArray(list) && list.length) Object.assign(list[list.length - 1], { src: 'kit', k: c.canvas && c.canvas.width ? Math.abs(c.getTransform().a) * 1280 / c.canvas.width : 1 }, extra || {}); };
    const surfaceAt = (sx, ridges) => {
      const lines = [];
      S.grounds.forEach((g) => { if (sx >= g.l && sx <= g.r) lines.push(g.t); });
      if (ridges) S.ridges.forEach((g) => { if (sx >= g.l && sx <= g.r) lines.push(g.t); });
      S.decks.forEach((g) => { if (sx >= g.l && sx <= g.r) lines.push(g.t); });
      S.waters.forEach((w) => { if (sx >= w.l && sx <= w.r) lines.push(w.t); });
      return lines;
    };
    const inWater = (sx, y) => S.waters.some((w) => sx >= w.l && sx <= w.r && y > w.t + WATER_EDGE && y < w.b - WATER_EDGE);
    const onDeck = (sx, sy) => S.decks.some((d) => sx >= d.l && sx <= d.r && Math.abs(sy - d.t) <= DECK_TOL);
    const settle = (c, fn, o, name) => {
      if (map || !o || o.z != null || !isFinite(+o.x) || !isFinite(+o.y)) return o;
      if (fn === 'effect' ? BOUND_EFFECTS.indexOf(o.kind) < 0 : (FREE[fn] || []).indexOf(o.kind) >= 0) return o;
      if (fn === 'person' && (WET_POSES.indexOf(o.pose) >= 0 || o.inWater)) return o;
      if (o.inWater || o.flying || o.airborne) return o;
      const [sx, sy] = toScreen(c, +o.x, +o.y);
      if (sx < -0.2 || sx > 1.2 || onDeck(sx, sy)) return o;
      let target = null;
      const wet = S.waters.find((w) => sx >= w.l && sx <= w.r && sy > w.t + WATER_EDGE && sy < w.b - WATER_EDGE);
      if (wet) {
        const shores = [wet.t - 0.002];
        S.grounds.forEach((g) => { if (sx >= g.l && sx <= g.r && g.t > wet.t) shores.push(g.t + 0.004); });
        if (wet.b < 1.2) shores.push(wet.b + 0.004);
        const dry = shores.filter((y) => !inWater(sx, y));
        const list = dry.length ? dry : [Math.min.apply(null, S.waters.filter((w) => sx >= w.l && sx <= w.r).map((w) => w.t)) - 0.002];
        target = list.reduce((best, y) => (Math.abs(y - sy) < Math.abs(best - sy) ? y : best), list[0]);
      } else {
        const all = surfaceAt(sx, true), flat = surfaceAt(sx, false);
        if (all.length) {
          const top = Math.min.apply(null, all);
          const below = (flat.length ? flat : all).filter((y) => y >= sy && !inWater(sx, y + 0.003));
          if (sy < top - FLOAT_TOL && below.length) target = Math.min.apply(null, below);
        }
      }
      if (target == null || !isFinite(target)) return o;
      const ly = toLocalY(c, +o.x, target);
      if (ly == null || !isFinite(ly)) return o;
      issue(name + ' ' + (o.mark || o.kind || fn) + (wet ? ' moved off open water' : ' moved down from the sky'));
      return Object.assign({}, o, { y: ly });
    };
    // A named person keeps one look for the whole video: the first scene that draws a marked person defines it, the
    // server stores it and writes it into later scenes (window.__motionKitCast), and the kit applies it over whatever
    // clothes the later scene asked for. Pose, action, expression and position stay the scene's own.
    const LOOK_KEYS = ['top', 'trim', 'pants', 'boots', 'belt', 'sleeve', 'robe', 'cape', 'armor', 'emblem', 'emblemColor', 'build', 'skin', 'head', 'headColor', 'crest', 'hair', 'hairColor', 'beard', 'gender', 'age'];
    const lookOf = (o) => { const out = {}; LOOK_KEYS.forEach((key) => { const v = o[key]; if (v !== undefined && v !== null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) out[key] = v; }); return out; };
    const record = (c, fn, o) => {
      if (!o || !isFinite(+o.x) || !isFinite(+o.y) || typeof K.size !== 'function') return;
      const big = LARGE_FNS.indexOf(fn) >= 0;
      if (!o.mark && !big) return;
      let m = null;
      busy++;
      try { m = K.size(fn, o); } catch (e) { m = null; } finally { busy--; }
      if (!m || !isFinite(m.height) || m.height <= 0) return;
      const left = isFinite(m.left) ? m.left : m.width / 2, right = isFinite(m.right) ? m.right : m.width / 2;
      const x0 = +o.x - left, y0 = +o.y - m.height, w = left + right, h = m.height;
      if (o.mark) mark(c, String(o.mark), x0, y0, w, h, fn === 'person' ? { look: lookOf(o) } : null);
      if (big) { const [, ch] = dims(c); const sh = Math.abs(c.getTransform().d) * h / ch; if (sh >= LARGE) mark(c, '~' + fn + ':' + (o.kind || fn), x0, y0, w, h, { large: true }); }
    };
    // Smoke never rises through a person the scene marks: a column whose base sits on or just in front of a marked person
    // is moved to the nearer free side of that person.
    const SMOKES = ['smoke', 'darkSmoke', 'smokeColumn'];
    const clearOfFaces = (c, o) => {
      const marks = window.__motionMarks;
      if (SMOKES.indexOf(o.kind) < 0 || !Array.isArray(marks) || !isFinite(+o.x) || !isFinite(+o.y)) return o;
      const p = toScreen(c, +o.x, +o.y), m = c.getTransform(), cw = dims(c)[0];
      const hit = marks.filter((item) => item && item.src === 'kit' && item.look && item.h > 0.08 && p[0] > item.x - 0.02 && p[0] < item.x + item.w + 0.02 && p[1] > item.y && p[1] < item.y + item.h + 0.12)[0];
      if (!hit || Math.abs(m.a) < 1e-6) return o;
      const left = hit.x - 0.05, right = hit.x + hit.w + 0.05, target = p[0] - left < right - p[0] ? left : right;
      return Object.assign({}, o, { x: +o.x + ((target - p[0]) * cw) / m.a });
    };
    // Set dressing never hides the cast: an unmarked prop, tree or building drawn nearer the camera than a marked person and
    // covering a good part of that person is left out.
    const BLOCKERS = ['prop', 'tree', 'building'], BLOCK_SHARE = 0.25;
    const blocksPerson = (c, fn, o) => {
      const marks = window.__motionMarks;
      if (!Array.isArray(marks) || !isFinite(+o.x) || !isFinite(+o.y) || o.lying || typeof K.size !== 'function') return false;
      const people = marks.filter((item) => item && item.src === 'kit' && item.look && item.h > 0.08);
      if (!people.length) return false;
      let m = null;
      busy++;
      try { m = K.size(fn, o); } catch (e) { m = null; } finally { busy--; }
      if (!m || !isFinite(m.height) || m.height <= 0) return false;
      const left = isFinite(m.left) ? m.left : m.width / 2, right = isFinite(m.right) ? m.right : m.width / 2;
      const a = toScreen(c, +o.x - left, +o.y - m.height), b = toScreen(c, +o.x + right, +o.y);
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      return people.some((item) => {
        if (y1 < item.y + item.h - 0.01) return false;
        const w = Math.min(x1, item.x + item.w) - Math.max(x0, item.x), h = Math.min(y1, item.y + item.h) - Math.max(y0, item.y);
        return w > 0 && h > 0 && (w * h) / (item.w * item.h) > BLOCK_SHARE;
      });
    };
    const wrap = (name) => {
      const base = K[name];
      if (typeof base !== 'function') return;
      K[name] = function (c, opt) {
        const args = Array.prototype.slice.call(arguments);
        if (!busy && c && args[1] && typeof args[1] === 'object') {
          const shift = window.__motionKitFix && window.__motionKitFix.items && args[1].mark ? window.__motionKitFix.items[String(args[1].mark).toLowerCase()] : null;
          if (shift && isFinite(+shift.dx) && isFinite(+args[1].x)) args[1] = Object.assign({}, args[1], { x: +args[1].x + +shift.dx });
          const cast = name === 'person' && window.__motionKitCast && args[1].mark ? window.__motionKitCast[String(args[1].mark).toLowerCase()] : null;
          if (cast && typeof cast === 'object') { const kept = {}; if (!cast._seed) LOOK_KEYS.forEach((key) => { kept[key] = undefined; }); args[1] = Object.assign({}, args[1], kept, cast); delete args[1]._seed; }
          if (name === 'effect') args[1] = clearOfFaces(c, args[1]);
          if (BLOCKERS.indexOf(name) >= 0 && !args[1].mark && blocksPerson(c, name, args[1])) { issue('left out a foreground ' + name + ' ' + (args[1].kind || '') + ' that covered a marked person'); return null; }
          args[1] = settle(c, name, args[1], name);
          record(c, name, args[1]);
        }
        return base.apply(this, args);
      };
    };
    ['person', 'animal', 'prop', 'building', 'vehicle', 'tree', 'crowd', 'effect'].forEach(wrap);
    // Body details the plan can require for any skin: barefoot paints the feet in the skin tone, wounded adds a head bandage.
    const person1 = K.person;
    if (typeof person1 === 'function') K.person = function (c, opt) {
      if (busy || !c || !opt || typeof opt !== 'object' || !(opt.barefoot || opt.wounded)) return person1.apply(this, arguments);
      const o = Object.assign({}, opt);
      if (o.barefoot) o.boots = o.skin || (typeof S === 'function' && S().skin) || '#e8c9a8';
      const res = person1.call(this, c, o);
      if (o.wounded && res && res.head && typeof c.getTransform === 'function') {
        const hr = 0.5 * (+o.r || 30), hx = res.head[0], hy = res.head[1];
        c.save(); c.lineCap = 'round';
        const band = () => { c.beginPath(); c.moveTo(hx - hr * 0.92, hy - hr * 0.3); c.lineTo(hx + hr * 0.92, hy - hr * 0.48); c.stroke(); };
        c.strokeStyle = '#26201c'; c.lineWidth = hr * 0.42; band();
        c.strokeStyle = '#efe9dc'; c.lineWidth = hr * 0.3; band();
        c.fillStyle = '#a8342c'; c.beginPath(); c.arc(hx + hr * 0.35, hy - hr * 0.42, hr * 0.11, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      return res;
    };
    if (typeof KIND_ALIAS === 'object' && KIND_ALIAS) Object.assign(KIND_ALIAS, {
      palace: ['building', 'castle'], fortress: ['building', 'castle'], fort: ['building', 'castle'], citadel: ['building', 'castle'], stronghold: ['building', 'castle'],
      keep: ['building', 'tower'], watchtower: ['building', 'tower'], gatehouse: ['building', 'tower'], belltower: ['building', 'tower'], siegetower: ['building', 'tower'], minaret: ['building', 'tower'],
      monastery: ['building', 'church'], cathedral: ['building', 'church'], chapel: ['building', 'church'], abbey: ['building', 'church'], mosque: ['building', 'temple'], synagogue: ['building', 'temple'], shrinehall: ['building', 'temple'], pavilion: ['building', 'pagoda'],
      shop: ['building', 'house'], inn: ['building', 'house'], tavern: ['building', 'house'], store: ['building', 'house'], villa: ['building', 'house'], mansion: ['building', 'house'], townhouse: ['building', 'house'], school: ['building', 'house'], office: ['building', 'house'], manor: ['building', 'house'],
      warehouse: ['building', 'barn'], stable: ['building', 'barn'], granary: ['building', 'barn'], storehouse: ['building', 'barn'], workshop: ['building', 'barn'], forge: ['building', 'barn'], smithy: ['building', 'barn'],
      barracks: ['building', 'longhouse'], hall: ['building', 'longhouse'], greathall: ['building', 'longhouse'], cabin: ['building', 'hut'], shack: ['building', 'hut'], shed: ['building', 'hut'], farmhouse: ['building', 'cottage'],
      ger: ['building', 'yurt'], teepee: ['building', 'tent'], tipi: ['building', 'tent'], mill: ['building', 'windmill'], hospital: ['building', 'factory'], station: ['building', 'factory'], ditch: ['building', 'trench'], foxhole: ['building', 'trench'],
      bundle: ['prop', 'sack'], bag: ['prop', 'sack'], grainsack: ['prop', 'sack'], keg: ['prop', 'barrel'], cask: ['prop', 'barrel'], box: ['prop', 'crate'], flag: ['prop', 'banner'], standard: ['prop', 'banner'], pennant: ['prop', 'banner'],
      spearrack: ['prop', 'spearStand'], weaponstand: ['prop', 'weaponRack'], shield: ['prop', 'shieldProp'], helmet: ['prop', 'helmetProp'], firepit: ['prop', 'bonfirePit'], pot: ['prop', 'cookpot'], kettle: ['prop', 'cookpot'], drum: ['prop', 'warDrum'],
      logs: ['prop', 'woodpile'], firewood: ['prop', 'woodpile'], log: ['scenery', 'log'], boulder: ['scenery', 'boulder'], rock: ['scenery', 'rock'], rocks: ['scenery', 'rock'], bush: ['tree', 'bush'], shrub: ['tree', 'bush'], hedge: ['terrain', 'bushes'],
      crater: ['effect', 'crater'], mist: ['scenery', 'mist'], fog: ['effect', 'fog'], ford: ['scenery', 'stream'], creek: ['scenery', 'stream'], brook: ['scenery', 'stream'], moat: ['scenery', 'stream'], canal: ['scenery', 'stream'],
      tent: ['building', 'tent'], wagon: ['vehicle', 'wagon'], cart: ['prop', 'cart'], mangonel: ['vehicle', 'catapult'], ballista: ['vehicle', 'catapult'], onager: ['vehicle', 'catapult'], cannon: ['vehicle', 'cannon'], gun: ['vehicle', 'artillery'],
      pike: ['prop', 'spear'], lance: ['prop', 'spear'], javelin: ['prop', 'spear'], halberd: ['prop', 'spear'], polearm: ['prop', 'spear'], glaive: ['prop', 'spear'], partisan: ['prop', 'spear'], trident: ['prop', 'spear'], pitchfork: ['prop', 'spear'], hatchet: ['prop', 'axe'], battleaxe: ['prop', 'axe'], waraxe: ['prop', 'axe'], tomahawk: ['prop', 'axe'], crossbow: ['prop', 'bow'], longbow: ['prop', 'bow'], shortbow: ['prop', 'bow'], sabre: ['prop', 'sword'], saber: ['prop', 'sword'], katana: ['prop', 'sword'], blade: ['prop', 'sword'], dagger: ['prop', 'sword'], knife: ['prop', 'sword'], scimitar: ['prop', 'sword'], falchion: ['prop', 'sword'], pail: ['prop', 'bucket'], parchment: ['prop', 'scroll'], letter: ['prop', 'scroll'], decree: ['prop', 'scroll'], document: ['prop', 'scroll'], manuscript: ['prop', 'scroll'], chains: ['prop', 'chain'], shackles: ['prop', 'chain'], fetters: ['prop', 'chain'], stones: ['prop', 'stonePile'], stonepile: ['prop', 'stonePile'], buckler: ['prop', 'shieldProp'], shields: ['prop', 'shieldProp'], helm: ['prop', 'helmetProp']
    });
    const NEW_KINDS = { prop: ['chain', 'wagonFort', 'spear', 'axe', 'scroll', 'stonePile', 'bow', 'bucket', 'pyramid'], building: ['pyramid'], scenery: ['mistBand', 'fogBank'], projectile: ['fireball', 'firepot', 'pitch', 'greekFire', 'boulder', 'stone'], volley: ['fireball', 'firepot', 'pitch', 'greekFire', 'boulder', 'stone'] };
    const unknown = (c, fn, kind) => {
      if (busy || typeof routeKind !== 'function' || typeof kind !== 'string' || (NEW_KINDS[fn] || []).indexOf(kind) >= 0) return false;
      let route = null;
      try { route = routeKind(fn, kind); } catch (e) { route = null; }
      if (!route || route[0] !== '') return false;
      issue('unknown ' + fn + ' kind ' + kind);
      mark(c, '!unknown:' + fn + ':' + kind, 0, 0, 0, 0);
      return true;
    };
    ['prop', 'building', 'vehicle', 'animal', 'tree', 'scenery', 'terrain', 'effect', 'creature'].forEach((name) => {
      const base = K[name];
      if (typeof base !== 'function') return;
      K[name] = function (c, opt) {
        if (c && opt && typeof opt === 'object' && opt.kind) unknown(c, name, opt.kind);
        return base.apply(this, arguments);
      };
    });
    const ink = () => (typeof S === 'function' && S() && S().ol) || '#2a2522';
    const shape = (c, pts, fill) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); c.fillStyle = fill; c.fill(p); c.lineWidth = 2.2; c.lineJoin = 'round'; c.strokeStyle = ink(); c.stroke(p); };
    const stroke = (c, pts, wd, col) => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = wd + 2.4; c.strokeStyle = ink(); c.stroke(); c.lineWidth = wd; c.strokeStyle = col; c.stroke(); };
    const smallProp = (c, o) => {
      const p = n(o.p, n(o.r, 30) / 1.6), x = n(o.x, 0), y = n(o.y, 0), f = n(o.facing, 1) < 0 ? -1 : 1, wood = o.color || '#8a6444', iron = '#6c7076';
      c.save(); c.translate(x, y); c.scale(f, 1);
      if (o.alpha != null) c.globalAlpha *= Math.max(0, Math.min(1, +o.alpha));
      switch (o.kind) {
        case 'spear': stroke(c, [[-3.4 * p, -0.12 * p], [3.0 * p, -0.22 * p]], Math.max(2, 0.14 * p), wood); shape(c, [[3.0 * p, -0.36 * p], [3.75 * p, -0.24 * p], [3.0 * p, -0.08 * p]], iron); break;
        case 'axe': stroke(c, [[-1.4 * p, -0.1 * p], [1.2 * p, -0.2 * p]], Math.max(2, 0.16 * p), wood); shape(c, [[0.9 * p, -0.25 * p], [1.5 * p, -0.75 * p], [1.65 * p, -0.15 * p], [1.45 * p, 0.25 * p]], iron); break;
        case 'scroll': shape(c, [[-0.7 * p, -0.32 * p], [0.7 * p, -0.32 * p], [0.7 * p, 0], [-0.7 * p, 0]], '#efe2bf'); stroke(c, [[-0.78 * p, -0.36 * p], [-0.78 * p, 0.04 * p]], 0.14 * p, '#b08a52'); stroke(c, [[0.78 * p, -0.36 * p], [0.78 * p, 0.04 * p]], 0.14 * p, '#b08a52'); break;
        case 'bow': c.beginPath(); c.arc(0, 0, 1.6 * p, Math.PI * 1.15, Math.PI * 1.85); c.lineWidth = 0.18 * p + 2.4; c.strokeStyle = ink(); c.stroke(); c.lineWidth = 0.18 * p; c.strokeStyle = wood; c.stroke(); stroke(c, [[Math.cos(Math.PI * 1.15) * 1.6 * p, Math.sin(Math.PI * 1.15) * 1.6 * p], [Math.cos(Math.PI * 1.85) * 1.6 * p, Math.sin(Math.PI * 1.85) * 1.6 * p]], 1, '#e8e0cc'); break;
        case 'bucket': shape(c, [[-0.5 * p, -1.0 * p], [0.5 * p, -1.0 * p], [0.4 * p, 0], [-0.4 * p, 0]], wood); stroke(c, [[-0.47 * p, -0.7 * p], [0.47 * p, -0.7 * p]], 0.08 * p, iron); stroke(c, [[-0.43 * p, -0.25 * p], [0.43 * p, -0.25 * p]], 0.08 * p, iron); break;
        case 'stonePile': { const stones = [[-1.2, 0, 0.55], [-0.2, 0, 0.65], [0.85, 0, 0.5], [-0.65, -0.62, 0.5], [0.35, -0.68, 0.5], [-0.15, -1.2, 0.42]]; stones.forEach((q, i) => { const r = q[2] * p; shape(c, [[q[0] * p - r, q[1] * p], [q[0] * p - r * 0.7, q[1] * p - r * 1.1], [q[0] * p + r * 0.6, q[1] * p - r * 1.15], [q[0] * p + r, q[1] * p - r * 0.2], [q[0] * p + r * 0.6, q[1] * p + 0.02 * p]], i % 2 ? '#a39d92' : '#8f8a80'); }); break; }
        default: break;
      }
      c.restore();
      return null;
    };
    const pyramid = (c, o) => {
      const p = n(o.p, 30), wd = n(o.width, 26 * p), h = n(o.height, wd * 0.62), x = n(o.x, 0), y = n(o.y, 0);
      c.save();
      if (o.alpha != null) c.globalAlpha *= Math.max(0, Math.min(1, +o.alpha));
      shape(c, [[x - wd / 2, y], [x, y - h], [x + wd / 2, y]], o.color || '#d9bf86');
      shape(c, [[x, y - h], [x + wd / 2, y], [x + wd * 0.12, y]], 'rgba(120,90,50,0.35)');
      c.lineWidth = 1; c.strokeStyle = 'rgba(80,60,40,0.35)';
      for (let k = 1; k < 9; k++) { const yy = y - (h * k) / 9, half = (wd / 2) * (1 - k / 9); c.beginPath(); c.moveTo(x - half, yy); c.lineTo(x + half, yy); c.stroke(); }
      c.restore();
      return null;
    };
    const SMALL = ['spear', 'axe', 'scroll', 'bow', 'bucket', 'stonePile'];
    const shared = (c, o) => { try { return typeof SKIN_PARTS === 'object' && SKIN_PARTS && typeof SKIN_PARTS.propx === 'function' && typeof SKIN_K === 'object' && !!SKIN_PARTS.propx(c, o, SKIN_K); } catch (e) { return false; } };
    const SMALL_BOX = { spear: [-3.4, -0.45, 7.2, 0.55], axe: [-1.45, -0.8, 3.15, 1.1], scroll: [-0.85, -0.4, 1.7, 0.45], bow: [-1.6, -1.6, 3.2, 1.1], bucket: [-0.5, -1.0, 1.0, 1.0], stonePile: [-1.8, -1.7, 3.3, 1.75] };
    const pyramidMark = (c, o) => { if (!o.mark) return; const p = n(o.p, 30), wd = n(o.width, 26 * p), h = n(o.height, wd * 0.62); mark(c, String(o.mark), n(o.x, 0) - wd / 2, n(o.y, 0) - h, wd, h); };
    const propNew = K.prop, buildingNew = K.building;
    K.prop = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && SMALL.indexOf(o.kind) >= 0) {
        const s2 = busy ? o : settle(c, 'prop', o, 'prop');
        const q = SMALL_BOX[s2.kind], pp = n(s2.p, n(s2.r, 30) / 1.6), f = n(s2.facing, 1) < 0 ? -1 : 1;
        if (s2.mark && q && isFinite(+s2.x) && isFinite(+s2.y)) mark(c, String(s2.mark), +s2.x + (f < 0 ? -(q[0] + q[2]) : q[0]) * pp, +s2.y + q[1] * pp, q[2] * pp, q[3] * pp);
        return shared(c, s2) ? null : smallProp(c, s2);
      }
      if (o && o.kind === 'pyramid') { pyramidMark(c, o); return shared(c, o) ? null : pyramid(c, o); }
      return propNew.apply(this, arguments);
    };
    K.building = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && o.kind === 'pyramid') { pyramidMark(c, o); return shared(c, o) ? null : pyramid(c, o); }
      return buildingNew.apply(this, arguments);
    };
    const FIRE_SHOTS = ['fireball', 'firepot', 'pitch', 'greekFire'];
    const shotAt = (o, k) => { const a = o.from || [0, 0], b = o.to || [0, 0], dx = b[0] - a[0], dy = b[1] - a[1], arc = n(o.arc, 0.25) * Math.hypot(dx, dy); return [a[0] + dx * k, a[1] + dy * k - arc * 4 * k * (1 - k)]; };
    const fireShot = (c, o, dx, dy) => {
      const k = Math.max(0, Math.min(1, n(o.progress, 0.5))), r = n(o.r, 10), [x, y] = shotAt(o, k);
      for (let i = 1; i <= 4; i++) { const [tx, ty] = shotAt(o, Math.max(0, k - i * 0.035)); c.save(); c.globalAlpha *= 0.28 * (1 - i / 5); c.fillStyle = '#6c6660'; c.beginPath(); c.arc(tx + dx, ty + dy, r * (0.7 + i * 0.25), 0, Math.PI * 2); c.fill(); c.restore(); }
      if (typeof effect0 === 'function') effect0.call(K, c, { kind: 'fire', x: x + dx, y: y + dy + r * 0.6, r: r * 1.4, smoke: false, seed: n(o.seed, 1) });
      c.save(); c.fillStyle = '#3a2a1e'; c.beginPath(); c.arc(x + dx, y + dy, r * 0.6, 0, Math.PI * 2); c.fill(); c.restore();
      return null;
    };
    const effect0 = K.effect, projectile0 = K.projectile, volley0 = K.volley;
    if (typeof projectile0 === 'function') K.projectile = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && FIRE_SHOTS.indexOf(o.kind) >= 0 && Array.isArray(o.from) && Array.isArray(o.to)) return fireShot(c, o, 0, 0);
      if (o && (o.kind === 'boulder' || o.kind === 'stone')) return projectile0.call(this, c, Object.assign({}, o, { kind: 'rock' }));
      return projectile0.apply(this, arguments);
    };
    if (typeof volley0 === 'function') K.volley = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && FIRE_SHOTS.indexOf(o.kind) >= 0 && Array.isArray(o.from) && Array.isArray(o.to)) { const count = Math.max(1, Math.min(20, Math.round(n(o.count, 5)))), spread = n(o.spread, 60); for (let i = 0; i < count; i++) { const sx = (((i * 37 + n(o.seed, 1) * 11) % 100) / 100 - 0.5) * spread, sy = (((i * 53 + n(o.seed, 1) * 7) % 100) / 100 - 0.5) * spread * 0.4; fireShot(c, Object.assign({}, o, { progress: Math.max(0, Math.min(1, n(o.progress, 0.5) - i * 0.02)) }), sx, sy); } return null; }
      if (o && (o.kind === 'boulder' || o.kind === 'stone')) return volley0.call(this, c, Object.assign({}, o, { kind: 'rock' }));
      return volley0.apply(this, arguments);
    };
    const crowdNew = K.crowd;
    if (typeof crowdNew === 'function') K.crowd = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (!o || (o.formation !== 'ring' && o.formation !== 'circle')) return crowdNew.apply(this, arguments);
      const count = Math.max(3, Math.min(24, Math.round(n(o.count, 8)))), cx = n(o.x, 640), cy = n(o.y, 500), rx = n(o.spread, 320), ry = n(o.depth, rx * 0.22);
      const turn = n(o.turn, n(window.__motionKitTime, 0) * n(o.speed, 0.35)), list = [];
      for (let i = 0; i < count; i++) { const a = turn + (i / count) * Math.PI * 2; list.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, facing: Math.sin(a) > 0 ? -1 : 1, scale: 1 + Math.sin(a) * 0.12 }); }
      list.sort((a, b) => a.y - b.y).forEach((q, i) => {
        const base = Object.assign({}, o, { formation: undefined, count: undefined, x: q.x, y: q.y, facing: q.facing, seed: n(o.seed, 1) + i, mark: undefined });
        if (o.r != null) base.r = n(o.r, 30) * q.scale; else if (o.p != null) base.p = n(o.p, 30) * q.scale;
        if (o.mounted || o.rider) K.animal(c, Object.assign(base, { kind: o.animal || 'horse', pose: o.pose || 'gallop', rider: o.rider && typeof o.rider === 'object' ? o.rider : { hold: o.hold || 'bow', seed: n(o.seed, 1) + i } }));
        else K.person(c, Object.assign(base, { pose: o.pose || 'run' }));
      });
      if (o.mark) mark(c, String(o.mark), cx - rx, cy - ry - n(o.p, n(o.r, 30)) * 5, rx * 2, ry * 2 + n(o.p, n(o.r, 30)) * 5);
      return null;
    };

    const time0 = K.time, scenery0 = K.scenery, terrain0 = K.terrain, cloud0 = K.cloud, frame0 = K.frame;
    K.time = function () { reset(); window.__motionKitIssues = []; return time0.apply(this, arguments); };
    // Code repair after the scene QA (window.__motionKitFix, written into the page by the server): reframe the camera so the
    // focal subject is large enough and inside the frame, without touching the scene's own layout.
    K.frame = function (c, opt) {
      map = !!(opt && (opt.shot === 'map' || opt.shot === 'board'));
      const fix = window.__motionKitFix;
      if (!fix || !opt || typeof opt !== 'object' || map) return frame0.apply(this, arguments);
      const o = Object.assign({}, opt);
      if (isFinite(+fix.zoom) && +fix.zoom > 0) o.zoom = (isFinite(+o.zoom) ? +o.zoom : 1) * +fix.zoom;
      if (isFinite(+fix.dx)) o.x = (isFinite(+o.x) ? +o.x : 640) + +fix.dx;
      return frame0.call(this, c, o);
    };
    K.scenery = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && STREAMS.indexOf(o.kind) >= 0) return scenery0.call(this, c, streamCourse(c, o));
      if (o && (o.kind === 'mistBand' || o.kind === 'fogBank')) return scenery0.call(this, c, Object.assign({}, o, { kind: 'mist', width: n(o.width, 2200), alpha: n(o.alpha, 0.6) }));
      if (o && o.kind === 'river' && n(o.width, 0) >= BROAD && !Array.isArray(o.points)) {
        const x = n(o.x, 640), y = n(o.y, 0), h = Math.max(40, n(o.height, 120));
        const wide = Math.max(2600, 2 * Math.max(x - WORLD_L, WORLD_R - x) + 200);
        water = { c, top: y, color: o.color, seed: o.seed };
        addWater(c, x - wide / 2, x + wide / 2, y, y + h);
        return scenery0.call(this, c, Object.assign({}, o, { kind: 'sea', x, y, width: wide, height: h }));
      }
      if (o && WATER_KINDS.indexOf(o.kind) >= 0 && !Array.isArray(o.points)) {
        const x = n(o.x, 0), y = n(o.y, 0), r = n(o.r, 40);
        const w = n(o.width, o.kind === 'sea' ? 2600 : o.kind === 'pond' ? 4 * r : o.kind === 'lake' ? 8.4 * r : 10 * r);
        const h = n(o.height, o.kind === 'sea' ? 400 : o.kind === 'pond' ? 1.2 * r : o.kind === 'lake' ? 2 * r : 1.2 * r);
        if (o.kind === 'sea') addWater(c, x - w / 2, x + w / 2, y, y + h);
        else addWater(c, x - w * 0.42, x + w * 0.42, y - h * 0.4, y + h * 0.4);
      }
      return scenery0.apply(this, arguments);
    };
    K.terrain = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && o.kind === 'ground') {
        const x = n(o.x, 640), wd = n(o.width, 2200), y = n(o.y, 400), left = x - wd / 2, right = x + wd / 2;
        if (water && water.c === c) {
          const fill = (a, b) => { if (b - a > 4) { addWater(c, a, b, water.top, WORLD_B); scenery0.call(this, c, { kind: 'sea', x: (a + b) / 2, y: water.top, width: b - a + 4, height: WORLD_B - water.top, color: water.color, seed: water.seed }); } };
          if (left > WORLD_L) fill(WORLD_L - 200, left + 2);
          if (right < WORLD_R) fill(right - 2, WORLD_R + 200);
        }
        addLine(S.grounds, c, left, right, y);
      } else if (o && RIDGE_KINDS.indexOf(o.kind) >= 0) {
        const x = n(o.x, 640), wd = n(o.width, 2200), y = n(o.y, 400), h = n(o.height, 300);
        addLine(S.ridges, c, x - wd / 2, x + wd / 2, y - Math.min(h, 400));
      } else if (o && (o.kind === 'bank' || o.kind === 'road' || o.kind === 'path' || o.kind === 'beach')) {
        const x = n(o.x, 640), wd = n(o.width, 2200), y = n(o.y, 400);
        addLine(S.grounds, c, x - wd / 2, x + wd / 2, y);
      }
      return terrain0.apply(this, arguments);
    };
    const stage0 = K.stage;
    if (typeof stage0 === 'function') K.stage = function (c, items) {
      if (c && Array.isArray(items)) items.forEach((it) => { if (it && it.fn === 'prop' && (it.kind === 'bridge' || it.kind === 'pier') && isFinite(+it.x) && isFinite(+it.y)) { const r = n(it.r, n(it.p, 30)), wd = n(it.width, 6 * r); addLine(S.decks, c, +it.x - wd / 2, +it.x + wd / 2, +it.y); } });
      return stage0.apply(this, arguments);
    };
    const WIDTH_KINDS = ['bridge', 'wall', 'gate', 'barbedWire', 'palisade', 'fence', 'sandbags', 'pier'];
    const WIDTHS = new Map();
    const paintedWidth = (name, base, o) => {
      const key = [K.style ? K.style() : '', name, o.kind, o.width, o.height, o.r, o.p, o.count, o.stone].join('|');
      if (WIDTHS.has(key)) return WIDTHS.get(key);
      let w = 0;
      if (typeof document !== 'undefined') {
        const cv = document.createElement('canvas');
        cv.width = 4000; cv.height = 1400;
        const c2 = cv.getContext('2d');
        busy++;
        try { base.call(K, c2, Object.assign({}, o, { x: 2000, y: 1100, mark: undefined, alpha: 1 })); } catch (e) {} finally { busy--; }
        const d = c2.getImageData(0, 0, cv.width, cv.height).data;
        let x0 = 1e9, x1 = -1;
        for (let y = 0; y < cv.height; y += 4) for (let x = 0; x < cv.width; x += 4) if (d[(y * cv.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
        w = x1 > x0 ? x1 - x0 : 0;
      }
      WIDTHS.set(key, w);
      return w;
    };
    const stretch = (name) => {
      const base = K[name];
      if (typeof base !== 'function') return;
      K[name] = function (c, opt) {
        const o = opt && typeof opt === 'object' ? opt : null;
        if (busy || !c || !o || WIDTH_KINDS.indexOf(o.kind) < 0 || !(n(o.width, 0) > 0) || !isFinite(+o.x)) return base.apply(this, arguments);
        const drawn = paintedWidth(name, base, o);
        const k = drawn > 0 ? n(o.width, 0) / drawn : 1;
        if (!(k > 0) || Math.abs(k - 1) < 0.2) return base.apply(this, arguments);
        c.save();
        c.translate(+o.x, 0);
        c.scale(Math.max(0.25, Math.min(6, k)), 1);
        c.translate(-o.x, 0);
        try { return base.apply(this, arguments); } finally { c.restore(); }
      };
    };
    stretch('prop');
    stretch('building');
    const chain = (c, o) => {
      const link = Math.max(3, n(o.r, n(o.p, 30) * 0.22));
      let pts = Array.isArray(o.points) && o.points.length > 1 ? o.points.map((q) => [+q[0], +q[1]]) : null;
      if (!pts) { const x = n(o.x, 0), y = n(o.y, 0), half = n(o.width, link * 16) / 2, sag = n(o.sag, half * 0.12); pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push([x - half + k * 2 * half, y + Math.sin(Math.PI * k) * sag]); } }
      c.save();
      if (o.alpha != null) c.globalAlpha *= Math.max(0, Math.min(1, +o.alpha));
      let index = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0), an = Math.atan2(y1 - y0, x1 - x0), steps = Math.max(1, Math.round(len / (link * 1.5)));
        for (let j = 0; j < steps; j++, index++) {
          const k = (j + 0.5) / steps, lx = x0 + (x1 - x0) * k, ly = y0 + (y1 - y0) * k;
          c.save(); c.translate(lx, ly); c.rotate(an);
          c.beginPath();
          if (index % 2) c.ellipse(0, 0, link * 0.95, link * 0.55, 0, 0, Math.PI * 2); else { c.moveTo(-link * 0.95, 0); c.lineTo(link * 0.95, 0); }
          c.lineWidth = Math.max(2, link * 0.42); c.strokeStyle = '#1e1f22'; c.stroke();
          c.lineWidth = Math.max(1, link * 0.24); c.strokeStyle = o.color || '#7a7e86'; c.stroke();
          c.restore();
        }
      }
      c.restore();
      return null;
    };
    const wagonFort = (c, o) => {
      const count = Math.max(2, Math.min(12, Math.round(n(o.count, 4)))), p = n(o.p, 26), x = n(o.x, 640), y = n(o.y, 500);
      let size = null;
      busy++;
      try { size = K.size('vehicle', { kind: 'wagon', p }); } catch (e) { size = null; } finally { busy--; }
      const w = size && size.width > 0 ? size.width : p * 9, h = size && size.height > 0 ? size.height : p * 5, gap = n(o.gap, w * 1.08);
      const x0 = x - ((count - 1) * gap) / 2;
      for (let i = 0; i < count; i++) K.vehicle(c, { kind: 'wagon', x: x0 + i * gap, y, p, facing: n(o.facing, 1), load: o.load, seed: n(o.seed, 3) + i, mark: i === 0 ? o.mark : undefined });
      for (let i = 0; i < count - 1; i++) { const link = { kind: 'chain', x: x0 + i * gap + gap / 2, y: y - h * 0.3, width: Math.max(10, gap - w * 0.8), sag: h * 0.06, p: p * 0.7 }; if (!shared(c, link)) chain(c, link); }
      return null;
    };
    const prop0 = K.prop;
    K.prop = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && o.kind === 'chain') return shared(c, o) ? null : chain(c, o);
      if (o && o.kind === 'wagonFort') return wagonFort(c, o);
      if (o && (o.kind === 'bridge' || o.kind === 'pier') && isFinite(+o.x) && isFinite(+o.y)) { const r = n(o.r, n(o.p, 30)), wd = n(o.width, 6 * r); addLine(S.decks, c, +o.x - wd / 2, +o.x + wd / 2, +o.y); }
      return prop0.apply(this, arguments);
    };
    K.cloud = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && !o.dark && n(o.y, 0) > SKY_LINE) {
        const r = n(o.r, 40);
        return scenery0.call(this, c, { kind: 'mist', x: n(o.x, 0), y: n(o.y, 0) + r * 0.5, r, width: r * 2.6 * n(o.stretch, 1), alpha: 0.5, seed: o.seed });
      }
      if (o && !o.dark) {
        const r = n(o.r, 40), y = n(o.y, 0), [, sy] = toScreen(c, n(o.x, 0), y - r * 0.9);
        if (sy < 0.01) { const ly = toLocalY(c, n(o.x, 0), 0.015); if (ly != null && isFinite(ly)) return cloud0.call(this, c, Object.assign({}, o, { y: ly + r * 0.9 })); }
      }
      return cloud0.apply(this, arguments);
    };
    // Living motion: a standing figure shifts its weight and an animal stirs for the whole scene, so the picture never
    // freezes once the narrated action has finished.
    const STILL_POSES = ['lie', 'dead', 'sleep', 'fall', 'swim', 'drown', 'dive', 'crawl'];
    const alive = (name) => {
      const base = K[name];
      if (typeof base !== 'function') return;
      K[name] = function (c, opt) {
        if (busy || !c || !opt || typeof opt !== 'object' || opt.still || opt.lying || !isFinite(+opt.x) || !isFinite(+opt.y) || typeof c.rotate !== 'function' || STILL_POSES.indexOf(opt.pose) >= 0) return base.apply(this, arguments);
        const t = n(window.__motionKitTime, 0), seed = n(opt.seed, 0) + +opt.x * 0.013, amp = name === 'person' ? 0.014 : 0.008;
        const a = Math.sin(t * 0.9 + seed) * amp + Math.sin(t * 0.37 + seed * 1.7) * amp * 0.6;
        c.save(); c.translate(+opt.x, +opt.y); c.rotate(a); c.translate(-opt.x, -opt.y);
        try { return base.apply(this, arguments); } finally { c.restore(); }
      };
    };
    ['person', 'animal'].forEach(alive);
    // Phases follow the narration: the page receives the moment each spoken line starts (cues, as scene progress), and
    // MotionKit.phase(progress, count) tells the scene which of its phases is playing and how far through it is.
    let cues = null;
    K.cues = function (list) { cues = Array.isArray(list) ? list.map(Number).filter((v) => isFinite(v) && v >= 0 && v < 1) : null; };
    K.phase = function (progress, count) {
      const N = Math.max(1, Math.round(n(count, 1))), p = Math.max(0, Math.min(1, n(progress, 0))), at = [];
      for (let i = 0; i < N; i++) {
        if (cues && cues.length >= 2) { const f = (i * cues.length) / N, lo = Math.floor(f), a = cues[lo], b = lo + 1 < cues.length ? cues[lo + 1] : 1; at.push(a + (b - a) * (f - lo)); }
        else at.push(i / N);
      }
      at[0] = 0;
      let index = 0;
      for (let i = 0; i < N; i++) if (p >= at[i]) index = i;
      const end = index + 1 < N ? at[index + 1] : 1;
      const of = function (i) { const a = at[i], b = i + 1 < N ? at[i + 1] : 1; return !(i >= 0 && i < N) ? 0 : p <= a ? 0 : p >= b ? 1 : (p - a) / (b - a); };
      return { index: index, k: end > at[index] ? Math.min(1, (p - at[index]) / (end - at[index])) : 1, count: N, at: at, of: of };
    };
    // A map names its places: the kit's rule that hides place-name text is for staged scenes, so on a map frame a label
    // or a sign with text is drawn as a readable label.
    let lastPlaces, lastHeader;
    const places0 = K.places, label0 = K.label, sign0 = K.sign;
    if (typeof places0 === 'function') K.places = function (list, header) { lastPlaces = list; lastHeader = header; return places0.apply(this, arguments); };
    if (typeof label0 === 'function' && typeof places0 === 'function') K.label = function (c, opt) {
      if (!map || !opt || typeof opt !== 'object' || !opt.text || opt.header) return label0.apply(this, arguments);
      const o = Object.assign({}, opt, { size: Math.max(22, n(opt.size, 22)), above: undefined, pointTo: undefined, align: opt.align === 'left' ? undefined : opt.align });
      places0.call(K, [], lastHeader);
      try { return label0.call(this, c, o); } finally { places0.call(K, lastPlaces, lastHeader); }
    };
    if (typeof sign0 === 'function' && typeof label0 === 'function') K.sign = function (c, opt) {
      if (map && opt && typeof opt === 'object' && opt.text && !opt.inWorld) return K.label(c, { x: opt.x, y: opt.y, text: opt.text, size: opt.size });
      return sign0.apply(this, arguments);
    };
    // Everyday items the skins do not carry, and a bridge that must sit on water.
    const ARROWS = ['arrows', 'arrowsInGround', 'stuckArrows', 'arrowVolley'];
    const drawArrows = (c, o) => {
      const R = n(o.r, n(o.p, 30)), cnt = Math.max(3, Math.min(14, Math.round(n(o.count, 6)))), sd = n(o.seed, 1);
      c.save(); c.translate(+o.x, +o.y); c.lineCap = 'round';
      for (let i = 0; i < cnt; i++) {
        const rx = Math.sin(sd * 12.9 + i * 78.2) * R * 1.6, ang = -Math.PI / 2 + Math.sin(sd * 3.1 + i * 5.7) * 0.42, len = R * (1 + 0.3 * Math.abs(Math.sin(i * 2.3 + sd)));
        const ex = rx + Math.cos(ang) * len, ey = Math.sin(ang) * len, nx = -Math.sin(ang) * R * 0.09, ny = Math.cos(ang) * R * 0.09;
        c.strokeStyle = '#3a2a1c'; c.lineWidth = Math.max(1.2, R * 0.045); c.beginPath(); c.moveTo(rx, 0); c.lineTo(ex, ey); c.stroke();
        c.strokeStyle = '#e9e2d0'; c.lineWidth = Math.max(1, R * 0.035);
        for (let f = 0; f < 3; f++) { const q = 0.8 + f * 0.07, px = rx + (ex - rx) * q, py = ey * q; c.beginPath(); c.moveTo(px - nx, py - ny); c.lineTo(px + nx, py + ny); c.stroke(); }
      }
      c.restore();
      if (o.mark) mark(c, String(o.mark), +o.x - R * 1.8, +o.y - R * 1.35, R * 3.6, R * 1.35);
    };
    // Long guns lean together like a stack of arms; objects with no drawing of their own use the kit's icon of that thing.
    const GUNS = ['musket', 'rifle', 'arquebus', 'carbine', 'bayonet', 'muskets', 'rifles'];
    const ICON_PROPS = { crown: 'crown', skull: 'skull', bones: 'skull', clock: 'clock', watch: 'clock', globe: 'globe', phone: 'phone', telephone: 'phone', radio: 'phone', computer: 'computer', laptop: 'computer', television: 'computer', coin: 'coin', key: 'key', lock: 'lock', medal: 'medal', trophy: 'trophy', hourglass: 'hourglass', telescope: 'magnifier', microscope: 'magnifier', magnifier: 'magnifier', calendar: 'calendar', document: 'document', lightbulb: 'bulb', bulb: 'bulb', scale: 'scale', scales: 'scale' };
    const drawGuns = (c, o) => {
      const R = n(o.r, n(o.p, 30)), cnt = Math.max(1, Math.min(5, Math.round(n(o.count, 3))));
      c.save(); c.translate(+o.x, +o.y); c.lineCap = 'round';
      for (let i = 0; i < cnt; i++) {
        const k = cnt > 1 ? i / (cnt - 1) - 0.5 : 0, bx = k * R * 1.5, tx = k * R * 0.18, ty = -R * 2.5;
        c.strokeStyle = '#5b3d26'; c.lineWidth = Math.max(2.5, R * 0.16); c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + (tx - bx) * 0.42, ty * 0.42); c.stroke();
        c.strokeStyle = '#2b2b30'; c.lineWidth = Math.max(1.6, R * 0.08); c.beginPath(); c.moveTo(bx + (tx - bx) * 0.36, ty * 0.36); c.lineTo(tx, ty); c.stroke();
      }
      c.restore();
      if (o.mark) mark(c, String(o.mark), +o.x - R * 0.9, +o.y - R * 2.5, R * 1.8, R * 2.5);
    };
    // Items drawn here for every skin: plain inked shapes in the skin's outline colour. Each entry is [width, height] in
    // head radii and a draw function working from the ground point (0, 0) upward.
    const WOOD = '#7a5236', WOOD_D = '#5b3d26', STONE = '#b9b3a6', IRON = '#4a4d55', CLOTH = '#d8cfb8';
    const poly = (c, pts, fill) => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } c.stroke(); };
    const ring = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } c.stroke(); };
    const line = (c, a, b) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
    const CUSTOM = {
      wheel: [1.9, 1.9, (c, R) => { ring(c, 0, -0.95 * R, 0.9 * R, WOOD); ring(c, 0, -0.95 * R, 0.68 * R, 'rgba(0,0,0,0.12)'); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; line(c, [0, -0.95 * R], [Math.cos(a) * 0.68 * R, -0.95 * R + Math.sin(a) * 0.68 * R]); } ring(c, 0, -0.95 * R, 0.14 * R, WOOD_D); }],
      column: [1.1, 4.6, (c, R) => { poly(c, [[-0.55 * R, 0], [0.55 * R, 0], [0.55 * R, -0.3 * R], [-0.55 * R, -0.3 * R]], STONE); poly(c, [[-0.36 * R, -0.3 * R], [0.36 * R, -0.3 * R], [0.32 * R, -4.2 * R], [-0.32 * R, -4.2 * R]], STONE); poly(c, [[-0.55 * R, -4.2 * R], [0.55 * R, -4.2 * R], [0.5 * R, -4.6 * R], [-0.5 * R, -4.6 * R]], STONE); line(c, [-0.12 * R, -0.5 * R], [-0.12 * R, -4 * R]); line(c, [0.12 * R, -0.5 * R], [0.12 * R, -4 * R]); }],
      obelisk: [1.2, 5.6, (c, R) => { poly(c, [[-0.6 * R, 0], [0.6 * R, 0], [0.6 * R, -0.35 * R], [-0.6 * R, -0.35 * R]], STONE); poly(c, [[-0.42 * R, -0.35 * R], [0.42 * R, -0.35 * R], [0.24 * R, -5 * R], [0, -5.6 * R], [-0.24 * R, -5 * R]], STONE); }],
      gallows: [3, 5.4, (c, R) => { c.lineWidth *= 1.6; c.strokeStyle = WOOD_D; line(c, [-1.4 * R, 0], [0.2 * R, 0]); c.lineWidth *= 1.4; line(c, [-0.9 * R, 0], [-0.9 * R, -5.2 * R]); line(c, [-0.9 * R, -5.2 * R], [1.2 * R, -5.2 * R]); line(c, [-0.9 * R, -4.2 * R], [0, -5.2 * R]); c.lineWidth /= 2.2; c.strokeStyle = '#c9b48a'; line(c, [1 * R, -5.2 * R], [1 * R, -4.1 * R]); ring(c, 1 * R, -3.75 * R, 0.35 * R, null); }],
      guillotine: [2.2, 5.6, (c, R) => { poly(c, [[-1.1 * R, 0], [1.1 * R, 0], [1.1 * R, -0.35 * R], [-1.1 * R, -0.35 * R]], WOOD); poly(c, [[-0.8 * R, -0.35 * R], [-0.6 * R, -0.35 * R], [-0.6 * R, -5.4 * R], [-0.8 * R, -5.4 * R]], WOOD); poly(c, [[0.6 * R, -0.35 * R], [0.8 * R, -0.35 * R], [0.8 * R, -5.4 * R], [0.6 * R, -5.4 * R]], WOOD); poly(c, [[-0.9 * R, -5.4 * R], [0.9 * R, -5.4 * R], [0.9 * R, -5.6 * R], [-0.9 * R, -5.6 * R]], WOOD_D); poly(c, [[-0.6 * R, -4.6 * R], [0.6 * R, -4.6 * R], [0.6 * R, -3.5 * R], [-0.6 * R, -4 * R]], '#c9ced6'); poly(c, [[-0.6 * R, -1.3 * R], [0.6 * R, -1.3 * R], [0.6 * R, -0.9 * R], [-0.6 * R, -0.9 * R]], WOOD_D); }],
      stocks: [2.6, 2.4, (c, R) => { poly(c, [[-1.1 * R, 0], [-0.9 * R, 0], [-0.9 * R, -2.3 * R], [-1.1 * R, -2.3 * R]], WOOD_D); poly(c, [[0.9 * R, 0], [1.1 * R, 0], [1.1 * R, -2.3 * R], [0.9 * R, -2.3 * R]], WOOD_D); poly(c, [[-1.3 * R, -1.3 * R], [1.3 * R, -1.3 * R], [1.3 * R, -2.1 * R], [-1.3 * R, -2.1 * R]], WOOD); ring(c, 0, -1.7 * R, 0.26 * R, '#3a2a1c'); ring(c, -0.7 * R, -1.7 * R, 0.14 * R, '#3a2a1c'); ring(c, 0.7 * R, -1.7 * R, 0.14 * R, '#3a2a1c'); }],
      anchor: [1.8, 2.4, (c, R) => { c.lineWidth *= 2.2; c.strokeStyle = IRON; c.lineCap = 'round'; line(c, [0, -0.25 * R], [0, -2 * R]); line(c, [-0.45 * R, -1.65 * R], [0.45 * R, -1.65 * R]); c.beginPath(); c.arc(0, -0.95 * R, 0.8 * R, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke(); c.lineWidth /= 1.6; ring(c, 0, -2.2 * R, 0.2 * R, null); }],
      saddle: [1.6, 1, (c, R) => { c.beginPath(); c.moveTo(-0.8 * R, -0.25 * R); c.quadraticCurveTo(-0.7 * R, -0.95 * R, -0.3 * R, -0.6 * R); c.quadraticCurveTo(0.1 * R, -0.42 * R, 0.5 * R, -0.75 * R); c.quadraticCurveTo(0.85 * R, -0.6 * R, 0.75 * R, -0.2 * R); c.quadraticCurveTo(0, 0.05 * R, -0.8 * R, -0.25 * R); c.closePath(); c.fillStyle = WOOD; c.fill(); c.stroke(); line(c, [0, -0.2 * R], [0.05 * R, 0]); ring(c, 0.05 * R, 0.02 * R, 0.1 * R, null); }],
      plow: [3, 1.6, (c, R) => { c.lineWidth *= 1.5; c.strokeStyle = WOOD_D; line(c, [-1.4 * R, -1.5 * R], [-0.4 * R, -0.35 * R]); line(c, [-0.4 * R, -0.35 * R], [1.4 * R, -0.8 * R]); c.lineWidth /= 1.5; c.strokeStyle = ink(); poly(c, [[-0.5 * R, -0.45 * R], [0.2 * R, -0.3 * R], [-0.25 * R, 0.05 * R]], '#8b9099'); ring(c, 1.2 * R, -0.35 * R, 0.35 * R, WOOD); }],
      tomb: [3, 1.5, (c, R) => { poly(c, [[-1.4 * R, 0], [1.4 * R, 0], [1.4 * R, -0.9 * R], [-1.4 * R, -0.9 * R]], STONE); poly(c, [[-1.5 * R, -0.9 * R], [1.5 * R, -0.9 * R], [1.3 * R, -1.35 * R], [-1.3 * R, -1.35 * R]], '#c9c4b8'); line(c, [-0.9 * R, -0.25 * R], [-0.9 * R, -0.7 * R]); line(c, [0, -0.25 * R], [0, -0.7 * R]); line(c, [0.9 * R, -0.25 * R], [0.9 * R, -0.7 * R]); }],
      arch: [4, 5, (c, R) => { c.beginPath(); c.moveTo(-2 * R, 0); c.lineTo(-2 * R, -5 * R); c.lineTo(2 * R, -5 * R); c.lineTo(2 * R, 0); c.lineTo(1.1 * R, 0); c.lineTo(1.1 * R, -2.6 * R); c.arc(0, -2.6 * R, 1.1 * R, 0, Math.PI, true); c.lineTo(-1.1 * R, 0); c.closePath(); c.fillStyle = STONE; c.fill(); c.stroke(); line(c, [-2 * R, -4.3 * R], [2 * R, -4.3 * R]); }],
      sled: [3.4, 1, (c, R) => { poly(c, [[-1.5 * R, -0.5 * R], [1.3 * R, -0.5 * R], [1.3 * R, -0.75 * R], [-1.5 * R, -0.75 * R]], WOOD); c.lineWidth *= 1.5; c.strokeStyle = WOOD_D; c.beginPath(); c.moveTo(-1.6 * R, -0.05 * R); c.lineTo(1.2 * R, -0.05 * R); c.quadraticCurveTo(1.75 * R, -0.1 * R, 1.7 * R, -0.75 * R); c.stroke(); line(c, [-1 * R, -0.05 * R], [-1 * R, -0.5 * R]); line(c, [0.8 * R, -0.05 * R], [0.8 * R, -0.5 * R]); }],
      batteringRam: [5, 2.6, (c, R) => { poly(c, [[-2.2 * R, -0.6 * R], [1.6 * R, -0.6 * R], [1.6 * R, -0.85 * R], [-2.2 * R, -0.85 * R]], WOOD_D); line(c, [-1.8 * R, -0.85 * R], [-0.1 * R, -2.5 * R]); line(c, [1.4 * R, -0.85 * R], [-0.1 * R, -2.5 * R]); c.strokeStyle = '#c9b48a'; line(c, [-1 * R, -1.7 * R], [-1 * R, -1.35 * R]); line(c, [0.6 * R, -1.75 * R], [0.6 * R, -1.35 * R]); c.strokeStyle = ink(); poly(c, [[-2.4 * R, -1.1 * R], [2 * R, -1.1 * R], [2 * R, -1.45 * R], [-2.4 * R, -1.45 * R]], WOOD); poly(c, [[2 * R, -1 * R], [2.5 * R, -1.27 * R], [2 * R, -1.55 * R]], IRON); ring(c, -1.5 * R, -0.4 * R, 0.4 * R, WOOD); ring(c, 1 * R, -0.4 * R, 0.4 * R, WOOD); }],
      lute: [1, 2.4, (c, R) => { c.save(); c.rotate(0.35); poly(c, [[-0.09 * R, -0.9 * R], [0.09 * R, -0.9 * R], [0.07 * R, -2.2 * R], [-0.07 * R, -2.2 * R]], WOOD_D); c.beginPath(); c.ellipse(0, -0.55 * R, 0.42 * R, 0.55 * R, 0, 0, Math.PI * 2); c.fillStyle = '#b07a45'; c.fill(); c.stroke(); ring(c, 0, -0.62 * R, 0.13 * R, '#3a2a1c'); c.restore(); }],
      blackboard: [3.2, 3.4, (c, R) => { line(c, [-1.2 * R, 0], [-0.9 * R, -1.2 * R]); line(c, [1.2 * R, 0], [0.9 * R, -1.2 * R]); poly(c, [[-1.6 * R, -1.2 * R], [1.6 * R, -1.2 * R], [1.6 * R, -3.4 * R], [-1.6 * R, -3.4 * R]], WOOD); poly(c, [[-1.45 * R, -1.35 * R], [1.45 * R, -1.35 * R], [1.45 * R, -3.25 * R], [-1.45 * R, -3.25 * R]], '#2f4a3c'); }],
      sail: [3, 5, (c, R) => { c.lineWidth *= 1.6; c.strokeStyle = WOOD_D; line(c, [0, 0], [0, -5 * R]); c.lineWidth /= 1.6; c.strokeStyle = ink(); c.beginPath(); c.moveTo(0.12 * R, -4.7 * R); c.quadraticCurveTo(1.9 * R, -3 * R, 1.4 * R, -0.8 * R); c.lineTo(0.12 * R, -0.8 * R); c.closePath(); c.fillStyle = CLOTH; c.fill(); c.stroke(); }],
    };
    const CUSTOM_ALIAS = { pillar: 'column', columns: 'column', pillars: 'column', sarcophagus: 'tomb', violin: 'lute', guitar: 'lute', harp: 'lute', sleigh: 'sled', ram: 'batteringRam', mast: 'sail', yoke: 'plow', archway: 'arch' };
    const drawCustom = (c, o) => {
      const kind = CUSTOM[o.kind] ? o.kind : CUSTOM_ALIAS[o.kind], spec = CUSTOM[kind], R = n(o.r, n(o.p, 30));
      c.save(); c.translate(+o.x, +o.y); if (n(o.facing, 1) < 0) c.scale(-1, 1);
      if (o.alpha != null) c.globalAlpha *= Math.max(0, Math.min(1, +o.alpha));
      c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = ink(); c.lineWidth = Math.max(1.5, R * 0.07);
      try { spec[2](c, R); } catch (e) {}
      c.restore();
      if (o.mark) mark(c, String(o.mark), +o.x - (spec[0] * R) / 2, +o.y - spec[1] * R, spec[0] * R, spec[1] * R);
    };
    const BANNERS = ['banner', 'flag', 'standard', 'pennant'], BANNER_MAX = 1.65;
    const prop1 = K.prop;
    if (typeof prop1 === 'function') K.prop = function (c, opt) {
      if (busy || !c || !opt || typeof opt !== 'object' || !isFinite(+opt.x) || !isFinite(+opt.y)) return prop1.apply(this, arguments);
      // A banner is carried by people: beside marked people it is never taller than about one and two thirds of them.
      if (BANNERS.indexOf(opt.kind) >= 0 && typeof K.size === 'function' && Array.isArray(window.__motionMarks)) {
        const tallest = Math.max.apply(null, window.__motionMarks.filter((item) => item && item.src === 'kit' && item.look && item.h > 0.08).map((item) => item.h).concat([0]));
        let m = null;
        busy++;
        try { m = K.size('prop', opt); } catch (e) { m = null; } finally { busy--; }
        const tall = m && isFinite(m.height) ? (Math.abs(c.getTransform().d) * m.height) / dims(c)[1] : 0;
        if (tallest > 0 && tall > tallest * BANNER_MAX) {
          const k = (tallest * BANNER_MAX) / tall, o = Object.assign({}, opt);
          if (isFinite(+o.r)) o.r = +o.r * k;
          if (isFinite(+o.p)) o.p = +o.p * k;
          if (isFinite(+o.width)) o.width = +o.width * k;
          if (isFinite(+o.height)) o.height = +o.height * k;
          return prop1.call(this, c, o);
        }
        return prop1.apply(this, arguments);
      }
      // The base kit's own items always win: this layer only draws what the kit has no drawing for.
      let own = false;
      try { own = typeof routeKind === 'function' && routeKind('prop', opt.kind) === null; } catch (e) { own = false; }
      if (own) return prop1.apply(this, arguments);
      if (ARROWS.indexOf(opt.kind) >= 0) return drawArrows(c, opt);
      if (GUNS.indexOf(opt.kind) >= 0) return drawGuns(c, opt);
      if (CUSTOM[opt.kind] || CUSTOM_ALIAS[opt.kind]) return drawCustom(c, opt);
      if (ICON_PROPS[opt.kind] && typeof K.icon === 'function') {
        const R = n(opt.r, n(opt.p, 30)) * 0.8;
        if (opt.mark) mark(c, String(opt.mark), +opt.x - R, +opt.y - R * 2, R * 2, R * 2);
        return K.icon(c, { kind: ICON_PROPS[opt.kind], x: +opt.x, y: +opt.y - R, r: R });
      }
      if (opt.kind !== 'bridge') return prop1.apply(this, arguments);
      if (!S.waters.length) { issue('bridge drawn with no water under it'); return prop1.apply(this, arguments); }
      const p = toScreen(c, +opt.x, +opt.y);
      if (S.waters.some((w) => p[0] >= w.l && p[0] <= w.r && p[1] >= w.t - 0.03 && p[1] <= w.b + 0.03)) return prop1.apply(this, arguments);
      const near = S.waters.slice().sort((a, b) => Math.abs((a.t + a.b) / 2 - p[1]) - Math.abs((b.t + b.b) / 2 - p[1]))[0];
      const ly = toLocalY(c, +opt.x, (near.t + near.b) / 2);
      return ly != null && isFinite(ly) ? prop1.call(this, c, Object.assign({}, opt, { y: ly })) : prop1.apply(this, arguments);
    };
    // Support items the scene left out are drawn by code at their planned spot (window.__motionKitFix.add), inside the
    // scene's own camera, just before the frame is finished.
    let cam = null;
    const frame1 = K.frame, finish0 = K.finish;
    let labelCtx = null;
    K.frame = function (c) { const r = frame1.apply(this, arguments); labelCtx = c; try { cam = { c: c, m: c.getTransform() }; } catch (e) { cam = null; } return r; };
    if (typeof finish0 === 'function') K.finish = function () {
      const add = window.__motionKitFix && window.__motionKitFix.add;
      if (Array.isArray(add) && cam && cam.c && !map) {
        const c = cam.c;
        c.save();
        try { c.setTransform(cam.m); add.forEach((it) => { if (it && typeof K[it.fn] === 'function') K[it.fn](c, Object.assign({}, it)); }); } catch (e) {}
        c.restore();
      }
      cam = null;
      return finish0.apply(this, arguments);
    };
    // More everyday words, each sent to the nearest thing the kit draws.
    if (typeof KIND_ALIAS === 'object' && KIND_ALIAS) Object.assign(KIND_ALIAS, {
      mace: ['prop', 'axe'], club: ['prop', 'axe'], hammer: ['prop', 'axe'], pickaxe: ['prop', 'axe'], shovel: ['prop', 'axe'], hoe: ['prop', 'axe'], scythe: ['prop', 'axe'], sickle: ['prop', 'axe'], oar: ['prop', 'spear'], harpoon: ['prop', 'spear'],
      quiver: ['prop', 'arrows'], armor: ['prop', 'helmetProp'], armour: ['prop', 'helmetProp'], trumpet: ['prop', 'horn'], bugle: ['prop', 'horn'], lamp: ['prop', 'lantern'],
      amphora: ['prop', 'jar'], cup: ['prop', 'jar'], goblet: ['prop', 'jar'], plate: ['prop', 'jar'], wine: ['prop', 'jar'], bottle: ['prop', 'jar'], jug: ['prop', 'jar'], flask: ['prop', 'jar'], beaker: ['prop', 'jar'],
      treasure: ['prop', 'chest'], gold: ['prop', 'chest'], letter: ['prop', 'scroll'], book: ['prop', 'scroll'], map: ['prop', 'scroll'], newspaper: ['prop', 'scroll'], poster: ['prop', 'scroll'], quill: ['prop', 'scroll'], parchment: ['prop', 'scroll'], decree: ['prop', 'scroll'],
      desk: ['prop', 'table'], stool: ['prop', 'chair'], shackles: ['prop', 'chain'], chains: ['prop', 'chain'], cage: ['prop', 'crate'], suitcase: ['prop', 'crate'], idol: ['prop', 'statue'], tombstone: ['prop', 'gravestone'], grave: ['prop', 'gravestone'],
      stretcher: ['prop', 'bed'], cannonball: ['prop', 'stonePile'], rubble: ['prop', 'stonePile'], millstone: ['prop', 'stonePile'], sandbag: ['prop', 'sack'], sandbags: ['prop', 'sack'], grain: ['prop', 'sack'], bread: ['prop', 'basket'], meat: ['prop', 'basket'], food: ['prop', 'basket'],
      barricade: ['prop', 'palisade'], stakes: ['prop', 'palisade'], pistol: ['prop', 'musket'], revolver: ['prop', 'musket'],
      stagecoach: ['vehicle', 'wagon'], halftrack: ['vehicle', 'truck'], ambulance: ['vehicle', 'truck'], tractor: ['vehicle', 'truck'], tram: ['vehicle', 'bus'], locomotive: ['vehicle', 'train'], galley: ['vehicle', 'trireme'], junk: ['vehicle', 'galleon'], frigate: ['vehicle', 'galleon'],
      steamship: ['vehicle', 'ship'], ferry: ['vehicle', 'ship'], battleship: ['vehicle', 'warship'], carrier: ['vehicle', 'warship'], zeppelin: ['vehicle', 'airship'], spaceship: ['vehicle', 'rocket'],
      sled: ['prop', 'sled'], sleigh: ['prop', 'sled'], batteringram: ['prop', 'batteringRam'], ram: ['prop', 'batteringRam'], arch: ['prop', 'arch'], archway: ['prop', 'arch'], tomb: ['prop', 'tomb'], sarcophagus: ['prop', 'tomb'], colosseum: ['building', 'ruins'], aqueduct: ['prop', 'arch'],
      whale: ['animal', 'fish'], shark: ['animal', 'fish'], dolphin: ['animal', 'fish'], bee: ['animal', 'butterfly'], rabbit: ['animal', 'rat'], crutch: ['prop', 'spear'], cane: ['prop', 'spear'], broom: ['prop', 'spear'], whip: ['prop', 'rope'], scepter: ['prop', 'torch'],
      hay: ['prop', 'haystack'],
      prison: ['building', 'bunker'], igloo: ['building', 'hut'], stall: ['building', 'tent'], bull: ['animal', 'ox'], mouse: ['animal', 'rat'], goose: ['animal', 'duck'], rooster: ['animal', 'chicken'], raven: ['animal', 'crow'], hawk: ['animal', 'eagle'], owl: ['animal', 'eagle'], vulture: ['animal', 'eagle'],
    });
    // An alias is resolved here, at the top of the kit, so a word that maps to an item drawn by this layer (spear, axe,
    // scroll, arrows) is drawn too instead of reaching the base kit, which does not know those items.
    ['prop', 'building', 'vehicle', 'animal'].forEach((name) => {
      const base = K[name];
      if (typeof base !== 'function') return;
      K[name] = function (c, opt) {
        if (busy || !opt || typeof opt !== 'object' || typeof opt.kind !== 'string' || typeof KIND_ALIAS !== 'object' || !KIND_ALIAS) return base.apply(this, arguments);
        const hit = KIND_ALIAS[String(opt.kind).toLowerCase().replace(/[^a-z]/g, '')];
        if (!hit || typeof K[hit[0]] !== 'function' || (hit[0] === name && hit[1] === opt.kind)) return base.apply(this, arguments);
        let native = false;
        try { native = typeof routeKind === 'function' && routeKind(name, opt.kind) === null; } catch (e) { native = false; }
        if (native) return base.apply(this, arguments);
        return K[hit[0]].call(this, c, Object.assign({}, opt, { kind: hit[1] }));
      };
    });
    // A map with no place names gets them from code: one label above each marked place or force (window.__motionKitFix.labels).
    const finish1 = K.finish;
    if (typeof finish1 === 'function') K.finish = function () {
      const labels = window.__motionKitFix && window.__motionKitFix.labels, marks = window.__motionMarks, c = labelCtx;
      if (map && Array.isArray(labels) && Array.isArray(marks) && c && c.canvas && typeof K.label === 'function') {
        const W = c.canvas.width, H = c.canvas.height, u = W / 1280;
        c.save();
        try {
          c.setTransform(u, 0, 0, u, 0, 0);
          labels.forEach((row) => {
            const m = marks.filter((item) => String(item.id).toLowerCase() === String(row.id).toLowerCase()).pop();
            if (m) K.label(c, { x: ((m.x + m.w / 2) * W) / u, y: Math.max(30, (m.y * H) / u - 26), text: String(row.text), size: 24 });
          });
        } catch (e) {}
        c.restore();
      }
      labelCtx = null;
      return finish1.apply(this, arguments);
    };
  })(window.MotionKit);\n`;
