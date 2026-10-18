(function (root) {
  "use strict";
  const MT = root.MotionEngineText;
  const ME = root.MotionEngine;
  const U = ME.util;
  const GEN = ME.GEN;
  const T = GEN.T;
  if (!T) return;
  const DEG = Math.PI / 180;
  const texCache = new Map();
  const rng = (seed) => U.rng(seed);
  const shade = (hex, k) => {
    const c = new T.Color(hex);
    if (k >= 0) c.lerp(new T.Color(1, 1, 1), k);
    else c.multiplyScalar(1 + k);
    return MT.SYMBOL_2 + c.getHexString();
  };
  GEN.shade = shade;
  const noiseFill = (g, w, h, seed, amt, size) => {
    const r = rng(seed);
    const n = Math.round((w * h) / (size * size * 0.7));
    for (let i = 0; i < n; i++) {
      const v = r();
      g.fillStyle = v > 0.5 ? MT.RGBA_255_255_255 + (amt * (v - 0.5)).toFixed(3) + MT.SYMBOL_17 : MT.RGBA_0_0_0_2 + (amt * (0.5 - v)).toFixed(3) + MT.SYMBOL_17;
      const s = size * (0.4 + r() * 1.2);
      g.fillRect(r() * w, r() * h, s, s);
    }
  };
  const blotches = (g, w, h, seed, n, alpha) => {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * w,
        y = r() * h,
        rad = 10 + r() * w * 0.18;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const dark = r() > 0.45;
      gr.addColorStop(0, dark ? MT.RGBA_0_0_0_2 + alpha + MT.SYMBOL_17 : MT.RGBA_255_255_255 + alpha * 0.7 + MT.SYMBOL_17);
      gr.addColorStop(1, MT.RGBA_0_0_0_0);
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  };
  const PAINT = {
    concrete(g, w, h, m) {
      blotches(g, w, h, 11, 40, 0.07);
      noiseFill(g, w, h, 3, 0.16, 2);
      g.strokeStyle = MT.RGBA_0_0_0_0_08;
      g.lineWidth = 2;
      g.strokeRect(0, 0, w, h);
    },
    asphalt(g, w, h) {
      noiseFill(g, w, h, 5, 0.3, 2);
      blotches(g, w, h, 19, 25, 0.08);
    },
    road(g, w, h, m) {
      noiseFill(g, w, h, 5, 0.3, 2);
      blotches(g, w, h, 19, 20, 0.08);
      g.fillStyle = m.patternColor || MT.D9D4C4;
      for (let y = 0; y < h; y += h / 4) g.fillRect(w / 2 - w * 0.012, y + h * 0.04, w * 0.024, h * 0.14);
    },
    gravel(g, w, h) {
      const r = rng(7);
      for (let i = 0; i < 2600; i++) {
        const v = 0.25 + r() * 0.5;
        g.fillStyle = MT.RGBA + [255, 255, 255].map((c) => Math.round(c * v)).join(MT.SYMBOL_14) + MT.VALUE_0_35;
        g.beginPath();
        g.arc(r() * w, r() * h, 1 + r() * 3.5, 0, Math.PI * 2);
        g.fill();
      }
    },
    tiles(g, w, h, m) {
      const n = m.cols || 4;
      const c = w / n;
      noiseFill(g, w, h, 9, 0.06, 2);
      const r = rng(4);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          g.fillStyle = MT.RGBA + (r() > 0.5 ? MT.VALUE_255_255_255 : MT.VALUE_0_0_0) + (r() * 0.06).toFixed(3) + MT.SYMBOL_17;
          g.fillRect(i * c, j * c, c, c);
        }
      g.strokeStyle = m.patternColor || MT.RGBA_0_0_0_0_35;
      g.lineWidth = Math.max(2, w / 220);
      for (let i = 0; i <= n; i++) {
        g.beginPath();
        g.moveTo(i * c, 0);
        g.lineTo(i * c, h);
        g.moveTo(0, i * c);
        g.lineTo(w, i * c);
        g.stroke();
      }
    },
    checker(g, w, h, m) {
      const n = m.cols || 4;
      const c = w / n;
      g.fillStyle = m.patternColor || MT.VALUE_202020;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) g.fillRect(i * c, j * c, c, c);
      noiseFill(g, w, h, 9, 0.05, 2);
    },
    brick(g, w, h, m) {
      const rows = m.rows || 8,
        cols = m.cols || 4;
      const bh = h / rows,
        bw = w / cols;
      const r = rng(21);
      g.fillStyle = m.patternColor || MT.RGBA_220_215_205_0_9;
      g.fillRect(0, 0, w, h);
      for (let j = 0; j < rows; j++)
        for (let i = -1; i < cols; i++) {
          const x = i * bw + (j % 2 ? bw / 2 : 0);
          g.fillStyle = shade(m.color, (r() - 0.5) * 0.28);
          g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
        }
      noiseFill(g, w, h, 23, 0.12, 2);
    },
    wood(g, w, h) {
      const r = rng(31);
      for (let i = 0; i < 90; i++) {
        g.strokeStyle = MT.RGBA_0_0_0_2 + (0.03 + r() * 0.07).toFixed(3) + MT.SYMBOL_17;
        g.lineWidth = 1 + r() * 3;
        const y = r() * h;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += w / 8) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 4);
        g.stroke();
      }
      noiseFill(g, w, h, 33, 0.05, 2);
    },
    planks(g, w, h, m) {
      PAINT.wood(g, w, h, m);
      const n = m.rows || 6;
      const ph = h / n;
      const r = rng(35);
      for (let j = 0; j < n; j++) {
        g.fillStyle = MT.RGBA + (r() > 0.5 ? MT.VALUE_255_255_255 : MT.VALUE_0_0_0) + (r() * 0.08).toFixed(3) + MT.SYMBOL_17;
        g.fillRect(0, j * ph, w, ph);
        g.fillStyle = MT.RGBA_0_0_0_0_35;
        g.fillRect(0, j * ph, w, 2);
        const off = r() * w;
        g.fillRect(off, j * ph, 2, ph);
      }
    },
    marble(g, w, h) {
      const r = rng(41);
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = MT.RGBA_90_90_100 + (0.06 + r() * 0.12).toFixed(3) + MT.SYMBOL_17;
        g.lineWidth = 0.6 + r() * 2.2;
        let x = r() * w,
          y = 0;
        g.beginPath();
        g.moveTo(x, y);
        while (y < h) {
          x += (r() - 0.5) * 40;
          y += 10 + r() * 30;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      noiseFill(g, w, h, 43, 0.04, 2);
    },
    metal(g, w, h) {
      const r = rng(51);
      for (let i = 0; i < 400; i++) {
        g.fillStyle = MT.RGBA_255_255_255 + (r() * 0.05).toFixed(3) + MT.SYMBOL_17;
        g.fillRect(0, r() * h, w, 1);
      }
      noiseFill(g, w, h, 53, 0.05, 1.5);
    },
    rust(g, w, h) {
      blotches(g, w, h, 55, 60, 0.18);
      noiseFill(g, w, h, 57, 0.25, 2);
    },
    fabric(g, w, h) {
      for (let i = 0; i < w; i += 4) {
        g.fillStyle = MT.RGBA_0_0_0_0_05;
        g.fillRect(i, 0, 2, h);
        g.fillRect(0, i, w, 2);
      }
      noiseFill(g, w, h, 61, 0.05, 2);
    },
    carpet(g, w, h) {
      noiseFill(g, w, h, 63, 0.18, 1.5);
      blotches(g, w, h, 65, 12, 0.04);
    },
    leather(g, w, h) {
      noiseFill(g, w, h, 67, 0.12, 3);
      blotches(g, w, h, 69, 20, 0.05);
    },
    grass(g, w, h) {
      const r = rng(71);
      for (let i = 0; i < 9000; i++) {
        const v = r();
        g.strokeStyle = v > 0.5 ? MT.RGBA_200_230_120 + (0.08 + r() * 0.12).toFixed(3) + MT.SYMBOL_17 : MT.RGBA_0_30_0 + (0.08 + r() * 0.15).toFixed(3) + MT.SYMBOL_17;
        g.lineWidth = 1;
        const x = r() * w,
          y = r() * h;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 7);
        g.stroke();
      }
      blotches(g, w, h, 73, 30, 0.08);
    },
    dirt(g, w, h) {
      blotches(g, w, h, 81, 50, 0.1);
      noiseFill(g, w, h, 83, 0.22, 2);
    },
    sand(g, w, h) {
      noiseFill(g, w, h, 85, 0.12, 1.2);
      const r = rng(86);
      for (let i = 0; i < 30; i++) {
        g.strokeStyle = MT.RGBA_0_0_0_0_04;
        g.lineWidth = 3;
        const y = r() * h;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 10, w, y);
        g.stroke();
      }
    },
    water(g, w, h) {
      const r = rng(91);
      for (let i = 0; i < 260; i++) {
        g.strokeStyle = MT.RGBA_255_255_255 + (r() * 0.12).toFixed(3) + MT.SYMBOL_17;
        g.lineWidth = 1 + r() * 2;
        const x = r() * w,
          y = r() * h,
          l = 10 + r() * 40;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + l / 2, y - 3, x + l, y);
        g.stroke();
      }
    },
    stone(g, w, h, m) {
      const r = rng(95);
      const n = m.cols || 5;
      const c = w / n;
      g.fillStyle = m.patternColor || MT.RGBA_0_0_0_0_45;
      g.fillRect(0, 0, w, h);
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          g.fillStyle = shade(m.color, (r() - 0.5) * 0.3);
          const x = i * c + (j % 2 ? c / 2 : 0) - (r() * c) / 6;
          g.beginPath();
          g.moveTo(x + 4, j * c + 4 + r() * 4);
          g.lineTo(x + c - 4 - r() * 6, j * c + 4);
          g.lineTo(x + c - 4, j * c + c - 4 - r() * 6);
          g.lineTo(x + 4 + r() * 6, j * c + c - 4);
          g.closePath();
          g.fill();
        }
      noiseFill(g, w, h, 97, 0.12, 2);
    },
    plaster(g, w, h) {
      blotches(g, w, h, 101, 30, 0.04);
      noiseFill(g, w, h, 103, 0.06, 2);
    },
    panels(g, w, h, m) {
      const cols = m.cols || 4,
        rows = m.rows || 4;
      g.strokeStyle = m.patternColor || MT.RGBA_0_0_0_0_5;
      g.lineWidth = Math.max(3, w / 120);
      for (let i = 0; i <= cols; i++) {
        g.beginPath();
        g.moveTo((i * w) / cols, 0);
        g.lineTo((i * w) / cols, h);
        g.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        g.beginPath();
        g.moveTo(0, (j * h) / rows);
        g.lineTo(w, (j * h) / rows);
        g.stroke();
      }
      noiseFill(g, w, h, 105, 0.04, 2);
    },
    stripes(g, w, h, m) {
      const n = m.rows || 8;
      g.fillStyle = m.patternColor || MT.FFFFFF;
      for (let j = 0; j < n; j += 2) g.fillRect(0, (j * h) / n, w, h / n);
    },
    noise(g, w, h) {
      noiseFill(g, w, h, 111, 0.2, 2);
    },
  };
  const patternTex = (m) => {
    const key = [m.pattern, m.color, m.patternColor || MT.EMPTY, m.cols || 0, m.rows || 0].join(MT.SYMBOL_20);
    let t = texCache.get(key);
    if (t) return t;
    const S = 512;
    const c = ME.makeCanvas(S, S);
    const g = c.getContext(MT.VALUE_2D);
    g.fillStyle = m.color;
    g.fillRect(0, 0, S, S);
    (PAINT[m.pattern] || PAINT.noise)(g, S, S, m);
    t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    texCache.set(key, t);
    return t;
  };
  const bumpTex = (m) => {
    const key = MT.BUMP + m.pattern + MT.SYMBOL_20 + (m.cols || 0) + MT.SYMBOL_20 + (m.rows || 0);
    let t = texCache.get(key);
    if (t) return t;
    const S = 256;
    const c = ME.makeCanvas(S, S);
    const g = c.getContext(MT.VALUE_2D);
    g.fillStyle = MT.VALUE_808080;
    g.fillRect(0, 0, S, S);
    (PAINT[m.pattern] || PAINT.noise)(g, S, S, Object.assign({}, m, { color: MT.VALUE_808080, patternColor: MT.VALUE_303030 }));
    t = new T.CanvasTexture(c);
    t.colorSpace = T.NoColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    texCache.set(key, t);
    return t;
  };
  const DEFAULT_SCALE = { concrete: 3, asphalt: 4, road: 8, gravel: 2, tiles: 2.4, checker: 2, brick: 2.4, wood: 2, planks: 2.4, marble: 2.5, metal: 1.5, rust: 2, fabric: 0.6, carpet: 2, leather: 1, grass: 3, dirt: 4, sand: 3, water: 4, stone: 3, plaster: 3, panels: 3, stripes: 1, noise: 2 };
  GEN.makeMaterial = (m, env) => {
    m = m || { color: MT.VALUE_999999 };
    let mat;
    const params = { color: new T.Color(m.color || MT.VALUE_999999), roughness: m.roughness == null ? 0.75 : m.roughness, metalness: m.metalness || 0 };
    if (m.unlit) {
      mat = new T.MeshBasicMaterial({ color: params.color, fog: true });
    } else if (m.glass) {
      mat = new T.MeshPhysicalMaterial(Object.assign(params, { roughness: Math.min(params.roughness, 0.12), metalness: Math.max(params.metalness, 0.1), transparent: true, opacity: m.opacity == null ? 0.42 : m.opacity, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03, reflectivity: 0.9, ior: 1.5 }));
      mat.depthWrite = false;
    } else if (m.clearcoat) {
      mat = new T.MeshPhysicalMaterial(Object.assign(params, { clearcoat: m.clearcoat, clearcoatRoughness: 0.08 }));
    } else mat = new T.MeshStandardMaterial(params);
    if (m.pattern && !m.unlit) {
      mat.map = patternTex(m);
      if (m.bump !== 0 && mat.isMeshStandardMaterial) {
        mat.bumpMap = bumpTex(m);
        mat.bumpScale = m.bump == null ? 0.6 : m.bump;
      }
      mat.color = new T.Color(MT.FFFFFF);
      mat.userData.uvScale = m.scale || DEFAULT_SCALE[m.pattern] || 2;
    }
    if (m.emissive && mat.isMeshBasicMaterial) {
      mat.color = new T.Color(m.emissive).multiplyScalar(1.4 + Math.min(1.6, (m.emissiveIntensity == null ? 1.5 : m.emissiveIntensity) * 0.6));
      mat.userData.glow = true;
    } else if (m.emissive) {
      mat.emissive = new T.Color(m.emissive);
      mat.emissiveIntensity = m.emissiveIntensity == null ? 1.5 : m.emissiveIntensity;
      mat.toneMapped = true;
    }
    if (m.opacity != null && !m.glass) {
      mat.transparent = true;
      mat.opacity = m.opacity;
      mat.depthWrite = m.opacity > 0.85;
    }
    if (m.double) mat.side = T.DoubleSide;
    if (m.flat) mat.flatShading = true;
    mat.userData.def = m;
    return mat;
  };
  const boxUV = (geo, scale) => {
    const pos = geo.attributes.position,
      nor = geo.attributes.normal;
    if (!pos || !nor) return geo;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(nor.getX(i)),
        ny = Math.abs(nor.getY(i)),
        nz = Math.abs(nor.getZ(i));
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      let u, v;
      if (ny >= nx && ny >= nz) {
        u = x;
        v = z;
      } else if (nx >= nz) {
        u = z;
        v = y;
      } else {
        u = x;
        v = y;
      }
      uv[i * 2] = u / scale;
      uv[i * 2 + 1] = v / scale;
    }
    geo.setAttribute(MT.UV, new T.BufferAttribute(uv, 2));
    return geo;
  };
  GEN.boxUV = boxUV;
  const geoCache = new Map();
  const shapeFrom = (pts, holes) => {
    const sh = new T.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    for (const h of holes || []) {
      const p = new T.Path();
      p.moveTo(h[0][0], h[0][1]);
      for (let i = 1; i < h.length; i++) p.lineTo(h[i][0], h[i][1]);
      p.closePath();
      sh.holes.push(p);
    }
    return sh;
  };
  const roundedBox = (w, h, d, r) => {
    const sh = new T.Shape();
    const x = -w / 2 + r,
      y = -h / 2 + r,
      W = w - 2 * r,
      H = h - 2 * r;
    sh.moveTo(x, y - r);
    sh.lineTo(x + W, y - r);
    sh.quadraticCurveTo(x + W + r, y - r, x + W + r, y);
    sh.lineTo(x + W + r, y + H);
    sh.quadraticCurveTo(x + W + r, y + H + r, x + W, y + H + r);
    sh.lineTo(x, y + H + r);
    sh.quadraticCurveTo(x - r, y + H + r, x - r, y + H);
    sh.lineTo(x - r, y);
    sh.quadraticCurveTo(x - r, y - r, x, y - r);
    const depth = Math.max(0.0005, d - 2 * r);
    const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.98, bevelSegments: 3, curveSegments: 4 });
    g.translate(0, 0, -depth / 2);
    return g;
  };
  const strokeGeometry = (n) => {
    const raw = n.points.map((p) => new T.Vector3(p[0], p[1], 0));
    const pts = n.straight || raw.length < 3 ? raw : new T.CatmullRomCurve3(raw, !!n.closed, MT.CENTRIPETAL).getPoints(Math.max(12, raw.length * 10));
    if (n.fill && pts.length >= 3) return new T.ShapeGeometry(new T.Shape(pts.map((p) => new T.Vector2(p.x, p.y))));
    const loop = n.closed && !n.fill ? [...pts, pts[0]] : pts;
    const half = n.width / 2,
      position = [],
      index = [];
    for (let i = 0; i < loop.length; i++) {
      const prev = loop[Math.max(0, i - 1)],
        next = loop[Math.min(loop.length - 1, i + 1)];
      let dx = next.x - prev.x,
        dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const taper = loop.length > 3 && !n.closed ? Math.min(1, 0.35 + Math.min(i, loop.length - 1 - i) / 3) : 1;
      position.push(loop[i].x - dy * half * taper, loop[i].y + dx * half * taper, 0, loop[i].x + dy * half * taper, loop[i].y - dx * half * taper, 0);
      if (i) index.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    }
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.Float32BufferAttribute(position, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  };
  const geometryFor = (n) => {
    const key = JSON.stringify([n.shape, n.size, n.radius, n.radiusTop, n.radiusBottom, n.height, n.segments, n.tube, n.arc, n.inner, n.points, n.depth, n.bevel, n.holes, n.path, n.closed, n.open, n.hemisphere, n.smooth, n.width, n.fill, n.straight]);
    let g = geoCache.get(key);
    if (g) return g;
    switch (n.shape) {
      case MT.BOX:
        g = n.bevel ? roundedBox(n.size[0], n.size[1], n.size[2], n.bevel) : new T.BoxGeometry(n.size[0], n.size[1], n.size[2]);
        break;
      case MT.CYLINDER:
        g = new T.CylinderGeometry(n.radiusTop != null ? n.radiusTop : n.radius, n.radiusBottom != null ? n.radiusBottom : n.radius, n.height, n.segments, 1, !!n.open, 0, (n.arc || 360) * DEG);
        break;
      case MT.CONE:
        g = new T.ConeGeometry(n.radius, n.height, n.segments, 1, !!n.open, 0, (n.arc || 360) * DEG);
        break;
      case MT.SPHERE:
        g = new T.SphereGeometry(n.radius, n.segments, Math.max(4, Math.round(n.segments * 0.7)), 0, Math.PI * 2, 0, n.hemisphere ? Math.PI / 2 : Math.PI);
        break;
      case MT.TORUS:
        g = new T.TorusGeometry(n.radius, n.tube, 12, 48, (n.arc || 360) * DEG);
        break;
      case MT.CAPSULE:
        g = new T.CapsuleGeometry(n.radius, Math.max(0.001, n.height - 2 * n.radius), 6, 16);
        break;
      case MT.PLANE:
        g = new T.PlaneGeometry(n.size[0], n.size[1]);
        break;
      case MT.DISC:
        g = new T.CircleGeometry(n.radius, n.segments);
        break;
      case MT.RING:
        g = new T.RingGeometry(n.inner, n.radius, 48);
        break;
      case MT.EXTRUDE: {
        const b = n.bevel || 0;
        g = new T.ExtrudeGeometry(shapeFrom(n.points, n.holes), { depth: Math.max(0.0005, n.depth - b * 2), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 8 });
        g.translate(0, 0, -Math.max(0.0005, n.depth - b * 2) / 2);
        if (n.smooth) g.computeVertexNormals();
        break;
      }
      case MT.LATHE:
        g = new T.LatheGeometry(
          n.points.map((p) => new T.Vector2(p[0], p[1])),
          n.segments,
        );
        break;
      case MT.TUBE: {
        const curve = new T.CatmullRomCurve3(
          n.path.map((p) => new T.Vector3(p[0], p[1], p[2])),
          !!n.closed,
          MT.CENTRIPETAL,
        );
        g = new T.TubeGeometry(curve, Math.max(8, n.path.length * 8), n.radius, 10, !!n.closed);
        break;
      }
      case MT.STROKE:
        g = strokeGeometry(n);
        break;
      default:
        g = new T.BoxGeometry(0.1, 0.1, 0.1);
    }
    geoCache.set(key, g);
    return g;
  };
  const uvGeo = (geo, scale) => {
    const key = geo.uuid + MT.SYMBOL_20 + scale;
    let g = geoCache.get(key);
    if (g) return g;
    g = boxUV(geo.clone(), scale);
    geoCache.set(key, g);
    return g;
  };
  const textMesh = (n, env) => {
    const px = 128;
    const c0 = ME.makeCanvas(8, 8).getContext(MT.VALUE_2D);
    const font = n.weight + MT.SYMBOL_3 + px + MT.PX + (ME.FONTS ? ME.FONTS.head || MT.SANS_SERIF : MT.SANS_SERIF);
    c0.font = font;
    const tw = Math.max(px, c0.measureText(n.text).width + px * 0.5);
    const c = ME.makeCanvas(Math.ceil(tw), Math.ceil(px * 1.4));
    const g = c.getContext(MT.VALUE_2D);
    if (n.bg) {
      g.fillStyle = n.bg;
      g.fillRect(0, 0, c.width, c.height);
    }
    g.font = font;
    g.fillStyle = n.color;
    g.textAlign = MT.CENTER;
    g.textBaseline = MT.MIDDLE;
    g.fillText(n.text, c.width / 2, c.height / 2 + px * 0.05);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    const h = n.height,
      w = (h * c.width) / c.height;
    const mat = n.glow ? new T.MeshBasicMaterial({ map: tex, transparent: !n.bg, toneMapped: false }) : new T.MeshStandardMaterial({ map: tex, transparent: !n.bg, roughness: 0.6, emissive: new T.Color(MT.FFFFFF), emissiveMap: tex, emissiveIntensity: 0.25 });
    if (n.glow) mat.color = new T.Color(1.8, 1.8, 1.8);
    const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
    env.disposables.push(m.geometry, mat, tex);
    return m;
  };
  const arrowNode = (n, env) => {
    const g = new T.Group();
    const dir = new T.Vector3(n.to[0] - n.from[0], n.to[1] - n.from[1], n.to[2] - n.from[2]);
    const len = dir.length();
    if (len < 1e-3) return g;
    const r = n.radius;
    const head = Math.min(len * 0.45, r * 6);
    const mat = n.glow ? new T.MeshBasicMaterial({ color: new T.Color(n.color).multiplyScalar(1.6), toneMapped: false }) : new T.MeshStandardMaterial({ color: n.color, roughness: 0.5 });
    const shaft = new T.Mesh(new T.CylinderGeometry(r, r, len - head, 12), mat);
    shaft.position.y = (len - head) / 2;
    const tip = new T.Mesh(new T.ConeGeometry(r * 2.6, head, 16), mat);
    tip.position.y = len - head / 2;
    const inner = new T.Group();
    inner.add(shaft, tip);
    inner.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    g.add(inner);
    env.disposables.push(shaft.geometry, tip.geometry, mat);
    return g;
  };
  GEN.flashColor = (fl, t) => {
    const cyc = t * fl.hz + fl.phase;
    const i = Math.floor(cyc) % fl.colors.length;
    const on = cyc - Math.floor(cyc) < fl.duty;
    return { color: fl.colors[i], on };
  };
  const makeLight = (n, env) => {
    let light;
    const col = new T.Color(n.color);
    if (n.type === MT.POINT) {
      light = new T.PointLight(col, n.intensity * 10, n.distance, 2);
      light.position.set(n.pos[0], n.pos[1], n.pos[2]);
    } else if (n.type === MT.SPOT) {
      light = new T.SpotLight(col, n.intensity * 25, n.distance, n.angle * DEG, n.penumbra, 2);
      light.position.set(n.pos[0], n.pos[1], n.pos[2]);
      light.target.position.set(n.target[0], n.target[1], n.target[2]);
      env.root.add(light.target);
    } else if (n.type === MT.SUN) {
      light = new T.DirectionalLight(col, n.intensity);
      light.position.set(n.pos[0], n.pos[1], n.pos[2]);
      light.target.position.set(n.target[0], n.target[1], n.target[2]);
      env.root.add(light.target);
      env.sun = light;
    } else if (n.type === MT.HEMI) {
      light = new T.HemisphereLight(col, new T.Color(n.ground || MT.VALUE_333333), n.intensity);
    } else light = new T.AmbientLight(col, n.intensity);
    if (n.shadow && (light.isSpotLight || light.isDirectionalLight || light.isPointLight) && env.shadowBudget > 0) {
      env.shadowBudget--;
      light.castShadow = true;
      light.shadow.mapSize.set(light.isPointLight ? 512 : 1024, light.isPointLight ? 512 : 1024);
      light.shadow.bias = -0.0008;
      light.shadow.normalBias = 0.03;
    }
    if (n.flash || n.flicker) env.animated.push({ light, def: n, base: n.intensity, baseColor: col.clone() });
    env.lights.push(light);
    return light;
  };
  const applyTransform = (o, n) => {
    o.position.set(n.pos[0], n.pos[1], n.pos[2]);
    if (n.rot) o.rotation.set(n.rot[0] * DEG, n.rot[1] * DEG, n.rot[2] * DEG, MT.YXZ);
    if (n.scale) o.scale.set(n.scale[0], n.scale[1], n.scale[2]);
  };
  const resolveMat = (n, env, inherited) => {
    let def;
    if (n.mat == null) def = inherited || env.defaultMat;
    else if (typeof n.mat === MT.STRING) def = env.materials[n.mat] || env.defaultMat;
    else def = n.mat;
    const key = JSON.stringify(def);
    let m = env.matCache.get(key);
    if (!m) {
      m = GEN.makeMaterial(def, env);
      env.matCache.set(key, m);
      env.disposables.push(m);
    }
    return m;
  };
  const meshFor = (n, env, inheritedMat) => {
    let mat = resolveMat(n, env, inheritedMat);
    if (n.shape === MT.STROKE && mat.side !== T.DoubleSide) {
      mat = mat.clone();
      mat.side = T.DoubleSide;
      env.disposables.push(mat);
    }
    let geo = geometryFor(n);
    if (mat.userData.uvScale) geo = uvGeo(geo, mat.userData.uvScale);
    const m = new T.Mesh(geo, mat);
    const transparent = mat.transparent || mat.isMeshBasicMaterial;
    m.castShadow = !n.noShadow && !transparent && n.shape !== MT.STROKE;
    m.receiveShadow = !transparent;
    if (mat.transparent) m.renderOrder = 2;
    return m;
  };
  GEN.models = GEN.models || {};
  GEN.loadModels = async (urls, base) => {
    const X = T.addons;
    const todo = (urls || []).filter((u) => u && !GEN.models[u]);
    if (!todo.length) return;
    const loader = new X.GLTFLoader();
    if (X.MeshoptDecoder) loader.setMeshoptDecoder(X.MeshoptDecoder);
    await Promise.all(
      todo.map(
        (u) =>
          new Promise((resolve) => {
            loader.load(
              (base || MT.EMPTY) + u,
              (g) => {
                const scene = g.scene;
                scene.updateMatrixWorld(true);
                scene.traverse((o) => {
                  if (!o.isMesh) return;
                  o.castShadow = true;
                  o.receiveShadow = true;
                  const mats = Array.isArray(o.material) ? o.material : [o.material];
                  for (const m of mats) if (m && m.map) m.map.anisotropy = 4;
                });
                GEN.models[u] = { scene, box: new T.Box3().setFromObject(scene) };
                resolve();
              },
              undefined,
              () => {
                GEN.models[u] = { failed: true };
                resolve();
              },
            );
          }),
      ),
    );
  };
  const modelNode = (n, env) => {
    const rec = GEN.models[n._url];
    const want = n._size || [1, 1, 1];
    const o = new T.Group();
    o.userData.ref = n.ref;
    if (!rec || rec.failed || rec.box.isEmpty()) {
      const h = n.height || want[1];
      const w = n.width || want[0];
      const d = n.length || want[2];
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), resolveMat({}, env));
      env.disposables.push(m.geometry);
      m.position.y = h / 2;
      m.castShadow = true;
      m.receiveShadow = true;
      o.add(m);
      return o;
    }
    const size = rec.box.getSize(new T.Vector3());
    let k;
    if (n.height) k = n.height / Math.max(1e-6, size.y);
    else if (n.length) k = n.length / Math.max(1e-6, size.x, size.z);
    else if (n.width) k = n.width / Math.max(1e-6, Math.min(size.x, size.z));
    else k = Math.max(want[0], want[1], want[2]) / Math.max(1e-6, size.x, size.y, size.z);
    const inner = rec.scene.clone(true);
    if (n.tint) {
      const tint = new T.Color(n.tint);
      inner.traverse((c) => {
        if (!c.isMesh || !c.material) return;
        c.material = c.material.clone();
        if (c.material.color) c.material.color.multiply(tint);
        env.disposables.push(c.material);
      });
    }
    const center = rec.box.getCenter(new T.Vector3());
    inner.scale.setScalar(k);
    inner.position.set(-center.x * k, -rec.box.min.y * k, -center.z * k);
    o.add(inner);
    return o;
  };
  const SHELL_VOLUMES = [MT.CAPSULE, MT.SPHERE, MT.CYLINDER, MT.CONE, MT.BOX];
  const SHELL_FLATS = [MT.DISC, MT.RING];
  const shellDims = (n) => {
    const s = Array.isArray(n.scale) ? n.scale : [1, 1, 1];
    if (n.shape === MT.BOX && Array.isArray(n.size)) return [n.size[0] * s[0], n.size[1] * s[1], n.size[2] * s[2]];
    const r = Number(n.radius) || 0.5;
    if (n.shape === MT.SPHERE) return [r * s[0], r * s[1], r * s[2]];
    if (n.shape === MT.DISC || n.shape === MT.RING) return [r * s[0], r * s[1]];
    return [r * s[0], (Number(n.height) || 1) * s[1], r * s[2]];
  };
  const shellColor = (n, env, inheritedMat) => {
    const m = n.mat != null ? (typeof n.mat === MT.STRING ? env.materials[n.mat] : n.mat) : inheritedMat;
    return m && m.color ? new T.Color(m.color) : null;
  };
  const shellable = (n, env) => SHELL_VOLUMES.includes(n.shape) || (!!env.outlined && SHELL_FLATS.includes(n.shape));
  const shellSkip = (list, env, inheritedMat) => {
    const skip = new Set();
    if (!Array.isArray(list) || list.length < 2) return skip;
    const outline = env.outlineColor ? new T.Color(env.outlineColor) : null;
    const dark = (c) => !!c && (c.r * 0.3 + c.g * 0.59 + c.b * 0.11 < 0.06 || (outline && Math.abs(c.r - outline.r) + Math.abs(c.g - outline.g) + Math.abs(c.b - outline.b) < 0.05));
    const same = (a, b) => (a || [0, 0, 0]).every((v, i) => Math.abs(v - ((b || [0, 0, 0])[i] || 0)) < 0.5);
    for (const a of list) {
      if (!a || !shellable(a, env)) continue;
      const ca = shellColor(a, env, inheritedMat);
      if (!dark(ca)) continue;
      const da = shellDims(a);
      const hit = list.find((b) => {
        if (b === a || !b || b.shape !== a.shape || dark(shellColor(b, env, inheritedMat))) return false;
        const pa = a.pos || [0, 0, 0],
          pb = b.pos || [0, 0, 0];
        if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]) > 0.05 || !same(a.rot, b.rot)) return false;
        const db = shellDims(b);
        const ratios = da.map((v, i) => (db[i] > 1e-6 ? v / db[i] : 1));
        return ratios.every((k) => k >= 0.98 && k <= 1.3) && ratios.some((k) => k > 1.01);
      });
      if (hit) skip.add(a);
    }
    return skip;
  };
  const build = (n, env, inheritedMat, depth) => {
    if (n.hidden) return null;
    if (depth > 12) return null;
    if (n.shape === MT.LIGHT) return makeLight(n, env);
    let o;
    if (n.shape === MT.GROUP) {
      o = new T.Group();
      const mdef = n.mat != null ? (typeof n.mat === MT.STRING ? env.materials[n.mat] : n.mat) : inheritedMat;
      const skip = shellSkip(n.children, env, mdef);
      for (const c of n.children) {
        if (skip.has(c)) continue;
        const k = build(c, env, mdef, depth + 1);
        if (k) o.add(k);
      }
    } else if (n.shape === MT.USE) {
      o = new T.Group();
      const list = env.defs[n.ref] || [];
      const mdef = n.tint ? Object.assign({}, env.defaultMat, { color: n.tint }) : n.mat != null ? (typeof n.mat === MT.STRING ? env.materials[n.mat] : n.mat) : inheritedMat;
      const skip = shellSkip(list, env, mdef);
      for (const c of list) {
        if (skip.has(c)) continue;
        const k = build(c, env, mdef, depth + 1);
        if (k) o.add(k);
      }
    } else if (n.shape === MT.REPEAT) {
      o = new T.Group();
      const [nx, ny, nz] = n.count;
      const r = rng(U.strHash(JSON.stringify(n.pos)) + 7);
      const inner = n.node;
      const simple = inner.shape !== MT.GROUP && inner.shape !== MT.USE && inner.shape !== MT.REPEAT && inner.shape !== MT.LIGHT && inner.shape !== MT.TEXT;
      const offs = [];
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++)
          for (let k = 0; k < nz; k++) {
            if (n.skip && r() < n.skip) continue;
            const jx = n.jitter ? (r() - 0.5) * n.jitter : 0,
              jz = n.jitter ? (r() - 0.5) * n.jitter : 0;
            offs.push([i * n.step[0] + jx, j * n.step[1], k * n.step[2] + jz]);
          }
      if (simple && offs.length > 3) {
        const proto = meshFor(inner, env, inheritedMat);
        const im = new T.InstancedMesh(proto.geometry, proto.material, offs.length);
        const dummy = new T.Object3D();
        offs.forEach((p, idx) => {
          applyTransform(dummy, inner);
          dummy.position.x += p[0];
          dummy.position.y += p[1];
          dummy.position.z += p[2];
          dummy.updateMatrix();
          im.setMatrixAt(idx, dummy.matrix);
        });
        im.castShadow = proto.castShadow;
        im.receiveShadow = proto.receiveShadow;
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        o.add(im);
      } else {
        for (const p of offs) {
          const k = build(inner, env, inheritedMat, depth + 1);
          if (!k) continue;
          k.position.x += p[0];
          k.position.y += p[1];
          k.position.z += p[2];
          o.add(k);
        }
      }
    } else if (n.shape === MT.MODEL) {
      o = modelNode(n, env);
    } else if (n.shape === MT.TEXT) {
      o = textMesh(n, env);
      if (n.billboard) (env.billboards = env.billboards || []).push(o);
    } else if (n.shape === MT.ARROW) {
      o = arrowNode(n, env);
    } else o = meshFor(n, env, inheritedMat);
    if (n.shape === MT.REPEAT) {
      o.position.set(n.pos[0], n.pos[1], n.pos[2]);
      if (n.rot) o.rotation.set(n.rot[0] * DEG, n.rot[1] * DEG, n.rot[2] * DEG, MT.YXZ);
      if (n.scale) o.scale.set(n.scale[0], n.scale[1], n.scale[2]);
    } else applyTransform(o, n);
    if (n.travel) (env.travelers = env.travelers || []).push({ o, from: o.position.clone(), to: new T.Vector3(n.travel.to[0], n.travel.to[1], n.travel.to[2]), start: n.travel.start, end: Math.min(1, n.travel.end) });
    if (n.name) o.name = n.name;
    return o;
  };
  GEN.newBuildEnv = (opts) => {
    const outline = { outlined: !!(opts && opts.outlined), outlineColor: (opts && opts.outlineColor) || null };
    const env = { ...outline, materials: (opts && opts.materials) || {}, defs: (opts && opts.defs) || {}, root: (opts && opts.root) || new T.Group(), matCache: new Map(), disposables: [], animated: [], lights: [], shadowBudget: opts && opts.shadowBudget != null ? opts.shadowBudget : 3, defaultMat: { color: MT.VALUE_9A9A9A, roughness: 0.8, metalness: 0 } };
    return env;
  };
  GEN.buildNodes = (nodes, env, parent, inheritedMat) => {
    const target = parent || env.root;
    const skip = shellSkip(nodes, env, inheritedMat);
    for (const n of nodes || []) {
      if (skip.has(n)) continue;
      const o = build(n, env, inheritedMat, 0);
      if (o) target.add(o);
    }
    return target;
  };
  GEN.disposeEnv = (env) => {
    for (const d of env.disposables) {
      try {
        d.dispose();
      } catch (e) {
        void e;
      }
    }
    env.disposables.length = 0;
  };
  GEN.animateTravel = (env, p) => {
    for (const v of env.travelers || []) {
      const k = U.clamp((p - v.start) / Math.max(0.01, v.end - v.start), 0, 1);
      const e = k * k * (3 - 2 * k) * 0.35 + k * 0.65;
      v.o.position.lerpVectors(v.from, v.to, e);
      const dx = v.to.x - v.from.x,
        dz = v.to.z - v.from.z;
      if (dx * dx + dz * dz > MT.TRAVEL_MIN_TURN * MT.TRAVEL_MIN_TURN) v.o.rotation.y = Math.atan2(dx, dz);
    }
  };
  GEN.animateLights = (env, t) => {
    for (const a of env.animated) {
      const d = a.def;
      let k = 1;
      if (d.flicker) k *= 1 - d.flicker * (0.5 + 0.5 * U.noise(t * 9, U.strHash(a.light.uuid) % 97));
      if (d.flash) {
        const f = GEN.flashColor(d.flash, t);
        a.light.color.set(f.color);
        k *= f.on ? 1 : 0.04;
      }
      const base = a.light.isPointLight ? a.base * 10 : a.light.isSpotLight ? a.base * 25 : a.base;
      a.light.intensity = base * k * (a.light.userData.dim || 1);
      if (a.glow) {
        a.glow.material.color.copy(a.light.color);
        a.glow.material.opacity = 0.9 * k * Math.sqrt(a.light.userData.dim || 1);
      }
    }
  };
  GEN.addLightGlows = (env) => {
    for (const a of env.animated) {
      if (!a.def.flash || a.light.isDirectionalLight || a.light.isHemisphereLight) continue;
      const tex = GEN.glowTexture();
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color: a.light.color.clone(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
      sp.scale.setScalar(0.55);
      sp.position.copy(a.light.position);
      (a.light.parent || env.root).add(sp);
      env.disposables.push(sp.material);
      a.glow = sp;
    }
  };
  GEN.glowTexture = () => {
    let t = texCache.get(MT.GLOW);
    if (t) return t;
    const c = ME.makeCanvas(128, 128);
    const g = c.getContext(MT.VALUE_2D);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, MT.RGBA_255_255_255_1);
    gr.addColorStop(0.2, MT.RGBA_255_255_255_0_6);
    gr.addColorStop(1, MT.RGBA_255_255_255_0);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    t = new T.CanvasTexture(c);
    texCache.set(MT.GLOW, t);
    return t;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
