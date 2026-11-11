import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.js";
import { MOTION_HTML } from "../src/constants/motionHtmlTemplate.js";
import { MOTION_AI_ROLE } from "../src/constants/motionAiFallback.js";
import { AiPlanningChatModel as M, AiPlanningFallbackProvider as P, AiPlanningExecutionMode as E } from "../src/types.js";
import { motionAiFallbackPolicy } from "../src/lib/motionAiExecution.js";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(`scratch/motion-scene-fallback-controls-${process.pid}`);
delete process.env.APP_DATA_DIR;
const html = '<!DOCTYPE html><html><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:()=>{}};</script></body></html>';
const fixture = {
  sent: [] as any[],
  prepared: [] as any[],
  closed: [] as any[],
  closedProjects: [] as any[],
  reloaded: [] as any[],
  resumed: [] as any[],
  apiCalls: 0,
  prepare: async () => {},
  reload: async () => {},
  resume: async () => {
    throw new Error("Unexpected response recovery");
  },
  send: async (_request: any): Promise<any> => ({ text: html }),
};
(globalThis as any).__motionAiRecovery = fixture;
const file = path.resolve(`node_modules/.cache/motion-fallback-controls-${process.pid}.mjs`);
try {
  const bundled = await build({
    stdin: { contents: 'export {runMotionAi} from "./src/features/motion/server/services/motionStoryService.ts"; export {generateMotionHtmlScene,planMotionHtmlScenes} from "./src/features/motion/server/services/html/scenePipeline.ts";', resolveDir: process.cwd(), loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "isolated-scene-fallback-controls",
        setup(builder) {
          builder.onResolve({ filter: V.CHAT_IMPORT }, () => ({ path: V.CHAT, namespace: V.NAMESPACE }));
          builder.onResolve({ filter: V.GEMINI_IMPORT }, () => ({ path: V.API, namespace: V.NAMESPACE }));
          builder.onResolve({ filter: /sceneRuntime\.js$/ }, () => ({ path: "runtime", namespace: V.NAMESPACE }));
          builder.onLoad({ filter: V.ALL, namespace: V.NAMESPACE }, (args) => ({ loader: "js", contents: args.path === V.CHAT ? V.CHAT_STUB : args.path === V.API ? V.API_STUB : 'export const openMotionHtmlRuntime = async () => ({ render: async () => Buffer.from("fixture-frame"), close: async () => {} });' }));
        },
      },
    ],
  });
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bundled.outputFiles[0].text);
  const service = await import(pathToFileURL(file).href);
  for (const allowFallback of [false, true]) {
    fixture.sent = [];
    fixture.send = async (request) => {
      if (allowFallback && request.provider === P.GeminiChat) throw new Error("fixture-selected-provider-failed");
      return { text: html, provider: request.provider };
    };
    const exec = { provider: P.GeminiChat, model: M.GeminiFlash, mode: E.RoomOnly, allowFallback };
    const scene: any = { id: `policy-${allowFallback}`, sceneTemplate: "A marker crosses a page.", nodes: [] };
    await service.generateMotionHtmlScene(scene, { width: 320, height: 180, seconds: 1, profile: "history", scope: `policy-${allowFallback}` }, { exec, signal: AbortSignal.timeout(10000), log: () => {} });
    assert.deepEqual(
      fixture.sent.map((request) => request.provider),
      allowFallback ? [P.GeminiChat, P.DeepSeekChat] : [P.GeminiChat],
    );
    assert.ok(fixture.sent.every((request) => request.oneGeneration));
    assert.equal(scene.html.status, "ready");
    assert.equal(scene.html.execution.allowFallback, allowFallback);
    assert.equal(scene.html.execution.strictProvider, !allowFallback);
    assert.equal(scene.html.execution.singleResponse, true);
    const settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1 };
    const script: any = { title: "Policy", language: "en", visualSettings: settings, beats: [{ id: "b1", chapterId: "c1", narration: "A marker crosses a page.", visual: "scene", sceneTemplateDraft: "The marker crosses the page." }] };
    const analysis: any = { title: script.title, visualSettings: settings, cast: [], places: [], chapters: [{ id: "c1", targetSeconds: 1 }] };
    let plans = 0;
    await service.planMotionHtmlScenes(script, analysis, {
      exec: { ...exec, allowFallback: !allowFallback },
      mainExec: exec,
      scope: `plan-policy-${allowFallback}`,
      log: () => {},
      ai: async (prompt: string, artifact: string, execution: any) => {
        plans++;
        assert.equal(artifact, MOTION_HTML.PLAN);
        assert.equal(execution.allowFallback, allowFallback);
        assert.equal(execution.strictProvider, !allowFallback);
        const context = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
        return { scenes: [{ fromLineId: context.lines[0].id, toLineId: context.lines.at(-1).id, purpose: "Marker", sceneTemplate: script.beats[0].sceneTemplateDraft }] };
      },
    });
    assert.equal(plans, 1);
  }
  fixture.sent = [];
  fixture.send = async () => {
    throw new Error("fixture-selected-provider-failed");
  };
  await assert.rejects(service.runMotionAi("Scene", MOTION_HTML.ARTIFACT, { provider: P.GeminiChat, model: M.GeminiFlash, mode: E.RoomOnly, ...motionAiFallbackPolicy({ allowFallback: false }), singleResponse: true, role: MOTION_AI_ROLE.DRAW, outputFormat: "html" }, AbortSignal.timeout(10000)), /fixture-selected-provider-failed/);
  assert.deepEqual(
    fixture.sent.map((request) => request.provider),
    [P.GeminiChat],
  );
  assert.deepEqual(motionAiFallbackPolicy({ allowFallback: true, strictProvider: true }), { allowFallback: true, strictProvider: false });
  assert.deepEqual(motionAiFallbackPolicy({ strictProvider: true }), { allowFallback: false, strictProvider: true });
  assert.equal(fixture.apiCalls, 0);
  process.stdout.write("Scene fallback controls passed: HTML provider switching, selected-only failures, independent planning policy and persisted recovery settings.\n");
} finally {
  await fs.rm(file, { force: true });
  delete (globalThis as any).__motionAiRecovery;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
}
