import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mergeRemotionSceneDraft } from "../src/features/motion/server/services/remotion/sceneContract.js";
import { MOTION_REMOTION_PROMPTS as P } from "../src/constants/motionRemotionPrompts.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CHAT } from "../src/constants/cinematicConstants.js";
import { motionPromptEditorialContext } from "../src/lib/motionPrompt.js";
const lines = [{ key: "l1", text: "Quân lính đứng cạnh thuyền." }];
const cast = new Set(["commander"]);
const soldier = { id: "roman_infantry", kind: "character", entityId: "roman_infantry", description: "Roman infantry formation with red shields", slot: "left" };
const row = (nodes: any[]) => ({ fromLineId: "l1", toLineId: "l1", purpose: "Soldiers by boat", environment: "Riverbank", nodes });
const checked = mergeRemotionSceneDraft({ scenes: [row([soldier])] }, [], lines, cast);
assert.deepEqual(checked.errors, []);
assert.equal(checked.accepted[0].nodes[0].anonymous, true);
assert.equal(checked.accepted[0].nodes[0].entityId, undefined);
const named = { ...soldier, id: "commander", entityId: undefined };
assert.equal(mergeRemotionSceneDraft({ scenes: [row([named])] }, [], lines, cast).accepted[0].nodes[0].entityId, "commander");
const wrong = { ...soldier, id: "wrong_person", entityId: "unknown_person" };
const rejected = mergeRemotionSceneDraft({ scenes: [row([wrong])] }, [], lines, cast);
assert.ok(rejected.errors.some((error) => error.includes("entityId")));
assert.ok(!rejected.errors.includes(P.INVALID_RANGE), "A valid source range must not be blamed for rejected people");
const fixed = mergeRemotionSceneDraft({ scenes: [row([{ ...soldier, id: "corrected_formation" }])] }, rejected.drafts, lines, cast);
assert.deepEqual(fixed.errors, []);
assert.equal(fixed.accepted[0].nodes.length, 1, "A complete corrected nodes list replaces stale nodes");
assert.equal(fixed.accepted[0].nodes[0].id, "corrected_formation");
const inflated = row(Array.from({ length: 26 }, (_, i) => ({ ...wrong, id: `stale_${i}` })));
assert.deepEqual(mergeRemotionSceneDraft({ scenes: [row([soldier])] }, [inflated], lines, cast).errors, []);
const beside = row([
  { id: "commander", entityId: "commander", kind: "character", description: "Commander", slot: "left", relation: "beside", target: "boat" },
  { id: "boat", kind: "prop", description: "Wooden boat", slot: "right", relation: "beside", target: "commander" },
]);
assert.deepEqual(mergeRemotionSceneDraft({ scenes: [beside] }, [], lines, cast).errors, []);
const attachmentLoop = { ...beside, nodes: beside.nodes.map((node) => ({ ...node, relation: "inside" })) };
assert.ok(mergeRemotionSceneDraft({ scenes: [attachmentLoop] }, [], lines, cast).errors.some((error) => error.includes("cyclic")));
const twoLines = [...lines, { key: "l2", text: "Thuyền rời bến." }];
const preserved = { ...row([soldier]), fromLineId: "l2", toLineId: "l2" };
const scoped = mergeRemotionSceneDraft({ scenes: [row([soldier])] }, [row([wrong]), preserved], twoLines, cast);
assert.deepEqual(scoped.errors, []);
assert.equal(scoped.accepted.length, 2);
const joined = mergeRemotionSceneDraft({ scenes: [{ ...row([soldier]), toLineId: "l2" }] }, scoped.drafts, twoLines, cast);
assert.deepEqual(joined.errors, []);
assert.equal(joined.accepted.length, 1, "Replacing a range removes contained obsolete rows");
assert.ok(mergeRemotionSceneDraft({ scenes: [row([soldier])] }, [], twoLines, cast).errors.includes(P.INVALID_RANGE));
const repair = P.REPAIR({ lines: twoLines.map(({ key, text }) => ({ id: key, text })), beats: ["large redundant beat data"], cast: [{ key: "commander" }] }, { scenes: [row([wrong]), preserved] }, rejected.errors);
assert.ok(!repair.includes("large redundant beat data"));
assert.ok(!repair.includes("Thuyền rời bến."), "Repair context includes only the rejected range");
assert.ok(!repair.includes('"fromLineId":"l2"'));
assert.equal(motionPromptEditorialContext("motion_remotion_scene", "unrelated complete source"), "");
for (const message of ["Chúng tôi đang kiểm tra nhanh để ChatGPT luôn ổn định. Thử lại trong 17 phút.", "Chúng tôi đang kiểm tra nhanh để ChatGPT luôn ổn định.\nThử lại sau 5 phút.", "A quick check to keep ChatGPT stable. Try again in 17 minutes."]) assert.ok(CHAT.CHATGPT_RATE_LIMIT_PATTERN.test(message));
assert.ok(!CHAT.CHATGPT_RATE_LIMIT_PATTERN.test("ChatGPT đã tạo xong phân cảnh."));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-plan-recovery-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
const priorData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
try {
  const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.js");
  const { puppetBeatLines } = await import("../src/lib/motionPuppet.js");
  const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
  const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.js");
  const { validateSceneComposition } = await import("../src/lib/motionSceneComposition.js");
  for (const profileId of ["horror", "history", "explainer"] as const) {
    const settings = { version: 1, mode: "remotion", engine: "remotion", profileId, componentRevision: 1 };
    const script: any = {
      title: "Independent plans",
      language: "vi",
      visualSettings: settings,
      beats: [
        { id: "b1", chapterId: "c1", place: "river", visual: "scene", narration: lines[0].text },
        { id: "b2", chapterId: "c1", place: "village", visual: "scene", narration: "Người dân chờ ở làng." },
      ],
    };
    const analysis: any = {
      title: script.title,
      visualSettings: settings,
      cast: [],
      places: [
        { key: "river", name: "Bến sông" },
        { key: "village", name: "Làng" },
      ],
      chapters: [],
    };
    let firstDrawn!: () => void;
    const drawingStarted = new Promise<void>((resolve) => {
      firstDrawn = resolve;
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let draws = 0,
      reviews = 0,
      plans = 0;
    const options: any = {
      exec: { provider: "drawing-ai" },
      mainExec: { provider: "content-ai" },
      scope: `root-${profileId}`,
      review: false,
      log: () => {},
      renderBehavior: { version: 1, actors: "simple", sceneEffects: "gentle", camera: "gentle" },
      geometry: { check: async () => [] },
      ai: async (prompt: string, artifact: string, exec: any) => {
        const data = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
        if (artifact === V.ARTIFACT_SCENE) {
          plans++;
          assert.equal(exec.provider, "content-ai");
          if (data.beat.id === "b2")
            await Promise.race([
              drawingStarted,
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error("Drawing waited for all plans")), 1500);
              }),
            ]);
          const beat = script.beats.find((beat: any) => beat.id === data.beat.id);
          const source = puppetBeatLines(beat);
          return { scenes: [{ ...row([soldier]), fromLineId: source[0].key, toLineId: source.at(-1)!.key, purpose: beat.id }] };
        }
        if (artifact === V.ARTIFACT_REVIEW) {
          reviews++;
          return { ok: true, issues: [] };
        }
        assert.equal(artifact, C.ARTIFACT);
        assert.equal(exec.provider, "drawing-ai");
        assert.equal(exec.singleResponse, true);
        assert.equal(data.scene.nodes[0].anonymous, true);
        draws++;
        if (data.scene.purpose === "b1") firstDrawn();
        return { svg: '<svg viewBox="0 0 1280 720"><g id="roman_infantry"><path d="M100 100H300V500H100Z" fill="#647050"/></g></svg>', layers: [{ id: "roman_infantry", kind: "character" }], animations: [] };
      },
    };
    let generated: any;
    try {
      generated = await buildRemotionScenes(script, analysis, options);
    } finally {
      clearTimeout(timer);
    }
    assert.equal(plans, 2);
    assert.equal(draws, 2);
    assert.equal(reviews, 0);
    for (const scene of Object.values(generated.gen.remotion.scenes).flat() as any[]) {
      assert.equal(scene.build.status, "accepted");
      assert.ok(scene.composition.layers.some((layer: any) => layer.kind === "character" && layer.anonymous));
      validateSceneComposition(scene.composition, generated.gen.remotion.assets[scene.composition.assetKey], scene.nodes, new Set());
    }
    await buildRemotionScenes(generated, analysis, {
      ...options,
      ai: async () => {
        throw new Error("Cached scenes must not call AI");
      },
    });
    const legacy = structuredClone(generated);
    legacy.gen.remotion.planRecoveryRevision = undefined;
    legacy.gen.remotion.drafts = { corrupted: [inflated] };
    const migrated = await buildRemotionScenes(legacy, analysis, {
      ...options,
      scope: `legacy-${profileId}`,
      ai: async () => {
        throw new Error("Migration must preserve completed scenes");
      },
    });
    assert.deepEqual(migrated.gen!.remotion!.drafts, {});
    assert.equal(migrated.gen!.remotion!.planRecoveryRevision, P.PLAN_RECOVERY_REVISION);
  }
  console.log("Scene plan recovery: replacement, patches, range coverage, anonymous crowds, real attachment cycles, scoped repair, usage limits, incremental drawing, all 3 profiles and cache migration passed.");
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  if (priorData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = priorData;
  fs.rmSync(root, { recursive: true, force: true });
}
