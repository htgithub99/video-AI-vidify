import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_SCENE_PACING as P } from "../constants/motionScenePacing.js";
import { MOTION_STORY_CONFIG } from "../constants/motionVideo.js";
import type { MotionBeat, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionScenePacing, MotionVisualSettings } from "../types/motionVisual.js";
import { puppetBeatLines } from "./motionPuppet.js";
export const motionScenePacing = (settings?: MotionVisualSettings): MotionScenePacing => settings?.pacing || P.DEFAULT;
export const motionPacingSeconds = (settings?: MotionVisualSettings) => P.SECONDS[motionScenePacing(settings)];
export const motionBeatVisualSeconds = (beat: MotionBeat, language: string = RT_SHARED.VI) => {
  const rate = language === RT_SHARED.EN ? MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND : MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND;
  return Math.max(1, beat.narration.trim().split(/\s+/u).filter(Boolean).length / rate);
};
export const motionScenePacingCount = (settings: MotionVisualSettings | undefined, seconds: number) => Math.max(1, Math.round(seconds / motionPacingSeconds(settings)));
export const motionScenePacingRule = (settings: MotionVisualSettings | undefined, seconds: number, places = 1) => P.RULE(motionPacingSeconds(settings), motionScenePacingCount(settings, seconds)) + (places > 1 ? P.BRIEF_PLACES(motionPacingSeconds(settings)) : "");
export const motionVisualBeatGroups = (script: Pick<MotionStoryScript, "beats" | "language" | "visualSettings">, grouping?: number, pacing: MotionScenePacing = motionScenePacing(script.visualSettings)) => {
  const current = grouping === P.GROUPING;
  const level = P.LEVELS[pacing];
  const limits = current ? { seconds: level.groupSeconds, lines: level.groupLines, beats: level.groupBeats, placeHold: level.placeHold } : { seconds: P.GROUP_SECONDS, lines: P.GROUP_LINES, beats: P.GROUP_BEATS, placeHold: 0 };
  const groups: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }[] = [];
  let time: string | undefined, weather: string | undefined;
  for (const beat of script.beats) {
    const group = groups.at(-1),
      previous = group?.beats.at(-1);
    const seconds = motionBeatVisualSeconds(beat, script.language),
      lineCount = puppetBeatLines(beat).length;
    const placeCut = !!previous && previous.place !== beat.place && (!group || group.seconds >= limits.placeHold);
    const boundary = !previous || previous.chapterId !== beat.chapterId || placeCut || (!!beat.time && beat.time !== time) || (!!beat.weather && beat.weather !== weather);
    if (!group || boundary || group.seconds + seconds > limits.seconds || group.lineCount + lineCount > limits.lines || group.beats.length >= limits.beats) groups.push({ id: beat.id, beats: [beat], seconds, lineCount });
    else {
      group.beats.push(beat);
      group.seconds += seconds;
      group.lineCount += lineCount;
    }
    time = beat.time || time;
    weather = beat.weather || weather;
  }
  return groups;
};
