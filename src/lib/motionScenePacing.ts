import { MOTION_SCENE_PACING as P } from "../constants/motionScenePacing.js";
import { MOTION_STORY_CONFIG } from "../constants/motionVideo.js";
import type { MotionBeat, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionScenePacing, MotionVisualSettings } from "../types/motionVisual.js";
import { puppetBeatLines } from "./motionPuppet.js";
export const motionScenePacing = (settings?: MotionVisualSettings): MotionScenePacing => settings?.pacing || P.DEFAULT;
export const motionPacingSeconds = (settings?: MotionVisualSettings) => P.SECONDS[motionScenePacing(settings)];
export const motionBeatVisualSeconds = (beat: MotionBeat, language = "vi") => {
  const rate = language === "en" ? MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND : MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND;
  return Math.max(1, beat.narration.trim().split(/\s+/u).filter(Boolean).length / rate);
};
export const motionScenePacingRule = (settings: MotionVisualSettings | undefined, seconds: number) => P.RULE(motionPacingSeconds(settings), Math.max(1, Math.round(seconds / motionPacingSeconds(settings))));
export const motionVisualBeatGroups = (script: Pick<MotionStoryScript, "beats" | "language" | "visualSettings">) => {
  const groups: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }[] = [];
  let time: string | undefined, weather: string | undefined;
  for (const beat of script.beats) {
    const group = groups.at(-1),
      previous = group?.beats.at(-1);
    const seconds = motionBeatVisualSeconds(beat, script.language),
      lineCount = puppetBeatLines(beat).length;
    const boundary = !previous || previous.chapterId !== beat.chapterId || previous.place !== beat.place || (!!beat.time && beat.time !== time) || (!!beat.weather && beat.weather !== weather);
    if (!group || boundary || group.seconds + seconds > P.GROUP_SECONDS || group.lineCount + lineCount > P.GROUP_LINES || group.beats.length >= P.GROUP_BEATS) groups.push({ id: beat.id, beats: [beat], seconds, lineCount });
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
