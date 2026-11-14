import { MOTION_ECHO as E } from "../constants/motionEcho.js";
import { motionWritingQuantities } from "./motionWritingNumbers.js";
import type { MotionBeat } from "../types/motionVideo.js";
type Finding = { id: string; issue: string };
const stem = (word: string): string => word.slice(0, E.STEM);
export const motionGestureEchoFindings = (beats: MotionBeat[]): Finding[] => {
  const seen = new Map<string, number[]>();
  const findings: Finding[] = [];
  beats.forEach((beat, index) => {
    const words = (beat.narration?.toLowerCase().match(E.WORD) || []) as string[];
    const keys = new Map<string, [string, string]>();
    words.forEach((word, at) => {
      const gesture = E.GESTURES.find((item) => item.re.test(word));
      if (!gesture) return;
      for (const object of words.slice(at + 1, at + 1 + E.OBJECT_WINDOW)) {
        if (E.STOP.test(object) || object.length < E.MIN_OBJECT || E.GESTURES.some((item) => item.re.test(object))) continue;
        keys.set(gesture.key + E.SEP + stem(object), [gesture.key, object]);
        break;
      }
    });
    let flagged = false;
    for (const [key, [gesture, object]] of keys) {
      const earlier = seen.get(key) || [];
      if (!flagged && findings.length < E.MAX && (earlier.length >= E.GLOBAL_MAX || earlier.some((at) => index - at <= E.NEAR_BEATS))) {
        findings.push({ id: beat.id, issue: E.GESTURE_ISSUE(gesture, object, earlier.length) });
        flagged = true;
      }
      seen.set(key, [...earlier, index]);
    }
  });
  return findings;
};
export const motionNumberEchoFindings = (beats: MotionBeat[]): Finding[] => {
  const seen = new Map<number, number>();
  const findings: Finding[] = [];
  beats.forEach((beat, index) => {
    let flagged = false;
    for (const quantity of motionWritingQuantities(beat.narration || E.EMPTY)) {
      if (quantity.value < E.NUMBER_MIN || (E.YEAR.test(quantity.raw) && quantity.value >= E.YEAR_MIN && quantity.value <= E.YEAR_MAX)) continue;
      const earlier = seen.get(quantity.value);
      if (!flagged && earlier !== undefined && earlier !== index && index - earlier <= E.NUMBER_NEAR_BEATS && findings.length < E.MAX) {
        findings.push({ id: beat.id, issue: E.NUMBER_ISSUE(quantity.raw) });
        flagged = true;
      }
      if (earlier === undefined) seen.set(quantity.value, index);
    }
  });
  return findings;
};
