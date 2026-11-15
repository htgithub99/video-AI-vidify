import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
export const motionHtmlDrawIssue = (html: string): string | undefined => (MOTION_HTML.ERASE_PATTERN.test(html) ? MOTION_HTML.ERASE_ISSUE : undefined);
export const motionHtmlGraphics = (profile: string): string => {
  const style = motionDrawStyle(profile);
  const base = MOTION_HTML.PROFILE_GRAPHICS[style.family as keyof typeof MOTION_HTML.PROFILE_GRAPHICS] || MOTION_HTML.GRAPHICS;
  const mode = MOTION_HTML.GRAPHICS_MODE;
  return base
    .split(mode.SEP)
    .map((line, index) => (index === 0 && style.title ? style.title : style.look && mode.LOOK.test(line) ? style.look : line))
    .join(mode.SEP);
};
export const motionHtmlRuleLines = (rules: string, map = false): string =>
  rules
    .replace(MOTION_HTML.RULE_LABELS, "\n")
    .split("\n")
    .filter((line) => !map || !MOTION_HTML.RULE_MAP_DROP.test(line))
    .join("\n");
