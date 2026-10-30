import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.js";
import { MOTION_AI_ROLE } from "../src/constants/motionAiFallback.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { MOTION_STORY_CONFIG } from "../src/constants/motionVideo.js";
import { MOTION_VISUAL } from "../src/constants/motionVisual.js";
import { puppetBeatLines } from "../src/lib/motionPuppet.js";
import { encodeGeminiChatModel } from "../src/constants/geminiChatModels.js";
import { AiPlanningChatModel as M, AiPlanningExecutionMode as E, AiPlanningFallbackProvider as P } from "../src/types.js";
const root = await fs.mkdtemp(path.join(os.tmpdir(), "motion-scene-fallback-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
const priorData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const ready = (request: any) => ({ text: JSON.stringify({ ready: true, requestId: request.requestId }), provider: request.provider });
const fixture = { sent: [] as any[], prepared: [] as any[], closed: [] as any[], closedProjects: [] as any[], reloaded: [] as any[], resumed: [] as any[], apiCalls: 0, prepare: async () => {}, reload: async () => {}, resume: async (request: any) => ready(request), send: async (request: any) => ready(request) };
(globalThis as any).__motionAiRecovery = fixture;
try {
  const bundled = await build({
    stdin: { contents: V.ENTRY + ' export {buildRemotionScenes} from "./src/features/motion/server/services/remotion/scenePipeline.ts";', loader: "ts", resolveDir: process.cwd() },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onResolve({ filter: V.CHAT_IMPORT }, () => ({ path: V.CHAT, namespace: V.NAMESPACE }));
          builder.onResolve({ filter: V.GEMINI_IMPORT }, () => ({ path: V.API, namespace: V.NAMESPACE }));
          builder.onLoad({ filter: V.ALL, namespace: V.NAMESPACE }, (args) => ({ loader: "js", contents: args.path === V.CHAT ? V.CHAT_STUB : V.API_STUB }));
        },
      },
    ],
  });
  const localBundle = path.resolve(`node_modules/.cache/motion-scene-fallback-${process.pid}.mjs`);
  await fs.mkdir(path.dirname(localBundle), { recursive: true });
  await fs.writeFile(localBundle, bundled.outputFiles[0].text);
  let service: any;
  try {
    service = await import(pathToFileURL(localBundle).href);
  } finally {
    await fs.rm(localBundle, { force: true });
  }
  const model = encodeGeminiChatModel(M.GeminiFlash, "medium");
  for (const allowFallback of [false, true]) {
    for (const singleResponse of [false, true]) {
      for (const failure of ["transport", "invalid"]) {
        fixture.sent = [];
        fixture.send = async (request) => {
          if (request.provider === P.GeminiChat) {
            if (failure === "transport") throw new Error("scene-fixture-provider-failed");
            return { text: JSON.stringify({ ready: false, requestId: request.requestId }), provider: request.provider };
          }
          return ready(request);
        };
        const exec = { provider: P.GeminiChat, model, mode: E.RoomOnly, role: MOTION_AI_ROLE.DRAW, allowFallback, singleResponse };
        const routes = service.motionAiRoutes(exec);
        assert.equal(routes.length === 1, !allowFallback);
        const contract = { attempts: 1, routeAttempts: 1, budget: routes.length, state: { rejected: 0, errors: [] }, assess: (value: any) => ({ value, errors: value?.ready ? [] : ["invalid scene fixture"] }), repair: () => V.PROMPT, failure: () => new Error("scene-fixture-invalid") };
        const call = service.runMotionAi(V.PROMPT, C.ARTIFACT, exec, undefined, undefined, undefined, 0, contract);
        if (allowFallback) {
          assert.equal((await call).ready, true);
          assert.deepEqual(
            fixture.sent.map((request) => request.provider),
            [P.GeminiChat, P.DeepSeekChat],
          );
        } else {
          await assert.rejects(call);
          assert.deepEqual(
            fixture.sent.map((request) => request.provider),
            [P.GeminiChat],
          );
        }
        assert.equal(fixture.sent[0].model, model);
        assert.equal(fixture.apiCalls, 0);
      }
    }
  }
  const main = { provider: P.ChatGptUi, model: M.ChatGptAuto, mode: E.RoomOnly, role: MOTION_AI_ROLE.MAIN };
  const drawing = { provider: P.GeminiChat, model, mode: E.RoomOnly, role: MOTION_AI_ROLE.DRAW, singleResponse: true, allowFallback: true };
  fixture.sent = [];
  fixture.send = async (request) => (request.provider === P.GeminiChat ? Promise.reject(new Error("drawing unavailable")) : ready(request));
  await service.runInMotionAiSession(
    "scene-content-isolation",
    async () => {
      await service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, main);
      await service.runMotionAi(V.PROMPT, C.ARTIFACT, drawing);
      fixture.send = async (request) => ready(request);
      await service.runMotionAi(V.PROMPT, C.ARTIFACT, { ...drawing, allowFallback: false });
      await service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, main);
    },
    undefined,
    true,
    undefined,
    { ...V.EDITORIAL, id: "scene-content-isolation" },
  );
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [P.ChatGptUi, P.GeminiChat, P.DeepSeekChat, P.GeminiChat, P.ChatGptUi],
  );
  const sceneIds = MOTION_STORY_CONFIG.SCENE_WORKER_IDS;
  for (const provider of [P.GeminiChat, P.ChatGptUi, P.DeepSeekChat, P.ClaudeChat]) {
    fixture.sent = [];
    fixture.prepared = [];
    let preparing = 0,
      preparationPeak = 0,
      activeScenes = 0,
      peakScenes = 0,
      activeTotal = 0,
      peakTotal = 0;
    fixture.prepare = async () => {
      preparationPeak = Math.max(preparationPeak, ++preparing);
      await new Promise<void>((resolve) => setImmediate(resolve));
      preparing--;
    };
    const chosenModel = provider === P.ClaudeChat ? M.ClaudeAuto : provider === P.DeepSeekChat ? M.DeepSeekStandard : provider === P.ChatGptUi ? M.ChatGptAuto : model;
    const selected = { provider, model: chosenModel, mode: E.RoomOnly, role: MOTION_AI_ROLE.DRAW, allowFallback: false, singleResponse: true };
    const session = { ...V.EDITORIAL, id: `three-scene-rooms-${provider}` };
    await service.runInMotionAiSession(
      session.id,
      async () => {
        await Promise.all([service.prepareMotionSceneRooms(selected), service.prepareMotionSceneRooms(selected)]);
        assert.equal(preparationPeak, 3);
        assert.equal(fixture.sent.length, 0, "Opening rooms must never send AI prompts");
        assert.deepEqual(fixture.prepared.map((request) => request.workerId).sort(), [...sceneIds].sort());
        let release!: () => void;
        const held = new Promise<void>((resolve) => (release = resolve));
        const timer = setTimeout(() => release(), 500);
        fixture.send = async (request) => {
          const drawing = request.artifactType === C.ARTIFACT;
          peakTotal = Math.max(peakTotal, ++activeTotal);
          if (drawing) peakScenes = Math.max(peakScenes, ++activeScenes);
          if (activeTotal === 4) release();
          await held;
          if (drawing) activeScenes--;
          activeTotal--;
          return ready(request);
        };
        try {
          await Promise.all([service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, { ...selected, role: MOTION_AI_ROLE.MAIN, singleResponse: false }), service.mapMotionAiPool([0, 1, 2, 3, 4, 5, 6], () => service.runMotionAi(V.PROMPT, C.ARTIFACT, selected), 3, MOTION_AI_ROLE.DRAW)]);
        } finally {
          clearTimeout(timer);
        }
        assert.equal(peakScenes, 3, provider);
        assert.equal(peakTotal, 4, "Content requests must not occupy any of the three drawing slots");
        assert.deepEqual([...new Set(fixture.sent.filter((request) => request.artifactType === C.ARTIFACT).map((request) => request.workerId))].sort(), [...sceneIds].sort());
        assert.ok(fixture.sent.filter((request) => request.artifactType !== C.ARTIFACT).every((request) => !sceneIds.includes(request.workerId)));
      },
      undefined,
      true,
      undefined,
      session,
    );
    await service.releaseMotionEditorialSession(session.id);
  }
  fixture.prepare = async () => {};
  fixture.sent = [];
  fixture.prepared = [];
  const settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
  const script: any = {
    title: "Three room scene integration",
    language: "vi",
    visualSettings: settings,
    beats: [{ id: "b1", chapterId: "c1", visual: "scene", place: "house", narration: "Người khách đứng cạnh cửa. Bên trong có ánh đèn. Ngoài sân trời mưa. Người khách quay về.", utterances: ["Người khách đứng cạnh cửa.", "Bên trong có ánh đèn.", "Ngoài sân trời mưa.", "Người khách quay về."].map((text, i) => ({ id: `u${i}`, text, speaker: "narrator", role: "narration" })) }],
  };
  const analysis: any = { title: script.title, visualSettings: settings, cast: [{ key: "guest", name: "Khách" }], places: [{ key: "house", name: "Nhà" }], chapters: [{ id: "c1", targetSeconds: 12 }] };
  const lines = puppetBeatLines(script.beats[0]);
  const art = { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#303741"/><g id="person"><rect x="384" y="144" width="128" height="360" fill="#605d76"/></g></svg>', layers: [{ id: "person", kind: "character", entityId: "guest" }], animations: [] };
  let drawingPeak = 0,
    drawingsActive = 0,
    drawings = 0;
  fixture.send = async (request) => {
    if (request.artifactType === MOTION_VISUAL.ARTIFACT_SCENE)
      return { text: JSON.stringify({ scenes: lines.map((line, i) => ({ fromLineId: line.key, toLineId: line.key, purpose: `shot${i}`, environment: "old house", nodes: [{ id: "person", kind: "character", entityId: "guest", description: "guest", pose: "standing", slot: "right", evidence: "Người khách đứng cạnh cửa." }] })) }), provider: request.provider };
    assert.equal(request.artifactType, C.ARTIFACT);
    assert.equal(new Set(fixture.prepared.filter((item) => sceneIds.includes(item.workerId)).map((item) => item.workerId)).size, 3);
    drawings++;
    drawingPeak = Math.max(drawingPeak, ++drawingsActive);
    if (drawings > 1) await new Promise((resolve) => setTimeout(resolve, 20));
    drawingsActive--;
    return { text: JSON.stringify(art), provider: request.provider };
  };
  const integrationSession = { ...V.EDITORIAL, id: "three-rooms-remotion-integration", worker: true };
  await service.runInMotionAiSession(
    integrationSession.id,
    async () => {
      const result = await service.buildRemotionScenes(script, analysis, { exec: { ...drawing, allowFallback: false }, mainExec: main, review: false, sfx: false, log: () => {}, geometry: { check: async () => [] }, scope: integrationSession.id });
      assert.equal(result.gen.remotion.scenes.b1.length, 4);
      assert.ok(result.gen.remotion.scenes.b1.every((scene: any) => scene.build.status === "accepted"));
    },
    undefined,
    true,
    undefined,
    integrationSession,
  );
  assert.equal(drawings, 4);
  assert.equal(drawingPeak, 3);
  await service.releaseMotionEditorialSession(integrationSession.id);
  fixture.sent = [];
  const cancelScenes = new AbortController();
  fixture.send = async (request) =>
    new Promise<any>((_resolve, reject) => {
      request.signal.addEventListener("abort", () => reject(request.signal.reason), { once: true });
      if (fixture.sent.length === 3) cancelScenes.abort(new Error("cancelled scene batch"));
    });
  await assert.rejects(
    service.runInMotionAiSession("cancel-three-scenes", () => Promise.all(Array.from({ length: 6 }, () => service.runMotionAi(V.PROMPT, C.ARTIFACT, { ...drawing, allowFallback: false }, cancelScenes.signal))), undefined, true, cancelScenes.signal),
    /cancelled scene batch/,
  );
  assert.equal(fixture.sent.length, 3, "Cancelling must not dispatch queued scenes");
  const cancelledPreparation = new AbortController();
  const warmSession = { ...V.EDITORIAL, id: "resume-cancelled-room-preparation", worker: true };
  fixture.prepared = [];
  fixture.prepare = async (request: any) =>
    new Promise<void>((_resolve, reject) => {
      request.signal.addEventListener("abort", () => reject(request.signal.reason), { once: true });
      if (fixture.prepared.length === 3) cancelledPreparation.abort(new Error("cancelled room preparation"));
    });
  await assert.rejects(
    service.runInMotionAiSession(warmSession.id, () => service.prepareMotionSceneRooms(drawing, cancelledPreparation.signal), undefined, true, cancelledPreparation.signal, warmSession),
    /cancelled room preparation/,
  );
  fixture.prepare = async () => {};
  await service.runInMotionAiSession(warmSession.id, () => service.prepareMotionSceneRooms(drawing), undefined, true, undefined, warmSession);
  assert.equal(fixture.prepared.length, 6, "A resumed stage must prepare rooms after a cancelled warmup");
  await service.releaseMotionEditorialSession(warmSession.id);
  console.log("PASS: scene fallback policies, three dedicated rooms, concurrent room opening without prompts, independent content slot, Gemini/ChatGPT/DeepSeek/Claude and actual Remotion pipeline; no live AI or video render.");
} finally {
  delete (globalThis as any).__motionAiRecovery;
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = priorData;
  assert.equal(path.dirname(root), os.tmpdir());
  await fs.rm(root, { recursive: true, force: true });
}
