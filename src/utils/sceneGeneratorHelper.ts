import { getSceneDensityPrompt } from "../constants/prompts.js";
import { appWarn, createAppError } from "../lib/logger.js";
import { ABBREVIATIONS, CONJUNCTIONS } from "../constants/data.js";

export const SCENE_DENSITY_MAP = {
  THEO_TU: { maxChars: 20, label: "Word-based (Ultra-dense)" },
  CAU_NGAN: { maxChars: 75, label: "Short sentence (Hyper-dense)" },
  DA_PHAN_CANH: { maxChars: 100, label: "Multi-scene (Clause-based)" },
  CAU_DAI: { maxChars: 150, label: "Long sentence (Standard)" },
  THEO_DOAN: { maxChars: 300, label: "Paragraph-based (Slow-paced)" },
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

export const smartSplitSentences = (text: string): string[] => {
  if (!text) return [];
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSentence += char;

    if (char === '.' || char === '?' || char === '!' || char === '\n') {
      if (char === '.') {
        if (i > 0 && i < text.length - 1 && /\d/.test(text[i - 1]) && /\d/.test(text[i + 1])) {
          continue;
        }

        const lastWordMatch = currentSentence.slice(0, -1).match(/(\b[a-zA-ZÀ-ỹ]+)$/);
        if (lastWordMatch) {
          const lastWord = lastWordMatch[1].toLowerCase();
          if ((ABBREVIATIONS as readonly string[]).includes(lastWord)) {
            continue;
          }
        }
      }

      if (char === '\n' || i === text.length - 1 || /\s/.test(text[i + 1])) {
        const trimmed = currentSentence.trim();
        if (trimmed) {
          sentences.push(trimmed);
        }
        currentSentence = "";
      }
    }
  }

  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences;
};

export const splitSentenceSafely = (sent: string, maxWords: number = 12): string[] => {
  const words = sent.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [sent];
  }

  const len = words.length;
  const startIdx = Math.floor(len * 0.3);
  const endIdx = Math.ceil(len * 0.7);

  const abbrSet = new Set<string>(ABBREVIATIONS);

  for (let i = startIdx; i <= endIdx; i++) {
    const word = words[i];
    if (/[伤害,.;:—\-\s]+$/.test(word)) {
      if (word.endsWith('.')) {
        const cleanWord = word.slice(0, -1).toLowerCase().replace(/[^a-zđâăêôơưàáảãạằắẳẵặầấẩẫậềếểễệồốổỗộờớởỡợừứửữựỳýỷỹỵ]/g, "");
        if (abbrSet.has(cleanWord)) {
          continue;
        }
        if (/\d$/.test(cleanWord) && i < len - 1 && /^\d/.test(words[i + 1])) {
          continue;
        }
      }

      const part1 = words.slice(0, i + 1).join(" ");
      const part2 = words.slice(i + 1).join(" ");
      return [
        ...splitSentenceSafely(part1, maxWords),
        ...splitSentenceSafely(part2, maxWords)
      ];
    }
  }

  const conjSet = new Set<string>(CONJUNCTIONS);

  for (let i = startIdx; i <= endIdx; i++) {
    const word = words[i].toLowerCase().replace(/[^a-zđâăêôơưàáảãạằắẳẵặầấẩẫậềếểễệồốổỗộờớởỡợừứửữựỳýỷỹỵ]/g, "");
    if (conjSet.has(word)) {
      const part1 = words.slice(0, i).join(" ");
      const part2 = words.slice(i).join(" ");
      return [
        ...splitSentenceSafely(part1, maxWords),
        ...splitSentenceSafely(part2, maxWords)
      ];
    }
  }

  const mid = Math.ceil(len / 2);
  const part1 = words.slice(0, mid).join(" ");
  const part2 = words.slice(mid).join(" ");
  return [
    ...splitSentenceSafely(part1, maxWords),
    ...splitSentenceSafely(part2, maxWords)
  ];
};

