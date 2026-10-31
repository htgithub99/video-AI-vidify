import type { MotionRemotionProfile } from "../types/motionVisual.js";
export interface MotionProfileRules {
  brief: boolean;
  headOnlyReferences: boolean;
  placeStrokes: boolean;
  placeLayout: boolean;
  groundUnderlay: boolean;
  omitNodeLayout: boolean;
  placeOnlyDesign: boolean;
  impliedHolders: boolean;
  establishingAnchor: boolean;
  drawAdvisory: boolean;
}
const ORIGINAL: MotionProfileRules = { brief: false, headOnlyReferences: false, placeStrokes: false, placeLayout: false, groundUnderlay: false, omitNodeLayout: false, placeOnlyDesign: false, impliedHolders: false, establishingAnchor: false, drawAdvisory: false };
export const MOTION_PROFILE_RULES: Record<MotionRemotionProfile, MotionProfileRules> = {
  history: { brief: true, headOnlyReferences: true, placeStrokes: true, placeLayout: true, groundUnderlay: true, omitNodeLayout: true, placeOnlyDesign: true, impliedHolders: true, establishingAnchor: true, drawAdvisory: true },
  horror: ORIGINAL,
  explainer: ORIGINAL,
};
