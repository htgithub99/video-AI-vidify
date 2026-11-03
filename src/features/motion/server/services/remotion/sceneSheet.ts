import { MOTION_OBJECT_SHEET as S } from "../../../../../constants/motionObjectSheet.js";
import { MOTION_OBJECT_CLASS_LABEL, MOTION_OBJECT_CLASS_PARTS } from "../../../../../constants/motionObjectClasses.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../../../../../constants/motionIllustrationProfiles.js";
import { MOTION_CHARACTER_FRAMES } from "../../../../../constants/motionProfiles/characterFrames/index.js";
import { motionSceneObjects } from "../../../../../lib/motionObjects.js";
import { motionObjectSheetKey, motionObjectSheetMatch, motionObjectTerm } from "../../../../../lib/motionObjectSheet.js";
import { motionLayerParts } from "../../../../../lib/motionSceneQuality.js";
import { motionLayerSvg } from "../../../../../lib/motionIdentityReference.js";
import { repairMotionSvgMarkup } from "../../../../../lib/motionVectorAsset.js";
import type { MotionObjectSheetEntry, MotionRemotionProfile, MotionRemotionScene, MotionRemotionState, MotionSceneObject } from "../../../../../types/motionVisual.js";
export interface MotionSheetItem {
  key: string;
  term: string;
  class: MotionSceneObject["class"];
  label: string;
  description: string;
  parts: readonly string[];
  names: string[];
}
export const motionSheetCandidates = (state: Pick<MotionRemotionState, "sheet">, scenes: MotionRemotionScene[]): MotionSheetItem[] => {
  const seen = new Map<string, MotionSheetItem & { scenes: Set<string>; used: boolean }>();
  for (const scene of scenes) {
    const uses = new Set(scene.nodes.flatMap((node) => (node.uses ? [node.uses.objectId] : [])));
    for (const item of motionSceneObjects(scene)) {
      if (Object.values(state.sheet || {}).some((entry) => motionObjectSheetMatch(entry, item))) continue;
      const key = motionObjectSheetKey(item);
      const entry = seen.get(key) || { key, term: motionObjectTerm(item), class: item.class, label: MOTION_OBJECT_CLASS_LABEL[item.class], description: item.description, parts: MOTION_OBJECT_CLASS_PARTS[item.class].map((part) => part.name), names: [], scenes: new Set<string>(), used: false };
      entry.scenes.add(scene.id);
      entry.used ||= uses.has(item.id);
      if (item.description && !entry.names.includes(item.description)) entry.names.push(item.description);
      seen.set(key, entry);
    }
  }
  return [...seen.values()]
    .filter((entry) => entry.scenes.size >= S.MIN_SCENES || entry.used)
    .sort((a, b) => b.scenes.size - a.scenes.size)
    .slice(0, S.MAX_ITEMS)
    .map(({ scenes: _scenes, used: _used, ...item }) => item);
};
export const motionSheetPrompt = (items: MotionSheetItem[], era: string | undefined, profileId: MotionRemotionProfile): string => S.PROMPT(items, era, MOTION_ILLUSTRATION_PROFILES[profileId].brief, MOTION_CHARACTER_FRAMES[profileId]);
export const motionSheetAssess = (raw: unknown, items: MotionSheetItem[]): { value: Record<string, MotionObjectSheetEntry>; errors: string[] } => {
  const sheets = Array.isArray((raw as { sheets?: unknown })?.sheets) ? ((raw as { sheets: unknown[] }).sheets as { key?: unknown; svg?: unknown }[]) : [];
  const value: Record<string, MotionObjectSheetEntry> = {};
  const errors: string[] = [];
  for (const item of items) {
    const found = sheets.find((entry) => entry?.key === item.key && typeof entry.svg === "string");
    if (!found) {
      errors.push(S.ISSUE_ROOT(item.key));
      continue;
    }
    const svg = repairMotionSvgMarkup(String(found.svg));
    if (!motionLayerSvg(svg, item.key)) {
      errors.push(S.ISSUE_ROOT(item.key));
      continue;
    }
    const missing = MOTION_OBJECT_CLASS_PARTS[item.class].filter((part) => !motionLayerParts(svg, item.key, part.match).length).map((part) => part.name);
    if (missing.length) {
      errors.push(S.ISSUE_PARTS(item.key, missing));
      continue;
    }
    if (svg.length > S.MAX_SVG) continue;
    value[item.key] = { class: item.class, term: item.term, names: item.names, svg, parts: [...item.parts] };
  }
  return { value, errors: Object.keys(value).length ? [] : errors };
};
