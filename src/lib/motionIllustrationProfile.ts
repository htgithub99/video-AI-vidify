import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_ILLUSTRATION_PROFILES, MOTION_ILLUSTRATION_COMMON, type MotionIllustrationStage } from "../constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_COMPOSITION_EXAMPLES } from "../constants/motionCompositionExamples.js";
import { MOTION_MAP_TIMELINE_CRAFT_EXAMPLE, MOTION_HISTORY_MAP_CRAFT_EXAMPLE } from "../constants/motionCompositionStyleExamples.js";
import type { MotionRemotionProfile, MotionSceneDesign } from "../types/motionVisual.js";
export const motionIllustrationDirection = (id: MotionRemotionProfile, stage: MotionIllustrationStage) => ({
  id,
  revision: V.PROFILES[id].revision,
  grammar: MOTION_ILLUSTRATION_COMMON.GRAMMAR,
  storyContract: MOTION_ILLUSTRATION_COMMON.STORY_CONTRACT,
  rules: MOTION_ILLUSTRATION_PROFILES[id][stage],
  ...(stage === RT_SHARED.DRAWING ? { anatomy: MOTION_ILLUSTRATION_PROFILES[id].anatomy || MOTION_ILLUSTRATION_COMMON.ANATOMY, motion: MOTION_ILLUSTRATION_PROFILES[id].motion, ...(MOTION_ILLUSTRATION_PROFILES[id].layouts ? { layouts: MOTION_ILLUSTRATION_PROFILES[id].layouts } : {}) } : {}),
});
export const motionCompositionReference = (id: MotionRemotionProfile, design?: MotionSceneDesign): string => {
  if (id !== RT_CORE.HORROR && (design?.format === RT_CORE.MAP || design?.format === RT_CORE.TIMELINE)) return MOTION_ILLUSTRATION_COMMON.REFERENCE + RT_SHARED.SYMBOL_01BA47 + (id === RT_SHARED.HISTORY ? MOTION_HISTORY_MAP_CRAFT_EXAMPLE : MOTION_MAP_TIMELINE_CRAFT_EXAMPLE);
  return MOTION_COMPOSITION_EXAMPLES[id];
};
