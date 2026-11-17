import { MOTION_SCENE_BLUEPRINT as B, type MotionBlueprintFn } from "../constants/motionSceneBlueprint.js";
import { MOTION_HTML_QUALITY as Q } from "../constants/motionHtmlQuality.js";
import { motionHtmlMarkId } from "./motionHtmlQuality.js";
import type { MotionHtmlMark } from "../types/motionHtmlScene.js";

interface MotionBlueprintItem {
  id: string;
  focal: boolean;
  fn: MotionBlueprintFn;
  kind?: string;
  x: number;
  y: number;
  size: number;
  sizeKey: "r" | "p";
  facing: 1 | -1;
  target?: string;
  owner?: string;
  travelFrom?: number;
  count?: number;
  spread?: number;
  // The plan's FIGURES options for this id (a value per phase when it changes: pose sit -> stand).
  look?: Record<string, string | string[] | true>;
}
interface MotionSceneBlueprint {
  shot: string;
  groundY: number;
  r: number;
  map: boolean;
  time: string;
  ground: string;
  mist: boolean;
  // True when the plan itself named who acts on whom (INTERACT line); only then is a drawing checked against the pairs.
  explicit: boolean;
  items: MotionBlueprintItem[];
}
interface Draft {
  id: string;
  focal: boolean;
  fn: MotionBlueprintFn;
  kind?: string;
  wide?: boolean;
}
const classify = (id: string): Pick<Draft, "fn" | "kind" | "wide"> => {
  const hit = B.KINDS.find((row) => row.re.test(id.replace(/[-_]+/g, " ")));
  return hit ? { fn: hit.fn, kind: hit.kind, wide: hit.wide } : { fn: "person" };
};
const drafts = (template: string): Draft[] => {
  const line = template.match(Q.REQUIRED_LINE)?.[1];
  // A plan without a REQUIRED line still gets a usable layout: one lead figure plus the first group, vehicle and building it names.
  if (!line) {
    if (!template.trim()) return [];
    const found = (fn: MotionBlueprintFn) => B.KINDS.find((row) => row.fn === fn && row.re.test(template));
    const extras = (["crowd", "vehicle", "building"] as const).map(found).filter((row): row is (typeof B.KINDS)[number] => !!row);
    return [{ id: B.LEAD, focal: true, fn: "person" }, ...extras.map((row) => ({ id: template.match(row.re)![0].toLowerCase().replace(/[^a-z0-9]+/g, ""), focal: false, fn: row.fn, kind: row.kind, wide: row.wide }))];
  }
  const seen = new Set<string>();
  return line
    .split(Q.REQUIRED_SEP)
    .map((part) => part.match(Q.REQUIRED_ITEM))
    .flatMap((match) => {
      const id = match && motionHtmlMarkId(match[1]);
      if (!id || seen.has(id)) return [];
      seen.add(id);
      return [{ id, focal: match[2]?.toLowerCase() === Q.FOCAL, ...classify(id) }];
    });
};
// The plan's FIGURES line ("FIGURES: you: person, outfit soldier, hold crossbow, pose sit -> stand; ..."): each id's options
// in the figure vocabulary's words; a value that changes by phase is a list.
export const motionSceneFigures = (template: string): Record<string, Record<string, string | string[] | true>> => {
  const line = template.match(B.FIGURES_LINE)?.[1] || "";
  const out: Record<string, Record<string, string | string[] | true>> = {};
  for (const entry of line.split(/\s*;\s*/)) {
    const at = entry.indexOf(":");
    if (at <= 0) continue;
    const id = motionHtmlMarkId(entry.slice(0, at));
    const look: Record<string, string | string[] | true> = {};
    for (const part of entry.slice(at + 1).split(/\s*,\s*/).slice(1)) {
      const words = part.trim().split(/\s+/);
      if (!words[0] || !/^[a-z][A-Za-z]*$/.test(words[0])) continue;
      const value = words.slice(1).join(" ");
      look[words[0]] = !value ? true : value.includes("->") ? value.split(/\s*->\s*/) : value;
    }
    if (id) out[id] = look;
  }
  return out;
};
const pairsOf = (template: string, ids: Set<string>): [string, string][] => {
  const line = template.match(B.INTERACT_LINE)?.[1] || "";
  return [...line.matchAll(B.INTERACT_PAIR)].map((match) => [motionHtmlMarkId(match[1]), motionHtmlMarkId(match[2])] as [string, string]).filter(([from, to]) => from !== to && ids.has(from) && ids.has(to));
};
const pick = (rows: readonly (readonly [string, RegExp])[], text: string, fallback: string) => rows.find(([, re]) => re.test(text))?.[0] ?? fallback;
const round = (value: number) => Math.round(value);
// Spreads one depth row across the frame: items keep their order, are centred, and shrink together when they would not fit.
const spread = (widths: number[], gap: number, centre: number): { xs: number[]; scale: number } => {
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
  const scale = total > B.MAX_SPAN ? Math.max(B.MIN_SCALE, B.MAX_SPAN / total) : 1;
  let cursor = centre - (total * scale) / 2;
  const xs = widths.map((width) => {
    const x = cursor + (width * scale) / 2;
    cursor += (width + gap) * scale;
    return Math.min(B.WORLD.right, Math.max(B.WORLD.left, x));
  });
  return { xs, scale };
};
// Places a rear row left and right of the near group (outside its half-width "clear"), so nothing important hides behind it.
const flank = (widths: number[], gap: number, clear: number): { xs: number[]; scale: number } => {
  const room = Math.max(1, B.WORLD.centre - B.WORLD.left - clear);
  const sides = [0, 0];
  const need = widths.reduce((most, width, at) => Math.max(most, (sides[at % 2] += width + gap)), 0);
  const scale = need > room ? Math.max(B.MIN_SCALE, room / need) : 1;
  const used = [0, 0];
  const xs = widths.map((width, at) => {
    const side = at % 2 ? -1 : 1;
    const x = B.WORLD.centre + side * (clear + gap + used[at % 2] + (width * scale) / 2);
    used[at % 2] += (width + gap) * scale;
    return Math.min(B.WORLD.right, Math.max(B.WORLD.left, x));
  });
  return { xs, scale };
};
export const motionSceneShot = (shot?: string): string => {
  const key = String(shot || "").toLowerCase();
  return B.SHOTS[key] ? key : B.SHOT_ALIAS[key] || B.DEFAULT_SHOT;
};
export const motionSceneBlueprint = (template: string | undefined, input: { shot?: string; kind?: string; focalMin?: number } = {}): MotionSceneBlueprint | undefined => {
  const text = template || "";
  const list = drafts(text);
  if (!list.length) return undefined;
  if (!list.some((item) => item.focal)) list[0].focal = true;
  const map = String(input.kind || "").toLowerCase() === "map";
  const shot = motionSceneShot(input.shot);
  const { groundY } = B.SHOTS[shot];
  // The shot's own size, never below what the focal check asks for (the layout's camera frames the scene when it is shown).
  const r = Math.min(B.MAX_R, Math.max(B.SHOTS[shot].r, Math.ceil(((input.focalMin || 0) * B.WORLD.height * B.FOCAL_MARGIN) / B.PERSON_HEIGHT)));
  const looks = motionSceneFigures(text);
  const pairs = pairsOf(text, new Set(list.map((item) => item.id)));
  // Without an INTERACT line, two focal people are the scene's exchange: they stand together and face each other.
  const explicit = pairs.length > 0;
  const leads = list.filter((item) => item.focal && item.fn === "person");
  if (!pairs.length && leads.length >= 2) pairs.push([leads[0].id, leads[1].id]);
  const partner = (id: string) => pairs.find(([from]) => from === id)?.[1] ?? pairs.find(([, to]) => to === id)?.[0];
  const small = (item: Draft) => item.fn === "prop" && (B.SMALL as readonly string[]).includes(item.kind || "");
  const row = (item: Draft) => (item.fn === "person" || item.fn === "animal" || (item.fn === "crowd" && item.focal) || (item.fn === "prop" && !item.wide) ? 0 : item.focal || item.fn === "crowd" ? 1 : 2);
  // Near row order: every acting element is followed directly by the element it acts on, so nothing can stand between them.
  // An element with several partners (the protagonist grabbed by one person and handed something by another) ends up between them.
  const front = list.filter((entry) => row(entry) === 0 && !small(entry));
  const linked = (a: Draft, b?: Draft) => !!b && pairs.some(([from, to]) => (from === a.id && to === b.id) || (from === b.id && to === a.id));
  const near: Draft[] = [];
  for (const [from, to] of pairs) {
    const a = front.find((entry) => entry.id === from),
      b = front.find((entry) => entry.id === to);
    if (!a || !b) continue;
    const [has, add] = near.includes(a) ? [a, b] : [b, a];
    if (near.includes(add)) continue;
    if (!near.includes(has)) near.push(has, add);
    else {
      const at = near.indexOf(has);
      near.splice(linked(has, near[at + 1]) ? at : at + 1, 0, add);
    }
  }
  for (const item of front) if (!near.includes(item)) near.push(item);
  const rows = [near, list.filter((item) => row(item) === 1), list.filter((item) => row(item) === 2)];
  const depth = [
    { rise: 0, scale: 1 },
    { rise: B.MID.rise, scale: B.MID.scale },
    { rise: B.BACK.rise, scale: B.BACK.scale },
  ];
  const placed = new Map<string, MotionBlueprintItem>();
  let clear = 0;
  rows.forEach((entries, index) => {
    if (!entries.length) return;
    const base = r * depth[index].scale;
    const widths = entries.map((item) => B.WIDTH[item.fn] * base);
    const { xs, scale } = index ? flank(widths, B.GAP * base, clear) : spread(widths, B.GAP * base, B.WORLD.centre);
    if (!index) clear = (widths.reduce((sum, width) => sum + width, 0) + B.GAP * base * (widths.length - 1)) * scale * 0.5;
    entries.forEach((item, at) => {
      const figure = item.fn === "person" || item.fn === "crowd";
      const size = base * scale * (figure ? 1 : B.HEAD);
      placed.set(item.id, {
        id: item.id,
        focal: item.focal,
        fn: item.fn,
        kind: item.fn === "crowd" || item.fn === "person" ? undefined : item.kind,
        x: round(xs[at]),
        y: round(groundY - depth[index].rise * r),
        size: round(size),
        sizeKey: figure ? "r" : "p",
        facing: xs[at] <= B.WORLD.centre ? 1 : -1,
        ...(item.fn === "crowd" ? { count: item.focal ? 9 : 14, spread: round(widths[at] * scale) } : {}),
      });
    });
  });
  for (const [from, to] of pairs) {
    const a = placed.get(from),
      b = placed.get(to);
    if (!a || !b) continue;
    a.target = to;
    a.facing = b.x >= a.x ? 1 : -1;
    b.facing = a.x >= b.x ? 1 : -1;
  }
  const people = [...placed.values()].filter((item) => item.fn === "person");
  list.filter(small).forEach((item) => {
    const owner = placed.get(partner(item.id) || "") || people.find((entry) => B.PROTAGONISTS.includes(entry.id)) || people.find((entry) => entry.focal) || people[0];
    placed.set(item.id, {
      id: item.id,
      focal: item.focal,
      fn: "prop",
      kind: item.kind,
      x: round((owner?.x ?? B.WORLD.centre) + (owner?.facing ?? 1) * r * 0.9),
      y: groundY + 4,
      size: round(r * B.HEAD),
      sizeKey: "p",
      facing: owner?.facing ?? 1,
      owner: owner?.id,
    });
  });
  const motion = text.match(Q.MOTION_LINE)?.[1] || "";
  if (B.TRAVEL_RE.test(motion)) {
    const before = ` ${motion.split("->")[0].toLowerCase()} `;
    const movable = [...placed.values()].filter((item) => !item.owner && item.fn !== "building");
    const mover = movable.find((item) => before.includes(` ${item.id} `)) || movable.find((item) => item.focal);
    if (mover) mover.travelFrom = round(Math.min(B.WORLD.right, Math.max(B.WORLD.left, mover.x - mover.facing * B.TRAVEL * B.WORLD.width)));
  }
  const setting = text.match(B.SETTING_SECTION)?.[0] || text;
  const time = pick(B.TIME, setting, "day");
  return { shot, groundY, r, map, time, ground: pick(B.GROUND, setting, B.DEFAULT_GROUND), mist: B.MIST_RE.test(setting), explicit, items: list.map((item) => placed.get(item.id)!).filter(Boolean).map((item) => (looks[item.id] ? { ...item, look: looks[item.id] } : item)) };
};
const centre = (mark: MotionHtmlMark) => mark.x + mark.w / 2;
// Checks a drawing against the blueprint's relations, from the boxes the figure table recorded: an acting pair must stand together
// with no other required person between them, and large objects must not sit on top of each other.
export const motionSceneRelationIssues = (plan: MotionSceneBlueprint | undefined, marks: MotionHtmlMark[]): { apart: [string, string][]; blocked: [string, string, string][]; stacked: [string, string][] } => {
  const out = { apart: [] as [string, string][], blocked: [] as [string, string, string][], stacked: [] as [string, string][] };
  if (!plan || plan.map) return out;
  const box = (id: string) => marks.find((mark) => String(mark.id).toLowerCase() === id && mark.src === "fig") || marks.find((mark) => String(mark.id).toLowerCase() === id);
  const people = plan.items.filter((item) => item.fn === "person");
  // Only two single people are held to "stand together"; groups, vehicles and places relate at a distance.
  const single = (id?: string) => plan.items.some((entry) => entry.id === id && entry.fn === "person");
  for (const item of plan.explicit ? plan.items.filter((entry) => single(entry.id) && single(entry.target)) : []) {
    const a = item.target ? box(item.id) : undefined,
      b = item.target ? box(item.target) : undefined;
    if (!a || !b || Math.min(a.h, b.h) < B.PAIR_SIZE_RATIO * Math.max(a.h, b.h)) continue;
    const gap = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
    if (gap > B.CHECK.APART) out.apart.push([item.id, item.target!]);
    const lo = Math.min(centre(a), centre(b)),
      hi = Math.max(centre(a), centre(b));
    for (const other of people) {
      const m = other.id !== item.id && other.id !== item.target ? box(other.id) : undefined;
      if (m && centre(m) > lo + B.CHECK.BETWEEN && centre(m) < hi - B.CHECK.BETWEEN && Math.abs(m.y + m.h - (a.y + a.h)) < B.CHECK.SAME_GROUND) out.blocked.push([item.id, item.target!, other.id]);
    }
  }
  const large = marks.filter((mark) => mark.large && /^~(?:vehicle|building):/.test(String(mark.id)));
  const family = (mark: MotionHtmlMark) => String(mark.id).split(":")[0];
  large.forEach((a, index) =>
    large.slice(index + 1).forEach((b) => {
      const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      if (family(a) === family(b) && overlap > B.CHECK.STACKED * Math.min(a.w, b.w) && Math.abs(a.y + a.h - (b.y + b.h)) < B.CHECK.SAME_GROUND) out.stacked.push([String(a.id).slice(1), String(b.id).slice(1)]);
    }),
  );
  return out;
};
export type MotionCastLooks = Record<string, Record<string, string | number | boolean>>;
// Records the look of every marked person a finished scene drew, unless an earlier scene already defined that person.
export const motionSceneCastLearn = (looks: MotionCastLooks, marks: MotionHtmlMark[]): void => {
  for (const mark of marks) {
    const id = String(mark.id).toLowerCase();
    const seed = looks[id]?.[B.CAST_SEED.FLAG] ? looks[id] : undefined;
    if (mark.src === "fig" && mark.look && Object.keys(mark.look).length && (!looks[id] || seed)) looks[id] = { ...mark.look, ...Object.fromEntries(Object.entries(seed || {}).filter(([key]) => key !== B.CAST_SEED.FLAG)) };
  }
};
// Reads the colours a cast description states (coat, trim, trousers, hair, skin) into kit options. Only stated colours are
// taken, and the entry is flagged as a seed so the first scene that draws the person completes the rest of the look.
export const motionSceneCastSeed = (looks: MotionCastLooks, cast: { key?: string; name?: string; look?: string; skin?: string }[] | undefined): void => {
  const C = B.CAST_SEED;
  const colours = Object.keys(C.COLOURS).join("|");
  for (const person of cast || []) {
    const text = String(person.look || "");
    const look: Record<string, string | number | boolean> = {};
    for (const [key, part] of C.PARTS) {
      const hit = new RegExp(`\\b(${colours})[ -]${part}\\b`, "i").exec(text);
      if (hit) look[key] = C.COLOURS[hit[1].toLowerCase()];
    }
    const skin = C.SKIN[String(person.skin || "").toLowerCase().trim()];
    if (skin) look.skin = skin;
    if (!Object.keys(look).length) continue;
    const ids = [String(person.key || ""), ...String(person.name || "").split(/\s+/)].map((id) => id.toLowerCase().replace(/[^a-z0-9]+/g, "")).filter((id) => id.length >= C.NAME_MIN);
    for (const id of new Set(ids)) if (!looks[id]) looks[id] = { ...look, [C.FLAG]: true };
  }
};
export const motionSceneCastPrompt = (looks: MotionCastLooks | undefined, ids: string[]): string | undefined => {
  const rows = ids.filter((id) => looks?.[id]).map((id) => `${id} ${JSON.stringify(looks![id])}`);
  return rows.length ? B.CAST_PROMPT(rows) : undefined;
};
const seedOf = (id: string) => [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
// Code-built scene from the blueprint, written on the figure table like any AI scene: its own plain functions draw the
// figures in "Dựng cảnh AI", the kit draws them in "Bộ vẽ chuẩn". Used when the AI's own drawings keep failing.
const boxOf = (item: MotionBlueprintItem): [number, number] => {
  const unit = B.BOX[item.kind || ""] || B.BOX[item.fn === "crowd" ? "person" : item.fn] || B.BOX.prop;
  return [Math.round(unit[0] * item.size), Math.round(unit[1] * item.size)];
};
export const motionSafeSceneSource = (plan: MotionSceneBlueprint): string => {
  const data = JSON.stringify({ ...plan, items: plan.items.map((item) => ({ ...item, seed: seedOf(item.id), box: boxOf(item) })) }).replace(/</g, "\\u003c");
  const world = `
    const k = smooth(0.08, 0.92, p), cam = input.cameraEnabled === false ? 0 : smooth(0.3, 1, p), zoom = 1 + 0.07 * cam;
    const at = (it) => (it.travelFrom === undefined ? it.x : lerp(it.travelFrom, it.x, k));
    const by = Object.fromEntries(P.items.map((it) => [it.id, it]));
    const phased = (look) => Object.fromEntries(Object.entries(look || {}).map(([key, v]) => [key, Array.isArray(v) ? v[Math.min(v.length - 1, Math.floor(p * v.length))] : v]));
    ctx.translate(640, P.groundY); ctx.scale(zoom, zoom); ctx.translate(-640, -P.groundY);
    const sky = SKY[P.time] || SKY.day, top = P.groundY - 3.6 * P.r;
    let g = ctx.createLinearGradient(0, -200, 0, top); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(-300, -300, 1880, top + 300);
    const land = GROUND[P.ground] || GROUND.grass;
    g = ctx.createLinearGradient(0, top, 0, 900); g.addColorStop(0, land[0]); g.addColorStop(1, land[1]);
    ctx.fillStyle = g; ctx.fillRect(-300, top, 1880, 1000);
    ctx.strokeStyle = 'rgba(42,37,34,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-300, top); ctx.lineTo(1580, top); ctx.stroke();
    if (P.mist) { ctx.fillStyle = 'rgba(240,240,236,0.45)'; ctx.fillRect(-300, top - 0.4 * P.r, 1880, 1.6 * P.r); }
    const draw = (it) => {
      const x = at(it), moving = it.travelFrom !== undefined && k < 1, walked = it.travelFrom === undefined ? undefined : Math.abs(x - it.travelFrom);
      const base = { mark: it.id, x, y: it.y, h: it.box[0], w: it.box[1], facing: it.facing, seed: it.seed };
      const goal = it.target && by[it.target];
      const lk = phased(it.look);
      if (it.fn === 'person') return FIG.person(ctx, Object.assign(base, lk, { pose: moving ? 'walk' : lk.pose || (goal ? (p > 0.45 ? 'point' : 'talk') : it.focal ? 'talk' : 'stand'), distance: walked, pointAt: goal && !moving ? [at(goal), goal.y - 0.7 * goal.box[0]] : undefined, lean: it.focal ? lerp(0, 6, cam) : 0 }));
      if (it.fn === 'crowd') {
        const n = Math.max(2, it.count || 6), rows = 2, cols = Math.ceil(n / rows), step = (it.spread || 6 * it.size) / cols;
        for (let i = n - 1; i >= 0; i--) {
          const row = i % rows, col = Math.floor(i / rows), s = row ? 0.88 : 1, mx = x - (it.spread || 0) / 2 + (col + 0.5) * step + (row ? step / 2 : 0), my = it.y - row * 0.5 * it.size;
          FIG.person(ctx, Object.assign({}, base, { x: mx, y: my, h: it.box[0] * s, w: it.box[1] * s, seed: it.seed + i, pose: moving ? 'walk' : 'stand', distance: walked }));
        }
        return;
      }
      if (it.fn === 'animal') return FIG.animal(ctx, Object.assign(base, lk, { kind: lk.kind || it.kind, pose: moving ? 'walk' : lk.pose || 'stand', distance: walked }));
      if (it.fn === 'vehicle') return FIG.vehicle(ctx, Object.assign(base, { kind: it.kind, moving, distance: walked }));
      if (it.fn === 'building') return FIG.building(ctx, Object.assign(base, { kind: it.kind }));
      if (it.kind === 'bridge') return FIG.bridge(ctx, Object.assign(base, { y: it.y - it.box[0] }));
      if (it.kind === 'wall' || it.kind === 'gate') return FIG.wall(ctx, Object.assign(base, { kind: it.kind }));
      return FIG.prop(ctx, Object.assign(base, { kind: it.kind }));
    };
    P.items.slice().sort((a, b) => a.y - b.y).forEach(draw);
    if (SHADE[P.time]) { ctx.fillStyle = SHADE[P.time]; ctx.fillRect(-300, -300, 1880, 1300); }`;
  const chart = `
    const zoom = 1 + 0.06 * smooth(0.2, 1, p);
    ctx.translate(640, 360); ctx.scale(zoom, zoom); ctx.translate(-lerp(600, 680, smooth(0, 1, p)), -360);
    ctx.fillStyle = '#e2d3b0'; ctx.fillRect(-200, -200, 1680, 1120);
    ctx.strokeStyle = 'rgba(90,70,40,0.18)'; ctx.lineWidth = 1;
    for (let g = -200; g < 1500; g += 80) { ctx.beginPath(); ctx.moveTo(g, -200); ctx.lineTo(g, 920); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-200, g * 0.6); ctx.lineTo(1480, g * 0.6); ctx.stroke(); }
    const n = P.items.length, k = smooth(0.1, 0.85, p);
    const spots = P.items.map((it, i) => [n < 2 ? 640 : 300 + (680 * i) / (n - 1), 360 + (i % 2 ? 70 : -50)]);
    const focal = Math.max(0, P.items.findIndex((it) => it.focal)), goal = spots[focal === n - 1 ? 0 : n - 1] || [900, 360];
    const from = spots[focal], tip = [lerp(from[0], goal[0], k * 0.85), lerp(from[1], goal[1], k * 0.85)];
    ctx.fillStyle = '#b9cfd6'; ctx.strokeStyle = 'rgba(60,80,90,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-200, 600); ctx.bezierCurveTo(240, 540, 520, 660, 820, 590); ctx.bezierCurveTo(1040, 540, 1260, 620, 1480, 570); ctx.lineTo(1480, 920); ctx.lineTo(-200, 920); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,95,110,0.7)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(180, -200); ctx.bezierCurveTo(260, 80, 120, 260, 300, 420); ctx.bezierCurveTo(380, 500, 420, 560, 470, 610); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,70,40,0.5)'; ctx.lineWidth = 3;
    for (let h = 0; h < 7; h++) { const hx = 760 + h * 62 + (h % 2) * 18, hy = 120 + (h % 3) * 34; ctx.beginPath(); ctx.moveTo(hx - 26, hy + 20); ctx.lineTo(hx, hy - 16); ctx.lineTo(hx + 26, hy + 20); ctx.stroke(); }
    if (n > 1) FIG.arrow(ctx, { from: from, to: goal, curve: 0.18, width: 9, color: '#8a2f26', grow: k });
    P.items.forEach((it, i) => {
      const s = i === focal && n > 1 ? tip : spots[i], rad = it.focal ? 20 : 13;
      ctx.beginPath(); ctx.arc(s[0], s[1], rad, 0, Math.PI * 2); ctx.fillStyle = it.focal ? '#8a2f26' : '#4d5661'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (it.focal || i === (focal === n - 1 ? 0 : n - 1)) { const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(s[0], s[1], rad + 8 + pulse * 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(138,47,38,' + (0.55 - pulse * 0.35).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
      FIG.label(ctx, { x: s[0], y: s[1] - rad - 22, text: String(it.id).replace(/^./, (ch) => ch.toUpperCase()), size: 24 });
      if (window.motionMark) window.motionMark(ctx, it.id, s[0] - rad, s[1] - rad, rad * 2, rad * 2);
    });`;
  return `<!DOCTYPE html>
<html data-artifact="motion-html-scene" data-fallback="1"><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111;overflow:hidden}#motion-canvas{display:block;width:100vw;height:100vh}</style></head>
<body><canvas id="motion-canvas"></canvas><script>
const P = ${data};
const canvas = document.getElementById('motion-canvas'), ctx = canvas.getContext('2d');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const INK = '#2a2522';
const SKY = { day: ['#9cc3dc', '#e6eee4'], dawn: ['#c9a6c2', '#f2d9b8'], dusk: ['#d98d5e', '#f2d3a0'], night: ['#16203a', '#36486a'] };
const GROUND = { grass: ['#8aa565', '#5f7d43'], sand: ['#d9c194', '#b99a68'], snow: ['#eef1f3', '#c9d2d8'], mud: ['#8a7353', '#5e4b34'], dirt: ['#b59c74', '#8c7352'], stone: ['#a29c8f', '#77716a'] };
const SHADE = { night: 'rgba(16,22,48,0.35)', dusk: 'rgba(120,60,40,0.12)' };
const shape = (c, fill, build) => { c.beginPath(); build(); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); };
const own = {
  person(c, o) {
    const h = o.h, w = o.w, x = o.x, y = o.y, f = o.facing < 0 ? -1 : 1, hr = 0.13 * h, step = o.pose === 'walk' ? Math.sin((o.distance || 0) / (0.3 * h)) * 0.16 * w : 0;
    c.lineCap = 'round'; c.lineWidth = Math.max(2, 0.07 * w); c.strokeStyle = INK;
    [step, -step].forEach((s) => { c.beginPath(); c.moveTo(x, y - 0.42 * h); c.lineTo(x + s, y); c.stroke(); });
    shape(c, o.top || '#6b7f99', () => { c.moveTo(x - 0.28 * w, y - 0.4 * h); c.lineTo(x - 0.22 * w, y - h + 2.1 * hr); c.lineTo(x + 0.22 * w, y - h + 2.1 * hr); c.lineTo(x + 0.28 * w, y - 0.4 * h); });
    const hand = o.pose === 'point' || o.pose === 'raise' ? [x + f * 0.5 * w, y - 0.72 * h] : [x + f * 0.32 * w, y - 0.48 * h];
    c.lineWidth = Math.max(2, 0.07 * w); c.beginPath(); c.moveTo(x + f * 0.18 * w, y - h + 2.4 * hr); c.lineTo(hand[0], hand[1]); c.stroke();
    shape(c, o.skin || '#e3bf98', () => c.arc(x, y - h + hr, hr, 0, Math.PI * 2));
    return { head: [x, y - h + hr], hand: hand };
  },
  animal(c, o) {
    const h = o.h, w = o.w, x = o.x, y = o.y, f = o.facing < 0 ? -1 : 1, swing = o.pose === 'walk' ? Math.sin((o.distance || 0) / (0.25 * w)) * 0.06 * w : 0;
    c.lineCap = 'round'; c.lineWidth = Math.max(3, 0.05 * w); c.strokeStyle = INK;
    [-0.28, -0.18, 0.2, 0.3].forEach((d, i) => { c.beginPath(); c.moveTo(x + d * w, y - 0.45 * h); c.lineTo(x + d * w + (i % 2 ? swing : -swing), y); c.stroke(); });
    shape(c, o.color || '#8a6a4a', () => c.ellipse(x, y - 0.55 * h, 0.36 * w, 0.17 * h, 0, 0, Math.PI * 2));
    shape(c, o.color || '#8a6a4a', () => c.ellipse(x + f * 0.4 * w, y - 0.8 * h, 0.12 * w, 0.1 * h, f * -0.5, 0, Math.PI * 2));
    const back = [x - f * 0.05 * w, y - 0.7 * h];
    if (o.rider) own.person(c, Object.assign({}, o.rider, { x: back[0], y: back[1] + 0.1 * h, h: 0.62 * h, w: 0.22 * w, facing: f, pose: 'ride' }));
    return { back: back };
  },
  vehicle(c, o) {
    const h = o.h, w = o.w, x = o.x, y = o.y, wr = 0.17 * h;
    shape(c, o.color || '#7a5236', () => c.rect(x - 0.48 * w, y - 0.75 * h, 0.96 * w, 0.45 * h));
    shape(c, o.color2 || '#a9875d', () => c.rect(x - 0.3 * w, y - h, 0.4 * w, 0.25 * h));
    [-0.3, 0.3].forEach((d) => shape(c, '#3b3632', () => c.arc(x + d * w, y - wr, wr, 0, Math.PI * 2)));
  },
  building(c, o) {
    const h = o.h, w = o.w, x = o.x, y = o.y;
    shape(c, o.color || '#c9b28a', () => c.rect(x - 0.42 * w, y - 0.62 * h, 0.84 * w, 0.62 * h));
    shape(c, o.roof || '#8a4a36', () => { c.moveTo(x - 0.5 * w, y - 0.6 * h); c.lineTo(x, y - h); c.lineTo(x + 0.5 * w, y - 0.6 * h); });
    shape(c, '#4a3a2c', () => c.rect(x - 0.08 * w, y - 0.3 * h, 0.16 * w, 0.3 * h));
  },
  prop(c, o) { shape(c, o.color || '#9a8466', () => c.rect(o.x - o.w / 2, o.y - o.h, o.w, o.h)); },
  bridge(c, o) {
    const w = o.w, x = o.x, y = o.y;
    shape(c, o.color || '#8a6a4a', () => { c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2, y + 0.12 * o.h); c.quadraticCurveTo(x, y + 0.5 * o.h, x - w / 2, y + 0.12 * o.h); });
  },
  wall(c, o) {
    const w = o.w, h = o.h, x = o.x, y = o.y, n = Math.max(3, Math.round(w / (0.5 * h)));
    shape(c, o.color || '#a39a8a', () => { c.moveTo(x - w / 2, y); for (let i = 0; i <= n; i++) { const px = x - w / 2 + (w * i) / n; c.lineTo(px, y - (i % 2 ? h : 0.85 * h)); } c.lineTo(x + w / 2, y); });
  },
  arrow(c, o) {
    const a = o.from, b = o.to, g = o.grow == null ? 1 : o.grow, tip = [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g], ang = Math.atan2(tip[1] - a[1], tip[0] - a[0]), wd = o.width || 8;
    c.strokeStyle = o.color || '#8a2f26'; c.fillStyle = o.color || '#8a2f26'; c.lineWidth = wd; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    c.beginPath(); c.moveTo(tip[0] + Math.cos(ang) * wd * 1.6, tip[1] + Math.sin(ang) * wd * 1.6); c.lineTo(tip[0] + Math.cos(ang + 2.5) * wd * 2.2, tip[1] + Math.sin(ang + 2.5) * wd * 2.2); c.lineTo(tip[0] + Math.cos(ang - 2.5) * wd * 2.2, tip[1] + Math.sin(ang - 2.5) * wd * 2.2); c.closePath(); c.fill();
  },
  label(c, o) {
    c.font = 'bold ' + (o.size || 22) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = 'rgba(255,250,240,0.9)'; c.strokeText(o.text, o.x, o.y); c.fillStyle = INK; c.fillText(o.text, o.x, o.y);
  },
};
const FIG = window.MotionFigures.use(own);
window.motionScene = { ready: Promise.resolve(), renderAt: async function (input = {}) {
  const width = Math.max(320, Number(input.width) || 1280), height = Math.max(180, Number(input.height) || 720), dur = Math.max(0.1, Number(input.duration) || 10);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const p = input.motionEnabled === false ? 0 : clamp(Number(input.progress) || 0, 0, 1), t = p * dur;
  const scale = Math.min(width / 1280, height / 720);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#d9d2c2'; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate((width - 1280 * scale) / 2, (height - 720 * scale) / 2); ctx.scale(scale, scale); ctx.save();${plan.map ? chart : world}
  ctx.restore(); ctx.restore();
} };
if (!window.__MOTION_HOST__) { const t0 = performance.now(), dur = 10, loop = (now) => { const t = ((now - t0) / 1000) % dur; window.motionScene.renderAt({ time: t, progress: t / dur, frame: Math.floor(t * 30), fps: 30, duration: dur, width: window.innerWidth || 1280, height: window.innerHeight || 720, mode: 'preview', motionEnabled: true, sceneEffectsEnabled: true, seed: 'preview', speaking: [] }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
</script></body></html>`;
};
