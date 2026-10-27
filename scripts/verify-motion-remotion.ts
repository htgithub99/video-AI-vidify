import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normalizeMotionVisualSettings, motionVisualRequest } from "../src/lib/motionVisual.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { layoutRemotionNodes, validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { puppetBeatLines } from "../src/lib/motionPuppet.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../src/constants/motionRemotionLayout.js";
import { remotionBeatKey, remotionBeatPlanCurrent, remotionStoryPlanCurrent } from "../src/server/services/remotion/sceneKeys.js";
import { motionInputKey } from "../src/server/services/motionFileUtils.js";
import type { MotionVisualSettings, MotionVectorAsset } from "../src/types/motionVisual.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-remotion-"));
const prior = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
try {
  const { buildRemotionScenes } = await import("../src/server/services/remotion/scenePipeline.js");
  const { compileRemotionStory } = await import("../src/server/services/remotion/storyCompiler.js");
  const settings: MotionVisualSettings = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
  assert.equal(normalizeMotionVisualSettings().mode, "library");
  assert.equal(normalizeMotionVisualSettings(undefined, "chosen-pack").mode, "library");
  assert.deepEqual(motionVisualRequest({ visualSettings: { version: 1, mode: "library", engine: "canvas", packId: "chosen-pack" } }), { visualSettings: { version: 1, mode: "library", engine: "canvas", packId: "chosen-pack" }, stylePreset: "chosen-pack" });
  assert.deepEqual(motionVisualRequest({ visualSettings: settings, stylePreset: "chosen-pack" }), { visualSettings: settings, stylePreset: undefined, styleReferences: [] });
  for (const bad of [
    { version: 2, mode: "library" },
    { version: 1, mode: "remotion", engine: "canvas", profileId: "history" },
    { version: 1, mode: "other" },
    { ...settings, componentRevision: 200 },
  ])
    assert.throws(() => normalizeMotionVisualSettings(bad));
  const analysis: any = {
    title: "Renderer fixture",
    visualSettings: settings,
    era: "Vietnamese folk illustration",
    cast: [
      { key: "ghost", name: "Bóng áo trắng", look: "white robe, pale face", role: "ghost" },
      { key: "soldier", name: "Người lính", look: "tall soldier in brown uniform", role: "soldier" },
    ],
    places: [{ key: "house", name: "Nhà", description: "dark wooden house" }],
    chapters: [{ id: "chapter_1", title: "Fixture", targetSeconds: 3 }],
  };
  const script: any = {
    title: "Renderer fixture",
    language: "vi",
    visualSettings: settings,
    beats: [
      { id: "beat_1", chapterId: "chapter_1", place: "house", visual: "scene", narration: "Bóng áo trắng đứng cạnh cửa. Chiếc bình nằm trên bàn.", data: { soundEvents: [{ id: "wind", kind: "wind", layer: "ambience", source: "offscreen", at: 0, duration: 1 }] } },
      { id: "beat_2", chapterId: "chapter_1", place: "house", visual: "scene", narration: "Người lính đứng bên phải." },
    ],
  };
  const lines = script.beats.map((beat: any) => puppetBeatLines(beat));
  assert.equal(lines[0].length, 2);
  const node = (id: string, kind: string, description: string, evidence: string, extra = {}) => ({ id, kind, description, evidence, pose: "standing", slot: "center", essential: true, ...extra });
  const plans = [
    { fromLineId: lines[0][0].key, toLineId: lines[0][0].key, purpose: "White ghost beside door", environment: "dark wooden wall", nodes: [node("door", "prop", "wooden door", "cửa"), node("ghost", "character", "white robe, pale face", "Bóng áo trắng", { entityId: "ghost", relation: "beside", target: "door", slot: "left" })] },
    { fromLineId: lines[0][1].key, toLineId: lines[0][1].key, purpose: "Vase on table", environment: "dark wooden wall", nodes: [node("table", "prop", "wooden table", "bàn"), node("vase", "prop", "blue vase", "bình", { relation: "on", target: "table" })] },
    { fromLineId: lines[1][0].key, toLineId: lines[1][0].key, purpose: "Soldier on right", environment: "dark wooden wall", nodes: [node("soldier", "character", "tall soldier in brown uniform", "Người lính", { entityId: "soldier", slot: "right" })] },
  ];
  const calls: Record<string, number> = {};
  let failedPlan = false;
  let reviewRejected = false;
  const ai: any = async (prompt: string, artifact: string, _exec: unknown, _signal: unknown, _log: unknown, images: any[]) => {
    calls[artifact] = (calls[artifact] || 0) + 1;
    if (artifact === V.ARTIFACT_SCENE) {
      if (prompt.includes('"note":"Keep white robe"')) return { scenes: plans.slice(0, 2) };
      if (prompt.includes('"repairIssues"')) return { scenes: [plans[0]] };
      if (prompt.includes('"id":"beat_2"')) return { scenes: [plans[2]] };
      if (!failedPlan) {
        failedPlan = true;
        return { scenes: [plans[0], { ...plans[1], nodes: [{ ...plans[1].nodes[0], entityId: "unknown", kind: "character" }] }] };
      }
      assert.ok(prompt.includes("preserve accepted"));
      return { scenes: [plans[1]] };
    }
    if (artifact === V.ARTIFACT_REVIEW) {
      assert.ok(images?.length && fs.existsSync(images[0].path));
      if (!reviewRejected && prompt.includes('"id":"ghost"')) {
        reviewRejected = true;
        return { ok: false, issues: ["ghost: robe must be white"] };
      }
      return { ok: true, issues: [] };
    }
    assert.equal(artifact, V.ARTIFACT_ASSET);
    const context = JSON.parse(prompt.split("Context:\n")[1]);
    const description = context.description || "";
    const bg = context.kind === "background",
      person = context.member || context.identity;
    const width = bg ? 1600 : person ? 300 : 600,
      height = bg ? 900 : person ? 700 : 300;
    const shape = bg
      ? '<rect width="1600" height="900" fill="#26343b"/><path d="M0 650H1600V900H0Z" fill="#3b302a"/>'
      : person
        ? `<circle cx="150" cy="85" r="55" fill="#ddd4c4"/><path d="M90 145H210L250 650H50Z" fill="${description.includes("white") ? "#fff" : "#77543c"}"/><path d="M100 650V685M200 650V685" stroke="#14191d" stroke-width="22"/>`
        : description.includes("vase")
          ? '<path d="M235 10H365L350 80Q500 280 300 290Q100 280 250 80Z" fill="#6387af"/>'
          : '<rect x="10" y="30" width="580" height="50" fill="#825e39"/><path d="M50 80V290M550 80V290" stroke="#634526" stroke-width="35"/>';
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${shape}</svg>`, anchors: Object.fromEntries((context.requiredAnchors || []).map((name: string) => [name, name === "surface" ? { x: 0.5, y: 0.1 } : name === "grip" ? { x: 0.7, y: 0.5 } : { x: 0.5, y: 0.98 }])) };
  };
  const logs: string[] = [];
  const options = {
    exec: {},
    log: (line: string) => {
      logs.push(line);
    },
    ai,
    review: false,
    scope: "remotion-offline",
  };
  const built = await buildRemotionScenes(script, analysis, options);
  assert.equal(built.gen!.remotion!.scenes.beat_1.length, 2);
  assert.equal(built.gen!.puppet, undefined);
  assert.ok(logs.includes(V.LOG_REVIEW_OFF));
  assert.equal(calls[V.ARTIFACT_REVIEW], undefined);
  const before = JSON.stringify(calls);
  const restored = await buildRemotionScenes(script, analysis, options);
  assert.equal(JSON.stringify(calls), before);
  assert.deepEqual({ ...restored.gen!.remotion, updatedAt: 0 }, { ...built.gen!.remotion, updatedAt: 0 });
  const voice: any = {
    continuous: true,
    durations: [1.6, 0.8],
    totalSeconds: 2.4,
    clips: [
      { id: "u1", beatId: "beat_1", start: 0.1, end: 1.7, text: script.beats[0].narration },
      { id: "u2", beatId: "beat_2", start: 1.7, end: 2.5, text: script.beats[1].narration },
    ],
  };
  const compiled = compileRemotionStory(built, analysis, { durations: voice.durations, voiceTrack: voice, fps: 24 });
  assert.equal(compiled.spec.scenes.length, 3);
  assert.equal(compiled.spec.scenes.at(-1)!.endFrame, Math.ceil(compiled.spec.duration * 24));
  assert.ok(compiled.sfxCues.some((cue) => cue.kind === "wind"));
  const noCaptions = compileRemotionStory(built, analysis, { durations: voice.durations, voiceTrack: voice, fps: 24, subtitles: false });
  assert.equal(noCaptions.spec.subtitles.length, 0);
  assert.equal(noCaptions.spec.duration, compiled.spec.duration);
  assert.deepEqual(noCaptions.sfxCues, compiled.sfxCues);
  const vaseScene = compiled.spec.scenes[1],
    vase = vaseScene.nodes.find((item) => item.id === "vase")!,
    table = vaseScene.nodes.find((item) => item.id === "table")!;
  assert.ok(Math.abs(vase.y + vase.height * 0.98 - table.y - table.height * 0.1) < 0.001);
  assert.ok(compiled.spec.scenes[0].nodes.find((item) => item.id === "ghost")!.x < compiled.spec.scenes[0].nodes.find((item) => item.id === "door")!.x);
  for (const aspect of ["9:16", "1:1", "4:5"]) validateRemotionSpec(compileRemotionStory(built, analysis, { aspect, fps: 30 }).spec);
  const stale = structuredClone(built);
  stale.beats[0].narration += " Nguồn đã đổi.";
  assert.throws(() => compileRemotionStory(stale, analysis, {}));
  const badFrame = structuredClone(compiled.spec);
  badFrame.scenes[1].startFrame++;
  assert.throws(() => validateRemotionSpec(badFrame));
  const validSvg = '<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
  for (const svg of [validSvg.replace("<rect", "<script/><rect"), validSvg.replace("<rect", '<image href="https://example.com/x"/><rect'), validSvg.replace("<rect", '<rect onload="alert(1)"/><rect'), '<svg viewBox="0 0 100 100"><g><rect/></svg>', '<svg viewBox="0 0 100 100"><rect width=100/></svg>']) assert.throws(() => normalizeMotionVector(svg, "bad", "bad", ""));
  const asset: MotionVectorAsset = { ...normalizeMotionVector(validSvg, "test", "test", "test"), anchors: { base: { x: 0.5, y: 1 } } };
  const cycle: any[] = [node("a", "prop", "a", "a", { relation: "beside", target: "b", assetKey: "test" }), node("b", "prop", "b", "b", { relation: "beside", target: "a", assetKey: "test" })];
  assert.throws(() => layoutRemotionNodes(cycle, { test: asset }, 1000, 562));
  const reviewed = await buildRemotionScenes(built, analysis, {
    ...options,
    review: true,
    still: async (_spec: unknown, output: string) => {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, "offline image fixture");
    },
  });
  assert.ok(reviewRejected && logs.some((line) => line.includes("Sửa đúng cảnh")));
  const accepted = JSON.stringify(calls);
  await buildRemotionScenes(reviewed, analysis, {
    ...options,
    review: true,
    still: async () => {
      throw new Error("Accepted reviews should be cached");
    },
  });
  assert.equal(JSON.stringify(calls), accepted);
  assert.ok(reviewed.gen!.remotion!.scenes.beat_1.every((scene) => !!scene.reviewKey));
  const corrected = await buildRemotionScenes(reviewed, analysis, { ...options, onlyBeats: ["beat_1"], note: "Keep white robe" });
  const beforeContinue = JSON.stringify(calls);
  const continued = await buildRemotionScenes(corrected, analysis, options);
  assert.equal(continued.gen!.remotion!.notes!.beat_1, "Keep white robe");
  assert.equal(JSON.stringify(calls), beforeContinue);
  const legacy = structuredClone(built);
  for (const beat of legacy.beats) {
    const oldKey = motionInputKey([V.VERSION, analysis.visualSettings, analysis.era, analysis.cast, analysis.places, beat, ""]);
    legacy.gen!.remotion!.inputKeys[beat.id] = oldKey;
    for (const scene of legacy.gen!.remotion!.scenes[beat.id]) {
      delete scene.sceneRevision;
      scene.layoutRevision = L.REVISION;
      scene.sourceKey = oldKey;
    }
  }
  legacy.voiceTrack = voice;
  assert.equal(remotionStoryPlanCurrent(legacy, analysis), false);
  assert.throws(() => compileRemotionStory(legacy, analysis, {}));
  let migratedBeats = 0;
  const retainedArtwork = Object.fromEntries(Object.entries(legacy.gen!.remotion!.assets).map(([key, value]) => [key, value.svg]));
  const migrationAi: any = async (prompt: string, artifact: string, ...args: any[]) => {
    if (artifact !== V.ARTIFACT_SCENE) return ai(prompt, artifact, ...args);
    const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
    migratedBeats++;
    return { scenes: context.beat.id === "beat_1" ? plans.slice(0, 2) : [plans[2]] };
  };
  const migrated = await buildRemotionScenes(legacy, analysis, { ...options, scope: "legacy-scenes", ai: migrationAi });
  assert.equal(migratedBeats, 2);
  assert.equal(remotionStoryPlanCurrent(migrated, analysis), true);
  assert.deepEqual(migrated.voiceTrack, voice);
  for (const [key, svg] of Object.entries(retainedArtwork)) assert.equal(migrated.gen!.remotion!.assets[key]?.svg, svg);
  await buildRemotionScenes(migrated, analysis, { ...options, scope: "legacy-scenes", ai: migrationAi });
  assert.equal(migratedBeats, 2);
  const falselyStamped = structuredClone(migrated.gen!.remotion!);
  delete falselyStamped.scenes.beat_1[0].sceneRevision;
  assert.equal(remotionBeatPlanCurrent(script.beats[0], analysis, falselyStamped), false);
  const savedProduction = path.resolve("storage/output/motion-video/productions/53c01d81007bf76dbed7f4ad42f72999.json");
  if (fs.existsSync(savedProduction)) {
    const real = JSON.parse(fs.readFileSync(savedProduction, "utf8")).result;
    assert.equal(real.script.beats.length, 18);
    for (const beat of real.script.beats) {
      assert.notEqual(real.script.gen.remotion.inputKeys[beat.id], remotionBeatKey(beat, real.analysis));
      assert.equal(remotionBeatPlanCurrent(beat, real.analysis, real.script.gen.remotion), false);
    }
  }
  if (process.argv.includes("--render")) {
    const { renderRemotionStill, renderRemotionVideo } = await import("../src/server/services/motionRemotionRenderService.js");
    const { validateMotionMedia } = await import("../src/server/services/motionMediaValidation.js");
    const output = path.resolve("scratch/remotion-integration-20261027");
    fs.mkdirSync(output, { recursive: true });
    for (const scene of compiled.spec.scenes) await renderRemotionStill(compiled.spec, path.join(output, `${scene.id.replaceAll(":", "-")}.png`), scene.startFrame);
    await renderRemotionVideo(compiled.spec, path.join(output, "technical-fixture.mp4"), { width: 640, height: 360, crf: 24, signal: new AbortController().signal, onProgress: () => {} });
    await validateMotionMedia(path.join(output, "technical-fixture.mp4"), { seconds: compiled.spec.duration, fps: 24, width: 640, height: 360, frames: Math.ceil(compiled.spec.duration * 24) });
    console.log(`Remotion stills and technical clip verified: ${output}`);
  }
  console.log("Visual modes: legacy defaults, isolated settings, partial scene repair, checkpoint reuse, anchors, aspect ratios, frame/audio timing, SFX, SVG validation and local image review repair passed without live AI/TTS.");
} finally {
  if (prior === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = prior;
  const resolved = path.resolve(root);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("motion-remotion-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
