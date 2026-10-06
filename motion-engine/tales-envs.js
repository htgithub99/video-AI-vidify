(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const T = ME.TOON;
  if (!T) return;
  const K = T.kit;
  const C = ME.color;
  const PI = Math.PI;
  const U = ME.util;
  const { paint, rect, rrect, ell, poly, stroke, glowDisc, P } = K;
  const TALES = (ME.TALES = ME.TALES || { characters: [], assets: [], envs: [] });
  const has = (id) => !!(id && ME.registry.assets[id]);
  const pick = (...ids) => ids.find(has) || null;
  const A = (g, id, x, y, o, s) => {
    const a = ME.registry.assets[id];
    if (ME.__recordAssets && id) ME.__recordAssets.add(id);
    if (!a) return false;
    g.save();
    g.translate(x, y);
    if (s && s !== 1) g.scale(s, s);
    try {
      a.draw(g, o || {});
    } catch (e) {
      void e;
    }
    g.restore();
    return true;
  };
  const put = (g, id, x, y, o, s, fb) => {
    if (A(g, id, x, y, o, s)) return;
    if (!fb) return;
    g.save();
    g.translate(x, y);
    if (s && s !== 1) g.scale(s, s);
    fb(g);
    g.restore();
  };
  const isN = (tp) => !!tp.night;
  const isD = (tp) => !tp.night && tp.ambient > 0.15 && tp.ambient < 0.4;
  const ts = (tp, d, k, n) => (isN(tp) ? n : isD(tp) ? k : d);
  const nt = (col, tp, k) => (isN(tp) ? C.mix(col, MT.VALUE_0A1226, k == null ? 0.62 : k) : isD(tp) ? C.mix(col, MT.VALUE_4A2A4A, (k == null ? 0.62 : k) * 0.42) : col);
  const haze = (tp) => ts(tp, MT.C8D6E0, MT.C98A7A, MT.VALUE_2A3550);
  const far = (col, tp, k) => C.mix(nt(col, tp), haze(tp), k);
  const H2 = (x, s) => U.hash(Math.floor(x) * 7 + (s || 0) * 131);
  const spread = (x0, x1, step, off, fn) => {
    for (let x = Math.floor((x0 - off) / step) * step + off; x < x1 + step; x += step) fn(x, H2(x, step));
  };
  const props = (list) => list.filter((p) => p && p.asset && has(p.asset));
  const mid = (x0, x1) => (x0 + x1) / 2;
  const fill = (g, p, col) => {
    g.fillStyle = col;
    g.fill(p);
  };
  const box = (g, x, y, w, h, col, o) => paint(g, rect(x, y, w, h), col, Object.assign({ d: 0, lw: 1.4 }, o || {}));
  const flat = (g, x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const vgrad = (g, x, y, w, h, stops) => {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  };
  const stars = (g, W, H, n, u, seed) => {
    const r = U.rng(seed || 41);
    for (let i = 0; i < n; i++) {
      g.globalAlpha = 0.25 + r() * 0.6;
      g.fillStyle = MT.F4F2FF;
      const s = (r() < 0.07 ? 2.6 : 1.3) * u;
      g.fillRect(r() * W, r() * H, s, s);
    }
    g.globalAlpha = 1;
  };
  const moonDisc = (g, x, y, r, col, glowA) => {
    glowDisc(g, x, y, r * 6, col, glowA == null ? 0.22 : glowA);
    glowDisc(g, x, y, r * 2.2, col, 0.35);
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, C.mix(col, MT.FFFFFF, 0.5));
    gr.addColorStop(1, col);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, PI * 2);
    g.fill();
    g.fillStyle = C.rgba(C.shade(col, -0.25), 0.35);
    [
      [-0.3, -0.2, 0.22],
      [0.25, 0.1, 0.16],
      [-0.05, 0.4, 0.12],
      [0.35, -0.35, 0.09],
    ].forEach((c) => {
      g.beginPath();
      g.arc(x + c[0] * r, y + c[1] * r, c[2] * r, 0, PI * 2);
      g.fill();
    });
  };
  const wisps = (g, W, H, u, col, a, seed, y0, y1) => {
    const r = U.rng(seed);
    for (let i = 0; i < 9; i++) {
      const x = r() * W,
        y = H * (y0 + r() * (y1 - y0)),
        w = (180 + r() * 320) * u;
      g.save();
      g.translate(x, y);
      g.scale(1, 0.14 + r() * 0.08);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, w);
      gr.addColorStop(0, C.rgba(col, a));
      gr.addColorStop(0.6, C.rgba(col, a * 0.5));
      gr.addColorStop(1, C.rgba(col, 0));
      g.fillStyle = gr;
      g.fillRect(-w, -w, w * 2, w * 2);
      g.restore();
    }
  };
  const puffs = (g, W, H, u, col, a, seed, n) => {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W,
        y = H * (0.08 + r() * 0.3),
        s = (0.6 + r() * 0.7) * u;
      g.globalAlpha = a;
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y, 110 * s, 34 * s, 0, 0, PI * 2);
      g.ellipse(x - 50 * s, y + 6 * s, 60 * s, 26 * s, 0, 0, PI * 2);
      g.ellipse(x + 30 * s, y - 20 * s, 58 * s, 38 * s, 0, 0, PI * 2);
      g.ellipse(x + 80 * s, y + 4 * s, 50 * s, 22 * s, 0, 0, PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const mkSky = (cfg) => (g, W, H, tp) => {
    const n = isN(tp),
      d = isD(tp);
    const st = n ? cfg.night : d ? cfg.dusk : cfg.day;
    const gr = g.createLinearGradient(0, 0, 0, H * (cfg.span || 0.72));
    st.forEach((c, i) => gr.addColorStop(i / (st.length - 1), c));
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    const u = Math.min(W, H) / 1080;
    if (n) {
      stars(g, W, H * 0.6, cfg.stars == null ? 170 : cfg.stars, u, cfg.seed || 41);
      if (cfg.moon !== false) moonDisc(g, W * (cfg.mx || 0.76), H * (cfg.my || 0.19), (cfg.mr || 62) * u, cfg.moonCol || MT.F2EED6, cfg.moonGlow);
      if (cfg.wisp !== false) wisps(g, W, H, u, cfg.wispCol || MT.VALUE_3A4766, 0.75, cfg.seed || 5, 0.1, 0.4);
    } else if (d) {
      glowDisc(g, W * 0.7, H * 0.6, H * 0.6, MT.FFB070, 0.45);
      g.fillStyle = MT.FFD59A;
      g.beginPath();
      g.arc(W * 0.7, H * 0.6, 46 * u, 0, PI * 2);
      g.fill();
      wisps(g, W, H, u, MT.VALUE_6A3A5A, 0.6, cfg.seed || 5, 0.15, 0.5);
    } else {
      if (cfg.sun !== false) {
        glowDisc(g, W * 0.82, H * 0.16, H * 0.4, MT.FFF2C8, 0.5);
        g.fillStyle = MT.FFF6DC;
        g.beginPath();
        g.arc(W * 0.82, H * 0.16, 40 * u, 0, PI * 2);
        g.fill();
      }
      if (cfg.overcast) wisps(g, W, H, u, cfg.overcast, 0.8, cfg.seed || 5, 0.05, 0.45);
      else puffs(g, W, H, u, MT.FFFFFF, 0.75, cfg.seed || 3, cfg.clouds == null ? 5 : cfg.clouds);
    }
  };
  const darkSky = (top, bot) => (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top || MT.VALUE_050507);
    gr.addColorStop(1, bot || MT.VALUE_0D0C0C);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  };
  const mist = (g, x0, x1, y, h, col, a, seed, step) => {
    const st = step || 240;
    spread(x0 - 300, x1 + 300, st, seed || 0, (x, hh) => {
      const rx = st * (1.2 + hh * 0.9),
        ry = h * (0.5 + hh * 0.35);
      g.save();
      g.translate(x + hh * st * 0.5, y + (hh - 0.5) * h * 0.4);
      g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, C.rgba(col, a));
      gr.addColorStop(0.55, C.rgba(col, a * 0.55));
      gr.addColorStop(1, C.rgba(col, 0));
      g.fillStyle = gr;
      g.fillRect(-rx, -rx, rx * 2, rx * 2);
      g.restore();
    });
  };
  const band = (g, x0, x1, y, h, col, a) => {
    const gr = g.createLinearGradient(0, y - h, 0, y + h * 0.4);
    gr.addColorStop(0, C.rgba(col, 0));
    gr.addColorStop(0.7, C.rgba(col, a));
    gr.addColorStop(1, C.rgba(col, a * 0.6));
    g.fillStyle = gr;
    g.fillRect(x0 - 200, y - h, x1 - x0 + 400, h * 1.4);
  };
  const ridge = (g, x0, x1, col, amp, base, seed, o, sc) => {
    const p = P();
    const s = sc || 800;
    p.moveTo(x0 - 100, 80);
    for (let x = x0 - 100; x <= x1 + 160; x += 50) p.lineTo(x, -base - (U.fbm(x / s, seed) * 0.5 + 0.5) * amp);
    p.lineTo(x1 + 160, 80);
    p.closePath();
    paint(g, p, col, Object.assign({ d: 0, lw: 2 }, o || {}));
  };
  const peaks = (g, x0, x1, col, step, hmin, hmax, base, seed, snow) => {
    spread(x0, x1, step, seed, (x, h) => {
      const ht = hmin + h * (hmax - hmin),
        w = step * (0.8 + h * 0.5);
      const p = poly([
        [x - w, -base + 40],
        [x - w * 0.3, -base - ht * 0.7],
        [x - w * 0.08, -base - ht],
        [x + w * 0.15, -base - ht * 0.85],
        [x + w, -base + 40],
      ]);
      paint(g, p, col, { d: 10, lw: 1.6 });
      if (snow)
        paint(
          g,
          poly([
            [x - w * 0.27, -base - ht * 0.72],
            [x - w * 0.08, -base - ht],
            [x + w * 0.15, -base - ht * 0.85],
            [x + w * 0.22, -base - ht * 0.66],
            [x + w * 0.05, -base - ht * 0.74],
            [x - w * 0.1, -base - ht * 0.64],
          ]),
          snow,
          { d: 0, lw: 1.2 },
        );
    });
  };
  const branchPath = (p, x, y, ang, len, w, depth, r, tips, curl) => {
    const bend = (r() - 0.5) * 0.5 * (curl || 1);
    const mx = x + Math.cos(ang + bend) * len * 0.5,
      my = y + Math.sin(ang + bend) * len * 0.5;
    const x2 = x + Math.cos(ang) * len,
      y2 = y + Math.sin(ang) * len;
    const nx = -Math.sin(ang),
      ny = Math.cos(ang);
    const w2 = Math.max(1.2, w * 0.6);
    p.moveTo(x + (nx * w) / 2, y + (ny * w) / 2);
    p.quadraticCurveTo(mx + (nx * (w + w2)) / 4, my + (ny * (w + w2)) / 4, x2 + (nx * w2) / 2, y2 + (ny * w2) / 2);
    p.lineTo(x2 - (nx * w2) / 2, y2 - (ny * w2) / 2);
    p.quadraticCurveTo(mx - (nx * (w + w2)) / 4, my - (ny * (w + w2)) / 4, x - (nx * w) / 2, y - (ny * w) / 2);
    p.closePath();
    if (depth <= 0 || len < 10) {
      if (tips) tips.push([x2, y2, ang]);
      return;
    }
    if (tips && depth <= 2 && r() < 0.5) tips.push([x2, y2, ang]);
    const n = depth > 4 ? 2 : r() < 0.45 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) / 2) * (0.5 + r() * 0.45) + (r() - 0.5) * 0.35;
      branchPath(p, x2, y2, a, len * (0.6 + r() * 0.2), w2, depth - 1, r, tips, curl);
    }
  };
  const deadTree = (g, x, y, h, col, seed, o) => {
    o = o || {};
    const r = U.rng(seed || 1);
    const p = P();
    const tips = [];
    const lean = (r() - 0.5) * 0.3 + (o.lean || 0);
    branchPath(p, x, y + 4, -PI / 2 + lean, h * 0.36, h * (o.thick || 0.075), o.depth || 6, r, tips, o.curl || 1.6);
    for (let i = 0; i < 3; i++) {
      const s = i - 1;
      p.moveTo(x + s * h * 0.02, y - h * 0.06);
      p.quadraticCurveTo(x + s * h * 0.06, y - h * 0.01, x + s * h * 0.11 + (r() - 0.5) * 10, y + 6);
      p.lineTo(x + s * h * 0.01, y + 6);
      p.closePath();
    }
    paint(g, p, col, { d: 0, lw: 1.2 });
    if (o.moss) {
      for (const t of tips) {
        if (r() > 0.6) continue;
        const L = h * (0.05 + r() * 0.12);
        stroke(
          g,
          [
            [t[0], t[1]],
            [t[0] + 6, t[1] + L * 0.5, t[0] + (r() - 0.5) * 8, t[1] + L],
          ],
          o.moss,
          2 + r() * 2,
          false,
        );
      }
    }
    return tips;
  };
  const pine = (g, x, y, h, col, o) => {
    const w = h * 0.34;
    const p = P();
    for (let i = 0; i < 4; i++) {
      const ty = y - h + i * h * 0.2,
        by = ty + h * 0.34,
        ww = w * (0.45 + i * 0.22);
      p.moveTo(x, ty);
      p.lineTo(x + ww, by);
      p.lineTo(x - ww, by);
      p.closePath();
    }
    p.rect(x - h * 0.025, y - h * 0.2, h * 0.05, h * 0.2);
    paint(g, p, col, Object.assign({ d: 0, lw: 1.2 }, o || {}));
  };
  const crow = (g, x, y, s, f) => {
    g.save();
    g.translate(x, y);
    g.scale(s * (f || 1), s);
    const p = P();
    p.ellipse(0, -14, 16, 10, -0.3, 0, PI * 2);
    p.ellipse(13, -24, 7, 7, 0, 0, PI * 2);
    p.moveTo(19, -25);
    p.lineTo(29, -22);
    p.lineTo(19, -21);
    p.moveTo(-12, -10);
    p.lineTo(-30, -4);
    p.lineTo(-26, -14);
    p.closePath();
    paint(g, p, MT.VALUE_0D0D12, { d: 0, lw: 1 });
    g.fillStyle = MT.D8C24A;
    g.fillRect(14, -26, 2.5, 2.5);
    stroke(
      g,
      [
        [-2, -5],
        [-2, 2],
      ],
      MT.VALUE_222,
      1.6,
    );
    stroke(
      g,
      [
        [4, -5],
        [4, 2],
      ],
      MT.VALUE_222,
      1.6,
    );
    g.restore();
  };
  const flame = (g, x, y, s, glowA) => {
    if (glowA !== 0) glowDisc(g, x, y - 8 * s, 46 * s, MT.FFB050, glowA == null ? 0.45 : glowA);
    paint(
      g,
      poly(
        [
          [x, y - 26 * s],
          [x + 7 * s, y - 6 * s],
          [x + 4 * s, y + 2 * s],
          [x - 4 * s, y + 2 * s],
          [x - 7 * s, y - 6 * s],
        ],
        true,
      ),
      MT.FFA53A,
      { d: 0, ink: false },
    );
    paint(g, ell(x, y - 6 * s, 3 * s, 7 * s), MT.FFF1B8, { d: 0, ink: false });
  };
  const candle = (g, x, y, h, s, col) => {
    s = s || 1;
    box(g, x - 5 * s, y - h, 10 * s, h, col || MT.EFE6CC, { d: 2 });
    paint(g, ell(x, y - h + 2, 7 * s, 3 * s), MT.F6EFD8, { d: 0, ink: false });
    flame(g, x, y - h - 2, s * 0.8);
  };
  const candelabra = (g, x, y, s, col) => {
    col = col || MT.B8913A;
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    const p = P();
    p.moveTo(-34, 0);
    p.quadraticCurveTo(0, -18, 34, 0);
    p.closePath();
    p.rect(-4, -120, 8, 110);
    p.moveTo(-60, -110);
    p.quadraticCurveTo(-58, -70, 0, -70);
    p.quadraticCurveTo(58, -70, 60, -110);
    p.lineTo(52, -110);
    p.quadraticCurveTo(50, -78, 0, -78);
    p.quadraticCurveTo(-50, -78, -52, -110);
    p.closePath();
    paint(g, p, col, { d: 2, lw: 1.2 });
    [-56, 0, 56].forEach((cx) => {
      paint(g, rect(cx - 9, -118, 18, 6), col, { d: 0, lw: 1 });
      candle(g, cx, -118, 30, 1, MT.E9E0C4);
    });
    g.restore();
  };
  const cobweb = (g, x, y, r, fx, fy, a) => {
    g.save();
    g.translate(x, y);
    g.scale(fx || 1, fy || 1);
    g.strokeStyle = C.rgba(MT.E8EEF4, a == null ? 0.38 : a);
    g.lineWidth = 1.4;
    g.beginPath();
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const an = (i / n) * (PI / 2);
      g.moveTo(0, 0);
      g.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    for (let k = 1; k <= 5; k++) {
      const rr = (r * k) / 5.4;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * (PI / 2),
          a1 = ((i + 1) / n) * (PI / 2);
        const am = (a0 + a1) / 2;
        g.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
        g.quadraticCurveTo(Math.cos(am) * rr * 0.82, Math.sin(am) * rr * 0.82, Math.cos(a1) * rr, Math.sin(a1) * rr);
      }
    }
    g.stroke();
    g.restore();
  };
  const frame = (g, x, y, w, h, col, inner) => {
    paint(g, rect(x - w / 2, y - h, w, h), col || MT.A07A2A, { d: 4, lw: 1.6 });
    paint(g, rect(x - w / 2 + 12, y - h + 12, w - 24, h - 24), inner || MT.VALUE_2A2420, { d: 0, lw: 1.2 });
  };
  const portrait = (g, x, y, w, h, seed, gold, bg) => {
    frame(g, x, y, w, h, gold || MT.VALUE_9A7428, bg || MT.VALUE_2C2A26);
    const r = U.rng(seed);
    const cx = x,
      cy = y - h * 0.55,
      hr = w * 0.16;
    const skin = C.mix(MT.D8C4A8, MT.VALUE_8A9A8A, r() * 0.5);
    const coat = [MT.VALUE_1A1A20, MT.VALUE_3A1E22, MT.VALUE_1E2A2A][Math.floor(r() * 3)];
    paint(
      g,
      poly([
        [cx - w * 0.36, y - 12],
        [cx - w * 0.28, cy + hr * 1.4],
        [cx + w * 0.28, cy + hr * 1.4],
        [cx + w * 0.36, y - 12],
      ]),
      coat,
      { d: 0, ink: false },
    );
    paint(g, ell(cx, cy, hr, hr * 1.25), skin, { d: 3, lw: 1 });
    paint(g, ell(cx, cy - hr * 0.8, hr * 1.05, hr * 0.6), r() < 0.5 ? MT.VALUE_2A1E16 : MT.VALUE_8A8A8A, { d: 0, lw: 1 });
    g.fillStyle = MT.VALUE_101010;
    g.fillRect(cx - hr * 0.45, cy - hr * 0.1, hr * 0.25, hr * 0.12);
    g.fillRect(cx + hr * 0.2, cy - hr * 0.1, hr * 0.25, hr * 0.12);
  };
  const stoneBlocks = (g, x0, x1, y0, y1, col, bw, bh, seed, joint) => {
    flat(g, x0, y0, x1 - x0, y1 - y0, col);
    const p = P();
    let row = 0;
    for (let y = y0; y < y1; y += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = Math.floor((x0 - off) / bw) * bw + off; x < x1; x += bw) {
        const h = H2(x * 3 + row * 977, seed);
        if (h < 0.28) {
          g.fillStyle = C.rgba(h < 0.14 ? MT.VALUE_000000 : MT.FFFFFF, 0.06 + h * 0.2);
          g.fillRect(x, y, bw, bh);
        }
        p.moveTo(x, y);
        p.lineTo(x, y + bh);
      }
      p.moveTo(x0, y);
      p.lineTo(x1, y);
    }
    g.strokeStyle = joint || C.rgba(MT.VALUE_000000, 0.32);
    g.lineWidth = 2.5;
    g.stroke(p);
  };
  const bricks = (g, x0, x1, y0, y1, col, seed, bw, bh) => {
    bw = bw || 64;
    bh = bh || 24;
    flat(g, x0, y0, x1 - x0, y1 - y0, C.shade(col, -0.25));
    let row = 0;
    for (let y = y0; y < y1; y += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = Math.floor((x0 - off) / bw) * bw + off; x < x1; x += bw) {
        const h = H2(x * 5 + row * 311, seed);
        g.fillStyle = C.shade(col, (h - 0.5) * 0.22);
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    }
  };
  const planksV = (g, x0, x1, y0, y1, col, w, seed) => {
    flat(g, x0, y0, x1 - x0, y1 - y0, col);
    for (let x = Math.floor(x0 / w) * w; x < x1; x += w) {
      const h = H2(x, seed);
      g.fillStyle = C.shade(col, (h - 0.5) * 0.18);
      g.fillRect(x, y0, w - 3, y1 - y0);
      g.fillStyle = C.rgba(MT.VALUE_000000, 0.35);
      g.fillRect(x + w - 3, y0, 3, y1 - y0);
      if (h > 0.7) {
        g.fillStyle = C.rgba(MT.VALUE_000000, 0.25);
        g.beginPath();
        g.ellipse(x + w * 0.5, y0 + (y1 - y0) * H2(x, seed + 3), 5, 9, 0, 0, PI * 2);
        g.fill();
      }
    }
  };
  const planksH = (g, x0, x1, y0, y1, col, h, seed) => {
    flat(g, x0, y0, x1 - x0, y1 - y0, col);
    let row = 0;
    for (let y = y0; y < y1; y += h, row++) {
      g.fillStyle = C.shade(col, (H2(row, seed) - 0.5) * 0.16);
      g.fillRect(x0, y, x1 - x0, h - 3);
      g.fillStyle = C.rgba(MT.VALUE_000000, 0.3);
      g.fillRect(x0, y + h - 3, x1 - x0, 3);
      const step = 260 + row * 3;
      for (let x = Math.floor(x0 / step) * step + (row % 3) * 80; x < x1; x += step) g.fillRect(x, y, 3, h - 3);
    }
  };
  const archPath = (x, y, w, h, pointed) => {
    const p = P();
    const r = w / 2;
    p.moveTo(x - r, y);
    p.lineTo(x - r, y - h + r);
    if (pointed) {
      p.quadraticCurveTo(x - r, y - h + r * 0.1, x, y - h - r * 0.25);
      p.quadraticCurveTo(x + r, y - h + r * 0.1, x + r, y - h + r);
    } else p.arc(x, y - h + r, r, PI, 0);
    p.lineTo(x + r, y);
    p.closePath();
    return p;
  };
  const archRing = (g, x, y, w, h, t, col, pointed) => {
    const p = archPath(x, y, w + t * 2, h + t, pointed);
    paint(g, p, col, { d: 4, lw: 1.6 });
  };
  const stainedGlass = (g, x, y, w, h, seed, lit) => {
    const p = archPath(x, y, w, h, true);
    paint(g, p, MT.VALUE_2A2A32, { d: 0, lw: 2 });
    g.save();
    g.clip(archPath(x, y - 8, w - 16, h - 16, true));
    const cols = [MT.C8443A, MT.VALUE_3A6AC8, MT.E0B040, MT.VALUE_3A9A6A, MT.VALUE_8A4AB0, MT.D87A3A];
    const r = U.rng(seed);
    const cw = (w - 16) / 3;
    for (let yy = y - h - w; yy < y; yy += cw)
      for (let i = 0; i < 4; i++) {
        g.fillStyle = C.mix(cols[Math.floor(r() * cols.length)], MT.VALUE_0A0A14, lit ? 0.05 : 0.35);
        g.fillRect(x - w / 2 + i * cw - cw / 2 + ((yy / cw) % 2 ? cw / 2 : 0), yy, cw - 3, cw - 3);
      }
    g.fillStyle = C.rgba(MT.FFF3D0, 0.25);
    g.beginPath();
    g.arc(x, y - h + w * 0.2, w * 0.22, 0, PI * 2);
    g.fill();
    g.restore();
    g.strokeStyle = MT.VALUE_1A1A20;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x, y - 8);
    g.lineTo(x, y - h - w * 0.1);
    g.moveTo(x - w / 2, y - h * 0.45);
    g.lineTo(x + w / 2, y - h * 0.45);
    g.stroke();
  };
  const skull = (g, x, y, s, col) => {
    col = col || MT.D8CFB8;
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    const p = P();
    p.ellipse(0, -14, 13, 12, 0, 0, PI * 2);
    p.rect(-7, -6, 14, 8);
    paint(g, p, col, { d: 2, lw: 1 });
    g.fillStyle = MT.VALUE_1A1612;
    g.beginPath();
    g.ellipse(-5, -12, 3.6, 4, 0, 0, PI * 2);
    g.ellipse(5, -12, 3.6, 4, 0, 0, PI * 2);
    g.moveTo(0, -7);
    g.lineTo(-2, -3);
    g.lineTo(2, -3);
    g.fill();
    g.fillRect(-5, 0, 10, 1.5);
    g.restore();
  };
  const bone = (g, x, y, len, ang, col) => {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    const p = P();
    p.rect(-len / 2, -2.5, len, 5);
    p.arc(-len / 2, -3, 4, 0, PI * 2);
    p.arc(-len / 2, 3, 4, 0, PI * 2);
    p.arc(len / 2, -3, 4, 0, PI * 2);
    p.arc(len / 2, 3, 4, 0, PI * 2);
    paint(g, p, col || MT.D4C9AE, { d: 0, lw: 1 });
    g.restore();
  };
  const boneHeap = (g, x, y, w, seed, col) => {
    const r = U.rng(seed);
    for (let i = 0; i < w / 8; i++) bone(g, x + (r() - 0.5) * w, y - r() * w * 0.15, 26 + r() * 22, (r() - 0.5) * 2.4, col);
    for (let i = 0; i < w / 40; i++) skull(g, x + (r() - 0.5) * w * 0.8, y - r() * w * 0.12, 0.9 + r() * 0.3, col);
  };
  const torchW = (g, x, y, s) => A(g, MT.WALL_TORCH, x, y + 130 * s, { t: x }, s) || flame(g, x, y, s * 1.4);
  const grain = (g, x0, x1, y0, y1, col, n, seed, w, h) => {
    const r = U.rng(seed);
    g.fillStyle = col;
    const cnt = Math.min(5000, Math.floor(((x1 - x0) * n) / 100));
    for (let i = 0; i < cnt; i++) {
      const x = x0 + r() * (x1 - x0),
        y = y0 + r() * (y1 - y0);
      const k = 1 + Math.max(0, y + 150) / 300;
      g.fillRect(x, y, (w || 3) * k, (h || 2) * k);
    }
  };
  const gfloor = (g, x0, x1, H, col) => paint(g, rect(x0 - 10, -152, x1 - x0 + 20, H + 170), col, { d: 0, ink: false });
  const backShade = (g, x0, x1, a, col) => {
    const gr = g.createLinearGradient(0, -150, 0, -50);
    gr.addColorStop(0, C.rgba(col || MT.VALUE_000000, a == null ? 0.35 : a));
    gr.addColorStop(1, C.rgba(col || MT.VALUE_000000, 0));
    g.fillStyle = gr;
    g.fillRect(x0 - 10, -150, x1 - x0 + 20, 100);
  };
  const frontShade = (g, x0, x1, H, a) => {
    const gr = g.createLinearGradient(0, 40, 0, H);
    gr.addColorStop(0, MT.RGBA_0_0_0_0);
    gr.addColorStop(1, C.rgba(MT.VALUE_000000, a == null ? 0.35 : a));
    g.fillStyle = gr;
    g.fillRect(x0 - 10, 40, x1 - x0 + 20, H);
  };
  const rowsY = (H) => {
    const out = [];
    let y = -150,
      h = 14;
    while (y < H) {
      out.push([y, h]);
      y += h;
      h *= 1.16;
    }
    return out;
  };
  const cobbles = (g, x0, x1, H, col, seed, wet) => {
    flat(g, x0 - 10, -150, x1 - x0 + 20, H + 160, C.shade(col, -0.35));
    const mx = mid(x0, x1);
    rowsY(H).forEach(([y, h], ri) => {
      const w = h * 1.9;
      const off = ri % 2 ? w / 2 : 0;
      for (let x = Math.floor((x0 - off) / w) * w + off; x < x1 + w; x += w) {
        const hh = H2(x * 13 + ri * 71, seed);
        g.fillStyle = C.shade(col, (hh - 0.5) * 0.25);
        g.beginPath();
        g.roundRect(x + 2, y + 2, w - 4, h - 3, h * 0.35);
        g.fill();
        if (wet && hh > 0.7) {
          g.fillStyle = C.rgba(wet, 0.18);
          g.fillRect(x + w * 0.2, y + 3, w * 0.4, 2);
        }
      }
    });
    void mx;
  };
  const tiles = (g, x0, x1, H, col, alt, seed, size) => {
    flat(g, x0 - 10, -150, x1 - x0 + 20, H + 160, col);
    const mx = Math.round(mid(x0, x1) / 400) * 400;
    const w0 = 90 * (size || 1);
    const f = (y) => (y + 300) / 150;
    const rws = rowsY(H);
    const c0 = Math.floor((x0 - mx) / w0 / 1.2) - 1,
      c1 = Math.ceil((x1 - mx) / w0 / 1.2) + 1;
    rws.forEach(([y, h], ri) => {
      const fa = f(y),
        fb = f(y + h);
      const ca = Math.floor((x0 - mx) / (w0 * fa)) - 1,
        cb = Math.ceil((x1 - mx) / (w0 * fa)) + 1;
      for (let c = Math.max(ca, c0 * 4); c <= Math.min(cb, c1 * 4); c++) {
        const hh = H2(c * 31 + ri * 17, seed);
        const odd = (((c + ri) % 2) + 2) % 2;
        g.fillStyle = alt && odd ? C.shade(alt, (hh - 0.5) * 0.1) : C.shade(col, (hh - 0.5) * 0.12);
        g.beginPath();
        g.moveTo(mx + c * w0 * fa, y);
        g.lineTo(mx + (c + 1) * w0 * fa, y);
        g.lineTo(mx + (c + 1) * w0 * fb, y + h);
        g.lineTo(mx + c * w0 * fb, y + h);
        g.closePath();
        g.fill();
      }
      g.fillStyle = MT.RGBA_0_0_0_0_25;
      g.fillRect(x0 - 10, y, x1 - x0 + 20, 2);
    });
    g.strokeStyle = MT.RGBA_0_0_0_0_2;
    g.lineWidth = 2;
    g.beginPath();
    const ca = Math.floor((x0 - mx) / w0) - 1,
      cb = Math.ceil((x1 - mx) / w0) + 1;
    for (let c = ca; c <= cb; c++) {
      g.moveTo(mx + c * w0 * f(-150), -150);
      g.lineTo(mx + c * w0 * f(H), H);
    }
    g.stroke();
  };
  const boards = (g, x0, x1, H, col, seed) => {
    flat(g, x0 - 10, -150, x1 - x0 + 20, H + 160, col);
    rowsY(H).forEach(([y, h], ri) => {
      g.fillStyle = C.shade(col, (H2(ri, seed) - 0.5) * 0.14);
      g.fillRect(x0 - 10, y, x1 - x0 + 20, h - 2);
      g.fillStyle = MT.RGBA_0_0_0_0_3;
      g.fillRect(x0 - 10, y + h - 2, x1 - x0 + 20, 2);
      const st = h * 14;
      for (let x = Math.floor(x0 / st) * st + (ri % 3) * h * 4; x < x1; x += st) g.fillRect(x, y, 2, h);
    });
  };
  const dirt = (g, x0, x1, H, col, seed, tuft) => {
    const gr = g.createLinearGradient(0, -150, 0, H);
    gr.addColorStop(0, C.shade(col, -0.1));
    gr.addColorStop(0.3, col);
    gr.addColorStop(1, C.shade(col, -0.3));
    g.fillStyle = gr;
    g.fillRect(x0 - 10, -152, x1 - x0 + 20, H + 170);
    const sx = Math.floor(x0 / 400) * 400;
    grain(g, sx, x1, -150, H, C.rgba(MT.VALUE_000000, 0.12), 18, seed + Math.floor(x0 / 400), 4, 2);
    grain(g, sx, x1, -150, H, C.rgba(MT.FFFFFF, 0.06), 10, seed + 9 + Math.floor(x0 / 400), 4, 2);
    if (tuft) {
      g.strokeStyle = tuft;
      g.lineWidth = 2;
      g.beginPath();
      spread(x0, x1, 37, seed, (x, h) => {
        if (h > 0.5) return;
        const y = -150 + h * 2 * 360;
        const k = 1 + (y + 150) / 300;
        for (let i = -1; i <= 1; i++) {
          g.moveTo(x + i * 3 * k, y);
          g.lineTo(x + i * 6 * k, y - 10 * k - h * 6);
        }
      });
      g.stroke();
    }
  };
  const fogFront = (col, a, y) => (g, x0, x1, tp) => {
    const c = col || (isN(tp) ? MT.VALUE_8A9AB8 : MT.C8CCD4);
    mist(g, x0, x1, y == null ? 30 : y, 110, c, a == null ? 0.22 : a, 77, 300);
  };
  const ENVS = [];
  const R = (id, def) => {
    ME.registerEnvironment(id, def);
    ENVS.push(id);
  };
  const glowL = (x, y, r, color, alpha) => ({ type: MT.GLOW, x, y, r, color, alpha });
  const lampL = (x, y, len, color, alpha) => ({ type: MT.LAMP, x, y, len, color, alpha });
  const rep = (WW, step, off, fn) => {
    const out = [];
    for (let x = off; x < WW + step; x += step) {
      const v = fn(x);
      if (Array.isArray(v)) out.push(...v);
      else if (v) out.push(v);
    }
    return out;
  };
  const horrorSky = (o) =>
    mkSky(
      Object.assign(
        {
          night: [MT.VALUE_04060E, MT.VALUE_0E1830, MT.VALUE_26365A, MT.VALUE_3A4A6A],
          dusk: [MT.VALUE_1E1830, MT.VALUE_5A3050, MT.B05A4A, MT.E09060],
          day: [MT.VALUE_6A7682, MT.VALUE_9AA4AC, MT.C2C8CC],
          overcast: MT.E8ECEF,
          sun: false,
          mr: 78,
          mx: 0.72,
          my: 0.18,
        },
        o || {},
      ),
    );
  const mansionFB = (tp) => (g) => {
    const n = isN(tp);
    const wall = nt(MT.VALUE_3E3846, tp, 0.35),
      roof = nt(MT.VALUE_1E1A24, tp, 0.3),
      trim = nt(MT.VALUE_6A6270, tp, 0.35);
    const win = (x, y, w, h, lit) => {
      paint(g, archPath(x, y, w, h), lit ? MT.FFCF6A : MT.VALUE_141820, { d: 0, lw: 1.2 });
      if (lit) glowDisc(g, x, y - h / 2, w * 2, MT.FFB450, n ? 0.35 : 0.15);
      g.fillStyle = lit ? MT.RGBA_90_50_10_0_5 : MT.RGBA_120_140_170_0_15;
      g.fillRect(x - 1.5, y - h + w / 2, 3, h - w / 2);
      g.fillRect(x - w / 2, y - h * 0.45, w, 3);
    };
    paint(g, rect(-360, -420, 720, 420), wall, { d: 6, lw: 1.6 });
    paint(
      g,
      poly([
        [-390, -420],
        [-320, -560],
        [320, -560],
        [390, -420],
      ]),
      roof,
      { d: 6, lw: 1.6 },
    );
    paint(
      g,
      poly([
        [-120, -560],
        [0, -680],
        [120, -560],
      ]),
      roof,
      { d: 4, lw: 1.6 },
    );
    paint(g, rect(-40, -640, 80, 70), wall, { d: 2, lw: 1.2 });
    win(0, -585, 30, 46, true);
    paint(g, rect(240, -660, 40, 120), nt(MT.VALUE_4A3E3E, tp, 0.4), { d: 2, lw: 1.2 });
    paint(g, rect(-300, -640, 34, 100), nt(MT.VALUE_4A3E3E, tp, 0.4), { d: 2, lw: 1.2 });
    paint(g, rect(-560, -560, 200, 560), wall, { d: 6, lw: 1.6 });
    paint(
      g,
      poly([
        [-580, -560],
        [-460, -860],
        [-340, -560],
      ]),
      roof,
      { d: 6, lw: 1.6 },
    );
    stroke(
      g,
      [
        [-460, -860],
        [-460, -910],
      ],
      roof,
      4,
      true,
    );
    paint(g, rect(-370, -440, 740, 18), trim, { d: 0, lw: 1.2 });
    paint(g, rect(-380, -10, 760, 14), trim, { d: 0, lw: 1.2 });
    paint(g, rect(-110, -150, 220, 20), trim, { d: 0, lw: 1.2 });
    paint(g, rect(-100, -260, 12, 110), trim, { d: 0, lw: 1 });
    paint(g, rect(88, -260, 12, 110), trim, { d: 0, lw: 1 });
    paint(
      g,
      poly([
        [-130, -260],
        [0, -330],
        [130, -260],
      ]),
      roof,
      { d: 2, lw: 1.2 },
    );
    paint(g, archPath(0, -10, 70, 120), MT.VALUE_120E10, { d: 0, lw: 1.2 });
    const r = U.rng(7);
    [-280, -190, 190, 280].forEach((x) => {
      win(x, -250, 46, 110, r() < 0.3);
      win(x, -40, 46, 110, false);
    });
    [-100, 100].forEach((x) => win(x, -300, 40, 100, x > 0));
    win(-460, -440, 50, 120, true);
    win(-460, -200, 50, 120, false);
    win(-460, -620, 34, 70, false);
    paint(
      g,
      poly([
        [200, -40],
        [214, -150],
        [228, -40],
      ]),
      MT.VALUE_1A1418,
      { d: 0, lw: 1 },
    );
  };
  const ironFence = (g, x0, x1, y, h, col, gapX, gapW) => {
    const p = P();
    p.rect(x0 - 50, y - h * 0.82, x1 - x0 + 100, 6);
    p.rect(x0 - 50, y - h * 0.25, x1 - x0 + 100, 6);
    for (let x = Math.floor(x0 / 26) * 26; x < x1 + 26; x += 26) {
      if (gapX != null && Math.abs(x - gapX) < gapW / 2) continue;
      p.rect(x - 2.5, y - h, 5, h);
      p.moveTo(x - 7, y - h + 2);
      p.lineTo(x, y - h - 14);
      p.lineTo(x + 7, y - h + 2);
      p.closePath();
    }
    paint(g, p, col, { d: 0, lw: 1 });
  };
  const gateFB = (col, stone) => (g) => {
    paint(g, rect(-190, -300, 60, 300), stone, { d: 6, lw: 1.4 });
    paint(g, rect(130, -300, 60, 300), stone, { d: 6, lw: 1.4 });
    paint(g, rect(-200, -320, 80, 24), C.shade(stone, 0.1), { d: 2, lw: 1.2 });
    paint(g, rect(120, -320, 80, 24), C.shade(stone, 0.1), { d: 2, lw: 1.2 });
    paint(g, ell(-160, -336, 22, 18), C.shade(stone, 0.05), { d: 3, lw: 1.2 });
    paint(g, ell(160, -336, 22, 18), C.shade(stone, 0.05), { d: 3, lw: 1.2 });
    const p = P();
    for (let x = -126; x <= 126; x += 18) {
      const top = -250 - Math.cos((x / 126) * (PI / 2)) * 60;
      p.rect(x - 2.5, top, 5, -top);
      p.moveTo(x - 6, top + 2);
      p.lineTo(x, top - 12);
      p.lineTo(x + 6, top + 2);
      p.closePath();
    }
    p.rect(-130, -170, 260, 6);
    p.rect(-130, -60, 260, 6);
    p.rect(-2, -320, 4, 320);
    paint(g, p, col, { d: 0, lw: 1 });
    g.strokeStyle = col;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(-60, -115, 26, 0, PI * 2);
    g.arc(60, -115, 26, 0, PI * 2);
    g.stroke();
  };
  R(MT.HAUNTED_MANSION_EXT, {
    name: MT.DINH_THU_MA_AM_TREN_DOI,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 4000,
    tags: [MT.KINH_DI, MT.MA, MT.DINH_THU, MT.BIET_THU_MA, MT.NHA_HOANG, MT.DEM, MT.TRANG_TRON, MT.SUONG_MU, MT.TRUYEN_MA],
    ownMoon: true,
    fog: 0.5,
    fog3d: MT.VALUE_1C2438,
    sky: horrorSky(),
    layers: [
      {
        depth: 0.06,
        blur: 2,
        draw: (g, x0, x1, tp) => {
          ridge(g, x0, x1, far(MT.VALUE_3A4660, tp, ts(tp, 0.5, 0.4, 0.15)), 220, 170, 3);
          mist(g, x0, x1, -170, 120, haze(tp), 0.5, 1, 320);
        },
      },
      {
        depth: 0.2,
        blur: 1,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_1C2434, tp, ts(tp, 0.45, 0.3, 0.12));
          spread(x0, x1, 46, 3, (x, h) => pine(g, x, -60 + h * 20, 150 + h * 120, c, { ink: false }));
          ridge(g, x0, x1, c, 40, 40, 9);
          mist(g, x0, x1, -60, 90, haze(tp), 0.55, 4, 260);
        },
      },
      {
        depth: 0.42,
        blur: 0.3,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const hill = P();
          hill.moveTo(cx - 1500, 60);
          hill.bezierCurveTo(cx - 900, 40, cx - 600, -140, cx, -150);
          hill.bezierCurveTo(cx + 600, -140, cx + 900, 40, cx + 1500, 60);
          hill.closePath();
          paint(g, hill, nt(MT.VALUE_2E3A2C, tp, 0.5), { d: 0, lw: 1.6 });
          deadTree(g, cx - 820, -150, 420, nt(MT.VALUE_241C1C, tp, 0.4), 11, { lean: -0.2 });
          deadTree(g, cx + 760, -150, 380, nt(MT.VALUE_241C1C, tp, 0.4), 12, { lean: 0.2 });
          put(g, MT.HAUNTED_MANSION, cx, -142, { night: isN(tp), t: 0 }, 0.5, mansionFB(tp));
          const r = U.rng(5);
          for (let i = 0; i < 9; i++) {
            const x = cx - 600 + r() * 1200;
            const y = -120 + Math.abs(x - cx) * 0.2 + r() * 30;
            if (Math.abs(x - cx) > 260)
              put(g, MT.GRAVEYARD_CROSS, x, y, {}, 0.45, (q) =>
                paint(
                  q,
                  poly([
                    [-6, 0],
                    [-6, -46],
                    [-18, -46],
                    [-18, -56],
                    [-6, -56],
                    [-6, -70],
                    [6, -70],
                    [6, -56],
                    [18, -56],
                    [18, -46],
                    [6, -46],
                    [6, 0],
                  ]),
                  nt(MT.VALUE_6A6A70, tp, 0.4),
                  { d: 2, lw: 1 },
                ),
              );
          }
          mist(g, x0, x1, -20, 120, haze(tp), 0.45, 8, 280);
        },
      },
      {
        depth: 0.8,
        blur: 0,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          spread(x0, x1, 1300, 200, (x, h) => {
            if (Math.abs(x - cx) < 500) return;
            deadTree(g, x, 0, 520 + h * 260, nt(MT.VALUE_1A1414, tp, 0.3), Math.floor(h * 99), { lean: (h - 0.5) * 0.5 });
          });
          ironFence(g, x0, x1, -6, 130, MT.VALUE_121418, cx, 310);
          put(g, MT.IRON_GATE, cx, -4, { night: isN(tp) }, 0.78, gateFB(MT.VALUE_121418, nt(MT.VALUE_5A5660, tp, 0.4)));
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_3A4434, tp, 0.55), 3, nt(MT.VALUE_4A5A3A, tp, 0.5));
      const p = P();
      p.moveTo(x0 - 10, -110);
      p.bezierCurveTo(x0 + 400, -120, x1 - 400, -100, x1 + 10, -112);
      p.lineTo(x1 + 10, -50);
      p.bezierCurveTo(x1 - 400, -40, x0 + 400, -60, x0 - 10, -48);
      p.closePath();
      paint(g, p, nt(MT.VALUE_5A5040, tp, 0.55), { d: 0, ink: false });
      backShade(g, x0, x1, 0.35);
      frontShade(g, x0, x1, H, 0.4);
    },
    front: fogFront(),
    props: (WW) =>
      props([
        { asset: pick(MT.DEAD_TREE_TWISTED, MT.TREE_BARE), x: WW * 0.16, lane: MT.BACK, scale: 1.1 },
        { asset: MT.CROW, x: WW * 0.42, lane: MT.BACK },
        { asset: pick(MT.JACK_O_LANTERN), x: WW * 0.62, lane: MT.MID },
        { asset: pick(MT.GRAVESTONE), x: WW * 0.78, lane: MT.BACK, scale: 0.8 },
        { asset: pick(MT.DEAD_TREE_TWISTED, MT.TREE_BARE), x: WW * 0.88, lane: MT.BACK },
      ]),
  });
  const damask = (g, x0, x1, y0, y1, col, a) => {
    g.fillStyle = C.rgba(col, a);
    for (let y = y0; y < y1; y += 70)
      for (let x = Math.floor(x0 / 60) * 60 + ((y / 70) % 2 ? 30 : 0); x < x1; x += 60) {
        g.beginPath();
        g.moveTo(x, y - 16);
        g.quadraticCurveTo(x + 10, y, x, y + 16);
        g.quadraticCurveTo(x - 10, y, x, y - 16);
        g.fill();
      }
  };
  const wainscot = (g, x0, x1, top, col) => {
    box(g, x0, top, x1 - x0, -top, col, { d: 0 });
    box(g, x0, top - 14, x1 - x0, 16, C.shade(col, 0.15));
    for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) paint(g, rect(x + 14, top + 22, 132, -top - 50), C.shade(col, -0.1), { d: 0, lw: 1 });
    box(g, x0, -26, x1 - x0, 26, C.shade(col, -0.3));
  };
  const winMoon = (g, x, y, w, h, frameCol) => {
    paint(g, archPath(x, y, w + 30, h + 15), frameCol || MT.VALUE_2A1E18, { d: 3, lw: 1.6 });
    const p = archPath(x, y - 6, w, h);
    const gr = g.createLinearGradient(0, y - h, 0, y);
    gr.addColorStop(0, MT.VALUE_22345A);
    gr.addColorStop(1, MT.VALUE_5A7AA8);
    g.fillStyle = gr;
    g.fill(p);
    g.save();
    g.clip(p);
    g.fillStyle = MT.RGBA_220_235_255_0_5;
    g.beginPath();
    g.arc(x + w * 0.15, y - h * 0.68, w * 0.16, 0, PI * 2);
    g.fill();
    g.fillStyle = MT.VALUE_0E1420;
    deadTree(g, x - w * 0.25, y + 10, h * 0.7, MT.VALUE_0E1420, Math.floor(x) % 50, { depth: 5 });
    g.restore();
    g.strokeStyle = frameCol || MT.VALUE_2A1E18;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x, y - 6);
    g.lineTo(x, y - h);
    for (let k = 1; k < 4; k++) {
      g.moveTo(x - w / 2, y - 6 - (k * (h - w / 2)) / 4);
      g.lineTo(x + w / 2, y - 6 - (k * (h - w / 2)) / 4);
    }
    g.stroke();
    if (T.style === MT.LINE) {
      g.strokeStyle = MT.VALUE_2A1C22;
      g.lineWidth = 1.6;
      g.stroke(p);
    }
  };
  const chandelier = (g, x, y, s, col) => {
    col = col || MT.A8862E;
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    stroke(
      g,
      [
        [0, -900],
        [0, -40],
      ],
      MT.VALUE_2A2420,
      5,
      true,
    );
    paint(g, ell(0, 0, 150, 26), col, { d: 3, lw: 1.4 });
    paint(g, ell(0, -40, 80, 16), col, { d: 3, lw: 1.4 });
    paint(
      g,
      poly([
        [-20, -40],
        [20, -40],
        [8, 50],
        [-8, 50],
      ]),
      col,
      { d: 2, lw: 1.2 },
    );
    for (let i = -3; i <= 3; i++) candle(g, i * 44, -14 - (Math.abs(i) === 3 ? 0 : 6), 30, 0.9, MT.E8E0C8);
    for (let i = -1; i <= 1; i++) candle(g, i * 50, -52, 26, 0.8, MT.E8E0C8);
    for (let i = -3; i <= 3; i++) {
      g.fillStyle = MT.RGBA_220_230_255_0_5;
      g.beginPath();
      g.ellipse(i * 44, 30, 3, 8, 0, 0, PI * 2);
      g.fill();
    }
    cobweb(g, 140, -20, 60, -1, -1, 0.3);
    g.restore();
  };
  const sheetGhost = (g, x, y, w, h, seed, col) => {
    const r = U.rng(seed);
    const pts = [[x - w / 2, y]];
    pts.push([x - w / 2 + r() * 10, y - h * 0.5]);
    pts.push([x - w * 0.42, y - h * 0.9]);
    pts.push([x - w * 0.1, y - h]);
    pts.push([x + w * 0.2, y - h * (0.92 + r() * 0.1)]);
    pts.push([x + w * 0.45, y - h * 0.8]);
    pts.push([x + w / 2, y - h * 0.3]);
    pts.push([x + w / 2 + 6, y]);
    paint(g, poly(pts, true), col || MT.B8B6AE, { d: 10, lw: 1.4 });
    g.strokeStyle = MT.RGBA_0_0_0_0_12;
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const fx = x - w * 0.3 + i * w * 0.2;
      g.moveTo(fx, y - h * 0.7);
      g.quadraticCurveTo(fx + 8, y - h * 0.35, fx - 4, y);
    }
    g.stroke();
  };
  const crate = (g, x, y, w, h, col) => {
    box(g, x - w / 2, y - h, w, h, col, { d: 4 });
    g.strokeStyle = C.shade(col, -0.3);
    g.lineWidth = 4;
    g.strokeRect(x - w / 2 + 6, y - h + 6, w - 12, h - 12);
    g.beginPath();
    g.moveTo(x - w / 2 + 8, y - 8);
    g.lineTo(x + w / 2 - 8, y - h + 8);
    g.stroke();
  };
  const cardbox = (g, x, y, w, h, col) => {
    box(g, x - w / 2, y - h, w, h, col, { d: 4 });
    flat(g, x - 3, y - h, 6, h * 0.3, C.shade(col, -0.2));
    g.fillStyle = MT.RGBA_255_255_255_0_18;
    g.fillRect(x - w * 0.3, y - h * 0.55, w * 0.25, h * 0.18);
  };
  R(MT.HAUNTED_HALL, {
    name: MT.DAI_SANH_DINH_THU_MA_AM,
    category: MT.INTERIOR,
    time: MT.INTERIOR_DARK,
    width: 3800,
    tags: [MT.KINH_DI, MT.MA, MT.DINH_THU, MT.DAI_SANH, MT.CAU_THANG, MT.CHAN_DUNG, MT.NEN_3, MT.NHA_MA, MT.TRUYEN_MA, MT.DEM],
    fog3d: MT.VALUE_14101A,
    sky: darkSky(MT.VALUE_050407, MT.VALUE_0C0A0E),
    dust: 0.4,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          const wall = MT.VALUE_2E2232;
          box(g, x0, -1700, x1 - x0, 1700, wall, { ink: false });
          damask(g, x0, x1, -1100, -220, MT.VALUE_7A5A8A, 0.13);
          vgrad(g, x0, -1700, x1 - x0, 700, [MT.VALUE_0A080C, MT.VALUE_1A141E, MT.RGBA_26_20_30_0]);
          box(g, x0, -1130, x1 - x0, 40, MT.VALUE_3A2A24);
          box(g, x0, -1090, x1 - x0, 12, MT.VALUE_5A4430);
          wainscot(g, x0, x1, -230, MT.VALUE_2A1C16);
          spread(x0, x1, 700, 0, (x) => {
            if (Math.abs(x - cx) < 760) return;
            box(g, x - 34, -1090, 68, 1090, MT.VALUE_3A2A2A, { d: 8 });
            box(g, x - 44, -1090, 88, 30, MT.VALUE_4A3630);
            box(g, x - 44, -250, 88, 24, MT.VALUE_4A3630);
            stroke(
              g,
              [
                [x, -430],
                [x + 30, -440],
                [x + 30, -470],
              ],
              MT.VALUE_8A6A2A,
              5,
              true,
            );
            candelabra(g, x + 30, -470, 0.55, MT.VALUE_8A6A2A);
          });
          spread(x0, x1, 700, 350, (x) => {
            if (Math.abs(x - cx) < 760) return;
            const k = Math.round((x - 350) / 700);
            if (((k % 3) + 3) % 3 === 1) {
              winMoon(g, x, -300, 190, 520);
              cobweb(g, x - 110, -830, 70, 1, 1, 0.3);
            } else {
              portrait(g, x, -330, 180, 240, k * 7 + 3);
              cobweb(g, x + 90, -570, 50, -1, 1, 0.35);
            }
          });
          const st = MT.VALUE_3A2620;
          g.save();
          g.translate(cx, 0);
          g.scale(0.84, 0.84);
          g.translate(-cx, 0);
          winMoon(g, cx, -400, 260, 620);
          box(g, cx - 300, -350, 600, 350, MT.VALUE_2A1C18, { d: 0 });
          archRing(g, cx, 0, 220, 290, 22, MT.VALUE_4A3428);
          paint(g, archPath(cx, 0, 220, 290), MT.VALUE_1E1410, { d: 0, lw: 1.4 });
          box(g, cx - 2, -290, 4, 290, MT.VALUE_0A0806);
          for (const s2 of [-1, 1]) {
            paint(g, rect(cx + s2 * 58 - 36, -230, 72, 90), MT.VALUE_2A1C16, { d: 0, lw: 1 });
            paint(g, rect(cx + s2 * 58 - 36, -120, 72, 100), MT.VALUE_2A1C16, { d: 0, lw: 1 });
            paint(g, ell(cx + s2 * 14, -140, 5, 5), MT.A08030, { d: 0, lw: 1 });
          }
          candelabra(g, cx - 200, -10, 0.8, MT.VALUE_8A6A2A);
          candelabra(g, cx + 200, -10, 0.8, MT.VALUE_8A6A2A);
          cobweb(g, cx - 150, -1040, 90, 1, 1, 0.3);
          box(g, cx - 380, -390, 760, 40, MT.VALUE_4A3028, { d: 4 });
          for (const s of [-1, 1]) {
            const p = P();
            p.moveTo(cx + s * 300, -350);
            p.lineTo(cx + s * 760, 0);
            p.lineTo(cx + s * 300, 0);
            p.closePath();
            paint(g, p, st, { d: 0, lw: 1.4 });
            g.strokeStyle = MT.RGBA_0_0_0_0_45;
            g.lineWidth = 3;
            g.beginPath();
            for (let i = 1; i < 14; i++) {
              const yy = -350 + i * 25,
                xx = cx + s * (300 + i * 32.8);
              g.moveTo(xx, yy);
              g.lineTo(xx, yy + 25);
              g.lineTo(xx + s * 32.8, yy + 25);
            }
            g.stroke();
            const rail = [
              [cx + s * 300, -460],
              [cx + s * 790, -90],
            ];
            g.strokeStyle = MT.VALUE_1E1410;
            g.lineWidth = 5;
            g.beginPath();
            for (let i = 0; i <= 15; i++) {
              const xx = cx + s * (300 + i * 32),
                yy = -350 + i * 24.4;
              g.moveTo(xx, yy);
              g.lineTo(xx, yy - 100);
            }
            g.stroke();
            stroke(g, rail, MT.VALUE_2A1A14, 12, true);
            box(g, cx + s * 790 - 18, -130, 36, 130, MT.VALUE_2A1A14, { d: 3 });
            paint(g, ell(cx + s * 790, -136, 22, 14), MT.VALUE_2A1A14, { d: 2, lw: 1.2 });
          }
          g.strokeStyle = MT.VALUE_1E1410;
          g.lineWidth = 5;
          g.beginPath();
          for (let x = cx - 300; x <= cx + 300; x += 30) {
            g.moveTo(x, -390);
            g.lineTo(x, -480);
          }
          g.stroke();
          box(g, cx - 310, -490, 620, 14, MT.VALUE_2A1A14);
          g.restore();
          chandelier(g, cx, -700, 0.85);
          cobweb(g, x0 + 10, -1700, 200, 1, 1, 0.25);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_24222A, MT.VALUE_3A3640, 4);
      const p = rect(x0 - 10, -122, x1 - x0 + 20, 54);
      paint(g, p, MT.VALUE_4A1218, { d: 0, ink: false });
      flat(g, x0 - 10, -118, x1 - x0 + 20, 4, MT.VALUE_8A6A2A);
      flat(g, x0 - 10, -74, x1 - x0 + 20, 4, MT.VALUE_8A6A2A);
      backShade(g, x0, x1, 0.5);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CANDELABRA, MT.CANDLE), x: WW * 0.33, lane: MT.BACK },
        { asset: pick(MT.GRANDFATHER_CLOCK, MT.HAUNTED_MIRROR, MT.WARDROBE), x: WW * 0.2, lane: MT.BACK },
        { asset: pick(MT.CANDELABRA, MT.CANDLE), x: WW * 0.67, lane: MT.BACK },
        { asset: pick(MT.ROCKING_CHAIR, MT.CHAIR), x: WW * 0.82, lane: MT.BACK },
      ]),
    lightsStatic: (WW) =>
      rep(WW, 700, 0, (x) => (Math.abs(x - WW / 2) < 760 ? null : glowL(x + 30, -650, 120, MT.FFB060, 0.42))).concat(
        [glowL(WW / 2, -830, 240, MT.FFC070, 0.5), glowL(WW / 2 - 168, -290, 110, MT.FFB060, 0.4), glowL(WW / 2 + 168, -290, 110, MT.FFB060, 0.4), { type: MT.SHAFT, x: WW / 2, y: -700, w: 220, h: 260, len: 800, angle: 1.4, color: MT.VALUE_9AB8FF, alpha: 0.12 }],
        rep(WW, 2100, 1050, (x) => (Math.abs(x - WW / 2) < 760 ? null : { type: MT.SHAFT, x, y: -700, w: 190, h: 220, len: 900, angle: 1.15, color: MT.VALUE_9AB8FF, alpha: 0.14 })),
      ),
  });
  R(MT.ATTIC, {
    name: MT.GAC_MAI_BO_HOANG,
    category: MT.INTERIOR,
    time: MT.INTERIOR_DARK,
    width: 3400,
    tags: [MT.KINH_DI, MT.MA, MT.GAC_MAI, MT.NHA_HOANG, MT.BUP_BE, MT.GHE_BAP_BENH_2, MT.BUI_BAM, MT.TRUYEN_MA, MT.DEM],
    fog3d: MT.VALUE_16120E,
    sky: darkSky(MT.VALUE_050403, MT.VALUE_0E0B08),
    dust: 0.7,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          planksV(g, x0, x1, -1700, 0, MT.VALUE_3A2C22, 46, 3);
          vgrad(g, x0, -1700, x1 - x0, 900, [MT.VALUE_0A0806, MT.RGBA_20_15_10_0_4, MT.RGBA_20_15_10_0]);
          spread(x0, x1, 2400, 1200, (x) => {
            const r = 110;
            paint(g, ell(x, -470, r + 26, r + 26), MT.VALUE_2A1E16, { d: 4, lw: 1.6 });
            const gr = g.createRadialGradient(x - 30, -510, 10, x, -470, r);
            gr.addColorStop(0, MT.VALUE_8AA8D8);
            gr.addColorStop(1, MT.VALUE_2A3A62);
            g.fillStyle = gr;
            g.beginPath();
            g.arc(x, -470, r, 0, PI * 2);
            g.fill();
            g.fillStyle = MT.RGBA_240_245_255_0_85;
            g.beginPath();
            g.arc(x + 40, -600, 30, 0, PI * 2);
            g.fill();
            g.save();
            g.beginPath();
            g.arc(x, -470, r, 0, PI * 2);
            g.clip();
            deadTree(g, x - 40, -440, 220, MT.VALUE_141A2A, 4, { depth: 5 });
            g.restore();
            g.strokeStyle = MT.VALUE_2A1E16;
            g.lineWidth = 10;
            g.beginPath();
            g.moveTo(x - r, -470);
            g.lineTo(x + r, -470);
            g.moveTo(x, -470 - r);
            g.lineTo(x, -470 + r);
            g.stroke();
            g.lineWidth = 3;
            g.strokeStyle = MT.RGBA_10_10_10_0_6;
            g.beginPath();
            g.moveTo(x + 30, -640);
            g.lineTo(x + 70, -600);
            g.lineTo(x + 60, -540);
            g.stroke();
          });
          spread(x0, x1, 1200, 0, (x) => {
            const beam = MT.VALUE_4A3424;
            const pl = (a, b, w) => {
              const dx = b[0] - a[0],
                dy = b[1] - a[1],
                l = Math.hypot(dx, dy),
                nx = (-dy / l) * w * 0.5,
                ny = (dx / l) * w * 0.5;
              paint(
                g,
                poly([
                  [a[0] + nx, a[1] + ny],
                  [b[0] + nx, b[1] + ny],
                  [b[0] - nx, b[1] - ny],
                  [a[0] - nx, a[1] - ny],
                ]),
                beam,
                { d: 5, lw: 1.6 },
              );
            };
            pl([x - 900, 40], [x, -1300], 54);
            pl([x + 900, 40], [x, -1300], 54);
            box(g, x - 22, -1300, 44, 1300, MT.VALUE_43301F, { d: 6 });
            cobweb(g, x + 22, -900, 90, 1, 1, 0.3);
            cobweb(g, x - 22, -900, 90, -1, 1, 0.3);
          });
          box(g, x0, -880, x1 - x0, 46, MT.VALUE_4A3424, { d: 5 });
          box(g, x0, -1320, x1 - x0, 50, MT.VALUE_3A2818, { d: 5 });
          const r = U.rng(9);
          spread(x0, x1, 1200, 600, (x, h) => {
            if (h < 0.5) {
              cardbox(g, x - 120, 0, 150, 110, MT.VALUE_8A6A42);
              cardbox(g, x - 100, -110, 120, 90, MT.VALUE_7A5A38);
              crate(g, x + 60, 0, 130, 120, MT.VALUE_6A4A2C);
              cardbox(g, x + 40, -120, 100, 70, MT.VALUE_9A7A4A);
            } else {
              sheetGhost(g, x - 80, 0, 220, 240, Math.floor(h * 99), MT.A8A69E);
              sheetGhost(g, x + 110, 0, 140, 330, Math.floor(h * 77), MT.B4B0A6);
            }
            void r;
          });
          const mx = cx + 420;
          paint(g, ell(mx, -290, 46, 70), MT.VALUE_3A2A2A, { d: 6, lw: 1.4 });
          paint(g, rect(mx - 4, -220, 8, 180), MT.VALUE_2A1E16, { d: 0, lw: 1 });
          paint(
            g,
            poly([
              [mx - 40, 0],
              [mx, -60],
              [mx + 40, 0],
            ]),
            MT.VALUE_2A1E16,
            { d: 0, lw: 1 },
          );
          paint(g, ell(mx, -370, 18, 14), MT.VALUE_2A1E16, { d: 0, lw: 1 });
          frame(g, cx - 520, 0, 160, 200, MT.VALUE_6A5030, MT.VALUE_3A3440);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      boards(g, x0, x1, H, MT.VALUE_4A3626, 7);
      grain(g, Math.floor(x0 / 400) * 400, x1, -150, H, MT.RGBA_200_190_170_0_06, 30, 3, 6, 3);
      backShade(g, x0, x1, 0.55);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.ROCKING_CHAIR, MT.CHAIR), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.CREEPY_DOLL), x: WW * 0.42, lane: MT.MID },
        { asset: pick(MT.MUSIC_BOX, MT.TREASURE_CHEST), x: WW * 0.62, lane: MT.BACK },
        { asset: pick(MT.OLD_TRUNK, MT.TREASURE_CHEST), x: WW * 0.75, lane: MT.MID },
      ]),
    lightsStatic: (WW) => rep(WW, 2400, 1200, (x) => [{ type: MT.SHAFT, x, y: -620, w: 220, h: 220, len: 1000, angle: 1.0, color: MT.A8C4FF, alpha: 0.16 }, glowL(x, -620, 220, MT.VALUE_8AA8E8, 0.3)]),
  });
  const vaultCeiling = (g, x0, x1, step, off, top, spring, col) => {
    box(g, x0, -1700, x1 - x0, 1700 + top, C.shade(col, -0.35), { ink: false });
    spread(x0, x1, step, off, (x) => {
      const p = P();
      p.moveTo(x, spring);
      p.quadraticCurveTo(x + step / 2, top - 120, x + step, spring);
      p.lineTo(x + step - 30, spring);
      p.quadraticCurveTo(x + step / 2, top - 70, x + 30, spring);
      p.closePath();
      paint(g, p, col, { d: 3, lw: 1.4 });
    });
  };
  R(MT.CRYPT, {
    name: MT.HAM_MO_CO,
    category: MT.UNDERGROUND,
    time: MT.INTERIOR_DARK,
    width: 3600,
    tags: [MT.KINH_DI, MT.HAM_MO, MT.QUAN_TAI_2, MT.XAC_UOP_2, MT.NEN_3, MT.XUONG_2, MT.LANG_MO, MT.MA_CA_RONG_2, MT.TRUYEN_MA],
    fog3d: MT.VALUE_100E0C,
    sky: darkSky(MT.VALUE_040404, MT.VALUE_0A0908),
    dust: 0.5,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const stone = MT.VALUE_4A463E;
          stoneBlocks(g, x0, x1, -1100, 0, stone, 110, 56, 2);
          vaultCeiling(g, x0, x1, 640, 0, -1050, -760, MT.VALUE_3E3A34);
          spread(x0, x1, 640, 320, (x, h) => {
            archRing(g, x, 0, 400, 520, 34, MT.VALUE_5A554C);
            paint(g, archPath(x, 0, 400, 520), MT.VALUE_13110F, { d: 0, lw: 1.4 });
            vgrad(g, x - 200, -700, 400, 700, [MT.RGBA_0_0_0_0, MT.RGBA_40_34_28_0_4]);
            box(g, x - 200, -230, 400, 22, MT.VALUE_3A3630);
            box(g, x - 200, -470, 400, 22, MT.VALUE_3A3630);
            const cf = (yy, kind) => {
              if (kind < 0.5) {
                paint(
                  g,
                  poly([
                    [x - 170, yy],
                    [x - 180, yy - 50],
                    [x - 120, yy - 74],
                    [x + 170, yy - 66],
                    [x + 176, yy - 8],
                    [x + 160, yy],
                  ]),
                  MT.VALUE_3A2A20,
                  { d: 4, lw: 1.2 },
                );
                stroke(
                  g,
                  [
                    [x - 60, yy - 40],
                    [x + 20, yy - 40],
                  ],
                  MT.VALUE_7A6A4A,
                  4,
                );
              } else boneHeap(g, x, yy, 260, Math.floor(kind * 99) + yy, MT.CFC3A4);
            };
            cf(-470, (h * 7) % 1);
            cf(-230, (h * 13) % 1);
            cf(0, (h * 3) % 1 > 0.5 ? 0.9 : 0.2);
          });
          spread(x0, x1, 640, 0, (x, h) => {
            box(g, x - 46, -760, 92, 760, MT.VALUE_56524A, { d: 8 });
            box(g, x - 58, -790, 116, 36, MT.VALUE_625D54, { d: 3 });
            box(g, x - 58, -40, 116, 40, MT.VALUE_3A3630, { d: 3 });
            box(g, x - 40, -330, 80, 14, MT.VALUE_3A3630);
            const n = 2 + Math.floor(h * 3);
            for (let i = 0; i < n; i++) candle(g, x - 26 + i * (52 / Math.max(1, n - 1)), -330, 22 + ((i * 13) % 20), 0.7, MT.E6DCC0);
            g.fillStyle = MT.RGBA_230_220_190_0_5;
            g.fillRect(x - 30, -330, 60, 10);
          });
          cobweb(g, x0, -1100, 160, 1, 1, 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_3A3732, null, 6, 1.4);
      grain(g, Math.floor(x0 / 400) * 400, x1, -150, H, MT.RGBA_0_0_0_0_2, 14, 4, 6, 3);
      backShade(g, x0, x1, 0.6);
      frontShade(g, x0, x1, H, 0.55);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.SARCOPHAGUS, MT.COFFIN), x: WW * 0.5, lane: MT.BACK },
        { asset: pick(MT.RITUAL_CANDLES, MT.CANDLE), x: WW * 0.38, lane: MT.MID },
        { asset: pick(MT.BONE_PILE, MT.SKULL), x: WW * 0.66, lane: MT.MID },
        { asset: pick(MT.COFFIN), x: WW * 0.22, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => rep(WW, 640, 0, (x) => glowL(x, -500, 150, MT.FFB060, 0.45)),
  });
  const skullWall = (g, x0, x1, y0, y1, seed) => {
    const r = U.rng(seed);
    flat(g, x0, y0, x1 - x0, y1 - y0, MT.VALUE_2A241C);
    let row = 0;
    for (let y = y1 - 4; y > y0 + 20; row++) {
      if (row % 3 === 2) {
        for (let x = x0 + (row % 2) * 9; x < x1; x += 18) {
          g.fillStyle = C.mix(MT.CFC2A0, MT.VALUE_8A7C60, r() * 0.6);
          g.beginPath();
          g.arc(x, y - 8, 7, 0, PI * 2);
          g.arc(x + 0, y - 17, 6, 0, PI * 2);
          g.fill();
        }
        y -= 26;
      } else {
        for (let x = x0 + (row % 2) * 16; x < x1; x += 32) skull(g, x + (r() - 0.5) * 4, y + (r() - 0.5) * 3, 0.95 + r() * 0.15, C.mix(MT.B8AC8C, MT.VALUE_6A5C44, r() * 0.8));
        y -= 30;
      }
    }
  };
  R(MT.CATACOMBS, {
    name: MT.HAM_MO_XUONG_SO,
    category: MT.UNDERGROUND,
    time: MT.INTERIOR_DARK,
    width: 3600,
    tags: [MT.KINH_DI, MT.HAM_MO, MT.XUONG_SO, MT.DUONG_HAM, MT.DUOC, MT.PARIS, MT.BI_AN, MT.TRUYEN_MA],
    fog3d: MT.VALUE_120E0A,
    sky: darkSky(MT.VALUE_040302, MT.VALUE_0A0806),
    dust: 0.5,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          box(g, x0, -1700, x1 - x0, 1700, MT.VALUE_3A3226, { ink: false });
          stoneBlocks(g, x0, x1, -1700, -620, MT.VALUE_4A4032, 140, 70, 5);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_050403, MT.RGBA_20_16_12_0_5, MT.RGBA_0_0_0_0]);
          spread(x0, x1, 1100, 0, (x) => {
            const x0b = x + 230,
              x1b = x + 870;
            skullWall(g, x0b, x1b, -560, -40, Math.floor(x));
            box(g, x0b - 10, -590, x1b - x0b + 20, 34, MT.VALUE_5A4E3C, { d: 3 });
            box(g, x0b - 10, -44, x1b - x0b + 20, 44, MT.VALUE_4A4032, { d: 3 });
          });
          spread(x0, x1, 1100, 0, (x) => {
            archRing(g, x, 0, 300, 480, 36, MT.VALUE_5A4E3C);
            for (let k = 0; k < 5; k++) paint(g, archPath(x, -k * 6, 300 - k * 48, 480 - k * 70), C.mix(MT.VALUE_2A2218, MT.VALUE_060504, k / 4), { d: 0, ink: k === 0 });
            torchW(g, x + 190, -400, 1);
            torchW(g, x - 190, -400, 1);
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, MT.VALUE_4A4030, 8);
      spread(x0, x1, 300, 7, (x, h) => {
        if (h > 0.4) return;
        bone(g, x, -100 + h * 300, 30, h * 9, MT.BCAE8C);
      });
      backShade(g, x0, x1, 0.6);
      frontShade(g, x0, x1, H, 0.6);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.BONE_PILE, MT.SKULL), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.SKULL), x: WW * 0.58, lane: MT.MID },
        { asset: pick(MT.RITUAL_CANDLES, MT.CANDLE), x: WW * 0.7, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => rep(WW, 1100, 0, (x) => [glowL(x + 190, -560, 190, MT.FF9A40, 0.5), glowL(x - 190, -560, 190, MT.FF9A40, 0.5)]),
  });
  const peel = (g, x0, x1, y0, y1, seed, col) => {
    spread(x0, x1, 170, seed, (x, h) => {
      if (h > 0.55) return;
      const y = y0 + (y1 - y0) * ((h * 7.3) % 1);
      const r = U.rng(Math.floor(x) + seed);
      const pts = [];
      const n = 9,
        w = 30 + r() * 70,
        hh = 20 + r() * 50;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2;
        const k = 0.6 + r() * 0.5;
        pts.push([x + Math.cos(a) * w * k, y + Math.sin(a) * hh * k]);
      }
      paint(g, poly(pts), col, { d: 3, lw: 1, sa: 0.5 });
    });
  };
  const stains = (g, x0, x1, y0, y1, seed) => {
    spread(x0, x1, 260, seed, (x, h) => {
      if (h > 0.5) return;
      const w = 20 + h * 60;
      const gr = g.createLinearGradient(0, y0, 0, y0 + (y1 - y0) * (0.4 + h));
      gr.addColorStop(0, MT.RGBA_70_50_20_0_35);
      gr.addColorStop(1, MT.RGBA_70_50_20_0);
      g.fillStyle = gr;
      g.fillRect(x, y0, w, (y1 - y0) * (0.4 + h));
    });
  };
  R(MT.ASYLUM_CORRIDOR, {
    name: MT.HANH_LANG_BENH_VIEN_TAM_THAN_BO_HOANG,
    category: MT.INTERIOR,
    time: MT.INTERIOR_DARK,
    width: 4000,
    tags: [MT.KINH_DI, MT.BENH_VIEN_2, MT.NHA_THUONG_DIEN, MT.HANH_LANG, MT.BO_HOANG, MT.XE_LAN, MT.MA, MT.TRUYEN_MA, MT.DO_THI_HUYEN_BI],
    fog3d: MT.VALUE_121A16,
    sky: darkSky(MT.VALUE_040605, MT.VALUE_0A0D0B),
    dust: 0.4,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          box(g, x0, -1700, x1 - x0, 1700, MT.VALUE_7D9282, { ink: false });
          peel(g, x0, x1, -760, -300, 3, MT.C4C0A8);
          stains(g, x0, x1, -780, -260, 5);
          box(g, x0, -270, x1 - x0, 270, MT.VALUE_3A5446, { ink: false });
          g.strokeStyle = MT.RGBA_0_0_0_0_25;
          g.lineWidth = 2;
          g.beginPath();
          for (let y = -240; y < 0; y += 30) {
            g.moveTo(x0, y);
            g.lineTo(x1, y);
          }
          for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) {
            g.moveTo(x, -270);
            g.lineTo(x, 0);
          }
          g.stroke();
          box(g, x0, -282, x1 - x0, 16, MT.VALUE_1E2A24);
          vgrad(g, x0, -1700, x1 - x0, 940, [MT.VALUE_0A0C0B, MT.VALUE_1E2622, MT.VALUE_3A4A40]);
          box(g, x0, -780, x1 - x0, 24, MT.VALUE_5A6A5E);
          g.strokeStyle = MT.RGBA_20_20_20_0_5;
          g.lineWidth = 2;
          spread(x0, x1, 530, 11, (x, h) => {
            if (h > 0.5) return;
            g.beginPath();
            g.moveTo(x, -760);
            g.lineTo(x + 20, -700);
            g.lineTo(x + 8, -640);
            g.lineTo(x + 34, -580);
            g.moveTo(x + 20, -700);
            g.lineTo(x + 50, -690);
            g.stroke();
          });
          spread(x0, x1, 760, 380, (x, h) => {
            box(g, x - 105, -390, 210, 390, MT.VALUE_2A3430, { d: 3 });
            const open = h > 0.72;
            if (open) {
              box(g, x - 90, -375, 180, 375, MT.VALUE_050605);
              paint(
                g,
                poly([
                  [x - 90, -375],
                  [x - 40, -390],
                  [x - 40, 10],
                  [x - 90, 0],
                ]),
                MT.VALUE_5E7266,
                { d: 2, lw: 1.4 },
              );
            } else {
              box(g, x - 90, -375, 180, 375, MT.VALUE_5E7266, { d: 4 });
              box(g, x - 45, -330, 90, 70, MT.VALUE_0D100F);
              g.fillStyle = MT.VALUE_3A4A40;
              for (let i = 1; i < 5; i++) g.fillRect(x - 45 + i * 18, -330, 4, 70);
              box(g, x - 50, -200, 100, 30, MT.VALUE_4E6256);
              paint(g, ell(x + 66, -190, 8, 8), MT.VALUE_9A9A8A, { d: 1, lw: 1 });
            }
            box(g, x - 30, -440, 60, 30, MT.D8D4C0);
            g.fillStyle = MT.VALUE_1A1A1A;
            g.font = MT.BOLD_22PX_SANS_SERIF;
            g.textAlign = MT.CENTER;
            g.fillText(String(100 + Math.floor(Math.abs(x) / 760)), x, -418);
          });
          spread(x0, x1, 760, 0, (x, h) => {
            const lit = Math.round(x / 760) % 3 === 0;
            box(g, x - 110, -770, 220, 16, MT.VALUE_2A302C);
            paint(g, rrect(x - 100, -758, 200, 16, 8), lit ? MT.F2F6E6 : MT.VALUE_6A7268, { d: 0, lw: 1.2, glow: lit ? MT.D8FFE0 : null });
            if (h < 0.4) {
              stroke(
                g,
                [
                  [x + 60, -754],
                  [x + 70, -640, x + 110, -600],
                ],
                MT.VALUE_1A1A1A,
                3,
              );
            }
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_7A7C70, MT.VALUE_4E5048, 9);
      grain(g, Math.floor(x0 / 400) * 400, x1, -150, H, MT.RGBA_30_25_15_0_18, 20, 2, 8, 4);
      spread(x0, x1, 340, 4, (x, h) => {
        if (h > 0.35) return;
        g.save();
        g.translate(x, -80 + h * 400);
        g.rotate(h * 6);
        flat(g, -18, -12, 36, 24, MT.RGBA_220_215_195_0_75);
        g.restore();
      });
      backShade(g, x0, x1, 0.45);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.WHEELCHAIR_OLD, MT.WHEELCHAIR), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.GURNEY, MT.HOSPITAL_BED), x: WW * 0.66, lane: MT.BACK },
        { asset: pick(MT.CHAIR), x: WW * 0.5, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => rep(WW, 760, 0, (x) => (Math.round(x / 760) % 3 === 0 ? lampL(x, -890, 900, MT.E0FFE8, 0.28) : null)),
  });
  const sashWin = (g, x, y, w, h, lit, frameCol, seed) => {
    box(g, x - w / 2 - 10, y - h - 20, w + 20, 18, frameCol || MT.VALUE_8A8070, { d: 2 });
    box(g, x - w / 2 - 6, y, w + 12, 12, frameCol || MT.VALUE_8A8070, { d: 2 });
    const c = lit ? MT.F2C066 : MT.VALUE_141A24;
    box(g, x - w / 2, y - h, w, h, c, { lw: 1.2 });
    if (lit) {
      g.fillStyle = MT.RGBA_120_60_20_0_35;
      g.fillRect(x - w / 2, y - h, w * (0.3 + H2(seed || x, 4) * 0.4), h);
    } else {
      g.fillStyle = MT.RGBA_140_160_190_0_12;
      g.fillRect(x - w / 2 + 4, y - h + 4, w * 0.3, h * 0.4);
    }
    g.fillStyle = frameCol || MT.VALUE_3A3430;
    g.fillRect(x - w / 2, y - h / 2 - 3, w, 6);
    g.fillRect(x - 2, y - h, 4, h);
  };
  const londonRow = (g, x0, x1, tp, seed, scale) => {
    const r = U.rng(seed);
    let x = Math.floor(x0 / 4000) * 4000 - 400;
    const cols = [MT.VALUE_6A3A2A, MT.VALUE_4A4440, MT.VALUE_7A5034, MT.VALUE_3E3A44, MT.VALUE_6E5A3E, MT.VALUE_5A2E2A];
    while (x < x1 + 400) {
      const w = (380 + Math.floor(r() * 3) * 80) * scale,
        h = (440 + r() * 480) * scale;
      if (r() < 0.22) {
        x += 220 * scale;
        continue;
      }
      const col = nt(cols[Math.floor(r() * cols.length)], tp, 0.5);
      if (x + w > x0 - 200) {
        g.save();
        g.beginPath();
        g.rect(x, -h, w, h + 2);
        g.clip();
        bricks(g, x, x + w, -h, 0, col, Math.floor(x), 40 * scale, 16 * scale);
        g.restore();
        paint(g, rect(x, -h, w, h), MT.RGBA_0_0_0_0, { d: 0, lw: 1.4 });
        box(g, x - 8, -h - 18 * scale, w + 16, 22 * scale, nt(MT.VALUE_3A3430, tp, 0.4), { d: 2 });
        for (let c = 0; c < 2; c++) {
          const cx = x + w * (0.2 + c * 0.55);
          box(g, cx, -h - 80 * scale, 34 * scale, 64 * scale, C.shade(col, -0.1), { d: 2 });
          box(g, cx - 4, -h - 88 * scale, 42 * scale, 10 * scale, nt(MT.VALUE_3A3430, tp, 0.4));
        }
        const nw = Math.max(2, Math.floor(w / (120 * scale)));
        const fl = Math.floor((h - 200 * scale) / (170 * scale));
        for (let f = 0; f < fl; f++)
          for (let i = 0; i < nw; i++) {
            const wx = x + ((i + 0.5) * w) / nw,
              wy = -220 * scale - f * 170 * scale;
            sashWin(g, wx, wy, 60 * scale, 100 * scale, isN(tp) ? r() < 0.25 : false, nt(MT.C8BCA8, tp, 0.55), Math.floor(wx));
          }
        const dx = x + w * (0.25 + r() * 0.5);
        box(g, dx - 50 * scale, -180 * scale, 100 * scale, 180 * scale, nt(MT.C8BCA8, tp, 0.55), { d: 2 });
        box(g, dx - 38 * scale, -170 * scale, 76 * scale, 170 * scale, nt([MT.VALUE_1E2A22, MT.VALUE_3A1A1A, MT.VALUE_1A1E2A][Math.floor(r() * 3)], tp, 0.4), { d: 3 });
        paint(g, ell(dx, -170 * scale, 38 * scale, 22 * scale), isN(tp) ? MT.E8B860 : MT.VALUE_3A4048, { d: 0, lw: 1 });
        box(g, x + w - 12 * scale, -h, 8 * scale, h, nt(MT.VALUE_2A2A2A, tp, 0.3), { d: 0, lw: 1 });
      }
      x += w;
    }
  };
  R(MT.FOGGY_ALLEY, {
    name: MT.HEM_SUONG_MU_LONDON_THOI_VICTORIA,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 3800,
    tags: [MT.KINH_DI, MT.BI_AN, MT.LONDON, MT.VICTORIA, MT.HEM, MT.SUONG_MU, MT.DEN_KHI, MT.JACK_THE_RIPPER, MT.THAM_TU, MT.DEM],
    ownMoon: true,
    fog: 0.7,
    fog3d: MT.VALUE_2A3238,
    sky: mkSky({ night: [MT.VALUE_05070A, MT.VALUE_121A22, MT.VALUE_2A343C, MT.VALUE_4A545A], dusk: [MT.VALUE_2A2430, MT.VALUE_6A4A50, MT.B08070], day: [MT.VALUE_7A8288, MT.A8AEB2, MT.C8CCCE], overcast: MT.E4E6E8, sun: false, mr: 46, mx: 0.66, my: 0.16, moonCol: MT.E8E6D0, wispCol: MT.VALUE_4A545E }),
    layers: [
      {
        depth: 0.1,
        blur: 1.6,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_2A3038, tp, ts(tp, 0.55, 0.45, 0.35));
          const r = U.rng(4);
          for (let x = x0 - 100; x < x1; ) {
            const w = 120 + r() * 160,
              h = 160 + r() * 200;
            flat(g, x, -h, w + 1, h + 60, c);
            for (let i = 0; i < 3; i++) flat(g, x + w * (0.2 + i * 0.3), -h - 40, 12, 40, c);
            x += w;
          }
          const cx = mid(x0, x1) + 500;
          flat(g, cx - 50, -760, 100, 820, c);
          paint(
            g,
            poly([
              [cx - 60, -760],
              [cx, -900],
              [cx + 60, -760],
            ]),
            c,
            { d: 0, ink: false },
          );
          flat(g, cx - 62, -700, 124, 120, c);
          paint(g, ell(cx, -640, 40, 40), isN(tp) ? MT.E8D8A0 : C.mix(c, MT.FFFFFF, 0.3), { d: 0, ink: false, glow: isN(tp) ? MT.FFE0A0 : null });
          band(g, x0, x1, -40, 220, haze(tp), 0.7);
        },
      },
      {
        depth: 0.32,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          g.save();
          londonRow(g, x0, x1, tp, 21, 0.62);
          g.globalCompositeOperation = MT.SOURCE_ATOP;
          g.fillStyle = C.rgba(haze(tp), 0.55);
          g.fillRect(x0 - 100, -1400, x1 - x0 + 200, 1500);
          g.restore();
          band(g, x0, x1, 0, 200, haze(tp), 0.55);
        },
      },
      {
        depth: 0.85,
        draw: (g, x0, x1, tp) => {
          londonRow(g, x0, x1, tp, 7, 1);
          spread(x0, x1, 1500, 700, (x) => {
            paint(g, rect(x - 50, -560, 100, 210), nt(MT.D8C8A0, tp, 0.5), { d: 2, lw: 1.4 });
            g.fillStyle = MT.VALUE_2A2018;
            g.font = MT.BOLD_30PX_SERIF;
            g.textAlign = MT.CENTER;
            g.fillText(MT.INN, x, -440);
            stroke(
              g,
              [
                [x - 60, -580],
                [x + 60, -580],
              ],
              MT.VALUE_1A1A1A,
              5,
              true,
            );
          });
          mist(g, x0, x1, -30, 140, isN(tp) ? MT.VALUE_8A96A8 : MT.C8CCD0, 0.35, 3, 300);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      cobbles(g, x0, x1, H, nt(MT.VALUE_5A5650, tp, 0.5), 3, isN(tp) ? MT.FFD090 : MT.FFFFFF);
      if (isN(tp))
        spread(x0, x1, 700, 200, (x) => {
          g.save();
          g.translate(x, -40);
          g.scale(1, 0.18);
          glowDisc(g, 0, 0, 260, MT.FFB860, 0.25);
          g.restore();
        });
      backShade(g, x0, x1, 0.4);
      frontShade(g, x0, x1, H, 0.45);
    },
    front: fogFront(MT.VALUE_8A96A8, 0.3),
    props: (WW) =>
      props(
        rep(WW, 700, 200, (x) => ({ asset: pick(MT.GAS_LAMP, MT.STREET_LAMP), x, lane: MT.BACK })).concat([
          { asset: pick(MT.BARREL), x: WW * 0.45, lane: MT.BACK },
          { asset: pick(MT.CRATE), x: WW * 0.47, lane: MT.BACK },
          { asset: pick(MT.CROW), x: WW * 0.72, lane: MT.BACK },
        ]),
      ),
  });
  const blinds = (g, x, y, w, h, outside) => {
    box(g, x - w / 2 - 20, y - h - 20, w + 40, h + 40, MT.VALUE_3A2A1E, { d: 4 });
    const gr = g.createLinearGradient(0, y - h, 0, y);
    gr.addColorStop(0, outside[0]);
    gr.addColorStop(1, outside[1]);
    g.fillStyle = gr;
    g.fillRect(x - w / 2, y - h, w, h);
    const r = U.rng(5);
    for (let i = 0; i < 8; i++) {
      const bw = 40 + r() * 60,
        bh = 80 + r() * 160;
      flat(g, x - w / 2 + r() * w, y - bh, bw, bh, MT.VALUE_0E1420);
      for (let k = 0; k < 6; k++) if (r() < 0.4) flat(g, x - w / 2 + r() * w, y - r() * bh, 6, 8, MT.F0C870);
    }
    paint(g, rrect(x + w * 0.1, y - h * 0.5, 120, 34, 6), MT.VALUE_1A0A12, { d: 0, ink: false, glow: MT.FF4A8A, glowR: 20 });
    g.fillStyle = MT.FF6AA0;
    g.font = MT.BOLD_22PX_SANS_SERIF;
    g.textAlign = MT.CENTER;
    g.fillText(MT.HOTEL, x + w * 0.1 + 60, y - h * 0.5 + 25);
    for (let yy = y - h + 6; yy < y; yy += 22) {
      flat(g, x - w / 2, yy, w, 12, MT.C8B890);
      flat(g, x - w / 2, yy + 12, w, 2, MT.RGBA_0_0_0_0_3);
    }
    flat(g, x - w / 2 + 4, y - h, 3, h, MT.VALUE_6A5A40);
    flat(g, x + w / 2 - 7, y - h, 3, h, MT.VALUE_6A5A40);
    box(g, x - w / 2 - 30, y, w + 60, 18, MT.VALUE_4A3424, { d: 3 });
  };
  const evidence = (g, x, y, w, h) => {
    box(g, x - w / 2 - 10, y - h - 10, w + 20, h + 20, MT.VALUE_5A3A22, { d: 4 });
    box(g, x - w / 2, y - h, w, h, MT.B08A5A, { d: 0 });
    const r = U.rng(3);
    const pins = [];
    for (let i = 0; i < 7; i++) {
      const px = x - w / 2 + 30 + r() * (w - 80),
        py = y - h + 20 + r() * (h - 80);
      const pw = 46 + r() * 20,
        ph = 54 + r() * 10;
      g.save();
      g.translate(px + pw / 2, py + ph / 2);
      g.rotate((r() - 0.5) * 0.3);
      box(g, -pw / 2, -ph / 2, pw, ph, i % 3 === 0 ? MT.E8E0C8 : MT.F2F0EA, { d: 0, lw: 1 });
      if (i % 3) {
        flat(g, -pw / 2 + 5, -ph / 2 + 5, pw - 10, ph - 18, MT.VALUE_3A3A40);
        paint(g, ell(0, -ph / 2 + 18, 7, 8), MT.VALUE_8A8A90, { d: 0, ink: false });
      } else for (let l = 0; l < 5; l++) flat(g, -pw / 2 + 6, -ph / 2 + 8 + l * 9, pw - 12, 3, MT.VALUE_6A6A6A);
      g.restore();
      pins.push([px + pw / 2, py + 6]);
    }
    g.strokeStyle = MT.C81E1E;
    g.lineWidth = 2.4;
    g.beginPath();
    for (let i = 0; i < pins.length - 1; i++) {
      g.moveTo(pins[i][0], pins[i][1]);
      g.lineTo(pins[(i + 3) % pins.length][0], pins[(i + 3) % pins.length][1]);
    }
    g.stroke();
    for (const p of pins) paint(g, ell(p[0], p[1], 4, 4), MT.E02A2A, { d: 0, lw: 1 });
  };
  const cabinet = (g, x, y, w, h, col, n) => {
    box(g, x - w / 2, y - h, w, h, col, { d: 6 });
    for (let i = 0; i < n; i++) {
      const dy = y - h + 10 + (i * (h - 20)) / n;
      box(g, x - w / 2 + 10, dy, w - 20, (h - 20) / n - 8, C.shade(col, 0.06), { d: 2, lw: 1 });
      box(g, x - 20, dy + 14, 40, 8, MT.B8B4A0, { lw: 1 });
      box(g, x - 14, dy + 28, 28, 14, MT.E8E2CC, { lw: 1 });
    }
  };
  R(MT.DETECTIVE_OFFICE, {
    name: MT.VAN_PHONG_THAM_TU_THAP_NIEN_1940,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3200,
    tags: [MT.THAM_TU, MT.TRINH_THAM, MT.NOIR, MT.VAN_PHONG, MT.BI_AN, MT.DIEU_TRA, MT.VU_AN, MT.VALUE_1940],
    fog3d: MT.VALUE_1A1612,
    sky: darkSky(MT.VALUE_070605, MT.VALUE_0E0C0A),
    dust: 0.35,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          box(g, x0, -1700, x1 - x0, 1700, MT.VALUE_4E4636, { ink: false });
          g.fillStyle = MT.RGBA_0_0_0_0_08;
          for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) g.fillRect(x, -1700, 14, 1500);
          vgrad(g, x0, -1700, x1 - x0, 1000, [MT.VALUE_0C0A08, MT.RGBA_20_16_12_0_6, MT.RGBA_0_0_0_0]);
          wainscot(g, x0, x1, -230, MT.VALUE_3A2618);
          box(g, x0, -780, x1 - x0, 20, MT.VALUE_3A2A1E);
          blinds(g, cx - 380, -230, 420, 400, [MT.VALUE_0A1430, MT.VALUE_24305A]);
          spread(x0, x1, 3200, 1600 - 380 + 3200, (x) => {
            void x;
          });
          const dx = cx + 520;
          box(g, dx - 100, -400, 200, 400, MT.VALUE_3A2618, { d: 4 });
          box(g, dx - 84, -384, 168, 384, MT.VALUE_5A3E28, { d: 3 });
          box(g, dx - 66, -360, 132, 170, MT.C8C4A8, { d: 0 });
          g.fillStyle = MT.VALUE_1A1A1A;
          g.font = MT.BOLD_15PX_SERIF;
          g.textAlign = MT.CENTER;
          g.fillText(MT.ROTCETED, dx, -300);
          g.fillText(MT.ETAVIRP, dx, -276);
          paint(g, ell(dx + 60, -190, 8, 8), MT.C8A040, { d: 0, lw: 1 });
          evidence(g, cx + 140, -300, 300, 220);
          cabinet(g, cx - 760, 0, 120, 300, MT.VALUE_5A5E58, 4);
          cabinet(g, cx - 900, 0, 120, 300, MT.VALUE_5A5E58, 4);
          cabinet(g, cx + 820, 0, 120, 260, MT.VALUE_6A5E48, 3);
          const hx = cx - 1100;
          stroke(
            g,
            [
              [hx, 0],
              [hx, -380],
            ],
            MT.VALUE_2A1E14,
            8,
            true,
          );
          paint(
            g,
            poly(
              [
                [hx - 14, -360],
                [hx + 14, -360],
                [hx + 40, -140],
                [hx - 40, -140],
              ],
              true,
            ),
            MT.VALUE_9A8460,
            { d: 5, lw: 1.4 },
          );
          paint(g, ell(hx, -380, 46, 10), MT.VALUE_2A2622, { d: 2, lw: 1.2 });
          paint(g, rrect(hx - 26, -410, 52, 32, 10), MT.VALUE_2A2622, { d: 2, lw: 1.2 });
          frame(g, cx - 380, -560, 160, 110, MT.VALUE_2A1E14, MT.E8E0CC);
          for (let l = 0; l < 3; l++) flat(g, cx - 430, -640 + l * 18, 100, 4, MT.VALUE_6A6050);
          paint(g, ell(cx + 140, -620, 48, 48), MT.VALUE_2A1E14, { d: 3, lw: 1.4 });
          paint(g, ell(cx + 140, -620, 40, 40), MT.ECE6D4, { d: 0, lw: 1 });
          stroke(
            g,
            [
              [cx + 140, -620],
              [cx + 140, -648],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          stroke(
            g,
            [
              [cx + 140, -620],
              [cx + 158, -612],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          stroke(
            g,
            [
              [cx - 120, -1700],
              [cx - 120, -560],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          paint(
            g,
            poly([
              [cx - 170, -500],
              [cx - 140, -560],
              [cx - 100, -560],
              [cx - 70, -500],
            ]),
            MT.VALUE_2E4A3A,
            { d: 3, lw: 1.4 },
          );
          glowDisc(g, cx - 120, -495, 90, MT.FFE0A0, 0.5);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      boards(g, x0, x1, H, MT.VALUE_4A3424, 2);
      backShade(g, x0, x1, 0.45);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.DESK), x: WW * 0.42, lane: MT.MID },
        { asset: pick(MT.CHAIR), x: WW * 0.36, lane: MT.BACK },
        { asset: pick(MT.TYPEWRITER, MT.TELEPHONE), x: WW * 0.42, lane: MT.MID, y: -110 },
        { asset: pick(MT.DESK_LAMP), x: WW * 0.47, lane: MT.MID, y: -110 },
        { asset: pick(MT.PLANT_POT), x: WW * 0.78, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => [{ type: MT.SHAFT, x: WW / 2 - 380, y: -580, w: 420, h: 400, len: 900, angle: 0.6, color: MT.C8D4FF, alpha: 0.07 }, lampL(WW / 2 - 120, -650, 700, MT.FFE0A0, 0.2)],
  });
  const bookshelf = (g, x0, x1, y0, y1, seed) => {
    box(g, x0, y0, x1 - x0, y1 - y0, MT.VALUE_3A2416, { d: 0 });
    const cols = [MT.VALUE_6A1E1E, MT.VALUE_2A4A2E, MT.VALUE_22304E, MT.VALUE_8A6A2A, MT.VALUE_4A2A1A, MT.VALUE_5A2A40, MT.VALUE_3A3A2A, MT.VALUE_7A4A2A];
    const r = U.rng(seed);
    const sh = 120;
    for (let y = y1 - 16; y > y0 + sh * 0.6; y -= sh) {
      flat(g, x0, y - sh + 14, x1 - x0, sh - 14, MT.VALUE_1A0E08);
      let x = x0 + 4;
      while (x < x1 - 8) {
        const w = 10 + r() * 14,
          h = sh * (0.55 + r() * 0.35);
        if (r() < 0.06) {
          x += 20;
          continue;
        }
        const c = cols[Math.floor(r() * cols.length)];
        if (r() < 0.08) {
          g.save();
          g.translate(x, y);
          g.rotate(-0.25);
          flat(g, 0, -h, w, h, c);
          g.restore();
          x += w + 20;
          continue;
        }
        flat(g, x, y - h, w - 1, h, C.shade(c, (r() - 0.5) * 0.3));
        if (r() < 0.5) flat(g, x + 2, y - h * 0.8, w - 5, 3, MT.C8A050);
        x += w;
      }
      box(g, x0, y, x1 - x0, 16, MT.VALUE_4A2E1A, { lw: 1 });
    }
    box(g, x0, y0, 16, y1 - y0, MT.VALUE_4A2E1A, { lw: 1 });
    box(g, x1 - 16, y0, 16, y1 - y0, MT.VALUE_4A2E1A, { lw: 1 });
  };
  R(MT.OLD_LIBRARY, {
    name: MT.THU_VIEN_CO,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3600,
    tags: [MT.THU_VIEN, MT.SACH, MT.CO_3, MT.BI_AN, MT.HOC_GIA, MT.KE_SACH_BI_MAT, MT.LAU_DAI, MT.PHEP_THUAT],
    fog3d: MT.VALUE_16100A,
    sky: darkSky(MT.VALUE_060403, MT.VALUE_0E0A07),
    dust: 0.5,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          box(g, x0, -1700, x1 - x0, 1700, MT.VALUE_2A1A10, { ink: false });
          spread(x0, x1, 1500, 0, (x) => {
            bookshelf(g, x + 120, x + 600, -560, 0, Math.floor(x) + 1);
            bookshelf(g, x + 900, x + 1380, -560, 0, Math.floor(x) + 2);
            bookshelf(g, x + 60, x + 1440, -1300, -640, Math.floor(x) + 3);
            box(g, x - 60 + 1500, -1300, 120, 1300, MT.VALUE_4A2E1A, { d: 8 });
            box(g, x - 70 + 1500, -40, 140, 40, MT.VALUE_3A2212, { d: 3 });
            const wx = x + 750;
            winMoon(g, wx, -170, 200, 360, MT.VALUE_3A2416);
            box(g, wx - 150, -170, 300, 170, MT.VALUE_3A2416, { d: 3 });
            box(g, wx - 160, -180, 320, 20, MT.VALUE_5A3A22, { d: 2 });
          });
          box(g, x0, -640, x1 - x0, 40, MT.VALUE_4A2E1A, { d: 4 });
          box(g, x0, -600, x1 - x0, 10, MT.VALUE_2A1A0E);
          g.strokeStyle = MT.VALUE_2A1A0E;
          g.lineWidth = 6;
          g.beginPath();
          for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) {
            g.moveTo(x, -640);
            g.lineTo(x, -720);
          }
          g.stroke();
          box(g, x0, -730, x1 - x0, 14, MT.VALUE_5A3A22, { d: 2 });
          const lx = cx - 420;
          stroke(
            g,
            [
              [x0, -500],
              [x1, -500],
            ],
            MT.VALUE_8A6A3A,
            6,
            true,
          );
          for (const s of [-24, 24])
            stroke(
              g,
              [
                [lx + s + 90, -500],
                [lx + s - 60, 0],
              ],
              MT.VALUE_6A4426,
              9,
              true,
            );
          for (let i = 1; i < 10; i++) {
            const k = i / 10;
            stroke(
              g,
              [
                [lx - 24 + 90 - 150 * k, -500 + 500 * k],
                [lx + 24 + 90 - 150 * k, -500 + 500 * k],
              ],
              MT.VALUE_6A4426,
              6,
              true,
            );
          }
          paint(g, ell(lx - 60 - 24, -6, 10, 10), MT.VALUE_2A2A2A, { d: 0, lw: 1 });
          paint(g, ell(lx - 60 + 24, -6, 10, 10), MT.VALUE_2A2A2A, { d: 0, lw: 1 });
          cobweb(g, x0, -1300, 140, 1, 1, 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      boards(g, x0, x1, H, MT.VALUE_4A2E1A, 5);
      const p = rect(x0 - 10, -120, x1 - x0 + 20, 90);
      paint(g, p, MT.VALUE_5A1E1E, { d: 0, ink: false });
      g.strokeStyle = MT.RGBA_220_170_80_0_35;
      g.lineWidth = 3;
      g.strokeRect(x0 - 20, -112, x1 - x0 + 40, 74);
      backShade(g, x0, x1, 0.5);
      frontShade(g, x0, x1, H, 0.45);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.SECRET_BOOKCASE, MT.BOOKSHELF), x: WW * 0.68, lane: MT.BACK },
        { asset: pick(MT.TABLE, MT.DESK), x: WW * 0.5, lane: MT.MID },
        { asset: pick(MT.OIL_LAMP, MT.CANDLE), x: WW * 0.52, lane: MT.MID, y: -90 },
        { asset: pick(MT.GLOBE), x: WW * 0.26, lane: MT.BACK },
        { asset: pick(MT.QUILL_INKWELL, MT.SCROLL), x: WW * 0.46, lane: MT.MID, y: -90 },
        { asset: pick(MT.CHAIR), x: WW * 0.42, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => [glowL(WW * 0.52, -200, 200, MT.FFC070, 0.5)].concat(rep(WW, 1500, 750, (x) => ({ type: MT.SHAFT, x, y: -470, w: 200, h: 280, len: 900, angle: 1.0, color: MT.A8C0FF, alpha: 0.12 }))),
  });
  const pew = (g, x, y, w, col) => {
    box(g, x, y - 120, w, 18, C.shade(col, 0.08), { d: 2 });
    box(g, x, y - 104, w, 70, col, { d: 3 });
    box(g, x - 6, y - 52, w + 12, 14, C.shade(col, 0.1), { d: 2 });
    box(g, x + 6, y - 38, 14, 38, C.shade(col, -0.2));
    box(g, x + w - 20, y - 38, 14, 38, C.shade(col, -0.2));
    paint(g, ell(x, y - 120, 10, 12), C.shade(col, 0.1), { d: 0, lw: 1 });
    paint(g, ell(x + w, y - 120, 10, 12), C.shade(col, 0.1), { d: 0, lw: 1 });
  };
  R(MT.CHURCH_INTERIOR, {
    name: MT.THANH_DUONG_GOTHIC,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3800,
    tags: [MT.NHA_THO_2, MT.GOTHIC, MT.TON_GIAO, MT.TRU_TA, MT.KINH_MAU, MT.BAN_THO, MT.LINH_MUC_2, MT.KINH_DI, MT.LICH_SU],
    fog3d: MT.VALUE_14121A,
    sky: darkSky(MT.VALUE_060508, MT.VALUE_0E0C12),
    dust: 0.5,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          const st = MT.VALUE_7A746A;
          stoneBlocks(g, x0, x1, -1700, 0, st, 120, 60, 7, MT.RGBA_0_0_0_0_18);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_0A090C, MT.RGBA_20_18_24_0_6, MT.RGBA_0_0_0_0]);
          spread(x0, x1, 620, 310, (x) => {
            if (Math.abs(x - cx) < 500) return;
            paint(g, archPath(x, 0, 460, 760, true), MT.VALUE_2A2630, { d: 0, lw: 1.6 });
            stainedGlass(g, x, -230, 150, 380, Math.floor(x), true);
            archRing(g, x, -230, 150, 380, 14, MT.VALUE_5A5650, true);
            stainedGlass(g, x, -230, 150, 380, Math.floor(x), true);
          });
          spread(x0, x1, 620, 0, (x) => {
            if (Math.abs(x - cx) < 360) return;
            box(g, x - 40, -1000, 80, 1000, MT.VALUE_8E877A, { d: 8 });
            box(g, x - 52, -40, 104, 40, MT.VALUE_6A645A, { d: 3 });
            box(g, x - 50, -820, 100, 26, MT.VALUE_9A9486, { d: 3 });
          });
          paint(g, archPath(cx, 0, 760, 900, true), MT.VALUE_26222A, { d: 0, lw: 1.6 });
          stainedGlass(g, cx, -420, 300, 560, 77, true);
          archRing(g, cx, -420, 300, 560, 16, MT.VALUE_6A645A, true);
          stainedGlass(g, cx, -420, 300, 560, 77, true);
          box(g, cx - 420, -40, 840, 40, MT.VALUE_5A544C, { d: 3 });
          box(g, cx - 380, -80, 760, 40, MT.VALUE_625C52, { d: 3 });
          box(g, cx - 340, -110, 680, 30, MT.VALUE_6A645A, { d: 3 });
          box(g, cx - 300, -110, 600, 110, MT.VALUE_6A1A20, { d: 0, ink: false });
          box(g, cx - 220, -250, 440, 140, MT.VALUE_6A4A30, { d: 4 });
          box(g, cx - 230, -260, 460, 24, MT.EFE8D8, { d: 2 });
          box(g, cx - 40, -255, 80, 145, MT.C8A040);
          box(g, cx - 14, -580, 28, 320, MT.C8A040, { d: 3 });
          box(g, cx - 90, -500, 180, 28, MT.C8A040, { d: 3 });
          for (const s of [-1, 1])
            for (let i = 0; i < 3; i++) {
              const xx = cx + s * (120 + i * 46);
              box(g, xx - 6, -300 + i * 14, 12, 44 - i * 14, MT.C8A040);
              candle(g, xx, -300 + i * 14, 60 - i * 12, 1, MT.F2EAD6);
            }
          for (const s of [-1, 1])
            spread(x0, x1, 620, 0, (x) => {
              if ((x - cx) * s < 420) return;
              if (Math.abs(x - cx) > 2600) return;
              pew(g, x + 60, 0, 440, MT.VALUE_5A3A24);
            });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_6A645C, MT.VALUE_4E4A44, 3, 1.3);
      backShade(g, x0, x1, 0.4);
      frontShade(g, x0, x1, H, 0.45);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CANDELABRA, MT.CANDLE), x: WW * 0.38, lane: MT.BACK },
        { asset: pick(MT.CANDELABRA, MT.CANDLE), x: WW * 0.62, lane: MT.BACK },
      ]),
    lightsStatic: (WW) =>
      [glowL(WW / 2, -700, 320, MT.FFD8A0, 0.35), glowL(WW / 2 - 170, -450, 160, MT.FFB060, 0.4), glowL(WW / 2 + 170, -450, 160, MT.FFB060, 0.4), { type: MT.SHAFT, x: WW / 2, y: -700, w: 300, h: 300, len: 900, angle: 1.45, color: MT.FFE8C0, alpha: 0.14 }].concat(
        rep(WW, 620, 310, (x) => (Math.abs(x - WW / 2) < 500 ? null : glowL(x, -560, 180, [MT.VALUE_8AB0FF, MT.FF9A7A, MT.C8A0FF][Math.round(x / 620) % 3], 0.22))),
      ),
  });
  const treeRow = (g, x0, x1, step, off, hmin, hmax, col, base, o) => spread(x0, x1, step, off, (x, h) => deadTree(g, x + (h - 0.5) * step * 0.5, base, hmin + h * (hmax - hmin), col, Math.floor(x * 0.37) + off, Object.assign({ lean: (h - 0.5) * 0.4 }, o || {})));
  R(MT.DARK_FOREST, {
    name: MT.KHU_RUNG_CHET_U_AM,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 4000,
    tags: [MT.KINH_DI, MT.RUNG, MT.RUNG_MA, MT.CAY_CHET, MT.QUA_2, MT.SUONG_MU, MT.DEM, MT.TRANG, MT.PHU_THUY, MT.TRUYEN_MA],
    ownMoon: true,
    fog: 0.6,
    fog3d: MT.VALUE_1A2230,
    sky: horrorSky({ night: [MT.VALUE_03050A, MT.VALUE_0A1420, MT.VALUE_1C2E3A, MT.VALUE_2E4448], wispCol: MT.VALUE_2A3A44, mx: 0.3, my: 0.17 }),
    layers: [
      {
        depth: 0.06,
        blur: 2,
        draw: (g, x0, x1, tp) => {
          ridge(g, x0, x1, far(MT.VALUE_2A3A44, tp, ts(tp, 0.5, 0.4, 0.2)), 160, 120, 5);
          mist(g, x0, x1, -110, 120, haze(tp), 0.5, 2, 300);
        },
      },
      {
        depth: 0.18,
        blur: 1,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_16222A, tp, ts(tp, 0.45, 0.35, 0.18));
          spread(x0, x1, 38, 1, (x, h) => pine(g, x, 20, 200 + h * 220, c, { ink: false }));
          mist(g, x0, x1, -30, 120, haze(tp), 0.55, 6, 260);
        },
      },
      {
        depth: 0.38,
        blur: 0.4,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_151618, tp, ts(tp, 0.35, 0.25, 0.1));
          treeRow(g, x0, x1, 170, 3, 360, 620, c, 30, { depth: 6 });
          mist(g, x0, x1, 10, 110, haze(tp), 0.45, 9, 240);
        },
      },
      {
        depth: 0.75,
        draw: (g, x0, x1, tp) => {
          const c = nt(MT.VALUE_1C1714, tp, 0.25);
          spread(x0, x1, 620, 100, (x, h) => {
            const tips = deadTree(g, x + h * 200, 0, 700 + h * 360, c, Math.floor(x) + 5, { lean: (h - 0.5) * 0.6, thick: 0.09, depth: 7 });
            const r = U.rng(Math.floor(x));
            const hi = tips.filter((t) => t[1] < -380 && t[1] > -700);
            if (hi.length && h > 0.35) {
              const t = hi[Math.floor(r() * hi.length)];
              crow(g, t[0], t[1] + 2, 1.5, r() < 0.5 ? -1 : 1);
            }
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_2E2A22, tp, 0.5), 5, nt(MT.VALUE_3A4430, tp, 0.4));
      spread(x0, x1, 210, 9, (x, h) => {
        const y = -140 + h * 380;
        const k = 1 + (y + 150) / 300;
        if (h < 0.3) {
          for (let i = 0; i < 3; i++) {
            paint(g, rect(x + i * 9 * k - 2, y - 10 * k, 3 * k, 10 * k), MT.D8D0BC, { d: 0, ink: false });
            paint(g, ell(x + i * 9 * k, y - 10 * k, 7 * k, 4 * k), i % 2 ? MT.C8B8A0 : MT.B84A3A, { d: 0, lw: 1 });
          }
        } else if (h < 0.6)
          stroke(
            g,
            [
              [x - 60 * k, y],
              [x, y - 14 * k, x + 70 * k, y + 4 * k],
            ],
            nt(MT.VALUE_2A2018, tp, 0.3),
            7 * k,
            true,
          );
      });
      backShade(g, x0, x1, 0.4);
      frontShade(g, x0, x1, H, 0.5);
    },
    front: fogFront(null, 0.26),
    props: (WW) =>
      props([
        { asset: pick(MT.DEAD_TREE_TWISTED, MT.TREE_BARE), x: WW * 0.12, lane: MT.BACK, scale: 1.2 },
        { asset: pick(MT.CROW), x: WW * 0.4, lane: MT.MID },
        { asset: pick(MT.GHOST_ORB), x: WW * 0.55, lane: MT.BACK, y: -160 },
        { asset: pick(MT.DEAD_TREE_TWISTED, MT.TREE_BARE), x: WW * 0.86, lane: MT.BACK, scale: 1.1 },
        { asset: pick(MT.ROCK), x: WW * 0.7, lane: MT.BACK, scale: 0.7 },
      ]),
  });
  const water = (g, x0, x1, y0, y1, top, bot, tp, seed) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bot);
    g.fillStyle = gr;
    g.fillRect(x0 - 50, y0, x1 - x0 + 100, y1 - y0);
    const r = U.rng(seed);
    g.fillStyle = isN(tp) ? MT.RGBA_200_220_240_0_12 : MT.RGBA_255_255_255_0_2;
    const cnt = Math.min(1200, Math.floor((x1 - x0) / 12));
    for (let i = 0; i < cnt; i++) {
      const y = y0 + Math.pow(r(), 1.4) * (y1 - y0);
      const w = 10 + ((y - y0) / (y1 - y0)) * 60 * r();
      g.fillRect(x0 + r() * (x1 - x0), y, w, 2);
    }
  };
  const reflect = (g, x, y0, y1, w, col, a) => {
    for (let y = y0; y < y1; y += 9) {
      const k = (y - y0) / (y1 - y0);
      const ww = w * (0.4 + k * 0.9) * (0.6 + H2(y, 3) * 0.6);
      g.fillStyle = C.rgba(col, a * (1 - k * 0.7));
      g.fillRect(x - ww / 2 + (H2(y, 7) - 0.5) * 20, y, ww, 4);
    }
  };
  const reeds = (g, x, y, n, h, col, seed) => {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const xx = x + (r() - 0.5) * n * 7,
        hh = h * (0.6 + r() * 0.5),
        lean = (r() - 0.5) * hh * 0.35;
      stroke(
        g,
        [
          [xx, y],
          [xx + lean * 0.3, y - hh * 0.6, xx + lean, y - hh],
        ],
        col,
        3 + r() * 2,
        true,
      );
      if (r() < 0.35) paint(g, rrect(xx + lean - 4, y - hh - 4, 8, 34, 4), C.shade(col, -0.3), { d: 0, lw: 1 });
    }
  };
  const cypress = (g, x, y, h, col, moss, seed) => {
    const p = P();
    p.moveTo(x - h * 0.12, y);
    p.quadraticCurveTo(x - h * 0.04, y - h * 0.15, x - h * 0.035, y - h * 0.5);
    p.lineTo(x - h * 0.015, y - h);
    p.lineTo(x + h * 0.015, y - h);
    p.lineTo(x + h * 0.035, y - h * 0.5);
    p.quadraticCurveTo(x + h * 0.04, y - h * 0.15, x + h * 0.12, y);
    p.closePath();
    const r = U.rng(seed);
    for (let i = 0; i < 4; i++) {
      const yy = y - h * (0.5 + i * 0.13),
        s = r() < 0.5 ? -1 : 1;
      const w = h * (0.22 - i * 0.03);
      p.moveTo(x, yy);
      p.quadraticCurveTo(x + s * w * 0.5, yy - 30, x + s * w, yy - 10);
      p.lineTo(x + s * w, yy + 8);
      p.quadraticCurveTo(x + s * w * 0.5, yy - 10, x, yy + 14);
      p.closePath();
      p.ellipse(x + s * w * 0.8, yy - 20, w * 0.5, 22, 0, 0, PI * 2);
    }
    p.ellipse(x, y - h, h * 0.12, 30, 0, 0, PI * 2);
    paint(g, p, col, { d: 0, lw: 1.2 });
    if (moss)
      for (let i = 0; i < 10; i++) {
        const xx = x + (r() - 0.5) * h * 0.4,
          yy = y - h * (0.45 + r() * 0.5);
        stroke(
          g,
          [
            [xx, yy],
            [xx + 4, yy + 30, xx - 2, yy + 50 + r() * 70],
          ],
          moss,
          3 + r() * 3,
          false,
        );
      }
  };
  R(MT.SWAMP, {
    name: MT.DAM_LAY_MA_AM,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 4000,
    tags: [MT.KINH_DI, MT.DAM_LAY, MT.BAYOU, MT.SUONG_MU, MT.CAY_CHET, MT.REU, MT.PHU_THUY, MT.DEM, MT.TRUYEN_MA, MT.LOUISIANA],
    ownMoon: true,
    fog: 0.65,
    fog3d: MT.VALUE_1A2A24,
    sky: horrorSky({ night: [MT.VALUE_030605, MT.VALUE_0A1612, MT.VALUE_1A3028, MT.VALUE_2E4A3A], dusk: [MT.VALUE_1A1A24, MT.VALUE_4A3A3A, MT.VALUE_8A6A4A, MT.B89A5A], moonCol: MT.E8E6C0, wispCol: MT.VALUE_22382E, mx: 0.62, my: 0.2 }),
    layers: [
      {
        depth: 0.07,
        blur: 1.8,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_1A2A24, tp, ts(tp, 0.5, 0.4, 0.22));
          spread(x0, x1, 90, 2, (x, h) => cypress(g, x, 30, 200 + h * 220, c, null, Math.floor(x)));
          mist(g, x0, x1, -10, 120, haze(tp), 0.55, 3, 300);
        },
      },
      {
        depth: 0.3,
        draw: (g, x0, x1, tp) => {
          water(g, x0, x1, -40, 80, nt(MT.VALUE_2A3A30, tp, 0.5), nt(MT.VALUE_0E1612, tp, 0.4), tp, 4);
          reflect(g, mid(x0, x1) + 300, -36, 70, 90, isN(tp) ? MT.E8E6C0 : MT.F0C080, 0.4);
          const c = far(MT.VALUE_121A16, tp, ts(tp, 0.3, 0.2, 0.08));
          spread(x0, x1, 330, 6, (x, h) => {
            cypress(g, x, -10, 380 + h * 260, c, nt(MT.VALUE_4A5A3A, tp, 0.5), Math.floor(x) + 3);
            reeds(g, x + 120, -10, 10, 70, c, Math.floor(x));
          });
          mist(g, x0, x1, -20, 90, haze(tp), 0.4, 8, 240);
        },
      },
      {
        depth: 0.72,
        draw: (g, x0, x1, tp) => {
          water(g, x0, x1, -60, 60, nt(MT.VALUE_1E2A22, tp, 0.4), nt(MT.VALUE_0A100C, tp, 0.3), tp, 9);
          spread(x0, x1, 260, 7, (x, h) => {
            if (h < 0.5) paint(g, ell(x, -20 + h * 60, 34, 7), nt(MT.VALUE_3A5A2A, tp, 0.4), { d: 0, lw: 1 });
          });
          spread(x0, x1, 900, 300, (x, h) => {
            deadTree(g, x, -30, 640 + h * 240, nt(MT.VALUE_1E1A14, tp, 0.25), Math.floor(x) + 11, { moss: nt(MT.VALUE_5A6A44, tp, 0.45), lean: (h - 0.5) * 0.4, depth: 6 });
            reeds(g, x - 160, -20, 18, 120, nt(MT.VALUE_3A4A2A, tp, 0.4), Math.floor(x) + 2);
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_3A3424, tp, 0.5), 11, nt(MT.VALUE_4A5A2E, tp, 0.4));
      water(g, x0, x1, -150, -112, nt(MT.VALUE_1E2A22, tp, 0.4), nt(MT.VALUE_141C16, tp, 0.4), tp, 2);
      spread(x0, x1, 520, 13, (x, h) => {
        if (h > 0.4) return;
        g.save();
        g.translate(x, -20 + h * 300);
        g.scale(1, 0.22);
        paint(g, ell(0, 0, 120 + h * 100, 120 + h * 100), nt(MT.VALUE_1A2420, tp, 0.4), { d: 0, ink: false });
        g.restore();
      });
      spread(x0, x1, 3000, 1200, (x) => {
        const w = 460;
        for (let i = 0; i < 3; i++) box(g, x + i * 200, -170, 18, 100, nt(MT.VALUE_3A2A1C, tp, 0.4), { d: 2 });
        for (let yy = -150; yy < -76; yy += 18) box(g, x - 20, yy, w, 16, nt(MT.VALUE_6A5236, tp, 0.5), { d: 0, lw: 1 });
      });
      backShade(g, x0, x1, 0.3);
      frontShade(g, x0, x1, H, 0.5);
    },
    front: fogFront(MT.VALUE_7A9A8A, 0.3),
    props: (WW) =>
      props([
        { asset: pick(MT.SWAMP_REEDS), x: WW * 0.2, lane: MT.BACK },
        { asset: pick(MT.ROWBOAT), x: WW * 0.3, lane: MT.BACK, scale: 0.8 },
        { asset: pick(MT.CROW), x: WW * 0.55, lane: MT.BACK },
        { asset: pick(MT.WHITE_LANTERN), x: WW * 0.62, lane: MT.BACK, y: -40 },
        { asset: pick(MT.SWAMP_REEDS), x: WW * 0.8, lane: MT.MID },
      ]),
  });
  R(MT.MISTY_LAKE, {
    name: MT.HO_SUONG_MU_DEM_TRANG,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 4200,
    tags: [MT.KINH_DI, MT.HO, MT.SUONG_MU, MT.THUYEN, MT.TRANG, MT.RUNG_THONG_2, MT.DEM, MT.BI_AN, MT.TRUYEN_MA, MT.YEN_TINH],
    ownMoon: true,
    fog: 0.5,
    fog3d: MT.VALUE_2A3448,
    sky: horrorSky({ night: [MT.VALUE_03060E, MT.VALUE_0C1830, MT.VALUE_24365A, MT.VALUE_4A5A7A], moonCol: MT.F4F0DC, mr: 70, mx: 0.58, my: 0.22, wispCol: MT.VALUE_34446A }),
    layers: [
      {
        depth: 0.05,
        blur: 1.6,
        draw: (g, x0, x1, tp) => {
          peaks(g, x0, x1, far(MT.VALUE_2A3650, tp, ts(tp, 0.45, 0.35, 0.25)), 700, 240, 460, 110, 4, null);
          mist(g, x0, x1, -110, 90, haze(tp), 0.55, 1, 320);
        },
      },
      {
        depth: 0.14,
        blur: 0.8,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_121C28, tp, ts(tp, 0.4, 0.3, 0.12));
          spread(x0, x1, 30, 9, (x, h) => pine(g, x, -60, 110 + h * 150 + U.fbm(x / 500, 3) * 120, c, { ink: false }));
          flat(g, x0 - 50, -66, x1 - x0 + 100, 10, c);
        },
      },
      {
        depth: 0.3,
        draw: (g, x0, x1, tp) => {
          const top = nt(MT.VALUE_3A5070, tp, 0.5),
            bot = nt(MT.VALUE_0E1A2C, tp, 0.4);
          water(g, x0, x1, -150, 70, top, bot, tp, 3);
          reflect(g, mid(x0, x1) + 200, -148, 60, 120, isN(tp) ? MT.F4F0DC : MT.FFE0A0, 0.45);
          const c = far(MT.VALUE_121C28, tp, ts(tp, 0.4, 0.3, 0.12));
          g.save();
          g.globalAlpha = 0.35;
          g.scale(1, -0.35);
          spread(x0, x1, 30, 9, (x, h) => pine(g, x, 420, 110 + h * 150 + U.fbm(x / 500, 3) * 120, c, { ink: false }));
          g.restore();
          mist(g, x0, x1, -130, 70, haze(tp), 0.6, 5, 280);
          const bx = mid(x0, x1) - 350;
          put(g, MT.ROWBOAT, bx, -40, { night: isN(tp) }, 0.9, (q) => {
            paint(
              q,
              poly([
                [-130, -40],
                [130, -40],
                [100, 0],
                [-100, 0],
              ]),
              nt(MT.VALUE_5A3A24, tp, 0.4),
              { d: 4, lw: 1.4 },
            );
          });
          g.save();
          g.translate(bx, -30);
          g.scale(0.9, -0.3);
          g.globalAlpha = 0.3;
          A(g, MT.ROWBOAT, 0, 0, { night: isN(tp) }, 1);
          g.restore();
          mist(g, x0, x1, 20, 60, haze(tp), 0.4, 6, 260);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_4A4A3E, tp, 0.5), 3, nt(MT.VALUE_4A5A3A, tp, 0.45));
      water(g, x0, x1, -150, -118, nt(MT.VALUE_2E4260, tp, 0.5), nt(MT.VALUE_4A5A6A, tp, 0.5), tp, 7);
      spread(x0, x1, 90, 4, (x, h) => {
        const y = -116 + h * 40;
        paint(g, ell(x, y, 14 + h * 16, 6 + h * 4), nt([MT.VALUE_6A6A62, MT.VALUE_5A5A54, MT.VALUE_7A766A][Math.floor(h * 3)], tp, 0.5), { d: 2, lw: 1 });
      });
      spread(x0, x1, 700, 2, (x, h) => reeds(g, x, -110, 12, 90 + h * 50, nt(MT.VALUE_3A4A2E, tp, 0.45), Math.floor(x)));
      spread(x0, x1, 3400, 2600, (x) => {
        for (let i = 0; i < 2; i++) box(g, x + i * 150, -190, 16, 120, nt(MT.VALUE_3A2A1C, tp, 0.4), { d: 2 });
        for (let yy = -150; yy < -90; yy += 16) box(g, x - 30, yy, 220, 14, nt(MT.VALUE_6A5236, tp, 0.5), { d: 0, lw: 1 });
      });
      backShade(g, x0, x1, 0.25);
      frontShade(g, x0, x1, H, 0.45);
    },
    front: fogFront(MT.VALUE_8A9AC0, 0.24),
    props: (WW) =>
      props([
        { asset: pick(MT.TREE_PINE), x: WW * 0.12, lane: MT.BACK, scale: 1.2, params: { color: MT.VALUE_14202A } },
        { asset: pick(MT.WHITE_LANTERN, MT.LANTERN), x: WW * 0.64, lane: MT.MID },
        { asset: pick(MT.TREE_PINE), x: WW * 0.9, lane: MT.BACK, scale: 1.3, params: { color: MT.VALUE_14202A } },
      ]),
  });
  const rockBlobs = (g, x0, x1, y0, y1, col, seed, sz) => {
    const r = U.rng(seed);
    flat(g, x0, y0, x1 - x0, y1 - y0, C.shade(col, -0.2));
    const n = Math.min(900, Math.floor(((x1 - x0) * (y1 - y0)) / ((sz || 90) * (sz || 90) * 1.6)));
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0),
        y = y0 + r() * (y1 - y0),
        w = (sz || 90) * (0.6 + r() * 0.9);
      paint(g, ell(x, y, w, w * (0.5 + r() * 0.3), (r() - 0.5) * 0.6), C.shade(col, (r() - 0.5) * 0.25), { d: 6, lw: 1.2, sa: 0.5 });
    }
  };
  const stalactite = (g, x, y, w, h, col) =>
    paint(
      g,
      poly([
        [x - w / 2, y],
        [x - w * 0.2, y + h * 0.6],
        [x, y + h],
        [x + w * 0.18, y + h * 0.55],
        [x + w / 2, y],
      ]),
      col,
      { d: 4, lw: 1.2 },
    );
  const crystals = (g, x, y, s, col) => {
    glowDisc(g, x, y - 30 * s, 110 * s, col, 0.35);
    const r = U.rng(Math.floor(x));
    for (let i = 0; i < 6; i++) {
      const a = (r() - 0.5) * 1.2,
        h = (40 + r() * 70) * s,
        w = (10 + r() * 8) * s;
      const bx = x + (r() - 0.5) * 50 * s;
      g.save();
      g.translate(bx, y);
      g.rotate(a);
      paint(
        g,
        poly([
          [-w / 2, 0],
          [-w / 2, -h * 0.8],
          [0, -h],
          [w / 2, -h * 0.8],
          [w / 2, 0],
        ]),
        C.mix(col, MT.FFFFFF, r() * 0.3),
        { d: 3, lw: 1, glow: col, glowR: 12 },
      );
      g.restore();
    }
  };
  R(MT.CAVE, {
    name: MT.HANG_DONG_TOI,
    category: MT.UNDERGROUND,
    time: MT.INTERIOR_DARK,
    width: 3600,
    tags: [MT.HANG_DONG, MT.DUOI_LONG_DAT, MT.THACH_NHU, MT.DUOC, MT.KHO_BAU, MT.BI_AN, MT.PHIEU_LUU, MT.KINH_DI],
    fog3d: MT.VALUE_100E0C,
    sky: darkSky(MT.VALUE_040403, MT.VALUE_0A0908),
    dust: 0.3,
    layers: [
      {
        depth: 0.55,
        top: 1600,
        draw: (g, x0, x1) => {
          rockBlobs(g, x0, x1, -1600, 40, MT.VALUE_221E1A, 3, 120);
          spread(x0, x1, 900, 400, (x, h) => {
            const p = P();
            p.ellipse(x, -120, 200 + h * 120, 240 + h * 80, 0, PI, 0);
            p.lineTo(x + 300, 40);
            p.lineTo(x - 300, 40);
            fill(g, p, MT.VALUE_070605);
          });
          spread(x0, x1, 70, 5, (x, h) => stalactite(g, x, -620 - h * 80, 30 + h * 30, 60 + h * 140, MT.VALUE_2A2520));
        },
      },
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const col = MT.VALUE_4A4038;
          const p = P();
          p.moveTo(x0 - 50, -1700);
          p.lineTo(x1 + 50, -1700);
          p.lineTo(x1 + 50, -700);
          for (let x = x1 + 50; x > x0 - 60; x -= 60) p.lineTo(x, -700 - U.fbm(x / 300, 4) * 260 - 60);
          p.closePath();
          g.save();
          g.clip(p);
          rockBlobs(g, x0, x1, -1700, -400, col, 7, 80);
          g.restore();
          spread(x0, x1, 46, 9, (x, h) => {
            const base = -700 - U.fbm(x / 300, 4) * 260 - 60;
            if (h < 0.75) stalactite(g, x, base - 10, 22 + h * 50, 50 + h * h * 300, h < 0.2 ? MT.VALUE_6A5E50 : MT.VALUE_5A5046);
          });
          spread(x0, x1, 1300, 0, (x, h) => {
            const p2 = P();
            p2.moveTo(x - 700, 0);
            for (let xx = x - 700; xx <= x - 260; xx += 40) p2.lineTo(xx, -260 - U.fbm(xx / 200, 2) * 180 + (xx - x + 700) * 0.2);
            p2.lineTo(x - 240, 0);
            p2.closePath();
            g.save();
            g.clip(p2);
            rockBlobs(g, x - 720, x - 230, -500, 10, MT.VALUE_463C34, Math.floor(x) + 1, 60);
            g.restore();
            torchW(g, x - 300, -330, 1);
            crystals(g, x + 360, 0, 0.9 + h * 0.4, h > 0.5 ? MT.VALUE_6AC8FF : MT.B07AFF);
            for (let i = 0; i < 4; i++) stalactite(g, x + 120 + i * 60, 0, 40, -(60 + ((i * 37) % 70)), MT.VALUE_5A5046);
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, MT.VALUE_3A332C, 6);
      spread(x0, x1, 160, 3, (x, h) => {
        const y = -130 + h * 380,
          k = 1 + (y + 150) / 300;
        if (h < 0.5) paint(g, ell(x, y, 16 * k * (0.6 + h), 8 * k), MT.VALUE_4E463E, { d: 3, lw: 1 });
      });
      spread(x0, x1, 1600, 900, (x) => {
        g.save();
        g.translate(x, -60);
        g.scale(1, 0.2);
        paint(g, ell(0, 0, 260, 260), MT.VALUE_141C22, { d: 0, ink: false });
        g.restore();
        flat(g, x - 120, -62, 240, 2, MT.RGBA_150_200_255_0_2);
      });
      backShade(g, x0, x1, 0.5);
      frontShade(g, x0, x1, H, 0.6);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.ROCK), x: WW * 0.25, lane: MT.BACK },
        { asset: pick(MT.TREASURE_CHEST), x: WW * 0.6, lane: MT.BACK },
        { asset: pick(MT.CAMPFIRE), x: WW * 0.45, lane: MT.MID },
        { asset: pick(MT.BONE_PILE, MT.SKULL), x: WW * 0.75, lane: MT.MID },
      ]),
    lightsStatic: (WW) => rep(WW, 1300, 0, (x) => [glowL(x - 300, -500, 220, MT.FF9A40, 0.5), glowL(x + 360, -190, 160, MT.VALUE_7AB8FF, 0.25)]),
  });
  const plank = (g, x, y, w, h, col) => box(g, x, y, w, h, col, { d: 0, lw: 1 });
  const westFront = (g, x, w, h, col, tp, sign, seed) => {
    const r = U.rng(seed);
    const top = -h;
    const p = P();
    const kind = r();
    p.moveTo(x, 0);
    p.lineTo(x, top + 60);
    if (kind < 0.4) {
      p.lineTo(x + w * 0.15, top + 60);
      p.lineTo(x + w * 0.15, top);
      p.lineTo(x + w * 0.85, top);
      p.lineTo(x + w * 0.85, top + 60);
    } else if (kind < 0.7) {
      p.lineTo(x + w / 2, top - 30);
    } else p.lineTo(x, top);
    if (kind >= 0.7) p.lineTo(x + w, top);
    p.lineTo(x + w, top + 60);
    p.lineTo(x + w, 0);
    p.closePath();
    g.save();
    g.clip(p);
    planksH(g, x, x + w, top - 40, 0, col, 26, seed);
    for (let i = 0; i < 4; i++) {
      if (r() < 0.5) continue;
      flat(g, x + r() * (w - 80), top + 80 + r() * (h - 200), 50 + r() * 60, 24, MT.VALUE_0A0806);
    }
    g.restore();
    paint(g, p, MT.RGBA_0_0_0_0, { d: 0, lw: 1.6 });
    const sw = w * 0.7;
    g.save();
    g.translate(x + w / 2, top + 100);
    g.rotate((r() - 0.5) * 0.12);
    box(g, -sw / 2, -30, sw, 52, nt(MT.D8C8A0, tp, 0.5), { d: 2 });
    g.fillStyle = nt(MT.VALUE_3A2014, tp, 0.4);
    g.font = MT.BOLD + Math.round(Math.min(34, (sw / sign.length) * 1.5)) + MT.PX_SERIF;
    g.textAlign = MT.CENTER;
    g.fillText(sign, 0, 8);
    g.restore();
    const wy = -h * 0.55;
    for (const s of [-1, 1]) {
      const wx = x + w / 2 + s * w * 0.26;
      box(g, wx - 40, wy - 70, 80, 90, MT.VALUE_0E0A08, { lw: 1.2 });
      if (r() < 0.6) {
        g.save();
        g.translate(wx, wy - 25);
        plank(g, -50, -8, 100, 14, nt(MT.VALUE_7A5A3A, tp, 0.4));
        g.rotate(0.5);
        plank(g, -50, -8, 100, 14, nt(MT.VALUE_8A6A42, tp, 0.4));
        g.restore();
      } else {
        g.strokeStyle = MT.RGBA_200_200_190_0_4;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(wx - 40, wy - 70);
        g.lineTo(wx + 5, wy - 20);
        g.lineTo(wx - 20, wy + 20);
        g.moveTo(wx + 5, wy - 20);
        g.lineTo(wx + 40, wy - 40);
        g.stroke();
      }
    }
    box(g, x - 10, -200, w + 20, 16, nt(MT.VALUE_5A3E26, tp, 0.4), { d: 2 });
    for (let i = 0; i <= 3; i++) box(g, x + (i * (w - 12)) / 3, -184, 12, 184, nt(MT.VALUE_4A321E, tp, 0.4), { d: 2 });
    const dx = x + w / 2;
    box(g, dx - 50, -170, 100, 170, MT.VALUE_0A0806);
    box(g, dx - 46, -140, 44, 80, nt(MT.VALUE_8A6A42, tp, 0.4), { d: 2 });
    g.save();
    g.translate(dx + 26, -100);
    g.rotate(0.18);
    box(g, -22, -40, 44, 80, nt(MT.VALUE_8A6A42, tp, 0.4), { d: 2 });
    g.restore();
    const px = x + w * (0.12 + r() * 0.1);
    g.save();
    g.translate(px, -120);
    g.rotate((r() - 0.5) * 0.15);
    box(g, -26, -70, 52, 70, nt(MT.E8DCB8, tp, 0.5), { d: 0, lw: 1 });
    g.fillStyle = MT.VALUE_3A2010;
    g.font = MT.BOLD_11PX_SERIF;
    g.textAlign = MT.CENTER;
    g.fillText(MT.WANTED, 0, -56);
    paint(g, ell(0, -36, 10, 12), MT.VALUE_6A5A44, { d: 0, ink: false });
    g.fillRect(-16, -16, 32, 3);
    g.fillRect(-12, -10, 24, 3);
    g.restore();
  };
  const tumbleweed = (g, x, y, s, col) => {
    g.save();
    g.translate(x, y - 40 * s);
    g.scale(s, s);
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.beginPath();
    const r = U.rng(Math.floor(x));
    for (let i = 0; i < 26; i++) {
      const a = r() * PI * 2,
        b = a + 1 + r() * 2;
      g.moveTo(Math.cos(a) * 40, Math.sin(a) * 36);
      g.quadraticCurveTo((r() - 0.5) * 30, (r() - 0.5) * 30, Math.cos(b) * 40, Math.sin(b) * 36);
    }
    g.stroke();
    g.restore();
  };
  R(MT.GHOST_TOWN, {
    name: MT.THI_TRAN_MA_MIEN_VIEN_TAY,
    category: MT.EXTERIOR,
    time: MT.DUSK,
    width: 4200,
    tags: [MT.MIEN_TAY_2, MT.CAO_BOI, MT.THI_TRAN_MA, MT.BO_HOANG, MT.SA_MAC, MT.TRUY_NA, MT.HOANG_HON, MT.BI_AN, MT.KINH_DI],
    ownMoon: false,
    fog3d: MT.VALUE_5A3A3A,
    dust: 0.6,
    sky: mkSky({ night: [MT.VALUE_05060C, MT.VALUE_141A2E, MT.VALUE_2E2A40, MT.VALUE_4A3A44], dusk: [MT.VALUE_2A2244, MT.VALUE_7A3A4A, MT.D8704A, MT.F2B066], day: [MT.VALUE_5A9AD0, MT.A8D0E8, MT.F0DCB0], mx: 0.25, my: 0.18, clouds: 3 }),
    layers: [
      {
        depth: 0.06,
        blur: 1.4,
        draw: (g, x0, x1, tp) => {
          const c = far(ts(tp, MT.B06A44, MT.VALUE_6A3A44, MT.VALUE_1E1E2C), tp, ts(tp, 0.35, 0.25, 0.15));
          spread(x0, x1, 1100, 3, (x, h) => {
            const w = 300 + h * 300,
              ht = 160 + h * 200;
            paint(
              g,
              poly([
                [x - w - 120, 40],
                [x - w, -ht],
                [x + w, -ht - 10],
                [x + w + 140, 40],
              ]),
              c,
              { d: 0, lw: 1.4 },
            );
            flat(g, x - w, -ht, w * 2, 8, C.shade(c, 0.12));
          });
          ridge(g, x0, x1, C.shade(c, -0.1), 60, 0, 7);
        },
      },
      {
        depth: 0.25,
        blur: 0.5,
        draw: (g, x0, x1, tp) => {
          const c = far(ts(tp, MT.VALUE_6A4A32, MT.VALUE_3A2630, MT.VALUE_14141C), tp, 0.15);
          spread(x0, x1, 1600, 500, (x) => {
            for (const s of [-1, 1])
              stroke(
                g,
                [
                  [x + s * 60, 0],
                  [x + s * 40, -260],
                ],
                c,
                8,
                true,
              );
            paint(g, rect(x - 70, -360, 140, 110), c, { d: 0, lw: 1.2 });
            paint(g, ell(x, -360, 70, 16), c, { d: 0, lw: 1.2 });
          });
          spread(x0, x1, 1600, 1250, (x) => {
            stroke(
              g,
              [
                [x, 0],
                [x, -300],
              ],
              c,
              7,
              true,
            );
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * PI * 2;
              stroke(
                g,
                [
                  [x, -300],
                  [x + Math.cos(a) * 60, -300 + Math.sin(a) * 60],
                ],
                c,
                4,
                true,
              );
            }
          });
          ridge(g, x0, x1, c, 20, 0, 11);
        },
      },
      {
        depth: 0.8,
        draw: (g, x0, x1, tp) => {
          const cols = [MT.VALUE_8A5E3A, MT.VALUE_7A5232, MT.VALUE_9A6E44, MT.VALUE_6A4A2E, MT.VALUE_8E6A4A];
          const signs = [MT.EXTRA_2, MT.BANK, MT.HOTEL, MT.JAIL, MT.GENERAL_STORE, MT.UNDERTAKER, MT.BARBER];
          let k = Math.floor(x0 / 4200) * 7;
          spread(x0, x1, 600, 0, (x, h) => {
            k++;
            if (h > 0.86) return;
            const w = 440 + Math.floor(h * 3) * 30;
            westFront(g, x + (600 - w) / 2, w, 420 + h * 200, nt(cols[Math.floor(h * 5)], tp, 0.55), tp, signs[Math.floor(Math.abs(x) / 600) % signs.length], Math.floor(x));
          });
          void k;
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.B08A5A, tp, 0.55), 2);
      box(g, x0 - 10, -150, x1 - x0 + 20, 26, nt(MT.VALUE_6A4A2E, tp, 0.5), { d: 0, ink: false });
      g.strokeStyle = C.rgba(nt(MT.VALUE_6A4A2E, tp, 0.5), 0.5);
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x0, -40);
      g.lineTo(x1, -40);
      g.moveTo(x0, 30);
      g.lineTo(x1, 30);
      g.stroke();
      spread(x0, x1, 900, 300, (x, h) => tumbleweed(g, x, -60 + h * 200, 1 + h * 0.8, nt(MT.VALUE_8A6A40, tp, 0.4)));
      backShade(g, x0, x1, 0.3);
      frontShade(g, x0, x1, H, 0.35);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.HAY_BALE, MT.BARREL), x: WW * 0.22, lane: MT.BACK },
        { asset: pick(MT.COVERED_WAGON), x: WW * 0.7, lane: MT.BACK },
        { asset: pick(MT.BARREL), x: WW * 0.42, lane: MT.BACK },
        { asset: pick(MT.CACTUS), x: WW * 0.88, lane: MT.MID },
        { asset: pick(MT.CROW), x: WW * 0.55, lane: MT.BACK },
      ]),
  });
  const vnRoof = (g, cx, y, w, h, col, o) => {
    o = o || {};
    const p = P();
    const ov = o.over || 50;
    p.moveTo(cx - w / 2 - ov, y);
    p.quadraticCurveTo(cx - w / 2 - ov - 10, y - 16, cx - w / 2 - ov - 26, y - h * 0.32);
    p.quadraticCurveTo(cx - w / 2 + 20, y - h * 0.2, cx - w * 0.3, y - h);
    p.lineTo(cx + w * 0.3, y - h);
    p.quadraticCurveTo(cx + w / 2 - 20, y - h * 0.2, cx + w / 2 + ov + 26, y - h * 0.32);
    p.quadraticCurveTo(cx + w / 2 + ov + 10, y - 16, cx + w / 2 + ov, y);
    p.closePath();
    paint(g, p, col, { d: 8, lw: 1.6 });
    g.save();
    g.clip(p);
    g.strokeStyle = C.rgba(MT.VALUE_000000, 0.18);
    g.lineWidth = 3;
    g.beginPath();
    for (let x = cx - w / 2 - ov; x < cx + w / 2 + ov; x += 18) {
      g.moveTo(x, y);
      g.lineTo(cx + (x - cx) * 0.62, y - h);
    }
    g.stroke();
    g.restore();
    const rc = o.ridge || C.shade(col, -0.25);
    paint(g, rect(cx - w * 0.32, y - h - 14, w * 0.64, 18), rc, { d: 2, lw: 1.4 });
    for (const s of [-1, 1]) {
      const ex = cx + s * w * 0.32;
      paint(
        g,
        poly(
          [
            [ex, y - h + 4],
            [ex + s * 10, y - h - 30],
            [ex + s * 34, y - h - 44],
            [ex + s * 22, y - h - 22],
            [ex + s * 30, y - h - 6],
          ],
          true,
        ),
        rc,
        { d: 0, lw: 1.2 },
      );
    }
    if (o.pearl) {
      paint(g, ell(cx, y - h - 30, 14, 14), o.pearl, { d: 2, lw: 1.2 });
      for (const s of [-1, 1])
        paint(
          g,
          poly(
            [
              [cx + s * 20, y - h - 10],
              [cx + s * 60, y - h - 34],
              [cx + s * 110, y - h - 22],
              [cx + s * 80, y - h - 12],
            ],
            true,
          ),
          rc,
          { d: 0, lw: 1.2 },
        );
    }
  };
  const banyanFB = (tp) => (g) => {
    const trunk = nt(MT.VALUE_3A3026, tp, 0.35),
      leaf = nt(MT.VALUE_1F3A24, tp, 0.45),
      leaf2 = nt(MT.VALUE_2A4A2C, tp, 0.45);
    const r = U.rng(17);
    const can = (col, n, sc) => {
      for (let i = 0; i < n; i++) {
        const a = r() * PI,
          d = 0.3 + r() * 0.7;
        const x = Math.cos(a) * 640 * d * sc,
          y = -560 - Math.sin(a) * 260 * d * sc + 40;
        paint(g, ell(x, y, (120 + r() * 120) * sc, (80 + r() * 60) * sc), col, { d: 10, lw: 1.4, sa: 0.5 });
      }
    };
    can(leaf, 24, 1.05);
    const p = P();
    p.moveTo(-170, 0);
    p.bezierCurveTo(-110, -60, -120, -200, -90, -380);
    p.lineTo(-260, -520);
    p.lineTo(-230, -540);
    p.lineTo(-60, -430);
    p.lineTo(-20, -560);
    p.lineTo(20, -560);
    p.lineTo(50, -430);
    p.lineTo(260, -560);
    p.lineTo(280, -530);
    p.lineTo(90, -380);
    p.bezierCurveTo(110, -200, 100, -60, 190, 0);
    p.closePath();
    paint(g, p, trunk, { d: 10, lw: 1.6 });
    g.strokeStyle = C.rgba(MT.VALUE_000000, 0.25);
    g.lineWidth = 4;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -70 + i * 28;
      g.moveTo(x, -10);
      g.bezierCurveTo(x - 10, -120, x + 12, -220, x - 4 + (i - 3) * 6, -360);
    }
    g.stroke();
    for (let i = 0; i < 26; i++) {
      const x = -560 + r() * 1120;
      if (Math.abs(x) < 110) continue;
      const top = -470 + Math.abs(x) * 0.1 - r() * 40;
      const len = r() < 0.35 ? -top : 120 + r() * 220;
      stroke(
        g,
        [
          [x, top],
          [x + 6, top + len * 0.5, x + (r() - 0.5) * 12, top + len],
        ],
        C.shade(trunk, r() * 0.15),
        r() < 0.35 ? 8 : 3,
        true,
      );
    }
    can(leaf2, 14, 0.8);
  };
  const shrineFB = (tp) => (g) => {
    paint(g, rect(-90, -20, 180, 20), nt(MT.VALUE_7A7468, tp, 0.4), { d: 2, lw: 1.2 });
    paint(g, rect(-70, -150, 140, 130), nt(MT.C8B088, tp, 0.45), { d: 6, lw: 1.4 });
    paint(g, archPath(0, -26, 70, 90), MT.VALUE_1A0E0A, { d: 0, lw: 1.2 });
    vnRoof(g, 0, -146, 150, 60, nt(MT.VALUE_6A3A2A, tp, 0.4), { over: 22, pearl: nt(MT.C8A040, tp, 0.3) });
    paint(g, rect(-20, -60, 40, 26), nt(MT.VALUE_8A6A3A, tp, 0.3), { d: 2, lw: 1 });
    for (let i = -2; i <= 2; i++) {
      stroke(
        g,
        [
          [i * 5, -60],
          [i * 7, -96],
        ],
        MT.C8A070,
        1.6,
      );
      glowDisc(g, i * 7, -96, 10, MT.FF4020, 0.9);
    }
    glowDisc(g, 0, -70, 60, MT.FF8040, isN(tp) ? 0.4 : 0.15);
    g.strokeStyle = MT.RGBA_220_220_220_0_25;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -100);
    g.bezierCurveTo(14, -130, -14, -150, 6, -190);
    g.stroke();
  };
  const vnWell = (g, x, y, tp) => {
    const st = nt(MT.VALUE_7A6E5E, tp, 0.4);
    paint(g, rect(x - 80, y - 90, 160, 90), st, { d: 6, lw: 1.4 });
    paint(g, ell(x, y - 90, 80, 18), C.shade(st, 0.1), { d: 0, lw: 1.4 });
    paint(g, ell(x, y - 90, 64, 12), MT.VALUE_0A0C0A, { d: 0, lw: 1 });
    g.strokeStyle = C.rgba(MT.VALUE_000000, 0.2);
    g.lineWidth = 2;
    for (let yy = y - 70; yy < y; yy += 22) {
      g.beginPath();
      g.moveTo(x - 80, yy);
      g.lineTo(x + 80, yy);
      g.stroke();
    }
    paint(g, ell(x + 54, y - 104, 14, 9), nt(MT.VALUE_6A5A3A, tp, 0.3), { d: 2, lw: 1 });
  };
  const bambooClump = (g, x, y, h, col, seed) => {
    const r = U.rng(seed);
    for (let i = 0; i < 9; i++) {
      const bx = x + (r() - 0.5) * 60,
        lean = (r() - 0.5) * h * 0.5,
        hh = h * (0.7 + r() * 0.35);
      stroke(
        g,
        [
          [bx, y],
          [bx + lean * 0.2, y - hh * 0.6, bx + lean, y - hh],
        ],
        col,
        5,
        false,
      );
      for (let k = 0; k < 5; k++) {
        const t = 0.45 + k * 0.12;
        const lx = bx + lean * t * t,
          ly = y - hh * t;
        paint(g, ell(lx + (r() - 0.5) * 30, ly, 40 + r() * 30, 12 + r() * 8, (r() - 0.5) * 0.8), col, { d: 0, lw: 1 });
      }
    }
  };
  const villageGate = (g, x, y, tp) => {
    const wall = nt(MT.C8BCA0, tp, 0.5),
      dark = nt(MT.VALUE_6A6252, tp, 0.4);
    paint(g, rect(x - 150, y - 300, 300, 300), wall, { d: 8, lw: 1.6 });
    paint(g, archPath(x, y, 130, 210), MT.VALUE_0E0C0A, { d: 0, lw: 1.4 });
    paint(g, rect(x - 170, y - 320, 340, 22), dark, { d: 2, lw: 1.2 });
    vnRoof(g, x, y - 318, 260, 80, nt(MT.VALUE_5A3A2E, tp, 0.4), { over: 26 });
    paint(g, rect(x - 50, y - 286, 100, 40), dark, { d: 0, lw: 1 });
    g.fillStyle = nt(MT.E8D8A0, tp, 0.3);
    for (let i = 0; i < 3; i++) g.fillRect(x - 36 + i * 28, y - 278, 16, 24);
    for (const s of [-1, 1]) {
      paint(g, rect(x + s * 190 - 30, y - 240, 60, 240), wall, { d: 6, lw: 1.4 });
      paint(g, rect(x + s * 190 - 36, y - 256, 72, 18), dark, { d: 2, lw: 1.2 });
      paint(g, ell(x + s * 190, y - 270, 20, 16), dark, { d: 2, lw: 1.2 });
    }
  };
  R(MT.VN_BANYAN_NIGHT, {
    name: MT.GOC_DA_DAU_LANG_DEM_KHUYA,
    category: MT.EXTERIOR,
    time: MT.NIGHT,
    width: 4000,
    tags: [MT.KINH_DI, MT.TRUYEN_MA_VIET_NAM, MT.GOC_DA, MT.DAU_LANG, MT.MIEU, MT.GIENG_LANG, MT.LUY_TRE, MT.DEN_LONG_TRANG, MT.DEM, MT.LANG_QUE, MT.VIET_NAM_2],
    ownMoon: true,
    fog: 0.55,
    fog3d: MT.VALUE_1A2420,
    sky: horrorSky({ night: [MT.VALUE_03060A, MT.VALUE_0A1618, MT.VALUE_1C3030, MT.VALUE_33463E], dusk: [MT.VALUE_1E1A2A, MT.VALUE_5A3A4A, MT.B0604A, MT.D89060], moonCol: MT.F0ECD0, wispCol: MT.VALUE_22363A, mx: 0.7, my: 0.17 }),
    layers: [
      {
        depth: 0.06,
        blur: 1.8,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_1A2A26, tp, ts(tp, 0.5, 0.4, 0.2));
          spread(x0, x1, 150, 4, (x, h) => bambooClump(g, x, 30, 260 + h * 160, c, Math.floor(x)));
          mist(g, x0, x1, -40, 110, haze(tp), 0.55, 1, 300);
        },
      },
      {
        depth: 0.2,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          const c = far(MT.VALUE_16201C, tp, ts(tp, 0.4, 0.3, 0.12));
          spread(x0, x1, 700, 1, (x, h) => {
            if (h > 0.6) return;
            flat(g, x - 120, -110, 240, 120, c);
            vnRoof(g, x, -108, 240, 70, c, { over: 30 });
            if (isN(tp) && h < 0.35) {
              flat(g, x - 30, -80, 30, 36, MT.E8A050);
              glowDisc(g, x - 15, -62, 60, MT.FFA050, 0.3);
            }
          });
          spread(x0, x1, 220, 8, (x, h) => bambooClump(g, x, 20, 220 + h * 140, c, Math.floor(x) + 5));
          mist(g, x0, x1, 0, 100, haze(tp), 0.55, 3, 260);
        },
      },
      {
        depth: 0.5,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const mound = P();
          mound.ellipse(cx, 10, 900, 60, 0, PI, 0);
          paint(g, mound, nt(MT.VALUE_2A3424, tp, 0.4), { d: 0, lw: 1.4 });
          put(g, MT.BANYAN_TREE, cx, 0, { night: isN(tp) }, 1, banyanFB(tp));
          put(g, MT.INCENSE_ALTAR, cx + 300, 0, { night: isN(tp) }, 1, shrineFB(tp));
          vnWell(g, cx - 560, 10, tp);
          const lx = cx - 280,
            ly = -390;
          stroke(
            g,
            [
              [lx, ly - 120],
              [lx, ly - 30],
            ],
            MT.VALUE_1A1410,
            2,
          );
          put(g, MT.WHITE_LANTERN, lx, ly + 60, { night: isN(tp), t: 0 }, 0.9, (q) => {
            paint(q, ell(0, -60, 34, 46), MT.F2EFE4, { d: 4, lw: 1.2 });
            paint(q, rect(-20, -112, 40, 10), MT.VALUE_2A2420, { d: 0, lw: 1 });
            paint(q, rect(-20, -18, 40, 10), MT.VALUE_2A2420, { d: 0, lw: 1 });
            stroke(
              q,
              [
                [0, -8],
                [0, 16],
              ],
              MT.D8D0C0,
              2,
            );
          });
          glowDisc(g, lx, ly, 150, MT.E8F0FF, isN(tp) ? 0.35 : 0.1);
          villageGate(g, cx - 1500, 20, tp);
          mist(g, x0, x1, 20, 90, haze(tp), 0.45, 6, 260);
        },
      },
      {
        depth: 0.85,
        draw: (g, x0, x1, tp) => {
          spread(x0, x1, 1500, 500, (x, h) => {
            bambooClump(g, x, 10, 700 + h * 300, nt(MT.VALUE_1E3020, tp, 0.4), Math.floor(x));
            if (h > 0.5) A(g, MT.BANANA_TREE, x + 260, 10, { night: isN(tp), color: nt(MT.VALUE_2A4A2A, tp, 0.4) }, 1.1);
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_4A4A30, tp, 0.5), 7, nt(MT.VALUE_4A6A34, tp, 0.45));
      const p = P();
      p.moveTo(x0 - 10, -100);
      p.bezierCurveTo(x0 + 500, -110, x1 - 500, -96, x1 + 10, -104);
      p.lineTo(x1 + 10, 10);
      p.bezierCurveTo(x1 - 500, 20, x0 + 500, 0, x0 - 10, 14);
      p.closePath();
      paint(g, p, nt(MT.VALUE_8A6A48, tp, 0.55), { d: 0, ink: false });
      spread(x0, x1, 80, 3, (x, h) => {
        if (h > 0.4) return;
        paint(g, ell(x, -90 + h * 300, 7, 3, h * 6), nt(h < 0.2 ? MT.A08040 : MT.VALUE_6A7A3A, tp, 0.5), { d: 0, ink: false });
      });
      backShade(g, x0, x1, 0.3);
      frontShade(g, x0, x1, H, 0.45);
    },
    front: fogFront(MT.VALUE_8AA0A0, 0.26),
    props: (WW) =>
      props([
        { asset: pick(MT.BANANA_TREE), x: WW * 0.12, lane: MT.BACK },
        { asset: pick(MT.CROW), x: WW * 0.6, lane: MT.BACK },
        { asset: pick(MT.BAMBOO), x: WW * 0.86, lane: MT.BACK },
      ]),
  });
  const roundPillar = (g, x, y0, y1, w, col) => {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, C.shade(col, -0.3));
    gr.addColorStop(0.35, C.shade(col, 0.15));
    gr.addColorStop(1, C.shade(col, -0.4));
    g.fillStyle = gr;
    g.fillRect(x - w / 2, y0, w, y1 - y0);
    paint(g, rect(x - w / 2, y0, w, y1 - y0), MT.RGBA_0_0_0_0, { d: 0, lw: 1.4 });
  };
  const fruitTray = (g, x, y) => {
    paint(g, ell(x, y, 46, 9), MT.B8903A, { d: 2, lw: 1 });
    const cs = [MT.E8C030, MT.D84A2A, MT.VALUE_5A9A3A, MT.E88A2A, MT.C83A4A];
    for (let i = 0; i < 7; i++) paint(g, ell(x - 30 + (i % 4) * 20, y - 12 - Math.floor(i / 4) * 16, 11, 10), cs[i % 5], { d: 3, lw: 1 });
  };
  R(MT.VN_OLD_HOUSE_INTERIOR, {
    name: MT.NHA_CO_VIET_NAM_BAN_DEM,
    category: MT.INTERIOR,
    time: MT.INTERIOR_DARK,
    width: 3200,
    tags: [MT.VIET_NAM_2, MT.NHA_CO, MT.BAN_THO, MT.TO_TIEN, MT.NHANG, MT.DEN_DAU_2, MT.TRUYEN_MA_VIET_NAM, MT.KINH_DI, MT.LANG_QUE, MT.DEM],
    fog3d: MT.VALUE_16100C,
    sky: darkSky(MT.VALUE_050302, MT.VALUE_0C0806),
    dust: 0.4,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          planksV(g, x0, x1, -1700, 0, MT.VALUE_3A2418, 60, 8);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_080504, MT.RGBA_20_12_8_0_5, MT.RGBA_0_0_0_0]);
          spread(x0, x1, 700, 350, (x) => {
            if (Math.abs(x - cx) < 200) return;
            for (let i = 0; i < 4; i++) {
              const px = x - 270 + i * 135;
              box(g, px, -620, 130, 620, MT.VALUE_4A2E1C, { d: 3 });
              box(g, px + 12, -600, 106, 230, MT.VALUE_2A1810, { d: 0 });
              g.strokeStyle = MT.VALUE_5A3A24;
              g.lineWidth = 5;
              g.beginPath();
              for (let yy = -590; yy < -370; yy += 26) {
                g.moveTo(px + 12, yy);
                g.lineTo(px + 118, yy);
              }
              for (let xx = px + 30; xx < px + 118; xx += 26) {
                g.moveTo(xx, -600);
                g.lineTo(xx, -370);
              }
              g.stroke();
              box(g, px + 16, -340, 98, 300, MT.VALUE_3E2616, { d: 2, lw: 1 });
            }
          });
          box(g, x0, -700, x1 - x0, 60, MT.VALUE_3A2214, { d: 6 });
          box(g, x0, -720, x1 - x0, 20, MT.VALUE_5A3A22, { d: 2 });
          spread(x0, x1, 700, 0, (x) => {
            roundPillar(g, x, -1700, -30, 70, MT.VALUE_4A2A1A);
            box(g, x - 50, -40, 100, 40, MT.VALUE_6A6458, { d: 4 });
            paint(g, ell(x, -40, 50, 10), MT.VALUE_7A7468, { d: 0, lw: 1.2 });
          });
          box(g, cx - 330, -660, 660, 660, MT.VALUE_2A160C, { d: 0 });
          box(g, cx - 250, -620, 500, 110, MT.VALUE_7A1A14, { d: 4 });
          g.strokeStyle = MT.C8A040;
          g.lineWidth = 4;
          g.strokeRect(cx - 238, -608, 476, 86);
          g.fillStyle = MT.E0B850;
          for (let i = 0; i < 4; i++) {
            const gx = cx - 150 + i * 100;
            g.fillRect(gx - 16, -590, 32, 6);
            g.fillRect(gx - 3, -596, 6, 50);
            g.fillRect(gx - 20, -566, 40, 5);
            g.fillRect(gx - 12, -552, 8, 14);
            g.fillRect(gx + 6, -552, 8, 14);
          }
          for (const s of [-1, 1]) {
            box(g, cx + s * 300 - 30, -500, 60, 380, MT.VALUE_7A1A14, { d: 3 });
            g.fillStyle = MT.E0B850;
            for (let k = 0; k < 6; k++) {
              const gy = -480 + k * 60;
              g.fillRect(cx + s * 300 - 14, gy, 28, 5);
              g.fillRect(cx + s * 300 - 3, gy, 6, 34);
              g.fillRect(cx + s * 300 - 12, gy + 18, 24, 4);
            }
          }
          for (let i = -1; i <= 1; i++) frame(g, cx + i * 120, -360, 90, 120, MT.VALUE_2A1A10, MT.VALUE_8A8478);
          for (let i = -1; i <= 1; i++) {
            paint(g, ell(cx + i * 120, -428, 18, 22), MT.VALUE_3A3430, { d: 0, ink: false });
            paint(
              g,
              poly([
                [cx + i * 120 - 30, -372],
                [cx + i * 120 - 22, -400],
                [cx + i * 120 + 22, -400],
                [cx + i * 120 + 30, -372],
              ]),
              MT.VALUE_2A2420,
              { d: 0, ink: false },
            );
          }
          box(g, cx - 280, -250, 560, 26, MT.VALUE_5A1E10, { d: 3 });
          box(g, cx - 260, -224, 520, 224, MT.VALUE_4A1A0E, { d: 4 });
          for (let i = 0; i < 3; i++) box(g, cx - 220 + i * 150, -200, 140, 150, MT.VALUE_3A140A, { d: 0, lw: 1 });
          g.strokeStyle = MT.A07A30;
          g.lineWidth = 3;
          for (let i = 0; i < 3; i++) g.strokeRect(cx - 210 + i * 150, -190, 120, 130);
          box(g, cx - 300, -26, 600, 26, MT.VALUE_3A1208, { d: 2 });
          paint(g, ell(cx, -278, 46, 14), MT.VALUE_9A7A3A, { d: 2, lw: 1.2 });
          paint(
            g,
            poly([
              [cx - 44, -280],
              [cx + 44, -280],
              [cx + 36, -320],
              [cx - 36, -320],
            ]),
            MT.A8843A,
            { d: 4, lw: 1.2 },
          );
          paint(g, ell(cx, -320, 40, 10), MT.VALUE_7A5A24, { d: 0, lw: 1 });
          for (let i = -2; i <= 2; i++) {
            stroke(
              g,
              [
                [cx + i * 7, -322],
                [cx + i * 12, -380],
              ],
              MT.C89A6A,
              2,
            );
            glowDisc(g, cx + i * 12, -380, 8, MT.FF3A1A, 1);
          }
          g.strokeStyle = MT.RGBA_220_220_220_0_18;
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(cx, -390);
          g.bezierCurveTo(cx + 30, -440, cx - 30, -480, cx + 10, -540);
          g.stroke();
          for (const s of [-1, 1]) {
            box(g, cx + s * 120 - 6, -320, 12, 70, MT.A8843A, { d: 2 });
            candle(g, cx + s * 120, -320, 30, 1, MT.D84A2A);
            fruitTray(g, cx + s * 210, -252);
          }
          const bx = cx - 980;
          box(g, bx - 260, -170, 520, 30, MT.VALUE_5A3418, { d: 4 });
          box(g, bx - 250, -140, 500, 60, MT.VALUE_3A200E, { d: 3 });
          for (const s of [-1, 1]) box(g, bx + s * 220 - 18, -80, 36, 80, MT.VALUE_3A200E, { d: 2 });
          g.strokeStyle = MT.RGBA_200_170_110_0_3;
          g.lineWidth = 2;
          for (let k = 0; k < 10; k++) {
            g.beginPath();
            g.moveTo(bx - 240 + k * 50, -168);
            g.lineTo(bx - 240 + k * 50 + 30, -142);
            g.stroke();
          }
          paint(g, rrect(bx + 120, -200, 110, 34, 12), MT.VALUE_8A6A4A, { d: 3, lw: 1.2 });
          const tx = cx + 980;
          box(g, tx - 160, -150, 320, 22, MT.VALUE_5A3418, { d: 4 });
          for (const s of [-1, 1]) box(g, tx + s * 130 - 10, -128, 20, 128, MT.VALUE_3A200E, { d: 2 });
          paint(g, ell(tx - 30, -170, 28, 22), MT.D8D0C0, { d: 4, lw: 1.2 });
          for (let i = 0; i < 3; i++) paint(g, rrect(tx + 20 + i * 26, -168, 18, 18, 4), MT.E8E0D0, { d: 2, lw: 1 });
          cobweb(g, x0, -720, 120, 1, 1, 0.2);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_7A4430, MT.VALUE_6A3A28, 8, 1.1);
      backShade(g, x0, x1, 0.5);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.OIL_LAMP, MT.CANDLE), x: WW / 2 - 980 - 100, lane: MT.BACK, y: -40 },
        { asset: pick(MT.CHAIR), x: WW / 2 + 820, lane: MT.BACK },
        { asset: pick(MT.CHAIR), x: WW / 2 + 1140, lane: MT.BACK, facing: MT.LEFT },
      ]),
    lightsStatic: (WW) => [glowL(WW / 2, -530, 200, MT.FF9A50, 0.45), glowL(WW / 2 - 120, -510, 90, MT.FFB060, 0.5), glowL(WW / 2 + 120, -510, 90, MT.FFB060, 0.5), glowL(WW / 2 - 1080, -260, 200, MT.FFB060, 0.45)],
  });
  const dinh = (tp) => (g) => {
    const wood = nt(MT.VALUE_5A2E1E, tp, 0.5),
      roof = nt(MT.VALUE_5A4A42, tp, 0.45);
    paint(g, rect(-640, -70, 1280, 70), nt(MT.VALUE_9A9286, tp, 0.5), { d: 6, lw: 1.6 });
    for (let i = 0; i < 3; i++) paint(g, rect(-200 + i * 0, -70 + i * 0, 400, 1), MT.RGBA_0_0_0_0, { d: 0, ink: false });
    for (let k = 0; k < 4; k++) paint(g, rect(-240 + k * 20, -70 + k * 18 - 0, 480 - k * 40, 18), nt(MT.VALUE_8A8276, tp, 0.5), { d: 2, lw: 1.2 });
    paint(g, rect(-560, -330, 1120, 260), nt(MT.VALUE_3A1E14, tp, 0.5), { d: 0, lw: 1.4 });
    for (let i = 0; i < 9; i++) {
      const x = -520 + i * 130;
      roundPillar(g, x, -340, -70, 34, wood);
      if (i < 8) {
        paint(g, rect(x + 20, -310, 90, 220), nt(MT.VALUE_4A2618, tp, 0.5), { d: 2, lw: 1 });
        g.strokeStyle = C.rgba(MT.VALUE_000000, 0.3);
        g.lineWidth = 3;
        g.beginPath();
        for (let yy = -300; yy < -200; yy += 20) {
          g.moveTo(x + 24, yy);
          g.lineTo(x + 106, yy);
        }
        g.stroke();
      }
    }
    vnRoof(g, 0, -330, 1200, 330, roof, { over: 120, pearl: nt(MT.D8B040, tp, 0.4), ridge: nt(MT.VALUE_4A3A34, tp, 0.4) });
    paint(g, rect(-110, -590, 220, 60), nt(MT.VALUE_7A1A14, tp, 0.5), { d: 2, lw: 1.2 });
    g.fillStyle = nt(MT.E0B850, tp, 0.4);
    for (let i = 0; i < 3; i++) g.fillRect(-80 + i * 60, -575, 40, 30);
  };
  const stele = (tp) => (g) => {
    const st = nt(MT.VALUE_8A8478, tp, 0.5);
    paint(g, ell(0, -24, 90, 34), nt(MT.VALUE_6A6458, tp, 0.5), { d: 6, lw: 1.4 });
    paint(g, ell(80, -36, 26, 18), nt(MT.VALUE_6A6458, tp, 0.5), { d: 4, lw: 1.2 });
    const p = P();
    p.moveTo(-60, -40);
    p.lineTo(-60, -280);
    p.quadraticCurveTo(0, -330, 60, -280);
    p.lineTo(60, -40);
    p.closePath();
    paint(g, p, st, { d: 6, lw: 1.4 });
    g.fillStyle = C.rgba(MT.VALUE_000000, 0.25);
    for (let c = 0; c < 4; c++) for (let rr = 0; rr < 8; rr++) g.fillRect(-40 + c * 22, -250 + rr * 24, 12, 14);
  };
  R(MT.VN_COMMUNAL_COURTYARD, {
    name: MT.SAN_DINH_LANG_VIET,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4200,
    tags: [MT.VIET_NAM_2, MT.DINH_LANG, MT.LICH_SU, MT.LANG_QUE, MT.CAY_DA, MT.BIA_DA, MT.LE_HOI, MT.CO_TRUYEN, MT.PHONG_KIEN],
    sky: mkSky({ night: [MT.VALUE_04070F, MT.VALUE_0E1A30, MT.VALUE_22324E], dusk: [MT.VALUE_2A2A4A, MT.VALUE_8A4A5A, MT.E09060, MT.F4C080], day: [MT.VALUE_5AA0D8, MT.A8D4EE, MT.EEF2E0] }),
    ownMoon: false,
    fog3d: MT.A8B8C0,
    layers: [
      { depth: 0.07, blur: 1.6, draw: (g, x0, x1, tp) => ridge(g, x0, x1, far(MT.VALUE_6A8A9A, tp, 0.45), 200, 90, 3) },
      {
        depth: 0.22,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          spread(x0, x1, 160, 5, (x, h) => bambooClump(g, x, 30, 220 + h * 150, far(MT.VALUE_4A7A3A, tp, 0.25), Math.floor(x)));
          ridge(g, x0, x1, far(MT.VALUE_5A8A3A, tp, 0.2), 20, 0, 4);
        },
      },
      {
        depth: 0.62,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          put(g, MT.BANYAN_TREE, cx - 1150, 0, { night: isN(tp) }, 0.85, banyanFB(tp));
          put(g, MT.VN_COMMUNAL_HOUSE, cx, 0, { night: isN(tp) }, 0.78, dinh(tp));
          spread(x0, x1, 1700, 300, (x) => {
            if (Math.abs(x - cx) < 1500) return;
            A(g, MT.TREE_ROUND, x, 0, { night: isN(tp), seed: Math.floor(x) }, 1.2);
          });
          for (const s of [-1, 1]) {
            const px = cx + s * 760;
            paint(g, rect(px - 40, -340, 80, 340), nt(MT.C8BCA0, tp, 0.5), { d: 6, lw: 1.4 });
            paint(g, rect(px - 52, -360, 104, 24), nt(MT.VALUE_8A8276, tp, 0.5), { d: 2, lw: 1.2 });
            paint(g, ell(px, -380, 24, 22), nt(MT.VALUE_8A8276, tp, 0.5), { d: 3, lw: 1.2 });
          }
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, nt(MT.A8664C, tp, 0.55), nt(MT.VALUE_985A42, tp, 0.55), 2, 0.8);
      box(g, x0 - 10, -150, x1 - x0 + 20, 16, nt(MT.VALUE_8A8276, tp, 0.5), { d: 0, ink: false });
      backShade(g, x0, x1, 0.15);
      frontShade(g, x0, x1, H, 0.25);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.STELE), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.WAR_DRUM, MT.BRONZE_DRUM), x: WW * 0.62, lane: MT.BACK },
        { asset: pick(MT.BONSAI_VN, MT.PLANT_POT), x: WW * 0.72, lane: MT.BACK },
        { asset: pick(MT.RED_LANTERN), x: WW * 0.4, lane: MT.BACK },
      ]).concat(has(MT.STELE) ? [] : []),
  });
  const citadelGate = (tp) => (g) => {
    const brick = nt(MT.VALUE_8A7A6A, tp, 0.5),
      red = nt(MT.VALUE_9A2A1E, tp, 0.5),
      gold = nt(MT.D8A83A, tp, 0.45);
    g.save();
    g.beginPath();
    g.rect(-760, -340, 1520, 340);
    g.clip();
    stoneBlocks(g, -760, 760, -340, 0, brick, 90, 40, 3);
    g.restore();
    paint(g, rect(-760, -340, 1520, 340), MT.RGBA_0_0_0_0, { d: 0, lw: 1.6 });
    paint(g, rect(-780, -360, 1560, 24), nt(MT.VALUE_6A5E52, tp, 0.5), { d: 2, lw: 1.4 });
    for (const [x, w, h] of [
      [0, 170, 250],
      [-400, 120, 200],
      [400, 120, 200],
    ]) {
      archRing(g, x, 0, w, h, 16, nt(MT.A89888, tp, 0.5));
      paint(g, archPath(x, 0, w, h), MT.VALUE_120C0A, { d: 0, lw: 1.4 });
    }
    const pav = (x, w, y, h, tiers) => {
      paint(g, rect(x - w / 2, y - h, w, h), nt(MT.C8A070, tp, 0.5), { d: 4, lw: 1.4 });
      for (let i = 0; i <= 6; i++) roundPillar(g, x - w / 2 + 10 + (i * (w - 20)) / 6, y - h, y, 18, red);
      vnRoof(g, x, y - h, w, 90, gold, { over: 40, ridge: nt(MT.B8862A, tp, 0.4), pearl: tiers > 1 ? gold : null });
      if (tiers > 1) {
        paint(g, rect(x - w * 0.3, y - h - 160, w * 0.6, 80), nt(MT.C8A070, tp, 0.5), { d: 4, lw: 1.4 });
        for (let i = 0; i <= 4; i++) roundPillar(g, x - w * 0.3 + 8 + (i * (w * 0.6 - 16)) / 4, y - h - 160, y - h - 80, 14, red);
        vnRoof(g, x, y - h - 156, w * 0.62, 80, gold, { over: 30, ridge: nt(MT.B8862A, tp, 0.4), pearl: gold });
      }
    };
    pav(-480, 380, -360, 110, 1);
    pav(480, 380, -360, 110, 1);
    pav(0, 520, -360, 140, 2);
    g.strokeStyle = nt(MT.VALUE_5A1A12, tp, 0.4);
    g.lineWidth = 3;
    g.beginPath();
    for (let x = -760; x <= 760; x += 20) {
      g.moveTo(x, -360);
      g.lineTo(x, -400);
    }
    g.stroke();
    paint(g, rect(-780, -404, 1560, 8), nt(MT.VALUE_5A1A12, tp, 0.4), { d: 0, lw: 1 });
  };
  R(MT.VN_CITADEL, {
    name: MT.CONG_HOANG_THANH_CO,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4200,
    tags: [MT.VIET_NAM_2, MT.HOANG_THANH, MT.KINH_THANH_HUE, MT.NGO_MON, MT.VUA, MT.TRIEU_NGUYEN, MT.LICH_SU, MT.CUNG_DINH, MT.HO_SEN],
    sky: mkSky({ night: [MT.VALUE_04070F, MT.VALUE_0E1A30, MT.VALUE_22324E], dusk: [MT.VALUE_2A2A4A, MT.VALUE_8A4A5A, MT.E09060, MT.F4C080], day: [MT.VALUE_4F98D8, MT.VALUE_9FD0EE, MT.F2EEDC] }),
    fog3d: MT.A8B8C8,
    layers: [
      { depth: 0.06, blur: 1.6, draw: (g, x0, x1, tp) => ridge(g, x0, x1, far(MT.VALUE_6A8AA0, tp, 0.45), 160, 110, 8) },
      {
        depth: 0.3,
        blur: 0.4,
        draw: (g, x0, x1, tp) => {
          const c = nt(MT.VALUE_7A6E60, tp, 0.5);
          g.save();
          g.beginPath();
          g.rect(x0 - 50, -170, x1 - x0 + 100, 200);
          g.clip();
          stoneBlocks(g, x0 - 50, x1 + 50, -170, 30, c, 80, 34, 9);
          g.restore();
          box(g, x0 - 50, -184, x1 - x0 + 100, 16, nt(MT.VALUE_5A5248, tp, 0.5));
          spread(x0, x1, 700, 3, (x) => A(g, MT.TREE_ROUND, x, -170, { night: isN(tp), seed: Math.floor(x) }, 0.7));
        },
      },
      {
        depth: 0.6,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          put(g, MT.VN_CITADEL_GATE, cx, 0, { night: isN(tp) }, 0.74, citadelGate(tp));
          for (const s of [-1, 1])
            for (let k = 0; k < 2; k++) {
              const px = cx + s * (980 + k * 260);
              stroke(
                g,
                [
                  [px, 0],
                  [px, -620],
                ],
                nt(MT.A82A1E, tp, 0.4),
                12,
                true,
              );
              paint(g, ell(px, -626, 12, 12), nt(MT.D8A83A, tp, 0.4), { d: 2, lw: 1 });
              const fc = k ? nt(MT.D8A83A, tp, 0.4) : nt(MT.C8281E, tp, 0.4);
              paint(
                g,
                poly(
                  [
                    [px + 6, -610],
                    [px + 70, -590],
                    [px + 60, -470],
                    [px + 80, -360],
                    [px + 6, -400],
                  ],
                  true,
                ),
                fc,
                { d: 4, lw: 1.2 },
              );
              paint(g, rect(px - 40, -20, 80, 20), nt(MT.VALUE_8A8276, tp, 0.5), { d: 2, lw: 1.2 });
            }
        },
      },
      {
        depth: 0.85,
        draw: (g, x0, x1, tp) => {
          water(g, x0, x1, -60, 0, nt(MT.VALUE_4A7A6A, tp, 0.5), nt(MT.VALUE_2A5A4A, tp, 0.5), tp, 3);
          spread(x0, x1, 70, 5, (x, h) => {
            paint(g, ell(x, -40 + h * 30, 28, 8), nt(MT.VALUE_3A7A3A, tp, 0.45), { d: 2, lw: 1 });
            if (h < 0.3) {
              stroke(
                g,
                [
                  [x + 10, -36],
                  [x + 12, -80],
                ],
                nt(MT.VALUE_3A6A2A, tp, 0.4),
                3,
              );
              paint(g, ell(x + 12, -88, 10, 12), nt(MT.F08AA8, tp, 0.4), { d: 3, lw: 1 });
            }
          });
          box(g, x0 - 50, -10, x1 - x0 + 100, 16, nt(MT.A8A094, tp, 0.5), { d: 2 });
          for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) box(g, x, -40, 12, 30, nt(MT.A8A094, tp, 0.5), { lw: 1 });
          box(g, x0 - 50, -52, x1 - x0 + 100, 12, nt(MT.B8B0A4, tp, 0.5), { d: 0 });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, nt(MT.B8B0A2, tp, 0.55), nt(MT.A8A092, tp, 0.55), 5, 1.4);
      backShade(g, x0, x1, 0.15);
      frontShade(g, x0, x1, H, 0.25);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.RED_LANTERN), x: WW * 0.32, lane: MT.BACK },
        { asset: pick(MT.BONSAI_VN, MT.PLANT_POT), x: WW * 0.2, lane: MT.BACK },
        { asset: pick(MT.BONSAI_VN, MT.PLANT_POT), x: WW * 0.8, lane: MT.BACK },
        { asset: pick(MT.RED_LANTERN), x: WW * 0.68, lane: MT.BACK },
      ]),
  });
  const daySky = (o) => mkSky(Object.assign({ night: [MT.VALUE_04070F, MT.VALUE_0E1A30, MT.VALUE_22324E], dusk: [MT.VALUE_2A2A4A, MT.VALUE_8A4A5A, MT.E09060, MT.F4C080], day: [MT.VALUE_4F98D8, MT.VALUE_9FD0EE, MT.F2EEDC] }, o || {}));
  const pyramid = (g, x, y, w, h, light, dark, tp) => {
    paint(
      g,
      poly([
        [x - w / 2, y],
        [x + w * 0.08, y - h],
        [x + w * 0.16, y],
      ]),
      light,
      { d: 0, lw: 1.6 },
    );
    paint(
      g,
      poly([
        [x + w * 0.16, y],
        [x + w * 0.08, y - h],
        [x + w / 2, y],
      ]),
      dark,
      { d: 0, lw: 1.6 },
    );
    g.strokeStyle = C.rgba(MT.VALUE_000000, 0.1);
    g.lineWidth = 2;
    g.beginPath();
    for (let k = 1; k < 14; k++) {
      const t = k / 14;
      const yy = y - h * t;
      g.moveTo(x - w / 2 + w * 0.58 * t, yy);
      g.lineTo(x + w / 2 - w * 0.42 * t, yy);
    }
    g.stroke();
    void tp;
  };
  const sphinxFB = (tp) => (g) => {
    const s = nt(MT.D0A868, tp, 0.5),
      d = nt(MT.A8824A, tp, 0.5);
    paint(g, rect(-360, -40, 720, 40), d, { d: 2, lw: 1.4 });
    paint(
      g,
      poly(
        [
          [-340, -40],
          [-330, -150],
          [-120, -190],
          [120, -170],
          [180, -110],
          [330, -100],
          [360, -40],
        ],
        true,
      ),
      s,
      { d: 10, lw: 1.6 },
    );
    paint(g, rect(160, -80, 200, 40), s, { d: 4, lw: 1.2 });
    paint(
      g,
      poly([
        [70, -170],
        [70, -330],
        [190, -330],
        [200, -170],
      ]),
      s,
      { d: 6, lw: 1.4 },
    );
    paint(
      g,
      poly([
        [40, -170],
        [60, -350],
        [130, -380],
        [210, -350],
        [230, -170],
        [200, -200],
        [180, -300],
        [80, -300],
        [70, -200],
      ]),
      nt(MT.C89A4A, tp, 0.5),
      { d: 4, lw: 1.4 },
    );
    g.strokeStyle = nt(MT.VALUE_4A5A8A, tp, 0.4);
    g.lineWidth = 6;
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      g.moveTo(60 + i * 4, -320 + i * 30);
      g.lineTo(80, -320 + i * 30);
      g.moveTo(200 + i * 5, -320 + i * 30);
      g.lineTo(220, -320 + i * 30);
    }
    g.stroke();
    paint(g, ell(130, -260, 34, 44), nt(MT.C49A5E, tp, 0.5), { d: 4, lw: 1.2 });
    g.fillStyle = MT.VALUE_3A2A1A;
    g.fillRect(112, -272, 12, 4);
    g.fillRect(138, -272, 12, 4);
  };
  const obeliskFB = (tp) => (g) => {
    const s = nt(MT.C8A46A, tp, 0.5);
    paint(g, rect(-50, -30, 100, 30), nt(MT.A8844A, tp, 0.5), { d: 2, lw: 1.2 });
    paint(
      g,
      poly([
        [-34, -30],
        [-24, -560],
        [0, -610],
        [24, -560],
        [34, -30],
      ]),
      s,
      { d: 8, lw: 1.4 },
    );
    paint(
      g,
      poly([
        [-24, -560],
        [0, -610],
        [24, -560],
      ]),
      nt(MT.E8C050, tp, 0.4),
      { d: 0, lw: 1.2 },
    );
    g.fillStyle = C.rgba(MT.VALUE_3A2A10, 0.35);
    for (let k = 0; k < 18; k++) g.fillRect(-10 + (k % 2) * 6, -520 + k * 26, 12, 12);
  };
  const palm = (g, x, y, s, tp) => A(g, MT.TREE_PALM, x, y, { night: isN(tp), color: nt(MT.VALUE_3A7A3A, tp, 0.5), seed: Math.floor(x) }, s);
  const dunes = (g, x0, x1, col, amp, base, seed) => {
    ridge(g, x0, x1, col, amp, base, seed, { d: 0 }, 1400);
    const p = P();
    p.moveTo(x0 - 100, 80);
    for (let x = x0 - 100; x <= x1 + 160; x += 50) p.lineTo(x, -base - (U.fbm(x / 1400, seed) * 0.5 + 0.5) * amp + 8);
    p.lineTo(x1 + 160, 80);
    g.save();
    g.clip(p);
    g.fillStyle = C.rgba(MT.VALUE_000000, 0.08);
    g.fillRect(x0, -base - amp, x1 - x0, amp + base + 80);
    g.restore();
  };
  R(MT.EGYPT_PYRAMIDS, {
    name: MT.KIM_TU_THAP_AI_CAP,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4400,
    tags: [MT.AI_CAP_2, MT.KIM_TU_THAP_2, MT.PHARAOH, MT.NHAN_SU, MT.SA_MAC, MT.CO_DAI, MT.LICH_SU, MT.KHAO_CO, MT.GIZA],
    dust: 0.35,
    fog3d: MT.E8C890,
    sky: daySky({ day: [MT.VALUE_3F88C8, MT.VALUE_8EC4E4, MT.F6E2B4], clouds: 2 }),
    layers: [
      {
        depth: 0.05,
        blur: 1.2,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const l = far(MT.E8C888, tp, 0.35),
            d = far(MT.B8925A, tp, 0.35);
          pyramid(g, cx - 900, 40, 900, 520, l, d, tp);
          pyramid(g, cx - 250, 40, 760, 440, l, d, tp);
          pyramid(g, cx + 400, 40, 420, 240, l, d, tp);
          dunes(g, x0, x1, far(MT.E0B878, tp, 0.3), 80, -20, 5);
        },
      },
      {
        depth: 0.22,
        blur: 0.3,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          dunes(g, x0, x1, nt(MT.E4BC7C, tp, 0.5), 110, -40, 9);
          put(g, MT.SPHINX, cx + 700, 20, { night: isN(tp) }, 0.85, sphinxFB(tp));
          spread(x0, x1, 1500, 200, (x) => {
            for (let i = 0; i < 3; i++) palm(g, x + i * 90, 10, 0.6 + i * 0.08, tp);
          });
        },
      },
      {
        depth: 0.65,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          dunes(g, x0, x1, nt(MT.E8C288, tp, 0.5), 50, -10, 13);
          put(g, MT.OBELISK, cx - 650, 10, { night: isN(tp) }, 0.9, obeliskFB(tp));
          put(g, MT.OBELISK, cx + 1250, 10, { night: isN(tp) }, 0.75, obeliskFB(tp));
          spread(x0, x1, 2200, 1500, (x) => {
            palm(g, x, 10, 1.1, tp);
            palm(g, x + 140, 10, 0.9, tp);
          });
          spread(x0, x1, 900, 400, (x, h) => {
            if (h > 0.5) return;
            paint(g, rect(x - 40, -110, 80, 110), nt(MT.C8A46A, tp, 0.5), { d: 6, lw: 1.4 });
            paint(g, rect(x - 50, -130, 100, 24), nt(MT.D8B47A, tp, 0.5), { d: 2, lw: 1.2 });
            paint(g, rect(x + 50, -40, 70, 40), nt(MT.B8945A, tp, 0.5), { d: 4, lw: 1.2 });
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.E2BC80, tp, 0.55), 4);
      g.strokeStyle = C.rgba(MT.A87A40, 0.3);
      g.lineWidth = 3;
      g.beginPath();
      for (let y = -120; y < H; y += 46 + (y + 150) * 0.15) {
        g.moveTo(x0, y);
        for (let x = Math.floor(x0 / 80) * 80; x <= x1 + 80; x += 80) g.quadraticCurveTo(x - 40, y - 8, x, y);
      }
      g.stroke();
      backShade(g, x0, x1, 0.08);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CAMEL), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.AMPHORA), x: WW * 0.62, lane: MT.MID },
        { asset: pick(MT.TREE_PALM), x: WW * 0.85, lane: MT.BACK },
        { asset: pick(MT.STELE, MT.ROCK), x: WW * 0.12, lane: MT.BACK },
      ]),
  });
  const egyFigure = (g, x, y, s, seed, animal) => {
    const r = U.rng(seed);
    const skin = r() < 0.5 ? MT.A85A2A : MT.C88A4A;
    const f = r() < 0.5 ? 1 : -1;
    g.save();
    g.translate(x, y);
    g.scale(s * f, s);
    paint(
      g,
      poly([
        [-22, 0],
        [-14, -60],
        [14, -60],
        [26, 0],
      ]),
      MT.F0EAD8,
      { d: 0, lw: 1 },
    );
    flat(g, -10, -60, 6, 0, skin);
    paint(g, rect(-8, -2, 6, 0), skin, { d: 0, ink: false });
    stroke(
      g,
      [
        [-6, 0],
        [-10, 20],
      ],
      skin,
      6,
    );
    paint(
      g,
      poly([
        [-14, -60],
        [-18, -116],
        [18, -116],
        [14, -60],
      ]),
      skin,
      { d: 0, lw: 1 },
    );
    paint(g, rect(-20, -122, 40, 10), [MT.VALUE_3A7AA8, MT.C8A030, MT.A83A2A][Math.floor(r() * 3)], { d: 0, lw: 1 });
    stroke(
      g,
      [
        [14, -110],
        [40, -96],
        [52, -112],
      ],
      skin,
      6,
    );
    if (animal) {
      paint(
        g,
        poly([
          [-12, -122],
          [-14, -150],
          [-6, -176],
          [0, -150],
          [6, -176],
          [12, -150],
          [32, -140],
          [12, -128],
        ]),
        MT.VALUE_1E1A18,
        { d: 0, lw: 1 },
      );
    } else {
      paint(g, ell(2, -140, 14, 18), skin, { d: 0, lw: 1 });
      paint(
        g,
        poly([
          [-16, -150],
          [12, -160],
          [16, -142],
          [6, -122],
          [-18, -118],
        ]),
        MT.VALUE_141414,
        { d: 0, lw: 1 },
      );
      flat(g, 8, -144, 6, 3, MT.VALUE_141414);
    }
    g.restore();
  };
  const glyphs = (g, x, y0, y1, w, seed) => {
    const r = U.rng(seed);
    g.fillStyle = MT.RGBA_60_30_10_0_75;
    g.strokeStyle = MT.RGBA_60_30_10_0_75;
    g.lineWidth = 3;
    for (let y = y0 + 6; y < y1 - 24; y += 30) {
      const k = Math.floor(r() * 6);
      const cx = x + w / 2;
      g.beginPath();
      if (k === 0) g.ellipse(cx, y + 10, 9, 9, 0, 0, PI * 2);
      else if (k === 1) {
        g.moveTo(cx - 10, y + 20);
        g.lineTo(cx, y);
        g.lineTo(cx + 10, y + 20);
      } else if (k === 2) {
        g.ellipse(cx, y + 6, 6, 6, 0, 0, PI * 2);
        g.moveTo(cx, y + 12);
        g.lineTo(cx, y + 24);
        g.moveTo(cx - 8, y + 16);
        g.lineTo(cx + 8, y + 16);
      } else if (k === 3) {
        g.moveTo(cx - 12, y + 18);
        g.quadraticCurveTo(cx, y - 2, cx + 12, y + 18);
      } else if (k === 4) {
        g.rect(cx - 10, y + 4, 20, 14);
      } else {
        g.moveTo(cx - 10, y + 6);
        g.lineTo(cx + 10, y + 6);
        g.moveTo(cx - 6, y + 14);
        g.lineTo(cx + 6, y + 14);
      }
      g.stroke();
    }
  };
  const brazierFB = (g) => {
    stroke(
      g,
      [
        [-30, 0],
        [0, -90],
      ],
      MT.VALUE_4A3A2A,
      6,
      true,
    );
    stroke(
      g,
      [
        [30, 0],
        [0, -90],
      ],
      MT.VALUE_4A3A2A,
      6,
      true,
    );
    paint(
      g,
      poly([
        [-44, -110],
        [44, -110],
        [26, -80],
        [-26, -80],
      ]),
      MT.A8742A,
      { d: 4, lw: 1.2 },
    );
    flame(g, -12, -108, 1.6, 0);
    flame(g, 12, -108, 1.8, 0);
    flame(g, 0, -112, 2.2, 0.5);
  };
  const lotusCol = (g, x, y0, y1, w, col, band) => {
    roundPillar(g, x, y0, y1, w, col);
    for (let k = 0; k < 4; k++) flat(g, x - w / 2, y0 + 40 + k * 22, w, 8, band[k % band.length]);
    paint(
      g,
      poly(
        [
          [x - w / 2, y0],
          [x - w * 0.9, y0 - 70],
          [x + w * 0.9, y0 - 70],
          [x + w / 2, y0],
        ],
        false,
      ),
      col,
      { d: 6, lw: 1.4 },
    );
    paint(g, rect(x - w * 0.95, y0 - 90, w * 1.9, 22), C.shade(col, -0.1), { d: 2, lw: 1.2 });
    for (let k = -2; k <= 2; k++)
      stroke(
        g,
        [
          [x + k * w * 0.3, y0 - 6],
          [x + k * w * 0.4, y0 - 60],
        ],
        band[0],
        4,
      );
  };
  R(MT.EGYPT_TOMB, {
    name: MT.LANG_MO_PHARAOH,
    category: MT.UNDERGROUND,
    time: MT.INTERIOR,
    width: 3600,
    tags: [MT.AI_CAP_2, MT.LANG_MO, MT.PHARAOH, MT.XAC_UOP_2, MT.CHU_TUONG_HINH, MT.KHO_BAU, MT.QUAN_TAI_2, MT.LOI_NGUYEN, MT.KHAO_CO, MT.KINH_DI, MT.LICH_SU],
    fog3d: MT.VALUE_2A1E10,
    sky: darkSky(MT.VALUE_070503, MT.VALUE_120C06),
    dust: 0.6,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const sand = MT.C8A068;
          stoneBlocks(g, x0, x1, -1700, 0, sand, 160, 80, 4, MT.RGBA_80_50_20_0_25);
          box(g, x0, -1700, x1 - x0, 1000, MT.VALUE_1A2A4A, { ink: false });
          const r = U.rng(5);
          g.fillStyle = MT.D8B850;
          for (let i = 0; i < (x1 - x0) / 12; i++) {
            const sx = x0 + r() * (x1 - x0),
              sy = -1700 + r() * 960;
            g.beginPath();
            for (let k = 0; k < 5; k++) {
              const a = -PI / 2 + (k * 4 * PI) / 5;
              g.lineTo(sx + Math.cos(a) * 7, sy + Math.sin(a) * 7);
            }
            g.fill();
          }
          box(g, x0, -720, x1 - x0, 40, MT.VALUE_2A4A8A);
          for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) {
            flat(g, x, -720, 20, 40, (x / 40) % 2 ? MT.C83A2A : MT.D8B040);
            flat(g, x + 20, -720, 20, 40, MT.VALUE_2A7A6A);
          }
          box(g, x0, -680, x1 - x0, 12, MT.VALUE_2A1A10);
          spread(x0, x1, 900, 450, (x) => {
            box(g, x - 330, -560, 660, 420, MT.E0C088, { d: 0 });
            g.strokeStyle = MT.VALUE_8A3A1A;
            g.lineWidth = 6;
            g.strokeRect(x - 330, -560, 660, 420);
            for (let k = 0; k < 9; k++) glyphs(g, x - 320 + k * 36, -550, -380, 36, Math.floor(x) + k);
            for (let k = 0; k < 4; k++) egyFigure(g, x - 240 + k * 160, -160, 1, Math.floor(x) + k * 7, k === 1);
            box(g, x - 330, -380, 660, 6, MT.VALUE_8A3A1A);
          });
          spread(x0, x1, 900, 0, (x) => lotusCol(g, x, -600, 0, 90, MT.D8B47A, [MT.VALUE_2A6A8A, MT.C83A2A, MT.D8A830]));
          box(g, x0, -130, x1 - x0, 130, MT.VALUE_2A1A10, { ink: false });
          for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) {
            flat(g, x, -120, 30, 8, MT.C83A2A);
            flat(g, x + 30, -120, 30, 8, MT.VALUE_2A6A8A);
          }
          box(g, x0, -110, x1 - x0, 6, MT.D8A830);
          spread(x0, x1, 900, 450, (x, h) => {
            const gx = x + (h - 0.5) * 300;
            for (let i = 0; i < 9; i++) paint(g, ell(gx - 60 + i * 15, -12 - (i % 3) * 10, 18, 9), i % 2 ? MT.E8C040 : MT.D8A830, { d: 2, lw: 1 });
            paint(g, rect(gx + 70, -70, 60, 70), MT.VALUE_8A5A2A, { d: 4, lw: 1.2 });
            paint(g, rect(gx + 64, -80, 72, 12), MT.D8A830, { d: 2, lw: 1.2 });
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.A8844E, MT.VALUE_987440, 3, 1.6);
      grain(g, Math.floor(x0 / 400) * 400, x1, -150, H, MT.RGBA_240_210_150_0_12, 26, 6, 5, 2);
      backShade(g, x0, x1, 0.4);
      frontShade(g, x0, x1, H, 0.55);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.SARCOPHAGUS, MT.COFFIN), x: WW * 0.5, lane: MT.BACK },
        { asset: pick(MT.BRAZIER, MT.CAMPFIRE), x: WW * 0.35, lane: MT.BACK },
        { asset: pick(MT.BRAZIER, MT.CAMPFIRE), x: WW * 0.65, lane: MT.BACK },
        { asset: pick(MT.AMPHORA), x: WW * 0.25, lane: MT.MID },
        { asset: pick(MT.AMPHORA), x: WW * 0.75, lane: MT.MID },
        { asset: pick(MT.TREASURE_CHEST), x: WW * 0.82, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => [glowL(WW * 0.35, -330, 260, MT.FFA040, 0.55), glowL(WW * 0.65, -330, 260, MT.FFA040, 0.55)].concat(rep(WW, 900, 0, (x) => glowL(x, -500, 160, MT.FF9A40, 0.2))),
  });
  const templeFacade = (g, x, y, w, h, n, col, tp, o) => {
    o = o || {};
    const st = nt(col, tp, 0.5),
      sh = C.shade(st, -0.18);
    for (let k = 0; k < 3; k++) paint(g, rect(x - w / 2 - 30 + k * 10, y - 20 - k * 20, w + 60 - k * 20, 22), C.shade(st, -0.04 * k), { d: 2, lw: 1.2 });
    const top = y - 60 - h;
    const cw = w / (n * 1.6);
    if (o.wall) paint(g, rect(x - w / 2 + cw, top, w - cw * 2, h), sh, { d: 0, lw: 1 });
    for (let i = 0; i < n; i++) {
      const cx = x - w / 2 + cw / 2 + (i * (w - cw)) / (n - 1);
      if (o.broken && o.broken.includes(i)) {
        const bh = h * (0.3 + ((i * 37) % 40) / 100);
        roundPillar(g, cx, y - 60 - bh, y - 60, cw, st);
        continue;
      }
      roundPillar(g, cx, top, y - 60, cw, st);
      g.strokeStyle = C.rgba(MT.VALUE_000000, 0.12);
      g.lineWidth = 2;
      g.beginPath();
      for (let k = -1; k <= 1; k++) {
        g.moveTo(cx + k * cw * 0.25, top);
        g.lineTo(cx + k * cw * 0.25, y - 60);
      }
      g.stroke();
      paint(g, rect(cx - cw * 0.65, top - 14, cw * 1.3, 14), st, { d: 2, lw: 1.2 });
    }
    if (o.broken && o.broken.length > n / 2) return;
    paint(g, rect(x - w / 2 - 10, top - 64, w + 20, 50), st, { d: 4, lw: 1.4 });
    for (let k = 0; k < w / 40; k++) flat(g, x - w / 2 + k * 40 + 10, top - 56, 14, 20, sh);
    paint(
      g,
      poly([
        [x - w / 2 - 24, top - 64],
        [x, top - 64 - w * 0.16],
        [x + w / 2 + 24, top - 64],
      ]),
      st,
      { d: 6, lw: 1.4 },
    );
    paint(
      g,
      poly([
        [x - w / 2 + 30, top - 72],
        [x, top - 58 - w * 0.14],
        [x + w / 2 - 30, top - 72],
      ]),
      sh,
      { d: 0, lw: 1 },
    );
    if (o.roof)
      paint(
        g,
        poly([
          [x - w / 2 - 30, top - 66],
          [x, top - 70 - w * 0.17],
          [x + w / 2 + 30, top - 66],
          [x + w / 2 + 30, top - 60],
          [x - w / 2 - 30, top - 60],
        ]),
        nt(o.roof, tp, 0.5),
        { d: 0, lw: 1.2 },
      );
  };
  const romanArchFB = (tp) => (g) => {
    const st = nt(MT.E0D6C2, tp, 0.5);
    paint(g, rect(-300, -460, 600, 460), st, { d: 8, lw: 1.6 });
    archRing(g, 0, 0, 180, 300, 18, C.shade(st, 0.05));
    paint(g, archPath(0, 0, 180, 300), nt(MT.VALUE_3A3430, tp, 0.4), { d: 0, lw: 1.4 });
    for (const s of [-1, 1]) {
      archRing(g, s * 200, 0, 70, 150, 10, C.shade(st, 0.05));
      paint(g, archPath(s * 200, 0, 70, 150), nt(MT.VALUE_3A3430, tp, 0.4), { d: 0, lw: 1.2 });
      for (const k of [120, 270]) {
        roundPillar(g, s * k, -380, -20, 26, C.shade(st, 0.06));
        paint(g, rect(s * k - 18, -394, 36, 14), st, { d: 0, lw: 1 });
      }
      paint(g, rect(s * 200 - 50, -330, 100, 60), C.shade(st, -0.08), { d: 0, lw: 1 });
    }
    paint(g, rect(-320, -480, 640, 26), C.shade(st, -0.05), { d: 2, lw: 1.4 });
    paint(g, rect(-280, -600, 560, 120), st, { d: 4, lw: 1.4 });
    g.fillStyle = nt(MT.VALUE_5A4A3A, tp, 0.4);
    g.font = MT.BOLD_54PX_SERIF;
    g.textAlign = MT.CENTER;
    g.fillText(MT.S_P_Q_R, 0, -522);
    paint(g, rect(-300, -620, 600, 22), C.shade(st, -0.05), { d: 2, lw: 1.2 });
    if (has(MT.CHARIOT)) A(g, MT.CHARIOT, 0, -620, { night: isN(tp) }, 0.7);
  };
  const statueFB = (tp, k) => (g) => {
    const st = nt(MT.E8E2D4, tp, 0.5);
    paint(g, rect(-40, -120, 80, 120), nt(MT.C8C0B0, tp, 0.5), { d: 4, lw: 1.2 });
    paint(g, rect(-48, -132, 96, 14), st, { d: 2, lw: 1 });
    paint(
      g,
      poly(
        [
          [-24, -132],
          [-30, -230],
          [-18, -300],
          [18, -300],
          [26, -230],
          [24, -132],
        ],
        true,
      ),
      st,
      { d: 6, lw: 1.2 },
    );
    paint(g, ell(0, -316, 16, 19), st, { d: 4, lw: 1.2 });
    stroke(
      g,
      k
        ? [
            [16, -290],
            [44, -330],
            [52, -380],
          ]
        : [
            [-16, -290],
            [-40, -250],
            [-30, -200],
          ],
      st,
      12,
      true,
    );
  };
  const cypressT = (g, x, y, s, tp) => A(g, MT.TREE_CYPRESS, x, y, { night: isN(tp), color: nt(MT.VALUE_2E5A34, tp, 0.5), seed: Math.floor(x) }, s);
  R(MT.ROMAN_FORUM, {
    name: MT.QUANG_TRUONG_LA_MA_CO_DAI,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4400,
    tags: [MT.LA_MA_2, MT.DE_CHE, MT.CO_DAI, MT.LICH_SU, MT.QUANG_TRUONG, MT.KHAI_HOAN_MON, MT.DEN_THO, MT.CAESAR, MT.NGUYEN_LAO],
    fog3d: MT.C8D0D8,
    sky: daySky(),
    layers: [
      {
        depth: 0.06,
        blur: 1.4,
        draw: (g, x0, x1, tp) => {
          ridge(g, x0, x1, far(MT.VALUE_7A9A7A, tp, 0.45), 160, 60, 6);
          spread(x0, x1, 140, 2, (x, h) => {
            if (h < 0.5) {
              flat(g, x, -60 - h * 120, 90, 60 + h * 120 + 60, far(MT.E8DCCC, tp, 0.4));
              paint(
                g,
                poly([
                  [x - 6, -60 - h * 120],
                  [x + 45, -90 - h * 120],
                  [x + 96, -60 - h * 120],
                ]),
                far(MT.B86A4A, tp, 0.4),
                { d: 0, ink: false },
              );
            }
          });
        },
      },
      {
        depth: 0.28,
        blur: 0.3,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          put(g, MT.GREEK_TEMPLE, cx - 700, 0, { night: isN(tp) }, 0.8, (q) => templeFacade(q, 0, 0, 760, 380, 8, MT.ECE4D4, tp, { wall: true, roof: MT.B86A4A }));
          templeFacade(g, cx + 700, 0, 900, 260, 12, MT.E4DCCC, tp, { wall: true, roof: MT.B06A4A });
          spread(x0, x1, 400, 100, (x) => {
            if (Math.abs(x - cx) < 1200) cypressT(g, x, 0, 0.7, tp);
          });
        },
      },
      {
        depth: 0.68,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          put(g, MT.ROMAN_ARCH, cx + 200, 0, { night: isN(tp) }, 0.85, romanArchFB(tp));
          for (const k of [-1500, -900, 1100, 1700]) put(g, MT.GREEK_STATUE, cx + k, 0, { night: isN(tp) }, 1, statueFB(tp, k > 0));
          spread(x0, x1, 2400, 800, (x) => cypressT(g, x, 0, 1.2, tp));
          spread(x0, x1, 150, 0, (x) => {
            if (Math.abs(x - cx - 200) < 330) return;
            roundPillar(g, x, -280, 0, 26, nt(MT.E8E0D0, tp, 0.5));
            paint(g, rect(x - 20, -294, 40, 14), nt(MT.E8E0D0, tp, 0.5), { d: 0, lw: 1 });
          });
          box(g, x0, -310, x1 - x0, 20, nt(MT.DDD4C4, tp, 0.5));
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, nt(MT.D8D0C0, tp, 0.55), nt(MT.CCC2B0, tp, 0.55), 3, 1.7);
      backShade(g, x0, x1, 0.1);
      frontShade(g, x0, x1, H, 0.2);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.BRAZIER), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.AMPHORA), x: WW * 0.42, lane: MT.MID },
        { asset: pick(MT.ROMAN_COLUMN), x: WW * 0.72, lane: MT.BACK },
        { asset: pick(MT.BRAZIER), x: WW * 0.82, lane: MT.BACK },
      ]),
  });
  R(MT.COLOSSEUM_ARENA, {
    name: MT.DAU_TRUONG_LA_MA,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4400,
    tags: [MT.LA_MA_2, MT.DAU_TRUONG, MT.GIAC_DAU, MT.COLOSSEUM, MT.CO_DAI, MT.LICH_SU, MT.DAM_DONG, MT.CHIEN_BINH, MT.HOANG_DE],
    dust: 0.6,
    fog3d: MT.D8C8A8,
    sky: daySky({ clouds: 3 }),
    layers: [
      {
        depth: 0.25,
        blur: 0.3,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const bow = (x) => Math.pow((x - cx) / 2600, 2) * 140;
          const tiers = [
            [-160, -330],
            [-350, -520],
            [-540, -700],
          ];
          const stone = nt(MT.C8A87A, tp, 0.5);
          const pTop = P();
          pTop.moveTo(x0 - 50, 40);
          for (let x = x0 - 50; x <= x1 + 50; x += 40) pTop.lineTo(x, -790 + bow(x));
          pTop.lineTo(x1 + 50, 40);
          pTop.closePath();
          paint(g, pTop, C.shade(stone, -0.1), { d: 0, lw: 1.6 });
          const crowdCols = [MT.C83A2A, MT.E8E0D0, MT.VALUE_3A5A9A, MT.D8A830, MT.VALUE_6A3A7A, MT.E8C8A0, MT.VALUE_4A8A4A, MT.VALUE_8A5A3A];
          tiers.forEach(([yb, yt], ti) => {
            const r = U.rng(ti * 7 + 1);
            for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) {
              for (let y = yt + 16; y < yb - 30; y += 14) {
                g.fillStyle = nt(C.mix(crowdCols[Math.floor(r() * crowdCols.length)], MT.VALUE_9A8264, 0.35 + ti * 0.12), tp, 0.5);
                g.beginPath();
                g.arc(x + (r() - 0.5) * 4, y + bow(x) + (r() - 0.5) * 3, 5, 0, PI * 2);
                g.fill();
              }
            }
            const band = P();
            band.moveTo(x0 - 50, yb + bow(x0 - 50));
            for (let x = x0 - 50; x <= x1 + 50; x += 40) band.lineTo(x, yb - 26 + bow(x));
            for (let x = x1 + 50; x >= x0 - 50; x -= 40) band.lineTo(x, yb + bow(x));
            band.closePath();
            paint(g, band, stone, { d: 0, lw: 1.4 });
            spread(x0, x1, 110, 0, (x) => flat(g, x, yb - 22 + bow(x), 8, 18, C.shade(stone, -0.2)));
          });
          spread(x0, x1, 260, 0, (x) => {
            stroke(
              g,
              [
                [x, -790 + bow(x)],
                [x, -900 + bow(x)],
              ],
              nt(MT.VALUE_6A5A4A, tp, 0.4),
              5,
              true,
            );
            paint(
              g,
              poly([
                [x, -900 + bow(x)],
                [x + 60, -890 + bow(x)],
                [x + 50, -860 + bow(x)],
                [x, -860 + bow(x)],
              ]),
              nt(Math.round(x / 260) % 2 ? MT.A82A2A : MT.VALUE_6A2A7A, tp, 0.45),
              { d: 2, lw: 1 },
            );
          });
        },
      },
      {
        depth: 0.65,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const m = nt(MT.E0D4BC, tp, 0.5);
          paint(g, rect(x0 - 50, -230, x1 - x0 + 100, 230), m, { d: 0, lw: 1.6 });
          box(g, x0 - 50, -250, x1 - x0 + 100, 24, C.shade(m, -0.12));
          for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) flat(g, x, -290, 8, 40, C.shade(m, -0.2));
          box(g, x0 - 50, -296, x1 - x0 + 100, 10, C.shade(m, -0.2));
          spread(x0, x1, 900, 0, (x) => {
            if (Math.abs(x - cx) < 300) return;
            paint(g, archPath(x, 0, 160, 190), MT.VALUE_16100C, { d: 0, lw: 1.4 });
            g.strokeStyle = MT.VALUE_2A2A2A;
            g.lineWidth = 6;
            g.beginPath();
            for (let k = -60; k <= 60; k += 24) {
              g.moveTo(x + k, -190 + Math.abs(k) * 0.6);
              g.lineTo(x + k, 0);
            }
            g.moveTo(x - 80, -100);
            g.lineTo(x + 80, -100);
            g.stroke();
          });
          spread(x0, x1, 450, 225, (x) => {
            if (Math.abs(x - cx) < 300) return;
            paint(
              g,
              poly([
                [x - 36, -230],
                [x + 36, -230],
                [x + 36, -100],
                [x, -80],
                [x - 36, -100],
              ]),
              nt(Math.round(x / 450) % 2 ? MT.A82A2A : MT.VALUE_6A2A7A, tp, 0.45),
              { d: 4, lw: 1.2 },
            );
            paint(g, ell(x, -170, 14, 14), nt(MT.D8A830, tp, 0.4), { d: 0, lw: 1 });
          });
          paint(g, rect(cx - 240, -420, 480, 190), nt(MT.E8DCC4, tp, 0.5), { d: 6, lw: 1.4 });
          paint(
            g,
            poly([
              [cx - 280, -420],
              [cx, -500],
              [cx + 280, -420],
            ]),
            nt(MT.VALUE_6A2A7A, tp, 0.45),
            { d: 4, lw: 1.4 },
          );
          for (const s of [-1, 1]) roundPillar(g, cx + s * 200, -420, -230, 24, nt(MT.EFE6D6, tp, 0.5));
          paint(g, rect(cx - 160, -330, 320, 100), nt(MT.VALUE_8A2A2A, tp, 0.45), { d: 2, lw: 1.2 });
          for (const s of [-1, 1]) A(g, MT.BRAZIER, cx + s * 330, -230, { night: isN(tp) }, 0.8);
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.D8B880, tp, 0.55), 6);
      g.strokeStyle = C.rgba(MT.VALUE_8A6A3A, 0.25);
      g.lineWidth = 4;
      g.beginPath();
      for (let k = 0; k < 4; k++) {
        const y = -100 + k * 70;
        g.moveTo(x0, y);
        for (let x = Math.floor(x0 / 200) * 200; x <= x1 + 200; x += 200) g.quadraticCurveTo(x - 100, y + (k % 2 ? 14 : -14), x, y);
      }
      g.stroke();
      backShade(g, x0, x1, 0.25);
      frontShade(g, x0, x1, H, 0.25);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.SWORD_RACK), x: WW * 0.25, lane: MT.BACK },
        { asset: pick(MT.ARMOR_STAND), x: WW * 0.32, lane: MT.BACK },
        { asset: pick(MT.CHARIOT), x: WW * 0.72, lane: MT.BACK },
        { asset: pick(MT.WAR_DRUM), x: WW * 0.82, lane: MT.BACK },
      ]),
  });
  const olive = (g, x, y, s, tp, seed) => {
    const r = U.rng(seed);
    const tr = nt(MT.VALUE_6A5A46, tp, 0.5);
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    const p = P();
    p.moveTo(-30, 0);
    p.bezierCurveTo(-10, -60, -50, -100, -20, -170);
    p.lineTo(10, -170);
    p.bezierCurveTo(-10, -110, 40, -60, 34, 0);
    p.closePath();
    paint(g, p, tr, { d: 6, lw: 1.4 });
    for (let i = 0; i < 12; i++) paint(g, ell((r() - 0.5) * 220, -190 - r() * 110, 50 + r() * 30, 30 + r() * 16), nt(r() < 0.5 ? MT.VALUE_7A8A5A : MT.VALUE_8A9A6A, tp, 0.5), { d: 6, lw: 1.2 });
    g.restore();
  };
  R(MT.GREEK_ACROPOLIS, {
    name: MT.DOI_ACROPOLIS_HY_LAP,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4200,
    tags: [MT.HY_LAP_2, MT.ATHENS, MT.ACROPOLIS, MT.DEN_PARTHENON, MT.CO_DAI, MT.THAN_THOAI, MT.LICH_SU, MT.TRIET_GIA, MT.O_LIU],
    fog3d: MT.C8D8E8,
    sky: daySky({ day: [MT.VALUE_3A8AD8, MT.VALUE_8AC8F0, MT.E8F2F4], clouds: 3 }),
    layers: [
      {
        depth: 0.05,
        blur: 1.2,
        draw: (g, x0, x1, tp) => {
          water(g, x0, x1, -90, 40, far(MT.VALUE_4A8AB8, tp, 0.3), far(MT.VALUE_6AA8C8, tp, 0.3), tp, 2);
          spread(x0, x1, 1300, 5, (x, h) => ridge(g, x - 300, x + 300, far(MT.VALUE_8AA0A8, tp, 0.5), 60 + h * 60, 80, Math.floor(x)));
        },
      },
      {
        depth: 0.2,
        blur: 0.2,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const rock = nt(MT.B8A084, tp, 0.5);
          const p = P();
          p.moveTo(cx - 1700, 60);
          p.lineTo(cx - 1300, -40);
          p.lineTo(cx - 1100, -260);
          p.lineTo(cx - 900, -290);
          p.lineTo(cx + 900, -300);
          p.lineTo(cx + 1100, -250);
          p.lineTo(cx + 1350, -40);
          p.lineTo(cx + 1700, 60);
          p.closePath();
          paint(g, p, rock, { d: 14, lw: 1.6 });
          g.strokeStyle = C.rgba(MT.VALUE_000000, 0.12);
          g.lineWidth = 3;
          g.beginPath();
          for (let i = 0; i < 18; i++) {
            const x = cx - 1000 + i * 120;
            g.moveTo(x, -280);
            g.lineTo(x + 20, -150);
            g.lineTo(x - 10, -40);
          }
          g.stroke();
          ridge(g, cx - 1700, cx + 1700, nt(MT.VALUE_8A9A62, tp, 0.5), 50, 30, 3);
          put(g, MT.GREEK_TEMPLE, cx, -296, { night: isN(tp) }, 0.75, (q) => templeFacade(q, 0, 0, 980, 300, 8, MT.EFE8DA, tp, { wall: true }));
          templeFacade(g, cx + 760, -296, 260, 180, 4, MT.ECE4D4, tp, {});
          spread(x0, x1, 260, 3, (x, h) => {
            if (Math.abs(x - cx) < 1200 || h > 0.6) return;
            olive(g, x, 0, 0.5, tp, Math.floor(x));
          });
        },
      },
      {
        depth: 0.7,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          spread(x0, x1, 900, 200, (x, h) => {
            olive(g, x, 0, 1.1 + h * 0.4, tp, Math.floor(x));
            if (h < 0.4) cypressT(g, x + 300, 0, 1.1, tp);
          });
          for (const k of [-700, 650]) put(g, MT.GREEK_STATUE, cx + k, 0, { night: isN(tp) }, 1, statueFB(tp, k > 0));
          templeFacade(g, cx - 1500, 0, 380, 160, 5, MT.E0D8C8, tp, { broken: [1, 3, 4] });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.C8B088, tp, 0.55), 9, nt(MT.VALUE_8A9A5A, tp, 0.5));
      spread(x0, x1, 240, 5, (x, h) => {
        if (h > 0.4) return;
        const y = -130 + h * 400,
          k = 1 + (y + 150) / 300;
        paint(g, rrect(x, y - 10 * k, 40 * k, 14 * k, 4), nt(MT.E0D8C8, tp, 0.5), { d: 3, lw: 1 });
      });
      backShade(g, x0, x1, 0.08);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.AMPHORA), x: WW * 0.35, lane: MT.MID },
        { asset: pick(MT.ROMAN_COLUMN), x: WW * 0.18, lane: MT.BACK },
        { asset: pick(MT.SCROLL), x: WW * 0.6, lane: MT.MID },
      ]),
  });
  const japHouse = (g, x, y, w, h, tp) => {
    const wood = nt(MT.VALUE_4A3424, tp, 0.5),
      paper = nt(MT.ECE4CC, tp, 0.55),
      roof = nt(MT.VALUE_4A5058, tp, 0.5);
    paint(g, rect(x - w / 2, y - 30, w, 30), nt(MT.VALUE_6A6460, tp, 0.5), { d: 2, lw: 1.2 });
    paint(g, rect(x - w / 2 + 10, y - h, w - 20, h - 30), paper, { d: 0, lw: 1.4 });
    g.strokeStyle = wood;
    g.lineWidth = 3;
    g.beginPath();
    for (let xx = x - w / 2 + 10; xx <= x + w / 2 - 10; xx += 28) {
      g.moveTo(xx, y - h);
      g.lineTo(xx, y - 30);
    }
    for (let yy = y - h; yy <= y - 30; yy += 34) {
      g.moveTo(x - w / 2 + 10, yy);
      g.lineTo(x + w / 2 - 10, yy);
    }
    g.stroke();
    for (let i = 0; i <= 4; i++) paint(g, rect(x - w / 2 + 6 + (i * (w - 24)) / 4, y - h, 12, h - 30), wood, { d: 0, lw: 1 });
    if (isN(tp)) {
      g.fillStyle = MT.RGBA_255_190_90_0_35;
      g.fillRect(x - w / 2 + 10, y - h, w - 20, h - 30);
    }
    const p = P();
    p.moveTo(x - w / 2 - 60, y - h + 10);
    p.quadraticCurveTo(x - w / 2 - 20, y - h - 6, x - w * 0.28, y - h - h * 0.55);
    p.lineTo(x + w * 0.28, y - h - h * 0.55);
    p.quadraticCurveTo(x + w / 2 + 20, y - h - 6, x + w / 2 + 60, y - h + 10);
    p.closePath();
    paint(g, p, roof, { d: 8, lw: 1.6 });
    paint(g, rect(x - w * 0.3, y - h - h * 0.55 - 12, w * 0.6, 14), C.shade(roof, -0.25), { d: 0, lw: 1.2 });
    const nr = paint(g, rect(x - 60, y - h * 0.62, 120, 26), nt(MT.A83A2A, tp, 0.4), { d: 0, lw: 1 });
    void nr;
  };
  const toriiFB = (tp) => (g) => {
    const red = nt(MT.D0402A, tp, 0.45),
      blk = MT.VALUE_1E1A1A;
    for (const s of [-1, 1]) {
      paint(
        g,
        poly([
          [s * 170 - 18, 0],
          [s * 160 - 14, -420],
          [s * 160 + 14, -420],
          [s * 170 + 18, 0],
        ]),
        red,
        { d: 6, lw: 1.4 },
      );
      paint(g, rect(s * 170 - 24, -24, 48, 24), blk, { d: 0, lw: 1.2 });
    }
    paint(g, rect(-230, -380, 460, 28), red, { d: 4, lw: 1.4 });
    paint(g, rect(-16, -420, 32, 40), red, { d: 0, lw: 1.2 });
    const p = P();
    p.moveTo(-290, -440);
    p.quadraticCurveTo(0, -420, 290, -440);
    p.lineTo(300, -470);
    p.quadraticCurveTo(0, -450, -300, -470);
    p.closePath();
    paint(g, p, blk, { d: 0, lw: 1.4 });
    paint(g, rect(-270, -446, 540, 20), red, { d: 2, lw: 1.2 });
  };
  const stoneLanternFB = (tp) => (g) => {
    const st = nt(MT.VALUE_9A968A, tp, 0.5);
    paint(g, rect(-30, -14, 60, 14), st, { d: 2, lw: 1.2 });
    paint(g, rect(-10, -90, 20, 76), st, { d: 4, lw: 1.2 });
    paint(g, rect(-26, -100, 52, 12), st, { d: 2, lw: 1.2 });
    paint(g, rect(-20, -140, 40, 40), st, { d: 2, lw: 1.2 });
    paint(g, rect(-10, -132, 20, 24), isN(tp) ? MT.FFC060 : MT.VALUE_3A3A36, { d: 0, lw: 1 });
    paint(
      g,
      poly([
        [-42, -138],
        [0, -176],
        [42, -138],
      ]),
      st,
      { d: 4, lw: 1.2 },
    );
    paint(g, ell(0, -182, 7, 8), st, { d: 0, lw: 1 });
    if (isN(tp)) glowDisc(g, 0, -120, 60, MT.FFB050, 0.4);
  };
  R(MT.JAPANESE_VILLAGE, {
    name: MT.LANG_CO_NHAT_BAN,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4200,
    tags: [MT.NHAT_BAN_2, MT.SAMURAI, MT.LANG_CO, MT.CONG_TORII, MT.HOA_ANH_DAO, MT.EDO, MT.LICH_SU, MT.DEN_THAN_DAO_2, MT.YOKAI],
    fog3d: MT.D8D8E8,
    sky: daySky({ day: [MT.VALUE_5A9AD8, MT.A8D0EE, MT.F8E8E0] }),
    layers: [
      {
        depth: 0.04,
        blur: 1.2,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          const c = far(MT.VALUE_6A7AA8, tp, 0.35);
          paint(
            g,
            poly([
              [cx - 1100, 60],
              [cx - 140, -560],
              [cx - 60, -590],
              [cx + 60, -590],
              [cx + 140, -560],
              [cx + 1100, 60],
            ]),
            c,
            { d: 0, lw: 1.4 },
          );
          paint(
            g,
            poly([
              [cx - 140, -560],
              [cx - 60, -590],
              [cx + 60, -590],
              [cx + 140, -560],
              [cx + 260, -480],
              [cx + 150, -500],
              [cx + 90, -460],
              [cx, -500],
              [cx - 90, -450],
              [cx - 160, -500],
              [cx - 270, -470],
            ]),
            nt(MT.F4F6FA, tp, 0.4),
            { d: 0, lw: 1.2 },
          );
          ridge(g, x0, x1, far(MT.VALUE_7A9A8A, tp, 0.45), 120, 40, 4);
        },
      },
      {
        depth: 0.25,
        blur: 0.4,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          ridge(g, x0, x1, nt(MT.VALUE_6A8A5A, tp, 0.5), 60, 0, 6);
          A(g, MT.PAGODA, cx + 900, 0, { night: isN(tp) }, 1.1);
          spread(x0, x1, 300, 4, (x, h) => A(g, h < 0.5 ? MT.TREE_BLOSSOM : MT.TREE_PINE, x, 0, { night: isN(tp), seed: Math.floor(x) }, 0.6 + h * 0.3));
        },
      },
      {
        depth: 0.7,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          spread(x0, x1, 900, 450, (x, h) => {
            if (Math.abs(x - cx) < 500) return;
            put(g, MT.JAPANESE_HOUSE, x, 0, { night: isN(tp) }, 1, (q) => japHouse(q, 0, 0, 420 + h * 120, 260 + h * 40, tp));
            A(g, MT.TREE_BLOSSOM, x + 330, 0, { night: isN(tp), seed: Math.floor(x) }, 1.1);
          });
          put(g, MT.TORII_GATE, cx, 0, { night: isN(tp) }, 1, toriiFB(tp));
          for (const s of [-1, 1]) put(g, MT.STONE_LANTERN, cx + s * 300, 0, { night: isN(tp) }, 1.1, stoneLanternFB(tp));
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_8A9A5A, tp, 0.55), 3, nt(MT.VALUE_6A8A4A, tp, 0.5));
      const p = rect(x0 - 10, -120, x1 - x0 + 20, 110);
      paint(g, p, nt(MT.CFC4B0, tp, 0.55), { d: 0, ink: false });
      grain(g, Math.floor(x0 / 400) * 400, x1, -120, -10, MT.RGBA_90_80_60_0_25, 30, 3, 4, 3);
      spread(x0, x1, 60, 8, (x, h) => {
        if (h > 0.5) return;
        paint(g, ell(x, -130 + h * 500, 5, 3, h * 5), nt(MT.F4A8C0, tp, 0.5), { d: 0, ink: false });
      });
      backShade(g, x0, x1, 0.12);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.STONE_LANTERN), x: WW * 0.22, lane: MT.BACK },
        { asset: pick(MT.TREE_BLOSSOM), x: WW * 0.14, lane: MT.BACK },
        { asset: pick(MT.RED_LANTERN), x: WW * 0.7, lane: MT.BACK },
        { asset: pick(MT.STONE_LANTERN), x: WW * 0.8, lane: MT.BACK },
      ]),
  });
  const sandbag = (g, x, y, w, h, col) => {
    paint(g, rrect(x - w / 2, y - h, w, h, h * 0.45), col, { d: 4, lw: 1.2 });
    stroke(
      g,
      [
        [x - w * 0.3, y - h * 0.5],
        [x + w * 0.3, y - h * 0.5],
      ],
      C.shade(col, -0.15),
      2,
    );
  };
  const sandbagWall = (g, x0, x1, y, rows, col, seed) => {
    const r = U.rng(seed);
    for (let k = 0; k < rows; k++) {
      const off = (k % 2) * 40;
      for (let x = Math.floor(x0 / 80) * 80 - off; x < x1 + 80; x += 80) sandbag(g, x, y - k * 30, 84, 34, C.shade(col, (r() - 0.5) * 0.12));
    }
  };
  const wire = (g, x0, x1, y, col) => {
    spread(x0, x1, 220, 3, (x) => {
      stroke(
        g,
        [
          [x - 30, y],
          [x + 20, y - 80],
        ],
        col,
        5,
        true,
      );
      stroke(
        g,
        [
          [x + 30, y],
          [x - 20, y - 80],
        ],
        col,
        5,
        true,
      );
    });
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const yy = y - 20 - k * 22;
      g.moveTo(x0, yy);
      for (let x = Math.floor(x0 / 40) * 40; x < x1 + 40; x += 40) g.quadraticCurveTo(x - 20, yy - 14 + k * 4, x, yy);
    }
    g.stroke();
  };
  const stump = (g, x, y, h, col, seed) => {
    const r = U.rng(seed);
    const p = P();
    p.moveTo(x - 14, y);
    p.lineTo(x - 10, y - h);
    p.lineTo(x - 2, y - h + 20);
    p.lineTo(x + 4, y - h - 14);
    p.lineTo(x + 12, y - h + 10);
    p.lineTo(x + 14, y);
    p.closePath();
    paint(g, p, col, { d: 0, lw: 1.2 });
    if (r() < 0.6)
      stroke(
        g,
        [
          [x, y - h * 0.6],
          [x + (r() < 0.5 ? -1 : 1) * h * 0.3, y - h * 0.8],
        ],
        col,
        6,
        true,
      );
  };
  R(MT.WW1_TRENCH, {
    name: MT.CHIEN_HAO_THE_CHIEN_I,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4200,
    tags: [MT.CHIEN_TRANH, MT.THE_CHIEN_1, MT.CHIEN_HAO, MT.LINH, MT.QUAN_DOI, MT.LICH_SU, MT.BUN_LAY, MT.DAY_THEP_GAI, MT.MAT_TRAN_PHIA_TAY],
    fog: 0.35,
    dust: 0.4,
    fog3d: MT.VALUE_8A8A84,
    sky: mkSky({ night: [MT.VALUE_06070A, MT.VALUE_14181E, MT.VALUE_2A2E34], dusk: [MT.VALUE_2A2A30, MT.VALUE_5A4A44, MT.VALUE_9A7A5A], day: [MT.VALUE_6A7076, MT.VALUE_9AA0A4, MT.C4C4BC], overcast: MT.D8DAD6, sun: false, mx: 0.3, mr: 40, wispCol: MT.VALUE_3A3E44 }),
    layers: [
      {
        depth: 0.08,
        blur: 1.4,
        draw: (g, x0, x1, tp) => {
          ridge(g, x0, x1, far(MT.VALUE_5A564C, tp, 0.4), 70, 300, 4);
          spread(x0, x1, 700, 3, (x, h) => {
            if (h > 0.5) return;
            for (let i = 0; i < 5; i++) {
              const cy = -360 - i * 70 - h * 40;
              paint(g, ell(x + i * 18, cy, 60 + i * 26, 40 + i * 14), C.rgba(nt(MT.VALUE_4A4844, tp, 0.4), 0.55 - i * 0.08), { d: 0, ink: false });
            }
          });
        },
      },
      {
        depth: 0.3,
        blur: 0.4,
        draw: (g, x0, x1, tp) => {
          const c = nt(MT.VALUE_3A3630, tp, 0.4);
          ridge(g, x0, x1, nt(MT.VALUE_4E4A40, tp, 0.4), 30, 300, 8);
          spread(x0, x1, 380, 5, (x, h) => stump(g, x, -310, 60 + h * 120, c, Math.floor(x)));
          wire(g, x0, x1, -300, nt(MT.VALUE_2A2826, tp, 0.3));
          mist(g, x0, x1, -300, 60, haze(tp), 0.4, 2, 260);
        },
      },
      {
        depth: 0.92,
        draw: (g, x0, x1, tp) => {
          const mud = nt(MT.VALUE_5A4A38, tp, 0.5);
          const p = P();
          p.moveTo(x0 - 50, 0);
          p.lineTo(x0 - 50, -300);
          for (let x = x0 - 50; x <= x1 + 50; x += 40) p.lineTo(x, -300 - U.fbm(x / 300, 5) * 30);
          p.lineTo(x1 + 50, 0);
          p.closePath();
          paint(g, p, mud, { d: 0, lw: 1.6 });
          planksH(g, x0, x1, -280, -20, nt(MT.VALUE_6A5236, tp, 0.5), 30, 4);
          spread(x0, x1, 300, 0, (x) => box(g, x - 10, -300, 20, 300, nt(MT.VALUE_4A3624, tp, 0.5), { d: 3 }));
          sandbagWall(g, x0, x1, -280, 4, nt(MT.A8946A, tp, 0.5), 3);
          spread(x0, x1, 1400, 900, (x, h) => {
            box(g, x - 110, -250, 220, 250, nt(MT.VALUE_3A2A1C, tp, 0.4), { d: 4 });
            box(g, x - 90, -230, 180, 230, MT.VALUE_0A0806);
            box(g, x - 120, -270, 240, 30, nt(MT.VALUE_5A4028, tp, 0.4), { d: 3 });
            if (h < 0.6) {
              stroke(
                g,
                [
                  [x + 120, -300],
                  [x + 200, 0],
                ],
                nt(MT.VALUE_6A4A2A, tp, 0.4),
                8,
                true,
              );
              stroke(
                g,
                [
                  [x + 160, -300],
                  [x + 240, 0],
                ],
                nt(MT.VALUE_6A4A2A, tp, 0.4),
                8,
                true,
              );
              for (let k = 1; k < 8; k++)
                stroke(
                  g,
                  [
                    [x + 120 + k * 10, -300 + k * 37],
                    [x + 160 + k * 10, -300 + k * 37],
                  ],
                  nt(MT.VALUE_6A4A2A, tp, 0.4),
                  6,
                  true,
                );
            }
            paint(g, rrect(x - 160, -200, 40, 30, 4), nt(MT.VALUE_4A5A3A, tp, 0.4), { d: 2, lw: 1 });
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_4E4232, tp, 0.5), 8);
      spread(x0, x1, 460, 5, (x, h) => {
        g.save();
        g.translate(x, 20 + h * 200);
        g.scale(1, 0.2);
        paint(g, ell(0, 0, 160 + h * 100, 160 + h * 100), nt(MT.VALUE_5A6068, tp, 0.5), { d: 0, ink: false });
        g.restore();
      });
      const wood = nt(MT.VALUE_7A6040, tp, 0.5);
      paint(g, rect(x0 - 10, -128, x1 - x0 + 20, 8), C.shade(wood, -0.2), { d: 0, ink: false });
      paint(g, rect(x0 - 10, -60, x1 - x0 + 20, 8), C.shade(wood, -0.2), { d: 0, ink: false });
      for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) box(g, x, -126, 26, 70, C.shade(wood, (H2(x, 3) - 0.5) * 0.2), { d: 0, lw: 1 });
      backShade(g, x0, x1, 0.4);
      frontShade(g, x0, x1, H, 0.4);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CRATE), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.SANDBAGS), x: WW * 0.55, lane: MT.BACK },
        { asset: pick(MT.BARREL), x: WW * 0.7, lane: MT.BACK },
        { asset: pick(MT.SMOKE), x: WW * 0.8, lane: MT.BACK, y: -280 },
      ]),
  });
  const concrete = (g, x0, x1, y0, y1, col, seed) => {
    flat(g, x0, y0, x1 - x0, y1 - y0, col);
    g.fillStyle = MT.RGBA_0_0_0_0_08;
    for (let y = Math.ceil(y0 / 60) * 60; y < y1; y += 60) g.fillRect(x0, y, x1 - x0, 3);
    stains(g, x0, x1, y0 + 200, y1, seed);
    const r = U.rng(seed);
    g.fillStyle = MT.RGBA_255_255_255_0_05;
    for (let i = 0; i < (x1 - x0) / 20; i++) g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 6, 6);
  };
  const steelDoor = (g, x, y, w, h) => {
    box(g, x - w / 2 - 20, y - h - 20, w + 40, h + 20, MT.VALUE_4A4C48, { d: 4 });
    paint(g, rrect(x - w / 2, y - h, w, h, 16), MT.VALUE_5A6258, { d: 6, lw: 1.6 });
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) paint(g, ell(x + s * (w / 2 - 16), y - h + 30 + i * ((h - 60) / 5), 5, 5), MT.VALUE_7A8278, { d: 0, lw: 1 });
    g.strokeStyle = MT.VALUE_2A2E2A;
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x, y - h * 0.5, 34, 0, PI * 2);
    g.moveTo(x - 34, y - h * 0.5);
    g.lineTo(x + 34, y - h * 0.5);
    g.moveTo(x, y - h * 0.5 - 34);
    g.lineTo(x, y - h * 0.5 + 34);
    g.stroke();
  };
  const warMap = (g, x, y, w, h) => {
    box(g, x - w / 2 - 8, y - h - 8, w + 16, h + 16, MT.VALUE_3A2E22, { d: 3 });
    box(g, x - w / 2, y - h, w, h, MT.D8CCAA, { d: 0 });
    g.fillStyle = MT.VALUE_9AB4C4;
    g.beginPath();
    g.moveTo(x - w / 2, y - h);
    g.lineTo(x - w * 0.1, y - h);
    g.quadraticCurveTo(x - w * 0.2, y - h * 0.5, x - w / 2, y - h * 0.3);
    g.fill();
    g.strokeStyle = MT.VALUE_7A8A5A;
    g.lineWidth = 2;
    g.strokeRect(x - w / 2 + 6, y - h + 6, w - 12, h - 12);
    g.strokeStyle = MT.C82A2A;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x - w * 0.2, y - h * 0.2);
    g.quadraticCurveTo(x, y - h * 0.6, x + w * 0.25, y - h * 0.55);
    g.lineTo(x + w * 0.2, y - h * 0.65);
    g.moveTo(x + w * 0.25, y - h * 0.55);
    g.lineTo(x + w * 0.16, y - h * 0.5);
    g.stroke();
    g.strokeStyle = MT.VALUE_2A4A9A;
    g.beginPath();
    g.moveTo(x + w * 0.35, y - h * 0.2);
    g.lineTo(x + w * 0.1, y - h * 0.35);
    g.stroke();
    for (let i = 0; i < 6; i++) paint(g, ell(x - w * 0.3 + i * w * 0.12, y - h * (0.3 + (i % 3) * 0.15), 5, 5), i % 2 ? MT.C82A2A : MT.VALUE_2A4A9A, { d: 0, lw: 1 });
  };
  R(MT.BUNKER_INTERIOR, {
    name: MT.BOONGKE_THE_CHIEN_II,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3200,
    tags: [MT.CHIEN_TRANH, MT.THE_CHIEN_2, MT.BOONGKE, MT.HAM_CHI_HUY, MT.BAN_DO, MT.RADIO, MT.QUAN_DOI, MT.LICH_SU, MT.BI_MAT],
    fog3d: MT.VALUE_14140F,
    sky: darkSky(MT.VALUE_050505, MT.VALUE_0C0C0A),
    dust: 0.3,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          concrete(g, x0, x1, -1700, 0, MT.VALUE_6E6E66, 3);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_080807, MT.RGBA_20_20_18_0_5, MT.RGBA_0_0_0_0]);
          box(g, x0, -160, x1 - x0, 160, MT.VALUE_4E5048, { ink: false });
          box(g, x0, -170, x1 - x0, 12, MT.VALUE_3A3C36);
          for (let k = 0; k < 3; k++) {
            box(g, x0, -680 + k * 26, x1 - x0, 16, [MT.VALUE_4A5A4A, MT.VALUE_6A5A3A, MT.VALUE_5A5A5A][k], { d: 2 });
            spread(x0, x1, 400, k * 60, (x) => box(g, x, -686 + k * 26, 12, 28, MT.VALUE_3A3A36));
          }
          spread(x0, x1, 900, 0, (x) => box(g, x - 40, -700, 80, 700, MT.VALUE_62625A, { d: 6 }));
          steelDoor(g, cx + 700, 0, 200, 360);
          sandbagWall(g, cx + 560, cx + 840, 0, 2, MT.A8946A, 5);
          warMap(g, cx - 120, -280, 420, 260);
          g.fillStyle = MT.E8E2C8;
          g.font = MT.BOLD_40PX_SANS_SERIF;
          g.textAlign = MT.CENTER;
          g.fillText(MT.BUNKER_7, cx + 700, -420);
          const bx = cx - 900;
          for (let k = 0; k < 2; k++) {
            const by = -60 - k * 230;
            box(g, bx - 220, by - 14, 440, 14, MT.VALUE_4A5A4A, { d: 2 });
            box(g, bx - 210, by - 44, 420, 30, MT.VALUE_6A6A4A, { d: 4 });
            paint(g, rrect(bx - 200, by - 64, 90, 26, 10), MT.C8C4B0, { d: 3, lw: 1.2 });
          }
          for (const s of [-1, 1]) box(g, bx + s * 220 - 6, -330, 12, 330, MT.VALUE_3A4A3A, { d: 2 });
          paint(g, ell(cx + 330, -420, 40, 40), MT.VALUE_2A2A26, { d: 3, lw: 1.4 });
          paint(g, ell(cx + 330, -420, 32, 32), MT.E8E2CC, { d: 0, lw: 1 });
          stroke(
            g,
            [
              [cx + 330, -420],
              [cx + 330, -444],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          stroke(
            g,
            [
              [cx + 330, -420],
              [cx + 346, -412],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          stroke(
            g,
            [
              [cx + 100, -1700],
              [cx + 100, -600],
            ],
            MT.VALUE_1A1A1A,
            3,
          );
          paint(
            g,
            poly([
              [cx + 60, -560],
              [cx + 80, -600],
              [cx + 120, -600],
              [cx + 140, -560],
            ]),
            MT.VALUE_3A4A3A,
            { d: 3, lw: 1.4 },
          );
          paint(g, ell(cx + 100, -556, 16, 10), MT.FFF2C0, { d: 0, lw: 1, glow: MT.FFE0A0 });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, MT.VALUE_5A5A54, 3);
      backShade(g, x0, x1, 0.5);
      frontShade(g, x0, x1, H, 0.5);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.TABLE), x: WW * 0.45, lane: MT.MID },
        { asset: pick(MT.RADIO), x: WW * 0.4, lane: MT.MID, y: -90 },
        { asset: pick(MT.BLUEPRINT, MT.DOCUMENTS), x: WW * 0.5, lane: MT.MID, y: -90 },
        { asset: pick(MT.CHAIR), x: WW * 0.56, lane: MT.BACK },
        { asset: pick(MT.CRATE), x: WW * 0.72, lane: MT.BACK },
        { asset: pick(MT.TELEPHONE), x: WW * 0.33, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => [lampL(WW / 2 + 100, -706, 760, MT.FFE6B0, 0.26)],
  });
  const timberWall = (g, x0, x1, y0, y1, plaster, beam, step) => {
    flat(g, x0, y0, x1 - x0, y1 - y0, plaster);
    const r = U.rng(3);
    g.fillStyle = MT.RGBA_90_60_30_0_08;
    for (let i = 0; i < (x1 - x0) / 30; i++) g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 40 + r() * 80, 20 + r() * 50);
    spread(x0, x1, step, 0, (x, h) => {
      box(g, x - 22, y0, 44, y1 - y0, beam, { d: 4 });
      const a = h < 0.5 ? 1 : -1;
      const p = P();
      p.moveTo(x + 22, y1 - 260 + (a > 0 ? 0 : -200));
      p.lineTo(x + 22, y1 - 220 + (a > 0 ? 0 : -200));
      p.lineTo(x + step - 22, y1 - 420 + (a > 0 ? 0 : 200));
      p.lineTo(x + step - 22, y1 - 460 + (a > 0 ? 0 : 200));
      p.closePath();
      paint(g, p, beam, { d: 2, lw: 1.2 });
    });
    box(g, x0, y1 - 480, x1 - x0, 36, beam, { d: 4 });
  };
  const barrelEnd = (g, x, y, r, col) => {
    paint(g, ell(x, y, r, r), col, { d: 4, lw: 1.4 });
    g.strokeStyle = MT.VALUE_2A2A2A;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x, y, r * 0.82, 0, PI * 2);
    g.stroke();
    paint(g, ell(x, y + r * 0.4, 5, 5), MT.VALUE_3A2010, { d: 0, lw: 1 });
  };
  R(MT.MEDIEVAL_TAVERN_INTERIOR, {
    name: MT.QUAN_RUOU_THOI_TRUNG_CO,
    category: MT.INTERIOR,
    time: MT.INTERIOR,
    width: 3400,
    tags: [MT.TRUNG_CO, MT.QUAN_RUOU, MT.LO_SUOI, MT.THUNG_RUOU, MT.HIEP_SI_2, MT.CO_TICH, MT.LICH_SU, MT.NEN_3, MT.LU_KHACH],
    fog3d: MT.VALUE_1E140C,
    sky: darkSky(MT.VALUE_070403, MT.VALUE_100A06),
    dust: 0.3,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          const cx = mid(x0, x1);
          timberWall(g, x0, x1, -1700, 0, MT.C8A878, MT.VALUE_4A2E1A, 560);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_0A0604, MT.RGBA_30_18_10_0_5, MT.RGBA_0_0_0_0]);
          box(g, x0, -720, x1 - x0, 50, MT.VALUE_3A2212, { d: 6 });
          spread(x0, x1, 560, 280, (x) => {
            paint(g, rect(x - 30, -760, 60, 70), MT.VALUE_3A2212, { d: 4, lw: 1.4 });
          });
          const fx = cx - 600;
          stoneBlocks(g, fx - 240, fx + 240, -560, 0, MT.VALUE_7A7266, 80, 44, 6);
          paint(g, rect(fx - 240, -560, 480, 560), MT.RGBA_0_0_0_0, { d: 0, lw: 1.6 });
          box(g, fx - 270, -330, 540, 34, MT.VALUE_5A3A22, { d: 4 });
          paint(g, archPath(fx, 0, 280, 260), MT.VALUE_140A06, { d: 0, lw: 1.4 });
          g.save();
          g.clip(archPath(fx, 0, 280, 260));
          glowDisc(g, fx, -40, 200, MT.FF8A30, 0.6);
          g.restore();
          A(g, MT.FIRE, fx - 40, -10, { t: 0.4 }, 1.1) || flame(g, fx - 40, -10, 3, 0);
          A(g, MT.FIRE, fx + 40, -10, { t: 0.9 }, 0.9) || flame(g, fx + 40, -10, 2.5, 0);
          paint(g, rect(fx - 100, -16, 200, 16), MT.VALUE_2A1A10, { d: 0, lw: 1 });
          A(g, MT.CAULDRON, fx + 0, -10, {}, 0.0001);
          for (const s of [-1, 1]) {
            paint(g, ell(fx + s * 160, -380, 22, 30), MT.VALUE_7A6A5A, { d: 2, lw: 1 });
            candle(g, fx + s * 170, -330, 40, 1, MT.EFE2C0);
          }
          paint(g, ell(fx, -440, 54, 54), MT.VALUE_8A6A3A, { d: 6, lw: 1.4 });
          for (const s of [-1, 1])
            stroke(
              g,
              [
                [fx, -440],
                [fx + s * 70, -520],
              ],
              MT.VALUE_6A5A4A,
              8,
              true,
            );
          const bx = cx + 600;
          box(g, bx - 280, -360, 560, 20, MT.VALUE_4A2E1A, { d: 3 });
          box(g, bx - 280, -200, 560, 20, MT.VALUE_4A2E1A, { d: 3 });
          for (let i = 0; i < 9; i++) {
            const mx = bx - 250 + i * 60;
            paint(g, rrect(mx, -420, 34, 60, 6), i % 3 ? MT.VALUE_8A6A4A : MT.VALUE_5A7A5A, { d: 3, lw: 1.2 });
            paint(g, rect(mx + 8, -260, 18, 60), [MT.VALUE_2A5A2A, MT.VALUE_6A2A1A, MT.VALUE_3A3A6A][i % 3], { d: 3, lw: 1.2 });
            paint(g, rect(mx + 13, -280, 8, 22), [MT.VALUE_2A5A2A, MT.VALUE_6A2A1A, MT.VALUE_3A3A6A][i % 3], { d: 0, lw: 1 });
          }
          const rx = cx + 1250;
          for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) barrelEnd(g, rx - 120 + k * 120 + row * 60, -60 - row * 108, 56, MT.VALUE_7A5232);
          box(g, rx - 200, -10, 400, 10, MT.VALUE_3A2212);
          stroke(
            g,
            [
              [cx, -1700],
              [cx, -560],
            ],
            MT.VALUE_1A1410,
            3,
          );
          paint(
            g,
            poly([
              [cx - 34, -500],
              [cx - 24, -560],
              [cx + 24, -560],
              [cx + 34, -500],
            ]),
            MT.VALUE_2A2420,
            { d: 2, lw: 1.2 },
          );
          paint(g, rect(cx - 22, -500, 44, 10), MT.FFC060, { d: 0, lw: 1, glow: MT.FFB050 });
          paint(g, ell(cx + 220, -420, 70, 80), MT.VALUE_8A2A1A, { d: 6, lw: 1.4 });
          paint(g, ell(cx + 220, -420, 20, 20), MT.C8A040, { d: 2, lw: 1 });
          stroke(
            g,
            [
              [cx + 140, -500],
              [cx + 300, -340],
            ],
            MT.B8B8B0,
            8,
            true,
          );
          stroke(
            g,
            [
              [cx + 300, -500],
              [cx + 140, -340],
            ],
            MT.B8B8B0,
            8,
            true,
          );
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      boards(g, x0, x1, H, MT.VALUE_5A3A22, 4);
      grain(g, Math.floor(x0 / 400) * 400, x1, -150, H, MT.RGBA_220_190_120_0_08, 14, 2, 6, 3);
      backShade(g, x0, x1, 0.45);
      frontShade(g, x0, x1, H, 0.45);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.TABLE), x: WW * 0.45, lane: MT.MID },
        { asset: pick(MT.CANDLE), x: WW * 0.45, lane: MT.MID, y: -90 },
        { asset: pick(MT.BARREL), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.CHAIR), x: WW * 0.38, lane: MT.BACK },
        { asset: pick(MT.TABLE), x: WW * 0.7, lane: MT.BACK },
        { asset: pick(MT.BARREL), x: WW * 0.8, lane: MT.MID },
      ]),
    lightsStatic: (WW) => [glowL(WW / 2 - 600, -230, 420, MT.FF8A30, 0.55), glowL(WW / 2, -650, 220, MT.FFC060, 0.45), lampL(WW / 2, -650, 650, MT.FFD090, 0.16)],
  });
  const cellBars = (g, x, w, h, col) => {
    const p = P();
    for (let k = 0; k <= w; k += 34) p.rect(x - w / 2 + k - 4, -h, 8, h);
    p.rect(x - w / 2, -h, w, 12);
    p.rect(x - w / 2, -h * 0.55, w, 10);
    p.rect(x - w / 2, -14, w, 14);
    paint(g, p, col, { d: 0, lw: 1.2 });
  };
  const chainW = (g, x, y, len, col) => {
    g.strokeStyle = col;
    g.lineWidth = 4;
    for (let i = 0; i < len / 16; i++) {
      g.beginPath();
      g.ellipse(x, y + i * 16, i % 2 ? 3 : 6, 9, 0, 0, PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.arc(x, y + len + 8, 12, 0, PI);
    g.lineWidth = 6;
    g.stroke();
  };
  R(MT.DUNGEON, {
    name: MT.NGUC_TOI_LAU_DAI,
    category: MT.UNDERGROUND,
    time: MT.INTERIOR_DARK,
    width: 3600,
    tags: [MT.NGUC_TOI, MT.NHA_TU, MT.TRUNG_CO, MT.XIENG_XICH, MT.TU_NHAN, MT.DUOC, MT.LAU_DAI, MT.KINH_DI, MT.TRA_TAN, MT.LICH_SU],
    fog3d: MT.VALUE_0E0D0C,
    sky: darkSky(MT.VALUE_040404, MT.VALUE_0A0908),
    dust: 0.4,
    layers: [
      {
        depth: 1,
        top: 1700,
        draw: (g, x0, x1) => {
          stoneBlocks(g, x0, x1, -1700, 0, MT.VALUE_3E3C38, 100, 52, 9);
          vgrad(g, x0, -1700, x1 - x0, 1100, [MT.VALUE_050505, MT.RGBA_10_10_10_0_5, MT.RGBA_0_0_0_0]);
          spread(x0, x1, 900, 450, (x, h) => {
            box(g, x - 300, -440, 600, 440, MT.VALUE_1A1816, { d: 0 });
            stoneBlocks(g, x - 290, x + 290, -430, 0, MT.VALUE_2A2826, 80, 44, Math.floor(x));
            vgrad(g, x - 300, -440, 600, 440, [MT.RGBA_0_0_0_0_6, MT.RGBA_0_0_0_0_25]);
            const wx = x + 120;
            box(g, wx - 40, -400, 80, 50, MT.VALUE_0A0C12);
            g.fillStyle = MT.VALUE_3A4A6A;
            g.fillRect(wx - 34, -394, 68, 38);
            for (let k = 0; k < 4; k++) flat(g, wx - 30 + k * 20, -400, 5, 50, MT.VALUE_1A1A1A);
            chainW(g, x - 160, -360, 150, MT.VALUE_6A645A);
            chainW(g, x - 60, -360, 150, MT.VALUE_6A645A);
            if (h < 0.5) {
              skull(g, x - 110, -10, 1.3, MT.BCB090);
              boneHeap(g, x - 110, 0, 120, Math.floor(x), MT.BCB090);
            }
            g.fillStyle = MT.VALUE_8A7A3A;
            for (let i = 0; i < 40; i++) {
              const sx = x - 250 + H2(i * 7 + x, 1) * 500;
              g.save();
              g.translate(sx, -6 - H2(i, x) * 20);
              g.rotate((H2(i, 5) - 0.5) * 2);
              g.fillRect(-14, -1, 28, 2);
              g.restore();
            }
            cellBars(g, x, 600, 440, MT.VALUE_24221F);
            box(g, x - 320, -470, 640, 30, MT.VALUE_4A4640, { d: 3 });
          });
          spread(x0, x1, 900, 0, (x) => {
            box(g, x - 150, -520, 300, 520, MT.VALUE_45423C, { d: 6 });
            torchW(g, x, -360, 1);
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      tiles(g, x0, x1, H, MT.VALUE_3A3834, null, 4, 1.2);
      g.fillStyle = MT.RGBA_160_140_70_0_5;
      spread(x0, x1, 40, 3, (x, h) => {
        if (h > 0.4) return;
        g.save();
        g.translate(x, -140 + h * 300);
        g.rotate(h * 9);
        g.fillRect(-12, -1, 24, 2);
        g.restore();
      });
      spread(x0, x1, 1300, 600, (x) => {
        g.save();
        g.translate(x, -40);
        g.scale(1, 0.2);
        paint(g, ell(0, 0, 200, 200), MT.VALUE_14181C, { d: 0, ink: false });
        g.restore();
      });
      backShade(g, x0, x1, 0.6);
      frontShade(g, x0, x1, H, 0.6);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CHAINS), x: WW * 0.3, lane: MT.BACK },
        { asset: pick(MT.BONE_PILE, MT.SKULL), x: WW * 0.62, lane: MT.MID },
        { asset: pick(MT.BARREL), x: WW * 0.75, lane: MT.BACK },
      ]),
    lightsStatic: (WW) => rep(WW, 900, 0, (x) => glowL(x, -520, 230, MT.FF9040, 0.55)).concat(rep(WW, 900, 570, (x) => ({ type: MT.SHAFT, x, y: -525, w: 80, h: 50, len: 500, angle: 1.9, color: MT.VALUE_9AB0E0, alpha: 0.12 }))),
  });
  const longhouse = (g, x, y, w, h, tp, seed) => {
    const wood = nt(MT.VALUE_6A4A30, tp, 0.5),
      turf = nt(MT.VALUE_5A7A3A, tp, 0.5);
    planksV(g, x - w / 2, x + w / 2, y - h, y, wood, 26, seed);
    paint(g, rect(x - w / 2, y - h, w, h), MT.RGBA_0_0_0_0, { d: 0, lw: 1.4 });
    const p = P();
    p.moveTo(x - w / 2 - 50, y - h + 20);
    p.quadraticCurveTo(x - w / 2, y - h - h * 0.9, x, y - h - h * 1.05);
    p.quadraticCurveTo(x + w / 2, y - h - h * 0.9, x + w / 2 + 50, y - h + 20);
    p.closePath();
    paint(g, p, turf, { d: 10, lw: 1.6 });
    g.strokeStyle = C.rgba(MT.VALUE_2A3A1A, 0.35);
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < w / 20; i++) {
      const xx = x - w / 2 + i * 20 + 5;
      const yy = y - h + 10 - Math.sin((i / (w / 20)) * PI) * h * 0.95;
      g.moveTo(xx, yy);
      g.lineTo(xx + 3, yy - 12);
    }
    g.stroke();
    for (const s of [-1, 1])
      stroke(
        g,
        [
          [x + s * (w / 2 + 40), y - h + 20],
          [x + s * (w / 2 + 70), y - h - 30, x + s * (w / 2 + 50), y - h - 60],
        ],
        nt(MT.VALUE_4A3020, tp, 0.4),
        10,
        true,
      );
    box(g, x - 40, y - 150, 80, 150, MT.VALUE_140C08);
    paint(g, rect(x - 50, y - 160, 100, 14), nt(MT.VALUE_4A3020, tp, 0.4), { d: 2, lw: 1 });
    if (isN(tp)) glowDisc(g, x, y - 80, 90, MT.FF9A40, 0.4);
    for (let i = 0; i < 4; i++) paint(g, ell(x + 20 + i * 14, y - h - h * 1.05 - 30 - i * 40, 20 + i * 12, 14 + i * 8), C.rgba(nt(MT.C8CCD0, tp, 0.4), 0.45 - i * 0.09), { d: 0, ink: false });
  };
  const longshipFB = (tp) => (g) => {
    const hull = nt(MT.VALUE_5A3A22, tp, 0.5);
    const p = P();
    p.moveTo(-420, -110);
    p.quadraticCurveTo(-300, 10, 0, 10);
    p.quadraticCurveTo(300, 10, 420, -110);
    p.lineTo(400, -110);
    p.quadraticCurveTo(300, -40, 0, -40);
    p.quadraticCurveTo(-300, -40, -400, -110);
    p.closePath();
    paint(g, p, hull, { d: 6, lw: 1.6 });
    const q = P();
    q.moveTo(-400, -110);
    q.quadraticCurveTo(-300, -40, 0, -40);
    q.quadraticCurveTo(300, -40, 400, -110);
    q.lineTo(380, -60);
    q.quadraticCurveTo(300, 0, 0, 0);
    q.quadraticCurveTo(-300, 0, -380, -60);
    q.closePath();
    paint(g, q, C.shade(hull, 0.1), { d: 0, lw: 1.2 });
    stroke(
      g,
      [
        [400, -110],
        [450, -190, 420, -230],
      ],
      hull,
      14,
      true,
    );
    paint(g, ell(426, -238, 22, 14), hull, { d: 2, lw: 1.2 });
    stroke(
      g,
      [
        [-400, -110],
        [-440, -180, -410, -210],
      ],
      hull,
      12,
      true,
    );
    for (let i = 0; i < 9; i++) {
      const sx = -280 + i * 70;
      paint(g, ell(sx, -36, 26, 26), nt([MT.C8302A, MT.E8D8A0, MT.VALUE_2A4A8A][i % 3], tp, 0.45), { d: 4, lw: 1.2 });
      paint(g, ell(sx, -36, 7, 7), nt(MT.VALUE_8A8A8A, tp, 0.4), { d: 0, lw: 1 });
    }
    stroke(
      g,
      [
        [0, -30],
        [0, -460],
      ],
      nt(MT.VALUE_4A3020, tp, 0.4),
      10,
      true,
    );
    stroke(
      g,
      [
        [-180, -420],
        [180, -420],
      ],
      nt(MT.VALUE_4A3020, tp, 0.4),
      8,
      true,
    );
    const sail = P();
    sail.moveTo(-170, -416);
    sail.lineTo(170, -416);
    sail.quadraticCurveTo(200, -250, 160, -130);
    sail.lineTo(-160, -130);
    sail.quadraticCurveTo(-200, -250, -170, -416);
    sail.closePath();
    paint(g, sail, nt(MT.E8DCC0, tp, 0.5), { d: 8, lw: 1.4 });
    g.save();
    g.clip(sail);
    for (let i = 0; i < 6; i++) if (i % 2 === 0) flat(g, -200 + i * 68, -420, 68, 300, nt(MT.B8302A, tp, 0.45));
    g.restore();
  };
  R(MT.VIKING_VILLAGE, {
    name: MT.LANG_VIKING_BEN_VINH_HEP,
    category: MT.EXTERIOR,
    time: MT.DAY,
    width: 4400,
    tags: [MT.VIKING, MT.BAC_AU_2, MT.VINH_HEP, MT.FJORD, MT.THUYEN_RONG, MT.CHIEN_BINH, MT.TRUNG_CO, MT.LICH_SU, MT.THAN_THOAI_BAC_AU],
    fog3d: MT.A8B8C8,
    sky: mkSky({ night: [MT.VALUE_03060C, MT.VALUE_0A1628, MT.VALUE_1A2E48, MT.VALUE_2A4A5A], dusk: [MT.VALUE_2A3050, MT.VALUE_6A5A7A, MT.D8906A, MT.F0C090], day: [MT.VALUE_5A8AB8, MT.A8C8E0, MT.E4ECF0], clouds: 4 }),
    layers: [
      {
        depth: 0.05,
        blur: 1.2,
        draw: (g, x0, x1, tp) => {
          peaks(g, x0, x1, far(MT.VALUE_5A6A80, tp, 0.35), 520, 380, 640, 60, 7, nt(MT.EEF2F6, tp, 0.4));
        },
      },
      {
        depth: 0.14,
        blur: 0.6,
        draw: (g, x0, x1, tp) => {
          peaks(g, x0, x1, far(MT.VALUE_3E5A52, tp, 0.25), 380, 160, 300, -20, 3, null);
          water(g, x0, x1, -40, 60, nt(MT.VALUE_4A7A9A, tp, 0.5), nt(MT.VALUE_2A5A7A, tp, 0.5), tp, 5);
          spread(x0, x1, 60, 6, (x, h) => pine(g, x, -36, 70 + h * 70, far(MT.VALUE_2A4A3A, tp, 0.2), { ink: false }));
        },
      },
      {
        depth: 0.36,
        draw: (g, x0, x1, tp) => {
          water(g, x0, x1, -120, 60, nt(MT.VALUE_3A6A8A, tp, 0.5), nt(MT.VALUE_244A64, tp, 0.5), tp, 8);
          const cx = mid(x0, x1);
          put(g, MT.VIKING_LONGSHIP, cx + 700, -40, { night: isN(tp) }, 0.9, longshipFB(tp));
          g.save();
          g.translate(cx + 700, -30);
          g.scale(0.9, -0.25);
          g.globalAlpha = 0.25;
          put(g, MT.VIKING_LONGSHIP, 0, 0, { night: isN(tp) }, 1, longshipFB(tp));
          g.restore();
          spread(x0, x1, 900, 300, (x) => {
            for (let i = 0; i < 4; i++) box(g, x + i * 80, -60, 14, 80, nt(MT.VALUE_4A3424, tp, 0.4), { d: 2 });
            box(g, x - 20, -64, 300, 16, nt(MT.VALUE_6A4A30, tp, 0.5), { d: 2 });
          });
        },
      },
      {
        depth: 0.7,
        draw: (g, x0, x1, tp) => {
          const cx = mid(x0, x1);
          ridge(g, x0, x1, nt(MT.VALUE_5A7A42, tp, 0.5), 40, -10, 11);
          spread(x0, x1, 1100, 0, (x, h) => {
            if (Math.abs(x - cx - 700) < 450) return;
            longhouse(g, x, 10, 520 + h * 160, 200 + h * 30, tp, Math.floor(x));
            for (let i = 0; i < 2; i++) {
              const rx = x + 420 + i * 70;
              stroke(
                g,
                [
                  [rx, 10],
                  [rx, -150],
                ],
                nt(MT.VALUE_4A3424, tp, 0.4),
                8,
                true,
              );
            }
            stroke(
              g,
              [
                [x + 410, -140],
                [x + 500, -140],
              ],
              nt(MT.VALUE_4A3424, tp, 0.4),
              6,
              true,
            );
            for (let i = 0; i < 4; i++) paint(g, ell(x + 425 + i * 20, -110, 6, 22), nt(MT.C8C0A8, tp, 0.5), { d: 2, lw: 1 });
          });
        },
      },
    ],
    ground: (g, x0, x1, tp, H) => {
      dirt(g, x0, x1, H, nt(MT.VALUE_6A7A4A, tp, 0.55), 2, nt(MT.VALUE_5A7A3A, tp, 0.5));
      const p = P();
      p.moveTo(x0 - 10, -110);
      p.bezierCurveTo(x0 + 600, -120, x1 - 600, -100, x1 + 10, -112);
      p.lineTo(x1 + 10, -40);
      p.bezierCurveTo(x1 - 600, -30, x0 + 600, -60, x0 - 10, -44);
      p.closePath();
      paint(g, p, nt(MT.VALUE_7A6A50, tp, 0.55), { d: 0, ink: false });
      spread(x0, x1, 300, 6, (x, h) => {
        if (h > 0.4) return;
        const y = -140 + h * 360,
          k = 1 + (y + 150) / 300;
        paint(g, ell(x, y, 24 * k, 12 * k), nt(MT.VALUE_8A8A84, tp, 0.5), { d: 4, lw: 1 });
      });
      backShade(g, x0, x1, 0.12);
    },
    props: (WW) =>
      props([
        { asset: pick(MT.CAMPFIRE), x: WW * 0.4, lane: MT.MID },
        { asset: pick(MT.WAR_DRUM, MT.BARREL), x: WW * 0.25, lane: MT.BACK },
        { asset: pick(MT.BARREL), x: WW * 0.6, lane: MT.BACK },
        { asset: pick(MT.SWORD_RACK, MT.CRATE), x: WW * 0.75, lane: MT.BACK },
        { asset: pick(MT.HAY_BALE), x: WW * 0.88, lane: MT.BACK },
      ]),
  });
  for (const id of ENVS) {
    if (!T.list.envs.includes(id)) T.list.envs.push(id);
    if (!TALES.envs.includes(id)) TALES.envs.push(id);
  }
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
