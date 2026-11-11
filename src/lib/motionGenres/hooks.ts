import * as RT_MAINTENANCE from "../../constants/runtime/maintenance.js";
import { MOTION_STORYTELLING as S } from "../../constants/motionStorytelling.js";
import { MOTION_GENRE_VOCABULARY as X } from "../../constants/motionGenres/vocabulary.js";
import { MOTION_VIDEO_GENRES, motionVideoGenre } from "../../constants/motionGenre.js";
import { motionStorytellingPreset } from "../motionStorytelling.js";
import { motionLanguage } from "../motionLanguage.js";
import type { MotionBeat, MotionStoryAnalysis } from "../../types/motionVideo.js";
export interface MotionHookFinding {
  id: string;
  issue: string;
}
const BREAK_SHOTS: readonly string[] = [X.SHOTS.INSERT, X.SHOTS.ESTABLISHING];
export const motionHookFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre" | "storytelling">, language: string): { findings: MotionHookFinding[]; logs: string[] } => {
  const preset = motionStorytellingPreset(analysis.storytelling);
  const findings: MotionHookFinding[] = [];
  const logs: string[] = [];
  if (preset.hooks === RT_MAINTENANCE.OFF) return { findings, logs };
  const marker = motionLanguage(language).markers.viewer;
  const genre = motionVideoGenre(analysis.videoGenre);
  for (const chapter of analysis.chapters) {
    const own = beats.filter((beat) => beat.chapterId === chapter.id && beat.narration?.trim());
    if (!own.length) continue;
    let run: MotionBeat[] = [];
    for (const beat of own) {
      const plain = beat.visual === X.VISUALS.SCENE && !BREAK_SHOTS.includes(beat.shot || "");
      if (plain) run.push(beat);
      if (!plain || beat === own.at(-1)) {
        if (run.length >= S.BREAK_EVERY_BEATS) findings.push({ id: run[Math.floor(run.length / 2)].id, issue: S.ISSUE.BREAK });
        run = [];
      }
    }
    if (preset.hooks === RT_MAINTENANCE.FULL && genre !== MOTION_VIDEO_GENRES.WITNESS) {
      const questions = own.filter((beat) => S.VIEWER_QUESTION.test(beat.narration.trim()) && marker.test(beat.narration));
      for (const beat of questions.slice(S.VIEWER_QUESTIONS_PER_CHAPTER)) findings.push({ id: beat.id, issue: S.ISSUE.QUESTIONS });
    }
    if (chapter !== analysis.chapters.at(-1) && !(own.some((beat) => beat.hook === S.HOOK.OPEN) && own.some((beat) => beat.hook === S.HOOK.CLOSE))) logs.push(S.ISSUE.LOOP_LOG(chapter.id));
  }
  return { findings, logs };
};
