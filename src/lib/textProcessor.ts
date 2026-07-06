import { AspectRatio } from "../types.js";
import { SCENE_SPLIT_PROMPTS } from "../constants/texts.js";
import { SCENE_SPLIT_MOTIONS, SCENE_SPLIT_TRANSITIONS } from "../constants/data.js";
import { formatTimeHelper as formatTime } from "../lib/timeUtils.js";
import { ABBREVIATIONS, CONJUNCTIONS, boundaries, VIETNAMESE_VALID_CHARS_REGEX, SplitStrategy } from "../constants/index.js";

export const smartChunkScript = (
  script: string,
  maxChunkSize: number = 2500,
  minChunkSize: number = 2000,
): string[] => {
  if (!script || script.trim().length === 0) return [];
  if (script.length <= maxChunkSize) return [script.trim()];

  const chunks: string[] = [];
  let currentIdx = 0;

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
  const safeMaxWords = Math.max(12, maxWords);
  const words = sent.split(/\s+/).filter(Boolean);
  if (words.length <= safeMaxWords) {
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
        const cleanWord = word.slice(0, -1).toLowerCase().replace(VIETNAMESE_VALID_CHARS_REGEX, "");
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
        ...splitSentenceSafely(part1, safeMaxWords),
        ...splitSentenceSafely(part2, safeMaxWords)
      ];
    }
  }

  const conjSet = new Set<string>(CONJUNCTIONS);

  for (let i = startIdx; i <= endIdx; i++) {
    const word = words[i].toLowerCase().replace(VIETNAMESE_VALID_CHARS_REGEX, "");
    if (conjSet.has(word)) {
      const part1 = words.slice(0, i).join(" ");
      const part2 = words.slice(i).join(" ");
      return [
        ...splitSentenceSafely(part1, safeMaxWords),
        ...splitSentenceSafely(part2, safeMaxWords)
      ];
    }
  }

  const mid = Math.ceil(len / 2);
  const part1 = words.slice(0, mid).join(" ");
  const part2 = words.slice(mid).join(" ");
  return [
    ...splitSentenceSafely(part1, safeMaxWords),
    ...splitSentenceSafely(part2, safeMaxWords)
  ];
};

export function generateMockStoryboard(
  rewrittenScript: string,
  chapters: any[],
  isVi: boolean,
  style: string,
  density: number,
  voiceDuration?: number,
  splitStrategy?: string,
  aspectRatio: string = AspectRatio.SixteenNine,
) {
  interface SegmentWithContext {
    text: string;
    context: string;
  }

  const defaultStrategy = (text: string) => {
    const sentences = smartSplitSentences(text || "");
    return sentences.map(sent => ({ text: sent, context: sent }));
  };

  const SLICE_STRATEGIES: Record<string, (text: string) => SegmentWithContext[]> = {
    [SplitStrategy.MULTI_PROMPT]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 14)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.ULTRADENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 12)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.WORD]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 12)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.HYPERDENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 12)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.SHORT_SENTENCE]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 12)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.HIGHPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      for (const sent of smartSplitSentences(text)) {
        for (const clause of splitSentenceSafely(sent, 15)) res.push({ text: clause, context: sent });
      }
      return res;
    },
    [SplitStrategy.DRAMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 2) {
        const chunk = sentences.slice(i, i + 2).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    },
    [SplitStrategy.PARAGRAPH]: (text) => {
      const res: SegmentWithContext[] = [];
      const paragraphs = (text || "").split(/\n+/).map(p => p.trim()).filter(p => p.length > 10);
      for (const para of paragraphs) res.push({ text: para, context: para });
      if (res.length < 3) {
        const sentences = smartSplitSentences(text);
        res.length = 0;
        for (let i = 0; i < sentences.length; i += 3) {
          const chunk = sentences.slice(i, i + 3).join(". ");
          res.push({ text: chunk, context: chunk });
        }
      }
      return res;
    },
    [SplitStrategy.EPIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 4) {
        const chunk = sentences.slice(i, i + 4).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    },
    [SplitStrategy.CINEMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 5) {
        const chunk = sentences.slice(i, i + 5).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    },
    [SplitStrategy.ARTISTIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 6) {
        const chunk = sentences.slice(i, i + 6).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    },
    [SplitStrategy.SLOWPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 7) {
        const chunk = sentences.slice(i, i + 7).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    },
    [SplitStrategy.SUPER_SLOW]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      for (let i = 0; i < sentences.length; i += 10) {
        const chunk = sentences.slice(i, i + 10).join(". ");
        res.push({ text: chunk, context: chunk });
      }
      return res;
    }
  };

  const pList: SegmentWithContext[] = (SLICE_STRATEGIES[splitStrategy || ""] || defaultStrategy)(rewrittenScript || "");

  const totalWords = pList.reduce(
    (acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length,
    0,
  );

  let maxScenes = 250;

  const scenesCount = Math.min(maxScenes, pList.length > 0 ? pList.length : 8);
  const scenes: any[] = [];
  let currentTime = 0;

  const styleStr = style || "Realistic";
  const defaultChapters =
    chapters && chapters.length > 0
      ? chapters
      : [{ id: "ch_1", title: "Chapter 1" }];

  const promptConfig = isVi ? SCENE_SPLIT_PROMPTS.VN : SCENE_SPLIT_PROMPTS.EN;

  for (let i = 0; i < scenesCount; i++) {
    const chapter = defaultChapters[i % defaultChapters.length];
    const segment = pList[i];
    const scriptText = segment ? segment.text : promptConfig.DEFAULT_SCRIPT(i + 1);
    const contextText = segment ? segment.context : scriptText;

    const wordsCount = scriptText.split(/\s+/).filter(Boolean).length;
    let duration = 5;
    if (voiceDuration && totalWords > 0) {
      duration = Math.round((wordsCount / totalWords) * voiceDuration);
      if (duration < 3) duration = 3;
    } else {
      duration = Math.max(5, Math.min(20, Math.ceil(wordsCount / 2.2)));
    }

    if (voiceDuration && i === scenesCount - 1) {
      duration = Math.max(3, voiceDuration - currentTime);
    }

    const startTimeSeconds = currentTime;
    const endTimeSeconds = currentTime + duration;
    currentTime = endTimeSeconds;

    const motion = SCENE_SPLIT_MOTIONS[i % SCENE_SPLIT_MOTIONS.length];
    const effects = promptConfig.EFFECTS(styleStr);
    const transition = SCENE_SPLIT_TRANSITIONS[i % SCENE_SPLIT_TRANSITIONS.length];

    scenes.push({
      id: `sc_${i + 1}`,
      chapterId: chapter.id,
      startTime: formatTime(startTimeSeconds),
      endTime: formatTime(endTimeSeconds),
      duration,
      script: scriptText,
      subtitle: scriptText,
      prompt: promptConfig.PROMPT(contextText, styleStr, aspectRatio),
      cameraMotion: motion,
      effects,
      transition,
    });
  }

  return { scenes };
}
