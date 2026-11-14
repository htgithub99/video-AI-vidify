import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
import { motionDrawStyle, motionProportionOf } from "./motionDrawStyle.js";
export const motionHtmlKitStyle = (profile: string): string => motionDrawStyle(profile).kitLook;
export const motionHtmlKitDoc = (profile: string): string => K.DOC[motionHtmlKitStyle(profile)] || K.DOC.outline;
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
const eraOf = (body: string): number => Number([...body.matchAll(K.ERA_USED)].pop()?.[1] || 0);
const proportionOf = (body: string): string => [...body.matchAll(K.PROPORTION_USED)].pop()?.[1] || K.EMPTY;
export const motionEraYear = (texts: (string | undefined)[]): number => {
  const years = texts.flatMap((text) => [...String(text || K.EMPTY).matchAll(K.ERA_YEAR)].map((match) => Number(match[1]))).filter((year) => year >= K.ERA_MIN && year <= K.ERA_MAX).sort((a, b) => a - b);
  return years.length ? years[Math.floor(years.length / 2)] : 0;
};
export const motionHtmlWithKit = (html: string, profile: string, era = 0, proportion?: string): string => {
  if (html.includes(K.ATTR)) return html;
  const tag = K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(motionHtmlKitStyle(profile)) + K.SET_PROPORTION(motionProportionOf({ profileId: profile, proportion })) + K.SET_ERA(era) + K.TIME_HOOK + K.SCRIPT_CLOSE;
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
  return html.slice(0, start) + K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(used) + K.SET_PROPORTION(proportionOf(html.slice(start, end))) + K.SET_ERA(eraOf(html.slice(start, end))) + K.TIME_HOOK + html.slice(end);
};
let kitRef = "";
const motionHtmlKitRef = (): string => {
  if (kitRef) return kitRef;
  let hash: number = K.HASH_SEED;
  for (let i = 0; i < K.SCRIPT.length; i++) hash = Math.imul(hash ^ K.SCRIPT.charCodeAt(i), K.HASH_PRIME);
  kitRef = K.REF((hash >>> 0).toString(K.HASH_RADIX) + K.SCRIPT.length.toString(K.HASH_RADIX));
  return kitRef;
};
export const motionHtmlKitCompact = (html: string): string => {
  const start = html.indexOf(K.SCRIPT_TAG);
  if (start < 0) return html;
  const end = html.indexOf(K.SCRIPT_CLOSE, start);
  if (end < 0) return html;
  const body = html.slice(start + K.SCRIPT_TAG.length, end);
  if (!body.includes(K.SCRIPT)) return html;
  const used = [...body.matchAll(K.STYLE_USED)].pop()?.[1] || K.STYLE_FALLBACK;
  return html.slice(0, start) + K.SCRIPT_TAG + motionHtmlKitRef() + K.SET_STYLE(used) + K.SET_PROPORTION(proportionOf(body)) + K.SET_ERA(eraOf(body)) + K.TIME_HOOK + html.slice(end);
};
type CompactScene = { html?: { html?: string; prompt?: string; status?: string }; htmlRequest?: { raw?: string; submission?: { pending?: unknown } }; build?: { status?: string } };
export const motionCompactScene = (scene: CompactScene | undefined): void => {
  if (!scene?.html?.html) return;
  scene.html.html = motionHtmlKitCompact(scene.html.html);
  if (!K.DONE_STATES.includes(String(scene.html.status)) || scene.build?.status !== K.ACCEPTED) return;
  scene.html.prompt = K.EMPTY;
  if (scene.htmlRequest) delete scene.htmlRequest.raw;
  if (scene.htmlRequest?.submission) delete scene.htmlRequest.submission.pending;
};
export const motionCompactSpecScene = (scene: CompactScene & { html?: { thumbnail?: string } }): void => {
  motionCompactScene(scene);
  if (scene.html) delete scene.html.thumbnail;
};
export const motionCompactSceneHtml = (scenes: Record<string, Array<CompactScene> | undefined> | undefined): void => {
  for (const list of Object.values(scenes || {})) for (const scene of list || []) motionCompactScene(scene);
};
export const motionHtmlKitStale = (html: string): boolean => html.includes(K.SCRIPT_TAG) && !html.includes(K.SCRIPT) && !html.includes(motionHtmlKitRef());
