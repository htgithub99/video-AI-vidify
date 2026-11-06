import { createHash } from "node:crypto";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_REMOTION_RENDER as R } from "../constants/motionRemotionRender.js";
import type { MotionRemotionSpec } from "../types/motionVisual.js";

/** Scene fields that never change a rendered pixel (bookkeeping, prompts, scores); excluded from cache keys. */
const NON_VISUAL = new Set(["generation", "build", "requestKeys", "writtenMotionKey", "actionPlan", "motionIntent", "drawingNote", "sourceKey", "sourceBeatIds", "failStreak", "deferred", "qualityNote", "qualityRedraws", "reviewKey", "continuityDraft", "continuityKey", "removedObjects"]);
const visualScene = (scene: object) => Object.fromEntries(Object.entries(scene).filter(([key]) => !NON_VISUAL.has(key)));
export interface MotionRemotionSegment {
  index: number;
  /** Inclusive frame range. */
  start: number;
  end: number;
  /** Content hash: changes only when something drawn inside this range (or a global render setting) changes. */
  key: string;
  /** Scenes visible in this range: the segment can be pre-rendered once all of them are final. */
  sceneIds: string[];
}
/**
 * Splits a spec into frame ranges cut at scene boundaries (~R.SEGMENT_SECONDS each), so a redrawn scene
 * invalidates only its own segment and segments can render in parallel lanes. Output is identical to one
 * continuous render: same composition, same absolute frame numbers.
 */
export const motionRemotionSegments = (spec: MotionRemotionSpec, encoding: { width: number; height: number; crf: number }): MotionRemotionSegment[] => {
  const total = Math.ceil(spec.duration * spec.fps);
  const target = Math.max(1, Math.round(R.SEGMENT_SECONDS * spec.fps));
  const cuts = [...new Set((spec.scenes || []).map((scene) => scene.startFrame).filter((frame) => frame > 0 && frame < total))].sort((a, b) => a - b);
  const bounds: [number, number][] = [];
  let start = 0;
  for (const cut of cuts) {
    if (cut - start >= target) {
      bounds.push([start, cut - 1]);
      start = cut;
    }
  }
  bounds.push([start, total - 1]);
  // Everything that can change a frame but is not tied to one scene.
  const global = stringifyJson([R.SEGMENT_VERSION, encoding, spec.version, spec.aspect, spec.fps, spec.width, spec.height, spec.motion, spec.profileId, spec.fontFamily, spec.renderBehavior, spec.resolvedSettings, total]);
  return bounds.map(([from, to], index) => {
    const scenes = (spec.scenes || []).filter((scene) => scene.startFrame <= to && scene.endFrame > from).map(visualScene);
    const text = stringifyJson(scenes);
    const assets = Object.keys(spec.assets || {})
      .filter((key) => text.includes(key))
      .sort()
      .map((key) => [key, spec.assets[key]]);
    const subtitles = (spec.subtitles || []).filter((item) => item.start * spec.fps <= to + 1 && item.end * spec.fps >= from - 1);
    const key = createHash("sha256").update(stringifyJson([global, from, to, scenes, assets, subtitles])).digest("hex");
    return { index, start: from, end: to, key, sceneIds: (spec.scenes || []).filter((scene) => scene.startFrame <= to && scene.endFrame > from).map((scene) => scene.id) };
  });
};
/** Splits work into `lanes` lists of similar frame counts (longest first), preserving nothing about order. */
export const motionSegmentLanes = <T extends { start: number; end: number }>(items: T[], lanes: number): T[][] => {
  const result: { frames: number; items: T[] }[] = Array.from({ length: Math.max(1, lanes) }, () => ({ frames: 0, items: [] }));
  for (const item of [...items].sort((a, b) => b.end - b.start - (a.end - a.start))) {
    const lane = result.reduce((min, next) => (next.frames < min.frames ? next : min));
    lane.items.push(item);
    lane.frames += item.end - item.start + 1;
  }
  return result.map((lane) => lane.items.sort((a, b) => a.start - b.start)).filter((lane) => lane.length);
};
