import { motionGenreStyleFindings } from "./motionGenreStyle.js";
import { motionChapterOverlapFindings, motionRepetitionFindings } from "./motionStoryTimeline.js";
import { motionChapterEchoFindings, motionGenreStageFindings } from "./motionGenreStage.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export const motionScriptFindings = (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string) => {
  const style = motionGenreStyleFindings(beats, language, analysis.videoGenre);
  const overlap = analysis.chapters.length > 1 ? motionChapterOverlapFindings(beats, analysis) : [];
  const repeat = motionRepetitionFindings(beats, language, analysis.motifs);
  const stage = motionGenreStageFindings(beats, analysis);
  const echo = motionChapterEchoFindings(beats, language, analysis.motifs);
  const ids = [...new Set([...style, ...overlap, ...repeat, ...stage, ...echo].map((finding) => finding.id))];
  return { style, overlap, repeat, stage, echo, ids };
};
