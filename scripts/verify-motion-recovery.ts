import { RUNTIME_VERIFICATION_TEXTS as RT, RUNTIME_VERIFICATION_FORMATS as RF } from "./runtimeVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../src/types.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
const fixture = { requests: [] as any[], events: [] as string[], refuse: true, apiCalls: 0 };
(globalThis as any).__motionRecovery = fixture;
const bundle = await build({
  stdin: { contents: RT.EXPORT_FROM_SRC_SERVER_SERVICES_MOTIONSTORYSERVICE_TS_EXPORT_FROM_SRC_, resolveDir: process.cwd(), loader: RT.TS },
  bundle: true,
  write: false,
  platform: RT.NODE,
  format: RT.ESM,
  packages: RT.EXTERNAL,
  plugins: [
    {
      name: RT.ISOLATED_ROOM_RECOVERY,
      setup(builder) {
        builder.onResolve({ filter: RT.PATTERN_CHATUIPLANNINGSERVICE_JS }, () => ({ path: RT.ROOM, namespace: RT.RECOVERY }));
        builder.onLoad({ filter: RT.PATTERN_EMPTY, namespace: RT.RECOVERY }, () => ({ loader: RT.JS, contents: RF.RECOVERY_ROOM_STUB(C.REFUSAL_RESPONSE_ERROR) }));
        builder.onLoad({ filter: RT.PATTERN_GEMINISERVICE_TS }, () => ({ loader: RT.JS, contents: RT.EXPORT_CONST_GENERATECONTENTWITHRETRY_ASYNC_GLOBALTHIS_MOTIONRECOVERY_ }));
      },
    },
  ],
});
fs.mkdirSync(RT.SCRATCH, { recursive: true });
const bundlePath = path.resolve(RF.RECOVERY_BUNDLE_PATH(process.pid));
fs.writeFileSync(bundlePath, bundle.outputFiles[0].text);
try {
  const motion = await import(pathToFileURL(bundlePath).href);
  const execution = { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiArgon, mode: AiPlanningExecutionMode.RoomOnly };
  const chapter = { id: RT.C1, title: RT.HOMECOMING, summary: RT.A_PERSON_RETURNS_HOME, targetSeconds: 12 };
  const analysis = { title: RT.HOMECOMING, logline: RT.A_RETURN_HOME, cast: [], places: [], chapters: [chapter] };
  const source = { kind: RT.BRIEF, text: chapter.summary, segments: [{ t: 0, text: chapter.summary }] };
  const logs: string[] = [];
  const beats = await motion.runInMotionAiSession(RT.RECOVERY_TEST, () => motion.writeChapterBeats(source, analysis, chapter, { language: RT.EN, exec: execution, isFirst: true, isLast: true, log: (line: string) => logs.push(line) }));
  assert.ok(beats.length, RT.THE_EXISTING_OUTLINE_FALLBACK_IS_RETAINED_AFTER_BOUNDED_FAILURES);
  assert.equal(fixture.requests.length, 3, RT.CHAPTER_OWNS_THREE_TOTAL_ATTEMPTS_REFUSAL_MUST_NOT_MULTIPLY_NESTED_RET);
  assert.deepEqual(fixture.events, Array(3).fill([RT.PREPARE, RT.SEND, RT.CLOSE]).flat(), RT.EACH_REFUSAL_CLOSES_THE_ROOM_BEFORE_A_FRESH_ATTEMPT);
  assert.ok(fixture.requests.every((request) => request.provider === execution.provider && request.model === execution.model));
  assert.equal(fixture.apiCalls, 0);
  assert.ok(logs.some((line) => line.includes(RT.TU_CHOI)));
  const originalPrompts = fixture.requests.map((request) => request.prompt.replaceAll(request.requestId, RT.REQUEST_ID));
  assert.equal(new Set(originalPrompts).size, 1, RT.EVERY_RETRY_REUSES_THE_ORIGINAL_TASK_ONLY_REQUEST_IDENTITY_CHANGES);
  assert.ok(
    originalPrompts.every((prompt) => !prompt.includes(RT.TOI_CHI_LA)),
    RT.NEVER_INJECT_REFUSAL_TEXT_INTO_RETRIES,
  );
  assert.ok(
    originalPrompts.every((prompt) => prompt.startsWith(productionPreamble(analysis as any, RT.STORY))),
    RT.STORY_TASKS_EXPLICITLY_REQUEST_WRITTEN_TEXT_AND_JSON,
  );
  const before = fixture.requests.length;
  await assert.rejects(motion.runMotionAi(RT.TEST, RT.MOTION_STORY_CHAPTER, { ...execution, provider: AiPlanningFallbackProvider.ClaudeChat, mode: AiPlanningExecutionMode.Hybrid }), { message: C.REFUSAL_RESPONSE_ERROR });
  assert.equal(fixture.requests.length, before + 1, RT.A_REFUSAL_CANNOT_SILENTLY_SWITCH_PROVIDER_OR_FALL_BACK_TO_API);
  assert.equal(fixture.apiCalls, 0);
  await assert.rejects(motion.runMotionAi(RT.DRAW, RT.DRAW_TEST, { ...execution, strictProvider: true }), { message: C.REFUSAL_RESPONSE_ERROR });
  assert.equal(fixture.requests.length, before + 2, RT.THE_DRAWING_ORCHESTRATOR_CONTINUES_TO_OWN_ITS_RETRIES);
  let ctx: any;
  let finish!: (result: unknown) => void;
  const job = motion.startStoryJob(true, MotionStoryJobKind.SCENES, (context: any) => {
    ctx = context;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  while (!ctx) await new Promise((resolve) => setTimeout(resolve, 5));
  ctx.progress(0.85, RT.VOICE);
  ctx.progress(0.5, RT.VOICE);
  assert.equal(motion.getStoryJob(job.id).progress, 0.85, RT.LATE_PARALLEL_CALLBACKS_MUST_NOT_MAKE_PROGRESS_GO_BACKWARDS);
  ctx.progress(1, RT.MIXING);
  assert.equal(motion.getStoryJob(job.id).progress, 0.99);
  assert.equal(motion.getStoryJob(job.id).status, MotionJobStatus.RENDERING, RT.VALUE_100_IS_RESERVED_FOR_SUCCESSFUL_COMPLETION);
  finish({ scenes: true });
  while (motion.getStoryJob(job.id).status === MotionJobStatus.RENDERING) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(motion.getStoryJob(job.id).status, MotionJobStatus.COMPLETED);
  assert.equal(motion.getStoryJob(job.id).progress, 1);
  ctx.progress(0.3, RT.OLD_CALLBACK);
  assert.equal(motion.getStoryJob(job.id).progress, 1);
  assert.notEqual(motion.getStoryJob(job.id).stage, RT.OLD_CALLBACK);
  process.stdout.write(RT.MOTION_REFUSAL_ROUTING_BOUNDED_FRESH_ROOM_RETRIES_STORY_PROMPT_AND_PRO);
} finally {
  fs.rmSync(bundlePath, { force: true });
  for (const request of fixture.requests) fs.rmSync(path.join(getMotionRootDirectory(), RT.AI_DEBUG, request.requestId + RT.JSON), { force: true });
  delete (globalThis as any).__motionRecovery;
}
