import _ from "lodash";
import { REUP_TEXT } from "../constants/reupConfig.js";
import type { ReupMediaItem, ReupShot, ReupSubLine, ReupTranscript, ReupWord } from "../types/reup.js";
const SENTENCE_END = /[.!?…。！？]["')\]]*$/u;
const norm = (w: string): string =>
  w
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "");
export const reupPhrases = (words: ReupWord[], gap: number, max: number): ReupTranscript["phrases"] => {
  const out: ReupTranscript["phrases"] = [];
  let from = 0;
  words.forEach((word, i) => {
    const next = words[i + 1];
    const end = !next || next.s - word.e > gap || SENTENCE_END.test(word.w.trim()) || word.e - words[from].s >= max;
    if (!end) return;
    const piece = words.slice(from, i + 1);
    out.push({ id: `p${out.length + 1}`, from, to: i, start: _.round(piece[0].s, 2), end: _.round(word.e, 2), text: piece.map((x) => x.w.trim()).join(" ") });
    from = i + 1;
  });
  return out;
};
export const reupAlignCues = (cues: string[], words: ReupWord[], total: number): number[] => {
  const lengths = cues.map((c) => Math.max(1, c.replace(/\s+/g, "").length));
  const byLength = (): number[] => {
    const sum = _.sum(lengths);
    let acc = 0;
    return lengths.map((l) => {
      const at = (acc / sum) * total;
      acc += l;
      return _.round(at, 2);
    });
  };
  const spoken = words.map((w) => ({ ...w, n: norm(w.w) })).filter((w) => w.n);
  if (cues.length < 2 || spoken.length < cues.length) return byLength();
  const tokens = cues.map((c) => c.split(/\s+/).map(norm).filter(Boolean));
  const totalTokens = _.sum(tokens.map((t) => t.length)) || 1;
  const starts: number[] = [0];
  let cursor = 0;
  let before = tokens[0].length;
  for (let k = 1; k < cues.length; k++) {
    const head = tokens[k].slice(0, 3);
    const expect = Math.round((before / totalTokens) * spoken.length);
    let best = -1;
    let bestScore = 0;
    for (let i = Math.max(cursor, expect - 12); i < Math.min(spoken.length, expect + 12); i++) {
      const score = head.reduce((acc, t, j) => acc + (spoken[i + j]?.n === t ? 1 : 0), 0);
      if (score > bestScore || (score === bestScore && best >= 0 && Math.abs(i - expect) < Math.abs(best - expect))) {
        best = i;
        bestScore = score;
      }
    }
    if (best < 0 || bestScore === 0) best = _.clamp(expect, cursor, spoken.length - 1);
    starts.push(_.round(spoken[best].s, 2));
    cursor = best + 1;
    before += tokens[k].length;
  }
  return starts.map((s, i) => (i && s <= starts[i - 1] ? byLength()[i] : s));
};
export const reupItemAt = (items: ReupMediaItem[], t: number): ReupMediaItem | undefined => items.find((it) => t >= it.start && t < it.end) || (t >= (_.last(items)?.end ?? 0) ? _.last(items) : undefined);
export const reupShotPieces = (items: ReupMediaItem[], shot: ReupShot): { item: ReupMediaItem; from: number; to: number }[] => items.filter((it) => it.end > shot.start + 0.01 && it.start < shot.end - 0.01).map((it) => ({ item: it, from: _.round(Math.max(shot.start, it.start) - it.start, 3), to: _.round(Math.min(shot.end, it.end) - it.start, 3) }));
export const reupAssTime = (s: number): string => {
  const cs = Math.max(0, Math.round(s * 100));
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};
export const reupAssColor = (hex: string): string => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
export const reupAssHead = (width: number, height: number, style: string | string[]): string[] => [
  "[Script Info]",
  "ScriptType: v4.00+",
  `PlayResX: ${width}`,
  `PlayResY: ${height}`,
  "WrapStyle: 0",
  "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  ...[style].flat().map((one) => `Style: ${one}`),
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];
export const reupAssText = (text: string): string =>
  text
    .replace(/[{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export const reupSubChars = (aspect: string, lang = "en"): number => {
  const [w, h] = aspect === "9:16" ? [9, 16] : [16, 9];
  const glyph = lang === "ja" || lang === "ko" ? REUP_TEXT.SUB_GLYPH_CJK : REUP_TEXT.SUB_GLYPH;
  return Math.max(12, Math.floor((w * REUP_TEXT.SUB_WIDTH) / (h * REUP_TEXT.SUB_SIZE * glyph))) * REUP_TEXT.SUB_ROWS;
};
export const reupSubtitleLines = (text: string, maxChars: number): string[] => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const spaced = clean.split(" ").length > Math.max(2, clean.length / 12);
  const clauses = (clean.match(/[^,，、;；:：.!?…。！？]+(?:[,，、;；:：.!?…。！？]+["')\]」』]*)?/gu) || [clean]).map((c) => c.trim()).filter(Boolean);
  const split = (clause: string): string[] => {
    if (clause.length <= maxChars) return [clause];
    const n = Math.ceil(clause.length / maxChars);
    if (!spaced) {
      const per = Math.ceil(clause.length / n);
      return _.range(n).map((k) => [...clause].slice(k * per, (k + 1) * per).join(""));
    }
    const words = clause.split(" ");
    const out: string[] = [];
    let line = "";
    const per = clause.length / n;
    for (const word of words) {
      if (line && (line.length + 1 + word.length > maxChars || line.length >= per)) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    return line ? [...out, line] : out;
  };
  const out: string[] = [];
  for (const piece of clauses.flatMap(split)) {
    const last = out[out.length - 1];
    const joined = last && (spaced ? `${last} ${piece}` : `${last}${piece}`);
    if (last && joined && (joined.length <= maxChars || last.length < 8)) out[out.length - 1] = joined;
    else out.push(piece);
  }
  return out;
};
export const reupSentences = (text: string, max: number, min = 12): string[] => {
  const parts = (
    text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[^.!?…。！？]+(?:[.!?…。！？]+["')\]」』]*|$)/gu) || []
  )
    .map((p) => p.trim())
    .filter(Boolean);
  const cut = (sentence: string): string[] => {
    const out: string[] = [];
    let rest = sentence;
    while (rest.length > max) {
      const head = rest.slice(0, max);
      const clause = Math.max(head.lastIndexOf(", "), head.lastIndexOf("、"), head.lastIndexOf("，")) + 1;
      const space = head.lastIndexOf(" ");
      const at = clause > max / 3 ? clause : space > max / 3 ? space : max;
      out.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    return rest ? [...out, rest] : out;
  };
  const merged: string[] = [];
  for (const part of parts.flatMap(cut)) {
    const last = merged[merged.length - 1];
    if (last && last.length < min && last.length + part.length + 1 <= max) merged[merged.length - 1] = `${last} ${part}`;
    else merged.push(part);
  }
  return merged;
};
export const reupClipSubtitles = (clips: { text: string; start: number; end: number }[], maxChars: number): ReupSubLine[] => clips.flatMap((clip) => reupSubtitleTimes(reupSubtitleLines(clip.text, maxChars), [], clip.end - clip.start).map((line) => ({ text: line.text, start: _.round(clip.start + line.start, 2), end: _.round(clip.start + line.end, 2) })));
export const reupSubtitleTimes = (lines: string[], words: ReupWord[], total: number): ReupSubLine[] => {
  const starts = lines.length > 1 ? reupAlignCues(lines, words, total) : [0];
  return lines.map((text, i) => ({ text, start: starts[i], end: _.round(i + 1 < lines.length ? Math.max(starts[i] + 0.3, starts[i + 1] - 0.05) : total, 2) }));
};
export const reupSubtitleAss = (lines: ReupSubLine[], opt: { width: number; height: number; font: string; lift?: number }): string => {
  const T = REUP_TEXT;
  const size = Math.max(T.SUB_MIN_PX, Math.round(opt.height * T.SUB_SIZE));
  const side = Math.round((opt.width * (1 - T.SUB_WIDTH)) / 2);
  const bottom = Math.round(opt.height * (opt.lift ?? (opt.height > opt.width ? T.SUB_BOTTOM_VERTICAL : T.SUB_BOTTOM)));
  const outline = Math.max(1, _.round(opt.height * T.SUB_OUTLINE, 1));
  const shadow = _.round(opt.height * T.SUB_SHADOW, 1);
  const head = reupAssHead(opt.width, opt.height, `S,${opt.font},${size},&H00FFFFFF,&H00FFFFFF,&H1A000000,&H8C000000,-1,0,0,0,100,100,0,0,1,${outline},${shadow},2,${side},${side},${bottom},1`);
  const events = lines.filter((l) => l.end > l.start && reupAssText(l.text)).map((l) => `Dialogue: 0,${reupAssTime(l.start)},${reupAssTime(l.end)},S,,0,0,0,,${reupAssText(l.text)}`);
  return [...head, ...events, ""].join("\n");
};
const ASS_TIME = /^(\d+):(\d{2}):(\d{2})\.(\d{2})$/;
const fromAssTime = (t: string): number => {
  const m = ASS_TIME.exec(t.trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 100 : 0;
};
export const reupAssSlice = (ass: string, from: number, to: number): string => {
  const lines = ass.split("\n");
  const events = lines.indexOf("[Events]");
  const head = lines.slice(0, events + 2);
  const body = lines.slice(events + 2).flatMap((line) => {
    const parts = line.split(",");
    if (!line.startsWith("Dialogue:") || parts.length < 10) return [];
    const start = fromAssTime(parts[1]);
    const end = fromAssTime(parts[2]);
    if (end <= from || start >= to) return [];
    parts[1] = reupAssTime(Math.max(0, start - from));
    parts[2] = reupAssTime(Math.min(to, end) - from);
    const shifted = parts.join(",");
    return [start < from ? shifted.replace(/\\move\(([^,]+),([^,]+),([^,]+),([^,)]+)[^)]*\)/, "\\pos($3,$4)").replace(/\\fad\((\d+),(\d+)\)/, "\\fad(0,$2)") : shifted];
  });
  return body.length ? [...head, ...body, ""].join("\n") : "";
};
