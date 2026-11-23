import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { REUP_HIGHLIGHT, REUP_PACE } from "./reupConfig.js";
import type { ReupAiChoice, ReupJobSettings, ReupPresetId, ReupPresetRules, ReupPresetStage, ReupSettings } from "../types/reup.js";
export interface ReupPresetDef {
  id: ReupPresetId;
  stage: ReupPresetStage;
  source: "video" | "folder";
  bilingual?: boolean;
  rules: string;
  settings: Partial<ReupSettings>;
  editing: Partial<ReupPresetRules>;
}
const AI_DEFAULT: ReupAiChoice = { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiPro, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: true, allowFallback: true, multiRoom: true };
export const REUP_BASE_SETTINGS: ReupSettings = {
  language: "en",
  languageAlt: "vi",
  targetSeconds: 540,
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
  logoFile: "",
  thumbStyles: [],
  quality: "auto",
  encoder: "auto",
  highlights: "few",
  fps: 30,
  visionAi: AI_DEFAULT,
  scriptAi: AI_DEFAULT,
};
const BASE_RULES: ReupPresetRules = {
  vertical: "framed",
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
export const REUP_LENGTHS: readonly number[] = [1, 2, 3, 5, 8, 9, 10, 12, 15, 20, 25, 30].map((m) => m * 60);
export const REUP_PRESETS: readonly ReupPresetDef[] = [
  { id: "A", stage: "ready", source: "video", rules: "", settings: { angle: 'Kênh nhìn mỗi việc qua câu hỏi "nếu mình ở đó thì làm sao": vì sao người ta chọn cách này, kỹ năng nào học được, chỗ nào dễ sai và cần an toàn. Nhận xét thật lòng về độ khéo và sự kiên nhẫn, không phóng đại.' }, editing: {} },
  {
    id: "C",
    stage: "ready",
    source: "video",
    bilingual: true,
    rules: "Both languages say the same thing; each reads naturally in its own language (not word for word).",
    settings: { targetSeconds: 120, angle: "Kênh giải thích ngắn vì sao từng bước được làm như vậy và người xem có thể áp dụng gì, giọng gần gũi như kể cho bạn bè." },
    editing: { wordsPerSecond: [2, 2.5], teasers: false, markEvery: 50, markMax: 3, endings: ["question", "lesson", "reflection"] },
  },
  {
    id: "D",
    stage: "ready",
    source: "folder",
    rules: "A dignified photo report in chapters (no hook tricks). Each part of the narration plays over the photo or clip it talks about. Name people and places only when the file names or the pictures show them.",
    settings: { targetSeconds: 180, language: "vi", natural: "off", angle: "Kênh kể lại với sự tôn trọng: bối cảnh của từng ảnh, điều ảnh cho thấy về con người và thời điểm đó, và vì sao câu chuyện này đáng được nhớ. Không suy diễn quá những gì ảnh thể hiện." },
    editing: { wordsPerSecond: [1.5, 2], titleOverlay: "off", markEvery: 45, markMax: 8, musicMode: "chapters", narratedMin: 0.7, captions: true, hook: false, teasers: false, sheetInterval: 5, voices: ["storyteller", "analyst", "expert"], endings: ["reflection", "lesson"], shapes: [] },
  },
  {
    id: "F",
    stage: "ready",
    source: "video",
    rules: "Renovation before/after: tag scenes 'before' and 'after' only when the footage shows it.",
    settings: { angle: "Kênh so sánh trước và sau như một người từng sửa nhà: chỗ nào xuống cấp, vì sao chọn cách xử lý đó, vật liệu và công sức bỏ ra, và mẹo nhỏ người xem có thể dùng cho nhà mình." },
    editing: { beforeAfter: true, hooks: ["contrast", "result", "question", "stakes"], shapes: ["byChange", "byProblem", "byStep"] },
  },
  {
    id: "G",
    stage: "ready",
    source: "video",
    rules: "Cabin / stone-house build: show progress stages clearly (ground, frame, walls, roof, interior).",
    settings: { angle: "Kênh theo từng giai đoạn dựng cabin như người mê làm nhà: vì sao móng, khung, tường, mái làm theo thứ tự đó, cái khéo của người thợ, và cảm giác sống chậm khi tự tay dựng chỗ ở." },
    editing: { shapes: ["byStep", "bySkill", "byProblem"] },
  },
  {
    id: "H",
    stage: "ready",
    source: "video",
    rules: "Garage build of a vehicle or machine: name parts only when visible, never invent specs. Keep the builder's own short spoken lines when they explain a step.",
    settings: { natural: "keep", angle: "Kênh nhìn như một người mê cơ khí: từng bộ phận được chế ra để giải quyết vấn đề gì, cái hay và chỗ còn rủi ro của cách làm, và bài học sửa chữa người xem mang đi được. Không bịa thông số." },
    editing: { shapes: ["byProblem", "bySkill", "byStep"], keepTalk: true },
  },
];
export const REUP_DEFAULT_PRESET: ReupPresetId = "A";
export const reupPreset = (id: unknown): ReupPresetDef => REUP_PRESETS.find((preset) => preset.id === id) || REUP_PRESETS[0];
export const reupPresetDefaults = (id: unknown): ReupSettings => ({ ...REUP_BASE_SETTINGS, ...reupPreset(id).settings });
export const reupPresetRules = (id: unknown): ReupPresetRules => ({ ...BASE_RULES, ...reupPreset(id).editing });
export const reupLegacyPreset = (id: unknown): boolean => !REUP_PRESETS.some((preset) => preset.id === id);
export const reupQuick = (seconds: number): boolean => seconds < REUP_PACE.QUICK;
const lengthRules = (seconds: number): Partial<ReupPresetRules> => (reupQuick(seconds) ? { teasers: false, markEvery: REUP_HIGHLIGHT.SHORT.EVERY, markMax: REUP_HIGHLIGHT.SHORT.MAX, markSeconds: REUP_HIGHLIGHT.SHORT.SECONDS } : {});
export const reupJobSettings = (id: ReupPresetId, settings: ReupSettings): ReupJobSettings => ({ ...reupPresetRules(id), ...lengthRules(settings.targetSeconds), ...settings });
