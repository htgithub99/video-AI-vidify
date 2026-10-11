import * as MR from "../constants/motionRuntime.js";
import { trimMotionText } from "./motionUtils.js";
import type { MotionCreativeBlueprint } from "../types/motionVideo.js";
export const creativeBlueprintErrors = (value: any): string[] => {
  const errors: string[] = [];
  const text = (v: any) => typeof v === MR.MOTION_TEXT_STRING && v.trim().length > 0;
  const requiredText = (key: string, v: any) => { if (!text(v)) errors.push(MR.MOTION_TEMPLATE_CREATIVEBLUEPRINT_MUST_CONTAIN_USEFUL_TEXT(key)); };
  for (const key of [MR.MOTION_TEXT_INTENT, MR.MOTION_TEXT_AUDIENCE]) requiredText(key, value?.[key]);
  for (const [group, keys] of Object.entries({ narrative: [MR.MOTION_TEXT_VOICE, MR.MOTION_TEXT_STRUCTURE, MR.MOTION_TEXT_PACING], visualDna: [MR.MOTION_TEXT_STYLE, MR.MOTION_TEXT_COMPOSITION, MR.MOTION_TEXT_CAMERA, MR.MOTION_TEXT_LIGHTING, MR.MOTION_TEXT_PALETTE, MR.MOTION_TEXT_MATERIALS, MR.MOTION_TEXT_SUBJECTHIERARCHY], creativeProfile: [MR.MOTION_TEXT_ROLE] }))
    for (const key of keys) requiredText(MR.MOTION_TEMPLATE_SYMBOL_71(group, key), value?.[group]?.[key]);
  for (const [key, list] of Object.entries({ mustPreserve: value?.mustPreserve, mustVary: value?.mustVary, mustNotCopy: value?.mustNotCopy, "creativeProfile.writingPrinciples": value?.creativeProfile?.writingPrinciples, "creativeProfile.productionPrinciples": value?.creativeProfile?.productionPrinciples }))
    if (!Array.isArray(list) || !list.length || !list.every(text)) errors.push(MR.MOTION_TEMPLATE_CREATIVEBLUEPRINT_NEEDS_NON_EMPTY_TEXT_ITEMS(key));
  if (!Array.isArray(value?.uncertainties) || !value.uncertainties.every(text)) errors.push(MR.MOTION_TEXT_CREATIVEBLUEPRINT_UNCERTAINTIES_MUST_BE_A_TEXT_ARRAY);
  if (!Array.isArray(value?.evidence) || !value.evidence.length || !value.evidence.every((e: any) => text(e?.claim) && text(e?.sourceClue))) errors.push(MR.MOTION_TEXT_CREATIVEBLUEPRINT_EVIDENCE_NEEDS_CLAIMS_AND_SOURCE_CLUES);
  return errors;
};
export const normalizeCreativeBlueprint = (value: any): MotionCreativeBlueprint | undefined => {
  if (creativeBlueprintErrors(value).length) return undefined;
  const text = (value: string): string => trimMotionText(value);
  const list = (items: string[]) => items.slice(0, 20).map(text);
  return {
    intent: text(value.intent),
    audience: text(value.audience),
    narrative: { voice: text(value.narrative.voice), structure: text(value.narrative.structure), pacing: text(value.narrative.pacing) },
    visualDna: Object.fromEntries(
      Object.entries(value.visualDna)
        .filter(([key]) => [MR.MOTION_TEXT_STYLE, MR.MOTION_TEXT_COMPOSITION, MR.MOTION_TEXT_CAMERA, MR.MOTION_TEXT_LIGHTING, MR.MOTION_TEXT_PALETTE, MR.MOTION_TEXT_MATERIALS, MR.MOTION_TEXT_SUBJECTHIERARCHY].some((field) => field === key))
        .map(([key, v]) => [key, text(v as string)]),
    ) as MotionCreativeBlueprint["visualDna"],
    creativeProfile: { role: text(value.creativeProfile.role), writingPrinciples: list(value.creativeProfile.writingPrinciples), productionPrinciples: list(value.creativeProfile.productionPrinciples) },
    mustPreserve: list(value.mustPreserve),
    mustVary: list(value.mustVary),
    mustNotCopy: list(value.mustNotCopy),
    uncertainties: list(value.uncertainties),
    evidence: value.evidence.slice(0, 20).map((e: any) => ({ claim: text(e.claim), sourceClue: text(e.sourceClue) })),
  };
};
export const creativeBlueprintPrompt = (blueprint?: MotionCreativeBlueprint): string => (blueprint ? MR.MOTION_TEMPLATE_PROJECT_CREATIVE_BLUEPRINT_SOURCE_DERIVED_PLANNING_DATA_CARRY_THI(JSON.stringify(blueprint)) : MR.MOTION_TEXT_NO_CREATIVE_BLUEPRINT_IS_STORED_FOR_THIS_LEGACY_PROJECT_FOLLOW_IT);
