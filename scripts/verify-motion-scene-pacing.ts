import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { motionVisualBeatGroups, motionScenePacingRule } from "../src/lib/motionScenePacing.js";
import { motionCompileStateKey, motionRenderStateKey, switchMotionVisualDraft, recoverMotionVisualDraft } from "../src/features/motion/lib/motionVisualDraft.js";
import { normalizeMotionVisualSettings } from "../src/lib/motionVisual.js";
import { remotionSceneProgress } from "../src/features/motion/lib/motionRemotionProgress.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { MOTION_SCENE_DESIGN as D } from "../src/constants/motionSceneDesign.js";
import { buildRemotionScenes } from "../src/server/services/remotion/scenePipeline.js";
import { compileRemotionStory } from "../src/server/services/remotion/storyCompiler.js";
import { remotionStoryBuildCurrent } from "../src/server/services/remotion/sceneKeys.js";
import { mergeEquivalentRemotionDrafts } from "../src/server/services/remotion/sceneContract.js";
import { puppetStoryboardProfile } from "../src/lib/motionStoryboard.js";
import { computeBeatTimeline } from "../src/server/services/motionDirectorService.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-pacing-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1, pacing: "few" };
  const behavior: any = { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" };
  const analysis: any = { title: "Pacing fixture", visualSettings: settings, cast: [{ key: "uncle", name: "Chú" }], places: [{ key: "house", name: "Nhà" }], chapters: [{ id: "chapter", targetSeconds: 24 }] };
  const script: any = {
    title: analysis.title,
    language: "vi",
    visualSettings: settings,
    beats: Array.from({ length: 3 }, (_, index) => ({
      id: `b${index}`,
      chapterId: "chapter",
      place: "house",
      time: index ? undefined : "night",
      visual: "scene",
      narration: index === 1 ? "Ai đang ở ngoài đó?" : "Chú đứng yên bên cửa.",
      utterances: [{ id: `u${index}`, role: index === 1 ? "dialogue" : "narration", speaker: index === 1 ? "uncle" : "narrator", text: index === 1 ? "Ai đang ở ngoài đó?" : "Chú đứng yên bên cửa." }],
    })),
  };
  assert.equal(motionVisualBeatGroups(script).length, 1);
  for (const patch of [{ place: "river" }, { chapterId: "next" }, { time: "morning" }, { weather: "rain" }]) assert.equal(motionVisualBeatGroups({ ...script, beats: [script.beats[0], { ...script.beats[1], ...patch }] }).length, 2);
  assert.equal(motionVisualBeatGroups({ ...script, beats: Array.from({ length: 30 }, (_, index) => ({ ...script.beats[0], id: `long${index}` })) }).length, 4);
  assert.throws(() => normalizeMotionVisualSettings({ ...settings, pacing: "invalid" }));
  assert.notEqual(motionScenePacingRule(settings, 40), motionScenePacingRule({ ...settings, pacing: "many" }, 40));
  assert.notDeepEqual(puppetStoryboardProfile(analysis), puppetStoryboardProfile({ ...analysis, visualSettings: { ...settings, pacing: "many" } }));
  const state: any = { visualSettings: settings, script, analysis, quality: "high", musicMood: "eerie", musicVolume: 0.1 };
  assert.equal(motionCompileStateKey(state), motionCompileStateKey({ ...state, musicMood: "off" }));
  assert.notEqual(motionRenderStateKey(state), motionRenderStateKey({ ...state, musicMood: "off" }));
  assert.notEqual(motionRenderStateKey(state), motionRenderStateKey({ ...state, musicVolume: 0.3 }));
  const retained: any = { ...state, analysis: { ...analysis, illustrationNeeds: [{ place: "house" }] }, script: { ...script, gen: { cast: { uncle: "existing" } } } };
  const switched = switchMotionVisualDraft(retained, { ...settings, pacing: "many" });
  assert.deepEqual(switched.state.analysis.illustrationNeeds, retained.analysis.illustrationNeeds);
  assert.deepEqual(switched.state.script.gen.cast, retained.script.gen.cast);
  const node: any = { id: "person", kind: "character", entityId: "uncle", description: "standing man", pose: "standing", slot: "left", evidence: "Chú đứng yên" };
  const calls: string[] = [],
    logs: string[] = [];
  const options: any = {
    exec: {},
    review: false,
    scope: "grouped",
    renderBehavior: behavior,
    log: (line: string) => logs.push(line),
    ai: async (prompt: string, artifact: string) => {
      calls.push(artifact);
      const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
      if (artifact === V.ARTIFACT_SCENE) {
        assert.equal(context.beats.length, 3);
        assert.ok(context.pacing.includes("SOFT"));
        return { scenes: [{ fromLineId: context.lines[0].id, toLineId: context.lines.at(-1).id, purpose: "quiet exchange", environment: "house", nodes: [node] }] };
      }
      if (artifact === D.ARTIFACT) return { camera: "wide", placements: [{ id: "person", box: { x: 0.2, y: 0.2, width: 0.2, height: 0.6 }, depth: 1, supportId: "floor", contact: { x: 0.3, y: 0.8 }, construction: "connected person on floor" }] };
      if (artifact === C.ARTIFACT)
        return {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="room"><rect width="1280" height="720" fill="#303741"/></g><g id="person"><path d="M200 100L300 100L300 500L200 500Z" fill="#605d76"/><path id="mouth" d="M220 120Q230 120 240 120" stroke="#000"/></g></svg>',
          layers: [
            { id: "room", kind: "background" },
            { id: "person", kind: "character", entityId: "uncle" },
          ],
          animations: [],
        };
      throw new Error(`Unexpected artifact ${artifact}`);
    },
  };
  const built = await buildRemotionScenes(script, analysis, options);
  assert.equal(calls.filter((item) => item === V.ARTIFACT_SCENE).length, 1);
  assert.equal(calls.filter((item) => item === C.ARTIFACT).length, 1);
  assert.deepEqual(built.gen!.remotion!.scenes.b0[0].sourceBeatIds, ["b0", "b1", "b2"]);
  assert.equal(remotionSceneProgress(built).total, 1);
  assert.ok(remotionStoryBuildCurrent(built, analysis));
  const voice: any = { continuous: true, totalSeconds: 24, durations: [8, 8, 8], clips: script.beats.map((beat: any, index: number) => ({ id: `u${index}`, beatId: beat.id, speaker: index === 1 ? "uncle" : "narrator", text: beat.narration, start: index * 8, end: index * 8 + 7 })) };
  const compiled = compileRemotionStory(built, analysis, { fps: 30, voiceTrack: voice, durations: voice.durations });
  assert.equal(compiled.spec.scenes.length, 1);
  const expectedDuration = Math.ceil(computeBeatTimeline(script.beats, voice.durations, true).total * 30) / 30;
  assert.equal(compiled.spec.duration, expectedDuration);
  assert.equal(compiled.spec.scenes[0].endFrame, Math.ceil(expectedDuration * 30));
  assert.deepEqual(compiled.spec.scenes[0].speaking, [{ entityId: "uncle", startFrame: 240, endFrame: 450 }]);
  assert.ok(compiled.spec.subtitles.some((item) => item.start >= 16));
  assert.equal(compileRemotionStory(built, analysis, { durations: [8, 8, 8], subtitles: false }).spec.subtitles.length, 0);
  const recoveryState: any = { ...state, analysis, script: built, aspect: "16:9", fps: 30, subtitles: true, renderBehavior: behavior };
  const recoveryResult: any = { analysis, script: built, compiled, rendered: { id: "saved-output" }, renderSettings: { musicMood: "eerie", musicVolume: 0.1, quality: "high" } };
  assert.ok(recoverMotionVisualDraft(recoveryState, recoveryResult)?.renderJob);
  assert.equal(recoverMotionVisualDraft({ ...recoveryState, musicMood: "off" }, recoveryResult)?.renderJob, null);
  assert.ok(recoverMotionVisualDraft({ ...recoveryState, musicMood: "off" }, recoveryResult)?.compiled);
  const count = calls.length;
  await buildRemotionScenes(built, analysis, { ...options, onlyBeats: ["b1"] });
  assert.equal(calls.length, count);
  const split = await buildRemotionScenes(script, analysis, {
    ...options,
    scope: "important-cut",
    ai: async (prompt: string, artifact: string) => {
      if (artifact !== V.ARTIFACT_SCENE) return options.ai(prompt, artifact);
      const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
      return {
        scenes: [
          { fromLineId: context.lines[0].id, toLineId: context.lines[0].id, purpose: "establish", environment: "house", nodes: [node] },
          { fromLineId: context.lines[1].id, toLineId: context.lines.at(-1).id, purpose: "essential clue", environment: "house", nodes: [node] },
        ],
      };
    },
  });
  const splitCompiled = compileRemotionStory(split, analysis, { fps: 30, voiceTrack: voice, durations: voice.durations });
  assert.equal(splitCompiled.spec.scenes.length, 2);
  assert.equal(splitCompiled.spec.scenes[0].endFrame, 240);
  assert.equal(splitCompiled.spec.scenes[1].startFrame, 240);
  assert.deepEqual(splitCompiled.spec.scenes[1].sourceBeatIds, ["b1", "b2"]);
  const brokenRange = structuredClone(built);
  brokenRange.gen!.remotion!.scenes.b0[0].toLineId = "unknown";
  assert.equal(remotionStoryBuildCurrent(brokenRange, analysis), false);
  const changed: any = structuredClone(built);
  changed.beats[1].narration += " Cửa đã đóng.";
  assert.equal(remotionStoryBuildCurrent(changed, analysis), false);
  const oldPacing = { ...analysis, visualSettings: { ...settings, pacing: "many" } };
  assert.equal(remotionStoryBuildCurrent({ ...built, visualSettings: oldPacing.visualSettings }, oldPacing), false);
  const draft = { purpose: "same task", environment: "house", nodes: [node], fromLineId: "a", toLineId: "a" };
  const merged = mergeEquivalentRemotionDrafts([draft, { ...draft, fromLineId: "b", toLineId: "b" }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].toLineId, "b");
  assert.equal(mergeEquivalentRemotionDrafts([draft, { ...draft, purpose: "essential reveal", fromLineId: "b", toLineId: "b" }]).length, 2);
  assert.equal(mergeEquivalentRemotionDrafts([draft, { ...draft, nodes: [{ ...node, state: "dead" }], fromLineId: "b", toLineId: "b" }]).length, 2);
  assert.ok(logs.some((line) => line.includes("minh họa tĩnh")));
  console.log("Scene pacing passed: cross-beat planning/drawing, exact voice/dialogue/subtitle timing, semantic boundaries, bounded groups, cache reuse, pacing invalidation, library policy and export music signatures. No live AI/TTS/video.");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  fs.rmSync(root, { recursive: true, force: true });
}
