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
function drawOne(it, st, o, t, first) {
  if (it.mount) {
    const fix = null, ml = st.mount || it.mountLook || {};
    const rider = Object.assign({ pose: 'ride' }, o, { mark: undefined, x: undefined, y: undefined, h: undefined, w: undefined });
    const hh = o.h, ww = hh * 1.35;
    const r = FIG.animal(ctx, Object.assign({ mark: o.mark, kind: fix ? fix[0] : it.mount, x: o.x, y: o.y, h: hh, w: ww, facing: o.facing, seed: o.seed, pose: st.moving ? 'run' : 'stand', distance: st.moving ? o.distance : undefined, rider }, fix ? fix[1] : {}, ml, fix ? { kind: fix[0] } : {}));
    return r && r.rider ? Object.assign({ box: r.box }, r.rider) : r;
  }
  if (it.fn === 'bridge') return FIG.bridge(ctx, Object.assign({}, o, { w: +it.w || +st.w || o.h * ASPECT.bridge, build: o.build || undefined }));
  if (it.fn === 'wall' || WALLS.indexOf(it.kind) >= 0) {
    const a = isFinite(+it.from) ? +it.from : o.x - (o.w || o.h * 3) / 2, b = isFinite(+it.to) ? +it.to : o.x + (o.w || o.h * 3) / 2;
    // The open stretches ("gaps": a breach, an opening in a wagon fort) split the wall into pieces drawn one by one.
    let pieces = [[Math.min(a, b), Math.max(a, b)]];
    (Array.isArray(it.gaps) ? it.gaps : []).forEach((g) => { pieces = pieces.flatMap(([l, r]) => (+g[1] <= l || +g[0] >= r ? [[l, r]] : [[l, +g[0]], [+g[1], r]].filter(([u, v]) => v - u > 2))); });
    let res = null;
    pieces.forEach(([lo, hi], k) => { const q = wallPiece(it, Object.assign({}, o, { mark: k ? undefined : o.mark }), lo, hi); res = res || q; });
    return res;
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
    const o = Object.assign({}, look, { mark: m.i ? undefined : it.id, x: m.x, y: m.y, h: h * m.s, w: +st.w > 0 || it.fn === 'person' || it.fn === 'animal' || it.mount ? w * m.s : undefined, facing, seed: 3 + m.i * 5 + it.id.length, distance: st.distance + ((m.i * 0.618) % 1) * 1.3 * h * m.s });
    if (it.kind) o.kind = it.kind;
    if ((it.fn === 'person' || it.fn === 'animal') && st.moving && (!o.pose || o.pose === 'stand' || o.pose === 'walk')) o.pose = o.pose === 'walk' ? 'walk' : 'run';
    if (seat && it.fn === 'person') { o.pose = o.pose || 'sit'; o.y = seat.y + hipDrop(o) + seat.h * 0.06; }
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
const OVERLAY = ['thought', 'inset', 'count', 'time'], OVERLAY_MAX = 2, TITLE_SAFE = 0.05;
const LONG_HELD = /spear|lance|pike|halberd|banner|flag|pole|staff|bow|crossbow|musket|rifle|sword|axe|torch|oar|scythe|pitchfork/i;
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
      const from = head && head[0] > 0 && head[0] < FW && head[1] > 0 && head[1] < FH ? head : undefined;
      FIG.device(ctx, { kind: 'thought', x, y, r, from, appear }, () => { quiet(() => (d.items || []).forEach((it) => drawItem(Object.assign({}, it, { x: x + (+it.x || 0), y: y + (it.y != null ? +it.y : r * 0.45), keys: undefined }), p, t))); });
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
    if (d.kind === 'spotlight') { const s = who ? [who.x, who.y - who.h * 0.5] : at; FIG.device(ctx, { kind: 'spotlight', x: s[0], y: s[1], r: who ? who.h * 0.8 : r }); return; }
    if (d.kind === 'count') { FIG.device(ctx, { kind: 'count', x: clamp(+d.x || 60, FW * TITLE_SAFE, FW * 0.6), y: clamp(+d.y || 60, FH * TITLE_SAFE, FH * 0.6), w: Math.min(+d.w || 320, FW * 0.4), h: Math.min(+d.h || 140, FH * 0.3), groups: d.groups || [], appear }); return; }
    if (d.kind === 'time') { FIG.device(ctx, { kind: 'time', x: +d.x || FW / 2, y: +d.y || FH * 0.28, r: Math.min(+d.r || 220, FH * 0.35), body: d.body || 'sun', progress: p }); return; }
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
// 3. The master shot: a scene drawn too close (the lead taller than MASTER.LIMIT of the frame) is seen from further back,
//    the whole scene drawn smaller towards one point on the horizon (what a camera sees when it steps back), so the layout's
//    camera can frame wide, full, cowboy, medium and close shots from it. What the step back reveals at the edges is only
//    what the scene already has: the ground and sky, walls and rows and groups that ran out of the old frame, more scatter.
// 4. Room for everyone: groups get the width their members really need (measured with the kit in the chosen style) or
//    more rows, else fewer members; named people standing at one depth overlap at most NAMED_OVERLAP of their width (people
//    acting on each other may stand closer); when there is no room the less important one stands a little further back.
const ABSTRACT = /^(gap|gaps|route|routes|path|paths|direction|escape|exit|target|goal|plan|opening|breach|way|safe|zone|area|marker|spot|point|destination)(_|$|[0-9])/i;
const THINGS = ['prop', 'building', 'wall', 'tree'];
const NATURAL = ['rock', 'boulder', 'bush', 'grass', 'stump', 'log', 'reeds', 'flowers', 'fern', 'shrub', 'stones'];
const FG_MAX = 0.18, MASTER = { LIMIT: 0.45, TARGET: 0.4, LEAST: 0.55 }, NAMED_OVERLAP = 0.25, PAIR_OVERLAP = 0.6, HOP_ROOM = 1.04;
// How close the members of a group stand (share of a member's width between neighbours): people in a body of troops
// overlap a little; horses, riders, carts and tents stand clear of each other. Rows of a group stand ROW_DEPTH of a
// member's height apart, so the rows read as rows.
const GROUP_PACK = { person: 0.8, other: 0.95 }, ROW_DEPTH = 0.28, THING_WIDE = 2.5;
const VIEW = window.__motionView || {};
const idOf = (v) => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
const PAIRS = (Array.isArray(S.pairs) ? S.pairs : Array.isArray(VIEW.pairs) ? VIEW.pairs : []).map((p) => [idOf(p[0]), idOf(p[1])]);
const paired = (a, b) => PAIRS.some((p) => (p[0] === idOf(a.id) && p[1] === idOf(b.id)) || (p[1] === idOf(a.id) && p[0] === idOf(b.id))) || a.on === b.id || b.on === a.id;
const keysOf = (it) => (Array.isArray(it.keys) ? it.keys : []);
const moves = (it) => keysOf(it).some((k) => isFinite(+k.x));
// A drawing's real width for its height, measured once per kind of drawing on a spare canvas with the kit of this style.
const FOOT = {}, PROBE = document.createElement('canvas');
PROBE.width = 900; PROBE.height = 520;
function footOf(it) {
  const look = it.look || {}, key = [it.fn, it.kind || '', it.mount || '', look.pose || '', look.hold || '', look.cape ? 1 : 0, look.robe ? 1 : 0, look.shield || ''].join('|');
  if (FOOT[key] != null) return FOOT[key];
  let ratio = (ASPECT[it.fn] || 1) * (it.mount ? 1.35 : 1);
  try {
    const pc = PROBE.getContext('2d'), h = 200;
    pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, PROBE.width, PROBE.height);
    quiet(() => {
      if (it.mount) FIG.animal(pc, { kind: it.mount, x: 450, y: 470, h, w: h * 1.35, facing: 1, rider: Object.assign({ pose: 'ride' }, look), noShadow: true });
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
function stage() {
  if (S.map || !Array.isArray(S.items)) return;
  // 1. Only real things.
  const dropped = new Set();
  S.items = S.items.filter((it) => { const keep = !(THINGS.indexOf(it.fn) >= 0 && ABSTRACT.test(String(it.id || '')) && !it.focal); if (!keep) dropped.add(it.id); return keep; });
  S.items = S.items.filter((it) => !(it.heldBy && dropped.has(it.heldBy)));
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
  const lead = people.find((it) => it.id === S.focus) || people.slice().sort((a, b) => +b.h - +a.h)[0];
  const leadH = lead ? Math.max(+lead.h, ...keysOf(lead).map((q) => +q.h || 0)) : 0;
  if (lead && leadH > FH * MASTER.LIMIT) {
    const s = Math.max(MASTER.LEAST, (FH * MASTER.TARGET) / leadH), cx = FW / 2, ay = S.interior ? FH * 0.65 : H0;
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
  const named = S.items.filter((it) => (it.fn === 'person' || it.fn === 'animal') && !it.group && !it.on && !it.heldBy && +it.h > 0 && isFinite(+it.x));
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
  paint(p, t, false);
  if (!S.map) devices(p, t, 'final');
  // Over the frame, outside the camera: the finishing light, the overlay devices placed by the current shot, a headline.
  const T = ctx.getTransform(), hk = window.__motionViewHooks;
  ctx.restore();
  if (hk) hk.screen++;
  try {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate((width - FW * sc) / 2, (height - FH * sc) / 2); ctx.scale(sc, sc);
    const B = ctx.getTransform(), BI = B.inverse(), zoom = Math.hypot(T.a, T.b) / Math.max(1e-6, Math.hypot(B.a, B.b));
    const toFrame = (x, y) => { const q = BI.transformPoint(T.transformPoint(new DOMPoint(x, y))); return [q.x, q.y]; };
    if (!S.map) { finish(); devices(p, t, 'over', toFrame, zoom); }
    if (S.headline) headline(S.headline);
    ctx.restore();
  } finally { if (hk) hk.screen--; }
  if (S.header) FIG.header(ctx, { text: S.header });
} };
if (!window.__MOTION_HOST__) { const t0 = performance.now(), loop = (now) => { const d = 10, tt = ((now - t0) / 1000) % d; window.motionScene.renderAt({ time: tt, progress: tt / d, duration: d, width: window.innerWidth || FW, height: window.innerHeight || FH }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

})();`;
