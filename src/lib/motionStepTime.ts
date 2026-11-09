export interface MotionStepTiming {
  id?: string;
  startedAt?: number;
  updatedAt?: number;
  elapsedMs?: number;
  segmentAt?: number;
}
export const motionStepElapsedMs = (task?: MotionStepTiming, now?: number): number => {
  if (!task) return 0;
  if (task.segmentAt) return (task.elapsedMs || 0) + Math.max(0, (now ?? task.updatedAt ?? task.segmentAt) - task.segmentAt);
  if (task.elapsedMs !== undefined) return task.elapsedMs;
  return task.startedAt && task.updatedAt ? Math.max(0, (now ?? task.updatedAt) - task.startedAt) : 0;
};
export const motionStepSegment = (prior: MotionStepTiming | undefined, id: string, now = Date.now()): { elapsedMs: number; segmentAt: number } => (prior?.segmentAt && prior.id === id ? { elapsedMs: prior.elapsedMs || 0, segmentAt: prior.segmentAt } : { elapsedMs: motionStepElapsedMs(prior), segmentAt: now });
