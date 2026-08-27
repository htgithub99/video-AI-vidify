import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { StoryboardScene } from "../types";

export const SCENE_VISUAL_QUALITY_CONFIG = { TARGET_SCORE: 85, TECHNICAL_ANATOMY_SCORE: 82, TECHNICAL_SUBJECT_COUNT_SCORE: 82, SEVERE_ALIGNMENT_SCORE: 70, MAX_REGENERATION_ATTEMPTS: 2, SCORE_FIELDS: ["anatomy", "subjectCount", "narrativeAlignment", "environmentRelevance", "characterConsistency", "composition", "styleConsistency", "editability"], } as const;

const TECHNICAL_DEFECT_PATTERN = /(?:anatom|limb|arm|hand|finger|leg|foot|head|face|body|merged|duplicate|anachron|wrong[_\s-]*(?:flag|uniform|era|period)|extra[_\s-]*(?:person|people|character|subject|arm|hand|finger|limb|leg|head)|missing[_\s-]*(?:person|character|subject|arm|hand|finger|limb|leg|head)|subject[_\s-]*count|wrong[_\s-]*(?:subject|character|action)|unwanted[_\s-]*text|gibberish|multi[_\s-]*(?:panel|frame)|collage|crop)/i;

export interface SceneVisualQuality { anatomy: number; subjectCount: number; promptAlignment: number; narrativeAlignment?: number; environmentRelevance?: number; characterConsistency: number; composition: number; styleConsistency: number; editability: number; unwantedText?: boolean; multiPanelLayout?: boolean; duplicatedSubjects?: boolean; usableForVideo: boolean; blockingErrors: string[]; warnings: string[]; }

export interface SceneVisualQualityResult { success: boolean; approved: boolean; quality?: SceneVisualQuality; error?: string; }

export interface SceneVisualValidationContext { purpose?: "scene" | "thumbnail" | "video"; expectedHeadline?: string; layoutId?: string; typographyId?: string; adjacentAssetUrls?: string[]; }

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
    _.compact([ quality.anatomy < SCENE_VISUAL_QUALITY_CONFIG.TECHNICAL_ANATOMY_SCORE && "invalid_anatomy_or_extra_limbs",
      quality.subjectCount < SCENE_VISUAL_QUALITY_CONFIG.TECHNICAL_SUBJECT_COUNT_SCORE && "wrong_or_duplicated_subject_count",
      quality.duplicatedSubjects && "duplicated_primary_subjects",
      quality.multiPanelLayout && "unwanted_multi_panel_layout",
      quality.unwantedText && !textAllowed && "unwanted_readable_text",
      quality.narrativeAlignment! < SCENE_VISUAL_QUALITY_CONFIG.SEVERE_ALIGNMENT_SCORE && "material_narrative_mismatch",
      !quality.usableForVideo && "image_not_usable_for_video",
      ..._.filter(quality.blockingErrors, (error) => TECHNICAL_DEFECT_PATTERN.test(error)), ]),
  ) as string[];

export const shouldRegenerateSceneImage = (quality: SceneVisualQuality, textAllowed: boolean = false): boolean => !_.isEmpty(getSceneVisualRegenerationReasons(quality, textAllowed));

export const createTechnicalQaRegenerationPrompt = (prompt: string, reasons: string[]): string => {
  const correction = `Fresh regeneration of the same exact scene; preserve all story, character, style, camera and composition requirements while correcting only these detected technical defects: ${_.join(reasons, ", ")}. Produce one coherent single-frame image with natural complete anatomy and exactly the requested primary subjects.`;
  const aspectMatch = prompt.match(/\s+--ar\s+[^\s]+\s*$/i);
  if (!aspectMatch || aspectMatch.index === undefined) return `${_.trim(prompt)} ${correction}`;
  return `${_.trim(prompt.slice(0, aspectMatch.index))} ${correction}${aspectMatch[0]}`;
};

export const validateSceneImage = async (projectId: string, scene: Pick<StoryboardScene, "id" | "script" | "prompt" | "generationPrompt" | "assetUrl" | "expectedSubjectCount" | "allowBackgroundPeople" | "visualIntent" | "visibleAction" | "storyEvidence" | "archivalSourceUrl" | "archivalLicense">, referenceAssetUrl?: string, referenceAssetUrls: string[] = [], context: SceneVisualValidationContext = {}): Promise<SceneVisualQualityResult> => {
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
    return { success: false, approved: false, error: _.toString(_.defaultTo(response.error, REFACTOR_CONSTANTS.UNKNOWN_WARNING)), };
  }

  const quality = normalizeQuality(response.data.quality);
  return { success: true, approved: isSceneVisualQualityApproved(quality), quality, };
};
