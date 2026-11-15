// Drawings the standard kit adds on top of every skin (outline, sketch, comic, horror) through its public API: body
// details (barefoot, wounded), everyday items the skins do not carry (small hand items, a pyramid, chains, a wagon fort,
// arrows stuck in the ground, stacked guns, wheels, columns and other plain inked shapes), walls and bridges drawn to the
// width asked for, more names for things the kit draws, and animals always side-on. MotionKit.knows(fn, kind) tells the
// figure table which kinds the kit can draw; nothing here moves, resizes or adds anything in a scene.
export const MOTION_KIT_EXTRAS = `(function (K) {
    if (!K || K.__extras) return;
    K.__extras = true;
    const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : isFinite(+v) && v !== null && v !== '' ? +v : d);
    let busy = 0;
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
    const propNew = K.prop, buildingNew = K.building;
    K.prop = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && SMALL.indexOf(o.kind) >= 0) return shared(c, o) ? null : smallProp(c, o);
      if (o && o.kind === 'pyramid') return shared(c, o) ? null : pyramid(c, o);
      return propNew.apply(this, arguments);
    };
    K.building = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && o.kind === 'pyramid') return shared(c, o) ? null : pyramid(c, o);
      return buildingNew.apply(this, arguments);
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
      return prop0.apply(this, arguments);
    };
    // Everyday items the skins do not carry.
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
    };
    const prop1 = K.prop;
    if (typeof prop1 === 'function') K.prop = function (c, opt) {
      if (busy || !c || !opt || typeof opt !== 'object' || !isFinite(+opt.x) || !isFinite(+opt.y)) return prop1.apply(this, arguments);
      // The base kit's own items always win: this layer only draws what the kit has no drawing for.
      let own = false;
      try { own = typeof routeKind === 'function' && routeKind('prop', opt.kind) === null; } catch (e) { own = false; }
      if (own) return prop1.apply(this, arguments);
      if (ARROWS.indexOf(opt.kind) >= 0) return drawArrows(c, opt);
      if (GUNS.indexOf(opt.kind) >= 0) return drawGuns(c, opt);
      if (CUSTOM[opt.kind] || CUSTOM_ALIAS[opt.kind]) return drawCustom(c, opt);
      if (ICON_PROPS[opt.kind] && typeof K.icon === 'function') {
        const R = n(opt.r, n(opt.p, 30)) * 0.8;
        return K.icon(c, { kind: ICON_PROPS[opt.kind], x: +opt.x, y: +opt.y - R, r: R });
      }
      return prop1.apply(this, arguments);
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
    // A horse or other animal seen from the front or the back does not read as an animal in any skin, so animals and
    // their riders are always drawn side-on; where they stand and how they move stays the scene's own.
    const animal1 = K.animal;
    if (typeof animal1 === 'function') K.animal = function (c, opt) {
      if (busy || !opt || typeof opt !== 'object' || (opt.view !== 'front' && opt.view !== 'back')) return animal1.apply(this, arguments);
      return animal1.call(this, c, Object.assign({}, opt, { view: 'side' }));
    };
    // The kinds the figure table may hand to the kit: the base kit's own and alias kinds, and the items drawn here.
    const knows0 = K.knows;
    const EXTRA = { prop: SMALL.concat(['pyramid', 'chain', 'wagonFort'], ARROWS, GUNS, Object.keys(CUSTOM), Object.keys(CUSTOM_ALIAS), Object.keys(ICON_PROPS)), building: ['pyramid'] };
    K.knows = function (fn, kind) { return (EXTRA[fn] || []).indexOf(kind) >= 0 || (typeof knows0 === 'function' && knows0(fn, kind)); };
  })(window.MotionKit);\n`;
