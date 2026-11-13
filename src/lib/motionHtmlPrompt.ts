import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlOutput = (kit: boolean): string => (kit ? MOTION_HTML.OUTPUT_KIT : MOTION_HTML.OUTPUT);
export const motionHtmlDrawIssue = (html: string): string | undefined => (MOTION_HTML.ERASE_PATTERN.test(html) ? MOTION_HTML.ERASE_ISSUE : undefined);
export const motionHtmlGraphics = (profile: string, kit: boolean): string => {
  const base = MOTION_HTML.PROFILE_GRAPHICS[profile] || MOTION_HTML.GRAPHICS;
  const mode = MOTION_HTML.GRAPHICS_MODE;
  const lines = base.split(mode.SEP).filter((line) => !kit || !mode.KIT_DROP.test(line)).map((line) => (kit ? mode.KIT_LINES.find(([test]) => test.test(line))?.[1] ?? line : line));
  return (kit ? mode.KIT : mode.FREE).reduce((text, [from, to]) => text.split(from).join(to), lines.join(mode.SEP));
};
