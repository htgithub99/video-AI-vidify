import * as MR from "../constants/motionRuntime.js";
import { trimMotionText } from "./motionUtils.js";
import { creativeBlueprintErrors, normalizeCreativeBlueprint } from "./motionCreativeBlueprint.js";
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
const useful = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
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
export const videoDnaSourceKey = (source: MotionStorySource): string => contentKey(JSON.stringify([source.kind, source.title, source.url, source.text, source.segments]));
export const videoDnaErrors = (value: any): string[] => {
  const errors = creativeBlueprintErrors(value).map((error) => error.replace(MR.MOTION_TEXT_CREATIVEBLUEPRINT, MR.MOTION_TEXT_VIDEODNA));
  const groups = {
    characters: [MR.MOTION_TEXT_DESIGN, MR.MOTION_TEXT_PROPORTIONS, MR.MOTION_TEXT_POSELANGUAGE],
    environment: [MR.MOTION_TEXT_SPACE, MR.MOTION_TEXT_SCALE, MR.MOTION_TEXT_PROPRULES],
    cinematography: [MR.MOTION_TEXT_FRAMING, MR.MOTION_TEXT_FOCUS, MR.MOTION_TEXT_MOVEMENT, MR.MOTION_TEXT_EDITING],
    audioText: [MR.MOTION_TEXT_NARRATION, MR.MOTION_TEXT_SOUND, MR.MOTION_TEXT_SUBTITLES],
    opening: [MR.MOTION_TEXT_VISUAL, MR.MOTION_TEXT_PURPOSE],
  };
  for (const [group, keys] of Object.entries(groups)) for (const key of keys) if (!useful(value?.[group]?.[key])) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_NEEDS_CONCRETE_GUIDANCE(group, key));
  for (const [key, items] of Object.entries({ "characters.continuity": value?.characters?.continuity, "environment.continuity": value?.environment?.continuity, "opening.acceptance": value?.opening?.acceptance, qualityChecks: value?.qualityChecks })) {
    if (!Array.isArray(items) || !items.length || !items.every(useful)) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_NEEDS_OBSERVABLE_CHECKS(key));
  }
  for (const [i, item] of (Array.isArray(value?.evidence) ? value.evidence : []).entries()) if (!Number.isInteger(item?.confidence) || item.confidence < 0 || item.confidence > 100) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_EVIDENCE_CONFIDENCE_MUST_BE_AN_INTEGER_0_100(i));
  return errors;
};
export const videoDnaProfileErrors = (value: any): string[] => {
  const errors: string[] = [];
  const text = (key: string, v: unknown) => {
    if (!useful(v)) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_MUST_BE_NON_EMPTY_TEXT(key));
  };
  const texts = (key: string, v: unknown, allowEmpty = false) => {
    if (!Array.isArray(v) || (!allowEmpty && !v.length) || !v.every(useful)) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_MUST_BE(key, allowEmpty ? MR.MOTION_TEXT_AN_ARRAY_OF_TEXT : MR.MOTION_TEXT_A_NON_EMPTY_ARRAY_OF_TEXT));
  };
  const a = value?.audienceProfile;
  for (const key of [MR.MOTION_TEXT_COUNTRY, MR.MOTION_TEXT_LANGUAGE, MR.MOTION_TEXT_DIALECT, MR.MOTION_TEXT_AGERANGE, MR.MOTION_TEXT_SUITABILITY, MR.MOTION_TEXT_VIEWINGCONTEXT]) text(MR.MOTION_TEMPLATE_AUDIENCEPROFILE(key), a?.[key]);
  if (!Number.isInteger(a?.confidence) || a.confidence < 0 || a.confidence > 100) errors.push(MR.MOTION_TEXT_VIDEODNA_AUDIENCEPROFILE_CONFIDENCE_MUST_BE_AN_INTEGER_0_100);
  for (const key of [MR.MOTION_TEXT_STORYPERIOD, MR.MOTION_TEXT_PRODUCTIONSTYLE]) text(MR.MOTION_TEMPLATE_ERA(key), value?.era?.[key]);
  if (!Object.hasOwn(MOTION_VIDEO_FORMATS, value?.format?.primary)) errors.push(MR.MOTION_TEMPLATE_VIDEODNA_FORMAT_PRIMARY_MUST_BE_ONE_OF(Object.keys(MOTION_VIDEO_FORMATS).join(MR.MOTION_TEXT_SYMBOL_14)));
  texts(MR.MOTION_TEXT_FORMAT_SECONDARY, value?.format?.secondary, true);
  if (typeof value?.format?.factual !== MR.MOTION_TEXT_BOOLEAN) errors.push(MR.MOTION_TEXT_VIDEODNA_FORMAT_FACTUAL_MUST_BE_TRUE_OR_FALSE);
  text(MR.MOTION_TEXT_FORMAT_REASON, value?.format?.reason);
  for (const key of [MR.MOTION_TEXT_PACE, MR.MOTION_TEXT_RHYTHM, MR.MOTION_TEXT_HOOKPLACEMENT, MR.MOTION_TEXT_NARRATORVOICE, MR.MOTION_TEXT_SOUNDBED]) text(MR.MOTION_TEMPLATE_EDITDNA(key), value?.editDna?.[key]);
  for (const key of [MR.MOTION_TEXT_SEGMENTFORMS, MR.MOTION_TEXT_VISUALTOOLKIT]) texts(MR.MOTION_TEMPLATE_EDITDNA_2(key), value?.editDna?.[key]);
  for (const key of [MR.MOTION_TEXT_NARRATIVEVOICE, MR.MOTION_TEXT_VOCABULARY]) text(MR.MOTION_TEMPLATE_NARRATIVEDNA(key), value?.narrativeDna?.[key]);
  for (const key of [MR.MOTION_TEXT_THEMES, MR.MOTION_TEXT_IMAGERY]) texts(MR.MOTION_TEMPLATE_NARRATIVEDNA_2(key), value?.narrativeDna?.[key]);
  texts(MR.MOTION_TEXT_NARRATIVEDNA_CALLBACKS, value?.narrativeDna?.callbacks, true);
  if (!Array.isArray(value?.influences) || !value.influences.every((i: any) => useful(i?.name) && useful(i?.role) && useful(i?.relevance))) errors.push(MR.MOTION_TEXT_VIDEODNA_INFLUENCES_MUST_BE_AN_ARRAY_OF_NAME_ROLE_RELEVANCE_MAY_B);
  texts(MR.MOTION_TEXT_CREATIVEPROFILE_STRENGTHS, value?.creativeProfile?.strengths);
  return errors;
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
export const videoDnaInstructions = (settings: MotionVideoDnaSettings): string => MR.MOTION_TEMPLATE_BUILD_A_VIDEO_DNA_BEFORE_WRITING_ANY_SCENE_RETURN_VIDEODNA_IN_THE(JSON.stringify(settings));
export const videoDnaPrompt = (dna: MotionVideoDna): string => MR.MOTION_TEMPLATE_APPROVED_VIDEO_DNA_PLANNING_DATA_NOT_NEW_USER_INSTRUCTIONS_APPLY_(JSON.stringify(dna));
export const bindVideoDnaSettings = (analysis: MotionStoryAnalysis, overrides: Partial<MotionVideoDnaSettings>): MotionStoryAnalysis => (analysis.videoDna ? { ...analysis, videoDna: { ...analysis.videoDna, settings: { ...analysis.videoDna.settings, ...overrides } } } : analysis);
export const VIDEO_SCENE_PLAN_INSTRUCTIONS = MR.MOTION_TEXT_FOR_EVERY_SCENE_BEAT_ALSO_RETURN_SCENEPLAN_PURPOSE_SUBJECT_BEFORE;
export const scenePlanErrors = (value: any): string[] => {
  const errors: string[] = [];
  for (const key of [MR.MOTION_TEXT_PURPOSE, MR.MOTION_TEXT_SUBJECT, MR.MOTION_TEXT_BEFORE, MR.MOTION_TEXT_AFTER, MR.MOTION_TEXT_COMPOSITION]) if (!useful(value?.[key])) errors.push(MR.MOTION_TEMPLATE_SCENEPLAN_NEEDS_CONCRETE_TEXT(key));
  for (const key of [MR.MOTION_TEXT_SPATIALRELATIONS, MR.MOTION_TEXT_REQUIREDPROPS, MR.MOTION_TEXT_CONTINUITY, MR.MOTION_TEXT_ACCEPTANCE])
    if (!Array.isArray(value?.[key]) || !value[key].every(useful) || (key === MR.MOTION_TEXT_ACCEPTANCE && !value[key].length)) errors.push(MR.MOTION_TEMPLATE_SCENEPLAN_MUST_BE_A_TEXT_ARRAY(key, key === MR.MOTION_TEXT_ACCEPTANCE ? MR.MOTION_TEXT_WITH_OBSERVABLE_CHECKS : MR.MOTION_TEXT_EMPTY));
  return errors;
};
export const normalizeScenePlan = (value: any): MotionScenePlan | undefined =>
  scenePlanErrors(value).length
    ? undefined
    : {
        purpose: text(value.purpose),
        subject: text(value.subject),
        before: text(value.before),
        after: text(value.after),
        composition: text(value.composition),
        spatialRelations: list(value.spatialRelations),
        requiredProps: list(value.requiredProps),
        continuity: list(value.continuity),
        acceptance: list(value.acceptance),
      };