import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-one-pass-"));
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { puppetBeatLines } = await import("../src/lib/motionPuppet.ts");
const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.ts");
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.ts");
const { MOTION_SCENE_ACTION_REVISION } = await import("../src/constants/motionSceneAction.ts");
const { motionActorTracks } = await import("../src/lib/motionActorTracks.ts");
const { compositionFrameSvg, normalizeSceneComposition } = await import("../src/lib/motionSceneComposition.ts");
const { remotionSceneReadiness } = await import("../src/lib/motionRemotion.ts");
const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.ts");
const { remotionStoryBuildStatus } = await import("../src/features/motion/server/services/remotion/sceneKeys.ts");
const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "fixed" as const };
const node: any = { id: "person", kind: "character", anonymous: true, slot: "center", description: "A crowd walks across the courtyard", evidence: "People walk." };
const art = () => ({
  svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><g id='room'><rect width='1280' height='720' fill='#333'/></g><g id='person'><g id='person_arm'><path d='M0 0L0 20' stroke='#fff'/></g><rect x='100' y='100' width='20' height='80'/></g></svg>`,
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character", anonymous: true },
  ],
  animations: [
    {
      target: "person",
      channel: "actor",
      attribute: "transform",
      period: 2,
      keyframes: [
        { at: 0, value: "translate(0 0)" },
        { at: 1, value: "translate(200 0)" },
        { at: 2, value: "translate(0 0)" },
      ],
    },
    {
      target: "person_arm",
      channel: "actor",
      attribute: "transform",
      period: 1,
      keyframes: [
        { at: 0, value: "rotate(0 0 0)" },
        { at: 0.5, value: "rotate(20 0 0)" },
        { at: 1, value: "rotate(0 0 0)" },
      ],
    },
  ],
  continuityNotes: "Grey courtyard.",
});
let accepted = 0;
for (const profile of ["history", "horror", "explainer"] as const) {
  const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: profile, componentRevision: 1 };
  const script: any = {
    title: "One pass",
    language: "en",
    visualSettings: settings,
    beats: [{ id: "beat", chapterId: "c", place: "yard", visual: "scene", duration: 12, narration: "People walk. People turn. People approach. People pass. People return. People stop.", utterances: ["People walk.", "People turn.", "People approach.", "People pass.", "People return.", "People stop."].map((text, i) => ({ id: `u${i}`, speaker: "narrator", role: "narration", text })) }],
  };
  script.beats[0].motionIntent = `WRITTEN-BY-SCRIPT-AI-${profile}: The crowd walks, turns, approaches, passes, returns and stops, as the covered lines describe; coordinate their appropriate visible parts and retain supports.`;
  const analysis: any = { title: script.title, visualSettings: settings, cast: [], places: [{ key: "yard", name: "Courtyard" }], chapters: [{ id: "c", targetSeconds: 12 }] };
  const lines = puppetBeatLines(script.beats[0]),
    calls: string[] = [],
    prompts: string[] = [],
    logs: string[] = [];
  let active = 0,
    peak = 0,
    latest: any,
    fail = false,
    rigid = 0;
  const ai: any = async (prompt: string, artifact: string, exec: any) => {
    calls.push(artifact);
    prompts.push(prompt);
    if (artifact === V.ARTIFACT_SCENE) {
      assert.ok(prompt.includes("SUBJECT ACTIONS"), "Planner receives the action-authoring contract");
      return {
        scenes: lines.map((line, i) => ({
          fromLineId: line.key,
          toLineId: line.key,
          purpose: `shot-${i}`,
          environment: "Courtyard",
          actionPlan: {
            start: `PLANNER-${profile}-${i}: start`,
            subjects: [{ nodeId: "person", action: line.text, parts: [{ name: "arm", change: "Performs the authored gesture relative to the torso" }], phases: [{ phase: "perform", description: "Perform the covered action with its visible parts" }], end: "Settle" }],
            interactions: ["Contacts stay joined"],
            end: "Settled",
            environment: "Still",
            camera: "Fixed",
          },
          nodes: [node],
        })),
      };
    }
    assert.equal(artifact, C.ARTIFACT, "No motion director, QA, repair or other post-drawing AI task");
    assert.equal(exec.provider, "gemini-chat");
    assert.equal(exec.model, "gemini-flash::medium");
    assert.equal(exec.strictProvider, false);
    assert.equal(exec.singleResponse, true);
    assert.equal(exec.allowFallback, true);
    assert.ok(prompt.includes("COMPLETE MOTION IN THIS DRAWING RESPONSE"));
    assert.ok(prompt.includes(JSON.stringify(script.beats[0].motionIntent)), "The exact movement written with the script reaches every covered scene request");
    assert.ok(prompt.includes(`PLANNER-${profile}-`), "The scene planner's complete action direction reaches drawing unchanged too");
    assert.ok(!prompt.includes("a separate motion step animates"));
    assert.ok(!prompt.includes("keep feet, seated bodies and garment bases still"));
    active++;
    peak = Math.max(peak, active);
    await delay(35);
    active--;
    const raw = art();
    if (fail) raw.animations[0].target = "missing_target";
    if (rigid > 0) {
      // Only the whole body slides: renderable but fails the "parts move" checklist item.
      rigid--;
      raw.animations = [raw.animations[0]];
    }
    return raw;
  };
  const opts: any = { exec: { provider: "gemini-chat", model: "gemini-flash::medium", allowFallback: true }, mainExec: { provider: "gemini-chat", model: "gemini-flash::low" }, review: true, scope: `once-${profile}`, log: (line: string) => logs.push(line), renderBehavior: behavior, partial: (value: any) => (latest = value), ai };
  const generated = await buildRemotionScenes(script, analysis, opts),
    state = generated.gen!.remotion!,
    scenes = Object.values(state.scenes).flat();
  assert.equal(scenes.length, 6);
  assert.equal(calls.filter((a) => a === C.ARTIFACT).length, 6);
  assert.equal(peak, 5);
  for (const scene of scenes) {
    assert.equal(scene.build?.review, false);
    assert.equal(scene.generation?.status, "accepted");
    assert.equal(scene.generation?.promptRevision, MOTION_SCENE_ACTION_REVISION);
    assert.ok(scene.generation?.requestKey?.endsWith(`:action-${MOTION_SCENE_ACTION_REVISION}`));
    assert.equal(scene.composition?.animationSource, "ai-complete");
    assert.deepEqual(scene.composition!.animations, art().animations);
    assert.deepEqual(motionActorTracks(scene.composition!, 720), art().animations);
    assert.equal(scene.composition!.motion, undefined);
    assert.ok(remotionSceneReadiness(scene, state).preview!.duration > 1);
  }
  assert.equal(remotionStoryBuildStatus(generated, analysis), "ready");
  compileRemotionStory(generated, analysis, { renderBehavior: behavior });
  const before = calls.length;
  await buildRemotionScenes(generated, analysis, opts);
  assert.equal(calls.length, before, "Resume keeps all accepted scenes");
  const olderPolicy = structuredClone(generated);
  for (const scene of olderPolicy.gen!.remotion!.scenes.beat) {
    scene.generation = { revision: 1, inputKey: scene.composition!.inputKey, status: "accepted", promptRevision: 0, requestKey: "pre-policy-request" };
  }
  const preserved = await buildRemotionScenes(olderPolicy, analysis, { ...opts, scope: `old-policy-${profile}` });
  assert.equal(calls.length, before, "A prompt-policy upgrade must not regenerate accepted older artwork");
  assert.equal(preserved.gen!.remotion!.scenes.beat[0].generation?.promptRevision, 0, "Reuse preserves the actual provenance, not the latest policy number");
  const oldFailed = structuredClone(olderPolicy),
    olderScene = oldFailed.gen!.remotion!.scenes.beat[0];
  olderScene.generation = { ...olderScene.generation!, status: "failed", error: "Retained pre-policy response" };
  olderScene.build = { ...olderScene.build!, status: "failed", error: "Retained pre-policy response" };
  const resumedFailed = await buildRemotionScenes(oldFailed, analysis, { ...opts, scope: `old-failed-policy-${profile}` });
  assert.equal(calls.length, before + 1, "A failed scene with budget left is redrawn once on resume; accepted scenes stay");
  assert.equal(resumedFailed.gen!.remotion!.scenes.beat[0].generation?.status, "accepted");
  const afterResume = calls.length;
  fail = true;
  const target = scenes[2];
  await assert.rejects(buildRemotionScenes(generated, analysis, { ...opts, onlyScenes: [target.id] }));
  assert.equal(calls.length, afterResume + 3, "Unrenderable answers use the full budget: first draw + 2 rewrites, never more");
  assert.equal(latest.gen.remotion.scenes.beat[2].generation.status, "failed");
  assert.equal(latest.gen.remotion.scenes.beat[2].generation.attempts, 3);
  const failedCalls = calls.length;
  await assert.rejects(buildRemotionScenes(latest, analysis, opts));
  assert.equal(calls.length, failedCalls, "Continuation must not redraw an exhausted scene");
  fail = false;
  const repaired = await buildRemotionScenes(latest, analysis, { ...opts, onlyScenes: [target.id] });
  assert.equal(calls.length, failedCalls + 1, "Explicit regenerate remains available and only targets one scene");
  assert.equal(repaired.gen!.remotion!.scenes.beat[2].generation?.status, "accepted");
  assert.equal(repaired.gen!.remotion!.scenes.beat[2].generation?.score, 100);
  // Rigid answer first, correct rewrite second: stops after 2 requests and keeps the passing answer.
  rigid = 1;
  const rewriteStart = calls.length;
  const rewritten = await buildRemotionScenes(repaired, analysis, { ...opts, onlyScenes: [target.id] });
  assert.equal(calls.length, rewriteStart + 2, "A failed checklist triggers one in-room rewrite, then stops when it passes");
  assert.equal(rewritten.gen!.remotion!.scenes.beat[2].generation?.score, 100);
  assert.ok(logs.some((line) => line.includes("AI sửa theo danh sách lỗi")));
  assert.ok(prompts.at(-1)!.includes("REVISION REQUEST") && prompts.at(-1)!.includes("COMPLETE MOTION IN THIS DRAWING RESPONSE"), "The rewrite is self-contained so any of the 5 rooms can take it");
  // Three rigid answers: budget exhausted, best answer kept with warnings, production continues.
  rigid = 3;
  const bestStart = calls.length;
  const kept = await buildRemotionScenes(rewritten, analysis, { ...opts, onlyScenes: [target.id] });
  assert.equal(calls.length, bestStart + 3, "Never more than 3 content requests per scene");
  const keptScene = kept.gen!.remotion!.scenes.beat[2];
  assert.equal(keptScene.generation?.status, "accepted");
  assert.ok((keptScene.generation?.score || 0) < 100 && keptScene.generation?.warnings?.length, "Best answer kept with its checklist warnings");
  assert.equal(keptScene.composition!.animations.length, 1, "Kept answer is stored verbatim; code adds no motion");
  assert.equal(remotionStoryBuildStatus(kept, analysis), "ready", "A scene below threshold never blocks the video");
  rigid = 0;
  const frozen = calls.length;
  const off = await buildRemotionScenes(repaired, analysis, { ...opts, renderBehavior: { ...behavior, actors: "fixed", sceneEffects: "off" } });
  assert.equal(calls.length, frozen);
  const c = off.gen!.remotion!.scenes.beat[0].composition!,
    a = off.gen!.remotion!.assets[c.assetKey];
  assert.equal(compositionFrameSvg(a, c, 0.5, { ...behavior, actors: "fixed" }, new Set()), a.svg);
  accepted += scenes.length;
}
const raw = art(),
  built = normalizeSceneComposition(raw, "test", "test", "", [node], new Set(), 1280, 720, true);
built.composition.duration = 2;
assert.equal(compositionFrameSvg(built.asset, built.composition, 1, behavior, new Set(), "history", 4), compositionFrameSvg(built.asset, built.composition, 0.5, behavior, new Set(), "history", 2), "Authored time maps consistently to final voice duration");
assert.notEqual(compositionFrameSvg(built.asset, built.composition, 1 / 30, behavior, new Set(), "history", 2), compositionFrameSvg(built.asset, built.composition, 2 / 30, behavior, new Set(), "history", 2), "New keyframes render every output frame, not a 15fps quantized cache");
assert.throws(() => normalizeSceneComposition({ ...raw, animations: [{ ...raw.animations[0], target: "absent" }] }, "bad", "bad", "", [node], new Set(), 1280, 720, true), "Invalid animation is reported, never silently dropped");
assert.throws(
  () =>
    normalizeSceneComposition(
      {
        ...raw,
        animations: [
          {
            ...raw.animations[0],
            keyframes: [
              { at: 0, value: "translate(0 0)" },
              { at: 1, value: "translate(20 0)" },
            ],
          },
        ],
      },
      "bad-loop",
      "bad-loop",
      "",
      [node],
      new Set(),
      1280,
      720,
      true,
    ),
  /Có period nhưng giá trị keyframe cuối khác/,
  "A broken loop reports the actual period error, without blaming speech/anatomy",
);
const legacy = { ...built.composition, animationSource: undefined };
assert.notDeepEqual(motionActorTracks(legacy, 720), raw.animations, "Legacy rendering keeps its existing interpretation");
const namedRaw = {
  ...art(),
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character", entityId: "person" },
  ],
};
const named = normalizeSceneComposition(namedRaw, "named", "named", "", [{ ...node, anonymous: false, entityId: "traveller" }], new Set(["traveller"]), 1280, 720, true);
assert.equal(named.composition.layers[1].entityId, "traveller", "A render-group ID is mapped to the canonical entity by the exact source node");
assert.equal(namedRaw.layers[1].entityId, "person", "The original response is retained verbatim");
assert.deepEqual(named.composition.animations, namedRaw.animations);
const symbolRaw = {
  ...art(),
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character" },
  ],
};
const symbol = normalizeSceneComposition(symbolRaw, "symbol", "symbol", "Map symbol", [{ ...node, kind: "prop", anonymous: false }], new Set(), 1280, 720, true);
assert.equal(symbol.composition.layers[1].kind, "prop", "A symbolic marker is mapped to its exact source prop node rather than rejected as a missing cast member");
assert.deepEqual(symbol.composition.animations, symbolRaw.animations, "Canonical metadata does not rewrite animation");
assert.equal(symbolRaw.layers[1].kind, "character", "The original AI response remains unchanged");
process.stdout.write(`${JSON.stringify({ pass: true, profiles: 3, acceptedScenes: accepted, peakDrawingWorkers: 5, maxRequestsPerScene: 3, selfContainedRewrite: true, keepBest: true, resume: true, manualRegenerate: true, animationPreserved: true, fixedAndEffects: true })}\n`);
