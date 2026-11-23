import { MOTION_MASTER as M } from "./motionMasterScale.js";
import { MOTION_AIR_DISTANCE, MOTION_OBJECT_SIZE as Z } from "./motionObjectSize.js";
import { MOTION_SCENE_REVISE } from "./motionSceneSpec.js";
import { MOTION_TIMELINE } from "./motionTimeline.js";
export const MOTION_SCENE_ENGINE = String.raw`(function () {
const MASTER_STD = ${JSON.stringify({ SHOTS: M.SHOTS, GENRE: M.GENRE, PORTRAIT_WIDTH: M.PORTRAIT_WIDTH, THING: M.THING, LEAST_SCALE: M.LEAST_SCALE })};
const SIZE_STD = ${JSON.stringify(Z)};
const AIR_DIST = ${JSON.stringify(MOTION_AIR_DISTANCE)};
const REVISE = ${JSON.stringify(MOTION_SCENE_REVISE)};
const TIME_CUES = ${JSON.stringify(MOTION_TIMELINE.CUES)};
const AIR_TILT = 25 * Math.PI / 180;
const S = window.__motionSpec || { items: [] };
const FW = (S.frame && +S.frame[0]) || 1280, FH = (S.frame && +S.frame[1]) || 720;
const canvas = document.getElementById('motion-canvas'), ctx = canvas.getContext('2d');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
const smooth = (a, b, x) => { const k = clamp((x - a) / ((b - a) || 1e-6), 0, 1); return k * k * (3 - 2 * k); };
const rnd = (s, i) => { const v = Math.sin(s * 127.1 + i * 311.7) * 43758.5453; return v - Math.floor(v); };
const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const FIG = window.MotionFigures.use({});
const K = window.MotionKit;
const H0 = S.interior ? FH : clamp(+S.horizon || FH * 0.42, 120, FH * 0.78);
const SKY = { day: ['#8fb9d9', '#e4eee6'], dawn: ['#c4a3c4', '#f3d8b4'], dusk: ['#d28659', '#f1d09a'], night: ['#141d36', '#33456a'] };
const LAND = { dirt: '#b39a72', grass: '#8ea566', sand: '#d8c294', snow: '#e9eef1', mud: '#6f5a3f', stone: '#a29c8f' };
const ASPECT = { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1, bridge: 4, sticker: 1 };
const NUM = ['x', 'y', 'h', 'w'];
function stateAt(it, p) {
  const base = Object.assign({}, it.look || {}, { x: isFinite(+it.x) ? it.x : isFinite(+it.from) && isFinite(+it.to) ? (+it.from + +it.to) / 2 : it.x, y: it.y, h: it.h, w: it.w, facing: it.facing });
  const keys = (Array.isArray(it.keys) ? it.keys : []).filter((k) => k && isFinite(+k.at)).slice().sort((a, b) => a.at - b.at);
  if (!keys.length) return Object.assign(base, { moving: false, distance: 0 });
  const frames = [Object.assign({}, base, keys[0])];
  for (let j = 1; j < keys.length; j++) frames.push(Object.assign({}, frames[j - 1], keys[j]));
  const out = Object.assign({}, base, window.MotionFigures.track(frames, p));
  const i = Math.max(0, frames.findIndex((f, j) => j + 1 >= frames.length || p < frames[j + 1].at)), next = frames[i + 1];
  const dx = next && isFinite(+next.x) && isFinite(+frames[i].x) ? next.x - frames[i].x : 0;
  out.moving = !!out.moving && Math.abs(dx) > 2;
  if (out.moving && !keys.some((k) => k.facing != null)) out.facing = dx < 0 ? -1 : 1;
  if (!isFinite(+out.distance)) out.distance = 0;
  delete out.at; delete out.k; delete out.index;
  return out;
}
function mudFloor(sky) {
  const M = REVISE.MUD;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < M.RUTS; i++) {
    const k = 0.25 + 0.75 * rnd(113, i), y = H0 + (FH + 20 - H0) * k * k, x = rnd(127, i) * FW, w = 80 + 260 * k;
    ctx.strokeStyle = M.RUT; ctx.lineWidth = 1.5 + 4 * k;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y - 6 * k, x + w, y + 3); ctx.stroke();
  }
  for (let i = 0; i < M.PUDDLES; i++) {
    const k = 0.3 + 0.7 * rnd(131, i), y = H0 + (FH + 20 - H0) * k * k, x = rnd(137, i) * FW, rx = 18 + 70 * k, ry = rx * (0.12 + 0.06 * rnd(139, i));
    ctx.fillStyle = mix(sky[1], '#5d6b72', 0.45); ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1 + k;
    ctx.beginPath(); ctx.moveTo(x - rx * 0.4, y - ry * 0.2); ctx.lineTo(x + rx * 0.1, y - ry * 0.2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function backdrop(t) {
  const sky = SKY[S.time] || SKY.day, land = LAND[S.ground] || LAND.dirt;
  let g = ctx.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  ctx.fillStyle = g; ctx.fillRect(-20, -20, (FW + 40), H0 + 22);
  const sk = S.sky || {};
  if (sk.sun !== false && (S.time === 'day' || S.time === 'dawn' || S.time === 'dusk')) K.scenery(ctx, { kind: 'sun', x: isFinite(+sk.sunX) ? +sk.sunX : FW * 0.84, y: H0 * 0.3, r: 32 });
  if (S.time === 'night') K.scenery(ctx, { kind: 'moon', x: isFinite(+sk.sunX) ? +sk.sunX : FW * 0.82, y: H0 * 0.3, r: 28 });
  for (let i = 0; i < (sk.clouds || 0); i++) {
    const x = ((rnd(7, i) * (FW + 220) + t * (6 + 4 * rnd(3, i))) % (FW + 220)) - 110, y = H0 * (0.14 + 0.45 * rnd(5, i)), r = 30 + 24 * rnd(9, i);
    ctx.save(); ctx.globalAlpha = 0.85; K.scenery(ctx, { kind: 'mist', x, y, r, width: r * 4, height: r * 1.3, seed: i + 2 }); ctx.restore();
  }
  if (sk.birds) K.scenery(ctx, { kind: 'birds', x: 380 + t * 9, y: H0 * 0.3, r: 24, seed: 4 });
  if (S.ridge && S.ridge !== 'none') {
    const n = S.ridge === 'hills' ? 2 : 1;
    for (let k = n; k >= 1; k--) {
      const top = H0 - (k === 2 ? 64 : 26), col = mix(land, sky[1], k === 2 ? 0.62 : 0.42);
      ctx.beginPath(); ctx.moveTo(-20, H0 + 2);
      for (let x = -20; x <= (FW + 20); x += 30) ctx.lineTo(x, top + 14 * Math.sin(x / (150 + 50 * k) + k) + 8 * Math.sin(x / 61 + 2 * k));
      ctx.lineTo((FW + 20), H0 + 2); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
  }
  g = ctx.createLinearGradient(0, H0, 0, (FH + 20)); g.addColorStop(0, mix(land, sky[1], 0.35)); g.addColorStop(0.45, land); g.addColorStop(1, mix(land, '#000000', 0.2));
  ctx.fillStyle = g; ctx.fillRect(-20, H0, (FW + 40), (FH + 40));
  ctx.save(); ctx.strokeStyle = 'rgba(70,52,30,0.18)'; ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) { const k = rnd(11, i), y = H0 + ((FH + 20) - H0) * k * k, x = rnd(13, i) * (FW + 60) - 30, w = 30 + 120 * k; ctx.lineWidth = 1 + 2.5 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + 1); ctx.stroke(); }
  ctx.restore();
  if (S.ground === 'mud') mudFloor(sky);
  (S.water || []).forEach((w, i) => { if (!isFinite(+w.y)) return; if (w.into) return riverInto(w.into, i, t); if (w.kind === 'moat' || w.kind === 'ravine' || w.kind === 'road') return bandAcross(w, i, t); K.scenery(ctx, { kind: w.kind || 'river', x: FW / 2, y: +w.y + (+w.h || 60) / 2, width: (FW + 120), height: +w.h || 60, r: (+w.h || 60) / 2, seed: i + 1, t }); });
  (S.scatter || []).forEach((s, j) => {
    const area = Array.isArray(s.area) ? s.area : [0, H0 + 8, FW, FH];
    for (let i = 0; i < (s.count || 0); i++) {
      const k = rnd(29 + j, i), y = area[1] + (area[3] - area[1]) * k * k, x = area[0] + rnd(31 + j, i) * (area[2] - area[0]), r = 4 + 34 * ((y - H0) / (FH - H0));
      const sp = STRIP.on && C_STAND.indexOf(STRIP.on.kind) < 0 && stripAt(y);
      if (sp && Math.abs(x - sp.c) < sp.half * (s.kind === 'reeds' ? REVISE.CROSS.EDGE : 1) + r) continue;
      if (s.kind === 'stuckArrow') { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + rnd(37, i) * 0.6); ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 1.4); ctx.stroke(); ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.moveTo(0, -r * 1.4); ctx.lineTo(-r * 0.18, -r * 1.15); ctx.lineTo(0, -r * 1.22); ctx.lineTo(r * 0.18, -r * 1.15); ctx.closePath(); ctx.fill(); ctx.restore(); continue; }
      K.scenery(ctx, { kind: s.kind, x, y, r, seed: i + j * 7, t });
    }
  });
}
function gapPaint(kind, a, b, i, t, wide) {
  const yr = +VIEW.year || 1300, poly = () => { ctx.beginPath(); a.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); b.slice().reverse().forEach((q) => ctx.lineTo(q[0], q[1])); ctx.closePath(); };
  const edge = (col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; [a, b].forEach((side) => { ctx.beginPath(); side.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); }); };
  const lerpPt = (k, f) => { const n = a.length - 1, j = Math.min(n, Math.round(k * n)); return [a[j][0] + (b[j][0] - a[j][0]) * f, a[j][1] + (b[j][1] - a[j][1]) * f]; };
  ctx.save(); poly();
  const top = Math.min(a[0][1], b[0][1]), bot = Math.max(a[a.length - 1][1], b[b.length - 1][1]), g = ctx.createLinearGradient(0, top, 0, bot);
  if (kind === 'ravine') { g.addColorStop(0, '#5a5048'); g.addColorStop(1, '#241e1a'); }
  else if (kind === 'road') { const c = yr >= 1900 ? ['#6a6a6a', '#4a4a4c'] : yr >= 1600 && yr < 1930 ? ['#9a8e80', '#7a6e62'] : yr >= -300 && yr < 500 ? ['#a49a8a', '#857a6a'] : ['#b89c72', '#9a7e56']; g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); }
  else { g.addColorStop(0, '#9fc0cf'); g.addColorStop(0.5, '#6f9ab0'); g.addColorStop(1, '#5a879e'); }
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip(); ctx.lineCap = 'round';
  if (kind === 'ravine') { ctx.fillStyle = 'rgba(20,16,12,0.35)'; for (let k = 0; k < 18; k++) { const p = lerpPt(rnd(81 + i, k), rnd(83 + i, k) < 0.5 ? 0.08 : 0.92), r0 = 3 + 10 * rnd(85, k) * (wide ? 1 : 0.6); ctx.beginPath(); ctx.ellipse(p[0], p[1], r0 * 1.6, r0, 0, 0, Math.PI * 2); ctx.fill(); } }
  else if (kind === 'road') {
    ctx.strokeStyle = 'rgba(40,30,20,0.25)';
    if (yr >= 1920) { ctx.strokeStyle = 'rgba(240,236,220,0.85)'; for (let k = 0; k < 40; k += 2) { const p0 = lerpPt(k / 40, 0.5), p1 = lerpPt((k + 1) / 40, 0.5); ctx.lineWidth = Math.max(1, (p0[1] - H0) * 0.012); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); } }
    else if (yr >= 1600 || (yr >= -300 && yr < 500)) { for (let k = 0; k < 60; k++) { const p = lerpPt(rnd(87 + i, k), rnd(89 + i, k)), r0 = Math.max(1.5, (p[1] - H0) * 0.02); ctx.lineWidth = 1; ctx.strokeRect(p[0] - r0, p[1] - r0 * 0.5, r0 * 2, r0); } }
    else { [0.3, 0.7].forEach((f) => { ctx.beginPath(); for (let k = 0; k <= 30; k++) { const p = lerpPt(k / 30, f); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.lineWidth = 2; ctx.stroke(); }); }
  } else {
    ctx.strokeStyle = 'rgba(235,245,250,0.7)';
    for (let k = 0; k < 26; k++) { const f = rnd(73 + i, k), p = lerpPt(Math.pow(rnd(71 + i, k), 1.2), 0.15 + 0.7 * f), q = lerpPt(Math.pow(rnd(71 + i, k), 1.2), 0.15 + 0.7 * f + 0.1), len = Math.max(4, Math.abs(q[0] - p[0]) + (p[1] - H0) * 0.08), dx = ((t * 18 + k * 13) % 40) - 20; ctx.lineWidth = Math.max(1, (p[1] - H0) * 0.006); ctx.beginPath(); ctx.moveTo(p[0] - len / 2 + dx * 0.1, p[1]); ctx.lineTo(p[0] + len / 2 + dx * 0.1, p[1]); ctx.stroke(); }
  }
  ctx.restore();
  edge(kind === 'moat' ? 'rgba(120,112,100,0.9)' : kind === 'road' ? 'rgba(80,64,44,0.35)' : kind === 'ravine' ? 'rgba(40,32,26,0.8)' : 'rgba(60,48,36,0.55)', kind === 'moat' ? 4 : 2);
  ctx.restore();
}
function riverInto(r, i, t) {
  const ys = [];
  for (let y = H0; y <= FH + 30; y += 6) ys.push(y);
  const at = ys.map((y) => stripAt(y));
  gapPaint(r.kind || 'river', ys.map((y, j) => [at[j].c - at[j].half, y]), ys.map((y, j) => [at[j].c + at[j].half, y]), i, t, true);
}
function bandAcross(w, i, t) {
  const xs = [], y0 = +w.y, y1 = +w.y + (+w.h || 60);
  for (let x = -20; x <= FW + 20; x += 20) xs.push(x);
  gapPaint(w.kind, xs.map((x) => [x, y0]), xs.map((x) => [x, y1]), i, t, false);
}
const RES = {};
const SPARE = document.createElement('canvas').getContext('2d');
let PERSON_H = 0, DUR = 10;
const personR = (h) => { if (!PERSON_H) { const q = quiet(() => K.person(SPARE, { x: 0, y: 1000, r: 100, pose: 'stand', noShadow: true })); PERSON_H = q && +q.height > 0 ? +q.height / 100 : 7.4; } return h / PERSON_H; };
const mountOf = (kind, h) => { const real = SIZE_STD[kind] || SIZE_STD.horse, man = h / REVISE.RIDER; return { h: man * real.h, w: man * real.l, r: personR(man) }; };
const FEARFUL = (q) => !!q && (q.pose === 'cower' || q.pose === 'huddle' || q.expression === 'scared');
const FEAR_AT = {};
const fearStart = (it) => { if (FEAR_AT[it.id] == null) { const k = FEARFUL(it.look) ? null : keysOf(it).filter((q) => isFinite(+q.at)).sort((a, b) => a.at - b.at).find(FEARFUL); FEAR_AT[it.id] = k ? +k.at : 0; } return FEAR_AT[it.id]; };
function trembleOf(it, o, front, t) {
  const T = REVISE.TREMBLE, lead = it.id === S.focus;
  if (it.fn !== 'person' || !FEARFUL(o) || (!lead && (front >= T.GROUP || +o.h < FH * T.NEAR))) return 0;
  const since = t - fearStart(it) * DUR;
  return T.AMP * (since < T.FULL ? 1 : clamp(1 - (since - T.FULL) / T.FADE, lead ? T.REST : 0, 1));
}
const mountAt = (it, p) => { const k = (it.mountKeys || []).filter((q) => +q.at <= p).pop(); return k ? Object.assign({}, it.mountLook || {}, { pose: k.pose }) : null; };
const quiet = (f) => { const mk = window.motionMark; window.motionMark = null; try { return f(); } finally { window.motionMark = mk; } };
const hipDrop = (o) => { const r = quiet(() => FIG.person(SPARE, Object.assign({}, o, { mark: undefined, y: 1000 }))); return r && isFinite(r.hip) ? 1000 - r.hip : 0; };
const WALLS = ['wall', 'palisade', 'fence', 'wagonFort', 'gate', 'sandbags', 'barbedWire', 'stakeRow', 'earthwork'];
function wallPiece(it, o, lo, hi) {
  const len = hi - lo, mid = (lo + hi) / 2;
  if (it.kind === 'wagonFort' && len < o.h * 3.4) {
    const n = Math.max(1, Math.round(len / (o.h * 1.7))), each = len / n;
    let r = null;
    for (let i = 0; i < n; i++) { const q = FIG.vehicle(ctx, Object.assign({}, o, { kind: 'wagon', x: lo + each * (i + 0.5), w: undefined, mark: i ? undefined : o.mark })); r = r || q; }
    return r;
  }
  return FIG.wall(ctx, Object.assign({}, o, { kind: it.kind || 'wall', x: mid, w: Math.max(len, o.h * 0.6) }));
}
function ringWall(it, o) {
  const a = +it.from, b = +it.to, cx = (a + b) / 2, rx = Math.abs(b - a) / 2, ry = Math.max(2, Math.min(rx * 0.24, (+o.y - H0 - FH * 0.01) / 2)), step = o.h * (it.kind === 'wagonFort' ? 1.7 : 1.2), n = Math.max(6, Math.round((Math.PI * (rx + ry)) / step)), gaps = Array.isArray(it.gaps) ? it.gaps : [];
  const pts = [];
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2, sn = Math.sin(th); const y = +o.y - ry + ry * sn; pts.push({ x: cx + rx * Math.cos(th), y, k: clamp((y - H0) / Math.max(1, +o.y - H0), 0.25, 1), front: sn > 0 }); }
  let res = null;
  pts.sort((u, v) => u.y - v.y).forEach((q) => {
    if (q.front && gaps.some((g) => q.x > +g[0] && q.x < +g[1])) return;
    const opt = Object.assign({}, o, { x: q.x, y: q.y, h: o.h * q.k, mark: res ? undefined : o.mark });
    const r = it.kind === 'wagonFort' ? FIG.vehicle(ctx, Object.assign(opt, { kind: 'wagon', w: undefined })) : FIG.wall(ctx, Object.assign(opt, { kind: it.kind || 'wall', w: step * q.k * 0.95 }));
    res = res || r;
  });
  return res;
}
function damaged(it, o) {
  const fallen = it.state === 'collapsed', y = +o.y, f = (+o.facing || 1) < 0 ? -1 : 1;
  ctx.save();
  if (fallen) { ctx.beginPath(); ctx.rect(-FW, y - +o.h * 0.5, FW * 3, FH * 2); ctx.clip(); }
  const res = FIG[it.fn] ? FIG[it.fn](ctx, Object.assign({}, o, fallen ? {} : { angle: f * 0.16 })) : null;
  ctx.restore();
  const b = res && res.box, w = b ? b.w : +o.h, x0 = b ? b.x : +o.x - w / 2, tone = it.fn === 'building' || it.fn === 'wall' ? '#8a8478' : '#5a4030';
  ctx.save(); ctx.fillStyle = tone; ctx.strokeStyle = '#2a2522'; ctx.lineWidth = Math.max(1, +o.h * 0.012);
  for (let i = 0; i < (fallen ? 14 : 5); i++) { const px = x0 + rnd(61, i) * w, pw = +o.h * (0.06 + 0.1 * rnd(63, i)), ph = pw * 0.35, py = fallen && i % 2 ? y - +o.h * (0.5 - 0.04 * rnd(69, i)) : y - ph * 0.5 + rnd(67, i) * +o.h * 0.04; ctx.save(); ctx.translate(px, py); ctx.rotate((rnd(65, i) - 0.5) * 1.4); ctx.fillRect(-pw / 2, -ph / 2, pw, ph); ctx.strokeRect(-pw / 2, -ph / 2, pw, ph); ctx.restore(); }
  ctx.restore();
  return res;
}
function drawOne(it, st, o, t, first) {
  if (it.mount) {
    const m = mountOf(it.mount, o.h), ml = st.mount || it.mountLook || {};
    const rider = Object.assign({ pose: 'ride' }, o, { mark: undefined, x: undefined, y: undefined, h: undefined, w: undefined, r: m.r });
    const r = FIG.animal(ctx, Object.assign({ mark: o.mark, kind: it.mount, x: o.x, y: o.y, h: m.h, w: m.w, facing: o.facing, seed: o.seed, pose: st.moving ? 'run' : 'stand', distance: st.moving ? o.distance : undefined, rider }, ml));
    if (!r || !r.rider) return r;
    const b = r.box || { x: o.x - m.w / 2, y: o.y - m.h, w: m.w, h: m.h }, top = Math.min(b.y, isFinite(+r.rider.top) ? +r.rider.top : b.y);
    return Object.assign({}, r.rider, { box: { x: b.x, y: top, w: b.w, h: b.y + b.h - top } });
  }
  if (it.fn === 'bridge') return FIG.bridge(ctx, Object.assign({}, o, { w: +it.w || +st.w || o.h * ASPECT.bridge, build: o.build || undefined }, Array.isArray(it.from) && Array.isArray(it.to) ? { from: it.from, to: it.to } : {}, it.railOnly ? { railOnly: true, mark: undefined } : {}));
  if (it.fn === 'wall' || WALLS.indexOf(it.kind) >= 0) {
    if (it.shape === 'ring' && isFinite(+it.from) && isFinite(+it.to)) return ringWall(it, o);
    const a = isFinite(+it.from) ? +it.from : o.x - (o.w || o.h * 3) / 2, b = isFinite(+it.to) ? +it.to : o.x + (o.w || o.h * 3) / 2;
    let pieces = [[Math.min(a, b), Math.max(a, b)]];
    (Array.isArray(it.gaps) ? it.gaps : []).forEach((g) => { pieces = pieces.flatMap(([l, r]) => (+g[1] <= l || +g[0] >= r ? [[l, r]] : [[l, +g[0]], [+g[1], r]].filter(([u, v]) => v - u > 2))); });
    let res = null;
    pieces.forEach(([lo, hi], k) => { const q = wallPiece(it, Object.assign({}, o, { mark: k ? undefined : o.mark }), lo, hi); res = res || q; });
    return res;
  }
  const res = it.state && it.fn !== 'person' && it.fn !== 'animal' ? damaged(it, o) : FIG[it.fn] ? FIG[it.fn](ctx, o) : null;
  if (it.burning && res && res.box) { scorch(res.box, it.id); K.effect(ctx, { kind: 'burning', x: res.box.x + res.box.w / 2, y: res.box.y + res.box.h * 0.35, r: res.box.h * 0.5, t, seed: 1 }); }
  return res;
}
function scorch(b, id) {
  const R = REVISE.SCORCH, seed = String(id).length;
  ctx.save();
  ctx.fillStyle = R.SOOT;
  for (let i = 0; i < R.SPOTS; i++) {
    const x = b.x + b.w * (0.15 + 0.7 * rnd(101 + seed, i)), y = b.y + b.h * (0.1 + 0.55 * rnd(103 + seed, i)), rx = b.w * (0.08 + 0.1 * rnd(107 + seed, i)), ry = b.h * (0.06 + 0.08 * rnd(109 + seed, i));
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawItem(it, p, t) {
  const st = stateAt(it, p);
  if (it.fn === 'sticker') return drawSticker(it, st, p, t);
  if (it.mountKeys) st.mount = mountAt(it, p) || st.mount;
  if (!isFinite(+st.x) || !isFinite(+st.y) || !(+st.h > 0)) return;
  if (it.at && (p < it.at[0] || p > it.at[1])) return;
  if (it.anchor) { RES[it.id] = Object.assign({}, it.anchor, { box: it.anchor }); return; }
  const look = Object.assign({}, st);
  ['x', 'y', 'h', 'w', 'facing', 'moving', 'distance', 'mount'].forEach((k) => delete look[k]);
  let x = +st.x, y = +st.y;
  const real = it.kind && SIZE_STD[it.kind];
  const flying = it.fn === 'prop' && real && real.place === 'air';
  const lands = it.fn === 'prop' && !it.heldBy && REVISE.HURLED.indexOf(it.kind) >= 0 && keysOf(it).filter((q) => isFinite(+q.y)).length > 1 ? Math.max(...keysOf(it).filter((q) => isFinite(+q.y)).map((q) => +q.y)) : 0;
  const h = lands > H0 ? +st.h * clamp((+st.y - H0) / (lands - H0), REVISE.HURL_MIN, 1) : +st.h, w = +st.w || (flying ? h * (real.l / real.h) : it.mount ? mountOf(it.mount, h).w : h * (ASPECT[it.fn] || 1));
  let facing = (+st.facing || 1) < 0 ? -1 : 1;
  if (real && real.place === 'air' && !/parked|launch/.test(String(look.pose || '')) && it.keys && it.keys.length > 1 && it.fn !== 'animal') {
    const a = stateAt(it, Math.max(0, p - 0.01)), b = stateAt(it, Math.min(1, p + 0.01)), vx = +b.x - +a.x, vy = +b.y - +a.y;
    if (Math.hypot(vx, vy) > 0.5) {
      facing = vx < 0 ? -1 : 1;
      const free = PROJECTILE.test(it.kind), lim = free ? Math.PI / 2 : AIR_TILT;
      look.angle = clamp(Math.atan2(vy, Math.abs(vx)) * facing, -lim, lim);
    }
  }
  if (!it.keys || !it.keys.length) x = clamp(x, w * 0.45, FW - w * 0.45);
  const seat = it.on && RES[it.on] && RES[it.on].box;
  if (seat) x = seat.x + seat.w / 2;
  ctx.save();
  if (it.fade) ctx.globalAlpha = 1 - smooth(it.fade[0], it.fade[1], p);
  const g = it.group || {}, n = Math.max(1, Math.round(+g.count || 1)), rows = Math.max(1, Math.round(+g.rows || (n > 6 ? 2 : 1))), gw = +g.width || w * n * 0.6, depth = +g.depth || h * 0.14;
  const members = [];
  const strewn = it.fn === 'prop' && n > 1 && (STREWN.test(String(it.kind || '')) || new RegExp(REVISE.DROPPED).test(String(it.id || '')));
  if (strewn) {
    const T = REVISE.STREWN, m = Math.min(n, T.MOST), spots = [];
    for (let i = 0; i < m; i++) {
      let best = null;
      for (let k = 0; k < T.TRIES; k++) {
        const c = { x: x - gw / 2 + rnd(61 + k, i) * gw, y: y - rnd(67 + k, i) * Math.max(depth * T.DEPTH, h * T.DEPTH_H) };
        const gap = Math.min(...spots.map((q) => Math.hypot((q.x - c.x) / (w * 0.6), (q.y - c.y) / (depth * 0.6 + 1))), Infinity);
        if (!best || gap > best.gap) best = Object.assign(c, { gap });
        if (gap > 1.2) break;
      }
      spots.push(best);
      members.push({ i, row: 0, x: best.x, y: best.y, s: 0.85 + 0.25 * rnd(71, i), turn: (rnd(73, i) - 0.5) * T.TURN, flip: rnd(79, i) > 0.5 });
    }
  }
  for (let i = 0; i < (strewn ? 0 : n); i++) {
    const row = i % rows, col = Math.floor(i / rows), cols = Math.ceil(n / rows);
    const k = rows > 1 ? row / (rows - 1) : 0, s = 1 - 0.1 * k;
    members.push({ i, row, x: n > 1 ? x - gw / 2 + ((col + 0.5 + (row % 2) * 0.35) / cols) * gw + (rnd(41, i) - 0.5) * gw * 0.06 : x, y: y - k * depth, s: s * (n > 1 ? 0.95 + 0.1 * rnd(43, i) : 1) });
  }
  members.sort((a, b) => a.y - b.y);
  members.forEach((m, j) => {
    const o = Object.assign({}, look, { mark: it.id, x: m.x, y: m.y, h: h * m.s, w: +st.w > 0 || it.fn === 'person' || it.fn === 'animal' || it.mount || flying ? w * m.s : undefined, facing, seed: 3 + m.i * 5 + it.id.length, distance: st.distance + ((m.i * 0.618) % 1) * 1.3 * h * m.s });
    if (it.kind) o.kind = it.kind;
    if (m.turn !== undefined) { if (!o.lying) o.angle = (+o.angle || 0) + m.turn; if (m.flip) o.facing = -facing; }
    if ((it.fn === 'person' || it.fn === 'animal') && st.moving && (!o.pose || o.pose === 'stand' || o.pose === 'walk')) o.pose = o.pose === 'walk' ? 'walk' : 'run';
    if (seat && it.fn === 'person') { o.pose = o.pose || 'sit'; o.y = seat.y + hipDrop(o) + seat.h * 0.06; }
    if (it.fn === 'person') { o.tremble = trembleOf(it, o, members.length - 1 - j, t); o.trembleHz = REVISE.TREMBLE.HZ; }
    if (it.fn === 'person' && n > 1) { ['top', 'pants'].forEach((k, q) => { if (HEX.test(String(o[k] || ''))) o[k] = mix(o[k], rnd(47 + q, m.i) > 0.5 ? '#ffffff' : '#000000', rnd(53 + q, m.i) * REVISE.CROWD.TONE); }); if (!look.hairColor) o.hairColor = REVISE.CROWD.HAIR[Math.floor(rnd(59, m.i) * REVISE.CROWD.HAIR.length)];
      const C = REVISE.CROWD, kin = C.HEADS[String(look.head || 'none')];
      if (m.i && kin && rnd(83, m.i) < C.HEAD_SWAP) o.head = kin[Math.floor(rnd(89, m.i) * kin.length)];
      if (m.i && C.FLEE_POSES.indexOf(String(o.pose || '')) >= 0 && (C.SCARED.indexOf(String(o.expression || '')) >= 0 || said(REVISE.WORDS.FLEE)) && o.hold && C.KEEP_HOLD.indexOf(String(o.hold)) < 0 && rnd(97, m.i) < C.DROP_HOLD) { delete o.hold; delete o.shield; } }
    const r = drawOne(it, st, o, t, !m.i);
    if (!m.i) RES[it.id] = Object.assign({ x: o.x, y: o.y, h: o.h, w: o.w, facing, look }, r || {});
  });
  ctx.restore();
}
const STICK = {};
const stickerFn = (it) => {
  if (STICK[it.id] === undefined) { try { STICK[it.id] = new Function('c', 'w', 'h', 't', 'p', it.code || ''); } catch (e) { STICK[it.id] = null; } }
  return STICK[it.id];
};
function drawSticker(it, st, p, t) {
  if (it.at && (p < it.at[0] || p > it.at[1])) return;
  const f = stickerFn(it);
  if (!f) return;
  const who = it.heldBy && RES[it.heldBy], w = +st.w || +st.h || 40, h = +st.h || w;
  let x, y;
  if (who) { const hp = it.hand === 'back' ? who.backHand || who.hand : who.hand || who.backHand; if (!hp) return; x = hp[0]; y = hp[1]; }
  else { x = +st.x; y = +st.y; if (!isFinite(x) || !isFinite(y)) return; }
  ctx.save(); ctx.translate(x, y); if ((+st.facing || 1) < 0) ctx.scale(-1, 1);
  if (window.motionMark) window.motionMark(ctx, it.id, -w / 2, who ? -h / 2 : -h, w, h);
  ctx.translate(-w / 2, who ? -h / 2 : -h);
  try { f(ctx, w, h, t, p); } catch (e) {}
  ctx.restore();
}
const wetAt = (x, y) => { const st = stripAt(y); if (st && STRIP.on && REVISE.CROSS.STAND.indexOf(STRIP.on.kind) < 0) return Math.abs(x - st.c) < st.half; return (S.water || []).some((w) => !w.into && REVISE.TRAIL.WET.indexOf(w.kind || 'river') >= 0 && y > +w.y + 2 && y < +w.y + (+w.h || 60) - 2); };
const footOfMover = (it, st) => { const h = +st.h || +it.h || 60, body = it.mount ? mountOf(it.mount, h).w : h * 0.4, f = (+st.facing || 1) < 0 ? -1 : 1; return { x: +st.x - f * body * REVISE.TRAIL.BEHIND, y: +st.y, h, f }; };
function liveEffects(p) {
  const T = REVISE.TRAIL, out = [], led = new Set();
  (S.effects || []).forEach((e) => {
    if (!e.of) return out.push(e);
    const it = S.items.find((q) => q.id === e.of);
    if (!it) return;
    const st = stateAt(it, p);
    if (!st.moving) return;
    const ft = footOfMover(it, st), wet = wetAt(+st.x, +st.y);
    led.add(it.id);
    if (wet) out.push({ kind: 'splash', x: 2 * +st.x - ft.x, y: ft.y, r: ft.h * T.SPLASH, facing: ft.f });
    out.push(Object.assign({}, e, { x: ft.x, y: ft.y, kind: wet ? 'splash' : e.kind === 'splash' ? 'dustTrail' : e.kind, r: wet ? ft.h * T.SPLASH : clamp(+e.r || ft.h * T.R, ft.h * T.MIN, ft.h * T.MAX), facing: ft.f, at: undefined }));
  });
  S.items.forEach((it) => {
    if (led.has(it.id) || !(it.fn === 'person' || it.fn === 'animal') || it.deck || !moves(it)) return;
    const st = stateAt(it, p);
    if (!st.moving || !wetAt(+st.x, +st.y)) return;
    const ft = footOfMover(it, st);
    const body = it.mount ? mountOf(it.mount, ft.h).w : ft.h * 0.4;
    [-0.3, 0.3].forEach((k) => out.push({ kind: 'splash', x: +st.x + k * body * ft.f, y: ft.y, r: ft.h * T.SPLASH, facing: ft.f }));
  });
  return out;
}
function trails() {
  const T = REVISE.TRAIL, movers = S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal' || it.fn === 'vehicle') && moves(it) && +it.h > 0);
  if (!movers.length) return;
  (S.effects || []).forEach((e) => {
    if (T.KINDS.indexOf(e.kind) < 0 || !isFinite(+e.x) || !isFinite(+e.y)) return;
    const at = e.at ? [+e.at[0], (+e.at[0] + +e.at[1]) / 2, +e.at[1]] : [0, 0.25, 0.5, 0.75, 1];
    const best = movers.map((m) => ({ m, d: Math.min(...at.map((q) => { const st = stateAt(m, q); return Math.hypot(+st.x - +e.x, (+st.y - +e.y) * 1.5); })) })).sort((a, b) => a.d - b.d)[0];
    if (!best || best.d > Math.max(+best.m.h * T.NEAR, (+e.r || 40) * 1.5)) return;
    e.of = best.m.id;
    note('trail', best.m.id);
  });
}
function effects(list, p, t) {
  (list || []).forEach((e, i) => { if (e.at && (p < e.at[0] || p > e.at[1])) return; const r = +e.r || 40; K.effect(ctx, { kind: e.kind, x: +e.x, y: +e.y, r, width: r * 3, height: r * 2, t, seed: i + 1, facing: e.facing }); });
}
function haze(p, t) {
  if (!S.haze) return;
  const a = clamp(+S.haze.amount || 0, 0, 0.8) * (S.haze.at ? 0.35 + 0.65 * smooth(S.haze.at[0], S.haze.at[1], p) : 1), col = S.haze.kind === 'dust' ? '214,186,132' : '170,165,160';
  const g = ctx.createLinearGradient(0, H0 - 160, 0, FH);
  g.addColorStop(0, 'rgba(' + col + ',' + (a * 0.85).toFixed(3) + ')'); g.addColorStop(0.5, 'rgba(' + col + ',' + (a * 0.35).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',' + (a * 0.08).toFixed(3) + ')');
  ctx.fillStyle = g; ctx.fillRect(-20, -20, (FW + 40), (FH + 40));
}
function veil() {
  const sky = SKY[S.time] || SKY.day, y1 = H0 + (FH - H0) * 0.32, g = ctx.createLinearGradient(0, H0 - 120, 0, y1);
  const c = sky[1], rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).join(',');
  g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(0.45, 'rgba(' + rgb + ',0.34)'); g.addColorStop(0.7, 'rgba(' + rgb + ',0.2)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g; ctx.fillRect(-20, H0 - 120, (FW + 40), y1 - H0 + 120);
}
function finish() {
  const sk = S.sky || {}, sx = isFinite(+sk.sunX) ? +sk.sunX : FW * 0.84, night = S.time === 'night';
  let g = ctx.createRadialGradient(sx, H0 * 0.3, 40, sx, H0 * 0.3, 900);
  g.addColorStop(0, night ? 'rgba(170,190,255,0.10)' : 'rgba(255,236,190,0.16)'); g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
  g = ctx.createRadialGradient(FW / 2, FH * 0.53, Math.min(FW, FH) * 0.58, FW / 2, FH * 0.53, Math.max(FW, FH) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, night ? 'rgba(5,8,20,0.5)' : 'rgba(40,28,15,0.28)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
}
function order(p) {
  const list = (S.items || []).filter((it) => !it.heldBy).map((it) => { const st = stateAt(it, p); return { it, z: isFinite(+it.z) ? +it.z : +st.y || 0 }; });
  list.forEach((e) => { if (e.it.on) { const s = list.find((f) => f.it.id === e.it.on); if (s) e.z = Math.max(e.z, s.z + 0.01); } });
  return list.sort((a, b) => a.z - b.z).map((e) => e.it);
}
function room() {
  const wall = S.interior.wall || '#b8a98a', floor = S.interior.floor || '#8a7356', fy = FH * 0.65;
  let g = ctx.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, mix(wall, '#000000', 0.25)); g.addColorStop(1, wall);
  ctx.fillStyle = g; ctx.fillRect(-20, -20, (FW + 40), fy + 20);
  g = ctx.createLinearGradient(0, fy, 0, (FH + 20)); g.addColorStop(0, mix(floor, '#000000', 0.15)); g.addColorStop(1, floor);
  ctx.fillStyle = g; ctx.fillRect(-20, fy, (FW + 40), (FH + 40));
  ctx.save(); ctx.strokeStyle = 'rgba(40,30,20,0.25)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const x = 70 + i * 145 + 30 * rnd(3, i); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 6, fy); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-20, fy); ctx.lineTo((FW + 20), fy); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
const OVERLAY = ['thought', 'inset', 'count', 'time'], OVERLAY_MAX = 2, TITLE_SAFE = FW < FH ? 0.08 : 0.05;
const LONG_HELD = /spear|lance|pike|halberd|banner|flag|pole|staff|bow|crossbow|musket|rifle|sword|axe|torch|oar|scythe|pitchfork/i;
function inBubble(it, x) {
  const out = {};
  if (isFinite(+it.from)) out.from = x + +it.from;
  if (isFinite(+it.to)) out.to = x + +it.to;
  if (Array.isArray(it.gaps)) out.gaps = it.gaps.map((g) => [x + +g[0], x + +g[1]]);
  return out;
}
let PLACED = [];
const inBox = (q, b, m) => q[0] > b.x - m && q[0] < b.x + b.w + m && q[1] > b.y - m && q[1] < b.y + b.h + m;
const lineHits = (a, b, box, m) => { for (let i = 1; i < REVISE.INSET.SAMPLES; i++) { const k = i / REVISE.INSET.SAMPLES; if (inBox([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], box, m)) return true; } return false; };
const nearLine = (c, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], k = clamp(((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / Math.max(1e-6, dx * dx + dy * dy), 0, 1); return Math.hypot(c[0] - a[0] - dx * k, c[1] - a[1] - dy * k); };
function insetSpot(r, from, toFrame, fallback) {
  const I = REVISE.INSET, gap = r * I.GAP, lo = FW * TITLE_SAFE + r, hi = FW * (1 - TITLE_SAFE) - r, spots = [];
  I.ROWS.forEach((row, k) => { const y = FH * TITLE_SAFE + r * row; for (let i = 0; i < I.COLS; i++) spots.push([lo + ((hi - lo) * i) / (I.COLS - 1), y, k ? r * I.LOW : 0]); });
  I.NEAR_RING.forEach((ring) => { for (let i = 0; i < I.NEAR_STEPS; i++) { const a = Math.PI + (Math.PI * i) / (I.NEAR_STEPS - 1), cx = from[0] + Math.cos(a) * r * ring, cy = from[1] + Math.sin(a) * r * ring; if (cx > lo && cx < hi && cy > FH * TITLE_SAFE + r && cy < FH - r) spots.push([cx, cy, 0]); } });
  const ok = (c) => {
    const box = { x: c[0] - r, y: c[1] - r, w: r * 2, h: r * 2 };
    if (hitsKey(box, toFrame)) return false;
    return PLACED.every((q) => !(Math.min(box.x + box.w, q.box.x + q.box.w) + gap > Math.max(box.x, q.box.x) && Math.min(box.y + box.h, q.box.y + q.box.h) + gap > Math.max(box.y, q.box.y)) && !lineHits(from, c, q.box, gap) && !(q.tail && nearLine(c, q.tail[0], q.tail[1]) < r + gap));
  };
  const cost = (c) => Math.hypot(c[0] - from[0], c[1] - from[1]) + c[2];
  const free = spots.filter(ok);
  return free.length ? free.reduce((a, b) => (cost(b) < cost(a) ? b : a)).slice(0, 2) : fallback;
}
function devices(p, t, layer, toFrame, zoom) {
  const over = layer === 'over';
  const spans = (a, b) => !a.at || !b.at || (a.at[0] <= b.at[1] && b.at[0] <= a.at[1]);
  if (over) PLACED = [];
  const list = (S.devices || []).filter((d) => !(d.at && (p < d.at[0] || p > d.at[1])) && (OVERLAY.indexOf(d.kind) >= 0) === over && (d.kind === 'spotlight') === (layer === 'final')).sort((a, b) => (a.kind === 'inset') - (b.kind === 'inset'));
  (over ? list.slice(0, OVERLAY_MAX) : list).forEach((d) => {
    const appear = d.at ? smooth(d.at[0], d.at[0] + 0.06, p) : 1, who = d.of && RES[d.of];
    const headAt = who && who.head ? who.head : who ? [who.x, who.y - who.h * 0.9] : null;
    if (d.kind === 'emote') { if (!headAt) return; const r = Math.max(14, (who.h || 200) * 0.08); FIG.device(ctx, { kind: 'emote', sign: d.sign || 'alarm', x: headAt[0] + r * 0.4, y: headAt[1] - (who.h || 200) * 0.16, r, appear }); return; }
    if (d.kind === 'thought') {
      const r = Math.min(+d.r || 100, FH * 0.2), head = headAt && toFrame(headAt[0], headAt[1]);
      let x = +d.x || FW / 2, y = +d.y || FH * 0.28;
      if (head && (zoom > 1.02 || !isFinite(+d.x))) { const side = head[0] < FW / 2 ? 1 : -1; x = head[0] + side * r * 1.5; y = head[1] - r * 1.25; }
      x = clamp(x, FW * TITLE_SAFE + r, FW * (1 - TITLE_SAFE) - r); y = clamp(y, FH * TITLE_SAFE + r, FH * 0.84 - r);
      if (hitsKey({ x: x - r * 1.6, y: y - r * 1.05, w: r * 3.2, h: r * 2.1 }, toFrame)) { const spot = freeSpot(r * 3.2, r * 2.1, toFrame, [x, y]); if (spot) { x = spot.x + r * 1.6; y = spot.y + r * 1.05; } }
      const others = (S.devices || []).filter((q) => q !== d && q.__box && spans(q, d)).map((q) => q.__box), clash = (bx) => others.some((q) => Math.min(bx.x + bx.w, q.x + q.w) > Math.max(bx.x, q.x) && Math.min(bx.y + bx.h, q.y + q.h) > Math.max(bx.y, q.y));
      if (clash({ x: x - r * 1.6, y: y - r * 1.05, w: r * 3.2, h: r * 2.1 })) { const spot = freeSpot(r * 3.2, r * 2.1, toFrame, [x, y], others); if (spot) { x = spot.x + r * 1.6; y = spot.y + r * 1.05; } }
      d.__box = { x: x - r * 1.6, y: y - r * 1.05, w: r * 3.2, h: r * 2.1 };
      const from = head && head[0] > 0 && head[0] < FW && head[1] > 0 && head[1] < FH ? head : undefined;
      const cy = d.fitted ? y : y + r * 0.45;
      PLACED.push({ box: { x: x - r * 1.6, y: y - r * 1.05, w: r * 3.2, h: r * 2.1 }, tail: from ? [from, [x, y]] : null, r });
      FIG.device(ctx, { kind: 'thought', x, y, r, from, appear }, () => { quiet(() => (d.items || []).forEach((it) => drawItem(Object.assign({}, it, { x: x + (+it.x || 0), y: d.fitted ? cy + +it.y : y + (it.y != null ? +it.y : r * 0.45), keys: undefined }, inBubble(it, x)), p, t))); });
      return;
    }
    if (d.kind === 'inset') {
      if (!who) return;
      const bubble = PLACED.find((q) => q.r), r = Math.min(+d.r || 110, Math.min(FW, FH) * REVISE.INSET.R_MAX, bubble ? bubble.r * REVISE.INSET.UNDER_THOUGHT : Infinity), lead = toFrame(who.x, who.y - who.h * 0.5), corner = [lead[0] > FW / 2 ? FW * TITLE_SAFE + r : FW * (1 - TITLE_SAFE) - r, FH * TITLE_SAFE + r];
      const sticker = (S.items || []).find((it) => it.fn === 'sticker' && it.heldBy === d.of && stickerFn(it));
      const hold = d.thing || '', part = d.part === 'head' ? 'head' : sticker ? 'sticker' : hold ? 'item' : '';
      if (!part) { note('inset', d.of); return; }
      if (part === 'head' && (!who.head || (who.h || 0) * zoom > FH * 0.55)) return;
      const from = part === 'head' ? toFrame(who.head[0], who.head[1]) : who.hand ? toFrame(who.hand[0], who.hand[1]) : lead;
      if (!d.__spot) { const keep = PLACED; PLACED = PLACED.concat((S.devices || []).filter((q) => q !== d && q.__box && spans(q, d)).map((q) => ({ box: q.__box, tail: null }))); d.__spot = insetSpot(r, from, toFrame, corner); PLACED = keep; d.__box = { x: d.__spot[0] - r, y: d.__spot[1] - r, w: r * 2, h: r * 2 }; }
      const [x, y] = d.__spot;
      PLACED.push({ box: d.__box, tail: [from, [x, y]] });
      if (part === 'sticker') {
        const w = +sticker.w || +sticker.h || 40, h = +sticker.h || w, k = (r * REVISE.INSET.FILL) / Math.max(w, h), f = stickerFn(sticker);
        FIG.device(ctx, { kind: 'inset', x, y, r, from, appear }, (c) => { c.save(); c.translate(x, y); c.scale(k, k); c.translate(-w / 2, -h / 2); try { f(c, w, h, t, p); } catch (e) {} c.restore(); });
        return;
      }
      if (part === 'head') {
        const z = Math.max(1.5, +d.zoom || 3), pt = who.head;
        FIG.device(ctx, { kind: 'inset', x, y, r, from, appear }, (c) => { c.save(); c.translate(x, y); c.scale(z, z); c.translate(-pt[0], -pt[1]); quiet(() => paint(p, t, true)); c.restore(); });
        return;
      }
      FIG.device(ctx, { kind: 'inset', x, y, r, from, appear }, (c) => { drawArt(c, hold, x, y, r); });
      return;
    }
    const at = who ? [who.x, who.y - who.h * 0.6] : [+d.x || FW / 2, +d.y || FH / 2];
    const r = +d.r || (who ? who.h * 0.35 : 60);
    if (d.kind === 'speed') { if (!who) return; FIG.device(ctx, { kind: 'speed', x: who.x - (who.facing || 1) * (who.w || who.h * 0.5) * 0.5, y: who.y - who.h * 0.45, r: who.h * 0.4, facing: who.facing || 1, t }); return; }
    if (d.kind === 'spotlight') { spotlight(d, who, p, toFrame, zoom); return; }
    if (d.kind === 'count') { countCard(d, d.at ? smooth(d.at[0], d.at[0] + 0.1, p) : smooth(0, 0.1, p), toFrame); return; }
    if (d.kind === 'time') { FIG.device(ctx, { kind: 'time', x: +d.x || FW / 2, y: +d.y || FH * 0.28, r: Math.min(+d.r || 220, FH * 0.35), body: d.body || 'sun', progress: p }); return; }
    FIG.device(ctx, { kind: d.kind, x: at[0], y: at[1], r, facing: d.facing || (who && who.facing) || 1, t, appear });
  });
}
function boxOf(r) { return r.box || { x: r.x - (r.w || r.h * 0.42) / 2, y: r.y - r.h, w: r.w || r.h * 0.42, h: r.h }; }
function inFrame(b, toFrame) { const a = toFrame(b.x, b.y), c = toFrame(b.x + b.w, b.y + b.h); return { x: a[0], y: a[1], w: c[0] - a[0], h: c[1] - a[1] }; }
function spotlight(d, who, p, toFrame, zoom) {
  const SP = REVISE.SPOT;
  if (!who) return;
  const b = inFrame(boxOf(who), toFrame), cx = b.x + b.w / 2, cy = b.y + b.h / 2, size = Math.max(b.w, b.h);
  if (size < FH * SP.LEAST || cx < -FW * SP.EDGE || cx > FW * (1 + SP.EDGE) || cy < 0 || cy > FH) { note('spot', d.of); return; }
  const sp = Math.min(0.3, SP.SOFT_S / Math.max(0.1, DUR)), soft = d.at ? smooth(d.at[0], d.at[0] + sp, p) * (1 - smooth(d.at[1] - sp, d.at[1], p)) : smooth(0, sp, p);
  FIG.device(ctx, { kind: 'spotlight', x: cx, y: cy, r: Math.max(size * 0.6, FH * SP.MIN), dim: S.time === 'night' ? SP.NIGHT : SP.DIM, appear: soft });
}
const busyBoxes = (toFrame) => S.items.filter((it) => RES[it.id] && (it.fn === 'person' || it.fn === 'animal' || isKey(it))).map((it) => Object.assign(inFrame(boxOf(RES[it.id]), toFrame), { key: isKey(it) }));
const hitsKey = (b, toFrame) => busyBoxes(toFrame).some((q) => q.key && Math.min(b.x + b.w, q.x + q.w) > Math.max(b.x, q.x) && Math.min(b.y + b.h, q.y + q.h) > Math.max(b.y, q.y));
function freeSpot(w, h, toFrame, hint, extra) {
  const F = REVISE.FREE, pad = FH * F.PAD, busy = busyBoxes(toFrame).concat((extra || []).map((b) => Object.assign({}, b, { key: true })));
  let best = null;
  for (let y = pad; y + h <= FH * 0.66; y += FH * F.STEP / 2) for (let x = pad; x + w <= FW - pad; x += FW * F.STEP / 2) {
    let cover = 0, hit = false;
    busy.forEach((b) => { const ix = Math.max(0, Math.min(x + w, b.x + b.w) - Math.max(x, b.x)), iy = Math.max(0, Math.min(y + h, b.y + b.h) - Math.max(y, b.y)); cover += ix * iy; if (b.key && ix * iy > 0) hit = true; });
    if (hit || cover > w * h * F.COVER * 5) continue;
    const score = cover + (hint ? Math.hypot(x + w / 2 - hint[0], y + h / 2 - hint[1]) * w * 0.02 : 0);
    if (!best || score < best.score) best = { x, y, score };
  }
  return best;
}
function skySpot(w, h, toFrame) {
  const pad = FH * 0.04, sky = toFrame(0, H0)[1], sk = S.sky || {}, sun = sk.sun === false ? null : toFrame(isFinite(+sk.sunX) ? +sk.sunX : FW * 0.84, H0 * 0.3);
  const busy = S.items.filter((it) => RES[it.id] && it.fn !== 'wall').map((it) => Object.assign(inFrame(boxOf(RES[it.id]), toFrame), { key: isKey(it) })).concat(sun ? [{ x: sun[0] - FH * 0.08, y: sun[1] - FH * 0.08, w: FH * 0.16, h: FH * 0.16, key: true }] : []);
  const lead = RES[S.focus] && inFrame(boxOf(RES[S.focus]), toFrame), side = lead ? (lead.x + lead.w / 2 < FW / 2 ? 1 : -1) : 0;
  let best = null;
  for (let y = pad; y + h <= FH * 0.6; y += FH * 0.02) for (let x = pad; x + w <= FW - pad; x += FW * 0.02) {
    let cover = 0, hit = false;
    busy.forEach((b) => { const a = Math.max(0, Math.min(x + w, b.x + b.w) - Math.max(x, b.x)) * Math.max(0, Math.min(y + h, b.y + b.h) - Math.max(y, b.y)); cover += a; if (b.key && a > 0) hit = true; });
    if (hit || cover > w * h * REVISE.COUNT.COVER) continue;
    const score = cover * 6 + Math.max(0, y + h - sky) * w * 3 + (side ? ((side > 0 ? FW - x - w : x) / FW) * w * h * 0.8 : 0) + y * w * 0.2;
    if (!best || score < best.score) best = { x, y, score };
  }
  return best;
}
const NICE = (v) => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); return (REVISE.COUNT.ROUND.find((k) => k * e >= v) || 10) * e; };
const NUMBER_FONT = "'Cinzel', 'Trajan Pro', 'Book Antiqua', 'Palatino Linotype', Palatino, Georgia, serif";
function countCard(d, appear, toFrame) {
  const C = REVISE.COUNT, groups = (d.groups || []).map((g) => Object.assign({}, g, { it: S.items.find((it) => it.id === g.of) })).filter((g) => g.it);
  if (!groups.length) return;
  const most = Math.max(...groups.map((g) => +g.n)), each = most > C.ALL ? NICE(most / C.MAX) : 1, fmt = (n) => { try { return new Intl.NumberFormat(SCENE.language || undefined).format(n); } catch (e) { return String(n); } };
  const layout = (fh) => {
    const gap = fh * 1.2, font = Math.round(Math.max(FH * 0.03, fh * 0.6)), small = Math.round(Math.max(FH * 0.019, fh * 0.4));
    const blocks = groups.map((g) => {
      const one = +g.n === 1, n = one ? 1 : Math.max(1, Math.round(+g.n / each)), rider = !!g.it.mount, size = fh * (one ? 1.25 : 1) * (rider ? REVISE.RIDER : 1);
      const cw = rider ? mountOf(g.it.mount, size).w * 1.08 : size * ASPECT.person * 1.75, cols = one ? 1 : Math.min(n, Math.ceil(n / Math.ceil(n / C.ROW))), rows = Math.ceil(n / cols), step = size * 0.55;
      return { g, n, cols, rows, size, cw, step, w: Math.max(cols * cw + (rows > 1 ? cw * 0.5 : 0), font * 3), h: size + (rows - 1) * step };
    });
    const top = Math.max(...blocks.map((b) => b.h)), legend = each > 1 ? small * 1.8 : 0;
    return { fh, gap, font, small, blocks, top, legend, W: blocks.reduce((a, b) => a + b.w, 0) + gap * (blocks.length - 1), H: top + font * 1.5 + legend };
  };
  let L = layout(FH * C.SIZE);
  if (L.W > FW * C.WIDE) L = layout((FH * C.SIZE * FW * C.WIDE) / L.W);
  const { fh, gap, font, small, blocks, top, legend, W, H } = L, ink = '#2e2620', pad = fh * 0.8;
  const spot = skySpot(W + pad * 2, H + pad * 2, toFrame);
  if (!spot) { note('count', 'space'); return; }
  const k = clamp(appear, 0, 1), x0 = spot.x + pad, y0 = spot.y + pad;
  const figure = (it, x, y, h) => quiet(() => drawOne(it, stateAt(it, 0), Object.assign({}, stateAt(it, 0), { x, y, h, w: it.mount ? mountOf(it.mount, h).w : h * ASPECT.person, facing: 1, seed: 3, mark: undefined, tremble: 0, expression: 'calm', noShadow: true }), 0, false));
  const text = (str, x, y) => { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, ctx.measureText('0').width * 0.35); ctx.strokeStyle = 'rgba(250,244,230,0.9)'; ctx.strokeText(str, x, y); ctx.fillText(str, x, y); };
  ctx.save(); ctx.globalAlpha *= clamp(k * 2.5, 0, 1);
  ctx.save(); ctx.translate(x0 + W / 2, y0 + H / 2); ctx.scale(1, (H + pad * 2) / (W + pad * 2));
  const R = (W + pad * 2) * 0.6, glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R); glow.addColorStop(0, 'rgba(250,244,230,0.6)'); glow.addColorStop(0.55, 'rgba(250,244,230,0.38)'); glow.addColorStop(1, 'rgba(250,244,230,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const base = y0 + top;
  let bx = x0;
  blocks.forEach((b) => {
    const shown = Math.ceil(b.n * k), left = bx + (b.w - b.cols * b.cw - (b.rows > 1 ? b.cw * 0.5 : 0)) / 2;
    ctx.save(); ctx.fillStyle = 'rgba(46,38,32,0.16)'; ctx.beginPath(); ctx.ellipse(bx + b.w / 2, base + fh * 0.04, b.w * 0.52, fh * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    for (let row = b.rows - 1; row >= 0; row--) for (let col = 0; col < b.cols; col++) { const i = row * b.cols + col; if (i >= shown) continue; figure(b.g.it, left + (col + 0.5 + (row % 2) * 0.5) * b.cw, base - row * b.step, b.size); }
    ctx.font = '800 ' + font + 'px ' + NUMBER_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ink;
    text(fmt(b.n > 1 ? Math.round(+b.g.n * (1 - Math.pow(1 - k, 3))) : +b.g.n), bx + b.w / 2, base + font * 1.25);
    bx += b.w + gap;
  });
  if (legend) {
    const ly = y0 + H, it = blocks.find((b) => b.n > 1).g.it, label = '= ' + fmt(each);
    ctx.font = '600 ' + small + 'px ' + NUMBER_FONT; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(46,38,32,0.85)';
    const sz = small * 1.5 * (it.mount ? REVISE.RIDER : 1), fw = it.mount ? mountOf(it.mount, sz).w : sz * ASPECT.person * 1.6, tw = ctx.measureText(label).width, lx = x0 + W / 2 - (fw + small * 0.4 + tw) / 2;
    figure(it, lx + fw / 2, ly + small * 0.15, sz);
    text(label, lx + fw + small * 0.4, ly);
  }
  ctx.restore();
}
const LABEL_HALF = 0.95;
const WATER_WORD = /\b(river|sông|rio|río|fluss|fleuve|sea|ocean|biển|lake|hồ|gulf|vịnh|bay|strait|eo biển|channel|creek|stream)\b/i;
const WATER_NAMES = ['danube', 'rhine', 'rhône', 'rhone', 'seine', 'loire', 'thames', 'elbe', 'oder', 'vistula', 'dnieper', 'dniester', 'don', 'volga', 'ural', 'tisza', 'sajó', 'sajo', 'drava', 'sava', 'po', 'tiber', 'ebro', 'tagus', 'nile', 'niger', 'congo', 'zambezi', 'tigris', 'euphrates', 'jordan', 'indus', 'ganges', 'brahmaputra', 'yangtze', 'yellow river', 'mekong', 'red river', 'irrawaddy', 'amur', 'ob', 'yenisei', 'lena', 'mississippi', 'missouri', 'ohio', 'hudson', 'potomac', 'rio grande', 'amazon', 'paraná', 'parana', 'mediterranean', 'black sea', 'baltic', 'adriatic', 'aegean', 'caspian', 'atlantic', 'pacific', 'indian ocean', 'english channel', 'bosphorus'];
const MAP_PEAK = /mountain|hill|peak|volcano|ridge|range|cliff/i, MAP_CAMP = /tent|camp|yurt/i, MAP_FORT = /castle|fort|tower|keep|citadel|gate|wall|palisade|stockade|wagon/i;
const MAP_SHIP = /ship|boat|galley|galleon|longship|trireme|ferry|raft|canoe|junk|warship|carrier|submarine/i, MAP_SKIP = /river|sea|lake|ocean|road|path|route|arrow|water|coast|land|map|mark|label/i;
function chart(p, t) {
  const M = S.map, paper = M.paper || '#e6d6b0', ink = '#3a2f26';
  ctx.fillStyle = paper; ctx.fillRect(-20, -20, (FW + 40), (FH + 40));
  ctx.save(); ctx.strokeStyle = 'rgba(90,70,40,0.12)'; ctx.lineWidth = 1;
  for (let g = 0; g < (FW + 20); g += 80) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, FH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, g * 0.5625); ctx.lineTo(FW, g * 0.5625); ctx.stroke(); }
  ctx.restore();
  const SAFE = FW < FH ? 0.08 : 0.05;
  const off = (q) => q[0] <= 2 || q[0] >= FW - 2 || q[1] <= 2 || q[1] >= FH - 2;
  const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
  const shape = (pts, closed) => {
    const n = pts.length;
    if (n < 2) return;
    ctx.beginPath();
    if (!closed) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) { if (off(pts[i])) ctx.lineTo(pts[i][0], pts[i][1]); else { const m = mid(pts[i], pts[i + 1]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } } ctx.lineTo(pts[n - 1][0], pts[n - 1][1]); return; }
    const start = off(pts[0]) ? pts[0] : mid(pts[n - 1], pts[0]);
    ctx.moveTo(start[0], start[1]);
    for (let k = off(pts[0]) ? 1 : 0; k <= n; k++) {
      const i = k % n, q = pts[i];
      if (k === n && off(pts[0])) break;
      if (off(q)) ctx.lineTo(q[0], q[1]);
      else { const m = mid(q, pts[(i + 1) % n]); ctx.quadraticCurveTo(q[0], q[1], m[0], m[1]); }
    }
    ctx.closePath();
  };
  (M.water || []).forEach((pts) => { shape(pts, true); ctx.fillStyle = '#b7cdd2'; ctx.fill(); ctx.strokeStyle = 'rgba(60,80,90,0.6)'; ctx.lineWidth = 2.5; ctx.stroke(); });
  (M.land || []).forEach((pts) => { shape(pts, true); ctx.fillStyle = mix(paper, '#c9b98c', 0.6); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,35,0.75)'; ctx.lineWidth = 3; ctx.stroke(); });
  (M.rivers || []).forEach((pts) => { shape(pts, false); ctx.strokeStyle = 'rgba(70,100,120,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); });
  const boxes = [];
  const clear = (b) => !boxes.some((q) => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
  (S.items || []).forEach((it) => {
    const kind = String(it.kind || ''), fn = String(it.fn || '');
    if (fn === 'sticker' || MAP_SKIP.test(kind)) return;
    const st = stateAt(it, p), x = +st.x, y = +st.y, s = clamp(+st.h || 30, 14, 60);
    if (!isFinite(x) || !isFinite(y)) return;
    const ring = fn === 'wall' && /wagon/i.test(kind) ? clamp(isFinite(+it.from) && isFinite(+it.to) ? Math.abs(+it.to - +it.from) / 2 : s * 0.6, 40, 90) : 0;
    boxes.push(ring ? { x0: x - ring - 8, x1: x + ring + 8, y0: y - ring * 0.7 - 6, y1: y + ring * 0.7 + 6 } : { x0: x - s * 0.6, x1: x + s * 0.6, y0: y - s * 0.8, y1: y });
    const show = it.at ? smooth(+it.at[0], Math.min(1, +it.at[0] + 0.06), p) * (p <= +it.at[1] + 1e-6 ? 1 : 0) : 1;
    if (show <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= show; ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    if (fn === 'wall' && /wagon/i.test(kind)) {
      const r = ring, n = Math.max(8, Math.round(r / 6));
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.save(); ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = mix(paper, '#7a5236', 0.85); ctx.fillRect(-7, -4, 14, 8); ctx.lineWidth = 2; ctx.strokeRect(-7, -4, 14, 8); ctx.restore(); }
    } else if (MAP_PEAK.test(kind)) {
      ctx.beginPath(); ctx.moveTo(x - s * 0.6, y); ctx.lineTo(x, y - s * 0.75); ctx.lineTo(x + s * 0.6, y); ctx.fillStyle = mix(paper, ink, 0.18); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.12, y - s * 0.6); ctx.lineTo(x, y - s * 0.75); ctx.lineTo(x + s * 0.14, y - s * 0.58); ctx.stroke();
    } else if (MAP_CAMP.test(kind)) {
      [-0.35, 0.35].forEach((d) => { ctx.beginPath(); ctx.moveTo(x + d * s - s * 0.25, y); ctx.lineTo(x + d * s, y - s * 0.4); ctx.lineTo(x + d * s + s * 0.25, y); ctx.closePath(); ctx.fillStyle = mix(paper, ink, 0.2); ctx.fill(); ctx.stroke(); });
    } else if (fn === 'wall' || MAP_FORT.test(kind)) {
      const w = s * 0.5; ctx.fillStyle = mix(paper, ink, 0.25); ctx.fillRect(x - w / 2, y - w, w, w); ctx.strokeRect(x - w / 2, y - w, w, w);
      for (let i = 0; i < 3; i++) ctx.fillRect(x - w / 2 + i * w * 0.4, y - w - w * 0.2, w * 0.2, w * 0.2);
    } else if (fn === 'building') {
      const w = s * 0.4; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - w * 0.6); ctx.lineTo(x, y - w); ctx.lineTo(x + w / 2, y - w * 0.6); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fillStyle = mix(paper, ink, 0.2); ctx.fill(); ctx.stroke();
    } else if (fn === 'vehicle' && MAP_SHIP.test(kind)) {
      const w = s * 0.7, f = (+st.facing || +it.facing || 1) < 0 ? -1 : 1; ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.15); ctx.lineTo(x + w / 2 * f, y - w * 0.15); ctx.lineTo(x + w * 0.35 * f, y); ctx.lineTo(x - w * 0.4 * f, y); ctx.closePath(); ctx.fillStyle = mix(paper, ink, 0.3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - w * 0.15); ctx.lineTo(x, y - w * 0.7); ctx.lineTo(x + w * 0.3 * f, y - w * 0.3); ctx.closePath(); ctx.stroke();
    } else if (fn === 'person' || fn === 'animal' || fn === 'vehicle') {
      const w = s * 0.5, col = it.color || it.top || ink; ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - w * 0.4, w, w * 0.4); ctx.strokeRect(x - w / 2, y - w * 0.4, w, w * 0.4);
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.4); ctx.lineTo(x - w / 2, y - w * 1.1); ctx.stroke(); ctx.fillRect(x - w / 2, y - w * 1.1, w * 0.35, w * 0.25);
    }
    ctx.restore();
  });
  const nearRiver = (x, y) => {
    let best = null;
    (M.rivers || []).forEach((pts) => { for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, k = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L, 0, 1), px = a[0] + dx * k, py = a[1] + dy * k, d = Math.hypot(x - px, y - py); if (!best || d < best.d) best = { d, x: px, y: py, ang: Math.atan2(dy, dx) }; } });
    return best;
  };
  (M.places || []).forEach((pl) => {
    const name = String(pl.name || ''), lower = name.toLowerCase();
    const item = (S.items || []).find((it) => String(it.id || '').toLowerCase() === lower.replace(/[^a-z0-9]+/g, '') || String(it.id || '').toLowerCase() === lower);
    const type = pl.type || (item && /river|stream|creek/i.test(String(item.kind || '')) ? 'river' : item && /sea|ocean|lake|bay|gulf/i.test(String(item.kind || '')) ? 'sea' : WATER_NAMES.indexOf(lower) >= 0 || WATER_WORD.test(name) ? (/sea|ocean|biển|lake|hồ|gulf|vịnh|bay|strait|channel|mediterranean|baltic|adriatic|aegean|caspian|atlantic|pacific/i.test(name) ? 'sea' : 'river') : 'city');
    if (type === 'river' || type === 'sea' || type === 'region' || type === 'mountain') {
      const size = type === 'region' ? 22 : 18, r = type === 'river' ? nearRiver(+pl.x, +pl.y) : null;
      let x = +pl.x, y = +pl.y, ang = 0;
      if (r && r.d < 160) { ang = r.ang; if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI; ang = clamp(ang, -1.45, 1.45); x = r.x + Math.sin(ang) * (size + 6); y = r.y - Math.cos(ang) * (size + 6); }
      ctx.save(); ctx.translate(clamp(x, FW * SAFE + 40, FW * (1 - SAFE) - 40), clamp(y, FH * SAFE + 20, FH * (1 - SAFE) - 10)); ctx.rotate(ang);
      ctx.font = 'italic ' + (type === 'region' ? '700 ' : '600 ') + size + 'px ' + (S.font || 'Georgia, serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = paper; ctx.strokeText(name, 0, 0); ctx.fillStyle = type === 'region' || type === 'mountain' ? ink : '#2f4f63'; ctx.fillText(name, 0, 0);
      ctx.restore();
      return;
    }
    const r = pl.big ? 9 : 6;
    ctx.beginPath(); ctx.arc(pl.x, pl.y, r, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = paper; ctx.stroke();
    const size = pl.big ? 24 : 19, half = size * LABEL_HALF, gap = r + 10 + half, w = name.length * size * 0.62 + 16;
    const tries = [1, 1.8, 2.6].flatMap((k) => [[pl.x, pl.y - gap * k], [pl.x, pl.y + gap * k], [pl.x + (r + 12) * k + w / 2, pl.y], [pl.x - (r + 12) * k - w / 2, pl.y]]).map(([x, y]) => [clamp(x, FW * SAFE + w / 2, FW * (1 - SAFE) - w / 2), clamp(y, FH * SAFE + half, FH * (1 - SAFE) - half)]);
    const box = (q) => ({ x0: q[0] - w / 2, x1: q[0] + w / 2, y0: q[1] - half, y1: q[1] + half });
    const at = tries.find((q) => clear(box(q))) || tries[0];
    boxes.push(box(at));
    FIG.label(ctx, { x: at[0], y: at[1], text: name, size });
  });
  const arrows = (M.arrows || []).map((a) => {
    const k = a.at ? smooth(a.at[0], a.at[1], p) : smooth(0.1, 0.85, p);
    const len = Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]) || 1, bend = +a.curve || 0;
    const mx = (a.from[0] + a.to[0]) / 2 - (a.to[1] - a.from[1]) * bend, my = (a.from[1] + a.to[1]) / 2 + (a.to[0] - a.from[0]) * bend;
    const at = (u) => [(1 - u) * (1 - u) * a.from[0] + 2 * (1 - u) * u * mx + u * u * a.to[0], (1 - u) * (1 - u) * a.from[1] + 2 * (1 - u) * u * my + u * u * a.to[1]];
    if (k > 0.01) FIG.arrow(ctx, { from: a.from, to: a.to, curve: bend * len, width: 9, color: a.color || '#8a2f26', grow: k });
    return { a, k, at };
  });
  const glide = (f) => {
    const keys = (f.keys || []).filter((q) => isFinite(+q.at) && isFinite(+q.x) && isFinite(+q.y)).sort((u, v) => u.at - v.at);
    if (keys.length < 2) return { x: +f.x, y: +f.y };
    if (p <= keys[0].at) return { x: +keys[0].x, y: +keys[0].y };
    if (p >= keys[keys.length - 1].at) return { x: +keys[keys.length - 1].x, y: +keys[keys.length - 1].y };
    let i = 0; while (i + 1 < keys.length && keys[i + 1].at < p) i++;
    const q0 = keys[Math.max(0, i - 1)], q1 = keys[i], q2 = keys[i + 1], q3 = keys[Math.min(keys.length - 1, i + 2)], u = (p - q1.at) / ((q2.at - q1.at) || 1e-6);
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    return { x: cr(+q0.x, +q1.x, +q2.x, +q3.x), y: cr(+q0.y, +q1.y, +q2.y, +q3.y) };
  };
  (M.forces || []).forEach((f) => {
    const start = (f.keys && f.keys[0]) || f, r = +f.size || 20;
    const ride = arrows.find((e) => (f.color && e.a.color && String(f.color).toLowerCase() === String(e.a.color).toLowerCase()) || Math.hypot(e.a.from[0] - +start.x, e.a.from[1] - +start.y) < 40);
    const pos = ride ? ride.at(Math.max(0, ride.k - 0.04)) : glide(f), x = pos.x !== undefined ? pos.x : pos[0], y = pos.y !== undefined ? pos.y : pos[1];
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = f.color || '#8a2f26'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2a2522'; ctx.stroke();
    if (window.motionMark) window.motionMark(ctx, f.id, x - r, y - r, 2 * r, 2 * r);
  });
}
function paint(p, t, inner) {
  if (S.map) return chart(p, t);
  if (S.interior) room(); else backdrop(t);
  const items = order(p), far = H0 + (FH - H0) * 0.22, split = isFinite(+(S.haze && S.haze.frontOf)) ? +S.haze.frontOf : H0 + (FH - H0) * 0.55;
  const yOf = (it) => +stateAt(it, p).y || 0, fx = (list) => { if (FX) effects(list, p, t); }, live = liveEffects(p);
  fx(live.filter((e) => (+e.y || 0) < far));
  items.filter((it) => yOf(it) < far).forEach((it) => drawItem(it, p, t));
  if (!S.interior) veil();
  fx(live.filter((e) => (+e.y || 0) >= far && (+e.y || 0) < split));
  items.filter((it) => yOf(it) >= far && yOf(it) < split).forEach((it) => drawItem(it, p, t));
  if (FX) haze(p, t);
  fx(live.filter((e) => (+e.y || 0) >= split));
  items.filter((it) => yOf(it) >= split).forEach((it) => drawItem(it, p, t));
  (S.items || []).filter((it) => it.heldBy).forEach((it) => drawItem(it, p, t));
  if (!inner && !S.map) devices(p, t, 'scene');
}
function headline(h) {
  const size = +h.size || 90, lines = (h.lines || []).map(String), align = h.align || 'left';
  ctx.save(); ctx.translate(+h.x || 60, +h.y || 120); ctx.rotate(((+h.tilt || -4) * Math.PI) / 180);
  ctx.font = '900 ' + size + "px 'Arial Rounded MT Bold', 'Arial Black', sans-serif"; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    let s = size; ctx.font = '900 ' + s + "px 'Arial Rounded MT Bold', 'Arial Black', sans-serif";
    while (ctx.measureText(line).width > FW * 0.9 && s > 24) { s -= 4; ctx.font = '900 ' + s + "px 'Arial Rounded MT Bold', 'Arial Black', sans-serif"; }
    const y = i * size * 1.08;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(line, 5, y + 6);
    ctx.lineWidth = s * 0.2; ctx.strokeStyle = '#141210'; ctx.strokeText(line, 0, y);
    ctx.fillStyle = h.color || '#ffffff'; ctx.fillText(line, 0, y);
    if (h.accent && line.indexOf(h.accent) >= 0) {
      const before = line.slice(0, line.indexOf(h.accent)), full = ctx.measureText(line).width, x0 = align === 'center' ? -full / 2 : align === 'right' ? -full : 0;
      ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = '#f2c230'; ctx.fillText(h.accent, x0 + ctx.measureText(before).width, y); ctx.restore();
    }
  });
  ctx.restore();
}
const ABSTRACT = /^(gap|gaps|route|routes|path|paths|direction|escape|exit|target|goal|plan|opening|breach|way|safe|zone|area|marker|spot|point|destination)(_|$|[0-9])/i;
const THINGS = ['prop', 'building', 'wall', 'tree'];
const NATURAL = ['rock', 'boulder', 'bush', 'grass', 'stump', 'log', 'reeds', 'flowers', 'fern', 'shrub', 'stones'];
const FG_MAX = 0.18, NAMED_OVERLAP = 0.25, PAIR_OVERLAP = 0.6, HOP_ROOM = 1.04;
const GROUP_PACK = { person: 0.8, other: 0.95 }, ROW_DEPTH = 0.28, THING_WIDE = 2.5;
const VIEW = window.__motionView || {};
const idOf = (v) => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
const PAIRS = (Array.isArray(S.pairs) ? S.pairs : Array.isArray(VIEW.pairs) ? VIEW.pairs : []).map((p) => [idOf(p[0]), idOf(p[1])]);
const paired = (a, b) => PAIRS.some((p) => (p[0] === idOf(a.id) && p[1] === idOf(b.id)) || (p[1] === idOf(a.id) && p[0] === idOf(b.id))) || a.on === b.id || b.on === a.id;
const keysOf = (it) => (Array.isArray(it.keys) ? it.keys : []);
const PROJECTILE = /rocket|missile|arrow|volley|bolt|thrownSpear|cannonShot|slingStone/i;
const SHOT_READABLE = 1.8;
const SHOT = /^(arrow|bolt|thrownSpear|cannonShot|slingStone|siegeStone|firePot|fireArrow)$/, ROUND_SHOT = /^(cannonShot|slingStone|siegeStone|firePot)$/;
const IN_FLIGHT = { arrows: 'arrow', javelin: 'thrownSpear', spear: 'thrownSpear', lance: 'thrownSpear', pike: 'thrownSpear', pilum: 'thrownSpear', cannonballs: 'cannonShot', boulder: 'siegeStone', rock: 'siegeStone', stonePile: 'siegeStone' };
const moves = (it) => keysOf(it).some((k) => isFinite(+k.x));
const STREWN = new RegExp(REVISE.STREWN.KINDS);
const FOOT = {}, PROBE = document.createElement('canvas');
PROBE.width = 900; PROBE.height = 520;
const lengthOf = (it, long) => (long && +it.w > +it.h * 2 ? +it.w : long ? +it.h * Math.max(1, footOf(it)) : +it.h);
function footOf(it) {
  const look = it.look || {}, key = [it.fn, it.kind || '', it.mount || '', look.pose || '', look.hold || '', look.cape ? 1 : 0, look.robe ? 1 : 0, look.shield || ''].join('|');
  if (FOOT[key] != null) return FOOT[key];
  let ratio = it.mount ? mountOf(it.mount, 1).w : ASPECT[it.fn] || 1;
  const probe = (h) => {
    const pc = PROBE.getContext('2d');
    pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, PROBE.width, PROBE.height);
    quiet(() => {
      if (it.mount) { const m = mountOf(it.mount, h); FIG.animal(pc, { kind: it.mount, x: 450, y: 470, h: m.h, w: m.w, facing: 1, rider: Object.assign({ pose: 'ride' }, look, { r: m.r }), noShadow: true }); }
      else if (FIG[it.fn]) FIG[it.fn](pc, Object.assign({}, look, { kind: it.kind, x: 450, y: 470, h, w: it.fn === 'person' || it.fn === 'animal' ? h * (ASPECT[it.fn] || 1) : undefined, facing: 1, noShadow: true }));
    });
    const d = pc.getImageData(0, 0, PROBE.width, PROBE.height).data;
    let lo = PROBE.width, hi = -1;
    for (let y = 60; y < 480; y += 3) for (let x = 0; x < PROBE.width; x += 2) if (d[(y * PROBE.width + x) * 4 + 3] > 40) { if (x < lo) lo = x; if (x > hi) hi = x; }
    return hi > lo ? { lo, hi } : null;
  };
  try {
    let h = 200, b = probe(h);
    if (b && (b.lo <= 2 || b.hi >= PROBE.width - 3)) { h = 40; b = probe(h); }
    if (b) ratio = (b.hi - b.lo) / h;
  } catch (e) {}
  return (FOOT[key] = ratio);
}
function moveDepth(it, k) {
  const Y = (y) => H0 + (y - H0) * k;
  if (isFinite(+it.y)) it.y = Y(+it.y);
  if (isFinite(+it.h)) it.h = +it.h * k;
  if (isFinite(+it.w)) it.w = +it.w * k;
  if (it.group) { if (isFinite(+it.group.width)) it.group.width = +it.group.width * k; if (isFinite(+it.group.depth)) it.group.depth = +it.group.depth * k; }
  keysOf(it).forEach((q) => { if (isFinite(+q.y)) q.y = Y(+q.y); if (isFinite(+q.h)) q.h = +q.h * k; });
}
const SCENE = VIEW.scene || {}, TEXT = String(SCENE.text || '').toLowerCase();
const REQUIRED = (Array.isArray(SCENE.required) ? SCENE.required : []).map(idOf);
const NOTES = (window.__motionNotes = []);
const note = (kind, id) => { if (!NOTES.some((q) => q[0] === kind && q[1] === id)) NOTES.push([kind, id]); };
const said = (words) => words.some((w) => TEXT.indexOf(w) >= 0);
const isKey = (it) => it.id === S.focus || !!it.focal || REQUIRED.indexOf(idOf(it.id)) >= 0;
const sameMount = (a, b) => a === b || (REVISE.HORSES.indexOf(a) >= 0 && REVISE.HORSES.indexOf(b) >= 0);
const LIGHT_OF = { day: ['fireflies'], dawn: ['fireflies'], dusk: [], night: ['rays', 'heat'] };
function timeOfText() {
  let best = '', at = Infinity;
  const told = REVISE.WORDS.SPEECH.reduce((n, w) => { const i = TEXT.indexOf(w); return i > 0 && i < n ? i : n; }, TEXT.length), own = TEXT.slice(0, told);
  Object.keys(TIME_CUES).forEach((t) => TIME_CUES[t].forEach((w) => { const i = own.search(new RegExp('(^|[^\\p{L}])' + w.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u')); if (i >= 0 && i < at) { at = i; best = t; } }));
  return best;
}
function placeLook() {
  const pl = VIEW.placeLook;
  if (!pl || S.map || S.interior) return;
  if (pl.ground && S.ground !== pl.ground && S.ground !== 'snow' && LAND[pl.ground]) { note('ground', S.ground + '>' + pl.ground); S.ground = pl.ground; }
  const sk = S.sky = S.sky || {}, x = isFinite(+sk.sunX) ? +sk.sunX : FW * 0.84;
  if ((x < FW / 2 ? 'left' : 'right') !== pl.sun) { sk.sunX = FW - x; note('sun', pl.sun); }
}
function retime() {
  const cue = SKY[timeOfText()] ? timeOfText() : '', own = SKY[S.time] ? S.time : '', beat = SKY[SCENE.time] ? SCENE.time : '', want = SKY[SCENE.drawTime] ? SCENE.drawTime : cue && (cue === own || cue === beat) ? cue : own || cue || beat;
  if (!want || want === S.time || !SKY[want]) return;
  note('time', S.time + '>' + want);
  S.time = want;
  const off = LIGHT_OF[want] || [];
  S.effects = (S.effects || []).filter((e) => off.indexOf(e.kind) < 0);
  S.devices = (S.devices || []).filter((d) => d.kind !== 'time' || (d.body === 'moon') === (want === 'night'));
}
function mergeMounts() {
  S.items.filter((it) => it.fn === 'person' && it.mount && +it.h > 0).forEach((r) => {
    const a = stateAt(r, 0);
    const twin = S.items.find((q) => q.fn === 'animal' && !q.mount && !q.on && sameMount(q.kind || 'horse', r.mount) && !!q.group === !!r.group && (() => { const b = stateAt(q, 0); return Math.abs(+b.x - +a.x) < +r.h * REVISE.MOUNT_NEAR && Math.abs(+b.y - +a.y) < Math.max(12, +r.h * REVISE.MOUNT_DEPTH); })());
    if (!twin) return;
    const look = Object.assign({}, twin.look || {});
    delete look.pose;
    r.mountLook = Object.assign(look, r.mountLook || {});
    const poses = keysOf(twin).filter((k) => isFinite(+k.at) && k.pose).map((k) => ({ at: +k.at, pose: REVISE.MOUNT_POSES.indexOf(k.pose) >= 0 ? k.pose : undefined }));
    if (twin.look && REVISE.MOUNT_POSES.indexOf(twin.look.pose) >= 0 && !poses.some((k) => k.at <= 0)) poses.unshift({ at: 0, pose: twin.look.pose });
    if (poses.some((k) => k.pose)) r.mountKeys = poses.sort((u, v) => u.at - v.at);
    if (twin.focal || S.focus === twin.id) { r.focal = true; S.focus = r.id; }
    (S.devices || []).forEach((d) => { if (d.of === twin.id) d.of = r.id; });
    S.items = S.items.filter((q) => q !== twin && q.heldBy !== twin.id);
    note('mount', twin.id);
  });
}
function dryFlags() {
  const water = (S.water || []).filter((w) => isFinite(+w.y)), shore = FH * REVISE.WET_SHORE;
  const soaked = S.ground === 'snow' || said(REVISE.WORDS.WET), wetAt = (y) => soaked || water.some((w) => y >= +w.y - shore && y <= +w.y + (+w.h || 60) + shore);
  S.items.forEach((it) => {
    const looks = [it.look, it.mountLook].concat(keysOf(it)).filter(Boolean);
    if (!looks.some((q) => q.wet) || wetAt(+stateAt(it, 0).y)) return;
    looks.forEach((q) => delete q.wet);
    note('wet', it.id);
  });
}
function toolsByVerb() {
  const V = REVISE.TOOL_VERBS, ws = TEXT.split(/[^a-zÀ-ɏ']+/).filter(Boolean);
  const named = (w) => S.items.find((it) => it.fn === 'person' && !(it.group && +it.group.count > 1) && String(it.id).toLowerCase().split(/[^a-zà-ɏ]+/).indexOf(w.replace(/'s$/, '')) >= 0);
  ws.forEach((w, i) => {
    const verb = Object.keys(V).find((v) => w.indexOf(v) === 0);
    if (!verb) return;
    let who = null;
    for (let j = i - 1; j >= Math.max(0, i - REVISE.TOOL_REACH) && !who; j--) who = named(ws[j]);
    const tool = V[verb];
    if (!who || !inked(tool)) return;
    const old = String((who.look || {}).hold || '');
    if (old === tool) return;
    who.look = Object.assign({}, who.look || {}, { hold: tool });
    keysOf(who).forEach((q) => { if (q.hold && q.hold === old) q.hold = tool; });
    note('tool', who.id + ':' + tool);
  });
}
function verbPoses() {
  const V = REVISE.VERB_POSES, ws = TEXT.split(/[^a-zÀ-ɏ']+/).filter(Boolean), done = new Set();
  const named = (w) => S.items.find((it) => it.fn === 'person' && !(it.group && +it.group.count > 1) && (it.id === w || String(it.id).toLowerCase().split(/[^a-zà-ɏ]+/).indexOf(w.replace(/'s$/, '')) >= 0));
  ws.forEach((w, i) => {
    const verb = Object.keys(V.MAP).find((v) => w.indexOf(v) === 0);
    if (!verb) return;
    let who = null;
    for (let j = i - 1; j >= Math.max(0, i - REVISE.TOOL_REACH) && !who; j--) who = named(ws[j]);
    if (!who || done.has(who.id)) return;
    const pose = V.MAP[verb], base = String((who.look || {}).pose || 'stand'), poses = [base].concat(keysOf(who).map((q) => String(q.pose || '')));
    if (poses.indexOf(pose) >= 0 || V.KEEP.indexOf(base) >= 0) return;
    const ks = keysOf(who).slice(), at = (p) => Object.assign({}, stateAt(who, p), { at: p });
    const add = [Object.assign(at(V.FROM), { pose }), Object.assign(at(V.TO), { pose }), Object.assign(at(V.BACK), { pose: base })];
    ['h', 'w', 'look'].forEach((k) => add.forEach((q) => delete q[k]));
    who.keys = ks.filter((q) => +q.at < V.FROM || +q.at > V.BACK).concat(add).sort((a, b) => +a.at - +b.at);
    if (!ks.length) who.keys.unshift(Object.assign(at(0), { pose: base }));
    done.add(who.id);
    note('verb', who.id + ':' + pose);
  });
}
function offstage() {
  const out = (x) => isFinite(+x) && (+x < -FW * 0.5 || +x > FW * 1.5);
  S.items = S.items.filter((it) => { if (!out(it.x) || keysOf(it).some((q) => isFinite(+q.x) && !out(q.x))) return true; note('offstage', it.id); return false; });
}
function noHolds() {
  const NONE = new RegExp(REVISE.DEVICE.NO_HOLD, 'i');
  S.items.forEach((it) => { if (it.look && it.look.hold != null && NONE.test(String(it.look.hold).trim())) delete it.look.hold; });
}
const INK = document.createElement('canvas');
INK.width = INK.height = 96;
const inked = (kind) => {
  const c = INK.getContext('2d');
  c.clearRect(0, 0, 96, 96);
  if (!quiet(() => FIG.prop(c, { kind, x: 48, y: 84, h: 64, facing: 1 }))) return false;
  const a = c.getImageData(0, 0, 96, 96).data;
  let n = 0;
  for (let k = 3; k < a.length; k += 4) if (a[k] > 40) n++;
  return n / (96 * 96) >= REVISE.INSET.INK;
};
const smallKind = (kind) => { const real = kind && SIZE_STD[kind]; return !!real && Math.max(real.h, real.l) <= REVISE.INSET.SMALL && !LONG_HELD.test(kind); };
function insetThing(d, who) {
  const h = +who.h || 170, hx = +who.x, hy = +who.y - h * 0.5;
  const near = S.items.find((it) => it.fn === 'prop' && it.kind && !it.group && it !== who && isFinite(+it.x) && Math.hypot(+it.x - hx, +it.y - hy) < h * 0.7 && smallKind(it.kind) && inked(it.kind));
  if (near) return near.kind;
  const held = String((who.look && who.look.hold) || '');
  if (held && smallKind(held) && inked(held)) return held;
  const words = ((window.__motionCatalog || {}).words || {}).prop || {}, entries = (window.__motionCatalog || {}).entries || [];
  const told = TEXT.split(/[^a-zÀ-ɏ]+/).map((w) => entries[words[w]]).find((e) => e && smallKind(e.id) && inked(e.id));
  return told ? told.id : '';
}
const ART = {};
function artOf(kind) {
  if (kind in ART) return ART[kind];
  const N = REVISE.INSET.ART, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const c = cv.getContext('2d'), box = () => {
    const a = c.getImageData(0, 0, N, N).data;
    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y += 2) for (let x = 0; x < N; x += 2) if (a[(y * N + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 2, h: y1 - y0 + 2 };
  };
  const draw = (h) => { c.clearRect(0, 0, N, N); quiet(() => FIG.prop(c, { kind, x: N / 2, y: N * 0.75, h, facing: 1 })); return box(); };
  let b = draw(N * 0.12);
  if (b) { const k = (N * 0.6) / Math.max(b.w, b.h); b = draw(N * 0.12 * k); }
  ART[kind] = b ? { cv, b } : null;
  return ART[kind];
}
function drawArt(c, kind, x, y, r) {
  const I = REVISE.INSET, a = artOf(kind);
  if (!a) return;
  const { b } = a, long = Math.max(b.w, b.h), thin = long / Math.max(1, Math.min(b.w, b.h)) >= I.LONG;
  const k = (r * (thin ? I.FIT_LONG : I.FIT)) / long, turn = !thin ? 0 : b.w >= b.h ? -I.TILT : Math.PI / 2 - I.TILT;
  c.save(); c.translate(x, y); c.rotate(turn); c.scale(k, k);
  c.drawImage(a.cv, b.x, b.y, b.w, b.h, -b.w / 2, -b.h / 2, b.w, b.h);
  c.restore();
}
function topical(kind) {
  const cat = window.__motionCatalog || {}, words = (cat.words || {}).prop || {}, entries = cat.entries || [], ws = TEXT.split(/[^a-zÀ-ɏ']+/).filter(Boolean);
  const TOUCH = REVISE.WORDS.TOUCH, near = REVISE.INSET.TOPIC_WORDS;
  return ws.some((w, i) => { const e = entries[words[w]]; if (!e || e.id !== kind) return false; const span = ' ' + ws.slice(Math.max(0, i - near), i + 2).join(' ') + ' '; return TOUCH.some((v) => span.indexOf(' ' + v) >= 0); });
}
function speakers() {
  const W = REVISE.WORDS, out = new Set();
  S.items.filter((it) => it.fn === 'person' && !(it.group && +it.group.count > 1)).forEach((it) => {
    if (it.id === 'you') { if (said(W.YOU_THINK)) out.add(it.id); return; }
    const names = String(it.id).toLowerCase().split(/[^a-zà-ɏ]+/).filter((w) => w.length > 2);
    if (names.some((n) => TEXT.indexOf(n) >= 0) && said(W.SPEECH)) out.add(it.id);
  });
  return out;
}
const bubbleKey = (it) => (it.fn === 'person' ? 'person' + (it.mount || (it.look && it.look.mount) || it.pose === 'ride' || (it.look && it.look.pose) === 'ride' || it.kind === 'rider' ? ':horse' : '') : String(it.kind || ''));
function echoes(d) {
  const keys = (d.items || []).map(bubbleKey).filter((k) => k && k !== 'person');
  if (!keys.length) return false;
  const have = new Set(S.items.filter((it) => !(isFinite(+it.x) && (+it.x < -FW * 0.2 || +it.x > FW * 1.2))).map(bubbleKey));
  return keys.filter((k) => have.has(k)).length / keys.length >= REVISE.DEVICE.ECHO;
}
function deviceRules() {
  const D = REVISE.DEVICE, W = REVISE.WORDS, byId = {}, rank = (d) => D.RANK.indexOf(d.kind);
  S.items.forEach((it) => { byId[it.id] = it; });
  const one = (it) => it && it.fn === 'person' && !(it.group && +it.group.count > 1);
  const loud = (it) => it && (it.fn === 'person' || D.SOUNDS.some((k) => String(it.kind || '').indexOf(k) >= 0));
  let list = (S.devices || []).filter(oneDevice).filter((d) => {
    let ok = true;
    if (D.ON_PERSON.indexOf(d.kind) >= 0) ok = one(byId[d.of]);
    else if (d.kind === 'sound') ok = (d.of ? loud(byId[d.of]) : true) && said(W.LOUD);
    else if (d.kind === 'impact') ok = said(W.STRIKE) || said(W.MISSILE) || said(W.SMASH);
    else if (d.kind === 'speed') ok = !!byId[d.of] && (said(W.FAST) || moves(byId[d.of]));
    if (ok && (SCENE.seen || []).indexOf(d.kind + ':' + d.of) >= 0) ok = false;
    if (ok && d.kind === 'thought') {
      const who = speakers();
      if (said(W.SPEECH) && !who.has(d.of)) { const one = Array.from(who).filter((id) => byId[id]); if (one.length === 1) d.of = one[0]; else ok = false; }
      else if (!said(W.SPEECH) && new RegExp(REVISE.DEVICE.GENERIC).test(String(d.of || ''))) ok = false;
      if (ok && echoes(d)) ok = false;
    }
    if (ok && d.kind === 'inset' && d.part !== 'head') {
      const thing = insetThing(d, byId[d.of]);
      if (thing && topical(thing)) { d.part = 'hand'; d.thing = thing; }
      else ok = S.items.some((it) => it.fn === 'sticker' && it.heldBy === d.of);
    }
    if (!ok) { if (d.kind === 'inset') note('inset', d.of); else note('device', d.kind + (d.of ? ':' + d.of : '')); }
    return ok;
  });
  const own = (d) => (d.kind === 'thought' && said(W.SPEECH)) || (d.kind === 'inset' && d.part !== 'head') || (d.kind === 'sound' && said(W.LOUD)) ? 0 : 1;
  const chars = list.filter((d) => D.CHARACTER.indexOf(d.kind) >= 0).sort((a, b) => own(a) - own(b) || rank(a) - rank(b));
  const keep = SCENE.rest && !said(W.SPEECH) ? null : chars[0];
  list = list.filter((d) => { if (D.CHARACTER.indexOf(d.kind) < 0 || d === keep) return true; note('device', d.kind + (d.of ? ':' + d.of : '')); return false; });
  S.devices = list;
}
function oneDevice(d, i, list) {
  if (d.kind === 'spotlight') return list.findIndex((q) => q.kind === 'spotlight') === i && !!d.of;
  if (d.kind === 'thought') return fitBubble(d);
  if (d.kind === 'count') return tieCount(d);
  return true;
}
function bubbleSpan(list) {
  const box = list.map((it) => { const w = +it.w || (it.mount ? mountOf(it.mount, +it.h).w : +it.h * (ASPECT[it.fn] || 1)), x = isFinite(+it.from) ? (+it.from + +it.to) / 2 : +it.x || 0, ww = isFinite(+it.from) ? Math.abs(+it.to - +it.from) : w, y = isFinite(+it.y) ? +it.y : 0; return [x - ww / 2, y - +it.h, x + ww / 2, y]; });
  return box.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
}
function fitBubble(d) {
  const B = REVISE.BUBBLE, r = Math.min(+d.r || 100, FH * 0.2), main = (it) => B.MAIN.indexOf(it.fn) >= 0;
  let items = (d.items || []).filter((it) => +it.h > 0 && (B.MAIN.indexOf(it.fn) >= 0 ? !!it.kind || it.fn === 'person' : !!it.kind && inked(it.kind)));
  if (!items.some(main)) { note('bubble', d.of || ''); return false; }
  const scaleOf = (list) => { const b = bubbleSpan(list); return { b, s: Math.min((B.FILL * 2.5 * r) / Math.max(1, b[2] - b[0]), (B.FILL * 1.56 * r) / Math.max(1, b[3] - b[1])) }; };
  items = items.filter((it) => main(it) || +it.h * scaleOf(items).s >= B.LEAST * r);
  const f = scaleOf(items), cx = (f.b[0] + f.b[2]) / 2, cy = (f.b[1] + f.b[3]) / 2, X = (v) => (+v - cx) * f.s;
  d.items = items.map((it) => Object.assign({}, it, { x: X(isFinite(+it.x) ? it.x : cx), y: (+it.y - cy) * f.s, h: +it.h * f.s, w: isFinite(+it.w) ? +it.w * f.s : undefined }, isFinite(+it.from) ? { from: X(it.from), to: X(it.to) } : {}, Array.isArray(it.gaps) ? { gaps: it.gaps.map((g) => [X(g[0]), X(g[1])]) } : {}));
  const end = Math.max(...d.items.filter(main).map((it) => Math.min(it.at ? +it.at[1] : 1, it.fade ? +it.fade[1] : 1)));
  d.at = [d.at ? +d.at[0] : 0, Math.min(d.at ? +d.at[1] : 1, end)];
  d.fitted = true;
  return d.at[1] - d.at[0] > 0.08;
}
function tieCount(d) {
  const color = (c) => String(c || '').toLowerCase();
  const groups = (d.groups || []).filter((g) => +g.n > 0).map((g) => { const tone = (it) => it.fn === 'person' && !!g.color && color((it.look || {}).top) === color(g.color), of = S.items.find((it) => it.fn === 'person' && it.id === g.of) || S.items.find((it) => tone(it) && (+g.n > 1) === !!it.group) || S.items.find(tone); return of ? Object.assign({}, g, { of: of.id }) : null; });
  if (!groups.length || groups.some((g) => !g)) { note('count', ''); return false; }
  d.groups = groups;
  return true;
}
function scaleRiders() {
  const small = (it) => REVISE.SMALL_BUILD.indexOf(String((it.look || {}).build || '')) >= 0;
  const stand = S.items.filter((it) => it.fn === 'person' && !it.mount && +it.h > 0 && +it.y > H0 + 8 && !small(it) && (it.look || {}).pose !== 'sit' && (it.look || {}).pose !== 'lie');
  S.items.filter((it) => it.fn === 'person' && it.mount && +it.h > 0 && +it.y > H0 + 8).forEach((r) => {
    const q = stand.filter((p) => Math.abs(+p.y - +r.y) <= Math.max(24, (+p.y - H0) * REVISE.PEOPLE_DEPTH)).sort((a, b) => Math.abs(+a.y - +r.y) - Math.abs(+b.y - +r.y))[0];
    if (!q) return;
    const want = (+q.h * (+r.y - H0)) / (+q.y - H0) * REVISE.RIDER, k = +r.h / want;
    if (Math.abs(k - 1) <= REVISE.PEOPLE_BAND) return;
    const f = want / +r.h;
    r.h = want; keysOf(r).forEach((p) => { if (isFinite(+p.h)) p.h = +p.h * f; });
    note('rider', r.id);
  });
  const named = stand.filter((it) => !it.group);
  named.forEach((q) => {
    if (q.id === S.focus) return;
    const peers = named.filter((p) => p !== q && Math.abs(+p.y - +q.y) <= Math.max(24, (+p.y - H0) * REVISE.PEOPLE_DEPTH)).map((p) => (+p.h * (+q.y - H0)) / (+p.y - H0)).sort((a, b) => a - b);
    if (peers.length < 2) return;
    const med = peers[peers.length >> 1], f = med / +q.h;
    if (Math.abs(f - 1) <= REVISE.PEOPLE_BAND) return;
    q.h = med; keysOf(q).forEach((p) => { if (isFinite(+p.h)) p.h = +p.h * f; });
    note('person', q.id);
  });
}
const STRIP = { on: null }, C_STAND = REVISE.CROSS.STAND;
const stripAt = (y) => { const r = STRIP.on; if (!r) return null; const C = REVISE.CROSS, k = Math.pow(Math.max(0, (y - H0) / Math.max(1, r.base - H0)), C.GROW), half = Math.min(FW * C.BOTTOM / 2, Math.max(r.wide * C.FAR_MIN, (r.wide / 2) * k)); return { c: r.x + Math.sin((y - H0) / 90) * half * C.BEND, half }; };
const poseOf = (it) => String((it.look || {}).pose || '');
function crossRel(band, bridges) {
  const C = REVISE.CROSS, mid = H0 + (FH - H0) * C.NEAR;
  const fore = S.items.filter((it) => it.fn === 'person' && !it.heldBy && it.bank !== 'far' && +stateAt(it, 0).y > mid);
  const regions = fore.map((it) => (it.look || {}).region).filter((r, i, l) => r && l.indexOf(r) === i);
  const melee = regions.length > 1 && fore.some((it) => C.MELEE.indexOf(poseOf(it)) >= 0);
  CROSS_AT.melee = melee;
  if (bridges.length && regions.length > 1 && said(REVISE.WORDS.BRIDGE) && (melee || said(REVISE.WORDS.DECK))) return 'deck';
  if (bridges.length && melee && said(REVISE.WORDS.ON_DECK)) return 'deck';
  if (+band.y + +band.h >= mid) return 'across';
  return bridges.some((b) => +b.y >= +band.y - 4 && +b.y <= +band.y + +band.h + 4) && said(REVISE.WORDS.FORD) ? 'across' : '';
}
const CROSS_AT = { melee: false, rel: '', hold: null };
function crossing(water, bridges) {
  const C = REVISE.CROSS, band = water.find((w) => C.KINDS.indexOf(w.kind || 'river') >= 0);
  if (!band) return;
  const rel = crossRel(band, bridges);
  CROSS_AT.rel = rel;
  if (!rel || (!VIEW.crossing && rel !== 'deck')) return;
  const site = VIEW.crossing || { over: band.kind || 'river', x: C.X, wide: C.WIDE, near: 'left', sides: {} };
  VIEW.crossing = site;
  const over = C.KINDS.indexOf(site.over) >= 0 && band.kind !== 'stream' ? site.over : band.kind || 'river';
  const deck = [];
  let b0 = bridges.filter((b) => +b.y >= +band.y - 4 && +b.y <= +band.y + +band.h + 4)[0];
  if (rel === 'deck') {
    b0 = bridges.slice().sort((u, v) => (+v.w || 0) - (+u.w || 0))[0];
    const mid = H0 + (FH - H0) * C.NEAR, fore = S.items.filter((it) => it.fn === 'person' && !it.heldBy && it.bank !== 'far' && +stateAt(it, 0).y > mid);
    const ys = fore.filter((it) => C.MELEE.indexOf(poseOf(it)) >= 0 || poseOf(it) === 'ride' || poseOf(it) === 'run').map((it) => +stateAt(it, 0).y).sort((u, v) => u - v);
    const w = FW * C.BOTTOM * C.SPAN, h = w * C.BRIDGE_H;
    const deckY = clamp(ys.length ? ys[ys.length >> 1] : FH * 0.8, H0 + (FH - H0) * C.DECK_DEPTH[0], Math.min(H0 + (FH - H0) * C.DECK_DEPTH[1], FH - h * 0.7));
    b0.y = deckY - h * REVISE.DECK_SINK; b0.h = h; b0.w = w;
    bridges.filter((b) => b !== b0).forEach((b) => { b.__drop = true; });
    S.items = S.items.filter((it) => !it.__drop);
    bridges = [b0];
    band.into = { x: clamp(+site.x, C.X_RANGE[0], C.X_RANGE[1]) * FW, base: +b0.y + h, wide: FW * C.BOTTOM, kind: over };
  } else {
    if (!b0 && +band.y + +band.h < H0 + (FH - H0) * C.NEAR) return;
    const base = b0 ? +b0.y + (+b0.h || 0) : H0 + (FH - H0) * C.BASE;
    band.into = { x: clamp(+site.x, C.X_RANGE[0], C.X_RANGE[1]) * FW, base, wide: clamp(+site.wide, C.WIDE_RANGE[0], C.WIDE_RANGE[1]) * FW, kind: over };
  }
  STRIP.on = band.into;
  bridges.forEach((b) => {
    const span = (+b.w || +b.h * 4) / 2, ox = +b.x;
    if (rel !== 'deck') S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && !it.heldBy && Math.abs(+stateAt(it, 0).x - ox) < span && Math.abs(+stateAt(it, 0).y - +b.y) < Math.max(20, +b.h * 0.4)).forEach((it) => deck.push([it, b, clamp((+stateAt(it, 0).x - ox) / Math.max(1, span), -1, 1)]));
    const st = stripAt(+b.y);
    b.x = st.c; b.w = st.half * 2 * C.SPAN; b.h = Math.min(+b.h || b.w * C.BRIDGE_H, b.w * C.BRIDGE_H);
    if (site.build) b.look = Object.assign({}, b.look || {}, { build: site.build });
    b.z = +b.y;
    note('bridge', b.id);
  });
  const nearSide = site.near === 'right' ? 1 : -1, sideOfReg = (it) => { const reg = (it.look || {}).region, sd = reg && site.sides && site.sides[reg]; return sd ? (sd === site.near ? nearSide : -nearSide) : 0; };
  if (rel === 'deck') {
    const b = bridges[0], mid = H0 + (FH - H0) * C.NEAR;
    const fore = S.items.filter((it) => it.fn === 'person' && !it.heldBy && it.bank !== 'far' && +stateAt(it, 0).y > mid);
    const ours = (it) => sideOfReg(it) === nearSide || (!sideOfReg(it) && (it.id === S.focus || it.id === 'you'));
    const on = fore.filter((it) => C.MELEE.indexOf(poseOf(it)) >= 0 || !ours(it) || poseOf(it) === 'lie' || poseOf(it) === 'fall').slice(0, C.DECK_FILE);
    const mine = on.filter((it) => ours(it) && poseOf(it) !== 'lie'), theirs = on.filter((it) => !ours(it) && poseOf(it) !== 'lie'), down = on.filter((it) => poseOf(it) === 'lie' || poseOf(it) === 'fall');
    const spread = (list, from, to) => list.slice().sort((u, v) => (+stateAt(v, 0).x - +stateAt(u, 0).x) * nearSide).forEach((it, k) => deck.push([it, b, nearSide * (from + ((to - from) * (k + 0.5)) / list.length)]));
    spread(mine, 0.85, 0.12); spread(theirs, -0.12, -0.85); spread(down, 0.5, -0.5);
    on.forEach((it) => { const f = (+b.y + +b.h * REVISE.DECK_SINK - H0) / Math.max(1, +stateAt(it, 0).y - H0); if (Math.abs(f - 1) > 0.02) moveDepth(it, f); note('deck', it.id); });
    if (mine.length && theirs.length) CROSS_AT.hold = [mine, theirs];
  } else {
    const fighters = bridges.length && told(bridges[0], REVISE.WORDS.ON_DECK) ? S.items.filter((it) => it.fn === 'person' && !it.heldBy && !deck.some((d) => d[0] === it) && C.POSES.indexOf(poseOf(it)) >= 0) : [];
    if (fighters.length && !deck.length) {
      const b = bridges[0];
      fighters.sort((u, v) => Math.abs(+u.x - +b.x) - Math.abs(+v.x - +b.x)).slice(0, C.FILE).forEach((it, k, list) => { const f = (+b.y - H0) / Math.max(1, +it.y - H0); moveDepth(it, f); deck.push([it, b, ((k + 0.5) / list.length - 0.5) * 1.5]); note('deck', it.id); });
    }
  }
  deck.forEach(([it, b, off]) => {
    const x = +b.x + (it.group && rel !== 'deck' ? 0 : clamp(off, -1, 1) * (+b.w / 2) * 0.75), dx = x - +stateAt(it, 0).x, dy = +b.y + +b.h * REVISE.DECK_SINK - +stateAt(it, 0).y;
    it.x = +it.x + dx; it.y = +it.y + dy; keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = +q.x + dx; if (isFinite(+q.y)) q.y = +q.y + dy; });
    if (it.group) { it.group.width = Math.min(+it.group.width || +b.w, +b.w * (rel === 'deck' ? 0.3 : 0.7)); it.group.rows = 1; if (rel === 'deck') it.group.count = Math.min(+it.group.count || 1, 3); }
    it.deck = b.id; it.z = +b.y + 0.005;
  });
  if (CROSS_AT.hold) { const b = bridges[0], half = (+b.w / 2) * 0.85; CROSS_AT.hold.forEach((list, k) => { const s0 = (k ? -1 : 1) * nearSide, lo = Math.min(+b.x + s0 * half, +b.x + s0 * half * 0.05), hi = Math.max(+b.x + s0 * half, +b.x + s0 * half * 0.05); list.forEach((it) => keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = clamp(+q.x, lo, hi); })); }); CROSS_AT.hold = null; }
  bridges.forEach((b) => { if (deck.some((d) => d[1] === b) && (b.look || {}).build !== 'iron' && (b.look || {}).build !== 'concrete') S.items.push({ id: b.id + '__rail', fn: 'bridge', x: b.x, y: b.y, w: b.w, h: b.h, look: b.look, railOnly: true, z: +b.y + 0.01 }); });
  outOfStrip();
}
function outOfStrip() {
  const site = VIEW.crossing, C = REVISE.CROSS, r = STRIP.on, bridges = S.items.some((it) => it.fn === 'bridge');
  if (!r) return;
  const stand = C.STAND.indexOf(r.kind) >= 0, boats = C.BOATS.indexOf(r.kind) >= 0, far = site.near === 'left' ? 'right' : 'left';
  const fore = (it) => +stateAt(it, 0).y > H0 + (FH - H0) * C.NEAR && it.bank !== 'far';
  const sideOf = (it) => { const reg = it.fn === 'person' && it.look && it.look.region; if (CROSS_AT.melee && it.fn === 'person' && fore(it)) return site.near; if (reg && site.sides && site.sides[reg]) return site.sides[reg]; if (it.bank) return it.bank === 'far' ? far : site.near; return told(it, REVISE.WORDS.ACROSS) ? far : it.fn === 'vehicle' ? crewSide(it) : null; };
  const people = S.items.filter((q) => q.fn === 'person' && !q.heldBy && isFinite(+q.x) && (q.look || {}).region && site.sides && site.sides[q.look.region]);
  const crewSide = (it) => { const s0 = stateAt(it, 0), q = people.slice().sort((a, b) => Math.hypot(+a.x - +s0.x, +a.y - +s0.y) - Math.hypot(+b.x - +s0.x, +b.y - +s0.y))[0]; return q && Math.hypot(+q.x - +s0.x, +q.y - +s0.y) < +q.h * C.CREW ? site.sides[q.look.region] : null; };
  S.items.filter((it) => (it.fn === 'vehicle' || it.fn === 'prop' || it.fn === 'building') && !it.heldBy && !it.deck && isFinite(+it.y) && +it.y > H0 + 2 && (SIZE_STD[it.kind] || {}).place !== 'water').forEach((it) => {
    const want = told(it, REVISE.WORDS.ACROSS) ? far : it.fn === 'vehicle' ? crewSide(it) : null;
    if (!want) return;
    for (let n = 0; n < C.BACK_STEPS; n++) {
      const st = stripAt(+it.y), body = (it.group && +it.group.width) || +it.w || +it.h * (ASPECT[it.fn] || 0.5), room = want === 'left' ? st.c - st.half : FW - (st.c + st.half);
      if (room >= body || (+it.y - H0) < (FH - H0) * C.BACK_LEAST) break;
      moveDepth(it, C.BACK_K); note('across', it.id);
    }
  });
  S.items = S.items.filter((it) => {
    if (it.fn === 'bridge' || it.deck || it.heldBy || it.fn === 'sticker' || it.anchor || !isFinite(+it.y) || +stateAt(it, 0).y <= H0 + 2) return true;
    const s0 = stateAt(it, 0), st = stripAt(+s0.y), wet = (SIZE_STD[it.kind] || {}).place === 'water' || /swim|wade|row/.test(String((it.look || {}).pose || ''));
    if (wet) { if (!boats) { if (isKey(it)) return true; note('water', it.id); return false; } const dx = st.c + clamp(+s0.x - st.c, -st.half * 0.7, st.half * 0.7) - +s0.x; if (dx) { it.x = +it.x + dx; keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = +q.x + dx; }); note('bank', it.id); } return true; }
    if (stand) return true;
    const one = it.fn === 'person' || it.fn === 'animal' ? +it.h * footOf(it) : +it.w || +it.h * (ASPECT[it.fn] || 0.5) || 0;
    let body = it.group && +it.group.width ? +it.group.width : one;
    const want = sideOf(it), now = +s0.x < st.c ? 'left' : 'right';
    let x = +s0.x;
    const roomOf = (sd) => (sd === 'left' ? st.c - st.half : FW - (st.c + st.half));
    if (want && want !== now && roomOf(want) >= Math.min(body, one * 1.2)) { x = 2 * st.c - x; note('side', it.id); }
    const room = roomOf(+x < st.c ? 'left' : 'right');
    if (it.group && body > room * 0.95 && room > one) { const k = (room * 0.95) / body; it.group.width = body * k; it.group.count = Math.max(1, Math.round(+it.group.count * k)); body = it.group.width; note('crowd', it.id); }
    const need = st.half + body / 2;
    const at = x < st.c ? 'left' : 'right';
    if (Math.abs(x - st.c) < need) { x = st.c + (at === 'left' ? -need : need); note('bank', it.id); }
    if (!moves(it) && (x - body / 2 < 0 || x + body / 2 > FW)) { x = clamp(x, body / 2, FW - body / 2); if (Math.abs(x - st.c) < need * 0.9) { if (isKey(it) || it.fn === 'person') return true; note('water', it.id); return false; } }
    const dx = x - +s0.x;
    if (dx) { it.x = +it.x + dx; keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = +q.x + dx; }); }
    const path = keysOf(it).filter((q) => isFinite(+q.x) && isFinite(+q.y)), sideAt = (q) => (+q.x < stripAt(+q.y).c ? 'left' : 'right');
    const fords = path.length > 1 && sideAt(path[0]) !== sideAt(path[path.length - 1]) && (!bridges || said(REVISE.WORDS.FORD));
    if (fords) { it.fords = true; note('ford', it.id); }
    else path.forEach((q) => { const sq = stripAt(+q.y), nq = sq.half + body / 2; if (Math.abs(+q.x - sq.c) < nq) q.x = sq.c + ((x < st.c ? 'left' : 'right') === 'left' ? -nq : nq); });
    return true;
  });
  (S.effects || []).forEach((e) => { if (!isFinite(+e.x) || !isFinite(+e.y) || +e.y <= H0) return; const st = stripAt(+e.y), r0 = (+e.r || 0) * 0.5; if (e.kind === 'splash') { if (boats) e.x = st.c + clamp(+e.x - st.c, -st.half * 0.7, st.half * 0.7); return; } if (stand || Math.abs(+e.x - st.c) >= st.half + r0) return; e.x = st.c + (+e.x < st.c ? -1 : 1) * (st.half + r0); });
}
function onBanks() {
  const lone = !S.interior && !S.map && !(S.water || []).some((w) => REVISE.CROSS.KINDS.indexOf(w.kind || 'river') >= 0) && S.items.find((it) => it.fn === 'bridge' && isFinite(+it.y) && +it.y > H0);
  if (lone) { S.water = (S.water || []).concat([{ kind: 'river', y: +lone.y, h: Math.max(+lone.h || 0, FH * 0.06) }]); note('under', lone.id); }
  const water = (S.water || []).filter((w) => isFinite(+w.y) && +w.h > 0);
  if (!water.length || S.interior) return;
  const margin = FH * REVISE.WATER_MARGIN;
  const bridges = S.items.filter((it) => it.fn === 'bridge');
  crossing(water, bridges);
  water.forEach((w) => { if (!w.into && +w.y + +w.h > FH * REVISE.NEAR_BANK && +w.y < FH * REVISE.NEAR_BANK - FH * 0.04) { w.h = FH * REVISE.NEAR_BANK - +w.y; note('shore', ''); } });
  const across = (it) => told(it, REVISE.WORDS.ACROSS);
  const afloat = (it) => (SIZE_STD[it.kind] || {}).place === 'water' || /swim|wade|row/.test(String((it.look || {}).pose || '')) || (it.deck && bridges.some((b) => b.id === it.deck)) || it.fn === 'bridge' || it.fn === 'wall' || it.heldBy || it.fn === 'sticker';
  S.items = S.items.filter((it) => {
    const y = +stateAt(it, 0).y, y1 = +stateAt(it, 1).y, inside = (w, v) => v > +w.y + 2 && v < +w.y + +w.h - 2;
    if (afloat(it) || !isFinite(y)) return true;
    const band = water.find((w) => !w.into && inside(w, y) && inside(w, y1));
    if (!band) return true;
    const onBridge = bridges.some((b) => { const half = (+b.w || +b.h * 4) / 2; return Math.abs(+it.x - +b.x) < half && Math.abs(y - +b.y) < +b.h * 0.6; });
    if (onBridge) return true;
    const far = +band.y - 2, nearY = +band.y + +band.h + margin, to = (it.bank ? it.bank === 'far' : across(it)) && far > H0 + 6 ? far : nearY;
    if (to >= FH - 4 || to <= H0 + 2) { if (isKey(it) || it.fn === 'person') return true; note('water', it.id); return false; }
    moveDepth(it, (to - H0) / Math.max(1, y - H0));
    note('bank', it.id);
    return true;
  });
  const wetAt = (x, y) => (S.water || []).some((w) => { if (w.into) { const st = stripAt(y); return y > H0 && Math.abs(x - st.c) < st.half; } return y >= +w.y && y <= +w.y + +w.h; });
  S.effects = (S.effects || []).filter((e) => {
    if (REVISE.WET_FX.indexOf(e.kind) < 0 || !isFinite(+e.x) || !isFinite(+e.y) || wetAt(+e.x, +e.y)) return true;
    const st = STRIP.on && +e.y > H0 ? stripAt(+e.y) : null;
    if (st) { e.x = st.c; e.r = Math.min(+e.r || st.half, st.half * 0.9); note('ripple', e.kind); return true; }
    note('ripple', e.kind); return false;
  });
}
const HEX = /^#[0-9a-f]{6}$/i;
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function factions() {
  const F = REVISE.FACTION, sides = {}, home = ((VIEW.cast || {})[REVISE.CAST.HOME] || {}).home;
  if (home) {
    const tinted = new Set();
    S.items.filter((it) => it.fn === 'person' && it.look && it.look.region && it.look.region !== home && F.TINT[it.look.region]).forEach((it) => {
      const tint = F.TINT[it.look.region], tone = (look) => { if (!look) return; ['top', 'headColor', 'shieldColor'].forEach((k) => { if (HEX.test(String(look[k] || ''))) look[k] = mix(look[k], tint, F.HOME_MIX); }); };
      tone(it.look); keysOf(it).forEach(tone); tinted.add(it.look.region);
    });
    tinted.forEach((r) => note('faction', r));
    return;
  }
  S.items.filter((it) => it.fn === 'person' && it.look && it.look.region && HEX.test(String(it.look.top || ''))).forEach((it) => (sides[it.look.region] = sides[it.look.region] || []).push(it));
  const names = Object.keys(sides);
  if (names.length < 2) return;
  const avg = (list) => { const c = list.map((it) => rgbOf(it.look.top)); return [0, 1, 2].map((k) => c.reduce((a, v) => a + v[k], 0) / c.length); };
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = avg(sides[names[i]]), b = avg(sides[names[j]]);
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) >= F.NEAR) continue;
    const lead = [names[i], names[j]].sort()[1], tint = F.TINT[lead];
    if (!tint) continue;
    const tone = (look) => { if (!look) return; ['top', 'headColor', 'shieldColor'].forEach((k) => { if (HEX.test(String(look[k] || ''))) look[k] = mix(look[k], tint, F.MIX); }); };
    sides[lead].forEach((it) => { tone(it.look); keysOf(it).forEach(tone); });
    note('faction', lead);
  }
}
function crowds() {
  const C = REVISE.CROWD, gs = S.items.filter((it) => it.group && +it.group.count > 1 && it.fn === 'person' && +it.h > 0 && isFinite(+it.x) && !moves(it));
  for (let i = 0; i < gs.length; i++) for (let j = 0; j < gs.length; j++) {
    const a = gs[i], b = gs[j], wa = +a.group.width || +a.h, wb = +b.group.width || +b.h;
    if (a === b || isKey(b) || Math.abs(+a.y - +b.y) > C.DEPTH * Math.max(+a.h, +b.h) || wb > wa || (wb === wa && j < i)) continue;
    const over = Math.min(+a.x + wa / 2, +b.x + wb / 2) - Math.max(+a.x - wa / 2, +b.x - wb / 2);
    if (over <= C.OVERLAP * wb) continue;
    const dir = +b.x >= +a.x ? 1 : -1, room = dir > 0 ? FW - (+b.x + wb / 2) : +b.x - wb / 2;
    if (room >= over) { b.x = +b.x + dir * over; note('crowd', b.id); continue; }
    const keep = Math.max(0, wb - over + room), k = keep / wb;
    b.x = +b.x + dir * (room + (wb - keep) / 2);
    b.group.width = keep;
    b.group.count = Math.max(1, Math.round(+b.group.count * k));
    if (keep < +b.h * 0.5) b.__drop = true;
    note('crowd', b.id);
  }
  S.items = S.items.filter((it) => !it.__drop);
}
function varyFar() {
  if (!SCENE.vary) return;
  const far = H0 + (FH - H0) * REVISE.REPEAT.FAR, m = (v) => FW - +v;
  S.items.forEach((it) => {
    if (isKey(it) || moves(it) || !(+it.y < far)) return;
    if (isFinite(+it.x)) it.x = m(it.x);
    if (isFinite(+it.from) && isFinite(+it.to)) { const a = m(it.to), b = m(it.from); it.from = a; it.to = b; }
    if (Array.isArray(it.gaps)) it.gaps = it.gaps.map((g) => [m(g[1]), m(g[0])]);
    it.facing = -(+it.facing || 1);
  });
  (S.effects || []).forEach((e) => { if (+e.y < far && isFinite(+e.x)) e.x = m(e.x); });
  note('vary', '');
}
function castMarks() {
  const marks = VIEW.cast || {};
  S.items.forEach((it) => {
    const m = marks[it.id], look = it.look;
    if (!m || !look || it.fn !== 'person') return;
    if (look.cape === true && m.cape) look.cape = m.cape;
    if (m.trim && !look.trim) look.trim = m.trim;
    Object.keys(m).filter((k) => k.indexOf(REVISE.CAST.LOOK) === 0).forEach((k) => { const v = m[k]; look[k.slice(REVISE.CAST.LOOK.length)] = v === 'true' ? true : v === 'false' ? false : v; });
  });
  titles();
}
function titles() {
  const T = REVISE.TITLES;
  S.items.filter((it) => it.fn === 'person' && it.look).forEach((it) => {
    const look = it.look, own = String(it.id || '').toLowerCase().split(/[^a-zà-ɏ]+/).filter((w) => w.length > 2), ws = TEXT.split(/[^a-zà-ɏ]+/).filter(Boolean);
    const told = own.concat(...ws.map((w, i) => (w !== 'you' && own.indexOf(w) >= 0 ? ws.slice(Math.max(0, i - 2), i + 2) : []))), name = '_' + told.join('_') + '_', has = (re) => told.some((w) => new RegExp(re).test('_' + w + '_')) || new RegExp(re).test(name);
    const armed = !!look.armor || ['sword', 'spear', 'axe', 'mace', 'lance', 'bow', 'crossbow'].indexOf(String(look.hold || '')) >= 0;
    if (T.CROWNS.indexOf(String(look.head || '')) >= 0 && look.outfit !== 'king' && !has(T.ROYAL)) { look.head = look.armor ? 'helmet' : 'none'; note('crown', it.id); }
    if (has(T.PRELATE)) { look.emblem = 'cross'; look.emblemColor = T.CROSS; if (!armed) { look.head = 'mitre'; look.robe = look.robe || T.ROBE; look.top = T.ROBE; } note('title', it.id); }
    else if (has(T.CLERIC)) { look.emblem = 'cross'; look.emblemColor = T.CROSS; if (!armed) { look.robe = look.robe || T.CASSOCK; look.top = look.top || T.CASSOCK; } }
    if (has(T.KHAN)) { look.head = 'steppe'; look.trim = look.trim || T.FUR; look.cape = look.cape || T.KHAN_CAPE; }
    if (has(T.HERALD) && !look.emblem) look.emblem = 'stripes';
    if (has(T.WOMAN) && !look.armor) { look.robe = look.robe || look.top || T.DRESS; if (!look.head || look.head === 'cap') look.head = 'veil'; }
  });
}
const told = (it, list) => { const words = [it.kind || ''].concat(String(it.id || '').toLowerCase().split(/[^a-z]+/)).filter((w) => w.length > 2).map((w) => w.toLowerCase()); return list.some((c) => { let i = TEXT.indexOf(c); while (i >= 0) { const win = TEXT.slice(Math.max(0, i - 60), i + c.length + 60); if (words.some((w) => win.indexOf(w) >= 0)) return true; i = TEXT.indexOf(c, i + 1); } return false; }); };
function heldTwins() {
  const H = REVISE.HELD, word = (it) => [it.kind || ''].concat(String(it.id || '').split(/[^A-Za-z]+/)).filter(Boolean);
  const wants = (it) => { const out = []; word(it).forEach((w) => { const k = Object.keys(H.KIND).find((q) => q.toLowerCase() === w.toLowerCase()); if (k) out.push(['hold', H.KIND[k]]); const v = Object.keys(H.WORN).find((q) => q.toLowerCase() === w.toLowerCase()); if (v) out.push(['worn', H.WORN[v]]); const part = Object.keys(H.PART).find((q) => q.toLowerCase() === w.toLowerCase()); if (part) out.push(['hold', H.PART[part]]); }); return out; };
  const has = (p, want) => [p.look || {}].concat(keysOf(p)).some((q) => (want[0] === 'hold' ? want[1].indexOf(String(q.hold || '')) >= 0 : !!q[want[1]] || (want[1] === 'shield' && String(q.hold || '') === 'shield')));
  const near = (p, it) => H.TIMES.some((t) => { const a = stateAt(p, t), b = stateAt(it, t), h = +a.h || +p.h, half = ((p.group && +p.group.width) || 0) / 2 + h * H.NEAR_X; return Math.abs(+b.x - +a.x) <= half && +b.y >= +a.y - h && +b.y <= +a.y + h * H.NEAR_FOOT; });
  const people = S.items.filter((p) => p.fn === 'person' && +p.h > 0);
  S.items.filter((it) => it.fn === 'prop' && !it.group).forEach((it) => {
    const list = wants(it);
    if (!list.length) return;
    const owner = people.find((p) => p.id === it.heldBy);
    if (it.heldBy && !(owner && list.some((w) => has(owner, w)))) return;
    if (moves(it)) {
      const k = keysOf(it).filter((q) => isFinite(+q.x)).sort((a, b) => a.at - b.at), from = people.find((p) => list.some((w) => w[0] === 'hold' && has(p, w)) && near(p, Object.assign({}, it, { keys: [] })));
      if (!from || !k.length) return;
      const at = Math.max(0, +k[0].at), ks = keysOf(from);
      if (!ks.some((q) => +q.at <= 0)) ks.unshift({ at: 0 });
      ks.push({ at, hold: 'none' });
      from.keys = ks.sort((a, b) => a.at - b.at);
      note('held', from.id);
      return;
    }
    if (!owner && told(it, REVISE.WORDS.APART)) return;
    const by = owner || people.find((p) => list.some((w) => has(p, w)) && near(p, it));
    if (!by) return;
    (S.devices || []).forEach((d) => { if (d.of === it.id) d.of = by.id; });
    if (S.focus === it.id) S.focus = by.id;
    if (it.focal) by.focal = true;
    it.__twin = true;
    note('held', it.id);
  });
  S.items = S.items.filter((q) => !q.__twin && !S.items.some((o) => o.__twin && q.heldBy === o.id));
}
function openings() {
  const walls = S.items.filter((w) => (w.fn === 'wall' || WALLS.indexOf(w.kind) >= 0) && +w.h > 0);
  S.items.filter((it) => it.fn === 'prop' && new RegExp(REVISE.OPENING, 'i').test(String(it.id || '')) && isFinite(+it.x) && isFinite(+it.y)).forEach((it) => {
    const x = +it.x, wall = walls.filter((w) => Math.abs(+w.y - +it.y) < Math.max(+w.h, +it.h || 0) * 1.5).sort((a, b) => Math.abs(+a.y - +it.y) - Math.abs(+b.y - +it.y))[0];
    const wh = wall ? +wall.h : +it.h || 40, lo = wall && isFinite(+wall.from) ? Math.min(+wall.from, +wall.to) : -Infinity, hi = wall && isFinite(+wall.from) ? Math.max(+wall.from, +wall.to) : Infinity;
    if (!wall) { it.__twin = true; note('gap', it.id); return; }
    let gap = (wall.gaps || []).find((g) => x >= +g[0] - wh && x <= +g[1] + wh);
    if (!gap && x > lo && x < hi) { gap = [x - wh * 0.8, x + wh * 0.8]; wall.gaps = (wall.gaps || []).concat([gap]); }
    const g0 = gap ? +gap[0] : x - wh * 0.8, g1 = gap ? +gap[1] : x + wh * 0.8, y = +wall.y;
    it.anchor = { x: g0, y: y - wh, w: g1 - g0, h: wh };
    note('gap', it.id);
  });
  S.items = S.items.filter((q) => !q.__twin);
}
function wrecks() {
  const D = REVISE.DEBRIS, wreck = new RegExp(D.WRECK, 'i'), debris = S.items.filter((it) => it.fn === 'prop' && D.KINDS.indexOf(it.kind) >= 0 && !moves(it));
  S.items.filter((it) => (it.fn === 'vehicle' || it.fn === 'wall' || it.fn === 'building') && !it.state && +it.h > 0 && isFinite(+it.x)).forEach((it) => {
    const by = debris.filter((d) => !d.__twin && Math.abs(+d.x - +it.x) <= +it.h * D.NEAR + (isFinite(+it.from) ? Math.abs(+it.to - +it.from) / 2 : 0) && Math.abs(+d.y - +it.y) <= +it.h * D.DEPTH + 20);
    if (!wreck.test(String(it.id || '')) && !(by.length && told(it, REVISE.WORDS.SMASH))) return;
    it.state = 'broken';
    by.forEach((d) => { d.__twin = true; (S.devices || []).forEach((q) => { if (q.of === d.id) q.of = it.id; }); if (S.focus === d.id) S.focus = it.id; });
    note('wreck', it.id);
  });
  S.items = S.items.filter((q) => !q.__twin);
}
function regionKinds() {
  const people = S.items.filter((p) => p.fn === 'person' && p.look && p.look.region && +p.h > 0 && isFinite(+p.x));
  S.items.filter((it) => it.fn === 'building' && +it.h > 0 && isFinite(+it.x)).forEach((it) => {
    const near = people.filter((p) => Math.abs(+p.x - +it.x) <= +it.h * REVISE.REGION_NEAR + ((p.group && +p.group.width) || 0) / 2 && Math.abs(+p.y - +it.y) <= Math.max(+it.h, +p.h) * 0.6);
    const regions = near.map((p) => p.look.region).filter((r, i, a) => a.indexOf(r) === i);
    const to = regions.length === 1 && (REVISE.REGION_KIND[regions[0]] || {})[it.kind];
    if (!to) return;
    it.kind = to;
    note('region', it.id);
  });
}
function unseat() {
  S.items.filter((it) => it.fn === 'person' && it.mount && !it.group).forEach((it) => {
    const k = keysOf(it).filter((q) => isFinite(+q.at) && REVISE.DOWN.indexOf(q.pose) >= 0).sort((u, v) => +u.at - +v.at)[0];
    if (!k) return;
    const tf = +k.at, st = stateAt(it, tf), f = (+st.facing || +it.facing || 1) < 0 ? -1 : 1, man = +st.h / REVISE.RIDER, rest = keysOf(it).filter((q) => +q.at > tf);
    it.keys = keysOf(it).filter((q) => +q.at < tf).map((q) => Object.assign({}, q, { pose: q.pose && REVISE.DOWN.indexOf(q.pose) >= 0 ? 'ride' : q.pose }));
    it.keys.push({ at: tf, x: +st.x, y: +st.y });
    it.at = [it.at ? +it.at[0] : 0, tf];
    S.items.push({ id: it.id + '__horse', fn: 'animal', kind: it.mount, x: +st.x, y: +st.y, h: mountOf(it.mount, +st.h).h, facing: f, look: Object.assign({}, it.mountLook || {}, { pose: 'rear' }), keys: [{ at: tf, x: +st.x, y: +st.y, pose: 'rear' }].concat(rest.filter((q) => isFinite(+q.x)).map((q) => ({ at: +q.at, x: +q.x + f * man * 0.6, y: isFinite(+q.y) ? +q.y : +st.y, pose: 'run' }))), at: [tf, 1] });
    S.items.push({ id: it.id + '__down', fn: 'person', x: +st.x - f * man * 0.3, y: +st.y + 2, h: man, facing: f, look: Object.assign({}, it.look || {}, { pose: 'fall' }), keys: [{ at: tf, pose: 'fall' }, { at: Math.min(1, tf + 0.12), pose: 'lie' }], at: [tf, 1] });
    note('unseat', it.id);
  });
}
function soundPoses() {
  const P = REVISE.PLAY;
  S.items.filter((it) => it.fn === 'person' && !it.mount && it.look).forEach((it) => {
    const hold = String(it.look.hold || ''), pose = hold === 'horn' && said(REVISE.WORDS.BLOW) ? 'blow' : hold === 'drum' && said(REVISE.WORDS.DRUM) ? 'beat' : '';
    if (!pose) return;
    if (P.FROM.indexOf(poseOf(it)) >= 0) it.look.pose = pose;
    keysOf(it).forEach((q) => { if (q.pose && P.FROM.indexOf(q.pose) >= 0) q.pose = pose; });
    note(pose, it.id);
  });
}
function shieldUp() {
  if (!said(REVISE.WORDS.SHIELD_UP)) return;
  S.items.filter((it) => it.fn === 'person' && !it.mount && it.look && (it.look.shield || it.look.hold === 'shield') && (it.id === S.focus || it.id === 'you' || isKey(it))).forEach((it) => {
    const keep = (q) => REVISE.STAY_DOWN.indexOf(q) >= 0 || REVISE.TRAVEL.GAITS.indexOf(q) >= 0;
    if (!keep(poseOf(it))) it.look.pose = 'cower';
    keysOf(it).forEach((q) => { if (q.pose && !keep(q.pose)) q.pose = 'cower'; });
    note('shield', it.id);
  });
}
function bodyMarks() {
  const re = new RegExp(REVISE.BODY_MARK);
  S.items = S.items.filter((it) => { if (it.fn !== 'prop' || isKey(it) || !re.test(String(it.id || '').toLowerCase())) return true; note('mark', it.id); return false; });
}
function trenches() {
  S.items.filter((it) => it.fn === 'prop' && REVISE.TRENCH.KINDS.indexOf(it.kind) >= 0 && !(+it.w > 0) && +it.h > 0).forEach((it) => { it.w = Math.min(FW * REVISE.TRENCH.MAX, +it.h * REVISE.TRENCH.ASPECT); note('trench', it.id); });
}
function behindCover() {
  const words = REVISE.WORDS.BEHIND;
  S.items.filter((c0) => (c0.fn === 'prop' || c0.fn === 'vehicle' || c0.fn === 'wall') && +c0.h > 0 && isFinite(+c0.y) && +c0.y > H0 + 8).forEach((c0) => {
    const names = [c0.kind || ''].concat(String(c0.id || '').toLowerCase().split(/[^a-z]+/)).filter((w) => w.length > 2).map((w) => w.toLowerCase());
    if (!words.some((b) => { let i = TEXT.indexOf(b); while (i >= 0) { const win = TEXT.slice(i + b.length, i + b.length + 30); if (names.some((n) => win.indexOf(n) >= 0)) return true; i = TEXT.indexOf(b, i + 1); } return false; })) return;
    const half = (+c0.w || +c0.h * footOf(c0)) / 2, y = +c0.y - +c0.h * (new RegExp(REVISE.HOLE).test(c0.kind) ? REVISE.COVER_HOLE : REVISE.COVER_BACK);
    S.items.filter((p) => p.fn === 'person' && !p.mount && !p.group && (p.id === S.focus || p.id === 'you' || REVISE.HIDE.indexOf(poseOf(p)) >= 0) && Math.abs(+stateAt(p, 0).y - +c0.y) < +c0.h && Math.abs(+stateAt(p, 0).x - +c0.x) < half + +p.h * 0.5).forEach((p) => {
      if (y <= H0 + 4) return;
      if (+stateAt(p, 0).y > y) moveDepth(p, (y - H0) / Math.max(1, +stateAt(p, 0).y - H0));
      p.z = (isFinite(+c0.z) ? +c0.z : +c0.y) - 0.5;
      if (said(REVISE.WORDS.DUCK)) { const keep = (q) => REVISE.HIDE.indexOf(q) >= 0 || REVISE.STAY_DOWN.indexOf(q) >= 0 || q === 'crawl'; if (!keep(poseOf(p))) p.look = Object.assign({}, p.look || {}, { pose: 'crouch' }); keysOf(p).forEach((q) => { if (q.pose && !keep(q.pose)) q.pose = 'crouch'; }); }
      note('behind', p.id);
    });
  });
}
function restingPoles() {
  S.items.filter((it) => it.fn === 'prop' && !it.heldBy && !moves(it) && REVISE.POLES.indexOf(it.kind) >= 0 && !isFinite(+(it.look || {}).angle) && !(+it.w > +it.h * 2)).forEach((it) => {
    const f = (+it.facing || 1) < 0 ? -1 : 1, down = new RegExp(REVISE.DROPPED).test(String(it.id || ''));
    it.look = Object.assign({}, it.look || {}, { angle: f * (down ? REVISE.POLE_LIE : REVISE.POLE_LEAN) });
    note(down ? 'lying' : 'lean', it.id);
  });
}
function heldSizes() {
  const tol = REVISE.HELD_TOL;
  S.items.filter((it) => it.fn === 'prop' && it.heldBy && SIZE_STD[it.kind] && +it.h > 0).forEach((it) => {
    const who = S.items.find((q) => q.id === it.heldBy);
    if (!who || !(+who.h > 0)) return;
    const real = SIZE_STD[it.kind], person = +who.h / (who.mount ? REVISE.RIDER : 1), want = Math.max(real.h, real.l) * person, drawn = +it.w > +it.h * 2 ? +it.w : real.place === 'air' ? (+it.h * Math.max(real.h, real.l)) / Math.min(real.h, real.l) : +it.h * Math.max(1, footOf(it)), k = want / drawn;
    if (k > tol || k < 1 / tol) { it.h = +it.h * k; if (isFinite(+it.w)) it.w = +it.w * k; keysOf(it).forEach((q) => { if (isFinite(+q.h)) q.h = +q.h * k; }); note('resize', it.id); }
  });
}
function lyingFlat() {
  const FLAT = new RegExp(REVISE.LIE_FLAT);
  S.items.filter((it) => it.fn === 'prop' && FLAT.test(String(it.kind || '')) && !it.heldBy && !it.on && !moves(it) && !(it.look || {}).lying && isFinite(+it.y) && +it.y > H0 + 4).forEach((it) => { it.look = Object.assign({}, it.look || {}, { lying: true }); note('flat', it.id); });
}
function staysDown() {
  if (said(REVISE.WORDS.RISE)) return;
  S.items.filter((it) => it.fn === 'person' && !it.mount).forEach((it) => {
    let down = REVISE.STAY_DOWN.indexOf(poseOf(it)) >= 0;
    keysOf(it).filter((q) => q.pose && isFinite(+q.at)).sort((u, v) => +u.at - +v.at).forEach((q) => {
      if (down && REVISE.STAY_DOWN.indexOf(q.pose) < 0 && q.pose !== 'crawl') { q.pose = 'lie'; note('down', it.id); }
      if (REVISE.STAY_DOWN.indexOf(q.pose) >= 0) down = true;
    });
  });
}
function toldNumbers() {
  const N = REVISE.NUMBER, out = [], words = TEXT.replace(/(\d)[,.](\d{3})/g, '$1$2').split(/[^0-9\p{L}]+/u).filter(Boolean);
  let cur = 0, any = false;
  const flush = () => { if (any) out.push(cur); cur = 0; any = false; };
  words.forEach((w) => {
    if (/^\d+$/.test(w)) { if (any && cur) flush(); cur += +w; any = true; return; }
    if (N.UNITS[w] != null) { cur += N.UNITS[w]; any = true; return; }
    if (N.SCALES[w] != null) { cur = (cur || 1) * N.SCALES[w]; any = true; return; }
    flush();
  });
  flush();
  return out;
}
function countsTold() {
  const told = toldNumbers(), tol = REVISE.NUMBER.TOLERANCE;
  S.devices = (S.devices || []).filter((d) => { if (d.kind !== 'count') return true; const ok = (d.groups || []).some((g) => told.some((n) => Math.abs(n - +g.n) <= Math.max(0.5, +g.n * tol))); if (!ok) note('count', 'untold'); return ok; });
}
function marchOn() {
  if (!said(REVISE.WORDS.MARCH)) return;
  const T = REVISE.TRAVEL, want = FW * T.MIN;
  S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal' || it.fn === 'vehicle') && !it.heldBy && !it.deck).forEach((it) => {
    const ks = keysOf(it).filter((q) => isFinite(+q.x) && isFinite(+q.at)).sort((u, v) => +u.at - +v.at), gait = (q) => T.GAITS.indexOf(q.pose || poseOf(it)) >= 0;
    if (ks.length < 2 || !(it.fn !== 'person' || ks.some(gait))) return;
    const a = ks.find((q) => it.fn !== 'person' || gait(q)) || ks[0], b = ks[ks.length - 1], dx = +b.x - +a.x;
    if (!dx || Math.abs(dx) >= want) return;
    const k = want / Math.abs(dx), from = +a.at;
    ks.filter((q) => +q.at > from).forEach((q) => { q.x = +a.x + (+q.x - +a.x) * k; });
    note('march', it.id);
  });
}
function passBy() {
  const P = REVISE.PASS, standing = S.items.filter((it) => it.fn === 'person' && !it.group && !moves(it) && +it.h > 0);
  S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && moves(it) && +it.h > 0 && !it.deck).forEach((m) => {
    const ks = keysOf(m).filter((q) => isFinite(+q.x)), lo = Math.min(+m.x, ...ks.map((q) => +q.x)), hi = Math.max(+m.x, ...ks.map((q) => +q.x));
    const by = standing.filter((s) => s !== m && +s.x > lo && +s.x < hi && +s.y > +m.y && +s.y - +m.y < +m.h * P.GAP);
    if (!by.length) return;
    const y = Math.min(...by.map((s) => +s.y)) - +m.h * P.GAP;
    if (y <= H0 + 8) return;
    moveDepth(m, (y - H0) / Math.max(1, +m.y - H0));
    note('pass', m.id);
  });
  S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && moves(it) && +it.h > 0 && !it.deck && !it.group).forEach((m) => {
    const ks = keysOf(m).filter((q) => isFinite(+q.x)), x0 = +stateAt(m, 0).x;
    S.items.filter((o) => o !== m && +o.h > +m.h * P.SOLID && (o.fn === 'vehicle' || o.fn === 'building' || (o.fn === 'prop' && !moves(o) && !SHOT.test(o.kind))) && Math.abs(+o.y - +m.y) < +m.h * P.DEPTH).forEach((o) => {
      const half = (+o.w || +o.h * footOf(o)) / 2 + +m.h * footOf(m) * 0.5, l = +o.x - half, r = +o.x + half;
      if (x0 > l && x0 < r) return;
      ks.forEach((q) => { if (x0 <= l && +q.x > l) { q.x = l; note('stop', m.id); } else if (x0 >= r && +q.x < r) { q.x = r; note('stop', m.id); } });
    });
  });
}
function packed() {
  if (!said(REVISE.WORDS.PACKED)) return;
  const P = REVISE.PACKED;
  S.items.filter((it) => it.fn === 'person' && it.group && +it.group.count > 1).forEach((it) => { it.group.width = (+it.group.width || +it.h * it.group.count * 0.5) * P.WIDTH; it.group.count = Math.round(+it.group.count * P.MORE); note('packed', it.id); });
  PACK.on = true;
}
const PACK = { on: false };
function qa() {
  const C = REVISE.CROSS, mid = H0 + (FH - H0) * C.NEAR, fore = S.items.filter((it) => it.fn === 'person' && !it.heldBy && +stateAt(it, 0).y > mid);
  if (STRIP.on) fore.forEach((a) => fore.forEach((b) => { if (a.id < b.id && (a.look || {}).region !== (b.look || {}).region && (C.MELEE.indexOf(poseOf(a)) >= 0 || C.MELEE.indexOf(poseOf(b)) >= 0) && !a.deck && !b.deck) { const st = stripAt(+a.y); if ((+a.x < st.c) !== (+b.x < st.c) && Math.abs(+a.x - +b.x) < Math.max(+a.h, +b.h) * 2.5) note('qa-water', a.id + '/' + b.id); } }));
  S.items.forEach((it) => { if ((it.fn === 'vehicle' || it.fn === 'building' || it.fn === 'wall') && isFinite(+it.y) && +it.y < H0 - 2 && !it.shape) note('qa-float', it.id); });
  S.items.forEach((it) => { if (it.fn === 'prop' && it.kind && !quiet(() => FIG.prop(SPARE, { kind: it.kind, x: 50, y: 100, h: 60, facing: 1 }))) note('qa-undrawn', it.id); });
  if (!S.items.some(moves) && !(S.effects || []).length && !(S.devices || []).some((d) => d.kind !== 'time')) note('qa-static', '');
  const told = timeOfText();
  if (told && SKY[told] && told !== S.time) note('qa-time', S.time + '/' + told);
}
function outsideWalls() {
  const F = REVISE.FORT, you = S.items.find((it) => it.id === 'you' && it.look && it.look.region);
  if (!you || said(REVISE.WORDS.BREACH)) return;
  const home = you.look.region;
  S.items.filter((w) => w.fn === 'wall' && F.KINDS.indexOf(w.kind) >= 0 && isFinite(+w.y) && +stateAt(you, 0).y > +w.y).forEach((w) => {
    const line = +w.y - F.BEHIND;
    S.items.filter((it) => it.fn === 'person' && it.look && it.look.region && it.look.region !== home && isFinite(+it.y) && +it.y > line && +it.y > H0 + 8).forEach((it) => {
      moveDepth(it, (line - H0) / (+it.y - H0));
      note('outside', it.id);
    });
  });
}
function revise() {
  offstage();
  noHolds();
  toolsByVerb();
  verbPoses();
  retime();
  castMarks();
  varyFar();
  mergeMounts();
  unseat();
  staysDown();
  restingPoles();
  lyingFlat();
  soundPoses();
  shieldUp();
  bodyMarks();
  trenches();
  behindCover();
  heldTwins();
  trails();
  openings();
  wrecks();
  regionKinds();
  dryFlags();
  factions();
  outsideWalls();
  deviceRules();
  countsTold();
  marchOn();
  packed();
  if (said(REVISE.WORDS.SMASH) && !S.items.some((it) => it.state || it.burning)) note('story', 'smash');
}
function separate() {
  const named = S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && !it.group && !it.on && !it.deck && !it.heldBy && +it.h > 0 && isFinite(+it.x));
  const SAMPLE = [0, 0.25, 0.5, 0.75, 1], at = (it, p) => stateAt(it, p);
  const shift = (it, dx) => { it.x = +it.x + dx; keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = +q.x + dx; }); };
  const order = named.slice().sort((a, b) => +a.x - +b.x);
  const rank = (it) => (it.id === S.focus ? 3 : PAIRS.some((p) => p[0] === idOf(it.id) || p[1] === idOf(it.id)) ? 2 : 1);
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) {
      const a = order[i], b = order[j];
      let worst = 0;
      SAMPLE.forEach((p) => {
        const sa = at(a, p), sb = at(b, p);
        if (Math.abs(+sa.y - +sb.y) > 0.1 * Math.max(+sa.h, +sb.h)) return;
        const wa = +sa.h * footOf(a), wb = +sb.h * footOf(b), allow = paired(a, b) ? PAIR_OVERLAP : PACK.on ? REVISE.PACKED.OVERLAP : NAMED_OVERLAP;
        const need = (wa + wb) / 2 - allow * Math.min(wa, wb) - Math.abs(+sa.x - +sb.x);
        if (need > worst) worst = need;
      });
      if (worst <= 0.5) continue;
      moved = true;
      const left = +a.x <= +b.x ? a : b, right = left === a ? b : a;
      const roomL = moves(left) ? worst : Math.max(0, +left.x - +left.h * footOf(left) / 2), roomR = moves(right) ? worst : Math.max(0, FW - +right.x - +right.h * footOf(right) / 2);
      const dl = Math.min(worst / 2 + Math.max(0, worst / 2 - roomR), roomL), dr = Math.min(worst - dl, roomR);
      shift(left, -dl); shift(right, dr);
      if (dl + dr < worst - 0.5) { const back = rank(a) <= rank(b) ? a : b; if (+back.y - H0 > 40) moveDepth(back, 0.86); }
    }
    if (!moved) break;
  }
}
function stage() {
  if (S.map || !Array.isArray(S.items)) return;
  const dropped = new Set();
  S.items = S.items.filter((it) => { const keep = !(THINGS.indexOf(it.fn) >= 0 && ABSTRACT.test(String(it.id || '')) && !it.focal && !new RegExp(REVISE.OPENING, 'i').test(String(it.id || ''))); if (!keep) dropped.add(it.id); return keep; });
  S.items = S.items.filter((it) => !(it.heldBy && dropped.has(it.heldBy)));
  revise();
  S.items.forEach((it) => {
    const ks = keysOf(it).filter((k) => isFinite(+k.x) && isFinite(+k.y));
    if (it.fn !== 'prop' || it.heldBy || it.on || ks.length < 2) return;
    const a = ks[0], b = ks[ks.length - 1];
    const to = IN_FLIGHT[it.kind];
    if (to && SIZE_STD[to] && Math.max(...ks.map((q) => Math.hypot(+q.x - +a.x, +q.y - +a.y))) > Math.max(80, (+it.h || 20) * 1.2)) { note('flight', it.id); it.kind = to; }
    if (it.kind === 'slingStone' && (said(REVISE.WORDS.SIEGE) || S.items.some((o) => REVISE.SIEGE_ENGINES.indexOf(o.kind) >= 0))) { note('siege', it.id); it.kind = 'siegeStone'; }
    if (it.kind !== 'arrow' || !SIZE_STD.bolt) return;
    const by = S.items.filter((o) => o.fn === 'person' && +o.h > 0 && isFinite(+o.x)).map((o) => { const st = stateAt(o, isFinite(+a.at) ? +a.at : 0); return { o, d: Math.hypot(+st.x - +a.x, +st.y - +(st.h || o.h) * 0.5 - +a.y) }; }).sort((p, q) => p.d - q.d)[0];
    if (by && by.d < +by.o.h * 0.8 && String((by.o.look || {}).hold || '') === 'crossbow') it.kind = 'bolt';
  });
  if (TEXT.trim() && !said(REVISE.WORDS.MISSILE)) S.items = S.items.filter((it) => { if (it.fn !== 'prop' || !(SHOT.test(it.kind) || it.kind === 'arrowVolley') || !moves(it) || isKey(it)) return true; note('unsaid', it.id); return false; });
  S.items.forEach((it) => {
    if (it.fn === 'person' || it.fn === 'animal' || it.mount || it.fn === 'sticker' || it.heldBy || moves(it) || it.id === S.focus || !isFinite(+it.y) || !(+it.h > 0)) return;
    if (+it.y < FH * 0.9) return;
    if (NATURAL.indexOf(it.kind) >= 0) { it.h = Math.min(+it.h, FH * FG_MAX); if (isFinite(+it.w)) it.w = Math.min(+it.w, FW * 0.3); it.__frame = true; return; }
    if (it.fn === 'wall' || it.group) return;
    if (/^(fg|foreground)(_|$)/i.test(String(it.id || ''))) { it.__drop = true; return; }
    const y = H0 + (FH - H0) * 0.62;
    moveDepth(it, (y - H0) / Math.max(1, +it.y - H0));
  });
  S.items = S.items.filter((it) => !it.__drop && !(it.heldBy && S.items.some((o) => o.__drop && o.id === it.heldBy)));
  const people = S.items.filter((it) => it.fn === 'person' && !it.group && +it.h > 0);
  const focal = S.items.find((it) => it.id === S.focus);
  const lead = people.find((it) => it.id === S.focus) || (focal && focal.fn !== 'person' ? null : people.slice().sort((a, b) => +b.h - +a.h)[0]);
  const leadH = lead ? Math.max(+lead.h, ...keysOf(lead).map((q) => +q.h || 0)) : 0;
  const shotOf = S.interior ? 'interior' : /establish|extreme|landscape|overhead|aerial/i.test(String((VIEW.scene || {}).shot || '')) ? 'ews' : 'ws';
  const base = FH > FW ? FW * MASTER_STD.PORTRAIT_WIDTH : FH, range = MASTER_STD.SHOTS[shotOf];
  const target = shotOf === 'ws' ? clamp(+S.master || (VIEW.profile === 'horror' ? MASTER_STD.GENRE.horror : MASTER_STD.GENRE.default), range[0], range[1]) : (range[0] + range[1]) / 2;
  const thingRange = MASTER_STD.THING[shotOf], thingLen = focal && focal.fn !== 'person' && +focal.h > 0 ? Math.max((+focal.w || +focal.h * (SIZE_STD[focal.kind] ? SIZE_STD[focal.kind].l / SIZE_STD[focal.kind].h : ASPECT[focal.fn] || 1)) / FW, +focal.h / FH) : 0;
  const shrink = lead ? (leadH > base * range[1] ? (base * target) / leadH : 1) : thingLen > thingRange[1] ? (thingRange[0] + thingRange[1]) / 2 / thingLen : 1;
  if (shrink < 1) {
    const s = Math.max(MASTER_STD.LEAST_SCALE, shrink), cx = FW / 2, ay = S.interior ? FH * 0.65 : H0;
    const X = (x) => (x < 0 ? x * s : x > FW ? FW + (x - FW) * s : cx + (x - cx) * s), Y = (y) => ay + (y - ay) * s;
    const edgeL = FW * 0.04, edgeR = FW * 0.96;
    S.items.forEach((it) => {
      if (it.__frame || it.heldBy) return;
      const span = it.group ? +it.group.width || 0 : 0, x0 = isFinite(+it.x) ? +it.x : NaN;
      const touchL = isFinite(+it.from) ? Math.min(+it.from, +it.to) <= edgeL : isFinite(x0) && span > 0 && x0 - span / 2 <= edgeL;
      const touchR = isFinite(+it.from) ? Math.max(+it.from, +it.to) >= edgeR : isFinite(x0) && span > 0 && x0 + span / 2 >= edgeR;
      if (isFinite(x0)) it.x = X(x0);
      if (isFinite(+it.y)) it.y = Y(+it.y);
      ['h', 'w'].forEach((k) => { if (isFinite(+it[k])) it[k] = +it[k] * s; });
      if (isFinite(+it.from) && isFinite(+it.to)) {
        const a = Math.min(+it.from, +it.to), b = Math.max(+it.from, +it.to), na = touchL ? -20 : X(a), nb = touchR ? FW + 20 : X(b);
        it.from = +it.from <= +it.to ? na : nb; it.to = +it.from <= +it.to ? nb : na; if (isFinite(+it.x)) it.x = (na + nb) / 2;
      }
      keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = X(+q.x); if (isFinite(+q.y)) q.y = Y(+q.y); if (isFinite(+q.h)) q.h = +q.h * s; });
      if (it.group) {
        const g = it.group, w0 = +g.width || 0;
        g.width = w0 * s; if (isFinite(+g.depth)) g.depth = +g.depth * s;
        if ((touchL || touchR) && w0 > 0 && isFinite(+it.x)) {
          const l = touchL ? -10 : it.x - g.width / 2, r = touchR ? FW + 10 : it.x + g.width / 2, nw = r - l;
          g.count = Math.min(40, Math.max(+g.count || 1, Math.round((+g.count || 1) * nw / Math.max(1, g.width))));
          g.width = nw; it.x = (l + r) / 2;
        }
      }
    });
    (S.effects || []).forEach((e) => { if (isFinite(+e.x)) e.x = X(+e.x); if (isFinite(+e.y)) e.y = Y(+e.y); if (isFinite(+e.r)) e.r = +e.r * s; });
    (S.water || []).forEach((w) => { if (isFinite(+w.y)) w.y = Y(+w.y); if (isFinite(+w.h)) w.h = +w.h * s; });
    (S.scatter || []).forEach((sc) => {
      sc.count = Math.min(40, Math.round((+sc.count || 0) / s));
      if (Array.isArray(sc.area)) { const a = sc.area, full = a[0] <= FW * 0.02 && a[2] >= FW * 0.98; sc.area = [full ? 0 : X(a[0]), Y(a[1]), full ? FW : X(a[2]), a[3] >= FH * 0.98 ? FH : Y(a[3])]; }
    });
    if (S.haze && isFinite(+S.haze.frontOf)) S.haze.frontOf = Y(+S.haze.frontOf);
    S.__master = s;
  }
  if (!S.interior) {
    const ppl = S.items.filter((it) => it.fn === 'person' && +it.h > 0 && +it.y > H0 + 4).map((it) => ({ y: +it.y, h: +it.h / (it.mount ? REVISE.RIDER : 1) }));
    const ref = !ppl.length && focal && focal.fn !== 'person' && SIZE_STD[focal.kind] && +focal.h > 0 && +focal.y > H0 + 4 ? { y: +focal.y, h: +focal.h / SIZE_STD[focal.kind].h } : null;
    const near = (y) => { if (ref) return (ref.h * (y - H0)) / (ref.y - H0); const q = ppl.filter((p) => Math.abs(p.y - y) <= Math.max(24, (p.y - H0) * 0.25)).sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0]; return q ? (q.h * (y - H0)) / (q.y - H0) : undefined; };
    const nearAny = (y) => { const q = ppl.slice().sort((a, b) => b.y - a.y)[0]; return q && q.y - H0 > 8 ? (q.h * (y - H0)) / (q.y - H0) : undefined; };
    const leadPerson = Math.max(0, ...ppl.map((p) => p.h)) || base * target;
    const LOOSE = /^(rock|boulder|log|stump|bush|bushes|haystack|woodpile|campfire|bonfirePit|grass|reeds|flowers)$/, HOLE = new RegExp(REVISE.HOLE);
    const scaleBy = (it, f) => { it.h = +it.h * f; if (isFinite(+it.w)) it.w = +it.w * f; keysOf(it).forEach((q) => { if (isFinite(+q.h)) q.h = +q.h * f; }); };
    S.items.forEach((it) => {
      const real = it.kind && SIZE_STD[it.kind];
      if (!real || it.fn === 'person' || it.fn === 'sticker' || it.heldBy || !(+it.h > 0) || it === focal || HOLE.test(it.kind)) return;
      const air = real.place === 'air' && !/parked|launch/.test(String((it.look || {}).pose || ''));
      const shot = air && it.fn === 'prop' && SHOT.test(it.kind);
      const long = !air && it.fn === 'prop' && Math.max(real.h, real.l) >= REVISE.LONG * Math.min(real.h, real.l), side = (q) => (long ? Math.max(real.h, real.l) : real.h) * q;
      let want, far = false;
      if (air && !shot) want = it.dist && AIR_DIST[it.dist] ? leadPerson * real.h * AIR_DIST[it.dist] : undefined;
      else if (shot) {
        const ks = keysOf(it).filter((q) => isFinite(+q.x) && isFinite(+q.y)), end = ks[ks.length - 1] || { x: +it.x, y: +it.y }, q = +end.y > H0 + 4 ? near(+end.y) : undefined;
        const by = q ? null : S.items.filter((o) => o.fn === 'person' && +o.h > 0 && isFinite(+o.x)).sort((a, b) => Math.hypot(+a.x - +end.x, +a.y - +end.y) - Math.hypot(+b.x - +end.x, +b.y - +end.y))[0];
        const ph = q || (by ? +by.h / (by.mount ? REVISE.RIDER : 1) : 0);
        want = ph ? side(ph) * (ROUND_SHOT.test(it.kind) ? REVISE.SHOT_SIZE.ROUND_READABLE : SHOT_READABLE) : undefined;
        if (want) { scaleBy(it, want / +it.h); keysOf(it).forEach((k) => { if (isFinite(+k.h)) k.h = +it.h; }); note('shot', it.id); return; }
      }
      else if (real.place === 'held') {
        const st = { x: isFinite(+it.x) ? +it.x : (keysOf(it)[0] || {}).x, y: isFinite(+it.y) ? +it.y : (keysOf(it)[0] || {}).y };
        const by = S.items.filter((o) => o.fn === 'person' && +o.h > 0 && isFinite(+o.x)).sort((a, b) => Math.hypot(+a.x - st.x, +a.y - st.y) - Math.hypot(+b.x - st.x, +b.y - st.y))[0];
        const close = by && Math.hypot(+by.x - st.x, +by.y - st.y) < +by.h * 1.2, q = !close && isFinite(+st.y) && +st.y > H0 + 4 ? near(+st.y) || nearAny(+st.y) : undefined;
        want = close ? side(+by.h / (by.mount ? REVISE.RIDER : 1)) : q ? side(q) : by ? side(+by.h / (by.mount ? REVISE.RIDER : 1)) : undefined;
      } else { const y = isFinite(+it.y) ? +it.y : (keysOf(it)[0] || {}).y, q = isFinite(+y) && +y > H0 + 4 ? near(+y) : undefined; want = q ? side(q) : undefined; if (!q && isFinite(+y) && !air) { const q2 = +y > H0 + 4 ? nearAny(+y) : 0; want = side(Math.max(q2 || 0, leadPerson * REVISE.HORIZON_K)); far = true; } }
      if (!want) return;
      const drawn = lengthOf(it, long), tol = LOOSE.test(it.kind) || it.fn === 'tree' ? 2.5 : real.place === 'held' ? 1.4 : 1.6, k = drawn / want;
      if (k > tol || (!far && k < 1 / tol)) scaleBy(it, want / drawn);
      if (long && +it.w > +it.h * 2) { const f = footOf(it); if (f > 2) it.h = +it.w / f; }
    });
    S.items = S.items.filter((it) => {
      const real = it.kind && SIZE_STD[it.kind];
      if (!real || it.fn === 'person' || it.fn === 'sticker' || it.heldBy || it.group || !(+it.h > 0) || HOLE.test(it.kind)) return true;
      const shot = it.fn === 'prop' && SHOT.test(it.kind), round = shot && ROUND_SHOT.test(it.kind), longest = shot ? (round ? +it.h : +it.h * real.l / real.h) : lengthOf(it, true), M = REVISE.MIN_SIDE, Z0 = REVISE.SHOT_SIZE, least = shot ? (round ? Math.min(FW, FH) * Z0.ROUND : Math.max(FW, FH) * Z0.LONG) : FH * (isKey(it) ? M.KEY : M.THING);
      if (longest >= least) return true;
      if (isKey(it) || shot) { scaleBy(it, least / longest); keysOf(it).forEach((k) => { if (isFinite(+k.h)) k.h = +it.h; }); return true; }
      note('tiny', it.id);
      return false;
    });
  }
  heldSizes();
  scaleRiders();
  const room = (it) => +it.h * footOf(it) * (VIEW.movement === 'cutout' ? HOP_ROOM : 1);
  S.items.forEach((it) => {
    const g = it.group;
    if (!g || !((+g.count || 1) > 1) || it.fn === 'wall' || !(+it.h > 0)) return;
    let n = Math.round(+g.count), rows = Math.max(1, Math.round(+g.rows || (n > 6 ? 2 : 1))), member = room(it);
    const pack = it.fn === 'person' && !it.mount ? GROUP_PACK.person : GROUP_PACK.other;
    const cols = () => Math.ceil(n / rows), need = () => cols() * member * pack;
    let width = +g.width || member * n * 0.6;
    if (width >= need()) return;
    const most = FW * (moves(it) ? 1.4 : 0.96);
    width = Math.min(need(), most);
    while (need() > width && rows < 4 && n / (rows + 1) >= 1) rows++;
    if (need() > width) n = Math.max(1, Math.floor(width / (member * pack)) * rows);
    g.count = n; g.rows = rows; g.width = width;
    g.depth = Math.max(+g.depth || 0, +it.h * ROW_DEPTH * (rows - 1));
    if (!moves(it) && isFinite(+it.x)) it.x = clamp(+it.x, width / 2, FW - width / 2);
  });
  const standing = S.items.filter((it) => it.fn === 'person' && !it.mount && +it.h > 0 && +it.y > H0 + 8);
  const personAt = (y) => { const q = standing.slice().sort((a, b) => Math.abs(+a.y - y) - Math.abs(+b.y - y))[0]; return q ? (+q.h * (y - H0)) / Math.max(1, +q.y - H0) : FH * 0.3; };
  S.items.forEach((it) => {
    if (it.fn !== 'prop' || it.group || it.heldBy || !(+it.h > 0) || !isFinite(+it.y) || +it.y <= H0 + 8 || (SHOT.test(it.kind) && moves(it)) || new RegExp(REVISE.HOLE).test(it.kind)) return;
    const wide = lengthOf(it, true), most = THING_WIDE * personAt(+it.y);
    if (wide > most) { const k = most / wide; it.h = +it.h * k; if (isFinite(+it.w)) it.w = +it.w * k; keysOf(it).forEach((q) => { if (isFinite(+q.h)) q.h = +q.h * k; }); }
  });
  S.items.forEach((it) => {
    if (it.fn !== 'prop' || !SHOT.test(it.kind) || !moves(it)) return;
    const ks = keysOf(it).filter((q) => isFinite(+q.x) && isFinite(+q.y)), end = ks[ks.length - 1];
    const hit = S.items.filter((o) => o !== it && o.fn !== 'sticker' && !o.heldBy && +o.h > 0 && isFinite(+o.y) && +o.y > +end.y && +o.y - +o.h < +end.y && Math.abs(+stateAt(o, 0).x - +end.x) < (+o.w || +o.h * footOf(o)) / 2 + 20);
    if (hit.length) it.z = Math.max(isFinite(+it.z) ? +it.z : +end.y, ...hit.map((o) => (isFinite(+o.z) ? +o.z : +o.y) + 0.5));
  });
  passBy();
  separate();
  crowds();
  placeLook();
  onBanks();
  if (STRIP.on) { separate(); outOfStrip(); }
  qa();
}
stage();
let FX = true;
window.motionScene = { ready: Promise.resolve(), renderAt: async function (input) {
  input = input || {};
  const width = Math.max(320, Number(input.width) || FW), height = Math.max(180, Number(input.height) || FH), dur = Math.max(0.1, Number(input.duration) || 10);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const p = input.motionEnabled === false ? 0.5 : clamp(Number(input.progress) || 0, 0, 1), t = input.motionEnabled === false ? 0 : p * dur, sc = Math.min(width / FW, height / FH);
  FX = input.sceneEffectsEnabled !== false;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#d9d2c2'; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate((width - FW * sc) / 2, (height - FH * sc) / 2); ctx.scale(sc, sc);
  if (K && K.time) K.time(t);
  DUR = dur;
  paint(p, t, false);
  const T = ctx.getTransform(), hk = window.__motionViewHooks;
  ctx.restore();
  if (hk) hk.screen++;
  try {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate((width - FW * sc) / 2, (height - FH * sc) / 2); ctx.scale(sc, sc);
    const B = ctx.getTransform(), BI = B.inverse(), zoom = Math.hypot(T.a, T.b) / Math.max(1e-6, Math.hypot(B.a, B.b));
    const toFrame = (x, y) => { const q = BI.transformPoint(T.transformPoint(new DOMPoint(x, y))); return [q.x, q.y]; };
    if (!S.map) { finish(); devices(p, t, 'final', toFrame, zoom); devices(p, t, 'over', toFrame, zoom); }
    const fr = !S.map && RES[S.focus] && inFrame(boxOf(RES[S.focus]), toFrame);
    window.__motionFocusBox = fr ? { x: fr.x / FW, y: fr.y / FH, w: fr.w / FW, h: fr.h / FH } : null;
    if (S.headline) headline(S.headline);
    ctx.restore();
  } finally { if (hk) hk.screen--; }
  if (S.header) FIG.header(ctx, { text: S.header });
} };
if (!window.__MOTION_HOST__) { const t0 = performance.now(), loop = (now) => { const d = 10, tt = ((now - t0) / 1000) % d; window.motionScene.renderAt({ time: tt, progress: tt / d, duration: d, width: window.innerWidth || FW, height: window.innerHeight || FH }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

})();`;
