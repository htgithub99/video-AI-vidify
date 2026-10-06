(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = root.THREE;
  const U = ME.util,
    C = ME.color;
  const K = (ME.T3 = { ok: !!T });
  if (!T) return;
  K.T = T;
  const PX = 0.01;
  K.PX = PX;
  let shared = null;
  K.hasWebGL = () => {
    try {
      const c = typeof OffscreenCanvas !== MT.UNDEFINED ? new OffscreenCanvas(8, 8) : document.createElement(MT.CANVAS);
      return !!(c.getContext(MT.WEBGL2) || c.getContext(MT.WEBGL));
    } catch (e) {
      return false;
    }
  };
  K.renderer = (W, H, q = {}) => {
    if (!shared) {
      const canvas = typeof OffscreenCanvas !== MT.UNDEFINED ? new OffscreenCanvas(W, H) : document.createElement(MT.CANVAS);
      shared = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: MT.HIGH_PERFORMANCE });
      shared.outputColorSpace = T.SRGBColorSpace;
      shared.toneMapping = T.ACESFilmicToneMapping;
      shared.toneMappingExposure = 1.0;
      shared.shadowMap.enabled = true;
      shared.shadowMap.type = T.PCFSoftShadowMap;
    }
    if (shared.__w !== W || shared.__h !== H) {
      shared.setPixelRatio(1);
      shared.setSize(W, H, false);
      shared.__w = W;
      shared.__h = H;
    }
    shared.shadowMap.enabled = q.shadows !== false;
    return shared;
  };
  K.rendererInfo = () => {
    try {
      const gl = K.renderer(16, 16).getContext();
      const ext = gl.getExtension(MT.WEBGL_DEBUG_RENDERER_INFO);
      return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    } catch (e) {
      return "";
    }
  };
  const mats = new Map();
  K.mat = (color, o = {}) => {
    const key = MF.SYMBOL_16(`${color}`, `${o.r == null ? 0.82 : o.r}`, `${o.m || 0}`, `${o.e || ""}`, `${o.ei || 0}`, `${o.t || ""}`, `${o.flat ? 1 : 0}`, `${o.side || 0}`);
    let m = mats.get(key);
    if (!m) {
      m = new T.MeshStandardMaterial({ color: new T.Color(color), roughness: o.r == null ? 0.82 : o.r, metalness: o.m || 0, flatShading: !!o.flat, side: o.side === 2 ? T.DoubleSide : T.FrontSide });
      if (o.e) {
        m.emissive = new T.Color(o.e);
        m.emissiveIntensity = o.ei == null ? 1 : o.ei;
      }
      if (o.t != null) {
        m.transparent = true;
        m.opacity = o.t;
        m.depthWrite = o.t > 0.9;
      }
      m.__shared = true;
      mats.set(key, m);
    }
    return m;
  };
  K.glass = (night) => K.mat(night ? MT.VALUE_202A3A : MT.VALUE_8FB3CC, { r: 0.15, m: 0.4 });
  const geos = new Map();
  K.geo = (key, make) => {
    let g = geos.get(key);
    if (!g) {
      g = make();
      geos.set(key, g);
    }
    return g;
  };
  K.box = (w, h, d) => K.geo(MF.B(`${w.toFixed(3)}`, `${h.toFixed(3)}`, `${d.toFixed(3)}`), () => new T.BoxGeometry(w, h, d));
  K.cyl = (rt, rb, h, n = 16) => K.geo(MF.C(`${rt.toFixed(3)}`, `${rb.toFixed(3)}`, `${h.toFixed(3)}`, `${n}`), () => new T.CylinderGeometry(rt, rb, h, n));
  K.sph = (r, n = 16) => K.geo(MF.S_2(`${r.toFixed(3)}`, `${n}`), () => new T.SphereGeometry(r, n, Math.max(6, Math.round(n * 0.7))));
  K.cap = (r, len, n = 10) => K.geo(MF.P(`${r.toFixed(3)}`, `${len.toFixed(3)}`, `${n}`), () => new T.CapsuleGeometry(r, Math.max(0.001, len), 4, n));
  K.ico = (r, d = 1) => K.geo(MF.I_2(`${r.toFixed(3)}`, `${d}`), () => new T.IcosahedronGeometry(r, d));
  K.cone = (r, h, n = 16) => K.geo(MF.K(`${r.toFixed(3)}`, `${h.toFixed(3)}`, `${n}`), () => new T.ConeGeometry(r, h, n));
  K.mesh = (geo, mat, x = 0, y = 0, z = 0, o = {}) => {
    const m = new T.Mesh(geo, typeof mat === MT.STRING ? K.mat(mat, o) : mat);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.setScalar(o.s);
    if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.recv !== false;
    return m;
  };
  K.group = (...children) => {
    const g = new T.Group();
    children.forEach((c) => c && g.add(c));
    return g;
  };
  K.profile = (pts, w, color, o = {}) => {
    const key = MF.PF(`${U.stringifyJson(pts)}`, `${w}`, `${o.bevel || 0}`);
    const geo = K.geo(key, () => {
      const sh = new T.Shape();
      sh.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
      sh.closePath();
      const b = o.bevel || 0;
      const g = new T.ExtrudeGeometry(sh, { depth: w - b * 2, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -(w - b * 2) / 2);
      return g;
    });
    return K.mesh(geo, color, 0, 0, 0, o);
  };
  const texCache = new Map();
  K.canvasTex = (key, w, h, draw, o = {}) => {
    let t = texCache.get(key);
    if (t) return t;
    const c = ME.makeCanvas(w, h);
    draw(c.getContext(MT.VALUE_2D), w, h);
    t = new T.CanvasTexture(c);
    t.colorSpace = o.linear ? T.NoColorSpace : T.SRGBColorSpace;
    t.anisotropy = 4;
    if (o.repeat) {
      t.wrapS = t.wrapT = T.RepeatWrapping;
    }
    texCache.set(key, t);
    return t;
  };
  K.facade = (wall, cols, rows, o = {}) => {
    const night = !!o.night;
    const key = MF.FA(`${wall}`, `${cols}`, `${rows}`, `${night}`, `${o.seed || 0}`, `${o.win || ""}`, `${o.ground || ""}`);
    const W = 256,
      H = Math.round((256 * rows) / Math.max(1, cols)) || 256;
    const map = K.canvasTex(key, W, H, (g) => {
      g.fillStyle = wall;
      g.fillRect(0, 0, W, H);
      const r = U.rng(o.seed || 3);
      for (let i = 0; i < 30; i++) {
        g.fillStyle = MF.RGBA_0_0_0(`${0.02 + r() * 0.04}`);
        g.fillRect(r() * W, r() * H, 20 + r() * 80, 2 + r() * 10);
      }
      const cw = W / cols,
        ch = H / rows;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          if (o.ground && j === rows - 1) continue;
          const lit = night && r() < (o.lit == null ? 0.35 : o.lit);
          g.fillStyle = lit ? MT.F3C97A : o.win || (night ? MT.VALUE_141B26 : MT.VALUE_3D5266);
          g.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.18, cw * 0.56, ch * 0.6);
          g.fillStyle = MT.RGBA_255_255_255_0_12;
          if (!night) g.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.18, cw * 0.56, ch * 0.08);
        }
      }
      if (o.ground) {
        g.fillStyle = MT.RGBA_0_0_0_0_35;
        g.fillRect(0, H - ch, W, ch);
        g.fillStyle = night ? MT.F2D08C : MT.VALUE_2E3D4C;
        g.fillRect(W * 0.1, H - ch * 0.85, W * 0.5, ch * 0.75);
      }
    });
    return map;
  };
  K.facadeMat = (wall, cols, rows, o = {}) => {
    const key = MF.FM(`${wall}`, `${cols}`, `${rows}`, `${!!o.night}`, `${o.seed || 0}`, `${o.ground || ""}`);
    let m = mats.get(key);
    if (!m) {
      const map = K.facade(wall, cols, rows, o);
      m = new T.MeshStandardMaterial({ map, roughness: 0.9 });
      if (o.night) {
        m.emissiveMap = map;
        m.emissive = new T.Color(MT.FFFFFF);
        m.emissiveIntensity = 0.55;
      }
      m.__shared = true;
      mats.set(key, m);
    }
    return m;
  };
  K.cardFrom2D = (id, params = {}, scale = 1) => {
    const def = ME.registry.assets[id];
    if (!def) return null;
    const key = MF.CARD(`${id}`, `${U.stringifyJson(params)}`);
    let entry = texCache.get(key);
    if (!entry) {
      const S = 2;
      const sz = def.size || [300, 300];
      const pad = 1.6;
      const cw = Math.min(4096, Math.ceil(sz[0] * pad * S)),
        chh = Math.min(4096, Math.ceil(sz[1] * pad * S));
      const c = ME.makeCanvas(cw, chh);
      const g = c.getContext(MT.VALUE_2D);
      g.translate(cw / 2, chh - 6 * S);
      g.scale(S, S);
      try {
        def.draw(g, Object.assign({ t: 0 }, params));
      } catch (e) {
        void e;
      }
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 4;
      entry = { tex, w: cw / S, h: chh / S, bottom: 6 };
      texCache.set(key, entry);
    }
    const mat = new T.MeshStandardMaterial({ map: entry.tex, transparent: true, alphaTest: 0.35, roughness: 0.9, side: T.DoubleSide });
    const geo = K.geo(MF.PLANE(`${entry.w}`, `${entry.h}`), () => {
      const pg = new T.PlaneGeometry(entry.w * PX, entry.h * PX);
      pg.translate(0, (entry.h / 2 - entry.bottom) * PX, 0);
      return pg;
    });
    const m = new T.Mesh(geo, mat);
    m.castShadow = true;
    m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: entry.tex, alphaTest: 0.35 });
    m.scale.setScalar(scale);
    return m;
  };
  const TIME3D = {
    day: { sun: MT.FFF3DF, sunI: 2.6, sunPos: [-18, 30, 16], hemiSky: MT.CFE3F5, hemiGround: MT.VALUE_8A7A62, hemiI: 1.2, exposure: 1.0, fog: 0.006, stars: false },
    dusk: { sun: MT.FFB27A, sunI: 2.0, sunPos: [-30, 9, -6], hemiSky: MT.VALUE_6D6A9A, hemiGround: MT.VALUE_5A4232, hemiI: 0.9, exposure: 1.0, fog: 0.012, stars: false },
    night: { fill: MT.FFD7A8, fillI: 0.75, sun: MT.A9C0F0, sunI: 1.15, sunPos: [20, 30, 10], hemiSky: MT.VALUE_3E5280, hemiGround: MT.VALUE_181C26, hemiI: 0.95, exposure: 1.3, fog: 0.014, stars: true },
    interior: { sun: MT.FFE2BD, sunI: 1.4, sunPos: [-6, 12, 10], hemiSky: MT.E6D4BC, hemiGround: MT.VALUE_3A2E24, hemiI: 0.9, exposure: 1.0, fog: 0.01, stars: false },
    interior_dark: { fill: MT.FFE0B0, fillI: 0.7, sun: MT.VALUE_9FB2D6, sunI: 0.7, sunPos: [4, 10, 8], hemiSky: MT.VALUE_3A4662, hemiGround: MT.VALUE_14161C, hemiI: 0.95, exposure: 1.35, fog: 0.02, stars: false },
  };
  K.TIME3D = TIME3D;
  K.lights = (scene, timeKey, tp) => {
    const L = TIME3D[timeKey] || TIME3D.day;
    const hemi = new T.HemisphereLight(L.hemiSky, L.hemiGround, L.hemiI);
    scene.add(hemi);
    const sun = new T.DirectionalLight(L.sun, L.sunI);
    sun.position.set(...L.sunPos);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -22;
    sc.right = 22;
    sc.top = 18;
    sc.bottom = -10;
    sc.near = 1;
    sc.far = 120;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    scene.add(sun.target);
    scene.fog = new T.FogExp2(new T.Color(tp.haze || MT.VALUE_9FB4C4), L.fog);
    const fill = new T.DirectionalLight(L.fill || MT.FFE6C8, L.fillI == null ? 0.45 : L.fillI);
    fill.position.set(0, 6, 30);
    scene.add(fill);
    return { hemi, sun, L, fill };
  };
  K.sky = (scene, tp, timeKey, interior) => {
    if (interior) {
      scene.background = new T.Color(MT.VALUE_0B0A09);
      return null;
    }
    const geo = new T.SphereGeometry(400, 32, 16);
    const top = new T.Color(tp.sky[0]),
      mid = new T.Color(tp.sky[1]),
      hz = new T.Color(tp.haze);
    const cols = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 400;
      const c = y > 0.25 ? mid.clone().lerp(top, U.clamp((y - 0.25) / 0.75)) : hz.clone().lerp(mid, U.clamp(y / 0.25));
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute(MT.COLOR, new T.Float32BufferAttribute(cols, 3));
    const dome = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
    scene.add(dome);
    if (TIME3D[timeKey] && TIME3D[timeKey].stars) {
      const r = U.rng(7);
      const pts = [];
      for (let i = 0; i < 700; i++) {
        const a = r() * Math.PI * 2,
          e = 0.12 + r() * 1.3;
        pts.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380);
      }
      const sg = new T.BufferGeometry();
      sg.setAttribute(MT.POSITION, new T.Float32BufferAttribute(pts, 3));
      scene.add(new T.Points(sg, new T.PointsMaterial({ color: MT.E8EEFF, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
      const moon = new T.Mesh(new T.SphereGeometry(9, 24, 16), new T.MeshBasicMaterial({ color: MT.F3EFE0, fog: false }));
      moon.position.set(120, 150, -300);
      scene.add(moon);
    } else if (timeKey === MT.DAY) {
      const r = U.rng(11);
      for (let i = 0; i < 7; i++) {
        const cl = new T.Group();
        for (let k = 0; k < 5; k++) {
          const s = new T.Mesh(K.sph(1, 10), K.mat(MT.FFFFFF, { r: 1 }));
          s.scale.set(6 + r() * 6, 3 + r() * 2, 4 + r() * 3);
          s.position.set(k * 6 - 12, r() * 2, r() * 3);
          s.castShadow = false;
          cl.add(s);
        }
        cl.position.set(-150 + i * 55 + r() * 20, 70 + r() * 30, -220 - r() * 60);
        scene.add(cl);
      }
    }
    return dome;
  };
  K.lightCone = (color, len, radius, alpha = 0.18) => {
    const geo = K.geo(MF.LC(`${len}`, `${radius}`), () => {
      const g = new T.ConeGeometry(radius, len, 32, 1, true);
      g.translate(0, -len / 2, 0);
      const pos = g.attributes.position;
      const cols = [];
      for (let i = 0; i < pos.count; i++) {
        const k = Math.pow(1 - U.clamp(-pos.getY(i) / len), 1.6);
        cols.push(k, k, k);
      }
      g.setAttribute(MT.COLOR, new T.Float32BufferAttribute(cols, 3));
      return g;
    });
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, vertexColors: true, transparent: true, opacity: Math.min(1, alpha * 2.2), blending: T.AdditiveBlending, depthWrite: false, side: T.FrontSide, fog: false }));
    m.castShadow = false;
    m.receiveShadow = false;
    return m;
  };
  K.dispose = (obj) => {
    obj.traverse((o) => {
      if (o.material && !o.material.__shared) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) if (!m.__shared) m.dispose();
      }
    });
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
