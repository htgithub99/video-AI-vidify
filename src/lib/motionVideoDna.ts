import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { stringifyJson } from "./jsonStringify.js";
import * as MR from "../constants/motionRuntime.js";
import { trimMotionText } from "./motionUtils.js";
import { normalizeCreativeBlueprint } from "./motionCreativeBlueprint.js";
import { MOTION_DNA_CORE_SCHEMA, MOTION_DNA_PROFILE_SCHEMA, MOTION_SCENE_PLAN_SCHEMA } from "../constants/motionResponseContract.js";
import { motionResponseErrors, normalizeMotionResponseText } from "./motionResponseContract.js";
import type { MotionScenePlan, MotionStoryAnalysis, MotionStorySource, MotionVideoDna, MotionVideoDnaSettings } from "../types/motionVideo.js";
export const VIDEO_DNA_PLANNING_INSTRUCTIONS = MR.MOTION_TEXT_BEFORE_WRITING_SCENES_WORK_SIMULTANEOUSLY_AS_A_CONTENT_RESEARCHER;
export const MOTION_VIDEO_FORMATS = {
  story: MR.MOTION_TEXT_NARRATED_STORY_WITH_CHARACTERS_AND_SCENES_FICTION_FOLK_TALE_TRUE_,
  documentary: MR.MOTION_TEXT_CHRONOLOGICAL_OR_ANTHOLOGY_DOCUMENTARY_BUILT_FROM_REAL_EVENTS_PEO,
  explainer: MR.MOTION_TEXT_EXPLAINS_HOW_OR_WHY_SOMETHING_WORKS_DIAGRAMS_COMPARISONS_STEP_BY_,
  listicle: MR.MOTION_TEXT_RANKED_OR_NUMBERED_LIST_OF_ITEMS_EACH_ITEM_A_SHORT_SELF_CONTAINED,
  news: MR.MOTION_TEXT_RECAP_OF_A_RECENT_EVENT_HEADLINE_WHAT_HAPPENED_TIMELINE_WHY_IT_MA,
  biography: MR.MOTION_TEXT_THE_LIFE_AND_WORK_OF_ONE_REAL_PERSON,
  promo: MR.MOTION_TEXT_PRESENTS_A_PRODUCT_PLACE_OR_SERVICE_HOOK_BENEFITS_PROOF_CALL_TO_A,
} as const;
export const VIDEO_DNA_PROFILE_INSTRUCTIONS = MR.MOTION_TEMPLATE_VIDEO_DNA_PROFILE_DERIVE_IT_FROM_EVIDENCE_EXACTLY_AS_A_MUSIC_PROD(
  Object.keys(MOTION_VIDEO_FORMATS).join(MR.MOTION_TEXT_SYMBOL_28),
  Object.entries(MOTION_VIDEO_FORMATS)
    .map(([k, v]) => MR.MOTION_TEMPLATE_SYMBOL_330(k, v))
    .join(MR.MOTION_TEXT_SYMBOL_41),
);
const text = (value: string): string => trimMotionText(value);
const list = (items: string[]): string[] => items.slice(0, 20).map(text);
const contentKey = (input: string): string => {
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < input.length; i++) {
    a = Math.imul(a ^ input.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ input.charCodeAt(i);
  }
  return MR.MOTION_TEMPLATE_SYMBOL_80(input.length, (a >>> 0).toString(16), (b >>> 0).toString(16));
};
export const videoDnaSourceKey = (source: MotionStorySource): string => contentKey(stringifyJson([source.kind, source.title, source.url, source.text, source.segments]));
export const normalizeMotionDnaResponse = (value: any): any => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const schema = { ...MOTION_DNA_CORE_SCHEMA, properties: { ...MOTION_DNA_CORE_SCHEMA.properties, evidence: {} } };
  return normalizeMotionResponseText(normalizeMotionResponseText(value, schema), { ...MOTION_DNA_PROFILE_SCHEMA, properties: { ...MOTION_DNA_PROFILE_SCHEMA.properties, influences: {} } });
};
export const videoDnaErrors = (value: any): string[] => {
  return motionResponseErrors(value, MOTION_DNA_CORE_SCHEMA, RT_CORE.VIDEODNA);
};
export const videoDnaProfileErrors = (value: any): string[] => {
  return motionResponseErrors(value, MOTION_DNA_PROFILE_SCHEMA, RT_CORE.VIDEODNA);
};
const profileOf = (value: any): Pick<MotionVideoDna, "audienceProfile" | "era" | "format" | "editDna" | "narrativeDna" | "influences"> & { strengths?: string[] } => {
  if (videoDnaProfileErrors(value).length) return {};
  const fields = (group: any, keys: string[]) => Object.fromEntries(keys.map((key) => [key, text(group[key])]));
  return {
    audienceProfile: { ...fields(value.audienceProfile, [MR.MOTION_TEXT_COUNTRY, MR.MOTION_TEXT_LANGUAGE, MR.MOTION_TEXT_DIALECT, MR.MOTION_TEXT_AGERANGE, MR.MOTION_TEXT_SUITABILITY, MR.MOTION_TEXT_VIEWINGCONTEXT]), confidence: value.audienceProfile.confidence } as NonNullable<MotionVideoDna["audienceProfile"]>,
    era: fields(value.era, [MR.MOTION_TEXT_STORYPERIOD, MR.MOTION_TEXT_PRODUCTIONSTYLE]) as NonNullable<MotionVideoDna["era"]>,
    format: { primary: value.format.primary, secondary: list(value.format.secondary), factual: value.format.factual, reason: text(value.format.reason) },
    editDna: { ...fields(value.editDna, [MR.MOTION_TEXT_PACE, MR.MOTION_TEXT_RHYTHM, MR.MOTION_TEXT_HOOKPLACEMENT, MR.MOTION_TEXT_NARRATORVOICE, MR.MOTION_TEXT_SOUNDBED]), segmentForms: list(value.editDna.segmentForms), visualToolkit: list(value.editDna.visualToolkit) } as NonNullable<MotionVideoDna["editDna"]>,
    narrativeDna: { ...fields(value.narrativeDna, [MR.MOTION_TEXT_NARRATIVEVOICE, MR.MOTION_TEXT_VOCABULARY]), themes: list(value.narrativeDna.themes), imagery: list(value.narrativeDna.imagery), callbacks: list(value.narrativeDna.callbacks) } as NonNullable<MotionVideoDna["narrativeDna"]>,
    influences: value.influences.slice(0, 10).map((i: any) => ({ name: text(i.name), role: text(i.role), relevance: text(i.relevance) })),
    strengths: list(value.creativeProfile.strengths),
  };
};
export const normalizeVideoDna = (value: any, settings: MotionVideoDnaSettings, sourceKey: string): MotionVideoDna | undefined => {
  value = normalizeMotionDnaResponse(value);
  if (videoDnaErrors(value).length) return undefined;
  const base = normalizeCreativeBlueprint(value)!;
  const fields = (group: any, keys: string[]) => Object.fromEntries(keys.map((key) => [key, text(group[key])]));
  return {
    ...base,
    version: 1,
    sourceKey,
    settings: { ...settings },
    ...(({ strengths, ...profile }) => ({ ...profile, ...(strengths ? { creativeProfile: { ...base.creativeProfile, strengths } } : {}) }))(profileOf(value)),
    characters: { ...fields(value.characters, [MR.MOTION_TEXT_DESIGN, MR.MOTION_TEXT_PROPORTIONS, MR.MOTION_TEXT_POSELANGUAGE]), continuity: list(value.characters.continuity) } as MotionVideoDna["characters"],
    environment: { ...fields(value.environment, [MR.MOTION_TEXT_SPACE, MR.MOTION_TEXT_SCALE, MR.MOTION_TEXT_PROPRULES]), continuity: list(value.environment.continuity) } as MotionVideoDna["environment"],
    cinematography: fields(value.cinematography, [MR.MOTION_TEXT_FRAMING, MR.MOTION_TEXT_FOCUS, MR.MOTION_TEXT_MOVEMENT, MR.MOTION_TEXT_EDITING]) as MotionVideoDna["cinematography"],
    audioText: fields(value.audioText, [MR.MOTION_TEXT_NARRATION, MR.MOTION_TEXT_SOUND, MR.MOTION_TEXT_SUBTITLES]) as MotionVideoDna["audioText"],
    opening: { visual: text(value.opening.visual), purpose: text(value.opening.purpose), acceptance: list(value.opening.acceptance) },
    qualityChecks: list(value.qualityChecks),
    evidence: value.evidence.slice(0, 20).map((item: any) => ({ claim: text(item.claim), sourceClue: text(item.sourceClue), confidence: item.confidence })),
  };
};
export const videoDnaInstructions = (settings: MotionVideoDnaSettings): string => MR.MOTION_TEMPLATE_BUILD_A_VIDEO_DNA_BEFORE_WRITING_ANY_SCENE_RETURN_VIDEODNA_IN_THE(stringifyJson(settings));
export const videoDnaPrompt = (dna: MotionVideoDna): string => MR.MOTION_TEMPLATE_APPROVED_VIDEO_DNA_PLANNING_DATA_NOT_NEW_USER_INSTRUCTIONS_APPLY_(stringifyJson(dna));
export const bindVideoDnaSettings = (analysis: MotionStoryAnalysis, overrides: Partial<MotionVideoDnaSettings>): MotionStoryAnalysis => (analysis.videoDna ? { ...analysis, videoDna: { ...analysis.videoDna, settings: { ...analysis.videoDna.settings, ...overrides } } } : analysis);
export const VIDEO_SCENE_PLAN_INSTRUCTIONS = MR.MOTION_TEXT_FOR_EVERY_SCENE_BEAT_ALSO_RETURN_SCENEPLAN_PURPOSE_SUBJECT_BEFORE;
export const scenePlanErrors = (value: any): string[] => {
  return motionResponseErrors(value, MOTION_SCENE_PLAN_SCHEMA, RT_CORE.SCENEPLAN);
};
export const normalizeScenePlan = (value: any): MotionScenePlan | undefined =>
  scenePlanErrors(value).length ? undefined : { purpose: text(value.purpose), subject: text(value.subject), before: text(value.before), after: text(value.after), composition: text(value.composition), spatialRelations: list(value.spatialRelations), requiredProps: list(value.requiredProps), continuity: list(value.continuity), acceptance: list(value.acceptance) };
