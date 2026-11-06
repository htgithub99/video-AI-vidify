import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
const out = path.resolve(process.env.QA_WRITER_OUT || "storage/output/motion-video/clip-demo/script-intent-authoring-20261106-v3");
await fs.mkdir(out, { recursive: true });
process.env.VIDIFY_STORAGE_DIR = path.join(out, "isolated-storage");
delete process.env.APP_DATA_DIR;
const { writeChapterBeats, runMotionAi, runInMotionAiSession } = await import("../src/features/motion/server/services/motionStoryService.ts");
const file = path.resolve("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json"), bytes = await fs.readFile(file), p = JSON.parse(bytes.toString()), hash = createHash("sha256").update(bytes).digest("hex");
const timed = p.result.compiled.spec.scenes[40], sourceBeatId = timed.sourceBeatIds?.[0] || timed.beatId, approved = p.result.script.beats.find((b: any) => b.id === sourceBeatId);
assert.ok(approved);
const exactScene = Object.values(p.result.script.gen.remotion.scenes).flat().find((s: any) => s.id === timed.id);
const chapter = { id: approved.chapterId, title: "Approved Granicus scene", summary: approved.narration, keyPoints: [approved.action], from: 0, to: 60, targetSeconds: 15 };
const context = p.result.analysis;
const analysis = { title: context.title, logline: approved.narration, factual: context.factual, videoGenre: context.videoGenre, storytelling: context.storytelling, visualSettings: context.visualSettings, era: context.era, stylePreset: context.stylePreset, cast: context.cast, groups: context.groups, places: context.places.filter((place: any) => place.key === approved.place), chapters: [chapter] };
// A real-source, single-scene authoring test; no source facts are replaced with invented fixture events.
const sourceText = p.input.source.text as string, pivot = Math.max(0, sourceText.toLowerCase().indexOf("noble"));
const excerpt = sourceText.slice(Math.max(0, pivot - 500), pivot + 1400);
const source = { ...p.input.source, text: excerpt, segments: [{ t: 0, text: excerpt }] };
let calls = 0, lastRaw: any;
const scope = `script-motion-intent-${randomUUID()}`, signal = AbortSignal.timeout(12 * 60000), log = (line: string) => { if (line) console.log(line); };
const beats = await runInMotionAiSession(scope, () => writeChapterBeats(source, analysis, chapter, {
  language: p.input.language, exec: { ...p.input.aiExecution, chromeHeadless: false }, signal, log, isFirst: false, isLast: false, multiVoice: false,
  section: `AUTHORING AN EXISTING APPROVED SCRIPT BEAT: return exactly ONE beat with id ${approved.id}. Keep its narration EXACTLY as supplied, and write the detailed motionIntent now, together with this script beat, using its source-backed action and existing AI scene brief. No SVG or keyframes. Keep genre, identities and facts. The script is approved; enrich its directing prose without rewriting the spoken lines. APPROVED BEAT: ${JSON.stringify(approved)}. EXISTING AI SCENE BRIEF: ${JSON.stringify(exactScene, (key, value) => ["composition", "build", "generation", "requestKeys"].includes(key) ? undefined : value)}`,
  ai: async (prompt, artifact, exec, aiSignal, aiLog, images) => {
    calls++; assert.equal(artifact, "motion-story-chapter");
    await fs.writeFile(path.join(out, `${process.env.QA_WRITER_REPLAY_FILE ? "replay-" : ""}script-prompt-${calls}.txt`), prompt);
    const raw = process.env.QA_WRITER_REPLAY_FILE ? JSON.parse(await fs.readFile(path.resolve(process.env.QA_WRITER_REPLAY_FILE), "utf8")) : await runMotionAi(prompt, artifact, exec, aiSignal, aiLog, images);
    lastRaw = raw;
    if (!process.env.QA_WRITER_REPLAY_FILE) await fs.writeFile(path.join(out, `script-response-${calls}.json`), JSON.stringify(raw, null, 2));
    return raw;
  },
}), undefined, true, signal);
assert.equal(beats.length, 1, "Do not silently pick an unrelated generated beat");
assert.equal(lastRaw.beats[0].id, approved.id, "Use the author's exact source reference; normalizer may assign operational IDs to a newly written script");
assert.equal(beats[0].narration, approved.narration, "No code repair of author output to make it fit");
assert.ok(beats[0].motionIntent?.trim());
assert.equal(beats[0].motionIntent, lastRaw.beats[0].motionIntent);
await fs.writeFile(path.join(out, "written-intent.json"), JSON.stringify({ beatId: approved.id, normalizedBeatId: beats[0].id, narration: approved.narration, motionIntent: beats[0].motionIntent, replayedRetainedWriterResponse: !!process.env.QA_WRITER_REPLAY_FILE }, null, 2));
assert.equal(createHash("sha256").update(await fs.readFile(file)).digest("hex"), hash);
console.log(JSON.stringify({ stage: "script-complete", scriptCalls: calls, providerCallsThisRun: process.env.QA_WRITER_REPLAY_FILE ? 0 : calls, sceneDrawingCalls: 0, output: path.join(out, "written-intent.json"), motionIntent: beats[0].motionIntent }));
process.exit(0);
