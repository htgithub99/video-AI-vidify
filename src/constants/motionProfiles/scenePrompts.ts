import { motionSceneBrief, type MotionSceneBriefContext } from "../../lib/motionSceneBrief.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../motionIllustrationProfiles.js";
export const motionProfileScenePrompt = (context: unknown): string => {
  const brief = context as MotionSceneBriefContext;
  const id = brief?.artDirection?.id;
  if (!id || !Object.hasOwn(MOTION_ILLUSTRATION_PROFILES, id)) throw new Error("Select a valid illustration profile before requesting a scene.");
  return motionSceneBrief(brief);
};
