import assert from "node:assert/strict";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
const out = path.resolve("scratch/motion-html-recovery-20261107");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "storage"); delete process.env.APP_DATA_DIR;
await fs.mkdir(out, { recursive: true });
const { planMotionHtmlScenes, buildMotionHtmlScenes, generateMotionHtmlScene } = await import("../src/features/motion/server/services/html/scenePipeline.ts");
const { renderMotionHtmlSegments } = await import("../src/features/motion/server/services/html/sceneRenderer.ts");
const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.ts");
const { remotionStoryBuildStatus } = await import("../src/features/motion/server/services/remotion/sceneKeys.ts");
const { motionRemotionSegments } = await import("../src/lib/motionRemotionSegments.ts");
const { MOTION_HTML } = await import("../src/constants/motionHtmlTemplate.ts");
const { motionHtmlStore } = await import("../src/features/motion/server/services/html/sceneStore.ts");
const { motionInputKey } = await import("../src/features/motion/server/services/motionFileUtils.ts");
const html = `<!DOCTYPE html><html><head></head><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:p=>{const c=document.getElementById('motion-canvas');c.width=p.width;c.height=p.height;const x=c.getContext('2d');x.fillStyle='#f5ead3';x.fillRect(0,0,c.width,c.height);x.fillStyle='#e05030';x.fillRect(p.progress*c.width*.7,30,40,40)}};</script></body></html>`;
const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "few" };
const analysis: any = { title: "Recovery", visualSettings: settings, chapters: [{ id: "c1", targetSeconds: 1 }], cast: [{ key: "one", name: "One", look: "Red coat", costume: { svgFrame: "LEGACY_GEOMETRY_MUST_NOT_BE_SENT" } }], places: [] };
const script: any = { title: "Recovery", language: "en", visualSettings: settings, beats: [{ id: "b1", chapterId: "c1", narration: "A letter arrives.", visual: "scene", frame: "LEGACY_GEOMETRY_MUST_NOT_BE_SENT", data: { svg: "LEGACY_GEOMETRY_MUST_NOT_BE_SENT" }, sceneTemplateDraft: "0. Scene\n1. Flat colours\n2. Room\n3. Letter arrives\n4. No overlays" }] };
const plan = (prompt: string) => { const context = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1)); return { scenes: [{ fromLineId: context.lines[0].id, toLineId: context.lines.at(-1).id, purpose: "Letter", sceneTemplate: script.beats[0].sceneTemplateDraft }] }; };
const options: any = { exec: {}, sfx: false, log: () => undefined, scope: `recovery-${Date.now()}` };
const previousDelays = [...MOTION_HTML.RETRY_MS]; (MOTION_HTML as any).RETRY_MS = [1];
let draws = 0;
const ai: any = async (prompt: string, artifact: string) => {
  assert.doesNotMatch(prompt, /LEGACY_GEOMETRY_MUST_NOT_BE_SENT/);
  if (artifact === MOTION_HTML.PLAN) return plan(prompt);
  assert.equal(artifact, MOTION_HTML.ARTIFACT); draws++; return html;
};
try {
  const planned = await planMotionHtmlScenes(script, analysis, { ...options, ai });
  const built = await buildMotionHtmlScenes(planned, analysis, { ...options, ai });
  assert.equal(remotionStoryBuildStatus(built, analysis), "ready");
  assert.equal(remotionStoryBuildStatus({ ...built, beats: [{ ...built.beats[0], narration: "A different event." }] }, analysis), "outdated");
  const rebuilt = await buildMotionHtmlScenes(built, analysis, { ...options, ai, restart: true, rebuildKey: "restart-one" });
  assert.equal(draws, 2);
  const resumed = await buildMotionHtmlScenes(rebuilt, analysis, { ...options, ai, restart: true, rebuildKey: "restart-one" });
  assert.equal(draws, 2, "Resuming the same restart intent keeps its accepted scenes");
  await buildMotionHtmlScenes(resumed, analysis, { ...options, ai, restart: true, rebuildKey: "restart-two" });
  assert.equal(draws, 3, "A new explicit restart generates one new complete scene");

  for (const phase of [MOTION_HTML.PLAN, MOTION_HTML.ARTIFACT]) {
    const scope = `${options.scope}-${phase}`;
    const cancel = new AbortController(); let sends = 0, originalId = "";
    const interrupted: any = async (prompt: string, artifact: string, exec: any) => {
      if (artifact !== phase) return ai(prompt, artifact);
      assert.equal(exec.submission.attempted, false);
      originalId = exec.requestId; sends++;
      Object.assign(exec.submission, { attempted: true, pending: { prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: artifact, requestId: exec.requestId, responseSelector: "model-response", busySelector: "stop", url: "https://example.test/app/conversation-one" } });
      exec.submissionChanged(); cancel.abort(new Error("fixture explicit cancellation")); cancel.signal.throwIfAborted();
    };
    const prior = phase === MOTION_HTML.PLAN ? script : await planMotionHtmlScenes(script, analysis, { ...options, scope, ai });
    const run = phase === MOTION_HTML.PLAN ? planMotionHtmlScenes : buildMotionHtmlScenes;
    await assert.rejects(run(prior, analysis, { ...options, scope, ai: interrupted, signal: cancel.signal }), /fixture explicit cancellation/);
    const continued: any = async (prompt: string, artifact: string, exec: any) => {
      if (artifact !== phase) return ai(prompt, artifact);
      assert.equal(exec.requestId, originalId); assert.equal(exec.submission.attempted, true);
      assert.equal(exec.submission.pending.url, "https://example.test/app/conversation-one");
      exec.submission.completed = true;
      return artifact === MOTION_HTML.PLAN ? plan(prompt) : html;
    };
    const recovered = await run(prior, analysis, { ...options, scope, ai: continued });
    const result = phase === MOTION_HTML.PLAN ? await buildMotionHtmlScenes(recovered, analysis, { ...options, scope, ai }) : recovered;
    assert.equal(sends, 1, "Resume reads the same submitted request rather than sending it again");
    assert.equal(Object.values(result.gen!.remotion!.scenes).flat()[0].html?.status, "ready");
  }

  const storageScene: any = { id: "storage", renderer: "html-canvas", beatId: "b1", nodes: [], text: "A letter arrives.", sceneTemplate: script.beats[0].sceneTemplateDraft };
  const storageScope = `${options.scope}-storage`;
  const storageKey = motionInputKey([MOTION_HTML.VERSION, MOTION_HTML.GRAPHICS, storageScene.sceneTemplate, 320, 180, "history", undefined, undefined]);
  const storageManifest = motionHtmlStore(storageScope, storageScene.id, storageKey).manifest;
  const blockedRaw = path.join(path.dirname(storageManifest), "attempt-1.txt");
  assert.ok(blockedRaw.startsWith(out + path.sep));
  let storageCalls = 0;
  await generateMotionHtmlScene(storageScene, { width: 320, height: 180, seconds: 1, profile: "history", scope: storageScope }, { ...options, ai: async () => {
    storageCalls++; fsSync.mkdirSync(blockedRaw);
    setTimeout(() => fsSync.rmdirSync(blockedRaw), 100);
    return html;
  } });
  assert.equal(storageCalls, 1, "A raw-response write failure retains the response, without calling AI again");
  assert.equal(await fs.readFile(blockedRaw, "utf8"), html);

  const broken = html.replace("const c=", "if(p.time>.1)throw Error('late Canvas fault');const c=");
  const originalScene = Object.values(resumed.gen!.remotion!.scenes).flat()[0];
  const late: any = { id: "late", renderer: "html-canvas", beatId: "b1", fromLineId: originalScene.fromLineId, toLineId: originalScene.toLineId, nodes: [], text: "A letter arrives.", sceneTemplate: script.beats[0].sceneTemplateDraft };
  const lateScope = `${options.scope}-late`;
  await generateMotionHtmlScene(late, { width: 320, height: 180, seconds: 1, profile: "history", scope: lateScope }, { ...options, ai: async () => broken });
  assert.equal(late.html.status, "ready", "No speculative frame QA: the actual opening frame works");
  const compiled = compileRemotionStory({ ...script, gen: { cast: {}, locations: {}, remotion: { ...resumed.gen!.remotion, scenes: { b1: [late] } } } }, analysis, { durations: [1], fps: 30, subtitles: false, renderBehavior: { version: 1, actors: "simple", camera: "gentle", sceneEffects: "gentle" } }).spec;
  const encoding = { width: 320, height: 180, crf: 26 };
  const before = motionRemotionSegments(compiled, encoding)[0].key;
  let recoveries = 0;
  await renderMotionHtmlSegments(compiled, [{ start: 0, end: Math.ceil(compiled.duration * 30) - 1, output: path.join(out, "recovered.mp4") }], {
    ...encoding, signal: new AbortController().signal, onProgress: () => undefined,
    recoverScene: async (scene, dimensions, runtimeOptions) => {
      recoveries++; assert.equal(scene.html!.prompt, late.html.prompt);
      return generateMotionHtmlScene(scene, dimensions, { ...runtimeOptions, ai: async () => html });
    },
  });
  assert.equal(recoveries, 1); assert.equal(compiled.scenes[0].html!.attempts, 2);
  assert.notEqual(motionRemotionSegments(compiled, encoding)[0].key, before, "Late regeneration updates the visual cache key");
  await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ explicitRestartResume: true, noLegacyGeometrySent: true, staleNarrationDetected: true, plannerAndSceneSubmissionResume: true, rawWriteRecoveryWithoutNewAi: true, lateFrameRegenerated: recoveries, realProviderCalls: 0 }, null, 2));
  process.stdout.write("PASS: restart/resume, stale script, no legacy geometry, cancelled planner/HTML request identities, late-frame regeneration and cache key.\n");
} finally { (MOTION_HTML as any).RETRY_MS = previousDelays; }
process.exit(0);
