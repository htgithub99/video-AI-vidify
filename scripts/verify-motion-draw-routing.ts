import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import { runMotionDrawTask } from "../src/server/services/motionDrawRoutingService.ts";
import { designBible, emptyGen } from "../src/server/services/motionGenService.ts";
import type { MotionStoryAnalysis } from "../src/types/motionVideo.ts";
const CHATGPT = VT.CHATGPT_UI;
const CLAUDE = VT.CLAUDE_CHAT;
const base = { provider: VT.GEMINI_CHAT, model: VT.GEMINI_FLASH, mode: VT.API_ONLY, chromeHeadless: true };
const quiet = () => {};
const route = async (results: (boolean | Error)[], maxAttempts?: number) => {
  const sent: string[] = [];
  let error: unknown;
  const value = await runMotionDrawTask({
    task: VT.T_2,
    exec: base,
    log: quiet,
    retryDelayMs: 0,
    maxAttempts,
    attempt: async (exec) => {
      assert.equal(exec.strictProvider, true, VT.DRAW_SENDS_MUST_DISABLE_HIDDEN_PROVIDER_SWITCHING);
      assert.equal(exec.mode, VT.ROOM_ONLY);
      sent.push(exec.provider!);
      const r = results[sent.length - 1];
      if (r instanceof Error) throw r;
      return r ? VT.OK : undefined;
    },
  }).catch((e) => {
    error = e;
  });
  return { sent, value, error };
};
let r = await route([true]);
assert.deepEqual(r.sent, [CHATGPT], VT.FIRST_USABLE_CHATGPT_ANSWER_MUST_NOT_CALL_CLAUDE);
r = await route([false, true]);
assert.deepEqual(r.sent, [CHATGPT, CHATGPT]);
r = await route([new Error(VT.TIMEOUT), false, new Error(VT.LIMIT), true]);
assert.deepEqual(r.sent, [CHATGPT, CHATGPT, CHATGPT, CLAUDE], VT.CLAUDE_ONLY_AFTER_THREE_CHATGPT_FAILURES);
assert.equal(r.value, VT.OK);
r = await route([false, false, false, false, false, false, false], 7);
assert.deepEqual(r.sent, [CHATGPT, CHATGPT, CHATGPT, CLAUDE, CLAUDE, CLAUDE, CHATGPT], VT.CLAUDE_1_2_RETRIES_THEN_BACK_TO_CHATGPT);
assert.ok(r.error instanceof Error);
r = await route([true]);
assert.deepEqual(r.sent, [CHATGPT], VT.A_NEW_TASK_STARTS_WITH_CHATGPT_AGAIN);
const ctrl = new AbortController();
let calls = 0;
await assert.rejects(
  runMotionDrawTask({
    task: VT.T_2,
    exec: base,
    log: quiet,
    signal: ctrl.signal,
    retryDelayMs: 50,
    attempt: async () => {
      calls++;
      ctrl.abort();
      return undefined;
    },
  }),
);
assert.equal(calls, 1, VT.CANCEL_STOPS_THE_CYCLE_INCLUDING_THE_WAIT_BEFORE_THE_NEXT_SEND);
const analysis = {
  title: VT.DINNER,
  logline: VT.DINNER_IN_A_DARK_ROOM,
  era: VT.FICTION_2,
  look: VT.CLEAN,
  cast: [
    { key: VT.HERO, name: VT.HERO_2 },
    { key: VT.AUNT, name: VT.AUNT_2, gender: VT.FEMALE },
  ],
  places: [],
  chapters: [],
  facts: [],
} as MotionStoryAnalysis;
const part = (id: string, parent?: string) => ({ id, ...(parent ? { parent } : {}), pos: [0, 1, 0], nodes: [{ shape: VT.BOX, size: [0.3, 0.3, 0.3], mat: { color: VT.C08060 } }] });
const design = { parts: [part(VT.TORSO), part(VT.HEAD, VT.TORSO), part(VT.ARM, VT.TORSO)] };
const gen = emptyGen();
const prompts: string[] = [];
const providers: string[] = [];
await designBible(analysis, gen, {
  exec: base,
  log: quiet,
  ai: async (prompt, _artifact, exec) => {
    prompts.push(prompt);
    providers.push(exec.provider!);
    if (prompts.length === 1) return { cast: { hero: design, aunt: { parts: [] } } };
    return { cast: { aunt: design } };
  },
});
assert.deepEqual(providers, [CHATGPT, CHATGPT]);
assert.ok(gen.cast.hero && gen.cast.aunt, VT.USABLE_CHARACTERS_ARE_KEPT_ONLY_THE_MISSING_ONE_IS_REQUESTED_AGAIN);
assert.doesNotMatch(prompts[1], VT.RETRY_FEEDBACK_RE, VT.RETRIES_RESEND_THE_ORIGINAL_REQUEST_WITHOUT_FEEDBACK);
assert.match(prompts[1], VT.AUNT_CAST_RE, VT.THE_RETRY_CARRIES_THE_ORIGINAL_DATA_OF_THE_MISSING_CHARACTER);
assert.ok(prompts[1].indexOf(VT.AUNT_FEMALE) < prompts[1].indexOf(VT.HERO_MALE), VT.CHARACTERS_ALREADY_DRAWN_ARE_ONLY_LISTED_AS_OTHER_CAST_NOT_REQUESTED_AGA);
process.stdout.write(VT.DRAW_ROUTING_PASSED_CHATGPT_3_CLAUDE_1_2_CHATGPT_PER_TASK_RESET_CANCELLA + VT.EMPTY);
