import { MOTION_PROMPT as C } from "../constants/motionPrompt.js";
export const motionPromptPayloadBudget = (_fixedChars: number, budget = C.TARGET_CHARS - C.WRAPPER_RESERVE): number => budget;
export const motionPromptBudget = (artifact = "", provider = "", model = ""): number => Math.max(C.MIN_TRANSPORT_CHARS, Math.min(C.TARGET_CHARS, C.ROUTE_BUDGETS[provider] || C.TARGET_CHARS, C.MODEL_BUDGETS[provider + ":" + model] || C.TARGET_CHARS, C.ARTIFACT_BUDGETS[artifact] || C.TARGET_CHARS));
export const motionPromptMeasurement = (payload: string, full: string, contextChars = 0, images = 0, budget: number = C.TARGET_CHARS) => ({ payloadChars: payload.length, wrapperChars: Math.max(0, full.length - payload.length - contextChars), contextChars, finalChars: full.length, images, budget, overflow: full.length > budget, action: full.length > budget ? C.ACTION.TRANSPORT : C.ACTION.DIRECT });
export const motionPromptGroups = <T>(items: readonly T[], build: (group: T[]) => string, maxItems = Number.MAX_SAFE_INTEGER, budget = C.TARGET_CHARS - C.WRAPPER_RESERVE, boundary?: (previous: T, next: T) => boolean): T[][] => {
  const groups: T[][] = [];
  let current: T[] = [];
  for (const item of items) {
    const candidate = [...current, item];
    if (current.length && (candidate.length > maxItems || boundary?.(current[current.length - 1], item) || build(candidate).length > budget)) {
      groups.push(current);
      current = [item];
    } else current = candidate;
  }
  if (current.length) groups.push(current);
  return groups;
};
export const motionPromptGroupsAsync = async <T>(items: readonly T[], build: (group: T[]) => Promise<string>, maxItems = Number.MAX_SAFE_INTEGER, budget = C.TARGET_CHARS - C.WRAPPER_RESERVE, boundary?: (previous: T, next: T) => boolean): Promise<{ items: T[]; prompt: string; overflow: boolean }[]> => {
  const split = async (group: T[]): Promise<{ items: T[]; prompt: string; overflow: boolean }[]> => {
    const prompt = await build(group);
    if (prompt.length <= budget || group.length === 1) return [{ items: group, prompt, overflow: prompt.length > budget }];
    const middle = Math.ceil(group.length / 2);
    return [...(await split(group.slice(0, middle))), ...(await split(group.slice(middle)))];
  };
  const result: { items: T[]; prompt: string; overflow: boolean }[] = [];
  for (const group of motionPromptGroups(items, () => C.SEPARATOR, maxItems, Number.MAX_SAFE_INTEGER, boundary)) result.push(...(await split(group)));
  return result;
};
