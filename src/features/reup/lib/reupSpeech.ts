import _ from "lodash";
import type { ReupMediaItem, ReupShot, ReupSubLine, ReupTranscript, ReupWord } from "../types/reup.js";
const SENTENCE_END = /[.!?…。！？]["')\]]*$/u;
const norm = (w: string): string => w.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, "");
/**
 * Phrases a script can pick from: words run together until a pause longer than `gap`, a sentence end, or `max`
 * seconds. Each phrase keeps its word range so cuts land between words.
 */
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
/**
 * Start time of each cue inside a narration, from the recogniser's words: cue texts are matched to the spoken words
 * in order (tolerant to small recognition errors); without usable words, time is shared by text length.
 */
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
/** Item covering a moment of a folder's virtual timeline. */
export const reupItemAt = (items: ReupMediaItem[], t: number): ReupMediaItem | undefined => items.find((it) => t >= it.start && t < it.end) || (t >= (_.last(items)?.end ?? 0) ? _.last(items) : undefined);
/** A shot of the virtual timeline split at item borders, as offsets inside each item. */
export const reupShotPieces = (items: ReupMediaItem[], shot: ReupShot): { item: ReupMediaItem; from: number; to: number }[] =>
  items
    .filter((it) => it.end > shot.start + 0.01 && it.start < shot.end - 0.01)
    .map((it) => ({ item: it, from: _.round(Math.max(shot.start, it.start) - it.start, 3), to: _.round(Math.min(shot.end, it.end) - it.start, 3) }));
const assTime = (s: number): string => {
  const cs = Math.max(0, Math.round(s * 100));
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};
const assColor = (hex: string): string => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
/** ASS header with one style (its line after "Style: "). */
const assHead = (width: number, height: number, style: string): string[] => [
  "[Script Info]",
  "ScriptType: v4.00+",
  `PlayResX: ${width}`,
  `PlayResY: ${height}`,
  "WrapStyle: 0",
  "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  `Style: ${style}`,
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];
const assText = (text: string): string => text.replace(/[{}\\]/g, "").replace(/\s+/g, " ").trim();
const CLAUSE_END = /[.!?…。！？,，、;；:：]["')\]」』]*$/u;
/**
 * Narration cut into subtitle lines: clause by clause, long clauses split evenly into lines of at most `maxWords`
 * words — or `maxChars` characters for scripts written without spaces (Japanese, Chinese).
 */
export const reupSubtitleLines = (text: string, maxWords: number, maxChars: number): string[] => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const spaced = clean.split(" ").length > Math.max(2, clean.length / 12);
  const tokens = spaced ? clean.split(" ") : (clean.match(/[^。！？、，,.!?；;：:]+[。！？、，,.!?；;：:」』"')]*/gu) || [clean]);
  const size = (parts: string[]): number => (spaced ? parts.length : parts.join("").length);
  const clauses: string[][] = [[]];
  tokens.forEach((t) => {
    const clause = _.last(clauses)!;
    clause.push(t);
    // A clause ends at punctuation, unless it would leave a stub line ("Well,").
    if (CLAUSE_END.test(t) && size(clause) >= (spaced ? 3 : 6)) clauses.push([]);
  });
  const limit = spaced ? maxWords : maxChars;
  return clauses
    .filter((c) => c.length)
    .flatMap((clause) => {
      if (spaced) {
        const n = Math.ceil(clause.length / limit);
        const per = Math.ceil(clause.length / n);
        return _.chunk(clause, per).map((c) => c.join(" "));
      }
      const textOf = clause.join("");
      const n = Math.ceil(size(clause) / limit);
      const per = Math.ceil(textOf.length / n);
      return _.range(n).map((k) => [...textOf].slice(k * per, (k + 1) * per).join(""));
    })
    .filter(Boolean);
};
/** Subtitle lines timed inside one narration: starts matched to the spoken words, each line held until the next. */
export const reupSubtitleTimes = (lines: string[], words: ReupWord[], total: number): ReupSubLine[] => {
  const starts = lines.length > 1 ? reupAlignCues(lines, words, total) : [0];
  return lines.map((text, i) => ({ text, start: starts[i], end: _.round(i + 1 < lines.length ? Math.max(starts[i] + 0.3, starts[i + 1] - 0.05) : total, 2) }));
};
/** Narration subtitles (ASS): one line at a time, white with a dark outline, low in the frame (`lift`: bottom margin as a share of the height). */
export const reupSubtitleAss = (lines: ReupSubLine[], opt: { width: number; height: number; font: string; lift?: number }): string => {
  const size = Math.round(Math.min(opt.width, opt.height) * (opt.height > opt.width ? 0.06 : 0.052));
  const head = assHead(opt.width, opt.height, `S,${opt.font},${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(size * 0.08))},${Math.round(size * 0.04)},2,${Math.round(opt.width * 0.06)},${Math.round(opt.width * 0.06)},${Math.round(opt.height * (opt.lift ?? (opt.height > opt.width ? 0.18 : 0.07)))},1`);
  const events = lines.filter((l) => l.end > l.start && assText(l.text)).map((l) => `Dialogue: 0,${assTime(l.start)},${assTime(l.end)},S,,0,0,0,,${assText(l.text)}`);
  return [...head, ...events, ""].join("\n");
};
/**
 * Karaoke subtitles (ASS): a few words per line, each word lights up in the brand colour while it is spoken.
 * `words` are on the output timeline; `cut` marks the first word after a jump cut (a new line starts there).
 */
export const reupKaraokeAss = (words: (ReupWord & { cut?: boolean })[], opt: { width: number; height: number; font: string; color: string; perLine: number; gap: number }): string => {
  const size = Math.round(Math.min(opt.width, opt.height) * 0.075);
  const lines: ReupWord[][] = [];
  words.forEach((w, i) => {
    const line = _.last(lines);
    if (!line || line.length >= opt.perLine || w.cut || w.s - words[i - 1].e > opt.gap) lines.push([w]);
    else line.push(w);
  });
  const head = assHead(opt.width, opt.height, `K,${opt.font},${size},${assColor(opt.color)},&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,${Math.round(size * 0.09)},${Math.round(size * 0.05)},2,40,40,${Math.round(opt.height * 0.2)},1`);
  const events = lines.map((line) => {
    const start = line[0].s;
    const text = line.map((w, i) => `{\\k${Math.max(1, Math.round(((line[i + 1]?.s ?? w.e) - w.s) * 100))}}${w.w.trim().toUpperCase().replace(/[{}\\]/g, "")}`).join(" ");
    return `Dialogue: 0,${assTime(start)},${assTime(_.last(line)!.e + 0.15)},K,,0,0,0,,${text}`;
  });
  return [...head, ...events, ""].join("\n");
};
