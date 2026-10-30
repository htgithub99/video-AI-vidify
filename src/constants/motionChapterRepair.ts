import { stringifyJson } from "../lib/jsonStringify.js";
import { MOTION_QA as Q } from "./motionQa.js";
export const MOTION_CHAPTER_REPAIR = {
  ATTEMPTS: 3,
  DURATION_REVISION: "motion-duration-counted-speech-20261028",
  SPEECH_REVISION: "motion-chapter-speech-alignment-20261030",
  SPEECH_RECOVERY_LOG: (chapter: string): string => `Chương ${chapter}: phục hồi lượt sửa phân vai còn lỗi; giữ nguyên lời dẫn và các phần đã đạt.`,
  SPEECH_REPAIRED_LOG: (chapter: string, count: number): string => `Chương ${chapter}: đã tách lời thoại bị chép lặp ở ${count} nhịp bằng code, giữ nguyên nội dung và người nói.`,
  DURATION_REQUEST: (targets: unknown, context: unknown): string =>
    `Edit the supplied narration only. Return JSON {"beats":[{"id":"exact provided id","utterances":[{"speaker":"one of this beat's supplied speakers","words":["one","whitespace-free","spoken","unit"]}]}]}. For Vietnamese, split EVERY syllable into a separate array item, e.g. ["Người","dân","sống","trong","sợ","hãi."] has length 6. The sum of words.length in each beat should be about its targetUnits; count the array items before returning. Code joins these words into narration and utterance text. Return every listed ID once. Preserve language, the central event, historical accuracy, hypothetical disclaimers and the ending. Secondary details may be omitted to fit targetUnits. No scene descriptions or new events.\nTARGETS: ${stringifyJson(targets)}\nCONTEXT: ${stringifyJson(context)}`,
  DURATION_RULE: (current: number, target: number): string =>
    `${target < current ? "SHORTEN" : "EXPAND"} the existing narration from ${current} to about ${Math.round(target)} speech units TOTAL across the entire chapter, including unchanged beats. One unit is one whitespace-separated spoken word or Vietnamese syllable; count narration once, not its duplicate utterances. Vietnamese example: "Người dân sống trong sợ hãi" has 6 units. Đếm từng tiếng theo khoảng trắng: targetUnits=20 nghĩa là khoảng 20 tiếng trong narration. Each pending targetUnits is that beat's approximate narration length in these same units, not sentences or extra units to add. ${target < current ? "Rewrite each pending narration compactly toward its targetUnits. Retain the main event and its consequence; omit secondary detail, incidental staging, redundant descriptions and repeated explanations. Do not add new detail or expand scene descriptions into narration. Verify the whitespace count before returning." : "Use meaningful existing events without repetition or invented facts."} Keep beat IDs, order, essential causes, facts and ending. Return only the pending beat patches, with utterances reproducing each shortened/expanded narration exactly.`,
  MIN_RATIO: Q.CHAPTER_MIN_RATIO,
  MAX_RATIO: Q.CHAPTER_MAX_RATIO,
  SPACE: /\s+/u,
  WORDS: /[\p{L}\p{N}\p{M}]+/gu,
  FAILED: (chapter: string, reason: string): string => `Chương ${chapter}: ${reason}. Đã giữ bản nháp và các chương đạt để tiếp tục.`,
  ID: (chapter: string, index: number): string => `${chapter}:beat:${index + 1}`,
  FIELDS: ["narration", "utterances", "visual", "place", "cast", "scenePlan", "action", "time", "weather", "shot", "sceneMood", "data", "hud"],
} as const;
