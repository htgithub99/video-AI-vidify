import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import { MOTION_DEPTHS } from "../constants/motionProfiles/sceneSpec.js";

// Only render identifiers are changed. Scene/entity IDs remain the source of truth.
type Copy = { id: string; owner?: string; rank: number };
const LIMITS: Record<string, number> = { [C.LAYERS_FIELD]: C.LAYERS, [C.ANIMATIONS_FIELD]: C.ANIMATIONS };
const TAG = /<(\/?)([\w:-]+)\b[^<>]*>/g;
const ID_ATTRIBUTE = /(?<=\s)id\s*=\s*(["'])([^"']+)\1/g;
const REFERENCE_FIELDS = new Set(["id", "target", "sourceId", "supportId", "subjectId"]);
const cssIdPattern = (id: string) => new RegExp(`#${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_.-])`, "u");
const plainId = (id: string) => {
  const plain = id.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^A-Za-z0-9_.-]/g, "_");
  return /^[A-Za-z_]/.test(plain) ? plain : C.RENDER_ID(plain);
};
export const normalizeSceneRenderIds = (raw: any, nodes: { id: string; distance?: string }[] = []): any => {
  if (typeof raw?.svg !== "string") return raw;
  const tags = [...raw.svg.matchAll(TAG)].map((match: RegExpMatchArray) => ({ text: match[0], closing: !!match[1], ids: [...match[0].matchAll(ID_ATTRIBUTE)].map((found) => found[2]) }));
  const ids: string[] = tags.flatMap((tag) => (tag.closing ? [] : tag.ids));
  const count = new Map<string, number>();
  for (const id of ids) count.set(id, (count.get(id) || 0) + 1);
  const protectedIds = new Set(nodes.map((node) => node.id));
  const used = new Set(ids);
  const renamed = new Map<string, string>();
  const references = new Set<string>();
  for (const match of raw.svg.matchAll(/url\(\s*["']?#([^\s)'" >]+)["']?\s*\)|(?:href|xlink:href)\s*=\s*["']#([^"']+)["']|(?:aria-labelledby|aria-describedby)\s*=\s*["']([^"']+)["']/g)) {
    for (const value of (match[1] || match[2] || match[3] || "").split(/\s+/)) references.add(value);
  }
  for (const match of raw.svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) for (const id of ids) if (cssIdPattern(id).test(match[1])) references.add(id);
  const collect = (value: any, key = "") => {
    if (typeof value === "string" && REFERENCE_FIELDS.has(key)) references.add(value);
    else if (Array.isArray(value)) value.forEach((item) => collect(item));
    else if (value && typeof value === "object") for (const [field, item] of Object.entries(value)) if (field !== "svg") collect(item, field);
  };
  collect(raw);
  const unique = (base: string) => {
    let id = base;
    for (let index = 2; used.has(id); index++) id = `${base}_${index}`;
    used.add(id);
    return id;
  };
  const scoped = new Set<string>();
  for (const [id, total] of count) {
    if (total > 1 && protectedIds.has(id)) throw new Error(C.ERROR(id, C.DUPLICATE_ID));
    if (total > 1 && references.has(id)) scoped.add(id);
    if (!C.ID.test(id)) {
      if (protectedIds.has(id)) throw new Error(C.ERROR(id, C.INVALID_ID));
      renamed.set(id, unique(plainId(id)));
    }
  }
  if (!renamed.size && ![...count.values()].some((total) => total > 1)) return raw;
  const copies = new Map<string, Copy[]>();
  {
    const stack: (string | undefined)[] = [];
    for (const tag of tags) {
      if (tag.closing) {
        stack.pop();
        continue;
      }
      for (const id of tag.ids) {
        if (!scoped.has(id)) continue;
        const owner = [...stack].reverse().find((ancestor): ancestor is string => !!ancestor && count.get(ancestor) === 1);
        const node = nodes.find((item) => [...stack].reverse().includes(item.id));
        const depth = MOTION_DEPTHS.indexOf(node?.distance as (typeof MOTION_DEPTHS)[number]);
        const base = renamed.get(id) || id;
        const list = copies.get(id) || [];
        list.push({ id: unique(owner ? plainId(C.SCOPED_ID(owner, base)) : base), owner, rank: node ? (depth < 0 ? 1 : depth) : MOTION_DEPTHS.length });
        copies.set(id, list);
      }
      if (!/\/\s*>$/.test(tag.text)) stack.push(tag.ids[0]);
    }
  }
  for (const [id, list] of copies) if (list.filter((copy) => !copy.owner).length > 1) throw new Error(C.ERROR(id, C.DUPLICATE_ID));
  const pick = (id: string, chain: (string | undefined)[]): string => {
    const list = copies.get(id);
    if (!list) return renamed.get(id) || id;
    return (list.find((copy) => copy.owner && chain.includes(copy.owner)) || list[0]).id;
  };
  const seen = new Set<string>();
  const occurrence = new Map<string, number>();
  const stack: (string | undefined)[] = [];
  const svg = raw.svg.replace(TAG, (tag: string, closing: string) => {
    if (closing) {
      stack.pop();
      return tag;
    }
    const chain = [...stack];
    let own: string | undefined;
    let next = tag.replace(ID_ATTRIBUTE, (_match: string, quote: string, id: string) => {
      own ??= id;
      let value: string;
      if (copies.has(id)) {
        const index = occurrence.get(id) || 0;
        occurrence.set(id, index + 1);
        value = copies.get(id)![index].id;
      } else {
        value = renamed.get(id) || id;
        if (seen.has(id)) value = unique(value);
      }
      seen.add(id);
      return `id=${quote}${value}${quote}`;
    });
    const local = [...chain, own];
    next = next.replace(/\s([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g, (match: string, field: string, quote: string, value: string) => {
      if (field === "id") return match;
      let updated = value.replace(/url\(\s*(["']?)#([^\s)'" >]+)\1\s*\)/g, (found, q, id) => (copies.has(id) || renamed.has(id) ? `url(${q}#${pick(id, local)}${q})` : found));
      if ((field === "href" || field === "xlink:href") && value.startsWith("#") && (copies.has(value.slice(1)) || renamed.has(value.slice(1)))) updated = "#" + pick(value.slice(1), local);
      if (field === "aria-labelledby" || field === "aria-describedby") updated = value.split(/\s+/).map((id) => pick(id, local)).join(" ");
      return updated === value ? match : ` ${field}=${quote}${updated}${quote}`;
    });
    if (!/\/\s*>$/.test(tag)) stack.push(own);
    return next;
  });
  const targets = new Map<string, string[]>([...renamed].map(([from, to]) => [from, [to]]));
  for (const [id, list] of copies) targets.set(id, list.map((copy) => copy.id));
  const updated = svg.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_match: string, open: string, style: string, close: string) => {
    let css = style.replace(/url\(\s*(["']?)#([^\s)'" >]+)\1\s*\)/g, (found, q, id) => (targets.has(id) ? `url(${q}#${targets.get(id)![0]}${q})` : found));
    for (const [from, to] of targets) {
      const pattern = new RegExp(cssIdPattern(from).source, "gu");
      css = to.length > 1 ? css.replace(/([^{}]+)(\{[^{}]*\})/g, (rule: string, selector: string, body: string) => (cssIdPattern(from).test(selector) ? to.map((id) => selector.replace(pattern, `#${id}`) + body).join("") : rule)) : css.replace(pattern, `#${to[0]}`);
    }
    return open + css + close;
  });
  const extras = new Map<object, number>();
  const expand = (item: any, parent: string): any[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [remap(item)];
    const field = Object.keys(item).find((key) => REFERENCE_FIELDS.has(key) && typeof item[key] === "string" && copies.has(item[key]));
    if (!field) return [remap(item)];
    const list = copies.get(item[field])!;
    if (parent === C.ANIMATIONS_FIELD && field === C.TARGET_FIELD) return [remap({ ...item, target: list[0].id, targets: [...(Array.isArray(item.targets) ? item.targets : []), ...list.slice(1).map((copy) => copy.id)] })];
    return list.map((copy, index) => {
      const clone = remap({ ...item, [field]: copy.id });
      if (index) extras.set(clone, copy.rank);
      return clone;
    });
  };
  const fit = (items: any[], limit?: number): any[] => {
    if (!limit || items.length <= limit) return items;
    const drop = new Set(
      items
        .map((item, index) => ({ item, index, rank: extras.get(item) }))
        .filter((entry) => entry.rank !== undefined)
        .sort((a, b) => b.rank! - a.rank! || b.index - a.index)
        .slice(0, items.length - limit)
        .map((entry) => entry.item),
    );
    return items.filter((item) => !drop.has(item));
  };
  const remap = (value: any, key = ""): any => {
    if (typeof value === "string") return REFERENCE_FIELDS.has(key) ? (targets.get(value) || [value])[0] : value;
    if (Array.isArray(value)) return fit(value.flatMap((item) => expand(item, key)), LIMITS[key]);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, field === "svg" ? updated : remap(item, field)]));
    return value;
  };
  return remap(raw);
};
