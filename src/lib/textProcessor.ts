import { AspectRatio } from "../types.js";
import { SCENE_SPLIT_PROMPTS } from "../constants/texts.js";
import { SCENE_SPLIT_MOTIONS, SCENE_SPLIT_TRANSITIONS } from "../constants/data.js";
import { formatTimeHelper as formatTime } from "../lib/timeUtils.js";
import { ABBREVIATIONS, CONJUNCTIONS, boundaries, VIETNAMESE_VALID_CHARS_REGEX, SplitStrategy } from "../constants/index.js";
import { isEmpty, trim, lte, lt, add, gte, includes, eq, toLower, max, compact, split, ceil, slice, join, concat, forEach, chunk, sumBy, min, isNil, endsWith, subtract } from "lodash";

export const smartChunkScript = (script: string, maxChunkSize: number = 2500, minChunkSize: number = 2000): string[] => {
  if (isEmpty(trim(script))) return [];
  if (lte(script.length, maxChunkSize)) return [trim(script)];

  const chunks: string[] = [];
  let currentIdx = 0;

  while (lt(currentIdx, script.length)) {
    let endIdx = add(currentIdx, maxChunkSize);

    if (gte(endIdx, script.length)) {
      const finalChunk = trim(script.slice(currentIdx));
      if (!isEmpty(finalChunk)) chunks.push(finalChunk);
      break;
    }

    let cutPoint = endIdx;
    let foundBoundary = false;

    for (let i = endIdx; gt(i, add(currentIdx, minChunkSize)); i--) {
      if (includes(boundaries, script[i])) {
        cutPoint = add(i, 1);
        foundBoundary = true;
        break;
      }
    }

    if (eq(foundBoundary, false)) {
      for (let i = endIdx; gt(i, currentIdx); i--) {
        if (eq(script[i], " ")) {
          cutPoint = i;
          break;
        }
      }
    }

    const chunkVal = trim(script.slice(currentIdx, cutPoint));
    if (!isEmpty(chunkVal)) {
      chunks.push(chunkVal);
    }

    currentIdx = cutPoint;
  }

  return chunks;
};

export const smartSplitSentences = (text: string): string[] => {
  if (isEmpty(text)) return [];
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; lt(i, text.length); i++) {
    const char = text[i];
    currentSentence += char;

    if (includes([".", "?", "!", "\n"], char)) {
      if (eq(char, ".")) {
        if (gt(i, 0) && lt(i, subtract(text.length, 1)) && /\d/.test(text[i - 1]) && /\d/.test(text[i + 1])) {
          continue;
        }

        const lastWordMatch = currentSentence.slice(0, -1).match(/(\b[a-zA-ZÀ-ỹ]+)$/);
        if (!isNil(lastWordMatch)) {
          const lastWord = toLower(lastWordMatch[1]);
          if (includes(ABBREVIATIONS, lastWord)) {
            continue;
          }
        }
      }

      if (eq(char, "\n") || eq(i, subtract(text.length, 1)) || /\s/.test(text[i + 1])) {
        const trimmed = trim(currentSentence);
        if (!isEmpty(trimmed)) {
          sentences.push(trimmed);
        }
        currentSentence = "";
      }
    }
  }

  if (!isEmpty(trim(currentSentence))) {
    sentences.push(trim(currentSentence));
  }

  return sentences;
};

export const splitSentenceSafely = (sent: string, maxWords: number = 12): string[] => {
  const safeMaxWords = max([12, maxWords]) || 12;
  const words = compact(split(sent, /\s+/));
  if (lte(words.length, safeMaxWords)) {
    return [sent];
  }

  const len = words.length;
  const startIdx = floor(len * 0.3);
  const endIdx = ceil(len * 0.7);

  for (let i = startIdx; lte(i, endIdx); i++) {
    const word = words[i];
    if (/[伤害,.;:—\-\s]+$/.test(word)) {
      if (endsWith(word, ".")) {
        const cleanWord = toLower(word.slice(0, -1)).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
        if (includes(ABBREVIATIONS, cleanWord)) {
          continue;
        }
        if (/\d$/.test(cleanWord) && lt(i, subtract(len, 1)) && /^\d/.test(words[i + 1])) {
          continue;
        }
      }

      const part1 = join(slice(words, 0, add(i, 1)), " ");
      const part2 = join(slice(words, add(i, 1)), " ");
      return concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  for (let i = startIdx; lte(i, endIdx); i++) {
    const word = toLower(words[i]).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
    if (includes(CONJUNCTIONS, word)) {
      const part1 = join(slice(words, 0, i), " ");
      const part2 = join(slice(words, i), " ");
      return concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  const mid = ceil(len / 2);
  const part1 = join(slice(words, 0, mid), " ");
  const part2 = join(slice(words, mid), " ");
  return concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
};

export function generateMockStoryboard(rewrittenScript: string, chapters: any[], isVi: boolean, style: string, density: number, voiceDuration?: number, splitStrategy?: string, aspectRatio: string = AspectRatio.SixteenNine) {
  interface SegmentWithContext {
    text: string;
    context: string;
  }

  const defaultStrategy = (text: string) => {
    const sentences = smartSplitSentences(text || "");
    return map(sentences, (sent) => ({ text: sent, context: sent }));
  };

  const SLICE_STRATEGIES: Record<string, (text: string) => SegmentWithContext[]> = {
    [SplitStrategy.MULTI_PROMPT]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 14);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.ULTRADENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.WORD]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.HYPERDENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.SHORT_SENTENCE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.HIGHPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 15);
        forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.DRAMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 2), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.PARAGRAPH]: (text) => {
      const res: SegmentWithContext[] = [];
      const paragraphs = filter(
        map(split(text || "", /\n+/), trim),
        (p) => gt(p.length, 10)
      );
      forEach(paragraphs, (para) => res.push({ text: para, context: para }));
      if (lt(res.length, 3)) {
        const sentences = smartSplitSentences(text);
        res.length = 0;
        forEach(chunk(sentences, 3), (batch) => {
          const chunkText = join(batch, ". ");
          res.push({ text: chunkText, context: chunkText });
        });
      }
      return res;
    },
    [SplitStrategy.EPIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 4), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.CINEMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 5), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.ARTISTIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 6), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.SLOWPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 7), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.SUPER_SLOW]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      forEach(chunk(sentences, 10), (batch) => {
        const chunkText = join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
  };

  const pList: SegmentWithContext[] = (SLICE_STRATEGIES[splitStrategy || ""] || defaultStrategy)(rewrittenScript || "");

  const totalWords = sumBy(pList, (p) => compact(split(p.text, /\s+/)).length);

  let maxScenes = 250;

  const scenesCount = min([maxScenes, gt(pList.length, 0) ? pList.length : 8]) || 8;
  const scenes: any[] = [];
  let currentTime = 0;

  const styleStr = style || "Realistic";
  const defaultChapters = !isEmpty(chapters) ? chapters : [{ id: "ch_1", title: "Chapter 1" }];

  const promptConfig = isVi ? SCENE_SPLIT_PROMPTS.VN : SCENE_SPLIT_PROMPTS.EN;

  for (let i = 0; lt(i, scenesCount); i++) {
    const chapter = defaultChapters[i % defaultChapters.length];
    const segment = pList[i];
    const scriptText = segment ? segment.text : promptConfig.DEFAULT_SCRIPT(add(i, 1));
    const contextText = segment ? segment.context : scriptText;

    const wordsCount = compact(split(scriptText, /\s+/)).length;
    let duration = 5;
    if (voiceDuration && gt(totalWords, 0)) {
      duration = round((wordsCount / totalWords) * voiceDuration);
      if (lt(duration, 3)) duration = 3;
    } else {
      duration = max([5, min([20, ceil(wordsCount / 2.2)]) || 20]) || 5;
    }

    if (voiceDuration && eq(i, subtract(scenesCount, 1))) {
      duration = max([3, subtract(voiceDuration, currentTime)]) || 3;
    }

    const startTimeSeconds = currentTime;
    const endTimeSeconds = add(currentTime, duration);
    currentTime = endTimeSeconds;

    const motion = SCENE_SPLIT_MOTIONS[i % SCENE_SPLIT_MOTIONS.length];
    const effects = promptConfig.EFFECTS(styleStr);
    const transition = SCENE_SPLIT_TRANSITIONS[i % SCENE_SPLIT_TRANSITIONS.length];

    scenes.push({
      id: `sc_${add(i, 1)}`,
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
