import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { mergeMotionRepair } from "./motionAiRepair.js";
import { puppetKeyOf } from "./motionPuppetValues.js";
import type { PuppetObject, PuppetRead } from "../types/motionPuppet.js";
type ReadObjects = { object?: any; objects?: any };
const sameObject = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  const left = puppetKeyOf(a.identity),
    right = puppetKeyOf(b.identity);
  return left && right ? left === right : !!puppetKeyOf(a.key) && puppetKeyOf(a.key) === puppetKeyOf(b.key);
};
export const canonicalPuppetReadObjects = <T extends ReadObjects>(read: T): T & { objects: any[] } => {
  const objects = Array.isArray(read.objects) ? [...read.objects] : [];
  const primary = read.object && typeof read.object === "object" && !Array.isArray(read.object) ? read.object : null;
  let at = primary ? objects.findIndex((object) => sameObject(object, primary)) : -1;
  if (primary && at < 0) {
    at = objects.length;
    objects.push(primary);
  }
  return { ...read, objects, object: at >= 0 ? objects[at] : null };
};
export const puppetReadObjects = (read: Pick<PuppetRead, "object" | "objects">): PuppetObject[] => {
  const seen = new Set<string>();
  return canonicalPuppetReadObjects(read).objects.filter((object): object is PuppetObject => {
    if (!object) return false;
    const key = object.identity || object.key;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
export const mergePuppetReadRepair = <T extends ReadObjects>(before: T, patch: ReadObjects, paths: string[]): T => {
  const draft = canonicalPuppetReadObjects(before);
  const next = { ...patch };
  if (Object.hasOwn(patch, RT_SHARED.OBJECT) && !Object.hasOwn(patch, RT_SHARED.OBJECTS_E4CD30)) {
    const at = draft.objects.findIndex((object) => object === draft.object);
    if (patch.object && typeof patch.object === "object") {
      next.objects = paths.includes(RT_SHARED.OBJECTS_E4CD30) ? [...draft.objects] : [];
      next.objects[at < 0 ? draft.objects.length : at] = patch.object;
    } else if (patch.object === null && paths.includes(RT_SHARED.OBJECTS_E4CD30)) next.objects = draft.objects.filter((_, index) => index !== at);
  }
  const merged = mergeMotionRepair(draft, next, paths);
  const at = draft.objects.findIndex((object) => object === draft.object);
  if (at >= 0 && draft.object) {
    const objects = Array.isArray(merged.objects) ? merged.objects : [];
    const primary = objects.find((object: any) => sameObject(object, draft.object)) || (!paths.includes(RT_SHARED.OBJECTS_E4CD30) && paths.some((path) => path === RT_SHARED.OBJECTS + at || path.startsWith(RT_SHARED.OBJECTS + at + RT_SHARED.SYMBOL_CDB4EE)) ? objects[at] : null);
    merged.object = primary || null;
  }
  return canonicalPuppetReadObjects(merged);
};
