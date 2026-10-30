import { MOTION_GENRE_STAGE as S } from "../constants/motionGenreStage.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export interface MotionGenreStageFinding {
  id: string;
  issue: string;
}
const C = S.CHECK;
export const motionGenreStageFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre">): MotionGenreStageFinding[] => {
  const genre = motionVideoGenre(analysis.videoGenre);
  const chapters = analysis.chapters;
  const last = chapters.length - 1;
  const findings: MotionGenreStageFinding[] = [];
  const add = (id: string, issue: string) => {
    if (!findings.some((finding) => finding.id === id)) findings.push({ id, issue });
  };
  chapters.forEach((chapter, index) => {
    const lines = beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim());
    if (!lines.length) return;
    const staged = !!chapter.stages?.length;
    const closing = staged ? chapter.stages!.includes(C.TIME_JUMP_STAGE) : index === last;
    if (C.TIME_JUMP_GENRES.includes(genre) && !closing && index < last)
      for (const beat of lines) if ((beat.narration.match(C.SENTENCE) || []).some((sentence) => C.TIME_JUMP.test(sentence) && !C.FUTURE.test(sentence))) add(beat.id, C.TIME_JUMP_ISSUE);
    if (C.STAMP_GENRES.includes(genre) && !(C.STAMP_SKIP_LAST.includes(genre) && index === last)) {
      const planned = [chapter.summary, ...(chapter.keyPoints || []).map((point) => point.replace(C.POINT_PREFIX, ""))].join(" ");
      if (C.PLAN_STAMP.test(planned) && !lines.slice(0, C.STAMP_BEATS).some((beat) => C.STAMP.test(beat.narration))) add(lines[0].id, C.STAMP_ISSUE[genre]);
    }
    const candidate = staged ? chapter.stages!.includes(C.QUESTION_STAGE) : index > 0 && index < last;
    if (C.QUESTION_GENRES.includes(genre) && candidate && !lines.some((beat) => C.QUESTION.test(beat.narration))) add(lines.at(-1)!.id, C.QUESTION_ISSUE);
  });
  return findings;
};
