import {
  SOURCE_TEXT_A,
  SOURCE_TEXT_AI_2,
  SOURCE_TEXT_AN_2,
  SOURCE_TEXT_ARE,
  SOURCE_TEXT_BAN,
  SOURCE_TEXT_BI,
  SOURCE_TEXT_CAI,
  SOURCE_TEXT_CHO,
  SOURCE_TEXT_CO,
  SOURCE_TEXT_CUA,
  SOURCE_TEXT_DA,
  SOURCE_TEXT_DAY,
  SOURCE_TEXT_DUOC,
  SOURCE_TEXT_GI,
  SOURCE_TEXT_IN,
  SOURCE_TEXT_IS,
  SOURCE_TEXT_IT,
  SOURCE_TEXT_KHI,
  SOURCE_TEXT_LA,
  SOURCE_TEXT_MOT,
  SOURCE_TEXT_NAY,
  SOURCE_TEXT_NHUNG,
  SOURCE_TEXT_NOI,
  SOURCE_TEXT_OF,
  SOURCE_TEXT_SAO,
  SOURCE_TEXT_SELECTED,
  SOURCE_TEXT_TAI,
  SOURCE_TEXT_THAT,
  SOURCE_TEXT_THE,
  SOURCE_TEXT_THI,
  SOURCE_TEXT_THIS,
  SOURCE_TEXT_TO,
  SOURCE_TEXT_TRONG,
  SOURCE_TEXT_VA,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_WHAT,
  SOURCE_TEXT_WHEN,
  SOURCE_TEXT_WHERE,
  SOURCE_TEXT_WHY,
} from "../constants/sourceText";
import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { HookVersion } from "../types";
import { rankHookVersions } from "./scriptQualityService";
import { validateChapterLanguage } from "./chapterLanguageValidationService";
const normalizeContent = (value: unknown): string => _.trim(_.toString(value));
const isUsableContent = (content: string): boolean => _.inRange(_.size(content), REFACTOR_CONSTANTS.HOOK_MIN_CONTENT_LENGTH, _.add(REFACTOR_CONSTANTS.HOOK_MAX_CONTENT_LENGTH, 1));
const TOPIC_STOP_WORDS = new Set([
  SOURCE_TEXT_AI_2,
  SOURCE_TEXT_BAN,
  SOURCE_TEXT_BI,
  SOURCE_TEXT_CAI,
  SOURCE_TEXT_CHO,
  SOURCE_TEXT_CO,
  SOURCE_TEXT_CUA,
  SOURCE_TEXT_DA,
  SOURCE_TEXT_DAY,
  SOURCE_TEXT_DUOC,
  SOURCE_TEXT_GI,
  SOURCE_TEXT_KHI,
  SOURCE_TEXT_LA,
  SOURCE_TEXT_MOT,
  SOURCE_TEXT_NAY,
  SOURCE_TEXT_NHUNG,
  SOURCE_TEXT_NOI,
  SOURCE_TEXT_SAO,
  SOURCE_TEXT_TAI,
  SOURCE_TEXT_THAT,
  SOURCE_TEXT_THE,
  SOURCE_TEXT_THI,
  SOURCE_TEXT_TRONG,
  SOURCE_TEXT_VA,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_WHY,
  SOURCE_TEXT_WHAT,
  SOURCE_TEXT_WHEN,
  SOURCE_TEXT_WHERE,
  SOURCE_TEXT_THE,
  SOURCE_TEXT_A,
  SOURCE_TEXT_AN_2,
  SOURCE_TEXT_IS,
  SOURCE_TEXT_ARE,
  SOURCE_TEXT_TO,
  SOURCE_TEXT_OF,
  SOURCE_TEXT_IN,
  SOURCE_TEXT_IT,
  SOURCE_TEXT_THIS,
  SOURCE_TEXT_THAT,
] as string[]);
const getTopicTokens = (value: string): string[] => _.filter(_.uniq(_.words(_.deburr(_.toLower(value)))), (token) => _.gte(token.length, 3) && !TOPIC_STOP_WORDS.has(token));
export const isHookTopicallyGrounded = (content: string, sourceText: string): boolean => {
  const sourceTokens = getTopicTokens(sourceText);
  if (_.isEmpty(sourceTokens)) return true;
  const hookTokens = new Set(getTopicTokens(content));
  return _.some(sourceTokens, (token) => hookTokens.has(token));
};
export const resolveUsableHooks = (versions: unknown, _hookType: string, count: number, sourceText: string = "", isVietnamese: boolean = false): HookVersion[] => {
  const sourceVersions = _.castArray(versions);
  if (!_.isEqual(_.size(sourceVersions), count)) return [];
  const normalized = _.compact(
    _.map(sourceVersions, (version): HookVersion | null => {
      const source = _.isPlainObject(version) ? (version as Record<string, unknown>) : {};
      const id = normalizeContent(source.id);
      const content = normalizeContent(source.content);
      const type = normalizeContent(source.type);
      if (_.isEmpty(id) || _.isEmpty(type) || !isUsableContent(content) || !isHookTopicallyGrounded(content, sourceText) || !validateChapterLanguage(content, isVietnamese).valid) return null;
      return { id, content, type, selected: false, score: source.score as HookVersion["score"] };
    }),
  );
  if (!_.isEqual(normalized.length, count)) return [];
  const ranked = rankHookVersions(normalized);
  if (_.some(ranked, SOURCE_TEXT_SELECTED)) return ranked;
  if (!_.isEmpty(ranked)) return _.map(ranked, (version, index) => ({ ...version, selected: _.isEqual(index, 0) }));
  return [];
};
