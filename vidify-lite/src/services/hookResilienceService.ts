import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { HookVersion, ProjectLanguage } from "../types";
import { normalizeHookScore, rankHookVersions } from "./scriptQualityService";

const normalizeContent = (value: unknown): string => _.trim(_.toString(value));
const isUsableContent = (content: string): boolean => _.inRange(_.size(content), REFACTOR_CONSTANTS.HOOK_MIN_CONTENT_LENGTH, _.add(REFACTOR_CONSTANTS.HOOK_MAX_CONTENT_LENGTH, 1));

export const createSafeFallbackHook = (topic: unknown, language: ProjectLanguage | string, hookType?: string): HookVersion => {
  return createSafeFallbackHooks(topic, language, hookType, 1)[0];
};

export const createSafeFallbackHooks = (topic: unknown, language: ProjectLanguage | string, hookType: string | undefined, count: number): HookVersion[] => {
  const isVietnamese = _.isEqual(language, ProjectLanguage.VI);
  const normalizedTopic = normalizeContent(topic) || (isVietnamese ? REFACTOR_CONSTANTS.HOOK_FALLBACK_TOPIC_VI : REFACTOR_CONSTANTS.HOOK_FALLBACK_TOPIC_EN);
  const normalizedQuestion = normalizedTopic.replace(REFACTOR_CONSTANTS.HOOK_QUESTION_END_REGEX, "");
  const question = REFACTOR_CONSTANTS.HOOK_QUESTION_END_REGEX.test(normalizedTopic)
    ? `${normalizedQuestion}?`
    : `${isVietnamese ? REFACTOR_CONSTANTS.HOOK_FALLBACK_PREFIX_VI : REFACTOR_CONSTANTS.HOOK_FALLBACK_PREFIX_EN} ${normalizedQuestion}?`;
  const candidates = isVietnamese
    ? [
      question,
      `Điều khó nhất về ${normalizedQuestion} không phải là điều phần lớn mọi người vẫn nghĩ.`,
      `Nếu ${normalizedQuestion} xảy ra với chính bạn, cuộc sống sẽ thay đổi từ khoảnh khắc nào?`,
    ]
    : [
      question,
      `The hardest part of ${normalizedQuestion} is not what most people assume.`,
      `If ${normalizedQuestion} happened to you, which moment would change your life first?`,
    ];
  return rankHookVersions(_.map(_.take(_.uniq(candidates), _.max([1, count]) || 1), (content, index) => ({
    id: `${REFACTOR_CONSTANTS.HOOK_FALLBACK_ID}_${index + 1}`,
    content: _.truncate(content, { length: REFACTOR_CONSTANTS.HOOK_MAX_CONTENT_LENGTH, omission: "…" }),
    type: hookType || REFACTOR_CONSTANTS.HOOK_FALLBACK_TYPE,
    selected: false,
    score: normalizeHookScore({
      retention: REFACTOR_CONSTANTS.HOOK_FALLBACK_RETENTION - index * 2,
      clarity: REFACTOR_CONSTANTS.HOOK_FALLBACK_CLARITY - index,
      emotion: REFACTOR_CONSTANTS.HOOK_FALLBACK_EMOTION + index * 3,
      factualSafety: REFACTOR_CONSTANTS.HOOK_FALLBACK_SAFETY,
      unsupportedClaim: false,
      reasons: [REFACTOR_CONSTANTS.HOOK_FALLBACK_REASON],
    }),
  })));
};

export const resolveUsableHooks = (versions: unknown, topic: unknown, language: ProjectLanguage | string, hookType: string, count: number): HookVersion[] => {
  const normalized = _.compact(_.map(_.take(_.castArray(versions), count), (version, index): HookVersion | null => {
    const source = _.isPlainObject(version) ? version as Record<string, unknown> : {};
    const content = normalizeContent(source.content ?? source.text);
    if (!isUsableContent(content)) return null;
    return { id: normalizeContent(source.id) || `hk_${_.add(index, 1)}`, content, type: normalizeContent(source.type) || hookType, selected: false, score: source.score as HookVersion["score"] };
  }));
  const ranked = rankHookVersions(normalized);
  return _.some(ranked, "selected") ? ranked : createSafeFallbackHooks(topic, language, hookType, count);
};
