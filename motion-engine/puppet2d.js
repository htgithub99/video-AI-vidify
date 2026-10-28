(function (root) {
  "use strict";
  const ME = root.MotionEngine;
  if (!ME || !ME.registerTemplate) return;
  const U = ME.util;
  const clamp = U.clamp,
    lerp = U.lerp,
    ease = U.ease,
    hash = U.hash;
  const DEG = Math.PI / 180;
  const K = root.MotionEngineText.PUPPET;
  ME.puppetCameraProgress = (F, t) => ((F.visualEnd ?? F.end) - (F.visualStart ?? F.start) < K.CAMERA_PACE.minimumShot ? 0 : clamp((t - (F.visualStart ?? F.start)) / Math.max(K.CAMERA_PACE.seconds, (F.visualEnd ?? F.end) - (F.visualStart ?? F.start)), 0, 1));
  const ASSETS = { imgs: new Map() };
  const svgKey = (svg) => svg;
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
      const layers = Array.from(rootEl.children);
      const middle = layers.find((el) => el.id === K.SET_MID_ID);
      const floor = layers.find((el) => el.id === K.SET_FLOOR_ID);
      if (middle && floor && layers.indexOf(floor) > layers.indexOf(middle)) rootEl.insertBefore(floor, middle);
      if (!rootEl.getAttribute(K.XMLNS)) rootEl.setAttribute(K.XMLNS, K.SVG_NS);
      const defs = rootEl.querySelector(K.DEFS_SEL);
      const alone = (el) => {
        const shell = rootEl.cloneNode(false);
        if (defs) shell.appendChild(defs.cloneNode(true));
        shell.appendChild(el.cloneNode(true));
        return new XMLSerializer().serializeToString(shell);
      };
      const occEls = Array.from(rootEl.querySelectorAll(K.OCC_SEL));
      const occ = occEls.map((el) => ({ y: Number(el.getAttribute(K.OCC_ATTR)) || 0, svg: alone(el) })).sort((a, b) => a.y - b.y);
      for (const el of occEls) el.parentNode.removeChild(el);
      const fg = rootEl.querySelector(K.FG_SEL);
      if (!fg) return { main: new XMLSerializer().serializeToString(rootEl), fg: null, occ };
      const fgSvg = alone(fg);
      fg.parentNode.removeChild(fg);
      return { main: new XMLSerializer().serializeToString(rootEl), fg: fgSvg, occ };
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
      for (const look of [c, ...Object.values(c.looks || {})]) {
        for (const v of Object.values(look.head || {})) add(v);
        for (const v of Object.values(look.body || {})) add(v);
        for (const s of Object.values(look.sprites || {})) add(s && s.svg);
      }
    }
    for (const s of Object.values(kit.sets || {})) {
      const p = setParts(s);
      add(p.main);
      add(p.fg);
      for (const o of p.occ || []) add(o.svg);
    }
    for (const p of Object.values(kit.props || {})) add(p && p.svg);
    await Promise.all(jobs);
  }
  ME.PUPPET_PRELOAD = preload;
  const rgba = (hex, a) => {
    const h = String(hex || K.BLACK).replace(K.S.HASH, K.S.EMPTY);
    const n =
      parseInt(
        h.length === 3
          ? h
              .split(K.S.EMPTY)
              .map((c) => c + c)
              .join(K.S.EMPTY)
          : h.slice(0, 6),
        16,
      ) || 0;
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
    const kit = (ctx.spec && ctx.spec.kit) || {},
      behavior = kit.renderBehavior;
    return { frames, style: styleOf(ctx.spec), kit, motion: behavior ? behavior.actors === K.SIMPLE_MOTION : !!kit.motion, effects: !behavior || behavior.sceneEffects !== K.NO_EFFECTS, camera: !behavior || behavior.camera === K.GENTLE_CAMERA };
  }
  function frameAt(S, t) {
    const fs = S.frames;
    let cur = null,
      idx = -1;
    for (let i = 0; i < fs.length; i++)
      if (t >= fs[i].start) {
        cur = fs[i];
        idx = i;
      }
    return { cur: cur || fs[0] || null, prev: idx > 0 ? fs[idx - 1] : null, idx: Math.max(0, idx) };
  }
  function charOf(S, id, look) {
    const c = (S.kit.characters || {})[id];
    return (look && c && c.looks && c.looks[look]) || c || { id, height: 1, colors: {} };
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
      const px = x * L.bodyW,
        py = y >= 1 ? L.bodyH * (S.extend || 0) : -L.bodyH * (1 - y);
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
    const f = (v) =>
      Math.round(v * k)
        .toString(16)
        .padStart(2, K.S.ZERO);
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
    const x = -L.headW / 2,
      y = L.headCy - L.headH / 2;
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
      const w = F.eyeW * L.headW * (F.eyes === K.S.DOT ? 0.55 : 1),
        h = F.eyeH * L.headH * (F.eyes === K.S.DOT ? 0.4 : 1) * open;
      g.beginPath();
      const closedFolk = F.nose && (expr === K.S.HAPPY || open < 0.15);
      if (closedFolk) {
        g.moveTo(cx(ex) - w * 0.65, cy(F.eyeY));
        g.quadraticCurveTo(cx(ex), cy(F.eyeY) - F.eyeH * L.headH * (expr === K.S.HAPPY ? 0.45 : -0.15), cx(ex) + w * 0.65, cy(F.eyeY));
        g.strokeStyle = eyeCol;
        g.lineWidth = lineW(S, L);
        g.lineCap = K.ROUND;
        g.stroke();
      } else if (F.eyes === K.S.ROUND) {
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
      if (!closedFolk) g.fill();
      if (F.brows && (E.brow || F.nose)) {
        g.beginPath();
        const by = cy(F.eyeY) - F.eyeH * L.headH * 0.75;
        const tilt = -(E.brow || 0) * F.eyeH * L.headH * 0.12 * (ex < 0.5 ? 1 : -1);
        g.moveTo(cx(ex) - w * 0.7, by + tilt);
        g.quadraticCurveTo(cx(ex), by - F.eyeH * L.headH * 0.15, cx(ex) + w * 0.7, by - tilt);
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
    if (F.nose) {
      const N = K.FOLK_FACE;
      g.beginPath();
      g.moveTo(cx(N.noseX + N.noseSide * dir), cy(N.noseTop));
      g.quadraticCurveTo(cx(N.noseTipX + N.noseSide * dir), cy(N.noseTipY), cx(N.noseEndX + N.noseSide * dir), cy(N.noseEndY));
      g.strokeStyle = eyeCol;
      g.lineWidth = lineW(S, L) * N.noseStroke;
      g.lineCap = K.ROUND;
      g.stroke();
    }
    const mx = cx(0.5 + 0.16 * dir),
      my = cy(F.mouthY);
    const mw = F.mouthW * L.headW,
      mh = F.mouthH * L.headH;
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
    const sx = (sh[0] / K.BODY_BOX[0] - 0.5) * L.bodyW,
      sy = -L.bodyH + (sh[1] / K.BODY_BOX[1]) * L.bodyH;
    const len = B.armLen * L.total * (lenK || 1);
    const w = Math.max(2, B.limbW * L.headW * (nub ? K.NUB.width : 1));
    const a = ang * DEG * -side;
    const up = len * 0.5;
    let ex = sx - Math.sin(a) * up,
      ey = sy + Math.cos(a) * up;
    const b = a + bend * DEG * side;
    let hx = ex - Math.sin(b) * (len - up),
      hy = ey + Math.cos(b) * (len - up);
    if (side > 0 && S.rigReach) {
      const m = g.getTransform(),
        v = S.rigCapture ? { sc: 1, ox: 0, oy: 0 } : S.view,
        worldX = S.rigReach.x * v.sc + v.ox,
        worldY = S.rigReach.y * v.sc + v.oy,
        space = S.effectSpace,
        sm = space && space.m,
        sd = sm && sm.a * sm.d - sm.b * sm.c,
        px = (space ? ((sm.d * (worldX - sm.e) - sm.c * (worldY - sm.f)) / sd - space.x) * space.r : worldX) - m.e,
        py = (space ? ((-sm.b * (worldX - sm.e) + sm.a * (worldY - sm.f)) / sd - space.y) * space.r : worldY) - m.f,
        det = m.a * m.d - m.b * m.c;
      const tx = (m.d * px - m.c * py) / det,
        ty = (-m.b * px + m.a * py) / det,
        dx = tx - sx,
        dy = ty - sy,
        distance = Math.max(K.CONTACT.tiny, Math.hypot(dx, dy)),
        ratio = Math.min(1, (len * K.CONTACT.scale) / distance),
        half = Math.min(len / 2, distance / 2),
        bendH = Math.sqrt(Math.max(0, (len / 2) ** 2 - half ** 2));
      hx = sx + dx * ratio;
      hy = sy + dy * ratio;
      ex = (sx + hx) / 2 - (dy / distance) * bendH;
      ey = (sy + hy) / 2 + (dx / distance) * bendH;
    }
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
    if (side > 0) rigPoint(g, S, K.CONTACT.hand, hx, hy);
    return [hx, hy];
  }
  function rigPoint(g, S, name, x, y) {
    if (!S.rigCapture) return;
    const m = g.getTransform();
    S.rigPoints[S.rigActor + K.CONTACT.join + name] = { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  }
  function rigBody(g, S, L) {
    const shoulder = K.SHOULDERS[1];
    rigPoint(g, S, K.CONTACT.shoulder, (shoulder[0] / K.BODY_BOX[0] - 0.5) * L.bodyW, -L.bodyH + (shoulder[1] / K.BODY_BOX[1]) * L.bodyH);
    rigPoint(g, S, K.CONTACT.body, 0, -L.bodyH / 2);
    rigPoint(g, S, K.CONTACT.head, 0, L.headCy);
    rigPoint(g, S, K.CONTACT.ear, L.headW * K.CONTACT.earX, L.headCy + L.headH * K.CONTACT.earY);
    rigPoint(g, S, K.CONTACT.back, L.headW * K.CONTACT.backX, L.bodyH * K.CONTACT.backY);
  }
  function resolveContacts(S, F, actors, t) {
    if (!F.contacts || !F.contacts.length) return;
    const canvas = scratch(S, 3, 1, 1),
      g = canvas.getContext(K.CTX2D);
    S.rigPoints = {};
    if (F.blocking && F.blocking.kind === K.CONTACT.carrying) {
      const roles = F.blocking.roles,
        carrier = actors.find((actor) => actor.A.char === roles.carrier),
        carried = actors.find((actor) => actor.A.char === roles.carried);
      if (carrier && carried) {
        carried.A.pose = K.CONTACT.sit;
        carried.A.face = carrier.A.face;
        carrier.A.gesture = K.CONTACT.cradle;
      }
    }
    S.rigCapture = true;
    try {
      const capture = (actor) => {
        g.setTransform(actor.k, 0, 0, actor.k, actor.x, actor.y);
        drawPuppetRaw(g, S, actor.A, t, { tint: 1 });
      };
      for (const actor of actors) capture(actor);
      for (const contact of F.contacts) {
        const actor = actors.find((item) => item.A.char === contact.actor),
          target = S.rigPoints[contact.target + K.CONTACT.join + contact.targetPoint],
          source = S.rigPoints[contact.actor + K.CONTACT.join + contact.point];
        if (!actor || !target || !source) continue;
        if (contact.mode === K.CONTACT.reach) actor.A.reachPoint = target;
        else if (contact.mode === K.CONTACT.attach) {
          if (contact.point === K.CONTACT.mouth) {
            const dx = source.x - actor.x,
              dy = source.y - actor.y,
              radius = Math.hypot(dx, dy),
              height = clamp(target.y - actor.y, -radius, radius),
              direction = target.x >= actor.x ? 1 : -1,
              desired = Math.atan2(height, direction * Math.sqrt(Math.max(0, radius * radius - height * height))),
              angle = desired - Math.atan2(dy, dx),
              lean = clamp(Math.atan2(Math.sin(angle), Math.cos(angle)), -K.CONTACT.maxLean, K.CONTACT.maxLean);
            actor.A.contactLean = lean;
            actor.x = target.x - (dx * Math.cos(lean) - dy * Math.sin(lean));
          } else {
            actor.x += target.x - source.x;
            actor.y += target.y - source.y;
            actor.attached = true;
          }
        }
        capture(actor);
      }
      if (F.blocking && F.blocking.kind === K.CONTACT.carrying) {
        const carrier = actors.find((actor) => actor.A.char === F.blocking.roles.carrier),
          carried = actors.find((actor) => actor.A.char === F.blocking.roles.carried);
        if (carrier && carried) {
          if (F.blocking.variant === K.CONTACT.piggyback) carried.A.reachPoint = S.rigPoints[carrier.A.char + K.CONTACT.join + K.CONTACT.shoulder];
          else carrier.A.reachPoint = S.rigPoints[carried.A.char + K.CONTACT.join + K.CONTACT.body];
          capture(carrier);
          capture(carried);
        }
      }
      S.contactPoints = S.rigPoints;
    } finally {
      S.rigCapture = false;
      S.rigReach = null;
    }
  }
  function poseState(S, A, t) {
    const base = (S.style.face.nose && K.FOLK_POSES[A.pose]) || K.POSES[A.pose] || K.POSES.idle;
    const P = Object.assign({}, base, K.GESTURES[A.gesture] || (A.hold && base.sprite ? K.GESTURES.hold : {}));
    const seed = hash((A.char || K.S.EMPTY).length * 7.3 + (A.char || K.S.EMPTY).charCodeAt(0));
    const motion = S.motion && !A.contactLocked;
    const breath = motion ? Math.sin(t * 2 + seed * 6) * K.BREATH : 0;
    let l = P.l ? P.l.slice() : [4, 0],
      r = P.r ? P.r.slice() : [4, 0];
    if (P.gest && motion && A.talk > 0 && !A.contactLocked) r = [r[0] + Math.sin(t * 2.4 + seed) * K.TALK_SWING * 0.5, r[1]];
    if (P.wave && motion) r = [r[0] + Math.sin(t * 9) * 18, r[1]];
    if (P.swing && motion) r = [lerp(P.swing[0], P.swing[1], Math.pow((Math.sin(t * P.swing[2] * Math.PI * 2) + 1) / 2, K.SWING_EASE)), r[1]];
    const shake = P.shake && motion ? Math.sin(t * 22) * 0.004 : 0;
    const head = (P.head || 0) + (motion ? Math.sin(t * 0.7 + seed * 4) * 2.2 : 0);
    const walk = P.walk && motion ? Math.abs(Math.sin(t * (P.walk > 1 ? 11 : 7))) * 0.02 : 0;
    return { l, r, lean: P.lean || 0, head, breath, shake, walk, sprite: P.sprite || null, grip: P.grip || 0, len: P.len || 1, shoulder: P.shoulder || 0 };
  }
  function blinkAt(t, seed) {
    const p = (t + seed * 5) % K.BLINK_EVERY;
    return p < 0.12 ? 1 - Math.abs(p - 0.06) / 0.06 : 0;
  }
  function scratch(S, i, w, h) {
    S.scr = S.scr || [];
    let c = S.scr[i];
    if (!c) c = S.scr[i] = typeof OffscreenCanvas !== K.UNDEF ? new OffscreenCanvas(w, h) : document.createElement(K.CANVAS);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    } else c.getContext(K.CTX2D).clearRect(0, 0, w, h);
    return c;
  }
  function offPuppet(g, S, A, t, opt, idx) {
    const L = charLayout(S, charOf(S, A.char));
    const m = g.getTransform();
    const P = K.GHOST_FX.pad;
    const x0 = -P[0] * L.total,
      y0 = -P[1] * L.total,
      bw = 2 * P[0] * L.total,
      bh = (P[1] + P[2]) * L.total;
    const r = Math.min(Math.max(0.05, Math.hypot(m.a, m.b)), K.GHOST_FX.maxPx / bw, K.GHOST_FX.maxPx / bh);
    const w = Math.max(2, Math.ceil(bw * r)),
      h = Math.max(2, Math.ceil(bh * r));
    const c = scratch(S, idx, w, h);
    const o = c.getContext(K.CTX2D);
    o.save();
    o.setTransform(r, 0, 0, r, -x0 * r, -y0 * r);
    const previousSpace = S.effectSpace;
    S.effectSpace = { g: o, m, x: x0, y: y0, r };
    drawPuppetRaw(o, S, A, t, opt);
    S.effectSpace = previousSpace;
    o.restore();
    return { c, o, x0, y0, bw, bh, L, w, h, r, s: Math.hypot(m.a, m.b) };
  }
  function silhouetteOf(S, src, idx, color) {
    const c = scratch(S, idx, src.width, src.height);
    const o = c.getContext(K.CTX2D);
    o.save();
    o.drawImage(src, 0, 0);
    o.globalCompositeOperation = K.SOURCE_IN;
    o.fillStyle = color;
    o.fillRect(0, 0, c.width, c.height);
    o.restore();
    return c;
  }
  function drawSilhouette(g, S, A, t, opt, color, alpha, soft) {
    const f = offPuppet(g, S, A, t, opt, 0);
    const sil = silhouetteOf(S, f.c, 1, color);
    g.save();
    if (soft && K.FILTER in g) g.filter = K.BLUR(soft);
    g.globalAlpha *= alpha;
    g.drawImage(sil, f.x0, f.y0, f.bw, f.bh);
    g.restore();
    return f.L;
  }
  function drawGhost(g, S, A, t, opt) {
    const G = K.GHOST_FX;
    const f = offPuppet(g, S, A, t, opt, 0);
    g.save();
    if (K.FILTER in g) g.filter = K.BLUR(G.blur * f.L.total * f.s);
    g.globalAlpha *= G.alpha;
    g.drawImage(f.c, f.x0, f.y0, f.bw, f.bh);
    g.restore();
    return f.L;
  }
  function drawPuppet(g, S, A, t, opt) {
    if (S.emitters) {
      const L = charLayout(S, charOf(S, A.char));
      effectPoint(g, S, A.char, 0, A.pose === K.S.LIE ? -L.bodyW * K.EFFECT.lyingY : -L.total * K.EFFECT.bodyY);
      effectPoint(g, S, A.char, 0, 0, K.EFFECT.feet);
    }
    if (A.sil && !opt.raw) return drawSilhouette(g, S, Object.assign({}, A, { sil: false, talk: 0 }), t, { tint: 1 }, K.SIL.color, K.SIL.actor, 0);
    if (charOf(S, A.char).ghost && !opt.raw && A.appearance?.form !== K.S.HUMAN) return drawGhost(g, S, A, t, opt);
    return drawPuppetRaw(g, S, A, t, opt);
  }
  function drawPuppetRaw(g, S, A, t, opt) {
    if (!S.motion) {
      t = 0;
      A = Object.assign({}, A, { talk: 0 });
    }
    S.rigActor = A.char;
    S.rigReach = A.reachPoint || null;
    const c = charOf(S, A.char, A.look);
    const L = charLayout(S, c);
    const revealed = charOf(S, A.char).ghost && A.appearance?.form !== K.S.HUMAN;
    const expression = revealed && (!A.expr || A.expr === K.S.NEUTRAL) ? K.S.UNCANNY : A.expr || K.S.NEUTRAL;
    const headState = revealed ? Object.assign({}, S, { style: Object.assign({}, S.style, { face: Object.assign({}, S.style.face, K.REVEALED_FACE) }) }) : S;
    const ps = poseState(S, A, t);
    const tint = opt.tint == null ? 1 : opt.tint;
    const view = A.face === K.S.BACK ? K.S.BACK : A.face === K.S.LEFT || A.face === K.S.RIGHT ? K.S.SIDE : K.S.FRONT;
    const dir = A.face === K.S.LEFT ? -1 : A.face === K.S.RIGHT ? 1 : 0;
    const seed = hash((A.char || K.S.EMPTY).length * 3.1);
    g.save();
    if (A.contactLean) g.rotate(A.contactLean);
    if (ps.sprite) {
      const sp = ps.sprite !== K.S.LIE && c.sprites && c.sprites[ps.sprite];
      const img = sp && imgOf(sp.svg);
      if (img) {
        const w = (sp.w || 1) * L.total,
          h = (sp.h || 1) * L.total;
        const ax = sp.anchor ? sp.anchor[0] : 0.5,
          ay = sp.anchor ? sp.anchor[1] : 1;
        if (dir < 0) g.scale(-1, 1);
        drawImg(g, img, -ax * w, -ay * h, w, h, tint);
        if (!sp.rig) {
          g.restore();
          return L;
        }
        const SL = Object.assign({}, L);
        for (const key of Object.keys(sp.rig)) SL[key] = sp.rig[key] * L.total;
        rigBody(g, S, SL);
        rigPoint(g, S, K.CONTACT.mouth, (dir ? K.CONTACT.mouthX : 0) * SL.headW, SL.headCy + (S.style.face.mouthY - K.EFFECT.headHalf) * SL.headH);
        effectPoint(g, S, A.char, 0, SL.headCy + (S.style.face.mouthY - K.EFFECT.headHalf) * SL.headH, K.EFFECT.targets);
        drawHead(g, headState, c, SL, view, dir ? 1 : 0, expression, { level: A.talk || 0, t }, revealed || !S.motion ? 0 : blinkAt(t, seed) * (A.expr === K.S.SLEEP ? 0 : 1), tint);
        if (A.hold || A.gesture || A.reachPoint || sp.bodyOnly) {
          if (view !== K.S.SIDE) drawArm(g, S, c, SL, -1, ps.l[0], ps.l[1], tint, ps.len);
          const hand = drawArm(g, S, c, SL, 1, ps.r[0], ps.r[1], tint, ps.len);
          if (A.hold) drawHeld(g, S, A.hold, SL, { x: hand[0], y: hand[1], dir: ps.r[0] - ps.r[1] }, ps.grip);
        }
        if (A.wear) for (const id of A.wear) drawWorn(g, S, id, SL, view);
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
    rigBody(g, S, L);
    const armsBehind = view === K.S.BACK;
    const nubs = S.style.body.idleArms === K.S.NUB;
    const isNub = (a) => nubs && a[0] < K.NUB.max && !S.rigReach;
    let hand = null;
    const arm = (side, a) => {
      const h = isNub(a) ? drawArm(g, S, c, L, side, K.NUB.angle, 0, tint, K.NUB.len, true) : drawArm(g, S, c, L, side, a[0], a[1], tint, ps.len);
      if (side > 0 && !isNub(a)) hand = { x: h[0], y: h[1], dir: a[0] - a[1] };
      return h;
    };
    const sides =
      view === K.S.SIDE
        ? [[1, ps.r]]
        : [
            [-1, ps.l],
            [1, ps.r],
          ];
    g.save();
    if (ps.sprite === K.S.LIE) g.translate(-L.headW * K.LYING_BODY_DROP, 0);
    for (const [side, a] of sides) if (armsBehind || isNub(a)) arm(side, a);
    drawBody(g, S, c, L, view, tint);
    if (!armsBehind) for (const [side, a] of sides) if (!isNub(a)) arm(side, a);
    if (hand && A.hold && armsBehind && !ps.shoulder) drawHeld(g, S, A.hold, L, hand, ps.grip);
    g.restore();
    g.save();
    g.translate(0, L.headCy + L.headH * 0.45);
    g.rotate(ps.head * DEG * (dir || 1));
    g.translate(0, -(L.headCy + L.headH * 0.45));
    effectPoint(g, S, A.char, 0, L.headCy + (S.style.face.mouthY - K.EFFECT.headHalf) * L.headH, K.EFFECT.targets);
    rigPoint(g, S, K.CONTACT.mouth, (dir ? K.CONTACT.mouthX : 0) * L.headW, L.headCy + (S.style.face.mouthY - K.EFFECT.headHalf) * L.headH);
    drawHead(g, headState, c, L, view, dir ? 1 : 0, expression, { level: A.talk || 0, t }, revealed || !S.motion ? 0 : blinkAt(t, seed) * (A.expr === K.S.SLEEP ? 0 : 1), tint);
    g.restore();
    if (S.style.face.nose && A.pose === K.S.COVER_FACE && view !== K.S.BACK) for (const [side, a] of sides) arm(side, a);
    if (A.wear) for (const w of A.wear) drawWorn(g, S, w, L, view, ps.sprite === K.S.LIE);
    if (A.hold && ps.shoulder) drawShouldered(g, S, A.hold, L);
    else if (hand && A.hold && !armsBehind) drawHeld(g, S, A.hold, L, hand, ps.grip);
    g.restore();
    return L;
  }
  function drawShouldered(g, S, id, L) {
    const p = (S.kit.props || {})[id];
    if (!p) return;
    const h = ((p.size || K.HOLD_SIZE) / K.PERSON_M / K.PROP_FILL) * L.total;
    const sy = Math.max(-L.bodyH + (K.SHOULDERS[1][1] / K.BODY_BOX[1]) * L.bodyH, L.headCy + L.headH * K.NECK);
    drawProp(g, S, id, 0, sy + h * K.SHOULDER_DROP, h, 0);
  }
  function drawWorn(g, S, id, L, view, lying = false) {
    const p = (S.kit.props || {})[id];
    if (!p) return;
    if (p.bodyCover) {
      const img = imgOf(p.svg);
      if (!img) return;
      const width = L.bodyW * K.BODY_COVER.width;
      return drawImg(g, img, -width / 2 - (lying ? L.headW * K.LYING_BODY_DROP : 0), -L.bodyH, width, L.bodyH * K.BODY_COVER.height, 1);
    }
    if (p.attachment === K.ATTACH.body || (!p.attachment && K.WEAR_BODY_RE.test(id))) return drawProp(g, S, id, 0, 0, L.bodyH * K.WEAR_BODY_SCALE, 0);
    if (p.attachment === K.ATTACH.neck || (!p.attachment && K.WEAR_NECK_RE.test(id))) return drawProp(g, S, id, 0, L.headCy + L.headH / 2, L.headW * K.WEAR_NECK_SCALE, 0, p.attachment === K.ATTACH.neck ? p.grip : undefined);
    const h = L.headW * K.WEAR_W;
    drawProp(g, S, id, 0, L.headCy - L.headH / 2 + L.headH * K.WEAR_DROP, h, 0);
  }
  function drawHeld(g, S, id, L, hand, grip) {
    const p = (S.kit.props || {})[id];
    if (!p) return;
    const h = ((p.size || K.HOLD_SIZE) / K.PERSON_M / K.PROP_FILL) * L.total * K.HOLD_SCALE;
    drawProp(g, S, id, hand.x, hand.y + (p.grip || grip ? 0 : h * K.HOLD_DROP), h, grip ? 180 - hand.dir : 0, p.grip);
  }
  function effectPoint(g, S, id, x, y, slot = K.EFFECT.emitters) {
    const m = g.getTransform();
    let px = m.a * x + m.c * y + m.e,
      py = m.b * x + m.d * y + m.f;
    const space = S.effectSpace;
    if (g !== S.effectContext) {
      if (!space || space.g !== g) return;
      const lx = px / space.r + space.x,
        ly = py / space.r + space.y;
      px = space.m.a * lx + space.m.c * ly + space.m.e;
      py = space.m.b * lx + space.m.d * ly + space.m.f;
    }
    if (!S[slot]) S[slot] = {};
    S[slot][id] = { x: px, y: py, scale: Math.hypot(m.a, m.b) * (g === S.effectContext ? 1 : Math.hypot(space.m.a, space.m.b) / space.r) };
  }
  const propEmitters = new WeakMap();
  function propEmitter(img, p, box) {
    if (Array.isArray(p.emitter) && p.emitter.length === 2 && p.emitter.every(Number.isFinite)) return p.emitter;
    if (propEmitters.has(img)) return propEmitters.get(img);
    const c = document.createElement(K.CANVAS);
    c.width = c.height = K.EFFECT.scan;
    const g = c.getContext(K.CTX2D);
    g.drawImage(img, 0, 0, c.width, c.height);
    const pixels = g.getImageData(0, 0, c.width, c.height).data;
    let point = [box / 2, box * K.EFFECT.fallbackY];
    for (let y = 0; y < c.height; y++) {
      let sum = 0,
        count = 0;
      for (let x = 0; x < c.width; x++)
        if (pixels[(y * c.width + x) * 4 + 3] > K.EFFECT.alpha) {
          sum += x + 0.5;
          count++;
        }
      if (count) {
        point = [(sum / count / c.width) * box, ((y + 0.5) / c.height) * box];
        break;
      }
    }
    propEmitters.set(img, point);
    return point;
  }
  const propRestBounds = new WeakMap();
  function restPropBounds(img, angle, box) {
    const cached = propRestBounds.get(img) || new Map();
    if (cached.has(angle)) return cached.get(angle);
    const c = document.createElement(K.CANVAS);
    c.width = c.height = K.EFFECT.scan;
    const g = c.getContext(K.CTX2D);
    g.drawImage(img, 0, 0, c.width, c.height);
    const pixels = g.getImageData(0, 0, c.width, c.height).data;
    const cos = Math.cos(angle * DEG),
      sin = Math.sin(angle * DEG);
    let left = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (pixels[(y * c.width + x) * 4 + 3] > K.EFFECT.alpha)
          for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ]) {
            const px = ((x + dx) * box) / c.width,
              py = ((y + dy) * box) / c.height;
            const rx = px * cos - py * sin,
              ry = px * sin + py * cos;
            left = Math.min(left, rx);
            right = Math.max(right, rx);
            bottom = Math.max(bottom, ry);
          }
    const bounds = Number.isFinite(bottom) ? { x: (left + right) / 2, y: bottom } : { x: box / 2, y: box };
    cached.set(angle, bounds);
    propRestBounds.set(img, cached);
    return bounds;
  }
  function drawProp(g, S, id, x, base, h, rot, anchor) {
    const p = (S.kit.props || {})[id];
    const img = p && imgOf(p.svg);
    if (!img) return false;
    const box = p.box || 512;
    const resting = !anchor && Number.isFinite(p.restRotation);
    const angle = resting ? p.restRotation : rot || 0;
    const point = resting ? [0, 0] : anchor || p.base;
    const bx = point ? point[0] : box / 2,
      by = point ? point[1] : box;
    const s = h / box;
    g.save();
    const bounds = resting ? restPropBounds(img, angle, box) : { x: 0, y: 0 };
    g.translate(x - bounds.x * s, base - bounds.y * s);
    g.rotate(angle * DEG);
    g.drawImage(img, -bx * s, -by * s, box * s, box * s);
    if (S.emitters) {
      const point = propEmitter(img, p, box);
      effectPoint(g, S, id, (point[0] - bx) * s, (point[1] - by) * s);
    }
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
    const profile = S.style.atmosphere?.background;
    const previous = g.filter;
    const f = K.FILTER in g && (profile || opt?.blur);
    if (f) g.filter = [opt?.blur ? K.BLUR(opt.blur) : K.FILTER_NONE, profile ? K.BACKGROUND_GRADE(K.DARK_RE.test(String(set.time || K.EMPTY)) ? profile.night : profile.day, profile.saturation, profile.sepia) : K.FILTER_NONE].filter((value) => value !== K.FILTER_NONE).join(K.S.SPACE);
    g.drawImage(img, x, y, w, h);
    if (f) g.filter = previous || K.FILTER_NONE;
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
      const x = sx + l.x * sc,
        y = sy + l.y * sc,
        r = 260 * sc;
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
    let y = A.y != null ? A.y : floor,
      k = A.k || 1,
      blur = 0,
      tint = 1;
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
    const spec = (S.style.face.nose && S.style.atmosphere?.folkShots?.[kind]) || S.style.atmosphere?.shots?.[kind] || K.SHOT[kind] || K.SHOT.people;
    const main = actors.filter((a) => !a.fore && !a.back);
    const list = main.length ? main : actors;
    const halfWidth = (a) => (a.A.pose === K.S.LIE ? a.L.total * 0.55 : a.L.headW) * a.k;
    let x0 = Math.min.apply(
        null,
        list.map((a) => a.x - halfWidth(a)),
      ),
      x1 = Math.max.apply(
        null,
        list.map((a) => a.x + halfWidth(a)),
      );
    for (const item of F.items || [])
      if (item.propH && item.propX != null) {
        x0 = Math.min(x0, item.propX * K.SET_W - item.propH * K.PROP_HALF);
        x1 = Math.max(x1, item.propX * K.SET_W + item.propH * K.PROP_HALF);
      }
    if (F.prop && F.propH && K.PROP_FRAME_SHOTS.indexOf(kind) >= 0) {
      const px = F.propX * K.SET_W,
        pw = F.propH * K.PROP_HALF;
      x0 = Math.min(x0, px - pw);
      x1 = Math.max(x1, px + pw);
    }
    let top = Math.min.apply(
        null,
        list.map((a) => a.y - a.L.total * a.k),
      ),
      bottom = Math.max.apply(
        null,
        list.map((a) => a.y),
      );
    if (spec.head == null) {
      const profile = S.style.atmosphere;
      const context = profile
        ? {
            x0,
            x1,
            top,
            bottom,
            height: Math.max.apply(
              null,
              list.map((a) => a.L.total * a.k),
            ),
          }
        : null;
      if (F.layoutLocked)
        for (const bounds of set?.framingBounds || []) {
          if (context && (bounds[0] > context.x1 + context.height * profile.contextMargin || bounds[0] + bounds[2] < context.x0 - context.height * profile.contextMargin || bounds[1] > context.bottom + context.height * profile.contextMargin || bounds[1] + bounds[3] < context.top - context.height * profile.contextMargin || bounds[3] > context.height * profile.contextHeight)) continue;
          x0 = Math.min(x0, bounds[0]);
          x1 = Math.max(x1, bounds[0] + bounds[2]);
          top = Math.min(top, bounds[1]);
          bottom = Math.max(bottom, bounds[1] + bounds[3]);
        }
      const props = [...(F.items || []), ...(F.prop && K.PROP_FRAME_SHOTS.indexOf(kind) >= 0 ? [F] : [])];
      for (const prop of props)
        if (prop.propH && prop.propY != null) {
          top = Math.min(top, prop.propY - prop.propH);
          bottom = Math.max(bottom, prop.propY);
        }
    }
    const tall = Math.max.apply(
      null,
      list.map((a) => a.L.total * a.k),
    );
    let h, cy;
    const headH = Math.max.apply(
      null,
      list.map((a) => a.L.headH * a.k),
    );
    if (spec.head != null) {
      h = headH / spec.head;
      cy = top - spec.top * h + h / 2;
    } else if (spec.top != null) {
      h = ((tall * (1 - S.style.body.head * 0.2)) / spec.body) * 1.0;
      h = Math.max(h, (top < 0 ? 0 : 0) + tall * 0.75);
      cy = top - spec.top * h + h / 2;
    } else {
      h = tall / spec.body;
      cy = bottom - spec.feet * h + h / 2;
    }
    const A = S.VW / S.VH;
    h = Math.max(h, (x1 - x0) / (A * (spec.head != null ? 0.96 : 0.8)));
    if (spec.head == null) h = Math.max(h, (bottom - top) / (1 - K.FRAME_CONTACT_MARGIN * 2));
    h = Math.min(h, K.SET_H);
    if (spec.head == null) cy = clamp(cy, bottom + h * K.FRAME_CONTACT_MARGIN - h / 2, top - h * K.FRAME_CONTACT_MARGIN + h / 2);
    const w = h * A;
    let cx = (x0 + x1) / 2;
    cx = clamp(cx, w / 2, K.SET_W - w / 2);
    cy = clamp(cy, h / 2, K.SET_H - h / 2);
    return { cx, cy, h };
  }
  function objectBox(S, F, actors) {
    const O = K.OBJECT_FRAME,
      A = S.VW / S.VH;
    const px = F.propX * K.SET_W;
    let x0 = px - F.propH * K.PROP_HALF,
      x1 = px + F.propH * K.PROP_HALF;
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
    const m = K.MOVE[(F.camera && F.camera.move) || K.FILTER_NONE] || K.MOVE.none;
    const z = lerp(m[0], m[1], ease(k));
    const dx = m.length > 2 ? lerp(m[2], m[3], ease(k)) * box.h : 0;
    return { cx: box.cx + dx, cy: box.cy, h: box.h * z };
  }
  function drawStage(g, ctx, S, F, t, k) {
    const W = ctx.W,
      H = ctx.H;
    S.VW = W;
    S.VH = H;
    S.extend = !S.style.body.legs && K.EXTEND_SHOTS.indexOf(F.shot) >= 0 ? K.EXTEND : 0;
    const set = setFor(S, F);
    const acts = (F.actors || []).map((A, i, arr) => {
      const c = charOf(S, A.char);
      const L = charLayout(S, c);
      const pl = actorPlace(S, set, A, i, arr.length);
      const contactLocked = (F.contacts || []).some((contact) => contact.actor === A.char || contact.target === A.char);
      return Object.assign({}, pl, { A: Object.assign({}, A, { contactLocked }), L, fore: A.depth === K.S.FORE, back: A.depth === K.S.BACK, talk: speechLevel(F, A, t) });
    });
    resolveContacts(S, F, acts, t);
    const box = frameBox(S, F, set, acts);
    const cam = S.camera !== false ? camera(box, F, k) : box;
    const sc = H / cam.h;
    g.save();
    const OX = ctx.ox || 0;
    g.fillStyle = K.BLACK;
    g.fillRect(OX, 0, W, H);
    g.setTransform(sc, 0, 0, sc, OX + W / 2 - cam.cx * sc, H / 2 - cam.cy * sc);
    S.view = { sc, ox: OX + W / 2 - cam.cx * sc, oy: H / 2 - cam.cy * sc };
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
    if (big && !placed) drawProp(g, S, F.prop, K.SET_W * (F.propX || 0.5), (set && set.floorY ? set.floorY : K.FLOOR) + K.SET_H * 0.06, K.SET_H * K.OBJECT.h, 0);
    const order = acts.filter((a) => !a.fore).sort((a, b) => Number(!!a.attached) - Number(!!b.attached) || (a.back ? 0 : 1) - (b.back ? 0 : 1) || a.y - b.y);
    let propDone = !placed;
    const propNow = () => {
      propDone = true;
      drawProp(g, S, F.prop, K.SET_W * F.propX, F.propY, F.propH, F.propRot || 0);
    };
    const occ = set ? (setParts(set).occ || []).slice() : [];
    const extraProps = (F.items || [])
      .filter((it) => it.prop !== F.prop && Number.isFinite(it.propX) && Number.isFinite(it.propY) && it.propH > 0)
      .slice()
      .sort((a, b) => (a.propDepthY ?? a.propY) - (b.propDepthY ?? b.propY));
    const layersNow = (y) => {
      while (occ.length || extraProps.length || !propDone) {
        const od = occ.length ? occ[0].y : Infinity;
        const ed = extraProps.length ? (extraProps[0].propDepthY ?? extraProps[0].propY) : Infinity;
        const pd = !propDone && Number.isFinite(F.propY) ? (F.propDepthY ?? F.propY) : Infinity;
        if (Math.min(od, ed, pd) > y) break;
        if (occ.length && od <= ed && od <= pd) {
          const img = imgOf(occ.shift().svg);
          if (img) g.drawImage(img, 0, 0, K.SET_W, K.SET_H);
        } else if (extraProps.length && ed <= pd) {
          const it = extraProps.shift();
          drawProp(g, S, it.prop, K.SET_W * it.propX, it.propY, it.propH, it.propRot || 0);
        } else propNow();
      }
    };
    for (const a of order) {
      layersNow(a.y);
      g.save();
      g.translate(a.x, a.y);
      g.scale(a.k, a.k);
      if (a.blur && K.FILTER in g) g.filter = K.BLUR(a.blur);
      if (!a.attached && (!charOf(S, a.A.char).ghost || a.A.appearance?.form === K.S.HUMAN || a.A.pose === K.S.LIE)) {
        g.beginPath();
        g.ellipse(0, 0, a.L.bodyW * 0.55, a.L.bodyW * 0.1, 0, 0, Math.PI * 2);
        g.fillStyle = K.S.FOOT_SHADOW;
        g.fill();
      }
      const A = Object.assign({}, a.A, { talk: a.talk });
      if (S.motion && (A.pose === K.S.WALK || A.pose === K.S.RUN)) g.translate((clamp((t - F.start) / Math.max(0.1, F.end - F.start), 0, 1) - 0.5) * K.SET_W * K.WALK_SPEED * (A.face === K.S.LEFT ? -1 : 1) * (A.pose === K.S.RUN ? 2 : 1), 0);
      if (S.motion && (A.trail || K.TRAIL.poses.indexOf(A.pose) >= 0)) {
        const back = A.face === K.S.LEFT ? 1 : -1;
        for (let i = K.TRAIL.n; i >= 1; i--) {
          g.save();
          g.globalAlpha *= K.TRAIL.alpha[i - 1];
          g.translate(back * i * K.TRAIL.step * a.L.bodyW * 2, 0);
          drawPuppet(g, S, A, t, { tint: a.tint });
          g.restore();
        }
      }
      drawPuppet(g, S, A, t, { tint: a.tint });
      g.restore();
    }
    layersNow(Infinity);
    if (F.prop && !placed && !big && F.propX != null) drawProp(g, S, F.prop, K.SET_W * F.propX, (set && set.floorY) || K.FLOOR, K.SET_H * K.PROP_LEGACY_H, 0);
    if (set) drawSetLayer(g, S, set, K.S.FG, 0, 0, K.SET_W, K.SET_H, null);
    g.setTransform(1, 0, 0, 1, OX, 0);
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
    if (!F.speaker || F.speaker !== A.char || t < F.start || t >= F.end || !Array.isArray(F.speech)) return 0;
    const range = F.speech.find((r) => Array.isArray(r) && Number.isFinite(r[0]) && Number.isFinite(r[1]) && t >= r[0] && t < r[1]);
    if (!range) return 0;
    const lt = t - range[0],
      C = K.SPEECH;
    const syll = Math.max(0, Math.sin(lt * C.rate * Math.PI)) * (C.base + C.variation * hash(Math.floor(lt * C.rate) + C.seed));
    return syll * clamp((Math.min(F.end, range[1]) - t) / C.fade, 0, 1);
  }
  function blurredSet(g, ctx, S, F, zoom, blur, dim) {
    const W = ctx.W,
      H = ctx.H;
    const set = setFor(S, F);
    g.fillStyle = K.BLACK;
    g.fillRect(0, 0, W, H);
    if (!set) return;
    const sc = Math.max(W / K.SET_W, H / K.SET_H) * zoom;
    const w = K.SET_W * sc,
      h = K.SET_H * sc;
    const ox = (W - w) / 2,
      oy = (H - h) * 0.6;
    drawSetLayer(g, S, set, K.S.MAIN, ox, oy, w, h, { blur });
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
    return { sc, ox, oy, wall: set.wallY ? oy + set.wallY * sc : null };
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
    const W = ctx.W,
      H = ctx.H,
      I = K.INSERT;
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
    const x = W * I.x,
      base = H * I.base,
      h = H * I.h;
    S.view = { insert: { x, y: base - h * K.PROP_FILL } };
    glow(g, x, base - h / 2, h * 0.9, K.NIGHT_RE.test(F.light || K.EMPTY) ? K.COLD : K.GLOW, 0.3);
    drawProp(g, S, F.prop, x, base, h, F.propRot || 0);
    g.restore();
  }
  function drawSymbol(g, ctx, S, F, t) {
    const W = ctx.W,
      H = ctx.H,
      Y = K.SYMBOL,
      u = H / 720;
    g.fillStyle = Y.bg;
    g.fillRect(0, 0, W, H);
    const x = W / 2,
      h = H * Y.h,
      base = H * Y.y + h / 2;
    glow(g, x, base - h / 2, H * Y.halo, K.NIGHT_RE.test(F.light || K.EMPTY) ? K.COLD : K.GLOW, Y.haloA);
    drawProp(g, S, F.prop, x, base, h, F.propRot || 0);
    const effectTime = S.effects !== false ? t : 0;
    for (let i = 0; i < Y.dust; i++) {
      const px = ((hash(i * 3.3) + effectTime * 0.01 * (0.5 + hash(i))) % 1) * W,
        py = ((hash(i * 7.1) + effectTime * 0.006) % 1) * H;
      g.fillStyle = rgba(K.WHITE, K.DUST_ALPHA * (0.3 + 0.7 * hash(i * 1.9)));
      g.beginPath();
      g.arc(px, py, (0.8 + hash(i * 5.7) * 1.6) * u, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = rgba(K.WIND_COLOR, 0.35);
    g.lineWidth = 1.6 * u;
    for (let i = 0; i < Y.wind; i++) {
      const y = H * (0.25 + 0.5 * hash(i * 4.1)),
        x0 = (((hash(i * 2.3) + effectTime * 0.05) % 1) * 1.4 - 0.2) * W;
      g.beginPath();
      for (let j = 0; j <= 12; j++) {
        const xx = x0 + j * W * 0.012,
          yy = y + Math.sin(j * 0.9 + effectTime * 2 + i) * H * 0.006;
        if (j) g.lineTo(xx, yy);
        else g.moveTo(xx, yy);
      }
      g.stroke();
    }
  }
  function drawClose(g, ctx, S, F, t, k) {
    const W = ctx.W,
      H = ctx.H,
      C = K.CLOSE;
    S.extend = S.style.body.legs ? 0 : K.EXTEND;
    blurredSet(g, ctx, S, F, C.zoom, C.blur, C.dim);
    const A = (F.actors || [])[0];
    if (!A) return;
    const c = charOf(S, A.char);
    const L = charLayout(S, c);
    const kk = ((H * clamp(S.style.body.head * C.headK, C.headMin, C.headMax)) / L.headH) * (1 + C.push * k);
    const x = W * C.x,
      y = H * C.y - L.headCy * kk;
    g.save();
    g.translate(x, y);
    g.scale(kk, kk);
    drawPuppet(g, S, Object.assign({}, A, { pose: K.CLOSE_KEEP.indexOf(A.pose) >= 0 ? A.pose : K.S.IDLE, face: A.face === K.S.BACK ? K.S.FRONT : A.face, talk: speechLevel(F, A, t) }), t, { tint: 1 });
    g.restore();
  }
  function drawShadow(g, ctx, S, F, t) {
    const W = ctx.W,
      H = ctx.H,
      D = K.SHADOW;
    const V = blurredSet(g, ctx, S, F, 1.08, 0, null);
    const A = (F.actors || [])[0];
    if (!A) return;
    const L = charLayout(S, charOf(S, A.char));
    const wall = V && V.wall && V.wall < H ? V.wall : null;
    const grow = S.motion ? 1 + D.grow * ME.puppetCameraProgress(F, t) : 1;
    const fl = 1;
    const kk = ((wall ? wall * D.wallFill : H * D.h) * grow) / L.total;
    g.save();
    if (wall) {
      g.beginPath();
      g.rect(0, 0, W, wall);
      g.clip();
    }
    g.translate(W * D.x, wall ? wall + L.total * kk * D.sink : H * D.base);
    g.scale(kk, kk);
    drawSilhouette(g, S, Object.assign({}, A, { expr: K.S.NEUTRAL, talk: 0 }), t, { tint: 1 }, K.SIL.color, D.alpha * fl, K.SIL.soft * H);
    g.restore();
    if ((F.actors || [])[1]) puppetAt(g, S, F.actors[1], F, t, W * D.figX, H * 0.95, H * D.figH, 1);
  }
  function drawSplit(g, ctx, S, F, t, k) {
    const W = ctx.W,
      H = ctx.H,
      P = K.SPLIT;
    const acts = F.actors || [];
    const other = F.light2 || (K.NIGHT_RE.test(String(F.light || K.EMPTY)) ? K.S.DAY : K.S.NIGHT);
    const halves = [Object.assign({}, F, { shot: K.S.PEOPLE, actors: [Object.assign({}, acts[0], { x: 0.5 })] }), Object.assign({}, F, { shot: K.S.PEOPLE, set: F.set2 || F.set, light: other, actors: [Object.assign({}, acts[1] || acts[0], { x: 0.5 })] })];
    halves.forEach((h, i) => {
      g.save();
      g.beginPath();
      g.rect((i * W) / 2, 0, W / 2, H);
      g.clip();
      drawStage(g, Object.assign({}, ctx, { W: W / 2, H, ox: (i * W) / 2 }), S, h, t, k);
      g.restore();
    });
    g.fillStyle = P.color;
    g.fillRect(W / 2 - (H * P.line) / 2, 0, H * P.line, H);
  }
  function drawInset(g, ctx, S, F, t) {
    const W = ctx.W,
      H = ctx.H,
      P = K.INSET;
    const set = setFor(S, { set: F.inset, light: F.insetLight || F.light });
    if (!set) return;
    const x = W * P.x,
      y = H * P.y,
      r = H * P.r;
    g.save();
    g.lineCap = K.ROUND;
    g.strokeStyle = P.rim;
    g.lineWidth = H * P.ring * 0.9;
    g.beginPath();
    g.moveTo(x + r * 0.7, y + r * 0.7);
    g.lineTo(x + r * 0.7 + H * P.handle, y + r * 0.7 + H * P.handle);
    g.stroke();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.save();
    g.clip();
    const sc = ((r * 2) / K.SET_H) * P.zoom;
    drawSetLayer(g, S, set, K.S.MAIN, x - (K.SET_W * sc) / 2, y - (K.SET_H * sc) / 2, K.SET_W * sc, K.SET_H * sc, null);
    if (darkWanted({ light: F.insetLight || F.light }, set)) {
      g.globalCompositeOperation = K.MULTIPLY;
      g.fillStyle = K.S.DUSK;
      g.fillRect(x - r, y - r, r * 2, r * 2);
      g.globalCompositeOperation = K.SOURCE_OVER;
    }
    g.restore();
    g.strokeStyle = P.metal;
    g.lineWidth = H * P.ring;
    g.stroke();
    g.restore();
  }
  function drawFlashback(g, ctx) {
    const W = ctx.W,
      H = ctx.H,
      B = K.FLASHBACK;
    g.save();
    g.fillStyle = B.tint;
    g.globalCompositeOperation = K.MULTIPLY;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = K.SOURCE_OVER;
    g.strokeStyle = B.color;
    g.lineWidth = H * B.width;
    const step = H * B.step;
    g.beginPath();
    for (let x = -H; x < W + H; x += step) {
      g.moveTo(x, H);
      g.lineTo(x + H, 0);
    }
    g.stroke();
    g.restore();
  }
  function drawLurk(g, ctx, S, F, t) {
    const W = ctx.W,
      H = ctx.H,
      P = K.LURK;
    const x = W * (F.overlayX != null ? F.overlayX : P.x),
      y = H * P.y,
      r = H * P.r;
    g.save();
    const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    gr.addColorStop(0, rgba(K.BLACK, 0.97));
    gr.addColorStop(0.7, rgba(K.BLACK, 0.9));
    gr.addColorStop(1, rgba(K.BLACK, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    const ph = S.motion ? (t % P.blinkEvery) / P.blinkEvery : 0.5;
    const open = S.motion && ph > 0.96 ? 0.15 : 1;
    const er = r * 0.07;
    for (const s of [-1, 1]) {
      glow(g, x + s * r * P.gap, y, er * 4, P.glow, 0.6);
      g.fillStyle = P.eye;
      g.beginPath();
      g.ellipse(x + s * r * P.gap, y, er, er * 0.6 * open, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  function drawGhostPeek(g, ctx, S, F, t) {
    if ((F.actors || []).some((a) => charOf(S, a.char).ghost)) return;
    const W = ctx.W,
      H = ctx.H,
      P = K.GHOST_PEEK;
    const chars = S.kit.characters || {};
    const key = Object.keys(chars).find((k) => chars[k].ghost);
    const x = W * (F.overlayX != null ? Math.max(F.overlayX, P.x) : P.x),
      y = H * P.base,
      h = H * P.h;
    g.save();
    if (key) {
      const L = charLayout(S, charOf(S, key));
      g.translate(x, y);
      g.scale(h / L.total, h / L.total);
      drawGhost(g, S, { char: key, pose: K.S.IDLE, expr: K.S.NEUTRAL, face: K.S.FRONT }, t, { tint: 1 });
      g.restore();
      return;
    }
    const fl = 1;
    const hr = h * 0.075,
      hy = y - h + hr * 1.3;
    if (K.FILTER in g) g.filter = K.BLUR(h * 0.008);
    g.globalAlpha = 0.88 * fl;
    g.fillStyle = K.SIL.color;
    g.beginPath();
    g.ellipse(x, hy, hr, hr * 1.2, 0, 0, Math.PI * 2);
    g.moveTo(x - hr * 1.05, hy);
    g.quadraticCurveTo(x - hr * 1.6, y - h * P.hair, x - hr * 1.7, y - h * 0.32);
    g.quadraticCurveTo(x - h * 0.17, y - h * 0.08, x - h * 0.2, y);
    g.lineTo(x + h * 0.2, y);
    g.quadraticCurveTo(x + h * 0.17, y - h * 0.08, x + hr * 1.7, y - h * 0.32);
    g.quadraticCurveTo(x + hr * 1.6, y - h * P.hair, x + hr * 1.05, hy);
    g.closePath();
    g.fill();
    g.filter = K.FILTER_NONE;
    g.fillStyle = P.eye;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + s * hr * 0.38, hy + hr * 0.1, hr * 0.11, hr * 0.06, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  function drawOverlays(g, ctx, S, F, t) {
    const W = ctx.W,
      H = ctx.H,
      u = H / 720;
    const effectTime = S.effects !== false ? t : 0;
    for (const o of F.overlays || []) {
      if (S.effects === false && (o === K.S.RAIN || o === K.S.FOG || o === K.S.DUST || o === K.S.STEAM || o === K.S.SMOKE || o === K.EFFECT.odor)) continue;
      if (o === K.S.RAIN) {
        g.strokeStyle = rgba(K.RAIN, 0.35);
        g.lineWidth = 1.2 * u;
        for (let i = 0; i < 120; i++) {
          const x = ((hash(i * 1.7) + effectTime * 0.08) % 1) * W,
            y = ((hash(i * 3.9) + effectTime * 1.4) % 1) * H;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x - 4 * u, y + 18 * u);
          g.stroke();
        }
      } else if (o === K.S.FOG) {
        for (let i = 0; i < 4; i++) glow(g, ((hash(i * 2.1) + effectTime * 0.01) % 1) * W, H * (0.6 + 0.1 * i), H * 0.6, K.FOG, 0.12);
      } else if (o === K.S.DUST) {
        for (let i = 0; i < 40; i++) {
          g.fillStyle = rgba(K.WHITE, 0.25 * hash(i * 1.3));
          g.beginPath();
          g.arc(((hash(i * 2.7) + effectTime * 0.006) % 1) * W, ((hash(i * 5.3) + effectTime * 0.004) % 1) * H, 1.4 * u, 0, Math.PI * 2);
          g.fill();
        }
      } else if (o === K.S.STEAM || o === K.S.SMOKE || o === K.EFFECT.odor) {
        const V = S.view;
        let x0,
          y0,
          z = 1;
        const source = F.effectSource && S.emitters[F.effectSource];
        if (source) {
          x0 = source.x;
          y0 = source.y;
          z = clamp(source.scale, K.SMOKE_Z[0], K.SMOKE_Z[1]);
        } else if (F.effectSource) continue;
        else if (F.smokeX != null && V && V.sc) {
          x0 = V.ox + F.smokeX * V.sc;
          y0 = V.oy + F.smokeY * V.sc;
          z = clamp((V.sc * K.SET_H) / H, K.SMOKE_Z[0], K.SMOKE_Z[1]);
        } else continue;
        const target = F.effectTarget && (F.effectMode === K.EFFECT.ground ? S.feet[F.effectTarget] : S.targets[F.effectTarget] || S.emitters[F.effectTarget]);
        if (F.effectMode === K.EFFECT.toward && !target) continue;
        g.strokeStyle = rgba(o === K.S.STEAM ? K.STEAM : K.S.SMOKE_COLOR, 0.5);
        g.lineWidth = 3 * u * z;
        for (let j = 0; j < 3; j++) {
          g.beginPath();
          for (let i = 0; i <= K.EFFECT.steps; i++) {
            const spread = i / K.EFFECT.steps;
            let yy = y0 - i * H * K.EFFECT.rise * z;
            let xx = x0 + spread * ((j - 1) * W * K.EFFECT.spread * z + Math.sin(i * 0.8 + effectTime + j) * W * K.EFFECT.sway * z);
            if (F.effectMode === K.EFFECT.toward) {
              const bend = Math.sin(Math.PI * spread) * Math.sin(i * 0.8 + effectTime + j);
              xx = x0 + (target.x - x0) * spread + bend * W * K.EFFECT.sway * z;
              yy = y0 + (target.y - y0) * spread + bend * H * K.EFFECT.sway * z;
            } else if (F.effectMode === K.EFFECT.ground) {
              xx = x0 + (target ? target.x - x0 : W * K.EFFECT.groundWidth * z) * spread + Math.sin(Math.PI * spread) * (j - 1) * W * K.EFFECT.spread * z;
              yy = y0 + (target ? target.y - y0 : 0) * spread + Math.sin(Math.PI * spread) * Math.sin(i + effectTime + j) * H * K.EFFECT.groundSway * z;
            }
            if (i) g.lineTo(xx, yy);
            else g.moveTo(xx, yy);
          }
          g.stroke();
        }
      } else if (o === K.S.GHOST) drawGhostPeek(g, ctx, S, F, S.motion ? t : 0);
      else if (o === K.S.LURK) drawLurk(g, ctx, S, F, S.motion ? t : 0);
      else if (o === K.S.FLASHBACK) drawFlashback(g, ctx);
    }
    const vr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vr.addColorStop(0, rgba(K.BLACK, 0));
    vr.addColorStop(1, rgba(K.BLACK, F.vignette != null ? F.vignette : Math.max(S.style.atmosphere?.vignette || 0, S.style.vignette != null ? S.style.vignette : K.VIGNETTE)));
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
    const W = ctx.W,
      H = ctx.H;
    g.save();
    g.fillStyle = K.BLACK;
    g.beginPath();
    g.rect(0, 0, W, H);
    g.ellipse(W / 2, H / 2, W * 0.75, Math.max(1, H * open), 0, 0, Math.PI * 2, true);
    g.fill(K.EVENODD);
    g.restore();
  }
  function drawFrame(g, ctx, S, F, t) {
    const k = S.camera ? ME.puppetCameraProgress(F, t) : 0;
    S.extend = 0;
    S.emitters = {};
    S.targets = {};
    S.feet = {};
    S.effectContext = g;
    S.view = null;
    g.save();
    if (F.shot === K.S.INSERT && F.prop) drawInsert(g, ctx, S, F, t, k);
    else if (F.shot === K.S.SYMBOL && F.prop) drawSymbol(g, ctx, S, F, t);
    else if (F.shot === K.S.CLOSE && (F.actors || []).length) drawClose(g, ctx, S, F, t, k);
    else if (F.shot === K.S.SHADOW && (F.actors || []).length) drawShadow(g, ctx, S, F, t);
    else if (F.shot === K.S.SPLIT && (F.actors || []).length) drawSplit(g, ctx, S, F, t, k);
    else drawStage(g, ctx, S, F, t, k);
    if (F.inset) drawInset(g, ctx, S, F, t);
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
    const since = t - at.cur.start;
    const transition = ME.puppetTransition(at.prev, at.cur);
    const duration = Math.min((transition && transition.duration) || 0, Math.max(0, at.cur.end - at.cur.start) * K.CAMERA_PACE.transitionShare);
    const changing = duration > 0 && since >= 0 && since < duration;
    const progress = changing ? since / duration : 1;
    const blending = changing && transition.type === K.SAME_SCENE_TRANSITION.type;
    if (blending) {
      const layers = S.transitionLayers || (S.transitionLayers = [ME.makeCanvas(ctx.W, ctx.H), ME.makeCanvas(ctx.W, ctx.H)]);
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.width !== ctx.W || layer.height !== ctx.H) {
          layer.width = ctx.W;
          layer.height = ctx.H;
        }
        const target = layer.getContext(K.CTX2D);
        target.clearRect(0, 0, ctx.W, ctx.H);
        drawFrame(target, ctx, S, i ? at.cur : at.prev, t);
      }
      ME.transitions(transition.type)(g, layers[0], layers[1], progress, ctx.W, ctx.H, transition);
    } else drawFrame(g, ctx, S, changing && progress < 0.5 ? at.prev : at.cur, t);
    if (changing && !blending) {
      g.save();
      g.globalAlpha = ease(progress < 0.5 ? progress * 2 : (1 - progress) * 2);
      g.fillStyle = K.BLACK;
      g.fillRect(0, 0, ctx.W, ctx.H);
      g.restore();
    }
    if (fx && fx.flash && S.effects && !S.kit.renderBehavior) {
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
    }
    return out;
  }
  function bgInit(ctx, bg) {
    const kit = ctx.spec && ctx.spec.kit;
    if (!kit || !bg) return null;
    return { puppet: true, S: { frames: [], style: styleOf(ctx.spec), kit, motion: kit.renderBehavior ? kit.renderBehavior.actors === K.SIMPLE_MOTION : !!kit.motion, effects: !kit.renderBehavior || kit.renderBehavior.sceneEffects !== K.NO_EFFECTS, camera: !kit.renderBehavior || kit.renderBehavior.camera === K.GENTLE_CAMERA }, F: { set: bg.set, light: bg.light || null } };
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
