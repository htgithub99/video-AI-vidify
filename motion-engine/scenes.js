(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const LANES = { back: { y: -128, s: 0.8, order: 0 }, mid: { y: -60, s: 0.9, order: 1 }, front: { y: 0, s: 1, order: 2 }, fore: { y: 70, s: 1.12, order: 3 } };
  ME.LANES = LANES;
  const resolveCharacter = (ctx, who) => {
    if (!who) return ME.registry.characters.man_casual;
    if (typeof who === MT.OBJECT) return who;
    const cast = ctx.cast && ctx.cast[who];
    if (cast) {
      const base = (cast.characterId && (ME.registry.characters[cast.characterId] || (ME.customCharacters && ME.customCharacters[cast.characterId]))) || (cast.character && typeof cast.character === MT.OBJECT ? cast.character : null) || ME.registry.characters.man_casual;
      return Object.assign({}, base, cast.overrides || {}, { colors: Object.assign({}, base.colors || {}, (cast.overrides && cast.overrides.colors) || {}) });
    }
    return ME.registry.characters[who] || (ME.customCharacters && ME.customCharacters[who]) || ME.registry.characters.man_casual;
  };
  ME.resolveCharacter = resolveCharacter;
  const buildMotion = (spec, defX) => {
    const keys = spec.path && spec.path.length ? spec.path.map((k) => [k[0], k[1], k[2] || 0, k[3] || 0]) : [[0, spec.x == null ? defX : spec.x, 0, spec.rot || 0]];
    const f = U.path(keys);
    const N = 240;
    const xs = [],
      dist = [0],
      face = [];
    for (let i = 0; i <= N; i++) xs.push(f(i / N));
    for (let i = 1; i <= N; i++) dist.push(dist[i - 1] + Math.hypot(xs[i][0] - xs[i - 1][0], xs[i][1] - xs[i - 1][1]));
    let last = spec.facing === MT.LEFT || spec.facing === -1 ? -1 : 1;
    for (let i = 0; i <= N; i++) {
      const dx = xs[Math.min(N, i + 1)][0] - xs[Math.max(0, i - 1)][0];
      if (Math.abs(dx) > 0.05) last = dx > 0 ? 1 : -1;
      face.push(last);
    }
    let firstMove = face.findIndex((v, i) => i > 0 && Math.abs(xs[Math.min(N, i + 1)][0] - xs[Math.max(0, i - 1)][0]) > 0.05);
    if (firstMove > 0 && spec.facing == null) for (let i = 0; i < firstMove; i++) face[i] = face[firstMove];
    const moving = dist[N] > 1;
    return {
      at(u) {
        const k = U.clamp(u) * N,
          i = Math.floor(k),
          fr = k - i;
        const a = xs[i],
          b = xs[Math.min(N, i + 1)];
        return { x: U.lerp(a[0], b[0], fr), y: U.lerp(a[1], b[1], fr), rot: U.lerp(a[2], b[2], fr), dist: U.lerp(dist[i], dist[Math.min(N, i + 1)], fr) };
      },
      facing(u, dur) {
        const win = Math.max(1, Math.round((0.25 / Math.max(0.5, dur)) * N));
        const c = Math.round(U.clamp(u) * N);
        let s = 0,
          n = 0;
        for (let i = c - win; i <= c + win; i++) {
          s += face[U.clamp(i, 0, N)];
          n++;
        }
        return s / n;
      },
      moving,
      speedAt(u, dur) {
        const e = 1 / N;
        const a = this.at(u - e),
          b = this.at(u + e);
        return Math.abs(b.dist - a.dist) / (2 * e * Math.max(0.01, dur));
      },
    };
  };
  const evalAnim = (anim, u) => {
    const out = {};
    if (!anim) return out;
    for (const key of Object.keys(anim)) {
      const keys = (anim[key] || []).filter((k) => Array.isArray(k) && k.length >= 2).sort((a, b) => a[0] - b[0]);
      if (!keys.length) continue;
      let v = keys[0][1];
      for (let i = 0; i < keys.length; i++) {
        const [u0, v0] = keys[i];
        if (u < u0) break;
        v = v0;
        const nx = keys[i + 1];
        if (nx && u < nx[0] && typeof v0 === MT.NUMBER && typeof nx[1] === MT.NUMBER) v = U.lerp(v0, nx[1], U.smooth((u - u0) / Math.max(1e-4, nx[0] - u0)));
      }
      out[key] = v;
    }
    return out;
  };
  ME.evalAnim = evalAnim;
  const heldAt = (spec, u) => (spec.hold && (spec.holdFrom == null || u >= spec.holdFrom) && (spec.holdUntil == null || u < spec.holdUntil) ? spec.hold : undefined);
  ME.heldAt = heldAt;
  const actionAt = (spec, u) => {
    if (spec.actions && spec.actions.length) {
      let cur = spec.actions[0][1],
        prev = null,
        start = spec.actions[0][0];
      for (const [au, a] of spec.actions)
        if (u >= au) {
          prev = cur;
          cur = a;
          start = au;
        }
      return { action: cur, prev: prev === cur ? null : prev, since: u - start };
    }
    return { action: spec.action || MT.STAND, prev: null, since: 1 };
  };
  const visibility = (spec, u, dur) => {
    if (!spec.show) return 1;
    const [a, b] = spec.show;
    const f = 0.3 / Math.max(0.5, dur);
    return U.clamp((u - a) / f + 1) * U.clamp((b - u) / f + 1) * (u >= a - f && u <= b + f ? 1 : 0);
  };
  const buildCamera = (p, env, WW, cy0, actorsAt, frameH) => {
    const cam = p.camera || {};
    const yFor = (z) => {
      let y = U.lerp(cy0, -100, U.clamp(1 - 1 / Math.max(1, z)));
      if (frameH) y = Math.max(y, (-0.3 * frameH) / Math.max(1, z));
      return y + (cam.lift || 0);
    };
    const def = { x: cam.x == null ? WW / 2 : cam.x, y: cam.y == null ? null : cam.y, zoom: cam.zoom || 1 };
    const fixY = (r) => (r.y == null || isNaN(r.y) ? Object.assign(r, { y: yFor(r.zoom) }) : r);
    if (cam.keys && cam.keys.length) {
      const hasY = cam.keys.every((k) => k[2] != null);
      const f = U.path(cam.keys.map((k) => [k[0], k[1] == null ? def.x : k[1], k[2] == null ? 0 : k[2], Math.log(k[3] || def.zoom)]));
      return (u) => {
        const r = f(u);
        return fixY({ x: r[0], y: hasY ? r[1] : null, zoom: Math.exp(r[2]) });
      };
    }
    if (cam.follow) {
      const off = cam.offset || 0;
      const z0 = cam.zoom || 1.05;
      return (u) => {
        const a = actorsAt(cam.follow, u);
        const b = actorsAt(cam.follow, Math.max(0, u - 0.04));
        return fixY({ x: (a ? U.lerp(b.x, a.x, 0.5) : def.x) + off, y: def.y, zoom: z0 * (cam.zoomTo ? Math.exp(U.lerp(0, Math.log(cam.zoomTo / z0), U.ease(u))) : 1) });
      };
    }
    const from = Object.assign({}, def, cam.from || {}),
      to = Object.assign({}, from, cam.to || {});
    const move = cam.move || (cam.from || cam.to ? MT.CUSTOM : MT.DRIFT);
    if (move === MT.DRIFT) to.x = from.x + (cam.drift == null ? 60 : cam.drift);
    if (move === MT.PUSH) to.zoom = from.zoom * (cam.amount || 1.18);
    if (move === MT.PULL) {
      from.zoom = def.zoom * (cam.amount || 1.18);
      to.zoom = def.zoom;
    }
    if (move === MT.PAN) to.x = from.x + (cam.distance || 600) * (cam.direction === MT.LEFT ? -1 : 1);
    const ez = cam.ease === MT.LINEAR ? (k) => k : U.smooth;
    return (u) => {
      const k = ez(U.clamp(u));
      return fixY({ x: U.lerp(from.x, to.x, k), y: from.y == null || to.y == null ? null : U.lerp(from.y, to.y, k), zoom: Math.exp(U.lerp(Math.log(from.zoom), Math.log(to.zoom), k)) });
    };
  };
  ME.drawLight = (g, L, t) => {
    const col = L.color || MT.FFF2D0,
      a = L.alpha == null ? 0.5 : L.alpha;
    if (L.type === MT.GLOW) ME.glow(g, L.x, L.y, L.r || 80, col, a);
    else if (L.type === MT.BEAM) ME.cone(g, L.x, L.y, L.angle || 0, L.spread || 0.2, L.len || 500, col, a);
    else if (L.type === MT.LAMP) {
      ME.cone(g, L.x, L.y, PI / 2, 0.42, L.len || 420, col, a);
      ME.glow(g, L.x, L.y + 6, 70, col, Math.min(1, a * 2));
      g.save();
      g.translate(L.x, L.y + (L.len || 420) * 0.98);
      g.scale(1, 0.18);
      ME.glow(g, 0, 0, (L.len || 420) * 0.45, col, a * 0.8);
      g.restore();
    } else if (L.type === MT.RECT) {
      g.fillStyle = C.rgba(col, a);
      g.fillRect(L.x, L.y, L.w, L.h);
      ME.glow(g, L.x + L.w / 2, L.y + L.h / 2, Math.max(L.w, L.h), col, a * 0.5);
    } else if (L.type === MT.SHAFT) {
      g.save();
      g.translate(L.x, L.y);
      g.rotate(L.angle || 0.6);
      const gr = g.createLinearGradient(0, 0, L.len || 600, 0);
      gr.addColorStop(0, C.rgba(col, a));
      gr.addColorStop(1, C.rgba(col, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, -(L.h || 100) / 2);
      g.lineTo(L.len || 600, -(L.h || 100) * 0.8);
      g.lineTo(L.len || 600, (L.h || 100) * 0.8);
      g.lineTo(0, (L.h || 100) / 2);
      g.fill();
      g.restore();
    } else if (L.type === MT.SPARKS) {
      const r = U.rng(Math.floor((t || 0) * 24) + U.strHash(L.seed || MT.S));
      g.strokeStyle = MT.FFE6A8;
      g.lineWidth = 1.6;
      for (let i = 0; i < 14; i++) {
        const ang = -PI / 2 + (r() - 0.5) * 2.6,
          d = 10 + r() * 60;
        g.beginPath();
        g.moveTo(L.p[0], L.p[1]);
        g.lineTo(L.p[0] + Math.cos(ang) * d, L.p[1] + Math.sin(ang) * d + d * d * 0.004);
        g.stroke();
      }
      ME.glow(g, L.p[0], L.p[1], 90, L.color || MT.BFE0FF, 0.65);
    } else if (L.type === MT.RING) {
      g.strokeStyle = C.rgba(col, a);
      g.lineWidth = 3;
      g.beginPath();
      g.arc(L.x, L.y, Math.max(1, L.r || 40), 0, PI * 2);
      g.stroke();
    } else if (L.type === MT.SPARKLE) {
      const k = 0.6 + 0.4 * Math.sin((t || 0) * 5);
      ME.glow(g, L.x, L.y, (L.r || 30) * k, col, a);
      g.strokeStyle = C.rgba(col, a * k);
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(L.x - 14 * k, L.y);
      g.lineTo(L.x + 14 * k, L.y);
      g.moveTo(L.x, L.y - 14 * k);
      g.lineTo(L.x, L.y + 14 * k);
      g.stroke();
    }
  };
  const weather = (g, kind, W, H, t, unit, night) => {
    if (kind === MT.RAIN || kind === MT.STORM) {
      const n = kind === MT.STORM ? 420 : 240;
      g.strokeStyle = night ? MT.RGBA_180_200_230_0_22 : MT.RGBA_220_230_240_0_35;
      g.lineWidth = 1.3 * unit;
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const x = U.hash(i) * W * 1.2 - W * 0.1,
          sp = 0.9 + U.hash(i + 9) * 0.6;
        const y = U.mod(U.hash(i + 3) * H + t * H * 1.6 * sp, H * 1.1) - H * 0.05;
        g.moveTo(x, y);
        g.lineTo(x - 10 * unit, y + 38 * unit * sp);
      }
      g.stroke();
      if (kind === MT.STORM) {
        const cyc = t % 7.3,
          fl = cyc < 0.12 ? 1 - cyc / 0.12 : cyc > 0.25 && cyc < 0.33 ? 0.6 * (1 - (cyc - 0.25) / 0.08) : 0;
        if (fl > 0) {
          g.fillStyle = MF.RGBA_220_230_255(`${fl * 0.35}`);
          g.fillRect(0, 0, W, H);
        }
      }
    } else if (kind === MT.SNOW) {
      g.fillStyle = MT.RGBA_255_255_255_0_8;
      for (let i = 0; i < 260; i++) {
        const sp = 0.4 + U.hash(i + 2) * 0.6;
        const x = U.mod(U.hash(i) * W + Math.sin(t * 0.8 + i) * 30 * unit, W);
        const y = U.mod(U.hash(i + 5) * H + t * 90 * unit * sp, H);
        g.beginPath();
        g.arc(x, y, (1.2 + U.hash(i + 7) * 2.2) * unit, 0, PI * 2);
        g.fill();
      }
    }
  };
  const dust = (g, W, H, t, unit, alpha = 0.35) => {
    g.fillStyle = MF.RGBA_255_236_200(`${alpha}`);
    for (let i = 0; i < 70; i++) {
      const x = U.mod(U.hash(i) * W + Math.sin(t * 0.3 + i) * 40 * unit + t * 6 * unit, W);
      const y = U.mod(U.hash(i + 11) * H - t * 8 * unit * (0.5 + U.hash(i + 4)), H);
      g.globalAlpha = 0.3 + 0.7 * U.hash(i + 3);
      g.beginPath();
      g.arc(x, y, (0.8 + U.hash(i + 2) * 1.6) * unit, 0, PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const fogBand = (g, W, H, yScreen, col, amt, t) => {
    const gr = g.createLinearGradient(0, yScreen - H * 0.35, 0, yScreen + H * 0.15);
    gr.addColorStop(0, C.rgba(col, 0));
    gr.addColorStop(0.6, C.rgba(col, amt));
    gr.addColorStop(1, C.rgba(col, amt * 0.4));
    g.fillStyle = gr;
    g.fillRect(0, yScreen - H * 0.35, W, H * 0.5);
    for (let i = 0; i < 5; i++) {
      const x = U.mod(i * W * 0.3 + t * 20, W * 1.4) - W * 0.2;
      g.save();
      g.translate(x, yScreen - H * 0.05);
      g.scale(1, 0.25);
      ME.glow(g, 0, 0, W * 0.3, col, amt * 0.5);
      g.restore();
    }
  };
  ME.registerTemplate(MT.SCENE, {
    name: MT.CANH_BOI_CANH_NHAN_VAT,
    category: MT.SCENE,
    description: MT.BOI_CANH_2_5D_PARALLAX_NHAN_VAT_HANH,
    init(ctx) {
      const p = ctx.params;
      const env = ME.registry.environments[p.env] || ME.registry.environments.city_street;
      const timeKey = p.time || env.time || MT.DAY;
      const tp = Object.assign({}, ME.TIMES[timeKey] || ME.TIMES.day, p.timeOverrides || {});
      const WW = p.worldWidth || env.width || 3200;
      const base = env.base == null ? -150 : env.base;
      const frameH = ctx.aspect.frameH;
      const ppu = ctx.H / frameH;
      const cy0 = -(ctx.aspect.ground - 0.5) * frameH;
      const dur = Math.max(0.1, ctx.shot.end - ctx.shot.start);
      const actors = (p.actors || []).map((a, i) => ({ spec: a, id: a.id || MT.A + i, ch: resolveCharacter(ctx, a.who || a.character), motion: buildMotion(a, WW * (0.35 + i * 0.12)), lane: LANES[a.lane] || LANES.front }));
      (p.crowds || []).forEach((c, ci) => {
        const n = Math.min(36, Math.max(3, Math.round(Math.sqrt(c.count || 30) * 2.2)));
        const ch = resolveCharacter(ctx, c.who || c.character);
        const r = U.rng(ci * 97 + n);
        const cols = Math.ceil(n / 3);
        for (let k = 0; k < n; k++) {
          const row = Math.floor(k / cols),
            col = k % cols;
          const dx = (col - cols / 2) * 46 + (r() - 0.5) * 14 + row * 18;
          const shift = (path) => path.map((q) => [q[0], q[1] + dx]);
          const spec = Object.assign({}, c, { id: MF.CROWD(`${ci}`, `${k}`), scale: (c.scale || 1) * (0.78 - row * 0.08), phase: r() * 3, path: c.path ? shift(c.path) : undefined, x: c.path ? undefined : (c.x == null ? WW * 0.5 : c.x) + dx });
          actors.push({ spec, id: spec.id, ch, motion: buildMotion(spec, spec.x), lane: LANES[[MT.BACK, MT.MID, MT.FRONT][Math.max(0, [MT.BACK, MT.MID, MT.FRONT].indexOf(c.lane || MT.BACK) - row)]] || LANES.back });
        }
      });
      const items = (env.props ? env.props(WW, tp).filter((it) => !(p.hideEnvProps || []).includes(it.asset)) : []).concat(p.items || []).map((it, i) => ({ spec: it, id: it.id || MT.I + i, def: ME.registry.assets[it.asset], motion: buildMotion(it, WW * 0.5), lane: LANES[it.lane] || LANES.mid }));
      const actorsAt = (id, u) => {
        const a = actors.find((x) => x.id === id) || items.find((x) => x.id === id);
        return a ? a.motion.at(u) : null;
      };
      const cam = buildCamera(p, env, WW, cy0, actorsAt, frameH);
      let zMin = 9,
        zMax = 0,
        xMin = 1e9,
        xMax = -1e9;
      for (let i = 0; i <= 24; i++) {
        const c = cam(i / 24);
        zMin = Math.min(zMin, c.zoom);
        zMax = Math.max(zMax, c.zoom);
        xMin = Math.min(xMin, c.x);
        xMax = Math.max(xMax, c.x);
      }
      zMin = Math.max(0.35, zMin * 0.92);
      const sky = ME.makeCanvas(ctx.W, ctx.H);
      {
        const sg = sky.getContext(MT.VALUE_2D);
        if (env.sky) env.sky(sg, ctx.W, ctx.H, tp, p);
        else {
          const gr = sg.createLinearGradient(0, 0, 0, ctx.H * ctx.aspect.ground);
          gr.addColorStop(0, tp.sky[0]);
          gr.addColorStop(0.8, tp.sky[1]);
          gr.addColorStop(1, tp.haze);
          sg.fillStyle = gr;
          sg.fillRect(0, 0, ctx.W, ctx.H);
          if (tp.night) {
            const r = U.rng(99);
            for (let i = 0; i < 300; i++) {
              sg.fillStyle = MF.RGBA_230_236_255(`${(r() * 0.8 + 0.2) * 0.7}`);
              const s = (r() < 0.06 ? 2.4 : 1.3) * ctx.unit;
              sg.fillRect(r() * ctx.W, r() * ctx.H * 0.6, s, s);
            }
            if (p.moon !== false && !env.ownMoon) {
              sg.save();
              sg.translate(ctx.W * 0.78, ctx.H * 0.2);
              sg.scale(ctx.unit, ctx.unit);
              ME.registry.assets.moon.draw(sg, {});
              sg.restore();
            }
          } else if (timeKey === MT.DAY && p.clouds !== false) {
            for (let i = 0; i < 4; i++) {
              sg.save();
              sg.translate(ctx.W * (0.1 + i * 0.27), ctx.H * (0.12 + (i % 2) * 0.08));
              sg.scale(ctx.unit * 0.9, ctx.unit * 0.6);
              ME.registry.assets.cloud.draw(sg, { seed: i, alpha: 0.75 });
              sg.restore();
            }
          }
        }
      }
      const layers = (env.layers || []).map((L) => {
        const d = L.depth;
        const zl0 = 1 + (zMin - 1) * d,
          zl1 = 1 + (zMax - 1) * d;
        const halfV = ctx.W / 2 / (ppu * zl0) + 200;
        const xa = Math.min(xMin * d, 0) - halfV,
          xb = Math.max(xMax * d, WW * d) + halfV;
        const top = base - (L.top || 1500),
          bottom = base + 60;
        let res = ppu * Math.max(1, zl1) * (ctx.quality.layerScale || 1) * (L.blur ? 0.6 : 1);
        const maxW = 12000,
          maxArea = 60e6;
        res = Math.min(res, maxW / (xb - xa), Math.sqrt(maxArea / ((xb - xa) * (bottom - top))));
        const cv = ME.makeCanvas((xb - xa) * res, (bottom - top) * res);
        const lg = cv.getContext(MT.VALUE_2D);
        lg.scale(res, res);
        lg.translate(-xa, -top + base);
        try {
          L.draw(lg, xa, xb, tp, p);
        } catch (e) {
          if (typeof console !== MT.UNDEFINED) console.warn(MT.MOTION_LAYER, e);
        }
        let img = cv;
        if (L.blur && ctx.quality.layerScale > 0) {
          img = ME.makeCanvas(cv.width, cv.height);
          const bg = img.getContext(MT.VALUE_2D);
          bg.filter = MF.BLUR_PX(`${(L.blur * res).toFixed(1)}`);
          bg.drawImage(cv, 0, 0);
        }
        return { d, xa, xb, top, bottom, img };
      });
      const lane = ME.makeCanvas(ctx.W, ctx.H);
      return { env, tp, timeKey, WW, base, ppu, cy0, cam, actors, items, layers, sky, lane, dur, staticLights: env.lightsStatic ? env.lightsStatic(WW, tp) : [] };
    },
    draw(g, ctx) {
      const S = ctx.state,
        p = ctx.params;
      const { tp, ppu, cy0, WW, dur } = S;
      const W = ctx.W,
        H = ctx.H;
      const u = ctx.u,
        t = ctx.t;
      let c = S.cam(u);
      const z = Math.max(c.zoom, W / (ppu * WW));
      const halfV = W / 2 / (ppu * z);
      c = { x: U.clamp(c.x, halfV, WW - halfV), y: c.y, zoom: z };
      const cam = p.camera || {};
      if (cam.handheld || cam.shake) {
        const hh = (cam.handheld || 0) * 6 + (cam.shake || 0) * 22 * Math.max(0, 1 - ((t - (cam.shakeAt || 0) * dur) % 999) / 0.6) * (t >= (cam.shakeAt || 0) * dur ? 1 : 0);
        c.x += U.fbm(t * 0.7, 1) * hh;
        c.y += U.fbm(t * 0.6, 5) * hh * 0.7;
      }
      g.drawImage(S.sky, 0, 0);
      for (const L of S.layers) {
        const zl = 1 + (c.zoom - 1) * L.d;
        const k = ppu * zl;
        const dx = W / 2 + (L.xa - c.x * L.d) * k;
        const dy = H / 2 + (L.top - cy0 - (c.y - cy0) * L.d) * k;
        g.drawImage(L.img, dx, dy, (L.xb - L.xa) * k, (L.bottom - L.top) * k);
      }
      if (tp.night || S.timeKey === MT.DUSK) {
        const gy = H / 2 + (S.base - c.y) * ppu * c.zoom;
        fogBand(g, W, H, gy, tp.haze, tp.night ? 0.18 : 0.12, t);
      }
      const k = ppu * c.zoom;
      const world = () => g.setTransform(k, 0, 0, k, W / 2 - c.x * k, H / 2 - c.y * k);
      const x0 = c.x - W / 2 / k - 100,
        x1 = c.x + W / 2 / k + 100;
      const worldBottom = c.y + H / 2 / k + 50;
      g.save();
      world();
      const pA = p.anim ? Object.assign({}, p, evalAnim(p.anim, u)) : p;
      if (S.env.ground) S.env.ground(g, x0, x1, tp, worldBottom, t, pA);
      g.restore();
      if (S.env.category === MT.INTERIOR && tp.night && !(S.env.time && (ME.TIMES[S.env.time] || {}).night)) {
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = C.rgba(tp.ambientColor || MT.VALUE_06080C, Math.min(0.62, (tp.ambient || 0.5) * 1.1));
        g.fillRect(0, 0, W, H);
        g.restore();
      }
      const lights = [];
      const style = p.figureStyle || tp.figure;
      const rim = p.rim === false ? null : p.rim || tp.rim;
      const list = [];
      for (const it of S.items) {
        if (!it.def) continue;
        const vis = visibility(it.spec, u, dur);
        if (vis <= 0) continue;
        const m = it.motion.at(u);
        if (m.x < x0 - 1200 || m.x > x1 + 1200) continue;
        list.push({ kind: MT.ITEM, o: it, m, vis, order: it.lane.order * 1e5 + (it.spec.z || 0) * 100 + m.y });
      }
      for (const a of S.actors) {
        const vis = visibility(a.spec, u, dur);
        if (vis <= 0) continue;
        const m = a.motion.at(u);
        list.push({ kind: MT.ACTOR, o: a, m, vis, order: a.lane.order * 1e5 + (a.spec.z || 0) * 100 + m.y + 50 });
      }
      list.sort((a, b) => a.order - b.order);
      const lg = S.lane.getContext(MT.VALUE_2D);
      const tintAmt = p.ambient == null ? tp.ambient : p.ambient;
      const flushLane = (has) => {
        if (!has) return;
        if (tintAmt > 0.02) {
          lg.save();
          lg.setTransform(1, 0, 0, 1, 0, 0);
          lg.globalCompositeOperation = MT.SOURCE_ATOP;
          lg.fillStyle = C.rgba(tp.ambientColor, tintAmt);
          lg.fillRect(0, 0, W, H);
          lg.restore();
        }
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(S.lane, 0, 0);
        g.restore();
        lg.setTransform(1, 0, 0, 1, 0, 0);
        lg.clearRect(0, 0, W, H);
      };
      lg.setTransform(1, 0, 0, 1, 0, 0);
      lg.clearRect(0, 0, W, H);
      let laneHas = false;
      const drawActor = (target, a, m, vis, extra) => {
        const spec = a.spec;
        const at = actionAt(spec, u);
        const act = ME.registry.actions[at.action] || ME.registry.actions.stand;
        const speed = a.motion.moving ? a.motion.speedAt(u, dur) : 0;
        let phase;
        if (a.motion.moving && act.stride) phase = (m.dist / act.stride) * PI * 2;
        else phase = t * PI * 2 * (spec.cadence || 1);
        let progress = null;
        if (spec.progress) progress = U.clamp(U.inv(spec.progress[0], spec.progress[1], u));
        const opts = { action: at.action, phase: phase + (spec.phase || 0), t: t + (spec.phase || 0), progress, style: spec.style || style, rim: spec.rim === false ? null : rim, lights, shadow: true, hold: heldAt(spec, u), holdScale: spec.holdScale };
        if (at.prev && at.since * dur < 0.35) {
          const pa = ME.registry.actions[at.prev] || act;
          const kk = U.smooth((at.since * dur) / 0.35);
          opts.pose = ME.lerpPose(pa.pose(phase, t, opts), act.pose(phase, t, opts), kk);
        }
        void speed;
        let f;
        if (spec.facing === MT.LEFT || spec.facing === -1) f = -1;
        else if (spec.facing === MT.RIGHT || spec.facing === 1) f = 1;
        else f = a.motion.facing(u, dur);
        if (extra && extra.facing != null) f = extra.facing;
        opts.facing = f;
        target.save();
        target.globalAlpha = vis;
        target.translate(m.x, a.lane.y + (spec.y || 0) + m.y + (extra ? extra.dy : 0));
        const sc = (spec.scale || 1) * a.lane.s * (extra ? extra.scale : 1);
        target.scale(sc, sc);
        if (m.rot) target.rotate(m.rot);
        const nLights = lights.length;
        ME.drawCharacter(target, a.ch, opts);
        target.restore();
        for (let li = nLights; li < lights.length; li++) {
          const L = lights[li];
          if (L.p && L.x == null) {
            L.x = (L.p[0] - (W / 2 - c.x * k)) / k;
            L.y = (L.p[1] - (H / 2 - c.y * k)) / k;
            L.p = [L.x, L.y];
          }
        }
      };
      for (const d of list) {
        if (d.kind === MT.ITEM) {
          const it = d.o,
            spec = it.spec;
          lg.save();
          lg.setTransform(k, 0, 0, k, W / 2 - c.x * k, H / 2 - c.y * k);
          lg.globalAlpha = d.vis;
          const y = it.lane.y + (spec.y || 0) + d.m.y;
          lg.translate(d.m.x, y);
          const sc = (spec.scale || 1) * it.lane.s;
          const f = spec.facing === MT.LEFT || spec.facing === -1 ? -1 : spec.facing === MT.RIGHT || spec.facing === 1 || !it.motion.moving ? 1 : it.motion.facing(u, dur) >= 0 ? 1 : -1;
          lg.scale(sc * f, sc);
          if (d.m.rot) lg.rotate(d.m.rot);
          const o = Object.assign({ t, night: tp.night, distance: d.m.dist, seed: U.strHash(it.id) % 97 }, spec.params || {}, spec.anim ? evalAnim(spec.anim, u) : {});
          if (spec.lights != null) o.lights = spec.lights;
          try {
            it.def.draw(lg, o);
          } catch (e) {
            void e;
          }
          if (it.def.lights) {
            const tr = lg.getTransform();
            for (const L of it.def.lights(o) || []) {
              const wx = (tr.a * L.x + tr.c * L.y + tr.e - (W / 2 - c.x * k)) / k;
              const wy = (tr.b * L.x + tr.d * L.y + tr.f - (H / 2 - c.y * k)) / k;
              const L2 = Object.assign({}, L, { x: wx, y: wy, r: L.r && L.r * sc, len: L.len && L.len * sc, angle: f < 0 && L.angle != null && L.type === MT.BEAM ? PI - L.angle : L.angle });
              lights.push(L2);
            }
          }
          lg.restore();
          laneHas = true;
          if (spec.riders && spec.riders.length) {
            flushLane(laneHas);
            laneHas = false;
            for (const rd of spec.riders) {
              const ch = resolveCharacter(ctx, rd.who || rd.character);
              const seat = (it.def.seat && it.def.seat[rd.seat || MT.DRIVER]) || [0, -80];
              const act = rd.action || (rd.seat === MT.PASSENGER ? MT.RIDE_PASSENGER : it.spec.asset === MT.BICYCLE ? MT.RIDE_BIKE : MT.RIDE_MOTO);
              const pose = (ME.registry.actions[act] || ME.registry.actions.ride_moto).pose(t * 4, t, {});
              const sk = ME.skeleton(ch, pose);
              g.save();
              world();
              g.globalAlpha = d.vis;
              g.translate(d.m.x, y);
              g.scale(sc * f, sc);
              if (d.m.rot) g.rotate(d.m.rot);
              g.translate(seat[0], seat[1] - sk.hip[1] * sk.d.s);
              ME.drawCharacter(g, ch, { action: act, phase: d.m.dist / 40, t, style: rd.style || style, rim, lights, shadow: false });
              g.restore();
            }
          }
        } else {
          flushLane(laneHas);
          laneHas = false;
          g.save();
          world();
          drawActor(g, d.o, d.m, d.vis);
          g.restore();
        }
      }
      flushLane(laneHas);
      if (S.env.front) {
        g.save();
        world();
        S.env.front(g, x0, x1, tp, pA);
        g.restore();
      }
      g.save();
      world();
      g.globalCompositeOperation = MT.LIGHTER;
      for (const L of S.staticLights) if (L.x > x0 - 600 && L.x < x1 + 600) ME.drawLight(g, L, t);
      for (const L of lights) ME.drawLight(g, L, t);
      for (const L of p.lights || []) ME.drawLight(g, L, t);
      g.restore();
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      const fogAmt = p.fog != null ? p.fog : S.env.fog || 0;
      if (fogAmt > 0) fogBand(g, W, H, H / 2 + (-40 - c.y) * k, tp.night ? MT.VALUE_5A6A84 : tp.haze, fogAmt * 0.6, t);
      if (p.weather) weather(g, p.weather, W, H, t, ctx.unit, tp.night);
      if (p.dust || S.env.dust) dust(g, W, H, t, ctx.unit, p.dust || 0.3);
      g.restore();
      for (const lb of p.labels || []) {
        const a0 = (lb.at || 0) * dur,
          a1 = lb.until != null ? lb.until * dur : dur;
        const vis = U.clamp((t - a0) / 0.4) * U.clamp((a1 - t) / 0.4);
        if (vis <= 0) continue;
        let wx = lb.x,
          wy = lb.y == null ? -260 : lb.y;
        if (lb.attach) {
          const am = actorsAt2(S, lb.attach, u);
          if (am) {
            wx = am.x + (lb.dx || 0);
            wy = am.y + (lb.dy == null ? -230 : lb.dy) + (LANES[am.lane] ? LANES[am.lane].y : 0);
          }
        }
        const sx = W / 2 + (wx - c.x) * k,
          sy = H / 2 + (wy - c.y) * k;
        g.save();
        g.globalAlpha = U.smooth(vis);
        const s = 26 * ctx.unit;
        g.font = ME.font(700, s, MT.HEAD);
        const tw = g.measureText(lb.text).width + s * 0.1 * lb.text.length;
        g.fillStyle = MT.RGBA_8_10_14_0_6;
        ME.roundRect(g, sx - tw / 2 - s * 0.5, sy - s * 1.2, tw + s, s * 1.6, s * 0.25);
        g.fill();
        g.strokeStyle = lb.color || MT.FFB070;
        g.lineWidth = 2 * ctx.unit;
        g.beginPath();
        g.moveTo(sx, sy + s * 0.4);
        g.lineTo(sx, sy + s * 1.6);
        g.stroke();
        ME.text(g, lb.text, sx, sy, { size: s, family: MT.HEAD, weight: 700, align: MT.CENTER, tracking: 0.1, shadow: false, color: MT.F2EDE4 });
        g.restore();
      }
    },
  });
  const actorsAt2 = (S, id, u) => {
    const a = S.actors.find((x) => x.id === id) || S.items.find((x) => x.id === id);
    if (!a) return null;
    const m = a.motion.at(u);
    return { x: m.x, y: m.y + (a.spec.y || 0), lane: a.spec.lane || MT.FRONT };
  };
  const bgScene = (ctx, envId, extra) => {
    if (!envId) return null;
    const sub = Object.assign({}, ctx, { params: Object.assign({ env: envId, camera: { move: MT.PUSH, amount: 1.08 } }, extra || {}) });
    return ME.registry.templates.scene.init(sub);
  };
  const drawBg = (g, ctx, st, params, darken = 0.55, blur = 0) => {
    if (ctx.params.bgImage && ME.ILLU && ME.ILLU.draw(g, ctx, ctx.params.bgImage, { move: ctx.params.bgMove || MT.PUSH_IN, focus: ctx.params.bgFocus, fx: MT.DUST })) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = MF.RGBA_4_6_10(`${darken * 0.85}`);
      g.fillRect(0, 0, ctx.W, ctx.H);
      return;
    }
    if (st) {
      void blur;
      ME.registry.templates.scene.draw(g, Object.assign({}, ctx, { state: st, params }));
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = MF.RGBA_4_6_10(`${darken}`);
      g.fillRect(0, 0, ctx.W, ctx.H);
    } else {
      const gr = g.createRadialGradient(ctx.W / 2, ctx.H * 0.45, 0, ctx.W / 2, ctx.H / 2, Math.max(ctx.W, ctx.H) * 0.75);
      gr.addColorStop(0, ctx.params.bgInner || MT.VALUE_1C2433);
      gr.addColorStop(1, ctx.params.bgOuter || MT.VALUE_040609);
      g.fillStyle = gr;
      g.fillRect(0, 0, ctx.W, ctx.H);
      dust(g, ctx.W, ctx.H, ctx.t, ctx.unit, 0.25);
    }
  };
  const accentOf = (ctx) => ctx.params.accent || (ctx.spec && ctx.spec.accent) || MT.FFB070;
  ME.registerTemplate(MT.TITLE, {
    name: MT.TIEU_DE_MO_DAU,
    category: MT.TEXT,
    description: MT.TIEU_DE_LON_CO_HIEU_UNG_CHU_KICKER,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env, camera: { move: MT.PUSH, amount: 1.08 } }, p.envParams || {}), 0.5, 2);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const portrait = H > W;
      const acc = accentOf(ctx);
      const size = (p.size || (portrait ? 118 : 132)) * un;
      const lines = ME.wrap(g, p.title || "", W * (portrait ? 0.86 : 0.8), ME.font(700, size, MT.HEAD));
      const cy = H * (portrait ? 0.44 : 0.5) - ((lines.length - 1) * size * 1.02) / 2;
      if (p.kicker) {
        ME.text(g, String(p.kicker).toUpperCase(), W / 2, cy - size * 0.95, { size: size * 0.2, weight: 700, align: MT.CENTER, tracking: 0.42, color: acc, progress: U.clamp(t / 1.2), shadow: false });
      }
      const lw = W * 0.18 * U.easeOut(U.clamp((t - 0.2) / 1.2));
      g.fillStyle = C.rgba(acc, 0.9);
      g.fillRect(W / 2 - lw / 2, cy - size * 0.8, lw, 2 * un);
      lines.forEach((ln, i) => {
        const k = U.clamp((t - 0.35 - i * 0.25) / 1.1);
        g.save();
        const sc = 1.06 - 0.06 * U.easeOut(k);
        g.translate(W / 2, cy + i * size * 1.02);
        g.scale(sc, sc);
        ME.text(g, ln.toUpperCase(), 0, size * 0.35, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, tracking: 0.03, progress: k, reveal: MT.RISE, shadowBlur: 0.25 });
        g.restore();
      });
      if (p.subtitle) {
        const sy = cy + (lines.length - 1) * size * 1.02 + size * 0.95;
        ME.text(g, p.subtitle, W / 2, sy, { size: size * 0.24, weight: 500, align: MT.CENTER, tracking: 0.08, color: MT.E6DFD2, progress: U.clamp((t - 1.1) / 1.2) });
      }
    },
  });
  ME.registerTemplate(MT.CHAPTER, {
    name: MT.THE_CHUONG,
    category: MT.TEXT,
    description: MT.SO_CHUONG_TEN_CHUONG,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env }, p.envParams || {}), 0.62, 3);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const portrait = H > W;
      const x = portrait ? W * 0.1 : W * 0.12,
        y = H * (portrait ? 0.46 : 0.52);
      const n = String(p.number == null ? "" : p.number).padStart(2, MT.VALUE_0);
      g.save();
      g.globalAlpha = 0.9 * U.clamp(t / 0.8);
      g.font = ME.font(700, 300 * un, MT.HEAD);
      g.lineWidth = 2 * un;
      g.strokeStyle = C.rgba(acc, 0.85);
      g.strokeText(n, x - 10 * un, y - 20 * un);
      g.restore();
      const bw = 6 * un;
      g.fillStyle = acc;
      g.fillRect(x, y + 20 * un, bw, 120 * un * U.easeOut(U.clamp((t - 0.3) / 0.6)));
      ME.text(g, String(p.label || MT.CHUONG).toUpperCase() + MT.SYMBOL_3 + n, x + 30 * un, y + 52 * un, { size: 26 * un, weight: 700, tracking: 0.35, color: acc, progress: U.clamp((t - 0.3) / 1), shadow: false });
      const lines = ME.wrap(g, p.title || "", W * 0.75, ME.font(700, 72 * un, MT.HEAD));
      lines.forEach((ln, i) => ME.text(g, ln.toUpperCase(), x + 30 * un, y + (125 + i * 76) * un, { size: 72 * un, family: MT.HEAD, weight: 700, tracking: 0.02, progress: U.clamp((t - 0.5 - i * 0.2) / 1.1), reveal: MT.RISE }));
    },
  });
  ME.registerTemplate(MT.QUOTE, {
    name: MT.TRICH_DAN_CAU_NOI,
    category: MT.TEXT,
    description: MT.CAU_TRICH_DAN_LON_KIEU_SERIF_TU_KHOA,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env }, p.envParams || {}), 0.62, 3);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const portrait = H > W;
      const size = (p.size || (portrait ? 64 : 66)) * un;
      const font = ME.font(700, size, MT.SERIF, MT.ITALIC);
      const lines = ME.wrap(g, MT.SYMBOL_11 + (p.text || "") + MT.SYMBOL_12, W * (portrait ? 0.82 : 0.7), font);
      const hl = (p.highlight || []).map((w) => String(w).toLowerCase());
      const lh = size * 1.32;
      const y0 = H / 2 - ((lines.length - 1) * lh) / 2;
      let wi = 0;
      const totalWords = lines.join(MT.SYMBOL_3).split(/\s+/).length;
      const per = Math.max(0.6, ctx.dur * 0.6) / totalWords;
      g.save();
      g.font = font;
      g.textBaseline = MT.MIDDLE;
      lines.forEach((ln, li) => {
        const words = ln.split(/\s+/);
        const widths = words.map((w) => g.measureText(w + MT.SYMBOL_3).width);
        let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
        words.forEach((w, i) => {
          const k = U.clamp((t - 0.3 - wi * per) / 0.5);
          wi++;
          const clean = w.toLowerCase().replace(/[“”".,!?;:]/g, "");
          g.globalAlpha = U.easeOut(k);
          g.fillStyle = hl.includes(clean) ? acc : MT.F3EEE4;
          g.shadowColor = MT.RGBA_0_0_0_0_6;
          g.shadowBlur = size * 0.3;
          g.fillText(w, x, y0 + li * lh + (1 - U.easeOut(k)) * size * 0.3);
          x += widths[i];
        });
      });
      g.restore();
      if (p.author) ME.text(g, MT.SYMBOL_13 + p.author, W / 2, y0 + lines.length * lh + size * 0.2, { size: size * 0.36, weight: 600, align: MT.CENTER, tracking: 0.18, color: acc, progress: U.clamp((t - 0.3 - totalWords * per) / 1) });
    },
  });
  ME.registerTemplate(MT.STATS, {
    name: MT.SO_LIEU_DEM_LEN,
    category: MT.INFOGRAPHIC,
    description: MT.VALUE_1_4_CON_SO_LON_CHAY_DEM_8,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env }, p.envParams || {}), 0.66, 4);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const items = (p.items || []).slice(0, 4);
      const portrait = H > W;
      const n = items.length || 1;
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * (portrait ? 0.16 : 0.2), { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      items.forEach((it, i) => {
        const delay = 0.3 + i * (p.stagger == null ? 0.55 : p.stagger);
        const k = U.clamp((t - delay) / (p.countDuration || 1.6));
        const grid = portrait && n > 2;
        const cx = grid ? W * (i % 2 ? 0.72 : 0.28) : portrait ? W / 2 : W * ((i + 0.5) / n),
          cy = grid ? H * (0.36 + Math.floor(i / 2) * 0.2) : portrait ? H * (0.34 + (i + 0.5) * (0.36 / n)) : H * 0.52;
        const val = (it.value || 0) * U.expoOut(k);
        const dec = it.decimals || 0;
        const txt = (it.prefix || "") + (dec ? val.toFixed(dec).replace(MT.SYMBOL_8, MT.SYMBOL_14) : Math.round(val).toLocaleString(MT.VI_VN)) + (it.suffix || "");
        const size = (grid ? 92 : portrait ? 120 : n > 3 ? 110 : 140) * un;
        const a = U.clamp((t - delay) / 0.4);
        g.save();
        g.globalAlpha = a;
        ME.text(g, txt, cx, cy, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, tracking: 0.01 });
        g.fillStyle = C.rgba(acc, 0.9);
        const lw = size * 0.9 * U.easeOut(k);
        g.fillRect(cx - lw / 2, cy + size * 0.2, lw, 3 * un);
        ME.text(g, String(it.label || "").toUpperCase(), cx, cy + size * 0.55, { size: 24 * un, weight: 600, align: MT.CENTER, tracking: 0.22, color: MT.D9D2C6, progress: U.clamp((t - delay - 0.4) / 1) });
        g.restore();
      });
    },
  });
  ME.registerTemplate(MT.COUNTER, {
    name: MT.BO_DEM_NGAY_GIO_DONG_HO,
    category: MT.INFOGRAPHIC,
    description: MT.SO_DEM_LON_KIEU_DONG_HO_DEM_NGAY,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env }, p.envParams || {}), 0.6, 3);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const acc = accentOf(ctx);
      const k = U.clamp((t - 0.3) / Math.max(0.5, ctx.dur - 1.2));
      const from = p.from || 0,
        to = p.to == null ? 100 : p.to;
      const v = U.lerp(from, to, p.ease === MT.LINEAR ? k : U.smooth(k));
      let txt;
      if (p.format === MT.CLOCK) {
        const m = Math.floor(v) % (24 * 60);
        txt = String(Math.floor(m / 60)).padStart(2, MT.VALUE_0) + MT.SYMBOL_15 + String(m % 60).padStart(2, MT.VALUE_0);
      } else txt = String(Math.round(v)).padStart(p.pad || 1, MT.VALUE_0);
      const size = (H > W ? 220 : 240) * un;
      g.save();
      g.font = ME.font(700, size, MT.HEAD);
      g.textAlign = MT.CENTER;
      g.textBaseline = MT.MIDDLE;
      g.fillStyle = MT.RGBA_255_255_255_0_06;
      g.fillText(p.format === MT.CLOCK ? MT.VALUE_88_88 : MT.VALUE_8.repeat(txt.length), W / 2, H * 0.47);
      g.restore();
      ME.text(g, txt, W / 2, H * 0.47 + size * 0.35, { size, family: MT.HEAD, weight: 700, align: MT.CENTER, color: p.color || MT.F6EFE2 });
      if (p.label) ME.text(g, String(p.label).toUpperCase(), W / 2, H * 0.47 + size * 0.8, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.35, color: acc, progress: U.clamp(t / 1) });
      if (p.tick) {
        const pulse = 1 - (t % 1);
        g.fillStyle = C.rgba(acc, 0.5 * pulse);
        g.beginPath();
        g.arc(W / 2, H * 0.47 - size * 0.62, 8 * un, 0, PI * 2);
        g.fill();
      }
    },
  });
  ME.registerTemplate(MT.OBJECT, {
    name: MT.CAN_CANH_DO_VAT,
    category: MT.SCENE,
    description: MT.MOT_DO_VAT_TRUNG_TAM_DUOI_ANH_DEN,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      const gr = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.7);
      gr.addColorStop(0, p.bgInner || MT.VALUE_2A2622);
      gr.addColorStop(1, p.bgOuter || MT.VALUE_050505);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      const ty = H * 0.68;
      const tg = g.createLinearGradient(0, ty, 0, H);
      tg.addColorStop(0, p.surface || MT.VALUE_3A2C22);
      tg.addColorStop(1, MT.VALUE_0B0907);
      g.fillStyle = tg;
      g.fillRect(0, ty, W, H - ty);
      const z = 1 + 0.12 * U.smooth(ctx.u) * (p.push == null ? 1 : p.push);
      const s = (p.scale || 3.2) * un * z;
      g.save();
      g.translate(W / 2, ty + 6 * un);
      g.scale(s, s);
      g.fillStyle = MT.RGBA_0_0_0_0_45;
      g.beginPath();
      g.ellipse(0, 0, 60, 8, 0, 0, PI * 2);
      g.fill();
      const ids = p.assets || [p.asset || MT.ALARM_CLOCK];
      ids.forEach((id, i) => {
        g.save();
        g.translate((i - (ids.length - 1) / 2) * (p.spacing || 90), 0);
        const def = ME.registry.assets[id];
        if (def) def.draw(g, Object.assign({ t }, p.params || {}));
        if (def && def.lights) {
          g.globalCompositeOperation = MT.LIGHTER;
          for (const L of def.lights(Object.assign({ t }, p.params || {})) || []) ME.drawLight(g, L, t);
        }
        g.restore();
      });
      g.restore();
      g.save();
      g.globalCompositeOperation = MT.LIGHTER;
      ME.cone(g, W / 2, -H * 0.1, PI / 2, 0.32, H * 0.95, p.light || MT.FFE7C0, 0.18);
      g.restore();
      if (p.caption) ME.text(g, p.caption, W / 2, H * 0.2, { size: 34 * un, weight: 700, align: MT.CENTER, tracking: 0.25, color: MT.EFE7D8, progress: U.clamp((t - 0.4) / 1.2) });
    },
  });
  const landShape = (seed) => {
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * PI * 2;
      const r = 0.36 + U.fbm(i * 0.21, seed) * 0.12 + 0.05 * Math.sin(a * 3 + seed);
      pts.push([0.5 + Math.cos(a) * r * 1.25, 0.5 + Math.sin(a) * r]);
    }
    return pts;
  };
  ME.registerTemplate(MT.MAP, {
    name: MT.BAN_DO_SO_DO_MINH_HOA,
    category: MT.INFOGRAPHIC,
    description: MT.BAN_DO_SO_DO_KHONG_PHAI_BAN_DO,
    init: (ctx) => ({ land: landShape(ctx.params.seed || 3) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit,
        u = ctx.u;
      const acc = accentOf(ctx);
      g.fillStyle = p.sea || MT.VALUE_0D1B2A;
      g.fillRect(0, 0, W, H);
      const fz = p.focus ? U.smooth(U.inv(p.focus.at || 0.3, (p.focus.at || 0.3) + 0.4, u)) : 0;
      const zoom = U.lerp(1, p.focus ? p.focus.zoom || 2 : 1, fz);
      const fx = p.focus ? U.lerp(0.5, p.focus.x, fz) : 0.5,
        fy = p.focus ? U.lerp(0.5, p.focus.y, fz) : 0.5;
      const S = Math.min(W, H) * 1.05 * zoom;
      const ox = W / 2 - fx * S * (W > H ? 1.3 : 1),
        oy = H / 2 - fy * S;
      const X = (x) => ox + x * S * (W > H ? 1.3 : 1),
        Y = (y) => oy + y * S;
      g.strokeStyle = MT.RGBA_120_160_200_0_08;
      g.lineWidth = 1 * un;
      for (let i = 0; i <= 20; i++) {
        g.beginPath();
        g.moveTo(X(i / 20), 0);
        g.lineTo(X(i / 20), H);
        g.moveTo(0, Y(i / 20));
        g.lineTo(W, Y(i / 20));
        g.stroke();
      }
      const land = p.land || ctx.state.land;
      g.save();
      g.shadowColor = MT.RGBA_0_0_0_0_5;
      g.shadowBlur = 30 * un;
      g.fillStyle = p.landColor || MT.VALUE_2C3A2E;
      g.beginPath();
      land.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
      g.closePath();
      g.fill();
      g.restore();
      g.strokeStyle = MT.RGBA_220_230_200_0_35;
      g.lineWidth = 2 * un;
      g.stroke();
      for (const r of p.regions || []) {
        g.fillStyle = C.rgba(r.color || acc, 0.18 * U.clamp((u - (r.at || 0)) / 0.1));
        g.beginPath();
        r.points.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
        g.closePath();
        g.fill();
      }
      const pts = {};
      (p.points || []).forEach((pt, i) => (pts[pt.id || i] = pt));
      for (const r of p.routes || []) {
        const a = pts[r.from],
          b = pts[r.to];
        if (!a || !b) continue;
        const k = U.clamp(U.inv(r.at || 0.2, (r.at || 0.2) + (r.dur || 0.3), u));
        if (k <= 0) continue;
        const mx = (a.x + b.x) / 2 + (r.bend || 0.06),
          my = (a.y + b.y) / 2 - (r.bend || 0.06);
        g.save();
        g.strokeStyle = r.color || acc;
        g.lineWidth = 3 * un;
        g.setLineDash([12 * un, 9 * un]);
        g.lineDashOffset = -t * 30 * un;
        g.beginPath();
        const N = 40;
        for (let i = 0; i <= N * k; i++) {
          const s = i / N;
          const x = (1 - s) * (1 - s) * a.x + 2 * (1 - s) * s * mx + s * s * b.x,
            y = (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * my + s * s * b.y;
          i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y));
        }
        g.stroke();
        g.restore();
      }
      (p.points || []).forEach((pt) => {
        const k = U.clamp(U.inv(pt.at || 0, (pt.at || 0) + 0.12, u));
        if (k <= 0) return;
        g.save();
        g.translate(X(pt.x), Y(pt.y));
        g.scale(un * 1.3, un * 1.3);
        ME.registry.assets.map_pin.draw(g, { progress: k, color: pt.color || MT.E2483A });
        g.restore();
        if (pt.label) {
          const lx = X(pt.x) + 26 * un,
            ly = Y(pt.y) - 40 * un;
          ME.text(g, pt.label, lx, ly, { size: 30 * un, weight: 700, family: MT.HEAD, tracking: 0.06, progress: k, color: MT.F4EFE6 });
          if (pt.sub) ME.text(g, pt.sub, lx, ly + 30 * un, { size: 20 * un, weight: 500, tracking: 0.08, progress: k, color: MT.C9C2B6 });
        }
      });
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W * 0.06, H * 0.12, { size: 34 * un, family: MT.HEAD, weight: 700, tracking: 0.1, progress: U.clamp(t / 1) });
      ME.text(g, p.note || MT.SO_DO_MINH_HOA, W * 0.94, H * 0.94, { size: 18 * un, weight: 500, align: MT.RIGHT, tracking: 0.2, color: MT.RGBA_230_230_230_0_6, shadow: false });
      g.save();
      g.translate(W * 0.92, H * 0.14);
      g.strokeStyle = MT.RGBA_240_235_225_0_6;
      g.lineWidth = 2 * un;
      g.beginPath();
      g.arc(0, 0, 28 * un, 0, PI * 2);
      g.stroke();
      ME.text(g, MT.N, 0, -36 * un, { size: 18 * un, weight: 700, align: MT.CENTER, shadow: false, color: MT.RGBA_240_235_225_0_8 });
      g.restore();
    },
  });
  ME.registerTemplate(MT.TIMELINE, {
    name: MT.DONG_THOI_GIAN,
    category: MT.INFOGRAPHIC,
    description: MT.CAC_MOC_THOI_GIAN_CHAY_LAN_LUOT_NAM,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit,
        u = ctx.u;
      drawBg(g, ctx, null, {}, 0, 0);
      const acc = accentOf(ctx);
      const ev = p.events || [];
      const n = ev.length || 1;
      const portrait = H > W;
      const prog = U.clamp(u * 1.15);
      if (p.title) ME.text(g, String(p.title).toUpperCase(), W / 2, H * 0.14, { size: 30 * un, weight: 700, align: MT.CENTER, tracking: 0.3, color: acc, progress: U.clamp(t / 1) });
      g.strokeStyle = MT.RGBA_255_255_255_0_18;
      g.lineWidth = 3 * un;
      g.beginPath();
      if (portrait) {
        g.moveTo(W * 0.2, H * 0.22);
        g.lineTo(W * 0.2, H * 0.9);
      } else {
        g.moveTo(W * 0.08, H * 0.52);
        g.lineTo(W * 0.92, H * 0.52);
      }
      g.stroke();
      g.strokeStyle = acc;
      g.beginPath();
      if (portrait) {
        g.moveTo(W * 0.2, H * 0.22);
        g.lineTo(W * 0.2, H * (0.22 + 0.68 * prog));
      } else {
        g.moveTo(W * 0.08, H * 0.52);
        g.lineTo(W * (0.08 + 0.84 * prog), H * 0.52);
      }
      g.stroke();
      ev.forEach((e, i) => {
        const pos = (i + 0.5) / n;
        const k = U.clamp((prog - pos * 0.98) / 0.08);
        const x = portrait ? W * 0.2 : W * (0.08 + 0.84 * pos),
          y = portrait ? H * (0.22 + 0.68 * pos) : H * 0.52;
        g.fillStyle = k > 0 ? acc : MT.RGBA_255_255_255_0_3;
        g.beginPath();
        g.arc(x, y, (8 + 4 * U.back(k)) * un, 0, PI * 2);
        g.fill();
        if (k <= 0) return;
        const up = !portrait && i % 2 === 0;
        const tx = portrait ? x + 40 * un : x,
          ty = portrait ? y + 12 * un : up ? y - 60 * un : y + 90 * un;
        ME.text(g, e.label || "", tx, ty, { size: 46 * un, family: MT.HEAD, weight: 700, align: portrait ? MT.LEFT : MT.CENTER, progress: k, reveal: MT.RISE });
        const lines = ME.wrap(g, e.text || "", portrait ? W * 0.68 : (W * 0.84) / n - 20 * un, ME.font(500, 22 * un));
        lines.slice(0, 3).forEach((ln, j) => ME.text(g, ln, tx, ty + (34 + j * 28) * un, { size: 22 * un, weight: 500, align: portrait ? MT.LEFT : MT.CENTER, color: MT.D8D1C4, progress: k }));
      });
    },
  });
  ME.registerTemplate(MT.HEADLINE, {
    name: MT.TIT_BAO_MINH_HOA,
    category: MT.INFOGRAPHIC,
    description: MT.TRANG_BAO_MINH_HOA_CHUNG_CHUNG_KHONG_GIA,
    init: () => ({}),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      g.fillStyle = MT.VALUE_0A0A0A;
      g.fillRect(0, 0, W, H);
      const k = U.easeOut(U.clamp(t / 1.2));
      const pw = Math.min(W, H / 1.3) * 0.82,
        ph = pw * 1.3;
      const push = U.smooth(U.clamp((ctx.u - 0.25) / 0.75));
      g.save();
      g.translate(W / 2, H / 2 + ph * 0.17 * push);
      g.rotate((1 - k) * 0.5 - 0.04 * (1 - push * 0.5));
      const sc = (0.35 + 0.65 * k) * (1 + 0.2 * push);
      g.scale(sc, sc);
      g.shadowColor = MT.RGBA_0_0_0_0_6;
      g.shadowBlur = 40 * un;
      g.fillStyle = MT.ECE5D3;
      g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.shadowBlur = 0;
      const pad = pw * 0.06;
      ME.text(g, (p.paper || MT.LE_QUOTIDIEN).toUpperCase(), 0, -ph / 2 + pad * 1.9, { size: pw * 0.085, family: MT.SERIF, weight: 700, align: MT.CENTER, color: MT.VALUE_151515, shadow: false });
      g.fillStyle = MT.VALUE_151515;
      g.fillRect(-pw / 2 + pad, -ph / 2 + pad * 2.3, pw - pad * 2, 2 * un);
      if (p.date) ME.text(g, p.date, 0, -ph / 2 + pad * 2.9, { size: pw * 0.022, weight: 600, align: MT.CENTER, color: MT.VALUE_333, shadow: false, tracking: 0.2 });
      const lines = ME.wrap(g, (p.headline || "").toUpperCase(), pw - pad * 2, ME.font(700, pw * 0.1, MT.HEAD));
      lines.slice(0, 3).forEach((ln, i) => ME.text(g, ln, 0, -ph / 2 + pad * 4.6 + i * pw * 0.105, { size: pw * 0.1, family: MT.HEAD, weight: 700, align: MT.CENTER, color: MT.VALUE_111, shadow: false }));
      const yb = -ph / 2 + pad * 4.6 + lines.length * pw * 0.105;
      if (p.sub) ME.text(g, p.sub, 0, yb + pw * 0.01, { size: pw * 0.035, family: MT.SERIF, weight: 700, style: MT.ITALIC, align: MT.CENTER, color: MT.VALUE_2A2A2A, shadow: false });
      g.fillStyle = MT.VALUE_6A6A6A;
      g.fillRect(-pw / 2 + pad, yb + pw * 0.05, pw * 0.42, ph * 0.3);
      for (let i = 0; i < 18; i++) g.fillRect(pw * 0.02, yb + pw * 0.05 + i * ph * 0.017, pw * 0.42 - pad, 2 * un);
      g.restore();
    },
  });
  ME.registerTemplate(MT.ENDING, {
    name: MT.KET_THUC,
    category: MT.TEXT,
    description: MT.CAU_KET_CHAM_VA_TOI_DAN,
    init: (ctx) => ({ bg: bgScene(ctx, ctx.params.env, ctx.params.envParams) }),
    draw(g, ctx) {
      const p = ctx.params,
        W = ctx.W,
        H = ctx.H,
        t = ctx.t,
        un = ctx.unit;
      drawBg(g, ctx, ctx.state.bg, Object.assign({ env: p.env }, p.envParams || {}), 0.55, 2);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const size = (H > W ? 54 : 58) * un;
      const lines = ME.wrap(g, p.text || "", W * 0.74, ME.font(700, size, MT.SERIF, MT.ITALIC));
      lines.forEach((ln, i) => ME.text(g, ln, W / 2, H / 2 + (i - (lines.length - 1) / 2) * size * 1.3, { size, family: MT.SERIF, weight: 700, style: MT.ITALIC, align: MT.CENTER, progress: U.clamp((t - 0.4 - i * 0.6) / 1.6), reveal: MT.FADE }));
      if (p.sub) ME.text(g, String(p.sub).toUpperCase(), W / 2, H / 2 + (lines.length / 2 + 0.8) * size * 1.3, { size: 22 * un, weight: 600, align: MT.CENTER, tracking: 0.35, color: accentOf(ctx), progress: U.clamp((t - 1.5) / 1.5) });
    },
  });
  ME.sceneKit = { buildMotion, actionAt, visibility, buildCamera, weather, dust, fogBand, LANES, resolveCharacter, evalAnim, heldAt };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
