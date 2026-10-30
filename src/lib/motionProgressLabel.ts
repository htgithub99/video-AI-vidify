import { MOTION_PROGRESS as C } from "../constants/motionProgress.js";
import { USER_LOG_CONFIG } from "../constants/userLog.js";
import { ANSI_ESCAPE_SEQUENCE_REGEX } from "../constants/regexes.js";
import { MOTION_PATTERNS } from "../constants/motionPatterns.js";
export const motionProgressLabel = (value: unknown): string => {
  const label = String(value ?? USER_LOG_CONFIG.EMPTY_STRING)
    .replace(ANSI_ESCAPE_SEQUENCE_REGEX, USER_LOG_CONFIG.EMPTY_STRING)
    .replace(MOTION_PATTERNS.WHITESPACE_GLOBAL, USER_LOG_CONFIG.SPACE)
    .trim();
  return label.length > C.TEXT_LIMIT ? label.slice(0, C.TEXT_LIMIT - USER_LOG_CONFIG.ELLIPSIS.length).trimEnd() + USER_LOG_CONFIG.ELLIPSIS : label;
};
