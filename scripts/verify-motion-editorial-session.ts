import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { MotionJobStatus as S, MotionStoryJobKind as K, type MotionStorySource, type MotionAiExecution } from "../src/types/motionVideo.js";
import { MOTION_EDITORIAL } from "../src/constants/motionEditorial.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-editorial-session-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { editorialSession } = await import("../src/server/services/motionProductionActions.js");
  const { startStoryJob, getStoryJob, cancelStoryJob } = await import("../src/server/services/motionStoryJobService.js");
  const { releaseMotionEditorialSession } = await import("../src/server/services/motionStoryService.js");
  const source = { title: "A village story", text: "A family returns home.", segments: [{ t: 0, text: "A family returns home." }] } as MotionStorySource;
  const body = { editorialSessionId: "editorial-session-regression", language: "vi" };
  const exec: MotionAiExecution = { provider: "deepseek-chat", model: "deepseek-auto", mode: "room-only", chromeHeadless: false };
  const session = editorialSession(body, source, exec)!;
  for (const execution of [
    { ...exec, role: "main" as const },
    { ...exec, singleResponse: true, chained: true },
    { ...exec, strictProvider: true, chromeHeadless: true },
  ])
    assert.equal(editorialSession(body, source, execution)!.revision, session.revision);
  assert.notEqual(editorialSession({ ...body, language: "en" }, source, exec)!.revision, session.revision);
  assert.notEqual(editorialSession(body, { ...source, text: "A different story." }, exec)!.revision, session.revision);
  assert.notEqual(editorialSession(body, source, { ...exec, model: "another-model" })!.revision, session.revision);
  const until = async (predicate: () => boolean) => {
    for (let i = 0; i < 500; i++) {
      if (predicate()) return;
      await delay(2);
    }
    throw new Error("Editorial job did not settle");
  };
  let entered = false;
  const seo = startStoryJob(
    true,
    K.SEO,
    async (ctx) => {
      entered = true;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 1000);
        ctx.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(ctx.signal.reason);
          },
          { once: true },
        );
      });
      return { accepted: true };
    },
    session,
  );
  await until(() => entered);
  const sceneSession = editorialSession(body, source, { ...exec, role: "main" })!;
  const scene = startStoryJob(true, K.SCENES, async () => ({ accepted: true }), { ...sceneSession, worker: true });
  const voice = startStoryJob(true, K.VOICE, async () => ({ accepted: true }), sceneSession);
  await until(() => getStoryJob(scene.id)?.status === S.COMPLETED && getStoryJob(voice.id)?.status === S.COMPLETED);
  assert.equal(getStoryJob(seo.id)?.status, S.RENDERING);
  const changed = editorialSession(body, source, { ...exec, model: "another-model" })!;
  const next = startStoryJob(true, K.VOICE, async () => ({ accepted: true }), changed);
  await until(() => getStoryJob(seo.id)?.status === S.CANCELLED && getStoryJob(next.id)?.status === S.COMPLETED);
  assert.ok(getStoryJob(seo.id)?.log.some((line) => line.includes(MOTION_EDITORIAL.CONTEXT_REPLACED)));
  cancelStoryJob(undefined, session.id);
  await releaseMotionEditorialSession(session.id);
  process.stdout.write("Editorial session: stable execution identity, concurrent SEO/scenes/voice and real context replacement passed.\n");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  fs.rmSync(root, { recursive: true, force: true });
}
