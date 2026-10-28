import { MOTION_VISUAL as V } from "../../src/constants/motionVisual.js";
import { MOTION_REMOTION_STAGING as S } from "../../src/constants/motionRemotionStaging.js";
import { remotionIdentityDescription } from "../../src/lib/motionRemotionStaging.js";
import { remotionContact } from "../../src/lib/motionRemotionGeometry.js";
import type { MotionRemotionNode } from "../../src/types/motionVisual.js";
export const canReuseRemotionCharacter = (node: MotionRemotionNode, appearance: string): boolean => {
  appearance = remotionIdentityDescription(appearance);
  if (node.relation === "on" && remotionContact(node) !== "base") return false;
  if (node.appearanceChanged || node.poseEssential || V.REQUIRED_POSE.test(node.pose)) return false;
  const changes = new Set(appearance.toLowerCase().match(S.VISIBLE_CHANGE) || []);
  if ((node.description.toLowerCase().match(S.VISIBLE_CHANGE) || []).some((marker) => !changes.has(marker))) return false;
  const original = new Set(appearance.toLowerCase().match(V.APPEARANCE_MARKERS) || []);
  return !(node.description.toLowerCase().match(V.APPEARANCE_MARKERS) || []).some((marker) => !original.has(marker));
};
