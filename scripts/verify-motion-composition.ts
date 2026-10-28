import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { MOTION_SCENE_DESIGN as D } from "../src/constants/motionSceneDesign.js";
import { normalizeMotionSceneDesign } from "../src/lib/motionSceneDesign.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { normalizeSceneComposition, compositionFrameSvg, mergeSceneCompositionDraft, validateSceneComposition } from "../src/lib/motionSceneComposition.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { remotionSceneReadiness, validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { normalizeMotionVisualSettings, motionVisualRequest } from "../src/lib/motionVisual.js";
import { remotionSceneProgress } from "../src/features/motion/lib/motionRemotionProgress.js";
import { compileRemotionStory } from "../src/server/services/remotion/storyCompiler.js";
import { remotionStoryBuildCurrent } from "../src/server/services/remotion/sceneKeys.js";
import { puppetBeatLines } from "../src/lib/motionPuppet.js";
import { buildRemotionScenes } from "../src/server/services/remotion/scenePipeline.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-composition-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "fixed" as const };
const settings = { version: 1 as const, mode: "remotion" as const, engine: "remotion" as const, profileId: "horror" as const, componentRevision: 1 };
const node: any = { id: "person", kind: "character", entityId: "uncle", description: "man in purple shirt", pose: "standing", slot: "right", evidence: "Chú đứng cạnh bàn." };
const design = () => ({ camera: "wide eye-level view", palette: ["#303741"], placements: [{ id: "person", box: { x: 0.3, y: 0.2, width: 0.1, height: 0.5 }, depth: 2, supportId: "floor", contact: { x: 0.35, y: 0.7 }, construction: "Connected adult standing on floor" }] });
const illustration = (width = 1280, height = 720) => ({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><g id="room"><rect width="${width}" height="${height}" fill="#303741"/></g><g id="person" transform="translate(400 200)"><path d="M0 0L40 0L40 200L0 200Z" fill="#605d76"/><path id="mouth" d="M10 20Q20 20 30 20" fill="none" stroke="#000"/></g><g id="smoke" filter="url(#blur)"><path id="plume" d="M600 300Q620 250 600 200" fill="none" stroke="#ccc"/></g></svg>`,
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character", entityId: "uncle" },
    { id: "smoke", kind: "effect" },
  ],
  animations: [
    {
      target: "person",
      channel: "actor",
      attribute: "transform",
      period: 8,
      keyframes: [
        { at: 0, value: "translate(0 0)" },
        { at: 4, value: "translate(0 -1)" },
        { at: 8, value: "translate(0 0)" },
      ],
    },
    {
      target: "plume",
      channel: "effect",
      attribute: "d",
      period: 8,
      keyframes: [
        { at: 0, value: "M600 300Q620 250 600 200" },
        { at: 4, value: "M600 300Q610 250 600 200" },
        { at: 8, value: "M600 300Q620 250 600 200" },
      ],
    },
    {
      target: "mouth",
      channel: "speech",
      attribute: "d",
      period: 0.4,
      keyframes: [
        { at: 0, value: "M10 20Q20 20 30 20" },
        { at: 0.2, value: "M10 20Q20 24 30 20" },
        { at: 0.4, value: "M10 20Q20 20 30 20" },
      ],
    },
  ],
});
try {
  assert.equal(normalizeMotionVisualSettings().mode, "library");
  assert.equal(normalizeMotionVisualSettings({ version: 1, mode: "library", engine: "canvas", packId: "existing" }).mode, "library");
  assert.deepEqual(motionVisualRequest({ visualSettings: { version: 1, mode: "library", engine: "canvas", packId: "existing" } }).stylePreset, "existing");
  assert.equal(motionVisualRequest({ visualSettings: settings, stylePreset: "existing" }).stylePreset, undefined);
  for (const invalid of [
    { version: 2, mode: "library" },
    { ...settings, engine: "canvas" },
    { ...settings, componentRevision: 200 },
  ])
    assert.throws(() => normalizeMotionVisualSettings(invalid));
  const built = normalizeSceneComposition(illustration(), "art", "input", "room", [node], new Set(["uncle"]), 1280, 720);
  const staleLayer = normalizeSceneComposition({ ...illustration(), layers: [...illustration().layers, { id: "obsolete_group", kind: "prop" }] }, "art", "input", "room", [node], new Set(["uncle"]), 1280, 720);
  assert.equal(staleLayer.asset.svg, built.asset.svg);
  assert.deepEqual(staleLayer.composition.layers, built.composition.layers);
  assert.throws(() => normalizeSceneComposition({ ...illustration(), svg: illustration().svg.replace('id="person"', 'id="another_person"') }, "bad", "bad", "", [node], new Set(["uncle"]), 1280, 720));
  assert.ok(normalizeSceneComposition(illustration(), "art", "input", "room", [node, { id: "smoke", kind: "prop", description: "incense smoke" } as any], new Set(["uncle"]), 1280, 720));
  assert.equal(mergeSceneCompositionDraft(illustration(), { layers: [] }).svg, illustration().svg);
  assert.deepEqual(mergeSceneCompositionDraft(illustration(), { animations: [] }).animations, []);
  const repairPrompt = C.REPAIR(C.PROMPT({ design: design(), scene: { text: "Keep this story fact" }, drawingReference: "UNNEEDED_REFERENCE", continuity: { svg: "UNNEEDED_PREVIOUS_SVG" } }), illustration(), ["Fix opacity"]);
  assert.ok(repairPrompt.includes("Keep this story fact"));
  assert.ok(repairPrompt.includes(JSON.stringify(design())));
  assert.ok(!repairPrompt.includes("UNNEEDED_REFERENCE"));
  assert.ok(!repairPrompt.includes("UNNEEDED_PREVIOUS_SVG"));
  assert.deepEqual(normalizeMotionSceneDesign(design(), [node]), design());
  for (const invalid of [
    { ...design(), placements: [] },
    { ...design(), placements: [{ ...design().placements[0], supportId: "missing" }] },
    { ...design(), placements: [{ ...design().placements[0], supportId: "person" }] },
    { ...design(), placements: [{ ...design().placements[0], box: { x: 0, y: 0, width: Infinity, height: 1 } }] },
  ])
    assert.throws(() => normalizeMotionSceneDesign(invalid, [node]));
  const replacement = '<g id="person"><path id="mouth" d="M0 0L1 1"/></g>';
  const patchedSvg = mergeSceneCompositionDraft(illustration(), { groupPatches: [{ id: "person", svg: replacement }] }).svg as string;
  assert.ok(patchedSvg.includes(replacement));
  assert.equal(mergeSceneCompositionDraft(illustration(), { svg: illustration().svg.replace('fill="#303741"', 'fill="#fff"'), groupPatches: [{ id: "person", svg: replacement }] }).svg, patchedSvg);
  assert.ok(patchedSvg.includes('<g id="room"><rect width="1280" height="720" fill="#303741"/></g>'));
  assert.ok(patchedSvg.includes('<g id="smoke" filter="url(#blur)"><path id="plume" d="M600 300Q620 250 600 200" fill="none" stroke="#ccc"/></g>'));
  for (const groupPatches of [
    [{ id: "absent", svg: replacement }],
    [{ id: "person", svg: '<g id="another"/>' }],
    [{ id: "person", svg: replacement + '<g id="extra"/>' }],
    [{ id: "person", svg: '<g id="person" onload="alert(1)"/>' }],
    [
      { id: "person", svg: replacement },
      { id: "person", svg: replacement },
    ],
    [{ id: "person", svg: '<g id="person"><g id="room"/></g>' }],
  ])
    assert.throws(() => mergeSceneCompositionDraft(illustration(), { groupPatches }));
  assert.throws(() =>
    mergeSceneCompositionDraft(
      { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="parent"><g id="child"/></g></svg>' },
      {
        groupPatches: [
          { id: "parent", svg: '<g id="parent"/>' },
          { id: "child", svg: '<g id="child"/>' },
        ],
      },
    ),
  );
  validateSceneComposition({ ...built.composition, revision: 1 }, { ...built.asset, compositionRevision: 1 }, [node], new Set(["uncle"]));
  assert.throws(() => normalizeMotionVector(built.asset.svg, "legacy", "", ""));
  const quiet = compositionFrameSvg(built.asset, built.composition, 0.2, behavior, new Set());
  assert.ok(quiet.includes('id="mouth" d="M10 20Q20 20 30 20"'));
  const talking = compositionFrameSvg(built.asset, built.composition, 0.2, behavior, new Set(["uncle"]));
  assert.ok(talking.includes('id="mouth" d="M10 20Q20 24 30 20"'));
  const fixed = compositionFrameSvg(built.asset, built.composition, 4, { ...behavior, actors: "fixed" }, new Set(["uncle"]));
  assert.ok(fixed.includes('transform="translate(400 200)"'));
  assert.ok(fixed.includes('d="M600 300Q610 250 600 200"'));
  assert.equal(compositionFrameSvg(built.asset, built.composition, 4, { ...behavior, actors: "fixed", sceneEffects: "off" }, new Set()), built.asset.svg);
  assert.ok(compositionFrameSvg(built.asset, built.composition, 4, behavior, new Set()).includes('transform="translate(400 200) translate(0 -1)"'));
  for (const badSvg of [built.asset.svg.replace('<g id="room">', '<g id="room" onload="alert(1)">'), built.asset.svg.replace("</svg>", "<script>alert(1)</script></svg>"), built.asset.svg.replace("</svg>", '<image href="https://example.com/x.png"/></svg>')]) assert.throws(() => normalizeSceneComposition({ ...illustration(), svg: badSvg }, "bad", "bad", "", [node], new Set(["uncle"]), 1280, 720));
  assert.throws(() => normalizeSceneComposition({ ...illustration(), layers: [{ id: "room", kind: "background" }] }, "bad", "bad", "", [node], new Set(["uncle"]), 1280, 720));
  assert.throws(() => normalizeSceneComposition(illustration(), "bad", "bad", "", [node], new Set(["uncle"]), 720, 1280));
  assert.throws(() => normalizeSceneComposition({ ...illustration(), animations: [{ ...illustration().animations[0], target: "absent" }] }, "bad", "bad", "", [node], new Set(["uncle"]), 1280, 720));
  const analysis: any = { title: "Composition test", visualSettings: settings, era: "rural Vietnam", cast: [{ key: "uncle", name: "Chú", look: "purple shirt" }], places: [{ key: "house", name: "Nhà", description: "old house" }], chapters: [{ id: "chapter", targetSeconds: 8 }] };
  const script: any = {
    title: "Composition test",
    language: "vi",
    visualSettings: settings,
    beats: [
      {
        id: "beat",
        chapterId: "chapter",
        visual: "scene",
        place: "house",
        narration: "Chú đứng cạnh bàn. Ai đang gọi tôi?",
        utterances: [
          { id: "n", speaker: "narrator", role: "narration", text: "Chú đứng cạnh bàn." },
          { id: "d", speaker: "uncle", role: "dialogue", text: "Ai đang gọi tôi?" },
        ],
      },
    ],
  };
  const calls: Record<string, number> = {};
  let partial: any;
  const ai: any = async (prompt: string, artifact: string) => {
    calls[artifact] = (calls[artifact] || 0) + 1;
    if (artifact === V.ARTIFACT_SCENE) {
      const lines = puppetBeatLines(script.beats[0]);
      return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "room", environment: "old room", nodes: [node] }] };
    }
    if (artifact === C.ARTIFACT) {
      const size = prompt.match(/"width":(\d+),"height":(\d+)/)!;
      return illustration(Number(size[1]), Number(size[2]));
    }
    if (artifact === D.ARTIFACT) return design();
    throw new Error(`Unexpected AI call: ${artifact}`);
  };
  const opts: any = {
    exec: {},
    ai,
    scope: "offline-composition",
    review: false,
    renderBehavior: behavior,
    log: () => {},
    partial: (value: any) => {
      partial = value;
    },
  };
  const generated = await buildRemotionScenes(script, analysis, opts);
  assert.ok(remotionStoryBuildCurrent(generated, analysis));
  assert.deepEqual(generated.gen!.remotion!.scenes.beat[0].composition!.design, design());
  assert.equal(calls[D.ARTIFACT], 1);
  assert.equal(generated.gen!.remotion!.scenes.beat.length, 1);
  assert.ok(remotionSceneReadiness(generated.gen!.remotion!.scenes.beat[0], generated.gen!.remotion).preview);
  const progress = remotionSceneProgress({ ...generated, beats: [...generated.beats, { ...script.beats[0], id: "future", place: "outside" }] }, true);
  assert.equal(progress.ready, 1);
  assert.equal(progress.total, 2);
  assert.equal(progress.entries[1].status, "waiting");
  assert.equal(calls[V.ARTIFACT_REVIEW], undefined);
  const priorCalls = JSON.stringify(calls);
  await buildRemotionScenes(generated, analysis, opts);
  assert.equal(JSON.stringify(calls), priorCalls);
  await buildRemotionScenes(generated, analysis, { ...opts, renderBehavior: { ...behavior, actors: "fixed", sceneEffects: "off" } });
  assert.equal(JSON.stringify(calls), priorCalls);
  const compiled = compileRemotionStory(generated, analysis, {
    fps: 30,
    durations: [8],
    renderBehavior: behavior,
    voiceTrack: {
      continuous: true,
      audioId: "",
      voiceId: "",
      totalSeconds: 8,
      durations: [8],
      clips: [
        { id: "n", beatId: "beat", speaker: "narrator", voiceId: "", text: "Chú đứng cạnh bàn.", audioId: "", start: 0, end: 4 },
        { id: "d", beatId: "beat", speaker: "uncle", voiceId: "", text: "Ai đang gọi tôi?", audioId: "", start: 4.2, end: 7 },
      ],
    },
  });
  assert.deepEqual(compiled.spec.scenes[0].speaking, [{ entityId: "uncle", startFrame: 126, endFrame: 210 }]);
  assert.equal(validateRemotionSpec(compiled.spec), compiled.spec);
  assert.equal(Object.keys(compiled.spec.assets).length, 1);
  assert.throws(() => compileRemotionStory(generated, analysis, { aspect: "9:16" }));
  const oldBuilt = structuredClone(generated);
  oldBuilt.gen!.remotion!.compositionRevision = 1;
  assert.equal(remotionStoryBuildCurrent(oldBuilt, analysis), false);
  let patchAttempts = 0;
  const patched = await buildRemotionScenes(script, analysis, {
    ...opts,
    scope: "field-patch",
    ai: async (prompt: string, artifact: string) => {
      if (artifact !== C.ARTIFACT) return ai(prompt, artifact);
      patchAttempts++;
      return patchAttempts === 1 ? { ...illustration(), layers: [] } : { layers: illustration().layers };
    },
  });
  assert.equal(patchAttempts, 2);
  assert.ok(remotionStoryBuildCurrent(patched, analysis));
  let designAttempts = 0;
  const patchedDesign = await buildRemotionScenes(script, analysis, {
    ...opts,
    scope: "design-field-patch",
    ai: async (prompt: string, artifact: string) => {
      if (artifact !== D.ARTIFACT) return ai(prompt, artifact);
      return ++designAttempts === 1 ? { ...design(), camera: {} } : { camera: design().camera };
    },
  });
  assert.equal(designAttempts, 2);
  assert.deepEqual(patchedDesign.gen!.remotion!.scenes.beat[0].composition!.design, design());
  let reviews = 0;
  const reviewed = await buildRemotionScenes(generated, analysis, {
    ...opts,
    scope: "review-scene",
    review: true,
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "render fixture");
    },
    ai: async (prompt: string, artifact: string) =>
      artifact === V.ARTIFACT_REVIEW
        ? { ok: ++reviews > 1, issues: reviews > 1 ? [] : ["Clothing should be purple"], checks: reviews > 1 ? [] : [{ ok: false, category: "identity", evidence: "The main character wears red instead of the explicitly specified purple clothing.", problem: "Clothing should be purple" }] }
        : artifact === C.ARTIFACT
          ? { groupPatches: [{ id: "person", svg: '<g id="person"><path d="M0 0L1 1" fill="#605d76"/><path id="mouth" d="M10 20Q20 20 30 20"/></g>' }] }
          : ai(prompt, artifact),
  });
  assert.equal(reviews, 2);
  assert.ok(reviewed.gen!.remotion!.scenes.beat[0].reviewKey);
  const multi = {
    ...script,
    beats: [
      { ...script.beats[0], id: "bad" },
      { ...script.beats[0], id: "good", place: "outside" },
    ],
  };
  let multiPartial: any;
  await assert.rejects(() =>
    buildRemotionScenes(multi, analysis, {
      ...opts,
      scope: "independent-scenes",
      partial: (value: any) => {
        multiPartial = value;
      },
      ai: async (prompt: string, artifact: string) => {
        const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
        if (artifact === V.ARTIFACT_SCENE) {
          const source = puppetBeatLines(multi.beats.find((beat: any) => beat.id === context.beat.id));
          return { scenes: [{ fromLineId: source[0].key, toLineId: source.at(-1)!.key, purpose: context.beat.id, environment: "room", nodes: [node] }] };
        }
        if (artifact === D.ARTIFACT) return design();
        return context.scene.purpose === "bad" ? { svg: "broken", layers: [] } : illustration();
      },
    }),
  );
  assert.ok(multiPartial.gen.remotion.failures.bad);
  assert.equal(multiPartial.gen.remotion.failures.good, undefined);
  assert.ok(remotionSceneReadiness(multiPartial.gen.remotion.scenes.good[0], multiPartial.gen.remotion).preview);
  const beforeAspect = calls[C.ARTIFACT];
  const portrait = await buildRemotionScenes(generated, analysis, { ...opts, aspect: "9:16" });
  assert.equal(calls[C.ARTIFACT], beforeAspect + 1);
  assert.equal(portrait.gen!.remotion!.assets[portrait.gen!.remotion!.scenes.beat[0].composition!.assetKey].width, 720);
  const damaged = structuredClone(generated);
  delete damaged.gen!.remotion!.assets[damaged.gen!.remotion!.scenes.beat[0].composition!.assetKey];
  assert.equal(remotionStoryBuildCurrent(damaged, analysis), false);
  await assert.rejects(() => buildRemotionScenes(script, analysis, { ...opts, scope: "failed-composition", ai: async (_prompt: string, artifact: string) => (artifact === C.ARTIFACT ? { svg: "broken", layers: [] } : ai(_prompt, artifact)) }));
  assert.ok(partial.gen.remotion.scenes.beat.length);
  assert.ok(Object.keys(partial.gen.remotion.failures).length);
  const acceptedDesignCalls = calls[D.ARTIFACT];
  const resumed = await buildRemotionScenes(script, analysis, { ...opts, scope: "failed-composition" });
  assert.ok(remotionStoryBuildCurrent(resumed, analysis));
  assert.equal(calls[D.ARTIFACT], acceptedDesignCalls);
  console.log("Scene composition: spatial design, group repair, legacy preview, safety, speech gating, independent effects, checkpoint resume, aspect rebuild, voice timing and partial failure persistence passed.");
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  const absolute = path.resolve(root);
  assert.equal(path.dirname(absolute), path.resolve(os.tmpdir()));
  assert.ok(path.basename(absolute).startsWith("motion-composition-"));
  fs.rmSync(absolute, { recursive: true, force: true });
}
