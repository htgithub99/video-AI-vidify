import { MOTION_REMOTION_RENDER as R } from "../constants/motionRemotionRender.js";
export const motionRemotionRenderConcurrency = (cpus: number, freeBytes: number): number => Math.max(1, Math.min(R.MAX_WORKERS, Math.floor(freeBytes / R.BYTES_PER_WORKER), cpus));
