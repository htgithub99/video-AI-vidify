import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-audit-fixes-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR,
  priorData = process.env.APP_DATA_DIR;
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { createMotionSourceReader } = await import("../src/features/motion/lib/motionSourceReader.js");
const { scriptMotionStoryInput } = await import("../src/server/services/motionProductionActions.js");
const { getStoryJob } = await import("../src/server/services/motionStoryJobService.js");
const { writeChapterBeats } = await import("../src/server/services/motionStoryService.js");
const { remotionBeatKey, remotionGroupKey, remotionCompositionKey, remotionStoryBuildStatus } = await import("../src/server/services/remotion/sceneKeys.js");
const { buildRemotionScenes } = await import("../src/server/services/remotion/scenePipeline.js");
const { createCompositionGeometryInspector, MotionCompositionMeasurementError } = await import("../src/server/services/remotion/compositionGeometryInspector.js");
const { normalizeSceneComposition, compositionFrameSvg } = await import("../src/lib/motionSceneComposition.js");
const { motionCompositionGeometryErrors } = await import("../src/lib/motionCompositionGeometry.js");
const { puppetBeatLines } = await import("../src/lib/motionPuppet.js");
const { motionInputKey } = await import("../src/server/services/motionFileUtils.js");
const { createMotionProductionService } = await import("../src/server/services/motionProductionService.js");
const { MOTION_PRODUCTION: P } = await import("../src/constants/motionProduction.js");
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.js");
const { MOTION_REMOTION_LAYOUT: L } = await import("../src/constants/motionRemotionLayout.js");
const { MOTION_SCENE_PACING: PACING } = await import("../src/constants/motionScenePacing.js");
const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
const chapter: any = { id: "c1", title: "Trở về", summary: "Người khách đứng cạnh cửa nhà.", targetSeconds: 10, keyPoints: ["Người khách đứng cạnh cửa nhà."] };
const source: any = { title: chapter.title, kind: "brief", text: chapter.summary, segments: [{ t: 0, text: chapter.summary }], sourceSeconds: 10 };
const analysis: any = { title: chapter.title, logline: chapter.summary, era: "rural Vietnam", visualSettings: settings, cast: [{ key: "guest", name: "Người khách", role: "main" }], places: [{ key: "house", name: "Nhà", description: "Nhà trong làng" }], chapters: [chapter], facts: [], videoGenre: "auto" };
const beat: any = { id: "b1", chapterId: "c1", narration: chapter.summary, visual: "scene", cast: ["guest"], place: "house" };
const behavior: any = { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" };
const fixed = { ...behavior, actors: "fixed", sceneEffects: "off" };
const node: any = { id: "person", kind: "character", entityId: "guest", description: "Guest at the right side", pose: "standing", slot: "right", evidence: chapter.summary };
const design = { camera: "wide view", placements: [{ id: "person", box: { x: 0.7, y: 0.2, width: 0.1, height: 0.5 }, depth: 2, supportId: "floor", contact: { x: 0.75, y: 0.7 }, construction: "Standing adult at the right side" }] };
const art = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="room"><rect width="1280" height="720" fill="#303741"/></g><g id="person" transform="translate(896 144)"><rect width="128" height="360" fill="#605d76"/></g><g id="smoke"><path id="plume" d="M600 300Q620 250 600 200" fill="none" stroke="#ccc"/></g></svg>',
  design,
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character", entityId: "guest" },
    { id: "smoke", kind: "effect" },
  ],
  animations: [],
};
const animations = [
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
    attribute: "opacity",
    period: 8,
    keyframes: [
      { at: 0, value: 0.8 },
      { at: 4, value: 0.6 },
      { at: 8, value: 0.8 },
    ],
  },
];
const geometry = createCompositionGeometryInspector();
try {
  const directory = path.join(root, "production");
  fs.mkdirSync(directory, { recursive: true });
  const logDirectory = path.join(directory, P.LOG_FOLDER);
  fs.writeFileSync(logDirectory, "broken log directory");
  const service = createMotionProductionService(
    {
      checkRemotionRuntime: async () => {
        throw new Error("offline preflight sentinel");
      },
    },
    directory,
    1,
  );
  let unhandled: unknown;
  const onUnhandled = (error: unknown) => {
    unhandled = error;
  };
  process.on("unhandledRejection", onUnhandled);
  try {
    service.startMotionProduction({ productionId: "broken-log", source, visualSettings: settings, seo: false });
    await delay(30);
    assert.equal(service.getMotionProduction("broken-log")?.status, "error");
    assert.ok(service.getMotionProduction("broken-log")?.error);
    assert.ok(service.getMotionProduction("broken-log")?.log.some((line) => line.includes(service.getMotionProduction("broken-log")!.error!)));
    assert.equal(fs.existsSync(path.join(directory, "broken-log" + P.LOCK_EXT)), false);
    assert.equal(unhandled, undefined);
    fs.unlinkSync(logDirectory);
    fs.mkdirSync(logDirectory);
    service.resumeMotionProduction("broken-log");
    await delay(30);
    assert.equal(service.getMotionProduction("broken-log")?.status, "error");
    assert.match(service.getMotionProduction("broken-log")?.error || "", /offline preflight sentinel/u);
    assert.equal(fs.existsSync(path.join(directory, "broken-log" + P.LOCK_EXT)), false);
  } finally {
    process.removeListener("unhandledRejection", onUnhandled);
  }
  const failedSaveDirectory = path.join(root, "failed-snapshot");
  let corruptSnapshot = true;
  const failedSave = createMotionProductionService(
    {
      checkRemotionRuntime: async () => {
        if (corruptSnapshot) {
          const file = path.join(failedSaveDirectory, "failed-save" + P.EXT);
          fs.unlinkSync(file);
          fs.mkdirSync(file);
          corruptSnapshot = false;
        }
        throw new Error("offline snapshot sentinel");
      },
    },
    failedSaveDirectory,
    1,
  );
  failedSave.startMotionProduction({ productionId: "failed-save", source, visualSettings: settings, seo: false });
  await delay(30);
  assert.equal(failedSave.getMotionProduction("failed-save")?.status, "error");
  assert.match(failedSave.getMotionProduction("failed-save")?.error || "", new RegExp(P.SAVE_FAILED));
  assert.equal(fs.existsSync(path.join(failedSaveDirectory, "failed-save" + P.LOCK_EXT)), false);
  const pending = new Map<string, { resolve: (value: any) => void; reject: (error: unknown) => void; signal: AbortSignal }>();
  const received: string[] = [];
  const reader = createMotionSourceReader(
    (text, signal) => new Promise((resolve, reject) => pending.set(text, { resolve, reject, signal })),
    (_value, text) => received.push(text),
    0,
  );
  const old = reader.load("Nguồn cũ đang đọc");
  await delay(2);
  const fresh = reader.load("Nguồn mới được chọn");
  await delay(2);
  pending.get("Nguồn mới được chọn")!.resolve(source);
  await fresh;
  pending.get("Nguồn cũ đang đọc")!.reject(new Error("late failure"));
  await old;
  assert.deepEqual(received, ["Nguồn mới được chọn"]);
  const stale = reader.load("Nguồn cũ trả thành công");
  await delay(2);
  await reader.load("");
  pending.get("Nguồn cũ trả thành công")!.resolve(source);
  await stale;
  assert.deepEqual(received, ["Nguồn mới được chọn", ""]);
  const debounce = createMotionSourceReader(
    async () => {
      throw new Error("cancelled request must not start");
    },
    () => {
      throw new Error("cancelled result must not apply");
    },
    100,
  );
  const cancelled = debounce.load("Đang nhập nguồn mới");
  debounce.cancel();
  await cancelled;
  reader.cancel();
  const marker: any = { characterMotion: false, assets: {}, scenes: {}, failed: [], remotion: { marker: "accepted-resources" } };
  const run = scriptMotionStoryInput({ source, analysis, visualSettings: settings, beats: [beat], gen: marker, resume: true, editorPass: false });
  let job: any;
  for (let attempt = 0; attempt < 100; attempt++) {
    job = getStoryJob(run.job.id);
    if (["completed", "error", "cancelled"].includes(job.status)) break;
    await delay(5);
  }
  assert.equal(job.status, "completed");
  assert.deepEqual(job.result.gen, marker);
  const durationChapter = { ...chapter, targetSeconds: 60 };
  for (const response of [{ beats: [] }, { beats: [{ id: "wrong", narration: "Không đúng mục cần sửa." }] }, { beats: [{ id: beat.id, narration: beat.narration + "  " }] }]) {
    let saved: any,
      calls = 0;
    await assert.rejects(() =>
      writeChapterBeats(source, { ...analysis, chapters: [durationChapter] }, durationChapter, {
        language: "vi",
        exec: {},
        isFirst: true,
        isLast: true,
        durationRepair: true,
        speechRate: 3.2,
        existing: [beat],
        onDraft: (value) => {
          saved = value;
        },
        ai: async () => {
          calls++;
          return response;
        },
      }),
    );
    assert.ok(calls > 0 && calls <= P.CONTRACT_TOTAL_ATTEMPTS);
    assert.ok(saved.pending.some((item: any) => item.id === beat.id && item.targetUnits));
  }
  const changed = await writeChapterBeats(source, { ...analysis, chapters: [durationChapter] }, durationChapter, { language: "vi", exec: {}, isFirst: true, isLast: true, durationRepair: true, speechRate: 3.2, existing: [beat], ai: async () => ({ beats: [{ id: beat.id, narration: "Người khách đứng cạnh cửa, lặng nhìn căn nhà cũ trong đêm." }] }) });
  assert.notEqual(changed[0].narration, beat.narration);
  let partialCalls = 0;
  const two = await writeChapterBeats(source, { ...analysis, chapters: [durationChapter] }, durationChapter, {
    language: "vi",
    exec: {},
    isFirst: true,
    isLast: true,
    durationRepair: true,
    speechRate: 3.2,
    existing: [beat, { ...beat, id: "b2" }],
    ai: async () => ({ beats: [{ id: ++partialCalls === 1 ? "b1" : "b2", narration: "Người khách đứng cạnh cửa, nghe tiếng gió luồn qua căn nhà vắng." }] }),
  });
  assert.equal(partialCalls, 2);
  assert.ok(two.every((row) => row.narration !== beat.narration));
  const unrelated = { ...analysis, cast: [...analysis.cast, { key: "absent", name: "Người ở xa" }], places: [...analysis.places, { key: "unused", name: "Đồi xa" }] };
  assert.equal(remotionBeatKey(beat, analysis), remotionBeatKey(beat, unrelated));
  assert.equal(remotionBeatKey(beat, analysis), remotionBeatKey({ ...beat, narration: beat.narration + "  ", seconds: 20 }, analysis));
  assert.notEqual(remotionBeatKey(beat, analysis), remotionBeatKey({ ...beat, narration: "Người khách đứng bên bến sông." }, analysis));
  const built = normalizeSceneComposition(art, "art", "input", "room", [node], new Set(["guest"]), 1280, 720);
  assert.deepEqual(await geometry.check(built.asset, built.composition), []);
  const wrong = { ...built.asset, svg: built.asset.svg.replace('transform="translate(896 144)"', "").replace('width="128" height="360"', 'width="1280" height="720"') };
  assert.equal((await geometry.check(wrong, built.composition)).length, 1);
  assert.equal(motionCompositionGeometryErrors(built.composition, { person: { x: 0.65, y: 0.18, width: 0.2, height: 0.55 } }).length, 0);
  assert.equal(motionCompositionGeometryErrors(built.composition, { person: { x: 2, y: 0.2, width: 0.1, height: 0.5 } }).length, 1);
  assert.equal(motionCompositionGeometryErrors(built.composition, { person: null }).length, 1);
  const portrait = normalizeSceneComposition({ ...art, svg: art.svg.replace("0 0 1280 720", "0 0 720 1280").replace("translate(896 144)", "translate(504 256)").replace('width="128" height="360"', 'width="72" height="640"') }, "portrait", "input", "room", [node], new Set(["guest"]), 720, 1280);
  assert.deepEqual(await geometry.check(portrait.asset, portrait.composition), []);
  const lines = puppetBeatLines(beat);
  const calls: string[] = [];
  let latest: any;
  const script: any = { title: analysis.title, language: "vi", visualSettings: settings, beats: [beat] };
  const opts: any = {
    exec: {},
    geometry,
    review: false,
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "offline fixture");
    },
    renderBehavior: fixed,
    scope: "cache",
    log: () => {},
    partial: (value: any) => {
      latest = value;
    },
    ai: async (prompt: string, artifact: string) => {
      calls.push(artifact);
      if (artifact === V.ARTIFACT_SCENE) return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "room", environment: "old room", nodes: [node] }] };
      if (artifact === V.ARTIFACT_REVIEW) return { ok: true, issues: [] };
      if (artifact === C.ARTIFACT) return prompt.includes("Chỉ bổ sung animations") ? { animations } : art;
      throw new Error("Unexpected offline artifact: " + artifact);
    },
  };
  const generated = await buildRemotionScenes(script, analysis, { ...opts, geometry: { check: geometry.check } });
  assert.equal(remotionStoryBuildStatus(generated, analysis), "ready");
  const before = calls.length;
  await buildRemotionScenes(generated, unrelated, { ...opts, geometry: { check: geometry.check } });
  assert.equal(calls.length, before);
  const badCache = structuredClone(generated),
    badScene = badCache.gen!.remotion!.scenes.b1[0];
  delete badScene.composition!.geometryRevision;
  badCache.gen!.remotion!.assets[badScene.composition!.assetKey].svg = wrong.svg;
  const corrected = await buildRemotionScenes(badCache, analysis, {
    ...opts,
    scope: "bad-geometry-cache",
    review: true,
    geometry: { check: geometry.check },
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_REVIEW) return { ok: true, issues: [] };
      assert.equal(artifact, C.ARTIFACT);
      return { groupPatches: [{ id: "person", svg: '<g id="person" transform="translate(896 144)"><rect width="128" height="360" fill="#605d76"/></g>' }] };
    },
  });
  const correctedScene = corrected.gen!.remotion!.scenes.b1[0],
    correctedAsset = corrected.gen!.remotion!.assets[correctedScene.composition!.assetKey];
  assert.deepEqual(await geometry.check(correctedAsset, correctedScene.composition!), []);
  assert.ok(correctedAsset.svg.includes('<g id="room"><rect width="1280" height="720" fill="#303741"/></g>'));
  const legacy = structuredClone(generated);
  const state = legacy.gen!.remotion!;
  const legacyBeat = motionInputKey([V.VERSION, L.SCENE_REVISION, settings, V.PROFILES.horror.revision, analysis.era, analysis.cast, analysis.places, beat, ""]);
  const legacyGroup = motionInputKey([PACING.REVISION, [legacyBeat]]);
  state.inputKeys.b1 = legacyBeat;
  state.scenes.b1[0].sourceKey = legacyGroup;
  const scene = state.scenes.b1[0];
  scene.composition!.inputKey = motionInputKey([C.REVISION, scene.sourceKey, scene.purpose, scene.environment, scene.nodes, scene.text, settings, V.PROFILES.horror.revision, 1280, 720, state.notes!.b1, undefined]);
  state.assets[scene.composition!.assetKey].inputKey = scene.composition!.inputKey;
  const migrated = await buildRemotionScenes(legacy, analysis, { ...opts, scope: "legacy-cache", geometry: { check: geometry.check } });
  assert.equal(calls.length, before);
  assert.equal(migrated.gen!.remotion!.inputKeys.b1, remotionBeatKey(beat, analysis));
  assert.equal(migrated.gen!.remotion!.scenes.b1[0].sourceKey, remotionGroupKey([beat], analysis, migrated.gen!.remotion));
  assert.equal(migrated.gen!.remotion!.scenes.b1[0].composition!.inputKey, remotionCompositionKey(scene, unrelated, 1280, 720, state.notes!.b1));
  const multiScript = { ...script, beats: [beat, { ...beat, id: "b2", narration: "Người khách lặng nhìn căn nhà tối." }] };
  const multiLines = multiScript.beats.flatMap((row) => puppetBeatLines(row));
  const multiOpts = { ...opts, scope: "multi-scenes", geometry: { check: geometry.check }, ai: async (prompt: string, artifact: string) => (artifact === V.ARTIFACT_SCENE ? { scenes: multiLines.map((line, index) => ({ fromLineId: line.key, toLineId: line.key, purpose: "room " + index, environment: "old room", nodes: [node] })) } : opts.ai(prompt, artifact)) };
  const multiBuilt = await buildRemotionScenes(multiScript, analysis, multiOpts);
  assert.equal(multiBuilt.gen!.remotion!.scenes.b1.length, 2);
  const multiOld = structuredClone(multiBuilt),
    multiState = multiOld.gen!.remotion!;
  const oldBeatKeys = multiScript.beats.map((row) => motionInputKey([V.VERSION, L.SCENE_REVISION, settings, V.PROFILES.horror.revision, analysis.era, analysis.cast, analysis.places, row, ""]));
  const oldGroup = motionInputKey([PACING.REVISION, oldBeatKeys]);
  multiScript.beats.forEach((row, index) => {
    multiState.inputKeys[row.id] = oldBeatKeys[index];
  });
  let previousKey: string | undefined;
  for (const shot of multiState.scenes.b1) {
    shot.sourceKey = oldGroup;
    shot.composition!.inputKey = motionInputKey([C.REVISION, oldGroup, shot.purpose, shot.environment, shot.nodes, shot.text, settings, V.PROFILES.horror.revision, 1280, 720, multiState.notes!.b1, previousKey]);
    multiState.assets[shot.composition!.assetKey].inputKey = shot.composition!.inputKey;
    previousKey = shot.composition!.inputKey;
  }
  const beforeMultiMigration = calls.length;
  await buildRemotionScenes(multiOld, analysis, { ...multiOpts, scope: "multi-legacy" });
  assert.equal(calls.length, beforeMultiMigration);
  const edited = structuredClone(multiBuilt);
  edited.gen!.remotion!.scenes.b1[0].environment = "same room seen from the doorway";
  const nextComposition = structuredClone(edited.gen!.remotion!.scenes.b1[1].composition);
  const beforeEdit = calls.length;
  const repaired = await buildRemotionScenes(edited, analysis, { ...multiOpts, scope: "neighbor-edit" });
  assert.deepEqual(calls.slice(beforeEdit), [C.ARTIFACT]);
  assert.deepEqual(repaired.gen!.remotion!.scenes.b1[1].composition, nextComposition);
  const beforeMotion = calls.length;
  const enabled = await buildRemotionScenes(generated, analysis, { ...opts, scope: "enable-motion", renderBehavior: behavior, geometry: { check: geometry.check } });
  assert.deepEqual(calls.slice(beforeMotion), []);
  const animatedScene = enabled.gen!.remotion!.scenes.b1[0],
    animatedAsset = enabled.gen!.remotion!.assets[animatedScene.composition!.assetKey];
  assert.equal(animatedAsset.svg, generated.gen!.remotion!.assets[generated.gen!.remotion!.scenes.b1[0].composition!.assetKey].svg);
  assert.equal(compositionFrameSvg(animatedAsset, animatedScene.composition!, 0, behavior, new Set()), compositionFrameSvg(animatedAsset, animatedScene.composition!, 4, behavior, new Set()));
  const failedOpts = { ...opts, scope: "missing-motion", renderBehavior: behavior, geometry: { check: geometry.check }, ai: async () => ({ animations: [] }) };
  await buildRemotionScenes(generated, analysis, failedOpts);
  assert.equal(latest.gen.remotion.assets[generated.gen!.remotion!.scenes.b1[0].composition!.assetKey].svg, animatedAsset.svg);
  assert.equal(latest.gen.remotion.scenes.b1[0].build.status, "accepted");
  assert.equal(remotionStoryBuildStatus(script, analysis), "pending");
  const incomplete = structuredClone(generated);
  delete incomplete.gen!.remotion!.scenes.b1[0].composition;
  assert.equal(remotionStoryBuildStatus(incomplete, analysis), "pending");
  const outdated = structuredClone(generated);
  outdated.gen!.remotion!.profileRevision = -1;
  assert.equal(remotionStoryBuildStatus(outdated, analysis), "outdated");
  const damaged = structuredClone(generated);
  delete damaged.gen!.remotion!.assets[damaged.gen!.remotion!.scenes.b1[0].composition!.assetKey];
  assert.equal(remotionStoryBuildStatus(damaged, analysis), "invalid");
  const pendingMotion = structuredClone(generated);
  pendingMotion.gen!.renderBehavior = behavior;
  assert.equal(remotionStoryBuildStatus(pendingMotion, analysis), "ready");
  const infrastructureCalls: string[] = [];
  const infrastructure = await buildRemotionScenes(script, analysis, {
    ...opts,
    review: true,
    scope: "measurement-failure",
    ai: async (...args: any[]) => {
      infrastructureCalls.push(args[1]);
      return opts.ai(...args);
    },
    geometry: {
      check: async () => {
        throw new MotionCompositionMeasurementError(new Error("offline browser failure"));
      },
    },
  });
  assert.equal(infrastructure.gen!.remotion!.scenes.b1[0].build!.status, "failed");
  assert.equal(remotionStoryBuildStatus(infrastructure, analysis), "ready");
  assert.equal(infrastructureCalls.filter((artifact) => artifact === C.ARTIFACT).length, 1);
  console.log("Motion audit B01–B08: lifecycle, source races, resume assets, no-op/partial duration patches, stable/legacy caches, SVG geometry, metadata motion repair and build status passed; no live AI or video render.");
} finally {
  await geometry.close();
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = priorData;
  fs.rmSync(root, { recursive: true, force: true });
}
