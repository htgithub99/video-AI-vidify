import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { FFMPEG_RENDER_CONSTANTS } from "../src/constants/config";
import { analyzeCinematicClipsWithLibraries } from "../src/server/services/cinematicClipAnalyzerService";
import { getStaticResourcePath } from "../src/server/utils/paths";

const tempDirectory = path.join(os.tmpdir(), `vidify-library-edit-${randomUUID()}`);
fs.mkdirSync(tempDirectory, { recursive: true });
const videoPath = path.join(tempDirectory, "hard-cut-with-black-head.mp4");
const ambientVideoPath = path.join(tempDirectory, "continuous-ambient-audio.mp4");
const bundledFfmpeg = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);
const ffmpeg = fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD;

try {
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=320x180:r=24:d=0.8",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=s=320x180:r=24:d=4.2",
      "-filter_complex",
      "[0:v][1:v]concat=n=2:v=1:a=0[v]",
      "-map",
      "[v]",
      "-c:v",
      "mpeg4",
      videoPath,
    ],
    { stdio: "ignore" },
  );
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=s=320x180:r=24:d=10",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=330:duration=10",
      "-shortest",
      "-c:v",
      "mpeg4",
      "-c:a",
      "aac",
      ambientVideoPath,
    ],
    { stdio: "ignore" },
  );
  const result = await analyzeCinematicClipsWithLibraries(
    [
      { sceneId: "scene_test", path: videoPath, hasAudio: false, protectDialogue: false },
      { sceneId: "scene_ambience", path: ambientVideoPath, hasAudio: true, protectDialogue: false },
    ],
    ffmpeg,
    tempDirectory,
  );
  assert.equal(result.success, true);
  assert.equal(result.libraryAnalysisAvailable, true);
  assert.equal(result.decisions.length, 2);
  const damagedHeadDecision = result.decisions.find((decision) => decision.sceneId === "scene_test")!;
  const ambienceDecision = result.decisions.find((decision) => decision.sceneId === "scene_ambience")!;
  assert.ok(damagedHeadDecision.trimStartSeconds >= 0.7);
  assert.ok(damagedHeadDecision.segments.length >= 1);
  assert.ok(damagedHeadDecision.segments.every((segment) => segment.outSeconds > segment.inSeconds));
  assert.ok(damagedHeadDecision.warnings.includes("black_frames_detected"));
  assert.ok(ambienceDecision.segments.length >= 1);
  assert.ok(ambienceDecision.segments.every((segment) => segment.outSeconds - segment.inSeconds < 9));
  assert.ok(ambienceDecision.trimStartSeconds + ambienceDecision.trimEndSeconds > 0.5);
  process.stdout.write(JSON.stringify({ passed: true, decisions: result.decisions }));
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
