import { getSceneDensityPrompt } from "../constants/prompts.js";
import { appWarn, createAppError } from "../lib/logger.js";
import { ABBREVIATIONS, CONJUNCTIONS, SCENE_DENSITY_MAP, boundaries, VIETNAMESE_VALID_CHARS_REGEX } from "../constants/index.js";

export type SceneDensity = keyof typeof SCENE_DENSITY_MAP;

export interface GeneratedScene {
  scene_id: number;
  [key: string]: any;
}

import { smartChunkScript } from "../lib/textProcessor.js";

const retryableLlmCall = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  chunkIndex: number,
): Promise<T> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      appWarn('CHUNK_RETRY_WARNING', chunkIndex, attempt, maxRetries + 1, error);
      if (error?.noRetry || attempt > maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw createAppError("Unable to execute LLM request.");
};

export const generateScenesWithChunking = async (
  script: string,
  density: SceneDensity,
  llmCallFn: (
    chunkText: string,
    targetPrompt: string,
    chunkIndex: number,
    totalChunks: number,
  ) => Promise<GeneratedScene[]>,
  maxChunkSize: number = 1300,
  minChunkSize: number = 900,
): Promise<GeneratedScene[]> => {
  const chunks = smartChunkScript(script, maxChunkSize, minChunkSize);
  const densityConfig = SCENE_DENSITY_MAP[density];

  const chunkResults: GeneratedScene[][] = [];
  const chunkSize = 1;

  const chunkTasks = chunks.map((chunk, index) => {
    const chunkLength = chunk.length;
    const minScenes = Math.floor(chunkLength / densityConfig.maxChars);
    const maxScenes = Math.floor(chunkLength / (densityConfig.maxChars * 0.8));

    const targetPrompt = getSceneDensityPrompt(
      chunkLength,
      densityConfig.label,
      densityConfig.maxChars,
      minScenes,
      maxScenes,
    );

    return () =>
      retryableLlmCall(() => llmCallFn(chunk, targetPrompt, index + 1, chunks.length), 2, index);
  });

  for (let i = 0; i < chunkTasks.length; i += chunkSize) {
    const chunkBatch = chunkTasks.slice(i, i + chunkSize);
    const batchResults = await Promise.all(chunkBatch.map((fn) => fn()));
    chunkResults.push(...batchResults);

    if (i + chunkSize < chunkTasks.length) {
      await new Promise((res) => setTimeout(res, 1500));
    }
  }

  let finalScenes: GeneratedScene[] = [];
  let currentIndex = 1;

  for (const chunkScenes of chunkResults) {
    for (const scene of chunkScenes) {
      finalScenes.push({
        ...scene,
        id: `sc_${currentIndex}`,
        scene_id: currentIndex,
      });
      currentIndex++;
    }
  }

  return finalScenes;
};
