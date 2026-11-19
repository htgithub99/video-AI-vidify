import _ from "lodash";
import { REUP_TALK } from "../constants/reupConfig.js";
import type { ReupShot, ReupTranscript } from "../types/reup.js";
type Phrase = ReupTranscript["phrases"][number];
export const reupTalkPhrases = (phrases: Phrase[]): Phrase[] => phrases.filter((p) => p.text.split(/\s+/).filter(Boolean).length >= REUP_TALK.MIN_WORDS && p.end > p.start);
export const reupTalkShare = (phrases: Phrase[], targetSeconds: number): number => {
  if (!phrases.length || targetSeconds <= 0) return 0;
  const sections = _.clamp(Math.round(targetSeconds / REUP_TALK.SECTION_SECONDS), 1, phrases.length);
  const heard = _.sum(
    _.orderBy(
      phrases.map((p) => Math.min(p.end - p.start, REUP_TALK.TAIL_MAX)),
      _.identity,
      "desc",
    ).slice(0, sections),
  );
  return _.round(Math.min(REUP_TALK.SHARE_MAX, heard / targetSeconds), 3);
};
export const reupTalkQuote = (phrases: Phrase[], from: number, to: number): string | undefined => {
  const p = phrases.find((x) => x.start >= from && x.start < to);
  return p ? p.text.split(/\s+/).slice(0, REUP_TALK.QUOTE_WORDS).join(" ") : undefined;
};
export const reupTalkTail = (phrases: Phrase[], scene: ReupShot, at: number, voiceEnd: number): number | undefined => {
  const p = phrases.find((x) => x.start >= voiceEnd - REUP_TALK.PAD && x.start <= voiceEnd + REUP_TALK.REACH && x.start >= scene.start && x.end <= scene.end + REUP_TALK.REACH && x.end - voiceEnd <= REUP_TALK.TAIL_MAX);
  return p ? _.round(p.end + REUP_TALK.PAD - at, 2) : undefined;
};
export const reupHeardTalk = (phrases: Phrase[], pieces: { seek: number; len: number }[], voiceEnd: number): number => {
  let t = 0;
  let heard = 0;
  for (const piece of pieces) {
    for (const p of phrases) {
      const a = Math.max(p.start, piece.seek);
      const b = Math.min(p.end, piece.seek + piece.len);
      if (b <= a) continue;
      const from = Math.max(t + a - piece.seek, voiceEnd);
      const to = t + b - piece.seek;
      if (to - from >= (b - a) * REUP_TALK.HEARD_MIN) heard += to - from;
    }
    t += piece.len;
  }
  return _.round(heard, 1);
};
