import { MOTION_RENDER_VALIDATION as V } from "../constants/motionRenderValidation.js";
import type { MotionRenderSpec } from "../types/motionVisual.js";
import { isRemotionSpec } from "./motionVisual.js";
export interface MotionMediaRange {
  start: number;
  end: number;
}
const merged = (ranges: MotionMediaRange[]): MotionMediaRange[] => {
  const result: MotionMediaRange[] = [];
  for (const range of ranges.filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start).sort((a, b) => a.start - b.start)) {
    const before = result[result.length - 1];
    if (before && range.start <= before.end) before.end = Math.max(before.end, range.end);
    else result.push({ ...range });
  }
  return result;
};
const overlap = (a: MotionMediaRange, b: MotionMediaRange): number => Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
export const motionOutputQualityIssues = (stderr: string, spec: MotionRenderSpec, speech: MotionMediaRange[] = []): string[] => {
  const remotion = isRemotionSpec(spec);
  const shots = remotion ? [] : spec.shots;
  const duration = spec.duration || Math.max(0, ...shots.map((shot) => shot.end));
  const margin = 2 / (spec.fps || 30);
  const intentionalBlack = merged([
    { start: 0, end: Math.max(0, remotion ? 0 : (spec.fadeIn ?? V.DEFAULT_FADE_IN)) * V.FADE_BLACK_RATIO + margin },
    { start: duration - Math.max(0, remotion ? 0 : (spec.fadeOut ?? V.DEFAULT_FADE_OUT)) * V.FADE_BLACK_RATIO - margin, end: duration },
    ...shots
      .filter((shot) => shot.transition?.type === V.DIP)
      .map((shot) => {
        const seconds = Math.max(0, shot.transition?.duration || 0);
        const center = shot.start + seconds / 2;
        const half = (seconds * V.FADE_BLACK_RATIO) / 2 + margin;
        return { start: center - half, end: center + half };
      }),
  ]);
  const errors: string[] = [];
  for (const match of stderr.matchAll(V.BLACK_INTERVAL)) {
    const range = { start: Number(match[1]), end: Number(match[2]) };
    const allowed = intentionalBlack.reduce((total, intentional) => total + overlap(range, intentional), 0);
    if (range.end - range.start - allowed >= V.UNEXPECTED_BLACK_SECONDS) errors.push(V.QUALITY_BLACK(range.start, range.end));
  }
  let start: number | undefined;
  const silence: MotionMediaRange[] = [];
  for (const match of stderr.matchAll(V.SILENCE_EVENT)) {
    if (match[1] === "start") start = Number(match[2]);
    else if (start !== undefined) {
      silence.push({ start, end: Number(match[2]) });
      start = undefined;
    }
  }
  if (start !== undefined) silence.push({ start, end: duration });
  const audible = merged(speech);
  for (const range of silence) if (audible.reduce((total, required) => total + overlap(range, required), 0) >= V.SPEECH_SILENCE_SECONDS) errors.push(V.QUALITY_SILENCE(range.start, range.end));
  return errors;
};
