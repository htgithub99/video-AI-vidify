import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { StoryboardScene } from "../types";

export interface SceneVisualQuality {
  anatomy: number;
  subjectCount: number;
  promptAlignment: number;
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
  correctivePrompt: string;
}

export interface SceneVisualQualityResult {
  success: boolean;
  approved: boolean;
  quality?: SceneVisualQuality;
  error?: string;
}

export const VISUAL_QA_CONFIG = {
  MIN_GENERAL_SCORE: 80,
  MIN_CHARACTER_SCORE: 85,
  HARD_MIN_SCORE: 60,
  MAX_RETRIES: 2,
} as const;

const normalizeQuality = (
  source: Partial<SceneVisualQuality>,
): SceneVisualQuality => ({
  anatomy: _.clamp(_.toNumber(source.anatomy), 0, 100),
  subjectCount: _.clamp(_.toNumber(source.subjectCount), 0, 100),
  promptAlignment: _.clamp(_.toNumber(source.promptAlignment), 0, 100),
  characterConsistency: _.clamp(
    _.toNumber(source.characterConsistency),
    0,
    100,
  ),
  composition: _.clamp(_.toNumber(source.composition), 0, 100),
  styleConsistency: _.clamp(_.toNumber(source.styleConsistency), 0, 100),
  editability: _.clamp(_.toNumber(source.editability), 0, 100),
  unwantedText: Boolean(source.unwantedText),
  multiPanelLayout: Boolean(source.multiPanelLayout),
  duplicatedSubjects: Boolean(source.duplicatedSubjects),
  usableForVideo: Boolean(source.usableForVideo),
  blockingErrors: _.uniq(_.compact(_.castArray(source.blockingErrors))),
  warnings: _.uniq(_.compact(_.castArray(source.warnings))),
  correctivePrompt: _.trim(_.toString(source.correctivePrompt)),
});

export const isSceneVisualQualityApproved = (
  quality: SceneVisualQuality,
): boolean =>
  _.every([quality.usableForVideo, _.isEmpty(quality.blockingErrors)], Boolean);

export const isSceneVisualQualityUsable = isSceneVisualQualityApproved;

export const validateSceneImage = async (
  projectId: string,
  scene: Pick<
    StoryboardScene,
    "id" | "script" | "prompt" | "assetUrl" | "expectedSubjectCount"
  >,
  referenceAssetUrl?: string,
  referenceAssetUrls: string[] = [],
): Promise<SceneVisualQualityResult> => {
  const response = await safeSystemFetch(
    API_ROUTES.PIPELINE_VALIDATE_SCENE_IMAGE,
    {
      projectId,
      sceneId: scene.id,
      script: scene.script,
      prompt: scene.prompt,
      assetUrl: scene.assetUrl,
      referenceAssetUrl,
      referenceAssetUrls,
      expectedSubjectCount: scene.expectedSubjectCount,
    },
  );

  if (
    !response.success ||
    !response.data?.success ||
    _.isEmpty(response.data?.quality)
  ) {
    return {
      success: false,
      approved: false,
      error: _.toString(
        _.defaultTo(response.error, REFACTOR_CONSTANTS.UNKNOWN_WARNING),
      ),
    };
  }

  const quality = normalizeQuality(response.data.quality);
  return {
    success: true,
    approved: isSceneVisualQualityApproved(quality),
    quality,
  };
};
