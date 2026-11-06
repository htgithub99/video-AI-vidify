import { MOTION_QUALITY_PRESETS, MOTION_ASPECT_BASE } from "../../../../constants/motionVideo.js";
import { MOTION_REMOTION_RENDER as R } from "../../../../constants/motionRemotionRender.js";
import { MotionQuality } from "../../../../types/motionVideo.js";
import { motionCachedSegments, motionRemotionSegments, renderMotionSegmentsToCache } from "./motionRemotionSegmentCache.js";
import type { MotionRemotionSpec } from "../../../../types/motionVisual.js";

/**
 * Rolling pre-render: while scenes are still being drawn, every scene-aligned segment whose scenes are all
 * final is rendered into the shared segment cache. The export later reuses those files (same content hash),
 * so most frames are already encoded when the last scene is accepted. One small lane only, so it never
 * competes with the Chrome rooms for the whole CPU.
 */
interface Prerender {
  running?: Promise<void>;
  pending?: { spec: MotionRemotionSpec; ready: Set<string> };
  controller: AbortController;
  log?: (line: string) => void;
}
const runs = new Map<string, Prerender>();
export const motionPrerenderEncoding = (spec: Pick<MotionRemotionSpec, "aspect">, quality?: string) => {
  const preset = MOTION_QUALITY_PRESETS[quality as MotionQuality] || MOTION_QUALITY_PRESETS[MotionQuality.STANDARD];
  const base = MOTION_ASPECT_BASE[spec.aspect] || MOTION_ASPECT_BASE["16:9"];
  const even = (value: number) => Math.round(value / 2) * 2;
  return { width: even(base.w * preset.scale), height: even(base.h * preset.scale), crf: preset.crf };
};
const drain = async (id: string, run: Prerender, quality?: string): Promise<void> => {
  while (run.pending && !run.controller.signal.aborted) {
    const { spec, ready } = run.pending;
    run.pending = undefined;
    const encoding = motionPrerenderEncoding(spec, quality);
    const segments = motionRemotionSegments(spec, encoding).filter((segment) => segment.sceneIds.every((sceneId) => ready.has(sceneId)));
    const cached = await motionCachedSegments(spec, segments, encoding, run.controller.signal);
    const todo = segments.filter((segment) => !cached.has(segment.key));
    if (!todo.length) continue;
    await renderMotionSegmentsToCache(spec, todo, encoding, { signal: run.controller.signal, lanes: { lanes: 1, perLane: R.PRERENDER_THREADS }, log: run.log, onSegment: () => run.log?.(R.PRERENDERED(id)) });
  }
};
/** Queue the latest partial spec; only the newest one is kept while a render is in flight. */
export const scheduleMotionSegmentPrerender = (id: string, spec: MotionRemotionSpec, readySceneIds: Iterable<string>, quality?: string, log?: (line: string) => void): void => {
  const run = runs.get(id) || { controller: new AbortController() };
  runs.set(id, run);
  run.log = log;
  run.pending = { spec, ready: new Set(readySceneIds) };
  if (run.running) return;
  run.running = drain(id, run, quality)
    .catch((error: unknown) => {
      if (!run.controller.signal.aborted) log?.(R.PRERENDER_SKIPPED(String((error as Error)?.message || error)));
    })
    .finally(() => {
      run.running = undefined;
      if (run.pending && !run.controller.signal.aborted) scheduleMotionSegmentPrerender(id, run.pending.spec, run.pending.ready, quality, log);
    });
};
/** Export waits for an in-flight pre-render so it never renders the same segment twice. */
export const waitMotionSegmentPrerender = async (id: string | undefined, signal?: AbortSignal): Promise<void> => {
  const run = id ? runs.get(id) : undefined;
  if (!run) return;
  run.pending = undefined;
  if (!run.running) return;
  const stop = () => run.controller.abort();
  signal?.addEventListener("abort", stop, { once: true });
  try {
    await run.running;
  } finally {
    signal?.removeEventListener("abort", stop);
  }
};
export const stopMotionSegmentPrerender = (id: string): void => {
  runs.get(id)?.controller.abort();
  runs.delete(id);
};
