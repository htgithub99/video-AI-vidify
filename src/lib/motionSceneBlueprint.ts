import { MOTION_SCENE_BLUEPRINT as B, type MotionBlueprintFn } from "../constants/motionSceneBlueprint.js";
import { MOTION_HTML_QUALITY as Q } from "../constants/motionHtmlQuality.js";
import { motionHtmlMarkId } from "./motionHtmlQuality.js";
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
  if (!line) {
    if (!template.trim()) return [];
    const found = (fn: MotionBlueprintFn) => B.KINDS.find((row) => row.fn === fn && row.re.test(template));
    const extras = (["crowd", "vehicle", "building"] as const).map(found).filter((row): row is (typeof B.KINDS)[number] => !!row);
    return [
      { id: B.LEAD, focal: true, fn: "person" },
      ...extras.map((row) => ({
        id: template
          .match(row.re)![0]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ""),
        focal: false,
        fn: row.fn,
        kind: row.kind,
        wide: row.wide,
      })),
    ];
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
export const motionSceneFigures = (template: string): Record<string, Record<string, string | string[] | true>> => {
  const line = template.match(B.FIGURES_LINE)?.[1] || "";
  const out: Record<string, Record<string, string | string[] | true>> = {};
  for (const entry of line.split(/\s*;\s*/)) {
    const at = entry.indexOf(":");
    if (at <= 0) continue;
    const id = motionHtmlMarkId(entry.slice(0, at));
    const look: Record<string, string | string[] | true> = {};
    for (const part of entry
      .slice(at + 1)
      .split(/\s*,\s*/)
      .slice(1)) {
      const words = part.trim().split(/\s+/);
      if (!words[0] || !/^[a-z][A-Za-z]*$/.test(words[0])) continue;
      const value = words.slice(1).join(" ");
      look[words[0]] = !value ? true : value.includes("->") ? value.split(/\s*->\s*/) : value;
    }
    if (id) out[id] = look;
  }
  return out;
};
export const motionSceneInteractPairs = (template: string | undefined): [string, string][] => {
  const line = template?.match(B.INTERACT_LINE)?.[1] || "";
  return [...line.matchAll(B.INTERACT_PAIR)].map((match) => [motionHtmlMarkId(match[1]), motionHtmlMarkId(match[2])] as [string, string]).filter(([from, to]) => from && to && from !== to);
};
const pairsOf = (template: string, ids: Set<string>): [string, string][] => {
  const line = template.match(B.INTERACT_LINE)?.[1] || "";
  return [...line.matchAll(B.INTERACT_PAIR)].map((match) => [motionHtmlMarkId(match[1]), motionHtmlMarkId(match[2])] as [string, string]).filter(([from, to]) => from !== to && ids.has(from) && ids.has(to));
};
const pick = (rows: readonly (readonly [string, RegExp])[], text: string, fallback: string) => rows.find(([, re]) => re.test(text))?.[0] ?? fallback;
const round = (value: number) => Math.round(value);
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
  const r = Math.min(B.MAX_R, Math.max(B.SHOTS[shot].r, Math.ceil(((input.focalMin || 0) * B.WORLD.height * B.FOCAL_MARGIN) / B.PERSON_HEIGHT)));
  const looks = motionSceneFigures(text);
  const pairs = pairsOf(text, new Set(list.map((item) => item.id)));
  const explicit = pairs.length > 0;
  const leads = list.filter((item) => item.focal && item.fn === "person");
  if (!pairs.length && leads.length >= 2) pairs.push([leads[0].id, leads[1].id]);
  const partner = (id: string) => pairs.find(([from]) => from === id)?.[1] ?? pairs.find(([, to]) => to === id)?.[0];
  const small = (item: Draft) => item.fn === "prop" && (B.SMALL as readonly string[]).includes(item.kind || "");
  const row = (item: Draft) => (item.fn === "person" || item.fn === "animal" || (item.fn === "crowd" && item.focal) || (item.fn === "prop" && !item.wide) ? 0 : item.focal || item.fn === "crowd" ? 1 : 2);
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
    placed.set(item.id, { id: item.id, focal: item.focal, fn: "prop", kind: item.kind, x: round((owner?.x ?? B.WORLD.centre) + (owner?.facing ?? 1) * r * 0.9), y: groundY + 4, size: round(r * B.HEAD), sizeKey: "p", facing: owner?.facing ?? 1, owner: owner?.id });
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
  return {
    shot,
    groundY,
    r,
    map,
    time,
    ground: pick(B.GROUND, setting, B.DEFAULT_GROUND),
    mist: B.MIST_RE.test(setting),
    explicit,
    items: list
      .map((item) => placed.get(item.id)!)
      .filter(Boolean)
      .map((item) => (looks[item.id] ? { ...item, look: looks[item.id] } : item)),
  };
};
export type MotionCastLooks = Record<string, Record<string, string | number | boolean>>;
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
    const skin =
      C.SKIN[
        String(person.skin || "")
          .toLowerCase()
          .trim()
      ];
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
