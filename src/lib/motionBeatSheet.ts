import { MOTION_BEAT_SHEET as B } from "../constants/motionBeatSheet.js";
import { motionGenreSpec } from "../constants/motionGenre.js";
import { motionStorytellingPreset } from "./motionStorytelling.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
export const motionChapterEvents = (chapter: Pick<MotionChapter, "id" | "keyPoints">): { id: string; point: string }[] => (chapter.keyPoints || []).map((point, index) => ({ id: B.ID(chapter.id, index), point: point.replace(B.TIMESTAMP, "") }));
export const motionChapterBeatSheet = (analysis: Pick<MotionStoryAnalysis, "storytelling" | "videoGenre" | "cast">, chapter: Pick<MotionChapter, "id" | "keyPoints">): string => {
  const events = motionChapterEvents(chapter);
  if (!events.length) return "";
  const spec = motionGenreSpec(analysis.videoGenre);
  const texture = motionStorytellingPreset(analysis.storytelling).texture;
  const minimum = events.length + Math.min(events.length, texture * events.length) + (spec.CONTRACT.devices ? B.MIN_DEVICE_BEATS : 0);
  const speakers = (analysis.cast || []).filter((member) => !member.narrator && !(spec.DIALOGUE.skipProtagonist && member.key === B.PROTAGONIST)).map((member) => member.name);
  return B.PROMPT(events, texture, spec.CONTRACT.devices, minimum, speakers, spec.DIALOGUE.minLines);
};
export const motionBeatSheetFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters">): { id: string; issue: string }[] => {
  const findings: { id: string; issue: string }[] = [];
  const owner = new Map(analysis.chapters.flatMap((chapter) => motionChapterEvents(chapter).map((event, index) => [event.id, { chapter: chapter.id, index }] as const)));
  const counts = new Map<string, number>();
  for (const chapter of analysis.chapters) {
    let latest: { id: string; index: number } | undefined;
    for (const beat of beats.filter((item) => item.chapterId === chapter.id && item.kind === B.EVENT && item.eventId)) {
      const known = owner.get(beat.eventId!);
      if (!known) continue;
      if (known.chapter !== chapter.id) {
        findings.push({ id: beat.id, issue: B.ISSUE.FOREIGN(beat.eventId!) });
        continue;
      }
      const count = (counts.get(beat.eventId!) || 0) + 1;
      counts.set(beat.eventId!, count);
      if (count > B.MAX_EVENT_BEATS) findings.push({ id: beat.id, issue: B.ISSUE.RETELL(beat.eventId!) });
      else if (latest && known.index < latest.index) findings.push({ id: beat.id, issue: B.ISSUE.ORDER(beat.eventId!, latest.id) });
      if (!latest || known.index > latest.index) latest = { id: beat.eventId!, index: known.index };
    }
    const own = beats.filter((item) => item.chapterId === chapter.id);
    for (const [index, event] of motionChapterEvents(chapter).entries()) {
      if (!own.length || own.some((item) => item.eventId === event.id)) continue;
      const before = [...own].reverse().find((item) => item.kind === B.EVENT && item.eventId && (owner.get(item.eventId)?.index ?? -1) < index) || own[0];
      findings.push({ id: before.id, issue: B.ISSUE.MISSING(event.id, event.point) });
    }
  }
  return findings;
};
export const motionBeatSheetCoverage = (beats: MotionBeat[], chapter: Pick<MotionChapter, "id" | "keyPoints">): { covered: number; events: number; texture: number } => {
  const events = motionChapterEvents(chapter);
  const own = beats.filter((beat) => beat.chapterId === chapter.id);
  return { covered: events.filter((event) => own.some((beat) => beat.eventId === event.id)).length, events: events.length, texture: own.filter((beat) => beat.kind === B.TEXTURE).length };
};
