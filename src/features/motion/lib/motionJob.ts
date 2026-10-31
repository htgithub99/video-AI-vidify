import { MotionJobStatus, MotionStoryJobKind, type MotionStoryJobState } from "../../../types/motionVideo.js";
export const isMotionJobTerminal = (status: MotionJobStatus): boolean => status === MotionJobStatus.COMPLETED || status === MotionJobStatus.ERROR || status === MotionJobStatus.CANCELLED;
export const isMotionStageBusy = (job: MotionStoryJobState | null | undefined, kind: MotionStoryJobKind, stage: string): boolean => {
  if (!job || isMotionJobTerminal(job.status)) return false;
  if (job.kind === kind) return true;
  const step = job.kind === MotionStoryJobKind.PRODUCTION ? job.stepStates?.[stage] : undefined;
  return !!step && !isMotionJobTerminal(step.status);
};
