import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
export const motionHtmlOutput = (kit: boolean): string => (kit ? MOTION_HTML.OUTPUT_KIT : MOTION_HTML.OUTPUT);
export const motionHtmlDrawIssue = (html: string): string | undefined => (MOTION_HTML.ERASE_PATTERN.test(html) ? MOTION_HTML.ERASE_ISSUE : undefined);
export const motionHtmlGraphics = (profile: string, kit: boolean): string => {
  const style = motionDrawStyle(profile);
  const base = MOTION_HTML.PROFILE_GRAPHICS[style.family as keyof typeof MOTION_HTML.PROFILE_GRAPHICS] || MOTION_HTML.GRAPHICS;
  const mode = MOTION_HTML.GRAPHICS_MODE;
  const look = kit ? style.kitLookLine : style.look;
  const lines = base
    .split(mode.SEP)
    .map((line, index) => (index === 0 && style.title ? style.title : look && mode.LOOK.test(line) ? look : line))
    .filter((line) => !kit || !mode.KIT_DROP.test(line)).map((line) => (kit ? mode.KIT_LINES.find(([test]) => test.test(line))?.[1] ?? line : line));
  return (kit ? mode.KIT : mode.FREE).reduce((text, [from, to]) => text.split(from).join(to), lines.join(mode.SEP));
};
