import _ from "lodash";

export const CHAPTER_LANGUAGE_VALIDATION_CONFIG = {
  MINIMUM_ANALYSIS_CHARACTERS: 40,
  MINIMUM_ANALYSIS_WORDS: 6,
  MINIMUM_VIETNAMESE_DIACRITIC_RATIO: 0.01,
  MAXIMUM_JOINED_PUNCTUATION_COUNT: 1,
  MAXIMUM_WORD_CHARACTERS: 32,
  MAXIMUM_GENERATION_ATTEMPTS: 3,
} as const;

const LETTER_REGEX = /\p{L}/gu;
const WORD_REGEX = /\p{L}+/gu;
const VIETNAMESE_DIACRITIC_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/giu;
const JOINED_PUNCTUATION_REGEX = /[,.!?;:](?=\p{L})/gu;

export enum ChapterLanguageIssue {
  MissingVietnameseDiacritics = "missing_vietnamese_diacritics",
  JoinedPunctuation = "joined_punctuation",
  JoinedWords = "joined_words",
}

export interface ChapterLanguageValidation {
  valid: boolean;
  issues: ChapterLanguageIssue[];
}

export const validateChapterLanguage = (
  content: unknown,
  isVietnamese: boolean,
): ChapterLanguageValidation => {
  const text = _.trim(_.toString(content));
  if (!isVietnamese || text.length < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MINIMUM_ANALYSIS_CHARACTERS) {
    return { valid: true, issues: [] };
  }

  const words = text.match(WORD_REGEX) || [];
  if (words.length < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MINIMUM_ANALYSIS_WORDS) {
    return { valid: true, issues: [] };
  }

  const letterCount = (text.match(LETTER_REGEX) || []).length;
  const diacriticCount = (text.match(VIETNAMESE_DIACRITIC_REGEX) || []).length;
  const diacriticRatio = _.divide(diacriticCount, _.max([letterCount, 1]) || 1);
  const joinedPunctuationCount = (text.match(JOINED_PUNCTUATION_REGEX) || []).length;
  const hasJoinedWords = _.some(
    words,
    word => word.length > CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_WORD_CHARACTERS,
  );
  const issues = _.compact([
    diacriticRatio < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MINIMUM_VIETNAMESE_DIACRITIC_RATIO
      && ChapterLanguageIssue.MissingVietnameseDiacritics,
    joinedPunctuationCount > CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_JOINED_PUNCTUATION_COUNT
      && ChapterLanguageIssue.JoinedPunctuation,
    hasJoinedWords && ChapterLanguageIssue.JoinedWords,
  ]) as ChapterLanguageIssue[];

  return { valid: _.isEmpty(issues), issues };
};
