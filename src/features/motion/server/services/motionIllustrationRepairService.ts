import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../../../../constants/motionIllustrationNeeds.js";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { MOTION_PROMPT as Q } from "../../../../constants/motionPrompt.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../../../../constants/motionIllustrationPolicy.js";
import { mergeMotionRepair } from "../../../../lib/motionAiRepair.js";
import { motionIllustrationCoverageKey, motionIllustrationCoverageMissing, motionIllustrationNeedPaths, motionIllustrationNeedsErrors, normalizeMotionIllustrationNeedOptionals } from "../../../../lib/motionIllustrationNeeds.js";
import { motionValueKey } from "../../../../lib/motionValue.js";
import { MOTION_EDITORIAL_POLICY as E } from "../../../../constants/motionEditorialPolicy.js";
import type { MotionStoryAnalysis } from "../../../../types/motionVideo.js";
import type { MotionAiContractState, MotionAiResponseContract } from "./motionAiContractService.js";
export const completeMotionIllustrationCoverage = async (analysis: MotionStoryAnalysis, states: Record<string, MotionAiContractState>, options: { signal?: AbortSignal; log?: (line: string) => void; inventory: () => string; request: (prompt: string, contract: MotionAiResponseContract) => Promise<any>; save: (draft: MotionStoryAnalysis) => void }): Promise<MotionStoryAnalysis> => {
  let current = normalizeMotionIllustrationNeedOptionals(structuredClone(analysis));
  for (const chapterId of motionIllustrationCoverageMissing(current)) {
    options.signal?.throwIfAborted();
    const chapter = current.chapters.find((chapter) => chapter.id === chapterId)!;
    const sourceKey = motionIllustrationCoverageKey(current, chapterId);
    const existing = (current.illustrationNeeds || []).filter((need) => need.chapterId === chapterId);
    const clues = (current.storySpine?.clues || []).filter((clue) => clue.setupChapterId === chapterId || clue.payoffChapterId === chapterId);
    const state = (states[stringifyJson([chapterId, sourceKey])] ||= { rejected: 0, errors: [] });
    const prompt = () => [N.COVERAGE_PROMPT({ chapter, cast: current.cast.map(({ key, name }) => ({ key, name })), places: current.places, existing, clues }, state.errors), Q.PLANNING_NEEDS, options.inventory()].join(Q.SEPARATOR);
    options.log?.(N.COVERAGE_LOG(chapterId));
    const contract: MotionAiResponseContract = {
      targetIds: [chapterId],
      attempts: P.CONTRACT_ROUTE_ATTEMPTS,
      routeAttempts: P.CONTRACT_ROUTE_ATTEMPTS,
      budget: E.REPAIR_ATTEMPTS,
      state,
      checkpoint: () => options.save(current),
      start: prompt,
      repair: prompt,
      failure: () => new Error(N.COVERAGE_INVALID),
      assess: (raw) => {
        const valid = raw?.chapterId === chapterId && raw.checked === true && Array.isArray(raw.needs) && raw.needs.every((need: any) => need?.chapterId === chapterId);
        const candidate = normalizeMotionIllustrationNeedOptionals({ ...current, illustrationNeeds: [...(current.illustrationNeeds || []), ...(valid ? raw.needs : [])] });
        const errors = valid ? motionIllustrationNeedsErrors(candidate) : [N.COVERAGE_INVALID];
        if (!errors.length) {
          const needIds = candidate.illustrationNeeds.filter((need) => need.chapterId === chapterId).map((need) => need.id);
          current = { ...candidate, illustrationCoverage: [...(candidate.illustrationCoverage || []).filter((row) => row.chapterId !== chapterId), { version: N.COVERAGE_VERSION, chapterId, sourceKey: motionIllustrationCoverageKey(candidate, chapterId), status: needIds.length ? RT_SHARED.CHECKED_NEEDS : RT_SHARED.CHECKED_EMPTY, needIds }] };
          options.save(current);
        }
        return { value: current, errors };
      },
    };
    await options.request(prompt(), contract);
  }
  return current;
};
export const repairMotionIllustrationNeeds = async (draft: any, states: Record<string, MotionAiContractState>, options: { signal?: AbortSignal; log?: (line: string) => void; inventory?: () => string; request: (prompt: string, contract: MotionAiResponseContract) => Promise<any>; save: (draft: any) => void }): Promise<any> => {
  options.signal?.throwIfAborted();
  let current = normalizeMotionIllustrationNeedOptionals(structuredClone(draft));
  options.save(current);
  if (!motionIllustrationNeedsErrors(current).length) return current;
  if (!Array.isArray(current.illustrationNeeds)) throw new Error(N.PART_INVALID);
  for (let index = 0; index < current.illustrationNeeds.length; index++) {
    options.signal?.throwIfAborted();
    const original = current.illustrationNeeds[index];
    if (Array.isArray(original?.objects)) original.objects = original.objects.map((object: any) => (object && typeof object === "object" ? Object.fromEntries(Object.entries(object).filter(([key]) => (I.OBJECT_FIELDS as readonly string[]).includes(key))) : object));
    options.save(current);
    let paths = motionIllustrationNeedPaths(current, index);
    if (!paths.length) continue;
    const prefix = `${RT_SHARED.ILLUSTRATIONNEEDS}${index}${RT_SHARED.SYMBOL_CFAE0D}`;
    const errors = () => motionIllustrationNeedsErrors(current).filter((error) => error.startsWith(prefix + RT_SHARED.SYMBOL_CDB4EE) || error.startsWith(prefix + RT_SHARED.SYMBOL_E7AC07));
    const state = (states[String(index)] ||= { rejected: 0, errors: [] });
    const prompt = () => {
      const need = current.illustrationNeeds[index];
      const chapter = current.chapters.find((chapter: any) => chapter.id === need?.chapterId);
      const context = { chapter: chapter || current.chapters.map((chapter: any) => ({ id: chapter.id, summary: chapter.summary })), cast: current.cast.map((member: any) => ({ key: member.key, name: member.name })), places: current.places.map((place: any) => ({ key: place.key, name: place.name })), clueContract: current.storySpine?.clues };
      return [N.REPAIR(context, need, paths, errors()), Q.PLANNING_NEEDS, I.PROMPT, paths.some((path) => /(?:key|catalogKey|objects)$/.test(path)) ? options.inventory?.() : undefined].filter(Boolean).join(RT_SHARED.SYMBOL_01BA47);
    };
    options.log?.(N.ROW_LOG(current.illustrationNeeds[index]?.id || String(index)));
    const contract: MotionAiResponseContract = {
      targetIds: [original.id || String(index)],
      attempts: P.CONTRACT_ROUTE_ATTEMPTS,
      routeAttempts: P.CONTRACT_ROUTE_ATTEMPTS,
      budget: E.REPAIR_ATTEMPTS,
      state,
      progress: { key: () => motionValueKey([current.illustrationNeeds[index], errors()]), limit: N.NO_PROGRESS_ATTEMPTS, message: N.NO_PROGRESS },
      checkpoint: () => options.save(current),
      start: prompt,
      assess: (raw) => {
        const row = current.illustrationNeeds[index];
        const incoming = raw?.need;
        if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
          const cleaned = structuredClone(row);
          if (Array.isArray(cleaned?.objects)) cleaned.objects = cleaned.objects.map((object: any) => (object && typeof object === "object" ? Object.fromEntries(Object.entries(object).filter(([key]) => (I.OBJECT_FIELDS as readonly string[]).includes(key))) : object));
          current.illustrationNeeds[index] = mergeMotionRepair(cleaned, incoming, paths);
          current = normalizeMotionIllustrationNeedOptionals(current);
        }
        const pending = errors();
        paths = motionIllustrationNeedPaths(current, index);
        options.save(current);
        return { value: current.illustrationNeeds[index], errors: pending };
      },
      repair: prompt,
      failure: (errors) => new Error([N.PART_INVALID, ...errors].join(RT_SHARED.SYMBOL_01BA47)),
    };
    await options.request(prompt(), contract);
  }
  const remaining = motionIllustrationNeedsErrors(current);
  if (remaining.length) throw new Error([N.PART_INVALID, ...remaining].join(RT_SHARED.SYMBOL_01BA47));
  return current;
};
