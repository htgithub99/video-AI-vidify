import assert from "node:assert/strict";
import { motionOutputConformance } from "../src/lib/motionOutputConformance.js";

const settings = { aspect: "16:9", fps: 30, quality: "standard", subtitles: true } as any;
const spec: any = { fps: 30, aspect: "16:9", duration: 10, subtitles: [{ start: 0, end: 2, text: "a" }] };
const ok: any = { aspect: "16:9", fps: 30, quality: "standard", width: 1920, height: 1080, durationSeconds: 10.02, resolvedSettings: { subtitles: true } };
assert.deepEqual(motionOutputConformance(settings, spec, ok, true), []);
assert.equal(motionOutputConformance(settings, spec, { ...ok, fps: 24 }, true).length, 1, "fps mismatch");
assert.equal(motionOutputConformance(settings, spec, { ...ok, aspect: "9:16", width: 1080, height: 1920 }, true).length, 2, "aspect + size mismatch");
assert.equal(motionOutputConformance(settings, spec, { ...ok, quality: "high" }, true).length, 1, "quality mismatch");
assert.equal(motionOutputConformance({ ...settings, subtitles: false }, spec, ok, false).length, 1, "subtitles burned although off");
assert.equal(motionOutputConformance(settings, spec, { ...ok, resolvedSettings: { subtitles: false } }, true).length, 1, "subtitles missing although on");
assert.equal(motionOutputConformance(settings, spec, { ...ok, durationSeconds: 9 }, true).length, 1, "duration drift");
assert.equal(motionOutputConformance(settings, spec, { ...ok, width: 1920, height: 1088 }, true).length, 0, "even-pixel rounding tolerated");
console.log(JSON.stringify({ pass: true, cases: 8 }));
