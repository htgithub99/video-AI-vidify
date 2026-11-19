export const MOTION_KIT_EXTRAS = `(function (K) {
    if (!K || K.__extras) return;
    K.__extras = true;
    const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : isFinite(+v) && v !== null && v !== '' ? +v : d);
    let busy = 0;
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
    const wagonFort = (c, o) => {
      const count = Math.max(2, Math.min(12, Math.round(n(o.count, 4)))), p = n(o.p, 26), x = n(o.x, 640), y = n(o.y, 500);
      let size = null;
      busy++;
      try { size = K.size('vehicle', { kind: 'wagon', p }); } catch (e) { size = null; } finally { busy--; }
      const w = size && size.width > 0 ? size.width : p * 9, h = size && size.height > 0 ? size.height : p * 5, gap = n(o.gap, w * 1.08);
      const x0 = x - ((count - 1) * gap) / 2;
      for (let i = 0; i < count; i++) K.vehicle(c, { kind: 'wagon', x: x0 + i * gap, y, p, facing: n(o.facing, 1), load: o.load, seed: n(o.seed, 3) + i, mark: i === 0 ? o.mark : undefined });
      for (let i = 0; i < count - 1; i++) K.prop(c, { kind: 'chain', x: x0 + i * gap + gap / 2, y: y - h * 0.3, width: Math.max(10, gap - w * 0.8), sag: h * 0.06, p: p * 0.7 });
      return null;
    };
    const prop0 = K.prop;
    K.prop = function (c, opt) {
      const o = opt && typeof opt === 'object' ? opt : null;
      if (o && o.kind === 'wagonFort') return wagonFort(c, o);
      return prop0.apply(this, arguments);
    };
    // A horse or other animal seen from the front or the back does not read as an animal in any skin, so animals and
    // their riders are always drawn side-on; where they stand and how they move stays the scene's own.
    const animal1 = K.animal;
    if (typeof animal1 === 'function') K.animal = function (c, opt) {
      if (busy || !opt || typeof opt !== 'object' || (opt.view !== 'front' && opt.view !== 'back')) return animal1.apply(this, arguments);
      return animal1.call(this, c, Object.assign({}, opt, { view: 'side' }));
    };
    // The kinds the figure table may hand to the kit: the base kit's own and the items drawn here.
    const knows0 = K.knows;
    const EXTRA = { prop: ['wagonFort'] };
    K.knows = function (fn, kind) { return (EXTRA[fn] || []).indexOf(kind) >= 0 || (typeof knows0 === 'function' && knows0(fn, kind)); };
  })(window.MotionKit);\n`;
