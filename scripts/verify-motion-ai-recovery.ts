import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.js";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.ts";
import { MOTION_AI_ROLE } from "../src/constants/motionAiFallback.ts";
import { encodeGeminiChatModel, GEMINI_MODEL_ENCODING, GEMINI_MODEL_UI } from "../src/constants/geminiChatModels.ts";
import { AiPlanningChatModel as M, AiPlanningExecutionMode as E, AiPlanningFallbackProvider as P } from "../src/types.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.ts";
const deferred = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const ready = (request: any) => ({ text: JSON.stringify({ ready: true, requestId: request.requestId }), provider: request.provider });
const fixture = { prepared: [] as any[], sent: [] as any[], closed: [] as any[], resumed: [] as any[], apiCalls: 0, prepare: async (_request: any) => undefined, send: async (request: any): Promise<any> => ready(request), resume: async (request: any): Promise<any> => ready(request) };
(globalThis as any).__motionAiRecovery = fixture;
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
const output = path.resolve(V.BUNDLE(process.pid));
try {
  const bundled = await build({
    stdin: { contents: V.ENTRY, loader: VT.TS, resolveDir: process.cwd() },
    bundle: true,
    platform: VT.NODE,
    format: VT.ESM,
    packages: VT.EXTERNAL,
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onResolve({ filter: V.CHAT_IMPORT }, () => ({ path: V.CHAT, namespace: V.NAMESPACE }));
          builder.onResolve({ filter: V.GEMINI_IMPORT }, () => ({ path: V.API, namespace: V.NAMESPACE }));
          builder.onLoad({ filter: V.ALL, namespace: V.NAMESPACE }, (args) => ({ loader: VT.JS, contents: args.path === V.CHAT ? V.CHAT_STUB : V.API_STUB }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  service.MOTION_STORY_CONFIG.PROVIDER_MIN_GAP_MS = 0;
  const model = encodeGeminiChatModel(M.GeminiFlash, VT.HIGH);
  const exec = { provider: P.GeminiChat, model, role: MOTION_AI_ROLE.DRAW, mode: E.RoomOnly, chromeHeadless: false };
  const reset = () => {
    fixture.prepared = [];
    fixture.sent = [];
    fixture.closed = [];
    fixture.resumed = [];
    fixture.prepare = async () => undefined;
    fixture.send = async (request) => ready(request);
    fixture.resume = async (request) => ready(request);
  };
  const call = (options = exec, signal?: AbortSignal, log?: any) => service.runMotionAi(V.PROMPT, V.ARTIFACT, options, signal, log, [V.IMAGE]);
  let failures = 0;
  fixture.prepare = async () => {
    if (failures++ < R.ROOM_RETRIES) throw new Error(V.TRANSPORT);
  };
  assert.equal((await call()).ready, true);
  assert.equal(fixture.prepared.length, R.ROOM_RETRIES + 1);
  assert.equal(fixture.sent.length, 1);
  assert.ok(fixture.prepared.every((request) => request.provider === P.GeminiChat && request.model === model && request.chromeHeadless === false));
  assert.deepEqual(fixture.sent[0].attachments, [V.IMAGE]);
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
  reset();
  failures = 0;
  fixture.prepare = async () => {
    if (failures++ < R.ROOM_RETRIES) throw new Error(GEMINI_MODEL_ENCODING.UI_NOT_READY(GEMINI_MODEL_UI.PHASE.READY));
  };
  assert.equal((await call()).ready, true);
  assert.equal(fixture.prepared.length, R.ROOM_RETRIES + 1);
  assert.equal(fixture.sent.length, 1);
  assert.ok(fixture.prepared.every((request) => request.provider === P.GeminiChat && request.model === model));
  assert.deepEqual(fixture.sent[0].attachments, [V.IMAGE]);
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(GEMINI_MODEL_ENCODING.UI_NOT_READY(GEMINI_MODEL_UI.PHASE.LEVEL_VERIFY));
    return ready(request);
  };
  assert.equal((await call()).ready, true);
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [...Array(R.ROOM_RETRIES + 1).fill(P.GeminiChat), P.ChatGptUi],
  );
  assert.ok(fixture.sent.filter((request) => request.provider === P.GeminiChat).every((request) => request.model === model));
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
  reset();
  await call();
  assert.equal(fixture.sent[0].provider, P.GeminiChat);
  reset();
  const parallelReady = deferred(),
    parallelRelease = deferred();
  const parallelWorkers = new Set<string>();
  let repairedWorker: string | undefined;
  fixture.send = async (request) => {
    if (!repairedWorker) {
      repairedWorker = request.workerId;
      throw new Error(GEMINI_MODEL_ENCODING.UI_NOT_READY(GEMINI_MODEL_UI.PHASE.LEVEL));
    }
    parallelWorkers.add(request.workerId);
    if (parallelWorkers.size === 3) parallelReady.finish();
    await parallelRelease.done;
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const work = service.mapMotionAiPool([0, 1, 2], () => call(), 3);
    await parallelReady.done;
    assert.equal(fixture.sent.length, 4);
    assert.ok(fixture.closed.every((request) => request.workerId === repairedWorker));
    assert.ok(fixture.sent.every((request) => request.provider === P.GeminiChat && request.model === model));
    assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
    parallelRelease.finish();
    assert.ok((await work).every((result: any) => result.ready));
  });
  reset();
  failures = 0;
  const originalTimeout = service.MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS;
  service.MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS = 10;
  fixture.prepare = async (request) => {
    if (failures++ === 0) await new Promise<void>((_resolve, reject) => request.signal.addEventListener(VT.ABORT, () => reject(new Error(C.CANCELLED_ERROR)), { once: true }));
  };
  try {
    assert.equal((await call()).ready, true);
    assert.equal(fixture.prepared.length, 2);
    assert.equal(fixture.sent.length, 1);
    assert.equal(fixture.sent[0].provider, P.GeminiChat);
  } finally {
    service.MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS = originalTimeout;
  }
  reset();
  failures = 0;
  fixture.send = async (request) => {
    if (failures++ < R.ROOM_RETRIES) throw new Error(V.CLOSED);
    return ready(request);
  };
  await call();
  assert.equal(new Set(fixture.sent.map((request) => request.requestId)).size, 1);
  assert.equal(new Set(fixture.sent.map((request) => request.prompt)).size, 1);
  assert.ok(fixture.sent.every((request) => request.provider === P.GeminiChat && request.model === model));
  assert.ok(fixture.sent.every((request) => JSON.stringify(request.attachments) === JSON.stringify([V.IMAGE])));
  reset();
  const events: any[] = [];
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(V.TRANSPORT);
    return ready(request);
  };
  await call(exec, undefined, (_line: string, activity: any) => {
    if (activity) events.push(activity);
  });
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [...Array(R.ROOM_RETRIES + 1).fill(P.GeminiChat), P.ChatGptUi],
  );
  assert.ok(events.some((event) => event.provider === P.ChatGptUi && event.phase === R.PHASE.FALLBACK));
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
  reset();
  await call();
  assert.equal(fixture.sent[0].provider, P.GeminiChat);
  reset();
  const drawing = deferred(),
    drawStarted = deferred(),
    mainStarted = deferred();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) {
      drawStarted.finish();
      await drawing.done;
    } else mainStarted.finish();
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const draw = call();
    await drawStarted.done;
    const main = call({ ...exec, provider: P.DeepSeekChat, model: M.DeepSeekStandard, role: MOTION_AI_ROLE.MAIN });
    await mainStarted.done;
    assert.equal(fixture.closed.length, 0);
    assert.notEqual(fixture.sent[0].workerId, fixture.sent[1].workerId);
    drawing.finish();
    await Promise.all([draw, main]);
  });
  reset();
  const sameWorker = deferred(),
    firstStarted = deferred();
  fixture.send = async (request) => {
    firstStarted.finish();
    await sameWorker.done;
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const first = call();
    await firstStarted.done;
    const second = call();
    await tick();
    assert.equal(fixture.sent.length, 1);
    assert.equal(fixture.closed.length, 0);
    sameWorker.finish();
    await Promise.all([first, second]);
    assert.equal(fixture.sent.length, 2);
    assert.equal(fixture.sent[0].workerId, fixture.sent[1].workerId);
  });
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    throw new Error(V.CLOSED);
  };
  assert.equal((await call()).ready, true);
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 1);
  assert.equal(fixture.resumed[0].requestId, fixture.sent[0].requestId);
  assert.equal(fixture.resumed[0].model, model);
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    throw new Error(V.CLOSED);
  };
  fixture.resume = async () => {
    throw new Error(V.UNKNOWN);
  };
  await assert.rejects(
    service.runInMotionAiSession(V.RUN, async () => {
      await call().catch(() => undefined);
      await call().catch(() => undefined);
    }),
    (error: any) => error[R.UNCERTAIN_FLAG] === true,
  );
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 1);
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    throw new Error(C.INVALID_RESPONSE_ERROR);
  };
  fixture.resume = async () => {
    throw new Error(C.INVALID_RESPONSE_ERROR);
  };
  await assert.rejects(call(), (error: any) => error[R.UNCERTAIN_FLAG] === true);
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 1);
  reset();
  const cancelled = new AbortController();
  fixture.send = async () => {
    cancelled.abort();
    throw new Error(V.CLOSED);
  };
  await assert.rejects(call(exec, cancelled.signal));
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 0);
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, model), 0);
  reset();
  const jobStarted = deferred(),
    finishJob = deferred();
  fixture.send = async (request) => {
    jobStarted.finish();
    await finishJob.done;
    return ready(request);
  };
  const job = service.startStoryJob(true, MotionStoryJobKind.SCENES, (ctx: any) => call(exec, ctx.signal, ctx.log));
  await jobStarted.done;
  assert.ok(Object.values(service.getStoryJob(job.id).activeAi).some((ai: any) => ai.provider === P.GeminiChat && ai.model === model));
  finishJob.finish();
  while (service.getStoryJob(job.id).status === MotionJobStatus.RENDERING) await tick();
  assert.equal(service.getStoryJob(job.id).status, MotionJobStatus.COMPLETED);
  assert.deepEqual(service.getStoryJob(job.id).activeAi, {});
  reset();
  fixture.send = async (request) => {
    if (request.model === model) throw new Error(GEMINI_MODEL_ENCODING.UNAVAILABLE(model));
    return ready(request);
  };
  await call();
  assert.ok(service.motionRoomBlockedMs(P.GeminiChat, model) > 0);
  const alternate = { ...exec, model: encodeGeminiChatModel(M.GeminiPro, VT.LOW) };
  assert.equal(service.motionRoomBlockedMs(P.GeminiChat, alternate.model), 0);
  reset();
  await call(alternate);
  assert.equal(fixture.sent[0].provider, P.GeminiChat);
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(V.RATE_LIMIT);
    return ready(request);
  };
  await call(alternate);
  assert.ok(service.motionRoomBlockedMs(P.GeminiChat, alternate.model) > 0);
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [P.GeminiChat, P.ChatGptUi],
  );
  assert.equal(fixture.apiCalls, 0);
  process.stdout.write(V.PASSED);
} finally {
  await rm(output, { force: true });
  delete (globalThis as any).__motionAiRecovery;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
