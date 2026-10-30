import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { PRODUCTION_QA as T } from "./motionProductionVerificationTexts.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MotionJobStatus as S, MotionStoryJobKind as K } from "../src/types/motionVideo.js";
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR ||= path.resolve(T.ROOT + randomUUID());
const { startStoryJob, cancelStoryJob } = await import("../src/features/motion/server/services/motionStoryJobService.js");
const { saveMotionStoryCheckpoint, readMotionStoryCheckpoint } = await import("../src/features/motion/server/services/motionStoryCheckpointService.js");
const child = process.argv.find((arg) => arg.startsWith(T.CHILD))?.slice(T.CHILD.length);
const script: any = { title: T.TITLE, language: "vi", beats: [T.BEAT] };
if (child === T.READ) {
  process.stdout.write(JSON.stringify(readMotionStoryCheckpoint(process.env[T.ID_ENV]!)));
} else if (child === T.WRITE || child === T.CANCEL) {
  let context: any;
  const job = startStoryJob(false, K.SCRIPT, async (ctx) => {
    context = ctx;
    ctx.log(T.LOG);
    ctx.progress(0.4);
    ctx.partial(script);
    return new Promise(() => {});
  });
  while (!context) await new Promise((resolve) => setImmediate(resolve));
  if (child === T.CANCEL) cancelStoryJob(job.id);
  process.stdout.write(JSON.stringify({ id: job.id, ready: T.MESSAGE }) + "\n");
  setInterval(() => {}, 1000);
} else {
  const { assertMotionScriptComplete, missingMotionChapters } = await import("../src/lib/motionProduction.js");
  const { motionSourceChunks } = await import("../src/lib/motionSourceChunks.js");
  const { motionEditorialContext } = await import("../src/features/motion/server/services/motionEditorialContextService.js");
  const analysis: any = { chapters: T.CHAPTERS, places: [], cast: [] };
  const root = path.resolve(process.env.VIDIFY_STORAGE_DIR);
  const file = path.resolve("scripts/verify-motion-production.ts");
  const readInNewProcess = (id: string) => {
    const result = spawnSync(process.execPath, ["--import", "tsx", file, T.CHILD + T.READ], { env: { ...process.env, [T.ID_ENV]: id }, encoding: P.ENCODING, timeout: 30000, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  try {
    const sourceText = T.SOURCE_TEXT.repeat(1500);
    const source: any = { title: T.TITLE, kind: "transcript", text: sourceText, segments: [{ t: 0, text: sourceText }] };
    const chunks = motionSourceChunks(source);
    assert.ok(chunks.length > 1);
    assert.equal(
      chunks
        .flat()
        .map((row) => row.text)
        .join(""),
      sourceText,
    );
    assert.ok(chunks.every((chunk) => chunk.reduce((size, row) => size + row.text.length, 0) <= P.LEDGER_CHUNK_CHARS));
    const context = JSON.parse(motionEditorialContext(source, analysis, { ...script, beats: Array.from({ length: 30 }, () => T.BEAT) }));
    assert.equal(context.source.text, undefined);
    assert.equal(context.continuity.length, 4);
    assert.deepEqual(
      missingMotionChapters(script, analysis).map((item) => item.id),
      [T.CHAPTERS[1].id],
    );
    assert.throws(() => assertMotionScriptComplete(script, analysis), { message: P.MISSING_CHAPTERS(T.CHAPTERS[1].title) });
    assert.throws(() => assertMotionScriptComplete({ ...script, beats: [...script.beats, { ...T.BEAT, chapterId: T.CHAPTERS[1].id }] }, analysis), /Kịch bản còn dữ liệu chưa đạt/);
    assert.doesNotThrow(() => assertMotionScriptComplete({ ...script, beats: [...script.beats, { ...T.BEAT, id: T.BEAT.id + "-second", chapterId: T.CHAPTERS[1].id }] }, analysis));
    const controller = await import("../src/features/motion/server/controllers/motionVideoController.js");
    for (const action of [controller.seoMotionStory, controller.scenesMotionStory, controller.voiceMotionStory, controller.compileMotionStory]) {
      let status = 200;
      let result: any;
      const response: any = {
        status: (value: number) => {
          status = value;
          return response;
        },
        json: (value: unknown) => {
          result = value;
        },
      };
      await action({ body: { script, analysis } } as any, response);
      assert.equal(status, 400);
      assert.equal(result.success, false);
      assert.ok(JSON.stringify(result).includes(T.CHAPTERS[1].title));
    }
    for (const mode of [T.WRITE, T.CANCEL]) {
      const processChild = spawn(process.execPath, ["--import", "tsx", file, T.CHILD + mode], { env: process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      const ready = await new Promise<{ id: string }>((resolve, reject) => {
        const timer = setTimeout(() => {
          processChild.kill();
          reject(new Error(T.MESSAGE));
        }, 30000);
        processChild.on("error", reject);
        processChild.stdout.on("data", (data) => {
          output += data.toString();
          const line = output.split("\n").find((value) => value.includes(T.MESSAGE));
          if (line) {
            clearTimeout(timer);
            resolve(JSON.parse(line));
          }
        });
      });
      const exited = once(processChild, "exit");
      processChild.kill();
      await exited;
      const restored = readInNewProcess(ready.id);
      assert.equal(restored.status, mode === T.CANCEL ? S.CANCELLED : S.ERROR);
      assert.equal(restored.interrupted, mode === T.CANCEL ? undefined : true);
      assert.deepEqual(restored.result, script);
      assert.equal(restored.progress, 0.4);
      assert.ok(restored.log.some((line: string) => line.includes(T.LOG)));
      assert.deepEqual(readInNewProcess(ready.id), restored);
    }
    for (const status of [S.COMPLETED, S.CANCELLED, S.ERROR]) {
      const job = { id: randomUUID(), kind: K.SCRIPT, status, progress: 1, result: script, log: [T.LOG], startedAt: Date.now() };
      saveMotionStoryCheckpoint(job);
      assert.deepEqual(readInNewProcess(job.id), job);
    }
    assert.equal(readMotionStoryCheckpoint("../invalid"), null);
    process.stdout.write(T.PASSED);
  } finally {
    assert.ok(root.startsWith(path.resolve(T.ROOT)));
    fs.rmSync(root, { force: true, recursive: true });
  }
}
