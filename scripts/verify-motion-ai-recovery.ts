import { MotionProviderRecovery } from "../src/features/motion/server/services/motionProviderRecovery.js";
import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.js";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.ts";
import { MOTION_AI_ROLE, MOTION_AI_FALLBACK as FALLBACK } from "../src/constants/motionAiFallback.ts";
import { MOTION_PRODUCTION as PRODUCTION } from "../src/constants/motionProduction.js";
import { encodeGeminiChatModel, GEMINI_MODEL_ENCODING, GEMINI_MODEL_UI } from "../src/constants/geminiChatModels.ts";
import { AiPlanningChatModel as M, AiPlanningExecutionMode as E, AiPlanningFallbackProvider as P } from "../src/types.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.ts";
import { DEEPSEEK_CHAT_CONFIG as D } from "../src/constants/deepseekChat.ts";
import { PUPPET as PU, PUPPET_STYLE_PRESETS, PUPPET_TYPES } from "../src/constants/motionPuppet.ts";
import { exhaustedMotionRoom } from "../src/server/services/chatSubmissionRecovery.ts";
import { closeMotionJsonContainers } from "../src/lib/motionJsonRecovery.ts";
import { MOTION_VISUAL_CONTRACT as VISUAL } from "../src/constants/motionVisualContract.ts";
import { VISUAL_QA as READ, visualReadFixture } from "./motionVisualContractVerificationTexts.ts";
const coordination = new MotionProviderRecovery();
assert.ok(coordination.claim(V.RUN, V.RUN));
assert.ok(!coordination.claim(V.RUN, V.OTHER));
const waitingController = new AbortController();
const cancelledWait = coordination.wait(V.RUN, V.OTHER, waitingController.signal);
const cancelledAssertion = assert.rejects(cancelledWait);
waitingController.abort();
await cancelledAssertion;
assert.ok(coordination.waiting(V.RUN, V.OTHER));
const sharedSuccess = coordination.wait(V.RUN, V.OTHER);
coordination.finish(V.RUN, V.RUN);
await sharedSuccess;
assert.ok(!coordination.waiting(V.RUN, V.OTHER));
assert.ok(coordination.claim(V.RUN, V.OTHER));
coordination.finish(V.RUN, V.OTHER);
const deferred = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const within = async <T>(work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(V.DEADLOCK)), V.WAIT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
};
const ready = (request: any) => ({ text: JSON.stringify({ ready: true, requestId: request.requestId }), provider: request.provider });
const fixture = {
  prepared: [] as any[],
  sent: [] as any[],
  closed: [] as any[],
  closedProjects: [] as any[],
  reloaded: [] as any[],
  resumed: [] as any[],
  captchaPage: undefined as any,
  apiCalls: 0,
  reload: async (_request: any) => undefined,
  prepare: async (_request: any) => undefined,
  send: async (request: any): Promise<any> => ready(request),
  resume: async (request: any): Promise<any> => ready(request),
};
(globalThis as any).__motionAiRecovery = fixture;
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const realNow = Date.now;
let testClockOffset = 0;
Date.now = () => realNow() + testClockOffset;
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
  const model = encodeGeminiChatModel(M.GeminiFlash, VT.HIGH);
  const exec = { provider: P.GeminiChat, model, role: MOTION_AI_ROLE.DRAW, mode: E.RoomOnly, chromeHeadless: false };
  const reset = () => {
    testClockOffset += 24 * 60 * 60 * 1000;
    fixture.prepared = [];
    fixture.sent = [];
    fixture.closed = [];
    fixture.closedProjects = [];
    fixture.reloaded = [];
    fixture.resumed = [];
    fixture.prepare = async () => undefined;
    fixture.reload = async () => undefined;
    fixture.send = async (request) => ready(request);
    fixture.resume = async (request) => ready(request);
  };
  const call = (options = exec, signal?: AbortSignal, log?: any) => service.runMotionAi(V.PROMPT, V.ARTIFACT, options, signal, log, [V.IMAGE]);
  const storyExec = { ...exec, role: MOTION_AI_ROLE.MAIN, model: encodeGeminiChatModel(M.GeminiFlash, VT.LOW) };
  reset();
  fixture.send = async () => {
    throw new Error(C.CONTEXT_ACK_ERROR);
  };
  const staleState = {
    rejected: 6,
    errors: [V.UNKNOWN],
    routes: Object.fromEntries(
      service
        .motionAiRoutes(exec)
        .slice(0, 3)
        .map((route: any) => [JSON.stringify([route.mode, route.provider, route.model]), 2]),
    ),
  };
  await assert.rejects(service.runMotionAi(V.PROMPT, V.ARTIFACT, exec, undefined, undefined, [V.IMAGE], 0, { attempts: 1, budget: 10, routeAttempts: 2, state: staleState, assess: (value: any) => ({ value, errors: [] }), repair: () => V.PROMPT, failure: (errors: string[]) => new Error(errors.join(" | ")) }), { message: C.CONTEXT_ACK_ERROR });
  assert.ok(fixture.sent.length > 0);
  assert.ok(fixture.sent.every((request: any) => request.provider === P.GrokChat));
  reset();
  assert.deepEqual(
    service.motionAiRoutes({ ...exec, strictProvider: true }).map((route: any) => route.provider),
    [P.GeminiChat],
  );
  reset();
  const sharedFailureStarted = deferred();
  let providerFailureCalls = 0;
  const sharedLogs: string[] = [];
  fixture.send = async (request) => {
    if (request.provider !== P.GeminiChat) return ready(request);
    providerFailureCalls++;
    if (providerFailureCalls <= 3) {
      if (providerFailureCalls === 3) sharedFailureStarted.finish();
      await sharedFailureStarted.done;
    }
    throw new Error(C.PROVIDER_ERROR_RESPONSE_ERROR);
  };
  await within(service.runInMotionAiSession(V.RUN, () => service.mapMotionAiPool([0, 1, 2], () => call(exec, undefined, (line: string) => sharedLogs.push(line)), 3, MOTION_AI_ROLE.DRAW)));
  assert.equal(providerFailureCalls, 3 + R.ROOM_RETRIES);
  assert.equal(fixture.reloaded.length, R.ROOM_RELOADS);
  assert.equal(new Set(fixture.reloaded.map((request) => request.workerId)).size, 1);
  assert.equal(sharedLogs.filter((line) => line === R.PROVIDER_COOLDOWN(P.GeminiChat)).length, 1);
  assert.equal(fixture.sent.filter((request) => request.provider === P.DeepSeekChat).length, 3);
  reset();
  assert.deepEqual(
    service.motionAiRoutes(exec).map((route: any) => route.provider),
    [P.GeminiChat, P.DeepSeekChat, P.ChatGptUi, P.GrokChat],
  );
  assert.deepEqual(
    service.motionAiRoutes(storyExec).map((route: any) => route.provider),
    [P.GeminiChat, P.DeepSeekChat, P.ChatGptUi, P.GrokChat, P.ClaudeChat],
  );
  assert.deepEqual(
    service.motionAiRoutes({ ...exec, provider: P.ChatGptUi, model: M.ChatGptAuto }).map((route: any) => route.provider),
    [P.ChatGptUi, P.GeminiChat, P.DeepSeekChat, P.GrokChat],
  );
  for (const message of [
    V.NETWORK_SUSPENDED,
    V.DNS_UNAVAILABLE,
    C.UI_READ_TIMEOUT_ERROR,
    C.ATTACHMENT_SUBMIT_BLOCKED_ERROR,
    C.GEMINI_UPLOAD_FAILED_ERROR,
    C.GEMINI_UPLOAD_NOT_READY_ERROR,
    C.CHATGPT_UPLOAD_FAILED_ERROR,
    C.CHATGPT_UPLOAD_NOT_READY_ERROR,
    C.CHATGPT_UPLOAD_UNAVAILABLE_ERROR,
    C.CLAUDE_UPLOAD_FAILED_ERROR,
    C.CLAUDE_UPLOAD_NOT_READY_ERROR,
    D.UPLOAD_FAILED,
    D.UPLOAD_NOT_READY,
    C.ATTACHMENT_FALLBACK_ERROR_PREFIX,
  ]) {
    reset();
    const order: number[][] = [];
    fixture.send = async () => {
      order.push([fixture.reloaded.length, fixture.closed.length]);
      throw new Error(message);
    };
    await assert.rejects(call({ ...exec, strictProvider: true }), { message });
    assert.deepEqual(order, [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ]);
    assert.equal(fixture.prepared.length, R.ROOM_RETRIES + 1);
    assert.ok(fixture.sent.every((request) => request.model === model && JSON.stringify(request.attachments) === JSON.stringify([V.IMAGE])));
  }
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(C.GEMINI_UPLOAD_FAILED_ERROR);
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    await call();
    assert.deepEqual(
      fixture.sent.map((request) => request.provider),
      [...Array(R.ROOM_RETRIES + 1).fill(P.GeminiChat), P.DeepSeekChat],
    );
    assert.equal(fixture.reloaded.length, R.ROOM_RELOADS);
    fixture.sent = [];
    await call();
    assert.deepEqual(
      fixture.sent.map((request) => request.provider),
      [P.DeepSeekChat],
    );
    const now = Date.now;
    const expired = now() + R.PROVIDER_ERROR_COOLDOWN_MS + 1;
    try {
      Date.now = () => expired;
      fixture.send = async (request) => ready(request);
      fixture.sent = [];
      await call();
      assert.deepEqual(
        fixture.sent.map((request) => request.provider),
        [P.GeminiChat],
      );
    } finally {
      Date.now = now;
    }
  });
  reset();
  const editorialCall = () => service.runMotionAi(V.PROMPT, V.ARTIFACT, storyExec);
  const editorialStage = (id: string, fn: () => Promise<any> = editorialCall, session: { id: string; revision: string; context: string } = V.EDITORIAL) => within(service.runInMotionAiSession(id, fn, undefined, true, undefined, session));
  await editorialStage(V.RUN);
  let inFlight = 0,
    peak = 0;
  fixture.send = async (request) => {
    peak = Math.max(peak, ++inFlight);
    await tick();
    inFlight--;
    return ready(request);
  };
  await editorialStage(V.OTHER, () => Promise.all([editorialCall(), service.mapMotionAiPool([0, 1, 2], () => Promise.all([editorialCall(), editorialCall()]))]));
  await editorialStage(V.STORY_ARTIFACT);
  assert.equal(peak, 2);
  assert.equal(fixture.prepared.length, 2);
  assert.equal(fixture.closedProjects.length, 0);
  assert.equal(new Set(fixture.sent.map((request) => request.projectId)).size, 1);
  assert.equal(new Set(fixture.sent.map((request) => request.workerId)).size, 2);
  assert.ok(fixture.sent[0].prompt.includes(V.EDITORIAL.context));
  assert.ok(!fixture.sent[1].prompt.includes(V.EDITORIAL.context));
  const held = deferred(),
    entered = deferred();
  fixture.send = async (request) => {
    entered.finish();
    await held.done;
    return ready(request);
  };
  const firstStage = editorialStage(V.RUN);
  await within(entered.done);
  const sentBeforeQueued = fixture.sent.length;
  const queuedStage = editorialStage(V.OTHER);
  await tick();
  assert.equal(fixture.sent.length, sentBeforeQueued);
  held.finish();
  await Promise.all([firstStage, queuedStage]);
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  assert.ok(fixture.closedProjects.some((request) => request.projectId === fixture.sent[0].projectId));
  reset();
  fixture.send = async (request) => {
    if (fixture.sent.length <= R.ROOM_RETRIES) throw new Error(V.TRANSPORT);
    return ready(request);
  };
  await editorialStage(V.RUN);
  assert.equal(fixture.reloaded.length, R.ROOM_RELOADS);
  assert.equal(fixture.closed.length, 1);
  assert.ok(fixture.sent.at(-1).prompt.includes(V.EDITORIAL.context));
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  fixture.send = async (request) => {
    if (fixture.sent.length === 1) {
      request.submission.attempted = true;
      throw new Error(V.UNKNOWN);
    }
    return ready(request);
  };
  fixture.resume = async () => {
    throw new Error(V.UNKNOWN);
  };
  await editorialStage(V.RUN);
  assert.equal(fixture.sent.length, 2);
  assert.deepEqual(
    fixture.resumed.map((request) => request.reloadPendingResponse),
    [false, true, true],
  );
  assert.equal(fixture.closed.length, 1);
  assert.ok(fixture.sent[1].prompt.includes(V.EDITORIAL.context));
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(V.TRANSPORT);
    return ready(request);
  };
  await editorialStage(V.RUN);
  const sendsAfterFallback = fixture.sent.length;
  await editorialStage(V.OTHER);
  assert.equal(fixture.sent.length, sendsAfterFallback + 1);
  assert.equal(fixture.sent.at(-1).provider, P.DeepSeekChat);
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  await editorialStage(V.RUN);
  const oldProject = fixture.sent[0].projectId;
  await editorialStage(V.OTHER, editorialCall, { ...V.EDITORIAL, revision: V.OTHER });
  assert.equal(fixture.prepared.length, 2);
  assert.ok(fixture.closedProjects.some((request) => request.projectId === oldProject));
  const releaseRender = await within(service.acquireMotionRenderBrowser(undefined, undefined, V.EDITORIAL.id));
  releaseRender();
  await editorialStage(V.RUN);
  assert.equal(fixture.prepared.length, 3);
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  const otherOwner = { ...V.EDITORIAL, id: V.EDITORIAL.id + "-second" };
  await editorialStage(V.RUN);
  await editorialStage(V.OTHER, editorialCall, otherOwner);
  const secondOwnerProject = fixture.sent.at(-1).projectId;
  const sharedHandoff = await within(service.acquireMotionRenderBrowser(undefined, undefined, V.EDITORIAL.id));
  assert.equal(sharedHandoff.shared, true);
  sharedHandoff();
  assert.equal(
    fixture.closedProjects.some((request) => request.projectId === secondOwnerProject),
    false,
  );
  const preparedBeforeSecond = fixture.prepared.length;
  await editorialStage(V.OTHER, editorialCall, otherOwner);
  assert.equal(fixture.prepared.length, preparedBeforeSecond);
  await service.releaseMotionEditorialSession(otherOwner.id);
  reset();
  const localVoice = deferred();
  const localVoiceJob = service.startStoryJob(true, MotionStoryJobKind.VOICE, async () => {
    await localVoice.done;
    return { local: true };
  });
  const localRenderRelease = await within(service.acquireMotionRenderBrowser());
  assert.equal(service.getStoryJob(localVoiceJob.id).status, MotionJobStatus.RENDERING);
  localRenderRelease();
  localVoice.finish();
  await tick();
  assert.equal(service.getStoryJob(localVoiceJob.id).status, MotionJobStatus.COMPLETED);
  assert.equal(fixture.sent.length, 0);
  fixture.send = async (request) => ({ text: JSON.stringify({ ready: fixture.sent.length > R.ROOM_RETRIES, requestId: request.requestId }), provider: request.provider });
  const contract = { attempts: 2, assess: (raw: any) => ({ value: raw, errors: raw.ready ? [] : [V.UNKNOWN] }), repair: () => V.PROMPT, failure: () => new Error(V.UNKNOWN) };
  await assert.rejects(editorialStage(V.RUN, () => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, storyExec, undefined, undefined, undefined, 0, contract)));
  assert.equal(fixture.sent.length, contract.attempts);
  assert.equal(new Set(fixture.sent.map((request) => request.provider)).size, 1);
  assert.equal(fixture.closed.length, 0);
  assert.equal(fixture.reloaded.length, 0);
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    request.submission.completed = true;
    return fixture.sent.length === 1 ? { text: V.UNKNOWN, provider: request.provider } : ready(request);
  };
  await editorialStage(V.RUN, () => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, { ...storyExec, strictProvider: true }, undefined, undefined, undefined, 0, { attempts: 2, assess: (raw: any) => ({ value: raw, errors: raw?.ready ? [] : [V.UNKNOWN] }), repair: () => V.PROMPT, failure: () => new Error(V.UNKNOWN) }));
  assert.equal(fixture.sent.length, 2);
  assert.equal(fixture.reloaded.length, 0);
  assert.equal(fixture.closed.length, 0);
  assert.equal(new Set(fixture.sent.map((request) => request.projectId)).size, 1);
  await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  reset();
  const malformed = V.MALFORMED_ENVELOPE(V.STORY_ARTIFACT, V.RUN);
  const repaired = JSON.parse(closeMotionJsonContainers(malformed)!);
  assert.equal(repaired.units[0].from.line, 140);
  assert.deepEqual(repaired.units[0].read.visual.fixtures, []);
  for (const invalid of ['{"a":[1,}', '{"a":[1', '{"a":"unterminated', '{"a":[1}}', '{"a":[{"b":1},]}']) assert.equal(closeMotionJsonContainers(invalid), undefined);
  const quoted = '{"a":[{"b":"escaped \\" quote, ] and } stay literal"}]}';
  assert.equal(closeMotionJsonContainers(quoted), undefined);
  for (const identity of [true, false]) {
    reset();
    fixture.send = async (request) => {
      request.submission.attempted = true;
      request.submission.completed = true;
      throw Object.assign(new Error(C.INVALID_JSON_RESPONSE_ERROR), { diagnostics: { lastCandidate: V.MALFORMED_ENVELOPE(request.artifactType, identity ? request.requestId : V.OTHER) } });
    };
    const recoveredCall = () => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, { ...storyExec, strictProvider: true }, undefined, undefined, undefined, 0, { attempts: 2, assess: (raw: any) => ({ value: raw, errors: raw?.ready ? [] : [V.UNKNOWN] }), repair: () => V.PROMPT, failure: () => new Error(V.UNKNOWN) });
    if (identity) assert.equal((await editorialStage(V.RUN, recoveredCall)).ready, true);
    else await assert.rejects(editorialStage(V.RUN, recoveredCall), { message: V.UNKNOWN });
    assert.equal(fixture.sent.length, identity ? 1 : 2);
    assert.equal(fixture.reloaded.length, 0);
    assert.equal(fixture.closed.length, 0);
    await service.releaseMotionEditorialSession(V.EDITORIAL.id);
  }
  reset();
  reset();
  const captchaConfig = service.MOTION_CAPTCHA;
  const originalCaptchaPoll = captchaConfig.POLL_MS;
  captchaConfig.POLL_MS = 5;
  let challenged = true;
  let composerReady = false;
  let captchaSolved = false;
  const captchaEntered = deferred(),
    captchaBlank = deferred();
  const captchaPage = {
    isClosed: () => false,
    title: async () => V.CAPTCHA_READY,
    url: () => V.CAPTCHA_URL,
    bringToFront: async () => undefined,
    locator: (selector: string) =>
      selector === captchaConfig.BODY_SELECTOR
        ? { innerText: async () => (challenged ? V.CAPTCHA : V.CAPTCHA_READY) }
        : {
            filter: () => ({
              count: async () => {
                if (!composerReady) captchaBlank.finish();
                return composerReady ? 1 : 0;
              },
            }),
          },
  };
  let captchaViewUrl: string = V.CAPTCHA_ROOM_URL;
  const captchaVisits: string[] = [];
  fixture.captchaPage = {
    ...captchaPage,
    url: () => captchaViewUrl,
    goto: async (url: string) => {
      captchaVisits.push(url);
      captchaViewUrl = url;
    },
  };
  fixture.send = async (request) => {
    if (fixture.sent.length === 1) throw Object.assign(new Error(V.CAPTCHA), { roomPage: captchaPage });
    return ready(request);
  };
  const captchaRun = call({ ...exec, chromeHeadless: true }, undefined, (line: string) => {
    if (line === captchaConfig.LOG_WAIT(exec.provider)) captchaEntered.finish();
    if (line === captchaConfig.LOG_SOLVED(exec.provider)) captchaSolved = true;
  });
  try {
    await within(captchaEntered.done);
    assert.equal(captchaSolved, false);
    challenged = false;
    await within(captchaBlank.done);
    assert.equal(captchaSolved, false);
    assert.equal(fixture.sent.length, 1);
    assert.equal(fixture.prepared.length, 2);
    assert.deepEqual(captchaVisits, [V.CAPTCHA_URL]);
    await within(call({ ...exec, provider: P.DeepSeekChat, model: M.DeepSeekStandard, strictProvider: true }));
    assert.equal(captchaSolved, false);
    assert.equal(fixture.sent.at(-1).provider, P.DeepSeekChat);
    const independentPrepared = fixture.prepared.length;
    composerReady = true;
    await within(captchaRun);
    assert.equal(captchaSolved, true);
    assert.equal(fixture.sent.length, 3);
    assert.equal(fixture.prepared.length, independentPrepared + 1);
    assert.equal(fixture.prepared[1].chromeHeadless, false);
  } finally {
    captchaConfig.POLL_MS = originalCaptchaPoll;
  }
  reset();
  const preparationStarted = deferred(),
    preparationRelease = deferred();
  fixture.prepare = async () => {
    if (fixture.prepared.length === 3) preparationStarted.finish();
    await preparationRelease.done;
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const work = service.mapMotionAiPool([0, 1, 2], () => call(), 3, MOTION_AI_ROLE.DRAW);
    try {
      await within(preparationStarted.done);
      assert.equal(fixture.sent.length, 0);
    } finally {
      preparationRelease.finish();
      await work;
    }
  });
  reset();
  const busyRoom = deferred(),
    firstRoomStarted = deferred();
  fixture.send = async (request) => {
    if (fixture.sent.length === 1) {
      firstRoomStarted.finish();
      await busyRoom.done;
    }
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const first = service.mapMotionAiPool([0], () => call(), 1, MOTION_AI_ROLE.DRAW);
    await within(firstRoomStarted.done);
    try {
      await within(service.mapMotionAiPool([1, 2, 3, 4], () => call(), 2, MOTION_AI_ROLE.DRAW));
      assert.equal(fixture.sent.length, 5);
      assert.equal(fixture.closed.length, 0);
      assert.ok(fixture.sent.slice(1).every((request) => request.workerId !== fixture.sent[0].workerId));
      assert.equal(fixture.prepared.length, 3);
    } finally {
      busyRoom.finish();
      await first;
    }
  });
  reset();
  const recoveryOrder: number[][] = [];
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(C.PROVIDER_ERROR_RESPONSE_ERROR);
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    await call();
    assert.equal(fixture.sent.filter((request) => request.provider === P.GeminiChat).length, R.ROOM_RETRIES + 1);
    assert.ok(service.motionRoomBlockedMs(P.GeminiChat, model) > 0);
    fixture.sent = [];
    await call();
    assert.ok(fixture.sent.every((request) => request.provider === P.DeepSeekChat));
  });
  assert.ok(service.motionRoomBlockedMs(P.GeminiChat, model) > 0);
  fixture.sent = [];
  const cooldownStop = new AbortController();
  const waitingForProvider = call({ ...exec, strictProvider: true }, cooldownStop.signal);
  await tick();
  cooldownStop.abort();
  await assert.rejects(waitingForProvider);
  assert.equal(fixture.sent.length, 0);
  reset();
  fixture.send = async (request) => {
    recoveryOrder.push([fixture.reloaded.length, fixture.closed.length]);
    if (recoveryOrder.length <= R.ROOM_RETRIES) throw new Error(V.TRANSPORT);
    return ready(request);
  };
  await call();
  assert.deepEqual(recoveryOrder, [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ]);
  assert.equal(new Set([...fixture.sent, ...fixture.reloaded, ...fixture.closed].map((request) => request.workerId)).size, 1);
  reset();
  const providerRecovery: number[][] = [];
  fixture.send = async (request) => {
    providerRecovery.push([fixture.reloaded.length, fixture.closed.length]);
    if (providerRecovery.length <= R.ROOM_RETRIES) {
      request.submission.attempted = true;
      request.submission.completed = true;
      throw new Error(C.PROVIDER_ERROR_RESPONSE_ERROR);
    }
    return ready(request);
  };
  await call();
  assert.deepEqual(providerRecovery, [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ]);
  reset();
  const invalidRecovery: number[][] = [];
  fixture.send = async (request) => {
    invalidRecovery.push([fixture.reloaded.length, fixture.closed.length]);
    request.submission.attempted = true;
    request.submission.completed = true;
    return invalidRecovery.length <= R.ROOM_RETRIES ? { text: V.UNKNOWN, provider: request.provider } : ready(request);
  };
  await call();
  assert.deepEqual(invalidRecovery, [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ]);
  reset();
  const occupied = deferred(),
    occupiedStarted = deferred();
  fixture.send = async (request) => {
    if (fixture.sent.length === 3) occupiedStarted.finish();
    await occupied.done;
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const active = service.mapMotionAiPool([0, 1, 2], () => call(), 3, MOTION_AI_ROLE.DRAW);
    try {
      await within(occupiedStarted.done);
      const stop = new AbortController();
      const queued = call(exec, stop.signal);
      stop.abort();
      await assert.rejects(queued);
      assert.equal(fixture.sent.length, 3);
    } finally {
      occupied.finish();
      await active;
    }
    assert.equal((await within(call())).ready, true);
    assert.equal(fixture.prepared.length, 3);
  });
  reset();
  const refreshing = deferred(),
    refreshingStarted = deferred();
  await service.runInMotionAiSession(V.RUN, async () => {
    await call();
    fixture.send = async (request) => {
      refreshingStarted.finish();
      await refreshing.done;
      return ready(request);
    };
    const active = call();
    try {
      await within(refreshingStarted.done);
      await service.resetMotionAiRoom();
      assert.equal(fixture.reloaded.length, 0);
    } finally {
      refreshing.finish();
      await active;
    }
    await call();
    assert.equal(fixture.reloaded.length, 1);
    assert.equal(fixture.closed.length, 0);
  });
  reset();
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
    [...Array(R.ROOM_RETRIES + 1).fill(P.GeminiChat), P.DeepSeekChat],
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
    const work = service.mapMotionAiPool([0, 1, 2], () => call(), 3, MOTION_AI_ROLE.DRAW);
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
  const originalReadinessTimeout = service.MOTION_AI_RECOVERY.READINESS_TIMEOUT_MS;
  service.MOTION_AI_RECOVERY.READINESS_TIMEOUT_MS = 10;
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
    service.MOTION_AI_RECOVERY.READINESS_TIMEOUT_MS = originalReadinessTimeout;
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
    [...Array(R.ROOM_RETRIES + 1).fill(P.GeminiChat), P.DeepSeekChat],
  );
  assert.ok(events.some((event) => event.provider === P.DeepSeekChat && event.phase === R.PHASE.FALLBACK));
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
    assert.equal(fixture.sent.length, 2);
    assert.equal(fixture.closed.length, 0);
    sameWorker.finish();
    await Promise.all([first, second]);
    assert.equal(fixture.sent.length, 2);
    assert.notEqual(fixture.sent[0].workerId, fixture.sent[1].workerId);
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
  fixture.send = async (request) => {
    if (request.provider !== P.GeminiChat) return ready(request);
    request.submission.attempted = true;
    throw new Error(V.CLOSED);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    assert.equal((await call()).ready, true);
    assert.equal((await call()).ready, true);
  });
  assert.equal(fixture.sent.filter((request) => request.provider === P.GeminiChat).length, 4);
  assert.equal(fixture.resumed.length, 4 * (R.ROOM_RELOADS + 1));
  assert.deepEqual(
    fixture.resumed.slice(0, 3).map((request) => request.reloadPendingResponse),
    [false, true, true],
  );
  assert.equal(fixture.sent.filter((request) => request.provider === P.DeepSeekChat).length, 2);
  assert.ok(fixture.sent.filter((request) => request.provider === P.GeminiChat).every((request) => request.model === model && JSON.stringify(request.attachments) === JSON.stringify([V.IMAGE])));
  reset();
  fixture.send = async (request) => {
    if (fixture.sent.length === 1) {
      request.submission.attempted = true;
      throw new Error(V.CLOSED);
    }
    return ready(request);
  };
  fixture.resume = async (request) => {
    if (!request.reloadPendingResponse) throw new Error(V.UNKNOWN);
    return ready(request);
  };
  assert.equal((await call()).ready, true);
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 2);
  assert.equal(fixture.closed.length, 1);
  reset();
  fixture.send = async (request) => {
    if (fixture.sent.length === 1) {
      request.submission.attempted = true;
      throw new Error(V.CLOSED);
    }
    return ready(request);
  };
  fixture.resume = async () => {
    throw new Error(V.UNKNOWN);
  };
  assert.equal((await call()).ready, true);
  assert.equal(fixture.sent.length, 2);
  assert.equal(fixture.sent[0].provider, P.GeminiChat);
  assert.equal(fixture.sent[1].provider, P.GeminiChat);
  assert.equal(fixture.sent[0].requestId, fixture.sent[1].requestId);
  assert.equal(fixture.closed.length, 2);
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    throw new Error(V.CLOSED);
  };
  fixture.resume = async () => {
    throw new Error(V.UNKNOWN);
  };
  const strict = { ...exec, strictProvider: true };
  const delayedRoom = deferred(),
    delayedRoomStarted = deferred();
  let stuckWorker: string | undefined;
  fixture.send = async (request) => {
    stuckWorker ||= request.workerId;
    if (request.workerId === stuckWorker) {
      request.submission.attempted = true;
      delayedRoomStarted.finish();
      await delayedRoom.done;
      throw new Error(V.CLOSED);
    }
    return ready(request);
  };
  await service.runInMotionAiSession(V.RUN, async () => {
    const broken = call(strict).catch((error: any) => error);
    await within(delayedRoomStarted.done);
    assert.equal((await within(call())).ready, true);
    delayedRoom.finish();
    assert.equal((await broken)[R.EXHAUSTED_FLAG], true);
    fixture.send = async (request) => ready(request);
    assert.equal((await call()).ready, true);
  });
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
      await service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, exec).catch(() => undefined);
      await call().catch(() => undefined);
    }),
    (error: any) => error[R.UNCERTAIN_FLAG] === true,
  );
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.resumed.length, 1);
  reset();
  fixture.send = async (request) => {
    request.submission.attempted = true;
    request.submission.completed = true;
    throw new Error(C.INVALID_RESPONSE_ERROR);
  };
  fixture.resume = async () => {
    throw new Error(C.INVALID_RESPONSE_ERROR);
  };
  await assert.rejects(call(strict), { message: C.INVALID_RESPONSE_ERROR });
  assert.equal(fixture.sent.length, R.ROOM_RETRIES + 1);
  assert.equal(fixture.resumed.length, 0);
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(C.REFUSAL_RESPONSE_ERROR);
    return ready(request);
  };
  assert.equal((await call()).ready, true);
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [P.GeminiChat, P.DeepSeekChat],
  );
  assert.ok(fixture.sent.every((request) => request.prompt.includes(R.VECTOR_INSTRUCTION)));
  assert.equal(C.REFUSAL_RESPONSE_PATTERN.test(V.REFUSAL), true);
  const readLines = READ.BEATS.map((key) => ({ key, text: READ.TEXT, place: READ.ROOM }));
  const readAnalysis = { title: READ.ROOM, logline: READ.TEXT, cast: READ.CAST };
  const readPlaces = { [READ.ROOM]: { key: READ.ROOM, desc: READ.ROOM } };
  const readRow = (i: number): any => ({ i, visual: visualReadFixture(READ.SCENE, READ.EVIDENCE), who: [READ.A], focus: READ.A, place: READ.ROOM, states: [{ char: READ.A, posture: PU.POSE_DEFAULT, action: PU.ACTION_DEFAULT }] });
  const readCall = (accepted?: any) => within(service.runInMotionAiSession(V.RUN, () => service.readPuppetLines(readLines, readLines, readAnalysis, readPlaces, {}, { exec, log() {} }, accepted), undefined, true));
  reset();
  fixture.send = async (request) => ({ text: JSON.stringify({ lines: fixture.sent.length === 1 ? [readRow(0), { ...readRow(1), states: [] }] : fixture.sent.length < VISUAL.READ_ATTEMPTS ? [{ ...readRow(1), states: [] }] : [{ i: 1, states: readRow(1).states }], requestId: request.requestId }), provider: request.provider });
  let readCheckpoint: any;
  const readRecovered = await readCall((value: any) => {
    readCheckpoint ||= structuredClone(value);
  });
  assert.equal(Object.keys(readCheckpoint.reads).length, 1);
  assert.equal(Object.keys(readRecovered.reads).length, 2);
  assert.equal(fixture.sent.length, VISUAL.READ_ATTEMPTS);
  assert.equal(fixture.prepared.length, 1);
  assert.equal(fixture.closed.length, 1);
  assert.equal(fixture.reloaded.length, 0);
  assert.ok(fixture.sent.at(-1).prompt.includes(VISUAL.READ_ACCEPTED));
  reset();
  fixture.send = async (request) => ({ text: JSON.stringify({ lines: request.provider === P.GeminiChat ? [readRow(0), { ...readRow(1), visual: null }] : [readRow(1)], requestId: request.requestId }), provider: request.provider });
  await assert.rejects(readCall());
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    Array(VISUAL.READ_ATTEMPTS).fill(P.GeminiChat),
  );
  assert.ok(fixture.sent.at(-1).prompt.includes(VISUAL.READ_PENDING));
  reset();
  fixture.send = async (request) => {
    if (request.provider === P.GeminiChat) throw new Error(C.REFUSAL_RESPONSE_ERROR);
    return { text: JSON.stringify({ lines: [readRow(0), readRow(1)], requestId: request.requestId }), provider: request.provider };
  };
  assert.equal(Object.keys((await readCall()).reads).length, 2);
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [P.GeminiChat, P.DeepSeekChat],
  );
  reset();
  fixture.send = async () => {
    throw new Error(C.REFUSAL_RESPONSE_ERROR);
  };
  await assert.rejects(service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, storyExec), { message: C.REFUSAL_RESPONSE_ERROR });
  assert.equal(fixture.sent.length, 1);
  reset();
  for (const [styleId, preset] of Object.entries(PUPPET_STYLE_PRESETS)) {
    const style = { ...preset, id: styleId, refs: [], refKinds: {} };
    const counts = new Map<string, number>();
    fixture.send = async (request) => {
      if (request.provider === P.GeminiChat && request.artifactType === PU.ARTIFACT_CHARACTER) {
        request.submission.attempted = true;
        throw new Error(V.CLOSED);
      }
      const count = (counts.get(request.artifactType) || 0) + 1;
      counts.set(request.artifactType, count);
      const drawing = request.artifactType === PU.ARTIFACT_CHARACTER ? { head: { front: count === 1 ? V.MALFORMED_SVG : V.SVG }, body: { front: V.SVG } } : request.artifactType === PU.ARTIFACT_SET ? { svg: V.SVG, spots: [] } : request.artifactType === PU.ARTIFACT_PROPS ? { props: [{ key: V.PROP, svg: V.SVG }] } : { checks: [{ i: 0, ok: true, match: true, styleScore: 10 }] };
      return { text: JSON.stringify({ artifactType: request.artifactType, requestId: request.requestId, ...drawing }), provider: request.provider };
    };
    fixture.resume = async () => {
      throw new Error(V.UNKNOWN);
    };
    const options = { exec, log() {} };
    const characters = await service.drawPuppetCharacters(style, [V.CAST], V.STORY, V.CAST.name, options);
    assert.ok(characters[V.CAST.key].head.front.includes(PU.SVG_OPEN));
    assert.equal(characters[V.CAST.key].styleId, styleId);
    assert.deepEqual(service.readPuppet(PUPPET_TYPES.CHARACTER, characters[V.CAST.key].id), characters[V.CAST.key]);
    const sets = await service.drawPuppetSets(style, [{ key: V.PLACE.key, place: V.PLACE, uses: V.STORY }], options);
    assert.ok(sets[V.PLACE.key].svg.includes(PU.SVG_OPEN));
    assert.equal(sets[V.PLACE.key].styleId, styleId);
    const props = await service.drawPuppetProps(style, [V.PROP], {}, V.STORY, options);
    assert.ok(props[V.PROP].svg.includes(PU.SVG_OPEN));
    assert.equal(props[V.PROP].styleId, styleId);
    assert.equal(counts.get(PU.ARTIFACT_CHARACTER), 2);
    assert.ok(fixture.sent.some((request) => request.artifactType === PU.ARTIFACT_CHAR_CHECK && request.attachments?.length));
    assert.ok(fixture.sent.some((request) => request.artifactType === PU.ARTIFACT_SET_CHECK && request.attachments?.length));
    reset();
  }
  const terminal = exhaustedMotionRoom(P.GeminiChat);
  let failedCalls = 0;
  const exhaustedOptions = {
    exec,
    log() {},
    ai: async () => {
      failedCalls++;
      throw terminal;
    },
  };
  const firstStyle = { ...Object.values(PUPPET_STYLE_PRESETS)[0], id: V.RUN, refs: [] };
  await assert.rejects(service.drawPuppetCharacters(firstStyle, [V.CAST], V.STORY, V.CAST.name, exhaustedOptions), (error) => error === terminal);
  assert.equal(failedCalls, 1);
  failedCalls = 0;
  await assert.rejects(service.readPuppetLines([{ key: V.RUN, text: V.STORY }], [{ key: V.RUN, text: V.STORY }], { cast: [], title: V.STORY, logline: V.STORY }, {}, {}, exhaustedOptions), (error) => error === terminal);
  assert.equal(failedCalls, 1);
  failedCalls = 0;
  const invalidOptions = {
    exec,
    log() {},
    ai: async () => {
      failedCalls++;
      return { head: { front: V.MALFORMED_SVG }, body: { front: V.SVG } };
    },
  };
  await assert.rejects(service.drawPuppetCharacters(firstStyle, [V.CAST], V.STORY, V.CAST.name, invalidOptions), { message: PU.ERR_DRAW_ASSETS([`${V.CAST.key}${PU.SEP}${PU.ERR_SVG}${PU.DASH}${PU.WHY_NO_SVG}`]) });
  assert.equal(failedCalls, PU.DRAW_TRIES);
  let drafts = 0,
    reviews = 0;
  const rejectedOptions = {
    exec,
    log() {},
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === PU.ARTIFACT_CHARACTER) {
        drafts++;
        return { head: { front: V.SVG }, body: { front: V.SVG } };
      }
      reviews++;
      return { checks: [{ i: 0, ok: false, problems: V.REVIEW_FAILURE }] };
    },
  };
  await assert.rejects(service.drawPuppetCharacters(firstStyle, [V.CAST], V.STORY, V.CAST.name, rejectedOptions), { message: PU.ERR_DRAW_ASSETS([`${V.CAST.key}${PU.SEP}${V.REVIEW_FAILURE}`]) });
  assert.equal(drafts, PU.DRAW_TRIES);
  assert.equal(reviews, PU.DRAW_TRIES);
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
    [P.GeminiChat, P.DeepSeekChat],
  );
  assert.equal(fixture.apiCalls, 0);
  process.stdout.write(V.PASSED);
} finally {
  Date.now = realNow;
  await rm(output, { force: true });
  delete (globalThis as any).__motionAiRecovery;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
