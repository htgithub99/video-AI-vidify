import { getSceneDensityPrompt } from "../constants/prompts.js";
import { appWarn, createAppError } from "../lib/logger.js";
import { SCENE_DENSITY_MAP, COMMON_STRINGS, ERROR_MESSAGES, LLM_CONFIG } from "../constants/index.js";
import { lte, gt, map, floor, chunk, lt, subtract, flatten } from "lodash";

export type SceneDensity = keyof typeof SCENE_DENSITY_MAP;

export interface GeneratedScene {
  scene_id: number;
  [key: string]: any;
}

import { smartChunkScript } from "../lib/textProcessor.js";

const retryableLlmCall = async <T>(fn: () => Promise<T>, maxRetries: number = LLM_CONFIG.DEFAULT_MAX_RETRIES, chunkIndex: number): Promise<T> => {
  let attempt = 0;
  while (lte(attempt, maxRetries)) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      appWarn("CHUNK_RETRY_WARNING", chunkIndex, attempt, maxRetries + 1, error);
      if (error?.noRetry || gt(attempt, maxRetries)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, LLM_CONFIG.RETRY_DELAY_BASE * attempt));
    }
  }
  throw createAppError(ERROR_MESSAGES.LLM_EXECUTION_FAILED);
};

export const generateScenesWithChunking = async (script: string, density: SceneDensity, llmCallFn: (chunkText: string, targetPrompt: string, chunkIndex: number, totalChunks: number) => Promise<GeneratedScene[]>, maxChunkSize: number = LLM_CONFIG.DEFAULT_MAX_CHUNK_SIZE, minChunkSize: number = LLM_CONFIG.DEFAULT_MIN_CHUNK_SIZE): Promise<GeneratedScene[]> => {
  const chunks = smartChunkScript(script, maxChunkSize, minChunkSize);
  const densityConfig = SCENE_DENSITY_MAP[density];

  const chunkResults: GeneratedScene[][] = [];
  const chunkSize = 1;

  const chunkTasks = map(chunks, (chunkVal, index) => {
    const chunkLength = chunkVal.length;
    const minScenes = floor(chunkLength / densityConfig.maxChars);
    const maxScenes = floor(chunkLength / (densityConfig.maxChars * 0.8));

    const targetPrompt = getSceneDensityPrompt(chunkLength, densityConfig.label, densityConfig.maxChars, minScenes, maxScenes);

    return () => retryableLlmCall(() => llmCallFn(chunkVal, targetPrompt, index + 1, chunks.length), LLM_CONFIG.DEFAULT_MAX_RETRIES, index);
  });

  const chunkBatches = chunk(chunkTasks, chunkSize);
  for (let i = 0; lt(i, chunkBatches.length); i++) {
    const chunkBatch = chunkBatches[i];
    const batchResults = await Promise.all(map(chunkBatch, (fn) => fn()));
    chunkResults.push(...batchResults);

    if (lt(i, subtract(chunkBatches.length, 1))) {
      await new Promise((res) => setTimeout(res, LLM_CONFIG.BATCH_WAIT_DELAY));
    }
  }

  const flattened = flatten(chunkResults);
  const finalScenes = map(flattened, (scene, index) => {
    const currentIndex = index + 1;
    return {
      ...scene,
      id: `${COMMON_STRINGS.SCENE_PREFIX}${currentIndex}`,
      scene_id: currentIndex,
    };
  });

  return finalScenes;
};
