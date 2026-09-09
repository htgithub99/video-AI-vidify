import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { FFMPEG_RENDER_CONSTANTS } from "../src/constants/config";
import { analyzeCinematicClipsWithLibraries, validateCinematicEditorialDecisions } from "../src/server/services/cinematicClipAnalyzerService";
import { getStaticResourcePath } from "../src/server/utils/paths";

const tempDirectory = path.join(os.tmpdir(), `vidify-library-edit-${randomUUID()}`);
fs.mkdirSync(tempDirectory, { recursive: true });
const videoPath = path.join(tempDirectory, "hard-cut-with-black-head.mp4");
const ambientVideoPath = path.join(tempDirectory, "continuous-ambient-audio.mp4");
const bundledFfmpeg = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);
const ffmpeg = fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : FFMPEG_RENDER_CONSTANTS.FFMPEG_FALLBACK_CMD;
const analyzerSource = fs.readFileSync("python_scripts/cinematic_edit_analyzer.py", "utf8");
assert.match(analyzerSource, /sys\.stdout\.buffer\.write\([\s\S]*\.encode\(INPUT_ENCODING\)\)/);

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
      { sceneId: "scene_ambience_repeat", path: ambientVideoPath, hasAudio: true, protectDialogue: false },
      { sceneId: "scene_dialogue_unknown", path: ambientVideoPath, hasAudio: true, protectDialogue: true, expectedDialogue: "Expected line", dialogueLanguage: "en" },
    ],
    ffmpeg,
    tempDirectory,
  );
  assert.equal(result.success, true);
  assert.equal(result.libraryAnalysisAvailable, true);
  assert.equal(result.decisions.length, 4);
  const damagedHeadDecision = result.decisions.find((decision) => decision.sceneId === "scene_test")!;
  const ambienceDecision = result.decisions.find((decision) => decision.sceneId === "scene_ambience")!;
  const repeatedDecision = result.decisions.find((decision) => decision.sceneId === "scene_ambience_repeat")!;
  const protectedDialogueDecision = result.decisions.find((decision) => decision.sceneId === "scene_dialogue_unknown")!;
  assert.ok(damagedHeadDecision.trimStartSeconds >= 0.7);
  assert.ok(damagedHeadDecision.segments.length >= 1);
  assert.ok(damagedHeadDecision.segments.every((segment) => segment.outSeconds > segment.inSeconds));
  assert.ok(damagedHeadDecision.warnings.includes("black_frames_detected"));
  assert.ok(ambienceDecision.segments.length >= 1);
  assert.ok(ambienceDecision.segments.every((segment) => segment.outSeconds - segment.inSeconds < 9));
  assert.ok(ambienceDecision.trimStartSeconds + ambienceDecision.trimEndSeconds > 0.5);
  assert.equal(repeatedDecision.takeDecision, "omit");
  assert.equal(repeatedDecision.segments.length, 0);
  assert.ok(repeatedDecision.warnings.includes("repeated_visual_content_omitted"));
  assert.notEqual(protectedDialogueDecision.takeDecision, "omit");
  assert.ok((protectedDialogueDecision.selectedDuration || 0) >= 9.5);
  assert.ok(protectedDialogueDecision.segments.every((segment) => segment.containsDialogue));
  const expectedEditorialDecisions = [damagedHeadDecision, ambienceDecision];
  const completeEditorialDecisions = expectedEditorialDecisions.map((decision) => ({
    sceneId: decision.sceneId,
    takeDecision: "trim",
    segments: decision.candidateSegments!.slice(0, 1).map((segment) => ({
      segmentId: segment.segmentId,
      inSeconds: segment.inSeconds,
      outSeconds: segment.outSeconds,
    })),
  }));
  assert.equal(validateCinematicEditorialDecisions(expectedEditorialDecisions, completeEditorialDecisions).valid, true);
  const dialogueOmitDecisions = [
    completeEditorialDecisions[1],
    { sceneId: protectedDialogueDecision.sceneId, takeDecision: "omit", segments: [] },
  ];
  assert.equal(validateCinematicEditorialDecisions([ambienceDecision, protectedDialogueDecision], dialogueOmitDecisions).valid, true);
  assert.equal(validateCinematicEditorialDecisions(expectedEditorialDecisions, completeEditorialDecisions.slice(0, 1)).valid, false);
  assert.equal(
    validateCinematicEditorialDecisions(expectedEditorialDecisions, [completeEditorialDecisions[0], completeEditorialDecisions[0]]).valid,
    false,
  );
  process.stdout.write(JSON.stringify({ passed: true, decisions: result.decisions }));
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
