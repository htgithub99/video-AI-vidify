import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlDrawIssue = (html: string): string | undefined => (MOTION_HTML.ERASE_PATTERN.test(html) ? MOTION_HTML.ERASE_ISSUE : undefined);
// Repairs a drawing in place instead of asking for a new one: an erasing composite mode (which leaves black holes) is
// painted normally. Each repair made is added to notes as a warning.
export const motionHtmlRepairDraw = (html: string, notes: string[]): string => {
  if (!MOTION_HTML.ERASE_PATTERN.test(html)) return html;
  notes.push(MOTION_HTML.ERASE_REPAIRED);
  return html.replace(new RegExp(MOTION_HTML.ERASE_PATTERN.source, "g"), MOTION_HTML.ERASE_SAFE);
};
export const motionHtmlRuleLines = (rules: string, map = false): string =>
  rules
    .replace(MOTION_HTML.RULE_LABELS, "\n")
    .split("\n")
    .filter((line) => !map || !MOTION_HTML.RULE_MAP_DROP.test(line))
    .join("\n");
