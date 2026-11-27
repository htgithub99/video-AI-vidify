import fs from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const KIT = path.dirname(fileURLToPath(import.meta.url));
const [planFile, jobDir] = process.argv.slice(2);
const { sp, box, spriteDefs, takeBoxes, tagBox, markGroup, FACEMAP, pngUsed, load } = await import(pathToFileURL(path.join(KIT, "sprites.mjs")).href);
const { camState, textJs, checkActors, plateSize, textW } = await import(pathToFileURL(path.join(KIT, "layout.mjs")).href);
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const { direct } = await import(pathToFileURL(path.join(KIT, "born_direct.mjs")).href);
const { VERT, VIEW, TAG_AT, SAFE } = await import(pathToFileURL(path.join(KIT, "vert.mjs")).href);
const { lookEvents, punchCam, AMB } = await import(pathToFileURL(path.join(KIT, "looks.mjs")).href);
const VERT_CSS = `#root{width:1080px!important;height:1920px!important}#stage{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;transform-origin:0 0;transform:translateX(${-((VIEW.l + VIEW.r) / 2) * VIEW.k + 540}px) scale(${VIEW.k})}#ovl,#ovt{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:60;pointer-events:none}.bl-t b{font-size:54px!important;-webkit-text-stroke:10px #16100c!important}.bl-t i{font-size:30px!important}`;
const FIXRAW = process.env.BORN_FIX ? JSON.parse(fs.readFileSync(process.env.BORN_FIX, "utf8")) : {};
const FIX = new Map(Array.isArray(FIXRAW) ? FIXRAW.map((id) => [id, ["tag", "wide"]]) : Object.entries(FIXRAW));
const sameScene = (a, b) => a.kind === "scene" && b.kind === "scene" && !a.roll && !b.roll && !a.endCard && !b.endCard && a.bg === b.bg && !!a.bust === !!b.bust && !!a.blur === !!b.blur && !!a.warm === !!b.warm && (a.actors || []).length === (b.actors || []).length && (a.actors || []).every((x, i) => x.sprite === b.actors[i].sprite && !x.shift && !b.actors[i].shift && Math.abs(x.h - b.actors[i].h) < 1);
const joinMove = (m, n) => (!m ? n : !n ? m : { ...m, dx: m.dx + n.dx, dur: n.t + n.dur - m.t });
const TEXT_T = { tags: 3, labels: 3, plates: 3, bubbles: 2 };
const mergeRuns = (list) => {
  const out = [];
  for (const s of list) {
    const a = out.at(-1);
    if (!a || !sameScene(a, s)) { out.push({ ...s, actors: (s.actors || []).map((x) => ({ ...x })) }); continue; }
    a.actors.forEach((x, i) => { x.move = joinMove(x.move, s.actors[i].move); });
    a.part = (a.part || 0) + 1;
    const rename = new Map();
    for (const [k, ti] of Object.entries(TEXT_T)) {
      const add = (s[k] || []).map((x, j) => { rename.set(x[0], `${x[0]}${a.part}${j}`); return [`${x[0]}${a.part}${j}`, ...x.slice(1)]; });
      if (add.length) a.outs = [...(a.outs || []), ...(a[k] || []).map((x) => [x[0], add[0][ti]])];
      a[k] = [...(a[k] || []), ...add];
    }
    for (const k of ["icons", "swaps"]) a[k] = [...(a[k] || []), ...(s[k] || [])];
    if (s.outs?.length) a.outs = [...(a.outs || []), ...s.outs.map(([k, t]) => [rename.get(k) ?? k, t])];
    for (const k of ["focusOn", "flash", "glowAt", "smoke"]) if (a[k] === undefined && s[k] !== undefined) a[k] = s[k];
    if ((s.dark || 0) !== (a.darkSteps?.at(-1)?.[1] ?? a.dark ?? 0)) a.darkSteps = [...(a.darkSteps || [[a.t0, a.dark || 0]]), [s.t0, s.dark || 0]];
    a.merged = true;
  }
  return Object.assign(out, { report: list.report });
};
const BUST_LIFT = 110;
const lift = (a, n) => (box(n, a.x, a.y, a.h).b <= VIEW.b ? { ...a, y: a.y - BUST_LIFT } : a);
const liftBust = (s) => (VERT && s.bust && !s.blur && !(s.plates || []).some((p) => p[5]) ? { ...s, actors: (s.actors || []).map((a) => lift(a, a.sprite)), swaps: (s.swaps || []).map((w) => lift(w, w.to)) } : s);
const merged = mergeRuns(plan.beats ? direct(plan) : plan.shots);
const planShots = Object.assign(merged.map(liftBust), { report: merged.report });
const CAST = {};
const TOTAL = plan.total;
const safe = (s) => String(s ?? "").replace(/'/g, "’").replace(/[\\`$]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s+/g, " ").trim();
const up = (s) => safe(String(s ?? "").toLocaleUpperCase("vi"));
const PAPER_W = VERT ? 540 : 1640;
const OVT_OUT = 2.6;
const LAYER = { BG: [0.25, 0.25] };
const STEP = { ZOOM: 0.1, ZOOM2: 0.05, WIDE: 0.7, PULL: 0.6, PULL_MAX: 0, DUR: 0.8, MIN_DUR: 0.45, MIN_LEAD: 0.2, MIN_TAIL: 0.3, EARLY: 0.75, GAP: 0.9, HOLD: 0.15, DEFAULT_AT: 0.3, CENTER: 1, SY: VERT ? 640 : 520, FACE_DROP: 40, GROUP_Y: 0.35, LINE_EPS: 0.3, MID: 540, S_MAX: 1.4, EASE: "power2.inOut" };
const VERT_TITLE_END = 2.8;
const END_Y = { VERT: 240, WIDE: 190 };
const ICON = { H: 220, W: 380, GAP: 80, HAIR: 0.55, LIFT: 95, Y: 470, RAIL: 0.38 };
const VISIT = { AHEAD: VERT ? 40 : 130, DUR_IN: 1.0, DUR_OUT: 0.6, LEAD: 0.45, DUR: 0.7, HOLD: 1.6, AFTER: 0.3, LABEL_HOLD: 1.1, LABEL_Z: VERT ? 1.12 : 1.35, ICON_Z: VERT ? 1.25 : 1.55, FACE_DROP: 60, OUT: 0.25, STEP: 1 / 15 };
const DRIFT = { DARK_FADE: 0.8, RATE: 0.012, PUNCH: 0.03, PEAK: 0.16, BACK: 0.5, MIN_TAIL: 0.3, IN: "power2.out" };
const r3 = (v) => Math.round(v * 1000) / 1000;
const EVENT = { FLAP: 0.15, FADE: 0.12, SLIDE: 140, ROT: 6, SLIDE_DUR: 0.18 };
const SOFT = { SIGMA: 9, DIM: 0.88 };
const FX = {
  dust: { n: 26, size: [2, 5], color: "rgba(235,220,190,.55)", dx: [-60, 60], dy: [-40, -120], dur: [7, 12], blur: 0.4 },
  embers: { n: 18, size: [2, 4], color: "rgba(255,150,70,.6)", dx: [-40, 40], dy: [-220, -420], dur: [5, 9], blur: 0.6 },
  motes: { n: 22, size: [3, 6], color: "rgba(255,226,160,.45)", dx: [-30, 30], dy: [-60, -140], dur: [8, 14], blur: 1.5 },
  petals: { n: 12, size: [8, 12], color: "rgba(246,190,205,.7)", dx: [120, 260], dy: [260, 520], dur: [7, 11], blur: 0, petal: true },
  fog: { n: 5, size: [520, 820], color: "rgba(210,215,225,.08)", dx: [180, 320], dy: [-20, 20], dur: [20, 30], blur: 40, fog: true },
  ash: { n: 24, size: [2, 4], color: "rgba(205,205,205,.45)", dx: [-50, 50], dy: [60, 160], dur: [8, 13], blur: 0.5 },
};
const PAPER_BIG = 1.6;
const PAPER_OPTICAL = 0.92;
const PAPER_STAMP_GAP = 150;
const PAPER_LEAD = 0.15;
const DEFS = `<defs><radialGradient id="shd"><stop offset="0" stop-color="#120a06" stop-opacity=".4"/><stop offset=".55" stop-color="#120a06" stop-opacity=".3"/><stop offset="1" stop-color="#120a06" stop-opacity="0"/></radialGradient></defs>`;
const TAG_MAX_W = 600;
const fitPlate = (text, sub, size) => {
  let z = size;
  while (z > 34 && plateSize(text, sub, z).w > (VERT ? 520 : 860)) z -= 2;
  return z;
};
const shots = [];
const warns = [];
const MV = {};
const MOVES = {};
const groupOf = (inner, id) => {
  markGroup(id);
  return `<g id="${id}">${inner}</g>`;
};
const mvJs = (id, dx, dur, t, bob) => {
  MV[id] = { dx, dur, t };
  MOVES[id] = `tl.fromTo(f,{x:0},{x:${dx},duration:${dur},ease:'none'},${t});`;
  return `tl.fromTo('#${id}',{x:0},{x:${dx},duration:${dur.toFixed(3)},ease:'none'},${t.toFixed(3)});` + (bob ? `tl.fromTo('#${id}',{y:0},{y:${-bob},duration:.18,yoyo:true,repeat:${Math.max(1, Math.floor(dur / 0.18))},ease:'sine.inOut'},${t.toFixed(3)});` : "");
};
const spread = (actors) => {
  const solid = actors.filter((a) => !a.crowd && !a.allow && !a.noBox);
  const width = (a) => {
    const b = box(a.sprite, a.x, a.y, a.h);
    return b.r - b.l;
  };
  solid.sort((a, b) => a.x - b.x);
  for (let i = 1; i < solid.length; i++) {
    const a = solid[i - 1], b = solid[i];
    const need = (width(a) + width(b)) / 2 - Math.min(width(a), width(b)) * 0.15;
    if (b.x - a.x < need) b.x = a.x + need;
  }
  const over = solid.length ? Math.max(0, ...solid.map((a) => a.x + width(a) / 2 - 1880)) : 0;
  if (over) for (const a of solid) a.x = Math.max(40 + width(a) / 2, a.x - over);
};
for (const s of planShots) {
  const o = { outs: s.outs || [], actorMoves: Object.fromEntries((s.actors || []).filter((a) => a.move?.dx).map((a) => [a.sprite, a.move])), darkSteps: s.darkSteps, merged: !!s.merged, icons: (s.icons || []).map((x) => [x[0], x[1], x[2], up(x[3]), x[4]]), id: s.id, t0: s.t0, kind: s.kind || "scene", bg: s.bg, blur: !!s.blur, bust: !!s.bust, soft: !!s.soft, subject: s.subject || null, shiftT: (s.actors || []).find((x) => x.shift)?.shift.t, mover: (s.actors || []).find((x) => x.move?.dx && (x.sprite === s.subject || !s.subject))?.move, cam: (s.cam?.length ? s.cam : [{ t: 0, s: 1, x: 960, y: 540 }]).map((c) => ({ t: c.t, s: c.s, tx: c.x, ty: c.y, sx: c.sx ?? 960, sy: c.sy ?? 540, ease: c.ease })), tags: (s.tags || []).map((g) => [g[0], up(g[1]), up(g[2]), g[3], g[4]]), labels: (s.labels || []).filter((l) => !VERT || l[3] >= VERT_TITLE_END).map((l) => [l[0], up(l[1]), up(l[2]), l[3], l[4], l[5]]), plates: s.endCard ? [] : (s.plates || []).map((p) => [p[0], up(p[1]), up(p[2]), p[3], p[4], p[5] ?? null, fitPlate(up(p[1]), up(p[2]), p[6] || 56)]), roll: s.roll, bubbles: (s.bubbles || []).map((b) => [b[0], safe(b[1]), b[2], null, b[4]]), glowAt: s.glowAt, focusOn: s.focusOn, labelOut: s.labelOut, dark: s.dark, warm: s.warm, cool: s.cool, smoke: s.smoke, focusAt: s.focus, flashAt: s.flash, bar: s.bar, series: s.series && plan.series ? safe(plan.series) : "", rew: s.rew, paper: s.paper, montage: s.montage, chapter: s.chapter, endCard: s.endCard, moves: "" };
  const wide = o.tags.filter((g) => plateSize(g[1], g[2], 52).w > TAG_MAX_W);
  if (wide.length) {
    o.tags = o.tags.filter((g) => !wide.includes(g));
    o.plates.push(...wide.map((g) => [g[0], g[1], g[2], g[3], [960, 150], null, fitPlate(g[1], g[2], 52)]));
  }
  if (FIX.has(o.id)) {
    const acts = FIX.get(o.id);
    if (acts.includes("tag")) {
      const short = o.labels.filter((l) => l[1].length <= 18);
      o.tags.push(...short.map((l) => [l[0], l[1], l[2], l[3], o.tags.some((g) => g[4] === "tl") ? "tr" : "tl"]));
      o.plates.push(...o.labels.filter((l) => l[1].length > 18).map((l) => [l[0], l[1], l[2], l[3], [960, 200], null, fitPlate(l[1], l[2], 50)]));
      o.labels = [];
      o.plates = o.plates.map((p) => [...p.slice(0, 5), null, p[6]]);
    }
    if (acts.includes("drop_text")) {
      o.labels = [];
      o.plates = [];
      o.bubbles = [];
    }
    if (acts.includes("wide")) {
      o.cam = [{ t: 0, s: 1, tx: 960, ty: 540, sx: 960, sy: 540 }, { t: 4, s: 1.06, tx: 960, ty: 520, sx: 960, sy: 540 }];
      o.focusOn = null;
    }
    const drop = acts.filter((a) => a.startsWith("drop:")).map((a) => a.slice(5));
    if (drop.length) {
      s.actors = (s.actors || []).filter((a) => !drop.includes(a.sprite));
      const lost = o.labels.filter((l) => drop.includes(l[4]));
      o.tags.push(...lost.map((l) => [l[0], l[1], l[2], l[3], o.tags.some((g) => g[4] === "tl") ? "tr" : "tl"]));
      o.labels = o.labels.filter((l) => !drop.includes(l[4]));
      if (o.focusOn && drop.includes(o.focusOn.sprite)) o.focusOn = null;
    }
    const flip = acts.filter((a) => a.startsWith("flip:")).map((a) => a.slice(5));
    s.actors = (s.actors || []).map((a) => (flip.includes(a.sprite) ? { ...a, dir: a.dir === "l" ? "r" : "l", move: undefined } : a));
    if (acts.includes("apart")) s.apart = true;
  }

  if (o.kind === "scene") {
    const actors = (s.actors || []).map((a) => ({ ...a }));
    if (!plan.beats || s.apart) spread(actors);
    CAST[s.id] = [...actors].sort((a, b) => a.x - b.x).map((a) => a.sprite);
    let svg = "";
    actors.forEach((a, i) => {
      const dir = a.move?.dx ? (a.move.dx > 0 ? "r" : "l") : a.dir;
      const swaps = (s.swaps || []).filter((w) => w.from === a.sprite);
      let one = sp(a.sprite, a.x, a.y, a.h, { ...(dir ? { dir } : {}), crowd: !!a.crowd, allow: !!a.allow, noBox: !!a.noBox, shadow: a.shadow !== false, anchorX: a.anchorX ?? 0.5 });
      if (swaps.length) {
        if (!a.noBox) tagBox({ vis: [-Infinity, swaps[0].t] });
        one = `<g id="${s.id}a${i}p">${one}</g>` + swaps.map((w, k) => { const html = sp(w.to, w.x, w.y, w.h, { ...(dir ? { dir } : {}), allow: true, shadow: false, anchorX: w.anchorX ?? 0.5 }); tagBox({ vis: [w.t, swaps[k + 1]?.t ?? Infinity] }); return `<g id="${s.id}a${i}w${k}" style="opacity:0">${html}</g>`; }).join("");
        o.moves += swaps.map((w, k) => `tl.set('#${s.id}a${i}${k ? `w${k - 1}` : "p"}',{opacity:0},${w.t});tl.set('#${s.id}a${i}w${k}',{opacity:1},${w.t});tl.fromTo('#${s.id}a${i}w${k}',{y:14},{y:0,duration:.25,ease:'back.out(2)',immediateRender:false},${w.t});`).join("");
      }
      if (a.talk) {
        const alt = sp(a.talk.alt, a.x, a.y, a.h, { ...(dir ? { dir } : {}), allow: true, noBox: true, shadow: false, anchorX: a.anchorX ?? 0.5 });
        one = `<g id="${s.id}a${i}t0">${one}</g><g id="${s.id}a${i}t1" style="opacity:0">${alt}</g>`;
        for (let t = a.talk.from, k = 0; t < a.talk.to; t += EVENT.FLAP, k++) o.moves += `tl.set('#${s.id}a${i}t0',{opacity:${k % 2 ? 1 : 0}},${t.toFixed(3)});tl.set('#${s.id}a${i}t1',{opacity:${k % 2 ? 0 : 1}},${t.toFixed(3)});`;
        o.moves += `tl.set('#${s.id}a${i}t0',{opacity:1},${a.talk.to.toFixed(3)});tl.set('#${s.id}a${i}t1',{opacity:0},${a.talk.to.toFixed(3)});`;
      }
      if (a.enter) {
        const gid = `${s.id}a${i}e`;
        one = `<g id="${gid}" style="opacity:0">${one}</g>`;
        const t = a.enter.t.toFixed(3);
        o.moves += a.enter.kind === "slide" ? `tl.fromTo('#${gid}',{opacity:0,x:${EVENT.SLIDE * (a.enter.from || 1)},rotation:${EVENT.ROT}},{opacity:1,x:0,rotation:0,duration:${EVENT.SLIDE_DUR},ease:'back.out(1.6)',svgOrigin:'${a.x} ${a.y - a.h / 2}',immediateRender:false},${t});tl.set('#${gid}',{opacity:0},${s.t0});` : `tl.fromTo('#${gid}',{opacity:0},{opacity:1,duration:${EVENT.FADE},ease:'none',immediateRender:false},${t});tl.set('#${gid}',{opacity:0},${s.t0});`
      }
      if (a.shift) {
        const gid = `${s.id}a${i}s`;
        one = groupOf(one, gid);
        MV[gid] = { dx: a.shift.dx, dur: a.shift.dur, t: a.shift.t };
        MOVES[gid] = `tl.fromTo(f,{x:0},{x:${a.shift.dx},duration:${a.shift.dur},ease:'power2.inOut'},${a.shift.t.toFixed(3)});`;
        o.moves += `tl.fromTo('#${gid}',{x:0},{x:${a.shift.dx},duration:${a.shift.dur},ease:'power2.inOut',immediateRender:false},${a.shift.t.toFixed(3)});`;
        o.labels = o.labels.map((l) => (l[4] === a.sprite ? [...l.slice(0, 6), gid] : l));
      }
      if (a.move?.dx) {
        const gid = `${s.id}a${i}m`;
        svg += groupOf(one, gid);
        o.moves += mvJs(gid, a.move.dx, a.move.dur, a.move.t, a.move.bob ?? 5);
        o.labels = o.labels.map((l) => (l[4] === a.sprite ? [...l.slice(0, 6), gid] : l));
      } else svg += one;
    });
    o.svg = svg;
    o.boxes = takeBoxes();
    warns.push(...checkActors(o.boxes, s.id));
  }
  shots.push(o);
}
for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : TOTAL;
const LOOK = lookEvents(plan, shots);
const layerKeys = (keys, [k, p], b = keys[0]) => keys.map((c) => ({ ...c, s: b.s * Math.pow(c.s / b.s, k), tx: b.tx + (c.tx - b.tx) * p, ty: b.ty + (c.ty - b.ty) * p }));
const focusOf = (s, name) => {
  const people = (s.boxes || []).filter((x) => x.fb && !x.soft && !x.crowd);
  if (!s.bust && people.length > 1) {
    const l = Math.min(...people.map((x) => x.l)), r = Math.max(...people.map((x) => x.r)), t = Math.min(...people.map((x) => x.t)), b = Math.max(...people.map((x) => x.b));
    return [(l + r) / 2, t + (b - t) * STEP.GROUP_Y];
  }
  const b = (s.boxes || []).find((x) => x.n === name) || (s.boxes || []).find((x) => x.actor) || (s.boxes || [])[0];
  if (!b) return null;
  return b.fb ? [(b.fb.l + b.fb.r) / 2, (b.fb.t + b.fb.b) / 2 + STEP.FACE_DROP] : [(b.l + b.r) / 2, (b.t + b.b) / 2];
};
const syOf = (s) => ((s.boxes || []).some((b) => b.fb && !b.soft) ? STEP.SY : STEP.MID);
const stepKeys = (s) => {
  const d = s.t1 - s.t0, f0 = VERT && !s.cont ? focusOf(s, s.subject) : null, k0 = f0 ? { ...s.cam[0], tx: f0[0], ty: f0[1], sx: 960, sy: syOf(s) } : s.cam[0], pull = s.cam[s.cam.length - 1].s < k0.s - 1e-3;
  const marks = [...(s.labels || []).map((l) => [l[3], typeof l[4] === "string" ? l[4] : null]), ...(s.focusOn ? [[s.focusOn.t, s.focusOn.sprite]] : []), ...(s.plates || []).map((p) => [p[3], null]), ...(s.tags || []).map((g) => [g[3], null])]
    .filter(([t]) => t > s.t0 + STEP.MIN_LEAD && t < Math.min(s.t1 - STEP.MIN_TAIL, (s.shiftT ?? Infinity) - STEP.DUR))
    .sort((a, b) => a[0] - b[0]);
  const first = marks[0] || [Math.min(s.t0 + d * STEP.DEFAULT_AT, (s.shiftT ?? Infinity) - STEP.DUR), null];
  const keys = [{ ...k0, t: 0, ease: undefined }];
  let cur = k0, at = Math.max(STEP.MIN_LEAD, first[0] - s.t0 - STEP.EARLY);
  const steps = [first];
  steps.forEach(([, name], n) => {
    const f = focusOf(s, name || s.subject) || [cur.tx, cur.ty];
    const dur = Math.max(STEP.MIN_DUR, Math.min(STEP.DUR, d - at - STEP.MIN_TAIL));
    if (dur <= STEP.MIN_DUR * 0.5) return;
    const z = (n || s.cont ? STEP.ZOOM2 : STEP.ZOOM) * (pull ? -STEP.PULL : 1) * (s.bust ? 1 : STEP.WIDE);
    keys.push({ ...cur, t: r3(at), ease: undefined });
    cur = { ...cur, t: r3(at + dur), s: r3(Math.min(Math.max(cur.s, STEP.S_MAX), cur.s * (1 + z))), tx: r3(cur.tx + (f[0] - cur.tx) * STEP.CENTER), ty: r3(cur.ty + (f[1] - cur.ty) * STEP.CENTER), sx: 960, sy: syOf(s), ease: STEP.EASE };
    keys.push(cur);
    at = Math.max(at + dur + STEP.HOLD, (steps[n + 1]?.[0] ?? 0) - s.t0 - STEP.EARLY);
  });
  keys.push({ ...cur, t: r3(d), ease: undefined });
  return keys.filter((k, i) => i === 0 || k.t > keys[i - 1].t - 1e-6);
};
const trackKeys = (s, m) => {
  const k0 = s.cam[0], f = focusOf(s, s.subject) || [k0.tx, k0.ty], d = s.t1 - s.t0, a = Math.max(0, m.t - s.t0), e = Math.min(d, a + m.dur);
  const start = { ...k0, t: 0, tx: f[0], ty: f[1], sx: 960, sy: syOf(s), ease: undefined };
  const keys = [start, { ...start, t: r3(a) }, { ...start, t: r3(e), tx: r3(f[0] + m.dx * ((e - a) / m.dur)), s: r3(s.cont ? k0.s : k0.s * (1 + STEP.ZOOM2)), ease: "none" }];
  if (e < d) keys.push({ ...keys[2], t: r3(d), ease: undefined });
  return keys.filter((k, i) => i === 0 || k.t > keys[i - 1].t);
};
const lineStarts = (plan.words || []).map((w) => w[0]?.[0] ?? 0);
const lineOf = (t) => lineStarts.reduce((n, a, i) => (t >= a - STEP.LINE_EPS ? i : n), -1);
const movedLines = new Set();
const holdKeys = (s) => { const k = s.cont ? s.cam[0] : stepKeys(s).at(-1); return [{ ...k, t: 0, ease: undefined }, { ...k, t: r3(s.t1 - s.t0), ease: undefined }]; };
const sceneKey = (s) => `${s.bg}|${s.bust}|${(s.boxes || []).map((b) => b.n).sort().join(",")}`;
const camShot = (s) => s.kind === "scene" && s.cam?.length && !s.roll;
shots.forEach((s, i) => { const n = shots[i + 1]; s.runNext = !!(n && camShot(s) && camShot(n) && sceneKey(s) === sceneKey(n) && !s.mover && !n.mover); });
const beatsOf = (s) => [...(s.icons || []).map((x) => x[1]), ...(s.plates || []).map((p) => p[3]), ...(s.labels || []).map((l) => l[3]), ...(s.tags || []).map((g) => g[3])].filter((t) => t > s.t0 && t < s.t1 - DRIFT.MIN_TAIL).sort((a, b) => a - b);
const driftKeys = (s) => {
  const d = s.t1 - s.t0, f = focusOf(s, s.subject), k0 = s.cont ? s.cam[0] : { ...s.cam[0], tx: f?.[0] ?? s.cam[0].tx, ty: f?.[1] ?? s.cam[0].ty, sx: 960, sy: syOf(s) };
  const at = (t) => ({ ...k0, t: r3(t), s: r3(Math.min(STEP.S_MAX, k0.s * (1 + DRIFT.RATE * t))), ease: undefined });
  const keys = [at(0)];
  for (const te of beatsOf(s)) {
    const u = te - s.t0;
    if (u <= keys.at(-1).t + DRIFT.PEAK) continue;
    keys.push(at(u), { ...at(u + DRIFT.PEAK), s: r3(at(u + DRIFT.PEAK).s * (1 + DRIFT.PUNCH)), ease: DRIFT.IN });
    keys.push({ ...at(Math.min(d, u + DRIFT.PEAK + DRIFT.BACK)), ease: STEP.EASE });
  }
  if (keys.at(-1).t < d) keys.push(at(d));
  return keys.filter((k, i) => i === 0 || k.t > keys[i - 1].t);
};
const lineEnds = (plan.words || []).map((w) => w.at(-1)?.[1] ?? 0);
const lineEndAt = (t) => { const i = lineOf(t); return i >= 0 ? lineEnds[i] : t + VISIT.HOLD; };
const ease2 = (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));
const placeIcons = (s) => {
  const list = s.icons || [], sb = (s.boxes || []).find((b) => b.n === s.subject) || (s.boxes || [])[0];
  const fb = sb?.fb || { l: 900, r: 1020 }, top = sb ? sb.t + (sb.b - sb.t) * ICON.RAIL : ICON.Y;
  s.iconBoxes = list.map(([n, t, side, , cross, held], k) => {
    const { meta } = load(n), sc = Math.min(ICON.H / meta.h, ICON.W / meta.w), w = Math.round(meta.w * sc), h = Math.round(meta.h * sc);
    const nx = list[k + 1]?.[1], end = Math.min(s.t1, nx !== undefined ? nx - VISIT.LEAD : lineEndAt(t) + VISIT.AFTER);
    return { n, t, side, cross, held, w, h, end, x: side === "r" ? fb.r + (fb.r - fb.l) * ICON.HAIR + ICON.GAP + w / 2 : fb.l - (fb.r - fb.l) * ICON.HAIR - ICON.GAP - w / 2, y: top - ICON.LIFT - h / 2 };
  });
};
const movedAt = (s, name, u) => { const m = s.actorMoves?.[name]; return m ? m.dx * Math.min(1, Math.max(0, (s.t0 + u - m.t) / m.dur)) : 0; };
const visitsOf = (s) => {
  const v = (s.iconBoxes || []).filter((b) => !b.held).map((b) => ({ a: b.t - s.t0 - VISIT.LEAD, b: b.end - s.t0, z: VISIT.ICON_Z, pt: () => [b.x, b.y] }));
  if (!s.bust) for (const l of s.labels || []) {
    const box = typeof l[4] === "string" && (s.boxes || []).find((b) => b.n === l[4] && b.fb);
    if (!box) continue;
    const a = l[3] - s.t0 - VISIT.LEAD;
    v.push({ moving: !!s.actorMoves?.[box.n], a, b: Math.min(s.t1 - s.t0, l[3] - s.t0 + VISIT.LABEL_HOLD), z: VISIT.LABEL_Z, pt: (u) => [(box.fb.l + box.fb.r) / 2 + movedAt(s, box.n, u), (box.fb.t + box.fb.b) / 2 + VISIT.FACE_DROP] });
  }
  return v.filter((x) => x.b > x.a + VISIT.DUR).sort((p, q) => p.a - q.a);
};
const easeSine = (p) => (1 - Math.cos(Math.PI * p)) / 2;
const visitKeys = (s, visits) => {
  const d = s.t1 - s.t0, f = focusOf(s, s.subject) || [s.cam[0].tx, s.cam[0].ty], s0 = s.cam[0].s, m = s.mover;
  const lead = visits.find((v) => v.moving), dir = Math.sign(m?.dx || 0);
  const ahead = (u) => (lead ? dir * VISIT.AHEAD * easeSine(Math.min(1, Math.max(0, (u - lead.a) / VISIT.DUR_IN))) : 0);
  const base = (u) => ({ s: m ? s0 : s0 * (1 + DRIFT.RATE * u), tx: (lead ? lead.pt(u)[0] : f[0] + (m ? m.dx * Math.min(1, Math.max(0, (s.t0 + u - m.t) / m.dur)) : 0)) + ahead(u), ty: f[1] });
  const way = [{ at: 0, W: base }];
  visits.forEach((v, i) => {
    const from = way.at(-1), dur = from.W === base ? VISIT.DUR_IN : VISIT.DUR, fn = from.W === base ? easeSine : ease2;
    way.push({ at: Math.max(from.at + from.dur || 0, v.a), dur, fn, W: (u) => { const [x, y] = v.pt(u); return { s: base(u).s * v.z, tx: x + ahead(u), ty: y }; } });
    const nx = visits[i + 1];
    if (!nx || nx.a > v.b + VISIT.DUR) way.push({ at: Math.max(way.at(-1).at + way.at(-1).dur, v.b), dur: VISIT.DUR_OUT, fn: ease2, W: base });
  });
  const at = (u) => {
    let i = 0;
    while (i + 1 < way.length && way[i + 1].at <= u) i++;
    const cur = way[i].W(u);
    if (i === 0 || u >= way[i].at + way[i].dur) return cur;
    const p = way[i].fn((u - way[i].at) / way[i].dur), prv = way[i - 1].W(u);
    return { s: prv.s * Math.pow(cur.s / prv.s, p), tx: prv.tx + (cur.tx - prv.tx) * p, ty: prv.ty + (cur.ty - prv.ty) * p };
  };
  const keys = [];
  for (let u = 0; u < d; u += VISIT.STEP) { const c = at(u); keys.push({ ...s.cam[0], t: r3(u), s: r3(c.s), tx: r3(c.tx), ty: r3(c.ty), sx: 960, sy: syOf(s), ease: undefined }); }
  const c = at(d);
  keys.push({ ...s.cam[0], t: r3(d), s: r3(c.s), tx: r3(c.tx), ty: r3(c.ty), sx: 960, sy: syOf(s), ease: undefined });
  return keys;
};
let prevShot = null;
for (const s of shots) {
  if (!camShot(s)) { if (s.cam?.length > 1) movedLines.add(lineOf(s.t0)); prevShot = null; continue; }
  if (prevShot && prevShot.runNext && Math.abs(prevShot.t1 - s.t0) < 1e-3) {
    const e = prevShot.cam.at(-1);
    s.cam = [{ ...s.cam[0], s: e.s, tx: e.tx, ty: e.ty, sx: e.sx, sy: e.sy }, ...s.cam.slice(1)];
    s.cont = true;
  }
  const prior = prevShot;
  prevShot = s;
  const line = lineOf(s.t0), moved = movedLines.has(line);
  placeIcons(s);
  const visits = visitsOf(s);
  if (visits.length) s.focusOn = null;
  s.cam = visits.length ? visitKeys(s, visits) : s.mover ? trackKeys(s, s.mover) : s.cont || s.runNext || s.merged ? driftKeys(s) : moved ? holdKeys(s) : stepKeys(s);
  if (moved) s.accent = s.accent && { ...s.accent, still: true };
  else movedLines.add(line);
  s.layerBase = s.cont && prior?.layerBase ? prior.layerBase : s.cam[0];
  if (s.bust && s.svg) s.bgCam = layerKeys(s.cam, LAYER.BG, s.layerBase);
}
for (const s of shots) if (s.accent && !s.accent.still && !s.roll) s.cam = punchCam(s.cam, s.t0, s.t1, s.accent);
const cover = (d) => Math.cos((Math.abs(d) * Math.PI) / 180) + (16 / 9) * Math.sin((Math.abs(d) * Math.PI) / 180);
const FIT = { LABEL: 200, BOTTOM: 230, EDGE: 20, HAIR: 20, TOP_Y: 170, TAG: 44, STACK_GAP: 40, GAP: 30, DT: 0.1 };
const textBottom = (s) => {
  const end = (k) => (s.outs || []).find((o) => o[0] === k)?.[1] ?? s.t1;
  const items = [...(s.tags || []).map((g) => ({ k: g[0], t: g[3], h: plateSize(g[1], g[2], FIT.TAG).h })), ...(s.plates || []).filter((p) => !p[5]).map((p) => ({ k: p[0], t: p[3], h: plateSize(p[1], p[2], p[6]).h }))];
  let m = 0;
  for (let t = s.t0; t < s.t1; t += FIT.DT) {
    const live = items.filter((x) => t >= x.t - FIT.DT && t < end(x.k));
    if (live.length) m = Math.max(m, Math.max(FIT.TOP_Y - live[0].h / 2, SAFE.t) + live.reduce((a, x) => a + x.h, 0) + (live.length - 1) * FIT.STACK_GAP);
  }
  return m;
};
const fitVert = (s) => {
  if (!VERT || s.kind !== "scene" || !s.cam?.length || s.blur || s.mover || s.iconBoxes?.length || (s.plates || []).some((p) => p[5])) return;
  const people = (s.boxes || []).filter((b) => b.fb && !b.soft && !b.crowd && (!s.bust || b.b <= VIEW.b));
  if (!people.length) return;
  const F = Math.max(...people.map((b) => b.b)), H = Math.min(...people.map((b) => b.fb.t)) - FIT.HAIR, T = Math.max(textBottom(s), SAFE.t) + FIT.GAP + ((s.labels || []).length || (s.bubbles || []).length ? FIT.LABEL : 0);
  const want = VIEW.b - FIT.BOTTOM, sCap = s.bust ? Infinity : Math.max(1, (want - T) / (F - H));
  const keys = s.cam.map((c) => ({ ...c, s: Math.min(c.s, sCap) })), sMin = Math.min(...keys.map((c) => c.s)), sKey = Math.max(...keys.map((c) => c.s));
  const B = Math.min(VIEW.b - FIT.EDGE, Math.max(want, T + (F - H) * sKey, VIEW.b - sMin * (VIEW.b - F)));
  const lead = people.find((b) => b.n === s.subject) || people.find((b) => b.actor) || people[0], cx = (lead.fb.l + lead.fb.r) / 2;
  s.cam = keys.map((c) => ({ ...c, s: r3(Math.max(c.s, (VIEW.b - B) / (VIEW.b - F))), tx: r3(cx), ty: r3(F), sx: 960, sy: r3(B) }));
};
for (const s of shots) fitVert(s);
shots.forEach((s, i) => { const p = shots[i - 1]; if (s.cont && p?.icons?.length) { const own = new Set(s.icons.map((x) => x[2])); s.icons = [...p.icons.filter((x) => !own.has(x[2])).map((x) => [x[0], s.t0, x[2], x[3], x[4], true]), ...s.icons]; } });
const ICON_PNG = new Set(shots.flatMap((s) => (s.icons || []).map((x) => x[0])));
const iconJs = (s) => (s.iconBoxes || []).map(({ n, t, x, y, w, h, cross, end, held, side }, k) => {
  const id = `${s.id}i${k}`;
  const el = `{const e=document.createElement('div');e.className='icn';e.id='${id}';e.style.cssText='left:${r3(x - w / 2)}px;top:${r3(y - h / 2)}px;width:${w}px';e.innerHTML='<img src="png/${n}.png" style="width:${w}px;height:${h}px">${cross ? `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path class="xo" d="M${w * 0.12} ${h * 0.12}L${w * 0.88} ${h * 0.88}M${w * 0.88} ${h * 0.12}L${w * 0.12} ${h * 0.88}"/><path class="xi" d="M${w * 0.12} ${h * 0.12}L${w * 0.88} ${h * 0.88}M${w * 0.88} ${h * 0.12}L${w * 0.12} ${h * 0.88}"/></svg>` : ""}';document.getElementById('${s.id}t').appendChild(e);`;
  const anim = held ? "" : `tl.fromTo(e,{scale:.3,opacity:0,rotation:${side === "r" ? 8 : -8}},{scale:1,opacity:1,rotation:${side === "r" ? 3 : -3},duration:.28,ease:'back.out(2.2)'},${t.toFixed(3)});${cross ? `tl.fromTo(e.querySelectorAll('svg path'),{drawSVG:'0%'},{drawSVG:'100%',duration:.22,ease:'power2.out'},${(t + 0.3).toFixed(3)});` : ""}`;
  return el + anim + (end < s.t1 - 0.05 ? `tl.to(e,{opacity:0,scale:.7,duration:${VISIT.OUT},ease:'power2.in'},${end.toFixed(3)});` : "") + "}";
}).join("");
const camAt = (s, t) => camState(s.cam, s.t0, t);
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const SEPIA = "colorchannelmixer=rr=.6965:rg=.3845:rb=.0945:gr=.1745:gg=.843:gb=.084:br=.136:bg=.267:bb=.5655";
const GRADES = {
  old: `${SEPIA},eq=saturation=0.68:contrast=1.06:brightness=-0.015`,
  war: "eq=saturation=0.74:contrast=1.08:brightness=-0.02,colorbalance=rs=-0.03:bs=0.05:rm=-0.02:bm=0.03",
  warm: "eq=saturation=1.04:contrast=1.04,colorbalance=rm=0.05:gm=0.02:bm=-0.05:rh=0.03:bh=-0.03",
  anime: "eq=saturation=1.08:contrast=1.03:brightness=0.01",
  silk: "eq=saturation=1.05:contrast=1.03,colorbalance=rh=0.02:bh=-0.02",
  gaslight: "eq=saturation=0.8:contrast=1.08:brightness=-0.03,colorbalance=rs=-0.04:gs=-0.01:bs=0.07:rh=0.05:gh=0.02:bh=-0.04",
  stone: "eq=saturation=0.84:contrast=1.06:brightness=-0.01,colorbalance=bs=0.03:bm=0.02",
};
const GRADE = GRADES[LOOK.grade] || "";
const BG_Q = "3";
const BLUR = { W: 1920, SIGMA: 18, DIM: 0.7 };
const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { windowsHide: true });
const chain = (...f) => f.filter(Boolean).join(",") || "null";
const baked = new Set();
const bakeBg = (k) => {
  const src = path.join(jobDir, `${k}.png`), dst = path.join(jobDir, `${k}.jpg`);
  if (!baked.has(k) && fs.existsSync(src)) {
    ff(["-i", src, "-vf", chain(GRADE), "-q:v", BG_Q, dst]);
    ff(["-i", src, "-vf", chain(`scale=${BLUR.W}:-2`, `gblur=sigma=${BLUR.SIGMA}`, GRADE, `colorchannelmixer=rr=${BLUR.DIM}:gg=${BLUR.DIM}:bb=${BLUR.DIM}`), "-q:v", BG_Q, path.join(jobDir, `${k}_blur.jpg`)]);
    ff(["-i", src, "-vf", chain(`gblur=sigma=${SOFT.SIGMA}`, GRADE, `colorchannelmixer=rr=${SOFT.DIM}:gg=${SOFT.DIM}:bb=${SOFT.DIM}`), "-q:v", BG_Q, path.join(jobDir, `${k}_soft.jpg`)]);
    fs.rmSync(src);
    baked.add(k);
  }
  return fs.existsSync(dst);
};
const BG = (k) => (bakeBg(k) ? `${k}.jpg` : `${k}.png`);
const BG_BLUR = (k) => (bakeBg(k) ? `${k}_blur.jpg` : `${k}.png`);
const BG_SOFT = (k) => (bakeBg(k) ? `${k}_soft.jpg` : `${k}.png`);
const TEXTEV = [];
let html = "", js = "";
const camJs = (s, layers = ["c", "t"]) => layers.map((k) => `BORN.camPath(tl,'#${s.id}${k}',[${s.cam.map((c) => `{t:${(s.t0 + c.t).toFixed(3)},v:BORN.cam(${c.s},${c.tx},${c.ty},${c.sx},${c.sy})${c.ease ? `,ease:'${c.ease}'` : ""}}`).join(",")}]);`).join("");
const breath = (s) => `tl.fromTo('#${s.id} .cam > svg > g',{scaleY:1,transformOrigin:'50% 100%'},{scaleY:1.008,duration:.9,yoyo:true,repeat:${Math.max(1, Math.floor((s.t1 - s.t0) / 0.9))},ease:'sine.inOut'},${s.t0});`;
const impactJs = (s, ov) => {
  const t = s.impact.t.toFixed(3), k = `#${s.id}k`;
  let o = `{const e=document.createElement('div');e.className='bw';${ov}.appendChild(e);tl.fromTo(e,{opacity:${s.impact.speed ? 0.85 : 0.6}},{opacity:0,duration:${s.impact.speed ? 0.22 : 0.35},immediateRender:false},${t});}`;
  if (!s.roll) o += `tl.to('${k}',{scale:1.035,duration:.06,ease:'none'},${t});BORN.shake(tl,'${k}',${t},.45,${s.impact.speed ? 16 : 11},7);tl.to('${k}',{x:0,y:0,scale:1,duration:.3,ease:'sine.out'},${(s.impact.t + 0.5).toFixed(3)});`;
  if (s.impact.kind === "slash") o += `{const e=document.createElement('div');e.className='slash';${ov}.appendChild(e);tl.fromTo(e,{scaleX:0,opacity:1},{scaleX:1,duration:.12,ease:'power2.out',immediateRender:false},${t});tl.to(e,{opacity:0,duration:.25},${(s.impact.t + 0.14).toFixed(3)});}`;
  if (s.impact.speed) o += `{const e=document.createElement('div');e.className='speedl';${ov}.appendChild(e);tl.fromTo(e,{opacity:0,rotation:0},{keyframes:[{opacity:.9,rotation:4,duration:.08},{opacity:.7,rotation:-3,duration:.12},{opacity:0,rotation:2,duration:.3}],ease:'none',immediateRender:false},${t});}`;
  return o;
};
const bar = (s) => `{const h=document.getElementById('${s.id}h');const e=document.createElement('div');e.className='sbar';e.innerHTML='<div class="sbl">${safe(s.bar.label)}</div><div class="sbt"><div class="sbf" id="${s.id}bf"></div></div><div class="sbv" id="${s.id}bv">${s.bar.from}%</div>';h.appendChild(e);tl.fromTo(e,{opacity:0,y:-30},{opacity:1,y:0,duration:.3},${s.bar.t});tl.fromTo('#${s.id}bf',{width:'${s.bar.from}%'},{width:'${s.bar.to}%',duration:.8,ease:'power2.out'},${s.bar.t + 0.4});const o={v:${s.bar.from}};tl.to(o,{v:${s.bar.to},duration:.8,ease:'power2.out',onUpdate:()=>{document.getElementById('${s.id}bv').textContent=Math.round(o.v)+'%'}},${s.bar.t + 0.4});}`;
for (const s of shots) {
  const d = (s.t1 - s.t0).toFixed(3);
  let inner = "";
  if (s.kind === "rew" && s.rew?.length) {
    const frame = (f, i) => {
      if (typeof f === "string") return `<img class="rwi" id="${s.id}rw${i}" src="${BG(f)}">`;
      const svg = (f.actors || []).map((a) => sp(a.sprite, a.x, a.y, a.h, { ...(a.dir ? { dir: a.dir } : {}), crowd: !!a.crowd, allow: true, noBox: true, anchorX: a.anchorX ?? 0.5 })).join("");
      takeBoxes();
      return `<div class="rwi" id="${s.id}rw${i}"><img src="${BG(f.bg)}" width="1920" height="1080"><svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">${DEFS}<g>${svg}</g></svg></div>`;
    };
    inner = `<div class="rew">${s.rew.map(frame).join("")}<div class="scan"></div><div class="rwt">◀◀ REW</div></div>`;
    const step = (s.t1 - s.t0) / s.rew.length;
    js += s.rew.map((_, i) => `tl.set('#${s.id}rw${i}',{opacity:1},${(s.t0 + i * step).toFixed(3)});tl.fromTo('#${s.id}rw${i}',{scale:1.25},{scale:1.05,duration:${step.toFixed(3)},ease:'none'},${(s.t0 + i * step).toFixed(3)});${i < s.rew.length - 1 ? `tl.set('#${s.id}rw${i}',{opacity:0},${(s.t0 + (i + 1) * step).toFixed(3)});` : ""}`).join("");
    js += `tl.fromTo('#${s.id} .rwt',{opacity:0},{opacity:1,duration:.05,yoyo:true,repeat:7},${s.t0});`;
  } else if (s.kind === "paper" && s.paper) {
    const lines = s.paper.lines || [];
    const tops = { h: [92, "#2a1a10", 900], n: [210, "#8a1c10", 900], l: [64, "#5a3a22", 800], s: [58, "#5a3a22", 800] };
    const big = lines.length <= 2 ? PAPER_BIG : 1;
    const sizes = lines.map((l) => { const [full, , w] = tops[l.size] || tops.l; return Math.min(Math.round(full * big), Math.floor(PAPER_W / Math.max(0.01, textW(safe(l.text), 1, w)))); });
    const block = sizes.reduce((n, z) => n + Math.round(z * 1.35) + 24, -24) + (s.paper.stamp ? PAPER_STAMP_GAP : 0);
    let y = Math.max(60, Math.round(540 * PAPER_OPTICAL - block / 2));
    inner = `<div class="paper" id="${s.id}p">${lines.map((l, i) => { const [, col, w] = tops[l.size] || tops.l, size = sizes[i]; const el = `<div class="pl" id="${s.id}p${i}" style="top:${y}px;font:${w} ${size}px 'Alegreya Sans';color:${col}">${safe(l.text)}</div>`; y += Math.round(size * 1.35) + 24; return el; }).join("")}</div>`;
    js += lines.map((l, i) => `tl.fromTo('#${s.id}p${i}',{opacity:0,y:-20},{opacity:1,y:0,duration:.3},${(i ? l.t : Math.min(l.t, s.t0 + PAPER_LEAD)).toFixed(3)});`).join("");
    if (s.paper.stamp) js += `{const r=BORN.rubber(document.getElementById('${s.id}p'),{id:'${s.id}st',text:'${safe(s.paper.stamp.text)}',x:960,y:${Math.min(960, y + 90)},size:104,rot:-6});BORN.rubberIn(tl,r,${s.paper.stamp.t});}`;
  } else if (s.kind === "montage" && s.montage) {
    const m = s.montage, n = m.bgs.length, gap = 1920 / n;
    inner = `<div class="mont">${m.bgs.map((b, i) => `<div class="pol" id="${s.id}mo${i}" style="left:${Math.round(gap * i + gap / 2 - 248)}px;transform:rotate(${[-6, 3, -2, 4][i % 4]}deg)"><img src="${BG(b)}"><div class="polc">${safe(m.caps[i])}</div></div>`).join("")}</div>`;
    js += m.bgs.map((_, i) => `tl.fromTo('#${s.id}mo${i}',{y:900},{y:0,duration:.35,ease:'back.out(1.4)'},${(m.capT[i] ?? s.t0).toFixed(3)});`).join("");
  } else if (s.kind === "chapter" && s.chapter) {
    inner = `<div class="chap" id="${s.id}ch"><div class="chl" id="${s.id}cl">${safe(s.chapter.label)}</div><div class="cht" id="${s.id}ct"${VERT ? ` style="font-size:${Math.min(148, Math.floor(540 / Math.max(0.01, textW(safe(s.chapter.title), 1, 900))))}px;max-width:560px"` : ""}>${safe(s.chapter.title)}</div></div>`;
    js += `tl.fromTo('#${s.id}cl',{opacity:0,y:12},{opacity:1,y:0,duration:.5,ease:'power2.out'},${s.t0.toFixed(3)});tl.fromTo('#${s.id}ct',{opacity:0,scale:1.06},{opacity:1,scale:1,duration:.6,ease:'power2.out'},${(s.t0 + 0.2).toFixed(3)});tl.to('#${s.id}ch',{opacity:0,duration:.3,ease:'power1.in'},${(s.t0 + Math.max(0.6, d - 0.3)).toFixed(3)});`;
  } else if (s.kind === "black") {
    inner = `<div class="blk"></div><div class="hud" id="${s.id}h"></div>`;
  } else {
    const bgImg = `<img${s.blur ? ' class="blurbg"' : ""} src="${s.blur ? BG_BLUR(s.bg) : s.bgCam && s.soft ? BG_SOFT(s.bg) : BG(s.bg)}">${s.blur ? '<div class="dim"></div>' : ""}`;
    const sprites = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">${DEFS}<g>${s.svg}</g></svg>`;
    inner = `<div class="shake" id="${s.id}k">${s.bgCam ? `<div class="cam" id="${s.id}b">${bgImg}</div><div class="cam" id="${s.id}c">${sprites}</div>` : `<div class="cam" id="${s.id}c">${bgImg}${sprites}</div>`}</div><div class="ov" id="${s.id}o"></div><div class="cam txt" id="${s.id}t"></div><div class="hud" id="${s.id}h"></div>`;
    js += camJs(s);
    if (s.bgCam) js += camJs({ ...s, cam: s.bgCam }, ["b"]);
    if (s.svg && !s.blur) js += breath(s);
    js += s.moves;
  }
  html += `<div class="clip" id="${s.id}" data-start="${s.t0.toFixed(3)}" data-duration="${d}">${inner}</div>\n`;
  if (s.kind !== "scene") {
    if (s.kind === "black" && s.plates?.length) js += textJs({ ...s, boxes: [], cam: [{ t: 0, s: 1, tx: 960, ty: 540, sx: 960, sy: 540 }] }, { camAt, MV, MOVES, hud: `document.getElementById('${s.id}h')` });
    continue;
  }
  const ov = `document.getElementById('${s.id}o')`, hud = `document.getElementById('${s.id}h')`;
  if (s.darkSteps) js += `{const e=document.createElement('div');e.className='bw';e.style.background='#000';${ov}.appendChild(e);tl.set(e,{opacity:${Math.min(1, s.darkSteps[0][1])}},${s.t0});${s.darkSteps.slice(1).map(([t, v]) => `tl.to(e,{opacity:${Math.min(1, v)},duration:${DRIFT.DARK_FADE},ease:'sine.inOut'},${t});`).join('')}}`;
  else if (s.dark) js += `{const e=document.createElement('div');e.className='bw';e.style.background='#000';${ov}.appendChild(e);tl.set(e,{opacity:${Math.min(1, s.dark)}},${s.t0});}`;
  if (s.cool) js += `{const g=BORN.glow(${ov},'${s.id}cg',960,520,380,'120,150,230',.45);BORN.fadeIn(tl,g,${s.t0 + 0.2},.6);}`;
  if (s.warm) js += `{const g=BORN.glow(${ov},'${s.id}wg',960,600,560,'255,180,100',.5);BORN.fadeIn(tl,g,${s.t0},.6);}`;
  if (s.roll) {
    js += `tl.fromTo('#${s.id}k',{rotation:0,scale:1},{rotation:${s.roll.deg},scale:${cover(s.roll.deg).toFixed(3)},duration:${s.roll.dur.toFixed(3)},ease:'sine.inOut',transformOrigin:'50% 50%'},${s.roll.t});`;
  }
  if (s.bar) js += bar(s);
  js += textJs(s, { camAt, MV, MOVES, hud });
  js += iconJs(s);
  for (const [k, t] of s.outs || []) js += `{const e=document.getElementById('${s.id}${k}');if(e)tl.to(e,{opacity:0,duration:${VISIT.OUT}},${(t - VISIT.OUT).toFixed(3)});}`;
  for (const x of [...(s.tags || []), ...(s.labels || []), ...(s.plates || [])]) TEXTEV.push({ id: s.id, t: x[3], end: s.labelOut && (s.labels || []).includes(x) ? s.labelOut : s.t1 });
  for (const x of s.bubbles || []) TEXTEV.push({ id: s.id, t: x[2], end: s.t1 });
  if (s.glowAt) js += `{const g=BORN.glow(${ov},'${s.id}gl',${s.glowAt.x},${s.glowAt.y},${s.glowAt.r},'${s.glowAt.color}',.5);BORN.fadeIn(tl,g,${s.glowAt.t},.6);}`;
  if (s.focusOn) {
    const fb = (s.boxes || []).find((b) => b.n === s.focusOn.sprite && b.fb)?.fb;
    if (fb) {
      const c = camAt(s, s.focusOn.t), fx = c.x + c.s * ((fb.l + fb.r) / 2), fy = c.y + c.s * ((fb.t + fb.b) / 2);
      js += `{const f=BORN.focus(${ov},'${s.id}fo',${Math.round(fx)},${Math.round(fy)},${Math.round(150 * c.s)},${Math.round(560 * c.s)},.6);BORN.fadeIn(tl,f,${s.focusOn.t},.6);tl.to(f,{opacity:0,duration:.8},${s.focusOn.out});const g=BORN.glow(${ov},'${s.id}rim',${Math.round(fx)},${Math.round(fy)},${Math.round(200 * c.s)},'255,190,110',.35);BORN.fadeIn(tl,g,${s.focusOn.t},.6);tl.to(g,{opacity:0,duration:.8},${s.focusOn.out});}`;
    }
  }
  if (s.series) js += `{const e=BORN.series(${hud},{id:'${s.id}sr',text:'${s.series}'});tl.set(e,{opacity:1},${s.t0});}`;
  if (s.focusAt) js += `{const f=BORN.focus(${ov},'${s.id}fo',${s.focusAt[0]},${s.focusAt[1]},150,560,.75);BORN.fadeIn(tl,f,${s.focusAt[2]},.6);}`;
  if (s.impact) js += impactJs(s, ov);
  if (s.accent?.kind === "spot") js += `{const e=document.createElement('div');e.className='spot';${ov}.appendChild(e);tl.fromTo(e,{opacity:0},{opacity:1,duration:.4,immediateRender:false},${s.accent.t.toFixed(3)});tl.to(e,{opacity:0,duration:.6},${Math.min(s.t1 - 0.6, s.accent.t + 1.8).toFixed(3)});}`;
  if (s.flashAt !== undefined) js += `{const e=document.createElement('div');e.className='bw';${ov}.appendChild(e);tl.fromTo(e,{opacity:.55},{opacity:0,duration:.4,immediateRender:false},${s.flashAt});}`;
  if (s.smoke) js += `{const e=document.createElement('div');e.className='haze';${ov}.appendChild(e);tl.fromTo(e,{x:-200,opacity:0},{x:200,opacity:.45,duration:${(s.t1 - s.t0).toFixed(2)},ease:'none'},${s.t0});}`;
  if (s.endCard) TEXTEV.push({ id: s.id, t: s.endCard.t, end: s.t1 });
  if (s.endCard) js += `{const e=BORN.plate(${hud},{id:'${s.id}end',text:'${up(s.endCard.text)}',sub:'${up(s.endCard.sub)}',x:960,y:${VERT ? END_Y.VERT : END_Y.WIDE},size:${VERT ? 44 : 64},rot:-2});BORN.plateIn(tl,e,${s.endCard.t});}`;
}
const css = fs.readFileSync(path.join(KIT, "born_style.css"), "utf8");
const scripts = ["gsap.min.js", "DrawSVGPlugin.min.js", "MorphSVGPlugin.min.js", "MotionPathPlugin.min.js", "SplitText.min.js", "CustomEase.min.js", "CustomWiggle.min.js", "noise.min.js", "kit.js"].map((f) => `<script src="${f}"></script>`).join("");
const fxDef = FX[LOOK.fx];
const rnd = ((seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647))(97);
const pick = ([a, b]) => a + (b - a) * rnd();
const fxItems = fxDef ? Array.from({ length: fxDef.n }, (_, i) => ({ i, x: pick([0, 1920]), y: pick([0, 1080]), size: pick(fxDef.size), dx: pick(fxDef.dx), dy: pick(fxDef.dy), dur: pick(fxDef.dur), delay: pick([0, 6]) })) : [];
const amb = AMB[LOOK.amb];
const ambHtml = amb ? `<div class="amb ${amb.cls}" id="amb"></div>` : "";
const ambJs = amb ? `tl.fromTo('#amb',{opacity:${amb.from}},{keyframes:[${Array.from({ length: amb.keys }, () => `{opacity:${(amb.from + (amb.to - amb.from) * rnd()).toFixed(3)},duration:${amb.step}}`).join(",")}],ease:'none',repeat:${Math.max(0, Math.floor(TOTAL / (amb.keys * amb.step)))}},0);` : "";
const fxHtml = fxDef ? `<div class="fx">${fxItems.map((p) => `<i id="fx${p.i}" style="left:${p.x.toFixed(0)}px;top:${p.y.toFixed(0)}px;width:${p.size.toFixed(1)}px;height:${(fxDef.petal ? p.size * 0.62 : fxDef.fog ? p.size * 0.32 : p.size).toFixed(1)}px;background:${fxDef.color};border-radius:${fxDef.petal ? "60% 0" : "50%"};filter:blur(${fxDef.blur}px)"></i>`).join("")}</div>` : "";
const fxJs = fxItems.map((p) => `tl.fromTo('#fx${p.i}',{x:0,y:0,opacity:0,rotation:0},{keyframes:[{opacity:1,duration:${(p.dur * 0.2).toFixed(2)}},{opacity:1,duration:${(p.dur * 0.6).toFixed(2)}},{opacity:0,duration:${(p.dur * 0.2).toFixed(2)}}],x:${p.dx.toFixed(0)},y:${p.dy.toFixed(0)},rotation:${fxDef.petal ? 220 : 0},ease:'none',repeat:${Math.max(0, Math.floor((TOTAL - p.delay) / p.dur) - 1)}},${p.delay.toFixed(2)});`).join("");
const out = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="fonts/fonts.css"><style>${css}${VERT ? VERT_CSS : ""}</style></head><body>${spriteDefs()}<div id="root" class="${[LOOK.grade && `grade-${LOOK.grade}`, LOOK.art && "art-anime"].filter(Boolean).join(" ")}" data-composition-id="root" data-width="${VERT ? 1080 : 1920}" data-height="${VERT ? 1920 : 1080}" data-start="0" data-duration="${TOTAL}">\n${VERT ? `<div id="stage">${html}${fxHtml}</div>` : html + fxHtml}${ambHtml}<div class="grain"></div><div class="vig"></div>${VERT && fs.existsSync(path.join(jobDir, "ov.png")) ? '<img id="ovl" src="ov.png">' : ""}${VERT && fs.existsSync(path.join(jobDir, "ovt.png")) ? '<img id="ovt" src="ovt.png">' : ""}<audio id="vo" src="voice.wav" data-start="0" data-duration="${TOTAL}" data-volume="1"></audio></div>${scripts}<script>document.head.insertAdjacentHTML('beforeend','<style>'+BORN_CSS+'</style>');${VERT ? `BORN.TAG_AT=${JSON.stringify(TAG_AT)};` : ''}const tl=gsap.timeline({paused:true});${fxJs}${ambJs}${VERT ? `if(document.getElementById('ovt'))tl.to('#ovt',{opacity:0,duration:.4},${OVT_OUT});` : ''}\n${js}\ntl.to({},{duration:${TOTAL}},0);window.__timelines={root:tl};</script></body></html>`;
fs.mkdirSync(path.join(jobDir, "png"), { recursive: true });
fs.writeFileSync(path.join(jobDir, "index.html"), out);
for (const n of new Set([...pngUsed(), ...ICON_PNG])) {
  const src = path.join(process.env.BORN_ASSETS, "png", `${n}.png`), dst = path.join(jobDir, "png", `${n}.png`);
  if (GRADE) ff(["-i", src, "-vf", GRADE, "-pix_fmt", "rgba", dst]);
  else fs.copyFileSync(src, dst);
}
fs.writeFileSync(path.join(jobDir, "texts.json"), JSON.stringify(TEXTEV));
fs.writeFileSync(path.join(jobDir, "shots.json"), JSON.stringify(shots.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, kind: s.kind }))));
fs.writeFileSync(path.join(jobDir, "faces_all.json"), JSON.stringify(FACEMAP()));
fs.writeFileSync(path.join(jobDir, "layout_report.json"), JSON.stringify(planShots.report || []));
fs.writeFileSync(path.join(jobDir, "cast.json"), JSON.stringify(CAST));
console.log(JSON.stringify({ shots: shots.length, bytes: out.length, png: pngUsed().length, warns }));
