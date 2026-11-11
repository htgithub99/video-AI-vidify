import { MOTION_STORY_CONFIG } from "../constants/motionVideo.js";
import type { MotionAiExecution } from "../types/motionVideo.js";
import { chatRoomLanes } from "./chatExecutionPolicy.js";
export const motionAiFallbackPolicy = (exec: Pick<MotionAiExecution, "allowFallback" | "strictProvider">): { allowFallback: boolean; strictProvider: boolean } => {
  const allowFallback = exec.allowFallback ?? !exec.strictProvider;
  return { allowFallback, strictProvider: !allowFallback };
};
export const motionSceneWorkerIds = (exec?: Pick<MotionAiExecution, "multiSceneRooms">): string[] => MOTION_STORY_CONFIG.SCENE_WORKER_IDS.slice(0, chatRoomLanes({ multiRoom: exec?.multiSceneRooms === true }));
export const motionContentWorkerIds = (exec?: Pick<MotionAiExecution, "multiRoom">): string[] => MOTION_STORY_CONFIG.WORKER_IDS.slice(0, chatRoomLanes(exec));
export const motionPlanWorkerIds = (exec?: Pick<MotionAiExecution, "multiRoom">): string[] => MOTION_STORY_CONFIG.PLAN_WORKER_IDS.slice(0, chatRoomLanes(exec));
export const motionLightWorkerIds = (exec?: Pick<MotionAiExecution, "multiRoom">): string[] => MOTION_STORY_CONFIG.LIGHT_WORKER_IDS.slice(0, chatRoomLanes(exec));
