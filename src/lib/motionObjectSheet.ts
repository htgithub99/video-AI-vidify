import { MOTION_OBJECT_SHEET as S } from "../constants/motionObjectSheet.js";
import { MOTION_OBJECT_CLASS_MATCH } from "../constants/motionObjectClasses.js";
import { motionSceneObjects } from "./motionObjects.js";
import type { MotionObjectSheetEntry, MotionRemotionScene, MotionRemotionState, MotionSceneObject } from "../types/motionVisual.js";
const singular = (word: string): string => {
  const text = word.trim().toLowerCase();
  const rule = S.SINGULAR.find(([pattern]) => pattern.test(text));
  return rule ? text.replace(rule[0], rule[1]) : text;
};
export const motionObjectTerm = (item: MotionSceneObject): string => {
  if (item.term) return singular(item.term);
  const pattern = MOTION_OBJECT_CLASS_MATCH.find(([kind]) => kind === item.class)?.[1];
  const match = pattern ? item.description.match(pattern)?.[0] : undefined;
  return singular(match || item.class);
};
export const motionObjectSheetKey = (item: MotionSceneObject): string => `${item.class}${S.KEY_SEPARATOR}${motionObjectTerm(item).replace(S.KEY_INVALID, S.KEY_SEPARATOR)}`;
export const motionObjectSheetMatch = (entry: MotionObjectSheetEntry, item: MotionSceneObject): boolean => entry.class === item.class && entry.term === motionObjectTerm(item);
export const motionSceneSheets = (state: Pick<MotionRemotionState, "sheet">, scene: Pick<MotionRemotionScene, "nodes" | "objects">): { id: string; svg: string }[] | undefined => {
  const sheet = state.sheet;
  if (!sheet) return undefined;
  const entries = Object.values(sheet);
  const found = motionSceneObjects(scene).flatMap((item) => {
    const entry = entries.find((candidate) => candidate.svg.length <= S.MAX_SVG && motionObjectSheetMatch(candidate, item));
    return entry ? [{ id: item.id, svg: entry.svg }] : [];
  });
  return found.length ? found.slice(0, S.MAX_PER_SCENE) : undefined;
};
