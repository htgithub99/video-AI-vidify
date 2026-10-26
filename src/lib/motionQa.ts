import { MOTION_QA as Q } from "../constants/motionQa.js";
export const motionDurationQa = (actual: number, target: number): string => {
  if (!Number.isFinite(actual) || actual <= 0) return Q.LEVEL.ERROR;
  if (!Number.isFinite(target) || target <= 0) return Q.LEVEL.OK;
  const ratio = actual / target;
  if (ratio < Q.DURATION_MIN_RATIO || ratio > Q.DURATION_MAX_RATIO) return Q.LEVEL.ERROR;
  return Math.abs(ratio - 1) > Q.DURATION_TOLERANCE ? Q.LEVEL.WARNING : Q.LEVEL.OK;
};
export const motionVisualCheckBlocks = (check: { ok?: boolean; category?: string }): boolean => check.ok === false && !Q.REVIEW_MINOR.includes(check.category || "");
