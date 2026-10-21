import _ from "lodash";
import { PUPPET as P, PUPPET_LIBRARY_MODES as LM, PUPPET_STYLE_NONE } from "../constants/motionPuppet.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";

export interface PuppetLine { key: string; text: string; beatId: string; place?: string; speaker?: string; chapterId: string; cast: string[]; utterance?: string; }
export const puppetSentenceKey = (text: string): string => _.trim(String(text || P.EMPTY).toLowerCase().normalize(P.NFC).replace(P.NORM_STRIP_RE, P.SPACE));
export const splitPuppetSentences = (text: string): string[] => _.compact(_.map(String(text || P.EMPTY).match(P.SENTENCE_RE) || [], _.trim));
export const puppetBeatLines = (beat: MotionBeat): PuppetLine[] => {
  const parts = beat.utterances?.length ? beat.utterances.map((u) => ({ text: u.text, speaker: u.role === P.DIALOGUE ? u.speaker : undefined, id: u.id })) : [{ text: beat.narration, speaker: undefined, id: undefined }];
  const out: PuppetLine[] = [];
  for (const part of parts)
    for (const text of splitPuppetSentences(part.text)) {
      const key = puppetSentenceKey(text);
      if (key) out.push({ key, text, beatId: beat.id, place: beat.place, speaker: part.speaker, chapterId: beat.chapterId, cast: beat.cast || [], utterance: part.id });
    }
  return out;
};
export const collectPuppetLines = (script: MotionStoryScript, sceneVisual: string): PuppetLine[] => {
  const seen = new Set<string>();
  const out: PuppetLine[] = [];
  for (const beat of script.beats as MotionBeat[]) {
    if (beat.visual !== sceneVisual) continue;
    for (const l of puppetBeatLines(beat)) {
      if (seen.has(l.key)) continue;
      seen.add(l.key);
      out.push(l);
    }
  }
  return out;
};
export const puppetNoPack = (stylePreset: unknown, references: number): boolean => references > 0 || !stylePreset || stylePreset === PUPPET_STYLE_NONE;
export const puppetLibraryMode = (analysis: Pick<MotionStoryAnalysis, "stylePreset" | "series">, references: number): string =>
  (analysis.series?.count || 0) >= 2 ? LM.SERIES : puppetNoPack(analysis.stylePreset, references) ? LM.FRESH : LM.AUTO;
export const puppetTags = (v: unknown): string[] => _.take(_.uniq(_.compact(_.map(_.castArray(v || []), (t) => _.snakeCase(_.toString(t))))), P.TAGS_MAX);
