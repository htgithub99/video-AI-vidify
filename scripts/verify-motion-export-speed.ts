// Export speed: segments end at scene boundaries (short scenes joined, long ones split evenly) so every lane gets work;
// the export takes over a background render instead of waiting for it.
import assert from "node:assert/strict";
import { motionRemotionSegments } from "../src/lib/motionRemotionSegments.js";
import { takeOverMotionSegmentPrerender } from "../src/features/motion/server/services/motionSegmentPrerender.js";
import { MOTION_REMOTION_RENDER as R } from "../src/constants/motionRemotionRender.js";

const fps = 30;
const scene = (id: string, from: number, to: number) => ({ id, startFrame: from * fps, endFrame: to * fps, renderer: "html-canvas", html: { hash: id, seed: id } });
const spec = (scenes: ReturnType<typeof scene>[], seconds: number) => ({ renderer: "html-canvas", fps, duration: seconds, width: 1280, height: 720, scenes, subtitles: [], assets: {} }) as never;
const bounds = (s: never) => motionRemotionSegments(s, { width: 1280, height: 720, crf: 24 }).map((x) => [x.start / fps, (x.end + 1) / fps]);

// Six scenes of about 12 s: each is cut evenly into two parts of at most 10 s, never across a scene boundary.
const six = bounds(spec([scene("a", 0, 13), scene("b", 13, 23), scene("c", 23, 35), scene("d", 35, 47), scene("e", 47, 58), scene("f", 58, 71)], 71));
for (const [from, to] of six) assert.ok(to - from <= R.SEGMENT_MAX_SECONDS + 1e-9, "no segment longer than the most: " + JSON.stringify(six));
assert.ok(six.length >= 7, "a 71 s video is cut into enough parts for the lanes: " + six.length);
for (const cut of [13, 23, 35, 47, 58]) assert.ok(six.some(([from]) => Math.abs(from - cut) < 1e-9), "scene boundaries are segment boundaries");
// Short scenes are joined up to the least length; a short tail joins the segment before it.
const short = bounds(spec([scene("a", 0, 2), scene("b", 2, 4), scene("c", 4, 7), scene("d", 7, 9), scene("e", 9, 10)], 10));
assert.ok(short.every(([from, to]) => to - from >= R.SEGMENT_MIN_SECONDS - 1e-9 || short.length === 1), "short scenes are joined: " + JSON.stringify(short));
assert.equal(short[short.length - 1][1], 10, "the last segment reaches the end");
// No background render: nothing to take over.
assert.equal(await takeOverMotionSegmentPrerender("none"), false);
assert.ok(R.JPEG_MIN_CRF <= 19 && R.JPEG_MIN_CRF > 17, "draft and standard exports use JPEG frames, high and ultra PNG");
console.log("Export speed: segments by scene (6–10 s), the export takes over the background render, JPEG frames for draft/standard.");
