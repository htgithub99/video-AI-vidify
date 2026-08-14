import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { StoryboardScene } from "../types";

export const SCENE_VISUAL_QUALITY_CONFIG = {
  TARGET_SCORE: 85,
  SCORE_FIELDS: ["anatomy", "subjectCount", "narrativeAlignment", "environmentRelevance", "characterConsistency", "composition", "styleConsistency", "editability"],
} as const;

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
  purpose?: "scene" | "thumbnail";
  expectedHeadline?: string;
  layoutId?: string;
  typographyId?: string;
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

export const isSceneVisualQualityApproved = (quality: SceneVisualQuality): boolean => _.every([
  quality.usableForVideo,
  _.isEmpty(quality.blockingErrors),
  _.every(SCENE_VISUAL_QUALITY_CONFIG.SCORE_FIELDS, field => _.toNumber(_.get(quality, field)) >= SCENE_VISUAL_QUALITY_CONFIG.TARGET_SCORE),
], Boolean);

export const validateSceneImage = async (
  projectId: string,
  scene: Pick<StoryboardScene, "id" | "script" | "prompt" | "generationPrompt" | "assetUrl" | "expectedSubjectCount">,
  referenceAssetUrl?: string,
  referenceAssetUrls: string[] = [],
  context: SceneVisualValidationContext = {},
): Promise<SceneVisualQualityResult> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE, {
    projectId,
    sceneId: scene.id,
    script: scene.script,
    prompt: scene.generationPrompt || scene.prompt,
    assetUrl: scene.assetUrl,
    referenceAssetUrl,
    referenceAssetUrls,
    expectedSubjectCount: scene.expectedSubjectCount,
    qaPurpose: context.purpose,
    expectedHeadline: context.expectedHeadline,
    layoutId: context.layoutId,
    typographyId: context.typographyId,
  });

  if (!response.success || !response.data?.success || _.isEmpty(response.data?.quality)) {
    return {
      success: false,
      approved: false,
      error: _.toString(_.defaultTo(response.error, REFACTOR_CONSTANTS.UNKNOWN_WARNING)),
    };
  }

  const quality = normalizeQuality(response.data.quality);
  return {
    success: true,
    approved: isSceneVisualQualityApproved(quality),
    quality,
  };
};
