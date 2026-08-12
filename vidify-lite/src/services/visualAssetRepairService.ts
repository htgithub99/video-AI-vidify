import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, VISUAL_ASSET_REPAIR_CONFIG } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { GenerateType, ImageGeneratorEngine, StoryboardScene } from "../types";
import { createProjectImageUrl, ProjectImageResult } from "./projectImageGenerationService";
import { SceneVisualQualityResult, validateSceneImage } from "./sceneVisualQualityService";

interface VisualAssetRepairOptions {
  projectId: string;
  target: Pick<StoryboardScene, "id" | "script" | "prompt" | "generationPrompt" | "assetUrl" | "assetType" | "expectedSubjectCount">;
  style: string;
  resolution: string;
  engine: ImageGeneratorEngine;
  visualConfig: Record<string, unknown>;
  sandboxConfig: Record<string, unknown>;
  referenceAssetUrl?: string;
  referenceAssetUrls?: string[];
  signal?: AbortSignal;
}

const createRepairPrompt = (prompt: string, result: SceneVisualQualityResult): string => _.replace(
  _.replace(
    VISUAL_ASSET_REPAIR_CONFIG.PROMPT_TEMPLATE,
    VISUAL_ASSET_REPAIR_CONFIG.PROMPT_TOKEN,
    prompt,
  ),
  VISUAL_ASSET_REPAIR_CONFIG.FEEDBACK_TOKEN,
  _.join(_.uniq(_.compact([
    ..._.defaultTo(result.quality?.blockingErrors, []),
    ..._.defaultTo(result.quality?.warnings, []),
  ])), VISUAL_ASSET_REPAIR_CONFIG.FEEDBACK_SEPARATOR),
);

const generateReplacement = async (
  options: VisualAssetRepairOptions,
  prompt: string,
): Promise<string> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
    prompt,
    style: options.style,
    resolution: options.resolution,
    bypassCache: true,
    engine: options.engine,
    sandboxConfig: options.sandboxConfig,
    visualConfig: {
      ...options.visualConfig,
      referenceImages: options.referenceAssetUrls,
      generateType: _.isEqual(options.target.assetType, GenerateType.Video)
        ? GenerateType.Video
        : GenerateType.Image,
    },
  }, options.signal);
  const assetType = _.isEqual(options.target.assetType, GenerateType.Video)
    ? GenerateType.Video
    : GenerateType.Image;
  const result: ProjectImageResult = {
    sceneId: options.target.id,
    success: response.success && Boolean(response.data?.success ?? true),
    base64: response.data?.base64 || response.data?.imageBase64,
    fallbackUrl: response.data?.fallbackUrl,
    assetType,
  };
  const assetUrl = createProjectImageUrl(result);
  if (_.isEmpty(assetUrl)) throw new Error(VISUAL_ASSET_REPAIR_CONFIG.GENERATION_FAILED);
  return assetUrl;
};

export const validateAndRepairVisualAsset = async (
  options: VisualAssetRepairOptions,
): Promise<{ assetUrl: string; assetType: GenerateType.Image | GenerateType.Video; generationPrompt: string; quality: NonNullable<SceneVisualQualityResult["quality"]>; repaired: boolean }> => {
  let assetUrl = _.toString(options.target.assetUrl);
  const assetType = _.isEqual(options.target.assetType, GenerateType.Video)
    ? GenerateType.Video
    : GenerateType.Image;
  let generationPrompt = options.target.generationPrompt || options.target.prompt;
  for (let attempt = 0; attempt <= VISUAL_ASSET_REPAIR_CONFIG.MAX_ATTEMPTS; attempt++) {
    const result = await validateSceneImage(
      options.projectId,
      { ...options.target, assetUrl, generationPrompt },
      options.referenceAssetUrl,
      options.referenceAssetUrls,
    );
    if (!result.success || !result.quality) throw new Error(REFACTOR_CONSTANTS.ERR_VISUAL_QA_REQUIRED);
    if (result.approved) return { assetUrl, assetType, generationPrompt, quality: result.quality, repaired: attempt > 0 };
    if (_.isEqual(attempt, VISUAL_ASSET_REPAIR_CONFIG.MAX_ATTEMPTS)) break;
    generationPrompt = createRepairPrompt(generationPrompt, result);
    assetUrl = await generateReplacement(options, generationPrompt);
  }
  throw new Error(VISUAL_ASSET_REPAIR_CONFIG.QUALITY_REJECTED);
};
