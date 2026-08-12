import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { HookVersion } from "../types";
import { rankHookVersions } from "./scriptQualityService";

const normalizeContent = (value: unknown): string => _.trim(_.toString(value));
const isUsableContent = (content: string): boolean => _.inRange(_.size(content), REFACTOR_CONSTANTS.HOOK_MIN_CONTENT_LENGTH, _.add(REFACTOR_CONSTANTS.HOOK_MAX_CONTENT_LENGTH, 1));

export const resolveUsableHooks = (versions: unknown, hookType: string, count: number): HookVersion[] => {
  const normalized = _.compact(_.map(_.take(_.castArray(versions), count), (version, index): HookVersion | null => {
    const source = _.isPlainObject(version) ? version as Record<string, unknown> : {};
    const content = normalizeContent(source.content ?? source.text);
    if (!isUsableContent(content)) return null;
    return { id: normalizeContent(source.id) || `hk_${_.add(index, 1)}`, content, type: normalizeContent(source.type) || hookType, selected: false, score: source.score as HookVersion["score"] };
  }));
  const ranked = rankHookVersions(normalized);
  return _.some(ranked, "selected") ? ranked : [];
};
