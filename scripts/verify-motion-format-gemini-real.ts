import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MOTION_REMOTION_PROMPTS as P } from "../src/constants/motionRemotionPrompts.ts";
import { MOTION_SCENE_FORMATS } from "../src/constants/motionProfiles/framing.ts";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.ts";
import { withMotionResponsePrompt } from "../src/lib/motionResponseContract.ts";
import { MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID, MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT } from "../src/constants/motionRuntime.ts";
const out = path.resolve("scratch/motion-real-recovery-20261105");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "format-live-storage");
delete process.env.APP_DATA_DIR;
const { generatePlanningWithChatUi, closeChatPlanningRoom } = await import("../src/server/services/chatUiPlanningService.ts");
const { closeAppBrowserAfterTask } = await import("../src/server/services/imageGeneratorService.ts");
const file = "baseline/output/motion-video/ai-debug/motion_remotion_scene-plan_7ee92585776fcf026eb0592a7790cd7e93274eb0cf0852239d628057fc50f3d4-1.json";
const original = JSON.parse(await fs.readFile(path.join(out, file), "utf8"));
const rows = original.response.scenes;
const rejected = rows.filter((row: any) => !(MOTION_SCENE_FORMATS as readonly string[]).includes(row.format));
assert.equal(rejected.length, 3);
const requestId = "motion-format-qa-" + randomUUID();
const errors = original.errors.filter((error: string) => /\.format:/.test(error));
const task = P.REPAIR({}, original.response, errors);
assert.match(task, /Omit all other fields/);
const prompt = MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT(withMotionResponsePrompt(V.ARTIFACT_SCENE, task), MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID(V.ARTIFACT_SCENE, requestId));
const request: any = { provider: "gemini-chat", model: "gemini-flash::low", projectId: "motion-format-real-" + randomUUID(), workerId: "motion-primary", artifactType: V.ARTIFACT_SCENE, requestId, prompt, restoreContext: () => prompt, chromeHeadless: false, closeRoomOnComplete: false, signal: AbortSignal.timeout(300000), submission: { attempted: false, completed: false } };
const report: any = { at: new Date().toISOString(), source: file, liveGemini: true, promptChars: prompt.length, requestId, rejectedRows: rejected.map((row: any) => ({ fromLineId: row.fromLineId, format: row.format })) };
try {
  const reply = await generatePlanningWithChatUi(request);
  const patch = JSON.parse(reply.text);
  assert.equal(patch.scenes.length, rejected.length);
  const corrected = structuredClone(rows);
  for (const item of patch.scenes) {
    assert.ok(Object.keys(item).every((key) => ["fromLineId", "toLineId", "format"].includes(key)), "Format repair must not rewrite node/camera/layout data");
    const row = corrected.find((row: any) => row.fromLineId === item.fromLineId);
    assert.ok(row && rejected.some((row: any) => row.fromLineId === item.fromLineId));
    assert.equal(row.toLineId, item.toLineId);
    assert.ok((MOTION_SCENE_FORMATS as readonly string[]).includes(item.format));
    row.format = item.format;
  }
  for (const [index, row] of corrected.entries()) {
    const { format: _old, ...before } = rows[index];
    const { format: _new, ...after } = row;
    assert.deepEqual(after, before);
  }
  report.patch = patch.scenes;
  report.allOtherFieldsPreserved = true;
  await fs.writeFile(path.join(out, "format-live-patch.json"), reply.text);
  process.stdout.write(JSON.stringify({ nativeFormatRepair: true, rows: patch.scenes.length, preservedAllOtherFields: true }) + "\n");
} catch (error) { report.error = String(error); process.stderr.write(report.error + "\n"); process.exitCode = 1; }
finally {
  await fs.writeFile(path.join(out, "format-gemini-live-results.json"), JSON.stringify(report, null, 2));
  await closeChatPlanningRoom(request, true).catch(() => undefined);
  await closeAppBrowserAfterTask(true);
}
