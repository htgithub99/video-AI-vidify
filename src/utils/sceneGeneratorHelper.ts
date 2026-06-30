import { getSceneDensityPrompt } from "../constants/prompts.js";
import { appWarn, createAppError } from "../lib/logger.js";

export const SCENE_DENSITY_MAP = {
  THEO_TU: { maxChars: 20, label: "Theo từ" },
  CAU_NGAN: { maxChars: 75, label: "Câu ngắn" },
  DA_PHAN_CANH: { maxChars: 100, label: "Đa phân cảnh / Câu" },
  CAU_DAI: { maxChars: 150, label: "Câu dài" },
  THEO_DOAN: { maxChars: 300, label: "Theo đoạn" },
} as const;

export type SceneDensity = keyof typeof SCENE_DENSITY_MAP;

export interface GeneratedScene {
  scene_id: number;
  [key: string]: any;
}

export const smartChunkScript = (
  script: string,
  maxChunkSize: number = 2500,
  minChunkSize: number = 2000,
): string[] => {
  if (!script || script.trim().length === 0) return [];
  if (script.length <= maxChunkSize) return [script.trim()];

  const chunks: string[] = [];
  let currentIdx = 0;
  const boundaries = [".", "!", "?", "\n"];

  while (currentIdx < script.length) {
    let endIdx = currentIdx + maxChunkSize;

    if (endIdx >= script.length) {
      const finalChunk = script.slice(currentIdx).trim();
      if (finalChunk) chunks.push(finalChunk);
      break;
    }

    let cutPoint = endIdx;
    let foundBoundary = false;

    for (let i = endIdx; i > currentIdx + minChunkSize; i--) {
      if (boundaries.includes(script[i])) {
        cutPoint = i + 1;
        foundBoundary = true;
        break;
      }
    }

    if (!foundBoundary) {
      for (let i = endIdx; i > currentIdx; i--) {
        if (script[i] === " ") {
          cutPoint = i;
          break;
        }
      }
    }

    const chunk = script.slice(currentIdx, cutPoint).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    currentIdx = cutPoint;
  }

  return chunks;
};

const retryableLlmCall = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  chunkIndex: number,
): Promise<T> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      appWarn('CHUNK_RETRY_WARNING', chunkIndex, attempt, maxRetries + 1, error);
      if (attempt > maxRetries) {
        throw createAppError(
          `[Chunk ${chunkIndex}] Failed after ${maxRetries + 1} attempts: ${error}`,
        );
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
  const chunkSize = 1; // Pure sequential for free tier safety

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

    // Smooth out requests for free tier (15 RPM limit)
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

