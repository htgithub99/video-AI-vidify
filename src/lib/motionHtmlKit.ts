import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
export const motionHtmlKitStyle = (profile: string): string => K.STYLE[profile] || K.STYLE.history;
export const motionHtmlKitDoc = (profile: string): string => K.DOC[motionHtmlKitStyle(profile)];
const bodyAfter = (html: string, from: number): string => {
  const open = html.indexOf(K.BRACE_OPEN, from);
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === K.BRACE_OPEN) depth++;
    else if (html[i] === K.BRACE_CLOSE && --depth === 0) return html.slice(open, i + 1);
  }
  return html.slice(open);
};
export const motionHtmlKitIssue = (html: string): string | undefined => {
  const own = [...html.matchAll(K.OWN_FIGURE)].filter((match) => !K.CALL.test(bodyAfter(html, match.index || 0))).map((match) => match[1]);
  if (own.length) return K.OWN([...new Set(own)].join(K.SEP));
  if (!K.CALL.test(html) && K.FIGURE_HINT.test(html)) return K.MISSING;
  return undefined;
};
export const motionHtmlWithKit = (html: string, profile: string): string => {
  if (html.includes(K.ATTR)) return html;
  const tag = K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(motionHtmlKitStyle(profile)) + K.TIME_HOOK + K.SCRIPT_CLOSE;
  const head = html.indexOf(K.HEAD);
  if (head >= 0) return html.slice(0, head + K.HEAD.length) + tag + html.slice(head + K.HEAD.length);
  const open = K.HTML_OPEN.exec(html);
  if (open) return html.slice(0, open.index + open[0].length) + tag + html.slice(open.index + open[0].length);
  return tag + html;
};
export const motionHtmlKitRefresh = (html: string): string => {
  const start = html.indexOf(K.SCRIPT_TAG);
  if (start < 0) return html;
  const end = html.indexOf(K.SCRIPT_CLOSE, start);
  if (end < 0) return html;
  const used = [...html.slice(start, end).matchAll(K.STYLE_USED)].pop()?.[1] || K.STYLE_FALLBACK;
  return html.slice(0, start) + K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(used) + K.TIME_HOOK + html.slice(end);
};
export const motionHtmlKitStale = (html: string): boolean => html.includes(K.SCRIPT_TAG) && !html.includes(K.SCRIPT);
