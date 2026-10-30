import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.js";
import { MOTION_AI_ROLE } from "../src/constants/motionAiFallback.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
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
    stdin: { contents: V.ENTRY, loader: "ts", resolveDir: process.cwd() },
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
  console.log("PASS: scene fallback on/off with single response and reviewed flows, transport/invalid output, selected model retention, content route isolation; no live AI.");
} finally {
  delete (globalThis as any).__motionAiRecovery;
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = priorData;
  assert.equal(path.dirname(root), os.tmpdir());
  await fs.rm(root, { recursive: true, force: true });
}
