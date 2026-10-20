import _ from "lodash";
import { MOTION_AI_FALLBACK } from "../../constants/motionAiFallback.js";
import { MOTION_DRAW_ROUTING_LOGS as L, MOTION_SCENE_AI } from "../../constants/motionSceneLibrary.js";
import { MOTION_TEXT_ABORT, MOTION_TEXT_CANCELLED } from "../../constants/motionRuntime.js";
import { getMotionErrorSummary } from "../../lib/motionUtils.js";
import { AiPlanningExecutionMode } from "../../types.js";
import type { MotionAiExecution } from "../../types/motionVideo.js";
import { resolveMotionSceneExecution } from "../../lib/motionSceneAi.js";
import { logMotionAiChain, motionCaptchaError, motionRoomBlockedMs, resetMotionAiRoom } from "./motionStoryService.js";
export interface MotionDrawTurn { provider: string; model: string; turn: number; turns: number; total: number; }
export interface MotionDrawTaskOptions<T> { task: string; exec: MotionAiExecution; signal?: AbortSignal; log: (s: string) => void; attempt: (exec: MotionAiExecution, turn: MotionDrawTurn) => Promise<T | undefined>; maxAttempts?: number; retryDelayMs?: number; canAttempt?: () => boolean; }
const cancelled = (signal?: AbortSignal): Error => (signal?.reason instanceof Error ? signal.reason : new Error(MOTION_TEXT_CANCELLED));
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelled(signal));
    const timer = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener(MOTION_TEXT_ABORT, stop);
      resolve();
    }
    function stop() {
      clearTimeout(timer);
      reject(cancelled(signal));
    }
    signal?.addEventListener(MOTION_TEXT_ABORT, stop, { once: true });
  });
export const motionDrawExec = (base: MotionAiExecution, provider: string, model: string): MotionAiExecution => ({
  provider,
  model,
  mode: AiPlanningExecutionMode.RoomOnly,
  chromeHeadless: base.chromeHeadless,
  strictProvider: true,
});
export const runMotionDrawTask = async <T>(o: MotionDrawTaskOptions<T>): Promise<T> => {
  const primary = resolveMotionSceneExecution(o.exec);
  const routes = [{ provider: primary.provider, model: primary.model, turns: MOTION_SCENE_AI.PRIMARY_TURNS }, ..._.map(_.filter(MOTION_AI_FALLBACK.DRAW, (r) => r.provider !== primary.provider), (r) => ({ provider: r.provider, model: r.model, turns: MOTION_AI_FALLBACK.FALLBACK_TURNS }))];
  let total = 0;
  for (let step = 0; step < routes.length; step++) {
    const route = routes[step];
    if (total) o.log(L.SWITCH(o.task, routes[(step + routes.length - 1) % routes.length].provider, route.provider));
    for (let turn = 1; turn <= route.turns; turn++) {
      if (o.signal?.aborted) throw cancelled(o.signal);
      if (o.canAttempt && !o.canAttempt()) throw new Error(L.GAVE_UP(o.task, total));
      const blocked = motionRoomBlockedMs(route.provider);
      if (blocked > 0) {
        const wait = Math.min(blocked, MOTION_SCENE_AI.BLOCKED_WAIT_MS);
        o.log(L.WAIT_BLOCKED(route.provider, Math.ceil(wait / 1000)));
        await sleep(wait, o.signal);
      }
      total++;
      o.log(L.ATTEMPT(o.task, route.provider, turn, route.turns, total));
      let reason: string = L.NO_DATA;
      try {
        const value = await o.attempt(motionDrawExec(o.exec, route.provider, route.model), { provider: route.provider, model: route.model, turn, turns: route.turns, total });
        if (value !== undefined) {
          o.log(L.DONE(o.task, route.provider, total));
          logMotionAiChain({ artifact: o.task, step: step + 1, total: routes.length, provider: route.provider, model: route.model, result: MOTION_AI_FALLBACK.RESULT_OK });
          return value;
        }
        await resetMotionAiRoom().catch(_.noop);
      } catch (error) {
        reason = getMotionErrorSummary(error);
        logMotionAiChain({ artifact: o.task, step: step + 1, total: routes.length, provider: route.provider, model: route.model, result: motionCaptchaError(error) ? MOTION_AI_FALLBACK.RESULT_CAPTCHA : MOTION_AI_FALLBACK.RESULT_FAIL, reason });
        if (o.signal?.aborted || motionCaptchaError(error)) throw error;
      }
      o.log(L.UNUSABLE(o.task, route.provider, reason));
      if (o.maxAttempts && total >= o.maxAttempts) throw new Error(L.GAVE_UP(o.task, total));
      await sleep(o.retryDelayMs ?? MOTION_SCENE_AI.RETRY_DELAY_MS, o.signal);
    }
  }
  throw new Error(L.ALL_FAILED(o.task, total));
};
