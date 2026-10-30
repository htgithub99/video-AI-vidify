import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-single-draw-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
const priorData = process.env.APP_DATA_DIR;
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.js");
const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.js");
const { remotionStoryBuildStatus } = await import("../src/features/motion/server/services/remotion/sceneKeys.js");
const { remotionStoryRecoveryPending } = await import("../src/features/motion/server/services/remotion/sceneKeys.js");
const { remotionSceneProgress } = await import("../src/features/motion/lib/motionRemotionProgress.js");
const { normalizeFirstSceneComposition } = await import("../src/lib/motionSceneComposition.js");
const { validateRemotionSpec } = await import("../src/lib/motionRemotion.js");
const { puppetBeatLines } = await import("../src/lib/motionPuppet.js");
const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.js");
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
const node: any = { id: "person", kind: "character", entityId: "guest", description: "guest", pose: "standing", slot: "right", evidence: "Người khách đứng cạnh cửa." };
const design = { camera: "wide", placements: [{ id: "person", box: { x: 0.3, y: 0.2, width: 0.1, height: 0.5 }, depth: 1, construction: "person on floor" }] };
const art = () => ({
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="room"><rect width="1280" height="720" fill="#303741"/></g><g id="person"><rect x="384" y="144" width="128" height="360" fill="#605d76"/></g></svg>',
  design,
  layers: [
    { id: "room", kind: "background" },
    { id: "person", kind: "character", entityId: "guest" },
  ],
  animations: [],
});
const context = (prompt: string) => JSON.parse(prompt.slice(prompt.lastIndexOf("Context:\n") + "Context:\n".length).split("\n")[0]);
const script: any = {
  title: "One drawing request",
  language: "vi",
  visualSettings: settings,
  beats: [{ id: "b1", chapterId: "c1", visual: "scene", place: "house", narration: "Người khách đứng cạnh cửa. Bên trong có ánh đèn. Ngoài sân trời mưa. Người khách quay về.", utterances: ["Người khách đứng cạnh cửa.", "Bên trong có ánh đèn.", "Ngoài sân trời mưa.", "Người khách quay về."].map((text, i) => ({ id: `u${i}`, text, speaker: "narrator", role: "narration" })) }],
};
const analysis: any = { title: script.title, visualSettings: settings, era: "rural Vietnam", cast: [{ key: "guest", name: "Khách" }], places: [{ key: "house", name: "Nhà" }], chapters: [{ id: "c1", targetSeconds: 12 }] };
const lines = puppetBeatLines(script.beats[0]);
assert.equal(lines.length, 4);
const plan = () => ({ scenes: lines.map((line, i) => ({ fromLineId: line.key, toLineId: line.key, purpose: `shot${i}`, environment: "old house", nodes: [node] })) });
try {
  let calls: { artifact: string; purpose?: string; exec?: any; reference?: string }[] = [];
  let active = 0;
  let peak = 0;
  let anchorFinished = false;
  let geometryCalls = 0;
  const opts: any = {
    scope: "single-draw",
    exec: { provider: "drawing-ai" },
    mainExec: { provider: "content-ai" },
    review: false,
    renderBehavior: { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" },
    log: () => {},
    geometry: {
      check: async () => {
        geometryCalls++;
        throw new Error("Review off must not measure geometry");
      },
    },
    ai: async (prompt: string, artifact: string, exec: any) => {
      if (artifact === V.ARTIFACT_SCENE) {
        calls.push({ artifact, exec });
        return plan();
      }
      assert.equal(artifact, C.ARTIFACT);
      assert.equal(exec.singleResponse, true);
      assert.equal(exec.strictProvider, true);
      assert.equal(exec.provider, "drawing-ai");
      const data = context(prompt);
      assert.ok(prompt.includes("design, svg, layers, animations"));
      assert.equal(data.renderBehavior.actors, "simple");
      const purpose = data.scene.purpose;
      calls.push({ artifact, exec, purpose, reference: data.continuity?.svg });
      if (purpose !== "shot0") {
        assert.equal(anchorFinished, true);
        assert.ok(data.continuity?.svg);
      }
      active++;
      peak = Math.max(peak, active);
      await delay(20);
      active--;
      if (purpose === "shot0") anchorFinished = true;
      return purpose === "shot1" ? { svg: "broken", layers: [] } : art();
    },
  };
  const generated = await buildRemotionScenes(script, analysis, opts);
  assert.equal(calls.filter((call) => call.artifact === C.ARTIFACT).length, 5);
  assert.equal(calls.filter((call) => call.artifact === V.ARTIFACT_SCENE).length, 1);
  assert.equal(calls[0].exec.provider, "content-ai");
  assert.equal(geometryCalls, 0);
  assert.ok(peak > 1 && peak <= 3);
  const scenes = generated.gen!.remotion!.scenes.b1;
  assert.deepEqual(
    scenes.map((scene) => scene.build?.status),
    ["accepted", "failed", "accepted", "accepted"],
  );
  assert.equal(remotionStoryBuildStatus(generated, analysis), "partial");
  assert.deepEqual(generated.gen!.failed, [scenes[1].id]);
  assert.equal(scenes[1].build?.attempts, 2);
  assert.equal(remotionStoryRecoveryPending(generated), false);
  const legacyFailed = structuredClone(generated);
  delete legacyFailed.gen!.remotion!.scenes.b1[1].build!.attempts;
  assert.equal(remotionStoryRecoveryPending(legacyFailed), true, "Old failed scenes receive their deferred recovery on resume");
  const progress = remotionSceneProgress(generated);
  assert.equal(progress.ready, 3);
  assert.equal(progress.total, 4);
  assert.equal(progress.entries[1].status, "failed");
  assert.ok(progress.entries[1].preview);
  const compiled = compileRemotionStory(generated, analysis, { durations: [12], fps: 30 });
  assert.equal(compiled.spec.scenes.length, 4);
  assert.equal(compiled.spec.scenes.at(-1)!.endFrame, Math.ceil(compiled.spec.duration * 30));
  assert.ok(compiled.spec.assets[scenes[1].composition!.assetKey].svg.includes(C.PLACEHOLDER));
  validateRemotionSpec(compiled.spec);
  assert.equal(Object.keys(generated.gen!.remotion!.failures).length, 0);
  const beforeResume = calls.length;
  const resumed = await buildRemotionScenes(generated, analysis, opts);
  assert.equal(calls.length, beforeResume);
  assert.equal(resumed.gen!.remotion!.scenes.b1[1].build!.status, "failed");
  const restarted = await buildRemotionScenes(generated, analysis, { ...opts, restart: true });
  assert.equal(calls.slice(beforeResume).filter((call) => call.artifact === V.ARTIFACT_SCENE).length, 1, "Restart must discard the saved scene plan");
  assert.equal(calls.slice(beforeResume).filter((call) => call.artifact === C.ARTIFACT).length, 5, "Restart must redraw all four scenes including the deferred retry");
  assert.notEqual(restarted.gen!.remotion!.scenes, generated.gen!.remotion!.scenes);
  assert.deepEqual(restarted.beats, generated.beats, "Restart must preserve the narrative");
  const switched = await buildRemotionScenes(generated, analysis, {
    ...opts,
    onlyBeats: ["b1"],
    scope: "failed-policy-switch",
    review: true,
    geometry: { check: async () => [] },
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "offline fixture");
    },
    ai: async (_prompt: string, artifact: string) => {
      assert.equal(artifact, V.ARTIFACT_REVIEW);
      return { ok: true, issues: [] };
    },
    renderBehavior: { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" },
  });
  assert.equal(switched.gen!.remotion!.scenes.b1[1].build!.status, "failed");
  const otherScenes = scenes.filter((_, i) => i !== 1).map((scene) => structuredClone(scene));
  calls = [];
  const repaired = await buildRemotionScenes(resumed, analysis, {
    ...opts,
    onlyScenes: [scenes[1].id],
    note: "keep this scene only",
    ai: async (prompt: string, artifact: string) => {
      calls.push({ artifact });
      assert.equal(context(prompt).scene.purpose, "shot1");
      return art();
    },
  });
  assert.deepEqual(
    calls.map((call) => call.artifact),
    [C.ARTIFACT],
  );
  assert.deepEqual(
    repaired.gen!.remotion!.scenes.b1.filter((_, i) => i !== 1),
    otherScenes,
  );
  assert.equal(repaired.gen!.remotion!.scenes.b1[1].build!.status, "accepted");
  const beforeSecondResume = calls.length;
  await buildRemotionScenes(repaired, analysis, {
    ...opts,
    ai: async () => {
      throw new Error("No drawing after manual regeneration");
    },
  });
  assert.equal(calls.length, beforeSecondResume);
  const { MOTION_SOUND_CONFIG: soundConfig } = await import("../src/constants/motionSound.js");
  assert.equal(repaired.gen?.soundPlanVersion, undefined, "SFX off never pretends to have a current sound plan");
  let soundCalls = 0;
  const soundOpts = {
    ...opts,
    sfx: true,
    ai: async (_prompt: string, artifact: string, exec: any) => {
      assert.equal(artifact, soundConfig.ARTIFACT, "Enabling SFX on completed images must not draw again");
      assert.equal(exec.provider, "content-ai");
      soundCalls++;
      return { beats: [{ id: "b1", soundEvents: [{ id: "knock", kind: "door", at: 0.5, source: "offscreen" }] }] };
    },
  };
  const withSound = await buildRemotionScenes(repaired, analysis, soundOpts);
  assert.equal(soundCalls, 1);
  assert.equal(withSound.gen!.soundPlanVersion, soundConfig.VERSION);
  assert.equal(compileRemotionStory(withSound, analysis, { durations: [12] }).sfxCues[0]?.kind, "door");
  await buildRemotionScenes(withSound, analysis, soundOpts);
  await buildRemotionScenes(withSound, analysis, { ...soundOpts, sfx: false });
  assert.equal(soundCalls, 1, "SFX cache and off both avoid additional AI calls");
  for (const result of [undefined, {}, { svg: "" }, { ...art(), svg: art().svg.replace("</svg>", "<script>alert(1)</script></svg>") }, { ...art(), svg: art().svg.replace("</svg>", '<image href="https://example.com/x.png"/></svg>') }]) {
    assert.throws(() => normalizeFirstSceneComposition(result, "bad", "bad", "", [node], new Set(["guest"]), 1280, 720));
  }
  const metadata = normalizeFirstSceneComposition({ ...art(), layers: [], design: { camera: {} }, animations: [{ target: "person", attribute: "onclick" }] }, "accepted", "accepted", "", [node], new Set(["guest"]), 1280, 720);
  assert.equal(metadata.composition.animations.length, 0);
  assert.equal(metadata.composition.design, undefined);
  assert.ok(metadata.asset.svg.includes('fill="#605d76"'));
  const fitted = normalizeFirstSceneComposition({ ...art(), svg: art().svg.replace("0 0 1280 720", "10 20 640 360") }, "fit", "fit", "", [node], new Set(["guest"]), 1280, 720);
  assert.equal(fitted.asset.width, 1280);
  assert.equal(fitted.asset.height, 720);
  assert.ok(fitted.asset.svg.includes('viewBox="10 20 640 360"'));
  assert.ok(fitted.asset.svg.includes('preserveAspectRatio="xMidYMid meet"'));
  let reviewCalls = 0;
  let drawCalls = 0;
  const reviewed = await buildRemotionScenes(script, analysis, {
    ...opts,
    scope: "review-on",
    review: true,
    renderBehavior: { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" },
    geometry: { check: async () => [] },
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "offline fixture");
    },
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_SCENE) return plan();
      if (artifact === V.ARTIFACT_REVIEW) {
        reviewCalls++;
        return { ok: true, issues: [] };
      }
      assert.equal(artifact, C.ARTIFACT);
      drawCalls++;
      return art();
    },
  });
  assert.equal(reviewCalls, 4);
  assert.equal(drawCalls, 4);
  assert.ok(reviewed.gen!.remotion!.scenes.b1.every((scene) => scene.reviewKey && scene.build?.status === "accepted"));
  const reviewOptions = {
    ...opts,
    scope: "review-budget",
    review: true,
    renderBehavior: { version: 1 as const, actors: "fixed" as const, sceneEffects: "off" as const, camera: "fixed" as const },
    geometry: { check: async () => [] },
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "offline fixture");
    },
  };
  const failedReview = await buildRemotionScenes(script, analysis, {
    ...reviewOptions,
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_SCENE) return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "whole scene", environment: "old house", nodes: [node] }] };
      if (artifact === V.ARTIFACT_REVIEW) return {};
      return art();
    },
  });
  assert.equal(failedReview.gen!.remotion!.scenes.b1[0].build!.status, "accepted");
  assert.equal(failedReview.gen!.remotion!.scenes.b1[0].build!.review, false);
  assert.equal(failedReview.gen!.remotion!.scenes.b1[0].reviewKey, undefined);
  const retriedReview = await buildRemotionScenes(failedReview, analysis, { ...reviewOptions, onlyScenes: [failedReview.gen!.remotion!.scenes.b1[0].id], ai: async (_prompt: string, artifact: string) => (artifact === V.ARTIFACT_REVIEW ? { ok: true, issues: [] } : art()) });
  assert.equal(retriedReview.gen!.remotion!.scenes.b1[0].build!.status, "accepted");
  let patches = 0;
  const moving = await buildRemotionScenes(repaired, analysis, {
    ...opts,
    scope: "review-motion",
    review: true,
    geometry: { check: async () => [] },
    still: async (_spec: unknown, file: string) => {
      fs.writeFileSync(file, "offline fixture");
    },
    ai: async (prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_REVIEW) return { ok: true, issues: [] };
      patches++;
      throw new Error(`Unexpected motion-only request: ${artifact} ${prompt.slice(0, 80)}`);
    },
  });
  assert.equal(patches, 0);
  for (const scene of moving.gen!.remotion!.scenes.b1) {
    assert.equal(scene.composition!.animations.length, 1);
    const old = repaired.gen!.remotion!.scenes.b1.find((item) => item.id === scene.id)!;
    assert.equal(moving.gen!.remotion!.assets[scene.composition!.assetKey].svg, repaired.gen!.remotion!.assets[old.composition!.assetKey].svg);
  }
  for (const failure of ["anchor", "all", "transport"]) {
    let drawings = 0;
    const continued = await buildRemotionScenes(script, analysis, {
      ...opts,
      scope: failure,
      ai: async (prompt: string, artifact: string) => {
        if (artifact === V.ARTIFACT_SCENE) return plan();
        assert.equal(artifact, C.ARTIFACT);
        drawings++;
        const purpose = context(prompt).scene.purpose;
        if (failure === "transport") throw new Error("provider unavailable");
        if (failure === "all" || purpose === "shot0") return { svg: "broken" };
        return art();
      },
    });
    assert.equal(drawings, failure === "anchor" ? 5 : 8);
    assert.equal(remotionStoryBuildStatus(continued, analysis), "partial");
    assert.equal(remotionSceneProgress(continued).ready, failure === "anchor" ? 3 : 0);
    validateRemotionSpec(compileRemotionStory(continued, analysis, { durations: [12] }).spec);
  }
  for (const profileId of ["horror", "history", "explainer"] as const) {
    for (const review of [false, true]) {
      const scopedSettings = { ...settings, profileId };
      let draws = 0;
      let reviews = 0;
      const accepted = await buildRemotionScenes(
        { ...script, visualSettings: scopedSettings },
        { ...analysis, visualSettings: scopedSettings },
        {
          ...opts,
          scope: `tolerant-${profileId}-${review}`,
          review,
          renderBehavior: { version: 1, actors: "fixed", sceneEffects: "gentle", camera: "fixed" },
          geometry: {
            check: async () => {
              throw new Error("Optional geometry service unavailable");
            },
          },
          still: async (_spec: unknown, file: string) => {
            fs.writeFileSync(file, "offline fixture");
          },
          ai: async (_prompt: string, artifact: string) => {
            if (artifact === V.ARTIFACT_SCENE) return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "whole scene", environment: "room", nodes: [node] }] };
            if (artifact === V.ARTIFACT_REVIEW) {
              reviews++;
              return { ok: true, issues: [] };
            }
            draws++;
            return {
              ...art(),
              svg: art().svg.replace('id="person"', 'id="visible_person"'),
              design: { camera: "wide", placements: [{ id: "person", box: { x: 384, y: 144, width: 128, height: 360 }, depth: 1, construction: "pixel metadata" }] },
              animations: [
                {
                  target: "missing_motion_target",
                  channel: "effect",
                  attribute: "opacity",
                  keyframes: [
                    { at: 0, value: 0 },
                    { at: 1, value: 1 },
                  ],
                },
              ],
            };
          },
        },
      );
      assert.equal(draws, 1);
      assert.equal(reviews, review ? 1 : 0);
      const scene = accepted.gen!.remotion!.scenes.b1[0];
      assert.equal(scene.build?.status, "accepted");
      assert.equal(scene.composition!.design, undefined);
      assert.equal(scene.composition!.animations.length, 0);
      validateRemotionSpec(compileRemotionStory(accepted, { ...analysis, visualSettings: scopedSettings }, { durations: [12] }).spec);
    }
  }
  for (const profileId of ["horror", "history", "explainer"] as const) {
    const counts = new Map<string, number>();
    const finished = new Set<string>();
    const logs: string[] = [];
    const scopedSettings = { ...settings, profileId };
    const recovered = await buildRemotionScenes(
      { ...script, visualSettings: scopedSettings },
      { ...analysis, visualSettings: scopedSettings },
      {
        ...opts,
        scope: `deferred-${profileId}`,
        log: (message: string) => logs.push(message),
        ai: async (prompt: string, artifact: string) => {
          if (artifact === V.ARTIFACT_SCENE) return plan();
          assert.equal(artifact, C.ARTIFACT, "Review off never sends a critique/repair task");
          const purpose = context(prompt).scene.purpose;
          const count = (counts.get(purpose) || 0) + 1;
          counts.set(purpose, count);
          if (count > 1) assert.equal(finished.size, 4, "No deferred request before the first pass finishes");
          await delay(5);
          finished.add(purpose);
          if (purpose === "shot1" && count === 1) throw new Error("Transient drawing failure");
          const result = art();
          if (purpose === "shot0") result.svg = result.svg.replace(/<\/g><\/svg>$/, "</svg>");
          return result;
        },
      },
    );
    assert.deepEqual([...counts.values()].sort(), [1, 1, 1, 2]);
    assert.deepEqual(recovered.gen!.failed, []);
    assert.equal(remotionStoryBuildStatus(recovered, { ...analysis, visualSettings: scopedSettings }), "ready");
    assert.ok(logs.includes(C.LOG_LOCAL_REPAIR(1, 4)), "A locally repaired scene must be logged with its scene index");
    assert.ok(logs.some((message) => message.includes("bắt đầu phục hồi 1 cảnh lỗi")));
    const prior = [...counts];
    await buildRemotionScenes(
      recovered,
      { ...analysis, visualSettings: scopedSettings },
      {
        ...opts,
        scope: `deferred-${profileId}`,
        ai: async () => {
          throw new Error("Completed scenes must be cached");
        },
      },
    );
    assert.deepEqual([...counts], prior);
  }
  let recoveryInterrupted = false;
  const resumeCounts = new Map<string, number>();
  const resumeOptions = {
    ...opts,
    scope: "resume-deferred",
    log: (message: string) => {
      if (!recoveryInterrupted && message.includes("bắt đầu phục hồi")) {
        recoveryInterrupted = true;
        throw new Error("Interrupted between passes");
      }
    },
    ai: async (prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_SCENE) return plan();
      const purpose = context(prompt).scene.purpose;
      const count = (resumeCounts.get(purpose) || 0) + 1;
      resumeCounts.set(purpose, count);
      return purpose === "shot1" && count === 1 ? { svg: "broken" } : art();
    },
  };
  await assert.rejects(buildRemotionScenes(script, analysis, resumeOptions), /Interrupted between passes/);
  const fromCheckpoint = await buildRemotionScenes(script, analysis, resumeOptions);
  assert.deepEqual(fromCheckpoint.gen!.failed, []);
  assert.deepEqual([...resumeCounts.values()].sort(), [1, 1, 1, 2]);
  let criticalCalls = 0;
  const critical = await buildRemotionScenes(script, analysis, {
    ...reviewOptions,
    scope: "critical-review-budget",
    ai: async (_prompt: string, artifact: string) => {
      if (artifact === V.ARTIFACT_SCENE) return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: "whole scene", environment: "room", nodes: [node] }] };
      criticalCalls++;
      return artifact === V.ARTIFACT_REVIEW ? { ok: false, issues: ["wrong visible person"], checks: [{ ok: false, category: "identity", evidence: "The visible person differs from the requested identity", problem: "wrong visible person" }] } : art();
    },
  });
  assert.ok(criticalCalls <= C.REVIEW_REQUESTS * C.DRAW_ATTEMPTS);
  assert.equal(critical.gen!.remotion!.scenes.b1[0].build?.status, "failed");
  assert.ok(critical.gen!.remotion!.assets[critical.gen!.remotion!.scenes.b1[0].composition!.assetKey].svg.includes('id="person"'));
  validateRemotionSpec(compileRemotionStory(critical, analysis, { durations: [12] }).spec);
  const aborted = new AbortController();
  aborted.abort(new Error("cancelled"));
  await assert.rejects(() => buildRemotionScenes(script, analysis, { ...opts, signal: aborted.signal }), /cancelled/);
  console.log("Single drawing: one response, no review/repair when off, shared anchor concurrency, isolated failures, safe placeholder compilation, zero-request resume, scene-only regeneration and optional review passed; no live AI or video render.");
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = priorData;
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(root).startsWith("motion-single-draw-"));
  fs.rmSync(root, { recursive: true, force: true });
}
