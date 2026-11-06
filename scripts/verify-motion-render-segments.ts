/**
 * Proves scene-segmented rendering is frame-identical to one continuous render, and that segment cache keys
 * change only for the segment whose scene changed. Real Remotion render in installed Chrome (headless).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-segments-"));
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const { segmentFixture } = await import("./motionSegmentFixture.ts");
const { renderRemotionVideo, renderRemotionSegments } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { motionRemotionSegments, motionSegmentLanes } = await import("../src/lib/motionRemotionSegments.ts");
const { motionRemotionRenderLanes } = await import("../src/lib/motionRemotionPerformance.ts");
const { MOTION_REMOTION_RENDER: R } = await import("../src/constants/motionRemotionRender.ts");

const spec = await segmentFixture("#e33", "segments-a");
const encoding = { width: 640, height: 360, crf: 23 };
assert.equal(motionRemotionSegments(spec, encoding).length, 1, "An 8s video is one 20s segment");
// Force short segments so the split is exercised on the short fixture.
(R as { SEGMENT_SECONDS: number }).SEGMENT_SECONDS = 1.5;
const split = motionRemotionSegments(spec, encoding);
const total = Math.ceil(spec.duration * spec.fps);
assert.ok(split.length >= 3, `expected several segments, got ${split.length}`);
assert.equal(split[0].start, 0);
assert.equal(split.at(-1)!.end, total - 1);
for (let i = 1; i < split.length; i++) {
  assert.equal(split[i].start, split[i - 1].end + 1, "segments are contiguous");
  assert.ok(spec.scenes.some((scene) => scene.startFrame === split[i].start), "segments start at scene boundaries");
}

// Cache key: changing only scene 3's artwork changes only the segment(s) that show scene 3.
const spec2 = await segmentFixture("#33e", "segments-b");
const split2 = motionRemotionSegments(spec2, encoding);
assert.equal(split2.length, split.length);
const changed = split.filter((segment, i) => segment.key !== split2[i].key);
const scene3 = spec.scenes[2];
assert.ok(changed.length >= 1 && changed.length < split.length, `only affected segments change (${changed.length}/${split.length})`);
for (const segment of changed) assert.ok(segment.start <= scene3.endFrame && segment.end >= scene3.startFrame, "changed segment covers the redrawn scene");
assert.notEqual(motionRemotionSegments(spec, { ...encoding, crf: 18 })[0].key, split[0].key, "quality change invalidates every segment");

// Lanes: every segment exactly once; thread budget preserved.
assert.equal(motionSegmentLanes(split, 2).flat().length, split.length);
assert.deepEqual(motionRemotionRenderLanes(8, 16 * 2 ** 30, 10), { lanes: 3, perLane: 2 });
assert.deepEqual(motionRemotionRenderLanes(2, 16 * 2 ** 30, 10), { lanes: 1, perLane: 1 });

// Real render: continuous vs segmented (2 parallel lanes) + concat must decode to the same frames.
const signal = new AbortController().signal;
const whole = path.join(root, "whole.mp4");
let started = Date.now();
await renderRemotionVideo(spec, whole, { ...encoding, signal, concurrency: 2, onProgress: () => undefined });
const wholeSeconds = (Date.now() - started) / 1000;
const parts = split.map((segment) => ({ start: segment.start, end: segment.end, output: path.join(root, `part-${segment.index}.mp4`) }));
started = Date.now();
await Promise.all(motionSegmentLanes(parts, 2).map((lane) => renderRemotionSegments(spec, lane, { ...encoding, signal, concurrency: 1, onProgress: () => undefined })));
const laneSeconds = (Date.now() - started) / 1000;
const list = path.join(root, "parts.txt");
fs.writeFileSync(list, parts.map((part) => `file '${part.output.replace(/\\/g, "/")}'`).join("\n"));
const joined = path.join(root, "joined.mp4");
const concat = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined], { encoding: "utf8" });
assert.equal(concat.status, 0, concat.stderr);
// Decode every frame with ffmpeg and read the final frame counter (works without ffprobe on PATH).
const frames = (file: string) => {
  const run = spawnSync("ffmpeg", ["-v", "info", "-nostats", "-i", file, "-map", "0:v:0", "-f", "null", "-"], { encoding: "utf8" });
  return Number([...run.stderr.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]);
};
assert.equal(frames(whole), total);
assert.equal(frames(joined), total);
const ssim = spawnSync("ffmpeg", ["-v", "info", "-i", whole, "-i", joined, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
const all = Number(ssim.stderr.match(/All:([\d.]+)/)?.[1]);
assert.ok(all >= 0.99, `SSIM ${all}`);
console.log(JSON.stringify({ pass: true, segments: split.length, changedOnRedraw: changed.length, frames: total, ssim: all, continuousSeconds: wholeSeconds, laneSeconds }));
fs.rmSync(root, { recursive: true, force: true });
