import { MOTION_SCENE_BLUEPRINT as B, type MotionBlueprintFn } from "../constants/motionSceneBlueprint.js";
import { MOTION_HTML_QUALITY as Q } from "../constants/motionHtmlQuality.js";
import { motionHtmlMarkId } from "./motionHtmlQuality.js";
import type { MotionHtmlMark } from "../types/motionHtmlScene.js";

export interface MotionBlueprintItem {
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
}
export interface MotionSceneBlueprint {
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
  // The selected layout sets how tall a focal person must be; the figure size follows it so the first drawing already passes.
  const r = Math.min(B.MAX_R, Math.max(B.SHOTS[shot].r, Math.ceil(((input.focalMin || 0) * B.WORLD.height * B.FOCAL_MARGIN) / B.PERSON_HEIGHT)));
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
  return { shot, groundY, r, map, time, ground: pick(B.GROUND, setting, B.DEFAULT_GROUND), mist: B.MIST_RE.test(setting), explicit, items: list.map((item) => placed.get(item.id)!).filter(Boolean) };
};
export const motionSceneBlueprintPrompt = (plan: MotionSceneBlueprint | undefined): string | undefined => {
  if (!plan || plan.map || !plan.items.length) return undefined;
  const side = (facing: number) => (facing > 0 ? "right" : "left");
  const lines = plan.items.map((item) =>
    B.PROMPT_ITEM(
      [
        `${item.id}${item.focal ? " (focal)" : ""}: ${item.fn}${item.kind ? ` ${item.kind}` : ""} at x ${item.x}, y ${item.y}, ${item.sizeKey} ${item.size}, facing ${side(item.facing)}`,
        item.count ? `about ${item.count} figures over ${item.spread}px` : "",
        item.target ? `stands next to ${item.target} and faces it` : "",
        item.owner ? `held by or lying beside ${item.owner}` : "",
        item.travelFrom !== undefined ? `travels from x ${item.travelFrom} to x ${item.x} during the scene` : "",
      ]
        .filter(Boolean)
        .join("; "),
    ),
  );
  return [B.PROMPT_HEAD(plan.shot, plan.groundY), ...lines, B.PROMPT_RULES].join("\n");
};
const centre = (mark: MotionHtmlMark) => mark.x + mark.w / 2;
// Checks a drawing against the blueprint's relations, from the boxes the kit recorded: an acting pair must stand together
// with no other required person between them, and large objects must not sit on top of each other.
export const motionSceneRelationIssues = (plan: MotionSceneBlueprint | undefined, marks: MotionHtmlMark[]): { apart: [string, string][]; blocked: [string, string, string][]; stacked: [string, string][] } => {
  const out = { apart: [] as [string, string][], blocked: [] as [string, string, string][], stacked: [] as [string, string][] };
  if (!plan || plan.map) return out;
  const box = (id: string) => marks.find((mark) => String(mark.id).toLowerCase() === id && mark.src === "kit") || marks.find((mark) => String(mark.id).toLowerCase() === id);
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
export interface MotionSceneFix {
  zoom?: number;
  dx?: number;
  items?: Record<string, { dx: number }>;
  add?: Record<string, string | number>[];
  labels?: { id: string; text: string }[];
}
// Works out a code repair from the recorded boxes: zoom so the focal subjects reach the size the layout asks for (never
// pushing their heads out of the top), pan so they sit inside the frame, and move a bystander out from between an acting pair.
export const motionSceneAutoFix = (input: { sampled: MotionHtmlMark[][]; focal: string[]; need: number; blocked: [string, string, string][] }): MotionSceneFix | undefined => {
  const F = B.FIX;
  const kit = (marks: MotionHtmlMark[], id: string) => marks.find((mark) => String(mark.id).toLowerCase() === id && mark.src === "kit");
  const key = input.sampled[0] || [];
  const fix: MotionSceneFix = {};
  let zoom = 1;
  for (const id of input.focal) {
    const best = input.sampled.map((marks) => kit(marks, id)).filter((mark): mark is MotionHtmlMark => !!mark && mark.h > 0).sort((a, b) => b.h - a.h)[0];
    if (!best || best.h >= input.need) continue;
    const room = (best.y + best.h - F.TOP) / best.h;
    zoom = Math.max(zoom, Math.min(F.MAX_ZOOM, room, (input.need * F.HEADROOM) / best.h));
  }
  if (zoom >= F.MIN_ZOOM) fix.zoom = Number(zoom.toFixed(3));
  else zoom = 1;
  const boxes = input.focal.map((id) => kit(key, id)).filter((mark): mark is MotionHtmlMark => !!mark);
  if (boxes.length) {
    const left = Math.min(...boxes.map((mark) => mark.x)),
      right = Math.max(...boxes.map((mark) => mark.x + mark.w)),
      mid = (left + right) / 2;
    const spill = 0.5 + (left - 0.5) * zoom < F.EDGE || 0.5 + (right - 0.5) * zoom > 1 - F.EDGE;
    const scale = boxes[0].k || 1;
    const dx = ((mid - 0.5) * F.DESIGN_WIDTH) / scale;
    if (spill && (right - left) * zoom <= 1 - 2 * F.EDGE && Math.abs(dx) >= F.MIN_DX) fix.dx = Math.round(dx);
  }
  for (const [a, b, c] of input.blocked) {
    const first = kit(key, a),
      second = kit(key, b),
      third = kit(key, c);
    if (!first || !second || !third) continue;
    const right = Math.max(first.x + first.w, second.x + second.w),
      left = Math.min(first.x, second.x);
    const target = right + F.GAP + third.w / 2 <= 1 - F.EDGE ? right + F.GAP + third.w / 2 : left - F.GAP - third.w / 2;
    (fix.items ||= {})[c] = { dx: Math.round(((target - centre(third)) * F.DESIGN_WIDTH) / (third.k || 1)) };
  }
  return fix.zoom || fix.dx || fix.items ? fix : undefined;
};
export const motionSceneFixHtml = (html: string, fix: MotionSceneFix): string => (B.FIX_HEAD.test(html) ? html.replace(B.FIX_HEAD, (head) => head + B.FIX_SCRIPT(fix)) : B.FIX_SCRIPT(fix) + html);
export type MotionCastLooks = Record<string, Record<string, string | number | boolean>>;
// Writes the stored looks of the people this scene marks into its page.
export const motionSceneCastHtml = (html: string, looks: MotionCastLooks | undefined): string => {
  const used = Object.fromEntries(Object.entries(looks || {}).filter(([id]) => new RegExp(`mark\\s*:\\s*['"\`]${id}['"\`]`, "i").test(html)));
  if (!Object.keys(used).length) return html;
  return B.FIX_HEAD.test(html) ? html.replace(B.FIX_HEAD, (head) => head + B.CAST_SCRIPT(used)) : B.CAST_SCRIPT(used) + html;
};
// Records the look of every marked person a finished scene drew, unless an earlier scene already defined that person.
export const motionSceneCastLearn = (looks: MotionCastLooks, marks: MotionHtmlMark[]): void => {
  for (const mark of marks) {
    const id = String(mark.id).toLowerCase();
    const seed = looks[id]?.[B.CAST_SEED.FLAG] ? looks[id] : undefined;
    if (mark.src === "kit" && mark.look && Object.keys(mark.look).length && (!looks[id] || seed)) looks[id] = { ...mark.look, ...Object.fromEntries(Object.entries(seed || {}).filter(([key]) => key !== B.CAST_SEED.FLAG)) };
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
export const motionSceneFixNotes = (fix: MotionSceneFix): string[] => [fix.zoom ? B.FIX_ZOOM(fix.zoom) : "", fix.dx ? B.FIX_PAN : "", fix.items ? B.FIX_MOVE(Object.keys(fix.items)) : "", fix.add?.length ? B.FIX_ADD(fix.add.map((item) => String(item.mark))) : "", fix.labels?.length ? B.FIX_LABELS(fix.labels.map((item) => item.text)) : ""].filter(Boolean);
const seedOf = (id: string) => [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
// Code-built scene from the blueprint, drawn only with the standard kit: used when the AI's own drawings keep failing.
export const motionSafeSceneSource = (plan: MotionSceneBlueprint): string => {
  const data = JSON.stringify({ ...plan, items: plan.items.map((item) => ({ ...item, seed: seedOf(item.id) })) });
  const world = `
    const k = smooth(0.08, 0.92, p), cam = input.cameraEnabled === false ? 0 : smooth(0.3, 1, p);
    const at = (it) => (it.travelFrom === undefined ? it.x : lerp(it.travelFrom, it.x, k));
    const by = Object.fromEntries(P.items.map((it) => [it.id, it]));
    MotionKit.frame(ctx, { x: 640, groundY: P.groundY, zoom: 1 + 0.07 * cam, shot: P.shot });
    MotionKit.terrain(ctx, { kind: 'sky', time: P.time, x: 640, y: -260, width: 2300, height: 700, seed: 1 });
    MotionKit.terrain(ctx, { kind: 'ground', ground: P.ground, x: 640, y: P.groundY - 3.6 * P.r, width: 2300, height: 720, dress: true, seed: 2 });
    MotionKit.stage(ctx, P.items.map((it) => {
      const x = at(it), moving = it.travelFrom !== undefined && k < 1, base = { fn: it.fn, mark: it.id, x, y: it.y, facing: it.facing, seed: it.seed };
      const goal = it.target && by[it.target];
      if (it.fn === 'person') return Object.assign(base, { r: it.size, pose: moving ? 'walk' : goal ? (p > 0.45 ? 'point' : 'talk') : it.focal ? 'talk' : 'stand', distance: it.travelFrom === undefined ? undefined : Math.abs(x - it.travelFrom), pointAt: goal && !moving ? [at(goal), goal.y - 1.5 * it.size] : undefined, lean: it.focal ? lerp(0, 6, cam) : 0, look: goal ? 0.8 : 0.2, talking: it.focal && Math.floor(t * 4) % 2 === 0 });
      if (it.fn === 'crowd') return Object.assign(base, { r: it.size, count: it.count, rows: 2, spread: it.spread, pose: moving ? 'walk' : 'stand', distance: it.travelFrom === undefined ? undefined : Math.abs(x - it.travelFrom) });
      if (it.fn === 'animal') return Object.assign(base, { kind: it.kind, p: it.size, pose: moving ? 'walk' : 'stand', distance: it.travelFrom === undefined ? undefined : Math.abs(x - it.travelFrom) });
      if (it.fn === 'vehicle') return Object.assign(base, { kind: it.kind, p: it.size, moving, distance: it.travelFrom === undefined ? undefined : Math.abs(x - it.travelFrom) });
      return Object.assign(base, { kind: it.kind, p: it.size });
    }));
    if (P.mist) MotionKit.scenery(ctx, { kind: 'mistBand', x: 640, y: P.groundY - 2.4 * P.r, r: 60, width: 2300, seed: 5 });
    if (P.time === 'night' || P.time === 'dusk') MotionKit.effect(ctx, { kind: P.time, strength: 1 });`;
  const chart = `
    MotionKit.frame(ctx, { shot: 'map', x: lerp(600, 680, smooth(0, 1, p)), y: 360, zoom: 1 + 0.06 * smooth(0.2, 1, p) });
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
    if (n > 1) MotionKit.arrow(ctx, { from: from, to: goal, curve: 0.18, width: 9, color: '#8a2f26', grow: k });
    P.items.forEach((it, i) => {
      const s = i === focal && n > 1 ? tip : spots[i], rad = it.focal ? 20 : 13;
      ctx.beginPath(); ctx.arc(s[0], s[1], rad, 0, Math.PI * 2); ctx.fillStyle = it.focal ? '#8a2f26' : '#4d5661'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#26201c'; ctx.stroke();
      if (it.focal || i === (focal === n - 1 ? 0 : n - 1)) { const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(s[0], s[1], rad + 8 + pulse * 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(138,47,38,' + (0.55 - pulse * 0.35).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
      MotionKit.label(ctx, { x: s[0], y: s[1] - rad - 22, text: String(it.id).replace(/^./, (ch) => ch.toUpperCase()), size: 24 });
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
