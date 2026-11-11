import _ from "lodash";
import { MOTION_BEAT_LINES as P } from "../constants/motionBeatLines.js";
import type { MotionBeat, MotionScenePlan } from "../types/motionVideo.js";
import { motionNarratorLines } from "./motionVoice.js";
export interface MotionBeatLine {
  key: string;
  text: string;
  beatId: string;
  place?: string;
  speaker?: string;
  chapterId: string;
  cast: string[];
  utterance?: string;
  scenePlan?: MotionScenePlan;
  action?: string;
  time?: string;
  speakers?: string[];
}
const sentenceKey = (text: string): string => _.trim(String(text || P.EMPTY).toLowerCase().normalize(P.NFC).replace(P.NORM_STRIP_RE, P.SPACE));
const sentences = (text: string): string[] => _.compact(_.map(String(text || P.EMPTY).match(P.SENTENCE_RE) || [], _.trim));
export const motionBeatLines = (beat: MotionBeat, narratorKey?: string): MotionBeatLine[] => {
  const parts = beat.utterances?.length ? motionNarratorLines(beat.utterances, narratorKey, beat.narration).map((u) => ({ text: u.text, speaker: u.role === P.DIALOGUE ? u.speaker : undefined, id: u.id })) : [{ text: beat.narration, speaker: undefined, id: undefined }];
  const out: MotionBeatLine[] = [];
  for (const part of parts)
    for (const text of sentences(part.text)) {
      const sentence = sentenceKey(text);
      const key = [beat.id, out.length, sentence].join(P.KEY_SEPARATOR);
      if (sentence) out.push({ key, text, beatId: beat.id, place: beat.place, speaker: part.speaker, chapterId: beat.chapterId, cast: beat.cast || [], utterance: part.id, scenePlan: beat.scenePlan, action: beat.action, time: beat.time });
    }
  return out;
};
export const motionTags = (v: unknown): string[] => _.take(_.uniq(_.compact(_.map(_.castArray(v || []), (t) => _.snakeCase(_.toString(t))))), P.TAGS_MAX);
