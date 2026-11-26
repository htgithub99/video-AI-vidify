import { faceBox, meta } from "./sprites.mjs";
import { camState } from "./layout.mjs";

const RULE = {
  shoreGap: 60,
  hookMax: 0.9,
  storyMax: 3.2,
  hookStep: 0.7,
  storyStep: 1.9,
  minShot: 0.5,
  push: 0.02,
  hookPush: 0.06,
  drift: 0.04,
  close: 2.35,
  medium: 1.55,
  glide: 1.0,
  closeSx: 768,
  closeSy: 560,
  darkMax: 0.45,
  focusHold: 2.4,
  slots: { l: 520, cl: 760, c: 960, cr: 1160, r: 1400 },
  backMax: 980,
  lieAspect: 1.25,
  lieFit: 0.95,
  capFit: 1.05,
  bodyM: 1.75,
  rideM: 2.6,
  seatTop: 0.42,
  bedTop: 0.3,
  textLead: 0.8,
  lieRoom: 1.1,
  lieOn: /bed|cot|couch|sofa|bench/i,
  furniture: /bed|chair|bench|sofa|stool|couch|cot/i,
  furnitureEnd: /(bed|chair|bench|sofa|stool|couch|cot)$/i,
  seatKinds: { bed: "bed", cot: "bed", chair: "chair", stool: "chair", bench: "bench", sofa: "sofa", couch: "sofa" },
  plainWords: new Set(["wild", "west", "western", "old", "young", "adult", "man", "woman", "with", "and", "the", "wooden", "black", "white", "brown", "small", "large", "big", "standing", "stand", "idle", "walk", "walking", "run", "running", "side", "view", "full", "body", "plated", "rolled", "untouched"]),
  insertH: 440,
  insertW: 900,
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r3 = (v) => Math.round(v * 1000) / 1000;
const TURNS = new Set(["person", "animal", "vehicle"]);

const POSE = { ride: /ride|riding|horse|mounted|gallop/i, low: /sit|kneel|crouch|squat/i };
const poseHeight = (n, base) => {
  if (POSE.ride.test(n) && !n.includes("__")) return base * 1.35;
  if (POSE.low.test(n) && !n.includes("__")) return base * 0.72;
  return base;
};
const BACK = new Set(["building", "structure", "nature"]);
const lerp3 = (v, x) => (x <= 320 ? v[0] : x <= 960 ? v[0] + ((v[1] - v[0]) * (x - 320)) / 640 : x <= 1600 ? v[1] + ((v[2] - v[1]) * (x - 960)) / 640 : v[2]);
const anchorsOf = (plan, bg) => {
  const a = plan.bgAnn?.[bg];
  const g = plan.ground[bg] ?? 860;
  return {
    groundAt: (x) => (a ? lerp3(a.ground, x) : g),
    personAt: (x) => (a ? lerp3(a.person, x) : plan.pxPerM * 1.75),
    spots: a ? a.spots.filter((s) => !a.water || s[1] > a.water + RULE.shoreGap).map((s) => ({ x: s[0], y: s[1], h: s[2] })) : [],
    walls: a?.walls || [],
    table: a?.table || null,
    free: a?.free || [],
    seats: a?.seats || [],
    depth: a ? depthOf([...a.ground.map((g, i) => [g, a.person[i]]), ...a.spots.map((p) => [p[1], p[2]])]) : null,
  };
};
const depthOf = (pts) => {
  const n = pts.length, my = pts.reduce((t, p) => t + p[0], 0) / n, mh = pts.reduce((t, p) => t + p[1], 0) / n;
  const vy = pts.reduce((t, p) => t + (p[0] - my) ** 2, 0);
  if (vy < 400) return null;
  const k = pts.reduce((t, p) => t + (p[0] - my) * (p[1] - mh), 0) / vy;
  if (k < 0.15) return null;
  return { k, hz: my - mh / k };
};
const charId = (n) => (n.includes("__") ? null : n.split("_").slice(0, 2).join("_"));
const refFaces = (plan) => {
  const by = {};
  for (const [n, s] of Object.entries(plan.sprites)) {
    const id = charId(n), f = s.ann?.face;
    if (!id || s.kind !== "person" || !f || (s.ann.aspect ?? 1) >= 0.8) continue;
    (by[id] = by[id] || []).push(f.b - f.t);
  }
  return Object.fromEntries(Object.entries(by).map(([id, v]) => [id, v.sort((a, b) => a - b)[Math.floor(v.length / 2)]]));
};
const personHeight = (plan, refs, n, base, pxm) => {
  const s = plan.sprites[n], id = charId(n), f = s?.ann?.face, ref = id && refs[id];
  const m = meta(n), aspect = m.w / m.h, ride = POSE.ride.test(n);
  const len = id || ride || aspect <= RULE.lieAspect ? base : RULE.bodyM * pxm;
  if (aspect > RULE.lieAspect && !ride) return (len * RULE.lieFit) / aspect;
  const h = ref && f && f.b - f.t > 0.02 ? clamp((base * ref) / (f.b - f.t), base * 0.3, base * 1.8) : poseHeight(n, base);
  const cap = ride && id ? RULE.rideM * pxm : len * RULE.capFit;
  return Math.min(h, cap / Math.max(1, aspect));
};
const poseWords = (n) => {
  const id = charId(n), rest = id ? n.slice(id.length) : n.split("__").pop();
  return rest.toLowerCase().split(/[_\s]+/).filter((w) => w.length >= 3 && !RULE.plainWords.has(w));
};
const sameWord = (a, b) => a.some((w) => b.some((v) => v === w || (w.length >= 4 && v.endsWith(w)) || (v.length >= 4 && w.endsWith(v))));
const layout = (beat, plan, refs) => {
  const A = anchorsOf(plan, beat.bg);
  const info = (n) => plan.sprites[n] || { kind: "prop", heightM: 1 };
  const people = beat.cast.filter((c) => info(c.sprite).kind === "person").map((c) => poseWords(c.sprite));
  const isSeat = (n) => poseWords(n).some((v) => RULE.furniture.test(v) && RULE.furnitureEnd.test(v));
  const seatKind = (v) => RULE.seatKinds[v.match(RULE.furnitureEnd)?.[1]?.toLowerCase()] || null;
  const bgHas = (n) => poseWords(n).some((v) => seatKind(v) && A.seats.some((x) => x.k === seatKind(v)));
  const held = new Set(beat.cast.map((c, i) => (info(c.sprite).kind !== "person" && ((!isSeat(c.sprite) && people.some((p) => sameWord(poseWords(c.sprite), p))) || (isSeat(c.sprite) && bgHas(c.sprite))) ? i : -1)).filter((i) => i >= 0));
  const isBack = (k) => BACK.has(k.kind) || (k.kind === "vehicle" && k.heightM >= 3);
  const main = [];
  const crowds = [];
  const person = beat.cast.findIndex((c) => info(c.sprite).kind === "person" && !(c.crowd > 1));
  const pick = beat.cast[beat.subject] && !isBack(info(beat.cast[beat.subject].sprite)) ? beat.subject : -1;
  const subject = pick >= 0 ? pick : person >= 0 ? person : beat.cast.findIndex((c) => !isBack(info(c.sprite)));
  const freeSpots = [...A.spots];
  const takeSpot = (x) => {
    let best = -1;
    freeSpots.forEach((s, k) => {
      if (Math.abs(s.x - x) < 300 && (best < 0 || Math.abs(s.x - x) < Math.abs(freeSpots[best].x - x))) best = k;
    });
    return best >= 0 ? freeSpots.splice(best, 1)[0] : null;
  };
  const order = beat.cast.map((c, i) => i).filter((i) => !held.has(i)).sort((a, b) => (a === subject ? -1 : b === subject ? 1 : a - b));
  for (const i of order) {
    const c = beat.cast[i];
    const k = info(c.sprite);
    const ann = k.ann || {};
    const back = isBack(k);
    const want = ann.place === "wall" || ann.place === "table" ? ann.place : c.place;
    const place = want === "wall" && !A.walls.length ? "ground" : want === "table" && !A.table ? "ground" : want;
    let x = RULE.slots[c.slot] ?? RULE.slots.c;
    let y = A.groundAt(x);
    let per = A.personAt(x);
    if (!back && place === "wall" && A.walls.length) {
      const w = A.walls.reduce((b, z) => (Math.abs((z[0] + z[1]) / 2 - x) < Math.abs((b[0] + b[1]) / 2 - x) ? z : b));
      x = clamp(x, w[0] + 60, w[1] - 60);
      y = w[2];
    } else if (!back && place === "table") {
      x = clamp(x, A.table[0] + 40, A.table[1] - 40);
      y = A.table[2];
    } else if (!back && !(c.crowd > 1) && place !== "near") {
      const s = takeSpot(x);
      if (s) [x, y, per] = [s.x, s.y, s.h];
    }
    const pxm = per / 1.75;
    const base = k.heightM * pxm;
    if (back && base > RULE.backMax && A.depth) {
      const yb = A.depth.hz + (RULE.backMax * 1.75) / (k.heightM * A.depth.k);
      if (yb < y) [y, per] = [yb, A.depth.k * (yb - A.depth.hz)];
    }
    const h = back ? k.heightM * (per / 1.75) : clamp(k.kind === "person" ? personHeight(plan, refs, c.sprite, base, pxm) : base, 18, 980);
    const dir = c.move ? c.move : TURNS.has(k.kind) ? c.dir : undefined;
    const pad = ann.pad || 0, foot = ann.foot ?? 0.5;
    if (c.crowd > 1 && !back) {
      for (let j = 0; j < Math.min(6, c.crowd); j++) {
        const u = j / Math.max(1, c.crowd - 1) - 0.5, jit = ((j * 37) % 11) / 11 - 0.5, cx = x + u * 420 + jit * 30;
        crowds.push({ sprite: c.sprite, x: cx, y: A.groundAt(cx) - 18 + jit * 14 + pad * h, h: h * (0.9 + ((j * 13) % 7) / 70), dir, crowd: true, cast: i, kind: k.kind, anchorX: foot });
      }
      continue;
    }
    main[i] = { sprite: c.sprite, x, y: y + pad * h, h, base, pxm, dir, cast: i, kind: k.kind, back, place, anchorX: foot, pad, swap: c.swap || [], move: c.move && !back ? (c.move === "r" ? 1 : -1) * pxm * 1.6 : 0, onGround: !back && place !== "wall" && place !== "table" };
  }
  const width = (a) => (meta(a.sprite).w / meta(a.sprite).h) * a.h;
  const subj = main[subject];
  for (const a of main)
    if (a && a.place === "near" && subj && a !== subj) {
      a.x = subj.x + (subj.dir === "l" ? -1 : 1) * (width(subj) / 2 + width(a) / 2 + 20);
      a.y = A.groundAt(a.x) + a.pad * a.h;
    }
  for (const a of main) if (a && a.back && subj && Math.abs(a.x - subj.x) < (width(a) + width(subj)) / 2) a.x = subj.x < 960 ? Math.min(1920 - width(a) * 0.35, subj.x + (width(a) + width(subj)) / 2) : Math.max(width(a) * 0.35, subj.x - (width(a) + width(subj)) / 2);
  const solid = main.filter((a) => a && a.onGround);
  solid.sort((a, b) => a.x - b.x);
  for (let i = 1; i < solid.length; i++) {
    const a = solid[i - 1], b = solid[i];
    const need = (width(a) + width(b)) / 2 - Math.min(width(a), width(b)) * 0.2;
    if (b.x - a.x < need) b.x = a.x + need;
  }
  const over = solid.length ? Math.max(0, ...solid.map((a) => a.x + width(a) / 2 - 1880)) : 0;
  if (over) for (const a of solid) a.x = Math.max(40 + width(a) / 2, a.x - over);
  for (const a of solid) if (!A.spots.some((s) => Math.abs(s.x - a.x) < 1)) a.y = A.groundAt(a.x) + a.pad * a.h;
  for (const a of main) {
    if (!a || a.kind !== "person") continue;
    const w = poseWords(a.sprite).find((v) => RULE.furniture.test(v));
    const f = w && main.find((b) => b && b !== a && b.kind !== "person" && poseWords(b.sprite).some((v) => v.endsWith(w)));
    const bs = w && !f && A.seats.find((x) => x.k === seatKind(w));
    if (bs) {
      a.x = (bs.x0 + bs.x1) / 2;
      a.y = bs.y + (a.pad || 0) * a.h;
      a.onGround = false;
      a.seated = true;
      continue;
    }
    if (!f) continue;
    const need = RULE.lieRoom * width(a);
    if (RULE.lieOn.test(w) && width(f) < need) {
      const g = need / width(f), base = f.y - (f.pad || 0) * f.h;
      f.h *= g;
      f.y = base + (f.pad || 0) * f.h;
    }
    a.x = f.x;
    a.y = f.y - (f.pad || 0) * f.h - f.h * (RULE.lieOn.test(w) ? RULE.bedTop : RULE.seatTop) + (a.pad || 0) * a.h;
    a.onGround = false;
    a.seated = true;
  }
  const list = [...main.filter((a) => a && !a.seated), ...main.filter((a) => a && a.seated)];
  const wall = (a) => !a.back && a.place === "wall";
  return { actors: [...list.filter((a) => a.back), ...list.filter(wall), ...crowds, ...list.filter((a) => !a.back && !wall(a))], subject, A };
};
const cutTimes = (beat, t1, onsets, hook) => {
  const D = t1 - beat.t0, max = hook ? RULE.hookMax : RULE.storyMax;
  if (D <= max) return [beat.t0];
  const n = Math.ceil(D / (hook ? RULE.hookStep : RULE.storyStep));
  const cuts = [beat.t0];
  for (let k = 1; k < n; k++) {
    const want = beat.t0 + (D * k) / n;
    const near = onsets.filter((o) => o > cuts[cuts.length - 1] + RULE.minShot && o < t1 - RULE.minShot).sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
    if (near !== undefined && !cuts.includes(near)) cuts.push(near);
  }
  return cuts.sort((a, b) => a - b);
};

const framings = (beat, n) => {
  if (beat.cam === "pull") return Array.from({ length: n }, (_, i) => (i === n - 1 ? "pull" : i % 2 ? "medium" : "close"));
  const start = beat.frame || "wide";
  const cycle = start === "close" ? ["close", "medium", "close", "wide"] : start === "medium" ? ["medium", "close", "wide", "close"] : ["wide", "close", "medium", "close"];
  const list = Array.from({ length: n }, (_, i) => cycle[i % cycle.length]);
  if (beat.cam === "glide" && list[0] === "wide") list[0] = "glide";
  return list;
};

const subjectPoint = (a, dx = 0) => {
  const { fb, body } = faceBox(a.sprite, a.x + dx, a.y, a.h, a.dir, a.anchorX ?? 0.5);
  const bx = (body.l + body.r) / 2, by = (body.t + body.b) / 2;
  if (!TURNS.has(a.kind)) return { fx: bx, fy: by, head: by - 40, bx, by, fb: body };
  return { fx: (fb.l + fb.r) / 2, fy: (fb.t + fb.b) / 2, head: fb.t, bx, by, fb };
};

const cameraFor = (frame, d, hook, subj, subjEnd, actors) => {
  const rate = hook ? RULE.hookPush : RULE.push;
  const grow = (s) => r3(s * (1 + rate * d));
  const sceneX = actors.length ? actors.reduce((a, b) => a + b.x, 0) / actors.length : 960;
  if (!subj || frame === "wide") {
    const tx = subj ? 960 + (subj.bx - 960) * 0.2 : 960;
    return [{ t: 0, s: 1.0, x: 960, y: 540 }, { t: r3(d), s: grow(1.0), x: r3(tx + (sceneX > 960 ? 1 : -1) * 1920 * RULE.drift * 0.5), y: 530 }];
  }
  const close = { s: clamp(Math.min(RULE.close, (1080 * 0.7) / Math.max(1, subj.fb.b - subj.fb.t)), 1.4, RULE.close), x: subj.fx, y: subj.head + 40, sx: RULE.closeSx, sy: RULE.closeSy };
  const closeEnd = { ...close, x: subjEnd.fx, y: subjEnd.head + 40 };
  const medium = { s: RULE.medium, x: subj.bx, y: subj.by, sx: 900, sy: 560 };
  const mediumEnd = { ...medium, x: subjEnd.bx };
  if (frame === "close") return [{ t: 0, ...close }, { t: r3(d), ...closeEnd, s: grow(RULE.close) }];
  if (frame === "medium") return [{ t: 0, ...medium }, { t: r3(d), ...mediumEnd, s: grow(RULE.medium) }];
  if (frame === "pull") return [{ t: 0, ...close }, { t: r3(d), s: 1.0, x: 960, y: 540, ease: "power2.inOut" }];
  const g = Math.min(RULE.glide, d * 0.6), hold = Math.min(0.45, d * 0.25);
  return [{ t: 0, s: 1.0, x: 960, y: 540 }, { t: r3(hold), s: 1.02, x: 960, y: 535 }, { t: r3(hold + g), ...close, ease: "power3.inOut" }, { t: r3(d), ...closeEnd, s: grow(RULE.close) }];
};

export const direct = (plan) => {
  const onsets = plan.onsets || [];
  const shots = [];
  const beats = [...plan.beats].sort((a, b) => a.t0 - b.t0);
  const hookBgs = [];
  const refs = refFaces(plan);
  const sid = () => `s${String(shots.length + 1).padStart(3, "0")}`;
  beats.forEach((beat, bi) => {
    const t1 = bi + 1 < beats.length ? beats[bi + 1].t0 : plan.total;
    const hook = beat.t0 < plan.turnT;
    if (hook && beat.bg && !hookBgs.includes(beat.bg)) hookBgs.push(beat.bg);
    const base = { kind: beat.kind, endCard: beat.endCard };
    if (beat.kind === "rew") {
      shots.push({ ...base, id: sid(), t0: beat.t0, rew: (beat.rew?.length ? beat.rew : hookBgs).slice(0, 4) });
      return;
    }
    if (beat.kind === "paper" || beat.kind === "montage" || beat.kind === "black") {
      shots.push({ ...base, id: sid(), t0: beat.t0, paper: beat.paper, montage: beat.montage, plates: beat.plate ? [["p", beat.plate.text, beat.plate.sub || "", beat.plate.t, [960, 470], null, 90]] : [] });
      return;
    }
    if (beat.kind === "bust") {
      const d = t1 - beat.t0;
      shots.push({ ...base, kind: "scene", bust: true, id: sid(), t0: beat.t0, bg: beat.bg, blur: true, actors: [{ sprite: beat.cast[0]?.sprite, x: 960, y: 1090, h: 1010, shadow: false, allow: true }], cam: [{ t: 0, s: 1.02, x: 960, y: 540 }, { t: r3(d), s: r3(1.02 * (1 + (hook ? 0.05 : 0.03) * d)), x: 962, y: 480, sx: 960, sy: 480 }], glowAt: { x: 960, y: 470, r: 440, color: beat.cool ? "140,170,240" : "255,170,90", t: beat.t0 }, tags: beat.tag ? [["g", beat.tag.text, beat.tag.sub || "", beat.tag.t, beat.tag.corner || "tl"]] : [], plates: beat.plate ? [["p", beat.plate.text, beat.plate.sub || "", beat.plate.t, [960, 220], null]] : [], dark: Math.min(RULE.darkMax, beat.dark || 0), series: false });
      return;
    }
    const { actors, subject, A } = layout(beat, plan, refs);
    const lead = actors.find((a) => a.cast === subject && !a.crowd);
    if (lead && lead.kind === "prop" && !actors.some((a) => !a.back && (a.kind === "person" || a.kind === "animal"))) {
      const m = meta(lead.sprite), asp = m.w / m.h, h = Math.min(RULE.insertH, RULE.insertW / asp), d = t1 - beat.t0;
      const one = { sprite: lead.sprite, x: 960, y: 820, h: r3(h) };
      const top = [960, 820 - h * 0.7];
      const inBeat = (o) => o && o.t >= beat.t0 - 0.001 && o.t < t1;
      shots.push({ ...base, kind: "scene", id: sid(), t0: beat.t0, bg: beat.bg, blur: true, actors: [one], swaps: [], bubbles: [], cam: [{ t: 0, s: 1.0, x: 960, y: 560 }, { t: r3(d), s: r3(1 + (hook ? 0.06 : 0.03) * d), x: 960, y: 600 }], glowAt: { x: 960, y: 640, r: 520, color: "255,190,110", t: beat.t0 }, tags: inBeat(beat.tag) ? [["g", beat.tag.text, beat.tag.sub || "", beat.tag.t, beat.tag.corner || "tl"]] : [], labels: inBeat(beat.label) ? [["l", beat.label.text, beat.label.sub || "", beat.label.t, lead.sprite, "up"]] : [], plates: inBeat(beat.plate) ? [["p", beat.plate.text, beat.plate.sub || "", beat.plate.t, [960, 200], beat.plate.at === lead.cast ? top : null]] : [], dark: beat.dark ? Math.min(RULE.darkMax, beat.dark) : 0, flash: beat.flash, endCard: beat.endCard, series: beat.t0 >= plan.turnT && beat.t0 < plan.recapT });
      return;
    }
    const cuts = cutTimes(beat, t1, onsets, hook);
    const ends = cuts.map((c, i) => (i + 1 < cuts.length ? cuts[i + 1] : t1));
    for (const o of [beat.tag, beat.label, beat.plate, beat.bubble]) {
      if (!o) continue;
      const i = cuts.findIndex((c, k) => o.t >= c - 0.001 && o.t < ends[k]);
      if (i < 0 || ends[i] - o.t >= RULE.textLead) continue;
      o.t = i + 1 < cuts.length && ends[i + 1] - cuts[i + 1] >= RULE.textLead ? cuts[i + 1] + 0.05 : Math.max(cuts[i] + 0.05, ends[i] - RULE.textLead);
    }
    const frames = framings(beat, cuts.length);
    const D = t1 - beat.t0;
    const subjA = actors.find((a) => a.cast === subject && !a.crowd);
    cuts.forEach((c0, ci) => {
      const c1 = ci + 1 < cuts.length ? cuts[ci + 1] : t1, d = c1 - c0;
      const shot = { kind: "scene", id: sid(), t0: r3(c0), bg: beat.bg, actors: [], tags: [], labels: [], plates: [], bubbles: [], swaps: [] };
      for (const a of actors) {
        const off = a.move ? (a.move * (c0 - beat.t0)) / D : 0;
        const one = { sprite: a.sprite, x: a.x + off, y: a.y, h: a.h, anchorX: a.anchorX, ...(a.dir ? { dir: a.dir } : {}), ...(a.crowd ? { crowd: true } : {}) };
        if (a.move) one.move = { dx: r3((a.move * d) / D), t: r3(c0 + 0.02), dur: r3(Math.max(0.3, d - 0.04)), bob: a.kind === "animal" ? 12 : 5 };
        for (const sw of a.swap || []) if (sw.t >= c0 && sw.t < c1) {
          const h2 = personHeight(plan, refs, sw.sprite, a.base ?? a.h, a.pxm ?? (a.base ?? a.h) / 1.75);
          const p2 = plan.sprites[sw.sprite]?.ann?.pad || 0;
          shot.swaps.push({ from: a.sprite, to: sw.sprite, t: r3(sw.t), x: one.x, y: one.y - (a.pad || 0) * a.h + p2 * h2, h: r3(h2), dir: a.dir, anchorX: plan.sprites[sw.sprite]?.ann?.foot ?? 0.5 });
        }
        shot.actors.push(one);
      }
      const offAt = (t) => (subjA?.move ? (subjA.move * (t - beat.t0)) / D : 0);
      const sp0 = subjA && subjectPoint(subjA, offAt(c0)), sp1 = subjA && subjectPoint(subjA, offAt(c1));
      if (frames[ci] === "glide" && beat.label && beat.label.t >= c0 - 0.001 && beat.label.t < c1) frames[ci] = "wide";
      shot.cam = cameraFor(frames[ci], d, hook, sp0, sp1, actors);
      const inside = (t) => t >= c0 - 0.001 && t < c1;
      if (beat.tag && inside(beat.tag.t)) shot.tags.push(["g", beat.tag.text, beat.tag.sub || "", beat.tag.t, beat.tag.corner || "tl"]);
      if (beat.label && inside(beat.label.t) && actors[beat.label.cast] && !actors[beat.label.cast].crowd) {
        const la = actors.find((a) => a.cast === beat.label.cast && !a.crowd);
        if (la) shot.labels.push(["l", beat.label.text, beat.label.sub || "", beat.label.t, la.sprite, "up"]);
      }
      if (beat.plate && inside(beat.plate.t)) {
        const ta = typeof beat.plate.at === "number" ? actors.find((a) => a.cast === beat.plate.at && !a.crowd) : null;
        const target = ta ? [ta.x, ta.y - ta.h - 30] : null;
        const c = camState(shot.cam.map((k) => ({ t: k.t, s: k.s, tx: k.x, ty: k.y, sx: k.sx ?? 960, sy: k.sy ?? 540 })), c0, beat.plate.t);
        const toScreen = (w) => [c.x + c.s * w[0], c.y + c.s * w[1]];
        const subjX = sp0 ? toScreen([sp0.fx, sp0.fy])[0] : 960;
        const zone = A.free.map((z) => [(z[0] + z[2]) / 2, (z[1] + z[3]) / 2]).filter((w) => {
          const [sx, sy] = toScreen(w);
          return sx > 300 && sx < 1620 && sy > 110 && sy < 620;
        }).sort((u, v) => Math.abs(toScreen(v)[0] - subjX) - Math.abs(toScreen(u)[0] - subjX))[0];
        const want = zone ? toScreen(zone) : target ? [clamp(c.x + c.s * target[0] < 960 ? 1300 : 620, 300, 1620), 230] : [960, 210];
        shot.plates.push(["p", beat.plate.text, beat.plate.sub || "", beat.plate.t, [r3((want[0] - c.x) / c.s), r3((want[1] - c.y) / c.s)], target]);
      }
      if (beat.bubble && inside(beat.bubble.t)) {
        const ba = actors.find((a) => a.cast === beat.bubble.cast && !a.crowd);
        if (ba) {
          const p = subjectPoint(ba, ba.move ? (ba.move * (beat.bubble.t - beat.t0)) / D : 0);
          shot.bubbles.push(["b", beat.bubble.text, beat.bubble.t, null, [r3(p.fx), r3(p.fb.t + (p.fb.b - p.fb.t) * 0.78)]]);
        }
      }
      const named = beat.focusT ?? beat.label?.t;
      if (sp0 && named !== undefined && inside(named) && frames[ci] !== "wide") shot.focusOn = { sprite: subjA.sprite, t: r3(named), out: r3(Math.min(c1 - 0.05, named + RULE.focusHold)) };
      if (beat.dark) shot.dark = Math.min(RULE.darkMax, beat.dark);
      if (beat.warm) shot.warm = true;
      if (beat.cool) shot.cool = true;
      if (beat.smoke) shot.smoke = true;
      if (beat.flash !== undefined && inside(beat.flash)) shot.flash = beat.flash;
      if (beat.shake !== undefined && inside(beat.shake)) shot.shake = { t: beat.shake, dur: 0.45, amp: hook ? 20 : 15 };
      if (beat.shake !== undefined && inside(beat.shake)) shot.roll = { t: beat.shake, deg: (shots.length % 2 ? -1 : 1) * (hook ? 11 : 8), hold: true };
      else if ((beat.dark || 0) >= 0.25 || frames[ci] === "pull") shot.roll = { t: c0, deg: (shots.length % 2 ? -1 : 1) * 1.2, dur: d };
      if (beat.bar && inside(beat.bar.t)) shot.bar = beat.bar;
      if (beat.endCard && ci === cuts.length - 1) shot.endCard = beat.endCard;
      shot.series = c0 >= plan.turnT && c0 < plan.recapT;
      shot.subject = sp0 ? subjA.sprite : null;
      shots.push(shot);
    });
  });
  return shots;
};
