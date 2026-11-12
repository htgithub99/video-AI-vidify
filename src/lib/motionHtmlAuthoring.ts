import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { PROMPT_SOURCE_DATA } from "../constants/promptSourceData.js";
import { MOTION_HTML, MOTION_HTML_STYLES } from "../constants/motionHtmlTemplate.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { motionStorytelling } from "./motionStorytelling.js";
import { motionStorytellingSilent } from "./motionStorytelling.js";
import { MOTION_SCENE_PACING } from "../constants/motionScenePacing.js";
import { MOTION_RENAME } from "../constants/motionRename.js";
import { motionRenameMapActive, motionRenamePairs } from "./motionRename.js";
import type { MotionChapter, MotionStoryAnalysis } from "../types/motionVideo.js";
import type { MotionVisualSettings } from "../types/motionVisual.js";
export const motionHtmlLanguageDirection = (language?: string, options: { codeOnly?: boolean } = {}) =>
  options.codeOnly ? MOTION_HTML.CODE_LANGUAGE(language) : `${MOTION_HTML.LANGUAGE_POLICY}${RT_MAINTENANCE.SELECTED_VIDEO_LANGUAGE}${language || RT_MAINTENANCE.AS_SPECIFIED_BY_THE_SUPPLIED_NARRATION_AND_EXACT_DISPLAY_STRINGS}${RT_MAINTENANCE.PRODUCTION_INSTRUCTIONS_ARE_ENGLISH_THIS_DOES_NOT_CHANGE_THE_SELECTED}`;
export const motionHtmlChapterBudget = (analysis: MotionStoryAnalysis, chapter: MotionChapter, speechRate: number, first = false, last = false) => {
  const silent = motionStorytellingSilent(analysis.storytelling);
  const pause = (silent ? (last ? silent.videoEnd : silent.chapterCard + silent.chapterEnd) : 0) + (first ? 0.3 : 0);
  const seconds = Math.max(1, (chapter.targetSeconds || 0) - pause);
  return { pause, seconds, units: Math.round(seconds * speechRate) };
};
export const motionHtmlPacingDirection = (settings: MotionVisualSettings, seconds: number) => {
  const pacing = settings.pacing || MOTION_SCENE_PACING.DEFAULT;
  const target = MOTION_SCENE_PACING.SECONDS[pacing];
  const targetScenes = Math.max(1, Math.round(seconds / target));
  const minScenes = Math.max(1, Math.floor(targetScenes * 0.75));
  const maxScenes = Math.max(minScenes, Math.ceil(targetScenes * 1.25));
  return `${RT_MAINTENANCE.PICTURE_PACING}${pacing}${RT_MAINTENANCE.AIM_FOR_ROUGHLY}${target}${RT_MAINTENANCE.SECONDS_PER_SCENE_APPROXIMATELY}${targetScenes}${RT_MAINTENANCE.SCENES_ALLOWED_WINDOW}${minScenes}${RT_MAINTENANCE.EN_DASH}${maxScenes}${RT_MAINTENANCE.SCENES_ACROSS_THIS}${seconds.toFixed(1)}${RT_MAINTENANCE.S_REQUEST_COVER_CONSECUTIVE_SPEECH_LINES_ONCE_ALLOWING_SEVERAL_BEATS}${target}${RT_MAINTENANCE.MOTIONHTMLPACINGDIRECTION_TEMPLATE_PART_8}`;
};
export const motionHtmlAnalysisPrompt = (input: { title: string; seconds: number; language: string; chapters: number; transcript: string; pacing?: string }) =>
  [
    RT_MAINTENANCE.MOTIONHTMLANALYSISPROMPT,
    motionHtmlLanguageDirection(input.language),
    `${RT_MAINTENANCE.TITLE}${input.title}${RT_MAINTENANCE.LANGUAGE}${input.language}${RT_MAINTENANCE.TOTAL_BUDGET}${input.seconds}${RT_MAINTENANCE.S_AIM_FOR_ABOUT}${input.chapters}${RT_MAINTENANCE.MEANINGFUL_CHAPTERS_SCALING_TO_SOURCE_AND_BUDGET_SO_CHAPTER_TARGETSECONDS}${input.seconds}${RT_MAINTENANCE.MOTIONHTMLANALYSISPROMPT_TEMPLATE_PART_6}`,
    motionHtmlPacingDirection({ pacing: input.pacing || RT_MAINTENANCE.FEW } as MotionVisualSettings, input.seconds),
    RT_MAINTENANCE.MOTIONHTMLANALYSISPROMPT_2,
    PROMPT_SOURCE_DATA.WRAP(input.transcript),
  ].join(RT_MAINTENANCE.NEWLINE);
export const motionHtmlGenreDirection = (genre: unknown, seconds: number, mode: unknown): string => {
  const selected = motionVideoGenre(genre);
  const storytelling = motionStorytelling(mode);
  const voices = { pov: RT_MAINTENANCE.POV, witness: RT_MAINTENANCE.WITNESS, chronicle: RT_MAINTENANCE.CHRONICLE, verdict: RT_MAINTENANCE.VERDICT_2 };
  const telling = { plain: RT_MAINTENANCE.PLAIN, lively: RT_MAINTENANCE.LIVELY_2, gripping: RT_MAINTENANCE.GRIPPING };
  return `${RT_MAINTENANCE.ONE_AUTHORING_CONTRACT_GENRE}${selected}${RT_MAINTENANCE.STORYTELLING}${storytelling}${RT_MAINTENANCE.TOTAL_VIDEO_BUDGET_APPROXIMATELY}${Math.round(seconds)}${RT_MAINTENANCE.SECONDS}${voices[selected]}${RT_MAINTENANCE.SPACE}${telling[storytelling]}${RT_MAINTENANCE.MOTIONHTMLGENREDIRECTION_TEMPLATE_PART_6}`;
};
export const motionHtmlWritingDirection = (analysis: MotionStoryAnalysis, language = analysis.authoringSettings?.language): string => {
  const a = analysis.authoringSettings!;
  const target = analysis.chapters.reduce((sum, chapter) => sum + (chapter.targetSeconds || 0), 0) || a.selectedTargetSeconds;
  return [
    motionHtmlLanguageDirection(language),
    motionHtmlGenreDirection(a.videoGenre, target, a.storytelling),
    `${RT_MAINTENANCE.PICTURE_PACING}${a.picturePacing}${RT_MAINTENANCE.ROUGHLY}${a.targetPictureSeconds}${RT_MAINTENANCE.SECONDS_PER_ILLUSTRATION_SPOKEN_BEATS_AND_PICTURES_ARE_SEPARATE_MULTIPLE}`,
    `${RT_MAINTENANCE.VISUAL_STYLE_WORDS_ONLY}${MOTION_HTML_STYLES[a.visualProfile]}`,
    MOTION_HTML.TEMPLATE,
    ...(motionRenameMapActive(analysis).length ? [MOTION_RENAME.PROMPT.CHAPTER(motionRenamePairs(motionRenameMapActive(analysis)))] : []),
  ].join(RT_MAINTENANCE.NEWLINE);
};
export const motionHtmlAuthoringSnapshot = (input: { videoGenre?: unknown; storytelling?: unknown; length: string; target: number; language: string; profile: string; pacing?: string; parts?: number }) => ({
  version: 1 as const,
  videoGenre: motionVideoGenre(input.videoGenre),
  storytelling: motionStorytelling(input.storytelling),
  selectedLength: input.length,
  selectedTargetSeconds: input.target,
  language: input.language,
  visualProfile: input.profile,
  picturePacing: input.pacing || MOTION_SCENE_PACING.GENRE_DEFAULT[motionVideoGenre(input.videoGenre)] || MOTION_SCENE_PACING.DEFAULT,
  targetPictureSeconds: MOTION_SCENE_PACING.SECONDS[(input.pacing || MOTION_SCENE_PACING.GENRE_DEFAULT[motionVideoGenre(input.videoGenre)] || MOTION_SCENE_PACING.DEFAULT) as keyof typeof MOTION_SCENE_PACING.SECONDS],
  requestedParts: Math.max(1, input.parts || 1),
});
