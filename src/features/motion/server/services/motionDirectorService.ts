import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import type { MotionSoundCue } from "../../../../types/motionVideo.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { MOTION_VOICE_PACING } from "../../../../constants/motionVoice.js";
import _ from "lodash";
import { MOTION_HISTORY } from "../../../../constants/motionHistory.js";
import {
  MOTION_TEMPLATE_JOIN_SPACE,
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_COUNTER,
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_MAP,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_STATS,
  MOTION_TEXT_TIMELINE,
} from "../../../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_DIRECTOR_PATTERNS as P } from "../../../../constants/motionVideo.js";
import { motionLanguage, motionLanguageRate, motionSpeechUnits } from "../../../../lib/motionLanguage.js";
import type { MotionBeat, MotionSpec } from "../../../../types/motionVideo.js";
const GRAPHIC_HOLD = [MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MR.MOTION_TEXT_STARMAP, MR.MOTION_TEXT_BITMAP, MOTION_TEXT_HEADLINE, MOTION_HISTORY.GEOMAP, MOTION_HISTORY.ICONS, MOTION_HISTORY.VERDICT, MOTION_HISTORY.SCOREBOARD];
const countUnits = (text: string): number => motionSpeechUnits(text);
export const estimateBeatSeconds = (beat: MotionBeat, language: string): number => {
  const rate = motionLanguageRate(language);
  const pauses = (beat.narration.match(P.PUNCTUATION) || []).length * 0.18;
  return Math.max(1.2, countUnits(beat.narration) / rate + pauses);
};
export const computeBeatTimeline = (beats: MotionBeat[], durations: number[], continuous = false): { starts: number[]; ends: number[]; total: number } => {
  const starts: number[] = [];
  const ends: number[] = [];
  let cursor = continuous ? MOTION_VOICE_PACING.VOICE_LEAD : beats[0]?.visual === MOTION_TEXT_TITLE ? 0.9 : 0.5;
  beats.forEach((b, i) => {
    starts.push(cursor);
    const d = Math.max(0.6, durations[i] || 1);
    ends.push(cursor + d);
    const next = beats[i + 1];
    const gap = continuous || !next ? 0 : next.chapterId !== b.chapterId || next.visual === MOTION_TEXT_CHAPTER ? MOTION_STORY_CONFIG.CHAPTER_GAP_SECONDS : MOTION_STORY_CONFIG.BEAT_GAP_SECONDS;
    const hold = !continuous && _.includes(GRAPHIC_HOLD, b.visual) ? 0.45 : 0;
    cursor += d + gap + hold;
  });
  const tail = MOTION_STORY_CONFIG.TAIL_SECONDS + (_.last(beats)?.visual === MOTION_TEXT_ENDING ? 1.6 : 0);
  return { starts, ends, total: (_.last(ends) || 3) + tail };
};
const splitSubtitle = (text: string, max: number): string[] => {
  const sentences = _.compact(_.map(_.toString(text).match(P.SENTENCES) || [text], _.trim));
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s);
      continue;
    }
    const parts = _.compact(_.map(s.split(P.CLAUSES), _.trim));
    let cur: string = MR.MOTION_TEXT_EMPTY;
    for (const p of parts) {
      if ((cur + MOTION_TEXT_SYMBOL_13 + p).trim().length > max && cur) {
        out.push(cur.trim());
        cur = p;
      } else cur = MOTION_TEMPLATE_JOIN_SPACE(String(cur), String(p));
    }
    if (cur.trim()) {
      const words = cur.trim().split(P.WORDS);
      let line: string = MR.MOTION_TEXT_EMPTY;
      for (const w of words) {
        if ((line + MOTION_TEXT_SYMBOL_13 + w).trim().length > max && line) {
          out.push(line.trim());
          line = w;
        } else line = MOTION_TEMPLATE_JOIN_SPACE(String(line), String(w));
      }
      if (line.trim()) out.push(line.trim());
    }
  }
  return out.flatMap((piece) => (piece.length > max && P.SPACELESS.test(piece) ? piece.match(new RegExp(`${RT_MAINTENANCE.VALUE_1_3}${max}${RT_MAINTENANCE.CLOSE_BRACE}`, RT_MAINTENANCE.GU)) || [piece] : [piece]));
};
export const buildSubtitles = (beat: MotionBeat, start: number, end: number, language?: string): { start: number; end: number; text: string }[] => {
  const pieces = splitSubtitle(beat.narration, language ? motionLanguage(language).subtitle.maxChars : MOTION_STORY_CONFIG.SUBTITLE_MAX_CHARS);
  const weights = _.map(pieces, (p) => countUnits(p) + (P.SENTENCE_END.test(p) ? 0.8 : 0));
  const total = _.sum(weights) || 1;
  let t = start;
  return _.map(pieces, (text, i) => {
    const d = ((end - start) * weights[i]) / total;
    const s = { start: +t.toFixed(3), end: +(t + d).toFixed(3), text };
    t += d;
    return s;
  });
};
export interface CompiledStory {
  spec: MotionSpec;
  starts: number[];
  ends: number[];
  sfxCues: MotionSoundCue[];
  missing: string[];
}
