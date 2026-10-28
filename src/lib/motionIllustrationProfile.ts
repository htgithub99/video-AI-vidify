import { MOTION_ILLUSTRATION_PROFILES, MOTION_ILLUSTRATION_COMMON, type MotionIllustrationStage } from "../constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_COMPOSITION_EXAMPLES } from "../constants/motionCompositionExamples.js";
import { MOTION_MAP_TIMELINE_CRAFT_EXAMPLE } from "../constants/motionCompositionStyleExamples.js";
import type { MotionRemotionProfile, MotionSceneDesign } from "../types/motionVisual.js";
export const motionIllustrationDirection = (id: MotionRemotionProfile, stage: MotionIllustrationStage) => ({ id, revision: V.PROFILES[id].revision, rules: MOTION_ILLUSTRATION_PROFILES[id][stage], ...(stage === "drawing" ? { anatomy: MOTION_ILLUSTRATION_COMMON.ANATOMY, motion: MOTION_ILLUSTRATION_PROFILES[id].motion } : {}) });
export const motionCompositionReference = (id: MotionRemotionProfile, design?: MotionSceneDesign): string => {
  if (id !== "horror" && (design?.format === "map" || design?.format === "timeline")) return MOTION_ILLUSTRATION_COMMON.REFERENCE + "\n" + MOTION_MAP_TIMELINE_CRAFT_EXAMPLE;
  if (id === "history" && design?.format && design.format !== "illustration") return MOTION_COMPOSITION_EXAMPLES.explainer;
  return MOTION_COMPOSITION_EXAMPLES[id];
};
