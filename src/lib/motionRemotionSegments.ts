import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { createHash } from "node:crypto";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_REMOTION_RENDER as R } from "../constants/motionRemotionRender.js";
import type { MotionRemotionSpec } from "../types/motionVisual.js";
const NON_VISUAL = new Set<string>([
  RT_MAINTENANCE.GENERATION,
  RT_MAINTENANCE.BUILD,
  RT_MAINTENANCE.REQUESTKEYS,
  RT_MAINTENANCE.WRITTENMOTIONKEY,
  RT_MAINTENANCE.ACTIONPLAN,
  RT_MAINTENANCE.MOTIONINTENT,
  RT_MAINTENANCE.DRAWINGNOTE,
  RT_MAINTENANCE.SOURCEKEY,
  RT_MAINTENANCE.SOURCEBEATIDS,
  RT_MAINTENANCE.FAILSTREAK,
  RT_MAINTENANCE.DEFERRED,
  RT_MAINTENANCE.QUALITYNOTE,
  RT_MAINTENANCE.QUALITYREDRAWS,
  RT_MAINTENANCE.REVIEWKEY,
  RT_MAINTENANCE.CONTINUITYDRAFT,
  RT_MAINTENANCE.CONTINUITYKEY,
  RT_MAINTENANCE.REMOVEDOBJECTS,
]);
const visualScene = (scene: MotionRemotionSpec["scenes"][number]) => (scene.html ? { id: scene.id, renderer: scene.renderer, startFrame: scene.startFrame, endFrame: scene.endFrame, htmlHash: scene.html.hash, seed: scene.html.seed, speaking: scene.speaking } : Object.fromEntries(Object.entries(scene).filter(([key]) => !NON_VISUAL.has(key))));
export interface MotionRemotionSegment {
  index: number;
  start: number;
  end: number;
  key: string;
  sceneIds: string[];
}
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
  const global = stringifyJson([R.SEGMENT_VERSION, spec.renderer, encoding, spec.version, spec.aspect, spec.fps, spec.width, spec.height, spec.motion, spec.profileId, spec.fontFamily, spec.renderBehavior, spec.resolvedSettings, total]);
  return bounds.map(([from, to], index) => {
    const scenes = (spec.scenes || []).filter((scene) => scene.startFrame <= to && scene.endFrame > from).map(visualScene);
    const text = stringifyJson(scenes);
    const assets = Object.keys(spec.assets || {})
      .filter((key) => text.includes(key))
      .sort()
      .map((key) => [key, spec.assets[key]]);
    const subtitles = (spec.subtitles || []).filter((item) => item.start * spec.fps <= to + 1 && item.end * spec.fps >= from - 1);
    const key = createHash(RT_MAINTENANCE.SHA256)
      .update(stringifyJson([global, from, to, scenes, assets, subtitles]))
      .digest(RT_MAINTENANCE.HEX);
    return { index, start: from, end: to, key, sceneIds: (spec.scenes || []).filter((scene) => scene.startFrame <= to && scene.endFrame > from).map((scene) => scene.id) };
  });
};
export const motionSegmentLanes = <T extends { start: number; end: number }>(items: T[], lanes: number): T[][] => {
  const result: { frames: number; items: T[] }[] = Array.from({ length: Math.max(1, lanes) }, () => ({ frames: 0, items: [] }));
  for (const item of [...items].sort((a, b) => b.end - b.start - (a.end - a.start))) {
    const lane = result.reduce((min, next) => (next.frames < min.frames ? next : min));
    lane.items.push(item);
    lane.frames += item.end - item.start + 1;
  }
  return result.map((lane) => lane.items.sort((a, b) => a.start - b.start)).filter((lane) => lane.length);
};
