import type { MotionLanguageProfile } from "./types.js";
import { EN_GENRE_SAMPLES } from "./genreSamples.en.js";
export const JA_LANGUAGE: MotionLanguageProfile = {
  code: "ja",
  genreSamples: EN_GENRE_SAMPLES,
  label: { vi: "Tiếng Nhật", en: "Japanese" },
  promptName: "Japanese",
  unit: { promptName: "Japanese characters (kana and kanji, about one mora each)" },
  rate: { narration: 6.5, dialogue: 7 },
  numbers: "keep",
  markers: { viewer: /(?:あなた|君|きみ|皆さん|みなさん)/u, perception: /(?:私|僕|俺|わたし)は.{0,14}?(?:見た|見ました|聞いた|聞きました|知っていた|知った|知りました)/u, outfit: /(?:着替え|着た|脱い|変装|かぶっ|羽織)/u },
  styleGuide: [
    "JAPANESE NARRATION: write natural spoken Japanese for a narrator reading aloud. Choose one register (です・ます for documentary and verdict, plain form だ・である or the narrator's own casual voice for lived stories) and keep it for the whole video. Use kanji with normal readings, no furigana, no romaji. Write numbers, dates and years with Arabic digits plus counters (1944年6月6日, 5000人); the speech engine reads them. Keep sentences short and spoken; end each sentence with 。 and questions with ？. Dialogue goes in 「」. Never mix in Vietnamese or English words except proper names written in katakana.",
  ],
  reviewGuide: "When editing Japanese, a sentence longer than one breath, an unstable politeness register, a literal translation of Vietnamese idiom or an unreadable kanji compound is also an error to fix.",
  subtitle: { maxChars: 28, fontFamily: "Noto Sans JP, Yu Gothic, Meiryo, Hiragino Sans, sans-serif" },
  genreMaxUnits: { witness: 24, pov: 32, chronicle: 36, verdict: 38 },
  asrCode: "ja",
  partTitle: (title: string, index: number, count: number): string => `${title}（第${index}話／全${count}話）`,
  aliases: ["japanese", "tiếng nhật", "日本語", "ja-jp"],
};
