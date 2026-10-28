import _ from "lodash";
import { TECHNICAL_RESPONSE_RETRY_CONFIG } from "../constants/config";
import { VIETNAMESE_DIACRITIC_REGEX } from "../constants/regexes";
export const CHAPTER_LANGUAGE_VALIDATION_CONFIG = { MINIMUM_ANALYSIS_CHARACTERS: 30, MINIMUM_ANALYSIS_WORDS: 5, MINIMUM_VIETNAMESE_DIACRITIC_RATIO: 0.05, MAXIMUM_JOINED_PUNCTUATION_COUNT: 1, MAXIMUM_WORD_CHARACTERS: 32, MAXIMUM_GENERATION_ATTEMPTS: TECHNICAL_RESPONSE_RETRY_CONFIG.MAX_ATTEMPTS } as const;
const LETTER_REGEX = /\p{L}/gu;
const WORD_REGEX = /\p{L}+/gu;
const JOINED_PUNCTUATION_REGEX = /[,.!?;:](?=\p{L})/gu;
const COMMON_UNACCENTED_VIETNAMESE_PATTERN = /\b(?:ban|dang|trong|phong|nguoi|khong|duoc|nhung|chung|ta|thoi|gian|voi|anh|sang|cam|giac|ap|luc|xa|hoi|de|nang|nhin|vao|guong|khi|doi|tay|run|ray|tu|hoi|lieu|day|co|phai|la|cai|bay|cuoc|doi|mot|hop|dong|lao|dong|muc|luong|trieu|ruoi|dat|truoc|mat|buoc|ky|ten|chap|nhan|chan|con|duong|nhieu|chong|gai|bat|dau|hanh|trinh|trac|phia)\b/i;
export enum ChapterLanguageIssue {
  MissingVietnameseDiacritics = "missing_vietnamese_diacritics",
  JoinedPunctuation = "joined_punctuation",
  JoinedWords = "joined_words",
}
export interface ChapterLanguageValidation {
  valid: boolean;
  issues: ChapterLanguageIssue[];
}
export const validateChapterLanguage = (content: unknown, isVietnamese: boolean): ChapterLanguageValidation => {
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
  const hasJoinedWords = _.some(words, (word) => word.length > CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_WORD_CHARACTERS);
  const isMissingDiacritics = diacriticRatio < CHAPTER_LANGUAGE_VALIDATION_CONFIG.MINIMUM_VIETNAMESE_DIACRITIC_RATIO || (diacriticCount === 0 && COMMON_UNACCENTED_VIETNAMESE_PATTERN.test(text));
  const issues = _.compact([isMissingDiacritics && ChapterLanguageIssue.MissingVietnameseDiacritics, joinedPunctuationCount > CHAPTER_LANGUAGE_VALIDATION_CONFIG.MAXIMUM_JOINED_PUNCTUATION_COUNT && ChapterLanguageIssue.JoinedPunctuation, hasJoinedWords && ChapterLanguageIssue.JoinedWords]) as ChapterLanguageIssue[];
  return { valid: _.isEmpty(issues), issues };
};
