import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import { machineCpus } from "../../../../server/services/lowSpecPolicy.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_REMOTION_RENDER as R } from "../../../../constants/motionRemotionRender.js";
import { MOTION_RENDER_CACHE } from "../../../../constants/motionVideo.js";
import { motionRemotionSegments, motionSegmentLanes, type MotionRemotionSegment } from "../../../../lib/motionRemotionSegments.js";
import { motionRemotionRenderLanes } from "../../../../lib/motionRemotionPerformance.js";
import { renderRemotionSegments } from "./motionRemotionRenderService.js";
import { validateMotionMedia } from "./motionMediaValidation.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import type { MotionRemotionSpec } from "../../../../types/motionVisual.js";
export interface MotionSegmentEncoding {
  width: number;
  height: number;
  crf: number;
}
export const motionSegmentRoot = (): string => path.join(getMotionRootDirectory(), R.SEGMENT_FOLDER);
export const motionSegmentFile = (segment: Pick<MotionRemotionSegment, "key">): string => path.join(motionSegmentRoot(), R.SEGMENT_FILE(segment.key));
const frames = (segment: MotionRemotionSegment) => segment.end - segment.start + 1;
export const motionCachedSegments = async (spec: MotionRemotionSpec, segments: MotionRemotionSegment[], encoding: MotionSegmentEncoding, signal?: AbortSignal): Promise<Set<string>> => {
  const done = new Set<string>();
  for (const segment of segments) {
    signal?.throwIfAborted();
    const file = motionSegmentFile(segment);
    if (!fs.existsSync(file)) continue;
    try {
      await validateMotionMedia(file, { seconds: frames(segment) / spec.fps, width: encoding.width, height: encoding.height, fps: spec.fps, frames: frames(segment) }, signal);
      fs.utimesSync(file, new Date(), new Date());
      done.add(segment.key);
    } catch {
      signal?.throwIfAborted();
      fs.rmSync(file, { force: true });
    }
  }
  return done;
};
export const pruneMotionSegments = (): void => {
  const root = motionSegmentRoot();
  fs.mkdirSync(root, { recursive: true });
  for (const entry of fs.readdirSync(root)) {
    const file = path.join(root, entry);
    if (Date.now() - fs.statSync(file).mtimeMs > R.SEGMENT_MAX_AGE_MS) fs.rmSync(file, { force: true });
  }
};
export const renderMotionSegmentsToCache = async (spec: MotionRemotionSpec, todo: MotionRemotionSegment[], encoding: MotionSegmentEncoding, options: { signal: AbortSignal; lanes?: { lanes: number; perLane: number }; log?: (line: string) => void; onFrames?: (rendered: number) => void; onSegment?: (segment: MotionRemotionSegment) => void }): Promise<{ lanes: number; perLane: number }> => {
  const plan = options.lanes || motionRemotionRenderLanes(machineCpus(), os.freemem(), todo.length);
  if (!todo.length) return plan;
  fs.mkdirSync(motionSegmentRoot(), { recursive: true });
  const laneFrames = new Array(plan.lanes).fill(0);
  const laneAbort = new AbortController();
  const laneSignal = AbortSignal.any([options.signal, laneAbort.signal]);
  const renderLane = async (laneSegments: MotionRemotionSegment[], lane: number, base: number) => {
    const outputs = laneSegments.map((segment) => ({ start: segment.start, end: segment.end, output: motionSegmentFile(segment) + MOTION_RENDER_CACHE.TEMP_SUFFIX }));
    try {
      await renderRemotionSegments(spec, outputs, {
        ...encoding,
        log: options.log,
        concurrency: plan.perLane,
        signal: laneSignal,
        onProgress: (done) => {
          laneFrames[lane] = base + done;
          options.onFrames?.(laneFrames.reduce((sum, value) => sum + value, 0));
        },
        onSegment: async (index) => {
          const segment = laneSegments[index];
          if (spec.renderer === RT_MAINTENANCE.HTML_CANVAS) segment.key = motionRemotionSegments(spec, encoding).find((fresh) => fresh.start === segment.start && fresh.end === segment.end)?.key || segment.key;
          await validateMotionMedia(outputs[index].output, { seconds: frames(segment) / spec.fps, width: encoding.width, height: encoding.height, fps: spec.fps, frames: frames(segment) }, laneSignal);
          fs.renameSync(outputs[index].output, motionSegmentFile(segment));
          options.onSegment?.(segment);
        },
      });
    } catch (error) {
      laneAbort.abort();
      for (const output of outputs) fs.rmSync(output.output, { force: true });
      throw error;
    }
  };
  const html = spec.renderer === RT_MAINTENANCE.HTML_CANVAS && spec.scenes.every((scene) => scene.renderer === RT_MAINTENANCE.HTML_CANVAS);
  const queue = [...todo].sort((a, b) => b.end - b.start - (a.end - a.start));
  const outcomes = await Promise.allSettled(
    html
      ? Array.from({ length: Math.min(plan.lanes, queue.length) }, async (_, lane) => {
          let base = 0;
          for (let segment = queue.shift(); segment; segment = queue.shift()) {
            laneSignal.throwIfAborted();
            await renderLane([segment], lane, base);
            base += frames(segment);
          }
        })
      : motionSegmentLanes(todo, plan.lanes).map((laneSegments, lane) => renderLane(laneSegments, lane, 0)),
  );
  const failed = outcomes.find((outcome) => outcome.status === RT_MAINTENANCE.REJECTED) as PromiseRejectedResult | undefined;
  if (failed) throw failed.reason;
  return plan;
};
export { motionRemotionSegments };
