import { MotionJobStatus, type MotionJobState, type MotionStoryJobState } from "../types/motionVideo.js";
export const motionDisplayedJob = (story?: MotionStoryJobState | null, render?: MotionJobState | null, latestLogId?: string): MotionStoryJobState | MotionJobState | undefined => {
  const jobs = [story, render].filter((job): job is MotionStoryJobState | MotionJobState => !!job);
  const active = jobs.filter((job) => ![MotionJobStatus.COMPLETED, MotionJobStatus.ERROR, MotionJobStatus.CANCELLED].includes(job.status));
  if (!active.length && latestLogId && !jobs.some((job) => job.id === latestLogId)) return undefined;
  return (active.length ? active : jobs).reduce<MotionStoryJobState | MotionJobState | undefined>((latest, job) => (!latest || job.startedAt > latest.startedAt ? job : latest), undefined);
};
