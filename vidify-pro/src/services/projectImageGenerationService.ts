import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants } from "../constants";
import { safeSystemFetch, safeSystemFetchStream } from "../lib/shared-utils";

export interface ProjectImageItem {
  sceneId: string;
  prompt: string;
}

export interface ProjectImageResult {
  sceneId: string;
  success: boolean;
  base64?: string;
  fallbackUrl?: string;
  warning?: string;
}

type FallbackPayloadFactory = (item: ProjectImageItem) => object;

interface ProjectImageGenerationConfig {
  items: ProjectImageItem[];
  visualConfig: object;
  style?: string;
  sandboxConfig?: object;
  cancelRef?: { current: boolean };
  createFallbackPayload: FallbackPayloadFactory;
  onBatchResult: (result: ProjectImageResult) => void;
  onFallbackStart?: (error: Error, items: ProjectImageItem[]) => void;
  onFallbackItemStart?: (item: ProjectImageItem, index: number, total: number) => void;
  onFallbackResult?: (result: ProjectImageResult) => void;
}

export interface ProjectImageGenerationSummary {
  completedSceneIds: string[];
  failedSceneIds: string[];
  cancelled: boolean;
}

const hasImageResult = (result?: ProjectImageResult): boolean => (
  _.every([
    result?.success,
    _.some([result?.base64, result?.fallbackUrl], (value) => !_.isEmpty(value)),
  ], Boolean)
);

const isGenerationCancelled = (cancelRef?: { current: boolean }): boolean => (
  _.includes([true], Boolean(cancelRef?.current))
);

const createCountError = (template: string, count: number): Error => new Error(
  _.replace(
    template,
    SecurityConstants.PLACEHOLDER_0,
    _.toString(count),
  ),
);

const cleanBatchSession = async (): Promise<void> => {
  await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {});
};

const generateFallbackImage = async (
  item: ProjectImageItem,
  createPayload: FallbackPayloadFactory,
): Promise<ProjectImageResult> => {
  const response = await safeSystemFetch(
    API_ROUTES.PIPELINE_GENERATE_IMAGE,
    createPayload(item),
  );
  const base64 = _.get(response.data, REFACTOR_CONSTANTS.AVG_BASE64_KEY)
    || _.get(response.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
  const fallbackUrl = _.get(response.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);

  return {
    sceneId: item.sceneId,
    success: _.every([
      response.success,
      _.some([base64, fallbackUrl], Boolean),
    ], Boolean),
    base64,
    fallbackUrl,
    warning: response.error,
  };
};

export const createProjectImageUrl = (result: ProjectImageResult): string => {
  if (!_.isEmpty(result.base64)) {
    return _.join(
      [REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, result.base64],
      REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    );
  }
  return result.fallbackUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

export const generateProjectImages = async ({
  items,
  visualConfig,
  style,
  sandboxConfig,
  cancelRef,
  createFallbackPayload,
  onBatchResult,
  onFallbackStart,
  onFallbackItemStart,
  onFallbackResult,
}: ProjectImageGenerationConfig): Promise<ProjectImageGenerationSummary> => {
  const resultsBySceneId = new Map<string, ProjectImageResult>();
  let batchError: Error | undefined;

  try {
    try {
      await safeSystemFetchStream(
        API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES,
        {
          items,
          visualConfig,
          style,
          sandboxConfig,
        },
        (result: ProjectImageResult) => {
          resultsBySceneId.set(result.sceneId, result);
          onBatchResult(result);
        },
        undefined,
        undefined,
        cancelRef,
      );
    } catch (error) {
      batchError = error instanceof Error
        ? error
        : new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR);
    }

    if (isGenerationCancelled(cancelRef)) {
      return {
        completedSceneIds: [],
        failedSceneIds: [],
        cancelled: true,
      };
    }

    const fallbackItems = _.filter(
      items,
      (item) => !hasImageResult(resultsBySceneId.get(item.sceneId)),
    );

    if (!_.isEmpty(fallbackItems)) {
      const fallbackReason = batchError || createCountError(
        REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_INCOMPLETE,
        _.size(fallbackItems),
      );
      onFallbackStart?.(fallbackReason, fallbackItems);

      for (const [index, item] of fallbackItems.entries()) {
        if (isGenerationCancelled(cancelRef)) {
          break;
        }
        onFallbackItemStart?.(item, index, _.size(fallbackItems));
        try {
          const result = await generateFallbackImage(item, createFallbackPayload);
          resultsBySceneId.set(item.sceneId, result);
          onFallbackResult?.(result);
        } catch (error) {
          const failedResult: ProjectImageResult = {
            sceneId: item.sceneId,
            success: false,
            warning: error instanceof Error
              ? error.message
              : REFACTOR_CONSTANTS.UNKNOWN_WARNING,
          };
          resultsBySceneId.set(item.sceneId, failedResult);
          onFallbackResult?.(failedResult);
        }
      }
    }

    const completedSceneIds = _.map(
      _.filter(items, (item) => hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );
    const failedSceneIds = _.map(
      _.filter(items, (item) => !hasImageResult(resultsBySceneId.get(item.sceneId))),
      (item) => item.sceneId,
    );

    if (!_.isEmpty(failedSceneIds)) {
      throw createCountError(
        REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_FAILED,
        _.size(failedSceneIds),
      );
    }

    return {
      completedSceneIds,
      failedSceneIds,
      cancelled: isGenerationCancelled(cancelRef),
    };
  } finally {
    await cleanBatchSession();
  }
};
