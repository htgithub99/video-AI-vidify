import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";

const root = path.resolve(`scratch/motion-html-stages-${Date.now()}`);
process.env.VIDIFY_STORAGE_DIR = path.join(root, "storage"); delete process.env.APP_DATA_DIR;
await fs.mkdir(root, { recursive: true });
const { MOTION_HTML } = await import("../src/constants/motionHtmlTemplate.js");
const { motionHtmlPlanCurrent } = await import("../src/lib/motionHtmlScene.js");
const { buildMotionHtmlScenes } = await import("../src/features/motion/server/services/html/scenePipeline.js");
const { createMotionProductionService } = await import("../src/features/motion/server/services/motionProductionService.js");
const { motionVoiceSignature } = await import("../src/lib/motionVoice.js");
const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "many" };
const source = { kind: "brief", title: "Letters", text: "A messenger arrives. A treaty is signed. The messenger leaves.", sourceSeconds: 6, segments: [{ t: 0, text: "A messenger arrives. A treaty is signed. The messenger leaves." }] };
const analysis: any = { title: source.title, visualSettings: settings, chapters: [{ id: "c1", title: "Arrival", from: 0, to: 4, targetSeconds: 4 }, { id: "c2", title: "Departure", from: 4, to: 6, targetSeconds: 2 }], cast: [], places: [], facts: [] };
const script: any = { title: source.title, language: "en", visualSettings: settings, voiceSettings: { multiVoice: false }, beats: [
  { id: "b1", chapterId: "c1", narration: "A messenger arrives.", visual: "scene", sceneTemplateDraft: "0. Arrival\n1. Fixed style\n2. Courtyard\n3. Messenger arrives\n4. No overlays" },
  { id: "b2", chapterId: "c1", narration: "A treaty is signed.", visual: "scene", sceneTemplateDraft: "0. Treaty\n1. Fixed style\n2. Hall\n3. Sign treaty\n4. No overlays" },
  { id: "b3", chapterId: "c2", narration: "The messenger leaves.", visual: "scene", sceneTemplateDraft: "0. Departure\n1. Fixed style\n2. Courtyard\n3. Messenger leaves\n4. No overlays" },
] };
const hooks: any = { calls: [] };
(globalThis as any).__motionHtmlStages = hooks;
const modulePath = path.resolve(`node_modules/.cache/motion-html-stages-${process.pid}.mjs`);
await fs.mkdir(path.dirname(modulePath), { recursive: true });
const jobBundle = await build({ stdin: { contents: 'export { scriptMotionStoryInput } from "./src/features/motion/server/services/motionProductionActions.ts"; export { getStoryJob, cancelStoryJob } from "./src/features/motion/server/services/motionStoryJobService.ts";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "esm", packages: "external", write: false, plugins: [{ name: "offline-scene-planning", setup(builder) {
  builder.onLoad({ filter: /motionStoryService\.ts$/ }, async ({ path: file }) => ({ loader: "ts", contents: (await fs.readFile(file, "utf8")).replace(/export const runMotionAi = async [^\n]+=> \{/, (match) => match + "\nif (globalThis.__motionHtmlStages) return globalThis.__motionHtmlStages.ai(prompt, artifactType);") }));
} }] });
await fs.writeFile(modulePath, jobBundle.outputFiles[0].text);
const actions = await import(pathToFileURL(modulePath).href);
hooks.ai = async (prompt: string, artifact: string) => {
  hooks.calls.push(artifact); assert.equal(artifact, MOTION_HTML.PLAN, "Resuming scene planning must not rewrite narration or draw HTML");
  assert.ok(!prompt.includes(MOTION_HTML.GRAPHICS), "Scene planning does not carry the drawing style rules");
  await delay(25);
  const context = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
  return { scenes: context.lines.map((line: any) => ({ fromLineId: line.id, toLineId: line.id, purpose: line.text, sceneTemplate: context.beats.find((beat: any) => line.id.startsWith(beat.id + "::")).sceneTemplateDraft })) };
};
const until = async (read: () => any): Promise<any> => {
  for (let index = 0; index < 1000; index++) { const state = read(); if (["completed", "error", "cancelled"].includes(state?.status)) return state; await delay(5); }
  throw new Error("Fixture did not finish");
};
try {
  const input = { source, analysis, ...script, resume: true, gen: script.gen, multiVoice: false, aiExecution: {}, sfx: true, aspect: "16:9", productionId: "script-stage" };
  const started = actions.scriptMotionStoryInput(input);
  const job = await until(() => actions.getStoryJob(started.job.id));
  assert.equal(job.status, "completed", job.error);
  const planned = job.result;
  assert.equal(hooks.calls.length, 2, "Both chapter groups are planned before SCRIPT completes");
  assert.equal(motionHtmlPlanCurrent(planned, analysis), true);
  assert.equal(Object.values(planned.gen.remotion.scenes).flat().length, 3);
  assert.deepEqual(planned.beats.map((beat: any) => beat.narration), script.beats.map((beat: any) => beat.narration));
  assert.ok(Object.values(planned.gen.remotion.scenes).flat().every((scene: any) => !scene.html));
  const html = '<!DOCTYPE html><html><body><canvas id="motion-canvas"></canvas><script>window.motionScene={renderAt:p=>{const c=document.getElementById("motion-canvas");c.width=p.width;c.height=p.height;c.getContext("2d").fillRect(0,0,c.width,c.height)}};</script></body></html>';
  const progress: string[] = []; let drawing = 0;
  const drawn = await buildMotionHtmlScenes(planned, analysis, { exec: {}, log: () => undefined, progress: (_value, stage) => progress.push(stage), scope: "draw-stage", ai: async (_prompt, artifact) => { assert.equal(artifact, MOTION_HTML.ARTIFACT); drawing++; return html; } });
  assert.equal(drawing, 3); assert.match(progress.at(-1)!, /3\/3 phân cảnh/);
  assert.equal(Object.values(drawn.gen!.remotion!.scenes).flat().length, 3);

  let scriptRuns = 0, sceneRuns = 0; const otherJobs = new Map<string, any>();
  const finished = (kind: string, result: any) => { const job = { id: kind, kind, status: "completed", progress: 1, log: [], result }; otherJobs.set(kind, job); return { success: true, job }; };
  const service = createMotionProductionService({
    scriptMotionStoryInput: (body: any) => { scriptRuns++; assert.equal(body.resume, true); assert.deepEqual(body.beats, script.beats); const response = actions.scriptMotionStoryInput(body); otherJobs.set("scriptId", response.job.id); return response; },
    scenesMotionStoryInput: (body: any) => { sceneRuns++; assert.ok(motionHtmlPlanCurrent(body.script, body.analysis)); assert.equal(actions.getStoryJob(otherJobs.get("scriptId")).status, "completed", "No early scene drawing during SCRIPT"); return finished("scenes", drawn); },
    voiceMotionStoryInput: (body: any) => finished("voice", { audioId: "fixture.wav", durations: [2, 2, 2], totalSeconds: 6, signature: motionVoiceSignature(body.script, body.analysis) }),
    getStoryJob: (id: string) => otherJobs.get(id) || actions.getStoryJob(id), cancelStoryJob: actions.cancelStoryJob,
    checkRemotionRuntime: async () => undefined, checkMotionMediaTools: async () => undefined, checkMotionProductionVoice: async () => undefined,
    compileMotionStoryInput: async () => ({ spec: { duration: 6 }, missing: [], voiceStale: false }),
  } as any, path.join(root, "productions"), 1);
  service.startMotionProduction({ productionId: "legacy-unplanned", source, analysis, script, visualSettings: settings, language: "en", multiVoice: false, autoExport: false, seo: false, sfx: true });
  const production = await until(() => service.getMotionProduction("legacy-unplanned"));
  assert.equal(production.status, "completed", production.error); assert.equal(scriptRuns, 1); assert.equal(sceneRuns, 1);
  process.stdout.write("PASS: real SCRIPT action finishes every scene plan, preserves saved narration, build only draws, progress counts scenes, legacy unplanned scripts resume planning.\n");
} finally { delete (globalThis as any).__motionHtmlStages; await fs.unlink(modulePath); }
process.exit(0);
