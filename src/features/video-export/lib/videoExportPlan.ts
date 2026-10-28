import _ from "lodash";
import { VIDEO_EXPORT_CONSTANTS } from "../constants/videoExport.js";
import { VideoExportConfig, VideoExportSlideMode, VideoExportTransition } from "../types/videoExport.js";
export type VideoExportSlidePlan = { segmentCount: number; slideSeconds: number; transitionSeconds: number };
export const computeVideoExportSlidePlan = (totalSeconds: number, imageCount: number, config: Pick<VideoExportConfig, "slideMode" | "slideSeconds" | "transition" | "transitionSeconds">): VideoExportSlidePlan => {
  const safeTotal = Math.max(0, _.toNumber(totalSeconds) || 0);
  const safeImageCount = Math.max(1, _.toInteger(imageCount) || 1);
  if (safeTotal <= 0) return { segmentCount: 0, slideSeconds: 0, transitionSeconds: 0 };
  const requestedCount = config.slideMode === VideoExportSlideMode.FIXED ? Math.ceil(safeTotal / Math.max(VIDEO_EXPORT_CONSTANTS.MIN_SLIDE_SECONDS, config.slideSeconds)) : safeImageCount;
  const maxByDuration = Math.max(1, Math.floor(safeTotal / VIDEO_EXPORT_CONSTANTS.MIN_SLIDE_SECONDS));
  const segmentCount = _.clamp(requestedCount, 1, Math.min(VIDEO_EXPORT_CONSTANTS.MAX_SEGMENTS, maxByDuration));
  const requestedTransition = config.transition === VideoExportTransition.NONE || segmentCount === 1 ? 0 : Math.max(0, config.transitionSeconds);
  const transitionSeconds = Math.min(requestedTransition, safeTotal / segmentCount / 3);
  const slideSeconds = (safeTotal + (segmentCount - 1) * transitionSeconds) / segmentCount;
  return { segmentCount, slideSeconds, transitionSeconds };
};
