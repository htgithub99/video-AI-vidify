import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_SOURCE_SPLIT_DECIMAL_PATTERN } from "../constants/motionSource.js";
const SPLIT_DECIMAL = new RegExp(MOTION_SOURCE_SPLIT_DECIMAL_PATTERN, MR.MOTION_TEXT_GM);
const SOUND_CUE = /\*[^*\n]{1,60}\*/g;
const MISSING_QUOTE = /((?:to quote|as [^.,\n]{1,40} put it|in the words of [^.,\n]{1,40}|[^.,\n]{1,40} (?:wrote|said|points out|responded|stated)(?: in a comment)?)[^.\n]{0,60}?)(\.\.\.|…)(?=\s|$)(?![ \t]*(?:\(\d{1,2}:\d{2}(?::\d{2})?\)[ \t]*)?\[)/gi;
export const MISSING_QUOTE_MARK = MR.MOTION_TEXT_AUDIO_QUOTE_NOT_IN_TRANSCRIPT;
export interface SourceCleanReport {
  splitNumbers: number;
  soundCues: number;
  missingQuotes: number;
}
export const cleanTranscriptInput = (raw: string): { text: string; report: SourceCleanReport } => {
  let text = String(raw || "").replace(/\r\n?/g, RT_SHARED.SYMBOL_01BA47);
  const report: SourceCleanReport = { splitNumbers: 0, soundCues: 0, missingQuotes: 0 };
  text = text.replace(SPLIT_DECIMAL, (_m, pre, a, ts, b) => {
    report.splitNumbers++;
    return MR.MOTION_TEMPLATE_SYMBOL_78(pre, a, b, ts);
  });
  text = text.replace(SOUND_CUE, () => {
    report.soundCues++;
    return RT_SHARED.SYMBOL_36A9E7;
  });
  text = text.replace(MISSING_QUOTE, (_m, lead) => {
    report.missingQuotes++;
    return MR.MOTION_TEMPLATE_SYMBOL_79(lead, MISSING_QUOTE_MARK);
  });
  text = text.replace(/[ \t]{2,}/g, RT_SHARED.SYMBOL_36A9E7);
  return { text, report };
};
export const SOURCE_READING_RULES = MR.MOTION_TEMPLATE_SOURCE_READING_RULES_BRACKETED_NAMES_SUCH_AS_CARL_SAGAN_MARK_RECO(MISSING_QUOTE_MARK);
const words = (s: string): string[] =>
  s
    .toLowerCase()
    .normalize(MR.MOTION_TEXT_NFKD)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, RT_SHARED.SYMBOL_36A9E7)
    .trim()
    .split(RT_SHARED.SYMBOL_36A9E7)
    .filter(Boolean);
const shingles = (w: string[], n: number): string[] => (w.length < n ? ([w.join(RT_SHARED.SYMBOL_36A9E7)] as string[]) : w.slice(0, w.length - n + 1).map((_x, i) => w.slice(i, i + n).join(RT_SHARED.SYMBOL_36A9E7)));
export const transcriptIndex = (transcript: string): Set<string> => new Set(shingles(words(transcript), 4));
export const quoteErrors = (beats: any[], index: Set<string>): string[] => {
  const errors: string[] = [];
  beats.forEach((beat, i) => {
    if (beat?.visual !== MR.MOTION_TEXT_QUOTE || !String(beat?.data?.author || "").trim()) return;
    const quote = String(beat?.data?.sourceQuote || "");
    if (quote.includes(MISSING_QUOTE_MARK)) {
      errors.push(MR.MOTION_TEMPLATE_BEAT_THE_QUOTE_BY_IS_NOT_IN_THE_TRANSCRIPT_AUDIO_ONLY_NARRATE_IT_(i + 1, beat.data.author));
      return;
    }
    const w = words(quote);
    if (w.length < 5) {
      errors.push(MR.MOTION_TEMPLATE_BEAT_QUOTE_CARD_BY_NEEDS_DATA_SOURCEQUOTE_WITH_THE_EXACT_TRANSCRI(i + 1, beat.data.author));
      return;
    }
    const sh = shingles(w, 4);
    const found = sh.filter((x) => index.has(x)).length / sh.length;
    if (found < 0.75) errors.push(MR.MOTION_TEMPLATE_BEAT_DATA_SOURCEQUOTE_BY_IS_NOT_FOUND_IN_THE_TRANSCRIPT_NEVER_INV(i + 1, beat.data.author, quote.slice(0, 80)));
  });
  return errors;
};
export const unattributeUnverifiedQuotes = <T extends { visual?: string; narration?: string; data?: Record<string, unknown> }>(beats: T[], index: Set<string>): { beats: T[]; changed: number } => {
  let changed = 0;
  const out = beats.map((beat) => {
    if (!quoteErrors([beat], index).length) return beat;
    changed++;
    const { author: _author, sourceQuote: _sourceQuote, ...rest } = (beat.data || {}) as Record<string, unknown>;
    return { ...beat, data: { ...rest, text: beat.narration || rest.text } };
  });
  return { beats: out, changed };
};
