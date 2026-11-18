// The scene engine: draws a scene spec (window.__motionSpec) with the figure table and the kit, in whatever drawing style
// is chosen. Added to every scene page when it is shown (motionHtmlFigures), so a fix here reaches every scene at once.
export const MOTION_SCENE_ENGINE = String.raw`(function () {
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
const ASPECT = { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1, sticker: 1 };
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
  (S.water || []).forEach((w, i) => { if (!isFinite(+w.y)) return; K.scenery(ctx, { kind: w.kind || 'river', x: FW / 2, y: +w.y + (+w.h || 60) / 2, width: (FW + 120), height: +w.h || 60, r: (+w.h || 60) / 2, seed: i + 1, t }); });
  (S.scatter || []).forEach((s, j) => {
    const area = Array.isArray(s.area) ? s.area : [0, H0 + 8, FW, FH];
    for (let i = 0; i < (s.count || 0); i++) {
      const k = rnd(29 + j, i), y = area[1] + (area[3] - area[1]) * k * k, x = area[0] + rnd(31 + j, i) * (area[2] - area[0]), r = 4 + 34 * ((y - H0) / (FH - H0));
      if (s.kind === 'stuckArrow') { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + rnd(37, i) * 0.6); ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 1.4); ctx.stroke(); ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.moveTo(0, -r * 1.4); ctx.lineTo(-r * 0.18, -r * 1.15); ctx.lineTo(0, -r * 1.22); ctx.lineTo(r * 0.18, -r * 1.15); ctx.closePath(); ctx.fill(); ctx.restore(); continue; }
      K.scenery(ctx, { kind: s.kind, x, y, r, seed: i + j * 7, t });
    }
  });
}
const RES = {};
const SPARE = document.createElement('canvas').getContext('2d');
const quiet = (f) => { const mk = window.motionMark; window.motionMark = null; try { return f(); } finally { window.motionMark = mk; } };
const hipDrop = (o) => { const r = quiet(() => FIG.person(SPARE, Object.assign({}, o, { mark: undefined, y: 1000 }))); return r && isFinite(r.hip) ? 1000 - r.hip : 0; };
// Kinds that are walls drawn along a length: from/to give the length (at least two pieces long for a wagon fort).
const WALLS = ['wall', 'palisade', 'fence', 'wagonFort', 'gate', 'sandbags', 'barbedWire'];
function drawOne(it, st, o, t, first) {
  if (it.mount) {
    const fix = null, ml = st.mount || it.mountLook || {};
    const rider = Object.assign({ pose: 'ride' }, o, { mark: undefined, x: undefined, y: undefined, h: undefined, w: undefined });
    const hh = o.h, ww = hh * 1.35;
    const r = FIG.animal(ctx, Object.assign({ mark: o.mark, kind: fix ? fix[0] : it.mount, x: o.x, y: o.y, h: hh, w: ww, facing: o.facing, seed: o.seed, pose: st.moving ? 'run' : 'stand', distance: st.moving ? o.distance : undefined, rider }, fix ? fix[1] : {}, ml, fix ? { kind: fix[0] } : {}));
    return r && r.rider ? Object.assign({ box: r.box }, r.rider) : r;
  }
  if (it.fn === 'wall' || WALLS.indexOf(it.kind) >= 0) {
    const a = isFinite(+it.from) ? +it.from : o.x - (o.w || o.h * 3) / 2, b = isFinite(+it.to) ? +it.to : o.x + (o.w || o.h * 3) / 2;
    const len = Math.abs(b - a), mid = (a + b) / 2, lo = Math.min(a, b);
    // The span is kept exactly (it may leave an opening next to it); a wagon fort too short for two wagons is single wagons.
    if (it.kind === 'wagonFort' && len < o.h * 3.4) {
      const n = Math.max(1, Math.round(len / (o.h * 1.7))), each = len / n;
      let r = null;
      for (let i = 0; i < n; i++) { const q = FIG.vehicle(ctx, Object.assign({}, o, { kind: 'wagon', x: lo + each * (i + 0.5), w: undefined, mark: i ? undefined : o.mark })); r = r || q; }
      return r;
    }
    return FIG.wall(ctx, Object.assign({}, o, { kind: it.kind || 'wall', x: mid, w: Math.max(len, o.h) }));
  }
  const res = FIG[it.fn] ? FIG[it.fn](ctx, o) : null;
  if (it.burning && res && res.box) K.effect(ctx, { kind: 'burning', x: res.box.x + res.box.w / 2, y: res.box.y + res.box.h * 0.35, r: res.box.h * 0.5, t, seed: 1 });
  return res;
}
function drawItem(it, p, t) {
  const st = stateAt(it, p);
  if (it.fn === 'sticker') return drawSticker(it, st, p, t);
  if (!isFinite(+st.x) || !isFinite(+st.y) || !(+st.h > 0)) return;
  if (it.at && (p < it.at[0] || p > it.at[1])) return;
  const look = Object.assign({}, st);
  ['x', 'y', 'h', 'w', 'facing', 'moving', 'distance', 'mount'].forEach((k) => delete look[k]);
  let x = +st.x, y = +st.y;
  const h = +st.h, w = +st.w || h * (ASPECT[it.fn] || 1) * (it.mount ? 1.35 : 1), facing = (+st.facing || 1) < 0 ? -1 : 1;
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
  members.forEach((m) => {
    const o = Object.assign({}, look, { mark: m.i ? undefined : it.id, x: m.x, y: m.y, h: h * m.s, w: +st.w > 0 || it.fn === 'person' || it.fn === 'animal' || it.mount ? w * m.s : undefined, facing, seed: 3 + m.i * 5 + it.id.length, distance: st.distance + m.i * 13 });
    if (it.kind) o.kind = it.kind;
    if ((it.fn === 'person' || it.fn === 'animal') && st.moving && (!o.pose || o.pose === 'stand' || o.pose === 'walk')) o.pose = o.pose === 'walk' ? 'walk' : 'run';
    if (seat && it.fn === 'person') { o.pose = o.pose || 'sit'; o.y = seat.y + hipDrop(o) + seat.h * 0.06; }
    const r = drawOne(it, st, o, t, !m.i);
    if (!m.i) RES[it.id] = Object.assign({ x: o.x, y: o.y, h: o.h, w: o.w, facing }, r || {});
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
// Devices: signs, bubbles, close-ups, bursts, rings, streaks, counts, the sun's arc and the spotlight, all through the
// figure table's own device drawings; a bubble's picture is library things drawn small inside it.
function devices(p, t, final) {
  (S.devices || []).forEach((d, i) => {
    if (d.at && (p < d.at[0] || p > d.at[1])) return;
    if ((d.kind === 'spotlight') !== !!final) return;
    const appear = d.at ? smooth(d.at[0], d.at[0] + 0.06, p) : 1, who = d.of && RES[d.of];
    const head = who && who.head ? who.head : who ? [who.x, who.y - who.h * 0.9] : null;
    if (d.kind === 'emote') { if (!head) return; const r = Math.max(14, (who.h || 200) * 0.08); FIG.device(ctx, { kind: 'emote', sign: d.sign || 'alarm', x: head[0] + r * 0.4, y: head[1] - (who.h || 200) * 0.16, r, appear }); return; }
    if (d.kind === 'thought') {
      const r = +d.r || 100, x = +d.x || (head ? head[0] + r * 1.2 : FW / 2), y = +d.y || (head ? head[1] - r * 1.4 : FH * 0.28);
      FIG.device(ctx, { kind: 'thought', x, y, r, from: head || undefined, appear }, () => { quiet(() => (d.items || []).forEach((it) => drawItem(Object.assign({}, it, { x: x + (+it.x || 0), y: y + (it.y != null ? +it.y : r * 0.45), keys: undefined }), p, t))); });
      return;
    }
    if (d.kind === 'inset') {
      if (!who) return;
      const pt = d.part === 'head' ? who.head : d.part === 'body' ? [who.x, who.y - who.h * 0.5] : who.hand || who.head;
      if (!pt) return;
      const r = +d.r || 120, z = +d.zoom || 3, x = +d.x || FW * 0.8, y = +d.y || FH * 0.25;
      FIG.device(ctx, { kind: 'inset', x, y, r, from: pt, appear }, (c) => { c.save(); c.translate(x, y); c.scale(z, z); c.translate(-pt[0], -pt[1]); quiet(() => paint(p, t, true)); c.restore(); });
      return;
    }
    const at = who ? [who.x, who.y - who.h * 0.6] : [+d.x || FW / 2, +d.y || FH / 2];
    const r = +d.r || (who ? who.h * 0.35 : 60);
    if (d.kind === 'speed') { if (!who) return; FIG.device(ctx, { kind: 'speed', x: who.x - (who.facing || 1) * (who.w || who.h * 0.5) * 0.5, y: who.y - who.h * 0.45, r: who.h * 0.4, facing: who.facing || 1, t }); return; }
    if (d.kind === 'spotlight') { const s = who ? [who.x, who.y - who.h * 0.5] : at; FIG.device(ctx, { kind: 'spotlight', x: s[0], y: s[1], r: who ? who.h * 0.8 : r }); return; }
    if (d.kind === 'count') { FIG.device(ctx, { kind: 'count', x: +d.x || 60, y: +d.y || 60, w: +d.w || 320, h: +d.h || 140, groups: d.groups || [], appear }); return; }
    if (d.kind === 'time') { FIG.device(ctx, { kind: 'time', x: +d.x || FW / 2, y: +d.y || FH * 0.28, r: +d.r || 220, body: d.body || 'sun', progress: p }); return; }
    FIG.device(ctx, { kind: d.kind, x: at[0], y: at[1], r, facing: d.facing || (who && who.facing) || 1, t, appear });
  });
}
const LABEL_HALF = 0.95;
// A map: parchment, land and water outlines, rivers, places, moving force tokens and growing route arrows.
function chart(p, t) {
  const M = S.map, paper = M.paper || '#e6d6b0';
  ctx.fillStyle = paper; ctx.fillRect(-20, -20, (FW + 40), (FH + 40));
  ctx.save(); ctx.strokeStyle = 'rgba(90,70,40,0.12)'; ctx.lineWidth = 1;
  for (let g = 0; g < (FW + 20); g += 80) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, FH); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, g * 0.5625); ctx.lineTo(FW, g * 0.5625); ctx.stroke(); }
  ctx.restore();
  const path = (pts, closed) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); if (closed) ctx.closePath(); };
  (M.water || []).forEach((pts) => { path(pts, true); ctx.fillStyle = '#b7cdd2'; ctx.fill(); ctx.strokeStyle = 'rgba(60,80,90,0.6)'; ctx.lineWidth = 2.5; ctx.stroke(); });
  (M.land || []).forEach((pts) => { path(pts, true); ctx.fillStyle = mix(paper, '#c9b98c', 0.6); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,35,0.75)'; ctx.lineWidth = 3; ctx.stroke(); });
  (M.rivers || []).forEach((pts) => { path(pts, false); ctx.strokeStyle = 'rgba(70,100,120,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); });
  (M.places || []).forEach((pl) => {
    const r = pl.big ? 9 : 6;
    ctx.beginPath(); ctx.arc(pl.x, pl.y, r, 0, Math.PI * 2); ctx.fillStyle = '#3a2f26'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = paper; ctx.stroke();
    // The name sits clear of its dot: the label is drawn around its y, about LABEL_HALF of its letter size above and
    // below, so its lower edge stays a small gap above the dot (below it when there is no room at the top of the frame).
    const size = pl.big ? 24 : 19, half = size * LABEL_HALF, gap = r + 10 + half;
    FIG.label(ctx, { x: pl.x, y: pl.y - gap - half * 2 < FH * 0.03 ? pl.y + gap : pl.y - gap, text: pl.name, size });
  });
  (M.arrows || []).forEach((a, i) => {
    const k = a.at ? smooth(a.at[0], a.at[1], p) : smooth(0.1, 0.85, p);
    if (k <= 0.01) return;
    const len = Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]) || 1;
    FIG.arrow(ctx, { from: a.from, to: a.to, curve: (+a.curve || 0) * len, width: 9, color: a.color || '#8a2f26', grow: k });
  });
  (M.forces || []).forEach((f) => {
    const st = stateAt({ x: f.x, y: f.y, keys: f.keys }, p), r = +f.size || 20;
    ctx.beginPath(); ctx.arc(st.x, st.y, r, 0, Math.PI * 2); ctx.fillStyle = f.color || '#8a2f26'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2a2522'; ctx.stroke();
    if (window.motionMark) window.motionMark(ctx, f.id, st.x - r, st.y - r, 2 * r, 2 * r);
  });
}
function paint(p, t, inner) {
  if (S.map) return chart(p, t);
  if (S.interior) room(); else backdrop(t);
  const items = order(p), far = H0 + (FH - H0) * 0.22, split = isFinite(+(S.haze && S.haze.frontOf)) ? +S.haze.frontOf : H0 + (FH - H0) * 0.55;
  const yOf = (it) => +stateAt(it, p).y || 0, fx = (list) => { if (FX) effects(list, p, t); };
  fx((S.effects || []).filter((e) => (+e.y || 0) < far));
  items.filter((it) => yOf(it) < far).forEach((it) => drawItem(it, p, t));
  if (!S.interior) veil();
  fx((S.effects || []).filter((e) => (+e.y || 0) >= far && (+e.y || 0) < split));
  items.filter((it) => yOf(it) >= far && yOf(it) < split).forEach((it) => drawItem(it, p, t));
  if (FX) haze(p, t);
  // Smoke and dust near the front stay behind the near figures, so they never hide who the scene is about.
  fx((S.effects || []).filter((e) => (+e.y || 0) >= split));
  items.filter((it) => yOf(it) >= split).forEach((it) => drawItem(it, p, t));
  (S.items || []).filter((it) => it.heldBy).forEach((it) => drawItem(it, p, t));
  if (!inner) devices(p, t, false);
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
  paint(p, t, false);
  if (!S.map) { devices(p, t, true); finish(); }
  if (S.headline) headline(S.headline);
  ctx.restore();
  if (S.header) FIG.header(ctx, { text: S.header });
} };
if (!window.__MOTION_HOST__) { const t0 = performance.now(), loop = (now) => { const d = 10, tt = ((now - t0) / 1000) % d; window.motionScene.renderAt({ time: tt, progress: tt / d, duration: d, width: window.innerWidth || FW, height: window.innerHeight || FH }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

})();`;
