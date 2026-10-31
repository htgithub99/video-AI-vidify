import { MOTION_ILLUSTRATION_PROFILES, type MotionIllustrationStage } from "../constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
export const motionIllustrationDirection = (id: MotionRemotionProfile, stage: MotionIllustrationStage) => {
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  return { id, revision: V.PROFILES[id].revision, grammar: profile.grammar, storyContract: profile.storyContract, rules: profile[stage], ...(stage === "drawing" ? { identity: profile.identity, closeUps: profile.closeUps, text: profile.text, staging: profile.staging, anatomy: profile.anatomy, motion: profile.motion } : {}) };
};
