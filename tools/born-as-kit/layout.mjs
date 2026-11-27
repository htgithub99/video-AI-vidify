import fs from "fs";
import { SAFE, TAG_AT, VERT } from "./vert.mjs";
const GW = JSON.parse(fs.readFileSync(new URL("./glyph_widths.json", import.meta.url), "utf8"));
const WIDE = /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uff60]/;
export const textW = (s, px, w = 900) => [...s].reduce((a, c) => a + (GW[w][c] ?? (WIDE.test(c) ? 1.02 : 0.56)), 0) * px;
export const LABEL = VERT ? { b: 54, i: 30 } : { b: 58, i: 30 };
export const labelSize = (text, sub) => ({ w: Math.max(textW(text, LABEL.b), textW(sub, LABEL.i, 800) + 6) + 16, h: LABEL.b * 1.26 + (sub ? LABEL.i * 1.18 : 0) + 8 });
export const plateSize = (text, sub, s) => ({ w: Math.max(textW(text, s), textW(sub, s * 0.52, 800)) + s * 1.44 + 8, h: s * 1.24 + (sub ? s * 0.62 : 0) + s * 0.46 + 8 });
export const camState = (keys, t0, t) => {
  const rel = t - t0;
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].t <= rel) i++;
  const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)], lin = B.t > A.t ? Math.min(1, Math.max(0, (rel - A.t) / (B.t - A.t))) : 0, u = B.ease === "power2.inOut" ? (lin < 0.5 ? 2 * lin * lin : 1 - 2 * (1 - lin) * (1 - lin)) : B.ease === "power2.out" ? 1 - (1 - lin) * (1 - lin) : lin;
  const v = (c) => { const x = c.sx - c.s * c.tx, y = c.sy - c.s * c.ty; return { s: c.s, x: Math.min(0, Math.max(1920 - 1920 * c.s, x)), y: Math.min(0, Math.max(1080 - 1080 * c.s, y)) }; };
  const a = v(A), b = v(B);
  return { s: a.s + (b.s - a.s) * u, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
};
const area = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
const offscreen = (r) => (r.r - r.l) * (r.b - r.t) - area(r, SAFE);
export const RESERVED = VERT ? { tl: { l: 0, r: 0, t: 0, b: 0 }, tr: { l: 0, r: 0, t: 0, b: 0 } } : { tl: { l: 60, r: 620, t: 70, b: 210 }, tr: { l: 1300, r: 1890, t: 30, b: 210 } };
export const FACE_PAD = 0.3;
const LABEL_POS = { AIM_OUT: 30, AIM_DOWN: 12, DX: VERT ? [0, 40, -40, 80, -80] : [90, -90, 120, -120, 150, -150, 190, -190, 240, -240], DY: [-70, -95, -120, -150, 70, 110], ARROW_MIN: 110, ARROW_MAX: 240, PER_PX: 6, PATH_N: 6, START: 0.8, BEND: 0.1 };
export const scoreRect = (r, sprites, extra = [], bodyW = 4) => {
  let sc = offscreen(r) * 400;
  for (const p of sprites) {
    const f0 = p.fb || { l: p.l, r: p.r, t: p.t, b: p.t + (p.b - p.t) * 0.25 }, m = Math.max(f0.r - f0.l, f0.b - f0.t) * FACE_PAD;
    const f = { l: f0.l - m, r: f0.r + m, t: f0.t - m, b: f0.b + m * 0.3 };
    sc += area(r, f) * 10 + Math.max(0, area(r, p) - area(r, f)) * (p.soft ? 0.3 : bodyW);
  }
  for (const e of extra) sc += area(r, e) * 12;
  return sc;
};
const toS = (q, c, o) => q && { l: c.x + c.s * (q.l + o), r: c.x + c.s * (q.r + o), t: c.y + c.s * q.t, b: c.y + c.s * q.b };
const BUST_NAME = /_b(_r|_l|_talk)?$/;
const bustParts = (b) => (BUST_NAME.test(b.n || "") && b.fb ? [{ ...b, l: b.fb.l - (b.fb.r - b.fb.l) * 0.15, r: b.fb.r + (b.fb.r - b.fb.l) * 0.15, b: b.fb.b }, { ...b, t: b.fb.b, fb: null }] : [b]);
export const spriteRects = (boxes, c, off = () => 0) => boxes.flatMap(bustParts).map((b) => { const o = off(b.grp); return { ...toS(b, c, o), fb: toS(b.fb, c, o), soft: b.soft }; });
export const checkActors = (boxes, id) => {
  const act = boxes.filter((b) => b.actor);
  const errs = [];
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
    const a = act[i], b = act[j], ov = Math.min(a.r, b.r) - Math.max(a.l, b.l), wmin = Math.min(a.r - a.l, b.r - b.l);
    if (ov > wmin * 0.2 && !(a.allow || b.allow)) errs.push(`${id}: ${a.n} và ${b.n} chồng lên nhau ${Math.round((ov / wmin) * 100)}%`);
  }
  return errs;
};
export const textJs = (s, { camAt, MV, MOVES, hud }) => {
  let js = "";
  const off = (g, u) => { const m = MV[g]; return m ? m.dx * Math.min(1, Math.max(0, (u - m.t) / m.dur)) : 0; };
  const rectsAt = (u) => (s.boxes ? spriteRects(s.boxes, camAt(s, u), (g) => off(g, u)) : []);
  const placed = [];
  const reserved = [];
  const tagRect = (corner, w, h) => { const [cx, cy] = TAG_AT[corner] || TAG_AT.tl; return { l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 }; };
  for (const g of s.tags || []) {
    const [k, text, sub, t, pref] = g, sz = plateSize(text, sub, 52);
    const cands = VERT ? ["tl", "bl"] : [pref, pref === "tl" ? "tr" : "tl"].filter((c) => !(c === "tr" && s.series));
    const best = cands.map((c, i) => ({ c, sc: scoreRect(tagRect(c, sz.w, sz.h), rectsAt(t + 0.3)) + scoreRect(tagRect(c, sz.w, sz.h), rectsAt(s.t1 - 0.05)) + i * 500 })).sort((a, b) => a.sc - b.sc)[0];
    const rr = tagRect(best.c, sz.w, sz.h);
    placed.push(rr);
    js += `{const e=BORN.tag(${hud},{id:'${s.id}${k}',text:'${text}',sub:'${sub}',corner:'${best.c}'});BORN.plateIn(tl,e,${t});}`;
  }
  if (s.series) reserved.push(RESERVED.tr);
  const camEl = `document.getElementById('${s.id}t')`;
  const root = (P, k, follow) => {
    const base = follow ? `(()=>{const f=document.createElement('div');f.className='ba';${camEl}.appendChild(f);${MOVES[follow]}return f;})()` : camEl;
    return `BORN.anchor(${base},${P[0]},${P[1]},${(1 / k).toFixed(4)})`;
  };
  const evalRect = (anchorW, follow, t, end, mk) => {
    let sc = 0;
    for (const u of [t + 0.35, (t + end) / 2, end - 0.05]) {
      const c = camAt(s, u), c0 = camAt(s, t), z = c.s / c0.s;
      const ax = c.x + c.s * (anchorW[0] + (follow ? off(follow, u) : 0)), ay = c.y + c.s * anchorW[1];
      sc += scoreRect(mk(ax, ay, z), rectsAt(u), [...placed, ...reserved]);
    }
    return sc;
  };
  const faceNear = (P) => (s.boxes || []).filter((b) => b.fb && !b.grp?.startsWith?.("x")).map((b) => ({ b, d: Math.hypot(Math.max(b.fb.l - P[0], 0, P[0] - b.fb.r), Math.max(b.fb.t - P[1], 0, P[1] - b.fb.b)) })).filter((q) => q.d < 90).sort((a, c) => a.d - c.d)[0]?.b.fb;
  const GAP = 30;
  const aim = (to, fb, dx, dy) => (!fb ? to : dx > 20 ? [fb.r + LABEL_POS.AIM_OUT, dy > 0 ? fb.b : (fb.top ?? fb.t) + LABEL_POS.AIM_DOWN] : dx < -20 ? [fb.l - LABEL_POS.AIM_OUT, dy > 0 ? fb.b : (fb.top ?? fb.t) + LABEL_POS.AIM_DOWN] : dy < 0 ? [(fb.l + fb.r) / 2, Math.min(fb.t, fb.top ?? fb.t) - GAP] : [(fb.l + fb.r) / 2, fb.b + GAP]);
  const startAt = (bx, ex, ey) => { const w = bx.r - bx.l, vert = ey > bx.b || ey < bx.t; return [vert ? (ex > bx.r ? bx.l + w * LABEL_POS.START : ex < bx.l ? bx.r - w * LABEL_POS.START : Math.min(bx.r - 20, Math.max(bx.l + 20, ex))) : ex > (bx.l + bx.r) / 2 ? bx.r + 8 : bx.l - 8, ey > bx.b ? bx.b + 14 : ey < bx.t ? bx.t - 14 : (bx.t + bx.b) / 2]; };
  for (const [k, text, sub, t, to0, side, follow] of s.labels || []) {
    const hit = typeof to0 === "string" ? (s.boxes || []).find((b) => b.n === to0) : null, ref = hit ? hit.fb || { l: hit.l, r: hit.r, t: hit.t, b: hit.b } : null;
    const own = typeof to0 === "string" ? (s.boxes || []).find((x) => x.n === to0) : (s.boxes || []).find((x) => x.fb === faceNear(to0));
    const fb0 = ref || faceNear(to0), fb = fb0 && own ? { ...fb0, top: own.t } : fb0, to = ref ? [(ref.l + ref.r) / 2, (ref.t + ref.b) / 2] : to0;
    const end = Math.min(s.t1, s.labelOut || s.t1), sz = labelSize(text, sub), c0 = camAt(s, t);
    const cands = [];
    const zoom = fb && fb.b - fb.t < 220 ? Math.min(3, Math.max(1, ((fb.r - fb.l) * c0.s) / 110)) : 1;
    for (const dx of LABEL_POS.DX) for (const dy of LABEL_POS.DY) cands.push({ dx: Math.round(dx * zoom), dy: Math.round(dy * zoom) });
    const mk = (dx, dy) => (ax, ay, z) => { const X = ax + dx * z, Y = ay + dy * z, w = sz.w * z, h = sz.h * z, l = dx > 20 ? X : dx < -20 ? X - w : X - w / 2, tp = dy > 0 ? Y : Y - h; return { l, r: l + w, t: tp, b: tp + h }; };
    const pref = (q) => (side === "left" && q.dx > 0) || (side === "right" && q.dx < 0) ? 2500 : 0;
    const arrowCost = (q) => {
      const ax = c0.x + c0.s * (q.tp[0] + (follow ? off(follow, t) : 0)), ay = c0.y + c0.s * q.tp[1], bx = mk(q.dx, q.dy)(ax, ay, 1);
      const [sx, sy] = startAt(bx, ax, ay), cx = sx + (ax - sx) * LABEL_POS.BEND, cy = ay, rs = rectsAt(t + 0.35);
      const L = Math.hypot(ax - sx, ay - sy);
      let c = L * LABEL_POS.PER_PX + (L < LABEL_POS.ARROW_MIN ? (LABEL_POS.ARROW_MIN - L) * 80 : L > LABEL_POS.ARROW_MAX * zoom ? (L - LABEL_POS.ARROW_MAX * zoom) * 120 : 0);
      for (let k = 1; k <= LABEL_POS.PATH_N; k++) { const u = k / 10, px = (1 - u) * (1 - u) * sx + 2 * u * (1 - u) * cx + u * u * ax, py = (1 - u) * (1 - u) * sy + 2 * u * (1 - u) * cy + u * u * ay; c += scoreRect({ l: px - 9, r: px + 9, t: py - 9, b: py + 9 }, rs) * 2; }
      return c;
    };
    const stop = fb ? 0 : GAP;
    for (const q of cands) q.tp = aim(to, fb, q.dx, q.dy);
    const best = cands.map((q) => ({ ...q, sc: arrowCost(q) + evalRect(q.tp, follow, t, end, mk(q.dx, q.dy)) + (q.dx === 0 && !VERT ? 400 : 0) + (q.dy > 0 ? 700 : 0) + pref(q) })).sort((a, b) => a.sc - b.sc)[0];
    { const ax = c0.x + c0.s * (best.tp[0] + (follow ? off(follow, t) : 0)), ay = c0.y + c0.s * best.tp[1]; placed.push(mk(best.dx, best.dy)(ax, ay, 1)); }
    js += `{const l=BORN.label(${root(best.tp, c0.s, follow)},{id:'${s.id}${k}',text:'${text}',sub:'${sub}',to:[${best.tp.map(Math.round)}],dx:${best.dx},dy:${best.dy},w:${Math.round(sz.w)},h:${Math.round(sz.h)},stop:${stop}});BORN.labelIn(tl,l,${t});${s.labelOut ? `BORN.out(tl,l,${s.labelOut});` : ""}}`;
  }
  for (const [k, text, sub, t, P0, T, size = 56] of s.plates || []) {
    const c0 = camAt(s, t), sz = plateSize(text, sub, size), end = s.t1;
    if (!T) {
      const fixedAt = (q) => ({ l: q[0] - sz.w / 2, r: q[0] + sz.w / 2, t: q[1] - sz.h / 2, b: q[1] + sz.h / 2 });
      const P1 = [c0.x + c0.s * P0[0], c0.y + c0.s * P0[1]], cands = [P1];
      if (size < 100) for (let x = VERT ? 760 : 240; x <= (VERT ? 1160 : 1680); x += 80) for (let y = VERT ? 260 : 160; y <= (VERT ? 600 : 360); y += 40) cands.push([Math.min(Math.max(x, SAFE.l + sz.w / 2), SAFE.r - sz.w / 2), y]);
      const best = cands.map((q, i) => ({ q, sc: ((n) => Array.from({ length: n }, (_, j) => t + 0.2 + ((end - t - 0.25) * j) / (n - 1)))(Math.max(3, Math.ceil((end - t) / 0.25))).reduce((a, u) => a + scoreRect(fixedAt(q), rectsAt(u), [...placed, ...reserved], 8), 0) + (i ? Math.hypot(q[0] - P1[0], q[1] - P1[1]) * 6 : 0) })).sort((a, b) => a.sc - b.sc)[0].q;
      placed.push(fixedAt(best));
      js += `{const e=BORN.plate(${hud},{id:'${s.id}${k}',text:'${text}',sub:'${sub}',x:${Math.round(best[0])},y:${Math.round(best[1])},size:${size},rot:${best[0] < 960 ? -3 : 3}});BORN.plateIn(tl,e,${t});}`;
      continue;
    }
    const mk = (ax, ay, z) => ({ l: ax - (sz.w * z) / 2, r: ax + (sz.w * z) / 2, t: ay - (sz.h * z) / 2, b: ay + (sz.h * z) / 2 });
    const ps = [c0.x + c0.s * P0[0], c0.y + c0.s * P0[1]];
    const cands = [ps];
    if (size < 100) for (let x = 260; x <= 1660; x += 100) for (let y = 230; y <= (T ? 760 : 420); y += (T ? 70 : 40)) cands.push([x, y]);
    const tS = T ? [c0.x + c0.s * T[0], c0.y + c0.s * T[1]] : null;
    const best = cands.map((q, i) => {
      const W0 = [(q[0] - c0.x) / c0.s, (q[1] - c0.y) / c0.s];
      let sc = evalRect(W0, null, t, end, mk) + (i ? Math.hypot(q[0] - ps[0], q[1] - ps[1]) * 15 : 0);
      if (tS) { const L = Math.hypot(q[0] - tS[0], q[1] - tS[1]); const ux = Math.abs(q[0] - tS[0]) / (L || 1), uy = Math.abs(q[1] - tS[1]) / (L || 1), E = L - Math.min(ux ? sz.w / 2 / ux : 1e9, uy ? sz.h / 2 / uy : 1e9); sc += E < 110 ? (110 - E) * 300 : E > 230 ? (E - 230) * 300 : 0; }
      return { W0, sc };
    }).sort((a, b) => a.sc - b.sc)[0];
    const P = best.W0;
    placed.push(mk(c0.x + c0.s * P[0], c0.y + c0.s * P[1], 1));
    const loc = T ? [Math.round(P[0] + (T[0] - P[0]) * c0.s), Math.round(P[1] + (T[1] - P[1]) * c0.s)] : null;
    js += `{const e=BORN.plate(${root(P, c0.s)},{id:'${s.id}${k}',text:'${text}',sub:'${sub}',x:${Math.round(P[0])},y:${Math.round(P[1])},size:${size},rot:${P[0] < 960 ? -3 : 3}${loc ? `,tail:[${loc}]` : ""}});BORN.plateIn(tl,e,${t});}`;
  }
  for (const [k, text, t, , T] of s.bubbles || []) {
    const c0 = camAt(s, t), w = textW(text, 50, 800) + 92, h = 50 * 1.15 + 50 * 0.68 + 12, end = s.t1;
    const mk = (dx, dy) => (ax, ay, z) => ({ l: ax + (dx - w / 2) * z, r: ax + (dx + w / 2) * z, t: ay + (dy - h / 2) * z, b: ay + (dy + h / 2) * z });
    const cands = [];
    for (const dx of [-520, -420, -320, -220, 220, 320, 420, 520]) for (const dy of [-60, -130, -200, -270]) cands.push({ dx, dy });
    const best = cands.map((q) => ({ ...q, sc: evalRect(T, null, t, end, mk(q.dx, q.dy)) + Math.abs(q.dy) * 3 })).sort((a, b) => a.sc - b.sc)[0];
    placed.push(mk(best.dx, best.dy)(c0.x + c0.s * T[0], c0.y + c0.s * T[1], 1));
    js += `{const b=BORN.bubble(${root(T, c0.s)},{id:'${s.id}${k}',text:'${text}',x:${Math.round(T[0] + best.dx)},y:${Math.round(T[1] + best.dy)},tail:[${T.map(Math.round)}]});BORN.bubbleIn(tl,b,${t});}`;
  }
  return js;
};
