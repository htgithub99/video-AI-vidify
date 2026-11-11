import _ from "lodash";
import { MOTION_GENRE_SPECS } from "./motionGenres/index.js";
import type { MotionGenreSpec } from "./motionGenres/types.js";
import { MOTION_GENRE_STAGE as STAGE } from "./motionGenreStage.js";
import { MOTION_GENRE_GRAMMAR as GRAMMAR } from "./motionGenreGrammar.js";
export const MOTION_VIDEO_GENRES = { POV: "pov", WITNESS: "witness", CHRONICLE: "chronicle", VERDICT: "verdict" } as const;
export type MotionVideoGenre = (typeof MOTION_VIDEO_GENRES)[keyof typeof MOTION_VIDEO_GENRES];
export const MOTION_VIDEO_GENRE_DEFAULT: MotionVideoGenre = MOTION_VIDEO_GENRES.POV;
export const MOTION_VIDEO_GENRE_ERROR = { CHANGED: "Thể loại đã đổi so với lần phân tích. Hãy bấm Phân tích lại trước khi viết kịch bản." } as const;
export const MOTION_VIDEO_GENRE_TEXT = {
  vi: {
    LABEL: "Thể loại",
    HINT: 'Định hướng cách viết, nhịp kể và âm thanh; kiểu hình chọn riêng. POV: viết lại mọi nguồn thành trải nghiệm ngôi thứ hai, thì hiện tại ("Bạn 19 tuổi…"), người xem là nhân vật chính, giữ đúng sự kiện nguồn. Người trong cuộc kể lại: kể lại mọi nguồn bằng lời một người trong cuộc xưng "tôi", câu ngắn, giọng quê quen tai như Kỳ truyện, giữ đúng sự kiện nguồn. Toàn bộ lịch sử trong N phút: mở bằng một cảnh cao trào về sau, rồi kể theo từng thời kỳ có tên chương, mốc ngày giờ và con số của nguồn, cuối cùng quay lại cảnh mở đầu. Câu hỏi lớn – cân từng giả thuyết: đặt một câu hỏi gây tranh cãi từ nguồn, xét lần lượt từng ứng viên bằng cùng tiêu chí và bằng chứng nguồn, chốt nhãn sau mỗi chương; hình ảnh theo nội dung thực tế rồi đưa ra phán quyết.',
    OPTIONS: { pov: "POV – Nhập vai (bạn là nhân vật)", witness: "Người trong cuộc kể lại (kiểu Kỳ truyện)", chronicle: "Toàn bộ lịch sử trong N phút (biên niên)", verdict: "Câu hỏi lớn – cân từng giả thuyết (phán quyết)" },
  },
  en: {
    LABEL: "Genre",
    HINT: "Steers writing, pacing and sound; visual style is selected separately. POV rewrites any source as a second-person, present-tense lived experience while preserving source facts. Witness recollection retells any source through one first-person witness in plain spoken folk-tale style, keeping the source events. Chronicle tells the whole arc of a subject in named eras after a flash-forward cold open, with exact dates, places and numbers from the source. Verdict poses one contested question from the source, assesses each candidate with the same criterion, source evidence and labels; pictures follow the source, then delivers a reasoned verdict.",
    OPTIONS: { pov: "POV – You are the character", witness: "Witness recollection (first-person)", chronicle: "Entire history in N minutes (chronicle)", verdict: "Big question – weigh every candidate (verdict)" },
  },
} as const;
export interface MotionVideoGenreStage {
  RULE: string;
  SOLO?: boolean;
}
const PROFILES = MOTION_GENRE_SPECS as Record<MotionVideoGenre, MotionGenreSpec>;
const GENRE_TEXT = {
  PACKAGING: "VIDEO GENRE (chosen by the user, follow it): ",
  DIRECTIVE: "VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer; the source content still decides the facts): ",
  CAST: " Any protagonist, narrator, companion or relative required by this genre is a cast member even when invented; this overrides any rule against inventing people.",
  STYLE: "WRITING STYLE FOR THIS VIDEO (highest priority for how every narration line sounds: person, tense, sentence length, word choice and devices; facts still come from the source and the plan): ",
  SAMPLE: " STYLE SAMPLE (self-made with invented content; imitate its person, rhythm, sentence length and devices, never its content, names or images): ",
  CHECK: " BEFORE ANSWERING, CHECK EVERY LINE: ",
} as const;
export const motionVideoGenre = (value: unknown): MotionVideoGenre => (_.includes(_.values(MOTION_VIDEO_GENRES), value) ? (value as MotionVideoGenre) : MOTION_VIDEO_GENRE_DEFAULT);
export const motionGenreSpec = (value: unknown): MotionGenreSpec => PROFILES[motionVideoGenre(value)];
export const motionVideoGenrePackaging = (value: unknown): string => GENRE_TEXT.PACKAGING + PROFILES[motionVideoGenre(value)].PACKAGING;
export const motionVideoGenreWritingProfile = (value: unknown): string => {
  const profile = PROFILES[motionVideoGenre(value)];
  return profile.PROFILE + " " + profile.TIMELINE + GENRE_TEXT.CHECK + profile.CHECK;
};
export const motionVideoGenreDirective = (value: unknown): string => {
  const profile = PROFILES[motionVideoGenre(value)];
  return (
    GENRE_TEXT.DIRECTIVE +
    profile.PROFILE +
    " " +
    profile.PLAN +
    STAGE.PLAN(
      Object.keys(profile.STAGES),
      Object.keys(profile.STAGES).filter((id) => profile.STAGES[id].SOLO),
    ) +
    STAGE.MOTIF.PLAN(profile.MOTIFS) +
    " " +
    profile.TIMELINE +
    " " +
    profile.SIGNATURE +
    GENRE_TEXT.CAST
  );
};
export const motionVideoGenreStages = (value: unknown): Record<string, MotionVideoGenreStage> => PROFILES[motionVideoGenre(value)].STAGES;
export const motionVideoGenreMerges = (value: unknown): boolean => PROFILES[motionVideoGenre(value)].MERGE;
export const motionVideoGenreStageRule = (value: unknown, stages?: string[]): string => {
  const known = PROFILES[motionVideoGenre(value)].STAGES;
  const ids = (stages || []).filter((id) => Object.hasOwn(known, id));
  const items = ids.map((id) => STAGE.ITEM(id, known[id].RULE));
  const head = ids.length > 1 && known[ids[0]].SOLO ? [ids[0]] : [];
  const tail = ids.length > 1 ? ids.slice(1).filter((id) => known[id].SOLO) : [];
  return items.length ? STAGE.RULE(items) + (head.length ? STAGE.SOLO_HEAD(head) : "") + (tail.length ? STAGE.SOLO_TAIL(tail) : "") : "";
};
export const motionVideoGenreEditorProfile = (value: unknown): string => {
  const profile = PROFILES[motionVideoGenre(value)];
  return profile.TIMELINE + GENRE_TEXT.CHECK + profile.CHECK;
};
export const motionVideoGenreStyleBrief = (value: unknown, samples?: Record<string, string>): string => {
  const profile = PROFILES[motionVideoGenre(value)];
  return GENRE_TEXT.STYLE + profile.STYLE_BRIEF + " " + profile.TIMELINE + GENRE_TEXT.SAMPLE + (samples?.[motionVideoGenre(value)] || profile.SAMPLE) + GENRE_TEXT.CHECK + profile.CHECK;
};
export const motionVideoGenreGrammar = (value: unknown, position: { first: boolean; last: boolean; hooks?: boolean }): string => {
  const profile = PROFILES[motionVideoGenre(value)];
  return [
    profile.GRAMMAR.rule,
    GRAMMAR.SHOTS(profile.GRAMMAR.shots, profile.GRAMMAR.visuals),
    profile.VOICE.frames.length ? GRAMMAR.FRAMES(profile.VOICE.frames) : "",
    position.hooks ? GRAMMAR.HOOKS : "",
    GRAMMAR.SAMPLE + profile.GRAMMAR.sample,
    position.first ? GRAMMAR.OPENING(profile.OPENING.kinds, profile.OPENING.maxBeats) : "",
    position.last ? GRAMMAR.CLOSING(profile.CLOSING.kinds, profile.CLOSING.maxBeats) : "",
  ].join("");
};
