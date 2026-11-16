import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlDrawIssue = (html: string): string | undefined => (MOTION_HTML.ERASE_PATTERN.test(html) ? MOTION_HTML.ERASE_ISSUE : undefined);
export const motionHtmlRuleLines = (rules: string, map = false): string =>
  rules
    .replace(MOTION_HTML.RULE_LABELS, "\n")
    .split("\n")
    .filter((line) => !map || !MOTION_HTML.RULE_MAP_DROP.test(line))
    .join("\n");
