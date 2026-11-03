import type { MotionFacing, MotionPosture } from "../sceneSpec.js";
export const MOTION_FRAME_POSES = ["stand", "walk", "kneel", "sit", "ride", "back"] as const;
export type MotionFramePose = (typeof MOTION_FRAME_POSES)[number];
export type MotionFramePoseSet = Partial<Record<Exclude<MotionFramePose, "stand">, string>>;
export const MOTION_FRAME_POSE_OF: Record<MotionPosture, MotionFramePose> = {
  stand: "stand",
  sit: "sit",
  sit_ground: "sit",
  kneel: "kneel",
  crouch: "kneel",
  slump: "sit",
  lie: "stand",
  mounted: "ride",
  dismount: "stand",
  lead: "walk",
  carry: "walk",
  aim: "stand",
  walk: "walk",
  run: "walk",
  hand_over: "stand",
  fall: "stand",
  back: "back",
};
export const MOTION_FRAME_FACING_POSE: Partial<Record<MotionFacing, MotionFramePose>> = { back: "back" };
export const MOTION_FRAME_FACING_KEEPS: readonly MotionFramePose[] = ["sit", "kneel", "ride"];
export const MOTION_FRAME_POSE_FALLBACK: Record<MotionFramePose, MotionFramePose> = { stand: "stand", walk: "stand", kneel: "sit", sit: "stand", ride: "sit", back: "stand" };
export const MOTION_FRAME_STAND: MotionFramePose = "stand";
export const MOTION_FRAME_MAX_EXTRA = 2;
