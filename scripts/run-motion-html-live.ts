import fs from "node:fs/promises";
import path from "node:path";
const out = path.resolve(process.argv[2] || `scratch/motion-html-live-${Date.now()}`);
const resuming = !!process.argv[2];
await fs.mkdir(out, { recursive: true });
const record = JSON.parse(await fs.readFile("storage/output/motion-video/productions/77a73efcd86bce887cd4e3368d7aa06a.json", "utf8"));
const { runInMotionAiSession, writeChapterBeats } = await import("../src/features/motion/server/services/motionStoryService.ts");
const { planMotionHtmlScenes } = await import("../src/features/motion/server/services/html/scenePipeline.ts");
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.ts");
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { motionHtmlAuthoringSnapshot } = await import("../src/lib/motionHtmlAuthoring.ts");
const { probeMotionMedia } = await import("../src/features/motion/server/services/motionMediaValidation.ts");
const scope = process.argv[3] || `html-smoke-${Date.now()}`;
if (resuming && !process.argv[3]) throw new Error("Resume requires the original scope argument to avoid duplicate AI submissions.");
const signal = AbortSignal.timeout(8 * 60 * 1000);
const logs: string[] = [];
const log = (text: string) => { if (!text) return; logs.push(text); process.stdout.write(text + "\n"); };
try {
  await runInMotionAiSession(scope, async () => {
    const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "few" };
    const source: any = { kind: "brief", title: "The late treaty", text: "A light historical cartoon. Two fictional envoys sit across a wooden table. One slides a treaty toward the other; the other looks surprised, then signs. End with both sitting calmly. No war, no injuries, no extra people. One short English sentence, around eight seconds total.", sourceSeconds: 8, segments: [{ t: 0, text: "Two fictional envoys pass and sign a treaty at a table." }], words: 45 };
    const chapter = { id: "c1", title: "The treaty", summary: source.text, from: 0, to: 8, targetSeconds: 8 };
    const analysis: any = { title: source.title, logline: "One small diplomatic surprise", factual: false, videoGenre: "chronicle", storytelling: "lively", authoringSettings: motionHtmlAuthoringSnapshot({ length: "2min", target: 8, language: "en", profile: "history", pacing: "few", videoGenre: "chronicle", storytelling: "lively" }), visualSettings: settings, chapters: [chapter], cast: [{ key: "envoy_red", name: "Red envoy", gender: "male", look: "Red robe, short brown hair, no beard" }, { key: "envoy_blue", name: "Blue envoy", gender: "male", look: "Blue robe, bald, short beard" }], places: [{ key: "hall", name: "Negotiation hall", description: "Plain stone hall, a wooden table and two chairs" }] };
    const beats = resuming ? JSON.parse(await fs.readFile(path.join(out, "writing.json"), "utf8")).beats : await writeChapterBeats(source, analysis, chapter, { language: "en", multiVoice: false, exec: record.input.aiExecution, signal, log, isFirst: true, isLast: true, speechRate: 2.4 });
    await fs.writeFile(path.join(out, "writing.json"), JSON.stringify({ analysis, beats }, null, 2));
    const script: any = resuming ? JSON.parse(await fs.readFile(path.join(out, "partial.json"), "utf8")) : { title: source.title, language: "en", visualSettings: settings, beats };
    const planned = await planMotionHtmlScenes(script, analysis, { exec: record.input.aiExecution, signal, log, scope, aspect: "16:9", sfx: false, partial: (value) => { void fs.writeFile(path.join(out, "partial.json"), JSON.stringify(value)); } });
    const built = await buildRemotionScenes(planned, analysis, { exec: record.input.sceneAiExecution, mainExec: record.input.aiExecution, signal, log, scope, aspect: "16:9", sfx: false, renderBehavior: { version: 1, actors: "simple", camera: "gentle", sceneEffects: "gentle" }, partial: (value) => { void fs.writeFile(path.join(out, "partial.json"), JSON.stringify(value)); } });
    await fs.writeFile(path.join(out, "script.json"), JSON.stringify(built, null, 2));
    const compiled = compileRemotionStory(built, analysis, { durations: beats.map(() => 8 / beats.length), fps: 30, subtitles: true });
    await renderRemotionVideo(compiled.spec, path.join(out, "scene.mp4"), { width: 640, height: 360, crf: 23, signal, onProgress: () => undefined, log });
    const probe = await probeMotionMedia(path.join(out, "scene.mp4"));
    await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ scope, actualProvider: record.input.sceneAiExecution, realProviderRun: true, realTts: false, originalProductionModified: false, scenes: compiled.spec.scenes.map((scene) => ({ id: scene.id, attempts: scene.html?.attempts, hash: scene.html?.hash })), probe, logs }, null, 2));
    process.stdout.write(`LIVE OUTPUT: ${out}\n`);
  }, log, true, signal);
} catch (error) { await fs.writeFile(path.join(out, "failure.json"), JSON.stringify({ error: String(error), logs }, null, 2)); process.stderr.write(`LIVE FAILED: ${out}: ${String(error)}\n`); process.exitCode = 1; }
process.exit(process.exitCode || 0);
