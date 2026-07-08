import { getSceneDensityPrompt } from "../constants/prompts.js";
import { appWarn, createAppError } from "../lib/logger.js";
import { SCENE_DENSITY_MAP, COMMON_STRINGS, ERROR_MESSAGES, LLM_CONFIG } from "../constants/index.js";

export type SceneDensity = keyof typeof SCENE_DENSITY_MAP;

export interface GeneratedScene {
  scene_id: number;
  [key: string]: any;
}

import { smartChunkScript } from "../lib/textProcessor.js";

const retryableLlmCall = async <T>(fn: () => Promise<T>, maxRetries: number = LLM_CONFIG.DEFAULT_MAX_RETRIES, chunkIndex: number): Promise<T> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      appWarn("CHUNK_RETRY_WARNING", chunkIndex, attempt, maxRetries + 1, error);
      if (error?.noRetry || attempt > maxRetries) {
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

  const chunkTasks = chunks.map((chunk, index) => {
    const chunkLength = chunk.length;
    const minScenes = Math.floor(chunkLength / densityConfig.maxChars);
    const maxScenes = Math.floor(chunkLength / (densityConfig.maxChars * 0.8));

    const targetPrompt = getSceneDensityPrompt(chunkLength, densityConfig.label, densityConfig.maxChars, minScenes, maxScenes);

    return () => retryableLlmCall(() => llmCallFn(chunk, targetPrompt, index + 1, chunks.length), LLM_CONFIG.DEFAULT_MAX_RETRIES, index);
  });

  for (let i = 0; i < chunkTasks.length; i += chunkSize) {
    const chunkBatch = chunkTasks.slice(i, i + chunkSize);
    const batchResults = await Promise.all(chunkBatch.map((fn) => fn()));
    chunkResults.push(...batchResults);

    if (i + chunkSize < chunkTasks.length) {
      await new Promise((res) => setTimeout(res, LLM_CONFIG.BATCH_WAIT_DELAY));
    }
  }

  let finalScenes: GeneratedScene[] = [];
  let currentIndex = 1;

  for (const chunkScenes of chunkResults) {
    for (const scene of chunkScenes) {
      finalScenes.push({
        ...scene,
        id: `${COMMON_STRINGS.SCENE_PREFIX}${currentIndex}`,
        scene_id: currentIndex,
      });
      currentIndex++;
    }
  }

  return finalScenes;
};
