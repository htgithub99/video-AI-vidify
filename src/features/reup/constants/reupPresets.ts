import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { MOTION_MUSIC } from "../../../constants/motionMusic.js";
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
  musicMood: MOTION_MUSIC.AUTO,
  natural: "low",
  subtitles: false,
  logo: "off",
  logoCorner: "tr",
  stopScript: true,
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
  wordsMin: 750,
  wordsMax: 850,
  hook: true,
  teasers: true,
  endQuestion: true,
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
  musicMood: "tense",
};
const LONG_RULES = [
  "Hook about 25 seconds: open on the final result, then the 'before' state, then a run of fast cuts.",
  "8 to 10 body sections in time order, each tied to the source scenes it shows.",
  "A teaser line roughly every 2 minutes that makes the viewer want the next part.",
  "End with a question to the viewer. No chapter cards.",
].join("\n");
const LONG = [480, 540, 600, 720, 900];
export const REUP_PRESETS: readonly ReupPresetDef[] = [
  { id: "A", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES, settings: {}, editing: {} },
  { id: "B", stage: "ready", kind: "short", source: "video", lengths: [22, 28, 35, 45, 60], rules: "Each short is 22-30 seconds and 50-75 words. The first sentence is the hook. End on an open question or cliffhanger. One fixed 2-line title on screen.", settings: { aspect: "9:16", targetSeconds: 28 }, editing: { wordsMin: 50, wordsMax: 75, lufs: -14, titleOverlay: "fixed", teasers: false, endQuestion: false, thumbnail: false, seoOptions: 2 } },
  { id: "C", stage: "ready", kind: "long", source: "video", bilingual: true, lengths: [90, 120, 180], rules: "A 2-minute test cut: a short hook, 3-4 body sections, a closing line. Both languages say the same thing; each reads naturally in its own language (not word for word).", settings: { targetSeconds: 120 }, editing: { wordsMin: 250, wordsMax: 320, teasers: false, musicMood: "neutral" } },
  { id: "D", stage: "ready", kind: "long", source: "folder", lengths: [120, 180, 240, 300], rules: "A dignified photo report in chapters (chapter cards, no hook tricks). Each part of the narration plays over the photo or clip it talks about. Name people and places only when the file names or the pictures show them.", settings: { targetSeconds: 180, language: "vi", natural: "off" }, editing: { wordsMin: 300, wordsMax: 600, titleOverlay: "off", chapters: true, captions: true, hook: false, teasers: false, endQuestion: false, sheetInterval: 5, musicMood: "warm" } },
  { id: "E", stage: "ready", kind: "short", source: "video", speech: true, lengths: [30, 38, 45, 60], rules: "Cut the speaker's own words into a fast vertical promo: keep only the strongest phrases, in an order that makes sense. Write a POV hook (2 short lines), up to 4 callouts tied to phrases, and one call to action.", settings: { aspect: "9:16", targetSeconds: 38, shortsCount: 1, natural: "keep", subtitles: true }, editing: { vertical: "crop", lufs: -14, viewfinder: true, teasers: false, endQuestion: false, musicMood: "playful" } },
  { id: "F", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nRenovation before/after: the hook shows AFTER then BEFORE. Tag scenes 'before' and 'after' only when the footage shows it.", settings: {}, editing: { beforeAfter: true, musicMood: "epic" } },
  { id: "G", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nCabin / stone-house build: show progress stages clearly (ground, frame, walls, roof, interior).", settings: {}, editing: { musicMood: "warm" } },
  { id: "H", stage: "ready", kind: "long", source: "video", lengths: LONG, rules: LONG_RULES + "\nGarage build of a vehicle or machine: name parts only when visible, never invent specs. Keep the builder's own short spoken lines when they explain a step.", settings: { natural: "keep" }, editing: { musicMood: "epic" } },
];
export const REUP_DEFAULT_PRESET: ReupPresetId = "A";
export const reupPreset = (id: unknown): ReupPresetDef => REUP_PRESETS.find((preset) => preset.id === id) || REUP_PRESETS[0];
export const reupPresetDefaults = (id: ReupPresetId): ReupSettings => ({ ...REUP_BASE_SETTINGS, ...reupPreset(id).settings });
export const reupPresetRules = (id: ReupPresetId): ReupPresetRules => ({ ...BASE_RULES, ...reupPreset(id).editing });
/** The pipeline's settings: what the screen chose, the type's editing rules for the rest; "auto" music is the type's mood. */
export const reupJobSettings = (id: ReupPresetId, settings: ReupSettings): ReupJobSettings => {
  const { musicMood, ...rules } = reupPresetRules(id);
  return { ...rules, ...settings, musicMood: settings.musicMood === MOTION_MUSIC.AUTO ? musicMood : settings.musicMood };
};
