(function (root) {
  "use strict";
  const ME = root.MotionEngine;
  if (!ME || !ME.registerTemplate) return;
  const U = ME.util;
  const clamp = U.clamp, lerp = U.lerp, ease = U.ease, hash = U.hash;
  const DEG = Math.PI / 180;
  const K = {
    TEMPLATE: "puppet",
    NAME: "Puppet 2D story",
    CATEGORY: "scene",
    DESCRIPTION: "Cut-out 2D story frames composed from a style pack and an asset kit",
    UNDEF: "undefined",
    FUNCTION: "function",
    STRING: "string",
    EMPTY: "",
    SVG_URL: "data:image/svg+xml;charset=utf-8,",
    SVG_MIME: "image/svg+xml",
    SVG_NS: "http://www.w3.org/2000/svg",
    XMLNS: "xmlns",
    FG_SEL: "#fg",
    FILTER: "filter",
    FILTER_NONE: "none",
    BLUR: (px) => "blur(" + Math.round(px) + "px)",
    BRIGHT: (k) => "brightness(" + Math.round(k * 100) + "%)",
    MULTIPLY: "multiply",
    SOURCE_OVER: "source-over",
    LIGHTER: "lighter",
    EVENODD: "evenodd",
    ROUND: "round",
    SET_W: 1920,
    SET_H: 1080,
    FLOOR: 820,
    PERSON_H: 0.34,
    HEAD_BOX: [400, 400],
    BODY_BOX: [400, 600],
    SHOULDERS: [[86, 70], [314, 70]],
    NECK_OVERLAP: 0.12,
    FADE: 0.28,
    BLACK: "#000000",
    WHITE: "#ffffff",
    LINE: "#161314",
    DEFAULT_BODY: "#6f6f74",
    DEFAULT_FACE: "#f4f2ee",
    DEFAULT_SKIN: "#f1d9c2",
    TEAR: "#7fb4e6",
    GLOW: "#ffd9a0",
    COLD: "#a9c4e8",
    NIGHT_TINT: "#1b2238",
    STEAM: "#e9eef2",
    RAIN: "#c9d4e2",
    FOG: "#c8ccd4",
    GHOST: "#05060a",
    STYLE_DEFAULT: {
      body: { head: 0.42, headW: 1.0, bodyW: 0.86, legs: 0, overlap: 0.12, limb: "tube", limbW: 0.11, armLen: 0.5, hand: 0.075, shape: "dome" },
      face: { fill: null, eyes: "oval", eyeW: 0.1, eyeH: 0.17, eyeGap: 0.34, eyeY: 0.47, eyeColor: "#121115", mouth: "oval", mouthW: 0.1, mouthH: 0.08, mouthY: 0.7, brows: true },
      line: { width: 0.012, color: "#161314" },
    },
    SHAPES: {
      dome: [[0.5, 1], [0.5, 0.35], [0.44, 0.12], [0.3, 0.02], [0, 0]],
      tube: [[0.5, 1], [0.5, 0.2], [0.42, 0.04], [0.25, 0], [0, 0]],
      robe: [[0.56, 1], [0.48, 0.4], [0.42, 0.1], [0.28, 0.01], [0, 0]],
    },
    POSES: {
      idle: { l: [4, 0], r: [4, 0] },
      talk: { l: [4, 0], r: [14, 40], gest: 1 },
      point: { l: [4, 0], r: [80, 0] },
      raise: { l: [4, 0], r: [150, 10] },
      raise_both: { l: [150, 10], r: [150, 10] },
      cover_face: { l: [20, 150], r: [20, 150], head: 8 },
      chest: { l: [12, 110], r: [12, 110] },
      hold: { l: [4, 0], r: [18, 80] },
      give: { l: [4, 0], r: [70, 10] },
      bow: { l: [4, 0], r: [4, 0], lean: 18, head: 10 },
      fear: { l: [25, 140], r: [25, 140], shake: 1, head: 6 },
      wave: { l: [4, 0], r: [140, 20], wave: 1 },
      walk: { l: [4, 0], r: [4, 0], walk: 1 },
      run: { l: [30, 60], r: [30, 60], walk: 2 },
      shout: { l: [40, 20], r: [40, 20] },
      think: { l: [4, 0], r: [20, 140] },
      pray: { l: [16, 120], r: [16, 120], head: 6 },
      sit: { sprite: "sit", l: [8, 40], r: [8, 40] },
      lie: { sprite: "lie" },
      kneel: { sprite: "kneel", l: [8, 30], r: [8, 30] },
      crouch: { sprite: "crouch", l: [10, 40], r: [10, 40] },
    },
    EXPR: {
      neutral: { eye: 1, mouth: "rest" },
      sad: { eye: 0.85, brow: -1, mouth: "frown" },
      cry: { eye: 0.55, brow: -1, mouth: "frown", tears: 1 },
      scared: { eye: 1.25, brow: 1, mouth: "open" },
      angry: { eye: 0.8, brow: 2, mouth: "frown" },
      happy: { eye: 0.9, mouth: "smile" },
      surprised: { eye: 1.3, brow: 1, mouth: "open" },
      sleep: { eye: 0.08, mouth: "rest" },
    },
    SHOT: {
      wide: { body: 0.2, feet: 0.84 },
      people: { body: 0.42, feet: 0.86 },
      two: { body: 0.42, feet: 0.86 },
      group: { body: 0.36, feet: 0.86 },
      back: { body: 0.42, feet: 0.86 },
      ots: { body: 0.44, feet: 0.84 },
      bust: { head: 0.31, top: 0.2 },
      duo: { head: 0.26, top: 0.2 },
      object: { body: 0.22, feet: 0.84 },
    },
    FULL_SHOTS: ["establishing", "wide", "object"],
    FORE: { scale: 1.75, y: 1.18, x: 0.2, tint: 0.18, blur: 2 },
    BACKD: { scale: 0.68, lift: 0.05, blur: 1.5 },
    MOVE: { push: [1, 0.95], pull: [0.95, 1], none: [1, 1], pan_left: [1, 1, 0.025, -0.025], pan_right: [1, 1, -0.025, 0.025], drift: [1, 0.97] },
    INSERT: { zoom: 1.6, blur: 7, dim: "rgba(10,10,14,0.28)", h: 0.52, x: 0.56, base: 0.88, push: 0.05, figH: 1.3, figX: 0.24 },
    SYMBOL: { bg: "#07080b", h: 0.32, y: 0.64, halo: 0.42, haloA: 0.22, dust: 34, wind: 5 },
    CLOSE: { zoom: 1.35, blur: 6, dim: "rgba(10,10,14,0.2)", headK: 0.85, headMin: 0.26, headMax: 0.45, y: 0.42, x: 0.5, push: 0.04 },
    PROP_FRAME_SHOTS: ["people", "two", "group", "back", "ots"],
    PROP_HALF: 0.4,
    OBJECT_FRAME: { size: 0.45, min: 0.55, fill: 0.9, base: 0.84 },
    PROP_LEGACY_H: 0.22,
    EYE_TILT: 0.16,
    SHADOW: { h: 0.82, x: 0.62, skew: -0.18, alpha: 0.55, figH: 0.42, figX: 0.3 },
    OBJECT: { h: 0.42, base: 0.9 },
    LID_OPEN: 0.55,
    BREATH: 0.012,
    BLINK_EVERY: 3.6,
    TALK_SWING: 18,
    WALK_SPEED: 0.05,
    DUST_ALPHA: 0.35,
    WIND_COLOR: "#d8dde6",
    VIGNETTE: 0.38,
    BG: { zoom: 1.12, blur: 5 },
    NUB: { max: 30, angle: 70, len: 0.17, width: 1.45 },
    BOTTOM_SHADE: { h: 0.3, a: 0.62 },
    EXTEND: 1.6,
    EXTEND_SHOTS: ["duo", "bust"],
    SHOT_BLINK: "blink",
    SIDE_FACE: [0.12, 0.09],
    FX: { thunder: { flash: 0.75, dur: 0.5 }, stinger: { shake: 0.006, dur: 0.45 }, explosion: { flash: 0.5, shake: 0.012, dur: 0.6 }, impact: { shake: 0.008, dur: 0.3 } },
    NIGHT_RE: /night|lamp/,
    DAY_RE: /day|dawn/,
    DARK_RE: /night|dark|midnight/,
    S: {
      EMPTY: "",
      HASH: "#",
      DUSK: "#7d88ad",
      SMOKE_COLOR: "#8d8f96",
      PAREN: ")",
      COMMA: ",",
      ZERO: "0",
      COLON: ":",
      BACK: "back",
      CLOSE: "close",
      COVER_FACE: "cover_face",
      DAY: "day",
      DOT: "dot",
      DRIFT: "drift",
      DUST: "dust",
      FG: "fg",
      NUB: "nub",
      FOG: "fog",
      FORE: "fore",
      FRONT: "front",
      FROWN: "frown",
      GHOST: "ghost",
      IDLE: "idle",
      INSERT: "insert",
      KNEEL: "kneel",
      LEFT: "left",
      LIE: "lie",
      LINE: "line",
      MAIN: "main",
      NEUTRAL: "neutral",
      NIGHT: "night",
      NOODLE: "noodle",
      OBJECT: "object",
      OPEN: "open",
      PEOPLE: "people",
      RAIN: "rain",
      REST: "rest",
      RGBA: "rgba(",
      FOOT_SHADOW: "rgba(0,0,0,0.22)",
      RIGHT: "right",
      ROUND: "round",
      RUN: "run",
      SHADOW: "shadow",
      SIDE: "side",
      SIT: "sit",
      SLEEP: "sleep",
      SMILE: "smile",
      SMOKE: "smoke",
      STEAM: "steam",
      SYMBOL: "symbol",
      TALK: "talk",
      WALK: "walk",
    },
  };

  const ASSETS = { imgs: new Map() };
  const svgKey = (svg) => {
    let h = 0;
    for (let i = 0; i < svg.length; i += 7) h = (h * 31 + svg.charCodeAt(i)) | 0;
    return svg.length + K.S.COLON + h;
  };
  async function loadSvg(svg) {
    if (!svg || typeof Image === K.UNDEF) return null;
    const key = svgKey(svg);
    if (ASSETS.imgs.has(key)) return ASSETS.imgs.get(key);
    const img = new Image();
    img.src = K.SVG_URL + encodeURIComponent(svg);
    try {
      await img.decode();
      ASSETS.imgs.set(key, img);
      return img;
    } catch (e) {
      ASSETS.imgs.set(key, null);
      return null;
    }
  }
  const imgOf = (svg) => (svg ? ASSETS.imgs.get(svgKey(svg)) || null : null);
  function splitFg(svg) {
    if (!svg || typeof DOMParser === K.UNDEF) return { main: svg, fg: null };
    try {
      const doc = new DOMParser().parseFromString(svg, K.SVG_MIME);
      const rootEl = doc.documentElement;
      if (!rootEl.getAttribute(K.XMLNS)) rootEl.setAttribute(K.XMLNS, K.SVG_NS);
      const fg = rootEl.querySelector(K.FG_SEL);
      if (!fg) return { main: svg, fg: null };
      const shell = rootEl.cloneNode(false);
      shell.appendChild(fg.cloneNode(true));
      const fgSvg = new XMLSerializer().serializeToString(shell);
      fg.parentNode.removeChild(fg);
      return { main: new XMLSerializer().serializeToString(rootEl), fg: fgSvg };
    } catch (e) {
      return { main: svg, fg: null };
    }
  }
  const SPLIT = new Map();
  function setParts(set) {
    if (!set || !set.svg) return { main: null, fg: null };
    const k = svgKey(set.svg);
    if (!SPLIT.has(k)) SPLIT.set(k, splitFg(set.svg));
    return SPLIT.get(k);
  }
  async function preload(spec) {
    const kit = spec && spec.kit;
    if (!kit) return;
    const jobs = [];
    const add = (svg) => svg && jobs.push(loadSvg(svg));
    for (const c of Object.values(kit.characters || {})) {
      for (const v of Object.values(c.head || {})) add(v);
      for (const v of Object.values(c.body || {})) add(v);
      for (const s of Object.values(c.sprites || {})) add(s && s.svg);
    }
    for (const s of Object.values(kit.sets || {})) {
      const p = setParts(s);
      add(p.main);
      add(p.fg);
    }
    for (const p of Object.values(kit.props || {})) add(p && p.svg);
    await Promise.all(jobs);
  }
  ME.PUPPET_PRELOAD = preload;

  const rgba = (hex, a) => {
    const h = String(hex || K.BLACK).replace(K.S.HASH, K.S.EMPTY);
    const n = parseInt(h.length === 3 ? h.split(K.S.EMPTY).map((c) => c + c).join(K.S.EMPTY) : h.slice(0, 6), 16) || 0;
    return K.S.RGBA + ((n >> 16) & 255) + K.S.COMMA + ((n >> 8) & 255) + K.S.COMMA + (n & 255) + K.S.COMMA + a + K.S.PAREN;
  };
  const merge = (a, b) => {
    const out = Object.assign({}, a);
    for (const k of Object.keys(b || {})) out[k] = b[k] && typeof b[k] === K.S.OBJECT && !Array.isArray(b[k]) ? Object.assign({}, a[k] || {}, b[k]) : b[k];
    return out;
  };
  const styleOf = (spec) => merge(K.STYLE_DEFAULT, (spec.kit && spec.kit.style) || {});

  function init(ctx) {
    const P = ctx.params || {};
    const frames = (Array.isArray(P.frames) ? P.frames : []).slice().sort((a, b) => a.start - b.start);
    return { frames, style: styleOf(ctx.spec), kit: (ctx.spec && ctx.spec.kit) || {}, motion: !!(ctx.spec && ctx.spec.kit && ctx.spec.kit.motion) };
  }

  function frameAt(S, t) {
    const fs = S.frames;
    let cur = null, idx = -1;
    for (let i = 0; i < fs.length; i++) if (t >= fs[i].start) {
      cur = fs[i];
      idx = i;
    }
    return { cur: cur || fs[0] || null, prev: idx > 0 ? fs[idx - 1] : null, idx: Math.max(0, idx) };
  }

  function charOf(S, id) {
    const c = (S.kit.characters || {})[id];
    return c || { id, height: 1, colors: {} };
  }

  function charLayout(S, c) {
    const B = S.style.body;
    const total = K.PERSON_H * K.SET_H * (c.height || 1);
    const headH = total * B.head;
    const headW = headH * B.headW;
    const bodyH = total - headH * (1 - B.overlap);
    const bodyW = headW * B.bodyW;
    return { total, headH, headW, bodyH, bodyW, headCy: -bodyH - headH / 2 + headH * B.overlap };
  }

  function lineW(S, L) {
    return Math.max(1, S.style.line.width * L.headH * 2.2);
  }

  function drawBody(g, S, c, L, view, tint) {
    const art = c.body && imgOf(c.body[view === K.S.BACK ? K.S.BACK : view === K.S.SIDE ? K.S.SIDE : K.S.FRONT]);
    if (art) {
      drawImg(g, art, -L.bodyW / 2, -L.bodyH, L.bodyW, L.bodyH, tint);
      return;
    }
    const shape = K.SHAPES[S.style.body.shape] || K.SHAPES.dome;
    g.beginPath();
    shape.forEach(([x, y], i) => {
      const px = x * L.bodyW, py = y >= 1 ? L.bodyH * (S.extend || 0) : -L.bodyH * (1 - y);
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    });
    for (let i = shape.length - 2; i >= 0; i--) g.lineTo(-shape[i][0] * L.bodyW, shape[i][1] >= 1 ? L.bodyH * (S.extend || 0) : -L.bodyH * (1 - shape[i][1]));
    g.closePath();
    g.fillStyle = tintHex((c.colors && c.colors.body) || K.DEFAULT_BODY, tint);
    g.fill();
    g.strokeStyle = S.style.line.color;
    g.lineWidth = lineW(S, L);
    g.stroke();
  }

  function tintHex(hex, k) {
    if (k >= 0.999) return hex;
    const h = String(hex).replace(K.S.HASH, K.S.EMPTY);
    const n = parseInt(h.slice(0, 6), 16) || 0;
    const f = (v) => Math.round(v * k).toString(16).padStart(2, K.S.ZERO);
    return K.S.HASH + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
  }

  function drawImg(g, img, x, y, w, h, tint) {
    const f = tint < 0.999 && K.FILTER in g;
    const prev = f ? g.filter : null;
    if (f) g.filter = K.BRIGHT(tint);
    g.drawImage(img, x, y, w, h);
    if (f) g.filter = prev || K.FILTER_NONE;
  }

  function drawHead(g, S, c, L, view, face, expr, mouth, blink, tint) {
    const art = c.head && imgOf(c.head[view === K.S.BACK ? K.S.BACK : view === K.S.SIDE ? K.S.SIDE : K.S.FRONT]);
    const x = -L.headW / 2, y = L.headCy - L.headH / 2;
    if (art) drawImg(g, art, x, y, L.headW, L.headH, tint);
    else {
      g.beginPath();
      g.ellipse(0, L.headCy, L.headW / 2, L.headH / 2, 0, 0, Math.PI * 2);
      g.fillStyle = tintHex((view === K.S.BACK ? (c.colors && c.colors.hair) || (c.colors && c.colors.body) : (c.colors && c.colors.face) || S.style.face.fill || K.DEFAULT_FACE) || K.DEFAULT_FACE, tint);
      g.fill();
      g.strokeStyle = S.style.line.color;
      g.lineWidth = lineW(S, L);
      g.stroke();
    }
    if (view === K.S.BACK) return;
    drawFace(g, S, L, view === K.S.SIDE ? face : 0, expr, mouth, blink, tint);
  }

  function drawFace(g, S, L, dir, expr, mouth, blink, tint) {
    const F = S.style.face;
    const E = K.EXPR[expr] || K.EXPR.neutral;
    const ox = dir * L.headW * K.SIDE_FACE[0];
    const cx = (fx) => ox + (fx - 0.5) * L.headW;
    const cy = (fy) => L.headCy - L.headH / 2 + fy * L.headH;
    const eyeCol = tintHex(F.eyeColor, tint);
    const open = Math.max(0.06, E.eye * (1 - blink));
    const eyes = dir ? [0.5 + K.SIDE_FACE[1] * dir] : [0.5 - F.eyeGap / 2, 0.5 + F.eyeGap / 2];
    for (const ex of eyes) {
      const w = F.eyeW * L.headW * (F.eyes === K.S.DOT ? 0.55 : 1), h = F.eyeH * L.headH * (F.eyes === K.S.DOT ? 0.4 : 1) * open;
      g.beginPath();
      if (F.eyes === K.S.ROUND) {
        g.ellipse(cx(ex), cy(F.eyeY), w * 0.6, Math.max(1, h * 0.6), 0, 0, Math.PI * 2);
        g.fillStyle = tintHex(K.WHITE, tint);
        g.fill();
        g.strokeStyle = eyeCol;
        g.lineWidth = lineW(S, L) * 0.6;
        g.stroke();
        g.beginPath();
        g.ellipse(cx(ex), cy(F.eyeY), w * 0.28, Math.max(1, h * 0.32), 0, 0, Math.PI * 2);
      } else g.ellipse(cx(ex), cy(F.eyeY), w / 2, Math.max(1, h / 2), F.brows ? 0 : (E.brow || 0) * K.EYE_TILT * (ex < 0.5 ? -1 : 1), 0, Math.PI * 2);
      g.fillStyle = eyeCol;
      g.fill();
      if (F.brows && E.brow) {
        g.beginPath();
        const by = cy(F.eyeY) - F.eyeH * L.headH * 0.75;
        const tilt = -E.brow * F.eyeH * L.headH * 0.12 * (ex < 0.5 ? 1 : -1);
        g.moveTo(cx(ex) - w * 0.7, by + tilt);
        g.lineTo(cx(ex) + w * 0.7, by - tilt);
        g.strokeStyle = eyeCol;
        g.lineWidth = lineW(S, L) * 0.9;
        g.lineCap = K.ROUND;
        g.stroke();
      }
      if (E.tears) {
        const ph = (mouth.t * 0.6 + ex) % 1;
        g.beginPath();
        g.ellipse(cx(ex), cy(F.eyeY) + F.eyeH * L.headH * (0.6 + ph * 1.6), L.headW * 0.022, L.headH * 0.045, 0, 0, Math.PI * 2);
        g.globalAlpha = 1 - ph * 0.6;
        g.fillStyle = tintHex(K.TEAR, tint);
        g.fill();
        g.globalAlpha = 1;
      }
    }
    const mx = cx(0.5 + 0.16 * dir), my = cy(F.mouthY);
    const mw = F.mouthW * L.headW, mh = F.mouthH * L.headH;
    const talk = mouth.level;
    const kind = talk > 0.05 ? K.S.TALK : E.mouth !== K.S.REST ? E.mouth : F.mouthRest === K.S.OPEN ? K.S.OPEN : E.mouth;
    g.beginPath();
    if (kind === K.S.SMILE) g.ellipse(mx, my - mh * 0.2, mw * 0.8, mh * 0.5, 0, 0, Math.PI);
    else if (kind === K.S.FROWN) g.ellipse(mx, my + mh * 0.3, mw * 0.7, mh * 0.35, 0, Math.PI, Math.PI * 2);
    else if (kind === K.S.OPEN) g.ellipse(mx, my, mw * 0.55, mh * 0.75, 0, 0, Math.PI * 2);
    else if (kind === K.S.TALK) g.ellipse(mx, my, mw * 0.5, Math.max(mh * 0.12, mh * (0.2 + 0.7 * talk)), 0, 0, Math.PI * 2);
    else if (F.mouth === K.S.LINE) {
      g.moveTo(mx - mw * 0.4, my);
      g.lineTo(mx + mw * 0.4, my);
      g.strokeStyle = eyeCol;
      g.lineWidth = lineW(S, L) * 0.8;
      g.stroke();
      return;
    } else g.ellipse(mx, my, mw * 0.42, mh * 0.5, 0, 0, Math.PI * 2);
    g.fillStyle = eyeCol;
    g.fill();
  }

  function drawArm(g, S, c, L, side, ang, bend, tint, lenK, nub) {
    const B = S.style.body;
    const sh = K.SHOULDERS[side < 0 ? 0 : 1];
    const sx = (sh[0] / K.BODY_BOX[0] - 0.5) * L.bodyW, sy = -L.bodyH + (sh[1] / K.BODY_BOX[1]) * L.bodyH;
    const len = B.armLen * L.total * (lenK || 1);
    const w = Math.max(2, B.limbW * L.headW * (nub ? K.NUB.width : 1));
    const a = ang * DEG * -side;
    const up = len * 0.5;
    const ex = sx - Math.sin(a) * up, ey = sy + Math.cos(a) * up;
    const b = a + bend * DEG * side;
    const hx = ex - Math.sin(b) * (len - up), hy = ey + Math.cos(b) * (len - up);
    const col = tintHex((c.colors && (c.colors.sleeve || c.colors.body)) || K.DEFAULT_BODY, tint);
    g.lineCap = K.ROUND;
    g.lineJoin = K.ROUND;
    g.beginPath();
    g.moveTo(sx, sy);
    if (B.limb === K.S.NOODLE) g.quadraticCurveTo(ex - side * w * 0.6, ey, hx, hy);
    else {
      g.lineTo(ex, ey);
      g.lineTo(hx, hy);
    }
    if (B.limbOutline !== false || nub) {
      g.strokeStyle = S.style.line.color;
      g.lineWidth = w + lineW(S, L) * 2;
      g.stroke();
    }
    g.strokeStyle = col;
    g.lineWidth = w;
    g.stroke();
    if (B.hand) {
      g.beginPath();
      g.arc(hx, hy, B.hand * L.headW * 0.5, 0, Math.PI * 2);
      g.fillStyle = tintHex((c.colors && c.colors.skin) || S.style.face.fill || K.DEFAULT_SKIN, tint);
      g.fill();
      g.strokeStyle = S.style.line.color;
      g.lineWidth = lineW(S, L);
      g.stroke();
    }
    return [hx, hy];
  }

  function poseState(S, A, t) {
    const P = K.POSES[A.pose] || K.POSES.idle;
    const seed = hash((A.char || K.S.EMPTY).length * 7.3 + (A.char || K.S.EMPTY).charCodeAt(0));
    const motion = S.motion;
    const breath = motion ? Math.sin(t * 2 + seed * 6) * K.BREATH : 0;
    let l = P.l ? P.l.slice() : [4, 0], r = P.r ? P.r.slice() : [4, 0];
    if (P.gest && A.talk > 0) r = [r[0] + Math.sin(t * 2.4 + seed) * K.TALK_SWING * 0.5, r[1]];
    if (P.wave) r = [r[0] + Math.sin(t * 9) * 18, r[1]];
    const shake = P.shake ? Math.sin(t * 22) * 0.004 : 0;
    const head = (P.head || 0) + (motion ? Math.sin(t * 0.7 + seed * 4) * 2.2 : 0);
    const walk = P.walk ? Math.abs(Math.sin(t * (P.walk > 1 ? 11 : 7))) * 0.02 : 0;
    return { l, r, lean: P.lean || 0, head, breath, shake, walk, sprite: P.sprite || null };
  }

  function blinkAt(t, seed) {
    const p = (t + seed * 5) % K.BLINK_EVERY;
    return p < 0.12 ? 1 - Math.abs(p - 0.06) / 0.06 : 0;
  }

  function drawPuppet(g, S, A, t, opt) {
    const c = charOf(S, A.char);
    const L = charLayout(S, c);
    const ps = poseState(S, A, t);
    const tint = opt.tint == null ? 1 : opt.tint;
    const view = A.face === K.S.BACK ? K.S.BACK : A.face === K.S.LEFT || A.face === K.S.RIGHT ? K.S.SIDE : K.S.FRONT;
    const dir = A.face === K.S.LEFT ? -1 : A.face === K.S.RIGHT ? 1 : 0;
    const seed = hash((A.char || K.S.EMPTY).length * 3.1);
    g.save();
    if (ps.sprite) {
      const sp = c.sprites && c.sprites[ps.sprite];
      const img = sp && imgOf(sp.svg);
      if (img) {
        const w = (sp.w || 1) * L.total, h = (sp.h || 1) * L.total;
        const ax = sp.anchor ? sp.anchor[0] : 0.5, ay = sp.anchor ? sp.anchor[1] : 1;
        if (dir < 0) g.scale(-1, 1);
        drawImg(g, img, -ax * w, -ay * h, w, h, tint);
        g.restore();
        return L;
      }
      if (ps.sprite === K.S.LIE) {
        g.translate(0, -L.bodyW * 0.45);
        g.rotate((dir < 0 ? 90 : -90) * DEG);
        g.translate(0, L.total * 0.5);
      } else g.scale(1, ps.sprite === K.S.SIT ? 0.78 : ps.sprite === K.S.KNEEL ? 0.82 : 0.7);
    }
    g.translate(ps.shake * L.total, -ps.walk * L.total);
    if (dir < 0) g.scale(-1, 1);
    g.rotate((ps.lean || 0) * DEG);
    g.scale(1, 1 + ps.breath);
    const armsBehind = view === K.S.BACK;
    const nubs = S.style.body.idleArms === K.S.NUB;
    const isNub = (a) => nubs && a[0] < K.NUB.max;
    const arm = (side, a) => (isNub(a) ? drawArm(g, S, c, L, side, K.NUB.angle, 0, tint, K.NUB.len, true) : drawArm(g, S, c, L, side, a[0], a[1], tint));
    const sides = view === K.S.SIDE ? [[1, ps.r]] : [[-1, ps.l], [1, ps.r]];
    for (const [side, a] of sides) if (armsBehind || isNub(a)) arm(side, a);
    drawBody(g, S, c, L, view, tint);
    if (!armsBehind) for (const [side, a] of sides) if (!isNub(a)) arm(side, a);
    g.save();
    g.translate(0, L.headCy + L.headH * 0.45);
    g.rotate(ps.head * DEG * (dir || 1));
    g.translate(0, -(L.headCy + L.headH * 0.45));
    drawHead(g, S, c, L, view, dir ? 1 : 0, A.expr || K.S.NEUTRAL, { level: A.talk || 0, t }, blinkAt(t, seed) * (A.expr === K.S.SLEEP ? 0 : 1), tint);
    g.restore();
    g.restore();
    return L;
  }

  function drawProp(g, S, id, x, base, h, rot) {
    const p = (S.kit.props || {})[id];
    const img = p && imgOf(p.svg);
    if (!img) return false;
    const box = p.box || 512;
    const bx = p.base ? p.base[0] : box / 2, by = p.base ? p.base[1] : box;
    const s = h / box;
    g.save();
    g.translate(x, base);
    g.rotate((rot || 0) * DEG);
    g.drawImage(img, -bx * s, -by * s, box * s, box * s);
    g.restore();
    return true;
  }

  function setFor(S, F) {
    const sets = S.kit.sets || {};
    const base = sets[F.set];
    if (!base) return null;
    const want = F.light ? K.NIGHT_RE.test(F.light) : null;
    const dark = K.DARK_RE.test(String(base.time || K.EMPTY));
    if (want !== null && want !== dark && base.variants) {
      const v = base.variants[want ? K.S.NIGHT : K.S.DAY];
      if (v && sets[v]) return sets[v];
    }
    return base;
  }

  function drawSetLayer(g, S, set, part, x, y, w, h, opt) {
    const parts = setParts(set);
    const img = imgOf(parts[part]);
    if (!img) return;
    const f = opt && opt.blur && K.FILTER in g;
    if (f) g.filter = K.BLUR(opt.blur);
    g.drawImage(img, x, y, w, h);
    if (f) g.filter = K.FILTER_NONE;
  }

  function darkWanted(F, set) {
    if (!F.light || !set) return false;
    return K.NIGHT_RE.test(F.light) && !K.DARK_RE.test(String(set.time || K.EMPTY));
  }

  function drawLights(g, set, sx, sy, sc) {
    if (!set || !set.lights) return;
    g.save();
    g.globalCompositeOperation = K.LIGHTER;
    for (const l of set.lights) {
      const x = sx + l.x * sc, y = sy + l.y * sc, r = 260 * sc;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rgba(l.color || K.GLOW, 0.32));
      gr.addColorStop(1, rgba(l.color || K.GLOW, 0));
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.restore();
  }

  function actorPlace(S, set, A, i, n) {
    const floor = (set && set.floorY) || K.FLOOR;
    const x = A.x != null ? A.x * K.SET_W : K.SET_W * (n > 1 ? 0.35 + (0.3 * i) / Math.max(1, n - 1) : 0.5);
    let y = A.y != null ? A.y : floor, k = A.k || 1, blur = 0, tint = 1;
    if (A.depth === K.S.BACK && A.y == null) {
      k = K.BACKD.scale;
      y = floor - K.BACKD.lift * K.SET_H;
      blur = K.BACKD.blur;
    }
    return { x, y, k, blur, tint };
  }

  function frameBox(S, F, set, actors) {
    const kind = F.shot || K.S.PEOPLE;
    if (kind === K.S.OBJECT && F.prop && F.propH) return objectBox(S, F, actors);
    if (K.FULL_SHOTS.indexOf(kind) >= 0 || !actors.length) return { cx: K.SET_W / 2, cy: K.SET_H / 2, h: K.SET_H };
    const spec = K.SHOT[kind] || K.SHOT.people;
    const main = actors.filter((a) => !a.fore && !a.back);
    const list = main.length ? main : actors;
    let x0 = Math.min.apply(null, list.map((a) => a.x - a.L.headW * a.k)), x1 = Math.max.apply(null, list.map((a) => a.x + a.L.headW * a.k));
    if (F.prop && F.propH && K.PROP_FRAME_SHOTS.indexOf(kind) >= 0) {
      const px = F.propX * K.SET_W, pw = F.propH * K.PROP_HALF;
      x0 = Math.min(x0, px - pw);
      x1 = Math.max(x1, px + pw);
    }
    const top = Math.min.apply(null, list.map((a) => a.y - a.L.total * a.k)), bottom = Math.max.apply(null, list.map((a) => a.y));
    const tall = Math.max.apply(null, list.map((a) => a.L.total * a.k));
    let h, cy;
    const headH = Math.max.apply(null, list.map((a) => a.L.headH * a.k));
    if (spec.head != null) {
      h = headH / spec.head;
      cy = top - spec.top * h + h / 2;
    } else if (spec.top != null) {
      h = tall * (1 - S.style.body.head * 0.2) / spec.body * 1.0;
      h = Math.max(h, (top < 0 ? 0 : 0) + tall * 0.75);
      cy = top - spec.top * h + h / 2;
    } else {
      h = tall / spec.body;
      cy = bottom - spec.feet * h + h / 2;
    }
    const A = S.VW / S.VH;
    h = Math.max(h, (x1 - x0) / (A * (spec.head != null ? 0.96 : 0.8)));
    h = Math.min(h, K.SET_H);
    const w = h * A;
    let cx = (x0 + x1) / 2;
    cx = clamp(cx, w / 2, K.SET_W - w / 2);
    cy = clamp(cy, h / 2, K.SET_H - h / 2);
    return { cx, cy, h };
  }

  function objectBox(S, F, actors) {
    const O = K.OBJECT_FRAME, A = S.VW / S.VH;
    const px = F.propX * K.SET_W;
    let x0 = px - F.propH * K.PROP_HALF, x1 = px + F.propH * K.PROP_HALF;
    for (const a of actors.filter((a) => !a.fore)) {
      x0 = Math.min(x0, a.x - a.L.headW * a.k);
      x1 = Math.max(x1, a.x + a.L.headW * a.k);
    }
    let h = clamp(F.propH / O.size, K.SET_H * O.min, K.SET_H);
    h = Math.min(K.SET_H, Math.max(h, (x1 - x0) / (A * O.fill)));
    const w = h * A;
    return { cx: clamp((x0 + x1) / 2, w / 2, K.SET_W - w / 2), cy: clamp(F.propY - h * O.base + h / 2, h / 2, K.SET_H - h / 2), h };
  }

  function camera(box, F, k) {
    const m = K.MOVE[(F.camera && F.camera.move) || K.S.DRIFT] || K.MOVE.drift;
    const z = lerp(m[0], m[1], ease(k));
    const dx = m.length > 2 ? lerp(m[2], m[3], ease(k)) * box.h : 0;
    return { cx: box.cx + dx, cy: box.cy, h: box.h * z };
  }

  function drawStage(g, ctx, S, F, t, k) {
    const W = ctx.W, H = ctx.H;
    S.VW = W;
    S.VH = H;
    S.extend = !S.style.body.legs && K.EXTEND_SHOTS.indexOf(F.shot) >= 0 ? K.EXTEND : 0;
    const set = setFor(S, F);
    const acts = (F.actors || []).map((A, i, arr) => {
      const c = charOf(S, A.char);
      const L = charLayout(S, c);
      const pl = actorPlace(S, set, A, i, arr.length);
      return Object.assign({}, pl, { A, L, fore: A.depth === K.S.FORE, back: A.depth === K.S.BACK, talk: speechLevel(F, A, t) });
    });
    const box = frameBox(S, F, set, acts);
    const cam = camera(box, F, k);
    const sc = H / cam.h;
    g.save();
    g.fillStyle = K.BLACK;
    g.fillRect(0, 0, W, H);
    g.setTransform(sc, 0, 0, sc, W / 2 - cam.cx * sc, H / 2 - cam.cy * sc);
    if (set) drawSetLayer(g, S, set, K.S.MAIN, 0, 0, K.SET_W, K.SET_H, null);
    else {
      g.fillStyle = K.NIGHT_TINT;
      g.fillRect(0, 0, K.SET_W, K.SET_H);
    }
    if (darkWanted(F, set)) {
      g.globalCompositeOperation = K.MULTIPLY;
      g.fillStyle = K.S.DUSK;
      g.fillRect(0, 0, K.SET_W, K.SET_H);
      g.globalCompositeOperation = K.SOURCE_OVER;
    }
    drawLights(g, set, 0, 0, 1);
    const placed = F.prop && F.propH != null;
    const big = F.prop && F.shot === K.S.OBJECT;
    if (big && !placed) drawProp(g, S, F.prop, K.SET_W * (F.propX || 0.5), (set && set.floorY ? set.floorY : K.FLOOR) + K.SET_H * 0.06, K.SET_H * K.OBJECT.h, Math.sin(t * 0.8) * 0.8);
    const order = acts.filter((a) => !a.fore).sort((a, b) => (a.back ? 0 : 1) - (b.back ? 0 : 1) || a.y - b.y);
    let propDone = !placed;
    const propNow = () => {
      propDone = true;
      drawProp(g, S, F.prop, K.SET_W * F.propX, F.propY, F.propH, big ? Math.sin(t * 0.8) * 0.8 : 0);
    };
    for (const a of order) {
      if (!propDone && F.propY <= a.y) propNow();
      g.save();
      g.translate(a.x, a.y);
      g.scale(a.k, a.k);
      if (a.blur && K.FILTER in g) g.filter = K.BLUR(a.blur);
      g.beginPath();
      g.ellipse(0, 0, a.L.bodyW * 0.55, a.L.bodyW * 0.1, 0, 0, Math.PI * 2);
      g.fillStyle = K.S.FOOT_SHADOW;
      g.fill();
      const A = Object.assign({}, a.A, { talk: a.talk });
      if (S.motion && (A.pose === K.S.WALK || A.pose === K.S.RUN)) g.translate((k - 0.5) * K.SET_W * K.WALK_SPEED * (A.face === K.S.LEFT ? -1 : 1) * (A.pose === K.S.RUN ? 2 : 1), 0);
      drawPuppet(g, S, A, t, { tint: a.tint });
      g.restore();
    }
    if (!propDone) propNow();
    if (F.prop && !placed && !big && F.propX != null) drawProp(g, S, F.prop, K.SET_W * F.propX, (set && set.floorY) || K.FLOOR, K.SET_H * K.PROP_LEGACY_H, 0);
    if (set) drawSetLayer(g, S, set, K.S.FG, 0, 0, K.SET_W, K.SET_H, null);
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of acts.filter((x) => x.fore)) {
      g.save();
      const L = a.L;
      const kk = (H / L.total) * K.FORE.scale * 0.5;
      g.translate(W * (a.A.x != null && a.A.x > 0.5 ? 1 - K.FORE.x : K.FORE.x), H * K.FORE.y);
      g.scale(kk, kk);
      if (K.FILTER in g) g.filter = K.BLUR(K.FORE.blur);
      drawPuppet(g, S, Object.assign({}, a.A, { face: K.S.BACK }), t, { tint: K.FORE.tint });
      g.restore();
    }
    g.restore();
  }

  function speechLevel(F, A, t) {
    if (!F.speaker || F.speaker !== A.char) return 0;
    const lt = t - F.start;
    const syll = Math.max(0, Math.sin(lt * 6.4 * Math.PI)) * (0.55 + 0.45 * hash(Math.floor(lt * 6.4) + 3));
    return syll * clamp((F.end - t) / 0.2, 0, 1);
  }

  function blurredSet(g, ctx, S, F, zoom, blur, dim) {
    const W = ctx.W, H = ctx.H;
    const set = setFor(S, F);
    g.fillStyle = K.BLACK;
    g.fillRect(0, 0, W, H);
    if (!set) return;
    const sc = Math.max(W / K.SET_W, H / K.SET_H) * zoom;
    const w = K.SET_W * sc, h = K.SET_H * sc;
    drawSetLayer(g, S, set, K.S.MAIN, (W - w) / 2, (H - h) * 0.6, w, h, { blur });
    if (darkWanted(F, set)) {
      g.globalCompositeOperation = K.MULTIPLY;
      g.fillStyle = K.S.DUSK;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = K.SOURCE_OVER;
    }
    if (dim) {
      g.fillStyle = dim;
      g.fillRect(0, 0, W, H);
    }
  }

  function glow(g, x, y, r, color, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(color, a));
    gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function puppetAt(g, S, A, F, t, x, y, h, tint) {
    const c = charOf(S, A.char);
    const L = charLayout(S, c);
    const k = h / L.total;
    g.save();
    g.translate(x, y);
    g.scale(k, k);
    drawPuppet(g, S, Object.assign({}, A, { talk: speechLevel(F, A, t) }), t, { tint });
    g.restore();
    return { L, k };
  }

  function drawInsert(g, ctx, S, F, t, k) {
    const W = ctx.W, H = ctx.H, I = K.INSERT;
    g.save();
    g.translate(W / 2, H / 2);
    g.scale(1 + I.push * k, 1 + I.push * k);
    g.translate(-W / 2, -H / 2);
    blurredSet(g, ctx, S, F, I.zoom, I.blur, I.dim);
    const A = (F.actors || [])[0];
    if (A) {
      g.save();
      if (K.FILTER in g) g.filter = K.BLUR(I.blur);
      puppetAt(g, S, A, F, t, W * I.figX, H * I.figH, H * I.figH, 0.75);
      g.restore();
    }
    const x = W * I.x, base = H * I.base, h = H * I.h;
    glow(g, x, base - h / 2, h * 0.9, K.NIGHT_RE.test(F.light || K.EMPTY) ? K.COLD : K.GLOW, 0.3);
    drawProp(g, S, F.prop, x, base, h, Math.sin(t * 0.8) * 1.2);
    g.restore();
  }

  function drawSymbol(g, ctx, S, F, t) {
    const W = ctx.W, H = ctx.H, Y = K.SYMBOL, u = H / 720;
    g.fillStyle = Y.bg;
    g.fillRect(0, 0, W, H);
    const x = W / 2, h = H * Y.h, base = H * Y.y + h / 2;
    glow(g, x, base - h / 2, H * Y.halo * (1 + 0.04 * Math.sin(t * 1.3)), K.NIGHT_RE.test(F.light || K.EMPTY) ? K.COLD : K.GLOW, Y.haloA);
    drawProp(g, S, F.prop, x, base, h, Math.sin(t * 0.9) * 4);
    for (let i = 0; i < Y.dust; i++) {
      const px = ((hash(i * 3.3) + t * 0.01 * (0.5 + hash(i))) % 1) * W, py = ((hash(i * 7.1) + t * 0.006) % 1) * H;
      g.fillStyle = rgba(K.WHITE, K.DUST_ALPHA * (0.3 + 0.7 * hash(i * 1.9)));
      g.beginPath();
      g.arc(px, py, (0.8 + hash(i * 5.7) * 1.6) * u, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = rgba(K.WIND_COLOR, 0.35);
    g.lineWidth = 1.6 * u;
    for (let i = 0; i < Y.wind; i++) {
      const y = H * (0.25 + 0.5 * hash(i * 4.1)), x0 = (((hash(i * 2.3) + t * 0.05) % 1) * 1.4 - 0.2) * W;
      g.beginPath();
      for (let j = 0; j <= 12; j++) {
        const xx = x0 + j * W * 0.012, yy = y + Math.sin(j * 0.9 + t * 2 + i) * H * 0.006;
        if (j) g.lineTo(xx, yy);
        else g.moveTo(xx, yy);
      }
      g.stroke();
    }
  }

  function drawClose(g, ctx, S, F, t, k) {
    const W = ctx.W, H = ctx.H, C = K.CLOSE;
    S.extend = S.style.body.legs ? 0 : K.EXTEND;
    blurredSet(g, ctx, S, F, C.zoom, C.blur, C.dim);
    const A = (F.actors || [])[0];
    if (!A) return;
    const c = charOf(S, A.char);
    const L = charLayout(S, c);
    const kk = ((H * clamp(S.style.body.head * C.headK, C.headMin, C.headMax)) / L.headH) * (1 + C.push * k);
    const x = W * C.x, y = H * C.y - L.headCy * kk;
    g.save();
    g.translate(x, y);
    g.scale(kk, kk);
    drawPuppet(g, S, Object.assign({}, A, { pose: A.pose === K.S.COVER_FACE ? A.pose : K.S.IDLE, face: A.face === K.S.BACK ? K.S.FRONT : A.face, talk: speechLevel(F, A, t) }), t, { tint: 1 });
    g.restore();
  }

  function drawShadow(g, ctx, S, F, t) {
    const W = ctx.W, H = ctx.H, D = K.SHADOW;
    blurredSet(g, ctx, S, F, 1.08, 0, null);
    const A = (F.actors || [])[0];
    if (!A) return;
    g.save();
    g.globalAlpha = D.alpha * (0.85 + 0.15 * Math.sin(t * 1.7));
    g.translate(W * D.x, H * 0.92);
    g.transform(1, 0, D.skew, 1, 0, 0);
    g.translate(-W * D.x, -H * 0.92);
    puppetAt(g, S, Object.assign({}, A, { expr: K.S.NEUTRAL }), F, t, W * D.x, H * 0.92, H * D.h, 0.04);
    g.restore();
    if ((F.actors || [])[1]) puppetAt(g, S, F.actors[1], F, t, W * D.figX, H * 0.95, H * D.figH, 1);
  }

  function drawOverlays(g, ctx, S, F, t) {
    const W = ctx.W, H = ctx.H, u = H / 720;
    for (const o of F.overlays || []) {
      if (o === K.S.RAIN) {
        g.strokeStyle = rgba(K.RAIN, 0.35);
        g.lineWidth = 1.2 * u;
        for (let i = 0; i < 120; i++) {
          const x = ((hash(i * 1.7) + t * 0.08) % 1) * W, y = ((hash(i * 3.9) + t * 1.4) % 1) * H;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x - 4 * u, y + 18 * u);
          g.stroke();
        }
      } else if (o === K.S.FOG) {
        for (let i = 0; i < 4; i++) glow(g, ((hash(i * 2.1) + t * 0.01) % 1) * W, H * (0.6 + 0.1 * i), H * 0.6, K.FOG, 0.12);
      } else if (o === K.S.DUST) {
        for (let i = 0; i < 40; i++) {
          g.fillStyle = rgba(K.WHITE, 0.25 * hash(i * 1.3));
          g.beginPath();
          g.arc(((hash(i * 2.7) + t * 0.006) % 1) * W, ((hash(i * 5.3) + t * 0.004) % 1) * H, 1.4 * u, 0, Math.PI * 2);
          g.fill();
        }
      } else if (o === K.S.STEAM || o === K.S.SMOKE) {
        const x0 = W * (F.overlayX || 0.5), y0 = H * (F.overlayY || 0.6);
        g.strokeStyle = rgba(o === K.S.STEAM ? K.STEAM : K.S.SMOKE_COLOR, 0.5);
        g.lineWidth = 3 * u;
        for (let j = 0; j < 3; j++) {
          g.beginPath();
          for (let i = 0; i <= 10; i++) {
            const yy = y0 - i * H * 0.018 - ((t * 30 * u) % (H * 0.04));
            const xx = x0 + (j - 1) * W * 0.03 + Math.sin(i * 0.8 + t * 2 + j) * W * 0.008;
            if (i) g.lineTo(xx, yy);
            else g.moveTo(xx, yy);
          }
          g.stroke();
        }
      } else if (o === K.S.GHOST) {
        g.save();
        g.globalAlpha = 0.5 + 0.1 * Math.sin(t * 2.3);
        g.fillStyle = K.GHOST;
        const x = W * (F.overlayX || 0.82), y = H * 0.9, h = H * 0.6;
        g.beginPath();
        g.ellipse(x, y - h * 0.82, h * 0.12, h * 0.15, 0, 0, Math.PI * 2);
        g.moveTo(x - h * 0.16, y);
        g.quadraticCurveTo(x - h * 0.2, y - h * 0.6, x, y - h * 0.68);
        g.quadraticCurveTo(x + h * 0.2, y - h * 0.6, x + h * 0.16, y);
        g.fill();
        g.restore();
      }
    }
    const vr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vr.addColorStop(0, rgba(K.BLACK, 0));
    vr.addColorStop(1, rgba(K.BLACK, F.vignette != null ? F.vignette : S.style.vignette != null ? S.style.vignette : K.VIGNETTE));
    g.fillStyle = vr;
    g.fillRect(0, 0, W, H);
    const bs = g.createLinearGradient(0, H * (1 - K.BOTTOM_SHADE.h), 0, H);
    bs.addColorStop(0, rgba(K.BLACK, 0));
    bs.addColorStop(1, rgba(K.BLACK, K.BOTTOM_SHADE.a));
    g.fillStyle = bs;
    g.fillRect(0, H * (1 - K.BOTTOM_SHADE.h), W, H * K.BOTTOM_SHADE.h);
  }

  function blink(g, ctx, F, t) {
    const k = clamp((t - F.start) / Math.max(0.3, F.end - F.start), 0, 1);
    const open = K.LID_OPEN * ease(clamp(k * 2.2, 0, 1)) * (k < 0.3 ? 0.6 + 0.4 * Math.abs(Math.sin(k * 20)) : 1);
    const W = ctx.W, H = ctx.H;
    g.save();
    g.fillStyle = K.BLACK;
    g.beginPath();
    g.rect(0, 0, W, H);
    g.ellipse(W / 2, H / 2, W * 0.75, Math.max(1, H * open), 0, 0, Math.PI * 2, true);
    g.fill(K.EVENODD);
    g.restore();
  }

  function drawFrame(g, ctx, S, F, t) {
    const k = clamp((t - F.start) / Math.max(0.3, F.end - F.start), 0, 1);
    S.extend = 0;
    g.save();
    if (F.shot === K.S.INSERT && F.prop) drawInsert(g, ctx, S, F, t, k);
    else if (F.shot === K.S.SYMBOL && F.prop) drawSymbol(g, ctx, S, F, t);
    else if (F.shot === K.S.CLOSE && (F.actors || []).length) drawClose(g, ctx, S, F, t, k);
    else if (F.shot === K.S.SHADOW && (F.actors || []).length) drawShadow(g, ctx, S, F, t);
    else drawStage(g, ctx, S, F, t, k);
    drawOverlays(g, ctx, S, F, t);
    if (F.shot === K.SHOT_BLINK) blink(g, ctx, F, t);
    g.restore();
  }

  function draw(g, ctx) {
    const S = ctx.state;
    if (!S || !S.frames.length) {
      g.fillStyle = K.BLACK;
      g.fillRect(0, 0, ctx.W, ctx.H);
      return;
    }
    const t = ctx.abs;
    const at = frameAt(S, t);
    if (!at.cur) return;
    const fx = fxAt(ctx, t);
    if (fx && fx.shake) {
      g.save();
      g.translate(Math.sin(t * 90) * fx.shake * ctx.H, Math.cos(t * 77) * fx.shake * ctx.H);
    }
    drawFrame(g, ctx, S, at.cur, t);
    const since = t - at.cur.start;
    if (at.prev && since < K.FADE && at.cur.cut !== true) {
      g.save();
      g.globalAlpha = 1 - ease(since / K.FADE);
      drawFrame(g, ctx, S, at.prev, t);
      g.restore();
    }
    if (fx && fx.shake) g.restore();
    if (fx && fx.flash) {
      g.save();
      g.globalAlpha = fx.flash;
      g.fillStyle = K.WHITE;
      g.fillRect(0, 0, ctx.W, ctx.H);
      g.restore();
    }
  }

  function fxAt(ctx, t) {
    const cues = (ctx.spec && ctx.spec.fxCues) || [];
    let out = null;
    for (const c of cues) {
      const d = t - c.t;
      const e = K.FX[c.kind];
      if (!e || d < 0 || d > e.dur) continue;
      const k = 1 - d / e.dur;
      out = out || {};
      if (e.flash) out.flash = Math.max(out.flash || 0, e.flash * k * (d < e.dur * 0.3 || d > e.dur * 0.5 ? 1 : 0.3));
      if (e.shake) out.shake = Math.max(out.shake || 0, e.shake * k);
    }
    return out;
  }

  function bgInit(ctx, bg) {
    const kit = ctx.spec && ctx.spec.kit;
    if (!kit || !bg) return null;
    return { puppet: true, S: { frames: [], style: styleOf(ctx.spec), kit, motion: !!kit.motion }, F: { set: bg.set, light: bg.light || null } };
  }

  function bgDraw(g, ctx, st) {
    if (!st || !st.S) return;
    blurredSet(g, ctx, st.S, st.F, K.BG.zoom, K.BG.blur, null);
  }

  ME.PUPPET2D = { init, draw, preload, bgInit, bgDraw, K };
  ME.registerTemplate(K.TEMPLATE, {
    name: K.NAME,
    category: K.CATEGORY,
    description: K.DESCRIPTION,
    init(ctx) {
      return init(ctx);
    },
    draw(g, ctx) {
      draw(g, ctx);
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
