import { MOTION_PLACEMENT as M } from "../../../../../constants/motionPlacement.js";
import { PUPPET as P } from "../../../../../constants/motionPuppet.js";
import type { PuppetLine } from "../../../../../lib/motionPuppet.js";
import type { PuppetPlace, PuppetRead } from "../../../../../types/motionPuppet.js";
export const normalizePuppetSceneConditions = (lines: PuppetLine[], reads: Record<string, PuppetRead>, places: Record<string, PuppetPlace>): Record<string, PuppetRead> => {
  const output = { ...reads };
  let scope: string = P.EMPTY;
  let condition: string | undefined;
  const established = new Map<string, string>();
  for (const line of lines) {
    const read = output[line.key];
    if (!read) {
      scope = P.EMPTY;
      condition = undefined;
      continue;
    }
    const place = places[read.place || line.place || P.EMPTY];
    if (!place) continue;
    const underlying = places[place.visualBase || place.key] || place;
    const baseKey = underlying.basePlace || underlying.key;
    const base = places[baseKey] || place;
    const current = [read.visual?.timeline || line.chapterId, baseKey, read.overlays.includes(P.FLASHBACK), read.light].join(P.SEP);
    const identity = read.visual ? [read.visual.timeline, baseKey].join(P.SEP) : undefined;
    if (current !== scope) condition = identity ? established.get(identity) : undefined;
    const declared = read.visual ? (read.sceneConditionDeclared === undefined ? read.sceneCondition || null : read.sceneConditionDeclared) : read.sceneCondition;
    condition = declared || condition;
    if (identity && condition) established.set(identity, condition);
    if (condition && condition !== M.INTACT) {
      const key = [baseKey, condition].join(M.KEY_JOIN);
      places[key] = places[key] || { ...base, key, basePlace: baseKey, sceneCondition: condition, name: M.CONDITION_NAME(base.name, condition), desc: M.CONDITION_DESC(base.desc, condition), sceneFeatures: [...(base.sceneFeatures || [])] };
      output[line.key] = { ...read, ...(read.visual ? { sceneConditionDeclared: declared } : {}), place: key, sceneCondition: condition };
    } else if (read.visual || place.basePlace) output[line.key] = { ...read, ...(read.visual ? { sceneConditionDeclared: declared } : {}), place: baseKey, sceneCondition: condition };
    scope = current;
  }
  return output;
};
