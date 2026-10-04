import {
  SOURCE_TEXT_ANATOMY,
  SOURCE_TEXT_CHARACTERCONSISTENCY,
  SOURCE_TEXT_COMPOSITION,
  SOURCE_TEXT_DUPLICATED_PRIMARY_SUBJECTS,
  SOURCE_TEXT_EDITABILITY,
  SOURCE_TEXT_ENVIRONMENTRELEVANCE,
  SOURCE_TEXT_IMAGE_NOT_USABLE_FOR_VIDEO,
  SOURCE_TEXT_NARRATIVEALIGNMENT,
  SOURCE_TEXT_STYLECONSISTENCY,
  SOURCE_TEXT_SUBJECTCOUNT,
  SOURCE_TEXT_UNWANTED_MULTI_PANEL_LAYOUT,
  SOURCE_TEXT_UNWANTED_READABLE_TEXT,
} from "../constants/sourceText";
import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { StoryboardScene } from "../types";
export const SCENE_VISUAL_QUALITY_CONFIG = {
  TARGET_SCORE: 85,
  TECHNICAL_ANATOMY_SCORE: 82,
  TECHNICAL_SUBJECT_COUNT_SCORE: 82,
  SEVERE_ALIGNMENT_SCORE: 70,
  MAX_REGENERATION_ATTEMPTS: 1,
  SCORE_FIELDS: [SOURCE_TEXT_ANATOMY, SOURCE_TEXT_SUBJECTCOUNT, SOURCE_TEXT_NARRATIVEALIGNMENT, SOURCE_TEXT_ENVIRONMENTRELEVANCE, SOURCE_TEXT_CHARACTERCONSISTENCY, SOURCE_TEXT_COMPOSITION, SOURCE_TEXT_STYLECONSISTENCY, SOURCE_TEXT_EDITABILITY],
} as const;
const TECHNICAL_DEFECT_PATTERN =
  /(?:anatom|limb|arm|hand|finger|leg|foot|head|face|body|merged|duplicate|anachron|wrong[_\s-]*(?:flag|uniform|era|period)|extra[_\s-]*(?:person|people|character|subject|arm|hand|finger|limb|leg|head)|missing[_\s-]*(?:person|character|subject|arm|hand|finger|limb|leg|head)|subject[_\s-]*count|wrong[_\s-]*(?:subject|character|action)|unwanted[_\s-]*text|gibberish|multi[_\s-]*(?:panel|frame)|collage|crop)/i;
export interface SceneVisualQuality {
  anatomy: number;
  subjectCount: number;
  promptAlignment: number;
  narrativeAlignment?: number;
  environmentRelevance?: number;
  characterConsistency: number;
  composition: number;
  styleConsistency: number;
  editability: number;
  unwantedText?: boolean;
  multiPanelLayout?: boolean;
  duplicatedSubjects?: boolean;
  usableForVideo: boolean;
  blockingErrors: string[];
  warnings: string[];
}
export interface SceneVisualQualityResult {
  success: boolean;
  approved: boolean;
  quality?: SceneVisualQuality;
  error?: string;
}
export interface SceneVisualValidationContext {
  purpose?: "scene" | "thumbnail" | "video";
  expectedHeadline?: string;
  layoutId?: string;
  typographyId?: string;
  adjacentAssetUrls?: string[];
}
const normalizeQuality = (source: Partial<SceneVisualQuality>): SceneVisualQuality => ({
  anatomy: _.clamp(_.toNumber(source.anatomy), 0, 100),
  subjectCount: _.clamp(_.toNumber(source.subjectCount), 0, 100),
  promptAlignment: _.clamp(_.toNumber(source.promptAlignment), 0, 100),
  narrativeAlignment: _.clamp(_.toNumber(_.defaultTo(source.narrativeAlignment, source.promptAlignment)), 0, 100),
  environmentRelevance: _.clamp(_.toNumber(_.defaultTo(source.environmentRelevance, source.promptAlignment)), 0, 100),
  characterConsistency: _.clamp(_.toNumber(source.characterConsistency), 0, 100),
  composition: _.clamp(_.toNumber(source.composition), 0, 100),
  styleConsistency: _.clamp(_.toNumber(source.styleConsistency), 0, 100),
  editability: _.clamp(_.toNumber(source.editability), 0, 100),
  unwantedText: Boolean(source.unwantedText),
  multiPanelLayout: Boolean(source.multiPanelLayout),
  duplicatedSubjects: Boolean(source.duplicatedSubjects),
  usableForVideo: Boolean(source.usableForVideo),
  blockingErrors: _.uniq(_.compact(_.castArray(source.blockingErrors))),
  warnings: _.uniq(_.compact(_.castArray(source.warnings))),
});
export const isSceneVisualQualityApproved = (quality: SceneVisualQuality): boolean => _.every([quality.usableForVideo, _.isEmpty(quality.blockingErrors), _.every(SCENE_VISUAL_QUALITY_CONFIG.SCORE_FIELDS, (field) => _.toNumber(_.get(quality, field)) >= SCENE_VISUAL_QUALITY_CONFIG.TARGET_SCORE)], Boolean);
export const getSceneVisualRegenerationReasons = (quality: SceneVisualQuality, textAllowed: boolean = false): string[] =>
  _.uniq(
    _.compact([quality.duplicatedSubjects && SOURCE_TEXT_DUPLICATED_PRIMARY_SUBJECTS, quality.multiPanelLayout && SOURCE_TEXT_UNWANTED_MULTI_PANEL_LAYOUT, quality.unwantedText && !textAllowed && SOURCE_TEXT_UNWANTED_READABLE_TEXT, !quality.usableForVideo && SOURCE_TEXT_IMAGE_NOT_USABLE_FOR_VIDEO, ..._.filter(quality.blockingErrors, (error) => TECHNICAL_DEFECT_PATTERN.test(error))]),
  ) as string[];
export const shouldRegenerateSceneImage = (quality: SceneVisualQuality, textAllowed: boolean = false): boolean => !_.isEmpty(getSceneVisualRegenerationReasons(quality, textAllowed));
export const validateSceneImage = async (
  projectId: string,
  scene: Pick<StoryboardScene, "id" | "script" | "prompt" | "generationPrompt" | "assetUrl" | "expectedSubjectCount" | "allowBackgroundPeople" | "visualIntent" | "visibleAction" | "storyEvidence" | "archivalSourceUrl" | "archivalLicense">,
  referenceAssetUrl?: string,
  referenceAssetUrls: string[] = [],
  context: SceneVisualValidationContext = {},
): Promise<SceneVisualQualityResult> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE, {
    bypassCache: true,
    projectId,
    sceneId: scene.id,
    script: scene.script,
    prompt: scene.generationPrompt || scene.prompt,
    assetUrl: scene.assetUrl,
    referenceAssetUrl,
    referenceAssetUrls,
    expectedSubjectCount: scene.expectedSubjectCount,
    allowBackgroundPeople: Boolean(scene.allowBackgroundPeople),
    visualIntent: scene.visualIntent,
    visibleAction: scene.visibleAction,
    storyEvidence: scene.storyEvidence,
    archivalSourceUrl: scene.archivalSourceUrl,
    archivalLicense: scene.archivalLicense,
    qaPurpose: context.purpose,
    expectedHeadline: context.expectedHeadline,
    layoutId: context.layoutId,
    typographyId: context.typographyId,
    adjacentAssetUrls: _.take(_.compact(context.adjacentAssetUrls), 2),
  });
  if (!response.success || !response.data?.success || _.isEmpty(response.data?.quality)) {
    return { success: false, approved: false, error: _.toString(_.defaultTo(response.error, REFACTOR_CONSTANTS.UNKNOWN_WARNING)) };
  }
  const quality = normalizeQuality(response.data.quality);
  return { success: true, approved: isSceneVisualQualityApproved(quality), quality };
};
