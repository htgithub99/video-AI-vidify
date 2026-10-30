import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { MotionLogStore } from "../src/features/motion/server/services/motionLogStore.js";
import { motionWavData, motionWavFileInfo } from "../src/features/motion/server/services/motionAudioUtils.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MOTION_VOICE as V, MOTION_VOICE_QUALITY as Q } from "../src/constants/motionVoice.js";
import { MotionJobStatus as S, MotionStoryJobKind as K } from "../src/types/motionVideo.js";
import { assertMotionProductionMode, assertMotionScriptComplete, motionDurationRepairChapters } from "../src/lib/motionProduction.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-persistence-integrity-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { motionWavHeader } = await import("../src/features/motion/server/services/motionSoundMixService.js");
const { getMotionAudioDirectory, getMotionRootDirectory } = await import("../src/features/motion/server/services/motionLibraryService.js");
const { motionVoiceTrackFilesValid } = await import("../src/features/motion/server/services/motionAudioService.js");
const { readMotionStoryCheckpoint } = await import("../src/features/motion/server/services/motionStoryCheckpointService.js");
const { startStoryJob, cancelStoryJob, getStoryJob } = await import("../src/features/motion/server/services/motionStoryJobService.js");
const rename = fs.renameSync,
  append = fs.appendFileSync;
try {
  const folder = path.join(root, "logs");
  const expected = Array.from({ length: 1003 }, (_, index) => "line-" + index);
  const logs = new MotionLogStore(folder);
  for (const line of expected) logs.append("run-a", line);
  const restored = new MotionLogStore(folder);
  restored.append("run-a", "after-restart");
  const collected: string[] = [];
  let cursor = 0;
  do {
    const page = restored.read("run-a", cursor);
    assert.ok(page.lines.length <= P.LOG_PAGE_SIZE);
    collected.push(...page.lines);
    cursor = page.next;
    if (cursor === page.total) break;
  } while (cursor < 2000);
  assert.deepEqual(collected, [...expected, "after-restart"]);
  assert.equal(restored.read("run-b").total, 0);
  fs.appendFileSync(path.join(folder, "run-a" + P.LOG_EXT), '{"sequence":9999,"line":"corrupt"}\n');
  assert.throws(() => restored.read("run-a"), { message: P.LOG_INVALID });
  const pcm = Buffer.alloc(V.SAMPLE_RATE * 2);
  const basic = Buffer.concat([motionWavHeader(pcm.length, 1, V.SAMPLE_RATE), pcm]);
  const junk = Buffer.from([74, 85, 78, 75, 1, 0, 0, 0, 123, 0]);
  const extended = Buffer.concat([basic.subarray(0, 36), junk, basic.subarray(36)]);
  extended.writeUInt32LE(extended.length - 8, 4);
  const info = motionWavData(extended);
  assert.equal(info.start, 54);
  assert.equal(info.duration, 1);
  const audioFolder = getMotionAudioDirectory();
  const clipId = "fixture.wav";
  fs.writeFileSync(path.join(audioFolder, clipId), extended);
  assert.equal(motionWavFileInfo(path.join(audioFolder, clipId)).start, info.start);
  for (const invalid of [extended.subarray(0, extended.length - 2), Buffer.from(basic), Buffer.concat([basic, junk.subarray(0, 9)])]) {
    if (invalid.length === basic.length) invalid.writeUInt32LE(pcm.length + 2, 40);
    else if (invalid.length > basic.length) invalid.writeUInt32LE(invalid.length - 8, 4);
    assert.throws(() => motionWavData(invalid), { message: Q.INVALID });
  }
  const trackId = "voice-vieneu-" + "a".repeat(32) + ".wav";
  fs.writeFileSync(path.join(audioFolder, trackId), Buffer.concat([motionWavHeader(pcm.length * 4, 2, V.SAMPLE_RATE), Buffer.alloc(pcm.length * 4)]));
  const script: any = {
    beats: [
      { id: "one", chapterId: "chapter", narration: "Bà ngồi bên cửa." },
      { id: "two", chapterId: "chapter", narration: "Nam đứng cạnh bàn." },
    ],
  };
  const track: any = { audioId: trackId, totalSeconds: 2, durations: [1, 1], clips: script.beats.map((beat: any, index: number) => ({ beatId: beat.id, text: beat.narration, audioId: clipId, start: index, end: index + 1 })) };
  assert.equal(motionVoiceTrackFilesValid(track, script), true);
  assert.equal(motionVoiceTrackFilesValid({ ...track, clips: [{ ...track.clips[0], text: "Bà ngồi" }, track.clips[1]] }, script), false);
  assert.equal(motionVoiceTrackFilesValid({ ...track, clips: [track.clips[1], track.clips[0]] }, script), false);
  assert.equal(motionVoiceTrackFilesValid({ ...track, clips: [track.clips[0], { ...track.clips[1], start: 0.5, end: 1.5 }] }, script), false);
  fs.truncateSync(path.join(audioFolder, clipId), 44);
  assert.equal(motionVoiceTrackFilesValid(track, script), false);
  const snapshot = path.join(getMotionRootDirectory(), P.SNAPSHOT_FOLDER, "broken" + P.EXT);
  fs.mkdirSync(path.dirname(snapshot), { recursive: true });
  fs.writeFileSync(snapshot, "{");
  assert.equal(readMotionStoryCheckpoint("broken")?.error, P.SNAPSHOT_INVALID);
  assert.equal(fs.readFileSync(snapshot, "utf8"), "{");
  assert.equal(readMotionStoryCheckpoint("missing"), null);
  const analysis: any = { cast: [], chapters: [{ id: "chapter", title: "Chapter" }] };
  assertMotionScriptComplete(script, analysis);
  assert.throws(() => assertMotionScriptComplete({ ...script, chapterDrafts: { chapter: { rows: [], pending: [], parts: { section: { pending: [{ id: "one" }] } } } } }, analysis));
  assert.throws(() => assertMotionProductionMode({ drawingMode: "3d" }), { message: P.MODE_UNSUPPORTED });
  const durationScript: any = { beats: [{ chapterId: "a" }, { chapterId: "b" }, { chapterId: "c" }] };
  assert.deepEqual(
    motionDurationRepairChapters(
      durationScript,
      {
        chapters: [
          { id: "a", targetSeconds: 100 },
          { id: "b", targetSeconds: 100 },
          { id: "c", targetSeconds: 100 },
        ],
      } as any,
      { totalSeconds: 400, durations: [200, 100, 100] } as any,
    ),
    ["a"],
  );
  let initialFailed = false;
  fs.renameSync = ((from, to) => {
    if (String(to).startsWith(path.dirname(snapshot))) {
      initialFailed = true;
      throw Object.assign(new Error("write denied"), { code: "EPERM" });
    }
    return rename(from, to);
  }) as typeof rename;
  assert.throws(
    () =>
      startStoryJob(true, K.VOICE, async () => {
        throw new Error("must not run");
      }),
    /write denied/,
  );
  assert.ok(initialFailed);
  fs.renameSync = rename;
  let savedId: string;
  const saveFailure = startStoryJob(true, K.VOICE, async (ctx) => {
    await delay(0);
    fs.renameSync = ((from, to) => {
      if (String(to).endsWith(savedId + P.EXT)) throw Object.assign(new Error("partial checkpoint denied"), { code: "EIO" });
      return rename(from, to);
    }) as typeof rename;
    ctx.partial({ accepted: true });
    return { unexpected: true };
  });
  savedId = saveFailure.id;
  await delay(20);
  assert.equal(getStoryJob(savedId)?.status, S.ERROR);
  assert.ok(getStoryJob(savedId)?.error?.includes(P.SAVE_FAILED));
  fs.renameSync = rename;
  let aborts = 0;
  const waits = [0, 1].map(() =>
    startStoryJob(
      true,
      K.VOICE,
      async (ctx) =>
        new Promise((_resolve, reject) =>
          ctx.signal.addEventListener(
            "abort",
            () => {
              aborts++;
              reject(new Error("cancelled"));
            },
            { once: true },
          ),
        ),
    ),
  );
  fs.appendFileSync = (() => {
    throw new Error("log denied");
  }) as typeof append;
  assert.throws(() => cancelStoryJob(), /log denied/);
  assert.equal(aborts, waits.length);
  fs.appendFileSync = append;
  await delay(20);
  for (const job of waits) assert.equal(getStoryJob(job.id)?.status, S.CANCELLED);
  process.stdout.write("Persistence integrity passed: 1004 log lines/restart/pages, corrupt snapshot, PCM chunks/truncation, cache text/timeline, pending script, duration scope, write failure and cancellation of all jobs. No AI or TTS executed.\n");
} finally {
  fs.renameSync = rename;
  fs.appendFileSync = append;
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(root, { recursive: true, force: true });
}
