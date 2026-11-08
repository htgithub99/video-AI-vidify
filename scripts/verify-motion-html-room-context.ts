import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { build } from "esbuild";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MOTION_HTML } from "../src/constants/motionHtmlTemplate.js";
const storage = path.resolve(`scratch/motion-html-room-context-${process.pid}`);
const output = path.resolve(`node_modules/.cache/motion-html-room-context-${process.pid}.mjs`);
const previous = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = storage;
const context = new AsyncLocalStorage<string>();
try {
  const bundled = await build({
    entryPoints: ["src/features/motion/server/services/html/scenePipeline.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "room-context-runtime",
        setup(builder) {
          builder.onLoad({ filter: /html[\\/]sceneRuntime\.ts$/ }, () => ({ loader: "ts", contents: "export const openMotionHtmlRuntime = async () => ({render: async () => Buffer.from('preview'),close: async () => undefined});" }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const pipeline = await import(pathToFileURL(output).href);
  const settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "few" };
  const analysis = {
    title: "Letters",
    visualSettings: settings,
    chapters: [
      { id: "c1", targetSeconds: 1 },
      { id: "c2", targetSeconds: 1 },
    ],
    cast: [],
    places: [],
  };
  const beats = [
    { id: "b1", chapterId: "c1", narration: "A letter arrives.", visual: "scene", sceneTemplateDraft: "A messenger lifts a letter." },
    { id: "b2", chapterId: "c2", narration: "A letter leaves.", visual: "scene", sceneTemplateDraft: "A messenger carries a letter away." },
  ];
  const html = '<!DOCTYPE html><html><head></head><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:p=>{}};</script></body></html>';
  const owners: (string | undefined)[] = [];
  let firstStarted!: () => void, releaseFirst!: () => void;
  const started = new Promise<void>((resolve) => {
    firstStarted = resolve;
  });
  const hold = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const options = {
    exec: {},
    sfx: false,
    log: () => undefined,
    scope: `room-context-${process.pid}`,
    ai: async (prompt: string, artifact: string) => {
      if (artifact === MOTION_HTML.PLAN) {
        const source = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
        return { scenes: [{ fromLineId: source.lines[0].id, toLineId: source.lines.at(-1).id, purpose: "Letter", sceneTemplate: "A messenger carries a letter." }] };
      }
      owners.push(context.getStore());
      if (owners.length === 1) {
        firstStarted();
        await hold;
      }
      return html;
    },
  };
  const plan = (count: number) => pipeline.planMotionHtmlScenes({ title: analysis.title, language: "en", visualSettings: settings, beats: beats.slice(0, count) }, analysis, options);
  const initial = await plan(1);
  const next = await plan(2);
  const work = context.run("retained-scene-session", () => pipeline.buildMotionHtmlScenes(initial, analysis, options));
  await started;
  assert.equal(
    context.run("production-poller", () => pipeline.enqueueMotionHtmlScenes(options.scope, next)),
    true,
  );
  releaseFirst();
  const result = await work;
  assert.deepEqual(owners, ["retained-scene-session", "retained-scene-session"]);
  assert.equal(Object.values(result.gen.remotion.scenes).flat().length, 2);
  process.stdout.write("PASS: scenes enqueued by another async context retain the original AI session and room ownership.\n");
} finally {
  await rm(output, { force: true });
  await rm(storage, { recursive: true, force: true });
  if (previous === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previous;
}
