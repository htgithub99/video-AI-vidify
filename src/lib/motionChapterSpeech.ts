import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { motionSpeechResponseIssues } from "./motionSpeechResponse.js";
const words = (text: string): string =>
  (
    text
      .normalize(COMMON_RUNTIME.SOURCE_TEXT_NFC)
      .toLowerCase()
      .match(/[\p{L}\p{N}\p{M}]+/gu) || []
  ).join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52);
export const repairMotionChapterSpeech = (row: Record<string, any>, cast: string[]): Record<string, any> => {
  const lines = row.utterances;
  if (typeof row.narration !== "string" || !Array.isArray(lines) || lines.length < 2) return row;
  const speakers = [RUNTIME_VALUES.NARRATOR_663EE49C, ...cast];
  if (!motionSpeechResponseIssues(lines, speakers, row.narration).length) return row;
  if (lines.some((line) => typeof line?.text !== "string" || motionSpeechResponseIssues([line], speakers, line.text).length)) return row;
  const narrators = lines.filter((line) => line.speaker === RUNTIME_VALUES.NARRATOR_663EE49C);
  if (narrators.length !== 1 || words(narrators[0].text) !== words(row.narration)) return row;
  const quotations = [...row.narration.matchAll(/"[^"\n]+"|“[^”\n]+”|«[^»\n]+»|‘[^’\n]+’/gu)];
  const spans = lines
    .filter((line) => line.speaker !== RUNTIME_VALUES.NARRATOR_663EE49C)
    .map((line) => {
      const matches = quotations.filter((quote) => words(quote[0]) === words(line.text));
      return matches.length === 1 ? { line, start: matches[0].index!, end: matches[0].index! + matches[0][0].length } : undefined;
    });
  if (!spans.length || spans.some((span) => !span)) return row;
  const ordered = spans.filter((span) => !!span).sort((a, b) => a.start - b.start);
  if (ordered.some((span, index) => index > 0 && span.start < ordered[index - 1].end)) return row;
  const utterances: Record<string, any>[] = [];
  const ids = new Set(lines.map((line) => line.id).filter(Boolean));
  let part = 0;
  const narrator = (text: string) => {
    if (!words(text)) return;
    let id = narrators[0].id;
    if (part++) {
      id = `${narrators[0].id || row.id || RUNTIME_VALUES.NARRATOR_663EE49C}${RUNTIME_VALUES.PART_F21642E6}${part}`;
      while (ids.has(id)) id += COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_25;
    }
    if (id) ids.add(id);
    utterances.push({ ...narrators[0], ...(id ? { id } : {}), text: text.trim() });
  };
  let cursor = 0;
  for (const span of ordered) {
    narrator(row.narration.slice(cursor, span.start));
    utterances.push({ ...span.line, text: row.narration.slice(span.start, span.end) });
    cursor = span.end;
  }
  narrator(row.narration.slice(cursor));
  return motionSpeechResponseIssues(utterances, speakers, row.narration).length ? row : { ...row, utterances };
};
