import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFfmpegPath } from "../src/server/services/shortsPreprocessService.js";
import { validateMotionMedia, assertMotionSpeechAudio, checkMotionMediaTools } from "../src/server/services/motionMediaValidation.js";
import { MOTION_RENDER_VALIDATION as V } from "../src/constants/motionRenderValidation.js";
import { MOTION_LOUDNESS as L } from "../src/constants/motionLoudness.js";
import { motionOutputQualityIssues } from "../src/lib/motionOutputQuality.js";
import { getMotionRootDirectory, listMotionResults } from "../src/server/services/motionLibraryService.js";
import { publishMotionResult, finishMotionPublication, recoverMotionRenderPublications } from "../src/server/services/motionRenderPublication.js";
import type { MotionResultItem } from "../src/types/motionVideo.js";
const execute = promisify(execFile);
const root = path.resolve("scratch/thantrung-voice-20261025/media-validation");
fs.mkdirSync(root, { recursive: true });
await checkMotionMediaTools();
const good = path.join(root, "valid.mp4");
await execute(getFfmpegPath(), ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=320x180:r=16:d=2", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", good], { windowsHide: true });
const expected = { seconds: 2, width: 320, height: 180, fps: 16, frames: 32, audio: true };
assert.equal(await validateMotionMedia(good, expected), 2);
await assert.rejects(validateMotionMedia(good, { ...expected, width: 640 }));
await assert.rejects(validateMotionMedia(good, { ...expected, seconds: 20 }));
await assert.rejects(assertMotionSpeechAudio(good, 20));
const silent = path.join(root, "silent.mp4");
await execute(getFfmpegPath(), ["-y", "-v", "error", "-i", good, "-an", "-c:v", "copy", silent], { windowsHide: true });
await validateMotionMedia(silent, { ...expected, audio: false });
await assert.rejects(validateMotionMedia(silent, expected));
await assert.rejects(assertMotionSpeechAudio(silent, 2));
const corrupt = path.join(root, "truncated.mp4");
const data = fs.readFileSync(good);
fs.writeFileSync(corrupt, data.subarray(0, Math.floor(data.length / 2)));
await assert.rejects(validateMotionMedia(corrupt, expected));
const blank = path.join(root, "blank-speech.mp4");
await execute(getFfmpegPath(), ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x180:r=16:d=6", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "6", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", blank], { windowsHide: true });
const detected = await execute(getFfmpegPath(), ["-i", blank, "-vf", L.BLACK_FILTER, "-af", L.SILENCE_FILTER, "-f", "null", "-"], { windowsHide: true });
const qualitySpec = { duration: 6, fps: 16, fadeIn: 0, fadeOut: 0, shots: [{ start: 0, end: 6, template: "scene" }] };
assert.equal(motionOutputQualityIssues(detected.stderr, qualitySpec, [{ start: 0, end: 6 }]).length, 2);
assert.equal(motionOutputQualityIssues(detected.stderr, qualitySpec).length, 1);
assert.equal(motionOutputQualityIssues("black_start: 2.6 black_end: 3.4", { ...qualitySpec, shots: [{ start: 0, end: 6, template: "scene", transition: { type: V.DIP, duration: 6 } }] }).length, 0);
assert.equal(
  motionOutputQualityIssues("silence_start: 2\nsilence_end: 6", { ...qualitySpec, duration: 8 }, [
    { start: 0, end: 2 },
    { start: 6, end: 8 },
  ]).length,
  0,
);
assert.equal(motionOutputQualityIssues("silence_start: 2\nsilence_end: 6", { ...qualitySpec, duration: 8 }, [{ start: 0, end: 8 }]).length, 1);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), "motion-publication-"));
const prior = { storage: process.env.VIDIFY_STORAGE_DIR, app: process.env.APP_DATA_DIR };
process.env.VIDIFY_STORAGE_DIR = storage;
delete process.env.APP_DATA_DIR;
try {
  const output = getMotionRootDirectory();
  const checkpoints = path.join(output, V.CHECKPOINT_FOLDER);
  fs.mkdirSync(checkpoints, { recursive: true });
  const item = (id: string) => ({ id, fileName: id + ".mp4", title: id, videoUrl: "/" + id + ".mp4", aspect: "16:9", quality: "draft", width: 320, height: 180, fps: 16, durationSeconds: 2, sizeBytes: fs.statSync(good).size, renderSeconds: 1, encoder: "cpu", createdAt: new Date().toISOString() }) as MotionResultItem;
  const manifest = (id: string, source: string, renamed = false, audio = true) => {
    const pending = id + V.PART;
    fs.copyFileSync(source, path.join(output, renamed ? id + ".mp4" : pending));
    fs.writeFileSync(path.join(checkpoints, id + V.PUBLICATION), JSON.stringify({ version: V.CHECKPOINT_VERSION, pending, item: item(id), audio }));
  };
  manifest("before_rename", good);
  manifest("after_rename", good, true);
  manifest("audio_optional", silent, false, false);
  manifest("missing_required_audio", silent);
  manifest("truncated_output", corrupt);
  await recoverMotionRenderPublications();
  assert.deepEqual(
    listMotionResults()
      .map((value) => value.id)
      .sort(),
    ["after_rename", "audio_optional", "before_rename"],
  );
  for (const id of ["before_rename", "after_rename", "audio_optional"]) {
    assert.equal(JSON.parse(fs.readFileSync(path.join(checkpoints, id + ".json"), "utf8")).job.status, "completed");
    assert.equal(fs.existsSync(path.join(checkpoints, id + V.PUBLICATION)), false);
  }
  for (const id of ["missing_required_audio", "truncated_output"]) {
    assert.equal(fs.existsSync(path.join(checkpoints, id + V.PUBLICATION)), true);
    assert.equal(fs.existsSync(path.join(output, id + ".mp4")), false);
    fs.rmSync(path.join(checkpoints, id + V.PUBLICATION));
  }
  await recoverMotionRenderPublications();
  assert.equal(listMotionResults().length, 3);
  const pending = path.join(output, "normal" + V.PART);
  fs.copyFileSync(good, pending);
  publishMotionResult(pending, item("normal"), true);
  assert.equal(fs.existsSync(path.join(checkpoints, "normal" + V.PUBLICATION)), true);
  assert.equal(listMotionResults().filter((value) => value.id === "normal").length, 1);
  finishMotionPublication("normal");
} finally {
  if (prior.storage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior.storage;
  if (prior.app === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = prior.app;
  assert.ok(storage.startsWith(os.tmpdir()));
  fs.rmSync(storage, { recursive: true, force: true });
}
console.log("Media validation: actual MP4 with audio decodes; missing audio, wrong dimensions/duration and truncated video are rejected.");
console.log("Publication recovery: crashes before/after rename, optional/required audio, corrupt files and repeated recovery passed.");
