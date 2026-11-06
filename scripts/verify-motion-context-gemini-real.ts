import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MOTION_CLIP_DIRECTOR as D } from "../src/constants/motionClipDirector.ts";
import { MOTION_PROMPT } from "../src/constants/motionPrompt.ts";
import { motionClipContext, assessMotionClips } from "../src/lib/motionClipDirector.ts";
import { withMotionResponsePrompt } from "../src/lib/motionResponseContract.ts";
import { motionVideoGenre } from "../src/constants/motionGenre.ts";
import { MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID, MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT } from "../src/constants/motionRuntime.ts";
const out = path.resolve("scratch/motion-real-recovery-20261105");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "context-live-storage");
delete process.env.APP_DATA_DIR;
const { generatePlanningWithChatUi, closeChatPlanningRoom } = await import("../src/server/services/chatUiPlanningService.ts");
const { closeAppBrowserAfterTask } = await import("../src/server/services/imageGeneratorService.ts");
const manifest = JSON.parse(await fs.readFile(path.join(out, "baseline/manifest.json"), "utf8"));
const script = JSON.parse(await fs.readFile(path.join(out, `baseline/output/motion-video/story-jobs/${manifest.jobId}.json`), "utf8")).job.result;
const analysis = JSON.parse(await fs.readFile(path.join(out, "analysis-source.json"), "utf8"));
const state = script.gen.remotion;
const requestId = "motion-context-qa-" + randomUUID();
const wrap = (prompt: string) => MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT(withMotionResponsePrompt(D.ARTIFACT, prompt), MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID(D.ARTIFACT, requestId));
const candidates = (Object.values(state.scenes).flat() as any[]).filter((scene) => scene.build?.status === "accepted" && scene.composition?.motion?.rig).map((scene) => {
  const lines = script.beats.filter((beat: any) => (scene.sourceBeatIds || [scene.beatId]).includes(beat.id));
  const seconds = Math.max(1, lines.reduce((sum: number, beat: any) => sum + (beat.duration || 0), 0) || scene.text.length / D.CHARS_PER_SECOND);
  const context = motionClipContext({ composition: scene.composition, rig: scene.composition.motion.rig, narration: scene.text, purpose: scene.purpose, seconds, profile: state.settings.profileId, genre: motionVideoGenre(analysis.videoGenre), nodes: scene.nodes, bible: state.motionBible });
  return { scene, context, prompt: wrap(D.PROMPT(context)) };
});
const originalCase = candidates.find((item) => item.scene.id === "c3_event_2c501575eda0:0");
const selected = originalCase && originalCase.prompt.length > MOTION_PROMPT.TARGET_CHARS ? originalCase : candidates.sort((a, b) => b.prompt.length - a.prompt.length)[0];
assert.ok(selected.prompt.length > MOTION_PROMPT.TARGET_CHARS, "Use actual context exceeding the production 16k budget; never pad the prompt");
await fs.writeFile(path.join(out, "context-live-source.json"), JSON.stringify({ sceneId: selected.scene.id, reconstruction: "same product context/prompt/schema builders; actual stored rig, source, scene, bible; not an exact byte replay of the earlier 17067-character prompt", context: selected.context, prompt: selected.prompt }, null, 2));
const events: any[] = [];
const signal = AbortSignal.timeout(8 * 60 * 1000);
const request: any = { projectId: "motion-context-real-" + randomUUID(), workerId: "motion-primary", provider: "gemini-chat", model: "gemini-flash::low", chromeHeadless: false, artifactType: D.ARTIFACT, requestId, promptMessageLimit: MOTION_PROMPT.TARGET_CHARS, closeRoomOnComplete: false, signal,
  onRecovery: (line: string) => { events.push({ at: new Date().toISOString(), line }); process.stdout.write(line + "\n"); } };
const report: any = { at: new Date().toISOString(), sceneId: selected.scene.id, promptChars: selected.prompt.length, limit: MOTION_PROMPT.TARGET_CHARS, liveGemini: true, model: request.model, events };
try {
  let prompt = selected.prompt;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await generatePlanningWithChatUi({ ...request, prompt, restoreContext: () => prompt, submission: { attempted: false, completed: false } });
    const raw = JSON.parse(response.text);
    await fs.writeFile(path.join(out, `context-live-response-${attempt}.json`), response.text);
    const asset = state.assets[selected.scene.composition.assetKey];
    const assessed = assessMotionClips(raw, selected.scene.composition.motion.rig, asset.svg, selected.scene.id, "qa-context");
    if (!assessed.errors.length) { report.validMotion = true; report.contractAttempt = attempt + 1; break; }
    report.validationErrors = assessed.errors;
    prompt = wrap(D.REPAIR(selected.context, raw, assessed.errors));
  }
  const journal = (await fs.readFile(path.join(out, "context-live-storage/logs/music-workflow.jsonl"), "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const acks = journal.filter((event) => event.stage === "chat-planning-context" && event.event === "chat_response_ui_confirmed");
  report.confirmedContextReplies = acks.length;
  report.contextReplyEvents = acks;
  assert.ok(acks.length >= 2, "Actual Gemini must confirm both context chunks before the final task response");
  assert.equal(report.validMotion, true);
  process.stdout.write(JSON.stringify({ sceneId: report.sceneId, promptChars: report.promptChars, actualContextAcks: acks.length, validMotion: true }) + "\n");
} catch (error) { report.error = String(error); process.stderr.write(report.error + "\n"); process.exitCode = 1; }
finally {
  await fs.writeFile(path.join(out, "context-gemini-live-results.json"), JSON.stringify(report, null, 2));
  await closeChatPlanningRoom(request, true).catch(() => undefined);
  await closeAppBrowserAfterTask(true);
}
