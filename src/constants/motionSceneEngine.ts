import { MOTION_MASTER as M } from "./motionMasterScale.js";
import { MOTION_AIR_DISTANCE, MOTION_OBJECT_SIZE as Z } from "./motionObjectSize.js";
import { MOTION_SCENE_REVISE } from "./motionSceneSpec.js";
export const MOTION_SCENE_ENGINE = String.raw`(function () {
const MASTER_STD = ${JSON.stringify({ SHOTS: M.SHOTS, GENRE: M.GENRE, PORTRAIT_WIDTH: M.PORTRAIT_WIDTH, THING: M.THING, LEAST_SCALE: M.LEAST_SCALE })};
const SIZE_STD = ${JSON.stringify(Z)};
const AIR_DIST = ${JSON.stringify(MOTION_AIR_DISTANCE)};
const REVISE = ${JSON.stringify(MOTION_SCENE_REVISE)};
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
const LAND = { dirt: '#b39a72', grass: '#8ea566', sand: '#d8c294', snow: '#e9eef1', mud: '#86704f', stone: '#a29c8f' };
// Width of one drawing for its height (kit proportions), to read sizes and keep things apart.
const ASPECT = { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1, bridge: 4, sticker: 1 };
const NUM = ['x', 'y', 'h', 'w'];
// The state of an item at progress p: numbers glide between keyframes, other values switch when a key starts.
// The state of an item at progress p: numbers follow one smooth curve through the keyframes (the speed carries on
// through a key where the move continues, no stop at every key); other values switch when their key starts.
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
  // Water bands (river / lake) across the ground.
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
// Kinds that are walls drawn along a length: from/to give the length (at least two pieces long for a wagon fort).
const WALLS = ['wall', 'palisade', 'fence', 'wagonFort', 'gate', 'sandbags', 'barbedWire', 'stakeRow', 'earthwork'];
function wallPiece(it, o, lo, hi) {
  const len = hi - lo, mid = (lo + hi) / 2;
  // The span is kept exactly (it may leave an opening next to it); a wagon fort too short for two wagons is single wagons.
  if (it.kind === 'wagonFort' && len < o.h * 3.4) {
    const n = Math.max(1, Math.round(len / (o.h * 1.7))), each = len / n;
    let r = null;
    for (let i = 0; i < n; i++) { const q = FIG.vehicle(ctx, Object.assign({}, o, { kind: 'wagon', x: lo + each * (i + 0.5), w: undefined, mark: i ? undefined : o.mark })); r = r || q; }
    return r;
  }
  return FIG.wall(ctx, Object.assign({}, o, { kind: it.kind || 'wall', x: mid, w: Math.max(len, o.h * 0.6) }));
}
function ringWall(it, o) {
  const a = +it.from, b = +it.to, cx = (a + b) / 2, rx = Math.abs(b - a) / 2, ry = rx * 0.24, step = o.h * (it.kind === 'wagonFort' ? 1.7 : 1.2), n = Math.max(6, Math.round((Math.PI * (rx + ry)) / step)), gaps = Array.isArray(it.gaps) ? it.gaps : [];
  const pts = [];
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2, sn = Math.sin(th); pts.push({ x: cx + rx * Math.cos(th), y: +o.y - ry + ry * sn, k: 1 - 0.18 * (1 - sn) / 2, front: sn > 0 }); }
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
    // The open stretches ("gaps": a breach, an opening in a wagon fort) split the wall into pieces drawn one by one.
    let pieces = [[Math.min(a, b), Math.max(a, b)]];
    (Array.isArray(it.gaps) ? it.gaps : []).forEach((g) => { pieces = pieces.flatMap(([l, r]) => (+g[1] <= l || +g[0] >= r ? [[l, r]] : [[l, +g[0]], [+g[1], r]].filter(([u, v]) => v - u > 2))); });
    let res = null;
    pieces.forEach(([lo, hi], k) => { const q = wallPiece(it, Object.assign({}, o, { mark: k ? undefined : o.mark }), lo, hi); res = res || q; });
    return res;
  }
  const res = it.state && it.fn !== 'person' && it.fn !== 'animal' ? damaged(it, o) : FIG[it.fn] ? FIG[it.fn](ctx, o) : null;
  if (it.burning && res && res.box) K.effect(ctx, { kind: 'burning', x: res.box.x + res.box.w / 2, y: res.box.y + res.box.h * 0.35, r: res.box.h * 0.5, t, seed: 1 });
  return res;
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
  // A prop in flight lies along its way, as long as its real length against its height (never stood up like a spear).
  const flying = it.fn === 'prop' && real && real.place === 'air';
  const lands = it.fn === 'prop' && !it.heldBy && REVISE.HURLED.indexOf(it.kind) >= 0 && keysOf(it).filter((q) => isFinite(+q.y)).length > 1 ? Math.max(...keysOf(it).filter((q) => isFinite(+q.y)).map((q) => +q.y)) : 0;
  const h = lands > H0 ? +st.h * clamp((+st.y - H0) / (lands - H0), REVISE.HURL_MIN, 1) : +st.h, w = +st.w || (flying ? h * (real.l / real.h) : it.mount ? mountOf(it.mount, h).w : h * (ASPECT[it.fn] || 1));
  let facing = (+st.facing || 1) < 0 ? -1 : 1;
  // A thing flying on its way turns to where it goes: it faces its way across, its nose follows the climb or the dive
  // (an aircraft at most AIR_TILT; anything shot or thrown — arrow, bolt, spear, shot, stone, rocket, missile — freely).
  if (real && real.place === 'air' && !/parked|launch/.test(String(look.pose || '')) && it.keys && it.keys.length > 1 && it.fn !== 'animal') {
    const a = stateAt(it, Math.max(0, p - 0.01)), b = stateAt(it, Math.min(1, p + 0.01)), vx = +b.x - +a.x, vy = +b.y - +a.y;
    if (Math.hypot(vx, vy) > 0.5) {
      facing = vx < 0 ? -1 : 1;
      const free = PROJECTILE.test(it.kind), lim = free ? Math.PI / 2 : AIR_TILT;
      look.angle = clamp(Math.atan2(vy, Math.abs(vx)) * facing, -lim, lim);
    }
  }
  // Still things stay whole in the frame; movers may enter and leave.
  if (!it.keys || !it.keys.length) x = clamp(x, w * 0.45, FW - w * 0.45);
  const seat = it.on && RES[it.on] && RES[it.on].box;
  if (seat) x = seat.x + seat.w / 2;
  ctx.save();
  if (it.fade) ctx.globalAlpha = 1 - smooth(it.fade[0], it.fade[1], p);
  const g = it.group || {}, n = Math.max(1, Math.round(+g.count || 1)), rows = Math.max(1, Math.round(+g.rows || (n > 6 ? 2 : 1))), gw = +g.width || w * n * 0.6, depth = +g.depth || h * 0.14;
  const members = [];
  for (let i = 0; i < n; i++) {
    const row = i % rows, col = Math.floor(i / rows), cols = Math.ceil(n / rows);
    const k = rows > 1 ? row / (rows - 1) : 0, s = 1 - 0.1 * k;
    members.push({ i, row, x: n > 1 ? x - gw / 2 + ((col + 0.5 + (row % 2) * 0.35) / cols) * gw + (rnd(41, i) - 0.5) * gw * 0.06 : x, y: y - k * depth, s: s * (n > 1 ? 0.95 + 0.1 * rnd(43, i) : 1) });
  }
  members.sort((a, b) => a.y - b.y);
  members.forEach((m, j) => {
    const o = Object.assign({}, look, { mark: it.id, x: m.x, y: m.y, h: h * m.s, w: +st.w > 0 || it.fn === 'person' || it.fn === 'animal' || it.mount || flying ? w * m.s : undefined, facing, seed: 3 + m.i * 5 + it.id.length, distance: st.distance + ((m.i * 0.618) % 1) * 1.3 * h * m.s });
    if (it.kind) o.kind = it.kind;
    if ((it.fn === 'person' || it.fn === 'animal') && st.moving && (!o.pose || o.pose === 'stand' || o.pose === 'walk')) o.pose = o.pose === 'walk' ? 'walk' : 'run';
    if (seat && it.fn === 'person') { o.pose = o.pose || 'sit'; o.y = seat.y + hipDrop(o) + seat.h * 0.06; }
    if (it.fn === 'person') { o.tremble = trembleOf(it, o, members.length - 1 - j, t); o.trembleHz = REVISE.TREMBLE.HZ; }
    if (it.fn === 'person' && n > 1) { ['top', 'pants'].forEach((k, q) => { if (HEX.test(String(o[k] || ''))) o[k] = mix(o[k], rnd(47 + q, m.i) > 0.5 ? '#ffffff' : '#000000', rnd(53 + q, m.i) * REVISE.CROWD.TONE); }); if (!look.hairColor) o.hairColor = REVISE.CROWD.HAIR[Math.floor(rnd(59, m.i) * REVISE.CROWD.HAIR.length)]; }
    const r = drawOne(it, st, o, t, !m.i);
    if (!m.i) RES[it.id] = Object.assign({ x: o.x, y: o.y, h: o.h, w: o.w, facing, look }, r || {});
  });
  ctx.restore();
}
const STICK = {};
function drawSticker(it, st, p, t) {
  if (it.at && (p < it.at[0] || p > it.at[1])) return;
  let f = STICK[it.id];
  if (f === undefined) { try { f = STICK[it.id] = new Function('c', 'w', 'h', 't', 'p', it.code || ''); } catch (e) { f = STICK[it.id] = null; } }
  if (!f) return;
  const who = it.heldBy && RES[it.heldBy], w = +st.w || +st.h || 40, h = +st.h || w;
  let x, y;
  if (who) { const hp = it.hand === 'back' ? who.backHand || who.hand : who.hand || who.backHand; if (!hp) return; x = hp[0]; y = hp[1]; }
  else { x = +st.x; y = +st.y; if (!isFinite(x) || !isFinite(y)) return; }
  ctx.save(); ctx.translate(x, y); if ((+st.facing || 1) < 0) ctx.scale(-1, 1);
  if (window.motionMark) window.motionMark(ctx, it.id, -w / 2, who ? -h / 2 : -h, w, h);
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
// Air between the viewer and the far band: far things take on the sky's colour, so the depth reads at once.
function veil() {
  const sky = SKY[S.time] || SKY.day, y1 = H0 + (FH - H0) * 0.32, g = ctx.createLinearGradient(0, H0 - 120, 0, y1);
  const c = sky[1], rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).join(',');
  g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(0.45, 'rgba(' + rgb + ',0.34)'); g.addColorStop(0.7, 'rgba(' + rgb + ',0.2)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g; ctx.fillRect(-20, H0 - 120, (FW + 40), y1 - H0 + 120);
}
// Light: a soft warm glow from the sun's side and darker corners, the finish of a painted frame.
function finish() {
  const sk = S.sky || {}, sx = isFinite(+sk.sunX) ? +sk.sunX : FW * 0.84, night = S.time === 'night';
  let g = ctx.createRadialGradient(sx, H0 * 0.3, 40, sx, H0 * 0.3, 900);
  g.addColorStop(0, night ? 'rgba(170,190,255,0.10)' : 'rgba(255,236,190,0.16)'); g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
  g = ctx.createRadialGradient(FW / 2, FH * 0.53, Math.min(FW, FH) * 0.58, FW / 2, FH * 0.53, Math.max(FW, FH) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, night ? 'rgba(5,8,20,0.5)' : 'rgba(40,28,15,0.28)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
}
// Drawing order: by ground line (y) unless the item gives z; a seat before its sitter; held stickers after their holder.
function order(p) {
  const list = (S.items || []).filter((it) => !it.heldBy).map((it) => { const st = stateAt(it, p); return { it, z: isFinite(+it.z) ? +it.z : +st.y || 0 }; });
  list.forEach((e) => { if (e.it.on) { const s = list.find((f) => f.it.id === e.it.on); if (s) e.z = Math.max(e.z, s.z + 0.01); } });
  return list.sort((a, b) => a.z - b.z).map((e) => e.it);
}
// Inside a tent, house or hall: a back wall and a floor instead of sky and land.
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
// Devices. Signs over a head, bursts, sound rings, speed streaks and the spotlight belong to the scene (the camera frames
// them with the people). Thought bubbles, close-up insets, head counts and the sun's arc are drawn over the frame after
// the camera (OVERLAY): they never hold the camera back, keep their size whatever the shot, stay inside the title-safe
// area and are placed by where their person stands in the current shot; at most OVERLAY_MAX are shown at once.
const OVERLAY = ['thought', 'inset', 'count', 'time'], OVERLAY_MAX = 2, TITLE_SAFE = FW < FH ? 0.08 : 0.05;
const LONG_HELD = /spear|lance|pike|halberd|banner|flag|pole|staff|bow|crossbow|musket|rifle|sword|axe|torch|oar|scythe|pitchfork/i;
// A thing inside a bubble is placed from the bubble's centre: a wall's ends and its gaps too (else it is drawn off at the
// frame's left edge and the bubble stays empty).
function inBubble(it, x) {
  const out = {};
  if (isFinite(+it.from)) out.from = x + +it.from;
  if (isFinite(+it.to)) out.to = x + +it.to;
  if (Array.isArray(it.gaps)) out.gaps = it.gaps.map((g) => [x + +g[0], x + +g[1]]);
  return out;
}
function devices(p, t, layer, toFrame, zoom) {
  const over = layer === 'over';
  const list = (S.devices || []).filter((d) => !(d.at && (p < d.at[0] || p > d.at[1])) && (OVERLAY.indexOf(d.kind) >= 0) === over && (d.kind === 'spotlight') === (layer === 'final'));
  (over ? list.slice(0, OVERLAY_MAX) : list).forEach((d) => {
    const appear = d.at ? smooth(d.at[0], d.at[0] + 0.06, p) : 1, who = d.of && RES[d.of];
    const headAt = who && who.head ? who.head : who ? [who.x, who.y - who.h * 0.9] : null;
    if (d.kind === 'emote') { if (!headAt) return; const r = Math.max(14, (who.h || 200) * 0.08); FIG.device(ctx, { kind: 'emote', sign: d.sign || 'alarm', x: headAt[0] + r * 0.4, y: headAt[1] - (who.h || 200) * 0.16, r, appear }); return; }
    if (d.kind === 'thought') {
      const r = Math.min(+d.r || 100, FH * 0.2), head = headAt && toFrame(headAt[0], headAt[1]);
      let x = +d.x || FW / 2, y = +d.y || FH * 0.28;
      // Closer than the master shot, or the given place off the head: beside the head, on the side with more room.
      if (head && (zoom > 1.02 || !isFinite(+d.x))) { const side = head[0] < FW / 2 ? 1 : -1; x = head[0] + side * r * 1.5; y = head[1] - r * 1.25; }
      x = clamp(x, FW * TITLE_SAFE + r, FW * (1 - TITLE_SAFE) - r); y = clamp(y, FH * TITLE_SAFE + r, FH * 0.84 - r);
      if (hitsKey({ x: x - r * 1.6, y: y - r * 1.05, w: r * 3.2, h: r * 2.1 }, toFrame)) { const spot = freeSpot(r * 3.2, r * 2.1, toFrame, [x, y]); if (spot) { x = spot.x + r * 1.6; y = spot.y + r * 1.05; } }
      const from = head && head[0] > 0 && head[0] < FW && head[1] > 0 && head[1] < FH ? head : undefined;
      const cy = d.fitted ? y : y + r * 0.45;
      FIG.device(ctx, { kind: 'thought', x, y, r, from, appear }, () => { quiet(() => (d.items || []).forEach((it) => drawItem(Object.assign({}, it, { x: x + (+it.x || 0), y: d.fitted ? cy + +it.y : y + (it.y != null ? +it.y : r * 0.45), keys: undefined }, inBubble(it, x)), p, t))); });
      return;
    }
    if (d.kind === 'inset') {
      if (!who) return;
      const r = Math.min(+d.r || 110, FH * 0.2), lead = toFrame(who.x, who.y - who.h * 0.5), x = lead[0] > FW / 2 ? FW * TITLE_SAFE + r : FW * (1 - TITLE_SAFE) - r, y = FH * TITLE_SAFE + r;
      // The thing to show: a small loose thing the scene puts at this person's hand (a whetstone, a letter), else a small
      // thing they hold; long things (weapons, poles) read well in the shot itself and get no close-up.
      const handAt = who.hand || [who.x, who.y - who.h * 0.5], small = (S.items || []).filter((it) => it.fn === 'prop' && it.kind && !it.group && +it.h > 0 && +it.h < (who.h || 200) * 0.35 && RES[it.id] && Math.hypot(RES[it.id].x - handAt[0], RES[it.id].y - handAt[1]) < (who.h || 200) * 0.7)[0];
      const held = String((who.look && who.look.hold) || ''), hold = small ? small.kind : LONG_HELD.test(held) ? '' : held;
      const part = d.part === 'head' || !hold ? 'head' : 'item';
      if (part === 'item' && !quiet(() => FIG.prop(SPARE, { kind: hold, x: 50, y: 100, h: 60, facing: 1 }))) { note('inset', d.of); return; }
      if (part === 'head') {
        // A face already large in this shot needs no close-up of itself.
        if (!who.head || (who.h || 0) * zoom > FH * 0.55) return;
        const z = Math.max(1.5, +d.zoom || 3), pt = who.head;
        FIG.device(ctx, { kind: 'inset', x, y, r, from: toFrame(pt[0], pt[1]), appear }, (c) => { c.save(); c.translate(x, y); c.scale(z, z); c.translate(-pt[0], -pt[1]); quiet(() => paint(p, t, true)); c.restore(); });
        return;
      }
      // The thing in the hand, drawn large on its own (a whetstone, a letter, a seal): what a zoomed picture of a small
      // hand could not show. A thing the library has no drawing for is no close-up.
      const hand = who.hand ? toFrame(who.hand[0], who.hand[1]) : lead;
      FIG.device(ctx, { kind: 'inset', x, y, r, from: hand, appear }, (c) => { quiet(() => FIG.prop(c, { kind: hold, x, y: y + r * 0.45, h: r * 1.1, facing: 1 })); });
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
  const soft = d.at ? smooth(d.at[0], d.at[0] + SP.SOFT, p) * (1 - smooth(d.at[1] - SP.SOFT, d.at[1], p)) : smooth(0, SP.SOFT, p);
  FIG.device(ctx, { kind: 'spotlight', x: cx, y: cy, r: Math.max(size * 0.6, FH * SP.MIN), dim: S.time === 'night' ? SP.NIGHT : SP.DIM, appear: soft });
}
const busyBoxes = (toFrame) => S.items.filter((it) => RES[it.id] && (it.fn === 'person' || it.fn === 'animal' || isKey(it))).map((it) => Object.assign(inFrame(boxOf(RES[it.id]), toFrame), { key: isKey(it) }));
const hitsKey = (b, toFrame) => busyBoxes(toFrame).some((q) => q.key && Math.min(b.x + b.w, q.x + q.w) > Math.max(b.x, q.x) && Math.min(b.y + b.h, q.y + q.h) > Math.max(b.y, q.y));
function freeSpot(w, h, toFrame, hint) {
  const F = REVISE.FREE, pad = FH * F.PAD, busy = busyBoxes(toFrame);
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
// Names that are water, not towns: written along the river / inside the water, never as a dotted place.
const WATER_WORD = /\b(river|sông|rio|río|fluss|fleuve|sea|ocean|biển|lake|hồ|gulf|vịnh|bay|strait|eo biển|channel|creek|stream)\b/i;
const WATER_NAMES = ['danube', 'rhine', 'rhône', 'rhone', 'seine', 'loire', 'thames', 'elbe', 'oder', 'vistula', 'dnieper', 'dniester', 'don', 'volga', 'ural', 'tisza', 'sajó', 'sajo', 'drava', 'sava', 'po', 'tiber', 'ebro', 'tagus', 'nile', 'niger', 'congo', 'zambezi', 'tigris', 'euphrates', 'jordan', 'indus', 'ganges', 'brahmaputra', 'yangtze', 'yellow river', 'mekong', 'red river', 'irrawaddy', 'amur', 'ob', 'yenisei', 'lena', 'mississippi', 'missouri', 'ohio', 'hudson', 'potomac', 'rio grande', 'amazon', 'paraná', 'parana', 'mediterranean', 'black sea', 'baltic', 'adriatic', 'aegean', 'caspian', 'atlantic', 'pacific', 'indian ocean', 'english channel', 'bosphorus'];
// Map symbols (ink, flat) for the things a map scene places: peaks, forts and wagon rings, towns, camps, ships, troops.
const MAP_PEAK = /mountain|hill|peak|volcano|ridge|range|cliff/i, MAP_CAMP = /tent|camp|yurt/i, MAP_FORT = /castle|fort|tower|keep|citadel|gate|wall|palisade|stockade|wagon/i;
const MAP_SHIP = /ship|boat|galley|galleon|longship|trireme|ferry|raft|canoe|junk|warship|carrier|submarine/i, MAP_SKIP = /river|sea|lake|ocean|road|path|route|arrow|water|coast|land|map|mark|label/i;
function chart(p, t) {
  const M = S.map, paper = M.paper || '#e6d6b0', ink = '#3a2f26';
  ctx.fillStyle = paper; ctx.fillRect(-20, -20, (FW + 40), (FH + 40));
  ctx.save(); ctx.strokeStyle = 'rgba(90,70,40,0.12)'; ctx.lineWidth = 1;
  for (let g = 0; g < (FW + 20); g += 80) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, FH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, g * 0.5625); ctx.lineTo(FW, g * 0.5625); ctx.stroke(); }
  ctx.restore();
  const SAFE = FW < FH ? 0.08 : 0.05;
  // A shore is smoothed only between points inside the frame; a point on or past the frame's edge is a hard corner, so a
  // land that fills the frame stays filling it (smoothing its corners would round it into an oval with paper corners).
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
  // The things placed on the map, as ink symbols, each in its own time window (a wagon ring closing at Mohi late on).
  (S.items || []).forEach((it) => {
    const kind = String(it.kind || ''), fn = String(it.fn || '');
    if (fn === 'sticker' || MAP_SKIP.test(kind)) return;
    const st = stateAt(it, p), x = +st.x, y = +st.y, s = clamp(+st.h || 30, 14, 60);
    if (!isFinite(x) || !isFinite(y)) return;
    // Its room is kept for the whole scene (a name never jumps aside when the symbol appears).
    const ring = fn === 'wall' && /wagon/i.test(kind) ? clamp(isFinite(+it.from) && isFinite(+it.to) ? Math.abs(+it.to - +it.from) / 2 : s * 0.6, 40, 90) : 0;
    boxes.push(ring ? { x0: x - ring - 8, x1: x + ring + 8, y0: y - ring * 0.7 - 6, y1: y + ring * 0.7 + 6 } : { x0: x - s * 0.6, x1: x + s * 0.6, y0: y - s * 0.8, y1: y });
    const show = it.at ? smooth(+it.at[0], Math.min(1, +it.at[0] + 0.06), p) * (p <= +it.at[1] + 1e-6 ? 1 : 0) : 1;
    if (show <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= show; ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    if (fn === 'wall' && /wagon/i.test(kind)) {
      // A wagon ring: small wagon blocks around the place.
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
      // Troops, riders, a convoy: a block with a small flag.
      const w = s * 0.5, col = it.color || it.top || ink; ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - w * 0.4, w, w * 0.4); ctx.strokeRect(x - w / 2, y - w * 0.4, w, w * 0.4);
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.4); ctx.lineTo(x - w / 2, y - w * 1.1); ctx.stroke(); ctx.fillRect(x - w / 2, y - w * 1.1, w * 0.35, w * 0.25);
    }
    ctx.restore();
  });
  // Places: a town is a dot with a boxed name clear of it (and of the symbols); a river or a sea is an italic name along
  // the water, no dot.
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
    // The name sits clear of its dot (LABEL_HALF of its letter size above and below its y): above the dot, else below,
    // else beside it, wherever it does not cover another name; always inside the safe area.
    const size = pl.big ? 24 : 19, half = size * LABEL_HALF, gap = r + 10 + half, w = name.length * size * 0.62 + 16;
    const tries = [1, 1.8, 2.6].flatMap((k) => [[pl.x, pl.y - gap * k], [pl.x, pl.y + gap * k], [pl.x + (r + 12) * k + w / 2, pl.y], [pl.x - (r + 12) * k - w / 2, pl.y]]).map(([x, y]) => [clamp(x, FW * SAFE + w / 2, FW * (1 - SAFE) - w / 2), clamp(y, FH * SAFE + half, FH * (1 - SAFE) - half)]);
    const box = (q) => ({ x0: q[0] - w / 2, x1: q[0] + w / 2, y0: q[1] - half, y1: q[1] + half });
    const at = tries.find((q) => clear(box(q))) || tries[0];
    boxes.push(box(at));
    FIG.label(ctx, { x: at[0], y: at[1], text: name, size });
  });
  // Route arrows grow over their window; a force on its way along an arrow (same colour, or starting at its tail) rides
  // the arrow's own curve and is always at its head; any other force glides smoothly through its keys.
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
  // Smoke and dust near the front stay behind the near figures, so they never hide who the scene is about.
  fx(live.filter((e) => (+e.y || 0) >= split));
  items.filter((it) => yOf(it) >= split).forEach((it) => drawItem(it, p, t));
  (S.items || []).filter((it) => it.heldBy).forEach((it) => drawItem(it, p, t));
  if (!inner && !S.map) devices(p, t, 'scene');
}
// A thumbnail's headline: heavy rounded letters, white with a dark outline and a drop shadow, slightly tilted; one word in
// the accent colour.
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
// ---------- Staging, once per page, before anything is drawn (no AI; the stored spec is not changed) ----------
// 1. Things that only mark an idea (a gap, a route, a target) are not drawn: a scene shows real things only.
// 2. The frame's foreground: only natural things (rocks, bushes, grass, stumps) frame the picture from the bottom corners,
//    at most FG_MAX of the frame tall; anything else placed at the very bottom moves into the middle ground.
// 3. The master shot by the film shot scale (MASTER_STD, the same table the scene prompt gives the AI): a scene drawn too
//    close (its lead person taller than the top of its shot's range, or its focal thing longer) is seen from further back,
//    the whole scene drawn smaller towards one point on the horizon (what a camera sees when it steps back), so the layout's
//    camera can frame wide, full, cowboy, medium and close shots from it. What the step back reveals at the edges is only
//    what the scene already has: the ground and sky, walls and rows and groups that ran out of the old frame, more scatter.
// 4. Room for everyone: groups get the width their members really need (measured with the kit in the chosen style) or
//    more rows, else fewer members; named people standing at one depth overlap at most NAMED_OVERLAP of their width (people
//    acting on each other may stand closer); when there is no room the less important one stands a little further back.
const ABSTRACT = /^(gap|gaps|route|routes|path|paths|direction|escape|exit|target|goal|plan|opening|breach|way|safe|zone|area|marker|spot|point|destination)(_|$|[0-9])/i;
const THINGS = ['prop', 'building', 'wall', 'tree'];
const NATURAL = ['rock', 'boulder', 'bush', 'grass', 'stump', 'log', 'reeds', 'flowers', 'fern', 'shrub', 'stones'];
const FG_MAX = 0.18, NAMED_OVERLAP = 0.25, PAIR_OVERLAP = 0.6, HOP_ROOM = 1.04;
// How close the members of a group stand (share of a member's width between neighbours): people in a body of troops
// overlap a little; horses, riders, carts and tents stand clear of each other. Rows of a group stand ROW_DEPTH of a
// member's height apart, so the rows read as rows.
const GROUP_PACK = { person: 0.8, other: 0.95 }, ROW_DEPTH = 0.28, THING_WIDE = 2.5;
const VIEW = window.__motionView || {};
const idOf = (v) => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
const PAIRS = (Array.isArray(S.pairs) ? S.pairs : Array.isArray(VIEW.pairs) ? VIEW.pairs : []).map((p) => [idOf(p[0]), idOf(p[1])]);
const paired = (a, b) => PAIRS.some((p) => (p[0] === idOf(a.id) && p[1] === idOf(b.id)) || (p[1] === idOf(a.id) && p[0] === idOf(b.id))) || a.on === b.id || b.on === a.id;
const keysOf = (it) => (Array.isArray(it.keys) ? it.keys : []);
// Things shot or thrown: they turn freely along their way and are sized against the nearest person.
const PROJECTILE = /rocket|missile|arrow|volley|bolt|thrownSpear|cannonShot|slingStone/i;
// A shot is drawn a little larger than life (with its speed lines) so the eye can follow it across the frame.
const SHOT_READABLE = 1.8;
// Single shots sized against the shooter (a volley, a rocket or a missile is sized by its distance instead).
const SHOT = /^(arrow|bolt|thrownSpear|cannonShot|slingStone|fireArrow)$/;
// A resting thing a scene sends flying across the frame is its in-flight form (arrows stuck in the ground → an arrow in
// flight, a spear lying → a thrown spear, a pile of cannonballs → a cannon shot).
const IN_FLIGHT = { arrows: 'arrow', javelin: 'thrownSpear', spear: 'thrownSpear', pilum: 'thrownSpear', cannonballs: 'cannonShot' };
const moves = (it) => keysOf(it).some((k) => isFinite(+k.x));
// A drawing's real width for its height, measured once per kind of drawing on a spare canvas with the kit of this style.
const FOOT = {}, PROBE = document.createElement('canvas');
PROBE.width = 900; PROBE.height = 520;
function footOf(it) {
  const look = it.look || {}, key = [it.fn, it.kind || '', it.mount || '', look.pose || '', look.hold || '', look.cape ? 1 : 0, look.robe ? 1 : 0, look.shield || ''].join('|');
  if (FOOT[key] != null) return FOOT[key];
  let ratio = it.mount ? mountOf(it.mount, 1).w : ASPECT[it.fn] || 1;
  try {
    const pc = PROBE.getContext('2d'), h = 200;
    pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, PROBE.width, PROBE.height);
    quiet(() => {
      if (it.mount) { const m = mountOf(it.mount, h); FIG.animal(pc, { kind: it.mount, x: 450, y: 470, h: m.h, w: m.w, facing: 1, rider: Object.assign({ pose: 'ride' }, look, { r: m.r }), noShadow: true }); }
      else if (FIG[it.fn]) FIG[it.fn](pc, Object.assign({}, look, { kind: it.kind, x: 450, y: 470, h, w: it.fn === 'person' || it.fn === 'animal' ? h * (ASPECT[it.fn] || 1) : undefined, facing: 1, noShadow: true }));
    });
    const d = pc.getImageData(0, 0, PROBE.width, PROBE.height).data;
    let lo = PROBE.width, hi = -1;
    for (let y = 60; y < 480; y += 3) for (let x = 0; x < PROBE.width; x += 2) if (d[(y * PROBE.width + x) * 4 + 3] > 40) { if (x < lo) lo = x; if (x > hi) hi = x; }
    if (hi > lo) ratio = (hi - lo) / h;
  } catch (e) {}
  return (FOOT[key] = ratio);
}
function moveDepth(it, k) {
  // Further back by factor k (< 1) towards the horizon: lower ground point closer to it, smaller drawing.
  const Y = (y) => H0 + (y - H0) * k;
  if (isFinite(+it.y)) it.y = Y(+it.y);
  if (isFinite(+it.h)) it.h = +it.h * k;
  if (isFinite(+it.w)) it.w = +it.w * k;
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
function retime() {
  const want = SCENE.time;
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
  let items = (d.items || []).filter((it) => +it.h > 0);
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
function crossing(water, bridges) {
  const site = VIEW.crossing, C = REVISE.CROSS;
  const band = site && water.find((w) => C.KINDS.indexOf(w.kind || 'river') >= 0);
  if (!band) return;
  const b0 = bridges.filter((b) => +b.y >= +band.y - 4 && +b.y <= +band.y + +band.h + 4)[0];
  if (!b0 && +band.y + +band.h < H0 + (FH - H0) * C.NEAR) return;
  const base = b0 ? +b0.y + (+b0.h || 0) : H0 + (FH - H0) * C.BASE, over = C.KINDS.indexOf(site.over) >= 0 && band.kind !== 'stream' ? site.over : band.kind || 'river';
  band.into = { x: clamp(+site.x, C.X_RANGE[0], C.X_RANGE[1]) * FW, base, wide: clamp(+site.wide, C.WIDE_RANGE[0], C.WIDE_RANGE[1]) * FW, kind: over };
  STRIP.on = band.into;
  const deck = [];
  bridges.forEach((b) => {
    const span = (+b.w || +b.h * 4) / 2, ox = +b.x;
    S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && !it.heldBy && Math.abs(+stateAt(it, 0).x - ox) < span && Math.abs(+stateAt(it, 0).y - +b.y) < Math.max(20, +b.h * 0.4)).forEach((it) => deck.push([it, b, clamp((+stateAt(it, 0).x - ox) / Math.max(1, span), -1, 1)]));
    const st = stripAt(+b.y);
    b.x = st.c; b.w = st.half * 2 * C.SPAN; b.h = Math.min(+b.h || b.w * C.BRIDGE_H, b.w * C.BRIDGE_H);
    if (site.build) b.look = Object.assign({}, b.look || {}, { build: site.build });
    b.z = +b.y;
    note('bridge', b.id);
  });
  const fighters = bridges.length && told(bridges[0], REVISE.WORDS.ON_DECK) ? S.items.filter((it) => it.fn === 'person' && !it.heldBy && !deck.some((d) => d[0] === it) && C.POSES.indexOf(String((it.look || {}).pose || '')) >= 0) : [];
  if (fighters.length && !deck.length) {
    const b = bridges[0];
    fighters.sort((u, v) => Math.abs(+u.x - +b.x) - Math.abs(+v.x - +b.x)).slice(0, C.FILE).forEach((it, k, list) => { const f = (+b.y - H0) / Math.max(1, +it.y - H0); moveDepth(it, f); deck.push([it, b, ((k + 0.5) / list.length - 0.5) * 1.5]); note('deck', it.id); });
  }
  deck.forEach(([it, b, off]) => {
    const x = +b.x + (it.group ? 0 : clamp(off, -1, 1) * (+b.w / 2) * 0.75), dx = x - +stateAt(it, 0).x, dy = +b.y + +b.h * REVISE.DECK_SINK - +stateAt(it, 0).y;
    it.x = +it.x + dx; it.y = +it.y + dy; keysOf(it).forEach((q) => { if (isFinite(+q.x)) q.x = +q.x + dx; if (isFinite(+q.y)) q.y = +q.y + dy; });
    if (it.group) { it.group.width = Math.min(+it.group.width || +b.w, +b.w * 0.7); it.group.rows = 1; }
    it.deck = b.id; it.z = +b.y + 0.005;
  });
  bridges.forEach((b) => { if (deck.some((d) => d[1] === b) && (b.look || {}).build !== 'iron' && (b.look || {}).build !== 'concrete') S.items.push({ id: b.id + '__rail', fn: 'bridge', x: b.x, y: b.y, w: b.w, h: b.h, look: b.look, railOnly: true, z: +b.y + 0.01 }); });
  outOfStrip();
}
function outOfStrip() {
  const site = VIEW.crossing, C = REVISE.CROSS, r = STRIP.on, bridges = S.items.some((it) => it.fn === 'bridge');
  if (!r) return;
  const stand = C.STAND.indexOf(r.kind) >= 0, boats = C.BOATS.indexOf(r.kind) >= 0, far = site.near === 'left' ? 'right' : 'left';
  const sideOf = (it) => { const reg = it.fn === 'person' && it.look && it.look.region; if (reg && site.sides && site.sides[reg]) return site.sides[reg]; if (it.bank) return it.bank === 'far' ? far : site.near; return told(it, REVISE.WORDS.ACROSS) ? far : null; };
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
}
const HEX = /^#[0-9a-f]{6}$/i;
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function factions() {
  const F = REVISE.FACTION, sides = {};
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
function revise() {
  retime();
  castMarks();
  varyFar();
  mergeMounts();
  heldTwins();
  trails();
  openings();
  wrecks();
  regionKinds();
  dryFlags();
  factions();
  S.devices = (S.devices || []).filter(oneDevice);
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
        const wa = +sa.h * footOf(a), wb = +sb.h * footOf(b), allow = paired(a, b) ? PAIR_OVERLAP : NAMED_OVERLAP;
        const need = (wa + wb) / 2 - allow * Math.min(wa, wb) - Math.abs(+sa.x - +sb.x);
        if (need > worst) worst = need;
      });
      if (worst <= 0.5) continue;
      moved = true;
      // Apart along their order (each half the way, inside the frame for people who stand still); no room: the less
      // important one a little further back.
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
  // 1. Only real things.
  const dropped = new Set();
  S.items = S.items.filter((it) => { const keep = !(THINGS.indexOf(it.fn) >= 0 && ABSTRACT.test(String(it.id || '')) && !it.focal && !new RegExp(REVISE.OPENING, 'i').test(String(it.id || ''))); if (!keep) dropped.add(it.id); return keep; });
  S.items = S.items.filter((it) => !(it.heldBy && dropped.has(it.heldBy)));
  revise();
  // 1b. Things in flight: a resting kind flying across the frame (no one holds it) becomes its in-flight kind.
  // An arrow leaving a crossbowman is a bolt.
  S.items.forEach((it) => {
    const ks = keysOf(it).filter((k) => isFinite(+k.x) && isFinite(+k.y));
    if (it.fn !== 'prop' || it.heldBy || it.on || ks.length < 2) return;
    const a = ks[0], b = ks[ks.length - 1];
    const to = IN_FLIGHT[it.kind];
    if (to && SIZE_STD[to] && Math.hypot(+b.x - +a.x, +b.y - +a.y) > Math.max(80, (+it.h || 20) * 3)) it.kind = to;
    if (it.kind !== 'arrow' || !SIZE_STD.bolt) return;
    const by = S.items.filter((o) => o.fn === 'person' && +o.h > 0 && isFinite(+o.x)).map((o) => { const st = stateAt(o, isFinite(+a.at) ? +a.at : 0); return { o, d: Math.hypot(+st.x - +a.x, +st.y - +(st.h || o.h) * 0.5 - +a.y) }; }).sort((p, q) => p.d - q.d)[0];
    if (by && by.d < +by.o.h * 0.8 && String((by.o.look || {}).hold || '') === 'crossbow') it.kind = 'bolt';
  });
  // 2. The frame's foreground.
  S.items.forEach((it) => {
    if (it.fn === 'person' || it.fn === 'animal' || it.mount || it.fn === 'sticker' || it.heldBy || moves(it) || it.id === S.focus || !isFinite(+it.y) || !(+it.h > 0)) return;
    if (+it.y < FH * 0.9) return;
    if (NATURAL.indexOf(it.kind) >= 0) { it.h = Math.min(+it.h, FH * FG_MAX); if (isFinite(+it.w)) it.w = Math.min(+it.w, FW * 0.3); it.__frame = true; return; }
    if (it.fn === 'wall' || it.group) return;
    // Set dressing made for the frame's edge (fg_…) that is not a natural thing is left out; anything else moves inward.
    if (/^(fg|foreground)(_|$)/i.test(String(it.id || ''))) { it.__drop = true; return; }
    const y = H0 + (FH - H0) * 0.62;
    moveDepth(it, (y - H0) / Math.max(1, +it.y - H0));
  });
  S.items = S.items.filter((it) => !it.__drop && !(it.heldBy && S.items.some((o) => o.__drop && o.id === it.heldBy)));
  // 3. The master shot.
  const people = S.items.filter((it) => it.fn === 'person' && !it.group && +it.h > 0);
  const focal = S.items.find((it) => it.id === S.focus);
  const lead = people.find((it) => it.id === S.focus) || (focal && focal.fn !== 'person' ? null : people.slice().sort((a, b) => +b.h - +a.h)[0]);
  const leadH = lead ? Math.max(+lead.h, ...keysOf(lead).map((q) => +q.h || 0)) : 0;
  // The range of this scene's shot: establishing, a room, else a wide shot leaning by the genre the server gave (S.master)
  // or the drawing style; measured against the frame's height (a portrait frame: its width times PORTRAIT_WIDTH).
  const shotOf = S.interior ? 'interior' : /establish|extreme|landscape|overhead|aerial/i.test(String((VIEW.scene || {}).shot || '')) ? 'ews' : 'ws';
  const base = FH > FW ? FW * MASTER_STD.PORTRAIT_WIDTH : FH, range = MASTER_STD.SHOTS[shotOf];
  const target = shotOf === 'ws' ? clamp(+S.master || (VIEW.profile === 'horror' ? MASTER_STD.GENRE.horror : MASTER_STD.GENRE.default), range[0], range[1]) : (range[0] + range[1]) / 2;
  // A focal thing (a ship, a plane, a building): its longest side against the frame side it lies along.
  const thingRange = MASTER_STD.THING[shotOf], thingLen = focal && focal.fn !== 'person' && +focal.h > 0 ? Math.max((+focal.w || +focal.h * (SIZE_STD[focal.kind] ? SIZE_STD[focal.kind].l / SIZE_STD[focal.kind].h : ASPECT[focal.fn] || 1)) / FW, +focal.h / FH) : 0;
  const shrink = lead ? (leadH > base * range[1] ? (base * target) / leadH : 1) : thingLen > thingRange[1] ? (thingRange[0] + thingRange[1]) / 2 / thingLen : 1;
  if (shrink < 1) {
    const s = Math.max(MASTER_STD.LEAST_SCALE, shrink), cx = FW / 2, ay = S.interior ? FH * 0.65 : H0;
    // Points inside the old frame move towards the centre; points outside it keep their distance from the old edge
    // (scaled), so who comes in from off screen still comes in from off screen.
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
        // A row that ran out of the old frame runs on to the new frame's edge, with as many members as fit at its density.
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
  // 3b. Real sizes (SIZE_STD, the table the server checks new scenes with): a thing far off its real size against a person
  // at its depth is set to it, so old scenes are right too. A long thin thing is measured along its longest drawn side.
  // A thing in the air is sized by its distance when the scene gives one, else left as drawn; it is never put down.
  if (!S.interior) {
    const ppl = S.items.filter((it) => it.fn === 'person' && +it.h > 0 && +it.y > H0 + 4).map((it) => ({ y: +it.y, h: +it.h / (it.mount ? REVISE.RIDER : 1) }));
    const ref = !ppl.length && focal && focal.fn !== 'person' && SIZE_STD[focal.kind] && +focal.h > 0 && +focal.y > H0 + 4 ? { y: +focal.y, h: +focal.h / SIZE_STD[focal.kind].h } : null;
    const near = (y) => { if (ref) return (ref.h * (y - H0)) / (ref.y - H0); const q = ppl.filter((p) => Math.abs(p.y - y) <= Math.max(24, (p.y - H0) * 0.25)).sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0]; return q ? (q.h * (y - H0)) / (q.y - H0) : undefined; };
    const leadPerson = Math.max(0, ...ppl.map((p) => p.h)) || base * target;
    const LOOSE = /^(rock|boulder|log|stump|bush|bushes|haystack|woodpile|campfire|bonfirePit|grass|reeds|flowers)$/, HOLE = new RegExp(REVISE.HOLE);
    const scaleBy = (it, f) => { it.h = +it.h * f; if (isFinite(+it.w)) it.w = +it.w * f; keysOf(it).forEach((q) => { if (isFinite(+q.h)) q.h = +q.h * f; }); };
    S.items.forEach((it) => {
      const real = it.kind && SIZE_STD[it.kind];
      if (!real || it.fn === 'person' || it.fn === 'sticker' || it.heldBy || !(+it.h > 0) || it === focal || HOLE.test(it.kind)) return;
      const air = real.place === 'air' && !/parked|launch/.test(String((it.look || {}).pose || ''));
      const shot = air && !it.dist && it.fn === 'prop' && SHOT.test(it.kind);
      const long = !air && it.fn === 'prop' && Math.max(real.h, real.l) >= REVISE.LONG * Math.min(real.h, real.l), side = (q) => (long ? Math.max(real.h, real.l) : real.h) * q;
      let want;
      if (air && !shot) want = it.dist && AIR_DIST[it.dist] ? leadPerson * real.h * AIR_DIST[it.dist] : undefined;
      else if (real.place === 'held' || shot) {
        const st = { x: isFinite(+it.x) ? +it.x : (keysOf(it)[0] || {}).x, y: isFinite(+it.y) ? +it.y : (keysOf(it)[0] || {}).y };
        const by = S.items.filter((o) => o.fn === 'person' && +o.h > 0 && isFinite(+o.x)).sort((a, b) => Math.hypot(+a.x - st.x, +a.y - st.y) - Math.hypot(+b.x - st.x, +b.y - st.y))[0];
        want = by ? side(+by.h / (by.mount ? REVISE.RIDER : 1)) * (shot ? SHOT_READABLE : 1) : undefined;
      } else { const y = isFinite(+it.y) ? +it.y : (keysOf(it)[0] || {}).y, q = isFinite(+y) && +y > H0 + 4 ? near(+y) : undefined; want = q ? side(q) : undefined; }
      if (!want) return;
      const drawn = long ? +it.h * Math.max(1, footOf(it)) : +it.h, tol = LOOSE.test(it.kind) || it.fn === 'tree' ? 2.5 : real.place === 'held' ? 1.4 : 1.6, k = drawn / want;
      if (k > tol || k < 1 / tol) scaleBy(it, want / drawn);
    });
    S.items = S.items.filter((it) => {
      const real = it.kind && SIZE_STD[it.kind];
      if (!real || it.fn === 'person' || it.fn === 'sticker' || it.heldBy || it.group || !(+it.h > 0) || HOLE.test(it.kind)) return true;
      const shot = it.fn === 'prop' && SHOT.test(it.kind), longest = shot ? +it.h * real.l / real.h : +it.h * Math.max(1, footOf(it)), M = REVISE.MIN_SIDE, least = FH * (shot ? M.SHOT : isKey(it) ? M.KEY : M.THING);
      if (longest >= least) return true;
      if (isKey(it) || shot) { scaleBy(it, least / longest); return true; }
      note('tiny', it.id);
      return false;
    });
  }
  scaleRiders();
  // 4. Room for everyone. Groups first (their width and rows), then named people apart from each other.
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
  // A thing drawn wider than THING_WIDE people standing at its depth (a fallen banner given its length as its height, a
  // plank pile as tall as a wall) is brought to that width.
  const standing = S.items.filter((it) => it.fn === 'person' && !it.mount && +it.h > 0 && +it.y > H0 + 8);
  const personAt = (y) => { const q = standing.slice().sort((a, b) => Math.abs(+a.y - y) - Math.abs(+b.y - y))[0]; return q ? (+q.h * (y - H0)) / Math.max(1, +q.y - H0) : FH * 0.3; };
  S.items.forEach((it) => {
    if (it.fn !== 'prop' || it.group || it.heldBy || !(+it.h > 0) || !isFinite(+it.y) || +it.y <= H0 + 8) return;
    const wide = +it.h * footOf(it), most = THING_WIDE * personAt(+it.y);
    if (wide > most) { const k = most / wide; it.h = +it.h * k; if (isFinite(+it.w)) it.w = +it.w * k; keysOf(it).forEach((q) => { if (isFinite(+q.h)) q.h = +q.h * k; }); }
  });
  separate();
  crowds();
  onBanks();
  if (STRIP.on) { separate(); outOfStrip(); }
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
  // Over the frame, outside the camera: the finishing light, the overlay devices placed by the current shot, a headline.
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
