import { MOTION_CAST_MARKS as M } from "../constants/motionTimeline.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
type Scene = { html?: { html?: string } };
type Person = { id?: string; fn?: string; group?: { count?: number }; look?: Record<string, unknown> };
const mode = (list: string[]): string | undefined => {
  const n = new Map<string, number>();
  list.forEach((v) => n.set(v, (n.get(v) || 0) + 1));
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};
export const motionSceneCastLooks = (scenes: Scene[]): Record<string, Record<string, string>> => {
  const seen = new Map<string, { look: Record<string, unknown>; n: number }>(),
    homes: string[] = [],
    regions = new Set<string>();
  scenes.forEach((scene) => {
    const spec = motionSceneSpecOf(scene.html?.html);
    if (!spec || spec.map) return;
    const ids = new Set<string>();
    ((spec.items || []) as Person[]).forEach((it) => {
      if (it.fn !== "person" || !it.id || !it.look) return;
      const region = String(it.look.region || "");
      if (region) regions.add(region);
      if (it.id === "you" && region) homes.push(region);
      if ((it.group?.count || 1) > 1 || M.GENERIC.test(it.id) || ids.has(it.id)) return;
      ids.add(it.id);
      const was = seen.get(it.id);
      seen.set(it.id, was ? { ...was, n: was.n + 1 } : { look: it.look, n: 1 });
    });
  });
  const out: Record<string, Record<string, string>> = {};
  seen.forEach(({ look, n }, id) => {
    if (n < 2) return;
    const marks = Object.fromEntries(M.LOCK.filter((k) => look[k] !== undefined && look[k] !== null && look[k] !== "").map((k) => [M.LOOK + k, String(look[k])]));
    if (Object.keys(marks).length) out[id] = marks;
  });
  const home = mode(homes);
  if (home && regions.size > 1) out[M.HOME] = { home };
  return out;
};
export const motionMergeMarks = (...all: Record<string, Record<string, string>>[]): Record<string, Record<string, string>> => {
  const out: Record<string, Record<string, string>> = {};
  all.forEach((marks) => Object.entries(marks).forEach(([id, m]) => (out[id] = { ...(out[id] || {}), ...m })));
  return out;
};
