import { MOTION_CHARACTER_FRAMES, MOTION_CHARACTER_POSE_FRAMES } from "../constants/motionProfiles/characterFrames/index.js";
import { MOTION_FRAME_FACING_KEEPS, MOTION_FRAME_FACING_POSE, MOTION_FRAME_POSE_FALLBACK, MOTION_FRAME_POSE_OF, MOTION_FRAME_STAND, type MotionFramePose } from "../constants/motionProfiles/characterFrames/poses.js";
import type { MotionFacing, MotionPosture } from "../constants/motionProfiles/sceneSpec.js";
import type { MotionRemotionProfile } from "../types/motionVisual.js";
export const motionFramePose = (profile: MotionRemotionProfile, stance: MotionPosture | undefined, facing?: MotionFacing): MotionFramePose => {
  const base: MotionFramePose = (stance && MOTION_FRAME_POSE_OF[stance]) || MOTION_FRAME_STAND;
  let pose: MotionFramePose = (facing && MOTION_FRAME_FACING_POSE[facing] && !MOTION_FRAME_FACING_KEEPS.includes(base) ? MOTION_FRAME_FACING_POSE[facing] : base) || MOTION_FRAME_STAND;
  const frames: Partial<Record<MotionFramePose, string>> = MOTION_CHARACTER_POSE_FRAMES[profile];
  while (pose !== MOTION_FRAME_STAND && !frames[pose]) pose = MOTION_FRAME_POSE_FALLBACK[pose];
  return pose;
};
export const motionFrameSvg = (profile: MotionRemotionProfile, pose: MotionFramePose): string => (pose === MOTION_FRAME_STAND ? MOTION_CHARACTER_FRAMES[profile] : (MOTION_CHARACTER_POSE_FRAMES[profile] as Partial<Record<MotionFramePose, string>>)[pose] || MOTION_CHARACTER_FRAMES[profile]);
