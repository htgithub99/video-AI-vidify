import { motionGenreStyleFindings } from "./motionGenreStyle.js";
import { motionChapterOverlapFindings, motionRepetitionFindings } from "./motionStoryTimeline.js";
import { motionChapterEchoFindings, motionGenreStageFindings } from "./motionGenreStage.js";
import { motionGenreReviewFindings } from "./motionGenreReview.js";
import { motionWritingReviewAnchors } from "./motionWriting.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export const motionScriptFindings = (beats: MotionBeat[], analysis: MotionStoryAnalysis, language: string, sourceText = "") => {
  const style = motionGenreStyleFindings(beats, language, analysis.videoGenre);
  const overlap = analysis.chapters.length > 1 ? motionChapterOverlapFindings(beats, analysis) : [];
  const anchors = motionWritingReviewAnchors(analysis);
  const repeat = motionRepetitionFindings(beats, language, anchors);
  const stage = motionGenreStageFindings(beats, analysis);
  const echo = motionChapterEchoFindings(beats, language, anchors);
  const { findings: review, dropIds, dropRefs } = motionGenreReviewFindings(beats, analysis, language, sourceText);
  const ids = [...new Set([...style, ...overlap, ...repeat, ...stage, ...echo, ...review].map((finding) => finding.id))];
  return { style, overlap, repeat, stage, echo, review, dropIds, dropRefs, ids };
};
