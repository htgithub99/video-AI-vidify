// The scene spec: read what the AI returned, put it right where it is not reasonable (sizes, frame, ground, seats, things
// covering the subject, words the library does not have), and turn it into the scene page the engine draws. Nothing here
// adds anything the AI did not ask for; what cannot be shown right is left out, with a warning.
import { MOTION_SCENE_SPEC as S, MOTION_SCENE_SPEC_PROMPT as P } from "../constants/motionSceneSpec.js";
import { MOTION_AIR_DISTANCE, MOTION_OBJECT_SIZE as Z, motionObjectPlace } from "../constants/motionObjectSize.js";
import { MOTION_MASTER as M } from "../constants/motionMasterScale.js";
import { motionMasterBase, motionMasterTarget } from "./motionMasterScale.js";
import { MOTION_FIGURE_VOCAB as V } from "../constants/motionFigureVocabulary.js";
import { MOTION_SCENE_BLUEPRINT as B } from "../constants/motionSceneBlueprint.js";
import { motionCatalogEntryOf, motionCatalogGap, motionCatalogKinds, motionCatalogWord, type MotionCatalogGap } from "./motionObjectCatalog.js";
import { motionSceneBlueprint, motionSceneInteractPairs, type MotionCastLooks } from "./motionSceneBlueprint.js";
import { motionHtmlMarkId, motionHtmlRequired } from "./motionHtmlQuality.js";
import type { MotionSceneSpec, MotionSpecDevice, MotionSpecItem, MotionSpecKey } from "../types/motionSceneSpec.js";

type Ctx = { year?: number; template?: string; map?: boolean; castLooks?: MotionCastLooks; header?: string; gaps?: MotionCatalogGap[]; master?: number };
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(+v) ? +v : undefined);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list as readonly string[]).includes(String(v)) ? (v as T) : fallback;
const range = (v: unknown): [number, number] | undefined => (Array.isArray(v) && v.length === 2 && num(v[0]) != null && num(v[1]) != null ? [clamp(num(v[0])!, 0, 1), clamp(num(v[1])!, 0, 1)] : undefined);
const idOf = (v: unknown): string => String(v ?? "").toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// ---------- prompt ----------
const VOCAB = V.PERSON.values as Record<string, readonly string[]>;
const libraryLists = (year?: number) => {
  const kinds = motionCatalogKinds(year);
  const list = (s: string) => s.split(/,\s*/).filter(Boolean).join(" ");
  const other = ["armor", "beard", "shield", "bandage", "build", "view", "region"].map((key) => `${key}: ${(VOCAB[key] || []).join(" ")}`).join(" · ");
  return {
    pose: VOCAB.pose.join(" "),
    expression: VOCAB.expression.join(" "),
    outfit: VOCAB.outfit.join(" "),
    head: VOCAB.head.join(" "),
    hold: VOCAB.hold.join(" "),
    other,
    animals: sized(list(kinds.animal)),
    animalPose: (V.ANIMAL.values as Record<string, readonly string[]>).pose.join(" "),
    vehicles: sized(list(kinds.vehicle)),
    buildings: sized(list(kinds.building)),
    props: list(kinds.prop),
    flying: list(kinds.prop).split(" ").filter((id) => Z[id]?.place === "air").join(" "),
    trees: list(kinds.tree),
    walls: sized([...new Set([...list(kinds.wall).split(" "), "wagonFort"])].filter(Boolean).join(" ")),
    scatter: S.SCATTER.join(" "),
    effects: S.EFFECTS.join(" "),
  };
};
// A library list with each thing's real size against a standing person (height×length), for the big things.
const sized = (ids: string) => ids.split(" ").filter(Boolean).map((id) => (Z[id] ? `${id}(${n2(Z[id].h)}×${n2(Z[id].l)})` : id)).join(" ");
const n2 = (v: number) => (v >= 10 ? String(Math.round(v)) : String(+v.toFixed(2)));
const frameLine = (scene: { shot?: string; kind?: string }, ctx: { frame?: [number, number]; genre?: string; profile?: string; year?: number }): string => {
  const [w, h] = ctx.frame || [S.WIDTH, S.HEIGHT], m = motionMasterTarget({ frame: [w, h], shot: scene.shot, kind: scene.kind, genre: ctx.genre, profile: ctx.profile });
  return P.FRAME({ w, h, lead: `${m.px.lo}-${m.px.hi} px (target ${m.px.target} px)`, establish: m.shot === "ews", groundLo: Math.round(h * 0.74), groundHi: Math.round(h * 0.9), sizes: "person 1×0.6, rider on a horse 1.35×1.4; the size of each animal, vehicle, building and wall is next to its name in the LIBRARY" });
};
export const motionSceneSpecPrompt = (scene: { sceneTemplate?: string; shot?: string; kind?: string; devices?: string[]; drawingNote?: string }, ctx: { year?: number; map?: boolean; cast?: string; task?: string; frame?: [number, number]; language?: string; genre?: string; profile?: string }): string =>
  [
    ctx.task || P.ROLE,
    P.YEAR(ctx.year),
    ctx.language ? P.LANGUAGE(ctx.language) : undefined,
    ctx.task ? undefined : P.SCENE(scene.shot, scene.kind, scene.devices),
    ctx.cast,
    scene.sceneTemplate ? P.PLAN + scene.sceneTemplate : undefined,
    scene.drawingNote ? P.NOTE + scene.drawingNote : undefined,
    frameLine(scene, ctx),
    ctx.map ? P.MAP : P.SCHEMA,
    ctx.map ? undefined : P.DEVICES,
    ctx.map ? undefined : P.LIBRARY(libraryLists(ctx.year)),
    ctx.map ? undefined : P.STICKERS,
    ctx.map ? undefined : P.COMPOSITION,
  ]
    .filter(Boolean)
    .join("\n\n");

// ---------- reading ----------
const keyOf = (raw: unknown): MotionSpecKey | undefined => {
  if (!isObj(raw) || num(raw.at) == null) return undefined;
  const out: MotionSpecKey = { ...raw, at: clamp(num(raw.at)!, 0, 1) };
  for (const k of ["x", "y", "h", "facing"] as const) if (raw[k] != null) { const v = num(raw[k]); if (v == null) delete out[k]; else out[k] = v; }
  return out;
};
const itemOf = (raw: unknown, index: number): MotionSpecItem | undefined => {
  if (!isObj(raw)) return undefined;
  const fn = oneOf(S.FNS, raw.fn, "prop");
  const item: MotionSpecItem = { id: idOf(raw.id) || `${fn}_${index + 1}`, fn };
  if (raw.kind != null) item.kind = String(raw.kind);
  for (const k of ["x", "y", "h", "w", "facing", "from", "to", "z"] as const) { const v = num(raw[k]); if (v != null) item[k] = v; }
  if (Array.isArray(raw.gaps)) { const gaps = raw.gaps.map((g) => (Array.isArray(g) ? [num(g[0]), num(g[1])] : [])).filter((g): g is [number, number] => g.length === 2 && g[0] != null && g[1] != null && g[1] > g[0]); if (gaps.length) item.gaps = gaps.slice(0, 6); }
  if (isObj(raw.look)) item.look = { ...raw.look };
  // A thing in the air: how far it is (its size follows); an aircraft parked or a rocket on its pad (a pose).
  if (S.DISTANCES.includes(String(raw.dist))) item.dist = String(raw.dist) as MotionSpecItem["dist"];
  if (typeof raw.pose === "string" && fn !== "person" && !item.look?.pose) item.look = { ...(item.look || {}), pose: raw.pose };
  if (Array.isArray(raw.keys)) item.keys = raw.keys.map(keyOf).filter((k): k is MotionSpecKey => !!k).sort((a, b) => a.at - b.at);
  if (isObj(raw.group) && num(raw.group.count)! > 1) item.group = { count: Math.round(clamp(num(raw.group.count)!, 2, 40)), width: num(raw.group.width), rows: num(raw.group.rows), depth: num(raw.group.depth) };
  if (raw.mount != null) item.mount = String(raw.mount);
  if (isObj(raw.mountLook)) item.mountLook = { ...raw.mountLook };
  if (raw.on != null) item.on = idOf(raw.on);
  if (raw.focal === true) item.focal = true;
  if (range(raw.fade)) item.fade = range(raw.fade);
  if (range(raw.at)) item.at = range(raw.at);
  if (raw.burning === true) item.burning = true;
  if (raw.heldBy != null) item.heldBy = idOf(raw.heldBy);
  if (raw.hand === "back" || raw.hand === "front") item.hand = raw.hand;
  if (typeof raw.code === "string") item.code = raw.code;
  return item;
};
const deviceOf = (raw: unknown): MotionSpecDevice | undefined => {
  if (!isObj(raw) || !(S.DEVICES as readonly string[]).includes(String(raw.kind))) return undefined;
  const d: MotionSpecDevice = { kind: raw.kind as MotionSpecDevice["kind"] };
  if (raw.of != null) d.of = idOf(raw.of);
  for (const k of ["x", "y", "r", "zoom", "facing", "w", "h"] as const) { const v = num(raw[k]); if (v != null) d[k] = v; }
  if (range(raw.at)) d.at = range(raw.at);
  if (raw.sign != null) d.sign = oneOf(S.SIGNS, raw.sign, "alarm");
  if (raw.part === "hand" || raw.part === "head" || raw.part === "body") d.part = raw.part;
  if (raw.body === "moon" || raw.body === "sun") d.body = raw.body;
  if (Array.isArray(raw.groups)) d.groups = raw.groups.filter(isObj).map((g) => ({ n: Math.max(1, num(g.n) || 1), color: typeof g.color === "string" ? g.color : undefined }));
  if (Array.isArray(raw.items)) d.items = raw.items.map(itemOf).filter((it): it is MotionSpecItem => !!it && it.fn !== "sticker");
  return d;
};
const points = (v: unknown): [number, number][][] => (Array.isArray(v) ? v.map((line) => (Array.isArray(line) ? line.filter((p) => Array.isArray(p) && num(p[0]) != null && num(p[1]) != null).map((p) => [num(p[0])!, num(p[1])!] as [number, number]) : [])).filter((line) => line.length >= 2) : []);
// Reads what the AI returned into a spec, or throws when it is not one (no items, no map).
export const motionSceneSpecRead = (raw: unknown, frame?: [number, number]): MotionSceneSpec => {
  const src = isObj(raw) && isObj(raw.spec) ? raw.spec : raw;
  if (!isObj(src)) throw new Error(S.PARSE_ERROR);
  const items = (Array.isArray(src.items) ? src.items : []).map(itemOf).filter((it): it is MotionSpecItem => !!it);
  const mapRaw = isObj(src.map) ? src.map : undefined;
  if (!items.length && !mapRaw && !isObj(src.headline)) throw new Error(S.PARSE_ERROR);
  const spec: MotionSceneSpec = {
    version: S.VERSION,
    horizon: clamp(num(src.horizon) ?? (frame?.[1] || S.HEIGHT) * 0.42, S.HORIZON[0], (frame?.[1] || S.HEIGHT) * 0.78),
    time: oneOf(S.TIMES, src.time, "day"),
    ground: oneOf(S.GROUNDS, src.ground, "dirt"),
    ridge: src.ridge === "none" || src.ridge === "hills" ? src.ridge : "low",
    items,
  };
  if (frame) spec.frame = frame;
  if (isObj(src.headline) && Array.isArray(src.headline.lines)) {
    const h = src.headline;
    spec.headline = { lines: (h.lines as unknown[]).map((l) => String(l).slice(0, 40)).filter(Boolean).slice(0, 3), x: num(h.x) ?? 60, y: num(h.y) ?? 120, size: clamp(num(h.size) ?? 90, 30, 220), align: h.align === "center" || h.align === "right" ? h.align : "left", accent: typeof h.accent === "string" ? h.accent : undefined, color: typeof h.color === "string" ? h.color : undefined, tilt: clamp(num(h.tilt) ?? -4, -12, 12) };
  }
  if (isObj(src.interior)) spec.interior = { wall: String(src.interior.wall || "#b8a98a"), floor: String(src.interior.floor || "#8a7356") };
  if (isObj(src.sky)) spec.sky = { clouds: clamp(num(src.sky.clouds) ?? 3, 0, 8), birds: src.sky.birds === true, sun: src.sky.sun !== false, sunX: num(src.sky.sunX) };
  if (Array.isArray(src.water)) spec.water = src.water.filter(isObj).map((w) => ({ kind: oneOf(S.WATER, w.kind, "river"), y: num(w.y)!, h: num(w.h) ?? 60 })).filter((w) => w.y != null);
  if (Array.isArray(src.scatter)) spec.scatter = src.scatter.filter(isObj).filter((s) => (S.SCATTER as readonly string[]).includes(String(s.kind))).map((s) => ({ kind: String(s.kind), count: Math.round(clamp(num(s.count) ?? 6, 0, 30)), area: Array.isArray(s.area) && s.area.length === 4 && s.area.every((v) => num(v) != null) ? (s.area.map((v) => num(v)) as [number, number, number, number]) : undefined }));
  if (isObj(src.haze)) spec.haze = { kind: src.haze.kind === "smoke" || src.haze.kind === "mist" ? src.haze.kind : "dust", amount: clamp(num(src.haze.amount) ?? 0.2, 0, 1), at: range(src.haze.at), frontOf: num(src.haze.frontOf) };
  if (Array.isArray(src.effects)) spec.effects = src.effects.filter(isObj).filter((e) => (S.EFFECTS as readonly string[]).includes(String(e.kind)) && num(e.x) != null && num(e.y) != null).map((e) => ({ kind: String(e.kind), x: num(e.x)!, y: num(e.y)!, r: clamp(num(e.r) ?? 40, 6, 300), at: range(e.at), facing: num(e.facing) }));
  const devices = [...(Array.isArray(src.devices) ? src.devices : []), ...(Array.isArray(src.insets) ? src.insets.map((n) => (isObj(n) ? { kind: "inset", ...n } : n)) : [])];
  if (devices.length) spec.devices = devices.map(deviceOf).filter((d): d is MotionSpecDevice => !!d);
  if (mapRaw) {
    spec.map = {
      paper: typeof mapRaw.paper === "string" ? mapRaw.paper : undefined,
      land: points(mapRaw.land),
      water: points(mapRaw.water),
      rivers: points(mapRaw.rivers),
      places: (Array.isArray(mapRaw.places) ? mapRaw.places : []).filter(isObj).filter((p) => num(p.x) != null && num(p.y) != null && p.name).map((p) => ({ name: String(p.name).slice(0, 40), ...(S.PLACE_TYPES.includes(String(p.type)) ? { type: String(p.type) as never } : {}), x: num(p.x)!, y: num(p.y)!, big: p.big === true })),
      forces: (Array.isArray(mapRaw.forces) ? mapRaw.forces : []).filter(isObj).filter((f) => num(f.x) != null && num(f.y) != null).map((f, i) => ({ id: idOf(f.id) || `force_${i + 1}`, side: String(f.side || ""), color: typeof f.color === "string" ? f.color : undefined, x: num(f.x)!, y: num(f.y)!, size: num(f.size), keys: Array.isArray(f.keys) ? f.keys.filter(isObj).filter((k) => num(k.at) != null && num(k.x) != null && num(k.y) != null).map((k) => ({ at: clamp(num(k.at)!, 0, 1), x: num(k.x)!, y: num(k.y)! })) : undefined })),
      arrows: (Array.isArray(mapRaw.arrows) ? mapRaw.arrows : []).filter(isObj).filter((a) => points([[a.from, a.to]])[0]?.length === 2).map((a) => ({ from: points([[a.from, a.to]])[0][0], to: points([[a.from, a.to]])[0][1], color: typeof a.color === "string" ? a.color : undefined, at: range(a.at), curve: num(a.curve) })),
    };
  }
  return spec;
};

// ---------- fixing ----------
const aspectOf = (it: MotionSpecItem): number => (it.mount ? S.ASPECT.rider : S.ASPECT[it.fn] ?? 1);
const IDENTITY = ["outfit", "top", "trim", "pants", "boots", "hair", "hairColor", "beard", "skin", "build", "region", "cape", "robe", "armor", "coat", "tunic", "sleeve", "belt", "wrap"];
// The state of an item at progress p (numbers glide between keys as the engine does; enough for checks).
const at = (it: MotionSpecItem, p: number): { x: number; y: number; h: number } => {
  let x = it.x ?? 0, y = it.y ?? 0, h = it.h ?? 0;
  const keys = it.keys || [];
  if (keys.length) {
    const frames: { at: number; x: number; y: number; h: number }[] = [];
    for (const k of keys) { const prev = frames[frames.length - 1] || { x, y, h }; frames.push({ at: k.at, x: k.x ?? prev.x, y: k.y ?? prev.y, h: k.h ?? prev.h }); }
    let i = 0;
    while (i + 1 < frames.length && p >= frames[i + 1].at) i++;
    const a = frames[i], b = frames[i + 1];
    const k = b ? clamp((p - a.at) / (b.at - a.at || 1e-6), 0, 1) : 0, s = k * k * (3 - 2 * k);
    x = b ? a.x + (b.x - a.x) * s : a.x; y = b ? a.y + (b.y - a.y) * s : a.y; h = b ? a.h + (b.h - a.h) * s : a.h;
  }
  return { x, y, h };
};
const boxAt = (it: MotionSpecItem, p: number) => {
  const s = at(it, p), w = (it.w ?? s.h * aspectOf(it)) + (it.group ? (it.group.width ?? s.h * aspectOf(it) * it.group.count * 0.6) : 0);
  if (it.fn === "wall" && it.from != null && it.to != null) return { x0: Math.min(it.from, it.to), x1: Math.max(it.from, it.to), y0: s.y - s.h, y1: s.y };
  return { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - s.h, y1: s.y };
};
const shown = (it: MotionSpecItem, p: number) => !(it.at && (p < it.at[0] || p > it.at[1])) && !(it.fade && p > it.fade[1]);
// Further back by factor k (< 1) towards the horizon: ground point closer to it, smaller (the depth of the scene kept).
const back = (it: MotionSpecItem, horizon: number, k: number) => {
  const Y = (y: number) => horizon + (y - horizon) * k;
  if (it.y != null) it.y = Y(it.y);
  if (it.h != null) it.h *= k;
  if (it.w != null) it.w *= k;
  it.keys?.forEach((q) => { if (q.y != null) q.y = Y(q.y); if (q.h != null) q.h *= k; });
};
const shift = (it: MotionSpecItem, dx: number) => {
  if (it.x != null) it.x += dx;
  if (it.from != null) it.from += dx;
  if (it.to != null) it.to += dx;
  it.keys?.forEach((k) => { if (k.x != null) k.x += dx; });
};
// A word the library has, under its own name, another name of the same thing, or a near thing of the same period.
const resolveKind = (fn: string, kind: string, year?: number): { kind?: string; near?: boolean } => {
  if (fn === "wall" && (S.WALL_KINDS as readonly string[]).includes(kind)) return { kind };
  // A wall named by another of its names (stakes, an earthen bank) is the library thing drawn along the wall.
  if (fn === "wall") { const entry = motionCatalogEntryOf("prop", kind); if (entry && (S.WALL_KINDS as readonly string[]).includes(entry.id) && !motionCatalogGap("prop", entry.id, undefined, year)) return { kind: entry.id }; }
  if (!motionCatalogGap(fn as never, kind, undefined, year)) return { kind };
  const word = motionCatalogWord(kind);
  const near = Object.entries(S.NEAR).find(([k]) => motionCatalogWord(k) === word || motionCatalogWord(k) + "s" === word)?.[1];
  if (near && (fn === "wall" ? (S.WALL_KINDS as readonly string[]).includes(near) : !motionCatalogGap(fn as never, near, undefined, year))) return { kind: near, near: true };
  return {};
};
// The fixer's lines split into what the scene really lacks (a thing left out, a required thing missing, a scene laid out
// by code: shown on the scene) and what code put right on its own (notes, kept for the log and the tooltip). Old scenes
// stored both together, so the split reads the lines themselves.
export const motionSceneSpecSplit = (lines: readonly string[] = []): { issues: string[]; notes: string[] } => ({
  issues: lines.filter((line) => S.ISSUE.test(line)),
  notes: lines.filter((line) => !S.ISSUE.test(line)),
});
// Puts the spec right where it is not reasonable. Returns the warnings (what was repaired or left out).
export const motionSceneSpecFix = (spec: MotionSceneSpec, ctx: Ctx = {}): string[] => {
  const warn: string[] = [];
  const W = spec.frame?.[0] || S.WIDTH, H = spec.frame?.[1] || S.HEIGHT, H0 = spec.horizon;
  if (ctx.header) spec.header = ctx.header;
  if (spec.map) return warn;
  // Words the library does not have: a near thing of the same period, or left out.
  spec.items = spec.items.filter((it) => {
    if (it.fn === "sticker" || it.fn === "person" || it.fn === "bridge") return true;
    if (!it.kind) { if (it.fn === "animal") { it.kind = "horse"; return true; } warn.push(S.WARN.DROPPED_KIND(it.id, it.fn)); return false; }
    const r = resolveKind(it.fn, it.kind, ctx.year);
    if (!r.kind) { warn.push(S.WARN.DROPPED_KIND(it.id, it.kind)); ctx.gaps?.push(motionCatalogGap(it.fn as never, it.kind, undefined, ctx.year) || { fn: it.fn as never, kind: it.kind, reason: "unknown" }); return false; }
    if (r.near) warn.push(S.WARN.NEAR_KIND(it.id, it.kind, r.kind));
    it.kind = r.kind;
    return true;
  });
  for (const it of spec.items) if (it.mount) { const r = resolveKind("animal", it.mount, ctx.year); if (r.kind) it.mount = r.kind; else delete it.mount; }
  // Named people keep their look in every scene (only a stated change differs).
  for (const it of spec.items) {
    if (it.fn !== "person" || !ctx.castLooks) continue;
    const look = ctx.castLooks[it.id];
    if (!look) continue;
    it.look = { ...(it.look || {}), ...Object.fromEntries(Object.entries(look).filter(([k]) => IDENTITY.includes(k))) };
  }
  // Stickers: only big enough, and only for what the library does not have.
  spec.items = spec.items.filter((it) => {
    if (it.fn !== "sticker") return true;
    const size = Math.max(it.w ?? 0, it.h ?? 0);
    const known = !!it.kind && !motionCatalogGap("prop", it.kind, undefined, ctx.year);
    if (size < S.STICKER_MIN || known || !it.code) { warn.push(S.WARN.STICKER(it.id)); return false; }
    return true;
  });
  const ids = new Set(spec.items.map((it) => it.id));
  // Ground: nothing stands in the sky; seats must exist.
  for (const it of spec.items) {
    if (it.fn === "sticker" && it.heldBy) { if (!ids.has(it.heldBy)) delete it.heldBy; continue; }
    if (it.y == null && it.keys?.[0]?.y == null) it.y = H0 + (H - H0) * 0.6;
    if (it.h == null || !(it.h > 0)) it.h = (H - H0) * 0.4;
    const low = H0 + 2;
    // What flies stays in the air: a thing on its way through the sky (an arrow, a thrown stone: keys that move it) or a
    // thing that flies by nature (a bird, an airship).
    const flies = (it.keys || []).filter((k) => k.y != null || k.x != null).length >= 2 || motionObjectPlace(it.kind, it.look?.pose as string | undefined) === "air";
    if (!flies && (it.y ?? low) < low && !spec.interior) { it.y = low + 4; warn.push(S.WARN.GROUNDED(it.id)); }
    if (!flies) it.keys?.forEach((k) => { if (k.y != null && k.y < low && !spec.interior) k.y = low + 4; });
    if (it.on && (!ids.has(it.on) || it.on === it.id)) { delete it.on; warn.push(S.WARN.SEAT(it.id)); }
  }
  // Sizes: against a person at the same depth (the AI's own perspective: the people nearest in depth, else the master
  // frame's person on the ground band) and the real size table of the library. Only what is clearly out of proportion
  // is changed; things that vary in nature get more room, small things held in a hand less. A thing in the air is sized
  // by its distance against the focal person, never by its height on the screen.
  const people = spec.items.filter((it) => it.fn === "person" && (it.h ?? 0) > 0 && (it.y ?? 0) > H0 + 4).map((it) => ({ y: it.y!, h: it.h! / (it.mount ? S.RIDER : 1) }));
  const masterH = (ctx.master ?? M.GENRE.default) * motionMasterBase([W, H]), groundY = H0 + (H - H0) * 0.82;
  const focalThing = spec.items.find((it) => it.focal && it.fn !== "person" && it.kind && Z[it.kind] && (it.h ?? 0) > 0 && (it.y ?? 0) > H0 + 4);
  const thingRef = focalThing ? { y: focalThing.y!, person: focalThing.h! / Z[focalThing.kind!].h } : undefined;
  const personAt = (y: number): number | undefined => {
    const near = people.filter((q) => Math.abs(q.y - y) <= Math.max(24, (q.y - H0) * S.DEPTH_BAND)).sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0];
    if (near) return (near.h * (y - H0)) / (near.y - H0);
    if (people.length || y <= H0 + 4) return undefined;
    // No one in the scene: the focal thing (a ship, a plane) sets the scale (a person at its depth, from its real size),
    // else the master frame's person on the ground band.
    if (thingRef) return (thingRef.person * (y - H0)) / (thingRef.y - H0);
    return (masterH * (y - H0)) / (groundY - H0);
  };
  const leadH = Math.max(0, ...people.map((q) => q.h)) || masterH;
  for (const it of spec.items) {
    if (it.fn === "sticker" || it.heldBy || it.fn === "person" || spec.interior || !it.kind || !Z[it.kind] || it === focalThing) continue;
    const real = Z[it.kind], place = motionObjectPlace(it.kind, it.look?.pose as string | undefined);
    let want: number | undefined;
    if (place === "air") want = it.dist ? leadH * real.h * MOTION_AIR_DISTANCE[it.dist] : undefined;
    else if (place === "held") {
      // A small thing of the hand stands where a hand is (not on the ground): sized against the person closest to it.
      const x = it.x ?? it.keys?.[0]?.x ?? 0, y = it.y ?? it.keys?.[0]?.y ?? 0;
      const by = spec.items.filter((o) => o.fn === "person" && (o.h ?? 0) > 0 && o.x != null).sort((a, b) => Math.hypot(a.x! - x, (a.y ?? 0) - y) - Math.hypot(b.x! - x, (b.y ?? 0) - y))[0];
      want = by ? (by.h! / (by.mount ? S.RIDER : 1)) * real.h : undefined;
    } else {
      const y = it.y ?? it.keys?.[0]?.y;
      const person = y != null && y > H0 + 4 ? personAt(y) : undefined;
      want = person ? person * real.h : undefined;
    }
    if (!want) continue;
    const tol = S.LOOSE.includes(it.kind) || it.fn === "tree" ? S.SIZE_TOLERANCE_LOOSE : real.place === "held" ? S.SIZE_TOLERANCE_SMALL : S.SIZE_TOLERANCE;
    const k = (it.h ?? 0) / want;
    if (k > tol || k < 1 / tol) { warn.push(S.WARN.RESIZED(it.id, it.h ?? 0, want)); it.h = want; it.keys?.forEach((kk) => { if (kk.h != null) kk.h = want; }); }
  }
  if (ctx.master) spec.master = ctx.master;
  // One focal subject.
  const required = ctx.template ? motionHtmlRequired(ctx.template) : [];
  let focal = spec.items.filter((it) => it.focal);
  if (focal.length !== 1) {
    const pick = focal[0] || spec.items.find((it) => required.some((r) => r.focal && r.id === it.id)) || spec.items.filter((it) => it.fn === "person").sort((a, b) => (b.h ?? 0) - (a.h ?? 0))[0];
    spec.items.forEach((it) => delete it.focal);
    if (pick) { pick.focal = true; if (!focal.length) warn.push(S.WARN.FOCUS(pick.id)); }
    focal = pick ? [pick] : [];
  }
  spec.focus = focal[0]?.id;
  const pairs = motionSceneInteractPairs(ctx.template);
  if (pairs.length) spec.pairs = pairs;
  const together = (a: MotionSpecItem, b: MotionSpecItem) => pairs.some(([x, y]) => (x === motionHtmlMarkId(a.id) && y === motionHtmlMarkId(b.id)) || (y === motionHtmlMarkId(a.id) && x === motionHtmlMarkId(b.id)));
  // Frame: the focal subject and what the plan requires stay inside the frame (set dressing may be cut by the edge).
  for (const it of spec.items) {
    if (it.fn === "sticker" || it.heldBy || it.fn === "wall" || !(it.focal || required.some((r) => r.id === it.id))) continue;
    const w = (it.w ?? (it.h ?? 0) * aspectOf(it)) + (it.group ? (it.group.width ?? 0) : 0);
    const half = Math.min(w / 2, W / 2);
    const moving = !it.focal && it.keys?.some((k) => k.x != null);
    let moved = false;
    const pull = (x: number) => { const v = clamp(x, half * 0.85, W - half * 0.85); if (v !== x) moved = true; return v; };
    if (it.x != null && !moving) it.x = pull(it.x);
    // A mover keeps its way in and out; only the keys between are pulled in.
    it.keys?.forEach((k, i, all) => { if (k.x != null && (!moving || (i > 0 && i < all.length - 1))) k.x = pull(k.x); });
    if (moved) warn.push(S.WARN.INTO_FRAME(it.id));
  }
  // Nothing drawn in front of the focal subject (or of a required thing) may cover it for most of the scene: moved back
  // or aside, else left out. People are never moved off a thing (a man at his whetstone, a soldier on the bridge: they
  // stand at it on purpose), nor is the focal subject or another required thing moved for a mere thing; a thing that
  // only passes over another (a flying stone) does not cover it.
  const isRequired = (it: MotionSpecItem) => required.some((r) => r.id === it.id);
  const protect = spec.items.filter((it) => it.focal || (isRequired(it) && it.fn !== "person"));
  for (const target of protect) {
    for (const other of [...spec.items]) {
      if (other === target || other.heldBy || other.on === target.id || target.on === other.id || other.fn === "sticker" || together(other, target)) continue;
      if (!target.focal && (other.fn === "person" || other.focal || isRequired(other))) continue;
      const front = (p: number) => (other.z ?? at(other, p).y) > (target.z ?? at(target, p).y);
      const cover = (p: number) => {
        if (!shown(other, p) || !shown(target, p) || !front(p)) return 0;
        const a = boxAt(target, p), b = boxAt(other, p);
        const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)), iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
        return (ix * iy) / Math.max(1, (a.x1 - a.x0) * (a.y1 - a.y0));
      };
      // How much it covers for most of the scene (the median of the samples).
      const worst = () => S.SAMPLES.map(cover).sort((u, v) => u - v)[S.SAMPLES.length >> 1];
      if (worst() <= S.COVER_MAX) continue;
      // Try further back (behind the subject, smaller: the picture's relations kept), then aside (the nearer side first),
      // then left out.
      const p = S.SAMPLES.reduce((best, s) => (cover(s) > cover(best) ? s : best), 0);
      const behind = at(target, p).y - Math.max(4, at(target, p).h * 0.04), from = at(other, p).y;
      if (other.fn !== "wall" && !other.group && from - H0 > 1 && behind - H0 > 12) {
        const k = (behind - H0) / (from - H0);
        back(other, H0, k);
        if (worst() <= S.COVER_MAX) { warn.push(S.WARN.MOVED_BACK(other.id, target.id)); continue; }
        back(other, H0, 1 / k);
      }
      const a = boxAt(target, p), b = boxAt(other, p);
      const tries = [(b.x0 + b.x1) / 2 < (a.x0 + a.x1) / 2 ? a.x0 - b.x1 - 8 : a.x1 - b.x0 + 8, (b.x0 + b.x1) / 2 < (a.x0 + a.x1) / 2 ? a.x1 - b.x0 + 8 : a.x0 - b.x1 - 8];
      let done = false;
      for (const dx of tries) {
        shift(other, dx);
        const box = boxAt(other, 0.5);
        if (worst() <= S.COVER_MAX && (other.keys?.some((k) => k.x != null) || (box.x1 > 0 && box.x0 < W))) { warn.push(S.WARN.MOVED(other.id, target.id)); done = true; break; }
        shift(other, -dx);
      }
      if (!done && !required.some((r) => r.id === other.id)) {
        spec.items = spec.items.filter((it) => it !== other && it.heldBy !== other.id);
        warn.push(S.WARN.DROPPED_COVER(other.id, target.id));
      }
    }
  }
  // Light effects only; insets only of something clear.
  if (spec.haze && spec.haze.amount > S.HAZE_MAX) { spec.haze.amount = S.HAZE_MAX; warn.push(S.WARN.HAZE); }
  if (spec.devices) {
    const present = new Set(spec.items.map((it) => it.id));
    spec.devices = spec.devices.filter((d) => {
      if (d.of && !present.has(d.of) && d.kind !== "impact" && d.kind !== "count" && d.kind !== "time") return false;
      if (d.kind === "inset") {
        const of = spec.items.find((it) => it.id === d.of);
        // A close-up is of a person: their face, or the small thing at their hand drawn large on its own (the engine picks
        // it, and shows the face when there is none). A magnified piece of the body reads as a blur of shapes.
        if (!of || of.fn !== "person" || of.group) { warn.push(S.WARN.INSET(String(d.of))); return false; }
        if (d.part !== "head") d.part = "hand";
      }
      return true;
    });
  }
  const missing = required.map((r) => r.id).filter((id) => !spec.items.some((it) => it.id === id));
  if (missing.length) warn.push(S.WARN.MISSING(missing));
  return warn;
};

// Records the look of each named person the first time a scene shows them (later scenes keep it).
export const motionSceneSpecCastLearn = (looks: MotionCastLooks, spec: MotionSceneSpec): void => {
  const flag = B.CAST_SEED.FLAG;
  for (const it of spec.items) {
    if (it.fn !== "person" || it.group || !it.look) continue;
    const seed = looks[it.id]?.[flag] ? looks[it.id] : undefined;
    if (looks[it.id] && !seed) continue;
    const look = Object.fromEntries(Object.entries(it.look).filter(([k, v]) => IDENTITY.includes(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean"))) as Record<string, string | number | boolean>;
    if (Object.keys(look).length) looks[it.id] = { ...look, ...Object.fromEntries(Object.entries(seed || {}).filter(([k]) => k !== flag)) };
  }
};

// ---------- fallback ----------
// A plain scene laid out by code from the plan (REQUIRED, setting, motion), used when the AI gives no usable spec.
export const motionSceneSpecFallback = (template: string | undefined, input: { shot?: string; kind?: string; frame?: [number, number] }): MotionSceneSpec | undefined => {
  const plan = motionSceneBlueprint(template, input);
  if (!plan) return undefined;
  // The blueprint lays the scene out on the 1280 x 720 frame; another frame spreads it across its own width and height
  // and keeps every thing's shape (one scale for sizes).
  const W = input.frame?.[0] || S.WIDTH, H = input.frame?.[1] || S.HEIGHT;
  const sx = W / S.WIDTH, sy = H / S.HEIGHT, sz = Math.min(sx, sy);
  const H0 = Math.round((plan.groundY - 3.6 * plan.r) * sy);
  const items: MotionSpecItem[] = plan.items.map((b) => {
    const fn: MotionSpecItem["fn"] = b.fn === "crowd" ? "person" : (b.fn as MotionSpecItem["fn"]);
    const unit = B.BOX[b.kind || ""] || B.BOX[b.fn === "crowd" ? "person" : b.fn] || B.BOX.prop;
    const h = Math.round(unit[0] * b.size * sz);
    const item: MotionSpecItem = { id: b.id, fn, x: Math.round(b.x * sx), y: Math.round(b.y * sy), h, facing: b.facing, focal: b.focal || undefined };
    if (b.kind && fn !== "person") item.kind = b.kind;
    if (b.fn === "crowd") item.group = { count: b.count || 6, width: b.spread ? Math.round(b.spread * sx) : h * 3, rows: 2 };
    if (b.travelFrom != null) item.keys = [{ at: 0, x: Math.round(b.travelFrom * sx) }, { at: 1, x: Math.round(b.x * sx) }];
    if (b.look) item.look = Object.fromEntries(Object.entries(b.look).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
    return item;
  });
  return { version: S.VERSION, ...(input.frame ? { frame: input.frame } : {}), horizon: Math.max(S.HORIZON[0] * sy, H0), time: (S.TIMES as readonly string[]).includes(plan.time) ? (plan.time as MotionSceneSpec["time"]) : "day", ground: (S.GROUNDS as readonly string[]).includes(plan.ground) ? (plan.ground as MotionSceneSpec["ground"]) : "dirt", ridge: "low", sky: { clouds: 3, sun: true }, haze: plan.mist ? { kind: "mist", amount: 0.25 } : undefined, items };
};

// ---------- page ----------
export const motionSceneSpecPage = (spec: MotionSceneSpec): string => S.PAGE(JSON.stringify(spec).replace(/</g, "\\u003c"));
export const motionSceneSpecOf = (html: string | undefined): MotionSceneSpec | undefined => {
  const m = html?.match(S.SPEC_DATA);
  if (!m) return undefined;
  try {
    return JSON.parse(m[1]) as MotionSceneSpec;
  } catch {
    return undefined;
  }
};
export const motionIsSpecPage = (html: string | undefined): boolean => !!html && S.PAGE_MARK.test(html);
