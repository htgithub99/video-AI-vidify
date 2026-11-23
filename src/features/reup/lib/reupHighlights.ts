import _ from "lodash";
import { REUP_BUILD, REUP_HIGHLIGHT as H, REUP_TYPE as T } from "../constants/reupConfig.js";
import type { ReupHighlights, ReupMark, ReupPopLook, ReupPresetRules, ReupTitleOverlay } from "../types/reup.js";
import type { ReupPopTheme } from "../constants/reupConfig.js";
import type { HighlightAnchor } from "../../../constants/highlightAnchor.js";
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
export const reupPickHighlights = (spots: ReupHighlightSpot[], opts: { total: number; mode: ReupHighlights; rules: Pick<ReupPresetRules, "markEvery" | "markMax" | "markSeconds">; title: ReupTitleOverlay; quick?: boolean }): ReupHighlightEvent[] => {
  const rules = opts.rules;
  const count = reupHighlightCount(opts.total, opts.mode, rules);
  const gap = opts.quick ? H.SHORT.MIN_GAP : Math.max(H.MIN_GAP, rules.markEvery * (opts.mode === "normal" ? H.NORMAL_FACTOR : 1) * H.GAP_FACTOR);
  const first = opts.quick ? H.SHORT.FIRST : opts.title === "off" ? 0.5 : REUP_BUILD.TITLE_HOOK_SECONDS + 0.5;
  const fits = _.sortBy(spots, "at").filter((s) => s.at >= first && s.at + rules.markSeconds <= Math.min(s.until, opts.total - H.TAIL) && s.mark.title);
  const picked: ReupHighlightEvent[] = [];
  for (const spot of fits) {
    if (picked.length >= count) break;
    if (picked.length && spot.at - _.last(picked)!.start < gap) continue;
    picked.push({ start: spot.at, end: spot.at + rules.markSeconds, mark: spot.mark });
  }
  return picked;
};
const wrap = (text: string, chars: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (text.length <= chars || words.length < 2) return [words.join(" ")];
  const cut = _.minBy(_.range(1, words.length), (k) => Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length))!;
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
};
const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const tag = (hex: string): string => `&H${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}&`.toUpperCase();
const rounded = (w: number, h: number, r: number): string => {
  const [W, Hh, R] = [w, h, Math.min(r, w / 2, h / 2)].map((n) => Math.round(n));
  return `m ${R} 0 l ${W - R} 0 b ${W} 0 ${W} 0 ${W} ${R} l ${W} ${Hh - R} b ${W} ${Hh} ${W} ${Hh} ${W - R} ${Hh} l ${R} ${Hh} b 0 ${Hh} 0 ${Hh} 0 ${Hh - R} l 0 ${R} b 0 0 0 0 ${R} 0`;
};
const box = (w: number, h: number): string => `m 0 0 l ${Math.round(w)} 0 l ${Math.round(w)} ${Math.round(h)} l 0 ${Math.round(h)}`;
export interface ReupTextRow {
  style: string;
  size: number;
  text: string;
  lead: number;
}
export interface ReupTextArea {
  top: number;
  bottom: number;
}
export const reupTextUnit = (width: number, height: number): number => (height > width ? width / T.BASE : height / T.LANDSCAPE);
export const reupTextWidth = (text: string, size: number, glyph: number): number => size * _.sumBy([...text], (c) => (c === " " ? glyph * 0.5 : CJK.test(c) ? T.GLYPH.cjk : glyph));
export const reupBlockHeight = (rows: ReupTextRow[]): number => (rows.length ? _.sumBy(rows.slice(0, -1), "lead") + _.last(rows)!.size * T.LEAD.box : 0);
export const reupWrapTitle = (text: string, maxWidth: number, size: number, glyph: number, split = false): { lines: string[]; size: number } => {
  const words = text.split(/\s+/).filter(Boolean);
  const one = [words.join(" ")];
  const two =
    words.length < 2
      ? one
      : (() => {
          const cut = _.minBy(_.range(1, words.length), (k) => Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length))!;
          return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
        })();
  const lines = reupTextWidth(one[0], size, glyph) <= maxWidth && !(split && words.length > 2) ? one : two;
  const widest = _.max(lines.map((l) => reupTextWidth(l, size, glyph)))!;
  return { lines, size: Math.round(widest > maxWidth ? Math.max(size * 0.72, (size * maxWidth) / widest) : size) };
};
export const reupStackEvents = (rows: ReupTextRow[], at: { x: number; top: number; an: 7 | 8 | 9; start: number; end: number; rise?: number; layer?: number; extra?: string }): string[] => {
  let y = at.top;
  return rows.map((row) => {
    const top = Math.round(y);
    y += row.lead;
    const place = at.rise ? `\\move(${Math.round(at.x)},${top + at.rise},${Math.round(at.x)},${top},0,${H.SHORT.RISE_MS})` : `\\pos(${Math.round(at.x)},${top})`;
    return `Dialogue: ${at.layer ?? 2},${reupAssTime(at.start)},${reupAssTime(at.end)},${row.style},,0,0,0,,{\\an${at.an}${place}${at.extra || ""}}${row.text}`;
  });
};
const fonts = (lang: string, cjk?: string) => ((lang === "ja" || lang === "ko") && cjk ? { display: cjk, head: cjk, label: cjk, serif: cjk, glyph: { display: T.GLYPH.cjk, head: T.GLYPH.cjk, serif: T.GLYPH.cjk, label: T.GLYPH.cjk } } : { ...T.FONT, glyph: T.GLYPH });
export const reupPopAss = (events: ReupHighlightEvent[], opt: { width: number; height: number; look: ReupPopLook; theme: ReupPopTheme; lang: string; area: ReupTextArea; focus?: (number | undefined)[]; cjk?: string }): string => {
  const P = H.SHORT,
    u = reupTextUnit(opt.width, opt.height),
    F = fonts(opt.lang, opt.cjk),
    kind = opt.theme.kind,
    Z = T.SIZE,
    m = Math.round(T.MARGIN * u),
    accent = reupAssColor(opt.theme.accent),
    outline = _.round(T.OUTLINE * u, 1),
    shadow = _.round(T.SHADOW * u, 1),
    up = (t: string) => reupAssText(t).toLocaleUpperCase(opt.lang),
    fade = `\\fad(${P.FADE[0]},${P.FADE[1]})`;
  const styles = [
    `CL,${F.display},${Math.round(Z.caption.label * u)},${accent},${accent},&H00141414,&H64000000,0,0,0,0,100,100,${T.SPACING.label},0,1,${outline},${shadow},8,0,0,0,1`,
    `CT,${F.display},${Math.round(Z.caption.title * u)},&H00FFFFFF,&H00FFFFFF,&H00141414,&H64000000,0,0,0,0,100,100,0,0,1,${outline},${shadow},8,0,0,0,1`,
    `CG,${F.display},${Math.round(Z.caption.title * u)},&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,${_.round(T.GLOW * u, 1)},0,8,0,0,0,1`,
    `EL,${F.label},${Math.round(Z.editorial.label * u)},${accent},${accent},&H00000000,&H64000000,0,0,0,0,100,100,${T.SPACING.label},0,1,0,${_.round(shadow * 0.6, 1)},7,0,0,0,1`,
    `ET,${F.serif},${Math.round(Z.editorial.title * u)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,0,${shadow},7,0,0,0,1`,
    `ES,${F.serif},${Math.round(Z.editorial.sub * u)},${reupAssColor(T.SUB_COLOR)},${reupAssColor(T.SUB_COLOR)},&H00000000,&H78000000,0,-1,0,0,100,100,0,0,1,0,${_.round(shadow * 0.8, 1)},7,0,0,0,1`,
    `TL,${F.label},${Math.round(Z.tag.label * u)},${reupAssColor(T.INK)},${reupAssColor(T.INK)},&H00000000,&H00000000,-1,0,0,0,100,100,${T.SPACING.label},0,1,0,0,7,0,0,0,1`,
    `TT,${F.head},${Math.round(Z.tag.title * u)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,0,0,1,0,${shadow},7,0,0,0,1`,
    `SH,Arial,10,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1`,
  ];
  const head = reupAssHead(opt.width, opt.height, styles);
  const lines = events.flatMap((e, k) => {
    const f = opt.focus?.[k];
    const alt = opt.look === "alt";
    const right = kind !== "caption" && (f !== undefined && f < 0.4 ? true : f !== undefined && f > 0.6 ? false : alt);
    const label = e.mark.label ? up(e.mark.label) : "";
    const time = { start: e.start, end: e.end, rise: Math.round(P.RISE * Z.caption.label * u), extra: fade };
    if (kind === "caption") {
      const t = reupWrapTitle(up(e.mark.title), opt.width - m * 2, Math.round(Z.caption.title * u), F.glyph.display, true);
      const rows: ReupTextRow[] = [...(label ? [{ style: "CL", size: Math.round(Z.caption.label * u), text: label, lead: Z.caption.label * u * 1.25 }] : []), ...t.lines.map((l, i) => ({ style: "CT", size: t.size, text: `${t.size !== Math.round(Z.caption.title * u) ? `{\\fs${t.size}}` : ""}${i && t.lines.length > 1 ? `{\\c${accent}}` : ""}${l}`, lead: t.size * T.LEAD.caps }))];
      const h = reupBlockHeight(rows);
      const top = alt ? opt.area.top + m * 1.6 : opt.area.bottom - m * T.CAPTION_LIFT - h;
      const glow = rows.filter((r) => r.style === "CT").map((r) => ({ ...r, style: "CG", text: r.text.replace(/\{\\c[^}]*\}/, "") }));
      const glowTop = top + (label ? rows[0].lead : 0);
      return [...reupStackEvents(glow, { x: opt.width / 2, top: glowTop, an: 8, ...time, layer: 1, extra: `${fade}\\blur${Math.round(T.GLOW_BLUR * u)}\\alpha&H${T.GLOW_ALPHA}&` }), ...reupStackEvents(rows, { x: opt.width / 2, top, an: 8, ...time })];
    }
    const width = (opt.width - m * 2) * T.TITLE_WIDTH[kind];
    const x = right ? opt.width - m : m;
    const an = right ? 9 : 7;
    if (kind === "editorial") {
      const S = Z.editorial;
      const t = reupWrapTitle(reupAssText(e.mark.title), width, Math.round(S.title * u), F.glyph.serif);
      const sub = e.mark.sub ? reupAssText(e.mark.sub) : "";
      const rows: ReupTextRow[] = [
        ...(label ? [{ style: "EL", size: Math.round(S.label * u), text: label, lead: S.label * u * T.LEAD.label }] : []),
        ...t.lines.map((l, i) => ({ style: "ET", size: t.size, text: `${t.size !== Math.round(S.title * u) ? `{\\fs${t.size}}` : ""}${l}`, lead: t.size * (i < t.lines.length - 1 ? T.LEAD.serifTitle : T.LEAD.sub) })),
        ...(sub ? [{ style: "ES", size: Math.round(S.sub * u), text: sub, lead: 0 }] : []),
      ];
      const h = reupBlockHeight(rows);
      const top = opt.area.bottom - m - h;
      const scrimTop = Math.max(opt.area.top, top - m * T.SCRIM_PAD);
      return [`Dialogue: 0,${reupAssTime(e.start)},${reupAssTime(e.end)},SH,,0,0,0,,{\\an7\\pos(0,${Math.round(scrimTop)})${fade}\\c&H000000&\\alpha&H${T.SCRIM_ALPHA}&\\blur${Math.round(T.SCRIM_BLUR * u)}\\p1}${box(opt.width, opt.area.bottom - scrimTop)}`, ...reupStackEvents(rows, { x, top, an, ...time })];
    }
    const S = Z.tag;
    const pill = Math.round(S.pill * u);
    const pad = Math.round(S.pillPad * u);
    const t = reupWrapTitle(reupAssText(e.mark.title), width, Math.round(S.title * u), F.glyph.head);
    const rows: ReupTextRow[] = t.lines.map((l) => ({ style: "TT", size: t.size, text: `${t.size !== Math.round(S.title * u) ? `{\\fs${t.size}}` : ""}${l}`, lead: t.size * T.LEAD.title }));
    const top = opt.area.top + m;
    const titleTop = label ? top + pill + Math.round(S.pillGap * u) : top;
    const h = titleTop - top + reupBlockHeight(rows);
    const pw = Math.round(reupTextWidth(label, Math.round(S.label * u), F.glyph.label) + pad * 2 + T.SPACING.label * label.length);
    const px = right ? opt.width - m - pw : m;
    const chip = label
      ? [
          `Dialogue: 1,${reupAssTime(e.start)},${reupAssTime(e.end)},SH,,0,0,0,,{\\an7\\move(${px},${top + time.rise},${px},${top},0,${P.RISE_MS})${fade}\\c${tag(opt.theme.accent)}\\p1}${rounded(pw, pill, pill / 2)}`,
          `Dialogue: 2,${reupAssTime(e.start)},${reupAssTime(e.end)},TL,,0,0,0,,{\\an4\\move(${px + pad},${top + Math.round(pill / 2) + time.rise},${px + pad},${top + Math.round(pill / 2)},0,${P.RISE_MS})${fade}}${label}`,
        ]
      : [];
    return [`Dialogue: 0,${reupAssTime(e.start)},${reupAssTime(e.end)},SH,,0,0,0,,{\\an7\\pos(0,${Math.round(opt.area.top)})${fade}\\c&H000000&\\alpha&H${T.SCRIM_ALPHA}&\\blur${Math.round(T.SCRIM_BLUR * u)}\\p1}${box(opt.width, h + m * T.SCRIM_PAD)}`, ...chip, ...reupStackEvents(rows, { x, top: titleTop, an, ...time })];
  });
  return [...head, ...lines, ""].join("\n");
};
export const reupHighlightAss = (events: ReupHighlightEvent[], opt: { width: number; height: number; anchor: HighlightAnchor; area: ReupTextArea }): string => {
  const short = Math.min(opt.width, opt.height);
  const base = opt.height > opt.width ? short * 1.25 : opt.height;
  const [label, title, sub] = [H.LABEL, H.TITLE, H.SUB].map((k) => Math.round(base * k));
  const outline = Math.max(1, _.round(opt.height * H.OUTLINE, 1));
  const shadow = Math.max(1, _.round(opt.height * H.SHADOW, 1));
  const col = highlightColumn(opt.anchor);
  const row = highlightRow(opt.anchor);
  const margin = Math.round(opt.width * H.MARGIN_X);
  const x = [margin, Math.round(opt.width / 2), opt.width - margin][col];
  const an = ([7, 8, 9] as const)[col];
  const slide = Math.round(opt.width * H.SLIDE);
  const chars = Math.max(10, Math.floor((opt.width * H.TITLE_WIDTH) / (title * H.GLYPH)));
  const style = (name: string, size: number, color: string, bold: number, italic: number, spacing: number) => `${name},${H.FAMILY},${size},${color},${color},&H33000000,&H78000000,${bold},${italic},0,0,100,100,${spacing},0,1,${outline},${shadow},${an},0,0,0,1`;
  const head = reupAssHead(opt.width, opt.height, [style("HL", label, reupAssColor(H.ACCENT), -1, 0, H.LABEL_SPACING), style("HT", title, "&H00FFFFFF", -1, 0, 0), style("HS", sub, "&H00FFFFFF", 0, -1, 0)]);
  const lines = events.flatMap((e) => {
    const titles = wrap(reupAssText(e.mark.title), chars);
    const rows: ReupTextRow[] = [...(e.mark.label ? [{ style: "HL", size: label, text: reupAssText(e.mark.label).toUpperCase(), lead: label * H.LEAD.label }] : []), ...titles.map((t, i) => ({ style: "HT", size: title, text: t, lead: title * (i < titles.length - 1 ? H.LEAD.title : H.LEAD.sub) })), ...(e.mark.sub ? [{ style: "HS", size: sub, text: reupAssText(e.mark.sub), lead: 0 }] : [])];
    const h = reupBlockHeight(rows);
    const top = [opt.area.top, (opt.area.top + opt.area.bottom - h) / 2, opt.area.bottom - h][row];
    const [dx, dy] = col === 1 ? [0, slide] : [col ? slide : -slide, 0];
    let y = top;
    return rows.map((r) => {
      const at = Math.round(y);
      y += r.lead;
      return `Dialogue: 0,${reupAssTime(e.start)},${reupAssTime(e.end)},${r.style},,0,0,0,,{\\an${an}\\fad(${H.FADE_MS},${H.FADE_MS})\\move(${x + dx},${at + dy},${x},${at},0,${H.FADE_MS})}${r.text}`;
    });
  });
  return [...head, ...lines, ""].join("\n");
};
