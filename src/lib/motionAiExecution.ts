import type { MotionAiExecution } from "../types/motionVideo.js";
export const motionAiFallbackPolicy = (exec: Pick<MotionAiExecution, "allowFallback" | "strictProvider">): { allowFallback: boolean; strictProvider: boolean } => {
  const allowFallback = exec.allowFallback ?? !exec.strictProvider;
  return { allowFallback, strictProvider: !allowFallback };
};
