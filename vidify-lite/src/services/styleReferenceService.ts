import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, MARKDOWN_REGEX } from "../constants";

export const normalizeExtractedStyle = (value: unknown): string => _.trim(
  _.replace(_.toString(value), MARKDOWN_REGEX, ""),
);

export const resolveReferenceLockedStyle = (style: unknown, hasReferences: boolean): string => {
  const normalizedStyle = normalizeExtractedStyle(style);
  if (!hasReferences) return normalizedStyle;
  return _.trim(normalizedStyle) || IMAGE_PROMPT_COMPILER_CONFIG.LOCKED_REFERENCE_STYLE;
};

export const removeConflictingStyleTerms = (value: string, referenceLocked: boolean): string => referenceLocked
  ? _.trim(value
    .replace(IMAGE_PROMPT_COMPILER_CONFIG.CONFLICTING_STYLE_PATTERN, "")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s+([,.;:])/g, "$1"))
  : value;
