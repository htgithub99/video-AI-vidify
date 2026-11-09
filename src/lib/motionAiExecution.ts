import { MOTION_STORY_CONFIG } from "../constants/motionVideo.js";
import type { MotionAiExecution } from "../types/motionVideo.js";
export const motionAiFallbackPolicy = (exec: Pick<MotionAiExecution, "allowFallback" | "strictProvider">): { allowFallback: boolean; strictProvider: boolean } => {
  const allowFallback = exec.allowFallback ?? !exec.strictProvider;
  return { allowFallback, strictProvider: !allowFallback };
};
export const motionSceneWorkerIds = (exec?: Pick<MotionAiExecution, "multiSceneRooms">): string[] =>
  exec?.multiSceneRooms === false ? MOTION_STORY_CONFIG.SCENE_WORKER_IDS.slice(0, 1) : [...MOTION_STORY_CONFIG.SCENE_WORKER_IDS];
