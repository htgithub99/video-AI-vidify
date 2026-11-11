import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import type { MotionOutputSettings, MotionResultItem } from "../types/motionVideo.js";
import type { MotionRenderSpec } from "../types/motionVisual.js";
import { MOTION_OUTPUT_CONFORMANCE as T } from "../constants/motionOutputConformance.js";
export const motionOutputConformance = (settings: Pick<MotionOutputSettings, "aspect" | "fps" | "quality" | "subtitles">, spec: Pick<MotionRenderSpec, "fps" | "aspect" | "subtitles" | "duration">, result: Pick<MotionResultItem, "aspect" | "fps" | "quality" | "durationSeconds" | "width" | "height"> & { resolvedSettings?: { subtitles?: boolean } }, expectedSubtitles: boolean): string[] => {
  const issues: string[] = [];
  if (result.aspect !== settings.aspect) issues.push(T.ASPECT(settings.aspect, result.aspect));
  if (Math.abs(Number(result.fps) - Number(settings.fps)) > 0.01) issues.push(T.FPS(settings.fps, result.fps));
  if (result.quality !== settings.quality) issues.push(T.QUALITY(settings.quality, result.quality));
  const [w, h] = settings.aspect.split(RT_MAINTENANCE.COLON).map(Number);
  if (w > 0 && h > 0 && result.width && result.height && Math.abs(result.width / result.height - w / h) > T.RATIO_TOLERANCE) issues.push(T.SIZE(settings.aspect, result.width, result.height));
  const burned = result.resolvedSettings?.subtitles ?? !!spec.subtitles?.length;
  if (settings.subtitles === false && burned) issues.push(T.SUBTITLES_OFF);
  if (settings.subtitles !== false && expectedSubtitles && !burned) issues.push(T.SUBTITLES_ON);
  if (Number.isFinite(spec.duration) && Number.isFinite(result.durationSeconds) && Math.abs(result.durationSeconds - spec.duration) > Math.max(T.DURATION_TOLERANCE, 2 / (Number(settings.fps) || 30))) issues.push(T.DURATION(spec.duration, result.durationSeconds));
  return issues;
};
