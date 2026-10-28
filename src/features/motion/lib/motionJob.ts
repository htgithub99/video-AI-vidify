import { MotionJobStatus } from "../../../types/motionVideo.js";
export const isMotionJobTerminal = (status: MotionJobStatus): boolean => status === MotionJobStatus.COMPLETED || status === MotionJobStatus.ERROR || status === MotionJobStatus.CANCELLED;
