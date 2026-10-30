import _ from "lodash";
import { MOTION_POV_STORY as POV } from "./motionPovStory.js";
import { MOTION_WITNESS_STORY as WITNESS } from "./motionWitnessStory.js";
import { MOTION_CHRONICLE_STORY as CHRONICLE } from "./motionChronicleStory.js";
import { MOTION_VERDICT_STORY as VERDICT } from "./motionVerdictStory.js";
export const MOTION_VIDEO_GENRES = { POV: "pov", WITNESS: "witness", CHRONICLE: "chronicle", VERDICT: "verdict" } as const;
export type MotionVideoGenre = (typeof MOTION_VIDEO_GENRES)[keyof typeof MOTION_VIDEO_GENRES];
export const MOTION_VIDEO_GENRE_DEFAULT: MotionVideoGenre = MOTION_VIDEO_GENRES.POV;
export const MOTION_VIDEO_GENRE_TEXT = {
  vi: {
    LABEL: "Thể loại",
    HINT: "Định hướng cách viết, nhịp kể và âm thanh; kiểu hình chọn riêng. POV: viết lại mọi nguồn thành trải nghiệm ngôi thứ hai, thì hiện tại (\"Bạn 19 tuổi…\"), người xem là nhân vật chính, giữ đúng sự kiện nguồn. Người trong cuộc kể lại: kể lại mọi nguồn bằng lời một người trong cuộc xưng \"tôi\", câu ngắn, giọng quê quen tai như Kỳ truyện, giữ đúng sự kiện nguồn. Toàn bộ lịch sử trong N phút: mở bằng một cảnh cao trào về sau, rồi kể theo từng thời kỳ có tên chương, mốc ngày giờ và con số của nguồn, cuối cùng quay lại cảnh mở đầu. Câu hỏi lớn – cân từng giả thuyết: đặt một câu hỏi gây tranh cãi từ nguồn, cân lần lượt từng ứng viên bằng một hình ảnh ẩn dụ cố định (cán cân, con dấu…), chấm nhãn sau mỗi chương rồi đưa ra phán quyết.",
    OPTIONS: { pov: "POV – Nhập vai (bạn là nhân vật)", witness: "Người trong cuộc kể lại (kiểu Kỳ truyện)", chronicle: "Toàn bộ lịch sử trong N phút (biên niên)", verdict: "Câu hỏi lớn – cân từng giả thuyết (phán quyết)" },
  },
  en: {
    LABEL: "Genre",
    HINT: "Steers writing, pacing and sound; visual style is selected separately. POV rewrites any source as a second-person, present-tense lived experience while preserving source facts. Witness recollection retells any source through one first-person witness in plain spoken folk-tale style, keeping the source events. Chronicle tells the whole arc of a subject in named eras after a flash-forward cold open, with exact dates, places and numbers from the source. Verdict poses one contested question from the source, weighs each candidate with a fixed metaphor device and labels, then delivers a reasoned verdict.",
    OPTIONS: { pov: "POV – You are the character", witness: "Witness recollection (first-person)", chronicle: "Entire history in N minutes (chronicle)", verdict: "Big question – weigh every candidate (verdict)" },
  },
} as const;
const PROFILES: Record<MotionVideoGenre, { PROFILE: string; PACKAGING: string }> = { pov: POV, witness: WITNESS, chronicle: CHRONICLE, verdict: VERDICT };
const GENRE_TEXT = {
  PACKAGING: "VIDEO GENRE (chosen by the user, follow it): ",
  DIRECTIVE: "VIDEO GENRE (chosen by the user, authoritative over any genre or format you would infer; the source content still decides the facts): ",
} as const;
export const motionVideoGenre = (value: unknown): MotionVideoGenre => (_.includes(_.values(MOTION_VIDEO_GENRES), value) ? (value as MotionVideoGenre) : MOTION_VIDEO_GENRE_DEFAULT);
export const motionVideoGenrePackaging = (value: unknown): string => GENRE_TEXT.PACKAGING + PROFILES[motionVideoGenre(value)].PACKAGING;
export const motionVideoGenreWritingProfile = (value: unknown): string => PROFILES[motionVideoGenre(value)].PROFILE;
export const motionVideoGenreDirective = (value: unknown): string => GENRE_TEXT.DIRECTIVE + PROFILES[motionVideoGenre(value)].PROFILE;
