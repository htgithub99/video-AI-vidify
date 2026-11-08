import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_CONTINUITY as C } from "../constants/motionContinuity.js";
import { motionNarratorCastKey } from "./motionVoice.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
const words = (name?: string): string[] => (name?.match(C.NAME_WORD) || []).filter((word) => word.length >= C.NAME_MIN);
const mentions = (beat: MotionBeat, member: { key: string; name?: string; alias?: string }): boolean => (beat.cast || []).includes(member.key) || (beat.utterances || []).some((line) => line.speaker === member.key) || [...words(member.name), ...words(member.alias)].some((word) => beat.narration.includes(word));
const losses = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "cast">): Map<string, { chapter: string; index: number }> => {
  const lost = new Map<string, { chapter: string; index: number }>();
  beats.forEach((beat, index) => {
    if (beat.frame === C.HINDSIGHT || !C.LOST.test(beat.narration)) return;
    for (const member of analysis.cast) if (!lost.has(member.key) && [...words(member.name), ...words(member.alias)].some((word) => beat.narration.includes(word) && C.LOST.test(beat.narration.slice(beat.narration.indexOf(word), beat.narration.indexOf(word) + word.length + C.LOST_WINDOW)))) lost.set(member.key, { chapter: beat.chapterId, index });
  });
  return lost;
};
export const motionContinuityLedger = (history: MotionBeat[] = [], analysis: Pick<MotionStoryAnalysis, "cast" | "motifs" | "places">): string => {
  if (!history.length) return "";
  const last = history.at(-1)!;
  const lost = losses(history, analysis);
  const narrator = motionNarratorCastKey(analysis as MotionStoryAnalysis);
  const cast = analysis.cast
    .filter((member) => member.key !== narrator)
    .flatMap((member) => {
      const seen = history.filter((beat) => mentions(beat, member));
      return seen.length ? [C.MEMBER(member.name, seen[0].chapterId, seen.at(-1)!.chapterId, lost.get(member.key)?.chapter)] : [];
    });
  const motifs = (analysis.motifs || []).map((motif) => C.MOTIF(motif, history.filter((beat) => beat.narration.toLowerCase().includes(motif.toLowerCase())).length));
  const told = [...new Set(history.flatMap((beat) => (beat.eventId ? [beat.eventId] : [])))];
  const place = analysis.places.find((item) => item.key === last.place)?.name || last.place || C.NONE;
  return C.LEDGER([place, last.time, last.weather].filter(Boolean).join(RT_MAINTENANCE.COMMA_SPACE), cast.join(RT_MAINTENANCE.SEMICOLON_SPACE) || C.NONE, motifs.join(RT_MAINTENANCE.SEMICOLON_SPACE) || C.NONE, told.join(RT_MAINTENANCE.COMMA_SPACE) || C.NONE);
};
export const motionContinuityFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "cast">): { id: string; issue: string }[] => {
  const lost = losses(beats, analysis);
  return beats.flatMap((beat, index) =>
    analysis.cast.flatMap((member) => {
      const gone = lost.get(member.key);
      return gone && index > gone.index && beat.frame !== C.HINDSIGHT && beat.chapterId !== gone.chapter && (beat.utterances || []).some((line) => line.speaker === member.key) ? [{ id: beat.id, issue: C.ISSUE(member.name, gone.chapter) }] : [];
    }),
  );
};
