import { MOTION_REMOTION_RENDER as R } from "../constants/motionRemotionRender.js";
export const motionRemotionRenderConcurrency = (cpus: number, freeBytes: number): number => Math.max(1, Math.min(R.MAX_WORKERS, Math.floor(freeBytes / R.BYTES_PER_WORKER), cpus - R.RESERVED_CPUS));
export const motionRemotionRenderLanes = (cpus: number, freeBytes: number, segments: number): { lanes: number; perLane: number } => {
  const budget = motionRemotionRenderConcurrency(cpus, freeBytes);
  const perLane = Math.max(1, Math.min(R.WORKERS_PER_LANE, budget));
  const lanes = Math.max(1, Math.min(R.MAX_LANES, Math.floor(budget / perLane), Math.max(1, segments)));
  return { lanes, perLane };
};
export const motionHtmlRenderLanes = (cpus: number, freeBytes: number, segments: number): { lanes: number; perLane: number } => ({ lanes: Math.max(1, Math.min(motionRemotionRenderConcurrency(cpus, freeBytes), Math.max(1, segments))), perLane: 1 });
