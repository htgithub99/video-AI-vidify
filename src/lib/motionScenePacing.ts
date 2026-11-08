import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_SCENE_PACING as P } from "../constants/motionScenePacing.js";
import type { MotionBeat, MotionStoryScript } from "../types/motionVideo.js";
import type { MotionScenePacing, MotionVisualSettings } from "../types/motionVisual.js";
import { puppetBeatLines } from "./motionPuppet.js";
import { motionLanguageRate, motionSpeechUnits } from "./motionLanguage.js";
export const motionScenePacing = (settings?: MotionVisualSettings): MotionScenePacing => settings?.pacing || P.DEFAULT;
export const motionPacingSeconds = (settings?: MotionVisualSettings) => P.SECONDS[motionScenePacing(settings)];
export const motionBeatVisualSeconds = (beat: MotionBeat, language: string = RT_SHARED.VI) => {
  return Math.max(1, motionSpeechUnits(beat.narration) / motionLanguageRate(language));
};
export const motionScenePacingCount = (settings: MotionVisualSettings | undefined, seconds: number) => Math.max(1, Math.round(seconds / motionPacingSeconds(settings)));
export const motionScenePacingRule = (settings: MotionVisualSettings | undefined, seconds: number, places = 1) => P.RULE(motionPacingSeconds(settings), motionScenePacingCount(settings, seconds)) + (places > 1 ? P.BRIEF_PLACES(motionPacingSeconds(settings)) : "");
export const motionVisualBeatGroups = (script: Pick<MotionStoryScript, "beats" | "language" | "visualSettings">, grouping?: number, pacing: MotionScenePacing = motionScenePacing(script.visualSettings)) => {
  if (grouping === 1001) {
    const groups: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }[] = [];
    for (const beat of script.beats) {
      const seconds = motionBeatVisualSeconds(beat, script.language);
      const last = groups.at(-1);
      if (!last || last.beats[0].chapterId !== beat.chapterId || last.seconds + seconds > 75 || last.beats.length >= 5) groups.push({ id: beat.id, beats: [beat], seconds, lineCount: puppetBeatLines(beat).length });
      else {
        last.beats.push(beat);
        last.seconds += seconds;
        last.lineCount += puppetBeatLines(beat).length;
      }
    }
    return groups;
  }
  const level = grouping === P.GROUPING || grouping === P.GROUPING_TIMED ? P.LEVELS[pacing] : grouping === P.GROUPING_PREVIOUS ? P.LEVELS_PREVIOUS[pacing] : undefined;
  const timeCut = grouping !== P.GROUPING;
  const limits = level ? { seconds: level.groupSeconds, lines: level.groupLines, beats: level.groupBeats, placeHold: level.placeHold } : { seconds: P.GROUP_SECONDS, lines: P.GROUP_LINES, beats: P.GROUP_BEATS, placeHold: 0 };
  const groups: { id: string; beats: MotionBeat[]; seconds: number; lineCount: number }[] = [];
  let time: string | undefined, weather: string | undefined;
  for (const beat of script.beats) {
    const group = groups.at(-1),
      previous = group?.beats.at(-1);
    const seconds = motionBeatVisualSeconds(beat, script.language),
      lineCount = puppetBeatLines(beat).length;
    const placeCut = !!previous && previous.place !== beat.place && (!group || group.seconds >= limits.placeHold);
    const boundary = !previous || previous.chapterId !== beat.chapterId || placeCut || (timeCut && ((!!beat.time && beat.time !== time) || (!!beat.weather && beat.weather !== weather)));
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
