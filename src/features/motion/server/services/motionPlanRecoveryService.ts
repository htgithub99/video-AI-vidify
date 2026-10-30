import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import { normalizeMotionIllustrationNeeds, motionIllustrationCoverageMissing } from "../../../../lib/motionIllustrationNeeds.js";
import { MOTION_PLAN_RECOVERY as R } from "../../../../constants/motionPlanRecovery.js";
import { MOTION_PACK as K } from "../../../../constants/motionPack.js";
import { MOTION_RESOURCE_SEMANTICS as S } from "../../../../constants/motionResourceSemantics.js";
import { motionSemanticText, motionAssetLocationFamily, motionLocationFamily } from "../../../../lib/motionResourceSemantics.js";
import type { MotionAiExecution, MotionStoryAnalysis } from "../../../../types/motionVideo.js";
import { runMotionAi } from "./motionStoryService.js";
import { closedPuppetPackId } from "./puppet/packPolicy.js";
import { checkPuppetPlanReadiness, type PuppetPlanReadiness } from "./puppet/planReadiness.js";
import { isMotionResourceError } from "../../../../lib/motionResourceFailure.js";
import { MOTION_RESOURCE_FAILURE as F } from "../../../../constants/motionResourceFailure.js";
import { completeMotionIllustrationCoverage } from "./motionIllustrationRepairService.js";
import type { MotionAiContractState } from "./motionAiContractService.js";
import { requestMotionAiContract } from "./motionAiContractService.js";
import { puppetPackPlanningCapabilities } from "./puppet/packCatalog.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../../../../constants/motionIllustrationNeeds.js";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { MotionRepairLedger } from "../../../../lib/motionAiRepair.js";
const recoverableSetFailure = (error: unknown): boolean => (isMotionResourceError(error) ? error.diagnostic.kind === K.SET && error.diagnostic.reason !== F.REASONS.METADATA && error.diagnostic.reason !== F.REASONS.FILTERED : error instanceof Error && error.message.startsWith(K.MISSING(K.SET, []).split(RT_SHARED.SYMBOL_E7AC07)[0]));
export interface MotionPlanRecoveryState {
  attempts: number;
  errors: string[];
  coverage?: Record<string, MotionAiContractState>;
  repair?: MotionAiContractState;
  rows?: { id: string; value: Record<string, any> }[];
  checkedRepairs?: string[];
}
export const recoverMotionIllustrationPlan = async (
  analysis: MotionStoryAnalysis,
  options: { exec: MotionAiExecution; signal?: AbortSignal; log: (line: string) => void; state: MotionPlanRecoveryState; save: (analysis: MotionStoryAnalysis) => void; ai?: typeof runMotionAi; check?: typeof checkPuppetPlanReadiness; verifyCoverage?: boolean },
): Promise<{ analysis: MotionStoryAnalysis; illustration?: PuppetPlanReadiness }> => {
  const check = options.check || checkPuppetPlanReadiness;
  const styleId = closedPuppetPackId(analysis.stylePreset);
  if (!styleId) return { analysis, illustration: await check(analysis, options.signal, options.log) };
  let draft = normalizeMotionIllustrationNeeds(structuredClone(analysis));
  if (options.verifyCoverage)
    draft = await completeMotionIllustrationCoverage(draft, (options.state.coverage ||= {}), { signal: options.signal, log: options.log, inventory: () => puppetPackPlanningCapabilities(draft.stylePreset), save: options.save, request: (prompt, contract) => (options.ai || runMotionAi)(prompt, N.COVERAGE_ARTIFACT, options.exec, options.signal, options.log, undefined, 0, contract) });
  const resting = new Map<string, NonNullable<MotionStoryAnalysis["illustrationNeeds"]>[number]["states"][number]>();
  let restingScope = "";
  draft.illustrationNeeds = draft.illustrationNeeds?.map((need) => {
    const scope = stringifyJson([need.chapterId, need.place]);
    if (scope !== restingScope) resting.clear();
    restingScope = scope;
    return {
      ...need,
      states: need.states.map((state) => {
        const key = stringifyJson([need.chapterId, need.place, state.char]);
        const previous = resting.get(key);
        const unchanged = previous?.posture === RT_SHARED.LIE && ([RT_SHARED.IDLE, RT_SERVER.SIT] as string[]).includes(state.posture || RT_SHARED.IDLE) && !R.POSTURE_CHANGE.test(motionSemanticText(need.evidence));
        const next = unchanged ? { ...state, posture: previous.posture, support: previous.support } : state;
        resting.set(key, next);
        return next;
      }),
    };
  });
  for (;;) {
    options.signal?.throwIfAborted();
    const conflicts = draft.cast.flatMap((member) => {
      const text = motionSemanticText([member.look, member.name].filter(Boolean).join(S.SPACE));
      const male = S.MALE.test(text),
        female = S.FEMALE.test(text);
      const expected = male !== female ? (male ? RT_SHARED.MALE : RT_SHARED.FEMALE) : undefined;
      return expected && member.gender && member.gender !== expected ? [{ key: member.key, name: member.name, look: member.look, current: member.gender, expected }] : [];
    });
    let failure: Error | undefined;
    let illustration: PuppetPlanReadiness | undefined;
    try {
      illustration = await check(draft, options.signal, options.log);
    } catch (error) {
      if (!recoverableSetFailure(error)) throw error;
      failure = error as Error;
    }
    if (!failure && !conflicts.length) {
      if (options.verifyCoverage && motionIllustrationCoverageMissing(draft).length) {
        draft = await completeMotionIllustrationCoverage(draft, (options.state.coverage ||= {}), { signal: options.signal, log: options.log, inventory: () => puppetPackPlanningCapabilities(draft.stylePreset), save: options.save, request: (prompt, contract) => (options.ai || runMotionAi)(prompt, N.COVERAGE_ARTIFACT, options.exec, options.signal, options.log, undefined, 0, contract) });
        continue;
      }
      options.save(draft);
      return { analysis: draft, illustration };
    }
    if (draft.factual || options.state.attempts >= P.CONTRACT_TOTAL_ATTEMPTS) throw failure || new Error(R.FAILED);
    const places: { key: string; name: string; description: string; options: { optionId: string; stageId: string; family: string; name: string; needs: NonNullable<MotionStoryAnalysis["illustrationNeeds"]> }[] }[] = [];
    if (failure)
      for (const place of draft.places) {
        const needs = (draft.illustrationNeeds || []).filter((need) => need.place === place.key);
        const probe = { ...draft, places: [place], illustrationNeeds: needs };
        try {
          await check(probe, options.signal);
          continue;
        } catch (error) {
          if (!recoverableSetFailure(error)) throw error;
        }
        const text = motionSemanticText([place.name, place.description].join(S.SPACE));
        const families = [...new Set(S.PLACES.filter(([pattern]) => pattern.test(text)).map(([, family]) => family))].slice(0, R.MAX_FAMILIES);
        const variants = [needs];
        const choices: (typeof places)[number]["options"] = [];
        for (const family of families)
          for (const [index, variant] of variants.entries()) {
            try {
              const trial = await check({ ...probe, places: [{ ...place, name: family, description: family }], illustrationNeeds: variant }, options.signal);
              const stageId = trial?.places[place.key];
              const stage = stageId && trial?.pack?.assets[stageId];
              if (stageId && stage && motionAssetLocationFamily(stage) === family) choices.push({ optionId: family + RT_SHARED.SYMBOL_D2E2AD + index, stageId, family, name: RT_SHARED.NAME in stage ? stage.name : family, needs: variant });
            } catch (error) {
              if (!recoverableSetFailure(error)) throw error;
            }
          }
        if (choices.length) places.push({ key: place.key, name: place.name, description: place.description || place.name, options: choices });
      }
    if (failure && !places.length) throw failure;
    const repairKey = stringifyJson([conflicts, places, draft.places, failure?.message]);
    if (options.state.checkedRepairs?.includes(repairKey)) throw failure || new Error(R.FAILED);
    options.log(R.LOG);
    const ids = [...conflicts.map((member) => R.CAST_ID + member.key), ...places.map((place) => R.PLACE_ID + place.key)];
    const ledger = new MotionRepairLedger<Record<string, any>>(ids, (row, id) => {
      const member = conflicts.find((member) => R.CAST_ID + member.key === id);
      if (member) return row.gender === member.expected ? [] : [{ path: RT_SHARED.GENDER, reason: R.INVALID }];
      const place = places.find((place) => R.PLACE_ID + place.key === id)!;
      const option = place.options.find((option) => option.optionId === row.optionId);
      return [
        ...(!option ? [{ path: RT_SERVER.OPTIONID, reason: R.INVALID }] : []),
        ...(typeof row.name !== "string" || !row.name.trim() || (option && motionLocationFamily(row.name) && motionLocationFamily(row.name) !== option.family) ? [{ path: RT_SHARED.NAME, reason: R.INVALID }] : []),
        ...(typeof row.description !== "string" || !row.description.trim() || (option && (motionLocationFamily(row.name || "") || motionLocationFamily(row.description)) !== option.family) ? [{ path: RT_SERVER.DESCRIPTION, reason: R.INVALID }] : []),
      ];
    });
    ledger.submit(options.state.rows || []);
    const state = (options.state.repair ||= { rejected: options.state.attempts, errors: options.state.errors });
    const save = () => {
      for (const { id, value } of ledger.accepted()) {
        const member = draft.cast.find((member) => R.CAST_ID + member.key === id);
        if (member) member.gender = value.gender;
        const place = draft.places.find((place) => R.PLACE_ID + place.key === id);
        if (place) {
          place.name = value.name;
          place.description = value.description;
        }
      }
      options.state.rows = ledger.snapshot();
      options.state.attempts = state.rejected;
      options.state.errors = state.errors;
      options.save(draft);
    };
    const prompt = () =>
      R.PROMPT(
        { chapters: draft.chapters.filter((chapter) => places.some((place) => (draft.illustrationNeeds || []).some((need) => need.place === place.key && need.chapterId === chapter.id))).map((chapter) => ({ id: chapter.id, summary: chapter.summary, keyPoints: chapter.keyPoints })) },
        conflicts.filter((member) => ledger.pending().some((item) => item.id === R.CAST_ID + member.key)),
        places.filter((place) => ledger.pending().some((item) => item.id === R.PLACE_ID + place.key)),
        stringifyJson({ pending: ledger.pending(), errors: state.errors }),
      );
    if (ledger.pending().length) {
      const contract = {
        attempts: P.CONTRACT_ROUTE_ATTEMPTS,
        routeAttempts: P.CONTRACT_ROUTE_ATTEMPTS,
        budget: P.CONTRACT_TOTAL_ATTEMPTS,
        state,
        checkpoint: save,
        start: prompt,
        repair: prompt,
        failure: () => new Error(R.FAILED),
        assess: (raw: any) => {
          ledger.submit([...(Array.isArray(raw?.cast) ? raw.cast.map((row: any) => ({ id: R.CAST_ID + row?.key, value: row })) : []), ...(Array.isArray(raw?.places) ? raw.places.map((row: any) => ({ id: R.PLACE_ID + row?.key, value: row })) : [])]);
          save();
          return { value: ledger.snapshot(), errors: ledger.pending().map((item) => item.id + RT_SHARED.SYMBOL_45822F + item.errors.map((error) => error.path).join(RT_SHARED.SYMBOL_D03502)) };
        },
      };
      if (options.ai) await requestMotionAiContract(prompt(), options.exec, (question) => options.ai!(question, R.ARTIFACT, options.exec, options.signal, options.log), contract, options.signal);
      else await runMotionAi(prompt(), R.ARTIFACT, options.exec, options.signal, options.log, undefined, 0, contract);
    }
    save();
    (options.state.checkedRepairs ||= []).push(repairKey);
    options.save(draft);
  }
};
