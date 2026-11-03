import { MOTION_ILLUSTRATION_PROFILES, type MotionIllustrationStage } from "../constants/motionIllustrationProfiles.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_PROFILE_SCENES } from "../constants/motionProfiles/scenes.js";
import type { MotionShotSize } from "../constants/motionProfiles/sceneSpec.js";
import { SCENE_DEVICES, SCENE_FRAMING, SCENE_FRAMING_PLANNING, SCENE_SHOT_FRAME, type MotionSceneFormat, type MotionSceneView } from "../constants/motionProfiles/framing.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
const WIDE: MotionSceneView = "wide";
const ILLUSTRATION: MotionSceneFormat = "illustration";
export const motionProfileFraming = (id: MotionRemotionProfile, view?: MotionSceneView): string => {
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  const key = view && Object.hasOwn(SCENE_FRAMING, view) ? view : WIDE;
  const size = Object.hasOwn(MOTION_PROFILE_SCENES[id].shotSizes, key) ? MOTION_PROFILE_SCENES[id].shotSizes[key as MotionShotSize] : undefined;
  if (size) return SCENE_SHOT_FRAME.TEXT(key, size.body, size.head, size.top, SCENE_SHOT_FRAME.RULES);
  return profile.framing?.[key] || SCENE_FRAMING[key];
};
export const motionProfileDevice = (id: MotionRemotionProfile, format?: MotionSceneFormat): string | undefined => {
  if (!format || format === ILLUSTRATION) return undefined;
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  return profile.devices?.[format] || SCENE_DEVICES[format];
};
export const motionIllustrationDirection = (id: MotionRemotionProfile, stage: MotionIllustrationStage, shot?: { view?: MotionSceneView; format?: MotionSceneFormat }) => {
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  const view = shot?.view || WIDE;
  const device = motionProfileDevice(id, shot?.format);
  return {
    id,
    revision: V.PROFILES[id].revision,
    grammar: profile.grammar,
    storyContract: profile.storyContract,
    rules: profile[stage],
    ...(stage === "planning" ? { views: SCENE_FRAMING_PLANNING } : {}),
    ...(stage === "drawing"
      ? {
          hardRules: profile.hardRules,
          framing: motionProfileFraming(id, view),
          ...(device ? { device } : {}),
          identity: profile.identity,
          closeUps: profile.closeUps,
          text: profile.text,
          ...(view === WIDE && !device ? { staging: profile.staging } : {}),
          anatomy: profile.anatomy,
          motion: profile.motion,
        }
      : {}),
  };
};
