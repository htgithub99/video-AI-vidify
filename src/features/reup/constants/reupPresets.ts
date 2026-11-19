import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupAiChoice, ReupJobSettings, ReupOutputKind, ReupPresetId, ReupPresetRules, ReupPresetStage, ReupSettings } from "../types/reup.js";
export interface ReupPresetDef {
  id: ReupPresetId;
  stage: ReupPresetStage;
  kind: ReupOutputKind;
  source: "video" | "folder";
  speech?: boolean;
  bilingual?: boolean;
  lengths: number[];
  rules: string;
  settings: Partial<ReupSettings>;
  editing: Partial<ReupPresetRules>;
}
const AI_DEFAULT: ReupAiChoice = { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiPro, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: true, allowFallback: true, multiRoom: true };
export const REUP_BASE_SETTINGS: ReupSettings = {
  language: "en",
  languageAlt: "vi",
  targetSeconds: 540,
  shortsCount: 3,
  aspect: "16:9",
  voiceChannel: "",
  voiceChannelAlt: "",
  music: "off",
  natural: "low",
  subtitles: false,
  logo: "off",
  logoCorner: "tr",
  stopScript: true,
  angle: "",
  sourceLink: "",
  brandName: "",
  hotline: "",
  cta: "",
  logoFile: "",
  quality: "auto",
  encoder: "auto",
  highlights: "few",
  fps: 30,
  visionAi: AI_DEFAULT,
  scriptAi: AI_DEFAULT,
};
const BASE_RULES: ReupPresetRules = {
  vertical: "blur",
  brandColor: "#ff3b30",
  wordsPerSecond: [1.9, 2.3],
  hook: true,
  teasers: true,
  pauseSeconds: 0.2,
  lufs: -16,
  titleOverlay: "hook",
  markEvery: 120,
  markMax: 6,
  markSeconds: 3.5,
  musicMode: "zones",
  narratedMin: 0.75,
  kenBurns: true,
  captions: false,
  beforeAfter: false,
  viewfinder: false,
  darkLevel: 22,
  blurLevel: 8,
  fillUnused: true,
  hookCutSeconds: 1.2,
  sheetInterval: 10,
  seoOptions: 3,
  thumbnail: true,
  voices: [],
  hooks: [],
  endings: [],
  shapes: ["byStep", "byProblem", "bySkill"],
  keepTalk: false,
};
const LONG_RULES = ["A hook of about 20-30 seconds over the strongest moments, opened the way the opening line below says.", "8 to 12 body sections in time order, each a run of moments from neighbouring scenes.", "A teaser roughly every 2 minutes: one line over a strong later moment that makes the viewer want the next part.", "No chapter cards."].join("\n");
const LONG = [480, 540, 600, 720, 900];
export const REUP_PRESETS: readonly ReupPresetDef[] = [
  { id: "A", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES, settings: { angle: 'Kênh nhìn mỗi việc qua câu hỏi "nếu mình ở đó thì làm sao": vì sao người ta chọn cách này, kỹ năng nào học được, chỗ nào dễ sai và cần an toàn. Nhận xét thật lòng về độ khéo và sự kiên nhẫn, không phóng đại.' }, editing: {} },
  {
    id: "B",
    stage: "ready",
    kind: "short",
    source: "video",
    lengths: [22, 28, 35, 45, 60],
    rules: "Each short is one idea. The first sentence is the hook. One fixed 2-line title on screen.",
    settings: { aspect: "9:16", targetSeconds: 28, angle: "Kênh chọn đúng một điều đáng nhớ nhất trong đoạn và nói thẳng vì sao nó thú vị hay hữu ích, kèm một nhận xét ngắn của kênh." },
    editing: { wordsPerSecond: [2.1, 2.6], lufs: -14, titleOverlay: "fixed", markEvery: 30, markMax: 1, markSeconds: 2.5, musicMode: "bed", narratedMin: 0.6, teasers: false, thumbnail: false, seoOptions: 2, hooks: ["question", "tease", "stakes", "contrast"], endings: ["question", "next"], shapes: [] },
  },
  {
    id: "C",
    stage: "ready",
    kind: "long",
    source: "video",
    bilingual: true,
    lengths: [90, 120, 180],
    rules: "A 2-minute test cut: a short hook, 3-4 body sections, a closing line. Both languages say the same thing; each reads naturally in its own language (not word for word).",
    settings: { targetSeconds: 120, angle: "Kênh giải thích ngắn vì sao từng bước được làm như vậy và người xem có thể áp dụng gì, giọng gần gũi như kể cho bạn bè." },
    editing: { wordsPerSecond: [2, 2.5], teasers: false, markEvery: 50, markMax: 3, endings: ["question", "lesson", "reflection"] },
  },
  {
    id: "D",
    stage: "ready",
    kind: "long",
    source: "folder",
    lengths: [120, 180, 240, 300],
    rules: "A dignified photo report in chapters (no hook tricks). Each part of the narration plays over the photo or clip it talks about. Name people and places only when the file names or the pictures show them.",
    settings: { targetSeconds: 180, language: "vi", natural: "off", angle: "Kênh kể lại với sự tôn trọng: bối cảnh của từng ảnh, điều ảnh cho thấy về con người và thời điểm đó, và vì sao câu chuyện này đáng được nhớ. Không suy diễn quá những gì ảnh thể hiện." },
    editing: { wordsPerSecond: [1.5, 2], titleOverlay: "off", markEvery: 45, markMax: 8, musicMode: "chapters", narratedMin: 0.7, captions: true, hook: false, teasers: false, sheetInterval: 5, voices: ["storyteller", "analyst", "expert"], endings: ["reflection", "lesson"], shapes: [] },
  },
  {
    id: "E",
    stage: "ready",
    kind: "short",
    source: "video",
    speech: true,
    lengths: [30, 38, 45, 60],
    rules: "Cut the speaker's own words into a fast vertical promo: keep only the strongest phrases, in an order that makes sense. Write a POV hook (2 short lines), up to 4 callouts tied to phrases, and one call to action.",
    settings: { aspect: "9:16", targetSeconds: 38, shortsCount: 1, natural: "keep", subtitles: true, highlights: "off" },
    editing: { vertical: "crop", lufs: -14, viewfinder: true, teasers: false, musicMode: "gaps", narratedMin: 0, shapes: [] },
  },
  {
    id: "F",
    stage: "ready",
    kind: "long",
    source: "video",
    lengths: LONG,
    rules: LONG_RULES + "\nRenovation before/after: tag scenes 'before' and 'after' only when the footage shows it.",
    settings: { angle: "Kênh so sánh trước và sau như một người từng sửa nhà: chỗ nào xuống cấp, vì sao chọn cách xử lý đó, vật liệu và công sức bỏ ra, và mẹo nhỏ người xem có thể dùng cho nhà mình." },
    editing: { beforeAfter: true, hooks: ["contrast", "result", "question", "stakes"], shapes: ["byChange", "byProblem", "byStep"] },
  },
  {
    id: "G",
    stage: "ready",
    kind: "long",
    source: "video",
    lengths: LONG,
    rules: LONG_RULES + "\nCabin / stone-house build: show progress stages clearly (ground, frame, walls, roof, interior).",
    settings: { angle: "Kênh theo từng giai đoạn dựng cabin như người mê làm nhà: vì sao móng, khung, tường, mái làm theo thứ tự đó, cái khéo của người thợ, và cảm giác sống chậm khi tự tay dựng chỗ ở." },
    editing: { shapes: ["byStep", "bySkill", "byProblem"] },
  },
  {
    id: "H",
    stage: "ready",
    kind: "long",
    source: "video",
    lengths: LONG,
    rules: LONG_RULES + "\nGarage build of a vehicle or machine: name parts only when visible, never invent specs. Keep the builder's own short spoken lines when they explain a step.",
    settings: { natural: "keep", angle: "Kênh nhìn như một người mê cơ khí: từng bộ phận được chế ra để giải quyết vấn đề gì, cái hay và chỗ còn rủi ro của cách làm, và bài học sửa chữa người xem mang đi được. Không bịa thông số." },
    editing: { shapes: ["byProblem", "bySkill", "byStep"], keepTalk: true },
  },
];
export const REUP_DEFAULT_PRESET: ReupPresetId = "A";
export const reupPreset = (id: unknown): ReupPresetDef => REUP_PRESETS.find((preset) => preset.id === id) || REUP_PRESETS[0];
export const reupPresetDefaults = (id: ReupPresetId): ReupSettings => ({ ...REUP_BASE_SETTINGS, ...reupPreset(id).settings });
export const reupPresetRules = (id: ReupPresetId): ReupPresetRules => ({ ...BASE_RULES, ...reupPreset(id).editing });
export const reupJobSettings = (id: ReupPresetId, settings: ReupSettings): ReupJobSettings => ({ ...reupPresetRules(id), ...settings });
