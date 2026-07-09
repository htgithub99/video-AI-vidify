import { AspectRatio } from "../types.js";
import { SCENE_SPLIT_PROMPTS } from "../constants/texts.js";
import { SCENE_SPLIT_MOTIONS, SCENE_SPLIT_TRANSITIONS } from "../constants/data.js";
import { formatTimeHelper as formatTime } from "../lib/timeUtils.js";
import { ABBREVIATIONS, CONJUNCTIONS, boundaries, VIETNAMESE_VALID_CHARS_REGEX, SplitStrategy } from "../constants/index.js";
import _ from 'lodash';


export const smartChunkScript = (script: string, maxChunkSize: number = 2500, minChunkSize: number = 2000): string[] => {
  if (_.isEmpty(_.trim(script))) return [];
  if (_.lte(script.length, maxChunkSize)) return [_.trim(script)];

  const chunks: string[] = [];
  let currentIdx = 0;

  while (_.lt(currentIdx, script.length)) {
    let endIdx = _.add(currentIdx, maxChunkSize);

    if (_.gte(endIdx, script.length)) {
      const finalChunk = _.trim(script.slice(currentIdx));
      if (!_.isEmpty(finalChunk)) chunks.push(finalChunk);
      break;
    }

    let cutPoint = endIdx;
    let foundBoundary = false;

    for (let i = endIdx; gt(i, _.add(currentIdx, minChunkSize)); i--) {
      if (_.includes(boundaries, script[i])) {
        cutPoint = _.add(i, 1);
        foundBoundary = true;
        break;
      }
    }

    if (_.eq(foundBoundary, false)) {
      for (let i = endIdx; gt(i, currentIdx); i--) {
        if (_.eq(script[i], " ")) {
          cutPoint = i;
          break;
        }
      }
    }

    const chunkVal = _.trim(script.slice(currentIdx, cutPoint));
    if (!_.isEmpty(chunkVal)) {
      chunks.push(chunkVal);
    }

    currentIdx = cutPoint;
  }

  return chunks;
};

export const smartSplitSentences = (text: string): string[] => {
  if (_.isEmpty(text)) return [];
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; _.lt(i, text.length); i++) {
    const char = text[i];
    currentSentence += char;

    if (_.includes([".", "?", "!", "\n"], char)) {
      if (_.eq(char, ".")) {
        if (gt(i, 0) && _.lt(i, _.subtract(text.length, 1)) && /\d/.test(text[i - 1]) && /\d/.test(text[i + 1])) {
          continue;
        }

        const lastWordMatch = currentSentence.slice(0, -1).match(/(\b[a-zA-ZÀ-ỹ]+)$/);
        if (!_.isNil(lastWordMatch)) {
          const lastWord = _.toLower(lastWordMatch[1]);
          if (_.includes(ABBREVIATIONS, lastWord)) {
            continue;
          }
        }
      }

      if (_.eq(char, "\n") || _.eq(i, _.subtract(text.length, 1)) || /\s/.test(text[i + 1])) {
        const trimmed = _.trim(currentSentence);
        if (!_.isEmpty(trimmed)) {
          sentences.push(trimmed);
        }
        currentSentence = "";
      }
    }
  }

  if (!_.isEmpty(_.trim(currentSentence))) {
    sentences.push(_.trim(currentSentence));
  }

  return sentences;
};

export const splitSentenceSafely = (sent: string, maxWords: number = 12): string[] => {
  const safeMaxWords = _.max([12, maxWords]) || 12;
  const words = _.compact(_.split(sent, /\s+/));
  if (_.lte(words.length, safeMaxWords)) {
    return [sent];
  }

  const len = words.length;
  const startIdx = floor(len * 0.3);
  const endIdx = _.ceil(len * 0.7);

  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = words[i];
    if (/[伤害,.;:—\-\s]+$/.test(word)) {
      if (_.endsWith(word, ".")) {
        const cleanWord = _.toLower(word.slice(0, -1)).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
        if (_.includes(ABBREVIATIONS, cleanWord)) {
          continue;
        }
        if (/\d$/.test(cleanWord) && _.lt(i, _.subtract(len, 1)) && /^\d/.test(words[i + 1])) {
          continue;
        }
      }

      const part1 = _.join(_.slice(words, 0, _.add(i, 1)), " ");
      const part2 = _.join(_.slice(words, _.add(i, 1)), " ");
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = _.toLower(words[i]).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
    if (_.includes(CONJUNCTIONS, word)) {
      const part1 = _.join(_.slice(words, 0, i), " ");
      const part2 = _.join(_.slice(words, i), " ");
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  const mid = _.ceil(len / 2);
  const part1 = _.join(_.slice(words, 0, mid), " ");
  const part2 = _.join(_.slice(words, mid), " ");
  return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
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
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 14);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.ULTRADENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.WORD]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.HYPERDENSE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.SHORT_SENTENCE]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 12);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.HIGHPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      const sents = smartSplitSentences(text);
      _.forEach(sents, (sent) => {
        const clauses = splitSentenceSafely(sent, 15);
        _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
      });
      return res;
    },
    [SplitStrategy.DRAMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 2), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.PARAGRAPH]: (text) => {
      const res: SegmentWithContext[] = [];
      const paragraphs = filter(
        map(_.split(text || "", /\n+/), _.trim),
        (p) => gt(p.length, 10)
      );
      _.forEach(paragraphs, (para) => res.push({ text: para, context: para }));
      if (_.lt(res.length, 3)) {
        const sentences = smartSplitSentences(text);
        res.length = 0;
        _.forEach(_.chunk(sentences, 3), (batch) => {
          const chunkText = _.join(batch, ". ");
          res.push({ text: chunkText, context: chunkText });
        });
      }
      return res;
    },
    [SplitStrategy.EPIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 4), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.CINEMATIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 5), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.ARTISTIC]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 6), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.SLOWPACED]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 7), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
    [SplitStrategy.SUPER_SLOW]: (text) => {
      const res: SegmentWithContext[] = [];
      const sentences = smartSplitSentences(text);
      _.forEach(_.chunk(sentences, 10), (batch) => {
        const chunkText = _.join(batch, ". ");
        res.push({ text: chunkText, context: chunkText });
      });
      return res;
    },
  };

  const pList: SegmentWithContext[] = (SLICE_STRATEGIES[splitStrategy || ""] || defaultStrategy)(rewrittenScript || "");

  const totalWords = _.sumBy(pList, (p) => _.compact(_.split(p.text, /\s+/)).length);

  let maxScenes = 250;

  const scenesCount = _.min([maxScenes, gt(pList.length, 0) ? pList.length : 8]) || 8;
  const scenes: any[] = [];
  let currentTime = 0;

  const styleStr = style || "Realistic";
  const defaultChapters = !_.isEmpty(chapters) ? chapters : [{ id: "ch_1", title: "Chapter 1" }];

  const promptConfig = isVi ? SCENE_SPLIT_PROMPTS.VN : SCENE_SPLIT_PROMPTS.EN;

  for (let i = 0; _.lt(i, scenesCount); i++) {
    const chapter = defaultChapters[i % defaultChapters.length];
    const segment = pList[i];
    const scriptText = segment ? segment.text : promptConfig.DEFAULT_SCRIPT(_.add(i, 1));
    const contextText = segment ? segment.context : scriptText;

    const wordsCount = _.compact(_.split(scriptText, /\s+/)).length;
    let duration = 5;
    if (voiceDuration && gt(totalWords, 0)) {
      duration = round((wordsCount / totalWords) * voiceDuration);
      if (_.lt(duration, 3)) duration = 3;
    } else {
      duration = _.max([5, _.min([20, _.ceil(wordsCount / 2.2)]) || 20]) || 5;
    }

    if (voiceDuration && _.eq(i, _.subtract(scenesCount, 1))) {
      duration = _.max([3, _.subtract(voiceDuration, currentTime)]) || 3;
    }

    const startTimeSeconds = currentTime;
    const endTimeSeconds = _.add(currentTime, duration);
    currentTime = endTimeSeconds;

    const motion = SCENE_SPLIT_MOTIONS[i % SCENE_SPLIT_MOTIONS.length];
    const effects = promptConfig.EFFECTS(styleStr);
    const transition = SCENE_SPLIT_TRANSITIONS[i % SCENE_SPLIT_TRANSITIONS.length];

    scenes.push({
      id: `sc_${_.add(i, 1)}`,
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
