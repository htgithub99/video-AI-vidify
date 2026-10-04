import { SOURCE_TEXT_SYMBOL_23 } from "../constants/sourceText";
import { ABBREVIATIONS, CONJUNCTIONS, boundaries, VIETNAMESE_VALID_CHARS_REGEX, TEXT_PROCESSOR_CONFIGS, LAST_WORD_IN_SENTENCE_REGEX, SENTENCE_PUNCTUATION_END_REGEX, DIGIT_REGEX, ENDS_WITH_DIGIT_REGEX, STARTS_WITH_DIGIT_REGEX, NEWLINE_CHAR, SPACE_CHAR, SINGLE_WHITESPACE_REGEX, WHITESPACE_REGEX } from "../constants/index.js";
import _ from "lodash";
export const smartSplitSentences = (text: string): string[] => {
  if (_.isEmpty(text)) return [];
  const sentences: string[] = [];
  let currentSentence = "";
  for (let i = 0; _.lt(i, text.length); i++) {
    const char = text[i];
    currentSentence += char;
    if (_.includes(boundaries, char)) {
      if (_.eq(char, SOURCE_TEXT_SYMBOL_23)) {
        const isDecimalNumber = _.gt(i, 0) && _.lt(i, _.subtract(text.length, 1)) && DIGIT_REGEX.test(text[i - 1]) && DIGIT_REGEX.test(text[i + 1]);
        if (isDecimalNumber) continue;
        const lastWordMatch = currentSentence.slice(0, -1).match(LAST_WORD_IN_SENTENCE_REGEX);
        if (!_.isNil(lastWordMatch)) {
          const lastWord = _.toLower(lastWordMatch[1]);
          if (_.includes(ABBREVIATIONS, lastWord)) {
            continue;
          }
        }
      }
      if (_.eq(char, NEWLINE_CHAR) || _.eq(i, _.subtract(text.length, 1)) || SINGLE_WHITESPACE_REGEX.test(text[i + 1])) {
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
export const splitSentenceSafely = (sent: string, maxWords: number = TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE): string[] => {
  const safeMaxWords = _.max([TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE, maxWords]) || TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE;
  const words = _.compact(_.split(sent, WHITESPACE_REGEX));
  if (_.lte(words.length, safeMaxWords)) {
    return [sent];
  }
  const len = words.length;
  const startIdx = _.floor(len * TEXT_PROCESSOR_CONFIGS.SENTENCE_SPLIT_MIN_RATIO);
  const endIdx = _.ceil(len * TEXT_PROCESSOR_CONFIGS.SENTENCE_SPLIT_MAX_RATIO);
  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = words[i];
    if (SENTENCE_PUNCTUATION_END_REGEX.test(word)) {
      if (_.endsWith(word, SOURCE_TEXT_SYMBOL_23)) {
        const cleanWord = _.toLower(word.slice(0, -1)).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
        if (_.includes(ABBREVIATIONS, cleanWord)) {
          continue;
        }
        if (ENDS_WITH_DIGIT_REGEX.test(cleanWord) && _.lt(i, _.subtract(len, 1)) && STARTS_WITH_DIGIT_REGEX.test(words[i + 1])) {
          continue;
        }
      }
      const part1 = _.join(_.slice(words, 0, _.add(i, 1)), SPACE_CHAR);
      const part2 = _.join(_.slice(words, _.add(i, 1)), SPACE_CHAR);
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }
  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = _.toLower(words[i]).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
    if (_.includes(CONJUNCTIONS, word)) {
      const part1 = _.join(_.slice(words, 0, i), SPACE_CHAR);
      const part2 = _.join(_.slice(words, i), SPACE_CHAR);
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }
  const mid = _.ceil(len / 2);
  const part1 = _.join(_.slice(words, 0, mid), SPACE_CHAR);
  const part2 = _.join(_.slice(words, mid), SPACE_CHAR);
  return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
};
