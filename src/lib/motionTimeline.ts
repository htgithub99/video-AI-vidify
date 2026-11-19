import { MOTION_TIMELINE as T } from "../constants/motionTimeline.js";
type TimedBeat = { id: string; narration?: string; time?: string };
const known = (time: string | undefined) => !!time && T.ORDER.includes(time);
const has = (text: string, words: readonly string[]) => words.some((word) => new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "u").test(text));
const cueOf = (text: string) => T.ORDER.find((time) => has(text, T.CUES[time]));
const forward = (from: string, to: string, nextDay: boolean) => nextDay || T.ORDER.indexOf(to) >= T.ORDER.indexOf(from) || from === "night";
export const motionStoryTimes = (beats: TimedBeat[]): Map<string, string> => {
  const out = new Map<string, string>();
  let now = "",
    since = 0;
  for (const beat of beats) {
    const text = (beat.narration || "").toLowerCase(),
      cue = cueOf(text);
    const was = now;
    if (!now) now = cue || (known(beat.time) ? beat.time! : T.ORDER[1]);
    else if (cue && cue !== now && forward(now, cue, has(text, T.NEXT_DAY))) now = cue;
    else if (!cue && T.PASSING[now] && ++since >= T.PASSING_BEATS) now = T.PASSING[now];
    if (now !== was || cue) since = 0;
    out.set(beat.id, now);
  }
  return out;
};
