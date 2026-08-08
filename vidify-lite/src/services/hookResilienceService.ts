import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { HookVersion, ProjectLanguage } from "../types";
import { normalizeHookScore, rankHookVersions } from "./scriptQualityService";

const normalizeContent = (value: unknown): string => _.trim(_.toString(value));
const isUsableContent = (content: string): boolean => _.inRange(_.size(content), REFACTOR_CONSTANTS.HOOK_MIN_CONTENT_LENGTH, _.add(REFACTOR_CONSTANTS.HOOK_MAX_CONTENT_LENGTH, 1));

export const createSafeFallbackHook = (topic: unknown, language: ProjectLanguage | string, hookType?: string): HookVersion => {
  const isVietnamese = _.isEqual(language, ProjectLanguage.VI);
  const normalizedTopic = normalizeContent(topic) || (isVietnamese ? REFACTOR_CONSTANTS.HOOK_FALLBACK_TOPIC_VI : REFACTOR_CONSTANTS.HOOK_FALLBACK_TOPIC_EN);
  const content = `${isVietnamese ? REFACTOR_CONSTANTS.HOOK_FALLBACK_PREFIX_VI : REFACTOR_CONSTANTS.HOOK_FALLBACK_PREFIX_EN} ${normalizedTopic}?`;
  return { id: REFACTOR_CONSTANTS.HOOK_FALLBACK_ID, content, type: hookType || REFACTOR_CONSTANTS.HOOK_FALLBACK_TYPE, selected: true, score: normalizeHookScore({ retention: REFACTOR_CONSTANTS.HOOK_FALLBACK_RETENTION, clarity: REFACTOR_CONSTANTS.HOOK_FALLBACK_CLARITY, emotion: REFACTOR_CONSTANTS.HOOK_FALLBACK_EMOTION, factualSafety: REFACTOR_CONSTANTS.HOOK_FALLBACK_SAFETY, unsupportedClaim: false, reasons: [REFACTOR_CONSTANTS.HOOK_FALLBACK_REASON] }) };
};

export const resolveUsableHooks = (versions: unknown, topic: unknown, language: ProjectLanguage | string, hookType: string, count: number): HookVersion[] => {
  const normalized = _.compact(_.map(_.take(_.castArray(versions), count), (version, index): HookVersion | null => {
    const source = _.isPlainObject(version) ? version as Record<string, unknown> : {};
    const content = normalizeContent(source.content ?? source.text);
    if (!isUsableContent(content)) return null;
    return { id: normalizeContent(source.id) || `hk_${_.add(index, 1)}`, content, type: normalizeContent(source.type) || hookType, selected: false, score: source.score as HookVersion["score"] };
  }));
  const ranked = rankHookVersions(normalized);
  return _.some(ranked, "selected") ? ranked : [createSafeFallbackHook(topic, language, hookType)];
};
