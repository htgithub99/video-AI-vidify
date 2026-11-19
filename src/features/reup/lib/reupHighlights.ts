import _ from "lodash";
import { REUP_BUILD, REUP_HIGHLIGHT as H } from "../constants/reupConfig.js";
import type { ReupHighlights, ReupMark, ReupPresetRules, ReupTitleOverlay } from "../types/reup.js";
import { HIGHLIGHT_ANCHOR_ASS, type HighlightAnchor } from "../../../constants/highlightAnchor.js";
import { highlightColumn, highlightRow } from "../../../lib/highlightAnchor.js";
import { reupAssColor, reupAssHead, reupAssText, reupAssTime } from "./reupSpeech.js";
export interface ReupHighlightSpot {
  at: number;
  until: number;
  mark: ReupMark;
}
export interface ReupHighlightEvent {
  start: number;
  end: number;
  mark: ReupMark;
}
export const reupHighlightCount = (total: number, mode: ReupHighlights, rules: Pick<ReupPresetRules, "markEvery" | "markMax">): number => (mode === "off" ? 0 : Math.max(1, Math.min(rules.markMax, Math.floor(total / (rules.markEvery * (mode === "normal" ? H.NORMAL_FACTOR : 1))) || 1)));
export const reupPickHighlights = (spots: ReupHighlightSpot[], opts: { total: number; mode: ReupHighlights; rules: Pick<ReupPresetRules, "markEvery" | "markMax" | "markSeconds">; title: ReupTitleOverlay }): ReupHighlightEvent[] => {
  const count = reupHighlightCount(opts.total, opts.mode, opts.rules);
  const gap = Math.max(H.MIN_GAP, opts.rules.markEvery * (opts.mode === "normal" ? H.NORMAL_FACTOR : 1) * H.GAP_FACTOR);
  const first = opts.title === "off" ? 0.5 : REUP_BUILD.TITLE_HOOK_SECONDS + 0.5;
  const fits = _.sortBy(spots, "at").filter((s) => s.at >= first && s.at + opts.rules.markSeconds <= Math.min(s.until, opts.total - H.TAIL) && s.mark.title);
  const picked: ReupHighlightEvent[] = [];
  for (const spot of fits) {
    if (picked.length >= count) break;
    if (picked.length && spot.at - _.last(picked)!.start < gap) continue;
    picked.push({ start: spot.at, end: spot.at + opts.rules.markSeconds, mark: spot.mark });
  }
  return picked;
};
const wrap = (text: string, chars: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (text.length <= chars || words.length < 2) return [words.join(" ")];
  const cut = _.minBy(_.range(1, words.length), (k) => Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length))!;
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
};
export const reupHighlightAss = (events: ReupHighlightEvent[], opt: { width: number; height: number; anchor: HighlightAnchor; lift?: number }): string => {
  const short = Math.min(opt.width, opt.height);
  const base = opt.height > opt.width ? short * 1.25 : opt.height;
  const [label, title, sub] = [H.LABEL, H.TITLE, H.SUB].map((k) => Math.round(base * k));
  const outline = Math.max(1, _.round(opt.height * H.OUTLINE, 1));
  const shadow = Math.max(1, _.round(opt.height * H.SHADOW, 1));
  const col = highlightColumn(opt.anchor);
  const row = highlightRow(opt.anchor);
  const margin = Math.round(opt.width * H.MARGIN_X);
  const x = [margin, Math.round(opt.width / 2), opt.width - margin][col];
  const y = [Math.round(opt.height * H.TOP), Math.round(opt.height / 2), Math.round(opt.height * (1 - (opt.lift ?? H.BOTTOM)))][row];
  const slide = Math.round(opt.width * H.SLIDE);
  const [fromX, fromY] = col === 1 ? [x, y + slide] : [col ? x + slide : x - slide, y];
  const align = HIGHLIGHT_ANCHOR_ASS[opt.anchor];
  const chars = Math.max(10, Math.floor((opt.width * H.TITLE_WIDTH) / (title * H.GLYPH)));
  const head = reupAssHead(opt.width, opt.height, `M,${H.FAMILY},${title},&H00FFFFFF,&H00FFFFFF,&H33000000,&H78000000,-1,0,0,0,100,100,0,0,1,${outline},${shadow},${align},${margin},${margin},0,1`);
  const accent = reupAssColor(H.ACCENT);
  const lines = events.map((e) => {
    const parts = [`{\\fs${label}\\fsp${H.LABEL_SPACING}\\c${accent}&\\b1}${reupAssText(e.mark.label).toUpperCase()}`, ...wrap(reupAssText(e.mark.title), chars).map((l) => `{\\fs${title}\\fsp0\\c&HFFFFFF&\\b1\\i0}${l}`), ...(e.mark.sub ? [`{\\fs${sub}\\c&HFFFFFF&\\b0\\i1}${reupAssText(e.mark.sub)}`] : [])];
    const text = (e.mark.label ? parts : parts.slice(1)).join("\\N");
    return `Dialogue: 0,${reupAssTime(e.start)},${reupAssTime(e.end)},M,,0,0,0,,{\\an${align}\\fad(${H.FADE_MS},${H.FADE_MS})\\move(${fromX},${fromY},${x},${y},0,${H.FADE_MS})}${text}`;
  });
  return [...head, ...lines, ""].join("\n");
};
