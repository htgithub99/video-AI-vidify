import type { MotionAiExecution } from "../../types/motionVideo.js";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { isMotionContentResponseError } from "./chatSubmissionRecovery.js";
import type { MotionResponseSchema } from "../../constants/motionResponseContract.js";
import { motionResponseErrors } from "../../lib/motionResponseContract.js";
import type { MotionAiContractState } from "../../types/motionAiContract.js";
export type { MotionAiContractState } from "../../types/motionAiContract.js";
export const recoverMotionAiContractState = (state: MotionAiContractState, revision: string): MotionAiContractState => {
  if (!state.rejected || state.recovery?.revision === revision) return state;
  const previous = { revision: state.recovery?.revision, rejected: state.rejected, errors: structuredClone(state.errors), ...(state.routes ? { routes: structuredClone(state.routes) } : {}) };
  return { rejected: 0, errors: [], recovery: { revision, previous: [...(state.recovery?.previous || []), previous] } };
};
export interface MotionAiResponseContract {
  schema?: MotionResponseSchema;
  targetIds?: string[];
  attempts: number;
  budget?: number;
  routeAttempts?: number;
  yieldAfterReject?: boolean;
  state?: MotionAiContractState;
  checkpoint?: (state: MotionAiContractState) => Promise<void> | void;
  start?: (prompt: string) => string;
  assess: (raw: any) => { value: any; errors: string[] } | Promise<{ value: any; errors: string[] }>;
  repair: (prompt: string, value: any, errors: string[]) => string;
  failure: (errors: string[]) => Error;
  rejected?: (raw: any, value: any, errors: string[], route: MotionAiExecution, attempt: number) => Promise<void> | void;
  beforeAttempt?: (attempt: number) => Promise<void> | void;
  progress?: { key: () => string; limit: number; message: string };
}
export const requestMotionAiContract = async (prompt: string, route: MotionAiExecution, request: (prompt: string) => Promise<any>, contract?: MotionAiResponseContract, signal?: AbortSignal): Promise<any> => {
  let question = contract?.start?.(prompt) || prompt;
  const state = contract ? (contract.state ||= { rejected: 0, errors: [] }) : undefined;
  const exhausted = () => Object.assign(contract!.failure(state!.errors), { [P.CONTRACT_EXHAUSTED]: true });
  const routeKey = JSON.stringify([route.mode, route.provider, route.model]);
  const routeExhausted = () => Object.assign(contract!.failure(state!.errors), { [P.CONTRACT_ROUTE_EXHAUSTED]: true });
  const limit = Math.max(1, contract?.budget || contract?.attempts || 1);
  const stalled = () => Object.assign(contract!.failure([...state!.errors, contract!.progress!.message]), { [P.CONTRACT_EXHAUSTED]: true, [P.CONTRACT_STALLED]: true });
  if (state && contract?.progress) {
    const key = contract.progress.key();
    if (state.progress?.key !== key) state.progress = { key, unchanged: 0 };
    if (state.progress.unchanged >= contract.progress.limit) throw stalled();
  }
  if (state && state.rejected >= limit) throw exhausted();
  if (state && contract?.routeAttempts && (state.routes?.[routeKey] || 0) >= contract.routeAttempts) throw routeExhausted();
  for (let attempt = 0; attempt < Math.max(1, contract?.attempts || 1); attempt++) {
    signal?.throwIfAborted();
    await contract?.beforeAttempt?.(state?.rejected || 0);
    let raw: any;
    let responseError: string | undefined;
    try {
      raw = await request(question);
    } catch (error) {
      if (!contract || !isMotionContentResponseError(error)) throw error;
      responseError = P.CONTRACT_RESPONSE_INVALID(String((error as Error).message));
      raw = undefined;
    }
    signal?.throwIfAborted();
    if (!contract) return raw;
    const checked = await contract.assess(raw);
    if (checked.errors.length && contract.schema && raw !== undefined) checked.errors = [...new Set([...checked.errors, ...motionResponseErrors(raw, contract.schema, "", true)])];
    if (responseError) checked.errors = [...checked.errors, responseError];
    if (!checked.errors.length) return checked.value;
    state!.errors = checked.errors;
    state!.rejected++;
    if (contract.progress) {
      const key = contract.progress.key();
      state!.progress = { key, unchanged: key === state!.progress?.key ? state!.progress.unchanged + 1 : 0 };
    }
    if (contract.routeAttempts) (state!.routes ||= {})[routeKey] = (state!.routes?.[routeKey] || 0) + 1;
    await contract.checkpoint?.(structuredClone(state!));
    await contract.rejected?.(raw, checked.value, state!.errors, route, state!.rejected);
    signal?.throwIfAborted();
    if (contract.progress && state!.progress!.unchanged >= contract.progress.limit) throw stalled();
    if (state!.rejected >= limit) throw exhausted();
    if (contract.routeAttempts && state!.routes![routeKey] >= contract.routeAttempts) throw routeExhausted();
    if (contract.yieldAfterReject) return checked.value;
    question = contract.repair(prompt, checked.value, state!.errors);
  }
  throw contract!.failure(state!.errors);
};
