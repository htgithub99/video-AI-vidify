import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupAiChoice, ReupJobSettings, ReupOutputKind, ReupPresetId, ReupPresetRules, ReupPresetStage, ReupSettings } from "../types/reup.js";
export interface ReupPresetDef {
  id: ReupPresetId;
  stage: ReupPresetStage;
  kind: ReupOutputKind;
  /** What the source is: one video, or a folder of photos and short clips. */
  source: "video" | "folder";
  /** The source's own speech is the narration (no voice-over). */
  speech?: boolean;
  /** Two narrations, one per language, over the same pictures. */
  bilingual?: boolean;
  /** Lengths offered on screen (seconds). */
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
  quality: "high",
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
  chapters: false,
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
};
const LONG_RULES = [
  "A hook of about 20-30 seconds over the strongest moments, opened the way the opening line below says.",
  "8 to 12 body sections in time order, each a run of moments from neighbouring scenes.",
  "A teaser roughly every 2 minutes: one line over a strong later moment that makes the viewer want the next part.",
  "No chapter cards.",
].join("\n");
const LONG = [480, 540, 600, 720, 900];
export const REUP_PRESETS: readonly ReupPresetDef[] = [
  { id: "A", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES, settings: {}, editing: {} },
  { id: "B", stage: "ready", kind: "short", source: "video", lengths: [22, 28, 35, 45, 60], rules: "Each short is one idea. The first sentence is the hook. One fixed 2-line title on screen.", settings: { aspect: "9:16", targetSeconds: 28 }, editing: { wordsPerSecond: [2.1, 2.6], lufs: -14, titleOverlay: "fixed", teasers: false, thumbnail: false, seoOptions: 2, hooks: ["question", "tease", "stakes", "contrast"], endings: ["question", "next"] } },
  { id: "C", stage: "ready", kind: "long", source: "video", bilingual: true, lengths: [90, 120, 180], rules: "A 2-minute test cut: a short hook, 3-4 body sections, a closing line. Both languages say the same thing; each reads naturally in its own language (not word for word).", settings: { targetSeconds: 120 }, editing: { wordsPerSecond: [2, 2.5], teasers: false, endings: ["question", "lesson", "reflection"] } },
  { id: "D", stage: "ready", kind: "long", source: "folder", lengths: [120, 180, 240, 300], rules: "A dignified photo report in chapters (chapter cards, no hook tricks). Each part of the narration plays over the photo or clip it talks about. Name people and places only when the file names or the pictures show them.", settings: { targetSeconds: 180, language: "vi", natural: "off" }, editing: { wordsPerSecond: [1.5, 2], titleOverlay: "off", chapters: true, captions: true, hook: false, teasers: false, sheetInterval: 5, voices: ["storyteller", "analyst", "expert"], endings: ["reflection", "lesson"] } },
  { id: "E", stage: "ready", kind: "short", source: "video", speech: true, lengths: [30, 38, 45, 60], rules: "Cut the speaker's own words into a fast vertical promo: keep only the strongest phrases, in an order that makes sense. Write a POV hook (2 short lines), up to 4 callouts tied to phrases, and one call to action.", settings: { aspect: "9:16", targetSeconds: 38, shortsCount: 1, natural: "keep", subtitles: true }, editing: { vertical: "crop", lufs: -14, viewfinder: true, teasers: false } },
  { id: "F", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nRenovation before/after: tag scenes 'before' and 'after' only when the footage shows it.", settings: {}, editing: { beforeAfter: true, hooks: ["contrast", "result", "question", "stakes"] } },
  { id: "G", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nCabin / stone-house build: show progress stages clearly (ground, frame, walls, roof, interior).", settings: {}, editing: {} },
  { id: "H", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nGarage build of a vehicle or machine: name parts only when visible, never invent specs. Keep the builder's own short spoken lines when they explain a step.", settings: { natural: "keep" }, editing: {} },
];
export const REUP_DEFAULT_PRESET: ReupPresetId = "A";
export const reupPreset = (id: unknown): ReupPresetDef => REUP_PRESETS.find((preset) => preset.id === id) || REUP_PRESETS[0];
export const reupPresetDefaults = (id: ReupPresetId): ReupSettings => ({ ...REUP_BASE_SETTINGS, ...reupPreset(id).settings });
export const reupPresetRules = (id: ReupPresetId): ReupPresetRules => ({ ...BASE_RULES, ...reupPreset(id).editing });
/** The pipeline's settings: what the screen chose, the type's editing rules for the rest. */
export const reupJobSettings = (id: ReupPresetId, settings: ReupSettings): ReupJobSettings => ({ ...reupPresetRules(id), ...settings });
