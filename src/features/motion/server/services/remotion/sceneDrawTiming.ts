import { motionBeatLines } from "../../../../../lib/motionBeatLines.js";
import type { MotionRemotionScene } from "../../../../../types/motionVisual.js";
import type { MotionStoryScript } from "../../../../../types/motionVideo.js";
import { estimateBeatSeconds } from "../motionDirectorService.js";
export const sceneDrawSeconds = (scene: MotionRemotionScene, script: MotionStoryScript): number => {
  const lines = script.beats.flatMap((beat) => motionBeatLines(beat));
  const from = lines.findIndex((line) => line.key === scene.fromLineId),
    to = lines.findIndex((line) => line.key === scene.toLineId);
  const covered = new Set(from >= 0 && to >= from ? lines.slice(from, to + 1).map((line) => line.key) : []);
  let seconds = 0;
  for (const [index, beat] of script.beats.entries()) {
    const members = motionBeatLines(beat),
      weight = (text: string) => Math.max(1, text.trim().split(/\s+/u).length);
    const total = members.reduce((sum, line) => sum + weight(line.text), 0) || 1;
    const selected = members.filter((line) => covered.has(line.key));
    const duration = script.voiceTrack?.durations?.[index] || beat.duration || estimateBeatSeconds(beat, script.language);
    seconds += (duration * selected.reduce((sum, line) => sum + weight(line.text), 0)) / total;
  }
  return Math.max(0.5, seconds || estimateBeatSeconds({ narration: scene.text } as MotionStoryScript["beats"][number], script.language));
};
