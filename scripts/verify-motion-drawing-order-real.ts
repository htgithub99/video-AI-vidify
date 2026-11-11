import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";

const out = path.resolve("scratch/motion-real-recovery-20261105");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "order-storage");
delete process.env.APP_DATA_DIR;
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { createCompositionGeometryInspector } = await import("../src/features/motion/server/services/remotion/compositionGeometryInspector.ts");
const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { MOTION_VISUAL } = await import("../src/constants/motionVisual.ts");
const { remotionGroupPlanCurrent, remotionPlanGroups } = await import("../src/features/motion/server/services/remotion/sceneKeys.ts");
const manifest = JSON.parse(await fs.readFile(path.join(out, "baseline/manifest.json"), "utf8"));
const original = JSON.parse(await fs.readFile(path.join(out, `baseline/output/motion-video/story-jobs/${manifest.jobId}.json`), "utf8")).job.result;
const analysis = JSON.parse(await fs.readFile("storage/output/motion-video/story-jobs/1060b75f-7a40-4fb8-a19c-1d7d0ea7178d.json", "utf8")).job.result;
await fs.writeFile(path.join(out, "analysis-source.json"), JSON.stringify(analysis, null, 2));
const scenes: any[] = Object.values(original.gen.remotion.scenes).flat();
const failed = scenes.filter((scene) => scene.build?.status === "failed");
assert.equal(scenes.length, 36);
assert.equal(failed.length, 9);
for (const group of remotionPlanGroups(original, analysis, original.gen.remotion)) assert.ok(remotionGroupPlanCurrent(group.beats, analysis, original.gen.remotion), "Use the original actual plan without fabricated source keys");
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
const pages = await Promise.all(Array.from({ length: 5 }, () => browser.newPage()));
const available = [...pages];
const logs: string[] = [];
const calls: any[] = [];
let active = 0, peak = 0;
let latest: any;
let reviewedFrames = 0;
let structural: { sceneId: string; draft: any; supplied: boolean; repairs: number } | undefined;
try {
  const run = async (script: any, targetIds: string[], fail: boolean, review = false) => buildRemotionScenes(script, analysis, {
    exec: { provider: "gemini-chat", model: "gemini-flash::medium", chromeHeadless: false } as any,
    mainExec: { provider: "gemini-chat", model: "gemini-flash::low", chromeHeadless: false } as any,
    onlyScenes: targetIds, review, scope: `order-${fail ? "failed" : "accepted"}-${Date.now()}`,
    geometry: createCompositionGeometryInspector(undefined, { headless: false }),
    still: async (spec, file, frame, signal) => {
      assert.ok(spec.scenes.every((scene: any) => !!scene.composition?.motion), "Review frames must include AI-directed motion, as before the scheduling change");
      await renderRemotionStill(spec, file, frame, signal);
      await fs.copyFile(file, path.join(out, `review-motion-frame-${reviewedFrames++}.png`));
    },
    partial: (value) => { latest = value; }, log: (line) => { logs.push(line); if (/bắt đầu phục hồi|Phục hồi vòng|Vẽ lại cảnh đã hoãn|Đã đủ hình hợp lệ/.test(line)) process.stdout.write(String(line) + "\n"); },
    ai: async (prompt: string, artifact: string) => {
      const scene = scenes.find((item) => prompt.includes(item.text) || prompt.includes(JSON.stringify(item.text).slice(1, -1))) || scenes.find((item) => prompt.includes(item.purpose));
      assert.ok(scene, "Every replay request must map to an actual scene, not invented content");
      calls.push({ scene: scene.id, artifact, promptChars: prompt.length, ready: Object.values(latest?.gen.remotion.scenes || script.gen.remotion.scenes).flat().filter((item: any) => targetIds.includes(item.id) && item.build?.status === "accepted").length });
      const page = available.pop();
      assert.ok(page, "The drawing request pool must not exceed five actual tabs");
      peak = Math.max(peak, ++active);
      try {
        await page.setContent("<h1>Phát lại dữ liệu dự án trên Chrome</h1><pre></pre>");
        await page.locator("pre").evaluate((node, value) => { node.textContent = value; }, `${artifact}\n${scene.id}\n${prompt}`);
        if (fail) throw Object.assign(new Error(scene.build.error), { diagnostics: { lastCandidate: scene.build.error === "chat_planning_refusal_response" ? "Tôi không thể trợ giúp về điều đó, vì tôi chỉ là một mô hình ngôn ngữ nên không có thông tin hoặc khả năng cần thiết." : undefined } });
        const asset = script.gen.remotion.assets[scene.composition.assetKey];
        if (artifact === "motion_remotion_composition") {
          if (structural?.sceneId === scene.id) {
            if (!structural.supplied) { structural.supplied = true; return structuredClone(structural.draft); }
            if (prompt.startsWith("Repair only rejected fields")) {
              assert.ok(prompt.includes(JSON.stringify(structural.draft.svg)), "Targeted structural repair must retain this scene's actual rejected SVG");
              assert.ok(prompt.includes("Thẻ đóng"), "The precise structural error must reach the repair request");
              structural.repairs++;
            }
          }
          return { svg: asset.svg, layers: scene.composition.layers, animations: scene.composition.animations, design: scene.composition.design, continuityNotes: scene.composition.continuityNotes };
        }
        if (artifact === "motion_remotion_motion") {
          assert.equal(calls.at(-1).ready, targetIds.length, "No motion request may start until all selected real scenes have valid pictures");
          assert.ok(scene.composition.motion, "Use this scene's own real motion response");
          return structuredClone(scene.composition.motion);
        }
        if (artifact === MOTION_VISUAL.ARTIFACT_REVIEW) return { ok: true, issues: [], checks: [] };
        throw new Error("Unexpected artifact " + artifact);
      } finally { active--; available.push(page); }
    },
  });
  await assert.rejects(run(structuredClone(original), failed.map((scene) => scene.id), true), /Chưa đủ hình để xuất video/);
  assert.ok(logs.some((line) => line.includes("bắt đầu phục hồi")), "Failed drawings must enter recovery after the first pass");
  assert.ok(!logs.some((line) => /sửa tư thế\/khung: vòng|Đã đủ hình hợp lệ/.test(line)), "Quality and motion stages must wait while drawings are missing");
  assert.ok(!logs.some((line) => /không còn cảnh lỗi/.test(line)), "Deferred failures must not be reported as recovered");
  assert.ok(calls.every((call) => call.artifact === "motion_remotion_composition"));
  const latestScenes: any[] = Object.values(latest.gen.remotion.scenes).flat();
  for (const scene of scenes) {
    const current = latestScenes.find((item) => item.id === scene.id);
    assert.deepEqual(current.nodes, scene.nodes, "Recovery must not remove scene subjects");
    assert.deepEqual(current.effects, scene.effects, "Recovery must not remove scene effects");
    if (scene.build?.status === "accepted") assert.deepEqual(current.composition, scene.composition, "Unselected accepted scenes must remain unchanged");
  }
  const failureResult = { scenes: 36, initiallyAccepted: 27, failed: 9, peakDrawingRequests: peak, recoveryReached: true, motionCallsWhileIncomplete: 0, preservedSubjectsEffectsAndAcceptedScenes: true, calls: [...calls] };
  logs.length = 0; calls.length = 0;
  const accepted = scenes.filter((scene) => scene.build?.status === "accepted" && scene.composition?.motion?.clips?.length).slice(0, 2);
  assert.equal(accepted.length, 2);
  const result = await run(structuredClone(original), accepted.map((scene) => scene.id), false);
  assert.ok(calls.some((call) => call.artifact === "motion_remotion_motion"));
  const acceptedReplay = { targetIds: accepted.map((scene) => scene.id), calls: [...calls], logs: [...logs] };
  logs.length = 0; calls.length = 0;
  const reviewed = await run(structuredClone(original), accepted.map((scene) => scene.id), false, true);
  assert.ok(calls.some((call) => call.artifact === MOTION_VISUAL.ARTIFACT_REVIEW));
  for (const id of acceptedReplay.targetIds) assert.equal((Object.values(reviewed.gen!.remotion!.scenes).flat().find((scene: any) => scene.id === id) as any).build.review, true);
  assert.ok(reviewedFrames > 0);
  const reviewReplay = { reviewerEnvelopeSimulated: true, realSourceScenes: true, renderedMotionFrames: reviewedFrames, calls: [...calls], logs: [...logs] };
  const badSvg = JSON.parse(await fs.readFile(path.join(out, "baseline/output/motion-video/ai-debug/motion_remotion_composition-composition_cde21f84f89b0d5c2161de6bb0f0be256d1604613a75fa4ded900869b58fa060_c3_event_2a8b3d0d29d9_0-1.json"), "utf8"));
  structural = { sceneId: "c3_event_2a8b3d0d29d9:0", draft: badSvg.draft, supplied: false, repairs: 0 };
  calls.length = 0; logs.length = 0;
  const repaired = await run(structuredClone(original), [structural.sceneId], false);
  assert.ok(structural.supplied && structural.repairs > 0);
  assert.equal((Object.values(repaired.gen!.remotion!.scenes).flat().find((scene: any) => scene.id === structural!.sceneId) as any).build.status, "accepted");
  const structuralReplay = { realRejectedSvg: true, validReplyFromSameActualScene: true, targetedRepairs: structural.repairs, calls, logs };
  await fs.writeFile(path.join(out, "drawing-order-results.json"), JSON.stringify({ at: new Date().toISOString(), chromeVersion: browser.version(), visibleChrome: true, failureResult, acceptedReplay, reviewReplay, structuralReplay, result }, null, 2));
  process.stdout.write(String(JSON.stringify({ ...failureResult, calls: failureResult.calls.length, acceptedSceneReplay: accepted.map((scene) => scene.id), motionStartsAfterDrawings: true })) + "\n");
} finally { await browser.close(); }
