import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import type { MotionBeat } from "../types/motionVideo.js";
export const motionStoryEventLedger = (beats: MotionBeat[] = []): string => {
  const entries: string[] = [];
  let size = 0;
  for (const beat of [...beats].reverse()) {
    const facts = beat.narration.split(/(?<=[.!?…])\s+/u).filter((sentence) => S.EVENT_VERBS.test(sentence));
    const entry = JSON.stringify({ id: beat.id, place: beat.place, facts: facts.length ? facts : [beat.action || beat.scenePlan?.after || beat.narration], continuity: beat.scenePlan?.continuity });
    if (size + entry.length > S.FACT_BUDGET) continue;
    entries.unshift(entry);
    size += entry.length;
  }
  return entries.length ? S.FACT_POLICY + "\n" + entries.join("\n") : "";
};
